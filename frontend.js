import { parse } from "./parser.js";

// TODO: rename this file

const button = document.getElementById('checkButton');
const input = document.getElementById('input');
const output = document.getElementById('output');

var lambda = [];
var library = [];

async function initialize() {
    const response = await fetch("./coc_rules.hrf");
    const rulesText = await response.text();
    const rules = readdata(rulesText);
    definerules(library, rules);
}

document.addEventListener('DOMContentLoaded', (event) => {
    initialize();
})

button.addEventListener('click', () => {
    try {
        const inputText = input.value;
        const ast = parse(inputText);

        
        //output.textContent = ast; //JSON.stringify(ast, null, 2); // TODO

        var result = compfindx(read("yes"), read(`check_module([` + ast + `])`), lambda, library);
        alert(result);
    } catch (e) {
        //output.textContent = e.message;
        alert(e.message);
    }
});

//def id.{u} (A : Sort (u+1)) (x : A) : A := x
//def id_at_type : (A : Type) -> A -> A := id
//def const.{u, v, w} (A : Sort (u+1)) (B : Sort (v+1)) (x : A) (y : B) : A := x
//def compose.{u, v, w} (A : Sort (u+1)) (B : Sort (v+1)) (C : Sort (w+1)) (g : B -> C) (f : A -> B) (x : A) : C := g (f x)