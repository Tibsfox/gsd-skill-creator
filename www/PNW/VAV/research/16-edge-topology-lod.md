# M12: Infinite Edge Topology and LOD-Driven Dynamic Storage

**Module 12 of the Voxel as Vessel research atlas.**
Minecraft's world border is a hard wall at ±30,000,000 blocks. That wall exists because the noise generator loses precision past 32-bit integer range and because Java's double-precision floating point accumulates visible jitter at large coordinates. But these are implementation constraints, not fundamental limits. This module explores three topology extensions that remove the edge entirely — torus wrap, portal gateway, and multi-world edge stitching — and then specifies the LOD zone system where storage allocation scales dynamically with player proximity. The connection is direct: topology determines how the world extends; LOD determines how much of that extension actually consumes storage. Together they bridge world geometry to Ceph pool allocation policy.

---

## 1. World Edge Topology Options

### 1.1 The Five Topologies

Every world has an edge policy. The question is whether that edge is a wall, a seam, or a gateway.

| Topology | Description | Implementation | Ceph Impact | Coordinate Model |
|----------|-------------|----------------|-------------|------------------|
| **Hard wall** | Default; world border enforced at ±30M blocks | Native Minecraft `WorldBorder` | None — bounded storage | Finite Euclidean plane |
| **Torus wrap** | East/west and north/south edges connected; player teleported with coordinate modular adjustment | Server plugin + noise seed alignment in 4D | Requires noise continuity at seam; no storage duplication | Flat torus T² |
| **Portal gateway** | Warp between two different world UUIDs at matching border coordinates | Velocity plugin + MultiPaper cross-server teleport | Cross-world RBD object copy at transition | Disjoint planes with identified boundary |
| **Edge stitch** | Two adjacent worlds share a border region, stored in both worlds' Ceph pools; chunk data replicated at seam | Custom plugin + RBD mirroring | Redundant storage at seam (2x for overlap zone) | Overlapping manifold charts |
| **Infinite multidimensional** | World UUIDs indexed in n-dimensional lattice; adjacency defined by seed-space distance | v3 scope — full federation model | Full federation with DoltHub replication | Discrete lattice Z^n |

### 1.2 Selection Criteria

The choice depends on what the world represents:

- **Single corpus, bounded:** Hard wall. No complexity. Works for any deployment under ~30M blocks (~937,500 regions).
- **Single corpus, wrap-navigable:** Torus. Walking in one direction eventually returns you to the start. Good for curated knowledge gardens where the corpus has circular thematic structure.
- **Multiple corpora, linked:** Portal gateway. Each world is a sovereign corpus. Gateways are curated connections — you choose which worlds to link, and each link requires bilateral consent (Module 15, sovereignty).
- **Federation at scale:** Infinite multidimensional. Every node in the federation hosts a world; adjacency is semantic (seed-space distance from Module 13). This is the v3 endgame.

### 1.3 Topology Decision Matrix

| Factor | Hard Wall | Torus | Portal | Edge Stitch |
|--------|-----------|-------|--------|-------------|
| Implementation complexity | None | Medium | Medium | High |
| Noise continuity required | No | Yes (4D) | No | Yes (at seam) |
| Cross-server coordination | No | No | Yes (Velocity) | Yes (RBD mirror) |
| Storage overhead | 0% | 0% | 0% | ~5-15% (overlap) |
| Player experience at edge | Invisible wall | Seamless wrap | Loading screen or portal effect | Seamless (if done right) |
| Sovereignty model | Single operator | Single operator | Bilateral agreement | Bilateral + shared zone |

---

## 2. Torus Topology Implementation

### 2.1 The Seam Problem

The naive approach to torus wrap is coordinate modular arithmetic: when the player crosses x = W, teleport them to x = 0. This works for player position but fails catastrophically for terrain: the noise value at (W-1, z) has no relationship to the noise value at (0, z) in standard 2D Perlin/simplex noise. The result is a visible cliff at the seam — a wall of mismatched block types that breaks immersion.

### 2.2 4D Torus-Surface Noise

The solution is to evaluate the noise function on the surface of a torus embedded in 4D Euclidean space. A flat torus T² can be parameterized as:

```
For world dimensions W × H (in blocks):

    u = 2πx / W
    v = 2πz / H

    p₁ = sin(u)
    p₂ = cos(u)
    p₃ = sin(v)
    p₄ = cos(v)

Noise value at (x, z) = simplex_4d(p₁, p₂, p₃, p₄)
```

The 4D noise function is evaluated at point `(sin(2πx/W), cos(2πx/W), sin(2πz/H), cos(2πz/H))`. Because sine and cosine are periodic with period 2π, the noise value at x = 0 is identical to the noise value at x = W — both map to the same 4D coordinate. The wrap is mathematically guaranteed, not approximated.

> "Procedural noise on a torus can be achieved by evaluating higher-dimensional noise on the torus surface embedded in Euclidean space. The periodicity is exact."
> — Atomic Object. *Building an Infinite Procedurally-Generated World*. spin.atomicobject.com.

### 2.3 Torus Topology Diagram

```
                     North edge (z = 0)
                ┌──────────────────────────┐
                │                          │
   West edge    │                          │   East edge
   (x = 0)     │        World             │   (x = W)
        ←───────│                          │───────→
   wraps to     │      W × H blocks       │   wraps to
   East (x=W)   │                          │   West (x=0)
                │                          │
                │                          │
                └──────────────────────────┘
                     South edge (z = H)
                          ↕
                     wraps to North (z = 0)

   Topologically:    ┌─→─→─→─┐
                     ↑       ↓     ← X-axis wraps (cylinder)
                     └─←─←─←─┘

                     Then cylinder ends joined:

                     ╭─────────╮
                    ╱   ╭───╮   ╲
                   │   │ ● │   │    ← Torus (T²)
                    ╲   ╰───╯   ╱
                     ╰─────────╯
```

### 2.4 Noise Dimensionality Cost

Simplex noise computational cost scales linearly with dimensionality:

| Dimensions | Vertices per Cell | Cost Relative to 2D | Use Case |
|------------|------------------|---------------------|----------|
| 2D | 3 | 1.0x | Standard flat world |
| 3D | 4 | ~1.5x | Cave generation |
| 4D | 5 | ~2.0x | Torus wrap (x, z periodic) |
| 6D | 7 | ~3.0x | Torus wrap + animated time |

The 2x cost for 4D is acceptable because world generation is a write-once operation — chunks are generated when first visited and then cached. The noise function is not evaluated at render time. For a world of 1024×1024 chunks (16M blocks²), generation of the full surface takes approximately 4 seconds on modern hardware at 4D simplex. [SRC-SIMPLEX]

### 2.5 Seam Quality Metric

Success criterion SC-7 requires the visual discontinuity at the wrap boundary to be indistinguishable from any other terrain transition. The metric:

```
seam_mismatch_rate = count(block_type(x, z) ≠ block_type(x+1, z) for all z at x = W-1→0)
                     ÷ total_boundary_blocks

Target: seam_mismatch_rate ≤ interior_mismatch_rate × 1.05
```

Because the 4D noise is mathematically continuous across the seam, this metric should be exactly 1.0x (identical to interior). Any deviation indicates a bug in the coordinate mapping, not a fundamental limitation.

### 2.6 Biome Continuity

Block types are derived from biome assignment, which in Minecraft 1.18+ uses a multi-parameter climate model (temperature, humidity, continentalness, erosion, weirdness, depth). Each parameter is a separate noise function. All six must be evaluated on the torus surface for biome continuity at the seam. The 4D evaluation applies to each noise layer independently — no interaction between layers is affected.

---

## 3. Portal Gateway Design

### 3.1 Architecture

Portal gateways connect two sovereign worlds at their borders. Unlike torus wrap (which is a single-world topology), portals bridge distinct world UUIDs with potentially different seeds, biomes, and operators.

```
┌─────────────────────┐         ┌─────────────────────┐
│     World A          │         │     World B          │
│     UUID: aaa...     │         │     UUID: bbb...     │
│                      │         │                      │
│  Player at           │  Proxy  │  Player arrives at   │
│  (x=W, y, z)  ──────│────→────│──  (x=0, y, z)       │
│                      │ Velocity│                      │
│  Border region       │         │  Border region       │
│  pre-loaded ─────────│────→────│── pre-loaded         │
│                      │         │                      │
└─────────────────────┘         └─────────────────────┘
       Server A                        Server B
       (MultiPaper)                    (MultiPaper)
```

