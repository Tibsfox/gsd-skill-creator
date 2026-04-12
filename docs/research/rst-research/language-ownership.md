# Rust Language: Ownership, Types, Traits, and Core Features

## Design Philosophy

Rust is a systems programming language built on three pillars: **zero-cost abstractions**, **fearless concurrency**, and **memory safety without garbage collection**. The compiler refuses to produce a binary unless it can prove the absence of data races, use-after-free, double-free, and dangling references at compile time.

The language emerged from Graydon Hoare's work at Mozilla Research beginning around 2006, reaching 1.0 on May 15, 2015. The core insight: most memory safety bugs in C/C++ fall into categories a sufficiently expressive type system can prevent. Rather than a runtime garbage collector, Rust encodes ownership and borrowing rules into the type system. The result: native-code performance with safety guarantees stronger than most managed languages.

Zero-cost abstractions mean high-level constructs (iterators, closures, generics) compile to the same machine code as hand-written C. Fearless concurrency means the type system prevents data races at compile time. Memory safety without GC means no stop-the-world pauses, no tuning, and deterministic cleanup via `Drop`.

Rust's edition system (2015, 2018, 2021, 2024) evolves the language without breaking backward compatibility. Crates targeting different editions interoperate seamlessly.

---

## Ownership

Every value has exactly one owner. When the owner goes out of scope, the value is dropped. No garbage collector, no reference counting by default, no manual `free()`.

**The three rules:** (1) Each value has exactly one owner. (2) Only one owner at a time. (3) When the owner goes out of scope, the value is dropped.

### Move Semantics

Assignment **moves** by default. The original binding becomes invalid:

```rust
fn main() {
    let s1 = String::from("hello");
    let s2 = s1; // s1 is MOVED into s2
    // println!("{}", s1); // ERROR: value used after move
    println!("{}", s2); // OK: s2 owns the string
}
```

Passing to a function also moves:

```rust
fn take_ownership(s: String) {
    println!("I own: {}", s);
} // s is dropped here

fn main() {
    let greeting = String::from("hello");
    take_ownership(greeting);
    // greeting is no longer valid here
}
```

### `Copy` and `Clone`

Types that live entirely on the stack can implement `Copy` -- assignment becomes a bitwise copy and the original stays valid. All primitives, `bool`, `char`, and tuples/arrays of `Copy` types are `Copy`. A type cannot implement both `Copy` and `Drop`.

`Clone` provides explicit deep copying via `.clone()` and can be arbitrarily expensive:

```rust
fn main() {
    let x: i32 = 42;
    let y = x;  // Copy: both valid
    println!("x={}, y={}", x, y);

    let s1 = String::from("deep copy");
    let s2 = s1.clone(); // explicit heap allocation
    println!("s1={}, s2={}", s1, s2); // both valid
}
```

---

## Borrowing

References let you use a value without taking ownership. The compiler guarantees every reference is always valid.

**Borrowing rules:** (1) Any number of `&T` OR exactly one `&mut T`, never both. (2) References must always be valid. This is **aliasing XOR mutation**.

```rust
fn calculate_length(s: &String) -> usize {
    s.len()
} // s doesn't own the String, nothing dropped

fn append_world(s: &mut String) {
    s.push_str(", world!");
}

fn main() {
    let mut s = String::from("hello");
    let len = calculate_length(&s);
    println!("'{}' has length {}", s, len);

    append_world(&mut s);
    println!("{}", s); // "hello, world!"

    // Multiple immutable refs are fine:
    let r1 = &s;
    let r2 = &s;
    println!("{} {}", r1, r2);
    // After last use of r1/r2 (NLL), mutable borrow is allowed:
    let r3 = &mut s;
    r3.push_str("!");
}
```

---

## Lifetimes

Every reference has a lifetime. The compiler usually infers them, but sometimes needs explicit annotations (`'a`) to prove references don't outlive their referents.

```rust
fn longest<'a>(x: &'a str, y: &'a str) -> &'a str {
    if x.len() > y.len() { x } else { y }
}

fn main() {
    let s1 = String::from("long string");
    let result;
    {
        let s2 = String::from("xyz");
        result = longest(s1.as_str(), s2.as_str());
        println!("Longest: {}", result);
    }
}
```

