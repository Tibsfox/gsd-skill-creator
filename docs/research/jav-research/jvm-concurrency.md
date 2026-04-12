# Java, Part II — The JVM, Concurrency, and Performance

> "Write once, run anywhere" was the slogan. The delivery mechanism was the
> Java Virtual Machine: an abstract stack machine whose specification is
> stable enough that a `.class` file compiled in 1996 still runs on a 2026
> JDK, and whose implementations have quietly become some of the most
> sophisticated runtime systems ever built.

The first part of this research series covered the Java language itself —
its history, its syntax, its type system, and the library decisions that
shaped a generation of enterprise software. This part goes underneath the
language. It looks at the machine that runs Java, the memory it manages,
the threads it schedules, and the performance engineering tradition that
grew up around it.

Java the language has always been conservative. Java the runtime has
always been ambitious. The gap between those two halves is where most of
the interesting engineering lives.

---

## 1. The Java Virtual Machine

### 1.1 What the JVM actually is

The JVM is an **abstract computing machine** whose instruction set is not
the native instruction set of any real CPU. It is defined by a document —
*The Java Virtual Machine Specification* — which is maintained separately
from *The Java Language Specification*. Both are published by Oracle as
part of the JSR process, and both change over time, but they change on
different schedules and for different reasons.

The JVM specification describes:

- a binary file format (the `.class` file) for delivering compiled code,
- an **instruction set** of roughly 200 opcodes that operate on a stack
  machine,
- a set of **runtime data areas** (heap, method area, stacks, PC, native
  stacks),
- a **verification algorithm** that proves a `.class` file is structurally
  safe before any code in it runs,
- rules for class loading, linking, initialization, and thread semantics.

It explicitly does **not** describe a garbage collector, a JIT compiler,
thread scheduling behavior, or how any of it maps to real hardware. Those
are implementation concerns. This is what allows OpenJDK HotSpot,
Eclipse OpenJ9, GraalVM, and Azul Zing to all legitimately call
themselves "JVMs" while making wildly different engineering choices under
the hood.

The important consequence: **Java the language** is only one of many
things that can target the JVM. Scala, Kotlin, Clojure, Groovy, JRuby,
Jython, Frege, Ceylon, and Eta all emit `.class` files or use the JVM as
a runtime. The JVM is genuinely a platform, not just a Java execution
engine.

### 1.2 The class file format

A `.class` file is a binary blob with a very strict structure. The first
four bytes are the magic number `CAFEBABE`, a hexadecimal in-joke from
James Gosling's team that has survived untouched since the early 1990s.
The next four bytes are the minor and major version of the class file
format. Major version 52 is Java 8, 61 is Java 17, 65 is Java 21. A JVM
will refuse to load a class file whose major version is newer than its
own.

The rest of the file is a carefully packed structure:

```text
ClassFile {
    u4             magic;              // 0xCAFEBABE
    u2             minor_version;
    u2             major_version;
    u2             constant_pool_count;
    cp_info        constant_pool[constant_pool_count-1];
    u2             access_flags;       // public, final, interface, etc.
    u2             this_class;
    u2             super_class;
    u2             interfaces_count;
    u2             interfaces[interfaces_count];
    u2             fields_count;
    field_info     fields[fields_count];
    u2             methods_count;
    method_info    methods[methods_count];
    u2             attributes_count;
    attribute_info attributes[attributes_count];
}
```

The **constant pool** is the heart of it. Every string literal, every
class name, every method name and descriptor, every `int` or `float`
constant larger than the small immediate values used in bytecode — all of
it lives in the constant pool. Bytecode instructions that reference
classes or methods do so by pointing to a constant pool entry. This
indirection is what allows the verifier and the linker to check and
resolve symbolic references before any code executes.

### 1.3 Implementations

There is no single JVM. There is a family.

- **HotSpot** — the OpenJDK reference implementation, also shipped as
  Oracle JDK. Written in C++, with the interpreter, C1, and C2 compilers,
  and several GCs including G1 and ZGC. This is what most people mean by
  "the JVM."
- **Eclipse OpenJ9** — originally IBM's J9, donated to Eclipse. Focused
  on small footprint and fast startup, with features like shared class
  caches. Popular in containerized environments.
- **GraalVM** — Oracle Labs' project that replaces the C2 compiler with a
  Java-based compiler (Graal) and adds Ahead-of-Time compilation via
  SubstrateVM / Native Image, plus polyglot support.
- **Azul Zing / Prime** — commercial JVM famous for the C4 (Continuously
  Concurrent Compacting Collector) garbage collector, pauseless at
  very large heap sizes.
- **Azul Zulu** — Azul's free OpenJDK build.
- **Amazon Corretto** — Amazon's supported OpenJDK build.
- **Adoptium Temurin** — the Eclipse Foundation's community OpenJDK build,
  successor to AdoptOpenJDK.
- **BellSoft Liberica** — another widely used OpenJDK distribution.
- **SAP Machine** — SAP's supported OpenJDK.

Why does this matter? Because they differ on things users can measure:
startup time, peak throughput, tail latency, container footprint,
licensing, long-term support terms. An application that spends its life
in a Kubernetes pod with a 30-second liveness probe cares about startup;
a trading platform cares about p99.9 pause times; a batch system cares
about throughput per dollar. The JVM is not one performance profile, it
is a menu.

---

## 2. Class loading

### 2.1 The delegation model

Java loads classes lazily. When a class is mentioned — by `new`, by
static reference, by reflection — the JVM asks a **ClassLoader** to
produce it. ClassLoaders form a tree with a strict delegation rule:
**before loading a class yourself, ask your parent**. This is what keeps
`java.lang.String` from ever being shadowed by user code: every
ClassLoader chain eventually reaches the bootstrap loader, which loads
it from the platform's core modules, and returns it to whoever asked
first.

The standard chain, as of Java 9+, is:

1. **Bootstrap ClassLoader** — native code inside the JVM. Loads the
   core platform modules (`java.base`, etc.). Has no Java object
   representation; `getClassLoader()` on a core class returns `null`.
