# Go Concurrency: From CSP Theory to Production Systems

> PNW Research Series -- Golang Track
> April 2026

---

## 1. CSP Heritage

### Tony Hoare's Communicating Sequential Processes (1978)

In 1978, C.A.R. Hoare published "Communicating Sequential Processes" in
*Communications of the ACM*. The paper introduced a formal language for
describing patterns of interaction in concurrent systems. The core thesis was
radical for its time: **concurrency should be modeled as independent processes
that communicate through message passing, not through shared memory.**

CSP's primitives:

- **Processes** -- independent sequential computations.
- **Channels** -- typed, synchronous conduits between processes.
- **Events** -- atomic communications (a send is paired with a receive).
- **Composition operators** -- parallel composition (`||`), sequential
  composition (`;`), and choice (`[]`).

The key insight is that synchronization is *implicit* in communication. When
process A sends on a channel and process B receives, they synchronize at that
point. No locks are needed. No mutexes. No condition variables. The channel
**is** the synchronization mechanism.

Hoare's original notation:

```
COPY = *[west?c -> east!c]
```

This says: repeatedly read a character `c` from channel `west`, then write it
to channel `east`. The process blocks on `west?c` until a value is available,
and blocks on `east!c` until the receiver is ready.

### The Bell Labs Lineage

Go did not spring from nothing. Its concurrency model follows a direct
intellectual lineage through Bell Labs:

| Year | Language   | Creator       | System    | Key Contribution                     |
|------|------------|---------------|-----------|--------------------------------------|
| 1978 | CSP        | Hoare         | Theory    | Formal process algebra               |
| 1985 | Occam      | May (Inmos)   | Transputer| Hardware-level CSP                   |
| 1988 | Newsqueak  | Rob Pike      | Plan 9    | Channels as first-class values       |
| 1992 | Alef       | Phil Winterbottom | Plan 9 | Channels + shared memory + threads |
| 1995 | Limbo      | Sean Dorward, Phil Winterbottom, Rob Pike | Inferno | Garbage-collected CSP with `alt` |
| 2009 | Go         | Pike, Thompson, Griesemer | Google | CSP for systems programming at scale |

**Newsqueak** (1988) was Rob Pike's first attempt at a CSP-inspired language.
It introduced channels as first-class values -- you could pass channels over
channels. This became a defining feature of Go.

**Alef** (1992) added concurrency primitives to a C-like language for Plan 9.
It had `proc` (spawn a process), `task` (lightweight coroutine), `chan`
(channel), and `alt` (select among channels). Alef proved the model was
practical for systems programming but lacked garbage collection, making channel
management painful.

