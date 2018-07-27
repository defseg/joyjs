joy_tests = [];
function test(a, b, c = false) {
    joy_tests.push(() => _test(a, b, c));
}

// Basic objects
test("1"    , [1]                );
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

// Basic errors
test("dup"      , [], true);
test("pop"      , [], true);
test("1 pop dup", [], true);
test("an_instruction_that_does_not_and_will_never_exist", [], true);

// Terms and i
test("[1] i"    , [1]);
test("[[1] i] i", [1]);

// dip
test("1 2 [dup] dip", [2, 1, 1]);

// Recursive combinators
test("5 [null] [succ] [dup pred] [i *] genrec", [120]);