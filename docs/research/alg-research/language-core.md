# ALGOL 60: The Language Core

*A deep technical reading of the Report on the Algorithmic Language ALGOL 60 and the features
that every block-structured language inherited from it.*

---

## Preface

ALGOL 60 is one of those rare artifacts in computer science whose influence vastly exceeds
the number of programs ever written in it. Measured by production code shipped, ALGOL 60
barely registers next to COBOL or Fortran. Measured by the ideas it put into the water
supply of every programming language that followed, it is arguably the most important
language ever designed.

The *Report on the Algorithmic Language ALGOL 60*, edited by Peter Naur and published in
*Communications of the ACM* in May 1960, runs to roughly seventeen pages of technical
prose plus a few pages of examples. In that short space it introduces:

- A formal syntax notation (what we now call Backus–Naur Form)
- Block structure with lexical scope
- Recursive procedures as a consequence of block structure
- Dynamic arrays whose bounds are evaluated at block entry
- Two fully specified parameter-passing modes (value and name)
- Typed functions and typeless procedures
- Compound statements, conditional expressions, and the `for` loop as we still know it
- A precise distinction between three *languages* — reference, publication, and hardware —
  that anticipates the modern separation between abstract syntax, rendered syntax, and
  serialized form

The Report is not a tutorial. It is a specification written by mathematicians for
mathematicians and it assumes the reader is comfortable with careful definitions. Read
today, it is remarkably modern: a language designer in 2026 could take the Report as a
starting point, add strings and I/O and a module system, and ship a language people would
happily use.

This document walks the core of ALGOL 60 with the depth the Report deserves. It is not
comprehensive — entire dissertations have been written on call-by-name alone — but it
aims to be precise where the Report is precise and to give enough code that the reader
can feel what ALGOL 60 actually looks like.

---

## 1. The Three Languages of ALGOL

ALGOL 60 was explicitly described in the Report as existing in three distinct forms.
This three-language split is one of the most underappreciated design moves in the
history of programming languages, and it grew directly out of the international
character of the ALGOL committee. The committee included people whose keyboards could
not agree on anything — American ASCII-era researchers, European users of ISO-646
variants, Scandinavians with entirely different character sets, and teletype operators
whose machines might not even have lowercase letters. Rather than nail the language to
any one character set, the committee decomposed it.

### 1.1 Reference Language

The reference language is the one specified in the Report. It is the abstract,
authoritative form. When the Report writes `begin`, it means the reserved word `begin`
as a single lexical token, distinct from any identifier the programmer might choose.
When it writes `×` it means the arithmetic multiplication operator, and when it writes
`≤` it means less-than-or-equal, a single token that has nothing to do with the two
ASCII characters `<` and `=`.

The reference language is what the committee argued about. It is what implementers were
required to implement. It is what the Report's grammar (written in the notation that
became BNF) generates.

### 1.2 Publication Language

The publication language is the form in which ALGOL 60 programs were meant to be printed
in journals and textbooks. Here the ideal was full mathematical typography. Keywords
appeared in **bold** or were underlined. The multiplication sign was a real `×`, not
the asterisk `*`. Division was `÷` or a proper horizontal fraction bar. The relational
operators `≤`, `≥`, `≠` were single glyphs. Exponentiation was a raised superscript, so
`a↑2` in the reference language became `a²` in print. Implication and logical equivalence
used `⊃` and `≡`. Negation used `¬`. Boolean conjunction and disjunction used `∧` and `∨`.

The effect, when printed in a journal like *Communications of the ACM* or *Numerische
Mathematik*, was that an ALGOL 60 program looked almost exactly like the mathematical
text around it. A `for` loop computing a sum looked like a sigma sum. Subscripted array
references looked like subscripted variables. This was not an accident; it was a
commitment. ALGOL 60 was meant to be a *publishable* language, and the committee
believed that if programs were to become part of the scientific literature they had to
typeset like mathematics.

Hoare's *Quicksort* paper ([CACM, July 1961](https://dl.acm.org/doi/10.1145/366622.366644))
is the canonical example. The algorithm is set in proper publication ALGOL, with bold
keywords, real inequality glyphs, and indented block structure. Reading it feels like
reading a lemma in a numerical-analysis paper, which is exactly the intended effect.

### 1.3 Hardware Language

The hardware language is whatever the local compiler actually accepted. It had to be
typeable on real keyboards, punchable onto real cards, and survivable by real line
printers. Here the committee gave up and said: do whatever your machine can do, as long
as there is a clear mechanical translation back to the reference language.

So `×` might become `*`. `÷` might become `/` or `//`. `≤` might become `<=` or `.LE.`
or `'LE'`. `↑` might become `**`. Bold `begin` might become `BEGIN`, or `'BEGIN'`, or
`.BEGIN.`, or `"BEGIN"`.

The ugly truth is that every ALGOL 60 implementation looked different. A program written
for the Elliott 803 ALGOL compiler at Oxford could not be fed directly into the
Burroughs B5000 ALGOL compiler without transliteration. The Report had defined one
language, but the world's computers implemented a hundred dialects of its hardware form.

### 1.4 The Keyword Problem and Stropping

The deepest tension in this three-language design was the keyword problem.

In the reference language, keywords like `begin`, `end`, `if`, `then`, `else`, `for`,
`do`, `step`, `until`, `while`, `procedure`, `integer`, `real`, and `boolean` are
reserved. They are lexical tokens distinct from identifiers. In the publication
language this distinction is visual: keywords are set in bold, identifiers in italic,
so `begin` (keyword) and `begin` (an unfortunate variable name) are visibly different.

In the hardware language there is no bold. You get one alphabet. And now you have a
choice: either reserve keywords globally (so `begin` cannot also be a variable name —
the modern C approach) or mark keywords somehow when they appear (so the programmer can
still use `begin` as a variable). The ALGOL committee did not want to reserve words,
because their users were scientists who had favorite variable names and did not want
them taken away.

The solution was **stropping**: a mechanical marking that tags a word as a keyword.
Different implementations chose different stropping conventions:

- **Apostrophe stropping**: `'BEGIN'`, `'END'`, `'IF'` — used in many European
  implementations, including the Elliott 803 and ICL 1900.
- **Period stropping**: `.BEGIN`, `.END`, `.IF` — used in some early compilers.
- **Quote stropping**: `"BEGIN"`, `"END"` — also common.
- **Uppercase stropping**: keywords in UPPERCASE, identifiers in lowercase (or vice
  versa). This only worked on machines that distinguished case, which in the 1960s was
  not guaranteed.
- **Case-insensitive reservation**: a few compilers just reserved the words and told
  the user to pick different variable names. This eventually won the war, because by
  the time ALGOL 68 and its descendants came around, everyone had more-or-less accepted
  that `begin` and `end` were not legal identifiers.

Stropping lives on in a few corners. PL/I had a reserved-word-optional design. Unison
uses backticks for special cases. Most languages eventually chose global reservation,
which is conceptually simpler but loses the flexibility ALGOL 60 tried to preserve.

The three-languages design is important to understand because it explains why ALGOL 60
code you find in old journals looks nothing like ALGOL 60 code you find in old source
decks. They are the same language, rendered for different audiences.

---

## 2. Block Structure and Lexical Scope

If ALGOL 60 had given us nothing but block structure, it would still be one of the most
important languages in history. Every block-structured language — C, Pascal, Ada,
Modula-2, Oberon, Java, C#, JavaScript, Rust, Go, Swift — is a direct descendant.
Python and Ruby use a weaker dynamic-scope-flavored variant, but the underlying *idea*
of nested lexical environments comes straight from the Report.

### 2.1 The Block as a Unit

