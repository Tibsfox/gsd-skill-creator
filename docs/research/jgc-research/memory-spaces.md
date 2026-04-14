# JVM Memory Spaces: Virtual, Physical, Heap, Native

*A field guide to every byte a running Java process touches*

---

## Why this topic needs its own chapter

Ask ten Java engineers "how much memory does your service use?" and you will
get ten different answers — all of them correct, all of them measuring
different things. One person is reading `-Xmx`. Another is looking at `top`.
A third is staring at a Kubernetes `OOMKilled` event and wondering why the
pod died when `jconsole` said the heap was only at 60%.

They are all right. The JVM is one of the most memory-complicated processes
you can run on a Linux box. It reserves address space it never uses, commits
pages it may release, allocates off-heap buffers the heap profiler cannot
see, and memory-maps files into its own address space that show up as "used"
in some tools and "free" in others.

This document walks the whole picture: from the kernel's view of a process,
through the JVM's internal subdivisions, down to the individual object
headers. By the end you should be able to look at any Java process, read any
monitoring tool, and know exactly which number means what.

---

## 1. The operating system view: RSS vs VSZ vs committed vs reserved

Before we talk about the JVM at all, we need to get comfortable with how
Linux accounts for process memory. The JVM sits inside this model; it does
not escape it.

### 1.1 Virtual memory (VSZ / VIRT)

Every process on a 64-bit Linux system has its own **virtual address space**
— a flat 48-bit (or on newer CPUs, 57-bit with five-level page tables)
address range that looks, from the process's point of view, like one giant
contiguous slab of memory. On x86-64 with the traditional 48-bit layout,
that is 256 TB of address space per process.

None of that is physical RAM. It is a bookkeeping construct. The process
asks the kernel for a region of that address space with `mmap()` or `brk()`,
and the kernel records "this process owns addresses `0x7f2b00000000` through
`0x7f2b00100000`" in its VMA (virtual memory area) list. No physical pages
have been touched.

`VSZ` (reported by `ps`) and `VIRT` (reported by `top`) both mean the same
thing: the sum of the sizes of every VMA the process has mapped. For a JVM,
this number is almost always much larger than the actual physical memory in
use — sometimes by an order of magnitude.

```bash
$ ps -o pid,vsz,rss,cmd -p $(pgrep -f MyApp)
  PID    VSZ     RSS CMD
12345 14876520 3421084 java -Xmx4g -jar myapp.jar
```

That process has reserved ~14.2 GB of virtual address space but is only
using ~3.3 GB of physical RAM. This is completely normal.

### 1.2 Resident set size (RSS / RES)

**Resident set size** is the amount of physical RAM that has real,
process-owned pages backing part of the virtual address space at the moment
you look. When the kernel "faults in" a page because the process touched an
address for the first time, it allocates a page frame and maps it to that
virtual address. The page frame is counted in RSS.

RSS is the number you actually care about when you are worried about being
killed by the OOM killer or a cgroup memory limit. It is the physical cost
of the process.

But RSS has a problem: shared pages are double-counted. If two processes
both have `/usr/lib/libc.so.6` mapped, both of them report the full size of
that library in RSS, even though only one copy exists in RAM.

### 1.3 PSS — Proportional Set Size

**Proportional set size** fixes the double-counting. Each shared page is
divided evenly among the processes that map it. If 4 processes all share a
single 4 KB page of libc, each one contributes 1 KB to its PSS.

PSS is only reported by a few tools — the original source is
`/proc/<pid>/smaps`, and the friendliest consumer is `smem`.

```bash
$ smem -P java -k
  PID User     Command                         Swap      USS      PSS      RSS
12345 app      java -Xmx4g -jar myapp.jar         0     3.1G     3.2G     3.3G
```

The three numbers that matter:

- **USS** (Unique Set Size): pages that belong to *only* this process.
  This is what would be freed if the process died.
- **PSS** (Proportional Set Size): USS plus each process's fair share of
  shared pages. The best single number for "how much RAM is this process
  really costing the system?"
- **RSS**: USS plus *all* shared pages, double-counted. Over-estimates.

For a single JVM running on a dedicated VM, USS ≈ PSS ≈ RSS because the JVM
does not share much with anyone. For many JVMs on the same host (less
common in the container era), PSS is the honest number.

### 1.4 Committed memory

**Committed** memory is the set of pages the OS has *promised* to back with
physical RAM (or swap) if the process ever touches them. On Linux this is
often the same as the "reserved via mmap + something that says PROT_READ |
PROT_WRITE" set, depending on how strict `vm.overcommit_memory` is set.

Committed ≠ resident. A page can be committed but not yet faulted in: the
kernel has said "yes you can write here," but no page frame has been
allocated yet. The first write triggers a minor page fault and promotes the
page from committed-but-not-resident to resident.

For the JVM specifically, the heap is usually *committed* up to the
current heap size (`-Xms` at startup, potentially growing up to `-Xmx`).
The JVM calls `mmap()` with `PROT_READ | PROT_WRITE` for the full committed
range, and the OS promises those pages will be available. They become
resident as objects are actually allocated into them.

### 1.5 Reserved memory

**Reserved** is JVM-specific terminology (not a kernel concept). When the
JVM starts with `-Xms1g -Xmx8g`, it *reserves* 8 GB of virtual address
space up front by calling `mmap()` with `PROT_NONE`. No physical RAM is
promised yet — the kernel just records "this chunk of address space
belongs to the JVM." Then the JVM incrementally *commits* pages out of
that reservation as the heap grows.

This is why `VSZ` on a JVM can be huge even when `-Xms` is small: the
`-Xmx` reservation is already in the virtual address space, even though
nothing is backing it.

### 1.6 How the tools report each number

| Tool                   | VSZ | RSS | PSS | USS | Committed | Reserved |
|------------------------|-----|-----|-----|-----|-----------|----------|
| `ps -o vsz,rss`        | ✓   | ✓   |     |     |           |          |
| `top` / `htop`         | ✓   | ✓   |     |     |           |          |
| `smem`                 | ✓   | ✓   | ✓   | ✓   |           |          |
| `pmap -x`              | ✓   | ✓   |     |     |           |          |
| `/proc/<pid>/status`   | ✓   | ✓   |     |     |           |          |
| `/proc/<pid>/smaps`    | ✓   | ✓   | ✓   | ✓   |           |          |
| `jcmd VM.native_memory`|     |     |     |     | ✓         | ✓        |

The last row is the important one: **only the JVM itself knows the
difference between reserved and committed**. The kernel can tell you which
pages are resident; the JVM can tell you which pages it has promised to use
for what.

### 1.7 Why "Java uses 8 GB" is ambiguous

