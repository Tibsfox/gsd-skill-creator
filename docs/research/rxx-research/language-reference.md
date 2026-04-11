# REXX and ARexx: Complete Language Reference for Porting

> *"A language should be designed from the point of view of the user, not from the point of view of the implementer."* -- Mike Cowlishaw, creator of REXX (1979)

REXX (Restructured Extended Executor) was born at IBM in 1979 when Mike Cowlishaw, frustrated by the arcane syntax of EXEC 2 and the complexity of PL/I, designed a scripting language whose guiding principle was human readability. It became the standard scripting language of VM/CMS, then OS/2, then -- through William Hawes' ARexx port -- the de facto inter-process communication backbone of the Amiga. ARexx was not merely REXX on the Amiga; it added a host command interface that turned every cooperating application into a scriptable component, creating something that would not be seen again until AppleScript, COM Automation, and D-Bus.

This document is a **porting reference**. Every feature is documented with enough precision and enough runnable code that an implementer could reproduce the behavior in another language, on another platform, or in a GPU compute context. Where ARexx diverges from standard REXX (SAA level 2), those differences are called out explicitly.

---

## 1. The Typeless String Model

REXX has exactly one data type: **the string**. There are no integers, no floats, no booleans, no null. Every variable holds a string. When an arithmetic operator encounters a string that looks like a number, it converts the string to a number, performs the operation, and converts the result back to a string. When a comparison operator encounters two values, it decides whether to do a string comparison or a numeric comparison based on whether both operands look like numbers.

This is not duck typing. This is not dynamic typing. This is **no typing at all**. The value `42` is the two-character string `"42"`. The value `3.14` is the four-character string `"3.14"`. The value `  007  ` is a valid number (7) because REXX strips leading and trailing whitespace and leading zeros during numeric conversion.

```rexx
/* Everything is a string */
x = 42
SAY LENGTH(x)          /* 2 -- it's a two-character string */
SAY x + 1              /* 43 -- converted to number, added, converted back */
SAY x || 'kg'          /* 42kg -- string concatenation */

y = '  007  '
SAY y + 0              /* 7 -- leading/trailing spaces and zeros stripped */
SAY y * 2              /* 14 */
SAY LENGTH(y)          /* 7 -- the original string is 7 chars including spaces */

/* Boolean values are just the strings "0" and "1" */
flag = (3 > 2)
SAY flag               /* 1 */
SAY flag + 10          /* 11 -- it's the string "1", which is the number 1 */
SAY DATATYPE(flag)     /* NUM */
```

### 1.1 Numeric Precision: NUMERIC DIGITS

REXX performs decimal arithmetic to a configurable number of significant digits. The default is 9. You can raise it to any value your implementation supports -- and most implementations support *thousands* of digits.

```rexx
/* Default precision: 9 significant digits */
SAY 1/3                /* 0.333333333 */
SAY 2/3                /* 0.666666667 -- note the rounding */

NUMERIC DIGITS 20
SAY 1/3                /* 0.33333333333333333333 */

NUMERIC DIGITS 50
SAY 1/7                /* 0.14285714285714285714285714285714285714285714285714 */
```

