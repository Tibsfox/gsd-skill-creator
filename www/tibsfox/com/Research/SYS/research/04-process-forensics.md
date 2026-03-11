# Process Forensics

> **Module:** SRV-PROC
> **Domain:** Observability
> **Through-line:** *The system is always talking.* CPU load, memory pressure, disk throughput, network I/O — these are vital signs. The sysadmin who reads them is a diagnostician, not a parts-replacer. High CPU does not mean "the CPU is bad." It means something is using it. Follow the chain: which process, which function, which input, which request. The answer is always in the details.

---

## Table of Contents

1. [Watching the System Breathe](#1-watching-the-system-breathe)
2. [Memory — The Finite Resource](#2-memory--the-finite-resource)
3. [CPU — Time, Sliced and Shared](#3-cpu--time-sliced-and-shared)
4. [Disk I/O — The Slowest Link](#4-disk-io--the-slowest-link)
5. [Network I/O — The Conversations](#5-network-io--the-conversations)
6. [Misbehaving Processes](#6-misbehaving-processes)
7. [Resource Limits — Containment](#7-resource-limits--containment)
8. [The Diagnostic Mindset](#8-the-diagnostic-mindset)
9. [Automation and Alerting](#9-automation-and-alerting)
10. [Cross-References](#10-cross-references)
11. [Sources](#11-sources)

---

## 1. Watching the System Breathe

A running system has a rhythm. CPU cycles come and go. Memory fills and drains. Disks read and write. Network interfaces send and receive. When the system is healthy, this rhythm is steady — predictable peaks during business hours, quiet troughs at night, periodic spikes during scheduled tasks. When something is wrong, the rhythm changes. The sysadmin's job is to notice the change, understand what caused it, and decide whether it needs intervention.

### 1.1 Load Average

The most misunderstood metric in systems administration is load average. Every Unix system reports it. Almost nobody interprets it correctly.

```bash
$ uptime
 14:32:07 up 47 days, 3:12, 2 users, load average: 2.15, 1.87, 1.42
```

The three numbers are the 1-minute, 5-minute, and 15-minute exponentially decaying moving averages of the number of processes in two states:

1. **Runnable** — actively running on a CPU or waiting in the run queue for a CPU
2. **Uninterruptible sleep** — waiting for I/O (typically disk) that cannot be interrupted

This is the critical detail that most people miss: **load average includes processes waiting for disk I/O, not just CPU.** A load of 4.0 on a 4-core system might mean all four cores are busy with computation (CPU-bound). Or it might mean one core is busy and three processes are stuck waiting for a slow disk (I/O-bound). The number is the same; the diagnosis is completely different.

**How to interpret load average:**

| Load vs. Cores | Meaning | Example (4-core system) |
|----------------|---------|------------------------|
| Load < cores | System has spare capacity | Load 2.0: two cores idle on average |
| Load = cores | System is fully utilized | Load 4.0: all cores occupied, no queue |
| Load > cores | Processes are queuing | Load 8.0: at any moment, 4 processes are waiting |
| Load >> cores | System is overloaded | Load 16.0: severe contention, everything slows down |

**The trend matters more than the number.** Load averages of 1.42 (15-min), 1.87 (5-min), 2.15 (1-min) show an *increasing* trend — load is rising. The reverse pattern (2.15, 1.87, 1.42 becoming 1.42, 1.87, 2.15) shows the peak has passed and the system is recovering.

### 1.2 The Tools

The first-response tools for watching system vital signs:

```bash
# Quick overview — CPU, memory, load, processes
top

# Better overview — color, tree view, mouse, per-core CPU
htop

# Virtual memory statistics — 1-second intervals
vmstat 1

# I/O statistics — 1-second intervals
iostat -x 1

# Historical data — System Activity Reporter
sar -u 1 10    # CPU every 1 second, 10 samples
sar -r 1 10    # Memory every 1 second, 10 samples
sar -b 1 10    # I/O every 1 second, 10 samples

# Network traffic per interface — 1-second intervals
sar -n DEV 1

# Everything at once — comprehensive snapshot
dstat              # If installed — combines vmstat, iostat, netstat, top
```

### 1.3 Reading top and htop

`top` and `htop` are the first tools most sysadmins reach for. Here is what the header section tells you:

```
top - 14:32:07 up 47 days,  3:12,  2 users,  load average: 2.15, 1.87, 1.42
Tasks: 312 total,   3 running, 308 sleeping,   0 stopped,   1 zombie
%Cpu(s): 23.4 us,  5.2 sy,  0.0 ni, 68.1 id,  2.8 wa,  0.0 hi,  0.5 si,  0.0 st
MiB Mem :  31894.4 total,   2341.2 free,  18432.1 used,  11121.1 buff/cache
MiB Swap:   8192.0 total,   7891.2 free,    300.8 used.  12547.3 avail Mem
```

The CPU line decoded:

| Field | Name | What It Means |
|-------|------|--------------|
| `us` | User | Time spent in user-space processes (your applications) |
| `sy` | System | Time spent in kernel space (syscalls, drivers) |
| `ni` | Nice | Time spent on re-niced (lower priority) processes |
| `id` | Idle | Time the CPU was idle — this is spare capacity |
| `wa` | I/O Wait | Time the CPU was idle because processes were waiting for disk I/O |
| `hi` | Hardware interrupt | Time handling hardware interrupts |
| `si` | Software interrupt | Time handling software interrupts (network, timer) |
| `st` | Steal | Time "stolen" by the hypervisor for other VMs (cloud/virtualization) |

The single most diagnostic field is `wa` (I/O wait). When it is high, the CPU is not busy — it is *bored*, waiting for the disk. This means the bottleneck is storage, not compute. Adding more CPU cores will not help. Faster disks (or caching) will.

### 1.4 vmstat — The Vital Signs Monitor

`vmstat` provides a running view of system health with one line per interval:

```bash
$ vmstat 1 5
procs -----------memory---------- ---swap-- -----io---- -system-- ------cpu-----
 r  b   swpd   free   buff  cache   si   so    bi    bo   in   cs us sy id wa st
 2  0 300800 2341200 412800 11121100  0    0    12   145  234  567 23  5 69  3  0
 1  0 300800 2339800 412800 11122400  0    0     0    84  212  501 18  4 75  3  0
 3  1 300800 2335200 412832 11124800  0    0     8   312  289  612 31  6 58  5  0
```

Key columns:

| Column | Meaning | Warning Signs |
|--------|---------|---------------|
| `r` | Processes in run queue (waiting for CPU) | Consistently > number of cores |
| `b` | Processes in uninterruptible sleep (waiting for I/O) | Any value > 0 means I/O bottleneck |
| `swpd` | Swap used (KB) | Growing over time = memory pressure |
| `si`/`so` | Swap in/out (KB/s) | Any sustained value > 0 = thrashing risk |
| `bi`/`bo` | Blocks in/out (KB/s) | High `bo` with high `wa` = disk write bottleneck |
| `in` | Interrupts per second | Sudden spikes indicate hardware events |
| `cs` | Context switches per second | Very high values indicate process contention |

The `b` column is the one that catches problems early. A process in state `b` (blocked on I/O) is stuck. It cannot proceed until the disk responds. One or two blocked processes during a write burst is normal. Ten or twenty is a storage system in distress.

---

## 2. Memory — The Finite Resource

Memory is the resource that systems run out of most dangerously. A slow CPU makes things slow. A slow disk makes things slow. But running out of memory makes things *die* — the kernel's OOM killer selects a process and terminates it, and the selection may not be the process you would have chosen.

### 2.1 Physical RAM, Virtual Memory, and Swap

Every process has a virtual address space — a range of memory addresses that the process believes is its own private memory. The kernel's memory management unit (MMU) translates these virtual addresses to physical RAM addresses. This abstraction provides:

- **Isolation:** Process A cannot read process B's memory
- **Overcommit:** The kernel can promise more virtual memory than physical RAM exists
- **Demand paging:** Pages are only loaded into RAM when accessed

When physical RAM is full, the kernel needs to make room. It has two strategies:

1. **Page cache eviction:** Discard cached copies of file data. These can be re-read from disk if needed. This is cheap and usually invisible.
2. **Swap:** Write memory pages that belong to processes (not file cache) out to the swap partition or file on disk. Reading them back is expensive — orders of magnitude slower than RAM.

### 2.2 Reading /proc/meminfo

```bash
$ cat /proc/meminfo
MemTotal:       32660480 kB     # Total physical RAM
MemFree:         2398208 kB     # Completely unused RAM
MemAvailable:   12848128 kB     # RAM available for new processes (includes reclaimable cache)
Buffers:          422912 kB     # Kernel buffer cache (block device metadata)
Cached:         10698752 kB     # Page cache (file contents cached in RAM)
SwapCached:        12288 kB     # Swap pages also cached in RAM
SwapTotal:       8388608 kB     # Total swap space
SwapFree:        8085504 kB     # Unused swap space
Dirty:             14336 kB     # Pages modified but not yet written to disk
Shmem:            819200 kB     # Shared memory (tmpfs, IPC)
```

**The critical distinction: MemFree vs. MemAvailable.**

`MemFree` is memory that is completely unused — not allocated to any process, not used for cache, not used for buffers. On a healthy system, this number is *small*, and that is fine. The kernel intentionally uses "free" memory for page cache because cached disk data speeds up future reads. Empty RAM is wasted RAM.

`MemAvailable` is the memory that could be given to a new process without swapping. It includes `MemFree` plus page cache and reclaimable slab that the kernel can evict if needed. This is the number that actually tells you how much headroom you have.

**Common misconception:** "The server is using 28 GB of 32 GB, it's almost out of memory!" Not necessarily. Check `MemAvailable`. If it says 12 GB, then 12 GB of that 28 GB "used" is page cache that can be reclaimed instantly. The system has plenty of headroom.

### 2.3 The OOM Killer

When all strategies fail — no more page cache to evict, swap is full, and a process demands more memory — the kernel activates the Out-Of-Memory killer. This is the last resort. The OOM killer:

1. Calculates an `oom_score` for every process based on: memory usage, process age, nice value, and whether it is a root process
2. Selects the process with the highest score (the biggest memory consumer that is least "important")
3. Sends SIGKILL to that process
4. Logs the event in the kernel ring buffer (dmesg) and journald

```bash
# Check for OOM events
dmesg | grep -i "out of memory"
journalctl -k | grep -i "oom"

# Example OOM killer output
[14:32:07] Out of memory: Killed process 28451 (java) total-vm:4194304kB, anon-rss:3145728kB, file-rss:16384kB
```

The OOM killer's choice is based on heuristics, not your operational priorities. It might kill your database instead of the runaway batch job that caused the problem. You can influence the decision:

```bash
# Check a process's OOM score (higher = more likely to be killed)
cat /proc/28451/oom_score

# Adjust OOM score (-1000 to 1000, -1000 = never kill)
echo -500 > /proc/28451/oom_score_adj

# Protect a critical process from OOM killer
echo -1000 > /proc/$(pidof postgres)/oom_score_adj
```

But the real fix is not adjusting OOM scores — it is preventing the OOM condition. Set memory limits on processes (cgroups), monitor memory trends, and investigate when swap usage starts climbing.

### 2.4 Shared Memory and Page Cache

Not all memory "used" by a process is private to that process:

| Memory Type | What It Is | Shared? | Reclaimable? |
|-------------|-----------|---------|-------------|
| **Anonymous pages** | Heap, stack, mmap'd private memory | No — private to the process | Only by swapping |
| **File-backed pages** | Memory-mapped files, shared libraries | Yes — shared between processes using the same file | Yes — can be re-read from disk |
| **Page cache** | Cached file I/O data | Shared system-wide | Yes — kernel evicts as needed |
| **Shared memory** | SysV shm, POSIX shm, tmpfs | Shared between processes that attach | Only by swapping |
| **Buffers** | Block device metadata cache | Shared system-wide | Yes — kernel evicts as needed |

When `top` shows a process using 2 GB of resident memory (RSS), some of that is shared libraries (libc, libpthread, libssl) mapped into every process. The actual unique memory footprint is the Proportional Set Size (PSS):

```bash
# Per-process memory breakdown
cat /proc/28451/smaps_rollup

# Or use smem for a system-wide PSS view
smem -tk
```

### 2.5 Memory Pressure and cgroups

Modern Linux kernels provide Pressure Stall Information (PSI) — a quantitative measure of resource contention:

```bash
$ cat /proc/pressure/memory
some avg10=0.00 avg60=0.15 avg300=0.08 total=1234567
full avg10=0.00 avg60=0.00 avg300=0.01 total=56789
```

- **some:** Percentage of time at least one task is stalled on memory
- **full:** Percentage of time all tasks are stalled on memory

PSI values above 0 on `full` mean the system was completely unable to make progress due to memory pressure. Even brief episodes indicate a system on the edge.

cgroups (control groups) provide per-process-group memory limits:

```bash
# systemd service with memory limit
[Service]
MemoryMax=2G           # Hard limit — OOM kill if exceeded
MemoryHigh=1.5G        # Soft limit — throttle if exceeded
MemorySwapMax=0        # Disable swap for this service
```

When a cgroup hits its `MemoryMax`, the kernel OOM-kills within that cgroup only — other services are unaffected. This is containment: one misbehaving service cannot take down the entire system.

---

## 3. CPU — Time, Sliced and Shared

The CPU is a time resource. There is a fixed amount of CPU time available per second (1 second per core), and every process that wants to run must share it. The kernel scheduler decides who runs when, for how long, and on which core. Understanding CPU usage means understanding how that time is being divided.

### 3.1 User Time, System Time, and I/O Wait

CPU time is categorized by where it was spent:

**User time (`us`):** Time spent executing application code. Your web server parsing a request, your database joining tables, your application processing business logic. This is the work your server exists to do.

**System time (`sy`):** Time spent in the kernel on behalf of a process. System calls — open(), read(), write(), connect(), mmap(). Every time your application talks to a file, a network socket, or a device, it enters the kernel. High system time relative to user time suggests the application is I/O-heavy (many syscalls) rather than compute-heavy.

**I/O wait (`wa`):** Time the CPU was *idle* because the only runnable processes were waiting for disk I/O. This is not CPU usage — it is CPU idleness caused by disk slowness. High iowait is a storage diagnosis, not a CPU diagnosis.

```bash
# Per-CPU breakdown
mpstat -P ALL 1

# Output:
# CPU   %usr  %nice  %sys  %iowait  %irq  %soft  %steal  %idle
# all   23.4   0.0    5.2     2.8    0.0    0.5     0.0   68.1
#   0   45.2   0.0    8.1     0.5    0.0    0.3     0.0   45.9
#   1   12.3   0.0    3.4     8.2    0.0    0.1     0.0   76.0
#   2   31.1   0.0    4.8     1.0    0.0    0.8     0.0   62.3
#   3    5.0   0.0    4.5     1.5    0.0    0.7     0.0   88.3
```

This per-CPU view reveals imbalances. In the example, CPU 0 is 45% user — something is pinned to it. CPU 1 has 8.2% iowait — processes on that core are waiting for disk. If only one core is busy and the rest are idle, the application may be single-threaded and cannot benefit from more cores.

### 3.2 Steal Time

On virtualized or cloud instances, `steal` (`st`) is the percentage of time the hypervisor took away from your VM to service other VMs on the same physical host. Your VM was ready to run but was not given CPU time because the host was overcommitted.

**If steal time is consistently above 5-10%:** Your instance is being contended. In a cloud environment, this usually means your instance type is "burstable" (like AWS t3) and you have exhausted your CPU credits, or the underlying host is oversold. The fix is either a larger instance type or moving to a dedicated/compute-optimized instance.

Steal time is the one CPU metric that is entirely outside your control. You cannot optimize your application to reduce it. It is the landlord taking your share of the building's electricity because another tenant is running space heaters.

### 3.3 Nice Values and Scheduling Priority

Every process has a nice value from -20 (highest priority) to 19 (lowest priority). The default is 0. The nice value is a *hint* to the scheduler — higher-nice processes get less CPU time when there is contention. When there is no contention, nice values do not matter.

```bash
# Start a process with low priority
nice -n 10 ./backup-script.sh

# Change priority of a running process
renice -n 15 -p 28451

# Only root can set negative nice values (higher priority)
sudo renice -n -5 -p $(pidof postgres)
```

Real-time scheduling goes further than nice values:

```bash
# Set a process to real-time FIFO scheduling with priority 50
sudo chrt -f 50 -p 28451

# Check a process's scheduling policy
chrt -p 28451
```

Real-time processes preempt all normal processes. Use with extreme caution — a runaway real-time process can starve everything else, including the SSH session you need to fix it.

### 3.4 CPU Throttling and Thermal Management

Modern CPUs dynamically adjust their clock speed based on workload and temperature:

```bash
# Current CPU frequency per core
cat /proc/cpuinfo | grep "cpu MHz"

# CPU frequency governor (performance, powersave, ondemand, schedutil)
cat /sys/devices/system/cpu/cpu0/cpufreq/scaling_governor

# Thermal zone temperatures
cat /sys/class/thermal/thermal_zone*/temp
# Output in millidegrees Celsius: 72000 = 72C
```

If the CPU temperature exceeds its thermal design power (TDP), the kernel throttles the clock speed to prevent hardware damage. This manifests as sudden performance drops that are not caused by load — the system was fast, then it was slow, then it was fast again. The thermal log tells the story:

```bash
# Check for thermal throttling events
dmesg | grep -i thermal
journalctl -k | grep -i throttl
```

In a data center or cloud environment, thermal throttling is rare (controlled cooling). On physical hardware without adequate cooling, it is a real and silent performance killer.

---

## 4. Disk I/O — The Slowest Link

In most systems, the disk is the bottleneck. RAM operates in nanoseconds. The network operates in microseconds to milliseconds. A spinning disk operates in milliseconds — and even an NVMe SSD is orders of magnitude slower than RAM. When the system is slow, the disk is usually why.

### 4.1 IOPS, Throughput, and Latency

Three metrics define disk performance:

| Metric | What It Measures | Why It Matters |
|--------|-----------------|----------------|
| **IOPS** | I/O operations per second | Database workloads generate many small reads/writes. IOPS is the bottleneck for random access. |
| **Throughput** | Data transfer rate (MB/s) | Backup jobs, log shipping, and streaming workloads need sustained transfer rates. |
| **Latency** | Time per I/O operation (ms or us) | The time your application waits for each read or write to complete. Directly affects response time. |

The relationship between these three:
```
Throughput = IOPS x Average I/O Size
Latency increases as IOPS approach the device's maximum capacity (queuing theory)
```

**Typical performance ranges:**

| Device | Random IOPS | Sequential Throughput | Latency |
|--------|------------|----------------------|---------|
| HDD (7200 RPM) | 80-160 | 100-200 MB/s | 5-15 ms |
| SATA SSD | 10,000-90,000 | 500-600 MB/s | 0.1-0.5 ms |
| NVMe SSD | 100,000-1,000,000+ | 2,000-7,000 MB/s | 0.02-0.1 ms |

The difference between HDD and NVMe is not incremental — it is 1000x for random IOPS. This is why database servers moved to SSDs and never looked back. A query that requires 1000 random reads takes 10 seconds on HDD and 10 milliseconds on NVMe.

### 4.2 Reading iostat

`iostat` is the primary tool for disk I/O analysis:

```bash
$ iostat -x 1
Device  r/s    rkB/s  w/s    wkB/s  rrqm/s wrqm/s  %util  r_await w_await  aqu-sz
sda     45.0   1200.0 120.0  4800.0 2.0    35.0    78.5   4.2     8.1      1.3
nvme0n1 230.0  9200.0 85.0   3400.0 0.0    12.0    15.2   0.1     0.2      0.05
```

Key columns:

| Column | Meaning | Warning Signs |
|--------|---------|---------------|
| `r/s`, `w/s` | Reads and writes per second | Approaching device IOPS limit |
| `rkB/s`, `wkB/s` | Read/write throughput | Approaching device bandwidth limit |
| `%util` | Percentage of time the device had I/O in progress | >80% on HDD = saturated. Less meaningful for SSDs with deep queues |
| `r_await`, `w_await` | Average time per read/write (ms) | Increasing latency = queuing. Compare to device baseline |
| `aqu-sz` | Average queue size | Growing queue = device cannot keep up with request rate |

**The %util trap:** On HDDs, 100% utilization means the disk is always busy — there is no spare capacity. On NVMe SSDs, 100% utilization can occur at a fraction of the device's capacity because the device handles multiple requests in parallel (deep queue depth). For SSDs, `await` and queue depth are better indicators of saturation than `%util`.

### 4.3 Per-Process I/O with iotop

`iotop` shows which processes are generating disk I/O:

```bash
# Real-time per-process I/O
sudo iotop -o    # Only show processes with active I/O

# Output:
# TID   PRIO USER    DISK READ  DISK WRITE  SWAPIN     IO>    COMMAND
# 28451 be/4 postgres  4.2 M/s    8.7 M/s    0.0 %   45.2 %  postgres: writer
# 3124  be/4 root      0.0 B/s   12.1 M/s    0.0 %   23.1 %  rsync --archive ...
# 8891  be/4 www-data  1.1 M/s    0.2 M/s    0.0 %    8.7 %  nginx: worker
```

When the disk is saturated and you need to know which process is responsible, `iotop` answers immediately. In the example above, `postgres` and `rsync` are competing for disk bandwidth. The sysadmin's decision: is this expected (backup running during business hours overlapping with database writes) or unexpected (a runaway query doing a sequential scan of a 50 GB table)?

### 4.4 SMART Monitoring

Self-Monitoring, Analysis and Reporting Technology (SMART) provides early warning of disk hardware failure:

```bash
# Check SMART status
sudo smartctl -a /dev/sda

# Key attributes to watch:
# Reallocated_Sector_Ct  — bad sectors remapped. Growing count = failing disk.
# Current_Pending_Sector — sectors waiting for reallocation. Non-zero = concerning.
# Offline_Uncorrectable  — sectors that could not be read. Non-zero = data loss risk.
# UDMA_CRC_Error_Count   — cable/connector errors. Growing = replace cable first.
# Wear_Leveling_Count    — SSD lifetime remaining (percentage).

# Automated monitoring via smartd
sudo systemctl enable smartd
# Configure /etc/smartd.conf to alert on attribute changes
```

SMART does not predict all failures — sudden catastrophic failures happen without warning. But degrading disks almost always show increasing Reallocated_Sector_Ct or Current_Pending_Sector before they fail completely. Monitor these weekly. Replace the disk when the trend is clear. A $100 replacement disk is cheaper than data loss.

---

## 5. Network I/O — The Conversations

Network I/O tells you what your server is talking to, how much data is moving, and whether connections are healthy. Unlike disk I/O (which is mostly local), network I/O involves remote parties — and those remote parties can behave unpredictably.

### 5.1 Per-Interface Throughput

```bash
# Real-time bandwidth per interface
sar -n DEV 1

# Output:
# IFACE   rxpck/s  txpck/s  rxkB/s  txkB/s  rxcmp/s  txcmp/s  rxmcst/s
# eth0    2340.0   1892.0   3456.7  12845.2    0.0      0.0       1.2
# lo       456.0    456.0    234.5    234.5    0.0      0.0       0.0

# Or use nload for a visual per-interface display
nload eth0

# ip command for interface statistics
ip -s link show eth0
```

The ratio of `rxkB/s` (received) to `txkB/s` (transmitted) tells you the nature of the traffic:

- **Web server:** txkB >> rxkB (serving content — small requests in, large responses out)
- **Database server:** More balanced (queries in, result sets out)
- **Backup target:** rxkB >> txkB (receiving data from backup clients)
- **Proxy:** Roughly equal (forwarding both directions)

Sudden asymmetry changes suggest unusual activity. A web server that suddenly has rxkB >> txkB might be receiving a file upload attack or a large POST-based DDoS.

### 5.2 Connection Tracking with ss

`ss` (socket statistics) replaces the deprecated `netstat` and provides fast, detailed connection information:

```bash
# Count connections by state
ss -s
# Output:
# TCP: 847 (estab 623, closed 12, orphaned 3, timewait 184, synrecv 0)

# All established TCP connections with process names
ss -tnp state established

# Connections to a specific port
ss -tnp state established '( dport = :5432 )'

# Connections from a specific IP
ss -tnp state established '( src = 10.0.0.5 )'

# Listen sockets — what ports are open
ss -tlnp
```

### 5.3 Connection States and What They Mean

TCP connections go through a lifecycle, and the distribution of connection states tells you about system health:

```bash
# Connection state distribution
ss -tan | awk '{print $1}' | sort | uniq -c | sort -rn

#  623 ESTAB
#  184 TIME-WAIT
#   22 CLOSE-WAIT
#   12 FIN-WAIT-2
#    6 SYN-SENT
```

| State | Healthy Count | Problem Signs |
|-------|-------------|---------------|
| **ESTABLISHED** | Proportional to active clients | Thousands growing without plateau = connection leak or slowloris attack |
| **TIME_WAIT** | Normal after connection close | Thousands = rapid connection cycling. Consider connection pooling or tuning `net.ipv4.tcp_tw_reuse` |
| **CLOSE_WAIT** | Should be near zero | Any sustained count = application bug. The remote side closed, but your app did not call close() |
| **SYN_RECV** | Should be near zero | Hundreds or thousands = SYN flood attack |
| **FIN_WAIT_1/2** | Transient, low count | Growing = remote side not acknowledging close |

**CLOSE_WAIT deserves special attention.** It means:
1. The remote side sent FIN (closed their end of the connection)
2. Your application received the notification
3. Your application has *not* called close() on its socket

This is almost always a bug in the application — a missing `finally { connection.close() }` block, an error path that skips cleanup, or a pool that is not reclaiming connections. Each CLOSE_WAIT connection holds a file descriptor. Accumulate enough and the process hits its file descriptor limit and cannot open new connections.

### 5.4 Real-Time Bandwidth per Connection

```bash
# iftop — shows bandwidth per connection pair
sudo iftop -i eth0

# Output (simplified):
#   10.0.0.5:443     <=>  203.0.113.47:52341    1.2Mb  800Kb  600Kb
#   10.0.0.5:443     <=>  198.51.100.12:48892    450Kb  320Kb  280Kb
#   10.0.0.5:5432    <=>  10.0.0.10:38291       2.8Mb  1.9Mb  1.5Mb

# nethogs — groups by process instead of connection
sudo nethogs eth0
```

When the network link is saturated and you need to know which connection (or which process) is responsible, `iftop` and `nethogs` answer the question in real time. This is the difference between "the network is slow" and "the database replication stream between server A and server B is consuming 80% of the link bandwidth."

---

## 6. Misbehaving Processes

A misbehaving process is one that consumes resources disproportionate to its purpose. A web server using 2 GB of RAM to serve a small website. A cron job that was supposed to take 5 minutes running for 3 hours. A logging daemon spinning at 100% CPU. The diagnostic workflow is always the same: notice, identify, understand, fix.

### 6.1 CPU Spinning

A process using 100% of a CPU core is not necessarily misbehaving — a computation-heavy task legitimately needs CPU. The problem is when a process uses 100% CPU *doing nothing useful*: an infinite loop, a busy-wait on a lock, a retry loop with no backoff.

```bash
# Identify the top CPU consumers
top -bn1 -o %CPU | head -15

# Check what a spinning process is doing
strace -p 28451 -c    # Summary of system calls
# Output:
# % time     seconds  usecs/call     calls    errors syscall
# ------ ----------- ----------- --------- --------- ----------------
#  98.42    4.523000           1   4523000           poll
#   1.12    0.051000           5     10200           write
#   0.46    0.021000           2     10200           read

# This tells you: the process is calling poll() millions of times per second
# — a busy-wait loop polling a file descriptor that is never ready
```

`strace` is the sysadmin's magnifying glass. It shows every system call a process makes — every file open, every read, every write, every network call. When a process is misbehaving, strace shows you *what* it is doing at the kernel interface. The pattern of syscalls reveals the bug.

### 6.2 Memory Leaks

A memory leak is a process that allocates memory and never frees it. The resident memory (RSS) grows over time without bound. Eventually, the process consumes all available memory and triggers the OOM killer, or exhausts its cgroup limit and gets killed by its own containment.

```bash
# Watch a process's memory over time
watch -n 5 "ps -o pid,rss,vsz,comm -p 28451"

# Or plot RSS over time with a simple loop
while true; do
  echo "$(date +%H:%M:%S) $(ps -o rss= -p 28451)"
  sleep 60
done >> /tmp/memory-trend.log
```

If RSS grows linearly over hours or days, it is a leak. The growth rate tells you the severity:

- 1 MB/hour: the process will survive for days. You have time to investigate.
- 100 MB/hour: the process will OOM within a day. Fix it soon.
- 1 GB/hour: the process will OOM within hours. Act now.

For deeper analysis:

```bash
# Memory map of a process
cat /proc/28451/smaps | grep -A 2 "Rss:"

# Heap analysis (requires debug symbols)
# Use valgrind for C/C++, jmap for Java, tracemalloc for Python
```

### 6.3 File Descriptor Exhaustion

Every open file, socket, pipe, and device connection uses a file descriptor. Each process has a limit:

```bash
# Check a process's file descriptor limit and current usage
cat /proc/28451/limits | grep "open files"
# Max open files            1024                 1048576

ls /proc/28451/fd | wc -l
# 847

# Or use lsof
lsof -p 28451 | wc -l

# See what types of files are open
lsof -p 28451 | awk '{print $5}' | sort | uniq -c | sort -rn
#  312 IPv4    (network sockets)
#  245 REG     (regular files)
#  189 FIFO    (pipes)
#   87 unix    (Unix domain sockets)
#   14 DIR     (directories)
```

When a process hits its file descriptor limit, every subsequent `open()`, `socket()`, and `accept()` call fails with `EMFILE` (Too many open files). The process cannot serve new requests, open log files, or create new connections. It is functionally dead while still running.

**Common causes:**
- Connection pool not limiting or recycling connections
- Log files opened but never closed
- Leaked socket connections (CLOSE_WAIT accumulation)
- File handles held across long-running loops

### 6.4 Zombie Processes

A zombie process has terminated but its parent has not called `wait()` to read its exit status. It appears in `ps` as state `Z`:

```bash
# Find zombie processes
ps aux | awk '$8 == "Z"'

# Or
ps -eo pid,ppid,stat,comm | grep Z
```

Zombies consume no CPU and no memory — they are just an entry in the process table. A few zombies are harmless. But if a parent process never reaps its children, zombies accumulate. On a system with a limited PID space (default 32768), enough zombies can exhaust available PIDs and prevent new processes from starting.

The fix is to fix the parent process (add proper `wait()` calls) or kill the parent (which makes init adopt and reap the orphaned zombies).

### 6.5 lsof — What Is This Process Connected To?

`lsof` (list open files) is the universal answer to "what is this process doing?" Because everything in Unix is a file, `lsof` shows:

```bash
# All files open by a process
lsof -p 28451

# Which process has a specific port open
lsof -i :5432

# Which process has a specific file open
lsof /var/log/syslog

# All network connections by a process
lsof -i -p 28451

# Files open by a specific user
lsof -u postgres
```

When you find a process you do not recognize consuming resources, `lsof` answers the first three diagnostic questions: What files is it reading? What network connections does it have? What devices is it accessing? Combined with strace (what syscalls is it making), you have a nearly complete picture of the process's behavior.

---

## 7. Resource Limits — Containment

The principle of containment: a single misbehaving process should not be able to take down the entire system. Unix provides three layers of containment, from simple to comprehensive.

### 7.1 ulimits

`ulimit` (user limits) sets per-process resource constraints:

```bash
# View all limits for the current shell
ulimit -a

# Key limits:
ulimit -n      # Max open files (default often 1024)
ulimit -u      # Max user processes
ulimit -v      # Max virtual memory (KB)
ulimit -s      # Max stack size (KB)
ulimit -c      # Max core dump file size

# Set max open files for this session
ulimit -n 65535

# For systemd services, set in the unit file:
[Service]
LimitNOFILE=65535
LimitNPROC=4096
```

ulimits are blunt instruments — they protect the system from one process but offer no fine-grained control. A process that hits its `ulimit -n` simply fails; there is no throttling, no graceful degradation.

### 7.2 cgroups (Control Groups)

cgroups provide the kernel-level resource accounting and limiting that powers modern Linux containers. Every systemd service automatically runs in its own cgroup.

```bash
# View cgroup hierarchy for a service
systemd-cgls

# Resource usage for a specific service's cgroup
systemctl show nginx.service | grep -E "Memory|CPU|IO"

# Or read the cgroup filesystem directly
cat /sys/fs/cgroup/system.slice/nginx.service/memory.current
cat /sys/fs/cgroup/system.slice/nginx.service/cpu.stat
```

cgroup resource controllers:

| Controller | What It Limits | Key Parameters |
|-----------|---------------|----------------|
| **memory** | RAM and swap usage | `memory.max`, `memory.high`, `memory.swap.max` |
| **cpu** | CPU time allocation | `cpu.max` (hard limit), `cpu.weight` (relative share) |
| **io** | Disk I/O bandwidth and IOPS | `io.max` (per-device limits), `io.weight` |
| **pids** | Number of processes | `pids.max` (prevents fork bombs) |

Setting limits in systemd unit files:

```ini
[Service]
# Memory: hard limit 2GB, soft limit 1.5GB, no swap
MemoryMax=2G
MemoryHigh=1.5G
MemorySwapMax=0

# CPU: maximum 150% (1.5 cores)
CPUQuota=150%

# I/O: maximum 50MB/s read, 30MB/s write on /dev/sda
IOReadBandwidthMax=/dev/sda 50M
IOWriteBandwidthMax=/dev/sda 30M

# Process count: maximum 512 processes
TasksMax=512
```

When a service hits `MemoryHigh`, the kernel throttles its memory allocation (slower, but alive). When it hits `MemoryMax`, the OOM killer activates within the cgroup — only that service's processes are candidates for killing. Other services on the system are unaffected.

### 7.3 Namespaces

Namespaces provide isolation — they control what a process can *see*, while cgroups control what it can *use*:

| Namespace | Isolates | Effect |
|-----------|---------|--------|
| **PID** | Process IDs | Process sees only its own process tree. PID 1 inside is not init. |
| **Network** | Network stack | Process has its own interfaces, routing table, iptables rules. |
| **Mount** | Filesystem mounts | Process sees a different filesystem tree. |
| **User** | User and group IDs | Root inside the namespace is not root on the host. |
| **UTS** | Hostname | Process can have its own hostname. |
| **IPC** | Inter-process communication | Process has its own shared memory and semaphore sets. |
| **Cgroup** | Cgroup view | Process sees itself as the root of the cgroup hierarchy. |

Docker, Podman, and LXC use all of these together: a container is a process with its own PID namespace, network namespace, mount namespace, user namespace, and cgroup limits. Understanding namespaces means understanding containers — not as magic, but as a combination of kernel features that have existed individually for years.

```bash
# See the namespaces of a process
ls -la /proc/28451/ns/

# Enter a container's namespace (from the host)
nsenter -t 28451 -m -u -i -n -p -- /bin/bash

# Create a new namespace (unshare)
unshare --pid --fork --mount-proc /bin/bash
# You are now PID 1 in a new PID namespace
```

### 7.4 Why Understanding the Layers Matters

When someone says "run it in Docker," they mean: create a process with cgroup limits (so it cannot consume all system resources), namespace isolation (so it cannot see or affect other processes), and a layered filesystem (so its file changes are ephemeral). There is no container hypervisor, no VM, no separate kernel. It is the same Linux kernel, with isolation enforced by the same cgroup and namespace features available to any systemd service.

The sysadmin who understands this can:
- Debug a containerized application by examining its cgroup stats and namespace from the host
- Set resource limits on non-containerized services using systemd unit files
- Diagnose why a container is being OOM-killed by checking its cgroup memory counters
- Understand that a container's "1 CPU" limit is `cpu.max = 100000 100000` (100ms out of every 100ms period)

---

## 8. The Diagnostic Mindset

Process forensics is not about memorizing commands. It is about developing a diagnostic method — a systematic way to move from "something is wrong" to "I know what is wrong and how to fix it."

### 8.1 Symptoms vs. Causes

The most common mistake in systems diagnosis is treating symptoms as causes:

| Symptom | Common Misdiagnosis | Actual Diagnostic Path |
|---------|-------------------|-----------------------|
| "High CPU" | "We need a bigger server" | Which process? Which function? Which input triggered it? |
| "Out of memory" | "Add more RAM" | Which process is leaking? What is the growth rate? What triggers allocation? |
| "Disk full" | "Add more disk space" | Which directory grew? Which process wrote the data? Is it log files? Temp files? Core dumps? |
| "Network slow" | "Upgrade the link" | Which connection is saturated? Is it a single stream? Is the remote side slow? |
| "Application slow" | "Optimize the code" | Where is the time spent? Is it CPU? Disk? Network? Lock contention? |

The diagnostic method:

1. **Notice:** Something is abnormal. Load is high, responses are slow, users are complaining.
2. **Identify:** Which resource is constrained? Use `top`/`htop` for CPU and memory, `iostat` for disk, `ss`/`iftop` for network.
3. **Narrow:** Which process is responsible? Use per-process tools (`iotop`, `strace`, `lsof`, `ss -p`).
4. **Understand:** Why is this process behaving this way? Is it a legitimate load spike, a bug, a configuration error, or a resource leak?
5. **Fix:** Address the root cause, not the symptom. Restart is a temporary fix; understanding is a permanent one.

### 8.2 The USE Method

Brendan Gregg's USE (Utilization, Saturation, Errors) method provides a systematic checklist for every resource:

| Resource | Utilization | Saturation | Errors |
|----------|------------|------------|--------|
| **CPU** | `mpstat -P ALL` (per-core %usr + %sys) | Load average, run queue length (`vmstat r`) | `dmesg` MCE errors, throttling events |
| **Memory** | `free -m` MemUsed vs MemTotal | `vmstat si/so` (swap activity), PSI | OOM kills in `dmesg`, `journalctl -k` |
| **Disk** | `iostat -x %util` | `iostat -x aqu-sz, await` | `smartctl`, `dmesg` I/O errors |
| **Network** | `sar -n DEV rxkB/s txkB/s` vs link speed | `ss -s` retransmits, `netstat -s` drops | `ip -s link` errors, drops, overruns |

For each resource, check utilization first (is it being used?), then saturation (is there a queue?), then errors (is something broken?). This covers the most common failure modes systematically. If all resources show low utilization, no saturation, and no errors — the problem is likely in the application layer (lock contention, algorithmic inefficiency, external dependency timeout).

### 8.3 Following the Chain

When a user says "the website is slow," the diagnostic chain is:

```
User: "the website is slow"
  -> Is the web server responding slowly?
    -> Check nginx access log for response times
      -> Yes, average response time jumped from 50ms to 2000ms
        -> Which requests are slow?
          -> All requests to /api/* are slow
            -> What does the API backend show?
              -> Backend is waiting for database queries
                -> What does the database show?
                  -> High disk I/O wait, query plan shows sequential scan
                    -> Table statistics are stale, planner chose wrong plan
                      -> ANALYZE the table, or add the missing index
```

Each step narrows the scope. Each tool contributes one piece. The sysadmin follows the chain from the symptom (slow website) through the infrastructure (web server -> backend -> database -> disk) to the root cause (missing index causing sequential scan). The fix is `CREATE INDEX`, not "add more RAM to the database server."

### 8.4 When to Restart vs. When to Investigate

Restarting a service fixes the symptom instantly. The runaway process dies, its leaked memory is freed, its stuck connections close. Production is restored. But the next time the same conditions occur, the same failure will happen.

**Restart when:** Production is down, users are affected, and you need to restore service immediately. But *also* preserve evidence first:

```bash
# Before killing the misbehaving process:
# 1. Capture its state
cat /proc/28451/status > /tmp/debug-28451-status
cat /proc/28451/smaps_rollup > /tmp/debug-28451-memory
ls -la /proc/28451/fd > /tmp/debug-28451-fds
lsof -p 28451 > /tmp/debug-28451-lsof

# 2. Capture a thread dump (if supported)
kill -USR1 28451    # Many applications dump thread state on USR1

# 3. Check the logs
journalctl -u service-name --since "1 hour ago" > /tmp/debug-28451-logs

# NOW restart
systemctl restart service-name
```

**Investigate when:** The problem is not actively causing downtime but is degrading over time (memory leak, growing connection count, increasing disk usage). You have hours or days to understand and fix it properly.

The sysadmin who always restarts without investigating will restart the same service every week. The sysadmin who investigates once fixes it permanently.

---

## 9. Automation and Alerting

Manual observation does not scale. A sysadmin cannot watch `top` on 50 servers simultaneously. Automated monitoring collects the metrics, stores them, evaluates thresholds, and alerts when intervention is needed. The human remains in the loop — but the system does the watching.

### 9.1 Prometheus and node_exporter

Prometheus is the industry-standard open-source monitoring system. Its model:

1. **node_exporter** runs on each server and exposes system metrics as HTTP endpoints
2. **Prometheus server** scrapes those endpoints at regular intervals (typically 15-30 seconds)
3. **PromQL** queries analyze the time-series data
4. **Alertmanager** evaluates alert rules and sends notifications

```bash
# Install and start node_exporter
# (exposes metrics at http://localhost:9100/metrics)

# Example metrics exposed:
node_cpu_seconds_total{cpu="0",mode="idle"}     482341.23
node_cpu_seconds_total{cpu="0",mode="user"}     123456.78
node_memory_MemAvailable_bytes                  12848128000
node_disk_io_time_seconds_total{device="sda"}   45678.90
node_network_receive_bytes_total{device="eth0"} 987654321000
```

These are raw counters. Prometheus stores them as time series and PromQL transforms them into useful rates:

```promql
# CPU usage per core (1 - idle fraction over 5 minutes)
1 - rate(node_cpu_seconds_total{mode="idle"}[5m])

# Memory usage percentage
(1 - node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes) * 100

# Disk I/O utilization
rate(node_disk_io_time_seconds_total{device="sda"}[5m])

# Network receive rate in Mbps
rate(node_network_receive_bytes_total{device="eth0"}[5m]) * 8 / 1000000
```

### 9.2 Setting Thresholds That Mean Something

The most common alerting mistake is threshold-based alerts on raw resource metrics:

```yaml
# BAD: Alert on raw CPU usage
- alert: HighCPU
  expr: cpu_usage > 80
  # This fires during every deployment, every backup, every batch job.
  # It trains people to ignore alerts.
```

```yaml
# GOOD: Alert on user-visible symptoms
- alert: HighRequestLatency
  expr: histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m])) > 0.5
  for: 5m
  annotations:
    summary: "95th percentile request latency above 500ms for 5 minutes"
    # This fires when users are actually affected.
```

The principle: **alert on symptoms, not causes.** CPU at 80% might be normal during a deployment. Request latency exceeding your SLA for 5 minutes means users are affected. The alert should trigger investigation, not cause panic over a number that might be fine.

Good alerting thresholds:

| Alert | Threshold | Rationale |
|-------|-----------|-----------|
| Request latency | p95 > SLA for 5 min | Users are affected |
| Error rate | > 1% of requests for 5 min | Service quality degraded |
| Disk space | < 10% free | Approaching failure, time to act |
| Memory | MemAvailable < 5% for 10 min | OOM risk imminent |
| Certificate expiry | < 14 days | Time to renew before outage |
| Swap usage | Sustained swap I/O for 15 min | Memory pressure causing performance degradation |

Bad alerting thresholds:

| Alert | Why Bad |
|-------|---------|
| CPU > 80% | Fires during normal operations (batch jobs, deployments). Trains people to ignore alerts. |
| Memory > 90% used | Includes page cache. MemAvailable is the right metric. |
| Disk I/O > 50 MB/s | Normal during backups. Alert on latency or application impact instead. |
| Any single-point threshold | One spike is not a trend. Use `for: 5m` to require sustained conditions. |

### 9.3 The Human in the Loop

Monitoring and alerting are not replacements for human judgment. They are tools that help the human focus attention. The system says "latency is elevated." The human reads the logs, checks the metrics, follows the diagnostic chain, and decides: is this a database index issue, a network problem, a deployment gone wrong, or a traffic spike from a legitimate event?

The automation does what automation is good at: collecting data continuously, comparing against thresholds, sending notifications reliably. The human does what humans are good at: understanding context, weighing trade-offs, making judgment calls about when to act and when to wait.

The worst outcome is alert fatigue — so many alerts firing that the human ignores them. When the real alert fires, it gets lost in the noise. The cure is fewer, better alerts. Every alert should be actionable: when it fires, someone should need to do something. If the response to an alert is always "ignore it," delete the alert.

### 9.4 Dashboards as Context

A Grafana dashboard for process forensics shows at a glance:

```
Row 1: System Overview
  [CPU Usage per Core]  [Memory: Used vs Available vs Swap]  [Load Average]

Row 2: Disk
  [Disk IOPS]  [Disk Throughput (MB/s)]  [Disk Latency (ms)]  [Disk Space]

Row 3: Network
  [Network Throughput per Interface]  [TCP Connection States]  [Errors/Drops]

Row 4: Top Consumers
  [Top 10 Processes by CPU]  [Top 10 Processes by Memory]  [Top 10 by Disk I/O]
```

The dashboard is not the investigation — it is the starting point. It tells you where to look. The investigation happens in the logs, in `strace`, in `lsof`, in the diagnostic chain.

---

## 10. Cross-References

| Module | Connection |
|--------|-----------|
| [Server Foundations](01-server-foundations.md) | Process lifecycle, systemd service management, init systems |
| [The Network](02-the-network.md) | Network I/O context, TCP connection states, bandwidth management |
| [The Logs](03-the-logs.md) | Process behavior recorded in logs, correlating PID/UID with log entries, journalctl by unit |
| [Data Provenance](05-data-provenance.md) | Timestamps for forensic timeline reconstruction, filesystem metadata |
| [Access & Bandwidth](06-access-bandwidth.md) | Rate limiting, QoS, resource allocation policies |
| [Security Operations](07-security-operations.md) | Detecting compromise through abnormal process behavior, intrusion detection |
| [Integration Synthesis](08-integration-synthesis.md) | Cross-module diagnostic workflows |
| [BPS Module 7](../../../BPS/research/07-gpu-ml-pipeline.md) | GPU pipeline monitoring, CUDA stream isolation, real-time data processing |
| [Glossary](00-glossary.md) | Definitions: CPU load, memory pressure, file descriptor, strace, lsof, top/htop, vmstat, iostat, container, cgroup, OOM killer, zombie process |

---

## 11. Sources

### Books

1. **Brendan Gregg, "Systems Performance: Enterprise and the Cloud," 2nd ed., Addison-Wesley, 2020.** The definitive reference for performance analysis methodology. Covers the USE method, CPU analysis, memory analysis, disk I/O, networking, and observability tools in depth. Every sysadmin should own this book.

2. **Brendan Gregg, "BPF Performance Tools: Linux System and Application Observability," Addison-Wesley, 2019.** Advanced tracing and observability using eBPF. Covers bpftrace, BCC tools, and dynamic tracing for production systems.

3. **Michael Kerrisk, "The Linux Programming Interface," No Starch Press, 2010.** Authoritative reference for Linux system calls, process management, memory management, signals, and IPC. The syscall-level foundation beneath every diagnostic tool.

### Linux Kernel Documentation

4. **Linux cgroups v2 documentation.** Control group hierarchy, resource controllers (cpu, memory, io, pids), delegation, and systemd integration.
   - https://docs.kernel.org/admin-guide/cgroup-v2.html

5. **Linux namespaces documentation.** PID, network, mount, user, UTS, IPC, and cgroup namespace implementation and behavior.
   - https://man7.org/linux/man-pages/man7/namespaces.7.html

6. **Pressure Stall Information (PSI).** Kernel documentation for memory, CPU, and I/O pressure metrics.
   - https://docs.kernel.org/accounting/psi.html

7. **/proc filesystem documentation.** Per-process status, memory maps, file descriptors, limits, and cgroup membership.
   - https://docs.kernel.org/filesystems/proc.html

### Tool Documentation

8. **procps-ng (top, vmstat, free, ps, pgrep, pidof).** Documentation for the standard Linux process monitoring utilities.
   - https://gitlab.com/procps-ng/procps

9. **htop(1) — interactive process viewer.** Color-coded, tree-view, mouse-enabled replacement for top. Shows per-core CPU, memory bars, and process filtering.
   - https://htop.dev/

10. **sysstat (iostat, sar, mpstat, pidstat).** System performance monitoring tools. sar provides historical data collection; iostat and mpstat provide real-time snapshots.
    - https://sysstat.github.io/

11. **strace(1) — system call tracer.** Traces all system calls made by a process. Essential for understanding process behavior at the kernel interface.
    - https://strace.io/

12. **lsof(8) — list open files.** Shows all files, sockets, pipes, and devices open by a process or system-wide.
    - https://github.com/lsof-org/lsof

13. **iotop(8) — I/O monitor.** Per-process disk I/O display analogous to top for CPU.
    - https://man7.org/linux/man-pages/man8/iotop.8.html

14. **ss(8) — socket statistics.** Fast replacement for netstat. Connection listing, filtering, and statistics.
    - https://man7.org/linux/man-pages/man8/ss.8.html

15. **smartctl (smartmontools).** SMART disk health monitoring for HDD and SSD devices.
    - https://www.smartmontools.org/

### Monitoring Systems

16. **Prometheus documentation.** Time-series database, PromQL query language, alerting rules, and service discovery.
    - https://prometheus.io/docs/

17. **Grafana documentation.** Dashboard building, data source integration, alerting, and panel types for system metrics visualization.
    - https://grafana.com/docs/grafana/latest/

18. **node_exporter.** Prometheus exporter for hardware and OS metrics. Exposes CPU, memory, disk, network, and filesystem metrics.
    - https://github.com/prometheus/node_exporter

### Methodology

19. **Brendan Gregg, USE Method.** Utilization, Saturation, Errors — a systematic methodology for checking resource performance. Includes per-resource checklists for Linux.
    - https://www.brendangregg.com/usemethod.html

20. **Brendan Gregg, Linux Performance.** Comprehensive overview of Linux performance tools, organized by resource type and diagnostic scenario.
    - https://www.brendangregg.com/linuxperf.html

---

*The system is always talking. CPU load, memory pressure, disk latency, connection states — these are not just numbers on a dashboard. They are the vital signs of a living system. The sysadmin who reads them sees the system as it is, not as it was configured to be. Every misbehaving process has a reason. Every resource bottleneck has a cause. The tools show the symptoms; the diagnostic mindset finds the root. Follow the chain. Read the signs. The answer is always there.*