2. **Platform ClassLoader** — loads the rest of the platform modules.
   Before Java 9 this was called the "Extension" ClassLoader and read
   jars from `jre/lib/ext`.
3. **System / Application ClassLoader** — loads classes from the
   application classpath or module path. This is what
   `ClassLoader.getSystemClassLoader()` returns, and it is the parent
   of most user-defined loaders.

### 2.2 Custom loaders

A class loader is just a subclass of `java.lang.ClassLoader` that
overrides `findClass(String name)` (or `loadClass` if you want to break
delegation). Real-world custom loaders include:

- **Servlet containers** (Tomcat, Jetty) — each web app gets its own
  loader so that two wars can ship different versions of the same
  library without colliding.
- **OSGi frameworks** (Equinox, Felix) — each bundle is a loader; the
  framework enforces explicit imports/exports to control visibility.
- **Plugin systems** — IDE plugins, database drivers, SPI
  implementations. A plugin loader can be discarded and replaced at
  runtime, which is how hot reload works.
- **Bytecode generators** — frameworks like Hibernate, Spring, and
  Mockito generate classes on the fly and define them through a custom
  loader.

### 2.3 Verification

Every class file passes through the **bytecode verifier** before its
methods can execute. The verifier proves, statically, that:

- every opcode has the right operand types on the stack,
- branches land inside the method at valid instruction boundaries,
- locals are initialized before use,
- the stack never underflows or overflows,
- access modifiers are respected,
- `final` classes are not extended, `final` methods are not overridden.

Verification is why the JVM can safely run untrusted `.class` files
without trapping into the OS on every memory access. The cost is paid
once at load time. As of Java 6, `StackMapTable` attributes carry
pre-computed type information so the verifier can do a single linear
pass instead of a dataflow fixpoint.

---

## 3. JVM memory model (runtime data areas)

Do not confuse the **runtime data areas** (where things live) with the
**Java Memory Model** (section 8, the happens-before rules). Both are in
the JVM spec; they answer different questions.

### 3.1 The heap

The heap holds every Java object and every array. It is shared across
all threads and managed by the garbage collector. Modern GCs divide it
generationally:

- **Young generation** — split into **Eden** and two **survivor**
  spaces (S0 and S1). New allocations land in Eden. When Eden fills,
  a minor GC moves survivors to one of S0/S1. Survivors that live
  through enough minor GCs are *tenured* to the old generation.
- **Old / Tenured generation** — longer-lived objects. Collected less
  often, usually with a different algorithm than the young gen.

This split exists because of the **weak generational hypothesis**: in
typical workloads the vast majority of objects die young. Optimizing
for that case — cheap bump-pointer allocation in Eden, cheap copying
of the few survivors — is dramatically faster than treating every
object equally.

### 3.2 Metaspace

Up to Java 7, class metadata lived in the **permanent generation**
("PermGen"), a fixed-size region inside the heap. It was the source of
many famous `OutOfMemoryError: PermGen space` incidents, especially in
servlet containers that reloaded web apps. Java 8 removed PermGen and
introduced **Metaspace**, which lives in native memory and grows as
needed (capped by `-XX:MaxMetaspaceSize`). Class metadata, constant
pools, method bytecode, and type information live there.

### 3.3 Per-thread memory

Each thread gets:

- a **JVM stack** holding a **frame** per active method call. A frame
  contains local variables, an operand stack, and a reference to the
  method's constant pool. Stack size is fixed per thread
  (`-Xss`), and overflowing it throws `StackOverflowError`.
- a **PC register** pointing at the current bytecode instruction.
- a **native method stack** for `native` calls implemented in C/C++.

### 3.4 Direct memory

`java.nio.ByteBuffer.allocateDirect(n)` reserves memory **outside the
Java heap**, in the native address space. It is used by NIO channels
(file and socket I/O), off-heap caches (Chronicle Map, Ehcache), and
anything that needs to avoid copying between Java and native. Direct
buffers are not GC'd the same way; they are freed when a
`Cleaner` (post-Java 9) or a phantom-reference trick collects them.

---

## 4. Garbage collection

Garbage collection is the feature that most non-Java programmers
associate with Java, and the feature Java programmers spend the most
time arguing about. Every major GC in HotSpot has a different theory
of operation and different tuning knobs.

### 4.1 Serial GC

`-XX:+UseSerialGC`. Single-threaded. Stops the world, walks the live
set, compacts. Good for small heaps, CLI tools, and situations where
you want predictable simplicity and don't care about multi-core
scaling.

### 4.2 Parallel GC ("throughput")

`-XX:+UseParallelGC`. Multi-threaded stop-the-world collector. Was the
default on server-class machines for Java 7 and Java 8. Maximizes
throughput at the cost of occasional long pauses. Still an excellent
choice for batch jobs where pauses don't matter but CPU efficiency does.

### 4.3 CMS — Concurrent Mark Sweep

`-XX:+UseConcMarkSweepGC`. First GC that attempted to do most of its
work concurrently with the application. Introduced in the early 2000s,
**deprecated in Java 9**, **removed in Java 14**. Notorious for
fragmenting the old gen (it swept but did not compact) and for the
promotion-failure full GCs that resulted. CMS's lessons shaped G1 and
Shenandoah.

### 4.4 G1 — Garbage First

`-XX:+UseG1GC`. Default since Java 9. Divides the heap into roughly
2,048 equal-sized regions (the exact size scales with heap). Any region
can be Eden, Survivor, or Old. Instead of collecting whole generations,
G1 picks the set of regions with the most garbage — "garbage first" —
and evacuates them into free regions, which also compacts.

G1 is tunable around a pause-time target:
`-XX:MaxGCPauseMillis=200` asks the collector to aim for 200 ms pauses
and adjust region counts accordingly. This is a soft target; G1 will
miss it under memory pressure.

### 4.5 ZGC

`-XX:+UseZGC`. Introduced as experimental in Java 11, production-ready
in Java 15. Targets pause times **below 10 ms** (and in practice
typically under 1 ms) regardless of heap size, up to terabytes. It
achieves this through **colored pointers** and **load barriers**:
reference metadata is encoded in spare pointer bits, and every load
goes through a read barrier that can fix up a reference to a relocated
object. Generational ZGC landed in **Java 21**, adding a young
generation for much better throughput on allocation-heavy workloads.

