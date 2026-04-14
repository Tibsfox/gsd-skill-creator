# REXX and ARexx: History, Design Philosophy, and Architecture

Generated: 2026-04-09 | PNW Research Series | Tibsfox.com
Classification: Foundational Reference — ARexx Porting Project

---

## Part I: Origins — Mike Cowlishaw and the Birth of REXX

### 1. The Problem Space: IBM Mainframe Scripting Before REXX

By the late 1970s, IBM's VM/CMS (Virtual Machine / Conversational Monitor System) had become the dominant interactive computing environment within IBM and across its customer base. VM/CMS provided each user with a virtual machine — a complete simulated System/370 — and CMS ran inside it as a single-user operating system. The environment was powerful but desperately needed a competent scripting language.

What it had instead was **EXEC**, and later **EXEC 2**.

**EXEC** (sometimes called CMS EXEC) was the original command procedure language for CMS, dating to the early 1970s. EXEC was primitive even by the standards of its era. Variables were accessed positionally via a data stack. There were no proper subroutines, no structured control flow, and error handling was essentially nonexistent. An EXEC file was little more than a sequence of CMS commands with rudimentary variable substitution. The `&STACK` and `&TYPE` commands were the closest things to I/O primitives. Conditional logic was handled via `&IF`, but there was no `ELSE` — you had to use `&GOTO` to skip around unwanted code. Every script of any complexity became a tangled web of labels and jumps.

**EXEC 2**, introduced in the late 1970s (circa 1979), was a significant improvement. It added proper variables (prefixed with `&`), buffers for stack manipulation, and somewhat more readable syntax. EXEC 2 introduced `&LOOP` for iteration and `&IF ... &ELSE` for branching. But it remained a command-substitution language at heart — it processed lines of text, substituting variable values, and then passed the result to CMS for execution. There was no expression evaluator. If you wanted to add two numbers, you had to invoke the CMS `EXECMATH` function or use an external program. String manipulation required calling external commands. EXEC 2 was adequate for simple command sequences but fell apart for anything resembling a real program.

Meanwhile, on the TSO (Time Sharing Option) side of the IBM mainframe world, **CLIST** (Command List) served a similar role for MVS/TSO users. CLIST had its own quirks: variables prefixed with `&`, a PROC statement for parameter declaration, and a peculiar syntax where you wrote `SET X = &A + &B` but the expression evaluator was limited and error-prone. CLIST was widely used but universally disliked by anyone who had used a proper programming language. Its error messages were cryptic, its parsing was fragile, and debugging was an exercise in frustration.

This was the landscape in 1979: two major IBM interactive environments (VM/CMS and MVS/TSO), both with scripting languages that were inadequate for the growing demands of system automation, end-user computing, and application integration.

### 2. Michael Frank Cowlishaw: The Language Designer

**Michael Frank Cowlishaw** (born 1949 or 1950, United Kingdom) was a researcher at IBM's United Kingdom Laboratories in **Hursley Park**, near Winchester, Hampshire. Hursley Park is a historic estate — a Baroque country house that IBM acquired in 1958 — and it became IBM's primary European development laboratory. It was (and remains) the home of CICS (Customer Information Control System), one of IBM's most important software products, and a center for programming language research.

Cowlishaw studied mathematics at the **University of Birmingham** and subsequently joined IBM Hursley in the early 1970s. His mathematical background profoundly influenced REXX's design, particularly its approach to arithmetic (arbitrary precision, decimal floating point, and the insistence that `0.1 + 0.2` should equal `0.3` — a property that IEEE 754 binary floating point famously lacks).

By the late 1970s, Cowlishaw was an experienced systems programmer who used EXEC 2 daily and found it wanting. He was also deeply familiar with PL/I, which was his primary language for production work at Hursley. PL/I (Programming Language One) was IBM's attempt at a universal programming language, designed in the 1960s to combine the best features of FORTRAN (scientific computing), COBOL (business computing), and ALGOL 60 (structured programming). PL/I was powerful but enormously complex — it had hundreds of built-in functions, intricate declaration syntax, and a specification that ran to thousands of pages. Cowlishaw understood both the power and the burden of PL/I's complexity.

His insight was this: a scripting language should have the **readability** of natural English, the **power** of a proper programming language (including real arithmetic, proper string handling, and structured control flow), but the **simplicity** that PL/I had sacrificed in pursuit of universality. He wanted a language where a complete novice could write simple scripts immediately, but an expert could write complex programs without feeling constrained.

Cowlishaw began designing REXX in **March 1979** as a personal project. He wrote the first implementation on VM/CMS, initially calling it **REX** (Reformed Executor). The name was later changed to **REXX** — **REstructured eXtended eXecutor** — partly to avoid conflicts with other products using the name "REX," and partly because the double-X looked distinctive. The backronym fit well: REXX was indeed a restructured (compared to EXEC's lack of structure) and extended (compared to EXEC 2's limited capabilities) executor.

The first REXX interpreter was written in PL/I and ran on VM/CMS. It was made available internally within IBM in **1979**, and the response was immediate and enthusiastic. REXX spread virally within IBM. By 1982, it had become the **official scripting language for VM/CMS**, replacing EXEC 2 as the recommended procedure language. IBM shipped REXX as a standard component of VM/SP Release 3 (1983) and all subsequent VM releases.

Cowlishaw documented the language in what became one of the most respected programming language books of the 1980s: **"The REXX Language: A Practical Approach to Programming"**, first published by Prentice-Hall in **1985** (ISBN 0-13-780651-5). A second edition followed in **1990** (ISBN 0-13-780735-X). The subtitle — "A Practical Approach to Programming" — was not mere marketing; it was a statement of design philosophy. Every design decision in REXX was evaluated against the criterion: "Is this practical? Will this help the programmer get their work done?"

Cowlishaw was elected a **Fellow of the Royal Academy of Engineering** and received an **OBE (Officer of the Order of the British Empire)** for his contributions to computing. He later created **NetRexx** (REXX for the Java Virtual Machine) and led the development of the **IEEE 754-2008** decimal floating-point arithmetic standard — a direct outgrowth of his work on REXX's arithmetic model. His career at IBM spanned over three decades at Hursley.

### 3. Design Philosophy: The Principles Behind REXX

Cowlishaw articulated several explicit design principles for REXX, and understanding these is essential for any porting project because they explain *why* the language works the way it does.

#### 3.1. The Principle of Least Astonishment

REXX's overriding design rule: the language should do what the programmer expects. If there's a choice between two behaviors, choose the one that will surprise fewer people. This manifests everywhere:

- **No reserved words.** In REXX, you can use `IF`, `THEN`, `DO`, `END`, `SAY`, or any other keyword as a variable name. The parser disambiguates by context. This means that a novice who writes `SAY = 5` won't get a mysterious error — it simply assigns the value `5` to a variable named `SAY`. The cost is parser complexity, but Cowlishaw considered this a worthwhile trade.

- **Decimal arithmetic by default.** `1/3` gives `0.333333333` (to the current precision), not a binary floating-point approximation. `0.1 + 0.2` equals `0.3`, not `0.30000000000000004`. This matches how humans think about numbers.

- **Strings are the universal type.** There's no type system to learn, no declarations to write, no casting to perform. A variable holds a string. If that string looks like a number, arithmetic operations work on it. If it doesn't, you get a clear error message. This eliminates an enormous class of beginner mistakes.

- **Consistent syntax.** Every REXX instruction ends at the end of a line (or at a semicolon). Continuation is explicit (a trailing comma). There are no context-dependent line-ending rules, no significant whitespace, and no invisible characters that change meaning.

#### 3.2. Human Readability

Cowlishaw's goal was that a REXX program should be readable by someone who had never seen REXX before. Consider:

```rexx
/* Calculate the average of a list of numbers */
say "Enter numbers, one per line. Enter 'done' when finished."
total = 0
count = 0
do forever
  pull value
  if value = 'DONE' then leave
  total = total + value
  count = count + 1
end
if count > 0 then
  say "The average is" total / count
else
  say "No numbers were entered."
```

This program is readable as English prose. `SAY` means "print to the screen." `PULL` means "read a line of input." `DO FOREVER` means "loop indefinitely." `LEAVE` means "exit the loop." `IF/THEN/ELSE` needs no explanation. There are no sigils on variable names, no semicolons at line ends (unless you want multiple statements on one line), no brackets or braces for blocks — just `DO` and `END`.

#### 3.3. Simplicity Without Sacrifice

REXX achieves remarkable power with a minimal set of concepts:

- **23 instructions** in the base language (standard REXX): ADDRESS, ARG, CALL, DO, DROP, EXIT, IF, INTERPRET, ITERATE, LEAVE, NOP, NUMERIC, OPTIONS, PARSE, PROCEDURE, PULL, PUSH, QUEUE, RETURN, SAY, SELECT, SIGNAL, TRACE.
- **Over 70 built-in functions** for string manipulation, arithmetic, conversion, and I/O.
- **One data type** (string).
- **No declarations** — variables spring into existence on first assignment.
- **No linkage editor, no compilation step** — REXX programs are interpreted directly from source.

Yet from these minimal building blocks, REXX programs can do arbitrary-precision arithmetic, complex string parsing, dynamic code generation (via INTERPRET), structured error handling, and interprocess communication (via ADDRESS).

#### 3.4. Cowlishaw's Own Enumeration

In his book and in various presentations, Cowlishaw listed these specific goals:

1. **Readability** — programs should be easy to read and understand
2. **Natural data typing** — no type declarations; context determines interpretation
3. **Minimal notation** — few special characters, no operator overloading confusion
4. **Unlimited precision arithmetic** — no artificial limits on numeric accuracy
5. **Content-addressable arrays** — associative lookup by any string key (stems)
6. **Extensive built-in functions** — no external library needed for common operations
7. **Powerful parsing** — first-class support for string decomposition
8. **Debugging support** — built-in tracing of execution and results
9. **Consistent and reliable** — no surprises, no undefined behavior, no implementation-dependent semantics (within the standard)
10. **Small and fast implementation** — the interpreter should be practical on resource-constrained systems

### 4. VM/CMS Context: Why Mainframes Needed a Scripting Language

To understand REXX's success, you need to understand the VM/CMS environment of the late 1970s and 1980s.

**VM/370** (and its successors VM/SP, VM/XA, VM/ESA, z/VM) provided a unique computing model: each user got a complete virtual machine. This was not a time-sharing terminal connected to a shared OS — it was a private copy of the hardware, running its own operating system (typically CMS). Users could install their own programs, create their own disk files, and customize their environment without affecting anyone else.

CMS provided a command-line interface with a rich set of commands for file manipulation, text editing (XEDIT was the standard editor, itself deeply integrated with REXX), communication (via RSCS and later TCP/IP), and programming (compilers for PL/I, FORTRAN, C, COBOL, Pascal, and assembler were available). The **CMS Pipelines** subsystem (designed by John Hartmann, inspired by Unix pipes) allowed commands to be connected in pipelines, and REXX was the natural glue language for pipeline stages.

In this environment, scripting was not optional — it was the primary way to get work done. System administrators wrote REXX EXECs to manage virtual machines, configure networking, automate backups, and monitor system health. Application developers used REXX as a prototyping language, a test harness, and a build tool. End users wrote REXX scripts to automate their daily workflows. The **XEDIT** editor's macro language *was* REXX — you could write XEDIT macros in full REXX, with access to the editor's internal data structures via the editor's subcommand environment.

This deep integration — where the scripting language was not an add-on but a fundamental part of the operating environment — was the model that ARexx would later replicate on the Amiga.

The transition from EXEC 2 to REXX on VM/CMS happened gradually but completely. By the mid-1980s, new development was done in REXX, and EXEC 2 was maintained only for backward compatibility. Key factors in REXX's adoption:

- **Zero-install deployment.** REXX was part of the operating system. Every VM/CMS user had it.
- **Immediate productivity.** A user could write `say "Hello"` and see it work. No compilation, no linkage, no JCL.
- **XEDIT integration.** The most-used application on CMS (the text editor) used REXX as its macro language.
- **CMS Pipelines integration.** REXX programs could be pipeline stages, processing data streams.
- **Backward compatibility.** REXX could call CMS commands and EXEC 2 programs. Migration was incremental.

### 5. ANSI X3.274-1996: The Formal Standard

REXX was formally standardized as **ANSI X3.274-1996**, titled "Information Technology — Programming Language REXX." The standard was developed by ANSI Technical Committee X3J18, chaired by **Brian Marks** of IBM. Work began in **1991** and the standard was approved on **March 18, 1996**.

The ANSI standard defines:

