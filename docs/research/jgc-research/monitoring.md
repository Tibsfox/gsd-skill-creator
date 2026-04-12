# Monitoring, Metrics, Diagnostics, and Containers

*PNW Research Series &mdash; JVM Garbage Collection, Memory Management, and Tuning*

> "You cannot tune what you do not measure."

Previous chapters covered *mechanisms*: how generations work, how G1 chooses regions, how ZGC colors pointers, how Shenandoah forwards objects. This chapter covers the other half of the craft &mdash; how to watch a running JVM well enough to know what it is actually doing.

Tuning without observation is astrology. Much "tuning" during the 2000s and 2010s consisted of copying flags from Stack Overflow answers written against a different JVM version, workload, and heap size. The only reliable escape is: measure first, change one thing, measure again, repeat.

This chapter walks from the bottom of the diagnostic toolbox (GC logs, `jstack`) up to the top (APM, OpenTelemetry, Grafana), then looks specifically at what changes inside a container.

---

## 1. Why observation comes before tuning

The JVM is one of the most heavily instrumented runtimes in common use. Every modern JVM ships with at least four observation surfaces:

1. **Logs** &mdash; GC logs, safepoint logs, JIT compilation logs, class loading logs. Emitted by the runtime, written to disk, read post-mortem or tailed in real time.
2. **Metrics** &mdash; numeric time-series: heap used, GC pause p99, allocation rate, thread count, classloaded count. Exposed via JMX, Micrometer, or Prometheus.
3. **Traces** &mdash; per-request causal chains spanning services, usually delivered through OpenTelemetry, Zipkin, or a commercial APM.
4. **Profiles** &mdash; statistical or exhaustive records of where the program spent CPU, memory, or wall-clock time. Java Flight Recorder, async-profiler, JFR events, allocation profiling.

A healthy observability strategy uses all four. Metrics answer *is something wrong?*, logs and traces answer *what is wrong?*, and profiles answer *why is it wrong?*

### Sampling vs tracing profilers

Profilers come in two flavors that are frequently conflated:

- A **tracing profiler** instruments every method entry and exit. It sees everything, including short-lived methods, but it inflates runtimes by 2x&ndash;20x and its timing numbers are distorted by the instrumentation itself. This is what the classic `-agentlib:hprof=cpu=times` produced. Nobody runs tracing profilers in production.
- A **sampling profiler** periodically stops the program (or uses hardware performance counters) and records the current stack. It misses methods shorter than the sample interval but it has near-zero overhead and its timing numbers are accurate in aggregate. This is what async-profiler, JFR, and most modern tools do.

For production JVM profiling, assume sampling unless told otherwise.

### Live vs post-mortem diagnostics

- **Live**: attach `jcmd`, `jstack`, `jmap`, `jconsole`, `visualvm`, `jfr` to a running process and pull data out. Cheap but requires the process to still be running and responsive.
- **Post-mortem**: read a GC log, analyze a heap dump, replay a JFR recording, look at yesterday&rsquo;s Grafana dashboard. Essential for "the server died at 3am and restarted itself". Always collect the data *before* you need it.

The golden rule: configure GC logging, heap dump on OOM, and JFR continuous recording on *every* production JVM, from day one. The cost is nearly zero. The benefit when an incident fires is everything.

---

## 2. GC logs &mdash; the single most valuable data source

If you can only have one piece of observability on a JVM, pick GC logs. They are cheap, they work without a network, they are text, and they contain enough information to reconstruct almost any GC-related incident.

### Java 9+ unified logging

In Java 9 (JEP 158 and JEP 271) the JVM consolidated all of its ad-hoc logging flags into a single unified logging framework, `-Xlog`. Every log tag, every output, every decoration goes through it.

The flag most teams should start with:

```bash
-Xlog:gc*=info:file=/var/log/myapp/gc.log:time,uptime,tags:filecount=10,filesize=10m
```

Breaking that down:

- `gc*=info` &mdash; all tags starting with `gc` at info level. Includes `gc`, `gc+heap`, `gc+age`, `gc+phases`, `gc+ergo`, etc.
- `file=/var/log/myapp/gc.log` &mdash; destination file.
- `time,uptime,tags` &mdash; decorations: wall-clock time, JVM uptime, tag name.
- `filecount=10,filesize=10m` &mdash; rotate across 10 files of up to 10 MB each &mdash; 100 MB ceiling.

More detailed logging for hunting a specific issue:

```bash
-Xlog:gc*=debug,gc+heap=trace,gc+age=trace,safepoint=info:file=gc.log:time,level,tags:filecount=20,filesize=50m
```

Pre-Java 9 (do not use on new deployments, but still common on long-lived Java 8 fleets):

```bash
-Xloggc:/var/log/myapp/gc.log -XX:+PrintGCDetails -XX:+PrintGCDateStamps \
 -XX:+PrintTenuringDistribution -XX:+PrintGCApplicationStoppedTime \
 -XX:+UseGCLogFileRotation -XX:NumberOfGCLogFiles=10 -XX:GCLogFileSize=10M
```

### What to log

A useful starter set of tags:

| Tag          | Purpose                                                                 |
|--------------|-------------------------------------------------------------------------|
| `gc`         | High-level GC events &mdash; one line per collection                    |
| `gc+heap`    | Per-generation size before and after each GC                            |
| `gc+age`     | Tenuring distribution &mdash; survivor age histogram                    |
| `gc+ergo`    | JVM ergonomic decisions (why G1 picked this mixed collection)           |
| `gc+phases`  | Breakdown of phase times inside a collection                            |
| `safepoint`  | Every safepoint pause, including non-GC safepoints like deopt and biased locking revocation |
| `gc+cpu`     | CPU time spent by GC threads                                             |
| `gc+humongous` | G1 humongous allocations (critical when chasing oversized allocations) |

### Reading G1 logs

A typical G1 young collection line:

```
[2026-04-08T09:17:42.103-0700][0.345s][info ][gc] GC(42) Pause Young (Normal) (G1 Evacuation Pause) 512M->128M(2048M) 45.231ms
```

Translating:

- `GC(42)` &mdash; 43rd GC event since start (zero-indexed).
- `Pause Young (Normal)` &mdash; young-generation pause, not a mixed collection.
- `G1 Evacuation Pause` &mdash; standard young-GC trigger.
- `512M->128M(2048M)` &mdash; heap used before GC, heap used after, total heap capacity.
- `45.231ms` &mdash; total pause (stop-the-world time).

A mixed collection:

```
[2026-04-08T09:17:55.847-0700][14.089s][info ][gc] GC(58) Pause Young (Mixed) (G1 Evacuation Pause) 1800M->900M(2048M) 189.432ms
```

Here young and old regions were collected together. The longer pause is expected &mdash; mixed GCs do more work.

Concurrent marking phases:

```
[2026-04-08T09:17:50.201-0700][8.443s][info ][gc] GC(50) Concurrent Mark Cycle
[2026-04-08T09:17:50.204-0700][8.446s][info ][gc] GC(50) Pause Remark 2048M->2048M(2048M) 12.018ms
[2026-04-08T09:17:50.298-0700][8.540s][info ][gc] GC(50) Pause Cleanup 2048M->1024M(2048M) 4.521ms
```

The Remark pause is the stop-the-world finalization of concurrent marking. The Cleanup pause frees empty regions. The Concurrent Mark Cycle itself runs without pausing the application; only its Remark and Cleanup bookends show up as pauses.

G1 phase breakdown (with `gc+phases=debug`):

```
[gc,phases    ] GC(42)   Pre Evacuate Collection Set: 0.2ms
[gc,phases    ] GC(42)   Evacuate Collection Set: 38.1ms
[gc,phases    ] GC(42)     Ext Root Scanning (ms): Min: 1.1, Avg: 1.4, Max: 1.9
[gc,phases    ] GC(42)     Update RS (ms): Min: 3.8, Avg: 4.2, Max: 5.1
[gc,phases    ] GC(42)     Scan RS (ms): Min: 2.0, Avg: 2.3, Max: 2.8
[gc,phases    ] GC(42)     Object Copy (ms): Min: 22.1, Avg: 25.3, Max: 29.2
[gc,phases    ] GC(42)   Post Evacuate Collection Set: 5.9ms
[gc,phases    ] GC(42)   Other: 1.0ms
```