**Limbo** (1995) ran on the Inferno operating system (Plan 9's successor). It
added garbage collection, type safety, and a refined `alt` statement. Limbo's
channel semantics are nearly identical to Go's. The `alt` statement became
Go's `select`.

Rob Pike's 2012 talk "Concurrency is not Parallelism" distills the philosophy:
concurrency is about **structure** (composing independently executing
computations), while parallelism is about **execution** (running things at the
same time). Go's concurrency primitives are tools for structuring programs, and
parallelism is a possible (but not required) consequence.

### Go's CSP Distillation

Go takes the CSP lineage and reduces it to three primitives:

1. **`go`** -- launch a goroutine (lightweight process).
2. **`chan`** -- typed channel for communication.
3. **`select`** -- multiplex across multiple channel operations.

Everything else (mutexes, atomics, wait groups) exists in the standard library
as pragmatic additions, but the language itself is CSP at its core.

---

## 2. Goroutines

### The `go` Keyword

A goroutine is launched with the `go` keyword followed by a function call:

```go
func main() {
    go sayHello("world")    // launches a goroutine
    time.Sleep(time.Second) // wait for it (crude; use sync primitives in real code)
}

func sayHello(name string) {
    fmt.Printf("Hello, %s!\n", name)
}
```

Goroutines are **not** OS threads. They are multiplexed onto a small number of
OS threads by the Go runtime's scheduler. A Go program can run millions of
goroutines on a handful of threads.

### Stack Management

Each goroutine starts with a small stack -- approximately **2-8 KB** (the
exact size has varied across Go versions; 1.4+ uses ~2 KB initial, with some
overhead bringing the practical minimum to ~4 KB). The stack is **segmented
and growable**: when a goroutine needs more stack space, the runtime allocates
a new, larger stack (typically 2x), copies the old stack contents, and updates
all pointers. Stacks can also shrink during garbage collection if they are
oversized for their current usage.

This is fundamentally different from OS threads, which typically allocate a
fixed 1-8 MB stack at creation time. The small initial stack is what makes
millions of goroutines feasible.

### Cost Model

| Resource              | Goroutine        | OS Thread (Linux) |
|-----------------------|------------------|-------------------|
| Initial stack         | ~2-4 KB          | 1-8 MB (default)  |
| Creation time         | ~0.3 us          | ~10 us            |
| Context switch        | ~0.2 us          | ~1-5 us           |
| Metadata overhead     | ~300 bytes       | ~8 KB (kernel)    |
| Practical maximum     | Millions         | Thousands         |

### M:N Scheduling

Go uses M:N scheduling: **M** goroutines are multiplexed onto **N** OS
threads. The ratio is dynamic. The runtime manages the mapping automatically.
This gives the programmer the mental model of lightweight concurrency (spawn
as many goroutines as you need) while the runtime maps them efficiently to
available hardware.

### Goroutines vs. Other Runtimes

**Java Virtual Threads (Project Loom, JDK 21+):**
Virtual threads are Java's answer to Go's goroutines. They are also M:N
scheduled, also have small initial stacks (~1 KB), and also aim to make
blocking operations cheap. Key difference: virtual threads unpin from carrier
threads during blocking I/O automatically. Go goroutines do the same via the
runtime's netpoller. Virtual threads integrate with `java.util.concurrent`
seamlessly. The programming model is similar -- both aim for "one thread per
task" simplicity.

**Rust async/await:**
Rust uses stackless coroutines via `async`/`await`. Each `async fn` compiles
to a state machine. There is no runtime in the language itself -- you choose
one (Tokio, async-std, smol). Rust's approach is zero-cost: no heap allocation
for the future itself (it lives on the caller's stack until polled). The
tradeoff is complexity: colored functions (async vs sync), `Pin`, lifetimes in
async contexts, and manual `Send + Sync` bounds. Rust prevents data races at
compile time through ownership; Go detects them at runtime with `-race`.

**Erlang/OTP Processes:**
Erlang processes are the closest analogue to goroutines. They are lightweight
(~300 bytes initial), scheduled by the BEAM VM, and communicate via message
passing. Key differences: Erlang processes are fully isolated (no shared
memory), messages are copied between process heaps, and the runtime provides
preemptive scheduling with reduction counting. Erlang's OTP supervision trees
add fault tolerance that Go doesn't have built in. The tradeoff: Erlang's
process isolation means no zero-copy sharing; Go allows shared memory
(protected by mutexes or channels).

**Node.js Event Loop:**
Node.js uses a single-threaded event loop with asynchronous I/O. It's not
truly concurrent -- only one JavaScript operation runs at a time. CPU-bound
work blocks the loop. Worker threads exist but are heavy and share nothing by
default. The callback/promise/async-await model is fundamentally different
from Go's approach where blocking code is fine because the scheduler handles
it.

---

## 3. The Go Scheduler (GMP Model)

### Architecture

The Go scheduler uses three entities, known as the **GMP model**:

- **G** (Goroutine): The goroutine itself -- its stack, instruction pointer,
  and other state needed for scheduling.
- **M** (Machine): An OS thread. Ms execute Gs. The runtime creates Ms as
  needed (up to `GOMAXPROCS` running simultaneously, though more may exist
  if some are blocked in syscalls).
- **P** (Processor): A logical processor -- a resource required to execute Go
  code. The number of Ps is set by `GOMAXPROCS` (defaults to the number of
  CPU cores). Each P has a local run queue of Gs.

The binding relationship: a G runs on an M, which is attached to a P. A P
holds the local run queue and other per-processor state (mcache, etc.).

```
 +-----------+     +-----------+     +-----------+
 |  P0       |     |  P1       |     |  P2       |
 | [G G G G] |     | [G G G]   |     | [G G]     |
 +-----+-----+     +-----+-----+     +-----+-----+
       |                 |                 |
 +-----+-----+     +-----+-----+     +-----+-----+
 |  M0       |     |  M1       |     |  M2       |
 | (thread)  |     | (thread)  |     | (thread)  |
 +-----------+     +-----------+     +-----------+

              Global Run Queue: [G G G G G]
```

### GOMAXPROCS

`runtime.GOMAXPROCS(n)` sets the number of Ps. Since Go 1.5, the default is
the number of available CPU cores. Setting `GOMAXPROCS=1` forces all
goroutines onto a single thread (useful for debugging race conditions or
reproducing specific interleavings).

### Work Stealing

When a P's local run queue is empty, it attempts to steal work:

1. Check the global run queue (with a lock).
2. Check the network poller for ready goroutines.
3. Steal from another P's local run queue (takes half the victim's queue).

Work stealing ensures load balancing without centralized scheduling. The local
run queues are lock-free (bounded FIFO with atomic operations), while the
global queue uses a mutex.

### Preemption

**Before Go 1.14 (cooperative preemption):**
Goroutines yielded only at function call boundaries. The compiler inserted
preemption checks at function prologues (part of the stack growth check). A
goroutine in a tight loop with no function calls (e.g., `for { i++ }`) could
starve other goroutines indefinitely.

**Go 1.14+ (asynchronous preemption):**
The runtime sends SIGURG signals to preempt goroutines at arbitrary points
(not just function calls). This uses the OS signal mechanism to interrupt
running goroutines, save their register state, and reschedule. Tight
computation loops can no longer starve the scheduler.

### Syscall Handling (Handoff)

When a goroutine makes a blocking syscall (e.g., file I/O, CGo call):

1. The M executing the goroutine enters the syscall and blocks.
2. The P is **detached** from the blocked M and handed off to another M
   (or a new M is created).
3. The P continues running other goroutines on the new M.
4. When the syscall completes, the goroutine is placed back on a run queue
   and the M either picks up a P or goes to sleep.

This handoff mechanism ensures that blocking syscalls don't reduce the
effective parallelism of the program. Network I/O is handled differently --
the runtime's **netpoller** uses epoll/kqueue to multiplex network operations
without blocking an M.

### Scheduler Internals at a Glance

| Component              | Detail                                               |
|------------------------|------------------------------------------------------|
| Local run queue        | Per-P, lock-free, bounded (256 entries)              |
| Global run queue       | Mutex-protected, unbounded                           |
| Netpoller              | epoll (Linux), kqueue (macOS/BSD), IOCP (Windows)    |
| Timer heap             | Per-P (since Go 1.14), reduces contention            |
| Spinning threads       | Up to GOMAXPROCS Ms can spin waiting for work         |
| Thread parking         | Idle Ms sleep on a note (futex on Linux)             |

---

## 4. Channels

### Creation

```go
ch := make(chan int)      // unbuffered channel of int
bch := make(chan string, 10) // buffered channel with capacity 10
```

**Unbuffered channels** synchronize sender and receiver: a send blocks until
a receiver is ready, and a receive blocks until a sender is ready. They
provide a rendezvous point.

**Buffered channels** decouple sender and receiver up to the buffer capacity.
Sends block only when the buffer is full. Receives block only when the buffer
is empty.

### Operations

```go
ch <- 42         // send 42 to channel
value := <-ch    // receive from channel
value, ok := <-ch // receive with closed-channel check (ok == false if closed)
close(ch)        // close the channel
```

### Range Over Channel

```go
for v := range ch {
    fmt.Println(v) // receives until ch is closed
}
```

`range` over a channel receives values until the channel is closed and
drained. This is the idiomatic way to consume all values from a channel.

### Nil Channel Semantics

A nil channel blocks on both send and receive forever. This is useful in
`select` statements to dynamically disable a case:

```go
var ch chan int // nil
// <-ch blocks forever
// ch <- 1 blocks forever
```

### Closed Channel Semantics

```go
close(ch)
v := <-ch  // returns zero value of T immediately (0, "", nil, etc.)
ch <- 1    // PANIC: send on closed channel
close(ch)  // PANIC: close of closed channel
```

Closing a channel is a **broadcast signal**: all blocked receivers unblock
immediately. This makes close ideal for signaling cancellation or completion.

### Channel Directionality

Function signatures can restrict channel direction:

```go
func producer(out chan<- int) { // send-only
    out <- 42
}

func consumer(in <-chan int) { // receive-only
    v := <-in
    fmt.Println(v)
}
```

This is enforced at compile time and documents intent.

### Internal Implementation

Go channels are implemented as a `hchan` struct containing:

- A circular buffer (for buffered channels).
- A lock (mutex protecting the struct).
- Wait queues for blocked senders (`sendq`) and receivers (`recvq`).
- Element size, capacity, and count.

For unbuffered channels, sends and receives do a direct copy between sender
and receiver stacks (using `gopark`/`goready` to sleep and wake goroutines).
For buffered channels, the runtime copies data into/out of the ring buffer.

---

## 5. Select

### Multiplexing Channels

`select` lets a goroutine wait on multiple channel operations simultaneously:

```go
select {
case v := <-ch1:
    fmt.Println("received from ch1:", v)
case ch2 <- 42:
    fmt.Println("sent to ch2")
case v, ok := <-ch3:
    if !ok {
        fmt.Println("ch3 closed")
    }
}
```

If multiple cases are ready, Go selects one **uniformly at random**. This
prevents starvation and is an intentional design decision (unlike C's
`select()` which checks in order).

### Default Case (Non-Blocking)

```go
select {
case v := <-ch:
    process(v)
default:
    // ch has no value ready; do something else
}
```

The `default` case makes the select non-blocking. Without it, `select` blocks
until at least one case is ready.

### Timeout Pattern

```go
select {
case v := <-ch:
    process(v)
case <-time.After(5 * time.Second):
    fmt.Println("timed out after 5 seconds")
}
```

`time.After` returns a channel that receives after the specified duration.
Combined with `select`, this creates a clean timeout pattern.

**Warning:** `time.After` allocates a timer that isn't garbage collected until
it fires. In a loop, use `time.NewTimer` with `Reset`/`Stop` instead:

```go
timer := time.NewTimer(5 * time.Second)
defer timer.Stop()

for {
    timer.Reset(5 * time.Second)
    select {
    case v := <-ch:
        process(v)
    case <-timer.C:
        fmt.Println("timed out")
        return
    }
}
```

### Empty Select (Block Forever)

```go
select {} // blocks the goroutine forever
```

Useful in `main()` when work is done entirely in goroutines.

---

## 6. Concurrency Patterns

### Pipeline

A pipeline is a series of stages connected by channels, where each stage is a
goroutine that receives values from an inbound channel, performs work, and
sends results to an outbound channel.

```go
package main

import "fmt"

// Stage 1: generate integers
func generate(nums ...int) <-chan int {
    out := make(chan int)
    go func() {
        for _, n := range nums {
            out <- n
        }
        close(out)
    }()
    return out
}

// Stage 2: square each integer
func square(in <-chan int) <-chan int {
    out := make(chan int)
    go func() {
        for n := range in {
            out <- n * n
        }
        close(out)
    }()
    return out
}

// Stage 3: add a constant
func addOffset(in <-chan int, offset int) <-chan int {
    out := make(chan int)
    go func() {
        for n := range in {
            out <- n + offset
        }
        close(out)
    }()
    return out
}

func main() {
    // Compose the pipeline: generate -> square -> addOffset
    ch := generate(2, 3, 4, 5)
    ch = square(ch)
    ch = addOffset(ch, 10)

    for v := range ch {
        fmt.Println(v) // 14, 19, 26, 35
    }
}
```

### Fan-Out / Fan-In

**Fan-out:** Multiple goroutines read from the same channel (work distribution).
**Fan-in:** Multiple channels are merged into a single channel.

```go
func fanIn(channels ...<-chan int) <-chan int {
    var wg sync.WaitGroup
    merged := make(chan int)

    output := func(ch <-chan int) {
        defer wg.Done()
        for v := range ch {
            merged <- v
        }
    }

    wg.Add(len(channels))
    for _, ch := range channels {
        go output(ch)
    }

    go func() {
        wg.Wait()
        close(merged)
    }()

    return merged
}
```

### Worker Pool

A fixed number of goroutines processing tasks from a shared channel:

```go
package main

import (
    "fmt"
    "sync"
    "time"
)

type Job struct {
    ID      int
    Payload string
}

type Result struct {
    JobID  int
    Output string
}

func worker(id int, jobs <-chan Job, results chan<- Result, wg *sync.WaitGroup) {
    defer wg.Done()
    for job := range jobs {
        // Simulate work
        time.Sleep(100 * time.Millisecond)
        results <- Result{
            JobID:  job.ID,
            Output: fmt.Sprintf("worker %d processed: %s", id, job.Payload),
        }
    }
}

func main() {
    const numWorkers = 5
    const numJobs = 20

    jobs := make(chan Job, numJobs)
    results := make(chan Result, numJobs)

    // Start workers
    var wg sync.WaitGroup
    for i := 0; i < numWorkers; i++ {
        wg.Add(1)
        go worker(i, jobs, results, &wg)
    }

    // Send jobs
    for i := 0; i < numJobs; i++ {
        jobs <- Job{ID: i, Payload: fmt.Sprintf("task-%d", i)}
    }
    close(jobs)

    // Close results when all workers are done
    go func() {
        wg.Wait()
        close(results)
    }()

    // Collect results
    for r := range results {
        fmt.Printf("Job %d: %s\n", r.JobID, r.Output)
    }
}
```

### Rate Limiting

```go
// Simple rate limiter using time.Tick
limiter := time.Tick(200 * time.Millisecond)

for req := range requests {
    <-limiter // blocks until next tick
    go handle(req)
}

// Bursty rate limiter using buffered channel
burstyLimiter := make(chan time.Time, 3)
// Pre-fill for initial burst
for i := 0; i < 3; i++ {
    burstyLimiter <- time.Now()
}
// Then refill at steady rate
go func() {
    for t := range time.Tick(200 * time.Millisecond) {
        burstyLimiter <- t
    }
}()

for req := range requests {
    <-burstyLimiter
    go handle(req)
}
```

### Done Channel / Cancellation

The done channel pattern predates `context.Context` and is still widely used:

```go
func doWork(done <-chan struct{}, in <-chan int) <-chan int {
    out := make(chan int)
    go func() {
        defer close(out)
        for {
            select {
            case <-done:
                return // cancelled
            case v, ok := <-in:
                if !ok {
                    return
                }
                select {
                case out <- v * 2:
                case <-done:
                    return
                }
            }
        }
    }()
    return out
}

func main() {
    done := make(chan struct{})
    // ... set up pipeline using done ...
    // To cancel everything:
    close(done) // broadcasts to all goroutines
}
```

### Semaphore via Buffered Channel

A buffered channel can act as a counting semaphore:

```go
sem := make(chan struct{}, 10) // max 10 concurrent operations

for _, item := range work {
    sem <- struct{}{} // acquire
    go func(item Work) {
        defer func() { <-sem }() // release
        process(item)
    }(item)
}

// Wait for all to complete
for i := 0; i < cap(sem); i++ {
    sem <- struct{}{}
}
```

### Or-Done Channel

Wraps a channel read to also respect a done signal, avoiding nested selects:

```go
func orDone(done <-chan struct{}, c <-chan int) <-chan int {
    valStream := make(chan int)
    go func() {
        defer close(valStream)
        for {
            select {
            case <-done:
                return
            case v, ok := <-c:
                if !ok {
                    return
                }
                select {
                case valStream <- v:
                case <-done:
                    return
                }
            }
        }
    }()
    return valStream
}
```

### Bridge Channel

Flattens a channel of channels into a single channel:

```go
func bridge(done <-chan struct{}, chanStream <-chan <-chan int) <-chan int {
    valStream := make(chan int)
    go func() {
        defer close(valStream)
        for {
            var stream <-chan int
            select {
            case <-done:
                return
            case maybeStream, ok := <-chanStream:
                if !ok {
                    return
                }
                stream = maybeStream
            }
            for val := range orDone(done, stream) {
                select {
                case valStream <- val:
                case <-done:
                    return
                }
            }
        }
    }()
    return valStream
}
```

---

## 7. The sync Package

### sync.Mutex

```go
type SafeCounter struct {
    mu sync.Mutex
    v  map[string]int
}

func (c *SafeCounter) Inc(key string) {
    c.mu.Lock()
    defer c.mu.Unlock()
    c.v[key]++
}

func (c *SafeCounter) Value(key string) int {
    c.mu.Lock()
    defer c.mu.Unlock()
    return c.v[key]
}
```

**Always use `defer` for Unlock** to ensure the mutex is released even if the
critical section panics.

A `sync.Mutex` is not reentrant. Locking a mutex that is already held by the
same goroutine causes a deadlock. This is by design -- Go considers reentrant
mutexes to be a code smell.

### sync.RWMutex

Allows multiple concurrent readers or one exclusive writer:

```go
type Cache struct {
    mu   sync.RWMutex
    data map[string]string
}

func (c *Cache) Get(key string) (string, bool) {
    c.mu.RLock()
    defer c.mu.RUnlock()
    v, ok := c.data[key]
    return v, ok
}

func (c *Cache) Set(key, value string) {
    c.mu.Lock()
    defer c.mu.Unlock()
    c.data[key] = value
}
```

`RLock()` can be held by any number of goroutines simultaneously. `Lock()`
waits for all readers to release before acquiring exclusive access. Once a
writer is waiting, new readers also block (to prevent writer starvation).

### sync.WaitGroup

Waits for a collection of goroutines to finish:

```go
package main

import (
    "fmt"
    "sync"
)

func main() {
    var wg sync.WaitGroup
    urls := []string{
        "https://example.com",
        "https://example.org",
        "https://example.net",
    }

    for _, url := range urls {
        wg.Add(1)
        go func(u string) {
            defer wg.Done()
            fmt.Printf("Fetching %s\n", u)
            // ... fetch URL ...
        }(url)
    }

    wg.Wait() // blocks until all goroutines call Done()
    fmt.Println("All fetches complete")
}
```

**Critical rule:** Call `wg.Add()` **before** launching the goroutine, not
inside it. Otherwise there is a race between `Add` and `Wait`.

### sync.Once

Ensures a function is executed exactly once, regardless of how many goroutines
call it:

```go
var (
    instance *Database
    once     sync.Once
)

func GetDatabase() *Database {
    once.Do(func() {
        instance = &Database{}
        instance.Connect("postgres://...")
    })
    return instance
}
```

`sync.Once` is safe for concurrent use. If multiple goroutines call `Do`
simultaneously, one executes the function while all others block until it
completes. Subsequent calls return immediately.

### sync.Cond

A condition variable for goroutine coordination:

```go
cond := sync.NewCond(&sync.Mutex{})
queue := make([]int, 0, 10)

// Consumer
go func() {
    cond.L.Lock()
    for len(queue) == 0 {
        cond.Wait() // releases lock, sleeps, re-acquires lock on wake
    }
    item := queue[0]
    queue = queue[1:]
    cond.L.Unlock()
    process(item)
}()

// Producer
cond.L.Lock()
queue = append(queue, 42)
cond.Signal() // wake one waiter (Broadcast() wakes all)
cond.L.Unlock()
```

`sync.Cond` is rarely used in Go because channels handle most coordination
patterns more cleanly. Use it when you need to signal state changes to
multiple waiters without a channel.

### sync.Map

A concurrent map optimized for two patterns: (1) keys are written once and
read many times, and (2) goroutines read/write disjoint sets of keys.

```go
var m sync.Map

m.Store("key", "value")

v, ok := m.Load("key")

m.Range(func(key, value any) bool {
    fmt.Printf("%s: %s\n", key, value)
    return true // continue iteration
})

actual, loaded := m.LoadOrStore("key2", "default")
m.Delete("key")
```

**When to use `sync.Map` vs `map` + `sync.RWMutex`:**
- Use `sync.Map` for stable keys with rare writes and frequent reads.
- Use `map` + `RWMutex` for general-purpose concurrent maps. It has better
  type safety (no `any` casts) and is often faster under mixed workloads.

### sync.Pool

A pool of temporary objects for reuse, reducing GC pressure:

```go
var bufPool = sync.Pool{
    New: func() any {
        return new(bytes.Buffer)
    },
}

func process(data []byte) {
    buf := bufPool.Get().(*bytes.Buffer)
    defer func() {
        buf.Reset()
        bufPool.Put(buf)
    }()

    buf.Write(data)
    // ... use buf ...
}
```

`sync.Pool` objects may be collected by the GC between GC cycles. Never store
state you need to persist. Use it for short-lived allocations that happen
frequently (buffers, temporary structs).

### When to Use Mutexes vs Channels

The Go wiki offers this guidance:

| Use channels when...                        | Use mutexes when...                          |
|---------------------------------------------|----------------------------------------------|
| Passing ownership of data                   | Protecting internal state of a struct        |
| Distributing work across goroutines         | Simple counter increments                    |
| Communicating results between goroutines    | Guarding a cache or map                      |
| Coordinating multiple pieces of logic       | Performance-critical hot paths               |

Rob Pike's proverb: "Don't communicate by sharing memory; share memory by
communicating." But the corollary is pragmatic: sometimes a mutex is simpler,
faster, and more readable than a channel.

---

## 8. sync/atomic

### Atomic Types (Go 1.19+)

Go 1.19 introduced typed atomic wrappers:

```go
var counter atomic.Int64
counter.Add(1)
counter.Add(-1)
v := counter.Load()
counter.Store(100)
swapped := counter.CompareAndSwap(100, 200)

var flag atomic.Bool
flag.Store(true)
if flag.Load() {
    // ...
}

var ptr atomic.Pointer[Config]
cfg := &Config{Workers: 10}
ptr.Store(cfg)
current := ptr.Load()
```

### atomic.Value

For storing arbitrary values atomically (must always store the same concrete
type):

```go
var config atomic.Value

// Writer
config.Store(Config{Workers: 10, Timeout: 30 * time.Second})

// Reader (concurrent, no lock needed)
cfg := config.Load().(Config)
```

### Operations

| Operation         | Description                                  |
|-------------------|----------------------------------------------|
| `Load`            | Atomically read a value                      |
| `Store`           | Atomically write a value                     |
| `Add`             | Atomically add to an integer                 |
| `CompareAndSwap`  | Write only if current value matches expected |
| `Swap`            | Atomically write and return old value        |

### Memory Ordering

Go provides only **sequentially consistent** atomics. There is no
`Relaxed`, `Acquire`, `Release`, or `AcqRel` ordering like C++ or Rust.
Every atomic operation in Go is a full memory fence.

This simplifies reasoning -- you never need to think about memory ordering --
but it means Go atomics may be slightly slower than relaxed atomics in other
languages on weakly-ordered architectures (ARM, RISC-V). On x86, the
difference is negligible because x86 is already strongly ordered.

The Go memory model (revised in Go 1.19) formally specifies happens-before
relationships for atomic operations, channel operations, mutex operations,
and `sync.Once`.

---

## 9. Context

### context.Context

`context.Context` carries deadlines, cancellation signals, and request-scoped
values across API boundaries and goroutines:

```go
type Context interface {
    Deadline() (deadline time.Time, ok bool)
    Done() <-chan struct{}
    Err() error
    Value(key any) any
}
```

### Construction

```go
// Root contexts
ctx := context.Background() // top-level, never cancelled
ctx := context.TODO()       // placeholder when unsure which context to use

// Derived contexts
ctx, cancel := context.WithCancel(parent)
ctx, cancel := context.WithTimeout(parent, 5*time.Second)
ctx, cancel := context.WithDeadline(parent, time.Now().Add(5*time.Second))
ctx := context.WithValue(parent, key, value)

// Go 1.21+: WithoutCancel -- derived context that ignores parent cancellation
ctx := context.WithoutCancel(parent)

// Go 1.21+: AfterFunc -- callback when context is done
stop := context.AfterFunc(ctx, func() {
    cleanup()
})
```

**Always call `cancel()`** when done with a derived context (typically via
`defer cancel()`). Failing to do so leaks resources.

### Context Cancellation Example

```go
package main

import (
    "context"
    "fmt"
    "time"
)

func longRunningOperation(ctx context.Context) error {
    for i := 0; ; i++ {
        select {
        case <-ctx.Done():
            fmt.Printf("Operation cancelled after %d iterations: %v\n", i, ctx.Err())
            return ctx.Err()
        default:
            fmt.Printf("Working... iteration %d\n", i)
            time.Sleep(500 * time.Millisecond)
        }
    }
}

func main() {
    ctx, cancel := context.WithTimeout(context.Background(), 2*time.Second)
    defer cancel()

    if err := longRunningOperation(ctx); err != nil {
        fmt.Println("Operation ended:", err)
    }
}
```

Output:

```
Working... iteration 0
Working... iteration 1
Working... iteration 2
Working... iteration 3
Operation cancelled after 4 iterations: context deadline exceeded
Operation ended: context deadline exceeded
```

### Context in HTTP Handlers

```go
func handler(w http.ResponseWriter, r *http.Request) {
    ctx := r.Context() // carries request lifetime

    result, err := queryDatabase(ctx, "SELECT ...")
    if err != nil {
        if ctx.Err() == context.Canceled {
            // Client disconnected
            return
        }
        http.Error(w, err.Error(), 500)
        return
    }
    json.NewEncoder(w).Encode(result)
}

func queryDatabase(ctx context.Context, query string) (Result, error) {
    rows, err := db.QueryContext(ctx, query) // respects context cancellation
    if err != nil {
        return Result{}, err
    }
    defer rows.Close()
    // ...
}
```

### Context in gRPC

```go
func (s *server) GetUser(ctx context.Context, req *pb.GetUserRequest) (*pb.User, error) {
    // ctx already carries deadline from client
    // Propagate to downstream calls
    user, err := s.userService.FindByID(ctx, req.GetId())
    if err != nil {
        return nil, status.Errorf(codes.Internal, "failed: %v", err)
    }
    return user, nil
}
```

### Context Values: Use Sparingly

```go
type contextKey string

const userIDKey contextKey = "userID"

func WithUserID(ctx context.Context, userID string) context.Context {
    return context.WithValue(ctx, userIDKey, userID)
}

func UserIDFromContext(ctx context.Context) (string, bool) {
    id, ok := ctx.Value(userIDKey).(string)
    return id, ok
}
```

**Best practices:**

- Use unexported key types to prevent collisions.
- Only put request-scoped data in context values (request ID, auth token,
  trace ID).
- Never put optional parameters, loggers, or database connections in context.
- Context values are not type-safe -- prefer explicit function parameters.

---

## 10. errgroup

### golang.org/x/sync/errgroup

`errgroup` combines `sync.WaitGroup` with error handling and context
cancellation:

```go
package main

import (
    "context"
    "fmt"
    "net/http"

    "golang.org/x/sync/errgroup"
)

func main() {
    g, ctx := errgroup.WithContext(context.Background())

    urls := []string{
        "https://example.com",
        "https://example.org",
        "https://example.net",
    }

    results := make([]string, len(urls))

    for i, url := range urls {
        i, url := i, url // capture loop variables (pre-Go 1.22)
        g.Go(func() error {
            req, err := http.NewRequestWithContext(ctx, "GET", url, nil)
            if err != nil {
                return fmt.Errorf("creating request for %s: %w", url, err)
            }

            resp, err := http.DefaultClient.Do(req)
            if err != nil {
                return fmt.Errorf("fetching %s: %w", url, err)
            }
            defer resp.Body.Close()

            results[i] = fmt.Sprintf("%s: %d", url, resp.StatusCode)
            return nil
        })
    }

    if err := g.Wait(); err != nil {
        fmt.Printf("Error: %v\n", err)
        return
    }

    for _, r := range results {
        fmt.Println(r)
    }
}
```

### Key Behavior

- `g.Wait()` returns the **first** non-nil error from any goroutine.
- When created with `errgroup.WithContext`, the derived context is cancelled
  when any goroutine returns an error. Other goroutines should check
  `ctx.Done()` or use context-aware APIs.
- Goroutines continue running after an error (they are not forcibly stopped).
  The context cancellation is the signal to stop.

### SetLimit (Go 1.20+)

```go
g := new(errgroup.Group)
g.SetLimit(10) // max 10 concurrent goroutines

for _, item := range work {
    item := item
    g.Go(func() error {
        return process(item)
    })
}

err := g.Wait()
```

`SetLimit` adds a built-in semaphore. `g.Go` blocks when the limit is reached
until a running goroutine completes. This replaces the manual semaphore
pattern from Section 6.

---

## 11. Race Detector

### Usage

```bash
go test -race ./...     # run tests with race detection
go run -race main.go    # run program with race detection
go build -race -o app   # build binary with race detection
```

### How It Works

The race detector is built on **ThreadSanitizer** (TSan), developed by Google
for C/C++. The Go compiler instruments every memory access (read/write) with
calls that record the access in a shadow memory structure. At runtime, the
detector checks for pairs of accesses to the same memory location where:

1. At least one access is a write.
2. The accesses are from different goroutines.
3. There is no synchronization (happens-before relationship) between them.

### Cost

| Metric       | Overhead with -race |
|--------------|---------------------|
| CPU time     | 2-20x slowdown      |
| Memory       | 5-10x increase      |
| Binary size  | 2-3x larger         |

### Example: Detecting a Race

```go
package main

import (
    "fmt"
    "sync"
)

func main() {
    counter := 0
    var wg sync.WaitGroup

    for i := 0; i < 1000; i++ {
        wg.Add(1)
        go func() {
            defer wg.Done()
            counter++ // DATA RACE: unsynchronized write
        }()
    }

    wg.Wait()
    fmt.Println(counter) // may not be 1000
}
```

Running with `go run -race main.go` produces:

```
==================
WARNING: DATA RACE
Read at 0x00c0000b4010 by goroutine 7:
  main.main.func1()
      /tmp/race.go:14 +0x6e

Previous write at 0x00c0000b4010 by goroutine 6:
  main.main.func1()
      /tmp/race.go:14 +0x84

Goroutine 7 (running) created at:
  main.main()
      /tmp/race.go:12 +0x98

Goroutine 6 (finished) created at:
  main.main()
      /tmp/race.go:12 +0x98
==================
```

### Best Practices

- **Always run `go test -race` in CI.** Data races are undefined behavior in
  Go. The race detector finds them deterministically during execution (not
  statically).
- The race detector finds races that **actually execute**. It cannot find
  races in code paths that are not exercised. Maximize test coverage.
- Race detection is not available on all platforms (not on 32-bit, though this
  matters less now).
- Do not ship binaries built with `-race` to production. The overhead is
  significant.

---

## 12. Common Pitfalls

### Goroutine Leaks

A goroutine leak occurs when a goroutine blocks forever on a channel operation
that will never complete:

```go
func leakyFunction() {
    ch := make(chan int)
    go func() {
        result := expensiveComputation()
        ch <- result // blocks forever if no one reads ch
    }()
    // Forgot to read from ch, or returned early due to timeout
    return
}
```

The goroutine is never garbage collected because it holds a reference to `ch`.
This is a memory leak that grows over time.

**Fix:** Use `context.Context` or a `done` channel to ensure goroutines can
always exit:

```go
func nonLeakyFunction(ctx context.Context) {
    ch := make(chan int, 1) // buffer of 1 so goroutine can exit even if no reader
    go func() {
        result := expensiveComputation()
        select {
        case ch <- result:
        case <-ctx.Done():
        }
    }()
}
```

### Loop Variable Capture (Fixed in Go 1.22)

Before Go 1.22, loop variables were reused across iterations:

```go
// BUG (before Go 1.22): all goroutines see the same (last) value of i
for i := 0; i < 5; i++ {
    go func() {
        fmt.Println(i) // prints 5 five times, not 0-4
    }()
}
```

The fix before Go 1.22 was to capture the variable:

```go
for i := 0; i < 5; i++ {
    i := i // shadow with a new variable
    go func() {
        fmt.Println(i) // correct: prints 0-4
    }()
}
```

**Go 1.22+** changed loop variable semantics: each iteration creates a new
variable. The old bug is gone for `for` loops. This was a backward-incompatible
change gated by the `go` directive in `go.mod`.

### Sending to a Closed Channel

```go
ch := make(chan int)
close(ch)
ch <- 1 // PANIC: send on closed channel
```

**Rule:** Only the sender should close a channel. Never close a channel from
the receiver side. If there are multiple senders, use a `sync.Once` or
coordinate closure through a separate done channel.

### Closing a Channel Twice

```go
ch := make(chan int)
close(ch)
close(ch) // PANIC: close of closed channel
```

### Reading from a Nil Map

This is not concurrency-specific, but it often surfaces in concurrent code
when a map is not initialized:

```go
var m map[string]int
v := m["key"]   // returns zero value (0), no panic
m["key"] = 1    // PANIC: assignment to entry in nil map
```

### Deadlock

The Go runtime detects when all goroutines are blocked and reports a deadlock:

```go
func main() {
    ch := make(chan int)
    ch <- 1 // deadlock: no goroutine to receive
}
```

Output:

```
fatal error: all goroutines are asleep - Loss/deadlock!

goroutine 1 [chan send]:
main.main()
        /tmp/deadlock.go:4 +0x37
```

**Note:** The runtime only detects **global** deadlocks (all goroutines
blocked). Partial deadlocks (a subset of goroutines deadlocked while others
continue) are not detected.

### Misusing WaitGroup

```go
// BUG: Add inside the goroutine -- race with Wait
var wg sync.WaitGroup
for i := 0; i < 10; i++ {
    go func() {
        wg.Add(1)  // TOO LATE: Wait() might have already returned
        defer wg.Done()
        // ...
    }()
}
wg.Wait()
```

Always call `wg.Add(n)` before launching the goroutine.

---

## 13. The GC and Concurrency

### Tri-Color Concurrent Mark-and-Sweep

Go's garbage collector uses a **concurrent, tri-color mark-and-sweep**
algorithm. It runs concurrently with the application (mutator), requiring only
brief stop-the-world (STW) pauses.

The three colors:

- **White:** Not yet examined. At the end of marking, white objects are
  garbage.
- **Gray:** Discovered but not fully scanned. The frontier of the mark phase.
- **Black:** Fully scanned. All references from black objects have been
  followed.

The algorithm:

1. **STW pause #1 (mark setup):** Enable the write barrier. Scan stacks and
   globals to find root pointers. Mark them gray. ~10-30 microseconds.
2. **Concurrent marking:** Mark workers (goroutines) traverse the object graph,
   moving objects from gray to black. The write barrier tracks new pointer
   writes by the mutator during this phase.
3. **STW pause #2 (mark termination):** Finalize marking, disable write
   barrier. ~10-30 microseconds.
4. **Concurrent sweeping:** Free white (unreachable) objects. This runs
   concurrently with the application.

### Sub-Millisecond Pauses

Go's GC targets sub-millisecond STW pauses. Typical pauses are 10-100
microseconds. This is achieved by:

- Doing most work concurrently (marking and sweeping).
- Keeping STW phases minimal (just enabling/disabling write barriers and
  scanning stacks).
- Using per-P mark workers that integrate with the scheduler.

### GOGC

`GOGC` controls the GC's aggressiveness. Default is 100, meaning GC triggers
when heap size has grown by 100% since the last collection.

```bash
GOGC=50  # more aggressive: trigger at 50% growth (less memory, more CPU)
GOGC=200 # less aggressive: trigger at 200% growth (more memory, less CPU)
GOGC=off # disable GC entirely (useful for short-lived programs)
```

Setting `GOGC` is a throughput vs memory tradeoff. Lower values reduce peak
memory but increase GC CPU overhead.

### GOMEMLIMIT (Go 1.19)

`GOMEMLIMIT` sets a soft memory limit for the Go runtime. When the heap
approaches this limit, the GC runs more aggressively regardless of `GOGC`.

```bash
GOMEMLIMIT=1GiB  # soft limit of 1 GiB
```

This is designed for containerized environments where memory limits are hard.
Without `GOMEMLIMIT`, a Go program might be OOM-killed because the GC doesn't
know about the container's memory limit.

The combination of `GOGC=off` + `GOMEMLIMIT=X` is called the **"memory limit
only"** mode: the GC never runs until it needs to, then runs as much as
needed to stay under the limit. This can maximize throughput for batch
workloads.

### Write Barriers

The write barrier is a small piece of code inserted by the compiler at every
pointer write. During the concurrent mark phase, the write barrier ensures the
GC doesn't miss any pointers:

```go
// Conceptually (simplified):
func writeBarrier(slot *unsafe.Pointer, new unsafe.Pointer) {
    shade(new)     // mark the new object gray (Dijkstra barrier)
    shade(*slot)   // mark the old object gray (Yuasa barrier)
    *slot = new    // perform the actual write
}
```

Go uses a **hybrid write barrier** (combining Dijkstra and Yuasa styles)
introduced in Go 1.8. This eliminated the need to re-scan stacks during the
mark termination STW pause, significantly reducing pause times.

### The "No Knobs" Philosophy

The Go team intentionally provides very few GC tuning parameters. As of Go
1.22, there are exactly two: `GOGC` and `GOMEMLIMIT`. Compare this with
Java's HotSpot JVM, which has hundreds of GC-related flags.

The philosophy: the GC should work well by default. If it doesn't, that's a
bug in the GC, not a tuning problem. This reduces operational complexity at
the cost of less control for edge cases.

### Rick Hudson's "Getting to Go" (2018)

Rick Hudson's GopherCon 2018 talk traces the GC's evolution:

- **Go 1.0 (2012):** Stop-the-world mark-and-sweep. Pauses of 10+ ms.
- **Go 1.1:** Parallel mark-and-sweep (still STW). Faster pauses.
- **Go 1.3:** Concurrent sweeping.
- **Go 1.4:** Precise stack scanning (previously conservative).
- **Go 1.5:** Concurrent mark (the big breakthrough). Sub-10ms pauses.
  Write barrier + tri-color. This was the "request-oriented collector"
  design -- optimized for latency-sensitive servers.
- **Go 1.6:** Reduced STW pauses to sub-ms via distributed termination.
- **Go 1.8:** Hybrid write barrier. Eliminated stack re-scanning in STW.
  Sub-100us pauses became typical.
- **Go 1.12:** Scavenger improvements (returning memory to OS).
- **Go 1.14:** Per-P timers, async preemption.
- **Go 1.19:** `GOMEMLIMIT`, soft memory limit.

The GC's design prioritizes **latency** (short pauses) over **throughput**
(total time spent in GC). This aligns with Go's target domain of network
services, where tail latency matters more than raw CPU efficiency.

---

## 14. Comparison: Go vs. Other Concurrency Models

### Go Goroutines vs. Java Virtual Threads (Project Loom)

| Aspect                | Go Goroutines                | Java Virtual Threads              |
|-----------------------|------------------------------|-----------------------------------|
| Introduction          | Go 1.0 (2009)                | JDK 21 (2023, preview in 19)     |
| Creation cost         | ~2-4 KB stack                | ~1 KB stack                       |
| Scheduling            | M:N (GMP model)              | M:N (virtual -> platform thread)  |
| Blocking I/O          | Netpoller (epoll/kqueue)     | Automatic carrier thread release  |
| Preemption            | Async (since 1.14)           | Cooperative (yield at I/O)        |
| Synchronization       | Channels + mutexes           | j.u.c locks + structured concurrency |
| Structured concurrency| No (manual)                  | Yes (JEP 453, preview)           |
| Cancellation          | context.Context              | Thread.interrupt() + structured   |
| Pinning issue         | CGo pins M                   | synchronized blocks pin carrier   |
| Error handling        | errgroup, manual             | StructuredTaskScope               |

Java's virtual threads are philosophically similar to goroutines. The key
difference is that Java has structured concurrency (via `StructuredTaskScope`)
as a first-class concept, while Go relies on manual patterns (errgroup, done
channels, context).

### Go Goroutines vs. Rust async/await

| Aspect                | Go Goroutines                | Rust async/await                  |
|-----------------------|------------------------------|-----------------------------------|
| Model                 | Stackful coroutines          | Stackless coroutines (state machines) |
| Runtime               | Built into language          | Pluggable (Tokio, async-std, smol)|
| Memory per task       | ~2-4 KB stack                | Size of the state machine (varies)|
| Data race prevention  | Runtime detection (-race)    | Compile-time (ownership + Send/Sync) |
| Function coloring     | None (all blocking is transparent) | Yes (async fn vs fn)        |
| Cancellation          | context.Context              | Drop the future                   |
| Pinning               | Not applicable               | Pin<Box<Future>> for self-ref     |
| Complexity            | Low                          | High (lifetimes, Pin, poll)       |
| Zero-cost?            | No (scheduler overhead)      | Yes (no heap alloc for future)    |

Go's advantage is simplicity: goroutines look like regular functions, blocking
is transparent, and there's no function coloring. Rust's advantage is
correctness: data races are impossible at compile time, and the zero-cost
abstraction means no runtime overhead for the concurrency model itself.

The tradeoff is real. Go programs can have data races that are only caught by
the race detector at runtime. Rust programs cannot have data races, period,
but the developer pays for this guarantee in complexity and compile times.

### Go Goroutines vs. Erlang Processes

| Aspect                | Go Goroutines                | Erlang Processes                  |
|-----------------------|------------------------------|-----------------------------------|
| Isolation             | Shared memory                | Fully isolated (separate heaps)   |
| Communication         | Channels (typed, sync/async) | Message passing (async, copied)   |
| Fault tolerance       | Manual (panic/recover)       | Supervision trees (OTP)           |
| GC                    | Per-program (concurrent)     | Per-process (independent)         |
| Hot code swapping     | No                           | Yes                               |
| Pattern matching      | No (type switch)             | Yes (core language feature)       |
| Distribution          | Manual (net/rpc, gRPC)       | Built-in (nodes, distributed)     |
| Preemption            | Async signals                | Reduction counting (every ~4000)  |
| Memory per process    | ~2-4 KB                      | ~300 bytes                        |

Erlang's process isolation model prevents entire classes of bugs (no shared
state = no data races, no dangling pointers across processes). The tradeoff is
performance: copying data between process heaps is expensive for large
messages. Go allows zero-copy sharing through channels (the channel passes a
pointer, not a copy), which is faster but less safe.