### Elision Rules

Three rules let the compiler infer lifetimes on most signatures: (1) Each input reference gets its own lifetime. (2) If one input lifetime, it applies to all outputs. (3) If `&self` or `&mut self` is an input, its lifetime applies to outputs.

### Lifetimes on Structs

```rust
struct Excerpt<'a> {
    text: &'a str,
}

impl<'a> Excerpt<'a> {
    fn announce(&self, msg: &str) -> &str {
        println!("{}", msg);
        self.text // elision rule 3: lifetime of self
    }
}
```

### `'static`

The `'static` lifetime means valid for the entire program. String literals are `&'static str`. Thread-spawned closures require `'static` bounds because the thread may outlive the caller.

---

## The Borrow Checker

Niko Matsakis's key contribution. The compiler pass that enforces ownership and borrowing rules, preventing: use-after-free, double-free, dangling references, data races, and iterator invalidation.

```rust
fn main() {
    let mut v = vec![1, 2, 3];
    // for &item in &v { v.push(item * 2); } // ERROR: can't mutate while borrowed
    let doubled: Vec<i32> = v.iter().map(|x| x * 2).collect();
    v.extend(doubled); // safe: no active borrows
}
```

**Non-Lexical Lifetimes (NLL)**, stabilized in Rust 2018, narrows borrows to end at the last point of use rather than the lexical scope. This eliminated many false rejections.

**Polonius** is the next-gen borrow checker (in development), using Datalog-based analysis for even more precise tracking of which references are live at which points.

---

## Types

### Primitives

| Category | Types |
|----------|-------|
| Signed integers | `i8`, `i16`, `i32`, `i64`, `i128`, `isize` |
| Unsigned integers | `u8`, `u16`, `u32`, `u64`, `u128`, `usize` |
| Floating point | `f32`, `f64` |
| Boolean | `bool` |
| Character | `char` (4 bytes, Unicode scalar value) |
| Unit | `()` (zero-size, like `void`) |
| Never | `!` (computations that never complete) |

```rust
fn main() {
    let count: u32 = 1_000_000;
    let temperature: f64 = -40.0;
    let crab: char = '\u{1F980}';
    let unit: () = ();
    let ptr_size: usize = std::mem::size_of::<usize>(); // 8 on 64-bit
}
```

### Tuples, Arrays, and Slices

```rust
fn mean(data: &[f64]) -> f64 {
    data.iter().sum::<f64>() / data.len() as f64
}

fn main() {
    let point = (3.0, 4.0, "origin");
    let (x, y, _label) = point; // destructure

    let arr: [i32; 5] = [1, 2, 3, 4, 5];
    let slice: &[i32] = &arr[1..4]; // [2, 3, 4]

    let floats = [1.0, 2.0, 3.0, 4.0];
    println!("mean: {}", mean(&floats));
}
```

The `!` (never) type can coerce to any type, which is why `panic!()` works in any expression position.

---

## Structs

```rust
#[derive(Debug, Clone, PartialEq)]
struct Point {
    x: f64,
    y: f64,
}

impl Point {
    fn new(x: f64, y: f64) -> Self { Point { x, y } }  // associated function

    fn distance_to(&self, other: &Point) -> f64 {       // method (&self)
        ((self.x - other.x).powi(2) + (self.y - other.y).powi(2)).sqrt()
    }

    fn translate(&mut self, dx: f64, dy: f64) {          // method (&mut self)
        self.x += dx;
        self.y += dy;
    }

    fn into_tuple(self) -> (f64, f64) { (self.x, self.y) } // consumes self
}
```

**Tuple structs** wrap unnamed fields (newtype pattern): `struct Meters(f64);`

**Unit structs** have no fields, used as markers: `struct Production;`

**Derive macros** auto-implement common traits: `Debug`, `Clone`, `Copy`, `PartialEq`, `Eq`, `PartialOrd`, `Ord`, `Hash`, `Default`.

---

## Enums and Pattern Matching

Rust enums are algebraic data types. Each variant can hold different data:

```rust
#[derive(Debug)]
enum Shape {
    Circle(f64),                            // tuple variant
    Rectangle { width: f64, height: f64 },  // struct variant
    Triangle(f64, f64, f64),                // tuple variant
    Point,                                   // unit variant
}

impl Shape {
    fn area(&self) -> f64 {
        match self {
            Shape::Circle(r) => std::f64::consts::PI * r * r,
            Shape::Rectangle { width, height } => width * height,
            Shape::Triangle(a, b, c) => {
                let s = (a + b + c) / 2.0;
                (s * (s - a) * (s - b) * (s - c)).sqrt()
            }
            Shape::Point => 0.0,
        }
    }
}
```

### `Option<T>` and `Result<T, E>`

`Option` replaces null; `Result` replaces exceptions:

```rust
fn find_user(id: u64) -> Option<String> {
    match id {
        1 => Some("Alice".into()),
        2 => Some("Bob".into()),
        _ => None,
    }
}

fn parse_port(s: &str) -> Result<u16, String> {
    s.parse::<u16>().map_err(|e| format!("Invalid port '{}': {}", s, e))
}

fn main() {
    match find_user(1) {
        Some(name) => println!("Found: {}", name),
        None => println!("Not found"),
    }
    let upper = find_user(2).map(|n| n.to_uppercase()); // Some("BOB")
    let fallback = find_user(99).unwrap_or_else(|| "anonymous".into());
}
```

### `if let`, `while let`, `let else`

```rust
fn main() {
    let val: Option<u32> = Some(3);
    if let Some(max) = val { println!("Max: {}", max); }

    let mut stack = vec![1, 2, 3];
    while let Some(top) = stack.pop() { println!("Popped: {}", top); }

    let input = "42";
    let Ok(number) = input.parse::<i32>() else { return; }; // stable since 1.65
    println!("Parsed: {}", number);
}
```

---

## Traits

Traits define shared behavior -- Rust's answer to interfaces and typeclasses.

```rust
trait Summary {
    fn summarize_author(&self) -> String;         // required
    fn summarize(&self) -> String {                // default method
        format!("(Read more from {}...)", self.summarize_author())
    }
}

struct Article { title: String, author: String, content: String }
struct Tweet { username: String, content: String }

impl Summary for Article {
    fn summarize_author(&self) -> String { self.author.clone() }
    fn summarize(&self) -> String {
        format!("{} by {}", self.title, self.author)
    }
}

impl Summary for Tweet {
    fn summarize_author(&self) -> String { format!("@{}", self.username) }
}
```

### Trait Bounds and Where Clauses

```rust
fn notify(item: &impl Summary) { println!("{}", item.summarize()); }

fn compare<T, U>(a: &T, b: &U) -> String
where T: Summary + Clone, U: Summary + Clone {
    format!("{} vs {}", a.summarize(), b.summarize())
}
```

### `impl Trait` in Return Position

```rust
fn make_summarizable(text: String) -> impl Summary {
    Tweet { username: "system".into(), content: text }
}
```

### Blanket Implementations

```rust
use std::fmt;
// The stdlib does: impl<T: fmt::Display> ToString for T
// So anything Display automatically gets .to_string()
```

### Orphan Rule

You can implement a trait for a type only if either the trait or the type is defined in your crate. The **newtype pattern** works around this:

```rust
struct Wrapper(Vec<String>);
impl fmt::Display for Wrapper {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        write!(f, "[{}]", self.0.join(", "))
    }
}
```

### Supertraits and Trait Objects

A trait can require another: `trait Animal: fmt::Display { ... }`. `dyn Trait` enables runtime polymorphism via vtable dispatch:

```rust
fn get_processor(upper: bool) -> Box<dyn Summary> {
    if upper { Box::new(Article { /* ... */ }) }
    else { Box::new(Tweet { /* ... */ }) }
}
```

---

## Generics

Rust generics are **monomorphized** at compile time -- specialized code for each concrete type, like C++ templates. Zero runtime cost.

```rust
fn largest<T: PartialOrd>(list: &[T]) -> &T {
    let mut largest = &list[0];
    for item in &list[1..] {
        if item > largest { largest = item; }
    }
    largest
}

#[derive(Debug)]
struct Pair<T, U> { first: T, second: U }

impl<T, U> Pair<T, U> {
    fn new(first: T, second: U) -> Self { Pair { first, second } }
}
```

