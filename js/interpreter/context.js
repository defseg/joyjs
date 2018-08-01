function Context(name, callback) {
	this._prog = new Stack();
	this._data = new Stack();
	this._name = name;
	this.callback = callback;
}

Context.prototype.prog = function () {
	return this._prog;
}

Context.prototype.data = function () {
	return this._data;
}

Context.prototype.toString = function () {
	return this._name;
}