A **block** in ALGOL 60 is a sequence of declarations followed by a sequence of
statements, enclosed in `begin` and `end`:

```algol
begin
  integer i, j;
  real x;
  i := 0;
  x := 3.14;
  j := i + 1
end
```

The declarations introduce names; the statements use them. The names are *local* to the
block: they come into existence when control enters the `begin`, and they cease to
exist when control leaves the `end`. An outer block cannot see an inner block's locals,
and once the inner block exits, its locals are gone forever.

This sounds utterly obvious today. It was not obvious in 1960. Fortran had no blocks.
COBOL had paragraphs and sections but no lexical nesting. Assembly had labels and
nothing else. The idea that a program could be a tree of nested scopes, each with its
own declarations, was a genuine invention.

### 2.2 Nested Blocks

Blocks can be nested arbitrarily:

```algol
begin
  integer x;
  x := 1;
  begin
    integer y;
    y := x + 1;
    begin
      integer x;
      x := y * 2;
      comment inner x shadows outer x
    end;
    comment here x is 1 again, y is 2
  end;
  comment here only x (=1) is visible
end
```

When the inner block declares its own `x`, the outer `x` is *shadowed* — not destroyed,
just hidden. Inside the inner block, the name `x` refers to the inner declaration. Once
the inner block ends, the outer `x` is visible again with its original value. This is
**lexical scoping**: the meaning of a name at a given point in the program text is
determined by the innermost enclosing declaration of that name.

### 2.3 Compared to Fortran and COBOL

Fortran had no block structure in 1960. A Fortran II or Fortran IV program was a flat
list of subroutines. Variables within a subroutine were all global to that subroutine;
there were no inner scopes. COBOL had the DATA DIVISION and the PROCEDURE DIVISION, but
no way to say *this variable exists only inside this paragraph*. Both languages
essentially gave you one level of naming per routine.

This had consequences. In Fortran you could not write a loop that temporarily needed a
counter without giving that counter a name at the top of the subroutine. Every helper
variable polluted the subroutine's namespace. Large Fortran programs became exercises
in name management. In ALGOL 60, you could just open a block, declare what you needed,
and know that the name would evaporate when you were done.

### 2.4 The Stack Discipline

Blocks nest. When control enters a block, we push that block's locals onto an
allocation area; when control exits, we pop them off. Entries and exits are strictly
nested, so the allocation area is a stack.

This **stack discipline** is what makes ALGOL 60 efficiently compilable. A block's
locals live at a known offset from the top of the stack at the moment the block is
active. Accessing a local is a memory reference relative to a stack pointer, which on
most machines is one instruction.

The stack discipline also generalizes to procedures. When a procedure is called, we
push an activation record for the call; when it returns, we pop it. Nested calls push
nested activation records. Recursive calls push multiple activation records for the
same procedure. Everything nests, so the stack works.

### 2.5 The Burroughs B5000

The Burroughs B5000, designed in the early 1960s and shipped in 1961, was built *around*
the idea of running ALGOL 60 natively. This is almost unique in the history of
architecture: a commercial mainframe whose instruction set was designed to match a
high-level language, not the other way around.

The B5000's key design choices were all ALGOL features turned into hardware:

- **Stack-based execution**: the top of the expression stack was in registers (A and
  B), and everything else lived in memory as a contiguous stack. Arithmetic operations
  popped their operands off the stack and pushed the result. This mapped directly onto
  ALGOL 60's expression evaluation semantics.
- **Activation records in hardware**: procedure entry and exit were hardware
  primitives. The MKS (mark stack) instruction opened a new activation record; the
  procedure call instructions set up the frame and jumped. Return instructions popped
  the frame automatically.
- **The display**: a small set of registers, the **display**, held pointers to the
  activation records of all currently-enclosing lexical blocks. When code inside a
  nested procedure needed to reference a variable from an outer enclosing scope, it
  consulted the display to find the right activation record. This made lexical scope
  efficient even in the presence of nested procedures, which is nontrivial.
- **Descriptors**: arrays were represented as descriptors (pointer plus bounds), so
  array-bound checking was hardware-enforced on every access. This matched ALGOL 60's
  semantics, which required bounds checking in principle.

The B5000 was a commercial success and its descendants (B5500, B6500, B6700, B7700, and
eventually the Unisys ClearPath MCP line) ran for decades. You could argue it is the
only mainframe architecture ever designed *by* a language, and that language was ALGOL 60.

### 2.6 The Display and Nested Scopes

The **display** is worth a moment of attention because it is the data structure that
makes lexical scope in nested procedures work efficiently. The problem is this: if
procedure `outer` declares a local `x`, and nested inside `outer` is procedure `inner`,
and `inner` references `x`, then at the moment `inner` runs it needs to find the
activation record of the *most recent call to outer*, not just any stack frame.

Naïvely, you could walk up the static chain — a linked list of enclosing activation
records — until you found the right level. This takes time proportional to the nesting
depth. The display optimizes this: instead of a linked list, maintain an array indexed
by static nesting level, where `display[k]` always points to the activation record of
the enclosing block at level `k`. Then accessing a variable at level `k` is just
`display[k] + offset`, two loads instead of a loop.

The display must be maintained across procedure calls: when `inner` is called, it
saves and updates the relevant display entry; on return, it restores it. This
bookkeeping is a small constant cost per call, and in exchange every non-local access
is O(1). Dijkstra described this technique in his 1960 paper on recursive procedures
and it became standard in ALGOL 60 implementations. The Burroughs B5000 implemented it
in hardware.

### 2.7 Why Block Structure Mattered

ALGOL 60 proved three things that had not been clear before:

1. **Nested lexical scope can be specified precisely.** The Report gave a formal
   grammar and a prose specification, and together they defined unambiguously which
   declaration of a name a given reference resolved to.
2. **Nested lexical scope can be compiled efficiently.** The display and stack
   discipline made non-local access cheap. Dijkstra's 1960 paper and the B5000's
   hardware showed it could be done.
3. **Recursive procedures fall out for free.** Once you have a stack of activation
   records, there is nothing special about a procedure calling itself. The same
   machinery handles it.

Every block-structured language since inherits all three.

---

## 3. Proper Recursion

Fortran I, specified in 1957, explicitly forbade recursion. The language was designed
for fast execution on an IBM 704, and the compiler allocated local variables *statically*
— each subroutine had one activation record permanently assigned to it. If a subroutine
called itself, the recursive call would overwrite the caller's variables, and the
program would silently corrupt itself.

This was not presented as a limitation to work around; it was a choice the Fortran
designers made. Recursion was considered a fringe mathematical feature that serious
scientific programmers did not need. And on machines with no hardware stack and very
little memory, supporting recursion meant either paying for dynamic allocation on
every call or adding hardware that did not yet exist.

ALGOL 60 took the opposite position. The Report specified that a procedure may call
itself, directly or indirectly. Section 5.4.4 of the Report makes this explicit. The
committee — Dijkstra in particular — argued that recursion was a natural consequence
of block structure, and that a language which could not express recursive definitions
was fighting against mathematics itself.

### 3.1 The Classic Examples

Factorial is the canonical first example:

```algol
integer procedure factorial(n); value n; integer n;
begin
  if n = 0 then
    factorial := 1
  else
    factorial := n * factorial(n - 1)
end
```

Note the assignment-to-function-name syntax: the result of an ALGOL 60 typed procedure
is whatever value has been assigned to the procedure's name inside the body. There is
no `return` statement.

Fibonacci:

```algol
integer procedure fib(n); value n; integer n;
begin
  if n < 2 then
    fib := n
  else
    fib := fib(n - 1) + fib(n - 2)
end
```

Ackermann, the classic non-primitive-recursive nightmare:

