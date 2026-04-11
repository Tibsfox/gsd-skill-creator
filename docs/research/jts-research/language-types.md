# JavaScript & TypeScript: Language Core and Type System

> PNW Research Series -- AI & Computation Cluster
> Deep-dive reference covering JavaScript's design heritage, type system, and
> modern idioms alongside TypeScript's structural type layer.

---

## 1. Design Heritage

JavaScript was created by Brendan Eich in ten days at Netscape in May 1995.
Despite the speed, the language drew deliberately from four distinct traditions,
and those roots explain most of the quirks developers encounter today.

### 1.1 Scheme -- First-Class Functions and Closures

Scheme, a dialect of Lisp, contributed the idea that functions are values.
They can be assigned to variables, passed as arguments, and returned from
other functions. Most importantly, Scheme gave JavaScript **lexical closures**:
a function retains access to variables from the scope where it was defined,
even after that scope has exited.

```js
function makeCounter() {
  let count = 0;             // closed over by the returned function
  return function () {
    return ++count;
  };
}
const tick = makeCounter();
tick(); // 1
tick(); // 2
```

This is the single most consequential design decision in the language. Closures
power modules, callbacks, iterators, React hooks, and virtually every
abstraction pattern in the ecosystem.

### 1.2 Self -- Prototypal Inheritance

From Self (a Smalltalk descendant created at Sun), JavaScript took
**prototype-based object orientation**. Instead of classes defining a blueprint,
every object has an internal link (`[[Prototype]]`) to another object. Property
lookups walk this chain until they find a match or reach `null`.

```js
const animal = { speak() { return "..."; } };
const dog = Object.create(animal);
dog.speak = function () { return "woof"; };
dog.speak();            // "woof"  (own property)
delete dog.speak;
dog.speak();            // "..."   (inherited from animal)
```

ES2015 `class` syntax is sugar over this mechanism. The prototype chain still
runs underneath.

### 1.3 Java -- Syntax and Naming

Netscape wanted JavaScript to look like Java to ride the Java marketing wave.
The result: C-style braces, `for`/`while`/`if` syntax, the `new` keyword, and
the name "JavaScript" itself (originally "Mocha," then "LiveScript"). Java also
influenced the primitive wrapper objects (`Number`, `String`, `Boolean`).

This syntactic camouflage misled a generation of developers into thinking
JavaScript worked like Java. It does not. The semantics are Scheme + Self with
a Java costume.

### 1.4 HyperTalk -- Event-Driven Programming

Apple's HyperCard scripting language, HyperTalk, influenced JavaScript's
event-driven model. The browser environment was always about responding to user
actions -- clicks, keypresses, page loads. JavaScript adopted an event loop
rather than a thread-per-request model, a decision that later proved prescient
for server-side Node.js.

```js
document.querySelector("button").addEventListener("click", (event) => {
  console.log("clicked at", event.clientX, event.clientY);
});
```

The event loop, the callback pattern, and the single-threaded cooperative model
all trace back to this heritage.

---

## 2. JavaScript Types

JavaScript has **seven primitive types** and **one structural type** (object).

### 2.1 Primitives

| Type        | Example                    | `typeof` result |
|-------------|----------------------------|-----------------|
| number      | `42`, `3.14`, `NaN`, `Infinity` | `"number"`  |
| string      | `"hello"`, `'world'`       | `"string"`      |
| boolean     | `true`, `false`            | `"boolean"`     |
| null        | `null`                     | `"object"` (!)  |
| undefined   | `undefined`                | `"undefined"`   |
| bigint      | `9007199254740993n`        | `"bigint"`      |
| symbol      | `Symbol("id")`             | `"symbol"`      |

```js
typeof 42;          // "number"
typeof "hi";        // "string"
typeof true;        // "boolean"
typeof undefined;   // "undefined"
typeof null;        // "object"    -- famous bug, preserved for compat
typeof 42n;         // "bigint"
typeof Symbol();    // "symbol"
```

### 2.2 The `typeof null` Bug

`typeof null === "object"` is a bug from the original implementation.
Internally, values were tagged with a type tag in the low bits of a machine
word. Objects had tag `0`, and `null` was the literal NULL pointer (`0x00`),
so its tag bits were also `0`. The TC39 committee considered fixing this in
ES2015 but rejected the change because it would break too many websites.

### 2.3 Number

JavaScript uses IEEE 754 double-precision (64-bit) floating point for all
numbers. There is no separate integer type at the language level.

```js
0.1 + 0.2 === 0.3;                // false (0.30000000000000004)
Number.MAX_SAFE_INTEGER;           // 9007199254740991 (2^53 - 1)
Number.isInteger(1.0);             // true
Number.isNaN(NaN);                 // true (prefer over global isNaN)
```

### 2.4 BigInt

Added in ES2020 to handle arbitrarily large integers. BigInts cannot be mixed
with regular numbers without explicit conversion.

```js
const huge = 9007199254740993n;    // beyond MAX_SAFE_INTEGER
huge + 1n;                         // 9007199254740994n
// huge + 1;                       // TypeError: cannot mix BigInt and Number
```

### 2.5 Symbol

Symbols are unique, immutable identifiers. They are primarily used as
non-string property keys to avoid collisions.

```js
const id = Symbol("id");
const obj = { [id]: 42 };
obj[id];                           // 42
Object.keys(obj);                  // [] -- symbols are not enumerable

// Well-known symbols control language behavior
class MyArray {
  static [Symbol.hasInstance](instance) {
    return Array.isArray(instance);
  }
}
[] instanceof MyArray;             // true
```

---

