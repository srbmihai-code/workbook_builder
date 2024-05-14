from flask import Flask, request, jsonify, send_file, after_this_request
from image_parser import parse_directory   
from create_html_json import create_html_json
from shutil import rmtree, make_archive, copytree, copyfile
from flask_sqlalchemy import SQLAlchemy
from pdf2image import convert_from_path
from werkzeug.utils import secure_filename
from markupsafe import escape
from dotenv import load_dotenv
from datetime import datetime
import filetype
import hashlib
import uuid
import os
import json
import logging

logging.basicConfig(filename='app.log', encoding='utf-8', level=logging.DEBUG)
logger = logging.getLogger(__name__)

load_dotenv()

UPLOAD_FOLDER = './workbooks'
SECRET_KEY = os.getenv("SECRET_KEY")

app = Flask(__name__)
app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///workbooks.sqlite3"
app.config['MAX_CONTENT_LENGTH'] = 50 * 1024 * 1024


db = SQLAlchemy(app)

class workbooks(db.Model):
    _id = db.Column('id', db.Integer, primary_key=True)
    hash = db.Column(db.String(100))
    name = db.Column(db.String(100))
    author = db.Column(db.String(100))
    password = db.Column(db.String(100), nullable=True)
    def __init__(self, hash, name, author, password):
        self.hash = hash
        self.name = name
        self.author = author
        self.password = password

class users(db.Model):
    _id = db.Column('id', db.Integer, primary_key=True)
    name = db.Column(db.String(100))
    author = db.Column(db.String(100))
    password = db.Column(db.String(100), nullable=True)
    approved = db.Column(db.Boolean, default=False, nullable=False)
    def __init__(self, name, author, password, approved=False):
        self.name = name
        self.author = author
        self.password = password
        self.approved = approved

def log_all():
    data = workbooks.query.all()
    for workbook in data:
        print(workbook.hash, workbook.name, workbook.author, workbook.password)

def log_all_users():
    data = users.query.all()
    for user in data:
        print(user.name, user.author, user.password, user.approved)

