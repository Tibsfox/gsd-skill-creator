# Performance Engineering

Performance engineering is not optimization. Optimization is what you do to code that already works. Performance engineering is the discipline of building systems that meet their latency, throughput, and resource targets from the start, and of instrumenting those systems so you know when they drift. It sits at the intersection of systems thinking, statistical reasoning, and operational rigor. A slow system is not merely inconvenient. At scale, latency is money, and tail latency is the money you did not know you were losing.

This module covers the full spectrum: from decomposing latency budgets and profiling production systems, through database and cache optimization, to CDN operations, load balancer tuning, kernel parameters, and the discipline of benchmarking without fooling yourself. Two frameworks anchor the discussion throughout. Brendan Gregg's USE method (Utilization, Saturation, Errors) applies to every physical resource. Tom Wilkie's RED method (Rate, Errors, Duration) applies to every service. Together they form a complete observability language for performance work.

---

## 1. Latency Budgets

### Why Averages Lie

The average latency of a service tells you almost nothing about user experience. If your average response time is 50ms but your p99 is 2,000ms, one in every hundred users waits forty times longer than the "average" suggests. Performance engineering works in percentiles.

| Percentile | What It Tells You | Who Cares |
|---|---|---|
| p50 (median) | The typical experience | Product managers, general monitoring |
| p95 | The experience of your unlucky-but-not-rare users | SREs setting SLOs |
| p99 | The tail that drives user complaints and retry storms | Performance engineers, capacity planners |
| p99.9 | Often reveals systemic issues (GC, lock contention) | Deep diagnostics |

The gap between p50 and p99 is where real engineering happens. A service with p50=5ms and p99=500ms has a 100x latency variance, which usually indicates queueing, garbage collection pauses, lock contention, or resource starvation under load.

### End-to-End Latency Decomposition

A user request in a modern system passes through multiple stages. Each stage consumes a fraction of the total latency budget. A decomposition for a typical web application:

```
Client DNS lookup ............  5 ms
TCP + TLS handshake .......... 30 ms
CDN edge (cache hit) .........  2 ms
Load balancer .................  1 ms
Application server ........... 20 ms
  ├── Authentication .........  3 ms
  ├── Business logic .........  5 ms
  ├── Database query ......... 10 ms
  └── Serialization ...........  2 ms
Network return ............... 15 ms
Client rendering ............. 50 ms
─────────────────────────────────────
Total budget ................ 123 ms
```

The discipline is to assign each component a budget, measure against it, and alert when any component exceeds its allocation. Without decomposition, you cannot tell whether a slow page is caused by a slow database, a slow CDN, or a slow client.

### Amdahl's Law Applied to Latency

Amdahl's Law, originally about parallelism, applies directly to latency optimization. If a component accounts for 10% of your total latency, making it infinitely fast can only reduce total latency by 10%. The implication: always optimize the largest contributor first.

The formula: `Speedup = 1 / ((1 - p) + p/s)` where p is the fraction of time spent in the component and s is the speedup factor.

For microservices, this gets worse. A 2018 paper by Delimitrou and Kozyrakis ("Amdahl's Law for Tail Latency," Communications of the ACM) showed that optimizing for tail latency makes Amdahl's Law more consequential than optimizing for average latency. When services are chained, the overall p99 is bounded by the worst p99 among them. For parallel fan-out calls, the math is brutal: if your page requires five parallel API calls, each with p99 at 100ms, the probability that all five complete within 100ms is only 0.99^5 = 95%. To achieve an overall p99 of 100ms with five parallel calls, each call needs to hit roughly p99.8.

### Latency Budget Allocation

Practical allocation follows a principle: spend the budget where users notice it most.

| Tier | Budget Share | Typical Target | Rationale |
|---|---|---|---|
| Network / CDN | 30-40% | 30-50ms | Physics-bounded, optimize with edge caching |
| Application logic | 20-30% | 20-40ms | Where engineering effort has highest ROI |
| Database | 15-25% | 15-30ms | Index optimization, query design, caching |
| Serialization / rendering | 10-15% | 10-20ms | Often overlooked, often cheap to fix |

---

## 2. Profiling in Production

### The Shift to Continuous Profiling