## 3. Type Coercion

### 3.1 `==` vs `===`

The abstract equality operator (`==`) performs type coercion before comparison.
The strict equality operator (`===`) does not.

```js
0 == "";           // true   (both coerce to 0)
0 === "";          // false  (number !== string)
null == undefined; // true   (special case in the spec)
null === undefined;// false
false == "0";      // true   (both become 0)
```

**Rule:** Use `===` everywhere. The only legitimate use of `==` is
`x == null`, which checks for both `null` and `undefined` in a single test.

### 3.2 Truthy and Falsy

Eight falsy values: `false`, `0`, `-0`, `0n`, `""`, `null`, `undefined`, `NaN`.
Everything else is truthy, including `[]`, `{}`, and `"false"`.

```js
if ([])  console.log("arrays are truthy");      // logs
if ({})  console.log("objects are truthy");      // logs
if ("0") console.log("non-empty strings too");  // logs
```

### 3.3 NaN

`NaN` is the only JavaScript value not equal to itself. This is mandated by
IEEE 754.

```js
NaN === NaN;           // false
Number.isNaN(NaN);     // true
Number.isNaN("hello"); // false (does not coerce, unlike global isNaN)
isNaN("hello");        // true  (coerces string to number first)
```

### 3.4 WAT Talk Highlights

Gary Bernhardt's "WAT" talk showcases coercion absurdity:

```js
[] + [];         // ""         (both coerce to "", string concat)
[] + {};         // "[object Object]"
{} + [];         // 0          (block statement + unary plus on [])
"b" + "a" + +"a" + "a";  // "baNaNa"  (+"a" is NaN)
```

These results are all spec-compliant. They follow from the `ToPrimitive`
abstract operation, which calls `valueOf()` then `toString()` (or vice versa
depending on the hint).

---

## 4. Variables and Scope

### 4.1 `var` -- Function-Scoped, Hoisted

`var` declarations are hoisted to the top of their enclosing function (or
global scope). Only the declaration is hoisted, not the initialization.

```js
console.log(x); // undefined (hoisted declaration)
var x = 5;

// var ignores block scope
if (true) {
  var leaked = "visible outside";
}
console.log(leaked); // "visible outside"
```

### 4.2 `let` and `const` -- Block-Scoped, TDZ

`let` and `const` are block-scoped and live in the **Temporal Dead Zone (TDZ)**
from the start of the block until the declaration is reached.

```js
{
  // console.log(y); // ReferenceError: Cannot access 'y' before initialization
  let y = 10;
  console.log(y);    // 10
}
// console.log(y);   // ReferenceError: y is not defined
```

`const` requires initialization and prevents reassignment, but does **not**
make the value immutable -- object properties can still be mutated.

```js
const arr = [1, 2, 3];
arr.push(4);          // fine -- mutating the array
// arr = [5];         // TypeError: Assignment to constant variable
```

### 4.3 `globalThis`

ES2020 introduced `globalThis` as a universal reference to the global object,
replacing the environment-specific `window`, `global`, and `self`.

```js
globalThis.setTimeout === setTimeout; // true in any environment
```

---

## 5. Functions

### 5.1 Declarations vs Expressions

Function declarations are hoisted entirely (name and body). Function
expressions are not.

```js
greet("world");                  // works -- declaration is hoisted
function greet(name) {
  return `hello, ${name}`;
}

// sayHi("world");              // TypeError: sayHi is not a function
var sayHi = function (name) {
  return `hi, ${name}`;
};
```

### 5.2 Arrow Functions

Arrow functions (ES2015) have no own `this`, no `arguments`, no `prototype`,
and cannot be used as constructors.

```js
const add = (a, b) => a + b;
const square = x => x * x;       // parens optional for single param
const getObj = () => ({ x: 1 });  // parens required for object literal
```

### 5.3 `this` Rules

`this` is determined by how a function is called, not where it is defined
(except for arrow functions):

```js
// 1. Default binding: globalThis (or undefined in strict mode)
function showThis() { return this; }
showThis();  // globalThis (sloppy) or undefined (strict)

// 2. Implicit binding: the object before the dot
const obj = { name: "A", getName() { return this.name; } };
obj.getName(); // "A"

// 3. Explicit binding: call, apply, bind
function greet(greeting) { return `${greeting}, ${this.name}`; }
greet.call({ name: "B" }, "hi");   // "hi, B"
greet.apply({ name: "C" }, ["hi"]);// "hi, C"
const bound = greet.bind({ name: "D" });
bound("hi");                       // "hi, D"

// 4. new binding: this = freshly created object
function Person(name) { this.name = name; }
const p = new Person("E");        // { name: "E" }

// 5. Arrow: inherits this from enclosing lexical scope
const timer = {
  seconds: 0,
  start() {
    setInterval(() => { this.seconds++; }, 1000);  // this = timer
  }
};
```

### 5.4 Closures

Every function forms a closure over its defining scope. This is the mechanism
behind data privacy, factory functions, and partial application.

```js
function createMultiplier(factor) {
  return (x) => x * factor; // closes over factor
}
const double = createMultiplier(2);
const triple = createMultiplier(3);
double(5); // 10
triple(5); // 15
```

### 5.5 Higher-Order Functions

Functions that take or return other functions. The foundation of functional
programming patterns in JavaScript.

```js
function compose(f, g) {
  return (x) => f(g(x));
}
const inc = x => x + 1;
const dbl = x => x * 2;
const incThenDbl = compose(dbl, inc);
incThenDbl(3); // 8 -- inc(3)=4, dbl(4)=8
```

### 5.6 Rest, Default, and Destructuring Parameters