def is_pdf(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ['pdf']
def send_message(message):
    return jsonify({'message':message})

@app.route('/add_workbook', methods=['POST'])
def add_workbook():
    try:
        form = request.form
        files = request.files
        print(form, files)
        user_password = hashlib.sha512(form['user_password'].encode('utf-8')).hexdigest()
        user = users.query.filter_by(name=escape(form['username']), password=user_password).first()
        print(user_password, escape(form['username']))
        log_all_users()
        if user is None:
            return 'account not found', 400
        if form.get('password') is None and user.approved==False:
            return 'not approved', 400
        if workbooks.query.filter_by(name=escape(form['name']), author=escape(form['username'])).first() is not None:
            return 'already', 400
        print('d')
        if form.get('last_ommit') is None:
            last_ommit = False
        else:
            last_ommit = True
        if form.get('first_ommit') is None:
            first_ommit = False
        else:
            first_ommit = True
        workbook_hash = uuid.uuid4().hex
        os.mkdir(f'./workbooks/{workbook_hash}')
        workbook_data = {
            'name': escape(form['name']),
            'author': escape(form['username']),
            'hash': workbook_hash
        }
        workbook_path = f'./workbooks/{workbook_hash}'

        workbook_icon = files.get('workbook_icon')
            
        if workbook_icon is not None:
            print(f'{workbook_path}/icon.png')
            workbook_icon.save(f'{workbook_path}/icon.png')
            workbook_icon.save(f'./icons/{workbook_hash}.png')
        chapter_names = filter(lambda x: 'nume' in x, form)
        chapter_names = [escape(x) for x in chapter_names]
        for chapter_name in chapter_names:
            chapter_number = chapter_name.removeprefix('nume')
            os.mkdir(f'{workbook_path}/{chapter_number}')
            chapter_icon = files.get(f'icon{chapter_number}')
            if chapter_icon is not None:
                chapter_icon.save(f'{workbook_path}/{chapter_number}/icon.png')
            os.mkdir(f'{workbook_path}/{chapter_number}/sub')
            os.mkdir(f'{workbook_path}/{chapter_number}/rez')
            os.mkdir(f'{workbook_path}/{chapter_number}/sub_temp')
            os.mkdir(f'{workbook_path}/{chapter_number}/rez_temp')
            chapter_files = files.getlist(f'form_exercitii_{chapter_number}')
            if is_pdf(secure_filename(chapter_files[0].filename)):
                chapter_files[0].save(f'{workbook_path}/{chapter_number}/sub_temp/sub.pdf') 
                images = convert_from_path(f'{workbook_path}/{chapter_number}/sub_temp/sub.pdf')
                for i in range(len(images)):
                    images[i].save(f'{workbook_path}/{chapter_number}/sub_temp/{i}.png')
                os.remove(f'{workbook_path}/{chapter_number}/sub_temp/sub.pdf')
            else:
                for i, image in enumerate(chapter_files):
                    image.save(f'{workbook_path}/{chapter_number}/sub_temp/{i}.png')

            chapter_files = files.getlist(f'form_rezolvari_{chapter_number}')

            if is_pdf(secure_filename(chapter_files[0].filename)):
                chapter_files[0].save(f'{workbook_path}/{chapter_number}/rez_temp/rez.pdf') 
                images = convert_from_path(f'{workbook_path}/{chapter_number}/rez_temp/rez.pdf')
                for i in range(len(images)):
                    images[i].save(f'{workbook_path}/{chapter_number}/rez_temp/{i}.png')
                os.remove(f'{workbook_path}/{chapter_number}/rez_temp/rez.pdf')
            else:
                for i, image in enumerate(chapter_files):  
                    image.save(f'{workbook_path}/{chapter_number}/rez_temp/{i}.png')
        

            parse_directory(f'{workbook_path}/{chapter_number}/sub_temp',
                            f'{workbook_path}/{chapter_number}/sub',
                            first_ommit,
                            last_ommit)
            parse_directory(f'{workbook_path}/{chapter_number}/rez_temp',
                            f'{workbook_path}/{chapter_number}/rez',
                            first_ommit,
                            last_ommit)
            rmtree(f'{workbook_path}/{chapter_number}/sub_temp')
            rmtree(f'{workbook_path}/{chapter_number}/rez_temp')
            create_html_json(f'{workbook_path}/{chapter_number}', form[chapter_name]) #?
        with open(f'{workbook_path}/data.json', "w") as outfile:
            json.dump(workbook_data, outfile)
        make_archive(f'{workbook_path}', 'zip', f'{workbook_path}')
        if form.get('password') is not None:
            password = hashlib.sha512(form['password'].encode('utf-8')).hexdigest()
            workbook = workbooks(workbook_hash, workbook_data['name'],workbook_data['author'], password)
        else:
            workbook = workbooks(workbook_hash, workbook_data['name'],workbook_data['author'], None)
        db.session.add(workbook)
        db.session.commit()
        response = send_file(f'{workbook_path}.zip', as_attachment=True, download_name=f'{workbook_hash}.zip')
        response.headers["X-Filename"] = f'{workbook_hash}.zip'
        return response
    except Exception as e:
        print(e)

@app.route('/get_workbook', methods=['POST'])
def get_workbook():
    form = request.form
    author_name = users.query.filter_by(author=form['author']).author
    if form.get('password') is not None:
        password = hashlib.sha512(form['password'].encode('utf-8')).hexdigest()
        workbook = workbooks.query.filter_by(name=escape(form['name']), author=escape(author_name), password=password).first()
    else:
        workbook = workbooks.query.filter_by(name=escape(form['name']), author=escape(author_name)).first()
    if workbook is not None:
        response = send_file(f'workbooks/{workbook.hash}.zip', as_attachment=True, download_name=f'{workbook.hash}.zip')
        response.headers["X-Filename"] = f'{workbook.hash}.zip'
        return response
    else:
        return 'not found', 400

@app.route('/get_public_workbooks', methods=['POST'])
def get_public_workbooks():
    log_all_users()
    public_workbooks = workbooks.query.filter_by(password=None).all()
    public_workbooks_data = {}
    for public_workbook in public_workbooks:
        author_name = users.query.filter_by(name=public_workbook.author).first().author
        public_workbooks_data[public_workbook.hash] = {'hash': public_workbook.hash, 'name': public_workbook.name, 'author': author_name}
    if os.path.exists('./temp_public_workbooks_data'):
        rmtree('./temp_public_workbooks_data')
    if os.path.exists('./temp_public_workbooks_data.zip'):
        os.remove('./temp_public_workbooks_data.zip')
    copytree('icons', 'temp_public_workbooks_data')
    with open('temp_public_workbooks_data/public_workbooks_data.json', 'w') as f:
        json.dump(public_workbooks_data, f)
    make_archive('temp_public_workbooks_data', 'zip', 'temp_public_workbooks_data')
    response = send_file('temp_public_workbooks_data.zip', as_attachment=True, download_name=f'temp_public_workbooks_data.zip')
    return response

@app.route('/accounts', methods=['POST'])
def accounts():
    log_all()
    log_all_users()
    form = request.form
    if form.get('author') is None:
        password = hashlib.sha512(form['password'].encode('utf-8')).hexdigest()
        if users.query.filter_by(name=escape(form['name']), password=password).first() is None:
            return 'incorrect', 400
        else:
            workbooks_belonging = workbooks.query.filter_by(author=form['name']).all()
            workbooks_hashes = map(lambda workbook: workbook.hash, workbooks_belonging)
            if os.path.exists('./temp_workbooks_to_send'):
                rmtree('./temp_workbooks_to_send')
            if os.path.exists('./temp_workbooks_to_send.zip'):
                os.remove('./temp_workbooks_to_send.zip')
            os.mkdir('./temp_workbooks_to_send')
            for workbook_hash in workbooks_hashes:
                copyfile(f'./workbooks/{workbook_hash}.zip', f'./temp_workbooks_to_send/{workbook_hash}.zip')
            make_archive('./temp_workbooks_to_send', 'zip', './temp_workbooks_to_send')
            response = send_file('./temp_workbooks_to_send.zip', as_attachment=True, download_name=f'temp_workbooks_to_send.zip')
            return response
    else:
        if users.query.filter_by(name=escape(form['name'])).first() is not None:
            return 'already', 400
        password = hashlib.sha512(form['password'].encode('utf-8')).hexdigest()
        new_user = users(form['name'], form['author'], password)
        db.session.add(new_user)
        db.session.commit()
        return '', 200

@app.route('/delete_workbook', methods=['POST'])
def delete_workbook():
    form = request.form
    if workbooks.query.filter_by(hash=form['hash']).first() is None:
        return 'incorrect', 400
    password = hashlib.sha512(form['password'].encode('utf-8')).hexdigest()
    if users.query.filter_by(name=escape(form['name']), password=password).first() is None or workbooks.query.filter_by(hash=form['hash']).first().author != form['name']:
        return 'incorrect', 400
    db.session.delete(workbooks.query.filter_by(hash=form['hash']).first())
    db.session.commit()
    return '', 200

@app.route('/approve', methods=['POST'])
def approve():
    data = request.json
    SECRET_KEY_SENT = data.get('SECRET_KEY')
    username = data.get('username')
    global SECRET_KEY
    log_all_users()
    try:
        if SECRET_KEY_SENT != SECRET_KEY or (users.query.filter_by(name=username).first() is None):
            return '', 400
    except Exception as e:
        print('bbb')
        logger.error('%s', e)
    users.query.filter_by(name=username).first().approved = True
    db.session.commit()
    return '', 200

@app.after_request
def after_request(response):
    now = datetime.now()
    timestamp = now.strftime('[%Y-%b-%d %H:%M]')
    if response.status == 400:
        logger.error('%s %s %s %s %s %s - %s', timestamp, request.remote_addr, request.method, request.scheme, request.full_path, response.status, response.get_data(as_text=True))
        print(response.get_data(as_text=True))
    else:
        logger.debug('%s %s %s %s %s %s', timestamp, request.remote_addr, request.method, request.scheme, request.full_path, response.status)
    return response

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    app.run(host='0.0.0.0', port=8080)