When someone says "my Java process uses 8 GB," they might mean any of:

1. `-Xmx` is set to 8 GB (the *maximum* the heap can grow to).
2. The heap is currently committed at 8 GB (reserved and promised).
3. The heap currently has 8 GB of live objects (from `jstat` or a profiler).
4. VSZ is 8 GB (virtual address space).
5. RSS is 8 GB (physical resident pages).
6. The cgroup memory usage is 8 GB (RSS + page cache + kernel bits).

Each of those numbers lives on a different axis. A responsible answer to
"how much memory" always names which one.

---

## 2. Anatomy of a JVM process in memory

The Java heap is the most *visible* part of a JVM's memory, but it is rarely
the biggest surprise on the invoice. A running JVM looks like this:

```
┌──────────────────────────────────────────────────────────────────┐
│                     JVM Process Address Space                   │
├──────────────────────────────────────────────────────────────────┤
│  Java Heap        (the part -Xmx controls)                       │
│  Metaspace        (class metadata; unlimited unless capped)      │
│  Code Cache       (JIT-compiled native code)                     │
│  Thread stacks    (one per thread; ~1 MB each on 64-bit Linux)   │
│  Direct buffers   (ByteBuffer.allocateDirect, Netty, Lucene...)  │
│  Memory-mapped files   (FileChannel.map(), Kafka, Lucene)        │
│  JVM internals    (GC data, symbol tables, JNI handles, ...)     │
│  Native libraries (libc, libz, libssl, native JNI libs)          │
│  Arena chunks     (malloc arenas, jemalloc, tcmalloc)            │
└──────────────────────────────────────────────────────────────────┘
```

Each of these lives in its own mapped region. You can see them in
`pmap -x <pid>` if you know what you are looking for.

### 2.1 The major regions in detail

**Java heap.** The big allocation managed by the garbage collector.
Controlled by `-Xms` (initial), `-Xmx` (maximum), and GC-specific flags.
Everything allocated with `new` in Java code ends up here. Each object
has a header (8–16 bytes) plus its fields.

**Metaspace.** Stores class metadata — `Klass` structures, method info,
bytecode, constant pools, annotation data. Lives in native memory, *not*
in the Java heap, and is *not* bounded by `-Xmx`. Introduced in Java 8
(JEP 122) to replace PermGen. Default max is unlimited.

**Code cache.** JIT-compiled native code for hot methods. C1 (client) and
C2 (server) compilers store their output here. Default size on HotSpot is
240 MB (segmented into 3 regions in Java 9+). If it fills, the compiler
shuts down and performance drops to interpreter speed.

**Thread stacks.** Each platform thread has a fixed-size native stack.
Default is ~1 MB on 64-bit Linux (`-Xss1m`). 1,000 threads = 1 GB of
virtual stack memory. Resident is usually much less because stacks grow
down and only touched pages are resident.

**Direct byte buffers.** `ByteBuffer.allocateDirect()` allocates native
memory outside the Java heap. The Java heap only holds a tiny
`DirectByteBuffer` proxy object; the actual buffer is `malloc`'d or
`mmap`'d. Controlled by `-XX:MaxDirectMemorySize`.

**Memory-mapped files.** `FileChannel.map()` produces a `MappedByteBuffer`
which calls the underlying `mmap()` system call. The file appears in the
process's address space. Resident pages are backed by the OS page cache.
Kafka and Lucene rely on this heavily.

**JVM internal data.** Symbol tables (interned strings from `Symbol`
objects used by the class loader), GC card tables and remembered sets,
class loader data graphs, JNI global and local handles, compiler scratch
space, sampling and profiling data. All counted in the "Internal" and
"Other" categories in Native Memory Tracking.

**Native libraries.** `libjvm.so` itself, `libc`, `libz`, `libssl`, the
native code of any JNI library you use (JDBC drivers with native bits,
native image processing, native crypto accelerators). These are
`mmap()`'d from files on disk; the code pages are shared across all
processes using the same library.

**Arena chunks.** glibc's `malloc` uses per-thread arenas by default.
Each arena reserves a 64 MB chunk up front. With many threads, this can
add hundreds of megabytes of "phantom" native memory that doesn't appear
in any JVM-level tool.

### 2.2 The stack-of-stacks

Each thread actually has *two* stacks:

- The **native (C) stack** used when the thread is in native code, including
  inside the JVM itself (GC, JIT compilation, JNI calls).
- The **Java stack** used by Java bytecode frames.

On HotSpot these are contiguous — a single mmap'd region holds the native
stack at the high address growing down, and the Java frames live inside the
same allocation. `-Xss` controls the total size of both combined.

This is why a native crash in a JNI library shows a mixed C+Java backtrace in
the `hs_err_pid*.log` file: they share a stack.

---

## 3. The Java heap in detail

The Java heap is where garbage collection lives. It is also the part that
most Java tooling is designed to observe, which is why heap diagnostics are
relatively comfortable compared to native memory diagnostics.

### 3.1 Generational layout

Every mainstream generational collector (Serial, Parallel, CMS, G1) divides
the heap into generations based on the **weak generational hypothesis**:
most objects die young.

```
┌──────────────────────────────────────────────────────────────────┐
│                          Java Heap                               │
├──────────────────────────────┬──────────────────────────────────┤
│       Young Generation        │         Old Generation            │
├──────────┬────────┬───────────┤                                   │
│   Eden   │   S0   │    S1     │           Tenured                 │
└──────────┴────────┴───────────┴──────────────────────────────────┘
```

- **Eden** is where almost all new objects start life. Bump-pointer
  allocation makes this essentially free (just increment a pointer).
- **Survivor 0 and Survivor 1** are two equal-size spaces. Only one is
  in use at a time. A minor GC copies surviving Eden objects into the
  active survivor space.
- **Old Generation (Tenured)** holds objects that have survived enough
  minor GCs to be "promoted."

### 3.2 The life of an object

1. `new Foo()` bumps the Eden allocation pointer. ~5 ns on a hot path.
2. Minor GC happens when Eden fills. Live Eden objects are copied into
   the currently empty survivor space. Dead objects just vanish — the
   collector never walks them.
3. Objects in the existing survivor space are also examined. Those still
   alive get their age counter incremented and are copied to the other
   survivor space. The old survivor space becomes empty.
4. When an object's age counter exceeds `-XX:MaxTenuringThreshold`
   (default 15), it is *promoted* to the old generation.
5. Old generation objects are only touched by major GCs, which are much
   more expensive. The goal of tuning is to promote as few objects as
   possible to old gen.

### 3.3 Heap sizing flags

