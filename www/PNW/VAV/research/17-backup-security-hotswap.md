# M13: Backup, Security, Imaging, and Hot Swap

**Module 13 of the Voxel as Vessel research atlas.**
Every sovereign world is someone's home. The blocks placed by hand, the farms tended over months, the redstone contraptions debugged at 2 AM — these are irreplaceable. This module specifies the complete data protection strategy for sovereign worlds: from per-world RBD snapshots through journal/snapshot mirroring to cross-site hot-swap failover. It includes the CephX keyring design, LUKS encryption at rest, and a concrete DR playbook with RPO/RTO targets. The goal is not theoretical resilience — it is the operational guarantee that no world is ever lost to a disk failure, a datacenter outage, or an operator mistake.

---

## Table of Contents

1. [RBD Snapshot Strategy](#1-rbd-snapshot-strategy)
2. [RBD Mirroring Modes](#2-rbd-mirroring-modes)
3. [Hot-Swap Failover Sequence](#3-hot-swap-failover-sequence)
4. [CephX Security Design](#4-cephx-security-design)
5. [Data-at-Rest Encryption](#5-data-at-rest-encryption)
6. [Backup Tooling Landscape](#6-backup-tooling-landscape)
7. [Safety and Sensitivity Considerations](#7-safety-and-sensitivity-considerations)
8. [Connection to Other Modules](#8-connection-to-other-modules)
9. [Sources](#9-sources)

---

## 1. RBD Snapshot Strategy

### 1.1 Copy-on-Write Fundamentals

RBD snapshots exploit Ceph's Copy-on-Write (CoW) semantics at the RADOS object level. When a snapshot is created, no data is copied — the OSD simply records a snapshot context on each object in the image. Subsequent writes allocate new object versions while the snapshotted version remains intact. The result: snapshot creation is **instantaneous** regardless of image size, and storage overhead is proportional only to the volume of data that changes after the snapshot.

This is critical for VAV's operational model. A 50 GB world image can be snapshotted in under 100 milliseconds. The cost is paid later, incrementally, as blocks diverge from the snapshot baseline. For a Minecraft world where most chunks are rarely modified after initial generation, the divergence rate is low — typically 2-5% of the image per day for an active server.

> "A snapshot is a read-only logical copy of an image at a particular point in time. One of the advanced features of Ceph block devices is that you can create snapshots of images to retain point-in-time state history."
> — Ceph Documentation. *RBD Snapshots*. https://docs.ceph.com/en/latest/rbd/rbd-snapshot/

### 1.2 Snapshot Levels

Ceph supports two mutually exclusive snapshot scopes:

| Level | Command | Scope | Use Case |
|-------|---------|-------|----------|
| **Pool-level** | `rados mksnap <name> -p <pool>` | All images in the pool simultaneously | Cluster-wide consistency point |
| **RBD-level** | `rbd snap create <pool>/<image>@<snap>` | Single RBD image | Per-world point-in-time backup |

Pool-level snapshots are atomic across all images but offer no per-world granularity. RBD-level snapshots are the standard for VAV — each world is an independent RBD image, and its snapshot lifecycle is managed independently.

**A pool cannot mix both modes.** If any pool-level snapshot exists, RBD-level snapshots cannot be created, and vice versa. VAV uses RBD-level snapshots exclusively.

### 1.3 Snapshot Creation

Full snapshot of a world image:

```bash
# Create a named snapshot with ISO 8601 timestamp
rbd snap create worlds/<world-uuid>@snap-$(date -u +%Y-%m-%dT%H%M%SZ)

# Example:
rbd snap create worlds/d4e5f6a7-b8c9-4d0e-a1f2-3b4c5d6e7f80@snap-2026-03-10T143000Z
```

List existing snapshots:

```bash
rbd snap ls worlds/<world-uuid>
# SNAPID  NAME                           SIZE    PROTECTED  TIMESTAMP
# 42      snap-2026-03-10T120000Z        50 GiB             Mon Mar 10 12:00:00 2026
# 43      snap-2026-03-10T121500Z        50 GiB             Mon Mar 10 12:15:00 2026
# 44      snap-2026-03-10T123000Z        50 GiB             Mon Mar 10 12:30:00 2026
```

### 1.4 Incremental Export (Delta Between Snapshots)

The power of RBD snapshots for DR lies in incremental export. Given two snapshots of the same image, `export-diff` produces a self-contained binary delta:

```bash
# Export the delta between snap-1 and snap-2
rbd export-diff \
  --from-snap snap-2026-03-10T120000Z \
  worlds/<world-uuid>@snap-2026-03-10T121500Z \
  /backup/delta-120000-to-121500.bin
```

Properties of the delta file:
- **Self-contained**: includes metadata identifying the source and target snapshots
- **Idempotent**: `rbd import-diff` can be interrupted and safely retried without corruption
- **Streamable**: can be piped directly over SSH without intermediate storage

For two-datacenter DR, the delta is transferred and applied in a single pipeline:

```bash
# Stream incremental delta directly to remote cluster
rbd export-diff \
  --from-snap snap-2026-03-10T120000Z \
  worlds/<world-uuid>@snap-2026-03-10T121500Z - | \
  ssh ceph-admin@site-b rbd import-diff - worlds/<world-uuid>
```

The remote cluster receives and applies the delta atomically. If the SSH connection drops mid-transfer, the incomplete import is discarded — the remote image remains at its previous consistent state. Re-run the pipeline to retry.

### 1.5 Snapshot Scheduling

Snapshot frequency balances RPO requirements against storage overhead and replication bandwidth:

| World Activity | Snapshot Interval | Retention | Storage Impact | Rationale |
|----------------|-------------------|-----------|----------------|-----------|
| **Active** (players online) | Every 15 minutes | 48 snapshots (12 hours) | ~2-5% overhead (CoW) | Matches Minecraft auto-save interval; 15-min RPO for active builds |
| **Idle** (no players, server running) | Daily | 30 snapshots (1 month) | Minimal (<0.1%) | No player modifications; only mob/crop ticks |
| **Archived** (server stopped) | On demand | Indefinite | None until divergence | Cold storage; snapshot is free until image is written |

Retention policy implementation via cron:

```bash
#!/bin/bash
# Prune snapshots older than 12 hours for active worlds
WORLD_UUID="$1"
CUTOFF=$(date -u -d '12 hours ago' +%Y-%m-%dT%H%M%SZ)

rbd snap ls "worlds/${WORLD_UUID}" --format json | \
  jq -r ".[] | select(.name < \"snap-${CUTOFF}\") | .name" | \
  while read -r SNAP; do
    rbd snap rm "worlds/${WORLD_UUID}@${SNAP}"
  done
```

### 1.6 Snapshot Space Accounting

Monitor divergence to predict storage growth:

```bash
# Show actual disk usage per snapshot (not logical size)
rbd diff --from-snap snap-2026-03-10T120000Z \
  worlds/<world-uuid>@snap-2026-03-10T121500Z --format json | \
  jq '[.[].length] | add'
# Returns bytes modified between the two snapshots
```

For a typical Minecraft server with 10 active players, expect 50-200 MB of block changes per hour — primarily from chunk generation at exploration frontiers and redstone/piston activity in player bases.

---

## 2. RBD Mirroring Modes

### 2.1 Three Mirroring Strategies

VAV supports three mirroring strategies, selected per-world based on activity level and RPO requirements:

| Mode | Mechanism | RPO | Bandwidth | Complexity | Hot-Swap Ready |
|------|-----------|-----|-----------|------------|----------------|
| **Journal-based** | Real-time journaling; every write replicated to secondary | Seconds (replication lag) | High (continuous) | Medium | Yes |
| **Snapshot-based** | Periodic snapshot diff export/import | Minutes to hours | Low (batch) | Low | Yes (at snapshot boundary) |
| **BorgBackup + RBD export** | Stream full RBD export to Borg repo; dedup + compression | Hours to days | Low (batch) | Low | No (restore required) |

### 2.2 Journal-Based Mirroring

Journal-based mirroring is the primary mode for active worlds requiring near-zero RPO. The RBD journaling feature records every write operation to a per-image journal object before acknowledging the write to the client. The `rbd-mirror` daemon on the secondary site replays the journal in order.

Enable journaling on a world image:

```bash
# Enable journaling feature on the image
rbd feature enable worlds/<world-uuid> journaling

# Enable mirroring in journal mode
rbd mirror image enable worlds/<world-uuid> journal
```

The replication pipeline:

```
Site A (Primary)                          Site B (Secondary)
┌──────────────┐                         ┌──────────────┐
│ Minecraft VM │                         │  rbd-mirror  │
│   writes     │                         │    daemon    │
│      │       │                         │      │       │
│      ▼       │                         │      ▼       │
│ RBD Journal  │──── Ceph Messenger ────▶│ Journal Replay│
│ (RADOS obj)  │     v2 (encrypted)      │ (apply writes)│
│      │       │                         │      │       │
│      ▼       │                         │      ▼       │
│  RBD Image   │                         │  RBD Image   │
│  (primary)   │                         │  (secondary) │
└──────────────┘                         └──────────────┘
```

**Replication lag target:** Under normal network conditions (site-to-site latency < 50 ms, bandwidth > 100 Mbps), journal replay lag MUST remain below 60 seconds. This meets SC-9 (RPO <= 15 minutes for active worlds) with substantial margin.

Monitor replication status:

```bash
# Check mirror status for a specific image
rbd mirror image status worlds/<world-uuid>

# Expected output for healthy replication:
#   state: up+replaying
#   description: replaying, {"bytes_per_second": 1048576, "entries_behind_primary": 3}
```

### 2.3 Snapshot-Based Mirroring

For idle or low-priority worlds, snapshot-based mirroring reduces bandwidth at the cost of higher RPO:

```bash
# Enable snapshot-based mirroring
rbd mirror image enable worlds/<world-uuid> snapshot

# Create a mirror snapshot (triggers replication)
rbd mirror image snapshot worlds/<world-uuid>
```

The `rbd-mirror` daemon on site B detects new mirror snapshots and pulls the diff automatically. Schedule mirror snapshots at the desired RPO interval via cron or systemd timer.

### 2.4 BorgBackup Cold Archive

For worlds that need long-term archival without a hot secondary, BorgBackup provides excellent storage efficiency through block-level deduplication and compression:

```bash
# Initialize Borg repository (one-time)
borg init --encryption=repokey /backup/borg-worlds

# Stream RBD export directly to Borg (no intermediate file)
rbd export worlds/<world-uuid> - | \
  borg create --stdin-name "<world-uuid>.raw" \
  /backup/borg-worlds::"$(date -u +%Y-%m-%dT%H%M%SZ)" -

# Restore: extract from Borg and import
borg extract --stdout /backup/borg-worlds::2026-03-10T143000Z | \
  rbd import - worlds/<world-uuid>-restored
```

Borg's deduplication means storing 100 snapshots of a 50 GB world that changes 1% per snapshot costs approximately 50 GB + (100 * 500 MB) = 100 GB, not 5 TB. No secondary Ceph cluster required.

---

## 3. Hot-Swap Failover Sequence

### 3.1 Planned Failover (Both Sites Operational)

Planned failover is used for maintenance, migration, or load rebalancing. Both sites are healthy. The procedure guarantees zero data loss.

**Step-by-step sequence:**

| Step | Action | Command / Method | Duration |
|------|--------|------------------|----------|
| 1 | **Quiesce world** | Send `save-all` + `stop` to Minecraft RCON | 5-15 sec |
| 2 | **Filesystem freeze** | `fsfreeze --freeze /mnt/world` (or Minecraft save lock) | < 1 sec |
| 3 | **Final snapshot** | `rbd snap create worlds/<uuid>@failover-final` | < 100 ms |
| 4 | **Demote primary** | `rbd mirror image demote worlds/<uuid>` | 1-5 sec (journal drain) |
| 5 | **Verify sync** | Poll `rbd mirror image status` until `entries_behind_primary: 0` | 5-30 sec |
| 6 | **Promote secondary** | `rbd mirror image promote worlds/<uuid>` on site B | < 1 sec |
| 7 | **Boot VM** | `openstack server create` from promoted Cinder volume on site B | 30-60 sec |
| 8 | **Start server** | Minecraft server process start; world loads from promoted image | 15-30 sec |

**Total RTO target: <= 5 minutes** (SC-10 success criterion).

Detailed CLI sequence:

```bash
# === SITE A (primary) ===

# Step 1: Quiesce Minecraft
mcrcon -H localhost -P 25575 -p "$RCON_PASS" "say Server migrating. Save in progress..." \
  "save-all" "save-off"
sleep 10  # Wait for save-all to complete
mcrcon -H localhost -P 25575 -p "$RCON_PASS" "stop"

# Step 2: Filesystem freeze (if using mounted filesystem)
sudo fsfreeze --freeze /mnt/world

# Step 3: Final snapshot
rbd snap create worlds/${WORLD_UUID}@failover-$(date -u +%Y%m%dT%H%M%SZ)

# Step 4: Demote primary
rbd mirror image demote worlds/${WORLD_UUID}
sudo fsfreeze --unfreeze /mnt/world  # Unfreeze after demote

# === SITE B (secondary) ===

# Step 5: Verify journal fully replayed
while true; do
  BEHIND=$(rbd mirror image status worlds/${WORLD_UUID} --format json | \
    jq '.entries_behind_primary // 0')
  [ "$BEHIND" -eq 0 ] && break
  echo "Waiting... entries behind: $BEHIND"
  sleep 2
done

# Step 6: Promote secondary to primary
rbd mirror image promote worlds/${WORLD_UUID}

# Step 7: Boot VM from promoted volume
openstack server create \
  --flavor mc.world.medium \
  --volume worlds-${WORLD_UUID} \
  --network sovereign-net \
  --wait \
  "mc-${WORLD_UUID}"

# Step 8: Start Minecraft (via cloud-init or SSH)
ssh mc-admin@mc-${WORLD_UUID} "sudo systemctl start minecraft-world"
```

### 3.2 Unplanned Failover (Site A Down)

When site A is unreachable, steps 1-4 are impossible. The secondary must be force-promoted:

```bash
# === SITE B (secondary) ===

# Force-promote without waiting for primary demote
rbd mirror image promote --force worlds/${WORLD_UUID}

# Boot and start as normal (steps 7-8 from planned sequence)
```

**Data loss exposure:** The force-promote accepts all journal entries received so far. Any writes that were acknowledged by the primary OSD but not yet replicated are lost. With journal-based mirroring and replication lag <= 60 seconds, the worst-case loss is 60 seconds of gameplay — typically a few hundred block changes and entity position updates.

**RPO for unplanned failover = replication lag at time of failure.** Target: <= 60 seconds (journal mode) or <= snapshot interval (snapshot mode).

### 3.3 Failover Timeline

```
Planned Failover:

Site A: [ACTIVE]──save──freeze──snap──demote────────────────[STANDBY]
                    │                    │
                    │    journal drain   │
                    │         │          │
Site B: [STANDBY]──┼─────────┼──sync────promote──boot──start─[ACTIVE]
                    │         │                              │
                    |←── quiesce: ~15s ──→|                  |
                    |←──────────── RTO target: ≤ 5 min ────→|


Unplanned Failover:

Site A: [ACTIVE]──────────── ✕ FAILURE ✕
                              │
Site B: [STANDBY]─────────────promote(force)──boot──start──[ACTIVE]
                              │                            │
                              |←── RTO target: ≤ 3 min ──→|
                              (RPO = replication lag at failure)
```

### 3.4 The Cardinal Rule: Never Dual-Primary

**SC-SWAP (safety-critical):** Both sites MUST NOT accept writes simultaneously. If both sites believe they are primary, world state diverges into an unresolvable split-brain. The Ceph `rbd-mirror` daemon enforces this through the promote/demote protocol — an image can have at most one primary at any time.

The `--force` flag on promote bypasses the check for a clean demote, but it does NOT create a dual-primary. It marks the remote as primary and assumes the old primary is dead. If the old primary comes back online, it MUST be demoted before any further operations.

**Recovery from accidental dual-primary (split-brain):**

1. Stop both Minecraft servers immediately.
2. Identify which site has the more recent data (check last snapshot timestamps).
3. Demote the stale site.
4. Re-sync from the authoritative site.
5. Resume on the authoritative site only.

This scenario should never occur in normal operations. If it does, treat it as a severity-1 incident requiring manual review before world service resumes.

---

## 4. CephX Security Design

### 4.1 Per-World Keyring (Least Privilege)

Every sovereign world receives its own CephX keyring with minimum-privilege capabilities scoped to its namespace:

```ini
[client.world-d4e5f6a7-b8c9-4d0e-a1f2-3b4c5d6e7f80]
    key = AQBxyz123...==
    caps mon = "profile rbd"
    caps osd = "profile rbd pool=worlds namespace=d4e5f6a7-b8c9-4d0e-a1f2-3b4c5d6e7f80"
    caps mgr = "profile rbd pool=worlds"
```

Create the keyring:

```bash
ceph auth get-or-create client.world-${WORLD_UUID} \
  mon 'profile rbd' \
  osd "profile rbd pool=worlds namespace=${WORLD_UUID}" \
  mgr 'profile rbd pool=worlds' \
  -o /etc/ceph/client.world-${WORLD_UUID}.keyring
```

### 4.2 Capability Boundaries

This keyring **can**:
- Read and write RBD images within its namespace in the `worlds` pool
- Create and manage snapshots of its own images
- List its own images

This keyring **cannot**:
- Read or write any other world's namespace
- Access pools outside `worlds` (no access to `vav-meta`, `vav-cache`, or system pools)
- Modify CRUSH rules, pool settings, or cluster configuration
- List or enumerate other namespaces (no information leakage about other worlds)

### 4.3 Operator and Cross-World Access

Administrative operations requiring access to multiple worlds use a separate operator keyring:

```ini
[client.vav-operator]
    key = AQBoperator...==
    caps mon = "profile rbd, allow r"
    caps osd = "profile rbd pool=worlds"
    caps mgr = "profile rbd pool=worlds"
```

This keyring is held by the platform operator (not individual world owners) and is used for:
- Cross-world migration and rebalancing
- Cluster-wide snapshot operations
- Monitoring and capacity planning

**Access audit:** All CephX authentication events are logged by the MON daemons. Keyring usage is traceable to specific client identities.

### 4.4 Keyring Lifecycle

| Event | Action | Command |
|-------|--------|---------|
| World created | Generate keyring | `ceph auth get-or-create client.world-<uuid> ...` |
| World migrated | Copy keyring to new host | Secure transfer via Barbican or Vault |
| World archived | Revoke keyring | `ceph auth rm client.world-<uuid>` |
| Compromise suspected | Rotate keyring | `ceph auth caps client.world-<uuid> ...` (re-issue) |

---

## 5. Data-at-Rest Encryption

### 5.1 Encryption Layers

VAV employs defense-in-depth encryption across three layers:

```
┌─────────────────────────────────────────────────┐
│                  Application Layer                │
│  Player UUID.dat files ─── encrypted at rest      │
│  via LUKS on the VM filesystem                    │
├─────────────────────────────────────────────────┤
│                  Block Device Layer               │
│  LUKS full-disk encryption on RBD-backed volume   │
│  Key: OpenStack Barbican or local key escrow      │
├─────────────────────────────────────────────────┤
│                  Transport Layer                  │
│  Ceph Messenger v2 protocol (msgr2)               │
│  Mutual TLS authentication                        │
│  Encrypts all OSD-to-OSD and client-to-OSD traffic│
└─────────────────────────────────────────────────┘
```

### 5.2 LUKS on VM Disk

The VM's root and data volumes are encrypted with LUKS, layered above the RBD block device:

```bash
# Format the RBD-mapped device with LUKS
cryptsetup luksFormat /dev/rbd0 --key-file /etc/barbican/world-key

# Open the encrypted device
cryptsetup luksOpen /dev/rbd0 world-crypt --key-file /etc/barbican/world-key

# Create filesystem on encrypted device
mkfs.ext4 /dev/mapper/world-crypt
mount /dev/mapper/world-crypt /mnt/world
```

LUKS encryption is transparent to Ceph — the OSD stores encrypted blocks without any awareness of the encryption. This means:
- Snapshots capture encrypted data (safe for offsite replication)
- RBD export/import preserves encryption (deltas are encrypted)
- An attacker with OSD access sees only ciphertext

Key management options:

| Method | Mechanism | Availability | Security |
|--------|-----------|--------------|----------|
| **OpenStack Barbican** | Key stored in Barbican secret store; retrieved at VM boot | Requires Barbican service | Keys separated from data |
| **HashiCorp Vault** | Key stored in Vault; auto-unsealed via transit engine | Requires Vault cluster | Strong audit trail |
| **Local key escrow** | Key stored in `/etc/barbican/` on management node | Always available | Weaker separation |

### 5.3 TLS for RBD Mirroring

Ceph Messenger v2 (msgr2) encrypts all inter-daemon communication, including journal-based mirroring traffic between sites:

```ini
# ceph.conf — enable messenger v2 with encryption
[global]
    ms_cluster_mode = secure
    ms_service_mode = secure
    ms_client_mode  = secure
    ms_mon_cluster_mode = secure
```

All journal entries, snapshot diffs, and control messages between site A and site B travel over encrypted channels with mutual X.509 certificate authentication. No cleartext world data crosses the wire.

### 5.4 Player Data Encryption

Minecraft stores per-player data in `<world>/playerdata/<UUID>.dat` files containing:
- Inventory contents
- Position coordinates
- Health, hunger, experience
- Ender chest contents
- Advancements

These files constitute **personally identifiable information (PII)** — the UUID maps to a Mojang account, and inventory/position data reveals player behavior.

**SC-PII (safety-critical):** Plaintext player data MUST NOT be accessible on cold storage. LUKS encryption on the VM disk satisfies this — `playerdata/*.dat` files are encrypted at rest along with all other world data. Verification:

```bash
# Attempt to read player data from raw RBD export (should be ciphertext)
rbd export worlds/<world-uuid> - | strings | grep -c "minecraft:"
# Expected: 0 (all data encrypted; no plaintext block names visible)
```

---

## 6. Backup Tooling Landscape

### 6.1 Tool Comparison Matrix

| Tool | Approach | Strengths | Limitations | License |
|------|----------|-----------|-------------|---------|
| **rbd-brctl** (inwinstack) | YAML-driven full/incremental backup with configurable circle counts and snapshot retention | Simple, declarative config; lightweight | Limited monitoring; no encryption integration | Apache 2.0 |
| **ceph-rbd-backup** (camptocamp) | Daily snapshot + incremental export to backup cluster; Nagios-compatible check action | Enterprise monitoring integration; battle-tested in production | Assumes daily cadence; limited scheduling flexibility | Apache 2.0 |
| **BorgBackup + rbd export** | Block-level deduplication; streams RBD export via stdin; no intermediate files | Excellent storage efficiency; encryption built-in; no secondary cluster needed | No hot-swap capability; restore time proportional to image size | BSD-3 |
| **Storware vProtect** | Enterprise solution; proxy VM attach + RBD snap-diff; OpenStack Cinder integration; policy-based scheduling | Full lifecycle management; UI; compliance reporting | Commercial license; heavyweight deployment | Proprietary |
| **Trilio** | Cloud-native DR; Ceph RBD snapshot pull + snapshot-diff for incremental; Kubernetes + OpenStack focus; compliance-ready | Compliance and audit trails; OpenStack-native; supports selective restore | Commercial license; Kubernetes-centric documentation | Proprietary |

### 6.2 Recommended Stack for VAV

For sovereign world hosting, the recommended tooling stack is:

```
Active worlds:     Journal-based RBD mirroring (built-in Ceph)
                   + snapshot retention via cron/systemd
Idle worlds:       Snapshot-based RBD mirroring
                   + weekly BorgBackup archive
Archived worlds:   BorgBackup only (cold storage, encrypted)
Monitoring:        ceph-rbd-backup check action → Prometheus/Alertmanager
```

This avoids vendor lock-in, uses open-source tooling for all tiers, and reserves commercial solutions (Storware, Trilio) as optional enterprise add-ons for operators who need compliance reporting or managed UI.

> Source: Storware. "Backup Strategies for Ceph." https://storware.eu/blog/backup-strategies-for-ceph/ (September 2025).

---

## 7. Safety and Sensitivity Considerations

### 7.1 Risk Matrix

| Area | Risk | Severity | Mitigation |
|------|------|----------|------------|
| **RADOS keyrings** | Secret exposure in config files, logs, or version control | Critical | Never store keyrings in world files, plugin configs, or VCS. Use Barbican or Vault. Audit `ceph auth ls` output regularly. |
| **Player UUID data** | Privacy violation (GDPR Art. 17, COPPA) | High | Player data files are PII. Encrypt at rest (LUKS), restrict keyring access to world namespace only, anonymize UUIDs in analytics pipelines. |
| **World EULA** | IP/licensing violation | Medium | World files contain Mojang-generated terrain. Export pipelines must not redistribute protected content without EULA compliance. Backup is permitted; redistribution is not. |
| **Seed recovery** | Reverse engineering of world generation parameters | Low | LCG seed recovery from chunk data is feasible (see M9, Section 4.4). Do not treat the seed as a secret — treat world content (player builds, chest inventories) as the protected asset. |
| **Hot-swap timing** | Data loss during failover | High | Always demote before promote. Never allow concurrent primaries. Journal mode reduces RPO to seconds but never to true zero. Document accepted RPO per world tier. |
| **Backup integrity** | Silent corruption in stored snapshots or deltas | Medium | Verify backups via periodic test-restore. Ceph scrub detects OSD-level corruption. BorgBackup has built-in integrity verification (`borg check`). |

### 7.2 Safety-Critical Success Criteria

| ID | Criterion | Test Method | Pass Condition |
|----|-----------|-------------|----------------|
| SC-9 | RPO <= 15 minutes for active worlds | Measure replication lag under load | Journal lag < 60 sec sustained |
| SC-10 | RTO <= 5 minutes for planned failover | Timed failover drill | VM serving traffic within 300 sec |
| SC-SWAP | No dual-primary operation | Attempt promote without demote (expect rejection) | Promote fails unless `--force` used |
| SC-PII | No plaintext player data on cold storage | Read raw RBD export; search for plaintext | Zero plaintext PII detected |
| SC-KEY | Keyring isolation between worlds | Attempt cross-namespace access | Access denied by CephX caps |

### 7.3 DR Drill Schedule

| Drill | Frequency | Duration | Personnel |
|-------|-----------|----------|-----------|
| Planned failover (single world) | Monthly | 30 min | 1 operator |
| Unplanned failover (simulated site loss) | Quarterly | 2 hours | 2 operators |
| Full restore from BorgBackup | Quarterly | 4 hours | 1 operator |
| Cross-site network partition test | Semi-annually | 4 hours | 2 operators + netops |
| Keyring rotation drill | Annually | 1 hour | 1 operator |

---

## 8. Connection to Other Modules

| Module | Connection |
|--------|------------|
| **M1 (Ceph/RADOS)** | Pool architecture (`vav-regions`, `vav-meta`, `vav-cache`) provides the storage layer these snapshots protect. CRUSH rules from M1 determine replica placement; backup inherits the same fault domains. |
| **M3 (Integration Architecture)** | The hierarchical address scheme (seed > region > chunk > section > block) defines what is being snapshotted. Backup granularity aligns with RBD image boundaries, which map to world-level containers. |
| **M4 (Anvil/NBT)** | Region files (`.mca`) are the primary payload within RBD images. Snapshot consistency guarantees that Anvil file writes are atomic at the RADOS object level. |
| **M7 (Block/Chunk Data)** | Block palette compression (Section 1.3) determines the divergence rate after snapshots — dense palettes change more frequently, affecting CoW overhead estimates in Section 1.5. |
| **M8 (Texture/Resource Packs)** | Resource packs are stored separately from world data. They do not require per-world backup — a single versioned copy suffices. |
| **M9 (PCG Seed Manifold)** | Seed recovery (Section 4.4) means base terrain is always reconstructable from the seed. Backups protect player modifications (the delta over procedural base), not the generated terrain itself. |
| **M10 (Multi-Server)** | MultiPaper Master's region files are the primary backup target. In a multi-server deployment, the master node holds the canonical world state; worker nodes hold only cached chunks. Backup the master, not the workers. |
| **M11 (Sovereignty)** | CephX keyrings in Section 4 implement the sovereignty boundary defined in M11. Each world's backup lifecycle is independently controlled by its sovereign keyring — no cross-world access without explicit operator authorization. |
| **M12 (Edge Topology)** | LOD zones (Z0 through Z3) determine backup priority. Z0 (player-active chunks) changes most frequently and receives 15-minute snapshots. Z3 (distant terrain) is effectively static and needs only daily snapshots, reducing backup bandwidth for edge-heavy deployments. |

---

## 9. Sources

| ID | Reference |
|----|-----------|
| SRC-RBD-SNAP | Ceph Documentation. "RBD Snapshots." https://docs.ceph.com/en/latest/rbd/rbd-snapshot/ — Snapshot creation, protection, cloning, and lifecycle management for RADOS Block Device images. |
| SRC-RBD-MIRROR | Ceph Documentation. "RBD Mirroring." https://docs.ceph.com/en/latest/rbd/rbd-mirroring/ — Journal-based and snapshot-based replication configuration, `rbd-mirror` daemon operation, and failover procedures. |
| SRC-RBD-OPENSTACK | Ceph Documentation. "Block Devices and OpenStack." https://docs.ceph.com/en/latest/rbd/rbd-openstack/ — Integration of RBD with Cinder, Glance, and Nova for OpenStack-managed block storage. |
| SRC-CEPH-INCR | Ceph.io Blog. "Incremental Snapshots with RBD." https://ceph.io/en/news/blog/2013/incremental-snapshots-with-rbd/ (2013) — Design rationale and implementation of `export-diff` / `import-diff` for incremental RBD backup. |
| SRC-OPENMETAL | OpenMetal. "Ceph RBD Mirroring for Disaster Recovery." https://openmetal.io/docs/manuals/operators-manual/ceph-rbd-mirroring-for-disaster-recovery/ (July 2025) — Production deployment guide for cross-site RBD mirroring with OpenStack integration. |
| SRC-VINCHIN | Vinchin. "How to Backup Ceph Based on Snapshot?" https://www.vinchin.com/vm-backup/ceph-snapshot-backup.html (December 2024) — Survey of snapshot-based backup strategies for Ceph clusters. |
| SRC-STORWARE | Storware. "Backup Strategies for Ceph." https://storware.eu/blog/backup-strategies-for-ceph/ (September 2025) — Enterprise backup tooling comparison for Ceph environments including vProtect integration. |
| SRC-BORG | Hartmann, T. et al. BorgBackup Documentation. https://borgbackup.readthedocs.io/ — Deduplicating archiver with compression and encryption; stdin streaming for RBD export integration. |
| SRC-CEPHX | Ceph Documentation. "CephX Authentication." https://docs.ceph.com/en/latest/rados/operations/user-management/ — CephX capability syntax, keyring management, and least-privilege design patterns. |
| SRC-MSGR2 | Ceph Documentation. "Messenger v2 Protocol." https://docs.ceph.com/en/latest/dev/msgr2/ — Wire protocol encryption, mutual authentication, and secure mode configuration for inter-daemon communication. |
| SRC-BARBICAN | OpenStack Barbican Documentation. https://docs.openstack.org/barbican/latest/ — Key management service for OpenStack; LUKS key storage and retrieval for Cinder-managed volumes. |
| SRC-LUKS | Fruhwirth, C. "LUKS On-Disk Format Specification." https://gitlab.com/cryptsetup/LUKS2-docs — Linux Unified Key Setup specification for full-disk encryption. |
| SRC-TRILIO | Trilio Documentation. "TrilioVault for OpenStack." https://docs.trilio.io/ — Cloud-native backup and DR with Ceph RBD snapshot-diff integration and compliance reporting. |