- **The core language:** All 23 instructions, their syntax, and their semantics.
- **Built-in functions:** The complete set of standard functions, their arguments, and their return values.
- **Arithmetic:** The rules for decimal arithmetic, including precision, rounding, and the behavior of `NUMERIC DIGITS`, `NUMERIC FUZZ`, and `NUMERIC FORM`.
- **Parsing templates:** The complete syntax and semantics of the `PARSE` instruction's template language.
- **Error conditions:** The standard set of conditions (`ERROR`, `FAILURE`, `HALT`, `NOVALUE`, `NOTREADY`, `SYNTAX`) and their semantics.
- **Tracing:** The behavior of the `TRACE` instruction and its options.

What the standard **does not** define:

- **I/O model.** The standard defines `LINEIN`, `LINEOUT`, `CHARIN`, `CHAROUT`, `LINES`, `CHARS`, and `STREAM` as external functions, but their exact behavior (especially regarding stream naming and file system interaction) is implementation-dependent.
- **The ADDRESS instruction's environments.** The standard defines the syntax of `ADDRESS` (for sending commands to external environments) but not what environments exist — that's inherently platform-specific.
- **The external function interface.** How REXX finds and calls external functions is implementation-dependent.
- **Character set.** The standard is character-set-independent, though most implementations assume ASCII or EBCDIC.

Key differences between the ANSI standard and IBM's CMS implementation:

- The standard formalized some behaviors that IBM's implementation had left undefined.
- IBM's CMS REXX had additional built-in functions not in the standard (e.g., `STORAGE()`, `DIAG()`, and other system-specific functions).
- The standard added `PARSE VALUE expression WITH template` (the `WITH` keyword), which some earlier implementations did not require.
- Error handling semantics were tightened: the standard is more precise about what happens when a `SIGNAL ON` trap fires.

The ANSI standard has been the reference point for all subsequent REXX implementations. ISO later adopted it as **ISO/IEC 18009:2024** after a long standardization process. The standard is available from ANSI or can be found through RexxLA (the REXX Language Association).

### 6. Key Influences on REXX's Design

Cowlishaw was explicit about REXX's intellectual heritage:

**PL/I** — The strongest influence. REXX borrowed PL/I's expression syntax, its approach to built-in functions, its `SELECT/WHEN/OTHERWISE/END` construct, and its general philosophy that a single language should handle many tasks. But REXX deliberately shed PL/I's complexity: no declarations, no storage classes, no structure types, no pointer arithmetic, no preprocessor. Where PL/I offered a dozen ways to do something, REXX offered one clear way.

**EXEC 2** — The direct predecessor. REXX inherited EXEC 2's role (scripting on VM/CMS), its concept of the program stack (PUSH/PULL/QUEUE), and its integration with the CMS command environment. But REXX replaced EXEC 2's line-oriented substitution model with a proper expression evaluator and parser.

**ALGOL 60** — Cowlishaw cited ALGOL's influence on structured programming constructs. The `DO/END` block structure, the `IF/THEN/ELSE` conditional, and the general principle that programs should be built from nested blocks all trace back to ALGOL. However, REXX's `DO` is far more versatile than ALGOL's `begin` — it serves as a simple block delimiter, a counted loop, a conditional loop (`DO WHILE`, `DO UNTIL`), an infinite loop (`DO FOREVER`), and a combined counted-conditional loop.

**English natural language** — This is perhaps the most unusual influence. Cowlishaw deliberately chose keywords that read as English words: `SAY` (not `PRINT` or `WRITE`), `PULL` (not `READ` or `INPUT`), `LEAVE` (not `BREAK`), `ITERATE` (not `CONTINUE`). The absence of sigils, the minimal punctuation, and the free-format layout all serve readability. A REXX program looks more like pseudocode than like a traditional programming language.

**What REXX invented:**

- **The PARSE instruction** — nothing quite like it existed before. PARSE's template-based string decomposition is a unique contribution to language design.
- **Arbitrary-precision decimal arithmetic as a default** — other languages (notably COBOL) had decimal arithmetic, but REXX made unlimited precision the *default* behavior, controlled by a simple `NUMERIC DIGITS` instruction.
- **The INTERPRET instruction** — while LISP had `eval`, REXX's INTERPRET is designed for a different use case: dynamic construction of code from string operations, integrated with the surrounding variable scope.
- **No reserved words** — achieved through a context-sensitive parser that distinguishes keywords from variable names based on position. This was an unusual design choice that few languages have replicated.
- **Built-in execution tracing** — the TRACE instruction, with its multiple levels of detail, was unique among scripting languages and reflected Cowlishaw's understanding that debugging is where programmers spend most of their time.

---

## Part II: REXX Language Architecture — Deep Technical Reference

### 7. The Typeless System: Everything Is a String

REXX's type system is radical in its simplicity: **every value is a string**. There are no integers, no floating-point numbers, no booleans, no arrays, no objects, no null values. A REXX variable holds a sequence of characters. Period.

What makes this work is REXX's **interpretation rules**: when a value is used in an arithmetic context, REXX checks whether it looks like a valid number. If it does, arithmetic proceeds. If it doesn't, REXX raises a `SYNTAX` error with a clear message. The key rules:

```rexx
x = "42"        /* x holds the string "42" */
y = 42           /* y also holds the string "42" — identical */
say x + y        /* Outputs: 84 — both are valid numbers */
say x || y       /* Outputs: 4242 — concatenation */

z = "hello"
say z + 1        /* SYNTAX ERROR: Bad arithmetic conversion */
```

A "number" in REXX is any string that matches the pattern: optional leading/trailing blanks, optional sign (`+` or `-`), digits with an optional decimal point, and an optional exponent (`E` or `e` followed by an optional sign and digits). Leading zeros are significant only for the value zero itself. Trailing zeros after a decimal point are significant (they indicate precision).

#### Arbitrary Precision Arithmetic

This is one of REXX's most important features for our porting project.

The `NUMERIC DIGITS` instruction controls the precision of arithmetic operations. The default is **9 significant digits**. But you can set it to any positive integer:

```rexx
numeric digits 9          /* Default */
say 1/3                   /* 0.333333333 */

numeric digits 50
say 1/3                   /* 0.33333333333333333333333333333333333333333333333333 */

numeric digits 1000
say 1/3                   /* 1000 digits of precision */
```

There is **no upper limit** mandated by the language. Implementations may impose practical limits (memory, performance), but the language specification says DIGITS can be any positive whole number. This means REXX can serve as an arbitrary-precision calculator out of the box, with no special libraries.

REXX arithmetic is **decimal**, not binary. This means:

```rexx
numeric digits 50
say 0.1 + 0.2             /* 0.3 — exact, not 0.30000000000000004 */
say 1.0 - 0.9 - 0.1       /* 0 — exact */
```

The `NUMERIC FORM` instruction controls exponential notation: `SCIENTIFIC` (default, one digit before the decimal point) or `ENGINEERING` (exponent is always a multiple of 3).

```rexx
numeric form scientific
say 12345 * 67890          /* 8.38102050E+8 (with DIGITS 9) */

numeric form engineering
say 12345 * 67890          /* 838.102050E+6 */
```

The `NUMERIC FUZZ` instruction controls how many digits are ignored during comparisons (useful for "close enough" testing):

```rexx
numeric digits 9
numeric fuzz 3
say (1.000000001 = 1.000000009)   /* 1 (true) — last 3 digits ignored */
```

**Arithmetic operations** are defined precisely in the ANSI standard. The rules for addition, subtraction, multiplication, and division follow Cowlishaw's "General Decimal Arithmetic" specification, which later became the basis for **IEEE 754-2008**'s decimal floating-point arithmetic. This is not a coincidence — Cowlishaw literally wrote the specification for both REXX's arithmetic and the IEEE standard.

The integer division operator is `%`, and the remainder operator is `//`:

```rexx
say 17 / 5                /* 3.4 */
say 17 % 5                /* 3 — integer division */
say 17 // 5               /* 2 — remainder */
```

The power operator is `**`:

```rexx
say 2 ** 10               /* 1024 */
numeric digits 100
say 2 ** 128              /* 340282366920938463463374607431768211456 — exact */
```

**Why this matters for porting:** Any ARexx port must faithfully implement REXX's decimal arithmetic model. Using JavaScript's `Number` type (IEEE 754 binary64) or Rust's `f64` will produce incorrect results for many REXX programs. The implementation must use a decimal arithmetic library (such as `rust_decimal`, `bigdecimal`, or a custom implementation) that supports arbitrary precision. The `NUMERIC DIGITS` instruction must dynamically control precision at runtime.

### 8. Parsing: REXX's Killer Feature

The `PARSE` instruction is the single most distinctive feature of REXX. It provides a declarative, template-based system for decomposing strings into variables. Nothing else in mainstream programming languages quite matches it.

#### Basic Syntax

```rexx
PARSE [UPPER] source template
```

Where `source` is one of:
- `ARG` — command-line arguments (or subroutine arguments)
- `PULL` — read a line from the external data queue (or standard input)
- `VAR name` — the value of a variable
- `VALUE expression WITH` — the value of an expression
- `SOURCE` — information about how the program was invoked
- `VERSION` — REXX interpreter version information
- `LINEIN` — read a line from the default input stream (some implementations)

And `template` is a parsing template consisting of variable names, literal patterns, and positional patterns.

The optional `UPPER` keyword converts the parsed string to uppercase before applying the template.

#### Template Patterns

**Simple word parsing** — Variables in the template receive successive blank-delimited words:

```rexx
data = "John Smith 42 Seattle"
parse var data first last age city
/* first = "John", last = "Smith", age = "42", city = "Seattle" */
```

The last variable in the template receives the entire remainder of the string:

```rexx
data = "John Smith 42 Seattle WA 98101"
parse var data first rest
/* first = "John", rest = "Smith 42 Seattle WA 98101" */
```

**Literal patterns** — A quoted string in the template specifies a delimiter:

```rexx
data = "2026-04-09"
parse var data year "-" month "-" day
/* year = "2026", month = "04", day = "09" */
```

```rexx
data = "name=John&age=42&city=Seattle"
parse var data "name=" name "&age=" age "&city=" city
/* name = "John", age = "42", city = "Seattle" */
```

**Positional patterns** — A number specifies an absolute or relative character position:

```rexx
data = "ABCDEFGHIJ"
parse var data 1 first 4 second 7 third
/* first = "ABC", second = "DEF", third = "GHIJ" */
```

Relative positions use `+` or `-`:

```rexx
data = "ABCDEFGHIJ"
parse var data chunk1 +3 chunk2 +3 chunk3
/* chunk1 = "ABC", chunk2 = "DEF", chunk3 = "GHIJ" */
```

**Variable patterns** — A parenthesized variable name specifies a position taken from a variable:

```rexx
start = 4
length = 3
data = "ABCDEFGHIJ"
parse var data =(start) +3 result
/* result = "DEF" */
```

**The placeholder (`.`)** — A period in the template discards the corresponding value:

```rexx
data = "John Smith 42 Seattle"
parse var data . . age .
/* age = "42" — first name, last name, and city are discarded */
```

#### PARSE Internals: How It Works

The PARSE instruction processes the template left to right, maintaining a **parse cursor** that tracks the current position in the source string.

1. When a **variable name** is encountered, the parser assigns characters from the current cursor position to the variable. How many characters depends on the next element in the template.
2. When a **literal pattern** is encountered, the parser searches for that literal in the source string, starting from the current cursor position. The search is case-sensitive (unless `PARSE UPPER` was used, in which case the source was already uppercased). The text *between* the current cursor position and the found literal is assigned to the preceding variable. The cursor advances past the found literal.
3. When an **absolute positional pattern** is encountered, the cursor moves to that position (1-based).
4. When a **relative positional pattern** (`+n` or `-n`) is encountered, the cursor moves forward or backward by that many positions.
5. At the end of the template, the last variable receives everything from the current cursor position to the end of the string.

This mechanism is remarkably powerful. It can handle fixed-width records, delimited data, mixed-format records, and many patterns that would require regular expressions in other languages. And it does so with a syntax that reads almost like English:

```rexx
/* Parse an HTTP request line */
requestline = "GET /index.html HTTP/1.1"
parse var requestline method " " path " HTTP/" version
/* method = "GET", path = "/index.html", version = "1.1" */
```

```rexx
/* Parse a CSV line (simple case, no embedded commas) */
csvline = "Alice,30,Engineer,Seattle"
parse var csvline name "," age "," title "," city
/* name = "Alice", age = "30", title = "Engineer", city = "Seattle" */
```

```rexx
/* Parse a fixed-width mainframe record */
record = "SMITH   JOHN    M19760421SEATTLE  WA98101"
parse var record lastname 9 firstname 17 mi 18 dob 26 city 35 state 37 zip
/* lastname = "SMITH   ", firstname = "JOHN    ", mi = "M", etc. */
```