### 4.6 Shenandoah

`-XX:+UseShenandoahGC`. Red Hat's concurrent compacting collector,
developed in OpenJDK. Like ZGC, it targets ultra-low pause times. The
technical approach differs — Shenandoah originally used a Brooks
forwarding pointer per object, later switched to load reference
barriers. Shipped in Red Hat's builds for years before landing in
upstream OpenJDK 12.

### 4.7 Epsilon GC

`-XX:+UseEpsilonGC` (experimental flag required). A no-op garbage
collector. It allocates but never reclaims. When the heap fills, the
JVM exits. Useful for benchmarking the allocator, for extremely
short-lived processes, and for performance testing of the allocation
path without GC noise.

### 4.8 Allocation: TLABs

Allocation in a multi-threaded heap would normally require
synchronization on the bump pointer. HotSpot avoids this with
**Thread-Local Allocation Buffers**: each thread carves out a chunk of
Eden and allocates inside it without locking. When the TLAB is full,
the thread gets a new one. Allocation thus becomes a pointer bump plus
a comparison — often a handful of instructions, competitive with
stack allocation in C.

### 4.9 GC tuning flags

```text
# Heap sizing
-Xms4g                       # initial heap
-Xmx4g                       # max heap (pin == initial to avoid resizing)

# Collector selection
-XX:+UseG1GC                 # G1
-XX:+UseZGC                  # ZGC
-XX:+UseShenandoahGC         # Shenandoah
-XX:+UseParallelGC           # Parallel throughput
-XX:+UseSerialGC             # Serial

# G1 tuning
-XX:MaxGCPauseMillis=200     # soft pause target
-XX:G1HeapRegionSize=16m     # override region size

# Logging (JDK 9+ unified logging)
-Xlog:gc*:file=gc.log:time,level,tags

# Pre-touch all heap pages at startup (avoids page faults later)
-XX:+AlwaysPreTouch
```

---

## 5. JIT compilation

HotSpot executes code in three modes in rapid succession: the
interpreter, the C1 compiler, and the C2 compiler. This is known as
**tiered compilation** and is on by default.

### 5.1 Interpreter, C1, C2

- **The template interpreter** runs bytecode directly. It is fast to
  start (no compile step), and it records **profiling information** —
  which branches are taken, which types pass through a call site, how
  often each method is invoked.
- **C1 (the client compiler)** is a fast JIT. It compiles a method to
  native code after it has been invoked enough times. The code it
  produces is not maximally optimized, but it is dramatically faster
  than interpreted execution. C1 continues gathering profile data.
- **C2 (the server compiler)** is the heavy-duty JIT. After a method
  has been hot enough long enough, the VM sends it to C2 with all the
  profile data. C2 performs aggressive optimizations: inlining,
  escape analysis, lock coarsening, scalar replacement, loop
  unrolling, branch prediction annotations, devirtualization.

### 5.2 On-stack replacement

Tiered compilation would be defeated by a single long-running method —
a `main` that contains a giant loop. Classic JITs only replace a
method on its *next* invocation, and that next invocation never comes.
HotSpot solves this with **on-stack replacement (OSR)**: while the
loop is still running in the interpreter or in C1, the VM compiles a
specialized version and transplants the current stack frame into it
at a safe point in the loop. The same logical execution continues, but
now in native code.

### 5.3 Speculative optimization and deoptimization

C2 is **speculative**. It assumes, for example, that the receiver at a
virtual call site has always been the same concrete class, and inlines
that class's implementation directly. If a new class flows through
later, the assumption breaks. C2 inserts a **guard**: if the guard
fails, the frame is **deoptimized** back to the interpreter, a new
profile is gathered, and eventually C2 tries again.

This is why microbenchmarks are so treacherous. A method that looks
blazing fast in isolation may have been monomorphic only because your
benchmark loop only fed it one type. Put it in production with
polymorphic call sites and the compiler's assumptions collapse.

### 5.4 Code cache

Compiled native code lives in the **code cache**, a native memory
region with a fixed size (`-XX:ReservedCodeCacheSize`). When it fills,
the JIT stops and the VM falls back to the interpreter, which is a
dramatic performance cliff. Tiered compilation divides the code cache
into segments for profiled, non-profiled, and non-method code to
reduce cliffs.

---

## 6. GraalVM

GraalVM is two things bundled into one product.

### 6.1 Graal, the Java-written JIT

The first thing is a replacement for C2, written in Java. Graal is
itself compiled by C2 (or by Graal, once bootstrapped), and it can
replace C2 entirely via the JVMCI interface. Being written in Java
means Graal can use higher-level abstractions, be refactored more
easily, and be tested with Java tooling. It also tends to produce
better code for functional and streaming idioms than C2 does, because
it was designed more recently and has been tuned on modern
benchmarks.

### 6.2 Native Image and SubstrateVM

The more disruptive part is **Native Image**. It compiles a Java
application **ahead of time**, along with a minimal runtime called
**SubstrateVM**, into a standalone native executable. The result
starts in milliseconds instead of seconds, uses dramatically less
memory, and ships as a single file.

The cost is the **closed-world assumption**: all reachable classes
must be known at build time. Reflection, dynamic proxies, and resource
loading require explicit configuration. Many frameworks (Micronaut,
Quarkus, Helidon, Spring Boot with AOT processing) have restructured
themselves around this constraint. The payoff is that a Spring
application can cold-start in 60 ms instead of 6 seconds, which
matters enormously for serverless, for CLI tools, and for scale-to-zero
workloads.

Native Image loses the warm HotSpot peak throughput — you give up a
decade of C2 profile-guided optimization — but it trades that for
immediate top speed and a tiny footprint.

### 6.3 Polyglot

GraalVM also ships interpreters (Truffle-based) for JavaScript, Python,
R, Ruby, LLVM bitcode, and WebAssembly. In theory you can mix languages
in one process and hand objects across the boundary. In practice this
is used most by engineers embedding a scripting layer in a Java host,
and by database engines that want to run user-defined functions in
multiple languages.

