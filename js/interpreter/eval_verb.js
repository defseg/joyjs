Evaluator.prototype.eval_verb = function () {
	if (js_verbs.hasOwnProperty(verb)) return this.get_verb(verb);
	if (this.env && this.env.public && this.env.public.hasOwnProperty(verb)) 
		return this.j_eval(env.public[verb]);
	throw new Error(`Unimplemented command ${verb}`);
}

Evaluator.prototype.get_verb = function (verb) {
	switch (typeof this.js_verbs(verb)) {
		case "function":
			return this.js_verbs[verb];
		case "string":
			return () => this.j_make(this.js_verbs[verb]);
	}
}

Evaluator.prototype.js_verbs = {
	"id"  : function () {}
,	"dup" : function () { var a = this.stack().pops(1); this.stack().push(...[j_dup(a),j_dup(a)]) }
,	"swap": function () { var [a, b] = this.stack().pops(2); this.stack().push(...[b,a]) }
}