```js
function tag(name, ...classes) {         // rest
  return `<${name} class="${classes.join(" ")}">`;
}

function greet(name = "world") {         // default
  return `hello, ${name}`;
}

function render({ width, height = 100 }) { // destructuring
  return `${width}x${height}`;
}
render({ width: 640 }); // "640x100"
```

### 5.7 IIFE (Immediately Invoked Function Expression)

Pre-ES2015 module pattern. Still occasionally useful for isolating scope.

```js
const counter = (function () {
  let n = 0;
  return { inc: () => ++n, get: () => n };
})();
counter.inc(); // 1
counter.get(); // 1
```

---

## 6. Prototypes and Classes

### 6.1 The Prototype Chain

Every object has an internal `[[Prototype]]` link. Property lookups traverse
this chain.

```js
const base = { greet() { return "hello"; } };
const child = Object.create(base);
child.greet();                     // "hello" (found on base)
Object.getPrototypeOf(child) === base; // true
```

### 6.2 Constructor Functions (Pre-ES2015)

```js
function Animal(name) {
  this.name = name;
}
Animal.prototype.speak = function () {
  return `${this.name} makes a sound`;
};
const cat = new Animal("Cat");
cat.speak(); // "Cat makes a sound"
```

### 6.3 ES2015 Classes

Syntactic sugar over the prototype system. `typeof` a class is `"function"`.

```js
class Animal {
  constructor(name) {
    this.name = name;
  }
  speak() {
    return `${this.name} makes a sound`;
  }
}

class Dog extends Animal {
  speak() {
    return `${this.name} barks`;
  }
}

const rex = new Dog("Rex");
rex.speak();                       // "Rex barks"
rex instanceof Dog;                // true
rex instanceof Animal;             // true
```

### 6.4 Private Fields (`#`) -- ES2022

True privacy enforced by the engine, not convention.

```js
class BankAccount {
  #balance = 0;

  deposit(amount) {
    if (amount > 0) this.#balance += amount;
  }

  get balance() {
    return this.#balance;
  }
}

const acct = new BankAccount();
acct.deposit(100);
acct.balance;         // 100
// acct.#balance;     // SyntaxError: Private field '#balance'
```

### 6.5 Static and Class Fields

```js
class Config {
  static DEFAULT_TIMEOUT = 5000;       // static class field
  retries = 3;                         // instance class field

  static create(overrides) {
    return Object.assign(new Config(), overrides);
  }
}
Config.DEFAULT_TIMEOUT; // 5000
```

---

## 7. Arrays

### 7.1 Functional Methods

```js
const nums = [1, 2, 3, 4, 5];

nums.map(n => n * 2);                  // [2, 4, 6, 8, 10]
nums.filter(n => n > 3);               // [4, 5]
nums.reduce((acc, n) => acc + n, 0);   // 15
nums.find(n => n > 3);                 // 4
nums.findIndex(n => n > 3);            // 3
nums.includes(3);                      // true
nums.some(n => n > 4);                 // true
nums.every(n => n > 0);               // true

// flatMap: map then flatten one level
[[1, 2], [3, 4]].flat();              // [1, 2, 3, 4]
[1, 2, 3].flatMap(n => [n, n * 10]);  // [1, 10, 2, 20, 3, 30]
```

### 7.2 ES2023: Non-Mutating Alternatives

These return new arrays, leaving the original untouched. Critical for
frameworks like React where immutability matters.

```js
const arr = [3, 1, 4, 1, 5];

arr.toSorted();                        // [1, 1, 3, 4, 5]  (arr unchanged)
arr.toReversed();                      // [5, 1, 4, 1, 3]
arr.toSpliced(1, 2, 99);              // [3, 99, 1, 5]
arr.with(0, 42);                       // [42, 1, 4, 1, 5]

// Compare with mutating originals:
// arr.sort()    -- mutates arr
// arr.reverse() -- mutates arr
// arr.splice()  -- mutates arr
```

### 7.3 Iteration Patterns

```js
const fruits = ["apple", "banana", "cherry"];

// for...of (values)
for (const fruit of fruits) { /* ... */ }

// entries (index + value)
for (const [i, fruit] of fruits.entries()) { /* ... */ }

// forEach (no break/continue, no await)
fruits.forEach((fruit, i) => { /* ... */ });
```

---

## 8. Promises and Async/Await

### 8.1 The Promise API

A Promise represents an eventual value. It is in one of three states:
pending, fulfilled, or rejected. Once settled, it cannot change state.

```js
const fetchUser = (id) =>
  new Promise((resolve, reject) => {
    setTimeout(() => {
      if (id > 0) resolve({ id, name: "Alice" });
      else reject(new Error("Invalid ID"));
    }, 100);
  });

fetchUser(1)
  .then(user => console.log(user.name))
  .catch(err => console.error(err.message))
  .finally(() => console.log("done"));
```

### 8.2 Combinators

```js
// All must succeed
const [a, b] = await Promise.all([fetchA(), fetchB()]);

// First to settle (fulfill or reject)
const fastest = await Promise.race([fetchA(), fetchB()]);

// All settle, get status of each
const results = await Promise.allSettled([fetchA(), fetchB()]);
// [{ status: "fulfilled", value: ... }, { status: "rejected", reason: ... }]

// First to fulfill (ignores rejections unless all reject)
const first = await Promise.any([fetchA(), fetchB()]);
```

### 8.3 Async/Await (ES2017)

Syntactic sugar over Promises. An `async` function always returns a Promise.
`await` pauses execution until the Promise settles.