```bash
# Fixed 4 GB heap. Best for production.
java -Xms4g -Xmx4g MyApp

# Ratio of old gen to young gen. 2 means old = 2 * young.
java -Xms4g -Xmx4g -XX:NewRatio=2 MyApp

# Explicit young gen size.
java -Xms4g -Xmx4g -Xmn1g MyApp

# Eden size relative to each survivor. 8 means Eden = 8 * S0 = 8 * S1.
java -Xms4g -Xmx4g -XX:SurvivorRatio=8 MyApp

# Tenure immediately instead of aging.
java -Xms4g -Xmx4g -XX:MaxTenuringThreshold=1 MyApp
```

The `SurvivorRatio` default of 8 means: young gen is divided into 10
parts; 8 for Eden, 1 for S0, 1 for S1.

### 3.4 Humongous objects (G1 specific)

G1 divides the heap into fixed-size regions (1–32 MB depending on heap
size). Objects larger than half a region are **humongous** and are
allocated directly in old gen, in contiguous regions that are marked as
humongous starts/continuation. Until Java 11, humongous regions were only
freed in a full GC; since then, G1 can reclaim short-lived humongous
objects in young GCs too (JEP 307 and later refinements).

### 3.5 Why `-Xms == -Xmx` in production

Three reasons:

1. **No surprise GC pauses from heap resizing.** Growing the heap requires
   a full GC on some collectors and triggers kernel-level page commits.
2. **Predictable memory budget.** If the container limit is 4 GB and you
   set `-Xms1g -Xmx4g`, you might get OOM-killed because the JVM decided
   to grow the heap at an awkward moment. If you set both to 3 GB, you
   know exactly what the JVM will consume.
3. **The OS will eventually give you the pages anyway.** You are not
   saving anything by starting small; the heap will grow under load, and
   on most systems the pages will become resident when first touched.
   Better to touch them up front and know.

---

## 4. Metaspace

Metaspace replaced PermGen in Java 8 (JEP 122). It holds class metadata:

- **Klass structures** — the HotSpot internal representation of a Java
  class, including pointers to methods, fields, constants, and the
  vtable.
- **Method objects** — bytecode, line number tables, local variable
  tables, exception tables.
- **Constant pools** — interned strings and class references used by
  the class's bytecode.
- **Annotation data** — runtime-visible annotations attached to classes,
  methods, fields.

### 4.1 Why it replaced PermGen

PermGen was part of the heap (or at least, a fixed-size region next to
it), with a hard cap controlled by `-XX:MaxPermSize`. Every time an app
ran, you had to guess how much class metadata it would need. Too low,
you got `OutOfMemoryError: PermGen space`. Too high, you wasted RAM.
Dynamically loaded classes (Groovy, JRuby, JSP hot reload, Tomcat webapp
reloads) made PermGen exhaustion a frequent cause of production pain.

Metaspace lives in native memory instead. It grows as needed, by default
without a hard cap. You still want to set `-XX:MaxMetaspaceSize` in
production so a runaway class loader does not consume all system RAM.

### 4.2 Metaspace sizing

```bash
# Default: unlimited. Set a cap for safety.
java -XX:MaxMetaspaceSize=256m MyApp

# Initial commit size (grows lazily above this).
java -XX:MetaspaceSize=96m -XX:MaxMetaspaceSize=256m MyApp

# How much Metaspace must be used before GC triggers a Metaspace
# class-unloading cycle.
java -XX:MaxMetaspaceFreeRatio=40 -XX:MinMetaspaceFreeRatio=10 MyApp
```

### 4.3 Compressed Class Space

On 64-bit JVMs with compressed oops, the JVM uses 32-bit pointers to
`Klass` structures in addition to 32-bit pointers to objects. Those
compressed class pointers require the `Klass` structures to live in a
dedicated contiguous region: the **Compressed Class Space**. It is a
sub-allocation inside Metaspace.

```bash
java -XX:CompressedClassSpaceSize=1g MyApp
```

Default is 1 GB. You rarely need to change this unless you are running
an application with hundreds of thousands of classes (some code
generation frameworks, dynamic proxies at scale).

### 4.4 Metaspace leaks

The classic Metaspace leak story:

1. A web app is deployed to Tomcat. A new `URLClassLoader` is created.
2. All of the app's classes are loaded into Metaspace under that
   class loader.
3. The app registers a listener with a thread pool, JDBC driver, or
   static cache *outside* its own class loader.
4. The app is undeployed. The `URLClassLoader` is eligible for GC.
5. Except it isn't — the external reference from the thread pool keeps
   it alive.
6. All of the app's `Klass` structures stay pinned in Metaspace.
7. Next deployment loads a fresh copy. Metaspace doubles.
8. After enough reloads, Metaspace exhausts. OOM.

The symptoms are insidious because the heap itself looks fine — the
problem is entirely outside the heap. `jcmd VM.native_memory` will show
"Class" growing steadily. A heap dump followed by MAT's "leaked class
loader" analysis usually points at the rogue reference.

---

## 5. Code cache

The code cache holds JIT-compiled native instructions. Every time HotSpot
decides a method is hot enough to compile, the resulting native code is
written into the code cache. The hot code replaces the interpreter's
bytecode execution for that method.

### 5.1 Segmented code cache (Java 9+)

JEP 197 split the code cache into three segments:

1. **Non-method code heap** — runtime stubs, adapter stubs, compiler
   glue. Never evicted.
2. **Profiled code heap** — C1 (tier 3) compilations with profiling
   instrumentation. Shorter lifetime.
3. **Non-profiled code heap** — C2 (tier 4) fully optimized
   compilations. Longer lifetime.

Segmentation reduces fragmentation and makes eviction decisions smarter.

### 5.2 Sizing

```bash
# Total reserved code cache. Default 240 MB (approx) with tiered.
java -XX:ReservedCodeCacheSize=512m MyApp

# Initial code cache size (grows up to Reserved).
java -XX:InitialCodeCacheSize=64m MyApp

# Per-segment sizes (advanced).
java -XX:NonNMethodCodeHeapSize=5m \
     -XX:ProfiledCodeHeapSize=122m \
     -XX:NonProfiledCodeHeapSize=122m MyApp
```

### 5.3 The warning nobody wants

```
CodeCache: size=245760Kb used=245200Kb max_used=245700Kb free=560Kb
Java HotSpot(TM) 64-Bit Server VM warning: CodeCache is full.
Compiler has been disabled.
```

When you see this, the JIT has given up. New methods will run under the
interpreter, which is 10–100× slower. Your p99 latencies just exploded.