### Const Generics (stable since 1.51)

```rust
struct Matrix<const ROWS: usize, const COLS: usize> {
    data: [[f64; COLS]; ROWS],
}

impl<const ROWS: usize, const COLS: usize> Matrix<ROWS, COLS> {
    fn zero() -> Self { Matrix { data: [[0.0; COLS]; ROWS] } }

    fn transpose(&self) -> Matrix<COLS, ROWS> {
        let mut result = Matrix::<COLS, ROWS>::zero();
        for i in 0..ROWS {
            for j in 0..COLS { result.data[j][i] = self.data[i][j]; }
        }
        result
    }
}
```

---

## Error Handling

No exceptions. Errors are values: `Result<T, E>` and `Option<T>`.

### The `?` Operator

Propagates errors, converting via `From` if needed:

```rust
use std::fs;
use std::num::ParseIntError;

#[derive(Debug)]
enum AppError {
    Io(std::io::Error),
    Parse(ParseIntError),
}

impl From<std::io::Error> for AppError {
    fn from(e: std::io::Error) -> Self { AppError::Io(e) }
}
impl From<ParseIntError> for AppError {
    fn from(e: ParseIntError) -> Self { AppError::Parse(e) }
}

fn read_config_value(path: &str) -> Result<i32, AppError> {
    let contents = fs::read_to_string(path)?;  // io::Error -> AppError
    let value = contents.trim().parse::<i32>()?; // ParseIntError -> AppError
    Ok(value)
}
```

### `thiserror` and `anyhow`

David Tolnay's crates cover most needs. `thiserror` for library code (structured errors with derive); `anyhow` for application code (opaque error boxing with `.context()`).

```rust
// thiserror example:
// #[derive(thiserror::Error, Debug)]
// enum DataError {
//     #[error("I/O error: {0}")]
//     Io(#[from] std::io::Error),
//     #[error("parse error on line {line}: {message}")]
//     Parse { line: usize, message: String },
// }
```

`unwrap()` and `expect()` panic on `None`/`Err` -- use for prototyping or truly impossible failures.

---

## Smart Pointers

### `Box<T>` -- Heap Allocation

```rust
// Required for recursive types (compiler needs known size)
enum List<T> {
    Cons(T, Box<List<T>>),
    Nil,
}
```

### `Rc<T>` -- Reference Counting (single-threaded)

```rust
use std::rc::Rc;
let data = Rc::new(vec![1, 2, 3]);
let r1 = Rc::clone(&data); // ref count: 2
let r2 = Rc::clone(&data); // ref count: 3
println!("Count: {}", Rc::strong_count(&data));
```

### `Arc<Mutex<T>>` -- Thread-safe shared mutable state

```rust
use std::sync::{Arc, Mutex};
use std::thread;

fn main() {
    let counter = Arc::new(Mutex::new(0));
    let mut handles = vec![];

    for _ in 0..10 {
        let counter = Arc::clone(&counter);
        handles.push(thread::spawn(move || {
            let mut num = counter.lock().unwrap();
            *num += 1;
        }));
    }

    for h in handles { h.join().unwrap(); }
    println!("Final: {}", *counter.lock().unwrap()); // 10
}
```

### Interior Mutability

`RefCell<T>` moves borrow checking to runtime (panics on violation). `Cell<T>` provides zero-overhead interior mutability for `Copy` types via get/set:

```rust
use std::cell::RefCell;

struct Logger {
    messages: RefCell<Vec<String>>,
}

impl Logger {
    fn log(&self, msg: &str) {
        self.messages.borrow_mut().push(msg.to_string()); // mutate through &self
    }
}
```

`Deref` enables auto-dereferencing (so `Box<String>` can call `String` methods). `Drop` provides custom destructors.

---

## Closures

Anonymous functions capturing from their environment. Typed by which `Fn` trait they implement:

- **`Fn`** -- borrows immutably, callable many times
- **`FnMut`** -- borrows mutably, callable many times
- **`FnOnce`** -- consumes captured values, callable once

