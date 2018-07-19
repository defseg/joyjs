function eval_verb(verb, stack, env = false) {
	// Evaluates a verb and modifies the stack.
	if (js_verbs.hasOwnProperty(verb)) return get_verb(verb)(stack, env); // if we have to call evaluate from the implementation of the verb, we need env -- e.g. `dip`
	if (env && env.public && env.public.hasOwnProperty(verb)) 
		return evaluate({type: "prog", prog: env.public[verb], defs: env.defs}, stack, env)
	throw new Error(`Unimplemented command ${verb}`);
}

function get_verb(verb) {
	switch (typeof js_verbs[verb]) {
		case "function": // defined in JS
			return js_verbs[verb];
		case "string":   // defined in Joy
			return (stack, env = false) => joy(js_verbs[verb], stack);
	}
}

// Some of these are defined in JS, some in Joy.
// Could optimize by preparsing the Joy ones but it's easier to read if we don't.
var js_verbs = {
	// TODO put this in the right place
		"reverse": stack => stack.push(stack.pops(1, [["array","string"]]).reverse()) 
	// Simple stack operations
	,
		"id"       : function (stack) {} 
	,   "dup"      : function (stack) { var a = stack.pops(1);       stack.push(...[j_dup(a),j_dup(a)]);   }
	,	"swap"     : function (stack) { var [a, b] = stack.pops(2);  stack.push(...[b,a]);   }
	,   "rollup"   : function (stack) { var [x,y,z] = stack.pops(3); stack.push(...[z,x,y]); }
	,	"rolldown" : "rollup rollup"
	,	"rotate"   : "rollup swap"
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
	,	"/"  : (stack => j_arith2(stack, (a, b) => a / b))
	,   "rem": (stack => j_arith2(stack, (a, b) => a % b))
	// div...chr
	,	"abs": (stack => j_arith1(stack, a => Math.sign(a)))
	// acos...modf
	,   "pow": (stack => j_arith2(stack, (a, b) => a ** b))
	// sin...trunc
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
	// swons
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
	// compare...of
	,	"size": function (stack) {
			var thing = stack.pops(1, [["array", "set", "string"]]);
			if (j_type(thing) === "set") thing = [...thing];
			stack.push(thing.length);
		}
	// opcase...take
	,	"concat": function (stack) {
			var [a, b] = stack.pops(2, [["array", "set", "string"]]);
			if (j_type(a) !== j_type(b)) throw new Error("Type error");
			stack.push((j_type(a) === 'set') ? new Set([...a].concat(...b)) : a.concat(b)) 
		}
	// name...intern
	// body...small
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
	,	"i": function (stack) {
			evaluate({type: "prog", prog: stack.pops(1, [["list"]])}, stack);
		}
	,	"x": "dup [i] dip"
	,	"dip": function (stack, env) {
			var prog = stack.pops(1, [["list"]]);
			var tmp  = stack.pops(1);
			evaluate({type: "prog", prog: prog, defs: env}, stack);
			stack.push(tmp);
		}
	// app1...cleave
	,	"branch": "choice i"
	,	"ifte"  : "[[i] dip] dip branch"
	// ifinteger...iffile
	// cond...times
	// infra...
}

// --- Stack helper functions ---
// Eventually this will be refactored as a proper object, but until then...

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