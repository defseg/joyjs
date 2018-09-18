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
    // maxint
    // stack
    // time
    "rand": function () {
        // Return a random integer.
        // In the range 0...2^32 because that's what Thun's implementation does.
        this.stack().push(Math.floor(Math.random() * 2**32));
    }
,   "id"  : function () {}
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
,   "or" : function () {_bool(this.stack(), "or")}
,   "xor": function () {_bool(this.stack(), "xor")}
,   "and": function () {_bool(this.stack(), "and")}
,   "not": function () {
        var thing = this.stack().pops(1, [["boolean"]]);
        this.stack().push(!thing);
    }
,   "+"  : function () {_arith2(this.stack(), (a, b) => b + a)}
,   "-"  : function () {_arith2(this.stack(), (a, b) => b - a)}
,   "*"  : function () {_arith2(this.stack(), (a, b) => b * a)}
,   "/"  : function () {_arith2(this.stack(), (a, b) => b / a)}
,   "//" : function () {_arith2(this.stack(), (a, b) => Math.floor(b / a))} // Floor integer division - not in Thun's Joy. Could add int/float distinction but won't yet. Might take this out later.
,   "rem": function () {_arith2(this.stack(), (a, b) => b % a)}
,   "div": "[dup] dip dup rollup rem [//] dip"
,  "sign": function () {_arith1(this.stack(), Math.sign)}
,   "neg": "0 swap -"
// ord
// chr
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
,   "pow": function () {_arith2(this.stack(), (b, a) => a ** b)}
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
,   "swoncat": "swap concat" // not in the manual, but it's there
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
,   "size": function () {
        var agg = this.stack().pops(1, [["array"]]);
        this.stack().push(agg.length);
    }
// opcase...case
,   "uncons": "dup rest [first] dip"
,   "unswons": "uncons swap"
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
,   "small": function () {
        var thing = this.stack().pops(1, [["array", "string", "set", "number"]]);
        if (j_type(thing) === "number") {
            this.stack().push(0 <= thing && thing <= 1); // is this right?
        } else if (j_type(thing) === "set") {
            this.stack().push(thing.size <= 1);
        } else {
            this.stack().push(thing.length <= 1);
        }
    }
,   ">=": function () {(_comp(this.stack(), (a, b) => a >= b)) }
,   ">" : function () {(_comp(this.stack(), (a, b) => a >  b)) }
,   "<=": function () {(_comp(this.stack(), (a, b) => a <= b)) }
,   "<" : function () {(_comp(this.stack(), (a, b) => a <  b)) }
,   "!=": function () {(_comp(this.stack(), (a, b) => a != b)) }
,   "=" : function () {(_comp(this.stack(), (a, b) => a ===b)) }
// equal
,   "has": function () { // array trickery is the same in Joy as in JS, so no nasty workarounds needed
        var agg    = this.stack().pops(1, [["array", "string", "set"]]);
        var res;
        if (agg instanceof Set) {
            res = agg.has(member);
        } else {
            res = agg.indexOf(member) > -1;
        } 
        this.stack().push(res);
    }
,   "in": "swap has"
// integer...file
,   "i": function () {
        this.push_prog(this.stack().pops(1, [["array"]]));
    }
,   "x": "dup i"
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
        });
    }
// ifinteger...iffile
,   "cond": function () {
        // TODO: should add tests and see how Thun's implementation handles malformed inputs
        var conds = j_dup(this.stack().pops(1, [["array"]]));
        var d = conds.pop(1); 
        var that = this;

        var try_one = () => {
            if (conds.length === 0) {
                that.push_prog(d);
                return;
            }

            var ti = conds.shift();
            var bi = ti.shift();
            var bi_stack = that.dup_stack();
            that.push_ctx(bi, bi_stack, "cond", evaluator => {
                if (j_truthy(bi_stack.pops(1))) {
                    evaluator.push_prog(ti);
                } else {
                    try_one();
                }
            });
        }

        try_one();
    }
,   "while": function () {
        var [d, b] = this.stack().pops(2, [["array"], ["array"]]);
        var cond_stack = this.dup_stack();

        this.push_ctx(b, cond_stack, "while", evaluator => {
            var foo = cond_stack.pops(1);
            if (j_truthy(foo)) {
                evaluator.push_prog([b].concat([d]).concat([Symbol.for('while')]));
                evaluator.push_prog(d);
            }
        })
    }
