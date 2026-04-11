# JVM GC Tuning: Flags, Heuristics, and Workload Matching

> "Don't tune until you have a problem, and even then, measure first."
> &mdash; paraphrasing the consensus advice from the HotSpot team

Garbage collection tuning is the art of trading one thing you don't care about
for another thing you do. Most developers never need to tune GC. A small
minority spend their entire careers doing it. This document is for the second
group, and for the first group when they suddenly find themselves in the second
group at 3am.

The JVM in 2026 gives you five production collectors (Serial, Parallel, G1,
ZGC, Shenandoah), one experimental one (Epsilon), and a collection of around
600 tunable flags. This guide covers the ones that actually matter, the
decision tree for choosing among collectors, and the methodology that
separates confident tuning from cargo-cult tuning.

---

## 1. The GC Tuning Triangle

Every garbage collector design is a choice among three properties:

```
              Throughput
                 /\
                /  \
               /    \
              /      \
             /        \
            /          \
           /____________\
      Latency        Footprint
```

- **Throughput** is the fraction of wall-clock time the CPU spends running
  application code versus running GC code. A 98% throughput JVM spends 2% of
  its cycles collecting garbage. For batch workloads that run for hours, 1%
  of throughput translates directly to money.

- **Latency** (or pause time) is the longest stop-the-world interruption
  caused by GC. For an interactive HTTP service, a 500 ms pause is a
  customer-visible hiccup. For a high-frequency trading system, a 1 ms pause
  is a career-ending event.

- **Footprint** is how much memory the JVM uses to do its job. A collector
  with lots of concurrent work needs bookkeeping structures (remembered sets,
  mark bitmaps, forwarding tables) that can easily add 10-20% overhead on top
  of the live set. Some collectors need 3x the live set to function well.

**You cannot optimize all three simultaneously.** Any GC tuning decision is
implicitly (or explicitly) a choice about which corner of the triangle you
are willing to sacrifice.

| Collector | Throughput | Latency | Footprint |
|-----------|:----------:|:-------:|:---------:|
| Serial | Medium | Worst | Best |
| Parallel | Best | Worst | Good |
| G1 | Good | Good | Medium |
| ZGC | Medium-good | Best | Worst |
| Shenandoah | Medium-good | Best | Medium |
| Epsilon | Perfect (no collection) | Infinite (eventual OOM) | Worst |

A useful mental model: **throughput collectors** (Serial, Parallel) do all
their work during stop-the-world pauses, which minimizes overhead but makes
pauses long. **Concurrent collectors** (G1, ZGC, Shenandoah) do most work
while the application runs, trading CPU and memory overhead for pause time.
G1 is a compromise that still has long mixed-GC pauses; ZGC and Shenandoah
are true sub-millisecond collectors that pay for it in footprint and steady
CPU load.

---

## 2. Workload Taxonomies: Matching a Collector to the Job

### 2.1 Batch Jobs &mdash; "pauses don't matter, throw CPU at it"

Spark jobs, ETL pipelines, report generators, nightly aggregations, data
science batch runs. These workloads:

- Run for minutes to hours.
- Have no user waiting on a specific request.
- Care about total elapsed time, not tail latency.
- Can tolerate multi-second GC pauses if it means finishing 5% faster overall.

**Use Parallel GC.** It's the fastest collector HotSpot has ever shipped
for this workload class. G1 will underperform by 5-15% on throughput-bound
batch jobs because of its concurrent marking overhead, and ZGC will
underperform Parallel by 10-20% because of load barriers.

```bash
java -XX:+UseParallelGC \
     -Xms16g -Xmx16g \
     -XX:+AlwaysPreTouch \
     -XX:-UseAdaptiveSizePolicy \
     -jar etl-job.jar
```

### 2.2 Latency-Sensitive Services

HTTP microservices, gRPC backends, chat servers, anything with an SLA
measured in milliseconds. These workloads:

- Have thousands or millions of requests per second.
- Care about p99 and p99.9 tail latency.
- Get paged when tail latency exceeds a threshold.
- Are often running in containers with fixed resource limits.

**Default to G1** for heaps 2-32 GB with SLA requirements of 100-500 ms.
**Switch to ZGC** when you need sub-10ms pauses, or when the heap is large
(> 32 GB), or when G1's mixed GC pauses are causing SLA misses.

```bash
java -XX:+UseG1GC \
     -Xms4g -Xmx4g \
     -XX:MaxGCPauseMillis=100 \
     -XX:+UseStringDeduplication \
     -XX:+HeapDumpOnOutOfMemoryError \
     -jar service.jar
```

### 2.3 Big Heap Analytics

Cassandra nodes, Elasticsearch data nodes, Druid historicals, in-memory
caches with 64-256 GB of heap. Both throughput AND predictability matter:
these systems are latency-sensitive but also process enormous amounts of
data.

**ZGC is usually the right answer** starting around 16 GB. It scales
linearly to multi-terabyte heaps without the pause-time degradation that
G1 and Parallel exhibit.

```bash
java -XX:+UseZGC -XX:+ZGenerational \
     -Xms64g -Xmx64g \
     -XX:SoftMaxHeapSize=56g \
     -XX:+AlwaysPreTouch \
     -jar cassandra.jar
```

### 2.4 Short-Lived CLI Tools and Scripts

`mvn`, `gradle`, `sbt`, small utility programs, Lambda functions.
Startup latency dominates. GC throughput is irrelevant because the program
exits before the first full GC would ever have mattered.

