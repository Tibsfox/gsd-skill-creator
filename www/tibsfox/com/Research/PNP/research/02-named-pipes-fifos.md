# Named Pipes & FIFOs

> **Domain:** Unix IPC Primitives
> **Module:** 2 -- POSIX FIFOs, Filesystem Presence, and Cross-Platform Contrast
> **Through-line:** *The anonymous pipe lives and dies with its parent process. The named pipe outlives everyone -- a persistent rendezvous point in the filesystem where strangers can meet, exchange bytes, and leave. The name is the agreement. The agreement is what allows unrelated processes to collaborate.*

---

## Table of Contents

1. [From Anonymous to Named](#1-from-anonymous-to-named)
2. [POSIX FIFO Specification](#2-posix-fifo-specification)
3. [mkfifo API and Shell Command](#3-mkfifo-api-and-shell-command)
4. [FIFO Lifecycle States](#4-fifo-lifecycle-states)
5. [Blocking on Open](#5-blocking-on-open)
6. [FIFO vs Anonymous Pipe](#6-fifo-vs-anonymous-pipe)
7. [Practical Applications](#7-practical-applications)
8. [Windows Named Pipes -- Contrast](#8-windows-named-pipes----contrast)
9. [Security Considerations](#9-security-considerations)
10. [Shell Pipeline Patterns](#10-shell-pipeline-patterns)
11. [Cross-References](#11-cross-references)
12. [Sources](#12-sources)

---

## 1. From Anonymous to Named

Anonymous pipes require a parent-child relationship: the parent calls pipe(), forks, and the child inherits the file descriptors. Unrelated processes -- those not sharing a common ancestor with inherited descriptors -- cannot use anonymous pipes to communicate.

Named pipes (FIFOs) solve this by attaching a filesystem name to a pipe. Any process that can open the file at that path can read from or write to the pipe. The filesystem entry is the rendezvous mechanism. The data still flows through a kernel ring buffer identical to an anonymous pipe; the difference is in how the endpoints discover each other [1].

```
ANONYMOUS vs NAMED PIPE
================================================================

  ANONYMOUS PIPE:
    Parent calls pipe(pipefd)
    Parent calls fork()
    Child inherits pipefd[0] and pipefd[1]
    Parent closes read end, child closes write end
    Communication proceeds
    Pipe destroyed when last fd closes

  NAMED PIPE (FIFO):
    Process A calls mkfifo("/tmp/myfifo", 0660)
    Process A calls open("/tmp/myfifo", O_WRONLY)  -- blocks
    Process B calls open("/tmp/myfifo", O_RDONLY)  -- unblocks A
    Both processes read/write as with any file descriptor
    FIFO filesystem entry persists until unlink()
    Kernel buffer destroyed when last fd closes
```

The FIFO name is visible in the filesystem with `ls -l` showing a file type of 'p'. It obeys standard Unix file permissions (owner, group, other), providing access control at the filesystem level. No additional authentication mechanism is required [1].

---

## 2. POSIX FIFO Specification

A FIFO is defined in POSIX.1-2024 (IEEE Std 1003.1-2024) as a special file type that provides a unidirectional data channel. The POSIX specification requires that FIFOs support the same read/write semantics as anonymous pipes, including PIPE_BUF atomicity guarantees [2].

Key POSIX requirements:

- A FIFO has a name in the filesystem hierarchy
- Creating a FIFO creates a directory entry of type 'p'; no data storage is allocated until open
- All PIPE_BUF atomicity rules apply (writes <= PIPE_BUF are atomic)
- The pipe capacity is implementation-defined but must be >= PIPE_BUF
- Closing the last write descriptor causes readers to receive EOF
- Closing the last read descriptor causes writers to receive SIGPIPE
- The FIFO persists in the filesystem until explicitly unlinked

The specification explicitly states that opening a FIFO for reading and writing simultaneously (O_RDWR) produces implementation-defined behavior. POSIX does not guarantee it will work, though Linux allows it. This is a portability trap [2].

---

## 3. mkfifo API and Shell Command

```
C LIBRARY:
  #include <sys/stat.h>
  int mkfifo(const char *pathname, mode_t mode);
  // mode is modified by the process umask: effective_mode = mode & ~umask
  // Returns: 0 on success, -1 on error

LEGACY (mknod):
  #include <sys/types.h>
  #include <sys/stat.h>
  int mknod(const char *pathname, mode_t mode | S_IFIFO, 0);

COMMAND LINE:
  mkfifo [-m mode] pathname [...]
  # Example: mkfifo -m 0660 /tmp/gsd-pipe
```

### mkfifo Error Codes

| errno | Meaning |
|-------|---------|
| EACCES | Parent directory does not allow write, or a component of pathname denies search |
| EEXIST | pathname already exists (any file type, not just FIFO) |
| ENAMETOOLONG | pathname exceeds PATH_MAX or a component exceeds NAME_MAX |
| ENOENT | A component of the directory path does not exist |
| ENOSPC | Filesystem or directory is full |
| ENOTDIR | A component of the path prefix is not a directory |
| EROFS | Filesystem is read-only |

After creation, the FIFO is operated on with standard open(), read(), write(), close(), and unlink() calls. The FIFO does not need to be recreated between uses -- it can be opened and closed multiple times, with the kernel allocating a fresh pipe buffer on each open cycle [3].

---

## 4. FIFO Lifecycle States

A FIFO progresses through a defined set of states. Understanding each state and its blocking behavior is essential for correct use [1][4]:

| State | Description | Behavior |
|-------|------------|---------|
| Created (unopen) | Special file exists in filesystem; no kernel buffer | No I/O possible; ls shows type 'p' |
| Writer-only open (blocking) | A process opened O_WRONLY in blocking mode | open() blocks until a reader opens |
| Reader-only open (blocking) | A process opened O_RDONLY in blocking mode | open() blocks until a writer opens |
| Both ends open | Reader and writer both have open descriptors | Active channel; same semantics as anonymous pipe |
| Writer closes, reader active | All write descriptors closed; reader still open | Reader receives EOF (read returns 0) after buffer drains |
| Reader closes, writer active | All read descriptors closed; writer still open | Writer receives SIGPIPE; write() returns -1, errno = EPIPE |
| Unlinked while open | unlink() called while descriptors still open | File entry removed from directory; pipe continues until all fds closed |

The "unlinked while open" state is important: unlink() removes the directory entry but does not destroy the pipe. Data already in the buffer can still be read. New processes can no longer open the FIFO by name, but existing connections continue until all file descriptors are closed [4].

```
FIFO STATE MACHINE
================================================================

  [Created] ──open(O_WRONLY)──> [Writer Waiting]
     │                                │
     └──open(O_RDONLY)──> [Reader Waiting]──writer opens──> [Active]
                                      │
  [Writer Waiting]──reader opens──> [Active]
                                      │
                          ┌───────────┼───────────┐
                          │           │           │
                   writer closes  reader closes  unlink()
                          │           │           │
                    [Reader Gets   [Writer Gets  [Unlinked
                     EOF]           SIGPIPE]      but Active]
                          │           │           │
                    reader closes  writer closes  all fds close
                          │           │           │
                    [Dormant/       [Dormant/    [Destroyed]
                     Reusable]      Reusable]
```

---

## 5. Blocking on Open

The most surprising FIFO behavior for new users is that open() itself blocks. This is by design: the FIFO acts as a synchronization mechanism, ensuring both endpoints are ready before I/O begins [4].

| open() mode | Behavior |
|------------|---------|
| O_RDONLY (blocking) | Blocks until another process opens the FIFO for writing |
| O_WRONLY (blocking) | Blocks until another process opens the FIFO for reading |
| O_RDONLY &#124; O_NONBLOCK | Returns immediately. No writer required. Subsequent reads return EAGAIN until a writer connects. |
| O_WRONLY &#124; O_NONBLOCK | Returns ENXIO immediately if no reader has the FIFO open. This is NOT symmetric with read-side behavior. |
| O_RDWR | Implementation-defined. On Linux, returns immediately (acts as both reader and writer). Not portable. |

The asymmetry in O_NONBLOCK behavior between reader and writer is a common source of bugs. A non-blocking writer-only open fails immediately if no reader exists, but a non-blocking reader-only open succeeds. This asymmetry exists because a reader opening without a writer is a valid "waiting for data" pattern, but a writer opening without a reader would lose data with no consumer [5].

> **SAFETY WARNING:** Using O_RDWR to avoid the blocking-on-open behavior is a non-portable hack. It works on Linux but is explicitly undefined by POSIX. Use two separate FIFOs for bidirectional communication or use Unix domain sockets instead.

---

## 6. FIFO vs Anonymous Pipe

| Property | Anonymous Pipe | Named Pipe (FIFO) |
|----------|---------------|-------------------|
| Created by | pipe() / pipe2() | mkfifo() / mknod() |
| Filesystem presence | None | Yes -- visible as type 'p' |
| Process relationship | Requires parent-child (inherited fds) | Any process with filesystem access |
| Persistence | Destroyed when last fd closes | Persists until unlink() |
| Buffer allocation | At pipe() call | At first open() |
| Access control | Inherited from parent | Unix file permissions (owner/group/other) |
| Capacity | Same (default 65,536 bytes) | Same (default 65,536 bytes) |
| PIPE_BUF atomicity | Same (4,096 bytes on Linux) | Same (4,096 bytes on Linux) |
| Direction | Unidirectional | Unidirectional |
| Reusable | No (single lifecycle) | Yes (can be opened/closed multiple times) |

The kernel implementation is nearly identical. Both use the same ring buffer mechanism (struct pipe_inode_info). The difference is purely in how the endpoints are established: anonymous pipes use inherited file descriptors; FIFOs use the filesystem namespace [1].

---

## 7. Practical Applications

Named pipes enable several patterns that anonymous pipes cannot [6][7]:

### Database Bulk Loading

```
# Decompress a 10GB gzipped CSV into MySQL without writing a temp file
mkfifo /tmp/load_pipe
gunzip -c huge_data.csv.gz > /tmp/load_pipe &
mysql -e "LOAD DATA INFILE '/tmp/load_pipe' INTO TABLE big_table"
rm /tmp/load_pipe
```

The gunzip process writes decompressed data into the FIFO; MySQL reads from it. At no point does the full 10GB uncompressed file exist on disk. The kernel pipe buffer (64KB) mediates the flow, applying backpressure when MySQL falls behind [6].

### Log Aggregation

Multiple writer processes can append to a single named pipe, with a single reader persisting to disk. Writes <= PIPE_BUF (4,096 bytes) from each writer are atomic, preventing log line interleaving.

### Process Synchronization

```
# Script A: wait for Script B to be ready
mkfifo /tmp/sync
read < /tmp/sync      # blocks until Script B writes
echo "Script B is ready, proceeding..."

# Script B: signal readiness
echo "ready" > /tmp/sync
```

### Service Discovery Without TCP

A local service can create a FIFO at a well-known path. Clients connect by opening the FIFO. No port number allocation, no TCP overhead, no firewall rules. The filesystem path IS the service address [7].

> **Related:** Unix domain sockets provide a more capable version of this pattern with bidirectional communication. See [BSD Socket API](04-bsd-socket-api.md) for details.

---

## 8. Windows Named Pipes -- Contrast

Windows named pipes are an SMB-based IPC mechanism with substantially different semantics from Unix FIFOs. They are created by the pipe server using CreateNamedPipe() and follow the Win32 SDK model [8].

| Attribute | Unix FIFO (Linux) | Windows Named Pipe |
|-----------|------------------|-------------------|
| Persistence | Until unlink() called | Volatile: removed when last handle closes |
| Directionality | Unidirectional (two FIFOs for bidir) | One-way or duplex (PIPE_ACCESS_DUPLEX) |
| Framing | Byte stream only | Byte mode or message mode (PIPE_TYPE_MESSAGE) |
| Naming | Filesystem path (/tmp/name) | \\\\.\pipe\name (virtual namespace) |
| Network access | No (local only) | Yes: accessible over SMB network shares via IPC$ |
| Authentication | Unix file permissions | SMB authentication context (transparent) |
| API | POSIX open/read/write | Win32 CreateFile/ReadFile/WriteFile/CloseHandle |
| Filesystem visible | Yes (ls shows type p) | No (virtual namespace only) |
| Multiple instances | No (single FIFO, multiple openers) | Yes (CreateNamedPipe with nMaxInstances) |
| Impersonation | Not applicable | ImpersonateNamedPipeClient() for server-side impersonation |
| Buffer size | Kernel-managed (65KB default) | Specified at creation (nInBufferSize, nOutBufferSize) |

The most significant difference is **volatility**: Unix FIFOs persist across reboots (if on a persistent filesystem). Windows named pipes vanish when the last handle closes. A Windows service that dies and restarts must recreate its named pipe; a Unix service can restart and reopen the existing FIFO [8].

Windows named pipes are also the foundation of the SMB Named Pipes protocol within the IPC$ share, enabling remote RPC. This is a capability Unix FIFOs explicitly lack -- they are strictly local [9].

> **Related:** GSD's cross-platform Tauri layer must account for these differences. See [GSD Protocol Substrate](06-gsd-protocol-substrate.md) for the cross-platform IPC strategy.

---

## 9. Security Considerations

### TOCTOU Race Conditions

A time-of-check-to-time-of-use (TOCTOU) vulnerability exists when a program checks whether a FIFO exists at a path and then creates or opens it. Between the check and the action, an attacker can replace the expected file with a symlink to a sensitive file. Mitigation: use O_NOFOLLOW when opening FIFOs in shared directories like /tmp [10].

### Permission Model

FIFOs inherit the standard Unix permission model (rwxrwxrwx minus umask). In shared directories with the sticky bit set (/tmp), only the file owner or root can unlink a FIFO. Write access allows any process to inject data; read access allows any process to consume data.

### /tmp Race Prevention

```
# WRONG: predictable name in shared /tmp
mkfifo /tmp/myapp-pipe

# BETTER: use mktemp to create a unique directory first
TMPDIR=$(mktemp -d /tmp/myapp.XXXXXX)
mkfifo "$TMPDIR/pipe"
# Set permissions on the directory, not just the FIFO
chmod 700 "$TMPDIR"
```

> **SAFETY WARNING:** The security consideration section describes methodology for understanding FIFO security boundaries. No exploitation paths, working exploit code, or CVE reproduction steps are provided.

---

## 10. Shell Pipeline Patterns

The shell's `|` operator creates anonymous pipes automatically. Named pipes enable more complex topologies [11]:

```
TEE PATTERN — Split output to two consumers:
  mkfifo /tmp/branch
  command | tee /tmp/branch | consumer_a &
  consumer_b < /tmp/branch

MERGE PATTERN — Combine outputs from two producers:
  mkfifo /tmp/merge
  producer_a > /tmp/merge &
  producer_b >> /tmp/merge &
  consumer < /tmp/merge
  # WARNING: interleaving if writes > PIPE_BUF

FEEDBACK LOOP — Send output back to input:
  mkfifo /tmp/feedback
  process < /tmp/feedback | transform > /tmp/feedback &
  echo "seed" > /tmp/feedback
  # WARNING: deadlock risk if buffer fills; careful capacity management needed
```

These patterns are the shell-level expression of the same composition principle that GSD uses at the agent level: connect independent processes with standardized channels. The pipe topology IS the program [11].

---

## 11. Performance Characteristics

Named pipes and anonymous pipes share the same kernel implementation (struct pipe_inode_info) and therefore have nearly identical throughput and latency characteristics. The only additional overhead for named pipes is the initial open() call, which involves a filesystem lookup [13][15]:

| Metric | Anonymous Pipe | Named Pipe (FIFO) | Difference |
|--------|---------------|-------------------|-----------|
| Throughput (100B blocks) | ~310 Mbit/s | ~318 Mbit/s | FIFO slightly faster (measurement variance) |
| Throughput (1MB blocks) | ~550 Mbit/s | ~520 Mbit/s | Pipe slightly faster at large blocks |
| Initial setup | pipe() syscall (~1 us) | mkfifo() + open() (~5-10 us) | FIFO adds filesystem overhead |
| Subsequent I/O | Identical | Identical | Same kernel path after open |
| Buffer capacity | 65,536 bytes default | 65,536 bytes default | Same |
| PIPE_BUF atomicity | 4,096 bytes | 4,096 bytes | Same |

The practical conclusion: choose between anonymous and named pipes based on the process relationship (parent-child vs. unrelated), not on performance. The throughput difference is within measurement noise [15].

### FIFO in Container Environments

Named pipes in containerized environments (Docker, Kubernetes) require special consideration:

```
FIFO IN CONTAINERS
================================================================

  Docker volume mount:
    docker run -v /tmp/gsd-pipe:/tmp/gsd-pipe myapp
    # Host FIFO is accessible inside container
    # Permissions must match container user

  Kubernetes emptyDir:
    volumes:
    - name: ipc
      emptyDir: {}
    # FIFO created in shared volume between containers in same pod
    # mkfifo /var/ipc/channel

  tmpfs mount (RAM-backed):
    docker run --tmpfs /tmp:rw,exec myapp
    # FIFO on tmpfs: slightly faster (no disk journal)
    # Lost on container restart

  WARNING: Named pipes do NOT work across network filesystems (NFS, CIFS).
  The kernel pipe buffer is local; the filesystem entry is just a rendezvous.
```

### FIFO Cleanup Patterns

Stale FIFOs -- those left behind when a process crashes without calling unlink() -- are a common operational problem. Patterns for handling cleanup [7]:

```
# Check if a FIFO has active readers/writers
lsof /tmp/myfifo 2>/dev/null
# Empty output = stale; safe to remove

# Cleanup script
cleanup_fifo() {
    local fifo="$1"
    if [ -p "$fifo" ] && ! lsof "$fifo" >/dev/null 2>&1; then
        rm -f "$fifo"
    fi
}

# Trap-based cleanup in the creating process
FIFO_PATH="/tmp/gsd-$$.fifo"
mkfifo "$FIFO_PATH"
trap "rm -f $FIFO_PATH" EXIT INT TERM
```

---

## 12. Cross-References

| Topic | Appears In | Related Projects |
|-------|-----------|-----------------|
| Named pipes / FIFOs | M2 (this module) | SYS, CMH, K8S |
| POSIX FIFO spec | M2, M4 | RFC, TCP |
| Blocking on open | M2, M5 | SYS |
| Windows named pipe contrast | M2, M6 | CMH, SYS |
| TOCTOU security | M2, M6 | SYS, SAN |
| Log aggregation | M2 | SYS, K8S |
| Database bulk loading | M2 | SYS |
| Shell pipeline topology | M1, M2 | RFC, SYS |

---

## 12. Sources

1. Linux man-pages project. fifo(7) -- overview of FIFO special files. man7.org. Accessed March 2026.
2. IEEE Std 1003.1-2024 (POSIX.1-2024). mkfifo() specification. The Open Group.
3. Linux man-pages project. mkfifo(3) -- make a FIFO special file. man7.org. Accessed March 2026.
4. Stevens, W.R. and Rago, S.A. (2013). *Advanced Programming in the UNIX Environment*, 3rd ed. Addison-Wesley. Section 15.5: FIFOs.
5. Linux man-pages project. open(2) -- FIFO-specific behavior with O_NONBLOCK. man7.org. Accessed March 2026.
6. Baeldung on Linux. "Named Pipes in Linux: A Complete Guide." 2025.
7. Kerrisk, M. (2010). *The Linux Programming Interface*. No Starch Press. Chapter 44: Pipes and FIFOs.
8. Microsoft Learn. "Named Pipes." Win32 SDK documentation. learn.microsoft.com. Accessed March 2026.
9. Microsoft Learn. "Interprocess Communications -- Named Pipes." learn.microsoft.com. Accessed March 2026.
10. CERT/CC. "FIO01-C: Be careful using functions that use file names for identification." SEI CERT C Coding Standard.
11. Kernighan, B.W. and Pike, R. (1984). *The Unix Programming Environment*. Prentice-Hall. Chapter 5: Shell Programming.
12. Wikipedia. "Named pipe." Updated March 2026. Unix vs. Windows semantic comparison; SMB IPC$ share.
13. Linux man-pages project. pipe(7) -- I/O on Pipes and FIFOs. man7.org. Accessed March 2026.
14. NetBSD Manual Pages. mkfifo(2). POSIX.1-2024 conformance notes.
15. Baeldung on Linux. "IPC Performance Comparison: Anonymous Pipes, Named Pipes, Unix Sockets, and TCP Sockets." May 2025.