```algol
integer procedure ack(m, n); value m, n; integer m, n;
begin
  if m = 0 then
    ack := n + 1
  else if n = 0 then
    ack := ack(m - 1, 1)
  else
    ack := ack(m - 1, ack(m, n - 1))
end
```

Mutual recursion also works:

```algol
begin
  boolean procedure even(n); value n; integer n;
  begin
    if n = 0 then even := true
    else even := odd(n - 1)
  end;

  boolean procedure odd(n); value n; integer n;
  begin
    if n = 0 then odd := false
    else odd := even(n - 1)
  end;

  ...
end
```

There is a declaration-order subtlety here: the Report required names to be declared
before use, which is a problem for mutual recursion. Some implementations handled this
with forward declarations; others scanned the block for declarations before processing
statements, so declaration order within a block did not matter for visibility.

### 3.2 Compiling Recursion

The compiler problem is: where do local variables live when a procedure can call
itself? The answer — obvious now, genuinely novel in 1960 — is the **activation
record stack**.

Each procedure call pushes a fresh activation record onto the stack. The activation
record holds the procedure's locals, its parameters, a pointer back to its caller's
activation record (the dynamic link), and a pointer to the lexically enclosing block's
activation record (the static link). When the procedure returns, its activation record
is popped, and the caller's state is restored.

Dijkstra at the Mathematisch Centrum in Amsterdam worked out the details of this
scheme for the X1 ALGOL compiler (Dijkstra and Zonneveld, 1960 — the first working
ALGOL 60 compiler). The paper *Recursive Programming* (Dijkstra, 1960) is a concise
statement of the technique. It is one of the founding documents of compiler theory.

### 3.3 Knuth's *Man or Boy?* Test

In 1964, Donald Knuth proposed a program that would distinguish "real" ALGOL 60
implementations from fake ones. He called it the *Man or Boy?* test, and published it
in the *ALGOL Bulletin*. It is a single procedure, `A`, that computes a value by
recursively calling itself in a way that depends deeply on call-by-name, nested
procedures, and correct handling of non-local references through the display.

The program, in reference ALGOL 60:

```algol
begin
  real procedure A(k, x1, x2, x3, x4, x5);
    value k; integer k;
    real x1, x2, x3, x4, x5;
  begin
    real procedure B;
    begin
      k := k - 1;
      B := A := A(k, B, x1, x2, x3, x4)
    end;
    if k <= 0 then A := x4 + x5 else B
  end;
  outreal(A(10, 1, -1, -1, 1, 0))
end
```

The test value is `A(10, 1, -1, -1, 1, 0)`. The correct answer is `-67`. For `k = 4`
it is `1`. For `k = 9` it is `-30`. For `k = 14` it is `-3606`.

The program is fiendish. It uses:

- **Call-by-name** for all parameters except `k`. When inside the body of `A` we
  reference `x1`, we are really re-evaluating the actual expression passed as `x1` at
  the call site, in the caller's scope.
- **Nested procedures with access to outer parameters**. The nested procedure `B`
  references `k`, `x1`, `x2`, `x3`, `x4` — all of which are parameters of the enclosing
  call to `A`. Each recursive call to `A` creates a fresh set of these.
- **Assignment to the function name inside a nested procedure**. `B := A := ...`
  assigns to both `B` and the enclosing `A`, so returning from `B` also returns a
  value from `A`.
- **The thunk semantics of call-by-name** in full effect. When `B` is passed as `x1`
  to the next call of `A`, it becomes a thunk that, when evaluated inside that inner
  call, calls back out to the outer `A`'s `B`, which mutates the outer `A`'s `k`, which
  affects subsequent evaluations.

An implementation that got this program right was handling call-by-name, nested
procedures, the display, and recursion correctly. An implementation that cut corners
anywhere would produce wrong answers. Knuth's test became a canonical ALGOL 60
conformance benchmark, and reports on various implementations' performance on it
appeared regularly in the *ALGOL Bulletin* throughout the mid-1960s.

### 3.4 What Recursion Gave the World

Every language we use today supports recursion. We take it for granted. It came from
ALGOL 60. More precisely, it came from the combination of block structure plus stack
discipline that ALGOL 60 pioneered and Dijkstra and Zonneveld first compiled. Lisp
had recursion from the start (McCarthy, 1960), but Lisp was a specialty language used
by AI researchers. ALGOL 60 brought recursion into the mainstream of numerical and
scientific computing, and from there into every general-purpose language.

---

## 4. Call-By-Name vs Call-By-Value

Call-by-name is the single weirdest thing in ALGOL 60. It is also the feature that
most influenced theoretical computer science, inspired the development of denotational
semantics, and — in a direct line — led to the lazy evaluation of Haskell and the
by-name parameters of Scala.

### 4.1 Call-By-Value

Call-by-value is the easy case and the one every programmer already understands.
When you call a procedure and pass an expression as a parameter, the expression is
evaluated *once* at the call site, and the resulting value is bound to the formal
parameter inside the procedure. Subsequent uses of the formal parameter inside the body
look up that stored value.

```algol
integer procedure square(n); value n; integer n;
begin
  square := n * n
end
```

A call `square(3 + 4)` evaluates `3 + 4` once, gets `7`, binds `n` to `7`, then
evaluates `n * n` which gives `49`. This is the default mode we expect.

Note the `value n` declaration in the procedure heading. ALGOL 60 required explicit
marking for value parameters; otherwise, the default was call-by-name.

### 4.2 Call-By-Name

Call-by-name is specified by the **copy rule**. When you call a procedure with an
actual parameter, the compiler does not evaluate the actual parameter. Instead, it
substitutes the *text* of the actual parameter expression in place of every
reference to the formal parameter inside the body, as if by textual replacement, and
*then* evaluates the resulting body.

Put another way: every reference to the formal parameter inside the body re-evaluates
the actual parameter expression, *in the caller's scope*, *every time*.

Here is the minimal example of why this matters:

```algol
integer procedure double(x); integer x;
begin
  double := x + x
end
```

Note there is no `value x` — so `x` is call-by-name. If you call `double(f())` where
`f` is a procedure with side effects, then `f` is called **twice**, once for each
reference to `x` in the body. With call-by-value, `f` would be called once and its
result used twice.

The caller-scope evaluation matters too. Consider:

```algol
begin
  integer i;
  integer procedure p(x); integer x;
  begin
    i := i + 1;
    p := x
  end;
  integer a;
  a := p(i * 10);
  ...
end
```

When `p(i * 10)` is called with `i = 0`, the body of `p` runs. First `i := i + 1`
makes `i` become 1. Then `p := x` evaluates `x`. But `x` is call-by-name, so evaluating
`x` means re-evaluating `i * 10` in the *caller's* scope — and the caller's `i` is now
1 (because the same `i` was mutated!). So `p := 10`, not `p := 0`.

This is profoundly confusing and was the source of endless debate and bug reports.

### 4.3 Thunks

How do you implement call-by-name? You cannot literally substitute text, because the
procedure body is already compiled. Instead, the compiler generates a small anonymous
procedure — a **thunk** — for each by-name actual parameter. The thunk, when called,
evaluates the actual parameter expression in the caller's environment (it has access
to the caller's variables via the display) and returns the current value.

At the call site, the compiler passes a pointer to the thunk. Inside the called
procedure, every reference to the formal parameter becomes a call to the thunk.

The term **thunk** was coined for exactly this purpose, reportedly by Peter Ingerman in
1961. Folklore has it that it was chosen because the value of the parameter had "already
been *thought* about" by the time the procedure used it — the past tense of *think*
being, jokingly, *thunk*. Whether or not that etymology is real, the word stuck, and is
now the standard term in compiler literature for a zero-argument closure that lazily
computes a value.

