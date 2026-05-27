import { parse } from "./parser.js";

const ast = parse("f x y");

console.log(ast);