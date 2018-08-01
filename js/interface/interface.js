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
	while (!this.evaluator.all_done()) { this.try_step() }
	this.res.innerText = this.evaluator.stack();
}

Interface.prototype.code_changed = function () {
	this.ready = false;
}

Interface.prototype.step = function () {
	if (!this.ready) this.init();
	this.try_step();

	var resText = () => {
		return this.evaluator.stack();
	}
	var instText = () => {
		return this.evaluator.prog();
	}
	var contextHTML = () => {
		return this.evaluator.ctxs.arr.map(a => "<span>" + a.toString() + "</span>").join("")
	}

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