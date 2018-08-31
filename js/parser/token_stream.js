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

	// TODO: floats don't work right yet
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

	function make_token(type, value) {
		return {type: type, value: value};
	}

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
		if (word == "true")  return make_token("bool", true);
		if (word == "false") return make_token("bool", false);
		// reserved words
		if (reserved_words.has(word)) return make_token("reserved", word);
		// if it's nothing else, call it an atom
		return make_token("atom", word);
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
					return make_token("str", str);
				}
				str += chr;
			}
			if (chr == "\\") esc = true;
		}
		input.err("Unclosed string");
	}
	function read_minus() {
		word = get_word();
		if (word.length == 1) return make_token("atom", "-");
		// let's make life easy and assume it's a number. this might be wrong
		return parse_number(word.slice(1), -1);
	}
	function read_char() {
		word = get_word();
		if (word.length > 2) input.err(`Invalid character literal ${word}`);
		return make_token("char", word[1]);
	}
	function read_number(word = false) {
		if (!word) word = get_number();
		if (!is_number(word)) input.err(`Invalid number ${word}`);
		return parse_number(word);
	}

	// --- READER UTILITIES ---

	function is_number(str) {
		// could use a regex but this is simpler and *should* work
		return !isNaN(parseInt(str));
	}
	function parse_number(str, sign = 1) {
		// set sign to -1 for negative numbers
		//
		// if it has scientific notation or a ., it's a float
		if (/[Ee\.]/.test(str)) return parse_float(str, sign);
		// JS will automatically handle hex - no need to worry about it
		// so try to parseInt it and kick it up to float if it's out of bounds
		var tmp = parseInt(str);
		if (tmp > Number.MAX_SAFE_INTEGER || tmp * sign < Number.MIN_SAFE_INTEGER) {
			parse_float(str, sign)
		} else {
			return make_token("int", tmp * sign);
		}
	}
	function parse_float(str, sign) {
		return make_token("float", parseFloat(str) * sign);
	}
	function get_word() {
		return read_while(_get_test);
	}
	function get_number() {
		return read_while(chr => _get_test(chr) || chr === ".");
	}
	function _get_test(chr) {
		return !(is_whitespace(chr)) && (reserved_characters.indexOf(chr) === -1);
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
		if (reserved_characters.indexOf(chr) > -1) return make_token("reserved", input.next());
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
