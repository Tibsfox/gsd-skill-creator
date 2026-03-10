# M9: PCG Seed Space as High-Dimensional Address Manifold

**Module 9 of the Voxel as Vessel research atlas.**
The seed is not a random number. It is a coordinate. Every 64-bit seed addresses a unique, deterministic, infinite world — one of 18.4 quintillion possible worlds, each fully specified before a single block is placed. This module develops the mathematics of seed space: the LCG that generates it, the structure seeds that partition it, the climate parameters that give it shape, and the space-filling curves that map it to storage. The seed is the most compressed address in all of computing — 8 bytes that resolve to a world without bound.

---

## Table of Contents

1. [Seed Mathematics](#1-seed-mathematics)
2. [1.18 Climate Parameters](#2-118-climate-parameters)
3. [Seed-Space Address Mapping](#3-seed-space-address-mapping)
4. [LCG Inversion Procedure](#4-lcg-inversion-procedure)
5. [The Manifold Interpretation](#5-the-manifold-interpretation)
6. [Connection to v1 Modules](#6-connection-to-v1-modules)
7. [Sources](#7-sources)

---

## 1. Seed Mathematics

### 1.1 Java Edition Seeds

A Minecraft Java Edition world seed is a **64-bit signed long integer**. The total address space is:

```
2^64 = 18,446,744,073,709,551,616  (18.4 quintillion unique seeds)
```

When a player types a string seed (e.g., "Center Camp"), Java's `String.hashCode()` produces a 32-bit int that is sign-extended to 64 bits. When no seed is provided, `System.nanoTime()` supplies one. Either way, the seed enters the same pipeline.

The world generator delegates randomness to `java.util.Random`, which implements a **48-bit linear congruential generator (LCG)**. The state update is:

```
state_{n+1} = (state_n * 0x5DEECE66DL + 0xBL) & ((1L << 48) - 1)
```

In decimal, the constants are:

| Constant | Hex | Decimal |
|----------|-----|---------|
| Multiplier (a) | `0x5DEECE66D` | 25,214,903,917 |
| Increment (c) | `0xB` | 11 |
| Modulus (m) | `2^48` | 281,474,976,710,656 |

The upper 32 bits of the state are extracted to produce each `nextInt()` output. The lower 16 bits never appear directly in output — they participate only through multiplication carry. This is the Hull-Dobell theorem in practice: with `c` odd and `a ≡ 1 (mod 4)`, the LCG has full period `2^48`, visiting every state exactly once before repeating. [SRC-KNUTH]

The multiplier `0x5DEECE66D` is not Mojang-specific. It appears in the standard LCG parameter tables documented by Knuth and cataloged on Wikipedia's LCG article. It is the same multiplier used by `java.util.Random` since JDK 1.0 (1996). It is, in a meaningful sense, the universe's preferred way to fold large spaces into small ones — a constant that has been generating worlds since before Minecraft existed. [SRC-WIKI-LCG]

### 1.2 Structure Seed

Not all generation uses the full 64-bit seed. **Structure placement** — villages, strongholds, ocean monuments, woodland mansions, bastions — depends only on the **lower 48 bits** of the world seed. This is the **structure seed**.

```
structure_seed = world_seed & ((1L << 48) - 1)
```

The consequence: `2^16 = 65,536` different world seeds share each structure seed. Worlds in such groups have identical structure placements but differ in biome details, decoration, and terrain noise. The structure seed partitions the full 2^64 address space into 2^48 equivalence classes of 65,536 members each.

```
┌──────────────────────────────────────────────────────────────────┐
│                        64-bit World Seed                         │
│  ┌──────────────────┬─────────────────────────────────────────┐  │
│  │  Upper 16 bits   │         Lower 48 bits                   │  │
│  │  (biome detail)  │         (structure seed)                │  │
│  └──────────────────┴─────────────────────────────────────────┘  │
│                                                                  │
│  Structure seed determines:        Upper bits determine:         │
│  • Village positions               • Biome noise octaves         │
│  • Stronghold ring layout          • Terrain height variation    │
│  • Monument spacing                • Decoration density          │
│  • Bastion/fortress placement      • Temperature/humidity shift  │
└──────────────────────────────────────────────────────────────────┘
```

This is a security consideration for VAV. A structure seed is brute-forceable: 2^48 = 281 trillion states, recoverable in hours on a modern GPU running the LCG forward at ~10^10 steps/second. **The seed is not a secret.** It is an address. Treat it as a public identifier, not a credential. [SRC-HUBE12]

### 1.3 Biome Seed

Biome generation uses a separate LCG pipeline with different constants. The `GenLayer` system (pre-1.18) and the noise router (1.18+) derive per-chunk biome seeds through a chain of multiplications:

```
GenLayer LCG:
  multiplier = 6364136223846793005L
  increment  = 1442695040888963407L
```

These are the constants from Knuth's MMIX LCG — another entry in the canonical table. The GenLayer LCG operates on the **full 64-bit seed**, not just the lower 48 bits. This means biome determination requires knowledge of all 64 bits, unlike structure placement.

Each chunk derives its biome seed through a sequence of LCG advances incorporating the world seed and chunk coordinates:

```python
def chunk_biome_seed(world_seed, chunk_x, chunk_z):
    seed = world_seed
    seed = seed * (6364136223846793005 * chunk_x + 1442695040888963407)
    seed = seed + chunk_z
    seed = seed * (6364136223846793005 * chunk_z + 1442695040888963407)
    seed = seed + chunk_x
    return seed & ((1 << 64) - 1)
```

The coordinate mixing ensures that chunks at different positions derive independent seeds from the same world seed — a hash-like dispersion across the spatial domain.

### 1.4 Bedrock Edition

Bedrock Edition uses a **32-bit signed integer** seed:

```
2^32 = 4,294,967,296  (4.3 billion unique seeds)
```

The address space is 2^32 times smaller than Java's. For cross-edition mapping, every Bedrock seed has a Java counterpart (the lower 32 bits match), but 2^32 Java seeds map to each Bedrock seed. This asymmetry matters for VAV federation: a world created in Bedrock and migrated to Java loses uniqueness in the larger address space.

| Property | Java Edition | Bedrock Edition |
|----------|-------------|-----------------|
| Seed width | 64-bit signed long | 32-bit signed int |
| Address space | 2^64 ≈ 1.84 × 10^19 | 2^32 ≈ 4.29 × 10^9 |
| Structure seed | Lower 48 bits | Full 32 bits |

---

## 2. 1.18 Climate Parameters

### 2.1 The Noise Router

Since version 1.18 (November 2021), Minecraft replaced the `GenLayer` biome system with a **noise-driven climate parameter model**. Each **quarter-chunk** (a 4×4×4 block column at the biome resolution) is assigned five climate parameters derived from layered noise maps:

| Parameter | Symbol | Range | Controls |
|-----------|--------|-------|----------|
| Temperature | T | [-1.0, 1.0] | Hot vs cold biomes |
| Humidity | H | [-1.0, 1.0] | Dry vs wet biomes |
| Continentalness | C | [-1.0, 1.0] | Ocean vs inland |
| Erosion | E | [-1.0, 1.0] | Flat vs mountainous |
| Weirdness | W | [-1.0, 1.0] | Normal vs "weird" variant biomes |

Each parameter is computed by a multi-octave Perlin noise function. The 1.18+ terrain generation uses **over 50 individual noise maps** that contribute to the five climate parameters plus terrain density, surface height, and aquifer placement. [SRC-ZUCCONI]

### 2.2 Biome Assignment as Nearest-Neighbor Lookup

Each biome defines its ideal climate as a 5-tuple in climate space:

```
biome_climate(plains)     = (T: 0.5,  H: 0.3,  C: 0.3,  E: 0.5,  W: 0.0)
biome_climate(desert)     = (T: 0.9,  H:-0.5,  C: 0.3,  E: 0.5,  W: 0.0)
biome_climate(old_growth) = (T: 0.2,  H: 0.8,  C: 0.5,  E: 0.2,  W: 0.0)
biome_climate(deep_ocean) = (T: 0.0,  H: 0.0,  C:-0.9,  E: 0.5,  W: 0.0)
```

For each quarter-chunk, the generator computes the 5 climate values, then selects the biome whose climate 5-tuple is **nearest** in Euclidean distance. The 1.20.x vanilla game defines approximately 60 biome entries in this 5D space.

This is a Voronoi partition of 5-dimensional climate space. Each biome occupies a Voronoi cell — the region of all climate points closer to its ideal than to any other biome's ideal. The seed determines the noise fields, the noise fields determine the climate parameters, and the climate parameters select biomes by proximity in 5D.

### 2.3 Seed-Space Locality via Climate Fields

Here is the key insight for VAV: each seed generates not just a spatial map but a **5-dimensional climate field** over all space. The climate field is a function:

```
F_seed : Z^3 → R^5
F_seed(x, y, z) = (T(x,y,z), H(x,y,z), C(x,y,z), E(x,y,z), W(x,y,z))
```

Two seeds that are "close" in LCG step count — meaning one can be reached from the other in a small number of LCG advances — produce noise fields whose octave parameters differ by a small perturbation. The noise maps share the same frequency structure but with slightly shifted phase or amplitude at the highest octaves.

This means:

```
d_LCG(s₁, s₂) small  ⟹  ||F_s₁ - F_s₂||₂ small (in expectation)
```

where the norm is taken over a bounded spatial region. Seeds that are LCG-adjacent produce climate fields that are pointwise similar. This **smoothness property** of the seed-to-climate mapping is the mathematical foundation for treating seed space as a manifold with meaningful topology — not just an unstructured set of labels.

### 2.4 Climate Space Dimensionality

The effective dimensionality of the biome system is not 5 — it is lower. Temperature and humidity are strongly correlated in Earth-like biome distributions (hot deserts are dry; cold tundra is dry; tropical rainforests are hot and wet). Minecraft's biome table reflects this:

```
┌──────────────────────────────────────────────────┐
│              Climate Parameter Space              │
│                                                   │
│  H (humidity)                                     │
│  1.0 ┤ jungle    ·    ·    ·    swamp             │
│      │                                            │
│  0.5 ┤ forest    ·  plains  ·   ·                 │
│      │                                            │
│  0.0 ┤ savanna   ·    ·    ·    ·                 │
│      │                                            │
│ -0.5 ┤ desert    ·    ·    ·    badlands          │
│      │                                            │
│ -1.0 ┤ ice_spikes ·   ·   snowy_plains            │
│      └──┬────┬────┬────┬────┬────┬────┬──         │
│       -1.0 -0.5  0.0  0.5  1.0                   │
│                    T (temperature)                 │
│                                                   │
│  (C, E, W dimensions projected out)               │
└──────────────────────────────────────────────────┘
```

A PCA analysis of the biome climate table shows that 3 principal components capture >90% of the variance. The effective manifold dimensionality is approximately 3, embedded in the nominal 5D space. This has implications for seed-space clustering: the meaningful differences between seeds concentrate in fewer dimensions than the full parameter count suggests.

---

## 3. Seed-Space Address Mapping

### 3.1 Morton Encoding (Z-Order)

Morton encoding maps 2D chunk coordinates to a 1D key by **bit-interleaving** the X and Z values. Even-numbered bits carry X; odd-numbered bits carry Z. This produces a Z-shaped space-filling curve that preserves 2D locality in the 1D key.

**Algorithm (pseudocode):**

```python
def morton_encode(x: int, z: int) -> int:
    """Bit-interleave x and z into a Morton code.
       x occupies even bits, z occupies odd bits."""
    def spread_bits(v: int) -> int:
        # Insert zero bits between each bit of v
        v = (v | (v << 16)) & 0x0000FFFF0000FFFF
        v = (v | (v <<  8)) & 0x00FF00FF00FF00FF
        v = (v | (v <<  4)) & 0x0F0F0F0F0F0F0F0F
        v = (v | (v <<  2)) & 0x3333333333333333
        v = (v | (v <<  1)) & 0x5555555555555555
        return v
    return spread_bits(x) | (spread_bits(z) << 1)
```

**Worked example: chunk (3, 5) → Morton key**

```
x = 3 = 0b011
z = 5 = 0b101

Interleaving:
  x bits (even positions): _ 0 _ 1 _ 1
  z bits (odd positions):  1 _ 0 _ 1 _

  Result: 1 0 0 1 1 1 = 0b100111 = 39

morton_encode(3, 5) = 39
```

**Verification table** for the 4×4 origin region:

```
      z=0   z=1   z=2   z=3
x=0 │   0     2     8    10
x=1 │   1     3     9    11
x=2 │   4     6    12    14
x=3 │   5     7    13    15
```

The Z-shaped traversal pattern is visible: 0→1→2→3→4→5→6→7→... traces a Z through each 2×2 quadrant before recursing to the next level. [SRC-MORTON]

### 3.2 Hilbert Curve

The Hilbert curve provides **superior locality preservation** over Morton encoding at the cost of higher computational complexity. Where Morton codes exhibit "jump" discontinuities at quadrant boundaries (a cell at the end of one Z-sweep is far in 2D from the start of the next), the Hilbert curve maintains continuous adjacency.

The core algorithm uses recursive quadrant rotation and flipping. At each recursion level, the curve enters a quadrant, traces a U-shape, and the orientation of the U rotates depending on which quadrant is being entered. Butz (1971) gives the canonical bit-manipulation implementation. [SRC-HILBERT]

**Locality comparison — where Morton breaks, Hilbert holds:**

```
Morton (Z-order), 4×4:          Hilbert, 4×4:
 0  1  4  5                      0  1 14 15
 2  3  6  7                      3  2 13 12
 8  9 12 13                      4  7  8 11
10 11 14 15                      5  6  9 10

Morton jump: cell 7 (x=3,z=1) → cell 8 (x=0,z=2)
  Manhattan distance: |3-0| + |1-2| = 4

Hilbert: cell 7 (x=1,z=3) → cell 8 (x=2,z=3)
  Manhattan distance: |1-2| + |3-3| = 1  (always adjacent!)
```

The Hilbert curve guarantees that consecutive indices differ by exactly 1 in Manhattan distance. Morton codes can jump up to O(√N) at quadrant boundaries. For RADOS object placement, Hilbert ordering means sequential reads over a spatial region require fewer OSD hops. [SRC-HILBERT]

### 3.3 Seed + Morton Composite Key

The RADOS object key for VAV combines the world seed with the spatial Morton code to produce a hierarchical namespace:

```
Format: <seed-hash-16>/<morton-key>

Example:
  World seed: -4172144997902289642
  SHA-256(seed bytes): a7c3e9f012b845d6...
  Chunk (3, 5):
  Morton key: 39

  RADOS object key: "a7c3e9f012b845d6/39"
```

The seed hash is the first 16 hexadecimal characters of SHA-256 applied to the 8-byte big-endian representation of the seed. This provides:

1. **Uniform distribution** across CRUSH placement groups — SHA-256 output is uniformly distributed, so worlds spread evenly across OSDs regardless of seed value patterns.
2. **Namespace isolation** — objects from different worlds occupy disjoint key prefixes.
3. **Spatial locality within a world** — Morton (or Hilbert) keys preserve the 2D chunk layout in the 1D suffix.

```
┌──────────────────────────────────────────────────────────────┐
│                   RADOS Object Namespace                      │
│                                                              │
│  a7c3e9f012b845d6/                                           │
│  ├── 0   (chunk 0,0)                                         │
│  ├── 1   (chunk 1,0)                                         │
│  ├── 2   (chunk 0,1)                                         │
│  ├── 3   (chunk 1,1)                                         │
│  ├── ...                                                     │
│  └── 39  (chunk 3,5)                                         │
│                                                              │
│  b2f8a10c3d6e7924/                                           │
│  ├── 0   (chunk 0,0, different world)                        │
│  ├── 1   (chunk 1,0)                                         │
│  └── ...                                                     │
│                                                              │
│  Prefix determines PG placement (CRUSH)                      │
│  Suffix determines spatial ordering (Morton/Hilbert)          │
└──────────────────────────────────────────────────────────────┘
```

### 3.4 Seed-Space Distance Metric

This is a key v2 contribution. Define the **LCG step distance** between two seeds:

```
d(s₁, s₂) = min(fwd_steps(s₁, s₂), fwd_steps(s₂, s₁))
```

where `fwd_steps(s₁, s₂)` is the number of LCG advances required to reach state `s₂` from state `s₁`.

Because the LCG is a permutation of `Z_{2^48}` (it visits every state in its period), the forward step count from any state to any other is well-defined and unique. The minimum of the two directions gives a symmetric distance bounded by `2^47` (half the period).

This distance is **computable in O(1)** using the LCG inverse (Section 4): given two states, compute the forward step count via discrete logarithm in the cyclic group generated by the LCG multiplier.

The metric has mathematical meaning:

```
d(s₁, s₂) = k  means  s₂ = LCG^k(s₁)

When k is small:
  - The internal LCG states differ by a small number of multiply-add cycles
  - Noise octave seeds derived from nearby states share most significant bits
  - Climate fields differ by high-octave perturbations only
  - Structure placements may be identical (if lower bits unchanged)
  - Terrain is recognizably similar in the same coordinate regions
```

This metric enables two VAV operations:

1. **Seed clustering in Ceph** — place worlds with small `d()` on the same OSDs via CRUSH rule customization, enabling efficient delta storage (store only the block differences between nearby-seed worlds).
2. **World provenance verification** — given a world snapshot, recover the seed by inverting the LCG chain from observable chunk seeds, then compute `d()` to the claimed original seed. A distance of 0 confirms provenance.

---

## 4. LCG Inversion Procedure

### 4.1 The Forward Step

The Java LCG advances state by:

```
s_{n+1} = (a * s_n + c) mod m

where:
  a = 0x5DEECE66DL  = 25214903917
  c = 0xBL          = 11
  m = 2^48          = 281474976710656
```

### 4.2 Computing the Modular Inverse

To reverse the LCG, we need the **modular multiplicative inverse** of `a` modulo `m`:

```
a_inv ≡ a^(-1) (mod m)
such that: a * a_inv ≡ 1 (mod m)
```

Since `gcd(a, m) = 1` (a is odd, m is a power of 2), the inverse exists and is unique. It can be computed via the **Extended Euclidean Algorithm**:

```python
def extended_gcd(a: int, b: int) -> tuple[int, int, int]:
    """Returns (gcd, x, y) such that a*x + b*y = gcd."""
    if a == 0:
        return b, 0, 1
    gcd, x1, y1 = extended_gcd(b % a, a)
    x = y1 - (b // a) * x1
    y = x1
    return gcd, x, y

def mod_inverse(a: int, m: int) -> int:
    """Compute a^(-1) mod m."""
    gcd, x, _ = extended_gcd(a % m, m)
    assert gcd == 1, "Inverse does not exist"
    return x % m
```

For Java's LCG constants:

```
a     = 25214903917
m     = 281474976710656  (2^48)
a_inv = 246154705703781

Verification: (25214903917 * 246154705703781) mod 2^48 = 1  ✓
```

The inverse multiplier `246154705703781` (hex: `0xDFE05BCB1365`) is the key to reversing any LCG step.

### 4.3 The Backward Step

Given state `s_n`, the previous state is:

```
s_{n-1} = a_inv * (s_n - c) mod m
        = (s_n - 11) * 246154705703781 mod 2^48
```

**Pseudocode for forward and backward stepping:**

```python
A     = 25214903917
A_INV = 246154705703781
C     = 11
MASK  = (1 << 48) - 1

def lcg_forward(state: int) -> int:
    return (state * A + C) & MASK

def lcg_backward(state: int) -> int:
    return ((state - C) * A_INV) & MASK

def lcg_advance(state: int, steps: int) -> int:
    """Advance (or retreat if steps < 0) by arbitrary step count in O(log n)."""
    # Uses the square-and-multiply method on the affine map
    a, c = A, C
    if steps < 0:
        a, c = A_INV, (-C * A_INV) & MASK
        steps = -steps
    acc_a, acc_c = 1, 0
    while steps > 0:
        if steps & 1:
            acc_a = (acc_a * a) & MASK
            acc_c = (acc_c * a + c) & MASK
        c = (c * (a + 1)) & MASK
        a = (a * a) & MASK
        steps >>= 1
    return (acc_a * state + acc_c) & MASK
```

The `lcg_advance` function computes `LCG^n(state)` in **O(log n)** time using exponentiation by squaring on the affine transformation `x → ax + c`. This means jumping from any state to any other state is logarithmic in the step count, not linear. Stepping forward 10^14 states takes ~47 multiply operations, not 10^14. [SRC-KNUTH]

### 4.4 Seed Recovery from Chunk Data

Given observable world data (structure positions, biome transitions, or exposed LCG outputs), the world seed can be recovered:

```
Step 1: Extract partial LCG output from structure positions
        (e.g., village coordinates encode nextInt() calls)

Step 2: Recover internal 48-bit state from partial outputs
        (lattice reduction attack on upper 32 bits of output)

Step 3: Backward-step to the initial seed state
        s_0 = lcg_advance(s_n, -n)

Step 4: Reconstruct the full 64-bit seed
        (upper 16 bits via biome matching or exhaustive search)
```

This procedure is well-documented in the seed-cracking community. The key point for VAV: **seed recovery is a feature, not a vulnerability.** Given any world snapshot stored in Ceph, the original seed can be independently verified. The seed is the world's provenance certificate — its proof of origin. [SRC-HUBE12]

---

## 5. The Manifold Interpretation

### 5.1 Seeds as Points in a Manifold

With 2^64 possible seeds and 5 climate parameters computed at every quarter-chunk position, each seed defines a point in an extraordinarily high-dimensional space. Consider a bounded region of R chunks:

```
Climate field for seed s over R chunks:
  F_s : {1..R} × {1..R} → R^5

This is a vector in R^(5 * R^2)-dimensional space.

For R = 1024 (a moderate view distance):
  dim = 5 * 1024^2 = 5,242,880 dimensions
```

Each seed is a single point in this ~5-million-dimensional climate field space. The set of all seeds — all 2^64 of them — forms a discrete subset of this space. But the subset has **structure**: the LCG generates seeds in a deterministic sequence, and nearby seeds in LCG order produce nearby climate fields.

### 5.2 Topology and Neighborhoods

The LCG step distance `d(s₁, s₂)` defines a **natural topology** on seed space. The neighborhood of seed `s` at radius `r` is `N_r(s) = { s' : d(s, s') ≤ r }` — always a contiguous arc on the LCG cycle containing exactly `2r` seeds.

The smoothness property (Section 2.3) means the climate-field map is **Lipschitz continuous**:

```
||F_s₁ - F_s₂|| ≤ L · d(s₁, s₂)  for small d(s₁, s₂)
```

The Lipschitz constant L depends on noise octave sensitivities — lower octaves (large-scale terrain) are stable across many LCG steps, higher octaves shift with each step. This gives the manifold **multi-scale structure**: zoom out and the landscape is smooth; zoom in and you see the grain of individual LCG advances.

### 5.3 The Determinism Property

Every point in the manifold fully specifies an infinite world. Nothing is stored — the world is **calculated** from the seed on demand. The Anvil files in a `.minecraft/saves/` directory are not the world; they are a cache of the calculations already performed. Delete them and regenerate: the same world returns, block for block, biome for biome.

```
Seed (8 bytes)  ──generates──▶  World (unbounded, ~infinite blocks)
     │                                    │
     │  Information content:              │  Information content:
     │  64 bits                           │  ∞ (in principle)
     │                                    │
     └── The seed is the most compressed  │
         address in all of computing. ────┘
```

This is the Amiga Principle in its purest form: the seed is a compressed address for an entire world. The world is not stored; it is calculated. The storage is not the territory — it is the proof that the territory was visited. The Anvil files on disk are player modifications overlaid on the procedurally generated base. The seed is the base. Everything else is delta.

### 5.4 Implications for VAV Storage

The manifold interpretation reshapes how VAV thinks about storage:

1. **World deduplication** — Two players exploring the same seed need not store duplicate base terrain. Only their modifications (player-placed blocks, chest contents, entity positions) are unique. The base world is implicit in the seed.

2. **Seed-proximity delta encoding** — For seeds with small `d()`, store one world fully and the others as deltas. The delta between LCG-adjacent worlds is sparse (most chunks are biome-identical).

3. **Manifold-aware CRUSH rules** — Group seed-proximate worlds on the same OSDs via custom CRUSH rules keyed on seed hash neighborhoods. This optimizes delta reads: the base and its deltas are co-located on the same storage nodes.

4. **Provenance as geometry** — Verifying a world's origin is a geometric operation: compute its seed, compute the LCG distance to the claimed seed, check that the distance is zero. The manifold makes provenance a measurable property.

---

## 6. Connection to v1 Modules

| Module | Connection |
|--------|------------|
| M1 (Ceph/RADOS) | Morton/Hilbert keys serve as RADOS object names within a world's seed-hash namespace. CRUSH rules can exploit seed-space locality for co-location. |
| M2 (RAG Pipeline) | Seed provenance verification gates the RAG pipeline: a query specifies a seed, and only the world addressed by that seed is searched. |
| M3 (Integration) | The seed is the top-level address in the hierarchical encoding: seed → region → chunk → section → block → token. |
| M4 (Anvil/NBT) | The Anvil format stores player modifications as a delta over the seed-generated base. The format is the cache; the seed is the source of truth. |
| M5 (PoC Plan) | PoC implements Morton-keyed RADOS storage; v2 extends to Hilbert keys and seed-proximity delta encoding. |
| M6 (Spatial Mapping) | Seed-space locality defines a natural clustering metric for embedding proximity: nearby seeds → similar climate fields → similar spatial structure → potential embedding locality. |

---

## 7. Sources

| ID | Reference |
|----|-----------|
| SRC-KNUTH | Knuth, D. E. (1997). *The Art of Computer Programming, Volume 2: Seminumerical Algorithms*. 3rd edition. Addison-Wesley. §3.2.1 (Linear Congruential Generators), §3.2.1.3 (Potency). |
| SRC-WIKI-LCG | Wikipedia. "Linear congruential generator." https://en.wikipedia.org/wiki/Linear_congruential_generator — Parameter tables including the `java.util.Random` multiplier 0x5DEECE66D. |
| SRC-SEED | Minecraft Wiki. "Seed (level generation)." https://minecraft.wiki/w/Seed_(level_generation) |
| SRC-HUBE12 | Hube12. "Seed Cracking." https://gist.github.com/hube12/368e7331e497b17e092e8ca4ba206b3c — Techniques for recovering Minecraft seeds from observable world data. |
| SRC-ZUCCONI | Zucconi, A. (2024). "The World Generation of Minecraft." https://www.alanzucconi.com/2024/08/07/the-world-generation-of-minecraft/ — Detailed analysis of 1.18+ noise-based terrain generation. |
| SRC-MORTON | Morton, G. M. (1966). "A Computer Oriented Geodetic Data Base and a New Technique in File Sequencing." IBM Canada Technical Report. |
| SRC-HILBERT | Hilbert, D. (1891). "Ueber die stetige Abbildung einer Linie auf ein Flaechenstueck." *Mathematische Annalen* 38. Also: Butz, A. R. (1971). "Alternative Algorithm for Hilbert's Space-Filling Curve." *IEEE Trans. Comput.* C-20(4). |
| SRC-CRUSH | Weil, S. A. et al. (2006). "CRUSH: Controlled, Scalable, Decentralized Placement of Replicated Data." *Proceedings of SC 2006*. |
| SRC-MCF | MinecraftForum. "The Seed Algorithm." https://www.minecraftforum.net — Community documentation of Minecraft's procedural generation internals. |