If Object Copy dominates, the pause is bound by evacuation throughput. If Update RS dominates, the remembered set is under pressure &mdash; consider a larger pause target or fewer, larger regions.

### Reading ZGC logs

ZGC logs look different because pauses are always short and the work is done concurrently:

```
[2.123s][info][gc] GC(5) Garbage Collection (Proactive)
[2.124s][info][gc,phases] GC(5) Pause Mark Start 0.456ms
[2.187s][info][gc,phases] GC(5) Concurrent Mark 62.891ms
[2.188s][info][gc,phases] GC(5) Pause Mark End 0.321ms
[2.201s][info][gc,phases] GC(5) Concurrent Process Non-Strong References 12.443ms
[2.230s][info][gc,phases] GC(5) Concurrent Reset Relocation Set 28.102ms
[2.245s][info][gc,phases] GC(5) Concurrent Select Relocation Set 14.992ms
[2.246s][info][gc,phases] GC(5) Pause Relocate Start 0.289ms
[2.310s][info][gc,phases] GC(5) Concurrent Relocate 63.567ms
[2.311s][info][gc,phases] GC(5) Garbage Collection (Proactive) 1234M(48%)->412M(16%) 188.456ms
```

Note that there are three STW pauses &mdash; Mark Start, Mark End, Relocate Start &mdash; but each is under a millisecond. The entire "Garbage Collection" total is 188 ms of *wall time*, but the application was paused for less than 2 ms of it.

Interpreting:

- `(Proactive)` &mdash; ZGC triggered itself because allocation pressure reached a heuristic.
- `1234M(48%)->412M(16%)` &mdash; heap used before and after, as MB and percent-of-max.
- All "Concurrent" phases run in parallel with the application.

### Tools for reading GC logs at scale

Nobody reads 100 MB of GC logs by hand. A small ecosystem of tools exists:

