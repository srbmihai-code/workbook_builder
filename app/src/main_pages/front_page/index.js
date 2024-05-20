// The main menu, where workbooks can be seen and all features can be accessed from

const fs = require('fs');
const path = require('path');
const AdmZip = require('adm-zip');
const { getPackedSettings } = require('http2');

const user_dir = fs.readFileSync(path.join(__dirname, '..', '..', 'user_dir.txt'), 'utf8');
const server_url = fs.readFileSync(path.join(__dirname, '..', '..', 'server_url.txt'), 'utf8');

let filename
let clicked_workbook_hash

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

function render_main() {
    const user_type  = JSON.parse(fs.readFileSync(path.join(user_dir, 'settings.json'), 'utf8')).user_type
    document.getElementById('add_or_create').innerHTML = 
    user_type === 'student' ? `<div onclick="add_workbook_popup()"><img src="../../img/add.svg" alt=""><br>
      <p>Adaugă o culegere</p>
    </div>
    <div onclick="see_public_workbooks()"><img src="../../img/public.svg" alt=""><br>
      <p>Culegeri publice</p>
    </div>
    ` : `
    <div onclick="location.href='../create/create.html'"><img src="../../img/book.svg" alt=""> <br>
      <p>Creeaza o culegere</p>
    </div>
    `
    if (!fs.existsSync(path.join(__dirname, '..', '..', 'workbooks', 'workbooks'))) {
        fs.mkdirSync(path.join(__dirname, '..', '..', 'workbooks', 'workbooks'))
    }
    let all_workbooks = user_type==="student" ? get_subdirs(path.join(__dirname, '..', '..', 'workbooks', 'workbooks')) :
                        get_subdirs(path.join(__dirname, '..', '..', 'workbooks', 'created_workbooks'))
    for (const [i,workbook] of all_workbooks.entries()) {
        const workbok_data = JSON.parse(fs.readFileSync(path.join(workbook, 'data.json'), 'utf8'))
        const name_of_workbook = workbok_data.name
        const workbook_hash = workbok_data.hash
        const author = workbok_data.author
        document.getElementsByClassName("grid")[0].insertAdjacentHTML('beforeend', `
      <div class="tip" id="${workbook_hash}"><div class="box1"><img src="${workbook}/icon.png" alt="" class="icon" onerror="this.onerror=null; this.src='../../img/workbook.svg'; return true;"><p class="nume">${name_of_workbook}</p></div>${user_type==='student' ? `<p class="author">de ${author}</p>` : `<button class="delete" onclick="show_delete_popup('${workbook_hash}'); event.cancelBubble = true;event.stopPropagation(); ">Șterge</button>`}
      </div>
      `);

        (function (index) {

            document.getElementsByClassName("grid")[0].children[index].addEventListener("click", () => {
                see_chapters(workbook);
            })
            if (user_type==="student")
            document.getElementsByClassName("grid")[0].children[index].addEventListener("contextmenu", (event) => {
                clicked_workbook_hash = event.currentTarget.id
                console.log(clicked_workbook_hash)
                event.preventDefault()
                if (document.getElementsByClassName('popup').length != 0 ) {
                    document.getElementsByClassName('popup')[0].remove()
                }
                right_click_popup(event.clientX + window.scrollX, event.clientY + window.scrollY)
            })
        })(i)

    }
}
try {
    const data = fs.readFileSync(path.join(user_dir, 'last.txt'), 'utf-8');
    if (data === "") {
        render_main();
    } else {
        fs.writeFileSync(path.join(user_dir, 'last.txt'), '');
        see_chapters(data);
    }
} catch (err) {
    console.log(err);
}
function right_click_popup(x, y) {
    document.body.insertAdjacentHTML('beforeend', `
    <div class="popup">
    
    <p>Sterge</p>
</div>
    `)
    const popup = document.getElementsByClassName('popup')[0]
    popup.style.left = x+"px"
    popup.style.top = y+"px"
    document.addEventListener('click', function close_popup(event) {
        var clicked = event.target.closest('.popup');
        if (clicked) {
            remove_workbook()
            popup.remove()
        } else {
            popup.remove()
            document.removeEventListener("click", close_popup);
        }
    });
}
function remove_workbook() {
    fs.rm(path.join(__dirname, '..', '..', 'workbooks', 'workbooks', clicked_workbook_hash), { recursive: true, force: true },(e)=>{console.log(e)})


    document.getElementById(clicked_workbook_hash).remove()
}
function rerender_main() {
    document.getElementsByTagName("body")[0].innerHTML = `
    <div id="top_line"><h1>Bun venit la Workbook Builder!</h1>
  <img src="../../img/settings.svg" alt="" onclick="settings()"></div>
  <div id="add_or_create"></div>
  <h2>Culegerile tale</h2>
  <div class="grid">
  </div>
  `
    render_main()
}