```js
async function loadProfile(userId) {
  try {
    const user = await fetchUser(userId);
    const posts = await fetchPosts(user.id);
    return { user, posts };
  } catch (err) {
    console.error("Failed:", err.message);
    throw err; // re-throw to propagate
  }
}
```

### 8.4 The Microtask Queue

Promise callbacks (`.then`, `.catch`, `.finally`) run as **microtasks**, which
execute after the current task but before the next macrotask (setTimeout, I/O).

```js
console.log("1");
setTimeout(() => console.log("2"), 0);
Promise.resolve().then(() => console.log("3"));
console.log("4");
// Output: 1, 4, 3, 2
// Synchronous first (1, 4), then microtask (3), then macrotask (2)
```

### 8.5 Top-Level Await

Available in ES modules (not CommonJS). The module graph waits for the
awaited value before proceeding.

```js
// config.mjs
const response = await fetch("/config.json");
export const config = await response.json();
```

---

## 9. Iterators and Generators

### 9.1 The Iterator Protocol

An object is iterable if it has a `[Symbol.iterator]()` method returning an
object with a `next()` method that returns `{ value, done }`.

```js
const range = {
  from: 1,
  to: 5,
  [Symbol.iterator]() {
    let current = this.from;
    const last = this.to;
    return {
      next() {
        return current <= last
          ? { value: current++, done: false }
          : { done: true };
      },
    };
  },
};

for (const n of range) console.log(n); // 1, 2, 3, 4, 5
[...range];                             // [1, 2, 3, 4, 5]
```

### 9.2 Generator Functions

`function*` creates a generator, which implements both the iterator and
iterable protocols. `yield` pauses execution and produces a value.

```js
function* fibonacci() {
  let a = 0, b = 1;
  while (true) {
    yield a;
    [a, b] = [b, a + b];
  }
}

const fib = fibonacci();
fib.next(); // { value: 0, done: false }
fib.next(); // { value: 1, done: false }
fib.next(); // { value: 1, done: false }
fib.next(); // { value: 2, done: false }

// Take first N values
function* take(n, iterable) {
  let i = 0;
  for (const val of iterable) {
    if (i++ >= n) return;
    yield val;
  }
}
[...take(8, fibonacci())]; // [0, 1, 1, 2, 3, 5, 8, 13]
```

### 9.3 Async Generators

Combine generators with async/await for streaming data.

```js
async function* fetchPages(url) {
  let page = 1;
  while (true) {
    const res = await fetch(`${url}?page=${page}`);
    const data = await res.json();
    if (data.items.length === 0) return;
    yield* data.items;
    page++;
  }
}

for await (const item of fetchPages("/api/users")) {
  console.log(item.name);
}
```

---

## 10. Modules

### 10.1 CommonJS (Node.js)

Synchronous, dynamic. Each file gets its own scope. `require` is a function
call that can appear anywhere.

```js
// math.js
const PI = 3.14159;
function circleArea(r) { return PI * r * r; }
module.exports = { PI, circleArea };

// app.js
const { circleArea } = require("./math");
circleArea(5); // 78.53975
```

### 10.2 ES Modules (ESM)

Static, declarative. The standard since ES2015, supported in browsers and
Node.js (with `.mjs` extension or `"type": "module"` in package.json).

```js
// math.mjs
export const PI = 3.14159;
export function circleArea(r) { return PI * r * r; }
export default class Calculator { /* ... */ }

// app.mjs
import Calculator, { circleArea, PI } from "./math.mjs";
```

### 10.3 Dynamic `import()`

Returns a Promise. Enables code splitting and conditional loading.

```js
const button = document.getElementById("heavy-feature");
button.addEventListener("click", async () => {
  const { heavyComputation } = await import("./heavy.mjs");
  heavyComputation();
});
```

### 10.4 Dual-Package Hell

Publishing a package that works in both CommonJS and ESM contexts is
notoriously painful. The `"exports"` field in package.json helps:

```json
{
  "name": "my-lib",
  "type": "module",
  "exports": {
    ".": {
      "import": "./dist/index.mjs",
      "require": "./dist/index.cjs"
    }
  }
}
```

The core problem: CJS `require` is synchronous, ESM `import` is async. A CJS
module cannot `require()` an ESM module. An ESM module can `import` a CJS
module, but named exports may not be statically analyzable. Bundlers (Vite,
esbuild, webpack) paper over this at build time, but Node.js enforces the
boundary at runtime.

---

## 11. Error Handling

### 11.1 try/catch/finally

```js
try {
  const data = JSON.parse(rawInput);
  process(data);
} catch (err) {
  if (err instanceof SyntaxError) {
    console.error("Invalid JSON:", err.message);
  } else {
    throw err; // re-throw unexpected errors
  }
} finally {
  cleanup(); // always runs
}
```

### 11.2 Custom Errors

```js
class AppError extends Error {
  constructor(message, code) {
    super(message);
    this.name = "AppError";
    this.code = code;
  }
}

throw new AppError("Not found", 404);
```

### 11.3 Error.cause (ES2022)

Enables error chaining without losing the original stack trace.

```js
async function loadConfig(path) {
  try {
    const raw = await fs.readFile(path, "utf-8");
    return JSON.parse(raw);
  } catch (err) {
    throw new Error(`Failed to load config from ${path}`, { cause: err });
  }
}

// Consumer can inspect the chain:
try {
  await loadConfig("settings.json");
} catch (err) {
  console.error(err.message);       // "Failed to load config from settings.json"
  console.error(err.cause.message); // original error (ENOENT or SyntaxError)
}
```

---

## 12. Modern JavaScript Features