### 4.4 Jensen's Device

The most famous use of call-by-name is **Jensen's device**, named after Jørn Jensen,
Peter Naur's colleague at Regnecentralen in Copenhagen. Jensen's device exploits
call-by-name to build a crude form of higher-order function — a decade before ML and
twenty years before anyone was using the phrase *first-class functions* in mainstream
programming.

The idea: pass an expression as a by-name parameter, along with a by-name parameter
that is a *variable used inside that expression*. When the procedure body mutates the
variable and then references the expression, the expression re-evaluates with the new
value of the variable. You have effectively passed a function of one argument using
only call-by-name.

Here is the classic summation procedure:

```algol
real procedure sum(i, lo, hi, term);
  value lo, hi;
  integer i, lo, hi;
  real term;
begin
  real s;
  s := 0;
  for i := lo step 1 until hi do
    s := s + term;
  sum := s
end
```

The parameters `lo` and `hi` are passed by value — they are just numbers. But `i` and
`term` are by-name. You call it like this:

```algol
real total;
integer k;
total := sum(k, 1, 100, k * k)
```

Inside `sum`, the `for` loop increments `k` from 1 to 100 (because `i` is by-name and
aliased to `k`). For each value of `k`, the reference to `term` inside the loop re-
evaluates `k * k` in the caller's scope, using the *current* value of `k`. The result
is the sum of squares from 1 to 100.

You have, in effect, just written `sum(f) = Σ f(k)` for `k = 1..100`, passing `f` as
the expression `k * k` and `k` as the summation variable. This is a lambda in disguise.
Without higher-order functions, without lambda expressions, without function types,
Jensen figured out how to pass functions around.

You can use the same trick for integration, sorting by a key function, searching with
a predicate — anywhere you would pass a function today.

### 4.5 The Aliasing Problem: swap

Jensen's device is elegant. Call-by-name also has a notorious failure mode. Consider
the obvious `swap` procedure:

```algol
procedure swap(a, b); integer a, b;
begin
  integer t;
  t := a;
  a := b;
  b := t
end
```

With call-by-name, calling `swap(i, j)` works: the body of `swap` references `a` (which
is `i`) and `b` (which is `j`), reads and writes both via their thunks, and produces
the expected swap.

Now call `swap(i, A[i])`. This should swap `i` and `A[i]`. But here is what happens:

1. `t := a` — look up `a`, which is the thunk for `i`. Current value: say, `3`. So
   `t := 3`.
2. `a := b` — look up `b`, which is the thunk for `A[i]`. Current `i` is `3`, so look
   up `A[3]`. Say it is `99`. Assign `99` to `a`, which means assigning `99` to `i`.
   Now `i = 99`.
3. `b := t` — assign `t` (which is 3) to `b`. `b` is the thunk for `A[i]`. But `i` is
   now `99`, so this assigns `3` to `A[99]`, not to `A[3]`.

The array element we were trying to swap with is still untouched. We have corrupted
`A[99]` instead. The by-name semantics *re-evaluates the subscript expression every
time we reference `b`*, and because step 2 mutated `i`, step 3 references a different
array element.

This is the aliasing problem, and it cannot be fixed by clever programming. It is a
fundamental consequence of the copy-rule semantics. It made generic utility procedures
like `swap` dangerous to write in ALGOL 60, because the caller had to know whether the
implementation would be caught by aliasing.

### 4.6 Why Call-By-Name Was Dropped

Later languages looked at call-by-name and mostly dropped it:

- **Pascal** (Wirth, 1970) kept only value parameters and var (reference) parameters.
  No by-name.
- **C** (1972) had only value; reference semantics required explicit pointers.
- **Ada** (1983) had `in`, `out`, and `in out` modes — all value-like.
- **Modula-2**, **Oberon**, **Java**, **C#**, **Python**, **Ruby**, **Go**, **Rust**,
  **Swift** — none have call-by-name as a standard feature.

The reasons: call-by-name is surprising to programmers, hard to compile efficiently
(every reference is a function call, not a memory load), enables weird code, and
produces bugs like the `swap` example that are genuinely hard to debug. The benefits
— Jensen's device and a few pattern-building tricks — could be had more cleanly with
first-class functions or lambda expressions, once those became mainstream.

### 4.7 The Descendants of Call-By-Name

Call-by-name did not die. It was reborn in cleaner form in several places:

- **Lazy evaluation** (call-by-need) is call-by-name with memoization: the expression is
  evaluated the first time the formal parameter is referenced, and the result is
  cached so subsequent references reuse it. This eliminates the "evaluated multiple
  times" surprise while preserving the "evaluated only if needed" benefit. **Haskell**
  is built entirely on call-by-need. **Clean** and **Miranda** before it, the same.
- **By-name parameters in Scala**: Scala has explicit `=> T` parameter types that
  behave exactly like ALGOL 60 call-by-name. You write `def unless(cond: Boolean)(body:
  => Unit)` and Scala re-evaluates `body` each time you reference it inside `unless`.
  This is used heavily for control abstractions, assertions, and logging.
- **Macros**: Lisp macros and their descendants in Scheme, Rust, and OCaml are
  essentially call-by-name at the syntactic level. The macro arguments are re-inserted
  into the body textually.
- **Denotational semantics**: Strachey and Wadsworth's 1974 paper *Continuations: A
  Mathematical Semantics for Handling Full Jumps* (Oxford PRG Technical Monograph
  PRG-11) developed the mathematical framework for describing languages like ALGOL 60
  precisely. Strachey's earlier work on the semantics of call-by-name directly
  motivated the development of lambda-calculus-based language semantics, which
  eventually became the foundation of all modern programming language theory.

Call-by-name is one of those features that was too clever for its first home but
seeded entire research programs. Haskell exists because Algol had call-by-name.

---

## 5. Procedures and Functions

ALGOL 60 called them all **procedures**. A procedure could be typed (returning a
value, like a mathematical function) or untyped (void-returning, executed for its
effect). The distinction was in the declaration.

### 5.1 Untyped Procedures

An untyped procedure is declared with the keyword `procedure`:

```algol
procedure print_vector(v, n); value n; integer n; real array v;
begin
  integer i;
  for i := 1 step 1 until n do
    outreal(v[i])
end
```

This procedure has no return value. It is called for its side effect (printing).

### 5.2 Typed Procedures

A typed procedure is declared with a type before `procedure`:

```algol
real procedure norm(v, n); value n; integer n; real array v;
begin
  real s;
  integer i;
  s := 0;
  for i := 1 step 1 until n do
    s := s + v[i] * v[i];
  norm := sqrt(s)
end
```

The type `real` before `procedure` indicates the result type. The return value is
produced by assigning to the procedure's name inside the body: `norm := sqrt(s)`.
There is no `return` statement. The assignment does not cause an immediate return;
execution continues until the end of the body, and whatever value was most recently
assigned to the procedure name becomes the result.

This is strange to modern eyes — it looks like the procedure name is being used as a
local variable — and some implementations treated it that way. It is a syntactic
quirk that Pascal removed (Pascal also uses assignment to function name, but only
Pascal-80 added early `return`).

### 5.3 Parameter Specifications

Parameters in ALGOL 60 had two things specified: their *type* and their *mode*
(value or name). The type specification came in a separate clause after the parameter
list, not inline with the parameters. This is the origin of the slightly awkward
procedure headings:

```algol
procedure foo(a, b, c, d); value a, b; integer a, c; real b, d;
```

Here `a`, `b`, `c`, `d` are the formal parameters. `value a, b` marks `a` and `b` as
call-by-value (the rest default to call-by-name). `integer a, c` says `a` and `c` have
type `integer`. `real b, d` says `b` and `d` have type `real`.

