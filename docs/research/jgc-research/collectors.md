# JVM Garbage Collectors: A Deep Dive

*A comprehensive tour of every garbage collector available in the modern JVM — how each one works internally, what tradeoffs it makes, and when to pick it.*

---

## 1. Garbage Collection Theory Primer

Before we catalog individual collectors, it helps to establish the vocabulary. Every JVM GC is an implementation of a handful of classical ideas, composed differently to hit different points on a three-way tradeoff: **pause time**, **throughput**, and **footprint**. You can optimize any two at the expense of the third, but not all three.

### 1.1 The Weak Generational Hypothesis

The single most influential empirical observation in GC design is the **weak generational hypothesis**: *most objects die young*. Decades of production heap telemetry confirm that the lifetime distribution of allocated objects is strongly bimodal — the vast majority become unreachable within milliseconds of allocation, while a small minority survive for the entire process lifetime.

This observation drives **generational garbage collection**. If you can cheaply identify the newly-allocated region of the heap and collect only that, you reclaim most of the garbage for a fraction of the cost of scanning the entire heap.

A **strong generational hypothesis** also exists, which adds: *the older an object gets, the less likely it is to die soon*. This justifies progressively less-frequent scanning of older objects.

### 1.2 Tracing Collectors

A **tracing garbage collector** determines liveness by transitively following references from a set of GC roots (stack slots, static fields, JNI handles, monitor-held objects, and various VM-internal tables). Anything reachable is live; anything unreachable is garbage. Three classical tracing algorithms underlie essentially every JVM collector:

- **Mark-Sweep.** Walk the live set and flag each reachable object (mark). Then walk the heap linearly and add unmarked objects to a free list (sweep). Simple and cheap in terms of work per object, but leaves the heap fragmented.
- **Mark-Compact.** After marking, slide live objects together to eliminate holes. Restores contiguous free space for bump-pointer allocation but requires an extra compaction pass and a mechanism to update every reference to moved objects.
- **Copying (Scavenge, semi-space).** Divide the region in two; allocate into one half. On collection, evacuate live objects to the other half and flip the roles. Work is proportional to live data, not dead data — ideal when most objects die young. Costs 50% of the region as headroom.

### 1.3 Reference Counting

**Reference counting** maintains a per-object reference count and reclaims objects when the count reaches zero. It provides incremental collection with no global pauses, but it struggles with cycles and imposes high write-barrier overhead on every pointer assignment. The HotSpot JVM does not use reference counting for the object graph, though reference counting does appear in internal structures (e.g., `java.lang.ref.Cleaner`-driven off-heap resources, some JNI handles, and implementation details of class metadata).

### 1.4 Generational GC

A generational collector partitions the heap by age. The canonical HotSpot layout (pre-G1) has:

- **Young generation** — split into **Eden** and two **survivor spaces** (S0, S1). New allocations land in Eden. A **minor GC** copies live objects from Eden + the active survivor to the other survivor. Objects that survive a threshold number of minor GCs (**tenuring threshold**, default 15 in HotSpot) are **promoted** (tenured) into the old generation.
- **Old generation (tenured)** — longer-lived objects. Collected by a **major** or **full** GC, typically much more expensive.

Generational collection requires a **remembered set** or **card table** (see §1.7) to track old-to-young pointers so that a young collection can treat only pointers from old regions as additional roots, rather than scanning the entire old generation.

### 1.5 STW, Concurrent, and Parallel

These three terms are orthogonal, but often conflated:

- **Stop-the-world (STW).** All mutator threads (application threads) are halted at a safepoint for the duration of some GC phase. Simple to reason about; hostile to latency.
- **Parallel.** The GC uses multiple GC threads to do its work. Typically still STW, but faster because the work is divided across CPUs. "Parallel" does not imply concurrent with the application.
- **Concurrent.** The GC runs at the same time as application threads, without stopping them (or stopping them only briefly). Requires **barriers** (§1.7) to keep the collector and mutator coherent.

Modern low-pause collectors (G1, ZGC, Shenandoah) use a combination: short parallel STW phases (initial mark, final mark) bracketing long concurrent phases (concurrent mark, concurrent relocate).

### 1.6 The Pause/Throughput/Footprint Triangle

Every collector trades these three properties:

- **Pause time** — how long the application is stopped during a collection.
- **Throughput** — the fraction of total CPU cycles available to the application rather than the GC. A collector with 3% GC overhead has 97% throughput.
- **Footprint** — the total memory the collector needs. Concurrent collectors need headroom for allocations during the concurrent phase; copying collectors need space for the to-space; remembered sets cost memory proportional to the heap.

You can improve any two but not all three. Parallel GC maximizes throughput and minimizes footprint at the cost of long pauses. ZGC minimizes pause time at the cost of throughput and footprint. G1 tries to be Pareto-balanced for the common case.

### 1.7 Barriers, Card Tables, and Remembered Sets

A **barrier** is code emitted by the JIT around heap accesses to maintain GC invariants concurrently with the mutator. There are two families:

- **Write barriers** — run on pointer stores. Used by generational collectors to record old-to-young pointers, and by concurrent markers (SATB) to remember overwritten references that the concurrent marker might otherwise miss.
- **Read barriers** (load barriers) — run on pointer loads. Used by concurrent relocating collectors (ZGC, Shenandoah) to intercept loads of references that might point to a relocated object and forward them.

A **card table** is a coarse bitmap that divides the heap into equal "cards" (typically 512 bytes in HotSpot). A write barrier sets the corresponding card bit on any pointer store. At collection time, the GC scans only dirty cards for potential inter-generational pointers — cheap to maintain, coarse-grained, but sufficient.

A **remembered set** is a finer-grained structure that explicitly lists, for each region, the set of other regions that contain pointers into it. G1 uses per-region remembered sets. They cost more memory than card tables but give the collector precise knowledge about what it must scan.

### 1.8 Safepoints and Safepoint Polling

A **safepoint** is a point in the compiled code where the JVM knows the thread's register state well enough to walk its stack precisely. When the GC needs to stop the world (or a subset of threads), it sets a flag; each mutator thread polls that flag at safepoint locations (method entry, loop back-edges, call returns) and suspends itself if set.

The time between setting the flag and the last mutator reaching its next safepoint is called the **time-to-safepoint (TTSP)**. TTSP is a hidden latency source — a long-running loop without safepoint polls can delay a GC pause arbitrarily. HotSpot adds safepoint polls to loop back-edges by default, but counted integer loops are sometimes optimized without polls, which can cause TTSP spikes.

Modern JVMs (JDK 10+) use **thread-local handshakes** (JEP 312) to stop individual threads without a global safepoint, which is essential for ZGC- and Shenandoah-class latency goals.

### 1.9 Evacuation vs In-Place Compaction

Two strategies for reclaiming fragmented space:

- **Evacuation** (copying) — move live objects to a fresh region and release the old region whole. Work scales with live data; fast. This is how G1, ZGC, and Shenandoah handle old-gen compaction.
- **In-place compaction** — slide live objects toward one end of the region without an auxiliary destination. Work scales with the whole heap; no extra headroom required. Used by Serial GC's old gen and the legacy Parallel Old collector.

### 1.10 Precise vs Conservative GC

A **precise** GC knows exactly which words in memory and registers are object references and which are scalars. This is required to safely move objects (compaction, evacuation), because every pointer needs to be updated to the new location.