**Use Serial GC** (lowest overhead, zero concurrent threads) or
**Epsilon** (no GC at all &mdash; the program OOMs when the heap fills, but
if it never fills before exit, free performance). Better yet: build a
**GraalVM Native Image** and skip the JVM entirely.

```bash
java -XX:+UseSerialGC -Xms64m -Xmx256m -jar cli-tool.jar

# Or with Epsilon (JEP 318, Java 11+)
java -XX:+UnlockExperimentalVMOptions -XX:+UseEpsilonGC -Xmx2g -jar short-job.jar
```

### 2.5 Ultra-Low-Latency / HFT

Trading systems, market-data handlers, real-time risk engines. Pauses of
any kind are unacceptable. A 1 ms GC pause at the wrong moment loses
money.

**Commercial Azul C4** remains the gold standard. It is the only collector
with truly pauseless operation under any load. **Carefully tuned ZGC** is
the best free option, but ZGC still has brief pauses during phase changes
(typically sub-millisecond on Java 21+) and allocation stalls are possible
under extreme allocation rates.

```bash
java -XX:+UseZGC -XX:+ZGenerational \
     -Xms16g -Xmx16g \
     -XX:+AlwaysPreTouch \
     -XX:+UseLargePages \
     -XX:+UseTransparentHugePages \
     -XX:-UseBiasedLocking \
     -jar trading-engine.jar
```

Real HFT shops typically go further: object pooling, off-heap storage via
Chronicle/Aeron, GC-free inner loops, and sometimes pinned threads on
isolated CPU cores with `taskset` and `isolcpus`.

### 2.6 Embedded / Tiny Heap

IoT devices, Raspberry Pi deployments, anything with 64-256 MB of heap.
Footprint matters more than throughput or latency.

**Serial GC** is the only sane choice. It has no concurrent threads, no
remembered sets, no mark bitmaps &mdash; the smallest possible GC footprint.

```bash
java -XX:+UseSerialGC -Xms32m -Xmx128m \
     -XX:MaxMetaspaceSize=48m \
     -XX:ReservedCodeCacheSize=32m \
     -jar embedded-app.jar
```

---

## 3. The First Questions Every Tuner Should Ask

Before touching a single flag, answer these questions. If you can't answer
them, your tuning will be guessing dressed up as engineering.

### 3.1 What collector are you currently running?

```bash
# Print active GC
jcmd <pid> VM.flags | grep -i gc
java -XX:+PrintFlagsFinal -version | grep -E "Use.*GC" | grep "= true"
```

On Java 9+, the default is G1. On Java 8, the default is Parallel. If
you're on Java 8, that's itself a tuning decision &mdash; modern collectors
have moved on.

### 3.2 What is your heap size?

```bash
jcmd <pid> VM.flags | grep -E "(Xmx|Xms|MaxHeapSize|InitialHeapSize)"
```

If `Xms != Xmx`, you have heap-resize pauses built in. Fix that first.

### 3.3 What are your actual goals?

Write them down as numbers, not adjectives:

- "p99 GC pause < 50 ms"
- "GC overhead < 5% of CPU time"
- "heap footprint < 4 GB"

"Fast" is not a goal. "As low latency as possible" is not a goal. Without
numbers you will tune forever and never finish.

### 3.4 What is your measurement infrastructure?

- GC logs (`-Xlog:gc*:file=gc.log:time,uptime,level,tags:filecount=10,filesize=100M`)
- Application metrics (Micrometer, Dropwizard, Prometheus)
- JFR (`-XX:StartFlightRecording=filename=recording.jfr,duration=60s`)
- A way to reproduce production load in a test environment

Without these, you cannot observe whether your changes help or hurt.

### 3.5 Are you in a container?

```bash
# Container-aware JVM flags
-XX:+UseContainerSupport           # default on in Java 10+
-XX:MaxRAMPercentage=75.0          # use 75% of cgroup memory limit
-XX:InitialRAMPercentage=75.0
-XX:ActiveProcessorCount=4         # override CPU detection if needed
```

Cgroups lie to the JVM in various creative ways, and container runtimes add
their own layers. A JVM pinned to 2 CPUs by cgroup might think it has 64.
That breaks GC thread count defaults.

### 3.6 What is the allocation rate?

Allocation rate is the MB/sec of new objects created. This drives young
GC frequency far more than heap size does.

```bash
# From GC logs, sum allocation between Young GCs
jcmd <pid> GC.heap_info
# Or use async-profiler in alloc mode
./profiler.sh -d 30 -e alloc -f alloc.html <pid>
```

Rough guidance: under 100 MB/s is "low," 100 MB/s to 1 GB/s is "typical
web service," 1-10 GB/s is "throughput beast," over 10 GB/s is "rewrite
to stop allocating so much."

### 3.7 What is the live set?

The live set is how much memory is reachable right after a full GC. This
is the floor for your heap size. If live set is 4 GB, a 4 GB heap is
impossible, a 6 GB heap is painful, an 8-12 GB heap is comfortable.

```bash
jcmd <pid> GC.run           # trigger a full GC
jcmd <pid> GC.heap_info     # see resulting heap
```

---

## 4. Sizing the Heap

Heap sizing is the single most impactful tuning decision. Get it right and
most everything else falls into place. Get it wrong and no amount of flag
tweaking will save you.

### 4.1 The live-set multiplier rule

```
Xmx = live_set * multiplier
```

