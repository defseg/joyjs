// TODO: make sure the tests are actually comprehensive

joy_tests = [];
function test(a, b, c = false) {
    joy_tests.push(() => _test(a, b, c));
}

// Basic objects
test("1"    , [1]                );
test("1.5"  , [1.5]              );
test("1e3"  , [1000]             );
test("1e-3" , [0.001]            );
test("1 2"  , [2, 1]             );
test("true" , [true]             );
test("false", [false]            );
test("{1 2}", [new Set([1, 2])]  );
test('"foo"', ["foo"]            );
test("'a"   , ["a"]              );

// Basic stack manipulation
test("id"                   , []                                );
test("true id"              , [true]                            );

test("1 dup"                , [1, 1]                            );
test("{1 2} dup"            , [new Set([1, 2]), new Set([1, 2])]);
test("dup"                  , [], true                          );

test("1 2 swap"             , [1, 2]                            );
test('true {1} "foo" swap'  , [new Set([1]), "foo", true]       );
test("swap"                 , [], true                          );
test("1 swap"               , [], true                          );

test("'a 'b 'c rollup"      , ['b', 'a', 'c']                   );
test("1 2 rollup"           , [], true                          );

test("1 2 3 rolldown"       , [1, 3, 2]                         );
test("'m 'n rolldown"       , [], true                          );

test("true false 123 rotate", [true, false, 123]                );
test('"foo bar baz" rotate' , [], true                          );

test('"foo" "bar" [123] pop', ["bar", "foo"]                    );
test("1 2 pop"              , [1]                               );
test("1 pop"                , []                                );
test("pop"                  , [], true                          );

// Basic stack manipulation + d
// TODO

// Choice
test("true    1 2 choice", [1]);
test("false   1 2 choice", [2]);
// Tested against Thun's implementation - this is how it works
test("3       1 2 choice", [1]); // things that are truthy: nonzero numbers...
test("-1      1 2 choice", [1]); // ...including negative ones,
test("{1}     1 2 choice", [1]); // ...nonempty sets...
test("[dup]   1 2 choice", [1]); // ...nonempty arrays...
test('"foo"   1 2 choice', [1]); // ...and strings...
test('""      1 2 choice', [1]); // ...including empty ones!
test("0       1 2 choice", [2]); // things that are falsey: zero...
test("{}      1 2 choice", [2]); // ...empty sets...
test("[]      1 2 choice", [2]); // ...and empty arrays
test("[false] 1 2 choice", [1]); // Here are some things that are truthy but might not look it
test("[[]]    1 2 choice", [1]);
test("'0      1 2 choice", [1]);
test('"0"     1 2 choice', [1]);
test('"[]"    1 2 choice', [1]);
test('"false" 1 2 choice', [1]);
test("        1 2 choice", [], true);
test("0       1   choice", [], true);

// Boolean operators behave strangely in Joy.
// For integers, `xor` seems to test inequality.
// `and`, `or`, and `not` use 0 = falsey, everything else = truthy.
// TODO implement all that stuff - for now, Boolean operators are limited to bools and sets
test("1 2 and", [], true);

test("true  true  and", [true] );
test("true  false and", [false]);
test("false true  and", [false]);
test("false false and", [false]);
test("true  true  or ", [true] );
test("true  false or ", [true] );
test("false true  or ", [true] );
test("false false or ", [false]);
test("true  true  xor", [false]);
test("true  false xor", [true] );
test("false true  xor", [true] );
test("false false xor", [false]);
test("true  not", [false]);
test("false not", [true ]);

test("{1 2} {2 3} and", [new Set([2])]);
test("{1 2} {2 3} or ", [new Set([1,2,3])]);
test("{1 2} {2 3} xor", [new Set([1,3])]);

// Arithmetic
test("1 2  +", [3]);
test("2 1  -", [1]);
test("1 2  -",[-1]);
test("2 3  *", [6]);
test("2 -3 *",[-6]);
test("4 2  /", [2]);
// TODO: `rem`, `div`, added floor division instruction `//`
// TODO: failure tests 