Later languages simplified this by putting the type inline with the parameter:

```
procedure foo(value a: integer; value b: real; c: integer; d: real)
```

### 5.4 Nested Procedures

Procedures can be declared inside blocks, including inside other procedures. A nested
procedure has access to the enclosing procedure's parameters and locals through the
display mechanism described earlier.

```algol
real procedure integrate(f, a, b, n);
  value a, b, n;
  real a, b; integer n;
  real procedure f(x); value x; real x;
begin
  real h, sum;
  integer i;
  real procedure trapezoid(x0, x1);
    value x0, x1; real x0, x1;
  begin
    trapezoid := (f(x0) + f(x1)) / 2
  end;
  h := (b - a) / n;
  sum := 0;
  for i := 0 step 1 until n - 1 do
    sum := sum + trapezoid(a + i*h, a + (i+1)*h);
  integrate := h * sum
end
```

Note that `trapezoid` is nested inside `integrate` and has access to `integrate`'s
parameter `f`. This is closure-over-scope, and it works because of the display.

Note also that `f` is declared as a procedure parameter — you can pass procedures to
procedures. Combined with nested declarations, this gives ALGOL 60 *some* flavor of
higher-order programming, although procedures are not full first-class values (you
cannot store them in variables, return them from other procedures, or build data
structures of them).

### 5.5 Own Variables

The Report introduced `own` variables — local variables whose values *persist* across
calls to the procedure. An `own integer count` inside a procedure keeps its value
between invocations, like a `static` local in C.

```algol
integer procedure next_id;
begin
  own integer counter;
  counter := counter + 1;
  next_id := counter
end
```

Each call to `next_id` returns a new integer: 1, 2, 3, 4, ...

Own variables were controversial from the start. The semantics were under-specified:
the Report did not clearly say whether the initial value was zero or undefined, whether
own variables in nested blocks were shared across all activations, or how they
interacted with recursion. Implementations disagreed. Most later languages either
dropped them (Pascal, C++) or rebuilt them under different names (`static` locals in C,
class variables in object-oriented languages).

### 5.6 Forward Declarations and Mutual Recursion

The Report allowed forward declarations of procedures so that mutual recursion could
be expressed, but different implementations handled this differently. In practice,
ALGOL 60 programs that needed mutual recursion often had to be carefully ordered, or
wrapped in outer blocks that declared all the procedures together.

---

## 6. Arrays and Subscripts

ALGOL 60 treated arrays as first-class declarable entities with explicit bounds and,
strikingly, with bounds that could be expressions evaluated at block entry. This was
far ahead of Fortran's static arrays and decades ahead of C's rigidly-sized ones.

### 6.1 Declaration

Array declarations look like:

```algol
real array a[1:10];
integer array matrix[1:n, 1:m];
real array temps[-5:5, 0:23, 1:365];
```

The bounds are inclusive on both ends: `a[1:10]` has ten elements, indexed from 1 to
10. Multi-dimensional arrays use a comma-separated list of bound pairs.

### 6.2 Dynamic Bounds

Crucially, the bound expressions need not be constants. They can be any integer-valued
expression that is evaluable at block entry:

```algol
procedure solve(n); value n; integer n;
begin
  real array A[1:n, 1:n];
  real array b[1:n], x[1:n];
  ... fill in and solve Ax = b ...
end
```

When `solve(100)` is called, the block is entered, `n` is 100, and `A` is allocated as
a 100×100 array on the stack (or wherever the implementation chooses). When `solve`
returns, `A` is deallocated. Each call allocates fresh storage with the appropriate
size.

This was a remarkable feature in 1960. Fortran had no way to do this — array sizes
were fixed at compile time. C did not get this until C99's variable-length arrays, and
even then VLAs were considered controversial and were made optional in C11.

The implementation technique is straightforward once you have a stack: on block entry,
evaluate the bound expressions, compute the total size, and bump the stack pointer by
that amount. The array's base address becomes a local in the activation record. Array
accesses use the base address plus a computed offset.

### 6.3 Multi-Dimensional Arrays and Layout

The Report did not strictly specify whether multi-dimensional arrays were stored in
row-major or column-major order; implementations varied. Most ALGOL 60 compilers used
row-major (C-style) order. For scientific code this mattered because the cache-friendly
access pattern depended on it, although in 1960 nobody cared much about caches.

### 6.4 Bounds Checking

The Report specified that array accesses should be bounds-checked. An access outside
the declared bounds was an error. Implementations varied on whether bounds checking was
always enabled, optionally enabled, or compiled away for release builds. The Burroughs
B5000 did hardware bounds checking unconditionally using array descriptors.

This was another area where ALGOL 60 was ahead of its time. Fortran and C, then and
now, trust the programmer to stay in bounds. Most modern languages have moved back
toward mandatory bounds checking — Java, C#, Python, Rust, Go all enforce it. The idea
traces back to the Report.

### 6.5 Array Parameters

Arrays could be passed as parameters:

```algol
real procedure dot(a, b, n);
  value n; integer n;
  real array a, b;
begin
  real s; integer i;
  s := 0;
  for i := 1 step 1 until n do
    s := s + a[i] * b[i];
  dot := s
end
```

Array parameters had an interesting interaction with call-by-name: normally arrays
were passed essentially by reference (the descriptor was copied, so both sides saw the
same elements), but by-name semantics on individual array elements led to the subtle
aliasing issues that afflicted `swap`.

---

## 7. Control Flow

ALGOL 60's control constructs are the ancestors of every modern structured-programming
language. Some of them arrived essentially in final form and have barely changed.
Others were strange experiments that did not survive.

### 7.1 Conditional Statement and Expression

The `if ... then ... else` construct could appear as a *statement*:

```algol
if x < 0 then y := -x else y := x
```

Or as an *expression*, which is a capability most later languages removed and then
slowly added back as "ternary" or "conditional" expressions:

```algol
y := if x < 0 then -x else x;
max := if a > b then a else b
```

The conditional expression was a real expression, returning a value, usable anywhere a
value was expected. This was unusual in 1960 — Fortran had no such thing — and it
anticipated the expression-oriented style of ML, Lisp, and modern functional languages.

### 7.2 The Dangling Else

The Report's grammar contained the now-famous dangling-else ambiguity:

```algol
if a then if b then x := 1 else x := 2
```

Does the `else` bind to the inner `if b` or to the outer `if a`? The grammar is
technically ambiguous. The Report's prose specified that the `else` binds to the
nearest `if`, and this rule was adopted by almost every descendant (C, Java, Pascal,
and so on). But the syntactic ambiguity in the grammar itself became a famous example
in compiler courses, and languages like Modula-2 and Ada eventually solved it by
requiring an explicit `end if` terminator.

### 7.3 The `for` Loop

The ALGOL 60 `for` loop is complicated. It supports three different list element forms
that can be mixed freely:

```algol
for i := 1 step 1 until 100 do S;
for i := 1, 2, 4, 8, 16, 32 do S;
for i := 1 step 2 until 10, 20 step 10 until 100, -1 do S;
for i := init step inc while cond do S;
```

The `for` list is a comma-separated sequence of elements, each of which is one of:

- A single expression: `i` takes that value.
- A `step ... until` element: `i` starts at the initial expression, increments by the
  step expression, and continues as long as it has not passed the final expression.
- A `while` element: `i` starts at the initial expression, continues being assigned to
  that expression each iteration, as long as the condition holds. (This is essentially
  a while loop wearing a `for` hat.)

The body `S` is executed once for each element in the list. If the list is long, the
body runs many times.