Traditional profiling happens in development. You attach a profiler, reproduce the issue, analyze the output. Continuous profiling inverts this: profilers run always, in production, at low overhead, and you analyze after the fact. This matters because production workloads differ from test workloads, and the bugs that matter most are the ones you cannot reproduce.

Three tools define the current landscape:

| Tool | Approach | Overhead | Language Support | Deployment |
|---|---|---|---|---|
| Grafana Pyroscope | Language-native agents + eBPF | 1-3% | Go, Java, Python, Ruby, .NET, Rust, Node.js | Self-hosted or Grafana Cloud |
| Parca | eBPF-based, zero instrumentation | <1% | Any compiled language (C, C++, Go, Rust) | Self-hosted, CNCF project |
| Google Cloud Profiler | Sampling agent | ~0.5% | Go, Java, Python, Node.js | GCP-managed |

Pyroscope was acquired by Grafana Labs in 2023 and now integrates natively with Grafana dashboards. Parca uses eBPF to profile without modifying application code, making it the lowest-overhead option for compiled languages. Both support the emerging OpenTelemetry profiling signal.

### Flame Graphs

Brendan Gregg invented flame graphs to solve a specific problem: stack trace data is too dense to read as text. A flame graph turns thousands of stack samples into a single interactive visualization where:

- The x-axis represents the population of stack samples (not time)
- The y-axis represents stack depth (callers below, callees above)
- The width of each box represents the frequency of that function in the sample set
- Color is typically random or used for categorization, not significance

There are several types of flame graphs for different problems:

**On-CPU flame graphs** show where your code spends CPU cycles. Generated from `perf record -F 99 -a -g -- sleep 30` on Linux, sampling at 99 Hz across all CPUs.

**Off-CPU flame graphs** show where your code is blocked (I/O, locks, sleep). These are harder to capture safely in production because scheduler events scale with load. eBPF-based approaches sum off-CPU time in kernel context, keeping overhead manageable.

**Memory flame graphs** show allocation sites. Useful for tracking down memory leaks and allocation-heavy code paths.

**Differential flame graphs** compare two profiles, coloring functions red (more samples) or blue (fewer samples). Essential for validating that an optimization actually worked.

### Sampling vs. Instrumentation

| Aspect | Sampling | Instrumentation |
|---|---|---|
| How it works | Periodic snapshots of the call stack | Code injected at function entry/exit |
| Overhead | Low (1-3% typical) | High (10-50% possible) |
| Accuracy | Statistical (misses short functions) | Exact (captures every call) |
| Production safety | Generally safe | Risky for hot paths |
| Setup effort | Minimal (attach to process) | Requires code changes or agent |

The production rule: **sampling for always-on monitoring, instrumentation for targeted debugging.** Never instrument a hot path in production without measuring the overhead first.

### The Overhead Question

Acceptable production profiling overhead is under 3%. At 1% overhead, you can run continuous profiling indefinitely. At 3%, consider duty-cycling (10 minutes on, 50 minutes off). Above 5%, restrict to targeted investigations.

