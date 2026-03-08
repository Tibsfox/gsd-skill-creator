# Module 2: Type System & Abilities

> Unison's type system combines bidirectional type inference with algebraic effects (called "abilities") to track side effects at the type level. This module covers the type system fundamentals, the ability mechanism, built-in and custom abilities, and comparative analysis with other effect systems.

---

## 2.1 Type System Overview

### Bidirectional Type Inference

Unison uses **bidirectional type inference** based on the Dunfield & Krishnaswami algorithm. This means:

- Types propagate **both directions** — from annotations downward (checking mode) and from expressions upward (synthesis mode)
- Type annotations are **optional** for all definitions — the compiler infers them
- When annotations are provided, they serve as documentation and as checking constraints

```unison
-- Inferred: the compiler determines the type
increment n = n + 1

-- Annotated: the compiler checks against the declared type
increment : Nat -> Nat
increment n = n + 1
```

In practice, top-level definitions often include annotations for documentation, while local bindings rely on inference.

### Parametric Polymorphism

Unison supports **parametric polymorphism** (generics). Type variables are lowercase, concrete types are uppercase:

```unison
identity : a -> a
identity x = x

swap : (a, b) -> (b, a)
swap p = match p with
  (a, b) -> (b, a)
```

Polymorphic functions work uniformly over all types — there is no ad-hoc overloading or type classes (abilities fill some of the roles that type classes serve in Haskell).

### Structural Types vs. Unique Types

Unison has two kinds of type declarations, distinguished by their identity model (→ See Module 1, Section 1.5):

**Structural types** are identified by their structure. Two declarations with the same shape are the same type:

```unison
structural type Pair a b = Pair a b
structural type Duo a b = Duo a b
-- These are the SAME type — same structure, same hash
```

**Unique types** are identified by a unique tag generated at declaration time. Even with identical structure, they are distinct:

```unison
unique type Celsius = Celsius Float
unique type Fahrenheit = Fahrenheit Float
-- These are DIFFERENT types — unique tags differ
```

Structural types are used for generic data structures. Unique types are used for domain modeling where structural coincidence should not imply interchangeability.

### Pattern Matching

Pattern matching uses `match ... with` or the shorthand `cases`:

```unison
describe : Optional a -> Text
describe = cases
  None   -> "nothing"
  Some _ -> "something"
```

The compiler performs **exhaustiveness checking** — a `match` that doesn't cover all constructors is a compile-time error. This, combined with kind-checking (introduced October 2023), provides strong static guarantees.

