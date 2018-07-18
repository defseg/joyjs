function Stack(arr) {
	this.arr = arr ? arr : [];
}

Stack.prototype.push = function (...thing) {
	this.arr.push(...thing);
}

Stack.prototype.pops = function (num_args, type_arr = false) {
	// Pops `num_args` items.
	// Returns the item if `num_args == 1`; otherwise returns an array.
	// Can also do type-checking if `type_arr` is:
	//   [["allowed type for arg 1", "another allowed type for arg 1"], ["allowed type for arg 2...", ...], ...]
	// You can also do this:
	//   [["boolean", "set"], "any"]	or [["boolean", "set"], ["any"]]
	// In either case, the first item has to be a boolean or a set, but the second item can be anything.

	var args = this.arr.splice(-num_args);
	if (args.length !== num_args) throw new Error("Out of stack");
	if (type_arr) {
		for (var i = 0; i < num_args; i++) {
			if (has(type_arr[i]), "any" || type_arr[i] === "any") continue;
			if (!has(type_arr[i]), j_type(args[i])) throw new Error("Type error");
		}
	}
	return num_args === 1 ? args[0] : args;
}

Stack.prototype.toString = function () {
	return "Stack: " + this.arr.map(i => to_actually_good_string(i)).join(" ") + "";

	function to_actually_good_string(thing) {
		if (thing instanceof Array) return `[${thing.join(",")}]`; else
		if (typeof thing === "string") return `"${thing}"`; else 
		return thing.toString();
	}
}