---

## 7. Bytecode

The JVM is a **stack machine**. Every method has an operand stack;
every instruction pops operands off the stack, computes, and pushes
the result back.

### 7.1 Categories of opcodes

- **Load and store:** `iload`, `istore`, `aload`, `astore`, `lload`,
  `lstore`, `fload`, `fstore`, `dload`, `dstore`. Letter prefix
  indicates type: `i`=int, `l`=long, `f`=float, `d`=double, `a`=object
  reference. Suffixes `_0` through `_3` are shorthand for the first
  four local slots.
- **Arithmetic:** `iadd`, `isub`, `imul`, `idiv`, `irem`, `ineg`, and
  variants per type.
- **Control flow:** `ifeq`, `ifne`, `if_icmplt`, `goto`, `tableswitch`,
  `lookupswitch`, `return`, `ireturn`, `areturn`.
- **Invocation:** `invokevirtual` (normal method calls),
  `invokestatic`, `invokespecial` (constructors and super calls),
  `invokeinterface`, `invokedynamic`.
- **Field access:** `getfield`, `putfield`, `getstatic`, `putstatic`.
- **Object creation and introspection:** `new`, `newarray`,
  `anewarray`, `arraylength`, `checkcast`, `instanceof`.

### 7.2 javap -c

The JDK ships `javap`, a disassembler. Given a compiled class, it can
print the bytecode:

```text
$ cat Hello.java
public class Hello {
    public static int add(int a, int b) { return a + b; }
}

$ javac Hello.java && javap -c Hello
Compiled from "Hello.java"
public class Hello {
  public Hello();
    Code:
       0: aload_0
       1: invokespecial #1   // Method java/lang/Object."<init>":()V
       4: return

  public static int add(int, int);
    Code:
       0: iload_0
       1: iload_1
       2: iadd
       3: ireturn
}
```

`iload_0` pushes the first parameter, `iload_1` pushes the second,
`iadd` pops both and pushes their sum, `ireturn` pops and returns it.
That is the entire computation, four instructions, stack-based.

### 7.3 invokedynamic

Java 7 added `invokedynamic`, an instruction built specifically for
dynamic languages on the JVM (JRuby, Groovy, Nashorn) that need to
resolve method calls at runtime without paying the cost of reflection
on every invocation. An `invokedynamic` site is "cold" the first time
it executes; it calls a **bootstrap method** (specified in the class
file) which returns a `CallSite` containing a `MethodHandle`. Future
executions at that site call the MethodHandle directly and, crucially,
can be inlined by the JIT.

`invokedynamic` outgrew its original purpose. Since Java 8 it has
also backed:

- **lambda expressions** — `java.lang.invoke.LambdaMetafactory` spins a
  class per lambda on first use,
- **string concatenation** — Java 9's `+` operator now emits an
  `invokedynamic` to `StringConcatFactory` instead of a
  `StringBuilder` chain,
- **record equality and hashing** — the canonical `equals`, `hashCode`,
  and `toString` for records,
- **pattern matching dispatch** — `switch` over sealed types.

### 7.4 Instrumentation

Bytecode is, for practical purposes, **a data format**. You can read
it, rewrite it, and load the modified version. Libraries that do this
include:

- **ASM** — the lowest level, a direct visitor API over the class file
  format. Used by almost every other bytecode tool at some point.
- **Javassist** — a higher-level library that lets you write Java
  source fragments and splice them in.
- **ByteBuddy** — a fluent builder. The modern choice for Mockito,
  Hibernate, and many framework internals.
- **cglib** — older, still common in Spring AOP.

The `java.lang.instrument` API formalizes instrumentation as an agent
loaded at JVM startup or attached later. This is how APM tools (New
Relic, Datadog, Dynatrace) inject tracing into running code.

---

## 8. The Java Memory Model (JMM)

The JMM is the contract between the programmer and the JVM about what
is and is not visible across threads. It was first specified informally
in the original JLS, rewritten from scratch as **JSR 133** for Java 5,
and has become the template for the memory models in C++11, C11, and
Rust.

### 8.1 Why a memory model exists

On a modern multicore CPU, writes from one core do not become visible
to other cores immediately. They sit in store buffers and caches. The
CPU and the compiler both reorder reads and writes as long as the
reorderings are invisible **to the issuing thread**. Without extra
rules, a program like:

```java
int a = 0, b = 0;

// Thread 1           // Thread 2
a = 1;                int x = b;
b = 1;                int y = a;
```

can observe `x == 1` and `y == 0`. The store to `b` can become visible
before the store to `a`; the load of `a` can be hoisted above the load
of `b`. This is surprising, but it is real hardware behavior.

### 8.2 Happens-before

The JMM defines a partial order called **happens-before**. If an
action A happens-before an action B, then B is guaranteed to see
everything A did. Rules that establish happens-before include:

- program order within a single thread,
- an `unlock` on a monitor happens-before the next `lock` on that same
  monitor,
- a write to a `volatile` field happens-before every subsequent read of
  that same field,
- `Thread.start()` happens-before everything the new thread does,
- everything a thread does happens-before another thread's
  `Thread.join()` returns.

Anything **not** ordered by happens-before can race.

### 8.3 volatile, synchronized, final

- **`volatile`** gives a single field atomic reads and writes plus
  visibility. It does not give you atomicity across read-modify-write
  sequences. For that use `AtomicInteger`.
- **`synchronized`** acquires a monitor, guaranteeing exclusion and
  establishing happens-before with all other threads that have ever
  synchronized on that monitor.
- **`final` fields** have a special rule: after a constructor
  finishes, any thread that sees a properly-published reference to
  the object is guaranteed to see the final fields' constructed
  values. This is the foundation of immutable objects as a
  concurrency technique.

### 8.4 Safe publication

"Publishing" an object means making it visible to another thread.
"Safely publishing" means doing it in a way that the other thread is
guaranteed to see a fully-constructed object. Safe publication happens
via:

- initializing a `static` field (class init provides the barrier),
- storing into a `volatile` or `AtomicReference`,
- storing into a `final` field of a properly-constructed object,
- storing while holding a lock that the reader also acquires.