- **[GCViewer](https://github.com/chewiebug/GCViewer)** &mdash; free, desktop, parses nearly every JVM GC log format ever emitted. Shows pause histograms, throughput, allocation rate.
- **[GCEasy.io](https://gceasy.io/)** &mdash; web-based, upload your log, get a full report. Freemium. Widely used for incident analysis because it runs in a browser.
- **[GCPlot](https://gcplot.com/)** &mdash; similar web service, slightly different interpretation layer.
- **Universal GC Log Analyzer** &mdash; part of IBM's toolchain, handles HotSpot and Eclipse OpenJ9.
- **[gcparser](https://github.com/microsoft/gctoolkit)** and Microsoft&rsquo;s GCToolKit &mdash; a Java library for programmatically parsing GC logs into structured events. Useful when you want to build your own dashboards.

A rough check on GC health from a shell, using a log in unified format:

```bash
grep "Pause Young" gc.log | awk '{print $NF}' | sed 's/ms//' | sort -n | tail -20
grep "Pause" gc.log | awk '{print $NF}' | sed 's/ms//' | \
  awk '{sum+=$1; n++} END {print "avg:", sum/n, "ms,", "n:", n}'
```

(That is a crude average, not a proper quantile. Use gceasy or GCViewer for anything real.)

---

## 3. Java Flight Recorder (JFR)

JFR is the most important JVM diagnostic tool that nobody used for ten years because it was locked behind a commercial license.

### History

- Originally shipped in BEA&rsquo;s **JRockit** JVM as a commercial feature called JRA (JRockit Runtime Analyzer).
- Acquired by Oracle in 2008, ported to HotSpot around 2012 as Java Flight Recorder.
- Required a commercial license on Oracle JDK 7 and 8 &mdash; technically functional but forbidden in production without paying.
- Open-sourced in **Java 11** (JEP 328) by Oracle, contributed upstream to OpenJDK. Available on every OpenJDK build from 11 onward. Usable freely in production.

### Why it matters

JFR is designed to run continuously in production with ~1% overhead. It captures thousands of event types: every GC pause, allocation samples, lock contention events, I/O events, exception throws, JIT compilation events, thread parks, safepoint entries, method sampling, classloader activity. An enabled JFR recording is essentially the black box recorder from an aircraft.

### Starting a recording

Start a timed recording with `jcmd`:

```bash
jcmd <pid> JFR.start name=myrec settings=profile duration=60s filename=/tmp/recording.jfr
```

Start a continuous recording with a circular buffer:

```bash
jcmd <pid> JFR.start name=continuous settings=default maxsize=500m maxage=6h
```

Dump the current contents of a continuous recording to a file (without stopping it):

```bash
jcmd <pid> JFR.dump name=continuous filename=/tmp/snapshot.jfr
```

Stop a recording:

```bash
jcmd <pid> JFR.stop name=myrec
```

List active recordings:

```bash
jcmd <pid> JFR.check
```

Start JFR at JVM launch:

```bash
-XX:StartFlightRecording=duration=60s,filename=startup.jfr,settings=profile
-XX:StartFlightRecording=settings=default,maxsize=500m,maxage=6h,dumponexit=true,filename=exit.jfr
```

### Settings templates

JFR ships with two built-in templates:

- **`default`** &mdash; ~1% overhead. Safe for continuous production use. Covers GC, allocation (sampled), JIT, thread state, locks, I/O.
- **`profile`** &mdash; ~2% overhead. More detail &mdash; object allocation inside TLABs, more frequent method sampling. Use for time-limited diagnostic recordings.

You can also author custom settings in `$JAVA_HOME/lib/jfr/*.jfc` XML files or via JMC.

### Viewing recordings

- **JDK Mission Control (JMC)** &mdash; the canonical JFR viewer. GUI. Shows timelines, flame graphs, heap and GC dashboards, automatic rules that flag problems (&ldquo;high GC overhead&rdquo;, &ldquo;lock contention&rdquo;, etc.). Free download from [adoptium.net](https://adoptium.net/jmc/).
- **`jfr` command-line tool** &mdash; ships with the JDK. `jfr print --events jdk.GarbageCollection recording.jfr` gets you events as JSON or text. Great for scripts.
- **IntelliJ IDEA Ultimate profiler** &mdash; can open JFR files and show flame graphs.
- **VisualVM** &mdash; also reads JFR files.

Command-line examples:

```bash
jfr summary recording.jfr
jfr print --events jdk.GarbageCollection recording.jfr
jfr print --events jdk.ObjectAllocationInNewTLAB --stack-depth 10 recording.jfr
jfr print --json --events CPULoad recording.jfr | jq '.events[] | .values'
```

### Custom events

Applications can define their own JFR event types. This is how you bake business-level telemetry into the same recording as JVM internals:

```java
import jdk.jfr.*;

@Label("Order Processed")
@Category("MyApp")
@Description("Fired when an order completes processing")
public class OrderProcessedEvent extends Event {
    @Label("Order ID")
    public String orderId;

    @Label("Item Count")
    public int itemCount;

    @Label("Duration") @Timespan
    public long durationNs;
}

// usage
OrderProcessedEvent e = new OrderProcessedEvent();
e.begin();
// ... work ...
e.orderId = order.getId();
e.itemCount = order.getItems().size();
e.end();
e.commit();
```

These events show up in JMC alongside GC events. You can now correlate a tail-latency spike in your custom event with a concurrent mark cycle in ZGC visually, on one timeline.

### JFR streaming API (Java 14+)

JEP 349 (Java 14) added a streaming API to JFR, so you can read events in real time without first writing them to a file:

```java
import jdk.jfr.consumer.*;
import java.time.Duration;

try (var rs = new RecordingStream()) {
    rs.enable("jdk.GarbageCollection");
    rs.enable("jdk.CPULoad").withPeriod(Duration.ofSeconds(1));
    rs.onEvent("jdk.GarbageCollection", event -> {
        System.out.printf("GC %s took %s%n",
            event.getString("name"),
            event.getDuration());
    });
    rs.start();
}
```

This is how modern JVM agents (Datadog, New Relic, OpenTelemetry) gather low-overhead GC telemetry without writing files.

---

## 4. JMX &mdash; Java Management Extensions

JMX is the JVM&rsquo;s in-process RPC surface for management and monitoring. It predates JFR and even the modern HotSpot GC collectors, and every JVM exposes a set of standard MXBeans without any configuration.

### MBeans and MXBeans

- **MBean** &mdash; a "Managed Bean", a Java object that exposes attributes and operations through a well-defined interface.
- **MXBean** &mdash; a subset of MBean that uses only standard types and can be safely consumed by JMX clients written in other languages.

### Built-in MXBeans

Every HotSpot JVM exposes the following under the `java.lang` domain:

| ObjectName                                          | What it gives you                                     |
|------------------------------------------------------|-------------------------------------------------------|
| `java.lang:type=Memory`                              | Heap and non-heap usage                               |
| `java.lang:type=MemoryPool,name=*`                   | Individual pools (Eden, Survivor, Old, Metaspace)     |
| `java.lang:type=GarbageCollector,name=*`             | Per-collector counts and times                        |
| `java.lang:type=Threading`                           | Live thread count, deadlocks, per-thread CPU time     |
| `java.lang:type=ClassLoading`                        | Classes loaded, unloaded, total                       |
| `java.lang:type=Runtime`                             | JVM args, uptime, name                                |
| `java.lang:type=OperatingSystem`                     | Process CPU load, system load, committed virtual mem  |
| `java.lang:type=Compilation`                         | JIT compiler name and total compile time              |

Example usage:

```java
import java.lang.management.*;

MemoryMXBean mem = ManagementFactory.getMemoryMXBean();
MemoryUsage heap = mem.getHeapMemoryUsage();
System.out.printf("heap used=%d committed=%d max=%d%n",
    heap.getUsed(), heap.getCommitted(), heap.getMax());

MemoryUsage nonHeap = mem.getNonHeapMemoryUsage();
System.out.printf("non-heap used=%d committed=%d%n",
    nonHeap.getUsed(), nonHeap.getCommitted());

for (GarbageCollectorMXBean gc : ManagementFactory.getGarbageCollectorMXBeans()) {
    System.out.printf("%s: count=%d totalTime=%dms%n",
        gc.getName(), gc.getCollectionCount(), gc.getCollectionTime());
}
```

### Exposing JMX remotely

For localhost tooling:

```bash
-Dcom.sun.management.jmxremote \
-Dcom.sun.management.jmxremote.local.only=true
```

For remote JMX on a trusted network (insecure &mdash; DEV ONLY):

```bash
-Dcom.sun.management.jmxremote.port=9010 \
-Dcom.sun.management.jmxremote.rmi.port=9010 \
-Dcom.sun.management.jmxremote.authenticate=false \
-Dcom.sun.management.jmxremote.ssl=false \
-Djava.rmi.server.hostname=<public hostname or 0.0.0.0>
```

For production, SSL and authentication are mandatory:

```bash
-Dcom.sun.management.jmxremote.port=9010 \
-Dcom.sun.management.jmxremote.rmi.port=9010 \
-Dcom.sun.management.jmxremote.authenticate=true \
-Dcom.sun.management.jmxremote.ssl=true \
-Dcom.sun.management.jmxremote.password.file=/etc/jmxremote.password \
-Dcom.sun.management.jmxremote.access.file=/etc/jmxremote.access \
-Djavax.net.ssl.keyStore=/etc/keystore.jks \
-Djavax.net.ssl.keyStorePassword=changeit
```

Exposing JMX publicly without authentication is an old favorite of ransomware actors. Do not do it. Even in private networks, treat JMX like SSH: credentials, audit logs, hardened access.

### JMX clients

- **JConsole** &mdash; ships with the JDK, basic dashboards and MBean browser.
- **VisualVM** &mdash; a better JConsole. Free, maintained at [visualvm.github.io](https://visualvm.github.io/).
- **`jmxterm`** &mdash; command-line JMX client. Scriptable.
- **Prometheus JMX exporter** &mdash; translates JMX MBeans to Prometheus metrics (see below).

### Custom MXBeans

```java
public interface BusinessMXBean {
    long getOrdersProcessed();
    double getAverageLatencyMs();
    void resetCounters();
}

public class Business implements BusinessMXBean {
    // ... impl ...
}

// registration
ManagementFactory.getPlatformMBeanServer().registerMBean(
    new Business(),
    new ObjectName("com.myco:type=Business"));
```

Now any JMX client (JConsole, VisualVM, `jmxterm`, the jmx_exporter) can see and alert on your counters without changing the network exposure.

---

## 5. Micrometer &mdash; the metrics facade

Micrometer is to metrics what SLF4J is to logging: a vendor-neutral API layer that you code against, with backends for every major metrics system.

### Origin

Created by **Jon Schneider** (now at Netflix, previously at Pivotal) in 2017&ndash;2018 as the metrics library for Spring Boot 2. Before Micrometer, the Spring ecosystem used Dropwizard Metrics (originally Coda Hale Metrics), which was excellent but tied to its own data model. Micrometer generalized it.

Since Spring Boot 2.0 (March 2018), Micrometer is the default metrics library for any Spring Boot application, and by extension for enormous swathes of the Java server ecosystem.

### Meter binders

Micrometer provides pre-built "binders" that attach to JVM internals and publish standard metrics:

```java
new ClassLoaderMetrics().bindTo(registry);
new JvmMemoryMetrics().bindTo(registry);
new JvmGcMetrics().bindTo(registry);
new JvmThreadMetrics().bindTo(registry);
new ProcessorMetrics().bindTo(registry);
new UptimeMetrics().bindTo(registry);
new FileDescriptorMetrics().bindTo(registry);
new JvmHeapPressureMetrics().bindTo(registry);
new LogbackMetrics().bindTo(registry);
```

With Spring Boot, these are all enabled automatically if you depend on `spring-boot-starter-actuator` plus a Micrometer registry (e.g., `micrometer-registry-prometheus`).

### Backends

Micrometer ships registries for Prometheus, Datadog, New Relic, Dynatrace, CloudWatch, StatsD/DogStatsD, InfluxDB, Graphite, JMX, Elastic APM, SignalFx, Wavefront, Humio, Azure Monitor. Swapping backends is a dependency change; no code changes.

### Standard JVM metric names

Micrometer normalizes metric names across backends. Key ones:

| Metric                               | Meaning                                                       |
|--------------------------------------|---------------------------------------------------------------|
| `jvm.memory.used{area,id}`           | Bytes used per pool (area=heap/nonheap, id=Eden, Old, etc.)   |
| `jvm.memory.committed{area,id}`      | Bytes committed per pool                                      |
| `jvm.memory.max{area,id}`            | Max size per pool                                             |
| `jvm.gc.pause{action,cause}`         | Timer of GC pause durations                                   |
| `jvm.gc.memory.allocated`            | Bytes allocated in young since last collection                |
| `jvm.gc.memory.promoted`             | Bytes promoted from young to old at last collection           |
| `jvm.gc.live.data.size`              | Old-gen live size after last major GC                         |
| `jvm.gc.max.data.size`               | Max old-gen size                                              |
| `jvm.gc.overhead`                    | Fraction of wall time spent in GC recently                    |
| `jvm.threads.live`                   | Current live threads                                          |
| `jvm.threads.daemon`                 | Current daemon threads                                        |
| `jvm.threads.peak`                   | Peak thread count since JVM start                             |
| `jvm.classes.loaded`                 | Currently loaded classes                                      |
| `jvm.classes.unloaded`               | Total unloaded since start                                    |
| `process.cpu.usage`                  | Process CPU load 0.0&ndash;1.0                                |
| `system.cpu.usage`                   | System CPU load 0.0&ndash;1.0                                 |

These naming conventions are the de facto standard for JVM telemetry even outside Spring.

---

## 6. Prometheus + Grafana for JVM monitoring

### The /actuator/prometheus endpoint

In a Spring Boot app with Actuator and `micrometer-registry-prometheus` on the classpath, the application exposes:

```
GET /actuator/prometheus
```

returning a plain-text Prometheus exposition format:

```
# HELP jvm_memory_used_bytes The amount of used memory
# TYPE jvm_memory_used_bytes gauge
jvm_memory_used_bytes{area="heap",id="G1 Eden Space",} 2.68435456E8
jvm_memory_used_bytes{area="heap",id="G1 Old Gen",} 4.42499072E8
jvm_memory_used_bytes{area="nonheap",id="Metaspace",} 8.3886592E7
# HELP jvm_gc_pause_seconds Time spent in GC pause
# TYPE jvm_gc_pause_seconds summary
jvm_gc_pause_seconds_count{action="end of minor GC",cause="G1 Evacuation Pause",} 42.0
jvm_gc_pause_seconds_sum{action="end of minor GC",cause="G1 Evacuation Pause",} 1.893
```

A Prometheus server scrapes this endpoint (default every 15 s), stores the data, and exposes it via PromQL.

### Useful PromQL queries

GC rate over the last minute:

```promql
rate(jvm_gc_pause_seconds_count[1m])
```

GC time fraction (how much wall time is spent in GC):

```promql
rate(jvm_gc_pause_seconds_sum[5m]) / rate(jvm_gc_pause_seconds_count[5m])
```

Heap usage ratio (careful &mdash; sum across pools):

```promql
sum(jvm_memory_used_bytes{area="heap"}) by (instance)
  /
sum(jvm_memory_max_bytes{area="heap"}) by (instance)
```

GC pause p99 over 5 minutes (requires histogram buckets &mdash; use `jvm.gc.pause` as a Timer with `.publishPercentileHistogram()` in Micrometer):

```promql
histogram_quantile(0.99, sum(rate(jvm_gc_pause_seconds_bucket[5m])) by (le, instance))
```

Allocation rate (bytes per second):

```promql
rate(jvm_gc_memory_allocated_bytes_total[1m])
```

Promotion rate:

```promql
rate(jvm_gc_memory_promoted_bytes_total[1m])
```

Live data size trend (shrinking old-gen live size = healthy; constantly growing = leak):

```promql
jvm_gc_live_data_size_bytes
```

### Alert rules

A starter Prometheus alert rule file for JVM health:

```yaml
groups:
- name: jvm
  rules:
  - alert: JvmHeapAlmostFull
    expr: |
      sum(jvm_memory_used_bytes{area="heap"}) by (instance, job)
        / sum(jvm_memory_max_bytes{area="heap"}) by (instance, job)
        > 0.90
    for: 10m
    labels: { severity: warning }
    annotations:
      summary: "JVM heap > 90% on {{ $labels.instance }}"

  - alert: JvmGcPauseHigh
    expr: |
      histogram_quantile(0.99,
        sum(rate(jvm_gc_pause_seconds_bucket[5m])) by (le, instance, job)) > 0.5
    for: 10m
    labels: { severity: warning }
    annotations:
      summary: "GC pause p99 > 500ms on {{ $labels.instance }}"

  - alert: JvmAllocationRateHigh
    expr: rate(jvm_gc_memory_allocated_bytes_total[5m]) > 500 * 1024 * 1024
    for: 15m
    labels: { severity: info }
    annotations:
      summary: "Allocation rate > 500 MB/s sustained"

  - alert: JvmOldGenGrowing
    expr: deriv(jvm_gc_live_data_size_bytes[1h]) > 1 * 1024 * 1024
    for: 6h
    labels: { severity: warning }
    annotations:
      summary: "Live data size growing &gt;1 MB/s for 6 hours &mdash; possible leak"
```

### Grafana dashboards

The Micrometer team maintains official Grafana dashboards for JVM metrics. The main ones:

- **[JVM (Micrometer) Dashboard 4701](https://grafana.com/grafana/dashboards/4701)** &mdash; the canonical JVM dashboard. Heap/non-heap by pool, GC counts and times, threads, classes loaded, process CPU.
- **[Spring Boot 2.1 Statistics 10280](https://grafana.com/grafana/dashboards/10280)** &mdash; includes Spring-specific stats plus JVM.
- **[JVM Micrometer with Percentiles 11378](https://grafana.com/grafana/dashboards/11378)** &mdash; same as 4701 but with GC pause percentiles.

### The JMX exporter alternative

If you cannot add Micrometer to an app (legacy code, closed source, third-party JVMs), the Prometheus [jmx_exporter](https://github.com/prometheus/jmx_exporter) runs as a Java agent and translates JMX MBeans into Prometheus metrics:

```bash
java -javaagent:./jmx_prometheus_javaagent-0.20.0.jar=9404:config.yaml -jar app.jar
```

Example `config.yaml`:

```yaml
rules:
  - pattern: 'java.lang<type=Memory><HeapMemoryUsage>used'
    name: jvm_memory_heap_used_bytes
    type: GAUGE
  - pattern: 'java.lang<type=GarbageCollector, name=(.*)><>CollectionCount'
    name: jvm_gc_collection_count_total
    labels: { gc: '$1' }
    type: COUNTER
  - pattern: 'java.lang<type=GarbageCollector, name=(.*)><>CollectionTime'
    name: jvm_gc_collection_time_seconds_total
    labels: { gc: '$1' }
    type: COUNTER
    valueFactor: 0.001
```

Prometheus scrapes `http://<host>:9404/metrics`. This is how teams monitor Kafka brokers, Cassandra, Elasticsearch, and other closed Java applications without modifying them.

---

## 7. Heap dumps

When a JVM dies with `OutOfMemoryError`, or you suspect a memory leak, you take a heap dump &mdash; a snapshot of every object on the heap and every reference between them.

### Triggering

**Automatic on OOM** &mdash; always enable this in production:

```bash
-XX:+HeapDumpOnOutOfMemoryError \
-XX:HeapDumpPath=/var/dumps/
-XX:+ExitOnOutOfMemoryError   # optional &mdash; die cleanly after dump
```

Heap dump files follow the pattern `java_pidNNN.hprof` by default.

**Manual dump via `jcmd`** (preferred, modern):

```bash
jcmd <pid> GC.heap_dump /tmp/heap.hprof
jcmd <pid> GC.heap_dump -all=true /tmp/heap.hprof    # include unreachable
```

**`jmap`** (older, still works):

```bash
jmap -dump:format=b,file=/tmp/heap.hprof <pid>
jmap -dump:live,format=b,file=/tmp/heap.hprof <pid>   # only live objects
```

Dumping a heap of a healthy production process typically triggers a full GC first (for live-only dumps) and stops the world during the dump itself &mdash; expect pauses proportional to heap size. A 16 GB heap can take 10&ndash;30 seconds to dump.

### HPROF format

Heap dumps are written in the HPROF binary format (originally from Sun&rsquo;s hprof agent). The file contains:

- Class metadata: name, loader, superclass, field definitions.
- Per-object records: class, size, references, primitive fields.
- Thread stacks at dump time.
- GC root designations (what kept each object alive).

The file format is not super efficient &mdash; a 16 GB heap produces a ~20 GB hprof file &mdash; but it is stable and readable by every heap analysis tool.

### Analysis tools

- **[Eclipse Memory Analyzer Tool (MAT)](https://www.eclipse.org/mat/)** &mdash; the gold standard. Free. Its "Leak Suspects Report" has solved more production memory leaks than any other single tool.
- **VisualVM** &mdash; opens hprof, navigates the object graph. Slower than MAT on huge dumps.
- **YourKit** &mdash; commercial, excellent.
- **JProfiler** &mdash; commercial, excellent.
- **IntelliJ IDEA Ultimate** &mdash; reads hprof, integrates with profiler.
- **[jxray](https://jxray.com/)** &mdash; commercial. Focuses on memory waste patterns (duplicate strings, nearly-empty collections, boxed primitives).
- **[heap-analyzer](https://github.com/Netflix/haphazard)** &mdash; Netflix OSS. Runs as a web service for shared team use.

### MAT concepts

Eclipse MAT introduces a few concepts worth knowing:

- **Shallow size** &mdash; bytes used by the object&rsquo;s own fields, not counting what it references.
- **Retained size** &mdash; bytes that would be freed if this object became unreachable &mdash; i.e., everything it *dominates*.
- **Dominator tree** &mdash; for every object X, find the objects that only X can reach (through any path). This gives a tree rooted at GC roots where parent&rsquo;s retained size equals sum of children&rsquo;s retained sizes. Perfect for "what is really holding memory".
- **Leak Suspects Report** &mdash; MAT auto-generates a human-readable HTML report identifying the largest retained-size objects and the paths from them to GC roots.

A typical MAT workflow on a 10 GB hprof:

1. Open the dump. MAT parses it into indexes (one-time cost).
2. Run **Leak Suspects Report**.
3. The report often identifies the culprit in a single sentence: "One instance of `java.util.HashMap` loaded by `sun.misc.Launcher$AppClassLoader` occupies 8,234,109,888 bytes (82%)."
4. Navigate to that instance; view **Path to GC Roots** (excluding weak/soft/phantom references).
5. The path shows you which thread and which field is holding the leak alive.

### Common leak patterns

- **Thread-local leaks** &mdash; `ThreadLocal` values retained by long-lived threads in a pool. The class loaded by the threadlocal is itself pinned, causing cascades.
- **Classloader leaks** &mdash; a webapp is undeployed but its classloader stays alive because a JDBC driver or a thread registered itself with a singleton. Over time, Metaspace fills with dead class definitions.
- **Listener leaks** &mdash; observers registered with a pub-sub but never deregistered. The event source retains the observer forever.
- **Huge collections** &mdash; `Map<String, CachedThing>` without an eviction policy. The most common leak in application code.
- **Duplicate strings** &mdash; millions of `String` instances that hold the same chars. Use `-XX:+UseStringDeduplication` with G1 to halve String memory cheaply.
- **Session leaks** &mdash; HTTP sessions pinned by a reference that survives session invalidation.

### Heap dumps and RSS

A heap dump only contains the Java heap &mdash; Eden, Survivor, Old, Humongous regions. It does **not** include:

- **Metaspace** &mdash; class metadata. Can leak independently via classloader churn.
- **Code cache** &mdash; JIT-compiled machine code.
- **Direct buffers** &mdash; `ByteBuffer.allocateDirect()` memory. Lives outside heap; can grow huge.
- **Thread stacks** &mdash; each thread takes ~512 KB to 1 MB of native memory.
- **JNI allocations** &mdash; anything `malloc`&rsquo;d by native libraries.
- **Garbage collector data structures** &mdash; mark bitmaps, remembered sets, etc.

A JVM with a 4 GB heap can easily have a 6 GB RSS. If the container limit is 5 GB, it will OOMKill, and the heap dump (if one was taken) will show a happy 2 GB of heap used. This is the classic "where did my RAM go" mystery and is covered in section 12.

For non-heap debugging, use **Native Memory Tracking** (`-XX:NativeMemoryTracking=summary`) and `jcmd <pid> VM.native_memory`.

---

## 8. Thread dumps

A thread dump is a snapshot of every thread in the JVM and its current stack trace. It is the cheapest diagnostic you can take and the most useful for deadlocks, livelocks, and "why is everything blocked".

### Taking a thread dump

**`jstack`** (older, still works):

```bash
jstack <pid> > /tmp/td.txt
jstack -l <pid> > /tmp/td.txt   # include lock info and ownable synchronizers
```

**`jcmd`** (modern):

```bash
jcmd <pid> Thread.print > /tmp/td.txt
jcmd <pid> Thread.print -l > /tmp/td.txt
```

**`kill -3`** (SIGQUIT) &mdash; writes the thread dump to the JVM&rsquo;s **stdout**. Useful in environments where you cannot exec tools into the container:

```bash
kill -3 <pid>
```

Inside a Kubernetes pod:

```bash
kubectl exec <pod> -- jcmd 1 Thread.print
# or
kubectl exec <pod> -- kill -3 1
kubectl logs <pod> | tail -500   # find the dump
```

Taking several thread dumps in a row (5 seconds apart) is often more informative than a single one &mdash; you can see which threads stayed in the same place and which moved.

```bash
for i in 1 2 3 4 5; do
  jcmd <pid> Thread.print > /tmp/td-$i.txt
  sleep 5
done
```

### Thread states

Every thread in a dump has a state. The canonical states:

| State             | Meaning                                                               |
|-------------------|-----------------------------------------------------------------------|
| `NEW`             | Created but `start()` not yet called                                  |
| `RUNNABLE`        | Eligible to run; either on CPU or waiting for CPU                     |
| `BLOCKED`         | Waiting to enter a `synchronized` section (monitor contention)        |
| `WAITING`         | In `Object.wait()`, `LockSupport.park()`, `Thread.join()` &mdash; indefinite |
| `TIMED_WAITING`   | Same as WAITING but with a timeout                                    |
| `TERMINATED`      | Completed execution                                                   |

A healthy application usually has most threads in `WAITING` or `TIMED_WAITING` (idle pool workers, selector threads, schedulers) with a handful `RUNNABLE`. Lots of `BLOCKED` threads all pointing at the same monitor = contention hotspot.

### Deadlock detection

Modern JVMs detect deadlocks automatically. `jstack -l` will print:

```
Found one Java-level deadlock:
=============================
"Thread-1":
  waiting to lock monitor 0x00007f... (object 0x...., a java.lang.Object),
  which is held by "Thread-0"
"Thread-0":
  waiting to lock monitor 0x00007f... (object 0x...., a java.lang.Object),
  which is held by "Thread-1"
```

If you see this in a dump, restart is almost always the only recovery. Then fix the lock ordering.

### Reading stacks for hot paths

If you take 10 thread dumps 1 second apart and 8 of them show the same thread in the same method, that method is almost certainly a CPU hotspot. This is a poor person&rsquo;s sampling profiler and it works. The modern replacement is async-profiler (see next section).

### Thread dump analyzers

- **[FastThread](https://fastthread.io/)** &mdash; upload a dump, get an annotated HTML report, identifies deadlocks, contention hotspots, GC threads.
- **[Spotify&rsquo;s thread dump analyzer](https://spotify.github.io/threaddump-analyzer/)** &mdash; free, open source, browser-based.
- **IntelliJ IDEA** &mdash; opens `.tdump` files.

---

## 9. async-profiler

[async-profiler](https://github.com/async-profiler/async-profiler) is a low-overhead sampling profiler for the JVM. It was created by **Andrei Pangin**, a Java Champion formerly at Odnoklassniki. It is the tool most production engineers reach for when they need to answer "where is CPU going?" on a running JVM.

### Why it exists

Traditional sampling profilers either:

- Used `-agentlib:hprof=cpu=samples`, which was inaccurate because it only sampled at JVM safepoints (missing leaf methods and native code).
- Used JVMTI`GetAllStackTraces`, which also only sampled at safepoints.

async-profiler bypasses the safepoint problem entirely by using Linux `perf_events` (via `perf_event_open(2)`) or Solaris DTrace probes. It captures stack traces during signal handlers that fire in the middle of any instruction, including JIT-compiled code, stubs, and native libraries. The result is an unbiased sample that includes the methods classical profilers missed.

### Basic usage

Profile CPU for 30 seconds, output as an interactive flame graph:

```bash
./profiler.sh -d 30 -f /tmp/profile.html <pid>
```

Open `/tmp/profile.html` in a browser. X-axis is sample count (width = time spent), Y-axis is call stack depth.

### Modes

- **CPU (default)**: where CPU is spent.
- **Wall clock (`-e wall`)**: where *wall time* is spent, including blocked and waiting threads. Essential for "my HTTP handler is slow and I don&rsquo;t know why".
- **Allocation (`-e alloc`)**: which methods allocate the most bytes. Uses TLAB-refill events under the hood &mdash; statistical but unbiased.
- **Lock contention (`-e lock`)**: time spent blocked on monitor or `Lock` acquisition.
- **Cache misses, branch mispredictions**: any perf event.

```bash
./profiler.sh -e cpu   -d 60 -f cpu.html   <pid>
./profiler.sh -e wall  -d 60 -f wall.html  <pid>
./profiler.sh -e alloc -d 60 -f alloc.html <pid>
./profiler.sh -e lock  -d 60 -f lock.html  <pid>
```

### Flame graphs

A flame graph, invented by Brendan Gregg at Netflix, is a merged-stack visualization of sampled call stacks. Each box represents a method; the width is proportional to the number of samples in which that method (or a callee of it) was on stack. You read it by looking for wide boxes near the top &mdash; those are the hot leaf methods.

async-profiler outputs interactive SVG/HTML flame graphs that you can click to zoom and search.

### Wall clock profiling vs CPU profiling

CPU profiling only captures samples when a thread is running on-CPU. If the slow path is `synchronized`-blocked, or waiting on JDBC, CPU profiling shows nothing interesting.

Wall-clock profiling captures samples regardless of thread state. If 80% of your wall time is spent in `SocketInputStream.read0`, CPU profiling will barely mention it, and wall-clock profiling will immediately tell you.

### Starting in-process

```java
// Maven: com.github.async-profiler:async-profiler
AsyncProfiler profiler = AsyncProfiler.getInstance();
profiler.execute("start,event=cpu,file=/tmp/profile.jfr");
// ... work ...
profiler.execute("stop,file=/tmp/profile.jfr");
```

### JFR output

async-profiler can emit its samples in JFR format, which means you can open them in JMC alongside the native JFR timeline:

```bash
./profiler.sh -d 30 -f profile.jfr <pid>
```

---

## 10. JMH &mdash; microbenchmarking

JMH (Java Microbenchmark Harness) is the only credible way to benchmark small pieces of Java code. It was created by **Aleksey Shipilev** at Oracle, who later moved to Red Hat and led Shenandoah GC. Alongside Cliff Click and Gil Tene, Shipilev is one of the people most responsible for the modern Java performance-engineering culture.

### Why naive benchmarks lie

A typical naive benchmark looks like:

```java
long t0 = System.nanoTime();
for (int i = 0; i < 1_000_000; i++) {
    doTheThing();
}
long t1 = System.nanoTime();
System.out.println((t1 - t0) / 1_000_000.0 + " ns/op");
```

This code is almost always wrong. Reasons:

1. **Dead code elimination**: if `doTheThing()` has no observable side effect, the JIT will delete the whole loop and report 0 ns/op.
2. **Constant folding**: if inputs are constants, the JIT precomputes the result.
3. **On-stack replacement**: the first iterations run in the interpreter; later iterations are compiled; the measurement straddles both.
4. **Warmup**: the JIT has compilation tiers (C1, C2), and a method may be recompiled several times before it reaches steady state.
5. **GC interference**: a GC in the middle of the loop skews the average.
6. **Thread scheduling**: one-off CPU preemption hides in the sum.

### JMH solves all of this

```java
import org.openjdk.jmh.annotations.*;
import java.util.concurrent.TimeUnit;

@BenchmarkMode(Mode.AverageTime)
@OutputTimeUnit(TimeUnit.NANOSECONDS)
@State(Scope.Thread)
@Warmup(iterations = 5, time = 1)
@Measurement(iterations = 10, time = 1)
@Fork(value = 2)
public class MyBench {

    @Param({"10", "100", "1000"})
    int size;

    int[] data;

    @Setup
    public void setup() {
        data = new int[size];
        for (int i = 0; i < size; i++) data[i] = i;
    }

    @Benchmark
    public int sumLoop() {
        int s = 0;
        for (int v : data) s += v;
        return s;   // returning prevents DCE
    }
}
```

Running:

```bash
java -jar benchmarks.jar MyBench
java -jar benchmarks.jar MyBench -prof gc          # add GC profiler
java -jar benchmarks.jar MyBench -prof stack       # add stack sampler
java -jar benchmarks.jar MyBench -prof perfasm     # add assembly dumps
```

JMH runs each benchmark in a forked JVM, warms up for the requested iterations, measures for the requested iterations, and reports mean, standard deviation, and confidence intervals for each variant.

### Modes

- **Throughput** (`Mode.Throughput`) &mdash; ops per unit time.
- **AverageTime** (`Mode.AverageTime`) &mdash; time per op.
- **SampleTime** &mdash; distribution of times (reports percentiles).
- **SingleShotTime** &mdash; one invocation per fork; useful for cold-start costs.

### GC profiler integration

`-prof gc` reports allocation rate and GC overhead alongside throughput:

```
MyBench.sumLoop:·gc.alloc.rate.norm    avgt   20    16.000 ± 0.001   B/op
MyBench.sumLoop:·gc.count              avgt   20     3.000              counts
MyBench.sumLoop:·gc.time               avgt   20    42.000              ms
```

"16 B/op" means each benchmark invocation allocates on average 16 bytes. Excellent signal for spotting hidden boxing or object creation.

---

## 11. OpenTelemetry for JVMs

OpenTelemetry (OTel) is the CNCF-hosted standard for telemetry collection. It unifies what used to be separate projects: OpenCensus (metrics) and OpenTracing (traces). The Java SDK and auto-instrumentation agent are mature and widely deployed.

### The Java agent

OTel ships a zero-code-change Java agent that instruments common libraries automatically:

```bash
JAVA_TOOL_OPTIONS="-javaagent:./opentelemetry-javaagent.jar"
OTEL_SERVICE_NAME="myapp"
OTEL_EXPORTER_OTLP_ENDPOINT="http://collector:4317"
OTEL_TRACES_EXPORTER=otlp
OTEL_METRICS_EXPORTER=otlp
OTEL_LOGS_EXPORTER=otlp
```

What it instruments out of the box (non-exhaustive): Servlet API, Spring MVC/WebFlux, JAX-RS, gRPC, OkHttp, Apache HttpClient, JDBC, Hibernate, MyBatis, MongoDB, Cassandra, Elasticsearch, Kafka, RabbitMQ, Redisson, Jedis, Lettuce, AWS SDK v1/v2, Executors, JVM runtime metrics.

### JVM runtime metrics

The agent emits standard JVM metrics following the [OpenTelemetry Semantic Conventions for JVM metrics](https://opentelemetry.io/docs/specs/semconv/runtime/jvm-metrics/):

- `jvm.memory.used`
- `jvm.memory.committed`
- `jvm.memory.limit`
- `jvm.gc.duration` (histogram)
- `jvm.thread.count`
- `jvm.class.count`
- `jvm.class.loaded`
- `jvm.cpu.time`
- `jvm.cpu.count`
- `jvm.cpu.recent_utilization`

These look very similar to Micrometer&rsquo;s names but use OTel&rsquo;s `.` / attribute conventions.

### Backends

Vendor-neutral: point `OTEL_EXPORTER_OTLP_ENDPOINT` at Jaeger, Zipkin, Grafana Tempo, Prometheus (via OTel Collector), Honeycomb, Lightstep, Datadog, New Relic, Dynatrace, Splunk Observability Cloud, or Elastic APM.

The typical open-source architecture:

```
[ java app ]  -- OTLP/gRPC -->  [ OTel Collector ]  -- routes to -->  Tempo, Loki, Prometheus, Grafana
```

---

## 12. Container-aware diagnostics

Running a JVM inside a container changed everything about memory sizing, and for years the JVM got it wrong.

### The history of the problem

Before Java 10, a JVM inside a Docker container would see the **host**&rsquo;s CPU count and memory, not the container&rsquo;s cgroup limit. A 64 GB host running a JVM in a 2 GB container would try to use 16 GB of heap (25% default `MaxRAMPercentage` of host memory), be OOMKilled, restart, OOMKill again, and loop forever. Thousands of people hit this exact bug.

Java 8u131 added experimental container support behind flags. Java 10 (JEP 252) made it the default. Today:

```bash
-XX:+UseContainerSupport   # default on Java 10+
```

The JVM now reads `/sys/fs/cgroup/memory.max` (cgroup v2) or `/sys/fs/cgroup/memory/memory.limit_in_bytes` (cgroup v1) to determine the memory limit, and `/sys/fs/cgroup/cpu.max` or `cpu.cfs_quota_us` / `cpu.cfs_period_us` for CPU.

### cgroup v1 vs v2

Modern Linux (RHEL 9, Ubuntu 22.04+, Debian 12+, containerd, modern Kubernetes) defaults to **cgroup v2**, which uses a unified hierarchy and different file names. Older systems still use cgroup v1. Java 11+ handles both, but mixed environments sometimes confuse older JVM builds. If in doubt:

```bash
stat -fc %T /sys/fs/cgroup/   # "cgroup2fs" => v2, "tmpfs" => v1
```

### MaxRAMPercentage

Instead of hard-coding `-Xmx` (which assumes you know the container size at build time), use percentages:

```bash
-XX:MaxRAMPercentage=75.0
-XX:InitialRAMPercentage=50.0
-XX:MinRAMPercentage=50.0
```

This tells the JVM "set max heap to 75% of the container memory limit". In a 2 GB container: 1.5 GB heap. In an 8 GB container: 6 GB heap. Same binary, same flags, right heap size.

Why 75% and not 100%? Because the JVM process needs non-heap memory: Metaspace, code cache, direct buffers, thread stacks, GC data structures, JIT scratch. For a small heap (&lt;1 GB) you might need to leave 40% for non-heap. For a large heap (&gt;16 GB), 10&ndash;15% overhead is usually fine.

### Why hard-coded -Xmx is usually wrong

Specifically, `-Xmx4g` in a container is wrong because:

1. It does not adapt if you resize the container.
2. It does not protect against running in a container smaller than 4 GB.
3. It leaks assumptions between Dockerfile and Kubernetes manifest.

The exception: if you *know* the container size (you control both Dockerfile and deployment) *and* you have measured the non-heap footprint accurately, a pinned `-Xmx` is fine and slightly safer because the JVM will not try to expand beyond what you&rsquo;ve budgeted.

### OOMKilled in Kubernetes

When a pod is OOMKilled, the kernel sends SIGKILL to the cgroup, the JVM dies instantly, and there is no heap dump (the JVM never ran `-XX:+HeapDumpOnOutOfMemoryError` because that handles `OutOfMemoryError`, not SIGKILL).

Diagnosing:

```bash
kubectl describe pod myapp-abc
# Look for:
#   Last State:     Terminated
#   Reason:         OOMKilled
#   Exit Code:      137
#   Started:        ...
#   Finished:       ...
```

Exit code 137 = 128 + SIGKILL(9) from the kernel OOM killer. Exit code 139 = SIGSEGV. These do not mean the JVM ran out of Java heap &mdash; they mean *the container* ran out of memory *as seen by the kernel*.

### The heap &ndash; RSS gap

Suppose your container limit is 4 GB, and your JVM is configured with `-Xmx2g`. You observe in Micrometer that `jvm_memory_used_bytes{area="heap"}` never exceeds 1.5 GB. But the pod is being OOMKilled. Where did the other 2.5 GB go?

Candidates:

- **Metaspace** &mdash; unlimited by default. A classloader leak or Groovy/JavaScript code-gen can grow this to gigabytes.
- **Compressed Class Space** &mdash; subset of Metaspace.
- **Code cache** &mdash; up to `-XX:ReservedCodeCacheSize` (240 MB default).
- **Direct buffers (NIO)** &mdash; `ByteBuffer.allocateDirect()`. Limited by `-XX:MaxDirectMemorySize` (defaults to `-Xmx`!).
- **Thread stacks** &mdash; `-Xss` &times; number of threads. 500 threads &times; 1 MB = 500 MB.
- **GC data** &mdash; remembered sets (G1), mark bitmaps (ZGC/Shenandoah), card tables.
- **Native libraries** &mdash; JNI, Netty&rsquo;s direct pool, native crypto, mmap&rsquo;d files.
- **Glibc arena fragmentation** &mdash; malloc arenas per thread, each with its own fragmented free list. Set `MALLOC_ARENA_MAX=2` to tame.

Native Memory Tracking gives you a breakdown:

```bash
-XX:NativeMemoryTracking=summary
# or
-XX:NativeMemoryTracking=detail

jcmd <pid> VM.native_memory summary
jcmd <pid> VM.native_memory summary.diff   # diff against baseline
```

Output:

```
Total: reserved=5263MB, committed=3341MB
-                 Java Heap (reserved=2048MB, committed=2048MB)
-                     Class (reserved=1078MB, committed=87MB)
-                    Thread (reserved=523MB, committed=523MB)
-                      Code (reserved=252MB, committed=45MB)
-                        GC (reserved=201MB, committed=201MB)
-                    Symbol (reserved=23MB, committed=23MB)
-    Native Memory Tracking (reserved=5MB, committed=5MB)
-               Arena Chunk (reserved=1MB, committed=1MB)
```

### k8s memory requests and limits

For JVMs, a widely adopted practice is to set `requests == limits`:

```yaml
resources:
  requests:
    memory: "4Gi"
    cpu: "2"
  limits:
    memory: "4Gi"
    cpu: "2"
```

Why equal? Because if `requests < limits`, Kubernetes schedules the pod as if it needs `requests` but allows it to grow to `limits`. In practice the JVM will use the limit (via `MaxRAMPercentage`) and the kernel will only OOMKill if the node runs out &mdash; but the pod also has a lower QoS class ("Burstable"), meaning it is killed first under node pressure. Setting equal values gives you `Guaranteed` QoS.

CPU handling is trickier. A JVM sees `runtime.availableProcessors()` equal to the CPU limit (ceiling). GC thread counts, ForkJoinPool parallelism, and Netty event loop sizes all derive from this, so overprovisioning CPU slightly is often worth it.

### Liveness and readiness probes that exercise GC

A subtle trap: if your liveness probe is an HTTP endpoint that allocates (say, serializes a JSON status), and GC pauses exceed the probe timeout, Kubernetes will kill the pod during GC. The fix is to make liveness probes *cheap* (a static 200 OK, no allocation) and let readiness probes be the richer ones.

```yaml
livenessProbe:
  httpGet:
    path: /health/live    # static, no allocation
    port: 8080
  initialDelaySeconds: 60
  periodSeconds: 10
  timeoutSeconds: 5
  failureThreshold: 3
readinessProbe:
  httpGet:
    path: /actuator/health/readiness   # deeper check
    port: 8080
  initialDelaySeconds: 30
  periodSeconds: 5
  timeoutSeconds: 3
```

### Container-level memory metrics

Beyond JVM metrics, you want *the container&rsquo;s view* of memory:

- **node_exporter** &mdash; exposes node-level memory, CPU, disk.
- **cAdvisor** &mdash; exposes per-container memory (RSS, cache, swap) and CPU (via cgroup stats). Already built into kubelet in Kubernetes.

Useful PromQL for container memory:

```promql
container_memory_working_set_bytes{pod="myapp-abc"}
  / on(pod) kube_pod_container_resource_limits{resource="memory"}
```

This ratio is what the OOM killer uses. If it hits 1.0, you get OOMKilled.

---

## 13. Commercial APM tools

The free/open-source stack (Micrometer + Prometheus + Grafana + OpenTelemetry + JFR) has become capable enough that most teams can operate a production JVM with nothing else. But commercial APM vendors still sell real value: turnkey deployment, deep code-level instrumentation, cross-service trace correlation, and incident workflows polished over years.

### Datadog APM

- Unified agent: one binary collects logs, metrics, traces, profiles.
- Java auto-instrumentation agent (`dd-java-agent.jar`) modeled closely on OpenTelemetry.
- Continuous profiler integrates with JFR.
- JVM metrics, GC overhead, allocation rate, heap breakdown in the standard dashboard.
- Cost: per-host billing, historically expensive at scale.

### New Relic APM

- Java agent with deep instrumentation of Spring, JEE, Hibernate, and 200+ frameworks.
- Thread profiles, transaction traces, database query traces.
- JVM dashboards with GC timing, heap, thread states.
- Cost: changed to user-based pricing in 2020; aggressive free tier for small teams.

### Dynatrace OneAgent

- OneAgent auto-discovers every process on a host and instruments it without configuration.
- &ldquo;Davis&rdquo; AI engine for root cause analysis.
- Deep JVM diagnostics: CPU hotspots, memory allocation by class, lock contention, IO wait.
- Cost: premium tier, typically enterprise sales.

### AppDynamics

- Cisco-owned. Historically strong in large enterprise environments.
- Java agent with business-transaction modeling (groups requests by URL pattern or user journey).
- JVM dashboards, heap snapshots, thread snapshots, method hotspots.

### Trade-offs

**Pros:** turnkey setup, polished UI, cross-service trace correlation, expert incident support, SLAs, consolidated billing.

**Cons:** cost scales with host count or data ingestion rate, lock-in (metric formats, trace formats, query languages), agent overhead (1&ndash;5% typical but can be higher under load), data leaves your infrastructure.

For regulated environments (finance, healthcare) the data-locality concern often tips the decision toward the OSS stack, which can run entirely inside your VPC.

---

## 14. The free/open-source observability stack

A complete OSS stack for a JVM service looks like:

| Concern    | Tool                                      |
|------------|-------------------------------------------|
| Metrics collection | Spring Boot Actuator + Micrometer |
| Metrics storage    | Prometheus                        |
| Metrics viz        | Grafana                           |
| Logs               | Loki (or Elasticsearch + Kibana)  |
| Traces             | Jaeger or Grafana Tempo           |
| Instrumentation    | OpenTelemetry Java agent          |
| Profiling          | JFR + async-profiler              |
| Dashboards         | Grafana                           |
| Alerting           | Alertmanager or Grafana Alerting  |

Grafana Labs has consolidated most of this under "Grafana LGTM" (Loki, Grafana, Tempo, Mimir), which can be deployed as Helm charts onto any Kubernetes cluster. A 3-node cluster of LGTM + OTel Collector + Prometheus scrape agents will happily observe hundreds of JVM services at a cost of a few dollars of cloud spend per day.

Example `docker-compose.yml` for a local "laptop observability" stack:

```yaml
services:
  prometheus:
    image: prom/prometheus:latest
    ports: ["9090:9090"]
    volumes: ["./prometheus.yml:/etc/prometheus/prometheus.yml"]
  grafana:
    image: grafana/grafana:latest
    ports: ["3000:3000"]
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin
  tempo:
    image: grafana/tempo:latest
    ports: ["3200:3200", "4317:4317"]
    command: ["-config.file=/etc/tempo.yml"]
    volumes: ["./tempo.yml:/etc/tempo.yml"]
  loki:
    image: grafana/loki:latest
    ports: ["3100:3100"]
```

Point the OTel Java agent at `http://tempo:4317`, scrape Prometheus against your Spring Boot `/actuator/prometheus`, add Grafana datasources for all three, and you have a full observability stack on a laptop.

---

## 15. Incident response checklist for JVM issues

Most JVM incidents reduce to one of six symptoms. Here is a quick-reference table for what to check first.

### "The app is slow"

1. Check GC pause p99 in Grafana. If it is > 200 ms, GC is a suspect.
2. Check `rate(jvm_gc_pause_seconds_sum[5m])` &mdash; if &gt;0.05 (5% of wall time in GC), allocation rate is probably too high.
3. Take a wall-clock async-profiler recording for 60 seconds and look at the flame graph. Wide boxes at the top are the hotspots.
4. Take 3 thread dumps 5 seconds apart. Look for threads in `BLOCKED` state at the same monitor &mdash; contention hotspot.
5. If dedicated to I/O, check `SocketInputStream` in flame graph. If database, check slow query logs.

### "The app threw OutOfMemoryError"

1. Check that `-XX:+HeapDumpOnOutOfMemoryError` is set. It should have written a dump.
2. Note the OOM type:
   - `Java heap space` &mdash; the real heap is full. Analyze hprof with MAT.
   - `GC overhead limit exceeded` &mdash; GC is running constantly without freeing memory. Same analysis.
   - `Metaspace` &mdash; classloader leak. Dump is useless here; use `jcmd VM.classloader_stats` and look for classloaders with many classes.
   - `Direct buffer memory` &mdash; increase `-XX:MaxDirectMemorySize` or find the leaker (often Netty, Kafka, Lucene).
   - `unable to create native thread` &mdash; OS thread limit or `ulimit -u`. Not a heap problem.
3. For heap exhaustion, run MAT Leak Suspects Report on the dump.
4. Check if the error repeats at a fixed interval (cron job? cache flush? scheduled task?) &mdash; that hints at the trigger.

### "OOMKilled (exit 137)"

This is **not** a Java OOM. It is the kernel OOM killer.

1. Check `kubectl describe pod` for the exit code and last state.
2. Graph `container_memory_working_set_bytes` over the last 24 hours. Did it grow steadily (leak) or spike (load burst)?
3. Compare to `container_spec_memory_limit_bytes`. How close was the working set to the limit?
4. Check JVM heap size over the same period from Micrometer. Is heap stable but RSS growing? Native leak.
5. Enable `-XX:NativeMemoryTracking=summary`, redeploy, wait for recurrence, run `jcmd VM.native_memory summary.diff`.
6. Candidates for native leaks: Metaspace, direct buffers, glibc arena fragmentation, JNI libraries, thread stack explosion.
7. Set `MALLOC_ARENA_MAX=2` on glibc to eliminate arena-per-thread fragmentation.

### "Long GC pauses"

1. Read the GC log. What collector? G1? Parallel? ZGC?
2. If G1: look for Humongous allocations (`gc+humongous`). Humongous objects (&gt;half a region) go straight to old and can cause mixed collections to struggle.
3. Check promotion rate &mdash; if young-to-old promotion is high, Eden is undersized or survivor tenuring threshold is too low.
4. Check `safepoint` log. Are non-GC safepoints (bias revocation, deopt, thread dump) contributing?
5. If moving to ZGC would help: if pauses need to be &lt;10 ms regardless of heap size, yes, move to ZGC.

### "High CPU"

1. Run async-profiler CPU mode for 30 seconds.
2. Look at the flame graph:
   - Wide `G1ParScanThreadState` or `ZMark` etc. &mdash; GC is the culprit. Tune or reduce allocation.
   - Wide `C2 Compiler` &mdash; JIT is the culprit. Check if code cache is thrashing (`-XX:+PrintCodeCache`).
   - Wide application methods &mdash; algorithmic issue. Find the caller; add a cache or rewrite.
3. Cross-check `jvm.threads.live` &mdash; sometimes high CPU is just "too many threads doing busy work".

### "Slow startup"

1. Measure actual startup with JFR: `-XX:StartFlightRecording=duration=60s,filename=startup.jfr`.
2. Open in JMC. Startup cost usually concentrates in classloading, JIT, and application init.
3. Mitigations, in order of effort:
   - **CDS (Class Data Sharing)** &mdash; JVM-shipped baseline classes pre-parsed. Essentially free.
   - **AppCDS** &mdash; extends CDS to your application&rsquo;s classes. Takes a build step.
   - **Ahead-of-Time compilation** &mdash; JEP 295, used in specialized deployments.
   - **GraalVM Native Image** &mdash; compile to a native binary, instant startup, but different tuning model. See [native-image.md](./native-image.md) in this series.
   - **CRaC (Coordinated Restore at Checkpoint)** &mdash; JEP in progress, save a warmed JVM to disk and restore it. Being explored by Spring Boot, Quarkus, Helidon.

---

## Closing thoughts

A JVM is a glass box. Every collector, every allocation, every lock contention event, every compilation decision is instrumented. The tools in this chapter let you open the box at any time, in production, at negligible cost, and read exactly what is happening.

Three habits keep the glass clean:

1. **Turn everything on at deploy time, not at incident time.** GC logs rotating, JFR continuous recording, Prometheus scraping, heap dump on OOM. The cost is $0; the value during an incident is everything.
2. **Always diff, never absolute.** "Is the heap full?" is less useful than "is the live data size growing faster than last week?" Good monitoring is a story over time.
3. **Match the tool to the question.** Metrics for *is something wrong*. Logs and traces for *what is wrong*. Profiles for *why*. Reaching for a heap dump when a thread dump would answer faster is a common beginner mistake.

The chapters that follow in this series will return to specific collectors, allocators, and tuning strategies. Whenever they say "measure first", this is the chapter they are referring to.

---

*Next: [Tuning workflows &mdash; from symptoms to flags](./tuning-workflows.md)*
*Previous: [Native Image, CRaC, and the post-JIT world](./native-image.md)*

---

## Study Guide — JVM Monitoring & Diagnostics

### Tool map

- **jcmd / jstat / jmap / jstack** — baseline diagnostics.
- **JFR (Java Flight Recorder)** — low-overhead profiler.
- **JMC (JDK Mission Control)** — JFR viewer.
- **async-profiler** — sampling profiler with perf integration.
- **Micrometer** — metrics library.
- **Prometheus / Grafana** — storage and dashboards.

### DIY 1 — Record a JFR profile

`java -XX:StartFlightRecording=duration=60s,filename=rec.jfr -jar app.jar`
then open `rec.jfr` in JMC.

### DIY 2 — async-profiler flame graph

`./profiler.sh -d 30 -f flame.html <pid>`. Open flame.html in a
browser. The hottest stacks are the widest boxes.

### TRY — Wire up Micrometer + Grafana

Add `micrometer-registry-prometheus`, expose `/actuator/prometheus`,
scrape with a local Prometheus, graph in Grafana.

---

## Related College Departments

- [**engineering**](../../../.college/departments/engineering/DEPARTMENT.md)
