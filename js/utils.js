// This entire file should eventually be refactored away...
// ...as should the helper functions in eval_verb, which I'm not going to move here.


// From eval.js:
function make(str) {
	return parse(TokenStream(InputStream(str)));
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

// From stack.js
function to_actually_good_string(thing) {
	switch (j_type(thing)) {
		case "array" : return `[${thing.map(i => to_actually_good_string(i)).join(",")}]`;
		case "string": return `"${thing}"`;
		case "symbol": return Symbol.keyFor(thing);
		case "object": return j_has_value(thing) ? to_actually_good_string(j_value(thing)) : 
								(thing.prog ? to_actually_good_string(thing.prog) : thing.toString());
		default:       return thing.toString();
	}
}

function j_has_value(thing) {
	return !(thing.value === undefined)
}

function j_value(thing) {
	return (thing.value === undefined) ? thing : thing.value
}

// New 
function j_truthy(maybe) {
	if (maybe === "") return true;
    if (maybe instanceof Set   && maybe.size   === 0) return false;
    if (maybe instanceof Array && maybe.length === 0) return false;
    return !!maybe;
}