### 12.1 Optional Chaining `?.` (ES2020)

Short-circuits to `undefined` if a link in the chain is `null` or `undefined`.

```js
const street = user?.address?.street;          // property access
const first  = users?.[0];                      // indexed access
const result = callback?.();                    // function call

// Without optional chaining:
const street2 = user && user.address && user.address.street;
```

### 12.2 Nullish Coalescing `??` (ES2020)

Returns the right-hand side only if the left is `null` or `undefined`.
Unlike `||`, it does not trigger on `0`, `""`, or `false`.

```js
const port = config.port ?? 3000;              // only if null/undefined
const port2 = config.port || 3000;             // also triggers on 0
```

### 12.3 Logical Assignment (ES2021)

```js
opts.timeout ??= 5000;    // assign if null/undefined
opts.verbose ||= false;   // assign if falsy
opts.retries &&= 3;       // assign if truthy
```

### 12.4 Template Literals

```js
const name = "world";
const greeting = `hello, ${name}!`;            // interpolation

const multiline = `
  line 1
  line 2
`;

// Tagged templates -- custom processing
function sql(strings, ...values) {
  return { text: strings.join("$"), values };
}
const query = sql`SELECT * FROM users WHERE id = ${userId}`;
```

### 12.5 Destructuring

```js
// Array destructuring
const [first, second, ...rest] = [1, 2, 3, 4, 5];
// first=1, second=2, rest=[3,4,5]

// Object destructuring
const { name, age, city = "unknown" } = person;

// Nested
const { address: { zip } } = person;

// Renaming
const { name: fullName } = person;

// Swap
let a = 1, b = 2;
[a, b] = [b, a];
```

### 12.6 Structured Clone (ES2022)

Deep copy without JSON round-tripping. Handles circular references, Date,
RegExp, Map, Set, ArrayBuffer, and more.

```js
const original = { date: new Date(), nested: { a: 1 } };
const copy = structuredClone(original);
copy.nested.a = 99;
original.nested.a; // 1 (unaffected)
```

---

## 13. TypeScript Basics

TypeScript is a **statically typed superset of JavaScript** developed by
Microsoft. It compiles (transpiles) to plain JavaScript, erasing all type
information at runtime.

### 13.1 Structural Typing

TypeScript uses a **structural type system** (also called "duck typing").
Two types are compatible if their structures match, regardless of name.

```ts
interface Point { x: number; y: number; }
interface Coordinate { x: number; y: number; }

const p: Point = { x: 1, y: 2 };
const c: Coordinate = p; // OK -- same structure
```

