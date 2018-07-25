(function () { if (typeof JSJ === "undefined") window.JSJ = {};

var Interface = JSJ.Interface = function (objs) {
	params = ["code_area", "res", "stack",
	          "run_b", "step_b"];
	params.forEach(p => this[p] = objs[p]);
	this.state = false;
	this.build_listeners();

	// init this now
	$(this.code_area).highlightWithinTextarea({highlight: null});
}

Interface.prototype.build_listeners = function () {
	this.run_b.addEventListener("click", this.run_code.bind(this));
	this.step_b.addEventListener("click", this.step.bind(this));
	this.code_area.addEventListener("change", this.code_changed.bind(this));
}

Interface.prototype.run_code = function () {
	var res = cjoy(this.code_area.value);
	this.res.innerText = res;
}

Interface.prototype.code_changed = function () {
	this.state = false;
}

Interface.prototype.step = function () {
	if (!this.state) this.state = new JSJ.State(this.code_area.value);
	$(this.code_area).highlightWithinTextarea({highlight: highlight(this.code_area.value, this.state.loc())});
	console.log(this.state.loc());
	this.res.innerText = this.state.step();

	function highlight(txt, loc) {
		console.log(this.code_area.value.slice(...loc));
		return loc
	}
}})();