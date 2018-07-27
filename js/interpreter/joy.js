function evaluate(exp, stack, env = false) {
	// Interprets an AST node and returns the modified stack.
	var value = get_value(exp);
	console.log(`Value: ${typeof value === 'symbol' ? Symbol.keyFor(value) : to_actually_good_string(value)}\n${stack}`);
	switch (j_type(value)) {
		case "boolean": // fall through
		case "number" : // fall through
		case "string" : // fall through
		case "set"    : // fall through
		case "array"  :
			stack.push(value);
			return stack;
		case "defblock":
			throw new Error("Definitions aren't implemented yet");
		case "def":
			throw new Error("Definitions aren't implemented yet");
		case "symbol":
			eval_verb(Symbol.keyFor(value), stack, env);
			return stack;
		case "object": // assume it's a Prog; we'll make a proper class for this later
			exp.prog.forEach(prog_exp => evaluate(prog_exp, stack, exp.defs));
			return stack;
	}
	console.log("You shouldn't be here!");
}

function get_value(thing) {
	if (thing.value === undefined) return thing; else return thing.value;
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

function joy(str, stack = false, env = false) {
	if (!stack) stack = new Stack();
	var made = make(str);
	if (env) made.defs = env;
	return evaluate(made, stack, env);
}
function cjoy(str) {
	return joy(str).toString();
}