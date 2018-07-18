function InputStream(input) {
	var pos = 0, line = 1, col = 0;
	return {
		next: next,
		peek: peek,
		eof:  eof,
		err:  err
	}
	function next() {
		var chr = input.charAt(pos++);
		if (chr === "\n") line++, col = 0; else col++;
		return chr;
	}
	function peek() {
		return input.charAt(pos);
	}
	function eof() {
		return peek() == "";
	}
	function err(msg) {
		throw new Error(msg + " (${line}:${col})");
	}
}

function TokenStream(input) {
	// Parses an InputStream into tokens.
	// --- Constant tokens ---
	// int 		{type: "int"  , value: 123}		"integer constant"
	// float    {type: "float", value: 1.23}	"float constant"
	// char 	{type: "char" , value: "a"}		"character constant"
	// str      {type: "str"  , value: "asdf"}	"string constant"
	// --- Atomic symbols ---
	// bool 	{type: "bool" , value: true}	"logical literal" (a type of atomic symbol - may as well handle this here)
	// atom     {type: "atom" , value: "cons"}  "atomic symbol"
	// --- Reserved stuff ---
	// reserved {type: "reserved", value: "{"}  "reserved character" and "reserved word"
	var current = null;
	var reserved_words = new Set([
		"==",
		"MODULE",
		"PRIVATE", "HIDE",
		"PUBLIC", "IN", "DEFINE", "LIBRA",
		"END"
	]);
	var reserved_characters = "[]{};.";
	
	return {
		next: next,
		peek: peek,
		eof:  eof,
		err:  input.err
	}

	// --- RETURNED FUNCTIONS ---

	function next() {
		var tmp = current;
		current = null;
		return tmp || read_next();
	}
	function peek() {
		return current || (current = read_next());
	}
	function eof() {
		return peek() == null;
	}

	// --- UTILITIES --- 

	function is_whitespace(chr) {
		return " \t\n".indexOf(chr) >= 0;
	}
	function read_while(test) {
		var str = "";
		while (!input.eof() && test(input.peek())) str += input.next();
		return str;
	}
	function skip_multi_line_comment() {
		input.next();
		if (input.peek() !== "*") input.err("Malformed comment");
		_skip_multi_line_comment();
	}
	function _skip_multi_line_comment() {
		read_while(chr => chr !== "*");
		if (input.peek() !== ")") skip_multi_line_comment(); else input.next();
	}
	function skip_comment() {
		read_while(chr => chr !== "\n");
		input.next()
	}

	// --- READERS ---

	function read_word() {
		// being vastly overgenerous here
		word = get_word();
		// bools
		if (word == "true")  return {"type": "bool", "value": true}
		if (word == "false") return {"type": "bool", "value": false}
		// reserved words
		if (reserved_words.has(word)) return {"type": "reserved", "value": word}
		// if it's nothing else, call it an atom
		return {"type": "atom", "value": word}
	}
	function read_string() {
		// this doesn't follow the reference implementation
		// TODO: \ddd for three-digit ASCII value ddd
		// also probably Unicode
		var esc = false;
		var str = "";
		var chr;
		input.next(); // discard beginning of string
		while (!input.eof()) {
			chr = input.next();
			if (esc) { 
				str += chr;
			} else {
				if (chr == "\"") {
					return {"type": "str", "value": str};
				}
				str += chr;
			}
			if (chr == "\\") esc = true;
		}
		input.err("Unclosed string");
	}
	function read_minus() {
		word = get_word();
		if (word.length == 1) return {"type": "atom", "value": "-"};
		// let's make life easy and assume it's a number. this might be wrong
		return parse_number(word.slice(1), -1);
	}
	function read_char() {
		word = get_word();
		if (word.length > 2) input.err("Invalid character literal ${word}");
		return {"type": "char", "value": word[1]};
	}
	function read_number(word = false) {
		if (!word) word = get_word();
		if (!is_number(word)) input.err("Invalid number ${word}");
		return parse_number(word);
	}

	// --- READER UTILITIES ---

	function is_number(str) {
		return !(/[^0-9Eex]/.test(str));
	}
	function parse_number(str, sign = 1) {
		// set sign to -1 for negative numbers
		//
		// if it has scientific notation, it's a float
		if (/Ee/.test(str)) return parse_float(str, sign);
		// JS will automatically handle hex - no need to worry about it
		// so try to parseInt it and kick it up to float if it's out of bounds
		var tmp = parseInt(str);
		if (tmp > Number.MAX_SAFE_INTEGER || tmp * sign < Number.MIN_SAFE_INTEGER) {
			parse_float(str, sign)
		} else {
			return {"type": "int", "value": tmp * sign}
		}
	}
	function parse_float(str, sign) {
		return {"type": "float", "value": parseFloat(str) * sign}
	}
	function get_word() {
		return read_while(chr => !(is_whitespace(chr)) && (reserved_characters.indexOf(chr) == -1));
	}

	// --- DISPATCHER ---

	function read_next() {
		read_while(is_whitespace);
		if (input.eof()) return null;

		var chr = input.peek();

		// comments
		if (chr === "(") { skip_multi_line_comment(); return read_next(); }
		if (chr === "#") { skip_comment();            return read_next(); }
		// everything with a distinct first character...
		// - reserved characters
		if (reserved_characters.indexOf(chr) > -1) return {"type": "reserved", "value": input.next()};
		// - strings
		if (chr === '"')     return read_string();
		// - special-case minus since it can be either an op or the beginning of a number
		if (chr === '-')     return read_minus();
		// - characters
		if (chr === "'")     return read_char();
		// - numbers
		if (/[0-9]/.test(chr)) return read_number();

		// if it's none of those, pull the whole word up to the next whitespace
		// and try to figure out what it is there
		return read_word();
	}
}

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
		while (!input.eof()) {
			prog.push(parse());
		}
		return {"type": "prog", "prog": prog};
	}

	function parse() {
		if (is_noun()) {
			return parse_noun();
		} else if (is_verb()) {
			return parse_verb()
		} else if (is_set()) {
			return parse_set();
		} else if (is_term()) {
			return parse_term();
		} else if (is_defblock()) {
			return parse_defblock();
		}
		throw new Error("Parser error at ${input.peek()}");
	}

	// --- Parsers ---

	function parse_noun() {
		var thing = input.next();
		return {"type": "noun", "value": thing.value, "klass": thing.type};
	}
	function parse_verb() {
		return {"type": "verb", "value": input.next().value};
	}
	function parse_set() {
		var set = new Set();
		input.next(); // discard beginning of set
		while (!is_set_end()) {
			if (!is_noun()) throw new Error("Sets can only contain nouns");
			set.add(parse_noun());
		}
		input.next(); // discard end of set
		return {"type": "set", "value": set};
	}
	function parse_term() {
		var term = [];
		input.next(); // discard beginning of term
		while (!is_term_end()) term.push(parse());
		input.next(); // discard end of term
		return {"type": "term", "value": term};
	}
	function parse_defblock() {
		return {"type": "defblock", "value": "TODO"};
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
}

