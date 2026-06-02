import { parse } from "./parser.js";

const button = document.getElementById('checkButton');
const input = document.getElementById('input');
const output = document.getElementById('output');
const status = document.getElementById("status");

var lambda = [];
var library = [];

async function initialize() {
    const response = await fetch("./coc_rules.hrf");
    const rulesText = await response.text();
    const rules = readdata(rulesText);
    definerules(library, rules);
}

// Compute the initial number of gutter entries to generate when the page loads.
const style = getComputedStyle(input);
const lineHeight = parseFloat(style.lineHeight);

const paddingTop = parseFloat(style.paddingTop);
const paddingBottom = parseFloat(style.paddingBottom);

const visibleHeight =
    input.clientHeight - paddingTop - paddingBottom;

const visibleRows =
    Math.floor(visibleHeight / lineHeight) + 2;

// Global variable holding the number of rows to generate gutter entries for.
// This should be updated as the textarea expands.
var totalRows = visibleRows;

// Resets the gutter.
function clearGutter() {
    renderGutter(totalRows, []);
}

document.addEventListener('DOMContentLoaded', (event) => {
    initialize();
    clearGutter();
})

input.addEventListener('keydown', function(e) {
    // Reset results when text is edited.
    clearGutter();
    status.textContent = "";

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
    } else if (e.key == 'Enter') {
        // Add a new row to the gutter and regenerate it.
        totalRows++;
        clearGutter();
    }

    // Substitute mathematical symbols for lambda and pi, using the appropriate
    // shortcuts.
    input.value = input.value.replaceAll("\\lam", "λ");
    input.value = input.value.replaceAll("\\pi", "Π");
});

// Renders the results gutter to the left of the textarea, for displaying
// typecheck results. TODO: add line numbers.
function renderGutter(totalLines, declarations) {
    const status = new Map();

    for (const decl of declarations) {
        status.set(
            decl.start.line + 1,
            decl.result ? "✓" : "✗"
        );
    }

    gutter.innerHTML = "";

    for (let line = 1; line <= totalLines + 1; line++) {
        const row = document.createElement("div");

        // TODO: this is inelegant, find a better way to do this.
        if (status.get(line) === undefined) {
            row.className = "gutter-line";
        } else if (status.get(line) === "✓") {
            row.className = "gutter-success";
        } else {
            row.className = "gutter-failure";
        }

        row.textContent = status.get(line) ?? "";

        gutter.appendChild(row);
    }
}

// Typecheck logic.
button.addEventListener('click', () => {
    try {
        const inputText = input.value;
        const parseData = parse(inputText);
        const ast = parseData.ast;
        const locations = parseData.locations; // TODO: remove unnecessary data from this.
        totalRows = Math.max(inputText.split("\n").length + 1, totalRows);

        // A list of any typechecking errors encountered.
        var typeErrors = []
        
        // Typecheck each declaration separately. This is to allow for some error
        // recovery and better error reporting.
        var ctx = grind(compfindx(read("Ctx"), read("ctx.nil(Ctx)"), lambda, library));
        for (let i = 0; i < ast.length; i++) {
            var result = compfindx(read("New_Ctx"), read("check_declaration(" + ast[i] + ", " + ctx + ", New_Ctx)"), lambda, library);

            if (result === false) {
                // Failed to typecheck; do not add to context, proceed to attempt to typecheck remainder of file.
                console.log(`Failed to resolve a type for declaration ${i}. Restoring context and attempting to typecheck remaining declarations...`);
                locations[i].result = false;
                typeErrors.push(locations[i].start.line);
            } else {
                ctx = grind(result);
                locations[i].result = true;
            }
        }

        // Render the results.
        renderGutter(totalRows, locations);

        // Generate messages for any typechecking errors that were encountered.
        if (typeErrors.length === 1) {
            status.textContent = `Failed to typecheck line ${typeErrors[0]}.`;
        } else if (typeErrors.length === 2) {
            status.textContent = `Failed to typecheck lines ${typeErrors[0]} and ${typeErrors[1]}.`
        } else if (typeErrors.length > 2) {
            status.textContent = `Failed to typecheck lines `;
            for (let i = 0; i < typeErrors.length - 1; i++) {
                status.textContent += `${typeErrors[i]}, `
            }
            status.textContent += `and ${typeErrors.at(-1)}.`;
        }
    } catch (e) {
        if (e.name === "SyntaxError") {
            // Parser encountered a syntax error
            const { start, end } = e.location;
            const locations = [{start: {line: start.line}, result: false }]
            renderGutter(totalRows, locations);
            
            status.textContent = `Syntax error [line ${start.line}, column ${start.column}]:\n${e.message}`
        } else if (e.name === "InternalError") {
            // Epilog error
            status.textContent = `Type error: a fatal error was encountered while typechecking. Aborting.`
            console.error(e.message);
        }
    }
});

input.addEventListener("scroll", () => {
    gutter.style.transform =
        `translateY(${-input.scrollTop}px)`;
});