const path = require('path');
const fs = require('fs')
const AdmZip = require('adm-zip');
const { get } = require('http');
const { create } = require('domain');

const user_dir = fs.readFileSync(path.join(__dirname, '..', '..', 'user_dir.txt'), 'utf8');
const server_url = fs.readFileSync(path.join(__dirname, '..', '..', 'server_url.txt'), 'utf8');

function get_subdirs(directoryPath) {
    try {
        const files = fs.readdirSync(directoryPath, { withFileTypes: true });
        let subdirectories = files
            .filter(file => file.isDirectory())
            .map(file => path.join(directoryPath, file.name));
        return subdirectories;
    } catch (err) {
        console.error('Error reading directory:', err);
    }
}
function student() {
    fs.writeFileSync(path.join(user_dir, 'settings.json'), JSON.stringify({
        "user_type": "student"
    }))
    location.href = path.join(__dirname, '..', 'front_page', 'index.html')
}
function teacher() {
    const body = document.body
    if (document.getElementById('form') === null)   
        body.insertAdjacentHTML('beforeend', `
    <div id="ask_buttons"><button onclick="create_form_already()">Am deja cont</button><button onclick="create_form_first()">Nu am cont</button></div>
    `)
}

function create_form_first() {
    const body = document.body
    if (document.getElementById('form') !== null)   
        document.getElementById('form').remove()
    if (document.querySelector('h2') !== null)   
        document.querySelector('h2').remove()
    body.insertAdjacentHTML('beforeend', `
    <h2>Introduceți datele pentru creerea unui cont</h2>
    <form id="form" onsubmit="return false">
        <label for="form_name">Nume de utilizator:</label>
        <input type="text" name="name" id="form_name" required><br>
        <label for="form_author">Nume (acesta va apărea ca numele de autor):</label>
        <input type="text" name="author" id="form_author" required><br>
        <label for="form_password">Parola:</label>
        <input type="password" name="password" id="form_password" required><br>
        <button type="submit"  onclick="submit_form_create()">Creeare cont</button>
    </form>
    `)
}

function create_form_already() {
    const body = document.body
    if (document.getElementById('form') !== null)   
        document.getElementById('form').remove()
    if (document.querySelector('h2') !== null)   
        document.querySelector('h2').remove()
    body.insertAdjacentHTML('beforeend', `
    <h2>Introduceti datele pentru autentificare</h2>
    <form id="form" onsubmit="return false">
        <label for="form_name">Nume de utilizator:</label>
        <input type="text" name="name" id="form_name" required><br>
        <label for="form_password">Parola:</label>
        <input type="password" name="password" id="form_password" required><br>
        <button type="submit"  onclick="submit_form_auth()">Autentificare</button>
    </form>
    `)
}

function submit_form_auth() {
    const form = document.getElementById('form')
    if (!form.reportValidity()) {
        return;
    }
    let form_data = new FormData(form);

    fetch(`${server_url}/accounts`, {
        method: 'POST',
        body: form_data
    })
    .then(response => {
        if (!response.ok) {
            response.text().then(errorMessage => {
                if (errorMessage=='incorrect') {
                    form.insertAdjacentHTML('beforeend', `<p class="error">Numele sau parola nu sunt corecte</p>`)
                    server_error = true;
                }
            });
            throw new Error('Numele sau parola nu sunt corecte')
        }
        filename = response.headers.get('X-Filename');
        return response.arrayBuffer();
    })
    .then(buffer => {
        const zipPath = path.join(__dirname, `${filename}`);
        fs.writeFileSync(zipPath, Buffer.from(buffer));
        const folder_name = 'created_workbooks'
        const extractDir = path.join(__dirname, '..', '..', `${folder_name}`);
        if (fs.existsSync(extractDir)) {
            fs.rmSync(extractDir, { recursive: true, force: true });
        }
        fs.mkdirSync(extractDir);
        let zip = new AdmZip(zipPath);
        zip.extractAllTo(extractDir, true);
        fs.unlinkSync(zipPath);
        const created_workbooks = fs.readdirSync(extractDir);

        for (const created_workbook of created_workbooks) {
            zip = new AdmZip(path.join(__dirname, '..', '..', `${folder_name}`, created_workbook));
            zip.extractAllTo(path.join(__dirname, '..', '..', `${folder_name}`, created_workbook.replace('.zip', '')), true);
            fs.unlinkSync(path.join(__dirname, '..', '..', `${folder_name}`, created_workbook));
        }
        fs.writeFileSync(path.join(user_dir, 'credentials.json'), JSON.stringify({
            "username": form_data.get("name"),
            "password": form_data.get("password")
        }))
        fs.writeFileSync(path.join(user_dir, 'settings.json'), JSON.stringify({
            "user_type": "teacher"
        }))
        location.href = '../front_page/index.html'
    })
}

function submit_form_create() {
    const form = document.getElementById('form')
    if (!form.reportValidity()) {
        return;
    }
    let form_data = new FormData(form);

    fetch(`${server_url}/accounts`, {
        method: 'POST',
        body: form_data
    })
    .then(response => {
        if (!response.ok) {
            response.text().then(errorMessage => {
                if (errorMessage=='already') {
                    form.insertAdjacentHTML('beforeend', `<p class="error">Acest nume de utilizator s-a luat deja</p>`)
                    server_error = true;
                }
            });
            throw new Error('Acest nume de utilizator s-a luat deja')
        }
        fs.writeFileSync(path.join(user_dir, 'credentials.json'), JSON.stringify({
            "name": form_data.get("name"),
            "password": form_data.get("password")
        }))
        fs.writeFileSync(path.join(user_dir, 'settings.json'), JSON.stringify({
            "user_type": "teacher"
        }))
        location.href = '../front_page/index.html'
    })
    .catch(error => {
        
    });
}
