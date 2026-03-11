# Data Provenance

> **Module ID:** SRV-PROV
> **Module:** 5 — Stewardship Layer
> **Through-line:** *Every bit leaves a trail.* The sysadmin reads the truth in timestamps, hashes, and metadata. Provenance is not an add-on feature -- it is the chain of custody that proves data is what it claims to be.

---

## Table of Contents

1. [The Trail Every Bit Leaves](#1-the-trail-every-bit-leaves)
2. [Timestamps and Time](#2-timestamps-and-time)
3. [Filesystem Metadata](#3-filesystem-metadata)
4. [Chain of Custody](#4-chain-of-custody)
5. [Cache Archaeology](#5-cache-archaeology)
6. [Backup and Recovery](#6-backup-and-recovery)
7. [Data Lifecycle](#7-data-lifecycle)
8. [Provenance in Practice](#8-provenance-in-practice)
9. [The Energy Cost of Data](#9-the-energy-cost-of-data)
10. [Cross-References](#10-cross-references)
11. [Sources](#11-sources)

---

## 1. The Trail Every Bit Leaves

Every file on a filesystem has a creation time, a modification time, and an access time. Every network packet has a source address and a destination address. Every database transaction has a timestamp and a session identifier. Every git commit has an author, a date, and a cryptographic hash linking it to every commit before it.

This is provenance. Not a feature you add to a system -- the trace that every system leaves whether you look for it or not.

### 1.1 What Provenance Means

Provenance answers four questions about any piece of data:

| Question | What it reveals | Example |
|----------|----------------|---------|
| **Where did it come from?** | Origin, source system, creator | File uploaded from 192.168.1.42 by user `deploy` |
| **Who touched it?** | Every identity that read, modified, or moved the data | Modified by root at 03:14, accessed by backup daemon at 04:00 |
| **When?** | Timestamp of every event in the chain | Created 2026-01-15T08:30:00Z, last modified 2026-03-09T14:22:17Z |
| **What changed?** | The delta between states | 47 bytes added to line 312, permissions changed from 644 to 600 |

Without provenance, data is just bits on a disk. With provenance, data has a verifiable history -- a story you can reconstruct, audit, and trust.

### 1.2 Provenance Is Not Optional

Consider a system where no provenance exists. A configuration file is wrong. When did it change? Who changed it? Was it the last deploy, a manual edit, or a compromised account? Without timestamps, access logs, or version history, you cannot answer any of these questions. You are debugging in the dark.

Now consider the same system with provenance. The file's `mtime` shows it was modified at 02:47 UTC. The audit log shows user `jdoe` ran `vim /etc/nginx/nginx.conf` at 02:46 UTC. The git log shows `jdoe` committed a config change to the deploy repo at 02:30 UTC. The deploy pipeline ran at 02:45 UTC. The chain is complete: you know who, when, how, and why.

The sysadmin who maintains provenance can reconstruct the past. The one who doesn't is always guessing.

### 1.3 The Trail Is Already There

Most systems generate provenance data automatically. The challenge is not creating it -- it is knowing where to look and how to preserve it:

```
Filesystem    -> stat, inode metadata, journal
Kernel        -> dmesg, audit subsystem, /proc
Network       -> packet captures, flow records, connection tracking
Applications  -> access logs, error logs, transaction logs
Version control -> commit graph, blame, reflog
Containers    -> image layers, build history, runtime logs
```

The trail exists. The sysadmin's job is to read it, preserve it, and know which parts matter.

---

## 2. Timestamps and Time

Time is the backbone of provenance. Without accurate, consistent timestamps, you cannot correlate events across systems. Two servers with clocks that disagree by 30 seconds can make log analysis impossible -- did the database crash cause the web server error, or did the web server error crash the database? If the timestamps disagree, you cannot tell.

### 2.1 Unix Epoch

The Unix epoch is January 1, 1970, at 00:00:00 UTC. Every Unix timestamp is the number of seconds since that moment. This single reference point means every timestamp on every Unix system is directly comparable -- no timezone conversion, no date format ambiguity.

```bash
# Current epoch time
$ date +%s
1741532400

# Convert epoch to human-readable
$ date -d @1741532400
Sun Mar  9 15:00:00 UTC 2026

# File modification time as epoch
$ stat -c %Y /etc/passwd
1741445612
```

The epoch is elegant because it reduces time to arithmetic. "Did event A happen before event B?" becomes "Is timestamp A less than timestamp B?" No timezone parsing. No daylight saving ambiguity. Just integers.

### 2.2 The Y2K38 Problem

On 32-bit systems, the epoch is stored as a signed 32-bit integer. The maximum value is 2,147,483,647, which corresponds to January 19, 2038, at 03:14:07 UTC. At that moment, the counter overflows and wraps to a large negative number -- interpreted as December 13, 1901.

```
Maximum 32-bit epoch:  2147483647  ->  2038-01-19 03:14:07 UTC
Overflow:              2147483648  ->  1901-12-13 20:45:52 UTC (wrap)
```

64-bit systems use a 64-bit `time_t`, which extends the range to approximately 292 billion years in both directions. The migration is ongoing -- embedded systems, firmware, and legacy databases are the primary risk. The sysadmin who reads the `time_t` size on their systems knows whether they have a 2038 problem.

### 2.3 UTC and Timezone Handling

UTC (Coordinated Universal Time) is the reference. Logs should always record UTC. Applications convert to local time for display. Storing timestamps in local time creates ambiguity during daylight saving transitions -- the hour from 01:00 to 02:00 occurs twice during the fall-back transition, making event ordering impossible without an explicit UTC offset.

```
WRONG:  2026-03-08 01:30:00 PST    (which 01:30? before or after spring-forward?)
RIGHT:  2026-03-08T09:30:00Z       (unambiguous UTC, ISO 8601)
ALSO:   2026-03-08T01:30:00-08:00  (explicit offset resolves ambiguity)
```

The IANA timezone database (`tzdata`) maps timezone names to UTC offsets for every historical date. When you set a system to `America/Los_Angeles`, the kernel consults this database to determine the current offset. The database is updated regularly as governments change their timezone rules -- and they do, sometimes with weeks of notice.

**Rule of thumb:** Store UTC. Display local. Never store local without an offset.

### 2.4 NTP -- Why Synchronized Clocks Matter

Network Time Protocol (NTP) synchronizes system clocks across a network. The protocol uses a hierarchical stratum model:

| Stratum | Source | Accuracy |
|---------|--------|----------|
| 0 | Atomic clock, GPS receiver | Nanoseconds |
| 1 | Directly connected to stratum 0 | Microseconds |
| 2 | Synchronized to stratum 1 | Milliseconds |
| 3 | Synchronized to stratum 2 | Tens of milliseconds |

Each hop adds latency and potential drift. A typical server synchronized to a public stratum 2 pool achieves accuracy within a few milliseconds -- more than sufficient for log correlation.

**Why this matters for provenance:** If two servers handle a request -- a web frontend and a database backend -- their logs must agree on when the request arrived. If server A's clock is 2 seconds fast, the database log entry appears to precede the web request that triggered it. Causality breaks. The forensic trail becomes fiction.

### 2.5 chrony vs ntpd

Two NTP implementations dominate Linux:

| Feature | chrony | ntpd |
|---------|--------|------|
| Initial sync speed | Fast (steps clock immediately) | Slow (slews gradually) |
| VM/container support | Excellent (handles clock jumps) | Poor (assumes stable hardware clock) |
| Intermittent connectivity | Handles well (stores correction state) | Struggles (needs persistent connection) |
| Memory footprint | Lower | Higher |
| Default on RHEL/Fedora | Yes (since RHEL 7) | No (legacy) |
| Default on Debian/Ubuntu | Available | Yes (default on older releases) |

```bash
# Check chrony status
$ chronyc tracking
Reference ID    : A29FC801 (time.cloudflare.com)
Stratum         : 3
Ref time (UTC)  : Sun Mar 09 14:30:00 2026
System time     : 0.000023 seconds fast of NTP time
Last offset     : +0.000012 seconds
RMS offset      : 0.000034 seconds

# Check NTP sources
$ chronyc sources
MS Name/IP address         Stratum  Poll  Reach  LastRx  Last sample
===============================================================================
^* time.cloudflare.com           2    6    377    45   +12us[  +24us] +/-   15ms
^+ pool.ntp.org                  2    6    377    44   -130us[ -118us] +/-   22ms
```

The `Last sample` column shows the measured offset between the local clock and the NTP source. An offset of 12 microseconds means the local clock is 12 millionths of a second ahead. That is provenance-grade time.

### 2.6 Leap Seconds

The Earth's rotation is not constant. It slows due to tidal friction and speeds up due to geological changes. To keep UTC aligned with solar time, the International Earth Rotation and Reference Systems Service (IERS) occasionally inserts a leap second -- an extra second at 23:59:60 UTC, typically on June 30 or December 31.

Since 1972, 27 leap seconds have been inserted. None have been negative (removing a second), though the mechanism exists.

**Why sysadmins care:** A leap second means the clock reads 23:59:59, then 23:59:60, then 00:00:00. Systems that don't handle this correctly can panic, crash, or produce duplicate timestamps. Google's solution -- "leap smearing" -- spreads the extra second across the preceding hours by running the clock slightly slow. NTP handles leap seconds via the `leap` flag in its response.

The decision to abolish leap seconds by 2035 (resolved at the 2022 General Conference on Weights and Measures) means UTC will eventually drift from solar time, but systems will no longer need to handle the discontinuity. Until then, leap seconds are a real provenance concern.

---

## 3. Filesystem Metadata

Every file on a Unix filesystem is backed by an inode -- a data structure that stores everything the kernel needs to know about that file except its name and its content.

### 3.1 The stat Command

```bash
$ stat /etc/nginx/nginx.conf
  File: /etc/nginx/nginx.conf
  Size: 2847            Blocks: 8          IO Block: 4096   regular file
  Device: 259,2           Inode: 1048623     Links: 1
  Access: (0644/-rw-r--r--)  Uid: (    0/    root)   Gid: (    0/    root)
  Access: 2026-03-09 14:00:00.000000000 +0000
  Modify: 2026-03-01 09:15:33.123456789 +0000
  Change: 2026-03-01 09:15:33.123456789 +0000
   Birth: 2025-11-20 16:42:00.000000000 +0000
```

Every field tells a story:

| Field | What it reveals |
|-------|----------------|
| Size | Exact byte count -- changes indicate content modification |
| Blocks | Disk blocks allocated -- can differ from size (sparse files, filesystem block alignment) |
| Inode | Unique identifier on this filesystem -- survives rename but not copy |
| Links | Hard link count -- if greater than 1, multiple directory entries point to this inode |
| Access (0644) | Permission bits -- who can read, write, execute |
| Uid/Gid | Owner and group -- the identity that controls the file |
| Access time | Last read (subject to `noatime`/`relatime` mount options) |
| Modify time | Last content change |
| Change time | Last metadata change (permissions, ownership, link count) |
| Birth | Creation time (if filesystem supports it -- ext4 since kernel 4.11, via `statx`) |

### 3.2 The Three Timestamps (and the One That Lies)

Unix has three traditional timestamps per file:

**atime (access time):** Updated when the file is read. On busy systems, atime updates generate enormous write I/O just to record reads. Most modern systems mount with `relatime` (update atime only if mtime is newer) or `noatime` (never update atime) for performance. This means atime is often stale or absent. The sysadmin who trusts atime without checking the mount options is reading fiction.

**mtime (modification time):** Updated when the file content changes. This is the most reliable timestamp. `ls -l` shows mtime by default. Backup tools, `make`, and rsync use mtime to determine what changed.

**ctime (change time):** Updated when the file metadata changes -- permissions, ownership, link count, or content (content changes also update ctime because they change the size metadata). **ctime is not creation time.** This is one of the most common misunderstandings in Unix administration. On Linux, ctime cannot be set by userspace -- it is always maintained by the kernel. This makes ctime the hardest timestamp to forge.

```bash
# Demonstrate the difference
$ echo "hello" > test.txt
$ stat test.txt | grep -E "Access|Modify|Change"
Access: 2026-03-09 15:00:00  # atime: set at creation
Modify: 2026-03-09 15:00:00  # mtime: content was written
Change: 2026-03-09 15:00:00  # ctime: inode was created

$ chmod 600 test.txt
$ stat test.txt | grep -E "Access|Modify|Change"
Access: 2026-03-09 15:00:00  # atime: unchanged (no read)
Modify: 2026-03-09 15:00:00  # mtime: unchanged (content didn't change)
Change: 2026-03-09 15:00:30  # ctime: UPDATED (permissions changed)

$ echo "world" >> test.txt
$ stat test.txt | grep -E "Access|Modify|Change"
Access: 2026-03-09 15:00:00  # atime: unchanged (relatime: mtime still newer)
Modify: 2026-03-09 15:01:00  # mtime: UPDATED (content changed)
Change: 2026-03-09 15:01:00  # ctime: UPDATED (size metadata changed)
```

**The forensic lesson:** mtime can be faked with `touch -m`. atime can be faked with `touch -a`. ctime cannot be directly set from userspace (short of modifying the raw filesystem). When the three timestamps disagree in suspicious ways, the sysadmin reads the truth in the discrepancy.

### 3.3 Extended Attributes (xattr)

Beyond the standard metadata, most Linux filesystems support extended attributes -- arbitrary name-value pairs attached to files. They live in the inode or in dedicated blocks and survive copy operations if the copy tool supports them (`cp --preserve=xattr`, `rsync -X`).

```bash
# Set an extended attribute
$ setfattr -n user.provenance.source -v "deploy-pipeline-v3" /etc/nginx/nginx.conf

# Read extended attributes
$ getfattr -d /etc/nginx/nginx.conf
# file: etc/nginx/nginx.conf
user.provenance.source="deploy-pipeline-v3"

# List attribute names
$ getfattr /etc/nginx/nginx.conf
# file: etc/nginx/nginx.conf
user.provenance.source
```

Extended attributes live in four namespaces:

| Namespace | Access | Purpose |
|-----------|--------|---------|
| `user.*` | Owner-controlled | Application-specific metadata |
| `system.*` | Kernel-managed | ACLs, capabilities |
| `security.*` | Security modules | SELinux labels, AppArmor profiles |
| `trusted.*` | Root only | Privileged metadata not visible to normal users |

For provenance, `user.*` attributes can carry source information, deployment tags, or classification labels that travel with the file. SELinux uses `security.selinux` to label every file with a security context that the kernel enforces on every access.

### 3.4 Inode Forensics

The inode number uniquely identifies a file within a filesystem. This has forensic implications:

- **Rename:** Changes the directory entry, not the inode. The inode number stays the same. A renamed file is the same file.
- **Copy:** Creates a new inode. The copy is a different file that happens to have the same content.
- **Hard link:** Creates a new directory entry pointing to the same inode. Both names are equally "real."
- **Move (same filesystem):** Rename. Same inode.
- **Move (across filesystems):** Copy + delete. New inode.

```bash
# Track a file across rename
$ echo "config" > app.conf
$ stat -c "%i" app.conf
1048700

$ mv app.conf app.conf.bak
$ stat -c "%i" app.conf.bak
1048700    # Same inode -- same file, different name

$ cp app.conf.bak app.conf.new
$ stat -c "%i" app.conf.new
1048701    # Different inode -- different file, same content
```

When investigating whether a file was modified or replaced, the inode number tells the truth. A deploy tool that writes a new file and moves it into place (atomic replace) changes the inode. An editor that modifies in place keeps the same inode. The difference matters for provenance.

---

## 4. Chain of Custody

In forensics, chain of custody means an unbroken record of who had control of evidence, from collection to presentation. In systems administration, the same principle applies to data: if you cannot prove that a file, log, or record has not been tampered with since it was created, its evidentiary value is zero.

### 4.1 Hash Verification

A cryptographic hash function takes input of any size and produces a fixed-size output that is:

- **Deterministic:** Same input always produces same output
- **One-way:** Cannot reverse the hash to get the input
- **Collision-resistant:** Infeasible to find two inputs that produce the same output
- **Avalanche effect:** A single bit change in input produces a completely different output

```bash
# SHA-256 hash of a file
$ sha256sum /etc/passwd
a3f2b8c1d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1  /etc/passwd

# Verify the file hasn't changed
$ sha256sum -c checksums.txt
/etc/passwd: OK

# Detect modification
$ echo "tampered" >> /etc/passwd
$ sha256sum -c checksums.txt
/etc/passwd: FAILED
sha256sum: WARNING: 1 computed checksum did NOT match
```

Hash verification proves integrity, not authenticity. It proves the file hasn't changed since the hash was computed. It does not prove who computed the hash or when. For that, you need digital signatures -- a hash encrypted with a private key that binds the integrity check to an identity.

### 4.2 Common Hash Functions

| Algorithm | Output size | Status | Use case |
|-----------|------------|--------|----------|
| MD5 | 128 bits | Broken (collision attacks since 2004) | Legacy checksums, non-security |
| SHA-1 | 160 bits | Broken (collision demonstrated 2017) | Legacy git (migrating to SHA-256) |
| SHA-256 | 256 bits | Current standard | File integrity, certificates, blockchain |
| SHA-512 | 512 bits | Current, higher margin | High-security applications |
| BLAKE3 | 256 bits | Modern, fast | Performance-critical hashing |

**Do not use MD5 or SHA-1 for security purposes.** They remain useful for quick integrity checks (download verification, build cache keys) where an adversary is not a concern. For forensic provenance, SHA-256 is the minimum.

### 4.3 Audit Logs as Evidence

The Linux audit subsystem (`auditd`) records system events at the kernel level. Unlike application logs (which a compromised application can suppress), audit logs are generated by the kernel itself and are resistant to application-level tampering.

```bash
# Who modified /etc/shadow?
$ ausearch -f /etc/shadow
----
time->Sun Mar  9 02:47:12 2026
type=PATH msg=audit(1741488432.123:456): item=0 name="/etc/shadow"
  inode=524297 dev=259:2 mode=0100640 ouid=0 ogid=42
type=SYSCALL msg=audit(1741488432.123:456): arch=c000003e syscall=257
  success=yes exit=3 a0=ffffff9c a1=7ffd12345678
  uid=0 gid=0 euid=0 comm="passwd" exe="/usr/bin/passwd"
  key="shadow_access"
```

This audit record shows:
- **When:** March 9, 2026 at 02:47:12 UTC
- **What:** The file `/etc/shadow` was opened (syscall 257 = `openat`)
- **Who:** Effective UID 0 (root), executed via `/usr/bin/passwd`
- **Result:** Success (the open succeeded, file descriptor 3 was returned)
- **Search key:** `shadow_access` (configured by the admin for easy filtering)

### 4.4 Write-Once Storage

For the highest assurance provenance, critical logs are written to storage that cannot be modified after writing. Approaches range from physical (WORM optical media) to logical (append-only filesystems, immutable S3 buckets) to cryptographic (blockchain-style hash chains where each entry includes the hash of the previous entry).

```
Entry N:   { timestamp, event, hash(Entry N-1) }
Entry N+1: { timestamp, event, hash(Entry N)   }
Entry N+2: { timestamp, event, hash(Entry N+1) }
```

Modifying any entry in the chain invalidates all subsequent hashes. This is the same principle that makes git's commit graph tamper-evident -- every commit hash includes its parent hash, creating an unbroken chain back to the initial commit.

### 4.5 The Principle

If you cannot prove when something happened, it might as well not have happened. Provenance is the difference between "I think the config was changed last Tuesday" and "The audit log shows user deploy-bot opened /etc/nginx/nginx.conf at 2026-03-05T14:22:17Z via /usr/local/bin/deploy-agent, writing 47 bytes starting at offset 312, with SHA-256 before=a3f2... and after=7bc1...". The first is a guess. The second is evidence.

---

## 5. Cache Archaeology

Caches are the accidental historians of computing. They exist for performance -- keeping frequently accessed data close to the consumer to avoid expensive re-fetches. But because caches retain copies of data that may no longer exist at the source, they become forensic artifacts. The cache remembers what the system forgot.

### 5.1 Types of Cache and Their Forensic Value

| Cache type | Location | Survives reboot | Forensic value |
|------------|----------|-----------------|----------------|
| CPU cache (L1/L2/L3) | On-die | No | None (volatile, nanosecond lifetime) |
| Page cache | RAM | No | Moderate (recently accessed file data) |
| DNS cache | RAM (systemd-resolved) | No | High (recently resolved domains) |
| ARP cache | Kernel memory | No | High (recently contacted local hosts) |
| Browser cache | Disk (`~/.cache/`) | Yes | Very high (visited sites, downloaded content) |
| Package manager cache | Disk (`/var/cache/`) | Yes | High (installed package versions, sources) |
| Build cache | Disk (project-specific) | Yes | Moderate (compilation artifacts, dependency trees) |
| Proxy cache | Disk (squid, nginx) | Yes | Very high (all proxied content with timestamps) |
| Git object cache | Disk (`.git/objects/`) | Yes | Complete (every version of every tracked file) |

### 5.2 DNS Cache

The DNS cache records which domain names were recently resolved to which IP addresses. On a system running `systemd-resolved`:

```bash
# Show cached DNS entries
$ resolvectl statistics
Current Transactions: 0
  Total Transactions: 4521
Current Cache Size: 847
          Hit Rate: 67.2%

# Dump the cache (systemd-resolved)
$ resolvectl query --cache
suspicious-domain.example.com -> 203.0.113.42 (cached 1847s ago)
api.trusted-service.com -> 198.51.100.10 (cached 312s ago)
```

A DNS cache entry for a domain that the server should never have contacted is forensic evidence. If a web server's DNS cache contains entries for `crypto-miner-pool.example.com`, something on that server resolved that name -- and it wasn't the web application.

### 5.3 ARP Cache

The ARP (Address Resolution Protocol) cache maps IP addresses to MAC addresses on the local network. It reveals which devices have communicated recently on the same network segment:

```bash
$ ip neigh show
192.168.1.1 dev eth0 lladdr aa:bb:cc:dd:ee:ff REACHABLE
192.168.1.42 dev eth0 lladdr 11:22:33:44:55:66 STALE
192.168.1.100 dev eth0 lladdr de:ad:be:ef:ca:fe DELAY
```

States tell a story: `REACHABLE` means recent communication. `STALE` means the entry is aging out. `DELAY` means the kernel is about to re-probe. A `STALE` entry for an IP that no device currently holds may indicate a device that was recently connected and then removed -- or an ARP spoofing attempt.

### 5.4 Browser Cache

The browser cache is one of the richest forensic sources on a workstation. It contains:

- Complete copies of recently viewed web pages (HTML, CSS, JavaScript)
- Images, fonts, and media files
- HTTP response headers (including server timestamps, ETags, cache-control directives)
- Cookies and session data

```bash
# Chromium cache location
$ ls ~/.cache/chromium/Default/Cache/Cache_Data/
data_0  data_1  data_2  data_3  index

# Firefox cache location
$ ls ~/.cache/mozilla/firefox/*.default-release/cache2/entries/
```

The browser cache proves not just that a URL was visited, but when, what was received, and often what the user interacted with. Even in "private browsing" mode, DNS cache entries and ARP cache entries may survive.

### 5.5 Package Manager Cache

The package manager cache records every package version that was downloaded:

```bash
# APT cache (Debian/Ubuntu)
$ ls /var/cache/apt/archives/
nginx_1.24.0-1_amd64.deb
openssl_3.0.13-1_amd64.deb

# DNF cache (Fedora/RHEL)
$ ls /var/cache/dnf/*/packages/

# npm cache
$ ls ~/.npm/_cacache/
```

These caches answer the question: "What versions were installed on this system, and when were they downloaded?" The package files contain metadata (build date, repository source, maintainer signatures) that extends the provenance chain back to the package builder.

### 5.6 Build Caches

Build systems cache intermediate artifacts to avoid redundant work. These caches are provenance goldmines:

```bash
# Rust build cache
$ ls target/debug/.fingerprint/
# Each fingerprint contains the hash of inputs that produced the artifact

# ccache (C/C++ compilation cache)
$ ccache -s
cache hit (direct)             12345
cache hit (preprocessed)        2345
cache miss                       567

# Docker layer cache
$ docker history nginx:latest
IMAGE          CREATED       SIZE    COMMENT
a3f2b8c1d4e5   2 weeks ago   142MB   nginx build layer
7bc1d2e3f4a5   2 weeks ago   80.4MB  debian:bookworm-slim base
```

Docker image layers are particularly rich provenance sources. Each layer records the exact command that created it, the parent layer hash, and the creation timestamp. `docker history` reconstructs the full build sequence.

### 5.7 The Cache as Witness

The common thread: caches are not designed as forensic tools. They are performance optimizations. But because they retain timestamped copies of data, they become witnesses to system activity. The sysadmin who knows where to look can reconstruct a timeline from cache artifacts that no application log recorded.

The flip side: caches can leak information. A DNS cache that reveals internal service names, a browser cache that contains credentials in cached API responses, a build cache that retains secrets from environment variables -- these are provenance leaks. The same property that makes caches forensically useful makes them security-sensitive. Clear caches with intention, not neglect.

---

## 6. Backup and Recovery

A backup is a copy of data made specifically so that the data can be restored if the original is lost or corrupted. This sounds obvious. It is not. The number of organizations that discover their backups are useless during an actual recovery event is staggering. A backup you have not tested is a hope, not a plan.

### 6.1 The 3-2-1 Rule

The minimum viable backup strategy:

```
3 copies of the data    (original + 2 backups)
2 different media types (local disk + cloud, or disk + tape)
1 offsite copy          (survives fire, flood, theft at the primary location)
```

This rule is decades old and still correct. The media types have changed (tape is now cloud object storage for most), but the principle has not. A single copy on the same disk is not a backup -- it is a second file that will be lost in the same failure.

### 6.2 Backup Strategies

| Strategy | How it works | Storage cost | Restore speed | Restore complexity |
|----------|-------------|--------------|---------------|-------------------|
| Full | Copy everything every time | Highest | Fastest (one archive) | Lowest |
| Incremental | Copy only what changed since last backup (any type) | Lowest | Slowest (need full + all incrementals) | Highest |
| Differential | Copy what changed since last full backup | Medium | Medium (need full + latest differential) | Medium |
| Snapshot | Filesystem-level point-in-time copy (COW) | Very low (initially) | Fastest (instant rollback) | Lowest |
| Continuous | Stream changes in real time (WAL shipping, replication) | Varies | Varies (point-in-time recovery) | Medium |

The provenance angle: each strategy has different implications for what can be recovered and from when. Incremental backups have the finest granularity -- you can recover data from any backup point. Snapshots give you exact filesystem state at a moment. Continuous replication gives you arbitrary point-in-time recovery but requires careful transaction log management.

### 6.3 Backup Tools

**rsync** -- The fundamental file synchronization tool. Transfers only the changed portions of files using a rolling checksum algorithm. The basis for many backup solutions:

```bash
# Basic rsync backup
$ rsync -avz --delete /data/ backup-server:/backup/data/

# With hard links for space-efficient snapshots
$ rsync -avz --delete --link-dest=/backup/daily.1 /data/ /backup/daily.0/
```

The `--link-dest` option creates hard links to unchanged files from the previous backup, making each backup appear to be a full copy while only consuming space for changed files. This is the foundation of rsnapshot and similar tools.

**borg** -- Deduplicating backup with compression and encryption. Designed for efficiency:

```bash
# Initialize a backup repository
$ borg init --encryption=repokey /backup/borg-repo

# Create a backup
$ borg create /backup/borg-repo::daily-2026-03-09 /home /etc /var/log

# List archives
$ borg list /backup/borg-repo
daily-2026-03-09    Sun, 2026-03-09 03:00:00 [a3f2b8c1...]
daily-2026-03-08    Sat, 2026-03-08 03:00:00 [7bc1d2e3...]

# Restore a specific file from a specific backup
$ borg extract /backup/borg-repo::daily-2026-03-08 home/user/document.txt
```

Borg's deduplication means that if the same file appears in multiple backups (or even multiple directories), it is stored only once. The provenance chain is maintained through the archive metadata -- each archive records exactly what was backed up and when.

**restic** -- Similar to borg but with native cloud storage support (S3, Azure Blob, Google Cloud Storage, SFTP). Written in Go, single binary deployment:

```bash
# Initialize a repository on S3
$ restic -r s3:s3.amazonaws.com/my-backup-bucket init

# Create a backup with tags
$ restic -r s3:s3.amazonaws.com/my-backup-bucket backup /data --tag production

# List snapshots
$ restic -r s3:s3.amazonaws.com/my-backup-bucket snapshots
ID        Time                 Host        Tags        Paths
a3f2b8c1  2026-03-09 03:00:00  webserver   production  /data
```

### 6.4 RTO and RPO

Two metrics define backup requirements:

**RPO (Recovery Point Objective):** How much data can you afford to lose? Measured in time. An RPO of 1 hour means you need backups at least every hour. An RPO of 0 means you need synchronous replication -- no data loss under any circumstance.

**RTO (Recovery Time Objective):** How quickly must the system be operational after a failure? Measured in time. An RTO of 4 hours means the entire recovery process -- detection, decision, restore, verification -- must complete within 4 hours.

```
         RPO                                RTO
         |<-------- data loss window ------->|<---- recovery time ---->|
         |                                   |                         |
    Last backup                         Failure                   Service restored
    (known good)                        occurs                    (verified working)
```

These are not technical measurements -- they are business decisions with technical implementations. The sysadmin translates "we cannot lose more than 1 hour of data" into "we need incremental backups every 30 minutes with verified offsite replication."

### 6.5 Testing Restores

The backup that has never been tested is Schrodinger's backup -- it is simultaneously working and broken until you try to restore from it. Common failure modes discovered only during restore:

- Backup contains files but database transactions are inconsistent (no `pg_dump` or WAL archiving)
- Permissions and ownership were not preserved (rsync without `-a`)
- Encryption key for the backup repository is not backed up (circular dependency)
- Restore takes 18 hours but RTO is 4 hours (never timed the process)
- Backup was running but the target disk filled up 6 months ago (no monitoring)

**Schedule regular restore tests.** Quarterly at minimum. The test must exercise the complete restore path: locate the backup, decrypt if encrypted, transfer to the target system, restore files, verify application functionality. Document the time each step takes. Compare against RTO. If the test fails or exceeds RTO, fix the backup strategy before you need it.

---

## 7. Data Lifecycle

Data has a lifecycle: it is created, used, archived, and eventually deleted. Each phase has provenance implications. The sysadmin who understands the lifecycle can manage storage costs, comply with regulations, and know when data should be preserved and when it should be let go.

### 7.1 The Lifecycle Phases

```
Creation  ->  Active Use  ->  Archive  ->  Deletion
   |              |              |              |
   |  Written,    |  Read,       |  Compressed, |  Removed,
   |  classified, |  modified,   |  moved to    |  overwritten,
   |  tagged      |  shared      |  cold storage|  verified gone
```

**Creation:** Data enters the system. Provenance begins here -- who created it, when, from what source, with what classification. If provenance is not attached at creation, it is exponentially harder to reconstruct later.

**Active use:** Data is read, modified, processed, shared. Every access and modification should generate an audit record. Active data lives on fast storage (SSD, NVMe) because access patterns demand it.

**Archive:** Data is no longer actively used but must be retained. Compressed and moved to cheaper, slower storage (object storage, tape, cold tiers). Retention policies determine how long. Metadata must be preserved so archived data can be found and restored.

**Deletion:** Data reaches end of life. Deletion must be verifiable -- the data must actually be gone, not just unlinked from the filesystem. For sensitive data, this means overwrite or physical destruction, not just `rm`.

### 7.2 Retention Policies

A retention policy specifies what data to keep, for how long, and why. Without a retention policy, organizations either keep everything forever (expensive, risky) or delete arbitrarily (compliance violation, data loss).

| Data type | Typical retention | Why |
|-----------|------------------|-----|
| System logs | 90 days to 1 year | Forensic investigation window |
| Financial records | 7 years | Tax and audit requirements |
| Medical records | 10+ years | Clinical and legal requirements |
| Access logs | 6 months to 2 years | Security investigation, compliance |
| Application data | Varies | Business requirements |
| Backup archives | 30-90 days rolling | Recovery window |

The retention period is not arbitrary -- it reflects the window during which the data might be needed for its original purpose, for compliance, or for forensic investigation.

### 7.3 GDPR and Data Rights

The European Union's General Data Protection Regulation (GDPR) and similar laws worldwide establish that individuals have rights over their personal data:

- **Right of access:** Individuals can request a copy of all personal data held about them
- **Right to rectification:** Incorrect data must be corrected on request
- **Right to erasure ("right to be forgotten"):** Individuals can request deletion of their personal data
- **Right to data portability:** Data must be provided in a machine-readable format
- **Purpose limitation:** Data can only be used for the purpose it was collected

For sysadmins, this creates a tension: provenance requires keeping records of everything, but data rights require the ability to delete records about specific individuals. The resolution is architectural -- separate audit records (which document what happened to the system) from personal data (which belongs to the individual). The audit log records "user account #4521 was deleted at 2026-03-09T14:00:00Z per erasure request #789." The personal data is gone. The provenance record remains.

### 7.4 Deletion Is Not What You Think

When you delete a file with `rm`, the filesystem removes the directory entry and marks the inode and data blocks as free. The data is still physically present on the disk until those blocks are overwritten by new data. On a lightly used filesystem, "deleted" data can persist for weeks or months.

```bash
# rm removes the directory entry, not the data
$ rm secret.txt
# The blocks containing "secret.txt" content are marked free
# but not overwritten -- data recovery tools can find them

# Secure deletion on HDD (write patterns over the blocks)
$ shred -vzn 3 secret.txt
shred: secret.txt: pass 1/4 (random)...
shred: secret.txt: pass 2/4 (random)...
shred: secret.txt: pass 3/4 (random)...
shred: secret.txt: pass 4/4 (000000)...
shred: secret.txt: removed

# On SSD, shred is unreliable due to wear leveling
# Use TRIM/discard and full-disk encryption instead
```

**SSDs complicate secure deletion.** Flash translation layers remap logical blocks to physical blocks transparently. `shred` may overwrite a different physical location than the one holding the original data. The reliable approach for SSDs: use full-disk encryption (LUKS) and destroy the key. Without the key, the data is cryptographic noise regardless of where it physically resides.

### 7.5 The Sysadmin Knows

The sysadmin understands what "deleted" means at every layer:

- Application says "deleted" -- record removed from database, maybe soft-deleted (flag set)
- Database says "deleted" -- row removed from table, space marked reusable, but WAL may still contain it
- Filesystem says "deleted" -- inode freed, blocks marked available, data physically present
- Disk says "deleted" -- blocks overwritten (HDD) or TRIMmed (SSD), but SSD wear leveling may retain copies
- Backup says "never deleted" -- the data exists in every backup made before deletion

True deletion requires addressing every layer. The data lifecycle encompasses all of them.

---

## 8. Provenance in Practice

Provenance is not an abstract concept -- it is embedded in the tools sysadmins and developers use every day. The best provenance systems are the ones you are already using without thinking of them as provenance.

### 8.1 Git as Provenance

Git is one of the most complete provenance systems ever built. Every commit contains:

| Field | Provenance function |
|-------|-------------------|
| Hash (SHA-1/SHA-256) | Unique identifier, tamper detection |
| Author | Who wrote the change |
| Committer | Who applied the change (may differ from author) |
| Timestamp | When the change was made |
| Parent hash(es) | Link to previous state, creates unbroken chain |
| Tree hash | Exact filesystem state at this point |
| Message | Human-readable description of why the change was made |
| GPG signature (optional) | Cryptographic proof of author identity |

```bash
# Full provenance of a single line
$ git blame src/config.ts
a3f2b8c1 (alice 2026-01-15 09:00:00 +0000  1) export const MAX_RETRIES = 3;
7bc1d2e3 (bob   2026-02-20 14:30:00 +0000  2) export const TIMEOUT_MS = 5000;
d4e5f6a7 (alice 2026-03-01 11:15:00 +0000  3) export const BASE_URL = "https://api.example.com";

# Full history of a file
$ git log --follow --all -- src/config.ts

# Who changed what, when, for the entire repository
$ git log --all --oneline --graph
```

`git blame` is provenance at line granularity. `git log` is provenance at file granularity. `git reflog` is provenance of the provenance -- it records every change to every reference (branch, tag, HEAD), including operations that rewrite history like rebase and reset.

The commit hash chain means you cannot alter a single bit in any commit without changing every subsequent hash. This is the same principle as the write-once log chain described in Section 4.4, but implemented in production tooling that millions of developers use daily.

### 8.2 Docker Image Layers

A Docker image is a stack of layers, each representing a filesystem change. The build process creates a provenance chain:

```dockerfile
FROM debian:bookworm-slim    # Base layer: known starting point
RUN apt-get update && \      # Layer 2: package installation
    apt-get install -y nginx
COPY nginx.conf /etc/nginx/  # Layer 3: configuration from build context
EXPOSE 80                    # Metadata: no layer created
CMD ["nginx", "-g", "daemon off;"]  # Metadata: default command
```

```bash
# Inspect image provenance
$ docker inspect nginx:latest --format='{{.RootFS.Layers}}'
[sha256:a3f2..., sha256:7bc1..., sha256:d4e5...]

# Full build history
$ docker history nginx:latest
IMAGE          CREATED         CREATED BY                                      SIZE
d4e5f6a7b8c9   2 days ago     COPY nginx.conf /etc/nginx/ # buildkit          2.85kB
7bc1d2e3f4a5   2 days ago     RUN /bin/sh -c apt-get update && apt-get...     85.2MB
a3f2b8c1d4e5   2 weeks ago    /bin/sh -c #(nop) CMD ["bash"]                  0B
```

Each layer hash is the SHA-256 of the layer content. The image manifest lists every layer in order, and the manifest itself is hashed. Changing a single byte in any layer changes its hash, which changes the manifest, which changes the image digest. Provenance is structural.

### 8.3 Package Signing

Package managers verify provenance through digital signatures:

```bash
# APT: verify package signature
$ apt-key list
# Shows trusted GPG keys for package repositories

# RPM: verify package signature and integrity
$ rpm -K nginx-1.24.0-1.el9.x86_64.rpm
nginx-1.24.0-1.el9.x86_64.rpm: digests signatures OK

# npm: check package provenance (npm 9.5+)
$ npm audit signatures
audited 847 packages in 3s
847 packages have verified registry signatures
```

The signature chain: the package maintainer signs the package with their private key. The repository signs the package index with the repository key. The system verifies both signatures before installation. If either signature fails, the installation is rejected. This chain answers: "Was this package built by who it claims and has it been modified since?"

### 8.4 Software Supply Chain

The software supply chain is the full provenance path from source code to running binary:

```
Source code (git, verified author)
    -> Build system (CI/CD, reproducible builds)
        -> Artifact (package, container image, binary)
            -> Registry (signed, indexed, versioned)
                -> Deployment (verified integrity)
                    -> Runtime (monitored, logged)
```

Supply chain attacks target any link: compromised developer accounts, poisoned build environments, tampered packages, malicious dependencies. Provenance at every stage is the defense:

- **SLSA (Supply-chain Levels for Software Artifacts):** A framework from Google that defines four levels of provenance assurance, from basic build logging (Level 1) to hermetic, reproducible builds with verified provenance (Level 4).
- **Sigstore:** An open-source project providing free code signing for the software supply chain. Uses ephemeral certificates tied to developer identity.
- **in-toto:** A framework for verifying that the entire software supply chain followed the expected steps. Each step produces a cryptographically signed attestation.

The sysadmin who deploys software without verifying its provenance is trusting every person and system in the supply chain without evidence. The sysadmin who verifies signatures, checks hashes, and monitors for unexpected changes is reading the trail.

### 8.5 SBOM -- Software Bill of Materials

A Software Bill of Materials (SBOM) lists every component in a software artifact:

```json
{
  "bomFormat": "CycloneDX",
  "specVersion": "1.5",
  "components": [
    {
      "type": "library",
      "name": "express",
      "version": "4.18.2",
      "purl": "pkg:npm/express@4.18.2",
      "hashes": [
        { "alg": "SHA-256", "content": "a3f2b8c1..." }
      ]
    }
  ]
}
```

An SBOM is provenance for dependencies. When a vulnerability is discovered in a library, the SBOM tells you immediately whether your software includes that library and which version. Without an SBOM, you are auditing manually -- or hoping.

---

## 9. The Energy Cost of Data

Storage is not free. Every byte on disk consumes physical resources: the media it occupies, the electricity to keep the drive spinning or the flash cells charged, the cooling to dissipate the heat, the network bandwidth for replication, the compute for indexing and backup. Data stewardship means understanding these costs and deciding deliberately what is worth paying for.

### 9.1 The Real Cost of a Byte

A typical enterprise storage cost chain:

```
1 TB of data stored for 1 year:

Primary storage (SSD):     $100-200/year  (fast, reliable, expensive)
Backup copy 1 (HDD):       $20-40/year   (slower, cheaper, on-site)
Backup copy 2 (cloud):     $25-60/year   (offsite, per-GB pricing)
Backup copy 3 (archive):   $5-10/year    (cold storage, retrieval fees)

Electricity for storage:    $15-30/year   (power + cooling)
Network for replication:    $10-20/year   (bandwidth between sites)
Admin time for management:  $50-100/year  (monitoring, troubleshooting)

Total cost of 1 TB:        $225-460/year

With 3 copies (3-2-1 rule): $250-550/year per TB of source data
```

These are rough numbers for illustration. The point is not the exact figures -- it is that storing data is a recurring cost, not a one-time expense. Every terabyte you keep is a decision to spend hundreds of dollars per year, every year, until you stop.

### 9.2 The Anti-Hoarding Principle

Data hoarding is the storage equivalent of junk mail: keeping things "just in case" without a clear purpose. The cost is real and cumulative:

- Every file consumes disk space, backup space, and replication bandwidth
- Every row in a database affects query performance, index size, and backup duration
- Every log line that is never read consumed CPU to write, disk to store, and bandwidth to replicate
- Every container image layer that is never pulled consumed build time, registry space, and garbage collection

**Store what serves a purpose. Delete what does not.** This is not about being aggressive with deletion -- it is about being intentional with retention. A log file that will be analyzed for security incidents serves a purpose for 90 days. After 90 days, it serves no additional purpose and should be deleted. A financial record serves a purpose for 7 years. After 7 years, it should be deleted unless a specific legal hold requires otherwise.

The retention policy (Section 7.2) is the formal expression of this principle: for each data type, define why it exists, how long it matters, and when it goes.

### 9.3 Storage Tiers

Smart data lifecycle management uses storage tiers that match cost to access patterns:

| Tier | Technology | Access time | Cost | Use case |
|------|-----------|-------------|------|----------|
| Hot | NVMe SSD | Microseconds | $$$$$ | Active databases, working sets |
| Warm | SATA SSD | Milliseconds | $$$ | Recent logs, staging |
| Cool | HDD (RAID) | Milliseconds | $$ | Archive within retention window |
| Cold | Object storage | Seconds | $ | Long-term archive, compliance |
| Glacier | Tape/deep archive | Hours | $ | Regulatory minimums, disaster recovery |

Data should move through tiers automatically based on access patterns and retention policies. A 6-month-old log file on NVMe is wasting expensive storage. The same file on cold object storage costs pennies and is still retrievable when needed.

### 9.4 The Energy Dimension

Beyond dollar cost, data storage consumes energy:

- A typical HDD consumes 6-10 watts while spinning. A rack of 36 drives: 216-360 watts, 24/7/365.
- SSDs consume less (2-5 watts each) but still add up at scale.
- Cooling typically adds 30-50% overhead on top of compute and storage power.
- Data centers account for approximately 1-2% of global electricity consumption. This is projected to grow.

The environmental cost of data hoarding is real. Keeping unnecessary data means disks spinning, fans running, generators burning fuel. The sysadmin who deletes data at end-of-life is not just saving money -- they are reducing energy consumption. The anti-waste principle applies to electrons as much as to paper.

### 9.5 Copies Are Not Free

The 3-2-1 rule is essential for critical data. But not all data is critical. Applying 3-2-1 to every byte in the organization triples the storage cost:

```
Source data: 100 TB
With 3-2-1: 300 TB minimum (3 copies) + overhead

At $300/TB/year average: $90,000/year

If 40% of that data is stale (past retention):
  Unnecessary cost: $36,000/year
  Unnecessary energy: proportional
```

Provenance metadata helps here: knowing when data was created, when it was last accessed, and what its classification is allows automated tiering and deletion. Data that has not been accessed in 6 months moves to cold storage. Data past its retention period is deleted. The provenance trail enables the stewardship.

### 9.6 The Stewardship Balance

The sysadmin balances two imperatives:

1. **Preserve what matters.** Provenance data, audit logs, business records, backup archives within their retention window. These serve a purpose. Pay the cost.

2. **Release what does not.** Stale caches, expired logs, redundant copies, orphaned data. These consume resources without serving a purpose. Let them go.

This is not minimalism for its own sake. It is stewardship -- knowing the cost of what you keep and deciding it is worth paying. The same principle that says "a backup you haven't tested is a hope" also says "a terabyte you haven't justified is waste."

---

## 10. Cross-References

### Internal Module References

- **[Module 03: The Logs](03-the-logs.md)** -- Log provenance, timestamp correlation, structured logging as the primary audit trail. Logs are the narrative record of what happened; provenance proves the narrative is genuine.
- **[Module 04: Process Forensics](04-process-forensics.md)** -- Process timelines, resource usage over time, the forensic value of process accounting. Every process has a birth time, a lifetime, and a death -- provenance tracks all three.
- **[Module 07: Security Operations](07-security-operations.md)** -- Forensic evidence collection, integrity verification, chain of custody in incident response. Security events are only useful if their provenance is intact.

### Cross-Series References

- **[LED Module 7: Measurement & Test](../LED/research/m7-nyquist-sampling.md)** -- Measurement provenance and Nyquist sampling. The same principle applies to data provenance: if you sample too infrequently, you miss events. Log rotation that is too aggressive is under-sampling your system's behavior.

### Glossary Links

Key terms used in this module are defined in the [Glossary](00-glossary.md): Provenance, Timestamp, Epoch, NTP, Chain of custody, Checksum, Hash, Cache, mtime/ctime/atime, Inode.

---

## 11. Sources

### Standards and Specifications

1. **NIST SP 800-86** -- "Guide to Integrating Forensic Techniques into Incident Response." National Institute of Standards and Technology, 2006. Defines chain of custody requirements for digital evidence. https://csrc.nist.gov/publications/detail/sp/800-86/final

2. **POSIX.1-2017 (IEEE Std 1003.1-2017)** -- Portable Operating System Interface. Defines filesystem metadata, timestamps (atime, mtime, ctime), and file operations. The formal specification for Unix filesystem behavior. https://pubs.opengroup.org/onlinepubs/9699919799/

3. **RFC 5905** -- "Network Time Protocol Version 4: Protocol and Algorithms Specification." Mills, D., et al., 2010. The NTP specification governing clock synchronization. https://www.rfc-editor.org/rfc/rfc5905

4. **ISO 8601:2019** -- "Date and time — Representations for information interchange." The international standard for timestamp formatting. Unambiguous, sortable, timezone-aware.

5. **RFC 5424** -- "The Syslog Protocol." Gerhards, R., 2009. Defines structured syslog message format including timestamp requirements. https://www.rfc-editor.org/rfc/rfc5424

### Tools and Documentation

6. **Git Documentation** -- "Git Internals." https://git-scm.com/book/en/v2/Git-Internals-Git-Objects -- Detailed explanation of git's content-addressable storage, commit objects, and cryptographic hash chains.

7. **Linux Audit Documentation** -- "Linux Audit Subsystem." https://github.com/linux-audit/audit-documentation -- Configuration and usage of the kernel audit framework (`auditd`, `ausearch`, `aureport`).

8. **chrony Documentation** -- "chrony - NTP Implementation." https://chrony-project.org/documentation.html -- Configuration and operation of chrony for time synchronization.

9. **Borg Backup Documentation** -- https://borgbackup.readthedocs.io/ -- Deduplicating, encrypting backup tool with provenance-preserving archive metadata.

10. **Restic Documentation** -- https://restic.readthedocs.io/ -- Cross-platform backup tool with native cloud storage support and content-addressable storage.

### Supply Chain and Provenance Frameworks

11. **SLSA (Supply-chain Levels for Software Artifacts)** -- https://slsa.dev/ -- Framework for end-to-end software supply chain integrity, defining four provenance assurance levels.

12. **Sigstore** -- https://www.sigstore.dev/ -- Open-source project providing keyless code signing and verification for software supply chain security.

13. **CycloneDX SBOM Specification** -- https://cyclonedx.org/ -- Open standard for Software Bill of Materials, enabling component-level provenance tracking.

14. **in-toto** -- https://in-toto.io/ -- Framework for securing the integrity of software supply chains through cryptographic attestations.

### Data Protection and Compliance

15. **GDPR (General Data Protection Regulation)** -- Regulation (EU) 2016/679. Establishes data subject rights including access, rectification, erasure, and portability. Official text: https://eur-lex.europa.eu/eli/reg/2016/679/oj

16. **NIST SP 800-88 Rev. 1** -- "Guidelines for Media Sanitization." National Institute of Standards and Technology, 2014. Defines methods for secure data deletion across media types (HDD, SSD, tape). https://csrc.nist.gov/publications/detail/sp/800-88/rev-1/final

### Further Reading

17. **Simson L. Garfinkel** -- "Digital Forensics Research: The Next 10 Years." *Digital Investigation*, Vol. 7, 2010. Survey of forensic techniques including filesystem metadata analysis and cache forensics.

18. **CGPM Resolution 4 (2022)** -- "On the use of UTC." General Conference on Weights and Measures, 27th meeting. Decision to revise UTC to eliminate leap seconds by 2035. https://www.bipm.org/en/cgpm-2022/resolution-4

---

*Every bit leaves a trail. The sysadmin reads the truth in timestamps, hashes, and metadata. The chain of custody is not paperwork -- it is the difference between knowing what happened and guessing. Provenance is not about paranoia. It is about stewardship: treating data with the same care you would give to any resource that has a real cost to create, store, and maintain.*