| Workload | Multiplier | Why |
|----------|-----------|-----|
| Parallel GC, batch | 1.5 - 2.0x | Pauses OK, minimize memory |
| G1, web service | 2.5 - 3.0x | G1 wants headroom for mixed GC |
| ZGC | 2.0 - 3.0x | ZGC barriers need working room |
| Shenandoah | 2.0 - 3.0x | Similar to ZGC |

A service with 2 GB live set wants roughly 6 GB of heap on G1. Going to 4
GB will work most of the time and then fall over at peak load with
to-space exhaustion. Going to 16 GB wastes memory and makes mixed GC pauses
longer.

### 4.2 Always set Xms == Xmx on servers

```bash
-Xms8g -Xmx8g
```

If Xms < Xmx, the JVM will grow and shrink the heap as it sees fit.
Growing the heap requires touching new memory pages (possibly forcing a
full GC first on some collectors). Shrinking the heap is worse: it triggers
a stop-the-world pause to relocate live objects and return pages to the
OS. Neither is what you want in production.

On a server with dedicated RAM, commit to the heap you want and stop the
JVM from second-guessing you.

### 4.3 Pretouching

```bash
-XX:+AlwaysPreTouch
```

With this flag, the JVM writes a zero byte to every heap page at startup,
forcing the OS to actually allocate physical memory. Startup is slower (a
few seconds for a large heap) but you avoid page-fault latency during the
first minute of traffic. Always use this on production servers.

### 4.4 Why oversizing can make pauses worse

Intuition says "bigger heap, fewer GCs, better." Reality says: bigger
heap means more memory for the collector to scan during marking, longer
full GC pauses, and &mdash; on G1 &mdash; longer mixed GC pauses because more
regions need evacuating.

The sweet spot is the smallest heap that comfortably holds the live set
with enough slack for the collector to do concurrent work without falling
behind the allocator.

---

## 5. Parallel GC Tuning

Parallel GC is a throughput-oriented, stop-the-world, generational
collector. It is the simplest modern collector and the fastest for batch
workloads.

### 5.1 Core flags

```bash
-XX:+UseParallelGC                    # enable Parallel GC
-XX:ParallelGCThreads=8               # worker thread count (default ~5/8 of CPUs)
-XX:GCTimeRatio=19                    # target 1/(1+19) = 5% GC time
-XX:MaxGCPauseMillis=200              # hint at target pause (soft)
-XX:MaxHeapFreeRatio=70               # shrink heap if free > 70%
-XX:MinHeapFreeRatio=40               # grow heap if free < 40%
-XX:+UseAdaptiveSizePolicy            # auto-tune young/old ratio (default on)
-XX:-UseAdaptiveSizePolicy            # disable for predictable batch runs
```

### 5.2 The GCTimeRatio knob

`GCTimeRatio=N` asks the JVM to keep GC time under 1/(1+N) of total time.
N=19 means 5% (default). N=99 means 1%. A smaller N is a looser target;
a larger N is stricter.

The JVM responds by growing the heap when GC time exceeds the ratio. If
the heap cannot grow (hit Xmx), this flag becomes advisory.

### 5.3 When to disable AdaptiveSizePolicy

For batch jobs with consistent allocation patterns, adaptive sizing can
cause the JVM to thrash the generation boundaries. Disable it and pin the
sizes manually:

```bash
-XX:+UseParallelGC \
-XX:-UseAdaptiveSizePolicy \
-Xms16g -Xmx16g \
-Xmn4g \
-XX:SurvivorRatio=8
```

### 5.4 ParallelGCThreads heuristic

The default formula:

```
if CPU <= 8:  ParallelGCThreads = CPU
else:         ParallelGCThreads = 8 + (CPU - 8) * 5/8
```

This is almost always right. Override only if you're in a container with
a wrong CPU count, or if you want to cap GC CPU usage to leave room for
the application.

---

## 6. G1 GC Tuning

G1 is the default collector since Java 9. It is a region-based,
incrementally-compacting, concurrent-marking collector. It does most
young-gen work stop-the-world but marks the old generation concurrently.

G1 has more tuning knobs than any other collector. Most of them you
should leave alone.

### 6.1 Core flags

```bash
-XX:+UseG1GC                              # enable G1
-XX:MaxGCPauseMillis=200                  # target pause (default 200)
-XX:G1HeapRegionSize=16m                  # region size (auto-computed, override rarely)
-XX:ParallelGCThreads=8                   # STW worker count
-XX:ConcGCThreads=2                       # concurrent worker count (~1/4 of parallel)
-XX:G1NewSizePercent=5                    # min young gen (% of heap)
-XX:G1MaxNewSizePercent=60                # max young gen (% of heap)
-XX:InitiatingHeapOccupancyPercent=45     # start concurrent marking at 45% old gen
-XX:G1ReservePercent=10                   # to-space reservation buffer
-XX:G1MixedGCLiveThresholdPercent=85      # don't mix-collect regions > 85% live
-XX:G1MixedGCCountTarget=8                # spread mixed GC across 8 young GCs
-XX:G1HeapWastePercent=5                  # tolerance for wasted heap
-XX:+UseStringDeduplication               # optional: dedupe equal strings
```

### 6.2 The MaxGCPauseMillis knob

G1 tries to hit the pause target by adjusting young gen size and by
limiting the number of regions collected in each mixed GC. Lower targets
mean smaller young gen (more frequent GCs) and smaller mixed collection
sets (slower old gen cleanup).

