# Porting REXX/ARexx to Modern Platforms

## The Three-Stage Pipeline: TypeScript, x86-64 Assembly, CUDA GPU

**PNW Research Series -- tibsfox.com**
**RXX Research Project -- Rosetta Cluster: AI & Computation**
**Date: 2026-04-09**

---

## Abstract

This document presents the architectural blueprint for porting the REXX/ARexx
programming language to modern platforms through a three-stage escalation
pipeline: a TypeScript interpreter for immediate ecosystem integration, an
x86-64 assembly interpreter for bare-metal performance, and a CUDA GPU runtime
for massively parallel batch execution. Each stage builds on the previous,
preserving REXX's string-centric computing model while leveraging the
capabilities unique to each target. The port system that made ARexx
revolutionary on the Amiga is reimagined as a first-class integration with the
Model Context Protocol (MCP), turning every MCP tool into an addressable ARexx
port and every REXX script into a callable MCP tool.

---

## Table of Contents

1. [Historical Context and Motivation](#1-historical-context-and-motivation)
2. [Language Selection Analysis](#2-language-selection-analysis)
3. [Stage 1: TypeScript Interpreter Architecture](#3-stage-1-typescript-interpreter-architecture)
4. [The Lexer](#4-the-lexer)
5. [The Parser](#5-the-parser)
6. [The AST](#6-the-ast)
7. [The Evaluator](#7-the-evaluator)
8. [The PARSE Engine](#8-the-parse-engine)
9. [The Port System in TypeScript](#9-the-port-system-in-typescript)
10. [MCP Integration](#10-mcp-integration)
11. [Stage 2: x86-64 Assembly Interpreter](#11-stage-2-x86-64-assembly-interpreter)
12. [x86-64 Interpreter Core](#12-x86-64-interpreter-core)
13. [Key Assembly Patterns](#13-key-assembly-patterns)
14. [Memory Layout](#14-memory-layout)
15. [Stage 3: CUDA GPU Runtime](#15-stage-3-cuda-gpu-runtime)
16. [GPU String Operations](#16-gpu-string-operations)
17. [GPU Port System](#17-gpu-port-system)
18. [Batch REXX Execution](#18-batch-rexx-execution)
19. [Cross-Stage Integration](#19-cross-stage-integration)
20. [Estimated Effort and LOC](#20-estimated-effort-and-loc)
21. [Technical Challenges and Mitigations](#21-technical-challenges-and-mitigations)
22. [References](#22-references)

---

## 1. Historical Context and Motivation

### 1.1 The REXX Language

REXX (Restructured Extended Executor) was designed by Mike Cowlishaw at IBM in
1979 with a single objective: to make programming easier than it was before.
The language has just 23 instructions, minimal punctuation, and exactly one data
type -- the character string. Every value in REXX is a string. Numbers are
strings that happen to contain digits. Booleans are strings that happen to be
"0" or "1". This radical simplicity is not a limitation but a deliberate design
choice: all data is visible, symbolic, and human-readable at every point in
execution.

The ANSI standard (X3.274-1996) formalized the language specification. Key
features include:

- **Arbitrary precision arithmetic** via `NUMERIC DIGITS` (default 9, no upper
  limit)
- **The PARSE instruction** -- a template-based string decomposition engine
  unmatched in any other language
- **The INTERPRET instruction** -- runtime evaluation of dynamically constructed
  code
- **Clause-based grammar** -- no reserved words; `SAY` is not a keyword, it is
  a command that the interpreter recognizes by position
- **External function search order** -- internal labels, then loaded libraries,
  then external files

### 1.2 ARexx: The Amiga Extension

In 1987, William S. Hawes created ARexx, a REXX implementation for the
Commodore Amiga. Hawes developed the prototype in C using Lattice C on an Amiga
1000 with 512KB of RAM and two floppy drives, then rewrote the production
version entirely in 68000 assembly language using the Metacomco assembler. This
was not unusual for the Amiga ecosystem -- knowing your machine at the register
level was the culture.

What made ARexx extraordinary was not the language itself but the **port
system**. ARexx added inter-process communication to REXX through Amiga Exec
message ports:

- Any application could create a **public message port** (an "ARexx port")
- ARexx scripts could **ADDRESS** any named port, sending command strings
- The port's host application would parse the command, execute it, and reply
- The reply came back as the **RESULT** variable in the calling script
- Applications could send messages to each other through ARexx as intermediary

The **RexxMsg** structure carried 16 string slots (slot 0 always held the
command string), action flags, and result fields. This was, in 1987, a
language-level IPC system that predated COM, CORBA, D-Bus, and every modern
equivalent by years.

Commodore included ARexx with AmigaOS 2.0 in 1990. Every Amiga application was
expected to have an ARexx port. A text editor, an image processor, a music
tracker, and a 3D renderer could all be scripted from a single REXX program.
This level of inter-application scripting has never been replicated on any other
platform.

### 1.3 Why Port Now?

The ARexx port system maps almost perfectly onto the Model Context Protocol
(MCP). Each MCP tool is an addressable endpoint that accepts commands and
returns results. The structural homomorphism is striking:

```
ARexx Concept          MCP Equivalent
----------------------------------------------
ARexx Port             MCP Tool / Server
ADDRESS portname       Tool call to server
RexxMsg (command)      Tool input (JSON)
RESULT variable        Tool output (JSON)
Port discovery         Server capability listing
Port table             MCP server registry
```

This is not a forced analogy. The underlying architecture -- named endpoints,
structured messages, request/response semantics, dynamic discovery -- is
identical. A REXX interpreter with MCP integration would restore the Amiga's
inter-application scripting model on modern infrastructure.

Beyond the architectural match, REXX's arbitrary precision arithmetic, combined
with CUDA, maps directly onto the GSD math co-processor (18 MCP tools, 125
tests, CUDA-accelerated). A GPU REXX runtime could serve as the scripting layer
for batch mathematical computation.

---

## 2. Language Selection Analysis

### 2.1 Candidates

Four languages were evaluated for the Stage 1 interpreter:

**Rust**
- Memory safety without garbage collection
- Zero-cost abstractions for interpreter dispatch
- `tokio` for async (maps to ARexx port waits)
- Strong ecosystem for parsers (`nom`, `pest`, `lalrpop`)
- No runtime overhead
- Steep learning curve for contributors

**TypeScript**
- Already in the gsd-skill-creator stack (Vite, Vitest, 21,000+ tests)
- V8 JIT provides competitive performance for an interpreter
- `async/await` maps directly to ARexx port wait semantics
- Native MCP SDK integration (`@modelcontextprotocol/sdk`)
- `EventEmitter` and `MessageChannel` for port simulation
- Largest contributor pool

**C**
- Closest to the original ARexx implementation language
- BRexx (Vasilis Vlachoudis, CERN) and Regina (Mark Hessling) are both ANSI C
- Maximum control over memory layout
- No async primitives -- would need libuv or manual epoll
- Hardest to integrate with MCP ecosystem

**Zig**
- C-level control with safety guarantees
- Comptime for metaprogramming the parser
- Good bridge to assembly (inline asm, no hidden control flow)
- Small ecosystem, fewer contributors
- No MCP SDK

### 2.2 Recommendation

**Stage 1: TypeScript.** The ecosystem match is overwhelming. The gsd-skill-
creator MCP gateway (`src/mcp/gateway/tools/`) already registers tools on
`McpServer` instances. A REXX interpreter written in TypeScript can register
itself as an MCP tool and call other MCP tools as ARexx ports with zero glue
code. The `async/await` model maps perfectly to ARexx's synchronous port
semantics (send message, wait for reply). V8's JIT is fast enough for an
interpreter -- we are not writing a compiler.

**Stage 2: x86-64 assembly with a Rust bridge.** The assembly interpreter needs
a thin hosting layer for I/O, memory management, and port dispatch. Rust
provides this without a garbage collector. The Rust layer handles Unix domain
sockets, shared memory, and the MCP client. The assembly core handles lexing,
parsing, evaluation, and arithmetic.

**Stage 3: CUDA with C++ host.** CUDA kernels are written in a C++ dialect.
The host code manages GPU memory, kernel launches, and the port dispatch loop.
NVIDIA's CGBN library provides warp-cooperative big number arithmetic.

---

## 3. Stage 1: TypeScript Interpreter Architecture

### 3.1 High-Level Pipeline

```
                    +-----------+
  Source code  ---->|   Lexer   |----> Token stream
                    +-----------+
                         |
                    +-----------+
  Token stream --->|  Parser   |----> AST
                    +-----------+
                         |
                    +-----------+
  AST          --->| Evaluator |----> Result (string)
                    +-----------+
                     |       |
              +------+       +------+
              |                     |
        +----------+         +-----------+
        | Port Sys |         | Var Pool  |
        +----------+         +-----------+
```

### 3.2 Module Structure

```
src/rexx/
  lexer.ts              Token types, lexer state machine
  parser.ts             Clause-based parser, AST construction
  ast.ts                AST node type definitions
  evaluator.ts          Tree-walking evaluator
  values.ts             String value model, numeric coercion
  arithmetic.ts         Arbitrary precision decimal arithmetic
  parse-engine.ts       PARSE instruction template engine
  variables.ts          Variable pool, stem resolution, PROCEDURE scope
  ports.ts              Port registry, message dispatch
  builtins.ts           Built-in function library (70+ functions)
  interpret.ts          INTERPRET instruction (recursive evaluation)
  trace.ts              TRACE instruction implementation
  mcp-bridge.ts         MCP tool <-> ARexx port bridge
  index.ts              Public API, REPL entry point
  __tests__/
    lexer.test.ts
    parser.test.ts
    evaluator.test.ts
    arithmetic.test.ts
    parse-engine.test.ts
    variables.test.ts
    ports.test.ts
    builtins.test.ts
    integration.test.ts
```

Estimated LOC: **8,000--10,000** (implementation) + **4,000--5,000** (tests).

---

## 4. The Lexer

### 4.1 Token Types

REXX's lexer is simpler than most languages because the language has no reserved
words. The token set:

```typescript
enum TokenType {
  // Literals
  STRING_LITERAL,      // 'hello' or "hello"
  HEX_STRING,          // 'FF00'x
  BIN_STRING,          // '11110000'b
  NUMBER,              // 42, 3.14, 1E10, 1e-3
  SYMBOL,              // any identifier: SAY, x, myVar, DO
  CONSTANT_SYMBOL,     // digits or . only: 42, 3.14 (subset of NUMBER)

  // Operators
  PLUS, MINUS, STAR, SLASH, INT_DIV, REMAINDER,  // + - * / % //
  POWER,               // **
  CONCAT,              // || (explicit concatenation)
  ABUTTAL,             // implicit concatenation (adjacent terms)
  EQ, NE, GT, LT, GE, LE,           // = \= > < >= <=
  STRICT_EQ, STRICT_NE, STRICT_GT,  // == \== >> << >>= <<=
  STRICT_LT, STRICT_GE, STRICT_LE,
  AND, OR, XOR, NOT,                 // & | && \

  // Delimiters
  LPAREN, RPAREN,      // ( )
  COMMA,               // ,
  SEMICOLON,           // ; (clause terminator)
  COLON,               // : (label terminator)
  DOT,                 // . (stem separator)
  ASSIGNMENT,          // = (in assignment context)

  // Special
  COMMENT,             // /* ... */ (nestable!)
  EOL,                 // end of line (implicit semicolon)
  EOF,                 // end of source
}
```

### 4.2 Lexer Challenges

**Nestable comments.** REXX comments `/* ... */` nest. A counter tracks depth:

```typescript
function lexComment(source: string, pos: number): { end: number; text: string } {
  let depth = 1;
  let i = pos + 2; // skip opening /*
  while (i < source.length && depth > 0) {
    if (source[i] === '/' && source[i + 1] === '*') {
      depth++;
      i += 2;
    } else if (source[i] === '*' && source[i + 1] === '/') {
      depth--;
      i += 2;
    } else {
      i++;
    }
  }
  return { end: i, text: source.slice(pos, i) };
}
```

**Line continuation.** A comma at end of line continues to the next line. The
lexer must track this state.

**No reserved words.** The symbol `DO` is just a symbol. The parser decides
whether it begins a DO block based on position. The lexer emits `SYMBOL` for
everything and lets the parser disambiguate.

**Hex and binary strings.** The `x` or `b` suffix after a closing quote
changes the string type. The lexer must look ahead after string literals.

### 4.3 Implicit Semicolons

Every line end is an implicit semicolon unless:
- The line ends with a comma (continuation)
- We are inside a comment
- We are inside a string literal (which cannot span lines in standard REXX)

This mirrors JavaScript's ASI but is far simpler because REXX's grammar has no
ambiguous cases.

---

## 5. The Parser

### 5.1 The REXX Parsing Challenge

REXX's grammar is unusual among programming languages. Consider:

```rexx
SAY "Hello"
```

`SAY` is not a reserved word. It is a symbol. The parser must decide: is this
an assignment (`SAY = "Hello"`)? A command (`SAY "Hello"` sent to the current
ADDRESS)? Or the `SAY` instruction? The decision algorithm:

1. If the second token is `=` or is an operator that requires a left operand,
   it is an **assignment**: `SAY = "Hello"` sets variable SAY to "Hello".
2. If the symbol matches a known instruction keyword AND appears in instruction
   position (first token of a clause), it is an **instruction**.
3. Otherwise, the entire clause is a **command** -- the clause is evaluated as
   an expression and the resulting string is sent to the current ADDRESS
   environment.

This means the parser must handle the instruction keywords as context-sensitive
rather than lexically reserved. The 23 instruction keywords:

```
ADDRESS  ARG      CALL     DO       DROP
END      EXIT     IF       INTERPRET  ITERATE
LEAVE    NOP      NUMERIC  OPTIONS    PARSE
PROCEDURE  PULL   PUSH     QUEUE      RETURN
SAY      SELECT   SIGNAL   TRACE
```

### 5.2 Parser Implementation

A recursive descent parser is the natural choice. REXX's grammar is LL(2) --
one token of lookahead for most constructs, two tokens to disambiguate
assignment from command (checking if token 2 is `=`).

```typescript
function parseClause(tokens: Token[]): ASTNode {
  const first = tokens[0];

  // Label check: symbol followed by colon
  if (first.type === TokenType.SYMBOL && tokens[1]?.type === TokenType.COLON) {
    return parseLabelClause(tokens);
  }

  // Assignment check: symbol followed by = (but not ==)
  if (first.type === TokenType.SYMBOL && tokens[1]?.type === TokenType.ASSIGNMENT) {
    return parseAssignment(tokens);
  }

  // Instruction check: is the first symbol an instruction keyword?
  if (first.type === TokenType.SYMBOL && isInstructionKeyword(first.value)) {
    return parseInstruction(first.value, tokens);
  }

  // Everything else is a command clause
  return parseCommandClause(tokens);
}
```

### 5.3 Expression Parsing

REXX expressions follow standard precedence rules with one addition: abuttal
concatenation (placing two terms adjacent with a space) has lower precedence
than most operators but higher than comparison.

Precedence table (highest to lowest):

```
1. Prefix operators:  + - \
2. Power:             **
3. Multiply/Divide:   * / % //
4. Add/Subtract:      + -
5. Concatenation:     || (explicit)  ' ' (abuttal/blank)
6. Comparison:        = \= > < >= <= == \== >> << >>= <<=
7. Logical AND:       &
8. Logical OR/XOR:    | &&
```

A Pratt parser (top-down operator precedence) handles this cleanly:

```typescript
function parseExpression(tokens: TokenStream, minPrec: number = 0): ASTNode {
  let left = parsePrefix(tokens);

  while (tokens.hasMore() && precedenceOf(tokens.peek()) >= minPrec) {
    const op = tokens.next();
    const prec = precedenceOf(op);
    const assoc = associativityOf(op); // right for **, left for all others
    const nextMinPrec = assoc === 'right' ? prec : prec + 1;
    const right = parseExpression(tokens, nextMinPrec);
    left = { type: 'BinaryOp', op: op.value, left, right };
  }

  // Check for abuttal: if next token is a term start and no operator between
  if (tokens.hasMore() && isTermStart(tokens.peek()) && minPrec <= CONCAT_PREC) {
    const right = parseExpression(tokens, CONCAT_PREC + 1);
    left = { type: 'BinaryOp', op: 'ABUTTAL', left, right };
  }

  return left;
}
```

### 5.4 The DO Construct

`DO` is the most complex instruction to parse because it has multiple forms:

```rexx
DO                       /* simple DO block */
DO 5                     /* repetitive: count */
DO i = 1 TO 10           /* controlled repetitive */
DO i = 1 TO 10 BY 2      /* with step */
DO WHILE condition        /* conditional: while */
DO UNTIL condition        /* conditional: until */
DO FOREVER                /* infinite loop */
DO i = 1 TO 10 WHILE x   /* combined */
```

The parser must handle all combinations. The key insight: after `DO`, check
whether the next token is a symbol followed by `=` (controlled repetitive), a
keyword like `WHILE`/`UNTIL`/`FOREVER`, a number (count), or nothing (simple
block).

---

## 6. The AST

### 6.1 Node Types

```typescript
type ASTNode =
  // Structural
  | { type: 'Program'; body: ASTNode[] }
  | { type: 'Label'; name: string }
  | { type: 'NullClause' }

  // Instructions
  | { type: 'Say'; expression: ASTNode }
  | { type: 'Assignment'; variable: VariableRef; value: ASTNode }
  | { type: 'Do'; control: DoControl; body: ASTNode[] }
  | { type: 'If'; condition: ASTNode; then: ASTNode[]; else?: ASTNode[] }
  | { type: 'Select'; whens: WhenClause[]; otherwise?: ASTNode[] }
  | { type: 'Call'; target: string; args: ASTNode[] }
  | { type: 'Return'; value?: ASTNode }
  | { type: 'Exit'; value?: ASTNode }
  | { type: 'Signal'; target: string | ASTNode; onCondition?: string }
  | { type: 'Iterate'; name?: string }
  | { type: 'Leave'; name?: string }
  | { type: 'Nop' }
  | { type: 'Drop'; variables: string[] }
  | { type: 'Procedure'; expose?: string[] }
  | { type: 'Parse'; source: ParseSource; template: ParseTemplate }
  | { type: 'Address'; environment?: string; command?: ASTNode }
  | { type: 'Numeric'; subkeyword: string; value: ASTNode }
  | { type: 'Trace'; setting: string | ASTNode }
  | { type: 'Options'; expression: ASTNode }
  | { type: 'Push'; expression?: ASTNode }
  | { type: 'Pull'; template: ParseTemplate }
  | { type: 'Queue'; expression?: ASTNode }
  | { type: 'Arg'; template: ParseTemplate }
  | { type: 'Interpret'; expression: ASTNode }

  // Commands (sent to ADDRESS environment)
  | { type: 'Command'; expression: ASTNode }

  // Expressions
  | { type: 'BinaryOp'; op: string; left: ASTNode; right: ASTNode }
  | { type: 'UnaryOp'; op: string; operand: ASTNode }
  | { type: 'FunctionCall'; name: string; args: ASTNode[] }
  | { type: 'StringLiteral'; value: string; encoding?: 'hex' | 'bin' }
  | { type: 'NumberLiteral'; value: string }
  | { type: 'VariableRef'; name: string; stem?: boolean; tail?: ASTNode[] };

interface DoControl {
  name?: string;           // loop variable name
  initial?: ASTNode;       // = expression
  to?: ASTNode;            // TO expression
  by?: ASTNode;            // BY expression (default 1)
  for?: ASTNode;           // FOR count
  count?: ASTNode;         // simple repetition count
  whileExpr?: ASTNode;     // WHILE condition
  untilExpr?: ASTNode;     // UNTIL condition
  forever?: boolean;       // DO FOREVER
}

interface WhenClause {
  condition: ASTNode;
  body: ASTNode[];
}

type ParseSource =
  | { type: 'arg' }        // PARSE ARG
  | { type: 'pull' }       // PARSE PULL (from external data queue)
  | { type: 'source' }     // PARSE SOURCE (program info)
  | { type: 'var'; name: string }   // PARSE VAR name
  | { type: 'value'; expression: ASTNode }  // PARSE VALUE expr WITH
  | { type: 'version' }    // PARSE VERSION
  | { type: 'linein' }     // PARSE LINEIN (from stdin)
  | { type: 'external' };  // PARSE EXTERNAL
```

### 6.2 Design Decision: Flat vs. Nested

The AST is intentionally flat within each scope. REXX programs are sequences of
clauses, not deeply nested trees. The `body` arrays in `Do`, `If`, `Select`
contain clause nodes. This mirrors how REXX programmers think about their code
and simplifies the evaluator's dispatch loop.

---

## 7. The Evaluator

### 7.1 The String Value Model

Every value in REXX is a string. The evaluator's core type:

```typescript
class RexxValue {
  private readonly raw: string;

  constructor(value: string) {
    this.raw = value;
  }

  toString(): string { return this.raw; }

  toNumber(digits: number = 9): RexxDecimal {
    // Attempt numeric interpretation
    // Throws SYNTAX condition if not a valid number
    return RexxDecimal.parse(this.raw, digits);
  }

  toBoolean(): boolean {
    if (this.raw === '0') return false;
    if (this.raw === '1') return true;
    throw new RexxCondition('SYNTAX', 'Value is not boolean: ' + this.raw);
  }

  get length(): number { return this.raw.length; }
}
```

Arithmetic operations first convert operands to `RexxDecimal`, perform the
operation, then convert back to string. This is the fundamental cycle of REXX
evaluation.

### 7.2 Arbitrary Precision: The RexxDecimal Class

REXX's arithmetic is decimal, not binary. `1/3` at `NUMERIC DIGITS 9` is
`0.333333333`, not `0.33333333333333331` (IEEE 754). The `RexxDecimal` class
implements this:

```typescript
class RexxDecimal {
  readonly sign: 1 | -1;
  readonly digits: Uint8Array;   // BCD-style, one digit per byte
  readonly exponent: number;     // power of 10 for rightmost digit

  static parse(s: string, maxDigits: number): RexxDecimal { /* ... */ }

  add(other: RexxDecimal, numericDigits: number): RexxDecimal { /* ... */ }
  subtract(other: RexxDecimal, numericDigits: number): RexxDecimal { /* ... */ }
  multiply(other: RexxDecimal, numericDigits: number): RexxDecimal { /* ... */ }
  divide(other: RexxDecimal, numericDigits: number): RexxDecimal { /* ... */ }
  integerDivide(other: RexxDecimal, numericDigits: number): RexxDecimal { /* ... */ }
  remainder(other: RexxDecimal, numericDigits: number): RexxDecimal { /* ... */ }
  power(exponent: RexxDecimal, numericDigits: number): RexxDecimal { /* ... */ }

  round(numericDigits: number): RexxDecimal { /* ... */ }
  toString(): string { /* ... */ }
}
```

The ANSI standard specifies the rounding rules precisely: operations are
computed to `NUMERIC DIGITS + 1` precision, then the extra digit is inspected
for rounding. This prevents cascading rounding errors.

### 7.3 The Scope Model

REXX has a flat scope model with explicit exposure:

```
Global variable pool         <-- default scope
  |
  +-- PROCEDURE frame 1      <-- clean scope (no access to parent)
  |     EXPOSE a b c          <-- except these specific variables
  |
  +-- PROCEDURE frame 2
        EXPOSE a stem.         <-- stems can be exposed too
```

Implementation:

```typescript
class VariablePool {
  private frames: Map<string, RexxValue>[] = [new Map()];

  get(name: string): RexxValue {
    const frame = this.frames[this.frames.length - 1];
    const val = frame.get(name.toUpperCase());
    if (val !== undefined) return val;
    // REXX rule: uninitialized variables return their own name in uppercase
    return new RexxValue(name.toUpperCase());
  }

  set(name: string, value: RexxValue): void {
    this.frames[this.frames.length - 1].set(name.toUpperCase(), value);
  }

  enterProcedure(expose: string[]): void {
    const parent = this.frames[this.frames.length - 1];
    const child = new Map<string, RexxValue>();
    // EXPOSE creates references, not copies
    for (const name of expose) {
      // For stems, we need to share the entire stem subtree
      if (name.endsWith('.')) {
        this.exposeStem(parent, child, name);
      } else {
        // Share by reference: same Map entry
        const val = parent.get(name.toUpperCase());
        if (val !== undefined) child.set(name.toUpperCase(), val);
      }
    }
    this.frames.push(child);
  }

  leaveProcedure(): void {
    this.frames.pop();
  }
}
```

The critical subtlety: EXPOSE creates shared references, not copies. When a
child procedure modifies an exposed variable, the parent sees the change. This
requires the `Map` entries to use reference semantics -- in TypeScript, wrapping
values in a `{ value: RexxValue }` holder object.

### 7.4 Stem Variables

Stems are REXX's equivalent of associative arrays:

```rexx
employee.1 = "Alice"
employee.2 = "Bob"
employee.0 = 2        /* convention: .0 holds count */
```

The stem name is `employee.`, the tail is `1`, `2`, or `0`. Tails are
themselves evaluated as expressions -- `employee.i` looks up variable `i`,
gets its value (say `3`), and resolves `employee.3`.

```typescript
function resolveStem(pool: VariablePool, stem: string, tails: ASTNode[]): string {
  // Evaluate each tail component
  const resolvedTails = tails.map(t => evaluate(t, pool).toString());
  // Construct the compound name
  const fullName = stem + resolvedTails.join('.');
  return pool.get(fullName).toString();
}
```

### 7.5 External Function Search Order

When REXX encounters a function call, it searches in this order:

1. **Internal functions** -- labels within the current program
2. **Built-in functions** -- the 70+ standard functions (SUBSTR, WORD, etc.)
3. **External functions** -- loaded function libraries, then external files

```typescript
async function resolveFunction(
  name: string,
  args: RexxValue[],
  program: ASTNode,
  builtins: Map<string, BuiltinFn>,
  externalSearch: ExternalResolver
): Promise<RexxValue> {
  // 1. Internal: find label in current program
  const label = findLabel(program, name);
  if (label) return callInternalFunction(label, args);

  // 2. Built-in
  const builtin = builtins.get(name.toUpperCase());
  if (builtin) return builtin(args);

  // 3. External (may involve file I/O or library loading)
  return externalSearch.resolve(name, args);
}
```

---

## 8. The PARSE Engine

The PARSE instruction is the crown jewel of REXX and the most complex feature
to implement. It provides template-based string decomposition that combines
word splitting, pattern matching, and positional extraction in a single
instruction.

### 8.1 Template Grammar

A PARSE template is a sequence of **targets** and **patterns**:

```
template     ::= (target | pattern)*
target       ::= variable_name | '.'           /* . is placeholder */
pattern      ::= literal_pattern
               | variable_pattern
               | positional_pattern
literal_pat  ::= string_literal                 /* 'abc' or "abc" */
variable_pat ::= '(' variable_name ')'          /* (varname) */
positional   ::= absolute_pos | relative_pos
absolute_pos ::= number                         /* =5 or just 5 */
relative_pos ::= '+' number | '-' number        /* +3, -2 */
```

### 8.2 The Parsing Algorithm

The algorithm maintains two pointers into the source string:

- **match_start** -- where the next variable assignment begins
- **match_pos** -- the current scanning position

Step-by-step:

```
1. Set match_start = 0, match_pos = 0
2. For each element in the template:
   a. If it is a VARIABLE:
      - Record it as "pending" (we don't know its bounds yet)
   b. If it is a LITERAL PATTERN:
      - Search from match_pos for the literal in the source string
      - If found at position P:
        - Assign all characters from match_start to P-1 to the pending variable
        - Set match_start = P + length(literal)
        - Set match_pos = match_start
      - If not found:
        - Assign rest of string to pending variable
        - match_start = end of string
   c. If it is a POSITIONAL PATTERN (absolute N):
      - Assign characters from match_start to N-1 to pending variable
      - Set match_start = N
      - Set match_pos = N
   d. If it is a POSITIONAL PATTERN (relative +N):
      - Assign characters from match_start to match_pos+N-1 to pending variable
      - Set match_start = match_pos + N
      - Set match_pos = match_start
   e. If it is a POSITIONAL PATTERN (relative -N):
      - Set match_pos = match_pos - N
      - Assign from match_start to match_pos to pending variable
      - Set match_start = match_pos
3. After all elements processed:
   - Assign remaining string (from match_start to end) to any final pending variable
```

When a pending variable receives its substring and no pattern precedes the next
variable, the substring is further split by words -- each variable gets one
word, the last variable gets all remaining words.

### 8.3 Implementation

```typescript
interface ParseState {
  source: string;
  matchStart: number;
  matchPos: number;
  pending: string[];      // variable names waiting for assignment
}

function executeParse(
  source: string,
  template: ParseTemplateElement[],
  pool: VariablePool
): void {
  const state: ParseState = {
    source,
    matchStart: 0,
    matchPos: 0,
    pending: [],
  };

  for (const element of template) {
    switch (element.type) {
      case 'variable':
        state.pending.push(element.name);
        break;

      case 'dot':
        state.pending.push('.'); // placeholder -- assign but discard
        break;

      case 'literal': {
        const idx = state.source.indexOf(element.value, state.matchPos);
        if (idx >= 0) {
          assignPending(state, pool, idx);
          state.matchStart = idx + element.value.length;
          state.matchPos = state.matchStart;
        } else {
          assignPending(state, pool, state.source.length);
          state.matchStart = state.source.length;
          state.matchPos = state.matchStart;
        }
        break;
      }

      case 'absolute': {
        const pos = Math.max(0, Math.min(element.position - 1, state.source.length));
        assignPending(state, pool, pos);
        state.matchStart = pos;
        state.matchPos = pos;
        break;
      }

      case 'relative': {
        const pos = Math.max(0, Math.min(
          state.matchPos + element.offset,
          state.source.length
        ));
        assignPending(state, pool, pos);
        state.matchStart = pos;
        state.matchPos = pos;
        break;
      }

      case 'variablePattern': {
        const pattern = pool.get(element.name).toString();
        const idx = state.source.indexOf(pattern, state.matchPos);
        if (idx >= 0) {
          assignPending(state, pool, idx);
          state.matchStart = idx + pattern.length;
          state.matchPos = state.matchStart;
        } else {
          assignPending(state, pool, state.source.length);
          state.matchStart = state.source.length;
        }
        break;
      }
    }
  }

  // Final assignment: rest of string to remaining pending variables
  assignPending(state, pool, state.source.length);
}

function assignPending(state: ParseState, pool: VariablePool, endPos: number): void {
  if (state.pending.length === 0) return;

  const substring = state.source.slice(state.matchStart, endPos);
  const words = substring.trim().split(/\s+/).filter(w => w.length > 0);

  for (let i = 0; i < state.pending.length; i++) {
    const name = state.pending[i];
    let value: string;

    if (i < state.pending.length - 1) {
      // Non-last variable: gets one word
      value = words[i] ?? '';
    } else {
      // Last variable: gets all remaining words (preserving spacing)
      if (i === 0) {
        // Only variable: gets the whole substring, stripped
        value = substring.trim();
      } else {
        // Find where word i starts in the substring and take everything from there
        value = remainingFrom(substring, words, i);
      }
    }

    if (name !== '.') {
      pool.set(name, new RexxValue(value));
    }
  }

  state.pending = [];
}
```

### 8.4 PARSE Test Cases

These edge cases validate correct implementation:

```rexx
/* Word splitting */
PARSE VALUE '  Alice   Bob   Carol  ' WITH first second rest
/* first='Alice', second='Bob', rest='Carol' */

/* Literal pattern */
PARSE VALUE 'Name: Alice Age: 30' WITH 'Name: ' name 'Age: ' age
/* name='Alice ', age='30' -- note trailing space in name */

/* Positional (absolute) */
PARSE VALUE 'ABCDEFGHIJ' WITH 1 first 4 second 7 third
/* first='ABC', second='DEF', third='GHIJ' */

/* Positional (relative) */
PARSE VALUE 'ABCDEFGHIJ' WITH first +3 second +3 third
/* first='ABC', second='DEF', third='GHIJ' */

/* Variable pattern */
delim = ':'
PARSE VALUE 'key:value' WITH name (delim) val
/* name='key', val='value' */

/* Combined */
PARSE VALUE 'John Smith 42 Engineer' WITH first last +0 rest
/* first='John', last='', rest='Smith 42 Engineer' -- +0 does not advance */
```

---

## 9. The Port System in TypeScript

### 9.1 Architecture

The ARexx port system is reimagined as an event-driven message router:

```
  +-----------+     +-----------+     +-----------+
  | REXX      |     | Port      |     | Target    |
  | Script    |---->| Router    |---->| App/Tool  |
  |           |<----|           |<----|           |
  +-----------+     +-----------+     +-----------+
                         |
                    +-----------+
                    | Port      |
                    | Registry  |
                    +-----------+
```

### 9.2 Port Types

```typescript
interface RexxPort {
  name: string;
  handler: (command: string, args: string[]) => Promise<RexxPortResult>;
  close(): void;
}

interface RexxPortResult {
  rc: number;           // Return code (0 = success)
  result?: string;      // RESULT variable value
  error?: string;       // Error text if rc != 0
}

class PortRegistry {
  private ports = new Map<string, RexxPort>();

  register(port: RexxPort): void {
    if (this.ports.has(port.name.toUpperCase())) {
      throw new Error(`Port already registered: ${port.name}`);
    }
    this.ports.set(port.name.toUpperCase(), port);
  }

  unregister(name: string): void {
    this.ports.delete(name.toUpperCase());
  }

  find(name: string): RexxPort | undefined {
    return this.ports.get(name.toUpperCase());
  }

  list(): string[] {
    return Array.from(this.ports.keys());
  }
}
```

### 9.3 ADDRESS Instruction

```rexx
ADDRESS EDITOR "OPEN myfile.txt"    /* send command to EDITOR port */
ADDRESS CALC "SIN(3.14)"           /* send command to CALC port */
```

Implementation:

```typescript
async function executeAddress(
  node: AddressNode,
  pool: VariablePool,
  registry: PortRegistry,
  currentAddress: string
): Promise<void> {
  const target = node.environment ?? currentAddress;
  const command = evaluate(node.command, pool).toString();

  const port = registry.find(target);
  if (!port) {
    pool.set('RC', new RexxValue('1'));
    throw new RexxCondition('SYNTAX', `Port not found: ${target}`);
  }

  const result = await port.handler(command, []);

  pool.set('RC', new RexxValue(String(result.rc)));
  if (result.result !== undefined) {
    pool.set('RESULT', new RexxValue(result.result));
  }
}
```

### 9.4 RexxMsg Equivalent

The original RexxMsg had 16 string slots. Our TypeScript equivalent:

```typescript
interface RexxMessage {
  id: string;                    // unique message ID
  sender: string;                // sending port name
  target: string;                // destination port name
  action: RexxAction;            // command, function, or notification
  command: string;               // slot 0: the command string
  args: string[];                // slots 1-15: argument strings
  timestamp: number;
}

interface RexxReply {
  messageId: string;             // correlates to RexxMessage.id
  rc: number;                    // 0 = ok, non-zero = error
  result: string;                // primary result string
  secondary?: string;            // secondary result (for ERROR/FAILURE)
}

enum RexxAction {
  COMMAND = 'RXCOMM',            // execute as command
  FUNCTION = 'RXFUNC',          // call as function, return result
  NOTIFY = 'RXNOTIFY',          // notification, no reply expected
}
```

---

## 10. MCP Integration

### 10.1 The Bridge

The structural mapping between ARexx ports and MCP tools is the heart of this
project. The bridge creates bidirectional integration:

```
Direction 1: REXX scripts call MCP tools via ADDRESS
  REXX script  -->  ADDRESS 'math-coprocessor'  -->  MCP tool call
  REXX script  <--  RESULT variable             <--  MCP tool response

Direction 2: MCP tools call REXX scripts as tools
  MCP client   -->  tool_call('run-rexx', {script})  -->  REXX evaluator
  MCP client   <--  tool_result(output)               <--  REXX evaluator
```

### 10.2 MCP Tools as ARexx Ports

```typescript
import { Client } from '@modelcontextprotocol/sdk/client/index.js';

class McpPortAdapter implements RexxPort {
  name: string;
  private client: Client;

  constructor(serverName: string, client: Client) {
    this.name = serverName;
    this.client = client;
  }

  async handler(command: string, args: string[]): Promise<RexxPortResult> {
    // Parse the command string as: TOOLNAME arg1 arg2 ...
    // Or as JSON: TOOLNAME {"param": "value"}
    const { toolName, params } = parsePortCommand(command, args);

    try {
      const result = await this.client.callTool({
        name: toolName,
        arguments: params,
      });

      return {
        rc: 0,
        result: typeof result.content === 'string'
          ? result.content
          : JSON.stringify(result.content),
      };
    } catch (err) {
      return {
        rc: 1,
        error: String(err),
      };
    }
  }

  close(): void {
    // Connection lifecycle managed by MCP client
  }
}
```

### 10.3 REXX Scripts as MCP Tools

```typescript
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

function registerRexxTool(server: McpServer, scriptPath: string): void {
  const scriptName = path.basename(scriptPath, '.rexx');

  server.tool(
    `rexx-${scriptName}`,
    `Execute REXX script: ${scriptName}`,
    {
      args: z.string().optional().describe('Arguments for the REXX script'),
      input: z.string().optional().describe('Input string for PARSE PULL'),
    },
    async ({ args, input }) => {
      const interpreter = new RexxInterpreter();
      interpreter.setArg(args ?? '');
      if (input) interpreter.pushToQueue(input);

      const result = await interpreter.executeFile(scriptPath);

      return {
        content: [{ type: 'text', text: result.output }],
      };
    }
  );
}
```

### 10.4 Concrete Example: GSD Math Co-Processor

The existing GSD math co-processor has 18 MCP tools. With the REXX bridge,
they become scriptable:

```rexx
/* monte_carlo.rexx -- Run Monte Carlo simulation via MCP */
ADDRESS 'gsd-math-coprocessor'

/* Set up the simulation */
'statos_monte_carlo {"expression": "sin(x)*cos(y)", "variables": {"x": [0, 3.14], "y": [0, 3.14]}, "samples": 100000}'

IF RC = 0 THEN DO
  PARSE VAR RESULT '"mean":' mean ',' .
  SAY 'Monte Carlo mean:' mean
END
ELSE DO
  SAY 'Error:' RC
END
```

This script calls the `statos_monte_carlo` tool through the MCP port bridge,
receives the JSON result, and uses PARSE to extract the mean value. The REXX
PARSE engine handles JSON field extraction naturally -- literal patterns match
the JSON keys, and variables capture the values.

---

## 11. Stage 2: x86-64 Assembly Interpreter

### 11.1 Why Assembly?

The Amiga ethos was knowing your machine. William Hawes wrote the production
ARexx interpreter in 68000 assembly. We continue that tradition on x86-64 for
three reasons:

**Performance.** A carefully written x86-64 interpreter can outperform any
high-level port. String comparison using SSE4.2 PCMPESTRI processes 16 bytes
per cycle. Hash table probes use SIMD for parallel key comparison. Arithmetic
uses hardware MULQ/DIVQ for the hot path and falls back to software for
arbitrary precision.

**Education.** The escalation ladder -- TypeScript to assembly to GPU -- is a
teaching tool. Understanding the machine at the register level is core to this
project's philosophy. The research series exists to show that every abstraction
can be peeled back to the metal.

**Platform independence (of a kind).** An x86-64 Linux binary using only
syscalls has zero runtime dependencies. No libc, no dynamic linker, no package
manager. The binary runs on any x86-64 Linux kernel. This is the inverse of
portability: instead of running everywhere through abstraction, it runs on one
platform with zero abstraction.

### 11.2 Design Decisions

- **Assembler:** NASM (Netwide Assembler). Intel syntax, good macro system,
  produces ELF64 directly.
- **Calling convention:** System V AMD64 ABI (rdi, rsi, rdx, rcx, r8, r9 for
  args; rax for return; r12-r15, rbx, rbp callee-saved).
- **String representation:** Length-prefixed (8-byte length + data). Not
  null-terminated. Enables REXX strings to contain NUL bytes and allows O(1)
  length queries.
- **Memory model:** Single large arena (`mmap`-allocated). Internal allocator
  uses free lists by size class. No system malloc.
- **Interpreter dispatch:** Indirect threading. Each bytecode instruction is a
  pointer to a handler. The dispatch loop is a single `jmp [rax]`.

---

## 12. x86-64 Interpreter Core

### 12.1 Register Allocation

```
rax  -- general purpose / return value / dispatch target
rbx  -- current clause pointer (callee-saved, stable across calls)
rbp  -- frame pointer (for PROCEDURE stack frames)
rsp  -- stack pointer
r12  -- variable pool base pointer
r13  -- string pool pointer
r14  -- port buffer base pointer
r15  -- NUMERIC DIGITS value (fast access, callee-saved)
rdi  -- first argument (System V)
rsi  -- second argument (System V)
rdx  -- third argument (System V)
rcx  -- fourth argument (System V)
```

### 12.2 Bytecode Format

The parser (which may be in Rust or a separate NASM module) compiles REXX
source into a bytecode stream:

```
Opcode (1 byte) | Operands (variable)
-------------------------------------------
0x01 SAY          (string_ref)
0x02 ASSIGN       (var_ref, string_ref)
0x03 DO_INIT      (control_block_ref)
0x04 DO_TEST      (jump_offset)
0x05 DO_STEP      ()
0x06 DO_END       ()
0x07 IF_TEST      (jump_offset_false)
0x08 CALL         (label_offset, argc)
0x09 RETURN       (string_ref)
0x0A PARSE        (source_type, template_ref)
0x0B ADDRESS      (port_name_ref, command_ref)
0x0C PUSH_STR     (string_ref)
0x0D PUSH_VAR     (var_ref)
0x0E BINOP        (op_type)
0x0F FUNC_CALL    (name_ref, argc)
0x10 INTERPRET    (string_ref)
0x11 SIGNAL       (target_ref)
0x12 NUMERIC      (sub_type, value_ref)
```

### 12.3 Variable Lookup: Hash Table in Assembly

The variable pool uses a hash table with linear probing. Keys are
length-prefixed uppercase strings (REXX variables are case-insensitive).

```nasm
; Hash function: FNV-1a on variable name (uppercase)
; Input:  rdi = pointer to length-prefixed string
; Output: rax = hash value
var_hash:
    mov     rcx, [rdi]          ; rcx = string length
    lea     rsi, [rdi + 8]      ; rsi = string data
    mov     rax, 0xcbf29ce484222325  ; FNV offset basis
    mov     r8,  0x100000001b3       ; FNV prime
.loop:
    test    rcx, rcx
    jz      .done
    movzx   edx, byte [rsi]
    ; Uppercase: if 'a' <= dl <= 'z', subtract 0x20
    cmp     dl, 'a'
    jb      .no_upper
    cmp     dl, 'z'
    ja      .no_upper
    sub     dl, 0x20
.no_upper:
    xor     al, dl              ; FNV-1a: XOR then multiply
    imul    rax, r8
    inc     rsi
    dec     rcx
    jmp     .loop
.done:
    ret

; Variable lookup
; Input:  rdi = pointer to variable name (length-prefixed)
;         r12 = variable pool base
; Output: rax = pointer to value, or 0 if not found
var_lookup:
    push    rbx
    push    r13
    call    var_hash            ; rax = hash
    mov     r13, rax            ; save hash
    mov     rbx, [r12]          ; rbx = table capacity
    dec     rbx                 ; mask = capacity - 1
    and     rax, rbx            ; slot = hash & mask
    shl     rax, 5              ; slot * 32 (entry size: 8 key + 8 val + 8 hash + 8 next)
    lea     rcx, [r12 + 16]     ; table entries start at offset 16
.probe:
    mov     rdx, [rcx + rax + 16] ; stored hash
    test    rdx, rdx
    jz      .not_found          ; empty slot
    cmp     rdx, r13
    jne     .next               ; hash mismatch
    ; Hash matches -- compare keys
    mov     rsi, [rcx + rax]    ; stored key pointer
    push    rax
    push    rcx
    mov     rdi, rdi            ; our key (already in rdi)
    call    str_equal           ; compare length-prefixed strings
    pop     rcx
    pop     rax
    test    al, al
    jnz     .found
.next:
    add     rax, 32             ; next slot
    and     rax, rbx            ; wrap around (mask already in rbx... recalc)
    ; Actually: need to re-derive mask*32. Simplified for clarity.
    jmp     .probe
.found:
    lea     rax, [rcx + rax + 8] ; pointer to value slot
    pop     r13
    pop     rbx
    ret
.not_found:
    xor     eax, eax
    pop     r13
    pop     rbx
    ret
```

### 12.4 String Comparison with SSE4.2

```nasm
; Compare two length-prefixed strings for equality
; Input:  rdi = string A pointer, rsi = string B pointer
; Output: al = 1 if equal, 0 if not
str_equal:
    mov     rcx, [rdi]          ; length A
    cmp     rcx, [rsi]          ; compare lengths
    jne     .not_equal
    test    rcx, rcx
    jz      .equal              ; both empty
    lea     rdi, [rdi + 8]      ; data A
    lea     rsi, [rsi + 8]      ; data B
    ; Use SSE4.2 PCMPESTRI for 16-byte chunks
.sse_loop:
    cmp     rcx, 16
    jb      .byte_loop
    movdqu  xmm0, [rdi]
    movdqu  xmm1, [rsi]
    ; PCMPESTRI: equal each, unsigned bytes, negative polarity
    ; imm8 = 0b00011000 = 0x18
    mov     eax, 16             ; length in eax for explicit length
    mov     edx, 16             ; length in edx
    pcmpestri xmm0, xmm1, 0x18
    jnc     .not_equal          ; CF=0 means mismatch found
    add     rdi, 16
    add     rsi, 16
    sub     rcx, 16
    jmp     .sse_loop
.byte_loop:
    test    rcx, rcx
    jz      .equal
    mov     al, [rdi]
    cmp     al, [rsi]
    jne     .not_equal
    inc     rdi
    inc     rsi
    dec     rcx
    jmp     .byte_loop
.equal:
    mov     al, 1
    ret
.not_equal:
    xor     eax, eax
    ret
```

### 12.5 The SAY Instruction

```nasm
; SAY instruction: evaluate expression, write to stdout, write newline
; Input: rbx = clause pointer (points to string_ref operand)
say_handler:
    ; Get the string to print
    mov     rdi, [rbx + 1]      ; string reference
    call    resolve_string      ; rax = pointer to length-prefixed string
    ; Write string
    mov     rdx, [rax]          ; length
    lea     rsi, [rax + 8]      ; data
    mov     edi, 1              ; fd = stdout
    mov     eax, 1              ; syscall: write
    syscall
    ; Write newline
    lea     rsi, [rel newline]
    mov     edx, 1
    mov     edi, 1
    mov     eax, 1
    syscall
    ; Advance to next instruction
    add     rbx, 9              ; opcode(1) + operand(8)
    jmp     [rbx]               ; indirect threading dispatch

section .rodata
newline: db 10
```

### 12.6 Arbitrary Precision Addition

```nasm
; Add two BCD digit arrays (arbitrary precision)
; Input:  rdi = digit array A (LSB first), rsi = digit array B,
;         rdx = length A, rcx = length B, r8 = result buffer
; Output: rax = result length
bcd_add:
    push    rbx
    push    r12
    ; Determine max length
    mov     r12, rdx
    cmp     rcx, r12
    cmovg   r12, rcx            ; r12 = max(lenA, lenB)
    xor     ebx, ebx            ; carry = 0
    xor     r9d, r9d            ; index = 0
.add_loop:
    cmp     r9, r12
    jge     .add_carry
    ; Get digit A (or 0 if past end)
    xor     eax, eax
    cmp     r9, rdx
    jge     .skip_a
    movzx   eax, byte [rdi + r9]
.skip_a:
    ; Get digit B (or 0 if past end)
    xor     r10d, r10d
    cmp     r9, rcx
    jge     .skip_b
    movzx   r10d, byte [rsi + r9]
.skip_b:
    add     eax, r10d
    add     eax, ebx            ; add carry
    xor     ebx, ebx
    cmp     eax, 10
    jb      .no_carry
    sub     eax, 10
    mov     ebx, 1              ; carry = 1
.no_carry:
    mov     [r8 + r9], al
    inc     r9
    jmp     .add_loop
.add_carry:
    test    ebx, ebx
    jz      .add_done
    mov     byte [r8 + r9], 1
    inc     r9
.add_done:
    mov     rax, r9             ; return length
    pop     r12
    pop     rbx
    ret
```

### 12.7 The DO Loop

```nasm
; DO i = start TO end BY step
; Bytecode: DO_INIT(var_ref, start_ref, end_ref, step_ref)
;           DO_TEST(jump_to_end)
;           ... body ...
;           DO_STEP
;           jmp DO_TEST
;           DO_END
do_init:
    ; Evaluate start, end, step expressions
    mov     rdi, [rbx + 1]      ; var_ref
    mov     rsi, [rbx + 9]      ; start value ref
    call    resolve_string
    call    str_to_number       ; rax = numeric value (internal format)
    ; Store in loop control block on stack
    sub     rsp, 48             ; allocate control block
    mov     [rsp + 0], rdi      ; variable reference
    mov     [rsp + 8], rax      ; current value
    ; ... resolve end and step similarly ...
    mov     [rsp + 16], r10     ; end value
    mov     [rsp + 24], r11     ; step value
    ; Set the loop variable
    call    set_var_numeric
    ; Advance past DO_INIT
    add     rbx, 33             ; 1 + 4*8
    jmp     [rbx]

do_test:
    ; Compare current value to end value
    mov     rax, [rsp + 8]      ; current
    mov     rcx, [rsp + 16]     ; end
    mov     rdx, [rsp + 24]     ; step
    ; If step > 0: test current > end
    ; If step < 0: test current < end
    test    rdx, rdx
    js      .step_neg
    cmp     rax, rcx
    jg      .loop_done
    jmp     .loop_continue
.step_neg:
    cmp     rax, rcx
    jl      .loop_done
.loop_continue:
    add     rbx, 5              ; skip opcode + jump offset
    jmp     [rbx]
.loop_done:
    mov     eax, [rbx + 1]      ; jump offset
    add     rbx, rax
    add     rsp, 48             ; deallocate control block
    jmp     [rbx]

do_step:
    ; Increment current by step
    mov     rax, [rsp + 8]
    add     rax, [rsp + 24]
    mov     [rsp + 8], rax
    ; Update the loop variable
    mov     rdi, [rsp + 0]
    call    set_var_numeric
    ; Jump back to DO_TEST
    sub     rbx, [rbx + 1]      ; jump offset (backwards)
    jmp     [rbx]
```

### 12.8 Port System: Unix Domain Sockets

The assembly interpreter communicates with external ports via Unix domain
sockets. The protocol is simple: send a length-prefixed command string, receive
a length-prefixed result.

```nasm
; Send command to port via Unix domain socket
; Input: rdi = socket fd, rsi = command (length-prefixed string)
port_send:
    ; Send length first (8 bytes)
    mov     rdx, 8              ; length of length field
    mov     eax, 44             ; syscall: sendto
    xor     r10d, r10d          ; flags = 0
    xor     r8d, r8d            ; dest_addr = NULL
    xor     r9d, r9d            ; addrlen = 0
    syscall
    ; Send data
    mov     rdx, [rsi]          ; string length
    lea     rsi, [rsi + 8]      ; string data
    mov     eax, 44
    syscall
    ret

; Receive result from port
; Input: rdi = socket fd, rsi = receive buffer
; Output: rax = pointer to received string (in buffer)
port_recv:
    ; Receive length first
    mov     rdx, 8
    mov     eax, 45             ; syscall: recvfrom
    xor     r10d, r10d
    xor     r8d, r8d
    xor     r9d, r9d
    syscall
    ; Receive data
    mov     rdx, [rsi]          ; received length
    lea     rsi, [rsi + 8]
    mov     eax, 45
    syscall
    lea     rax, [rsi - 8]      ; return pointer to length-prefixed result
    ret
```

---

## 13. Key Assembly Patterns

### 13.1 PARSE Template Matching

The PARSE engine in assembly uses SSE4.2 for literal pattern search:

```nasm
; Search for literal pattern in source string (SSE4.2 accelerated)
; Input: rdi = source (length-prefixed), rsi = pattern (length-prefixed)
;        rdx = start position
; Output: rax = position of match, or -1 if not found
parse_find_literal:
    push    rbx
    push    r12
    push    r13
    mov     r12, [rdi]          ; source length
    mov     r13, [rsi]          ; pattern length
    lea     rdi, [rdi + 8]      ; source data
    lea     rsi, [rsi + 8]      ; pattern data
    add     rdi, rdx            ; start from offset
    sub     r12, rdx            ; remaining length
    ; Load pattern into xmm0 (up to 16 bytes)
    cmp     r13, 16
    ja      .long_pattern       ; pattern > 16 bytes: fallback
    movdqu  xmm0, [rsi]        ; load pattern
.scan:
    cmp     r12, 16
    jb      .short_scan
    movdqu  xmm1, [rdi]        ; load 16 bytes of source
    mov     eax, r13d           ; pattern length in eax
    mov     ecx, 16             ; source chunk length
    ; PCMPESTRI: equal ordered, unsigned bytes
    ; imm8 = 0b00001100 = 0x0C
    pcmpestri xmm0, xmm1, 0x0C
    jc      .found              ; CF=1 means match found at ecx
    add     rdi, 16
    sub     r12, 16
    jmp     .scan
.found:
    ; ecx contains the byte index within the 16-byte chunk
    sub     rdi, rdx            ; calculate absolute position
    ; ... (simplified -- full version handles partial matches at chunk boundaries)
    mov     rax, rcx
    pop     r13
    pop     r12
    pop     rbx
    ret
.short_scan:
    ; Byte-by-byte fallback for remaining < 16 bytes
    ; ... (standard memcmp loop)
.long_pattern:
    ; Multi-pass for patterns > 16 bytes
    ; Match first 16, then verify remainder
    ; ...
.not_found:
    mov     rax, -1
    pop     r13
    pop     r12
    pop     rbx
    ret
```

### 13.2 Function Call (CALL Instruction)

```nasm
; CALL label_name (args...)
; Pushes return address and arguments, jumps to label
call_handler:
    ; Save return address (next instruction)
    lea     rax, [rbx + 9]      ; address after CALL instruction
    push    rax                  ; return address on stack
    ; Push argument count
    movzx   ecx, byte [rbx + 9] ; argc
    push    rcx
    ; Arguments are already evaluated and on the operand stack
    ; Jump to target label
    mov     rax, [rbx + 1]      ; label offset
    lea     rbx, [r12 + rax]    ; absolute address (code base + offset)
    jmp     [rbx]

return_handler:
    ; Pop argument count
    pop     rcx
    ; Pop return address
    pop     rbx                  ; restore instruction pointer
    ; Result is in the RESULT variable (set by evaluator)
    jmp     [rbx]
```

---

## 14. Memory Layout

```
+========================+  0x00000000
|   ELF Header           |  (loaded by kernel)
+------------------------+
|   .text (code)         |  Bytecode handlers, built-in functions
|                        |  Estimated: 32-64 KB
+------------------------+
|   .rodata              |  Instruction dispatch table, constant strings,
|                        |  built-in function names, error messages
|                        |  Estimated: 8-16 KB
+========================+
|                        |
|   Arena (mmap)         |  Single large allocation, subdivided:
|                        |
|   +------------------+ |
|   | Bytecode buffer  | |  Compiled REXX bytecode
|   | (128 KB)         | |  One contiguous stream per program
|   +------------------+ |
|   | String pool      | |  Immutable interned strings
|   | (1 MB)           | |  Length-prefixed, deduplication via hash
|   +------------------+ |
|   | Variable pool    | |  Hash table: name -> value pointer
|   | (512 KB)         | |  Open addressing, linear probing
|   +------------------+ |  Grows by doubling when load > 0.7
|   | Scope stack      | |
|   | (64 KB)          | |  PROCEDURE frames: saved variable pool snapshots
|   +------------------+ |  EXPOSE entries: pointers into parent frame
|   | DO nesting stack | |
|   | (16 KB)          | |  Loop control blocks: current/end/step/variable
|   +------------------+ |
|   | Operand stack    | |
|   | (64 KB)          | |  Expression evaluation: string pointers
|   +------------------+ |
|   | Port buffers     | |
|   | (256 KB)         | |  Shared memory regions for IPC
|   +------------------+ |  One 4 KB page per registered port
|   | Heap             | |
|   | (grows upward)   | |  Dynamic: stem expansions, INTERPRET compilation,
|   |                  | |  large string operations, temporary buffers
|   +------------------+ |
|                        |
+========================+

Total arena default: 4 MB (configurable via command line)
```

### 14.1 String Pool Design

Strings are the fundamental data type. The pool uses content-addressable
storage (hash of contents) for automatic deduplication:

```
String entry layout (variable size):
+--------+--------+------ ... ------+--------+
| Hash   | Length | Data bytes      | Padding|
| 8 bytes| 8 bytes| Length bytes    | to 8   |
+--------+--------+------ ... ------+--------+
```

Every string operation that produces a new value (concatenation, SUBSTR,
OVERLAY, etc.) first checks the pool. If the result already exists, a pointer
to the existing entry is returned. This is safe because REXX strings are
immutable -- variables hold pointers to pool entries, and assignment changes
the pointer, not the string.

### 14.2 Estimated LOC

- **NASM core** (dispatch, handlers, arithmetic, strings): ~6,000 lines
- **NASM PARSE engine**: ~1,500 lines
- **NASM port system**: ~800 lines
- **NASM built-in functions** (70+): ~4,000 lines
- **Rust bridge** (I/O, mmap, socket, MCP client): ~2,000 lines
- **Tests** (combination of Rust integration tests and REXX test scripts):
  ~3,000 lines

**Total: ~17,000 lines.**

---

## 15. Stage 3: CUDA GPU Runtime

### 15.1 Why GPU?

Three properties of REXX make it surprisingly suitable for GPU execution:

1. **Arbitrary precision arithmetic is embarrassingly parallel.** A 1000-digit
   addition is 1000 independent single-digit additions followed by a carry
   propagation (which is a parallel prefix scan). NVIDIA's CGBN library
   already implements this using cooperative groups within a warp.

2. **REXX scripts are self-contained.** Each script has its own variable pool,
   its own scope stack, its own control flow. A thousand scripts running
   simultaneously share no mutable state. This maps directly to CUDA's
   execution model: one thread block per script.

3. **The port system maps to GPU-CPU communication.** GPU kernels cannot
   perform I/O or network operations directly. But ARexx's ADDRESS instruction
   already assumes asynchronous message passing: send a command, wait for a
   reply. On the GPU, "wait" means yield the warp until a result appears in a
   global memory buffer. The CPU handles actual dispatch.

### 15.2 Execution Model

```
+===========================+
|         GPU               |
|                           |
|  Block 0    Block 1    Block N
|  Script 0   Script 1   Script N
|  +-------+  +-------+  +-------+
|  |Shared |  |Shared |  |Shared |
|  |Memory |  |Memory |  |Memory |
|  |VarPool|  |VarPool|  |VarPool|
|  +-------+  +-------+  +-------+
|       \         |         /
|        +--------+--------+
|        | Global Memory   |
|        | String Pool     |
|        | Port Buffers    |
|        | Bytecode        |
|        +---------+-------+
|                  |
+==================|========+
                   |
          +--------+--------+
          | CPU Host        |
          | Port Dispatch   |
          | MCP Client      |
          | I/O Handler     |
          +-----------------+
```

### 15.3 Thread Block Layout

Each CUDA thread block executes one REXX script:

- **Block dimensions:** 32 threads (one warp) for simple scripts. 128 threads
  (4 warps) for scripts using heavy arithmetic or PARSE.
- **Shared memory (48 KB per block on Ada Lovelace):**
  - Variable pool hash table: 16 KB (256 entries * 64 bytes)
  - Operand stack: 4 KB
  - Scope stack: 4 KB
  - PARSE workspace: 8 KB
  - Scratch space: 16 KB
- **Registers:** 255 per thread (sufficient for the interpreter dispatch loop)

### 15.4 The INTERPRET Problem

REXX's INTERPRET instruction evaluates a dynamically constructed string as
code. On a CPU, this means parsing and compiling at runtime. On a GPU, dynamic
compilation is not possible -- there is no runtime compiler on the device.

**Solution: pre-compilation with dispatch table.**

Before launching the GPU kernel, the host analyzes all scripts for INTERPRET
usage. Static analysis identifies possible INTERPRET targets (when the
argument is a constant or can be determined from data flow). All identified
targets are pre-compiled into device functions and stored in a dispatch table
in global memory.

At runtime, INTERPRET computes a hash of its argument string and looks up the
dispatch table. If found, it calls the pre-compiled device function. If not
found, it sets RC=1 (error) and continues. This is a pragmatic compromise:
fully dynamic INTERPRET is not possible on GPU, but the vast majority of
real-world INTERPRET usage is quasi-static.

```c
// Host-side: build dispatch table
struct InterpretEntry {
    uint64_t hash;           // FNV-1a hash of source string
    void (*handler)(RexxState*);  // device function pointer
};

__constant__ InterpretEntry interpret_table[MAX_INTERPRET_ENTRIES];

// Device-side: INTERPRET handler
__device__ void gpu_interpret(RexxState* state, const char* source, int len) {
    uint64_t hash = fnv1a_hash(source, len);
    for (int i = 0; i < interpret_table_size; i++) {
        if (interpret_table[i].hash == hash) {
            interpret_table[i].handler(state);
            return;
        }
    }
    state->rc = 1;  // INTERPRET target not pre-compiled
}
```

### 15.5 Memory Hierarchy Mapping

```
+--------------------+----------+------------------+---------------------+
| REXX Concept       | CPU Impl | GPU Impl         | Notes               |
+--------------------+----------+------------------+---------------------+
| Simple variable    | Hash     | Shared memory    | 48KB limit per      |
|                    | table    | hash table       | block               |
+--------------------+----------+------------------+---------------------+
| Stem compound var  | Hash     | Global memory    | Too large for       |
|                    | table    | hash table       | shared; cached      |
+--------------------+----------+------------------+---------------------+
| String value       | Heap     | Fixed-size       | 256B default,       |
|                    | alloc    | buffer in        | configurable up     |
|                    |          | shared/global    | to 4KB              |
+--------------------+----------+------------------+---------------------+
| NUMERIC DIGITS     | BigInt   | Warp-cooperative | CGBN: up to 32K     |
| (arb. precision)   | library  | digit array      | bits per group      |
+--------------------+----------+------------------+---------------------+
| Port message       | Socket/  | Global memory    | CPU polls and       |
|                    | SHM buf  | ring buffer      | dispatches          |
+--------------------+----------+------------------+---------------------+
| INTERPRET target   | Runtime  | Dispatch table   | Pre-compiled by     |
|                    | parse    | lookup           | host                |
+--------------------+----------+------------------+---------------------+
| PARSE template     | CPU      | Warp-cooperative | 32 threads scan     |
|                    | function | parallel scan    | 32 chars at once    |
+--------------------+----------+------------------+---------------------+
| DO loop            | IP       | Thread-local     | Standard control    |
|                    | counter  | IP + registers   | flow                |
+--------------------+----------+------------------+---------------------+
```

---

## 16. GPU String Operations

### 16.1 The String Challenge

REXX's string-centric model is the biggest challenge for GPU implementation.
GPUs are optimized for regular, predictable memory access patterns. Strings are
variable-length, heap-allocated, and accessed in unpredictable patterns.

**Solution: fixed-size string slots.**

Each REXX variable on the GPU occupies a fixed-size slot (default 256 bytes:
8-byte length + 248 bytes data). This eliminates dynamic allocation entirely.
The trade-off is memory waste for short strings and truncation for long strings.
For batch processing workloads (the primary GPU use case), this is acceptable.

```c
#define REXX_STR_SLOT_SIZE 256
#define REXX_STR_MAX_LEN   (REXX_STR_SLOT_SIZE - 8)

struct RexxGpuString {
    int64_t length;
    char    data[REXX_STR_MAX_LEN];
};
```

### 16.2 Warp-Cooperative String Operations

A warp (32 threads) can cooperatively process string operations:

**String comparison (32 bytes at a time):**

```c
__device__ bool rexx_str_equal(
    const RexxGpuString* a,
    const RexxGpuString* b,
    int lane_id   // threadIdx.x % 32
) {
    if (a->length != b->length) return false;

    int len = a->length;
    int chunks = (len + 31) / 32;
    bool match = true;

    for (int chunk = 0; chunk < chunks && match; chunk++) {
        int pos = chunk * 32 + lane_id;
        char ca = (pos < len) ? a->data[pos] : 0;
        char cb = (pos < len) ? b->data[pos] : 0;
        // Each thread compares one byte
        unsigned ballot = __ballot_sync(0xFFFFFFFF, ca == cb);
        // All threads must agree
        if (ballot != 0xFFFFFFFF) match = false;
    }
    return match;
}
```

**String concatenation:**

```c
__device__ void rexx_str_concat(
    RexxGpuString* result,
    const RexxGpuString* a,
    const RexxGpuString* b,
    int lane_id
) {
    int total = min((int64_t)(a->length + b->length), (int64_t)REXX_STR_MAX_LEN);
    if (lane_id == 0) result->length = total;

    // Copy string A: 32 threads copy 32 bytes per iteration
    int chunks_a = (a->length + 31) / 32;
    for (int c = 0; c < chunks_a; c++) {
        int pos = c * 32 + lane_id;
        if (pos < a->length && pos < REXX_STR_MAX_LEN) {
            result->data[pos] = a->data[pos];
        }
    }

    // Copy string B: offset by a->length
    int chunks_b = (b->length + 31) / 32;
    for (int c = 0; c < chunks_b; c++) {
        int pos = c * 32 + lane_id;
        int dest = a->length + pos;
        if (pos < b->length && dest < REXX_STR_MAX_LEN) {
            result->data[dest] = b->data[pos];
        }
    }
}
```

### 16.3 NUMERIC DIGITS on GPU

Using NVIDIA's CGBN (Cooperative Groups Big Numbers) library:

```c
#include <cgbn/cgbn.h>

// 1024-bit numbers using 32 threads per instance
typedef cgbn_context_t<32> context_t;  // TPI = 32 (threads per instance)
typedef cgbn_env_t<context_t, 1024> env1024_t;

__device__ void rexx_add_bignum(
    env1024_t::cgbn_t& result,
    const env1024_t::cgbn_t& a,
    const env1024_t::cgbn_t& b,
    context_t& context
) {
    env1024_t bn_env(context);
    bn_env.add(result, a, b);
}
```

For REXX's decimal arithmetic, the numbers must be converted from decimal
string representation to binary (for CGBN operations), then back to decimal
string for the result. This conversion is itself parallelizable:

```c
// Decimal string to binary: each thread processes one digit
__device__ void decimal_to_binary(
    env1024_t::cgbn_t& result,
    const char* digits,
    int num_digits,
    context_t& context,
    int lane_id
) {
    env1024_t bn_env(context);
    env1024_t::cgbn_t ten, digit_val, power, temp;

    bn_env.set_ui32(result, 0);
    bn_env.set_ui32(ten, 10);
    bn_env.set_ui32(power, 1);

    // Process from least significant digit
    for (int i = num_digits - 1; i >= 0; i--) {
        int d = digits[i] - '0';
        bn_env.set_ui32(digit_val, d);
        bn_env.mul(temp, digit_val, power);
        bn_env.add(result, result, temp);
        bn_env.mul(power, power, ten);
    }
}
```

---

## 17. GPU Port System

### 17.1 Architecture

GPU kernels cannot perform I/O. The port system uses a two-phase protocol
with global memory buffers as the communication channel:

```
Phase 1: GPU writes request to global memory
Phase 2: CPU reads request, dispatches to port, writes result
Phase 3: GPU reads result from global memory

+============+     +================+     +============+
|  GPU       |     | Global Memory  |     | CPU        |
|  Kernel    |     |                |     | Host       |
|            |     | Request Ring   |     |            |
|  ADDRESS-->|---->| [cmd, args]    |---->|-->Port     |
|            |     |                |     |   Dispatch |
|  RESULT <--|<----| [rc, result]   |<----|<--MCP Call |
|            |     |                |     |            |
|  (yield    |     | Status Flags   |     | (poll      |
|   warp)    |     | [pending/done] |     |  flags)    |
+============+     +================+     +============+
```

### 17.2 Ring Buffer Protocol

```c
#define PORT_SLOTS 1024
#define PORT_CMD_SIZE 512
#define PORT_RESULT_SIZE 4096

struct PortRequest {
    volatile int     status;      // 0=empty, 1=pending, 2=complete
    int              block_id;    // which thread block sent this
    int              port_id;     // target port index
    int              cmd_len;
    char             command[PORT_CMD_SIZE];
    int              rc;
    int              result_len;
    char             result[PORT_RESULT_SIZE];
};

__device__ PortRequest* port_ring;  // global memory
__device__ volatile int port_ring_head;
__device__ volatile int port_ring_tail;

// GPU-side: send command to port
__device__ int gpu_port_send(
    int port_id,
    const char* command,
    int cmd_len,
    char* result_buf,
    int* result_len
) {
    // Only lane 0 does the actual send
    int lane_id = threadIdx.x % 32;
    int slot;

    if (lane_id == 0) {
        // Claim a slot (atomic increment)
        slot = atomicAdd((int*)&port_ring_head, 1) % PORT_SLOTS;

        // Fill request
        port_ring[slot].block_id = blockIdx.x;
        port_ring[slot].port_id = port_id;
        port_ring[slot].cmd_len = cmd_len;
        memcpy(port_ring[slot].command, command, cmd_len);
        __threadfence();  // ensure writes visible before status change
        port_ring[slot].status = 1;  // mark as pending
    }

    // Broadcast slot to all threads in warp
    slot = __shfl_sync(0xFFFFFFFF, slot, 0);

    // Wait for result (spin on status)
    // In practice, yield the warp to allow other blocks to run
    if (lane_id == 0) {
        while (port_ring[slot].status != 2) {
            // Yield hint -- allows scheduler to run other warps
            __nanosleep(1000);
        }
    }
    __syncwarp();

    // Copy result
    int rc = port_ring[slot].rc;
    *result_len = port_ring[slot].result_len;
    // Warp-cooperative copy
    int chunks = (*result_len + 31) / 32;
    for (int c = 0; c < chunks; c++) {
        int pos = c * 32 + lane_id;
        if (pos < *result_len) {
            result_buf[pos] = port_ring[slot].result[pos];
        }
    }

    // Release slot
    if (lane_id == 0) {
        port_ring[slot].status = 0;
    }

    return rc;
}
```

### 17.3 CPU-Side Dispatch Loop

```c
// Host thread: poll GPU port requests and dispatch
void port_dispatch_loop(PortRequest* host_ring, PortRegistry* registry) {
    while (!shutdown_requested) {
        for (int i = 0; i < PORT_SLOTS; i++) {
            if (host_ring[i].status == 1) {
                // Read command
                std::string cmd(host_ring[i].command, host_ring[i].cmd_len);
                int port_id = host_ring[i].port_id;

                // Dispatch to port (may be MCP tool call, file I/O, etc.)
                PortResult result = registry->dispatch(port_id, cmd);

                // Write result back
                host_ring[i].rc = result.rc;
                host_ring[i].result_len = result.data.size();
                memcpy(host_ring[i].result, result.data.c_str(),
                       result.data.size());

                // Memory fence + mark complete
                __sync_synchronize();
                host_ring[i].status = 2;
            }
        }
        // Brief yield to avoid burning CPU
        std::this_thread::sleep_for(std::chrono::microseconds(100));
    }
}
```

---

## 18. Batch REXX Execution

### 18.1 The Power of GPU REXX

The real value of a GPU REXX runtime is not running a single script faster. It
is running thousands of scripts simultaneously. Each script is a variant of a
template with different input data.

**Use case: parameter sweep.**

```rexx
/* sweep_template.rexx -- executed 10,000 times with different params */
PARSE ARG alpha beta gamma
NUMERIC DIGITS 50

result = SIN(alpha) * COS(beta) + TAN(gamma)
result = result ** 2.5

ADDRESS 'collector' 'STORE' alpha beta gamma result
```

Launched as:

```c
// Host code: launch 10,000 instances
dim3 grid(10000);       // 10,000 blocks
dim3 block(32);         // 32 threads per block (1 warp)

// Pre-load bytecode into GPU global memory
cudaMemcpy(d_bytecode, bytecode, bytecode_size, cudaMemcpyHostToDevice);

// Pre-load parameter sets
cudaMemcpy(d_params, param_sets, 10000 * sizeof(ParamSet), cudaMemcpyHostToDevice);

// Launch
rexx_interpreter_kernel<<<grid, block>>>(
    d_bytecode,
    d_params,
    d_port_ring,
    d_string_pool
);
```

### 18.2 Kernel Structure

```c
__global__ void rexx_interpreter_kernel(
    const uint8_t*   bytecode,
    const ParamSet*  params,
    PortRequest*     port_ring,
    char*            string_pool
) {
    int script_id = blockIdx.x;
    int lane_id = threadIdx.x % 32;

    // Each block gets its own state in shared memory
    __shared__ RexxState state;
    __shared__ RexxGpuString var_pool[256];  // 256 variables max
    __shared__ int scope_stack[16];
    __shared__ uint8_t operand_stack[4096];

    if (lane_id == 0) {
        // Initialize state
        state.ip = 0;
        state.rc = 0;
        state.numeric_digits = 9;
        state.var_count = 0;

        // Load parameters as ARG
        load_arg(&state, &params[script_id]);
    }
    __syncwarp();

    // Main dispatch loop
    while (true) {
        uint8_t opcode = bytecode[state.ip];

        switch (opcode) {
            case OP_SAY:
                gpu_say(&state, var_pool, bytecode, lane_id);
                break;
            case OP_ASSIGN:
                gpu_assign(&state, var_pool, bytecode, lane_id);
                break;
            case OP_PARSE:
                gpu_parse(&state, var_pool, bytecode, lane_id);
                break;
            case OP_BINOP:
                gpu_binop(&state, var_pool, bytecode, lane_id);
                break;
            case OP_ADDRESS:
                gpu_address(&state, var_pool, bytecode, port_ring, lane_id);
                break;
            case OP_DO_INIT:
                gpu_do_init(&state, var_pool, bytecode, lane_id);
                break;
            case OP_DO_TEST:
                gpu_do_test(&state, bytecode, lane_id);
                break;
            case OP_EXIT:
                return;
            // ... all other opcodes
        }
        __syncwarp();  // keep warp synchronized between instructions
    }
}
```

### 18.3 Warp-Cooperative PARSE on GPU

The PARSE engine uses all 32 threads in a warp for parallel pattern search:

```c
__device__ int gpu_find_literal(
    const char* source, int source_len,
    const char* pattern, int pattern_len,
    int start_pos,
    int lane_id
) {
    // Each thread checks one starting position
    // 32 positions checked per iteration
    for (int base = start_pos; base < source_len; base += 32) {
        int pos = base + lane_id;
        bool match = true;

        if (pos + pattern_len <= source_len) {
            for (int j = 0; j < pattern_len && match; j++) {
                if (source[pos + j] != pattern[j]) match = false;
            }
        } else {
            match = false;
        }

        // Find first matching position in warp
        unsigned ballot = __ballot_sync(0xFFFFFFFF, match);
        if (ballot != 0) {
            return base + __ffs(ballot) - 1;  // first set bit
        }
    }
    return -1;  // not found
}
```

### 18.4 Performance Projections

On an NVIDIA RTX 4090 (128 SMs, 16,384 CUDA cores):

| Metric | Value |
|--------|-------|
| Max concurrent scripts (32 threads each) | ~4,096 |
| Max concurrent scripts (128 threads each) | ~1,024 |
| Shared memory per SM | 100 KB (configurable) |
| Global memory for string pool | Up to 24 GB |
| Port ring buffer latency (GPU<->CPU) | ~10-50 microseconds |
| Throughput (simple scripts, no port calls) | ~50,000 scripts/second |
| Throughput (with port calls, 1 per script) | ~5,000 scripts/second |

### 18.5 Estimated LOC

- **CUDA kernels** (interpreter, string ops, PARSE, arithmetic): ~5,000 lines
- **C++ host** (memory management, kernel launch, port dispatch): ~3,000 lines
- **CGBN integration** (arbitrary precision bridge): ~1,000 lines
- **Pre-compiler** (INTERPRET analysis, bytecode generation): ~2,000 lines
- **Tests** (host-side validation, GPU result verification): ~2,000 lines

**Total: ~13,000 lines.**

---

## 19. Cross-Stage Integration

### 19.1 The Escalation Ladder

```
+------------------------------------------------------------------+
|                    GSD-OS Integration Layer                       |
|                                                                   |
|  +------------------+  +------------------+  +------------------+ |
|  | Stage 1          |  | Stage 2          |  | Stage 3          | |
|  | TypeScript       |  | x86-64 Assembly  |  | CUDA GPU         | |
|  |                  |  |                  |  |                  | |
|  | - MCP native     |  | - Bare metal     |  | - Batch parallel | |
|  | - Easy debug     |  | - Peak perf      |  | - Math focus     | |
|  | - Full REXX      |  | - Full REXX      |  | - Subset REXX    | |
|  | - INTERPRET: yes |  | - INTERPRET: yes |  | - INTERPRET: ltd | |
|  |                  |  |                  |  |                  | |
|  | Use: prototyping |  | Use: production  |  | Use: compute     | |
|  |   scripting      |  |   servers        |  |   Monte Carlo    | |
|  |   MCP tools      |  |   CLI tools      |  |   sweeps         | |
|  +--------+---------+  +--------+---------+  +--------+---------+ |
|           |                     |                     |           |
|           +----------+----------+----------+----------+           |
|                      |                     |                      |
|               +------+------+       +------+------+               |
|               | Port Bridge |       | Port Bridge |               |
|               | TS <-> ASM  |       | ASM <-> GPU |               |
|               +------+------+       +------+------+               |
|                      |                     |                      |
|               +------+---------------------+------+               |
|               |      Unified Port Registry        |               |
|               |   (MCP tools + native ports +     |               |
|               |    GPU compute ports)             |               |
|               +-----------------------------------+               |
+------------------------------------------------------------------+
```

### 19.2 Cross-Stage Port Communication

A REXX script in Stage 1 (TypeScript) can call a compute-intensive function
that executes on Stage 3 (GPU). The port system handles the routing:

```rexx
/* hybrid.rexx -- runs in TypeScript interpreter */
/* Send a batch job to the GPU REXX runtime */

ADDRESS 'gpu-rexx'
'BATCH sweep_template.rexx params.csv 10000'

IF RC = 0 THEN DO
  PARSE VAR RESULT count mean stddev
  SAY 'Processed' count 'parameter sets'
  SAY 'Mean result:' mean
  SAY 'Std deviation:' stddev
END
```

The `gpu-rexx` port adapter:
1. Receives the BATCH command
2. Loads the template script and parameter CSV
3. Compiles bytecode
4. Launches the CUDA kernel
5. Collects results
6. Returns summary statistics as the RESULT string

### 19.3 The Unified Port Registry

```typescript
class UnifiedPortRegistry {
  private local = new Map<string, RexxPort>();          // TS ports
  private native = new Map<string, NativePortHandle>(); // x86-64 via FFI
  private gpu = new Map<string, GpuPortHandle>();       // CUDA ports
  private mcp = new Map<string, McpPortAdapter>();      // MCP tools

  async dispatch(portName: string, command: string): Promise<RexxPortResult> {
    // Check all registries in priority order
    const local = this.local.get(portName);
    if (local) return local.handler(command, []);

    const mcp = this.mcp.get(portName);
    if (mcp) return mcp.handler(command, []);

    const native = this.native.get(portName);
    if (native) return this.dispatchNative(native, command);

    const gpu = this.gpu.get(portName);
    if (gpu) return this.dispatchGpu(gpu, command);

    return { rc: 1, error: `Port not found: ${portName}` };
  }
}
```

---

## 20. Estimated Effort and LOC

### 20.1 Summary Table

```
+------------------+-------------+----------+----------+-----------+
| Component        | Language    | LOC Est. | Tests    | Effort    |
+------------------+-------------+----------+----------+-----------+
| Stage 1 Core     | TypeScript  | 8,000    | 3,000    | 6 weeks   |
|   Lexer          |             | 800      | 400      |           |
|   Parser         |             | 1,500    | 600      |           |
|   AST            |             | 400      | --       |           |
|   Evaluator      |             | 1,200    | 500      |           |
|   Arithmetic     |             | 1,000    | 400      |           |
|   PARSE engine   |             | 1,200    | 500      |           |
|   Variables      |             | 600      | 300      |           |
|   Builtins (70+) |             | 1,000    | 200      |           |
|   Ports          |             | 300      | 100      |           |
+------------------+-------------+----------+----------+-----------+
| Stage 1 MCP      | TypeScript  | 2,000    | 1,000    | 2 weeks   |
|   Port bridge    |             | 800      | 400      |           |
|   Tool register  |             | 600      | 300      |           |
|   CLI / REPL     |             | 600      | 300      |           |
+------------------+-------------+----------+----------+-----------+
| Stage 2 Core     | NASM        | 12,000   | --       | 10 weeks  |
|   Dispatch       |             | 1,000    |          |           |
|   Handlers       |             | 3,000    |          |           |
|   Arithmetic     |             | 2,000    |          |           |
|   Strings/SSE    |             | 1,500    |          |           |
|   PARSE engine   |             | 1,500    |          |           |
|   Builtins       |             | 2,000    |          |           |
|   Port system    |             | 1,000    |          |           |
+------------------+-------------+----------+----------+-----------+
| Stage 2 Bridge   | Rust        | 2,000    | 1,000    | 3 weeks   |
|   FFI layer      |             | 500      | 200      |           |
|   I/O + mmap     |             | 500      | 200      |           |
|   MCP client     |             | 500      | 300      |           |
|   Socket layer   |             | 500      | 300      |           |
+------------------+-------------+----------+----------+-----------+
| Stage 2 Tests    | REXX + Rust | --       | 3,000    | (overlap) |
+------------------+-------------+----------+----------+-----------+
| Stage 3 Core     | CUDA C++    | 8,000    | --       | 8 weeks   |
|   Kernel interp  |             | 3,000    |          |           |
|   String ops     |             | 1,000    |          |           |
|   PARSE (GPU)    |             | 1,000    |          |           |
|   CGBN bridge    |             | 1,000    |          |           |
|   Port ring buf  |             | 1,000    |          |           |
|   Pre-compiler   |             | 1,000    |          |           |
+------------------+-------------+----------+----------+-----------+
| Stage 3 Host     | C++         | 3,000    | 2,000    | 4 weeks   |
|   Kernel launch  |             | 800      | 400      |           |
|   Memory mgmt    |             | 800      | 400      |           |
|   Port dispatch  |             | 600      | 400      |           |
|   Result collect |             | 800      | 800      |           |
+------------------+-------------+----------+----------+-----------+
| Integration      | Mixed       | 2,000    | 1,000    | 3 weeks   |
|   Unified ports  |             | 800      | 400      |           |
|   Cross-stage    |             | 600      | 300      |           |
|   CLI + config   |             | 600      | 300      |           |
+------------------+-------------+----------+----------+-----------+
| TOTAL            |             | ~37,000  | ~11,000  | ~36 weeks |
+------------------+-------------+----------+----------+-----------+
```

### 20.2 Phasing

- **Phase A (Stage 1):** 8 weeks. Delivers a working REXX interpreter in
  TypeScript with MCP integration. Can be used immediately.
- **Phase B (Stage 2):** 13 weeks. Delivers a native x86-64 interpreter.
  Depends on Phase A for test suite (REXX scripts that validate correctness).
- **Phase C (Stage 3):** 12 weeks. Delivers GPU batch execution. Depends on
  Phase B for bytecode format specification.
- **Phase D (Integration):** 3 weeks. Unifies all three stages under the
  common port registry. Can overlap with Phase C.

---

## 21. Technical Challenges and Mitigations

### 21.1 Challenge: REXX's Ambiguous Grammar

**Problem:** Without reserved words, the parser cannot determine clause type
from the first token alone. `IF = 3` is a valid assignment. `IF x THEN SAY x`
is a conditional. The parser needs lookahead.

**Mitigation:** Two-token lookahead. If token[1] is `=` (and not `==`), the
clause is an assignment regardless of what token[0] is. This rule has no
exceptions in the ANSI standard.

### 21.2 Challenge: INTERPRET on GPU

**Problem:** INTERPRET requires runtime parsing and compilation, which is
impossible on CUDA devices.

**Mitigation:** Static analysis pre-compilation (Section 15.4). For scripts
that use truly dynamic INTERPRET (rare in practice), fall back to CPU execution.
The GPU runtime signals `RC=1` for unresolvable INTERPRET, and the host can
re-execute the script on the CPU interpreter.

### 21.3 Challenge: Arbitrary Precision on GPU

**Problem:** CGBN supports up to 32K bits, which is approximately 9,600 decimal
digits. REXX's NUMERIC DIGITS has no theoretical upper limit.

**Mitigation:** For GPU execution, enforce a configurable maximum (default 1000
digits, max 9600). Scripts requiring more precision are routed to the CPU
interpreter. In practice, even 1000-digit arithmetic covers nearly all use
cases. The CPU path with GMP has no limit.

### 21.4 Challenge: String Length on GPU

**Problem:** Fixed-size string slots (256 bytes default) may be too small for
some REXX programs that manipulate large strings.

**Mitigation:** Configurable slot size up to 4 KB. For scripts that require
larger strings, use global memory with a per-block heap allocator (slower but
unbounded). The compiler can analyze string operations at compile time and
select the appropriate strategy per script.

### 21.5 Challenge: Port Latency on GPU

**Problem:** GPU-to-CPU port communication has microsecond-scale latency. If
every REXX instruction involves a port call, the GPU advantage disappears.

**Mitigation:** GPU REXX is designed for compute-heavy scripts with infrequent
port calls (typically one ADDRESS at the end to report results). Scripts with
frequent port interaction should run on the CPU stages. The launcher can
analyze scripts and route them to the appropriate stage automatically.

### 21.6 Challenge: SSE4.2 Availability

**Problem:** The PCMPESTRI-based string operations in Stage 2 require SSE4.2,
which is available on all Intel CPUs since Nehalem (2008) and all AMD CPUs
since Bulldozer (2011), but not on pre-2008 hardware.

**Mitigation:** Runtime CPU feature detection (CPUID). Fall back to REPCMPSB
scalar loop if SSE4.2 is unavailable. In practice, any x86-64 system from the
last 18 years has SSE4.2.

### 21.7 Challenge: SIGNAL and Condition Handling

**Problem:** REXX's SIGNAL instruction is a non-local transfer of control
(similar to exceptions). It can jump to any label in the program, and
conditions like SYNTAX, NOVALUE, and ERROR can trigger at any point.

**Mitigation:**
- In TypeScript (Stage 1): Use JavaScript exceptions. Each SIGNAL throws a
  `RexxSignalError` caught by a top-level handler that redirects to the target
  label.
- In x86-64 (Stage 2): Maintain a condition handler table in the arena.
  SIGNAL performs a longjmp-style register restore to the handler entry point.
- In CUDA (Stage 3): Condition handlers set a flag in shared memory. The
  dispatch loop checks the flag between instructions and redirects as needed.
  True SIGNAL ON/OFF is supported; SIGNAL VALUE (computed target) requires
  pre-compilation of all possible targets.

### 21.8 Challenge: Thread Safety in TypeScript

**Problem:** The TypeScript interpreter must support multiple concurrent REXX
scripts, each with their own variable pool, communicating via ports.

**Mitigation:** Each `RexxInterpreter` instance is fully isolated. The port
registry is the only shared state, protected by the event loop's single-
threaded nature (no locks needed in Node.js). For true parallelism, use
`worker_threads` with the port registry in the main thread and interpreters
in workers communicating via `MessagePort`.

---

## 22. References

### Primary Sources

- Cowlishaw, M.F. "The Design of the REXX Language." *IBM Systems Journal*,
  Vol 23, No 4, 1984. Available at:
  https://www.cs.tufts.edu/~nr/cs257/archive/mike-cowlishaw/rexx.pdf

- ANSI X3.274-1996. "Information Technology -- Programming Language REXX."
  Available at: https://www.rexxla.org/rexxlang/standards/j18pub.pdf

- Hawes, William S. *ARexx User's Reference Manual 1.0*. 1987. Archived at:
  https://archive.org/details/ARexx_Users_Reference_Manual_1.0_1987_Hawes_William_S.

### Implementations

- BRexx (Vasilis Vlachoudis, CERN): https://github.com/vlachoudis/brexx
  ANSI C, smallest and fastest Classic Rexx implementation.

- Regina REXX (Mark Hessling): https://regina-rexx.sourceforge.io/
  100% ANSI compliant, widest platform support.

- ANTLR REXX Grammar: https://github.com/antlr/grammars-v4/blob/master/rexx/RexxParser.g4
  Formal grammar definition for parser generation.

### x86-64 Assembly

- SSE4.2 String Instructions: https://www.strchr.com/strcmp_and_strlen_using_sse_4.2
  NASM implementations of strcmp, strlen, strstr using PCMPESTRI.

- SSE String Functions for x86-64 Linux: https://github.com/aklomp/sse-strings
  Production-quality NASM implementations.

- PCMPESTRI Reference: https://hjlebbink.github.io/x86doc/html/PCMPESTRI.html
  Intel instruction documentation.

### CUDA and GPU Arithmetic

- CGBN (NVlabs): https://github.com/NVlabs/CGBN
  Cooperative Groups Big Numbers. Warp-cooperative arbitrary precision.

- GPU Implementations for Midsize Integer Addition and Multiplication:
  https://arxiv.org/html/2405.14642v1

- Langer, B. "Arbitrary-Precision Arithmetics on the GPU." CESCG 2015.
  https://old.cescg.org/CESCG-2015/papers/Langer-Arbitrary-Precision_Arithmetics_on_the_GPU.pdf

- CUDA C++ Programming Guide:
  https://docs.nvidia.com/cuda/cuda-c-programming-guide/index.html

### REXX Tutorials and References

- PARSE Instruction Tutorial:
  https://rexxinfo.org/tutorials/articles/kilowatt_tutorial/Parse.html

- PARSE Template Deep Dive:
  https://www.bracksco.com/personal/rexxparse.html

- REXX Numbers and Arithmetic:
  http://www.manmrk.net/tutorials/rexx/oorexx/rexxref42/numarit.html

- ARexx IPC Architecture:
  https://wiki.amigaos.net/wiki/AmigaOS_Manual:_ARexx_Introducing_ARexx

- ARexx Programming Tutorial:
  https://pjhutchison.org/tutorial/arexx.html

### MCP (Model Context Protocol)

- MCP Specification: https://modelcontextprotocol.io/

- MCP TypeScript SDK: https://github.com/modelcontextprotocol/typescript-sdk

---

## Appendix A: REXX Built-in Functions (70+ requiring implementation)

```
String functions:
  ABBREV  CENTER  CHANGESTR  COMPARE  COPIES  COUNTSTR
  DELSTR  DELWORD  INSERT  LASTPOS  LEFT  LENGTH
  OVERLAY  POS  REVERSE  RIGHT  SPACE  STRIP
  SUBSTR  SUBWORD  TRANSLATE  VERIFY  WORD  WORDINDEX
  WORDLENGTH  WORDPOS  WORDS

Conversion functions:
  B2X  C2D  C2X  D2C  D2X  X2B  X2C  X2D

Arithmetic functions:
  ABS  FORMAT  MAX  MIN  SIGN  TRUNC

Bit functions:
  BITAND  BITOR  BITXOR

Comparison functions:
  DATATYPE  SYMBOL

I/O functions:
  CHARIN  CHAROUT  CHARS  LINEIN  LINEOUT  LINES  STREAM

Miscellaneous:
  ADDRESS  ARG  CONDITION  DATE  DIGITS  ERRORTEXT  FORM
  FUZZ  QUEUED  RANDOM  SOURCELINE  TIME  TRACE  VALUE
  XRANGE
```

Each function must handle REXX's string semantics: all arguments are strings,
all return values are strings, numeric interpretation happens only when the
function's specification requires it.

## Appendix B: Bytecode Instruction Set (Complete)

```
0x00  NOP                             No operation
0x01  SAY         <str_ref>           Write string + newline to stdout
0x02  ASSIGN      <var_ref> <val_ref> Set variable to value
0x03  DO_INIT     <ctrl_block>        Initialize DO loop
0x04  DO_TEST     <jmp_offset>        Test loop condition, jump if done
0x05  DO_STEP                         Increment loop variable
0x06  DO_END                          Clean up loop state
0x07  IF_TRUE     <jmp_offset>        Jump if condition true
0x08  IF_FALSE    <jmp_offset>        Jump if condition false
0x09  CALL        <label> <argc>      Call internal function
0x0A  RETURN      <val_ref>           Return from function
0x0B  PARSE       <src> <template>    Execute PARSE instruction
0x0C  ADDRESS     <port> <cmd>        Send command to port
0x0D  PUSH_STR    <str_ref>           Push string onto operand stack
0x0E  PUSH_VAR    <var_ref>           Push variable value onto stack
0x0F  BINOP       <op_type>           Pop two, apply operator, push result
0x10  UNOP        <op_type>           Pop one, apply operator, push result
0x11  FUNC_CALL   <name> <argc>       Call function (internal/builtin/ext)
0x12  INTERPRET   <str_ref>           Dynamic evaluation
0x13  SIGNAL      <target>            Non-local transfer of control
0x14  SIGNAL_ON   <condition> <label> Enable condition trap
0x15  SIGNAL_OFF  <condition>         Disable condition trap
0x16  NUMERIC     <sub> <val>         Set NUMERIC option
0x17  DROP        <var_ref>           Unassign variable
0x18  PROCEDURE                       Enter procedure scope
0x19  EXPOSE      <var_list>          Expose variables in procedure
0x1A  PUSH_QUEUE  <str_ref>           Push to external data queue
0x1B  PULL_QUEUE                      Pull from external data queue
0x1C  ITERATE     <name>              Skip to next loop iteration
0x1D  LEAVE       <name>              Exit loop
0x1E  SELECT                          Begin SELECT block
0x1F  WHEN        <jmp_offset>        Test WHEN condition
0x20  OTHERWISE                       Default SELECT branch
0x21  END_SELECT                      End SELECT block
0x22  EXIT        <val_ref>           Exit program
0x23  TRACE       <setting>           Set TRACE mode
0x24  OPTIONS     <str_ref>           Set OPTIONS
0x25  NOP_PAD                         Alignment padding
```

## Appendix C: REXX-to-MCP Integration Examples

### C.1 Calling GSD Math Co-Processor from REXX

```rexx
/* eigen.rexx -- Compute eigenvalues via MCP */
ADDRESS 'gsd-math-coprocessor'

matrix = '[[1,2],[3,4]]'
'algebrus_eigen {"matrix":' matrix '}'

IF RC = 0 THEN DO
  PARSE VAR RESULT '"eigenvalues":' eigenvals ','
  SAY 'Eigenvalues:' eigenvals
END
```

### C.2 REXX Script Registered as MCP Tool

```rexx
/* string-processor.rexx -- Exposed as MCP tool */
/* MCP tool name: rexx-string-processor */
/* MCP tool description: Process strings with REXX PARSE */

PARSE ARG input_json
PARSE VAR input_json '"text":"' text '"' ',"template":"' template '"'

/* Apply the template dynamically */
INTERPRET "PARSE VAR text" template

/* Collect all assigned variables and return as JSON */
result = '{'
/* ... build JSON from variable pool ... */
result = result || '}'

RETURN result
```

### C.3 Inter-Stage Communication

```rexx
/* orchestrator.rexx -- Runs in TypeScript Stage 1 */
/* Dispatches heavy computation to GPU Stage 3 */

ADDRESS 'gpu-rexx'

DO i = 1 TO 100
  /* Queue a batch of parameter sweeps */
  params = i/100 (i*3.14/100) (i*2.71/100)
  'QUEUE sweep_kernel.rexx' params
END

/* Execute all queued scripts on GPU */
'FLUSH'

/* Collect results */
'RESULTS'
PARSE VAR RESULT count mean stddev min max
SAY 'Batch complete:' count 'runs'
SAY 'Mean:' mean '  Std Dev:' stddev
SAY 'Range:' min 'to' max
```

---

*This document is part of the PNW Research Series, Rosetta Cluster: AI &
Computation. It serves as the architectural blueprint for the RXX porting
project -- bringing the most powerful scripting language of the Amiga era
into the modern age, from TypeScript to bare metal to GPU, preserving the
port-based IPC model that made ARexx revolutionary and mapping it onto the
Model Context Protocol that defines our current ecosystem.*

*The Amiga taught us that every application should be scriptable, that every
application should be able to talk to every other application, and that the
scripting language should be simple enough for anyone to learn in an afternoon.
ARexx delivered on that promise in 1987. This project delivers on it again.*

---

## Study Guide — Porting REXX/ARexx

### Key questions

- What's the minimum interpreter core you need to port?
- How do you represent ports in a Unix/Windows context?
- How do you map REXX semantics onto modern IPC
  (sockets, D-Bus, MCP)?

## DIY — Build a minimal REXX interpreter

200 lines of Python. Parse tokens, evaluate expressions,
dispatch SAY/DO/IF. Ship it.

## TRY — Map ARexx ports onto MCP

Model Context Protocol resembles ARexx's port system:
named endpoints, named messages, typed payloads. Write
a short paper outlining the mapping.

## Related College Departments

- [**coding**](../../../.college/departments/coding/DEPARTMENT.md)
- [**engineering**](../../../.college/departments/engineering/DEPARTMENT.md)