This contrasts with **nominal typing** (Java, C#) where two types with
identical fields but different names are incompatible.

### 13.2 Type Inference

TypeScript infers types wherever it can, minimizing annotation burden.

```ts
let count = 0;                // inferred as number
const name = "Alice";         // inferred as literal type "Alice"
const nums = [1, 2, 3];      // inferred as number[]

function add(a: number, b: number) {
  return a + b;               // return type inferred as number
}
```

### 13.3 File Extensions and Compilation

- `.ts` -- TypeScript source
- `.tsx` -- TypeScript with JSX (React)
- `.d.ts` -- Declaration files (types only, no runtime code)
- `tsc` -- The TypeScript compiler
- `tsconfig.json` -- Project configuration

```bash
npx tsc --init          # generate tsconfig.json
npx tsc                 # compile project
npx tsc --noEmit        # type-check only, no output
```

---

## 14. TypeScript Types

### 14.1 Primitive Types

```ts
let n: number = 42;
let s: string = "hello";
let b: boolean = true;
let u: undefined = undefined;
let nl: null = null;
let bi: bigint = 100n;
let sym: symbol = Symbol("id");
```

### 14.2 Special Types

```ts
let anything: any = "no type safety";   // escapes type checking entirely
let safe: unknown = getUserInput();      // type-safe alternative to any
// safe.toLowerCase();                   // Error: Object is of type 'unknown'
if (typeof safe === "string") {
  safe.toLowerCase();                    // OK after narrowing
}

function throwError(msg: string): never {
  throw new Error(msg);                  // never returns
}

function log(msg: string): void {
  console.log(msg);                      // no meaningful return value
}
```

### 14.3 Literal Types

```ts
let direction: "north" | "south" | "east" | "west";
direction = "north";  // OK
// direction = "up";  // Error

let httpStatus: 200 | 404 | 500;
let toggle: true | false;  // equivalent to boolean
```

### 14.4 Union and Intersection Types

```ts
// Union: one of
type StringOrNumber = string | number;
function format(value: StringOrNumber) {
  if (typeof value === "string") return value.toUpperCase();
  return value.toFixed(2);
}

// Intersection: all of
type Timestamped = { createdAt: Date };
type Named = { name: string };
type TimestampedEntity = Timestamped & Named;
// { createdAt: Date; name: string }
```

### 14.5 Tuples

Fixed-length arrays with per-element types.

```ts
type Point = [number, number];
type NamedPoint = [string, number, number];

const origin: Point = [0, 0];
const [x, y] = origin;

// Labeled tuples (TS 4.0+)
type Range = [start: number, end: number];

// Variadic tuples
type Concat<A extends unknown[], B extends unknown[]> = [...A, ...B];
type Result = Concat<[string], [number, boolean]>; // [string, number, boolean]
```

---

## 15. Generics

Generics parameterize types, enabling reusable, type-safe abstractions.

### 15.1 Generic Functions

```ts
function identity<T>(value: T): T {
  return value;
}

identity<string>("hello");   // explicit
identity(42);                // inferred as identity<number>

function first<T>(arr: T[]): T | undefined {
  return arr[0];
}
```

### 15.2 Generic Interfaces and Classes

```ts
interface Repository<T> {
  findById(id: string): Promise<T>;
  save(entity: T): Promise<void>;
}

class InMemoryRepo<T extends { id: string }> implements Repository<T> {
  private items = new Map<string, T>();

  async findById(id: string) {
    const item = this.items.get(id);
    if (!item) throw new Error("Not found");
    return item;
  }

  async save(entity: T) {
    this.items.set(entity.id, entity);
  }
}
```

### 15.3 Constraints

```ts
function getLength<T extends { length: number }>(item: T): number {
  return item.length;
}

getLength("hello");     // 5
getLength([1, 2, 3]);   // 3
// getLength(42);       // Error: number has no 'length'
```

### 15.4 Default Type Parameters

```ts
interface ApiResponse<T = unknown> {
  data: T;
  status: number;
  timestamp: Date;
}

const untyped: ApiResponse = { data: {}, status: 200, timestamp: new Date() };
const typed: ApiResponse<User[]> = { data: users, status: 200, timestamp: new Date() };
```

---

## 16. Utility Types

TypeScript ships built-in type transformers.

### 16.1 Object Transformers

```ts
interface User {
  id: string;
  name: string;
  email: string;
  age: number;
}

type PartialUser   = Partial<User>;       // all fields optional
type RequiredUser  = Required<User>;      // all fields required
type ReadonlyUser  = Readonly<User>;      // all fields readonly
type UserPreview   = Pick<User, "id" | "name">;      // subset
type UserUpdate    = Omit<User, "id">;                // exclude fields
```

### 16.2 Record

Creates an object type from a key type and a value type.

```ts
type Role = "admin" | "editor" | "viewer";
type Permissions = Record<Role, boolean>;
// { admin: boolean; editor: boolean; viewer: boolean }

const perms: Permissions = { admin: true, editor: true, viewer: false };
```

### 16.3 Function Transformers

```ts
function createUser(name: string, age: number): User {
  return { id: crypto.randomUUID(), name, age, email: "" };
}

type CreateArgs   = Parameters<typeof createUser>;    // [string, number]
type CreateReturn = ReturnType<typeof createUser>;    // User
```

### 16.4 Awaited (TS 4.5+)

Unwraps Promise types recursively.

```ts
type A = Awaited<Promise<string>>;                    // string
type B = Awaited<Promise<Promise<number>>>;           // number
type C = Awaited<boolean | Promise<string>>;          // boolean | string
```

### 16.5 Other Useful Utilities

```ts
type NonNullUser   = NonNullable<User | null | undefined>;  // User
type UserKeys      = Extract<keyof User, "id" | "name">;    // "id" | "name"
type NonIdKeys     = Exclude<keyof User, "id">;              // "name" | "email" | "age"
```

---

## 17. Advanced TypeScript

### 17.1 Conditional Types

Type-level if/else. The pattern is `T extends U ? X : Y`.

```ts
type IsString<T> = T extends string ? true : false;

type A = IsString<"hello">;    // true
type B = IsString<42>;         // false

// Distributive conditional types: unions are distributed
type C = IsString<"hello" | 42>;  // true | false (i.e., boolean)
```

### 17.2 The `infer` Keyword

Extract types from within other types inside conditional type branches.

```ts
type ElementType<T> = T extends (infer E)[] ? E : never;
type X = ElementType<string[]>;     // string
type Y = ElementType<number>;       // never

type UnwrapPromise<T> = T extends Promise<infer R> ? R : T;
type Z = UnwrapPromise<Promise<boolean>>;  // boolean

// Extract function argument types
type FirstArg<F> = F extends (arg: infer A, ...rest: any[]) => any ? A : never;
type W = FirstArg<(x: string, y: number) => void>;  // string
```

### 17.3 Mapped Types

Transform each property of a type systematically.

```ts
type Nullable<T> = {
  [K in keyof T]: T[K] | null;
};

type Getters<T> = {
  [K in keyof T as `get${Capitalize<string & K>}`]: () => T[K];
};

type UserGetters = Getters<User>;
// { getId: () => string; getName: () => string; getEmail: () => string; getAge: () => number }
```

### 17.4 Template Literal Types (TS 4.1+)

String manipulation at the type level.

```ts
type EventName = `on${Capitalize<"click" | "hover" | "focus">}`;
// "onClick" | "onHover" | "onFocus"

type CSSProperty = `${string}-${string}`;
// matches "font-size", "background-color", etc.

type Getter<T extends string> = `get${Capitalize<T>}`;
type SetName = Getter<"name">;  // "getName"
```

### 17.5 `keyof` and Indexed Access Types

```ts
type UserKeys = keyof User;          // "id" | "name" | "email" | "age"
type NameType = User["name"];        // string

function getProperty<T, K extends keyof T>(obj: T, key: K): T[K] {
  return obj[key];
}

const user: User = { id: "1", name: "Alice", email: "a@b.c", age: 30 };
const name = getProperty(user, "name");  // type: string
// getProperty(user, "invalid");         // Error
```

### 17.6 Discriminated Unions

A union of object types that share a literal "tag" field. TypeScript narrows
the type based on the tag value.

```ts
type Shape =
  | { kind: "circle"; radius: number }
  | { kind: "rect"; width: number; height: number }
  | { kind: "triangle"; base: number; height: number };

function area(shape: Shape): number {
  switch (shape.kind) {
    case "circle":
      return Math.PI * shape.radius ** 2;
    case "rect":
      return shape.width * shape.height;
    case "triangle":
      return 0.5 * shape.base * shape.height;
  }
}
```

Adding a new variant without updating `area` produces a compile error if
exhaustiveness checking is enabled (via `never` in the default case):

```ts
function area(shape: Shape): number {
  switch (shape.kind) {
    case "circle":   return Math.PI * shape.radius ** 2;
    case "rect":     return shape.width * shape.height;
    case "triangle": return 0.5 * shape.base * shape.height;
    default: {
      const _exhaustive: never = shape;  // Error if a case is missing
      return _exhaustive;
    }
  }
}
```

### 17.7 Type Guards

Custom functions that narrow types.

```ts
function isString(value: unknown): value is string {
  return typeof value === "string";
}

function process(input: string | number) {
  if (isString(input)) {
    console.log(input.toUpperCase()); // narrowed to string
  } else {
    console.log(input.toFixed(2));    // narrowed to number
  }
}

// Assertion functions (TS 3.7)
function assertDefined<T>(value: T | undefined): asserts value is T {
  if (value === undefined) throw new Error("Expected defined value");
}

let maybeUser: User | undefined;
assertDefined(maybeUser);
maybeUser.name;  // OK -- narrowed to User after assertion
```

### 17.8 `satisfies` (TS 4.9)

Validates a value against a type without widening the inferred type.

```ts
type ColorMap = Record<string, [number, number, number] | string>;

// Without satisfies: type is widened to ColorMap
const colors1: ColorMap = {
  red: [255, 0, 0],
  green: "#00ff00",
};
// colors1.red is [number, number, number] | string -- too wide

// With satisfies: inferred types are preserved
const colors2 = {
  red: [255, 0, 0],
  green: "#00ff00",
} satisfies ColorMap;
// colors2.red is [number, number, number]
// colors2.green is string
colors2.red[0]; // OK -- known to be a tuple
```

### 17.9 `const` Assertions and `as const`

```ts
// Without as const: type is { x: number; y: number }
const point1 = { x: 10, y: 20 };

// With as const: type is { readonly x: 10; readonly y: 20 }
const point2 = { x: 10, y: 20 } as const;

// Particularly useful for arrays as tuples
const directions = ["north", "south", "east", "west"] as const;
type Direction = (typeof directions)[number];
// "north" | "south" | "east" | "west"
```

---

## 18. TSConfig Reference

The `tsconfig.json` file configures the TypeScript compiler. Key options:

### 18.1 `strict`

Enables all strict type-checking options at once. This is the recommended
baseline for any new project.

```json
{
  "compilerOptions": {
    "strict": true
  }
}
```

`strict: true` enables: `strictNullChecks`, `strictFunctionTypes`,
`strictBindCallApply`, `strictPropertyInitialization`, `noImplicitAny`,
`noImplicitThis`, `alwaysStrict`, `useUnknownInCatchVariables`.

### 18.2 `target`

The ECMAScript version for output. Common choices:

| Target   | Use case                             |
|----------|--------------------------------------|
| `ES2020` | Modern Node.js (14+)                 |
| `ES2022` | Modern Node.js (18+), recent browsers|
| `ESNext` | Bundler handles downleveling          |

```json
{ "compilerOptions": { "target": "ES2022" } }
```

### 18.3 `module` and `moduleResolution`

| `module`        | `moduleResolution`  | Use case                     |
|-----------------|---------------------|------------------------------|
| `CommonJS`      | `node`              | Node.js CJS                  |
| `ESNext`        | `bundler`           | Vite, webpack, esbuild       |
| `Node16`        | `node16`            | Node.js with ESM support     |
| `NodeNext`      | `nodenext`          | Latest Node.js behavior      |

```json
{
  "compilerOptions": {
    "module": "ESNext",
    "moduleResolution": "bundler"
  }
}
```

### 18.4 `jsx`

| Value         | Output                       |
|---------------|------------------------------|
| `react`       | `React.createElement()`      |
| `react-jsx`   | `_jsx()` (React 17+ transform)|
| `preserve`    | Leave JSX for another tool   |

### 18.5 `isolatedModules`

Requires that every file be compilable in isolation (no cross-file type-only
constructs). Required by esbuild, SWC, and other single-file transpilers.

```json
{ "compilerOptions": { "isolatedModules": true } }
```

This flag disallows `const enum` re-exports, namespace merging across files,
and other patterns that require whole-program analysis.

### 18.6 Full Recommended Configuration

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "isolatedModules": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "outDir": "dist"
  },
  "include": ["src"],
  "exclude": ["node_modules", "dist"]
}
```

---

## 19. Type vs Runtime: The Erasure Model

### 19.1 How Erasure Works

TypeScript types are entirely **erased** at compile time. No type information
exists in the emitted JavaScript. This has profound implications:

```ts
// TypeScript source
function greet(name: string): string {
  return `hello, ${name}`;
}