A **conservative** GC treats any word that *looks* like a pointer as if it might be one. It cannot safely move objects (because it might update a scalar that happens to look like a pointer). Boehm-Demers-Weiser is the canonical conservative collector.

**The HotSpot JVM is precise.** Every compiled method carries an **OopMap** (ordinary-object-pointer map) for each safepoint, listing exactly which stack slots and registers hold references. This is what makes compacting and evacuating collectors safe.

---

## 2. Serial GC

```bash
java -XX:+UseSerialGC -jar app.jar
```

The simplest collector in HotSpot. Single-threaded, fully stop-the-world.

### 2.1 Architecture

- **Young generation**: a copying collector with Eden + two survivor spaces (S0, S1). Minor GC evacuates live objects from Eden and the active survivor into the other survivor; long-tenured objects are promoted to the old generation.
- **Old generation**: mark-sweep-compact. A mark phase walks live objects from GC roots. A sweep phase identifies garbage. A compact phase slides live objects toward the start of the old generation, restoring contiguous free space.

### 2.2 Characteristics

- **Throughput**: surprisingly competitive for small heaps because it has no concurrency overhead and no parallel coordination.
- **Pause time**: proportional to heap size; unusable for large heaps or latency-sensitive work.
- **Footprint**: minimal — no remembered sets (it uses a card table), no concurrent marking structures, no auxiliary to-space outside the young generation.

### 2.3 When to Use It

- Containers with small heaps (< 100 MB).
- Embedded JVMs and single-core environments.
- Short-lived CLI processes where startup overhead of complex collectors dominates.
- Client-class JVMs (historically the default for `-client` VM mode). [CHECK: the `-client` VM mode was removed from Oracle JDK on 64-bit platforms.]
- Auto-selected by ergonomics when running on a single CPU with a small heap. [CHECK: current HotSpot ergonomics thresholds.]

### 2.4 Notable Flags

```bash
-XX:+UseSerialGC
-XX:NewRatio=2                   # Old/Young size ratio
-XX:SurvivorRatio=8              # Eden/Survivor size ratio
-XX:MaxTenuringThreshold=15      # How many minor GCs before promotion
```

---

## 3. Parallel GC (Throughput Collector)

```bash
java -XX:+UseParallelGC -jar app.jar
```

The "throughput collector." Multi-threaded, still fully stop-the-world. The design goal is simple: spend as little total CPU on GC as possible, regardless of individual pause length.

### 3.1 Architecture

- **Young generation**: parallel copying collector. N GC threads (defaults to the number of CPU cores, up to 8, then `5/8 * cores` above that [CHECK]) divide Eden into strips and evacuate in parallel.
- **Old generation**: parallel mark-sweep-compact, historically enabled via `-XX:+UseParallelOldGC`. In modern JDKs (8+), parallel old is the default when `UseParallelGC` is enabled; the separate flag is deprecated/implied.

### 3.2 Characteristics

- **Throughput**: highest of any HotSpot collector for CPU-bound batch work. Minimal barriers, no concurrent overhead.
- **Pause time**: longer than concurrent collectors because all GC work is STW. Old-gen collections can pause for seconds on multi-gigabyte heaps.
- **Footprint**: small. No remembered set beyond a card table; no snapshot structures.
- **Dynamic sizing**: ParallelGC has aggressive ergonomics — given a pause target (`MaxGCPauseMillis`) and throughput target (`GCTimeRatio`), it dynamically resizes generations. This is a double-edged sword; the ergonomic heuristics can fight with user tuning.

### 3.3 When to Use It

- Batch jobs (ETL, data pipelines, scientific computing) where throughput dominates and pauses are acceptable.
- Workloads where latency is measured end-to-end rather than per-request.
- JDK 8 was the era of Parallel GC as the default for server-class machines. G1 took over as default in JDK 9 (JEP 248).

### 3.4 Notable Flags

```bash
-XX:+UseParallelGC
-XX:ParallelGCThreads=N          # Number of parallel GC worker threads
-XX:MaxGCPauseMillis=200         # Soft target
-XX:GCTimeRatio=99               # Target: GC time < 1/(1+N) of total
-XX:+UseAdaptiveSizePolicy       # Dynamic young/old sizing (default on)
```

---

## 4. CMS (Concurrent Mark Sweep) — Deprecated and Removed

```bash
java -XX:+UseConcMarkSweepGC -jar app.jar   # JDK 8 and earlier
```

CMS was HotSpot's first low-pause collector for the old generation. It is **deprecated in JDK 9 (JEP 291)** and **removed in JDK 14 (JEP 363)**. You should not start new projects on it; it is included here because decades of JVM deployments still carry its fingerprints and its design informs G1.

### 4.1 Architecture

CMS is *only* an old-generation collector. The young generation is collected by ParNew, a parallel copying collector similar to ParallelGC's young collector.

Old-generation cycle phases:

1. **Initial mark** (STW). Mark objects reachable directly from GC roots and from the young generation.
2. **Concurrent mark**. Trace the old-generation object graph while mutators run.
3. **Concurrent preclean**. Process dirty cards and the "card table precleaning" to reduce remark work.
4. **Remark** (STW). Scan thread stacks and dirty cards to catch mutations missed during concurrent mark. Uses the SATB/incremental-update hybrid.
5. **Concurrent sweep**. Walk the heap, add dead objects to a free list.
6. **Concurrent reset**.

### 4.2 Characteristics and Pathologies

- **Pauses** (initial mark + remark) are short compared to parallel full GC, but the remark pause can grow with old-gen size if the card table is dirty.
- **No compaction**. CMS uses free lists, so the old generation fragments over time. Eventually, CMS cannot find a contiguous block for a promotion and must fall back to a **serial, single-threaded full GC** — the infamous "concurrent mode failure" that pauses the JVM for many seconds.
- **Higher CPU cost than Parallel GC** because of concurrent marking.
- **Promotion failure** is a second pathological mode: if the old generation can't accept a promoted object during a young collection, it triggers a full GC.

### 4.3 Why It Was Replaced

CMS's code was notoriously complex and a maintenance burden. G1 offered comparable or better latency with compaction built in, avoiding fragmentation-driven fallbacks. JEP 291 deprecated CMS in JDK 9 explicitly to "reduce the maintenance burden of the GC code base and accelerate new development."

### 4.4 Notable Flags (Historical)

```bash
-XX:+UseConcMarkSweepGC
-XX:CMSInitiatingOccupancyFraction=70  # Start CMS when old-gen is 70% full
-XX:+UseCMSInitiatingOccupancyOnly     # Don't let ergonomics override
-XX:+CMSParallelRemarkEnabled
-XX:+CMSClassUnloadingEnabled
```

---

## 5. G1 (Garbage First) — The Default Modern Collector

```bash
java -XX:+UseG1GC -jar app.jar
```

G1 is the default collector from JDK 9 onward (JEP 248). It was designed to be a balance between throughput and pause time, giving predictable soft pause targets on multi-gigabyte heaps.

### 5.1 Region-Based Heap

G1 divides the heap into **regions** of equal size, typically 1 MB to 32 MB (chosen automatically from heap size so there are roughly 2,048 regions [CHECK: the target region count.]). Each region at any given time plays one role:

- **Eden**
- **Survivor**
- **Old**
- **Humongous** — a single object larger than half a region. Humongous objects occupy one or more contiguous regions and are allocated directly in old-gen.
- **Free**

