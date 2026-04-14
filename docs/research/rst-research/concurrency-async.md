# Rust Concurrency, Async, and Unsafe

## Fearless Concurrency

Rust's most celebrated contribution to systems programming is *fearless concurrency* — the guarantee that data races are caught at compile time, not discovered in production at 3 AM. This is not a runtime check. There is no garbage collector involved. The ownership system, the same mechanism that prevents use-after-free, extends naturally to prevent concurrent mutation without synchronization.

Two marker traits form the foundation:

- **`Send`** — A type is `Send` if it can be safely *moved* to another thread. Most types are `Send`. `Rc<T>` is famously not, because its reference count is not atomic.
- **`Sync`** — A type is `Sync` if it can be safely *shared* (via `&T`) across threads. A type `T` is `Sync` if and only if `&T` is `Send`.

These traits are auto-implemented by the compiler. If every field of your struct is `Send`, your struct is `Send`. You never write `impl Send for MyStruct` unless you are doing something unusual with `unsafe`.

```rust
use std::rc::Rc;
use std::sync::Arc;

// Rc is !Send and !Sync — single-threaded reference counting
let rc = Rc::new(42);
// std::thread::spawn(move || println!("{}", rc)); // COMPILE ERROR

// Arc is Send + Sync — atomic reference counting
let arc = Arc::new(42);
std::thread::spawn(move || println!("{}", arc)); // OK
```

The key insight: data races require three things — shared data, mutation, and no synchronization. Rust's type system makes it impossible to have all three simultaneously. You can share immutable data freely (`&T` where `T: Sync`). You can mutate data exclusively (`&mut T`). But you cannot have `&mut T` while any `&T` exists, and the borrow checker enforces this at compile time. When you need shared mutation, you reach for synchronization primitives (`Mutex`, `RwLock`, atomics) that encode the synchronization into the type system itself.

---

## Threads

Rust's standard library provides OS-level threads through `std::thread`. The API is minimal and safe.

### Basic Thread Spawning

```rust
use std::thread;

fn main() {
    let handle: thread::JoinHandle<i32> = thread::spawn(|| {
        println!("Hello from a spawned thread!");
        42
    });

    // join() blocks until the thread finishes, returns its result
    let result = handle.join().unwrap();
    println!("Thread returned: {}", result);
}
```

### Move Closures

When a thread needs to own data from the parent scope, use `move`:

```rust
use std::thread;

fn main() {
    let name = String::from("Ferris");

    // Without `move`, the closure borrows `name`.
    // But the thread might outlive the current scope — compile error.
    // `move` transfers ownership of `name` into the closure.
    let handle = thread::spawn(move || {
        println!("Hello, {}!", name);
        // `name` is owned by this thread now
    });

    // println!("{}", name); // COMPILE ERROR: name was moved
    handle.join().unwrap();
}
```

### Scoped Threads (Rust 1.63)

Before scoped threads, there was no safe way for a spawned thread to borrow data from the parent stack. `thread::scope` (stabilized in Rust 1.63, September 2022) solves this:

```rust
use std::thread;

fn main() {
    let mut data = vec![1, 2, 3, 4, 5];

    thread::scope(|s| {
        // These threads can borrow `data` because the scope
        // guarantees they all finish before `data` is dropped
        s.spawn(|| {
            println!("Thread 1 sees: {:?}", &data[..3]);
        });
        s.spawn(|| {
            println!("Thread 2 sees: {:?}", &data[3..]);
        });
    });
    // All scoped threads have joined here

    // We can still use `data` after the scope
    data.push(6);
    println!("After threads: {:?}", data);
}
```

Scoped threads eliminated a huge class of `Arc` cloning that was never really about shared ownership — it was about satisfying the `'static` lifetime bound on `thread::spawn`.

### Thread Builder

```rust
use std::thread;

let builder = thread::Builder::new()
    .name("worker-1".into())
    .stack_size(4 * 1024 * 1024); // 4 MB stack

let handle = builder.spawn(|| {
    println!("Thread name: {:?}", thread::current().name());
}).unwrap();

handle.join().unwrap();
```

---

## Shared State Concurrency

### Arc: Atomic Reference Counting

`Arc<T>` (Atomically Reference Counted) provides shared ownership across threads. It is the thread-safe counterpart to `Rc<T>`. Cloning an `Arc` increments an atomic counter; dropping one decrements it. When the count reaches zero, the inner value is dropped.

```rust
use std::sync::Arc;
use std::thread;

fn main() {
    let data = Arc::new(vec![1, 2, 3, 4, 5]);
    let mut handles = vec![];

    for i in 0..3 {
        let data = Arc::clone(&data); // increment ref count
        handles.push(thread::spawn(move || {
            println!("Thread {} sees: {:?}", i, data);
        }));
    }

    for handle in handles {
        handle.join().unwrap();
    }
}
```

`Arc` provides shared *immutable* access. For mutation, wrap the inner data in a `Mutex` or `RwLock`.

### Mutex: Mutual Exclusion

Rust's `Mutex<T>` is fundamentally different from mutexes in C, C++, or Java. **The data is inside the mutex, not beside it.** You cannot access the data without locking the mutex. The lock guard (`MutexGuard`) implements `Deref` and `DerefMut`, providing access to the inner data. When the guard is dropped, the lock is released. There is no separate `lock()` / `unlock()` pair to get wrong.

```rust
use std::sync::{Arc, Mutex};
use std::thread;

fn main() {
    let counter = Arc::new(Mutex::new(0));
    let mut handles = vec![];

    for _ in 0..10 {
        let counter = Arc::clone(&counter);
        handles.push(thread::spawn(move || {
            // lock() returns a MutexGuard — the ONLY way to access the data
            let mut num = counter.lock().unwrap();
            *num += 1;
            // Guard dropped here, lock released
        }));
    }

    for handle in handles {
        handle.join().unwrap();
    }

    println!("Final count: {}", *counter.lock().unwrap());
}
```

Why this design is superior: in C++, you might write `mutex.lock(); data++; mutex.unlock();` and nothing stops you from accessing `data` without holding the lock. In Java, `synchronized` blocks protect code regions, not data. In Rust, the data literally cannot be accessed without the lock. The type system enforces this.

