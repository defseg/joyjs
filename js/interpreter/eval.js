function Evaluator() {
}

Evaluator.prototype.init = function (prog) {
	this.ctxs = new Stack([new Context()]);
	this.push_prog(prog); 
}

Evaluator.prototype.step = function () {
	if (this.curr_done()) {
		// if the current context is out of prog,
		// - store its callback, which should take the evaluator as an argument
		// - pop it from the context stack
		// - and then call the callback, so it can modify the new context
		//   (needed for dip, app`n`, infra, etc.)
		let callback = this.ctx().callback;
		this.remove_ctx();
		if (callback) callback(this);
	}

	if (this.all_done()) return; // TODO what should this return?

	var value = get_value(this.prog().pops(1));
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
	if (j_type(prog) === "object") {
		this.prog().push(...prog.prog);
	} else { // for now, assume it's an array. TODO?
		this.prog().push(...prog);
	}
}

Evaluator.prototype.ctx = function () {
	return this.ctxs.peek();
}

Evaluator.prototype.push_ctx = function (prog, data, callback) {
	this.ctxs.push(new Context(callback))
	this.push_prog(prog);
	this.ctx()._data = data;
}

Evaluator.prototype.dup_stack = function () {
	return j_dup(this.stack());
}

Evaluator.prototype.prog = function () {
	return this.ctx().prog();
}

Evaluator.prototype.stack = function () {
	return this.ctx().data();
}

Evaluator.prototype.curr_done = function () {
	return this.prog().empty();
}

Evaluator.prototype.all_done = function () {
	return this.ctxs.small() && this.curr_done();
}

Evaluator.prototype.remove_ctx = function () {
	if (!this.ctxs.small()) this.ctxs.pops(1);
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