// Compiled JavaScript output (all types removed)
function greet(name) {
  return `hello, ${name}`;
}
```

You cannot check types at runtime:

```ts
// This does NOT work
function isUser(value: unknown): value is User {
  return value instanceof User; // User is an interface -- erased!
}
```

Interfaces, type aliases, generics, and utility types leave zero trace in the
output. Only `class` declarations survive because they are JavaScript runtime
constructs.

### 19.2 `import type`

Explicitly marks an import as type-only, ensuring the import is erased and
does not appear in the JavaScript output.

```ts
import type { User } from "./types";       // erased
import { createUser } from "./users";       // preserved

// Inline type-only imports (TS 4.5+)
import { createUser, type User } from "./users";
```

This prevents circular dependency issues and ensures dead-code elimination
works correctly with bundlers.

### 19.3 Runtime Validation Libraries

Since TypeScript types disappear at runtime, you need separate validation for
untrusted data (API responses, user input, file contents). The major libraries:

**Zod** -- the most popular, schema-first:

```ts
import { z } from "zod";

const UserSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  email: z.string().email(),
  age: z.number().int().positive(),
});

// Infer the TypeScript type FROM the schema
type User = z.infer<typeof UserSchema>;
// { id: string; name: string; email: string; age: number }

// Runtime validation
const result = UserSchema.safeParse(untrustedData);
if (result.success) {
  console.log(result.data.name); // type-safe
} else {
  console.error(result.error.issues);
}
```

**Valibot** -- tree-shakeable, smaller bundle:

```ts
import * as v from "valibot";