*Source: [Unison 1.0](https://www.unison-lang.org/unison-1-0/), "Kind-checking lands for Unison"*

---

## 2.2 Abilities (Algebraic Effects)

### Theoretical Foundation

Unison's ability system is based on **algebraic effects** from the **Frank language** (Lindley, McBride, McLaughlin — "Do Be Do Be Do," 2017). It is NOT a monadic effect system — abilities use delimited continuations rather than monadic bind.

### Key Divergences from Frank

| Aspect | Frank | Unison |
|--------|-------|--------|
| **Ability polymorphism** | Implicit — functions are ability-polymorphic by default | Explicit — uses ordinary polymorphic type variables |
| **Empty ability set** | Functions are implicitly ability-polymorphic | `{}` explicitly disallows all abilities (pure function) |
| **Effect handling** | Overloaded function application | Separate `handle` construct |

*Source: [Unison Language Reference: Abilities](https://www.unison-lang.org/docs/language-reference/abilities-and-ability-handlers/)*

### Ability Declaration Syntax

An ability is declared as an interface of operations:

```unison
structural ability Abort where
  abort : {Abort} a

structural ability Store v where
  get : {Store v} v
  put : v ->{Store v} ()
```

This creates:
- A **type constructor** (`Abort`, `Store v`)
- **Value constructors** for each operation (`Abort.abort`, `Store.get`, `Store.put`)

The constructors have types:
- `Abort.abort : {Abort} a` — returns any type (because it never returns)
- `Store.get : {Store v} v` — returns the stored value
- `Store.put : v ->{Store v} ()` — stores a value, returns unit

### Type Signature Notation

The general function type in Unison is:

```
Input ->{Abilities} Output
```

where `{Abilities}` is a comma-separated set of required abilities:

| Signature | Meaning |
|-----------|---------|
| `A -> B` | Sugar for `A ->{e} B` — some unspecified abilities (ability-polymorphic) |
| `A ->{} B` | **Pure function** — explicitly no abilities allowed |
| `A ->{IO} B` | Requires the `IO` ability |
| `A ->{IO, Exception} B` | Requires both `IO` and `Exception` |
| `A ->{IO, Store Text} B` | Requires `IO` and `Store` parameterized with `Text` |

### Typechecking Rule

The type checker enforces ability requirements transitively:

- A function body with type `A ->{IO} B` may call functions requiring `{}` (subset) or `{IO}` (exact match)
- It may NOT call functions requiring `{Exception}` unless `Exception` is also in the ability set
- Ability requirements are **inferred** as the union of all requirements in the function body

**Restriction**: Top-level definitions must be pure (no abilities) unless wrapped in delayed computations:

```unison
-- Error: IO at top level
msg = printLine "Hello"

-- OK: delayed computation (thunk)
msg = '(printLine "Hello")
```

### Handler Syntax

Handlers provide implementations for abilities using `handle ... with`:

```unison
handle computation with handler
```

If `computation` has type `{A} T` and `handler` has type `Request {A} T -> R`, then `handle computation with handler` has type `R`.

### Pattern Matching on Ability Constructors

Handlers pattern-match on the `Request` type using a special syntax:

```
{AbilityName.operation arg1 arg2 -> continuation}
```

Where:
- `AbilityName.operation` identifies which ability operation was invoked
- `arg1 arg2` are the arguments passed to the operation
- `continuation` (often `k`) is the **remainder of the computation** — a function that, when called with the operation's return value, resumes execution

The **pure case** `{a}` matches when the computation completes without further ability requests.

### Complete Handler Example: Abort

```unison
structural ability Abort where
  abort : {Abort} a

toDefault! : '{g} a -> Request {Abort} a ->{g} a
toDefault!.handler default = cases
  { a }                -> a                -- pure result
  { Abort.abort -> _ } -> default()        -- abort: return default
```

The pattern `{ Abort.abort -> _ }` discards the continuation (ignores it with `_`) because aborting means we don't continue. The `default()` call forces the thunked default value.

### Complete Handler Example: Store

```unison
structural ability Store v where
  get : {Store v} v
  put : v ->{Store v} ()

storeHandler : v -> Request {Store v} a -> a
storeHandler storedValue = cases
  {Store.get -> k} ->
    handle k storedValue with storeHandler storedValue
  {Store.put v -> k} ->
    handle k () with storeHandler v
  {a} -> a
```

This handler:
1. On `get`: passes the current `storedValue` to the continuation `k`, then recursively handles further requests with the same value
2. On `put v`: passes `()` to the continuation (put returns unit), then recursively handles with the **new** value `v`
3. On pure result: returns it directly

State is threaded through recursive handler calls — no mutable variables needed.

---

## 2.3 Built-in Abilities Catalogue

| Ability | Purpose | Key Operations | Example |
|---------|---------|---------------|---------|
| **`IO`** | System I/O: file access, network, console, time, random | `printLine`, `readLine`, `bracket`, `IO.ref` | `printLine : Text ->{IO} ()` |
| **`Exception`** | Typed error handling with failure information | `Exception.raise`, `Exception.catch` | `raise : Failure ->{Exception} a` |
| **`Abort`** | Immediate computation termination | `Abort.abort` | `abort : {Abort} a` (returns any type — never returns) |
| **`Stream`** | Value emission (lazy sequences, generators) | `Stream.emit`, `Stream.toList` | `emit : a ->{Stream a} ()` |
| **`Store`** | Mutable state via get/put interface | `Store.get`, `Store.put` | `get : {Store v} v`, `put : v ->{Store v} ()` |
| **`Remote`** | Distributed computing in Unison Cloud | `Remote.fork`, `Remote.at`, value transfer | `at : Location -> '{Remote, g} a ->{Remote, g} a` |

### IO

The `IO` ability is the gateway to the outside world. Unlike Haskell's `IO` monad, it is composed with other abilities seamlessly — no monad transformers required. Functions like `printLine`, `readLine`, and file operations all require `{IO}`.

```unison
greet : Text ->{IO} ()
greet name = printLine ("Hello, " ++ name ++ "!")
```

`IO` is typically handled at the program's entry point by the runtime, not by user-written handlers.

### Exception

`Exception` provides typed error handling. The `Failure` type carries structured error information:

```unison
safeDivide : Nat -> Nat ->{Exception} Nat
safeDivide a b =
  if b == 0 then Exception.raise (Generic.failure "Division by zero" b)
  else a / b
```

Unlike traditional exceptions, `Exception` is tracked in the type signature — a caller can see at the type level whether a function may fail.

### Abort

`Abort` is the simplest ability — a single operation that terminates the computation:

```unison
findFirst : (a -> Boolean) -> [a] ->{Abort} a
findFirst pred = cases
  []     -> abort
  h +: t -> if pred h then h else findFirst pred t
```

Handlers for `Abort` typically provide a default value or convert to `Optional`.

### Stream

`Stream` enables generator-style programming:

```unison
naturals : '{Stream Nat} ()
naturals = do
  go n =
    Stream.emit n
    go (n + 1)
  go 0
```

Handlers for `Stream` can collect values into a list, take the first N, filter, or transform on the fly.

### Store

`Store` provides mutable state in a purely functional context (see handler example in Section 2.2):

```unison
modifyStore : (v -> v) ->{Store v} ()
modifyStore f =
  v = Store.get
  Store.put (f v)

counter : '{Store Nat} Nat
counter = do
  modifyStore (n -> n + 1)
  modifyStore (n -> n + 1)
  modifyStore (n -> n + 1)
  Store.get
-- handle !counter with storeHandler 0  =>  3
```

### Remote

`Remote` enables distributed computing in Unison Cloud. Combined with content-addressing (→ See Module 1), code and its dependencies can be shipped to remote nodes by hash:

```unison
distributed : '{Remote, IO} Nat
distributed = do
  result = Remote.at server '(expensiveComputation 42)
  result + 1
```

The `Remote` ability is part of Unison Cloud's proprietary platform, though the ability mechanism itself is open source.

---

## 2.4 Custom Ability Walkthrough

### Example 1: Logging Ability

**Declaration** — define the interface:

```unison
unique ability Log where
  log : Text ->{Log} ()
  logError : Text ->{Log} ()
```

**Usage** — write code that requires `Log`:

```unison
processOrder : OrderId ->{Log, Exception} Order
processOrder orderId = do
  log ("Processing order: " ++ OrderId.toText orderId)
  order = lookupOrder orderId
  match order with
    None ->
      logError ("Order not found: " ++ OrderId.toText orderId)
      Exception.raise (Generic.failure "Order not found" orderId)
    Some o ->
      log ("Order found: " ++ Order.summary o)
      o
```

**Handler — Console Logger:**

```unison
consoleLogHandler : Request {Log} a ->{IO} a
consoleLogHandler = cases
  {Log.log msg -> k} ->
    printLine ("[INFO] " ++ msg)
    handle k () with consoleLogHandler
  {Log.logError msg -> k} ->
    printLine ("[ERROR] " ++ msg)
    handle k () with consoleLogHandler
  {a} -> a
```

**Handler — Silent Logger (for tests):**

```unison
silentLogHandler : Request {Log} a -> a
silentLogHandler = cases
  {Log.log _ -> k} ->
    handle k () with silentLogHandler
  {Log.logError _ -> k} ->
    handle k () with silentLogHandler
  {a} -> a
```

**Execution** — swap handlers without changing any application code:

```unison
-- Production: logs to console
handle processOrder myOrderId with consoleLogHandler

-- Testing: silent
handle processOrder myOrderId with silentLogHandler
```

The `processOrder` function is identical in both cases. Only the handler changes. This is the core power of abilities: **implementation is separated from interface at the type level**.

### Example 2: Counter Ability (State Machine)

**Declaration:**

```unison
unique ability Counter where
  nextValue : {Counter} Nat
  reset : {Counter} ()
```

**Handler — tracks state via recursive calls:**

```unison
counterHandler : Nat -> Request {Counter} a -> a
counterHandler current = cases
  {Counter.nextValue -> k} ->
    handle k current with counterHandler (current + 1)
  {Counter.reset -> k} ->
    handle k () with counterHandler 0
  {a} -> a
```

**Usage:**

```unison
generateIds : '{Counter} [Nat]
generateIds = do
  a = nextValue
  b = nextValue
  c = nextValue
  reset
  d = nextValue
  [a, b, c, d]

> handle !generateIds with counterHandler 0
-- Result: [0, 1, 2, 0]
```

**Generic handler wrapper** (accommodating other abilities):

```unison
countingFrom : Nat -> '{Counter, g} a ->{g} a
countingFrom initialValue code =
  handle !code with counterHandler initialValue
```

The type variable `g` captures any additional abilities the computation requires. The handler "peels off" `Counter` from the ability set, leaving `{g}` in the return type.

*Source: [Dave Thomas, "Abilities"](https://pragdave.me/discover/unison/2023-03-11-abilities/), 2023*

---

## 2.5 Direct Style vs. Monadic Style

### The Problem Abilities Solve

Haskell introduced monads to solve a specific problem: in a **lazy** language, evaluation order is undefined, so side effects cannot depend on program order. Monads provide explicit sequencing via bind (`>>=`):

```haskell
-- Haskell: explicit sequencing via monadic bind
main :: IO ()
main =
  putStrLn "Enter name:" >>= \_ ->
  getLine >>= \name ->
  putStrLn ("Hello, " ++ name)
```

Unison is **strictly evaluated** — expressions evaluate in program order. This means sequencing is automatic, and the monadic machinery is unnecessary for that purpose. But Unison still needs effect tracking (knowing which functions perform I/O, can fail, etc.). Abilities provide this tracking without the monadic overhead.

### Direct Style: Abilities

```unison
greet : '{IO, Exception} ()
greet = do
  printLine "Enter name:"
  name = readLine()
  printLine ("Hello, " ++ name)
```

This reads like imperative code. The effects `{IO, Exception}` are tracked in the type, but the code uses no special combinators, no bind operators, no monad transformers.

### Monadic Style: Haskell Comparison

The equivalent Haskell with multiple effects requires monad transformers:

```haskell
-- Haskell: IO + State + Exception requires transformer stack
type App a = ExceptT AppError (StateT AppState IO) a

greet :: App ()
greet = do
  liftIO $ putStrLn "Enter name:"
  name <- liftIO getLine
  modify (\s -> s { lastGreeted = name })
  liftIO $ putStrLn ("Hello, " ++ name)
```

Note the `liftIO` calls — these "lift" IO operations through the transformer stack. With abilities, no lifting is needed:

```unison
greet : '{IO, Exception, Store AppState} ()
greet = do
  printLine "Enter name:"
  name = readLine()
  Store.put (setLastGreeted name (Store.get))
  printLine ("Hello, " ++ name)
```

### The Composition Advantage

In Haskell, adding an effect to an existing function cascades changes:

1. The return type changes (e.g., `String` → `IO String`)
2. All callers must be updated (e.g., `map` → `traverse`)
3. Monad transformer order matters (different stacks have different semantics)

This is sometimes called **"function coloring"** — effectful functions infect their callers with syntactic changes.

In Unison, adding an ability to a function's type:

1. Adds the ability to the type signature (or it's inferred automatically)
2. Callers need no syntactic changes — `map` works the same whether the function is pure or effectful
3. There is no `map`/`traverse` distinction

*Source: [Unison docs, "For the Monadically Inclined"](https://www.unison-lang.org/docs/fundamentals/abilities/for-monadically-inclined/)*

### The Trade-off: Referential Transparency

Direct-style effects come with a cost. Consider mutable references:

```unison
-- WRONG: x and y share the same reference
emptyRef = IO.ref "empty"
x = emptyRef
y = emptyRef

-- CORRECT: each call creates a new reference
emptyRef = do IO.ref "empty"
x = emptyRef()
y = emptyRef()
```

In the monadic style, `IO.ref "empty"` is a *description* of creating a reference — binding it doesn't execute it. In direct style, it IS the creation. This means **refactoring by extracting a common subexpression can change behavior** if the subexpression has effects.

The Unison documentation acknowledges: "Refactoring the code with abilities might require more brain activity than with monads" for cases involving effectful expressions.

*Source: [Unison docs, "For the Monadically Inclined"](https://www.unison-lang.org/docs/fundamentals/abilities/for-monadically-inclined/)*

### The Thunk/Force Syntax

To delay computation explicitly, Unison uses:
- `'expr` (thunk/delay): wraps `expr` in a zero-argument function
- `!expr` (force/bang): calls a zero-argument function

```unison
-- Delayed: type is '{IO} Nat, not {IO} Nat
delayed = '(computeSomething())

-- Forced: executes the delayed computation
result = !delayed
```

This replaces some of what monads provide implicitly in Haskell (lazy IO descriptions that execute only when bound).

---

## 2.6 Effect System Comparison

The following table compares Unison's ability system with five other approaches to managing computational effects across eight dimensions:

| Dimension | Unison Abilities | Haskell Monads | Koka Effects | Eff (OCaml) | Erlang/OTP | Traditional Exceptions |
|-----------|-----------------|----------------|-------------|-------------|------------|----------------------|
| **Effect tracking mechanism** | Ability sets in function types: `{IO, Exception}` | Monad type constructors: `IO a`, `Maybe a`; stacked via transformers | Row-typed effect sets: `<exn, io>` | Effect declarations with handlers; OCaml 5 native | Process isolation; no type-level tracking; effects implicit per process | No type tracking; `throws` declarations (Java) or nothing (most languages) |
| **Composition model** | Union of ability sets — `{A, B}` composed by listing; no ordering dependency | Monad transformer stacks; order matters (`StateT s (ExceptT e IO) a`); `lift` required between layers | Row polymorphism — effects compose automatically; no lifting | Handler nesting; order of handlers determines semantics | Message passing between isolated processes; no shared-state composition | Unstructured — catch wraps throw; no composition model |
| **Handler syntax** | `handle expr with handler`; pattern match on `Request` type with continuation | `runStateT`, `runExceptT`, etc.; each monad has its own "run" function | `with handler` blocks; similar to Unison but with row-polymorphic types | `match expr with effect` in OCaml 5; continuation-based | `try...catch` for local errors; supervisor trees for process failures | `try { } catch { }` blocks; language-specific syntax |
| **Performance model** | Continuation-based; runtime cost per ability operation; optimizations in progress (June 2025) | Zero-cost monadic bind in optimized code (GHC specialization); transformer stacks add overhead | Optimized via evidence-passing; competitive with direct code in benchmarks | OCaml 5 native effects use stack switching; low overhead | Per-process overhead; message copying cost; preemptive scheduling | Near-zero cost for happy path; stack unwinding on throw |
| **Code readability** | Direct style — reads like imperative code; effects visible only in type signatures | Do-notation helps but `lift`, `liftIO`, transformer management add noise | Direct style with explicit effect rows; similar readability to Unison | Direct style; OCaml syntax | Naturally imperative within processes; message-passing patterns idiomatic | Most readable in happy path; error paths require discipline |
| **Type safety level** | Full — type checker enforces that all required abilities are provided by handlers | Full — monadic types prevent unhandled effects at compile time | Full — effect rows tracked and checked; unhandled effects are type errors | Partial — OCaml 5 effects are unchecked without external tooling | None for effects — runtime errors, process crashes handled by supervisors | Minimal — unchecked exceptions in most languages; Java checked exceptions rarely enforced |
| **Polymorphism approach** | Ability polymorphism via ordinary type variables: `'{g} a ->{g} a` | Higher-kinded polymorphism: `Monad m => m a -> m b`; type classes for abstraction | Row polymorphism: effect rows extend naturally; polymorphic by default | Ad-hoc; effect types are nominal | Behavioral polymorphism via OTP behaviours (gen_server, gen_statem) | None — exceptions are untyped or nominally typed |
| **Ecosystem maturity** | Young — ~140K published definitions `[VENDOR-CLAIM]`; limited third-party libraries; no stable FFI | Mature — 30+ years; Hackage has 16,000+ packages; extensive tooling | Research-grade — academic origin (MSR); growing but limited production use | Experimental — OCaml 5 effects are recent (2022); limited library support | Battle-tested — 35+ years in telecom; massive ecosystem; OTP is industry standard | Universal — every mainstream language; decades of patterns and tooling |

### Key Takeaways

**Unison vs. Haskell**: Unison eliminates monad transformers, lifting, and function coloring at the cost of some referential transparency edge cases. For most application code, abilities produce cleaner, more readable programs. Haskell's advantage is in applicative-style code (parsers, build tools) which cannot be expressed with abilities because "there is no way not to evaluate effects or undo an effect."

**Unison vs. Koka**: Koka is the closest theoretical sibling — both use algebraic effects with direct-style syntax. Koka uses row-typed effects (more principled theoretically), while Unison uses set-based abilities (simpler conceptually). Koka has stronger performance research; Unison has a larger user community and tooling ecosystem.

**Unison vs. Erlang/OTP**: Erlang solves effect management through process isolation rather than type-level tracking. This is a fundamentally different philosophy — Erlang accepts runtime failures and manages them with supervisors, while Unison prevents them at compile time. Erlang's approach is battle-proven at scale (telecom, messaging); Unison's is theoretically stronger but unproven at scale.

**Unison vs. Traditional Exceptions**: Abilities are a strict superset. Traditional `try/catch` is equivalent to handling the `Exception` ability, but abilities also cover state, I/O, streaming, and custom effects — all with the same mechanism and type-level tracking.

*Sources: [Unison Language Reference](https://www.unison-lang.org/docs/language-reference/abilities-and-ability-handlers/); [Unison "For the Monadically Inclined"](https://www.unison-lang.org/docs/fundamentals/abilities/for-monadically-inclined/); [Dave Thomas, "Abilities"](https://pragdave.me/discover/unison/2023-03-11-abilities/); [LWN analysis](https://lwn.net/Articles/978955/)*

---

## Cross-References

- → **Module 1: Language Core** — Content-addressing, the codebase database, and build elimination
- → **Module 3: Distribution & Cloud** — How `Remote` ability enables distributed computing
- → **Module 4: Developer Experience** — Working with abilities in the UCM workflow
- → **Module 5: Ecosystem & Assessment** — Maturity analysis and limitations

---

## Sources

| ID | Source | Date | Used For |
|----|--------|------|----------|
| S1 | [Unison Language Reference: Abilities and Ability Handlers](https://www.unison-lang.org/docs/language-reference/abilities-and-ability-handlers/) | Current | Ability syntax, handler patterns, Request type, typechecking rules |
| S2 | [Unison: For the Monadically Inclined](https://www.unison-lang.org/docs/fundamentals/abilities/for-monadically-inclined/) | Current | Direct style vs. monads, referential transparency, thunk/force, comparison table |
| S3 | [Dave Thomas: Abilities](https://pragdave.me/discover/unison/2023-03-11-abilities/) | 2023 | Counter ability example, handler mechanics, generic handlers |
| S4 | [LWN: Unison analysis](https://lwn.net/Articles/978955/) | 2024 | Independent assessment, abilities for sandboxing, ecosystem maturity |
| S5 | [Unison 1.0 Announcement](https://www.unison-lang.org/unison-1-0/) | 2025 | Kind-checking, ecosystem statistics |
| S6 | Lindley, McBride, McLaughlin — "Do Be Do Be Do" (Frank language) | 2017 | Theoretical foundation for abilities |
| S7 | Dunfield & Krishnaswami — Bidirectional type inference | 2013 | Type inference algorithm basis |