### 3.2 Coordinate Mapping

The mapping is a simple offset. For a portal between World A's east border and World B's west border:

```
World A:  player at (x_A, y, z_A)  where x_A = W_A - threshold
World B:  player placed at (x_B, y, z_B)  where x_B = threshold, z_B = z_A + z_offset
```

The `z_offset` parameter allows worlds to be aligned at any z-coordinate, not just z=0. This means a portal can connect the desert biome of World A to the ocean shore of World B — the alignment is a design choice, not an automatic mapping.

### 3.3 Velocity Proxy Integration

The Velocity proxy (Module 14, multi-server fabric) handles the teleportation:

1. Player enters portal trigger zone (configurable radius, default 16 blocks from border)
2. Velocity pre-loads the destination chunks on the target server via MultiPaper
3. Player position is transferred: Velocity sends a `ServerSwitch` packet
4. Client receives new chunk data from the destination server
5. Player entity is spawned at the mapped coordinates

Latency budget: chunk pre-load must complete within 500ms to avoid visible loading. At SSD-backed Ceph (Z0 pool, see Section 4), a 32-chunk radius pre-load transfers ~32 MB, achievable in ~200ms on a 10 Gbps cluster network.

### 3.4 Sovereignty and Consent

Portal gateways require bilateral agreement. This is not just a technical requirement — it is the sovereignty model from Module 15:

- **Portal Agreement:** A signed document (JSON, stored in `vav-meta` pool) specifying:
  - Source world UUID and border coordinates
  - Destination world UUID and border coordinates
  - Access control (who can traverse: all players, allowlist, trust-level minimum)
  - Revocation terms (either party can close the portal unilaterally)
- **Trust cost:** Portal traversal is a trust operation. The destination world's operator is granting access to their sovereign space. The Velocity plugin checks trust level before allowing the switch.
- **Asymmetric portals:** World A may allow passage to World B, but World B may not allow return passage. Each direction is independently authorized.

### 3.5 Ceph Cross-World Data Flow

When a player crosses a portal, the Ceph data path changes:

1. **Before crossing:** Player's chunks served from World A's `vav-regions` pool objects
2. **During crossing:** Velocity signals MultiPaper to load destination chunks from World B's pool
3. **After crossing:** All chunk I/O targets World B's pool; World A's chunks are eligible for eviction from the cache tier

No data is copied between pools during normal portal traversal. The player's position changes, and the data path follows. Cross-pool copying occurs only in the edge stitch topology (Section 1.1, row 4).

---

## 4. LOD Zone Specification

### 4.1 Zone Definitions

Level of Detail in a voxel world is not about polygon counts — it is about storage resolution. Distant chunks do not need full block-level fidelity because no player is observing individual blocks at that range. The LOD zone system defines four concentric rings around each active player, with storage format and Ceph allocation scaling at each boundary.

| Zone | Name | Radius (chunks) | Radius (blocks) | Storage Format | Compression | Ceph Pool Tier |
|------|------|-----------------|-----------------|----------------|-------------|----------------|
| Z0 | Active | 0–256 | 0–4,096 | Full Anvil, all 24 sections | zlib level 1 (fast) | SSD pool, 3x replication |
| Z1 | Near | 256–1,024 | 4,096–16,384 | Full Anvil, all sections | zlib level 6 (balanced) | SSD/HDD mixed pool, 3x replication |
| Z2 | Far | 1,024–4,096 | 16,384–65,536 | Sparse Anvil, 50% palette reduction | zlib level 9 (max) | HDD pool, erasure code 4+2 |
| Z3 | Archive | >4,096 | >65,536 | Seed-regenerable metadata only | N/A (no block data) | Cold HDD or S3 gateway |

### 4.2 Storage Budget Per Zone

Back-of-envelope calculations for a single player's zone footprint:

