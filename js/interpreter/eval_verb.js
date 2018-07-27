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
,	"rollup"   : "swap [swap] dip"
,	"rolldown" : "[swap] dip swap"
,	"rotate"   : "swap rolldown"
,	"popd"     : "[pop] dip"
,	"dupd"     : "[dup] dip"
,   "swapd"    : "[swap] dip"
,   "rollupd"  : "[rollup] dip"
,   "rolldownd": "[rolldown] dip"
,	"rotated"  : "[rotate] dip"
,	"pop"      : function () { this.stack().pops(1) }
,	"choice": function () {
		var [false_cond, true_cond, maybe] = this.stack().pops(3);
		// Joy's truthy/falsey values don't quite map to JS's.
		if (maybe === "") maybe = true;
		if (maybe instanceof Set   && maybe.size   === 0) maybe = false;
		if (maybe instanceof Array && maybe.length === 0) maybe = false;
		this.stack().push(maybe ? true_cond : false_cond);
	}

,	"+": function () {_arith2(this.stack(), (a, b) => {return b + a}) }
,	"-": function () {_arith2(this.stack(), (a, b) => {return b - a}) }
,	"*": function () {_arith2(this.stack(), (a, b) => {return b * a}) }
,	"/": function () {_arith2(this.stack(), (a, b) => {return b / a}) }

,	"i": function () {
		this.push_prog(this.stack().pops(1, [["array"]]));
	}

,   "dip": function () {
		var prog      = this.stack().pops(1, [["array"]]);
		var tmp       = this.stack().pops(1);
		this.push_ctx(prog, this.ctx()._data, evaluator => evaluator.stack().push(tmp));
	}
}

// Helper functions - TODO make this less messy

// Arithmetic
function _arith2(stack, func) {
	stack.push(stack.pops(2, [['number'],['number']]).reduce(func));
}