Erlang's OTP supervision trees provide fault tolerance that Go has no built-in
equivalent for. In Go, if a goroutine panics and doesn't recover, the entire
program crashes. In Erlang, a crashed process is restarted by its supervisor
while the rest of the system continues running.

### Go Goroutines vs. Node.js Event Loop

| Aspect                | Go Goroutines                | Node.js Event Loop                |
|-----------------------|------------------------------|-----------------------------------|
| Parallelism           | True (multi-core)            | Single-threaded (worker_threads)  |
| CPU-bound work        | Distribute across goroutines | Blocks the loop (use workers)     |
| I/O model             | Blocking (transparent async) | Non-blocking (callbacks/promises) |
| Concurrency model     | CSP (channels)               | Event loop + promises             |
| Shared state          | Mutexes/atomics/channels     | Single-threaded (no races in main)|
| Error handling        | error values, errgroup       | try/catch, Promise.allSettled     |

Node.js achieves concurrency through a single-threaded event loop, which
eliminates data races in the main thread but limits CPU utilization. Go
goroutines provide true parallelism across all CPU cores with the same
ergonomic simplicity.

### Summary: Go's Position

**Go's advantage is simplicity.** The concurrency model is small: `go`,
`chan`, `select`. Blocking code is the default -- the runtime handles the
complexity of async I/O underneath. There is no function coloring, no
`async`/`await`, no `Future<T>`, no callback hell. A goroutine looks like a
regular function call with `go` in front of it.