```rust
fn apply<F: Fn(i32) -> i32>(f: F, value: i32) -> i32 { f(value) }

fn make_adder(x: i32) -> impl Fn(i32) -> i32 {
    move |y| x + y  // move captures x by value
}

fn main() {
    let double = |x| x * 2;
    println!("{}", apply(double, 5)); // 10

    let add_ten = make_adder(10);
    println!("{}", add_ten(5));  // 15

    // FnMut: mutably borrows count
    let mut count = 0;
    let mut inc = || { count += 1; count };
    println!("{}", inc()); // 1
    println!("{}", inc()); // 2

    // FnOnce: moves data into closure
    let data = vec![1, 2, 3];
    let consume = move || println!("{:?}", data);
    consume();
    // data no longer accessible
}
```

---

## Iterators

The `Iterator` trait requires one method: `fn next(&mut self) -> Option<Self::Item>`. Everything else builds on this.

### Adaptors (lazy) and Consumers (eager)

```rust
fn main() {
    let numbers = vec![1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

    let result: Vec<i32> = numbers.iter()
        .filter(|&&x| x % 2 == 0)    // keep evens
        .map(|&x| x * x)              // square them
        .take(3)                        // first 3
        .collect();                     // consume
    println!("{:?}", result); // [4, 16, 36]

    let sum = (1..=100).fold(0u64, |acc, x| acc + x); // 5050

    // zip, chain, enumerate, flat_map
    let keys = vec!["a", "b", "c"];
    let vals = vec![1, 2, 3];
    let pairs: Vec<_> = keys.iter().zip(vals.iter()).collect();

    let sentences = vec!["hello world", "foo bar"];
    let words: Vec<&str> = sentences.iter()
        .flat_map(|s| s.split_whitespace()).collect();

    // any, all, find
    let has_neg = numbers.iter().any(|&x| x < 0);
    let first_even = numbers.iter().find(|&&x| x % 2 == 0);
}
```

### Implementing Iterator

```rust
struct Fibonacci { a: u64, b: u64 }
impl Fibonacci { fn new() -> Self { Fibonacci { a: 0, b: 1 } } }

impl Iterator for Fibonacci {
    type Item = u64;
    fn next(&mut self) -> Option<u64> {
        let result = self.a;
        let new_b = self.a.checked_add(self.b)?;
        self.a = self.b;
        self.b = new_b;
        Some(result)
    }
}

fn main() {
    let fibs: Vec<u64> = Fibonacci::new().take(20).collect();
    let sum: u64 = Fibonacci::new().take(10).sum();
}
```

Iterator chains compile to the same assembly as hand-written loops -- zero-cost abstraction in practice.

---

## Collections

| Type | Description | Ordered | Unique Keys | Complexity |
|------|-------------|---------|-------------|------------|
| `Vec<T>` | Growable array | By insertion | No | O(1) push/pop |
| `HashMap<K,V>` | Hash table | No | Yes | O(1) avg lookup |
| `HashSet<T>` | Hash set | No | Yes | O(1) avg contains |
| `BTreeMap<K,V>` | B-tree map | By key | Yes | O(log n) |
| `BTreeSet<T>` | B-tree set | By value | Yes | O(log n) |
| `VecDeque<T>` | Double-ended queue | By insertion | No | O(1) push/pop both ends |
| `BinaryHeap<T>` | Max-heap | By priority | No | O(log n) push/pop |
| `LinkedList<T>` | Doubly-linked list | By insertion | No | Rarely used |

```rust
use std::collections::HashMap;

fn main() {
    let mut scores: HashMap<&str, i32> = HashMap::new();
    scores.insert("Alice", 100);
    scores.entry("Bob").or_insert(85); // insert if absent
    *scores.entry("Alice").or_insert(0) += 10; // update existing

    // Word frequency
    let text = "hello world hello rust world rust rust";
    let mut freq: HashMap<&str, u32> = HashMap::new();
    for word in text.split_whitespace() {
        *freq.entry(word).or_insert(0) += 1;
    }
}
```

---

## Strings

- **`String`**: owned, heap-allocated, growable, guaranteed UTF-8.
- **`&str`**: borrowed slice into UTF-8 bytes.
- **`OsString`/`OsStr`**: platform-native (not necessarily UTF-8 on Windows).
- **`CString`/`CStr`**: null-terminated for C FFI.
- **`PathBuf`/`Path`**: filesystem paths (wraps `OsStr`).