function see_chapters(dir) {
    let body = document.getElementsByTagName("body")[0]

    const workbok_data = JSON.parse(fs.readFileSync(path.join(dir, 'data.json'), 'utf8'))
    const name_of_workbook = workbok_data.name
    const author = workbok_data.author
    body.innerHTML = "";
    body.innerHTML += `
    <div id="workbook_main"><img src="${dir}/icon.png" alt="" class="icon_main"  onerror="this.onerror=null; this.src='../../img/workbook.svg'; return true">
    <h1>${name_of_workbook}</h1></div>
    <p class="author_main">de ${author}</p>
    <p onclick="rerender_main();">⬅️Înapoi la meniu</p>
    <h2>Capitole: </h2>
    <div class="grid"></div>
    `;
    let chapters = [...get_subdirs(dir).map(n => n.match("([^\\\\]+$)")[0]).map(n => parseInt(n))].sort((a, b) => a - b).map(n => n.toString())

    let grid = document.getElementsByClassName("grid")[0]
    for (let chapter of chapters) {
        chapter_data = JSON.parse(fs.readFileSync(path.join(dir, chapter, "answers.json"), 'utf8'));

        let [solved, total] = chapter_data.solved;
        let chapter_name = chapter_data.name;
        dir_double_backslash = dir.replaceAll('\\', '\\\\')
        grid.innerHTML += `
      <div class="tip" onclick="redirect('${dir_double_backslash}/${chapter}/index.html', '${dir_double_backslash}')"><div class="box1"><img src="${dir_double_backslash}/${chapter}/icon.png" alt="" class="icon"  onerror="this.onerror=null; this.src='../../img/workbook.svg'; return true"><p class="nume">${chapter_name}</p></div><div class="box2"><p>${solved}/${total}</p><progress value="${solved}" max="${total}"></progress></div>
      </div>
      `
      
    }
}

function redirect(target, workbook) {
    fs.writeFileSync(path.join(user_dir , 'last.txt'), workbook)
    location.href = target
}

function add_workbook_popup() {
    let body = document.body
    body.innerHTML = `
    <div id="add_form">
    <h2>Introdu datele culegerii</h2>
    <p onclick="rerender_main();">⬅️Înapoi la meniu</p>
    <form id="form" onsubmit="return false">
        <label for="form_name">Nume:</label>
        <input type="text" name="name" id="form_name" required>
        <label for="form_author">Autor:</label>
        <input type="text" name="author" id="form_author" required>
        <label for="form_password">Parola:</label>
        <input type="password" name="password" id="form_password" required>
        <button type="submit"  onclick="submit_form()">Adauga culegerea</button>
    </form></div>
    `;
    
}


function submit_form() {
    const form = document.getElementById('form')
    if (!form.reportValidity()) {
        return;
    }
    let form_data = new FormData(form);

    fetch(`${server_url}/get_workbook`, {
        method: 'POST',
        body: form_data
    })
    .then(response => {
        if (!response.ok) {
            response.text().then(errorMessage =>  {
                throw new Error(errorMessage)
            });

        }
        filename = response.headers.get('X-Filename');
        return response.arrayBuffer();
    })
    .then(buffer => {
        const zipPath = path.join(__dirname, `${filename}`);
        fs.writeFileSync(zipPath, Buffer.from(buffer));
        const folder_name = filename.replace('.zip', '')
        const extractDir = path.join(__dirname, '..', '..', 'workbooks', 'workbooks', `${folder_name}`);
        if (!fs.existsSync(extractDir)) {
            fs.mkdirSync(extractDir);
        }
        const zip = new AdmZip(zipPath);
        zip.extractAllTo(extractDir, true);
        fs.unlinkSync(zipPath);

        form.insertAdjacentHTML('beforeend', `<p class="green">Culegerea a fost adaugată cu succes✅</p>`)
    })
    .catch(errorMessage => {
        if (document.querySelector('.error'))
            document.querySelector('.error').remove()
        if (errorMessage=='not found') {
            form.insertAdjacentHTML('beforeend', `<p class="error">Numele, autorul sau parola nu sunt corecte</p>`)
        }
        else
            form.insertAdjacentHTML('beforeend', `<p class="error">A aparut o eroare cu descarcarea culegerii</p>`)

    })
}