,   "linrec": function () {
        var [r2, r1, t, cond] = this.stack().pops(4, [["array"], ["array"], ["array"], ["array"]]);
        var cond_stack = this.dup_stack();

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
// binrec
,   "condlinrec": function () {
        // TODO: maybe factor out try_one from this and cond?
        // DON'T MUTATE CONDS HERE
        var conds = j_dup(this.stack().pops(1, [["array"]]));
        var i = 0;
        var that = this;
        // Each Ci is of the forms [[B] [T]] or [[B] [R1] [R2]].

        var try_one = () => {
            console.log(i);
            if (i === conds.length - 1) {
                var d = conds[conds.length - 1];
                if (d.length === 1) {
                    that.push_prog(d);
                } else if (d.length === 2) {
                    var [r1, r2] = d;
                    var new_prog = r1.concat([conds, Symbol.for("condlinrec")]).concat(r2);
                    that.push_prog(new_prog);
                } else {
                    throw new Error("Invalid condlinrec default condition");
                }
                return;
            }

            var cond = conds[i];
            var b    = cond[0];
            var b_stack = that.dup_stack();
            console.log(cond);

            if (cond.length === 2) {
                var new_prog = cond[1];
            } else if (cond.length === 3) {
                var [r1, r2] = cond.slice(1);
                var new_prog = r1.concat([conds, Symbol.for("condlinrec")]).concat(r2);
                console.log(new_prog);
            }

            that.push_ctx(b, b_stack, "condlinrec_cond", evaluator => {
                if (j_truthy(b_stack.pops(1))) {
                    that.push_prog(new_prog);
                } else {
                    i++;
                    try_one();
                }
            });
        }

        try_one();
    }
// step
,   "fold": function () {
        var prog   = this.stack().pops(1, [["array"]]);
        var v0     = this.stack().pops(1);
        var params = this.stack().pops(1, [["array", "string"]]);
        var new_stack;

        new_stack = this.dup_stack();
        new_stack.push(v0);
        new_stack.push(params.shift());

        var munge = (new_stack) => {
            new_stack.push(params.shift());
            return new_stack
        }

        var callback = evaluator => {
            if (params.length > 0) {
                evaluator.push_ctx(j_dup(prog),
                                   munge(new_stack),
                                   "fold",
                                   callback);
            } else {
                evaluator.stack().push(new_stack.pops(1));
            }
        }

        this.push_ctx(j_dup(prog), new_stack, "fold", callback);
    }
,   "map": function () {
        var prog   = this.stack().pops(1, [["array"]]);
        var params = this.stack().pops(1, [["array"]]);
        var acc    = [];
        var new_stack;

        var munge = (evaluator) => {
            new_stack = evaluator.dup_stack();
            new_stack.push(params.shift());
            return new_stack
        }

        var callback = evaluator => {
            acc.push(new_stack.pops(1));
            if (params.length > 0) {
                evaluator.push_ctx(j_dup(prog),
                                   munge(evaluator),
                                   "map",
                                   callback);
            } else {
                evaluator.stack().push(acc);
            }
        }

        this.push_ctx(j_dup(prog), munge(this), "map", callback);
    }
,   "filter": function () {
        var prog      = this.stack().pops(1, [["array"]]);
        var to_filter = this.stack().pops(1, [["array"]]);
        var acc       = []; 
        var new_stack, being_filtered;

        var munge = (evaluator) => {
            new_stack = evaluator.dup_stack();
            being_filtered = to_filter.shift();
            new_stack.push(being_filtered);
            return new_stack
        }

        var callback = evaluator => {
            if (j_truthy(new_stack.pops(1))) acc.push(being_filtered);
            
            if (to_filter.length > 0) {
                evaluator.push_ctx(j_dup(prog), munge(evaluator), "filter", callback);
            } else {
                evaluator.stack().push(acc);
            }
        }

        this.push_ctx(j_dup(prog), munge(this), "filter", callback);
    }
,   "times": function () {
        var prog = this.stack().pops(1, [["array"]]);
        var i    = this.stack().pops(1, [["number"]]);

        var callback = evaluator => {
            if (i-- > 1) evaluator.push_ctx(prog, this.stack(), "times", callback);
        }

        this.push_ctx(prog, this.stack(), "times", callback);
    }
,   "infra": function () {
        var prog = this.stack().pops(1, [["array"]]);
        var stack = new Stack(this.stack().pops(1, [["array"]]));

        this.push_ctx(prog, stack, "infra", evaluator => {
            evaluator.stack().push_one(stack.arr);
        })
    }
// TODO put this in the right place
,   "split": function () {
        // running the splits doesn't mute the stack
        var prog = this.stack().pops(1, [["array"]]);
        var arr  = this.stack().pops(1, [["array"]]);
        var res_true  = [];
        var res_false = [];
        var that = this;

        var try_one = () => {
            var new_stack = that.dup_stack();
            var thing     = arr.shift();
            new_stack.push(thing);
            that.push_ctx(prog, new_stack, "split", evaluator => {
                var res = j_truthy(new_stack.pops(1));
                if (res) res_true.push(thing); else res_false.push(thing);
                if (arr.length === 0) {
                    that.stack().push(res_false, res_true);
                } else {
                    try_one();
                }
            })
        }

        try_one();
    }

,   "putchars": function () {
        // TODO change this to not use the console
        // also shouldn't append newline
        console.log(this.stack().pops(1, [["string"]]));
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

// Boolean logic - sets or bools
function _bool(stack, func_name) {
    var [a, b] = stack.pops(2, [["boolean", "set"], ["boolean", "set"]]);
    if (typeof a !== typeof b) throw new Error("Type error");

    var res;
    if (a instanceof Set) {
        res = {
            "and": (s, t) => new Set([...s].filter(x => t.has(x)))  // intersection
        ,   "or" : (s, t) => new Set([...s].concat(...t))           // union
        ,   "xor": (s, t) => new Set([...s].filter(x => !t.has(x))) // difference
        }[func_name](a, b);
    } else {
        res = {
            "and": (b, c) => b && c
        ,   "or" : (b, c) => b || c
        ,   "xor": (b, c) => !!(b ^ c)
        }[func_name](a, b);
    }
    stack.push(res);
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