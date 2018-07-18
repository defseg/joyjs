function eval_verb(verb, stack, env = false) {
	// Evaluates a verb and modifies the stack.
	// probably want to make this an object instead of a switch case
	if (js_verbs.hasOwnProperty(verb)) return js_verbs[verb](stack);
	throw new Error("Unimplemented command");
}

// Verbs defined in JS
var js_verbs = {
		"+": (stack => j_arith2(stack, (a, b) => a + b))
	,	"-": (stack => j_arith2(stack, (a, b) => a - b))
	,	"*": (stack => j_arith2(stack, (a, b) => a * b))
	,	"/": (stack => j_arith2(stack, (a, b) => a / b))
	,   "dup": function (stack) { var a = stack.pop(); stack.push(a); stack.push(a); }
}

// --- Helper functions ---

// Arithmetic operations with two arguments
function j_arith2(stack, func) {
	stack.push(pops(stack, 2, ['number','number']).reduce(func));
	return stack;
}