// More math
test("12  sign", [1]);
test("-12 sign", [-1]);
test("0   sign", [0]);
test("12   neg", [-12]);
test("-12  neg", [12]);
test("123  abs", [123]);
test("-123 abs", [123]);
test("-0   abs", [0]);
test("0   acos", [Math.acos(0)]);
test("0   asin", [Math.asin(0)]);
test("0   atan", [Math.atan(0)]);
test("0 2 atan2",[Math.atan2(2,0)]);
// TODO: ceil
test("123  cos", [Math.cos(123)]);
test("12  cosh", [Math.cosh(12)]);
test("12   exp", [Math.E ** 12]);
// TODO: floor...trunc
// TODO: failure tests

// List operations
test("1 [2 3] unstack", [2, 3]);

test("1 [] cons", [[1]]);
test("1 2 3 [] cons cons cons", [[1, 2, 3]])
test("1 2 3 [] cons cons [] cons cons", [[1, [2, 3]]])
test("'a \"bcd\" cons", ["abcd"]);
test("1 {} cons", [new Set([1])])
test("[] 1 cons", [], true)
test("[] 1 swons", [[1]]);
test("[1 2 3] first", [1]);
test('"123" first', ["1"]);
test("1 first", [], true)
test("1 2 3 [] cons cons cons rest", [[2, 3]]);
test('"123" rest', ["23"])
test("[2 3] 1 at", [3]);
test("1 [2 3] of", [3]);

// TODO: uncons, unswons

test("1 [] cons 2 [] cons concat", [[1, 2]])

// Basic errors
test("an_instruction_that_does_not_and_will_never_exist", [], true);

// Terms, i, x, dip
test("[1] i"    , [1]);
test("[[1] i] i", [1]);
test("1 [] cons x", [1, [1]]);
test("1 x", [], true)
test("1 2 [dup] dip", [2, 1, 1]);

// n-aries, cleave
// TODO: what if the function pushes more than one element onto the stack?
test("1 2 [+] nullary", [3, 2, 1]);
test("1 2 [+] unary", [3, 1]);
test("1 2 [+] binary", [3]);
test("1 2 3 [+] binary", [5, 1]);
test("1 2 3 [+] ternary", [5]);
test("1 2 3 4 [+] ternary", [7, 1]);
test("1 [2 +] [3 +] cleave", [4, 3]);

// map
test("[1 2 3] [1 +] map", [[2, 3, 4]]);
test("[1 2 3] [+] map", [], true);
test("1 2 3 [1 +] map", [], true);

// Recursive combinators. TODO: more
test("5 [null] [succ] [dup pred] [i *] genrec", [120]);
test("[3 4 1 5 2] [small] [] [uncons [>] split] [enconcat] binrec", [1,2,3,4,5])
test("6 [null] [succ] [dup pred] [*] linrec", [720])
test("[1 2 3 4 5] [rest null] [first] [rest] tailrec", [5]);

// infra
test("[false [not] infra dup rest cons] [not] infra dup rest cons", 
	[[[true, [Symbol.for("not")], Symbol.for("infra"), Symbol.for("dup"), Symbol.for("rest"), Symbol.for("cons")]
	, [Symbol.for("not")], Symbol.for("infra"), Symbol.for("dup"), Symbol.for("rest"), Symbol.for("cons")]]);

// times
test("0 5 [1 +] times", [5]);

// split
test("[3 1 4 2] uncons [>] split", [[4], [1, 2], 3]);
// recursive quicksort
test(`DEFINE qsort == 
  [small]
  []
  [uncons [>] split qsort [qsort] dip enconcat]
  ifte.

[3 5 4 1 2] qsort`, [[1,2,3,4,5]]);

// Some simple programs
test("DEFINE factorial == [0 =] [pop 1] [dup 1 - factorial *] ifte. 5 factorial", [120])
test("5 [[pop 0 =] [pop pop 1] [[dup 1 -] dip i *] ifte] [dup cons] swap concat dup cons i", [120])