| Zone | Area (chunks²) | Avg Region Files | Raw Size | Compressed | Ceph With Redundancy |
|------|----------------|-------------------|----------|------------|---------------------|
| Z0 | π × 256² ≈ 205,887 | ~201 | 804 MB | 402 MB | 1.2 GB (3x rep) |
| Z1 | π × (1024² - 256²) ≈ 3,088,505 | ~3,016 | 6.0 GB | 1.5 GB | 4.5 GB (3x rep) |
| Z2 | π × (4096² - 1024²) ≈ 49,479,175 | ~48,320 | 24.1 GB | 2.4 GB | 3.6 GB (EC 4+2) |
| Z3 | Remainder of world | Unbounded | ~0 | ~0 | Metadata only: ~1 MB per 10,000 chunks |

**Total per player:** approximately 9.3 GB of Ceph storage for a fully explored Z0-Z2 footprint. Z3 is effectively free — only seed parameters and modification deltas are stored.

### 4.3 Zone Transition Protocol

Zone transitions are triggered by player proximity. As a player moves, the zone boundaries move with them:

```
Player moves toward Z2 region:

  Time T:     [Z0]──[Z1]──[Z2]──[Z3]
                ▲
              Player

  Time T+Δ:         [Z0]──[Z1]──[Z2]──[Z3]
                      ▲
                    Player

  Promotion:  Z2 → Z1 (chunks ahead of player)
  Demotion:   Z1 → Z2 (chunks behind player, after grace period)
```

**Promotion (lower zone → higher zone):**
1. Ceph pool migration: object moved from HDD pool to SSD pool
2. If chunk was in Z3 (metadata only): regenerate from seed, apply stored modification deltas
3. If chunk was in Z2 (sparse palette): expand palette to full resolution from stored seed + deltas
4. Decompression: re-compress at target zone's compression level

**Demotion (higher zone → lower zone):**
1. Grace period: 5 minutes after player leaves zone boundary (prevents thrashing during exploration)
2. If chunk is unmodified: delete block data, retain seed parameters only (Z3)
3. If chunk is modified: compress to target format, migrate pool, retain modification deltas
4. Ceph pool migration: object moved from SSD pool to HDD pool

### 4.4 Modification Delta Storage

The key distinction between zones: unmodified chunks can always be regenerated from the world seed. Modified chunks cannot. The modification delta captures player changes:

```
Delta format (NBT compound per chunk):
  TAG_Compound("vav:deltas") {
    TAG_Int("version"): 1
    TAG_Long("base_seed"): world seed
    TAG_Int("data_version"): 3463
    TAG_List("modifications") {
      TAG_Compound {
        TAG_Int("x"): block x
        TAG_Int("y"): block y
        TAG_Int("z"): block z
        TAG_String("from"): "minecraft:stone"
        TAG_String("to"): "minecraft:diamond_ore"
        TAG_Long("timestamp"): epoch_ms
        TAG_String("player_uuid"): "abc-123..."
      }
      ...
    }
  }
```

Delta size is proportional to player modification density, not chunk size. An unvisited chunk has zero deltas. A heavily built area might have thousands. The delta is stored as an omap entry on the chunk's RADOS object, surviving pool migration and compression changes.

---

## 5. Dynamic Ceph Pool Allocation

### 5.1 CRUSH Rules for LOD Zones

CRUSH (Controlled Replication Under Scalable Hashing) rules define how objects are placed across OSDs. LOD zones require device-class-aware rules that direct objects to the appropriate storage tier. [SRC-CRUSH]

```
# Z0: Active zone — SSD only, 3x replication for IOPS
rule z0-active-ssd {
    id 10
    type replicated
    step take default class ssd
    step chooseleaf firstn 0 type host
    step emit
}

# Z1: Near zone — 1 SSD copy (fast first read) + 2 HDD copies (capacity)
rule z1-near-mixed {
    id 11
    type replicated
    step take default class ssd
    step chooseleaf firstn 1 type host
    step emit
    step take default class hdd
    step chooseleaf firstn 2 type host
    step emit
}

# Z2: Far zone — HDD only, erasure coded for capacity efficiency
rule z2-far-ec {
    id 12
    type erasure-code
    step take default class hdd
    step chooseleaf firstn 0 type host
    step emit
}

# Z3: Archive zone — cold storage, minimal replication
rule z3-archive-cold {
    id 13
    type replicated
    min_size 1
    step take default class hdd
    step chooseleaf firstn 2 type host
    step emit
}
```

### 5.2 Pool Configuration

