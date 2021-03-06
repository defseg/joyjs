function parse(input) {
	// Parses a TokenStream.
	// Types of thing:
	// - Factors
	// - Literals (a type of factor)
	// - Terms (square bracket 'blocks')
	// - Defblocks (compound definitions)
	//   - Definitions
	return parse_toplevel();

	function parse_toplevel() {
		var prog = [];
		var defs = {"type": "defs", "public": {}};
		while (!input.eof()) {
			var tmp = parse(defs);
			if (tmp !== undefined) prog.push(tmp); // parsing defs returns undefined
		}
		return {"type": "prog", "prog": prog, "defs": defs};
	}

	function parse(defs) {
		if (is_noun()) {
			return parse_noun();
		} else if (is_verb()) {
			return parse_verb()
		} else if (is_set()) {
			return parse_set();
		} else if (is_term()) {
			return parse_term();
		} else if (is_defblock()) {
			return parse_defblock(defs);
		}

		// TODO:
		// `.` is either module def access (infix) or end of program.
		throw new Error(`Parser error at ${input.peek().type} ${input.peek().value}`);
	}

	// --- Parsers ---

	function parse_noun() {
		return make();
	}
	function parse_verb() {
		// TODO: will need private symbol tables eventually
		return make(Symbol.for);
	}
	function parse_set() {
		var set = new Set();
		input.next(); // discard beginning of set
		while (!is_set_end()) {
			if (!is_noun()) throw new Error("Sets can only contain nouns");
			set.add(parse_noun());
		}
		input.next(); // discard end of set
		return make_composite(set);
	}
	function parse_term() {
		var term = [];
		input.next(); // discard beginning of term
		while (!is_term_end()) term.push(parse(input));
		input.next(); // discard end of term
		return make_composite(term);
	}
	function parse_defblock(public_defs) {
		if (["PRIVATE","HIDE"].indexOf(input.peek().value) > -1) 
			throw new Error("Private definitions aren't implemented yet");
		return parse_public_defblock(public_defs);
	}
	function parse_public_defblock(defs) {
		while (!is_defblock_end()) {
			input.next(); // discard defblock beginning or `;`
			if (!is_verb()) input.err(`Bad definition at ${input.peek().type} ${input.peek().value}`);
			var name = input.next().value;
			if (!is_def_eq()) input.err(`Bad definition at ${input.peek().type} ${input.peek().value}`);
			input.next(); // discard `==`
			var defn = [];
			while (!is_def_end()) {
				defn.push(parse());
			}
			defs.public[name] = defn;
		}
		input.next(); // discard defblock end
		return;
	}

	// --- instruction object creator ---

	function make(func = null) {
		var next      = input.next();
		var thing     = next.value;
		if (func) thing = func(thing);
		return thing;
	}
	function make_composite(thing) {
		return thing;
	}

	// --- "is" helpers ---

	function is_atom() {
		return ['int', 'float', 'char', 'str', 'bool', 'atom'].indexOf(input.peek().type) > -1;
	}
	function is_noun() {
		return ['int', 'float', 'char', 'str', 'bool'].indexOf(input.peek().type) > -1;
	}
	function is_verb() {
		return input.peek().type === "atom";
	}
	function is_set() {
		return input.peek().type == "reserved" && input.peek().value == "{";
	}
	function is_set_end() {
		return input.peek().type == "reserved" && input.peek().value == "}";
	}
	function is_term() {
		return input.peek().type == "reserved" && input.peek().value == "[";
	}
	function is_term_end() {
		return input.peek().type == "reserved" && input.peek().value == "]";
	}
	function is_defblock() {
		return input.peek().type === 'reserved' && 
		       ['PRIVATE','PUBLIC','DEFINE','LIBRA','HIDE','IN'].indexOf(input.peek().value) > -1;
	}
	function is_defblock_end() {
		return input.peek().type === "reserved" &&
		       ['END','.'].indexOf(input.peek().value) > -1;
	}
	function is_def_eq() {
		return input.peek().type === "reserved" && input.peek().value === "==";
	}
	function is_def_end() {
		return is_defblock_end() || (input.peek().type === "reserved" && input.peek().value === ";");
	}
}