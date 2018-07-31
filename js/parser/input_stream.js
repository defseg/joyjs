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
		throw new Error(msg + ` (${line}:${col})`);
	}
}