Each zone maps to a Ceph pool with its CRUSH rule:

```bash
# Create pools with appropriate rules
ceph osd pool create vav-z0-active 256 256 replicated z0-active-ssd
ceph osd pool create vav-z1-near   512 512 replicated z1-near-mixed
ceph osd pool create vav-z2-far    1024 1024 erasure z2-far-ec
ceph osd pool create vav-z3-archive 64 64 replicated z3-archive-cold

# Set pool parameters
ceph osd pool set vav-z0-active size 3 min_size 2
ceph osd pool set vav-z1-near   size 3 min_size 2
ceph osd pool set vav-z3-archive size 2 min_size 1

# Enable compression on Z1 and Z2
ceph osd pool set vav-z1-near compression_algorithm zlib
ceph osd pool set vav-z1-near compression_mode aggressive
ceph osd pool set vav-z2-far  compression_algorithm zlib
ceph osd pool set vav-z2-far  compression_mode force
```

### 5.3 IOPS vs Capacity Tradeoff

The zone system makes the storage tradeoff explicit:

| Zone | Priority | IOPS Requirement | Capacity Requirement | Cost Model |
|------|----------|------------------|---------------------|------------|
| Z0 | Latency | High (~10,000 random 4K reads/s per player) | Low (1.2 GB per player) | $/IOPS dominates |
| Z1 | Balanced | Medium (~1,000 reads/s) | Medium (4.5 GB) | $/IOPS ≈ $/GB |
| Z2 | Capacity | Low (~10 reads/s, mostly sequential) | High (3.6 GB EC) | $/GB dominates |
| Z3 | Archival | Near zero | Near zero | Effectively free |

For a 100-player server with non-overlapping zones: Z0 needs ~120 GB SSD, Z1 needs ~450 GB mixed, Z2 needs ~360 GB HDD. A modest 3-node cluster with 2×1TB NVMe + 4×4TB HDD per node (18 TB raw HDD, 6 TB raw SSD) handles this comfortably with room for 5x growth.

### 5.4 Dynamic OSD Weight Scaling

As the world population grows, new OSDs can be added and CRUSH rebalances automatically:

```bash
# Add a new OSD (new disk added to cluster)
ceph osd crush add osd.12 1.0 host=node-04 class=ssd

# CRUSH rebalances: existing PGs migrate to include new OSD
# Monitor rebalance progress:
ceph -w
# Watch for "active+clean" on all PGs
```

The key property: no manual data migration. CRUSH's algorithmic placement means adding capacity is a single command. Objects are redistributed across all OSDs proportional to their weight, including the new one. For LOD zones, this means Z0's SSD pool automatically expands when SSD OSDs are added, and Z2's HDD pool expands when HDD OSDs are added — each tier scales independently.

---

## 6. LOD Rendering Principles and Historical Context

### 6.1 The Invention of LOD

Level of Detail was formalized by James H. Clark in 1976, while at the University of California, Santa Cruz (later founder of Silicon Graphics, Netscape, and WebMD). Clark's paper "Hierarchical Geometric Models for Visible Surface Algorithms" introduced the concept of hierarchical object representations where distant objects use simpler geometry. The technique was developed for real-time military flight simulators where the terrain database far exceeded rendering capacity. [SRC-CLARK]

Clark's insight: the human visual system cannot resolve fine detail at distance. Therefore, spending compute on detail that cannot be perceived is pure waste. Replace distant detail with approximations. The same logic applies to storage: storing full block resolution for chunks that no player is observing is storage waste.

### 6.2 LOD Taxonomy

Three families of LOD have evolved since Clark's 1976 paper:

| Family | Technique | Switching | Artifact | Voxel Analogue |
|--------|-----------|-----------|----------|----------------|
| **Discrete (DLOD)** | Pre-compute N versions at different resolutions; switch by distance | Pop (instant model swap) | Popping at transition | Zone boundaries with instant format change |
| **Continuous (CLOD)** | Dynamic mesh simplification; edge collapse/vertex split in real time | Smooth | Geomorphing latency | Gradual palette reduction as distance increases |
| **Hierarchical (HLOD)** | Group objects into bounding volumes; replace group with single simplified object | Per-group | Batch artifacts | Region-level averaging (32×32 chunks → 1 summary) |