The genius of G1 is that region roles are *dynamic*. The young generation is just "the set of eden and survivor regions right now," and it can grow or shrink between collections. There is no fixed young/old boundary in the address space.

### 5.2 Collection Modes

G1 runs three kinds of collections:

- **Young-only collections**: evacuate all young regions to new survivor and old regions. STW, parallel. The default mode.
- **Mixed collections**: evacuate all young regions *plus a subset of old regions* chosen to reclaim the most garbage per unit of pause time. The "Garbage First" name comes from this — G1 picks the old regions with the highest garbage ratio first.
- **Full GC**: a fallback mark-sweep-compact across the whole heap. Originally single-threaded; since JDK 10, G1's full GC is parallel (JEP 307). Full GCs indicate G1 is failing to keep up and should be considered a tuning bug.

### 5.3 Concurrent Marking Cycle

In parallel with young/mixed collections, G1 runs a concurrent marking cycle to identify which old regions have the most garbage. Phases:

1. **Initial mark** (STW). Piggybacked on a young collection — marks roots into old regions.
2. **Root region scan**. Concurrent. Scans survivor regions for references to old regions.
3. **Concurrent mark**. Traces the old generation graph, SATB-style.
4. **Remark** (STW). Finalizes marking, processes SATB buffers.
5. **Cleanup** (mostly STW, partly concurrent). Counts per-region live bytes, sorts regions by garbage-first order, reclaims completely empty old regions immediately.

After the cycle, mixed collections begin, evacuating old regions in garbage-first order until the threshold is reached, then G1 returns to young-only mode.

### 5.4 SATB (Snapshot-At-The-Beginning) Marking

G1 uses **SATB** to maintain concurrent marking correctness. The invariant: the collector marks every object that was live at the start of the concurrent cycle, even if it becomes unreachable during marking. The SATB write barrier, on every pointer store, records the *previous* value of the field in a thread-local buffer. The concurrent marker drains these buffers and marks the overwritten references as live.

SATB is conservative — it can mark some objects that have genuinely become garbage, which will be collected in the next cycle ("floating garbage"). In exchange, it needs only a short remark pause.

### 5.5 Remembered Sets and Write Barriers

Each region has a **remembered set** (RSet) that tracks incoming pointers from other regions, grouped by source region. G1's write barrier:

1. Filters out stores within the same region (the common case).
2. Enqueues cross-region stores in a thread-local "dirty card queue."
3. A refinement thread pool processes the queue concurrently and updates the remembered set.

This two-stage approach keeps the per-store cost low (a few instructions) and moves the expensive RSet updates off the mutator thread.

### 5.6 Pause Target

```bash
-XX:MaxGCPauseMillis=200
```

G1 treats this as a *soft* target. It uses a prediction model built from historical collection data (cost per region evacuated, cost per card scanned, cost per root scanned) to select a collection set (CSet) that should fit in the target. The target is not guaranteed — a heavily-fragmented heap or a misbehaving workload can blow past it. A too-aggressive target can also starve the collector and cause OOM.

### 5.7 Humongous Objects

An object larger than 50% of a region is **humongous**. G1 allocates it in a contiguous run of old-gen regions. Humongous allocations skip the young generation entirely and can force a concurrent marking cycle if they exceed a threshold of old-gen capacity. They are a frequent source of surprise in G1 tuning — if your workload allocates large arrays or strings, consider sizing regions so they are not humongous (`-XX:G1HeapRegionSize=16M` or similar).

Since JDK 8u40, humongous regions can be reclaimed eagerly at the end of a young collection if nothing references them (they were short-lived).

### 5.8 Working Range

G1 works well from roughly 4 GB to 32 GB heaps. It is usable up to a few hundred GB but the remembered set overhead and concurrent marking cost grow non-linearly. Beyond ~32 GB with strict latency targets, ZGC or Shenandoah is a better fit.

### 5.9 String Deduplication

```bash
-XX:+UseStringDeduplication
```

G1 has an opt-in background thread that deduplicates `String` objects with identical character arrays. It runs during the GC and can reclaim significant memory in String-heavy workloads (web servers, XML parsers) at a small throughput cost.

### 5.10 Notable Flags

```bash
-XX:+UseG1GC
-XX:MaxGCPauseMillis=200
-XX:G1HeapRegionSize=16M            # Explicit region size
-XX:InitiatingHeapOccupancyPercent=45   # Trigger concurrent cycle at 45% old-gen
-XX:G1MixedGCLiveThresholdPercent=85    # Old regions with <85% live can be mixed
-XX:G1MixedGCCountTarget=8              # Number of mixed collections per cycle
-XX:ConcGCThreads=2                     # Concurrent marker threads
-XX:ParallelGCThreads=8                 # STW parallel threads
```

### 5.11 JEPs

- JEP 248: Make G1 the Default Garbage Collector (JDK 9)
- JEP 307: Parallel Full GC for G1 (JDK 10)
- JEP 344: Abortable Mixed Collections for G1 (JDK 12)
- JEP 345: NUMA-Aware Memory Allocation for G1 (JDK 14)
- JEP 346: Promptly Return Unused Committed Memory from G1 (JDK 12)

---

## 6. ZGC — The Ultra-Low-Pause Collector

```bash
java -XX:+UseZGC -jar app.jar
```

ZGC is Oracle's scalable, ultra-low-pause collector. Introduced as experimental in **JDK 11 (JEP 333)**, became production-ready in **JDK 15 (JEP 377)**, and acquired a **generational mode in JDK 21 (JEP 439)**. Its design goals: pause times under 10 ms regardless of heap size, and scaling from a few hundred MB up to multi-terabyte heaps.

### 6.1 Design Goals

- **Max pause time**: originally targeted < 10 ms; in practice often well under 1 ms on modern hardware. Pauses are independent of live-set size and heap size because all serious work (marking, relocation, reference processing) is concurrent.
- **Heap size**: from 8 MB up to 16 TB [CHECK: current documented maximum].
- **Throughput overhead**: originally ~15% compared to ParallelGC; generational ZGC dramatically reduces this for typical workloads.

### 6.2 Colored Pointers

ZGC's signature trick is **colored pointers**. On 64-bit architectures, not all 64 bits are used for addresses; ZGC reserves several high bits as **metadata bits**, encoding the object's "color." The original non-generational ZGC used a 42-bit virtual address space with 4 metadata bits: `marked0`, `marked1`, `remapped`, and `finalizable`.

The heap is mapped into *multiple virtual-address views*, one per color, all backed by the same physical memory via `mmap` tricks. Switching "phases" is as simple as changing which view the JVM uses; the mutator sees pointers with the current color as valid, and pointers with the wrong color trigger the load barrier.

Because colored pointers are large, ZGC cannot work with ordinary compressed oops — compressed oops and ZGC were historically incompatible. [CHECK: recent JDKs may have added compressed-oop-like optimizations for ZGC.]

### 6.3 Load Barriers

Every pointer **load** in JIT-compiled code is preceded by a short barrier sequence (a few instructions) that:

1. Checks whether the loaded pointer has the "good" color for the current phase.
2. If yes, fast path — use the pointer as-is.
3. If no, slow path — "heal" the pointer. If the object has been relocated, forward to the new location and update the reference in place (self-healing). If the object is being marked, mark it.

