# IPC Performance Spectrum

> **Domain:** Systems Performance
> **Module:** 5 -- Throughput Benchmarks, Latency Profiles, and Selection Matrix
> **Through-line:** *Every IPC mechanism is a point on a single spectrum trading kernel-crossing overhead against flexibility, locality, and naming scope. Pipes occupy the zero-configuration end. Network sockets occupy the maximum-flexibility end. Unix domain sockets occupy the optimal local-IPC middle ground. Choosing the wrong mechanism costs microseconds per message -- which compounds to seconds per wave, minutes per session, hours per project.*

---

## Table of Contents

1. [The Spectrum Model](#1-the-spectrum-model)
2. [Four-Mechanism Comparison](#2-four-mechanism-comparison)
3. [Throughput Benchmarks](#3-throughput-benchmarks)
4. [Latency Profiles](#4-latency-profiles)
5. [Kernel Path Analysis](#5-kernel-path-analysis)
6. [Zero-Copy Paths](#6-zero-copy-paths)
7. [IPC Selection Matrix for GSD](#7-ipc-selection-matrix-for-gsd)
8. [DACP Atomicity Audit](#8-dacp-atomicity-audit)
9. [Scaling Characteristics](#9-scaling-characteristics)
10. [Cross-References](#10-cross-references)
11. [Sources](#11-sources)

---

## 1. The Spectrum Model

Local IPC mechanisms form a spectrum from minimal overhead to maximum capability. The four primary mechanisms, ordered by kernel path complexity [1]:

```
IPC OVERHEAD SPECTRUM
================================================================

  Minimal Overhead                                Maximum Flexibility
  ←──────────────────────────────────────────────────────────────→

  Anonymous     Named       Unix Domain    TCP Loopback
  Pipe          Pipe/FIFO   Socket (UDS)   (127.0.0.1)
  │             │           │              │
  │ pipe()      │ mkfifo()  │ socket()     │ socket()
  │ fork()      │ open()    │ bind()       │ bind()
  │ inherited   │ fs path   │ fs path      │ IP:port
  │ parent→child│ any→any   │ any→any      │ any→any
  │ unidir      │ unidir    │ bidir        │ bidir
  │ no naming   │ fs name   │ fs name      │ IP:port name
  │ no auth     │ fs perms  │ fs perms     │ ACL/firewall
  │             │           │ fd passing   │ cross-machine
  │             │           │              │
  Fastest       Fast        Fast+Capable   Slowest (locally)
  (small msg)   (small msg) (large msg)    (always)
```

The key insight: each mechanism adds capabilities (bidirectional, naming, network) but also adds kernel code path. For local IPC where both processes are on the same host, the overhead of TCP's full stack (routing, checksums, congestion control, receive buffers) is pure waste [1].

---

## 2. Four-Mechanism Comparison

| Property | Anonymous Pipe | Named Pipe (FIFO) | Unix Domain Socket | TCP Loopback |
|----------|---------------|-------------------|-------------------|-------------|
| Direction | Unidirectional | Unidirectional | Bidirectional | Bidirectional |
| Naming | Inherited fd | Filesystem path | Filesystem path or abstract | IP:port |
| Process relationship | Parent-child | Any | Any | Any (incl. remote) |
| Message boundaries | No (byte stream) | No (byte stream) | SEQPACKET: yes; STREAM: no | No (byte stream) |
| Atomicity | PIPE_BUF (4,096) | PIPE_BUF (4,096) | None | None |
| FD passing | No | No | Yes (SCM_RIGHTS) | No |
| Credential passing | No | No | Yes (SO_PEERCRED) | No |
| Kernel stack | pipe buffer only | pipe buffer only | socket buffer (no IP) | Full TCP/IP stack |
| Cross-machine | No | No | No | Yes |
| Access control | Inherited | File permissions | File permissions | Firewall/ACL |

---

## 3. Throughput Benchmarks

Performance benchmarks using socat on Linux (Baeldung, 2025) at three representative block sizes [2]:

| Mechanism | 100-byte blocks | 4 KB blocks | 1 MB blocks |
|-----------|----------------|-------------|-------------|
| Anonymous pipe | ~310 Mbit/s | ~480 Mbit/s | ~550 Mbit/s |
| Named pipe (FIFO) | ~318 Mbit/s | ~470 Mbit/s | ~520 Mbit/s |
| Unix domain socket | ~245 Mbit/s | ~520 Mbit/s | ~600+ Mbit/s |
| TCP loopback | ~120 Mbit/s | ~280 Mbit/s | ~400 Mbit/s |

```
THROUGHPUT vs BLOCK SIZE
================================================================

  Mbit/s
  700 ┤
      │                                              UDS ●
  600 ┤                                         ●───────●
      │                                  Pipe ●
  550 ┤                             ●──────────
      │                       FIFO ●──────●
  500 ┤                      ●
      │                 ●──●
  450 ┤            ●──●
      │       ●──●
  400 ┤  ●──●                                TCP ●
      │                                ●─────●
  350 ┤                           ●────
      │  Pipe                ●
  300 ┤  ●  FIFO        ●
      │     ●      ●
  250 ┤  UDS●
      │
  200 ┤
      │
  150 ┤
      │  TCP
  120 ┤  ●
      └─────────────────────────────────────────→
         100B      4KB         1MB    Block Size

  Key findings:
  - Pipes win at small messages (< 4KB) due to minimal setup
  - UDS wins at large messages (> 64KB) due to larger socket buffers
  - TCP loopback is 2-3x slower than UDS at all sizes
  - FIFO and anonymous pipe are nearly identical (same kernel path)
```

**IPC-Bench independent validation:** Unix domain sockets achieve 127,582 one-KB messages per second on an i5-4590S / Ubuntu 20.04, confirming ~130 MB/s sustained throughput at small message sizes [3].

---

## 4. Latency Profiles

Round-trip time (RTT) -- time for a message to travel from sender to receiver and an acknowledgment to return [4]:

| Mechanism | Avg RTT | p99 RTT | Kernel Path |
|-----------|---------|---------|-------------|
| Anonymous pipe | ~15-25 us | ~50-80 us | pipe_write → schedule → pipe_read |
| Named pipe (FIFO) | ~15-25 us | ~50-80 us | Same kernel path as anonymous pipe |
| Unix domain socket | ~25-35 us | ~60-100 us | unix_stream_sendmsg → schedule → unix_stream_recvmsg |
| TCP loopback | ~50-100 us | ~200-500 us | tcp_sendmsg → ip_local_out → ip_local_deliver → tcp_rcv → schedule |

**Why TCP loopback is slower even on the same machine:**
- Full TCP header serialization (20 bytes minimum)
- IP routing lookup (even for 127.0.0.1)
- TCP checksum computation
- Congestion control state machine
- ACK processing and delayed-ACK timer
- Larger kernel lock contention surface

For GSD's MCP stdio transport, the ~15-25 us pipe RTT means a complete JSON-RPC request/response cycle takes roughly 30-50 us of pure IPC time. At typical DACP bundle sizes (1-4 KB), the pipe throughput of ~480 Mbit/s means each bundle transfer takes approximately 7-27 us. Combined: a complete MCP message round-trip is dominated by JSON parsing and processing, not by IPC overhead [4].

---

## 5. Kernel Path Analysis

The performance differences stem directly from the kernel code path each mechanism traverses [5]:

```
KERNEL PATH: ANONYMOUS PIPE write()
================================================================
  1. sys_write()               → VFS entry point
  2. vfs_write()               → file operations dispatch
  3. pipe_write()              → pipe-specific write handler
  4. copy_from_user()          → copy data from user space to pipe buffer
  5. wake_up_interruptible()   → wake any sleeping reader
  6. return bytes_written

  Total kernel functions: ~6-8
  Context switches: 0-1 (if reader was sleeping)


KERNEL PATH: TCP LOOPBACK write()
================================================================
  1. sys_write()                → VFS entry point
  2. sock_write_iter()          → socket dispatch
  3. tcp_sendmsg_locked()       → TCP send path
  4. tcp_push()                 → segment construction
  5. tcp_transmit_skb()         → build TCP header
  6. ip_queue_xmit()            → IP layer
  7. ip_local_out()             → routing decision
  8. ip_local_deliver()         → loopback delivery (skips NIC)
  9. ip_local_deliver_finish()  → protocol demux
  10. tcp_v4_rcv()              → TCP receive path
  11. tcp_rcv_established()     → fast path processing
  12. tcp_data_queue()          → add to receive buffer
  13. wake_up_interruptible()   → wake reader

  Total kernel functions: ~25-30
  Context switches: 0-1 (same as pipe)
  Additional overhead: header alloc, checksum, routing table lookup
```

The ~3x function call overhead directly explains the ~3x latency difference between pipe and TCP loopback [5].

---

## 6. Zero-Copy Paths

Standard read/write on pipes and sockets copies data twice: user→kernel on write, kernel→user on read. Several mechanisms reduce this [6]:

| Mechanism | Copies | Applicability | Kernel Version |
|-----------|--------|--------------|---------------|
| Standard read/write | 2 (user→kernel→user) | All IPC types | All |
| splice(2) | 0 (page reference) | Pipe ↔ file descriptor | Linux 2.6.17 |
| vmsplice(2) | 0 (page mapping) | User memory → pipe | Linux 2.6.17 |
| sendfile(2) | 0-1 | File → socket | Linux 2.2 |
| MSG_ZEROCOPY | 0 (on send) | TCP/UDP send (>10KB) | Linux 4.14 |
| io_uring fixed buffers | 0 (pre-registered) | Any I/O | Linux 5.1 |

For GSD's typical DACP bundle sizes (1-4 KB), zero-copy mechanisms provide minimal benefit -- the copy overhead for small messages is negligible compared to system call overhead. Zero-copy becomes significant at message sizes above 64 KB [6].

---

## 7. IPC Selection Matrix for GSD

Applying the benchmark data and mechanism properties to GSD's specific use cases [2][4]:

| GSD Use Case | Recommended Mechanism | Rationale |
|-------------|----------------------|-----------|
| MCP local server ← → GSD subagent | stdio (anonymous pipe) | Parent spawns child; inherited fds; zero config; lowest latency |
| GSD-OS ← → local MCP services | stdio (anonymous pipe) | Tauri spawns child process; same parent-child pattern |
| Skill-creator ← → knowledge index | Named pipe or Unix socket | Persistent service; not parent-child relationship |
| Planning-bridge MCP server (local) | Unix domain socket | Low overhead; bidirectional; no port conflict; fd passing |
| GSD ← → remote APIs / cloud services | Streamable HTTP (TCP+TLS) | Network-native; load balancing; session support |
| Cross-machine GSD coordination | Streamable HTTP (TCP+TLS) | Network crossing required; HTTP infrastructure |
| DACP bundle transport (same host) | Anonymous pipe (stdio) | Current pattern; see atomicity audit below |
| High-throughput data pipeline | splice(2) through pipe | Zero-copy; file-to-pipe or pipe-to-file |

**Decision rule:** Use the minimum-overhead mechanism that provides the required capabilities. If you don't need bidirectional, use a pipe. If you don't need a name, use anonymous. If you don't need to cross a machine boundary, don't use TCP. Each unnecessary capability adds latency [7].

---

## 8. DACP Atomicity Audit

A DACP bundle is a three-part structured message: human intent + structured data + executable code. The atomicity concern: if multiple agents write to the same pipe and bundles exceed PIPE_BUF (4,096 bytes on Linux), writes may interleave [8].

**Audit finding for current GSD architecture:**

In GSD's current architecture, each subagent has its own stdin/stdout pipe pair (parent-child stdio model). Each pipe has at most one writer at a time. Atomicity only matters with multiple concurrent writers on the same pipe descriptor. Therefore:

> **RULING: DACP bundles on GSD's stdio pipes are fully atomic regardless of size, because each pipe has a single writer.**

**Risk conditions for future architecture:**

The atomicity guarantee breaks if GSD moves to a shared-pipe architecture (multiple subagents writing to one aggregation pipe). In that scenario:

| Bundle Size | Atomic? | Mitigation |
|-------------|---------|-----------|
| <= 4,096 bytes | Yes | None needed |
| 4,097 -- 65,536 bytes | No | Use O_DIRECT packet mode (single-pipe, single-page packets) |
| > 65,536 bytes | No | Use per-writer pipes or Unix domain sockets |

**Recommendation:** Maintain per-subagent pipe pairs. If aggregation is needed, use a Unix domain socket server that receives complete messages from each subagent via dedicated connections [8].

---

## 9. Scaling Characteristics

How each mechanism scales with connection count and message rate [2][3][4]:

```
SCALING CHARACTERISTICS
================================================================

  Mechanism          Connections    Per-Connection     Multiplexing
                     Supported      Memory Cost        Mechanism
  ─────────────      ───────────    ──────────────     ────────────
  Anonymous pipe     2 fds each     ~64KB buffer       poll/select/epoll
  Named pipe         2 fds each     ~64KB buffer       poll/select/epoll
  Unix domain socket 1 fd each      ~128KB buffers     epoll (best)
  TCP loopback       1 fd each      ~128KB + TCP state epoll (best)

  File descriptor budget per mechanism:
    Pipe pair:  2 fds (read + write)
    UDS conn:   1 fd per end (bidirectional)
    TCP conn:   1 fd per end (bidirectional)

  At 1000 concurrent connections:
    Pipes:  2000 fds, ~64 MB buffer memory
    UDS:    1000 fds, ~128 MB buffer memory
    TCP:    1000 fds, ~128 MB buffer + TCP state (~600 bytes/conn)
```

For GSD wave execution, the fd budget is the binding constraint. A 100-subagent wave using stdio pipes consumes 200 pipe fds from the orchestrator. The same 100 subagents using UDS would consume 100 socket fds. The pipe model uses more fds per connection but avoids the connect/accept overhead [2].

---

## 10. Benchmark Methodology

The throughput numbers cited in this module come from two primary sources. Understanding the methodology is essential for interpreting the results correctly [2][3]:

### Baeldung socat Benchmarks (2025)

The Baeldung benchmarks use socat (SOcket CAT) to measure raw IPC throughput:

```
BENCHMARK SETUP (socat)
================================================================

  Anonymous pipe:
    dd if=/dev/zero bs=<block_size> count=<N> | socat - - > /dev/null

  Named pipe:
    mkfifo /tmp/bench
    socat PIPE:/tmp/bench - < /dev/zero &
    socat - PIPE:/tmp/bench > /dev/null

  Unix domain socket:
    socat UNIX-LISTEN:/tmp/bench.sock - > /dev/null &
    dd if=/dev/zero bs=<block_size> count=<N> | socat - UNIX-CONNECT:/tmp/bench.sock

  TCP loopback:
    socat TCP-LISTEN:9999 - > /dev/null &
    dd if=/dev/zero bs=<block_size> count=<N> | socat - TCP:127.0.0.1:9999

  Measured: total bytes / wall clock time = throughput
  Block sizes: 100 bytes, 4 KB, 1 MB
  Environment: Linux, commodity hardware
```

### IPC-Bench (Goldsborough, 2020)

The IPC-Bench project provides a more controlled benchmark with message-count-based measurements:

```
BENCHMARK RESULTS (IPC-Bench, i5-4590S, Ubuntu 20.04)
================================================================

  Unix domain socket (1 KB messages):
    Throughput: 127,582 messages/second
    = ~124.6 MB/s sustained
    Methodology: single producer, single consumer, SOCK_STREAM
    Messages: 1,000,000 x 1 KB

  TCP loopback (1 KB messages):
    Throughput: ~45,000-60,000 messages/second
    = ~44-59 MB/s sustained
    ~2.5x slower than UDS
```

### Factors That Affect Real-World Performance

The benchmarks measure raw IPC throughput under ideal conditions. Real-world GSD performance is affected by additional factors:

| Factor | Impact | Mitigation |
|--------|--------|-----------|
| JSON-RPC parsing | Dominates for small messages | Minimize JSON nesting; use compact keys |
| LLM inference time | 100-10,000x larger than IPC latency | IPC optimization is irrelevant vs. inference |
| Context switch cost | ~1-5 us per switch on modern x86 | Batch messages where possible |
| CPU cache effects | Cold cache adds ~10-50 us | Keep IPC buffers in hot cache paths |
| System load | Contention reduces throughput | Reserve CPU cores for orchestrator |
| Memory pressure | Swapping kills pipe performance | Monitor RSS and pipe buffer allocation |

The key insight: for GSD's typical workload (JSON-RPC messages of 500-4000 bytes, with LLM inference taking 1-60 seconds per turn), IPC mechanism choice has negligible impact on total latency. The choice matters for correctness (atomicity, fd passing, bidirectional) and operational simplicity (port conflicts, cleanup), not for raw speed [2][4].

---

## 11. Cross-References

| Topic | Appears In | Related Projects |
|-------|-----------|-----------------|
| IPC performance spectrum | M5 (this module) | SYS, CMH, K8S |
| Throughput benchmarks | M5, M6 | TCP, SYS |
| Latency profiles | M5, M6 | CMH, TCP |
| Kernel path analysis | M5 | SYS, TCP |
| Zero-copy (splice/vmsplice) | M1, M5 | SYS |
| IPC selection matrix | M5, M6 | CMH, GSD2, MCF |
| DACP atomicity audit | M5, M6 | GSD2, CMH |
| fd budget scaling | M1, M5, M6 | K8S, SYS |

---

## 11. Sources

1. Kerrisk, M. (2010). *The Linux Programming Interface*. No Starch Press. Chapter 44: Pipes and FIFOs; Chapter 57: UNIX Domain Sockets.
2. Baeldung on Linux. "IPC Performance Comparison: Anonymous Pipes, Named Pipes, Unix Sockets, and TCP Sockets." May 2025. socat benchmark methodology and results.
3. IPC-Bench. Unix domain socket throughput benchmark. 127,582 1KB messages/second on i5-4590S / Ubuntu 20.04.
4. linuxvox.com. "Sockets on Same Machine for IPC." 2024. 30 us UDS avg RTT; 210 MB/s throughput.
5. Linux kernel source. fs/pipe.c (pipe_write, pipe_read); net/ipv4/tcp.c (tcp_sendmsg, tcp_recvmsg); net/unix/af_unix.c. kernel.org.
6. Linux kernel documentation. Splice and Pipes. kernel.org/doc/html/v6.14/filesystems/splice.html.
7. GSD ecosystem documents. mcp-servers-research.md -- MCP transport specifications: stdio, Streamable HTTP, HTTP+SSE.
8. GSD ecosystem documents. gsd-instruction-set-architecture-vision.md -- DACP three-part bundle specification.
9. Baeldung on Linux. "The Pipe Buffer Capacity in Linux." May 2025.
10. Biriukov, V. "FD, Pipe, Session, Terminal: Pipes." biriukov.dev. Packet mode analysis with bpftrace.
11. Stevens, W.R. (1998). *UNIX Network Programming, Volume 1*, 2nd ed. Prentice-Hall. Chapter 15: Unix Domain Protocols.
12. Stevens, W.R. and Rago, S.A. (2013). *Advanced Programming in the UNIX Environment*, 3rd ed. Addison-Wesley. Chapter 17: Advanced IPC.
13. Linux man-pages project. splice(2), tee(2), vmsplice(2), sendfile(2). man7.org. Accessed March 2026.
14. Corbet, J. "Zero-copy networking." LWN.net. Overview of MSG_ZEROCOPY and io_uring approaches.
15. IEEE Std 1003.1-2024 (POSIX.1-2024). write() specification -- PIPE_BUF atomicity. The Open Group.
