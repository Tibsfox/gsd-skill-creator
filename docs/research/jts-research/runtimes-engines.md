# JavaScript Engines, Runtimes, and the Event Loop

> PNW Research Series -- JavaScript and TypeScript
> Deep-dive into the execution machinery that powers every `.js` and `.ts` file on the planet.

---

## 1. The Engine Landscape

A JavaScript engine is the program that parses, compiles, and executes JavaScript source code.
Every browser ships one; every server-side runtime embeds one.
The engine is distinct from the runtime: the engine handles the language semantics,
while the runtime provides host APIs (DOM, `fs`, `fetch`, timers) and the event loop.

### 1.1 V8 (Google)

- **Created:** 2008, led by Lars Bak (formerly Sun HotSpot JVM, Animorphic Smalltalk VM).
- **Written in:** C++.
- **Used by:** Google Chrome, Chromium, Node.js, Deno, Electron, Cloudflare Workers, Opera, Edge (post-2020).
- **License:** BSD.
- **Key innovation:** Demonstrated that JavaScript could be compiled to machine code competitive with statically-typed languages. V8 shipped with *no interpreter* in its first version -- it compiled JS directly to native code. The interpreter (Ignition) was added later as an optimization for startup and memory.

V8 dominates server-side JS entirely (Node, Deno, Workers) and holds roughly 65% of browser market share through Chromium-based browsers.

### 1.2 SpiderMonkey (Mozilla)

- **Created:** 1995, by Brendan Eich at Netscape. The *first* JavaScript engine ever built.
- **Written in:** C++ and Rust (increasing Rust components since 2020).
- **Used by:** Firefox, Gecko-based browsers, MongoDB (server-side JS evaluation).
- **License:** MPL 2.0.
- **Key innovation:** First engine to ship a JIT compiler (TraceMonkey, 2008). Pioneered trace compilation for dynamic languages. Firefox's `about:config` exposes hundreds of JS engine tuning knobs.

SpiderMonkey's browser share has declined with Firefox, but it remains the most important non-Chromium engine for web standards diversity.

### 1.3 JavaScriptCore / Nitro (Apple)

- **Created:** 2008 (as SquirrelFish/Nitro rewrite of KJS from KDE/KHTML).
- **Written in:** C++.
- **Used by:** Safari, WebKit-based browsers, Bun, React Native (iOS, pre-Hermes), PlayStation consoles.
- **License:** LGPL (as part of WebKit).
- **Key innovation:** Deeply optimized numeric pipelines. JSC's DFG and FTL tiers produce code competitive with V8 TurboFan for numeric workloads. Apple's tight hardware-software integration allows JSC to exploit Apple Silicon features directly.

JSC gained renewed relevance when Jarred Sumner chose it over V8 for Bun, citing its faster startup time and lower memory overhead.

### 1.4 Chakra / ChakraCore (Microsoft)

- **Created:** 2011 for Internet Explorer 9, open-sourced as ChakraCore in 2016.
- **Written in:** C++.
- **Used by:** IE9-11, Edge (pre-Chromium, 2015-2020), Node-ChakraCore (experimental).
- **Status:** Discontinued. Microsoft switched Edge to Chromium/V8 in January 2020.
- **Key innovation:** Background JIT compilation on a dedicated thread, keeping the main thread free. Time-travel debugging. ChakraCore briefly supported Node.js as an alternative backend, proving the engine/runtime separation was real.

ChakraCore's GitHub repository is archived. No active development.

### 1.5 Hermes (Meta)

- **Created:** 2019 by Meta (Facebook) for React Native.
- **Written in:** C++.
- **Used by:** React Native (default engine since RN 0.70), Expo.
- **License:** MIT.
- **Key innovation:** Ahead-of-time bytecode compilation. Hermes compiles JS to bytecode at *build time*, not at runtime. This eliminates JIT warmup entirely, producing near-instant startup on mobile devices. Hermes intentionally omits a JIT compiler -- the AOT bytecode is the final form.

### 1.6 QuickJS (Fabrice Bellard)

- **Created:** 2019 by Fabrice Bellard (also created QEMU, FFmpeg, TCC, JSLinux).
- **Written in:** C (two files: `quickjs.c` and `quickjs-libc.c`).
- **Used by:** Embedded systems, txiki.js runtime, llrt (AWS Lambda lightweight runtime).
- **License:** MIT.
- **Key innovation:** A complete ES2023 engine in ~80,000 lines of C with no dependencies. Compiles to under 700KB. Passes nearly 100% of Test262. Supports `BigInt`, `Proxy`, `async`/`await`, modules, and generators. Bellard also wrote a JS-to-C compiler (`qjsc`) that produces standalone executables.

```bash
# QuickJS: compile JS to a standalone binary
qjsc -o hello hello.js
./hello
# Output: Hello, world!

# Run JS interactively
qjs
> 2n ** 128n
340282366920938463463374607431768211456n
```

### 1.7 Other Notable Engines

| Engine | Creator | Use Case |
|--------|---------|----------|
| **Duktape** | Sami Vaarala | Embedded C, IoT |
| **MuJS** | Artifex | PDF viewers (MuPDF) |
| **Boa** | Rust community | Rust-native ES engine |
| **engine262** | TC39 | Reference implementation of the spec |
| **GraalJS** | Oracle | Polyglot VM (GraalVM), Java interop |
| **LibJS** | SerenityOS | From-scratch browser engine |

---

## 2. V8 Internals

V8 is the most widely deployed JS engine. Understanding its internals is essential for writing performant JavaScript.

### 2.1 History and Team

Lars Bak joined Google in 2006 to build V8. His team included:
- **Kasper Lund** -- co-architect, later co-created Dart and Toit.
- **Mads Ager** -- garbage collector design.
- **Erik Corry** -- optimizing compiler.

Bak's background was critical: he had built the Self VM (Sun, 1990s), the Animorphic Smalltalk VM, and contributed to HotSpot JVM. V8's hidden classes and inline caches are direct descendants of Self's "maps" and PICs (polymorphic inline caches), published by Chambers, Ungar, and Lee in 1989.

### 2.2 Tiered Compilation Pipeline

V8 uses a four-tier compilation pipeline (as of 2024):

```
Source Code
    |
    v
  Parser ──> AST ──> Bytecode (Ignition)
                          |
                          v
                      Sparkplug (baseline, non-optimizing)
                          |
                          v
                       Maglev (mid-tier optimizing)
                          |
                          v
                      TurboFan (top-tier optimizing)
```

**Tier 0 -- Ignition (interpreter, 2016)**
- Walks the AST, emits compact bytecode.
- Register-based VM (not stack-based).
- Collects type feedback in "feedback vectors" -- records what types each operation actually sees at runtime.
- Very fast startup, low memory.

**Tier 1 -- Sparkplug (baseline compiler, 2021)**
- Non-optimizing compiler that translates Ignition bytecode directly to machine code.
- No intermediate representation. One-pass, linear walk.
- No register allocation -- uses a fixed calling convention.
- ~10x faster execution than Ignition, minimal compilation cost.
- Fills the gap between interpreter and optimizing compiler.

**Tier 2 -- Maglev (mid-tier compiler, 2023)**
- SSA-based optimizing compiler, but with a much faster compilation time than TurboFan.
- Uses the type feedback collected by Ignition/Sparkplug.
- Performs inlining, escape analysis, and basic loop optimizations.
- Designed to catch the "90% case" -- most hot functions never need TurboFan.
- Compilation time: ~10x faster than TurboFan.

**Tier 3 -- TurboFan (top-tier optimizing compiler, 2015)**
- Full optimizing compiler with a "sea of nodes" IR.
- Aggressive speculative optimizations based on type feedback.
- Inlining, escape analysis, loop peeling, bounds check elimination, load elimination, dead code elimination, constant folding, strength reduction.
- Generates highly optimized machine code for x64, ARM64, ARM32, MIPS, s390x, PPC, RISC-V, LoongArch.
- **Deoptimization:** If a speculative assumption is violated (e.g., a function that always received integers suddenly gets a string), TurboFan "deoptimizes" -- discards the optimized code and falls back to Ignition bytecode. This is called an "eager deopt" or "lazy deopt" depending on when it triggers.