String handling is "hard" because Rust enforces UTF-8 correctness. `s[0]` is a compile error since UTF-8 chars are variable-width (1-4 bytes):

```rust
fn main() {
    let mut s = String::from("hello");
    s.push_str(", world");
    let borrowed: &str = &s;

    let russian = "Zdravstvujtye"; // ASCII for simplicity
    for c in russian.chars() { print!("{} ", c); }  // by Unicode scalar
    println!();
    for b in russian.bytes() { print!("{} ", b); }  // by raw byte
    println!();

    let path = std::path::PathBuf::from("/home/user/file.txt");
    println!("Stem: {:?}, Ext: {:?}", path.file_stem(), path.extension());
}
```

---

## Modules and Visibility

| Modifier | Scope |
|----------|-------|
| (none) | Private to current module and children |
| `pub` | Public |
| `pub(crate)` | Visible within current crate |
| `pub(super)` | Visible to parent module |

```rust
mod network {
    pub mod server {
        pub fn start(port: u16) {
            println!("Starting on port {}", port);
            let config = super::load_config();
        }
        fn listen(port: u16) { /* private */ }
    }
    fn load_config() -> String { "default".into() }
    pub(crate) fn internal_helper() { /* crate-visible */ }
}
```

Modules map to files: `mod foo;` looks for `foo.rs` or `foo/mod.rs`. `use` imports items: `use std::collections::HashMap;`. Re-export with `pub use`.

---

## Unsafe Rust

`unsafe` does not disable the borrow checker. It unlocks five capabilities the compiler cannot verify:

1. Dereference raw pointers (`*const T`, `*mut T`)
2. Call `unsafe` functions
3. Access/modify mutable statics
4. Implement `unsafe` traits (`Send`, `Sync`)
5. Access `union` fields

```rust
unsafe fn dangerous(ptr: *mut i32, len: usize) {
    let slice = std::slice::from_raw_parts_mut(ptr, len);
    for item in slice.iter_mut() { *item *= 2; }
}

fn safe_wrapper(data: &mut [i32]) {
    unsafe { dangerous(data.as_mut_ptr(), data.len()); }
}

// FFI
extern "C" { fn abs(input: i32) -> i32; }

#[no_mangle]
pub extern "C" fn rust_add(a: i32, b: i32) -> i32 { a + b }
```

The key principle: minimize `unsafe` surface area and encapsulate it behind safe abstractions. `Vec`, `HashMap`, and `String` all use `unsafe` internally but expose safe APIs.

---

## Macros

### Declarative Macros (`macro_rules!`)

Pattern-matching code generation at compile time:

```rust
macro_rules! hashmap {
    ($($key:expr => $value:expr),* $(,)?) => {{
        let mut map = std::collections::HashMap::new();
        $(map.insert($key, $value);)*
        map
    }};
}

fn main() {
    let scores = hashmap! { "Alice" => 100, "Bob" => 85 };
    println!("{:?}", scores);
}
```

**Common stdlib macros:** `println!`, `format!`, `vec!`, `todo!()`, `unimplemented!()`, `dbg!()`, `assert!`, `assert_eq!`, `cfg!`, `include_str!`, `include_bytes!`.

### Procedural Macros

Operate on token streams, defined in separate crates. Three kinds: derive, attribute, function-like. The ecosystem relies on David Tolnay's `syn`/`quote`/`proc-macro2` crates:

```rust
// Derive macro (user writes):
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
struct User { name: String, age: u32 }

// Attribute macro:
#[tokio::main]
async fn main() { /* transformed into runtime setup */ }
```

The derive macro infrastructure powers `serde` (serialization), `clap` (CLI parsing), `thiserror` (error types) -- ergonomic APIs with zero runtime overhead.

---

## Putting It All Together

A complete example combining ownership, traits, generics, error handling, iterators, `Arc<Mutex<T>>`, and closures:

```rust
use std::collections::HashMap;
use std::sync::{Arc, Mutex};
use std::thread;

trait DataProcessor: Send + Sync {
    fn process(&self, input: &str) -> Result<String, String>;
    fn name(&self) -> &str;
}

struct UpperCase;
struct WordCount;

impl DataProcessor for UpperCase {
    fn process(&self, input: &str) -> Result<String, String> {
        if input.is_empty() { return Err("empty".into()); }
        Ok(input.to_uppercase())
    }
    fn name(&self) -> &str { "UpperCase" }
}

impl DataProcessor for WordCount {
    fn process(&self, input: &str) -> Result<String, String> {
        if input.is_empty() { return Err("empty".into()); }
        Ok(format!("{} words", input.split_whitespace().count()))
    }
    fn name(&self) -> &str { "WordCount" }
}

fn run_pipeline(
    processors: Vec<Arc<dyn DataProcessor>>,
    inputs: Vec<String>,
) -> HashMap<String, Vec<String>> {
    let results: Arc<Mutex<HashMap<String, Vec<String>>>> =
        Arc::new(Mutex::new(HashMap::new()));
    let mut handles = vec![];

    for input in inputs {
        let processors = processors.clone();
        let results = Arc::clone(&results);
        handles.push(thread::spawn(move || {
            let outputs: Vec<String> = processors.iter()
                .filter_map(|p| p.process(&input)
                    .map(|r| format!("[{}] {}", p.name(), r)).ok())
                .collect();
            results.lock().unwrap().insert(input, outputs);
        }));
    }

    for h in handles { h.join().unwrap(); }
    Arc::try_unwrap(results).unwrap().into_inner().unwrap()
}

fn main() {
    let processors: Vec<Arc<dyn DataProcessor>> = vec![
        Arc::new(UpperCase), Arc::new(WordCount),
    ];
    let inputs = vec![
        "hello world".into(),
        "rust is fast and safe".into(),
    ];
    for (input, outputs) in run_pipeline(processors, inputs) {
        println!("'{}': {:?}", input, outputs);
    }
}
```

This demonstrates ownership (values moved into threads), borrowing (`&str` in trait methods), traits (dynamic dispatch via `dyn`), generics (`Arc<dyn DataProcessor>`), error handling (`Result` with `filter_map`), smart pointers (`Arc<Mutex<HashMap>>`), closures (`move` closures), and iterators (`.filter_map().collect()` chain).

---

## Study Guide — Rust Language & Ownership

### Key concepts

1. **Ownership.** Each value has one owner. When owner
   goes out of scope, value is dropped.
2. **Borrowing.** `&T` (shared) and `&mut T` (exclusive)
   references.
3. **Lifetimes.** Compiler-tracked reference validity.
4. **Traits.** Interface plus default methods; like
   Haskell type classes.
5. **Enums with data.** Algebraic data types.
6. **`Result<T, E>` and `?`.** Explicit error handling
   without exceptions.

---

## Programming Examples

### Example 1 — Ownership

```rust
fn main() {
    let s1 = String::from("hello");
    let s2 = s1;           // s1 moved
    // println!("{}", s1); // would error: s1 is gone
    println!("{}", s2);
}
```

### Example 2 — Traits

```rust
trait Area {
    fn area(&self) -> f64;
}

struct Circle { r: f64 }
impl Area for Circle {
    fn area(&self) -> f64 { std::f64::consts::PI * self.r * self.r }
}
```

### Example 3 — Result with `?`

```rust
fn read_number(path: &str) -> Result<i32, Box<dyn std::error::Error>> {
    let content = std::fs::read_to_string(path)?;
    Ok(content.trim().parse()?)
}
```

---

## DIY & TRY

### DIY 1 — Fight the borrow checker

Write a program that fails to compile because of
aliasing. Fix it by refactoring, not by adding `clone()`.

### DIY 2 — Implement a linked list

The canonical "Rust is hard" exercise. Read *Learn Rust
With Entirely Too Many Linked Lists* first.

### TRY — Read The Rustonomicon

The dark arts of unsafe Rust. Short. Essential for
anyone writing FFI.

---

## Related College Departments

- [**coding**](../../../.college/departments/coding/DEPARTMENT.md)
- [**mathematics**](../../../.college/departments/mathematics/DEPARTMENT.md)
