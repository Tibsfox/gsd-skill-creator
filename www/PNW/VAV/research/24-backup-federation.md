# M19: Backup, Archival, and Data Federation

**Module 19 of the Voxel as Vessel research atlas.**
Data is never safe until it exists in multiple places, on multiple media, under independent failure domains. This module specifies the complete backup lifecycle for sovereign Minecraft worlds — from hot RBD snapshots through cold BorgBackup archives to offline LTO tape — then extends the model to data federation, where heterogeneous stores are queried as a unified layer without moving data. The through-line from M13's per-world snapshot strategy forward: M13 gave us the snapshot primitive and CephX isolation; M19 builds the full backup architecture, the 3-2-1-1-0 discipline, and the federation fabric that connects sovereign worlds without compromising sovereignty.

---

## Table of Contents

1. [Backup Strategies](#1-backup-strategies)
2. [RBD Snapshot Workflow](#2-rbd-snapshot-workflow)
3. [BorgBackup Integration](#3-borgbackup-integration)
4. [Continuous Data Protection via Journal Mirroring](#4-continuous-data-protection-via-journal-mirroring)
5. [Offsite Data Security](#5-offsite-data-security)
6. [Data Federation and Bridging](#6-data-federation-and-bridging)
7. [Cross-Domain Bridging in Zero-Trust Environments](#7-cross-domain-bridging-in-zero-trust-environments)
8. [DR Test Plan](#8-dr-test-plan)
9. [M2 Retrospective Forward Lesson](#9-m2-retrospective-forward-lesson)
10. [Minecraft/Ceph Mapping](#10-minecraftceph-mapping)
11. [Safety and Sensitivity Considerations](#11-safety-and-sensitivity-considerations)
12. [Connection to Other Modules](#12-connection-to-other-modules)
13. [Sources](#13-sources)

---

## 1. Backup Strategies

Every backup strategy makes a trade: storage cost against recovery speed, bandwidth against RPO, operational simplicity against granularity. The seven strategies below span the full spectrum, from brute-force full copies through real-time journal replication to cold deduplication archives. Each has a natural fit in the VAV sovereign world architecture — no single strategy covers all needs, and a production deployment layers multiple strategies by world activity tier.

### 1.1 Strategy Comparison

| Strategy | Description | Trade-off | RPO | Storage Cost | Restore Speed |
|---|---|---|---|---|---|
| **Full** | Complete copy every cycle | Simple restore; high storage and bandwidth | Cycle interval | High (full image per cycle) | Fast (single-step restore) |
| **Incremental** | Only changes since last backup | Low storage per cycle; slow restore (chain replay) | Cycle interval | Low (delta only) | Slow (full + all incrementals) |
| **Differential** | Changes since last full | Medium storage; faster restore than incremental | Cycle interval | Medium (grows toward full) | Medium (full + latest diff) |
| **CDP** | Journal every write, replay-to-point | Near-zero RPO; high continuous bandwidth overhead | Near-zero | High (journal stream) | Variable (replay duration) |
| **RBD Snapshot (Ceph)** | CoW snapshot in-pool; instantaneous creation | No extra space until diverge; pool-local only | Near-zero | Proportional to divergence | Fast (in-pool rollback) |
| **RBD Mirror (journal)** | Real-time cross-cluster replication | High bandwidth; geographically distributed | <60 seconds | Full replica at remote site | Fast (promote remote) |
| **BorgBackup** | Block-level dedup + compress; cold archive | Excellent storage efficiency; no hot standby | Hourly/daily | Very low (dedup ratio 10-50x) | Slow (extract + import) |

### 1.2 Full Backup

A full backup copies the entire RBD image — every byte, whether it has changed or not. For a 50 GB world image, each full backup consumes 50 GB of storage and the full bandwidth to transfer it.

**When to use:** Initial baseline for incremental/differential chains. Periodic reset point (weekly or monthly) to limit chain depth and restore complexity.

**Implementation:**

```bash
# Full export of world image to file
rbd export worlds/<world-uuid> /backup/full/$(date -u +%Y-%m-%dT%H%M%SZ).raw

# Full export streamed to remote host (no local intermediate)
rbd export worlds/<world-uuid> - | \
  ssh backup@offsite "cat > /backup/full/$(date -u +%Y-%m-%dT%H%M%SZ).raw"
```

**Storage math:** 50 GB world, daily full backup, 30-day retention = 1.5 TB. For a cluster hosting 100 worlds, that is 150 TB per month — economically unviable for full-only strategy. Full backup is the baseline; layered strategies reduce the cost.

### 1.3 Incremental Backup

An incremental backup captures only the data that changed since the *previous backup* (whether that previous backup was full or incremental). This creates a chain: to restore, you need the last full backup plus every incremental in sequence.

**Advantage:** Each incremental is small — for a Minecraft world with 2-5% daily divergence on a 50 GB image, each incremental is 1-2.5 GB.

**Disadvantage:** Restore requires replaying the entire chain in order. A corruption or loss anywhere in the chain breaks all subsequent restores. Chain depth should be limited (7-14 incrementals before a new full).

**Implementation with RBD snapshots:**

```bash
# Day 0: Full baseline
rbd snap create worlds/<world-uuid>@full-baseline
rbd export worlds/<world-uuid>@full-baseline /backup/full-baseline.raw

# Day 1: Incremental from baseline
rbd snap create worlds/<world-uuid>@incr-day1
rbd export-diff \
  --from-snap full-baseline \
  worlds/<world-uuid>@incr-day1 \
  /backup/incr-day1.bin

# Day 2: Incremental from day1
rbd snap create worlds/<world-uuid>@incr-day2
rbd export-diff \
  --from-snap incr-day1 \
  worlds/<world-uuid>@incr-day2 \
  /backup/incr-day2.bin

# Restore: apply full + all incrementals in order
rbd import /backup/full-baseline.raw worlds/<world-uuid>-restored
rbd import-diff /backup/incr-day1.bin worlds/<world-uuid>-restored
rbd import-diff /backup/incr-day2.bin worlds/<world-uuid>-restored
```

**Chain integrity:** Every `export-diff` embeds the source snapshot ID. `import-diff` verifies the chain — applying a delta out of order is rejected. This is idempotent: interrupted imports can be safely retried.

### 1.4 Differential Backup

A differential backup captures all changes since the *last full backup*, regardless of how many differentials have been taken since. Each differential is self-sufficient relative to the full — restore requires only the full plus the latest differential.

**Advantage:** Faster restore than incremental (two files, not N). No chain dependency between differentials.

**Disadvantage:** Each differential grows over time as more data diverges from the full baseline. By day 14, a differential may approach the size of a full backup.

**Implementation:**

```bash
# Full baseline (same as incremental)
rbd snap create worlds/<world-uuid>@full-baseline

# Day 7: Differential from the full baseline (not from day 6)
rbd snap create worlds/<world-uuid>@diff-day7
rbd export-diff \
  --from-snap full-baseline \
  worlds/<world-uuid>@diff-day7 \
  /backup/diff-day7.bin

# Day 14: Differential from the same full baseline
rbd snap create worlds/<world-uuid>@diff-day14
rbd export-diff \
  --from-snap full-baseline \
  worlds/<world-uuid>@diff-day14 \
  /backup/diff-day14.bin

# Restore: full + latest differential only
rbd import /backup/full-baseline.raw worlds/<world-uuid>-restored
rbd import-diff /backup/diff-day14.bin worlds/<world-uuid>-restored
```

**Sizing:** For a 50 GB world with 2% daily divergence, day-7 differential is ~7 GB, day-14 is ~14 GB. The growth is linear with time since last full. Schedule a new full when differentials exceed 30-40% of full image size.

### 1.5 Continuous Data Protection (CDP)

CDP journals every write operation as it occurs, producing a continuous stream that can be replayed to any arbitrary point in time. Unlike periodic backups that capture state at intervals, CDP captures *transitions* — the write log itself is the backup.

In the Ceph context, CDP maps directly to RBD journal-based mirroring (Section 4). Every write to the RBD image is recorded in a per-image journal object before the write is acknowledged to the client. The journal is replayed at the secondary site in real time.

**RPO: Near-zero** (limited by replication lag, typically seconds under normal network conditions).

**Bandwidth cost:** Every byte written to the primary is transmitted to the secondary. For a busy Minecraft server with 10 players generating 50-200 MB/hour of block changes, CDP requires 50-200 MB/hour of sustained cross-site bandwidth — plus overhead for journal metadata.

**Point-in-time recovery:** CDP enables recovery to *any write*, not just snapshot boundaries. This is valuable for recovering from griefing attacks or accidental TNT detonations — roll back to the moment before the damage, not to the last 15-minute snapshot.

### 1.6 RBD Snapshot (Ceph)

Covered in detail in M13 Section 1. Summary: CoW snapshots are instantaneous, cost no extra storage until the image diverges, and serve as the foundation for incremental/differential export. The snapshot *is* the backup primitive — everything else layers on top.

**Key operational commands (from M13):**

```bash
# Create snapshot
rbd snap create worlds/<world-uuid>@snap-$(date -u +%Y-%m-%dT%H%M%SZ)

# List snapshots
rbd snap ls worlds/<world-uuid>

# Rollback (destructive — overwrites current image state)
rbd snap rollback worlds/<world-uuid>@snap-2026-03-10T120000Z

# Delete snapshot (reclaims CoW space for diverged objects)
rbd snap rm worlds/<world-uuid>@snap-2026-03-10T120000Z
```

### 1.7 RBD Mirror (Journal Mode)

Covered in detail in M13 Section 2.2. Summary: every write journals to a per-image RADOS object, and the `rbd-mirror` daemon at the secondary site replays the journal in order. RPO is bounded by replication lag — under normal conditions, seconds. This is the primary hot-standby strategy for active worlds.

### 1.8 BorgBackup

BorgBackup is a deduplicating archiver with built-in encryption and compression. It operates at the block level — if two backups share 98% of their content, Borg stores the shared blocks only once. For Minecraft worlds where the vast majority of chunks are stable between backups, Borg's deduplication ratio is exceptional.

Covered in detail in Section 3 below.

---

## 2. RBD Snapshot Workflow

M13 established the snapshot primitive. This section specifies the complete operational workflow for snapshot-based backup — creation, incremental delta export, remote transfer, import at the secondary site, and retention management.

### 2.1 Snapshot Creation

```bash
# Create a named snapshot with ISO 8601 timestamp
rbd snap create worlds/<world-uuid>@snap-$(date -u +%Y-%m-%dT%H%M%SZ)
```

Snapshot creation is atomic and instantaneous. The OSD records a snapshot context (a version fence) on all objects in the image. No data is copied. The cost is O(1) in time and O(metadata-only) in space.

### 2.2 Incremental Delta Export

The delta between two snapshots is extracted with `export-diff`:

```bash
# Export the binary delta between snap-1 and snap-2
rbd export-diff \
  --from-snap snap-2026-03-10T120000Z \
  worlds/<world-uuid>@snap-2026-03-10T121500Z \
  /backup/delta-120000-to-121500.bin
```

Properties of the delta:
- **Self-contained:** includes metadata identifying source and target snapshot IDs
- **Idempotent:** `rbd import-diff` can be interrupted and safely retried
- **Streamable:** can be piped over SSH, netcat, or any byte stream without intermediate storage

### 2.3 Remote Transfer and Import

Single-pipeline transfer from primary to secondary site:

```bash
# Stream incremental delta directly to remote cluster
rbd export-diff \
  --from-snap snap-2026-03-10T120000Z \
  worlds/<world-uuid>@snap-2026-03-10T121500Z - | \
  ssh ceph-admin@site-b rbd import-diff - worlds/<world-uuid>
```

If the connection drops, the incomplete import is discarded — the remote image remains at its previous consistent state. Re-run the pipeline to retry. This property makes the snapshot-based backup inherently crash-safe.

For bandwidth-constrained links, compress the delta in transit:

```bash
# Compressed pipeline (lz4 for speed, zstd for ratio)
rbd export-diff \
  --from-snap snap-old \
  worlds/<world-uuid>@snap-new - | \
  lz4 | \
  ssh ceph-admin@site-b "lz4 -d | rbd import-diff - worlds/<world-uuid>"
```

### 2.4 Snapshot Retention Policy

Retention balances RPO granularity against storage cost. A tiered policy based on age:

| Age | Granularity | Count | Rationale |
|-----|-------------|-------|-----------|
| 0-12 hours | Every 15 minutes | 48 | Match Minecraft auto-save; fine-grained rollback for active players |
| 12h-7 days | Hourly | ~156 | Medium-term recovery for griefing or corruption detection |
| 7-30 days | Daily | ~23 | Long-term recovery for slow-onset issues |
| 30-365 days | Weekly | ~48 | Annual archive; regulatory or audit compliance |

Automated pruning via systemd timer:

```bash
#!/bin/bash
# prune-snapshots.sh — run via systemd timer every 15 minutes
WORLD_UUID="$1"
IMAGE="worlds/${WORLD_UUID}"

# Prune 15-minute snapshots older than 12 hours
CUTOFF_12H=$(date -u -d '12 hours ago' +%Y-%m-%dT%H%M%SZ)
rbd snap ls "${IMAGE}" --format json | \
  jq -r ".[] | select(.name | startswith(\"snap-\")) | select(.name < \"snap-${CUTOFF_12H}\") | .name" | \
  while read -r SNAP; do
    # Keep one snapshot per hour (the :00 minute mark)
    if [[ ! "${SNAP}" =~ T[0-9]{2}00 ]]; then
      rbd snap rm "${IMAGE}@${SNAP}"
    fi
  done

# Prune hourly snapshots older than 7 days
CUTOFF_7D=$(date -u -d '7 days ago' +%Y-%m-%dT%H%M%SZ)
rbd snap ls "${IMAGE}" --format json | \
  jq -r ".[] | select(.name | startswith(\"snap-\")) | select(.name < \"snap-${CUTOFF_7D}\") | .name" | \
  while read -r SNAP; do
    # Keep one snapshot per day (the T0000 mark)
    if [[ ! "${SNAP}" =~ T0000 ]]; then
      rbd snap rm "${IMAGE}@${SNAP}"
    fi
  done
```

### 2.5 Snapshot Space Accounting

Monitor divergence between snapshots to predict storage growth and capacity needs:

```bash
# Bytes modified between two snapshots
rbd diff --from-snap snap-2026-03-10T120000Z \
  worlds/<world-uuid>@snap-2026-03-10T121500Z --format json | \
  jq '[.[].length] | add'

# Total space consumed by all snapshot divergence for an image
rbd du worlds/<world-uuid>
```

For a Minecraft server with 10 active players: expect 50-200 MB of block changes per hour. Snapshot overhead is bounded by this divergence rate — not by image size. A 50 GB world with 100 MB/hour divergence and 48 retained 15-minute snapshots uses approximately 50 GB (base) + 4.8 GB (snapshots) = 54.8 GB total.

---

## 3. BorgBackup Integration

BorgBackup provides cold-tier archival with block-level deduplication, compression, and optional encryption. It does not require a secondary Ceph cluster — a standard filesystem on a backup server suffices. Borg's deduplication is content-defined chunking: the backup stream is split into variable-length chunks based on a rolling hash, and only unique chunks are stored.

### 3.1 Repository Initialization

```bash
# Initialize a Borg repository with repokey encryption
# repokey: the encryption key is stored in the repo, protected by a passphrase
borg init --encryption=repokey /backup/borg-worlds

# Alternative: keyfile encryption (key stored locally, not in repo)
borg init --encryption=keyfile /backup/borg-worlds
```

**Encryption choice:** For sovereign worlds, `repokey` is simpler to manage (the key travels with the repo). For air-gapped offsite copies, `keyfile` provides stronger separation — an attacker with the repo but not the key file cannot decrypt.

### 3.2 Backup Creation

Stream the RBD image directly to Borg without intermediate files:

```bash
# Mount-free backup: stream RBD export directly to Borg stdin
rbd export worlds/<world-uuid> - | \
  borg create \
    --stdin-name "<world-uuid>.raw" \
    --compression zstd,6 \
    --progress \
    /backup/borg-worlds::"${WORLD_UUID}-$(date -u +%Y-%m-%dT%H%M%SZ)" -
```

Alternatively, mount the RBD image and let Borg operate on the filesystem level for more granular deduplication:

```bash
# Mount RBD image (read-only for consistency)
rbd map worlds/<world-uuid> --read-only
mount -o ro /dev/rbd0 /mnt/world-backup

# Filesystem-level Borg backup (deduplicates at file/block level)
borg create \
  --compression zstd,6 \
  --exclude '*.lock' \
  --exclude 'session.lock' \
  /backup/borg-worlds::"${WORLD_UUID}-$(date -u +%Y-%m-%dT%H%M%SZ)" \
  /mnt/world-backup/

# Cleanup
umount /mnt/world-backup
rbd unmap /dev/rbd0
```

The filesystem-level approach gives Borg access to individual region files (`.mca`), player data files, and configuration — enabling finer-grained deduplication across worlds that share common base terrain. The raw-stream approach treats the entire image as an opaque blob but requires no mount/unmap overhead.

### 3.3 Retention Policy

Borg's `prune` command implements retention rules based on archive age:

```bash
# Keep: 48 hourly, 30 daily, 12 monthly, 2 yearly
borg prune \
  --keep-hourly=48 \
  --keep-daily=30 \
  --keep-monthly=12 \
  --keep-yearly=2 \
  --prefix "${WORLD_UUID}-" \
  /backup/borg-worlds

# Compact: reclaim space from deleted archives
borg compact /backup/borg-worlds
```

### 3.4 Restore Workflow

```bash
# List available archives
borg list /backup/borg-worlds

# Restore from archive: extract to stdout and import as new RBD image
borg extract --stdout \
  /backup/borg-worlds::"${WORLD_UUID}-2026-03-10T143000Z" | \
  rbd import - worlds/<world-uuid>-restored

# Alternative: extract to filesystem and create fresh RBD
borg extract \
  /backup/borg-worlds::"${WORLD_UUID}-2026-03-10T143000Z" \
  --destination /tmp/world-restore/
# Then create a new RBD image and copy the filesystem content
```

### 3.5 Deduplication Economics

Borg's storage efficiency for Minecraft worlds is exceptional because most of the world is procedurally generated terrain that never changes:

| Scenario | Raw Storage | Borg Storage | Dedup Ratio |
|----------|-------------|--------------|-------------|
| 1 world, 1 backup | 50 GB | 50 GB | 1:1 |
| 1 world, 100 daily backups (1% daily change) | 5,000 GB | ~100 GB | 50:1 |
| 10 worlds (same seed, different player builds), 30 backups each | 15,000 GB | ~200 GB | 75:1 |
| 10 worlds (different seeds), 30 backups each | 15,000 GB | ~600 GB | 25:1 |

Same-seed worlds share vast amounts of procedurally generated terrain. Borg's content-defined chunking detects this shared content automatically, even across different archives and different world images.

### 3.6 Integrity Verification

```bash
# Verify archive integrity (checks data + metadata)
borg check --verify-data /backup/borg-worlds

# Verify a specific archive
borg check --verify-data \
  /backup/borg-worlds::"${WORLD_UUID}-2026-03-10T143000Z"
```

Schedule `borg check` weekly. A failed check is a severity-2 incident — the backup chain may be compromised.

---

## 4. Continuous Data Protection via Journal Mirroring

CDP in the Ceph context is implemented by RBD journal-based mirroring: every write to the RBD image is recorded in a per-image journal object *before* the write is acknowledged to the Minecraft server. The `rbd-mirror` daemon at the secondary site replays the journal entries in order, maintaining a near-real-time replica.

### 4.1 Architecture

```
Site A (Primary)                                  Site B (Secondary)
┌────────────────────────┐                       ┌────────────────────────┐
│  Minecraft Server VM   │                       │   rbd-mirror daemon    │
│         │              │                       │         │              │
│    block write         │                       │    journal replay      │
│         │              │                       │         │              │
│         ▼              │                       │         ▼              │
│  ┌──────────────┐      │                       │  ┌──────────────┐      │
│  │  RBD Journal  │──────┼── Ceph msgr2 ────────┼─▶│ Journal Reader │      │
│  │  (RADOS obj)  │      │   (TLS encrypted)    │  │              │      │
│  └──────┬───────┘      │                       │  └──────┬───────┘      │
│         │              │                       │         │              │
│         ▼              │                       │         ▼              │
│  ┌──────────────┐      │                       │  ┌──────────────┐      │
│  │  RBD Image    │      │                       │  │  RBD Image    │      │
│  │  (primary)    │      │                       │  │  (secondary)  │      │
│  └──────────────┘      │                       │  └──────────────┘      │
└────────────────────────┘                       └────────────────────────┘
```

### 4.2 Enable CDP for a World

```bash
# Step 1: Enable journaling feature on the image
rbd feature enable worlds/<world-uuid> journaling

# Step 2: Enable journal-mode mirroring
rbd mirror image enable worlds/<world-uuid> journal

# Step 3: Verify journaling is active
rbd info worlds/<world-uuid> | grep features
# Expected: features: layering, exclusive-lock, journaling
```

### 4.3 Journal Configuration Tuning

The journal has two critical knobs:

| Parameter | Default | Recommended (VAV) | Effect |
|-----------|---------|-------------------|--------|
| `rbd_journal_object_max_data_size` | 256 KB | 1 MB | Larger journal objects reduce RADOS object count; better throughput for burst writes |
| `rbd_journal_splay_width` | 4 | 4 | Number of parallel journal object streams; 4 is optimal for NVMe OSDs |
| `rbd_journal_order` | 24 (16 MB) | 24 | Journal object size order; 16 MB balances memory usage against write amplification |

```ini
# ceph.conf — journal tuning for Minecraft workloads
[client]
    rbd_journal_object_max_data_size = 1048576
    rbd_journal_splay_width = 4
    rbd_journal_order = 24
```

### 4.4 Monitoring Replication Lag

```bash
# Check mirror status for a specific world
rbd mirror image status worlds/<world-uuid>

# Expected healthy output:
#   state: up+replaying
#   description: replaying, {
#     "bytes_per_second": 1048576,
#     "entries_behind_primary": 3
#   }

# Alert threshold: entries_behind_primary > 1000 or state != up+replaying
```

**Prometheus integration:** The `ceph-mgr` Prometheus module exports `ceph_rbd_mirror_image_replay_state` and `ceph_rbd_mirror_image_entries_behind` metrics. Set alerting rules:

```yaml
# Prometheus alert rule
- alert: RBDMirrorReplayLag
  expr: ceph_rbd_mirror_image_entries_behind > 1000
  for: 5m
  labels:
    severity: warning
  annotations:
    summary: "RBD mirror replay lag exceeds 1000 entries for {{ $labels.image }}"
```

### 4.5 Point-in-Time Recovery

CDP's unique advantage: recovery to *any write*, not just snapshot boundaries. The journal is a total-ordered log of all mutations. To recover to a specific point:

1. Promote the secondary image (which has the replayed journal up to the latest received entry).
2. Roll forward or backward within the journal to the desired timestamp.
3. Create a snapshot at the desired point.
4. Clone a new image from that snapshot for the restored world.

This is invaluable for recovering from griefing, accidental destruction (TNT, lava bucket, WorldEdit mistake), or server-side corruption (plugin bug writing invalid NBT). The operator can identify the exact moment of damage and recover to one write before it.

---

## 5. Offsite Data Security

### 5.1 The 3-2-1 Rule

The 3-2-1 rule is the minimum viable backup discipline:

- **3** copies of data: primary + two backups
- **2** different media types: e.g., Ceph OSD (SSD/HDD) + BorgBackup (different HDD/SSD) + tape
- **1** offsite: geographically separated from the primary site

### 5.2 Extended 3-2-1-1-0

The extended model adds two critical requirements:

- **+1** offline/air-gapped copy: physically disconnected from any network; immune to ransomware, compromise, or remote wipe
- **+0** verified errors: every backup copy is regularly integrity-checked; zero unresolved errors

**Applied to VAV sovereign worlds:**

| Copy | Media | Location | Method | Verification |
|------|-------|----------|--------|-------------|
| 1 (Primary) | Ceph OSD (NVMe/SSD) | Site A datacenter | Live RBD image | Ceph scrub (deep scrub weekly) |
| 2 (Hot standby) | Ceph OSD (Site B) | Site B datacenter | RBD journal-mode mirror | `rbd mirror image status` (continuous) |
| 3 (Cold archive) | BorgBackup on HDD | Backup server (site A or C) | `borg create` from RBD export | `borg check --verify-data` (weekly) |
| +1 (Air-gapped) | LTO tape | Offsite vault | `borg export-tar` to tape | `mt status` + read-back verify |
| +0 (Verification) | — | All copies | Periodic test-restore | Full restore drill (quarterly) |

### 5.3 Encryption at Rest

All backup copies are encrypted at rest:

**Block device layer (LUKS2):**
LUKS2 with AES-256-XTS provides full-disk encryption on the VM's RBD-backed volume. Key management via OpenStack Barbican or HashiCorp Vault ensures keys are separated from data.

```bash
# LUKS2 encryption on RBD-mapped device
cryptsetup luksFormat --type luks2 \
  --cipher aes-xts-plain64 \
  --key-size 512 \
  --hash sha512 \
  --iter-time 5000 \
  /dev/rbd0 --key-file /etc/barbican/world-key

# Verify encryption parameters
cryptsetup luksDump /dev/rbd0 | head -20
# Version:        2
# Cipher:         aes
# Cipher mode:    xts-plain64
# Key bits:       512
```

**Ceph RBD native encryption (Pacific v16+):**
Ceph added per-image encryption in the Pacific release, allowing encryption at the RBD layer rather than (or in addition to) LUKS on the VM:

```bash
# Create encrypted RBD image (Ceph Pacific+)
rbd create worlds/<world-uuid> --size 50G \
  --image-feature exclusive-lock,object-map,fast-diff \
  --image-feature deep-flatten \
  --encryption-format luks2
```

**BorgBackup encryption:**
Borg repositories are encrypted with `repokey` (AES-256-CTR + HMAC-SHA256). The encryption key is derived from a passphrase via PBKDF2. Each archive chunk is independently encrypted — compromise of one chunk does not reveal others.

**Key lifecycle management:**

| Event | Action | Responsible |
|-------|--------|-------------|
| World created | Generate LUKS key, store in Barbican | Provisioning automation |
| Backup created | Borg repo passphrase (set once at repo init) | Backup operator |
| Key rotation | Re-encrypt LUKS header with new key; Borg: `borg key change-passphrase` | Security operator (annually) |
| World deleted | Destroy LUKS key in Barbican; `borg delete` archive | Deprovisioning automation |
| Compromise | Emergency key rotation; re-encrypt all copies | Incident response team |

### 5.4 Encryption in Transit

All data in motion is encrypted:

- **Ceph inter-OSD:** msgr2 protocol with mutual TLS authentication (`ms_cluster_mode = secure`)
- **S3/RGW:** TLS 1.3 for HTTPS endpoints; HSTS enforced
- **Backup transfer:** SSH tunnel for `rbd export-diff` streaming; BorgBackup uses its own authenticated encryption for `borg serve` remote repos
- **Site-to-site:** IPsec or WireGuard VPN tunnel for all inter-datacenter traffic; Ceph msgr2 encryption is defense-in-depth on top of the tunnel

**Never transit unencrypted world data on shared infrastructure.** Even on a private WAN link, encrypt — defense-in-depth assumes every link is hostile.

### 5.5 Geographic Distribution Strategies

| Strategy | Primary | Secondary | Tertiary | RPO | RTO | Cost |
|----------|---------|-----------|----------|-----|-----|------|
| **Active-active** | Ceph cluster (site A) | Ceph cluster (site B), journal mirror | — | <60 seconds | <5 minutes | High (two full clusters) |
| **Active-passive** | Ceph cluster (site A) | Cold site (snapshot export) | — | Snapshot interval | 30-60 minutes | Medium (one cluster + storage) |
| **Active-active-cold** | Ceph cluster (site A) | Ceph cluster (site B), journal mirror | BorgBackup (site C) | <60 seconds | <5 minutes | High+ (two clusters + archive) |
| **Cloudburst** | Ceph cluster (site A) | S3-compatible RGW (cloud) | — | Hourly | 1-2 hours | Low (object storage pricing) |

**Active-active** is the recommended strategy for worlds with paying players or contractual SLAs. The cost of a second Ceph cluster is justified by the <5 minute RTO guarantee.

**Active-passive** is appropriate for community servers where longer recovery time is acceptable. Snapshot exports can be transferred via cron on an hourly schedule, and restoration involves importing the latest snapshot plus starting a fresh VM.

**Cloudburst** leverages Ceph's S3-compatible RGW to push backup data to a cloud object store (AWS S3, GCS, Azure Blob) as a cost-optimized tertiary copy. Useful for operators who run on-premise Ceph but want geographic diversity without operating a second datacenter.

### 5.6 LTO Tape for Air-Gapped Copies

LTO (Linear Tape-Open) tape provides the air-gapped offline copy required by 3-2-1-1-0:

| Generation | Native Capacity | Compressed (2.5:1) | Transfer Rate | Shelf Life | WORM |
|------------|----------------|---------------------|---------------|------------|------|
| LTO-8 | 12 TB | 30 TB | 360 MB/s | 30+ years | Yes |
| LTO-9 | 18 TB | 45 TB | 400 MB/s | 30+ years | Yes |

A single LTO-9 cartridge holds 18 TB of raw data — enough for 360 full 50 GB world images, or thousands of deduplicated BorgBackup archives.

**Workflow:**

```bash
# Export Borg repository to tar, write to tape
borg export-tar /backup/borg-worlds::"${WORLD_UUID}-latest" - | \
  mbuffer -s 256k -m 4G -P 90 | \
  dd of=/dev/st0 bs=256k

# Verify: read back and compare
dd if=/dev/st0 bs=256k | md5sum
# Compare against original export checksum

# WORM (Write Once Read Many) mode for compliance
mt -f /dev/st0 worm
```

**Sneakernet transport (RFC 5050 Bundle Protocol):** For truly air-gapped environments where no network path exists between sites, physical tape transport is the data channel. RFC 5050 (Bundle Protocol) formalizes delay-tolerant networking — the tape is the bundle, the courier is the link layer. Track chain of custody: who handled the tape, when, transport method, seal verification on arrival. This connects to M18's sneakernet discussion for offline world transport.

---

## 6. Data Federation and Bridging

### 6.1 What Data Federation Is

Data federation provides a unified query interface over heterogeneous, distributed data stores **without physically moving data**. Each data source remains sovereign — it owns its storage, schema, and access control. The federation layer translates queries, routes them to the appropriate sources, collects results, and joins/filters at the federation layer.

This is distinct from data warehousing (ETL into a central store) or data replication (copying data between stores). Federation is read-only by design — it queries in place.

### 6.2 Federation Architecture for Sovereign Worlds

In the VAV context, sovereign worlds generate and store data across multiple heterogeneous systems. No single query engine can natively query all of them. Federation bridges the gap:

```
                    ┌─────────────────────────────┐
                    │     Federation Query Engine   │
                    │  (Trino / Apache Drill / SQL) │
                    └──────────┬──────────────────┘
                               │
          ┌────────────────────┼────────────────────┐
          │                    │                    │
          ▼                    ▼                    ▼
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│  Ceph Connector  │  │  JDBC Connector  │  │  ES Connector    │
│                 │  │                 │  │                 │
│  World A:       │  │  World B:       │  │  World D:       │
│  RADOS objects  │  │  PostgreSQL     │  │  Elasticsearch  │
│  S3 via RGW     │  │  Player stats   │  │  Sign/book text │
│  Block data     │  │  Economy data   │  │  Chat logs      │
└─────────────────┘  └─────────────────┘  └─────────────────┘
          │                    │
          ▼                    ▼
┌─────────────────┐  ┌─────────────────┐
│  HDFS Connector  │  │  TSDB Connector  │
│                 │  │                 │
│  World C:       │  │  World E:       │
│  HDFS           │  │  InfluxDB /     │
│  MapReduce      │  │  OpenTSDB       │
│  Block frequency│  │  Server metrics  │
└─────────────────┘  └─────────────────┘
```

**Example federated queries:**

```sql
-- "Which players on World A also have economy data in World B?"
SELECT a.player_uuid, a.playtime_hours, b.balance
FROM ceph.world_a.player_sessions a
JOIN postgres.world_b.economy b ON a.player_uuid = b.player_uuid
WHERE a.playtime_hours > 100;

-- "Find all signs containing 'welcome' across all worlds"
SELECT world_id, x, y, z, sign_text
FROM elasticsearch.signs
WHERE sign_text LIKE '%welcome%';

-- "Server TPS (ticks per second) correlated with player count"
SELECT ts.timestamp, ts.tps, pg.player_count
FROM influxdb.server_metrics ts
JOIN postgres.sessions pg ON ts.timestamp BETWEEN pg.join_time AND pg.leave_time;
```

The federation engine rewrites these queries into native calls: S3 `GetObject` for Ceph, SQL for PostgreSQL, Elasticsearch DSL for sign search, InfluxQL for time-series. Results are collected, joined at the federation layer, and returned to the client.

### 6.3 Apache Arrow: The Columnar In-Memory Format

Apache Arrow is the interchange format that makes federation efficient. All connectors serialize their results into Arrow columnar format before returning to the federation engine. This eliminates per-hop serialization overhead:

**Why columnar matters:**
- Row-oriented formats (JSON, CSV, traditional JDBC ResultSet) require per-row parsing and type conversion at every hop.
- Columnar formats (Arrow) store all values of a column contiguously in memory. Vectorized operations (filter, project, aggregate) operate on columns, not rows — exploiting CPU cache lines and SIMD instructions.
- **Zero-copy:** When two processes share Arrow buffers (via shared memory or memory-mapped files), no serialization or deserialization occurs. The bytes in memory *are* the data structure.

**Arrow data types relevant to VAV:**

| Arrow Type | VAV Use Case |
|------------|-------------|
| `Int32` | Block IDs, chunk coordinates |
| `Int64` | Player UUIDs (as two Int64), timestamps |
| `Float32` | Entity positions (x, y, z) |
| `Utf8` | Sign text, book content, player names |
| `Binary` | Raw NBT data, compressed chunk sections |
| `Struct` | Nested block state (block ID + properties map) |
| `List<Int32>` | Block palette arrays |

### 6.4 Apache Arrow Flight: The Transport Layer

Arrow Flight is a gRPC-based protocol for streaming Arrow record batches between processes. It is designed for high-throughput data movement — the federation transport layer.

**Architecture:**

```
┌────────────────┐      gRPC (Arrow Flight)      ┌────────────────┐
│  Flight Client  │◀────────────────────────────▶│  Flight Server  │
│  (Trino worker) │   DoGet / DoPut / DoExchange  │  (Data source)  │
│                │                                │                │
│  Sends:        │                                │  Sends:        │
│  - FlightInfo  │                                │  - RecordBatch │
│    (schema +   │                                │    (Arrow      │
│     endpoints) │                                │     columnar)  │
│  - Ticket      │                                │                │
│    (query ref) │                                │                │
└────────────────┘                                └────────────────┘
```

**Flight protocol operations:**

| Method | Direction | Purpose |
|--------|-----------|---------|
| `GetFlightInfo` | Client -> Server | Discover available datasets; returns schema + endpoint list |
| `DoGet` | Client -> Server | Stream record batches from server to client (read path) |
| `DoPut` | Client -> Server | Stream record batches from client to server (write path) |
| `DoExchange` | Bidirectional | Full-duplex streaming for interactive query refinement |
| `ListFlights` | Client -> Server | Enumerate available flights (datasets) on the server |

**Throughput:** Arrow Flight achieves 2-5 GB/s on a 10 GbE link for columnar data, compared to 200-500 MB/s for JDBC/ODBC row-at-a-time protocols. The 10x improvement comes from eliminating row-level serialization, using gRPC's HTTP/2 multiplexing, and streaming Arrow buffers directly without intermediate format conversion.

**Federation integration:** Each data source (Ceph/RGW, PostgreSQL, Elasticsearch, InfluxDB) runs a Flight server that translates native data into Arrow record batches. The federation engine's workers connect as Flight clients, issue `DoGet` requests with query predicates pushed down to the source, and receive columnar results for local join/aggregate processing.

### 6.5 Trino (Formerly PrestoSQL)

Trino is a distributed SQL query engine designed for federated analytics. It connects to heterogeneous data sources through *connectors* and executes SQL queries across them with push-down predicates to minimize data movement.

**Relevant Trino connectors for VAV:**

| Connector | Data Source | Push-Down Support |
|-----------|-------------|-------------------|
| `hive` | S3/RGW (via Hive metastore) | Partition pruning, predicate push-down |
| `postgresql` | Player stats, economy | Full SQL push-down |
| `elasticsearch` | Sign/book text search | Query DSL push-down |
| `iceberg` | Analytical tables on S3 | Column pruning, predicate push-down, time travel |
| `memory` | Ephemeral scratch tables | N/A (local) |

**Trino deployment for VAV:**

```
┌──────────────────────────────────────────┐
│          Trino Coordinator               │
│  (query planning, optimization, routing) │
└────────┬────────────┬────────────────────┘
         │            │
    ┌────▼──┐    ┌───▼───┐
    │Worker 1│    │Worker 2│    (parallel execution)
    │        │    │        │
    │ Ceph   │    │ PG     │    (connector-specific)
    │ connector│  │ connector│
    └────────┘    └────────┘
```

**Predicate push-down example:** The query `SELECT * FROM ceph.blocks WHERE biome = 'forest' AND y > 64` pushes the `biome` and `y` predicates down to the Ceph connector, which translates them into RADOS object filter expressions. Only matching data is transferred to the Trino worker — not the full dataset. This is critical for performance when querying petabyte-scale world data.

---

## 7. Cross-Domain Bridging in Zero-Trust Environments

When federation spans security domains (different tenants, classification levels, or organizational boundaries), data must cross trust boundaries. Cross-domain solutions (CDS) control what data moves, in which direction, and with what transformations applied.

### 7.1 Unidirectional Security Gateway (Data Diode)

A data diode is a hardware-enforced one-way data flow device. It uses physical properties (typically optical: a laser transmitter on one side, a photodiode receiver on the other, no return fiber) to guarantee that data can flow in only one direction. There is no protocol-level bypass — the physics prevents it.

**VAV application:** Spectator-only world mirrors. A data diode between the primary Ceph cluster and a read-only mirror ensures that the mirror can receive world state updates but can never send data back to the primary. Spectators see the world in near-real-time; they cannot modify it, and compromise of the mirror cannot affect the primary.

```
Primary Ceph                 Data Diode              Read-Only Mirror
┌──────────┐     ┌──────────────────────┐     ┌──────────────┐
│ RBD Image │────▶│  TX (laser)  │ no   │────▶│  RBD Image   │
│ (read/    │     │              │return│     │  (read-only) │
│  write)   │     │  RX (photo)  │ path │     │              │
└──────────┘     └──────────────────────┘     └──────────────┘
```

**Limitations:** The diode introduces latency (store-and-forward at the TX side) and prevents any acknowledgment from the receiver. The sender does not know if data arrived. This requires application-level error recovery — send data redundantly and let the receiver deduplicate.

### 7.2 Content-Based Filtering

A content filter inspects every data item crossing a domain boundary and applies pattern-matching rules to detect and block sensitive content:

- **DLP (Data Loss Prevention):** Regex patterns for credit card numbers, SSNs, API keys, CephX keyring material
- **Block palette filtering:** Restrict which block types cross the boundary (e.g., no command blocks, no structure blocks that embed NBT)
- **Player data anonymization:** Strip or hash player UUIDs, replace coordinates with zone identifiers, remove inventory contents

```
Source Domain                Content Filter              Target Domain
┌──────────┐     ┌──────────────────────────┐     ┌──────────┐
│ Full world│────▶│ 1. Parse NBT/Anvil      │────▶│ Filtered │
│ data      │     │ 2. Apply DLP rules       │     │ world    │
│           │     │ 3. Strip player UUIDs    │     │ data     │
│           │     │ 4. Remove command blocks │     │          │
│           │     │ 5. Pass/reject per-chunk │     │          │
└──────────┘     └──────────────────────────┘     └──────────┘
```

### 7.3 Break-and-Inspect Proxy

A break-and-inspect proxy terminates TLS connections, inspects the decrypted content, applies filtering rules, and re-encrypts for the onward connection. From the client's perspective, the connection appears end-to-end; in reality, the proxy has full visibility.

**VAV application:** Between federated query engines and data sources. The proxy:
1. Terminates the TLS connection from the Trino worker
2. Inspects the SQL query for unauthorized patterns (e.g., `SELECT * FROM player_data` without a WHERE clause — potential data exfiltration)
3. Inspects the response for sensitive data (player UUIDs, keyring material, coordinates in restricted zones)
4. Re-encrypts and forwards to the Trino worker

**Trade-off:** Adds latency (2x TLS handshake + inspection time). Requires the proxy to hold a trusted CA certificate that both sides accept. Breaks end-to-end encryption guarantees — the proxy is a privileged position that must be secured.

### 7.4 Format-Based Sanitization

Convert data to a neutral format that cannot carry executable content before crossing a domain boundary:

| Source Format | Neutral Format | What Is Stripped |
|---------------|----------------|------------------|
| NBT (binary, arbitrary nesting) | JSON (text, flat schema) | Custom tags, function references, command block content |
| Anvil `.mca` (binary, sector-based) | CSV (chunk coordinate, biome, block count) | Raw block data, entity data, tile entity NBT |
| Schematic (binary, block + entity) | PDF/A (rendered image) | All executable content; output is visual-only |
| Arrow IPC (binary, columnar) | Parquet (columnar, file-based) | In-memory pointers, metadata extensions |

**Principle:** The sanitized format should be *lossy by design* — it should contain only the information needed for the receiving domain's use case, nothing more. Over-sharing is a vulnerability.

---

## 8. DR Test Plan

A backup that has never been tested is not a backup — it is a hope. This section specifies the DR test plan with concrete RTO/RPO targets and pass/fail criteria.

### 8.1 RTO/RPO Targets

| World Tier | RPO Target | RTO Target | Backup Method | Test Frequency |
|------------|-----------|-----------|---------------|----------------|
| **Tier 1: Active** (players online, SLA) | <60 seconds | <5 minutes | Journal-mode RBD mirror | Monthly |
| **Tier 2: Idle** (no players, server running) | <1 hour | <30 minutes | Snapshot-mode RBD mirror | Quarterly |
| **Tier 3: Archived** (server stopped) | <24 hours | <4 hours | BorgBackup cold restore | Quarterly |
| **Tier 4: Air-gapped** (LTO tape) | <7 days | <24 hours | Tape restore + RBD import | Semi-annually |

### 8.2 Test Scenarios

**Scenario 1: Planned Failover (Tier 1)**

| Step | Action | Expected Result | Pass Criteria |
|------|--------|-----------------|---------------|
| 1 | Quiesce Minecraft server (`save-all`, `save-off`, `stop`) | Server stopped cleanly | Exit code 0, no crash dump |
| 2 | Create final snapshot | Snapshot visible in `rbd snap ls` | Snapshot timestamp within 1 second of creation time |
| 3 | Demote primary image | Image state = `demoted` | `rbd mirror image status` shows demoted |
| 4 | Verify journal drain at secondary | `entries_behind_primary: 0` | Zero entries behind within 30 seconds |
| 5 | Promote secondary | Image state = `primary` | `rbd mirror image status` shows primary |
| 6 | Boot VM and start Minecraft | Players can connect and interact | Server accepting connections within 5 minutes of step 1 |
| 7 | Verify world integrity | Block state matches pre-failover | Spot-check 10 known builds; all intact |

**Scenario 2: Unplanned Failover (Tier 1)**

| Step | Action | Expected Result | Pass Criteria |
|------|--------|-----------------|---------------|
| 1 | Simulate site A failure (network partition or power off) | Site A unreachable | Ping timeout to all site A hosts |
| 2 | Force-promote secondary | Image state = `primary` | `rbd mirror image promote --force` succeeds |
| 3 | Boot VM and start Minecraft | Players can connect | Server accepting connections within 3 minutes |
| 4 | Assess data loss | Compare last known block state vs. recovered state | Data loss <= 60 seconds of writes (journal RPO) |
| 5 | Restore site A as secondary | Re-establish mirror from new primary | `rbd mirror image status` shows replaying |

**Scenario 3: Cold Restore from BorgBackup (Tier 3)**

| Step | Action | Expected Result | Pass Criteria |
|------|--------|-----------------|---------------|
| 1 | List available archives | Archive list displayed | Target archive present and healthy |
| 2 | Verify archive integrity | `borg check --verify-data` passes | Zero errors |
| 3 | Extract and import | `borg extract --stdout` piped to `rbd import` | New RBD image created with correct size |
| 4 | Boot VM from restored image | Minecraft server starts | World loads without corruption errors |
| 5 | Verify world integrity | Spot-check known builds | All sampled builds intact |
| 6 | Measure total restore time | Clock from step 1 to step 4 completion | RTO <= 4 hours |

**Scenario 4: Tape Restore (Tier 4)**

| Step | Action | Expected Result | Pass Criteria |
|------|--------|-----------------|---------------|
| 1 | Retrieve tape from offsite vault | Tape physically available | Chain of custody log complete |
| 2 | Verify tape integrity | `mt status`, read-back checksum | Checksums match recorded values |
| 3 | Extract Borg archive from tape | Tar extract to staging area | Files extracted without error |
| 4 | Import to Ceph | `borg extract --stdout` piped to `rbd import` | RBD image created |
| 5 | Boot and verify | Minecraft server starts, world loads | World intact, builds verified |
| 6 | Measure total restore time | Clock from step 1 to step 5 | RTO <= 24 hours |

### 8.3 Test Schedule

| Test | Frequency | Duration | Personnel | Documentation |
|------|-----------|----------|-----------|---------------|
| Planned failover (single world) | Monthly | 30 min | 1 operator | Runbook + test log |
| Unplanned failover (simulated site loss) | Quarterly | 2 hours | 2 operators | Runbook + test log + incident report format |
| BorgBackup cold restore | Quarterly | 4 hours | 1 operator | Runbook + test log |
| LTO tape restore | Semi-annually | 8 hours | 1 operator + tape handler | Runbook + chain of custody log |
| Cross-site network partition test | Semi-annually | 4 hours | 2 operators + netops | Runbook + network diagram |
| CephX keyring rotation drill | Annually | 1 hour | 1 operator | Runbook + audit log |
| Full end-to-end DR rehearsal (all tiers) | Annually | Full day | All operators | Comprehensive test report |

### 8.4 Test Reporting

Every DR test produces a test log containing:

```
DR Test Report
==============
Date:           2026-03-10
Scenario:       Planned Failover (Tier 1)
World UUID:     d4e5f6a7-b8c9-4d0e-a1f2-3b4c5d6e7f80
Operator:       <name>
Start time:     14:30:00 UTC
End time:       14:34:27 UTC
RTO achieved:   4m 27s (target: 5m 00s)  [PASS]
RPO achieved:   0s (planned failover)     [PASS]
Data integrity: 10/10 builds verified     [PASS]
Issues found:   None
Recommendations: None
Next test date: 2026-04-10
```

---

## 9. M2 Retrospective Forward Lesson

M13's backup strategy recovers corrupt chunks from RADOS replicas — if one OSD's copy is damaged, the other two replicas provide clean data. Audio restoration (M16) fills holes in degraded recordings via spectral interpolation — missing frequencies are reconstructed from neighboring frames and harmonic structure.

**The same principle operates at every layer:** reconstruct missing data from neighbors and redundant copies.

| Layer | Missing Data | Neighbors / Redundancy | Reconstruction Method |
|-------|-------------|----------------------|----------------------|
| Ceph OSD | Corrupt object replica | Other OSD replicas (size 3) | RADOS scrub + automatic repair from clean replica |
| RBD snapshot | Deleted blocks (CoW) | Snapshot preserves pre-delete state | Rollback or clone from snapshot |
| BorgBackup | Lost archive chunk | Content-defined chunking with dedup = same chunk in other archives | Borg repair from available chunks |
| Audio (M16) | Degraded frequency band | Adjacent time frames + harmonic series | Spectral interpolation, Wiener filter |
| Minecraft world | Griefed build | Pre-griefing snapshot or CDP journal | Point-in-time restore to pre-damage state |
| Federation | Unreachable data source | Cached query results, materialized views | Serve from cache with staleness indicator |

**The insight is structural, not incidental.** Redundancy is not waste — it is the cost of reliability. Every copy, every replica, every neighboring frame that seems redundant is actually load-bearing when something fails. The 3-2-1-1-0 rule is the storage engineer's version of M16's spectral repair: maintain enough independent copies that any single loss can be reconstructed from what remains.

---

## 10. Minecraft/Ceph Mapping

The backup and federation concepts map directly to Minecraft gameplay and world management concepts. These are not metaphors — they are operational equivalences.

| Storage/Federation Concept | Minecraft/World Equivalent | Operational Meaning |
|---|---|---|
| **RBD snapshot** | World save-state | Player can roll back to a previous world state (pre-griefing, pre-TNT, pre-bug) |
| **BorgBackup dedup** | Storing only changed chunks | Most of the world is unchanged between saves — terrain, oceans, mountains. Only player-modified areas consume backup space |
| **RBD journal-mode mirror** | Real-time world replication | A second server maintains a live copy of the world, updated as players build. If the primary dies, the mirror takes over |
| **Federation** | Querying across sovereign worlds | An operator queries player statistics, block distributions, and server metrics across 50 independent worlds without copying any world data to a central database |
| **Arrow Flight** | High-speed transport between federated servers | The fast lane connecting world servers — columnar data streams at multi-gigabit speeds instead of row-at-a-time JDBC crawl |
| **Data diode** | One-way world replication (spectator mirror) | Spectators see the live world but cannot modify it. The mirror receives updates but can never send data back. Physics-enforced read-only |
| **3-2-1-1-0** | Complete world data protection | Primary Ceph cluster + RBD journal mirror (site B) + BorgBackup (cold) + LTO tape (air-gapped) + checksum verification (zero errors) |
| **Content-based filter** | Block type whitelist for cross-world export | Only approved block types cross world boundaries — no command blocks, no structure blocks with embedded NBT |
| **Trino federated query** | Cross-world analytics dashboard | "Show me the top 10 most-placed blocks across all worlds this week" — a single SQL query that federates across 50 Ceph clusters |
| **Snapshot retention policy** | Auto-save history | Like Minecraft's auto-save, but with configurable retention: 15-minute saves kept for 12 hours, hourly saves for a week, daily for a month |
| **CDP point-in-time recovery** | Undo to any moment | Not just "load last save" but "undo to exactly 2:37 PM when the creeper exploded" — journal replay to arbitrary timestamps |

---

## 11. Safety and Sensitivity Considerations

### 11.1 Risk Matrix

| Area | Risk | Severity | Mitigation |
|------|------|----------|------------|
| **Backup integrity** | Silent corruption in stored snapshots, Borg archives, or tape | Critical | Periodic `borg check --verify-data`, Ceph deep scrub, tape read-back verification. The "+0" in 3-2-1-1-0 |
| **Key management** | Loss of LUKS key = permanent data loss; compromise of key = unauthorized access | Critical | Key stored in Barbican/Vault (not on the same host as data). Key rotation annually. Emergency key escrow with split custody |
| **Ransomware** | Attacker encrypts all accessible copies | Critical | Air-gapped LTO copy is unreachable by network-based ransomware. BorgBackup append-only mode prevents deletion of existing archives |
| **Backup chain break** | Missing incremental in chain makes all subsequent incrementals useless | High | Limit chain depth (7-14 incrementals). Periodic differential or full baseline. Borg dedup avoids chain dependency entirely |
| **Federation data leakage** | Federated query returns data the requesting domain should not see | High | Push-down predicates with row-level security. Break-and-inspect proxy on cross-domain paths. Content-based filtering |
| **Cross-domain escalation** | Compromise of federation adapter grants access to underlying data source | High | Federation adapters run with read-only credentials. No write path from federation to source. Network segmentation between federation and storage tiers |
| **Player data in backups** | PII (player UUIDs, position, inventory) persists in all backup copies | Medium | All copies encrypted at rest (LUKS + Borg encryption). Access controlled by CephX keyrings. Anonymize before federation query results cross domain boundaries |
| **Stale cache in federation** | Federation serves outdated data from cache after source update | Low | TTL-based cache invalidation. Staleness indicator in query results. No caching for writes |

### 11.2 Safety-Critical Success Criteria

| ID | Criterion | Test Method | Pass Condition |
|----|-----------|-------------|----------------|
| SC-19A | RPO <= 60 seconds for Tier 1 active worlds | Measure journal replication lag under sustained 200 MB/hour write load | Lag remains below 60 seconds for 24 hours |
| SC-19B | RTO <= 5 minutes for planned failover | Timed failover drill per Scenario 1 | VM accepting player connections within 300 seconds |
| SC-19C | RTO <= 3 minutes for unplanned failover | Timed force-promote drill per Scenario 2 | VM accepting player connections within 180 seconds |
| SC-19D | Zero data loss for planned failover | Compare block state pre/post failover | Byte-identical world state |
| SC-19E | BorgBackup integrity verified | `borg check --verify-data` on production repo | Zero errors across all archives |
| SC-19F | Air-gapped copy exists and is restorable | Tape restore drill per Scenario 4 | World loads and passes integrity check |
| SC-19G | Federation queries respect domain boundaries | Attempt cross-tenant query without authorization | Query rejected; no data returned |
| SC-19H | Encrypted at rest on all backup copies | Attempt to read raw data from each copy | Zero plaintext world data detected on any copy |

---

## 12. Connection to Other Modules

| Module | Connection |
|--------|------------|
| **M10 (Multi-Server Fabric)** | MultiPaper master node holds the canonical world state — backup targets the master, not workers. Federation queries route to the master for authoritative data. Worker nodes hold only cached chunks that are reconstructable from the master. |
| **M11 (Sovereign World / OpenStack)** | CephX keyrings from M11's sovereignty model govern backup access. Each world's backup lifecycle is independently controlled — no cross-world access without explicit operator authorization. OpenStack Cinder snapshots layer on top of RBD snapshots for tenant-visible backup management. |
| **M13 (Backup, Security, Hot-Swap)** | M13 established the RBD snapshot primitive, CephX keyring design, LUKS encryption, and hot-swap failover. M19 extends M13's per-world backup into a full 3-2-1-1-0 strategy, adds BorgBackup cold tier, LTO tape air-gap, and overlays the federation query fabric. M13 is the foundation; M19 is the complete architecture. |
| **M17 (Serialization and Wire Formats)** | FlatBuffers and Protobuf serialization formats from M17 define how world data is encoded for federation adapters. Arrow columnar format complements M17's wire formats — FlatBuffers for low-latency game protocol, Arrow for high-throughput analytics federation. |
| **M18 (Transport and Physical Layer)** | M18's sneakernet transport (physical media, RFC 5050 Bundle Protocol) is the delivery mechanism for LTO tape offsite copies. M18's DOCSIS/DSL bandwidth constraints determine whether journal-mode or snapshot-mode mirroring is feasible for a given inter-site link. |
| **M20 (Zero Trust Architecture)** | M20's zero-trust principles govern federation authentication: every query to every adapter requires verified identity, device posture, and authorization check. CephX least-privilege keyrings (from M13, extended here) are the data-plane enforcement of M20's policy decisions. No implicit trust between federation participants. |

---

## 13. Sources

| ID | Reference |
|----|-----------|
| SRC-CEPH-RBD | Ceph Documentation. "RBD Snapshots." https://docs.ceph.com/en/latest/rbd/rbd-snapshot/ — Snapshot creation, CoW semantics, export-diff/import-diff for incremental backup. |
| SRC-CEPH-MIRROR | Ceph Documentation. "RBD Mirroring." https://docs.ceph.com/en/latest/rbd/rbd-mirroring/ — Journal-based and snapshot-based replication, rbd-mirror daemon, failover procedures. |
| SRC-CEPH-ENCRYPT | Ceph Documentation. "RBD Encryption." https://docs.ceph.com/en/reef/rbd/rbd-encryption/ — Per-image LUKS encryption added in Pacific (v16), managed at the RBD layer. |
| SRC-BORG | Hartmann, T. et al. BorgBackup Documentation. https://borgbackup.readthedocs.io/ — Deduplicating archiver with compression, encryption, and stdin streaming support. |
| SRC-BORG-DEDUP | BorgBackup. "Deduplication." https://borgbackup.readthedocs.io/en/stable/internals/data-structures.html — Content-defined chunking with Buzhash rolling hash; variable-length chunks for optimal deduplication. |
| SRC-ARROW | Apache Arrow Documentation. https://arrow.apache.org/docs/ — Columnar in-memory format specification; zero-copy shared memory; language-independent type system. |
| SRC-ARROW-FLIGHT | Apache Arrow. "Arrow Flight RPC." https://arrow.apache.org/docs/format/Flight.html — gRPC-based protocol for streaming Arrow record batches; DoGet/DoPut/DoExchange operations. |
| SRC-TRINO | Trino Documentation. https://trino.io/docs/current/ — Distributed SQL query engine; connector architecture; predicate push-down; federated query execution. |
| SRC-TRINO-CONNECTORS | Trino. "Connectors." https://trino.io/docs/current/connector.html — Hive, PostgreSQL, Elasticsearch, Iceberg, and other connector specifications. |
| SRC-RFC5050 | Scott, K. and Burleigh, S. "Bundle Protocol Specification." RFC 5050, IETF, November 2007. https://datatracker.ietf.org/doc/html/rfc5050 — Delay-tolerant networking protocol for store-and-forward data delivery (sneakernet formalization). |
| SRC-LTO | LTO Ultrium. "LTO Technology." https://www.lto.org/technology/ — Linear Tape-Open specifications: LTO-9 at 18 TB native capacity, 400 MB/s transfer, 30+ year archival life, WORM compliance mode. |
| SRC-LUKS2 | Fruhwirth, C. "LUKS2 On-Disk Format Specification." https://gitlab.com/cryptsetup/LUKS2-docs — Linux Unified Key Setup version 2; AES-256-XTS; token-based key management. |
| SRC-BARBICAN | OpenStack. "Barbican: Key Management Service." https://docs.openstack.org/barbican/latest/ — Secret storage, key lifecycle management, integration with Cinder for volume encryption. |
| SRC-321 | US-CERT. "Data Backup Options." https://www.cisa.gov/news-events/news/data-backup-options — CISA guidance on 3-2-1 backup strategy and offsite data protection. |
| SRC-DIODE | Waterfall Security Solutions. "Unidirectional Security Gateways." https://waterfall-security.com/ — Hardware-enforced one-way data transfer; optical data diode architecture. |
| SRC-MSGR2 | Ceph Documentation. "Messenger v2 Protocol." https://docs.ceph.com/en/latest/dev/msgr2/ — Wire protocol encryption, mutual authentication, secure mode for inter-daemon communication. |
