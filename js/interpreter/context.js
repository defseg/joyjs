function Context(callback) {
	this._prog = new Stack();
	this._data = new Stack();
	this.callback = callback;
}

Context.prototype.prog = function () {
	return this._prog;
}

Context.prototype.data = function () {
	return this._data;
}