// The UI for visualising a workbook chapter and seeing its answers

const path = require('path');
const fs = require("fs");

const data = fs.readFileSync(path.join(__dirname, "answers.json"))
let answers = JSON.parse(data);
let last_shown = null;
let last_id = null;

function update_progress() {
    document.getElementById("progres").setAttribute("value", answers.solved[0])
    document.getElementById("fractie").innerHTML = answers.solved[0].toString() + "/" + answers.solved[1].toString()
    document.getElementById("progres").setAttribute("max", answers.solved[1])
}
update_progress()

document.querySelectorAll('.exercise').forEach(function(element) {

    if (answers[element.id]?.solved) {
        element.innerHTML = '<img src="../../../../img/checkmark-green.svg" class="green-check">' + element.innerHTML;
    }

    element.addEventListener("click", () => {
        add_buttons(element.id)

    })

});

function add_buttons(elementid) {
    if (document.getElementById("buttons") && last_id!==elementid) {
            delete_btn()
    }
    else if (last_id===elementid) {

        return};
    if (!answers[elementid].solved) {
        document.getElementById(elementid).outerHTML += `<div id="buttons">\
    <button id="btn_solved" onclick="mark_as_solved(${elementid})"><img src="../../../../img/checkmark.svg"><p>Rezolvat</p></button>\
    <button id="btn_tip" onclick="tip(${elementid})"><img src="../../../../img/bulb.svg"><p>Indiciu</p></button>\
    <button id="btn_solution" onclick="show_full(${elementid})"><img src="../../../../img/solution.svg"><p>Solutie</p></button>\
    <button id="btn_delete" onclick="delete_btn()"><img src="../../../../img/cross.svg"></button>\
    </div>`;
        last_id=elementid
    }
    else {
        document.getElementById(elementid).outerHTML += `<div id="buttons">\
        <button id="btn_not_solved" onclick="mark_as_not_solved(${elementid})"><img src="../../../../img/questionmark.svg"><p>Marcheaza ca nerezolvat</p></button>\
        <button id="btn_delete" onclick="delete_btn()"><img src="../../../../img/cross.svg"></button>\
    </div>`;
    last_id=elementid

    }

    document.getElementById(elementid).addEventListener("click", () => {
        add_buttons(elementid)
    })
}

function tip(elementid) {
    if (last_shown === null) {
        last_shown = answers[elementid].start
        document.getElementById("buttons").outerHTML+='<div id="answers"><p id="rezolvare"><p>Rezolvare</p></p></div>'
        document.getElementById(elementid).addEventListener("click", () => {
            add_buttons(elementid)
        })
    }
    if (last_shown < answers[elementid].end) {
        last_id = elementid
        document.getElementById("answers").innerHTML+=`<img src=./rez/${last_shown}.png>`

        last_shown++
    }
}

function show_full(elementid) {
    if (last_shown === null) {
        last_shown = answers[elementid].start
        document.getElementById("buttons").outerHTML+='<div id="answers"><p id="rezolvare"><p>Rezolvare</p></p></div>'
        document.getElementById(elementid).addEventListener("click", () => {
            add_buttons(elementid)
        })
    }
    for (let i = last_shown; i < answers[elementid].end;i++) {
        last_id = elementid
        document.getElementById("answers").innerHTML+=`<img src=./rez/${last_shown}.png>`

        last_shown++
    }
    if (document.getElementById("btn_tip"))
        document.getElementById("btn_tip").remove()
    if (document.getElementById("btn_solution"))
        document.getElementById("btn_solution").remove()
}

function mark_as_solved(elementid) {
    show_full(elementid);
    document.getElementById("buttons").innerHTML = `<button id="btn_not_solved" onclick="mark_as_not_solved(${elementid})"><img src="../../../../img/questionmark.svg"><p>Marcheaza ca nerezolvat</p></button>` + document.getElementById("buttons").innerHTML
    document.getElementById("btn_solved").remove()
    answers[elementid].solved=true
    answers.solved[0]++
    fs.writeFile(path.join(__dirname, 'answers.json'), JSON.stringify(answers), (err) => { 

    }); 
    document.getElementById(elementid).innerHTML += '<img src="../../../../img/checkmark-green.svg" class="green-check">'
    document.getElementById(elementid).addEventListener("click", () => {
        add_buttons(elementid)
    })
    update_progress()
}

function mark_as_not_solved(elementid) {
    document.getElementById("buttons").innerHTML =     `<button id="btn_solved" onclick="mark_as_solved(${elementid})"><img src="../../../../img/checkmark.svg"><p>Rezolvat</p></button>\
    <button id="btn_tip" onclick="tip(${elementid})"><img src="../../../../img/bulb.svg"><p>Indiciu</p></button>\
    <button id="btn_solution" onclick="show_full(${elementid})"><img src="../../../../img/solution.svg"><p>Solutie</p></button>\
    <button id="btn_delete" onclick="delete_btn()"><img src="../../../../img/cross.svg"></button>`
    answers[elementid].solved=false
    answers.solved[0]--
    fs.writeFile(path.join(__dirname, 'answers.json'), JSON.stringify(answers), (err) => { 

    }); 
    update_progress()

    document.getElementById(elementid).getElementsByClassName("green-check")[0].remove()
}

function delete_btn() {
    if (document.getElementById("answers"))
        document.getElementById("answers").remove()
    document.getElementById("buttons").remove()
    last_shown = null
    last_id = null
}
