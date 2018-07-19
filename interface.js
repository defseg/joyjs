(function () { if (typeof JSJ === "undefined") window.JSJ = {};

var Interface = JSJ.Interface = function (objs) {
	params = ["code_area", "run_button", "res", "stack"];
	params.forEach(p => this[p] = objs[p]);
	this.build_listeners();
}

Interface.prototype.build_listeners = function () {
	this.run_button.addEventListener("click", this.run_code.bind(this));
}

Interface.prototype.run_code = function () {
	console.log(this)
	var res = cjoy(this.code_area.value);
	this.res.innerText = res;
}
})();