// Some programs from the documentation
test(`DEFINE
uncons2   ==  [uncons ] dip uncons  swapd;
unswons2  ==  [unswons] dip unswons swapd;
merge ==
        [ [ [null] [pop] ]
          [ [pop null] [swap pop] ]
          [ [unswons2 <] [[uncons] dip] [cons] ]
          [ [unswons2 >] [uncons swapd] [cons] ]
          [ [uncons2] [cons cons] ] ]
        condlinrec.
[1 3 5] [2 4 6] merge`, [[1,2,3,4,5,6]]);

test(`DEFINE gcd  ==
	[ 0 >]
	[ dup rollup rem ]
	while
	pop.

18 12 gcd 991 997 gcd`, [1, 6]);

// http://cubbi.com/fibonacci/joy.html
// 1A: Naive binary recursion
// 2A-3: Data structure - simple list
test("DEFINE fib == [1 1] swap [[[+] nullary] infra] times 1 at. 6 fib", [13]);
// 2B: Simple recursion
test("DEFINE fib == [1 1] dip [small] [pop swap pop] [pred [dup [swap] dip +] dip] tailrec. 6 fib", [13]);
// 2C: Non-recursive loop
test("DEFINE fib == [0 1] dip [swap [+] unary] times popd. 6 fib", [13])
// 3A: Matrix equation
// 3B: Fast recursion
test(`DEFINE fib ==
 [[[2 <][pop 1 1]] [[2 =][pop 2 1]]
  [[2 rem 1 =] [pred 2 /] [
   dupd dupd dupd dup [+ *] dip swapd dup
   [* +] dip dup * rolldown dup * + ]]
  [[2 rem 0 =] [2 / pred] [
   dupd dupd dup [+ dup dup * rolldown dup * + rotate] dip
   dupd * rollup * + ]]
 [[]] ] condlinrec pop.
 6 fib`, [13]);
// 3C: Binet's formula
test("DEFINE fib == 1 5 sqrt dup rollupd + 2 / swap succ dupd swap dupd 1 swap - swap pow rollup pow swap - swap / trunc.\
	6 fib", [13]);

// https://hypercubed.github.io/joy/html/jp-nestrec.html
test(`DEFINE 
	    r-ack == 
		[ [ [pop null]  popd succ ] 
		  [ [null]  pop pred 1 r-ack ] 
		  [ [dup pred swap] dip pred r-ack r-ack ] ] 
		cond. 
	2 3 r-ack`, [9]);
test(`DEFINE 
	    r-hamilhyp == 
		[ null ] 
		[ pop ] 
		[ dup rollup pred       r-hamilhyp 
		  dupd cons swap pred   r-hamilhyp ] 
		ifte.
	[] 3 r-hamilhyp`, [[1,2,1,3,1,2,1]]);
test(`DEFINE 
	    x-fact == 
		[ [ pop null ] 
		  [ pop pop 1] 
		  [ [dup pred] dip x *] 
		  ifte ] 
		x. 
	[ 0 1 2 3 4 5 6 ] [x-fact] map`, [[1,1,2,6,24,120,720]]);
test(`DEFINE
		twice-x == dup [x] dip x;
		x-mcc91 == 
		[ [ pop 100 > ] 
		  [ pop 10 - ] 
		  [ [11 +] dip twice-x ] 
		  ifte ] 
		x. 
	[ -7 42 99 100 101 102 345 ]  [x-mcc91]  map`, [[91,91,91,91,91,92,335]]);
test(`DEFINE
		twice-x == dup [x] dip x;
		x-ack == 
			[ [ [ [pop pop null]  pop popd succ ] 
			    [ [pop null]  [pop pred 1] dip x ] 
			    [ [[dup pred swap] dip pred] dip twice-x ] ] 
			cond ] 
			x.
	[ [3 0] [3 1] [3 2] ]   [i x-ack]  map`, [[5,13,29]]);
test(`DEFINE
	    y ==
		[dup cons] swoncat dup cons i;
	    twice-i ==
		dup [i] dip i.
	DEFINE
	    y-ack ==
		[ [ [ [pop pop null]  pop popd succ ]
		    [ [pop null]  [pop pred 1] dip i ]
		    [ [[dup pred swap] dip pred] dip twice-i ] ]
		cond ]
		y.
	[ [3 0] [3 1] [3 2] ]   [i y-ack]  map`, [[5,13,29]]);
// up to 'Partially explicit recursion'