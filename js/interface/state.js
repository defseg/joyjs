(function () { if (typeof JSJ === "undefined") window.JSJ = {};
var State = JSJ.State = function (str) {
	// Manages state for the interface. Holds three values:
	// - code_tree: the compiled code
	// - code_loc:  the location of the next instruction to run
	// - stack:     the stack
	this.build(str);
}

State.prototype.loc = function () {
	return this.code_tree.prog[this.code_loc].loc;
}

State.prototype.build = function (str) {
	this.code_tree = make(str);
	this.reset();
}

State.prototype.reset = function () {
	this.code_loc = 0;
	this.stack = new Stack();
}

State.prototype.step = function () {
	var ins = this.code_tree.prog[this.code_loc++];
	if (!ins) throw new Error("Can't execute past end of program");
	this.stack = evaluate(ins, this.stack, this.code_tree.defs);
	return this.stack;
}})();