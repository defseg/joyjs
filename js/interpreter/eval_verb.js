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
,   "dup" : function () { var a = this.stack().pops(1); this.stack().push(...[j_dup(a),j_dup(a)]) }
,   "swap": function () { var [a, b] = this.stack().pops(2); this.stack().push(...[b,a]) }
,   "rollup"   : "swap [swap] dip"
,   "rolldown" : "[swap] dip swap"
,   "rotate"   : "swap rolldown"
,   "popd"     : "[pop] dip"
,   "dupd"     : "[dup] dip"
,   "swapd"    : "[swap] dip"
,   "rollupd"  : "[rollup] dip"
,   "rolldownd": "[rolldown] dip"
,   "rotated"  : "[rotate] dip"
,   "pop"      : function () { this.stack().pops(1) }
,   "choice": function () {
        var [false_cond, true_cond, maybe] = this.stack().pops(3);
        // Joy's truthy/falsey values don't quite map to JS's.
        if (maybe === "") maybe = true;
        if (maybe instanceof Set   && maybe.size   === 0) maybe = false;
        if (maybe instanceof Array && maybe.length === 0) maybe = false;
        this.stack().push(maybe ? true_cond : false_cond);
    }

,   "+"  : function () {_arith2(this.stack(), (a, b) => b + a)}
,   "-"  : function () {_arith2(this.stack(), (a, b) => b - a)}
,   "*"  : function () {_arith2(this.stack(), (a, b) => b * a)}
,   "/"  : function () {_arith2(this.stack(), (a, b) => b / a)}
,   "//" : function () {_arith2(this.stack(), (a, b) => Math.floor(a / b))} // Floor integer division - not in Thun's Joy. Could add int/float distinction but won't yet. Might take this out later.
,   "rem": function () {_arith2(this.stack(), (a, b) => a % b)}
,   "div": "[dup] dip dup rollup rem [//] dip"
,  "sign": function () {_arith1(this.stack(), Math.sign)}
,   "abs": function () {_arith1(this.stack(), Math.abs)}
,  "acos": function () {_arith1(this.stack(), Math.acos)}
,  "asin": function () {_arith1(this.stack(), Math.asin)}
,  "atan": function () {_arith1(this.stack(), Math.atan)}
, "atan2": function () {_arith2(this.stack(), Math.atan2)} // is this right?
,  "ceil": function () {_arith1(this.stack(), Math.ceil)}
,   "cos": function () {_arith1(this.stack(), Math.cos)}
,  "cosh": function () {_arith1(this.stack(), Math.cosh)}
,   "exp": function () {_arith1(this.stack(), a => Math.E ** a)}
, "floor": function () {_arith1(this.stack(), Math.floor)}
// frexp...ldexp
,   "log": function () {_arith1(this.stack(), Math.log)}
, "log10": function () {_arith1(this.stack(), Math.log10)}
// modf
,   "pow": function () {_arith2(this.stack(), (a, b) => a ** b)}
,   "sin": function () {_arith1(this.stack(), Math.sin)}
,  "sinh": function () {_arith1(this.stack(), Math.sinh)}
,  "sqrt": function () {_arith1(this.stack(), Math.sqrt)}
,   "tan": function () {_arith1(this.stack(), Math.tan)}
,  "tanh": function () {_arith1(this.stack(), Math.tanh)}
, "trunc": function () {_arith1(this.stack(), Math.floor)}
// localtime...formatf
// srand
,  "pred": function () {_arith1(this.stack(), a => a - 1)}
,  "succ": function () {_arith1(this.stack(), a => a + 1)}
,   "max": function () {_arith2(this.stack(), (a, b) => Math.max(b, a))}
,   "min": function () {_arith2(this.stack(), (a, b) => Math.min(b, a))}
// fclose...ftell

// List stuff
,   "unstack": function () { 
        var tmp = this.stack().pops(1, [["array"]]);
        this.stack().replace(tmp);
    }

,   "i": function () {
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
function _arith1(stack, func) {
    stack.push(func(stack.pops(1, [['number']])));
}