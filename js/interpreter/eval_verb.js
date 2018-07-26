function eval_verb(verb, stack, env = false) {
	// Evaluates a verb and modifies the stack.

	// If we have to call evaluate from the implementation of the verb, we need env -- e.g. `dip`
	if (js_verbs.hasOwnProperty(verb)) return get_verb(verb)(stack, env); 
	if (env && env.public && env.public.hasOwnProperty(verb)) 
		return j_eval(env.public[verb], stack, env);
	throw new Error(`Unimplemented command ${verb}`);
}

function get_verb(verb) {
	switch (typeof js_verbs[verb]) {
		case "function": // defined in JS
			return js_verbs[verb];
		case "string":   // defined in Joy
			return (stack, env = false) => joy(js_verbs[verb], stack, env);
	}
}

// Some of these are defined in JS, some in Joy.
// Could optimize by preparsing the Joy ones but it's easier to read if we don't.
var js_verbs = {
	// library operation - TODO move this
	//	"reverse": stack => stack.push(stack.pops(1, [["array","string"]]).reverse()) 
	// Simple stack operations
		"id"       : function (stack) {} 
	,   "dup"      : function (stack) { var a = stack.pops(1);       stack.push(...[j_dup(a),j_dup(a)]);   }
	,	"swap"     : function (stack) { var [a, b] = stack.pops(2);  stack.push(...[b,a]);   }
	,   "rollup"   : "swap [swap] dip"
	,	"rolldown" : "[swap] dip swap"
	,	"rotate"   : "swap rolldown"
	,	"popd"     : "[pop] dip"
	,	"dupd"     : "[dup] dip"
	,   "swapd"    : "[swap] dip"
	,   "rollupd"  : "[rollup] dip"
	,   "rolldownd": "[rolldown] dip"
	,	"rotated"  : "[rotate] dip"
	,   "pop"      : function (stack) { stack.pops(1) }
	,	"choice"   : function (stack) {
			var [maybe, true_cond, false_cond] = stack.pops(3, [["boolean"], "any", "any"]);
			stack.push(maybe ? true_cond : false_cond);
		}

	// Boolean logic and arithmetic
	,   "and": (stack => j_bool2(stack, "and")) 
	,   "or" : (stack => j_bool2(stack, "or" ))
	,   "xor": (stack => j_bool2(stack, "xor"))
	,	"not": (stack => stack.push(!stack.pops(1, [["boolean"]]))) // Not implementing `not` on sets since they aren't limited to ints 0..31 here.
	,	"+"  : (stack => j_arith2(stack, (a, b) => a + b))
	,	"-"  : (stack => j_arith2(stack, (a, b) => a - b))
	,	"*"  : (stack => j_arith2(stack, (a, b) => a * b))
	,	"/"  : (stack => j_arith2(stack, (a, b) => a / b)) // Not equal to Thun's `/`, since JS doesn't have separate int and float types
	,   "//" : (stack => j_arith2(stack, (a, b) => Math.floor(a / b))) // Floor integer division - not in Thun's Joy. Could add int/float distinction but won't yet. Might take this out later.
	,   "rem": (stack => j_arith2(stack, (a, b) => a % b))
	,	"div": "[dup] dip dup rollup rem [//] dip"
	// sign...chr
	,	"abs": (stack => j_arith1(stack, Math.sign))
	,  "acos": (stack => j_arith1(stack, Math.acos))
	,  "asin": (stack => j_arith1(stack, Math.asin))
	,  "atan": (stack => j_arith1(stack, Math.atan))
	, "atan2": (stack => j_arith2(stack, Math.atan2)) // is this right?
	,  "ceil": (stack => j_arith1(stack, Math.ceil))
	,   "cos": (stack => j_arith1(stack, Math.cos))
	,  "cosh": (stack => j_arith1(stack, Math.cosh))
	,   "exp": (stack => j_arith1(stack, a => Math.e ** a))
	, "floor": (stack => j_arith1(stack, Math.floor))
	// frexp...ldexp
	,   "log": (stack => j_arith1(stack, Math.log)) // log base e
	, "log10": (stack => j_arith1(stack, Math.log10)) // oddly, Joy doesn't have any-base log. maybe it's in a library? TODO
	// modf
	,   "pow": (stack => j_arith2(stack, (a, b) => a ** b))
	,	"sin": (stack => j_arith1(stack, Math.sin))
	,  "sinh": (stack => j_arith1(stack, Math.sinh))
	,  "sqrt": (stack => j_arith1(stack, Math.sqrt))
	,	"tan": (stack => j_arith1(stack, Math.tan))
	,  "tanh": (stack => j_arith1(stack, Math.tanh))
	, "trunc": (stack => j_arith1(stack, Math.floor))
	// localtime...formatf
	// srand
	,	"pred": (stack => j_arith1(stack, a => --a))
	,	"succ": (stack => j_arith1(stack, a => ++a))
	,	"max" : (stack => j_arith2(stack, (a, b) => Math.max(a, b)))
	,	"min" : (stack => j_arith2(stack, (a, b) => Math.min(a, b)))
	// fclose...ftell
	,	"unstack": function (stack) {
			var tmp = stack.pops(1);
			stack.splice(0, stack.length);
			stack.push(...tmp);
		}
	,	"cons": function (stack) { // TODO: should also work with sets?
			var [car, cdr] = stack.pops(2, [["any"], ["array"]]);
			cdr.unshift(car);
			stack.push(cdr);
		}
	,	"swons": "swap cons"
	,	"first": function (stack) { // Technically don't need to pops here but DRY type checking is nice
			var thing = stack.pops(1, [["array"]]);
			if (thing.length === 0) throw new Error("Can't first or rest an empty list!");
			stack.push(thing[0]);
		}
	,	"rest": function (stack) {
			var thing = stack.pops(1, [["array"]]);
			if (thing.length === 0) throw new Error("Can't first or rest an empty list!");
			thing.shift();
			stack.push(thing);
		}
	// compare
	,	"at": function (stack) { 
			var [a, i] = stack.pops(2, [["array", "string"], ["number"]]);
			stack.push(a[i]);
		}
	,	"of": "swap at"
	,	"size": function (stack) {
			var thing = stack.pops(1, [["array", "set", "string"]]);
			stack.push(j_size(thing));
		}
	// opcase...case
	,	"uncons": "dup rest [first] dip"
	,	"unswons": "swap uncons"
	,	"drop": function (stack) {
			var [a, n] = stack.pops(1, [["array", "string"], ["number"]]);
			stack.push(a.slice(n));
		}
	,	"take": function (stack) {
			var [a, n] = stack.pops(1, [["array", "string"], ["number"]]);
			stack.push(a.slice(0,n));
		}
	,	"concat": function (stack) {
			var [a, b] = stack.pops(2, [["array", "set", "string"]]);
			if (j_type(a) !== j_type(b)) throw new Error("Type error");
			stack.push((j_type(a) === 'set') ? new Set([...a].concat(...b)) : a.concat(b)) 
		}
	,	"enconcat": "swapd cons concat"
	// name...intern
	// body...null
	,	"small": function (stack) {
			var a = stack.pops(1, [["array", "set", "string", "number"]]);
			var tmp = a;
			if (j_type(a) !== "number") tmp = j_size(a);
			stack.push(tmp === 0 || tmp === 1);
		}
	,	">=": stack => (j_comp(stack, (a, b) => a >= b))
	,	">" : stack => (j_comp(stack, (a, b) => a >  b))
	,	"<=": stack => (j_comp(stack, (a, b) => a <= b))
	,	"<" : stack => (j_comp(stack, (a, b) => a <  b))
	,	"!=": stack => (j_comp(stack, (a, b) => a != b))
	,	"=" : stack => (j_comp(stack, (a, b) => a ===b))
	// equal...in
	,	"integer": stack => j_type(stack.pops(1)) === "number" // TODO: distinguish between ints and floats
	,	"char"   : function (stack) { var tmp = stack.pops(1); j_type(tmp) === "string" && tmp.length === 1; } // TODO: distinguish between chars and strings
	,	"logical": stack => j_type(stack.pops(1)) === "boolean"
	,	"set"    : stack => j_type(stack.pops(1)) === "set"
	,	"string" : stack => j_type(stack.pops(1)) === "string" 
	,	"list"   : stack => j_type(stack.pops(1)) === "array"
	,	"leaf"   : "list not"
	// user
	,	"float"  : stack => j_type(stack.pops(1)) === "number"
	// file

    // Combinators
	,	"i": function (stack, env) {
			j_eval(stack.pops(1, [["list"]]), stack, env);
		}
	,	"x": "dup [i] dip"
	,	"dip": function (stack, env) {
			var prog = stack.pops(1, [["list"]]);
			var tmp  = stack.pops(1);
			j_eval(prog, stack, env);
			stack.push(tmp);
		}
	// app1...app12
	// construct
    ,   "nullary": (stack, env) => { j_foonary(0, stack, env) }
	,     "unary": (stack, env) => { j_unary(1, stack, env) }
    ,    "unary2": (stack, env) => { j_unary(2, stack, env) }
    ,    "unary3": (stack, env) => { j_unary(3, stack, env) }
    ,    "unary4": (stack, env) => { j_unary(4, stack, env) }
	,      "app2": "unary2"
    ,      "app3": "unary3"
    ,      "app4": "unary4"
	,    "binary": (stack, env) => { j_foonary(2, stack, env) }
    ,   "ternary": (stack, env) => { j_foonary(3, stack, env) }
	// cleave
	,	"branch": "choice i"
	,	"ifte"  : function (stack, env) {
			// ifte : [B] [T] [F] -> ... Executes B. If that yields true, then executes T else executes F.
			// What this doesn't tell you is that executing B isn't supposed to consume anything on the stack!
			// Maybe we can rewrite this in Joy using `infra` once that's implemented...
			var [cond, true_cond, false_cond] = stack.pops(3, [["array"], ["array"], ["array"]]);
			var tmp_stack = j_dup(stack);
			var res_stack = j_eval(cond, tmp_stack, env);
			var res = res_stack.pops(1, [["boolean"]]);
			if (res) {
				return j_eval(true_cond, stack, env);
			} else {
				return j_eval(false_cond, stack, env);
			}
		}
	// ifinteger...iffile
	// cond...while

	// Recursive combinators
	,	  "linrec": ""
	,	 "tailrec": "[] linrec"
	,	  "binrec": ""
	,	  "genrec": ""
	, "condlinrec": ""
	// linrec...condlinrec
	// step...times
	// infra
	// primrec
	// filter...all
	// treestep...treegenrec
	// help...setecho
	,	"gc": "id" // we don't have to worry about garbage collection - JS will handle that
	// system...getenv
	// argv...argc
	// get
	// put...putchars
	// include
	// abort
	// quit
}

