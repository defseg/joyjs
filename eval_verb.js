function eval_verb(verb, stack, env = false) {
	// Evaluates a verb and modifies the stack.
	if (js_verbs.hasOwnProperty(verb)) return js_verbs[verb](stack);
	if (env && env.public && env.public.hasOwnProperty(verb)) 
		return evaluate({type: "prog", prog: env.public[verb], defs: env.defs}, stack, env)
	throw new Error(`Unimplemented command ${verb}`);
}

// Verbs defined in JS
var js_verbs = {
	// Simple stack operations
		"id"      : function (stack) {} 
	,   "dup"     : function (stack) { var a = stack.pops(1);       stack.push(...[a,a]);   }
	,	"swap"    : function (stack) { var [a, b] = stack.pops(2);  stack.push(...[b,a]);   }
	,   "rollup"  : function (stack) { var [x,y,z] = stack.pops(3); stack.push(...[z,x,y]); }
	// rolldown...rotated
	,   "pop"     : function (stack) { stack.pops(1) }
	// choice

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
			var [car, cdr] = stack.pops(2, [["any"], ["list"]]);
			cdr.unshift(car);
			stack.push(cdr);
		}
	// swons
	,	"first": function (stack) { // Technically don't need to pops here but DRY type checking is nice
			var thing = stack.pops(1, [["list"]]);
			if (thing.length === 0) throw new Error("Can't first or rest an empty list!");
			stack.push(thing[0]);
		}
	,	"rest": function (stack) {
			var thing = stack.pops(1, [["list"]]);
			if (thing.length === 0) throw new Error("Can't first or rest an empty list!");
			thing.shift();
			stack.push(thing);
		}
	// compare...of
	,	"size": function (stack) {
			var thing = stack.pops(1, [["list", "set", "string"]]);
			if (j_type(thing) === "set") thing = [...thing];
			stack.push(thing.length);
		}
	// opcase...enconcat
	// name...intern
	// body...small
	// >=...=
	// equal...in
	// integer...file
	,	"i": function (stack) {
			evaluate({type: "prog", prog: stack.pops(1, [["list"]])}, stack);
		}
	// x...times
	,	"infra": function (stack) {
			// Have to watch out -- in Joy the *first* element is the top of the stack

		}
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