**Why PARSE matters for porting:** PARSE is used extensively in real-world REXX and ARexx programs. Any port must implement the full template syntax, including all three pattern types (literal, positional, variable), the placeholder, the `UPPER` option, and all source types. The parsing algorithm is well-defined and deterministic, so implementation should be straightforward — but getting the edge cases right (what happens with overlapping positional patterns, what happens when a literal isn't found, etc.) requires careful attention to the ANSI standard.

### 9. Stems: Compound Variables and Associative Arrays

REXX's compound variables (commonly called **stems**) provide associative array functionality. The syntax is:

```rexx
stem.tail
```

Where `stem` is a variable name ending in a period, and `tail` is one or more tokens separated by periods. The tail components are **evaluated** — they are variable references, not literal strings.

```rexx
name.1 = "Alice"
name.2 = "Bob"
name.3 = "Carol"
name.0 = 3               /* Convention: stem.0 holds the count */

do i = 1 to name.0
  say name.i              /* Outputs: Alice, Bob, Carol */
end
```

The key insight is that the tail is evaluated:

```rexx
key = "seattle"
population.key = 737015   /* Same as population.seattle = 737015 */

city = "seattle"
say population.city       /* Outputs: 737015 — city is evaluated to "seattle" */
```

Multi-dimensional arrays use multiple tail components:

```rexx
matrix.1.1 = 1
matrix.1.2 = 0
matrix.2.1 = 0
matrix.2.2 = 1
```

**The stem itself** can be assigned a default value:

```rexx
count. = 0                /* All unset compound variables under count. now default to 0 */
count.apples = 5
say count.apples          /* 5 */
say count.oranges         /* 0 — the default value */
```

**The `DROP` instruction** resets a stem:

```rexx
drop count.               /* Reset all compound variables under count. */
```

The `stem.0` convention is a universally followed (but not language-mandated) convention in REXX programming. When a stem is used as a list, `stem.0` holds the number of elements. This convention is so universal that many built-in functions and external functions in REXX implementations use it.

**Limitations:** Stems are not first-class values — you cannot pass a stem to a function (you pass the stem name as a string and use `VALUE()` or `INTERPRET` to access it). Stems cannot be nested in the way that objects can. There is no way to enumerate the keys of a stem in standard REXX (though some implementations add this capability). These limitations motivated the development of Object REXX.

### 10. Control Structures

REXX's control structures are elegant and consistent.

#### DO/END Block

The `DO` instruction is REXX's Swiss army knife. It serves as:

**Simple block:**
```rexx
do
  say "Line 1"
  say "Line 2"
end
```

**Counted loop:**
```rexx
do i = 1 to 10
  say i
end

do i = 1 to 10 by 2        /* Step by 2 */
  say i                     /* 1, 3, 5, 7, 9 */
end

do i = 10 to 1 by -1       /* Count down */
  say i
end
```

**Conditional loop:**
```rexx
do while condition
  /* ... */
end

do until condition
  /* ... */
end
```

**Infinite loop:**
```rexx
do forever
  /* ... use LEAVE to exit */
end
```

**Counted with condition:**
```rexx
do i = 1 to 100 while value > threshold
  /* Exits when either i > 100 or value <= threshold */
end
```

**Repetition:**
```rexx
do 5
  say "Hello"              /* Printed 5 times */
end
```

`LEAVE` exits the innermost (or named) loop. `ITERATE` skips to the next iteration.

```rexx
do i = 1 to 10
  if i = 5 then iterate    /* Skip 5 */
  if i = 8 then leave      /* Stop at 8 */
  say i                     /* 1, 2, 3, 4, 6, 7 */
end
```

#### IF/THEN/ELSE

```rexx
if condition then
  instruction

if condition then do
  instruction1
  instruction2
end
else do
  instruction3
  instruction4
end
```

Note: `THEN` is mandatory. There is no `ELSIF` or `ELSEIF` — use `SELECT` or nested `IF` for multi-way branches.

#### SELECT/WHEN/OTHERWISE

REXX's multi-way branch (equivalent to `switch/case` in C-family languages):

```rexx
select
  when color = "red" then say "Stop"
  when color = "yellow" then say "Caution"
  when color = "green" then say "Go"
  otherwise say "Unknown color"
end
```

`OTHERWISE` is optional but recommended — if no `WHEN` matches and there is no `OTHERWISE`, REXX raises a `SYNTAX` error.

#### CALL/RETURN

```rexx
call myFunction arg1, arg2
say result                /* The special variable RESULT holds the return value */

/* ... */

myFunction:
  parse arg a, b
  return a + b
```

Functions can also be invoked as expressions:

```rexx
answer = myFunction(arg1, arg2)
```

The difference: `CALL` stores the return value in the special variable `RESULT`. Expression invocation uses the return value directly.

#### SIGNAL

`SIGNAL` is REXX's goto — and its error-handling mechanism:

```rexx
signal myLabel             /* Transfer control to myLabel */

/* Error handling form: */
signal on syntax name errorHandler
/* If a SYNTAX error occurs, control transfers to errorHandler */
```

`SIGNAL` differs from `CALL` in a critical way: `SIGNAL` **destroys all active DO loops and SELECT blocks**. It is a non-local transfer that resets the control-flow stack. This makes it suitable for error recovery (where you want to abort nested processing) but unsuitable for normal flow control.

### 11. String Operations: The Built-In Function Library

REXX's string processing is exceptionally rich. Here is a comprehensive reference of the standard built-in functions, organized by category:

#### String Query Functions

| Function | Description | Example |
|----------|-------------|---------|
| `LENGTH(string)` | Number of characters | `LENGTH("Hello")` -> `5` |
| `WORDS(string)` | Number of blank-delimited words | `WORDS("a b c")` -> `3` |
| `WORD(string, n)` | The nth word | `WORD("a b c", 2)` -> `b` |
| `WORDINDEX(string, n)` | Position of nth word | `WORDINDEX("a b c", 2)` -> `3` |
| `WORDLENGTH(string, n)` | Length of nth word | `WORDLENGTH("a bb c", 2)` -> `2` |
| `WORDPOS(phrase, string)` | Position of phrase in string (word-based) | `WORDPOS("b c", "a b c")` -> `2` |
| `POS(needle, haystack [,start])` | Position of needle in haystack | `POS("ll", "Hello")` -> `3` |
| `LASTPOS(needle, haystack [,start])` | Last position of needle | `LASTPOS("l", "Hello")` -> `4` |
| `DATATYPE(string [,type])` | Check/query data type | `DATATYPE("42", "N")` -> `1` |
| `VERIFY(string, reference [,option [,start]])` | Verify characters against reference | `VERIFY("123", "0123456789")` -> `0` |
| `ABBREV(information, info [,length])` | Check if info abbreviates information | `ABBREV("PRINT", "PR", 2)` -> `1` |
| `COMPARE(string1, string2 [,pad])` | Position of first difference | `COMPARE("abc", "abd")` -> `3` |

#### String Manipulation Functions

| Function | Description | Example |
|----------|-------------|---------|
| `SUBSTR(string, n [,length [,pad]])` | Extract substring | `SUBSTR("Hello", 2, 3)` -> `ell` |
| `LEFT(string, length [,pad])` | Left-justify/truncate | `LEFT("Hello", 8)` -> `Hello   ` |
| `RIGHT(string, length [,pad])` | Right-justify/truncate | `RIGHT("42", 5, "0")` -> `00042` |
| `CENTER(string, length [,pad])` | Center in field | `CENTER("Hi", 8)` -> `   Hi   ` |
| `COPIES(string, n)` | Repeat string n times | `COPIES("ab", 3)` -> `ababab` |
| `REVERSE(string)` | Reverse characters | `REVERSE("Hello")` -> `olleH` |
| `STRIP(string [,option [,char]])` | Strip leading/trailing characters | `STRIP("  Hi  ")` -> `Hi` |
| `SPACE(string [,n [,pad]])` | Normalize inter-word spacing | `SPACE("a  b  c", 1)` -> `a b c` |
| `OVERLAY(new, target, n [,length [,pad]])` | Overlay string onto target | `OVERLAY("XX", "abcde", 2)` -> `aXXde` |
| `INSERT(new, target [,n [,length [,pad]]])` | Insert string into target | `INSERT("XX", "abcde", 2)` -> `abXXcde` |
| `DELSTR(string, n [,length])` | Delete substring | `DELSTR("abcde", 2, 3)` -> `ae` |
| `DELWORD(string, n [,length])` | Delete words | `DELWORD("a b c d", 2, 2)` -> `a d` |
| `SUBWORD(string, n [,length])` | Extract words | `SUBWORD("a b c d", 2, 2)` -> `b c` |
| `TRANSLATE(string [,tableo [,tablei [,pad]]])` | Character translation | `TRANSLATE("hello", "ABCDEFGHIJKLMNOPQRSTUVWXYZ", "abcdefghijklmnopqrstuvwxyz")` -> `HELLO` |
| `CHANGESTR(needle, haystack, new)` | Replace all occurrences (not in ANSI, common extension) | `CHANGESTR("l", "Hello", "L")` -> `HeLLo` |

#### Conversion Functions

| Function | Description | Example |
|----------|-------------|---------|
| `C2X(string)` | Character to hexadecimal | `C2X("A")` -> `41` |
| `C2D(string [,n])` | Character to decimal | `C2D("A")` -> `65` |
| `X2C(hex)` | Hexadecimal to character | `X2C("41")` -> `A` |
| `X2D(hex [,n])` | Hexadecimal to decimal | `X2D("1F")` -> `31` |
| `D2C(number [,n])` | Decimal to character | `D2C(65)` -> `A` |
| `D2X(number [,n])` | Decimal to hexadecimal | `D2X(255)` -> `FF` |
| `X2B(hex)` | Hexadecimal to binary string | `X2B("1F")` -> `00011111` |
| `B2X(binary)` | Binary string to hexadecimal | `B2X("00011111")` -> `1F` |

#### Arithmetic Functions

| Function | Description | Example |
|----------|-------------|---------|
| `ABS(number)` | Absolute value | `ABS(-42)` -> `42` |
| `SIGN(number)` | Sign (-1, 0, or 1) | `SIGN(-42)` -> `-1` |
| `MAX(number, number [,...])` | Maximum value | `MAX(3, 1, 4, 1, 5)` -> `5` |
| `MIN(number, number [,...])` | Minimum value | `MIN(3, 1, 4, 1, 5)` -> `1` |
| `TRUNC(number [,n])` | Truncate to n decimal places | `TRUNC(3.14159, 2)` -> `3.14` |
| `FORMAT(number [,before [,after [,expp [,expt]]]])` | Format number | `FORMAT(12.3, 5, 2)` -> `   12.30` |
| `RANDOM([min] [,max] [,seed])` | Random integer | `RANDOM(1, 6)` -> (1-6) |

#### Miscellaneous Functions

| Function | Description |
|----------|-------------|
| `DATE([option [,date [,format]]])` | Date in various formats |
| `TIME([option])` | Time in various formats |
| `SYMBOL(name)` | Check if name is a valid symbol (`VAR`, `LIT`, or `BAD`) |
| `VALUE(name [,newvalue [,selector]])` | Get/set variable value by name (indirect access) |
| `SOURCELINE([n])` | Return source line n (or count of lines) |
| `ERRORTEXT(n)` | Error message for error number n |
| `CONDITION([option])` | Information about the current trapped condition |
| `ADDRESS()` | Current host command environment |
| `ARG([n [,option]])` | Argument information |
| `QUEUED()` | Number of lines in the external data queue |
| `XRANGE([start [,end]])` | Generate a range of characters |
| `BITAND(string1, string2 [,pad])` | Bitwise AND |
| `BITOR(string1, string2 [,pad])` | Bitwise OR |
| `BITXOR(string1, string2 [,pad])` | Bitwise XOR |

### 12. The I/O Model

REXX's I/O model is stream-based, using these six functions:

```rexx
/* Line-oriented I/O */
line = LINEIN(filename)              /* Read one line */
call LINEOUT filename, "data"        /* Write one line */
n = LINES(filename)                  /* Number of lines remaining */

/* Character-oriented I/O */
char = CHARIN(filename, start, count)   /* Read characters */
call CHAROUT filename, "data", start    /* Write characters */
n = CHARS(filename)                     /* Number of characters remaining */

/* Stream control */
state = STREAM(filename, "C", "OPEN READ")     /* Open for reading */
state = STREAM(filename, "C", "CLOSE")          /* Close */
state = STREAM(filename, "S")                    /* Query state: READY, NOTREADY, ERROR */
```

**The External Data Queue:** REXX has a unique I/O mechanism — the data queue (sometimes called the stack). It's a FIFO/LIFO buffer that serves as an inter-program communication channel:

```rexx
push "Last In, First Out"    /* Add to top of queue (LIFO) */
queue "First In, First Out"  /* Add to bottom of queue (FIFO) */
pull line                    /* Read from top of queue */
say queued()                 /* Number of lines in queue */
```

On VM/CMS, the program stack was a fundamental OS facility — it was how CMS commands communicated. REXX inherited this and made it a first-class I/O channel. When `PULL` (or `PARSE PULL`) is executed and the queue is empty, REXX reads from the standard input (console) instead. This dual behavior makes the queue transparent: a program that reads with `PULL` works both interactively (reading from the user) and in a pipeline (reading from the queue).

### 13. The INTERPRET Instruction: Dynamic Code Execution

`INTERPRET` is REXX's most powerful — and most dangerous — instruction. It takes a string expression, evaluates it to produce a string, and then executes that string as REXX code:

```rexx
code = "say 'Hello, World!'"
interpret code              /* Outputs: Hello, World! */
```

```rexx
/* Dynamic variable access */
varname = "count"
interpret varname "= 42"    /* Equivalent to: count = 42 */
```

```rexx
/* Build and execute a function call */
fname = "myFunction"
args = "1, 2, 3"
interpret "result =" fname || "(" || args || ")"
```

```rexx
/* Dynamic DO loop construction */
loops = "do i = 1 to 10; say i; end"
interpret loops
```

`INTERPRET` has full access to the current variable pool — it can read and modify any variable in scope. It can execute any REXX instruction except `PROCEDURE` (which is meaningful only at function entry). The interpreted code runs in the same environment as the surrounding program.

**Security implications:** `INTERPRET` is essentially `eval()`. If the string being interpreted contains user input, it creates a code injection vulnerability. ARexx programs that use `INTERPRET` with data received from other applications via ports are particularly vulnerable — a malicious application could send crafted strings that execute arbitrary code when interpreted.

**Performance implications:** `INTERPRET` forces the interpreter to parse and execute code at runtime. In a tight loop, this is much slower than static code. However, a common pattern in REXX programs is to use `INTERPRET` once to construct and assign a value, then use the assigned value in a loop — effectively caching the result of dynamic code generation.

**Why this matters for porting:** Any ARexx port must implement `INTERPRET` faithfully. This means the porting target must include a REXX parser and evaluator that can be invoked at runtime on arbitrary strings. This rules out pure ahead-of-time compilation — the runtime must carry the full interpreter. The `INTERPRET` instruction is used heavily in real-world ARexx scripts, often for constructing variable names dynamically, building command strings, and implementing simple template systems.

### 14. Error Handling: The Condition System

REXX's error handling uses the `SIGNAL` instruction to set up condition traps:

```rexx
signal on syntax name handleSyntax
signal on novalue name handleNovalue
signal on error name handleError
signal on failure name handleFailure
signal on halt name handleHalt
signal on notready name handleNotready

/* ... program code ... */

handleSyntax:
  say "Syntax error" rc "at line" sigl ":" errortext(rc)
  exit 1

handleNovalue:
  say "Uninitialized variable used at line" sigl
  say "Condition:" condition("D")
  exit 2
```

**The six standard conditions:**

| Condition | Triggered when... |
|-----------|-------------------|
| `SYNTAX` | A language syntax error occurs at runtime (bad arithmetic, invalid function call, etc.) |
| `NOVALUE` | An uninitialized variable is used (only if `SIGNAL ON NOVALUE` is active) |
| `ERROR` | A host command returns a non-zero return code (only if `SIGNAL ON ERROR` is active) |
| `FAILURE` | A host command fails to execute (command not found, etc.) |
| `HALT` | An external interrupt is received (user pressed Ctrl+C, etc.) |
| `NOTREADY` | An I/O operation raises a "not ready" condition |

**Special variables in condition handlers:**

- `RC` — the return code from the failing command or the error number
- `SIGL` — the line number where the condition was raised
- `CONDITION("C")` — the condition name ("SYNTAX", "NOVALUE", etc.)
- `CONDITION("D")` — the description (for `NOVALUE`, the variable name; for `SYNTAX`, the error message)
- `CONDITION("I")` — the instruction that caused the condition
- `CONDITION("S")` — the state ("ON" or "OFF")
- `ERRORTEXT(n)` — the standard error message for error number `n`

**Important:** `SIGNAL ON` traps are **one-shot** by default. After a condition is trapped, the trap is turned off. The handler must re-establish the trap if it wants to catch subsequent conditions. Also, as noted earlier, `SIGNAL` destroys all active `DO` loops and `SELECT` blocks — you cannot `SIGNAL` into the middle of a loop and have it continue.

### 15. Tracing: Built-In Debugging

REXX's `TRACE` instruction provides execution-level debugging that is unique among scripting languages:

```rexx
trace results              /* Show results of expressions */
trace intermediates        /* Show intermediate expression evaluations */
trace all                  /* Show all clauses before execution */
trace commands             /* Show host commands before execution */
trace errors               /* Show only commands that raise ERROR or FAILURE */
trace labels               /* Show label names when reached */
trace normal               /* Default — show failing commands only */
trace off                  /* Disable tracing */
```

When tracing is active, REXX outputs detailed information about program execution. For example, with `TRACE R` (results):

```
     3 *-* x = 3 + 4
       >L>   "3"
       >L>   "4"
       >O>   "7"
       >>>   "7"
     4 *-* say "Result:" x
       >V>   "7"
       >L>   "Result:"
       >O>   "Result: 7"
Result: 7
```

The prefixes indicate:
- `*-*` — the source line being executed
- `>L>` — a literal value
- `>V>` — a variable value
- `>O>` — the result of an operation
- `>>>` — the final result of the clause
- `>F>` — a function return value
- `>C>` — a compound variable tail
- `>.>` — the result of a dot (placeholder) assignment

The `?` prefix makes tracing interactive: `TRACE ?R` pauses after each clause and accepts input. The user can enter REXX expressions to inspect variables, or press Enter to continue.

**Tracing from the command line:** Many REXX implementations accept a `/T` or `//T` prefix to enable tracing from the invocation:

```
rexx //T myscript.rexx
```

**Why tracing matters for porting:** The TRACE facility is not just a debugging convenience — it's part of the language specification. Some REXX programs dynamically set and unset TRACE to generate diagnostic output. An ARexx port should implement at least `TRACE OFF`, `TRACE RESULTS`, and `TRACE ALL` to support existing programs that use tracing.

---

## Part III: ARexx — The Amiga Implementation

### 16. William S. Hawes and the ARexx Story

**William S. Hawes** was an American software developer based in **Maynard, Massachusetts**. He operated under the company name **Wishful Thinking Development** (sometimes cited as just Wishful Thinking). Hawes was already a notable figure in the Amiga community before ARexx — he had written **WShell**, an advanced command shell for AmigaDOS that provided features like command-line editing, history, aliases, and I/O redirection that the standard Amiga shell lacked.

Hawes recognized that the Amiga's multitasking architecture and inter-process communication facilities (built on `exec.library` message ports) created a unique opportunity. On most personal computers of the late 1980s, applications were isolated — they ran one at a time (on MS-DOS) or communicated through limited facilities like the clipboard (on Mac and early Windows). But the Amiga's preemptive multitasking and message-passing IPC meant that applications *could* communicate richly — if only there were a standard language and protocol for doing so.

Hawes chose REXX as the base language because:

1. **It was an established standard** — IBM's REXX was well-documented, widely known, and respected.
2. **It was designed for scripting** — REXX was explicitly created to glue applications together.
3. **The language was suitable for non-programmers** — Amiga users were not all professional developers; many were artists, musicians, and hobbyists who needed accessible scripting.
4. **It was powerful enough for real work** — arbitrary-precision arithmetic, sophisticated string handling, and proper control structures.

Hawes implemented ARexx as a **system-level service** — not just another application, but a component of the operating system that any program could interact with. He designed the **ARexx port protocol**, which allowed any Amiga application to register a named message port and accept commands from ARexx scripts.

ARexx was initially released as a **commercial product** in **1987**, priced at approximately $49.95. It came with the ARexx interpreter (`RexxMast` — the Rexx Master daemon), documentation, and the `rexxsupport.library` shared library. It quickly became one of the most popular Amiga utilities, with major applications adding ARexx support.

The critical turning point came when **Commodore International** licensed ARexx from Hawes and included it as a **standard component of AmigaOS 2.0**, released in **1990** with the Amiga 3000. This was unprecedented — no other personal computer operating system shipped with a standard scripting language that provided inter-application communication. (Apple would not ship AppleScript until 1993; Microsoft's OLE Automation was similarly later.)

From AmigaOS 2.0 onward, every Amiga had ARexx installed by default. The ARexx components resided in:
- `SYS:System/RexxMast` — the ARexx master daemon (resident process)
- `REXX:` — the logical device assignment for ARexx scripts (usually mapped to `S:` or a dedicated directory)
- `LIBS:rexxsyslib.library` — the core ARexx system library
- `LIBS:rexxsupport.library` — additional support functions
- `LIBS:rexxmathlib.library` — mathematical functions (SIN, COS, TAN, LOG, etc.)

### 17. The ARexx Port System: Architecture of Inter-Application Communication

The ARexx port system is the single most important architectural innovation in ARexx, and it is the feature that makes ARexx fundamentally different from standard REXX.

#### exec.library Message Ports

To understand ARexx ports, you must understand the Amiga's **exec.library** message-passing system.

AmigaOS's microkernel (`exec.library`) provided a message-passing IPC mechanism at the lowest level of the operating system. The key data structures:

```c
struct MsgPort {
    struct Node mp_Node;          /* Linkage in port list */
    UBYTE       mp_Flags;         /* Signal/soft-int/ignore */
    UBYTE       mp_SigBit;        /* Signal bit number */
    struct Task *mp_SigTask;      /* Task to signal */
    struct List  mp_MsgList;      /* List of pending messages */
};

struct Message {
    struct Node  mn_Node;         /* Linkage in message list */
    struct MsgPort *mn_ReplyPort; /* Port for reply */
    UWORD       mn_Length;        /* Message length */
};
```

Any task (thread) could create a `MsgPort`, optionally add it to the system's **public port list** (making it discoverable by name), and then wait for messages. Another task could find the port by name (using `FindPort()`), construct a `Message`, and send it (using `PutMsg()`). The receiving task would be signaled, retrieve the message (using `GetMsg()`), process it, and reply (using `ReplyMsg()`).

This mechanism was fast (no kernel transitions — just pointer manipulation and signal bits), reliable (messages were guaranteed to arrive in order), and universal (every part of AmigaOS used it, from device drivers to GUI widgets).

#### ARexx's Extension of the Message System

ARexx built on exec.library's message ports with a higher-level protocol. The key data structure was the **RexxMsg**:

```c
struct RexxMsg {
    struct Message rm_Node;        /* Standard Amiga message header */
    APTR    rm_TaskBlock;          /* Global structure (ARexx internal) */
    APTR    rm_LibBase;            /* Library base (ARexx internal) */
    LONG    rm_Action;             /* Command/function code + modifiers */
    LONG    rm_Result1;            /* Primary result (return code) */
    LONG    rm_Result2;            /* Secondary result (result string) */
    STRPTR  rm_Args[16];          /* Argument strings (up to 16) */
    APTR    rm_PassPort;           /* Forwarding port */
    STRPTR  rm_CommAddr;           /* Current host address */
    STRPTR  rm_FileExt;            /* File extension */
    LONG    rm_Stdin;              /* Input stream */
    LONG    rm_Stdout;             /* Output stream */
    LONG    rm_avail;              /* Future use */
};
```

The critical fields:

- **`rm_Action`** — A bitfield specifying the operation. The low 4 bits indicated the action type (RXCOMM for command, RXFUNC for function call, RXCLOSE for port closure, etc.). Higher bits indicated modifiers (RXFF_RESULT if the caller wants a result string, RXFF_STRING if the argument is a string, etc.).
- **`rm_Args[0]`** — For command messages, this held the command string. For function calls, it held the function name with subsequent args holding parameters.
- **`rm_Result1`** — The return code (0 for success, nonzero for error).
- **`rm_Result2`** — If `RXFF_RESULT` was set in the action, this held a pointer to the result string (an **Argstring** — ARexx's internal string representation with a length prefix and hash value).

#### How the Protocol Worked

1. **Application startup:** An ARexx-aware application creates a public message port with a known name (e.g., `IMAGEFX`, `DOPUS.1`, `GOLDED.1`). The port name is documented and consistent.

2. **Script addressing:** An ARexx script uses the `ADDRESS` instruction to direct commands to an application:

```rexx
/* Send commands to Directory Opus */
address 'DOPUS.1'
'lister new'
'lister set' handle 'path' 'SYS:'
'lister set' handle 'show' 'files'
```

3. **Command dispatch:** When the ARexx interpreter encounters a clause that is not a recognized REXX instruction, it treats it as a **host command** and sends it as a `RexxMsg` to the currently addressed port.

4. **Application processing:** The receiving application's message handler retrieves the `RexxMsg`, parses the command string, executes the requested operation, and replies with a result code (and optionally a result string).

5. **Result retrieval:** The ARexx script reads the result via the `RC` special variable (return code) and the `RESULT` variable (result string, if `OPTIONS RESULTS` was set):

```rexx
options results              /* Tell ARexx we want result strings */
address 'IMAGEFX'
'GetMain'                    /* Ask ImageFX for main window info */
say result                   /* The result string from ImageFX */
say rc                       /* The return code */
```

#### The ADDRESS Instruction in ARexx

The `ADDRESS` instruction in ARexx is more powerful than in standard REXX:

```rexx
/* Set the default host address */
address 'IMAGEFX'

/* Send a single command to a specific host, then revert */
address 'DOPUS.1' 'lister new'

/* Toggle between two hosts */
address 'IMAGEFX'            /* Switch to ImageFX */
address 'GOLDED.1'           /* Switch to GoldEd, previous = ImageFX */
address                      /* Toggle back to ImageFX */

/* Check the current host */
say address()                /* Returns current host address name */
```

#### The ARexx Master: RexxMast

The ARexx master daemon (`RexxMast`) was a background process that managed the ARexx environment. Its responsibilities:

- **Port management:** RexxMast maintained the `REXX` public port, which received script execution requests.
- **Script launching:** When a `RexxMsg` with `RXCOMM` action was sent to the `REXX` port, RexxMast launched a new ARexx interpreter task to execute the specified script.
- **Function library management:** RexxMast tracked which external function libraries were loaded and resolved function calls to the appropriate library.
- **Resource management:** RexxMast managed ARexx's internal memory pools (Argstrings, RexxMsg structures, etc.).

`RexxMast` had to be running for ARexx to function. It was typically started in the user's `S:User-Startup` file or was launched automatically by the Workbench on AmigaOS 2.0+.

### 18. Inter-Application Communication: ARexx as the Universal Glue

The ARexx port system enabled workflows that were genuinely revolutionary for personal computing in 1990. Here are concrete examples:

#### Example 1: Automated Image Processing Pipeline

```rexx
/* ARexx script: Batch process images with ImageFX and catalog with DOpus */
address 'DOPUS.1'
options results

/* Get list of files from Directory Opus lister */
'lister query' handle 'files'
filelist = result

address 'IMAGEFX'
do i = 1 to words(filelist)
  file = word(filelist, i)

  /* Load image in ImageFX */
  'LoadBuffer' '"Work:Images/' || file || '"' 'FORCE'

  /* Apply processing */
  'Brightness' 10
  'Contrast' 15
  'Scale' 640 480

  /* Save processed version */
  'SaveBufferAs' 'JPEG' '"Work:Processed/' || file || '"'
end

/* Return to DOpus, refresh the output directory */
address 'DOPUS.1'
'lister read' outhandle 'Work:Processed/'
```

#### Example 2: Document Assembly from Multiple Sources

```rexx
/* ARexx script: Build a report from spreadsheet data and text templates */
address 'TURBOTEXT'
options results

/* Open the template document */
'Open "Work:Templates/report.txt"'

/* Get data from a spreadsheet */
address 'TURBOCALC'
'GetCell A1'
title = result
'GetCell B1'
date = result
'GetRange A2:D10'
data = result

/* Back to the text editor — insert the data */
address 'TURBOTEXT'
'Find "{{TITLE}}"'
'Replace' title
'Find "{{DATE}}"'
'Replace' date
'Find "{{DATA}}"'
'Replace' data

/* Send the document to the printer */
'Print'
```

#### Example 3: Music Production Automation

```rexx
/* ARexx script: Coordinate ProTracker, AudioMaster, and OctaMED */
address 'OCTAMED'
options results

/* Get the current song's tempo and length */
'GetTempo'
tempo = result
'GetSongLength'
songlen = result

/* Set up corresponding audio processing */
address 'AUDIOMASTER'
'SetSampleRate' 44100
'SetLength' songlen * tempo * 60 / 125

/* Export from OctaMED, process in AudioMaster */
address 'OCTAMED'
'ExportIFF "T:temp.iff"'

address 'AUDIOMASTER'
'Load "T:temp.iff"'
'Echo' 25 150
'Normalize'
'Save "Work:Output/final.iff"'
```

These examples illustrate what made ARexx special: **any application could be both a client and a server**. A script could orchestrate multiple applications simultaneously, passing data between them, using each application's strengths. This was middleware in 1990, a decade before enterprise middleware became a buzzword.

**Historical significance:** ARexx's inter-application scripting predated and influenced:
- **Microsoft OLE/COM (1993)** — Object Linking and Embedding, later Component Object Model
- **AppleScript/Apple Events (1993)** — Apple's inter-application scripting
- **D-Bus (2002)** — Linux desktop IPC
- **Microsoft PowerShell (2006)** — Object-pipeline scripting
- **Apple Automator (2004)** — Visual inter-application automation

The fundamental insight — that a standard scripting language with a standard IPC protocol can turn independent applications into composable components — originated with ARexx on the Amiga.

### 19. ARexx Function Libraries

ARexx extended REXX's function mechanism with **external function libraries** — Amiga shared libraries (`.library` files) that exported functions callable from ARexx scripts.

#### The Function Library Interface

An ARexx function library was a standard Amiga shared library with a specific entry point structure. The library had to provide:

1. A **query function** that returned the list of functions the library provided.
2. An **entry point** for each function that accepted ARexx arguments (as Argstrings) and returned a result.

From ARexx, function libraries were loaded with `ADDLIB()`:

```rexx
/* Load the math library */
call addlib('rexxmathlib.library', 0, -30, 0)

/* Now math functions are available */
say sin(3.14159 / 4)        /* 0.707106... */
say cos(0)                   /* 1 */
say log(2.71828)             /* 0.999999... */
say sqrt(2)                  /* 1.41421... */
```

The `ADDLIB` function took four arguments:
1. Library name (the `.library` file)
2. Priority (for search order when multiple libraries provide the same function name)
3. Offset (the library function table offset, typically `-30` for the query function)
4. Version (minimum required version number)

Libraries could be removed with `REMLIB()`:

```rexx
call remlib('rexxmathlib.library')
```

#### Standard Libraries

**rexxsyslib.library** — The core ARexx library (loaded automatically). Provided system functions:
- `ADDLIB()`, `REMLIB()` — Library management
- `SHOW()` — Query ARexx resources (libraries, ports, clip list, files)
- `GETCLIP()`, `SETCLIP()` — ARexx clip list (named string storage, persistent across scripts)
- `OPEN()`, `CLOSE()`, `READLN()`, `WRITELN()`, `READCH()`, `WRITECH()`, `SEEK()`, `EOF()` — File I/O (Amiga-specific model)
- `EXISTS()` — Check file existence
- `STATEF()` — File status
- `PRAGMA()` — Set ARexx interpreter options (current directory, priority, stack size)
- `STORAGE()` — Query available memory
- `HASH()` — Compute hash value of a string
- `COMPRESS()`, `TRIM()` — String utilities

**rexxsupport.library** — Additional utility functions:
- `ALLOCMEM()`, `FREEMEM()` — Direct memory allocation (for hardware access)
- `DELAY()` — Wait for a specified number of ticks
- `FORBID()`, `PERMIT()` — Disable/enable multitasking (dangerous but sometimes necessary for hardware access)
- `GETARG()` — Get arguments from a RexxMsg
- `SHOWDIR()`, `MAKEDIR()` — Directory operations
- `OPENPORT()`, `CLOSEPORT()`, `WAITPKT()`, `GETPKT()`, `REPLY()` — Low-level ARexx port operations (for writing ARexx servers)

**rexxmathlib.library** — Transcendental mathematics:
- `SIN()`, `COS()`, `TAN()`, `ASIN()`, `ACOS()`, `ATAN()`, `ATAN2()`
- `SINH()`, `COSH()`, `TANH()`
- `EXP()`, `LOG()`, `LOG10()`, `LOG2()`
- `SQRT()`, `POW()`, `ABS()`
- `FLOOR()`, `CEIL()`, `INT()`

#### Application-Specific Libraries

Many Amiga applications shipped their own ARexx function libraries in addition to (or instead of) command ports. This allowed them to expose functions that returned values directly, rather than through the command/result message protocol:

```rexx
/* Load ImageFX's function library */
call addlib('imagefx.library', 0, -30, 0)

/* Now ImageFX functions are directly callable */
width = GetImageWidth()
height = GetImageHeight()
pixel = ReadPixel(x, y)
```

### 20. ARexx vs. Standard REXX: Key Differences

While ARexx is fundamentally REXX, Hawes made several adaptations for the Amiga environment:

#### Additions Specific to ARexx

1. **The port system** (`ADDRESS`, RexxMsg protocol, public port integration) — entirely absent from standard REXX.

2. **Function library mechanism** (`ADDLIB`, `REMLIB`, shared library loading) — standard REXX has external functions but does not define a library loading mechanism.

3. **The clip list** (`GETCLIP`, `SETCLIP`) — a global named-string store that persists across script invocations. This is ARexx's equivalent of environment variables, but more flexible (any string key, any string value, no size limits).

4. **Amiga-specific I/O** — ARexx's file I/O (`OPEN`, `CLOSE`, `READLN`, `WRITELN`, `READCH`, `WRITECH`, `SEEK`, `EOF`) differs from the ANSI standard's stream model (`LINEIN`, `LINEOUT`, `CHARIN`, `CHAROUT`, `LINES`, `CHARS`, `STREAM`). ARexx uses logical file names:

```rexx
/* ARexx I/O */
if open('myfile', 'Work:data.txt', 'R') then do
  do while ~eof('myfile')
    line = readln('myfile')
    say line
  end
  call close('myfile')
end
```

vs. standard REXX:

```rexx
/* Standard REXX I/O */
do while lines('Work:data.txt') > 0
  line = linein('Work:data.txt')
  say line
end
call lineout 'Work:data.txt'   /* Close */
```

5. **The `OPTIONS RESULTS` directive** — tells ARexx to request result strings from host commands. In standard REXX, this concept doesn't exist because there's no equivalent to the port system.

6. **`SHOW()` function** — queries ARexx-specific resources:

```rexx
say show('P')                   /* List all public ports */
say show('P', 'IMAGEFX')       /* Check if IMAGEFX port exists */
say show('L')                   /* List loaded function libraries */
say show('C')                   /* List clip list entries */
say show('F')                   /* List open files */
```

7. **`PRAGMA()` function** — controls ARexx interpreter behavior:

```rexx
call pragma('D', 'Work:MyProject')    /* Set current directory */
call pragma('S', 10000)                /* Set stack size */
call pragma('P', 0)                    /* Set task priority */
```

#### Differences from Standard REXX

1. **No ANSI stream I/O** — ARexx predates the ANSI standard (1996) and uses its own I/O model.

2. **Boolean values** — ARexx uses `1` for true and `0` for false (like standard REXX), but also accepts `TRUE` and `FALSE` as predefined symbols in some contexts.

3. **String comparison** — ARexx comparisons are case-insensitive by default for the `=` operator (matching standard REXX), but the strict comparison operators (`==`, `\==`, `>>`, `<<`) are case-sensitive.

4. **Numeric precision** — ARexx's default `NUMERIC DIGITS` is **9** (matching the REXX standard), but the maximum precision in Hawes' implementation was limited by memory. In practice, ARexx on a 68000-based Amiga with limited RAM had practical limits around 1000 digits.

5. **No `PARSE LINEIN`** — ARexx omits this source specifier (it was a late addition to some REXX implementations).

6. **The `~` operator** — ARexx uses `~` as the boolean NOT operator (in addition to `\` and `^`). The `~` character was more accessible on Amiga keyboards.

7. **Hexadecimal and binary strings** — ARexx supports literal hex strings (`'FF'x`) and binary strings (`'11111111'b`) in expressions, matching the REXX standard.

### 21. The ARexx Ecosystem: Applications and Integration

The depth of ARexx integration in the Amiga ecosystem was extraordinary. Here is a representative (not exhaustive) catalog of major applications that supported ARexx ports:

#### Graphics and Image Processing
- **ImageFX** (Nova Design) — Professional image processing. Over 200 ARexx commands covering loading, saving, processing, effects, color management, and batch operations. ImageFX's ARexx support was considered the gold standard.
- **Art Department Professional (ADPro)** (ASDG) — Image conversion and processing. Full ARexx command set.
- **Personal Paint** (Cloanto) — Paint program with ARexx support.
- **Photogenics** (Almathera) — Image editor with layers, effects, and ARexx.
- **Real3D** (RealSoft) — 3D modeling and rendering with ARexx scripting.
- **Imagine** (Impulse) — 3D rendering and animation with ARexx.
- **LightWave 3D** (NewTek) — Professional 3D (initially Video Toaster-only, later standalone). ARexx for scene construction and rendering control.

#### Text and Document Processing
- **GoldED** (Dietmar Eilert) — Programmer's text editor. Full ARexx macro support with over 150 commands. GoldED's entire macro language was ARexx.
- **CygnusEd** (ASDG, later Geoff Seeley) — Text editor with ARexx.
- **TurboText** (Oxxi) — Text editor with ARexx macro support.
- **Final Writer** (SoftWood) — Word processor with ARexx.
- **Pagestream** (Soft-Logik) — Desktop publishing with ARexx.
- **ProWrite** (New Horizons) — Word processor with ARexx.

#### File Management and System Utilities
- **Directory Opus** (Jonathan Potter, GPSoftware) — File manager with one of the most comprehensive ARexx interfaces of any Amiga application. DOpus 5 (Magellan) had hundreds of ARexx commands.
- **SAS/C** (SAS Institute) — C compiler with ARexx-scriptable build system.
- **MUI** (Stefan Stuntz) — Magic User Interface, a GUI toolkit. MUI classes could be controlled via ARexx, enabling GUI scripting.
- **Installer** (Commodore) — The standard Amiga software installer used a LISP-like language but could invoke ARexx scripts.
- **ToolManager** (Stefan Becker) — Dock/launcher with ARexx integration.

#### Music and Audio
- **ProTracker** (Lars Hamre, et al.) — The iconic Amiga tracker. ARexx support for note entry, sample manipulation, and playback control.
- **OctaMED** (Teijo Kinnunen) — Extended tracker with MIDI support and ARexx.
- **Bars & Pipes Professional** (Blue Ribbon Soundworks) — MIDI sequencer with extensive ARexx.
- **Audio Master** (Aegis/Oxxi) — Audio editor with ARexx.

#### Networking and Communications
- **Miami** (Holger Kruse) — TCP/IP stack with ARexx (dial-up control, connection monitoring).
- **AWeb** (Yvon Rozijn) — Web browser with ARexx (page loading, bookmark management, content extraction).
- **IBrowse** (Stefan Burstroem, Omnipresence International) — Web browser with ARexx.
- **YAM** (Marcel Beck) — Email client with ARexx (mail filtering, auto-reply, folder management).
- **Thor** — Offline mail/news reader with ARexx.
- **AmFTP** — FTP client with ARexx (automated file transfers).
- **AmiTCP** (Village Tronic) — TCP/IP stack with ARexx.

#### Databases and Business
- **Final Calc** (SoftWood) — Spreadsheet with ARexx.
- **TurboCalc** (Michael Friedrich) — Spreadsheet with ARexx.
- **Superbase** (Oxxi) — Database with ARexx scripting.

#### Development and Programming
- **SAS/C (Lattice C)** — Compiler with ARexx-scriptable IDE.
- **StormC** (Haage & Partner) — C/C++ IDE with ARexx.
- **HiSoft DevPac** — Assembler/debugger with ARexx.
- **ARexx itself** — ARexx scripts could control other ARexx scripts via the port system, enabling meta-scripting and script orchestration.

The key point is not merely that these applications had ARexx support — it's that they all shared a **common protocol**. An ARexx script could seamlessly combine operations across any of these applications. The user did not need to learn separate scripting languages for each application; they learned REXX once and could automate everything.

This level of system-wide scriptability was not matched by any other personal computer platform until macOS's AppleScript/Automator ecosystem matured in the mid-2000s, and even then, AppleScript's penetration across third-party applications never matched ARexx's depth in the Amiga world.

---

## Part IV: REXX Implementations — The Family Tree

### 22. Regina REXX

**Regina REXX** was created by **Anders Christensen** in 1992 as a portable, open-source REXX interpreter. It was later maintained and significantly expanded by **Mark Hessling** (an Australian developer) starting in the mid-1990s. Hessling remains the primary maintainer.

**Key characteristics:**
- **Most ANSI-compliant** open-source REXX interpreter — closely tracks the X3.274-1996 standard.
- **Highly portable** — runs on Linux, Windows, macOS, BSD, OS/2, and many other platforms.
- **Written in C** — clean, portable C codebase.
- **External function interface** — supports loading external function libraries as shared objects (`.so` on Unix, `.dll` on Windows).
- **SAA API compatible** — implements the IBM Systems Application Architecture REXX interface, allowing C programs to embed the Regina interpreter and call REXX programs from C.
- **Stack support** — implements the external data queue as both a process-local queue and a network-accessible queue (via the `rxstack` daemon).
- **Current version:** 3.9.6 (as of 2024). Active development continues.
- **License:** GNU LGPL (Lesser General Public License), allowing commercial use and embedding.

**Why Regina matters for porting:** Regina is the reference implementation for portable REXX. Its source code (approximately 70,000 lines of C) is the most accessible and well-documented implementation of the REXX parsing, arithmetic, and execution model. For any porting project, studying Regina's source is invaluable — particularly its implementation of PARSE templates, arbitrary-precision arithmetic, and the INTERPRET instruction.

Regina's source can be found at: `https://regina-rexx.sourceforge.io/`

### 23. Open Object Rexx (ooRexx)

**Open Object Rexx** (ooRexx) is the open-source continuation of IBM's **Object REXX**, which IBM originally developed for OS/2 Warp in 1994-1997. IBM donated the Object REXX source code to the **Rexx Language Association (RexxLA)** in 2004, and it was released under the **Common Public License**.

**History:**
- **1994:** IBM releases Object REXX for OS/2, adding object-oriented extensions to classic REXX.
- **1997:** IBM ports Object REXX to Windows NT/2000 and AIX.
- **2004:** IBM donates the source code to RexxLA.
- **2005:** First open-source release as ooRexx 3.0.
- **Current version:** ooRexx 5.1.0 (as of 2024).

**Object-oriented extensions:**
```rexx
/* ooRexx class definition */
::class Person
::method init
  expose name age
  use arg name, age

::method name
  expose name
  return name

::method age
  expose age
  return age

::method say
  expose name age
  say name "is" age "years old."

/* Usage */
p = .Person~new("Alice", 30)
p~say                           /* Alice is 30 years old. */
```

ooRexx adds:
- **Classes and objects** with inheritance, polymorphism, and encapsulation.
- **The `~` operator** (twiddle) for method invocation: `object~method(args)`.
- **Directives** (lines starting with `::`) for class definitions, method definitions, and routine declarations.
- **Collection classes** — Array, List, Queue, Table, Relation, Set, Bag, Directory, etc.
- **Stream classes** — Object-oriented wrappers around REXX's stream I/O.
- **Full backward compatibility** — every valid classic REXX program is a valid ooRexx program.

**Key maintainers:** Rick McGuire (IBM, then RexxLA), Mark Hessling, Rony Flatscher, and others in the RexxLA community.

**Why ooRexx matters for porting:** ooRexx's class system is relevant if the porting project aims to provide modern REXX extensions beyond the classic language. The collection classes (Array, Table, etc.) address the limitations of stems. However, ARexx programs do not use ooRexx extensions, so for a pure ARexx port, ooRexx's additions are reference material rather than requirements.

### 24. NetRexx

**NetRexx** is Mike Cowlishaw's own REXX variant for the **Java Virtual Machine (JVM)**. It was announced by IBM in **1996** (the same year as the ANSI standard) and represented Cowlishaw's vision of REXX's principles applied to a modern runtime.

**Key characteristics:**
- **Compiles to Java bytecode** — NetRexx programs become Java classes.
- **Full Java interoperability** — NetRexx can instantiate Java objects, call Java methods, and extend Java classes.
- **REXX-inspired syntax** — retains REXX's readability but adapts to the JVM's object model.
- **Modernized type system** — NetRexx has optional type declarations (but defaults to untyped, REXX-style).

```netrexx
/* NetRexx example */
loop i = 1 to 10
  say i
end

-- String methods (Java integration)
s = "Hello, World!"
say s.substring(0, 5)        -- Hello
say s.length()               -- 13

-- Java class usage
import java.util.ArrayList
list = ArrayList()
list.add("Alice")
list.add("Bob")
loop item over list
  say item
end
```

NetRexx is notable as the **first non-Java language compiled to JVM bytecode** (predating Jython, JRuby, Scala, Kotlin, Clojure, and Groovy). Cowlishaw saw the JVM as the right platform for REXX's future — write once, run anywhere, with access to Java's massive library ecosystem.

**Current status:** NetRexx 4.06 (as of 2024), maintained by the **NetRexx developer community** under RexxLA. Available at `https://netrexx.org/`. The lead maintainer is **Kermit Kiser** with contributions from **Marc Remes** and others.

### 25. Rexx/imc

**Rexx/imc** was written by **Ian Michael Collier** at the **University of Oxford** as an academic REXX implementation for Unix systems. It was one of the earliest Unix REXX interpreters (first released in **1992**).

**Characteristics:**
- Written in C for Unix systems.
- Focused on ANSI compliance and correctness.
- Used as a teaching tool and reference implementation.
- Includes support for the `STREAM()` function, external data queue, and other standard features.
- No longer actively maintained (Collier passed away in **2011**), but the source code remains available as a historical and educational resource.

Rexx/imc's primary significance is as a clean, well-documented academic implementation that influenced later REXX interpreters.

### 26. BRexx (Brexx)

**BRexx** was created by **Vasilis Nikolaou Vlachoudis** at **CERN** (the European Organization for Nuclear Research). It is a minimal REXX interpreter designed for **embedded systems** and environments with severe resource constraints.

**Key characteristics:**
- **Extremely small footprint** — the core interpreter is under 200KB.
- **Written in C** — highly portable, minimal dependencies.
- **Designed for embedded use** — can run on microcontrollers and resource-constrained systems.
- **Subset of REXX** — implements the core language but may omit some less-used features.
- **Fast startup** — minimal initialization overhead.
- **Database integration** — includes interfaces to MySQL, PostgreSQL, and SQLite.
- **Current version:** BRexx 2.1.x.

**Why BRexx matters for this project:** BRexx's small footprint makes it a reference for how to implement REXX in constrained environments. If the porting target includes GPU execution (as mentioned in the project context for the math co-processor), BRexx's minimal implementation shows what can be stripped away while retaining REXX's essential character. Its C source is also relatively easy to read and port.

### 27. OS/2 REXX: The Closest Parallel to ARexx

IBM's **OS/2 REXX** (more formally, "Procedures Language 2/REXX" or "SAA Procedures Language REXX") represents the closest parallel to ARexx's system integration, but on a different platform.

**OS/2 REXX** shipped as a standard component of **OS/2 2.0** (1992) and all subsequent versions. Like ARexx on the Amiga, it was deeply integrated with the operating system:

- **Workplace Shell scripting:** The OS/2 Workplace Shell (WPS) — the graphical desktop — was fully scriptable via REXX. You could write REXX programs that created, modified, and deleted desktop objects, folders, program references, and settings. This was comparable to ARexx's ability to script the Workbench.

```rexx
/* OS/2 REXX: Create a desktop folder */
call RxFuncAdd 'SysLoadFuncs', 'RexxUtil', 'SysLoadFuncs'
call SysLoadFuncs

rc = SysCreateObject('WPFolder', 'My Folder', '<WP_DESKTOP>',
     'OBJECTID=<MY_FOLDER>', 'UPDATE')
```

- **RexxUtil functions:** OS/2 shipped with `RexxUtil.DLL`, providing system functions: `SysFileTree` (file search), `SysDriveInfo` (disk information), `SysCreateObject`/`SysDestroyObject` (WPS objects), `SysCls` (clear screen), `SysSleep` (delay), `SysTempFileName`, `SysGetMessage`, and many more.

- **REXX Socket API:** TCP/IP REXX programming was supported through `RxSock`, enabling network programming directly in REXX.

- **Database access:** `SQLREXX` and later ODBC interfaces allowed REXX scripts to query databases.

- **PM (Presentation Manager) integration:** Through `VX-REXX` (Watcom's visual REXX tool) and native PM APIs, REXX could create graphical user interfaces on OS/2.

The parallel to ARexx is clear: both platforms chose to make REXX a first-class citizen of the operating system, enabling scripting at every level from application automation to system administration. The difference is that ARexx emphasized inter-application communication via the port system, while OS/2 REXX emphasized system administration and Workplace Shell integration.

OS/2 REXX's legacy continues in **ArcaOS** (the modern continuation of OS/2 by Arca Noae) and in the open-source **osFree** project.

---

## Part V: Relevance to the Porting Project

### 28. The Amiga Connection: exec.library Message Passing and Modern IPC

ARexx's port system is a direct expression of the Amiga's `exec.library` message-passing architecture. For porting purposes, the key mapping is:

| ARexx / Amiga Concept | Modern Equivalent | Notes |
|----------------------|-------------------|-------|
| `exec.library` MsgPort | Unix domain socket / named pipe / D-Bus | Named communication endpoint |
| `RexxMsg` | Protocol buffer / JSON-RPC message | Structured message with args and results |
| `ADDRESS 'APP'` | D-Bus destination / COM ProgID | Routing to a specific application |
| `SHOW('P')` | Service discovery (mDNS, D-Bus ListNames) | Enumerate available endpoints |
| Clip list (`GETCLIP`/`SETCLIP`) | Environment variables / Redis / shared memory | Named persistent string storage |
| Function libraries | Plugin system / shared libraries / FFI | Dynamically loaded extensions |
| RexxMast daemon | D-Bus daemon / systemd service | Central message broker |

For the gsd-skill-creator context, ARexx's port system maps naturally to:

- **MCP (Model Context Protocol) tools** — each MCP server is analogous to an ARexx port. The `ADDRESS` instruction maps to MCP tool routing.
- **Agent communication** — ARexx scripts orchestrating multiple applications is structurally identical to our multi-agent orchestration (mayor-coordinator, fleet-mission).
- **exec.library's typed message pools** map to our Amiga-inspired RAM storage design (typed pools, custom allocator).

### 29. Arbitrary Precision Arithmetic and the Math Co-Processor

REXX's `NUMERIC DIGITS` instruction and its decimal arithmetic model are directly relevant to the math co-processor work:

```rexx
/* REXX can compute to any precision */
numeric digits 200
say 1/7
/* 0.14285714285714285714285714285714285714285714285714285714285714285714285714285714285714285714285714285714285714285714285714285714285714285714285714285714285714285714285714285714285714285714285714285714285714 */
```

**Porting requirements for arithmetic:**

1. **Decimal, not binary.** The arithmetic engine must use base-10 internally. IEEE 754 binary floating point (`f64`) is insufficient because it cannot exactly represent many decimal fractions (`0.1`, `0.01`, etc.).

2. **Arbitrary precision.** The implementation must support `NUMERIC DIGITS` values in the thousands. This requires a bignum library or custom implementation.

3. **Runtime-adjustable precision.** `NUMERIC DIGITS` can be changed at any point in a program, even dynamically:

```rexx
do digits = 10 to 100 by 10
  numeric digits digits
  say digits "digits:" 1/3
end
```

4. **Correct rounding.** REXX specifies that results are rounded to `NUMERIC DIGITS` significant digits using **round-half-up** (the same rounding mode specified in IEEE 754-2008 for decimal arithmetic, which Cowlishaw co-authored).

5. **Division must work.** REXX division always produces a result (it never raises an error for non-zero dividends). `1/3` with `NUMERIC DIGITS 9` produces `0.333333333`. With `NUMERIC DIGITS 50`, it produces 50 digits. Division by zero raises the `SYNTAX` condition.

6. **Power operator.** `x ** n` where `n` is a non-negative integer is exact (subject to `NUMERIC DIGITS`). For negative or non-integer exponents, the result is an approximation. The algorithm must be efficient for large exponents (binary exponentiation).

For Rust implementation, consider:
- `rust_decimal` crate — decimal arithmetic with configurable precision (but currently limited to 28-29 significant digits)
- `bigdecimal` crate — arbitrary-precision decimal arithmetic
- `rug` crate — bindings to GNU MPFR for high-performance arbitrary precision
- Custom implementation based on Cowlishaw's "General Decimal Arithmetic" specification (`speleotrove.com/decimal/`)

### 30. The PARSE Model: Template Matching Without Regex

REXX's PARSE instruction is a declarative string decomposition system that predates the widespread adoption of regular expressions. Its template language is less powerful than full regex (no Kleene star, no alternation, no character classes) but is **far more readable** and covers the vast majority of real-world parsing tasks.

**Comparison with modern approaches:**

```rexx
/* PARSE: Extract fields from a date string */
parse var datestr year "-" month "-" day
```

```javascript
// JavaScript regex equivalent
const [, year, month, day] = datestr.match(/(\d+)-(\d+)-(\d+)/);
```

```rust
// Rust: Using split
let parts: Vec<&str> = datestr.split('-').collect();
let (year, month, day) = (parts[0], parts[1], parts[2]);
```

The PARSE version is the most readable. It declares the structure (three fields separated by hyphens) without specifying implementation details (character classes, capture groups, iterators).

**For the porting project:** Implementing PARSE requires a template compiler that translates PARSE templates into an internal representation (a sequence of operations: extract-to-variable, search-for-literal, move-to-position, etc.) and a template executor that applies the compiled template to a source string. This is a well-defined problem — the ANSI standard specifies PARSE semantics precisely.

The template compiler is also relatively small — perhaps 500-1000 lines of Rust or TypeScript. The key data structures are:

1. **PatternType** — enum: Word, Literal(String), AbsolutePosition(i32), RelativePosition(i32), VariablePosition(String)
2. **TemplateElement** — struct: variable_name (Option<String>), pattern (PatternType)
3. **CompiledTemplate** — Vec<TemplateElement>

The executor walks the compiled template, maintaining a cursor position and assigning substrings to variables according to the template's pattern sequence.

### 31. INTERPRET and Dynamic Code Execution

REXX's `INTERPRET` instruction maps to a concept central to the skill-creator architecture: **adaptive, runtime-generated behavior**.

In ARexx scripts, `INTERPRET` was commonly used for:

1. **Dynamic variable construction:**
```rexx
/* Build variable names at runtime */
do i = 1 to 10
  interpret "value." || i "= func" || i || "()"
end
```

2. **User-defined formulas:**
```rexx
/* Let the user enter a formula */
say "Enter a formula using x:"
pull formula
do x = 0 to 10
  interpret "result =" formula
  say "f(" || x || ") =" result
end
```

3. **Configuration-driven behavior:**
```rexx
/* Execute commands from a config file */
do while lines('config.rexx') > 0
  line = linein('config.rexx')
  if line \= '' then interpret line
end
```

4. **Macro expansion:**
```rexx
/* Simple template engine */
template = "say 'Hello,' name || '! You are' age 'years old.'"
name = "Alice"
age = 30
interpret template
/* Outputs: Hello, Alice! You are 30 years old. */
```

**For the porting project:** Implementing `INTERPRET` means the runtime must carry a complete REXX parser and evaluator. This has implications for architecture:

- **No pure AOT compilation.** Even if you compile REXX to native code, the `INTERPRET` instruction requires an interpreter at runtime.
- **Shared variable scope.** The interpreted code shares the same variable pool as the surrounding program. This means the variable store must be accessible from both compiled code and the interpreter.
- **Security boundary.** `INTERPRET` executing untrusted strings is a security vulnerability. A modern port should consider sandboxing or restricting `INTERPRET` in security-sensitive contexts.
- **Recursive invocation.** `INTERPRET` can call `INTERPRET`. The implementation must handle arbitrary nesting depth.

The `INTERPRET` instruction also connects to the skill-creator's **adaptive learning** concept: just as `INTERPRET` lets a REXX program modify its own behavior at runtime based on computed strings, the skill-creator generates and loads skills dynamically based on observed patterns. The parallel is direct and architecturally meaningful.

---

## Appendix A: Timeline of Key Events

| Year | Event |
|------|-------|
| 1964 | PL/I specification published (major influence on Cowlishaw) |
| ~1970 | EXEC language for CMS |
| ~1979 | EXEC 2 for CMS |
| 1979 | Cowlishaw begins designing REX at IBM Hursley (March) |
| 1979 | First REX interpreter available internally at IBM |
| 1982 | REXX becomes official VM/CMS scripting language |
| 1983 | REXX ships with VM/SP Release 3 |
| 1984 | Amiga 1000 released by Commodore (July 1985 retail) |
| 1985 | Cowlishaw publishes "The REXX Language" (Prentice-Hall, 1st edition) |
| 1987 | William S. Hawes releases ARexx commercially for AmigaOS 1.x |
| 1988 | IBM REXX ships on OS/400 (AS/400) |
| 1989 | REXX available on TSO/E (MVS/ESA) — replaces CLIST for many tasks |
| 1990 | ARexx ships as standard component of AmigaOS 2.0 (Amiga 3000) |
| 1990 | Cowlishaw publishes "The REXX Language" (2nd edition) |
| 1991 | ANSI X3J18 committee begins work on REXX standardization |
| 1992 | OS/2 2.0 ships with REXX as standard scripting language |
| 1992 | Regina REXX first released by Anders Christensen |
| 1992 | Rexx/imc released by Ian Collier |
| 1993 | AppleScript ships with Mac System 7.1.1 (Apple's answer to ARexx, 3 years later) |
| 1994 | IBM releases Object REXX for OS/2 Warp |
| 1996 | ANSI X3.274-1996 REXX standard published (March 18) |
| 1996 | Cowlishaw announces NetRexx for the JVM |
| 1997 | Commodore International bankrupt; Amiga platform fragments |
| 2004 | IBM donates Object REXX source to RexxLA (becomes ooRexx) |
| 2005 | ooRexx 3.0 released (first open-source version) |
| 2008 | IEEE 754-2008 published (Cowlishaw's decimal arithmetic work) |
| 2011 | Ian Collier (Rexx/imc author) dies |
| 2024 | Regina REXX 3.9.6, ooRexx 5.1.0 — both actively maintained |
| 2024 | ISO/IEC 18009:2024 (REXX international standard) |

## Appendix B: ARexx Port Protocol Quick Reference

### Sending Commands to an Application

```rexx
/* Basic pattern */
address 'APPNAME'           /* Set host address */
options results             /* Request result strings */

'command arg1 arg2'         /* Send command to application */
if rc = 0 then              /* Check return code */
  say result                /* Use result string */
else
  say "Error:" rc
```

### Writing an ARexx Port Server (in ARexx)

```rexx
/* Minimal ARexx server */
call openport('MYSERVER')   /* Create a public port */

say "MYSERVER port is open. Waiting for commands..."

do forever
  call waitpkt('MYSERVER')  /* Wait for a message */
  packet = getpkt('MYSERVER')

  do while packet ~= '0000 0000'x
    cmd = getarg(packet, 0) /* Get the command string */
    parse var cmd verb rest

    select
      when verb = 'QUIT' then do
        call reply(packet, 0)
        call closeport('MYSERVER')
        exit 0
      end
      when verb = 'HELLO' then do
        call reply(packet, 0, 'Hello from MYSERVER!')
      end
      when verb = 'ADD' then do
        parse var rest a b
        call reply(packet, 0, a + b)
      end
      otherwise
        call reply(packet, 10, 'Unknown command:' verb)
    end

    packet = getpkt('MYSERVER')
  end
end
```

### Querying Available Ports

```rexx
/* List all public ports */
portlist = show('P')
do i = 1 to words(portlist)
  say word(portlist, i)
end

/* Check if a specific port exists */
if show('P', 'IMAGEFX') then
  say "ImageFX is running"
else
  say "ImageFX is not available"
```

## Appendix C: REXX Arithmetic Specification Summary

The following rules govern REXX arithmetic (from ANSI X3.274-1996 and Cowlishaw's "General Decimal Arithmetic"):

1. **Precision:** Controlled by `NUMERIC DIGITS d`. Default `d = 9`. All intermediate and final results are rounded to `d` significant digits.

2. **Addition/Subtraction:** Both operands are aligned (decimal points matched). The operation proceeds from right to left. The result is rounded to `d` digits.

3. **Multiplication:** The result is computed to `2 * d` digits, then rounded to `d` digits.

4. **Division:** The result is computed to `d + 1` digits, then rounded to `d` digits. Division by zero raises SYNTAX condition 42 ("Arithmetic overflow/underflow").

5. **Integer division (`%`):** The result is the integer part of the true quotient. The result is exact if it has no more than `d` digits; otherwise SYNTAX condition 42 is raised.

6. **Remainder (`//`):** Computed as `a - (a % b) * b`. The result has the same sign as the dividend.

7. **Power (`**`):** The exponent must be a whole number (no fractional exponents in standard REXX). For positive exponents, the result is computed by repeated squaring. For negative exponents, the result is `1 / (x ** abs(n))`. The result is rounded to `d` digits.

8. **Comparison:** Numeric comparison is performed after both operands are rounded to `NUMERIC DIGITS - NUMERIC FUZZ` digits. Default `FUZZ = 0` (exact comparison).

9. **Number format:** A valid REXX number matches: `[blanks] [sign] digits [.digits] [E [sign] digits] [blanks]`. The sign is `+` or `-`. The `E` introduces an exponent.

10. **Exponential notation:** Results are presented in exponential notation when the number of digits before the decimal point exceeds `NUMERIC DIGITS * 2`, or when the number of leading zeros after the decimal point exceeds `NUMERIC DIGITS`. The form (scientific or engineering) is controlled by `NUMERIC FORM`.

## Appendix D: Key People Reference

| Name | Role | Affiliation |
|------|------|-------------|
| **Michael F. Cowlishaw** | REXX creator, NetRexx creator, IEEE 754-2008 decimal arithmetic | IBM UK Labs, Hursley Park |
| **William S. Hawes** | ARexx creator, WShell creator | Wishful Thinking Development, Maynard, MA |
| **Anders Christensen** | Regina REXX original author | — |
| **Mark Hessling** | Regina REXX maintainer, THE editor (XEDIT clone) author | Brisbane, Australia |
| **Brian Marks** | ANSI X3J18 committee chair (REXX standard) | IBM |
| **John Hartmann** | CMS Pipelines designer (REXX integration) | IBM |
| **Rick McGuire** | ooRexx lead developer | IBM, then RexxLA |
| **Rony Flatscher** | ooRexx contributor, BSF4ooRexx (Java bridge) author | WU Wien |
| **Vasilis N. Vlachoudis** | BRexx creator | CERN |
| **Ian M. Collier** | Rexx/imc author (d. 2011) | University of Oxford |
| **Kermit Kiser** | NetRexx maintainer | RexxLA |
| **Jonathan Potter** | Directory Opus author (exemplary ARexx integration) | GPSoftware |
| **Stefan Stuntz** | MUI (Magic User Interface) author (ARexx-controllable GUI) | — |
| **Dietmar Eilert** | GoldED editor author (ARexx-native macro system) | — |

## Appendix E: Source Code and References

### Implementations (Source Available)

| Implementation | URL | Language | License |
|---------------|-----|----------|---------|
| Regina REXX | `https://regina-rexx.sourceforge.io/` | C | LGPL |
| ooRexx | `https://www.oorexx.org/` | C++ | CPL/EPL |
| NetRexx | `https://netrexx.org/` | Java | ICU License |
| BRexx | `https://bnv.github.io/brexx/` | C | GPL |

### Key Documents

| Document | Description |
|----------|-------------|
| ANSI X3.274-1996 | The formal REXX language standard |
| ISO/IEC 18009:2024 | International REXX standard |
| Cowlishaw, "The REXX Language" (2nd ed., 1990) | The definitive language reference |
| Cowlishaw, "General Decimal Arithmetic" | The arithmetic specification (`speleotrove.com/decimal/`) |
| Hawes, "ARexx User's Reference Manual" | The ARexx reference (shipped with AmigaOS 2.0+) |
| Callaway, "The ARexx Cookbook" (1992) | Practical ARexx programming guide |
| Zamara & Flynn, "Using ARexx on the Amiga" (1991) | Comprehensive ARexx book |
| Commodore, "AmigaOS 3.1 Autodocs" | System-level documentation for exec.library, rexxsyslib, etc. |

### RexxLA (REXX Language Association)

The **REXX Language Association (RexxLA)** is the community organization that stewards the REXX language ecosystem. Founded in the late 1990s, RexxLA:

- Maintains ooRexx and coordinates NetRexx development
- Hosts the annual **International REXX Symposium**
- Maintains the REXX standard and coordinates with ANSI/ISO
- Provides resources at `https://www.rexxla.org/`

---

## Appendix F: Architectural Implications for the Port

### Minimum Viable ARexx Implementation

Based on this research, a faithful ARexx port requires at minimum:

1. **REXX core interpreter** — parser, evaluator, variable pool
2. **All 23 instructions** — including INTERPRET (requires carrying the parser at runtime)
3. **All standard built-in functions** — the complete function library from the ANSI standard
4. **Arbitrary-precision decimal arithmetic** — with runtime-adjustable NUMERIC DIGITS
5. **Full PARSE template system** — all pattern types (word, literal, positional, variable)
6. **Port system equivalent** — IPC mechanism for inter-application communication
7. **Function library loading** — mechanism for extending ARexx with external functions
8. **ARexx-specific I/O** — OPEN/CLOSE/READLN/WRITELN/READCH/WRITECH/SEEK/EOF
9. **Clip list** — GETCLIP/SETCLIP named string storage
10. **External data queue** — PUSH/PULL/QUEUE/QUEUED
11. **Tracing** — at least TRACE OFF, RESULTS, ALL
12. **Error handling** — full SIGNAL ON/OFF condition system

### Architecture Decision: Interpreter vs. Compiler

Given the INTERPRET instruction requirement, a pure compiler approach is not viable. The recommended architecture is:

- **Bytecode compiler** — compile REXX source to an intermediate bytecode
- **Bytecode interpreter** — execute the bytecode (with INTERPRET invoking the compiler at runtime)
- **FFI layer** — for external function libraries (Rust's `libloading` or equivalent)
- **IPC layer** — for the port system (Unix domain sockets, D-Bus, or custom protocol)
- **Decimal arithmetic engine** — either a library binding or custom implementation

This architecture preserves REXX's dynamic nature while allowing optimization of frequently-executed code paths.

---

## Addendum: REXX implementations in 2025–2026

This addendum was added in April 2026 as part of a catalog-wide enrichment
pass. REXX is a niche language in 2026 — its heyday ran from Mike Cowlishaw's
original 1979 IBM implementation through the late-1990s peak when REXX
was shipping as a first-class scripting language on every IBM mainframe
platform, OS/2, and the Commodore Amiga. What the body above does not
cover is the current state of the REXX implementation ecosystem, which
is smaller than its peak but genuinely still alive.

### Open Object Rexx (ooRexx)

**Open Object Rexx (ooRexx)** is the RexxLA-managed open-source
successor to IBM's Object REXX. The project is hosted at `oorexx.org`,
with source on GitHub at `github.com/ooRexx` and releases on
SourceForge.

As of the 2025–2026 enrichment window the released state is:

- **ooRexx 5.0.0** — the current general-availability (GA) release.
- **ooRexx 5.1.0 beta** — available for testing, with incremental
  work on the compiler, the class library, and platform support.

ooRexx is written in C++ and targets Linux, Windows, macOS (Intel
and Apple Silicon), AIX, and several historical IBM platforms. It
provides the full Object REXX class library (the object-oriented
extensions that IBM added to classical REXX), can execute classical
REXX programs unmodified, and integrates with the native desktop
environments on each supported platform.

**Sources:** [Open Object Rexx — oorexx.org](https://www.oorexx.org/) · [Open Object Rexx — GitHub](https://github.com/ooRexx) · [ooRexx (Open Object Rexx) — SourceForge](https://sourceforge.net/projects/oorexx/) · [RexxLA Products — rexxla.org](https://rexxla.org/products.srsp) · [Object REXX — Wikipedia](https://en.wikipedia.org/wiki/Object_REXX)

### Regina Rexx — the classical-REXX workhorse

**Regina Rexx** is the ANSI-compliant classical REXX interpreter that
has the broadest platform-support story in the whole REXX ecosystem.
The platform list as of 2025 is striking for a language most people
consider dormant: Linux, most Unix variants, OS/2, eCS, DOS, Win9x
through Win11, macOS, OpenVMS, QNX 4/6, BeOS/Haiku, EPOC32 (Symbian),
AtheOS/SkyOS, **Amiga** (native), and **AROS** (the Amiga-compatible
open-source OS).

The Amiga and AROS ports matter for the ARexx-porting project that
this research document supports: Regina gives that project a
working, maintained classical REXX interpreter that already runs on
AROS, which means the porting-architecture work can begin from a
known-good foundation rather than from scratch.

**Sources:** [Rexx implementations — speleotrove.com](https://speleotrove.com/rexxhist/rexxplat.html) · [Rexx — Wikipedia](https://en.wikipedia.org/wiki/Rexx)

### NetRexx — REXX on the JVM

**NetRexx**, Mike Cowlishaw's own post-IBM project, continues as a
JVM-hosted REXX variant. NetRexx compiles to Java bytecode and can
be used either as a scripting language (interpreter mode) or as a
compiled language that produces .class files. The practical effect
is that NetRexx programs can use the entire Java standard library
and any third-party Java library, which makes NetRexx — unusually —
a language that has access to a much larger ecosystem than the
REXX community alone could ever have produced.

NetRexx has not had a major release in the 2025 window that the
search results surfaced, but the project remains in maintenance and
the downloads are current. For teams that want REXX syntax with JVM
target quality, NetRexx is still the answer.

### Who still uses REXX?

Howard Fosdick's long-running "Who Uses Rexx? And Where?" article at
rexxinfo.org remains the single best answer to the question, and its
continued maintenance through 2025 is itself an interesting data
point. The short version: IBM mainframes (where REXX is the
interactive scripting language for ISPF and TSO), OS/2 and eCS
systems still in production use, Commodore Amiga preservation
projects (where ARexx is the inter-application scripting glue), and
a long tail of IBM i and z/VSE installations where REXX is the
default high-level batch language.

None of these are growth markets. All of them are real markets with
production deployments that are still being maintained. REXX is not
a language looking for new users. It is a language serving the users
it already has, and those users have not gone anywhere.

**Sources:** [Who Uses Rexx? And Where? — Howard Fosdick, rexxinfo.org](https://rexxinfo.org/howard_fosdick_articles/who_uses_rexx_and_where/who_uses_rexx_and_where.html) · [Why you should consider Rexx for scripting — Opensource.com](https://opensource.com/article/22/10/rexx-scripting-language)

### What this means for the ARexx porting project

The body above is the foundational reference for an ARexx-porting
project — the work of taking the Amiga's ARexx subsystem and porting
it to modern platforms. The 2025 ecosystem data changes the porting
landscape in a specific way: because **Regina already runs on AROS**,
the porting project has a working REXX interpreter as a starting
point. The project does not need to re-implement REXX; it only needs
to re-implement the ARexx-specific parts — the port system, the
message passing, the Amiga-specific IPC — on top of Regina or a
similar host.

This simplifies the architecture described above: the "bytecode
compiler + bytecode interpreter" decision becomes optional rather
than mandatory, because an interpreter-first architecture can build
on Regina, and the REXX language work becomes a question of
maintaining compatibility with Regina rather than re-implementing
the full REXX language from scratch.

The ooRexx ecosystem provides an alternative starting point for a
port that wants the object-oriented extensions. NetRexx is viable
for a JVM-hosted port. All three are actively maintained in 2025,
and a port that chooses one of them as its foundation has the
benefit of a living upstream rather than a dormant one.

## Related College Departments

This research cross-links to the following college departments in
`.college/departments/`:

- [**coding**](../../../.college/departments/coding/DEPARTMENT.md) —
  REXX is a programming-language topic, and its design philosophy
  (readability first, human-typed lines as the primary unit of code)
  is a direct precursor to many of the Programming Fundamentals
  values the coding department teaches.
- [**history**](../../../.college/departments/history/DEPARTMENT.md)
  — REXX is one of the cleanest case studies of a language that was
  designed for one environment (the IBM mainframe) and then
  accidentally became the glue language of a completely different
  platform (the Commodore Amiga). That cross-platform survival is
  unusual enough to merit its own historical treatment.
- [**engineering**](../../../.college/departments/engineering/DEPARTMENT.md)
  — The ARexx port system (inter-application messaging via named
  ports, without a central bus) is a working example of a
  decentralized IPC architecture that predates D-Bus and COM by
  years. For anyone studying IPC design, ARexx is a primary source.
- [**writing**](../../../.college/departments/writing/DEPARTMENT.md)
  — Cowlishaw's "The REXX Language" (Prentice-Hall, 1985) is one
  of the cleanest specifications of a programming language in the
  technical-writing tradition. It is short, precise, and readable,
  and it remains a model for how a reference manual should be
  structured.

---

*This document is part of the PNW Research Series and serves as the foundational reference for the ARexx porting project. For questions or corrections, refer to the primary sources listed in Appendix E.*

*Addendum (ooRexx 5.0/5.1, Regina AROS, NetRexx, Fosdick's who-uses-rexx) and Related College Departments cross-link added during the Session 018 catalog enrichment pass.*

---

## Study Guide — REXX & ARexx History and Design

### Questions

- Why Mike Cowlishaw designed REXX at IBM Hursley
  (1979-1982).
- Why VM/CMS users adopted it over CLIST and EXEC2.
- Why ARexx (1987, Commodore Amiga) gave REXX its
  second life.
- Why modern scripting languages (Lua, Python) never
  quite matched ARexx's IPC model.

## DIY — Install Regina

`apt install regina-rexx`. `rexx hello.rex`. Write 10
lines.

## TRY — Read Cowlishaw

*The REXX Language: A Practical Approach to
Programming* (1985). The author manual. Short, clear,
canonical.

## Related College Departments

- [**history**](../../../.college/departments/history/DEPARTMENT.md)
- [**coding**](../../../.college/departments/coding/DEPARTMENT.md)
