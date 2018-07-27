Evaluator.prototype.eval_verb = function (verb) {
	if (this.js_verbs.hasOwnProperty(verb)) return this.get_verb(verb).bind(this)();
	if (this.env && this.env.public && this.env.public.hasOwnProperty(verb)) 
		return this.j_eval(env.public[verb]);
	throw new Error(`Unimplemented command ${verb}`);
}

Evaluator.prototype.get_verb = function (verb) {
	switch (typeof this.js_verbs[verb]) {
		case "function":
			return this.js_verbs[verb];
		case "string":
			let made = make(this.js_verbs[verb]);
			return () => { this.prog().push(...made.prog) };
	}
}

Evaluator.prototype.js_verbs = {
	"id"  : function () {}
,	"dup" : function () { var a = this.stack().pops(1); this.stack().push(...[j_dup(a),j_dup(a)]) }
,	"swap": function () { var [a, b] = this.stack().pops(2); this.stack().push(...[b,a]) }
,	"rollup": "swap [swap] dip"
,	"rolldown" : "[swap] dip swap"
,	"rotate"   : "swap rolldown"
,	"popd"     : "[pop] dip"
,	"dupd"     : "[dup] dip"
,   "swapd"    : "[swap] dip"
,   "rollupd"  : "[rollup] dip"
,   "rolldownd": "[rolldown] dip"
,	"rotated"  : "[rotate] dip"
,   "dip": function () {
		var prog      = this.stack().pops(1, [["array"]]);
		var tmp       = this.stack().pops(1);
		this.push_ctx(prog, this.ctx()._data, evaluator => evaluator.stack().push(tmp));
	}
}