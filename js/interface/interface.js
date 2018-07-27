(function () { if (typeof JSJ === "undefined") window.JSJ = {};

var Interface = JSJ.Interface = function (objs) {
	// TODO: build all these divs dynamically
	params = ["code_area", "res", "inst", "stack",
	          "context", "run_b", "step_b"];
	params.forEach(p => this[p] = objs[p]);
	
	this.build_listeners();

	// init this now
	$(this.code_area).highlightWithinTextarea({highlight: null});

	// init evaluator
	this.evaluator = new Evaluator();
}

Interface.prototype.build_listeners = function () {
	this.run_b.addEventListener("click", this.run_code.bind(this));
	this.step_b.addEventListener("click", this.step.bind(this));
	this.code_area.addEventListener("change", this.code_changed.bind(this));
}

Interface.prototype.run_code = function () {
	this.init();
	while (!this.evaluator.all_done()) { this.evaluator.step() }
	this.res.innerText = this.evaluator.stack();
}

Interface.prototype.code_changed = function () {
	this.ready = false;
}

Interface.prototype.step = function () {
	if (!this.ready) this.init();
	this.evaluator.step();
	this.res.innerText  = this.evaluator.stack();
	this.inst.innerText = this.evaluator.prog();
	this.context.innerText = this.evaluator.ctx()._name;
}

Interface.prototype.init = function () {
	var code = this.code_area.value;
	this.evaluator.init(make(code));
	this.ready = true;
}

})();