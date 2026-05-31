/*

Module ::= mod:Declarations* ---> module([declarations])

Decl ::= 
	  | "axiom" name:Id uni_params:UniParams? ":" type:Term ---> declaration.axiom(name, uni_params, type) 
	  | "def" name:Id uni_params:UniParams? params:Parameter* ":" type:Term ":=" body:Term ---> declaration.def(name, uni_params, params, type, body)
	  | "inductive" name:Id uni_params:UniParams? params:Parameter* ":" type:Term "where" constrs:Constructor+ ---> declaration.inductive(name, uni_params, params, type, constructors)
	  | "struct" name:Id uni_params:UniParams? params:Parameter* ":" type:Term "where" fields:Field+ ---> declaration.struct(name, uni_params, params, fields)

Constructor ::= "|" name:Id ":" type:Term ---> constructor(name, type)

Field ::= "(" name:Id ":" type:Term ")" ---> field(name, type)

Parameter ::= "(" name:Id ":" type:Term ")" ---> param(name, type)

UniParams ::= ".{" params:Id+ "}" ---> [params]

// order: Lambda > Let > Match

Term ::= Lambda

Lambda ::= Let | "λ" x:Id ":" type:Term "." body:Lambda ---> abs(x, type, body)

Let ::= Match | "let" x:Id ":=" val:Arrow ":" type:Term "in" body:Let ---> let(x, type, val, body)

Match ::= Arrow | "match" target:MatchTarget "with" arms:MatchArms ---> match(target, arms)

MatchArms ::= "case" pattern:Pattern "=>" body:Arrow MatchArms* ---> [match_arm(pattern, body)]

Pattern ::=
		 | x:Id ---> {if uppercase(x[0]) then pattern.constructor(x, []) else ---> pattern.var(x)}
		 | "_" ---> pattern.wildcard
		 | name:Id "(" ")" ---> pattern.constructor(name, [])
		 | name:Id "(" args:PatternArgs ")" ---> pattern.constructor(name, [args])

PatternArgs ::=
			 | x:Id ---> pattern.var(x)
			 | "_" ---> pattern.wildcard

Arrow ::= 

Abs ::= "λ" TypedVar "." Term
App ::= Term Term
Pi ::= "Π" (TypedVar) "." Term
TypedVar ::= Var ":" Term

*/

/////////////////////////////////////////
{{

function make_constructor(name, ...args) {
	if (args === null || args.length == 0) {
    	return name;
    }
	return name + '(' + args.join(",") + ')';
}

function make_list(...args) {
	return '[' + args.join(',') + ']';
}

function is_upper(c) {
	return c == c.toUpperCase() && c != c.toLowerCase();
}

}}

Module
  = head:Declaration tail:("\n" Declaration)* { return [head, ...tail.map(x => x[1])]; }

Declaration
  = "axiom" _ name:Id uni_params:UniParams? _? ":" _? type:Term 
  	{ return make_constructor('declaration.axiom', name, make_list(uni_params), type); }
  / "def" _ name:Id uni_params:UniParams? _? params:Parameters _? ":" _? type:Term _? ":=" _? body:Term 
  	{ return make_constructor('declaration.def', name, make_list(uni_params), make_list(params), type, body); }
  / "inductive" _ name:Id uni_params:UniParams? _? params:Parameters _? ":" _? type:Term _ "where" _ constructors:Constructor+
  	{ return make_constructor("declaration.constr", name, make_list(uni_params), make_list(params), type, make_list(constructors)); }
  / "struct" _ name:Id uni_params:UniParams? _? params:Parameters _? ":" _? type:Term _ "where" _ fields:Field+
  	{ return make_constructor("declaration.struct", name, make_list(uni_params), make_list(params), type, make_list(fields)); }

UniParams
  = ".{" uparams:Id+ "}" { return uparams; }
  
Parameters
  = params:(Parameter)* 
  { return params; }

Parameter
  =  _? "(" _? name:Id _? ":" _? type:Term ")" { return make_constructor("parameter", name, type); }

Constructor
  = _? "|" _? name:Id _? ":" _? type:Term { return make_constructor("constructor", name, type); }

Field
  = _? "(" _? name:Id _? ":" _? type:Term ")" { return make_constructor("field", name, type); }

Term
  = Let

Let
  = Match
  / "let" _ x:Id _? ":" _? type:Arrow _? ":=" _? val:Arrow _ "in" _ body:Let
  	{ return make_constructor("let", x, type, val, body); }

Match
  = Arrow
  / "match" _ term:Atom _ "with" _ arms:MatchArm+
  	{ return make_constructor("match", term, make_list(arms)); }
    
MatchArm
  = _? "|" _? pattern:Pattern _? "=>" _? body:Arrow
  	{ return make_constructor("pattern", pattern, body); }

Pattern
  = name:Id "(" args:PatternArgs ")" { return make_constructor("pattern.constructor", name, make_list(args)); }
  / name:Id "()" { return make_constructor("pattern.constructor", name, make_list()); }
  / x:Id 
  	{
    	if (is_upper(x[0])) {
        	return make_constructor("pattern.var", x);
        } else {
        	return make_constructor("pattern.constructor", x, make_list());
        }
    }
  / "_" { return make_constructor("pattern.wildcard"); }

PatternArgs
  = head:PatternArg "," _? tail:PatternArgs
  	{ return [head] + "," + tail; }
  / PatternArg

PatternArg
  = x:Id { return make_constructor("pattern.var", x); }
  / "_" { return make_constructor("pattern.wildcard"); }

// TODO
Arrow
  = App
  / domain:App _? "->" _? codomain:Arrow
  	{ return make_constructor("pi", "_", domain, codomain); }
  / "(" _? x:Id _? ":" _? type:Term ")" _? "->" _? body:Arrow
  	{ return make_constructor("pi", x, type, body); }

App
  = head:Atom tail:Atom* 
  	{
    	return tail.reduce(
        	(fun, arg) => make_constructor("app", fun, arg),
            head
        );
    }

// TODO
Atom
  = x:Id { return make_constructor("var", x); }
  / "Sort" level:UniverseExpr { return make_constructor(level); } // TODO -- do we want parens or something?
  / "Type" n:Natural?
  	{
    	if (n === null) {
        	return make_constructor("const", 1);
        }
        return make_constructor("const", n + 1);
    }
  / "Type" { return make_constructor("const", 1); }
  / "Prop" { return make_constructor("const", 0); }
  / "(" Term ")"

// TODO
UniverseExpr
  = "u"

/*
Term
  = "t" { return "t"; }
*/

Id
  = [a-z]+ { return '"' + text() + '"'; } // TODO: need to exclude keywords from this
  
Natural
  = _ [0-9]+ { return parseInt(text(), 10); }

_ "whitespace"
  = [ \t\n\r]*

  // TODO: delete this file??