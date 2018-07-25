function evaluate(exp, stack, env = false) {
	// Interprets an AST node and returns the modified stack.
	switch (j_type(exp.value || exp)) {
		case "boolean": // fall through
		case "number" : // fall through
		case "string" : // fall through
		case "set"    : // fall through
		case "array"  :
			stack.push(exp.value || exp);
			return stack;
		case "defblock":
			throw new Error("Definitions aren't implemented yet");
		case "def":
			throw new Error("Definitions aren't implemented yet");
		case "symbol":
			eval_verb(Symbol.keyFor(exp.value || exp), stack, env);
			return stack;
		case "object": // assume it's a Prog; we'll make a proper class for this later
			exp.prog.forEach(prog_exp => evaluate(prog_exp, stack, exp.defs));
			return stack;
	}
	console.log("You shouldn't be here!");
}

function j_type(thing) {
	if (typeof thing !== "object") return typeof thing;
	return thing.constructor.name.toLowerCase();
}

function has(thing, el) {
	if (thing instanceof Array) {
		return thing.indexOf(el) > -1;
	} else if (thing instanceof Set) {
		return thing.has(el);
	}
}

// For convenience

function make(str) {
	return parse(TokenStream(InputStream(str)));
}

function joy(str, stack = false) {
	if (!stack) stack = new Stack();
	return evaluate(make(str), stack);
}
function cjoy(str) {
	return joy(str).toString();
}