Unsafe publication — assigning to a plain field and hoping — is a
classic source of bugs that show up only under load.

---

## 9. Threading primitives (pre-Loom)

Java has had threads since day one. Before Loom, every
`java.lang.Thread` was a 1:1 mapping to an operating system thread.

### 9.1 Thread, Runnable, Callable

```java
// The classic three ways to create a thread
Thread t1 = new Thread(() -> System.out.println("hello from " + Thread.currentThread()));
t1.start();
t1.join();

ExecutorService pool = Executors.newFixedThreadPool(4);
Future<Integer> f = pool.submit(() -> {
    Thread.sleep(100);
    return 42;
});
System.out.println(f.get());
pool.shutdown();
```

`Runnable` is void-returning; `Callable<V>` returns a value and can
throw checked exceptions. A `Future<V>` is the handle to an async
result.

### 9.2 Monitors and wait/notify

Every Java object has a monitor. `synchronized(obj) { ... }` acquires
it; leaving the block releases it. Inside a monitor you can call
`obj.wait()`, which atomically releases the monitor and suspends the
thread until another thread calls `obj.notify()` or `obj.notifyAll()`
on the same object.

This is the low-level primitive that every higher-level concurrency
construct is built from, but direct use is rare in modern code — it
is error-prone and the `java.util.concurrent` locks and conditions
are better in almost every respect.

### 9.3 ThreadLocal

`ThreadLocal<T>` gives each thread its own independent copy of a
variable. Historically used for things like SimpleDateFormat caches
(because SimpleDateFormat is not thread-safe), per-request transaction
contexts, MDC logging context, and Spring's request attributes.
ThreadLocal has downsides — it leaks memory in long-lived thread
pools if not cleared — and is being partially superseded by **scoped
values** (section 11.6) in the Loom era.

### 9.4 Interruption

Cancellation in Java is cooperative, expressed via thread
interruption. `Thread.interrupt()` sets a flag; blocking methods
(`Thread.sleep`, `Object.wait`, `BlockingQueue.take`) check the flag
and throw `InterruptedException` if set. User code is expected to
handle the exception and either stop or reset the flag so higher
levels can handle it. Swallowing `InterruptedException` without
restoring the flag is one of the classic Java concurrency anti-patterns.

---

## 10. java.util.concurrent

`java.util.concurrent` (jucp) was JSR 166, released with Java 5 in
2004, written primarily by **Doug Lea** with contributions from
others on the concurrency interest list. It was the largest single
upgrade to Java concurrency until Loom.

### 10.1 Executors and pools

```java
ExecutorService fixed = Executors.newFixedThreadPool(8);
ExecutorService cached = Executors.newCachedThreadPool();
ScheduledExecutorService scheduled = Executors.newScheduledThreadPool(2);

// For fine control, go directly to ThreadPoolExecutor
ThreadPoolExecutor tp = new ThreadPoolExecutor(
    4, 16, 60, TimeUnit.SECONDS,
    new ArrayBlockingQueue<>(100),
    new ThreadFactoryBuilder().setNameFormat("worker-%d").build(),
    new ThreadPoolExecutor.CallerRunsPolicy());
```

A `ThreadPoolExecutor` has core size, max size, keep-alive for idle
threads, a work queue, a thread factory, and a rejection policy for
when submission overwhelms the pool. Choosing the queue matters:
an unbounded queue gives you OutOfMemory instead of backpressure; an
`ArrayBlockingQueue` plus `CallerRunsPolicy` is a common backpressure
recipe.

### 10.2 CompletableFuture

Java 8 added `CompletableFuture<T>`, a future you can compose:

```java
CompletableFuture<String> fetchUser(long id) { /* ... */ }
CompletableFuture<List<Order>> fetchOrders(String userName) { /* ... */ }

CompletableFuture<Integer> totalOrders =
    fetchUser(42)
        .thenCompose(user -> fetchOrders(user))
        .thenApply(List::size)
        .exceptionally(ex -> {
            log.warn("failed", ex);
            return 0;
        });

int count = totalOrders.join();
```

`thenApply` transforms the result, `thenCompose` chains another
future, `thenCombine` waits on two futures, `exceptionally` handles
failure. The whole thing runs on the common ForkJoinPool unless you
pass a specific executor.

### 10.3 Concurrent collections

- **`ConcurrentHashMap<K,V>`** — the workhorse. Striped locking in
  Java 5–7, lock-free reads and fine-grained CAS writes in Java 8+.

    ```java
    ConcurrentHashMap<String, Long> counts = new ConcurrentHashMap<>();
    counts.merge("requests", 1L, Long::sum);
    counts.computeIfAbsent("sessions", k -> 0L);
    ```

- **`CopyOnWriteArrayList`** — cheap reads, expensive writes
  (every mutation allocates a new array). Good for listener lists that
  rarely change.
- **`ConcurrentLinkedQueue`** — a non-blocking lock-free queue.
- **`BlockingQueue<E>`** with implementations:
    - **`ArrayBlockingQueue`** — bounded, array-backed.
    - **`LinkedBlockingQueue`** — optionally bounded, two-lock.
    - **`PriorityBlockingQueue`** — heap-ordered.
    - **`SynchronousQueue`** — zero capacity; every put must meet a
      take. Used by cached thread pools.
    - **`LinkedTransferQueue`** — the sophisticated one, supports
      `transfer()` which blocks until a consumer takes.

### 10.4 Atomics

```java
AtomicInteger counter = new AtomicInteger(0);
counter.incrementAndGet();
counter.compareAndSet(0, 1);

LongAdder busy = new LongAdder();  // better for high contention
busy.increment();
long current = busy.sum();
```

`AtomicInteger` and friends use compare-and-swap. `LongAdder` and
`LongAccumulator` (Java 8) reduce contention by striping across cells
and reading the sum only when you ask.

### 10.5 Locks, semaphores, barriers

- **`ReentrantLock`** — an explicit lock that can be tried, timed, or
  interrupted, supports multiple condition variables, and optionally
  fair FIFO ordering.