The `step ... until` semantics are specified precisely in the Report and have a subtle
detail: whether the termination check uses `>` or `<` depends on the sign of the step.
If `step` is positive, iteration stops when `i > limit`. If negative, when `i < limit`.
If zero, infinite loop (no termination). The Report handles this via a precise
expansion rule.

Modern languages mostly simplified this. C's `for` became a three-expression C-style
thing. Python's `for` became iteration over a sequence. Java got the C form, then later
the for-each. Pascal kept `for i := lo to hi do` (or `downto`) in simple form only.
ALGOL 60's full for-list feature rarely survived.

### 7.4 `while` and `until`

ALGOL 60 did not have a standalone `while` loop as a first-class construct. It had
`while` inside the `for` list, which was functionally equivalent but syntactically
clumsy:

```algol
for z := x while z > 0 do S
```

This is effectively `while x > 0 do S` with a bit of ceremony. The omission of a direct
`while` was patched in every subsequent language: ALGOL W and Pascal added `while ...
do`, and everyone else followed.

### 7.5 `goto` and Labels

ALGOL 60 had labeled statements and `goto`:

```algol
begin
  integer i;
  i := 0;
loop:
  if i > 100 then goto done;
  i := i + 1;
  goto loop;
done:
  outinteger(i)
end
```

Labels were identifiers followed by a colon, placed before any statement. `goto` took
a label, or more generally an expression of type *label* (since labels were a real
type in ALGOL 60). This allowed some strange tricks — you could compute a label —
but most uses were straightforward.

The block-scope rules for labels were carefully specified in the Report. You could
jump out of an enclosing block, which unwound the stack to the target block's level,
but you could not jump *into* a block from outside.

### 7.6 The `switch` Statement

ALGOL 60's `switch` is the strangest control construct in the language and the one
least like modern `switch`. A switch declaration defined a named array of labels:

```algol
switch s := L1, L2, L3, L4;
```

Now `s` is a switch. The expression `s[i]` evaluates to one of the labels: `s[1]` is
`L1`, `s[2]` is `L2`, etc. You then used it with a `goto`:

```algol
goto s[i]
```

This jumps to `L1` if `i` is 1, `L2` if `i` is 2, and so on. It is essentially a
computed goto — a jump table made visible to the programmer.

This is *not* like C's `switch`/`case` or Pascal's `case` statement. There is no
pattern-matching, no fall-through, no block of code per case. It is just an array of
labels accessed by index. The structured `case` statement that C and Pascal later
added is a different descendant — it grew out of the *idea* of ALGOL 60's switch but
restructured it into a proper control construct.

### 7.7 Compound Statements

Finally, `begin ... end` not only delimits blocks (declarations plus statements) but
also compound statements (sequences of statements without declarations), used
anywhere a single statement is expected:

```algol
if x > 0 then
  begin
    y := sqrt(x);
    z := log(x)
  end
else
  y := z := 0
```

This distinction between block (has declarations) and compound statement (no
declarations) is mostly historical. C merged them by allowing declarations inside any
compound statement (and C99 even let them appear anywhere, not just at the top).

---

## 8. Operators and Precedence

The Report specified a full set of arithmetic, relational, and boolean operators, with
precise precedence rules.

### 8.1 Arithmetic Operators

- `+` addition
- `-` subtraction and unary negation
- `×` multiplication (`*` in hardware language)
- `/` real division
- `÷` integer division (`÷` in reference, various in hardware)
- `↑` exponentiation (`**` in hardware)

Precedence, from tightest to loosest:

1. `↑` (exponentiation, right-associative)
2. `×`, `/`, `÷`
3. `+`, `-` (binary)

Unary minus was handled as a prefix operator with the precedence of subtraction.
Parenthesization could override any of this.

### 8.2 Relational Operators

- `<` less than
- `≤` less than or equal
- `=` equal
- `≠` not equal
- `≥` greater than or equal
- `>` greater than

In hardware language, these became ASCII approximations: `<=`, `>=`, `<>` or `!=`, etc.

Relational operators had lower precedence than arithmetic and produced Boolean
results.

### 8.3 Boolean Operators

- `¬` negation (not)
- `∧` conjunction (and)
- `∨` disjunction (or)
- `⊃` implication (implies)
- `≡` equivalence (if and only if)

Precedence, from tightest to loosest:

1. `¬`
2. `∧`
3. `∨`
4. `⊃`
5. `≡`

The inclusion of `⊃` (implication) and `≡` (equivalence) as primitive Boolean operators
is unusual. Most later languages dropped both, keeping only not/and/or. ALGOL 60's set
was self-consciously mathematical — these are the operators of propositional logic, and
the Report preserved them.

In hardware language, the Boolean operators were usually rendered as `not`, `and`, `or`,
`imp`, `eqv`. Some implementations used symbols like `&`, `|`, `!`.

### 8.4 Mathematical Typography Again

All the pretty symbols — `×`, `÷`, `↑`, `≤`, `≥`, `≠`, `¬`, `∧`, `∨`, `⊃`, `≡` — were
part of the publication language. Journal printings used them faithfully, giving
ALGOL 60 programs a typeset look indistinguishable from the surrounding mathematics.
Hardware implementations could not reproduce them and substituted ASCII equivalents.

This was another early recognition that a programming language's *notation* and its
*encoding* are different things — a distinction that modern Unicode-aware languages
like Agda, Lean, and Julia have started to recover.

---

## 9. Famous ALGOL 60 Programs

This section collects programs that, for one reason or another, became canonical
examples in the ALGOL 60 literature.

### 9.1 Factorial

```algol
integer procedure factorial(n); value n; integer n;
begin
  if n <= 1 then
    factorial := 1
  else
    factorial := n * factorial(n - 1)
end
```

### 9.2 Fibonacci

```algol
integer procedure fib(n); value n; integer n;
begin
  if n < 2 then
    fib := n
  else
    fib := fib(n - 1) + fib(n - 2)
end
```

### 9.3 GCD (Euclid's Algorithm)

```algol
integer procedure gcd(a, b); value a, b; integer a, b;
begin
  integer t;
loop:
  if b = 0 then
    gcd := a
  else
    begin
      t := b;
      b := a - (a ÷ b) * b;
      a := t;
      goto loop
    end
end
```

Or recursively:

```algol
integer procedure gcd(a, b); value a, b; integer a, b;
begin
  if b = 0 then gcd := a
  else gcd := gcd(b, a - (a ÷ b) * b)
end
```

### 9.4 Matrix Multiplication

```algol
procedure matmul(A, B, C, n);
  value n; integer n;
  real array A, B, C;
begin
  integer i, j, k;
  real s;
  for i := 1 step 1 until n do
    for j := 1 step 1 until n do
    begin
      s := 0;
      for k := 1 step 1 until n do
        s := s + A[i, k] * B[k, j];
      C[i, j] := s
    end
end
```

### 9.5 Sieve of Eratosthenes

```algol
procedure sieve(n); value n; integer n;
begin
  boolean array prime[2:n];
  integer i, j;
  for i := 2 step 1 until n do
    prime[i] := true;
  for i := 2 step 1 until n do
    if prime[i] then
    begin
      outinteger(i);
      for j := 2*i step i until n do
        prime[j] := false
    end
end
```

### 9.6 Hoare's Quicksort

In July 1961, C. A. R. Hoare published two algorithms in the *Communications of the
ACM*'s Algorithms section:

- **Algorithm 63**, Partition
- **Algorithm 64**, Quicksort

Both were written in ALGOL 60. Quicksort went on to become the most-cited sorting
algorithm in history. It is worth reproducing a version of the original (with minor
reformatting):