Because the heal happens on load, the mutator actively helps the collector — references get updated lazily as the program touches them, spreading the work over time and avoiding a big "update all references" STW phase.

### 6.4 Page-Based Heap

ZGC divides the heap into **pages** of three sizes:

- **Small pages** (2 MB): objects up to 256 KB.
- **Medium pages** (32 MB): objects up to 4 MB.
- **Large pages**: single object per page, rounded up to a multiple of 2 MB.

Pages are allocated and freed as whole units. Compaction is per-page evacuation.

### 6.5 Cycle Phases

A ZGC cycle consists of:

1. **Pause Mark Start** (STW, sub-millisecond). Switch the "good color" for marking. Enqueue roots.
2. **Concurrent Mark/Remap**. Walk the object graph, marking reachable objects. Also remap references to objects relocated in the previous cycle.
3. **Pause Mark End** (STW, sub-millisecond). Drain remaining mark work, handle weak references.
4. **Concurrent Prepare for Relocate**. Choose pages to relocate based on fragmentation and live-set; build forwarding tables.
5. **Pause Relocate Start** (STW, sub-millisecond). Switch the "good color" for relocation.
6. **Concurrent Relocate**. Evacuate live objects from selected pages to fresh pages. Load barriers on the mutator thread help heal references.

All three STW pauses are bounded and independent of heap size.

### 6.6 Generational ZGC (JDK 21, JEP 439)

Until JDK 21, ZGC was **non-generational** — every cycle walked the full heap. This worked but sacrificed the throughput benefits of generational collection. Generational ZGC (JEP 439) adds a young generation with its own concurrent cycle, using the weak generational hypothesis to reduce the work per cycle and reduce memory overhead.

Generational ZGC uses **two-color pointers** plus a bookkeeping scheme to distinguish young from old without the multi-color complexity of the original design. It also significantly reduces the memory overhead — non-generational ZGC historically needed headroom of roughly 2-3x the live set to guarantee pauses; generational ZGC reduces this.

In JDK 23+, generational mode is the default when ZGC is selected. [CHECK: the exact version at which `ZGenerational` became the default.]

### 6.7 Limitations

- **Throughput cost**: load barriers are cheap but not free. Allocation-heavy workloads pay a measurable throughput penalty compared to ParallelGC (historically ~15%, improved in generational ZGC).
- **Memory overhead**: historically ~3x the live set to absorb allocation during the concurrent cycle. Generational mode substantially reduces this.
- **No compressed oops** in the traditional sense. ZGC uses 64-bit references always.

### 6.8 Notable Flags

```bash
-XX:+UseZGC
-XX:+ZGenerational               # Enable generational mode (default in recent JDKs)
-XX:SoftMaxHeapSize=8g           # Soft cap on heap; ZGC tries to stay below this
-XX:ConcGCThreads=4              # Concurrent worker threads
-Xlog:gc*                        # Unified logging for GC
```

### 6.9 JEPs

- JEP 333: ZGC: A Scalable Low-Latency Garbage Collector (Experimental, JDK 11)
- JEP 376: ZGC: Concurrent Thread-Stack Processing (JDK 16)
- JEP 377: ZGC: A Scalable Low-Latency Garbage Collector (Production, JDK 15)
- JEP 439: Generational ZGC (JDK 21)

---

## 7. Shenandoah

```bash
java -XX:+UseShenandoahGC -jar app.jar
```

Shenandoah is Red Hat's ultra-low-pause collector, developed by Christine Flood and Roman Kennke. It shares ZGC's latency goals but reaches them via a different implementation approach. It targets pause times independent of heap size, achieved through concurrent marking *and* concurrent compaction.

### 7.1 History and Availability

Shenandoah was originally an out-of-tree Red Hat project, then upstreamed to OpenJDK as an experimental feature. It is available in OpenJDK builds from Red Hat, Adoptium (Eclipse Temurin), Amazon Corretto, Azul Zulu, and others. Notably, it was **not** historically included in Oracle's JDK binaries; Oracle shipped ZGC. [CHECK: whether Oracle JDK now ships Shenandoah.]

- **JEP 189**: Shenandoah: A Low-Pause-Time Garbage Collector (Experimental)
- **JEP 379**: Shenandoah: A Low-Pause-Time Garbage Collector (Production, JDK 15)

### 7.2 Design Approach

Shenandoah uses region-based heap layout similar to G1 (~2,048 equal-sized regions). The critical difference is that evacuation is **concurrent** — the mutator can load and even store to an object while it is being copied.

### 7.3 Brooks Forwarding Pointers (Historical)

Early Shenandoah implementations (through JDK 12) added a **Brooks pointer** to every object's header — an extra word per object whose value is normally the object itself. When the object is copied, the forwarding word in the old copy is updated to point to the new copy. The load barrier checks the Brooks pointer on every access and dereferences it to find the "current" location.

This imposes a significant per-object memory overhead.

### 7.4 Load Reference Barriers (LRB)