- **`ReentrantReadWriteLock`** — lets multiple readers in or one
  writer.
- **`StampedLock`** — optimistic reads that validate a stamp.
- **`Semaphore`** — classic counting semaphore.
- **`CountDownLatch`** — one-shot gate, useful for startup
  synchronization.
- **`CyclicBarrier`** — N threads meet at a barrier and proceed
  together, repeatedly.
- **`Phaser`** — a flexible barrier that supports dynamic registration.
- **`Exchanger`** — two threads swap objects.

### 10.6 Fork/Join

Java 7 added the **Fork/Join framework** for divide-and-conquer
parallelism. The core idea is **work stealing**: each worker thread
has its own deque of tasks, pulls from its own deque first, and
steals from others' when its own is empty.

```java
class SumTask extends RecursiveTask<Long> {
    private final long[] arr;
    private final int lo, hi;
    SumTask(long[] a, int lo, int hi) { this.arr = a; this.lo = lo; this.hi = hi; }

    @Override protected Long compute() {
        if (hi - lo < 1_000) {
            long s = 0;
            for (int i = lo; i < hi; i++) s += arr[i];
            return s;
        }
        int mid = (lo + hi) >>> 1;
        SumTask left = new SumTask(arr, lo, mid);
        SumTask right = new SumTask(arr, mid, hi);
        left.fork();
        return right.compute() + left.join();
    }
}

long total = ForkJoinPool.commonPool().invoke(new SumTask(data, 0, data.length));
```

`parallelStream()` and `CompletableFuture`'s default executor both use
the **common ForkJoinPool**, a singleton pool sized to the number of
cores. Hogging it with blocking operations is a famous performance
foot-gun; that is one of the reasons Loom exists.

---

## 11. Project Loom — virtual threads

### 11.1 The "thread per request" problem

For twenty years Java servers have chosen between two bad options:

- **Thread per request** — simple to write, scales to thousands of
  requests because every concurrent request needs an OS thread.
- **Async / reactive** — scales to hundreds of thousands, but the code
  is inverted into callbacks, futures, or reactive streams; stack
  traces are useless; debugging is painful.

**Project Loom**, led by Ron Pressler at Oracle, targeted this gap.
The goal: keep the ergonomic "thread per request" programming model
while scaling to millions of concurrent tasks.

### 11.2 Virtual threads

Loom introduced **virtual threads**: threads managed by the JVM, not by
the OS. A virtual thread is a tiny Java object (roughly a kilobyte of
initial footprint, growing as the stack grows) rather than a ~1 MB
OS thread. When a virtual thread blocks on I/O, the JVM **unmounts** it
from its underlying **carrier thread** (a platform thread in the JVM's
internal pool) and frees the carrier to run another virtual thread.

Virtual threads became a **preview** feature in Java 19, a **second
preview** in Java 20, and went **standard** in **Java 21**.

### 11.3 API

```java
// Start a virtual thread
Thread.ofVirtual().name("worker").start(() -> {
    System.out.println("running on " + Thread.currentThread());
});

// An executor where every task gets its own virtual thread
try (var executor = Executors.newVirtualThreadPerTaskExecutor()) {
    IntStream.range(0, 10_000).forEach(i -> {
        executor.submit(() -> {
            Thread.sleep(Duration.ofSeconds(1));
            return i;
        });
    });
} // the try-with-resources awaits completion
```

A virtual thread is a `java.lang.Thread`. Existing code that uses
`Thread`, `Runnable`, `ExecutorService`, and `ThreadLocal` keeps
working; you just create threads with `Thread.ofVirtual()` or use a
virtual-thread executor. Existing blocking APIs (sockets, file I/O,
JDBC, JDK HTTP client) are internally aware of virtual threads and
unmount correctly instead of tying down a carrier.

### 11.4 Continuations

Underneath, virtual threads are built on **delimited continuations** —
the JVM can snapshot a thread's Java stack into the heap and restore
it later on a different carrier. This is available as a hidden
`jdk.internal.vm.Continuation` API. It is not supposed to be used
directly, but it is how Loom does its magic.

### 11.5 Pinning

A virtual thread cannot always be unmounted. Historically, the main
cases were:

- blocking inside a `synchronized` block (the monitor is associated
  with the carrier thread),
- executing a native method (JNI) that blocks.

When pinning happens, the virtual thread occupies its carrier until it
unblocks, which defeats the scalability goal. As of **Java 21**, a
pinned virtual thread is reported by the JFR event
`jdk.VirtualThreadPinned`, and the recommended fix is to replace
`synchronized` with `ReentrantLock` for long-held locks. **JEP 491**,
targeted at a subsequent release [CHECK], proposes to remove the
`synchronized` pinning case by teaching monitors about virtual
threads.

### 11.6 Structured concurrency

Virtual threads make it cheap to spawn concurrent work, but they do
not answer the question of how to *manage* it. Structured concurrency
(JEP 428, incubator in Java 19, still incubating as of Java 21
[CHECK]) adds `StructuredTaskScope`:

```java
try (var scope = new StructuredTaskScope.ShutdownOnFailure()) {
    Subtask<User> user = scope.fork(() -> fetchUser(id));
    Subtask<Account> account = scope.fork(() -> fetchAccount(id));

    scope.join();            // wait for both
    scope.throwIfFailed();   // propagate the first failure

    return new Profile(user.get(), account.get());
}
```

If any subtask fails, the scope cancels the others. If the enclosing
thread is interrupted, the whole scope shuts down. The scope *cannot*
outlive its try-with-resources block, which is the structured part:
concurrent lifetimes nest exactly like method calls.

### 11.7 Scoped values

`ScopedValue<T>` (JEP 429, incubator) is an alternative to
`ThreadLocal` designed for virtual threads. Where ThreadLocal is
mutable and inherited by every child thread (or not, depending on
configuration), a scoped value is **immutable during its binding** and
only visible to code executed **within** a `ScopedValue.where(...).run(...)`
scope. This is cheaper in the age of millions of virtual threads,
where ThreadLocal's per-thread map is no longer free.

---

## 12. Performance topics

### 12.1 Warmup

