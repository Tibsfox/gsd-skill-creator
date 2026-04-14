# C Standard Library, libc Variants, POSIX, and Systems Programming

A deep research document covering the C standard library headers, major libc implementations,
POSIX, and the vast landscape of systems software written in C.

---

## 1. The C Standard Library

The C standard library (libc) is defined by the ISO C standard. It began as a small set of
headers in K&R C (1978), was formalized in ANSI C / C89 / ISO C90, expanded significantly in
C99 (1999), and further in C11 (2011), C17 (a bugfix), and C23 (2024).

### Core headers (C89/C90)

#### `<stdio.h>` — Standard I/O
The most famous C header. Provides buffered I/O via `FILE *`.

- **`printf` / `fprintf` / `sprintf` / `snprintf`** — formatted output. The format string
  (`%d`, `%s`, `%f`, `%p`, `%x`, `%lld`, etc.) is a mini-language interpreted at runtime.
  Variadic under the hood via `<stdarg.h>`.
- **`scanf` / `fscanf` / `sscanf`** — formatted input. Widely considered dangerous
  (`%s` has no bounds; use `fgets` + `sscanf` or `strtol` instead).
- **`fopen` / `fclose` / `fread` / `fwrite` / `fseek` / `ftell` / `rewind`** — file I/O.
- **`fgetc` / `fputc` / `fgets` / `fputs` / `getchar` / `putchar`** — character and line I/O.
- **`FILE *`** — opaque handle wrapping an underlying file descriptor plus a user-space buffer.
  On POSIX, `fileno(FILE *)` gives you the int fd. Buffering modes: `_IOFBF`, `_IOLBF`, `_IONBF`
  (settable via `setvbuf`).
- **Standard streams:** `stdin`, `stdout`, `stderr` (line-buffered when attached to a TTY,
  fully buffered otherwise; `stderr` is unbuffered).
- **C99 additions:** `snprintf`, `vsnprintf`, `vfscanf` family.
- **`tmpfile`, `tmpnam`, `mkstemp`** (POSIX) — temporary files. `tmpnam` is unsafe and
  deprecated in C23.

#### `<stdlib.h>` — General utilities
- **Memory:** `malloc`, `calloc`, `realloc`, `free`, `aligned_alloc` (C11). Underlying
  allocator is implementation-specific — glibc uses ptmalloc2 (fork of Wolfram Gloger's
  dlmalloc), musl uses a mallocng design, jemalloc and tcmalloc are drop-in replacements.
- **Conversions:** `atoi`, `atol`, `atof`, `strtol`, `strtoul`, `strtoll`, `strtod`,
  `strtof`. The `strto*` family is preferred — it reports errors via `endptr` and `errno`.
- **Program control:** `exit`, `_Exit`, `abort`, `atexit`, `at_quick_exit` (C11),
  `quick_exit` (C11), `getenv`, `setenv` (POSIX), `system`.
- **Search/sort:** `qsort` (quicksort, but implementations usually use introsort or
  mergesort), `bsearch` (binary search). Both take a comparator function pointer.
- **Random:** `rand`, `srand`, `RAND_MAX`. Low quality — use `arc4random` (BSD) or
  `/dev/urandom` or `getrandom(2)` for anything non-trivial.
- **Integer arithmetic:** `abs`, `labs`, `llabs`, `div`, `ldiv`.
- **Multibyte:** `mblen`, `mbtowc`, `wctomb`, `mbstowcs`, `wcstombs`.

#### `<string.h>` — String and memory manipulation
- **String functions:** `strlen`, `strcpy`, `strncpy`, `strcat`, `strncat`, `strcmp`,
  `strncmp`, `strchr`, `strrchr`, `strstr`, `strtok`, `strerror`, `strdup` (POSIX, C23).
- **Memory functions:** `memcpy`, `memmove` (handles overlap), `memset`, `memcmp`, `memchr`.
- **Important safety notes:** `strcpy` and `strcat` have no bounds checking.
  OpenBSD introduced `strlcpy` and `strlcat` in 1998 (Todd Miller) as safer alternatives;
  glibc refused them for years and finally adopted them in glibc 2.38 (2023).
- `memcpy` vs `memmove`: `memcpy` has undefined behavior on overlap; `memmove` handles it.

#### `<ctype.h>` — Character classification
- `isalpha`, `isdigit`, `isalnum`, `isspace`, `isupper`, `islower`, `isxdigit`, `ispunct`,
  `iscntrl`, `isprint`, `isgraph`, `tolower`, `toupper`.
- These operate on `int` and expect the argument to be representable as `unsigned char`
  or EOF — passing a plain signed `char` can invoke undefined behavior on values > 127.
- Implementation is typically a table lookup keyed by a locale-aware ctype array.

#### `<math.h>` — Math functions
- **Trigonometry:** `sin`, `cos`, `tan`, `asin`, `acos`, `atan`, `atan2`.
- **Exponential/log:** `exp`, `exp2`, `log`, `log10`, `log2`, `pow`, `sqrt`, `cbrt`.
- **Hyperbolic:** `sinh`, `cosh`, `tanh`.
- **Rounding:** `floor`, `ceil`, `round`, `trunc`, `rint`, `nearbyint`.
- **C99 additions:** `fma` (fused multiply-add), `hypot`, `expm1`, `log1p`, `erf`, `erfc`,
  `tgamma`, `lgamma`, `isnan`, `isinf`, `isfinite`, `fpclassify`, `signbit`.
- **Type-generic:** `<tgmath.h>` (C99) dispatches to `float`/`double`/`long double` variants.
- Usually needs `-lm` on Linux. Implementations: glibc has its own; there's also `libmvec`
  (vectorized), Sun's `fdlibm` (IEEE 754 reference), CORE-MATH project.

#### `<time.h>` — Date and time
- **Types:** `time_t` (calendar time, usually Unix epoch seconds), `clock_t` (CPU time
  ticks), `struct tm` (broken-down time), `struct timespec` (C11, nanosecond precision).
- **Functions:** `time`, `clock`, `difftime`, `mktime`, `localtime`, `gmtime`, `asctime`,
  `ctime`, `strftime`.
- **C11:** `timespec_get`.
- **POSIX:** `clock_gettime` (with `CLOCK_REALTIME`, `CLOCK_MONOTONIC`, `CLOCK_BOOTTIME`,
  `CLOCK_PROCESS_CPUTIME_ID`), `nanosleep`, `gettimeofday`.
- **The Y2038 problem:** on 32-bit systems `time_t` is a signed 32-bit int and overflows
  on January 19, 2038 at 03:14:07 UTC. glibc 2.34+ supports 64-bit `time_t` on 32-bit
  Linux; NetBSD transitioned years earlier.

#### `<errno.h>` — Error numbers
- The thread-local `errno` variable. In modern C it's a macro that expands to something
  like `(*__errno_location())`, which is thread-local.
- Standard values: `EDOM`, `ERANGE`, `EILSEQ`. POSIX adds hundreds: `ENOENT`, `EACCES`,
  `EAGAIN`/`EWOULDBLOCK`, `EINVAL`, `EIO`, `ENOMEM`, `ENOSPC`, `EPIPE`, `EINTR`, `EBADF`,
  `ECONNREFUSED`, `ETIMEDOUT`, etc.
- Retrieve via `strerror(errno)` or `perror(msg)`.

#### `<stdarg.h>` — Variable arguments
- `va_list`, `va_start`, `va_arg`, `va_end`, `va_copy` (C99).
- Implements variadic functions like `printf`. On x86-64 SysV ABI this involves walking
  the 6 integer and 8 FP argument registers plus stack overflow, recorded in a
  `va_list` structure. The calling convention is *hard* — classic undefined behavior
  source if you get types wrong.

#### `<setjmp.h>` — Non-local jumps
- `jmp_buf`, `setjmp`, `longjmp`. Poor man's exceptions. Saves/restores the stack pointer
  and callee-saved registers (but not signal masks — use `sigsetjmp`/`siglongjmp`).