// --- Helper functions ---

// Boolean operations with two arguments or sets
function j_bool2(stack, func_name) {
	var [a, b] = stack.pops(2, [['boolean','set'],['boolean','set']]);
	if (typeof a !== typeof b) throw new Error("Type error");

	var res;
	if (a instanceof Set) {
		res = {
			"and": (s, t) => new Set([...s].filter(x => t.has(x)))  // intersection
		,	"or" : (s, t) => new Set([...s].concat(...t))           // union
		,	"xor": (s, t) => new Set([...s].filter(x => !t.has(x))) // difference
		}[func_name](a, b);
	} else {
		res = {
			"and": (b, c) => b && c
		,	"or" : (b, c) => b || c
		,	"xor": (b, c) => !!(b ^ c)
		}[func_name](a, b);
	}
	stack.push(res);
}

// Arithmetic operations with two arguments
function j_arith2(stack, func) {
	stack.push(stack.pops(2, [['number'],['number']]).reduce(func));
	return stack;
}

// Arithmetic operations with one argument
function j_arith1(stack, func) {
	stack.push(func(stack.pops(1, [['number']])));
}

// Comparators
function j_comp(stack, func) {
	var [a, b] = stack.pops(2);
	if (j_type(a) !== j_type(b)) throw new Error("Type error");

	if (a.hasOwnProperty("length")) { // Array or string
		stack.push(func(a.length, b.length));
	} else if (j_type(a) === "set") {
		stack.push(func(a.size, b.size));
	} else {
		stack.push(func(a, b));
	}
}

// unary-n
function j_unary(n, stack, env) {
    var prog = stack.pops(1, [["array"]])
    var params = stack.apops(n);
    var res = params.map(param => j_eval(prog, stack.fpush(param), env).pops(1));
    stack.push(...res);
}

// n-ary
function j_foonary(n, stack, env) {
    var prog = stack.pops(1, [["array"]]);
    var tmp_stack = j_dup(stack);
    var res_stack = j_eval(prog, tmp_stack, env);
    stack.pops(n);
    stack.push(res_stack.pops(1,));
}

// Various helpers
function j_eval(prog, stack, env) {
	return evaluate({type: "prog", prog: prog, defs: env}, stack, env)
}

function j_size(thing) {
	return j_type(thing) === "set" ? thing.size : thing.length;
}

function j_dup(thing) {
	// sigh. can't even use the JSON hack because symbols
	if (typeof thing === "object") {
		// recursive clone
		var tmp = new thing.constructor()
		for (i in thing) { if (thing.hasOwnProperty(i)) tmp[i] = j_dup(thing[i]); }
		return tmp;
	} else {
		return thing;
	}
}