A cold JVM is slow. Code runs in the interpreter, branches have no
profile data, classes are still being loaded, the code cache is empty.
Over seconds to minutes — depending on workload — the JIT kicks in,
inlining becomes monomorphic, and throughput climbs to steady state.
This is **warmup**, and it is the single most Java-specific aspect of
Java performance engineering.

Techniques to reduce or amortize warmup:

- **Class Data Sharing (CDS)** — package parsed class metadata into a
  shared archive reused across JVM invocations. Cuts startup time.
- **Application CDS (AppCDS)** — extend CDS to cover application
  classes, not just the platform.
- **AOT compilation** — precompile hot methods to native code so they
  start compiled. Experimental in Java 9 via `jaotc`, later removed,
  replaced by Project Leyden's AOT work.
- **CRaC (Coordinated Restore at Checkpoint)** — snapshot a warmed-up
  JVM to disk and restore it as a running process. Think CRIU for
  Java. Azul has shipped it; OpenJDK is working on it.
- **GraalVM Native Image** — skip warmup entirely by AOT compiling the
  whole app.
- **Project Leyden** — the umbrella effort to make Java startup and
  warmup a first-class tunable dimension. Proposes "condensers" that
  transform an application into a more eagerly-resolved form.

### 12.2 JMH — Java Microbenchmark Harness

You cannot benchmark the JVM with `System.nanoTime()` and a loop.
Dead-code elimination will delete your loop body, OSR will compile
partway through, the compiler will hoist invariants, and your numbers
will be meaningless. **JMH**, written by Aleksey Shipilev, exists
precisely to prevent this.

```java
@BenchmarkMode(Mode.AverageTime)
@OutputTimeUnit(TimeUnit.NANOSECONDS)
@Warmup(iterations = 5, time = 1)
@Measurement(iterations = 10, time = 1)
@Fork(3)
@State(Scope.Benchmark)
public class MyBench {
    private int[] data;

    @Setup public void setup() {
        data = new Random(42).ints(1_000_000).toArray();
    }

    @Benchmark public long sumLoop() {
        long s = 0;
        for (int v : data) s += v;
        return s;
    }

    @Benchmark public long sumStream() {
        return Arrays.stream(data).asLongStream().sum();
    }
}
```

JMH forks a fresh JVM per benchmark, burns warmup iterations until
the JIT stabilizes, uses `Blackhole.consume` to defeat dead-code
elimination, and reports statistics with error bars. Treating any
other benchmarking technique as authoritative on the JVM is
malpractice.

### 12.3 Profilers

- **JFR (Java Flight Recorder)** — a low-overhead event recorder built
  into HotSpot. Commercial in early Java versions, **open-sourced in
  Java 11**. Produces `.jfr` files consumable by **JDK Mission
  Control**. Sampling overhead is typically under 1%, making it safe
  for production.
- **async-profiler** — a sampling profiler using `AsyncGetCallTrace`
  that sidesteps the safepoint bias of simpler profilers. Essential
  for accurate flame graphs.
- **JProfiler, YourKit** — commercial, feature-rich, good UI.
- **VisualVM** — bundled with older JDKs, now separate. Decent for
  quick ad-hoc investigation.

### 12.4 False sharing and cache lines

When two threads update distinct variables that happen to share a
cache line, every write invalidates the other core's copy of the
line, and throughput collapses. Java 8 added `@Contended` (with an
unlock flag) for padding fields onto their own cache lines. It is
used internally in things like `LongAdder` cells.

### 12.5 "Java is slow"

It is worth naming this one directly: the claim that "Java is slow" is
mostly a relic of 1997, when applets were interpreted and AWT was
visibly sluggish. Modern HotSpot, on steady-state throughput
benchmarks, competes closely with C++ on most workloads and beats
unoptimized C++ on many. Where Java genuinely lags is:

- **startup and cold latency** — the warmup problem above.
- **memory footprint** — the runtime, the JIT, the code cache, class
  metadata.
- **scalar-only SIMD** — addressed by the Vector API.

None of these are language issues. They are runtime tradeoffs, and
Leyden, CRaC, Native Image, and the Vector API are actively closing
the remaining gaps.

### 12.6 Canonical reading

- Scott Oaks, *Java Performance: The Definitive Guide* (second edition
  covers Java 11).
- Ben Evans, James Gough, and Chris Newland, *Optimizing Java* (deep
  on JMH and the JIT).
- Aleksey Shipilev's blog and conference talks are the single best
  performance resource in the ecosystem.

---

## 13. The Foreign Function & Memory API (Project Panama)

JNI, Java's original native interop, has always been painful. Writing
glue code in C, managing `JNIEnv` pointers, translating exceptions,
pinning and releasing arrays — all of it was slow to write and slow
to run.

**Project Panama** replaces JNI with two related APIs:

- **Foreign Memory API** — `MemorySegment` represents a contiguous
  region of memory (heap, off-heap, or mapped file). `MemoryLayout`
  describes its structure (struct, array, sequence). Access is
  bounds-checked and the API is explicit about allocation lifetimes
  via `Arena`.
- **Foreign Function API** — `Linker.nativeLinker()` produces a
  `MethodHandle` for a native C function given its `SymbolLookup`
  location and descriptor. You invoke the MethodHandle like any other.

```java
try (Arena arena = Arena.ofConfined()) {
    Linker linker = Linker.nativeLinker();
    SymbolLookup libc = linker.defaultLookup();
    MethodHandle strlen = linker.downcallHandle(
        libc.find("strlen").orElseThrow(),
        FunctionDescriptor.of(ValueLayout.JAVA_LONG, ValueLayout.ADDRESS));

    MemorySegment cstr = arena.allocateUtf8String("hello, panama");
    long len = (long) strlen.invoke(cstr);
    System.out.println(len);
}
```

The **Foreign Function & Memory API** became a standard feature in
**Java 22** after several rounds of preview. Panama also ships a
**jextract** tool that reads a C header and generates idiomatic Java
bindings — no hand-written glue.

Panama matters because it reopens a class of problems the JVM had
been locked out of: high-performance native interop, hardware
acceleration, zero-copy file and network I/O, GPU programming from
Java without JNI contortions.