function settings() {
    let body = document.body
    const user_type  = JSON.parse(fs.readFileSync(path.join(user_dir, 'settings.json'), 'utf8')).user_type
    body.innerHTML = `
    <h1>Setari:</h1>
    <p onclick="rerender_main()">⬅️Înapoi la meniu</p>
    <button onclick="log_out()" class="log_out">Delogare</button>
    `;
}
function log_out() {
    fs.writeFileSync(path.join(user_dir, 'settings.json'), JSON.stringify({
        "user_type": null
    }))
    location.href = path.join(__dirname, '..', 'splashscreen', 'splashscreen.html')
}
function see_public_workbooks() {
    let body = document.getElementsByTagName("body")[0]
    fetch(`${server_url}/get_public_workbooks`, {
        method: 'POST'
    })
    .then(response => {
        return response.arrayBuffer();
    })
    .then(buffer => {
        fs.writeFileSync(path.join(__dirname,'temp_public_workbooks_data.zip'), Buffer.from(buffer)); 
        const zip = new AdmZip(path.join(__dirname, 'temp_public_workbooks_data.zip'));
        zip.extractAllTo(path.join(__dirname, 'temp_public_workbooks_data'), true);
        fs.unlinkSync(path.join(__dirname, 'temp_public_workbooks_data.zip'));
    })

    public_workbooks_data = JSON.parse(fs.readFileSync(path.join(__dirname, 'temp_public_workbooks_data', 'public_workbooks_data.json'), { encoding: 'utf8', flag: 'r' }))

    body.innerHTML = `
    <h1>Culegeri publice</h1>
    <p onclick="rerender_main();">⬅️Înapoi la meniu</p>
    <div class="grid">
    </div>
    `;
    const grid = document.getElementsByClassName("grid")[0]
    const downloaded_workbooks = get_subdirs(path.join(__dirname, '..', '..', 'workbooks', 'workbooks')).map(e => e.match("[^\\\\]+$")[0]);
    for (let public_workbook of Object.values(public_workbooks_data)) {
        if (downloaded_workbooks.includes(public_workbook.hash)) 
        grid.insertAdjacentHTML('beforeend', `
        <div class="tip" id="${public_workbook.hash}"><div class="box1"><img src="temp_public_workbooks_data/${public_workbook.hash}.png" alt="" class="icon" onerror="this.onerror=null; this.src='../../img/workbook.svg'; return true;"><p class="nume">${public_workbook.name}</p></div><div class="box3"><button class="downloaded">Descarcat</button><p class="author">de ${public_workbook.author}</p></div>
        </div>
        `);
        else
        grid.insertAdjacentHTML('beforeend', `
        <div class="tip" id="${public_workbook.hash}"><div class="box1"><img src="temp_public_workbooks_data/${public_workbook.hash}.png" alt="" class="icon" onerror="this.onerror=null; this.src='../../img/workbook.svg'; return true;"><p class="nume">${public_workbook.name}</p></div><div class="box3"><button class="download" onclick="download({'name':'${public_workbook.name}', 'author':'${public_workbook.author}', 'hash': '${public_workbook.hash}'})">Descarca</button><p class="author">de ${public_workbook.author}</p></div>
        </div>
        `);
    }
}
function download(public_workbooks_data) {
    let form_data = new FormData();
    form_data.append('hash', public_workbooks_data.hash)
    const place_to_show_error = document.getElementById(public_workbooks_data.hash)
    fetch(`${server_url}/get_workbook`, {
        method: 'POST',
        body: form_data
    })
    .then(response => {
        if (!response.ok) {
            response.text().then(errorMessage => {
            });
            throw new Error('Numele sau parola nu sunt corecte')
        }
        filename = response.headers.get('X-Filename');
        return response.arrayBuffer();
    })
    .then(buffer => {
        const zipPath = path.join(__dirname, `${filename}`);
        fs.writeFileSync(zipPath, Buffer.from(buffer));
        const folder_name = filename.replace('.zip', '')
        const extractDir = path.join(__dirname, '..', '..', 'workbooks', 'workbooks', `${folder_name}`);
        if (!fs.existsSync(extractDir)) {
            fs.mkdirSync(extractDir);
        }
        const zip = new AdmZip(zipPath);
        zip.extractAllTo(extractDir, true);
        fs.unlinkSync(zipPath);
        place_to_show_error.querySelector('button').classList.remove('download')
        place_to_show_error.querySelector('button').classList.add('downloaded')
        place_to_show_error.querySelector('button').innerHTML = 'Descărcat'
    })
    .catch(e => {
        if (document.querySelector('.error'))
            document.querySelector('.error').remove()
        place_to_show_error.insertAdjacentHTML('beforeend', '<p class="error">A aparut o eroare cu descarcarea culegerii</p>')
        console.log(e)
    })
}

function show_delete_popup(workbook_hash) {
    document.body.innerHTML = `
    <div class="centered_popup">
    <h2>Sunteti sigur ca vreti sa stergeti aceasta culegere? Ea nu va mai putea fi descarcata.</h2>
    <p onclick="rerender_main();">⬅️Înapoi la meniu</p>
    <button class="delete" onclick="delete_workbook('${workbook_hash}')">Stergere</button>
    </div>
    `
}

function delete_workbook(workbook_hash) {
    let form_data = new FormData();
    const credentials = JSON.parse(fs.readFileSync(path.join(user_dir, 'credentials.json'), 'utf8'));
    form_data.append('name', credentials.username)
    form_data.append('password', credentials.password)
    form_data.append('hash', workbook_hash)
    fetch(`${server_url}/delete_workbook`, {
        method: 'POST',
        body: form_data
    })
    .then(response => {
        if (!response.ok) {
            if (document.querySelector('.error')) {
                document.querySelector('.error').remove()
            }
            document.getElementsByTagName('h2')[0].insertAdjacentHTML('afterend', '<p class="error">A ăparut o eroare cu ștergerea culegerii</p>')
            throw new Error('error with deletion')
        }
        fs.rmSync(path.join(__dirname, '..', '..', 'workbooks','created_workbooks', workbook_hash), { recursive: true, force: true });
        rerender_main()
    })
    .catch(e => {

    })
}
