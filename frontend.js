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

input.addEventListener('keydown', function(e) {
    // Allow tabs in input by intercepting \t
    // Source: https://stackoverflow.com/questions/6637341/use-tab-to-indent-in-textarea
    if (e.key == 'Tab') {
        const tab_output = "  ";    // This is what \t will manifest as

        e.preventDefault();
        var start = this.selectionStart;
        var end = this.selectionEnd;

        this.value = this.value.substring(0, start) + tab_output + this.value.substring(end);

        this.selectionStart = start + tab_output.length;
        this.selectionEnd = start + tab_output.length;
    } 

    input.value = input.value.replaceAll("\\lam", "λ");
    input.value = input.value.replaceAll("\\pi", "Π");
});

function renderGutter(totalLines, declarations) {
    const status = new Map();

    for (const decl of declarations) {
        status.set(
            decl.start.line + 1,
            //decl.ok ? "✓" : "✗"
            "✓"
        );
    }

    gutter.innerHTML = "";

    for (let line = 1; line <= totalLines + 1; line++) {
        const row = document.createElement("div");

        row.className = "gutter-line";

        row.textContent =
            status.get(line) ?? "";

        gutter.appendChild(row);
    }
}

button.addEventListener('click', () => {
    try {
        const inputText = input.value;
        const parseData = parse(inputText);
        const ast = parseData.ast;
        const locations = parseData.locations;
        
        //output.textContent = ast; //JSON.stringify(ast, null, 2); // TODO
        //alert(ast[0]);

        //var result = compfindx(read("yes"), read(`check_module([` + ast + `])`), lambda, library);
        //var result = compfindx(read("New_Ctx"), read(`ctx.nil(Ctx) & check_declaration(` + ast[0] + `, Ctx, New_Ctx)`), lambda, library);
        var ctx = grind(compfindx(read("Ctx"), read("ctx.nil(Ctx)"), lambda, library));
        for (let i = 0; i < ast.length; i++) {
            console.log("check_declaration(" + ast[i] + ", " + ctx + ", New_Ctx)");
            var ctx = grind(compfindx(read("New_Ctx"), read("check_declaration(" + ast[i] + ", " + ctx + ", New_Ctx)"), lambda, library));
            alert(ctx);
            //check_declaration(axiom("pair_lower",[],app(app(var("pair_upper"),usort(uconst(1))),usort(uconst(1)))), ctx([],[],[],[map.entry("pair_upper.fst_lower",pi("a_upper",usort(uadd(uvar("u_lower"),1)),pi("b_upper",usort(uadd(uvar("u_lower"),1)),pi("struct_param",app(app(var("pair_upper"),var("a_upper")),var("b_upper")),var("a_upper"))))),map.entry("pair_upper.snd_lower",pi("a_upper",usort(uadd(uvar("u_lower"),1)),pi("b_upper",usort(uadd(uvar("u_lower"),1)),pi("struct_param",app(app(var("pair_upper"),var("a_upper")),var("b_upper")),var("b_upper")))))],[map.entry("pair_upper",ctx.def(["u_lower"],pi("a_upper",usort(uadd(uvar("u_lower"),1)),pi("b_upper",usort(uadd(uvar("u_lower"),1)),usort(uadd(uvar("u_lower"),1))))))],[]), New_Ctx)
        }
        //alert(result);
        renderGutter(locations.at(-1).start.line, locations);
    } catch (e) {
        //output.textContent = e.message;

        // InternalError => typecheck error, infinite recursion in logic program
        // SyntaxError => parse error
        if (e.name === "SyntaxError") {
            // Parser encountered a syntax error
            const { start, end } = e.location;
            console.error(`Error: ${start.line}, ${start.column} -- ${end.line}, ${end.column}`);
        }
        alert(e.name);
        alert(e.message);
    }
});

//def id.{u} (A : Sort (u+1)) (x : A) : A := x
//def id_at_type : (A : Type) -> A -> A := id
//def const.{u, v, w} (A : Sort (u+1)) (B : Sort (v+1)) (x : A) (y : B) : A := x
//def compose.{u, v, w} (A : Sort (u+1)) (B : Sort (v+1)) (C : Sort (w+1)) (g : B -> C) (f : A -> B) (x : A) : C := g (f x)