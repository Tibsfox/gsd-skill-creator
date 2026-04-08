---
title: "Persistent RAM Disk Design for the LTM Memory Subsystem"
module: 07
mission: LTM — Long-Term Memory Architecture
date: 2026-04-08
status: design
author: Foxy + Claude (artemis-ii branch)
depth: systems-engineering
related:
  - 01-memory-tiers.md
  - 02-lod-architecture.md
  - 05-chroma-vector-store.md
  - 06-postgres-tier.md
---

# Persistent RAM Disk Design for the LTM Memory Subsystem

> *"The disk is lying to us. Every time we open a memory file we pay 12 ms to seek something the kernel already has in cache. Every time we save one, we pay 30 ms to convince `fsync` that durability happened. We have 46 GB of available RAM and a system that has stayed online for weeks at a time. It is time to stop pretending the disk is the ground truth."*

This module is the detailed systems-engineering design for a **persistent, dynamically-growing RAM disk** layered underneath gsd-skill-creator's six-tier memory architecture. It is the most concrete deliverable of the LTM mission because it is the change the user explicitly asked for: a managed slice of `/dev/shm` that behaves like a durable filesystem from the application's perspective, while running at memory speed.

The design philosophy is deliberately boring. We do not invent a new filesystem. We do not write a new database. We compose proven Linux primitives — tmpfs, rsync, inotify, systemd mount units, cgroup v2 memory accounting — into a tier that absorbs the current storage thrashing, persists on a disciplined cadence, and recovers cleanly after either a warm or cold boot.

## 1. System Context (Measured, Not Assumed)

Before any design, the target machine was measured directly. These are facts, not hypotheses:

| Property                 | Value                                                        |
| ------------------------ | ------------------------------------------------------------ |
| Kernel                   | Linux 6.17.0-19-generic (Ubuntu 6.17)                        |
| Total RAM                | 62 GiB (`MemTotal: 63423056 kB`)                              |
| MemFree                  | ~12 GiB                                                      |
| MemAvailable             | ~44–46 GiB                                                   |
| Buffers + Cached         | ~38 GiB                                                      |
| Swap                     | 2 GiB total, ~1.5 GiB used (noticeable pressure)             |
| `/dev/shm`               | tmpfs, **31 GiB** capacity, 63 MB used (~0 %)                |
| `/tmp`                   | tmpfs, 31 GiB capacity, 7 GiB used (23 %)                    |
| `vm.swappiness`          | 60 (default Ubuntu)                                          |
| `vm.overcommit_memory`   | 0 (heuristic)                                                |
| `vm.overcommit_ratio`    | 50                                                           |
| `vm.dirty_ratio`         | 20                                                           |
| `vm.dirty_background_ratio` | 10                                                        |
| `vm.dirty_expire_centisecs` | 3000 (30 s)                                              |
| `vm.dirty_writeback_centisecs` | 500 (5 s)                                             |
| systemd                  | 257.9 (very recent)                                          |
| rsync                    | available                                                    |
| inotify-tools            | not yet installed (trivial to add)                           |
| System uptime pattern    | user: *"stable and stays online for long periods"*           |

Two observations shape everything that follows:

1. **We do not need to create a new mount.** `/dev/shm` is already a 31 GiB tmpfs with essentially nothing on it (63 MB, all PostgreSQL shared-memory scratch). The question is not "how do we provision a RAM disk" — it is "how do we carve out a managed subdirectory inside existing tmpfs and give it persistence semantics."

2. **Swap pressure is real and small.** The system is using 1.5 GiB of its 2 GiB swap. That is a warning, not a crisis. It means that whatever we put in the RAM disk competes with the working set of everything else, and if we size it recklessly we will push anonymous pages out to swap. Our sizing policy must be reactive, not greedy.

## 2. Requirements (From the User, Verbatim)

- Start with **at least 4 GiB** of RAM disk capacity for memory-subsystem use.
- **Grow dynamically in 4 GiB chunks** as fill level approaches capacity.
- **Persist changes to local disk** between sessions — the RAM disk must not lose data when the process or the machine restarts.
- **Persist at other idle points during the day** — not just on shutdown.
- **Leverage system stability.** The target is not crash-sensitive. A few minutes of lost writes on an unplanned power event is acceptable; we are not building a financial ledger.

Unwritten but implied:

- The subsystem must **never OOM-kill the host** or destabilise other services. A memory cache that takes down the workstation is worse than a slow cache.
- Recovery after a reboot should be **automatic and fast**, not a manual dance.
- The design should be **observable** so we know whether it is actually helping.

## 3. Choice of Filesystem: tmpfs, and Why Not the Alternatives

There are four defensible options. We evaluated each on a small number of axes.

| Option                    | Persistence semantics            | Sizing      | Swap aware | Compression | Complexity | Verdict for us |
| ------------------------- | -------------------------------- | ----------- | ---------- | ----------- | ---------- | -------------- |
| **tmpfs**                 | Volatile, sync on cadence        | Soft cap, can be remounted larger | Yes — pages can be swapped out | No | Low        | **Chosen**     |
| ramfs                     | Volatile, no size cap at all    | **Unbounded** — can OOM the host | No — pinned in RAM | No | Low        | Rejected       |
| zram (compressed block)   | Volatile unless backed            | Fixed at create | N/A, competes with page cache | Yes (LZ4/ZSTD) | Medium    | Rejected for *data* tier; considered for swap |
| tmpfs loop-mounted ext4   | Persistent through `cp` of image | Fixed at image creation | Yes | No | High | Rejected |

**Why tmpfs wins:**