- Used by error-handling macros (e.g., libpng's error handling), some VM implementations,
  coroutine libraries, protothreads.

#### `<signal.h>` — Signal handling
- `signal`, `raise`. POSIX greatly expands this: `sigaction`, `sigprocmask`,
  `sigsuspend`, `sigqueue`, `kill`, `pthread_sigmask`.
- Signals: `SIGINT`, `SIGTERM`, `SIGKILL` (uncatchable), `SIGSEGV`, `SIGFPE`, `SIGPIPE`,
  `SIGCHLD`, `SIGHUP`, `SIGUSR1`, `SIGUSR2`, `SIGALRM`, `SIGWINCH`, `SIGBUS`, `SIGABRT`.
- Signal handlers can only safely call **async-signal-safe** functions (a short list
  documented in POSIX signal-safety(7)). `printf` is NOT safe. `write` is.

#### `<locale.h>` — Localization
- `setlocale`, `localeconv`. `LC_ALL`, `LC_COLLATE`, `LC_CTYPE`, `LC_MONETARY`,
  `LC_NUMERIC`, `LC_TIME`, `LC_MESSAGES` (POSIX).
- Infamous gotcha: `LC_NUMERIC` can change the decimal separator from `.` to `,`,
  breaking `atof`/`printf("%f")` assumptions. Many programs call `setlocale(LC_ALL, "C")`
  at startup.

#### `<limits.h>` — Integer limits
- `CHAR_BIT` (usually 8), `SCHAR_MIN/MAX`, `UCHAR_MAX`, `SHRT_MIN/MAX`, `INT_MIN/MAX`,
  `LONG_MIN/MAX`, `LLONG_MIN/MAX` (C99), `SIZE_MAX`.
- Also `PATH_MAX` (POSIX, often 4096 on Linux).

#### `<float.h>` — Floating point characteristics
- `FLT_MAX`, `DBL_MAX`, `FLT_EPSILON`, `DBL_EPSILON`, `FLT_DIG`, `DBL_DIG`, `FLT_RADIX`,
  `FLT_ROUNDS`, `FLT_MIN_EXP`. IEEE 754 single/double are ubiquitous; `long double` is
  x87 80-bit extended on Linux/x86-64, 128-bit IEEE on some platforms, or just `double`.

#### `<assert.h>` — Diagnostics
- `assert(expr)` — prints message and calls `abort()` if `expr` is zero. Compiled out
  when `NDEBUG` is defined. C11 added `static_assert` (compile-time).

#### `<stddef.h>` — Standard definitions
- `size_t`, `ptrdiff_t`, `NULL`, `offsetof`, `wchar_t`, `max_align_t` (C11),
  `nullptr_t` (C23).

### C99 additions

#### `<stdint.h>` — Fixed-width integer types
- `int8_t`, `int16_t`, `int32_t`, `int64_t`, `uint8_t` ... `uint64_t`.
- `int_least8_t`, `int_fast32_t`, `intmax_t`, `uintptr_t`, `intptr_t`.
- Macros: `INT32_MAX`, `UINT64_MAX`, `SIZE_MAX`, `PTRDIFF_MAX`.
- Format macros in `<inttypes.h>`: `PRId64`, `PRIu32`, `SCNx64`.
- This header is arguably the most important C99 addition for portability —
  before it, code was littered with `typedef` guesswork.

#### `<stdbool.h>` — Boolean type
- Defines `bool`, `true`, `false` as macros aliasing `_Bool`. In C23, `bool` becomes
  a keyword.

#### `<complex.h>` — Complex numbers
- `float complex`, `double complex`, `long double complex`. `I`, `csin`, `cexp`, `cabs`.

#### `<fenv.h>` — Floating-point environment
- `feclearexcept`, `fesetround`, `FE_UPWARD`, `FE_DOWNWARD`, `FE_TONEAREST`.

#### `<tgmath.h>` — Type-generic math
- Uses `_Generic` (C11) in modern implementations to dispatch on argument type.

#### `<wchar.h>` / `<wctype.h>` — Wide characters
- `wchar_t`, `wprintf`, `wcslen`, `mbstate_t`. 16-bit on Windows (UTF-16), 32-bit
  on Linux (UTF-32). Widely considered a botched design — most real Unicode handling
  uses UTF-8 directly or ICU.

### C11 additions

#### `<stdatomic.h>` — Atomics
- `atomic_int`, `atomic_load`, `atomic_store`, `atomic_compare_exchange_strong`,
  `atomic_fetch_add`, `atomic_thread_fence`.
- Memory orders: `memory_order_relaxed`, `acquire`, `release`, `acq_rel`, `seq_cst`.
- Matches the C++11 atomics model (they were designed in parallel).

#### `<threads.h>` — Threads
- `thrd_create`, `thrd_join`, `mtx_lock`, `cnd_wait`, `tss_create`.
- Optional feature; glibc added support in 2.28 (2018). Most C code still uses POSIX
  pthreads directly. musl has always supported C11 threads.

#### `<uchar.h>` — Unicode characters
- `char16_t`, `char32_t`, `mbrtoc16`, `c32rtomb`. For UTF-16 and UTF-32 conversion.

### C23 additions
- `<stdbit.h>` — bit manipulation (`stdc_count_ones`, `stdc_leading_zeros`, etc.).
- `<stdckdint.h>` — checked integer arithmetic (`ckd_add`, `ckd_sub`, `ckd_mul`).
- `nullptr` keyword, `bool`/`true`/`false` as keywords, `typeof`, `constexpr`,
  `#embed`, `[[attribute]]` syntax, `u8""` literals are now `char8_t`.

---

## 2. libc Implementations

There is no single "libc" — the C standard only defines the API. Many implementations
exist, each optimized for different tradeoffs.

### glibc — GNU C Library
- **Origin:** Roland McGrath started it at the FSF in 1987. Merged with Linux libc
  (which had forked as "libc5" for Linux a.out and ELF) in 1997 with glibc 2.0, authored
  primarily by Ulrich Drepper, who ran the project with legendary acerbity until 2012.
- **License:** LGPL-2.1-or-later (and some files under other licenses).
- **Role:** Default libc on nearly every mainstream Linux distribution (Debian, Ubuntu,
  Fedora, RHEL, Arch, openSUSE, Gentoo). Maintained under the GNU umbrella, with a steering
  committee including Carlos O'Donell, Adhemerval Zanella, Siddhesh Poyarekar.
- **Design:** Massive. Hundreds of thousands of lines. Full NSS (Name Service Switch)
  for pluggable name resolution. Supports dozens of architectures. Heavy use of symbol
  versioning (`GLIBC_2.x` symbols) for ABI stability — a binary from 2005 still runs
  on a modern glibc.
- **Features:** NPTL (Native POSIX Thread Library) since glibc 2.3.2 (2003), IFUNC
  dispatch for architecture-optimized functions, locale support via `/usr/lib/locale`,
  the notorious `ld.so` dynamic linker.
- **Versions to know:** 2.17 (RHEL 7, LTS), 2.28 (Debian 10, `fgets_unlocked` became
  symbol, C11 threads), 2.31 (Ubuntu 20.04), 2.35 (Ubuntu 22.04), 2.38 (`strlcpy` added),
  2.39 (2024).
- **Criticism:** Large, complex, slow startup, difficult for static linking, aggressive
  ABI that makes "run anywhere" binaries hard.

### musl — Minimalist libc
- **Origin:** Rich Felker, first release 2011. "musl" is pronounced like the word "mussel".
- **License:** MIT.
- **Philosophy:** Correctness, simplicity, static-linking friendliness, small binary
  size, thread safety by default. Every function is designed to be async-signal-safe
  when possible.
- **Used by:** Alpine Linux (the poster child for musl, ~5 MB base images, dominant in
  Docker), Void Linux (musl variant), OpenWrt (for some builds), Chimera Linux, postmarketOS.
- **Size:** Complete musl libc is about 600 KB. glibc is ~10 MB.
- **Downsides:** DNS resolver is simpler (no EDNS, no /etc/nsswitch.conf). Some Linux-specific
  behaviors differ. Locale support is minimal (C and C.UTF-8 effectively). Historically
  slower malloc (fixed with mallocng in 1.2.1, 2020).
- **Maintainer:** Rich Felker, still the sole maintainer as of 2024. The project has an
  extremely high code-quality bar.

### uClibc / uClibc-ng
- **Origin:** Erik Andersen, 1999, for embedded Linux (µClinux on MMU-less systems).
  Original `uclibc.org` is dead; **uClibc-ng** (maintained by Waldemar Brodkorb since 2014)
  is the living fork.
- **License:** LGPL-2.1.
- **Target:** Embedded systems, routers, MIPS/ARM/NIOS devices, OpenWrt historically.
- **Size:** Configurable; very small builds possible (~200 KB).

### newlib
- **Origin:** Developed at Cygnus Solutions (now Red Hat), a libc for embedded systems
  that assumes a very thin "BSP" (board support package) layer underneath.
- **License:** Mix of BSD and GPL variants; mostly permissive.
- **Used by:** Cygwin (Windows POSIX layer), the RISC-V GCC toolchain, the Arduino Due
  SAM3X toolchain, many bare-metal ARM Cortex-M toolchains (arm-none-eabi-gcc), Nintendo
  homebrew SDKs (devkitPro), NASA JPL embedded work.
- **Notable feature:** System calls are stubs that must be provided by the user (e.g.,
  `_sbrk_r`, `_write_r`, `_read_r`) — very portable across bare metal.

### BSD libc (FreeBSD, OpenBSD, NetBSD, DragonFly)
- **Origin:** 4.4BSD-Lite, traceable back to 1970s Bell Labs via the BSD lineage.
- **License:** 2-clause BSD (the epitome of "do whatever").
- **Distinct:** Each BSD has its own fork with its own additions. OpenBSD adds
  `strlcpy`/`strlcat` (1998), `arc4random`, `reallocarray` (integer-overflow-safe),
  `pledge`, `unveil`. FreeBSD adds `jemalloc` as its default allocator (since 2005).
- **Darwin libc** (macOS) descends from FreeBSD's libc but diverged substantially.
  Source available in Apple's Darwin releases.

### Bionic — Android's libc
- **Origin:** Google developed it in-house for Android starting around 2005, released
  with Android 1.0 in 2008. Authors include Fabrice Bellard (briefly — wait, that's
  a separate story) and Android system engineers.
- **License:** BSD.
- **Rationale:** Android wanted something smaller than glibc, without the LGPL "static
  linking" concerns, and tuned for low-memory ARM devices.
- **Size:** Smaller than glibc, larger than musl.
- **Features:** Unique aspects — no full locale support for years, no wide-character
  handling originally, custom dynamic linker, integrated with the Android framework.
- **Notable:** Dan Borodkin and Elliott Hughes have been long-time maintainers.

### dietlibc
- **Origin:** Felix von Leitner ("fefe"), early 2000s. GPL-licensed.
- **Philosophy:** The smallest possible libc, optimized for static linking. Produces
  tiny binaries — static "hello world" under 1 KB.
- **Used by:** Some security-conscious software, small embedded projects, minimalist
  Linux distributions like smallinux.

### klibc
- **Origin:** H. Peter Anvin (hpa), 2002. Written for the Linux kernel's early userspace
  (`initramfs`). GPL-licensed (with some BSD).
- **Used in:** `klibc-utils` in Debian, initramfs tools, tiny bootstrap environments.

### Windows C runtimes
- **MSVCRT.DLL** — The "Microsoft Visual C Runtime". Originally part of Visual C++,
  shipped with Windows 95 as `MSVCRT.DLL`. Different versions shipped with different
  compilers (MSVCR70.DLL, MSVCR80.DLL, MSVCR100.DLL, MSVCR120.DLL), causing "DLL hell".
- **UCRT** — Universal C Runtime, introduced in Windows 10 (2015). Shipped as part
  of the OS in `ucrtbase.dll`. Finally gave Windows a stable, versioned C runtime.
  Visual Studio 2015+ targets UCRT. Also available on older Windows via the
  Windows 10 Universal CRT redistributable.
- **Mingw-w64** provides its own wrapper headers that call into MSVCRT/UCRT.
- **POSIX gaps:** No `fork`, limited signals, no `select` on arbitrary fds, no
  `mmap` (but `CreateFileMapping`). Windows has historically been POSIX-hostile.

### Cosmopolitan libc
- **Author:** Justine Tunney (@jart), first released 2020.
- **License:** ISC.
- **The trick:** Produces "actually portable executables" (APE) — a single binary that
  runs as an ELF on Linux, a Mach-O on macOS, a PE on Windows, an a.out on FreeBSD/NetBSD/
  OpenBSD, and even boots on bare metal. Achieved via a clever polyglot binary layout
  where the same bytes are interpreted as valid headers by multiple loaders ("αcτµαlly
  pδrταblε εxεcµταblε", shell script + ZIP + ELF + PE + Mach-O all at once).
- **Notable projects using it:** `llamafile` (Justine's later project, packages LLM
  weights + llama.cpp as a single APE binary), `redbean` (single-file web server).
- **Constraints:** Statically linked, no dynamic loading, subset of POSIX. But it works
  — a compiled C program literally runs on six operating systems with no changes.

---

## 3. POSIX

### What POSIX is
**POSIX** = Portable Operating System Interface. A family of IEEE standards (IEEE 1003.x)
and an Open Group standard. The name was suggested by Richard Stallman to IEEE.

- **IEEE 1003.1** is the core: system interfaces (libc + beyond), shell & utilities.
- **POSIX.2** (IEEE 1003.2) — shell and utilities, merged into 1003.1 later.
- **POSIX.1b** (1993) — Real-time extensions: priority scheduling, message queues,
  semaphores, shared memory, asynchronous I/O, memory locking, timers.
- **POSIX.1c** (1995) — Threads (pthreads). The standard API for threading on Unix.

### Versions
- **POSIX.1-1988** — First publication.
- **POSIX.1-1990 (IEEE 1003.1-1990)** — Adopted by ISO as ISO/IEC 9945-1:1990.
- **POSIX.1-2001 / SUSv3** — Major unification. Merged with the **Single UNIX Specification**
  (SUS) under The Open Group. Split into Base Definitions, System Interfaces, Shell &
  Utilities, Rationale (the "four volumes").
- **POSIX.1-2008 / SUSv4** — Added more thread-safe functions, retired legacy (cuserid,
  ftw, SIGEV_SIGNAL timers tightened).
- **POSIX.1-2017 (IEEE Std 1003.1-2017)** — Minor update, consolidation.
- **POSIX.1-2024 (IEEE Std 1003.1-2024)** — The latest, approved June 2024. Added
  `getentropy`, `strlcpy`, `strlcat`, `ppoll`, `memmem`, `dprintf`, various modernizations.
  This is a major revision.

### The Single UNIX Specification (SUS)
Maintained by **The Open Group**. Products certified as "UNIX" (the trademark) must
conform to SUS. Certified UNIXes include: macOS (since 10.5 Leopard 2007, a major
achievement — Apple paid the fees), IBM AIX, Oracle Solaris, HP-UX, Inspur K-UX,
Huawei EulerOS. Linux is explicitly **not** certified (Linux is "UNIX-like" but not
"UNIX" in the legal trademark sense).

### What POSIX adds on top of ANSI C

#### `<unistd.h>` — POSIX system calls
- File I/O: `read`, `write`, `open`, `close`, `lseek`, `dup`, `dup2`, `pipe`, `fsync`.
- Process: `fork`, `execve` (and `execl`, `execlp`, `execvp`, `execvpe`), `wait`, `waitpid`,
  `getpid`, `getppid`, `_exit`, `getuid`, `setuid`, `getgid`, `chdir`, `getcwd`.
- `sleep`, `usleep`, `alarm`, `pause`.
- `access`, `link`, `symlink`, `unlink`, `rmdir`, `readlink`, `chown`, `chmod`.
- `isatty`, `ttyname`, `getlogin`.
- `getopt` — command-line parsing.

#### `<fcntl.h>` — File control
- `open` flags: `O_RDONLY`, `O_WRONLY`, `O_RDWR`, `O_CREAT`, `O_EXCL`, `O_TRUNC`,
  `O_APPEND`, `O_NONBLOCK`, `O_CLOEXEC`, `O_DIRECTORY`.
- `fcntl` operations: `F_GETFL`, `F_SETFL`, `F_DUPFD`, `F_SETLK` (file locking),
  `F_GETFD`/`F_SETFD` (close-on-exec).

#### `<sys/stat.h>` — File metadata
- `stat`, `fstat`, `lstat`, `struct stat`, `S_ISDIR`, `S_ISREG`, `S_ISLNK`, `mkdir`,
  `mkfifo`.

#### `<sys/types.h>` — POSIX types
- `pid_t`, `uid_t`, `gid_t`, `off_t`, `dev_t`, `ino_t`, `mode_t`, `ssize_t`, `blkcnt_t`.

#### `<sys/wait.h>` — Process wait
- `wait`, `waitpid`, `WIFEXITED`, `WEXITSTATUS`, `WIFSIGNALED`, `WTERMSIG`.

#### `<sys/socket.h>`, `<netinet/in.h>`, `<arpa/inet.h>`, `<netdb.h>` — BSD Sockets
- Originally a Berkeley Sockets API (4.2BSD, 1983, Bill Joy), standardized by POSIX.
- `socket`, `bind`, `listen`, `accept`, `connect`, `send`, `recv`, `sendto`, `recvfrom`,
  `setsockopt`, `getsockopt`, `shutdown`.
- `struct sockaddr`, `struct sockaddr_in`, `struct sockaddr_in6`.
- Name resolution: `getaddrinfo`, `getnameinfo`, `freeaddrinfo`.
- Address conversion: `inet_pton`, `inet_ntop`, `htons`, `htonl`, `ntohs`, `ntohl`.

#### `<pthread.h>` — POSIX Threads
- `pthread_create`, `pthread_join`, `pthread_detach`, `pthread_exit`, `pthread_self`.
- Mutexes: `pthread_mutex_init`, `pthread_mutex_lock`, `pthread_mutex_unlock`.
- Condition variables: `pthread_cond_init`, `pthread_cond_wait`, `pthread_cond_signal`.
- Read-write locks: `pthread_rwlock_*`.
- Thread-specific data: `pthread_key_create`, `pthread_setspecific`.
- Cancellation: `pthread_cancel`, `pthread_testcancel`, `pthread_cleanup_push`.
- Attributes: detached state, stack size, scheduling policy.

#### Other key POSIX headers
- `<dlfcn.h>` — dynamic loading: `dlopen`, `dlsym`, `dlclose`, `dlerror`.
- `<dirent.h>` — directory reading: `opendir`, `readdir`, `closedir`.
- `<sys/mman.h>` — memory mapping: `mmap`, `munmap`, `mprotect`, `msync`, `madvise`,
  `mlock`.
- `<sys/select.h>`, `<poll.h>` — I/O multiplexing: `select`, `poll`. Linux-specific
  extensions: `epoll` (in `<sys/epoll.h>`). BSD: `kqueue`. Windows: IOCP.
- `<sys/ipc.h>`, `<sys/shm.h>`, `<sys/sem.h>`, `<sys/msg.h>` — System V IPC.
- `<mqueue.h>` — POSIX message queues.
- `<semaphore.h>` — POSIX semaphores.
- `<termios.h>` — terminal I/O (baud rates, line discipline).
- `<syslog.h>` — system logging.
- `<glob.h>`, `<fnmatch.h>`, `<regex.h>` — pattern matching and regex.

---

## 4. Systems Programming Use Cases

C is the language of systems. When you need direct hardware access, deterministic memory
layout, minimal runtime, or a stable ABI, you reach for C.

### Operating system kernels
- Linux, FreeBSD, OpenBSD, NetBSD, DragonFly, XNU (Darwin), Windows NT, Solaris,
  AIX, HP-UX, QNX, VxWorks, Haiku (C++), MINIX, Plan 9, seL4 (verified), GNU Hurd,
  illumos.
- Why C: no runtime, direct memory-mapped I/O, predictable assembly output, decades
  of hardware support code.

### Device drivers
- Linux kernel drivers (`drivers/` is ~70% of kernel LOC). Windows drivers
  (KMDF/WDF frameworks are C APIs). macOS drivers via IOKit (C++) with lower-level
  C shims.

### File systems
- ext2/3/4, XFS, Btrfs, F2FS, ZFS (originally Solaris C; OpenZFS is ported), NTFS,
  FAT32/exFAT, APFS, HFS+, ReiserFS, JFS, OCFS2, GlusterFS. All C.

### Network stacks
- Linux's `net/` subsystem, FreeBSD's stack (highly regarded, the basis of many
  commercial appliances), lwIP (embedded), uIP (Adam Dunkels' tiny stack), the
  in-kernel WireGuard implementation.

### Hypervisors
- **KVM** — in-tree Linux hypervisor, written in C.
- **Xen** — dom0/hypervisor split, written in C.
- **bhyve** — FreeBSD hypervisor, C.
- **QEMU** — emulator + hypervisor glue, C.
- **Firecracker** — Rust (the first major exception, AWS, 2018).

### Bootloaders
- **GRUB** — GNU GRand Unified Bootloader, C. Legacy GRUB (0.9x) and GRUB 2.
- **U-Boot** — "Das U-Boot", universal embedded bootloader, C. Runs on nearly every
  ARM SoC, MIPS board, RISC-V dev board.
- **syslinux/isolinux/pxelinux** — H. Peter Anvin, C + assembly.
- **systemd-boot** — sd-boot, C.
- **coreboot** — open firmware replacement for BIOS/UEFI, C.
- **LILO** — the old Linux Loader, retired.
- **BootX / iBoot** — Apple's bootloaders, C.

### Firmware
- **EDK2 (TianoCore)** — Intel's reference UEFI implementation, C. Every modern
  x86 firmware is derived from it.
- **coreboot + SeaBIOS** — libreboot stack.
- **OpenBMC** — Baseboard Management Controller firmware, Linux-based but the
  agent pieces are C.

---

## 5. The Linux Kernel

- **Author:** Linus Torvalds. Initial announcement: August 25, 1991, on comp.os.minix.
  "I'm doing a (free) operating system (just a hobby, won't be big and professional
  like gnu) for 386(486) AT clones."
- **First release:** 0.01 on September 17, 1991. 0.12 was the first useful version.
  1.0 shipped in March 1994.
- **Language:** Entirely in C (and assembly for arch-specific bits). Torvalds famously
  refused C++.
- **Size:** As of 6.x (2024), the source tree is **~35 million lines of code**,
  roughly 80,000 files. The largest codebase in active development on the planet.
- **GCC extensions:** The kernel depends heavily on GCC-specific extensions — variable-length
  arrays in structs (flex arrays), statement expressions `({ ... })`, typeof, inline
  asm with constraints, `__attribute__((section))`, `__attribute__((aligned))`,
  `__builtin_expect`, `__builtin_unreachable`, and dozens more. Clang took years to
  support the needed subset for "LLVM Linux". Today, Clang builds are supported and
  used (notably by Android's GKI kernels).
- **Rust in the kernel:** Merged for Linux 6.1 (December 2022). Miguel Ojeda led the
  effort. Initially very limited — a few drivers, no core subsystems. As of 6.8+ there's
  a real Rust Binder prototype, the Asahi DRM driver for Apple Silicon uses Rust in
  M1 GPU code, and NVMe work. Controversial: longtime maintainers (including filesystem
  maintainer Christoph Hellwig) have pushed back on having two languages in the tree.
- **Memory management:** SLAB allocator (original, complex, Bonwick/Lameter), SLUB
  allocator (Christoph Lameter, replaced SLAB as default in 2.6.23, simpler), SLOB
  (tiny systems, removed in 6.4). The page allocator is the buddy allocator.
- **Scheduler:** CFS (Completely Fair Scheduler), Ingo Molnár, merged 2.6.23 (2007),
  based on Con Kolivas' RSDL ideas. In Linux 6.6 (2023) replaced by **EEVDF** (Earliest
  Eligible Virtual Deadline First), also Ingo, based on 1995 academic work.
- **Namespaces:** The basis of containers. pid, mount, uts, ipc, network, user, cgroup,
  time namespaces. Combined with cgroups (v1 and v2) to produce Docker, LXC, Podman,
  systemd-nspawn.
- **Recent milestones:** io_uring (Jens Axboe, 5.1, 2019) — async I/O done right, fast
  enough to replace epoll for some workloads. eBPF — in-kernel virtual machine, grew out
  of Berkeley Packet Filter, now used for networking (XDP, Cilium), tracing (bpftrace,
  bcc), security (Tetragon, Falco).

---

## 6. BSD Kernels

### FreeBSD
- Descends from 4.4BSD-Lite2 (1995). First release 2.0 in November 1994.
- Pragmatic, performance-focused. Powers Netflix's Open Connect CDN (which serves
  ~15% of global internet traffic at peak). Sony's PlayStation 4 and PS5 are FreeBSD-based.
- jails (since 4.0, 2000) — predecessor to Linux containers. Robert Watson made them
  into a real security boundary.
- ZFS integration, DTrace (ported from Solaris), `pf` firewall (ported from OpenBSD).
- **bhyve** hypervisor.
- **Capsicum** — capability-based sandboxing.

### OpenBSD
- Forked from NetBSD in 1995 by Theo de Raadt after a conflict with NetBSD developers.
- Obsessive security focus. "Proactive security" — audit every line, exploit mitigations
  first.
- **Innovations:**
  - **W^X** (write-XOR-execute) — pages are never simultaneously writable and executable.
    Pioneered in OpenBSD 3.3 (2003).
  - **ASLR** — address space layout randomization, OpenBSD had it before Linux.
  - **Stack canaries** — ProPolice, Etoh's GCC patches, default in OpenBSD.
  - **Random stack gap** — randomized stack base.
  - **pledge(2)** (2015) — program declares what syscalls it will use; later use of
    other syscalls kills the process. A capabilities-lite system.
  - **unveil(2)** (2018) — program declares which paths it can access.
  - **arc4random** — cryptographically strong RNG in libc, used in preference to `rand()`.
  - **strlcpy/strlcat** (Todd Miller, 1998) — safer string copies.
- **Offshoots:** OpenSSH (originally written for OpenBSD, now the world's dominant SSH
  implementation), LibreSSL (forked from OpenSSL after Heartbleed), OpenNTPD, OpenBGPD,
  tmux (originally).

### NetBSD
- Founded 1993. Motto: "Of course it runs NetBSD." Runs on an astonishing number of
  architectures — VAX, HP 9000, m68k, mips, alpha, sh3, vax, even toasters.
- **rump kernel** — anykernel architecture, run kernel subsystems in userspace.

### DragonFly BSD
- Matthew Dillon forked FreeBSD 4.x in 2003 to pursue different SMP scaling strategies.
- **HAMMER2** filesystem.

---

## 7. XNU — macOS and iOS kernel

- **Name:** "X is Not Unix" (contra "Mach"). Open sourced as **Darwin** in 2000 at the
  dawn of Mac OS X.
- **Architecture:** A hybrid kernel combining:
  1. **Mach 3.0 microkernel** (CMU, Rick Rashid, 1985+) — tasks, threads, ports, VM.
  2. **FreeBSD-derived BSD subsystem** — POSIX layer, VFS, networking, signals.
  3. **IOKit** — driver framework, written in **C++** (Embedded C++ subset, no RTTI,
     no exceptions), the main non-C component.
- Apple hired Avie Tevanian (Mach author) and Bertrand Serlet to shepherd it after NeXT
  was acquired in 1996.
- **Darwin open source:** Apple continues to release XNU sources (xnu.git on github.com/
  apple/darwin-xnu) with each macOS release, though practical rebuildability has declined.
- Runs on every Mac, iPhone, iPad, Apple TV, Apple Watch, Vision Pro, and HomePod ever shipped.

---

## 8. Windows NT Kernel

- **Architect:** **Dave Cutler**, recruited from DEC in 1988 by Microsoft (Bill Gates
  wanted VMS-caliber engineering). Cutler had led VMS and the never-shipped DEC "Prism"
  (MICA) project.
- **Initial release:** Windows NT 3.1 in July 1993. The "3.1" matched Windows 3.1
  branding even though it was a completely different OS.
- **Original targets:** MIPS R4000 first (to prove portability), then i386, then Alpha,
  PowerPC, Itanium, x64, ARM, ARM64. Alpha was Cutler's favorite.
- **Language:** Mostly C (the kernel is almost entirely C), with some C++ in userland
  subsystems.
- **Architecture:**
  - **HAL** — Hardware Abstraction Layer, the bottom.
  - **NTOSKRNL.EXE** — executive and kernel (kernel-mode components).
  - **Win32 subsystem** (csrss.exe + win32k.sys), OS/2 subsystem (removed), POSIX
    subsystem (removed, replaced by WSL, then WSL2).
  - **Object Manager** — everything is a named object (files, processes, events, etc.).
  - **I/O Manager** — driver stack with IRPs.
- **Reference:** **Mark Russinovich** (now Azure CTO), along with David Solomon and
  Alex Ionescu, wrote the authoritative *Windows Internals* book series (8th edition
  covers Windows 10/11).
- **NTFS** is the native filesystem, also designed by Tom Miller/Gary Kimura.
- Windows 11 kernel is still fundamentally Cutler's NT, 30+ years later.

---

## 9. Embedded and Firmware

C is the undisputed king of embedded systems.

### Microcontroller families
- **AVR** (8-bit) — Atmel, now Microchip. ATmega328P powers the Arduino Uno. `avr-gcc`,
  `avr-libc`.
- **ARM Cortex-M** (32-bit) — dominant modern microcontroller ISA. Cortex-M0/M0+ (low
  end), M3/M4 (midrange, optional FPU), M7 (high performance), M23/M33 (TrustZone),
  M55/M85 (Helium MVE for ML).
- **STM32** — STMicroelectronics' huge Cortex-M product line. HAL, LL, CubeMX toolchain.
- **ESP32** — Espressif's Wi-Fi/BT SoC built around Xtensa (ESP32) or RISC-V (ESP32-C3,
  C6, H2). ESP-IDF framework is C, based on FreeRTOS.