```algol
procedure quicksort(A, M, N);
  value M, N;
  integer M, N;
  real array A;
begin
  integer I, J;
  real X, W;
  if M < N then
  begin
    I := M;
    J := N;
    X := A[(M + N) ÷ 2];
    repeat:
      while A[I] < X do I := I + 1;
      while X < A[J] do J := J - 1;
      if I <= J then
      begin
        W := A[I];
        A[I] := A[J];
        A[J] := W;
        I := I + 1;
        J := J - 1
      end;
    if I <= J then goto repeat;
    quicksort(A, M, J);
    quicksort(A, I, N)
  end
end
```

The original Hoare paper is a single page of ALGOL 60 plus a short explanation. It is
remarkable how little the algorithm has changed in sixty-five years. Modern quicksort
implementations add pivot selection strategies, fall-back to insertion sort for small
partitions, iterate instead of recurse on the larger half, and worry about worst-case
inputs — but the core is exactly what Hoare wrote in 1961.

The fact that the *most important algorithm in mainstream computing* was first
published in ALGOL 60 is not a coincidence. The Algorithms department of CACM was
using ALGOL 60 as its publication language specifically because it was the clearest
way to communicate an algorithm to an international audience.

### 9.7 Knuth's Man-or-Boy Test

Already given above in Section 3.3. Reproduced here for completeness as the canonical
hard example:

```algol
begin
  real procedure A(k, x1, x2, x3, x4, x5);
    value k; integer k;
    real x1, x2, x3, x4, x5;
  begin
    real procedure B;
    begin
      k := k - 1;
      B := A := A(k, B, x1, x2, x3, x4)
    end;
    if k <= 0 then A := x4 + x5 else B
  end;
  outreal(A(10, 1, -1, -1, 1, 0))
end
```

### 9.8 Jensen's Device for Summation

```algol
real procedure sum(i, lo, hi, term);
  value lo, hi;
  integer i, lo, hi;
  real term;
begin
  real s;
  s := 0;
  for i := lo step 1 until hi do
    s := s + term;
  sum := s
end
```

Example calls:

```algol
s1 := sum(k, 1, 100, k);              comment 1 + 2 + ... + 100 = 5050;
s2 := sum(k, 1, 100, k * k);          comment sum of squares;
s3 := sum(k, 1, 100, 1 / k);          comment harmonic series;
s4 := sum(i, 1, n, A[i] * B[i])       comment dot product;
```

Each call re-evaluates the `term` expression for every value of `i`, producing a
different sum.

---

## 10. The ACM Algorithms Collection

Starting in 1960 and running through the 1960s and into the 1970s, the *Communications
of the ACM* ran an Algorithms department that published short, carefully-specified
numerical and combinatorial algorithms. Each was given a number: Algorithm 1, Algorithm
2, and so on. By the time the department closed in its original form, the numbering
had reached into the hundreds; the continuation in *ACM Transactions on Mathematical
Software* eventually passed 1000.

For most of the 1960s, the publication language of the Algorithms department was
ALGOL 60. Hoare's quicksort (Algorithms 63 and 64) was only two of hundreds.
Algorithms for matrix decomposition, eigenvalue computation, root finding,
interpolation, numerical integration, linear programming, sorting, graph traversal,
random number generation, and much more were all published in ALGOL 60.

The combined effect was that ALGOL 60 became the *de facto* language of mathematical
software specification. If you wanted to communicate a numerical algorithm
internationally in 1965, you wrote it in ALGOL 60. The language's publication form —
typeset with real mathematical symbols — made this natural: an ALGOL 60 procedure in
CACM looked like a theorem.

This tradition seeded two important later projects:

- **The NAG Library** (Numerical Algorithms Group, founded 1970 in Nottingham, England)
  began as a library of ALGOL 60 numerical routines. It later migrated to Fortran and
  is now available in C, C++, Fortran, Python, and other bindings. But its origin is in
  the ACM ALGOL 60 algorithms tradition.
- **Numerical Recipes** (Press, Teukolsky, Vetterling, Flannery, 1986) is the most
  famous numerical-methods textbook of the late 20th century. Its presentation style —
  algorithm, explanation, and working code side by side — descends directly from the
  ACM Algorithms department. Numerical Recipes was published in Fortran and C editions,
  but the spiritual ancestor is the ALGOL 60 Algorithms collection.

Modern projects like SciPy, GSL, LAPACK, and Eigen are downstream of the same tradition.
Many of the algorithms they implement trace through literature chains back to CACM
ALGOL 60 publications.

---

## 11. What ALGOL 60 Got Wrong

No language is perfect, and ALGOL 60 had real holes that its descendants had to fix.
Being honest about these is part of respecting the Report: the committee was remarkably
prescient, but they were not oracular.

### 11.1 No String Type

ALGOL 60 had no real string type. Character data could be represented as arrays of
integers (with each integer holding a character code) or via implementation-specific
string values in output statements. There was no standard way to read a string from
input, concatenate two strings, compare strings, or search within a string. Every
implementation added its own extensions, and none were compatible with the others.

Fortran also had weak string support in 1960, but it eventually added CHARACTER types.
COBOL, by contrast, was built around character string manipulation. ALGOL 60's
omission of strings made it useless for business data processing and limited it to
numerical and structural work.

ALGOL 68 tried to fix this with a full string type. Pascal tried with fixed-length
strings. C bolted strings on as null-terminated arrays. Everyone agrees in retrospect
that strings belong in the core language.

### 11.2 No Input/Output in the Core Language

More seriously, ALGOL 60 had no I/O in the core language at all. The Report said,
essentially, that input and output are the responsibility of the implementation and
left it at that. The committee hoped this would push I/O into a separate standard.
It did not. Every implementation added its own I/O procedures (`outreal`, `outinteger`,
`outstring`, `inreal`, `read`, `write`, ...), and these procedures were all
incompatible.

A program written against the Elliott 803 ALGOL 60 I/O library would not compile on
the Burroughs B5000. The absence of standard I/O was the single biggest practical
obstacle to ALGOL 60 portability. Fortran, even in its earliest forms, had `READ` and
`WRITE` and `FORMAT` statements that worked everywhere; ALGOL 60 did not.

ALGOL 68 fixed this with its `transput` library, which was part of the standard. But
by then it was too late; the ALGOL 60 fragmentation had already pushed users toward
Fortran for numerical work and toward newer languages for everything else.

### 11.3 Call-By-Name Was Too Clever

Already discussed at length in Section 4. Call-by-name is elegant and enabled
Jensen's device and all sorts of slick code, but it confused programmers, was hard to
compile efficiently, produced bugs like the `swap` aliasing problem, and was a
maintenance nightmare in large programs. Every language after ALGOL 60 either dropped
it, made it opt-in, or replaced it with cleaner mechanisms like closures or lazy
evaluation.

### 11.4 Own Variables Were Weird

Own variables (Section 5.5) were a half-baked version of static locals. Their
initialization semantics were under-specified. Their interaction with recursion was
unclear. They were removed from most ALGOL 60 descendants and replaced with cleaner
mechanisms (`static` in C, class variables in OO languages).

### 11.5 The `switch` Statement Was A Mess

ALGOL 60's switch (Section 7.6) was a named array of labels, used via `goto`. It was
a computed goto dressed up with type hints, not a structured case statement. It was
confusing, encouraged goto-heavy code, and had no pattern-matching or fall-through
semantics. Every subsequent language rebuilt the `switch`/`case` concept from scratch,
usually borrowing from Wirth's ALGOL W and Pascal designs rather than from ALGOL 60
directly.

### 11.6 Weak Type System

The type system of ALGOL 60 was rudimentary: `integer`, `real`, `boolean`, and arrays
of these. There were no records or structs. There were no user-defined types. There
were no pointers. There were no enumerations. There were no subrange types.

