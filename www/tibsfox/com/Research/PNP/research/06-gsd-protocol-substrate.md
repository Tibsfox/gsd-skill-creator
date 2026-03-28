# GSD Protocol Substrate

> **Domain:** System Architecture
> **Module:** 6 -- MCP Transport Mapping, Port Policy, Subagent FD Budget, and the Amiga Principle
> **Through-line:** *The Amiga's serial port ran at 31,250 bps not because it was fast but because it was exactly the MIDI baud rate. The precision was the leverage. GSD's Amiga Principle at the pipe layer: choose the minimal-overhead IPC primitive for each connection, using the exact specification semantics appropriate to the use case. The power is in knowing which channel to use -- not in using the most powerful channel for everything.*

---

## Table of Contents

1. [The Substrate Layer](#1-the-substrate-layer)
2. [MCP Transport Mapping](#2-mcp-transport-mapping)
3. [Planning-Bridge Port Policy](#3-planning-bridge-port-policy)
4. [Subagent File Descriptor Budget](#4-subagent-file-descriptor-budget)
5. [DACP Bundle Transport Analysis](#5-dacp-bundle-transport-analysis)
6. [Cross-Platform IPC Strategy](#6-cross-platform-ipc-strategy)
7. [Wave Execution Pipe Architecture](#7-wave-execution-pipe-architecture)
8. [Service Discovery Without DNS](#8-service-discovery-without-dns)
9. [The Amiga Principle at the Pipe Layer](#9-the-amiga-principle-at-the-pipe-layer)
10. [Architectural Recommendations](#10-architectural-recommendations)
11. [Cross-References](#11-cross-references)
12. [Sources](#12-sources)

---

## 1. The Substrate Layer

Every byte that flows between GSD components -- between the orchestrator and its subagents, between MCP servers and clients, between the skill-creator and its observation targets -- flows through one of the IPC primitives documented in Modules 01-05. This module maps the abstract communication patterns to concrete protocol choices and provides operational guidance [1].

```
GSD COMMUNICATION TOPOLOGY
================================================================

  ┌──────────────────────────────────────────────────────┐
  │                    ORCHESTRATOR                       │
  │  (GSD main process / Tauri backend / Claude Code)     │
  │                                                      │
  │  ┌─────────┐  ┌─────────┐  ┌─────────┐              │
  │  │ Agent 1 │  │ Agent 2 │  │ Agent N │   Subagents   │
  │  │ stdin/  │  │ stdin/  │  │ stdin/  │   (stdio      │
  │  │ stdout  │  │ stdout  │  │ stdout  │    pipes)     │
  │  └────┬────┘  └────┬────┘  └────┬────┘              │
  │       │            │            │                    │
  │   pipe pair    pipe pair    pipe pair                │
  │   (anon)       (anon)       (anon)                   │
  └───────┼────────────┼────────────┼────────────────────┘
          │            │            │
  ┌───────┼────────────┼────────────┼────────────────────┐
  │   MCP SERVERS (local)                                │
  │                                                      │
  │  ┌──────────┐  ┌──────────┐  ┌──────────┐           │
  │  │ Math     │  │ Planning │  │ Custom   │           │
  │  │ CoProc   │  │ Bridge   │  │ MCP      │           │
  │  │ (stdio)  │  │ (UDS)    │  │ (stdio)  │           │
  │  └──────────┘  └──────────┘  └──────────┘           │
  └──────────────────────────────────────────────────────┘
          │
          │ Streamable HTTP (TCP+TLS)
          ▼
  ┌──────────────────────────┐
  │  REMOTE SERVICES         │
  │  (Anthropic API, etc.)   │
  └──────────────────────────┘
```

The topology shows three distinct IPC zones: (1) anonymous pipes for parent-child subprocess communication, (2) Unix domain sockets for persistent local service connections, and (3) TCP+TLS for network-crossing communication [1].

---

## 2. MCP Transport Mapping

The MCP specification defines three transports. Each maps directly to the IPC primitives documented in this research [2]:

| MCP Transport | IPC Primitive | Pipe/Socket Module | Specification Notes |
|---------------|--------------|-------------------|-------------------|
| stdio | Anonymous pipe (pipe(2)) | M1 | Client spawns server as child; parent writes to child stdin fd[1]; reads from child stdout fd[0]; JSON-RPC 2.0 framing; console.log() corrupts stream |
| Streamable HTTP | TCP socket (AF_INET) | M3, M4 | Server binds to port; HTTP POST for client-to-server; SSE stream for server-to-client; port from registered or ephemeral range |
| HTTP+SSE (deprecated) | TCP socket (AF_INET) | M3, M4 | Two endpoints: /sse for SSE, /messages for POST; try Streamable HTTP first; fall back on 4xx |

**stdio transport details:**

The stdio transport is the most common MCP transport for local servers. The MCP client (GSD) spawns the MCP server as a child process. Communication uses the inherited stdin/stdout pipe pair. Key properties:

- Each server process has its own dedicated pipe pair (no shared pipes)
- Framing: newline-delimited JSON-RPC 2.0 messages
- No authentication (trusted parent-child relationship)
- No encryption (data never leaves the machine)
- Latency: ~15-25 us per pipe crossing (Module 05 benchmarks)
- **Critical bug pattern:** console.log() in a stdio MCP server writes to stdout (the response pipe), corrupting the JSON-RPC stream. All logging must go to stderr [2].

**Streamable HTTP transport details:**

Used for remote MCP servers and future production deployments:

- Server binds to a TCP port (registered range recommended)
- Client sends JSON-RPC requests via HTTP POST
- Server streams responses via Server-Sent Events (SSE)
- TLS required in production (port 443 or custom)
- Session support via Mcp-Session-Id header
- Resumability via Last-Event-ID [2]

---

## 3. Planning-Bridge Port Policy

GSD-OS services and MCP servers require a documented port binding policy to prevent conflicts and ensure predictable deployment [3]:

| Service | Recommended Port | Range | Rationale |
|---------|-----------------|-------|-----------|
| GSD-OS local API | 8432 | Registered | GSD-specific; avoids 8080 (conflict-prone); memorable |
| Planning-bridge MCP | 8433 | Registered | Adjacent to GSD-OS API; consistent block |
| Math co-processor MCP | stdio | N/A | Spawned as child process; no port needed |
| Skill-creator local | Unix socket (/tmp/gsd-skill.sock) | N/A | No port conflict risk; ~30 us latency; preferred |
| Cloudflare tunnel (internal) | Ephemeral (OS-assigned) | Dynamic | Tunnel software handles external port; bind to UDS internally |
| GSD-OS dev server | 3000 | Registered | Vite dev server convention |
| Documentation server | 4000 | Registered | Separate from dev server |

**Port conflict avoidance rules:**

1. Never use port 8080 for production services (most-collided port in development)
2. Assign consecutive ports from a GSD-specific block (8432-8439 reserved for GSD services)
3. Prefer Unix domain sockets over TCP ports for same-host services
4. Document all port assignments in GSD-OS configuration
5. Use SO_REUSEADDR on all server sockets to handle restart-during-TIME_WAIT

```
PORT ASSIGNMENT BLOCK: GSD SERVICES
================================================================

  Port 8432: GSD-OS Local API
  Port 8433: Planning-Bridge MCP Server
  Port 8434: (reserved for future GSD service)
  Port 8435: (reserved for future GSD service)
  Port 8436: (reserved for future GSD service)
  Port 8437: (reserved for future GSD service)
  Port 8438: (reserved for future GSD service)
  Port 8439: (reserved for future GSD service)

  These ports are in the Registered Range (1024-49151).
  They are not IANA-assigned but are unlikely to conflict
  with common services.
```

---

## 4. Subagent File Descriptor Budget

Each spawned GSD subagent uses at minimum 3 standard fds (stdin, stdout, stderr) plus additional fds for pipe pairs. The orchestrator process holds the parent end of each pipe [4]:

| Wave Scale | Subagents | Min FDs (orchestrator) | % of Default RLIMIT_NOFILE (1024) | Risk Level |
|-----------|-----------|----------------------|----------------------------------|-----------|
| Solo | 1 | 5 | 0.5% | None |
| Squad | 5 | 25 | 2.4% | None |
| Team | 20 | 100 | 9.8% | Low |
| Squadron | 50 | 250 | 24.4% | Monitor |
| Battalion | 100 | 500 | 48.8% | Caution |
| Fleet | 200 | 1,000 | 97.7% | Critical -- exceeds limit |

**Recommendation:** GSD's wave executor should set RLIMIT_NOFILE to 4,096 (or higher) before spawning any wave above Squad scale. This can be done programmatically:

```
RLIMIT_NOFILE CONFIGURATION
================================================================

  C:
    struct rlimit rl = { .rlim_cur = 4096, .rlim_max = 4096 };
    setrlimit(RLIMIT_NOFILE, &rl);

  Rust (Tauri backend):
    use libc::{setrlimit, rlimit, RLIMIT_NOFILE};
    let rl = rlimit { rlim_cur: 4096, rlim_max: 4096 };
    unsafe { setrlimit(RLIMIT_NOFILE, &rl); }

  Shell (before launching GSD):
    ulimit -n 4096

  systemd service:
    [Service]
    LimitNOFILE=4096
```

**Pipe buffer memory budget:** Each pipe consumes up to 64 KB of kernel buffer memory (default capacity). A 200-subagent fleet with 400 pipe pairs allocates up to 25.6 MB of kernel pipe buffer memory. The pipe-user-pages-soft limit (default 16,384 pages = 64 MB) accommodates this, but leaves only 38.4 MB headroom for other pipe allocations [4].

---

## 5. DACP Bundle Transport Analysis

DACP (Data, Action, Context Protocol) bundles are three-part structured messages carrying human intent, structured data, and executable code. The transport choice affects atomicity, latency, and throughput [5]:

**Current architecture analysis:**

| Property | Current Implementation | Assessment |
|----------|----------------------|-----------|
| Transport | stdio (anonymous pipe per subagent) | Correct: single-writer guarantee |
| Framing | Newline-delimited JSON-RPC | Adequate: bundles are self-delimiting |
| Atomicity | Guaranteed (single writer per pipe) | Safe: no interleaving risk |
| Typical bundle size | 500 -- 4,000 bytes | Within PIPE_BUF for most messages |
| Maximum bundle size | Unbounded (no limit enforced) | Works because single-writer; would need limits in shared-pipe |
| Latency | ~15-25 us per pipe crossing | Negligible vs. LLM inference time |
| Throughput | ~480 Mbit/s at 4KB blocks | More than adequate for JSON-RPC traffic |

**Future architecture considerations:**

If GSD moves to an aggregation architecture (multiple subagents writing to one pipe), bundles must be kept within PIPE_BUF (4,096 bytes) for atomicity. Alternatively, use per-subagent Unix domain socket connections to an aggregation server, which provides both message boundaries (SOCK_SEQPACKET) and concurrent writer safety [5].

---

## 6. Cross-Platform IPC Strategy

GSD's Tauri layer runs on Linux, macOS, and Windows. IPC mechanism availability and behavior varies [6]:

| Mechanism | Linux | macOS | Windows |
|-----------|-------|-------|---------|
| Anonymous pipe | pipe2() with flags | pipe() only | CreatePipe() (no flags) |
| Named pipe (FIFO) | mkfifo(); persistent; byte-stream | mkfifo(); persistent; byte-stream | CreateNamedPipe(); volatile; message-mode available |
| Unix domain socket | Full support; abstract namespace | Full support; no abstract namespace | AF_UNIX supported since Windows 10 1803 (limited) |
| TCP loopback | Full support | Full support | Full support |
| splice(2) | Supported (Linux 2.6.17+) | Not available | Not available |
| O_DIRECT pipes | Supported (Linux 3.4+) | Not available | N/A (Windows has message-mode) |

**Cross-platform strategy for GSD:**

1. **stdio pipes:** Use standard pipe() on all platforms. Avoid pipe2() flags -- set them with fcntl() post-creation on macOS, or use platform-specific APIs on Windows.
2. **Local service connections:** Use Unix domain sockets on Linux and macOS. On Windows, use TCP loopback (127.0.0.1) or Windows named pipes (CreateNamedPipe with PIPE_ACCESS_DUPLEX).
3. **Remote connections:** Streamable HTTP (TCP+TLS) is platform-independent.
4. **Avoid Linux-specific features** in shared code: no splice(), no O_DIRECT pipes, no abstract namespace sockets. Use them only in Linux-specific performance optimizations behind platform checks.

> **Related:** The [Named Pipes & FIFOs](02-named-pipes-fifos.md) module documents the 11-point behavioral difference table between Unix FIFOs and Windows named pipes.

---

## 7. Wave Execution Pipe Architecture

During a GSD wave, the orchestrator spawns multiple subagents concurrently. Each subagent inherits a dedicated pipe pair [7]:

```
WAVE EXECUTION PIPE ARCHITECTURE
================================================================

  Orchestrator Process (PID 1000)
  ┌─────────────────────────────────────────────────────────┐
  │                                                         │
  │  Wave Controller                                        │
  │  ┌───────────────────────────────────────────────────┐  │
  │  │ pipe() → fork() → exec("claude") × N             │  │
  │  │                                                   │  │
  │  │ Agent 1: pipe_a_in[1]→stdin, stdout→pipe_a_out[0] │  │
  │  │ Agent 2: pipe_b_in[1]→stdin, stdout→pipe_b_out[0] │  │
  │  │ Agent 3: pipe_c_in[1]→stdin, stdout→pipe_c_out[0] │  │
  │  │ Agent N: pipe_n_in[1]→stdin, stdout→pipe_n_out[0] │  │
  │  │                                                   │  │
  │  │ epoll: monitor all pipe_*_out[0] for readability  │  │
  │  │ Write DACP bundles to pipe_*_in[1] as needed     │  │
  │  └───────────────────────────────────────────────────┘  │
  │                                                         │
  │  FD Table (orchestrator):                               │
  │  0: stdin (terminal)                                    │
  │  1: stdout (terminal)                                   │
  │  2: stderr (terminal)                                   │
  │  3: pipe_a_in[1]   (write to agent 1 stdin)             │
  │  4: pipe_a_out[0]  (read from agent 1 stdout)           │
  │  5: pipe_b_in[1]   (write to agent 2 stdin)             │
  │  6: pipe_b_out[0]  (read from agent 2 stdout)           │
  │  ...                                                    │
  │  2N+2: pipe_n_in[1]                                     │
  │  2N+3: pipe_n_out[0]                                    │
  └─────────────────────────────────────────────────────────┘
```

**Critical implementation note:** After fork(), the parent must close the child's end of each pipe, and the child must close the parent's end. Failure to close the write end in the parent prevents the child from ever seeing EOF on stdin. Failure to close the read end in the child leaks file descriptors and prevents clean signal propagation [7].

---

## 8. Service Discovery Without DNS

For local GSD services, Unix domain sockets provide a DNS-free service discovery mechanism. The filesystem path IS the service address [8]:

```
GSD LOCAL SERVICE DISCOVERY
================================================================

  Well-known socket paths:
    /tmp/gsd/skill-creator.sock     → skill-creator service
    /tmp/gsd/planning-bridge.sock   → planning-bridge MCP
    /tmp/gsd/knowledge-index.sock   → knowledge index service

  XDG-compliant paths:
    $XDG_RUNTIME_DIR/gsd/skill-creator.sock
    (e.g., /run/user/1000/gsd/skill-creator.sock)

  Advantages over TCP ports:
    - No port conflict (path is unique)
    - No DNS lookup needed
    - Filesystem permissions provide access control
    - No firewall rules needed
    - Lower latency (~30 us vs ~50-100 us)

  Disadvantage:
    - Cannot cross machine boundaries
    - Path length limited to 108 bytes (sockaddr_un)
    - Must clean up stale socket files on crash
```

**Stale socket cleanup:** If a GSD service crashes without cleanly closing its socket, the socket file remains in the filesystem. The next startup attempt will get EADDRINUSE from bind(). Solution: check for the socket file, attempt to connect; if connection refused, unlink the stale file and proceed [8].

---

## 9. The Amiga Principle at the Pipe Layer

The Amiga's serial port ran at 31,250 bps because that was exactly the MIDI baud rate. One wire, one precise number, access to racks of synthesizers worth thousands of dollars. Architectural leverage over raw power [9].

GSD's Amiga Principle at the pipe layer:

| Pattern | Amiga Analogy | GSD Application |
|---------|--------------|----------------|
| Minimum viable channel | Serial at 31,250 bps | stdio pipe for parent-child IPC |
| Right tool for the job | Paula for audio, not CPU | UDS for local services, TCP for remote |
| Precision over power | MIDI baud rate, not fastest serial | PIPE_BUF-aware bundle sizing |
| DMA over CPU | Paula's DMA audio playback | splice() for high-throughput pipe I/O |
| Specification knowledge | Know the exact baud rate | Know the exact PIPE_BUF, RLIMIT_NOFILE |

The lesson: the pipe does nothing except carry bytes, and that is sufficient. Do not add TCP stack overhead to local communication. Do not add port conflict risk to same-host services. Do not add encryption to parent-child pipes where the trust boundary is the process boundary. Use exactly what is needed. The simplest channel that provides the required semantics is the correct channel [9].

---

## 10. Architectural Recommendations

Summary of all recommendations from this research, prioritized by impact [1-9]:

| Priority | Recommendation | Module Source | Impact |
|----------|---------------|--------------|--------|
| Critical | Set RLIMIT_NOFILE to 4096+ before spawning Fleet-scale waves | M1, M6 | Prevents EMFILE failures |
| Critical | Close unused pipe ends after fork() | M1, M6 | Prevents EOF/signal failures |
| High | Use Unix domain sockets for persistent local services | M4, M5, M6 | Lower latency; no port conflict |
| High | Assign GSD services to port block 8432-8439 | M3, M6 | Prevents port conflicts |
| High | Set SO_REUSEADDR on all TCP server sockets | M3, M4 | Prevents restart-during-TIME_WAIT failures |
| Medium | Set TCP_NODELAY on MCP Streamable HTTP connections | M4, M6 | Eliminates Nagle's 200ms delay |
| Medium | Maintain per-subagent pipe pairs (no shared pipes) | M1, M5, M6 | Guarantees DACP atomicity |
| Medium | Use $XDG_RUNTIME_DIR for Unix socket paths | M6 | Clean, standard, per-user |
| Low | Use splice() for high-throughput file-to-pipe transfers (Linux only) | M1, M5 | Zero-copy performance |
| Low | Monitor pipe-user-pages-soft consumption in Fleet-scale deployments | M1, M6 | Prevents buffer exhaustion |

---

## 11. Failure Modes and Recovery

Understanding how each IPC mechanism fails is as important as understanding how it works. GSD's wave executor must handle these failure modes gracefully [4][7][12]:

### Pipe Failure Modes

| Failure | Signal/Error | Cause | Recovery |
|---------|-------------|-------|---------|
| Broken pipe | SIGPIPE / EPIPE | Reader closed; writer still writing | Catch SIGPIPE or ignore (SIG_IGN) + check write() return |
| Read EOF | read() returns 0 | All writers closed | Normal completion; clean up fd |
| EMFILE | pipe() returns -1 | Process fd limit reached | Raise RLIMIT_NOFILE before spawning |
| ENOMEM | pipe() returns -1 | Kernel memory exhausted | Reduce concurrent subagent count |
| Stalled pipe | write() blocks indefinitely | Reader not consuming data | Set O_NONBLOCK + poll for writability |

### Socket Failure Modes

| Failure | Signal/Error | Cause | Recovery |
|---------|-------------|-------|---------|
| ECONNREFUSED | connect() returns -1 | No listener on target port | Retry with backoff; check service health |
| EADDRINUSE | bind() returns -1 | Port already bound or in TIME_WAIT | SO_REUSEADDR; or use different port |
| Connection reset | ECONNRESET on read/write | Peer sent RST | Reconnect; log the reset |
| Stale UDS file | EADDRINUSE on bind | Crashed service left socket file | Check with connect; unlink if stale |
| Half-open | write succeeds but peer is gone | Network failure; peer crashed | Enable TCP keepalive with short intervals |

### GSD-Specific Recovery Patterns

```
WAVE EXECUTOR FAILURE HANDLING
================================================================

  Subagent pipe death:
    1. SIGCHLD received → identify which subagent exited
    2. Read remaining data from stdout pipe (may contain partial output)
    3. Close all pipe fds for dead subagent
    4. Mark task as failed in wave tracker
    5. If retriable: spawn replacement subagent
    6. If fatal: abort wave; report to orchestrator

  MCP server crash (stdio transport):
    1. Parent reads EOF from child stdout pipe
    2. Parent gets SIGCHLD with non-zero exit code
    3. Close pipe fds
    4. Restart MCP server process
    5. Re-establish JSON-RPC session (fresh initialization)

  UDS service unreachable:
    1. connect() returns ECONNREFUSED or ENOENT
    2. Check for stale socket file → unlink if stale
    3. Wait for service to restart (with timeout)
    4. Retry connect with exponential backoff
    5. After N retries: fail gracefully; report to user
```

### Monitoring and Observability

```
GSD IPC HEALTH CHECKS
================================================================

  Pipe health:
    # Count open pipe fds for orchestrator PID
    ls /proc/<pid>/fd/ | xargs -I{} readlink /proc/<pid>/fd/{} | grep pipe | wc -l

    # Monitor pipe buffer fill levels
    for fd in /proc/<pid>/fdinfo/*; do
      grep -l "pipe" "$fd" 2>/dev/null && cat "$fd"
    done

  Socket health:
    # GSD service ports: check if listening
    ss -tlnp | grep -E ':(8432|8433)'

    # UDS health: check if connectable
    socat -u /dev/null UNIX-CONNECT:/tmp/gsd/skill-creator.sock && echo "OK"

  System-wide:
    # File descriptor usage (approaching limits?)
    cat /proc/sys/fs/file-nr
    # Output: allocated  free  maximum

    # Per-user pipe page allocation
    cat /proc/sys/fs/pipe-user-pages-soft
```

---

## 12. Cross-References

| Topic | Appears In | Related Projects |
|-------|-----------|-----------------|
| GSD protocol substrate | M6 (this module) | GSD2, CMH, MCF, K8S |
| MCP transport mapping | M6, M4 | CMH, RFC |
| Port policy | M3, M6 | SYS, K8S, DNS |
| Subagent FD budget | M1, M6 | SYS, K8S |
| DACP atomicity | M1, M5, M6 | GSD2, CMH |
| Cross-platform IPC | M2, M6 | CMH, SYS |
| Wave execution architecture | M6 | GSD2, CMH, MCF |
| Amiga Principle | M1, M6 | SGL, EMG |
| Service discovery | M6, M3 | DNS, K8S, CMH |

---

## 12. Sources

1. GSD ecosystem documents. mcp-servers-research.md -- MCP transport specifications: stdio, Streamable HTTP, HTTP+SSE.
2. Model Context Protocol specification. "Transports: stdio, Streamable HTTP." modelcontextprotocol.io. Accessed March 2026.
3. GSD ecosystem documents. gsd-bbs-educational-pack-vision.md -- Port scanner educational module.
4. Linux man-pages project. pipe(7), getrlimit(2). man7.org. Accessed March 2026.
5. GSD ecosystem documents. gsd-instruction-set-architecture-vision.md -- DACP three-part bundle specification.
6. Microsoft Learn. "Named Pipes." Win32 SDK documentation. learn.microsoft.com. Accessed March 2026.
7. Stevens, W.R. and Rago, S.A. (2013). *Advanced Programming in the UNIX Environment*, 3rd ed. Addison-Wesley. Chapter 15: Interprocess Communication.
8. Linux man-pages project. unix(7) -- Unix domain sockets; socket path conventions. man7.org. Accessed March 2026.
9. GSD ecosystem documents. gsd-amiga-new-workbench-vision.md -- Serial/parallel port I/O model; 31,250 baud MIDI; Amiga Principle.
10. GSD ecosystem documents. gsd-chipset-architecture-vision.md -- Agnus/Denise/Paula model allocation; inter-chip IPC.
11. GSD ecosystem documents. gsd-staging-layer-vision.md -- Planning bridge file handoff mechanism.
12. Kerrisk, M. (2010). *The Linux Programming Interface*. No Starch Press. Chapter 44: Pipes and FIFOs; Chapter 57: Unix Domain Sockets.
13. IEEE Std 1003.1-2024 (POSIX.1-2024). pipe(), socket() specifications. The Open Group.
14. Wikipedia. "Unix domain socket." Updated March 2026. AF_UNIX socket type table.
15. Baeldung on Linux. "IPC Performance Comparison." May 2025. socat benchmark methodology and results.
16. RFC 6335 (Cotton et al., IETF, August 2011). Service Name and Transport Protocol Port Number Registry procedures.