#### Mutex Poisoning

If a thread panics while holding a `MutexGuard`, the mutex becomes *poisoned*. Subsequent calls to `lock()` return `Err(PoisonError)`. The data is still accessible via `into_inner()` on the error — poisoning is a notification mechanism, not data destruction. Many codebases just `.unwrap()` on lock, choosing to propagate the panic.

### RwLock: Read-Write Lock

`RwLock<T>` allows multiple concurrent readers or one exclusive writer:

```rust
use std::sync::{Arc, RwLock};
use std::thread;

fn main() {
    let config = Arc::new(RwLock::new(String::from("initial")));

    let mut handles = vec![];

    // Spawn readers
    for i in 0..5 {
        let config = Arc::clone(&config);
        handles.push(thread::spawn(move || {
            let val = config.read().unwrap();
            println!("Reader {} sees: {}", i, *val);
        }));
    }

    // Spawn writer
    {
        let config = Arc::clone(&config);
        handles.push(thread::spawn(move || {
            let mut val = config.write().unwrap();
            *val = String::from("updated");
            println!("Writer updated config");
        }));
    }

    for handle in handles {
        handle.join().unwrap();
    }
}
```

### Condvar: Condition Variables

`Condvar` allows threads to wait for a condition to become true, used in combination with a `Mutex`:

```rust
use std::sync::{Arc, Mutex, Condvar};
use std::thread;

fn main() {
    let pair = Arc::new((Mutex::new(false), Condvar::new()));
    let pair_clone = Arc::clone(&pair);

    thread::spawn(move || {
        let (lock, cvar) = &*pair_clone;
        let mut ready = lock.lock().unwrap();
        *ready = true;
        cvar.notify_one(); // Wake one waiting thread
    });

    let (lock, cvar) = &*pair;
    let mut ready = lock.lock().unwrap();
    while !*ready {
        ready = cvar.wait(ready).unwrap();
        // wait() releases the lock, sleeps, re-acquires the lock
    }
    println!("Condition met!");
}
```

---

## Message Passing

### Standard Library: mpsc

`std::sync::mpsc` provides multiple-producer, single-consumer channels. Ownership of values is transferred through the channel — once you send a value, you no longer own it.

```rust
use std::sync::mpsc;
use std::thread;

fn main() {
    let (tx, rx) = mpsc::channel();

    // Clone the sender for multiple producers
    let tx2 = tx.clone();

    thread::spawn(move || {
        tx.send("hello from thread 1").unwrap();
    });

    thread::spawn(move || {
        tx2.send("hello from thread 2").unwrap();
    });

    // Receive messages (blocks until a message arrives)
    for msg in rx {
        println!("Received: {}", msg);
    }
    // The iterator ends when all senders are dropped
}
```

There are two channel variants:
- **`channel()`** — unbounded (infinite buffer, sends never block)
- **`sync_channel(n)`** — bounded (buffer of size `n`, sends block when full)

```rust
use std::sync::mpsc;

// Bounded channel with buffer of 2
let (tx, rx) = mpsc::sync_channel(2);
tx.send(1).unwrap(); // does not block
tx.send(2).unwrap(); // does not block
// tx.send(3).unwrap(); // would BLOCK until rx.recv() is called
```

### Crossbeam Channels

The `crossbeam-channel` crate provides multi-producer, multi-consumer (MPMC) channels with a `select!` macro inspired by Go:

```rust
use crossbeam_channel::{bounded, select, unbounded};
use std::thread;
use std::time::Duration;

fn main() {
    let (s1, r1) = bounded(1);
    let (s2, r2) = bounded(1);

    thread::spawn(move || {
        thread::sleep(Duration::from_millis(100));
        s1.send("fast").unwrap();
    });

    thread::spawn(move || {
        thread::sleep(Duration::from_millis(500));
        s2.send("slow").unwrap();
    });

    // select! waits on multiple channels, like Go's select
    select! {
        recv(r1) -> msg => println!("Got: {}", msg.unwrap()),
        recv(r2) -> msg => println!("Got: {}", msg.unwrap()),
    }
}
```

Crossbeam channels are generally faster than `std::sync::mpsc` and support more patterns. They are the community standard for non-async channel usage.

---

## Atomics

The `std::sync::atomic` module provides lock-free atomic types for low-level concurrent programming. Atomic operations are indivisible — no other thread can observe a half-completed atomic operation.

### Atomic Types

- `AtomicBool` — atomic boolean
- `AtomicI8`, `AtomicI16`, `AtomicI32`, `AtomicI64`, `AtomicIsize` — atomic signed integers
- `AtomicU8`, `AtomicU16`, `AtomicU32`, `AtomicU64`, `AtomicUsize` — atomic unsigned integers
- `AtomicPtr<T>` — atomic raw pointer

### Memory Orderings

Every atomic operation takes an `Ordering` parameter that specifies memory synchronization constraints:

- **`Relaxed`** — No synchronization. Only guarantees atomicity. Fastest, but provides no ordering guarantees relative to other operations.
- **`Acquire`** — Used with loads. Guarantees that subsequent reads/writes in this thread happen *after* this load.
- **`Release`** — Used with stores. Guarantees that preceding reads/writes in this thread happen *before* this store.
- **`AcqRel`** — Both Acquire and Release. Used with read-modify-write operations like `compare_exchange`.
- **`SeqCst`** — Sequentially Consistent. Strongest ordering. All threads observe all SeqCst operations in the same order. Simplest to reason about, potentially slowest.