Going below 50 ms is usually counterproductive on G1 &mdash; the collector
will shrink young gen so aggressively that you get constant GC, and the
actual pauses still won't hit the target. If you need < 50 ms p99,
switch to ZGC or Shenandoah.

### 6.3 IHOP &mdash; the concurrent marking trigger

`InitiatingHeapOccupancyPercent` controls when G1 starts a concurrent
marking cycle. The default is 45% (of total heap). Two failure modes:

- **Too low**: concurrent marking runs constantly, wasting CPU.
- **Too high**: allocation outpaces marking, G1 runs out of headroom, you
  get a back-to-back full GC disaster.

G1 has **adaptive IHOP** since JDK 9 &mdash; it learns the right value from
observed allocation rates. Leave it on (`-XX:-G1UseAdaptiveIHOP` to
disable). If you must set a manual value, 45% is usually fine. Lower it
to 30-35% if you have bursty allocation.

### 6.4 Humongous objects

G1 treats any object larger than half a region as "humongous" and
allocates it directly into old gen. This can cause:

- Memory fragmentation
- Premature concurrent marking triggers
- Long pauses during humongous region cleanup

**Check your humongous allocation rate:**

```bash
# in gc.log
grep "Humongous" gc.log | wc -l
```

**Mitigations:**

1. Increase region size: `-XX:G1HeapRegionSize=32m` (so the threshold becomes 16 MB)
2. Break up large objects in the application code
3. Monitor with `-Xlog:gc+humongous=debug`

### 6.5 To-space exhaustion

If you see `to-space exhausted` in GC logs, G1 ran out of free regions
during evacuation and had to fall back to a full GC. Responses:

- Increase `G1ReservePercent` from 10 to 15 or 20
- Decrease `InitiatingHeapOccupancyPercent` to start marking earlier
- Increase heap size
- Reduce allocation rate

### 6.6 G1 flags that are mostly ignored

These get set in cargo-culted configs but don't do what you think:

- `-XX:NewRatio` &mdash; G1 computes young gen dynamically, NewRatio is advisory
- `-XX:SurvivorRatio` &mdash; same story
- `-Xmn` (explicit young size) &mdash; actively harmful, disables G1's pause-target logic

---

## 7. ZGC Tuning

ZGC is a concurrent, region-based, colored-pointer collector designed for
sub-millisecond pauses on any heap size from 8 MB to 16 TB. It is the
right answer for big heaps with strict SLAs.

### 7.1 Core flags

```bash
-XX:+UseZGC                           # enable ZGC
-XX:+ZGenerational                    # enable generational ZGC (Java 21+, default 23+)
-Xms16g -Xmx16g                       # heap size
-XX:SoftMaxHeapSize=14g               # preferred max (ZGC stays below if possible)
-XX:ConcGCThreads=2                   # concurrent workers (auto by default)
-XX:ZCollectionInterval=120           # force GC every N seconds (optional)
-XX:+ZProactive                       # let ZGC collect proactively (default on)
-XX:+AlwaysPreTouch                   # commit memory at startup
-XX:+UseLargePages                    # 2MB huge pages (needs kernel config)
```

### 7.2 Generational ZGC

Before Java 21, ZGC was single-generation. JEP 439 (Java 21) introduced
generational ZGC, which reduces CPU overhead by 30-50% for most workloads.
As of Java 23, it's the default when you select ZGC.

```bash
# Java 21: opt-in
java -XX:+UseZGC -XX:+ZGenerational ...

# Java 23+: on by default
java -XX:+UseZGC ...
```

**Always use generational ZGC on Java 21+.** The non-generational version
exists only for legacy reasons.

### 7.3 SoftMaxHeapSize

ZGC has a unique concept: you can set a soft limit below your hard max.
ZGC will try to stay at or below the soft limit under normal load but can
grow up to the hard max during transient spikes.

```bash
-Xmx32g -XX:SoftMaxHeapSize=28g
```

This is ideal for containers with burstable memory limits.

### 7.4 ZGC memory overhead

Historical ZGC (pre-generational) needed roughly 3x the live set because
it maintained two forwarding tables and had triple-colored pointer
overhead. Generational ZGC reduces this substantially &mdash; typical
overhead is now 10-30% on top of live set, comparable to G1.

If you're footprint-constrained, benchmark it. ZGC in 2026 is not the
memory hog it was in 2019.

### 7.5 When ZGC doesn't need tuning

The ZGC philosophy is "set the heap, turn it on." For 90% of workloads,
this is enough:

```bash
java -Xms8g -Xmx8g -XX:+UseZGC -jar app.jar
```

If you find yourself adding more than three ZGC flags, you're probably
fighting the collector and would be better off investigating the
application's allocation pattern.

### 7.6 Allocation stalls

Under extreme allocation rates, ZGC can experience **allocation stalls**
where a mutator thread blocks waiting for the collector. This is rare but
visible in JFR as `Z Allocation Stall` events.

Mitigations:

- Increase heap size
- Increase `ConcGCThreads`
- Reduce allocation rate in the application
- Use `-XX:ZCollectionInterval` to force more frequent GC

---

## 8. Shenandoah Tuning

Shenandoah is Red Hat's concurrent compacting collector. It's included in
OpenJDK builds from Red Hat, Azul, and Amazon Corretto. Similar goals to
ZGC but different implementation (Brooks pointers vs. colored pointers).

### 8.1 Core flags

