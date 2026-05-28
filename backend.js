

//const data = fs.readFileSync('example.txt', 'utf8');

// TODO: delete this file

var lambda = [];
var library = [];

async function initialize() {
    const response = await fetch("./coc_rules.hrf");
    const rulesText = await response.text();
    const rules = readdata(rulesText);
    definerules(library, rules);
    var result = compfindx(read("yes"), read("check_module(" + "[def(\"id_lower\",[\"u_lower\"],[parameter(\"a_upper\",usort(uadd(uvar(\"u_lower\"),1))),parameter(\"x_lower\",var(\"a_upper\"))],var(\"a_upper\"),var(\"x_lower\"))]" + ")"), lambda, library);
    alert(result);

    //const ruleData = FileSystem
    //const rules = readdata
    //definefacts(lambda, readdata("p(a,b) p(b,c)"));
    //definerules(library, readdata("h(X,Z) :- g(X,Z)\ng(X, Z) :- p(X, Y) & p(Y, Z)"));
    //alert(compfindx(read("yes"), read(`check_module([   def("id_lower",["u_lower"],[parameter("a_upper",usort(uadd(uvar("u_lower"),1))),parameter("x_lower",var("a_upper"))],var("a_upper"),var("x_lower")),   def("id_at_type_lower",[],[],pi("a_upper",usort(uconst(1)),pi(var(_),var("a_upper"),var("a_upper"))),var("id_lower")),   def("const_lower",["u_lower","v_lower","w_lower"],[parameter("a_upper",usort(uadd(uvar("u_lower"),1))),parameter("b_upper",usort(uadd(uvar("v_lower"),1))),parameter("x_lower",var("a_upper")),parameter("y_lower",var("b_upper"))],var("a_upper"),var("x_lower")),   def("compose_lower",["u_lower","v_lower","w_lower"],[parameter("a_upper",usort(uadd(uvar("u_lower"),1))),parameter("b_upper",usort(uadd(uvar("v_lower"),1))),parameter("c_upper",usort(uadd(uvar("w_lower"),1))),parameter("g_lower",pi(var(_),var("b_upper"),var("c_upper"))),parameter("f_lower",pi(var(_),var("a_upper"),var("b_upper"))),parameter("x_lower",var("a_upper"))],var("c_upper"),app(var("g_lower"),app(var("f_lower"),var("x_lower")))) ])`), lambda, library));
}