eBPF-based profilers (Parca, Pyroscope's eBPF mode) typically achieve under 1% by doing aggregation in kernel space, avoiding the cost of copying every stack trace to user space.

---

## 3. Database Query Optimization

### EXPLAIN Plans

Every performance-critical query should be run through `EXPLAIN ANALYZE` before reaching production. The output tells you exactly what the database planner chose to do and how long each step took.

```sql
EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT)
SELECT o.id, o.total, c.name
FROM orders o
JOIN customers c ON c.id = o.customer_id
WHERE o.created_at > '2025-01-01'
  AND o.status = 'shipped';
```

Key things to look for in the output:

- **Seq Scan** on a large table: usually means a missing index
- **Nested Loop** with high row estimates: consider a hash or merge join
- **Rows removed by Filter** far exceeding rows returned: the planner chose a bad plan or the statistics are stale (run `ANALYZE`)
- **Buffers: shared hit vs shared read**: high read count means data is not in the buffer cache

### Index Strategies

| Index Type | Best For | Example Use Case |
|---|---|---|
| B-tree | Equality, range queries, sorting, LIKE 'prefix%' | `WHERE created_at > '2025-01-01'` |
| Hash | Equality-only (no range) | `WHERE session_id = 'abc123'` |
| GIN | Multi-valued columns, full-text search, JSONB containment | `WHERE tags @> ARRAY['urgent']` |
| GiST | Geometric data, range types, nearest-neighbor | `WHERE location <-> point(47.6, -122.3) < 1000` |
| BRIN | Very large tables with naturally ordered data | `WHERE created_at BETWEEN ...` on append-only log tables |

B-tree is the default and handles the vast majority of cases. The common mistake is adding GIN or GiST indexes without understanding the query patterns they serve. A GIN index on a JSONB column is powerful for containment queries (`@>`) but useless for equality on the whole document.

**Partial indexes** reduce index size dramatically when you only query a subset:

```sql
CREATE INDEX idx_orders_active ON orders (customer_id)
WHERE status NOT IN ('cancelled', 'archived');
```

**Composite indexes** follow the left-prefix rule. An index on `(a, b, c)` can serve queries on `(a)`, `(a, b)`, and `(a, b, c)`, but not `(b, c)` alone.

### The N+1 Query Problem

The most common performance bug in applications using ORMs. Loading a list of 100 orders, then loading the customer for each order individually, produces 101 queries instead of 1 or 2.

Detection: enable slow query logging and look for queries with high `calls` count and low `avg_rows` (often 1). In PostgreSQL, the `pg_stat_statements` extension tracks this:

```sql
SELECT query, calls, mean_exec_time, rows
FROM pg_stat_statements
ORDER BY calls DESC
LIMIT 20;
```

The fix is almost always a JOIN or a WHERE IN clause:

```sql
-- Instead of 100 individual queries:
SELECT * FROM customers WHERE id IN (
  SELECT DISTINCT customer_id FROM orders WHERE ...
);
```

### Connection Pooling

PostgreSQL forks a new process for every connection. At 500+ connections, this becomes the bottleneck, not the queries. PgBouncer sits between your application and PostgreSQL, multiplexing hundreds of application connections across a small pool of database connections.

| Pooling Mode | Connection Reuse | Limitations |
|---|---|---|
| Session | One app connection = one DB connection for its lifetime | No pooling benefit |
| Transaction | Connection returned to pool after each transaction | Cannot use session-level features (prepared statements with some drivers, LISTEN/NOTIFY, SET) |
| Statement | Connection returned after each statement | Most restrictive, highest efficiency |

Transaction pooling is the standard choice. PgBouncer configuration:

```ini
[databases]
myapp = host=127.0.0.1 port=5432 dbname=myapp

[pgbouncer]
listen_port = 6432
pool_mode = transaction
max_client_conn = 1000
default_pool_size = 25
reserve_pool_size = 5
reserve_pool_timeout = 3
server_idle_timeout = 300
```

The rule of thumb: `default_pool_size` should be roughly `2 * CPU cores` on the database server, plus a small reserve. More connections than this causes contention on internal PostgreSQL locks and actually slows things down.

### Read Replica Routing

For read-heavy workloads, routing SELECT queries to read replicas offloads the primary. This can be done at the application level (separate connection strings), at the proxy level (Pgpool-II, ProxySQL for MySQL), or at the infrastructure level (AWS Aurora reader endpoints). The critical consideration is replication lag: if your application reads data it just wrote, the replica may not have it yet. The pattern is "read your own writes" -- route to the primary for the brief window after a write, then fall back to replicas.

---

## 4. Caching Strategies

### The Cache Hierarchy

Modern systems use a layered cache architecture, each layer trading capacity for speed:

```
L1: Application memory (HashMap, Guava, Caffeine)
    ├── Latency: <1ms (in-process)
    ├── Size: 100MB-1GB
    └── Scope: Single instance

L2: Distributed cache (Redis, Memcached)
    ├── Latency: 1-5ms (network hop)
    ├── Size: 10GB-1TB
    └── Scope: Shared across instances

L3: CDN edge cache (CloudFront, Cloudflare)
    ├── Latency: 5-50ms (varies by PoP proximity)
    ├── Size: Effectively unlimited
    └── Scope: Global, per-URL
```

The lookup order is L1 then L2 then L3 then origin. Each layer absorbs traffic that would otherwise hit the next layer. A well-tuned L1 cache with a 90% hit rate means L2 only handles 10% of requests. If L2 also has 90% hit rate, only 1% reaches the origin.

### Redis Operations

Redis is the dominant distributed cache. Key operational decisions:

**Eviction policies** determine what happens when memory is full:

| Policy | Behavior | Best For |
|---|---|---|
| `allkeys-lru` | Evict least recently used keys across all keys | General-purpose caching |
| `allkeys-lfu` | Evict least frequently used keys | Workloads with stable hot set |
| `volatile-lru` | Evict LRU keys, but only those with TTL set | Mixed cache + persistent data |
| `volatile-ttl` | Evict keys closest to expiration | When TTL reflects priority |
| `noeviction` | Return errors when memory full | When data loss is unacceptable |

`allkeys-lfu` (available since Redis 4.0) is often the better default for caching workloads. It uses a probabilistic Morris counter to estimate access frequency with minimal memory overhead, combined with a time-decay factor so historical popularity eventually fades.

**Cluster mode** shards data across multiple nodes using hash slots (16,384 slots). Each key is assigned to a slot via `CRC16(key) mod 16384`. Multi-key operations (MGET, pipelines) must ensure all keys map to the same slot, typically by using hash tags: `{user:123}:profile` and `{user:123}:settings` are guaranteed to land on the same shard.

**Persistence** in a caching context: generally do not enable AOF or RDB for pure caches. Persistence adds I/O overhead and recovery time. If the cache is cold after restart, that is acceptable. If it is not acceptable, you are using Redis as a database, not a cache.

### Cache Invalidation Strategies

| Strategy | How It Works | Consistency | Complexity |
|---|---|---|---|
| TTL-based | Keys expire after a fixed duration | Eventually consistent | Low |
| Event-driven | Application publishes invalidation events on write | Near-real-time | Medium |
| Write-through | Every write updates both cache and database | Strong | Medium |
| Write-behind | Writes go to cache first, async flush to database | Weak (risk of data loss) | High |

TTL-based invalidation is the simplest and most common. The trade-off is staleness: a 60-second TTL means data can be up to 60 seconds out of date. For most read-heavy workloads, this is acceptable. For financial data or inventory counts, it is not.

Event-driven invalidation using pub/sub or a message queue provides near-instant consistency but requires careful engineering. The pattern: on every write to the database, publish an invalidation message. Cache subscribers delete the affected keys. The subtlety is ordering: if the invalidation message arrives before the database commit is visible to replicas, a subsequent cache miss will re-populate with stale data. The fix is a short delay (50-100ms) before cache repopulation.

### Cache Stampede Prevention

A cache stampede (thundering herd) occurs when a hot key expires and hundreds of concurrent requests simultaneously query the database to regenerate it. Three defenses:

**Locking (mutex):** Only one request regenerates the cached value. Others wait or serve stale data. Simple but introduces a synchronization point.

**Probabilistic early expiration:** Each request independently decides whether to regenerate the value before it expires, with probability increasing as expiration approaches. The formula: `should_refresh = (current_time - (expiry - ttl * beta * ln(random()))) > 0` where beta is a tuning factor (1.0-2.0). This spreads regeneration over time, preventing the thundering herd.

**Singleflight / request coalescing:** Multiple concurrent requests for the same key are collapsed into a single backend call. Go's `golang.org/x/sync/singleflight` package is the canonical implementation. Cloudflare uses this pattern at their CDN edge to handle millions of requests per second.

The production recommendation: combine probabilistic early expiration with singleflight. The former prevents most stampedes, the latter catches any that slip through.

### The Cache-Is-Not-a-Database Principle

If losing the cache causes an outage, you have built a system that depends on the cache for correctness, not just performance. The cache should always be rebuildable from the source of truth. Test this by periodically flushing the cache in staging and verifying the system degrades gracefully (slower, not broken).

---

## 5. CDN Operations

### The Big Three

| CDN | Network Size | Edge Compute | Pricing Model | Strength |
|---|---|---|---|---|
| Cloudflare | 335+ cities, 125+ countries | Workers (V8 isolates) | Bandwidth-inclusive on most plans | Largest network, integrated security |
| AWS CloudFront | 600+ PoPs, 50+ countries | Lambda@Edge, CloudFront Functions | Pay-per-request + data transfer | AWS ecosystem integration |
| Fastly | 80+ PoPs, strategic locations | Compute@Edge (Wasm) | Pay-per-request + data transfer | Real-time purge (<150ms), VCL flexibility |

Cloudflare leads in network reach and served approximately 20% of global internet traffic as of 2025. CloudFront is the default for AWS-native stacks. Fastly dominates where real-time purge and fine-grained cache control matter (media, publishing, e-commerce).

### Cache Hit Ratio Optimization

Cache hit ratio is the single most important CDN metric. Every cache miss means a round trip to your origin, adding latency and origin load.

Target ratios by content type:

| Content Type | Target Hit Ratio | Key Lever |
|---|---|---|
| Static assets (JS, CSS, images) | >95% | Long TTL (1 year) + versioned filenames |
| API responses (cacheable) | 70-90% | Cache-Control headers, Vary header discipline |
| HTML pages | 50-80% | Short TTL + stale-while-revalidate |
| Personalized content | 0% (do not cache) | Separate cacheable from uncacheable at the URL level |

Common mistakes that kill hit ratios:
- **Vary: * or Vary on too many headers** fragments the cache into millions of variants
- **Query string pollution** (analytics params, session tokens in URLs) creates unique cache keys for identical content
- **Missing Cache-Control headers** causes CDNs to apply default behavior, which varies by provider
- **Set-Cookie on cacheable responses** most CDNs will not cache responses that set cookies

### Purge Strategies

| Strategy | Speed | Granularity | Use Case |
|---|---|---|---|
| Single URL purge | Seconds | One object | Correcting a specific bad deployment |
| Tag/surrogate-key purge | Seconds | All objects tagged | "Purge everything related to product-123" |
| Prefix purge | Seconds to minutes | Path-based | "Purge everything under /api/v2/" |
| Full purge | Minutes | Everything | Nuclear option, last resort |

Fastly's surrogate key system is the gold standard for selective purging. Tag responses with `Surrogate-Key: product-123 category-shoes` and purge all content related to a product or category in a single API call, completing in under 150ms globally.

### Origin Shield

An origin shield is an intermediate cache layer between edge PoPs and your origin. Without it, a cache miss at each of 300 edge PoPs sends 300 requests to your origin. With an origin shield, those 300 misses are collapsed into one request to the shield, which then serves the other 299. This dramatically reduces origin load for popular content and is essential for origin servers that cannot handle high concurrency.

### CDN as DDoS Mitigation

CDNs absorb volumetric DDoS attacks by design. Their networks are engineered for massive bandwidth. Cloudflare has mitigated attacks exceeding 5 Tbps. The pattern is: all traffic hits the CDN first, the CDN filters malicious traffic, and only clean traffic reaches your origin. This is often the single best return on investment for DDoS protection: you were going to use a CDN anyway, and it comes with Tbps-scale traffic absorption at the edge.

---

## 6. Load Balancer Tuning

### Algorithm Selection

| Algorithm | How It Works | Best For | Watch Out For |
|---|---|---|---|
| Round-robin | Requests distributed sequentially | Homogeneous backends, stateless services | Ignores backend load/capacity |
| Least-connections | Routes to the backend with fewest active connections | Varied request durations | Can overwhelm a slow backend (it finishes fewer connections, so always appears "least busy" then receives more) |
| Weighted round-robin | Round-robin with capacity weights | Heterogeneous hardware | Requires manual weight tuning |
| Consistent hashing | Hash of request attribute (IP, header, URL) maps to backend | Session affinity without sticky sessions, caching tiers | Uneven distribution with few backends |
| Random with two choices (P2C) | Pick two random backends, route to the one with fewer connections | Large backend pools | Needs pool size > 10 to show benefit |

For most stateless web services, **least-connections** or **P2C (power of two choices)** is the correct default. Round-robin is acceptable only when all requests take roughly the same time and all backends have equal capacity.

### Layer 4 vs. Layer 7

| Aspect | Layer 4 (TCP/UDP) | Layer 7 (HTTP/gRPC) |
|---|---|---|
| What it sees | Source/dest IP, port | Full request: URL, headers, cookies, body |
| Routing decisions | IP-based, port-based | Content-based (path, host, header) |
| TLS termination | Passthrough (backend terminates) | LB terminates (can inspect traffic) |
| Performance | Higher throughput, lower latency | Lower throughput, more features |
| Use case | High-throughput TCP services, databases, non-HTTP protocols | HTTP APIs, web applications, gRPC |

Use Layer 4 when you do not need content-based routing. Use Layer 7 when you do. In practice, most web services need Layer 7 for path-based routing, header inspection, and connection multiplexing (HTTP/2 to backends).

### HAProxy vs. nginx vs. Cloud LB

| Feature | HAProxy | nginx | AWS ALB/NLB |
|---|---|---|---|
| Primary role | Load balancer (purpose-built) | Web server + reverse proxy + LB | Managed cloud LB |
| Runtime API | Full (change weights, drain, enable/disable) | Limited (upstream modifications via Plus) | API/Console |
| Health checks | Advanced (agent checks, multiple conditions) | Basic (TCP, HTTP) | Configurable (HTTP, TCP, gRPC) |
| Connection draining | Native, configurable | Supported but less granular | Native |
| Configuration | Text config, hot-reload | Text config, hot-reload | Infrastructure-as-code |
| Best for | High-performance, complex routing | When you also need web serving | When fully in the cloud |

**Connection draining** is critical for zero-downtime deployments. When removing a backend from rotation, the load balancer stops sending new connections but allows existing connections to complete. HAProxy supports this natively through its admin socket:

```
echo "set server mybackend/server1 state drain" | socat stdio /var/run/haproxy/admin.sock
```

### Health Checks

Configure health checks to detect real problems, not just TCP connectivity:

```
# HAProxy health check configuration
backend app_servers
    option httpchk GET /healthz HTTP/1.1\r\nHost:\ app.example.com
    http-check expect status 200
    default-server inter 3s fall 3 rise 2
    server app1 10.0.1.1:8080 check
    server app2 10.0.1.2:8080 check
```

- `inter 3s`: check every 3 seconds
- `fall 3`: mark unhealthy after 3 consecutive failures
- `rise 2`: mark healthy after 2 consecutive successes

Check a meaningful endpoint (`/healthz` that verifies database connectivity) rather than just `/` which may return 200 even when the application is broken.

### Sticky Sessions

Avoid sticky sessions unless absolutely required (stateful WebSocket connections, legacy session-based applications). They create uneven load distribution, complicate deployments (you cannot drain a server if sticky clients keep reconnecting to it), and mask the real problem, which is application state that should be externalized to a shared store (Redis, database).

---

## 7. Kernel Tuning

### The Principle

**Do not tune what you do not understand.** Every sysctl change is a trade-off. Increasing one buffer means decreasing memory available for something else. Disabling a safety mechanism improves performance until the condition it guarded against occurs. Change one parameter at a time, measure the effect, and document why.

### Parameters That Matter

For high-connection-count web servers, these are the parameters with the highest impact:

```bash
# /etc/sysctl.d/99-performance.conf

# Maximum number of connections queued for accept()
# Default: 4096. Set higher for servers accepting many connections.
net.core.somaxconn = 65535

# Allow reuse of TIME_WAIT sockets for new connections.
# ONLY enable on servers, NEVER on NAT gateways.
net.ipv4.tcp_tw_reuse = 1

# Maximum number of open file descriptors (system-wide)
fs.file-max = 2097152

# Increase the maximum receive and send buffer sizes
net.core.rmem_max = 16777216
net.core.wmem_max = 16777216

# TCP receive and send buffer auto-tuning ranges
# (min, default, max) in bytes
net.ipv4.tcp_rmem = 4096 87380 16777216
net.ipv4.tcp_wmem = 4096 65536 16777216

# Increase the backlog for incoming connections
net.core.netdev_max_backlog = 65536

# Enable TCP Fast Open (client + server)
net.ipv4.tcp_fastopen = 3

# Reduce FIN_WAIT2 timeout (default 60s is often too long)
net.ipv4.tcp_fin_timeout = 15
```

Apply with `sysctl --system` and make persistent in `/etc/sysctl.d/`.

### File Descriptors

The per-process file descriptor limit is separate from the system-wide `fs.file-max`. For applications handling many connections (each socket is a file descriptor):

```bash
# /etc/security/limits.d/99-performance.conf
*  soft  nofile  1048576
*  hard  nofile  1048576
```

Also set in the systemd unit file for the service:

```ini
[Service]
LimitNOFILE=1048576
```

### Huge Pages

Transparent huge pages (THP) can help or hurt. For large-memory database workloads (PostgreSQL, Redis), THP can cause latency spikes due to compaction. Many database vendors recommend disabling THP and using explicit huge pages instead:

```bash
# Disable transparent huge pages
echo never > /sys/kernel/mm/transparent_hugepage/enabled

# For PostgreSQL: allocate explicit huge pages
# Calculate: shared_buffers / 2MB huge page size
vm.nr_hugepages = 4096  # = 8GB / 2MB
```

Redis explicitly warns against THP in its logs and recommends disabling them.

### CPU Governor

For latency-sensitive workloads, the CPU frequency governor matters. The `powersave` governor saves energy but introduces variable latency as the CPU scales frequency up and down. The `performance` governor locks CPUs at maximum frequency:

```bash
# Check current governor
cat /sys/devices/system/cpu/cpu0/cpufreq/scaling_governor

# Set performance governor
cpupower frequency-set -g performance
```

The trade-off is power consumption. For cloud instances, this is usually managed by the hypervisor and not configurable. For bare metal, `performance` governor is the standard for latency-sensitive services.

### I/O Scheduler

| Scheduler | Best For | Mechanism |
|---|---|---|
| `none` (noop) | NVMe SSDs, virtual machines | No reordering, FIFO |
| `mq-deadline` | Spinning disks, latency-sensitive SSD workloads | Deadline-based, prevents starvation |
| `bfq` | Desktop / interactive workloads | Fair queuing, good for mixed workloads |
| `kyber` | Fast SSDs with consistent latency | Token-based, minimal overhead |

For modern NVMe storage, `none` is usually correct because the device itself handles scheduling. For SATA SSDs, `mq-deadline` is a safe default.

```bash
# Check current scheduler
cat /sys/block/nvme0n1/queue/scheduler

# Set scheduler
echo none > /sys/block/nvme0n1/queue/scheduler
```

---

## 8. Benchmarking Methodology

### Coordinated Omission

The single most important concept in benchmarking is coordinated omission, identified and named by Gil Tene. It occurs when the benchmarking tool inadvertently coordinates with the system under test by slowing down its request rate when the system slows down.

The mechanism: most benchmarking tools (including the original wrk) use a closed-loop model. They send a request, wait for the response, then send the next request. When the system stalls for 1 second, the tool also pauses for 1 second. That stalled second is never measured. The result: your p99 looks great because you literally did not measure the worst moments.

The fix is open-loop load generation. Gil Tene's wrk2 sends requests at a constant rate regardless of response times. If the system stalls, requests pile up, and the benchmark correctly records the queuing delay. Vegeta also uses open-loop by default.

### Tools

| Tool | Type | Open-Loop | Language | Best For |
|---|---|---|---|---|
| wrk | HTTP benchmark | No (closed-loop) | C + Lua | Quick throughput tests |
| wrk2 | HTTP benchmark | Yes | C + Lua | Latency-correct HTTP benchmarking |
| vegeta | HTTP benchmark | Yes | Go | Constant-rate load testing, rich output |
| hey | HTTP benchmark | Partial | Go | Simple HTTP benchmarking |
| fio | Storage benchmark | N/A | C | Disk I/O benchmarking |
| k6 | Load test framework | Configurable | Go + JS | Scriptable, complex scenarios |

For HTTP services, **wrk2 or vegeta** should be the default. For storage, **fio** is the standard.

Example vegeta usage for a latency-correct benchmark:

```bash
# Generate constant 500 req/s load for 60 seconds
echo "GET http://localhost:8080/api/health" | \
  vegeta attack -rate=500 -duration=60s | \
  vegeta report -type=text

# Output includes p50, p95, p99, p99.9 latencies,
# plus success ratio and throughput
```

Example fio for storage benchmarking:

```bash
# Random 4K read IOPS test
fio --name=random-read \
    --ioengine=libaio \
    --direct=1 \
    --bs=4k \
    --rw=randread \
    --numjobs=4 \
    --iodepth=32 \
    --size=1G \
    --runtime=60 \
    --time_based \
    --group_reporting
```

### Warmup Periods

JVM-based services, interpreted languages, and any system with caches require warmup before measurements are valid. The JIT compiler has not optimized hot paths, caches are cold, connection pools are empty. Run at least 30-60 seconds of load before starting to record measurements. Better: run the full test, then discard the first 20% of results.

### Statistical Significance

A single benchmark run proves nothing. Variance between runs can exceed the effect you are measuring. The minimum discipline:

1. Run at least 3-5 iterations
2. Report median and standard deviation, not just the best run
3. If the standard deviation exceeds 5% of the median, investigate the source of variance before drawing conclusions
4. Control for external factors: other processes, thermal throttling, garbage collection, network congestion

### Benchmark Anti-Patterns

| Anti-Pattern | Why It Is Wrong | What To Do Instead |
|---|---|---|
| Happy-path only | Production traffic includes errors, retries, and edge cases | Include realistic error rates and payload variety |
| No concurrent load | Serial requests measure ideal latency, not production latency | Test at realistic concurrency levels |
| Ignoring tail latency | Reporting only average or p50 hides real problems | Always report p95, p99, p99.9 |
| Benchmarking localhost | Removes network latency, which dominates in production | Benchmark across a network, even if same datacenter |
| Too-short duration | Misses GC pauses, cache evictions, log rotation | Run for at least 60 seconds, preferably 5+ minutes |
| Warm cache only | Production has cache misses | Benchmark both warm and cold cache scenarios |
| Closed-loop testing | Coordinated omission hides true latency | Use open-loop tools (wrk2, vegeta) |

---

## The USE and RED Methods as Unifying Frameworks

Every topic in this module maps to one of two observability frameworks. Brendan Gregg's **USE method** applies to infrastructure resources. Tom Wilkie's **RED method** applies to services.

### USE Method (for every resource)

- **Utilization:** What percentage of time is the resource busy? (CPU utilization, disk utilization, memory usage)
- **Saturation:** How much extra work is queued? (CPU run queue length, disk I/O queue depth, network backlog)
- **Errors:** How many error events occurred? (disk errors, network packet drops, ECC memory errors)

Apply USE to every hardware resource when diagnosing performance issues. If utilization is high, you need more capacity or better efficiency. If saturation is high, queuing is your problem. If errors are present, fix them first because everything else is noise until errors are resolved.

### RED Method (for every service)

- **Rate:** How many requests per second is the service handling?
- **Errors:** How many of those requests are failing?
- **Duration:** How long do those requests take? (This is the latency distribution discussed in section 1.)

Apply RED to every microservice in your architecture. Together, USE and RED provide complete coverage: USE tells you about the infrastructure underneath, RED tells you about the services running on top.

### Mapping to This Module

| Module Section | USE Applies To | RED Applies To |
|---|---|---|
| Latency Budgets | CPU, memory, network utilization per tier | Service duration distribution (p50/p95/p99) |
| Profiling | CPU utilization by function, memory utilization | Duration breakdown by code path |
| Database | Disk I/O utilization, connection saturation | Query rate, error rate, query duration |
| Caching | Cache memory utilization, eviction rate (saturation) | Hit/miss rate, lookup duration |
| CDN | Bandwidth utilization, origin connection saturation | Cache hit rate, edge response duration |
| Load Balancer | Connection utilization, backend saturation | Request rate, error rate, response time |
| Kernel Tuning | Socket backlog saturation, file descriptor utilization | N/A (infrastructure layer) |
| Benchmarking | All resource metrics under synthetic load | All service metrics under synthetic load |

---

## Summary

Performance engineering is measurement-driven. The sequence is always: define the latency budget, instrument to measure against it, profile to find the bottleneck, optimize the bottleneck (not something else), and verify the optimization with a statistically sound benchmark. The tools and techniques in this module -- flame graphs, EXPLAIN plans, cache hierarchies, CDN tuning, load balancer algorithms, kernel parameters -- are all means to that end. None of them help if you do not know what you are measuring and why.

The discipline has three rules that override everything else. First: measure before you optimize, because intuition about performance is wrong more often than it is right. Second: optimize the bottleneck, because Amdahl's Law is merciless about wasted effort on non-bottleneck components. Third: verify with production-representative benchmarks, because a benchmark that does not account for coordinated omission, tail latency, and realistic workloads is worse than no benchmark at all -- it gives you confidence in a number that is wrong.
