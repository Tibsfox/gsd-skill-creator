# Pascal's Complex Data Types, Dynamic Memory, and Recursive Data Structures

> *A comprehensive technical exploration of Pascal's type system, pointer-based dynamic memory management, and the classical data structures that defined computer science education for three decades.*

**Series:** PNW Research Series -- Programming Language Deep Dives
**Subject:** Pascal Data Structures and Dynamic Memory
**Scope:** Type system foundations through advanced recursive data structures
**Compiler Reference:** Free Pascal 3.2.x (ISO 7185 compatible with extensions)

---

## Table of Contents

- [Part 1: Pascal's Type System Foundation](#part-1-pascals-type-system-foundation)
- [Part 2: Pointers and Dynamic Memory](#part-2-pointers-and-dynamic-memory)
- [Part 3: Linked Lists](#part-3-linked-lists-complete-treatment)
- [Part 4: Stacks and Queues](#part-4-stacks-and-queues)
- [Part 5: Trees](#part-5-trees-the-core)
- [Part 6: Graphs](#part-6-graphs)
- [Part 7: Hash Tables](#part-7-hash-tables)
- [Part 8: Sorting and Searching](#part-8-sorting-and-searching-with-pascal-data-structures)
- [Part 9: Variant Records as Proto-Algebraic Data Types](#part-9-the-variant-record-as-proto-algebraic-data-type)
- [Part 10: Memory Management Patterns](#part-10-memory-management-patterns)
- [References](#references)

---

# Part 1: Pascal's Type System Foundation

Pascal's type system was, in 1970, the most carefully designed type system in any mainstream programming language. Niklaus Wirth created Pascal specifically as a teaching language, but the type system he designed turned out to be influential far beyond academia. Where FORTRAN had a handful of numeric types and C would later treat types as suggestions that the programmer could subvert at will, Pascal took types seriously. Every variable has exactly one type, determined at compile time, and the compiler enforces type compatibility rules that prevent entire categories of bugs.

Understanding Pascal's type system is essential before diving into data structures, because Pascal's approach to types shapes everything about how data structures are built. The type system is not merely a safety net -- it is a design tool. When you declare a Pascal type, you are making a precise statement about what values a variable can hold, what operations are valid on those values, and how the compiler should lay out memory.

## 1. Simple Types

### Integer Types

Pascal's `integer` type represents whole numbers within a platform-dependent range. In Standard Pascal (ISO 7185), the range is implementation-defined but must include at least -32768 to 32767 (16-bit signed). Modern implementations like Free Pascal support multiple integer widths:

```pascal
program IntegerTypes;
var
  a: integer;      { platform-native signed integer }
  b: shortint;     { 8-bit signed: -128..127 }
  c: smallint;     { 16-bit signed: -32768..32767 }
  d: longint;      { 32-bit signed }
  e: int64;        { 64-bit signed }
  f: byte;         { 8-bit unsigned: 0..255 }
  g: word;         { 16-bit unsigned: 0..65535 }
  h: longword;     { 32-bit unsigned }
  i: qword;        { 64-bit unsigned }
begin
  a := 42;
  b := -100;
  c := 30000;
  d := 2000000000;
  e := 9000000000000000000;
  f := 255;
  g := 65535;
  h := 4000000000;
  i := 18000000000000000000;

  writeln('integer:   ', a);
  writeln('shortint:  ', b);
  writeln('smallint:  ', c);
  writeln('longint:   ', d);
  writeln('int64:     ', e);
  writeln('byte:      ', f);
  writeln('word:      ', g);
  writeln('longword:  ', h);
  writeln('qword:     ', i);
end.
```

The integer operations are the standard arithmetic: `+`, `-`, `*`, `div` (integer division), and `mod` (modulus). Note that Pascal uses `div` for integer division, not `/`. The `/` operator always returns a `real` result, even when both operands are integers. This is a deliberate design choice -- Wirth wanted to eliminate the confusion that arises in C where `7 / 2` yields `3` (integer truncation) but `7.0 / 2` yields `3.5`.

```pascal
program IntegerArithmetic;
var
  a, b: integer;
  r: real;
begin
  a := 17;
  b := 5;

  writeln('a + b   = ', a + b);      { 22 }
  writeln('a - b   = ', a - b);      { 12 }
  writeln('a * b   = ', a * b);      { 85 }
  writeln('a div b = ', a div b);    { 3  -- integer division }
  writeln('a mod b = ', a mod b);    { 2  -- remainder }

  r := a / b;
  writeln('a / b   = ', r:8:4);      { 3.4000 -- real division }
end.
```

### Real Types

Pascal's `real` type represents floating-point numbers. Standard Pascal defines a single `real` type; extended implementations provide multiple precisions:

```pascal
program RealTypes;
var
  a: real;        { platform-native floating point }
  b: single;      { 32-bit IEEE 754 (Free Pascal extension) }
  c: double;      { 64-bit IEEE 754 (Free Pascal extension) }
  d: extended;    { 80-bit extended precision (x86) }
begin
  a := 3.14159265358979;
  b := 3.14159;
  c := 3.14159265358979;
  d := 3.14159265358979323846;

  writeln('real:     ', a:20:15);
  writeln('single:   ', b:20:15);
  writeln('double:   ', c:20:15);
  writeln('extended: ', d:20:15);

  { Formatted output: value:width:decimals }
  writeln('Pi = ', a:8:5);   { outputs: Pi =  3.14159 }
end.
```

Pascal's formatted output with `value:width:decimals` is notably cleaner than C's `printf` format specifiers. The `:8:5` means "use 8 total characters, with 5 decimal places." This formatting syntax influenced several later languages.

### Boolean Type

Pascal's `boolean` type is a proper type with exactly two values: `true` and `false`. Unlike C, which historically used integers as booleans (where 0 is false and any non-zero value is true), Pascal's boolean is a distinct type that cannot be mixed with integers without explicit conversion.

```pascal
program BooleanDemo;
var
  p, q, r: boolean;
  x: integer;
begin
  p := true;
  q := false;
  r := (3 > 2);   { r is true }

  writeln('p = ', p);                  { TRUE }
  writeln('q = ', q);                  { FALSE }
  writeln('p and q = ', p and q);      { FALSE }
  writeln('p or q  = ', p or q);       { TRUE }
  writeln('not p   = ', not p);        { FALSE }
  writeln('p xor q = ', p xor q);     { TRUE (Free Pascal extension) }

  { Boolean is ordinal: ord(false)=0, ord(true)=1 }
  writeln('ord(false) = ', ord(false)); { 0 }
  writeln('ord(true)  = ', ord(true));  { 1 }

  { Relational operators produce boolean results }
  x := 42;
  writeln('x > 0 = ', x > 0);          { TRUE }
  writeln('x = 42 = ', x = 42);        { TRUE }
  writeln('x <> 0 = ', x <> 0);        { TRUE }
end.
```

The boolean type being a true ordinal type (not an alias for integer) means that Pascal catches category errors at compile time. Writing `if x then` where `x` is an integer is a compile error, not a runtime surprise. This design was directly adopted by Ada and influenced Java's strict boolean type.

### Char Type

The `char` type represents a single character. In Standard Pascal, characters are ordered according to the underlying character set (typically ASCII), and `char` is an ordinal type, meaning you can use `ord`, `succ`, and `pred` on characters:

```pascal
program CharDemo;
var
  ch: char;
  i: integer;
begin
  ch := 'A';
  writeln('Character: ', ch);
  writeln('Ordinal value: ', ord(ch));     { 65 in ASCII }
  writeln('Successor: ', succ(ch));        { B }
  writeln('Predecessor: ', pred(ch));      { @ in ASCII }

  { Character classification }
  ch := '7';
  if (ch >= '0') and (ch <= '9') then
    writeln(ch, ' is a digit');

  { Converting digit char to integer }
  i := ord(ch) - ord('0');
  writeln('Numeric value: ', i);            { 7 }

  { Converting integer to char }
  ch := chr(65);
  writeln('chr(65) = ', ch);               { A }

  { Iterating through characters }
  write('Alphabet: ');
  for ch := 'A' to 'Z' do
    write(ch);
  writeln;
end.
```

The fact that `char` is an ordinal type means it can be used as an array index, as a `for` loop control variable, and as the base type of a set. This is a powerful feature that Pascal shares with Ada but that C lacks -- in C, `char` is just a small integer, and there is no type-level distinction between "a character" and "a small number."

### Subrange Types

Subrange types are one of Pascal's most distinctive features. A subrange type restricts an existing ordinal type to a contiguous subset of its values:

```pascal
program SubrangeTypes;
type
  Month = 1..12;
  UpperCase = 'A'..'Z';
  Percent = 0..100;
  DayOfWeek = 1..7;
  ValidAge = 0..150;

var
  m: Month;
  letter: UpperCase;
  score: Percent;
  day: DayOfWeek;
  age: ValidAge;
begin
  m := 6;        { valid }
  letter := 'G'; { valid }
  score := 95;   { valid }
  day := 3;      { valid }
  age := 25;     { valid }

  writeln('Month: ', m);
  writeln('Letter: ', letter);
  writeln('Score: ', score);
  writeln('Day: ', day);
  writeln('Age: ', age);

  { Range checking catches errors at runtime (with {$R+}) }
  { m := 13;   -- runtime error: range check error }
  { score := 101; -- runtime error: range check error }
end.
```

Subrange types serve two purposes. First, they document the programmer's intent -- a variable of type `Month` communicates far more than a variable of type `integer`. Second, with range checking enabled (`{$R+}`), the compiler inserts runtime checks that catch out-of-range assignments. This is a form of contract programming that predates Eiffel's design-by-contract by over a decade.

The influence of subrange types can be traced through Ada's constrained subtypes, and conceptually through Rust's newtype pattern (though Rust uses a different mechanism). C has no direct equivalent -- `typedef` creates an alias, not a constrained type.

### Enumerated Types

Enumerated types were Pascal's most revolutionary contribution to type systems. Before Pascal, programmers used integer constants to represent discrete categories -- a practice that C still relies on heavily. Pascal's enumerated types create genuinely new types with named values:

```pascal
program EnumeratedTypes;
type
  Color = (Red, Green, Blue, Yellow, Cyan, Magenta, White, Black);
  Season = (Spring, Summer, Autumn, Winter);
  Direction = (North, South, East, West);
  Suit = (Clubs, Diamonds, Hearts, Spades);
  Rank = (Two, Three, Four, Five, Six, Seven, Eight, Nine, Ten,
          Jack, Queen, King, Ace);

var
  c: Color;
  s: Season;
  d: Direction;
  cardSuit: Suit;
  cardRank: Rank;
begin
  c := Blue;
  s := Autumn;
  d := North;
  cardSuit := Hearts;
  cardRank := Queen;

  { Enumerated types are ordinal }
  writeln('ord(Red) = ', ord(Red));       { 0 }
  writeln('ord(Blue) = ', ord(Blue));     { 2 }
  writeln('succ(Red) = ', ord(succ(Red))); { 1, which is Green }
  writeln('pred(Blue) = ', ord(pred(Blue))); { 1, which is Green }

  { Can be used in for loops }
  write('Colors: ');
  for c := Red to Black do
    write(ord(c), ' ');
  writeln;

  { Can be used in case statements }
  case s of
    Spring: writeln('Flowers blooming');
    Summer: writeln('Long warm days');
    Autumn: writeln('Leaves falling');
    Winter: writeln('Snow and silence');
  end;

  { Enumerated types are type-safe }
  { d := Red;   -- compile error: type mismatch }
  { s := North; -- compile error: type mismatch }
end.
```

Why were enumerated types revolutionary? Consider the alternative in FORTRAN or early C:

```c
/* C approach: no type safety */
#define RED   0
#define GREEN 1
#define BLUE  2
#define NORTH 0  /* same value as RED -- no compiler error! */

int color = RED;
int direction = NORTH;
color = direction;  /* compiles without warning */
color = 42;         /* compiles without warning */
```

In Pascal, `Color` and `Direction` are distinct types. You cannot assign a `Direction` to a `Color` variable, and you cannot assign an arbitrary integer to either. The compiler enforces this at compile time with zero runtime cost.

The lineage from Pascal's enums:
- **C (1972):** Adopted `enum` syntax but implemented it as named integer constants, losing type safety.
- **Ada (1983):** Adopted Pascal's approach fully, with enumerated types as first-class distinct types.
- **Java (2004, JDK 5):** Finally added type-safe enums, closer to Pascal's model than C's.
- **Rust:** Rust's `enum` extends Pascal's concept with associated data (algebraic data types), making it more powerful while preserving the type safety that Pascal pioneered.

### Ordinal Functions: Ord, Succ, Pred, Low, High

Every ordinal type (integer types, boolean, char, enumerated types, subrange types) supports a common set of operations:

```pascal
program OrdinalFunctions;
type
  Day = (Mon, Tue, Wed, Thu, Fri, Sat, Sun);

var
  d: Day;
  ch: char;
  i: integer;
begin
  { ord() returns the ordinal position }
  writeln('ord(Mon) = ', ord(Mon));     { 0 }
  writeln('ord(Fri) = ', ord(Fri));     { 4 }
  writeln('ord(''A'') = ', ord('A'));   { 65 }
  writeln('ord(true) = ', ord(true));   { 1 }

  { succ() returns the next value }
  d := Wed;
  writeln('succ(Wed) is Thu: ', succ(d) = Thu);  { TRUE }

  { pred() returns the previous value }
  writeln('pred(Wed) is Tue: ', pred(d) = Tue);  { TRUE }

  { Low() and High() give the range bounds (Free Pascal) }
  writeln('Low(Day) = ', ord(Low(Day)));    { 0 (Mon) }
  writeln('High(Day) = ', ord(High(Day)));  { 6 (Sun) }
  writeln('Low(byte) = ', Low(byte));       { 0 }
  writeln('High(byte) = ', High(byte));     { 255 }

  { chr() converts an ordinal to a char }
  ch := chr(65);
  writeln('chr(65) = ', ch);  { A }

  { Iterating through all values of an enumerated type }
  write('Days: ');
  for d := Low(Day) to High(Day) do
    write(ord(d), ' ');
  writeln;
end.
```

The uniformity of ordinal operations across all ordinal types is an elegant design. Whether you are working with integers, characters, or enumerated types, the same `ord`, `succ`, and `pred` functions work identically. This polymorphism is resolved at compile time -- there is no runtime dispatch, no vtable, no overhead.

## 2. The String Problem

Standard Pascal (ISO 7185) has no string type. This is the single most criticized aspect of Pascal's design, and it is the subject of Brian Kernighan's famous 1981 paper "Why Pascal is Not My Favorite Programming Language." Understanding the string problem -- and the various solutions -- illuminates a fundamental tension in language design between type safety and practical usability.

### Packed Arrays of Char

In Standard Pascal, a string literal like `'Hello'` has the type `packed array[1..5] of char`. A string of a different length, like `'World!'`, has the type `packed array[1..6] of char`. These are **different types** -- they are not assignment-compatible, and you cannot pass one where the other is expected:

```pascal
program StringProblem;
type
  String5 = packed array[1..5] of char;
  String6 = packed array[1..6] of char;
  String10 = packed array[1..10] of char;

var
  greeting: String5;
  name: String10;
  { cannot declare: combined: ??? -- what type? }
begin
  greeting := 'Hello';     { exactly 5 characters }
  name := 'World     ';   { must pad to exactly 10 characters }

  writeln(greeting);
  writeln(name);

  { greeting := 'Hi';     -- compile error: wrong length }
  { greeting := name;     -- compile error: incompatible types }
end.
```

This is type safety taken to an extreme that becomes a hindrance. You cannot write a general-purpose string-handling procedure because the procedure's parameter type fixes the string length. A procedure declared as:

```pascal
procedure PrintString(s: String10);
```

can only accept 10-character strings. You would need a separate procedure for every string length you use, which is clearly absurd.

### Kernighan's Critique

Brian Kernighan, co-creator of C, summarized the problem in his 1981 paper:

> "Since there are no variable-length strings, it is not possible to write a general-purpose procedure that will process strings of different lengths. [...] This is a fatal flaw -- it means that Pascal is unable to express a wide class of useful computations."

Kernighan's critique was fair. Standard Pascal's strings are nearly unusable for real programming. However, Kernighan's paper is sometimes misread as a critique of strong typing in general. It is not -- it is a critique of a specific, overly rigid type compatibility rule. The solution is not to abandon type safety (as C does by treating strings as raw `char*` pointers) but to design a better string type.

### The Conformant Array Parameter (ISO 10206)

Extended Pascal (ISO 10206, 1990) partially addressed the problem with conformant array parameters, which allow a procedure to accept arrays of different sizes:

```pascal
{ Extended Pascal conformant array syntax }
procedure PrintChars(s: array[lo..hi: integer] of char);
var
  i: integer;
begin
  for i := lo to hi do
    write(s[i]);
  writeln;
end;
```

This was a theoretically sound solution but came too late and was not widely implemented. By 1990, the Pascal world had already fractured into incompatible extensions.

### Turbo Pascal's String Type

Borland's Turbo Pascal (1983) solved the string problem pragmatically with a `string` type that stores the current length in byte 0:

```pascal
program TurboPascalStrings;
var
  s: string;        { up to 255 characters }
  t: string[20];    { up to 20 characters }
  u: string[80];    { up to 80 characters }
begin
  s := 'Hello, World!';
  t := 'Short';
  u := 'This is a longer string with more characters';

  writeln('s = "', s, '"');
  writeln('Length of s: ', length(s));     { 13 }
  writeln('t = "', t, '"');
  writeln('Length of t: ', length(t));     { 5 }

  { String concatenation with + }
  s := 'Hello' + ', ' + 'World!';
  writeln('Concatenated: ', s);

  { String comparison }
  if s = 'Hello, World!' then
    writeln('Strings are equal');

  { Accessing individual characters }
  writeln('First char: ', s[1]);          { H }
  writeln('Fifth char: ', s[5]);          { o }

  { String procedures }
  writeln('Pos: ', pos('World', s));      { 8 }
  writeln('Copy: ', copy(s, 1, 5));       { Hello }

  { String assignment works across different max lengths }
  t := s;   { truncates if s is longer than 20 chars }
  writeln('t after assignment: "', t, '"');
  writeln('Length of t: ', length(t));
end.
```

Turbo Pascal strings store the current length in byte 0 (hence the 255-character limit -- a byte can hold 0..255). This "length-prefixed" format contrasts with C's "null-terminated" strings. Each approach has trade-offs:

| Feature | Pascal (length-prefix) | C (null-terminated) |
|---------|----------------------|---------------------|
| Getting length | O(1) -- read byte 0 | O(n) -- scan for null |
| Embedded nulls | Allowed | Not possible |
| Maximum length | 255 chars | Unlimited |
| Buffer overflows | Checked (truncation) | Unchecked (security risk) |
| Memory overhead | 1 byte (length) | 1 byte (null terminator) |

### Modern Pascal Strings: Free Pascal and Delphi

Free Pascal and Delphi evolved Pascal's string handling far beyond Turbo Pascal's simple 255-byte strings:

```pascal
program ModernStrings;
{$mode objfpc}
{$H+}  { Enable long strings (AnsiString) by default }

var
  short: string[10];    { ShortString: max 10 chars, length in byte 0 }
  ansi: AnsiString;     { Reference-counted, heap-allocated, no length limit }
  wide: WideString;     { UTF-16 encoded, COM-compatible }
  uni: UnicodeString;   { UTF-16 encoded, reference-counted }
  utf8: UTF8String;     { UTF-8 encoded AnsiString }
begin
  short := 'Short';
  ansi := 'This is a very long string that can be any length at all';
  wide := 'Wide character support';
  uni := 'Unicode: '#$03B1#$03B2#$03B3;  { Greek alpha, beta, gamma }
  utf8 := 'UTF-8 encoded text';

  writeln('ShortString: ', short, ' (max ', High(short), ' chars)');
  writeln('AnsiString:  ', ansi);
  writeln('  Length: ', Length(ansi));
  writeln('WideString:  ', wide);
  writeln('UnicodeString: ', uni);
  writeln('UTF8String:  ', utf8);

  { AnsiString is reference-counted }
  { Assignment does NOT copy -- it increments a reference count }
  { Copy-on-write semantics: copy only happens on mutation }

  { String operations work uniformly }
  ansi := ansi + ' -- appended!';
  writeln('After append: ', ansi);
  writeln('Substring: ', Copy(ansi, 1, 10));
  writeln('Position of "long": ', Pos('long', ansi));
end.
```

The AnsiString type in Free Pascal and Delphi uses reference counting with copy-on-write semantics. This means that string assignment is O(1) (just incrementing a reference count), and a deep copy only occurs when one of the references tries to modify the string. This is an efficient strategy that avoids both the rigidity of Standard Pascal's fixed-length strings and the unsafety of C's raw pointers.

## 3. Arrays

Arrays are Pascal's primary aggregate type for homogeneous collections. Pascal arrays are distinctive in several ways: they have fixed size determined at compile time, they can use any ordinal type as an index (not just integers), and the index range is part of the type.

### Fixed-Size Arrays with Ordinal Index Types

```pascal
program ArrayExamples;
type
  { Array indexed by integers }
  Scores = array[1..100] of integer;

  { Array indexed by characters }
  CharCount = array['a'..'z'] of integer;

  { Array indexed by enumerated type }
  Day = (Mon, Tue, Wed, Thu, Fri, Sat, Sun);
  DailyTemp = array[Day] of real;

  { Array indexed by boolean }
  BoolLabel = array[boolean] of string[5];

  { Array indexed by subrange }
  Month = 1..12;
  MonthName = array[Month] of string[9];

var
  s: Scores;
  cc: CharCount;
  temps: DailyTemp;
  labels: BoolLabel;
  months: MonthName;
  d: Day;
  ch: char;
begin
  { Integer-indexed array }
  s[1] := 95;
  s[2] := 87;
  s[3] := 92;

  { Character-indexed array: count letter frequencies }
  for ch := 'a' to 'z' do
    cc[ch] := 0;
  cc['e'] := 12;
  cc['t'] := 9;
  cc['a'] := 8;
  writeln('Frequency of e: ', cc['e']);

  { Enum-indexed array }
  temps[Mon] := 15.2;
  temps[Tue] := 16.8;
  temps[Wed] := 14.5;
  temps[Thu] := 17.1;
  temps[Fri] := 18.3;
  temps[Sat] := 19.0;
  temps[Sun] := 16.5;
  for d := Mon to Sun do
    write(temps[d]:6:1);
  writeln;

  { Boolean-indexed array }
  labels[false] := 'No';
  labels[true] := 'Yes';
  writeln('Answer: ', labels[3 > 2]);  { Yes }

  { Month name array }
  months[1]  := 'January';
  months[2]  := 'February';
  months[3]  := 'March';
  months[4]  := 'April';
  months[5]  := 'May';
  months[6]  := 'June';
  months[7]  := 'July';
  months[8]  := 'August';
  months[9]  := 'September';
  months[10] := 'October';
  months[11] := 'November';
  months[12] := 'December';
  writeln('Month 6 is ', months[6]);
end.
```

The ability to index arrays by any ordinal type is one of Pascal's most elegant features. An `array[Day] of real` is self-documenting -- the index type tells you exactly what the indices mean. Compare this to C, where you would write `double temps[7]` and then use magic numbers 0-6, or define constants `#define MON 0`, losing type safety.

### Multi-Dimensional Arrays

```pascal
program MultiDimensionalArrays;
const
  Rows = 4;
  Cols = 5;

type
  Matrix = array[1..Rows, 1..Cols] of real;
  { Equivalent to: array[1..Rows] of array[1..Cols] of real }

  { Chess board example }
  ChessPiece = (Empty, WPawn, WKnight, WBishop, WRook, WQueen, WKing,
                BPawn, BKnight, BBishop, BRook, BQueen, BKing);
  ChessBoard = array[1..8, 1..8] of ChessPiece;

  { 3D array }
  Cube = array[1..3, 1..3, 1..3] of integer;

var
  m: Matrix;
  board: ChessBoard;
  c: Cube;
  i, j, k: integer;
begin
  { Initialize matrix with multiplication table }
  for i := 1 to Rows do
    for j := 1 to Cols do
      m[i, j] := i * j;

  { Print matrix }
  writeln('Multiplication table:');
  for i := 1 to Rows do
  begin
    for j := 1 to Cols do
      write(m[i, j]:6:0);
    writeln;
  end;

  { Matrix operations example: transpose }
  writeln;
  writeln('Note: m[2,3] = ', m[2, 3]:0:0, ', m[3,2] = ', m[3, 2]:0:0);

  { Initialize chess board (starting position, simplified) }
  for i := 1 to 8 do
    for j := 1 to 8 do
      board[i, j] := Empty;

  { Place white pawns on row 2 }
  for j := 1 to 8 do
    board[2, j] := WPawn;
  { Place black pawns on row 7 }
  for j := 1 to 8 do
    board[7, j] := BPawn;

  board[1, 1] := WRook;  board[1, 8] := WRook;
  board[1, 2] := WKnight; board[1, 7] := WKnight;
  board[1, 3] := WBishop; board[1, 6] := WBishop;
  board[1, 4] := WQueen;  board[1, 5] := WKing;

  { 3D array }
  for i := 1 to 3 do
    for j := 1 to 3 do
      for k := 1 to 3 do
        c[i, j, k] := i * 100 + j * 10 + k;

  writeln('c[2,3,1] = ', c[2, 3, 1]);  { 231 }
end.
```

### Packed Arrays

The `packed` keyword instructs the compiler to minimize storage at the possible expense of access speed:

```pascal
program PackedArrays;
type
  { Packed boolean array uses 1 bit per element }
  BitField = packed array[0..31] of boolean;

  { Packed char array -- the original "string" }
  Name = packed array[1..20] of char;

var
  flags: BitField;
  studentName: Name;
  i: integer;
begin
  { Initialize all flags to false }
  for i := 0 to 31 do
    flags[i] := false;

  { Set some flags }
  flags[0] := true;   { bit 0 }
  flags[5] := true;   { bit 5 }
  flags[31] := true;  { bit 31 }

  { Packed array of char can be assigned a string literal }
  studentName := 'Pascal Wirth        ';  { must be exactly 20 chars }
  writeln('Name: "', studentName, '"');
end.
```

### The Conformant Array Parameter Problem

Kernighan's second major complaint about Pascal arrays was the inability to write procedures that accept arrays of different sizes. Consider wanting to write a procedure that sums the elements of any integer array:

```pascal
{ THIS IS THE PROBLEM: }
{ procedure Sum(a: array[1..10] of integer) only works for 10-element arrays }
{ procedure Sum(a: array[1..20] of integer) is a DIFFERENT procedure }

{ Standard Pascal has no solution. }
{ Extended Pascal (ISO 10206) added conformant array parameters: }
{ procedure Sum(a: array[lo..hi: integer] of integer); }

{ Free Pascal solution: open array parameters }
program OpenArrays;

{ Open array parameter: accepts any array size }
function Sum(const a: array of integer): longint;
var
  i: integer;
  total: longint;
begin
  total := 0;
  for i := Low(a) to High(a) do  { Low is always 0 for open arrays }
    total := total + a[i];
  Sum := total;
end;

procedure PrintArray(const a: array of integer);
var
  i: integer;
begin
  write('[');
  for i := Low(a) to High(a) do
  begin
    write(a[i]);
    if i < High(a) then
      write(', ');
  end;
  writeln(']');
end;

var
  small: array[1..3] of integer = (10, 20, 30);
  large: array[1..6] of integer = (1, 2, 3, 4, 5, 6);
begin
  PrintArray(small);
  writeln('Sum: ', Sum(small));   { 60 }

  PrintArray(large);
  writeln('Sum: ', Sum(large));   { 21 }
end.
```

## 4. Records

Records are Pascal's heterogeneous aggregate type, analogous to C's `struct`. A record groups fields of different types into a single composite value:

```pascal
program RecordExamples;
type
  Date = record
    day: 1..31;
    month: 1..12;
    year: integer;
  end;

  Student = record
    firstName: string[30];
    lastName: string[30];
    id: longint;
    birthDate: Date;    { nested record }
    gpa: real;
    enrolled: boolean;
  end;

  Point = record
    x, y: real;
  end;

  Rectangle = record
    topLeft, bottomRight: Point;   { nested records }
  end;

var
  today: Date;
  stu: Student;
  rect: Rectangle;
begin
  { Field-by-field assignment }
  today.day := 9;
  today.month := 4;
  today.year := 2026;
  writeln('Today: ', today.month, '/', today.day, '/', today.year);

  { Nested record access }
  stu.firstName := 'Ada';
  stu.lastName := 'Lovelace';
  stu.id := 18151210;
  stu.birthDate.day := 10;
  stu.birthDate.month := 12;
  stu.birthDate.year := 1815;
  stu.gpa := 4.0;
  stu.enrolled := true;

  writeln('Student: ', stu.firstName, ' ', stu.lastName);
  writeln('Born: ', stu.birthDate.month, '/', stu.birthDate.day,
          '/', stu.birthDate.year);
  writeln('GPA: ', stu.gpa:0:2);

  { Rectangle with nested points }
  rect.topLeft.x := 0.0;
  rect.topLeft.y := 10.0;
  rect.bottomRight.x := 20.0;
  rect.bottomRight.y := 0.0;

  writeln('Rectangle: (', rect.topLeft.x:0:1, ', ', rect.topLeft.y:0:1,
          ') to (', rect.bottomRight.x:0:1, ', ', rect.bottomRight.y:0:1, ')');
end.
```

### The `with` Statement

The `with` statement provides shorthand access to record fields, reducing repetitive qualification:

```pascal
program WithStatement;
type
  Date = record
    day: 1..31;
    month: 1..12;
    year: integer;
  end;

  Employee = record
    name: string[50];
    hireDate: Date;
    salary: real;
    department: string[30];
  end;

var
  emp: Employee;
begin
  { Without 'with' -- verbose }
  emp.name := 'Grace Hopper';
  emp.hireDate.day := 9;
  emp.hireDate.month := 12;
  emp.hireDate.year := 1906;
  emp.salary := 85000.00;
  emp.department := 'Computer Science';

  { With 'with' -- concise }
  with emp do
  begin
    writeln('Name: ', name);
    writeln('Salary: $', salary:0:2);
    writeln('Department: ', department);

    with hireDate do
      writeln('Hired: ', month, '/', day, '/', year);
  end;

  { Multiple records in one 'with' }
  { with emp, emp.hireDate do ... }
  { Be careful: ambiguous field names cause confusion }
end.
```

The `with` statement is sometimes criticized because it can make code harder to read -- inside a `with` block, you cannot tell at a glance whether a name refers to a record field or a local variable. Modern Pascal style guides often recommend limiting `with` to simple cases. This criticism foreshadowed similar debates about JavaScript's `with` statement (which was deprecated) and Python's implicit `self`.

### Record Assignment and Comparison

Pascal allows whole-record assignment (if the types are identical) but does NOT allow record comparison:

```pascal
program RecordAssignment;
type
  Point = record
    x, y: real;
  end;

var
  p1, p2: Point;
begin
  p1.x := 3.0;
  p1.y := 4.0;

  p2 := p1;   { whole-record assignment: copies all fields }

  writeln('p2 = (', p2.x:0:1, ', ', p2.y:0:1, ')');  { (3.0, 4.0) }

  { p1 = p2 is NOT allowed in Standard Pascal }
  { You must compare field by field }
  if (p1.x = p2.x) and (p1.y = p2.y) then
    writeln('Points are equal');
end.
```

This is a deliberate design choice. Whole-record comparison raises questions about what "equal" means for floating-point fields, padding bytes, and pointer fields. Wirth chose to leave comparison to the programmer rather than impose a potentially wrong default. Contrast this with C, where `struct` comparison is not supported at all (you must use `memcmp` or field-by-field comparison), and with Rust, where you explicitly opt in to comparison by deriving `PartialEq`.

## 5. Sets

Pascal has built-in set types -- a feature that is remarkably rare among imperative programming languages. A `set of T` can hold any subset of values from the base type T, where T must be an ordinal type with a small range (typically 0..255 in most implementations):

```pascal
program SetExamples;
type
  Color = (Red, Orange, Yellow, Green, Blue, Indigo, Violet);
  ColorSet = set of Color;
  CharSet = set of char;
  SmallInt = set of 0..255;
  Day = (Mon, Tue, Wed, Thu, Fri, Sat, Sun);
  DaySet = set of Day;

var
  primary, warm, cool, all: ColorSet;
  vowels, consonants, digits, letters: CharSet;
  weekdays, weekend, workdays: DaySet;
  primes: SmallInt;
  ch: char;
  d: Day;
begin
  { Set literals }
  primary := [Red, Yellow, Blue];
  warm := [Red, Orange, Yellow];
  cool := [Green, Blue, Indigo, Violet];

  { Set operations }
  all := warm + cool;                        { union }
  writeln('warm and primary: ', warm * primary = [Red, Yellow]); { intersection }
  writeln('warm - primary: ', warm - primary = [Orange]);        { difference }

  { Membership test with 'in' }
  if Red in primary then
    writeln('Red is a primary color');

  if not (Orange in primary) then
    writeln('Orange is not a primary color');

  { Character sets for classification }
  vowels := ['A', 'E', 'I', 'O', 'U', 'a', 'e', 'i', 'o', 'u'];
  digits := ['0'..'9'];
  letters := ['A'..'Z', 'a'..'z'];
  consonants := letters - vowels;

  { Efficient character classification }
  ch := 'G';
  if ch in vowels then
    writeln(ch, ' is a vowel')
  else if ch in consonants then
    writeln(ch, ' is a consonant')
  else if ch in digits then
    writeln(ch, ' is a digit')
  else
    writeln(ch, ' is something else');

  { Day sets }
  weekend := [Sat, Sun];
  weekdays := [Mon, Tue, Wed, Thu, Fri];
  workdays := weekdays - [Fri];   { Mon..Thu }

  { Set comparison }
  if weekdays <= [Mon..Sun] then
    writeln('weekdays is a subset of all days');
  if weekend >= [Sun] then
    writeln('[Sun] is a subset of weekend');
  if workdays <> weekdays then
    writeln('workdays and weekdays differ');

  { Prime sieve using sets }
  primes := [2..255];
  { Remove multiples }
  primes := primes - [4, 6, 8, 9, 10, 12, 14, 15, 16, 18, 20, 21, 22,
    24, 25, 26, 27, 28]; { abbreviated for clarity }

  write('Some primes: ');
  if 2 in primes then write('2 ');
  if 3 in primes then write('3 ');
  if 5 in primes then write('5 ');
  if 7 in primes then write('7 ');
  if 11 in primes then write('11 ');
  writeln;
end.
```

### A Complete Sieve of Eratosthenes Using Sets

```pascal
program SieveOfEratosthenes;
const
  Max = 255;   { Set elements limited to 0..255 in most implementations }

type
  NumberSet = set of 2..Max;

var
  primes, sieve: NumberSet;
  i, j: integer;
  count: integer;
begin
  sieve := [2..Max];   { Start with all numbers }
  primes := [];         { Empty set of primes }

  i := 2;
  while i * i <= Max do
  begin
    if i in sieve then
    begin
      primes := primes + [i];
      { Remove all multiples of i }
      j := i * i;   { start from i^2 since smaller multiples already removed }
      while j <= Max do
      begin
        sieve := sieve - [j];
        j := j + i;
      end;
    end;
    i := i + 1;
  end;

  { Remaining elements in sieve are prime }
  primes := primes + sieve;

  { Print all primes }
  count := 0;
  for i := 2 to Max do
    if i in primes then
    begin
      write(i:4);
      count := count + 1;
      if count mod 15 = 0 then
        writeln;
    end;
  writeln;
  writeln('Total primes up to ', Max, ': ', count);
end.
```

### Why Pascal's Set Type Is Unique

Pascal's built-in `set of` type is almost unique among imperative languages:

- **C/C++:** No built-in set type. You must use bitfields, `std::set`, or `std::bitset`.
- **Java:** `EnumSet` (added in JDK 5) is the closest equivalent, directly inspired by Pascal's sets.
- **Python:** Has `set` as a built-in type, but it is a hash-based dynamic set, not a bit-vector set.
- **Rust:** No built-in set of enum. The `enumset` crate provides Pascal-like enum sets.
- **Ada:** Has set-like operations but not a dedicated `set of` type.

Pascal's sets are implemented as bit vectors. A `set of 0..255` is 256 bits (32 bytes). Set union is bitwise OR, intersection is bitwise AND, difference is bitwise AND NOT, and membership test is a single bit test. This makes all set operations O(1) for the common case of small base types -- far more efficient than hash-based sets for this use case.

The practical limitation is that the base type must be small enough to be represented as a bit vector. Most implementations limit set elements to 0..255, which restricts the base type to `byte`, `char`, `boolean`, small subranges, or enumerated types with at most 256 values. This is a reasonable trade-off for the use cases where sets are most valuable: character classification, flag fields, and state machines.

## 6. Files

Pascal has built-in file types that provide type-safe sequential I/O. There are three kinds of file types:

```pascal
program FileTypes;
type
  StudentRecord = record
    name: string[50];
    id: longint;
    gpa: real;
  end;

  { Three kinds of files }
  IntFile = file of integer;         { typed file of integers }
  StudentFile = file of StudentRecord; { typed file of records }
  { text is a predefined type }      { text file }
  { file is the untyped file }       { untyped file }

var
  tf: text;          { text file }
  sf: StudentFile;   { typed file of student records }
  stu: StudentRecord;
  line: string;
  i: integer;
begin
  { --- Writing a text file --- }
  assign(tf, 'output.txt');
  rewrite(tf);  { create/overwrite }
  writeln(tf, 'Line 1: Hello');
  writeln(tf, 'Line 2: World');
  writeln(tf, 'Line 3: Pascal Files');
  close(tf);

  { --- Reading a text file --- }
  assign(tf, 'output.txt');
  reset(tf);    { open for reading }
  i := 0;
  while not eof(tf) do
  begin
    readln(tf, line);
    i := i + 1;
    writeln('Read line ', i, ': ', line);
  end;
  close(tf);

  { --- Writing a typed file --- }
  assign(sf, 'students.dat');
  rewrite(sf);

  stu.name := 'Alan Turing';
  stu.id := 19120623;
  stu.gpa := 4.0;
  write(sf, stu);

  stu.name := 'Grace Hopper';
  stu.id := 19061209;
  stu.gpa := 3.95;
  write(sf, stu);

  stu.name := 'Niklaus Wirth';
  stu.id := 19340215;
  stu.gpa := 3.98;
  write(sf, stu);

  close(sf);

  { --- Reading a typed file --- }
  assign(sf, 'students.dat');
  reset(sf);
  writeln;
  writeln('Student Records:');
  while not eof(sf) do
  begin
    read(sf, stu);
    writeln('  ', stu.name, ' (ID: ', stu.id, ', GPA: ', stu.gpa:0:2, ')');
  end;
  close(sf);

  { Clean up }
  erase(sf);
  assign(tf, 'output.txt');
  erase(tf);
end.
```

Pascal's file I/O model is sequential by default -- you read from the beginning and advance forward, or you write from the beginning and create new content. This simplicity reflects the era when files were often stored on tape drives, where sequential access was the norm. Random access is possible in extended implementations using `seek`:

```pascal
program RandomAccessFile;
type
  NameRecord = record
    name: string[30];
    score: integer;
  end;

var
  f: file of NameRecord;
  rec: NameRecord;
  n: longint;
begin
  assign(f, 'scores.dat');
  rewrite(f);

  { Write some records }
  rec.name := 'Alice';   rec.score := 95; write(f, rec);
  rec.name := 'Bob';     rec.score := 87; write(f, rec);
  rec.name := 'Charlie'; rec.score := 92; write(f, rec);
  rec.name := 'Diana';   rec.score := 98; write(f, rec);

  { Random access: read record 2 (0-based) }
  seek(f, 2);
  read(f, rec);
  writeln('Record 2: ', rec.name, ' = ', rec.score);  { Charlie = 92 }

  { Get file size (number of records) }
  n := filesize(f);
  writeln('Total records: ', n);

  { Read last record }
  seek(f, n - 1);
  read(f, rec);
  writeln('Last record: ', rec.name, ' = ', rec.score);  { Diana = 98 }

  close(f);
  erase(f);
end.
```

---

# Part 2: Pointers and Dynamic Memory

With the type system foundation established, we now enter the territory that makes Pascal a serious systems programming language: pointers and dynamic memory allocation. This is where Pascal's data structures come alive. Every linked list, every tree, every graph in Pascal is built on the pointer mechanism described in this section.

## 7. The Pointer Type

A pointer in Pascal is declared using the `^` (caret) symbol. The type `^T` means "pointer to a value of type T." A pointer variable holds the memory address of a value, not the value itself:

```pascal
program PointerBasics;
var
  p: ^integer;    { pointer to an integer }
  q: ^real;       { pointer to a real }
  r: ^integer;    { another pointer to integer }
begin
  { Allocate memory on the heap }
  new(p);         { p now points to a newly allocated integer }
  p^ := 42;      { dereference p and assign 42 to the integer it points to }
  writeln('p^ = ', p^);  { 42 }

  new(q);
  q^ := 3.14;
  writeln('q^ = ', q^:0:2);  { 3.14 }

  { Pointer assignment }
  new(r);
  r^ := 100;
  writeln('r^ = ', r^);  { 100 }

  { Assigning one pointer to another -- both point to the same memory }
  dispose(r);     { free r's memory first }
  r := p;         { r now points to the same integer as p }
  writeln('After r := p:');
  writeln('  p^ = ', p^);  { 42 }
  writeln('  r^ = ', r^);  { 42 -- same memory location }

  { Modifying through r changes what p sees }
  r^ := 99;
  writeln('After r^ := 99:');
  writeln('  p^ = ', p^);  { 99 -- changed! }
  writeln('  r^ = ', r^);  { 99 }

  { nil -- the null pointer }
  r := nil;
  writeln('r is nil: ', r = nil);  { TRUE }
  { r^ := 5;  -- RUNTIME ERROR: nil pointer dereference }

  { Comparison }
  new(r);
  r^ := 99;
  writeln('p = r: ', p = r);   { FALSE -- different memory addresses }
  writeln('p^ = r^: ', p^ = r^); { TRUE -- same value }

  { Clean up }
  dispose(p);
  dispose(r);
  dispose(q);
end.
```

### The Critical Restriction: No Pointer Arithmetic

Unlike C, Pascal does not allow pointer arithmetic. You cannot add an integer to a pointer, subtract two pointers to get a distance, or cast between pointer types and integers. This restriction was deliberate:

```c
/* C allows (and programmers routinely use) pointer arithmetic */
int arr[10];
int *p = arr;
p++;          /* p now points to arr[1] */
p += 3;       /* p now points to arr[4] */
int diff = p - arr;  /* diff = 4 */
*(p + 2) = 42;       /* arr[6] = 42 */
```

```pascal
{ Pascal PROHIBITS all of the above }
{ var p: ^integer; }
{ p := p + 1;     -- COMPILE ERROR: incompatible types }
{ p := p + 3;     -- COMPILE ERROR }
{ There is no pointer subtraction, no pointer-to-integer cast }
```

Wirth's reasoning was clear: pointers exist for building dynamic data structures (linked lists, trees, graphs), not for array manipulation. Arrays already have safe, bounds-checked indexing. Pointer arithmetic is the source of buffer overflows, off-by-one errors, and the majority of memory safety bugs in C programs. By prohibiting it, Pascal eliminates an entire category of vulnerabilities.

This design decision has echoes throughout language history:
- **Java (1995):** No pointer arithmetic at all. References are opaque.
- **C# (2000):** No pointer arithmetic in safe code; available only in `unsafe` blocks.
- **Rust (2015):** No pointer arithmetic in safe code; available only in `unsafe` blocks.
- **Go (2009):** No pointer arithmetic.

All of these languages adopted Pascal's philosophy, not C's.

## 8. Dynamic Allocation: `new` and `dispose`

The `new` procedure allocates memory on the heap for a value of the pointer's base type. The `dispose` procedure returns that memory to the heap:

```pascal
program DynamicAllocation;
type
  PStudent = ^TStudent;
  TStudent = record
    name: string[50];
    grade: integer;
  end;

  PArray = ^TArray;
  TArray = array[1..1000] of real;

var
  ps: PStudent;
  pa: PArray;
  i: integer;
begin
  { Allocate a student record on the heap }
  new(ps);
  ps^.name := 'Blaise Pascal';
  ps^.grade := 100;
  writeln('Student: ', ps^.name, ', Grade: ', ps^.grade);

  { Allocate a large array on the heap }
  { This is how you get dynamic-sized data in Pascal }
  new(pa);
  for i := 1 to 1000 do
    pa^[i] := sqrt(i);
  writeln('pa^[100] = ', pa^[100]:0:6);
  writeln('pa^[999] = ', pa^[999]:0:6);

  { Free the memory }
  dispose(ps);
  dispose(pa);

  { After dispose, the pointer is invalid -- dangling pointer }
  { Best practice: set to nil after dispose }
  ps := nil;
  pa := nil;
end.
```

### How `new` and `dispose` Work

When the runtime starts, it initializes a heap -- a region of memory available for dynamic allocation. The heap typically starts at a specific address and grows upward (toward higher addresses), while the stack grows downward (toward lower addresses):

```
Memory Layout (simplified):
+------------------+
|   Program Code   |
+------------------+
|   Global Data    |
+------------------+
|       Heap       |  <-- grows upward
|        |         |
|        v         |
|                  |
|        ^         |
|        |         |
|       Stack      |  <-- grows downward
+------------------+
```

`new(p)` does the following:
1. Determines the size of the base type (e.g., `SizeOf(TStudent)` bytes).
2. Finds a contiguous block of that size in the heap (using a free-list or other allocator strategy).
3. Sets `p` to point to the start of that block.
4. The block's contents are UNDEFINED (not initialized to zero).

`dispose(p)` does the following:
1. Returns the block of memory pointed to by `p` to the heap's free list.
2. The value of `p` itself is NOT changed -- it still holds the old address (a dangling pointer).
3. The contents of the freed memory may be overwritten by subsequent allocations.

### Common Pitfalls

```pascal
program PointerPitfalls;
var
  p, q: ^integer;
begin
  { Pitfall 1: Using uninitialized pointer }
  { p^ := 42;   -- CRASH: p points to garbage address }

  { Pitfall 2: Memory leak }
  new(p);
  p^ := 42;
  new(p);      { LEAK! The first allocation is now unreachable }
  p^ := 99;    { Only this allocation is accessible }
  dispose(p);  { Only this one gets freed; the first 42 is leaked }

  { Pitfall 3: Double free }
  new(p);
  p^ := 42;
  dispose(p);
  { dispose(p);  -- CRASH or heap corruption: double free }

  { Pitfall 4: Dangling pointer }
  new(p);
  p^ := 42;
  q := p;       { q and p point to the same memory }
  dispose(p);   { memory freed }
  p := nil;     { p is safely nil }
  { writeln(q^);  -- UNDEFINED BEHAVIOR: q is dangling }

  { Pitfall 5: Using after dispose }
  new(p);
  p^ := 42;
  dispose(p);
  { p^ := 99;    -- UNDEFINED BEHAVIOR: p is dangling }

  { Best practice: always nil after dispose }
  new(p);
  p^ := 42;
  dispose(p);
  p := nil;
  if p <> nil then
    writeln(p^)
  else
    writeln('p is nil -- safe');
end.
```

## 9. The Forward Reference Rule

Pascal is a single-pass compiled language. The compiler reads the source code from top to bottom, exactly once. This means that every identifier must be declared before it is used. But this creates a problem for recursive data structures: how do you declare a node type that contains a pointer to another node of the same type?

```pascal
{ THIS DOES NOT WORK: }
type
  TNode = record
    data: integer;
    next: ^TNode;    { ERROR: TNode is not yet fully defined }
  end;
```

Pascal solves this with a special exception to the declaration-before-use rule: a pointer type can reference a type name that has not yet been declared, as long as that type is declared later in the SAME type declaration block:

```pascal
type
  { Forward reference: PNode refers to TNode, which hasn't been declared yet }
  PNode = ^TNode;

  { TNode is declared in the same type block -- the forward reference is resolved }
  TNode = record
    data: integer;
    next: PNode;     { PNode is already declared }
  end;
```

This is the ONLY forward reference allowed in Pascal's type system. It exists specifically to enable recursive data structures. Without it, you could not define linked lists, trees, graphs, or any other pointer-based data structure in Pascal.

The rule has a subtle requirement: both the pointer type and the referenced type must appear in the same `type` block. The following does NOT work:

```pascal
type
  PNode = ^TNode;    { forward reference to TNode }

var
  x: integer;        { this separates the type blocks }

type
  TNode = record     { ERROR: different type block }
    data: integer;
    next: PNode;
  end;
```

### Complete Example: Declaring Recursive Types

```pascal
program ForwardReferences;
type
  { Singly linked list node }
  PListNode = ^TListNode;
  TListNode = record
    data: integer;
    next: PListNode;
  end;

  { Binary tree node }
  PTreeNode = ^TTreeNode;
  TTreeNode = record
    value: integer;
    left, right: PTreeNode;
  end;

  { Doubly linked list node }
  PDLNode = ^TDLNode;
  TDLNode = record
    data: integer;
    prev, next: PDLNode;
  end;

  { Mutually recursive types (both in same type block) }
  PExpr = ^TExpr;
  PStmt = ^TStmt;

  TExpr = record
    value: integer;
    parent: PStmt;     { expression refers to statement }
  end;

  TStmt = record
    expr: PExpr;       { statement refers to expression }
    next: PStmt;
  end;

var
  list: PListNode;
  tree: PTreeNode;
begin
  { Create a simple linked list node }
  new(list);
  list^.data := 42;
  list^.next := nil;
  writeln('List node: ', list^.data);

  { Create a simple tree node }
  new(tree);
  tree^.value := 10;
  tree^.left := nil;
  tree^.right := nil;
  writeln('Tree node: ', tree^.value);

  dispose(list);
  dispose(tree);
end.
```

This forward reference mechanism influenced subsequent language design:
- **C:** Uses forward declarations (`struct Node;`) followed by full definitions. More flexible than Pascal (the forward declaration and definition can be in different scopes) but also more error-prone.
- **Ada:** Uses `access` types with incomplete type declarations, similar to Pascal.
- **Rust:** Does not need forward references because the compiler makes multiple passes.
- **Haskell/ML:** Mutual recursion is handled through `and` keywords or module systems.

## 10. The Heap Model

Understanding the heap is essential for writing correct Pascal programs that use dynamic memory. The heap is managed by the runtime system, and different Pascal implementations use different strategies:

### Standard Pascal Heap

Standard Pascal provides `new` and `dispose` as the only heap operations. The runtime maintains a free list of available memory blocks. `new` finds a block of the right size; `dispose` returns a block to the free list.

### Mark/Release (Turbo Pascal)

Turbo Pascal offered an alternative to `dispose` called the Mark/Release mechanism:

```pascal
program MarkRelease;
var
  p1, p2, p3: ^integer;
  heapMark: pointer;  { saves heap state }
begin
  new(p1);
  p1^ := 10;

  { Save the current heap state }
  mark(heapMark);

  { Allocate temporary data }
  new(p2);
  p2^ := 20;
  new(p3);
  p3^ := 30;

  writeln('p1^ = ', p1^);  { 10 }
  writeln('p2^ = ', p2^);  { 20 }
  writeln('p3^ = ', p3^);  { 30 }

  { Release everything allocated since the mark }
  release(heapMark);
  { p2 and p3 are now invalid -- their memory has been reclaimed }
  { p1 is still valid -- it was allocated before the mark }

  writeln('p1^ = ', p1^);  { still 10 }
  { writeln('p2^ = ', p2^);  -- INVALID: memory reclaimed }

  dispose(p1);
end.
```

Mark/Release works like a stack-based allocator: `mark` saves the current top of the heap, and `release` resets the heap top to the saved position, effectively deallocating everything allocated since the mark. This is extremely efficient (O(1) for both operations) but has a severe limitation: you cannot selectively free individual allocations made between the mark and release. Everything goes at once.

This pattern is useful for temporary data structures that are built, used, and discarded as a unit. It is essentially the same concept as arena allocation (which we cover in Part 10) and has direct descendants in modern systems:
- **Apache APR:** Memory pools with bulk deallocation.
- **Go:** The arena allocator experiment (Go 1.20).
- **Zig:** Arena allocators are a core pattern.
- **Rust:** The `bumpalo` crate implements bump/arena allocation.

### Heap Fragmentation

Over time, as blocks are allocated and freed in different orders, the heap can become fragmented -- free memory exists but is scattered in small, non-contiguous chunks:

```
Heap after many new/dispose operations:
+------+----+--------+----+------+----+----------+----+------+
| Used | Free | Used  | Free | Used | Free | Used   | Free | Used |
+------+----+--------+----+------+----+----------+----+------+

Total free memory: 1000 bytes
Largest contiguous free block: 200 bytes
Request for 500 bytes: FAILS despite having 1000 bytes free!
```

Turbo Pascal's Mark/Release avoids fragmentation by always deallocating from the end of the heap, keeping it compact. The trade-off is reduced flexibility.

Modern Pascal compilers (Free Pascal, Delphi) use sophisticated heap managers that employ strategies like:
- **First-fit, best-fit, or next-fit** allocation algorithms
- **Coalescing** adjacent free blocks when `dispose` is called
- **Size-class segregation** (allocating small objects from separate pools)
- Free Pascal's heap manager uses a design similar to Doug Lea's `dlmalloc`

---

# Part 3: Linked Lists (Complete Treatment)

Linked lists are the first data structure that truly requires dynamic memory and pointers. They are the gateway to understanding all pointer-based data structures in Pascal. We will treat them thoroughly, with complete, compilable programs for every variant.

## 11. Singly Linked List

A singly linked list is a sequence of nodes where each node contains a data element and a pointer to the next node. The last node's `next` pointer is `nil`, marking the end of the list.

```
Head
  |
  v
+------+---+    +------+---+    +------+---+    +------+------+
| data | *-+--->| data | *-+--->| data | *-+--->| data | nil  |
+------+---+    +------+---+    +------+---+    +------+------+
  10               20              30              40
```

### Complete Singly Linked List Implementation

```pascal
program SinglyLinkedList;
{
  Complete implementation of a singly linked list with all
  fundamental operations. Compilable with Free Pascal.
}

type
  PNode = ^TNode;
  TNode = record
    data: integer;
    next: PNode;
  end;

{ --- Creation and Insertion --- }

{ Insert a new node at the head of the list }
procedure InsertHead(var head: PNode; value: integer);
var
  newNode: PNode;
begin
  new(newNode);
  newNode^.data := value;
  newNode^.next := head;
  head := newNode;
end;

{ Insert a new node at the tail of the list }
procedure InsertTail(var head: PNode; value: integer);
var
  newNode, current: PNode;
begin
  new(newNode);
  newNode^.data := value;
  newNode^.next := nil;

  if head = nil then
    head := newNode
  else
  begin
    current := head;
    while current^.next <> nil do
      current := current^.next;
    current^.next := newNode;
  end;
end;

{ Insert a new node after a given node }
procedure InsertAfter(node: PNode; value: integer);
var
  newNode: PNode;
begin
  if node = nil then
  begin
    writeln('Error: cannot insert after nil node');
    exit;
  end;
  new(newNode);
  newNode^.data := value;
  newNode^.next := node^.next;
  node^.next := newNode;
end;

{ --- Traversal --- }

{ Print all elements (iterative) }
procedure PrintList(head: PNode);
var
  current: PNode;
begin
  current := head;
  write('[');
  while current <> nil do
  begin
    write(current^.data);
    if current^.next <> nil then
      write(' -> ');
    current := current^.next;
  end;
  writeln(']');
end;

{ Print all elements (recursive) }
procedure PrintListRecursive(node: PNode);
begin
  if node = nil then
  begin
    writeln(']');
    exit;
  end;

  if node^.next = nil then
    write(node^.data)
  else
  begin
    write(node^.data, ' -> ');
  end;
  PrintListRecursive(node^.next);
end;

{ --- Searching --- }

{ Search for a value; return the node or nil }
function Search(head: PNode; value: integer): PNode;
var
  current: PNode;
begin
  current := head;
  while current <> nil do
  begin
    if current^.data = value then
    begin
      Search := current;
      exit;
    end;
    current := current^.next;
  end;
  Search := nil;
end;

{ Search recursively }
function SearchRecursive(node: PNode; value: integer): PNode;
begin
  if node = nil then
    SearchRecursive := nil
  else if node^.data = value then
    SearchRecursive := node
  else
    SearchRecursive := SearchRecursive(node^.next, value);
end;

{ --- Counting --- }

{ Count the number of nodes (iterative) }
function CountNodes(head: PNode): integer;
var
  current: PNode;
  count: integer;
begin
  count := 0;
  current := head;
  while current <> nil do
  begin
    count := count + 1;
    current := current^.next;
  end;
  CountNodes := count;
end;

{ Count nodes (recursive) }
function CountRecursive(node: PNode): integer;
begin
  if node = nil then
    CountRecursive := 0
  else
    CountRecursive := 1 + CountRecursive(node^.next);
end;

{ --- Deletion --- }

{ Delete the head node }
procedure DeleteHead(var head: PNode);
var
  temp: PNode;
begin
  if head = nil then
  begin
    writeln('Error: list is empty');
    exit;
  end;
  temp := head;
  head := head^.next;
  dispose(temp);
end;

{ Delete the tail node }
procedure DeleteTail(var head: PNode);
var
  current, prev: PNode;
begin
  if head = nil then
  begin
    writeln('Error: list is empty');
    exit;
  end;

  { Single node list }
  if head^.next = nil then
  begin
    dispose(head);
    head := nil;
    exit;
  end;

  { Find the second-to-last node }
  current := head;
  prev := nil;
  while current^.next <> nil do
  begin
    prev := current;
    current := current^.next;
  end;

  { Remove the last node }
  prev^.next := nil;
  dispose(current);
end;

{ Delete the first node with a given value }
procedure DeleteValue(var head: PNode; value: integer);
var
  current, prev: PNode;
begin
  if head = nil then
  begin
    writeln('Error: list is empty');
    exit;
  end;

  { Special case: head node has the value }
  if head^.data = value then
  begin
    DeleteHead(head);
    exit;
  end;

  { Search for the node }
  prev := head;
  current := head^.next;
  while (current <> nil) and (current^.data <> value) do
  begin
    prev := current;
    current := current^.next;
  end;

  if current = nil then
  begin
    writeln('Value ', value, ' not found');
    exit;
  end;

  {
    Pointer surgery for middle/tail deletion:

    Before:
    prev            current         current^.next
    +------+---+    +------+---+    +------+---+
    |  ... | *-+--->| value| *-+--->|  ... | *-+-->
    +------+---+    +------+---+    +------+---+

    After:
    prev                            current^.next
    +------+---+                    +------+---+
    |  ... | *-+-------+----------->|  ... | *-+-->
    +------+---+       |            +------+---+
                       |
                 current (disposed)
  }
  prev^.next := current^.next;
  dispose(current);
end;

{ --- Reversal --- }

{ Reverse the list (iterative) }
procedure ReverseList(var head: PNode);
var
  prev, current, nextNode: PNode;
begin
  {
    Iterative reversal: three-pointer technique

    Step by step for list [10 -> 20 -> 30 -> nil]:

    Initial: prev=nil, current=10, next=20
    +------+---+    +------+---+    +------+------+
    |  10  | *-+--->|  20  | *-+--->|  30  | nil  |
    +------+---+    +------+---+    +------+------+
      ^
    current
    prev=nil

    After step 1: prev=10, current=20, next=30
    +------+------+    +------+---+    +------+------+
    |  10  | nil  |<---+-* |  20  | *-+--->|  30  | nil  |
    +------+------+    +------+---+    +------+------+
                          ^
                       current
      prev=10

    After step 2: prev=20, current=30, next=nil
    +------+------+    +------+---+    +------+------+
    |  10  | nil  |<---+-* |  20  |<---+-* |  30  | nil  |
    +------+------+    +------+---+    +------+------+
                                          ^
                                       current
                          prev=20

    After step 3: prev=30, current=nil
    +------+------+    +------+---+    +------+---+
    |  10  | nil  |<---+-* |  20  |<---+-* |  30  |
    +------+------+    +------+---+    +------+---+
                                          ^
                                        prev=30
    head := prev  =>  [30 -> 20 -> 10 -> nil]
  }

  prev := nil;
  current := head;
  while current <> nil do
  begin
    nextNode := current^.next;   { save next }
    current^.next := prev;       { reverse the link }
    prev := current;             { advance prev }
    current := nextNode;         { advance current }
  end;
  head := prev;
end;

{ Reverse the list (recursive) }
procedure ReverseListRecursive(var head: PNode);
  procedure DoReverse(current: PNode; var newHead: PNode);
  begin
    if current^.next = nil then
    begin
      { Base case: last node becomes new head }
      newHead := current;
      exit;
    end;
    DoReverse(current^.next, newHead);
    { After recursion: current^.next^.next should point back to current }
    current^.next^.next := current;
    current^.next := nil;
  end;

begin
  if (head = nil) or (head^.next = nil) then
    exit;  { empty or single-node list is already reversed }
  DoReverse(head, head);
end;

{ --- Cleanup --- }

{ Dispose of the entire list }
procedure FreeList(var head: PNode);
var
  current, temp: PNode;
begin
  current := head;
  while current <> nil do
  begin
    temp := current;
    current := current^.next;
    dispose(temp);
  end;
  head := nil;
end;

{ --- Main Program --- }

var
  list: PNode;
  found: PNode;
begin
  list := nil;

  writeln('=== Singly Linked List Demo ===');
  writeln;

  { Build a list using InsertTail }
  writeln('Building list with InsertTail (10, 20, 30, 40, 50):');
  InsertTail(list, 10);
  InsertTail(list, 20);
  InsertTail(list, 30);
  InsertTail(list, 40);
  InsertTail(list, 50);
  PrintList(list);
  writeln('Count: ', CountNodes(list));
  writeln;

  { Insert at head }
  writeln('InsertHead(5):');
  InsertHead(list, 5);
  PrintList(list);
  writeln;

  { Insert after a node }
  found := Search(list, 30);
  if found <> nil then
  begin
    writeln('InsertAfter(30, 35):');
    InsertAfter(found, 35);
    PrintList(list);
    writeln;
  end;

  { Search }
  writeln('Search for 35: ');
  found := Search(list, 35);
  if found <> nil then
    writeln('  Found: ', found^.data)
  else
    writeln('  Not found');

  writeln('Search for 99: ');
  found := SearchRecursive(list, 99);
  if found <> nil then
    writeln('  Found: ', found^.data)
  else
    writeln('  Not found');
  writeln;

  { Deletion }
  writeln('Delete head:');
  DeleteHead(list);
  PrintList(list);

  writeln('Delete tail:');
  DeleteTail(list);
  PrintList(list);

  writeln('Delete value 35:');
  DeleteValue(list, 35);
  PrintList(list);
  writeln;

  { Reversal }
  writeln('Before reverse:');
  PrintList(list);
  writeln('After iterative reverse:');
  ReverseList(list);
  PrintList(list);
  writeln('After recursive reverse (back to original):');
  ReverseListRecursive(list);
  PrintList(list);
  writeln;

  writeln('Recursive print:');
  write('[');
  PrintListRecursive(list);
  writeln;
  writeln('Recursive count: ', CountRecursive(list));

  { Clean up }
  FreeList(list);
  writeln;
  writeln('After FreeList: list is nil = ', list = nil);
end.
```

## 12. Doubly Linked List

A doubly linked list adds a `prev` pointer to each node, enabling bidirectional traversal. This makes deletion O(1) when you have a pointer to the node (no need to find the predecessor), and enables backward traversal.

```
               Head                                            Tail
                |                                               |
                v                                               v
          +------+------+---+    +---+------+---+    +---+------+------+
nil <---+-| prev | data | *-+--->| * | data | *-+--->| * | data | prev |-+---> nil
          +------+------+---+    +---+------+---+    +---+------+------+
                  10                   20                   30
```

### Complete Doubly Linked List Implementation

```pascal
program DoublyLinkedList;
type
  PDLNode = ^TDLNode;
  TDLNode = record
    data: integer;
    prev, next: PDLNode;
  end;

  TDoublyLinkedList = record
    head, tail: PDLNode;
    count: integer;
  end;

{ Initialize an empty list }
procedure InitList(var list: TDoublyLinkedList);
begin
  list.head := nil;
  list.tail := nil;
  list.count := 0;
end;

{ Insert at the head }
procedure InsertHead(var list: TDoublyLinkedList; value: integer);
var
  newNode: PDLNode;
begin
  new(newNode);
  newNode^.data := value;
  newNode^.prev := nil;
  newNode^.next := list.head;

  if list.head <> nil then
    list.head^.prev := newNode
  else
    list.tail := newNode;   { was empty; new node is also tail }

  list.head := newNode;
  list.count := list.count + 1;
end;

{ Insert at the tail }
procedure InsertTail(var list: TDoublyLinkedList; value: integer);
var
  newNode: PDLNode;
begin
  new(newNode);
  newNode^.data := value;
  newNode^.next := nil;
  newNode^.prev := list.tail;

  if list.tail <> nil then
    list.tail^.next := newNode
  else
    list.head := newNode;   { was empty; new node is also head }

  list.tail := newNode;
  list.count := list.count + 1;
end;

{ Insert after a given node }
procedure InsertAfterNode(var list: TDoublyLinkedList;
                          node: PDLNode; value: integer);
var
  newNode: PDLNode;
begin
  if node = nil then exit;

  new(newNode);
  newNode^.data := value;
  newNode^.prev := node;
  newNode^.next := node^.next;

  if node^.next <> nil then
    node^.next^.prev := newNode
  else
    list.tail := newNode;   { inserting after the current tail }

  node^.next := newNode;
  list.count := list.count + 1;
end;

{ Insert before a given node }
procedure InsertBeforeNode(var list: TDoublyLinkedList;
                           node: PDLNode; value: integer);
var
  newNode: PDLNode;
begin
  if node = nil then exit;

  new(newNode);
  newNode^.data := value;
  newNode^.next := node;
  newNode^.prev := node^.prev;

  if node^.prev <> nil then
    node^.prev^.next := newNode
  else
    list.head := newNode;   { inserting before the current head }

  node^.prev := newNode;
  list.count := list.count + 1;
end;

{ Delete a specific node }
procedure DeleteNode(var list: TDoublyLinkedList; node: PDLNode);
begin
  if node = nil then exit;

  {
    Pointer surgery for doubly-linked deletion:

    Before:
    +---+------+---+    +---+------+---+    +---+------+---+
    | * | prev | *-+--->| * | NODE | *-+--->| * | next | * |
    +---+------+---+    +---+------+---+    +---+------+---+
          <---+-*  |          <---+-*  |

    After:
    +---+------+---+                        +---+------+---+
    | * | prev | *-+----------------------->| * | next | * |
    +---+------+---+                        +---+------+---+
          <--------------------------------+-*  |

    Both the prev and next links must be updated.
  }

  if node^.prev <> nil then
    node^.prev^.next := node^.next
  else
    list.head := node^.next;   { deleting the head }

  if node^.next <> nil then
    node^.next^.prev := node^.prev
  else
    list.tail := node^.prev;   { deleting the tail }

  list.count := list.count - 1;
  dispose(node);
end;

{ Delete by value (first occurrence) }
procedure DeleteValue(var list: TDoublyLinkedList; value: integer);
var
  current: PDLNode;
begin
  current := list.head;
  while current <> nil do
  begin
    if current^.data = value then
    begin
      DeleteNode(list, current);
      exit;
    end;
    current := current^.next;
  end;
  writeln('Value ', value, ' not found');
end;

{ Search for a value }
function Search(list: TDoublyLinkedList; value: integer): PDLNode;
var
  current: PDLNode;
begin
  current := list.head;
  while current <> nil do
  begin
    if current^.data = value then
    begin
      Search := current;
      exit;
    end;
    current := current^.next;
  end;
  Search := nil;
end;

{ Print forward }
procedure PrintForward(list: TDoublyLinkedList);
var
  current: PDLNode;
begin
  current := list.head;
  write('Forward:  [');
  while current <> nil do
  begin
    write(current^.data);
    if current^.next <> nil then
      write(' <-> ');
    current := current^.next;
  end;
  writeln(']');
end;

{ Print backward }
procedure PrintBackward(list: TDoublyLinkedList);
var
  current: PDLNode;
begin
  current := list.tail;
  write('Backward: [');
  while current <> nil do
  begin
    write(current^.data);
    if current^.prev <> nil then
      write(' <-> ');
    current := current^.prev;
  end;
  writeln(']');
end;

{ Free the entire list }
procedure FreeList(var list: TDoublyLinkedList);
var
  current, temp: PDLNode;
begin
  current := list.head;
  while current <> nil do
  begin
    temp := current;
    current := current^.next;
    dispose(temp);
  end;
  list.head := nil;
  list.tail := nil;
  list.count := 0;
end;

{ --- Main Program --- }
var
  list: TDoublyLinkedList;
  node: PDLNode;
begin
  InitList(list);

  writeln('=== Doubly Linked List Demo ===');
  writeln;

  { Build the list }
  InsertTail(list, 10);
  InsertTail(list, 20);
  InsertTail(list, 30);
  InsertTail(list, 40);
  InsertTail(list, 50);

  writeln('Initial list (count=', list.count, '):');
  PrintForward(list);
  PrintBackward(list);
  writeln;

  { Insert at head }
  InsertHead(list, 5);
  writeln('After InsertHead(5):');
  PrintForward(list);
  writeln;

  { Insert after node with value 30 }
  node := Search(list, 30);
  if node <> nil then
  begin
    InsertAfterNode(list, node, 35);
    writeln('After InsertAfter(30, 35):');
    PrintForward(list);
  end;
  writeln;

  { Insert before node with value 20 }
  node := Search(list, 20);
  if node <> nil then
  begin
    InsertBeforeNode(list, node, 15);
    writeln('After InsertBefore(20, 15):');
    PrintForward(list);
  end;
  writeln;

  { Delete by value }
  writeln('After DeleteValue(35):');
  DeleteValue(list, 35);
  PrintForward(list);
  PrintBackward(list);
  writeln;

  writeln('Final count: ', list.count);
  FreeList(list);
end.
```

### Singly vs. Doubly Linked: Trade-offs

| Operation | Singly Linked | Doubly Linked |
|-----------|--------------|---------------|
| Memory per node | 1 pointer | 2 pointers |
| Insert at head | O(1) | O(1) |
| Insert at tail (with tail ptr) | O(1) | O(1) |
| Delete given node | O(n) -- must find predecessor | O(1) -- predecessor is `prev` |
| Traverse forward | Yes | Yes |
| Traverse backward | No | Yes |
| Reverse | O(n) | O(n), but trivial with head/tail swap |

## 13. Circular Linked List

In a circular linked list, the last node's `next` pointer points back to the first node instead of being `nil`. This creates a ring structure with no beginning or end:

```
         +------+---+    +------+---+    +------+---+
    +--->|  10  | *-+--->|  20  | *-+--->|  30  | *-+---+
    |    +------+---+    +------+---+    +------+---+   |
    |                                                   |
    +---------------------------------------------------+
         ^
         |
        tail (or head -- pick a convention)
```

### Complete Circular Linked List Implementation

```pascal
program CircularLinkedList;
type
  PNode = ^TNode;
  TNode = record
    data: integer;
    next: PNode;
  end;

{ We track the TAIL node. head = tail^.next }
{ This gives O(1) insertion at both head and tail }

{ Insert at head (after tail, which wraps to front) }
procedure InsertHead(var tail: PNode; value: integer);
var
  newNode: PNode;
begin
  new(newNode);
  newNode^.data := value;

  if tail = nil then
  begin
    { First node: points to itself }
    newNode^.next := newNode;
    tail := newNode;
  end
  else
  begin
    { Insert between tail and the current head }
    newNode^.next := tail^.next;
    tail^.next := newNode;
  end;
end;

{ Insert at tail }
procedure InsertTail(var tail: PNode; value: integer);
begin
  InsertHead(tail, value);  { same as insert head... }
  tail := tail^.next;       { ...then advance tail to the new node }
end;

{ Delete head (first node after tail) }
procedure DeleteHead(var tail: PNode);
var
  head: PNode;
begin
  if tail = nil then
  begin
    writeln('Error: list is empty');
    exit;
  end;

  head := tail^.next;

  if head = tail then
  begin
    { Only one node }
    dispose(head);
    tail := nil;
  end
  else
  begin
    tail^.next := head^.next;
    dispose(head);
  end;
end;

{ Print the circular list }
procedure PrintList(tail: PNode);
var
  current: PNode;
begin
  if tail = nil then
  begin
    writeln('(empty)');
    exit;
  end;

  current := tail^.next;   { start at head }
  write('[');
  repeat
    write(current^.data);
    current := current^.next;
    if current <> tail^.next then
      write(' -> ');
  until current = tail^.next;   { stop when we wrap around }
  writeln(' -> (back to head)]');
end;

{ Count nodes }
function CountNodes(tail: PNode): integer;
var
  current: PNode;
  count: integer;
begin
  if tail = nil then
  begin
    CountNodes := 0;
    exit;
  end;

  count := 0;
  current := tail^.next;
  repeat
    count := count + 1;
    current := current^.next;
  until current = tail^.next;

  CountNodes := count;
end;

{ Josephus problem: n people in a circle, eliminate every k-th person }
function Josephus(n, k: integer): integer;
var
  tail, current, temp: PNode;
  i, step: integer;
begin
  { Build a circular list of n people }
  tail := nil;
  for i := 1 to n do
    InsertTail(tail, i);

  { Eliminate every k-th person }
  current := tail;
  while current^.next <> current do  { while more than one person }
  begin
    { Move k-1 steps (so current^.next is the k-th person) }
    for step := 1 to k - 1 do
      current := current^.next;

    { Eliminate current^.next }
    temp := current^.next;
    write(temp^.data, ' ');
    current^.next := temp^.next;
    dispose(temp);
  end;

  writeln;
  Josephus := current^.data;
  dispose(current);
end;

{ Free all nodes }
procedure FreeList(var tail: PNode);
var
  current, temp, head: PNode;
begin
  if tail = nil then exit;

  head := tail^.next;
  current := head;
  repeat
    temp := current;
    current := current^.next;
    dispose(temp);
  until current = head;

  tail := nil;
end;

{ --- Main Program --- }
var
  tail: PNode;
  survivor: integer;
begin
  tail := nil;

  writeln('=== Circular Linked List Demo ===');
  writeln;

  InsertTail(tail, 10);
  InsertTail(tail, 20);
  InsertTail(tail, 30);
  InsertTail(tail, 40);
  InsertTail(tail, 50);

  writeln('Circular list:');
  PrintList(tail);
  writeln('Count: ', CountNodes(tail));
  writeln;

  InsertHead(tail, 5);
  writeln('After InsertHead(5):');
  PrintList(tail);
  writeln;

  DeleteHead(tail);
  writeln('After DeleteHead:');
  PrintList(tail);
  writeln;

  FreeList(tail);

  { Josephus problem }
  writeln('=== Josephus Problem ===');
  writeln('7 people, eliminate every 3rd:');
  write('Elimination order: ');
  survivor := Josephus(7, 3);
  writeln('Survivor: person #', survivor);
  writeln;

  writeln('41 people, eliminate every 3rd (the historical problem):');
  write('Elimination order: ');
  survivor := Josephus(41, 3);
  writeln('Survivor: person #', survivor);
end.
```

## 14. Sorted Linked List

A sorted linked list maintains elements in order. Insertion requires finding the correct position, but the list is always sorted for retrieval:

```pascal
program SortedLinkedList;
type
  PNode = ^TNode;
  TNode = record
    data: integer;
    next: PNode;
  end;

{ Insert maintaining sorted order (ascending) }
procedure InsertSorted(var head: PNode; value: integer);
var
  newNode, current, prev: PNode;
begin
  new(newNode);
  newNode^.data := value;
  newNode^.next := nil;

  { Empty list or insert before head }
  if (head = nil) or (value <= head^.data) then
  begin
    newNode^.next := head;
    head := newNode;
    exit;
  end;

  { Find the insertion point }
  prev := head;
  current := head^.next;
  while (current <> nil) and (current^.data < value) do
  begin
    prev := current;
    current := current^.next;
  end;

  { Insert between prev and current }
  newNode^.next := current;
  prev^.next := newNode;
end;

{ Merge two sorted lists into one sorted list (non-destructive) }
function MergeSorted(a, b: PNode): PNode;
var
  result, tail: PNode;

  procedure Append(var resultHead, resultTail: PNode; value: integer);
  var
    newNode: PNode;
  begin
    new(newNode);
    newNode^.data := value;
    newNode^.next := nil;
    if resultHead = nil then
    begin
      resultHead := newNode;
      resultTail := newNode;
    end
    else
    begin
      resultTail^.next := newNode;
      resultTail := newNode;
    end;
  end;

begin
  result := nil;
  tail := nil;

  while (a <> nil) and (b <> nil) do
  begin
    if a^.data <= b^.data then
    begin
      Append(result, tail, a^.data);
      a := a^.next;
    end
    else
    begin
      Append(result, tail, b^.data);
      b := b^.next;
    end;
  end;

  while a <> nil do
  begin
    Append(result, tail, a^.data);
    a := a^.next;
  end;

  while b <> nil do
  begin
    Append(result, tail, b^.data);
    b := b^.next;
  end;

  MergeSorted := result;
end;

procedure PrintList(head: PNode);
var
  current: PNode;
begin
  current := head;
  write('[');
  while current <> nil do
  begin
    write(current^.data);
    if current^.next <> nil then
      write(', ');
    current := current^.next;
  end;
  writeln(']');
end;

procedure FreeList(var head: PNode);
var
  temp: PNode;
begin
  while head <> nil do
  begin
    temp := head;
    head := head^.next;
    dispose(temp);
  end;
end;

var
  list1, list2, merged: PNode;
begin
  list1 := nil;
  list2 := nil;

  writeln('=== Sorted Linked List Demo ===');
  writeln;

  { Insert in random order; list stays sorted }
  InsertSorted(list1, 30);
  InsertSorted(list1, 10);
  InsertSorted(list1, 50);
  InsertSorted(list1, 20);
  InsertSorted(list1, 40);

  writeln('Sorted list 1:');
  PrintList(list1);

  InsertSorted(list2, 25);
  InsertSorted(list2, 15);
  InsertSorted(list2, 45);
  InsertSorted(list2, 35);
  InsertSorted(list2, 5);

  writeln('Sorted list 2:');
  PrintList(list2);

  { Merge }
  merged := MergeSorted(list1, list2);
  writeln('Merged:');
  PrintList(merged);

  FreeList(list1);
  FreeList(list2);
  FreeList(merged);
end.
```

---

# Part 4: Stacks and Queues

Stacks and queues are abstract data types that restrict how elements are accessed. A stack enforces last-in-first-out (LIFO) order; a queue enforces first-in-first-out (FIFO) order. Both can be implemented with arrays or linked lists in Pascal.

## 15. Stack (Array-Based)

```pascal
program ArrayStack;
const
  MaxSize = 100;

type
  TStack = record
    items: array[1..MaxSize] of integer;
    top: integer;  { index of the top element; 0 when empty }
  end;

procedure InitStack(var s: TStack);
begin
  s.top := 0;
end;

function IsEmpty(const s: TStack): boolean;
begin
  IsEmpty := s.top = 0;
end;

function IsFull(const s: TStack): boolean;
begin
  IsFull := s.top = MaxSize;
end;

procedure Push(var s: TStack; value: integer);
begin
  if IsFull(s) then
  begin
    writeln('Error: stack overflow');
    exit;
  end;
  s.top := s.top + 1;
  s.items[s.top] := value;
end;

function Pop(var s: TStack): integer;
begin
  if IsEmpty(s) then
  begin
    writeln('Error: stack underflow');
    Pop := 0;
    exit;
  end;
  Pop := s.items[s.top];
  s.top := s.top - 1;
end;

function Peek(const s: TStack): integer;
begin
  if IsEmpty(s) then
  begin
    writeln('Error: stack is empty');
    Peek := 0;
    exit;
  end;
  Peek := s.items[s.top];
end;

function Size(const s: TStack): integer;
begin
  Size := s.top;
end;

{ === Application: Balanced Parentheses Checker === }

function CheckParentheses(expr: string): boolean;
var
  charStack: record
    items: array[1..100] of char;
    top: integer;
  end;
  i: integer;
  ch, expected: char;
begin
  charStack.top := 0;
  CheckParentheses := true;

  for i := 1 to length(expr) do
  begin
    ch := expr[i];

    { Push opening brackets }
    if (ch = '(') or (ch = '[') or (ch = '{') then
    begin
      charStack.top := charStack.top + 1;
      charStack.items[charStack.top] := ch;
    end
    { Check closing brackets }
    else if (ch = ')') or (ch = ']') or (ch = '}') then
    begin
      if charStack.top = 0 then
      begin
        CheckParentheses := false;
        exit;
      end;

      expected := charStack.items[charStack.top];
      charStack.top := charStack.top - 1;

      if ((ch = ')') and (expected <> '(')) or
         ((ch = ']') and (expected <> '[')) or
         ((ch = '}') and (expected <> '{')) then
      begin
        CheckParentheses := false;
        exit;
      end;
    end;
  end;

  CheckParentheses := charStack.top = 0;
end;

{ === Application: Reverse a String === }

function ReverseString(s: string): string;
var
  stack: TStack;
  i: integer;
  result: string;
begin
  InitStack(stack);
  for i := 1 to length(s) do
    Push(stack, ord(s[i]));

  result := '';
  while not IsEmpty(stack) do
    result := result + chr(Pop(stack));

  ReverseString := result;
end;

{ --- Main Program --- }
var
  s: TStack;
  i: integer;
  expr: string;
begin
  writeln('=== Array-Based Stack Demo ===');
  writeln;

  InitStack(s);

  { Push elements }
  for i := 1 to 5 do
  begin
    Push(s, i * 10);
    writeln('Pushed ', i * 10, ' (size=', Size(s), ')');
  end;
  writeln;

  writeln('Top: ', Peek(s));
  writeln;

  { Pop all elements }
  writeln('Popping all elements:');
  while not IsEmpty(s) do
    write(Pop(s), ' ');
  writeln;
  writeln;

  { Balanced parentheses }
  writeln('=== Balanced Parentheses ===');
  expr := '({[()]})';
  writeln('"', expr, '" balanced: ', CheckParentheses(expr));
  expr := '({[()]}';
  writeln('"', expr, '" balanced: ', CheckParentheses(expr));
  expr := '([)]';
  writeln('"', expr, '" balanced: ', CheckParentheses(expr));
  expr := '';
  writeln('"', expr, '" balanced: ', CheckParentheses(expr));
  writeln;

  { Reverse a string }
  writeln('=== Reverse String ===');
  writeln('Reversed "Hello Pascal": ', ReverseString('Hello Pascal'));
end.
```

## 16. Stack (Linked-List-Based)

```pascal
program LinkedStack;
type
  PNode = ^TNode;
  TNode = record
    data: integer;
    next: PNode;
  end;

  TStack = record
    top: PNode;
    count: integer;
  end;

procedure InitStack(var s: TStack);
begin
  s.top := nil;
  s.count := 0;
end;

function IsEmpty(const s: TStack): boolean;
begin
  IsEmpty := s.top = nil;
end;

procedure Push(var s: TStack; value: integer);
var
  newNode: PNode;
begin
  new(newNode);
  newNode^.data := value;
  newNode^.next := s.top;
  s.top := newNode;
  s.count := s.count + 1;
end;

function Pop(var s: TStack): integer;
var
  temp: PNode;
begin
  if IsEmpty(s) then
  begin
    writeln('Error: stack underflow');
    Pop := 0;
    exit;
  end;
  Pop := s.top^.data;
  temp := s.top;
  s.top := s.top^.next;
  dispose(temp);
  s.count := s.count - 1;
end;

function Peek(const s: TStack): integer;
begin
  if IsEmpty(s) then
  begin
    writeln('Error: stack is empty');
    Peek := 0;
    exit;
  end;
  Peek := s.top^.data;
end;

procedure FreeStack(var s: TStack);
var
  temp: PNode;
begin
  while s.top <> nil do
  begin
    temp := s.top;
    s.top := s.top^.next;
    dispose(temp);
  end;
  s.count := 0;
end;

{ === Application: Postfix Expression Evaluator === }

function EvalPostfix(expr: string): integer;
var
  s: TStack;
  i: integer;
  ch: char;
  a, b: integer;
begin
  InitStack(s);

  for i := 1 to length(expr) do
  begin
    ch := expr[i];

    if ch = ' ' then
      continue;

    if (ch >= '0') and (ch <= '9') then
      Push(s, ord(ch) - ord('0'))
    else
    begin
      b := Pop(s);   { second operand popped first }
      a := Pop(s);   { first operand }

      case ch of
        '+': Push(s, a + b);
        '-': Push(s, a - b);
        '*': Push(s, a * b);
        '/': if b <> 0 then Push(s, a div b)
             else begin writeln('Error: division by zero'); Push(s, 0); end;
      end;
    end;
  end;

  EvalPostfix := Pop(s);
  FreeStack(s);
end;

{ --- Main Program --- }
var
  s: TStack;
  i: integer;
begin
  writeln('=== Linked-List Stack Demo ===');
  writeln;

  InitStack(s);

  { Push and pop }
  for i := 1 to 5 do
    Push(s, i * 10);

  writeln('Stack contents (LIFO order):');
  while not IsEmpty(s) do
    write(Pop(s), ' ');
  writeln;
  writeln;

  { Postfix evaluation }
  writeln('=== Postfix Expression Evaluator ===');
  writeln('Expression: "5 3 + 2 *" = ', EvalPostfix('5 3 + 2 *'));
  writeln('Expression: "3 4 * 2 5 * +" = ', EvalPostfix('3 4 * 2 5 * +'));
  writeln('Expression: "9 3 / 2 +" = ', EvalPostfix('9 3 / 2 +'));
end.
```

## 17. Queue (Array-Based, Circular)

A circular queue uses an array where the indices wrap around, avoiding the problem of "phantom fullness" that occurs when elements are dequeued from a linear array:

```pascal
program CircularQueue;
const
  MaxSize = 8;   { small for demonstration }

type
  TQueue = record
    items: array[0..MaxSize-1] of integer;
    front: integer;   { index of the front element }
    rear: integer;    { index of the last element }
    count: integer;   { number of elements }
  end;

procedure InitQueue(var q: TQueue);
begin
  q.front := 0;
  q.rear := -1;
  q.count := 0;
end;

function IsEmpty(const q: TQueue): boolean;
begin
  IsEmpty := q.count = 0;
end;

function IsFull(const q: TQueue): boolean;
begin
  IsFull := q.count = MaxSize;
end;

procedure Enqueue(var q: TQueue; value: integer);
begin
  if IsFull(q) then
  begin
    writeln('Error: queue is full');
    exit;
  end;
  q.rear := (q.rear + 1) mod MaxSize;   { wrap around }
  q.items[q.rear] := value;
  q.count := q.count + 1;
end;

function Dequeue(var q: TQueue): integer;
begin
  if IsEmpty(q) then
  begin
    writeln('Error: queue is empty');
    Dequeue := 0;
    exit;
  end;
  Dequeue := q.items[q.front];
  q.front := (q.front + 1) mod MaxSize;  { wrap around }
  q.count := q.count - 1;
end;

function Front(const q: TQueue): integer;
begin
  if IsEmpty(q) then
  begin
    writeln('Error: queue is empty');
    Front := 0;
    exit;
  end;
  Front := q.items[q.front];
end;

procedure PrintQueue(const q: TQueue);
var
  i, idx: integer;
begin
  write('Queue [front=', q.front, ', rear=', q.rear,
        ', count=', q.count, ']: ');
  if IsEmpty(q) then
  begin
    writeln('(empty)');
    exit;
  end;

  write('[');
  for i := 0 to q.count - 1 do
  begin
    idx := (q.front + i) mod MaxSize;
    write(q.items[idx]);
    if i < q.count - 1 then
      write(', ');
  end;
  writeln(']');
end;

{
  Circular array visualization (MaxSize=8):

  After enqueue 10,20,30,40:
  +----+----+----+----+----+----+----+----+
  | 10 | 20 | 30 | 40 |    |    |    |    |
  +----+----+----+----+----+----+----+----+
    ^front              ^rear

  After dequeue twice (10,20 removed):
  +----+----+----+----+----+----+----+----+
  |    |    | 30 | 40 |    |    |    |    |
  +----+----+----+----+----+----+----+----+
              ^front    ^rear

  After enqueue 50,60,70,80,90:
  +----+----+----+----+----+----+----+----+
  | 90 |    | 30 | 40 | 50 | 60 | 70 | 80 |
  +----+----+----+----+----+----+----+----+
    ^rear    ^front
  (wrapped around!)
}

{ --- Main Program --- }
var
  q: TQueue;
  i: integer;
begin
  writeln('=== Circular Array Queue Demo ===');
  writeln;

  InitQueue(q);

  { Enqueue elements }
  for i := 1 to 5 do
  begin
    Enqueue(q, i * 10);
    writeln('Enqueued ', i * 10);
  end;
  PrintQueue(q);
  writeln;

  { Dequeue some }
  for i := 1 to 3 do
    writeln('Dequeued: ', Dequeue(q));
  PrintQueue(q);
  writeln;

  { Enqueue more (demonstrating wrap-around) }
  for i := 6 to 10 do
  begin
    Enqueue(q, i * 10);
    writeln('Enqueued ', i * 10);
  end;
  PrintQueue(q);
  writeln;

  { Dequeue all }
  writeln('Dequeuing all:');
  while not IsEmpty(q) do
    write(Dequeue(q), ' ');
  writeln;
end.
```

## 18. Queue (Linked-List-Based)

```pascal
program LinkedQueue;
type
  PNode = ^TNode;
  TNode = record
    data: integer;
    next: PNode;
  end;

  TQueue = record
    front, rear: PNode;
    count: integer;
  end;

procedure InitQueue(var q: TQueue);
begin
  q.front := nil;
  q.rear := nil;
  q.count := 0;
end;

function IsEmpty(const q: TQueue): boolean;
begin
  IsEmpty := q.front = nil;
end;

procedure Enqueue(var q: TQueue; value: integer);
var
  newNode: PNode;
begin
  new(newNode);
  newNode^.data := value;
  newNode^.next := nil;

  if q.rear <> nil then
    q.rear^.next := newNode
  else
    q.front := newNode;

  q.rear := newNode;
  q.count := q.count + 1;
end;

function Dequeue(var q: TQueue): integer;
var
  temp: PNode;
begin
  if IsEmpty(q) then
  begin
    writeln('Error: queue is empty');
    Dequeue := 0;
    exit;
  end;

  Dequeue := q.front^.data;
  temp := q.front;
  q.front := q.front^.next;

  if q.front = nil then
    q.rear := nil;

  dispose(temp);
  q.count := q.count - 1;
end;

procedure FreeQueue(var q: TQueue);
begin
  while not IsEmpty(q) do
    Dequeue(q);
end;

{ --- Main Program --- }
var
  q: TQueue;
  i: integer;
begin
  writeln('=== Linked-List Queue Demo ===');
  writeln;

  InitQueue(q);
  for i := 1 to 5 do
    Enqueue(q, i * 10);

  writeln('Dequeuing (FIFO order):');
  while not IsEmpty(q) do
    write(Dequeue(q), ' ');
  writeln;
end.
```

## 19. Priority Queue

A priority queue returns elements in order of priority, not insertion order. We show two implementations: sorted linked list and binary heap.

### Sorted Linked List Priority Queue

```pascal
program PriorityQueueLinked;
type
  PPQNode = ^TPQNode;
  TPQNode = record
    data: integer;
    priority: integer;   { lower number = higher priority }
    next: PPQNode;
  end;

  TPriorityQueue = record
    head: PPQNode;
    count: integer;
  end;

procedure InitPQ(var pq: TPriorityQueue);
begin
  pq.head := nil;
  pq.count := 0;
end;

procedure Enqueue(var pq: TPriorityQueue; value, priority: integer);
var
  newNode, current, prev: PPQNode;
begin
  new(newNode);
  newNode^.data := value;
  newNode^.priority := priority;

  { Insert in sorted position by priority }
  if (pq.head = nil) or (priority < pq.head^.priority) then
  begin
    newNode^.next := pq.head;
    pq.head := newNode;
  end
  else
  begin
    prev := pq.head;
    current := pq.head^.next;
    while (current <> nil) and (current^.priority <= priority) do
    begin
      prev := current;
      current := current^.next;
    end;
    newNode^.next := current;
    prev^.next := newNode;
  end;

  pq.count := pq.count + 1;
end;

function Dequeue(var pq: TPriorityQueue): integer;
var
  temp: PPQNode;
begin
  if pq.head = nil then
  begin
    writeln('Error: priority queue is empty');
    Dequeue := 0;
    exit;
  end;

  Dequeue := pq.head^.data;
  temp := pq.head;
  pq.head := pq.head^.next;
  dispose(temp);
  pq.count := pq.count - 1;
end;

procedure FreePQ(var pq: TPriorityQueue);
begin
  while pq.head <> nil do
    Dequeue(pq);
end;

var
  pq: TPriorityQueue;
begin
  writeln('=== Priority Queue (Sorted Linked List) ===');
  writeln;

  InitPQ(pq);
  Enqueue(pq, 100, 3);   { data=100, priority=3 }
  Enqueue(pq, 200, 1);   { data=200, priority=1 (highest) }
  Enqueue(pq, 300, 2);   { data=300, priority=2 }
  Enqueue(pq, 400, 5);   { data=400, priority=5 }
  Enqueue(pq, 500, 1);   { data=500, priority=1 (tied) }

  writeln('Dequeue order (by priority):');
  while pq.head <> nil do
    write(Dequeue(pq), ' ');
  writeln;   { Expected: 200 500 300 100 400 }
end.
```

### Binary Heap Priority Queue

```pascal
program BinaryHeapPQ;
{
  A binary min-heap stored in an array.
  Parent of element at index i is at i div 2.
  Left child of element at index i is at 2*i.
  Right child of element at index i is at 2*i + 1.
  Array is 1-indexed for cleaner parent/child math.
}
const
  MaxHeap = 100;

type
  THeapItem = record
    data: integer;
    priority: integer;
  end;

  TBinaryHeap = record
    items: array[1..MaxHeap] of THeapItem;
    size: integer;
  end;

procedure InitHeap(var h: TBinaryHeap);
begin
  h.size := 0;
end;

function IsEmpty(const h: TBinaryHeap): boolean;
begin
  IsEmpty := h.size = 0;
end;

procedure Swap(var a, b: THeapItem);
var
  temp: THeapItem;
begin
  temp := a;
  a := b;
  b := temp;
end;

{ Bubble up: restore heap property after insertion }
procedure SiftUp(var h: TBinaryHeap; idx: integer);
var
  parent: integer;
begin
  while idx > 1 do
  begin
    parent := idx div 2;
    if h.items[idx].priority < h.items[parent].priority then
    begin
      Swap(h.items[idx], h.items[parent]);
      idx := parent;
    end
    else
      break;
  end;
end;

{ Bubble down: restore heap property after removal }
procedure SiftDown(var h: TBinaryHeap; idx: integer);
var
  child, leftChild, rightChild: integer;
begin
  while 2 * idx <= h.size do
  begin
    leftChild := 2 * idx;
    rightChild := 2 * idx + 1;
    child := leftChild;

    { Pick the smaller child }
    if (rightChild <= h.size) and
       (h.items[rightChild].priority < h.items[leftChild].priority) then
      child := rightChild;

    if h.items[idx].priority > h.items[child].priority then
    begin
      Swap(h.items[idx], h.items[child]);
      idx := child;
    end
    else
      break;
  end;
end;

procedure Insert(var h: TBinaryHeap; data, priority: integer);
begin
  if h.size >= MaxHeap then
  begin
    writeln('Error: heap is full');
    exit;
  end;

  h.size := h.size + 1;
  h.items[h.size].data := data;
  h.items[h.size].priority := priority;
  SiftUp(h, h.size);
end;

function ExtractMin(var h: TBinaryHeap): integer;
begin
  if IsEmpty(h) then
  begin
    writeln('Error: heap is empty');
    ExtractMin := 0;
    exit;
  end;

  ExtractMin := h.items[1].data;
  h.items[1] := h.items[h.size];
  h.size := h.size - 1;
  if h.size > 0 then
    SiftDown(h, 1);
end;

{
  Binary heap structure (array representation):

  Insert order: (A,3), (B,1), (C,4), (D,1), (E,5), (F,2)

  After all insertions, the min-heap looks like:

           (B,1)            Index: 1
          /      \
       (D,1)    (F,2)       Index: 2, 3
       /   \    /
    (A,3) (E,5)(C,4)        Index: 4, 5, 6

  Array: [(B,1), (D,1), (F,2), (A,3), (E,5), (C,4)]
}

{ --- Main Program --- }
var
  h: TBinaryHeap;
begin
  writeln('=== Binary Heap Priority Queue ===');
  writeln;

  InitHeap(h);

  Insert(h, 100, 3);
  Insert(h, 200, 1);
  Insert(h, 300, 4);
  Insert(h, 400, 1);
  Insert(h, 500, 5);
  Insert(h, 600, 2);

  writeln('Extract order (min-priority first):');
  while not IsEmpty(h) do
    write(ExtractMin(h), ' ');
  writeln;
  { Expected: 200 400 600 100 300 500 }
  { (ties broken by heap structure, not insertion order) }
end.
```

---

# Part 5: Trees (THE CORE)

Trees are the most important data structures in computer science, and Pascal is where most CS students first encounter them. The combination of Pascal's pointer types, record types, and forward references makes tree implementations clear and elegant.

## 20. Binary Tree

A binary tree is a tree where each node has at most two children, called `left` and `right`:

```pascal
program BinaryTree;
type
  PTree = ^TTree;
  TTree = record
    value: integer;
    left, right: PTree;
  end;

{ --- Node Creation --- }

function CreateNode(val: integer): PTree;
var
  node: PTree;
begin
  new(node);
  node^.value := val;
  node^.left := nil;
  node^.right := nil;
  CreateNode := node;
end;

{ --- Traversals --- }

{ Inorder traversal: Left, Root, Right }
procedure Inorder(node: PTree);
begin
  if node = nil then exit;
  Inorder(node^.left);
  write(node^.value, ' ');
  Inorder(node^.right);
end;

{ Preorder traversal: Root, Left, Right }
procedure Preorder(node: PTree);
begin
  if node = nil then exit;
  write(node^.value, ' ');
  Preorder(node^.left);
  Preorder(node^.right);
end;

{ Postorder traversal: Left, Right, Root }
procedure Postorder(node: PTree);
begin
  if node = nil then exit;
  Postorder(node^.left);
  Postorder(node^.right);
  write(node^.value, ' ');
end;

{ Level-order traversal (BFS) using a queue }
procedure LevelOrder(root: PTree);
type
  PQNode = ^TQNode;
  TQNode = record
    tree: PTree;
    next: PQNode;
  end;

var
  front, rear, temp: PQNode;
  current: PTree;

  procedure EnqueueTree(t: PTree);
  var
    node: PQNode;
  begin
    new(node);
    node^.tree := t;
    node^.next := nil;
    if rear <> nil then
      rear^.next := node
    else
      front := node;
    rear := node;
  end;

  function DequeueTree: PTree;
  begin
    if front = nil then
    begin
      DequeueTree := nil;
      exit;
    end;
    DequeueTree := front^.tree;
    temp := front;
    front := front^.next;
    if front = nil then
      rear := nil;
    dispose(temp);
  end;

begin
  if root = nil then exit;

  front := nil;
  rear := nil;
  EnqueueTree(root);

  while front <> nil do
  begin
    current := DequeueTree;
    write(current^.value, ' ');

    if current^.left <> nil then
      EnqueueTree(current^.left);
    if current^.right <> nil then
      EnqueueTree(current^.right);
  end;
end;

{ --- Tree Metrics --- }

{ Compute the height of the tree }
function TreeHeight(node: PTree): integer;
var
  leftH, rightH: integer;
begin
  if node = nil then
  begin
    TreeHeight := -1;   { empty tree has height -1 by convention }
    exit;
  end;

  leftH := TreeHeight(node^.left);
  rightH := TreeHeight(node^.right);

  if leftH > rightH then
    TreeHeight := leftH + 1
  else
    TreeHeight := rightH + 1;
end;

{ Count total nodes }
function NodeCount(node: PTree): integer;
begin
  if node = nil then
    NodeCount := 0
  else
    NodeCount := 1 + NodeCount(node^.left) + NodeCount(node^.right);
end;

{ Count leaf nodes (nodes with no children) }
function LeafCount(node: PTree): integer;
begin
  if node = nil then
    LeafCount := 0
  else if (node^.left = nil) and (node^.right = nil) then
    LeafCount := 1
  else
    LeafCount := LeafCount(node^.left) + LeafCount(node^.right);
end;

{ --- ASCII Art Tree Printer --- }

procedure PrintTree(node: PTree; prefix: string; isRight: boolean);
begin
  if node = nil then exit;

  if isRight then
    write(prefix, '+-- ')
  else
    write(prefix, '`-- ');
  writeln(node^.value);

  if isRight then
    prefix := prefix + '|   '
  else
    prefix := prefix + '    ';

  PrintTree(node^.right, prefix, true);
  PrintTree(node^.left, prefix, false);
end;

{ --- Cleanup --- }

procedure FreeTree(var node: PTree);
begin
  if node = nil then exit;
  FreeTree(node^.left);
  FreeTree(node^.right);
  dispose(node);
  node := nil;
end;

{ --- Main Program --- }

var
  root: PTree;

begin
  writeln('=== Binary Tree Demo ===');
  writeln;

  {
    Build this tree manually:

            1
           / \
          2   3
         / \   \
        4   5   6
       /       / \
      7       8   9

  }

  root := CreateNode(1);
  root^.left := CreateNode(2);
  root^.right := CreateNode(3);
  root^.left^.left := CreateNode(4);
  root^.left^.right := CreateNode(5);
  root^.right^.right := CreateNode(6);
  root^.left^.left^.left := CreateNode(7);
  root^.right^.right^.left := CreateNode(8);
  root^.right^.right^.right := CreateNode(9);

  writeln('Tree structure:');
  PrintTree(root, '', false);
  writeln;

  write('Inorder:    '); Inorder(root); writeln;
  write('Preorder:   '); Preorder(root); writeln;
  write('Postorder:  '); Postorder(root); writeln;
  write('Level-order: '); LevelOrder(root); writeln;
  writeln;

  writeln('Height: ', TreeHeight(root));
  writeln('Node count: ', NodeCount(root));
  writeln('Leaf count: ', LeafCount(root));

  FreeTree(root);
end.
```

### Understanding the Traversals

The four traversal orders each visit the same nodes but in different sequences. For the tree built above:

```
            1
           / \
          2   3
         / \   \
        4   5   6
       /       / \
      7       8   9
```

| Traversal | Order | Result |
|-----------|-------|--------|
| Inorder | Left, Root, Right | 7 4 2 5 1 3 8 6 9 |
| Preorder | Root, Left, Right | 1 2 4 7 5 3 6 8 9 |
| Postorder | Left, Right, Root | 7 4 5 2 8 9 6 3 1 |
| Level-order | Top to bottom, left to right | 1 2 3 4 5 6 7 8 9 |

Each traversal has practical applications:
- **Inorder:** Produces sorted output for BSTs
- **Preorder:** Useful for copying/serializing a tree (you know the root first)
- **Postorder:** Useful for deleting a tree (you delete children before parents) and for evaluating expression trees
- **Level-order:** Useful for finding shortest paths and printing the tree level-by-level

## 21. Binary Search Tree (BST)

A binary search tree maintains the invariant: for every node, all values in the left subtree are less than the node's value, and all values in the right subtree are greater. This enables O(log n) search, insertion, and deletion on average.

```pascal
program BinarySearchTree;
type
  PBSTNode = ^TBSTNode;
  TBSTNode = record
    key: integer;
    left, right: PBSTNode;
  end;

{ --- Insertion --- }

{ Insert a key into the BST (recursive) }
function Insert(root: PBSTNode; key: integer): PBSTNode;
begin
  if root = nil then
  begin
    new(root);
    root^.key := key;
    root^.left := nil;
    root^.right := nil;
    Insert := root;
    exit;
  end;

  if key < root^.key then
    root^.left := Insert(root^.left, key)
  else if key > root^.key then
    root^.right := Insert(root^.right, key);
  { key = root^.key: duplicate, do nothing }

  Insert := root;
end;

{ --- Search --- }

{ Search recursively }
function SearchRec(root: PBSTNode; key: integer): PBSTNode;
begin
  if root = nil then
  begin
    SearchRec := nil;
    exit;
  end;

  if key = root^.key then
    SearchRec := root
  else if key < root^.key then
    SearchRec := SearchRec(root^.left, key)
  else
    SearchRec := SearchRec(root^.right, key);
end;

{ Search iteratively (more efficient -- no stack overhead) }
function SearchIter(root: PBSTNode; key: integer): PBSTNode;
var
  current: PBSTNode;
begin
  current := root;
  while current <> nil do
  begin
    if key = current^.key then
    begin
      SearchIter := current;
      exit;
    end
    else if key < current^.key then
      current := current^.left
    else
      current := current^.right;
  end;
  SearchIter := nil;
end;

{ --- Minimum and Maximum --- }

function FindMin(root: PBSTNode): PBSTNode;
begin
  if root = nil then
  begin
    FindMin := nil;
    exit;
  end;
  { Minimum is the leftmost node }
  while root^.left <> nil do
    root := root^.left;
  FindMin := root;
end;

function FindMax(root: PBSTNode): PBSTNode;
begin
  if root = nil then
  begin
    FindMax := nil;
    exit;
  end;
  { Maximum is the rightmost node }
  while root^.right <> nil do
    root := root^.right;
  FindMax := root;
end;

{ --- Deletion --- }

{
  BST Deletion has three cases:

  Case 1: Leaf node (no children)
    Simply remove the node.

    Before:          After:
        50               50
       / \              / \
      30  70           30  70
     /                /
    20                (removed)

  Case 2: One child
    Replace the node with its only child.

    Before:          After:
        50               50
       / \              / \
      30  70           20  70
     /
    20

  Case 3: Two children
    Replace the node's key with its inorder successor's key
    (smallest value in right subtree), then delete the successor.

    Before:          After (replace 30 with 35, delete original 35):
        50               50
       / \              / \
      30  70           35  70
     / \              / \
    20  40           20  40
       /
      35
}

function DeleteNode(root: PBSTNode; key: integer): PBSTNode;
var
  temp, successor: PBSTNode;
begin
  if root = nil then
  begin
    DeleteNode := nil;
    exit;
  end;

  if key < root^.key then
    root^.left := DeleteNode(root^.left, key)
  else if key > root^.key then
    root^.right := DeleteNode(root^.right, key)
  else
  begin
    { Found the node to delete }

    { Case 1 & 2: no left child }
    if root^.left = nil then
    begin
      temp := root^.right;
      dispose(root);
      DeleteNode := temp;
      exit;
    end;

    { Case 2: no right child }
    if root^.right = nil then
    begin
      temp := root^.left;
      dispose(root);
      DeleteNode := temp;
      exit;
    end;

    { Case 3: two children }
    { Find inorder successor (smallest in right subtree) }
    successor := FindMin(root^.right);
    root^.key := successor^.key;
    root^.right := DeleteNode(root^.right, successor^.key);
  end;

  DeleteNode := root;
end;

{ --- Traversal and Display --- }

procedure Inorder(node: PBSTNode);
begin
  if node = nil then exit;
  Inorder(node^.left);
  write(node^.key, ' ');
  Inorder(node^.right);
end;

procedure PrintBST(node: PBSTNode; prefix: string; isRight: boolean);
begin
  if node = nil then exit;

  if isRight then
    write(prefix, '+-- ')
  else
    write(prefix, '`-- ');
  writeln(node^.key);

  if isRight then
    prefix := prefix + '|   '
  else
    prefix := prefix + '    ';

  PrintBST(node^.right, prefix, true);
  PrintBST(node^.left, prefix, false);
end;

{ --- Verification --- }

{ Verify BST property }
function IsBST(node: PBSTNode; minVal, maxVal: integer): boolean;
begin
  if node = nil then
  begin
    IsBST := true;
    exit;
  end;

  if (node^.key <= minVal) or (node^.key >= maxVal) then
  begin
    IsBST := false;
    exit;
  end;

  IsBST := IsBST(node^.left, minVal, node^.key) and
            IsBST(node^.right, node^.key, maxVal);
end;

function TreeHeight(node: PBSTNode): integer;
var
  lh, rh: integer;
begin
  if node = nil then
  begin
    TreeHeight := -1;
    exit;
  end;
  lh := TreeHeight(node^.left);
  rh := TreeHeight(node^.right);
  if lh > rh then
    TreeHeight := lh + 1
  else
    TreeHeight := rh + 1;
end;

procedure FreeTree(var node: PBSTNode);
begin
  if node = nil then exit;
  FreeTree(node^.left);
  FreeTree(node^.right);
  dispose(node);
  node := nil;
end;

{ --- Main Program --- }

var
  root: PBSTNode;
  found: PBSTNode;
  minNode, maxNode: PBSTNode;
begin
  root := nil;

  writeln('=== Binary Search Tree Demo ===');
  writeln;

  { Insert values }
  root := Insert(root, 50);
  root := Insert(root, 30);
  root := Insert(root, 70);
  root := Insert(root, 20);
  root := Insert(root, 40);
  root := Insert(root, 60);
  root := Insert(root, 80);
  root := Insert(root, 35);
  root := Insert(root, 45);

  writeln('BST structure:');
  PrintBST(root, '', false);
  writeln;

  write('Inorder (sorted): ');
  Inorder(root);
  writeln;
  writeln;

  writeln('Height: ', TreeHeight(root));
  writeln('Valid BST: ', IsBST(root, -MaxInt, MaxInt));
  writeln;

  { Search }
  found := SearchIter(root, 40);
  if found <> nil then
    writeln('Found 40: key = ', found^.key)
  else
    writeln('40 not found');

  found := SearchIter(root, 42);
  if found <> nil then
    writeln('Found 42: key = ', found^.key)
  else
    writeln('42 not found');
  writeln;

  { Min and Max }
  minNode := FindMin(root);
  maxNode := FindMax(root);
  writeln('Minimum: ', minNode^.key);
  writeln('Maximum: ', maxNode^.key);
  writeln;

  { Deletion }
  writeln('Delete 20 (leaf):');
  root := DeleteNode(root, 20);
  PrintBST(root, '', false);
  writeln;

  writeln('Delete 30 (two children):');
  root := DeleteNode(root, 30);
  PrintBST(root, '', false);
  writeln;

  writeln('Delete 50 (root, two children):');
  root := DeleteNode(root, 50);
  PrintBST(root, '', false);

  write('Inorder after deletions: ');
  Inorder(root);
  writeln;
  writeln('Still valid BST: ', IsBST(root, -MaxInt, MaxInt));

  FreeTree(root);
end.
```

## 22. AVL Tree Concepts

An AVL tree (named after Adelson-Velsky and Landis, 1962) is a self-balancing BST where the heights of the left and right subtrees of every node differ by at most 1. This guarantees O(log n) worst-case time for search, insertion, and deletion.

```pascal
program AVLTree;
type
  PAVLNode = ^TAVLNode;
  TAVLNode = record
    key: integer;
    left, right: PAVLNode;
    height: integer;
  end;

{ --- Helper Functions --- }

function Height(node: PAVLNode): integer;
begin
  if node = nil then
    Height := -1
  else
    Height := node^.height;
end;

function Max(a, b: integer): integer;
begin
  if a > b then Max := a else Max := b;
end;

procedure UpdateHeight(node: PAVLNode);
begin
  if node <> nil then
    node^.height := 1 + Max(Height(node^.left), Height(node^.right));
end;

function BalanceFactor(node: PAVLNode): integer;
begin
  if node = nil then
    BalanceFactor := 0
  else
    BalanceFactor := Height(node^.left) - Height(node^.right);
end;

{ --- Rotations --- }

{
  Right rotation (for left-heavy trees):

  Before:                After:
       y                   x
      / \                /   \
     x   C     ===>     A     y
    / \                      / \
   A   B                   B   C

  y's left becomes B (x's right)
  x's right becomes y
  return x as new root
}
function RotateRight(y: PAVLNode): PAVLNode;
var
  x, B: PAVLNode;
begin
  x := y^.left;
  B := x^.right;

  { Perform rotation }
  x^.right := y;
  y^.left := B;

  { Update heights (y first, then x, since x is now parent) }
  UpdateHeight(y);
  UpdateHeight(x);

  RotateRight := x;
end;

{
  Left rotation (for right-heavy trees):

  Before:                After:
     x                     y
    / \                  /   \
   A   y       ===>     x     C
      / \              / \
     B   C            A   B

  x's right becomes B (y's left)
  y's left becomes x
  return y as new root
}
function RotateLeft(x: PAVLNode): PAVLNode;
var
  y, B: PAVLNode;
begin
  y := x^.right;
  B := y^.left;

  { Perform rotation }
  y^.left := x;
  x^.right := B;

  { Update heights }
  UpdateHeight(x);
  UpdateHeight(y);

  RotateLeft := y;
end;

{ --- Rebalance --- }

function Rebalance(node: PAVLNode): PAVLNode;
var
  bf: integer;
begin
  UpdateHeight(node);
  bf := BalanceFactor(node);

  { Left-heavy (bf > 1) }
  if bf > 1 then
  begin
    if BalanceFactor(node^.left) < 0 then
    begin
      { Left-Right case: left rotate the left child first }
      node^.left := RotateLeft(node^.left);
    end;
    { Left-Left case (or after Left-Right adjustment) }
    Rebalance := RotateRight(node);
    exit;
  end;

  { Right-heavy (bf < -1) }
  if bf < -1 then
  begin
    if BalanceFactor(node^.right) > 0 then
    begin
      { Right-Left case: right rotate the right child first }
      node^.right := RotateRight(node^.right);
    end;
    { Right-Right case (or after Right-Left adjustment) }
    Rebalance := RotateLeft(node);
    exit;
  end;

  { Already balanced }
  Rebalance := node;
end;

{ --- Insertion --- }

function InsertAVL(node: PAVLNode; key: integer): PAVLNode;
begin
  if node = nil then
  begin
    new(node);
    node^.key := key;
    node^.left := nil;
    node^.right := nil;
    node^.height := 0;
    InsertAVL := node;
    exit;
  end;

  if key < node^.key then
    node^.left := InsertAVL(node^.left, key)
  else if key > node^.key then
    node^.right := InsertAVL(node^.right, key)
  else
  begin
    InsertAVL := node;   { duplicate -- no insert }
    exit;
  end;

  InsertAVL := Rebalance(node);
end;

{ --- Deletion --- }

function FindMinAVL(node: PAVLNode): PAVLNode;
begin
  while node^.left <> nil do
    node := node^.left;
  FindMinAVL := node;
end;

function DeleteAVL(node: PAVLNode; key: integer): PAVLNode;
var
  temp, successor: PAVLNode;
begin
  if node = nil then
  begin
    DeleteAVL := nil;
    exit;
  end;

  if key < node^.key then
    node^.left := DeleteAVL(node^.left, key)
  else if key > node^.key then
    node^.right := DeleteAVL(node^.right, key)
  else
  begin
    { Found the node }
    if node^.left = nil then
    begin
      temp := node^.right;
      dispose(node);
      DeleteAVL := temp;
      exit;
    end;
    if node^.right = nil then
    begin
      temp := node^.left;
      dispose(node);
      DeleteAVL := temp;
      exit;
    end;

    { Two children }
    successor := FindMinAVL(node^.right);
    node^.key := successor^.key;
    node^.right := DeleteAVL(node^.right, successor^.key);
  end;

  DeleteAVL := Rebalance(node);
end;

{ --- Display --- }

procedure Inorder(node: PAVLNode);
begin
  if node = nil then exit;
  Inorder(node^.left);
  write(node^.key, '(h=', node^.height, ',bf=', BalanceFactor(node), ') ');
  Inorder(node^.right);
end;

procedure PrintAVL(node: PAVLNode; prefix: string; isRight: boolean);
begin
  if node = nil then exit;

  if isRight then
    write(prefix, '+-- ')
  else
    write(prefix, '`-- ');
  writeln(node^.key, ' [h=', node^.height, ' bf=', BalanceFactor(node), ']');

  if isRight then
    prefix := prefix + '|   '
  else
    prefix := prefix + '    ';

  PrintAVL(node^.right, prefix, true);
  PrintAVL(node^.left, prefix, false);
end;

procedure FreeTree(var node: PAVLNode);
begin
  if node = nil then exit;
  FreeTree(node^.left);
  FreeTree(node^.right);
  dispose(node);
  node := nil;
end;

{ --- Main Program --- }
var
  root: PAVLNode;
begin
  root := nil;

  writeln('=== AVL Tree Demo ===');
  writeln;

  { Insert values that would make a regular BST degenerate }
  writeln('Inserting 1, 2, 3, 4, 5, 6, 7 (ascending order):');
  root := InsertAVL(root, 1);
  root := InsertAVL(root, 2);
  root := InsertAVL(root, 3);
  root := InsertAVL(root, 4);
  root := InsertAVL(root, 5);
  root := InsertAVL(root, 6);
  root := InsertAVL(root, 7);

  writeln('AVL tree (balanced despite ascending insertion):');
  PrintAVL(root, '', false);
  writeln;

  write('Inorder: ');
  Inorder(root);
  writeln;
  writeln('Height: ', Height(root));
  writeln('(Regular BST would have height 6; AVL has height ', Height(root), ')');
  writeln;

  { Delete nodes }
  writeln('Delete 4 (root):');
  root := DeleteAVL(root, 4);
  PrintAVL(root, '', false);
  writeln;

  writeln('Delete 2:');
  root := DeleteAVL(root, 2);
  PrintAVL(root, '', false);

  FreeTree(root);
end.
```

## 23. Expression Trees

Expression trees represent arithmetic expressions as trees, where leaves are operands and internal nodes are operators. This connects tree traversals to practical computation:

```pascal
program ExpressionTree;
type
  NodeKind = (nkNumber, nkAdd, nkSub, nkMul, nkDiv);

  PExprTree = ^TExprTree;
  TExprTree = record
    case kind: NodeKind of
      nkNumber: (value: real);
      nkAdd, nkSub, nkMul, nkDiv: (left, right: PExprTree);
  end;

{ Create a number node }
function MakeNum(val: real): PExprTree;
var
  node: PExprTree;
begin
  new(node);
  node^.kind := nkNumber;
  node^.value := val;
  MakeNum := node;
end;

{ Create an operator node }
function MakeOp(op: NodeKind; l, r: PExprTree): PExprTree;
var
  node: PExprTree;
begin
  new(node);
  node^.kind := op;
  node^.left := l;
  node^.right := r;
  MakeOp := node;
end;

{ Evaluate the expression tree recursively }
function Evaluate(node: PExprTree): real;
var
  l, r: real;
begin
  case node^.kind of
    nkNumber:
      Evaluate := node^.value;
    nkAdd:
      Evaluate := Evaluate(node^.left) + Evaluate(node^.right);
    nkSub:
      Evaluate := Evaluate(node^.left) - Evaluate(node^.right);
    nkMul:
      Evaluate := Evaluate(node^.left) * Evaluate(node^.right);
    nkDiv:
      begin
        r := Evaluate(node^.right);
        if r = 0 then
        begin
          writeln('Error: division by zero');
          Evaluate := 0;
        end
        else
          Evaluate := Evaluate(node^.left) / r;
      end;
  end;
end;

{ Print in infix notation (with parentheses) }
procedure PrintInfix(node: PExprTree);
begin
  case node^.kind of
    nkNumber:
      write(node^.value:0:0);
    nkAdd, nkSub, nkMul, nkDiv:
      begin
        write('(');
        PrintInfix(node^.left);
        case node^.kind of
          nkAdd: write(' + ');
          nkSub: write(' - ');
          nkMul: write(' * ');
          nkDiv: write(' / ');
        end;
        PrintInfix(node^.right);
        write(')');
      end;
  end;
end;

{ Print in prefix notation (Polish notation) }
procedure PrintPrefix(node: PExprTree);
begin
  case node^.kind of
    nkNumber:
      write(node^.value:0:0, ' ');
    nkAdd, nkSub, nkMul, nkDiv:
      begin
        case node^.kind of
          nkAdd: write('+ ');
          nkSub: write('- ');
          nkMul: write('* ');
          nkDiv: write('/ ');
        end;
        PrintPrefix(node^.left);
        PrintPrefix(node^.right);
      end;
  end;
end;

{ Print in postfix notation (Reverse Polish notation) }
procedure PrintPostfix(node: PExprTree);
begin
  case node^.kind of
    nkNumber:
      write(node^.value:0:0, ' ');
    nkAdd, nkSub, nkMul, nkDiv:
      begin
        PrintPostfix(node^.left);
        PrintPostfix(node^.right);
        case node^.kind of
          nkAdd: write('+ ');
          nkSub: write('- ');
          nkMul: write('* ');
          nkDiv: write('/ ');
        end;
      end;
  end;
end;

procedure FreeExprTree(var node: PExprTree);
begin
  if node = nil then exit;
  case node^.kind of
    nkAdd, nkSub, nkMul, nkDiv:
      begin
        FreeExprTree(node^.left);
        FreeExprTree(node^.right);
      end;
  end;
  dispose(node);
  node := nil;
end;

{ --- Main --- }
var
  expr: PExprTree;
begin
  writeln('=== Expression Tree Demo ===');
  writeln;

  {
    Build the expression: (3 + 4) * (10 - 2)

              *
             / \
            +   -
           / \ / \
          3  4 10  2
  }

  expr := MakeOp(nkMul,
            MakeOp(nkAdd, MakeNum(3), MakeNum(4)),
            MakeOp(nkSub, MakeNum(10), MakeNum(2)));

  write('Infix:   '); PrintInfix(expr); writeln;
  write('Prefix:  '); PrintPrefix(expr); writeln;
  write('Postfix: '); PrintPostfix(expr); writeln;
  writeln('Result:  ', Evaluate(expr):0:0);
  writeln;

  FreeExprTree(expr);

  {
    Build: 2 * (3 + 4) / 7 - 1
    = ((2 * (3 + 4)) / 7) - 1

              -
             / \
            /   1
           / \
          *   7
         / \
        2   +
           / \
          3   4
  }

  expr := MakeOp(nkSub,
            MakeOp(nkDiv,
              MakeOp(nkMul,
                MakeNum(2),
                MakeOp(nkAdd, MakeNum(3), MakeNum(4))),
              MakeNum(7)),
            MakeNum(1));

  write('Infix:   '); PrintInfix(expr); writeln;
  write('Prefix:  '); PrintPrefix(expr); writeln;
  write('Postfix: '); PrintPostfix(expr); writeln;
  writeln('Result:  ', Evaluate(expr):0:1);

  FreeExprTree(expr);
end.
```

## 24. General (N-ary) Trees

A general tree where each node can have any number of children is represented using the "first child, next sibling" technique. Each node has two pointers: one to its first (leftmost) child, and one to its next sibling:

```pascal
program GeneralTree;
type
  PGenNode = ^TGenNode;
  TGenNode = record
    value: integer;
    name: string[20];
    firstChild: PGenNode;
    nextSibling: PGenNode;
  end;

{ Create a node }
function CreateNode(val: integer; nm: string): PGenNode;
var
  node: PGenNode;
begin
  new(node);
  node^.value := val;
  node^.name := nm;
  node^.firstChild := nil;
  node^.nextSibling := nil;
  CreateNode := node;
end;

{ Add a child to a parent }
procedure AddChild(parent, child: PGenNode);
var
  sibling: PGenNode;
begin
  if parent^.firstChild = nil then
    parent^.firstChild := child
  else
  begin
    sibling := parent^.firstChild;
    while sibling^.nextSibling <> nil do
      sibling := sibling^.nextSibling;
    sibling^.nextSibling := child;
  end;
end;

{ Print the tree with indentation }
procedure PrintTree(node: PGenNode; depth: integer);
var
  child: PGenNode;
  i: integer;
begin
  if node = nil then exit;

  for i := 1 to depth do
    write('  ');
  writeln(node^.name, ' (', node^.value, ')');

  child := node^.firstChild;
  while child <> nil do
  begin
    PrintTree(child, depth + 1);
    child := child^.nextSibling;
  end;
end;

{ Count all nodes }
function CountNodes(node: PGenNode): integer;
var
  count: integer;
  child: PGenNode;
begin
  if node = nil then
  begin
    CountNodes := 0;
    exit;
  end;

  count := 1;
  child := node^.firstChild;
  while child <> nil do
  begin
    count := count + CountNodes(child);
    child := child^.nextSibling;
  end;
  CountNodes := count;
end;

{ Compute height }
function TreeHeight(node: PGenNode): integer;
var
  maxChildH, childH: integer;
  child: PGenNode;
begin
  if node = nil then
  begin
    TreeHeight := -1;
    exit;
  end;

  maxChildH := -1;
  child := node^.firstChild;
  while child <> nil do
  begin
    childH := TreeHeight(child);
    if childH > maxChildH then
      maxChildH := childH;
    child := child^.nextSibling;
  end;

  TreeHeight := maxChildH + 1;
end;

{ Search for a value }
function Search(node: PGenNode; val: integer): PGenNode;
var
  child, result: PGenNode;
begin
  if node = nil then
  begin
    Search := nil;
    exit;
  end;

  if node^.value = val then
  begin
    Search := node;
    exit;
  end;

  child := node^.firstChild;
  while child <> nil do
  begin
    result := Search(child, val);
    if result <> nil then
    begin
      Search := result;
      exit;
    end;
    child := child^.nextSibling;
  end;

  Search := nil;
end;

procedure FreeTree(var node: PGenNode);
var
  child, next: PGenNode;
begin
  if node = nil then exit;

  child := node^.firstChild;
  while child <> nil do
  begin
    next := child^.nextSibling;
    FreeTree(child);
    child := next;
  end;

  dispose(node);
  node := nil;
end;

{ --- Main Program --- }
var
  root, cs, math, eng: PGenNode;
begin
  writeln('=== General (N-ary) Tree Demo ===');
  writeln;

  {
    Build a university department tree:

    University
    +-- Computer Science
    |   +-- Algorithms
    |   +-- Systems
    |   +-- AI
    +-- Mathematics
    |   +-- Algebra
    |   +-- Analysis
    +-- Engineering
        +-- Mechanical
        +-- Electrical
        +-- Civil
  }

  root := CreateNode(1, 'University');

  cs := CreateNode(10, 'Comp Sci');
  AddChild(cs, CreateNode(101, 'Algorithms'));
  AddChild(cs, CreateNode(102, 'Systems'));
  AddChild(cs, CreateNode(103, 'AI'));

  math := CreateNode(20, 'Mathematics');
  AddChild(math, CreateNode(201, 'Algebra'));
  AddChild(math, CreateNode(202, 'Analysis'));

  eng := CreateNode(30, 'Engineering');
  AddChild(eng, CreateNode(301, 'Mechanical'));
  AddChild(eng, CreateNode(302, 'Electrical'));
  AddChild(eng, CreateNode(303, 'Civil'));

  AddChild(root, cs);
  AddChild(root, math);
  AddChild(root, eng);

  writeln('Department tree:');
  PrintTree(root, 0);
  writeln;
  writeln('Total nodes: ', CountNodes(root));
  writeln('Height: ', TreeHeight(root));

  FreeTree(root);
end.
```

---

# Part 6: Graphs

Graphs are the most general data structure for representing relationships. A graph consists of vertices (nodes) and edges (connections between nodes). Unlike trees, graphs can have cycles, and a vertex can be connected to any number of other vertices.

## 25. Adjacency List Representation

```pascal
program GraphAdjList;
const
  MaxV = 20;  { maximum number of vertices }

type
  PEdge = ^TEdge;
  TEdge = record
    dest: integer;       { destination vertex }
    weight: integer;     { edge weight }
    next: PEdge;         { next edge in adjacency list }
  end;

  TGraph = record
    numVertices: integer;
    directed: boolean;
    adjList: array[1..MaxV] of PEdge;
    vertexName: array[1..MaxV] of string[15];
  end;

procedure InitGraph(var g: TGraph; n: integer; dir: boolean);
var
  i: integer;
begin
  g.numVertices := n;
  g.directed := dir;
  for i := 1 to n do
  begin
    g.adjList[i] := nil;
    g.vertexName[i] := '';
  end;
end;

procedure AddEdge(var g: TGraph; src, dest, weight: integer);
var
  edge: PEdge;
begin
  { Add edge from src to dest }
  new(edge);
  edge^.dest := dest;
  edge^.weight := weight;
  edge^.next := g.adjList[src];
  g.adjList[src] := edge;

  { If undirected, add reverse edge too }
  if not g.directed then
  begin
    new(edge);
    edge^.dest := src;
    edge^.weight := weight;
    edge^.next := g.adjList[dest];
    g.adjList[dest] := edge;
  end;
end;

procedure PrintGraph(const g: TGraph);
var
  i: integer;
  edge: PEdge;
begin
  writeln('Graph (', g.numVertices, ' vertices, ',
          'directed=', g.directed, '):');
  for i := 1 to g.numVertices do
  begin
    write('  ', i);
    if g.vertexName[i] <> '' then
      write(' (', g.vertexName[i], ')');
    write(' -> ');
    edge := g.adjList[i];
    while edge <> nil do
    begin
      write(edge^.dest);
      if edge^.weight <> 1 then
        write('(w=', edge^.weight, ')');
      if edge^.next <> nil then
        write(', ');
      edge := edge^.next;
    end;
    writeln;
  end;
end;

procedure FreeGraph(var g: TGraph);
var
  i: integer;
  edge, temp: PEdge;
begin
  for i := 1 to g.numVertices do
  begin
    edge := g.adjList[i];
    while edge <> nil do
    begin
      temp := edge;
      edge := edge^.next;
      dispose(temp);
    end;
    g.adjList[i] := nil;
  end;
end;

{ --- Main --- }
var
  g: TGraph;
begin
  writeln('=== Graph (Adjacency List) Demo ===');
  writeln;

  { Undirected graph }
  InitGraph(g, 6, false);
  g.vertexName[1] := 'Seattle';
  g.vertexName[2] := 'Portland';
  g.vertexName[3] := 'Spokane';
  g.vertexName[4] := 'Boise';
  g.vertexName[5] := 'SanFran';
  g.vertexName[6] := 'LA';

  AddEdge(g, 1, 2, 174);
  AddEdge(g, 1, 3, 280);
  AddEdge(g, 2, 5, 635);
  AddEdge(g, 3, 4, 290);
  AddEdge(g, 4, 2, 430);
  AddEdge(g, 5, 6, 380);

  PrintGraph(g);
  FreeGraph(g);
end.
```

## 26. DFS and BFS

```pascal
program GraphTraversals;
const
  MaxV = 20;

type
  PEdge = ^TEdge;
  TEdge = record
    dest: integer;
    next: PEdge;
  end;

  TGraph = record
    numVertices: integer;
    adjList: array[1..MaxV] of PEdge;
  end;

  TVisited = array[1..MaxV] of boolean;

procedure InitGraph(var g: TGraph; n: integer);
var
  i: integer;
begin
  g.numVertices := n;
  for i := 1 to n do
    g.adjList[i] := nil;
end;

procedure AddEdge(var g: TGraph; src, dest: integer);
var
  edge: PEdge;
begin
  new(edge);
  edge^.dest := dest;
  edge^.next := g.adjList[src];
  g.adjList[src] := edge;

  { Undirected }
  new(edge);
  edge^.dest := src;
  edge^.next := g.adjList[dest];
  g.adjList[dest] := edge;
end;

{ --- Depth-First Search (Recursive) --- }

procedure DFSRecursive(const g: TGraph; v: integer; var visited: TVisited);
var
  edge: PEdge;
begin
  visited[v] := true;
  write(v, ' ');

  edge := g.adjList[v];
  while edge <> nil do
  begin
    if not visited[edge^.dest] then
      DFSRecursive(g, edge^.dest, visited);
    edge := edge^.next;
  end;
end;

{ --- Depth-First Search (Iterative using stack) --- }

procedure DFSIterative(const g: TGraph; start: integer);
type
  PStackNode = ^TStackNode;
  TStackNode = record
    vertex: integer;
    next: PStackNode;
  end;

var
  stack, temp: PStackNode;
  visited: TVisited;
  v: integer;
  edge: PEdge;

  procedure Push(val: integer);
  var
    node: PStackNode;
  begin
    new(node);
    node^.vertex := val;
    node^.next := stack;
    stack := node;
  end;

  function Pop: integer;
  begin
    Pop := stack^.vertex;
    temp := stack;
    stack := stack^.next;
    dispose(temp);
  end;

begin
  stack := nil;
  for v := 1 to g.numVertices do
    visited[v] := false;

  Push(start);
  while stack <> nil do
  begin
    v := Pop;
    if not visited[v] then
    begin
      visited[v] := true;
      write(v, ' ');

      { Push neighbors (in reverse order for consistent traversal) }
      edge := g.adjList[v];
      while edge <> nil do
      begin
        if not visited[edge^.dest] then
          Push(edge^.dest);
        edge := edge^.next;
      end;
    end;
  end;
end;

{ --- Breadth-First Search --- }

procedure BFS(const g: TGraph; start: integer);
type
  PQNode = ^TQNode;
  TQNode = record
    vertex: integer;
    next: PQNode;
  end;

var
  front, rear, temp: PQNode;
  visited: TVisited;
  v: integer;
  edge: PEdge;

  procedure Enqueue(val: integer);
  var
    node: PQNode;
  begin
    new(node);
    node^.vertex := val;
    node^.next := nil;
    if rear <> nil then
      rear^.next := node
    else
      front := node;
    rear := node;
  end;

  function Dequeue: integer;
  begin
    Dequeue := front^.vertex;
    temp := front;
    front := front^.next;
    if front = nil then
      rear := nil;
    dispose(temp);
  end;

begin
  front := nil;
  rear := nil;
  for v := 1 to g.numVertices do
    visited[v] := false;

  visited[start] := true;
  Enqueue(start);

  while front <> nil do
  begin
    v := Dequeue;
    write(v, ' ');

    edge := g.adjList[v];
    while edge <> nil do
    begin
      if not visited[edge^.dest] then
      begin
        visited[edge^.dest] := true;
        Enqueue(edge^.dest);
      end;
      edge := edge^.next;
    end;
  end;
end;

procedure FreeGraph(var g: TGraph);
var
  i: integer;
  edge, temp: PEdge;
begin
  for i := 1 to g.numVertices do
  begin
    edge := g.adjList[i];
    while edge <> nil do
    begin
      temp := edge;
      edge := edge^.next;
      dispose(temp);
    end;
    g.adjList[i] := nil;
  end;
end;

{ --- Main --- }
var
  g: TGraph;
  visited: TVisited;
  i: integer;
begin
  writeln('=== Graph Traversals Demo ===');
  writeln;

  {
    Build this graph:

    1 --- 2 --- 5
    |     |     |
    3 --- 4 --- 6
          |
          7
  }

  InitGraph(g, 7);
  AddEdge(g, 1, 2);
  AddEdge(g, 1, 3);
  AddEdge(g, 2, 4);
  AddEdge(g, 2, 5);
  AddEdge(g, 3, 4);
  AddEdge(g, 4, 6);
  AddEdge(g, 4, 7);
  AddEdge(g, 5, 6);

  write('DFS (recursive) from 1: ');
  for i := 1 to g.numVertices do
    visited[i] := false;
  DFSRecursive(g, 1, visited);
  writeln;

  write('DFS (iterative) from 1: ');
  DFSIterative(g, 1);
  writeln;

  write('BFS from 1:             ');
  BFS(g, 1);
  writeln;

  FreeGraph(g);
end.
```

## 27. Dijkstra's Shortest Path

```pascal
program DijkstraShortestPath;
const
  MaxV = 20;
  Infinity = MaxInt;

type
  PEdge = ^TEdge;
  TEdge = record
    dest: integer;
    weight: integer;
    next: PEdge;
  end;

  TGraph = record
    numVertices: integer;
    adjList: array[1..MaxV] of PEdge;
    vertexName: array[1..MaxV] of string[15];
  end;

procedure InitGraph(var g: TGraph; n: integer);
var
  i: integer;
begin
  g.numVertices := n;
  for i := 1 to n do
  begin
    g.adjList[i] := nil;
    g.vertexName[i] := '';
  end;
end;

procedure AddEdge(var g: TGraph; src, dest, weight: integer);
var
  edge: PEdge;
begin
  new(edge);
  edge^.dest := dest;
  edge^.weight := weight;
  edge^.next := g.adjList[src];
  g.adjList[src] := edge;

  { Undirected }
  new(edge);
  edge^.dest := src;
  edge^.weight := weight;
  edge^.next := g.adjList[dest];
  g.adjList[dest] := edge;
end;

procedure Dijkstra(const g: TGraph; source: integer);
var
  dist: array[1..MaxV] of integer;
  prev: array[1..MaxV] of integer;
  visited: array[1..MaxV] of boolean;
  i, u, v, minDist, newDist: integer;
  edge: PEdge;
  path: array[1..MaxV] of integer;
  pathLen: integer;
begin
  { Initialize }
  for i := 1 to g.numVertices do
  begin
    dist[i] := Infinity;
    prev[i] := 0;
    visited[i] := false;
  end;
  dist[source] := 0;

  { Main loop: process each vertex }
  for i := 1 to g.numVertices do
  begin
    { Find unvisited vertex with minimum distance }
    u := 0;
    minDist := Infinity;
    for v := 1 to g.numVertices do
      if (not visited[v]) and (dist[v] < minDist) then
      begin
        minDist := dist[v];
        u := v;
      end;

    if u = 0 then break;  { remaining vertices are unreachable }

    visited[u] := true;

    { Update distances to neighbors }
    edge := g.adjList[u];
    while edge <> nil do
    begin
      v := edge^.dest;
      if not visited[v] then
      begin
        newDist := dist[u] + edge^.weight;
        if newDist < dist[v] then
        begin
          dist[v] := newDist;
          prev[v] := u;
        end;
      end;
      edge := edge^.next;
    end;
  end;

  { Print results }
  writeln('Shortest paths from vertex ', source,
          ' (', g.vertexName[source], '):');
  writeln;

  for v := 1 to g.numVertices do
  begin
    if v = source then continue;

    write('  To ', v, ' (', g.vertexName[v], '): ');
    if dist[v] = Infinity then
      writeln('unreachable')
    else
    begin
      write('distance = ', dist[v], ', path = ');

      { Reconstruct path }
      pathLen := 0;
      u := v;
      while u <> 0 do
      begin
        pathLen := pathLen + 1;
        path[pathLen] := u;
        u := prev[u];
      end;

      { Print path in reverse }
      for i := pathLen downto 1 do
      begin
        write(g.vertexName[path[i]]);
        if i > 1 then write(' -> ');
      end;
      writeln;
    end;
  end;
end;

procedure FreeGraph(var g: TGraph);
var
  i: integer;
  edge, temp: PEdge;
begin
  for i := 1 to g.numVertices do
  begin
    edge := g.adjList[i];
    while edge <> nil do
    begin
      temp := edge;
      edge := edge^.next;
      dispose(temp);
    end;
    g.adjList[i] := nil;
  end;
end;

{ --- Main --- }
var
  g: TGraph;
begin
  writeln('=== Dijkstra''s Shortest Path Demo ===');
  writeln;

  InitGraph(g, 6);
  g.vertexName[1] := 'Seattle';
  g.vertexName[2] := 'Portland';
  g.vertexName[3] := 'Spokane';
  g.vertexName[4] := 'Boise';
  g.vertexName[5] := 'SanFran';
  g.vertexName[6] := 'LA';

  AddEdge(g, 1, 2, 174);
  AddEdge(g, 1, 3, 280);
  AddEdge(g, 2, 4, 430);
  AddEdge(g, 2, 5, 635);
  AddEdge(g, 3, 4, 290);
  AddEdge(g, 4, 5, 580);
  AddEdge(g, 5, 6, 380);

  Dijkstra(g, 1);

  FreeGraph(g);
end.
```

---

# Part 7: Hash Tables

Hash tables provide O(1) average-case lookup by mapping keys to array indices through a hash function. Pascal's type system makes hash table implementations clean and instructive.

## 28. Chained Hash Table

```pascal
program ChainedHashTable;
const
  TableSize = 17;  { prime number for better distribution }

type
  PEntry = ^TEntry;
  TEntry = record
    key: string[30];
    value: integer;
    next: PEntry;
  end;

  THashTable = record
    buckets: array[0..TableSize-1] of PEntry;
    count: integer;
  end;

{ Simple hash function for strings }
function HashString(const key: string; tableSize: integer): integer;
var
  i: integer;
  hash: longword;
begin
  hash := 0;
  for i := 1 to length(key) do
    hash := hash * 31 + ord(key[i]);
  HashString := hash mod tableSize;
end;

procedure InitTable(var ht: THashTable);
var
  i: integer;
begin
  for i := 0 to TableSize - 1 do
    ht.buckets[i] := nil;
  ht.count := 0;
end;

{ Insert or update a key-value pair }
procedure Put(var ht: THashTable; const key: string; value: integer);
var
  idx: integer;
  entry: PEntry;
begin
  idx := HashString(key, TableSize);

  { Check if key already exists }
  entry := ht.buckets[idx];
  while entry <> nil do
  begin
    if entry^.key = key then
    begin
      entry^.value := value;  { update existing }
      exit;
    end;
    entry := entry^.next;
  end;

  { Insert new entry at head of chain }
  new(entry);
  entry^.key := key;
  entry^.value := value;
  entry^.next := ht.buckets[idx];
  ht.buckets[idx] := entry;
  ht.count := ht.count + 1;
end;

{ Look up a value by key; returns true if found }
function Get(const ht: THashTable; const key: string;
             var value: integer): boolean;
var
  idx: integer;
  entry: PEntry;
begin
  idx := HashString(key, TableSize);
  entry := ht.buckets[idx];

  while entry <> nil do
  begin
    if entry^.key = key then
    begin
      value := entry^.value;
      Get := true;
      exit;
    end;
    entry := entry^.next;
  end;

  Get := false;
end;

{ Delete a key }
function Delete(var ht: THashTable; const key: string): boolean;
var
  idx: integer;
  entry, prev: PEntry;
begin
  idx := HashString(key, TableSize);
  entry := ht.buckets[idx];
  prev := nil;

  while entry <> nil do
  begin
    if entry^.key = key then
    begin
      if prev <> nil then
        prev^.next := entry^.next
      else
        ht.buckets[idx] := entry^.next;
      dispose(entry);
      ht.count := ht.count - 1;
      Delete := true;
      exit;
    end;
    prev := entry;
    entry := entry^.next;
  end;

  Delete := false;
end;

{ Print the hash table structure }
procedure PrintTable(const ht: THashTable);
var
  i: integer;
  entry: PEntry;
begin
  writeln('Hash Table (', ht.count, ' entries, ', TableSize, ' buckets):');
  for i := 0 to TableSize - 1 do
  begin
    write('  [', i:2, '] ');
    entry := ht.buckets[i];
    if entry = nil then
      write('(empty)')
    else
      while entry <> nil do
      begin
        write(entry^.key, '=', entry^.value);
        if entry^.next <> nil then
          write(' -> ');
        entry := entry^.next;
      end;
    writeln;
  end;
end;

procedure FreeTable(var ht: THashTable);
var
  i: integer;
  entry, temp: PEntry;
begin
  for i := 0 to TableSize - 1 do
  begin
    entry := ht.buckets[i];
    while entry <> nil do
    begin
      temp := entry;
      entry := entry^.next;
      dispose(temp);
    end;
    ht.buckets[i] := nil;
  end;
  ht.count := 0;
end;

{ --- Main --- }
var
  ht: THashTable;
  val: integer;
begin
  writeln('=== Chained Hash Table Demo ===');
  writeln;

  InitTable(ht);

  { Insert some city populations }
  Put(ht, 'Seattle', 737015);
  Put(ht, 'Portland', 652503);
  Put(ht, 'Spokane', 228989);
  Put(ht, 'Boise', 235684);
  Put(ht, 'SanFrancisco', 873965);
  Put(ht, 'LosAngeles', 3979576);
  Put(ht, 'Denver', 715522);
  Put(ht, 'Phoenix', 1608139);
  Put(ht, 'SaltLakeCity', 200567);
  Put(ht, 'LasVegas', 641903);

  PrintTable(ht);
  writeln;

  { Lookups }
  if Get(ht, 'Seattle', val) then
    writeln('Seattle population: ', val)
  else
    writeln('Seattle not found');

  if Get(ht, 'Chicago', val) then
    writeln('Chicago population: ', val)
  else
    writeln('Chicago not found');

  { Update }
  Put(ht, 'Seattle', 750000);
  if Get(ht, 'Seattle', val) then
    writeln('Seattle (updated): ', val);

  { Delete }
  writeln;
  if Delete(ht, 'LasVegas') then
    writeln('Deleted LasVegas')
  else
    writeln('LasVegas not found for deletion');
  writeln('Count after delete: ', ht.count);

  FreeTable(ht);
end.
```

## 29. Open Addressing (Linear Probing)

```pascal
program OpenAddressingHash;
const
  TableSize = 23;  { prime number }

type
  TEntryState = (esEmpty, esOccupied, esDeleted);

  TEntry = record
    key: string[30];
    value: integer;
    state: TEntryState;
  end;

  THashTable = record
    entries: array[0..TableSize-1] of TEntry;
    count: integer;
  end;

function HashString(const key: string; tableSize: integer): integer;
var
  i: integer;
  hash: longword;
begin
  hash := 0;
  for i := 1 to length(key) do
    hash := hash * 31 + ord(key[i]);
  HashString := hash mod tableSize;
end;

procedure InitTable(var ht: THashTable);
var
  i: integer;
begin
  for i := 0 to TableSize - 1 do
    ht.entries[i].state := esEmpty;
  ht.count := 0;
end;

{ Insert with linear probing }
function Put(var ht: THashTable; const key: string; value: integer): boolean;
var
  idx, startIdx: integer;
begin
  if ht.count >= TableSize - 1 then  { keep at least 1 empty for search termination }
  begin
    writeln('Error: hash table is full');
    Put := false;
    exit;
  end;

  idx := HashString(key, TableSize);
  startIdx := idx;

  repeat
    case ht.entries[idx].state of
      esEmpty, esDeleted:
        begin
          ht.entries[idx].key := key;
          ht.entries[idx].value := value;
          ht.entries[idx].state := esOccupied;
          ht.count := ht.count + 1;
          Put := true;
          exit;
        end;
      esOccupied:
        begin
          if ht.entries[idx].key = key then
          begin
            ht.entries[idx].value := value;  { update }
            Put := true;
            exit;
          end;
        end;
    end;

    idx := (idx + 1) mod TableSize;  { linear probe }
  until idx = startIdx;

  Put := false;
end;

{ Search with linear probing }
function Get(const ht: THashTable; const key: string;
             var value: integer): boolean;
var
  idx, startIdx: integer;
begin
  idx := HashString(key, TableSize);
  startIdx := idx;

  repeat
    case ht.entries[idx].state of
      esEmpty:
        begin
          Get := false;  { key definitely not present }
          exit;
        end;
      esOccupied:
        begin
          if ht.entries[idx].key = key then
          begin
            value := ht.entries[idx].value;
            Get := true;
            exit;
          end;
        end;
      esDeleted:
        ;  { skip tombstones and keep searching }
    end;

    idx := (idx + 1) mod TableSize;
  until idx = startIdx;

  Get := false;
end;

{
  Delete with tombstones:

  We cannot simply mark a slot as empty, because that would break
  the probe chain for other entries that were inserted after a collision
  at this position. Instead, we mark it as "deleted" (a tombstone).

  Tombstones are treated as:
    - "occupied" during search (skip over, keep probing)
    - "empty" during insertion (can be reused)

  This is the fundamental trade-off of open addressing:
  deletion requires tombstones, which degrade performance over time.
}
function Delete(var ht: THashTable; const key: string): boolean;
var
  idx, startIdx: integer;
begin
  idx := HashString(key, TableSize);
  startIdx := idx;

  repeat
    case ht.entries[idx].state of
      esEmpty:
        begin
          Delete := false;
          exit;
        end;
      esOccupied:
        begin
          if ht.entries[idx].key = key then
          begin
            ht.entries[idx].state := esDeleted;  { tombstone }
            ht.count := ht.count - 1;
            Delete := true;
            exit;
          end;
        end;
    end;

    idx := (idx + 1) mod TableSize;
  until idx = startIdx;

  Delete := false;
end;

procedure PrintTable(const ht: THashTable);
var
  i: integer;
begin
  writeln('Open Address Hash Table (count=', ht.count, '):');
  for i := 0 to TableSize - 1 do
  begin
    write('  [', i:2, '] ');
    case ht.entries[i].state of
      esEmpty:    writeln('(empty)');
      esDeleted:  writeln('(deleted/tombstone)');
      esOccupied: writeln(ht.entries[i].key, ' = ', ht.entries[i].value);
    end;
  end;
end;

{ --- Main --- }
var
  ht: THashTable;
  val: integer;
begin
  writeln('=== Open Addressing (Linear Probing) Demo ===');
  writeln;

  InitTable(ht);

  Put(ht, 'Alpha', 1);
  Put(ht, 'Beta', 2);
  Put(ht, 'Gamma', 3);
  Put(ht, 'Delta', 4);
  Put(ht, 'Epsilon', 5);

  PrintTable(ht);
  writeln;

  if Get(ht, 'Gamma', val) then
    writeln('Gamma = ', val);

  Delete(ht, 'Beta');
  writeln('After deleting Beta:');
  writeln;

  { Gamma should still be findable despite the tombstone }
  if Get(ht, 'Gamma', val) then
    writeln('Gamma still found: ', val)
  else
    writeln('ERROR: Gamma not found (tombstone bug!)');
end.
```

---

# Part 8: Sorting and Searching with Pascal Data Structures

Sorting and searching algorithms are fundamental to computer science, and Pascal has historically been the language in which they are taught. This section presents the classic algorithms with complete, compilable Pascal implementations.

## 30. Sorting Algorithms

### Bubble Sort

The simplest sorting algorithm. Repeatedly swaps adjacent elements that are out of order. O(n^2) time in all cases.

```pascal
program BubbleSortDemo;
const
  N = 10;

type
  TArray = array[1..N] of integer;

procedure PrintArray(const a: TArray; size: integer);
var
  i: integer;
begin
  write('[');
  for i := 1 to size do
  begin
    write(a[i]);
    if i < size then write(', ');
  end;
  writeln(']');
end;

procedure BubbleSort(var a: TArray; size: integer);
var
  i, j, temp: integer;
  swapped: boolean;
begin
  for i := 1 to size - 1 do
  begin
    swapped := false;
    for j := 1 to size - i do
    begin
      if a[j] > a[j + 1] then
      begin
        temp := a[j];
        a[j] := a[j + 1];
        a[j + 1] := temp;
        swapped := true;
      end;
    end;
    if not swapped then break;  { optimization: already sorted }
  end;
end;

var
  arr: TArray;
begin
  arr[1] := 64; arr[2] := 34; arr[3] := 25; arr[4] := 12; arr[5] := 22;
  arr[6] := 11; arr[7] := 90; arr[8] := 1;  arr[9] := 45; arr[10] := 78;

  write('Before: '); PrintArray(arr, N);
  BubbleSort(arr, N);
  write('After:  '); PrintArray(arr, N);
end.
```

### Selection Sort

Finds the minimum element and swaps it to the front. O(n^2) time, but fewer swaps than bubble sort.

```pascal
procedure SelectionSort(var a: TArray; size: integer);
var
  i, j, minIdx, temp: integer;
begin
  for i := 1 to size - 1 do
  begin
    minIdx := i;
    for j := i + 1 to size do
      if a[j] < a[minIdx] then
        minIdx := j;

    if minIdx <> i then
    begin
      temp := a[i];
      a[i] := a[minIdx];
      a[minIdx] := temp;
    end;
  end;
end;
```

### Insertion Sort

Builds the sorted array one element at a time. O(n^2) worst case but O(n) for nearly-sorted input.

```pascal
procedure InsertionSort(var a: TArray; size: integer);
var
  i, j, key: integer;
begin
  for i := 2 to size do
  begin
    key := a[i];
    j := i - 1;

    while (j >= 1) and (a[j] > key) do
    begin
      a[j + 1] := a[j];
      j := j - 1;
    end;

    a[j + 1] := key;
  end;
end;
```

### Quicksort

The most important sorting algorithm in practice. Average O(n log n), worst case O(n^2), but the worst case is rare with good pivot selection.

```pascal
program QuickSortDemo;
const
  MaxN = 100;

type
  TArray = array[1..MaxN] of integer;

procedure PrintArray(const a: TArray; lo, hi: integer);
var
  i: integer;
begin
  write('[');
  for i := lo to hi do
  begin
    write(a[i]);
    if i < hi then write(', ');
  end;
  writeln(']');
end;

{ Partition: rearranges so elements < pivot are left, >= pivot are right }
function Partition(var a: TArray; lo, hi: integer): integer;
var
  pivot, temp, i, j: integer;
begin
  pivot := a[hi];   { use last element as pivot }
  i := lo - 1;      { index of smaller element boundary }

  for j := lo to hi - 1 do
  begin
    if a[j] <= pivot then
    begin
      i := i + 1;
      { swap a[i] and a[j] }
      temp := a[i];
      a[i] := a[j];
      a[j] := temp;
    end;
  end;

  { Place pivot in its correct position }
  temp := a[i + 1];
  a[i + 1] := a[hi];
  a[hi] := temp;

  Partition := i + 1;
end;

procedure QuickSort(var a: TArray; lo, hi: integer);
var
  pivotIdx: integer;
begin
  if lo < hi then
  begin
    pivotIdx := Partition(a, lo, hi);
    QuickSort(a, lo, pivotIdx - 1);    { sort left partition }
    QuickSort(a, pivotIdx + 1, hi);    { sort right partition }
  end;
end;

var
  arr: TArray;
  n, i: integer;
begin
  n := 15;
  arr[1] := 38; arr[2] := 27; arr[3] := 43; arr[4] := 3;  arr[5] := 9;
  arr[6] := 82; arr[7] := 10; arr[8] := 55; arr[9] := 1;  arr[10] := 64;
  arr[11] := 17; arr[12] := 73; arr[13] := 28; arr[14] := 46; arr[15] := 5;

  writeln('=== QuickSort Demo ===');
  write('Before: '); PrintArray(arr, 1, n);
  QuickSort(arr, 1, n);
  write('After:  '); PrintArray(arr, 1, n);
end.
```

### Merge Sort

Guaranteed O(n log n) in all cases. Divides the array in half, sorts each half recursively, and merges the sorted halves. Requires O(n) extra space.

```pascal
program MergeSortDemo;
const
  MaxN = 100;

type
  TArray = array[1..MaxN] of integer;

procedure PrintArray(const a: TArray; lo, hi: integer);
var
  i: integer;
begin
  write('[');
  for i := lo to hi do
  begin
    write(a[i]);
    if i < hi then write(', ');
  end;
  writeln(']');
end;

{ Merge two sorted subarrays: a[lo..mid] and a[mid+1..hi] }
procedure Merge(var a: TArray; lo, mid, hi: integer);
var
  temp: TArray;
  i, j, k: integer;
begin
  { Copy to temporary array }
  for i := lo to hi do
    temp[i] := a[i];

  i := lo;       { pointer into left half }
  j := mid + 1;  { pointer into right half }
  k := lo;       { pointer into result }

  while (i <= mid) and (j <= hi) do
  begin
    if temp[i] <= temp[j] then
    begin
      a[k] := temp[i];
      i := i + 1;
    end
    else
    begin
      a[k] := temp[j];
      j := j + 1;
    end;
    k := k + 1;
  end;

  { Copy remaining elements from left half }
  while i <= mid do
  begin
    a[k] := temp[i];
    i := i + 1;
    k := k + 1;
  end;
  { Right half elements are already in place }
end;

procedure MergeSort(var a: TArray; lo, hi: integer);
var
  mid: integer;
begin
  if lo < hi then
  begin
    mid := (lo + hi) div 2;
    MergeSort(a, lo, mid);
    MergeSort(a, mid + 1, hi);
    Merge(a, lo, mid, hi);
  end;
end;

var
  arr: TArray;
  n: integer;
begin
  n := 12;
  arr[1] := 38; arr[2] := 27; arr[3] := 43; arr[4] := 3;
  arr[5] := 9;  arr[6] := 82; arr[7] := 10; arr[8] := 55;
  arr[9] := 1;  arr[10] := 64; arr[11] := 17; arr[12] := 73;

  writeln('=== MergeSort Demo ===');
  write('Before: '); PrintArray(arr, 1, n);
  MergeSort(arr, 1, n);
  write('After:  '); PrintArray(arr, 1, n);
end.
```

### Merge Sort on Linked Lists

Merge sort is particularly elegant on linked lists because the merge operation requires no extra space -- you just re-link the nodes:

```pascal
program MergeSortLinkedList;
type
  PNode = ^TNode;
  TNode = record
    data: integer;
    next: PNode;
  end;

procedure PrintList(head: PNode);
var
  current: PNode;
begin
  current := head;
  write('[');
  while current <> nil do
  begin
    write(current^.data);
    if current^.next <> nil then write(', ');
    current := current^.next;
  end;
  writeln(']');
end;

procedure InsertHead(var head: PNode; value: integer);
var
  node: PNode;
begin
  new(node);
  node^.data := value;
  node^.next := head;
  head := node;
end;

{ Split the list in half using the slow/fast pointer technique }
procedure Split(head: PNode; var front, back: PNode);
var
  slow, fast: PNode;
begin
  if (head = nil) or (head^.next = nil) then
  begin
    front := head;
    back := nil;
    exit;
  end;

  slow := head;
  fast := head^.next;

  while (fast <> nil) and (fast^.next <> nil) do
  begin
    slow := slow^.next;
    fast := fast^.next^.next;
  end;

  front := head;
  back := slow^.next;
  slow^.next := nil;   { cut the list in half }
end;

{ Merge two sorted lists }
function MergeLists(a, b: PNode): PNode;
var
  result: PNode;
begin
  if a = nil then begin MergeLists := b; exit; end;
  if b = nil then begin MergeLists := a; exit; end;

  if a^.data <= b^.data then
  begin
    result := a;
    result^.next := MergeLists(a^.next, b);
  end
  else
  begin
    result := b;
    result^.next := MergeLists(a, b^.next);
  end;

  MergeLists := result;
end;

{ Merge sort on linked list }
procedure MergeSort(var head: PNode);
var
  front, back: PNode;
begin
  if (head = nil) or (head^.next = nil) then
    exit;

  Split(head, front, back);
  MergeSort(front);
  MergeSort(back);
  head := MergeLists(front, back);
end;

procedure FreeList(var head: PNode);
var
  temp: PNode;
begin
  while head <> nil do
  begin
    temp := head;
    head := head^.next;
    dispose(temp);
  end;
end;

var
  list: PNode;
begin
  list := nil;

  writeln('=== Merge Sort on Linked List ===');
  writeln;

  InsertHead(list, 5);
  InsertHead(list, 82);
  InsertHead(list, 17);
  InsertHead(list, 43);
  InsertHead(list, 1);
  InsertHead(list, 64);
  InsertHead(list, 38);
  InsertHead(list, 27);
  InsertHead(list, 9);
  InsertHead(list, 55);

  write('Before: '); PrintList(list);
  MergeSort(list);
  write('After:  '); PrintList(list);

  FreeList(list);
end.
```

### Sorting Algorithm Comparison

| Algorithm | Best | Average | Worst | Space | Stable? |
|-----------|------|---------|-------|-------|---------|
| Bubble Sort | O(n) | O(n^2) | O(n^2) | O(1) | Yes |
| Selection Sort | O(n^2) | O(n^2) | O(n^2) | O(1) | No |
| Insertion Sort | O(n) | O(n^2) | O(n^2) | O(1) | Yes |
| Quicksort | O(n log n) | O(n log n) | O(n^2) | O(log n) | No |
| Merge Sort | O(n log n) | O(n log n) | O(n log n) | O(n) | Yes |

## 31. Binary Search

Binary search finds an element in a sorted array in O(log n) time by repeatedly halving the search space:

```pascal
program BinarySearchDemo;
const
  MaxN = 100;

type
  TArray = array[1..MaxN] of integer;

{ Iterative binary search }
function BinarySearch(const a: TArray; size, target: integer): integer;
var
  lo, hi, mid: integer;
begin
  lo := 1;
  hi := size;

  while lo <= hi do
  begin
    mid := (lo + hi) div 2;

    if a[mid] = target then
    begin
      BinarySearch := mid;
      exit;
    end
    else if a[mid] < target then
      lo := mid + 1
    else
      hi := mid - 1;
  end;

  BinarySearch := -1;  { not found }
end;

{ Recursive binary search }
function BinarySearchRec(const a: TArray; lo, hi, target: integer): integer;
var
  mid: integer;
begin
  if lo > hi then
  begin
    BinarySearchRec := -1;
    exit;
  end;

  mid := (lo + hi) div 2;

  if a[mid] = target then
    BinarySearchRec := mid
  else if a[mid] < target then
    BinarySearchRec := BinarySearchRec(a, mid + 1, hi, target)
  else
    BinarySearchRec := BinarySearchRec(a, lo, mid - 1, target);
end;

{ Find the first occurrence of target (for duplicates) }
function BinarySearchFirst(const a: TArray; size, target: integer): integer;
var
  lo, hi, mid, result: integer;
begin
  lo := 1;
  hi := size;
  result := -1;

  while lo <= hi do
  begin
    mid := (lo + hi) div 2;
    if a[mid] = target then
    begin
      result := mid;
      hi := mid - 1;   { continue searching left for earlier occurrence }
    end
    else if a[mid] < target then
      lo := mid + 1
    else
      hi := mid - 1;
  end;

  BinarySearchFirst := result;
end;

var
  arr: TArray;
  n, idx: integer;
begin
  n := 15;
  arr[1] := 2;  arr[2] := 5;  arr[3] := 8;   arr[4] := 12;  arr[5] := 16;
  arr[6] := 23; arr[7] := 38; arr[8] := 56;   arr[9] := 72;  arr[10] := 91;
  arr[11] := 91; arr[12] := 91; arr[13] := 95; arr[14] := 98; arr[15] := 100;

  writeln('=== Binary Search Demo ===');
  writeln;

  idx := BinarySearch(arr, n, 56);
  if idx > 0 then
    writeln('Found 56 at index ', idx)
  else
    writeln('56 not found');

  idx := BinarySearch(arr, n, 50);
  if idx > 0 then
    writeln('Found 50 at index ', idx)
  else
    writeln('50 not found');

  idx := BinarySearchRec(arr, 1, n, 23);
  if idx > 0 then
    writeln('Found 23 at index ', idx, ' (recursive)')
  else
    writeln('23 not found');

  idx := BinarySearchFirst(arr, n, 91);
  if idx > 0 then
    writeln('First occurrence of 91 at index ', idx)
  else
    writeln('91 not found');
end.
```

---

# Part 9: The Variant Record as Proto-Algebraic Data Type

Variant records are Pascal's mechanism for tagged unions -- records where the fields depend on a discriminant (tag) value. They are the most powerful construct in Pascal's type system and the closest thing to algebraic data types in any mainstream imperative language of the 1970s.

## 32. Variant Records in Depth

### Basic Variant Records

```pascal
program VariantRecords;
type
  ShapeKind = (skCircle, skRectangle, skTriangle);

  TShape = record
    x, y: real;    { position -- common to all shapes }
    case kind: ShapeKind of
      skCircle:    (radius: real);
      skRectangle: (width, height: real);
      skTriangle:  (base, altitude: real);
  end;

function Area(const s: TShape): real;
begin
  case s.kind of
    skCircle:    Area := 3.14159265 * s.radius * s.radius;
    skRectangle: Area := s.width * s.height;
    skTriangle:  Area := 0.5 * s.base * s.altitude;
  end;
end;

procedure PrintShape(const s: TShape);
begin
  write('Shape at (', s.x:0:1, ', ', s.y:0:1, '): ');
  case s.kind of
    skCircle:
      writeln('Circle, r=', s.radius:0:2, ', area=', Area(s):0:2);
    skRectangle:
      writeln('Rectangle, ', s.width:0:1, 'x', s.height:0:1,
              ', area=', Area(s):0:2);
    skTriangle:
      writeln('Triangle, base=', s.base:0:1, ', alt=', s.altitude:0:1,
              ', area=', Area(s):0:2);
  end;
end;

var
  shapes: array[1..3] of TShape;
  i: integer;
begin
  writeln('=== Variant Records Demo ===');
  writeln;

  { Circle }
  shapes[1].kind := skCircle;
  shapes[1].x := 0.0;
  shapes[1].y := 0.0;
  shapes[1].radius := 5.0;

  { Rectangle }
  shapes[2].kind := skRectangle;
  shapes[2].x := 10.0;
  shapes[2].y := 20.0;
  shapes[2].width := 8.0;
  shapes[2].height := 3.0;

  { Triangle }
  shapes[3].kind := skTriangle;
  shapes[3].x := -5.0;
  shapes[3].y := 7.0;
  shapes[3].base := 6.0;
  shapes[3].altitude := 4.0;

  for i := 1 to 3 do
    PrintShape(shapes[i]);
end.
```

### Recursive Variant Records: Expression Trees

This is where variant records shine as proto-algebraic data types. We can define a recursive expression type that is structurally identical to an algebraic data type in ML or Haskell:

```pascal
program AlgebraicExpressions;
type
  ExprKind = (ekNumber, ekAdd, ekMul, ekNeg, ekVar);

  PExpr = ^TExpr;
  TExpr = record
    case kind: ExprKind of
      ekNumber: (value: real);
      ekAdd:    (addLeft, addRight: PExpr);
      ekMul:    (mulLeft, mulRight: PExpr);
      ekNeg:    (operand: PExpr);
      ekVar:    (name: char);
  end;

{ Constructors }
function MakeNumber(v: real): PExpr;
var
  e: PExpr;
begin
  new(e);
  e^.kind := ekNumber;
  e^.value := v;
  MakeNumber := e;
end;

function MakeAdd(l, r: PExpr): PExpr;
var
  e: PExpr;
begin
  new(e);
  e^.kind := ekAdd;
  e^.addLeft := l;
  e^.addRight := r;
  MakeAdd := e;
end;

function MakeMul(l, r: PExpr): PExpr;
var
  e: PExpr;
begin
  new(e);
  e^.kind := ekMul;
  e^.mulLeft := l;
  e^.mulRight := r;
  MakeMul := e;
end;

function MakeNeg(op: PExpr): PExpr;
var
  e: PExpr;
begin
  new(e);
  e^.kind := ekNeg;
  e^.operand := op;
  MakeNeg := e;
end;

function MakeVar(n: char): PExpr;
var
  e: PExpr;
begin
  new(e);
  e^.kind := ekVar;
  e^.name := n;
  MakeVar := e;
end;

{ Pretty-print the expression }
procedure PrintExpr(e: PExpr);
begin
  case e^.kind of
    ekNumber:
      if e^.value = trunc(e^.value) then
        write(trunc(e^.value))
      else
        write(e^.value:0:2);
    ekAdd:
      begin
        write('(');
        PrintExpr(e^.addLeft);
        write(' + ');
        PrintExpr(e^.addRight);
        write(')');
      end;
    ekMul:
      begin
        write('(');
        PrintExpr(e^.mulLeft);
        write(' * ');
        PrintExpr(e^.mulRight);
        write(')');
      end;
    ekNeg:
      begin
        write('(- ');
        PrintExpr(e^.operand);
        write(')');
      end;
    ekVar:
      write(e^.name);
  end;
end;

{ Evaluate with a simple environment (single variable x) }
function Evaluate(e: PExpr; xVal: real): real;
begin
  case e^.kind of
    ekNumber: Evaluate := e^.value;
    ekAdd:    Evaluate := Evaluate(e^.addLeft, xVal) +
                          Evaluate(e^.addRight, xVal);
    ekMul:    Evaluate := Evaluate(e^.mulLeft, xVal) *
                          Evaluate(e^.mulRight, xVal);
    ekNeg:    Evaluate := -Evaluate(e^.operand, xVal);
    ekVar:    Evaluate := xVal;
  end;
end;

{ Symbolic differentiation with respect to x }
function Differentiate(e: PExpr): PExpr;
begin
  case e^.kind of
    ekNumber:
      Differentiate := MakeNumber(0);  { d/dx(c) = 0 }
    ekVar:
      Differentiate := MakeNumber(1);  { d/dx(x) = 1 }
    ekNeg:
      Differentiate := MakeNeg(Differentiate(e^.operand));
    ekAdd:
      Differentiate := MakeAdd(
        Differentiate(e^.addLeft),
        Differentiate(e^.addRight));
    ekMul:
      { Product rule: d/dx(f*g) = f'*g + f*g' }
      Differentiate := MakeAdd(
        MakeMul(Differentiate(e^.mulLeft), e^.mulRight),
        MakeMul(e^.mulLeft, Differentiate(e^.mulRight)));
  end;
end;

procedure FreeExpr(var e: PExpr);
begin
  if e = nil then exit;
  case e^.kind of
    ekAdd: begin FreeExpr(e^.addLeft); FreeExpr(e^.addRight); end;
    ekMul: begin FreeExpr(e^.mulLeft); FreeExpr(e^.mulRight); end;
    ekNeg: FreeExpr(e^.operand);
  end;
  dispose(e);
  e := nil;
end;

var
  expr, deriv: PExpr;
  x: real;
begin
  writeln('=== Algebraic Expressions with Variant Records ===');
  writeln;

  { Build: x^2 + 3*x + 5 = (x * x) + (3 * x) + 5 }
  expr := MakeAdd(
    MakeAdd(
      MakeMul(MakeVar('x'), MakeVar('x')),
      MakeMul(MakeNumber(3), MakeVar('x'))),
    MakeNumber(5));

  write('f(x) = ');
  PrintExpr(expr);
  writeln;

  { Evaluate at x=2 }
  x := 2.0;
  writeln('f(', x:0:0, ') = ', Evaluate(expr, x):0:0);
  writeln;

  { Differentiate }
  deriv := Differentiate(expr);
  write('f''(x) = ');
  PrintExpr(deriv);
  writeln;
  writeln('f''(', x:0:0, ') = ', Evaluate(deriv, x):0:0);

  FreeExpr(expr);
  FreeExpr(deriv);
end.
```

### Comparison to Modern Algebraic Data Types

The expression type above corresponds almost exactly to algebraic data types in functional languages:

**Pascal:**
```pascal
type
  ExprKind = (ekNumber, ekAdd, ekMul, ekNeg, ekVar);
  PExpr = ^TExpr;
  TExpr = record
    case kind: ExprKind of
      ekNumber: (value: real);
      ekAdd:    (addLeft, addRight: PExpr);
      ekMul:    (mulLeft, mulRight: PExpr);
      ekNeg:    (operand: PExpr);
      ekVar:    (name: char);
  end;
```

**ML/OCaml:**
```ocaml
type expr =
  | Number of float
  | Add of expr * expr
  | Mul of expr * expr
  | Neg of expr
  | Var of char
```

**Haskell:**
```haskell
data Expr = Number Double
           | Add Expr Expr
           | Mul Expr Expr
           | Neg Expr
           | Var Char
```

**Rust:**
```rust
enum Expr {
    Number(f64),
    Add(Box<Expr>, Box<Expr>),
    Mul(Box<Expr>, Box<Expr>),
    Neg(Box<Expr>),
    Var(char),
}
```

The structural similarity is striking. The key differences:

1. **Pascal requires explicit pointers** (`PExpr = ^TExpr`). ML, Haskell, and Rust handle the indirection automatically (Rust uses `Box` for heap allocation).

2. **Pascal's tag is checked at runtime**, and the programmer can access the wrong variant (accessing `value` when the kind is `ekAdd`). ML and Haskell enforce correctness through pattern matching, and Rust through match exhaustiveness checking.

3. **Pascal lacks pattern matching.** The `case` statement on the discriminant simulates pattern matching, but it does not bind variables to the variant's fields. In ML, you write `| Add(l, r) -> ...` which both checks the tag and binds `l` and `r`.

4. **Pascal requires manual memory management.** ML and Haskell have garbage collection; Rust has the ownership/borrow checker.

Despite these differences, Pascal's variant records were remarkably ahead of their time. They are the direct ancestor of tagged unions in every subsequent language, and they enabled a style of programming -- case analysis over discriminated unions -- that is now recognized as one of the most powerful techniques in software engineering.

## 33. Pattern Matching Simulation

Pascal's `case` statement over the discriminant simulates pattern matching. Here is a more complete example showing how to build a small language interpreter:

```pascal
program PatternMatchingSimulation;
type
  TokenKind = (tkInt, tkPlus, tkMinus, tkStar, tkSlash, tkLParen, tkRParen);

  { A small expression language }
  ExprTag = (etLiteral, etBinOp, etUnaryMinus, etParen);
  OpKind = (opAdd, opSub, opMul, opDiv);

  PExpr = ^TExpr;
  TExpr = record
    case tag: ExprTag of
      etLiteral:    (intVal: integer);
      etBinOp:      (op: OpKind; left, right: PExpr);
      etUnaryMinus: (inner: PExpr);
      etParen:      (child: PExpr);
  end;

function Lit(v: integer): PExpr;
var e: PExpr;
begin
  new(e); e^.tag := etLiteral; e^.intVal := v; Lit := e;
end;

function BinOp(o: OpKind; l, r: PExpr): PExpr;
var e: PExpr;
begin
  new(e); e^.tag := etBinOp; e^.op := o;
  e^.left := l; e^.right := r; BinOp := e;
end;

function Negate(x: PExpr): PExpr;
var e: PExpr;
begin
  new(e); e^.tag := etUnaryMinus; e^.inner := x; Negate := e;
end;

{ "Pattern matching" via case on the tag }
function Eval(e: PExpr): integer;
var
  l, r: integer;
begin
  case e^.tag of
    etLiteral:
      Eval := e^.intVal;

    etBinOp:
      begin
        l := Eval(e^.left);
        r := Eval(e^.right);
        case e^.op of
          opAdd: Eval := l + r;
          opSub: Eval := l - r;
          opMul: Eval := l * r;
          opDiv: if r <> 0 then Eval := l div r
                 else begin writeln('Division by zero'); Eval := 0; end;
        end;
      end;

    etUnaryMinus:
      Eval := -Eval(e^.inner);

    etParen:
      Eval := Eval(e^.child);
  end;
end;

{ Pretty printer -- another "pattern match" }
procedure Show(e: PExpr);
begin
  case e^.tag of
    etLiteral:
      write(e^.intVal);

    etBinOp:
      begin
        write('(');
        Show(e^.left);
        case e^.op of
          opAdd: write(' + ');
          opSub: write(' - ');
          opMul: write(' * ');
          opDiv: write(' / ');
        end;
        Show(e^.right);
        write(')');
      end;

    etUnaryMinus:
      begin
        write('(-');
        Show(e^.inner);
        write(')');
      end;

    etParen:
      begin
        write('(');
        Show(e^.child);
        write(')');
      end;
  end;
end;

{ Count nodes -- yet another "pattern match" }
function CountNodes(e: PExpr): integer;
begin
  case e^.tag of
    etLiteral:
      CountNodes := 1;
    etBinOp:
      CountNodes := 1 + CountNodes(e^.left) + CountNodes(e^.right);
    etUnaryMinus:
      CountNodes := 1 + CountNodes(e^.inner);
    etParen:
      CountNodes := 1 + CountNodes(e^.child);
  end;
end;

procedure FreeExpr(var e: PExpr);
begin
  if e = nil then exit;
  case e^.tag of
    etBinOp: begin FreeExpr(e^.left); FreeExpr(e^.right); end;
    etUnaryMinus: FreeExpr(e^.inner);
    etParen: FreeExpr(e^.child);
  end;
  dispose(e);
  e := nil;
end;

var
  e: PExpr;
begin
  writeln('=== Pattern Matching Simulation ===');
  writeln;

  { Build: -(3 + 4) * (10 - 2) }
  e := BinOp(opMul,
         Negate(BinOp(opAdd, Lit(3), Lit(4))),
         BinOp(opSub, Lit(10), Lit(2)));

  write('Expression: ');
  Show(e);
  writeln;

  writeln('Result: ', Eval(e));
  writeln('Nodes: ', CountNodes(e));

  FreeExpr(e);
end.
```

This is a remarkably clean interpreter, and it shows that Pascal's variant records + case statements provide about 80% of the ergonomics of true pattern matching. The missing 20% is the binding of variables (you must access `e^.left` explicitly rather than having it bound by the pattern) and exhaustiveness checking (the Pascal compiler does not warn if you miss a case).

---

# Part 10: Memory Management Patterns

Pascal programs that use dynamic memory must solve the ownership problem: who is responsible for calling `dispose` on each allocated block? Without garbage collection, this is the programmer's responsibility, and getting it wrong leads to memory leaks (failing to free memory) or dangling pointers (freeing memory too early).

## 34. The Ownership Problem

### Single-Owner Convention

The simplest and most reliable pattern: every allocated block has exactly one "owner" who is responsible for freeing it. When ownership transfers, the old owner must not free the block.

```pascal
program OwnershipDemo;
type
  PData = ^TData;
  TData = record
    value: integer;
    name: string[20];
  end;

{ Create and return a new TData (caller owns the result) }
function CreateData(val: integer; nm: string): PData;
var
  d: PData;
begin
  new(d);
  d^.value := val;
  d^.name := nm;
  CreateData := d;
end;

{ Transfer ownership: old owner sets its pointer to nil }
procedure TransferOwnership(var source: PData; var dest: PData);
begin
  if dest <> nil then
    dispose(dest);     { free any existing data at dest }
  dest := source;
  source := nil;       { source no longer owns the data }
end;

{ The owner is responsible for cleanup }
procedure DestroyData(var d: PData);
begin
  if d <> nil then
  begin
    dispose(d);
    d := nil;
  end;
end;

var
  owner1, owner2: PData;
begin
  writeln('=== Ownership Pattern Demo ===');
  writeln;

  owner1 := CreateData(42, 'Hello');
  owner2 := nil;

  writeln('owner1 has: ', owner1^.name, ' = ', owner1^.value);
  writeln('owner2 is nil: ', owner2 = nil);
  writeln;

  { Transfer ownership from owner1 to owner2 }
  TransferOwnership(owner1, owner2);
  writeln('After transfer:');
  writeln('owner1 is nil: ', owner1 = nil);
  writeln('owner2 has: ', owner2^.name, ' = ', owner2^.value);

  { owner2 is now responsible for cleanup }
  DestroyData(owner2);
end.
```

This pattern is essentially the same as Rust's move semantics (where assignment transfers ownership and invalidates the source) and C++'s `std::unique_ptr`. Pascal does not enforce this at the type level -- it is a convention that the programmer must follow manually.

### Reference Counting (Manual)

When multiple parts of a program need to refer to the same data, ownership becomes shared. Reference counting tracks the number of references and frees the data when the count reaches zero:

```pascal
program ReferenceCounting;
type
  PRefCounted = ^TRefCounted;
  TRefCounted = record
    data: string[50];
    refCount: integer;
  end;

{ Create with refcount = 1 }
function CreateRC(const s: string): PRefCounted;
var
  rc: PRefCounted;
begin
  new(rc);
  rc^.data := s;
  rc^.refCount := 1;
  CreateRC := rc;
end;

{ Increment reference count }
procedure Retain(rc: PRefCounted);
begin
  if rc <> nil then
    rc^.refCount := rc^.refCount + 1;
end;

{ Decrement reference count; dispose if zero }
procedure Release(var rc: PRefCounted);
begin
  if rc = nil then exit;

  rc^.refCount := rc^.refCount - 1;
  if rc^.refCount = 0 then
  begin
    dispose(rc);
  end;
  rc := nil;  { clear the caller's pointer }
end;

var
  a, b, c: PRefCounted;
begin
  writeln('=== Reference Counting Demo ===');
  writeln;

  a := CreateRC('Shared Data');
  writeln('Created a: "', a^.data, '", refCount = ', a^.refCount);

  { Share with b }
  b := a;
  Retain(b);
  writeln('After b := a and Retain(b): refCount = ', a^.refCount);

  { Share with c }
  c := a;
  Retain(c);
  writeln('After c := a and Retain(c): refCount = ', a^.refCount);

  { Release b }
  Release(b);
  writeln('After Release(b): refCount = ', a^.refCount);
  writeln('b is nil: ', b = nil);

  { Release c }
  Release(c);
  writeln('After Release(c): refCount = ', a^.refCount);

  { Release a -- this will dispose the memory }
  writeln('Releasing a (refCount will hit 0)...');
  Release(a);
  writeln('a is nil: ', a = nil);
  writeln('Memory has been freed.');
end.
```

This is exactly how Objective-C (manual retain/release), Swift (`strong` references), and Python (internally) manage memory. Delphi/Free Pascal's `AnsiString` type uses reference counting with copy-on-write.

The weakness of reference counting is cycles: if object A references B and B references A, both have refCount >= 1 and neither will ever be freed. This is the problem that tracing garbage collectors (Java, Go, Python's cycle detector) solve, and that Rust's ownership system prevents by construction.

## 35. Arena Allocation

Arena allocation (also called pool allocation or region-based allocation) allocates all objects from a pre-allocated array. Deallocation is "all at once" by discarding the entire arena. This pattern is extremely efficient and eliminates fragmentation:

```pascal
program ArenaAllocation;
const
  ArenaSize = 1000;

type
  PNode = ^TNode;
  TNode = record
    value: integer;
    left, right: PNode;
  end;

  TArena = record
    pool: array[0..ArenaSize-1] of TNode;
    nextFree: integer;
  end;

procedure InitArena(var arena: TArena);
begin
  arena.nextFree := 0;
end;

{ Allocate a node from the arena (O(1), no fragmentation) }
function ArenaAlloc(var arena: TArena): PNode;
begin
  if arena.nextFree >= ArenaSize then
  begin
    writeln('Error: arena exhausted');
    ArenaAlloc := nil;
    exit;
  end;

  ArenaAlloc := @arena.pool[arena.nextFree];
  arena.nextFree := arena.nextFree + 1;
end;

{ Create a BST node from the arena }
function CreateNode(var arena: TArena; val: integer): PNode;
var
  node: PNode;
begin
  node := ArenaAlloc(arena);
  if node <> nil then
  begin
    node^.value := val;
    node^.left := nil;
    node^.right := nil;
  end;
  CreateNode := node;
end;

{ Insert into BST using arena allocation }
function InsertBST(var arena: TArena; root: PNode; val: integer): PNode;
begin
  if root = nil then
  begin
    InsertBST := CreateNode(arena, val);
    exit;
  end;

  if val < root^.value then
    root^.left := InsertBST(arena, root^.left, val)
  else if val > root^.value then
    root^.right := InsertBST(arena, root^.right, val);

  InsertBST := root;
end;

procedure Inorder(node: PNode);
begin
  if node = nil then exit;
  Inorder(node^.left);
  write(node^.value, ' ');
  Inorder(node^.right);
end;

{ Free the arena: just reset the counter. O(1) for ANY number of nodes. }
procedure FreeArena(var arena: TArena);
begin
  { No individual dispose calls needed. All memory is in the static pool. }
  arena.nextFree := 0;
  writeln('Arena freed (', ArenaSize, ' nodes capacity reset to 0)');
end;

var
  arena: TArena;
  root: PNode;
  i: integer;
  values: array[1..15] of integer;
begin
  writeln('=== Arena Allocation Demo ===');
  writeln;

  InitArena(arena);
  root := nil;

  values[1] := 50;  values[2] := 30;  values[3] := 70;  values[4] := 20;
  values[5] := 40;  values[6] := 60;  values[7] := 80;  values[8] := 10;
  values[9] := 25;  values[10] := 35; values[11] := 45; values[12] := 55;
  values[13] := 65; values[14] := 75; values[15] := 90;

  for i := 1 to 15 do
    root := InsertBST(arena, root, values[i]);

  write('BST inorder: ');
  Inorder(root);
  writeln;
  writeln('Arena usage: ', arena.nextFree, ' / ', ArenaSize, ' nodes');
  writeln;

  { Free everything at once -- no traversal needed }
  FreeArena(arena);
  { root is now invalid -- all nodes were in the arena }
  root := nil;

  writeln('Arena can be reused for new data structures.');
end.
```

### Why Arena Allocation Matters

Arena allocation is not just a historical curiosity. It is used extensively in modern systems:

1. **Compilers:** Most compilers allocate AST nodes from an arena. Since the entire AST is built during parsing and discarded after code generation, arena allocation is perfect. The Pascal compiler itself likely used this pattern.

2. **Game engines:** Frame allocators in game engines allocate per-frame temporary data from an arena that is reset every frame.

3. **Web servers:** Apache's APR memory pools allocate per-request data from a pool that is freed when the request completes.

4. **Rust:** The `bumpalo` crate provides arena allocation. The `typed-arena` crate is widely used in the Rust compiler itself.

5. **Zig:** Arena allocators are a first-class pattern in Zig's allocator interface.

The key insight: if you know that a group of allocations will all be freed at the same time, arena allocation eliminates the overhead of individual `dispose` calls, eliminates fragmentation, and eliminates the possibility of memory leaks (for objects in the arena). The trade-off is that you cannot free individual objects -- it is all or nothing.

## 36. Mark/Release

Turbo Pascal's Mark/Release is a specific form of arena allocation that uses the system heap as the arena:

```pascal
program MarkReleasePattern;
{
  Mark/Release simulates arena allocation using the system heap.
  This is a Turbo Pascal feature. Free Pascal supports it for compatibility.

  The conceptual model:

  Heap before Mark:
  +--------+---------+--------+------------------+
  | Used A | Used B  | Used C |    Free space    |
  +--------+---------+--------+------------------+
                               ^
                               HeapPtr

  After Mark(savedPtr):
  savedPtr = HeapPtr (saves current position)

  Heap after more allocations:
  +--------+---------+--------+------+------+------+------+
  | Used A | Used B  | Used C | D    | E    | F    |Free  |
  +--------+---------+--------+------+------+------+------+
                               ^                    ^
                               savedPtr              HeapPtr

  After Release(savedPtr):
  +--------+---------+--------+------------------+
  | Used A | Used B  | Used C |    Free space    |
  +--------+---------+--------+------------------+
                               ^
                               HeapPtr (reset to savedPtr)

  D, E, F have been bulk-freed without individual dispose calls.
  A, B, C remain valid.
}

type
  PNode = ^TNode;
  TNode = record
    data: integer;
    next: PNode;
  end;

procedure BuildList(var head: PNode; n: integer);
var
  node: PNode;
  i: integer;
begin
  head := nil;
  for i := n downto 1 do
  begin
    new(node);
    node^.data := i;
    node^.next := head;
    head := node;
  end;
end;

function SumList(head: PNode): integer;
var
  total: integer;
begin
  total := 0;
  while head <> nil do
  begin
    total := total + head^.data;
    head := head^.next;
  end;
  SumList := total;
end;

var
  permanentList, tempList: PNode;
  heapMark: pointer;
begin
  writeln('=== Mark/Release Pattern ===');
  writeln;

  { Build a permanent list }
  BuildList(permanentList, 5);
  writeln('Permanent list sum: ', SumList(permanentList));

  { Save heap state }
  mark(heapMark);

  { Build temporary lists for computation }
  BuildList(tempList, 10000);
  writeln('Temporary list sum: ', SumList(tempList));

  { Release all temporary allocations at once }
  release(heapMark);
  writeln('Temporary list released (10000 nodes freed instantly)');

  { Permanent list is still valid }
  writeln('Permanent list sum: ', SumList(permanentList));

  { Clean up permanent list the traditional way }
  while permanentList <> nil do
  begin
    tempList := permanentList;
    permanentList := permanentList^.next;
    dispose(tempList);
  end;
  writeln('Permanent list disposed individually');
end.
```

### Memory Management Pattern Comparison

| Pattern | Allocate | Free | Fragmentation | Use Case |
|---------|---------|------|--------------|----------|
| `new`/`dispose` | O(1) avg | O(1) | Yes | General purpose |
| Reference counting | O(1) | O(1) | Yes | Shared ownership, no cycles |
| Arena allocation | O(1) | O(1) bulk | No | Temporary, bulk-freed data |
| Mark/Release | O(1) | O(1) | No | Stack-like lifetime pattern |
| Garbage collection | O(1) | Amortized | Depends | Java, Go, Python, ML |
| Ownership/Borrow | O(1) | Compile-time | No | Rust |

Pascal's manual memory management was the state of the art in 1970. It required discipline from the programmer but provided full control over allocation and deallocation timing. The patterns described in this section -- single ownership, reference counting, arena allocation -- are the same patterns used in systems programming today, now formalized in type systems (Rust) or runtime systems (Swift ARC, Python cycle-detecting GC) rather than left to programmer convention.

---

## Historical Context and Influence

Pascal's data structures were the foundation of computer science education for over two decades. Niklaus Wirth's textbook "Algorithms + Data Structures = Programs" (1976) used Pascal to present essentially the same data structures covered in this document: linked lists, trees, sorting algorithms, and hash tables. For a generation of programmers, "learning data structures" meant "writing Pascal programs that manipulate pointers."

The language's design decisions -- strong typing, no pointer arithmetic, forward references for recursive types, variant records as tagged unions -- created a programming environment where the focus was on the data structures themselves, not on fighting the language. You could not accidentally corrupt memory with pointer arithmetic (unlike C), and you could not ignore type errors (unlike FORTRAN). The result was that students who learned data structures in Pascal developed a mental model of these structures that was clean, correct, and transferable to any language.

Pascal's influence on data structure pedagogy and language design:

- **Ada (1983):** Directly descended from Pascal. Ada's `access` types, `record` types, and discriminated records are Pascal's pointers, records, and variant records with military-grade engineering.

- **Modula-2 (1978) and Oberon (1987):** Wirth's own successors to Pascal. Same data structure patterns with better modularity.

- **C (1972):** Developed contemporaneously but with a different philosophy. C's `struct` is simpler than Pascal's `record` (no variant part), and C added pointer arithmetic that Pascal deliberately excluded. C's influence came through Unix; Pascal's through education.

- **ML (1973) and Haskell (1990):** Took Pascal's variant records and elevated them to algebraic data types with pattern matching. This is arguably the most important single line of evolution from Pascal.

- **Java (1995):** Adopted Pascal's strong typing philosophy but replaced pointers with references and variant records with class hierarchies. Java's enum (JDK 5) was inspired by Pascal's enumerated types.

- **Rust (2015):** Synthesized Pascal's type safety with C's performance. Rust's `enum` with data is a direct descendant of Pascal's variant records. Rust's ownership system formalizes the single-owner convention that Pascal programmers practiced manually.

---

## References

1. Wirth, N. (1971). "The Programming Language Pascal." *Acta Informatica*, 1(1), 35-63.

2. Wirth, N. (1976). *Algorithms + Data Structures = Programs*. Prentice-Hall.

3. Jensen, K. and Wirth, N. (1974). *Pascal User Manual and Report*. Springer-Verlag. (ISO 7185 reference)

4. Kernighan, B.W. (1981). "Why Pascal is Not My Favorite Programming Language." Bell Labs Computing Science Technical Report No. 100.

5. ISO 7185:1990. *Programming languages -- Pascal*. International Organization for Standardization.

6. ISO/IEC 10206:1991. *Programming languages -- Extended Pascal*. International Organization for Standardization.

7. Borland International (1988). *Turbo Pascal Reference Manual*. Version 5.0.

8. Free Pascal Contributors. *Free Pascal Reference Guide*. https://www.freepascal.org/docs.html

9. Knuth, D.E. (1997). *The Art of Computer Programming, Volume 1: Fundamental Algorithms*. 3rd edition. Addison-Wesley.

10. Cormen, T.H., Leiserson, C.E., Rivest, R.L., and Stein, C. (2009). *Introduction to Algorithms*. 3rd edition. MIT Press.

11. Adelson-Velsky, G.M. and Landis, E.M. (1962). "An Algorithm for the Organization of Information." *Soviet Mathematics -- Doklady*, 3, 1259-1263.

12. Dijkstra, E.W. (1959). "A Note on Two Problems in Connexion with Graphs." *Numerische Mathematik*, 1, 269-271.

13. Sedgewick, R. (1998). *Algorithms in Pascal*. 3rd edition. Addison-Wesley.

14. Dale, N. and Weems, C. (1997). *Pascal Plus Data Structures, Algorithms, and Advanced Programming*. 4th edition. Jones and Bartlett.

15. Cooper, D. and Clancy, M. (1985). *Oh! Pascal!* 2nd edition. W.W. Norton.

---

*PNW Research Series -- Pascal Data Structures. Written as a comprehensive technical reference for the programming language deep dive collection.*

---

## Study Guide — Pascal Data Structures

### Key concepts

1. **Records.** Pascal records have strong typing and no
   padding ambiguity — the canonical data structure.
2. **Pointers.** Typed pointers to known types. Much safer
   than C.
3. **Variant records.** Tagged unions with the discriminator
   in the record itself.
4. **Dynamic allocation.** `new` and `dispose` for pointer
   targets. No garbage collection.
5. **Linked data.** Linked lists and trees are first-class
   examples in Pascal teaching tradition.

---

## Programming Examples

### Example 1 — Linked list

```pascal
type
  NodePtr = ^Node;
  Node = record
    value: Integer;
    next:  NodePtr;
  end;

procedure PushFront(var head: NodePtr; v: Integer);
var n: NodePtr;
begin
  new(n);
  n^.value := v;
  n^.next := head;
  head := n;
end;
```

### Example 2 — Binary tree

```pascal
type
  TreePtr = ^TreeNode;
  TreeNode = record
    key: Integer;
    left, right: TreePtr;
  end;

procedure Insert(var t: TreePtr; k: Integer);
begin
  if t = nil then begin
    new(t);
    t^.key := k;
    t^.left := nil;
    t^.right := nil;
  end
  else if k < t^.key then Insert(t^.left, k)
  else Insert(t^.right, k);
end;
```

---

## DIY & TRY

### DIY 1 — Implement a hash table

Use Free Pascal or Turbo Pascal. Build a hash table with
separate chaining. 100 lines.

### DIY 2 — Port a C linked list to Pascal

Observe the difference between `NodePtr^` (Pascal) and
`node->` (C). Pascal's pointer syntax is cleaner.

### TRY — Draw a tree with ASCII art

Write a procedure that prints a binary tree rotated 90°.
Classic first-semester Pascal exercise.

---

## Related College Departments

- [**coding**](../../../.college/departments/coding/DEPARTMENT.md)
- [**mathematics**](../../../.college/departments/mathematics/DEPARTMENT.md)
