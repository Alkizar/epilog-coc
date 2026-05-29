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

let yy_meta_counter = 0;
}}

Module
  = head:Declaration tail:("\n"+ Declaration)* { return [head, ...tail.map(x => x[1])]; }

Declaration
  = "axiom" _ name:Id uni_params:UniParams? _? ":" _? type:Term 
  	{ return make_constructor('axiom', name, make_list(uni_params), type); }
  / "def" _ name:Id uni_params:UniParams? _? params:Parameters _? ":" _? type:Term _? ":=" _? body:Term 
  	{ return make_constructor('def', name, make_list(uni_params), make_list(params), type, body); }
  / "inductive" _ name:Id uni_params:UniParams? _? params:Parameters _? ":" _? type:Term _ "where" _ constructors:Constructor+
  	{ return make_constructor("inductive", name, make_list(uni_params), make_list(params), type, make_list(constructors)); }
  / "struct" _ name:Id uni_params:UniParams? _? params:Parameters _? ":" _? type:Term _ "where" _ fields:Field+
  	{ return make_constructor("struct", name, make_list(uni_params), make_list(params), type, make_list(fields)); }

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
  	{ return make_constructor("match.arm", pattern, body); } // TODO: this should be "match.arm"

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

// TODO: _ param should become a fresh metavariable
Arrow
  = domain:App _? "->" _? codomain:Arrow
  	{ 
    	//let fresh_meta = "M_" + yy_meta_counter
    	//yy_meta_counter += 1
    	//return make_constructor("pi", fresh_meta, domain, codomain); 
      return make_constructor("pi", make_constructor("var", "_"), domain, codomain); // TODO
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
  / "Type" " "+ n:Natural?
  	{
    	if (n === null) {
        	return make_sort(make_uni_const(1));
        }
        return make_sort(make_uni_const(n + 1));
    }
  / "Type" { return make_sort(make_uni_const(1)); }
  / "Prop" { return make_sort(make_uni_const(0)); }
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