Since JDK 13, Shenandoah uses **Load Reference Barriers** instead of Brooks pointers. The barrier runs on every reference *load* (similar to ZGC's load barrier) and returns the forwarded pointer if needed. This removes the per-object overhead at the cost of more complex barrier code.

### 7.5 Cycle Phases

1. **Init Mark** (STW, short). Scan GC roots and initialize marking.
2. **Concurrent Mark**. Walk the live set.
3. **Final Mark** (STW, short). Finalize marking, drain SATB buffers, choose the collection set.
4. **Concurrent Cleanup**. Reclaim completely empty regions.
5. **Concurrent Evacuation**. Copy live objects from collection-set regions to new regions. LRBs keep the mutator coherent.
6. **Init Update Refs** (STW, very short).
7. **Concurrent Update References**. Walk the heap and update all references to point to new locations.
8. **Final Update Refs** (STW, short). Update roots.
9. **Concurrent Cleanup**. Reclaim evacuated regions.

Compared to ZGC, Shenandoah has more (but still very brief) STW points and a distinct reference-update phase rather than lazy healing via load barriers.

### 7.6 Modes

Shenandoah supports several heuristics/modes:

- `adaptive` (default): the normal concurrent mode.
- `static`: fixed thresholds instead of adaptive heuristics.
- `compact`: aggressive compaction, for memory-constrained environments.
- `passive`: disable concurrent work, fall back to STW — for debugging.

### 7.7 Generational Shenandoah

A generational Shenandoah effort is in progress as a separate work stream, bringing a young/old split similar to generational ZGC. [CHECK: current status in OpenJDK mainline.]

### 7.8 Notable Flags

```bash
-XX:+UseShenandoahGC
-XX:ShenandoahGCHeuristics=adaptive
-XX:ShenandoahGCMode=normal
-XX:ConcGCThreads=4
```

---

## 8. Epsilon — The No-Op Collector

```bash
java -XX:+UnlockExperimentalVMOptions -XX:+UseEpsilonGC -jar app.jar
```

Epsilon is a **no-op collector**: it handles allocation but never reclaims memory. When the heap is exhausted, the JVM dies with `OutOfMemoryError`. Introduced in **JDK 11 (JEP 318)**.

### 8.1 Why It Exists

- **Performance testing**: isolate GC overhead from application overhead. Run a benchmark under Epsilon to measure "zero-GC" performance as a baseline.
- **Last-drop latency**: some short-lived processes do not live long enough to trigger a collection under any real collector; Epsilon removes barrier overhead entirely.
- **Memory pressure testing**: simulate heap exhaustion deterministically.
- **VM interface testing**: a minimal GC implementation useful for testing the JVM's GC-interface contract.
- **Short-lived jobs**: CLI tools, one-shot scripts.

### 8.2 Characteristics

- Zero GC pauses — by definition.
- Zero throughput overhead from GC barriers (the GC-interface barriers are still compiled in, but they are no-ops).
- Heap grows until exhausted, then the JVM terminates. No recovery.

### 8.3 Notable Flags

```bash
-XX:+UnlockExperimentalVMOptions -XX:+UseEpsilonGC
-Xmx4g                              # Must size heap for expected lifetime
-XX:+AlwaysPreTouch                 # Pre-touch pages at startup
```

---

## 9. Azul C4 — Continuously Concurrent Compacting Collector

C4 is a commercial collector shipped with **Azul Zing** (now **Azul Platform Prime**, formerly **Azul Prime**). It is not open-source. It is the technical ancestor of ZGC and Shenandoah: Azul demonstrated truly pauseless compacting GC at multi-hundred-GB scale years before OpenJDK caught up.

### 9.1 Design

- **Fully concurrent** marking, relocation, and reference processing.
- **Load Value Barrier (LVB)**: a concurrent read barrier implemented via operating-system page protections and/or instruction-set tricks. A reference load that encounters a "stale" reference is intercepted, the reference is healed, and the mutator continues.
- **Guaranteed bounded pause times** independent of heap size or live set. Azul markets this as "pauseless" — pauses on the order of sub-millisecond even at multi-TB heap sizes.
- **Originally required specialized hardware** (Azul's Vega appliance, a custom CPU with hardware read barriers and massive core counts), but since Zing on x86-64 it runs on commodity hardware using software read barriers, aided by kernel patches ("Zing kernel module") on Linux.

### 9.2 Use Cases

- **High-frequency trading and market data**: single-digit-millisecond SLAs, multi-hundred-GB in-memory order books, millions of messages per second.
- **Low-latency financial services** generally.
- **Large-scale caches** where full-heap scans under G1/ZGC would blow latency budgets.
- **SaaS platforms** needing consistent tail latency.

### 9.3 Notes

C4 predates ZGC by roughly a decade. Many of the ideas in ZGC (colored pointers, concurrent relocation, load barriers) are reimplementations of concepts Azul pioneered. If your workload genuinely requires guaranteed sub-millisecond pauses at TB-scale heaps and your budget supports it, Azul remains the reference point.

---

## 10. OpenJ9 Collectors (IBM / Eclipse OpenJ9)

Eclipse OpenJ9 is a separate Java VM implementation (formerly IBM J9), originally developed for IBM's enterprise middleware (WebSphere, DB2, i5/OS) and now open-source under the Eclipse Foundation. It is a full alternative to HotSpot with its own distinct GC family. You select a collector by policy:

```bash
java -Xgcpolicy:gencon -jar app.jar
```

### 10.1 gencon (Generational Concurrent) — Default

- Generational with a copying young generation (Nursery) and a concurrent mark-sweep old generation (Tenure).
- The default policy, roughly analogous to CMS-with-ParNew on HotSpot.
- Good for typical transactional and web workloads.

### 10.2 balanced

```bash
-Xgcpolicy:balanced
```

- Region-based, similar in spirit to G1.
- Targets large heaps with predictable pauses.
- Uses NUMA-aware allocation on large servers.
- Introduced to provide G1-like behavior in OpenJ9.

### 10.3 optthruput (Optimize for Throughput)

```bash
-Xgcpolicy:optthruput
```

- Flat heap, parallel mark-sweep-compact, fully STW.
- Analogous to HotSpot ParallelGC.
- Best throughput for batch workloads.

### 10.4 optavgpause (Optimize for Average Pause)

```bash
-Xgcpolicy:optavgpause
```

- Concurrent mark and sweep, not generational.
- Targets applications that need pause consistency without wanting a generational design.

### 10.5 metronome (Real-Time)

```bash
-Xgcpolicy:metronome
```

- Deterministic incremental GC with hard pause-time guarantees, designed for real-time Java (IBM WebSphere Real Time).
- Trades throughput for rigidly predictable bounded pauses measured in single-digit milliseconds.

OpenJ9 is notable for its aggressive memory footprint optimization — its shared class cache and ahead-of-time compilation features historically made it a favored JVM for cloud and container deployments where density matters.

---

## 11. Collector Selection Matrix

Quick starting points for collector choice. *None of these are definitive* — always benchmark your workload.

| Workload | Heap size | Latency need | Recommended |
|---|---|---|---|
| Embedded / CLI tool | < 100 MB | Any | **Serial** |
| Batch job (ETL, scientific) | Any | Minutes OK | **Parallel** |
| Typical web service | 4-32 GB | < 200 ms p99 | **G1** (default) |
| Low-latency microservice | 4-64 GB | < 10 ms p99 | **ZGC** (generational) |
| Huge heap, low latency | 64 GB - 16 TB | < 10 ms p99 | **ZGC** or **Shenandoah** |
| Ultra-low-latency (HFT, trading) | 100 GB - 1 TB | < 1 ms p99 | **Azul C4** |
| Benchmark / perf baseline | Any | Zero GC | **Epsilon** |
| Very memory-constrained | < 100 MB | Any | **Serial** or tuned **G1** |
| Java 8 legacy | Any | Any | **G1** (preferred) or **Parallel** |
| Container with strict CPU limit | < 4 GB | Moderate | **Serial** or **G1** |

### 11.1 Rules of Thumb

- **Start with G1.** It's the default for a reason. Tune only after measuring.
- **Small heaps (< 500 MB) + single or dual core**: Serial wins. The concurrency machinery in G1/ZGC is overkill and the overhead dominates.
- **Pause sensitivity dominates**: ZGC (generational) is the modern answer. Shenandoah is equivalent in OpenJDK distributions that ship it.
- **Throughput dominates, latency doesn't**: Parallel.
- **Heap > 32 GB with latency goals**: ZGC or Shenandoah.
- **Heap > 1 TB with hard latency SLA**: Azul C4.
- **Ephemeral short-lived JVM**: Epsilon if the job fits in memory; Serial otherwise.

### 11.2 Decision Rubric

1. What is your **p99 pause budget**? If `< 10 ms`, you need ZGC/Shenandoah/C4.
2. What is your **heap size**? If `< 100 MB`, Serial. If `> 32 GB`, skip Parallel and G1. If in between, G1 is the default answer.
3. What is your **CPU budget**? If you have few cores and throughput is paramount, Parallel. If you have many cores and latency matters, a concurrent collector.
4. Do you tolerate **occasional long pauses** (> 1 s) for the sake of throughput? If yes, Parallel. If no, avoid it.
5. Are you on **OpenJDK** or **Oracle JDK**? Shenandoah may not be available on Oracle binaries.

---

## 12. Shared Internals

Regardless of which collector you pick, several pieces of HotSpot machinery are invariant:

### 12.1 TLABs — Thread-Local Allocation Buffers

Each mutator thread gets a **TLAB**: a small (typically a few KB to low MB) slice of Eden that it can allocate into using a simple bump pointer without any synchronization. When a thread's TLAB fills, it asks for a new one from the shared Eden, which is a rare synchronized operation.

TLABs are the reason Java allocation is so fast — the common-case allocation path is literally a few instructions (bump pointer, check limit). All HotSpot collectors use TLABs.

```bash
-XX:+UseTLAB                        # Default on
-XX:TLABSize=256k                   # Hint; actual size is dynamic
-XX:-ResizeTLAB                     # Disable dynamic resizing
-XX:+PrintTLAB                      # Diagnostic
```

### 12.2 Card Tables

A card table is a byte array where each byte covers a 512-byte region of the heap. When a write barrier executes on a pointer store to an old-generation object, it marks the corresponding card as dirty. At young-collection time, the collector scans only the dirty cards to find old-to-young pointers, rather than scanning the entire old generation.

Card tables are used by Serial, Parallel, and G1 (G1 in addition to its per-region remembered sets).

### 12.3 Write Barriers

- **Card-marking barrier** (Serial, Parallel, ParNew): `card[addr >> 9] = dirty`.
- **SATB barrier** (G1, Shenandoah, CMS-hybrid): record the **previous** value of the field in a mutator-local buffer before the store.
- **Post-write barrier for remembered-set maintenance** (G1): filter out same-region stores, enqueue cross-region stores in the dirty-card queue.

Barriers are a few instructions each and are emitted inline by the JIT. For extremely allocation-heavy code, they add up; for most code, they are lost in the noise.

### 12.4 Load Barriers (Read Barriers)

ZGC and Shenandoah inject a load barrier on every **reference** load (not primitive loads). The barrier checks metadata — colored pointer bits in ZGC, a forwarding check in Shenandoah — and redirects or updates the pointer if needed.

Load barriers are more expensive than write barriers because loads are more frequent than stores in most code. This is the throughput price of concurrent compaction.

### 12.5 Safepoints and Handshakes

The GC coordinates with the mutator via **safepoints**. Classic safepoints halt *all* mutator threads at their next polling site. **Thread-local handshakes** (JEP 312, JDK 10) allow the GC to stop *individual* threads without a global halt, which is essential for sub-millisecond pause goals.

Safepoints are inserted at:

- Method entry and exit
- Loop back-edges (except counted int loops pre-JDK 10, a historical TTSP pitfall)
- Call returns
- VM-internal sites

Time-to-safepoint (TTSP) can be diagnosed with `-XX:+PrintSafepointStatistics` (deprecated) or modern unified logging: `-Xlog:safepoint`.

### 12.6 Concurrent Phases

Modern concurrent collectors share a general phase structure:

1. **Initial STW mark** — scan roots, bootstrap the concurrent work.
2. **Concurrent mark** — walk the graph.
3. **Final STW mark / remark** — drain SATB buffers, finalize.
4. **Concurrent relocate/evacuate** — copy live objects.
5. **Concurrent / incremental ref update** — point mutator references at new locations.
6. **Cleanup** — free old regions.

G1 concurrent-marks but STW-evacuates. ZGC and Shenandoah concurrent-mark *and* concurrent-evacuate. C4 additionally concurrent-updates references.

### 12.7 Reference Processing

`java.lang.ref` provides four reference types the GC must handle specially:

- **SoftReference**: cleared only under memory pressure. Effective for caches.
- **WeakReference**: cleared whenever the referent is not strongly reachable.
- **PhantomReference**: enqueued after the referent has been finalized and GC has determined it is unreachable. Used for post-mortem cleanup.
- **FinalReference**: the mechanism behind `Object.finalize()`, which is deprecated (JEP 421 deprecated finalization in JDK 18).

**Cleaner** (`java.lang.ref.Cleaner`, JDK 9+) is the modern replacement for finalizers — a phantom-reference-based callback mechanism with explicit lifecycle.

Reference processing is historically a major GC cost; G1 and ZGC have optimized it heavily and made it concurrent in most phases.

### 12.8 String Deduplication

```bash
-XX:+UseStringDeduplication
```

G1 and ZGC support deduplicating `String` objects whose internal `char[]` or `byte[]` arrays contain identical content. A background thread inspects young-gen survivors during collection and merges matching strings. Savings vary wildly by workload — from 0% to 30%+ in string-heavy applications.

### 12.9 Class Unloading

Classes are loaded into **Metaspace** (HotSpot, JDK 8+; formerly PermGen). Class unloading happens during a GC cycle that walks the classloader graph. G1, CMS, ZGC, and Shenandoah all support concurrent or incremental class unloading in recent versions.

---

## 13. Historical and Non-Standard Collectors

### 13.1 Reference Counting

Covered in §1.3. Not a JVM production technique. Reference counting's cycle problem and write-barrier cost eliminate it for general Java heap management. Small-scope ref counting appears in implementation details (JNI global refs, Cleaner infrastructure, some off-heap resource tracking).

### 13.2 The Train Algorithm

Richard Jones and others proposed the **Train algorithm** for incremental mature-object compaction: partition the mature generation into trains of cars, collect one car at a time, migrate survivors to the "next" car based on inter-car references. It was implemented in some commercial JVMs (including early Sun HotSpot as an experimental collector: `-XX:+UseTrainGC`). It never became a default and was removed. Its key contribution to the literature was formalizing incremental evacuation with bounded work per step — ideas that G1 later inherited.

### 13.3 Mark-Sweep-Compact Old School

Before generational GC became standard, full-heap mark-sweep-compact was the norm: walk the whole heap on every GC. This is what Serial GC's old-gen full collection still does, and what G1's fallback full GC does when concurrent collection fails to keep up.

### 13.4 JRockit Collectors (Pre-HotSpot Merger)

**BEA JRockit** was the other major commercial JVM before Oracle acquired BEA in 2008 and Sun in 2010. JRockit had its own distinct GC family:

- **Single generational**: parallel copying young + parallel compact old.
- **Dynamic**: heuristic-based collector selection.
- **Deterministic GC**: bounded-pause incremental collector for JRockit Real Time, with pause guarantees. Closest HotSpot analogue is Metronome on OpenJ9.

After the mergers, Oracle committed to converging on HotSpot. JRockit features migrated selectively into HotSpot (JMX management improvements, JRockit Mission Control → Java Mission Control → Java Flight Recorder, JFR). The collectors themselves were not ported; HotSpot's G1 and later ZGC served the low-pause niche.

---

## 14. Comparison Table

| Collector | Gen? | Concurrent? | Compacting? | Pause target | Heap range | JDK | Best for |
|---|---|---|---|---|---|---|---|
| **Serial** | Yes | No | Yes (STW) | Seconds | < 100 MB | 1.1+ | Tiny heaps, CLI |
| **Parallel** | Yes | No | Yes (STW) | Seconds | < 16 GB | 1.4+ | Batch throughput |
| **CMS** (removed) | Yes | Old gen only | **No** | 10s-100s ms | < 32 GB | 1.4-13 | Legacy low-latency |
| **G1** | Yes | Mark only | Yes (STW evac) | `MaxGCPauseMillis` (soft) | 4 GB - ~100 GB | 7u4+, default 9+ | Default, most workloads |
| **ZGC** | Since JDK 21 | Fully | Yes (concurrent) | < 10 ms (often < 1 ms) | 8 MB - 16 TB | 11+ (prod 15+) | Large heaps, low latency |
| **Shenandoah** | In progress | Fully | Yes (concurrent) | < 10 ms | 1 GB - multi-TB | 12+ (prod 15+) | OpenJDK low latency |
| **Epsilon** | No | — | — | Zero (no GC) | Whatever fits | 11+ | Perf testing, throwaways |
| **Azul C4** | Yes | Fully | Yes (concurrent) | < 1 ms, guaranteed | Up to multi-TB | Azul Prime (8, 11, 17, 21) | HFT, finance |
| **OpenJ9 gencon** | Yes | Old gen only | Yes | Tens of ms | Any | OpenJ9 | OpenJ9 default |
| **OpenJ9 balanced** | Yes | Mark | Yes | Tens of ms | Large | OpenJ9 | OpenJ9 G1-alternative |
| **OpenJ9 metronome** | — | Incremental | Yes | Hard ms bound | Moderate | OpenJ9 RT | Real-time Java |

---

## 15. Activating, Observing, and Comparing Collectors

### 15.1 Selecting and Logging

```bash
# Select collector
java -XX:+UseG1GC         -jar app.jar
java -XX:+UseParallelGC   -jar app.jar
java -XX:+UseZGC -XX:+ZGenerational -jar app.jar
java -XX:+UseShenandoahGC -jar app.jar
java -XX:+UseSerialGC     -jar app.jar
java -XX:+UnlockExperimentalVMOptions -XX:+UseEpsilonGC -jar app.jar

# Unified GC logging (JDK 9+)
java -Xlog:gc*:file=gc.log:time,uptime,level,tags -jar app.jar

# Short summary
java -Xlog:gc -jar app.jar

# Deep detail
java -Xlog:gc+heap=debug,gc+ergo*=debug,gc+age=trace -jar app.jar
```

### 15.2 Verifying the Selection at Runtime

```bash
# Via JCMD
jcmd <pid> VM.flags | grep GC
jcmd <pid> GC.heap_info
jcmd <pid> VM.native_memory summary

# Via JMX / JFR
java -XX:StartFlightRecording=filename=app.jfr,duration=60s -jar app.jar
jfr print --events GCHeapSummary,GCPhasePauseLevel1 app.jar

# Via VM.system_properties
jcmd <pid> VM.system_properties | grep -i gc
```

### 15.3 Diagnosing Pause Problems

```bash
# Print STW pauses with causes
java -Xlog:gc,gc+phases:stdout -jar app.jar

# Safepoint timing (time-to-safepoint)
java -Xlog:safepoint -jar app.jar

# Full safepoint stats (deprecated in JDK 9+, use unified logging)
-XX:+PrintGCApplicationStoppedTime
-XX:+PrintGCApplicationConcurrentTime
```

### 15.4 Example GC Log Snippets

```
# G1 young collection
[0.523s][info][gc] GC(0) Pause Young (Normal) (G1 Evacuation Pause) 24M->5M(254M) 6.842ms

# ZGC cycle
[2.105s][info][gc] GC(3) Garbage Collection (Proactive)
[2.105s][info][gc] GC(3) Pause Mark Start 0.421ms
[2.118s][info][gc] GC(3) Concurrent Mark 12.945ms
[2.118s][info][gc] GC(3) Pause Mark End 0.298ms
[2.120s][info][gc] GC(3) Concurrent Process Non-Strong References 1.203ms
[2.121s][info][gc] GC(3) Concurrent Reset Relocation Set 0.127ms
[2.123s][info][gc] GC(3) Concurrent Select Relocation Set 1.892ms
[2.123s][info][gc] GC(3) Pause Relocate Start 0.205ms
[2.135s][info][gc] GC(3) Concurrent Relocate 11.821ms
[2.135s][info][gc] GC(3) Garbage Collection (Proactive) 240M(12%)->60M(3%)
```

---

## 16. Summary

The HotSpot JVM and its cousins give you an unusually rich menu of garbage collectors, each occupying a distinct point in the pause/throughput/footprint space. The menu reflects decades of co-evolution between hardware, language workloads, and GC research:

- **Serial** and **Parallel** remain the right answers for their narrow niches (tiny heaps; pure throughput batch).
- **G1** is the sensible default for the overwhelming majority of workloads — from typical web services to multi-tens-of-GB backends.
- **ZGC** (now generational) is the modern answer for latency-sensitive services at any heap size, approaching Azul C4 territory for free on OpenJDK.
- **Shenandoah** is ZGC's contemporary in OpenJDK distributions where it ships, with a somewhat different engineering approach to the same goal.
- **Epsilon** is the right answer to a narrow question ("how much does my code spend on GC?").
- **Azul C4** remains the reference implementation for guaranteed sub-millisecond pauses at TB scale, at the cost of a commercial license.
- **OpenJ9** offers a parallel collector family in a different JVM implementation, with strong memory-footprint characteristics for container workloads.

The right choice depends on your workload's pause budget, heap size, CPU budget, and whether "usually fast" or "always fast" matters more. Always measure — collector choice tuning without empirical data is cargo-culting.

The trend is clear: over the past decade, the Pareto frontier of the pause/throughput/footprint triangle has moved steadily outward. Workloads that required commercial JVMs and custom hardware a decade ago now run on stock OpenJDK with sub-millisecond pauses on terabyte heaps. The next frontier is closing the throughput gap between concurrent collectors and classical throughput collectors — and generational ZGC is the most aggressive step in that direction yet.

---

## 17. Addendum: The JDK 25 LTS generational transition (2025–2026)

This section was added in April 2026 as part of a catalog-wide enrichment
pass. The main body above identifies generational ZGC as the most
aggressive step toward closing the throughput gap. The 2025 release
train took that from aspiration to default, and is worth recording.

### ZGC — generational becomes the only flavor

**JDK 25 (September 16, 2025, LTS)** is the first Java release in which
Generational ZGC is the **only** flavor of the ZGC collector. The
non-generational version, which had been the original ZGC from JDK 11
through JDK 20, was deprecated in JDK 21 and removed in JDK 25. A user
who selects `-XX:+UseZGC` on JDK 25 or later gets the generational
variant unconditionally. The option to select the old non-generational
ZGC is gone.

This matters for the main-body framing because the narrative above
treated "ZGC is now generational" as a feature toggle. On JDK 25 LTS
it is not a toggle — it is the *only* thing the flag name means. The
next decade of ZGC-based OpenJDK deployments will all run the
generational variant.

Observed performance characteristics from the 2025 field literature,
for a deployment with GC pressure on the order of a normal server
application:

- **Pause times** — consistently **0.1–0.5 ms regardless of heap size**,
  with occasional spikes to ~1 ms under extreme allocation pressure.
  Heaps in the hundreds of GB and heaps in the single-GB range have
  the same pause distribution.
- **Memory overhead** — **15–30% more** than G1 for the same heap,
  because the concurrent machinery needs working space that G1 does
  not.
- **CPU overhead** — **5–10% more** than G1 for the same throughput,
  for the same reason.
- **Throughput** — generational ZGC closes most of the throughput gap
  to G1 for typical young-allocation-dominated workloads, which was
  the primary motivation for adding the generational split to the
  collector in the first place.

ZGC on JDK 25 is now the answer for latency-sensitive services that
previously had to choose between C4 (commercial) and the old
non-generational ZGC (high throughput penalty). Stock OpenJDK ships
the working answer.

**Source:** [Pauseless Garbage Collection in Java 25: ZGC Guide — Andrew Baker's Technology Blog, December 2025](https://andrewbaker.ninja/2025/12/03/deep-dive-pauseless-garbage-collection-in-java-25/)

### Shenandoah — generational is no longer experimental

The Shenandoah collector followed a parallel arc. Through JDK 21–24
the generational version of Shenandoah was tagged `experimental` and
required an unlock flag. **JDK 25 (September 2025)** promoted
generational Shenandoah to production status and made it the
**default** when `-XX:+UseShenandoahGC` is selected. The
non-generational Shenandoah is still available behind a mode flag but
is no longer the default.

Observed 2025-era Shenandoah characteristics:

- **Pause times** — typically **1–10 ms**, with most pauses under 5 ms.
  This is higher than ZGC's sub-millisecond numbers but well inside
  the range most latency-sensitive applications can tolerate.
- **Memory overhead** — lower than ZGC, thanks to compressed oops
  support.
- **Throughput** — the generational transition closed a significant
  gap to G1 on young-allocation-heavy workloads, similar in shape to
  what ZGC saw.

Shenandoah's niche is teams that want concurrent GC without paying
ZGC's memory footprint. The JDK 25 generational landing is the event
that makes that niche real at production scale.

**Source:** [New in Java 25: Generational Shenandoah GC is no longer experimental — The Perf Parlor, September 14, 2025](https://theperfparlor.com/2025/09/14/new-in-java25-generational-shenandoah-gc-is-no-longer-experimental/)

### G1 is still the sensible default

The practitioner writing that settled in the second half of 2025 and
early 2026 is consistent on one point that the main body above gets
right: **G1 remains the sensible default for the overwhelming
majority of workloads.** The reasons have not changed — G1's balance
of pause, throughput, memory footprint, and operational familiarity
still fits most web services, most REST/RPC backends, most message-bus
consumers, and most multi-tens-of-GB application tier deployments.

What *has* changed is the shape of the G1-vs-X decision. Through 2024
the question was "G1 or ZGC?" with "or Shenandoah?" as a minority
position. In 2025 the question became a three-way:

1. **G1** — default for "normal" workloads where the pause budget is
   generous (tens of ms are tolerable) and the CPU budget is tight.
2. **ZGC (generational)** — for latency-sensitive workloads where the
   pause budget is under ~1 ms and the CPU and memory budgets have
   headroom.
3. **Shenandoah (generational)** — for latency-sensitive workloads
   where the pause budget is in the 1–10 ms range and the memory
   budget is tight.

The binary throughput-vs-latency tradeoff that shaped the JDK 8–11
conversation is now a three-way Pareto, and all three points on the
frontier have been production-quality since JDK 25.

**Sources:** [The JVM Garbage Collector Decision in 2026: G1 vs ZGC vs Shenandoah for Real Workloads — Java Code Geeks](https://www.javacodegeeks.com/2026/04/the-jvm-garbage-collector-decision-in-2026-g1-vs-zgc-vs-shenandoah-for-real-workloads.html) · [G1, ZGC, and Shenandoah: OpenJDK's Garbage Collectors for Very Large Heaps — IBM Community, September 2025](https://community.ibm.com/community/user/blogs/theo-ezell/2025/09/03/g1-shenandoah-and-zgc-garbage-collectors) · [G1 vs ZGC vs Shenandoah: The Best Java Garbage Collector for Large Heaps (2025 Guide) — DEV Community](https://dev.to/webmethodman/g1-vs-zgc-vs-shenandoah-the-best-java-garbage-collector-for-large-heaps-2025-guide-n1i)

### What this means for the summary

The Section 16 summary above lists the collectors as a menu, with G1
as the sensible default and ZGC-now-generational as the modern answer
for latency-sensitive work. That framing is still correct; what has
moved in 2025 is that **both** the concurrent collectors in OpenJDK
(ZGC and Shenandoah) are now production-grade generational collectors
by default, and the throughput gap that had historically made them
niche choices has narrowed substantially.

"Closing the throughput gap between concurrent collectors and classical
throughput collectors" was described above as the next frontier. As of
JDK 25 LTS, the gap is closed enough that production teams running
latency-sensitive services on ZGC or Shenandoah are no longer paying
a 20–30% throughput penalty relative to G1 — they are paying more like
a 5–10% CPU and 15–30% memory penalty, and for many workloads the
tradeoff now makes sense.

## Related College Departments

This research cross-links to the following college departments in
`.college/departments/`:

- [**engineering**](../../../.college/departments/engineering/DEPARTMENT.md)
  — Garbage collection is a systems-engineering topic. Collector
  choice is a worked example of Pareto-optimal design trade-offs
  under multi-dimensional constraints (pause, throughput, memory,
  CPU, predictability).
- [**coding**](../../../.college/departments/coding/DEPARTMENT.md) —
  For the algorithms-and-data-structures side: generational
  collectors, tri-color marking, remembered sets, write barriers,
  concurrent compaction — all of these are concrete algorithm
  instances for abstract concepts in the Algorithms & Efficiency wing.
- [**mathematics**](../../../.college/departments/mathematics/DEPARTMENT.md)
  — Pause-time distributions, allocation-rate curves, and the
  throughput-latency-footprint frontier are all graph-theoretic and
  statistical objects that can be studied with formal tools.
- [**cloud-systems**](../../../.college/departments/cloud-systems/DEPARTMENT.md)
  — In 2026 the JVM runs most enterprise cloud workloads. GC tuning
  is one of the cloud-systems operational-concerns topics that every
  SRE team eventually encounters.

---

*Addendum (JDK 25 LTS generational transition) and Related College Departments cross-link added during the Session 018 catalog enrichment pass.*

---

## Study Guide — JVM GC Collectors

### Key concepts

1. **Serial, Parallel, G1, ZGC, Shenandoah.** Five production
   collectors, each with a design point.
2. **Generational hypothesis.** Most objects die young. Nurseries
   and old generations exploit this.
3. **Pause time vs throughput.** The classic tradeoff. ZGC aims
   for sub-millisecond pauses at the cost of some throughput.
4. **Concurrent marking.** Marking while the mutator runs, at the
   cost of barriers.
5. **Compaction.** Moving live objects to eliminate fragmentation.

---

## Programming Examples

### Example 1 — Pick a collector by workload

```
# Batch throughput: ParallelGC
-XX:+UseParallelGC

# Balanced server: G1 (default in JDK 9+)
-XX:+UseG1GC

# Low-latency service: ZGC
-XX:+UseZGC

# Shenandoah (Red Hat): low pause, different tradeoffs
-XX:+UseShenandoahGC
```

---

## DIY & TRY

### DIY 1 — Compare collectors on the same workload

Pick a Java benchmark (DaCapo or Renaissance). Run with each
of G1, ZGC, and ParallelGC. Chart p50 and p99 pauses.

### DIY 2 — Read one GC paper

Cheney's algorithm (1970) is 3 pages. Read it. You'll
understand the basis for every moving collector since.

### TRY — Migrate a service from G1 to ZGC

Pick a real service with tail-latency SLOs. Switch to ZGC.
Measure. Most teams see p99 improvements of 5-10x.

---

## Related College Departments

- [**engineering**](../../../.college/departments/engineering/DEPARTMENT.md)
- [**mathematics**](../../../.college/departments/mathematics/DEPARTMENT.md)
