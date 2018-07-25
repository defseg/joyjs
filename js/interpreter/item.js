function Item(_type, _value, _loc = undefined) {
	// items are immutable, so we'll make these getters
	function type() {
		return _type;
	}
	function value() {
		return _value;
	}
	function loc() {
		return _loc;
	}
}