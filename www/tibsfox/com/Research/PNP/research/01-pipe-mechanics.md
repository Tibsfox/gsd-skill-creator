# Pipe Mechanics

> **Domain:** Unix IPC Primitives
> **Module:** 1 -- Anonymous Pipes, Ring Buffers, and Atomicity Guarantees
> **Through-line:** *File. Process. Pipe. Thompson and Ritchie gave computing three atoms and from them composed an operating system that could say things its creators never imagined. The pipe is the connective tissue -- the thing in the space between processes, carrying meaning from one fragment to another. It does not care what flows through it. The connecting is the whole of its function.*

---

## Table of Contents

1. [The Pipe Primitive](#1-the-pipe-primitive)
2. [pipe() and pipe2() System Calls](#2-pipe-and-pipe2-system-calls)
3. [Error Codes](#3-error-codes)
4. [Ring Buffer and Capacity](#4-ring-buffer-and-capacity)
5. [PIPE_BUF and Atomicity](#5-pipe_buf-and-atomicity)
6. [Blocking and Non-Blocking Behavior](#6-blocking-and-non-blocking-behavior)
7. [Packet Mode (O_DIRECT)](#7-packet-mode-o_direct)
8. [Advanced Operations: splice, tee, vmsplice](#8-advanced-operations-splice-tee-vmsplice)
9. [Kernel Tuning Parameters](#9-kernel-tuning-parameters)
10. [The Unix Philosophy at Work](#10-the-unix-philosophy-at-work)
11. [Cross-References](#11-cross-references)
12. [Sources](#12-sources)

---

## 1. The Pipe Primitive

The pipe is the oldest and simplest inter-process communication mechanism in Unix. Introduced in Version 3 Unix (1973) by Ken Thompson at the suggestion of Douglas McIlroy, the pipe connects the standard output of one process to the standard input of another. It is a unidirectional byte stream with no message framing, no addressing, and no authentication. Data written to one end is buffered by the kernel and read from the other end in FIFO order [1].

The simplicity is the point. McIlroy's 1964 memo proposed "a way to connect programs like garden hose -- screw in another segment when it becomes necessary to massage data in another way" [2]. The pipe realizes that metaphor exactly: a fixed-diameter conduit that carries undifferentiated bytes from producer to consumer.

```
THE PIPE AS UNIX PRIMITIVE
================================================================

  $ ls -la | grep "\.md$" | wc -l

  Process A       Kernel Buffer      Process B       Kernel Buffer      Process C
  (ls -la)  --->  [  pipe_a  ]  ---> (grep)    --->  [  pipe_b  ]  ---> (wc -l)
   fd[1]           65536 bytes        fd[0]/fd[1]      65536 bytes        fd[0]
   stdout          ring buffer        stdin/stdout     ring buffer        stdin

  Two anonymous pipes.
  Three processes.
  Zero configuration.
  The shell built this pipeline from a single line of text.
```

Every process in a pipeline inherits its pipe file descriptors from the parent (the shell). The shell calls pipe() to create each pipe, then fork() and exec() to spawn each child process. The child inherits the file descriptors and reads or writes to them exactly as it would read or write to a regular file. The pipe is invisible to the processes at each end -- they simply do I/O [3].

> **Related:** [Named Pipes & FIFOs](02-named-pipes-fifos.md) extend this model to unrelated processes. [BSD Socket API](04-bsd-socket-api.md) generalizes the concept to network endpoints.

---

## 2. pipe() and pipe2() System Calls

The pipe() system call creates an anonymous pipe and returns two file descriptors in a two-element integer array. The first element (pipefd[0]) is the read end; the second (pipefd[1]) is the write end. Data written to pipefd[1] is buffered in the kernel ring buffer and can be read from pipefd[0].

```
PROTOTYPE:
  #include <unistd.h>
  int pipe(int pipefd[2]);                         // POSIX.1-2001
  int pipe2(int pipefd[2], int flags);             // POSIX.1-2024 / Linux 2.6.27

RETURNS:
  0 on success; -1 on error with errno set.
  On failure: pipefd is left unchanged (POSIX.1-2008 TC2).
```

The pipe2() variant was added to Linux in kernel 2.6.27 (2008) and was standardized in POSIX.1-2024. It accepts flags that are OR-combinable [4]:

| Flag | Kernel Version | Effect |
|------|---------------|--------|
| O_CLOEXEC | 2.6.27 | Set close-on-exec flag on both file descriptors |
| O_NONBLOCK | 2.6.27 | Set non-blocking mode on both descriptors (saves two fcntl() calls) |
| O_DIRECT | 3.4 | Enable packet mode -- preserves write boundaries |
| O_NOTIFICATION_PIPE | 5.8 | Create a kernel notification pipe (requires CONFIG_WATCH_QUEUE) |

The O_CLOEXEC flag is critical for security: without it, pipe file descriptors leak across exec() boundaries, potentially exposing IPC channels to unintended child processes. Modern code should always use pipe2() with O_CLOEXEC unless the descriptors are intentionally inherited [5].

### Why pipe2() Exists

Before pipe2(), setting flags required a race-prone sequence: pipe() followed by fcntl(). In a multithreaded program, another thread could fork() between the pipe() and fcntl() calls, leaking file descriptors into the child. pipe2() makes the creation and flag-setting atomic [4].

> **Related:** The same race condition motivated the addition of accept4(), dup3(), and socket() flags in later POSIX revisions. See [BSD Socket API](04-bsd-socket-api.md) for the socket equivalent.

---

## 3. Error Codes

Every system call that can fail must document its failure modes. pipe() and pipe2() can fail with the following errno values [4][6]:

| errno | Applies To | Meaning |
|-------|-----------|---------|
| EMFILE | pipe, pipe2 | Per-process limit on open file descriptors reached (RLIMIT_NOFILE) |
| ENFILE | pipe, pipe2 | System-wide limit on total open files reached (/proc/sys/fs/file-max) |
| ENOMEM | pipe, pipe2 | Insufficient kernel memory for pipe buffer allocation |
| EFAULT | pipe, pipe2 | pipefd pointer is not a valid address in the process's address space |
| EINVAL | pipe2 only | Invalid value in flags (unrecognized flag bit set) |
| ENOPKG | pipe2 only | O_NOTIFICATION_PIPE was set but CONFIG_WATCH_QUEUE not compiled into kernel |

The EMFILE error is particularly relevant to GSD's wave-based execution model. Each subagent process holds at least two pipe file descriptors (stdin and stdout), plus stderr. A 50-subagent wave on a single orchestrator process with the default RLIMIT_NOFILE of 1,024 consumes at minimum 100 pipe file descriptors from the orchestrator's budget -- 10% of the limit from pipes alone [7].

> **SAFETY WARNING:** EMFILE failures in a pipe-spawning loop can cause silent subprocess launch failures. GSD's wave executor should check pipe() return values and raise RLIMIT_NOFILE to at least 4,096 before spawning high-parallelism waves.

---

## 4. Ring Buffer and Capacity

The kernel implements a pipe as a circular (ring) buffer of memory pages. Each page holds data in a struct pipe_buffer containing a page pointer, offset, length, and operations vtable [8].

| Parameter | Value / Behavior |
|-----------|-----------------|
| Default capacity | 65,536 bytes (16 pages of 4,096 bytes each; since Linux 2.6.11) |
| Prior default | One system page (typically 4,096 bytes; Linux < 2.6.11) |
| Maximum unprivileged | /proc/sys/fs/pipe-max-size (default: 1,048,576 bytes) |
| Privileged | CAP_SYS_RESOURCE bypasses pipe-max-size limit |
| Dynamic resizing | fcntl(fd, F_SETPIPE_SZ, desired_size) -- rounds up to page boundary |
| Size query | fcntl(fd, F_GETPIPE_SZ) returns actual capacity in bytes |
| Bytes available | ioctl(fd, FIONREAD, &nbytes) -- not POSIX, but widely supported |
| Resizing added | Linux 2.6.35 |

The default capacity of 65,536 bytes is adequate for most interactive pipe usage. For high-throughput data pipelines, increasing capacity with F_SETPIPE_SZ reduces context switches by allowing more data to accumulate before the writer blocks [9].

```
PIPE RING BUFFER INTERNALS
================================================================

  struct pipe_inode_info {
      unsigned int   head;        // write position (page index)
      unsigned int   tail;        // read position (page index)
      unsigned int   ring_size;   // number of pipe_buffer slots
      struct pipe_buffer *bufs;   // array of page references
      ...
  };

  struct pipe_buffer {
      struct page    *page;       // kernel memory page
      unsigned int   offset;      // offset within page
      unsigned int   len;         // data length in this buffer
      const struct pipe_buf_operations *ops;  // vtable
      unsigned int   flags;       // PIPE_BUF_FLAG_*
  };

  Read:  consume from bufs[tail], advance tail
  Write: append to bufs[head], advance head
  Full:  head == tail + ring_size → writer blocks or EAGAIN
  Empty: head == tail → reader blocks or returns 0
```

---

## 5. PIPE_BUF and Atomicity

PIPE_BUF is the maximum number of bytes guaranteed to be written atomically to a pipe. On Linux, PIPE_BUF is 4,096 bytes. POSIX requires a minimum of 512 bytes. This constant is the critical contract between writers and the kernel [10].

**Atomicity guarantee:** If a write() call writes n bytes where n <= PIPE_BUF, the entire write is atomic -- it will not be interleaved with data from another writer. If n > PIPE_BUF, the write is not guaranteed to be atomic; the kernel may interleave it with writes from other processes sharing the same pipe write descriptor [10].

| Platform | PIPE_BUF Value |
|----------|---------------|
| Linux | 4,096 bytes |
| macOS | 512 bytes (POSIX minimum) |
| FreeBSD | 512 bytes |
| NetBSD | 512 bytes |
| Solaris | 5,120 bytes |
| POSIX minimum | 512 bytes |

The 8x difference between Linux (4,096) and macOS (512) means code that relies on atomic writes of 1-4 KB will be correct on Linux but silently broken on macOS when multiple writers share a pipe. Cross-platform GSD deployments must use the POSIX minimum (512 bytes) as the safe atomicity limit, or use per-writer pipes [11].

> **SAFETY WARNING:** Atomicity violations produce no error signal. The write() call succeeds. The data arrives. It is merely interleaved with data from another writer. The resulting byte stream is syntactically corrupted but the corruption is silent. This is the most dangerous class of concurrency bug: the one that works correctly 99.9% of the time.

---

## 6. Blocking and Non-Blocking Behavior

The complete behavior matrix for pipe writes depends on three variables: the O_NONBLOCK flag, the write size relative to PIPE_BUF, and the pipe capacity [10][12]:

| O_NONBLOCK | n vs PIPE_BUF | Atomic? | Behavior on full pipe |
|-----------|--------------|---------|----------------------|
| Disabled (blocking) | n <= PIPE_BUF | Yes | write() blocks until all n bytes are written |
| Disabled (blocking) | n > PIPE_BUF | No | write() blocks until n bytes written; may interleave |
| Enabled | n <= PIPE_BUF | Yes | Succeeds immediately if space; EAGAIN if pipe full |
| Enabled | n > PIPE_BUF | No | 1 to n bytes written (partial write); EAGAIN if 0 bytes fit |

**Read behavior:**

| O_NONBLOCK | Pipe State | Behavior |
|-----------|-----------|---------|
| Disabled | Data available | read() returns immediately with available data (up to buffer size) |
| Disabled | Empty, writers exist | read() blocks until data arrives |
| Disabled | Empty, no writers | read() returns 0 (EOF) |
| Enabled | Data available | read() returns immediately with available data |
| Enabled | Empty, writers exist | read() returns -1, errno = EAGAIN |
| Enabled | Empty, no writers | read() returns 0 (EOF) |

The EOF condition is key: a reader receives EOF (read returns 0) only when all write-end file descriptors have been closed. A common bug is keeping the write end open in the parent process after forking -- the child reader never sees EOF because the parent still holds the write descriptor [12].

---

## 7. Packet Mode (O_DIRECT)

Since Linux 3.4, pipe2() accepts O_DIRECT to enable packet mode. In packet mode, each write() produces a discrete packet rather than merging into the byte stream. Key behaviors [13]:

- The kernel does not merge consecutive writes into one ring buffer slot
- A read() of exactly PIPE_BUF size receives exactly the bytes from one write()
- If the read buffer is smaller than the packet, excess bytes are **discarded** (message truncation)
- Packet mode is only reliable for writes <= PIPE_BUF (4,096 bytes on Linux)
- Writes > PIPE_BUF in packet mode fall back to byte-stream behavior

```
PACKET MODE vs STREAM MODE
================================================================

  STREAM MODE (default):
    write(fd, "AAAA", 4)
    write(fd, "BBBB", 4)
    read(fd, buf, 8) → "AAAABBBB"      (merged)
    read(fd, buf, 3) → "AAA"            (partial, rest available)

  PACKET MODE (O_DIRECT):
    write(fd, "AAAA", 4)
    write(fd, "BBBB", 4)
    read(fd, buf, 8) → "AAAA" (4 bytes) (packet boundary preserved)
    read(fd, buf, 8) → "BBBB" (4 bytes) (second packet)
    read(fd, buf, 2) → "AA"             (WARNING: "AA" discarded from packet!)
```

Packet mode is directly relevant to GSD's DACP structured bundles when multiple agents write to a shared pipe. Each bundle can be written as a discrete packet and read as a complete unit, avoiding the need for application-layer framing. However, the PIPE_BUF size limit constrains DACP bundles to 4,096 bytes in packet mode [13].

> **Related:** See [IPC Performance Spectrum](05-ipc-performance-spectrum.md) for throughput comparisons. See [GSD Protocol Substrate](06-gsd-protocol-substrate.md) for DACP atomicity analysis.

---

## 8. Advanced Operations: splice, tee, vmsplice

Three Linux-specific system calls enable zero-copy pipe operations by manipulating the kernel's page reference counts rather than copying data between user and kernel space [14]:

**splice(2)** -- Move data between a file descriptor and a pipe without user-space copy:

```
#include <fcntl.h>
ssize_t splice(int fd_in, loff_t *off_in,
               int fd_out, loff_t *off_out,
               size_t len, unsigned int flags);

// At least one of fd_in/fd_out must be a pipe
// flags: SPLICE_F_MOVE, SPLICE_F_NONBLOCK, SPLICE_F_MORE, SPLICE_F_GIFT
```

**tee(2)** -- Duplicate data between two pipes (non-destructive; data remains in source pipe):

```
#include <fcntl.h>
ssize_t tee(int fd_in, int fd_out, size_t len, unsigned int flags);
// Both fd_in and fd_out must be pipes
// Duplicates pipe_buffer page references without copying data
```

**vmsplice(2)** -- Map user-space memory pages directly into a pipe buffer:

```
#include <fcntl.h>
ssize_t vmsplice(int fd, const struct iovec *iov,
                 unsigned long nr_segs, unsigned int flags);
// fd must be a pipe
// Maps user pages into pipe buffer slots via page reference counts
```

The performance advantage is significant for large transfers: splice() avoids two copies (user→kernel on write, kernel→user on read) by moving page references instead. The `sendfile()` system call on Linux is actually implemented internally as splice-to-pipe followed by splice-from-pipe [14].

---

## 9. Kernel Tuning Parameters

Four kernel parameters control pipe behavior system-wide. All are accessible via /proc/sys/fs/ [15]:

| Parameter | Default | Effect |
|-----------|---------|--------|
| /proc/sys/fs/pipe-max-size | 1,048,576 | Maximum capacity (bytes) an unprivileged user can set for a single pipe via F_SETPIPE_SZ |
| /proc/sys/fs/pipe-user-pages-hard | 0 | Hard limit on total pages across all pipes for one unprivileged user. 0 = no limit. |
| /proc/sys/fs/pipe-user-pages-soft | 16,384 | Soft limit. When exceeded, new pipe allocations are reduced to a single page (4,096 bytes). 0 = no limit. |
| /proc/sys/fs/file-max | varies | System-wide maximum open file descriptors (affects all fd types including pipes) |

**GSD implications:** During high-parallelism wave execution, each spawned subagent holds at minimum 2 pipe file descriptors (stdin and stdout). A 20-subagent wave consumes 40 pipe fds. With default RLIMIT_NOFILE of 1,024, an orchestrator spawning 200+ subagents across a session approaches the limit. The pipe-user-pages-soft default of 16,384 pages (64 MB) bounds total pipe buffer allocation across the user session [15].

```
GSD WAVE PIPE FD BUDGET
================================================================

  Wave Size    Pipe FDs    % of Default RLIMIT_NOFILE (1024)
  ─────────    ────────    ──────────────────────────────────
  5 agents     10          1%     (trivial)
  20 agents    40          4%     (comfortable)
  50 agents    100         10%    (monitor)
  100 agents   200         20%    (caution)
  200 agents   400         39%    (danger — set RLIMIT to 4096)
  500 agents   1000        98%    (exceeds limit — EMFILE)
```

---

## 10. The Unix Philosophy at Work

The pipe embodies McIlroy's three Unix tenets: do one thing well, expect output to become another program's input, design for composition [2]. The pipe itself does nothing except carry bytes. Its power comes from what it connects. The `ls | grep | wc` pipeline above composes three independent programs into a single computation that none of them alone could perform.

This is the same principle that operates in GSD's architecture. An MCP stdio transport is an anonymous pipe dressed in JSON-RPC framing. A subagent spawn is a fork-and-pipe. The skill-creator observes through a series of pipe and socket connections. The pipe is the substrate.

The Amiga Principle maps directly: the Amiga's serial port ran at exactly 31,250 bps -- the MIDI baud rate -- because that precision unlocked an entire ecosystem. The pipe's precision is the PIPE_BUF constant: exactly 4,096 bytes on Linux. Know that number. Design around it. The power is in the specificity, not in the generality [16].

---

## 11. Historical Evolution

The pipe primitive has evolved across four decades of Unix development, gaining features while preserving backward compatibility [3][4][16]:

| Year | Kernel / Standard | Feature Added |
|------|------------------|---------------|
| 1973 | V3 Unix | pipe() system call introduced by Ken Thompson |
| 1979 | V7 Unix | Pipes integrated into Bourne shell; `|` syntax standardized |
| 1983 | 4.2BSD | Socket API introduced alongside pipes; both use file descriptors |
| 1988 | POSIX.1-1988 | pipe() formally standardized; PIPE_BUF minimum defined as 512 bytes |
| 2001 | POSIX.1-2001 | Full pipe specification in SUSv3 |
| 2005 | Linux 2.6.11 | Default pipe capacity increased from 4,096 to 65,536 bytes (16 pages) |
| 2006 | Linux 2.6.17 | splice(2), tee(2), vmsplice(2) added for zero-copy pipe operations |
| 2008 | Linux 2.6.27 | pipe2() system call added with O_CLOEXEC and O_NONBLOCK flags |
| 2010 | Linux 2.6.35 | F_SETPIPE_SZ / F_GETPIPE_SZ fcntl commands added for dynamic pipe resizing |
| 2012 | Linux 3.4 | O_DIRECT flag for packet mode |
| 2020 | Linux 5.8 | O_NOTIFICATION_PIPE for kernel watch queues |
| 2024 | POSIX.1-2024 | pipe2() formally standardized |

The design is remarkably stable. The core semantics of pipe() -- unidirectional byte stream between two file descriptors -- have not changed since 1973. Every addition (pipe2 flags, splice, dynamic sizing) has been strictly additive, preserving backward compatibility. Code written for V7 Unix pipes in 1979 still works unmodified on Linux 6.x [4].

### The Pipe in the Shell

The shell's `|` operator is syntactic sugar for a precise sequence of system calls. Understanding this sequence clarifies how pipes work at the process level:

```
SHELL PIPELINE: ls | grep "\.md$" | wc -l
================================================================

  Shell (parent):
    1. pipe(pipefd_a)              → create pipe A
    2. fork()                      → create child for "ls"
       Child A:
         close(pipefd_a[0])        → close read end
         dup2(pipefd_a[1], 1)      → redirect stdout to pipe A write end
         close(pipefd_a[1])        → close original write fd (dup2 copied it)
         exec("ls")                → replace child with ls
       Parent:
         close(pipefd_a[1])        → close write end (only child writes)

    3. pipe(pipefd_b)              → create pipe B
    4. fork()                      → create child for "grep"
       Child B:
         close(pipefd_b[0])        → close read end of pipe B
         dup2(pipefd_a[0], 0)      → redirect stdin to pipe A read end
         dup2(pipefd_b[1], 1)      → redirect stdout to pipe B write end
         close(pipefd_a[0])
         close(pipefd_b[1])
         exec("grep", "\.md$")
       Parent:
         close(pipefd_a[0])        → close read end of pipe A
         close(pipefd_b[1])        → close write end of pipe B

    5. fork()                      → create child for "wc"
       Child C:
         dup2(pipefd_b[0], 0)      → redirect stdin to pipe B read end
         close(pipefd_b[0])
         exec("wc", "-l")
       Parent:
         close(pipefd_b[0])        → close read end of pipe B
         wait()                    → wait for all children to exit
```

Every close() call in this sequence is necessary. Forgetting to close the write end of a pipe in the parent prevents the child reader from ever seeing EOF. Forgetting to close the read end leaks file descriptors and can prevent SIGPIPE delivery. The discipline of closing unused pipe ends is the most important (and most often violated) rule of pipe programming [3][5].

### Debugging Pipes

Pipes are invisible to most debugging tools because they have no filesystem presence. Techniques for observing pipe state:

```
# See all pipe file descriptors for a process
ls -la /proc/<pid>/fd/ | grep pipe

# See pipe buffer fill level
cat /proc/<pid>/fdinfo/<fd>
# Output includes: pos (always 0 for pipes), flags, pipe_sz (capacity)

# Trace pipe system calls
strace -e trace=pipe,pipe2,read,write -f -p <pid>

# bpftrace: monitor pipe_write latency
bpftrace -e 'kprobe:pipe_write { @start[tid] = nsecs; }
             kretprobe:pipe_write /@start[tid]/ {
               @us = hist((nsecs - @start[tid]) / 1000);
               delete(@start[tid]);
             }'
```

---

## 12. Cross-References

| Topic | Appears In | Related Projects |
|-------|-----------|-----------------|
| Anonymous pipes (pipe/pipe2) | M1 (this module) | TCP, SYS, CMH |
| PIPE_BUF atomicity | M1, M5, M6 | GSD2, MCF |
| Ring buffer capacity | M1, M5 | K8S, SYS |
| O_DIRECT packet mode | M1, M6 | CMH, RFC |
| splice/tee/vmsplice | M1, M5 | SYS, TCP |
| File descriptor limits | M1, M4, M6 | K8S, SYS |
| Subagent pipe spawning | M1, M6 | GSD2, CMH |
| Unix philosophy / McIlroy | M1, M2 | RFC, SYS |

---

## 12. Sources

1. Ritchie, D.M. and Thompson, K. (1974). "The UNIX Time-Sharing System." *Communications of the ACM*, 17(7), pp. 365-375.
2. McIlroy, M.D. (1964). Internal Bell Labs memorandum proposing pipes. Reproduced in *A Research Unix Reader* (1986).
3. Kernighan, B.W. and Pike, R. (1984). *The Unix Programming Environment*. Prentice-Hall. Chapter 3: Using the Shell.
4. Linux man-pages project. pipe(2), pipe2(2). man7.org. Accessed March 2026.
5. Stevens, W.R. and Rago, S.A. (2013). *Advanced Programming in the UNIX Environment*, 3rd ed. Addison-Wesley. Chapter 15: Interprocess Communication.
6. IEEE Std 1003.1-2024 (POSIX.1-2024). pipe() specification. The Open Group.
7. Linux man-pages project. pipe(7) -- Overview of pipes and FIFOs. man7.org. Accessed March 2026.
8. Linux kernel source. fs/pipe.c -- struct pipe_inode_info, struct pipe_buffer. kernel.org.
9. Baeldung on Linux. "The Pipe Buffer Capacity in Linux." May 2025.
10. IEEE Std 1003.1-2024 (POSIX.1-2024). write() specification -- PIPE_BUF atomicity. The Open Group.
11. GNU C Library Manual. "Pipe Atomicity" section. gnu.org.
12. Linux man-pages project. pipe(7) -- I/O on Pipes and FIFOs. man7.org. Accessed March 2026.
13. Biriukov, V. "FD, Pipe, Session, Terminal: Pipes." biriukov.dev. Packet mode analysis with bpftrace.
14. Linux kernel documentation. Splice and Pipes. kernel.org/doc/html/v6.14/filesystems/splice.html.
15. Ubuntu Manpages. pipe(7) -- /proc/sys/fs/pipe-* parameter documentation.
16. McIlroy, M.D., Pinson, E.N., Tague, B.A. (1978). "UNIX Time-Sharing System: Foreword." *Bell System Technical Journal*, 57(6).