```bash
# Trace V8 compilation tiers
node --trace-opt --trace-deopt app.js

# Print generated bytecode
node --print-bytecode app.js

# Print optimized assembly
node --print-opt-code --code-comments app.js

# Trace which tier compiled each function
node --trace-turbo app.js  # generates JSON for turbolizer
```

### 2.3 Hidden Classes (Shapes / Maps)

V8 assigns every object a "hidden class" (internally called a "Map" in V8 source, or "Shape" in academic literature). Objects with the same property names added in the same order share the same hidden class, enabling:

1. **Fixed-offset property access** -- properties are at known offsets, like C struct fields.
2. **Inline cache hits** -- monomorphic access sites load properties in a single instruction.

```javascript
// GOOD: Both objects get the same hidden class
function Point(x, y) {
  this.x = x;  // Transition: Map0 -> Map1
  this.y = y;  // Transition: Map1 -> Map2
}
const a = new Point(1, 2);  // Map2
const b = new Point(3, 4);  // Map2 (same!)

// BAD: Different property order = different hidden classes
const c = { x: 1, y: 2 };  // Map_A
const d = { y: 2, x: 1 };  // Map_B (different!)
```

Hidden class transitions form a tree. Adding a property creates a transition edge to a new hidden class. Deleting a property with `delete` forces the object to a "slow mode" dictionary representation -- avoid `delete` in hot paths.

### 2.4 Inline Caches (ICs)

Every property access, function call, and arithmetic operation site has an associated inline cache:

- **Monomorphic:** One hidden class seen. Fastest path. Single comparison + direct load.
- **Polymorphic:** 2-4 hidden classes seen. Linear scan of a small cache. Still fast.
- **Megamorphic:** 5+ hidden classes. Falls back to a generic hash-table lookup. Slow.

```javascript
// Monomorphic -- fast
function getX(p) { return p.x; }
getX(new Point(1, 2));  // IC records Map2
getX(new Point(3, 4));  // IC hit! Same Map2

// Megamorphic -- slow
function getValue(obj) { return obj.value; }
getValue({ value: 1 });            // Map_A
getValue({ value: 2, extra: 3 });  // Map_B
getValue({ a: 1, value: 2 });      // Map_C
getValue({ value: 2, b: 3 });      // Map_D
getValue({ value: 2, c: 3 });      // Map_E -> megamorphic!
```

### 2.5 Orinoco Garbage Collector

V8's garbage collector is called Orinoco (named after the Venezuelan river). It uses a generational, concurrent, incremental design:

**Young Generation (Scavenger / Minor GC)**
- Semi-space copying collector.
- Two equally-sized spaces: "from-space" and "to-space" (default: 1-8 MB each, scales with heap).
- Allocation is a pointer bump in from-space (extremely fast).
- When from-space fills, live objects are copied to to-space. Spaces swap roles.
- Objects surviving two scavenges are "tenured" (promoted to old generation).
- **Parallel scavenge:** Multiple threads trace and copy simultaneously.

**Old Generation (Mark-Compact / Major GC)**
- Mark phase: Traces all reachable objects from roots. Concurrent with JS execution (tri-color marking: white=unreached, grey=reached-not-scanned, black=scanned).
- Sweep phase: Reclaims unmarked (white) objects.
- Compact phase: Moves surviving objects to eliminate fragmentation.
- **Incremental marking:** Interleaves small marking steps with JS execution to avoid long pauses.
- **Concurrent marking:** Marking happens on background threads while JS runs on the main thread. Write barriers track mutations.

**Pointer Compression (2020)**
- On 64-bit platforms, V8 compresses heap pointers from 8 bytes to 4 bytes.
- Uses a "cage" -- a 4 GB virtual address region. All heap objects live within this cage.
- Pointers are stored as 32-bit offsets from the cage base.
- Reduces heap memory by ~40% for pointer-heavy workloads.
- Enabled by default in Chrome and Node.js since V8 8.0.

```bash
# Trace GC activity
node --trace-gc app.js

# Detailed GC statistics
node --trace-gc-verbose app.js

# Set heap limits
node --max-old-space-size=4096 app.js   # 4 GB old space
node --max-semi-space-size=64 app.js     # 64 MB semi-space
```

---

## 3. SpiderMonkey Internals

### 3.1 Origins

