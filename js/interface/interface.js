(function () { if (typeof JSJ === "undefined") window.JSJ = {};

var Interface = JSJ.Interface = function (objs) {
	params = ["code_area", "res", "stack",
	          "run_b", "step_b"];
	params.forEach(p => this[p] = objs[p]);
	this.state = false;
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
	var code = this.code_area.value;
	this.evaluator.init(make(code));
	while (!this.evaluator.done()) { this.evaluator.step() }
	this.res.innerText = this.evaluator.stack();
}

Interface.prototype.code_changed = function () {
	this.state = false;
}

Interface.prototype.step = function () {
	if (!this.state) this.state = new JSJ.State(this.code_area.value);
	$(this.code_area).highlightWithinTextarea({highlight: highlight(this.code_area.value, this.state.loc())});
	this.res.innerText = this.state.step();

	function highlight(txt, loc) {
		return loc
	}
}})();