The `NUMERIC DIGITS` instruction affects **all arithmetic** in the current scope (and any called routines that don't set their own precision). This is not a formatting directive; it controls the actual precision of computation. REXX does not use IEEE 754 floating point. It uses decimal arithmetic with the specified number of significant digits, following the rules that would later be formalized as IEEE 854 and then IEEE 754-2008 decimal arithmetic.

```rexx
/* IEEE 754 double would lose precision here. REXX does not. */
NUMERIC DIGITS 40
SAY 0.1 + 0.2          /* 0.3 -- exactly, no 0.30000000000000004 nonsense */
SAY 10000000000000000 + 1   /* 10000000000000001 -- no precision loss */
```

### 1.2 Arbitrary Precision: Fibonacci at 500 Digits

```rexx
/* Fibonacci numbers at arbitrary precision */
NUMERIC DIGITS 500
a = 0
b = 1
DO i = 1 TO 2390       /* F(2390) has ~500 digits */
    c = a + b
    a = b
    b = c
END
SAY 'F(2390) =' b
SAY 'Digits:' LENGTH(b)

/* Verify: F(100) should be 354224848179261915075 */
NUMERIC DIGITS 25
a = 0; b = 1
DO i = 1 TO 100
    c = a + b; a = b; b = c
END
SAY 'F(100) =' b       /* 354224848179261915075 */
```

REXX's arbitrary precision is not an add-on library. It is the **native arithmetic**. Every `+`, `-`, `*`, `/` operation respects `NUMERIC DIGITS`. This means any REXX program can trivially compute with numbers too large for 64-bit integers or IEEE 754 doubles. The cost is performance: all arithmetic is software decimal, not hardware binary.

### 1.3 NUMERIC FUZZ

`NUMERIC FUZZ` sets the number of digits that are ignored during numeric comparison. This implements "fuzzy" equality for numbers that might differ in their least significant digits due to intermediate computations.

```rexx
NUMERIC DIGITS 9
NUMERIC FUZZ 1

/* Without fuzz, these are different.
   With FUZZ 1, the last digit is ignored in comparisons. */
a = 1.000000001
b = 1.000000002
SAY (a = b)            /* 1 (true) -- last digit ignored */
SAY (a == b)           /* 0 (false) -- strict comparison ignores FUZZ */

NUMERIC FUZZ 0         /* exact comparison (default) */
SAY (a = b)            /* 0 (false) */
```

The strict comparison operators (`==`, `\==`, `>>`, `<<`, etc.) always ignore `NUMERIC FUZZ` and compare exactly.

### 1.4 NUMERIC FORM

Controls the exponential notation format for large or small numbers:

```rexx
NUMERIC FORM SCIENTIFIC    /* default */
SAY 123456789 * 100        /* 1.23456789E+10 */

NUMERIC FORM ENGINEERING
SAY 123456789 * 100        /* 12.3456789E+9 -- exponent is always multiple of 3 */
SAY 0.00000123             /* 1.23E-6 */
```

Engineering notation keeps the exponent as a multiple of 3, aligning with SI prefixes (kilo, mega, giga, milli, micro, nano).

### 1.5 Number Formatting

The `FORMAT` built-in provides fine control over numeric display:

```rexx
/* FORMAT(number, before, after, expp, expt) */
SAY FORMAT(3.14159, 5, 2)      /* '    3.14' -- 5 before decimal, 2 after */
SAY FORMAT(12, 4, 0)           /* '  12' */
SAY FORMAT(-1.5, 3, 3)         /* ' -1.500' */
SAY FORMAT(1.23E+9, , , , 3)   /* '1230000000' -- suppress exponent if <= 3 digits */
SAY FORMAT(1.23E+12, , , 3, 3) /* '1.23E+012' -- 3-digit exponent field */
```

### 1.6 Porting Implications

To port the REXX numeric model faithfully:

1. **Do not use hardware floating point.** Use a decimal arithmetic library (Python's `decimal` module, Java's `BigDecimal`, Rust's `rust_decimal` or `bigdecimal`).
2. **Precision is dynamic and scoped.** Each function call can set its own `NUMERIC DIGITS`, and it reverts on `RETURN`.
3. **String-to-number conversion is lenient.** Leading/trailing whitespace is stripped. Leading zeros are stripped. A string is a valid number if it matches the pattern: `[blanks] [sign] [digits] [.digits] [E [sign] digits] [blanks]`.
4. **Number-to-string conversion** strips trailing zeros after the decimal point and strips the decimal point if no fractional part remains. `1.0 + 0` produces `"1"`, not `"1.0"`.
5. **Comparison semantics:** if both operands are valid numbers, `=` does numeric comparison (respecting FUZZ). If either is not a valid number, `=` does string comparison (padded with blanks on the right).

---

## 2. Variables and Stems

### 2.1 Simple Variables

REXX variables require no declaration, no type annotation, and no initialization. An uninitialized variable's value is its own name **in uppercase**.

```rexx
SAY hello              /* HELLO -- the variable is uninitialized */
hello = 'world'
SAY hello              /* world */

/* Variable names are case-insensitive */
MyVar = 42
SAY myvar              /* 42 */
SAY MYVAR              /* 42 */
```

Variable names may contain letters, digits, and the characters `!`, `?`, `_`, and (in most implementations) `.` when used as a stem. They must start with a letter or one of the special characters (not a digit).

```rexx
cost! = 19.99
is_valid? = 1
_temp = 'scratch'
SAY cost! is_valid? _temp   /* 19.99 1 scratch */
```

### 2.2 Compound Variables (Stems)

Stems are REXX's only structured data type. A stem variable has a name ending in a period, and it serves as a prefix for an unbounded set of compound variables.

```rexx
/* A stem is declared by setting stem. (the "default value") */
count. = 0             /* all count.xxx variables default to 0 */

count.apples = 5
count.oranges = 3
SAY count.apples       /* 5 */
SAY count.oranges      /* 3 */
SAY count.bananas      /* 0 -- uses the default value */
```

The part after the period (the "tail") is evaluated as an expression. This is how stems act as associative arrays:

```rexx
/* Tail resolution: the tail is EVALUATED */
fruit = 'apples'
count.apples = 5
SAY count.fruit        /* 5 -- 'fruit' resolves to 'apples', so count.APPLES */

/* Numeric indices */
name.1 = 'Alice'
name.2 = 'Bob'
name.3 = 'Carol'
name.0 = 3            /* convention: stem.0 holds the count */

DO i = 1 TO name.0
    SAY name.i         /* Alice, Bob, Carol */
END
```

### 2.3 Multi-Dimensional Stems

REXX does not have true multi-dimensional arrays. But compound tails can contain multiple periods, and each segment is evaluated:

```rexx
/* Simulating a 2D array */
grid. = '.'
grid.1.1 = 'X'
grid.1.2 = 'O'
grid.2.1 = ' '
grid.2.2 = 'X'

DO row = 1 TO 2
    line = ''
    DO col = 1 TO 2
        line = line grid.row.col
    END
    SAY line
END
/* Output:
    X O
      X
*/
```

How this works internally: `grid.row.col` where `row=1` and `col=2` resolves to `grid.1.2`. The tail `ROW.COL` is evaluated: `ROW` becomes `1`, `COL` becomes `2`, and the compound variable name becomes `GRID.1.2`. The periods in the tail are literal separators, not operators.

### 2.4 Tail Resolution in Detail

Understanding tail resolution is critical for porting:

```rexx
a = 'X'
b = 'Y'
stem.a.b = 'found it'

/* The tail "a.b" resolves as follows:
   1. Look up variable A -> 'X'
   2. Look up variable B -> 'Y'
   3. Construct compound name: STEM.X.Y
   4. Look up STEM.X.Y -> 'found it'
*/

SAY stem.a.b           /* found it */
SAY stem.X.Y           /* found it -- same compound variable */

/* Uninitialized tail components resolve to their uppercase name */
SAY stem.a.c           /* STEM.X.C -- c is uninitialized, resolves to 'C' */
                       /* STEM.X.C is uninitialized, so its value is default or name */
```

### 2.5 The DROP Instruction

`DROP` releases a variable, returning it to its uninitialized state:

```rexx
x = 42
SAY x                  /* 42 */
DROP x
SAY x                  /* X -- uninitialized, shows its own name */

/* Dropping a stem drops ALL compound variables under it */
name.1 = 'Alice'
name.2 = 'Bob'
name.0 = 2
DROP name.
SAY name.1             /* NAME.1 -- all gone */
SAY name.0             /* NAME.0 */

/* Drop specific compound variables */
score.math = 95
score.english = 87
DROP score.math
SAY score.math         /* uses stem default, or SCORE.MATH if no default set */
SAY score.english      /* 87 -- still there */
```

### 2.6 The SYMBOL Function

`SYMBOL` reports the state of a variable:

```rexx
x = 42
SAY SYMBOL('x')        /* VAR -- it's an assigned variable */
SAY SYMBOL('y')        /* LIT -- it's a literal (uninitialized, would be 'Y') */
SAY SYMBOL('42')       /* LIT -- it's a literal (a number) */
SAY SYMBOL('SELECT')   /* BAD -- it's a reserved keyword, can't be a variable */
```

Return values: `BAD` (invalid symbol), `VAR` (variable with a value), `LIT` (literal -- valid symbol but not assigned).

### 2.7 Porting Implications

1. **Variable storage** is a flat hash/dictionary mapping uppercase names to string values.
2. **Compound variables** are stored as single keys: `STEM.TAIL.TAIL2` is one key in the variable pool.
3. **Tail resolution** must evaluate each tail component by looking it up as a simple variable first.
4. **Default values:** when a stem (e.g., `count.`) is assigned a value, every unresolved compound variable under that stem returns that default. Implementation: store the default separately, return it when a compound lookup misses.
5. **Scope:** variables are global by default. The `PROCEDURE` instruction creates a new scope (see section 7).

---

## 3. The PARSE Instruction

`PARSE` is REXX's most powerful and distinctive feature. It is a declarative string-splitting instruction that replaces regular expressions for a surprising range of tasks. Where other languages reach for `split()`, `substr()`, or regex, REXX programmers reach for `PARSE`.

The general form is:

```
PARSE [UPPER] source template
```

The optional `UPPER` keyword uppercases the source string before parsing. The source tells REXX *where* to get the string. The template tells REXX *how* to split it.

### 3.1 PARSE Sources

| Source | Meaning |
|---|---|
| `PARSE ARG` | Arguments passed to subroutine or program |
| `PARSE PULL` | Read from external data queue (or stdin if queue empty) |
| `PARSE VAR name` | Parse the contents of variable `name` |
| `PARSE VALUE expr WITH` | Parse the result of expression `expr` |
| `PARSE SOURCE` | Information about how the program was invoked |
| `PARSE VERSION` | Interpreter version information |
| `PARSE LINEIN` | Read a line from default input stream (ARexx/some impls) |
| `PARSE EXTERNAL` | Read from terminal (OS/2, CMS) |
| `PARSE NUMERIC` | Current NUMERIC settings |

```rexx
/* PARSE ARG -- arguments to a subroutine */
CALL greet 'Alice', 25
EXIT

greet:
    PARSE ARG name, age
    SAY name 'is' age 'years old.'   /* Alice is 25 years old. */
    RETURN

/* PARSE PULL -- read from queue or stdin */
SAY 'Enter your name:'
PARSE PULL username
SAY 'Hello,' username

/* PARSE VAR -- parse a variable's contents */
timestamp = '2026-04-09 14:30:00'
PARSE VAR timestamp year '-' month '-' day ' ' hour ':' min ':' sec
SAY 'Year:' year                     /* 2026 */
SAY 'Month:' month                   /* 04 */
SAY 'Time:' hour':'min':'sec        /* 14:30:00 */

/* PARSE VALUE ... WITH -- parse an expression */
PARSE VALUE DATE('S') WITH year 5 month 7 day
SAY year month day                   /* 2026 04 09 (from sorted date) */

/* PARSE SOURCE -- program invocation info */
PARSE SOURCE system invocation programname
SAY 'Running on:' system             /* AMIGA, OS2, CMS, etc. */
SAY 'Program:' programname

/* PARSE VERSION -- interpreter info */
PARSE VERSION language level date
SAY language level                   /* REXX 4.00 (or similar) */
```

### 3.2 Template Grammar: Word-Based Parsing

The simplest template is a list of variable names. REXX splits the source string by whitespace, assigning one word to each variable. The last variable gets **everything remaining**.

```rexx
line = 'Alice   Bob   Carol   Dave'

PARSE VAR line first second third rest
SAY first              /* Alice */
SAY second             /* Bob */
SAY third              /* Carol */
SAY rest               /* Dave */

/* The last variable gets the rest of the string including leading spaces */
line = '  one   two   three  four  five  '
PARSE VAR line a b c
SAY a                  /* one */
SAY b                  /* two */
SAY c                  /* three  four  five   (everything remaining) */
```

Use a period (`.`) as a placeholder to discard a word:

```rexx
line = 'Error 404 Not Found'
PARSE VAR line . code . message
SAY code               /* 404 */
SAY message            /* Found */
/* Wait -- "Not" was consumed by the period placeholder.
   The period after 404 consumed "Not", then message got "Found". */

/* To get "Not Found", use: */
PARSE VAR line . code rest
SAY rest               /* Not Found */
```

### 3.3 Template Grammar: Literal Patterns

A quoted string in the template acts as a delimiter. REXX finds the literal in the source string and splits at that point.

```rexx
/* Splitting on delimiters */
csv = 'Alice,25,Engineer,Seattle'
PARSE VAR csv name ',' age ',' role ',' city
SAY name               /* Alice */
SAY age                /* 25 */
SAY role               /* Engineer */
SAY city               /* Seattle */

/* Parsing a URL */
url = 'https://www.tibsfox.com:8080/research/rexx?q=parse#section3'
PARSE VAR url protocol '://' host ':' port '/' path '?' query '#' fragment
SAY protocol           /* https */
SAY host               /* www.tibsfox.com */
SAY port               /* 8080 */
SAY path               /* research/rexx */
SAY query              /* q=parse */
SAY fragment           /* section3 */

/* Parsing key=value pairs */
setting = 'color = blue'
PARSE VAR setting key '=' value
SAY STRIP(key)         /* color */
SAY STRIP(value)       /* blue */

/* Parsing an email address */
email = 'foxglove@philips.com'
PARSE VAR email user '@' domain
SAY user               /* foxglove */
SAY domain             /* philips.com */
```

### 3.4 Template Grammar: Positional Patterns

A number in the template specifies a column position (1-based). An absolute position moves to that column. A signed position (`+n` or `-n`) moves relative to the current position.

```rexx
/* Absolute positions */
record = 'SMITH   JOHN    19760421SEA'
PARSE VAR record lastname 9 firstname 17 birthdate 25 airport
SAY lastname           /* SMITH    (columns 1-8) */
SAY firstname          /* JOHN     (columns 9-16) */
SAY birthdate          /* 19760421 (columns 17-24) */
SAY airport            /* SEA (columns 25+) */

/* Relative positions */
data = 'ABCDEFGHIJKLMNOP'
PARSE VAR data first +3 second +5 third
SAY first              /* ABC (3 chars from start) */
SAY second             /* DEFGH (5 chars from current position) */
SAY third              /* IJKLMNOP (rest) */

/* Negative relative positions (move backward) */
line = 'Hello World'
PARSE VAR line word1 +5 . +1 word2
SAY word1              /* Hello */
SAY word2              /* World */
/* +5 takes "Hello", . +1 skips one char (the space), word2 gets "World" */

/* Combining absolute and relative */
fixed = 'ACME  Widget   0042500'
PARSE VAR fixed company 7 product 17 amount
SAY STRIP(company)     /* ACME */
SAY STRIP(product)     /* Widget */
SAY amount + 0         /* 42500 (strip leading zeros via arithmetic) */
```

### 3.5 Template Grammar: Variable Patterns

A variable name in parentheses acts as a pattern whose value is looked up at parse time:

```rexx
/* The delimiter is stored in a variable */
delim = ','
data = 'one,two,three'
PARSE VAR data a (delim) b (delim) c
SAY a                  /* one */
SAY b                  /* two */
SAY c                  /* three */

/* Variable position */
start = 5
len = 3
record = 'ABCDEFGHIJ'
PARSE VAR record =(start) chunk +(len) .
SAY chunk              /* EFG (3 chars starting at position 5) */
```

### 3.6 Multiple Argument Parsing

`PARSE ARG` uses commas to separate argument groups. Each comma starts a new template for the next argument:

```rexx
CALL process 'Alice 25', 'Engineer', 'Seattle WA 98101'

process:
    PARSE ARG name age, role, city state zip
    SAY name             /* Alice */
    SAY age              /* 25 */
    SAY role             /* Engineer */
    SAY city             /* Seattle */
    SAY state            /* WA */
    SAY zip              /* 98101 */
    RETURN
```

### 3.7 Real-World PARSE Examples

**Parsing Apache log lines:**

```rexx
logline = '192.168.1.1 - frank [10/Oct/2025:13:55:36 -0700] "GET /index.html HTTP/1.1" 200 2326'

PARSE VAR logline ip ' - ' user ' [' datetime '] "' method ' ' path ' ' proto '" ' status ' ' bytes

SAY 'IP:' ip            /* 192.168.1.1 */
SAY 'User:' user        /* frank */
SAY 'DateTime:' datetime /* 10/Oct/2025:13:55:36 -0700 */
SAY 'Method:' method    /* GET */
SAY 'Path:' path        /* /index.html */
SAY 'Status:' status    /* 200 */
SAY 'Bytes:' bytes      /* 2326 */
```

**Parsing /etc/passwd:**

```rexx
entry = 'root:x:0:0:root:/root:/bin/bash'
PARSE VAR entry username ':' password ':' uid ':' gid ':' gecos ':' home ':' shell
SAY 'User:' username    /* root */
SAY 'UID:' uid          /* 0 */
SAY 'Home:' home        /* /root */
SAY 'Shell:' shell      /* /bin/bash */
```

**Parsing CSV with quoted fields (advanced):**

```rexx
/* CSV with quotes requires iterative parsing */
csvline = '"Smith, John",42,"New York, NY",Engineer'

result. = ''
field_count = 0
pos = 1
DO WHILE pos <= LENGTH(csvline)
    ch = SUBSTR(csvline, pos, 1)
    IF ch = '"' THEN DO
        /* Quoted field -- find closing quote */
        endq = POS('"', csvline, pos + 1)
        field_count = field_count + 1
        result.field_count = SUBSTR(csvline, pos + 1, endq - pos - 1)
        pos = endq + 2        /* skip closing quote and comma */
    END
    ELSE DO
        /* Unquoted field -- find comma or end */
        comma = POS(',', csvline, pos)
        IF comma = 0 THEN comma = LENGTH(csvline) + 1
        field_count = field_count + 1
        result.field_count = SUBSTR(csvline, pos, comma - pos)
        pos = comma + 1
    END
END

DO i = 1 TO field_count
    SAY 'Field' i':' result.i
END
/* Field 1: Smith, John
   Field 2: 42
   Field 3: New York, NY
   Field 4: Engineer
*/
```

### 3.8 PARSE vs Regular Expressions

PARSE cannot do everything regex can. It cannot match character classes, repetition, alternation, or lookahead. But for structured text with known delimiters, known positions, or word-based layouts, PARSE is often clearer and faster than regex.

| Task | Regex | PARSE |
|---|---|---|
| Split on delimiter | `split(/,/)` | `PARSE VAR s a ',' b ',' c` |
| Extract fixed columns | `substr(s,4,8)` or `/^.{4}(.{8})/` | `PARSE VAR s 5 field 13` |
| Extract words | `/(\S+)\s+(\S+)/` | `PARSE VAR s word1 word2` |
| Key=value | `/(\w+)=(\w+)/` | `PARSE VAR s key '=' value` |
| Character classes | `/[A-Z]+/` -- regex wins | No equivalent in PARSE |
| Repetition/optionality | `/\d{2,4}/` -- regex wins | No equivalent in PARSE |

PARSE excels at **destructuring known formats**. Regex excels at **matching unknown patterns**.

---

## 4. Control Structures

REXX has a small, orthogonal set of control structures. The `DO`/`END` block serves every loop purpose. `IF`/`THEN`/`ELSE` handles conditionals. `SELECT`/`WHEN`/`OTHERWISE`/`END` handles multi-way branching.

### 4.1 DO Loops

```rexx
/* Counted loop */
DO i = 1 TO 10
    SAY i
END
/* i is 11 after the loop (one past the limit) */

/* Stepped loop */
DO i = 0 TO 100 BY 5
    SAY i              /* 0, 5, 10, 15, ..., 100 */
END

/* Counted with limit */
DO i = 1 TO 1000 FOR 10
    SAY i              /* 1, 2, 3, ..., 10 (FOR limits iterations) */
END

/* Descending loop */
DO i = 10 TO 1 BY -1
    SAY i              /* 10, 9, 8, ..., 1 */
END

/* WHILE loop */
line = LINEIN()
DO WHILE line \= ''
    CALL process line
    line = LINEIN()
END

/* UNTIL loop (test at bottom) */
DO UNTIL answer = 'YES'
    SAY 'Continue? (YES/NO)'
    PARSE PULL answer
END

/* Repeat N times (no control variable) */
DO 5
    SAY 'Hello'        /* prints Hello 5 times */
END

/* Infinite loop */
DO FOREVER
    SAY 'Enter command (QUIT to exit):'
    PARSE PULL cmd
    IF cmd = 'QUIT' THEN LEAVE
    CALL execute cmd
END

/* Combining counted and conditional */
DO i = 1 TO 100 WHILE total < 1000
    total = total + i
END
SAY 'Stopped at i =' i 'total =' total
```

### 4.2 LEAVE and ITERATE

```rexx
/* LEAVE exits the innermost loop */
DO i = 1 TO 100
    IF i * i > 50 THEN LEAVE
    SAY i              /* 1, 2, 3, 4, 5, 6, 7 */
END
SAY 'Left at i =' i   /* 8 */

/* LEAVE with label exits a named loop */
DO i = 1 TO 10
    DO j = 1 TO 10
        IF i * j > 20 THEN LEAVE i  /* exits outer loop */
        SAY i '*' j '=' i * j
    END
END

/* ITERATE skips to the next iteration */
DO i = 1 TO 20
    IF i // 3 = 0 THEN ITERATE   /* skip multiples of 3 */
    SAY i
END

/* ITERATE with label */
DO i = 1 TO 5
    DO j = 1 TO 5
        IF j = 3 THEN ITERATE i  /* restart outer loop */
        SAY i j
    END
END
```

Note: `//` is the REXX remainder (modulo) operator, not a comment. REXX comments use `/* ... */`.

### 4.3 IF / THEN / ELSE

```rexx
IF age >= 18 THEN SAY 'Adult'

IF age >= 18 THEN
    SAY 'Adult'
ELSE
    SAY 'Minor'

/* Multi-statement -- requires DO/END */
IF score > 90 THEN DO
    grade = 'A'
    SAY 'Excellent!'
END
ELSE DO
    grade = 'B'
    SAY 'Good.'
END

/* NOP for empty clauses */
IF debug THEN NOP        /* do nothing if debug is true */
ELSE SAY 'Release mode'

/* Nested IF */
IF x > 0 THEN
    IF y > 0 THEN SAY 'Quadrant I'
    ELSE SAY 'Quadrant IV'
ELSE
    IF y > 0 THEN SAY 'Quadrant II'
    ELSE SAY 'Quadrant III'
```

### 4.4 SELECT / WHEN / OTHERWISE

REXX's equivalent of `switch`/`case`, but each `WHEN` clause has its own independent boolean expression (like `cond` in Lisp, not like C's `switch`).

```rexx
SELECT
    WHEN grade = 'A' THEN SAY 'Excellent'
    WHEN grade = 'B' THEN SAY 'Good'
    WHEN grade = 'C' THEN SAY 'Average'
    WHEN grade = 'D' THEN SAY 'Below average'
    WHEN grade = 'F' THEN SAY 'Failing'
    OTHERWISE SAY 'Unknown grade:' grade
END

/* With DO blocks */
SELECT
    WHEN age < 13 THEN DO
        category = 'child'
        discount = 50
    END
    WHEN age < 18 THEN DO
        category = 'teen'
        discount = 25
    END
    WHEN age >= 65 THEN DO
        category = 'senior'
        discount = 30
    END
    OTHERWISE DO
        category = 'adult'
        discount = 0
    END
END

/* SELECT with no matching WHEN and no OTHERWISE raises an error.
   Always include OTHERWISE (even if it's just OTHERWISE NOP). */
```

### 4.5 Operator Reference

| Category | Operators | Notes |
|---|---|---|
| Arithmetic | `+` `-` `*` `/` `%` `//` `**` | `%` = integer divide, `//` = remainder, `**` = power |
| Comparison (normal) | `=` `\=` `<>` `><` `>` `<` `>=` `<=` | Numeric or string comparison, respects FUZZ |
| Comparison (strict) | `==` `\==` `>>` `<<` `>>=` `<<=` | Character-by-character, no padding, ignores FUZZ |
| Logical | `&` `|` `&&` `\` | AND, OR, XOR, NOT. Operands must be 0 or 1. |
| Concatenation | (space) `||` (abuttal) | Three forms: `a b`, `a||b`, `a"lit"` |
| Prefix | `+` `-` `\` | Unary plus, minus, logical NOT |

Concatenation deserves special attention. REXX has **three** concatenation operators:

```rexx
a = 'Hello'
b = 'World'

SAY a b                /* Hello World -- space concatenation (adds one blank) */
SAY a || b             /* HelloWorld -- explicit concatenation (no blank) */
SAY a'!'               /* Hello! -- abuttal (no blank, no operator needed) */
```

---

## 5. String Built-in Functions

REXX has a rich library of built-in string functions. Since everything is a string, these are the workhorses of the language.

### 5.1 String Manipulation

```rexx
/* SUBSTR(string, start [,length [,pad]]) */
SAY SUBSTR('Hello World', 7)       /* World */
SAY SUBSTR('Hello World', 1, 5)    /* Hello */
SAY SUBSTR('AB', 1, 5, '*')        /* AB*** (padded to length 5) */

/* LEFT(string, length [,pad]) / RIGHT(string, length [,pad]) */
SAY LEFT('Hello', 3)               /* Hel */
SAY LEFT('Hi', 6, '.')             /* Hi.... */
SAY RIGHT('42', 5, '0')            /* 00042 */
SAY RIGHT('Hello World', 5)        /* World */

/* CENTER / CENTRE(string, width [,pad]) -- both spellings accepted */
SAY CENTER('Title', 20)            /*        Title         */
SAY CENTER('Hi', 10, '-')          /* ----Hi---- */

/* COPIES(string, n) */
SAY COPIES('Ha', 3)                /* HaHaHa */
SAY COPIES('-', 40)                /* ---------------------------------------- */

/* OVERLAY(new, target, start [,length [,pad]]) */
SAY OVERLAY('***', 'Hello World', 6)     /* Hello***rld */
SAY OVERLAY('XX', 'ABCDEF', 3, 4, '.')   /* ABXX..  (replace 4 chars at pos 3) */

/* INSERT(new, target [,position [,length [,pad]]]) */
SAY INSERT(' ', 'HelloWorld', 5)          /* Hello World */
SAY INSERT('XYZ', 'ABCDEF', 3)           /* ABCXYZDEF */

/* DELSTR(string, start [,length]) */
SAY DELSTR('Hello World', 6)       /* Hello */
SAY DELSTR('Hello World', 6, 1)    /* HelloWorld (deleted the space) */

/* REVERSE(string) */
SAY REVERSE('Hello')               /* olleH */
SAY REVERSE('12345')               /* 54321 */

/* STRIP(string [,option [,char]]) */
SAY STRIP('  Hello  ')             /*  Hello (both) */
SAY STRIP('  Hello  ', 'L')        /* Hello   (leading only) */
SAY STRIP('  Hello  ', 'T')        /*   Hello (trailing only) */
SAY STRIP('***Hello***', 'B', '*') /* Hello (strip specific char) */

/* TRANSLATE(string [,output [,input [,pad]]]) */
SAY TRANSLATE('hello')                           /* HELLO (no args = uppercase) */
SAY TRANSLATE('Hello', 'aeiou', 'AEIOU')        /* Hallo -- wait, no... */
/* Actually: each char in 'input' table maps to corresponding char in 'output' */
SAY TRANSLATE('ABC', 'xyz', 'ABC')               /* xyz */
SAY TRANSLATE('Hello World', , , '*')             /* no change (empty translate) */

/* ROT13 with TRANSLATE */
alpha = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'
rot13 = 'NOPQRSTUVWXYZABCDEFGHIJKLMnopqrstuvwxyzabcdefghijklm'
SAY TRANSLATE('Hello World', rot13, alpha)       /* Uryyb Jbeyq */

/* CHANGESTR(needle, haystack, replacement) -- ANSI REXX, not in all impls */
SAY CHANGESTR('World', 'Hello World', 'REXX')   /* Hello REXX */

/* COUNTSTR(needle, haystack) -- ANSI REXX */
SAY COUNTSTR('is', 'This is what it is')         /* 3 */
```

### 5.2 Word Functions

REXX treats strings as sequences of blank-delimited words. The word functions operate on this model:

```rexx
phrase = '  The   quick   brown   fox   jumps  '

/* WORDS(string) -- count words */
SAY WORDS(phrase)                /* 5 */

/* WORD(string, n) -- get nth word */
SAY WORD(phrase, 1)              /* The */
SAY WORD(phrase, 3)              /* brown */
SAY WORD(phrase, 6)              /* (empty string -- no 6th word) */

/* WORDINDEX(string, n) -- position of nth word */
SAY WORDINDEX(phrase, 1)         /* 3 (leading spaces) */
SAY WORDINDEX(phrase, 2)         /* 7 */

/* WORDLENGTH(string, n) -- length of nth word */
SAY WORDLENGTH(phrase, 2)        /* 5 (quick) */

/* WORDPOS(phrase, string [,start]) -- find phrase in string */
SAY WORDPOS('brown fox', phrase)  /* 3 (starts at word 3) */
SAY WORDPOS('red fox', phrase)    /* 0 (not found) */

/* SUBWORD(string, n [,count]) -- extract words */
SAY SUBWORD(phrase, 2, 3)        /* quick   brown   fox */
SAY SUBWORD(phrase, 4)           /* fox   jumps */

/* DELWORD(string, n [,count]) -- delete words */
SAY DELWORD(phrase, 3, 1)        /* The   quick   fox   jumps */

/* SPACE(string [,n [,pad]]) -- normalize spacing */
SAY SPACE(phrase)                /* The quick brown fox jumps */
SAY SPACE(phrase, 3)             /* The   quick   brown   fox   jumps */
SAY SPACE(phrase, 1, '-')        /* The-quick-brown-fox-jumps */
```

### 5.3 Search and Comparison Functions

```rexx
/* POS(needle, haystack [,start]) -- find position */
SAY POS('World', 'Hello World')           /* 7 */
SAY POS('world', 'Hello World')           /* 0 (case-sensitive) */
SAY POS('l', 'Hello World')              /* 3 */
SAY POS('l', 'Hello World', 4)           /* 4 (start search at position 4) */

/* LASTPOS(needle, haystack [,start]) -- find last occurrence */
SAY LASTPOS('l', 'Hello World')          /* 10 */
SAY LASTPOS('l', 'Hello World', 9)       /* 4 (search backward from 9) */

/* ABBREV(information, info [,length]) -- is info an abbreviation? */
SAY ABBREV('PRINT', 'PR')               /* 1 (true) */
SAY ABBREV('PRINT', 'PR', 3)            /* 0 (need at least 3 chars) */
SAY ABBREV('PRINT', 'PRINTER')          /* 0 (too long) */

/* COMPARE(string1, string2 [,pad]) -- position of first difference */
SAY COMPARE('Hello', 'Hello')            /* 0 (identical) */
SAY COMPARE('Hello', 'Help')             /* 4 (differ at position 4) */
SAY COMPARE('abc', 'abc   ', ' ')        /* 0 (padded comparison) */

/* DATATYPE(string [,type]) -- check data type */
SAY DATATYPE('42')                        /* NUM */
SAY DATATYPE('Hello')                     /* CHAR */
SAY DATATYPE('42', 'N')                   /* 1 (is it a number?) */
SAY DATATYPE('FF', 'X')                   /* 1 (is it valid hex?) */
SAY DATATYPE('10110', 'B')                /* 1 (is it valid binary?) */
SAY DATATYPE('Hello', 'A')                /* 1 (is it alphanumeric?) */
SAY DATATYPE('hello', 'L')                /* 1 (is it lowercase?) */
SAY DATATYPE('HELLO', 'U')                /* 1 (is it uppercase?) */
SAY DATATYPE('abc', 'M')                  /* 1 (is it mixed case?) */
SAY DATATYPE('Hello World', 'W')          /* 0 (is it a whole number?) */

/* VERIFY(string, reference [,option [,start]]) */
/* Find first char in string NOT in reference */
SAY VERIFY('123', '0123456789')           /* 0 (all chars are digits) */
SAY VERIFY('12X4', '0123456789')          /* 3 (position of 'X') */
SAY VERIFY('12X4Y', '0123456789', 'M')   /* 3 (Match: first char that IS in ref) */
```

### 5.4 Conversion Functions

REXX provides complete conversion between character, decimal, hexadecimal, and binary representations:

```rexx
/* Character <-> Decimal */
SAY C2D('A')                   /* 65 */
SAY C2D('AB')                  /* 16706 (256*65 + 66) */
SAY D2C(65)                    /* A */
SAY D2C(16706)                 /* AB */

/* Character <-> Hexadecimal */
SAY C2X('Hello')               /* 48656C6C6F */
SAY X2C('48656C6C6F')          /* Hello */
SAY C2X('A')                   /* 41 */
SAY X2C('41')                  /* A */

/* Decimal <-> Hexadecimal */
SAY D2X(255)                   /* FF */
SAY D2X(256)                   /* 100 */
SAY X2D('FF')                  /* 255 */
SAY X2D('100')                 /* 256 */

/* Hexadecimal <-> Binary */
SAY X2B('FF')                  /* 11111111 */
SAY X2B('0A')                  /* 00001010 */
SAY B2X('11111111')            /* FF */
SAY B2X('1010')                /* A */

/* Chaining conversions */
SAY D2X(D2C(65))               /* error -- D2C returns 'A', D2X expects a number */
SAY C2X(D2C(65))               /* 41 (decimal 65 -> char 'A' -> hex '41') */

/* Practical: MAC address formatting */
mac_raw = 'AABBCCDDEEFF'
mac = SUBSTR(mac_raw,1,2)':'SUBSTR(mac_raw,3,2)':'SUBSTR(mac_raw,5,2)':'SUBSTR(mac_raw,7,2)':'SUBSTR(mac_raw,9,2)':'SUBSTR(mac_raw,11,2)
SAY mac                        /* AA:BB:CC:DD:EE:FF */
```

### 5.5 Math Functions

```rexx
/* ABS(number) */
SAY ABS(-42)                   /* 42 */
SAY ABS(3.14)                  /* 3.14 */

/* MAX(number, number [,...]) / MIN(number, number [,...]) */
SAY MAX(10, 20, 5, 15)         /* 20 */
SAY MIN(10, 20, 5, 15)         /* 5 */

/* SIGN(number) */
SAY SIGN(-42)                  /* -1 */
SAY SIGN(0)                    /* 0 */
SAY SIGN(42)                   /* 1 */

/* TRUNC(number [,decimals]) */
SAY TRUNC(3.14159)             /* 3 */
SAY TRUNC(3.14159, 2)          /* 3.14 */
SAY TRUNC(-3.7)                /* -3 (truncates toward zero) */

/* FORMAT(number [,before [,after [,expp [,expt]]]]) */
SAY FORMAT(12.3, 5, 2)         /* '   12.30' */
SAY FORMAT(1.23E+6, , , , 9)   /* '1230000' (no exponent if exp digits <= 9) */

/* RANDOM([min] [,max] [,seed]) */
SAY RANDOM(1, 100)             /* random number between 1 and 100 */
SAY RANDOM(0, 1)               /* 0 or 1 (coin flip) */
SAY RANDOM(1, 6)               /* 1-6 (die roll) */
CALL RANDOM ,,12345            /* seed the generator */
```

### 5.6 Utility Functions

```rexx
/* LENGTH(string) */
SAY LENGTH('Hello')            /* 5 */
SAY LENGTH('')                 /* 0 */

/* DATE([format]) */
SAY DATE()                     /* 9 Apr 2026 */
SAY DATE('S')                  /* 20260409 (sorted) */
SAY DATE('U')                  /* 04/09/26 (USA) */
SAY DATE('E')                  /* 09/04/26 (European) */
SAY DATE('O')                  /* 26/04/09 (Ordered) */
SAY DATE('N')                  /* 9 Apr 2026 (Normal, default) */
SAY DATE('B')                  /* base date (days since 1/1/0001) */
SAY DATE('D')                  /* day number in year (1-366) */
SAY DATE('W')                  /* Wednesday (weekday) */
SAY DATE('M')                  /* April (month name) */

/* TIME([format]) */
SAY TIME()                     /* 14:30:00 (HH:MM:SS) */
SAY TIME('C')                  /* 2:30pm (civil) */
SAY TIME('H')                  /* 14 (hours since midnight) */
SAY TIME('M')                  /* 870 (minutes since midnight) */
SAY TIME('S')                  /* 52200 (seconds since midnight) */
SAY TIME('L')                  /* 14:30:00.123456 (long with microseconds) */
SAY TIME('E')                  /* elapsed time since first TIME('E') or TIME('R') */
SAY TIME('R')                  /* elapsed time, then reset */

/* SOURCELINE([n]) */
SAY SOURCELINE()               /* total number of source lines */
SAY SOURCELINE(1)              /* the first line of the source */

/* ERRORTEXT(n) */
SAY ERRORTEXT(40)              /* Incorrect call to routine (error message for code 40) */

/* CONDITION([option]) -- inside an error handler */
/* Returns: 'C' condition name, 'D' description, 'I' instruction, 'S' state */

/* VALUE(name [,newvalue] [,selector]) */
x = 42
SAY VALUE('x')                 /* 42 -- indirect variable access */
SAY VALUE('x', 99)             /* 42 (returns old value, sets x to 99) */
SAY x                          /* 99 */

/* Environment variable access (implementation-specific) */
SAY VALUE('PATH', , 'ENVIRONMENT')   /* system PATH */
```

---

## 6. I/O Model

REXX has two distinct I/O subsystems: the **external data queue** (a message-passing mechanism inherited from CMS) and **stream I/O** (line-oriented and character-oriented file access).

### 6.1 The External Data Queue

The queue is a FIFO/LIFO buffer that sits between the program and its environment. On CMS, it was used for inter-program communication. On ARexx, it was used less frequently since the host command interface served that purpose. But the queue remains part of the language standard.

```rexx
/* PUSH adds to the TOP of the queue (LIFO) */
PUSH 'third'
PUSH 'second'
PUSH 'first'

/* QUEUE adds to the BOTTOM of the queue (FIFO) */
QUEUE 'fourth'

/* QUEUED() returns number of items in queue */
SAY QUEUED()                   /* 4 */

/* PULL reads from TOP of queue (or stdin if queue is empty) */
PARSE PULL line
SAY line                       /* first */
PARSE PULL line
SAY line                       /* second */

/* Drain the queue */
DO WHILE QUEUED() > 0
    PARSE PULL item
    SAY item
END
/* third
   fourth */

/* After queue is empty, PULL reads from stdin */
SAY 'Enter something:'
PARSE PULL input               /* reads from keyboard */
```

### 6.2 Stream I/O

Stream I/O was formalized in ANSI REXX (1996). It provides line-oriented and character-oriented access to files.

```rexx
/* LINEIN(name [,line [,count]]) -- read a line */
line = LINEIN('/tmp/data.txt')        /* read one line */
line = LINEIN('/tmp/data.txt', 1)     /* read line 1 (reposition) */

/* LINEOUT(name [,string [,line]]) -- write a line */
CALL LINEOUT '/tmp/output.txt', 'Hello World'
CALL LINEOUT '/tmp/output.txt', 'Second line'
CALL LINEOUT '/tmp/output.txt'        /* close the file (no data arg) */

/* LINES(name [,option]) -- check for remaining lines */
DO WHILE LINES('/tmp/data.txt') > 0
    line = LINEIN('/tmp/data.txt')
    SAY line
END

/* CHARIN(name [,start [,length]]) -- read characters */
chunk = CHARIN('/tmp/data.bin', 1, 100)  /* read 100 chars from start */

/* CHAROUT(name [,string [,start]]) -- write characters */
CALL CHAROUT '/tmp/out.bin', 'ABCDEF'
CALL CHAROUT '/tmp/out.bin', 'XY', 3     /* write 'XY' at position 3 */

/* CHARS(name) -- number of remaining characters */
SAY CHARS('/tmp/data.bin')

/* STREAM(name [,operation [,command]]) -- file status and control */
SAY STREAM('/tmp/data.txt', 'S')          /* READY, NOTREADY, or ERROR */
SAY STREAM('/tmp/data.txt', 'D')          /* description of state */
CALL STREAM '/tmp/data.txt', 'C', 'OPEN READ'   /* explicit open */
CALL STREAM '/tmp/data.txt', 'C', 'CLOSE'       /* explicit close */
CALL STREAM '/tmp/data.txt', 'C', 'SEEK 100'    /* seek to position */
```

**Complete file copy example:**

```rexx
/* Copy a text file line by line */
infile = '/tmp/source.txt'
outfile = '/tmp/dest.txt'

DO WHILE LINES(infile) > 0
    CALL LINEOUT outfile, LINEIN(infile)
END

CALL LINEOUT infile    /* close input */
CALL LINEOUT outfile   /* close output */

SAY 'Copy complete.'
```

**Reading a file into a stem:**

```rexx
/* Read entire file into stem array */
filename = '/tmp/data.txt'
line. = ''
count = 0

DO WHILE LINES(filename) > 0
    count = count + 1
    line.count = LINEIN(filename)
END
line.0 = count

SAY 'Read' line.0 'lines.'
DO i = 1 TO line.0
    SAY RIGHT(i, 4)':' line.i
END
```

### 6.3 SAY

`SAY` writes a string to stdout, followed by a newline. It is the most commonly used output instruction.

```rexx
SAY 'Hello, World!'
SAY                    /* blank line */
SAY 'The answer is' 42
SAY 'Name:' name || ', Age:' age
```

### 6.4 ARexx I/O Differences

ARexx on the Amiga did not implement full ANSI stream I/O. Instead, it used the Amiga's file system through `OPEN()`, `CLOSE()`, `READLN()`, `WRITELN()`, `READCH()`, `WRITECH()`, `SEEK()`, and `EOF()` from the `rexxsupport.library`:

```rexx
/* ARexx file I/O (rexxsupport.library) */
IF ~OPEN('infile', 'RAM:data.txt', 'R') THEN DO
    SAY 'Cannot open file'
    EXIT 10
END

DO WHILE ~EOF('infile')
    line = READLN('infile')
    SAY line
END

CALL CLOSE 'infile'

/* Writing */
IF OPEN('outfile', 'RAM:output.txt', 'W') THEN DO
    CALL WRITELN 'outfile', 'First line'
    CALL WRITELN 'outfile', 'Second line'
    CALL CLOSE 'outfile'
END

/* Character-level I/O */
IF OPEN('binfile', 'RAM:data.bin', 'R') THEN DO
    header = READCH('binfile', 4)   /* read 4 characters */
    CALL SEEK 'binfile', 100, 'B'  /* seek to offset 100 from beginning */
    chunk = READCH('binfile', 256)
    CALL CLOSE 'binfile'
END
```

The key difference: ARexx file functions take a **logical name** (a string you assign when opening), not a file path on every call. Standard REXX stream I/O uses the file path as the stream identifier.

---

## 7. Subroutines and Functions

### 7.1 Internal Subroutines

An internal subroutine is a label in the same source file, invoked with `CALL`:

```rexx
/* Main program */
CALL greet 'Alice'
CALL greet 'Bob'
SAY 'Done.'
EXIT

greet:
    PARSE ARG name
    SAY 'Hello,' name'!'
    RETURN
```

When invoked with `CALL`, the return value (if any) is placed in the special variable `RESULT`:

```rexx
CALL square 7
SAY RESULT             /* 49 */
EXIT

square:
    PARSE ARG n
    RETURN n * n
```

### 7.2 Internal Functions

The same label can be invoked as a function (in an expression) instead of with `CALL`. The only difference is syntax; the behavior is identical:

```rexx
/* As a CALL */
CALL square 7
answer = RESULT

/* As a function */
answer = square(7)

/* In an expression */
SAY 'The area is' square(side) 'square units.'
EXIT

square: PROCEDURE
    PARSE ARG n
    RETURN n * n
```

### 7.3 PROCEDURE and PROCEDURE EXPOSE

By default, all variables are **global**. An internal subroutine can read and modify any variable. The `PROCEDURE` instruction creates a new, clean variable scope:

```rexx
x = 'global'

CALL demo
SAY x                  /* global -- unchanged because demo used PROCEDURE */
EXIT

demo: PROCEDURE
    x = 'local'        /* this is a LOCAL x */
    SAY x              /* local */
    RETURN
```

`PROCEDURE EXPOSE` selectively exposes specific variables from the caller's scope:

```rexx
total = 0
count = 0

CALL accumulate 10
CALL accumulate 20
CALL accumulate 30
SAY 'Total:' total     /* 60 */
SAY 'Count:' count     /* 3 */
EXIT

accumulate: PROCEDURE EXPOSE total count
    PARSE ARG value
    total = total + value
    count = count + 1
    RETURN
```

Exposing a stem exposes all compound variables under it:

```rexx
name. = ''
name.0 = 0

CALL addname 'Alice'
CALL addname 'Bob'
SAY name.0 'names loaded.'
SAY name.1 name.2
EXIT

addname: PROCEDURE EXPOSE name.
    PARSE ARG n
    i = name.0 + 1
    name.i = n
    name.0 = i
    RETURN
```

### 7.4 ARG() Function

`ARG()` provides introspection on arguments passed to the current routine:

```rexx
CALL demo 'Alice', , 'Carol'    /* 3 arguments, 2nd is omitted */

demo:
    SAY ARG()              /* 3 -- number of arguments */
    SAY ARG(1)             /* Alice */
    SAY ARG(2)             /* (empty string) */
    SAY ARG(3)             /* Carol */
    SAY ARG(1, 'E')        /* 1 (Exists -- argument 1 was provided) */
    SAY ARG(2, 'E')        /* 0 (argument 2 was omitted) */
    SAY ARG(2, 'O')        /* 1 (Omitted -- argument 2 was omitted) */
    RETURN
```

### 7.5 External Subroutines and Function Packages

When REXX encounters a function call or `CALL` to a name that is not a built-in and not an internal label, it searches externally:

**Search order:**
1. Internal labels in the current source
2. Built-in functions (LENGTH, SUBSTR, etc.)
3. External function libraries (ARexx: loaded via `ADDLIB()`)
4. External `.rexx` files on the search path

```rexx
/* External function in separate file: double.rexx */
/* File: double.rexx */
PARSE ARG n
RETURN n * 2

/* Main program */
SAY double(21)         /* 42 -- calls external double.rexx */
```

In ARexx, external function libraries are loaded explicitly:

```rexx
/* Load the rexxsupport.library for file I/O, etc. */
CALL ADDLIB('rexxsupport.library', 0, -30, 0)

/* Load a third-party library */
CALL ADDLIB('tritonrexx.library', 0, -30, 0)

/* Remove a library when done */
CALL REMLIB('tritonrexx.library')
```

### 7.6 Recursion

REXX supports recursion. Each `CALL` or function invocation gets its own set of local variables (if `PROCEDURE` is used) and its own `PARSE ARG` values:

```rexx
/* Factorial */
SAY factorial(20)
EXIT

factorial: PROCEDURE
    PARSE ARG n
    IF n <= 1 THEN RETURN 1
    RETURN n * factorial(n - 1)

/* Tower of Hanoi */
CALL hanoi 4, 'A', 'B', 'C'
EXIT

hanoi: PROCEDURE
    PARSE ARG n, source, auxiliary, target
    IF n = 0 THEN RETURN
    CALL hanoi n-1, source, target, auxiliary
    SAY 'Move disk' n 'from' source 'to' target
    CALL hanoi n-1, auxiliary, source, target
    RETURN

/* Quicksort on a stem array */
CALL quicksort 1, arr.0

quicksort: PROCEDURE EXPOSE arr.
    PARSE ARG lo, hi
    IF lo >= hi THEN RETURN
    pivot = arr.hi
    i = lo
    DO j = lo TO hi - 1
        IF arr.j <= pivot THEN DO
            /* swap arr.i and arr.j */
            temp = arr.i; arr.i = arr.j; arr.j = temp
            i = i + 1
        END
    END
    /* swap arr.i and arr.hi */
    temp = arr.i; arr.i = arr.hi; arr.hi = temp
    CALL quicksort lo, i - 1
    CALL quicksort i + 1, hi
    RETURN
```

---

## 8. The INTERPRET Instruction

`INTERPRET` takes a string, parses it as REXX source code, and executes it in the **current scope**. It is the most powerful and most dangerous feature of the language.

```rexx
/* Basic INTERPRET */
code = 'SAY "Hello from INTERPRET"'
INTERPRET code         /* Hello from INTERPRET */

/* Dynamic variable access */
varname = 'total'
INTERPRET varname '= 42'
SAY total              /* 42 */

/* Dynamic variable read */
varname = 'total'
INTERPRET 'value =' varname
SAY value              /* 42 */

/* Building expressions at runtime */
op = '+'
a = 10
b = 32
INTERPRET 'result = a' op 'b'
SAY result             /* 42 */

/* Building entire subroutines */
code = 'DO i = 1 TO 5; SAY i "*" i "=" i*i; END'
INTERPRET code
/* 1 * 1 = 1
   2 * 2 = 4
   3 * 3 = 9
   4 * 4 = 16
   5 * 5 = 25 */
```

### 8.1 INTERPRET Internals

`INTERPRET` performs a full parse-tokenize-execute cycle on the string at runtime. The interpreted code runs in the **same variable scope** as the INTERPRET instruction. This means it can:

- Read and modify all variables visible at the point of the INTERPRET
- Call internal and external subroutines
- Execute control structures (DO, IF, SELECT)
- Even execute nested INTERPRET instructions

```rexx
/* INTERPRET sees the caller's variables */
x = 10
INTERPRET 'x = x + 1'
SAY x                  /* 11 */

/* INTERPRET can define subroutines... sort of */
/* Actually, INTERPRET cannot create labels that persist. */
/* But it can call existing ones: */
INTERPRET 'CALL myproc'
EXIT

myproc:
    SAY 'Called from interpreted code!'
    RETURN
```

### 8.2 Dynamic Property Access Pattern

`INTERPRET` enables a pattern similar to Python's `getattr()` or JavaScript's bracket notation:

```rexx
/* Read a dynamically-named variable */
getvar: PROCEDURE
    PARSE ARG name
    INTERPRET 'return_val =' name
    RETURN return_val

/* Set a dynamically-named variable -- requires EXPOSE or global scope */
setvar:
    PARSE ARG name, val
    INTERPRET name '= val'
    RETURN

/* Usage */
color.1 = 'red'
color.2 = 'green'
color.3 = 'blue'

DO i = 1 TO 3
    varname = 'color.' || i
    INTERPRET 'SAY' varname
END
/* red, green, blue */
```

### 8.3 Security Implications

`INTERPRET` executes arbitrary code. If the string comes from user input, an external file, or a network source, it is a **code injection** vulnerability:

```rexx
/* DANGEROUS: user input fed to INTERPRET */
SAY 'Enter an expression:'
PARSE PULL expr
INTERPRET 'result =' expr      /* user could type: 1; CALL system("rm -rf /") */
SAY result

/* SAFER: validate input before interpreting */
SAY 'Enter a number:'
PARSE PULL num
IF DATATYPE(num, 'N') THEN
    INTERPRET 'result = num * 2'
ELSE
    SAY 'Invalid input.'
```

### 8.4 Performance Implications

Every `INTERPRET` call triggers a full parse-tokenize cycle. In a tight loop, this is catastrophically slow compared to pre-parsed code:

```rexx
/* SLOW: interpreting in a loop */
DO i = 1 TO 100000
    INTERPRET 'total = total + i'
END

/* FAST: just write the code directly */
DO i = 1 TO 100000
    total = total + i
END
```

There is no caching. Each INTERPRET parses the string from scratch, even if the same string is interpreted repeatedly.

### 8.5 Porting Implications

`INTERPRET` is the single hardest REXX feature to port. Options for implementers:

1. **Include a REXX parser in the runtime.** This is what REXX interpreters do. If you're building a REXX-compatible system, you need `eval()`.
2. **Restrict to known patterns.** Many real-world INTERPRET uses fall into a few patterns: dynamic variable access, dynamic expression evaluation, command dispatch. These can be handled with dictionaries and expression parsers.
3. **Refuse to port it.** Many compiled REXX derivatives (like NetRexx and Object REXX on JVM) restrict or redefine INTERPRET semantics.
4. **GPU context:** INTERPRET is fundamentally incompatible with GPU compute (no dynamic code generation on GPU). In a GPU porting scenario, all INTERPRET usage must be statically analyzed and converted to equivalent non-dynamic code.

---

## 9. Error Handling and Conditions

REXX uses a condition system based on `SIGNAL` and `CALL` traps. When a condition is raised, control transfers to a named label. This is not exception handling in the try/catch sense; it is closer to a non-local goto (for SIGNAL) or an interrupt callback (for CALL).

### 9.1 Condition Types

| Condition | Raised When |
|---|---|
| `ERROR` | A host command returns a non-zero return code |
| `FAILURE` | A host command fails completely (command not found) |
| `HALT` | External interrupt (user pressed Ctrl+C, or AREXX BREAK) |
| `NOVALUE` | An uninitialized variable is used (only if trap is ON) |
| `NOTREADY` | An I/O operation fails or stream is not ready |
| `SYNTAX` | A syntax or runtime error occurs |
| `LOSTDIGITS` | Arithmetic operation loses significant digits (rarely used) |

### 9.2 SIGNAL ON / OFF

```rexx
/* Enable error trapping */
SIGNAL ON SYNTAX NAME syntax_handler
SIGNAL ON NOVALUE NAME novalue_handler
SIGNAL ON ERROR NAME error_handler
SIGNAL ON HALT NAME halt_handler

/* Normal code */
SAY 'Starting...'
x = 1 / 0             /* triggers SYNTAX condition */
SAY 'This line never executes.'
EXIT

syntax_handler:
    SAY 'SYNTAX ERROR' rc 'at line' sigl
    SAY 'Error message:' ERRORTEXT(rc)
    SAY 'Condition info:' CONDITION('D')
    EXIT 1

novalue_handler:
    SAY 'Uninitialized variable used at line' sigl
    SAY 'Variable:' CONDITION('D')
    EXIT 1

error_handler:
    SAY 'Command error at line' sigl 'rc=' rc
    EXIT 1

halt_handler:
    SAY 'Program interrupted at line' sigl
    EXIT 1
```

### 9.3 Special Variables in Error Handlers

| Variable | Meaning |
|---|---|
| `RC` | Return code from the last command, or SYNTAX error number |
| `SIGL` | Line number where the condition was raised |
| `RESULT` | Return value from the last CALL (not error-specific, but preserved) |

```rexx
SIGNAL ON SYNTAX NAME handler
NUMERIC DIGITS 3
x = 10000000000        /* no error, just stored as "1.00E+10" */
y = 'abc' + 1          /* SYNTAX error: bad arithmetic conversion */
EXIT

handler:
    SAY 'Error' rc 'at line' sigl
    SAY ERRORTEXT(rc)
    SAY 'Condition name:' CONDITION('C')    /* SYNTAX */
    SAY 'Description:' CONDITION('D')       /* detail */
    SAY 'Instruction:' CONDITION('I')       /* SIGNAL or CALL */
    SAY 'State:' CONDITION('S')             /* ON or OFF */
    EXIT rc
```

### 9.4 SIGNAL vs CALL for Error Handling

`SIGNAL ON` transfers control via a non-local goto. All active DO loops, IF blocks, and SELECT blocks are **terminated**. You cannot resume execution after a SIGNAL.

`CALL ON` (where supported) transfers control like a subroutine call. The handler can RETURN and execution continues after the point where the condition was raised. Not all conditions support CALL ON -- only ERROR, FAILURE, HALT, and NOTREADY.

```rexx
/* CALL ON -- handler can RETURN */
CALL ON ERROR NAME cmd_error

ADDRESS SYSTEM 'nonexistent_command'     /* triggers ERROR */
SAY 'Continuing after error...'          /* this DOES execute with CALL ON */
EXIT

cmd_error:
    SAY 'Command failed with rc' rc 'at line' sigl
    RETURN    /* resume after the failing command */
```

```rexx
/* SIGNAL ON -- no resume */
SIGNAL ON ERROR NAME cmd_error

ADDRESS SYSTEM 'nonexistent_command'
SAY 'This will NOT execute'              /* never reached */
EXIT

cmd_error:
    SAY 'Command failed at line' sigl
    EXIT 1   /* must exit, cannot resume */
```

### 9.5 The NOVALUE Condition

By default, REXX silently uses the variable name (uppercase) as the value of uninitialized variables. This is a notorious source of bugs. `SIGNAL ON NOVALUE` catches these:

```rexx
SIGNAL ON NOVALUE NAME catch_novalue

username = 'Alice'
SAY username           /* Alice */
SAY usrname            /* triggers NOVALUE -- typo! */
EXIT

catch_novalue:
    SAY 'Undefined variable at line' sigl
    SAY 'Variable name:' CONDITION('D')
    EXIT 1
```

This is one of the most important defensive coding practices in REXX. Production code should almost always enable `SIGNAL ON NOVALUE`.

### 9.6 Error Codes Reference

Selected REXX error codes (via `ERRORTEXT(n)`):

| Code | Message |
|---|---|
| 4 | Program interrupted (HALT) |
| 5 | Machine resources exhausted |
| 6 | Unmatched `/*` in comment |
| 7 | WHEN or OTHERWISE expected |
| 8 | Unexpected THEN or ELSE |
| 9 | Unexpected WHEN or OTHERWISE |
| 10 | Unexpected END |
| 13 | Invalid character in program |
| 14 | Incomplete DO/IF/SELECT |
| 15 | Invalid hexadecimal or binary string |
| 16 | Label not found |
| 17 | Unexpected PROCEDURE |
| 18 | THEN expected |
| 19 | String or symbol expected |
| 20 | Symbol expected |
| 24 | Invalid TRACE request |
| 25 | Invalid sub-keyword found |
| 26 | Invalid whole number |
| 35 | Invalid expression |
| 40 | Incorrect call to routine |
| 41 | Bad arithmetic conversion |
| 42 | Arithmetic overflow/underflow |
| 44 | Invalid STEM reference |
| 48 | Failure in system service |
| 49 | Interpretation error |

---

## 10. ARexx-Specific Extensions

ARexx (Amiga REXX, by William Hawes, 1987) is a full SAA-compatible REXX implementation with extensions for inter-process communication on the Amiga. The key innovation was the **host command interface** -- any Amiga application could open an ARexx port and receive commands from ARexx scripts.

### 10.1 ADDRESS: The Host Command Interface

The `ADDRESS` instruction selects which application receives commands:

```rexx
/* Direct commands to different hosts */
ADDRESS 'IMAGEFX'           /* all subsequent commands go to ImageFX */
'LoadBuffer RAM:photo.jpg'  /* sent to ImageFX */
'EdgeDetect'                /* sent to ImageFX */
'SaveBufferAs RAM:edges.jpg JPEG'

ADDRESS 'DOPUS.1'           /* switch to Directory Opus */
'Lister New'                /* sent to Directory Opus */
'Lister Set 0 Path RAM:'

ADDRESS 'COMMAND'           /* switch back to AmigaDOS shell */
'Copy RAM:edges.jpg WORK:output/'

/* Single-command addressing */
ADDRESS 'IMAGEFX' 'LoadBuffer RAM:photo.jpg'
/* This sends one command, then the previous default host is restored */
```

The `ADDRESS()` function returns the current default host:

```rexx
SAY ADDRESS()              /* REXX (the default, or whatever was set) */
ADDRESS 'IMAGEFX'
SAY ADDRESS()              /* IMAGEFX */
```

### 10.2 How Host Commands Work

When REXX encounters a string expression that is not an assignment and not a keyword instruction, it treats it as a **host command**. The string is sent to the current default host (set by ADDRESS).

```rexx
/* These are host commands, NOT REXX instructions */
ADDRESS COMMAND
'echo Hello World'          /* sent to AmigaDOS CLI */
'dir RAM:'                  /* sent to AmigaDOS CLI */
'makedir RAM:newdir'        /* sent to AmigaDOS CLI */

/* The RC variable receives the return code from the host */
ADDRESS COMMAND
'copy source dest'
IF rc \= 0 THEN SAY 'Copy failed with rc' rc
```

On non-Amiga REXX implementations (OS/2, Regina, ooRexx), the concept is the same but the hosts differ:

```rexx
/* OS/2 REXX */
ADDRESS CMD 'dir /w'

/* Regina REXX on Unix */
ADDRESS SYSTEM 'ls -la'
```

### 10.3 Port Enumeration and Management

ARexx provides functions to discover and interact with application ports:

```rexx
/* SHOW('P') -- list all public ARexx ports */
ports = SHOW('P')
SAY ports              /* REXX IMAGEFX DOPUS.1 GOLDED.1 ... */

/* Check if a specific port exists */
IF SHOW('P', 'IMAGEFX') THEN
    SAY 'ImageFX is running.'
ELSE
    SAY 'ImageFX is not running.'

/* Wait for a port to appear */
DO WHILE ~SHOW('P', 'IMAGEFX')
    CALL DELAY 50      /* wait ~1 second (50 ticks) */
END
SAY 'ImageFX is now ready.'
ADDRESS 'IMAGEFX'
```

### 10.4 Function Libraries

ARexx's `ADDLIB()` loads external function libraries (Amiga shared libraries that export REXX-callable functions):

```rexx
/* Load the standard support library */
IF ~SHOW('L', 'rexxsupport.library') THEN
    CALL ADDLIB('rexxsupport.library', 0, -30, 0)

/* Parameters: library name, priority, offset, version */
/* Priority: search order (higher = checked first) */
/* Offset: entry point in library (-30 is standard for REXX libs) */
/* Version: minimum version required (0 = any) */

/* rexxsupport.library provides: */
/* File I/O: OPEN(), CLOSE(), READLN(), WRITELN(), READCH(), WRITECH(), EOF(), SEEK() */
/* System: DELAY(), GETCLIP(), SETCLIP(), SHOWLIST(), ALLOCMEM(), FREEMEM() */
/* Misc: COMPRESS(), HASH(), RANDU(), TRIM(), UPPER() */
```

Common ARexx function libraries on the Amiga:

| Library | Purpose |
|---|---|
| `rexxsupport.library` | Standard file I/O, system functions, clipboard |
| `rexxmathlib.library` | Trigonometric and transcendental functions |
| `tritonrexx.library` | GUI creation (Triton toolkit) |
| `rexxreqtools.library` | System requesters (file, font, color dialogs) |
| `rxsocket.library` | TCP/IP networking |
| `rexxarplib.library` | Early GUI and system functions (superseded) |

```rexx
/* Load math library for trig functions */
CALL ADDLIB('rexxmathlib.library', 0, -30, 0)

pi = 3.14159265358979323846
SAY 'sin(pi/4) =' SIN(pi / 4)     /* 0.707106781 */
SAY 'cos(0) =' COS(0)              /* 1 */
SAY 'sqrt(2) =' SQRT(2)            /* 1.41421356 */
SAY 'log(e) =' LN(EXP(1))         /* 1 */

/* Remove library when done */
CALL REMLIB('rexxmathlib.library')
```

### 10.5 Clipboard Access

ARexx provides clipboard access through the clip list, a named key-value store in the REXX resident process:

```rexx
/* Set a clip (persistent across scripts) */
CALL SETCLIP('mydata', 'Hello from ARexx')

/* Get a clip */
data = GETCLIP('mydata')
SAY data                       /* Hello from ARexx */

/* List all clips */
SAY SHOWLIST('C')              /* mydata ... */

/* Check if a clip exists */
IF SHOWLIST('C', 'mydata') THEN
    SAY 'Clip exists:' GETCLIP('mydata')
```

Clips persist as long as the ARexx resident process (`RexxMast`) is running. They provide a simple shared-memory IPC mechanism between scripts.

### 10.6 Resource Tracking

ARexx tracks resources (memory allocations, file handles, library references) and automatically cleans up when a script terminates. This was important on the Amiga, where there was no memory protection:

```rexx
/* ARexx automatically closes files left open */
CALL OPEN('myfile', 'RAM:temp.txt', 'W')
CALL WRITELN 'myfile', 'Some data'
/* If the script exits without CLOSE(), ARexx closes it automatically */
EXIT
```

---

## 11. Advanced Patterns

### 11.1 Data Structures with Stems

Since stems are REXX's only structured data type, all data structures must be built from them.

**Stack (LIFO):**

```rexx
/* Stack implementation using stems */
stack. = ''
stack.0 = 0           /* stack depth */

/* Push */
push: PROCEDURE EXPOSE stack.
    PARSE ARG value
    n = stack.0 + 1
    stack.n = value
    stack.0 = n
    RETURN

/* Pop */
pop: PROCEDURE EXPOSE stack.
    IF stack.0 = 0 THEN RETURN ''    /* underflow */
    n = stack.0
    value = stack.n
    stack.0 = n - 1
    RETURN value

/* Peek */
peek: PROCEDURE EXPOSE stack.
    IF stack.0 = 0 THEN RETURN ''
    RETURN stack.stack.0

/* Usage */
CALL push 'alpha'
CALL push 'beta'
CALL push 'gamma'
SAY pop()              /* gamma */
SAY pop()              /* beta */
SAY peek()             /* alpha */
SAY pop()              /* alpha */
```

**Queue (FIFO):**

```rexx
/* Queue with head and tail pointers */
q. = ''
q.head = 1
q.tail = 0

enqueue: PROCEDURE EXPOSE q.
    PARSE ARG value
    q.tail = q.tail + 1
    n = q.tail
    q.n = value
    RETURN

dequeue: PROCEDURE EXPOSE q.
    IF q.head > q.tail THEN RETURN ''   /* empty */
    n = q.head
    value = q.n
    q.head = q.head + 1
    RETURN value

qsize: PROCEDURE EXPOSE q.
    IF q.tail < q.head THEN RETURN 0
    RETURN q.tail - q.head + 1

/* Usage */
CALL enqueue 'first'
CALL enqueue 'second'
CALL enqueue 'third'
SAY dequeue()          /* first */
SAY dequeue()          /* second */
SAY qsize()            /* 1 */
```

**Linked list:**

```rexx
/* Singly linked list using stems */
node. = ''
node.0 = 0            /* next available node ID */
list_head = 0         /* 0 means null/empty */

/* Allocate a new node */
alloc_node: PROCEDURE EXPOSE node.
    node.0 = node.0 + 1
    id = node.0
    node.id.data = ''
    node.id.next = 0
    RETURN id

/* Prepend to list */
prepend: PROCEDURE EXPOSE node. list_head
    PARSE ARG value
    id = alloc_node()
    node.id.data = value
    node.id.next = list_head
    list_head = id
    RETURN

/* Traverse */
print_list: PROCEDURE EXPOSE node. list_head
    current = list_head
    DO WHILE current \= 0
        SAY node.current.data
        current = node.current.next
    END
    RETURN

/* Usage */
CALL prepend 'Carol'
CALL prepend 'Bob'
CALL prepend 'Alice'
CALL print_list
/* Alice
   Bob
   Carol */
```

**Binary tree:**

```rexx
/* Binary search tree */
tree. = ''
tree.0 = 0           /* node counter */

/* Insert into BST */
bst_insert: PROCEDURE EXPOSE tree.
    PARSE ARG root, value
    IF root = 0 THEN DO
        tree.0 = tree.0 + 1
        id = tree.0
        tree.id.val = value
        tree.id.left = 0
        tree.id.right = 0
        RETURN id
    END
    IF value < tree.root.val THEN
        tree.root.left = bst_insert(tree.root.left, value)
    ELSE
        tree.root.right = bst_insert(tree.root.right, value)
    RETURN root

/* In-order traversal */
inorder: PROCEDURE EXPOSE tree.
    PARSE ARG node
    IF node = 0 THEN RETURN
    CALL inorder tree.node.left
    SAY tree.node.val
    CALL inorder tree.node.right
    RETURN

/* Usage */
root = 0
root = bst_insert(root, 50)
root = bst_insert(root, 30)
root = bst_insert(root, 70)
root = bst_insert(root, 20)
root = bst_insert(root, 40)
root = bst_insert(root, 60)
root = bst_insert(root, 80)
CALL inorder root
/* 20, 30, 40, 50, 60, 70, 80 */
```

**Hash table (using REXX's built-in stem lookup):**

```rexx
/* Stems ARE hash tables. This is the native data structure. */
dict. = ''             /* default: empty string means "not found" */

dict.name = 'Alice'
dict.age = 25
dict.city = 'Seattle'

SAY dict.name          /* Alice */
SAY dict.age           /* 25 */

/* Case-insensitive keys (REXX uppercases tail variables) */
key = 'name'
SAY dict.key           /* Alice -- key resolves to 'NAME', which matches dict.NAME */

/* To use arbitrary string keys, hash them or use TRANSLATE to sanitize */
safe_key = TRANSLATE(SPACE(original_key, 0), '_', '!@#$%^&*()-+=')
```

### 11.2 Recursive Descent Parsing with PARSE

PARSE can be used as a building block for simple recursive descent parsers:

```rexx
/* Simple arithmetic expression parser: handles +, -, *, /, parentheses */
/* Grammar:
   expr   -> term (('+' | '-') term)*
   term   -> factor (('*' | '/') factor)*
   factor -> NUMBER | '(' expr ')'
*/

expression = '(2 + 3) * (4 - 1) + 10 / 2'
pos = 1

SAY 'Result:' parse_expr()
EXIT

parse_expr: PROCEDURE EXPOSE expression pos
    result = parse_term()
    DO WHILE pos <= LENGTH(expression)
        CALL skip_spaces
        ch = SUBSTR(expression, pos, 1)
        IF ch = '+' THEN DO
            pos = pos + 1
            result = result + parse_term()
        END
        ELSE IF ch = '-' THEN DO
            pos = pos + 1
            result = result - parse_term()
        END
        ELSE LEAVE
    END
    RETURN result

parse_term: PROCEDURE EXPOSE expression pos
    result = parse_factor()
    DO WHILE pos <= LENGTH(expression)
        CALL skip_spaces
        ch = SUBSTR(expression, pos, 1)
        IF ch = '*' THEN DO
            pos = pos + 1
            result = result * parse_factor()
        END
        ELSE IF ch = '/' THEN DO
            pos = pos + 1
            result = result / parse_factor()
        END
        ELSE LEAVE
    END
    RETURN result

parse_factor: PROCEDURE EXPOSE expression pos
    CALL skip_spaces
    ch = SUBSTR(expression, pos, 1)
    IF ch = '(' THEN DO
        pos = pos + 1
        result = parse_expr()
        CALL skip_spaces
        pos = pos + 1             /* skip ')' */
        RETURN result
    END
    /* Parse number */
    start = pos
    DO WHILE pos <= LENGTH(expression)
        ch = SUBSTR(expression, pos, 1)
        IF DATATYPE(ch, 'N') | ch = '.' THEN pos = pos + 1
        ELSE LEAVE
    END
    RETURN SUBSTR(expression, start, pos - start) + 0

skip_spaces: PROCEDURE EXPOSE expression pos
    DO WHILE pos <= LENGTH(expression) & SUBSTR(expression, pos, 1) = ' '
        pos = pos + 1
    END
    RETURN
```

### 11.3 Complete ARexx Application Scripts

**ImageFX Batch Processing Script:**

```rexx
/* ImageFX batch image processor
   Processes all JPEG files in a directory:
   - Load each image
   - Apply edge detect
   - Resize to 50%
   - Save as PNG to output directory
*/

OPTIONS RESULTS                /* tell host to return results */

/* Check that ImageFX is running */
IF ~SHOW('P', 'IMAGEFX') THEN DO
    SAY 'Error: ImageFX is not running.'
    EXIT 10
END

ADDRESS 'IMAGEFX'

indir = 'WORK:photos/'
outdir = 'WORK:processed/'

/* Ask AmigaDOS to create output dir */
ADDRESS COMMAND 'makedir' outdir

/* Process each file */
ADDRESS COMMAND 'list' indir 'PAT=#?.jpg LFORMAT="%s" TO RAM:filelist'

IF ~OPEN('flist', 'RAM:filelist', 'R') THEN DO
    SAY 'No files found.'
    EXIT 5
END

count = 0
DO WHILE ~EOF('flist')
    filename = READLN('flist')
    IF filename = '' THEN ITERATE

    SAY 'Processing:' filename

    /* Send commands to ImageFX */
    ADDRESS 'IMAGEFX'
    'LoadBuffer' indir || filename
    IF rc ~= 0 THEN DO
        SAY '  Load failed, skipping.'
        ITERATE
    END

    'EdgeDetect'

    /* Get current dimensions */
    'GetMain'
    PARSE VAR result width height depth .
    new_w = width % 2
    new_h = height % 2
    'Scale' new_w new_h

    /* Build output filename: change .jpg to .png */
    PARSE VAR filename basename '.' .
    outname = outdir || basename || '.png'

    'SaveBufferAs' outname 'PNG'
    IF rc = 0 THEN DO
        count = count + 1
        SAY '  Saved:' outname
    END
    ELSE
        SAY '  Save failed!'
END

CALL CLOSE 'flist'
SAY 'Processed' count 'images.'
EXIT 0
```

**Directory Opus Button Script:**

```rexx
/* DOpus 5 ARexx script: Find duplicate files by size and name
   Attach to a DOpus button or run from the ARexx menu.
*/

OPTIONS RESULTS
ADDRESS 'DOPUS.1'

/* Get the path of the active lister */
'Lister Query Active'
IF rc ~= 0 THEN DO
    'Request "Select a lister first." "OK"'
    EXIT 5
END
active_lister = result

'Lister Query' active_lister 'Path'
scan_path = result

'Lister Set' active_lister 'Title "Scanning for duplicates..."'
'Lister Set' active_lister 'Busy On'

/* Read all entries */
'Lister Query' active_lister 'NumEntries'
total = result

file. = ''
size. = ''
count = 0

DO i = 0 TO total - 1
    'Lister Query' active_lister 'Entry #'i
    PARSE VAR result '"' name '"' fsize .
    count = count + 1
    file.count = name
    size.count = fsize
END
file.0 = count

/* Find duplicates (same size) */
dupes = 0
DO i = 1 TO file.0
    DO j = i + 1 TO file.0
        IF size.i = size.j & size.i > 0 THEN DO
            IF dupes = 0 THEN
                SAY 'Potential duplicates (same size):'
            dupes = dupes + 1
            SAY '  ' file.i '(' size.i 'bytes) <-> ' file.j
            /* Select the file in the lister */
            'Lister Select' active_lister '"'file.j'" On'
        END
    END
END

'Lister Set' active_lister 'Busy Off'
'Lister Refresh' active_lister

IF dupes = 0 THEN
    'Request "No duplicates found." "OK"'
ELSE
    'Request "Found' dupes 'potential duplicate pairs.\nDuplicates are now selected." "OK"'

EXIT 0
```

**GoldEd Text Editor Macro:**

```rexx
/* GoldEd ARexx macro: Word count and reading time estimator */

OPTIONS RESULTS
ADDRESS 'GOLDED.1'

/* Get the current document */
'QUERY DOC'
docname = result

/* Lock the document for reading */
'LOCK CURRENT'

/* Count words, lines, characters */
'QUERY LINES'
total_lines = result

words = 0
chars = 0
sentences = 0

DO i = 1 TO total_lines
    'QUERY LINE' i
    line = result
    chars = chars + LENGTH(line)
    words = words + WORDS(line)

    /* Count sentence-ending punctuation */
    DO j = 1 TO LENGTH(line)
        ch = SUBSTR(line, j, 1)
        IF POS(ch, '.!?') > 0 THEN sentences = sentences + 1
    END
END

'UNLOCK CURRENT'

/* Calculate reading time (avg 250 words/minute) */
minutes = words % 250
seconds = ((words // 250) * 60) % 250

/* Calculate Flesch-Kincaid grade level approximation */
IF sentences > 0 & words > 0 THEN DO
    avg_sentence = words / sentences
    /* Rough syllable estimate: chars/words * 0.4 */
    avg_syllables = (chars / words) * 0.4
    fk_grade = FORMAT(0.39 * avg_sentence + 11.8 * avg_syllables - 15.59, 3, 1)
END
ELSE
    fk_grade = 'N/A'

/* Display results */
msg = docname || '\n\n'
msg = msg || 'Lines:      ' || total_lines || '\n'
msg = msg || 'Words:      ' || words || '\n'
msg = msg || 'Characters: ' || chars || '\n'
msg = msg || 'Sentences:  ' || sentences || '\n\n'
msg = msg || 'Reading time: ~' || minutes || 'm ' || seconds || 's\n'
msg = msg || 'FK Grade Level: ' || fk_grade

'REQUEST BODY="' || msg || '" TITLE="Document Stats" OKAY'
EXIT 0
```

### 11.4 Complete Utility: INI File Parser

```rexx
/* Parse a Windows/Amiga-style INI file into stems
   Usage: CALL parse_ini 'config.ini'
          SAY ini.section.key
*/

PARSE ARG inifile
IF inifile = '' THEN DO
    SAY 'Usage: ini_parser <filename>'
    EXIT 1
END

SIGNAL ON NOVALUE NAME novalue_err

ini. = ''
section_list = ''
current_section = 'DEFAULT'

DO WHILE LINES(inifile) > 0
    line = STRIP(LINEIN(inifile))

    /* Skip empty lines and comments */
    IF line = '' THEN ITERATE
    IF LEFT(line, 1) = ';' THEN ITERATE
    IF LEFT(line, 1) = '#' THEN ITERATE

    /* Section header */
    IF LEFT(line, 1) = '[' THEN DO
        PARSE VAR line '[' current_section ']'
        current_section = STRIP(TRANSLATE(current_section))   /* uppercase */
        IF WORDPOS(current_section, section_list) = 0 THEN
            section_list = section_list current_section
        ITERATE
    END

    /* Key=value pair */
    PARSE VAR line key '=' value
    key = STRIP(TRANSLATE(key))                               /* uppercase */
    value = STRIP(value)

    /* Remove inline comments */
    comment_pos = POS(' ;', value)
    IF comment_pos > 0 THEN
        value = STRIP(LEFT(value, comment_pos - 1))

    /* Remove surrounding quotes */
    IF LEFT(value, 1) = '"' & RIGHT(value, 1) = '"' THEN
        value = SUBSTR(value, 2, LENGTH(value) - 2)

    /* Store in stem: ini.SECTION.KEY = value */
    ini.current_section.key = value

    /* Track keys per section */
    keylist_var = 'ini.'current_section'.0KEYS'
    INTERPRET keylist_var '=' keylist_var key
END

/* Display parsed results */
SAY 'Sections:' section_list
DO i = 1 TO WORDS(section_list)
    sect = WORD(section_list, i)
    SAY ''
    SAY '['sect']'
    INTERPRET 'keys = ini.'sect'.0KEYS'
    DO j = 1 TO WORDS(keys)
        k = WORD(keys, j)
        INTERPRET 'val = ini.'sect'.'k
        SAY '  'k '=' val
    END
END

EXIT 0

novalue_err:
    SAY 'Uninitialized variable at line' sigl':' CONDITION('D')
    EXIT 1
```

### 11.5 Complete Utility: HTTP Client (ARexx + rxsocket.library)

```rexx
/* Simple HTTP/1.0 GET client for ARexx using rxsocket.library */

CALL ADDLIB('rxsocket.library', 0, -30, 0)
CALL ADDLIB('rexxsupport.library', 0, -30, 0)

PARSE ARG url
IF url = '' THEN DO
    SAY 'Usage: httpget <url>'
    SAY 'Example: httpget http://www.example.com/'
    EXIT 1
END

/* Parse the URL */
PARSE VAR url 'http://' hostpath
PARSE VAR hostpath host '/' path
IF path = '' THEN path = ''
port = 80

/* Check for port in host */
IF POS(':', host) > 0 THEN
    PARSE VAR host host ':' port

/* Resolve hostname */
hostent = GETHOSTBYNAME(host)
IF hostent = '' THEN DO
    SAY 'Cannot resolve:' host
    EXIT 5
END
PARSE VAR hostent hostname . ipaddr .

/* Create socket */
sock = SOCKET('INET', 'STREAM', 'TCP')
IF sock < 0 THEN DO
    SAY 'Socket creation failed.'
    EXIT 10
END

/* Connect */
sin.family = 'INET'
sin.port = port
sin.addr = ipaddr

IF CONNECT(sock, 'sin') ~= 0 THEN DO
    SAY 'Connection failed to' host':'port
    CALL CLOSECONNECTION sock
    EXIT 10
END

/* Send HTTP request */
crlf = D2C(13) || D2C(10)
request = 'GET /' || path || ' HTTP/1.0' || crlf
request = request || 'Host: ' || host || crlf
request = request || 'User-Agent: ARexx-HTTP/1.0' || crlf
request = request || 'Connection: close' || crlf
request = request || crlf

CALL SEND sock, request

/* Read response */
response = ''
DO FOREVER
    chunk = RECV(sock, 4096)
    IF LENGTH(chunk) = 0 THEN LEAVE
    response = response || chunk
END

CALL CLOSECONNECTION sock

/* Split headers and body */
header_end = POS(crlf || crlf, response)
IF header_end > 0 THEN DO
    headers = LEFT(response, header_end - 1)
    body = SUBSTR(response, header_end + 4)
END
ELSE DO
    headers = response
    body = ''
END

/* Parse status line */
PARSE VAR headers status_line (crlf) rest_headers
PARSE VAR status_line . status_code status_text
SAY 'HTTP Status:' status_code status_text
SAY 'Body length:' LENGTH(body)
SAY ''
SAY body

EXIT 0

CLOSECONNECTION:
    PARSE ARG s
    CALL SHUTDOWN s, 2
    CALL CLOSESOCKET s
    RETURN
```

---

## 12. The TRACE Instruction

`TRACE` is REXX's built-in debugger. It controls what the interpreter displays as it executes:

```rexx
TRACE ALL                /* trace all clauses */
TRACE RESULTS            /* trace clauses that produce results */
TRACE INTERMEDIATES      /* trace intermediate expression values */
TRACE COMMANDS           /* trace host commands */
TRACE ERRORS             /* trace only errors (default) */
TRACE OFF                /* disable tracing */

/* Interactive tracing */
TRACE ?ALL               /* ? prefix = interactive mode (pause after each) */
```

### 12.1 TRACE INTERMEDIATES Example

```rexx
TRACE I                  /* shorthand for INTERMEDIATES */
x = 3
y = x + 2 * (x - 1)

/* Output:
   3 *-* x = 3
     >L> "3"
   4 *-* y = x + 2 * (x - 1)
     >V> "3"            -- value of x
     >L> "2"            -- literal 2
     >V> "3"            -- value of x
     >L> "1"            -- literal 1
     >O> "2"            -- x - 1
     >O> "4"            -- 2 * 2
     >O> "7"            -- 3 + 4
     >=> "7"            -- assigned to y
*/
```

Trace prefix meanings:

| Prefix | Meaning |
|---|---|
| `*-*` | Source line being executed |
| `>L>` | Literal value |
| `>V>` | Variable value |
| `>O>` | Operation result |
| `>=>` | Final result (assignment, SAY argument, etc.) |
| `>C>` | Compound variable tail |
| `>F>` | Function result |
| `+++` | Error message |

### 12.2 Interactive Tracing

With `TRACE ?` prefix, the interpreter pauses after each traced clause and waits for input:

- **Enter** -- continue to next clause
- **=** -- re-execute the current clause
- A REXX expression -- evaluate and display the expression (for inspecting variables)
- `TRACE OFF` -- turn off tracing and continue

This is a complete interactive debugger built into the language itself. No external tools needed.

---

## 13. The OPTIONS Instruction (ARexx)

ARexx extends the standard `OPTIONS` instruction with additional settings:

```rexx
OPTIONS RESULTS           /* tell host commands to return results in RESULT */
OPTIONS FAILAT n          /* set the RC threshold that triggers FAILURE condition */
OPTIONS PROMPT 'cmd> '    /* change the interactive prompt */
```

`OPTIONS RESULTS` is critical for ARexx host command scripting. Without it, host applications do not return values:

```rexx
OPTIONS RESULTS
ADDRESS 'IMAGEFX'
'GetMain'
SAY RESULT               /* "640 480 24" -- width, height, depth */

/* Without OPTIONS RESULTS, RESULT would be empty */
```

---

## 14. Standard Compliance and Implementation Differences

### 14.1 REXX Standards

| Standard | Year | Key Features |
|---|---|
| SAA Level 2 | 1990 | IBM SAA Procedures Language Level 2. The baseline. |
| ANSI X3.274 | 1996 | American National Standard for REXX. Added CHANGESTR, COUNTSTR, stream I/O standardization. |
| TRL (The REXX Language) | 1990 | Mike Cowlishaw's book. The de facto spec before ANSI. |
| TRL-2 | 1996 | Second edition, aligns with ANSI. |

### 14.2 Implementation Comparison

| Feature | ARexx | Regina | ooRexx | NetRexx | OS/2 REXX |
|---|---|---|---|---|---|
| Base standard | SAA Level 2 | ANSI + extensions | ANSI + OO | REXX-like on JVM | SAA + extensions |
| NUMERIC DIGITS max | ~1000 | Unlimited | Unlimited | Java BigDecimal | ~999999999 |
| Stream I/O | No (uses libs) | Yes | Yes | Java I/O | Yes |
| INTERPRET | Yes | Yes | Yes | No (security) | Yes |
| ADDRESS | Yes (IPC) | Yes (shell) | Yes | N/A | Yes |
| Object-oriented | No | No | Yes | Yes | No |
| CHANGESTR/COUNTSTR | No | Yes | Yes | Yes | No (pre-ANSI) |
| PARSE VALUE...WITH | Yes | Yes | Yes | Yes | Yes |

### 14.3 ARexx-Specific Deviations

ARexx predates the ANSI standard and has several differences from standard REXX:

1. **No stream I/O.** ARexx uses `OPEN/CLOSE/READLN/WRITELN` from `rexxsupport.library` instead of `LINEIN/LINEOUT/LINES`.
2. **`UPPER` as standalone instruction.** ARexx has `UPPER varname` which uppercases a variable in place. Standard REXX only has `PARSE UPPER`.
3. **`STORAGE()` function.** Returns/modifies memory at an absolute address. Amiga-specific, dangerous.
4. **`SHOW()` function.** Lists system resources (ports, libraries, devices, clips). ARexx-specific.
5. **`DELAY()` function.** Waits for the specified number of 1/50th-second ticks.
6. **`COMPRESS()` function.** Removes characters from a string (not data compression). `COMPRESS(' Hello World ') -> 'HelloWorld'`.
7. **`TRIM()` function.** Removes trailing blanks. Standard REXX uses `STRIP(s,'T')`.
8. **`HASH()` function.** Returns a hash value for a string.
9. **Boolean operators:** ARexx uses `~` as NOT prefix (in addition to `\`). `~SHOW('P','IMAGEFX')` means "NOT SHOW(...)".
10. **Bit operations:** `BITAND()`, `BITOR()`, `BITXOR()`, `BITCOMP()`, `BITCHG()`, `BITTST()`, `BITSET()`, `BITCLR()` operate on raw character strings as bit vectors.

```rexx
/* ARexx bit operations */
a = 'FF'x              /* hex FF = binary 11111111 */
b = '0F'x              /* hex 0F = binary 00001111 */
SAY C2X(BITAND(a, b))  /* 0F */
SAY C2X(BITOR(a, b))   /* FF */
SAY C2X(BITXOR(a, b))  /* F0 */
```

---

## 15. Idioms and Patterns for Porters

### 15.1 Common REXX Idioms

```rexx
/* Initialize a counter */
count = 0                      /* not: int count = 0; */

/* Conditional assignment */
status = WORD('inactive active', flag + 1)
/* If flag=0: WORD('inactive active', 1) = 'inactive'
   If flag=1: WORD('inactive active', 2) = 'active' */

/* Ternary expression (no ternary operator, use this idiom) */
label = 'Item' || COPIES('s', (count > 1))
/* count=1: 'Item'  count=5: 'Items' */

/* String membership test */
IF WORDPOS(color, 'red green blue') > 0 THEN SAY 'Primary'

/* Trim and normalize */
clean = SPACE(STRIP(raw_input))    /* strip edges, normalize internal spaces */

/* Type checking */
IF DATATYPE(input, 'W') THEN SAY 'Whole number'
IF DATATYPE(input, 'N') THEN SAY 'Any number'
IF DATATYPE(input, 'A') THEN SAY 'Alphanumeric'

/* Quick string repeat for formatting */
SAY COPIES('=', 60)               /* ============================================ */
SAY CENTER(' Report Title ', 60, '=')  /* ===================== Report Title ==================== */

/* Integer test without DATATYPE */
IF number = TRUNC(number) THEN SAY 'Integer'

/* Swap two variables */
PARSE VALUE a b WITH b a

/* Read entire stdin */
input = ''
DO WHILE LINES() > 0
    input = input || LINEIN() || '0A'x
END

/* Time a block of code */
CALL TIME 'R'               /* reset elapsed timer */
/* ... code to time ... */
SAY 'Elapsed:' TIME('E') 'seconds'
```

### 15.2 The "stem.0 = count" Convention

REXX has no `length` property for stem arrays. The universal convention is to store the element count in `stem.0`:

```rexx
/* Building an array */
item. = ''
item.0 = 0

/* Append function */
append: PROCEDURE EXPOSE item.
    PARSE ARG value
    n = item.0 + 1
    item.n = value
    item.0 = n
    RETURN

CALL append 'first'
CALL append 'second'
CALL append 'third'

SAY 'Count:' item.0           /* 3 */
DO i = 1 TO item.0
    SAY i':' item.i
END
```

### 15.3 The OPTIONS RESULTS Pattern (ARexx)

Every ARexx script that communicates with host applications should start with:

```rexx
/* Standard ARexx script boilerplate */
OPTIONS RESULTS
SIGNAL ON SYNTAX NAME error_handler
SIGNAL ON ERROR NAME error_handler

/* Check host is available */
IF ~SHOW('P', 'APPNAME') THEN DO
    SAY 'Application not running.'
    EXIT 10
END

ADDRESS 'APPNAME'

/* ... script body ... */

EXIT 0

error_handler:
    SAY 'Error' rc 'at line' sigl':' ERRORTEXT(rc)
    SAY 'Condition:' CONDITION('D')
    EXIT rc
```

### 15.4 Defensive Coding Pattern

```rexx
/* Production REXX script template */
SIGNAL ON NOVALUE NAME novalue_err
SIGNAL ON SYNTAX NAME syntax_err
SIGNAL ON ERROR NAME error_err
SIGNAL ON HALT NAME halt_err

NUMERIC DIGITS 15              /* more than default for financial */

/* Main program body */
CALL main
EXIT 0

main: PROCEDURE
    /* ... */
    RETURN

novalue_err:
    CALL LINEOUT 'STDERR', 'NOVALUE:' CONDITION('D') 'at line' sigl
    EXIT 1

syntax_err:
    CALL LINEOUT 'STDERR', 'SYNTAX' rc':' ERRORTEXT(rc) 'at line' sigl
    EXIT rc

error_err:
    CALL LINEOUT 'STDERR', 'ERROR: rc='rc 'at line' sigl
    EXIT rc

halt_err:
    CALL LINEOUT 'STDERR', 'Interrupted at line' sigl
    EXIT 4
```

---

## 16. Porting Checklist

For any implementation that aims to faithfully reproduce REXX behavior, verify the following:

### Arithmetic

- [ ] Decimal arithmetic, not binary floating point
- [ ] `NUMERIC DIGITS` scoped per routine, default 9
- [ ] Arbitrary precision (at least 1000 digits)
- [ ] `NUMERIC FUZZ` affects normal comparisons but not strict
- [ ] `NUMERIC FORM SCIENTIFIC` and `ENGINEERING`
- [ ] Number-to-string strips trailing zeros and trailing decimal point
- [ ] String-to-number accepts leading/trailing blanks, leading zeros, exponential notation

### Strings

- [ ] Everything is a string; no separate numeric type
- [ ] Three concatenation forms: blank, `||`, abuttal
- [ ] All comparison operators: normal (`=`, `<>`, etc.) and strict (`==`, `\==`, etc.)
- [ ] `POS()` returns 0 for "not found" (not -1)
- [ ] `SUBSTR()` is 1-based (not 0-based)
- [ ] `COPIES()`, `CENTER()`, `TRANSLATE()`, `VERIFY()`, `ABBREV()` behave as specified
- [ ] All word functions treat any whitespace sequence as a single word separator
- [ ] `SPACE()` normalizes internal whitespace

### Variables

- [ ] Case-insensitive variable names (stored uppercase)
- [ ] Uninitialized variables return their own name in uppercase
- [ ] Compound variables with tail resolution
- [ ] Stem defaults (`stem. = value` sets default for all compounds)
- [ ] `DROP` instruction releases variables
- [ ] `SYMBOL()` returns BAD/VAR/LIT

### PARSE

- [ ] All sources: ARG, PULL, VAR, VALUE...WITH, SOURCE, VERSION
- [ ] Word-based splitting (whitespace)
- [ ] Literal pattern matching (quoted strings)
- [ ] Absolute positional patterns (column numbers)
- [ ] Relative positional patterns (`+n`, `-n`)
- [ ] Variable patterns (parenthesized names)
- [ ] Period placeholder (discard a word)
- [ ] Last variable gets remainder including leading blanks
- [ ] `PARSE UPPER` uppercases before parsing

### Control Flow

- [ ] `DO` in all forms: counted, WHILE, UNTIL, FOREVER, simple count, BY, FOR
- [ ] `LEAVE` and `ITERATE` with optional loop name
- [ ] `SELECT`/`WHEN`/`OTHERWISE`/`END`
- [ ] `IF`/`THEN`/`ELSE` (ELSE binds to nearest unmatched IF)
- [ ] `NOP` instruction
- [ ] `SIGNAL` (non-local goto, destroys pending control structures)
- [ ] `EXIT` with optional return value

### I/O

- [ ] `SAY` writes to stdout with newline
- [ ] Queue: `PUSH` (LIFO), `QUEUE` (FIFO), `PULL`, `QUEUED()`
- [ ] Stream I/O: `LINEIN`, `LINEOUT`, `CHARIN`, `CHAROUT`, `LINES`, `CHARS`, `STREAM`
- [ ] OR ARexx I/O: `OPEN`, `CLOSE`, `READLN`, `WRITELN`, `READCH`, `WRITECH`, `EOF`, `SEEK`

### Subroutines

- [ ] `CALL name` and `name()` invoke same code
- [ ] `CALL` stores return value in `RESULT`; function call returns inline
- [ ] `PROCEDURE` creates new scope; `PROCEDURE EXPOSE` shares selected variables
- [ ] `ARG()` for argument count and existence checking
- [ ] Search order: internal label, built-in function, external library, external file

### Error Handling

- [ ] `SIGNAL ON SYNTAX/NOVALUE/ERROR/FAILURE/HALT/NOTREADY/LOSTDIGITS`
- [ ] `SIGNAL OFF condition`
- [ ] `CALL ON ERROR/FAILURE/HALT/NOTREADY`
- [ ] Special variables: `RC`, `SIGL`
- [ ] `CONDITION()` function with options C/D/I/S
- [ ] `ERRORTEXT()` for all standard error codes

### ARexx-Specific (if targeting Amiga compatibility)

- [ ] `ADDRESS` host selection and single-command form
- [ ] `OPTIONS RESULTS` for return values from hosts
- [ ] `SHOW()` for port/library/clip enumeration
- [ ] `ADDLIB()`/`REMLIB()` for function libraries
- [ ] `SETCLIP()`/`GETCLIP()` for persistent clips
- [ ] `DELAY()` for timing
- [ ] Bit operations on character strings
- [ ] `~` as NOT operator
- [ ] File I/O via rexxsupport.library (not ANSI stream I/O)

---

## 17. Historical Context and Legacy

REXX was designed in 1979, the same year as the Bourne shell (sh) became standard and four years before Perl. It was arguably the first "modern" scripting language: block-structured, with a clean syntax, built-in string handling, and arbitrary precision arithmetic. It predates Tcl (1988), Python (1991), Ruby (1995), and JavaScript (1995).

On IBM mainframes (VM/CMS, TSO/E, OS/400), REXX became the dominant scripting language and remains in active use. IBM's z/OS ships with REXX as a standard component. Millions of lines of production REXX code run on mainframes today.

On OS/2, REXX was the system scripting language, providing capabilities that Windows would not match until PowerShell decades later. OS/2 REXX could manipulate the Workplace Shell, automate applications, and serve as a complete systems programming tool.

On the Amiga, ARexx created the first mainstream inter-application scripting environment. Any application that opened an ARexx port became a programmable component. Users could chain operations across multiple applications (load in ImageFX, process, export to Final Writer, print) with a single script. This level of application automation was not available on Windows until OLE Automation (1993) and not on macOS until AppleScript (1993).

The REXX design philosophy -- human readability, typeless simplicity, powerful string handling, arbitrary precision -- influenced many subsequent languages. Python's emphasis on readability, Tcl's "everything is a string" model, and the general trend toward high-level scripting all echo ideas that REXX explored first.

Modern implementations include:

- **Regina REXX** -- open source, cross-platform (Linux, macOS, Windows, Amiga)
- **Open Object Rexx (ooRexx)** -- IBM's object-oriented extension, now open source
- **NetRexx** -- REXX-like language on the JVM
- **Rexx/imc** -- lightweight Unix implementation
- **ARexx** -- included in AmigaOS 3.x+, AROS, MorphOS

For porting purposes, Regina REXX is the reference implementation for testing. It is available on every major platform and faithfully implements the ANSI standard plus common extensions.