Brendan Eich wrote the first JavaScript interpreter in 10 days in May 1995 at Netscape.
The language was originally called Mocha, then LiveScript, then JavaScript (a marketing decision to ride Java's hype).
SpiderMonkey was the C implementation that shipped in Netscape Navigator 2.0.

### 3.2 JIT Compiler Evolution

SpiderMonkey has undergone more JIT rewrites than any other engine:

| Year | JIT | Architecture | Notes |
|------|-----|-------------|-------|
| 2008 | **TraceMonkey** | Trace-based | First browser JIT. Recorded "traces" (hot paths through loops). Abandoned because branchy code caused trace explosion. |
| 2010 | **JaegerMonkey** | Method-based | Traditional method JIT. Worked alongside TraceMonkey briefly. |
| 2013 | **IonMonkey** | SSA optimizing | Full optimizing compiler with type inference (TI). Produced excellent code but TI had high memory cost and complexity. |
| 2020 | **Warp** | SSA optimizing | Replaced IonMonkey's type inference with CacheIR, a simpler system that reuses inline cache data. Faster compilation, lower memory, more maintainable. |

The current pipeline (2024):
```
Source -> Parser -> Bytecode -> Baseline Interpreter
                                     |
                                     v
                               Baseline JIT (IC stubs)
                                     |
                                     v
                                Warp (optimizing)
```

**Baseline Interpreter:** Executes bytecode, collects IC (inline cache) data via CacheIR.

**Baseline JIT:** Compiles bytecode to machine code with IC stubs. Each IC stub is a small piece of generated code specialized for the types actually observed.

**Warp:** Takes the CacheIR data from Baseline and uses it to generate optimized code. This is the key insight -- rather than maintaining a separate type inference system, Warp piggybacks on the IC infrastructure that already exists.

### 3.3 Generational GC

SpiderMonkey uses a generational collector similar to V8:

- **Nursery (young generation):** Bump-pointer allocation, minor GC copies survivors to tenured heap. Default nursery size: 16 MB.
- **Tenured heap:** Mark-and-sweep with compaction. Incremental marking (interleaved with JS). Supports both sweeping and compacting.
- **Compacting GC:** Moves objects to reduce fragmentation. Triggered heuristically or under memory pressure.
- Since 2023, SpiderMonkey has been integrating more Rust components for memory safety in GC code.

---

## 4. JavaScriptCore (JSC) Internals

### 4.1 Four-Tier Pipeline

JSC has the most granular tiered compilation of any production engine:

```
Source -> Parser -> Bytecode
                      |
                      v
                 LLInt (Low-Level Interpreter)
                      |
                      v
                 Baseline JIT
                      |
                      v
                  DFG JIT (Data Flow Graph)
                      |
                      v
                  FTL JIT (Faster Than Light)
                      |
                      v
                   B3 Backend
```

**LLInt (Low-Level Interpreter)**
- Written in a custom "offlineasm" DSL that generates platform-specific assembly.
- Extremely low startup cost. Begins executing immediately.
- Collects profiling data for tier-up decisions.

**Baseline JIT**
- Simple template JIT. Each bytecode instruction maps to a fixed code template.
- No optimization, but much faster than interpretation.
- Functions tier up to Baseline after ~100 executions.

**DFG JIT (Data Flow Graph)**
- SSA-based optimizing compiler.
- Uses profiling data from LLInt and Baseline to speculate on types.
- Performs type check hoisting, CSE, DCE, strength reduction, inlining.
- Tier-up threshold: ~1,000 executions or ~25 loop iterations.
- Compilation is fast enough to run on the main thread.

**FTL JIT (Faster Than Light) + B3 Backend**
- Apple's top-tier compiler. Originally used LLVM as its backend (2014), switched to B3 (Bare Bones Backend) in 2016 for faster compilation.
- B3 is a custom compiler backend (like a lightweight LLVM) written specifically for JSC.
- Aggressive optimizations: full escape analysis, LICM, partial redundancy elimination, object allocation sinking.
- Tier-up threshold: ~100,000 executions.
- JSC's FTL produces the fastest numeric code of any JS engine on Apple Silicon, leveraging knowledge of the hardware's execution units.

### 4.2 Numeric Optimization

JSC is notably strong at numeric workloads because:

1. **Unboxed integers:** JSC stores small integers (up to 2^53) directly in pointer-sized values without heap allocation, using NaN-boxing (encoding values in the NaN payload space of IEEE 754 doubles).
2. **Typed array optimization:** JSC's DFG and FTL can reason about typed array access patterns and eliminate bounds checks.
3. **SIMD-aware code generation:** On Apple Silicon, FTL/B3 can emit NEON SIMD instructions for certain patterns.

### 4.3 JSC and Bun

Bun chose JSC over V8 for several reasons stated by Jarred Sumner:
- **Faster startup:** JSC's LLInt begins executing faster than V8's Ignition.
- **Lower memory:** JSC's tiering system uses less memory per isolate.
- **Better C API:** JSC's C API (from WebKit) is more ergonomic than V8's C++ API.
- **Faster GC for short-lived processes:** JSC's nursery collector is tuned for quick allocation-heavy workloads (common in CLI tools and build scripts).

---

## 5. Hermes: AOT for Mobile

### 5.1 Design Philosophy

Hermes solves a specific problem: React Native apps on low-end Android devices had multi-second startup times because V8/JSC had to parse and compile JS bundles on every launch.

Hermes's solution: **move compilation to build time.**

```
Build Time                          Runtime
---------                          -------
JS Source -> Hermes Compiler ->    Hermes VM executes
             Bytecode (.hbc)       bytecode directly

No parsing. No JIT warmup. Instant startup.
```

### 5.2 Key Characteristics

- **No JIT compiler.** The bytecode is the final form. This simplifies the runtime, reduces memory, and avoids JIT-related security issues (no writable+executable memory pages).
- **Optimizing bytecode compiler.** The build-time compiler performs register allocation, constant folding, dead code elimination, and other optimizations on the bytecode.
- **Lazy compilation.** Functions are compiled to bytecode lazily -- only when first referenced. Reduces initial bytecode size.
- **ES6+ support.** Hermes supports classes, arrow functions, destructuring, async/await, generators, for-of, template literals, and Proxy (added in Hermes 0.12).
- **Garbage collector.** GenGC -- generational, moving collector with a young generation (semi-space copying) and an old generation (mark-compact).

```bash
# Compile JS to Hermes bytecode
hermes -emit-binary -out app.hbc app.js

# Disassemble bytecode
hermes -dump-bytecode app.hbc

# Run bytecode
hermes app.hbc
```

### 5.3 Static Hermes (Experimental, 2023)

Meta announced "Static Hermes" -- a version that uses TypeScript/Flow type annotations to generate optimized native code (not bytecode). This would make Hermes an AOT native compiler for typed JavaScript, similar to how GraalVM's native-image works for Java. As of 2025, Static Hermes remains experimental.

---

## 6. Node.js

### 6.1 Origins

Ryan Dahl presented Node.js at JSConf EU in November 2009. The core insight: JavaScript's single-threaded, event-driven model is naturally suited to I/O-bound server workloads. Instead of the Apache model (one thread per connection, blocking I/O), Node uses a single thread with non-blocking I/O and an event loop.

Dahl chose V8 because it was the fastest engine available and had a clean embedding API.

### 6.2 Architecture

```
         Node.js
    +-----------------+
    |   JS (your app) |
    +-----------------+
    |    Node.js API  |  <- fs, http, net, crypto, etc.
    +-----------------+
    |    C++ Bindings  |  <- node_file.cc, node_http_parser.cc
    +---------+-------+
    |   V8    | libuv  |  <- JS engine | event loop + async I/O
    +---------+-------+
    | OpenSSL | c-ares |  <- TLS       | DNS
    +---------+-------+
    |  zlib   | llhttp |  <- compression | HTTP parsing
    +---------+-------+
```

### 6.3 Version History (Major Milestones)

| Version | Date | Significance |
|---------|------|-------------|
| 0.1.0 | 2009-05 | Initial release |
| 0.6.0 | 2011-11 | Windows support (via libuv) |
| 0.12.0 | 2015-02 | Last Joyent-era release |
| 4.0.0 | 2015-09 | io.js merge, LTS begins, Semver adopted |
| 6.0.0 | 2016-04 | ES6 modules (behind flag), V8 5.0 |
| 8.0.0 | 2017-05 | async/await unflagged, N-API |
| 10.0.0 | 2018-04 | `fs.promises`, HTTP/2 stable |
| 12.0.0 | 2019-04 | TLS 1.3, `worker_threads` stable |
| 14.0.0 | 2020-04 | Optional chaining, `?.` and `??` |
| 16.0.0 | 2021-04 | `timers/promises`, Apple Silicon |
| 18.0.0 | 2022-04 | `fetch()` (experimental), test runner, `--watch` |
| 20.0.0 | 2023-04 | Stable test runner, `import.meta.resolve`, V8 11.3 |
| 22.0.0 | 2024-04 | `require()` for ESM (experimental), `--run` flag, Maglev |
| 24.0.0 | 2025-05 | URLPattern, `node --env-file-if-exists` |

### 6.4 ESM Support

Node's transition from CommonJS (`require`) to ES Modules (`import`) was the longest-running saga in the Node ecosystem:

- **2015:** ES2015 specifies `import`/`export`. Node has no support.
- **2017:** `--experimental-modules` flag appears. `.mjs` extension required.
- **2019:** Node 12 ships unflagged ESM support but with many rough edges.
- **2020:** Node 14 stabilizes ESM. Dual CJS/ESM packages via `"exports"` in `package.json`.
- **2023:** Node 20 adds `import.meta.resolve()`.
- **2024:** Node 22 experiments with `require()` loading ESM modules, potentially ending the schism.

```bash
# Run ESM
node --input-type=module -e "import { readFile } from 'fs/promises'; console.log('ESM works')"

# Package.json for ESM
# { "type": "module" }

# Dual package with exports map
# {
#   "exports": {
#     "import": "./dist/index.mjs",
#     "require": "./dist/index.cjs"
#   }
# }
```

### 6.5 npm

npm (Node Package Manager) was created by Isaac Schlueter in 2010. npm Inc was acquired by GitHub (Microsoft) in 2020. The npm registry is the largest software registry in the world:

- **2.5+ million packages** (as of 2025).
- **~30 billion downloads per week.**
- Registry at `registry.npmjs.org`.

```bash
# npm version history
npm -v                     # Current version
npm init -y                # Create package.json
npm install express        # Add dependency
npm ci                     # Clean install from lockfile (CI use)
npm audit                  # Check for known vulnerabilities
npm exec -- tsc --init     # Run package binary (npx equivalent)
```

---

## 7. The Node.js Event Loop

### 7.1 Overview

The event loop is the mechanism that allows Node.js to perform non-blocking I/O despite JavaScript being single-threaded. It continuously checks for pending work and dispatches callbacks.

### 7.2 Phase Diagram

```
   ┌───────────────────────────────────────────┐
   │                                           │
   │            ┌──────────────┐               │
   │  ┌────────>│   timers     │  setTimeout   │
   │  │         │  setInterval │  callbacks    │
   │  │         └──────┬───────┘               │
   │  │                │                       │
   │  │         ┌──────┴───────┐               │
   │  │         │   pending    │  I/O error    │
   │  │         │  callbacks   │  callbacks    │
   │  │         └──────┬───────┘               │
   │  │                │                       │
   │  │         ┌──────┴───────┐               │
   │  │         │   idle /     │  internal     │
   │  │         │   prepare    │  use only     │
   │  │         └──────┬───────┘               │
   │  │                │                       │
   │  │         ┌──────┴───────┐  incoming     │
   │  │         │              │  connections  │
   │  │         │    poll      │  data, etc.   │
   │  │         │              │               │
   │  │         └──────┬───────┘               │
   │  │                │                       │
   │  │         ┌──────┴───────┐               │
   │  │         │    check     │  setImmediate │
   │  │         │              │  callbacks    │
   │  │         └──────┬───────┘               │
   │  │                │                       │
   │  │         ┌──────┴───────┐               │
   │  │         │    close     │  socket.on    │
   │  └─────────┤  callbacks   │  ('close')    │
   │            └──────────────┘               │
   │                                           │
   │  ┌─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┐  │
   │    BETWEEN EACH PHASE:                    │
   │  │ 1. process.nextTick queue (drained)  │  │
   │    2. microtask queue    (drained)        │
   │  │    (Promise .then/.catch/.finally)   │  │
   │  └─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┘  │
   └───────────────────────────────────────────┘
```

### 7.3 Phase Details

**1. Timers Phase**
Executes callbacks scheduled by `setTimeout()` and `setInterval()`. A timer specifies a *minimum* delay, not an exact delay. The actual execution time depends on when the event loop reaches the timers phase and how many callbacks are ahead in the queue.

**2. Pending Callbacks Phase**
Executes I/O callbacks deferred from the previous loop iteration. These are system-level callbacks like TCP `ECONNREFUSED` errors.

**3. Idle / Prepare Phase**
Internal use only. Used by libuv for housekeeping. Not accessible from JS.

**4. Poll Phase**
The most important phase. Two responsibilities:
- Calculate how long it should block and wait for I/O.
- Process events in the poll queue (completed I/O callbacks).

If the poll queue is empty:
- If `setImmediate()` callbacks are scheduled, end poll and move to check phase.
- If no `setImmediate()`, wait for callbacks to be added to the poll queue, then execute them immediately.
- If timers are scheduled, wrap around to the timers phase when the nearest timer threshold is reached.

**5. Check Phase**
Executes `setImmediate()` callbacks. `setImmediate()` is guaranteed to run after the poll phase completes, making it useful for breaking up long operations.

**6. Close Callbacks Phase**
Executes close callbacks, e.g., `socket.on('close', ...)`. If a socket or handle is closed abruptly (`socket.destroy()`), the `'close'` event is emitted here.

### 7.4 Microtasks and process.nextTick

Between every phase transition, Node drains two queues:

1. **`process.nextTick()` queue** -- drained first, completely, before any microtasks.
2. **Microtask queue** -- Promise `.then()`/`.catch()`/`.finally()` callbacks and `queueMicrotask()` callbacks.

```javascript
// Execution order demonstration
setTimeout(() => console.log('1: setTimeout'), 0);
setImmediate(() => console.log('2: setImmediate'));

process.nextTick(() => console.log('3: nextTick'));
Promise.resolve().then(() => console.log('4: Promise'));

queueMicrotask(() => console.log('5: queueMicrotask'));

// Output:
// 3: nextTick
// 4: Promise
// 5: queueMicrotask
// 1: setTimeout      (order of 1 and 2 is non-deterministic
// 2: setImmediate     when called from the main module)
```

**Warning:** Recursive `process.nextTick()` calls can starve the event loop because the nextTick queue is drained completely before moving on. This is called "nextTick starvation."

```javascript
// BAD: This starves the event loop forever
function recurse() {
  process.nextTick(recurse);
}
recurse();
// setTimeout, setImmediate, I/O -- none of these will ever fire.

// BETTER: Use setImmediate for recursive async work
function recurse() {
  setImmediate(recurse);
}
```

---

## 8. libuv

### 8.1 Origins

libuv was created by Ben Noordhuis and Bert Belder in 2011 to provide Node.js with a cross-platform async I/O library. Before libuv, Node used libev (Linux-only) and had no Windows support. libuv abstracted the platform differences:

| Platform | I/O Mechanism | Notes |
|----------|-------------- |-------|
| Linux | `epoll` | O(1) event notification, added in Linux 2.5.44 (2002) |
| macOS/BSD | `kqueue` | O(1), superior to poll/select, BSD-originated |
| Windows | IOCP | I/O Completion Ports, proactor model (vs reactor) |
| SunOS | event ports | Solaris/illumos native mechanism |

### 8.2 Thread Pool

libuv maintains a thread pool for operations that cannot be performed asynchronously at the OS level:

- **File system operations** (`fs.readFile`, `fs.stat`, etc.) -- most OS kernels do not provide true async file I/O (Linux's `io_uring` is an exception, and libuv has experimental support).
- **DNS lookups** (`dns.lookup()` uses `getaddrinfo`, which is blocking).
- **Cryptographic operations** (some `crypto` functions).
- **Compression** (`zlib`).
- **User code** via `napi_create_async_work`.

```bash
# Default thread pool size
echo $UV_THREADPOOL_SIZE   # undefined = 4 threads

# Increase thread pool (max 1024)
UV_THREADPOOL_SIZE=16 node app.js

# Or set in code (must be before any async operations)
# process.env.UV_THREADPOOL_SIZE = '16';
```

**Important:** The thread pool is shared across all async operations that need it. If you have 4 threads (default) and fire 100 `fs.readFile()` calls simultaneously, only 4 execute in parallel. The rest queue. This is why increasing `UV_THREADPOOL_SIZE` matters for I/O-heavy workloads.

### 8.3 libuv Beyond Node

libuv is used by many projects beyond Node.js:
- **Julia** (programming language)
- **Luvit** (Lua + libuv)
- **MagicOnion** (.NET)
- **cmake** (for async subprocess handling)
- **Neovim** (for its event loop)

---

## 9. Deno

### 9.1 Origins: "10 Things I Regret About Node.js"

At JSConf EU 2018, Ryan Dahl gave a talk titled "10 Things I Regret About Node.js." His regrets:

1. **Not sticking with Promises.** Node added Promises in 2009, removed them, and spent a decade on callbacks.
2. **Security.** Node has full system access by default. A linter dependency can read your SSH keys.
3. **The build system (GYP).** Node uses GYP for native addons, a system even Google abandoned.
4. **`package.json`.** Centralized metadata became a mandatory artifact. NPM is a centralized registry.
5. **`node_modules`.** Deeply nested, massive, non-portable directory. "The heaviest object in the universe."
6. **`require()` without extensions.** Ambiguous resolution: is `require('foo')` a file, directory, or package?
7. **`index.js`.** Implicit directory entry points add complexity to the module resolver.
8. **No `.js` extension in imports.** Breaks browser compatibility.
9. **`window` object.** Not matching browser globals.
10. **Not using enough async iterators/streams primitives.** The streams API is over-engineered.

Dahl then announced **Deno** -- a new runtime that addresses all of these.

### 9.2 Architecture

```
       Deno
  +------------------+
  |  TypeScript/JS   |
  +------------------+
  |  Web Platform    |  <- fetch, WebSocket, crypto.subtle,
  |  APIs            |     Web Workers, Streams API
  +------------------+
  |  Deno namespace  |  <- Deno.readFile, Deno.serve, Deno.Command
  +------------------+
  |  Rust Core       |  <- tokio (async runtime), rustls (TLS)
  +------+----------+
  |  V8  | rusty_v8  |  <- V8 bindings for Rust
  +------+-----------+
```

- **Runtime language:** Rust (not C++ like Node).
- **Async runtime:** tokio (Rust's dominant async framework) instead of libuv.
- **TLS:** rustls (Rust-native) instead of OpenSSL.
- **HTTP parser:** hyper (Rust) instead of llhttp.

### 9.3 Key Features

**Permissions Model**
```bash
# No permissions -- can't read files, network, or env
deno run app.ts

# Grant specific permissions
deno run --allow-net=api.example.com --allow-read=./data app.ts

# Grant all (defeats the purpose, but useful in development)
deno run --allow-all app.ts

# Permission groups
deno run --allow-net --allow-read --deny-write app.ts
```

**TypeScript-First**
Deno compiles TypeScript internally using a combination of `swc` (Rust-based transpiler for type stripping) and `tsc` (for type checking). No `tsconfig.json` or build step needed.

```bash
# Just run TypeScript directly
deno run server.ts

# Type-check without running
deno check server.ts
```

**URL Imports**
```typescript
// No package.json, no node_modules
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

// npm compatibility (added in Deno 1.28)
import express from "npm:express@4";
```

**Built-in Tooling**
```bash
deno fmt              # Formatter (dprint-based)
deno lint             # Linter (custom, fast)
deno test             # Test runner
deno bench            # Benchmarking
deno doc              # Documentation generator
deno compile          # Compile to standalone executable
deno jupyter          # Jupyter kernel
deno coverage         # Code coverage
deno publish          # Publish to JSR (JavaScript Registry)
```

### 9.4 Deno KV and Deno Deploy

**Deno KV** is a built-in key-value database:
```typescript
const kv = await Deno.openKv();         // Local: SQLite-backed
await kv.set(["users", "alice"], { name: "Alice", age: 30 });
const result = await kv.get(["users", "alice"]);
// Deployed on Deno Deploy: FoundationDB-backed, globally replicated
```

**Deno Deploy** is Deno's edge hosting platform:
- V8 Isolates on 35+ global PoPs.
- Sub-millisecond cold starts.
- Integrated with Deno KV for edge-local state.
- Git-push deployment.

---

## 10. Bun

### 10.1 Origins

Bun was created by Jarred Sumner and released publicly in July 2022. Sumner's thesis: the JavaScript ecosystem's tooling (bundlers, transpilers, test runners, package managers) is too fragmented and too slow because each tool reimplements parsing, resolution, and compilation from scratch.

Bun unifies all these tools into a single binary, written in Zig and C++ for maximum performance.

### 10.2 Architecture

```
         Bun
  +------------------+
  |   JS/TS/JSX/TSX  |
  +------------------+
  |   Node.js compat |  <- fs, path, http, crypto (re-implemented)
  |   layer          |     ~90% of Node.js API coverage
  +------------------+
  |   Bun APIs       |  <- Bun.serve, Bun.file, Bun.write, Bun.sql
  +------------------+
  |   Zig runtime    |  <- Memory allocator, I/O, HTTP server
  +------+-----------+
  |  JSC  | boringssl |  <- JavaScriptCore | TLS
  +------+-----------+
```

### 10.3 Key Features

**Speed**
Bun's headline numbers (from official benchmarks, grain-of-salt applies):
- `bun install` -- 25x faster than `npm install` for cached installs.
- `bun run` -- starts ~4x faster than `node` for TypeScript files.
- `bun test` -- ~20x faster than Jest for typical test suites.
- HTTP server (`Bun.serve`) -- higher req/s than Node's `http` module in synthetic benchmarks.

**Drop-in Node.js Compatibility**
```bash
# Run Node.js projects directly
bun run index.ts          # TypeScript, JSX, TSX -- no config needed
bun run index.js          # CommonJS or ESM, auto-detected

# Package management (npm-compatible)
bun install               # Reads package.json, writes bun.lockb (binary lockfile)
bun add express           # Add dependency
bun remove lodash         # Remove dependency

# Built-in test runner (Jest-compatible API)
bun test                  # Runs *.test.ts, *.spec.ts, etc.

# Built-in bundler
bun build ./src/index.ts --outdir ./dist --target browser
```

**Native APIs**
```typescript
// Ultra-fast HTTP server
Bun.serve({
  port: 3000,
  fetch(req) {
    return new Response("Hello from Bun!");
  },
});

// File I/O (10x faster than Node fs)
const file = Bun.file("./data.json");
const contents = await file.json();
await Bun.write("./output.txt", "data");

// SQLite (built-in, no npm package needed)
import { Database } from "bun:sqlite";
const db = new Database("mydb.sqlite");
db.run("CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY, name TEXT)");

// Shell (built-in, tagged template)
import { $ } from "bun";
const result = await $`ls -la`.text();
```

### 10.4 Why Zig?

Sumner chose Zig (not Rust, not C++) for several reasons:
1. **No hidden control flow.** Zig has no operator overloading, no hidden allocations, no RAII. Every allocation is explicit.
2. **C interop without FFI.** Zig can directly `@cImport` C headers. JSC's C API is called without any bridging layer.
3. **Comptime.** Zig's compile-time execution enables code generation without macros.
4. **Manual memory management.** For a runtime that needs to minimize GC pressure, manual control matters.
5. **Small binary.** Bun ships as a single ~100 MB binary.

---

## 11. Edge Runtimes

### 11.1 Cloudflare Workers and V8 Isolates

Cloudflare Workers (launched 2017) pioneered the "V8 Isolate" model for serverless:

Instead of spinning up a container or VM per function invocation, Workers run thousands of tenants in the same process, each in a separate V8 Isolate. An Isolate is V8's sandbox boundary -- separate heap, separate code, separate globals -- but sharing the same process and compiled code caches.

```
Traditional Serverless          V8 Isolate Model
+-------+  +-------+           +--------------------+
| VM/   |  | VM/   |           | Process            |
| Cont. |  | Cont. |           |  +----+  +----+    |
| +---+ |  | +---+ |           |  | Is |  | Is |    |
| | fn| |  | | fn| |           |  +----+  +----+    |
| +---+ |  | +---+ |           |  +----+  +----+    |
+-------+  +-------+           |  | Is |  | Is |    |
                                |  +----+  +----+    |
Cold start: 200-1000ms         +--------------------+
                                Cold start: <5ms
```

**workerd** -- Cloudflare open-sourced their Workers runtime as "workerd" in 2022.

```bash
# workerd: Cloudflare's open-source edge runtime
# Install
npm install -g workerd

# Run locally
workerd serve config.capnp
```

### 11.2 WinterCG (Web-Interoperable Runtimes Community Group)

WinterCG was formed in 2022 by Cloudflare, Deno, Vercel, Shopify, and Node.js contributors to standardize a minimum set of Web Platform APIs that all server-side JS runtimes should support:

- `fetch()`, `Request`, `Response`, `Headers`
- `URL`, `URLSearchParams`, `URLPattern`
- `TextEncoder`, `TextDecoder`
- `crypto.subtle` (Web Crypto API)
- `structuredClone`
- `AbortController`, `AbortSignal`
- `ReadableStream`, `WritableStream`, `TransformStream`
- `setTimeout`, `setInterval`, `queueMicrotask`
- `console`
- `navigator.userAgent` (runtime identification)

The standard is formally called the "Minimum Common Web Platform API."

### 11.3 Edge Runtime Comparison

| Runtime | Engine | Language | Cold Start | Features |
|---------|--------|----------|------------|----------|
| Cloudflare Workers | V8 Isolates | C++ | <5ms | KV, R2, D1, Queues, Durable Objects |
| Deno Deploy | V8 | Rust | <10ms | Deno KV, BroadcastChannel, cron |
| Vercel Edge Runtime | V8 (workerd-based) | C++ | <5ms | Next.js integration, edge middleware |
| Fastly Compute | Wasmtime (Wasm) | Rust | <1ms | Wasm-only, no V8 |
| AWS Lambda@Edge | V8 (Node.js) | C++ | 50-200ms | CloudFront integration |
| Netlify Edge Functions | V8 (Deno) | Rust | <10ms | Deno-based |

---

## 12. The Browser Event Loop

The browser event loop is specified by the HTML Living Standard (not by ECMAScript). It is more complex than Node's event loop because it must coordinate JavaScript execution with rendering.

### 12.1 Task Queue vs. Microtask Queue vs. Rendering

```
   ┌─────────────────────────────────────────────────────┐
   │                  Browser Event Loop                  │
   │                                                     │
   │   1. Pick ONE task from the task queue               │
   │      (setTimeout, click handlers, MessageChannel,   │
   │       I/O completion, script evaluation)            │
   │                          │                           │
   │                          v                           │
   │   2. Drain the ENTIRE microtask queue                │
   │      (Promise.then, queueMicrotask,                 │
   │       MutationObserver)                             │
   │                          │                           │
   │                          v                           │
   │   3. IF rendering opportunity (typically ~16.6ms):   │
   │      a. Run requestAnimationFrame callbacks          │
   │      b. Recalculate styles                          │
   │      c. Layout                                      │
   │      d. Paint                                       │
   │      e. Composite                                   │
   │                          │                           │
   │                          v                           │
   │   4. IF idle time remains:                           │
   │      Run requestIdleCallback callbacks              │
   │                          │                           │
   │                          v                           │
   │   5. Go to step 1                                   │
   └─────────────────────────────────────────────────────┘
```

### 12.2 Key Differences from Node

1. **One task per loop iteration.** The browser picks exactly one task (macro-task), then drains all microtasks, then optionally renders. Node processes all callbacks in a phase before moving on.
2. **Rendering is part of the loop.** Browsers must paint frames. Long tasks (>50ms) cause visible jank.
3. **No `process.nextTick`.** Browsers use `queueMicrotask()` for the same purpose.
4. **`requestAnimationFrame`** fires before rendering, at ~60fps (16.6ms intervals). It is not in the task queue -- it has its own queue processed during the rendering step.

### 12.3 requestAnimationFrame

`requestAnimationFrame` (rAF) is the correct way to perform visual updates:

```javascript
function animate(timestamp) {
  // timestamp = DOMHighResTimeStamp (ms since page load)
  element.style.transform = `translateX(${timestamp / 10}px)`;
  requestAnimationFrame(animate);  // Schedule next frame
}
requestAnimationFrame(animate);
```

rAF callbacks are:
- Batched -- all rAF callbacks run together before rendering.
- Throttled -- matches the display refresh rate (60Hz, 120Hz, 144Hz).
- Paused when the tab is not visible (`document.hidden === true`).

### 12.4 Web Workers

Web Workers provide true parallelism in the browser. Each worker runs in a separate OS thread with its own event loop and V8 Isolate.

```javascript
// main.js
const worker = new Worker('worker.js');
worker.postMessage({ data: largeArray });
worker.onmessage = (e) => {
  console.log('Result:', e.data);
};

// worker.js
self.onmessage = (e) => {
  const result = heavyComputation(e.data);
  self.postMessage(result);
};
```

**Limitations of Web Workers:**
- No access to DOM, `document`, or `window`.
- Communication via `postMessage` (structured clone, copies data).
- Transferable objects (ArrayBuffer, MessagePort, ImageBitmap) can be transferred (zero-copy).

### 12.5 SharedArrayBuffer and Atomics

`SharedArrayBuffer` enables shared memory between the main thread and workers:

```javascript
// Main thread
const sab = new SharedArrayBuffer(1024);  // 1KB shared memory
const view = new Int32Array(sab);
worker.postMessage(sab);  // Worker receives the SAME memory

// Worker
self.onmessage = (e) => {
  const view = new Int32Array(e.data);
  Atomics.add(view, 0, 1);       // Atomic increment
  Atomics.notify(view, 0);        // Wake waiting threads
};

// Main thread waiting
Atomics.wait(view, 0, 0);         // Block until value changes from 0
```

**Security note:** SharedArrayBuffer was disabled in all browsers in January 2018 after the Spectre vulnerability disclosure. It was re-enabled with the requirement of cross-origin isolation headers:
```
Cross-Origin-Opener-Policy: same-origin
Cross-Origin-Embedder-Policy: require-corp
```

---

## 13. Node.js Worker Threads

### 13.1 Overview

Node.js `worker_threads` (stable since Node 12) provide a Worker API similar to the browser but within the Node runtime:

```javascript
import { Worker, isMainThread, parentPort, workerData } from 'worker_threads';

if (isMainThread) {
  // Main thread: spawn workers
  const worker = new Worker(new URL(import.meta.url), {
    workerData: { start: 0, end: 1_000_000 }
  });

  worker.on('message', (result) => {
    console.log('Sum:', result);
  });

  worker.on('error', (err) => {
    console.error('Worker error:', err);
  });

  worker.on('exit', (code) => {
    if (code !== 0) console.error(`Worker exited with code ${code}`);
  });
} else {
  // Worker thread: compute
  const { start, end } = workerData;
  let sum = 0;
  for (let i = start; i < end; i++) sum += i;
  parentPort.postMessage(sum);
}
```

### 13.2 Key Characteristics

- Each worker has its own V8 Isolate and event loop.
- Workers share the same process (PID) but not the same V8 heap.
- Communication via `postMessage` (structured clone) or `SharedArrayBuffer`.
- Workers can `require()`/`import` modules independently.
- Workers do NOT share `global` state. Each worker has its own `global`.
- Default thread limit: none (but practical limit is memory -- each V8 Isolate takes ~30-50 MB).

### 13.3 Worker Thread Pool Pattern

For CPU-intensive work, use a pool to avoid spawning excessive workers:

```bash
# Popular worker pool libraries
npm install piscina     # By Node.js core contributor Matteo Collina
npm install workerpool   # General-purpose
npm install tinypool     # Vitest's worker pool (minimal)
```

```javascript
import Piscina from 'piscina';

const pool = new Piscina({
  filename: new URL('./worker.js', import.meta.url).href,
  maxThreads: 4,
  idleTimeout: 30_000,  // Kill idle workers after 30s
});

// Submit tasks
const result = await pool.run({ input: 'data' });
```

---

## 14. V8 Isolates in Depth

### 14.1 What is an Isolate?

A V8 Isolate is an isolated instance of the V8 engine with its own:
- Heap (managed memory).
- Garbage collector.
- Compilation pipeline (Ignition, Sparkplug, Maglev, TurboFan).
- Built-in objects (`Object`, `Array`, `Promise`, etc.).

Isolates do NOT share:
- JavaScript objects or values.
- Compiled code (by default, though code caching can share bytecode).
- GC state.

Isolates DO share (within the same process):
- V8's compiled C++ code (the engine binary itself).
- OS-level resources (file descriptors, network sockets).
- Code caches (when explicitly configured).

### 14.2 Cloudflare's Model

Cloudflare runs thousands of customer Workers in a single process. Each Worker gets its own Isolate. Benefits:

1. **Fast cold start (<5ms).** Creating an Isolate is much cheaper than starting a process or container.
2. **Low memory overhead (~1-3 MB per Isolate).** Compared to ~50-150 MB for a container.
3. **Security through V8's sandbox.** Isolates cannot access each other's memory. V8's sandbox has been battle-tested by billions of browser tabs running untrusted code.
4. **Density.** A single server can host thousands of Isolates. Cloudflare runs millions of Workers across their network.

**Limitations:**
- No native code (WASM is allowed but runs inside the Isolate sandbox).
- CPU time limits (typically 10-50ms per request on free plans).
- No file system access.
- No persistent state within an Isolate (it may be evicted at any time).

### 14.3 Isolate Reuse and Warming

Edge platforms keep "warm" Isolates alive between requests to avoid repeated cold starts:

```
Request 1 -> Create Isolate -> Execute -> Keep Warm (idle)
Request 2 -> Reuse Isolate  -> Execute -> Keep Warm (idle)
    ...
Timeout   -> Evict Isolate  -> Free memory
```

Global state in a Worker persists across requests to the same Isolate, but you must not rely on it -- the Isolate may be evicted at any time. This is the "stateful but unreliable" model.

---

## 15. Memory Management

### 15.1 V8 Heap Structure

```
V8 Heap
├── New Space (Young Generation)
│   ├── From-Space (semi-space, 1-16 MB)
│   └── To-Space   (semi-space, 1-16 MB)
├── Old Space (Old Generation)
│   ├── Old Pointer Space  (objects with pointers to other objects)
│   └── Old Data Space     (objects with no pointers: strings, numbers)
├── Large Object Space     (objects > 512KB, never moved by GC)
├── Code Space             (compiled machine code from JIT)
├── Map Space              (hidden class / Map objects)
└── Cell Space, Property Cell Space, etc.
```

### 15.2 Heap Limits

```bash
# V8 default old-space limit:
#   64-bit: ~1.5 GB (varies by platform and Node version)
#   Node 12+: ~1.5 GB on 64-bit, ~512 MB on 32-bit

# Set old-space limit (MB)
node --max-old-space-size=8192 app.js    # 8 GB

# Set young generation semi-space size (MB)
node --max-semi-space-size=64 app.js     # 64 MB per semi-space

# Query current heap usage from JS
const mem = process.memoryUsage();
console.log({
  rss: `${(mem.rss / 1024 / 1024).toFixed(1)} MB`,          // Resident Set Size
  heapTotal: `${(mem.heapTotal / 1024 / 1024).toFixed(1)} MB`, // V8 heap allocated
  heapUsed: `${(mem.heapUsed / 1024 / 1024).toFixed(1)} MB`,  // V8 heap used
  external: `${(mem.external / 1024 / 1024).toFixed(1)} MB`,  // C++ objects bound to JS
  arrayBuffers: `${(mem.arrayBuffers / 1024 / 1024).toFixed(1)} MB`,
});
```

### 15.3 Common Memory Leak Patterns

**1. Closures retaining large scopes**
```javascript
// LEAK: The closure retains `hugeData` even though it only uses `hugeData.length`
function processData() {
  const hugeData = new Array(1_000_000).fill('x');
  return function getLength() {
    return hugeData.length;  // Closure captures entire `hugeData`
  };
}
const fn = processData();  // `hugeData` lives as long as `fn` does

// FIX: Extract what you need before closing over it
function processData() {
  const hugeData = new Array(1_000_000).fill('x');
  const len = hugeData.length;
  return function getLength() {
    return len;  // Only captures the number
  };
}
```

**2. Event emitter listeners**
```javascript
// LEAK: Adding listeners without removing them
const emitter = new EventEmitter();
setInterval(() => {
  emitter.on('data', (d) => console.log(d));  // New listener every interval!
}, 1000);

// After 10 iterations:
// MaxListenersExceededWarning: Possible EventEmitter memory leak.
// 11 data listeners added. Use emitter.setMaxListeners() to increase limit.

// FIX: Use `once()` or remove listeners explicitly
emitter.once('data', handler);  // Auto-removed after first call
// or
emitter.on('data', handler);
emitter.removeListener('data', handler);  // Manual removal
```

**3. Timers holding references**
```javascript
// LEAK: setInterval callback holds a reference to `cache`
const cache = new Map();
setInterval(() => {
  // Even if nothing else references `cache`, this timer prevents GC
  for (const [key, value] of cache) {
    if (Date.now() - value.ts > 60_000) cache.delete(key);
  }
}, 10_000);

// FIX: Use WeakRef or clear the interval when done
const intervalId = setInterval(cleanup, 10_000);
// Later:
clearInterval(intervalId);
```

**4. Detached DOM nodes (browser-specific)**
```javascript
// LEAK: JS reference to a removed DOM node prevents GC
const elements = [];
function createAndRemove() {
  const div = document.createElement('div');
  document.body.appendChild(div);
  document.body.removeChild(div);
  elements.push(div);  // Detached node retained in array!
}
```

**5. Global caches without eviction**
```javascript
// LEAK: Unbounded cache
const cache = new Map();
function getUser(id) {
  if (cache.has(id)) return cache.get(id);
  const user = fetchUser(id);
  cache.set(id, user);  // Never evicted. Cache grows forever.
  return user;
}

// FIX: Use an LRU cache or WeakMap
import { LRUCache } from 'lru-cache';
const cache = new LRUCache({ max: 1000 });
```

### 15.4 WeakRef and FinalizationRegistry (ES2021)

```javascript
// WeakRef: Reference that doesn't prevent GC
let target = { data: 'important' };
const weakRef = new WeakRef(target);
target = null;  // Now eligible for GC

// Later:
const obj = weakRef.deref();  // Returns object or undefined (if GC'd)

// FinalizationRegistry: Callback when object is GC'd
const registry = new FinalizationRegistry((heldValue) => {
  console.log(`Object with key "${heldValue}" was garbage collected`);
});
let obj = { data: 'tracked' };
registry.register(obj, 'my-key');
obj = null;  // Eventually: "Object with key "my-key" was garbage collected"
```

---

## 16. Performance Tooling

### 16.1 Built-in Node.js Profiling

```bash
# Chrome DevTools inspector (recommended)
node --inspect app.js              # Debugger on ws://127.0.0.1:9229
node --inspect-brk app.js         # Break on first line
# Open chrome://inspect in Chrome to connect

# V8 CPU profiler (generates .cpuprofile)
node --cpu-prof app.js
node --cpu-prof-dir=./profiles --cpu-prof-interval=100 app.js
# Load .cpuprofile in Chrome DevTools > Performance tab

# V8 heap snapshot
node --heap-prof app.js            # Generates .heapprofile
node --heapsnapshot-signal=SIGUSR2 app.js
# Then: kill -USR2 <pid> to take a snapshot on demand

# V8 sampling profiler (generates v8.log)
node --prof app.js
node --prof-process v8.log > processed.txt   # Human-readable output

# Trace GC events
node --trace-gc app.js
# Output: [12345:0x1234567]    50 ms: Scavenge 2.1 (3.0) -> 1.8 (4.0) MB, 0.5 ms

# Trace compilation
node --trace-opt app.js            # Optimizations
node --trace-deopt app.js          # Deoptimizations
node --trace-opt --trace-deopt app.js  # Both
```

### 16.2 Clinic.js

Clinic.js (by NearForm) is a suite of Node.js performance diagnostic tools:

```bash
# Install
npm install -g clinic

# Clinic Doctor: Detects common issues (event loop delay, GC, I/O)
clinic doctor -- node app.js
# Generates an HTML report with recommendations

# Clinic Flame: Flame graph visualization
clinic flame -- node app.js
# Generates an interactive flame graph in the browser

# Clinic Bubbleprof: Async operation visualization
clinic bubbleprof -- node app.js
# Shows async operations as bubbles, revealing bottlenecks
```

### 16.3 0x Flame Graphs

0x generates V8-based flame graphs with zero overhead:

```bash
# Install
npm install -g 0x

# Generate flame graph
0x app.js
# Opens an interactive flame graph in the browser

# Profile for a specific duration
0x --timeout 10000 app.js  # 10 seconds

# With additional node flags
0x -- node --max-old-space-size=4096 app.js
```

### 16.4 Autocannon (HTTP benchmarking)

```bash
# Install
npm install -g autocannon

# Basic benchmark
autocannon -c 100 -d 10 http://localhost:3000
# -c 100: 100 concurrent connections
# -d 10:  10 seconds duration

# With custom headers and body
autocannon -c 50 -d 30 \
  -H "Authorization=Bearer token123" \
  -m POST \
  -b '{"key":"value"}' \
  http://localhost:3000/api

# Output example:
# ┌─────────┬───────┬───────┬───────┬───────┬───────────┐
# │ Stat    │ 2.5%  │ 50%   │ 97.5% │ 99%   │ Avg       │
# ├─────────┼───────┼───────┼───────┼───────┼───────────┤
# │ Latency │ 1 ms  │ 2 ms  │ 8 ms  │ 12 ms │ 2.45 ms   │
# └─────────┴───────┴───────┴───────┴───────┴───────────┘
# │ Req/Sec │ 38400 │ 41200 │ 43100 │ 43800 │ 41050     │
```

### 16.5 Diagnostic Reports

```bash
# Generate diagnostic report on signal
node --report-on-signal app.js
kill -USR2 <pid>   # Triggers report

# Generate report on uncaught exception
node --report-on-fatalerror app.js

# Report includes:
# - Node.js and V8 version info
# - System info (OS, CPU, memory)
# - JavaScript and native stack traces
# - Heap statistics
# - libuv handle summary
# - Environment variables
# - Shared library list
```

### 16.6 Deno and Bun Profiling

```bash
# Deno: built-in benchmarking
deno bench bench.ts
# bench.ts:
# Deno.bench("array push", () => {
#   const arr = [];
#   for (let i = 0; i < 1000; i++) arr.push(i);
# });

# Bun: built-in profiler (sampling)
bun --smol app.ts        # Reduced memory mode
bun --hot app.ts         # Hot reload (preserves state)

# Bun: generate CPU profile
bun --inspect app.ts     # Chrome DevTools compatible
```

### 16.7 Runtime Comparison Benchmark Script

```bash
#!/usr/bin/env bash
# bench-runtimes.sh -- Compare startup time across runtimes

SCRIPT='console.log("hello")'

echo "--- Startup Time (10 runs averaged) ---"

echo -n "Node.js: "
for i in $(seq 1 10); do
  /usr/bin/time -f "%e" node -e "$SCRIPT" 2>&1 >/dev/null
done | awk '{s+=$1} END {printf "%.3f s\n", s/NR}'

echo -n "Deno:    "
for i in $(seq 1 10); do
  /usr/bin/time -f "%e" deno eval "$SCRIPT" 2>&1 >/dev/null
done | awk '{s+=$1} END {printf "%.3f s\n", s/NR}'

echo -n "Bun:     "
for i in $(seq 1 10); do
  /usr/bin/time -f "%e" bun -e "$SCRIPT" 2>&1 >/dev/null
done | awk '{s+=$1} END {printf "%.3f s\n", s/NR}'
```

---

## Appendix A: Timeline of JavaScript Engines and Runtimes

| Year | Event |
|------|-------|
| 1995 | Brendan Eich writes first JS interpreter (SpiderMonkey) at Netscape |
| 1996 | Microsoft reverse-engineers JS, ships JScript in IE 3.0 |
| 2004 | Google Maps demonstrates JS can power complex web apps |
| 2008 | Google releases V8 with Chrome. Lars Bak's team. Compiles to native code. |
| 2008 | Apple ships SquirrelFish (later Nitro/JSC) in Safari |
| 2008 | Mozilla ships TraceMonkey -- first browser JIT |
| 2009 | Ryan Dahl presents Node.js at JSConf EU |
| 2010 | npm launches (Isaac Schlueter) |
| 2010 | JaegerMonkey replaces TraceMonkey in Firefox |
| 2011 | libuv created (Ben Noordhuis, Bert Belder) for cross-platform Node |
| 2011 | Chakra ships in IE9 |
| 2013 | IonMonkey ships in Firefox |
| 2014 | io.js fork over Node governance disputes |
| 2015 | io.js merges back into Node. Node Foundation formed. Node 4.0. |
| 2015 | TurboFan begins replacing Crankshaft in V8 |
| 2016 | Ignition interpreter added to V8 |
| 2016 | ChakraCore open-sourced by Microsoft |
| 2017 | Cloudflare Workers launches (V8 Isolates at the edge) |
| 2018 | Ryan Dahl: "10 Things I Regret About Node.js" -- announces Deno |
| 2019 | Hermes released by Meta for React Native |
| 2019 | QuickJS released by Fabrice Bellard |
| 2020 | Deno 1.0 launches |
| 2020 | Microsoft Edge switches to Chromium/V8. Chakra development ends. |
| 2020 | V8 ships pointer compression (40% heap reduction) |
| 2020 | Warp replaces IonMonkey in SpiderMonkey |
| 2021 | Sparkplug baseline compiler ships in V8 |
| 2022 | Bun announced by Jarred Sumner (Zig + JSC) |
| 2022 | Cloudflare open-sources workerd |
| 2022 | WinterCG formed for edge runtime standardization |
| 2023 | Bun 1.0 released (September) |
| 2023 | Maglev mid-tier compiler ships in V8 |
| 2023 | Deno KV launches |
| 2024 | Node 22: experimental require(esm) |
| 2025 | Deno 2.x stabilizes; JSR (JavaScript Registry) gains traction |

---

## Appendix B: Quick Reference -- Runtime Feature Matrix

| Feature | Node.js | Deno | Bun |
|---------|---------|------|-----|
| Engine | V8 | V8 | JavaScriptCore |
| Language | C++ | Rust | Zig + C++ |
| TypeScript | Via transpiler | Native | Native |
| Package Manager | npm/yarn/pnpm | deno add / JSR | bun install |
| Permission Model | None | --allow-* flags | None |
| Built-in Test Runner | `node --test` (18+) | `deno test` | `bun test` |
| Built-in Bundler | No | No | `bun build` |
| Built-in Formatter | No | `deno fmt` | No |
| Built-in Linter | No | `deno lint` | No |
| HTTP Server | `http.createServer` | `Deno.serve` | `Bun.serve` |
| SQLite | Via npm | Via npm | Built-in |
| `fetch()` | 18+ (undici) | Built-in | Built-in |
| Web Streams | 18+ | Built-in | Built-in |
| Top-level await | ESM only | Yes | Yes |
| Single executable | `--experimental-sea` | `deno compile` | `bun build --compile` |

---

## Appendix C: V8 Flags Cheat Sheet

```bash
# Compilation and optimization
node --print-bytecode app.js           # Show Ignition bytecode
node --trace-opt app.js                # Log optimization decisions
node --trace-deopt app.js              # Log deoptimization events
node --no-opt app.js                   # Disable TurboFan entirely
node --always-turbofan app.js          # Force TurboFan on all functions
node --max-inlined-bytecode-size=1024  # Inlining threshold (bytes)

# Garbage collection
node --trace-gc app.js                 # GC events summary
node --trace-gc-verbose app.js         # Detailed GC info
node --expose-gc app.js                # Expose global.gc()
node --max-old-space-size=4096 app.js  # Old gen limit (MB)
node --max-semi-space-size=64 app.js   # Young gen semi-space (MB)
node --gc-interval=100 app.js          # Force GC every N allocations

# Profiling
node --prof app.js                     # V8 tick profiler
node --prof-process v8.log             # Process profiler output
node --cpu-prof app.js                 # CPU profile (.cpuprofile)
node --heap-prof app.js                # Heap profile (.heapprofile)
node --inspect app.js                  # Chrome DevTools debugger
node --inspect-brk app.js             # Break on first statement

# Diagnostics
node --trace-warnings app.js           # Print stack trace for warnings
node --pending-deprecation app.js      # Show pending deprecation warnings
node --abort-on-uncaught-exception     # Abort for core dump analysis
node --report-on-fatalerror app.js     # Diagnostic report on crash
node --report-on-signal app.js         # Diagnostic report on SIGUSR2

# Module resolution
node --experimental-specifier-resolution=node app.mjs  # Extensionless ESM
node --conditions=development app.js   # Package.json conditional exports
```

---

*PNW Research Series -- JavaScript and TypeScript*
*Research conducted 2026-04-08. Engine version data current as of early 2025.*