- **RP2040** — Raspberry Pi Pico, dual Cortex-M0+, 2021. C SDK plus MicroPython.
- **PIC** — Microchip's long-running 8/16/32-bit line. XC8/XC16/XC32 compilers.
- **MSP430** — TI's ultra-low-power 16-bit MCU.
- **Nordic nRF52/nRF53** — Bluetooth Low Energy focus, Cortex-M.

### RTOS (Real-Time Operating Systems)
- **FreeRTOS** — Richard Barry, 2003. Acquired by Amazon, now AWS-maintained.
  Permissively licensed (MIT since 2017). Runs on 40+ MCU architectures. The
  dominant open-source RTOS.
- **Zephyr** — Linux Foundation project, 2016. Apache 2.0. Backed by Intel (originally
  Wind River's Rocket OS), NXP, Nordic. Modular, Kconfig-based, devicetree-driven.
- **VxWorks** — Wind River, proprietary. Runs the Mars rovers (Curiosity, Perseverance,
  Ingenuity helicopter), many military and aerospace systems, the Boeing 787's
  non-flight-critical systems. Hard real-time.
- **QNX** — BlackBerry (acquired 2010). Microkernel, POSIX. Dominant in automotive
  infotainment (Audi, BMW). The Therac-25, early routers, the Amazon Kindle used
  QNX-descendant code.
- **RTEMS** — Real-Time Executive for Multiprocessor Systems. NASA and ESA use it
  extensively (James Webb Space Telescope uses VxWorks, but many ESA probes use RTEMS).
- **ThreadX** — Express Logic, acquired by Microsoft (Azure RTOS). Now open source.
- **Mbed OS** — ARM's RTOS, sunsetting.
- **NuttX** — POSIX-like RTOS, used in PX4 autopilot (open-source drone flight controller).
- **ChibiOS**, **RIOT**, **Contiki**, **TinyOS**.

### Bare metal
- Many tiny devices have no OS at all. `main()` runs in a super-loop or is driven by
  interrupt handlers. Linker scripts define memory regions (flash, SRAM). Startup code
  (`crt0.S`) zeroes BSS, copies initialized data from flash to RAM, then calls `main`.
- CMSIS (Cortex Microcontroller Software Interface Standard) — ARM's standard headers
  for Cortex-M.

---

## 10. Databases Written in C

### SQLite
- **Author:** **D. Richard Hipp**, first release August 17, 2000.
- **License:** **Public domain** (literally — not BSD, not MIT; Hipp formally dedicates
  it to the public domain).
- **Deployment:** The most-deployed database engine in the world, by orders of magnitude.
  On every iPhone, every Android phone, every macOS install, every Windows 10+, every
  Linux desktop, in Firefox, Chrome, Skype, iTunes, Dropbox client, PHP, Python's
  `sqlite3` module, essentially every airplane in the sky (Airbus A350 uses SQLite),
  inside many automobiles. Estimated **trillions of databases in active use**.
- **Size:** About 150,000 lines of C. The "amalgamation" distribution is a single
  `sqlite3.c` file ~8 MB in size that you drop into your project.
- **Testing:** Legendary test suite. 100% MC/DC coverage. **More test code than production
  code by a factor of ~600:1** (roughly 92 million lines of test code). Hipp's testing
  approach is documented in "How SQLite Is Tested" — one of the most respected QA
  documents in software.
- **Design:** Single-writer at a time, serverless, zero-config, cross-platform file format
  (the SQLite database file format is a committed long-term archival format recommended
  by the US Library of Congress).
- **Fossil SCM** — Hipp also wrote a version control system (Fossil) that hosts SQLite's
  development instead of git.

### Redis
- **Author:** **Salvatore Sanfilippo** ("antirez"), first release **April 2009**.
- **License:** Formerly BSD, then switched to a dual SSPL/RSAL in March 2024 after
  Redis Inc.'s commercial concerns. This triggered the **Valkey** fork, backed by the
  Linux Foundation, AWS, Google, Oracle, and others. Valkey 8.0 shipped September 2024.
- **Language:** C (about 100K lines, famously readable).
- **Notable:** In-memory data structure server. Not just a key/value store — strings,
  hashes, lists, sets, sorted sets, streams, bitmaps, hyperloglogs, geospatial indexes.
  Single-threaded main loop (event loop via `epoll`/`kqueue`/`select`), with I/O
  threading added in 6.0.
- antirez left Redis Labs in 2020 to return to creative work. He wrote
  `disque`, `kilo` (a small text editor in 1000 lines of C), and various other C tools.

### PostgreSQL
- **Origin:** Michael Stonebraker's **POSTGRES** project at UC Berkeley (1986–1994).
  POSTGRES95 → PostgreSQL in 1996.
- **Language:** C. ~1.4M lines.
- **Philosophy:** Standards compliance, extensibility, correctness. Features: MVCC,
  complex types (arrays, ranges, JSON, JSONB, hstore), extensions (**PostGIS** for
  geospatial, **pgvector** for ML embeddings, **TimescaleDB** for time series,
  **Citus** for distribution).
- Used by Instagram, Reddit, Apple, Twitch, and many others. Many cloud database
  services (Aurora PostgreSQL, Azure Postgres, Neon, Supabase) wrap it.

### MySQL / MariaDB
- **Origin:** **Michael "Monty" Widenius**, TcX DataKonsult AB, Finland/Sweden, 1995.
- **Language:** C (much of the core) with **C++** increasingly. The InnoDB storage engine
  is C++.
- **Storage engines:** MyISAM (original, no transactions), InnoDB (Heikki Tuuri, 2001,
  transactional, now default), Aria, MEMORY, CSV, Archive.
- **MariaDB:** Monty forked MySQL in 2009 after Sun (then Oracle) acquired it. Named
  after his younger daughter Maria (MySQL was named after his older daughter My).
- **Used by:** Facebook (which maintains its own MySQL fork), Wikipedia (MariaDB),
  GitHub, Twitter, YouTube.

### Berkeley DB
- **Origin:** Margo Seltzer and Keith Bostic at UC Berkeley. First version 1991. Sleepycat
  Software took it commercial in 1996. Oracle acquired Sleepycat in 2006.
- **Language:** C. Embedded key-value store.
- **License issues:** Oracle relicensed it to AGPL in 2013, causing many projects to
  migrate away (notably Debian dropped it from essential packages).
- **Used historically by:** OpenLDAP, Subversion, Bogofilter, many email clients,
  postfix, Sendmail.

### Other notable C databases
- **LMDB** (Howard Chu, OpenLDAP project) — tiny, fast, mmap-based, copy-on-write B+tree.
- **LevelDB** (Google, Jeff Dean / Sanjay Ghemawat, 2011) — actually C++, but the
  design language of modern LSM-tree engines.
- **RocksDB** (Facebook, fork of LevelDB) — also C++, but commonly linked to from C.
- **TDB** — trivial database, Samba project.
- **GDBM** — GNU dbm.
- **Unqlite**, **Tokyo Cabinet**, **Kyoto Cabinet**.

---

## 11. Web Servers in C

### nginx
- **Author:** **Igor Sysoev**, first public release **October 4, 2004**. Written to
  solve the C10K problem for Rambler (a Russian search engine).
- **Language:** C, ~180K lines.
- **Design:** Event-driven, asynchronous, non-blocking master/worker architecture.
  Each worker handles thousands of concurrent connections on a single thread via
  `epoll`/`kqueue`.
- **Market share:** As of 2024, nginx serves around 30% of active websites (per Netcraft),
  roughly tied with Apache for the top spot, and is the dominant high-traffic server.
- **Nginx Inc.** acquired by F5 Networks in 2019 for $670M. **Freenginx** fork was
  started by Maxim Dounin in 2024 after disagreements with F5 over security policy.
- **Modules:** rewrite, http2, http3/QUIC (added 2022), mail, stream (TCP/UDP proxying).

### Apache HTTP Server (httpd)
- **Origin:** NCSA HTTPd was the original webserver (Rob McCool, 1993, UIUC). After
  McCool left NCSA, a group of webmasters started collecting "a patchy" set of patches
  — leading to the name **Apache**. First Apache 0.6.2 in April 1995.
- **Language:** C, using the **APR** (Apache Portable Runtime) abstraction layer.
- **MPMs** (multi-processing modules): prefork (one process per connection, classic),
  worker (threaded), event (modern, event-driven).
- **Modules:** mod_php, mod_ssl, mod_rewrite, mod_proxy, mod_security.
- Dominated the web from the late 1990s through the mid-2010s. Netcraft reported
  Apache had >60% market share at its peak around 2008.

### lighttpd
- **Author:** Jan Kneschke, 2003. Small, fast, fastcgi-focused. Licensed BSD.
- Gained popularity for FastCGI + PHP deployments, then was overtaken by nginx.
- Powered YouTube's original static asset delivery.

### OpenResty
- **Author:** Yichun Zhang (agentzh), 2011.
- **What it is:** nginx + LuaJIT + a large set of Lua libraries. Effectively turns
  nginx into a full programmable application server. Used heavily in API gateways
  (Kong is built on OpenResty), Cloudflare's edge, and high-traffic sites.

### Other C web servers
- **Caddy** — Go (2015), not C.
- **H2O** — C, Kazuho Oku (2014), HTTP/2 focused, used by Fastly for a while.
- **Hiawatha** — C, focused on security.
- **thttpd** — tiny, Jef Poskanzer.
- **boa**, **micro_httpd**.

---

## 12. Language Runtimes Written in C

C is the default implementation language for "reference" interpreters of dynamic
languages. This is not a coincidence — C gives you a stable ABI (crucial for FFI),
decent performance, and portability.

### CPython
- **The reference implementation of Python.** Started by Guido van Rossum in
  December 1989.
- **Language:** C. ~600K lines in CPython itself (plus the standard library, which
  is mostly Python).
- **Architecture:** Stack-based bytecode VM. Bytecode is executed by `_PyEval_EvalFrameDefault`
  in `Python/ceval.c` — the "main interpreter loop", famous for its gigantic switch
  statement (now a computed-goto dispatch in optimized builds).
- **GIL** — Global Interpreter Lock. Single-threaded execution of Python bytecode.
  PEP 703 (Sam Gross, Meta) landed experimental no-GIL support in Python 3.13 (2024).
- **Memory:** Reference counting + generational garbage collector.
- **C extension API:** `Python.h` lets you write C extensions that call back into
  the interpreter. NumPy, SciPy, lxml, cryptography, pytorch all use it. The stability
  of this API is a major reason CPython remains dominant over PyPy, Jython, IronPython.
- **Versions:** 2.7 (end of life 2020), 3.0 (2008, incompatible break), 3.11 (big
  perf work by Faster CPython team, ~25% faster), 3.12, 3.13 (JIT work started).

### Ruby MRI (Matz's Ruby Interpreter) / CRuby
- **Author:** **Yukihiro "Matz" Matsumoto**, started late 1993, first public release
  1995.
- **Language:** C. Ruby 1.9 (2007) switched to **YARV** (Yet Another Ruby VM) by Koichi
  Sasada — a bytecode-based VM replacing the original AST walker.
- **MJIT** (method JIT, 2018), **YJIT** (Shopify's LLVM-free JIT, Rust-based since 2022),
  **RJIT** (experimental).
- **GVL** — Giant VM Lock, Ruby's equivalent of the GIL.

### PHP / Zend Engine
- **Origin:** **Rasmus Lerdorf**'s Personal Home Page tools, 1995. Rewritten for PHP 3
  (1998) by Zeev Suraski and Andi Gutmans, who created the **Zend Engine** for PHP 4
  (2000). "Zend" is a portmanteau of Zeev + Andi.
- **Language:** C.
- **Architecture:** Compile to Zend opcodes, execute in VM. **OPcache** was the game
  changer (merged into PHP 5.5, 2013). PHP 7 (2015) brought huge performance gains
  via a rewrite of the VM's internal data structures. PHP 8 (2020) added JIT.
- Powers most of the web's legacy CMS infrastructure — WordPress (~40% of all websites),
  Drupal, Joomla, Magento, phpBB.

### Perl
- **Author:** **Larry Wall**, 1987. Perl 5 (1994) is the de-facto Perl.
- **Language:** C. "Perl is the C of scripting languages".
- **Raku** (formerly Perl 6, renamed 2019) is a separate language with its own
  implementations (Rakudo on MoarVM).

### Lua
- **Origin:** PUC-Rio, Brazil, 1993, by Roberto Ierusalimschy, Luiz Henrique de Figueiredo,
  and Waldemar Celes.
- **Language:** C, ~20K lines. Famously compact and embeddable.
- **License:** MIT.
- **Used in:** World of Warcraft, Roblox (where Lua is ascendant — Luau is Roblox's
  typed fork), nmap, Wireshark, Adobe Lightroom, Redis (as a scripting language),
  many game engines (Love2D), OpenResty/nginx, neovim.
- **LuaJIT** — Mike Pall's tracing JIT, an extraordinary feat of single-person
  engineering. Often cited as one of the fastest dynamic-language implementations ever.

### Tcl
- **Author:** **John Ousterhout**, 1988, UC Berkeley. "Tool Command Language".
- **Language:** C.
- **Known for:** Tk toolkit (the GUI library behind Python's `tkinter`), command-line
  embedding, the "Tcl world tour" of the 1990s. Expect. Used in EDA (electronic design
  automation — Synopsys, Cadence tools scripted with Tcl).

### R
- **Origin:** Ross Ihaka and Robert Gentleman, University of Auckland, 1993. Based on
  the earlier S language (Bell Labs).
- **Language:** C for the core, some Fortran for numerical routines, R itself for
  higher-level bits. GNU project.
- Dominant in statistics and academic data analysis.

### OCaml
- **Authors:** Xavier Leroy and the INRIA team, first release as Caml Light 1990s,
  OCaml around 1996.
- **Runtime:** Written in C. Bytecode interpreter + native code compiler (`ocamlopt`).
  GC is a generational incremental collector.
- **Used by:** Facebook (Flow, Hack, Infer), Jane Street (heavily), the original Rust
  compiler (before self-hosting), Coq proof assistant.

### Erlang BEAM
- **Origin:** Joe Armstrong, Robert Virding, Mike Williams at Ericsson, late 1980s/1990s.
  For telecoms switches — the AXD301 ATM switch famously hit nine 9's of uptime.
- **Runtime:** **BEAM** (Bogdan/Björn's Erlang Abstract Machine), written in C.
  Preemptive scheduling of millions of lightweight processes. Let-it-crash philosophy,
  supervisor trees, OTP.
- **Elixir** (José Valim, 2011) runs on BEAM and shares the runtime.
- **Used by:** WhatsApp (2 engineers supporting 450M users pre-acquisition), Discord's
  real-time messaging, RabbitMQ, CouchDB, Riak, Phoenix/LiveView.

### V8 (JavaScript)
- **Author:** Lars Bak's team at Google (Århus, Denmark), shipped with Chrome September 2008.
- **Language:** **C++**, not C. But it has a C-compatible embedding API, and Node.js
  uses it.
- **JIT tiers:** Ignition (bytecode interpreter) → Sparkplug (baseline JIT) → Maglev
  (midtier) → TurboFan (optimizing).

### Node.js
- **Creator:** **Ryan Dahl**, 2009. Presented at JSConf EU, famously with a demo
  of a chat server.
- **Composition:** **V8** (C++) + **libuv** (C, the event loop — `epoll`/`kqueue`/IOCP
  abstraction, also originally for Node but now used by many projects) + Node-specific
  C++ glue + a JavaScript standard library.
- **libuv** is a standalone C library widely used outside Node (Julia, Luvit, pyuv, MoarVM).

### Other runtimes with C components
- **Go** — self-hosted since 1.5, but the original compiler (`6g`/`8g`) was C. The
  runtime still has some C for cgo.
- **Julia** — LLVM-based, but the runtime and GC are C/C++.
- **Guile** (GNU Scheme) — C.
- **Chicken Scheme** — compiles to C.
- **MIT/GNU Scheme, Racket (formerly PLT Scheme)** — C runtimes.
- **JavaScriptCore** (Apple) — C++, C embedding API.
- **SpiderMonkey** (Mozilla) — C++, C embedding API.
- **QuickJS** — **Fabrice Bellard**'s tiny JavaScript engine in pure C, 2019. ES2020
  compliant, ~200 KB.
- **MicroPython** (Damien George, 2013) — C, targets microcontrollers.
- **CircuitPython** (Adafruit fork of MicroPython) — C.

---

## 13. Video and Codec Libraries

### FFmpeg
- **Author:** **Fabrice Bellard** (prolific — also QEMU, TinyCC, QuickJS, pi digit
  records). First release December 2000.
- **Language:** C.
- **Components:**
  - **libavcodec** — the codec library. Encoders and decoders for hundreds of formats:
    H.264, H.265/HEVC, VP8, VP9, AV1, MPEG-2, MPEG-4, MJPEG, FLAC, AAC, MP3, Opus,
    Vorbis, and dozens more.
  - **libavformat** — container muxing/demuxing (MP4, MKV, AVI, MPEG-TS, WebM, etc.).
  - **libavfilter** — filters (scaling, cropping, color correction, overlay, concatenation).
  - **libavutil** — shared utility code.
  - **libswscale** — pixel format and scaling.
  - **libswresample** — audio resampling.
- **License:** LGPL 2.1 by default, GPL if certain components are enabled.
- **Fork:** **libav** was a contentious fork (2011–2018) led by Måns Rullgård and others;
  it eventually died, and FFmpeg absorbed most of its changes.
- **Ubiquitous.** Used by VLC, Chrome/Firefox (for some decode paths), Kodi, YouTube,
  Netflix, Twitch, OBS Studio, Blender, MPV, Handbrake, and most commercial video tools.
  "If it decodes video, it probably links libavcodec."

### libx264
- VideoLAN project. x264 is the best open H.264 encoder, often matching or beating
  commercial implementations. GPL. Ships with FFmpeg.

### x265, libvpx, libaom, dav1d, rav1e
- **x265** — HEVC encoder, MulticoreWare.
- **libvpx** — Google's VP8/VP9 encoder/decoder.
- **libaom** — AOMedia's reference AV1 codec (slow).
- **dav1d** — VideoLAN's fast AV1 decoder (C + assembly), the standard fast AV1 decoder.
- **rav1e** — Mozilla's Rust AV1 encoder (notable exception to the "all in C" rule).
- **SVT-AV1** — Intel/Netflix AV1, C.

### Image codecs
- **libpng** — reference PNG library, 1995. Greg Roelofs. C.
- **libjpeg** — Independent JPEG Group (IJG), Tom Lane et al. 1991.
- **libjpeg-turbo** — SIMD-accelerated fork, now the dominant JPEG library. C +
  assembly.
- **libwebp** — Google's WebP encoder/decoder, C.
- **libavif** — AV1 Image File Format.
- **libjxl** — JPEG XL reference implementation (C++).
- **libtiff** — TIFF, classic C library.
- **libgif / giflib** — GIF.
- **libheif** — HEIF/HEIC wrapper.

### Audio codecs
- **libFLAC** — lossless audio, Xiph.org. C.
- **libvorbis**, **libopus**, **libspeex** — Xiph.org, C.
- **LAME** — MP3 encoder, C.

### Compression
- **zlib** — Jean-loup Gailly and Mark Adler, 1995. The DEFLATE library. Powers gzip,
  PNG, ZIP, zlib format. Probably the most widely deployed library on Earth after libc
  itself — in every browser, every OS kernel, every network stack. ~3K lines. License
  is a permissive custom one ("zlib license").
- **zlib-ng** — modern fork with SIMD and performance improvements.
- **Cloudflare zlib** — Vlad Krasnov's optimized fork.
- **zstd** — **Zstandard**, Yann Collet (also LZ4), Facebook, 2016. C. Now in the Linux
  kernel. Better than zlib at every point on the speed/ratio curve.
- **LZ4** — Yann Collet, extremely fast compression.
- **xz / LZMA** — Igor Pavlov's LZMA algorithm, the xz library. C. (The xz-utils backdoor
  incident in March 2024 — CVE-2024-3094, Jia Tan — was a major supply chain attack.)
- **Brotli** — Google, 2015. C. The HTTP encoding for Chrome/Firefox.

---

## 14. Cryptography Libraries

### OpenSSL
- **Origin:** Forked from **SSLeay** (Eric A. Young and Tim J. Hudson, 1995) in 1998.
- **Language:** C, ~500K lines.
- **Coverage:** TLS/SSL protocol, X.509, RSA, ECC, AES, SHA, HMAC, PKCS standards,
  command-line tool, FIPS 140-2/140-3 validation.
- **History of pain:**
  - **Heartbleed** (April 2014, CVE-2014-0160) — missing bounds check in TLS heartbeat
    extension read allowed remote disclosure of 64 KB of server memory per request.
    Catastrophic. Triggered the creation of LibreSSL and BoringSSL, and the OpenSSL
    Software Foundation's formation with Linux Foundation backing.
  - **DROWN**, **POODLE**, **FREAK**, **LOGJAM** — protocol and implementation
    vulnerabilities over the years.
- **License:** "OpenSSL license" (Apache 1.0-like, until 3.0) + SSLeay license (dual).
  OpenSSL 3.0 (Sept 2021) relicensed to Apache 2.0.
- **Versions:** 1.0.2 (LTS, EOL 2019), 1.1.0, 1.1.1 (TLS 1.3), 3.0 (LTS, 2021), 3.1,
  3.2, 3.3.

### LibreSSL
- **Origin:** **OpenBSD project fork** of OpenSSL, announced April 2014 by Theo de Raadt
  immediately after Heartbleed. Led by Bob Beck, Miod Vallat, and others.
- **Philosophy:** Remove dead code, remove weird platform support, remove legacy
  ciphers. In the first weeks, they deleted ~90K lines of OpenSSL.
- **Used by:** OpenBSD base, macOS since ~10.11 (partially), LibreSSL portable build
  used by various Linux distros.
- **License:** ISC/BSD.

### BoringSSL
- **Origin:** Google's OpenSSL fork, announced June 2014 (two months after Heartbleed).
- **Philosophy:** "We don't recommend that third parties depend upon it." BoringSSL
  is Google's internal TLS library, optimized for Chrome, Android, and Google's servers.
  No stable API. No releases.
- **Features:** Often first to ship new protocols (TLS 1.3 drafts, QUIC, Kyber for
  post-quantum).
- **Used by:** Chromium, Android system TLS, Cronet, gRPC.

### mbedTLS
- **Origin:** Formerly PolarSSL (Paul Bakker, 2006), acquired by ARM in 2014 and renamed
  mbed TLS. Now a Trusted Firmware project.
- **Language:** C. ~60K lines (much smaller than OpenSSL).
- **Target:** Embedded systems. Modular, low memory footprint.
- **License:** Apache 2.0.
- **Used by:** Embedded devices, IoT, Hyperledger Besu, many ARM Cortex-M projects.

### wolfSSL (formerly CyaSSL)
- **Origin:** wolfSSL Inc. (founded 2004 in Bozeman, Montana).
- **Language:** C.
- **Target:** Embedded, IoT, FIPS certification. Drop-in OpenSSL API compatibility layer.
- **License:** Dual GPLv2 and commercial.

### libsodium
- **Origin:** Frank Denis, 2013. A portable fork of **NaCl** (Networking and Cryptography
  Library by Daniel J. Bernstein, Tanja Lange, Peter Schwabe).
- **Philosophy:** High-level, misuse-resistant API. You don't choose primitives — the
  library picks good ones. "crypto_box", "crypto_secretbox", "crypto_sign".
- **Primitives:** Curve25519, Ed25519, XChaCha20-Poly1305, BLAKE2, Argon2.
- **License:** ISC.
- **Used by:** Matrix/Element, Signal bridges, WireGuard-adjacent tooling, many modern
  apps. The reference for "modern crypto done right".

### Other crypto libraries
- **GnuTLS** — GNU project's TLS library, LGPL. Used by Debian and some GNU projects
  to avoid the OpenSSL license quirk pre-3.0.
- **NSS** — Mozilla's **Network Security Services**, used by Firefox and Thunderbird.
  C. Long history.
- **BearSSL** — Thomas Pornin, minimalist TLS 1.2 library in C.
- **s2n-tls** — Amazon's small TLS implementation, C, Apache 2.0.
- **libgcrypt** — GnuPG's crypto library, LGPL.
- **libtomcrypt** — Tom St Denis, public domain, modular.
- **crypto++** — C++ library, notable exception.
- **ring** — Rust (fork of BoringSSL's crypto), exception.

---

## 15. Game Engines and Graphics

### id Tech engines
- **id Software**, founded by John Carmack, John Romero, Adrian Carmack, Tom Hall (1991).
- **Wolfenstein 3D** (1992) — raycasting engine, C.
- **Doom** (1993) — C. The Doom source code was released in 1997 under GPL and has
  been ported to an incredible number of platforms.
- **Quake** (1996) — C + assembly. First full 3D engine with BSP rendering and hardware
  acceleration (GLQuake).
- **Quake II** (1997), **Quake III Arena** (1999) — all C. Quake III's source release
  (2005) is still studied.
- **id Tech 4** (Doom 3, 2004) — **C++**, the shift point.
- Carmack himself wrote much of the renderer and physics code. His `.plan` files
  and the Doom/Quake source releases are canonical learning material.

### Unreal Engine (original)
- Tim Sweeney, 1998. Written in C++ with significant C-style discipline and a custom
  scripting language (UnrealScript).
- Modern Unreal (4, 5) is heavily C++.

### Graphics and window APIs (all C)
- **OpenGL** — SGI, 1992. C API. Derived from IRIS GL.
- **Vulkan** — Khronos, 2016. C API. Deliberately low-level explicit API.
- **Direct3D** (Windows) — COM-based, C-compatible API, though usually called from C++.
- **Metal** (Apple) — Objective-C/Swift primarily, but has a C API.
- **GLFW** — Camilla Löwy (elmindreda) and others. Window/input/context creation
  library. C.
- **GLEW** — OpenGL Extension Wrangler. C.
- **SDL** (Simple DirectMedia Layer) — **Sam Lantinga**, originally for Loki Software
  to port Linux games. SDL 1.2 (2001), SDL 2.0 (2013), **SDL 3.0** (2024). C. The
  foundation of thousands of indie games and emulators (RetroArch).
- **SFML** — C++, not C.
- **Allegro** — originally Shawn Hargreaves, Atari ST/DOS era, still maintained. C.
- **raylib** — Ramon Santamaria, 2013. Minimalist, beginner-friendly C game library.
  Very popular for learning graphics programming.

### ImGui (note)
- **Omar Cornut**'s Dear ImGui is **C++**, not C. But it has C bindings (cimgui).
  Ubiquitous for developer tools.

---

## 16. The C ABI as Universal Glue

The C **Application Binary Interface** — the set of rules for how functions are called,
how arguments are passed, how structs are laid out, how names are mangled (or not) —
is the lingua franca of inter-language interop. This is the single most important
reason C remains central to software despite 50+ years of competing languages.

### Why the C ABI won
- It's **simple**: defined by the platform (System V AMD64 ABI on Linux/BSD/macOS,
  Microsoft x64 on Windows, AAPCS on ARM).
- It has **no name mangling**: a function `foo` is exported as the symbol `foo`.
  Compare C++ which mangles names, making cross-compiler linking hard.
- Structs have **predictable layout** (with some padding rules).
- It's the ABI the operating system itself uses — every syscall wrapper, every
  loaded shared library, every dynamic linker expects C calling conventions.

### Every language's FFI speaks C
- **Python ctypes** — `import ctypes; libc = ctypes.CDLL("libc.so.6")`. Load any `.so`,
  call its functions. `cffi` is a cleaner alternative (Armin Rigo). CPython's C API
  for extensions is the heavy-duty path (NumPy, Pillow).
- **Ruby FFI** — `require 'ffi'`, attach functions to modules. Used by many gems.
- **Node.js** — **Node-API** (formerly N-API) is the ABI-stable interface for native
  addons. The older `nan` and raw V8 APIs are being replaced. FFI-napi for dynamic.
- **Rust** — `extern "C" fn` declarations and `#[repr(C)]` structs. Cargo's `-sys`
  crates are the standard pattern for wrapping a C library. `bindgen` auto-generates
  bindings from C headers. `cbindgen` goes the other way (generate C headers from Rust).
- **Go** — `import "C"` with a comment preamble enables **cgo**. Every cgo call has
  overhead (goroutine scheduling), but it works. Notably used for SQLite, OpenSSL,
  CUDA bindings.
- **Zig** — `@cImport` directly parses C headers and makes them available in Zig.
  Zig can also be used as a C cross-compiler. Andrew Kelley designed Zig to interop
  effortlessly with C.
- **Nim** — compiles to C/C++, can directly import C functions.
- **Swift** — `@_cdecl`, bridging headers for Objective-C/C.
- **Kotlin/Native** — cinterop tool generates bindings.
- **Haskell** — Foreign Function Interface (FFI) part of the standard, `foreign import
  ccall`.
- **OCaml** — `CAMLprim value` externs + the `ctypes` library.
- **Lua** — `luaopen_*` C API, plus LuaJIT's **ffi** module (Mike Pall) which is
  stunningly fast: `ffi.cdef[[int printf(const char *fmt, ...);]]`.
- **Julia** — `ccall((:function, "libc"), ...)`, zero overhead, directly emits the
  call from LLVM IR.
- **Common Lisp** — CFFI, SBCL's alien interface.
- **D** — `extern(C)`, direct C interop.
- **C#** — P/Invoke: `[DllImport("libfoo.so")]`. LibraryImport source generator in
  modern .NET.
- **Java** — JNI (Java Native Interface), historically painful; **Project Panama**
  (Java 22, 2024) introduced the Foreign Function & Memory API, a clean native-call
  pathway.

### C as "the Esperanto of programming languages"
Every language has to pick a "foreign" language to interoperate with. Almost universally,
that language is C. When a new language like Rust or Go or Zig is designed, job #1 for
the FFI team is **"can we call libc?"** — because if you can call libc, you can call
everything else, because every operating system, every legacy library, every hardware
driver, every performance-critical numerical routine is eventually exposed through a
C entry point.

This is the deep reason C will not die. Even if no new systems code were written in C
tomorrow, the **installed base** — every OS syscall interface, every shared library
ABI, every hardware vendor's driver SDK — is a C-shaped contract. A language that can't
call C is a language that can't participate in the real world.

It also means that C's flaws (undefined behavior, integer promotion rules, null terminators,
unsafe strings) are effectively frozen into the substrate of computing. Rust, Zig,
Carbon, and others are trying to offer a "better C for new code" while preserving the
ABI relationship — they compile to the same calling conventions, the same memory layouts,
the same object files, the same symbol names. You cannot escape C. You can only decide
what language you write your *side* of the C ABI boundary in.

---

## Closing notes

- **Every operating system you use** has a C kernel or a kernel with substantial C
  history (XNU, NT, Linux, BSD, Darwin, QNX, VxWorks, RTEMS, FreeRTOS, Zephyr).
- **Every database you rely on** either is written in C or descends from one that was
  (SQLite, Postgres, MySQL/MariaDB, Redis/Valkey, BerkeleyDB).
- **Every web browser** ships a C (or C++-with-C-bridges) stack: zlib, libpng, libjpeg,
  BoringSSL or NSS, SQLite, libvpx/dav1d, ICU, libxml2, HarfBuzz.
- **Every dynamic language you use** has a C runtime (CPython, Ruby MRI, PHP, Perl,
  Lua, R, Tcl, BEAM, Node.js's libuv).
- **Every language's FFI** speaks C.

C is the universal substrate. It is imperfect, dangerous, ancient, and irreplaceable.
Understanding it — really understanding it, down to how `printf` walks a va_list, how
`malloc` arenas fragment, how `errno` is thread-local, how `fork` interacts with
`pthread_mutex`, how the System V AMD64 calling convention packs arguments — is
understanding the shape of modern computing.

— Research compiled April 8, 2026.

---

## Study Guide — C Standard Library & Systems Programming

### Key concepts

1. **libc has layers.** `<string.h>`, `<stdio.h>`,
   `<stdlib.h>`, `<math.h>` are ISO C. POSIX adds `<unistd.h>`,
   `<sys/*>`, `<pthread.h>`. Linux adds more.
2. **System calls are not function calls.** They trap into
   kernel mode via `syscall` / `svc` / `ecall`. libc wraps
   them.
3. **`errno` is thread-local** on modern systems. Older
   libraries assumed it wasn't; that was a portability and
   threading disaster.
4. **`fork` and threads don't mix well.** After `fork`, only
   async-signal-safe functions may be called in the child
   until `exec`.

---

## Programming Examples

### Example 1 — A file-copy with read/write

```c
#include <fcntl.h>
#include <unistd.h>
#include <stdio.h>

int main(int argc, char **argv) {
    if (argc != 3) return fprintf(stderr, "usage: cp SRC DST\n"), 1;
    int in = open(argv[1], O_RDONLY);
    int out = open(argv[2], O_WRONLY | O_CREAT | O_TRUNC, 0644);
    if (in < 0 || out < 0) return perror("open"), 1;
    char buf[8192];
    ssize_t n;
    while ((n = read(in, buf, sizeof buf)) > 0)
        write(out, buf, n);
    close(in); close(out);
    return 0;
}
```

This is what every `cp` implementation in the world looks
like, minus error recovery and sendfile optimizations.

### Example 2 — A minimal thread

```c
#include <pthread.h>
#include <stdio.h>

void *worker(void *arg) {
    printf("hello from thread %d\n", *(int*)arg);
    return NULL;
}

int main(void) {
    pthread_t t;
    int n = 42;
    pthread_create(&t, NULL, worker, &n);
    pthread_join(t, NULL);
}
```

Link with `-pthread`.

---

## DIY & TRY

### DIY 1 — Write your own malloc

Implement a simple first-fit allocator with `mmap` for large
blocks and a free list for small blocks. It will be slow and
wasteful compared to glibc malloc, but you will understand
why glibc malloc is so complicated.

### DIY 2 — Trace a syscall

`strace ls /` shows every syscall `ls` makes. Read the
output. Count the `openat`, `read`, `stat` calls. Now run
`ls -la /` and compare.

### DIY 3 — Read musl libc

Musl is a cleaner alternative libc than glibc. Its `printf`
implementation is readable in one sitting. Read it. You will
understand how `%d` and friends work at the byte level.

### TRY — Implement one system command

Pick `cat`, `echo`, or `true`. Implement it in C using only
syscalls (no `printf`, no `fopen`). 30 lines. You will
produce the same program the Unix team wrote in 1971.

---

## Related College Departments (C stdlib)

- [**coding**](../../../.college/departments/coding/DEPARTMENT.md)
- [**engineering**](../../../.college/departments/engineering/DEPARTMENT.md)
