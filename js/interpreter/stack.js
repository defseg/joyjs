function Stack(arr) {
	this.arr = arr ? arr : [];
}

Stack.prototype.push = function (...thing) {
	// In Thun's implementation, the front of the stack is the 'top'.
	this.arr.unshift(...thing);
}

Stack.prototype.push_one = function (thing) {
	this.arr.unshift(thing);
}

Stack.prototype.fpush = function (...thing) {
	// "Functional push" - return a new stack with the contents of array `thing` prepended
	return new Stack(this.arr.concat(thing));
}

Stack.prototype.pops = function (num_args, type_arr = false) {
	// Pops `num_args` items.
	// Returns the item if `num_args == 1`; otherwise returns an array.
	// Can also do type-checking if `type_arr` is:
	//   [["allowed type for arg 1", "another allowed type for arg 1"], ["allowed type for arg 2...", ...], ...]
	// You can also do this:
	//   [["boolean", "set"], "any"]	or [["boolean", "set"], ["any"]]
	// In either case, the first item has to be a boolean or a set, but the second item can be anything.

	var args = this.arr.splice(0,num_args);
	if (args.length !== num_args) throw new Error("Out of stack");
	if (type_arr) {
		for (var i = 0; i < num_args; i++) {
			if (has(type_arr[i], "any") || type_arr[i] === "any") continue;
			if (!has(type_arr[i], j_type(args[i]))) throw new Error("Type error");
		}
	}
	return num_args === 1 ? args[0] : args;
}

Stack.prototype.peek = function () {
	return this.arr[0];
}

Stack.prototype.empty = function () {
	return this.arr.length === 0;
}

Stack.prototype.small = function () {
	return this.arr.length <= 1;
}

Stack.prototype.apops = function (num_args, type_arr = false) {
	// "Array pops" - guarantees that the thing returned is an array.
	var tmp = this.pops(num_args, type_arr);
	return num_args === 1 ? [tmp] : tmp;
}

Stack.prototype.toString = function () {
	return "Stack: " + this.arr.map(i => to_actually_good_string(i)).join(" ") + "";
}

Stack.prototype.replace = function (new_arr) {
	// for `unstack`
	this.arr.splice(0, this.arr.length);
	new_arr.forEach(a => this.arr.push(j_value(a)))
}
