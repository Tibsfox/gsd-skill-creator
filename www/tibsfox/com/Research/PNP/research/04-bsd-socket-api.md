# BSD Socket API

> **Domain:** Network Programming
> **Module:** 4 -- POSIX Socket Lifecycle, Address Structures, and Error Catalog
> **Through-line:** *The Berkeley socket API originated in 4.2BSD in 1983 and has outlived every competing network programming interface. It endures because it maps network communication onto the same file descriptor abstraction that Unix uses for everything else: open, read, write, close. The socket is a file descriptor. The network is a file system. The protocol is invisible. That unification is the API's entire genius.*

---

## Table of Contents

1. [History and Standard](#1-history-and-standard)
2. [Socket Types](#2-socket-types)
3. [Address Structures](#3-address-structures)
4. [Server Lifecycle (TCP)](#4-server-lifecycle-tcp)
5. [Client Lifecycle (TCP)](#5-client-lifecycle-tcp)
6. [UDP (Connectionless)](#6-udp-connectionless)
7. [Unix Domain Sockets (AF_UNIX)](#7-unix-domain-sockets-af_unix)
8. [Socket Error Codes](#8-socket-error-codes)
9. [Socket Options](#9-socket-options)
10. [Non-Blocking and Multiplexed I/O](#10-non-blocking-and-multiplexed-io)
11. [Cross-References](#11-cross-references)
12. [Sources](#12-sources)

---

## 1. History and Standard

The Berkeley socket API was created by Bill Joy's team at UC Berkeley for 4.2BSD (August 1983). It was the first general-purpose network programming interface for Unix and quickly became the de facto standard. The API evolved with minimal modification from a BSD-specific extension into a component of the POSIX specification [1].

Key milestones:

| Year | Event |
|------|-------|
| 1983 | 4.2BSD ships with socket API (socket, bind, listen, accept, connect) |
| 1986 | 4.3BSD adds substantial reliability improvements |
| 1990 | POSIX.1 first edition; sockets not yet included |
| 1993 | Winsock 1.1 released; Windows adopts BSD socket API with minor adaptations |
| 2001 | POSIX.1-2001 (SUSv3) formally includes socket interfaces |
| 2008 | POSIX.1-2008 adds sock_cloexec, accept4() |
| 2024 | POSIX.1-2024 (current) -- comprehensive socket specification |

The term "POSIX sockets" is essentially synonymous with "Berkeley sockets." All modern operating systems implement a version of this interface. Even Winsock for Windows was designed by unaffiliated developers following the BSD standard closely [1][2].

---

## 2. Socket Types

A socket is created with three parameters: domain (address family), type (communication semantics), and protocol (specific protocol within the family) [3]:

| Type | Protocol Family | Characteristics |
|------|----------------|-----------------|
| SOCK_STREAM | TCP (AF_INET/AF_INET6) | Reliable, ordered, connection-oriented byte stream; full-duplex |
| SOCK_DGRAM | UDP (AF_INET/AF_INET6) | Unreliable, unordered datagrams; no connection required |
| SOCK_STREAM | UDS (AF_UNIX) | Reliable, ordered, full-duplex; filesystem path as address |
| SOCK_DGRAM | UDS (AF_UNIX) | Reliable on most Unix implementations; datagram boundaries preserved |
| SOCK_SEQPACKET | UDS (AF_UNIX) | Connection-oriented; preserves message boundaries; ordered delivery |
| SOCK_RAW | IP (AF_INET) | Direct IP access; requires CAP_NET_RAW; used for ICMP, custom protocols |

SOCK_STREAM provides a reliable byte stream -- the TCP guarantee. The kernel handles retransmission, ordering, flow control, and congestion control. The application sees a continuous stream of bytes with no message boundaries. If message framing is needed, the application must implement it (length-prefix, delimiter, etc.) [3].

SOCK_DGRAM preserves message boundaries. Each send() produces exactly one datagram; each recv() returns exactly one datagram (or an error if the buffer is too small). For UDP, datagrams may be lost, duplicated, or reordered. For AF_UNIX SOCK_DGRAM, delivery is reliable on most implementations [3].

---

## 3. Address Structures

Each address family uses a different sockaddr structure. All structures begin with a sa_family_t field for type identification [4]:

```
GENERIC (cast target for API calls):
  struct sockaddr {
      sa_family_t  sa_family;    // AF_INET, AF_INET6, AF_UNIX
      char         sa_data[14];  // protocol-specific address
  };

IPv4 (AF_INET):
  struct sockaddr_in {
      sa_family_t    sin_family;   // AF_INET
      in_port_t      sin_port;     // port in NETWORK byte order (htons())
      struct in_addr sin_addr;     // IPv4 address (inet_pton())
  };

IPv6 (AF_INET6):
  struct sockaddr_in6 {
      sa_family_t    sin6_family;    // AF_INET6
      in_port_t      sin6_port;      // port in network byte order
      uint32_t       sin6_flowinfo;  // traffic class + flow label
      struct in6_addr sin6_addr;     // 128-bit IPv6 address
      uint32_t       sin6_scope_id;  // scope ID for link-local
  };

Unix Domain (AF_UNIX):
  struct sockaddr_un {
      sa_family_t  sun_family;     // AF_UNIX
      char         sun_path[108];  // filesystem path (null-terminated)
  };
  // Abstract namespace (Linux): sun_path[0] = '\0', rest is name
  // Maximum path: 108 bytes including null terminator
```

**Byte order is critical:** Network byte order is big-endian. x86 is little-endian. The htons() (host-to-network-short) and htonl() (host-to-network-long) functions convert. Forgetting to call htons() on the port number is one of the most common socket programming bugs -- the port value will be wrong but the code will compile and partially work [4].

---

## 4. Server Lifecycle (TCP)

A TCP server follows a six-step lifecycle. Each step corresponds to a system call that transitions the socket through defined states [5]:

```
TCP SERVER LIFECYCLE
================================================================

  1. socket()    Create endpoint
       │         int sock = socket(AF_INET, SOCK_STREAM, 0);
       │
  2. bind()      Assign local address + port
       │         bind(sock, (struct sockaddr*)&addr, sizeof(addr));
       │
  3. listen(n)   Mark as passive; n = connection queue (backlog)
       │         listen(sock, 128);
       │
  4. accept()    Block until client connects; return NEW socket fd
       │         int client = accept(sock, &client_addr, &addr_len);
       │
  5. read()/write()   Data exchange on client socket
       │         (or recv()/send() with flags)
       │
  6. close()     Release resources; terminate TCP connection
                 close(client);  // close client connection
                 close(sock);    // close listening socket
```

**The backlog parameter in listen()** specifies the maximum number of pending connections in the kernel's accept queue. On Linux, the actual maximum is min(backlog, /proc/sys/net/core/somaxconn). The default somaxconn is 4096 (since Linux 5.4; was 128 before). Connections arriving when the queue is full receive RST (connection refused) [5].

**accept() creates a new socket.** The listening socket continues to accept new connections. Each accepted connection gets its own file descriptor. This is the fork point in server architecture: one process per connection, one thread per connection, or event-driven multiplexing [5].

---

## 5. Client Lifecycle (TCP)

A TCP client follows a simpler five-step lifecycle [5]:

```
TCP CLIENT LIFECYCLE
================================================================

  1. socket()     Create endpoint
       │          int sock = socket(AF_INET, SOCK_STREAM, 0);
       │
  2. [bind()]     OPTIONAL: assign local address + port
       │          (OS auto-assigns ephemeral port if omitted)
       │
  3. connect()    Initiate TCP three-way handshake
       │          connect(sock, (struct sockaddr*)&server_addr, sizeof(server_addr));
       │          SYN → SYN-ACK → ACK
       │
  4. read()/write()   Data exchange
       │
  5. close()      Release resources; terminate TCP connection
                  close(sock);
```

**connect() triggers the TCP three-way handshake.** It blocks (in blocking mode) until the handshake completes or fails. Failure modes: ECONNREFUSED (no listener on target port), ETIMEDOUT (no response within kernel timeout, typically 75-127 seconds on Linux), ENETUNREACH (no route to host) [5].

**The optional bind():** Most clients omit bind() and let the OS assign an ephemeral port. bind() on the client side is only needed when the client must use a specific source IP or port (e.g., for NAT traversal, firewall rules, or multi-homed hosts) [6].

---

## 6. UDP (Connectionless)

UDP sockets do not require connect(), listen(), or accept(). The server binds to a port and immediately begins receiving datagrams [3]:

```
UDP LIFECYCLE
================================================================

  SERVER:
    socket(AF_INET, SOCK_DGRAM, 0)
    bind(sock, &addr, sizeof(addr))
    recvfrom(sock, buf, size, 0, &client_addr, &addr_len)  -- blocks
    sendto(sock, response, len, 0, &client_addr, addr_len)

  CLIENT:
    socket(AF_INET, SOCK_DGRAM, 0)
    sendto(sock, data, len, 0, &server_addr, sizeof(server_addr))
    recvfrom(sock, buf, size, 0, NULL, NULL)

  Optional: connect() on a UDP socket sets a default destination.
  After connect(), send()/recv() can be used instead of sendto()/recvfrom().
  The socket is still connectionless -- connect() just stores the address.
```

UDP's lack of connection state makes it efficient for high-volume, low-latency applications: DNS queries (port 53), NTP (port 123), game traffic, and real-time media. The trade-off is no delivery guarantee, no ordering, and no congestion control -- the application must handle these if needed [3].

---

## 7. Unix Domain Sockets (AF_UNIX)

Unix domain sockets (UDS) provide IPC between processes on the same host using the socket API without a network stack. They use the filesystem namespace as their address space -- a pathname rather than IP:port [7].

```
UNIX DOMAIN SOCKET vs TCP LOOPBACK
================================================================

  UDS (AF_UNIX):
    int sock = socket(AF_UNIX, SOCK_STREAM, 0);
    struct sockaddr_un addr = { .sun_family = AF_UNIX };
    strncpy(addr.sun_path, "/tmp/gsd.sock", sizeof(addr.sun_path));
    bind(sock, (struct sockaddr*)&addr, sizeof(addr));

  TCP loopback (AF_INET on 127.0.0.1):
    int sock = socket(AF_INET, SOCK_STREAM, 0);
    struct sockaddr_in addr = {
        .sin_family = AF_INET,
        .sin_port = htons(8432),
        .sin_addr.s_addr = htonl(INADDR_LOOPBACK)
    };
    bind(sock, (struct sockaddr*)&addr, sizeof(addr));

  UDS advantage: ~30 us RTT vs ~50-100 us for TCP loopback
  UDS advantage: no port number conflict risk
  UDS advantage: filesystem-based access control
  TCP advantage:  cross-machine capable; standard tooling
```

**Key UDS properties:**
- Full-duplex (unlike pipes, which are unidirectional)
- Supports SOCK_STREAM, SOCK_DGRAM, and SOCK_SEQPACKET
- Bypasses TCP/IP stack entirely (no routing, no checksum, no congestion control)
- Supports ancillary data: file descriptor passing via SCM_RIGHTS
- Supports credential passing: SO_PEERCRED reveals client's UID/GID/PID
- Abstract namespace (Linux only): sun_path[0] = '\0' creates a socket not visible in filesystem

**File descriptor passing (SCM_RIGHTS)** is a unique UDS capability: one process can send an open file descriptor to another process through a Unix domain socket. The kernel translates the fd number to a kernel-level reference and creates a new fd in the receiving process. This is how systemd passes listening sockets to service processes [7].

> **Related:** [IPC Performance Spectrum](05-ipc-performance-spectrum.md) benchmarks UDS against pipes and TCP loopback. [GSD Protocol Substrate](06-gsd-protocol-substrate.md) recommends UDS for persistent same-host service connections.

---

## 8. Socket Error Codes

The complete error code catalog for socket API calls, sourced from POSIX.1-2024 and Linux man-pages [8]:

| errno | Syscall | Meaning |
|-------|---------|---------|
| EACCES | bind | Port < 1024 requires CAP_NET_BIND_SERVICE; or socket path denied |
| EACCES | connect | Broadcast address without SO_BROADCAST set |
| EADDRINUSE | bind | Address:port already bound (or in TIME_WAIT without SO_REUSEADDR) |
| EADDRNOTAVAIL | bind | Requested address not available on any local interface |
| EAFNOSUPPORT | socket | Address family (domain) not supported by kernel |
| EALREADY | connect | Non-blocking connect already in progress |
| EBADF | any | Not a valid open file descriptor |
| ECONNABORTED | accept | Connection was aborted (RST received before accept) |
| ECONNREFUSED | connect | No process listening at target address:port |
| ECONNRESET | read/write | Connection reset by peer (RST received) |
| EFAULT | any | Address pointer outside accessible address space |
| EINPROGRESS | connect | Non-blocking connect initiated; use poll/select for completion |
| EINTR | accept/connect | System call interrupted by signal |
| EINVAL | bind | Socket already bound; addrlen wrong; invalid argument |
| EISCONN | connect | Socket already connected |
| EMFILE | socket/accept | Per-process file descriptor limit reached (RLIMIT_NOFILE) |
| ENFILE | socket/accept | System-wide file table full (/proc/sys/fs/file-max) |
| ENETUNREACH | connect | No route to network |
| ENOBUFS | socket | Insufficient buffer memory |
| ENOPROTOOPT | setsockopt | Protocol option not supported |
| ENOTSOCK | any | File descriptor is not a socket |
| EOPNOTSUPP | accept | Socket type does not support accept (e.g., SOCK_DGRAM) |
| EPERM | socket | Insufficient privilege for SOCK_RAW |
| EPROTONOSUPPORT | socket | Protocol not supported in this domain |
| ETIMEDOUT | connect | Connection timed out (no SYN-ACK received) |

**The EMFILE/ENFILE distinction** matters: EMFILE is per-process (raise RLIMIT_NOFILE); ENFILE is system-wide (raise /proc/sys/fs/file-max). An orchestrator hitting EMFILE in a wave execution can raise its own limit; ENFILE means the whole system is out of file descriptors [8].

---

## 9. Socket Options

Socket options are set with setsockopt() and queried with getsockopt(). Key options relevant to infrastructure programming [9]:

| Level | Option | Type | Effect |
|-------|--------|------|--------|
| SOL_SOCKET | SO_REUSEADDR | int (bool) | Allow bind to TIME_WAIT port |
| SOL_SOCKET | SO_REUSEPORT | int (bool) | Allow multiple sockets on same port (Linux 3.9+) |
| SOL_SOCKET | SO_KEEPALIVE | int (bool) | Enable TCP keepalive probes |
| SOL_SOCKET | SO_RCVBUF | int | Set receive buffer size (bytes) |
| SOL_SOCKET | SO_SNDBUF | int | Set send buffer size (bytes) |
| SOL_SOCKET | SO_LINGER | struct linger | Control close() behavior (wait for data flush) |
| SOL_SOCKET | SO_PEERCRED | struct ucred | Get peer's UID/GID/PID (UDS only) |
| IPPROTO_TCP | TCP_NODELAY | int (bool) | Disable Nagle's algorithm (reduce latency) |
| IPPROTO_TCP | TCP_KEEPIDLE | int | Seconds before first keepalive probe |
| IPPROTO_TCP | TCP_KEEPINTVL | int | Seconds between keepalive probes |
| IPPROTO_TCP | TCP_KEEPCNT | int | Number of failed probes before connection dropped |
| IPPROTO_TCP | TCP_FASTOPEN | int | Enable TCP Fast Open (data in SYN) |

**TCP_NODELAY** is critical for interactive protocols like JSON-RPC over MCP stdio. Nagle's algorithm delays small writes to batch them into larger segments, adding up to 200ms latency. For request-response protocols, this delay is unacceptable. MCP implementations should always set TCP_NODELAY when using Streamable HTTP [9].

---

## 10. Non-Blocking and Multiplexed I/O

Production servers rarely use blocking I/O on sockets. Three mechanisms allow a single thread to handle thousands of connections [10]:

```
I/O MULTIPLEXING MECHANISMS
================================================================

  select(2):    1024 fd limit (FD_SETSIZE); O(n) scan; POSIX standard
                Adequate for < 100 connections.

  poll(2):      No fd limit; O(n) scan; POSIX standard
                Better than select for medium connection counts.

  epoll(7):     Linux-specific; O(1) per event; scales to millions of fds
                Used by nginx, Node.js, Redis, and most Linux servers.
                epoll_create1() → epoll_ctl(ADD/MOD/DEL) → epoll_wait()

  kqueue(2):    BSD/macOS equivalent of epoll; O(1) per event
                Used by macOS and FreeBSD servers.

  io_uring(7):  Linux 5.1+; async submission/completion ring
                Lowest latency; used by new generation of io_uring-native servers.
```

**GSD implication:** The GSD-OS Tauri backend and MCP servers use event-driven I/O internally. Understanding the multiplexing layer helps diagnose performance issues when many subagents maintain simultaneous connections. Each epoll instance has a negligible per-fd cost, but each connection still consumes a file descriptor [10].

---

## 11. Socket Lifecycle State Diagram

A TCP socket transitions through defined states during its lifetime. The complete state machine, as specified in RFC 793 and updated in RFC 9293 [11]:

```
TCP STATE MACHINE (Server perspective)
================================================================

  [CLOSED]
     │
     │ socket() + bind() + listen()
     v
  [LISTEN] ──────────────── recv SYN ──────────> [SYN-RECEIVED]
     │                                                │
     │                                        send SYN+ACK
     │                                                │
     │                                          recv ACK
     │                                                │
     │                                                v
     │                                         [ESTABLISHED]
     │                                                │
     │                                    ┌───────────┤
     │                                    │           │
     │                              recv FIN    send FIN
     │                                    │           │
     │                                    v           v
     │                             [CLOSE-WAIT]  [FIN-WAIT-1]
     │                                    │           │
     │                              send FIN    recv ACK
     │                                    │           │
     │                                    v           v
     │                              [LAST-ACK]  [FIN-WAIT-2]
     │                                    │           │
     │                              recv ACK    recv FIN
     │                                    │           │
     │                                    v      send ACK
     │                               [CLOSED]        │
     │                                                v
     │                                         [TIME-WAIT]
     │                                                │
     │                                          2*MSL timeout
     │                                                │
     └────────────────────────────────────────> [CLOSED]
```

Understanding which state a socket is in helps diagnose connection problems. The `ss` command shows socket states:

```
# Show sockets by state
ss -tan state established      # active connections
ss -tan state time-wait        # ports waiting for cleanup
ss -tan state close-wait       # peer closed; local hasn't
ss -tan state listen            # listening sockets
```

### Connection Refused vs Timeout

Two common connect() failures have very different root causes:

| Error | errno | Network Behavior | Root Cause |
|-------|-------|-----------------|-----------|
| Connection refused | ECONNREFUSED | RST packet received | Port is reachable but no process listening |
| Connection timed out | ETIMEDOUT | No response at all | Host unreachable, firewall dropping, or network partition |

ECONNREFUSED means the target host is alive, the network is working, but no process has called bind() + listen() on that port. ETIMEDOUT means packets are being lost -- the TCP SYN is sent but no SYN-ACK returns within the kernel's timeout (typically 75-127 seconds with exponential backoff) [6][11].

### Socket Lingering

The SO_LINGER option controls what happens when close() is called with data still in the send buffer:

```
struct linger {
    int l_onoff;    // 0 = off (default), 1 = on
    int l_linger;   // timeout in seconds
};

// Default (l_onoff=0): close() returns immediately; kernel sends data in background
// Linger on, timeout > 0: close() blocks until data sent or timeout expires
// Linger on, timeout = 0: close() sends RST immediately; data discarded
//   (used for "hard close" -- aborts connection without graceful shutdown)
```

The l_linger=0 "hard close" pattern is used in servers that need to rapidly recycle connections without waiting for TIME_WAIT. It should be used only when the application can tolerate data loss [9].

---

## 12. Cross-References

| Topic | Appears In | Related Projects |
|-------|-----------|-----------------|
| BSD socket API | M4 (this module) | TCP, SYS, K8S, CMH |
| Address structures | M4, M6 | TCP, DNS |
| Server/client lifecycle | M4, M5 | TCP, SYS, K8S |
| Unix domain sockets | M4, M5, M6 | SYS, CMH, MCF |
| Socket error codes | M4, M5 | SYS, TCP |
| SO_REUSEADDR / SO_REUSEPORT | M3, M4 | SYS, K8S |
| TCP_NODELAY | M4, M6 | TCP, CMH |
| epoll / kqueue / io_uring | M4, M5 | SYS, K8S |
| File descriptor passing | M4, M5 | SYS, CMH |

---

## 12. Sources

1. Wikipedia. "Berkeley sockets." Updated 2025. 4.2BSD (1983) origin; POSIX evolution.
2. Leffler, S.J., McKusick, M.K., Karels, M.J., Quarterman, J.S. (1989). *The Design and Implementation of the 4.3BSD UNIX Operating System*. Addison-Wesley.
3. IEEE Std 1003.1-2024 (POSIX.1-2024). socket() specification. The Open Group.
4. Stevens, W.R. (1998). *UNIX Network Programming, Volume 1*, 2nd ed. Prentice-Hall. Chapter 3: Socket Address Structures.
5. Stevens, W.R. (1998). *UNIX Network Programming, Volume 1*, 2nd ed. Chapter 4: Elementary TCP Sockets.
6. Linux man-pages project. socket(2), bind(2), listen(2), accept(2), connect(2). man7.org. Accessed March 2026.
7. Linux man-pages project. unix(7) -- Unix domain sockets. man7.org. Accessed March 2026.
8. IEEE Std 1003.1-2024 (POSIX.1-2024). Error codes for socket API functions. The Open Group.
9. Linux man-pages project. socket(7), tcp(7) -- socket options. man7.org. Accessed March 2026.
10. Kerrisk, M. (2010). *The Linux Programming Interface*. No Starch Press. Chapter 63: Alternative I/O Models.
11. Stevens, W.R. (1994). *TCP/IP Illustrated, Volume 1*. Addison-Wesley. Chapter 16: TCP Connection Establishment.
12. Wikipedia. "Unix domain socket." Updated March 2026. AF_UNIX socket type table.
13. Linux man-pages project. epoll(7), io_uring(7). man7.org. Accessed March 2026.
14. McKusick, M.K., Neville-Neil, G.V., Watson, R.N.M. (2015). *The Design and Implementation of the FreeBSD Operating System*, 2nd ed. Addison-Wesley.
15. Baeldung on Linux. "Unix Domain Sockets vs TCP Loopback Performance." 2025.
