function Evaluator() {
}

Evaluator.prototype.init = function (prog) {
	this.ctxs = new Stack([new Context("main")]);
	this.push_prog(prog); 
	this.env = prog.defs;
}

Evaluator.prototype.step = function () {
	var was_done = false;
	if (this.curr_done()) {
		// if the current context is out of prog,
		// - store its callback, which should take the evaluator as an argument
		// - pop it from the context stack
		// - and then call the callback, so it can modify the new context
		//   (needed for dip, app`n`, infra, etc.)
		// - after all that, return instead of evaluating the next instruction
		//   so the first instruction on the new context doesn't immediately evaluate
		//   and we can see it in step
		let callback = this.ctx().callback;
		this.remove_ctx();
		if (callback) callback(this);
		was_done = true;
	}

	if (this.all_done()) return; // TODO what should this return?
	if (was_done) return;

	var value = j_value(this.prog().pops(1));

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

Evaluator.prototype.push_ctx = function (prog, data, name, callback) {
	this.ctxs.push(new Context(name, callback))
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