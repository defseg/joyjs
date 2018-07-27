joy_tests = [];
function test(a, b, c = false) {
    joy_tests.push(() => _test(a, b, c));
}

// Basic objects
test("1"    , [1]                );
test("1.5"  , [1.5]              );
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
// TODO add tests and implement this - maybe read the source of Thun's interpreter to see what's going on
// TODO Boolean operators on sets
// TODO implement these at all - low priority, so I'll hold off for now
// test("true  true  and", [true] );
// test("true  false and", [false]);
// test("false true  and", [false]);
// test("false false and", [false]);
// test("true  true  or ", [true] );
// test("true  false or ", [true] );
// test("false true  or ", [true] );
// test("false false or ", [false]);
// test("true  true  xor", [false]);
// test("true  false xor", [true] );
// test("false true  xor", [true] );
// test("false false xor", [false]);
// test("true  not", [false]);
// test("false not", [true ]);

// Arithmetic
test("1 2  +", [3]);
test("2 1  -", [1]);
test("1 2  -",[-1]);
test("2 3  *", [6]);
test("2 -3 *",[-6]);
test("4 2  /", [2]);


// Basic errors
test("an_instruction_that_does_not_and_will_never_exist", [], true);

// Terms and i
test("[1] i"    , [1]);
test("[[1] i] i", [1]);

// dip
test("1 2 [dup] dip", [2, 1, 1]);

// Recursive combinators
test("5 [null] [succ] [dup pred] [i *] genrec", [120]);