**Go's disadvantage is safety.** Data races are possible and are only detected
by the race detector at runtime. There is no ownership system, no borrow
checker, no compile-time guarantee of thread safety. A Go program that passes
`go test -race` might still have races in untested code paths.

The Go team's bet is that simplicity leads to fewer bugs overall, even if the
type system doesn't prevent a specific class of bugs. The race detector
catches most races in practice, and the mental model of channels + goroutines
is easier to reason about than async state machines or complex lock
hierarchies.

---

## Appendix: Complete Code Examples

### A. Pipeline with Select and Timeout

```go
package main

import (
    "context"
    "fmt"
    "math/rand"
    "time"
)

func producer(ctx context.Context) <-chan int {
    out := make(chan int)
    go func() {
        defer close(out)
        for i := 0; ; i++ {
            select {
            case <-ctx.Done():
                fmt.Println("producer: context cancelled")
                return
            case out <- i:
                time.Sleep(time.Duration(rand.Intn(300)) * time.Millisecond)
            }
        }
    }()
    return out
}

func transformer(ctx context.Context, in <-chan int) <-chan string {
    out := make(chan string)
    go func() {
        defer close(out)
        for {
            select {
            case <-ctx.Done():
                fmt.Println("transformer: context cancelled")
                return
            case v, ok := <-in:
                if !ok {
                    return
                }
                select {
                case out <- fmt.Sprintf("item-%d (squared=%d)", v, v*v):
                case <-ctx.Done():
                    return
                }
            }
        }
    }()
    return out
}

func main() {
    ctx, cancel := context.WithTimeout(context.Background(), 2*time.Second)
    defer cancel()

    ch := producer(ctx)
    results := transformer(ctx, ch)

    for r := range results {
        fmt.Println(r)
    }
    fmt.Println("main: done")
}
```