For the VAV system, the storage-side LOD most closely resembles DLOD: chunks exist in one of four discrete formats (Z0-Z3), and transitions are triggered by distance thresholds. The "popping" artifact in rendering becomes a "compression artifact" in storage — the moment a chunk is demoted from Z1 to Z2, its palette is reduced and some block-type precision is lost. This is acceptable because no player is close enough to observe the lost detail.

### 6.3 Geomipmapping: Terrain-Specific LOD

Willem de Boer's geomipmapping (2000) is particularly relevant to voxel terrain. The technique divides terrain into square patches and assigns each patch a mipmap level based on screen-space error. Coarser patches use fewer vertices but maintain silhouette integrity. [SRC-GEOMP]

The parallel to VAV's zone system:

```
Geomipmapping                    VAV LOD Zones
──────────────                   ─────────────
Patch = 33×33 vertices           Chunk = 16×16×384 blocks
Mipmap level 0 = full detail     Z0 = full Anvil
Mipmap level 1 = every other     Z1 = full Anvil, higher compression
Mipmap level 2 = every fourth    Z2 = sparse palette, 50% reduction
Beyond view distance = culled    Z3 = metadata only, regenerable
```

### 6.4 NVIDIA GPU Gems Terrain LOD

NVIDIA's GPU Gems 3 describes a GPU-driven terrain LOD system using close, medium, and far block groups with alpha-blend transitions between detail levels. The approach evaluates a screen-space error metric per patch and adjusts detail accordingly. [SRC-GPUGEMS]

For VAV, the "screen-space error" equivalent is **storage-space utility**: how much storage value does this chunk provide given current player positions? A chunk in Z0 has maximum utility (player is standing in it). A chunk in Z3 has near-zero utility (no player within 65,536 blocks). The LOD zone table is the storage equivalent of the GPU Gems error-driven detail selection.

---

## 7. Multi-World Edge Stitching

### 7.1 Overlap Zone Architecture

Edge stitching is the most complex topology option. Two worlds share a border strip, typically 32-64 chunks wide, where chunk data is replicated in both worlds' Ceph pools:

```
   World A pool                    World B pool
┌──────────────┬─────────┐    ┌─────────┬──────────────┐
│              │ Overlap │    │ Overlap │              │
│  A-only      │  Zone   │    │  Zone   │  B-only      │
│  chunks      │ (A+B)   │    │ (A+B)   │  chunks      │
│              │ 32-64ch │    │ 32-64ch │              │
└──────────────┴─────────┘    └─────────┴──────────────┘
                    ↕ RBD mirror ↕
              Chunks are identical
              in both pools
```

### 7.2 Conflict Resolution

When two worlds share an overlap zone, both servers may write to the same chunks. Conflict resolution uses last-writer-wins with vector clocks: each chunk carries a clock `{world_a: N, world_b: M}`, incremented on write by the originating world and replicated via RBD mirroring. On concurrent-write conflict, the higher total vector clock sum wins; losing writes are preserved as modification deltas. This is eventually consistent within the overlap zone — the one place where the system's CAP position shifts toward availability over strict consistency.

### 7.3 Storage Overhead

For a border strip 64 chunks wide on a world 60,000 chunks across: 3,840,000 overlap chunks = 3,750 region files = ~15 GB raw per world, 30 GB total (stored in both pools). As a fraction of world storage: ~5-8%. The overhead is proportional to border length, not world area — doubling world size decreases the overhead fraction.

---

## 8. Connection to Other Modules

| Module | Connection to M12 |
|--------|-------------------|
| M1 (Ceph/RADOS) | CRUSH rules and pool architecture from M1 extended with device-class awareness and LOD-specific pools |
| M4 (Anvil/NBT) | Modification delta format uses NBT compound structure; palette reduction in Z2 modifies the palette encoding from M4 §6 |
| M5 (PoC Plan) | PoC scope is hard-wall topology only; torus and portal are v2 extensions |
| M6 (Spatial Mapping) | LOD zones affect embedding precision — Z2 chunks carry coarser spatial embeddings (fewer dimensions) |
| M9 (PCG Seed) | Seed-space distance defines world adjacency in the infinite multidimensional topology; torus noise requires seed evaluated on 4D surface |
| M10 (Multi-Server) | Velocity proxy handles portal gateway teleportation; MultiPaper manages cross-server chunk ownership at overlap zones |
| M11 (Sovereignty) | Portal agreements require bilateral consent; overlap zones require shared governance of the border strip |
| M13 (Backup/DR) | LOD zones determine backup priority — Z0 snapshots hourly, Z1 daily, Z2 weekly, Z3 never (regenerable from seed) |

