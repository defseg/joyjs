if (typeof Evaluator === "undefined") Evaluator = function () {};

Evaluator.prototype.eval_verb = function (verb) {
    if (this.js_verbs.hasOwnProperty(verb)) return this.get_verb(verb).bind(this)();
    if (this.env && this.env.public && this.env.public.hasOwnProperty(verb)) 
        return this.push_prog(this.env.public[verb]);
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
        this.stack().push(j_truthy(maybe) ? true_cond : false_cond);
    }
// or
// xor
// and
,   "not": function () {
        var thing = this.stack().pops(1, [["boolean"]]);
        this.stack().push(!thing);
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
,   "cons": function () {
        // TODO can you really cons into a set?
        var [agg, thing] = this.stack().pops(2, [["array", "string", "set"], "any"]);
        var res;
        switch (j_type(agg)) {
            case "array" : res = [thing].concat(agg);               break;
            case "string": res = thing + agg;                       break;
            case "set"   : res = new Set([thing].concat([...agg])); break;
            default:
                throw new Error(`Can't cons ${thing} onto ${agg}`);
        }
        this.stack().push(res);
    }
,   "swons": "swap cons"
,   "first": function () {
        var thing = this.stack().pops(1, [["array", "string"]]);
        this.stack().push(thing[0]);
    }
,   "rest": function () {
        var thing = this.stack().pops(1, [["array", "string"]]);
        if (thing.length === 0) throw new Error("Can't call rest on an empty aggregate");
        this.stack().push(thing.slice(1));
    }
// compare
,   "at": function () {
        var [i, agg] = this.stack().pops(2, [["number"], ["array", "string"]]);
        this.stack().push(agg[i]);
    }
,   "of": "swap at"
// size
// opcase...case
,   "uncons": "dup rest [first] dip"
,   "unswons": "swap uncons"
// drop...take
,   "concat": function () {
        // TODO sets?
        var [b, a] = this.stack().pops(2, [["array","string"],["array","string"]]); 
        if (j_type(a) !== j_type(b)) throw new Error(`Type error: can't concat ${a} and ${b}`);
        this.stack().push(j_type(a) === "set" ? new Set([...a].concat(...b)) : a.concat(b))
    }
,   "enconcat": "swapd cons concat"
// name...intern
// body
,   "null": function () {
        var thing = this.stack().pops(1, [["array", "string", "set", "number"]]);
        if (j_type(thing) === "number") {
            this.stack().push(thing === 0);
        } else if (j_type(thing) === "set") {
            this.stack().push(thing.size === 0);
        } else {
            this.stack().push(thing.length === 0);
        }
    }
// null...small
,   ">=": function () {(_comp(this.stack(), (a, b) => a >= b)) }
,   ">" : function () {(_comp(this.stack(), (a, b) => a >  b)) }
,   "<=": function () {(_comp(this.stack(), (a, b) => a <= b)) }
,   "<" : function () {(_comp(this.stack(), (a, b) => a <  b)) }
,   "!=": function () {(_comp(this.stack(), (a, b) => a != b)) }
,   "=" : function () {(_comp(this.stack(), (a, b) => a ===b)) }
,   "i": function () {
        this.push_prog(this.stack().pops(1, [["array"]]));
    }
,   "x": "dup [i] dip"
,   "dip": function () {
        var prog      = this.stack().pops(1, [["array"]]);
        var tmp       = this.stack().pops(1);
        this.push_ctx(prog, this.ctx()._data, "dip", evaluator => evaluator.stack().push(tmp));
    }
,   "nullary": function () {
        // TODO refactor these
        var prog      = this.stack().pops(1, [["array"]]);
        var tmp_stack = j_dup(this.stack());
        this.push_ctx(prog, tmp_stack, "nullary", evaluator => {
            evaluator.stack().push(tmp_stack.pops(1));
        });
    }
,   "unary": function () {
        var prog      = this.stack().pops(1, [["array"]]);
        var tmp_stack = j_dup(this.stack());
        this.push_ctx(prog, tmp_stack, "unary", evaluator => {
            evaluator.stack().pops(1);
            evaluator.stack().push(tmp_stack.pops(1));
        });
    }
,   "binary": function () {
        var prog      = this.stack().pops(1, [["array"]]);
        var tmp_stack = j_dup(this.stack());
        this.push_ctx(prog, tmp_stack, "binary", evaluator => {
            evaluator.stack().pops(2);
            evaluator.stack().push(tmp_stack.pops(1));
        })
    }
,   "ternary": function () {
        var prog      = this.stack().pops(1, [["array"]]);
        var tmp_stack = j_dup(this.stack());
        this.push_ctx(prog, tmp_stack, "binary", evaluator => {
            evaluator.stack().pops(3);
            evaluator.stack().push(tmp_stack.pops(1));
        })
    }
,   "cleave": function () {
        var [prog1, prog2] = this.stack().pops(2, [["array"], ["array"]]);
        var tmp_stack1     = this.dup_stack();
        var tmp_stack2     = this.dup_stack();
        this.stack().pops(1);
        this.push_ctx(prog1, tmp_stack1, "cleave1", evaluator => {
            evaluator.push_ctx(prog2, tmp_stack2, "cleave2", evaluator => {
                    evaluator.stack().push_one(tmp_stack2.pops(1));
                    evaluator.stack().push_one(tmp_stack1.pops(1));
            });
        });
    }
,   "ifte": function () {
        var [false_cond, true_cond, cond] = this.stack().pops(3, [["array"], ["array"], ["array"]]);
        var cond_stack = j_dup(this.stack());
        this.push_ctx(cond, cond_stack, "ifte_cond", evaluator => {
            if (j_truthy(cond_stack.pops(1))) {
                evaluator.push_ctx(true_cond, evaluator.ctx()._data, "ifte_true");
            } else {
                evaluator.push_ctx(false_cond, evaluator.ctx()._data, "ifte_false");
            }
        })
    }
,   "linrec": function () {
        var [r2, r1, t, cond] = this.stack().pops(4, [["array"], ["array"], ["array"], ["array"]]);
        var cond_stack = j_dup(this.stack());

        this.push_ctx(cond, cond_stack, "linrec_cond", evaluator => {
            if (j_truthy(cond_stack.pops(1))) {
                evaluator.push_prog(t);
            } else {
                evaluator.push_prog([cond, t, r1, r2, Symbol.for("linrec")].concat(r2));
                evaluator.push_prog(r1);
            }
        });
    }
,   "tailrec": function () {
        // Could implement as `[] linrec` but this gives a nicer display in step
        var [r1, t, cond] = this.stack().pops(3, [["array"], ["array"], ["array"]]);
        var cond_stack = j_dup(this.stack());
        this.push_ctx(cond, cond_stack, "tailrec_cond", evaluator => {
            if (j_truthy(cond_stack.pops(1))) {
                evaluator.push_prog(t);
            } else {
                evaluator.push_prog([cond, t, r1, Symbol.for("tailrec")]);
                evaluator.push_prog(r1);
            }
        });
    }
,   "genrec": function () {
        var [r2, r1, t, cond] = this.stack().pops(4, [["array"], ["array"], ["array"], ["array"]]);
        var cond_stack = j_dup(this.stack());

        this.push_ctx(cond, cond_stack, "genrec_cond", evaluator => {
            if (j_truthy(cond_stack.pops(1))) {
                evaluator.push_prog(t);
            } else {
                evaluator.push_prog([[cond, t, r1, r2, Symbol.for("genrec")]].concat(r2));
                evaluator.push_prog(r1);
            }
        })
    }
,   "infra": function () {
        var prog = this.stack().pops(1, [["array"]]);
        var stack = new Stack(this.stack().pops(1, [["array"]]));

        this.push_ctx(prog, stack, "infra", evaluator => {
            evaluator.stack().push_one(stack.arr);
        })
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

// Comparators
function _comp(stack, func) {
    var [b, a] = stack.pops(2);
    if (j_type(a) !== j_type(b)) throw new Error("Type error");

    if (a.hasOwnProperty("length")) { // Array or string
        stack.push(func(a.length, b.length));
    } else if (j_type(a) === "set") {
        stack.push(func(a.size, b.size));
    } else {
        stack.push(func(a, b));
    }
}