```rust
use std::sync::atomic::{AtomicBool, AtomicUsize, Ordering};
use std::sync::Arc;
use std::thread;

fn main() {
    let flag = Arc::new(AtomicBool::new(false));
    let counter = Arc::new(AtomicUsize::new(0));

    let mut handles = vec![];

    for _ in 0..10 {
        let counter = Arc::clone(&counter);
        handles.push(thread::spawn(move || {
            // fetch_add returns the previous value
            counter.fetch_add(1, Ordering::Relaxed);
        }));
    }

    for handle in handles {
        handle.join().unwrap();
    }

    println!("Counter: {}", counter.load(Ordering::SeqCst));

    // Spin-lock pattern using AtomicBool
    let lock = Arc::new(AtomicBool::new(false));
    let lock_clone = Arc::clone(&lock);

    thread::spawn(move || {
        // Acquire the lock
        while lock_clone
            .compare_exchange(false, true, Ordering::Acquire, Ordering::Relaxed)
            .is_err()
        {
            std::hint::spin_loop(); // CPU hint: we're spinning
        }
        // Critical section
        println!("Holding the lock");
        // Release the lock
        lock_clone.store(false, Ordering::Release);
    });
}
```

### Mara Bos and "Rust Atomics and Locks"

Mara Bos (Rust library team lead) wrote *Rust Atomics and Locks* (O'Reilly, 2023), the definitive guide to low-level concurrency in Rust. The book covers memory ordering, building your own locks, and the hardware details behind atomics. It is freely available on her website. Mara also maintains key parts of `std::sync` and drove the stabilization of many concurrent primitives.

---

## Async/Await

### The Core Model

Rust's async system compiles asynchronous code into state machines at compile time. There is no runtime overhead for async — no hidden allocations, no background threads created automatically, no garbage collector.

```rust
// An async fn returns a Future, but does NOT execute immediately
async fn fetch_data() -> String {
    // .await suspends this function, yielding to the executor
    // until the inner future completes
    let response = make_request().await;
    process(response).await
}
```

Key properties:
- **Lazy futures** — calling an `async fn` does nothing. It returns a `Future` that must be *polled* by an executor.
- **Zero-cost** — the compiler transforms `async fn` into a state machine enum. Each `.await` point is a variant. No heap allocation is required for the state machine itself (unless you `Box::pin` it).
- **Stabilized in Rust 1.39** (November 2019), after years of design work.

### The Future Trait

```rust
pub trait Future {
    type Output;
    fn poll(self: Pin<&mut Self>, cx: &mut Context<'_>) -> Poll<Self::Output>;
}

pub enum Poll<T> {
    Ready(T),
    Pending,
}
```

An executor (like Tokio) calls `poll()` on a future. If the future returns `Pending`, it must arrange to be woken up later via the `Waker` in the `Context`. When the underlying I/O is ready, the `Waker` signals the executor to poll the future again. This is cooperative scheduling — futures must yield at `.await` points.

### Manual Future Implementation

```rust
use std::future::Future;
use std::pin::Pin;
use std::task::{Context, Poll};

struct CountDown {
    remaining: u32,
}

impl Future for CountDown {
    type Output = &'static str;

    fn poll(mut self: Pin<&mut Self>, cx: &mut Context<'_>) -> Poll<Self::Output> {
        if self.remaining == 0 {
            Poll::Ready("liftoff!")
        } else {
            self.remaining -= 1;
            cx.waker().wake_by_ref(); // schedule re-poll immediately
            Poll::Pending
        }
    }
}
```

---

## The Async Runtime Problem

Rust intentionally ships **no built-in async runtime**. The standard library defines the `Future` trait but provides no executor, no reactor, no I/O driver. This is a deliberate design choice: different applications need different runtimes (embedded systems, game engines, web servers).

The consequence: the async ecosystem is split across runtimes.

### Tokio — The Dominant Runtime

Created by Carl Lerche (also the author of `mio`, the low-level I/O event loop). Tokio is the de facto standard for async Rust, used by AWS, Discord, Cloudflare, and most production async Rust.

```rust
#[tokio::main]
async fn main() {
    println!("Starting Tokio runtime");

    let result = tokio::spawn(async {
        // This runs on a worker thread in Tokio's thread pool
        expensive_computation().await
    });

    println!("Result: {:?}", result.await.unwrap());
}
```

`#[tokio::main]` is a macro that creates a multi-threaded runtime. Equivalent to:

```rust
fn main() {
    let rt = tokio::runtime::Runtime::new().unwrap();
    rt.block_on(async {
        // your async code here
    });
}
```

### async-std

A runtime that mirrors the standard library's API. Simpler, smaller community. Good for learning.

```rust
#[async_std::main]
async fn main() {
    let handle = async_std::task::spawn(async {
        42
    });
    println!("{}", handle.await);
}
```

### smol

A minimal runtime by Stjepan Glavina. The entire runtime is ~1,500 lines of code. Good for understanding how runtimes work. Used as a building block by other runtimes.

---

## Tokio In Depth

### Tokio's Module Structure

Tokio provides async equivalents of most standard library I/O:

- **`tokio::net`** — `TcpListener`, `TcpStream`, `UdpSocket`, `UnixStream`
- **`tokio::fs`** — `File`, `read`, `write`, `create_dir_all` (backed by a blocking thread pool)
- **`tokio::io`** — `AsyncRead`, `AsyncWrite`, `AsyncBufRead`, `BufReader`, `BufWriter`
- **`tokio::time`** — `sleep`, `interval`, `timeout`, `Instant`
- **`tokio::sync`** — `Mutex`, `RwLock`, `Semaphore`, `Notify`, `mpsc`, `oneshot`, `broadcast`, `watch`
- **`tokio::process`** — async `Command` for spawning child processes
- **`tokio::signal`** — `ctrl_c()`, Unix signal handling

### Tokio TCP Server Example

```rust
use tokio::net::TcpListener;
use tokio::io::{AsyncReadExt, AsyncWriteExt};

#[tokio::main]
async fn main() -> std::io::Result<()> {
    let listener = TcpListener::bind("127.0.0.1:8080").await?;
    println!("Listening on port 8080");

    loop {
        let (mut socket, addr) = listener.accept().await?;
        println!("Connection from {}", addr);

        // Spawn a new task for each connection
        tokio::spawn(async move {
            let mut buf = [0u8; 1024];
            loop {
                let n = match socket.read(&mut buf).await {
                    Ok(0) => return,  // connection closed
                    Ok(n) => n,
                    Err(_) => return,
                };
                if socket.write_all(&buf[..n]).await.is_err() {
                    return; // write error
                }
            }
        });
    }
}
```

### Tokio Synchronization Primitives

```rust
use tokio::sync::{mpsc, oneshot, broadcast, watch};

#[tokio::main]
async fn main() {
    // mpsc: multi-producer, single-consumer (always bounded in Tokio)
    let (tx, mut rx) = mpsc::channel::<String>(32);
    let tx2 = tx.clone();

    tokio::spawn(async move {
        tx.send("from task 1".into()).await.unwrap();
    });
    tokio::spawn(async move {
        tx2.send("from task 2".into()).await.unwrap();
    });

    while let Some(msg) = rx.recv().await {
        println!("mpsc: {}", msg);
    }

    // oneshot: single value, single use
    let (tx, rx) = oneshot::channel::<u32>();
    tokio::spawn(async move {
        tx.send(42).unwrap();
    });
    println!("oneshot: {}", rx.await.unwrap());

    // broadcast: multi-producer, multi-consumer
    let (tx, _) = broadcast::channel::<String>(16);
    let mut rx1 = tx.subscribe();
    let mut rx2 = tx.subscribe();
    tx.send("hello everyone".into()).unwrap();
    println!("broadcast rx1: {}", rx1.recv().await.unwrap());
    println!("broadcast rx2: {}", rx2.recv().await.unwrap());

    // watch: single-producer, multi-consumer, latest-value only
    let (tx, mut rx) = watch::channel("initial");
    tx.send("updated").unwrap();
    println!("watch: {}", *rx.borrow_and_update());
}
```

### tokio::select!

Wait on multiple async operations simultaneously. The first to complete wins. Like Go's `select` statement:

```rust
use tokio::time::{sleep, Duration};

#[tokio::main]
async fn main() {
    let result = tokio::select! {
        val = async { sleep(Duration::from_secs(1)).await; "slow" } => val,
        val = async { sleep(Duration::from_millis(100)).await; "fast" } => val,
    };
    println!("Winner: {}", result); // "fast"
}
```

### Tower Middleware

Tower is a middleware framework for async services, used by Axum, Tonic (gRPC), Hyper. It defines the `Service` trait:

```rust
pub trait Service<Request> {
    type Response;
    type Error;
    type Future: Future<Output = Result<Self::Response, Self::Error>>;

    fn poll_ready(&mut self, cx: &mut Context<'_>) -> Poll<Result<(), Self::Error>>;
    fn call(&mut self, req: Request) -> Self::Future;
}
```

Tower layers compose: rate limiting, retries, timeouts, load balancing, and more. It is the foundation of production-grade async Rust services.

---

## Pin and Unpin

`Pin` is one of Rust's most notoriously confusing concepts. It exists because of async.

### The Problem: Self-Referential Structs

When the compiler transforms an `async fn` into a state machine, it creates a struct that may hold references to its own fields. Consider:

```rust
async fn example() {
    let data = vec![1, 2, 3];
    let reference = &data;  // reference points to data
    some_async_op().await;  // state machine suspends here
    println!("{:?}", reference); // reference must still be valid after resume
}
```

The generated state machine struct contains both `data` and `reference`, where `reference` is a pointer to `data` within the same struct. If you *move* this struct (e.g., to a different memory location), `reference` becomes a dangling pointer. This is a self-referential struct, and Rust normally forbids them.

### The Solution: Pin

`Pin<P>` wraps a pointer `P` and guarantees that the value it points to **will not be moved** in memory. Once a value is pinned, you cannot get `&mut T` (which would allow `std::mem::swap` to move it).

```rust
use std::pin::Pin;
use std::marker::PhantomPinned;

struct SelfReferential {
    data: String,
    // In real async state machines, the compiler generates these pointers
    ptr: *const String,
    _pin: PhantomPinned, // opts out of Unpin
}

impl SelfReferential {
    fn new(s: &str) -> Pin<Box<Self>> {
        let mut boxed = Box::new(SelfReferential {
            data: String::from(s),
            ptr: std::ptr::null(),
            _pin: PhantomPinned,
        });
        let self_ptr: *const String = &boxed.data;
        // SAFETY: we are initializing the pointer before anyone can observe it
        unsafe {
            let mut_ref = Pin::as_mut(&mut Pin::new_unchecked(&mut *boxed));
            Pin::get_unchecked_mut(mut_ref).ptr = self_ptr;
        }
        unsafe { Pin::new_unchecked(boxed) }
    }
}
```

### Unpin

Most types are `Unpin`, meaning they are safe to move even after being pinned. `Pin<&mut T>` where `T: Unpin` behaves identically to `&mut T`. The `Unpin` marker trait opts a type *into* being movable while pinned.

Types that are NOT `Unpin`:
- Compiler-generated `Future` types (the async state machines)
- Any type containing `PhantomPinned`

In practice, you encounter `Pin` primarily when:
- Implementing `Future` by hand
- Working with `async_trait` (which boxes futures)
- Using `tokio::pin!` or `std::pin::pin!` macros

```rust
use std::pin::pin;

async fn example() {
    let fut = async { 42 };
    let pinned = pin!(fut); // pins `fut` to the stack
    // `pinned` is now `Pin<&mut impl Future<Output = i32>>`
}
```

The `pin!` macro (stabilized in Rust 1.68) eliminates most manual `Pin` handling in application code. Library authors still need to understand `Pin` deeply.

---

## Rayon: Data Parallelism

Rayon, created by Josh Stone and Niko Matsakis (Rust language team), provides effortless data parallelism. Its core insight: replace `.iter()` with `.par_iter()` and Rayon handles the rest using a work-stealing thread pool.

### Basic Usage

```rust
use rayon::prelude::*;

fn main() {
    let numbers: Vec<u64> = (0..1_000_000).collect();

    // Sequential
    let sum_seq: u64 = numbers.iter().sum();

    // Parallel — just change iter() to par_iter()
    let sum_par: u64 = numbers.par_iter().sum();

    assert_eq!(sum_seq, sum_par);

    // Parallel map + filter + collect
    let results: Vec<u64> = numbers
        .par_iter()
        .filter(|&&x| x % 2 == 0)
        .map(|&x| x * x)
        .collect();

    // Parallel sort
    let mut data = vec![5, 3, 1, 4, 2];
    data.par_sort();
    assert_eq!(data, vec![1, 2, 3, 4, 5]);

    // Parallel sort with custom comparator
    let mut words = vec!["banana", "apple", "cherry"];
    words.par_sort_unstable_by(|a, b| a.len().cmp(&b.len()));
}
```

### Work-Stealing Thread Pool

Rayon uses a global thread pool (one thread per CPU core by default). Work is divided recursively using `join()`:

```rust
use rayon;

fn parallel_sum(data: &[i64]) -> i64 {
    if data.len() <= 1024 {
        data.iter().sum()
    } else {
        let mid = data.len() / 2;
        let (left, right) = data.split_at(mid);
        let (sum_left, sum_right) = rayon::join(
            || parallel_sum(left),
            || parallel_sum(right),
        );
        sum_left + sum_right
    }
}
```

### Custom Thread Pool

```rust
use rayon::ThreadPoolBuilder;

fn main() {
    let pool = ThreadPoolBuilder::new()
        .num_threads(4)
        .thread_name(|i| format!("worker-{}", i))
        .build()
        .unwrap();

    pool.install(|| {
        // All rayon operations in this closure use this pool
        let result: Vec<i32> = (0..100)
            .into_par_iter()
            .map(|x| x * 2)
            .collect();
        println!("{:?}", &result[..10]);
    });
}
```

Rayon is ideal for CPU-bound parallelism where you want to use all cores without thinking about thread management. It does not replace async (which is for I/O-bound concurrency).

---

## Lock-Free Programming

### Crossbeam

The `crossbeam` crate (by Aaron Turon, now maintained by the community) provides lock-free concurrent data structures and utilities.

#### Epoch-Based Memory Reclamation

Lock-free data structures need a way to safely free memory when concurrent readers might still reference it. Crossbeam uses epoch-based reclamation — an alternative to garbage collection or hazard pointers:

```rust
use crossbeam_epoch::{self as epoch, Atomic, Owned, Shared};
use std::sync::atomic::Ordering;

fn main() {
    let data: Atomic<String> = Atomic::new(String::from("hello"));

    // Pin the current thread to an epoch
    let guard = epoch::pin();

    // Load the current value (lock-free)
    let current = data.load(Ordering::Acquire, &guard);
    println!("Current: {:?}", unsafe { current.as_ref() });

    // Swap in a new value
    let old = data.swap(
        Owned::new(String::from("world")),
        Ordering::AcqRel,
        &guard,
    );

    // Defer dropping the old value until no threads reference it
    unsafe {
        guard.defer_destroy(old);
    }

    // The old value is freed after all pinned threads advance their epoch
}
```

#### Lock-Free Queues and Deques

```rust
use crossbeam_queue::SegQueue;
use crossbeam_deque::{Injector, Stealer, Worker};
use std::thread;
use std::sync::Arc;

fn main() {
    // SegQueue: unbounded lock-free MPMC queue
    let queue = Arc::new(SegQueue::new());

    let q = Arc::clone(&queue);
    thread::spawn(move || {
        for i in 0..100 {
            q.push(i);
        }
    });

    let q = Arc::clone(&queue);
    thread::spawn(move || {
        while let Some(val) = q.pop() {
            println!("Got: {}", val);
        }
    });

    // Work-stealing deque (used internally by Rayon)
    let worker = Worker::new_fifo();
    let stealer: Stealer<i32> = worker.stealer();

    worker.push(1);
    worker.push(2);

    // Another thread can steal from this worker
    // stealer.steal(); // returns Steal::Success(1), Steal::Empty, or Steal::Retry
}
```

### Flume

`flume` is a fast MPMC channel, aiming to be a drop-in replacement for `std::sync::mpsc` with better performance and MPMC support:

```rust
use flume;

fn main() {
    let (tx, rx) = flume::bounded(10);

    std::thread::spawn(move || {
        tx.send(42).unwrap();
    });

    println!("{}", rx.recv().unwrap());

    // flume also provides async support
    // rx.recv_async().await
}
```

---

## The Borrow Checker and Concurrency

The connection between Rust's borrow checker and its concurrency safety is not coincidental — it is the same mechanism applied to the same problem.

### Why `Rc` is `!Send`

`Rc<T>` uses non-atomic reference counting. If two threads both clone and drop an `Rc` simultaneously, the reference count could be corrupted (lost increment, double decrement). The compiler prevents this:

```rust
use std::rc::Rc;
use std::thread;

fn main() {
    let data = Rc::new(42);
    // thread::spawn(move || {
    //     println!("{}", data);
    // });
    // ERROR: `Rc<i32>` cannot be sent between threads safely
    // the trait `Send` is not implemented for `Rc<i32>`
}
```

### Why `&T` Across Threads Requires `T: Sync`

Sharing a reference `&T` across threads means multiple threads observe the same memory. If `T` has interior mutability without synchronization (like `Cell` or `RefCell`), this creates a data race. Only types that are safe to share via `&T` — those that are `Sync` — can be referenced from multiple threads.

```rust
use std::cell::Cell;
use std::sync::Arc;

// Cell is !Sync, because &Cell<T> allows mutation without locking
let cell = Cell::new(42);
// Can't share &cell across threads — Cell is not Sync

// AtomicI32 IS Sync, because its mutation is atomic
use std::sync::atomic::AtomicI32;
let atom = Arc::new(AtomicI32::new(42));
// Can share &atom across threads — AtomicI32 is Sync
```

### The Complete Picture

| Trait | Meaning | `Rc<T>` | `Arc<T>` | `Cell<T>` | `Mutex<T>` |
|-------|---------|---------|---------|-----------|------------|
| `Send` | Can be moved to another thread | No | Yes (if `T: Send`) | Yes (if `T: Send`) | Yes (if `T: Send`) |
| `Sync` | Can be shared via `&T` across threads | No | Yes (if `T: Send + Sync`) | No | Yes (if `T: Send`) |

The C++ equivalent — `std::shared_ptr` with a raw mutex and a separate data pointer — provides none of these compile-time guarantees. Java's `synchronized` keyword protects code blocks, not data, and nothing prevents you from accessing shared data outside a `synchronized` block. Rust's type system makes it structurally impossible to write a data race in safe code.

---

## Unsafe and FFI

### The `unsafe` Keyword

`unsafe` does not turn off the borrow checker. It unlocks five specific superpowers:

1. Dereference raw pointers (`*const T`, `*mut T`)
2. Call `unsafe` functions (including `extern` FFI functions)
3. Access or modify mutable static variables
4. Implement `unsafe` traits (`Send`, `Sync`)
5. Access fields of `union` types

```rust
fn main() {
    let x = 42;
    let r1 = &x as *const i32; // creating raw pointers is safe
    let r2 = r1;

    unsafe {
        // Dereferencing raw pointers requires unsafe
        println!("r1 = {}", *r1);
        println!("r2 = {}", *r2);
    }

    // Raw pointer arithmetic
    let arr = [10, 20, 30, 40, 50];
    let ptr = arr.as_ptr();
    unsafe {
        for i in 0..5 {
            println!("arr[{}] = {}", i, *ptr.add(i));
        }
    }
}
```

### Calling C from Rust

```rust
// Declare external C functions
extern "C" {
    fn abs(input: i32) -> i32;
    fn strlen(s: *const std::ffi::c_char) -> usize;
    fn printf(format: *const std::ffi::c_char, ...) -> i32;
}

fn main() {
    unsafe {
        println!("abs(-5) = {}", abs(-5));

        let c_string = std::ffi::CString::new("hello").unwrap();
        println!("strlen = {}", strlen(c_string.as_ptr()));
    }
}
```

### Calling Rust from C

Use `#[no_mangle]` and `extern "C"` to expose Rust functions with C-compatible calling conventions:

```rust
#[no_mangle]
pub extern "C" fn rust_add(a: i32, b: i32) -> i32 {
    a + b
}

#[no_mangle]
pub extern "C" fn rust_process_buffer(ptr: *const u8, len: usize) -> i32 {
    if ptr.is_null() {
        return -1;
    }
    let slice = unsafe { std::slice::from_raw_parts(ptr, len) };
    slice.iter().map(|&b| b as i32).sum()
}
```

The corresponding C header (generated by `cbindgen`):

```c
// rust_lib.h
#include <stdint.h>
#include <stddef.h>

int32_t rust_add(int32_t a, int32_t b);
int32_t rust_process_buffer(const uint8_t *ptr, size_t len);
```

### #[repr(C)]

To share structs between Rust and C, you must use `#[repr(C)]` to guarantee C-compatible memory layout:

```rust
#[repr(C)]
pub struct Point {
    pub x: f64,
    pub y: f64,
}

#[no_mangle]
pub extern "C" fn distance(p1: &Point, p2: &Point) -> f64 {
    ((p2.x - p1.x).powi(2) + (p2.y - p1.y).powi(2)).sqrt()
}
```

### bindgen and cbindgen

- **`bindgen`** — reads C/C++ headers and generates Rust `extern` bindings automatically. Essential for wrapping large C libraries.
- **`cbindgen`** — reads Rust source and generates C/C++ headers. Essential for exposing Rust libraries to C.

```toml
# Cargo.toml for a project using bindgen
[build-dependencies]
bindgen = "0.69"
```

```rust
// build.rs
fn main() {
    println!("cargo:rustc-link-lib=z"); // link libz
    let bindings = bindgen::Builder::default()
        .header("wrapper.h")
        .generate()
        .expect("Unable to generate bindings");
    bindings
        .write_to_file(std::path::PathBuf::from(
            std::env::var("OUT_DIR").unwrap()
        ).join("bindings.rs"))
        .expect("Couldn't write bindings!");
}
```

---

## Interior Mutability

Interior mutability allows mutation through shared references (`&T`). This appears to violate Rust's aliasing rules, but each interior mutability type maintains safety through a different mechanism.

### Cell<T>

`Cell<T>` provides interior mutability for `Copy` types. It works by copying values in and out — no references to the inner value are ever given out.

```rust
use std::cell::Cell;

fn main() {
    let x = Cell::new(42);

    // No &mut needed — mutation through &Cell<i32>
    x.set(100);
    println!("{}", x.get()); // 100

    // Useful in structs that need mutation through &self
    struct Counter {
        count: Cell<u32>,
    }

    impl Counter {
        fn increment(&self) {
            self.count.set(self.count.get() + 1);
        }
    }
}
```

`Cell` is `!Sync` — it cannot be shared across threads, because its mutation is not atomic.

### RefCell<T>

`RefCell<T>` provides interior mutability with runtime borrow checking. It hands out `Ref<T>` (shared) and `RefMut<T>` (exclusive) guards, panicking at runtime if borrow rules are violated.

```rust
use std::cell::RefCell;

fn main() {
    let data = RefCell::new(vec![1, 2, 3]);

    // Immutable borrow
    {
        let view = data.borrow();
        println!("{:?}", *view);
    }

    // Mutable borrow
    {
        let mut writer = data.borrow_mut();
        writer.push(4);
    }

    // This would PANIC at runtime:
    // let r = data.borrow();
    // let w = data.borrow_mut(); // panic: already borrowed

    // try_borrow / try_borrow_mut return Result instead of panicking
    match data.try_borrow_mut() {
        Ok(mut w) => w.push(5),
        Err(_) => println!("Already borrowed!"),
    }
}
```

### OnceCell and OnceLock

`OnceCell<T>` (single-threaded) and `OnceLock<T>` (thread-safe) allow a value to be initialized exactly once:

```rust
use std::sync::OnceLock;

// Global configuration initialized once
static CONFIG: OnceLock<String> = OnceLock::new();

fn get_config() -> &'static str {
    CONFIG.get_or_init(|| {
        // Expensive initialization, runs at most once
        String::from("production")
    })
}

fn main() {
    println!("{}", get_config()); // initializes
    println!("{}", get_config()); // returns cached value
}
```

`OnceLock` replaced the `lazy_static!` macro for many use cases when it was stabilized in Rust 1.70.

### UnsafeCell: The Primitive

`UnsafeCell<T>` is the *only* way to get interior mutability in Rust. `Cell`, `RefCell`, `Mutex`, `RwLock`, and all atomic types are built on `UnsafeCell`. It tells the compiler "this value may be mutated through shared references" which disables certain aliasing optimizations.

```rust
use std::cell::UnsafeCell;

// Every interior mutability type is built on this
struct MyCell<T> {
    value: UnsafeCell<T>,
}

impl<T: Copy> MyCell<T> {
    fn new(value: T) -> Self {
        MyCell {
            value: UnsafeCell::new(value),
        }
    }

    fn get(&self) -> T {
        // SAFETY: we only hand out copies, never references
        unsafe { *self.value.get() }
    }

    fn set(&self, value: T) {
        // SAFETY: Cell<T> is !Sync, so no concurrent access
        unsafe { *self.value.get() = value; }
    }
}
```

---

## Memory Layout

### Representation Attributes

Rust makes no guarantees about the default memory layout of structs (`repr(Rust)`). The compiler is free to reorder fields, add padding, or optimize layout. To control layout precisely:

#### #[repr(C)]

C-compatible layout. Fields are laid out in declaration order with platform-specific alignment padding. Required for FFI.

```rust
#[repr(C)]
struct CPoint {
    x: f32,   // offset 0, size 4
    y: f32,   // offset 4, size 4
}             // total size: 8, align: 4

#[repr(C)]
struct Mixed {
    a: u8,    // offset 0, size 1
              // 7 bytes padding
    b: u64,   // offset 8, size 8
    c: u8,    // offset 16, size 1
              // 7 bytes padding
}             // total size: 24, align: 8
```

#### #[repr(transparent)]

Guarantees the struct has the same layout as its single non-zero-sized field. Used for newtype wrappers in FFI:

```rust
#[repr(transparent)]
struct Meters(f64);

// Meters has exactly the same ABI as f64
// Can safely transmute between them
extern "C" fn measure() -> Meters {
    Meters(42.0)
}
```

#### #[repr(packed)] and #[repr(align(N))]

```rust
#[repr(packed)]
struct Packed {
    a: u8,   // offset 0
    b: u32,  // offset 1 (NO padding — may cause unaligned access)
    c: u8,   // offset 5
}            // total size: 6

#[repr(align(64))]
struct CacheAligned {
    data: [u8; 32],
}            // size: 64, aligned to cache line boundary
```

### std::mem Utilities

```rust
use std::mem;

println!("Size of u8: {}", mem::size_of::<u8>());        // 1
println!("Size of u64: {}", mem::size_of::<u64>());       // 8
println!("Size of &str: {}", mem::size_of::<&str>());     // 16 (ptr + len)
println!("Size of String: {}", mem::size_of::<String>()); // 24 (ptr + len + cap)
println!("Size of Option<&u8>: {}", mem::size_of::<Option<&u8>>()); // 8 (niche optimization!)
println!("Size of (): {}", mem::size_of::<()>());         // 0 (ZST)

println!("Align of u32: {}", mem::align_of::<u32>());     // 4
println!("Align of u64: {}", mem::align_of::<u64>());     // 8
```

### Zero-Sized Types (ZSTs)

ZSTs have size 0 and require no storage. They are a key Rust optimization:

```rust
use std::marker::PhantomData;

// () is a ZST — the unit type
let _unit: () = ();

// PhantomData is a ZST — used to express type relationships
// without storing data
struct Owned<T> {
    ptr: *mut u8,
    _marker: PhantomData<T>, // 0 bytes, but tells compiler we "own" a T
}

// Vec<()> stores zero bytes per element — it's just a counter
let v: Vec<()> = vec![(); 1_000_000]; // allocates nothing for elements
println!("Vec<()> len: {}", v.len()); // 1000000

// HashMap<K, ()> is essentially a HashSet (and this is how HashSet is implemented)
use std::collections::HashMap;
let mut set: HashMap<&str, ()> = HashMap::new();
set.insert("key", ());
```

### PhantomData

`PhantomData<T>` is a ZST that tells the compiler your type logically contains or owns a `T`, affecting variance, drop checking, and auto-trait inference:

```rust
use std::marker::PhantomData;

// Without PhantomData, the compiler does not know that
// this type should be treated as if it owns T
struct RawVec<T> {
    ptr: *mut T,
    len: usize,
    cap: usize,
    _marker: PhantomData<T>, // drop checker knows to drop T's
}

// PhantomData affects Send/Sync:
// If T: !Send, then PhantomData<T>: !Send,
// so RawVec<T>: !Send
```

---

## Drop and RAII

### The Drop Trait

`Drop` is Rust's destructor. It runs when a value goes out of scope. This is the mechanism behind RAII (Resource Acquisition Is Initialization).

```rust
struct FileHandle {
    name: String,
    // In real code, this would hold an OS file descriptor
}

impl Drop for FileHandle {
    fn drop(&mut self) {
        println!("Closing file: {}", self.name);
        // Resource cleanup happens here automatically
    }
}

fn main() {
    let f1 = FileHandle { name: "a.txt".into() };
    let f2 = FileHandle { name: "b.txt".into() };

    println!("Files open");
    // Drop order is reverse of declaration:
    // f2 dropped first, then f1
}
// Output:
// Files open
// Closing file: b.txt
// Closing file: a.txt
```

### Drop Order

- Local variables: dropped in reverse declaration order
- Struct fields: dropped in declaration order (not reverse)
- Tuple elements: dropped in declaration order
- Vec elements: dropped from index 0 to len-1

```rust
struct Named(&'static str);

impl Drop for Named {
    fn drop(&mut self) {
        println!("Dropping {}", self.0);
    }
}

fn main() {
    let _a = Named("first");
    let _b = Named("second");
    let _c = Named("third");
}
// Output:
// Dropping third
// Dropping second
// Dropping first
```

### std::mem::drop — Drop Early

`std::mem::drop` is just a function that takes ownership and immediately drops:

```rust
fn drop<T>(_x: T) {} // That's the entire implementation

fn main() {
    let lock_guard = mutex.lock().unwrap();
    // Use the data...
    do_something(&*lock_guard);

    // Release the lock early, before the scope ends
    drop(lock_guard);

    // Now other threads can acquire the lock
    do_something_else();
}
```

### ManuallyDrop

`ManuallyDrop<T>` wraps a value and prevents its destructor from running automatically. You must manually drop it or leak it intentionally:

```rust
use std::mem::ManuallyDrop;

fn main() {
    let mut data = ManuallyDrop::new(String::from("hello"));

    // Use the value normally via Deref/DerefMut
    println!("{}", *data);

    // You must drop it yourself when ready
    unsafe {
        ManuallyDrop::drop(&mut data);
    }

    // If you don't call drop, the String leaks (its memory is never freed)
}
```

`ManuallyDrop` is essential in `unsafe` code where you need precise control over destruction order, particularly in custom allocators and FFI wrappers.

### Drop and Ownership Integration

The interplay between `Drop` and the ownership system is where RAII becomes powerful:

```rust
use std::sync::{Arc, Mutex};

fn example() {
    let db = Arc::new(Mutex::new(Database::connect()));

    // Spawn threads that share the database connection
    for _ in 0..10 {
        let db = Arc::clone(&db);
        std::thread::spawn(move || {
            let conn = db.lock().unwrap();
            conn.query("SELECT 1");
            // MutexGuard dropped here -> lock released
        });
        // Arc clone dropped here -> ref count decremented
    }

    // When the last Arc is dropped, the Mutex is dropped,
    // which drops the Database, which closes the connection.
    // No manual cleanup. No resource leaks. No finally blocks.
}
```

This is the Rust paradigm: encode resource lifetimes in the type system. File handles close themselves. Locks release themselves. Memory frees itself. Network connections disconnect themselves. The compiler verifies it all at compile time, and `Drop` executes it at runtime. There is no `try/finally`, no `defer`, no GC finalizer. The destructor runs deterministically, exactly when the owner goes out of scope.

---

## Concurrency Ecosystem Summary

| Crate | Purpose | Key Types |
|-------|---------|-----------|
| `std::thread` | OS threads | `spawn`, `JoinHandle`, `scope` |
| `std::sync` | Shared state primitives | `Arc`, `Mutex`, `RwLock`, `Condvar`, `Barrier` |
| `std::sync::mpsc` | Standard channels | `channel`, `sync_channel`, `Sender`, `Receiver` |
| `std::sync::atomic` | Lock-free atomics | `AtomicBool`, `AtomicUsize`, `Ordering` |
| `tokio` | Async runtime (dominant) | `spawn`, `select!`, `mpsc`, `oneshot`, `TcpListener` |
| `async-std` | Async runtime (simpler) | mirrors std API |
| `smol` | Async runtime (minimal) | ~1,500 lines |
| `rayon` | Data parallelism | `par_iter`, `par_sort`, `join` |
| `crossbeam` | Lock-free structures | `SegQueue`, `epoch`, `select!`, channels |
| `flume` | Fast MPMC channels | `bounded`, `unbounded` |
| `parking_lot` | Faster `Mutex`/`RwLock` | drop-in replacements for `std::sync` |
| `dashmap` | Concurrent `HashMap` | sharded lock design |

### The Guarantees

What Rust prevents at compile time that other languages allow:

1. **Data races** — two threads accessing the same memory, at least one writing, without synchronization. Impossible in safe Rust.
2. **Use-after-free in concurrent code** — ownership ensures values outlive all references to them, even across threads.
3. **Sending non-thread-safe types to threads** — `Send` and `Sync` bounds are checked at compile time.
4. **Accessing shared data without holding the lock** — `Mutex<T>` makes the data inaccessible without the lock guard.

What Rust does NOT prevent:
- **Deadlocks** — these are logic errors, not memory safety violations
- **Livelocks** — same
- **Starvation** — same
- **Logic bugs in concurrent algorithms** — the compiler verifies memory safety, not algorithmic correctness

The result is a language where you can write concurrent code with the confidence that if it compiles, it will not segfault, corrupt memory, or exhibit undefined behavior from data races. The hard bugs — deadlocks, performance, algorithmic correctness — remain your responsibility, but the catastrophic bugs are eliminated by the type system.

---

## Study Guide — Rust Concurrency & Async

### Key concepts

1. **`Send` and `Sync`** — auto traits that mark types safe
   for thread transfer and shared access.
2. **`Arc<Mutex<T>>`** — the canonical shared-mutable
   pattern.
3. **`tokio` runtime** — the dominant async runtime.
4. **`async`/`await`** — syntax sugar for state machines.
5. **`unsafe`** — opt out of some safety checks; still
   type-safe.

---

## Programming Examples

### Example 1 — Threaded counter

```rust
use std::sync::{Arc, Mutex};
use std::thread;

fn main() {
    let c = Arc::new(Mutex::new(0));
    let mut hs = vec![];
    for _ in 0..10 {
        let c = Arc::clone(&c);
        hs.push(thread::spawn(move || {
            *c.lock().unwrap() += 1;
        }));
    }
    for h in hs { h.join().unwrap(); }
    println!("{}", c.lock().unwrap());
}
```

### Example 2 — Tokio async HTTP fetch

```rust
#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    let body = reqwest::get("https://example.com").await?.text().await?;
    println!("{}", &body[..100]);
    Ok(())
}
```

---

## DIY & TRY

### DIY 1 — Port a Go program

Find any goroutine/channel program. Rewrite in Rust with
`std::thread` and `std::sync::mpsc`.

### DIY 2 — Write an async web scraper

Use `reqwest` + `tokio` to fetch 100 URLs concurrently
with `futures::future::join_all`.

### TRY — Read `tokio`'s source

Pick one module. Read it carefully. Rust async code is
denser than other languages, and reading canonical code
is the best way to learn.

---

## Related College Departments

- [**coding**](../../../.college/departments/coding/DEPARTMENT.md)
- [**engineering**](../../../.college/departments/engineering/DEPARTMENT.md)