### B. Worker Pool with errgroup

```go
package main

import (
    "context"
    "fmt"
    "math/rand"
    "time"

    "golang.org/x/sync/errgroup"
)

type Task struct {
    ID   int
    Data string
}

func processTask(ctx context.Context, task Task) (string, error) {
    // Simulate variable work time
    select {
    case <-time.After(time.Duration(rand.Intn(500)) * time.Millisecond):
        if task.ID == 7 {
            return "", fmt.Errorf("task %d: simulated failure", task.ID)
        }
        return fmt.Sprintf("task %d: processed '%s'", task.ID, task.Data), nil
    case <-ctx.Done():
        return "", ctx.Err()
    }
}

func main() {
    g, ctx := errgroup.WithContext(context.Background())
    g.SetLimit(4) // max 4 concurrent workers

    tasks := make([]Task, 20)
    for i := range tasks {
        tasks[i] = Task{ID: i, Data: fmt.Sprintf("payload-%d", i)}
    }

    results := make([]string, len(tasks))

    for i, task := range tasks {
        i, task := i, task
        g.Go(func() error {
            result, err := processTask(ctx, task)
            if err != nil {
                return err
            }
            results[i] = result
            return nil
        })
    }

    if err := g.Wait(); err != nil {
        fmt.Printf("Pool error: %v\n", err)
        fmt.Println("Partial results:")
    }

    for _, r := range results {
        if r != "" {
            fmt.Println(r)
        }
    }
}
```