Diagnosis: use `jcmd <pid> Compiler.codecache` to inspect code cache
occupancy, or enable `-XX:+PrintCodeCache` at shutdown to see the
high-water mark. Fix: increase `-XX:ReservedCodeCacheSize`.

### 5.4 Tiered compilation

Tiered compilation (enabled by default) uses C1 for fast initial
compilation and C2 for heavily optimized compilation of hot methods.
Tiered compilation roughly doubles the code cache pressure because a
method may have both a C1 and a C2 version in the cache simultaneously.
That is why the default reserved size went from 48 MB (non-tiered) to
240 MB (tiered) historically.

---

## 6. Thread stacks

Every platform thread has a dedicated stack allocated when the thread
starts and freed when the thread exits.

### 6.1 Default sizes

- 64-bit Linux HotSpot: **1024 KB** (1 MB)
- 64-bit macOS HotSpot: **1024 KB**
- 64-bit Windows HotSpot: **1024 KB**
- 32-bit (legacy): **320 KB**

```bash
# Set platform thread stack to 512 KB.
java -Xss512k MyApp
```

### 6.2 The 1000-thread problem

An application with 1000 platform threads reserves 1 GB of virtual address
space just for stacks. On Linux, the resident (physical) footprint is
much smaller because stacks grow on demand — pages are only faulted in
when the thread actually pushes that deep. For typical application code,
each thread might only use 20–50 KB of stack at any moment.

But the *virtual* reservation is real, and it counts against the
container's virtual limit if one is set. More importantly, each thread
also has kernel overhead: task_struct, kernel stack (8–16 KB on Linux),
scheduler bookkeeping. A runaway thread pool can OOM a container through
native memory even when the heap looks fine.

### 6.3 StackOverflowError

If a thread pushes more frames than its stack can hold, it hits the
guard page at the bottom of the stack region, and the JVM converts that
into a `StackOverflowError`. Typical causes: unbounded recursion, deeply
nested expression trees, pathological parser combinators, or native JNI
calls that deepen the stack unexpectedly.

Increasing `-Xss` fixes immediate symptoms but does not fix the
underlying bug.

### 6.4 Virtual threads (Project Loom)

Virtual threads, finalized in Java 21 (JEP 444), change the math
completely. A virtual thread is a lightweight continuation scheduled
onto a small pool of platform threads. Its stack lives on the Java heap
(as a `StackChunk` object), growing and shrinking on demand. Initial
footprint is **about 1 KB**. An app can have *millions* of virtual
threads without running out of memory.

The "thread per request" model — one logical thread per incoming HTTP
request — was impractical with platform threads beyond a few thousand
concurrent connections. With virtual threads, it is suddenly viable at
scale, and the reactive/non-blocking programming model starts to look
less necessary.

Virtual threads do not use `-Xss`. They use heap. If you need a million
virtual threads you need heap headroom for their stack chunks, not
native memory for stack regions.

---

## 7. Direct memory (off-heap)

The Java heap is managed by the garbage collector, which is great for
small objects and poor for large ones. For I/O buffers in particular,
you want memory that:

- Does not move (so you can pass it to `read()` and `write()` without
  GC shuffling it around).
- Is outside the Java heap (so very large buffers do not inflate GC
  working set).

`ByteBuffer.allocateDirect()` gives you exactly that.

### 7.1 How it works

```java
ByteBuffer buf = ByteBuffer.allocateDirect(64 * 1024 * 1024); // 64 MB
```

Under the hood this calls native `malloc()` (or `posix_memalign`) to
allocate 64 MB of native memory. The Java heap contains a small
`DirectByteBuffer` object that holds the native address. The native
memory is not counted against `-Xmx`.

The buffer is freed when the `DirectByteBuffer` object becomes
unreachable and its `Cleaner` runs. But — and this is critical —
the `Cleaner` runs whenever the GC decides to process it, which might
be much later than you expect, especially under low heap pressure.

### 7.2 `MaxDirectMemorySize`

```bash
# Cap direct buffer pool at 512 MB.
java -XX:MaxDirectMemorySize=512m MyApp
```

Historically this defaulted to approximately `-Xmx`, meaning a 4 GB heap
could quietly allocate another 4 GB of direct buffers. In modern JDKs
the default is `Long.MAX_VALUE / 2` unless overridden — effectively
unlimited. Always set this explicitly in production.

When you exceed `MaxDirectMemorySize`, you get:

```
java.lang.OutOfMemoryError: Cannot reserve 67108864 bytes of
direct buffer memory (allocated: 536870912, limit: 536870912)
```

### 7.3 Who uses direct memory

- **Netty** — the entire point of Netty is off-heap buffers managed by
  a reference-counted pool. A typical Netty server has much more direct
  memory than heap.
- **Lucene / Elasticsearch** — memory-mapped files for search indexes.
- **Kafka clients and brokers** — direct buffers for record batches.
- **Aeron** — off-heap ring buffers for low-latency messaging.
- **Chronicle Queue / Chronicle Map** — persisted off-heap data
  structures using mmap.

### 7.4 Why Netty added reference counting

`Cleaner`-based freeing is non-deterministic. Netty serves requests at
rates where a missed `Cleaner` cycle could exhaust direct memory in
milliseconds. Netty's `ByteBuf` has explicit `retain()` / `release()`
methods with reference counting, and a pooled allocator that reuses
buffers instead of freeing them. Memory leaks become possible — forget
a `release()` and the buffer leaks forever — so Netty has a
leak-detection mode that samples allocations and checks for
unreleased buffers at GC time.

### 7.5 Unsafe and the successor APIs

`sun.misc.Unsafe.allocateMemory()` is the old, unsupported way to
allocate raw native memory from Java code. `jdk.internal.misc.Unsafe`
is its modern equivalent, still not part of the public API. The
officially supported replacement is the **Foreign Function & Memory
API** (JEP 454, finalized in Java 22):

```java
try (Arena arena = Arena.ofConfined()) {
    MemorySegment segment = arena.allocate(64 * 1024 * 1024);
    // Use segment...
} // Memory freed deterministically when the arena closes.
```

This gives you deterministic cleanup with a try-with-resources block,
which is a huge improvement over `Cleaner`-based finalization.

---

## 8. Native Memory Tracking (NMT)

When RSS is much bigger than `-Xmx + -XX:MaxMetaspaceSize + code cache
+ thread stacks`, where did the rest go? NMT is the tool for that
question.

### 8.1 Enabling NMT

NMT must be enabled at JVM startup:

```bash
# Summary mode: per-category totals.
java -XX:NativeMemoryTracking=summary MyApp

# Detail mode: individual call sites. ~10% overhead.
java -XX:NativeMemoryTracking=detail MyApp

# Off. Default.
java -XX:NativeMemoryTracking=off MyApp
```