---

## 9. Formulas and Definitions Summary

### 9.1 Torus Parameterization

For a world of W × H blocks, the 4D noise coordinate at block position (x, z):

```
f(x, z) = simplex_4d(
    sin(2πx / W),
    cos(2πx / W),
    sin(2πz / H),
    cos(2πz / H)
)
```

**Periodicity proof:** f(x + W, z) = f(x, z) because sin(2π(x+W)/W) = sin(2πx/W + 2π) = sin(2πx/W). QED.

### 9.2 Zone Boundary

Player at position (px, pz). Chunk at position (cx, cz). Zone assignment:

```
d = max(|px/16 - cx|, |pz/16 - cz|)    # Chebyshev distance in chunks

zone(d) = { Z0  if d ≤ 256
           { Z1  if 256 < d ≤ 1024
           { Z2  if 1024 < d ≤ 4096
           { Z3  if d > 4096
```

Chebyshev distance (L∞ norm) is used instead of Euclidean because chunk loading in Minecraft is square, not circular. This matches the game's native view distance model.

### 9.3 Storage Efficiency Ratio

Without LOD, storage efficiency is η = active_chunks / total_chunks, typically ~0.001. With LOD zones, η = active_chunks / (Z0 + Z1_compressed + Z2_sparse + Z3_metadata), typically 0.15-0.30. LOD improves storage efficiency by 100-300x for worlds with sparse player distribution.

---

## 10. Sources

| ID | Reference |
|----|-----------|
| SRC-SIMPLEX | Gustavson, Stefan. "Simplex noise demystified." (2005). https://weber.itn.liu.se/~stegu/simplexnoise/simplexnoise.pdf |
| SRC-CRUSH | Weil, S. A. et al. (2006). *CRUSH: Controlled, Scalable, Decentralized Placement of Replicated Data*. SC '06. ACM. |
| SRC-CLARK | Clark, James H. (1976). "Hierarchical Geometric Models for Visible Surface Algorithms." *Communications of the ACM*, 19(10), 547-554. |
| SRC-GEOMP | de Boer, Willem H. (2000). "Fast Terrain Rendering Using Geometrical MipMapping." *flipcode.com*. https://www.flipcode.com/archives/Fast_Terrain_Rendering_Using_Geometrical_MipMapping.shtml |
| SRC-GPUGEMS | NVIDIA. "GPU Gems 3, Chapter 1: Generating Complex Procedural Terrains Using the GPU." https://developer.nvidia.com/gpugems/gpugems3/part-i-geometry/chapter-1-generating-complex-procedural-terrains-using-gpu |
| SRC-ATOMIC | Atomic Object. "Building an Infinite Procedurally-Generated World." https://spin.atomicobject.com/infinite-procedurally-generated-world/ |
| SRC-LOD | Wikipedia. "Level of detail (computer graphics)." https://en.wikipedia.org/wiki/Level_of_detail_(computer_graphics) (accessed November 2025). |
| SRC-CHIUSANO | Chiusano, Paul. "The Limits of Procedural Generation and Lazy Simulation in Games." https://pchiusano.github.io/2024-02-13/worlds.html |
| SRC-CEPH-CRUSH | Ceph Foundation. "CRUSH Maps." https://docs.ceph.com/en/latest/rados/operations/crush-map/ |
| SRC-CEPH-EC | Ceph Foundation. "Erasure Code." https://docs.ceph.com/en/latest/rados/operations/erasure-code/ |
| SRC-CEPH-POOL | Ceph Foundation. "Pools." https://docs.ceph.com/en/latest/rados/operations/pools/ |
| SRC-MULTIPAPER | PureGero. "MultiPaper." https://github.com/PureGero/MultiPaper |
| SRC-VELOCITY | PaperMC. "Velocity." https://papermc.io/software/velocity |
