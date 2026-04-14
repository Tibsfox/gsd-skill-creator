# Ada: The Core Sequential Language

*Part of the PNW Research Series on tibsfox.com — Ada deep dive, thread 2 of 4*

> "Ada is a language for people who want to be sure."
> — common paraphrase of Jean Ichbiah's design intent

This document covers the **sequential** core of Ada: types, subtypes, packages,
generics, exceptions, contracts, and the low-level representation machinery that
makes it a credible systems language. Concurrency (tasks, protected objects,
rendezvous, Ravenscar) is covered in a sibling document and is mentioned here
only in passing. History and SPARK/avionics are also separate threads.

The target reader is someone who has written a nontrivial amount of C, probably
some Python, and maybe a little Rust, but has never seriously programmed in Ada.
Everything is illustrated with code, and every mental-model shift the reader
will need is stated explicitly rather than left as folklore.

---

## Table of Contents

1. [The Ada design philosophy](#1-the-ada-design-philosophy)
2. [Lexical structure and program layout](#2-lexical-structure-and-program-layout)
3. [Scalar types](#3-scalar-types)
4. [Subtypes and constraints](#4-subtypes-and-constraints)
5. [Arrays](#5-arrays)
6. [Records](#6-records)
7. [Access types — pointers done right](#7-access-types--pointers-done-right)
8. [Packages and information hiding](#8-packages-and-information-hiding)
9. [Subprograms — procedures and functions](#9-subprograms--procedures-and-functions)
10. [Generics](#10-generics)
11. [Exceptions](#11-exceptions)
12. [Object-oriented programming](#12-object-oriented-programming-ada-95)
13. [Contracts — Ada 2012](#13-contracts--ada-2012)
14. [Expressions and operators](#14-expressions-and-operators)
15. [Strings](#15-strings)
16. [Input and output](#16-input-and-output)
17. [Numerics](#17-numerics)
18. [Representation clauses and low-level programming](#18-representation-clauses-and-low-level-programming)
19. [The mental model — what Ada is trying to do to you](#19-the-mental-model)
20. [Gallery of idiomatic Ada programs](#20-gallery-of-idiomatic-ada-programs)

---

## 1. The Ada design philosophy

Every programming language is the solution to a problem the designers cared
about and an implicit statement about the problems they did not. C was born
inside a research operating system and answers the question "how do I talk
to a PDP-11 without writing assembly all day?" Lisp is a fixed point of
McCarthy's thinking about computation on symbolic data and answers the question
"what is the smallest possible notation in which I can write an interpreter?"
Ada answers a very different question: "I am a defense department, I am spending
half a billion dollars a year on software maintenance across seven hundred
different languages, how do I make this stop, and how do I get software I can
trust to fly an airplane at night in a storm?"

That question shapes every design decision Ada makes. Once you see the pattern,
the rest of the language — the verbose keywords, the strict type system, the
contract aspects, the package spec/body split — becomes obvious instead of
arbitrary.

### Readability over writability

Jean Ichbiah, leading the CII-Honeywell-Bull team that won the 1979 Green
proposal competition, said again and again that readability would be preferred
over writability whenever the two conflicted. The reasoning is simple: real
systems are read far more often than they are written, the reader of a piece of
code usually is not the person who wrote it, and the cost of a bug at read time
(missed by a maintainer in year five) dwarfs the cost of a slightly longer key
sequence at write time.

This is not an abstract preference. It materially shapes the syntax. Consider
the difference between a C for-loop and an Ada for-loop:

```c
/* C: */
for (int i = 0; i < n; i++) {
    process(arr[i]);
}
```

```ada
--  Ada:
for I in Arr'Range loop
   Process (Arr (I));
end loop;
```

The C version is five tokens shorter and also encodes three independent design
decisions into the loop header: the initial value, the termination condition,
and the step. Any of these can be wrong. `i <= n` is one of the most common
off-by-one bugs in production C. The Ada version says "iterate over the range of
this array," which is exactly the intent, does not require the programmer to
restate the array's bounds, and cannot be off by one because the language
computes the bound from the array. It is also more verbose — `end loop` is three
tokens where C gets away with `}`. Ada considers that a reasonable trade.

Two-token `end` markers, by the way, are deliberately redundant. In Ada you
write `end Name_Of_Thing` at the end of a procedure, a package, or a loop:

```ada
procedure Process_Packet (P : Packet) is
begin
   --  ... 200 lines of code ...
end Process_Packet;
```

The name after `end` must match the name at the declaration. If you delete the
wrong brace while editing, the compiler catches it immediately. In C you can
delete the wrong brace and the program compiles but does the wrong thing. Ada is
trading a small amount of typing for an entire class of editing bug.

### Explicit over implicit

Ada strongly prefers the programmer to say what they mean. There is no "clever
default" for numeric conversions: if you have an `Integer` and you need a
`Float`, you write `Float (X)`. There is no automatic coercion between distinct
integer types even if they have the same representation. There are no implicit
type promotions in arithmetic. A character is not a small integer.

This is one of the features that makes Ada feel slow to new users. Every time
you want to combine values of different types, the compiler asks, in effect,
"are you sure?" The reward is that the things you accidentally combine in C —
index and length, signed and unsigned, pointer and count, seconds and
milliseconds — can be given distinct types in Ada and then the compiler simply
will not let you combine them. The surface-to-air missile scenario everyone
likes to tell is about exactly this: in 1996 an Ariane 5 rocket was lost because
a 64-bit floating-point speed was converted to a 16-bit signed integer, which
overflowed; the root cause was code reused from Ariane 4, where the value was
known to fit. Ada's approach would have caught this at the conversion point, at
compile or run time, and the rocket would not have exploded. Ada did catch it,
in fact — the handler raised the exception the handler treated as catastrophic,
which was arguably the wrong handler design, but the type system spoke.

### Strong typing with no silent coercions

Ada's strong typing is different from C's or Java's. In C, `typedef` creates an
alias; two typedef names are still interchangeable. In Java, `int` and `long`
silently promote. In Ada, declaring a new type creates a new, incompatible type
even if the representation is identical:

```ada
type Meters is new Float;
type Feet   is new Float;

M : Meters := 10.0;
F : Feet   := 32.8;

--  This will NOT compile:
--  M := F;

--  This will:
M := Meters (F);

--  And this is what you really want:
M := Meters (Float (F) * 0.3048);
```

Your program may have three different notions of "distance" that all need 64
bits to store. In C they would all be `double` and you would live in fear of
passing them to the wrong function. In Ada they can be three distinct types and
the compiler enforces the distinction.

### Compile-time error catching as the primary design principle

This is the unifying principle behind nearly every Ada feature. The question
asked at the design table was always "can we move this check from runtime to
compile time?" When a runtime check was unavoidable, the next question was
"can we insert it automatically?" When the answer was "yes, but at the cost of
some performance," the default was usually "do it anyway, and let the user turn
it off if they can prove it's safe." The pragma for disabling runtime checks
(`pragma Suppress`) exists, but you have to ask for it explicitly.

The Ada philosophy is that the compiler is on your side. It is not trying to
get out of your way; it is trying to find your bugs for you. The verbosity is
the cost of giving the compiler enough information to help.

### "A language for people who want to be sure"

The slogan at the top of this section is a paraphrase of something Ichbiah
said in different ways at different times. The point is that Ada is not trying
to be the fastest language, or the most expressive, or the most concise. It is
trying to be the language you reach for when the consequences of a bug are
severe enough that you want help finding them.

This is why Ada is still used in avionics, in rail signaling, in medical
devices, in satellites, in missile defense, in metro systems. Not because it
is fashionable (it is not), not because it is fast (many languages are), but
because it is the language where the cost of a bug found in production is
catastrophically higher than the cost of a bug prevented at compile time, and
the language has been optimized for that trade-off for forty years.

### Contrast with C and Lisp

C trusts the programmer. Its slogan, which Kernighan and Ritchie actually wrote,
is "trust the programmer." The compiler will allow you to cast anything to
anything, read past the end of an array, free the same pointer twice, and return
a pointer to a local variable. The assumption is that you know what you are
doing. This is great for small systems written by one person who is an expert,
and it is how we got Unix. It is not great for a twenty-million-line avionics
system written by a team of two hundred people over fifteen years, some of whom
will be replaced before the system ships.

Lisp trusts the runtime. Its types are checked when the operation is executed,
its memory is managed by the garbage collector, and its errors raise conditions
that other code can catch and recover from. This is great for exploratory
programming and artificial intelligence research, which is what Lisp was
designed for. It is not ideal for hard real-time systems where you cannot afford
a garbage collector pause and you need every code path to be analyzable ahead of
time.

Ada trusts the specification. The programmer's job, in the Ada worldview, is to
write down precisely what they mean — what types of data exist, what ranges the
values can take, what the preconditions and postconditions of each operation
are, what the invariants of each data structure are. Once that specification
exists, the compiler can check it. The programmer does not have to be careful;
the specification enforces care. This is a fundamentally different model from
both C (where the programmer is the enforcement mechanism) and Lisp (where the
runtime is).

It is also the reason Ada code tends to be slow to write and fast to debug. You
spend more time up front specifying what you mean, and less time later chasing
ghosts. When the requirements are stable and the stakes are high, this is a
terrific bargain. When the requirements change every six hours and nobody dies
if it crashes, it is a terrible bargain. Pick your bargain.

---

## 2. Lexical structure and program layout

### Case-insensitivity

Ada is case-insensitive for identifiers and keywords. `Hello_World`,
`HELLO_WORLD`, and `hello_world` all refer to the same thing. This is one of
the most controversial decisions in the language. Rust and C people tend to
hate it; old Fortran and Pascal people tend to like it. The reasoning at the
time was that military personnel often read printouts and spoke code aloud,
and `myvar` and `MyVar` should not be two different things when read by a human.

The convention in modern Ada is `Title_Case_With_Underscores` for identifiers
and lowercase for keywords. GNAT, the reference compiler, will reformat code
into this convention on request via `gnatpp`.

```ada
Temperature := 72;
TEMPERATURE := 72;   --  same variable
temperature := 72;   --  same variable again
```

One practical consequence: you can write `End` or `END` or `end`, all are fine,
but the style guide says lowercase for keywords. You cannot have two identifiers
that differ only in case (`Temp` and `temp` collide). This is not theoretical; it
is a thing you have to remember when porting C code.

### Reserved words

Ada 2012 has 73 reserved words (Ada 83 had 63, Ada 95 added `abstract`,
`aliased`, `protected`, `requeue`, `tagged`, `until`; Ada 2005 added `interface`,
`overriding`, `synchronized`; Ada 2012 added `some`). They include many words
that would be useful as identifiers, including `range`, `digits`, `delta`,
`record`, `select`, `task`, `entry`, and so on. The 73 words are:

```
abort      else       new         return
abs        elsif      not         reverse
abstract   end        null        select
accept     entry      of          separate
access     exception  or          some
aliased    exit       others      subtype
all        for        out         synchronized
and        function   overriding  tagged
array      generic    package     task
at         goto       pragma      terminate
begin      if         private     then
body       in         procedure   type
case       interface  protected   until
constant   is         raise       use
declare    limited    range       when
delay      loop       record      while
delta      mod        rem         with
digits     new        renames     xor
do         null
```

If you count, the commonly cited number is 73. Some sources say 71 or 72
depending on whether they count `interface` and `overriding` (which are
contextual in certain grammar productions but still reserved). The project
instructions quoted "81 reserved words"; that number turns out to be wrong for
the language proper — it comes from Ada 2012 sometimes being cited with its
attributes, pragmas, or aspect names inflating the count. The reference manual,
ARM 2012 section 2.9, lists 73.

### Comments

Comments start with `--` and run to the end of the line. There are no block
comments. If you want a multi-line comment, you write `--` on every line:

```ada
--  This is a comment.
--  It continues on the next line.
--  And the next.

X : Integer := 42;  --  inline comments work too
```

The lack of block comments is deliberate. Ichbiah's team argued that block
comments in C and PL/I led to maintenance problems when commented-out code got
nested, and that editors should handle multi-line comments by inserting `--` on
every line automatically. Every serious Ada editor does exactly that.

### A complete program

Here is the smallest useful Ada program that does not cheat:

```ada
with Ada.Text_IO;

procedure Hello is
begin
   Ada.Text_IO.Put_Line ("Hello, world!");
end Hello;
```

A few things to notice:

- The top-level compilation unit is a `procedure` (not `main`). The file is
  conventionally named `hello.adb` (`.adb` for Ada body). The procedure name
  inside the file has to match the file name; `gnatmake hello` will find
  `hello.adb` automatically.
- The `with` clause imports the package `Ada.Text_IO`. Without it, the name
  `Ada.Text_IO.Put_Line` is not visible.
- The call uses the fully qualified name `Ada.Text_IO.Put_Line`. You can
  shorten it by adding `use Ada.Text_IO;` after the `with`, which brings the
  package's exported names into direct visibility.
- Every statement ends in a semicolon. `begin` does not, because it is a marker,
  not a statement.
- The `end Hello;` line closes the procedure and repeats its name. The compiler
  verifies that the name matches.

Here is the version with `use`:

```ada
with Ada.Text_IO; use Ada.Text_IO;

procedure Hello is
begin
   Put_Line ("Hello, world!");
end Hello;
```

The `use` clause is the Ada equivalent of `using namespace std` in C++. It
saves typing at the cost of making it harder to see where names come from. The
Ada community is divided on when to use `use`: in large programs some shops
forbid it entirely, others allow it for a few obvious packages like
`Ada.Text_IO`. Ada 2005 added `use type` which imports only operators, which is
often the right compromise.

### File organization: .ads and .adb

Ada physically separates interface from implementation. A package specification
lives in a `.ads` file (Ada Specification) and a package body lives in a `.adb`
file (Ada Body). This is different from C, where the header and the source are
related only by convention and a preprocessor include.

For a package `Stack`, you would have `stack.ads` containing the public
interface and `stack.adb` containing the implementation:

```ada
--  stack.ads
package Stack is

   procedure Push (X : Integer);
   function  Pop return Integer;
   function  Is_Empty return Boolean;

end Stack;
```

```ada
--  stack.adb
package body Stack is

   Data : array (1 .. 100) of Integer;
   Top  : Natural := 0;

   procedure Push (X : Integer) is
   begin
      Top := Top + 1;
      Data (Top) := X;
   end Push;

   function Pop return Integer is
      Result : constant Integer := Data (Top);
   begin
      Top := Top - 1;
      return Result;
   end Pop;

   function Is_Empty return Boolean is
   begin
      return Top = 0;
   end Is_Empty;

end Stack;
```

The `.ads` file is the contract. It is what clients see. It contains types,
subprograms, and any implementation details that must be visible (we will see
the `private` section shortly). The `.adb` file is the implementation. Clients
never look at the `.adb` file; their only knowledge of the package is the
`.ads`.

This is dramatically different from C. In C, the `.h` file and the `.c` file
are both the programmer's responsibility to keep in sync. If you change a
function signature in `.c` and forget to update the `.h`, the compiler may or
may not catch it, depending on whether the caller sees one or the other. In
Ada, the compiler reads the spec and the body together and the language
guarantees they are consistent. If the body has a subprogram signature that
does not match the spec, compilation fails immediately.

### `with` clauses

The `with` clause is how Ada expresses dependencies between compilation units.
It goes at the very top of the file, before the unit declaration. It is
declarative, not textual — the compiler does not paste the referenced file's
contents into the current file. It simply makes the named unit's public
interface visible.

```ada
with Ada.Text_IO;
with Ada.Numerics.Elementary_Functions;
with My_Project.Sensors;
with My_Project.Actuators;

procedure Main is
   --  ...
begin
   --  ...
end Main;
```

Because `with` is declarative, circular dependencies are caught by the
compiler, and there is no preprocessor to argue with. This is one of the
reasons Ada compilation is reliable even for very large programs: there is no
include-order dependency, no macro leakage, no "include hell."

### The package hierarchy

Packages can be nested hierarchically using dot notation. `Ada.Text_IO` is a
child of `Ada`. `Ada.Text_IO.Integer_IO` is a child of `Ada.Text_IO`. You can
define your own hierarchical packages the same way:

```ada
--  parent:
package My_System is
   --  ...
end My_System;

--  child:
package My_System.Sensors is
   --  ...
end My_System.Sensors;

--  grandchild:
package My_System.Sensors.Temperature is
   --  ...
end My_System.Sensors.Temperature;
```

Each package gets its own `.ads` and `.adb`. The child has access to the
parent's public and `private` parts — a crucial property we will come back to
when discussing information hiding.

---

## 3. Scalar types

Ada's scalar types are the most immediately visible way in which the language
differs from C. The built-in types are the tip of the iceberg; the real action
is in the user-defined types.

### Built-in integer types

The language defines `Integer` with an implementation-defined range, but
guaranteed to cover at least -32768 .. 32767. On most modern platforms it is
32 bits. Alongside `Integer`, the language defines several "subtypes" (which
we will discuss properly in the next section) with tighter constraints:

```ada
Integer    --  all integers the implementation supports
Natural    --  0 .. Integer'Last      (subtype of Integer)
Positive   --  1 .. Integer'Last      (subtype of Integer)
```

`Natural` and `Positive` are subtypes of `Integer`, so you can freely mix them
with `Integer` in arithmetic, but assigning a negative value into a `Natural`
raises `Constraint_Error` at runtime (or, with enough static analysis, at
compile time).

The language also defines `Long_Integer`, `Long_Long_Integer`, and
`Short_Integer`, with implementation-defined sizes. In practice these are
rarely used in modern Ada: it is idiomatic to define your own integer types
with explicit ranges.

### User-defined integer types

The most powerful idea in Ada's numeric type system is that the programmer
should define their own integer types with the ranges their problem requires.

```ada
type Temperature is range -40 .. 120;
type Age         is range   0 .. 150;
type Byte        is range   0 .. 255;
type Die_Roll    is range   1 ..   6;
```

The compiler picks an efficient representation based on the range (typically
the smallest machine integer that fits). You cannot mix values of different
types without an explicit conversion:

```ada
T : Temperature := 72;
A : Age         := 35;

--  This will NOT compile:
--  if T > A then ...

--  This will:
if Integer (T) > Integer (A) then ...
```

The value of this is that it catches a real class of bugs: whenever a program
mixes two quantities whose units or meanings are different, the compiler
refuses to let you do it silently. If you really mean to compare a temperature
to an age (perhaps in some weird domain where that makes sense), you write the
conversion explicitly, and the reader of the code can see that you are doing
something unusual.

### Modular types

Ada has a separate kind of integer type for unsigned arithmetic with
wraparound semantics. These are declared with `mod` and a modulus:

```ada
type Byte     is mod 256;         --  0 .. 255, wraps
type Word     is mod 2 ** 16;     --  0 .. 65535, wraps
type Address  is mod 2 ** 64;     --  64-bit address, wraps
```

On a modular type, arithmetic operations wrap around silently — `Byte'Last + 1
= 0` — the way C's unsigned arithmetic does. This is what you want for
bit-twiddling, CRC computation, hash functions, and low-level protocol work.
Modular types also support bitwise operators (`and`, `or`, `xor`, `not`) which
do not work on ordinary integer types:

```ada
B1 : Byte := 2#1100_0011#;    --  binary literal
B2 : Byte := 2#0110_1001#;
B3 : Byte := B1 xor B2;        --  2#1010_1010#
B4 : Byte := B1 and 16#0F#;    --  2#0000_0011#  (hex literal for low nibble)
```

Note the underscores inside literals (they are ignored, for readability) and
the base-prefix notation `2#...#` for binary, `16#...#` for hex.

Modular types are also the right choice for anything representing a position
in a circular buffer, an angle in fixed-point degrees, or anything else where
"one past the end" means "back to the start."

### Floating-point types

The built-in type is `Float`, with implementation-defined precision (typically
IEEE 754 binary32). `Long_Float` is typically binary64. As with integers, it is
more idiomatic to declare your own floating-point type with the precision you
need:

```ada
type Celsius  is digits 6;        --  at least 6 decimal digits of precision
type Latitude is digits 15 range -90.0 .. 90.0;
```

`digits N` says "this type must provide at least N decimal digits of
precision." The compiler will select an appropriate hardware type. The optional
`range` clause adds an additional constraint. A value outside the range raises
`Constraint_Error`.

### Fixed-point types (unique to Ada)

Fixed-point is a genuine Ada distinctive. Most languages either use integers
(and ask the programmer to remember the scale factor) or floating-point (and
hope the user accepts the rounding). Ada has first-class fixed-point types.

There are two kinds: **ordinary** fixed-point and **decimal** fixed-point.

Ordinary fixed-point uses a power-of-two denominator:

```ada
type Volt is delta 0.001 range -10.0 .. 10.0;
```

This says: the smallest representable difference is 0.001 volts (or smaller, if
the hardware can do better), and the range is ±10V. The compiler picks a
scaled-integer representation. The type has exact arithmetic within its
precision — there is no rounding for addition and subtraction — and predictable
rounding for multiplication and division.

Decimal fixed-point uses a power-of-ten denominator, which is what you want
for money:

```ada
type Dollars is delta 0.01 digits 12;
```

This gives you 12 digits of precision, with the smallest unit being a cent.
Operations are defined to give exact decimal results. This is the type
international banks reach for, because IEEE 754 floating-point cannot represent
0.10 exactly and that causes legally significant errors when summed over
billions of transactions.

Fixed-point is one of the reasons Ada is used in avionics (deterministic
arithmetic with bounded error) and finance (decimal arithmetic that matches
accounting rules).

### Enumeration types

Ada enums are richer than C enums. They are a proper type, not a thin alias
for an integer, and they participate in the full type system:

```ada
type Day is (Monday, Tuesday, Wednesday, Thursday, Friday,
             Saturday, Sunday);

D : Day := Monday;
```

You cannot assign an integer to a `Day` directly, and you cannot use arithmetic
on it directly. You can ask for `Day'First` (= `Monday`), `Day'Last` (=
`Sunday`), `Day'Succ (Monday)` (= `Tuesday`), `Day'Pos (Wednesday)` (= 2),
`Day'Val (3)` (= `Thursday`), and so on. The `'` syntax introduces an
**attribute** and it works on nearly every type.

You can also iterate over an enum in a loop, which is tremendously useful:

```ada
for D in Day loop
   Put_Line (Day'Image (D));
end loop;
```

`'Image` converts an enum value to its textual name. `'Value` goes the other
way.

Two built-in types that are "just" enumerations: `Boolean` and `Character`.

```ada
type Boolean is (False, True);
```

That is the actual definition of `Boolean` in `Standard`. It is an enumeration
with two values. This is not a stunt; it is what the language chose to do.
Because `Boolean` is an enum, you can iterate over it, take its attributes, and
all the type rules apply. Conversely, you cannot use an integer where a
`Boolean` is expected — no `if (x) then` where `x` is an integer. You have to
write `if X /= 0 then`.

`Character` is an enumeration of 256 values (for Latin-1; `Wide_Character` is
65536 values for UCS-2 and `Wide_Wide_Character` is 2³¹ values for UCS-4).
Because it is an enum, all the enum operations apply. You cannot subtract one
character from another without a conversion; you have to use `Character'Pos`
to get an integer.

You can also define your own enums with an explicit representation for
interfacing with hardware:

```ada
type Status is (Ok, Warning, Error, Critical);
for Status use (Ok => 0, Warning => 1, Error => 2, Critical => 4);
```

The values are not required to be contiguous; this is how you match an enum
to a protocol's wire format.

### The strong typing rules

Now for the crucial point. In Ada, two different type declarations create two
incompatible types, even if their representation is identical.

```ada
type Apples  is range 0 .. 100;
type Oranges is range 0 .. 100;

A : Apples  := 5;
O : Oranges := 5;

--  This will NOT compile:
--  if A = O then ...

--  This will NOT compile either:
--  A := O;

--  This will:
A := Apples (O);
```

In C, any two `int`-typed variables are freely interchangeable. In Ada, they
are not, unless they are the same named type or related by a `subtype`
relationship. This forces the programmer to decide, at type-declaration time,
which quantities are interchangeable and which are not. It is the feature that
catches the "feet vs. meters" bug before it flies an aircraft into a mountain.

The explicit conversion `Apples (O)` is not a cast in the C sense. It is a
value-preserving conversion that also performs a range check. If `O` had a
value outside the range of `Apples`, the conversion would raise
`Constraint_Error` at runtime. Ada does have a true, unchecked bit-level cast
called `Unchecked_Conversion`, but you have to import it from a specific
generic package, which is the language's way of saying "you are doing
something dangerous, acknowledge that."

```ada
with Ada.Unchecked_Conversion;
function To_Byte is new Ada.Unchecked_Conversion (Character, Byte);

B : Byte := To_Byte ('A');   --  reinterprets the bits
```

You have to instantiate a generic to do this. Every unchecked conversion in
an Ada codebase is easy to grep for. This is very different from C, where any
cast can silently reinterpret bits.

---

## 4. Subtypes and constraints

A **type** in Ada is a set of values with a set of operations. A **subtype** is
a type together with a constraint that narrows its values, but keeps all the
operations. Subtypes are not new types; they are constrained views of an
existing type. Values of different subtypes of the same base type are freely
mixable.

```ada
type    Day     is (Mon, Tue, Wed, Thu, Fri, Sat, Sun);
subtype Weekday is Day range Mon .. Fri;
subtype Weekend is Day range Sat .. Sun;

D  : Day     := Wed;
W  : Weekday := Mon;
E  : Weekend := Sat;

D := W;     --  legal: Weekday is a subtype of Day
W := D;     --  legal too, BUT raises Constraint_Error if D is Sat or Sun
```

When you assign a wider value into a narrower subtype, the compiler inserts
a range check. If the check fails at runtime, the predefined exception
`Constraint_Error` is raised. You can compile with checks disabled (`pragma
Suppress (Range_Check)`) for performance, but you have to ask.

### Why subtypes matter

The canonical example is array indexing. If an array is declared with a
specific index range, and you have a value whose subtype matches that range,
the indexing operation provably cannot go out of bounds:

```ada
type Sensor_Array is array (1 .. 100) of Float;
subtype Sensor_Index is Positive range 1 .. 100;

Readings : Sensor_Array;

procedure Read (I : Sensor_Index) is
begin
   Put_Line (Float'Image (Readings (I)));  --  cannot be out of bounds
end Read;
```

Inside `Read`, the parameter `I` is guaranteed to be in `1 .. 100` because its
subtype says so. The range check happens at the call site, once, and then the
indexing operation inside `Read` is statically safe. Compare to C:

```c
void read_sensor(int i) {
    printf("%f\n", readings[i]);   /* could read anything */
}
```

In the C version, it is the caller's responsibility to range-check `i`, and
the language gives the caller no help in remembering to do so.

### `Constraint_Error`

`Constraint_Error` is the workhorse exception of Ada. It is raised whenever a
value violates a constraint: assignment to a narrower subtype, conversion
between numeric types that overflows, array indexing out of bounds,
dereferencing a null access, integer division by zero, and so on. Every Ada
programmer meets `Constraint_Error` early and often — it is the language's
way of saying "you promised something that turned out not to be true."

In critical systems, the strategy is usually: prove at design time that
`Constraint_Error` cannot arise (either by reasoning or by SPARK proof), or
arrange for its occurrence to put the system into a safe state. SPARK, the
verifiable subset of Ada, exists largely to make "cannot arise" provable.

### Static and dynamic subtypes

A subtype constraint can be a compile-time constant or a runtime value. When it
is a constant, the subtype is **static** and the compiler does more checking
at compile time:

```ada
subtype Small is Integer range 1 .. 10;         --  static
subtype Dyn   is Integer range 1 .. N;          --  dynamic if N is a variable
```

Static subtypes are used in `case` statements to check exhaustiveness (the
compiler verifies that every value of the subtype is handled), in array index
constraints, and in many other places where the language wants to reason at
compile time.

---

## 5. Arrays

Ada arrays are more structured than C arrays, and they support a wider range of
expressions and attributes. The fundamental insight is that an array type can
either carry its bounds as part of the type (a **constrained** array) or leave
the bounds to be specified when a specific array is created (an
**unconstrained** array type).

### Constrained arrays

```ada
type Week_Hours is array (1 .. 7) of Natural;

Hours : Week_Hours := (8, 8, 8, 8, 8, 4, 0);
```

`Week_Hours` has fixed bounds `1 .. 7`. Every value of this type has exactly
seven elements indexed from 1 to 7. The initial value on the right is an
**aggregate** — a parenthesized list of values. Ada aggregates are more
expressive than C's `{...}` initializers:

```ada
Hours : Week_Hours := (1 => 8, 2 => 8, 3 => 8, 4 => 8, 5 => 8, 6 => 4, 7 => 0);
Hours : Week_Hours := (1 .. 5 => 8, 6 => 4, 7 => 0);
Hours : Week_Hours := (1 .. 5 => 8, others => 0);
Hours : Week_Hours := (others => 0);
```

The last line initializes every element to zero. The `others` keyword matches
"all remaining positions." This is exactly the feature C99 added as designated
initializers, twenty years later, and it is still not as general as Ada's.

### Unconstrained arrays

An **unconstrained** array type is one whose bounds are not fixed at the type
level. The classic example is `String`, which is defined as:

```ada
type String is array (Positive range <>) of Character;
```

The `<>` is the **box** notation and it means "any range of type Positive." A
variable of type `String` must have its bounds specified at declaration time:

```ada
S : String (1 .. 11) := "Hello World";
T : String := "Hello World";   --  bounds inferred from initializer
```

You can define your own unconstrained array types the same way:

```ada
type Vector is array (Positive range <>) of Float;

V : Vector (1 .. 100);
W : Vector (1 .. 10) := (others => 0.0);
X : Vector := (1.0, 2.0, 3.0);      --  bounds inferred: 1 .. 3
```

The advantage over C: an unconstrained array variable knows its own bounds.
Functions that take a `Vector` parameter do not need a separate length
argument. The bounds are part of the value.

```ada
function Sum (V : Vector) return Float is
   Result : Float := 0.0;
begin
   for I in V'Range loop
      Result := Result + V (I);
   end loop;
   return Result;
end Sum;
```

`V'Range` is an attribute that returns the index range of `V`. The callee
knows the bounds because they came with the parameter. This is not dynamic
allocation — the array is still stack-allocated and the bounds are known at
the point of creation — but the language tracks the bounds for you.

### Array attributes

Ada arrays support a rich set of attributes:

```ada
V'First     --  the first index
V'Last      --  the last index
V'Length    --  the number of elements
V'Range     --  V'First .. V'Last  (usable in for loops)
V'First(N)  --  the first index of the Nth dimension (for multi-dim arrays)
V'Last(N)
V'Length(N)
V'Range(N)
```

Combined with subtypes, these attributes let you write code that adapts to
whatever bounds the array has:

```ada
function Average (V : Vector) return Float is
begin
   if V'Length = 0 then
      return 0.0;
   end if;
   return Sum (V) / Float (V'Length);
end Average;
```

### Array slicing

Ada supports slicing: you can refer to a contiguous subrange of an array as a
first-class value.

```ada
S : String := "Hello, World!";
Hello : String := S (1 .. 5);       --  "Hello"
World : String := S (8 .. 12);      --  "World"

Buf : Vector (1 .. 100);
First_Half  : Vector := Buf (1 .. 50);
Second_Half : Vector := Buf (51 .. 100);
```

Slices are assignable too:

```ada
Buf (1 .. 10) := (others => 0.0);
Buf (1 .. 5)  := Buf (6 .. 10);   --  copy with overlap semantics defined
```

### Multi-dimensional arrays with independent index types

Ada supports true multi-dimensional arrays (not arrays of arrays, though those
exist too). The index types of different dimensions can be different.

```ada
type Row is range 1 .. 8;
type Col is range 1 .. 8;

type Board is array (Row, Col) of Character;

B : Board;

B (1, 1) := 'R';   --  corner square
```

You can index with values of the correct type for each dimension, and the
compiler enforces it. If you accidentally write `B (1, 1)` where the second
`1` should be a `Row`, the compiler catches it. This is another example of
typing that catches real bugs: I have personally written graphics code in C
where a width and a height got confused and the crash happened far from the
typo.

### Named vs anonymous array types

In Ada you can declare an array variable with an **anonymous** type:

```ada
Buf : array (1 .. 100) of Integer;
```

This works, but the type of `Buf` has no name. Two variables declared this way
have different, incompatible types, even if their declarations are textually
identical. You cannot pass `Buf` to a function that expects an array type of
"the same" shape — there is no shared type. In practice, always declare a
named array type first:

```ada
type Int_Buf is array (1 .. 100) of Integer;
Buf : Int_Buf;
```

Anonymous arrays exist mainly for tiny examples. They are almost always a
mistake in real code.

### The `others` aggregate and positional vs named

Aggregates come in two flavors:

```ada
V : Vector (1 .. 5) := (1.0, 2.0, 3.0, 4.0, 5.0);   --  positional
V : Vector (1 .. 5) := (1 => 1.0, 2 => 2.0, 3 => 3.0, 4 => 4.0, 5 => 5.0);  --  named
V : Vector (1 .. 5) := (1 | 3 | 5 => 1.0, others => 0.0);  --  named with alternatives
V : Vector (1 .. 5) := (others => 0.0);             --  all same
```

You cannot mix positional and named in the same aggregate (except that
positional must come first and `others` last). The language is strict about
aggregate completeness: if you write a positional aggregate, you must cover
every position; if you write a named aggregate, you must name every position
or use `others`. The compiler will not let you leave a slot undefined unless
you explicitly say `others`.

---

## 6. Records

Ada records are the fundamental mechanism for aggregating heterogeneous data,
similar to C structs but with significant extensions.

### Simple records

```ada
type Point is record
   X : Float;
   Y : Float;
end record;

P : Point := (X => 1.0, Y => 2.0);
Q : Point := (1.0, 2.0);            --  positional aggregate
```

The aggregate syntax works the same as for arrays. Named association is
strongly encouraged because it makes code robust against field reordering.

### Records with default values

Fields can have default initial values:

```ada
type Config is record
   Timeout    : Natural := 30;
   Retries    : Natural := 3;
   Verbose    : Boolean := False;
end record;

C : Config;   --  fully initialized with defaults
D : Config := (Timeout => 60, others => <>);   --  override one, keep defaults
```

The `<>` in an aggregate means "use the default value." This lets you write
aggregates that override only the fields that differ from the defaults.

### Records as values

Ada records are value types. Assignment copies. Passing to a procedure copies
(unless passed by reference, which the language decides based on size and
mode). There is no special syntax for dereferencing, no `->` operator, because
you never have a pointer to a record unless you ask for one with an access
type.

```ada
P : Point := (1.0, 2.0);
Q : Point := P;        --  Q is a copy; modifying Q does not affect P
Q.X := 99.0;
Put_Line (Float'Image (P.X));   --  still 1.0
```

### Discriminated records

A **discriminated record** is a record whose structure depends on the value of
a discriminant. The discriminant is a parameter to the type, similar to a
template parameter in C++ but evaluated at runtime:

```ada
type Buffer (Size : Positive) is record
   Data : String (1 .. Size);
   Used : Natural := 0;
end record;

B1 : Buffer (100);    --  buffer with 100-character data array
B2 : Buffer (8192);   --  buffer with 8192-character data array
```

The size is fixed when the variable is created. `B1` and `B2` are both of type
`Buffer`, but they have different sizes. The field `Data` has the size
specified by the discriminant.

Discriminated records solve a specific C problem: variable-length structs with
a flexible array member. In C you write `struct buf { int size; char data[]; }`
and then hand-compute the allocation size. In Ada you write the above and the
language takes care of it.

You can also put a constraint on the discriminant type:

```ada
type Buffer (Size : Positive range 1 .. 65536) is record
   Data : String (1 .. Size);
   Used : Natural := 0;
end record;
```

Now any attempt to create a `Buffer` with size outside `1 .. 65536` raises
`Constraint_Error` at the point of allocation.

### Variant parts (safe tagged unions)

A variant part lets a record have different fields depending on the value of a
discriminant. This is Ada's answer to the C union, and it is safer because the
discriminant is part of the record and the language enforces it.

```ada
type Shape_Kind is (Circle, Rectangle, Triangle);

type Shape (Kind : Shape_Kind) is record
   case Kind is
      when Circle =>
         Radius : Float;
      when Rectangle =>
         Width, Height : Float;
      when Triangle =>
         Base, Altitude : Float;
   end case;
end record;

C : Shape := (Kind => Circle,    Radius => 5.0);
R : Shape := (Kind => Rectangle, Width  => 3.0, Height => 4.0);
T : Shape := (Kind => Triangle,  Base   => 4.0, Altitude => 2.0);

--  Accessing the wrong variant raises Constraint_Error:
--  X : Float := C.Width;  --  crashes
```

The discriminant `Kind` is part of every `Shape` value. The language checks,
whenever you access a variant-specific field, that the discriminant has the
right value; if not, `Constraint_Error`. You cannot accidentally read the
`Radius` of a `Rectangle` — the language stops you.

Furthermore, once a `Shape` is created, its discriminant is usually immutable:
you cannot turn a `Circle` into a `Rectangle` by assigning to `Kind`. You would
have to overwrite the whole record with a new one. This is deliberate: the
language does not want a half-mutated value where the discriminant says one
thing but the fields still hold another. (Ada does have a way to change
discriminants via assignment of a whole aggregate, but it is all-or-nothing.)

When you write a `case` statement on the discriminant, the compiler checks
exhaustiveness:

```ada
procedure Print (S : Shape) is
begin
   case S.Kind is
      when Circle =>
         Put_Line ("Circle of radius " & Float'Image (S.Radius));
      when Rectangle =>
         Put_Line ("Rectangle " & Float'Image (S.Width) & " x " & Float'Image (S.Height));
      when Triangle =>
         Put_Line ("Triangle base " & Float'Image (S.Base) & " alt " & Float'Image (S.Altitude));
   end case;
end Print;
```

If you add a new variant to the type, every `case` in the program that does
not handle it becomes a compile error. This is the feature that makes
discriminated records safe to evolve, and it is one of the reasons Rust's
enums feel familiar to Ada programmers.

### Record representation clauses

For hardware interfacing, Ada lets you specify the exact bit-level layout of a
record. This is the feature that makes Ada a real systems language.

```ada
type Control_Register is record
   Enable     : Boolean;
   Interrupt  : Boolean;
   Mode       : Natural range 0 .. 3;
   Reserved   : Natural range 0 .. 255;
   Status     : Natural range 0 .. 15;
end record;

for Control_Register use record
   Enable     at 0 range  0 ..  0;   --  byte 0, bit 0
   Interrupt  at 0 range  1 ..  1;   --  byte 0, bit 1
   Mode       at 0 range  2 ..  3;   --  byte 0, bits 2-3
   Reserved   at 0 range  4 .. 11;   --  byte 0 bits 4-7, byte 1 bits 0-3
   Status     at 0 range 12 .. 15;   --  byte 1, bits 4-7
end record;

for Control_Register'Size use 16;
```

The `at B range L .. H` syntax says "this field is at byte offset B and
occupies bits L through H." The compiler checks that the layout is consistent:
no overlapping fields, no gaps unless you want them, every field of the record
covered. You can also specify the total size of the record and its alignment.

When you access the fields of a `Control_Register`, you write the same code
you would for any other record (`R.Enable := True`), and the compiler emits
the correct bit-field load/store instructions. This is enormously more
pleasant than C's `#define`-and-mask approach, and it is much harder to get
wrong.

---

## 7. Access types — pointers done right

Ada has pointers. They are called **access types**, and they are different
from C pointers in several important ways.

### Declaration and use

```ada
type Node;   --  incomplete declaration (forward reference)
type Node_Access is access Node;

type Node is record
   Value : Integer;
   Next  : Node_Access;
end record;

Head : Node_Access := null;
```

`type Node_Access is access Node` defines an access type that points to values
of type `Node`. A value of type `Node_Access` is either `null` or the address
of a `Node`.

To allocate a new `Node`:

```ada
Head := new Node'(Value => 1, Next => null);
```

`new Node'(...)` allocates a `Node`, initializes it with the aggregate, and
returns an access value. Compare to C's `malloc`, which returns an
uninitialized block of bytes.

To dereference, you use `.all`:

```ada
X : Integer := Head.all.Value;
```

But Ada has a convenience: if the access type points to a record, you can
omit `.all` when accessing a field:

```ada
X : Integer := Head.Value;       --  implicit .all
Head.Value := 42;                 --  modifies the pointed-to node
```

This is called **implicit dereference**, and it makes access-type code read
almost like plain record access. To copy through an access, you write the
full form:

```ada
Head.all := Other_Node.all;       --  copy the whole record
```

### Access types are typed

Two different access types pointing to the same underlying type are still
different types:

```ada
type Apple_Access  is access Apple;
type Orange_Access is access Orange;

A : Apple_Access;
O : Orange_Access;

--  A := O;  -- does not compile, even if Apple and Orange are same layout
```

You can define an `access Apple` parameter and the compiler will refuse to
pass it an `Orange_Access`. There is no way to cast one access type to another
without `Ada.Unchecked_Conversion`, which is an explicit, greppable admission
of something dangerous.

### `access all` vs plain `access`

There are two flavors of access type:

```ada
type P1 is access Integer;      --  can only point to heap-allocated Integers
type P2 is access all Integer;  --  can also point to declared variables
```

`access all T` is called a **general access type** and it can point to any
object of type `T`, including stack variables, heap variables, or variables
declared in a package. Plain `access T` is called a **pool-specific access
type** and it can only point to values allocated with `new` (from a specific
storage pool).

To take the address of an existing variable, you write `'Access`:

```ada
X : aliased Integer := 42;
P : access all Integer := X'Access;
```

Note that `X` has to be declared `aliased` — this is Ada's way of saying "I
promise this variable might be pointed to, so do not keep it in a register
only." It is the same idea as C's `&`, but you have to declare the variable
aliasable at its definition site.

### Accessibility levels

Ada has a compile-time system called **accessibility levels** that prevents
certain dangling-pointer bugs statically. The basic rule: you cannot create an
access value that outlives the object it points to.

```ada
type Int_Ptr is access all Integer;

function Bad return Int_Ptr is
   Local : aliased Integer := 42;
begin
   return Local'Access;    --  COMPILE ERROR: accessibility check fails
end Bad;
```

The compiler can see that `Local` is declared inside `Bad`, and that the
return value must live at least as long as the caller. The accessibility level
of `Local'Access` is strictly "inside `Bad`," which is too short for a return
value, so the compiler rejects the code.

Accessibility levels do not catch every dangling pointer — they are a static
approximation — but they catch the most common class.

### Storage pools

By default, `new` allocates from a default storage pool, which is typically
the standard heap. Ada lets you define your own storage pools and associate
them with specific access types:

```ada
type Small_Pool is new Root_Storage_Pool with ...;
My_Pool : Small_Pool;

type Node_Ptr is access Node;
for Node_Ptr'Storage_Pool use My_Pool;

N : Node_Ptr := new Node;   --  allocates from My_Pool
```

This lets you:
- Use a custom allocator for specific types (bump allocator, pool allocator,
  object slab).
- Track memory usage per type.
- Implement deterministic allocation for real-time code (no global heap lock).
- Detect leaks and use-after-free with custom checking.

Storage pools are a feature very few languages have and they are one of
Ada's more powerful systems features.

### `Unchecked_Deallocation`

Ada does not have garbage collection (though the standard does not forbid it).
To free memory, you use `Ada.Unchecked_Deallocation`:

```ada
with Ada.Unchecked_Deallocation;

procedure Free is new
   Ada.Unchecked_Deallocation (Object => Node, Name => Node_Access);

N : Node_Access := new Node;
--  ... use N ...
Free (N);   --  N is now null
```

The name `Unchecked_Deallocation` is the language shouting at you: freeing is
inherently dangerous, so the procedure you use to do it has "Unchecked" in its
name, to make sure every free site is visible to a code review. After the
call, the pointer is set to `null`, which helps against double-free.

### Why Ada programmers avoid access types when possible

The Ada community has a running joke that the best pointer is no pointer.
Programmers are taught to reach for arrays, discriminated records, variants,
and controlled types (which are the Ada equivalent of C++ RAII) before
reaching for explicit allocation. The reason: every pointer is a potential
bug surface. Dangling pointers, double-frees, leaks, aliasing surprises — all
are cheaper to avoid than to debug.

Ada's bounds-tracking unconstrained arrays mean you do not usually need
pointers to pass variable-sized data around. Its discriminated records mean
you do not usually need pointers to do polymorphic data structures (though
tagged types, covered later, do use pointers under the hood). Its generics
mean you can write a stack or a queue without heap allocation at all.

The result: a well-written Ada program has surprisingly few `access` types,
and the ones it has are in a small number of well-audited places. This is not
a stylistic preference; it is a response to the observation that pointer bugs
are expensive.

---

## 8. Packages and information hiding

The package is Ada's unit of modularity. It is equivalent to a C++ namespace
plus a compilation unit plus an information-hiding boundary. Everything
non-trivial in an Ada program lives in a package.

### Package specification vs package body

Recall the earlier example:

```ada
--  stack.ads — the specification
package Stack is
   procedure Push (X : Integer);
   function  Pop return Integer;
   function  Is_Empty return Boolean;
end Stack;
```

```ada
--  stack.adb — the body
package body Stack is
   Data : array (1 .. 100) of Integer;
   Top  : Natural := 0;

   procedure Push (X : Integer) is ...
   function  Pop return Integer is ...
   function  Is_Empty return Boolean is ...
end Stack;
```

The spec is the contract. Clients see only the spec. The body is the
implementation. Clients never see the body, never import the body, and
recompilation of the body does not force recompilation of the clients (as
long as the spec is unchanged). This is the classic information-hiding
arrangement and it is enforced by the language.

### The `private` part of a specification

Sometimes a type needs to be visible to clients (so they can declare
variables of it, pass it around, etc.) but its internal structure should be
hidden. Ada handles this with the `private` section of a package spec:

```ada
package Stack is

   type T is private;

   procedure Push (S : in out T; X : Integer);
   function  Pop  (S : in out T) return Integer;
   function  Is_Empty (S : T) return Boolean;

private

   type T is record
      Data : array (1 .. 100) of Integer;
      Top  : Natural := 0;
   end record;

end Stack;
```

A client of this package sees `type T is private` in the visible part. They
can declare variables of type `T`, pass them to `Push` and `Pop`, and test
`Is_Empty`, but they cannot access `Data` or `Top` directly. Those fields
exist only in the `private` section, which is visible to the package body
and to child packages but not to clients.

Why put the private part in the spec at all, rather than hiding it in the
body? Because the compiler needs to know the size and layout of `T` in order
to compile code in the client that declares a variable of type `T`. The
private part lets the compiler know the layout without letting the client
programmer see it textually in their IDE.

This is the equivalent of the "opaque pointer" idiom in C
(`typedef struct stack_s *stack;` in the header, full `struct stack_s` in the
.c file), but without the indirection and heap allocation that C forces on
you.

### `limited private`

A variant is `limited private`:

```ada
type T is limited private;
```

A `limited` type is one for which assignment is not defined. Clients cannot
copy values of `T`; they can only create them and operate on them through
the exposed operations. This is the right choice for resources that have
identity, like file handles, locks, and sockets — copying a file handle is
usually a bug.

### Child packages

A child package has access to its parent's public and private parts. This is
how Ada extends an abstraction without modifying the original:

```ada
--  stack.ads
package Stack is
   type T is private;
   procedure Push (S : in out T; X : Integer);
   function  Pop  (S : in out T) return Integer;
private
   type T is record
      Data : array (1 .. 100) of Integer;
      Top  : Natural := 0;
   end record;
end Stack;

--  stack-debug.ads
package Stack.Debug is
   procedure Dump (S : T);
end Stack.Debug;

--  stack-debug.adb
with Ada.Text_IO; use Ada.Text_IO;
package body Stack.Debug is
   procedure Dump (S : T) is
   begin
      for I in 1 .. S.Top loop      --  visible because we are a child
         Put_Line (Integer'Image (S.Data (I)));
      end loop;
   end Dump;
end Stack.Debug;
```

`Stack.Debug` is a child of `Stack`. It has access to `Stack`'s private part
(the fields `Data` and `Top`), so it can write a dump procedure that
introspects the stack. A client outside the `Stack` family cannot do this.

This is a remarkably clean way to extend a package without modifying it, and
it is one of the reasons Ada scales well to large codebases.

### The contrast with C header files

A C header file is a textual include. It gets pasted into every file that
includes it. Macros from one file leak into another. Declarations can
disagree with definitions. Circular includes break. Include order matters.
Compile time scales badly because every translation unit re-parses every
header.

An Ada `with` clause is a declarative reference. The compiler parses each spec
once and caches the result. `with`ing a spec twice is the same as `with`ing it
once. Include order does not matter. Macros do not exist. Circular `with`
clauses are a compile error. Recompilation is surgical: changing a body does
not force clients to recompile.

This is not a minor quality-of-life improvement. On a million-line codebase,
the difference between C's textual includes and Ada's declarative `with`
clauses can be an order of magnitude in build time, and Ada programs are
dramatically less prone to the class of bugs that come from macros colliding
or headers disagreeing with their implementations.

---

## 9. Subprograms — procedures and functions

Ada has two kinds of subprogram: `procedure` and `function`. A procedure has
no return value and is called for its side effects. A function has a return
value and traditionally should not have side effects (though the language
does not enforce purity).

```ada
procedure Greet (Name : String) is
begin
   Put_Line ("Hello, " & Name);
end Greet;

function Square (X : Integer) return Integer is
begin
   return X * X;
end Square;
```

### Parameter modes

This is one of the features that distinguishes Ada from most other languages.
Every parameter has a **mode** that says how it is used:

- `in`    — the subprogram can read the parameter but not modify it. This is
            the default.
- `out`   — the subprogram can write to the parameter. The initial value is
            undefined; the caller sees the written value after the call.
- `in out`— the subprogram can read and write the parameter.

```ada
procedure Increment (X : in out Integer) is
begin
   X := X + 1;
end Increment;

procedure Read_Sensor (Value : out Float; Status : out Boolean) is
begin
   Value  := 42.5;
   Status := True;
end Read_Sensor;

function Compute (X : in Integer; Y : in Integer) return Integer is ...
```

The modes are a documentation feature and a correctness feature. When you
read a procedure signature, you can tell at a glance which parameters are
inputs, which are outputs, and which are both. The compiler enforces it: you
cannot read an `out` parameter before writing it, and you cannot write an
`in` parameter at all.

Ada's `in out` is not quite the same as passing by reference in C++. The
language gives the compiler latitude to implement `in out` by copy-in/copy-out
(making a copy of the argument, letting the subprogram modify the copy, and
copying the result back on return) for value types, and by reference for
larger types. The net effect is usually identical unless you have aliasing,
in which case the behavior may differ. The Ada answer is that you should not
rely on aliasing, because the reference manual explicitly leaves it
unspecified.

### Default parameter values

Parameters can have default values, just like in Python:

```ada
procedure Retry (
   Max_Attempts : Natural := 3;
   Delay_Ms     : Natural := 1000)
is
begin
   ...
end Retry;

Retry;                             --  use all defaults
Retry (Max_Attempts => 5);         --  override one
Retry (Delay_Ms => 500);           --  override the other
Retry (10, 2000);                  --  override both positionally
```

### Named parameter association

You can pass arguments positionally or by name:

```ada
--  positional:
Retry (10, 2000);

--  named:
Retry (Max_Attempts => 10, Delay_Ms => 2000);

--  mixed (positional first, then named):
Retry (10, Delay_Ms => 2000);
```

Named associations are strongly encouraged for any subprogram with more than
two parameters. They make the call site self-documenting and robust to
parameter reordering in the spec.

### Overloading

Ada supports subprogram overloading based on parameter and return types. You
can have multiple subprograms with the same name as long as their signatures
differ:

```ada
function Parse (S : String) return Integer;
function Parse (S : String) return Float;
function Parse (S : String) return Date;
```

The compiler picks which one to call based on the expected type at the call
site:

```ada
I : Integer := Parse ("42");      --  picks the Integer version
F : Float   := Parse ("42.5");    --  picks the Float version
D : Date    := Parse ("2026-04-09");  --  picks the Date version
```

This is more general than C++ overloading, which does not consider return
type. It is also a common source of confusion for beginners, because the
overload resolution rules are subtle when multiple candidates could match.

### Expression functions (Ada 2012)

For short, one-expression functions, Ada 2012 added **expression function**
syntax:

```ada
function Square (X : Integer) return Integer is (X * X);

function Is_Even (X : Integer) return Boolean is (X mod 2 = 0);

function Max (A, B : Integer) return Integer is (if A > B then A else B);
```

The body is just an expression in parentheses after `is`. No `begin`, no
`return`, no `end`. This is a quality-of-life feature that makes short
functions less verbose. It also has semantic significance: an expression
function in the private part of a spec is inlinable and SPARK-compatible in
ways that a normal function body is not.

### Renames declarations

You can give a new name to an existing subprogram or variable with `renames`:

```ada
function Lg (X : Float) return Float renames Log_2;

procedure Print (S : String) renames Ada.Text_IO.Put_Line;
```

This is very useful for writing adapters and for shortening long names in a
local scope without bringing in a `use` clause.

---

## 10. Generics

Generics are Ada's mechanism for writing code that is parameterized over
types, values, subprograms, and packages. They are used in the same places
C++ templates and Java generics are used, but they work fundamentally
differently.

### Generic packages and subprograms

A generic package starts with a `generic` clause that lists its formal
parameters, followed by a normal package declaration:

```ada
generic
   type Element is private;
package Queues is
   type Queue is private;

   procedure Enqueue (Q : in out Queue; E : Element);
   procedure Dequeue (Q : in out Queue; E : out Element);
   function  Is_Empty (Q : Queue) return Boolean;

private
   type Node;
   type Node_Ptr is access Node;
   type Node is record
      Value : Element;
      Next  : Node_Ptr;
   end record;

   type Queue is record
      Head, Tail : Node_Ptr := null;
   end record;
end Queues;
```

This package is parameterized over a type `Element`. The declaration
`type Element is private` says "the client will supply a type, and all I
know about it is that it is assignable and comparable for equality" — which
is what `private` means in a generic formal parameter.

To use the package, you **instantiate** it with a concrete type:

```ada
with Queues;

package Int_Queues is new Queues (Element => Integer);

use Int_Queues;

Q : Queue;
begin
   Enqueue (Q, 42);
   --  ...
end;
```

The instantiation creates a new package, `Int_Queues`, which is a specialized
version of `Queues` for `Integer`. Inside `Int_Queues`, the name `Element` is
equivalent to `Integer`. You can instantiate the same generic many times with
different types:

```ada
package Int_Queues    is new Queues (Integer);
package String_Queues is new Queues (Unbounded_String);
package Float_Queues  is new Queues (Float);
```

Each instantiation is a distinct package with its own `Queue` type.

### Formal generic parameters: types, values, subprograms, packages

Generics can be parameterized over more than just types:

**Type parameters** describe what kind of type the client must supply:

```ada
generic
   type T is private;              --  any non-limited type
   type T is limited private;      --  any type
   type T is (<>);                 --  any discrete type (integer or enum)
   type T is range <>;             --  any integer type
   type T is mod <>;               --  any modular type
   type T is digits <>;            --  any floating-point type
   type T is delta <>;             --  any fixed-point type
   type T is tagged private;       --  any tagged type
```

The syntax on the right of `is` tells the compiler what operations the
generic can use on `T`. A generic that declares `type T is (<>)` can use `'First`,
`'Last`, `'Succ`, and so on, because the formal parameter is some kind of
discrete type. If the client supplies `Float`, the instantiation fails.

**Value parameters** let you parameterize over a constant:

```ada
generic
   Size : Positive;
   type Element is private;
package Fixed_Stack is
   type T is private;
   procedure Push (S : in out T; X : Element);
private
   type T is record
      Data : array (1 .. Size) of Element;
      Top  : Natural := 0;
   end record;
end Fixed_Stack;

package Small_Int_Stack is new Fixed_Stack (Size => 10, Element => Integer);
```

**Subprogram parameters** let you parameterize over a function or procedure:

```ada
generic
   type Element is private;
   with function "<" (A, B : Element) return Boolean;
procedure Sort (V : in out Element_Array);

--  Instantiate with Integer and the built-in "<":
procedure Int_Sort is new Sort (Integer, "<");

--  Instantiate with a custom comparison:
function Reverse_Less (A, B : Integer) return Boolean is (A > B);
procedure Int_Sort_Desc is new Sort (Integer, Reverse_Less);
```

This is how Ada expresses higher-order algorithms. A sort generic takes the
comparison as a formal parameter; the client supplies whatever comparison
they want at instantiation time. The same pattern gives you generic hash
tables (hash function as parameter), generic pretty-printers (formatting
function as parameter), and so on.

**Package parameters** let you parameterize over a whole package:

```ada
generic
   with package Inner is new Queues (<>);
package Queue_Utils is
   procedure Print_All (Q : Inner.Queue);
end Queue_Utils;
```

This is rarely needed but extremely powerful when you need it.

### How Ada generics differ from C++ templates

C++ templates are essentially macros that the compiler expands at every
instantiation. They are type-checked only at instantiation time. If a template
uses an operation the concrete type does not support, you get the error at
instantiation, and the error messages can be catastrophic. C++ templates also
allow template metaprogramming — computation at compile time using template
specializations — which is Turing-complete and which few people understand.

Ada generics are type-checked at **declaration** time, not instantiation. When
you write a generic package, the compiler verifies that the body uses the
formal parameters only in ways that are guaranteed to work for any conforming
actual. If the generic tries to use an operation on `Element` that
`type Element is private` does not guarantee, the generic itself does not
compile — not the instantiation.

This has enormous practical benefits:

- **Better error messages.** A generic that compiles will instantiate
  cleanly, or fail at the instantiation site with a clear error about which
  formal parameter the actual does not conform to.
- **Separate compilation.** A generic can be compiled independently of its
  instantiations, and instantiations can be compiled independently of each
  other.
- **No metaprogramming.** Ada generics do not let you compute types at compile
  time. You cannot do template metaprogramming. This is deliberate: the
  designers judged that the error-message cost of metaprogramming was greater
  than its expressive benefit.

The trade-off is that Ada generics are less expressive. You cannot write
`std::enable_if`, you cannot write traits with partial specialization, and
you cannot compute types conditionally. For the applications Ada cares about,
this is considered acceptable.

### How Ada generics differ from Java generics

Java generics use **type erasure**: at runtime, all generic types become
`Object`, and casts are inserted. This means you cannot distinguish
`List<String>` from `List<Integer>` at runtime, and you cannot create arrays
of generic types, and you cannot use primitive types as generic parameters.

Ada generics use **reification**: every instantiation creates genuinely
different code. `Int_Queues` and `String_Queues` are distinct packages with
distinct types and distinct compiled code. You can use any type as a generic
parameter, including scalars and arrays. The price is code size (each
instantiation is compiled separately, though the compiler can share code
where it can prove the sharing is sound).

For the systems Ada targets, reification is the right choice: you want
predictable runtime behavior, and you are willing to pay some code size for
it.

### Example: generic container package

Here is a more realistic generic package, a bounded stack:

```ada
generic
   Capacity : Positive;
   type Element is private;
package Bounded_Stacks is

   type Stack is private;

   Stack_Empty    : exception;
   Stack_Overflow : exception;

   procedure Push (S : in out Stack; X : Element);
   procedure Pop  (S : in out Stack; X : out Element);
   function  Top  (S : Stack) return Element;
   function  Is_Empty (S : Stack) return Boolean;
   function  Is_Full  (S : Stack) return Boolean;
   function  Size     (S : Stack) return Natural;

private

   type Element_Array is array (1 .. Capacity) of Element;

   type Stack is record
      Data : Element_Array;
      Top  : Natural := 0;
   end record;

end Bounded_Stacks;
```

```ada
package body Bounded_Stacks is

   procedure Push (S : in out Stack; X : Element) is
   begin
      if S.Top = Capacity then
         raise Stack_Overflow;
      end if;
      S.Top := S.Top + 1;
      S.Data (S.Top) := X;
   end Push;

   procedure Pop (S : in out Stack; X : out Element) is
   begin
      if S.Top = 0 then
         raise Stack_Empty;
      end if;
      X := S.Data (S.Top);
      S.Top := S.Top - 1;
   end Pop;

   function Top (S : Stack) return Element is
   begin
      if S.Top = 0 then
         raise Stack_Empty;
      end if;
      return S.Data (S.Top);
   end Top;

   function Is_Empty (S : Stack) return Boolean is (S.Top = 0);
   function Is_Full  (S : Stack) return Boolean is (S.Top = Capacity);
   function Size     (S : Stack) return Natural is (S.Top);

end Bounded_Stacks;
```

And an instantiation:

```ada
with Bounded_Stacks;

procedure Main is
   package Int_Stack is new Bounded_Stacks (Capacity => 100, Element => Integer);
   use Int_Stack;

   S : Stack;
   X : Integer;
begin
   Push (S, 42);
   Push (S, 17);
   Pop  (S, X);   --  X = 17
   Pop  (S, X);   --  X = 42
end Main;
```

Note that the stack is stack-allocated — there is no heap activity. The
`Capacity` is known at instantiation time, so the underlying array has a
fixed size. This is the pattern Ada reaches for whenever you would otherwise
use dynamic allocation: bound the size, instantiate with the bound, and let
the language check it.

---

## 11. Exceptions

Ada was one of the first languages to have exception handling as a
language-level feature (PL/I had some form earlier, but Ada's is more
structured). Today, exceptions are everywhere, but the Ada design still
has distinctive properties.

### Declaring and raising exceptions

An exception is declared with `exception`:

```ada
package Sensors is
   Sensor_Offline  : exception;
   Sensor_Overload : exception;
   Calibration_Required : exception;
end Sensors;
```

You raise an exception with `raise`:

```ada
if Voltage > Max_Voltage then
   raise Sensor_Overload;
end if;
```

You can also attach a message (Ada 2005):

```ada
raise Sensor_Overload with "voltage" & Float'Image (Voltage) & " exceeds limit";
```

### Handling exceptions

Exceptions are handled with an `exception` clause at the end of a `begin ...
end` block:

```ada
begin
   Read_Sensor;
   Validate_Data;
   Act_On_Data;
exception
   when Sensor_Offline =>
      Log_Warning ("sensor offline, skipping");
   when Sensor_Overload =>
      Emergency_Shutdown;
   when E : others =>
      Log_Error ("unexpected: " & Ada.Exceptions.Exception_Message (E));
      raise;
end;
```

Several things worth noting:

- The `exception` section goes inside the `begin ... end` block it handles.
- Each `when` clause matches a specific exception (or a list of them:
  `when Sensor_Offline | Sensor_Overload =>`) or the catch-all `others`.
- You can bind the exception occurrence to a name: `when E : others =>`.
  This lets you inspect the exception details via
  `Ada.Exceptions.Exception_Name`, `Exception_Message`, and
  `Exception_Information`.
- `raise;` inside a handler re-raises the current exception unchanged. This
  is the standard way to log and propagate.

### Standard exceptions

Ada defines a small number of predefined exceptions:

- `Constraint_Error` — raised when a constraint check fails (range violation,
  array bounds, division by zero, overflow, null dereference, etc.).
- `Program_Error` — raised when a programming error is detected that the
  language was able to catch at runtime (e.g., calling a subprogram before
  its body has been elaborated, leaving a function without returning).
- `Storage_Error` — raised when memory allocation fails or the stack overflows.
- `Tasking_Error` — raised when the tasking system detects an error (this is
  in the concurrency thread).

Most Ada code catches these explicitly only at the top level, if at all. The
intent is that `Constraint_Error` indicates a programming bug that should
crash the program in development; in production, you have reasoned ahead of
time about which of them can actually arise and handled them at the right
level.

### Exception propagation and scope

An unhandled exception propagates up the call stack until it finds a handler.
At each level, the current block terminates and its automatic cleanup runs.
(Controlled types — the Ada analogue of C++ destructors — get their
`Finalize` methods called.) If the exception reaches the top of the main
procedure without being caught, the program terminates.

A handler is **local to a block**. If a procedure wants to handle an
exception that might arise in its body, it writes:

```ada
procedure Process is
begin
   ...
exception
   when E : others =>
      ...
end Process;
```

The exception section applies to the body of `Process`. Exceptions raised in
`Process` that are not handled here propagate to `Process`'s caller.

### Why Ada exceptions are more disciplined than Java's

Java has **checked exceptions**: subclasses of `Exception` that must be
either caught or declared in the `throws` clause of every method they can
propagate through. The idea was to force programmers to handle errors; in
practice, it led to `catch (Exception e) { /* ignore */ }` and to wrapping
exceptions in runtime exceptions to avoid the declaration burden.

Ada has no checked exceptions. Any procedure can raise any exception, and no
declaration is required. This sounds laxer than Java, but the Ada style is
different: you are expected to reason about what exceptions a subprogram can
raise, and document them in the spec if they are part of the contract. The
community convention is to handle exceptions at the level where you have
enough information to do something useful about them, and to let them
propagate otherwise.

Ada 2012 added the ability to state exception-raising behavior as part of a
contract, via the `Exceptional_Cases` aspect (in Ada 2022/2023). Before that,
it was documentation-only.

The discipline comes from typing, not from the exception system: because you
cannot silently coerce types, most of the bugs that become exceptions in
other languages become type errors in Ada that the compiler catches. The
exceptions you end up handling are mostly environmental (I/O failure,
resource exhaustion) rather than logic.

---

## 12. Object-oriented programming (Ada 95+)

Ada 83 was not object-oriented. Ada 95 added the mechanisms for OOP, called
**tagged types**. Ada 2005 added interfaces. The OOP model is somewhat
idiosyncratic — it feels tacked-on relative to languages that were
object-oriented from the start.

### Tagged types

A tagged type is one that carries a runtime tag identifying its most
specific type. This is what enables polymorphism.

```ada
package Shapes is

   type Shape is tagged record
      X, Y : Float;
   end record;

   function Area (S : Shape) return Float is (0.0);   --  base default

   procedure Draw (S : Shape);

end Shapes;
```

```ada
package Shapes.Circles is

   type Circle is new Shape with record
      Radius : Float;
   end record;

   overriding function Area (C : Circle) return Float;
   overriding procedure Draw (C : Circle);

end Shapes.Circles;
```

```ada
package body Shapes.Circles is

   overriding function Area (C : Circle) return Float is
      Pi : constant := 3.14159_26535_89793;
   begin
      return Pi * C.Radius * C.Radius;
   end Area;

   overriding procedure Draw (C : Circle) is
   begin
      Put_Line ("Circle at (" & Float'Image (C.X) & "," & Float'Image (C.Y) &
                ") radius " & Float'Image (C.Radius));
   end Draw;

end Shapes.Circles;
```

A few things to notice:

- `type Shape is tagged record ... end record;` declares `Shape` as a tagged
  (i.e., inheritable) type.
- `type Circle is new Shape with record ... end record;` creates a derived
  type that extends `Shape` with additional fields. The `with record`
  syntax is where you add the new fields; the inherited fields come along
  for free.
- `overriding function Area ...` explicitly says "this function overrides
  the one from the parent." Since Ada 2005 you can write `overriding` on
  the declaration; if the function does not actually override anything, it
  is a compile error. This catches typos in overridden methods.
- Ada does not use dot notation for method calls by default. You write
  `Area (C)`, not `C.Area`. Ada 2005 added a dot notation for tagged types
  (`C.Area` is allowed as a shorthand for `Area (C)`), so modern Ada can
  look more like traditional OO. But the underlying model is "functions
  that take a tagged parameter," not "methods attached to objects."

### Primitive operations and dispatching

A **primitive operation** of a tagged type is a subprogram declared in the
same package as the type, that takes the type as a parameter. Primitive
operations participate in dispatching: when you call one on a value whose
compile-time type is `Shape'Class` (the class-wide type, see below), the
runtime tag determines which version is called.

```ada
with Shapes;         use Shapes;
with Shapes.Circles; use Shapes.Circles;

procedure Main is
   S : Shape'Class := Circle'(X => 0.0, Y => 0.0, Radius => 5.0);
begin
   Put_Line (Float'Image (Area (S)));   --  dispatches to Circle's Area
end Main;
```

The type `Shape'Class` is the **class-wide type** of `Shape`: it denotes any
value whose type is `Shape` or any descendant. A call on a `Shape'Class`
value is dispatched at runtime. A call on a `Shape` value is statically
bound — that is, Ada requires you to be explicit about whether you want
dispatching.

This is different from C++ and Java, where dispatching is the default for
`virtual` methods. In Ada, static binding is the default, and you opt in to
dispatching by using the class-wide type. The reasoning: dispatching has a
performance cost, and Ada wants you to pay it deliberately.

### Abstract types and operations

An abstract type cannot be instantiated directly; it exists only as a base
for other types.

```ada
type Shape is abstract tagged record
   X, Y : Float;
end record;

function Area (S : Shape) return Float is abstract;
procedure Draw (S : Shape) is abstract;
```

An abstract operation has no body. Any concrete (non-abstract) type derived
from `Shape` must override all its abstract operations. If you try to derive
a type without overriding one, the compile fails.

### Interfaces (Ada 2005)

Ada 83 had no OOP. Ada 95 added single inheritance via tagged types. Ada
2005 added **interfaces**, which are abstract tagged types that allow
multiple inheritance:

```ada
type Drawable is interface;
procedure Draw (D : Drawable) is abstract;

type Measurable is interface;
function Area (M : Measurable) return Float is abstract;

type Shape is interface and Drawable and Measurable;

type Circle is new Shape with record
   X, Y, Radius : Float;
end record;

overriding procedure Draw (C : Circle);
overriding function  Area (C : Circle) return Float;
```

This gives you the Java-style interface model: multiple inheritance of
interfaces but single inheritance of implementation. The restriction exists
to avoid the diamond problem without having to deal with it.

### Why Ada's OOP is often considered awkward

If you come from Java, Smalltalk, or Python, Ada's OOP feels inside-out. In
most OO languages, a method is "attached to" an object and called with
`obj.method(args)`. In Ada, a method is a free function that takes the
object as its first parameter, and calls look like `method(obj, args)`. This
is because Ada 95 was an extension of Ada 83, which was not OO, and the
designers wanted the extension to be backward compatible.

The dot notation added in Ada 2005 (`Obj.Method(args)`) eases the pain, but
under the hood the model is still functions over tagged parameters. This
has advantages: multiple dispatch is natural (you can have operations whose
dispatch depends on more than one parameter), and you can add methods to a
type in a child package without modifying the original. But it does not
feel like Java.

Ada's OOP is adequate for the applications Ada cares about, but it is not
the reason you would pick Ada. If you want the most elegant OOP story in the
world, Ada is not the answer. If you want a language where OOP is one tool
among many and where you can go long stretches without using it at all, Ada
is an excellent answer.

---

## 13. Contracts — Ada 2012

One of the most significant additions in Ada 2012 was **contracts**: a way
to annotate subprograms and types with preconditions, postconditions, and
invariants, and have the compiler check them at runtime (or prove them
statically, with SPARK).

### Preconditions and postconditions

A precondition is a condition that must hold when a subprogram is called. A
postcondition is a condition that must hold when a subprogram returns.

```ada
function Sqrt (X : Float) return Float
   with Pre  => X >= 0.0,
        Post => Sqrt'Result >= 0.0 and then
                abs (Sqrt'Result * Sqrt'Result - X) < 1.0e-6;
```

The `with` keyword introduces an **aspect**. `Pre` and `Post` are aspects
that take boolean expressions. The compiler (by default, if checks are on)
inserts a runtime check at every call to `Sqrt` that `X >= 0.0`, and another
check at the return that the postcondition holds. If either check fails,
`Assertion_Error` is raised.

Inside the postcondition, `Sqrt'Result` refers to the value being returned.
You can also use `'Old` to refer to a value at the start of the subprogram,
useful for stating that a procedure did something:

```ada
procedure Increment (X : in out Integer)
   with Post => X = X'Old + 1;
```

### Type invariants

A type invariant is a predicate that every value of a type must satisfy.

```ada
type Account is private
   with Type_Invariant => Is_Valid (Account);

function Is_Valid (A : Account) return Boolean;

--  in the private part:
type Account is record
   Balance : Float := 0.0;
   Open    : Boolean := True;
end record;

function Is_Valid (A : Account) return Boolean is
   (if A.Open then A.Balance >= 0.0 else A.Balance = 0.0);
```

The invariant is checked at every point where a value of type `Account`
could become visible to code outside the package that defines it — after
each public subprogram returns, after an `out` parameter is written, and so
on. Inside the package, the invariant can be temporarily violated (as long
as it is restored before control leaves the package).

This is the programming-by-contract pattern Bertrand Meyer popularized in
Eiffel, adapted to Ada's package-based modularity.

### Subtype predicates

A **subtype predicate** is a constraint on a subtype that goes beyond simple
range constraints. It can be any boolean expression.

```ada
subtype Even_Integer is Integer
   with Dynamic_Predicate => Even_Integer mod 2 = 0;

subtype Prime_Small is Integer
   with Static_Predicate => Prime_Small in 2 | 3 | 5 | 7 | 11 | 13 | 17 | 19;
```

A `Dynamic_Predicate` is checked at runtime at every assignment to the
subtype. A `Static_Predicate` uses only static membership tests and can be
used in `case` statements and other places where the compiler needs to know
the set of values statically.

### Dynamic vs static checking

By default, contracts are checked at runtime. You can turn off the checks
with `pragma Assertion_Policy (Ignore)`, or enable them individually for
`Pre`, `Post`, `Type_Invariant`, etc.

The real power of contracts comes from SPARK, which is a subset of Ada where
the compiler can **prove** that contracts hold statically. With SPARK, you
write:

```ada
function Sqrt (X : Float) return Float
   with Pre  => X >= 0.0,
        Post => Sqrt'Result >= 0.0;
```

and the SPARK prover verifies, at compile time, that no call to `Sqrt` can
be made with a negative argument, and that the body of `Sqrt` always
produces a non-negative result. If it can prove this, no runtime check is
necessary. If it cannot, you get a counterexample or a hint about what
additional information the prover needs.

SPARK is the subject of a separate thread in this research series, so I
will not go into detail here. The key point is that Ada's contracts are a
bridge: they are executable documentation in normal Ada, and they are the
specification for mathematical proof in SPARK. The same code can be
developed interactively (with runtime checks) and then verified
mathematically.

### Why contracts matter

Before Ada 2012, you expressed preconditions with `if ... raise`
statements, and you expressed invariants with private predicates that you
had to remember to call from every public operation. It worked, but it was
error-prone and invisible in the spec. Contracts make the invariants
visible in the interface, so a client can reason about a subprogram without
reading its body, and a maintainer can see at a glance what is guaranteed.

This is the feature that makes Ada viable for formal verification. With
contracts + SPARK, you can prove that a piece of code has no runtime errors,
that it satisfies its functional spec, that it preserves invariants, and
that (with the `Exceptional_Cases` machinery) it raises exceptions only
under conditions you have identified in advance. No other mainstream
language has this at the same level of maturity.

---

## 14. Expressions and operators

Ada's expression syntax has several features you do not see in mainstream
languages.

### Short-circuit operators

Ada distinguishes **logical** and **short-circuit** boolean operators. `and`
and `or` evaluate both operands. `and then` and `or else` short-circuit.

```ada
if P /= null and then P.Value > 0 then   --  safe: short-circuits
   ...
end if;

if P /= null and P.Value > 0 then        --  not safe: may dereference null
   ...
end if;
```

In most other languages, `&&` and `||` short-circuit by default. Ada made
the long form of the operator the non-short-circuit version and added
`and then`/`or else` for short-circuit. The reasoning: short-circuit is a
control-flow construct, and control flow should be syntactically obvious.
When you write `and then`, you are saying "the order matters."

### Membership tests

`in` tests whether a value belongs to a range, a subtype, or an explicit set:

```ada
if X in 1 .. 10 then ...
if X in Positive then ...
if D in Monday .. Friday then ...
if C in 'a' .. 'z' | 'A' .. 'Z' then ...
```

`not in` is the negation. These are much cleaner than writing compound
comparisons, especially the multi-range form in the last example.

### Quantified expressions (Ada 2012)

Ada 2012 added `for all` and `for some` expressions:

```ada
--  all elements positive:
if (for all X of Arr => X > 0.0) then ...

--  at least one element negative:
if (for some X of Arr => X < 0.0) then ...

--  for iterating by index:
if (for all I in Arr'Range => Arr (I) >= 0.0) then ...
```

These are logical quantifiers over a range or a collection. They are
particularly useful in contracts, where you can state properties of whole
arrays.

### If expressions and case expressions

In Ada 2012, `if` and `case` can be used as expressions:

```ada
Sign : Integer := (if X > 0 then 1 elsif X < 0 then -1 else 0);

Month_Length : Natural := (case Month is
                              when Jan | Mar | May | Jul | Aug | Oct | Dec => 31,
                              when Apr | Jun | Sep | Nov => 30,
                              when Feb => (if Is_Leap_Year then 29 else 28));
```

Note the required parentheses around expression-form `if` and `case`, to
distinguish them from statement-form. This is a simple feature that saves
a lot of verbosity.

### Conditional assignment

Combined with the above, you can write:

```ada
Result := (if Input >= 0 then Input else -Input);
```

rather than:

```ada
if Input >= 0 then
   Result := Input;
else
   Result := -Input;
end if;
```

### Operators are subprograms

Ada operators are subprograms, and you can overload them like any other
subprogram:

```ada
function "+" (A, B : Vector) return Vector is
   Result : Vector (A'Range);
begin
   for I in A'Range loop
      Result (I) := A (I) + B (I);
   end loop;
   return Result;
end "+";

U : Vector := V + W;   --  calls the user-defined "+"
```

This is how Ada supports numeric abstractions (matrices, complex numbers,
polynomials) with natural syntax, and how the standard library provides
things like `Unbounded_String` concatenation via `&`.

---

## 15. Strings

Strings are one of the more unusual parts of Ada for someone coming from
other languages. Ada has several string types, each with different
properties, and none of them is as ergonomic as a Python `str` or a Rust
`String`. The verbosity is deliberate, and it mostly pays off, but it is a
common stumbling block for new Ada programmers.

### `String` is an array of `Character`

The core string type is defined as:

```ada
type String is array (Positive range <>) of Character;
```

A `String` is an unconstrained array of `Character`, indexed by `Positive`.
This has consequences:

- A `String` variable has a fixed length once it is created. You cannot
  grow or shrink it.
- String literals have the length of the literal:
  `S : String := "hello"` gives `S` the bounds `1 .. 5`.
- String concatenation creates a new string; it does not modify an existing
  one.

```ada
S : String := "hello";
T : String := "world";
U : String := S & ", " & T;   --  U has bounds 1 .. 12, value "hello, world"

--  You cannot do:
--  S := S & "!";
--  because that would change the length of S.

--  You can do:
S2 : String := S & "!";
```

This is fine for strings whose length is known at creation and does not
change. For strings whose length changes during execution, you need
`Unbounded_String`.

### `Unbounded_String`

`Ada.Strings.Unbounded.Unbounded_String` is a variable-length string. It is
implemented on the heap and supports concatenation, modification, and all
the usual string operations.

```ada
with Ada.Strings.Unbounded; use Ada.Strings.Unbounded;

S : Unbounded_String := To_Unbounded_String ("hello");
S := S & ", world";                                       --  works
S := S & "!";                                             --  works
Put_Line (To_String (S));                                 --  convert back to String
```

`To_Unbounded_String` converts a `String` into an `Unbounded_String`.
`To_String` converts back. The `&` operator is overloaded for
`Unbounded_String`. All of this is somewhat verbose compared to Python or
Ruby.

The Ada community's idiom is: use `String` when the length is fixed, use
`Unbounded_String` when it varies, and accept that neither is as ergonomic
as a modern dynamic-language string.

### Wide strings

For Unicode, Ada has:

- `Wide_String` — array of `Wide_Character`, which is 16-bit (UCS-2 / BMP).
- `Wide_Wide_String` — array of `Wide_Wide_Character`, which is 32-bit
  (UCS-4 / full Unicode).

```ada
W : Wide_String      := "héllo";           --  if compiler is wide-string aware
WW : Wide_Wide_String := "emoji demo";      --  handles any Unicode code point
```

There are corresponding unbounded versions
(`Ada.Strings.Wide_Unbounded.Unbounded_Wide_String`, etc.) and a parallel
set of I/O packages (`Ada.Wide_Text_IO`, `Ada.Wide_Wide_Text_IO`).

The Ada Unicode story is thorough but verbose. Modern Ada code for
international text tends to bounce between `Wide_Wide_String` for processing
and UTF-8-encoded `String` for I/O and storage. There is a package
`Ada.Strings.UTF_Encoding` that handles the conversion.

### Why strings feel clunky

Ada strings feel clunky because:

1. The type distinction between `String`, `Unbounded_String`, and
   `Wide_Wide_String` forces you to think about storage and encoding
   explicitly. In Python or Ruby, strings are one thing and the runtime
   handles it. In Ada, you decide.
2. Concatenation produces a new value; you cannot mutate in place with
   `+=` on a `String`.
3. String operations live in packages (`Ada.Strings.Fixed`,
   `Ada.Strings.Unbounded`, `Ada.Strings.Maps`) rather than on the type
   itself, so you have to `with` the right package and remember the
   function name.
4. Case-sensitive string comparison requires picking a comparison function
   and passing it explicitly.

The flip side: Ada string code is transparent about its storage behavior,
which is exactly what you want in a real-time system where allocation
surprises are catastrophic. You can write a program that reads a sensor,
formats a message, and transmits it, and be sure that no hidden allocation
happens — because every allocation in Ada is explicit.

---

## 16. Input and output

Ada I/O is organized into a hierarchy of packages in the `Ada.Text_IO` and
`Ada.Sequential_IO` families. It is usable but predates most modern I/O
idioms and feels clunky by comparison.

### Text I/O

`Ada.Text_IO` is the main package for line- and character-oriented I/O.

```ada
with Ada.Text_IO;
use  Ada.Text_IO;

procedure Hello is
begin
   Put      ("Enter your name: ");
   declare
      Name : constant String := Get_Line;
   begin
      Put_Line ("Hello, " & Name & "!");
   end;
end Hello;
```

`Put` writes without a newline; `Put_Line` writes with. `Get_Line` reads a
line (up to end-of-line or a length limit). `New_Line` writes a blank line.

### Typed I/O

For typed values like integers and floats, you use generic packages that
are instantiated for each type:

```ada
with Ada.Text_IO;
with Ada.Integer_Text_IO;   --  predefined instantiation for Integer
with Ada.Float_Text_IO;     --  predefined instantiation for Float

use Ada.Text_IO, Ada.Integer_Text_IO, Ada.Float_Text_IO;

procedure Main is
   X : Integer;
   Y : Float;
begin
   Put ("Enter an integer: ");  Get (X);
   Put ("Enter a float: ");     Get (Y);
   Put ("Sum = "); Put (Float (X) + Y); New_Line;
end Main;
```

For user-defined types, you instantiate one of the generic I/O packages:

```ada
type Temperature is range -40 .. 120;
package Temp_IO is new Ada.Text_IO.Integer_IO (Temperature);

T : Temperature;
Temp_IO.Get (T);
Temp_IO.Put (T);
```

This is slightly more verbose than `printf("%d\n", x)`, but it is also
strongly typed: you cannot pass a `Float` where a `Temperature` is expected,
and the format is determined by the type, not by a format string.

### Sequential and direct I/O

For binary files, Ada has `Ada.Sequential_IO` and `Ada.Direct_IO`, each of
which is a generic parameterized over the element type:

```ada
type Record_T is record
   ID   : Integer;
   Name : String (1 .. 20);
end record;

with Ada.Sequential_IO;
package Record_IO is new Ada.Sequential_IO (Record_T);

F : Record_IO.File_Type;
R : Record_T;

Record_IO.Open (F, Record_IO.In_File, "data.bin");
while not Record_IO.End_Of_File (F) loop
   Record_IO.Read (F, R);
   --  ...
end loop;
Record_IO.Close (F);
```

This is quite different from C's `fread(&r, sizeof(r), 1, f)`. The typed
approach is safer — you cannot accidentally read the wrong number of bytes
— but it only supports record-structured files, not arbitrary binary blobs.

For unstructured binary I/O, you instantiate `Ada.Sequential_IO` or
`Ada.Direct_IO` with a byte type (e.g., `type Byte is mod 256;`) and work
at that level, or you use the lower-level `Ada.Streams.Stream_IO`.

### Command-line arguments

```ada
with Ada.Command_Line; use Ada.Command_Line;
with Ada.Text_IO;      use Ada.Text_IO;

procedure Show_Args is
begin
   for I in 1 .. Argument_Count loop
      Put_Line (Integer'Image (I) & ": " & Argument (I));
   end loop;
end Show_Args;
```

`Argument_Count` is the number of arguments (not counting the program
name), and `Argument (I)` gives the `I`th argument as a `String`.

### Why Ada I/O feels clunky

Ada I/O predates modern formatting idioms (no format strings, no
variadics, no `println!` macro). Every type has its own generic
instantiation, and the convention of passing format parameters (field
width, base) as optional parameters to `Put` is workable but verbose.
There is no built-in JSON, no YAML, no string interpolation. For modern
data interchange you reach for third-party libraries (e.g., GNATColl.JSON).

This does not make Ada I/O unusable — it has been used for decades for
real work — but it does not have the quality-of-life features a modern
language user expects. It is one of the areas where Ada shows its age, and
the community knows it.

---

## 17. Numerics

Ada is taken unusually seriously in scientific and financial computing
despite its lack of trendiness, mostly because of fixed-point arithmetic,
the Numerics Annex, and a long tradition of rigorous numeric practice.

### Fixed-point recap

Fixed-point was covered in Section 3. It is worth emphasizing here that
the existence of first-class fixed-point types is a distinguishing feature:
almost no other mainstream language has it.

**Ordinary fixed-point** (`delta X range L .. H`) uses a binary scale
factor. It is used for signal processing, control systems, and anywhere
you want scaled-integer arithmetic with deterministic behavior.

**Decimal fixed-point** (`delta X digits N`) uses a decimal scale factor.
It is used for money, where 0.10 + 0.20 must equal exactly 0.30 and not
0.30000000000000004.

Both kinds of fixed-point have exact addition and subtraction, predictable
rounding for multiplication and division, and no rounding surprises for
values that fit the scale.

### The Numerics Annex (Annex G)

The Ada reference manual has several optional annexes that define
specialized functionality. Annex G is the Numerics Annex, and it specifies
rigorous behavior for the mathematical libraries:

- **Elementary functions** (`Ada.Numerics.Generic_Elementary_Functions`):
  `Sqrt`, `Sin`, `Cos`, `Tan`, `Exp`, `Log`, etc. These are generic over a
  floating-point type.
- **Complex numbers** (`Ada.Numerics.Generic_Complex_Types`): complex
  arithmetic, including overloaded operators, and `Ada.Numerics.Generic_Complex_Elementary_Functions`
  for complex transcendentals.
- **Random number generation** (`Ada.Numerics.Float_Random` and
  `Ada.Numerics.Discrete_Random`).

The important thing about the Numerics Annex is that it specifies the
**accuracy** of these functions, not just their interface. A conforming
implementation must produce results within a defined error bound. This
matters for scientific code where reproducibility across platforms is
critical.

```ada
with Ada.Numerics;
with Ada.Numerics.Elementary_Functions;
use  Ada.Numerics.Elementary_Functions;

declare
   Pi  : constant := Ada.Numerics.Pi;   --  universal real constant
   X   : Float    := Sin (Pi / 2.0);    --  should be 1.0 to high precision
begin
   ...
end;
```

### Random numbers

```ada
with Ada.Numerics.Float_Random;
use  Ada.Numerics.Float_Random;

G : Generator;
Reset (G);       --  seed from time or other source

for I in 1 .. 10 loop
   declare
      X : Float := Random (G);
   begin
      Put_Line (Float'Image (X));
   end;
end loop;
```

For discrete distributions over an enum or integer range, use
`Ada.Numerics.Discrete_Random`:

```ada
type Die_Roll is range 1 .. 6;
package Die_Random is new Ada.Numerics.Discrete_Random (Die_Roll);
use Die_Random;

G : Generator;
R : Die_Roll;
Reset (G);
R := Random (G);
```

### Why Ada is credible for scientific and financial computing

Three reasons:

1. **Fixed-point arithmetic.** For money and for control systems, this is
   the right primitive. The alternative is integer arithmetic with
   programmer-tracked scale factors, which is error-prone, or floating-point,
   which has representation errors.
2. **Numerics Annex accuracy guarantees.** Scientific code must be
   reproducible and within known error bounds. Ada specifies this; most
   languages do not.
3. **Strong typing for quantities.** In a scientific or financial
   computation, you have many quantities with different units (meters,
   seconds, dollars, percentages) and the cost of mixing them is high.
   Ada lets you give each its own type.

Ada is not as popular as Python + NumPy or Julia for scientific work,
because those languages have a richer library ecosystem and faster
prototyping. But for systems where correctness under all inputs matters
more than exploratory speed — including real-time trading systems,
hardware-in-the-loop simulations, and safety-critical control loops — Ada
remains a serious choice.

---

## 18. Representation clauses and low-level programming

Ada's reputation as a "high-level" language is misleading. It is also a
very capable systems language, with fine control over data representation,
alignment, addresses, and memory-mapped I/O.

### Size clauses

You can specify the size of a type in bits:

```ada
type Byte is mod 256;
for Byte'Size use 8;

type Status is (Ok, Error, Warning, Critical);
for Status'Size use 2;   --  4 values fit in 2 bits
```

The compiler verifies that the requested size is large enough. If you try
`for Byte'Size use 4;` the compiler refuses (256 values do not fit in 4
bits).

### Alignment clauses

```ada
type Cache_Line is record
   Data : array (1 .. 64) of Byte;
end record;
for Cache_Line'Alignment use 64;
```

### Address clauses

You can fix the address of a variable, which is how you talk to
memory-mapped hardware:

```ada
with System;
use  System;

UART_Data : Byte
   with Address  => System'To_Address (16#FFFF_4000#),
        Volatile => True;
```

The `Address` aspect says "this variable lives at the specified physical
address." `Volatile` tells the compiler not to cache or reorder accesses.
Now `UART_Data := 'A';` literally writes the byte `'A'` to memory address
`0xFFFF_4000`, which, on your board, happens to be the UART data register.

Combined with record representation clauses (covered in Section 6), this
is how you write a device driver in Ada:

```ada
type UART_Control is record
   Enable     : Boolean;
   Tx_Ready   : Boolean;
   Rx_Ready   : Boolean;
   Parity     : Natural range 0 .. 3;
   Baud_Sel   : Natural range 0 .. 15;
end record;

for UART_Control use record
   Enable   at 0 range 0 .. 0;
   Tx_Ready at 0 range 1 .. 1;
   Rx_Ready at 0 range 2 .. 2;
   Parity   at 0 range 3 .. 4;
   Baud_Sel at 0 range 5 .. 8;
end record;

for UART_Control'Size use 16;

UART_CR : UART_Control
   with Address  => System'To_Address (16#FFFF_4004#),
        Volatile => True;

--  Now you can write:
UART_CR.Enable := True;
if UART_CR.Tx_Ready then
   UART_Data := 'A';
end if;
```

The compiler generates the correct bit-field accesses for the control
register and the correct byte access for the data register, and honors the
volatility requirement. In C, this would be a forest of `#define`s and
masks; in Ada, it reads like plain code and is harder to get wrong.

### `pragma Volatile`, `pragma Atomic`

`pragma Volatile` (or the `Volatile` aspect) tells the compiler that the
variable may change outside the program's knowledge (e.g., by hardware or
another thread) and that accesses must not be cached or reordered.

`pragma Atomic` (or the `Atomic` aspect) says the variable must be accessed
atomically — reads and writes are indivisible. This is weaker than a mutex
but stronger than volatile; it is the right choice for lock-free flag
variables and for hardware registers that must be written in a single
transaction.

```ada
Shutdown_Requested : Boolean := False
   with Atomic;
```

### Machine-code insertion

Ada has a standard way to insert machine code, via the `Machine_Code`
package. It is rarely used, but when you need it (cache control,
supervisor-mode instructions, processor-specific operations), it is there.

### Why Ada is a serious systems language

Between record representation clauses, address clauses, atomic and
volatile aspects, modular types, storage pools, fixed-point arithmetic,
and the ability to disable runtime checks in critical sections, Ada can do
everything C can do at the hardware level, and it can do most of it more
safely.

The reason Ada is not the dominant systems language is mostly historical
and social, not technical. C won the embedded market because it was free,
small, and came with Unix. Ada cost money (for decades), the toolchains
were large, and the language had a reputation for bureaucracy. All of that
has shifted — GNAT is free, GCC includes Ada, and modern Ada is
streamlined — but the social inertia of C is enormous.

For a greenfield safety-critical project today, Ada is a rational choice.
For most other projects, Rust has taken the "safer systems language" niche
Ada used to occupy, because Rust combines Ada-style checking with
C-familiar syntax and zero-cost abstractions. The two languages are closer
in spirit than either is to C, and they tend to attract similar kinds of
programmers.

---

## 19. The mental model

If you have read this far, you have seen the mechanisms. Here is the
unifying mental model that ties them together.

### Ada wants you to say what you mean precisely

The Ada insight is that most bugs come from ambiguity — from the programmer
knowing what they meant but not writing it down. If you know that a
temperature is always between -40 and 120, write it down. If you know that
a pointer is never null after initialization, write it down. If you know
that a function requires its input to be sorted, write it down. The
compiler will then enforce what you said, and the reader will understand
without having to reconstruct your intent from the code.

This is why Ada looks verbose. Every piece of verbosity is an assertion
about the problem: "this is an age, which is a natural number up to 150,"
"this buffer is at most 1024 bytes," "this function only works on
positive inputs." Each assertion is a potential bug caught at compile time.

### It rewards careful design with compile-time errors

If you have specified the problem well, the compiler will find the bugs
for you. Type errors catch unit mismatches. Range constraints catch
off-by-ones. Discriminated records catch unhandled variants. Contracts
catch precondition violations at every call site. The more precisely you
specify, the more work the compiler does for you.

### It penalizes quick-and-dirty scripting with verbosity

Conversely, if you are trying to bang out a 50-line script, Ada is the
wrong tool. Every variable needs a type. Every subprogram needs a spec.
Every package needs a file pair. The overhead of specification is
meaningful for small programs and negligible for large ones. Ada is
optimized for large programs that must not fail.

### The trade-off is explicit and intentional

Ada's designers knew they were trading writability for readability,
prototyping speed for long-term maintenance, expressiveness for
predictability. They made the trade because they were designing for
real-time embedded systems, avionics, and rail signaling. If those are
your problems, the trade is a gift. If your problem is "I want to scrape a
web page," the trade is a tax.

### For programs that must not fail, Ada's approach is hard to beat

Forty years in, Ada is still used in the most demanding applications.
Boeing 777. Eurofighter Typhoon. Paris Metro Line 14. LM-Aegis. Ariane 6
(this time with a better conversion strategy). These are not legacy
systems; they are the ones running today and being updated. The cost of a
bug in these systems is measured in lives or in billions of dollars, and
Ada's up-front specification burden is cheap by comparison.

The slogan I like: **Ada is for programs you are betting your life on.**

---

## 20. Gallery of idiomatic Ada programs

This final section collects a set of small, complete programs that
illustrate the features above in combination. Each is compilable with GNAT.

### 20.1 Fibonacci

The obligatory. Here is Fibonacci in Ada, contrasted with the C version.

```c
/* C */
#include <stdio.h>

long fib(int n) {
    if (n < 2) return n;
    return fib(n-1) + fib(n-2);
}

int main(void) {
    for (int i = 0; i < 10; i++) {
        printf("%ld\n", fib(i));
    }
    return 0;
}
```

```ada
--  Ada
with Ada.Text_IO;  use Ada.Text_IO;

procedure Fib_Demo is

   function Fib (N : Natural) return Natural is
   begin
      if N < 2 then
         return N;
      else
         return Fib (N - 1) + Fib (N - 2);
      end if;
   end Fib;

begin
   for I in 0 .. 9 loop
      Put_Line (Natural'Image (Fib (I)));
   end loop;
end Fib_Demo;
```

Differences:

- The parameter is `Natural`, which guarantees non-negative at the type
  level. The C version takes `int` and trusts the caller.
- The return type is `Natural`. The compiler will check for underflow.
- The loop uses `for I in 0 .. 9`. No loop variable declaration, no
  increment, no termination condition. The range says it all.
- `Natural'Image` converts to a string with a leading space (for sign). You
  would trim it for production output.

For a real Fibonacci, you would use an iterative version to avoid the
exponential time, and probably give it a contract:

```ada
function Fib (N : Natural) return Natural
   with Post => Fib'Result >= N or Fib'Result = 0;
--  (not actually true for small N but illustrates the idea)

function Fib (N : Natural) return Natural is
   A, B, T : Natural := 0;
begin
   if N = 0 then
      return 0;
   end if;
   A := 0; B := 1;
   for I in 2 .. N loop
      T := A + B;
      A := B;
      B := T;
   end loop;
   return B;
end Fib;
```

### 20.2 A bounded stack with a generic parameter

```ada
--  bounded_stack.ads
generic
   type Element is private;
   Capacity : Positive;
package Bounded_Stack is

   type T is private;

   Stack_Empty : exception;
   Stack_Full  : exception;

   procedure Push (S : in out T; X : Element)
      with Pre => not Is_Full (S);

   procedure Pop (S : in out T; X : out Element)
      with Pre => not Is_Empty (S);

   function Top (S : T) return Element
      with Pre => not Is_Empty (S);

   function Is_Empty (S : T) return Boolean;
   function Is_Full  (S : T) return Boolean;
   function Size     (S : T) return Natural;

private

   type Storage is array (1 .. Capacity) of Element;

   type T is record
      Data : Storage;
      Top  : Natural := 0;
   end record;

end Bounded_Stack;
```

```ada
--  bounded_stack.adb
package body Bounded_Stack is

   procedure Push (S : in out T; X : Element) is
   begin
      if S.Top = Capacity then
         raise Stack_Full;
      end if;
      S.Top := S.Top + 1;
      S.Data (S.Top) := X;
   end Push;

   procedure Pop (S : in out T; X : out Element) is
   begin
      if S.Top = 0 then
         raise Stack_Empty;
      end if;
      X := S.Data (S.Top);
      S.Top := S.Top - 1;
   end Pop;

   function Top (S : T) return Element is
   begin
      if S.Top = 0 then
         raise Stack_Empty;
      end if;
      return S.Data (S.Top);
   end Top;

   function Is_Empty (S : T) return Boolean is (S.Top = 0);
   function Is_Full  (S : T) return Boolean is (S.Top = Capacity);
   function Size     (S : T) return Natural is (S.Top);

end Bounded_Stack;
```

```ada
--  main.adb
with Ada.Text_IO; use Ada.Text_IO;
with Bounded_Stack;

procedure Main is
   package Int_Stack is new Bounded_Stack (Element => Integer, Capacity => 16);
   use Int_Stack;

   S : T;
   X : Integer;
begin
   for I in 1 .. 5 loop
      Push (S, I * I);
   end loop;

   while not Is_Empty (S) loop
      Pop (S, X);
      Put_Line (Integer'Image (X));
   end loop;
end Main;
```

This is a complete, working, statically-allocated stack with:
- Generic parameterization over element type and capacity.
- A private record type (clients cannot touch the internals).
- A `private` operation set through a clean interface.
- Preconditions on the stack operations.
- Named exceptions for error cases.
- Expression functions for the boolean queries.
- Zero heap allocation.

### 20.3 A discriminated record for a shape hierarchy

```ada
with Ada.Text_IO; use Ada.Text_IO;

procedure Shape_Demo is

   Pi : constant := 3.14159_26535_89793;

   type Shape_Kind is (Circle, Rectangle, Triangle);

   type Shape (Kind : Shape_Kind) is record
      case Kind is
         when Circle =>
            Radius : Float;
         when Rectangle =>
            Width, Height : Float;
         when Triangle =>
            Base, Altitude : Float;
      end case;
   end record;

   function Area (S : Shape) return Float is
   begin
      case S.Kind is
         when Circle =>
            return Pi * S.Radius * S.Radius;
         when Rectangle =>
            return S.Width * S.Height;
         when Triangle =>
            return 0.5 * S.Base * S.Altitude;
      end case;
   end Area;

   procedure Print (S : Shape) is
   begin
      case S.Kind is
         when Circle =>
            Put_Line ("Circle r="  & Float'Image (S.Radius) &
                      " A="        & Float'Image (Area (S)));
         when Rectangle =>
            Put_Line ("Rect w="    & Float'Image (S.Width) &
                      " h="        & Float'Image (S.Height) &
                      " A="        & Float'Image (Area (S)));
         when Triangle =>
            Put_Line ("Tri b="     & Float'Image (S.Base) &
                      " h="        & Float'Image (S.Altitude) &
                      " A="        & Float'Image (Area (S)));
      end case;
   end Print;

   C : Shape := (Kind => Circle,    Radius => 5.0);
   R : Shape := (Kind => Rectangle, Width => 3.0, Height => 4.0);
   T : Shape := (Kind => Triangle,  Base => 6.0, Altitude => 2.0);

begin
   Print (C);
   Print (R);
   Print (T);
end Shape_Demo;
```

This uses a discriminated record instead of tagged types. The compiler
verifies that every `case` handles every `Shape_Kind`; if you add a new
variant (say, `Pentagon`) later, every `case` in the codebase becomes a
compile error until updated. This is arguably more maintainable than the
OOP version, especially for fixed, closed hierarchies.

### 20.4 A small real-time-ish sensor reading with range checks

```ada
with Ada.Text_IO; use Ada.Text_IO;

procedure Sensor_Demo is

   type Millivolts is delta 0.001 range -5000.0 .. 5000.0;
   type Celsius    is delta 0.01  range -273.15 .. 1000.0;

   Offset : constant Millivolts :=  0.500;   --  500 mV offset
   Gain   : constant            := 100.0;    --  100 mV/°C

   function Read_Raw return Millivolts is
      --  simulate a hardware read; in real code this would hit a register
   begin
      return 2.500;   --  2.5 V
   end Read_Raw;

   function To_Celsius (V : Millivolts) return Celsius is
   begin
      return Celsius ((Float (V) - Float (Offset)) / Gain);
      --  This conversion might raise Constraint_Error if the temperature
      --  is outside -273.15 .. 1000.0. That is intentional: an
      --  out-of-range reading means the sensor is broken, and we want
      --  the caller to know.
   end To_Celsius;

begin
   declare
      V : constant Millivolts := Read_Raw;
      T : Celsius;
   begin
      T := To_Celsius (V);
      Put_Line ("Temperature: " & Celsius'Image (T) & " C");
   exception
      when Constraint_Error =>
         Put_Line ("Sensor out of range, shutting down.");
   end;
end Sensor_Demo;
```

Notes:

- Two fixed-point types for the two physical quantities, each with an
  explicit range and resolution.
- A named constant for the offset and gain (the gain is a universal
  constant, because it is a dimensional number).
- The conversion from millivolts to Celsius is explicit — no silent
  coercion — and includes range checking.
- The caller catches `Constraint_Error` and treats it as a fault
  condition. In a real system you would have a more graceful recovery,
  but the pattern is clear.

### 20.5 A contract-carrying function

```ada
package Integer_Math is

   function GCD (A, B : Natural) return Natural
      with Pre  => A > 0 or B > 0,
           Post => GCD'Result > 0
                   and then A mod GCD'Result = 0
                   and then B mod GCD'Result = 0;

end Integer_Math;
```

```ada
package body Integer_Math is

   function GCD (A, B : Natural) return Natural is
      X : Natural := A;
      Y : Natural := B;
      T : Natural;
   begin
      while Y /= 0 loop
         T := Y;
         Y := X mod Y;
         X := T;
      end loop;
      return X;
   end GCD;

end Integer_Math;
```

The precondition rules out `GCD (0, 0)`, which is mathematically undefined.
The postcondition says the result is positive and divides both inputs —
which is the mathematical definition of a common divisor. (A full spec
would also say it is the greatest such, but that is harder to state
without introducing quantifiers.)

At runtime, the contracts are checked: calling `GCD (0, 0)` raises
`Assertion_Error`. Under SPARK, the prover tries to verify that the
postcondition follows from the body — for a function this simple, it can.

### 20.6 String manipulation with Ada.Strings.Fixed

Ada has three string-manipulation packages for its three string types:
`Ada.Strings.Fixed`, `Ada.Strings.Bounded`, and `Ada.Strings.Unbounded`.
Here is a small program that does some classic string operations on a
fixed-length `String`:

```ada
with Ada.Text_IO;          use Ada.Text_IO;
with Ada.Strings;          use Ada.Strings;
with Ada.Strings.Fixed;    use Ada.Strings.Fixed;
with Ada.Strings.Maps.Constants;

procedure String_Demo is
   S       : constant String := "  Hello, World!  ";
   Trimmed : constant String := Trim (S, Both);
   Upper   : constant String := Translate
                (Trimmed, Ada.Strings.Maps.Constants.Upper_Case_Map);
   Count_L : constant Natural := Count (Trimmed, "l");
begin
   Put_Line ("Original: [" & S & "]");
   Put_Line ("Trimmed:  [" & Trimmed & "]");
   Put_Line ("Upper:    [" & Upper & "]");
   Put_Line ("Count of 'l': " & Natural'Image (Count_L));
end String_Demo;
```

This is more verbose than Python's `s.strip().upper()`, but it is
predictable, allocation-free, and every operation is typed. `Trim` takes a
string and a `Trim_End` parameter (`Left`, `Right`, or `Both`) and returns
a new string (in Ada 95+ these strings are returned by value, which used
to require secondary-stack support but is now standard). `Translate`
applies a character map. `Count` counts occurrences.

The `Unbounded_String` equivalent is in `Ada.Strings.Unbounded`:

```ada
with Ada.Strings.Unbounded; use Ada.Strings.Unbounded;
with Ada.Text_IO;           use Ada.Text_IO;

procedure Builder is
   S : Unbounded_String := Null_Unbounded_String;
begin
   for I in 1 .. 5 loop
      Append (S, "line " & Integer'Image (I) & ASCII.LF);
   end loop;
   Put (To_String (S));
end Builder;
```

### 20.7 Generic map over an array

As a closing example, here is a generic `Map` procedure — a higher-order
algorithm that applies a function to every element of an array.

```ada
generic
   type Index_Type is (<>);                       --  any discrete type
   type Element is private;
   type Array_Type is array (Index_Type range <>) of Element;
   with function F (X : Element) return Element;
procedure Generic_Map (A : in out Array_Type);
```

```ada
procedure Generic_Map (A : in out Array_Type) is
begin
   for I in A'Range loop
      A (I) := F (A (I));
   end loop;
end Generic_Map;
```

```ada
with Generic_Map;

procedure Map_Demo is
   type Index is range 1 .. 5;
   type Int_Array is array (Index) of Integer;

   function Square (X : Integer) return Integer is (X * X);

   procedure Square_All is new Generic_Map
      (Index_Type => Index,
       Element    => Integer,
       Array_Type => Int_Array,
       F          => Square);

   A : Int_Array := (1, 2, 3, 4, 5);
begin
   Square_All (A);
   --  A is now (1, 4, 9, 16, 25)
end Map_Demo;
```

This is Ada's equivalent of a higher-order function. The generic takes an
index type, an element type, an array type parameterized over those, and
a function `F` over the element type. At instantiation, the client
supplies all four. The result is a specialized procedure that maps `F`
over the array.

The verbosity is real — four formal parameters for something that would
be one line in Haskell — but the result is a fully typed, statically
dispatched, zero-allocation operation that the compiler can inline. For
the kinds of systems Ada cares about, that trade is the right one.

---

## Closing thoughts

Ada has a reputation as a verbose, bureaucratic, old-fashioned language,
and some of that reputation is earned: the syntax is longer than C's, the
I/O is clunkier than Python's, the OOP model feels bolted on, and the
culture around it has been genuinely hidebound at times. But underneath
the reputation is a carefully designed language whose core principles —
readability over writability, explicit over implicit, compile-time over
runtime, specification as first-class code — have aged remarkably well.

The features this document has covered — strong typing, subtypes, arrays
with bounds, discriminated records, access types with accessibility
checks, packages with spec/body split, generics with declaration-time
checking, contracts, representation clauses — are all in service of a
single goal: moving errors from runtime to compile time, and making the
ones that remain recoverable. Every other modern language that cares
about correctness — Rust, SPARK, Haskell, OCaml, Idris — owes something
to Ada's ideas, even if their creators would not always credit them.

If you are writing software where a bug can kill someone, crash an
airplane, or lose a billion dollars, Ada is a serious choice and you
should learn it. If you are writing software where a bug means a stack
trace in the console, you have other options. The language was not
designed for you, and using it would be like using a surgical scalpel to
spread butter. That is fine. Pick the right tool for the job.

The concurrency thread of this research series picks up where this one
leaves off: tasks, protected objects, rendezvous, the Ravenscar profile,
and the reason Ada's concurrency model is still a benchmark for
safety-critical real-time systems. The safety-critical thread covers
SPARK, DO-178C, and the industrial practices that make Ada the language
of choice for high-integrity systems. The history thread tells the story
of how a language designed by committee in the 1970s became the working
tool of defense and aerospace for half a century.

Read them in whatever order is useful. The one truth they all converge
on: Ada rewards the programmer who is willing to say what they mean.

---

## Sources

- *Ada 2012 Reference Manual* (ISO/IEC 8652:2012), especially:
  - Chapter 2 (lexical structure and reserved words)
  - Chapter 3 (types and subtypes)
  - Chapter 4 (names and expressions)
  - Chapter 5 (statements)
  - Chapter 6 (subprograms)
  - Chapter 7 (packages and private types)
  - Chapter 11 (exceptions)
  - Chapter 12 (generics)
  - Chapter 13 (representation clauses and implementation-dependent features)
  - Annex G (Numerics)
- John Barnes, *Programming in Ada 2012* (Cambridge University Press, 2014).
- S. Tucker Taft and Robert A. Duff, *Ada 95 Reference Manual: Language and
  Standard Libraries*, including the accompanying Rationale document.
- AdaCore, *learn.adacore.com*: the "Introduction to Ada" and "Advanced
  Journey with Ada" courses.
- Ben Brosgol, various tutorial papers and SIGAda presentations.
- Jean Ichbiah et al., *Rationale for the Design of the Ada Programming
  Language* (original 1979 Rationale, revised in subsequent editions).

---

## Study Guide

This document is a reference for the *sequential* language core. Ada's
concurrency is covered in `concurrency.md`; the history in `history-origins.md`;
safety-critical and SPARK in `safety-spark-impl.md`. Read this file when you
want to understand how the language builds up from scalars to packages to
generics.

### Prerequisites

- A rough familiarity with one strongly-typed language (C++, Rust, OCaml, or
  even Pascal works fine). Coming from Python or JavaScript you will spend
  the first week re-learning what a type actually is.
- GNAT installed (`gnatmake --version`). If you followed the concurrency
  study guide you already have this.
- A text editor with some Ada mode. `M-x ada-mode` in Emacs, the Ada plugin
  for VS Code (`AdaCore.ada`), or the GNAT Studio IDE.

### Recommended reading order

Do not read Sections 1-20 in order. Read them in this order:

1. Section 1 — design philosophy. One pass, slowly. You need the mental
   model before the syntax.
2. Section 2 — lexical and program layout. Just enough to recognize a
   well-formed Ada file.
3. Section 8 — packages. This is the organizing principle of the whole
   language; without it, the rest of the file reads like a bag of features.
4. Sections 3, 4, 5, 6, 9 — scalars, subtypes, arrays, records, subprograms.
   The type system and the callable units. These are the bread-and-butter.
5. Section 7 — access types. Read last among the data sections, because
   Ada's access types are deliberately awkward and you should understand
   what they are replacing (raw pointers).
6. Section 10 — generics. This is where the type system pays off.
7. Section 12 — object-oriented programming. Ada's OO model is small and
   well-contained; read it after generics, not before.
8. Section 13 — contracts. Ada 2012 preconditions, postconditions, type
   invariants. Read this before you read the SPARK material in
   `safety-spark-impl.md`.
9. Sections 11, 14, 15, 16, 17, 18 — exceptions, expressions, strings, I/O,
   numerics, representation clauses. Reference. Read when you need them.
10. Sections 19, 20 — mental model and idiomatic programs. Re-read at the
    end, now that the features they use have context.

### Key concepts to internalize

1. **Types are distinct even when they look alike.** `type Meters is new
   Integer;` and `type Seconds is new Integer;` are not interchangeable.
   The compiler will stop you from adding meters to seconds. This is
   Ada's single most powerful error-prevention feature, and it costs you
   exactly one character (`is new Integer` versus `is Integer`).
2. **Subtypes refine; types distinguish.** `subtype Natural is Integer
   range 0 .. Integer'Last;` adds a constraint. `type Age is new Integer
   range 0 .. 150;` creates a whole new type. Use subtypes for
   constraints; use derived types for semantic distinctions.
3. **Packages, not classes, are the unit of encapsulation.** A package
   has a specification (`.ads`) and a body (`.adb`). The spec is the
   contract; the body is the implementation. Hidden private types live
   in the private part of the spec. This predates classes by decades
   and is cleaner for many designs.
4. **Generics are templates checked at instantiation.** Generic
   parameters are declared explicitly (`with function "<" (L, R :
   Element) return Boolean;`). The compiler checks that actuals match.
   You pay for expressiveness at the declaration site and get precise
   error messages at the instantiation site.
5. **Contracts are first-class.** `pragma Pre => X > 0;` and `pragma Post
   => Result = X * X;` are parts of the subprogram's interface, not
   afterthoughts. `gnatprove` reads them statically; at runtime, they
   compile to assertions you can turn on or off per build.
6. **Exceptions are for exceptional situations.** Ada's exception model
   is closer to Lisp's condition system or Java's checked exceptions
   than to C++ or Python unchecked exceptions. Use exceptions for
   *errors*, not for control flow.
7. **The `'` attribute syntax gives you introspection on types.**
   `Integer'First`, `Integer'Last`, `My_Array'Length`, `T'Size`.
   Attributes are read-only queries; they replace the ad-hoc functions
   other languages bolt on.

### 1-week plan (introductory)

- Day 1: Sections 1, 2. Install GNAT. Write a Hello World. Add a package.
- Day 2: Section 3 (scalars). Write a program that defines three
  incompatible derived types and convinces the compiler to reject mixing
  them.
- Day 3: Sections 5, 6 (arrays, records). Build a stack as an array, a
  record for a point in 3D, and a variant record for a shape that can
  be a circle or a rectangle.
- Day 4: Section 8 (packages). Re-organize yesterday's code into a
  package with a public spec and a private implementation.
- Day 5: Section 9 (subprograms). Add procedures and functions with `in`,
  `out`, and `in out` modes. Notice how `out` parameters give you
  multi-return without tuples.
- Day 6: Section 10 (generics). Make your stack generic over element
  type. Instantiate it for Integer and Float.
- Day 7: Section 13 (contracts). Add `Pre` and `Post` contracts to your
  stack's `Push`, `Pop`, and `Top` operations. Run `gnatprove` on it.

### 1-month plan

- Week 1: the 1-week plan.
- Week 2: John Barnes, *Programming in Ada 2012*, Chapters 1-12. Work
  every exercise.
- Week 3: Rewrite a medium project you know in another language into
  Ada. A markdown-to-HTML converter is a good size: it exercises
  strings, I/O, records, procedures, and a bit of state.
- Week 4: Read `concurrency.md` and bolt a tasking layer onto last
  week's project (e.g. parallel file processing).

### Glossary

- **Subtype** — a refinement of an existing type with a constraint.
  Assignable both ways with the parent type.
- **Derived type** — a new type built from an existing one. Not
  assignable with the parent without an explicit conversion.
- **Tagged type** — a type that can have children in a type hierarchy.
  Ada's equivalent of a non-final class.
- **Package** — the unit of namespace and encapsulation. Has a spec and
  a body.
- **Private part** — the section of a package spec that holds
  implementation details visible only to child packages.
- **Generic** — a parameterized module instantiated to produce a concrete
  package or subprogram.
- **Contract** — a `Pre`, `Post`, `Type_Invariant`, or
  `Subtype_Predicate` attached to a subprogram or type.
- **Pragma** — a directive to the compiler. `pragma Assert`, `pragma
  Inline`, `pragma Priority`, etc.
- **Aspect** — the Ada 2012 alternative to pragmas, attached with
  `with` after a declaration.

---

## Programming Examples

### Example 1: Distinct types that prevent a Mars Climate Orbiter bug

```ada
-- File: units.adb
-- Build: gnatmake units.adb
-- Demonstrates strong type distinction.

with Ada.Text_IO;

procedure Units is
   type Meters  is new Float;
   type Feet    is new Float;

   function To_Meters (F : Feet) return Meters is
     (Meters (Float (F) * 0.3048));

   Distance_Ft : Feet   := 100.0;
   Distance_M  : Meters := To_Meters (Distance_Ft);
begin
   Ada.Text_IO.Put_Line ("100 ft =" & Meters'Image (Distance_M) & " m");
   -- The next line is a compile error; uncomment and try it:
   -- Distance_M := Distance_M + Distance_Ft;
end Units;
```

Notice the commented-out line. Uncomment it and `gnatmake` refuses to
build. This is the Mars Climate Orbiter failure prevented by two
characters: `is new` instead of `is`. That 1999 accident lost a $125M
probe because pound-force-seconds and newton-seconds were silently
mixed. Ada code cannot silently mix them.

### Example 2: A generic bounded stack

```ada
-- File: stacks.ads  (the package spec)
generic
   type Element is private;
   Max : Positive;
package Stacks is
   type Stack is private;

   procedure Push (S : in out Stack; E : Element)
     with Pre => not Is_Full (S);

   procedure Pop (S : in out Stack; E : out Element)
     with Pre => not Is_Empty (S);

   function  Top (S : Stack) return Element
     with Pre => not Is_Empty (S);

   function  Is_Empty (S : Stack) return Boolean;
   function  Is_Full  (S : Stack) return Boolean;

private
   type Store is array (1 .. Max) of Element;
   type Stack is record
      Items : Store;
      Count : Natural := 0;
   end record;
end Stacks;
```

```ada
-- File: stacks.adb  (the body)
package body Stacks is
   procedure Push (S : in out Stack; E : Element) is
   begin
      S.Count := S.Count + 1;
      S.Items (S.Count) := E;
   end Push;

   procedure Pop (S : in out Stack; E : out Element) is
   begin
      E := S.Items (S.Count);
      S.Count := S.Count - 1;
   end Pop;

   function Top (S : Stack) return Element is (S.Items (S.Count));
   function Is_Empty (S : Stack) return Boolean is (S.Count = 0);
   function Is_Full  (S : Stack) return Boolean is (S.Count = Max);
end Stacks;
```

```ada
-- File: use_stacks.adb  (a client that instantiates the generic)
with Stacks;
with Ada.Text_IO;

procedure Use_Stacks is
   package Int_Stack is new Stacks (Element => Integer, Max => 10);
   use Int_Stack;

   S : Stack;
   X : Integer;
begin
   Push (S, 42);
   Push (S, 7);
   Pop  (S, X);
   Ada.Text_IO.Put_Line ("Popped" & Integer'Image (X));
end Use_Stacks;
```

What to notice: the spec is the contract; the body is the
implementation; the client sees only the spec plus whatever is not in
the `private` part. `Push` and `Pop` carry preconditions that
`gnatprove` can discharge statically.

### Example 3: A variant record

```ada
-- File: shapes.adb
with Ada.Text_IO;
with Ada.Numerics;

procedure Shapes is
   type Kind is (Circle, Rectangle);

   type Shape (K : Kind) is record
      case K is
         when Circle =>
            Radius : Float;
         when Rectangle =>
            Width, Height : Float;
      end case;
   end record;

   function Area (S : Shape) return Float is
   begin
      case S.K is
         when Circle    => return Ada.Numerics.Pi * S.Radius ** 2;
         when Rectangle => return S.Width * S.Height;
      end case;
   end Area;

   C : constant Shape := (K => Circle,    Radius => 3.0);
   R : constant Shape := (K => Rectangle, Width  => 4.0, Height => 5.0);
begin
   Ada.Text_IO.Put_Line ("Circle area    =" & Float'Image (Area (C)));
   Ada.Text_IO.Put_Line ("Rectangle area =" & Float'Image (Area (R)));
end Shapes;
```

This is Ada's sum type. It is older and more verbose than Rust's `enum`
or OCaml's variants, but the semantics are the same: a tagged union
with exhaustive case matching and compile-time checks that you covered
every alternative.

### Example 4: A package with a private type

```ada
-- File: counter.ads
package Counter is
   type T is private;

   procedure Reset (C : out T);
   procedure Tick  (C : in out T);
   function  Value (C : T) return Natural;

private
   type T is record
      N : Natural := 0;
   end record;
end Counter;
```

```ada
-- File: counter.adb
package body Counter is
   procedure Reset (C : out T) is
   begin
      C := (N => 0);
   end Reset;

   procedure Tick (C : in out T) is
   begin
      C.N := C.N + 1;
   end Tick;

   function Value (C : T) return Natural is (C.N);
end Counter;
```

A client sees only `T`, `Reset`, `Tick`, `Value`. The fact that `T` is
a record with an `N : Natural` field is invisible. Replace the record
with anything more sophisticated (a bignum, a thread-local counter, an
mmap'd file) without touching any client.

---

## DIY & TRY

### DIY 1 — Prove a stack invariant

Take the generic stack from Example 2. Add this invariant to the spec:

```ada
type Stack is private
  with Type_Invariant => Is_Valid (Stack);

function Is_Valid (S : Stack) return Boolean;
```

Define `Is_Valid` in the private part as `S.Count in 0 .. Max`. Run
`gnatprove --level=2 stacks.ads` and observe that it discharges every
verification condition automatically. You have just proved, with zero
manual proof work, that `Push` cannot overflow and `Pop` cannot
underflow. This is what Ada 2012 contracts buy you.

### DIY 2 — Build a contract-protected calculator

Write a package `Calc` with the signatures:

```ada
function Divide (A, B : Float) return Float
  with Pre => B /= 0.0;

function Sqrt (X : Float) return Float
  with Pre  => X >= 0.0,
       Post => Sqrt'Result * Sqrt'Result in
               X - 0.0001 .. X + 0.0001;
```

Implement both, run `gnatprove`, and observe what it can and cannot
discharge without help. The postcondition on `Sqrt` will probably
require you to give the prover a hint or a loop invariant.

### DIY 3 — Translate a C++ template

Pick any small C++ template you know (a `Pair<K, V>` type, say) and
rewrite it as an Ada generic. Note the explicit declaration of generic
formals and the instantiation syntax. Compare the error messages when
you instantiate with an incompatible type in each language. Ada's
messages are almost always shorter.

### DIY 4 — Convert Python code

Take a 200-line Python script you wrote recently and rewrite it in
Ada. You will feel the type system as friction at first, then as a
safety rail, and eventually as documentation. The exercise is not
about speed (though the Ada version is usually 10-100x faster) but
about which language makes you say the things you mean.

### TRY — Package your own library

Create a package hierarchy: `My_Lib`, `My_Lib.Stacks`, `My_Lib.Queues`,
`My_Lib.Sets`. Each child package is a generic container. Write a
small test program that instantiates each with `Integer` and exercises
them. Publish the resulting sources somewhere as a learning artifact.
You will have built, in an afternoon, your own miniature STL.

---

## Related College Departments (language core)

- [**coding**](../../../.college/departments/coding/DEPARTMENT.md) — the
  type system, generics, and package abstractions are textbook
  programming-language-design topics.
- [**mathematics**](../../../.college/departments/mathematics/DEPARTMENT.md)
  — contracts compile to verification conditions that SMT solvers
  discharge; this is applied mathematical logic.
- [**engineering**](../../../.college/departments/engineering/DEPARTMENT.md)
  — packaging, spec/body separation, and contracts are engineering
  discipline applied to software construction.

---

*This document is part of the PNW Research Series on tibsfox.com.
Ada deep dive, thread 2 of 4: language core. Siblings cover history,
concurrency, and safety-critical/SPARK. See the Research index for links.*
