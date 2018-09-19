(function () { if (typeof JSJ === "undefined") window.JSJ = {};

var Interface = JSJ.Interface = function (objs) {
	// TODO: build all these divs dynamically
	params = ["code_area", "res", "inst", "stack",
	          "context", "run_b", "step_b", "rblock_b"];
	params.forEach(p => this[p] = objs[p]);
	
	this.build_listeners();

	// init evaluator
	this.evaluator = new Evaluator();
}

Interface.prototype.build_listeners = function () {
	this.run_b.addEventListener("click", this.run_code.bind(this));
	this.step_b.addEventListener("click", this.step.bind(this));
	this.rblock_b.addEventListener("click", this.run_block.bind(this));
	this.code_area.addEventListener("change", this.code_changed.bind(this));
}

Interface.prototype.run_code = function () {
	this.init();
	while (!this.evaluator.all_done()) { this.try_step() }
	this.update_display();
}

Interface.prototype.run_block = function () {
	// Run the current block/context to completion.
	// When it's over, the count of contexts will always decrease.
	if (this.evaluator.all_done()) { return } // no infinite loops!
	var curr_ctx_count = this.evaluator.ctxs.length()
	while (this.evaluator.ctxs.length() === curr_ctx_count) { this.try_step() }
	this.try_step() // and one more...
	this.update_display();
}

Interface.prototype.code_changed = function () {
	this.ready = false;
}

Interface.prototype.step = function () {
	if (!this.ready) this.init();
	this.try_step();
	this.update_display();
}

Interface.prototype.update_display = function () {
	var resText = () => {
		return this.evaluator.stack();
	}
	var instText = () => {
		return this.evaluator.prog();
	}
	var contextHTML = () => {
		return this.evaluator.ctxs.arr.map(a => "<span>" + a.toString() + "</span>").join("")
	}
	console.log(instText());
	this.res.innerText  = resText()
	this.inst.innerText = instText()
	this.context.innerHTML = contextHTML();
}

Interface.prototype.init = function () {
	var code = this.code_area.value;
	this.evaluator.init(make(code));
	this.ready = true;
}

Interface.prototype.try_step = function () {
	try {
		this.evaluator.step();
	} catch(error) {
		// change this later
		alert(error);
		throw error;
	}
}

})();