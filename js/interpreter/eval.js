function Evaluator() {
}

Evaluator.prototype.init = function (prog) {
	this.prog      = new Stack();
	this.data_meta = new Stack([new Stack()]);
	this.push_prog(prog); 
}

Evaluator.prototype.step = function () {
	console.log(j_dup(this.prog));
	var value = get_value(this.prog.pops(1));
	switch (j_type(value)) {
		case "boolean": // fall through
		case "number" : // fall through
		case "string" : // fall through
		case "set"    : // fall through
		case "array"  : 
			this.push_val(value);
			return;     // what should this return?
		case "symbol" : 
			this.eval_verb(Symbol.keyFor(value));
			return;
		case "object" : // assume it's a Prog
			this.push_prog(value);
			return;
	}
}

Evaluator.prototype.push_val = function (data) {
	this.stack().push(data);
}

Evaluator.prototype.push_prog = function (prog) {
	// TODO: env
	this.prog.push(...prog.prog);
}

Evaluator.prototype.stack = function () {
	return this.data_meta.peek();
}

Evaluator.prototype.done = function () {
	return this.prog.empty();
}

// TODO rewrite this
function make(str) {
	return parse(TokenStream(InputStream(str)));
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