### 8.2 Querying NMT

```bash
$ jcmd 12345 VM.native_memory summary

12345:

Native Memory Tracking:

Total: reserved=5921543KB, committed=4458571KB
-                 Java Heap (reserved=4194304KB, committed=4194304KB)
                            (mmap: reserved=4194304KB, committed=4194304KB)

-                     Class (reserved=1095168KB, committed=55296KB)
                            (classes #8521)
                            (  instance classes #7921, array classes #600)
                            (malloc=1280KB #22107)
                            (mmap: reserved=1093888KB, committed=54016KB)

-                    Thread (reserved=168448KB, committed=168448KB)
                            (thread #164)
                            (stack: reserved=167936KB, committed=167936KB)
                            (malloc=596KB #984)

-                      Code (reserved=251060KB, committed=45072KB)
                            (malloc=3572KB #15200)
                            (mmap: reserved=247488KB, committed=41500KB)

-                        GC (reserved=170024KB, committed=170024KB)
                            (malloc=4692KB #6123)
                            (mmap: reserved=165332KB, committed=165332KB)

-                  Compiler (reserved=1820KB, committed=1820KB)
                            (malloc=1691KB #1702)
                            (arena=129KB #7)

-                  Internal (reserved=520KB, committed=520KB)
                            (malloc=488KB #1934)

-                     Other (reserved=124KB, committed=124KB)
                            (malloc=124KB #8)

-                    Symbol (reserved=14208KB, committed=14208KB)
                            (malloc=12036KB #182190)
                            (arena=2172KB #1)

-    Native Memory Tracking (reserved=4688KB, committed=4688KB)
                            (malloc=368KB #4875)
                            (tracking overhead=4320KB)

-               Arena Chunk (reserved=214KB, committed=214KB)
                            (malloc=214KB)
```

### 8.3 Reading the output

- **Java Heap** — the `-Xmx` reservation. Here, 4 GB reserved and
  committed because `-Xms4g -Xmx4g`.
- **Class** — Metaspace. ~1 GB reserved (the Compressed Class Space
  default), but only 54 MB committed because this app has 8521 classes.
- **Thread** — stacks. 164 threads × 1 MB ≈ 168 MB.
- **Code** — code cache. 240 MB reserved, 45 MB committed.
- **GC** — garbage collector metadata. Card tables, remembered sets,
  etc. ~170 MB here.
- **Compiler** — C1/C2 scratch space.
- **Symbol** — interned strings from the symbol table (these are
  different from Java `String.intern()` strings, which live in heap).
- **Internal** / **Other** — JVM bits that do not fit the other
  categories.

