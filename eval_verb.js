function eval_verb(verb, stack, env = false) {
	// Evaluates a verb and modifies the stack.
	// probably want to make this an object instead of a switch case
	if (js_verbs.hasOwnProperty(verb)) return js_verbs[verb](stack);
	throw new Error("Unimplemented command");
}

// Verbs defined in JS
var js_verbs = {
	// Simple stack operations
		"id"      : function (stack) {} 
	,   "dup"     : function (stack) { var a = stack.pop();          stack.push(...[a,a]);   }
	,	"swap"    : function (stack) { var [a, b] = pops(stack, 2);  stack.push(...[b,a]);   }
	,   "rollup"  : function (stack) { var [x,y,z] = pops(stack, 3); stack.push(...[z,x,y]); }
	// rolldown...rotated
	,   "pop"     : function (stack) { stack.pop() }
	// choice

	// Boolean logic and arithmetic
	,   "and": (stack => j_bool2(stack, "and"))
	,   "or" : (stack => j_bool2(stack, "or" ))
	,   "xor": (stack => j_bool2(stack, "xor"))
	,	"not": (stack => !pops(stack, 1, ["boolean"])) // Not implementing `not` on sets since they aren't limited to ints 0..31 here.
	,	"+"  : (stack => j_arith2(stack, (a, b) => a + b))
	,	"-"  : (stack => j_arith2(stack, (a, b) => a - b))
	,	"*"  : (stack => j_arith2(stack, (a, b) => a * b))
	,	"/"  : (stack => j_arith2(stack, (a, b) => a / b))
	,   "rem": (stack => j_arith2(stack, (a, b) => a % b))
	// div...modf
	,   "pow": (stack => j_arith2(stack, (a, b) => a ** b))
	// sin...trunc
	// localtime...formatf
	// srand
	// pred...succ
	,	"max": (stack => j_arith2(stack, (a, b) => Math.max(a, b)))
	,	"min": (stack => j_arith2(stack, (a, b) => Math.min(a, b)))
	// fclose...ftell

	// List stuff
	,	"unstack": function (stack) {
			var tmp = stack.pop();
			stack.splice(0, stack.length);
			stack.push(...(tmp.map(i => i.value)));
		}
	,	"cons": function (stack) { // TODO: should also work with sets?
			var [car, cdr] = pops(stack, 2, [["any"], ["list"]]);
			cdr.unshift(car);
			stack.push(cdr);
		}
	// swons
	,	"first": function (stack) { // Technically don't need to pops here but DRY type checking is nice
			var thing = pops(stack, 1, [["list"]]);
			if (thing.length === 0) throw new Error("Can't first or rest an empty list!");
			console.log(thing);
			console.log(thing[0]);
			stack.push(thing[0]);
		}
	,	"rest": function (stack) {
			var thing = pops(stack, 1, [["list"]]);
			if (thing.length === 0) throw new Error("Can't first or rest an empty list!");
			thing.shift();
			stack.push(thing);
		}
}

// --- Helper functions ---

// Boolean operations with two arguments or sets
function j_bool2(stack, func_name) {
	var [a, b] = pops(stack, 2, [['boolean','set'],['boolean','set']]);
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
	stack.push(pops(stack, 2, [['number'],['number']]).reduce(func));
	return stack;
}