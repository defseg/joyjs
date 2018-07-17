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
		if (chr == "\n") line++, col = 0; else col++;
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

function LexerStream(input) {
	// types:
	//   simple types:
	//     int
	//     float
	//     char
	//     bool
	//   aggregate types:
	//     list
	//     string
	//     set (lol)
	//   other:
	//     word (operator, w/e)
	//     reserved words
	//     punctuation
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
		// TODO: for now, anything between parentheses is a comment
		// should actually be (* ... *) - fix this later
		read_while(chr => chr != ")");
		input.next();
	}
	function skip_comment() {
		read_while(chr => chr != "\n");
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
		// if it's nothing else, it's probably an op
		return {"type": "op", "value": word}
	}
	function read_string() {
		// this doesn't follow the reference implementation
		// TODO: \ddd for three-digit ASCII value ddd
		// also probably Unicode
		var esc = false;
		var str = "";
		var chr;
		while (!input.eof()) {
			chr = input.next();
			if (esc) { 
				str += chr;
			} else {
				if (chr == "\"") {
					return {"type": "str", "value": str};
				}
			}
			if (chr == "\\") esc = true;
		}
		input.err("Unclosed string");
	}
	function read_minus() {
		word = get_word();
		if (word.length == 1) return {"type": "op", "value": "-"};
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
		if (chr == "(") { skip_multi_line_comment(); return read_next(); }
		if (chr == "#") { skip_comment();            return read_next(); }
		// everything with a distinct first character...
		// - reserved characters
		if (reserved_characters.indexOf(chr) > -1) return {"type": "reserved", "value": input.next()};
		// - strings
		if (chr == '"')     return read_string();
		// - special-case minus since it can be either an op or the beginning of a number
		if (chr == '-')     return read_minus();
		// - characters
		if (chr == "'")     return read_char();
		// - numbers
		if (/[0-9]/.test(chr)) return read_number();

		// if it's none of those, pull the whole word up to the next whitespace
		// and try to figure out what it is there
		return read_word();
	}
}

function parse(lexer) {

}