```bash
-XX:+UseShenandoahGC                              # enable Shenandoah
-XX:ShenandoahGCHeuristics=adaptive               # default
-XX:ShenandoahGCMode=satb                         # default
-XX:ShenandoahAllocSpikeFactor=5                  # tolerance for alloc spikes
-XX:ShenandoahGuaranteedGCInterval=300000         # max interval between GCs (ms)
```

### 8.2 Heuristics

Shenandoah exposes GC triggering policy as a pluggable heuristic:

| Heuristic | Use case |
|-----------|----------|
| `adaptive` | Default; learns from past cycles |
| `static` | Fixed thresholds, predictable behavior |
| `compact` | Minimize footprint, more aggressive |
| `aggressive` | Maximum responsiveness, higher CPU |
| `passive` | Debug only; never triggers concurrent GC |

Most users should stick with `adaptive`. Use `compact` for footprint-
constrained workloads.

### 8.3 Modes

- `satb` (Snapshot-At-The-Beginning, default): mostly concurrent marking
- `iu` (Incremental-Update): alternative marking strategy
- `passive`: stop-the-world only (diagnostic)

Leave this at `satb` unless you're doing research.

### 8.4 Shenandoah vs. ZGC

Both achieve sub-millisecond pauses. Practical differences:

| | ZGC | Shenandoah |
|---|---|---|
| Max heap (Oracle) | 16 TB | 4 TB |
| Load barrier cost | ~3-5% throughput | ~5-10% throughput |
| Generational | Yes (21+) | No (roadmap) |
| Flag count | ~20 | ~40 |
| Widely deployed | Yes | Yes (RHEL, Corretto) |

ZGC has more momentum in 2026. Shenandoah remains a solid choice,
particularly for Red Hat customers.

---

## 9. General-Purpose Flags Every Tuner Should Know

These are not GC-specific but essential for production JVM configuration.

### 9.1 Heap and memory layout

```bash
-Xms4g -Xmx4g                             # min and max heap
-Xss1m                                    # thread stack size (default ~512 KB to 1 MB)
-XX:MaxMetaspaceSize=256m                 # class metadata cap
-XX:MetaspaceSize=128m                    # initial metaspace (triggers first full GC)
-XX:CompressedClassSpaceSize=256m         # compressed class pointers
-XX:ReservedCodeCacheSize=256m            # JIT code cache
-XX:InitialCodeCacheSize=64m
-XX:MaxDirectMemorySize=1g                # direct (off-heap) byte buffers
```

### 9.2 Crash and OOM behavior

```bash
-XX:+HeapDumpOnOutOfMemoryError           # dump heap on OOM
-XX:HeapDumpPath=/var/log/heap.hprof      # where to put it
-XX:+ExitOnOutOfMemoryError               # kill the JVM on OOM
-XX:+CrashOnOutOfMemoryError              # core dump on OOM (for debugging)
-XX:OnOutOfMemoryError="kill -9 %p"       # shell command on OOM
-XX:+UnlockDiagnosticVMOptions
-XX:-OmitStackTraceInFastThrow            # always emit full stack traces
```

Always set `HeapDumpOnOutOfMemoryError` in production. You cannot debug
a post-mortem OOM without a heap dump, and heap dumps must be captured at
the moment of failure.

### 9.3 Container awareness

```bash
-XX:+UseContainerSupport                  # default on in Java 10+
-XX:MaxRAMPercentage=75.0                 # fraction of cgroup limit to use
-XX:InitialRAMPercentage=75.0
-XX:MinRAMPercentage=50.0                 # for small containers (<200MB)
-XX:ActiveProcessorCount=4                # override CPU detection
```

**The 75% rule:** in a container, leave 25% of the cgroup memory limit for
non-heap usage: metaspace, thread stacks, native libraries, direct memory,
JIT code cache, GC data structures. If you set `-Xmx` to the full cgroup
limit, you will get OOMKilled before you ever hit a Java `OutOfMemoryError`.

### 9.4 Diagnostics

```bash
-Xlog:gc*:file=/var/log/gc.log:time,uptime,level,tags:filecount=10,filesize=100M
-XX:+FlightRecorder
-XX:StartFlightRecording=filename=recording.jfr,duration=60s,settings=profile
-XX:+PrintFlagsFinal                      # dump final effective flags
-XX:NativeMemoryTracking=summary          # NMT support
```

---

## 10. Ergonomics: Let the JVM Choose

The most important meta-rule of GC tuning is also the hardest to follow:

> **Leave the defaults alone unless you have a measured problem.**

The HotSpot ergonomics system has been refined for two decades. It knows
more about your hardware than any single-flag answer on Stack Overflow.

### 10.1 The diminishing returns curve

```
Performance
    |
100%|                              __-- (manually tuned 2 weeks)
    |                       ___---
 95%|                 __---       (targeted tuning ~1 day)
    |         ___---
 80%|___---                       (default ergonomics)
    |
    |________________________________________
       default  targeted   obsessive   Effort
```

- **Defaults** get you to about 80% of peak.
- **Targeted tuning** (1-2 days, measurement-driven) gets you to ~95%.
- **Obsessive tuning** (weeks) gets you to 99%, at the cost of a fragile
  configuration that breaks when hardware, load, or JDK version changes.

The 95% point is the sweet spot for almost all production systems. The
99% point is only worth pursuing if you are building a database or a
trading system.

### 10.2 When to override defaults

Override a default only when you can answer all three questions:

1. What is the specific problem I am solving? (e.g., "p99 latency is
   80 ms, I need it under 50 ms")
2. What measurement shows this flag will help?
3. What measurement will tell me if I made it worse?

If you cannot answer any of these, leave the flag alone.

### 10.3 Document every deviation

Every non-default flag in your production config should have a comment
explaining *why* it's there. Six months from now, neither you nor anyone
else will remember.

```bash
# High allocation rate (2 GB/s during peak), needed to avoid to-space exhaustion
-XX:G1ReservePercent=20

# Service has 20 threads max, default was reserving too many for GC
-XX:ParallelGCThreads=4
```

---

## 11. Allocation Rate Matters More Than Heap Size

The most common tuning mistake is treating heap size as the main knob.
The allocation rate of your application is usually the bigger lever,
because it controls how often GC happens.

### 11.1 The key formulas

```
YoungGCFrequency = AllocationRate / YoungGenSize

PromotionRate = LiveSetAfterYoungGC / YoungGCFrequency

OldGenFillTime = (OldGenSize - LiveSet) / PromotionRate

ConcurrentMarkInterval = OldGenFillTime * IHOP%
```

In words: if you allocate 1 GB/s and have a 2 GB young gen, you do a young
GC every 2 seconds. If 10% of young-gen objects survive, you promote 200
MB/s to old gen. A 10 GB old gen with a 2 GB live set fills its free
space in (10 - 2) / 0.2 = 40 seconds between concurrent mark cycles.

### 11.2 Reducing allocation rate

Reducing allocation almost always wins over tuning. Use async-profiler:

```bash
# Record allocation profile
./profiler.sh -d 60 -e alloc -f alloc.html <pid>
```

Common allocation hotspots:

- Unnecessary boxing (`Integer` from `int`, `Long` from `long`)
- Log messages built with string concatenation even when log level is off
- Temporary collections in hot loops (`new ArrayList<>()` per iteration)
- JSON serialization without stream reuse
- `Iterator` allocation on collection traversal

Cutting allocation rate in half is usually worth more than any flag.

### 11.3 Increasing young gen vs. reducing allocation

If you can't reduce allocation, increase young gen. With G1:

```bash
-XX:G1NewSizePercent=30 -XX:G1MaxNewSizePercent=70
```

With Parallel:

```bash
-Xmn4g
```

A larger young gen means fewer young GCs and longer lives for short-lived
objects, improving throughput at the cost of longer young-gen pauses.

---

## 12. Common Tuning Anti-Patterns

### 12.1 Cargo-culted flags

Copying `-XX:+UseG1GC -XX:MaxGCPauseMillis=50 -XX:+UseStringDeduplication
-XX:+ParallelRefProcEnabled -XX:+AlwaysPreTouch -XX:+DisableExplicitGC
-XX:+UseCGroupMemoryLimitForHeap` from a Stack Overflow answer dated 2018.
Half of these flags are removed, deprecated, or ignored in Java 21.

**Fix:** for each flag, check the current OpenJDK source or documentation
to confirm it exists and does what you expect.

### 12.2 Setting Xmx to the container limit

```bash
# Container limit: 4 GB
-Xmx4g   # WRONG
```

The container limit has to cover heap + metaspace + thread stacks + code
cache + direct memory + GC structures + native libraries. Setting `Xmx=4g`
in a 4 GB container is a ticket to `Killed` by the OOM killer.

**Fix:**

```bash
-XX:MaxRAMPercentage=75.0   # let the JVM reserve 25% for non-heap
```

Or manually: `Xmx = container_limit * 0.7`.

### 12.3 Ignoring direct memory

`ByteBuffer.allocateDirect()`, Netty's pooled byte buffers, JNI libraries,
memory-mapped files &mdash; all of these consume memory outside the Java heap
that the GC does not track.

```bash
-XX:MaxDirectMemorySize=1g   # cap direct allocation
-XX:NativeMemoryTracking=summary   # see the breakdown
```

Check with:

```bash
jcmd <pid> VM.native_memory summary
```

### 12.4 Not monitoring allocation rate

If you don't know your allocation rate, you are tuning blind. Add a
Micrometer `JvmGcMetrics` or a Prometheus exporter and graph bytes
allocated per second.

### 12.5 Tuning before measuring

The first rule is: never tune before measuring. The second rule is: never
tune *without* measuring. Both happen.

The ritual: establish a baseline with default flags, define your goal
numerically, change one flag, re-measure, compare. Multi-flag changes
make it impossible to know what helped.

### 12.6 Tuning for the average

"Average GC pause is 30 ms" is a useless statistic. Your users experience
the worst pause you ever have. Tune for p99, p99.9, and the absolute
worst-case pause.

### 12.7 Running CMS in 2026

The Concurrent Mark Sweep collector (`-XX:+UseConcMarkSweepGC`) was
deprecated in Java 9 and **removed in Java 14** (JEP 363). If you still
see this flag anywhere, it's either a config file that has rotted or a
JVM old enough to vote.

**Fix:** migrate to G1 or ZGC. The CMS era is over.

### 12.8 Setting NewRatio with G1

```bash
-XX:+UseG1GC -XX:NewRatio=2   # ignored
```

G1 computes the young generation dynamically to hit the pause target.
`NewRatio` is honored only as a weak hint. If you want to control young
gen on G1, use `G1NewSizePercent` and `G1MaxNewSizePercent`.

### 12.9 +AggressiveOpts

This flag was removed in Java 11. It used to enable speculative
performance optimizations that Oracle was experimenting with. If you see
it in a config file, delete it.

### 12.10 Explicit System.gc() calls

```bash
-XX:+DisableExplicitGC         # turns System.gc() into a no-op
-XX:+ExplicitGCInvokesConcurrent  # makes System.gc() run concurrent GC (G1/ZGC)
```

Libraries that call `System.gc()` are a historical relic (Netty's direct
buffer cleanup used to; modern versions don't). Disable explicit GC in
most production configs. If a library legitimately needs it (RMI is the
classic example), use `ExplicitGCInvokesConcurrent` so the call doesn't
trigger a stop-the-world full GC.

---

## 13. Worked Examples

### 13.1 Spring Boot REST service, 10K req/s, 2 GB heap, p99 < 50 ms

```bash
java \
  -server \
  -XX:+UseG1GC \
  -Xms2g -Xmx2g \
  -XX:MaxGCPauseMillis=40 \
  -XX:G1ReservePercent=15 \
  -XX:InitiatingHeapOccupancyPercent=35 \
  -XX:+AlwaysPreTouch \
  -XX:+HeapDumpOnOutOfMemoryError \
  -XX:HeapDumpPath=/var/log/heap.hprof \
  -XX:+ExitOnOutOfMemoryError \
  -XX:MaxMetaspaceSize=256m \
  -XX:ReservedCodeCacheSize=256m \
  -XX:MaxDirectMemorySize=512m \
  -Xlog:gc*:file=/var/log/gc.log:time,uptime:filecount=10,filesize=100M \
  -jar app.jar
```

**Reasoning:**

- G1 is the right collector for this heap size and latency target.
- `MaxGCPauseMillis=40` pushes G1 to be more aggressive than the 200 ms
  default.
- `G1ReservePercent=15` gives headroom for allocation spikes at 10K rps.
- `IHOP=35` starts concurrent marking earlier to avoid to-space exhaustion.
- Heap dump on OOM with `ExitOnOOM` lets the orchestrator restart.

**Validation:**

```bash
# Watch p99 GC pause over 5 minutes
jcmd <pid> GC.heap_info
grep "Pause" /var/log/gc.log | tail -100 | awk '{print $NF}' | sort -n | tail -5
```

If p99 is still above 50 ms, consider ZGC.

### 13.2 Spark executor, 16 GB heap, max throughput

```bash
spark-submit \
  --conf spark.executor.memory=16g \
  --conf spark.executor.extraJavaOptions=" \
    -XX:+UseParallelGC \
    -XX:ParallelGCThreads=8 \
    -XX:-UseAdaptiveSizePolicy \
    -XX:GCTimeRatio=19 \
    -XX:+AlwaysPreTouch \
    -XX:+HeapDumpOnOutOfMemoryError \
    -Xlog:gc*:file=/tmp/gc.log:time:filecount=5,filesize=50M \
  " \
  --class com.example.Job \
  app.jar
```

**Reasoning:**

- Batch job, pauses don't matter, throughput does: Parallel GC.
- Disable AdaptiveSizePolicy for predictable behavior across runs.
- GCTimeRatio 19 = target 5% GC overhead.
- Don't set `MaxGCPauseMillis` &mdash; it fights Parallel's optimization goal.

**Anti-pattern to avoid:** Spark defaults sometimes ship with G1. G1 is
up to 15% slower than Parallel on Spark workloads. Always override.

### 13.3 Kafka Streams with high off-heap

```bash
java \
  -XX:+UseG1GC \
  -Xms4g -Xmx4g \
  -XX:MaxGCPauseMillis=100 \
  -XX:MaxDirectMemorySize=8g \
  -XX:NativeMemoryTracking=summary \
  -XX:+AlwaysPreTouch \
  -XX:+HeapDumpOnOutOfMemoryError \
  -XX:MaxMetaspaceSize=512m \
  -XX:ReservedCodeCacheSize=256m \
  -Dio.netty.maxDirectMemory=0 \
  -jar kafka-streams-app.jar
```

**Reasoning:**

- Kafka Streams uses RocksDB (native) and Netty (direct buffers). Heap
  is only part of the memory budget.
- `MaxDirectMemorySize=8g` caps direct memory above the heap (you will
  need to size the container at least `heap + direct + 2g overhead`).
- `-Dio.netty.maxDirectMemory=0` tells Netty to respect the JVM's direct
  memory tracking.
- Container memory limit should be: 4g (heap) + 8g (direct) + 2g
  (metaspace + stacks + code cache + RocksDB + native) = 14g.

### 13.4 Container-constrained app at 512 MB

```bash
java \
  -XX:+UseSerialGC \
  -XX:MaxRAMPercentage=70.0 \
  -XX:MinRAMPercentage=70.0 \
  -XX:InitialRAMPercentage=70.0 \
  -XX:MaxMetaspaceSize=96m \
  -XX:ReservedCodeCacheSize=64m \
  -Xss512k \
  -XX:+HeapDumpOnOutOfMemoryError \
  -XX:HeapDumpPath=/tmp/heap.hprof \
  -jar small-service.jar
```

**Reasoning:**

- 512 MB cgroup limit. 70% heap = ~358 MB. Leaves ~150 MB for everything
  else.
- Serial GC has the smallest footprint and lowest concurrent overhead
  &mdash; ideal for small heaps.
- Smaller thread stacks (`Xss512k`) save memory with many threads.
- `MinRAMPercentage` is needed because cgroups under ~200MB trigger
  different defaults.

**Alternative:** GraalVM Native Image. Zero GC memory overhead, ~20 MB
resident. If the startup and functionality fit, this is the right
answer for tiny services in 2026.

---

## 14. When Not to Use the JVM Collector

For a small but real class of workloads, the answer to "how do I tune the
GC?" is "don't use it."

### 14.1 Zero-GC architectures

Several open-source libraries provide GC-free hot paths:

- **LMAX Disruptor** &mdash; ring buffer for inter-thread messaging, no
  per-message allocation.
- **Chronicle** &mdash; off-heap maps, queues, network messaging.
- **Aeron** &mdash; low-latency messaging over UDP and shared memory.
- **Agrona** &mdash; zero-allocation data structures, used by Aeron.

These libraries push the application's hot path off the GC'd heap
entirely. The GC still runs for cold paths (startup, configuration,
periodic tasks) but is irrelevant to steady-state latency.

### 14.2 Off-heap data structures

For huge state that shouldn't be GC-managed:

- **Chronicle Map** &mdash; off-heap key-value, persistent
- **OHC** &mdash; off-heap cache (used by Cassandra)
- **DirectByteBuffer** with manual slab allocation
- **sun.misc.Unsafe** (older) or **java.lang.foreign.MemorySegment** (JEP 454, Java 22+)

The modern Foreign Function & Memory API (Panama, JEP 454) is the
future. It provides safe, GC-free memory access without the hacky
`Unsafe` API.

### 14.3 GraalVM Native Image

```bash
native-image -jar app.jar --no-fallback -O2
```

Native Image compiles the entire program ahead-of-time, including an
embedded runtime. It uses Serial GC by default, but many Native Image
workloads never allocate enough to trigger GC at all. Startup drops from
seconds to milliseconds; memory footprint drops by 5-10x.

Trade-offs:

- Slower build times (minutes vs. seconds for JAR)
- Reflection and dynamic class loading need explicit configuration
- Framework support varies (Spring Native, Quarkus native, Micronaut
  native work well)

### 14.4 When the JVM is the wrong tool

Sometimes the honest answer is: use a different runtime.

- **Rust** for zero-GC systems code
- **Go** for simple concurrent services (GC is tuned well enough that
  you rarely think about it)
- **C++** for predictable memory
- **C#/.NET** if you want similar semantics with a different collector

This is not failure. Picking the right tool is engineering.

---

## 15. A Tuning Checklist

Print this. Tape it above your desk.

1. **Measure the baseline.** Run unchanged, collect GC logs and
   application metrics for at least one hour under realistic load.
2. **Define the goal numerically.** "p99 pause < 50 ms," not "faster."
3. **Answer the first questions.** (Section 3.) Current collector, heap,
   goals, metrics, container, allocation rate, live set.
4. **Check the heap size.** Live set * 2-3, Xms == Xmx,
   `+AlwaysPreTouch`.
5. **Pick the collector.** (Section 2.) Batch = Parallel. Latency
   service = G1 or ZGC. Big heap = ZGC. Tiny = Serial.
6. **Enable the fundamentals.** `+HeapDumpOnOutOfMemoryError`,
   `+ExitOnOutOfMemoryError`, GC logging, JFR.
7. **Start with defaults.** Run again, measure, compare to goal.
8. **Change one flag.** Re-run, re-measure.
9. **Stop when you hit the goal.** Additional tuning past the goal is
   fragility in exchange for diminishing returns.
10. **Document the final config.** Every non-default flag gets a comment.
11. **Revisit every JDK upgrade.** New versions deprecate flags, change
    defaults, and ship new collectors. Your config is not frozen.

---

## 16. Further Reading

- **JEP 248** &mdash; Make G1 the Default Garbage Collector (Java 9)
- **JEP 363** &mdash; Remove the Concurrent Mark Sweep (CMS) Garbage Collector (Java 14)
- **JEP 377** &mdash; ZGC: A Scalable Low-Latency Garbage Collector (Production, Java 15)
- **JEP 439** &mdash; Generational ZGC (Java 21)
- **JEP 474** &mdash; ZGC: Generational Mode by Default (Java 23)
- **JEP 318** &mdash; Epsilon: A No-Op Garbage Collector (Java 11)
- Monica Beckwith, *JVM Performance Engineering* (2024)
- Charlie Hunt and Monica Beckwith, *Java Performance Companion*
- Kirk Pepperdine's talks and courses on GC tuning
- Gil Tene's "Understanding Application Hiccups" (on Azul's site)
- OpenJDK GC documentation at openjdk.org

---

## 17. A Final Word

GC tuning is one of the areas of software engineering where the Pareto
principle applies most brutally. 90% of the benefit comes from:

1. Picking the right collector.
2. Setting the right heap size.
3. Enabling GC logs and heap dumps.
4. Looking at the logs when there's a problem.

The remaining 10% of benefit comes from the remaining 90% of the work:
individual flag tuning, code-level allocation reduction, off-heap
schemes, custom collectors, and so on. This is fascinating, deeply
technical, intellectually rewarding work. It is also, for most systems
most of the time, not the best use of engineering time.

Use the defaults. Measure everything. Tune only what's measurably broken.
Document what you change. Revisit every upgrade.

And when your pager goes off at 3am because p99 latency just spiked to
800 ms, take a deep breath, pull up the GC log, and remember: every GC
problem is either an allocation problem in disguise, a heap sizing
problem, or a collector mismatch. It's almost never something exotic.
Start with the basics, and you will usually find it.