---

## 14. The Vector API

The **Vector API** expresses SIMD operations portably. You write code
against `IntVector`, `FloatVector`, etc.; at runtime the JIT lowers
them to the widest hardware vector instructions available — AVX-512
on x86, NEON or SVE on ARM. When no vector unit is available the API
falls back to scalar code.

```java
static final VectorSpecies<Float> SPECIES = FloatVector.SPECIES_PREFERRED;

static void daxpy(float a, float[] x, float[] y) {
    int i = 0;
    int upper = SPECIES.loopBound(x.length);
    for (; i < upper; i += SPECIES.length()) {
        var vx = FloatVector.fromArray(SPECIES, x, i);
        var vy = FloatVector.fromArray(SPECIES, y, i);
        vy.add(vx.mul(a)).intoArray(y, i);
    }
    // scalar tail
    for (; i < x.length; i++) y[i] += a * x[i];
}
```

The Vector API has been an **incubator** since Java 16, still an
incubator as of Java 24 [CHECK]. It is expected to stabilize once
Project Valhalla's value types land, because value types would let
vectors be treated as ordinary values without the boxing dance.

---

## 15. Observability

### 15.1 JFR

**Java Flight Recorder** is the observability feature to know. It is
an in-process event recording framework that produces binary `.jfr`
files. Events include GC pauses, allocation samples, lock contention,
method compilation, file and socket I/O, exceptions thrown, and
custom user events. Because events are written to a ring buffer with
minimal formatting, overhead is in the fractions of a percent.

```text
# Start the JVM with a continuous flight recording
java -XX:StartFlightRecording=filename=app.jfr,dumponexit=true,duration=5m MyApp

# Attach and dump from a running JVM
jcmd <pid> JFR.start name=myprofile duration=60s filename=snap.jfr
```

JFR files are consumed by **JDK Mission Control**, by
`jfr print`, and by tooling like the async-profiler converter.

### 15.2 JMX

**Java Management Extensions** expose MBeans (managed beans) over a
protocol. Every JVM ships a platform MXBean for the runtime, GC,
memory pools, threads, and class loading. Applications can register
their own MBeans for domain metrics. `jconsole`, `VisualVM`, and
`jmxterm` are the common clients.

JMX is older and clunkier than modern telemetry systems but remains
universally available, which is why it remains the backstop.

### 15.3 Command-line tools

- **`jcmd`** — a Swiss-army knife. Start JFR, trigger GCs, dump heaps,
  list threads, print VM flags. Most modern `j*` tools are aliases
  for `jcmd` subcommands.
- **`jstack`** — dump stack traces of every thread in a live JVM.
  First thing to run when a process is hung.
- **`jmap`** — heap dumps and histograms.
- **`jhsdb`** — the HotSpot Serviceability Agent; inspect a crashed
  core dump or a live process's internals.
- **`jinfo`** — print and set VM flags.

### 15.4 OpenTelemetry

The modern observability stack for Java is **OpenTelemetry**. The Java
agent (`opentelemetry-javaagent.jar`) attaches at startup, instruments
hundreds of libraries (Servlet, JDBC, Kafka, gRPC, HTTP clients),
and exports traces, metrics, and logs via OTLP. Combined with JFR for
runtime-level events, it gives a modern Java service the same depth of
observability that Go or Rust services get from their ecosystems —
often more, because the agent does its work without code changes.

---

## Closing notes

The JVM is a study in what a runtime can become when you give it
thirty years, hundreds of engineer-decades of investment, and a
mandate that existing code must keep working. Every feature in this
document coexists with every other: G1 and ZGC ship in the same
binary, virtual threads share a heap with platform threads, JIT
tiers hand code back and forth with the interpreter mid-execution,
and AOT compilation is now an option alongside all of it.

The Java language is conservative by design. The JVM is ambitious by
design. Taken together they make a specific bet: that the long-term
value of a stable contract between code and runtime compounds, and
that investing in the runtime side of that contract pays back for
decades. So far, the bet has held.

The next part of this series turns to what people actually build on
this stack: the JDK libraries, the frameworks that grew up around
them, the server-side ecosystem, and Java's role in the modern
enterprise.

---

## Study Guide — JVM & Concurrency

### Key concepts

1. **Virtual threads (JDK 21, GA in 25).** A managed lightweight
   thread backed by many platform threads. Scaling to millions.
2. **`CompletableFuture`** for async composition.
3. **`synchronized` is still a thing.** Legacy code uses it.
4. **`java.util.concurrent`** is the primary toolkit for new
   code: `Semaphore`, `CountDownLatch`, `BlockingQueue`,
   `ConcurrentHashMap`, `ReentrantLock`.
5. **Memory model.** `volatile`, `happens-before`, release/acquire.

---

## Programming Examples

### Example 1 — Virtual threads

```java
try (var executor = Executors.newVirtualThreadPerTaskExecutor()) {
    IntStream.range(0, 10_000).forEach(i ->
        executor.submit(() -> {
            Thread.sleep(Duration.ofSeconds(1));
            return i;
        }));
}
```

10,000 concurrent tasks on a laptop; in JDK 21+ this runs in
about 1 second.

### Example 2 — CompletableFuture pipeline

```java
CompletableFuture.supplyAsync(() -> fetch(url))
    .thenApply(this::parse)
    .thenAccept(System.out::println)
    .exceptionally(ex -> { ex.printStackTrace(); return null; });
```

---

## DIY & TRY

### DIY 1 — Port a thread pool to virtual threads

Take any Java service that uses `Executors.newFixedThreadPool`.
Switch to `newVirtualThreadPerTaskExecutor`. Measure latency
under load.

### DIY 2 — Run JFR

`java -XX:StartFlightRecording` + Mission Control. Profile a
real app.

### TRY — Benchmark Loom vs async Netty

Implement a simple HTTP echo service with both virtual
threads and Netty. Compare throughput and code clarity.

---

## Related College Departments

- [**coding**](../../../.college/departments/coding/DEPARTMENT.md)
- [**engineering**](../../../.college/departments/engineering/DEPARTMENT.md)