function evaluate(exp, stack, env = false) {
	// Interprets an AST node and returns the modified stack.
	// `env` should only be needed for defblocks, which don't exist yet.

	switch (exp.type) {
		case "noun": // fall through
		case "set" :
			// might want to keep track of `klass` (type)
			stack.push(exp.value);
			return stack;
		case "defblock":
			throw new Error("Definitions aren't implemented yet");
		case "def":
			throw new Error("Definitions aren't implemented yet");
		case "verb":
			eval_verb(exp.value, stack, env);
			return stack;
		case "prog":
			exp.prog.forEach(prog_exp => evaluate(prog_exp, stack, env));
			return stack;
	}
	console.log("You shouldn't be here!");
}

function pops(stack, num_args, type_arr = false) {
	// Pops and returns arguments from `stack`.
	// Also does some simple type-checking.
	var args = stack.splice(-num_args);
	// Make sure we're not out of stack
	if (args.length !== num_args) throw new Error("Out of stack");
	if (type_arr) {
		// make sure the types can be checked
		if (args.length !== type_arr.length) throw new Error("Bad type_arr");
		for (var i = 0; i < num_args; i++) {
			if (type_arr[i] === "any") continue;
			// probably want a dialog or something here later
			if (type_arr[i].indexOf(typeof args[i]) === -1) throw new Error("Type error");
		}
	}
	return args;
}