### C. Race Condition and Fix

```go
package main

import (
    "fmt"
    "sync"
    "sync/atomic"
)

// BUGGY: data race
func buggyCounter() int {
    counter := 0
    var wg sync.WaitGroup

    for i := 0; i < 1000; i++ {
        wg.Add(1)
        go func() {
            defer wg.Done()
            counter++ // RACE: unsynchronized read-modify-write
        }()
    }

    wg.Wait()
    return counter // will NOT reliably be 1000
}

// FIX 1: mutex
func mutexCounter() int {
    var mu sync.Mutex
    counter := 0
    var wg sync.WaitGroup

    for i := 0; i < 1000; i++ {
        wg.Add(1)
        go func() {
            defer wg.Done()
            mu.Lock()
            counter++
            mu.Unlock()
        }()
    }

    wg.Wait()
    return counter // always 1000
}

// FIX 2: atomic
func atomicCounter() int64 {
    var counter atomic.Int64
    var wg sync.WaitGroup

    for i := 0; i < 1000; i++ {
        wg.Add(1)
        go func() {
            defer wg.Done()
            counter.Add(1)
        }()
    }

    wg.Wait()
    return counter.Load() // always 1000
}

// FIX 3: channel
func channelCounter() int {
    counter := 0
    ch := make(chan int, 1000)
    var wg sync.WaitGroup

    for i := 0; i < 1000; i++ {
        wg.Add(1)
        go func() {
            defer wg.Done()
            ch <- 1
        }()
    }

    go func() {
        wg.Wait()
        close(ch)
    }()

    for v := range ch {
        counter += v
    }
    return counter // always 1000
}

func main() {
    fmt.Println("Buggy counter:", buggyCounter())     // unpredictable
    fmt.Println("Mutex counter:", mutexCounter())      // 1000
    fmt.Println("Atomic counter:", atomicCounter())    // 1000
    fmt.Println("Channel counter:", channelCounter())  // 1000
}
```