- **It already exists on the box.** `/dev/shm` is tmpfs, 31 GiB, 63 MB used. We can start tomorrow without root-level mount changes.
- **It respects memory pressure.** If the kernel needs RAM for a real workload, tmpfs pages can be moved to swap. That is *exactly* the graceful degradation we want: slower, not dead. Our swap is currently only 2 GiB, which bounds how much we can bleed out — a fact we will revisit in §10.
- **It supports online resize.** `mount -o remount,size=8G /mnt/tmpfs-target` changes the size cap without losing data and without unmounting. This is the primitive that makes the "grow in 4 GiB chunks" requirement trivially satisfiable.
- **It plays nicely with systemd.** Mount units, path units, timers — everything we need is in systemd 257 already.

**Why not ramfs:**

ramfs is fast but it has no size cap and its pages are not on the LRU list. A runaway write loop fills ramfs until the OOM killer hunts for victims, and those victims will be *whatever else is running*, not ramfs itself. This is a foot-gun we decline to load. See the [JamesCoyle comparison](https://www.jamescoyle.net/knowledge/951-the-difference-between-a-tmpfs-and-ramfs-ram-disk) and the [RAM disk notes](https://helpful.knobs-dials.com/index.php/RAM_disk_notes).

**Why not zram (for the data tier):**

zram is wonderful for compressed swap and for low-RAM systems. On this box we have the opposite problem: we have 45 GiB available. Paying CPU cycles to compress every write to a vector index we immediately want to query back is a bad trade. [Gentoo wiki on zram](https://wiki.gentoo.org/wiki/Zram) and [Arch wiki on zram](https://wiki.archlinux.org/title/Zram) both frame zram primarily as an alternative to swap — not as a persistence layer. We may later configure zram-backed swap as a *secondary* safety net so that any tmpfs eviction stays in compressed memory rather than hitting NVMe.

**Why not loop-ext4-in-tmpfs:**

This gives you an ext4 image mountable as a block device. It sounds persistent ("I can just copy the image file!"), but it layers two filesystems where one suffices, adds ext4 journaling overhead inside what is already RAM, and makes growth awkward (resize2fs dance). The only reason to do it is if you need POSIX features tmpfs lacks — and tmpfs supports everything we need.

**Decision:** **tmpfs, inside `/dev/shm`, managed subdirectory.**

## 4. Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         Application: src/memory/*                       │
│                                                                         │
│  service.ts  ──────┐                                                    │
│                    ▼                                                    │
│   ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐        │
│   │LOD 100  │  │LOD 200  │  │LOD 300  │  │LOD 350  │  │LOD 400  │        │
│   │ram-cache│  │index    │  │files    │  │chroma   │  │postgres │        │
│   │(in-proc)│  │(JSON)   │  │(md+yaml)│  │(HNSW)   │  │(pg_store│        │
│   └─────────┘  └────┬────┘  └────┬────┘  └────┬────┘  └────┬────┘        │
│        │            │             │             │            │          │
│        │     RAM-disk-aware store wrappers (path-indirect)   │          │
│        │            │             │             │            │          │
└────────┼────────────┼─────────────┼─────────────┼────────────┼──────────┘
         │            │             │             │            │
         │  pinned    │  symlink    │  symlink    │  symlink   │  unchanged
         │  in-proc   ▼             ▼             ▼            ▼
         │      ┌─────────────────────────────────────────┐  ┌──────────┐
         │      │    /dev/shm/gsd-ramdisk/   (tmpfs)     │  │PostgreSQL│
         │      │  ┌─────────────────────────────────┐    │  │shared buf│
         │      │  │ .generation   (monotonic UUID) │    │  │ on NVMe  │
         │      │  │ index/        LOD 200 files     │    │  └──────────┘
         │      │  │ mem/          LOD 300 .md store │    │
         │      │  │ chroma/       LOD 350 HNSW+sqlite│   │
         │      │  │ wal/          pre-sync journal  │    │
         │      │  │ snapshots/    periodic tarballs │    │
         │      │  └─────────────────────────────────┘    │
         │      │       size cap: 4 GiB → 8 → 12 → 16    │
         │      │       remount,size=NG on growth trigger│
         │      └─────────────────┬───────────────────────┘
         │                        │
         │                        │ write-behind
         │                        ▼
         │      ┌─────────────────────────────────────────┐
         │      │    ~/.local/share/gsd-ramdisk-store/   │
         │      │         (NVMe / persistent disk)        │
         │      │  ┌─────────────────────────────────┐    │
         │      │  │ live/        mirror of /dev/shm │    │
         │      │  │ snapshots/   rotated tarballs   │    │
         │      │  │ wal-archive/ replayed journals  │    │
         │      │  │ .last-sync   timestamp marker   │    │
         │      │  └─────────────────────────────────┘    │
         │      └─────────────────────────────────────────┘
         │                        │
         │                        ▼
         │      ┌─────────────────────────────────────────┐
         │      │  systemd units                           │
         │      │  - gsd-ramdisk.mount                     │
         │      │  - gsd-ramdisk-sync.service              │
         │      │  - gsd-ramdisk-sync.timer  (5 min)       │
         │      │  - gsd-ramdisk-snapshot.timer (1 h)      │
         │      │  - gsd-ramdisk-guard.service             │
         │      └─────────────────────────────────────────┘
         ▼
    Crash-safe for
    everything except
    LOD 100
```

The critical insight in the diagram is that **LOD 400 (PostgreSQL) is unchanged**. PostgreSQL has its own shared buffers, WAL, and fsync semantics — it does not want to live in tmpfs and we do not want to fight it. The RAM disk serves the tiers *above* the database, which is where the storage thrashing actually lives.

## 5. Which Tiers Live Where

This is the single most important table in the document. It answers: *for each tier, where is its authoritative copy at steady state?*

| Tier      | What it stores                           | Authoritative location      | In RAM disk? | Sync cadence to NVMe      | Loss on power-off? |
| --------- | ---------------------------------------- | --------------------------- | ------------ | ------------------------- | ------------------ |
| LOD 100   | In-process LRU of hot records            | Process heap                | No (already RAM) | N/A                   | Yes, acceptable    |
| LOD 200   | Global keyword + tag index (JSON shards) | `/dev/shm/gsd-ramdisk/index/` | **Yes**     | 5 min + on-idle           | Rebuildable from LOD 300 |
| LOD 300   | Markdown files with YAML frontmatter     | `/dev/shm/gsd-ramdisk/mem/`   | **Yes**     | 5 min + inotify-coalesced | **Primary data — must persist** |
| LOD 350   | ChromaDB HNSW index + sqlite metadata    | `/dev/shm/gsd-ramdisk/chroma/`| **Yes — biggest winner** | 15 min + on idle | Rebuildable from LOD 300 embeddings |
| LOD 400   | PostgreSQL full corpus + vector mirror   | `~/.local/share/.../pgdata`   | No           | Native PG fsync            | Safe — PG's problem |
| LOD 500   | Cold corpus (archives, blobs)            | NVMe                          | No           | N/A                        | Safe               |

Some notes on this table:

- **LOD 350 is the biggest winner.** ChromaDB keeps its HNSW index in memory during queries [per Chroma's own docs](https://docs.trychroma.com/guides/deploy/performance), but it still persists to a sqlite file and a set of index files. Every insert round-trips through that sqlite WAL. Moving the persist directory into tmpfs means those writes are memory writes, and Chroma's own in-memory HNSW never has to race with a spinning disk. For a corpus of tens of thousands of embeddings — Chroma estimates ~1 GB for 50k papers at 1536 dimensions — the whole working set fits comfortably inside a 4 GiB budget.
- **LOD 300 is the canonical source of truth.** If we lose the vector index we can rebuild it by re-embedding the markdown. If we lose the markdown files we have lost user content. Therefore LOD 300's sync discipline is the strictest and its recovery path is the shortest.
- **LOD 400 stays on NVMe.** PostgreSQL has decades of engineering around fsync, WAL, and checkpointing. Putting its data directory on tmpfs would be textbook malpractice. But because it keeps its own buffer pool, PG already *acts like* a RAM cache for the queries that hit it — we do not need to help it.

## 6. Mount Layout and Options

The managed tmpfs directory lives at `/dev/shm/gsd-ramdisk/`. It is **not** a new mount — it is a subdirectory of the existing `/dev/shm` tmpfs, treated by our code as if it were a mount point.

However, for sizing control, we override it with a dedicated tmpfs mount using a systemd mount unit. This gives us:

- An independent `size=` cap separate from `/dev/shm` (which defaults to 50 % of RAM)
- A distinct entry in `/proc/mounts` so metrics can isolate our tier
- An `OOMScoreAdjust` and cgroup handle per §10

**Proposed mount options (initial):**

```
Type=tmpfs
Where=/dev/shm/gsd-ramdisk
Options=size=4G,mode=0700,nosuid,nodev,noexec,uid=1000,gid=1000
```

Why these:

- `size=4G` — the starting budget. Grows via remount (§7).
- `mode=0700` — user-private. Not readable by other local users. See §11 on security.
- `nosuid,nodev,noexec` — standard hardening; no reason to execute anything from here.
- `uid=1000,gid=1000` — the `foxy` user owns everything. No sudo required for normal writes.
- Not setting `noswap` — we *want* this tier to be swappable under extreme pressure. It is our graceful degradation valve.

**Mount unit** (`/etc/systemd/system/dev-shm-gsd\x2dramdisk.mount`):

```ini
[Unit]
Description=gsd-skill-creator RAM disk tier (tmpfs, managed subtree)
Documentation=file:///path/to/projectGSD/dev-tools/artemis-ii/www/tibsfox/com/Research/LTM/research/07-persistent-ramdisk-design.md
After=local-fs.target
Before=gsd-ramdisk-restore.service

[Mount]
What=tmpfs
Where=/dev/shm/gsd-ramdisk
Type=tmpfs
Options=size=4G,mode=0700,nosuid,nodev,noexec,uid=1000,gid=1000

[Install]
WantedBy=multi-user.target
```

## 7. Growth Policy: "4, 8, 12, 16 — then ask me"

The user asked for 4 GiB start with 4 GiB growth chunks. The rule is monotonic — we grow, we do not shrink (see §8). The trigger is a watermark on *used* space, measured against *capacity*.

**Thresholds:**

| State       | Used       | Action                                   |
| ----------- | ---------- | ---------------------------------------- |
| Comfortable | < 60 %     | Nothing                                  |
| Watching    | 60 – 75 %  | Log warning, accelerate sync cadence     |
| Pressure    | 75 – 85 %  | Emit Prometheus alert, schedule growth   |
| Growing     | ≥ 85 %     | Execute `remount,size=+4G`               |
| Capped      | 16 GiB cap | Emit hard alert, refuse new LOD 350 inserts, continue LOD 300 writes |

**Growth operation** (idempotent, scripted):

```bash
# gsd-ramdisk-grow.sh — called by guard service on threshold cross
CURRENT=$(findmnt -no SIZE -B /dev/shm/gsd-ramdisk)
NEW=$((CURRENT / 1024 / 1024 / 1024 + 4))   # add 4 GiB
if [ "$NEW" -gt 16 ]; then
  logger -t gsd-ramdisk "refusing to grow beyond 16G cap"
  exit 1
fi
mount -o remount,size=${NEW}G /dev/shm/gsd-ramdisk
logger -t gsd-ramdisk "grew to ${NEW}G"
```

`mount -o remount,size=NG` is the operative primitive and it is lossless: existing data in the tmpfs stays in place, the size cap changes, that's it. This matches the [baeldung tmpfs size dynamics](https://www.baeldung.com/linux/tmpfs-size-dynamics) and the [tmpfs(5) man page](https://man7.org/linux/man-pages/man5/tmpfs.5.html).

**Growth safety interlock:** before growing, we check `MemAvailable` from `/proc/meminfo`. If `MemAvailable` minus the proposed new cap would be less than 8 GiB (a fixed headroom for the rest of the system), we **refuse to grow** and instead accelerate sync-then-evict. This is the discipline that keeps us from pushing the host into swap death.

```
should_grow = used_pct >= 85
        and  (MemAvailable - new_cap) >= 8 GiB
        and  current_cap < 16 GiB
        and  swap_used < 80%
```

The last condition — "do not grow if swap is already stressed" — is our hard stop. On this host, with 1.5 GiB of 2 GiB swap already used, we would actually decline to grow from 4 → 8 today without first addressing swap (see §10).

## 8. Shrink Policy: "We Don't"

The short version: **we do not shrink at runtime.**

Why:

1. `mount -o remount,size=smaller` only works if the currently resident data fits in the new size. Otherwise it fails. This means shrinking requires first evicting, which is exactly the work LRU in LOD 100 and deletions in LOD 300 already do at the data layer.
2. Memory that was once given to tmpfs and has since been freed is already reclaimable by the kernel — the size cap is a *cap*, not an allocation. Lowering the cap does not give you memory you did not already have.
3. Every shrink is a new failure mode. We do not want failure modes.

The one exception is **at cold start**: if we restart the system and the restored data fits in 4 GiB, the mount unit starts at 4 GiB. That is not "shrinking," that is "starting fresh at baseline."

## 9. Persistence: Write-Behind, Not Write-Through

The core choice in any RAM-disk-with-persistence design is *when* RAM gets flushed to durable storage. We evaluated the four standard strategies:

### 9.1 Periodic rsync (simple, reliable)

A timer fires every N minutes; `rsync -a --delete --link-dest=<prev>` mirrors `/dev/shm/gsd-ramdisk/live/` to `~/.local/share/gsd-ramdisk-store/live/`. Between runs, all writes are in RAM only. Loss window = N minutes.

**Pros:** Trivial. Uses existing tools. Incremental via `--link-dest` for historical snapshots. Every linux admin can debug it.
**Cons:** Fixed cadence means idle bursts and peak bursts get the same treatment. A flurry of writes right before a crash loses them all.

### 9.2 inotify-driven event sync (immediate, complex)

An `inotifywait` daemon (or a systemd `.path` unit) watches `/dev/shm/gsd-ramdisk/` for close_write, moved_to, and delete events and triggers an incremental rsync within seconds.

**Pros:** Near-zero loss window (seconds).
**Cons:** Event storms during bulk imports. Coalescing logic needed (tools like `lsyncd` do this — see [computingforgeeks on lsyncd](https://computingforgeeks.com/rsync-lsyncd-file-sync-linux/)). Risk of falling behind.

### 9.3 Journal-based (write-ahead log)

Every write goes first to an append-only journal on NVMe (`wal/000001.jrnl`), then into tmpfs. A background process compacts the journal into the mirror. Recovery = replay journal.

**Pros:** Zero loss. This is what PostgreSQL does.
**Cons:** We are *reintroducing* the very disk writes we are trying to avoid. Also: implementing WAL correctly is a substantial engineering project and we have PG for things that actually need WAL.

### 9.4 Snapshot-based (periodic tarball)

Every hour, `tar` the tmpfs contents into a timestamped archive on NVMe. Keep the last N. Recovery = extract latest.

**Pros:** Atomic. Easy to reason about. Good for disaster recovery.
**Cons:** Coarse — one tarball per hour. Slow on large state. Not a primary sync, but a good **secondary**.

### 9.5 Recommendation: A Hybrid

We run **9.1 + 9.4 in tandem, with 9.2 as opt-in for LOD 300 only.**

- **Primary sync:** rsync every **5 minutes** from `/dev/shm/gsd-ramdisk/live/` to `~/.local/share/gsd-ramdisk-store/live/`, with `--delete` so deletes propagate. This is cheap because rsync only touches changed files.
- **Idle sync:** a `.path` unit watches `/dev/shm/gsd-ramdisk/.dirty` — the application touches this sentinel file after every batch of writes, and an aggressive 30-second path unit syncs when the system is idle (see [systemd.path docs](https://www.freedesktop.org/software/systemd/man/systemd.path.html)). This closes the "write a lot, then walk away" gap without spamming during active work.
- **Snapshot:** every **60 minutes** (and on clean shutdown), tar the `live/` tree into `snapshots/gsd-ramdisk-YYYYMMDD-HHMM.tar.zst`. Retain last 24. These are our disaster-recovery anchors.
- **LOD 300 inotify fast path (optional):** for markdown file writes specifically — because they are the canonical user-content tier — we can layer a tiny inotify watcher that copies any `mem/*.md` modification directly to the mirror within seconds. LOD 200, 350 do not need this; they are rebuildable.

**Worst-case loss window:** 5 minutes (primary cadence), bounded by the idle-sync path which typically closes the gap within 30 seconds of true idle.

**Sync command (core):**

```bash
rsync --archive \
      --delete \
      --inplace \
      --no-whole-file \
      --human-readable \
      --stats \
      /dev/shm/gsd-ramdisk/live/ \
      ~/.local/share/gsd-ramdisk-store/live/
```

`--inplace` avoids the rename dance on large files like the ChromaDB sqlite. `--no-whole-file` forces the delta algorithm even on local transfers, which is a *win* for the append-mostly chroma sqlite WAL.

## 10. Memory Pressure and OOM: The Defensive Layer

This is where a bad design kills the workstation. We take it seriously.

**Threats:**

1. **tmpfs fills past cap → writes fail.** Acceptable, detectable, loud.
2. **tmpfs fills near host RAM exhaustion → swap storm.** We already saw swap at 75 % used on the live system. Another 4 GiB of tmpfs fill on top is enough to push the box into swap death.
3. **OOM killer selects the wrong victim.** On a modern Ubuntu 6.17 kernel with systemd 257 and `systemd-oomd` active, this is actually less scary than it used to be, but still worth guarding.

**Countermeasures:**

### 10.1 Cgroup v2 memory accounting on the sync service

The `gsd-ramdisk-sync.service` runs under a slice with a hard `MemoryMax=` so that if rsync itself runs wild (big copy storm), it gets killed before touching the rest of the system.

```ini
[Service]
Slice=gsd-ramdisk.slice
MemoryMax=512M
MemorySwapMax=0
OOMScoreAdjust=500
```

### 10.2 Protect the application process, not the data

Counter-intuitive but correct: we do **not** set `OOMScoreAdjust=-1000` on the application. An immune process is an immune leak. Instead we set a mild negative (`-200`) so the app is unlikely to be first, but still killable.

tmpfs itself is not a process — it cannot be OOM-killed. What gets killed is a *user* of the RAM. If the kernel decides to reclaim memory, it will first page tmpfs to swap (we deliberately did not set `noswap`), then start killing.

### 10.3 systemd-oomd integration

systemd 257 ships `systemd-oomd` which reacts to PSI (pressure stall information) *before* the kernel OOM killer fires. We enable it and add our slice to its watch list with a `ManagedOOMSwap=kill` policy on our slice and `ManagedOOMSwap=auto` elsewhere. This means if swap thrash hits a PSI threshold, our tier is pruned first — exactly the correct priority.

### 10.4 The "do not grow" interlock from §7

Reiterated because it matters: we check `MemAvailable` and swap pressure *before* every growth event. If growing would starve the host, we refuse and instead trigger an emergency sync followed by an application-level eviction pass on LOD 350 (drop the in-process HNSW cache, let it reload from disk lazily).

### 10.5 Pre-emptive swap expansion

Today the host has only 2 GiB of swap. For a design that deliberately uses swap as a pressure valve, that is too small. We recommend creating an **8 GiB zram-backed swap device** — separate from the tmpfs data tier — so that under pressure we have compressed memory swap to bleed into instead of NVMe. This is the one place zram earns its keep in our design. [ArchWiki zram](https://wiki.archlinux.org/title/Zram) has the recipe.

```bash
# /etc/systemd/zram-generator.conf
[zram0]
zram-size = min(ram / 4, 8192)
compression-algorithm = zstd
swap-priority = 100
```

## 11. Security

`/dev/shm/gsd-ramdisk/` is mode 0700, owned by the user. This is stronger than `/dev/shm` default (1777 like `/tmp`). Three concerns:

1. **Other local users cannot read it.** 0700 handles that.
2. **Memory dumps could leak it.** Not unique to this tier; the same is true of every process's heap. Accept.
3. **Encryption at rest?** *Not at the tmpfs layer.* Full-disk encryption on the NVMe mirror gives us cold-storage protection. Adding dm-crypt inside tmpfs would be a complexity-cost without a threat model to justify it. If a specific memory tier contains credentials, it should not be in a generalist cache anyway — use the project's existing secrets handling.

Per-user vs multi-user: the machine is single-user (`foxy`). Per-user tmpfs inside `/run/user/1000/` is another option, but it is capped by `logind.conf RuntimeDirectorySize` which defaults to 10 % of RAM. We prefer the dedicated `/dev/shm` subtree because it is independently sizable and survives logout.

## 12. Recovery Procedure

Three recovery scenarios, ranked by likelihood:

### 12.1 Warm reboot (planned)

1. Application signals pre-shutdown.
2. A final rsync + snapshot runs.
3. System reboots.
4. `gsd-ramdisk.mount` starts at 4 GiB cap.
5. `gsd-ramdisk-restore.service` runs **after** the mount and **before** the application. It `rsync`s from `~/.local/share/gsd-ramdisk-store/live/` back into `/dev/shm/gsd-ramdisk/live/`.
6. If the restored size exceeds 80 % of the 4 GiB cap, the restore service triggers a growth step *before* marking itself complete, so the app never sees a too-small tmpfs.
7. Application starts, opens its tiers, finds them all present.

### 12.2 Cold reboot (unclean)

Same as warm, with one difference: the last rsync did not happen. We lose up to 5 minutes of writes to LOD 300 files that did not also get caught by the LOD 300 inotify fast-path (which is why the fast-path is worth the complexity for markdown).

Recovery walks the mirror. For any file in the mirror with a newer mtime than the last-successful-sync timestamp (`.last-sync`), it is reloaded. For any LOD 350 state that looks corrupt (missing sqlite, partial HNSW bin), we delete the tmpfs copy and let ChromaDB **rebuild from LOD 300 embeddings**. This costs a few minutes of CPU and is idempotent.

### 12.3 Catastrophic (mirror corrupted or lost)

Fall back to the last hourly snapshot. Extract the tarball into the tmpfs tree. Re-embed missing LOD 350 state from LOD 300. If snapshots are *also* gone, we fall back one tier further: LOD 400 PostgreSQL still has the canonical record of every memory object, and the corpus in LOD 500 has the raw material. The path is slow (tens of minutes for a rebuild) but *lossless* up to the last successful LOD 400 commit.

### 12.4 Recovery sequence diagram

```
boot ──▶ dev-shm-gsd\x2dramdisk.mount
          │
          ▼
        gsd-ramdisk-restore.service
          │
          ├─▶ verify mirror integrity (checksums of index + manifest)
          │       │
          │       ├── ok ──▶ rsync mirror → tmpfs
          │       │                │
          │       │                ▼
          │       │           grow if >80% on 4G
          │       │                │
          │       │                ▼
          │       │           touch .ready
          │       │
          │       └── bad ─▶ extract latest snapshot ─▶ rsync ─▶ .ready
          │                            │
          │                            └── no snapshots ─▶ emergency
          │                                                 rebuild
          │                                                 from LOD 400
          ▼
        gsd-app.service (ConditionPathExists=/dev/shm/gsd-ramdisk/.ready)
```

## 13. Systemd Units

The full set of units. These are the concrete deliverable the planner should turn into tasks.

### 13.1 `dev-shm-gsd\x2dramdisk.mount`

See §6. This creates the tmpfs tier.

### 13.2 `gsd-ramdisk-restore.service`

```ini
[Unit]
Description=Restore gsd-ramdisk from NVMe mirror
Requires=dev-shm-gsd\x2dramdisk.mount
After=dev-shm-gsd\x2dramdisk.mount
Before=gsd-app.service

[Service]
Type=oneshot
ExecStart=/usr/local/lib/gsd-ramdisk/restore.sh
RemainAfterExit=yes
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
```

### 13.3 `gsd-ramdisk-sync.service` (primary)

```ini
[Unit]
Description=Flush gsd-ramdisk to NVMe mirror
ConditionPathExists=/dev/shm/gsd-ramdisk/.ready

[Service]
Type=oneshot
Slice=gsd-ramdisk.slice
ExecStart=/usr/local/lib/gsd-ramdisk/sync.sh
Nice=10
IOSchedulingClass=idle
MemoryMax=512M
MemorySwapMax=0
OOMScoreAdjust=500
```

### 13.4 `gsd-ramdisk-sync.timer`

```ini
[Unit]
Description=Periodic gsd-ramdisk sync (5 min)

[Timer]
OnBootSec=2min
OnUnitActiveSec=5min
AccuracySec=30s
Persistent=true

[Install]
WantedBy=timers.target
```

### 13.5 `gsd-ramdisk-sync.path` (idle)

```ini
[Unit]
Description=Trigger gsd-ramdisk sync when dirty sentinel is touched

[Path]
PathModified=/dev/shm/gsd-ramdisk/.dirty
Unit=gsd-ramdisk-sync.service

[Install]
WantedBy=multi-user.target
```

### 13.6 `gsd-ramdisk-snapshot.service` + `.timer` (hourly)

Same shape as sync, but `ExecStart=/usr/local/lib/gsd-ramdisk/snapshot.sh`, which `tar --zstd` the live tree into `snapshots/`.

### 13.7 `gsd-ramdisk-guard.service`

A long-running Python or Node script that:

1. Watches `/proc/meminfo` and `findmnt` every 15 seconds.
2. Emits Prometheus metrics on a local port.
3. Triggers growth per §7 when thresholds cross.
4. Logs to journald.

Running as a `notify` type service under the `gsd-ramdisk.slice` cgroup.

## 14. Observability

We measure the thing we are trying to improve, or we are flying blind. Prometheus + node_exporter are already common in the surrounding infrastructure, so we adopt them here.

**Exported metrics (from the guard service):**

| Metric                                     | Type      | Purpose                             |
| ------------------------------------------ | --------- | ----------------------------------- |
| `gsd_ramdisk_capacity_bytes`               | gauge     | Current tmpfs size cap              |
| `gsd_ramdisk_used_bytes`                   | gauge     | Current fill                        |
| `gsd_ramdisk_used_ratio`                   | gauge     | Used / capacity                     |
| `gsd_ramdisk_grow_total`                   | counter   | Growth events since boot            |
| `gsd_ramdisk_sync_total{result=ok|fail}`   | counter   | Sync runs                           |
| `gsd_ramdisk_sync_duration_seconds`        | histogram | Sync wall-clock                     |
| `gsd_ramdisk_sync_bytes_transferred`       | counter   | Delta transferred per sync          |
| `gsd_ramdisk_snapshot_duration_seconds`    | histogram |                                     |
| `gsd_ramdisk_recovery_seconds`             | gauge     | Last recovery cost                  |
| `gsd_ramdisk_dirty_files`                  | gauge     | Files pending sync                  |
| `gsd_ramdisk_mem_available_bytes`          | gauge     | From /proc/meminfo                  |
| `gsd_ramdisk_swap_used_ratio`              | gauge     | Safety interlock input              |
| `gsd_ramdisk_query_latency_seconds{lod,p}` | histogram | End-to-end query latency by tier    |

**Alerts:**

- `gsd_ramdisk_used_ratio > 0.85` for 2 min → growth pending.
- `gsd_ramdisk_sync_total{result="fail"}[15m] > 0` → sync failing; check NVMe.
- `gsd_ramdisk_swap_used_ratio > 0.80` → refuse grow; investigate leak.
- `gsd_ramdisk_query_latency_seconds{lod="350",p="99"} > 0.100` → HNSW hot loop degraded.

## 15. Measurement Plan: Did It Actually Help?

The design is worth nothing if we cannot prove the before/after. Benchmarks must be reproducible and must run against **both** the current disk-only configuration and the new tmpfs-backed configuration.

**Baseline capture (current state, before any changes):**

1. Record current `vmstat 1 30` during an active memory-write workload.
2. Run a query-mix harness against `src/memory/service.ts` that:
   - Writes 1000 new memory records (LOD 300).
   - Runs 1000 keyword queries (LOD 200).
   - Runs 500 semantic queries (LOD 350).
   - Runs 200 hybrid queries.
3. Record p50, p95, p99 latency per operation and aggregate bytes read/written to `/dev/nvme*` via `iostat -xd 1`.

**After capture (tmpfs tier active):**

Same harness. Same corpus. Only difference is the store paths point into `/dev/shm/gsd-ramdisk/`.

**Success criteria:**

| Metric                                     | Target improvement |
| ------------------------------------------ | ------------------ |
| LOD 200 keyword query p99                  | ≥ 3× faster        |
| LOD 300 file write p99                     | ≥ 10× faster       |
| LOD 350 semantic query p95                 | ≥ 2× faster        |
| NVMe write bytes during workload           | ≥ 5× reduction     |
| NVMe read bytes during workload            | ≥ 10× reduction    |
| Sync overhead (5 min cadence, steady-state)| < 2 % CPU          |
| Recovery time (warm reboot, 4 GiB state)   | < 30 s             |

Anything that fails to clear its bar is a failed assumption and a design bug worth investigating.

## 16. Rollout Plan

Incremental, testable, reversible at each step.

**Step 0 — Prototype (1 day).** Create `/tmp/ramdisk-poc/` manually. Point a *copy* of the LTM memory tree at it. Run the benchmark harness against both. Confirm the theoretical wins are real on this box.

**Step 1 — Mount unit + empty tier (1 day).** Create `dev-shm-gsd\x2dramdisk.mount` and `gsd-ramdisk.slice`. Mount it. Verify permissions and growth command. No application integration yet.

**Step 2 — File store migration (2–3 days).** Modify `src/memory/file-store.ts` to accept an optional `STORE_PATH` env var. Point it at `/dev/shm/gsd-ramdisk/mem/`. Add the NVMe mirror directory and the `restore.sh` script that seeds tmpfs at startup. Run the app. Run the benchmark.

**Step 3 — Index store migration (1 day).** Same treatment for `src/memory/index-manager.ts`. Paths move.

**Step 4 — Sync timer (1 day).** Wire up `gsd-ramdisk-sync.service` + `.timer`. Observe metrics.

**Step 5 — ChromaDB migration (2 days).** This is the highest-value step. `src/memory/chroma-store.ts` already reads its persist dir from config. Point it at `/dev/shm/gsd-ramdisk/chroma/`. Add rebuild-from-LOD-300 as the cold-start fallback path.

**Step 6 — Guard + growth (2 days).** Implement `gsd-ramdisk-guard.service` with the growth policy and Prometheus endpoint.

**Step 7 — Snapshot (1 day).** Add hourly tarballs.

**Step 8 — Soak and measure (1 week).** Run normal workloads for a week. Check sync cadences, growth events, p99 latencies, NVMe write reduction. Compare against success criteria from §15.

**Step 9 — Remove scaffolding (1 day).** Delete any `STORE_PATH` env var escape hatches or make them the only path. Document the final architecture in `src/memory/README.md`.

Total: roughly two working weeks for a complete, measured, production-quality rollout.

## 17. Integration Points with `src/memory/`

For the planner, here are the concrete code-level touch points in the existing module:

**`src/memory/file-store.ts` (LOD 300):**

- Constructor takes a `directory` path. Add a resolver that honours `GSD_RAMDISK_ROOT` env var, falling back to the existing path. No other call sites change.
- Add a `flush()` method that updates `.dirty` sentinel after a batch write. The path unit uses this.

**`src/memory/index-manager.ts` (LOD 200):**

- Same env-var-honouring path resolver.
- On write, bump `.dirty`.

**`src/memory/chroma-store.ts` (LOD 350):**

- The Chroma client already reads a `path` option. Plumb `GSD_RAMDISK_ROOT/chroma` into it.
- Add a cold-start recovery path: if the Chroma collection exists but returns zero results on a sanity query, rebuild from LOD 300 by iterating markdown files and re-inserting.

**`src/memory/pg-store.ts` (LOD 400):**

- **No changes.** PG stays on NVMe.

**`src/memory/ram-cache.ts` (LOD 100):**

- **No changes.** Already in-process memory.

**`src/memory/service.ts`:**

- Add `isRamdiskReady()` check at startup. If not ready (sentinel missing), wait or fall back to direct-NVMe paths.
- Emit the `gsd_ramdisk_query_latency_seconds` histogram metric at service boundaries (one `performance.now()` pair per query).

**New module `src/memory/ramdisk-adapter.ts`:**

- Single chokepoint for path resolution across all stores.
- Exports `resolveStorePath(tier: 'mem'|'index'|'chroma'): string`.
- Responsible for ensuring directory existence and for touching `.dirty`.
- About 80 lines of code, fully unit-testable without touching real tmpfs (using a mocked `fs` root).

## 18. Failure Modes and Safeguards

A compact table of what can break, how we notice, and what we do.

| Failure                              | Detection                                                | Response                                                                 |
| ------------------------------------ | -------------------------------------------------------- | ------------------------------------------------------------------------ |
| Power loss between syncs             | Next boot: mirror older than tmpfs would have been        | Restore latest mirror, lose ≤ 5 min of LOD 200/350 (rebuildable from 300) |
| OOM killer targets our slice         | Journald, Prometheus `ManagedOOM*` events                | `gsd-ramdisk-guard` restarts; sync resumes; no data loss since mirror is current |
| Dirty pages grow unbounded           | `gsd_ramdisk_used_ratio > 0.85`                          | Growth to next 4G step, or refuse grow + accelerated sync + eviction      |
| NVMe mirror corrupt                  | Checksum mismatch at restore                             | Fall back to latest tarball snapshot                                      |
| No snapshots either                  | `ls snapshots/` empty                                    | Rebuild from LOD 400 PostgreSQL + LOD 500 corpus (slow, lossless)         |
| tmpfs fills while holding write lock | Application-level EIO on write                           | Backoff, trigger sync+evict, retry                                        |
| Swap saturated                       | `gsd_ramdisk_swap_used_ratio > 0.90`                     | Refuse new LOD 350 inserts; emit alert; human intervention                |
| rsync hangs forever                  | Unit `TimeoutStartSec=300` + journald alert              | SIGTERM; next timer cycle retries; alert fires                            |
| `.dirty` sentinel stops updating     | No sync events despite known writes                      | Application bug; log + alert + fall back to timer-only mode               |
| Clock skew corrupts `.last-sync`     | `--inplace` + rsync checksums override the timestamp check | Force full re-scan on next sync                                          |

## 19. What We Deliberately Did *Not* Do

A good design is as much about what's out of scope as what's in.

- **We did not write a custom FUSE filesystem.** The payoff is tiny, the risk is enormous, and every bug would be kernel-adjacent.
- **We did not journal every write.** PG already does journaling for the tier that needs it. Replicating WAL semantics at the tmpfs layer reintroduces the disk writes we are trying to reduce.
- **We did not encrypt the tmpfs.** Full-disk encryption on the mirror is sufficient given a single-user workstation threat model. A future multi-user build-out would reopen this.
- **We did not move PostgreSQL to tmpfs.** It has its own buffer pool, WAL, checkpoint tuning. Moving it would destroy its durability guarantees for marginal gain.
- **We did not implement shrink.** It is a pure complexity cost.
- **We did not pin tmpfs pages.** Letting them be swappable is our graceful-degradation valve.
- **We did not make the application immune to OOM.** Immune processes hide leaks.

## 20. Summary

We replace the LTM subsystem's storage-thrashing behaviour with a **managed tmpfs subtree inside `/dev/shm`**, starting at 4 GiB, growing in 4 GiB steps up to a 16 GiB ceiling, with 5-minute rsync write-behind to an NVMe mirror, 1-hour snapshot tarballs, inotify-path idle sync, systemd-oomd and cgroup v2 memory accounting to protect the host, and a clean restore path at boot. The tier serves LOD 200, 300, and 350 — the three tiers that generate the current disk traffic. LOD 400 (PostgreSQL) stays on NVMe, because it is the source of truth we fall back to if everything above it burns down.

The primary data-loss exposure is 5 minutes of writes in the worst case, reducible to seconds for LOD 300 via the optional inotify fast-path. The primary observable improvements we expect, per §15, are 3–10× latency wins on p99 queries and a 5–10× reduction in NVMe bytes during normal workloads. If we do not see those numbers in the soak, we pull the feature — but we will see them, because the current architecture is disk-bound on operations the kernel should never have had to schedule to disk in the first place.

The design is intentionally dull. Every primitive is thirty years old, every unit file is twenty lines, every failure mode has a named response. The innovation is not in any one component — it is in matching the right primitives to a problem that was being solved the hard way.

## Sources

- [tmpfs(5) — Linux manual page](https://man7.org/linux/man-pages/man5/tmpfs.5.html)
- [The Difference Between a tmpfs and ramfs RAM Disk — JamesCoyle](https://www.jamescoyle.net/knowledge/951-the-difference-between-a-tmpfs-and-ramfs-ram-disk)
- [The Size Dynamics of tmpfs — Baeldung on Linux](https://www.baeldung.com/linux/tmpfs-size-dynamics)
- [tmpfs — ArchWiki](https://wiki.archlinux.org/title/Tmpfs)
- [How to resize tmpfs in Linux — George Shuklin / OpsOps](https://medium.com/opsops/how-to-resize-tmpfs-in-linux-6fbfbe23b092)
- [RAM disk notes — Helpful.knobs-dials.com](https://helpful.knobs-dials.com/index.php/RAM_disk_notes)
- [Zram — Gentoo wiki](https://wiki.gentoo.org/wiki/Zram)
- [Zram — ArchWiki](https://wiki.archlinux.org/title/Zram)
- [Zram — Wikipedia](https://en.wikipedia.org/wiki/Zram)
- [Single-Node Performance — Chroma Docs](https://docs.trychroma.com/guides/deploy/performance)
- [Resource Requirements — Chroma Cookbook](https://cookbook.chromadb.dev/core/resources/)
- [ChromaDB configuration — Chroma Cookbook](https://cookbook.chromadb.dev/core/configuration/)
- [Teaching the OOM killer about control groups — LWN.net](https://lwn.net/Articles/761118/)
- [Mastering OOM Policy: Tuning Systemd's Response — DevOps Knowledge Hub](https://devops.aibit.im/article/mastering-oom-policy-systemd-tuning)
- [Linux OOM Killer: A Detailed Guide — Last9](https://last9.io/blog/understanding-the-linux-oom-killer/)
- [rsync — ArchWiki](https://wiki.archlinux.org/title/Rsync)
- [How to use inotify and rsync to create a live backup system — LinuxHint](https://linuxhint.com/inotofy-rsync-bash-live-backups/)
- [Set Up Real-Time File Sync with Rsync and Lsyncd — ComputingForGeeks](https://computingforgeeks.com/rsync-lsyncd-file-sync-linux/)
- [Continuously Sync Files One-Way on Linux — Baeldung](https://www.baeldung.com/linux/sync-files-continuously-one-way)
- [How to Configure tmpfs Size Limits on RHEL — OneUptime](https://oneuptime.com/blog/post/2026-03-04-tmpfs-size-limits-mount-options-rhel-9/view)