const UserSchema = v.object({
  id: v.pipe(v.string(), v.uuid()),
  name: v.pipe(v.string(), v.minLength(1)),
  email: v.pipe(v.string(), v.email()),
  age: v.pipe(v.number(), v.integer(), v.minValue(1)),
});

type User = v.InferOutput<typeof UserSchema>;
```

**io-ts** -- functional programming style, Decoder pattern:

```ts
import * as t from "io-ts";
import { isRight } from "fp-ts/Either";

const User = t.type({
  id: t.string,
  name: t.string,
  email: t.string,
  age: t.number,
});

type User = t.TypeOf<typeof User>;

const result = User.decode(untrustedData);
if (isRight(result)) {
  console.log(result.right.name);
}
```

### 19.4 The Schema-First Pattern

The recommended modern approach: define the schema once, derive both the
TypeScript type and the runtime validator from it. This eliminates the risk
of type definitions drifting from validation logic.

```ts
// schema.ts -- single source of truth
import { z } from "zod";

export const ConfigSchema = z.object({
  port: z.number().default(3000),
  host: z.string().default("localhost"),
  debug: z.boolean().default(false),
});

export type Config = z.infer<typeof ConfigSchema>;

// usage.ts
import { ConfigSchema, type Config } from "./schema";

function loadConfig(raw: unknown): Config {
  return ConfigSchema.parse(raw); // throws on invalid data
}
```

This pattern collapses the traditional duplication between "the type I check
against at compile time" and "the shape I validate at runtime" into a single
declaration.

---

## Appendix A: Type System Mental Model

Understanding the relationship between JavaScript and TypeScript types
requires a clear mental model:

```
  JavaScript Runtime          TypeScript Compile-Time
  ==================          =======================
  typeof x === "number"       x: number
  typeof x === "string"       x: string
  typeof x === "boolean"      x: boolean
  typeof x === "undefined"    x: undefined
  typeof x === "bigint"       x: bigint
  typeof x === "symbol"       x: symbol
  typeof x === "function"     x: (...) => ...
  typeof x === "object"       x: object | null
  Array.isArray(x)            x: T[]
  x instanceof Date           x: Date
  --- no runtime equivalent ---
                               x: unknown
                               x: never
                               x: void
                               x: any
                               type X = ...
                               interface X { ... }
                               X<T> (generics)
```

TypeScript adds a layer of compile-time reasoning that has no runtime cost.
The types `unknown`, `never`, `void`, and `any` exist purely in the compiler's
model of the program. Generics, interfaces, and type aliases are similarly
compile-time-only constructs.

The power of TypeScript is that this compile-time layer catches entire
categories of bugs -- null dereferences, property misspellings, argument
type mismatches, missing switch cases -- before any code runs. The cost is
zero at runtime because the types are erased. The tradeoff is that you
cannot rely on TypeScript types for runtime safety; that responsibility falls
to validation libraries or explicit runtime checks.

---

## Appendix B: Version Timeline

| Year | ECMAScript | Key Additions                                    |
|------|------------|--------------------------------------------------|
| 2009 | ES5        | strict mode, JSON, Array methods                 |
| 2015 | ES6/ES2015 | let/const, arrow, class, Promise, Symbol, Map/Set|
| 2016 | ES2016     | Array.includes, `**` operator                    |
| 2017 | ES2017     | async/await, Object.entries/values                |
| 2018 | ES2018     | rest/spread for objects, async iteration          |
| 2019 | ES2019     | flat/flatMap, Object.fromEntries, optional catch  |
| 2020 | ES2020     | ?., ??, BigInt, globalThis, Promise.allSettled     |
| 2021 | ES2021     | ??=, ||=, &&=, String.replaceAll                  |
| 2022 | ES2022     | top-level await, #private, Error.cause, at()      |
| 2023 | ES2023     | toSorted, toReversed, toSpliced, findLast         |
| 2024 | ES2024     | Object.groupBy, Promise.withResolvers, Set methods|

| Year | TypeScript | Key Additions                                     |
|------|------------|---------------------------------------------------|
| 2012 | 0.8        | Initial release                                   |
| 2014 | 1.0        | Stable release                                    |
| 2016 | 2.0        | Non-nullable types, tagged unions                 |
| 2018 | 3.0        | Project references, unknown type                  |
| 2020 | 4.0        | Variadic tuples, labeled tuples                   |
| 2021 | 4.1        | Template literal types, key remapping             |
| 2022 | 4.7        | ESM support for Node.js (node16/nodenext)         |
| 2022 | 4.9        | satisfies operator                                |
| 2023 | 5.0        | Decorators (Stage 3), bundler moduleResolution    |
| 2024 | 5.4        | NoInfer utility type                              |
| 2025 | 5.8        | Erasable type-only syntax in JS files             |