### D. Context Cancellation with Cleanup

```go
package main

import (
    "context"
    "fmt"
    "sync"
    "time"
)

type Server struct {
    mu       sync.Mutex
    conns    map[string]bool
    shutdown chan struct{}
}

func NewServer() *Server {
    return &Server{
        conns:    make(map[string]bool),
        shutdown: make(chan struct{}),
    }
}

func (s *Server) HandleConnection(ctx context.Context, id string) {
    s.mu.Lock()
    s.conns[id] = true
    s.mu.Unlock()

    defer func() {
        s.mu.Lock()
        delete(s.conns, id)
        s.mu.Unlock()
        fmt.Printf("[%s] connection cleaned up\n", id)
    }()

    fmt.Printf("[%s] connection started\n", id)

    ticker := time.NewTicker(500 * time.Millisecond)
    defer ticker.Stop()

    for {
        select {
        case <-ctx.Done():
            fmt.Printf("[%s] context cancelled: %v\n", id, ctx.Err())
            return
        case <-s.shutdown:
            fmt.Printf("[%s] server shutting down\n", id)
            return
        case t := <-ticker.C:
            fmt.Printf("[%s] heartbeat at %s\n", id, t.Format("15:04:05.000"))
        }
    }
}

func (s *Server) Shutdown() {
    close(s.shutdown)
}

func (s *Server) ActiveConnections() int {
    s.mu.Lock()
    defer s.mu.Unlock()
    return len(s.conns)
}

func main() {
    server := NewServer()

    ctx, cancel := context.WithTimeout(context.Background(), 2*time.Second)
    defer cancel()

    var wg sync.WaitGroup
    for i := 0; i < 3; i++ {
        wg.Add(1)
        id := fmt.Sprintf("conn-%d", i)
        go func() {
            defer wg.Done()
            server.HandleConnection(ctx, id)
        }()
    }

    time.Sleep(1 * time.Second)
    fmt.Printf("Active connections: %d\n", server.ActiveConnections())

    // Context timeout will cancel all connections at 2 seconds
    wg.Wait()
    fmt.Printf("Final active connections: %d\n", server.ActiveConnections())
}
```

