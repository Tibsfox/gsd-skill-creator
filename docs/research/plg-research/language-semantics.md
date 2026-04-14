# Prolog: Language Semantics and Core Concepts

*A deep dive into the syntax, semantics, and distinctive mental model of Prolog*

---

## Table of Contents

1. [The Declarative Vision](#1-the-declarative-vision)
2. [Terms — The Universal Data Structure](#2-terms--the-universal-data-structure)
3. [Unification](#3-unification)
4. [SLD Resolution and Proof Search](#4-sld-resolution-and-proof-search)
5. [The Cut (!)](#5-the-cut-)
6. [Negation as Failure](#6-negation-as-failure)
7. [Lists and Recursion](#7-lists-and-recursion)
8. [Arithmetic](#8-arithmetic)
9. [Definite Clause Grammars (DCGs)](#9-definite-clause-grammars-dcgs)
10. [Meta-programming](#10-meta-programming)
11. [Modules and Namespaces](#11-modules-and-namespaces)
12. [Exception Handling](#12-exception-handling)
13. [The Gotchas Section](#13-the-gotchas-section)
14. [A Gallery of Small Classic Programs](#14-a-gallery-of-small-classic-programs)

---

## 1. The Declarative Vision

### 1.1 Algorithm = Logic + Control

In 1979, Robert Kowalski published a short paper titled "Algorithm = Logic + Control" that quietly reframed the entire discipline of programming. His claim was deceptively simple: every algorithm can be decomposed into two orthogonal components:

- **Logic**: *what* the problem is — the facts, relations, and rules that define a solution
- **Control**: *how* the search for a solution should proceed — the strategy, the order, the pruning

Conventional programming languages fuse these two concerns inseparably. When you write a `for` loop in C, you are simultaneously specifying the logical structure of the computation *and* dictating its execution order. If you later realize a different evaluation order would be more efficient, you must rewrite the logic itself.

Prolog takes the radical position that the logic alone should be sufficient to define the program, and that the control can — at least in principle — be supplied by a general-purpose theorem prover. You write down what you know; Prolog figures out how to derive what you ask.

This is the declarative dream. In its purest form: **a Prolog program is a set of logical axioms, and running it is asking the system to prove a theorem.**

```prolog
% Facts: Things we know
parent(tom, bob).
parent(tom, liz).
parent(bob, ann).
parent(bob, pat).
parent(pat, jim).

% Rule: A general statement of what grandparenthood means
grandparent(X, Z) :- parent(X, Y), parent(Y, Z).
```

Now ask a question:

```prolog
?- grandparent(tom, X).
X = ann ;
X = pat ;
false.
```

You never told Prolog *how* to find grandchildren. You told it what a grandparent is. The system figured out the rest.

### 1.2 Programming by Stating Facts and Rules

The mental shift required to think in Prolog is real and, for most programmers, substantial. In imperative languages you spend your days writing *recipes*: "first do this, then do that, if such-and-such then jump back." In functional languages you spend your days writing *transformations*: "this input maps to that output via this composition of functions." In Prolog you write *definitions*: "here is what it means for X to be related to Y."

Consider the problem of defining the length of a list. In Python:

```python
def length(lst):
    count = 0
    for _ in lst:
        count += 1
    return count
```

This is a recipe. Start at zero, walk the list, increment. In Haskell:

```haskell
length [] = 0
length (_:xs) = 1 + length xs
```

This is a transformation. An empty list maps to zero; a cons cell maps to one plus the length of its tail. In Prolog:

```prolog
length([], 0).
length([_|T], N) :- length(T, N0), N is N0 + 1.
```

This is a *definition of the relation* between a list and its length. Notice the subtle difference: `length/2` is not a function from lists to numbers. It is a *relation* that holds between a list and a number whenever the number is the length of the list. You can ask "what is the length of `[a,b,c]`?" — but in principle you could also ask "what list has length 3?" (Prolog's answer is infinite, but that is a separate issue we will address in §7.)

The shift is from *how do I compute this?* to *what does this mean?* And it is this shift — more than any syntactic novelty — that makes Prolog both powerful and alien.

### 1.3 Horn Clauses as the Computational Model

Prolog's logical foundation is a specific, restricted fragment of first-order predicate logic called **Horn clauses**, named after the logician Alfred Horn who studied them in 1951.

A Horn clause is a disjunction of literals in which *at most one* literal is positive. In the notation of logic:

$$\neg p_1 \lor \neg p_2 \lor \cdots \lor \neg p_n \lor q$$

This is logically equivalent to an implication:

$$(p_1 \land p_2 \land \cdots \land p_n) \to q$$

Which, in Prolog syntax, is written:

```prolog
q :- p1, p2, ..., pn.
```

Read as: "q is true if p1 and p2 and ... and pn are all true." The head of the rule is on the left of `:-`; the body is on the right. A clause with no body (`q.`) is a **fact** — an unconditional assertion. A clause with no head (`:- p1, p2.`) is a **query** or **goal**.

Why this specific fragment? Because Horn clauses have an enormously useful property: **SLD resolution** (which we will explore in §4) is a sound and complete proof procedure for Horn clause logic, and — crucially — it can be implemented efficiently. Full first-order logic is undecidable in general; Horn clause logic, while still semi-decidable, admits a procedural reading that makes it tractable.

The trade-off is expressiveness. In full first-order logic you can write things like "for every X, either P(X) or Q(X)." In Horn clauses you cannot express disjunction in the head — you can only say "if such-and-such, then P(X)." This limitation is sometimes a real pain, but in exchange you get a language that actually runs.

### 1.4 Prolog's Unique Corner

Let us map out the space of programming paradigms and see where Prolog sits:

| Paradigm     | Computation is… | Canonical example |
|--------------|-----------------|-------------------|
| Imperative   | State mutation  | C, Java           |
| Functional   | Value transformation | Haskell, ML   |
| OO           | Message passing | Smalltalk, Ruby   |
| Logic        | Proof search    | Prolog, Mercury   |
| Dataflow     | Stream composition | Lucid, Esterel |
| Concurrent   | Process interaction | Erlang, Go    |

Prolog is nearly alone in its corner. Its closest neighbors are other logic languages — Mercury adds types and modes, Datalog restricts recursion and drops function symbols for decidability, ASP replaces SLD with stable model semantics. But all of these share Prolog's fundamental stance: **the program is a logical theory, and running it is asking a question that the system tries to prove.**

This is not merely a difference of syntax. It produces a qualitatively different experience:

- You debug by asking whether your rules actually capture your intent, not by tracing execution.
- You do not distinguish between inputs and outputs at the definition site — the same predicate can be run in multiple modes.
- You get backtracking for free, and with it a natural language for search and constraint problems.
- You hit walls that do not exist in other languages (infinite loops from left recursion, the occurs check problem, floundering negation).

Prolog is a language for a particular kind of problem. When the problem fits — parsing, constraint solving, symbolic reasoning, expert systems, natural language — Prolog feels like cheating. When it doesn't fit, Prolog feels like trying to hammer a nail with a sextant. The skill is knowing which is which.

---

## 2. Terms — The Universal Data Structure

Everything in Prolog is a **term**. Data is a term. Code is a term. A query is a term. Prolog is profoundly homoiconic in a way that even Lisp has to envy — not because terms are trivially representable (they are) but because the language never draws a line between syntax and semantics, between program and data.

The grammar of terms is tiny. There are exactly four kinds of term:

1. **Atoms** — symbolic constants
2. **Numbers** — integers and floats
3. **Variables** — placeholders that can be bound
4. **Compound terms** — structured data built from a functor and arguments

That's it. Lists, strings, operators, tuples, records — everything you might expect to be a distinct type in another language — is, in Prolog, built out of these four primitives.

### 2.1 Atoms

An atom is an unanalyzable symbolic constant. It has no internal structure; it is just a name that equals itself and nothing else. Atoms are written in three ways:

```prolog
% Lowercase identifier
foo
bar
my_atom

% Symbolic characters (if they form a symbolic atom)
+
-
=>
:-

% Quoted — for anything else
'Hello, World!'
'foo bar baz'
''           % the empty atom
```

Quoted atoms are just atoms with unusual spellings. `'foo'` and `foo` are the exact same atom — the quotes are only a syntactic device to escape characters that would otherwise not be allowed. `'Foo'` and `foo` are *different* atoms, because the capital F is part of the name.

Why the lowercase convention? Because in Prolog, an unquoted identifier starting with an uppercase letter is a *variable*, not an atom. This single lexical rule has huge consequences for how programs look:

```prolog
likes(alice, bob).       % alice and bob are atoms (constants)
likes(X, Y).             % X and Y are variables
```

The distinction is load-bearing. Forgetting it — writing `likes(Alice, Bob)` when you meant `likes(alice, bob)` — produces a clause that is vacuously true for any two people in your database, because `Alice` and `Bob` are universally quantified variables, not proper names.

### 2.2 Numbers

Prolog has integers and floats. Modern Prologs (SWI, SICStus, GNU) support arbitrary-precision integers:

```prolog
?- X is 2^1000.
X = 10715086071862673209484250490600018105614048117055336074437503883703510511249361224931983788156958581275946729175531468251871452856923140435984577574698574803934567774824230985421074605062371141877954182153046474983581941267398767559165543946077062914571196477686542167660429831652624386837205668069376.
```

Integers and floats are distinct types, and arithmetic between them produces a float:

```prolog
?- X is 1 + 2.       % X = 3 (integer)
?- X is 1 + 2.0.     % X = 3.0 (float)
?- X is 1 / 2.       % X = 0.5 (float!) or X = 0 (in some systems with //)
?- X is 1 // 2.      % X = 0 (integer division)
```

One subtlety: a number written with a leading minus sign is a compound term in some Prolog readers — `-3` is actually `-(3)`, the unary minus operator applied to 3. Usually this doesn't matter, but it can bite you in meta-programming when you expect `is_integer(-3)` to succeed and it fails because `-3` is compound.

### 2.3 Variables

A Prolog variable is not an assignable slot. It is a *placeholder* for a term that may, at some point during proof search, become *bound* to a specific value. Once bound, a variable cannot be reassigned within the same proof branch — Prolog has *logical* variables, not mutable ones.

Variables are written starting with an uppercase letter or an underscore:

```prolog
X
Y
Result
_foo
_              % the anonymous variable
```

The anonymous variable `_` is special: every occurrence of `_` in a clause is a *distinct* variable. You use it to say "I don't care about this value":

```prolog
% Is the list non-empty?
non_empty([_|_]).
```

The two `_`s in `[_|_]` are different variables — the pattern matches any cons cell regardless of head or tail. If you had written `[X|X]` instead, you would have matched only lists whose head equals their tail, which is not what you want.

Variables with an underscore prefix (but not just `_`) are a kind of half-warning: they are named so you can document intent, but the compiler will not warn you if they are used only once:

```prolog
loop(_N) :- true.   % _N documents "a number we are ignoring"
```

Without the underscore, most Prologs will warn about singleton variables, because writing a variable only once in a clause is usually a bug — a misspelling of a variable you meant to reference elsewhere.

### 2.4 Compound Terms

A compound term consists of a **functor** (an atom) and a sequence of arguments (terms), written:

```prolog
functor(arg1, arg2, ..., argN)
```

The functor together with the number of arguments is called the **functor indicator**, written `name/arity`. So `parent(tom, bob)` has functor indicator `parent/2`. Prolog treats `foo/2` and `foo/3` as completely unrelated — arity is part of the identity of a functor, like overloading by arity.

```prolog
person(alice, 30, engineer)           % person/3
tree(node(1), node(2), node(3))       % tree/3, with three node/1 subterms
point(1.0, 2.0)                       % point/2
```

Compound terms are arbitrarily nestable:

```prolog
date(2026, april, 9)
appointment(date(2026, april, 9), time(14, 30), meeting(foxy, cedar))
```

There is no distinction between "constructors" and "functions" — every compound term is just a piece of structure. `date(2026, 4, 9)` is not the result of calling a `date` function; it is literally the term `date(2026, 4, 9)`. If you want to compute something from it, you write a predicate that relates it to the computed value.

### 2.5 Lists as Sugar for `.(H, T)` / `[H|T]`

Lists are so fundamental that Prolog provides special syntax for them, but underneath the sugar they are ordinary compound terms.

The canonical representation is a cons cell with functor `.` (traditionally, though modern ISO Prolog uses the functor `'[|]'` — a hideous but unambiguous name). An empty list is the atom `[]`. A non-empty list is `.(Head, Tail)`, where `Tail` is itself a list.

Nobody writes lists that way. You write them with bracket syntax:

```prolog
[]                      % empty list
[a]                     % equivalent to .(a, [])
[a, b]                  % equivalent to .(a, .(b, []))
[a, b, c]               % equivalent to .(a, .(b, .(c, [])))
[H|T]                   % a list with head H and tail T
[a, b, c | Rest]        % a list starting with a, b, c followed by Rest
```

The `|` (pipe) in a list literal separates the already-listed head elements from the tail. This is how you deconstruct lists in pattern matching:

```prolog
head([H|_], H).          % extracts the head
tail([_|T], T).          % extracts the tail
first_two([A, B|_], A, B).  % extracts the first two elements
```

Because lists are ordinary terms, they are not homogeneous. A list can contain anything:

```prolog
[1, foo, bar(baz), [1,2,3], "hello", X]
```

This is both a feature and a curse. It gives you enormous flexibility but denies you the compile-time type checks that a statically typed list would provide.

### 2.6 Strings — The Messy History

Prolog and strings have had a rocky relationship. The problem is historical: the language predates any clear consensus on how strings should be represented, and different Prolog systems made different choices.

There are, depending on how you count, four or five different things that might reasonably be called a "string":

**1. List of character codes (classical Prolog).** A string is a list of integers, where each integer is the ASCII or Unicode code point of a character. The string `"hello"` is `[104, 101, 108, 108, 111]`. This is what `"..."` produces in traditional Prolog. Edinburgh Prolog, early SWI-Prolog, and GNU Prolog all default(ed) to this interpretation.

```prolog
?- X = "hello".
X = [104, 101, 108, 108, 111].
```

**2. List of one-character atoms.** Some systems chose to make strings into lists of single-character atoms: `"hello"` = `[h, e, l, l, o]`. Each `h`, `e`, etc., is an atom. This is what Quintus Prolog did, and it is what `atom_chars/2` produces.

**3. Atoms.** Treat the entire string as a single atom: `hello`. This is the cheapest representation — one term, no traversal overhead — but you lose the ability to cheaply decompose it, and you have to quote anything with spaces or special characters.

**4. String objects (SWI-Prolog's `string` type).** SWI-Prolog introduced a distinct `string` type — a primitive, like `atom` and `integer`, specifically for text. In this system, `"hello"` produces a `string`, not a list. Strings are cheap to concatenate, cheap to print, and they are distinct from both lists and atoms. This broke portability with older code, and SWI provides a flag (`double_quotes`) to control the interpretation of `"..."`.

**5. ISO Prolog `string` notation.** The 1995 ISO standard did not settle the issue. It left the meaning of `"..."` implementation-defined, and provided a flag to configure it.

In practice, a modern SWI-Prolog program written today uses SWI strings for textual data. A portable classical program uses character-code lists. A legacy Quintus program uses character-atom lists. A program that interfaces with external systems often converts between them with built-ins like `atom_codes/2`, `atom_chars/2`, `string_codes/2`, `string_chars/2`, `atom_string/2`, and friends:

```prolog
?- atom_codes(hello, Codes).
Codes = [104, 101, 108, 108, 111].

?- atom_chars(hello, Chars).
Chars = [h, e, l, l, o].

?- atom_string(hello, S).
S = "hello".

?- string_chars("hello", Cs).
Cs = [h, e, l, l, o].
```

If you are new to Prolog, this is one of the most confusing things you will encounter. Be aware that "string handling in Prolog" is a dialect-specific topic and that you need to know what your system does.

### 2.7 Operator Syntax

Prolog allows atoms to be declared as **operators**, which lets you write compound terms in infix, prefix, or postfix notation instead of the usual `functor(args...)` form.

`X + Y` is not some special syntax for addition. It is just the compound term `+(X, Y)` written with the infix convention because `+` has been declared as an operator. The same goes for `:-`, `,`, `;`, `=`, `->`, and dozens of others.

You can see the underlying structure:

```prolog
?- X = 1 + 2.
X = 1+2.

?- X = 1 + 2, X =.. L.
X = 1+2,
L = [+, 1, 2].
```

The `=..` operator (pronounced "univ") decomposes a compound term into a list of its functor and arguments. `1+2 =.. L` gives `L = [+, 1, 2]`, proving that `1+2` is really the compound term `+(1, 2)`.

You declare your own operators with the `op/3` directive:

```prolog
:- op(700, xfx, likes).

% Now you can write:
fred likes mary.
% ...which is the same as:
likes(fred, mary).
```

The arguments to `op/3` are:

1. **Priority**: an integer from 0 to 1200. Lower priority binds tighter. `*` has priority 400 and `+` has priority 500, so `1 + 2 * 3` parses as `1 + (2 * 3)`.

2. **Associativity type**: a cryptic three-character pattern:
   - `xfx` — infix, non-associative (cannot chain: `a xfx b xfx c` is a parse error)
   - `xfy` — infix, right-associative (`a xfy b xfy c` = `a xfy (b xfy c)`)
   - `yfx` — infix, left-associative (`a yfx b yfx c` = `(a yfx b) yfx c`)
   - `fx` — prefix, non-associative
   - `fy` — prefix, associative
   - `xf` — postfix, non-associative
   - `yf` — postfix, associative

   The `f` marks the position of the operator. `x` and `y` mark the positions of the arguments, with `x` meaning "strictly lower priority" and `y` meaning "less than or equal." This determines chaining behavior.

3. **Operator name**: the atom to declare as an operator (or a list of atoms).

Operators are a style choice. You can write any Prolog program without ever defining your own operator, and many Prolog style guides discourage the practice because custom operators make code harder for newcomers to read. But used judiciously, they can make domain-specific notation beautiful. Consider a DCG (which we will meet in §9):

```prolog
sentence --> noun_phrase, verb_phrase.
```

That `-->` is a user-defined operator — syntax to make grammar rules look like grammar rules.

### 2.8 Ground vs Non-Ground Terms

A term is **ground** if it contains no variables. It is **non-ground** if it contains at least one variable.

```prolog
foo(1, 2, 3)          % ground
foo(X, 2, 3)          % non-ground
[1, 2, 3]             % ground
[1, 2, X]             % non-ground
foo                   % ground (atom)
X                     % non-ground (variable)
```

The distinction matters because some operations only make sense on ground terms. Arithmetic evaluation with `is/2` requires the right-hand side to be ground at evaluation time:

```prolog
?- X is Y + 1.
ERROR: is/2: Arguments are not sufficiently instantiated.
```

You can test groundness with `ground/1`:

```prolog
?- ground(foo(1,2)).
true.
?- ground(foo(X,2)).
false.
```

A program that works in *all modes* — that is, produces useful answers regardless of which arguments are ground at the time of call — is said to be **pure** or **relational**. Pure predicates are the declarative ideal, and we will see in §7 how list predicates like `append/3` achieve this. Much of the art of Prolog programming is knowing when you can get away with relational code and when you must commit to a particular mode of use.

---

## 3. Unification

Unification is the single most important mechanism in Prolog. Everything rests on it. It is how parameters are passed, how pattern matching works, how queries are answered, how data flows between clauses. Understanding unification is understanding Prolog.

### 3.1 What Unification Is

Given two terms, unification asks: *is there a way to bind the variables in these terms so that they become syntactically identical?* If yes, unification succeeds and produces the bindings. If no, unification fails.

Examples:

```prolog
?- foo(1, 2) = foo(1, 2).
true.
% Identical terms unify trivially.

?- foo(X, 2) = foo(1, Y).
X = 1,
Y = 2.
% We can make them identical by binding X=1 and Y=2.

?- foo(X, X) = foo(1, 2).
false.
% We would need X=1 AND X=2 simultaneously. Impossible.

?- [H|T] = [a, b, c].
H = a,
T = [b, c].
% Standard list destructuring.

?- X = foo(X).
X = foo(foo(foo(foo(foo(...))))).
% A variable can unify with a term containing it, producing a cyclic term.
% (More on this under "occurs check.")
```

The `=/2` operator in Prolog is *exactly* unification. `X = Y` means "unify X and Y and make the bindings available." It is not assignment. It is not equality testing. It is the process of finding a substitution that makes two terms syntactically equal.

### 3.2 The Robinson Unification Algorithm

In 1965, J. Alan Robinson published a paper introducing the resolution principle for automated theorem proving. Central to resolution was a procedure he called **unification** — a general-purpose algorithm for finding the most general substitution that makes two terms identical. This algorithm is the computational heart of Prolog.

The algorithm operates structurally:

1. **If both terms are identical constants (atoms or numbers)**, unification succeeds trivially with no new bindings.

2. **If one term is an unbound variable**, bind it to the other term. Succeed.

3. **If both terms are variables**, bind one to the other. Succeed. (They become aliases — binding one subsequently binds the other.)

4. **If both terms are compound with the same functor and same arity**, recursively unify corresponding arguments. Succeed only if all sub-unifications succeed.

5. **In any other case**, fail.

Here is the algorithm in pseudo-code:

```
unify(T1, T2):
    if T1 is a bound variable:
        return unify(binding_of(T1), T2)
    if T2 is a bound variable:
        return unify(T1, binding_of(T2))
    if T1 is an unbound variable:
        bind T1 to T2
        return success
    if T2 is an unbound variable:
        bind T2 to T1
        return success
    if T1 and T2 are both atomic and equal:
        return success
    if T1 and T2 are both compound with same functor/arity:
        for each argument pair (A1, A2):
            if unify(A1, A2) fails:
                return failure
        return success
    return failure
```

That's it. It's astonishingly simple, and yet it generalizes pattern matching, parameter passing, and equation solving into a single operation.

### 3.3 Most General Unifier (MGU)

When two terms can be unified, there may be infinitely many substitutions that make them equal. For example, consider `foo(X) = foo(Y)`. The substitution `{X = a, Y = a}` works. So does `{X = b, Y = b}`. So does `{X = foo(baz), Y = foo(baz)}`. But the substitution `{X = Y}` is more general than all of these — it captures the essential constraint without committing to a specific value.

The **most general unifier** (MGU) is the "smallest" or "least committed" substitution that unifies two terms. Formally: any other unifier can be obtained by composing the MGU with a further substitution.

Robinson's algorithm always produces an MGU when unification succeeds. This is why Prolog's variable bindings are non-committal: `X` is not bound to any specific value; it is bound only to the extent necessary to make the proof go through. Further constraints may pin it down later.

```prolog
?- foo(X, Y) = foo(A, B), X = 1, Y = hello.
X = A, A = 1,
Y = B, B = hello.
```

After the first unification, `X = A` and `Y = B` (aliasing). After the second, `X = 1`, which propagates to `A` through the alias. After the third, `Y = hello`, propagating to `B`.

### 3.4 The Occurs Check

Step 2 of the algorithm — "if one term is an unbound variable, bind it to the other term" — has a subtle problem. What if the "other term" *contains* that variable?

Consider unifying `X` with `foo(X)`:

```prolog
?- X = foo(X).
```

Naively applying the algorithm: bind `X` to `foo(X)`. But now `X` is bound to `foo(X)`, which contains `X`, which is bound to `foo(X)`, which contains `X`, which... you see the problem. The resulting term is infinite. It is not a well-formed first-order term at all.

The **occurs check** is the extra step that prevents this: before binding a variable to a term, check whether the variable occurs anywhere in the term. If it does, fail.

```
if T1 is an unbound variable:
    if T1 occurs in T2:
        return failure
    bind T1 to T2
    return success
```

This is the mathematically correct thing to do. Without it, unification is unsound — it can produce "solutions" that do not correspond to any first-order interpretation.

**So why doesn't Prolog do the occurs check?** Because it is expensive. The occurs check turns unification from an amortized constant-time operation (for most realistic cases) into a linear-time-in-term-size operation. For the vast majority of Prolog programs, the cases where the occurs check would actually matter never arise, and paying a linear cost on every unification would slow the language to a crawl.

The trade-off: Prolog's default unification is *unsound*. It can produce results that are not logically justified. But in practice this almost never bites, and the performance gain is enormous. The ISO standard provides `unify_with_occurs_check/2` for the cases where you need it:

```prolog
?- unify_with_occurs_check(X, foo(X)).
false.
```

Most modern Prologs also provide a flag to enable the occurs check globally, for correctness-critical applications.

**When does it bite?** Most often in meta-interpreters and in some theorem-proving applications. If you write a program that constructs terms from fragments of themselves, you may end up with cyclic terms that print weirdly and behave unpredictably:

```prolog
?- X = foo(X).
% SWI-Prolog shows: X = foo(X).
% And X is internally a cyclic structure.

?- X = foo(X), X == foo(X).
true.
% It even reports that X equals foo(X)...
```

Some Prologs (SWI in particular) explicitly support **rational trees** — cyclic terms as first-class citizens. In those systems, the absence of the occurs check is a feature, not a bug.

### 3.5 Unification vs Pattern Matching

If you come to Prolog from a functional language like Haskell or ML, unification will look like pattern matching. It is not pattern matching. Pattern matching is a restricted, one-directional form of unification.

In Haskell:

```haskell
length [] = 0
length (x:xs) = 1 + length xs
```

When you call `length [1, 2, 3]`, the runtime tries to match `[1, 2, 3]` against each pattern in turn. `[]` doesn't match. `(x:xs)` does — it binds `x = 1` and `xs = [2, 3]`. Notice that the *input* is a fully concrete value, and the *pattern* contains the variables. Information flows only one way: from the input into the pattern variables.

Prolog's unification is **bidirectional**. When Prolog matches the call `length([1,2,3], N)` against the head `length([_|T], N) :- length(T, N0), N is N0 + 1`, both sides can contain variables. The call `length([1,2,3], N)` has a ground first argument and a variable `N`; the head has variables in both positions. Unification binds variables on *both* sides to make them match.

This sounds like a small difference, but it has enormous consequences. Because unification is bidirectional, a Prolog predicate does not have fixed inputs and outputs. The same predicate can often be called in multiple "modes":

```prolog
append([], L, L).
append([H|T], L, [H|R]) :- append(T, L, R).

% Standard use: concatenate two lists
?- append([1,2], [3,4], X).
X = [1, 2, 3, 4].

% Splitting: given the concatenation, find the two parts
?- append(X, Y, [1,2,3]).
X = [],
Y = [1, 2, 3] ;
X = [1],
Y = [2, 3] ;
X = [1, 2],
Y = [3] ;
X = [1, 2, 3],
Y = [] ;
false.

% Checking: is this list the concatenation of those two?
?- append([1,2], [3,4], [1,2,3,4]).
true.

% Membership testing (indirect): does X occur in [1,2,3]?
?- append(_, [X|_], [1,2,3]).
X = 1 ;
X = 2 ;
X = 3.

% Suffix: find a suffix of [1,2,3,4] starting with 3
?- append(_, [3|Rest], [1,2,3,4]).
Rest = [4].
```

The *same three-line definition* serves all these purposes. That is the power of unification. There are no separate "split," "concatenate," "contains," "suffix," or "prefix" functions — there is only `append/3`, which expresses the relation, and the search engine figures out which variables to bind.

### 3.6 Two-Way Binding — The Time Travel Feeling

For programmers used to one-directional data flow, bidirectional unification produces a subtle, wonderful, disorienting sensation. You write a predicate that looks like a function from inputs to outputs, and then you discover you can run it backwards, or with the output as an input, or with both half-given and half-unknown.

Consider `length/2` again:

```prolog
length([], 0).
length([_|T], N) :- length(T, N0), N is N0 + 1.
```

This runs fine forward: `length([a,b,c], N)` gives `N = 3`. Can it run backward?

```prolog
?- length(L, 3).
ERROR: is/2: Arguments are not sufficiently instantiated.
```

Well, no — because `is/2` only goes forward. But if you use `succ/2` or constraint-arithmetic:

```prolog
length_cp([], 0).
length_cp([_|T], N) :- N > 0, N0 is N - 1, length_cp(T, N0).

?- length_cp(L, 3).
% infinite loop in some Prologs...
```

The pure version of `length/2` in SWI-Prolog's standard library actually does work in both directions:

```prolog
?- length(L, 3).
L = [_A, _B, _C].

?- length([a,b,c], N).
N = 3.
```

Note what happens in the first query. Prolog does not know what the *elements* of the list are, because no constraint has forced them to be anything in particular. But it knows the list has exactly three elements. So it produces a list of three fresh variables: `[_A, _B, _C]`. This is a kind of skeleton — the shape is determined, the contents are unknown. You can now fill in the contents by further unification:

```prolog
?- length(L, 3), L = [X, Y, Z], X = apple, Y = banana, Z = cherry.
L = [apple, banana, cherry],
X = apple,
Y = banana,
Z = cherry.
```

This is what I mean by "time travel." You posit a structure, constrain it, and Prolog figures out what the structure must be. You never had to *compute* anything step-by-step. You just stated what must be true, and the system derived the rest.

Here is another example — the most famous one. `append/3` running "backwards":

```prolog
?- append(X, Y, [1, 2, 3]).
X = [],      Y = [1, 2, 3] ;
X = [1],     Y = [2, 3] ;
X = [1, 2],  Y = [3] ;
X = [1, 2, 3], Y = [] ;
false.
```

You asked: "what pairs of lists, when appended, give `[1, 2, 3]`?" Prolog enumerated all four possibilities. You never wrote a `split` function. You didn't need to. The same definition that appends also splits, because unification is bidirectional and SLD resolution will try all possible bindings.

The first time you see this, it feels like cheating. The tenth time, it feels like a superpower. The hundredth time, it feels like the natural way to think about programs — and everything else starts to feel weirdly restrictive.

---

## 4. SLD Resolution and Proof Search

Prolog's execution model is a specific proof procedure called **SLD resolution**. The name is an acronym:

- **S**election rule
- **L**inear resolution
- **D**efinite clauses

Each letter refers to a specific restriction or choice that together make the procedure both complete (for the class of problems it addresses) and efficient enough to implement.

### 4.1 What Each Letter Means

**Definite clauses** are Horn clauses with exactly one positive literal. These are the rules and facts of a Prolog program. The restriction rules out full first-order logic and even general Horn clauses (goals with no positive literal are queries, not program clauses). Every program clause has a head — exactly one thing to prove — and a (possibly empty) body of preconditions.

**Linear resolution** means that at each step of the proof, you resolve the current goal against a single program clause, producing a new goal. You do not do the combinatorial exploration of every possible pair of clauses (which is what general resolution does). You just walk through your query, replacing each subgoal with the body of a matching clause, linearly.

**Selection rule** determines *which* subgoal in the current goal to work on next. Different selection rules give different proof procedures. Prolog's selection rule is fixed: always pick the leftmost subgoal.

Together: at each step, pick the leftmost subgoal, unify it with the head of some program clause, and replace it with the body of that clause. Repeat until the goal is empty (success) or no clause matches (failure — but with backtracking to try alternatives).

### 4.2 The Computation Tree

Consider this tiny program:

```prolog
parent(tom, bob).
parent(tom, liz).
parent(bob, ann).
parent(bob, pat).

grandparent(X, Z) :- parent(X, Y), parent(Y, Z).
```

And the query:

```prolog
?- grandparent(tom, G).
```

The SLD resolution process constructs a tree. The root is the initial goal: `?- grandparent(tom, G).` At each node, we pick the leftmost subgoal and look for program clauses whose head unifies with it. Each match creates a child.

```
?- grandparent(tom, G).
         |
         | (unify with grandparent(X,Z) :- parent(X,Y), parent(Y,Z))
         | giving X=tom, Z=G
         v
?- parent(tom, Y), parent(Y, G).
         |
         +-- (parent(tom, bob))  -> ?- parent(bob, G).
         |                              |
         |                              +-- (parent(bob, ann)) -> ?- true.  SUCCESS G=ann
         |                              |
         |                              +-- (parent(bob, pat)) -> ?- true.  SUCCESS G=pat
         |
         +-- (parent(tom, liz))  -> ?- parent(liz, G).
                                        |
                                        (no matching clauses — FAIL)
```

The tree has two successful leaves, corresponding to the two answers `G = ann` and `G = pat`. The branch through `parent(tom, liz)` fails because `liz` has no children in the database.

Prolog walks this tree by depth-first search. It goes all the way down the leftmost branch first, reports the first success (`G = ann`), and then — if you ask for more answers — backtracks to the most recent choice point and tries the next alternative, eventually finding `G = pat`. When no more alternatives remain, it reports `false` (or, in interactive use, the prompt returns).

### 4.3 Depth-First Left-to-Right — The Default Strategy

Prolog's search strategy is **depth-first, left-to-right**. This means:

- **Left-to-right**: when a rule body has multiple subgoals, they are tried from left to right. The leftmost subgoal is resolved first; its subgoals are then resolved (also left to right); only when those are done does the next subgoal in the original body get considered.

- **Depth-first**: when multiple clauses can match a subgoal, the one that appears earliest in the program is tried first. The entire subtree rooted at that choice is explored before any sibling choice is considered.

This strategy is not the only possibility. Breadth-first search would find all answers at shallower depths before going deeper. Iterative deepening would combine the memory efficiency of DFS with the completeness of BFS. Prolog chose DFS because it is fast, stack-efficient, and produces results in a predictable order.

The price: **DFS is incomplete for infinite search spaces.** If the leftmost branch of the tree is infinite, Prolog will follow it forever and never find answers on the right branches. This is the source of many Prolog infinite-loop bugs (left recursion in particular — we will see why in §13).

### 4.4 Why Order Matters in Practice

Here is where the pure declarative dream runs into reality. Logically, the order of subgoals in a rule body does not matter — conjunction is commutative. Logically, the order of clauses in a program does not matter. But operationally, Prolog's fixed left-to-right depth-first strategy makes both orders load-bearing.

**Subgoal order affects efficiency.** Consider finding all pairs of cousins:

```prolog
cousin(X, Y) :- parent(P1, X), parent(P2, Y), sibling(P1, P2).
```

If your `parent` database has 1,000 people and the `sibling` relation is sparse, this definition is fine. But you could also write:

```prolog
cousin(X, Y) :- sibling(P1, P2), parent(P1, X), parent(P2, Y).
```

Depending on the sizes of the relations, one order may be dramatically faster than the other. Put the most selective (smallest) goal first. This is the same principle as in SQL query optimization, except that Prolog does not do automatic reordering — you are the optimizer.

**Subgoal order affects termination.** Consider the classic:

```prolog
ancestor(X, Y) :- parent(X, Y).
ancestor(X, Y) :- parent(X, Z), ancestor(Z, Y).
```

vs

```prolog
ancestor(X, Y) :- parent(X, Y).
ancestor(X, Y) :- ancestor(Z, Y), parent(X, Z).
```

These definitions are logically equivalent. The second one is left-recursive: the first thing it does when looking for an ancestor is recursively look for another ancestor. In Prolog's DFS, this runs forever — it expands the recursive call before ever trying the base case.

**Clause order affects which answer comes first.** Consider:

```prolog
color(red).
color(green).
color(blue).

?- color(X).
X = red ;
X = green ;
X = blue.
```

The order of answers reflects the order of clauses. Change the program, change the order. This is sometimes what you want (put the "default" first) and sometimes a source of bugs (a test relies on a particular answer ordering).

**Clause order can change termination.** If a recursive clause appears before its base case, you can get into trouble:

```prolog
bad_length([_|T], N) :- bad_length(T, N0), N is N0 + 1.
bad_length([], 0).
```

Forward use works fine. But backward use — `?- bad_length(L, 3)` — may loop even in the "right" direction, because Prolog tries the recursive clause first, and there's nothing to stop the recursion from going infinitely deep before hitting the base case.

### 4.5 Choice Points and Backtracking

A **choice point** is a marker Prolog places internally whenever a goal has more than one possible matching clause. It records the current state (variable bindings, remaining goals) so that if the current branch fails, execution can be restored to that point and the next alternative can be tried.

```prolog
animal(dog).
animal(cat).
animal(fish).

legs(dog, 4).
legs(cat, 4).
legs(fish, 0).

four_legged(X) :- animal(X), legs(X, 4).
```

Query: `?- four_legged(X).`

1. Goal: `four_legged(X)`. Resolve against the single clause. New goal: `animal(X), legs(X, 4)`.
2. Goal: `animal(X), legs(X, 4)`. Leftmost is `animal(X)`. Three clauses match — *create a choice point*. Try the first: `X = dog`. New goal: `legs(dog, 4)`.
3. Goal: `legs(dog, 4)`. One clause matches (a fact). New goal: `true`. SUCCESS, report `X = dog`.
4. User asks for more answers. Backtrack to the most recent choice point (step 2). Try second alternative: `X = cat`. New goal: `legs(cat, 4)`.
5. Succeeds. Report `X = cat`.
6. Backtrack again. Try `X = fish`. New goal: `legs(fish, 4)`. `legs(fish, 0)` is the only clause, and `0 ≠ 4`. FAIL.
7. No more choices at step 2. No other choice points. Report `false`.

This is the rhythm of Prolog: forward motion, success, backtrack, try alternative, success, backtrack, try alternative, fail, report no more. The user (or the enclosing goal) drives it by asking for more answers or, more commonly, by using built-ins like `findall/3` that collect all answers automatically.

Choice points are also created by the disjunction operator `;`:

```prolog
mammal(X) :- cat(X) ; dog(X) ; whale(X).
```

This is equivalent to writing three clauses:

```prolog
mammal(X) :- cat(X).
mammal(X) :- dog(X).
mammal(X) :- whale(X).
```

The semicolon is just infix sugar for multiple clauses.

Choice points have a memory cost: each one stores enough state to resume the computation. In programs with deep backtracking, this can matter. The **cut** (§5) is the primary tool for eliminating choice points when you know they are unwanted.

---

## 5. The Cut (!)

The cut, written `!`, is Prolog's most controversial feature. It is an operational device — it has no logical meaning — that commits Prolog to choices made since entering the current clause. Used carefully, it makes programs faster and more correct. Used carelessly, it makes programs mysterious and fragile. Richard O'Keefe, in *The Craft of Prolog*, called it "the feature Prolog programmers are proudest of and most ashamed of."

### 5.1 What the Cut Does

When Prolog encounters a `!` while executing a clause body, two things happen:

1. Prolog discards all choice points created since the current clause was entered, up to and including the choice point that selected this clause.

2. Prolog continues executing the rest of the clause body.

In effect: once you pass a cut, you are committed. You cannot backtrack to try a different clause for the head, and you cannot backtrack to try different bindings for subgoals *before* the cut.

```prolog
max(X, Y, X) :- X >= Y, !.
max(_, Y, Y).
```

Read this carefully. The first clause says: the max of X and Y is X if X >= Y, and once we've confirmed that, commit. The second clause says: otherwise, the max is Y.

Without the cut:

```prolog
max(X, Y, X) :- X >= Y.
max(_, Y, Y).

?- max(3, 2, M).
M = 3 ;
M = 2.    % WRONG! Second clause also matches.
```

The second clause uses `_` for the first argument, so it matches any call. Backtracking into it produces a spurious second answer. The cut in the first clause prevents this: once `X >= Y` has been verified, the cut discards the choice point, and backtracking cannot try the second clause.

### 5.2 Green Cuts vs Red Cuts

Richard O'Keefe introduced a distinction between two kinds of cut that has become standard:

**Green cuts** are cuts that do not change the declarative meaning of the program. They are there purely for efficiency — to tell Prolog not to bother exploring alternatives that the programmer knows cannot succeed. Removing a green cut changes the performance but not the set of answers.

**Red cuts** are cuts that do change the declarative meaning. Without them, the program would give wrong answers (or more/fewer answers). Red cuts are operational band-aids that paper over a logically-incomplete definition.

The `max/3` example above is a **red cut**. Without the cut, the program gives two answers to `max(3, 2, M)`, and only one is correct. The cut is load-bearing.

A cleaner version uses two mutually exclusive conditions:

```prolog
max(X, Y, X) :- X >= Y.
max(X, Y, Y) :- X < Y.
```

This has no cut and gives the correct answer in both orders. It is *logically equivalent* to its meaning, whereas the red-cut version is only operationally correct.

Green cuts, by contrast, might look like this:

```prolog
member(X, [X|_]) :- !.
member(X, [_|T]) :- member(X, T).
```

Without the cut, `member/2` would find every position where `X` appears:

```prolog
?- member(1, [1, 2, 1]).
true ;
true ;
false.
```

With the cut, it just succeeds once:

```prolog
?- member(1, [1, 2, 1]).
true.
```

Is this a green cut? It depends. If you only ever use `member/2` to test membership (never to enumerate), the cut is green — it changes nothing declaratively, it just avoids redundant work. But if you call `member(X, [1,2,3])` to enumerate, the cut is red — it prunes legitimate answers. The moral: the color of a cut depends on how the predicate is used, not just on the code.

O'Keefe's rule of thumb: prefer green cuts. Avoid red cuts where possible by writing clauses with genuinely disjoint conditions. If you must use a red cut, document it clearly.

### 5.3 Pruning Search, Enforcing Determinism

Cuts serve two main purposes:

**1. Eliminating useless backtracking.** If you know that once a certain subgoal succeeds, no later goal in the body can usefully fail back through it, a cut prevents Prolog from doing the pointless work of trying alternatives.

```prolog
first_positive([X|_], X) :- X > 0, !.
first_positive([_|T], X) :- first_positive(T, X).
```

The cut says: if `X` is positive, we're done — don't backtrack into the second clause.

**2. Enforcing determinism.** Sometimes you want a predicate to succeed at most once, even if the logical definition would admit multiple successes. The cut lets you say "I've found an answer; stop."

```prolog
unique_member(X, L) :- member(X, L), !.
```

`member/2` can succeed multiple times if `X` is unbound (once per element). `unique_member/2` succeeds exactly once.

### 5.4 The Nasty Interaction with Negation and Correctness

Cuts are particularly dangerous when they interact with negation or with unknown modes of use.

Consider a classification predicate:

```prolog
classify(X, zero) :- X =:= 0, !.
classify(X, positive) :- X > 0, !.
classify(_, negative).
```

This looks fine when `X` is bound. But if you call `classify(X, negative)` with `X` unbound, the cut in the previous clauses never fires (because `X =:= 0` raises an instantiation error), so the third clause is reached, and... you get a binding for `X`? No, the third clause succeeds trivially with `X` still unbound, which is wrong. The program gives a nonsensical answer because it was written to assume `X` is bound, and the cut silently hides the bug.

Another classic: using cut to simulate if-then-else without the `->` operator:

```prolog
% Buggy attempt at "if in_list then do_A else do_B"
check(X, Y) :- member(X, [a, b, c]), !, do_A(Y).
check(_, Y) :- do_B(Y).
```

What happens if `do_A(Y)` fails? Backtracking *cannot* reach the second clause because the cut already committed us. The program silently fails. That is almost never the intended behavior, and it is very hard to debug.

The general lesson: cuts bind the logical meaning of your program to a specific execution order. Once you use a cut, you have committed to thinking about your code operationally. And in a language whose whole point is declarative reading, that is a cost.

### 5.5 If-Then-Else (-> ;) Syntactic Sugar

Prolog provides a syntactic construct for if-then-else:

```prolog
( Condition -> Then ; Else )
```

It reads: if `Condition` succeeds, commit to it and execute `Then`; otherwise, execute `Else`. The commit prevents backtracking into the condition — it is effectively a localized cut.

Semantically, the expression is equivalent (ignoring some subtleties about variable scoping) to:

```prolog
( Condition, !, Then ; Else )
```

But the `->` notation is safer because the cut is confined to the if-then-else expression and does not leak out to prune choices in the enclosing clause.

Example:

```prolog
abs(X, Y) :- ( X >= 0 -> Y = X ; Y is -X ).
```

Read: `Y` is the absolute value of `X`. If `X >= 0`, `Y = X`; otherwise, `Y = -X`.

The if-then-else also has a form without an else branch:

```prolog
( Condition -> Then )
```

If `Condition` fails, the whole construct fails. This is rarely useful — usually you want an explicit `else`.

And you can chain them:

```prolog
classify(X, Class) :-
    ( X =:= 0 -> Class = zero
    ; X > 0   -> Class = positive
    ;            Class = negative
    ).
```

This is much cleaner than the cut-based version above. It is also correct — the final else branch is reached via a clear conditional test, not as an accident of missing cuts.

Style advice: use `(C -> T ; E)` whenever possible in preference to explicit cuts. It is more local, more readable, and less likely to cause action-at-a-distance bugs.

---

## 6. Negation as Failure

Prolog's negation is not classical logical negation. This is one of the most important things to understand about the language — and one of the most commonly misunderstood.

### 6.1 The Operator: `\+` and `not`

Prolog provides an operator called "negation as failure," written `\+` in ISO Prolog (and also `not` in some older Prologs, though `not` is now deprecated because it is misleading).

`\+ Goal` succeeds if `Goal` fails. It fails if `Goal` succeeds.

```prolog
?- \+ member(7, [1, 2, 3]).
true.

?- \+ member(2, [1, 2, 3]).
false.
```

Read carefully: `\+ member(7, [1,2,3])` succeeds because the attempt to prove `member(7, [1,2,3])` fails. The failure of the inner goal translates to the success of the negated outer goal. Hence the name: **negation as failure.**

### 6.2 The Closed World Assumption

Classical logic has two truth values: true and false. If `P` is not true, then `P` is false. If `P` is not false, then `P` is true. The law of the excluded middle holds.

Prolog's world is more cautious. It has three possible states for a query:

1. **Provably true** — there is a proof using the rules and facts in the program.
2. **Provably false** — you can prove the negation (but Prolog can't do this in general).
3. **Unknown** — no proof can be constructed from the current program.

Prolog collapses cases 2 and 3 into one: "failure." If Prolog cannot prove something, it reports failure, without distinguishing between "actively false" and "not enough information."

This is called the **Closed World Assumption**: everything not derivable from the program is assumed false. It is a practical stance — you need some way to deal with missing information — but it is logically weaker than classical negation.

Example:

```prolog
parent(tom, bob).
parent(tom, liz).

?- \+ parent(tom, zoe).
true.   % We can't prove tom is zoe's parent, so we "know" he isn't.
```

But maybe Tom *is* Zoe's parent — we just haven't told Prolog. Under classical logic, we would need to prove explicitly that Tom is not Zoe's parent. Under the CWA, the absence of proof is treated as proof of absence.

This works fine for domains where your database is complete: you know every parent in a family tree, every employee in a company, every customer in a system. It breaks down for open-world reasoning, where "not listed" doesn't mean "doesn't exist."

### 6.3 Floundering — Negating Non-Ground Goals

There is a trap lurking in negation as failure, and it gets programmers who are otherwise fluent. Consider:

```prolog
fruit(apple).
fruit(banana).
fruit(cherry).

not_listed_fruit(X) :- \+ fruit(X).
```

Now:

```prolog
?- not_listed_fruit(kiwi).
true.            % kiwi is not in the database. Correct.

?- not_listed_fruit(X).
false.           % ??? But surely *something* isn't in the database?
```

What happened? When you call `not_listed_fruit(X)` with `X` unbound, it becomes `\+ fruit(X)`. Prolog tries to prove `fruit(X)`, and this succeeds immediately with `X = apple`. Since the inner goal succeeded, the negation fails. The outer goal fails. You get `false`.

This is the **floundering** problem: **negation as failure is unsound for non-ground goals.** It gives the wrong answer when the goal being negated contains unbound variables.

The logical reading of `\+ fruit(X)` should be "there is no X such that fruit(X) is true." But Prolog implements it as "the attempt to prove fruit(X) failed" — and with unbound X, that proof *succeeds* with a binding, so the negation gives the opposite of the correct answer.

The fix: ensure the goal is ground before you negate it.

```prolog
not_listed_fruit(X) :- nonvar(X), \+ fruit(X).
```

Or test groundness:

```prolog
not_listed_fruit(X) :- ground(X), \+ fruit(X).
```

This at least avoids the wrong answer — though now you will get `false` for calls where `X` is unbound, when perhaps you wanted "can't tell."

Some Prolog systems (SWI in particular) detect floundering at runtime and raise a warning or error. Others let it slide, producing silent wrong answers. This is one of the reasons mode declarations (§13) matter: they document the assumption that a predicate is called in a particular mode, so the floundering case can be caught.

### 6.4 Stable Model Semantics as the Fix

The floundering problem is fundamental — it is not a bug in Prolog, it is a limitation of the semantic framework. Handling negation in logic programming correctly requires moving beyond SLD resolution.

**Stable model semantics**, introduced by Michael Gelfond and Vladimir Lifschitz in 1988, provides a cleaner account of negation. Instead of operational failure, stable model semantics defines the meaning of a logic program with negation in terms of sets of atoms (models) that are "stable" under a certain reduction operation. Classical negation becomes possible; floundering disappears.

Stable model semantics is the foundation of **Answer Set Programming** (ASP), which we will cover in the applications thread. ASP languages like Clingo and DLV support full classical negation, disjunction in the head, and have decidable semantics for programs with non-stratified negation. The trade-off is that ASP is not as expressive for recursive data structures — it is ground-and-solve, not SLD.

For now, in Prolog, the rule is: **only negate ground goals**, and treat `\+` as "cannot be proved" rather than "is false." It is a weaker operator than you might hope, but used carefully, it is useful.

---

## 7. Lists and Recursion

Lists are the bread and butter of Prolog programming. Nearly every non-trivial program you write will involve lists, and the idioms for working with them are worth knowing cold.

### 7.1 The Classics

Let's build up the standard list predicates. Many Prolog systems provide them as built-ins, but understanding their definitions teaches you how to think in Prolog.

**`member/2` — Is X an element of L?**

```prolog
member(X, [X|_]).
member(X, [_|T]) :- member(X, T).
```

Two clauses. The first: X is in the list if it is the head. The second: X is in the list if it is in the tail. Note that this is a relation, not a function. You can use it to test membership, to enumerate elements, or to generate lists that contain X:

```prolog
?- member(b, [a, b, c]).
true.

?- member(X, [a, b, c]).
X = a ; X = b ; X = c.

?- member(a, L), L = [a, _, _].   % (contrived but possible)
L = [a, _, _].
```

**`append/3` — List3 is the concatenation of List1 and List2**

```prolog
append([], L, L).
append([H|T], L, [H|R]) :- append(T, L, R).
```

The first clause: appending an empty list to L gives L. The second: to append `[H|T]` to L, append T to L to get R, then prepend H.

We've already seen how flexible `append/3` is. It runs forward, backward, and in all partial modes. It is the canonical example of bidirectional Prolog programming.

**`reverse/2` — The naive version**

```prolog
reverse([], []).
reverse([H|T], R) :- reverse(T, RT), append(RT, [H], R).
```

Naive because each recursive call does an `append/3`, and each append is linear in the length of its first argument. The overall complexity is O(n²). Good for correctness demonstrations; bad for production.

**`reverse/2` — The efficient accumulator version**

```prolog
reverse(L, R) :- reverse_acc(L, [], R).

reverse_acc([], Acc, Acc).
reverse_acc([H|T], Acc, R) :- reverse_acc(T, [H|Acc], R).
```

Here, `Acc` is an accumulator that holds the result so far. At each step, we prepend the current head to the accumulator. When the input is empty, the accumulator *is* the reversed list. This is O(n) — linear and tail-recursive.

**`length/2` — The length of a list**

```prolog
length([], 0).
length([_|T], N) :- length(T, N0), N is N0 + 1.
```

This works forward: given a list, compute its length. It does not work backward (given a length, generate a skeleton list) because of the `is/2` gotcha (§8). The library version of `length/2` in SWI-Prolog is more careful and works in multiple modes.

**`last/2` — The last element of a list**

```prolog
last([X], X).
last([_|T], X) :- last(T, X).
```

Succeeds for non-empty lists. For `last([1,2,3], X)`, recurses down to `last([3], X)`, which matches the first clause with `X = 3`.

**`nth0/3` — The Nth element (zero-indexed)**

```prolog
nth0(0, [X|_], X).
nth0(N, [_|T], X) :- N > 0, N1 is N - 1, nth0(N1, T, X).
```

Base case: the 0th element of `[X|_]` is X. Recursive case: the Nth element of `[_|T]` is the (N-1)th element of T, provided N > 0.

### 7.2 The Accumulator Pattern

You saw the accumulator pattern in `reverse/2`. It is worth generalizing because it appears everywhere in Prolog.

The idea: instead of building up a result as you return from recursive calls (which prevents tail-call optimization), pass the partial result as an extra argument, and at the base case, unify it with the final result.

**Sum of a list, direct recursion:**

```prolog
sum([], 0).
sum([H|T], S) :- sum(T, S0), S is S0 + H.
```

This is correct, but not tail-recursive: the `S is S0 + H` step happens *after* the recursive call returns, so the stack grows with the list length.

**Sum of a list, accumulator version:**

```prolog
sum(L, S) :- sum_acc(L, 0, S).

sum_acc([], Acc, Acc).
sum_acc([H|T], Acc, S) :- Acc1 is Acc + H, sum_acc(T, Acc1, S).
```

Now the recursive call in the last line is in tail position — nothing happens after it. A Prolog compiler can optimize this into a loop, using constant stack space regardless of list length.

The accumulator pattern generalizes: any time you are computing a summary of a list (sum, product, max, count, reverse, filter, ...), an accumulator version is usually available and usually more efficient.

### 7.3 Difference Lists

The accumulator pattern has a curious limitation: it's easy when you are building up a scalar (like a sum) or a list in reverse order (like `reverse/2`). It is awkward when you want to build a list in forward order.

Consider `append/3` again:

```prolog
append([], L, L).
append([H|T], L, [H|R]) :- append(T, L, R).
```

To append two lists of length m and n, we make m recursive calls and use m cons cells. The total cost is O(m). Not bad — but it means concatenating a series of lists pays this cost for each concatenation. Concatenating k lists of total length n, using `append/3`, is O(kn). Could we do better?

**Difference lists** are a pure-Prolog technique for O(1) concatenation. A difference list is a pair of terms: `List-Hole`, where `List` is a partial list ending in a variable, and `Hole` is that variable. The "value" of the difference list is whatever appears in `List` before the hole.

```prolog
% An empty difference list:
X-X.

% A difference list containing [a, b, c]:
[a, b, c | H]-H.
```

To append two difference lists, unify the first's hole with the second's list:

```prolog
append_dl(L1-H1, H1-H2, L1-H2).
```

That's O(1) regardless of the sizes of the lists, because all we do is rewire variables. Here is a demonstration:

```prolog
?- L1 = [a, b, c | H1]-H1,
   L2 = [d, e | H2]-H2,
   append_dl(L1, L2, Result).
Result = [a, b, c, d, e | H2]-H2.
```

The result is a difference list of `[a, b, c, d, e]`.

Difference lists are the Prolog equivalent of a doubly-ended queue — you have O(1) append on the right side. They are the key to efficient DCG implementation (§9), and to any algorithm that accumulates a list in forward order.

The cost: difference lists are more cumbersome to write and reason about. Many Prolog programmers get by without them. But when performance matters, they are in the toolkit.

### 7.4 Tail Recursion and Last Call Optimization

Prolog, like Scheme and other functional languages, benefits from **tail call optimization** (TCO). A call in *tail position* — the last thing a clause does — can be executed by replacing the current stack frame rather than pushing a new one. This turns recursion into iteration and avoids stack overflow on long computations.

A call is in tail position in Prolog if it is the last goal in a clause body and there are no remaining choice points in the current clause. The second condition is important: even if the call is syntactically last, if the clause has unexplored alternatives (either from other clauses or from earlier subgoals), TCO cannot apply because the state needs to be preserved.

This is called **Last Call Optimization** (LCO) in Prolog to emphasize that it applies to the last call, not to general tail calls. It is why `!` often makes a big difference in loop performance: the cut eliminates remaining choice points, enabling LCO.

```prolog
% Not LCO — last clause has choice points earlier
count_down(0) :- !.
count_down(N) :- write(N), nl, N1 is N - 1, count_down(N1).
```

Here, the `!` in the first clause, and the absence of alternative clauses for `count_down(N)` with N > 0, lets Prolog determine that the recursive call is the last action. LCO fires. The program can count down from a million with no stack issues.

Without the cut, the choice point between the two clauses would remain (because Prolog doesn't know at compile time that N=0 and N>0 are mutually exclusive), and LCO would not apply.

### 7.5 `findall/3`, `bagof/3`, `setof/3` — Collecting Solutions

So far, we've seen Prolog answer queries one at a time — the user (or the calling goal) drives enumeration by backtracking. What if you want *all* the answers as a list?

**`findall(Template, Goal, List)`** runs `Goal` to exhaustion, collecting instances of `Template` into `List`.

```prolog
parent(tom, bob).
parent(tom, liz).
parent(bob, ann).
parent(bob, pat).

?- findall(Child, parent(tom, Child), Children).
Children = [bob, liz].

?- findall(X-Y, parent(X, Y), Pairs).
Pairs = [tom-bob, tom-liz, bob-ann, bob-pat].
```

`findall/3` is the most commonly used. It always succeeds (with an empty list if `Goal` has no solutions), and it does not care about the free variables in `Goal`.

**`bagof(Template, Goal, Bag)`** is similar but handles free variables differently. If `Goal` contains variables not appearing in `Template`, `bagof/3` produces one bag per distinct binding of those variables.

```prolog
?- bagof(Child, parent(P, Child), Bag).
P = bob, Bag = [ann, pat] ;
P = tom, Bag = [bob, liz].
```

Notice: we got two answers, one per value of `P`. `bagof/3` groups solutions by the free variables.

If you want `bagof/3` to ignore a free variable, use the `^` operator:

```prolog
?- bagof(Child, P^parent(P, Child), Bag).
Bag = [bob, liz, ann, pat].
```

The `P^` says "for some P" — existentially quantified — so `bagof/3` doesn't split on it.

Another difference: `bagof/3` *fails* if there are no solutions, whereas `findall/3` returns an empty list.

**`setof(Template, Goal, Set)`** is like `bagof/3` but sorts the result and removes duplicates.

```prolog
?- setof(Child, P^parent(P, Child), Set).
Set = [ann, bob, liz, pat].
```

In practice, `findall/3` is usually what you want — it's simplest and has the most predictable behavior. Use `bagof/3` when you need grouping. Use `setof/3` when you need uniqueness and ordering.

---

## 8. Arithmetic

Arithmetic in Prolog is... unlovely. It is the part of the language where the declarative vision cracks most visibly, and where newcomers stumble most consistently.

### 8.1 `is/2` vs `=/2` — The Famous Gotcha

In most languages, `X = 2 + 3` evaluates the right side and assigns the result to `X`. In Prolog, `=/2` is unification, not evaluation. Writing `X = 2 + 3` unifies `X` with the compound term `2+3`:

```prolog
?- X = 2 + 3.
X = 2+3.
```

Not 5. The literal term `+(2, 3)`. This is almost certainly not what you wanted.

To actually compute the value, you use `is/2`:

```prolog
?- X is 2 + 3.
X = 5.
```

`is/2` is a special operator: it evaluates the right-hand side as an arithmetic expression, then unifies the result with the left-hand side. The right-hand side must be ground — every variable in it must already be bound to a number — or you get an instantiation error.

```prolog
?- X is Y + 1.
ERROR: is/2: Arguments are not sufficiently instantiated.
```

This is the single most common gotcha for new Prolog programmers. The reason it exists: `is/2` is not logical. It is a one-directional evaluator, hard-coded into the language. Writing `X is Y + 1` does not create a symbolic constraint between X and Y; it demands a value for Y right now.

Compare:

```prolog
?- X = 5, X is 2 + 3.
X = 5.                 % Works: 2+3 evaluates to 5, which unifies with X.

?- X is 2 + 3, X = 5.
X = 5.                 % Also works.

?- X = 2 + 3, X is X.
ERROR: is/2: Arguments are not sufficiently instantiated.
% X is bound to the *term* 2+3, and `X is X` tries to evaluate that.
% Actually in SWI this might work since 2+3 can be evaluated. Let's see:
?- X = 2 + 3, Y is X.
Y = 5.                 % This works — is/2 evaluates X's binding.
```

### 8.2 The Family of Arithmetic Comparisons

Related to `is/2`, there are several arithmetic comparison operators. They all evaluate both sides as arithmetic expressions and then compare.

```prolog
?- 3 =:= 1 + 2.        % Arithmetic equality
true.

?- 3 =\= 4.            % Arithmetic inequality
true.

?- 3 < 4.              % Less than
true.

?- 3 > 2.              % Greater than
true.

?- 3 =< 4.             % Less or equal (NOT <=)
true.

?- 3 >= 3.             % Greater or equal
true.
```

Note the oddity of `=<` instead of `<=`. This is historical — `<=` was reserved for something else (backward implication) in early Prolog. It's the sort of thing you just have to memorize.

All of these are distinct from structural equality:

```prolog
?- 3 == 3.             % Structural equality — same term
true.

?- 3 == 3.0.           % NOT equal — different terms (integer vs float)
false.

?- 3 =:= 3.0.          % Equal as numbers
true.

?- 3 \== 4.            % Structural inequality
true.

?- X = 1 + 2, X =:= 3.
X = 1+2.               % X is the term 1+2, but arithmetically equals 3.

?- X = 1 + 2, X == 3.
false.                 % Structurally, 1+2 and 3 are different terms.
```

There are four or five "equality" operators, and which to use depends on what kind of equality you mean. The distinction is real: structural equality for terms, arithmetic equality for numbers, unification for variables. Choose wisely.

### 8.3 Why Prolog Arithmetic Is Procedural, Not Logical

The deep reason arithmetic is ugly in Prolog is that arithmetic is not naturally expressible in Horn clause logic. You can express "2 + 3 = 5" as a fact, but you can't express every addition fact as a rule — the space of numbers is infinite. And because Prolog variables stand for ground terms, not constraints, you can't say "X + 1 = Y" as a relation that can be solved backwards.

So Prolog adopted a pragmatic hack: built-in arithmetic, delegated to the host platform, accessed via `is/2` and comparison operators. It is fast, but it is not relational. You cannot run `X is Y + 1` with only `X` bound and get `Y = X - 1`.

This offends purists, and it should. But the alternative — slow, relational arithmetic — would make Prolog unusable for numerical work.

### 8.4 CLP(FD) as the Fix

Constraint Logic Programming over Finite Domains — **CLP(FD)** — is the principled solution. It introduces a separate constraint solver for integer arithmetic that handles variables properly. Using CLP(FD), you write `X #= Y + 1` (note the `#`), and this creates a relation between X and Y that Prolog can solve in either direction.

```prolog
:- use_module(library(clpfd)).

?- X #= Y + 1, Y = 5.
X = 6,
Y = 5.

?- X #= Y + 1, X = 6.
X = 6,
Y = 5.

?- X in 1..10, X #= Y + 1, Y #> 3.
X in 5..10,
Y in 4..9.
```

CLP(FD) is real relational arithmetic. It's also more expressive than `is/2`: it supports domain constraints, reification, global constraints, and much more. We'll cover it in the modern applications thread. For now, know that it exists, and that when you find yourself fighting `is/2`, CLP(FD) is usually the answer.

### 8.5 Integer vs Float, Big Numbers

Prolog arithmetic operates on two numeric types, integer and float, with automatic promotion from integer to float when a float is involved. Most modern Prologs (SWI, SICStus, GNU) support **arbitrary-precision integers** (bignums), so integer arithmetic never overflows.

```prolog
?- X is 2 ** 100.
X = 1267650600228229401496703205376.

?- X is 100!.
ERROR: ... (no built-in factorial)
```

Factorial isn't built-in, but you can write it, and it will handle arbitrarily large values:

```prolog
factorial(0, 1).
factorial(N, F) :- N > 0, N1 is N - 1, factorial(N1, F1), F is N * F1.

?- factorial(50, F).
F = 30414093201713378043612608166064768844377641568960512000000000000.
```

Floats are standard IEEE 754 double-precision. Mixing:

```prolog
?- X is 1 + 2.0.
X = 3.0.              % Integer + float = float

?- X is 1 / 2.
X = 0.5.              % Division produces float in SWI

?- X is 1 // 2.
X = 0.                % Integer division

?- X is 1 mod 2.
X = 1.                % Modulo

?- X is sqrt(2).
X = 1.4142135623730951.
```

Functions like `sqrt`, `sin`, `cos`, `exp`, `log`, `abs`, and so on are available inside `is/2`. They are *not* predicates — you can't use them at the goal level. They only work as arithmetic expressions evaluated by `is/2` or the comparison operators.

---

## 9. Definite Clause Grammars (DCGs)

Definite Clause Grammars are a notational extension of Prolog that make it trivially easy to write parsers. They are one of Prolog's most elegant features — a case where the language's native abstractions align perfectly with the problem domain.

### 9.1 The Core Idea

A grammar is a set of rules that describe how to recognize strings in some language. A rule like:

```
sentence → noun_phrase verb_phrase
```

says "a sentence is a noun phrase followed by a verb phrase." The DCG notation lets you write this almost verbatim in Prolog:

```prolog
sentence --> noun_phrase, verb_phrase.
```

The `-->` is a user-defined operator declared in every standard Prolog. When Prolog loads a clause whose head-body separator is `-->`, it transforms the clause into ordinary Prolog by adding two hidden arguments — the input list and the remaining list after consumption. This is the **difference list** technique we saw in §7.3.

The transformation:

```prolog
sentence --> noun_phrase, verb_phrase.
```

becomes:

```prolog
sentence(S0, S) :- noun_phrase(S0, S1), verb_phrase(S1, S).
```

And a terminal in a DCG rule:

```prolog
noun --> [dog].
```

becomes:

```prolog
noun([dog|S], S).
```

You consume `dog` from the front of the input list and leave the rest. Parsing is "consuming a prefix and returning what's left."

### 9.2 The `phrase/2` Interface

You don't call DCG rules directly as predicates, because you would have to remember to pass the two hidden list arguments. Instead, you use `phrase/2` or `phrase/3`:

```prolog
?- phrase(sentence, [the, dog, barked]).
true.

?- phrase(noun_phrase, [the, big, dog], Rest).
Rest = [].
```

`phrase(Rule, List)` succeeds if the entire list is consumed by the rule. `phrase(Rule, List, Rest)` succeeds if an initial segment of the list is consumed, binding `Rest` to what's left.

### 9.3 A Complete DCG: English Fragment

Here is a small grammar for a fragment of English:

```prolog
sentence --> noun_phrase, verb_phrase.

noun_phrase --> determiner, noun.
noun_phrase --> determiner, adjective, noun.
noun_phrase --> [mary].
noun_phrase --> [john].

verb_phrase --> verb.
verb_phrase --> verb, noun_phrase.

determiner --> [the].
determiner --> [a].

adjective --> [big].
adjective --> [small].
adjective --> [red].

noun --> [dog].
noun --> [cat].
noun --> [ball].

verb --> [runs].
verb --> [sees].
verb --> [kicks].
```

Test it:

```prolog
?- phrase(sentence, [the, dog, sees, a, cat]).
true.

?- phrase(sentence, [mary, kicks, the, red, ball]).
true.

?- phrase(sentence, [the, dog, the, cat]).
false.
```

We can also run it backwards — generate all sentences:

```prolog
?- phrase(sentence, S).
S = [the, dog, runs] ;
S = [the, dog, sees] ;
S = [the, dog, kicks] ;
S = [the, dog, sees, the, dog] ;
...
```

This will enumerate (infinitely, if the grammar has recursion) every sentence the grammar accepts.

### 9.4 DCGs with Arguments: Parsing Into Structure

DCG rules can take arguments. This lets you build a parse tree as you go:

```prolog
sentence(s(NP, VP)) --> noun_phrase(NP), verb_phrase(VP).

noun_phrase(np(D, N)) --> determiner(D), noun(N).
noun_phrase(np(D, A, N)) --> determiner(D), adjective(A), noun(N).

verb_phrase(vp(V)) --> verb(V).
verb_phrase(vp(V, NP)) --> verb(V), noun_phrase(NP).

determiner(d(the)) --> [the].
determiner(d(a)) --> [a].

adjective(adj(big)) --> [big].
adjective(adj(red)) --> [red].

noun(n(dog)) --> [dog].
noun(n(cat)) --> [cat].

verb(v(runs)) --> [runs].
verb(v(sees)) --> [sees].
```

Now parsing produces a tree:

```prolog
?- phrase(sentence(Tree), [the, dog, sees, a, cat]).
Tree = s(np(d(the), n(dog)), vp(v(sees), np(d(a), n(cat)))).
```

This is what a parser in a functional language would look like — except more concise, and able to run in reverse. You can *generate* sentences from a tree:

```prolog
?- Tree = s(np(d(the), n(dog)), vp(v(runs))),
   phrase(sentence(Tree), Sentence).
Tree = s(np(d(the), n(dog)), vp(v(runs))),
Sentence = [the, dog, runs].
```

The same grammar handles parsing *and* generation. This is DCGs at their best.

### 9.5 Arithmetic Expression DCG: A Worked Example

Let's build a DCG that parses arithmetic expressions with correct precedence. The grammar:

```
expression → term
           | term + expression
           | term - expression

term → factor
     | factor * term
     | factor / term

factor → number
       | ( expression )
```

This is right-associative for simplicity. In Prolog:

```prolog
expression(E) --> term(T), expression_rest(T, E).

expression_rest(T, E) --> [+], expression(E1), { E = T + E1 }.
expression_rest(T, E) --> [-], expression(E1), { E = T - E1 }.
expression_rest(T, T) --> [].

term(T) --> factor(F), term_rest(F, T).

term_rest(F, T) --> [*], term(T1), { T = F * T1 }.
term_rest(F, T) --> [/], term(T1), { T = F / T1 }.
term_rest(F, F) --> [].

factor(N) --> [N], { number(N) }.
factor(E) --> ['('], expression(E), [')'].
```

A few new features here:

**Curly braces `{ }`** embed ordinary Prolog code in a DCG rule. The code runs as a side-effect of parsing — it doesn't consume input. Here we use it to build terms and to test that a token is a number.

**Testing tokens.** `factor(N) --> [N], { number(N) }` consumes the next token and checks that it is a number.

Test it:

```prolog
?- phrase(expression(E), [1, +, 2, *, 3]).
E = 1+2*3.

?- phrase(expression(E), ['(', 1, +, 2, ')', *, 3]).
E = (1+2)*3.
```

The parser produces a Prolog term that we can then evaluate:

```prolog
?- phrase(expression(E), ['(', 1, +, 2, ')', *, 3]), Result is E.
E = (1+2)*3,
Result = 9.
```

We wrote a recursive-descent parser in about 15 lines, with no parser generator, no regular expressions, no lexer combinators. And it runs backward — given an expression term, it can generate the token list.

### 9.6 DCGs Beyond Natural Language

DCGs work for any sequential pattern problem, not just text. They are used for:

- **Network protocols.** Parse bytes off the wire into structured messages.
- **Binary file formats.** Decode images, audio, executables.
- **Compiler frontends.** Lex and parse source code.
- **Serializers.** The same DCG can generate output and parse input.
- **Search and pattern matching.** Find subsequences matching a pattern.

The trick is that the "tokens" in a DCG are just list elements — they can be atoms, numbers, character codes, or any Prolog terms. A DCG over character codes is a lexer; a DCG over tokens is a parser; a DCG over bytes is a protocol decoder.

The one limitation: DCGs produce and consume *lists*, which means you need the entire input in memory (or a lazy list, in some Prologs). For genuinely streaming input, you drop down to lower-level I/O. But for most parsing work, DCGs are the tool.

---

## 10. Meta-programming

Prolog is homoiconic. Code is data. A clause is a term. A goal is a term. The same unification that matches data patterns also manipulates programs. This gives Prolog extraordinary meta-programming power — arguably even more so than Lisp, because unification is more general than pattern matching.

### 10.1 `call/N` — Running Variable Goals

`call/1` takes a term and executes it as a goal.

```prolog
?- G = member(X, [1, 2, 3]), call(G).
G = member(1, [1, 2, 3]),
X = 1 ;
G = member(2, [1, 2, 3]),
X = 2 ;
G = member(3, [1, 2, 3]),
X = 3.
```

This is how you store goals in data structures and invoke them later. It is also how higher-order predicates are built.

`call/N` with N > 1 is more interesting: it takes a partial goal and extra arguments, and extends the goal with those arguments before calling.

```prolog
?- call(member, X, [1, 2, 3]).
X = 1 ;
X = 2 ;
X = 3.

?- P = member, call(P, X, [a, b]).
X = a ;
X = b.
```

This is what you use for higher-order programming:

```prolog
map(_, [], []).
map(P, [X|Xs], [Y|Ys]) :- call(P, X, Y), map(P, Xs, Ys).

double(X, Y) :- Y is 2 * X.

?- map(double, [1, 2, 3], Result).
Result = [2, 4, 6].
```

`call(P, X, Y)` applies the predicate `P` to arguments `X` and `Y`. If `P = double`, this becomes `call(double, X, Y)` which is equivalent to `double(X, Y)`. `call/N` is the Prolog equivalent of function application.

### 10.2 `clause/2` — Inspecting the Database

`clause(Head, Body)` unifies with any clause in the program whose head unifies with `Head`. If the clause is a fact, `Body` is `true`.

```prolog
animal(dog).
animal(cat).
legs(X, 4) :- animal(X).

?- clause(animal(X), Body).
X = dog, Body = true ;
X = cat, Body = true.

?- clause(legs(X, N), Body).
N = 4, Body = animal(X).
```

`clause/2` is how meta-interpreters work: they walk the database clause by clause, unifying with heads, and executing bodies as sub-queries. It is also how you introspect a program at runtime — asking "what do I know about this predicate?"

### 10.3 `assert` and `retract` — Modifying the Database

Prolog allows programs to modify their own database at runtime.

```prolog
?- assertz(fact(1)).
true.

?- assertz(fact(2)).
true.

?- fact(X).
X = 1 ;
X = 2.

?- retract(fact(1)).
true.

?- fact(X).
X = 2.
```

`assertz/1` adds a clause at the end of the database. `asserta/1` adds it at the beginning. `retract/1` removes a clause matching the given pattern.

These are not declarative. Asserting changes the meaning of your program. A program that uses `assert`/`retract` for computation is hard to reason about, because the logical theory it represents changes over time.

Still, they have uses:

- **Memoization.** Cache the results of expensive computations.
- **Event recording.** Log facts as they occur.
- **Dynamic loading.** Bring in rules from a file at runtime.
- **Global state.** (Reluctantly. It is usually better to thread state through argument position.)

If you declare a predicate `:- dynamic foo/2.`, Prolog marks it as assertable/retractable. Without the declaration, most Prologs will refuse to modify it.

### 10.4 Prolog is Homoiconic — Code Is Terms

Every Prolog clause is a term. You can take it apart and put it together with ordinary unification.

```prolog
?- Clause = (foo(X) :- bar(X), baz(X)).
Clause = (foo(X):-bar(X), baz(X)).

?- Clause = (Head :- Body), Body = (G1, G2).
Clause = (foo(X):-bar(X), baz(X)),
Head = foo(X),
Body = (bar(X), baz(X)),
G1 = bar(X),
G2 = baz(X).
```

`:-/2` is an operator. A clause `foo(X) :- bar(X), baz(X)` is literally the term `':-'(foo(X), ','(bar(X), baz(X)))`. Every construct in the language is built from the same compound-term primitive.

This makes it trivial to generate, transform, and analyze Prolog programs from within Prolog. You can write program transformations as simple predicate manipulations. You can write analyzers that walk over clauses. You can write DSL compilers whose output is Prolog itself.

### 10.5 Writing a Prolog Interpreter in Prolog

The ultimate demonstration of Prolog's meta-power: you can write a working Prolog interpreter in about ten lines of Prolog.

```prolog
% A minimal Prolog meta-interpreter

solve(true) :- !.
solve((A, B)) :- !, solve(A), solve(B).
solve((A ; _)) :- solve(A).
solve((_ ; B)) :- solve(B).
solve(Goal) :-
    clause(Goal, Body),
    solve(Body).
```

This handles conjunction, disjunction, and clause lookup. Given a program of facts and rules, `solve/1` will prove goals exactly as Prolog does natively.

Extend it to handle negation:

```prolog
solve(\+ Goal) :- !, \+ solve(Goal).
```

Or cut (trickier — requires catching the commitment):

```prolog
solve(!) :- !.   % naive — doesn't actually prune
```

A full meta-interpreter with cut requires more machinery, but the core loop remains tiny.

Why is this interesting? Because it means you can customize evaluation. Want to trace every call? Add a `write/1` to `solve/1`. Want to limit search depth? Add a depth counter. Want to implement tabling or iterative deepening or parallel search? It all falls out of adding a little logic to a ten-line interpreter. This is how many Prolog extensions — tabling, CLP, CHR — were prototyped before being compiled into the runtime.

```prolog
% Tracing meta-interpreter
solve_trace(Goal, Depth) :-
    tab(Depth), write('Call: '), write(Goal), nl,
    solve_trace_goal(Goal, Depth),
    tab(Depth), write('Exit: '), write(Goal), nl.

solve_trace_goal(true, _) :- !.
solve_trace_goal((A, B), D) :- !,
    solve_trace(A, D), solve_trace(B, D).
solve_trace_goal(Goal, D) :-
    clause(Goal, Body),
    D1 is D + 1,
    solve_trace(Body, D1).
```

Run a goal through this interpreter and you get a tree-structured trace of the proof, indented by depth. Ten more lines and you have a graphical debugger.

### 10.6 Term Manipulation: `=..`, `functor/3`, `arg/3`

Three built-ins let you decompose and construct terms programmatically.

**`=..`** (pronounced "univ") turns a compound term into a list and vice versa.

```prolog
?- foo(1, 2, 3) =.. L.
L = [foo, 1, 2, 3].

?- T =.. [bar, a, b].
T = bar(a, b).
```

This is a cheap and popular way to do meta-programming, though functor/3 and arg/3 are usually more efficient and safer.

**`functor(Term, Name, Arity)`** decomposes a term into its functor name and arity, without lifting the arguments into a list.

```prolog
?- functor(foo(1, 2, 3), Name, Arity).
Name = foo,
Arity = 3.

?- functor(Term, bar, 2).
Term = bar(_, _).     % Creates a fresh template
```

Running `functor/3` in construction mode creates a compound term with the given name and arity and fresh variables for each argument. This is the standard way to create a "blank" term you will fill in later.

**`arg(N, Term, Arg)`** extracts the Nth argument (1-indexed) of a compound term.

```prolog
?- arg(2, foo(a, b, c), X).
X = b.
```

Together, these three predicates let you walk, rewrite, and construct terms without needing `=..` at all. For example, here is a generic "copy a term but replace every variable with a fresh one":

```prolog
copy_term_manual(Term, Copy) :-
    ( var(Term) -> true
    ; functor(Term, F, N),
      functor(Copy, F, N),
      copy_args(N, Term, Copy)
    ).

copy_args(0, _, _) :- !.
copy_args(N, Term, Copy) :-
    arg(N, Term, A),
    arg(N, Copy, B),
    copy_term_manual(A, B),
    N1 is N - 1,
    copy_args(N1, Term, Copy).
```

In practice, you'd use the built-in `copy_term/2` for this, but understanding how it could be written is instructive.

---

## 11. Modules and Namespaces

Modules are the part of Prolog where the standard most notably failed to settle the dialect wars. Different Prolog systems have different module systems, with different syntax and different semantics. The ISO standard (part 2) specified modules in 2000, but adoption has been patchy and each major system continues to do its own thing.

### 11.1 The Historical Mess

Quintus Prolog introduced a module system in the mid-1980s based on source transformation: every call to a predicate was qualified with the module it came from, and module declarations controlled visibility. SICStus inherited this approach and refined it.

SWI-Prolog has its own module system, different in detail from Quintus, with per-module operators, explicit imports, and module-aware meta-calls. Older SWI code often does not declare modules at all and relies on global namespaces.

GNU Prolog has a minimal module system. Some smaller Prologs have none — every predicate is global.

The ISO Part 2 module standard exists but is not widely implemented in its entirety. It specifies a "standard" module system, but most systems claim partial or advisory conformance at best.

The practical upshot: if you write portable Prolog code, you either avoid modules entirely (global namespace), use your implementation's specific module syntax and accept non-portability, or use a compatibility layer that wraps the differences.

### 11.2 SWI-Prolog Modules

SWI-Prolog's module system is the one most new Prolog users encounter. A module is a file with a `module/2` directive at the top:

```prolog
:- module(my_module, [public_predicate/2, another_one/1]).

public_predicate(X, Y) :- ... .
another_one(Z) :- ... .
private_predicate(A) :- ... .   % Not exported
```

The second argument of `module/2` is the **export list**: predicates visible outside the module. Everything else is private.

To use a module, you import it:

```prolog
:- use_module(my_module).
```

Or with a specific list of imports:

```prolog
:- use_module(my_module, [public_predicate/2]).
```

You can also qualify calls explicitly with `Module:Goal`:

```prolog
?- my_module:public_predicate(1, X).
```

This calls `public_predicate/2` specifically in the `my_module` namespace, bypassing import resolution.

### 11.3 Library Imports

The standard library of a Prolog system is organized as a collection of modules, loaded with `use_module(library(name))`:

```prolog
:- use_module(library(lists)).
:- use_module(library(apply)).
:- use_module(library(clpfd)).
:- use_module(library(dcg/basics)).
```

The `library/1` wrapper tells Prolog "look in the standard library path." Each library module provides a cohesive set of predicates. `lists` has `append/3`, `member/2`, `reverse/2`, `length/2`, `nth0/3`, `last/2`, `msort/2`, `sum_list/2`, and dozens more. `apply` has `maplist/2`, `maplist/3`, `foldl/4`, and similar higher-order predicates. `clpfd` is the finite-domain constraint solver. `dcg/basics` has DCG primitives for common patterns.

SWI-Prolog's library is extensive: HTTP clients and servers, JSON parsing, XML, SQLite bindings, Redis clients, graph algorithms, constraint solvers, and much more. Exploring it is one of the pleasures of learning the language.

### 11.4 Module-Aware Meta-Calls

One subtlety with modules: `call/N` and other meta-predicates need to know which module to execute a goal in. This is handled by **module qualification**. When you pass a goal as data to a meta-predicate, the system records the caller's module with it, so the goal executes in the right context:

```prolog
:- module(caller, [test/0]).
:- use_module(helper).

test :- helper:go(X), call(X).  % Explicit module qualification
```

Predicates declared as `meta_predicate` get automatic module qualification for goal-typed arguments:

```prolog
:- module(mapper, [my_map/3]).

:- meta_predicate my_map(2, ?, ?).

my_map(_, [], []).
my_map(P, [X|Xs], [Y|Ys]) :- call(P, X, Y), my_map(P, Xs, Ys).
```

The `2` in `my_map(2, ?, ?)` says the first argument is a goal taking two extra arguments. When someone calls `my_map(my_pred, L1, L2)`, Prolog automatically qualifies `my_pred` with the caller's module before it gets into `my_map`. This is what makes higher-order predicates work correctly across module boundaries.

---

## 12. Exception Handling

Early Prolog had no exception handling — just success and failure. If something went wrong (like dividing by zero), the system would simply halt with an error message. The ISO standard added proper exception handling in 1995.

### 12.1 `throw/1` and `catch/3`

**`throw(Exception)`** raises an exception. The exception can be any term.

**`catch(Goal, Catcher, Recovery)`** executes `Goal`; if `Goal` throws an exception, and that exception unifies with `Catcher`, then `Recovery` is executed in its place.

```prolog
safe_divide(A, B, Q) :-
    catch(
        Q is A / B,
        error(evaluation_error(zero_divisor), _),
        Q = 0
    ).

?- safe_divide(10, 2, Q).
Q = 5.

?- safe_divide(10, 0, Q).
Q = 0.
```

If the exception doesn't unify with the catcher, it propagates up to the next enclosing `catch/3`, or eventually to the top level where it is reported.

### 12.2 Standard Error Terms

The ISO standard defines a set of standard error terms, all of the form `error(ErrorTerm, ImplementationDefined)`:

- **`instantiation_error`** — a required argument was unbound
- **`type_error(Type, Value)`** — wrong type (e.g., expected integer, got atom)
- **`domain_error(Domain, Value)`** — right type, wrong value (e.g., a non-positive integer where a positive was expected)
- **`existence_error(ObjectType, Name)`** — no such thing (e.g., unknown predicate, missing file)
- **`evaluation_error(Error)`** — arithmetic problem (e.g., zero divisor, float overflow)
- **`resource_error(Resource)`** — out of memory, out of stack, etc.
- **`syntax_error(Description)`** — bad syntax in parsed input
- **`permission_error(Operation, ObjectType, Object)`** — not allowed

Examples:

```prolog
?- X is 1 / 0.
ERROR: Arithmetic: evaluation error: `zero_divisor'

?- X is foo + 1.
ERROR: Arithmetic: `foo/0' is not a function

?- atom_length(123, L).
ERROR: Type error: `atom' expected, found `123' (an integer)

?- unknown_predicate(foo).
ERROR: Unknown procedure: unknown_predicate/1
```

The second argument of the `error/2` term is implementation-defined context information — often a term like `context(PredicateName, ExtraInfo)` that tells you where the error occurred. In portable code, you usually catch with a wildcard for that argument:

```prolog
catch(
    dangerous_goal(X),
    error(ErrorType, _),
    handle_error(ErrorType)
).
```

### 12.3 Custom Exceptions

You can throw any term, not just errors:

```prolog
parse(Input, Tree) :-
    catch(
        parse_tokens(Input, Tree),
        parse_failed(Reason),
        ( write('Parse failed: '), write(Reason), nl, fail )
    ).
```

This lets you define domain-specific exception types. By convention, errors that represent programming bugs should use the ISO `error/2` wrapper; exceptions that represent expected control flow (like early termination) can use whatever term makes sense.

### 12.4 Exceptions vs Failure

An important distinction: in Prolog, *failure* is the normal way to signal "this does not hold." Exceptions are for unexpected errors. Do not use exceptions as control flow.

```prolog
% Wrong: using exception for expected failure
check_positive(X) :- X > 0 -> true ; throw(not_positive(X)).

% Right: just fail
check_positive(X) :- X > 0.
```

Failure participates in backtracking. Exceptions do not — they bypass choice points and propagate outward. Throwing an exception in the middle of a search is a jump, not a retreat, and it can interfere with the rest of your program's logic.

---

## 13. The "Gotchas" Section

Every language has its traps. Prolog has some particularly well-worn ones. Knowing them in advance saves hours of baffled debugging.

### 13.1 `is/2` vs `=/2` vs `==/2` vs `=:=/2`

We covered this above, but it deserves repeating because it is the single most common source of new-Prolog-programmer confusion. There are (at least) four operators you might reach for:

| Operator | What it does                                |
|----------|---------------------------------------------|
| `=`      | Unification (not assignment, not equality)  |
| `is`     | Arithmetic evaluation                       |
| `==`     | Structural (term) equality, non-unifying    |
| `=:=`    | Arithmetic equality (after evaluating both) |
| `\=`     | Not unifiable                               |
| `\==`    | Not structurally equal                      |
| `=\=`    | Arithmetically not equal                    |

Demonstration:

```prolog
?- X = 1 + 2.             % Unification
X = 1+2.

?- X is 1 + 2.            % Arithmetic
X = 3.

?- 1 + 2 == 3.            % Structural equality: 1+2 is not the term 3
false.

?- 1 + 2 =:= 3.           % Arithmetic equality: 1+2 evaluates to 3
true.

?- X = Y, X == Y.         % After unification, X and Y are the same variable
true.

?- X == Y.                % Two different variables are not structurally equal
false.
```

The rule of thumb: if you are dealing with numbers, use `is` or `=:=` / `=\=`. If you are testing whether two terms are *the same*, use `==`. If you are binding variables, use `=`.

### 13.2 When Cut Breaks Correctness

Red cuts — cuts that change the meaning of a program — are the most frequent source of subtle bugs. The specific failure mode: a predicate works correctly in one mode of use (say, with the first argument ground) but gives wrong answers in another mode.

```prolog
% Buggy: depends on first argument being ground
max(X, Y, X) :- X >= Y, !.
max(_, Y, Y).

?- max(3, 2, M).
M = 3.               % Correct.

?- max(X, Y, 3).
X = 3.               % Suspicious — Y is unbound, we know nothing about Y.
```

The second call succeeds with only `X = 3` bound because the first clause matches (`X >= Y` requires both ground — it raises an error in strict systems, or in lenient ones with X=3 and Y unbound it does the unintended thing). With a well-written `max/3`, this should fail or be more explicit.

The fix: make cuts green by writing mutually exclusive clause bodies, or use `->` for local conditionals:

```prolog
max(X, Y, M) :- ( X >= Y -> M = X ; M = Y ).
```

### 13.3 Left Recursion Infinite Loops

Prolog's depth-first search expands the leftmost subgoal first. If a recursive predicate has a clause in which the recursive call precedes the "reduction" step, the recursion will go infinitely deep before hitting any base case.

```prolog
% Bad: left-recursive
ancestor(X, Y) :- ancestor(Z, Y), parent(X, Z).
ancestor(X, Y) :- parent(X, Y).

?- ancestor(tom, bob).
% infinite loop — Prolog keeps expanding ancestor(_, bob)
```

The fix: put the recursive step on the right.

```prolog
ancestor(X, Y) :- parent(X, Y).
ancestor(X, Y) :- parent(X, Z), ancestor(Z, Y).
```

Now the recursion progresses because `parent(X, Z)` binds `Z` before the recursive call, so each call has a "smaller" starting point.

Left recursion is particularly insidious in grammar rules and transitive closures. If your DCG goes into an infinite loop, check for left recursion — it is almost certainly the cause.

### 13.4 Missing Occurs Check

We saw in §3.4 that Prolog's default unification omits the occurs check. In most programs this doesn't matter. But occasionally you will write a meta-predicate that ends up unifying a variable with a term containing itself, and you will get a cyclic term that behaves strangely.

```prolog
?- X = f(X), write(X).
% SWI-Prolog writes: **, or **/1 repeated, or an error.
```

If you find a predicate behaving oddly and the printed output involves self-reference, try turning on the occurs check (`set_prolog_flag(occurs_check, true)`) and see if the bug goes away.

### 13.5 Mode Declarations — What They Mean

Many Prolog libraries annotate predicates with **mode declarations** that document how they are expected to be called. The notation comes from Mercury but is used informally throughout the Prolog world.

```prolog
%! append(+List1, +List2, -List3) is det.
%! append(-List1, -List2, +List3) is nondet.
```

The symbols:

- **`+`** input (must be ground, or at least instantiated)
- **`-`** output (will be bound by the predicate)
- **`?`** either (works in both modes)
- **`@`** input, not modified

The determinism annotation:

- **`det`** exactly one solution, never fails, no choice points
- **`semidet`** zero or one solution, may fail, no choice points
- **`multi`** one or more solutions
- **`nondet`** zero or more solutions
- **`erroneous`** never succeeds normally (always throws or fails loudly)

Mode declarations are documentation, not enforcement — standard Prolog does not check them. But they tell the user (and the implementer) what the intended usage is. If a predicate is documented as `det` and you call it in a way that causes backtracking, you are using it wrong. If the predicate is documented `+` in an argument and you pass a variable, you are also using it wrong.

Systems like Mercury take mode declarations seriously, checking them at compile time. In Prolog, they remain conventions — but useful ones.

---

## 14. A Gallery of Small Classic Programs

These are the programs every serious Prolog book shows you. They are classics not because they are trivial but because each illustrates some aspect of the language that is hard to see in isolation. Study them.

### 14.1 Quicksort — The Famous Four-Liner

This is perhaps *the* most famous Prolog program. It expresses quicksort with a beauty and concision that makes every imperative sorter look clumsy by comparison.

```prolog
quicksort([], []).
quicksort([Pivot|Rest], Sorted) :-
    partition(Rest, Pivot, Less, Greater),
    quicksort(Less, SortedLess),
    quicksort(Greater, SortedGreater),
    append(SortedLess, [Pivot|SortedGreater], Sorted).

partition([], _, [], []).
partition([X|Xs], Pivot, [X|Less], Greater) :-
    X =< Pivot, !,
    partition(Xs, Pivot, Less, Greater).
partition([X|Xs], Pivot, Less, [X|Greater]) :-
    partition(Xs, Pivot, Less, Greater).
```

Six lines if we don't count the blank. The quicksort predicate: to sort `[Pivot|Rest]`, partition `Rest` around the pivot, recursively sort both halves, and concatenate. The partition predicate uses a red cut to split cleanly.

A more compact version, using built-ins and inline partitioning:

```prolog
qsort([], []).
qsort([P|T], Sorted) :-
    partition([X]>>(X =< P), T, Less, Greater),
    qsort(Less, SL),
    qsort(Greater, SG),
    append(SL, [P|SG], Sorted).
```

(Using the `yall` library for inline lambdas, available in SWI-Prolog.)

### 14.2 N-Queens

Place N queens on an N×N chessboard so no two attack each other. The Prolog version is a textbook use of generate-and-test:

```prolog
queens(N, Queens) :-
    numlist(1, N, Ns),
    permutation(Ns, Queens),
    safe(Queens).

safe([]).
safe([Q|Qs]) :-
    no_attack(Q, Qs, 1),
    safe(Qs).

no_attack(_, [], _).
no_attack(Q, [Q1|Rest], Dist) :-
    Q =\= Q1 + Dist,
    Q =\= Q1 - Dist,
    Dist1 is Dist + 1,
    no_attack(Q, Rest, Dist1).
```

The idea: `Queens` is a permutation of 1..N, where `Queens[i]` is the row of the queen in column i. Since it's a permutation, no two queens share a row or column. We only need to check the diagonals, which `no_attack/3` does.

```prolog
?- queens(8, Qs).
Qs = [1, 5, 8, 6, 3, 7, 2, 4] ;
Qs = [1, 6, 8, 3, 7, 4, 2, 5] ;
...
```

For performance, use CLP(FD):

```prolog
:- use_module(library(clpfd)).

queens_fd(N, Qs) :-
    length(Qs, N),
    Qs ins 1..N,
    safe_fd(Qs),
    label(Qs).

safe_fd([]).
safe_fd([Q|Qs]) :-
    no_attack_fd(Q, Qs, 1),
    safe_fd(Qs).

no_attack_fd(_, [], _).
no_attack_fd(Q, [Q1|Rest], Dist) :-
    Q #\= Q1,
    Q #\= Q1 + Dist,
    Q #\= Q1 - Dist,
    Dist1 is Dist + 1,
    no_attack_fd(Q, Rest, Dist1).
```

CLP(FD) prunes the search dramatically and can solve N=20 or larger in reasonable time.

### 14.3 Zebra Puzzle (Einstein's Riddle)

A logic puzzle from the 1960s, often attributed (almost certainly wrongly) to Einstein. The setup: five houses of different colors, inhabited by people of different nationalities, with different pets, drinks, and cigarettes. A series of clues constrain the arrangement. The question: who owns the zebra, and who drinks water?

```prolog
zebra_puzzle(Owns_zebra, Drinks_water) :-
    Houses = [
        house(_, _, _, _, _),
        house(_, _, _, _, _),
        house(_, _, _, _, _),
        house(_, _, _, _, _),
        house(_, _, _, _, _)
    ],
    % house(Color, Nationality, Pet, Drink, Cigarette)
    member(house(red, english, _, _, _), Houses),
    member(house(_, spanish, dog, _, _), Houses),
    member(house(green, _, _, coffee, _), Houses),
    member(house(_, ukrainian, _, tea, _), Houses),
    right_of(house(green, _, _, _, _), house(ivory, _, _, _, _), Houses),
    member(house(_, _, snails, _, old_gold), Houses),
    member(house(yellow, _, _, _, kools), Houses),
    Houses = [_, _, house(_, _, _, milk, _), _, _],
    Houses = [house(_, norwegian, _, _, _) | _],
    next_to(house(_, _, _, _, chesterfields), house(_, _, fox, _, _), Houses),
    next_to(house(_, _, _, _, kools), house(_, _, horse, _, _), Houses),
    member(house(_, _, _, orange_juice, lucky_strike), Houses),
    member(house(_, japanese, _, _, parliaments), Houses),
    next_to(house(_, norwegian, _, _, _), house(blue, _, _, _, _), Houses),
    member(house(_, Owns_zebra, zebra, _, _), Houses),
    member(house(_, Drinks_water, _, water, _), Houses).

right_of(A, B, [B, A | _]).
right_of(A, B, [_ | Rest]) :- right_of(A, B, Rest).

next_to(A, B, [A, B | _]).
next_to(A, B, [B, A | _]).
next_to(A, B, [_ | Rest]) :- next_to(A, B, Rest).
```

Query: `?- zebra_puzzle(Z, W).` returns `Z = japanese, W = norwegian`. The puzzle's clues translate into Prolog constraints almost verbatim, and unification handles all the joining automatically. This program is about 25 lines; an equivalent Python solution would be 100 or more.

### 14.4 Tower of Hanoi

The recursive puzzle: move N disks from peg A to peg C using peg B, never placing a larger disk on a smaller one.

```prolog
hanoi(1, From, To, _) :-
    write('Move disk from '), write(From),
    write(' to '), write(To), nl.
hanoi(N, From, To, Via) :-
    N > 1,
    M is N - 1,
    hanoi(M, From, Via, To),
    hanoi(1, From, To, _),
    hanoi(M, Via, To, From).
```

Run it:

```prolog
?- hanoi(3, a, c, b).
Move disk from a to c
Move disk from a to b
Move disk from c to b
Move disk from a to c
Move disk from b to a
Move disk from b to c
Move disk from a to c
```

This is the standard recursive algorithm, expressed as directly as possible. Six lines of Prolog.

### 14.5 Graph Coloring

Given a graph and a list of colors, assign a color to each node such that adjacent nodes have different colors.

```prolog
color_map(Colors) :-
    Colors = [wa:WA, nt:NT, q:Q, nsw:NSW, v:V, sa:SA, t:T],
    member(WA, [red, green, blue]),
    member(NT, [red, green, blue]),
    member(Q, [red, green, blue]),
    member(NSW, [red, green, blue]),
    member(V, [red, green, blue]),
    member(SA, [red, green, blue]),
    member(T, [red, green, blue]),
    WA \= NT, WA \= SA,
    NT \= SA, NT \= Q,
    SA \= Q, SA \= NSW, SA \= V,
    Q \= NSW,
    NSW \= V.
```

This is the Australian states map coloring problem. Each state gets a color, and neighbors must differ. Three colors suffice (the map is planar and 3-colorable).

```prolog
?- color_map(Colors).
Colors = [wa:red, nt:green, q:red, nsw:green, v:red, sa:blue, t:red] ;
...
```

This is pure generate-and-test, which doesn't scale to large graphs. For serious graph coloring, use CLP(FD) with global constraints. But for small maps, the Prolog approach is short and clear.

### 14.6 Simple Natural Language Parser

A DCG that parses simple questions about a family database:

```prolog
:- use_module(library(lists)).

% Database
parent(tom, bob).
parent(tom, liz).
parent(bob, ann).
parent(bob, pat).

% Grammar
question(parent(X, Y)) --> [who], [is], [the, parent, of], person(Y), [?].
question(parent(X, Y)) --> [is], person(X), [the, parent, of], person(Y), [?].
question(children(X)) --> [who, are, the, children, of], person(X), [?].

person(X) --> [X], { atom(X), parent(X, _) ; parent(_, X) }.

% Answer generation
answer(parent(X, Y)) :- parent(X, Y), !.
answer(children(X)) :- findall(Y, parent(X, Y), Ys), write(Ys), nl.

% Top-level
ask(Sentence) :-
    phrase(question(Q), Sentence),
    answer(Q).

?- ask([is, tom, the, parent, of, bob, ?]).
true.

?- ask([who, are, the, children, of, tom, ?]).
[bob, liz]
```

This is the bare outline — a real NL system would need much more grammar, semantics, and dialogue management. But the approach — DCG for grammar, unification for binding, database for the knowledge — is authentic Prolog.

### 14.7 Tic-Tac-Toe Game Tree

A minimal tic-tac-toe player using minimax:

```prolog
:- dynamic board/1.

% Board is a list of 9 elements: x, o, or e (empty)
initial_board([e,e,e,e,e,e,e,e,e]).

% Winning lines
line([1,2,3]).
line([4,5,6]).
line([7,8,9]).
line([1,4,7]).
line([2,5,8]).
line([3,6,9]).
line([1,5,9]).
line([3,5,7]).

% Extract elements at positions
elems(Pos, Board, Elems) :-
    findall(E, (member(P, Pos), nth1(P, Board, E)), Elems).

% Check winner
winner(Board, Player) :-
    line(L),
    elems(L, Board, Es),
    maplist(=(Player), Es).

% Make a move
move(Board, Pos, Player, NewBoard) :-
    nth1(Pos, Board, e),
    replace(Board, Pos, Player, NewBoard).

replace([_|T], 1, E, [E|T]).
replace([H|T], N, E, [H|T1]) :-
    N > 1,
    N1 is N - 1,
    replace(T, N1, E, T1).

% Other player
other(x, o).
other(o, x).

% Minimax: choose the best move for Player
best_move(Board, Player, BestPos) :-
    findall(Pos-Score,
            ( move(Board, Pos, Player, NB),
              score(NB, Player, Score) ),
            Moves),
    max_score(Moves, BestPos, _).

score(Board, Player, 10) :- winner(Board, Player), !.
score(Board, Player, -10) :- other(Player, Opp), winner(Board, Opp), !.
score(Board, _, 0) :- \+ member(e, Board), !.
score(Board, Player, Score) :-
    other(Player, Opp),
    findall(S,
            ( move(Board, _, Opp, NB),
              score(NB, Opp, S1),
              S is -S1 ),
            Scores),
    max_list(Scores, Score).

max_score([P-S], P, S).
max_score([P1-S1 | Rest], P, S) :-
    max_score(Rest, P2, S2),
    ( S1 >= S2 -> P = P1, S = S1 ; P = P2, S = S2 ).
```

This is a minimal unoptimized minimax — it explores the full game tree every time. Alpha-beta pruning would speed it up, but the essential logic is right here in ~40 lines. Notice how the recursive evaluator mirrors the mathematical definition of minimax: your score is the maximum of your move's negated opponent scores.

---

## 15. Putting It All Together: The Mental Model

After all of this, it is worth stepping back and asking: what does it actually *feel like* to program in Prolog? What is the mental model that experienced practitioners carry around?

The core insight is this: **a Prolog program is a set of relations, and running it is asking "is this true? and if so, how?"**

You describe relationships between things. You state facts. You state rules that generalize those facts. Then you ask questions, and Prolog searches the space of possible proofs for ones that establish what you asked.

The consequences of this stance:

1. **Predicates are bidirectional by default.** Because your code describes relationships rather than computations, the same predicate can usually be used in multiple modes. Forward, backward, partial — unification and backtracking handle them all.

2. **Recursion replaces iteration entirely.** There is no `for` loop, no `while`. Every repetition is a recursive call. The accumulator pattern is the canonical way to express iteration-like computations.

3. **Choice is first-class.** Disjunction (`;`), multiple clauses, and backtracking make non-determinism a native feature. You can write search algorithms by just writing the rules that describe a solution.

4. **Data and code are the same thing.** Every program is a term. You can inspect, generate, and transform programs using the same tools you use for data. Meta-interpreters, DSL compilers, and program analyzers fall out of basic language features.

5. **Failure is information.** `fail`, `false`, and unbinding are normal, productive operations. Failure drives backtracking; backtracking drives search; search solves problems.

6. **The declarative dream is slightly out of reach.** Pure logic programming would let you ignore evaluation order entirely. In practice, Prolog's fixed search strategy means you must think about the operational reading too. This is the recurring tension of the language.

7. **Small programs do enormous work.** Prolog programs are usually shorter than their equivalents in other languages — sometimes by an order of magnitude. The right algorithm for the right problem, in Prolog, can be astonishingly compact.

8. **You will hit walls.** When your problem is not a good fit — lots of mutable state, numerical computation, real-time systems — Prolog will fight you. That is not a failure of the language; it is a signal to use a different tool.

The mental shift is real. It takes weeks to get comfortable thinking in relations instead of functions, in search instead of execution, in unification instead of pattern matching. But once the shift happens, a certain class of problems — those involving symbolic reasoning, constraint satisfaction, parsing, rule-based inference, and search — become trivially expressible in a way that feels almost magical.

Prolog is a language for describing what you know, not what you do. Its power lies in the things that happen automatically once you have described enough: unification parameterizes your predicates, backtracking searches your solution space, SLD resolution proves your theorems. You write less, and the system does more — as long as you can stomach the occasional occurs check, the floundering negation, the inscrutable cut, and the famous `is/2` gotcha.

It is a language from 1972 that still feels, in 2026, like a glimpse of how programming could have been. Not a replacement for everything, but a way of thinking that every serious programmer should encounter at least once.

---

## References and Further Reading

- **ISO/IEC 13211-1:1995** — The Prolog standard. The authoritative reference for syntax, semantics, and built-ins.
- **Sterling & Shapiro, *The Art of Prolog* (2nd ed., 1994)** — the classic textbook. Thorough coverage of techniques and idioms.
- **Ivan Bratko, *Prolog Programming for Artificial Intelligence* (4th ed., 2011)** — the classic applications text. Expert systems, search, game playing, machine learning.
- **Richard A. O'Keefe, *The Craft of Prolog* (1990)** — the style guide. How to write Prolog programs that are efficient, idiomatic, and portable. Green cuts vs. red cuts comes from here.
- **Patrick Blackburn, Johan Bos, and Kristina Striegnitz, *Learn Prolog Now!* (2006)** — an excellent free online introduction. Clear examples, modern emphasis.
- **SWI-Prolog Manual** — the reference for the most widely used modern Prolog system. Extensive documentation of the standard library.
- **Robert Kowalski, "Algorithm = Logic + Control" (1979)** — the paper that named the Prolog vision.
- **J. Alan Robinson, "A machine-oriented logic based on the resolution principle" (1965)** — the paper that introduced unification and resolution.
- **Alain Colmerauer and Philippe Roussel, "The birth of Prolog" (1992)** — the history of Prolog from its creators.
- **Markus Triska, *The Power of Prolog*** — a modern online text with strong emphasis on pure, relational programming and CLP(FD).

---

## Study Guide — Prolog Language & Semantics

### Key concepts

1. **Unification.** The one operation that makes Prolog
   work.
2. **Resolution.** SLD resolution as a proof procedure.
3. **Backtracking.** When a goal fails, try the next
   alternative.
4. **Cut (`!`).** Controls backtracking; the only
   non-declarative bit.
5. **Negation as failure.** `not(X)` = "I cannot prove X."

---

## Programming Examples

### Example 1 — Append

```prolog
append([], L, L).
append([H|T], L, [H|R]) :- append(T, L, R).
```

Three lines. Runs forward, backward, and every which way.
Query `append(X, Y, [1,2,3]).` and Prolog generates all
splits.

### Example 2 — Factorial

```prolog
fact(0, 1).
fact(N, F) :- N > 0, N1 is N - 1, fact(N1, F1), F is N * F1.
```

### Example 3 — Family tree

```prolog
parent(tom, bob).
parent(bob, ann).
ancestor(X, Y) :- parent(X, Y).
ancestor(X, Y) :- parent(X, Z), ancestor(Z, Y).
```

Query: `ancestor(tom, ann).` → `true`.

---

## DIY & TRY

### DIY 1 — Write append backwards

Use `append` to split a list all ways. Observe the power
of a relational definition.

### DIY 2 — Solve Zebra

The Zebra puzzle (Einstein's Riddle) is a canonical
Prolog exercise. 100 lines.

### TRY — Write a Sudoku solver

With CLP(FD), a Sudoku solver is 30 lines. Read Markus
Triska's version.

---

## Related College Departments

- [**coding**](../../../.college/departments/coding/DEPARTMENT.md)
- [**mathematics**](../../../.college/departments/mathematics/DEPARTMENT.md)

---

*End of document.*
