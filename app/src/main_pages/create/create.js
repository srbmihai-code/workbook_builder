// The page where workbooks can be created

const fs = require('fs')
const AdmZip = require('adm-zip');
const path = require('path');
const { error } = require('console');

let filename
let chapter_counter = 1;
const server_url = fs.readFileSync(path.join(__dirname, '..', '..', 'server_url.txt'), 'utf8');
const user_dir = fs.readFileSync(path.join(__dirname, '..', '..', 'user_dir.txt'), 'utf8');

function add_chapter() {
    chapter_counter += 1;
    document.getElementById("add_chapter_button").remove();
    document.getElementById("chapters").insertAdjacentHTML('beforeend', `\
    <li class="inline_field" id="chapter_${chapter_counter}">\
    <label for="nume${chapter_counter}">Nume:</label>
    <input type="text" name="nume${chapter_counter}" id="nume${chapter_counter}" required>
    <label>Exercitii:</label>\
    <input type="file" name="form_exercitii_${chapter_counter}" multiple required accept=".png, .jpg, .jpeg, .pdf">\
    <label>Rezolvare:</label>\
    <input type="file" name="form_rezolvari_${chapter_counter}" multiple required accept=".png, .jpg, .jpeg, .pdf">\
    <label for="icon${chapter_counter}">Iconita (optional):</label>\
    <input type="file" name="icon${chapter_counter}" id="icon${chapter_counter}">\
    <button onclick="add_chapter()" type="button" id="add_chapter_button"><img src="../../img/plus.svg" alt="" class="plus"></button>\
    <button onclick="remove_chapter()" type="button" class="remove_button"><img src="../../img/cross.svg" alt="" class="cross"></button>\
    </li>\
    `);
}

function remove_chapter() {
    document.getElementById(`chapter_${chapter_counter}`).remove()
    chapter_counter -= 1;
    document.getElementById(`chapter_${chapter_counter}`).insertAdjacentHTML('beforeend', '<button onclick="add_chapter()" type="button" id="add_chapter_button"><img src="../../img/plus.svg" alt="" class="plus"></button>\n')
    if (chapter_counter!=1) {
        document.getElementsByClassName("remove_button")[document.getElementsByClassName("remove_button").length-1].remove();
        document.getElementById(`chapter_${chapter_counter}`).insertAdjacentHTML('beforeend','<button onclick="remove_chapter()" type="button" class="remove_button"><img src="../../img/cross.svg" alt="" class="cross"></button>')
    }
}
function submit_form() {
    const form = document.getElementById('form')
    document.getElementById('submit_form_button').disabled = true

    if (!form.reportValidity()) {
        document.getElementById('submit_form_button').disabled = false
        return;
    }
    form.insertAdjacentHTML('beforeend', `<div id="loading"><img src="../../img/loading.gif" id="loading_gif"><p class="yellow" id = "loading_text">Se incarca...</p></div>`)
    let form_data = new FormData(form);
    const credentials = JSON.parse(fs.readFileSync(path.join(user_dir, 'credentials.json'), 'utf8'));
    console.log()
    form_data.append('username', credentials.username)
    form_data.append('user_password', credentials.password)
    fetch(`${server_url}/add_workbook`, {
        method: 'POST',
        body: form_data
    })
    .then(response => {
        if (!response.ok) {
            if (document.querySelector('.error'))
                document.querySelector('.error').remove()
            document.getElementById('loading').remove()
            response.text().then(errorMessage => {
                if (errorMessage=='already') {

                    form.insertAdjacentHTML('beforeend', `<p class="error">Culegerea exista deja</p>`)
                }
                else if (errorMessage=="not_img") {
                    form.insertAdjacentHTML('beforeend', `<p class="error">Fișierle nu sunt imagini sau pdf</p>`)
                }
                else if (errorMessage=="not approved") {
                    form.insertAdjacentHTML('beforeend', `<p class="error">Nu sunteți verificat sa incarcati culegeri publice</p>`)
                }
                else if (errorMessage=="account not found") {
                    form.insertAdjacentHTML('beforeend', `<p class="error">Contul nu există, incercati sa va delogati și sa va autentificati din nou</p>`)
                }
                else {
                    console.log(errorMessage)
                    form.insertAdjacentHTML('beforeend', `<p class="error">A apărut o eroare cu procesarea culegerii</p>`)
                }
            });
            throw new Error('error')
        }
        filename = response.headers.get('X-Filename');
        return response.arrayBuffer();
    })
    .then(buffer => {
        
        document.getElementById('loading').remove()
        const zipPath = path.join(__dirname, `${filename}`);
        fs.writeFileSync(zipPath, Buffer.from(buffer));
        const extractDir = path.join(__dirname, '..', '..', 'workbooks','created_workbooks', `${filename}`);
        if (!fs.existsSync(extractDir)) {
            fs.mkdirSync(extractDir);
        }
        const zip = new AdmZip(zipPath);
        zip.extractAllTo(extractDir, true);
        fs.unlinkSync(zipPath);
        form.insertAdjacentHTML('beforeend', `<p class="green">Culegerea s-a adaugat✅</p>`)
        
    })
    .catch(error => {
        if (document.getElementById('loading'))
            document.getElementById('loading').remove()
        console.log(error)
        form.insertAdjacentHTML('beforeend', `<p class="error">A apărut o eroare cu procesarea culegerii</p>`)
    });
    document.getElementById('submit_form_button').disabled = false
}

function set_private() {
    document.getElementById("password").disabled = false
}

function set_public() {
    document.getElementById("password").disabled =  true
}