The integer/real distinction was also poorly specified in places. Type coercion
between them was implicit, which led to portability issues when implementations
disagreed about when a real expression should round to integer.

ALGOL W (Wirth and Hoare, 1966), ALGOL 68, Pascal, and Modula all added richer type
systems that fixed these problems. The ALGOL 60 committee had the idea of types but
did not take the next step of making them user-definable.

### 11.7 Single Assignment Was Never Considered

In 1960, nobody was thinking about purely functional programming or single-assignment
languages. ALGOL 60 was thoroughly imperative: variables were rebindable, side effects
were everywhere, and equational reasoning was not a design goal. This is a "wrong"
only in hindsight; the single-assignment tradition (pure Lisp, ML, Haskell) developed
much later.

But it is worth noting that call-by-name, ALGOL 60's weirdest feature, pushed directly
toward lazy evaluation, which is much cleaner in a single-assignment language than in
an imperative one. Had the committee pursued call-by-name to its logical conclusion,
they might have invented lazy functional programming twenty years early. They did not,
and Haskell had to be invented later.

---

## 12. Bibliography

Primary sources and historical accounts for further reading.

### 12.1 The Report Itself

- **Naur, Peter (editor).** *Report on the Algorithmic Language ALGOL 60.*
  Communications of the ACM, 3(5):299–314, May 1960.
  The original Report. Seventeen pages, dense, authoritative.

- **Naur, Peter (editor).** *Revised Report on the Algorithmic Language ALGOL 60.*
  Communications of the ACM, 6(1):1–17, January 1963.
  The 1963 revision, which clarified many details but did not change the language
  substantively.

### 12.2 Hoare's Quicksort

- **Hoare, C. A. R.** *Algorithm 63: Partition.* Communications of the ACM, 4(7):321,
  July 1961.

- **Hoare, C. A. R.** *Algorithm 64: Quicksort.* Communications of the ACM, 4(7):321,
  July 1961.

- **Hoare, C. A. R.** *Quicksort.* The Computer Journal, 5(1):10–16, 1962. A longer
  treatment with analysis.

### 12.3 Backus Notation and Formal Syntax

- **Backus, John W.** *The Syntax and Semantics of the Proposed International
  Algebraic Language of the Zurich ACM-GAMM Conference.* Proceedings of the
  International Conference on Information Processing, UNESCO, 1959. The paper that
  introduced what became known as Backus-Naur Form.

- **Knuth, Donald E.** *Backus Normal Form vs. Backus Naur Form.* Communications of
  the ACM, 7(12):735–736, December 1964. Knuth's letter clarifying the terminology
  and crediting Naur's contributions.

### 12.4 Knuth's Man-or-Boy Test

- **Knuth, Donald E.** *Man or Boy?* ALGOL Bulletin, 17:7, July 1964.

- **Knuth, Donald E.** *The remaining trouble spots in ALGOL 60.* Communications of
  the ACM, 10(10):611–618, October 1967. A more formal analysis of ALGOL 60's
  semantic subtleties.

### 12.5 Compilation and Implementation

- **Dijkstra, Edsger W.** *Recursive Programming.* Numerische Mathematik, 2(1):312–318,
  1960. The foundational paper on stack-based compilation of recursive procedures.

- **Dijkstra, Edsger W. and Zonneveld, J. A.** *ALGOL 60 compiler.* Mathematisch
  Centrum, Amsterdam, 1960. The first working ALGOL 60 compiler, for the X1 computer.

- **Randell, Brian and Russell, L. J.** *ALGOL 60 Implementation.* Academic Press,
  1964. A book-length treatment of how to implement ALGOL 60.

- **Ingerman, Peter Z.** *Thunks: A Way of Compiling Procedure Statements with Some
  Comments on Procedure Declarations.* Communications of the ACM, 4(1):55–58, January
  1961. The paper that introduced the term *thunk*.

### 12.6 Semantics

- **Strachey, Christopher and Wadsworth, Christopher P.** *Continuations: A
  Mathematical Semantics for Handling Full Jumps.* Oxford University Computing
  Laboratory, Programming Research Group, Technical Monograph PRG-11, January 1974.
  Developed the denotational semantics that ALGOL 60's call-by-name helped motivate.

- **Landin, Peter J.** *The mechanical evaluation of expressions.* The Computer
  Journal, 6(4):308–320, 1964. Introduced the SECD machine and a formal evaluation
  model applicable to ALGOL 60.

### 12.7 The ALGOL Bulletin

The *ALGOL Bulletin* was published by IFIP WG 2.1 throughout the 1960s and into the
1970s. It served as the community's clearinghouse for implementation reports, language
clarifications, program examples, and debate. Issues are archived by several
universities and are available digitally. Entire dissertations' worth of ALGOL 60
semantics discussion can be found in its pages.

### 12.8 Historical Accounts

- **Perlis, Alan J.** *The American side of the development of ALGOL.* In: History of
  Programming Languages (HOPL-I), Wexelblat, Richard L. (editor), ACM, 1978. Perlis's
  recollection of the ALGOL 58 and ALGOL 60 committee meetings from the American side.

- **Naur, Peter.** *The European side of the last phase of the development of ALGOL
  60.* In: History of Programming Languages (HOPL-I), ACM, 1978. Naur's account of the
  Paris 1960 meeting and the finalization of the Report.

- **Hoare, C. A. R.** *Hints on Programming Language Design.* Stanford Technical
  Report CS-TR-73-403, 1973. Contains Hoare's retrospective thoughts on ALGOL 60,
  including his famous remark that "ALGOL 60 was a great improvement on most of its
  successors" — which has been widely quoted but perhaps more widely
  misremembered; the exact wording varies by citation.

- **Knuth, Donald E.** *The Early Development of Programming Languages.* In: A
  History of Computing in the Twentieth Century, Metropolis, Howlett, and Rota
  (editors), Academic Press, 1980. Knuth's compressed history of ALGOL 60 and its
  ecosystem.

- **van Wijngaarden, Adriaan, et al.** *Report on the Algorithmic Language ALGOL 68.*
  Numerische Mathematik, 14:79–218, 1969. The successor language's Report; reading it
  against the ALGOL 60 Report shows how the committee's ideas evolved (and, in the
  view of many critics, went too far).

### 12.9 Machine Architecture

- **Organick, Elliott I.** *Computer System Organization: The B5700/B6700 Series.*
  Academic Press, 1973. The canonical reference on the Burroughs machines designed
  around ALGOL 60 semantics. The B5000 is the earliest member of the family.

---

## Closing Notes

The *Report on the Algorithmic Language ALGOL 60* is approximately seventeen pages of
technical prose. In those seventeen pages it introduced block structure, lexical
scope, recursive procedures, dynamic arrays, formal syntax notation, conditional
expressions, strongly-structured control flow, and two complete parameter-passing
modes. It described the language in three simultaneous forms — reference, publication,
and hardware — anticipating the distinction between abstract syntax, rendered syntax,
and concrete encoding by four decades.

Almost no production code still runs in ALGOL 60. But every time you open a block in C,
call a recursive function in Python, write a nested scope in JavaScript, pass a
by-name parameter in Scala, read a Haskell program whose lazy evaluation is call-by-need
descended from call-by-name, sort an array with quicksort, use a stack frame, work
with a dynamic array whose size is computed at runtime, or read a programming language
specification that uses something like BNF — you are using ALGOL 60. It is the
foundational language of the block-structured tradition, and its Report is one of the
most compact, precise, and influential technical documents in the history of
computing.

Hoare, who designed quicksort in it and later criticized many of its features, got it
right: ALGOL 60 was a great improvement on most of its successors. Sixty-six years
later, that is still more true than most people realize.
