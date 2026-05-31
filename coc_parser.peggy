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

function make_sort(universe) {
  return 'usort(' + universe + ')';
}

function make_uni_const(level) {
  return 'uconst(' + level + ')';
}

function make_ground_id(id) {
  let suffix = "";
  if (is_upper(id[0])) {
    suffix = "_upper";
  } else {
    suffix = "_lower";
  }
  return id.toLowerCase() + suffix;
}

}}

Module
  = _? head:Declaration tail:("\n"+ Declaration)* _? { return { ast: [head.declaration, ...tail.map(x => x[1].declaration)], locations: [head.location, ...tail.map(x => x[1].location)] }; }

Declaration
  = "axiom" _ name:Id uni_params:UniParams? _? ":" _? type:Term 
  	{ return { declaration: make_constructor('axiom', name, make_list(uni_params), type), location: location() }; }
  / "def" _ name:Id uni_params:UniParams? _? params:Parameters _? ":" _? type:Term _? ":=" _? body:Term 
  	{ return { declaration: make_constructor('def', name, make_list(uni_params), make_list(params), type, body), location: location() }; }
  / "inductive" _ name:Id uni_params:UniParams? _? params:Parameters _? ":" _? type:Term _ "where" _ constructors:Constructor+
  	{ return { declaration: make_constructor("inductive", name, make_list(uni_params), make_list(params), type, make_list(constructors)), location: location() }; }
  /*/ "struct" _ name:Id uni_params:UniParams? _? params:Parameters _? ":" _? type:Term _ "where" _ fields:Field+
  	{ return { declaration: make_constructor("struct", name, make_list(uni_params), make_list(params), type, make_list(fields)), location: location() }; }*/
  / "struct" _ name:Id _? ":" _? type:Term _ "where" _ fields:Field+
  	{ return { declaration: make_constructor("struct", name, make_list([]), make_list([]), type, make_list(fields)), location: location() }; } // TODO: parameters for structs are proving difficult to typecheck. Disable for now.

UniParams
  = ".{" head:Id _? tail:TailParams* "}" { return [head].concat(tail); }

TailParams
  = "," _? param:Id { return param; }
  
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
  = Proj
  / Match
  
Proj
  = head:Match tail:("." Id)+ {
    	return tail.reduce(
        	(proj, field) => make_constructor("proj", proj, field[1]),
          head
        );
    }

Match
  = Arrow
  / "match" _ term:Atom _ "with" _ arms:MatchArm+
  	{ return make_constructor("match", term, make_list(arms)); }
    
MatchArm
  = _? "|" _? pattern:Pattern _? "=>" _? body:Arrow
  	{ return make_constructor("match.arm", pattern, body); }

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

Arrow
  = domain:App _? "->" _? codomain:Arrow
  	{ 
      return make_constructor("pi", make_constructor("var", '"_"'), domain, codomain);
    }
  / "(" _? x:Id _? ":" _? type:Term ")" _? "->" _? body:Arrow
  	{ return make_constructor("pi", x, type, body); }
  / App

App
  = head:Atom tail:(" "+ Atom)*
  	{
    	return tail.reduce(
        	(fun, arg) => make_constructor("app", fun, arg[1]),
          head
        );
    }
  / Atom

Atom
  = x:Id { return make_constructor("var", x); }
  / "Sort" " "+ level:UniverseExpr { return make_sort(level); } // TODO -- do we want parens or something?
  / "Type " _? n:Natural?
  	{
    	if (n === null) {
        	return make_sort(make_uni_const(1));
        }
        return make_sort(make_uni_const(n + 1));
    }
  / "Type" { return make_sort(make_uni_const(1)); }
  / "Prop" { return make_sort(make_uni_const(0)); }
  / "λ" _? "(" _? x:Id _? ":" _? type:Term ")" _? "." _? body:Term { return make_constructor("abs", x, type, body); }
  / "Π" _? "(" _? x:Id _? ":" _? type:Term ")" _? "." _? body:Term { return make_constructor("pi", x, type, body); }
  / "(" term:Term ")" { return term; }

UniverseExpr
  = "max(" _? u:UniverseExpr _? "," _? v:UniverseExpr _? ")" { return make_constructor("umax", u, v); }
  / UniverseAddExpr

UniverseAddExpr
  = u:UniverseAtom _? "+" _? n:Natural { return make_constructor("uadd", u, n); }
  / UniverseAtom

UniverseAtom
  = n:Natural { return make_uni_const(n); }
  / x:Id { return make_constructor("uvar", x); }
  / "(" u:UniverseExpr ")" { return u; }

Id
  = !Keyword name:Name { return '"' + make_ground_id(name) + '"'; }
  
Name
  = [a-zA-Z] [a-z_]* { return text(); }
  
Keyword
  = ( "def" / "axiom" / "inductive" / "struct" / "let" / "match" / "where" / "with" / "Type" / "Sort" / "Prop") !IdPart
  
IdPart
  = [a-z]

Natural
  = _ [0-9]+ { return parseInt(text(), 10); }

_ "whitespace"
  = [ \t\n\r]*