Add it all up: committed ≈ 4.46 GB. That is what should appear as
committed-to-JVM memory. RSS may be higher (because of loaded
libraries, page cache for mmap'd files, etc.).

### 8.4 Finding the RSS gap

```bash
# Save a baseline.
$ jcmd 12345 VM.native_memory baseline
Baseline succeeded

# ... run for a while ...

$ jcmd 12345 VM.native_memory summary.diff

Total: reserved=5921543KB +104KB, committed=4458571KB +89KB
-                     Class (reserved=1095168KB, committed=55296KB +32KB)
                            (classes #8521 +14)
...
```

The `diff` form shows what has changed since the baseline — extremely
useful for hunting down a slow leak.

### 8.5 What NMT does not cover

- **glibc arenas.** Native allocations made by JNI libraries that call
  `malloc()` directly are not attributed to any JVM category. They
  contribute to RSS but not to NMT totals.
- **Memory-mapped files.** `MappedByteBuffer` regions contribute to
  RSS via page cache, but NMT only accounts for the Java-side bookkeeping.
- **Direct ByteBuffer content.** NMT's "Other" category tracks the
  reservation for direct buffers, but the buffer *contents* live in
  native memory that NMT does not itemize.

For the full picture you need NMT + `pmap -x` + possibly `jemalloc`
profiling.

---

## 9. Memory-mapped files

`mmap()` maps a region of a file into the process's virtual address
space. Reading and writing the file becomes equivalent to reading and
writing memory.

### 9.1 The Java API

```java
try (RandomAccessFile raf = new RandomAccessFile("big.bin", "r");
     FileChannel ch = raf.getChannel()) {
    MappedByteBuffer buf = ch.map(
        FileChannel.MapMode.READ_ONLY, 0, ch.size());
    // Read from buf like any other ByteBuffer.
    // Bytes are loaded from disk on demand by the OS.
}
```

### 9.2 How it interacts with RSS

- The initial `mmap()` call adds the file's size to VSZ. No physical
  RAM is used yet.
- The first read of each 4 KB (or 2 MB with huge pages) triggers a
  page fault. The OS reads the page from disk and maps it in.
- Once mapped, the page is counted in the **page cache** — not
  process-exclusive memory. Under memory pressure, the kernel can
  evict these pages without asking the process.
- RSS depends on whether your tool counts page-cache-backed pages as
  resident. `top`'s RSS does. Some cgroup accounting tools do not.

### 9.3 Why Kafka loves mmap

Kafka's log segments are appended to flat files and read with
`FileChannel.transferTo()` (which the kernel implements as a
zero-copy `sendfile()`). The active segment is often read from the
page cache without any JVM-side work. Kafka's brokers typically have
small heaps (6–8 GB) and rely on the OS page cache for the actual
throughput. `free -m` will show nearly all memory as "buff/cache"
on a healthy Kafka box — that is the desired state.

Lucene (and therefore Elasticsearch and Solr) does the same: index
files are mmap'd, and query performance is driven by how much of the
index fits in the page cache.

### 9.4 Transparent huge pages

With transparent huge pages (THP) enabled in "always" mode, the kernel
opportunistically promotes 4 KB pages to 2 MB huge pages. For mmap'd
files this often backfires:

- File-backed pages cannot be 2 MB unless the file is aligned and
  contiguous on disk.
- THP in "always" mode triggers compaction to find contiguous 2 MB
  regions, which causes stalls during allocation.

Kafka, Cassandra, MongoDB, and Elasticsearch all recommend setting THP
to `madvise` or `never` for this reason:

```bash
$ echo madvise | sudo tee /sys/kernel/mm/transparent_hugepage/enabled
$ echo madvise | sudo tee /sys/kernel/mm/transparent_hugepage/defrag
```

---

## 10. Container-aware memory reporting

Before Java 10, a JVM in a Docker container would read `/proc/meminfo`
and see the *host's* total memory — typically 64, 128, or 256 GB —
regardless of the container's cgroup limit. If the container had a
2 GB limit and the JVM sized its heap based on "25% of host memory,"
it would cheerfully pick 16 GB and get OOM-killed at the first garbage
collection.

### 10.1 `UseContainerSupport`

```bash
# Default in Java 10+. Reads cgroup limits correctly.
java -XX:+UseContainerSupport MyApp

# Disable (rarely needed).
java -XX:-UseContainerSupport MyApp
```

With `UseContainerSupport` enabled, the JVM reads the cgroup's
`memory.limit_in_bytes` (v1) or `memory.max` (v2) and uses it as the
effective memory limit.

### 10.2 Percentage-based sizing

```bash
# Heap = 75% of cgroup memory limit.
java -XX:MaxRAMPercentage=75.0 MyApp

# Initial heap = 50% of cgroup memory limit.
java -XX:InitialRAMPercentage=50.0 \
     -XX:MaxRAMPercentage=75.0 MyApp

# For very small containers (under 250 MB).
java -XX:MinRAMPercentage=50.0 MyApp
```

The percentage flags are relative to the **cgroup** limit, not the
host. A 2 GB container with `-XX:MaxRAMPercentage=75.0` gets a 1.5 GB
max heap.

### 10.3 Why not just use `-Xmx2g`?

Because then the image is pinned to one container size. Percentages
let the same image run unmodified in a 2 GB pod and a 32 GB pod with
the heap scaling appropriately. This matters in Kubernetes where the
same Deployment spec gets tuned across environments.

### 10.4 cgroup v2 differences

cgroup v2 uses `memory.max` instead of `memory.limit_in_bytes`, has
unified hierarchy, and handles swap differently. Java 15+ has proper
cgroup v2 support. Earlier versions (11, 14) have partial support and
may incorrectly detect limits on v2 systems — upgrade if you are
stuck there.

### 10.5 The 75% rule of thumb

Why 75% and not 90%? Because all the **non-heap** memory consumers
(Metaspace, code cache, thread stacks, direct buffers, native
libraries, glibc arenas) also need to fit in the container limit.
A common starting point:

- Heap: 75%
- Metaspace cap: 10%
- Code cache + thread stacks + direct: 10%
- Headroom: 5%

Adjust based on NMT observations.

---

## 11. Hugepages and transparent huge pages

### 11.1 The TLB problem

Every memory access on x86-64 requires translating a virtual address
to a physical address. The CPU caches recent translations in the
**TLB** (Translation Lookaside Buffer). A TLB miss causes a page
table walk, which is expensive.

With 4 KB pages and a large heap, you have a lot of distinct pages,
and TLB thrashing is a real problem. The GC in particular touches
almost every page during a full scan, which blows out the TLB.

Huge pages (2 MB on x86-64) cover 512× more memory per TLB entry.
A 4 GB heap uses ~2000 huge pages instead of ~1,000,000 regular pages.
The TLB can actually cache the whole heap.

### 11.2 Explicit hugepages

```bash
# Configure hugepages in the kernel.
$ echo 2048 | sudo tee /proc/sys/vm/nr_hugepages

# Verify.
$ grep Huge /proc/meminfo
HugePages_Total:    2048
HugePages_Free:     2048
Hugepagesize:       2048 kB

# Tell the JVM to use them.
java -XX:+UseLargePages -Xms4g -Xmx4g MyApp
```

Explicit hugepages give the most predictable performance. They are
pre-allocated at kernel configuration time and are guaranteed to be
available. If `nr_hugepages` is too small for `-Xmx`, the JVM falls
back to regular pages.

### 11.3 Transparent huge pages (THP)

THP is the kernel's automatic huge page system. Three modes:

- `always` — the kernel aggressively tries to give everyone 2 MB
  pages, triggering compaction stalls. **Avoid.**
- `madvise` — the kernel only uses huge pages where a process has
  called `madvise(MADV_HUGEPAGE)`. The JVM does this for the heap.
- `never` — no transparent huge pages. Use this if you have explicit
  hugepages configured.

```bash
java -XX:+UseTransparentHugePages -Xms4g -Xmx4g MyApp
```

With THP in `madvise` mode, HotSpot hints the heap region for huge
pages and the kernel backs what it can. Mixed 4 KB / 2 MB mapping is
normal.

### 11.4 GC interaction

Huge pages help minor GCs significantly because the collector scans
card tables and stack roots that reference many distinct heap pages.
Reducing TLB misses can cut minor GC times by 10–20% on large heaps.

---

## 12. Compressed oops

On a 64-bit JVM, every object reference could in principle be a full
64-bit pointer. But Java object references tend to point at a small
number of heap addresses clustered together, and the bottom few bits
are always zero because objects are aligned.

**Compressed oops** take advantage of both facts. Instead of storing a
full 64-bit pointer, the JVM stores a 32-bit offset from the heap base
address, shifted left by 3 (to recover the 8-byte alignment). That
gives a 32 GB addressable range with 32-bit fields.

### 12.1 The savings

Every object header has a class pointer. Every reference field is a
pointer. Cutting pointer size in half:

- Saves 4 bytes per object header (compressed class pointers).
- Saves 4 bytes per reference field.
- Reduces cache footprint dramatically — a `HashMap.Entry` goes from
  48 bytes to 32 bytes.
- GC scans move faster because less data.

Typical savings: 10–20% reduction in heap footprint, 5–15% speedup on
pointer-chasing workloads.

### 12.2 The 32 GB cliff

Compressed oops work up to **32 GB heaps**. At `-Xmx32g + 1 byte` the
JVM turns them off and every reference becomes a full 64-bit pointer.
Your 32 GB heap suddenly needs 38–40 GB to hold the same objects.

**This is why "just bump it to 40 GB" is worse than 31 GB** for many
applications. A 31 GB heap with compressed oops can often hold more
live data than a 40 GB heap without.

```bash
# Default: enabled if heap < 32 GB.
java -Xms31g -Xmx31g -XX:+UseCompressedOops MyApp

# Force off (diagnostic only).
java -Xms4g -Xmx4g -XX:-UseCompressedOops MyApp
```

### 12.3 Extending the cliff with object alignment

`-XX:ObjectAlignmentInBytes` lets you change the alignment from the
default 8 bytes to 16 or 32. Since compressed oops use the shift to
recover alignment, larger alignment extends the addressable range:

- 8-byte alignment: 32 GB range
- 16-byte alignment: 64 GB range
- 32-byte alignment: 128 GB range

```bash
java -Xms64g -Xmx64g -XX:ObjectAlignmentInBytes=16 MyApp
```

The trade-off: every object is padded to the new alignment, which
wastes a few bytes per object. For applications dominated by small
objects, this can cost more than the compressed oops save. Benchmark.

### 12.4 Verifying compressed oops

```bash
$ java -Xmx31g -XX:+PrintFlagsFinal -version | grep -i coop
     bool UseCompressedClassPointers = true
     bool UseCompressedOops         = true

$ java -Xmx33g -XX:+PrintFlagsFinal -version | grep -i coop
     bool UseCompressedClassPointers = false
     bool UseCompressedOops          = false
```

Above the cliff, both are off.

---

## 13. Swap, OOM killer, and pressure

### 13.1 Java and swap

When a Java process has pages swapped out, GC becomes catastrophic.
The collector needs to walk the whole heap on a major GC, which means
every swapped-out page gets swapped *in* again. You have turned a
10 ms minor GC into a 10-minute full GC during which the application
is unresponsive and the disk is thrashing.

Rule: **do not let your JVM swap.** Ever.

```bash
# System-wide swappiness. 0 = only swap to avoid OOM.
$ sudo sysctl vm.swappiness=1

# Lock the JVM into RAM with mlockall (requires root or capability).
java -XX:+AlwaysPreTouch -XX:+UseLargePages MyApp
```

`-XX:+AlwaysPreTouch` causes the JVM to write a zero to every page of
the committed heap at startup, forcing them to become resident
immediately. This makes startup slower but prevents page-in stalls
during GC.

### 13.2 The Linux OOM killer

When the kernel runs out of physical memory and cannot swap, it wakes
the OOM killer. The OOM killer picks a process to kill based on:

- `oom_score_adj` — per-process bias, -1000 to 1000.
- RSS — bigger processes are preferred targets.
- Age — older processes are slightly protected.
- Whether the process has children.

A big, long-running Java process is almost always the OOM killer's
first choice. Survival strategies:

1. **Size correctly.** The best OOM killer mitigation is not being the
   biggest process.
2. **Lower `oom_score_adj`** for critical processes:
   ```bash
   echo -500 | sudo tee /proc/$(pgrep -f MyApp)/oom_score_adj
   ```
3. **Use cgroup limits** to isolate. A JVM in a cgroup with a memory
   limit will hit the cgroup OOM killer *before* the system OOM
   killer wakes up. Only the JVM dies; other processes are safe.

### 13.3 OOMKilled in Kubernetes

Kubernetes sets the cgroup memory limit from the pod spec. When the
JVM's RSS exceeds that limit, the cgroup kills it. The pod status
becomes `OOMKilled`, and `kubectl describe` shows:

```
Last State:     Terminated
  Reason:       OOMKilled
  Exit Code:    137
```

Common causes:

- **Heap sized to 100% of limit.** Ignored Metaspace + code cache +
  native = dead. Use 75%.
- **Direct memory leak.** Netty retained without release.
- **Glibc arena fragmentation.** Switch to jemalloc with
  `LD_PRELOAD=/usr/lib/x86_64-linux-gnu/libjemalloc.so.2`.
- **Metaspace leak.** Undeployed webapp keeping class loaders pinned.
- **Thread pool explosion.** Unbounded `newCachedThreadPool()` that
  grew to 10,000 threads.

Diagnosis starts with NMT. Run the workload with
`-XX:NativeMemoryTracking=summary`, take a baseline, let it run until
it approaches the limit, take another summary, and diff them.

### 13.4 Kubernetes request vs limit

Kubernetes has two memory fields:

- **Request** — the amount reserved for scheduling. The pod is
  guaranteed at least this much.
- **Limit** — the hard cap. Exceed it and you die.

For Java, **set request = limit**. Otherwise the scheduler may pack
pods onto a node based on small requests, and when they all scale up
to their limits the node runs out of RAM and everyone dies together.

---

## 14. Useful tools

### 14.1 `jcmd` — the Swiss army knife

```bash
# List all running JVMs.
$ jcmd

# Show all commands for one JVM.
$ jcmd 12345 help

# Native memory summary.
$ jcmd 12345 VM.native_memory summary

# Native memory detail with call sites.
$ jcmd 12345 VM.native_memory detail

# Save / diff.
$ jcmd 12345 VM.native_memory baseline
$ jcmd 12345 VM.native_memory summary.diff

# Heap info (committed/used by region).
$ jcmd 12345 GC.heap_info

# Live class histogram.
$ jcmd 12345 GC.class_histogram | head -20

# Force full GC.
$ jcmd 12345 GC.run

# Heap dump (live objects only).
$ jcmd 12345 GC.heap_dump /tmp/heap.hprof

# Thread dump.
$ jcmd 12345 Thread.print

# JVM flags at runtime.
$ jcmd 12345 VM.flags
```

### 14.2 `jstat` — GC statistics

```bash
# Print GC stats every second, forever.
$ jstat -gc 12345 1s
 S0C    S1C    S0U    S1U      EC       EU        OC         OU       MC     MU    CCSC   CCSU   YGC     YGCT    FGC    FGCT     GCT
65536.0 65536.0  0.0   0.0   524288.0 412736.0 3407872.0  1342177.6 65536.0 62847.3 8192.0 7543.9    142    1.832   3      0.287    2.119

# Same, but as utilization percentages.
$ jstat -gcutil 12345 1s
  S0     S1     E      O      M     CCS    YGC     YGCT    FGC    FGCT     GCT
  0.00   0.00  78.72  39.38  95.90  92.07    142    1.832     3    0.287    2.119

# Show what caused the last GC.
$ jstat -gccause 12345
  S0     S1     E      O      M     CCS    YGC     YGCT    FGC    FGCT     GCT    LGCC                 GCC
  0.00   0.00  78.72  39.38  95.90  92.07    142    1.832     3    0.287    2.119 Allocation Failure   No GC
```

Columns:
- `S0C`/`S1C`/`EC`/`OC`/`MC` — capacity (committed) of survivor 0,
  survivor 1, Eden, old, Metaspace.
- `S0U`/`S1U`/`EU`/`OU`/`MU` — current used.
- `YGC`/`YGCT` — young GC count / total young GC time (seconds).
- `FGC`/`FGCT` — full GC count / total full GC time.

### 14.3 `pmap` — process memory map

```bash
$ pmap -x 12345 | head -20
12345:   java -Xmx4g -jar myapp.jar
Address           Kbytes     RSS   Dirty Mode  Mapping
0000000000400000      12      12       0 r-x-- java
0000000000403000       4       4       4 r---- java
0000000000404000       4       4       4 rw--- java
0000000701000000 3145728 3145728 3145728 rw---   [ anon ]
00007f1e4c000000   65536   42304   42304 rw---   [ anon ]
00007f1e50000000    8192    1284    1284 rw---   [ anon ]
...
```

The huge `rw--- [ anon ]` region starting at `0x701000000` is the Java
heap (its address is fixed by the compressed oops base). The smaller
anonymous regions are Metaspace, code cache, thread stacks, direct
buffers — all hard to tell apart without NMT.

### 14.4 `/proc/<pid>/status`

```bash
$ grep -E '^Vm|^Rss' /proc/12345/status
VmPeak:  14876520 kB
VmSize:  14876520 kB
VmLck:         0 kB
VmPin:         0 kB
VmHWM:   3421084 kB
VmRSS:   3421084 kB
RssAnon: 3310912 kB
RssFile:   95876 kB
RssShmem:  14296 kB
VmData:  13947520 kB
VmStk:       132 kB
VmExe:        12 kB
VmLib:    121436 kB
VmPTE:     15728 kB
VmSwap:        0 kB
```

- `VmPeak` / `VmSize` — virtual size (peak and current).
- `VmHWM` / `VmRSS` — resident set (high-water mark and current).
- `RssAnon` — anonymous (not file-backed) resident pages. This is
  where the Java heap, Metaspace, code cache, and thread stacks live.
- `RssFile` — file-backed resident pages. Shared libraries, mmap'd
  JARs, mmap'd data files.
- `VmSwap` — how much has been swapped out. **For a JVM, this should
  always be zero.**

### 14.5 `smem`

```bash
$ smem -P java -tk
  PID User     Command                         Swap      USS      PSS      RSS
12345 app      java -Xmx4g -jar myapp.jar         0     3.1G     3.2G     3.3G
-------------------------------------------------------------------------------
    1                                             0     3.1G     3.2G     3.3G
```

The USS is the truest "how much would I save if I killed this
process" number.

### 14.6 `jhsdb jmap --heap`

`jhsdb` is the replacement for the deprecated `jmap` command. The
`jmap` mode prints heap details:

```bash
$ jhsdb jmap --heap --pid 12345
Attaching to process ID 12345, please wait...
Debugger attached successfully.
Server compiler detected.
JVM version is 21.0.2+13-LTS

using thread-local object allocation.
Garbage-First (G1) GC with 8 thread(s)

Heap Configuration:
   MinHeapFreeRatio         = 40
   MaxHeapFreeRatio         = 70
   MaxHeapSize              = 4294967296 (4096.0MB)
   NewSize                  = 1363144 (1.3MB)
   MaxNewSize               = 2576351232 (2457.0MB)
   OldSize                  = 5452592 (5.2MB)
   NewRatio                 = 2
   SurvivorRatio            = 8
   MetaspaceSize            = 22020096 (21.0MB)
   CompressedClassSpaceSize = 1073741824 (1024.0MB)
   MaxMetaspaceSize         = 17592186044415 MB
   G1HeapRegionSize         = 2097152 (2.0MB)

Heap Usage:
G1 Heap:
   regions  = 2048
   capacity = 4294967296 (4096.0MB)
   used     = 1342177280 (1280.0MB)
   free     = 2952790016 (2816.0MB)
   31.25% used
G1 Young Generation:
Eden Space:
   regions  = 520
   capacity = 2462056448 (2348.0MB)
   used     = 1090519040 (1040.0MB)
   free     = 1371537408 (1308.0MB)
   44.29% used
Survivor Space:
   regions  = 16
   capacity = 33554432 (32.0MB)
   used     = 33554432 (32.0MB)
   free     = 0 (0.0MB)
   100.00% used
G1 Old Generation:
   regions  = 104
   capacity = 218103808 (208.0MB)
   used     = 218103808 (208.0MB)
   free     = 0 (0.0MB)
   100.00% used
```

### 14.7 A diagnostic checklist

When a JVM is using "too much memory," walk through in this order:

1. `ps` or `top` — confirm current VSZ and RSS.
2. `/proc/<pid>/status` — verify `VmSwap` is 0.
3. `jcmd <pid> GC.heap_info` — how full is the heap?
4. `jcmd <pid> VM.native_memory summary` (if NMT enabled) — where
   is the non-heap memory going?
5. `pmap -x <pid>` — are there suspicious huge anonymous regions
   that NMT does not explain? (Usually glibc arenas or JNI mallocs.)
6. Heap dump with `jcmd GC.heap_dump` — analyze with MAT or
   visualvm if heap itself looks bloated.
7. `jstat -gccause` — are we in constant GC?
8. Linux `perf` or `async-profiler` — if time is going to allocation,
   where?

---

## Summary

A running JVM is not one memory region; it is a dozen, each sized and
managed differently. The Java heap gets the attention, but the code
cache, Metaspace, thread stacks, and direct buffers together often
dwarf it in production.

The one-slide version:

- **VSZ** is the JVM's reservation, usually much bigger than reality.
- **RSS** is the physical cost, what the kernel and cgroup limits
  care about.
- **Committed** is what the JVM has promised to use; **reserved** is
  what it has set aside without committing.
- **NMT** is the only tool that attributes committed memory to
  specific JVM subsystems.
- **pmap + smaps** are the only tools that see everything the kernel
  sees.
- **Compressed oops** cut reference size in half up to a 32 GB heap.
- **Container support** reads cgroup limits so percentage-based heap
  sizing works.
- **Do not let a JVM swap.** Ever.

Once you have internalized these boundaries, "my Java process uses
8 GB" becomes a question you can actually answer precisely — and
every GC and memory tuning conversation stops being a fight about
which number is right.

---

## Study Guide — JVM Memory Spaces

### Key concepts

1. **Heap vs native memory.** Heap is GC-managed; native
   includes code cache, metaspace, direct buffers, thread
   stacks.
2. **Compressed oops** save space by using 32-bit references
   for heaps under 32 GB.
3. **`-Xmx`, `-Xms`, `-Xss`.** Max heap, initial heap, per-thread
   stack.
4. **`-XX:MaxDirectMemorySize`.** Caps `java.nio` direct buffers.
5. **Metaspace** replaced PermGen in JDK 8.

---

## DIY & TRY

### DIY 1 — Account for every byte

Run a real Java service. Use `jcmd VM.native_memory summary`
to see the exact breakdown. Reconcile with `RSS` from `ps`.
They should line up.

### DIY 2 — Observe metaspace growth

Run a Spring Boot app repeatedly hot-reloading classes. Watch
metaspace grow if you have a classloader leak.

### TRY — Set cgroup limits

Run a JVM in Docker with `--memory=512m`. Watch the JVM
auto-size the heap. Compare to `-XX:+UseContainerSupport`
(default on JDK 10+).

---

## Related College Departments

- [**engineering**](../../../.college/departments/engineering/DEPARTMENT.md)