---

## References

1. Hoare, C.A.R. "Communicating Sequential Processes." *Communications of the ACM*, 21(8):666-677, August 1978.
2. Pike, Rob. "Concurrency is not Parallelism." Heroku Waza, January 2012.
3. Pike, Rob. "Go Concurrency Patterns." Google I/O, June 2012.
4. Pike, Rob. "Advanced Go Concurrency Patterns." Google I/O, May 2013.
5. Donovan, Alan A.A. and Kernighan, Brian W. *The Go Programming Language*. Addison-Wesley, 2015. Chapter 8: Goroutines and Channels, Chapter 9: Concurrency with Shared Variables.
6. Hudson, Rick. "Getting to Go: The Journey of Go's Garbage Collector." GopherCon, August 2018.
7. Cox, Russ. "Go Memory Model." https://go.dev/ref/mem, revised June 2022.
8. Go Team. "Share Memory by Communicating." https://go.dev/blog/codelab-share, July 2010.
9. Pike, Rob. "Newsqueak: A Language for Communicating with Mice." Bell Labs, 1994.
10. Winterbottom, Phil. "Alef Language Reference Manual." Plan 9 Programmer's Manual, Volume 2, 1995.
11. Dorward, Sean; Pike, Rob; Ritchie, Dennis M.; Winterbottom, Phil. "The Inferno Operating System." *Bell Labs Technical Journal*, 2(1):5-18, 1997.
12. Go Team. "Proposal: Non-cooperative Goroutine Preemption." https://github.com/golang/go/issues/24543, 2018. Implemented in Go 1.14.
13. Knyszek, Michael. "Soft Memory Limit." https://github.com/golang/go/issues/48409, 2021. Implemented in Go 1.19.
14. Cox, Russ. "Fixing For Loops in Go 1.22." https://go.dev/blog/loopvar-preview, September 2023.

---

## Study Guide — Go Concurrency

### Prerequisites

- Go 1.22+. `go version`.
- Basic Go fluency (funcs, structs, interfaces).

### Key concepts

1. **Goroutines are cheap.** A goroutine starts at ~2 KB of
   stack; the runtime grows it as needed. Spawning 100,000
   goroutines is routine.
2. **Channels are typed pipes.** Send with `ch <- v`, receive
   with `v := <-ch`. Unbuffered channels synchronize both
   sides; buffered channels decouple up to capacity.
3. **`select` multiplexes channel operations.** The classic
   pattern for "wait for any of several things."
4. **`sync.Mutex` is still a mutex.** Use it when channels are
   the wrong tool (shared state with many readers, hot
   counters, cached maps).
5. **Context carries cancellation.** `ctx.Done()` is the
   canonical cancellation signal through a call stack.

---

## Programming Examples

### Example 1 — Worker pool

```go
func worker(id int, jobs <-chan int, results chan<- int) {
    for j := range jobs {
        results <- j * j
    }
}

func main() {
    jobs := make(chan int, 100)
    results := make(chan int, 100)
    for w := 1; w <= 3; w++ {
        go worker(w, jobs, results)
    }
    for j := 1; j <= 10; j++ {
        jobs <- j
    }
    close(jobs)
    for a := 1; a <= 10; a++ {
        <-results
    }
}
```

### Example 2 — Context cancellation

```go
ctx, cancel := context.WithTimeout(context.Background(), 2*time.Second)
defer cancel()
select {
case <-time.After(5 * time.Second):
    fmt.Println("did it")
case <-ctx.Done():
    fmt.Println("cancelled:", ctx.Err())
}
```

---

## DIY & TRY

### DIY 1 — Race detector

Write a program with a deliberate data race on a shared
counter. Run with `go run -race main.go`. The detector
reports the race with the two goroutines involved.

### DIY 2 — Pipeline pattern

Build a three-stage pipeline (generator → squarer → printer)
using channels. Use `close` to propagate EOF.

### DIY 3 — Port something from Python threads

Pick a Python program that uses `threading` or
`concurrent.futures`. Rewrite in Go. Observe the channel
idioms replacing queue.Queue.

### TRY — Build a chat server

Use net.Listen, a goroutine per client, and a hub channel
for broadcast. The "write the IRC server in 200 lines of
Go" exercise is the classic one.

---

## Related College Departments (Go concurrency)

- [**coding**](../../../.college/departments/coding/DEPARTMENT.md)
- [**engineering**](../../../.college/departments/engineering/DEPARTMENT.md)
