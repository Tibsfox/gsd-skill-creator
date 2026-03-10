# Spatial Embedding Mapping Research

> **Module ID:** VAV-SPATIAL
> **Domain:** Dimensionality Reduction & Locality-Preserving Projection
> **Through-line:** *The map must honor the territory.* A 1536-dimensional embedding encodes meaning. A voxel coordinate encodes position. The mapping between them must preserve the essential property: documents that are semantically close must land in voxel positions that are spatially close. If the map distorts this, retrieval breaks — you walk to the right place in the world and find the wrong knowledge. The math must serve the metaphor, not the other way around.

---

## Table of Contents

1. [The Mapping Problem](#1-the-mapping-problem)
2. [Dimensionality Reduction Approaches](#2-dimensionality-reduction-approaches)
3. [UMAP Projection](#3-umap-projection)
4. [PCA Projection](#4-pca-projection)
5. [Space-Filling Curves](#5-space-filling-curves)
6. [Hilbert Curves](#6-hilbert-curves)
7. [Morton Codes (Z-Order)](#7-morton-codes-z-order)
8. [Evaluation Framework](#8-evaluation-framework)
9. [Dynamic Corpus Growth](#9-dynamic-corpus-growth)
10. [Address Space Capacity](#10-address-space-capacity)
11. [Hybrid Strategies](#11-hybrid-strategies)
12. [Connection to v2 and v3](#12-connection-to-v2-and-v3)
13. [Cross-Reference](#13-cross-reference)
14. [Sources](#14-sources)

---

## 1. The Mapping Problem

### 1.1 Statement

Given a corpus of N document chunks, each represented as a d-dimensional embedding vector (d = 1024 or 1536), assign each chunk a 3D integer coordinate (x, section_y, z) in Minecraft's voxel coordinate system such that:

- **Locality preservation:** If cos_sim(e_i, e_j) is high, then Manhattan_distance(coord_i, coord_j) is low
- **Injectivity:** No two chunks share the same coordinate (each voxel holds at most one chunk)
- **Stability:** Adding new chunks does not require remapping existing chunks (or remapping is bounded)
- **Efficiency:** The mapping is computable in O(N log N) or better

This is a variant of the **dimensionality reduction problem** with the additional constraint that the output space is discrete (integer coordinates) and the mapping must be incrementally updatable.

### 1.2 Why 3D?

Minecraft provides three usable coordinate axes:
- **X axis:** signed 32-bit integer, horizontal
- **Z axis:** signed 32-bit integer, horizontal
- **Y axis:** limited to [-64, 319] (384 values) in vanilla, but the Anvil format supports arbitrary section Y indices

For the PoC, the practical address space is X x Z with Y as a third dimension for vertical stacking within a chunk. The primary mapping is 2D (X, Z) because region files are indexed by these coordinates and spatial queries naturally tile the horizontal plane. Y provides depth within a position — multiple document chunks stacked vertically at the same (X, Z) address, like pages in a book at a shelf position.

### 1.3 The Johnson-Lindenstrauss Bound

The Johnson-Lindenstrauss lemma provides a theoretical floor: any set of N points in high-dimensional space can be projected into O(log N / epsilon^2) dimensions while preserving pairwise distances within (1 +/- epsilon). For N = 1,000,000 and epsilon = 0.1, this gives ~200 dimensions. Projecting to 2D or 3D is far below this bound, meaning **some distortion is inevitable**. The question is how much, and whether the distortion is tolerable for retrieval. [SRC-JL]

---

## 2. Dimensionality Reduction Approaches

### 2.1 Three Candidates

The PoC evaluates three families of dimensionality reduction for the embedding-to-coordinate mapping:

| Approach | Type | Preserves | Speed | Incremental? |
|----------|------|-----------|-------|--------------|
| UMAP | Nonlinear manifold | Local neighborhood structure | Slow (minutes for 100K points) | Partial (transform new points) |
| PCA | Linear projection | Global variance directions | Fast (seconds) | Yes (projection matrix is fixed) |
| Space-Filling Curves | Discrete tiling | 1D ordering locality | Very fast (bitwise) | Yes (mapping is deterministic) |

None is universally best. Each trades off different properties. The evaluation framework (Section 8) measures which trade-offs matter for RAG retrieval in voxel coordinates.

### 2.2 Two-Stage Pipeline

The most promising approach combines stages:

1. **Stage 1:** Reduce d-dimensional embeddings to a manageable intermediate dimension (e.g., PCA to 8D or 16D)
2. **Stage 2:** Map the intermediate representation to 2D/3D voxel coordinates via a space-filling curve

This avoids asking any single technique to do the full d -> 2D reduction, which is where distortion concentrates.

---

## 3. UMAP Projection

### 3.1 How UMAP Works

UMAP (Uniform Manifold Approximation and Projection) constructs a weighted k-nearest-neighbor graph in high-dimensional space, then optimizes a low-dimensional layout that preserves the graph's topology. It approximates the high-dimensional data as lying on a Riemannian manifold and finds a low-dimensional manifold with the closest possible fuzzy topological structure. [SRC-UMAP]

Key parameters:
- **n_neighbors:** Controls local vs. global structure preservation (default 15)
- **min_dist:** Minimum distance between points in the embedding (default 0.1)
- **n_components:** Output dimensions (2 or 3 for our purposes)
- **metric:** Distance metric in input space (cosine for text embeddings)

### 3.2 Strengths for VAV

- Excellent local neighborhood preservation — semantically similar documents cluster tightly
- Produces visually interpretable 2D layouts that reveal corpus structure
- Handles the nonlinear manifold structure of embedding spaces well
- Can use cosine distance directly as the input metric

### 3.3 Weaknesses for VAV

- **Non-incremental by nature.** Adding new documents changes the graph, which can shift existing point positions. The `umap.transform()` method projects new points into an existing layout but does not guarantee the same quality as a full refit.
- **Slow for large corpora.** Fitting 100K+ points takes minutes. Not suitable for real-time ingest.
- **Stochastic.** Different random seeds produce different layouts. Reproducibility requires seed pinning.
- **Continuous output.** UMAP produces float coordinates that must be discretized to integer voxel positions. The discretization step can collide nearby points.

### 3.4 Discretization Strategy

To convert UMAP's continuous output to integer voxel coordinates:

1. Scale the UMAP output to fill the desired coordinate range (e.g., [0, 10000])
2. Round to nearest integer
3. Resolve collisions: if two chunks map to the same (x, z), offset one to an adjacent position
4. Use Y axis for vertical stacking at collision points

The collision rate depends on the coordinate range. For 100K chunks mapped to a 10000x10000 grid (100M positions), collisions are rare. For 1M chunks in the same grid, expect ~1% collisions requiring resolution.

---

## 4. PCA Projection

### 4.1 How PCA Works

Principal Component Analysis finds the orthogonal directions of maximum variance in the data and projects onto them. The first principal component captures the most variance, the second captures the most remaining variance orthogonal to the first, and so on. For embedding-to-coordinate mapping, we take the first 2 or 3 components. [SRC-PCA]

### 4.2 Strengths for VAV

- **Fast.** SVD of the embedding matrix is O(N * d * k) where k is the output dimension. For N=100K, d=1536, k=3: sub-second.
- **Deterministic.** Same data always produces the same projection. No random seeds.
- **Fully incremental.** Once the projection matrix is computed (from a training corpus), new embeddings are projected by a single matrix multiply. Existing coordinates never change.
- **Interpretable.** The principal components can be examined to understand what semantic axes they capture.

### 4.3 Weaknesses for VAV

- **Linear.** PCA captures only linear relationships. Embedding spaces have complex nonlinear manifold structure that PCA flattens, losing neighborhood information.
- **Global bias.** The projection optimizes global variance, not local neighborhoods. Two semantically similar documents may be separated if they lie along a direction orthogonal to the top principal components.
- **Variance concentration.** For high-dimensional embeddings, the first 2-3 components typically capture only 10-30% of total variance. Most of the structure is lost.

### 4.4 PCA as Stage 1

PCA's strength is as a **dimensionality reduction preprocessor**, not as the final mapping. Reducing 1536D to 16D or 32D via PCA is fast, preserves most variance (typically 60-80% in 16 components for text embeddings), and produces a manageable intermediate representation for a space-filling curve to consume.

---

## 5. Space-Filling Curves

### 5.1 What They Are

A space-filling curve is a continuous function from a 1D interval to a 2D or higher-dimensional space that passes through every point in the target region. Discrete versions map integer sequences to grid coordinates, providing a **bijective mapping between 1D keys and 2D/3D positions** that preserves spatial locality — nearby keys map to nearby grid positions. [SRC-SFC]

For VAV, space-filling curves solve a specific problem: given a 1D ordering of document chunks (e.g., by some projection of their embeddings), assign each chunk a 2D grid position such that chunks adjacent in the 1D ordering are spatially close in the grid.

### 5.2 Two Candidates

The two most practical space-filling curves for grid indexing are:

| Curve | Locality | Complexity | Computation |
|-------|----------|------------|-------------|
| **Hilbert** | Superior | Higher | Recursive quadrant rotation |
| **Morton (Z-order)** | Good | Lower | Bit interleaving |

Both tile naturally into powers-of-two grids. Both have well-understood locality properties. The choice between them is an engineering trade-off.

---

## 6. Hilbert Curves

### 6.1 Construction

The Hilbert curve is defined recursively. At order 1, it traces a U-shape through a 2x2 grid. At order 2, each cell of the 2x2 grid is subdivided into a 2x2 sub-grid, and the U-shape is replicated with appropriate rotations and reflections to maintain continuity. At order n, the curve visits all 4^n cells of a 2^n x 2^n grid. [SRC-HILBERT]

The key property: the curve **never jumps** — each step moves to an adjacent cell. This means the maximum spatial distance between consecutively-numbered cells is 1 (Manhattan distance). No other space-filling curve achieves this so consistently.

### 6.2 Locality Properties

The Hilbert curve's locality can be quantified: for two points with 1D indices i and j, their 2D distance is bounded by O(|i - j|^(1/2)) for a 2D curve, and O(|i - j|^(1/3)) for a 3D curve. In practice, the Hilbert curve achieves about **1.5x better locality than the Morton curve** on average, measured by the mean squared distance between consecutively-numbered points. [SRC-HILBERT]

The advantage is most visible at quadrant boundaries. The Morton curve's Z-pattern creates "jumps" when transitioning between quadrants (the curve snaps from one side of the grid to the other). The Hilbert curve's rotations eliminate these jumps entirely.

### 6.3 Implementation

The Hilbert curve mapping between 1D index and 2D coordinates can be computed in O(log N) time using the algorithm by Butz (1971), refined by Skilling (2004). The core operation is a sequence of bit rotations and reflections applied to the binary representation of the index. [SRC-HILBERT]

```python
def hilbert_d2xy(n: int, d: int) -> tuple[int, int]:
    """Convert Hilbert curve index d to (x, y) in an n x n grid.
    n must be a power of 2."""
    x = y = 0
    s = 1
    while s < n:
        rx = 1 if (d & 2) else 0
        ry = 1 if ((d & 1) ^ rx) else 0  # Note: XOR with rx
        # Rotate quadrant
        if ry == 0:
            if rx == 1:
                x = s - 1 - x
                y = s - 1 - y
            x, y = y, x
        x += s * rx
        y += s * ry
        d >>= 2
        s <<= 1
    return x, y
```

Libraries: `hilbertcurve` (Python, pip-installable), or hand-rolled for performance-critical paths.

### 6.4 Application to VAV

The pipeline:
1. Project each embedding to 1D (e.g., first principal component, or a learned projection)
2. Sort documents by their 1D value
3. Assign each document the next Hilbert curve index
4. Convert Hilbert index to (x, z) voxel coordinates

Documents with similar embeddings receive similar 1D projections, thus nearby Hilbert indices, thus nearby voxel coordinates. The Hilbert curve's locality guarantee ensures the spatial clustering reflects semantic clustering.

---

## 7. Morton Codes (Z-Order)

### 7.1 Bit Interleaving

The Morton code (Z-order curve) maps 2D coordinates to a 1D key by **interleaving the bits** of the X and Z coordinates. For X = 5 (binary 101) and Z = 3 (binary 011): [SRC-MORTON]

```
X bits: 1  0  1
Z bits:  0  1  1
Morton: 10 01 11 = 100111 (binary) = 39 (decimal)
```

The interleaving formula for 2D:
```
morton = 0
for i in range(bits):
    morton |= ((x >> i) & 1) << (2*i)
    morton |= ((z >> i) & 1) << (2*i + 1)
```

For 3D (including Y): interleave three coordinates, each contributing every third bit.

### 7.2 Locality Properties

Morton codes preserve 2D locality in the 1D key: points that are spatially close tend to have numerically close Morton codes. However, the Z-pattern creates **row-reversal artifacts** at power-of-two boundaries. When the curve reaches the end of a Z-shaped quadrant, it jumps to the start of the next quadrant — which may be spatially distant. [SRC-MORTON]

Quantitatively, the Morton curve's average locality is about 1.5x worse than Hilbert for 2D grids and about 2x worse for 3D grids. The maximum jump distance is O(sqrt(N)) for a grid of N cells — the same asymptotic bound as Hilbert, but with a larger constant.

### 7.3 Computational Advantage

Morton codes are **trivially fast to compute** — a handful of bit shifts and ORs. No recursion, no state, no lookup tables (though lookup tables can accelerate batch computation). On modern CPUs with BMI2 instruction set support, the `pdep` and `pext` instructions compute Morton codes in a single cycle. [SRC-MORTON]

This speed advantage matters for:
- Real-time ingest (encoding new chunks as they arrive)
- RADOS object key generation (Morton code of region coordinates)
- Range queries (Morton code intervals map to rectangular regions with bounded waste)

### 7.4 Morton Codes as RADOS Object Keys

For v2 (Ceph integration), Morton codes provide a natural mapping from 2D region coordinates to 1D RADOS object keys. The RADOS placement algorithm (CRUSH) distributes objects across OSDs based on key hash. Morton-coded keys ensure that spatially adjacent regions have numerically adjacent keys, which — while CRUSH doesn't preserve this ordering — provides a clean, deterministic, reversible naming scheme.

```
region (x=3, z=5) -> morton_key = interleave(3, 5) = "r.39"
```

The key is always reversible: given the Morton code, you can extract X and Z coordinates in O(1).

---

## 8. Evaluation Framework

### 8.1 Locality Preservation Metric

The primary metric is **k-neighborhood preservation**: for each document chunk, compute its k nearest neighbors in embedding space (by cosine similarity) and its k nearest neighbors in voxel space (by Manhattan distance). The preservation score is the fraction of embedding-space neighbors that are also voxel-space neighbors:

```
preservation@k = |NN_embedding(k) ∩ NN_voxel(k)| / k
```

Averaged over all chunks, this gives a single score between 0 and 1. Random placement yields preservation proportional to k/N (near zero for large N). Perfect preservation yields 1.0.

### 8.2 Retrieval Impact Metric

Locality preservation is only valuable if it improves retrieval. The retrieval impact metric measures:

1. Run brute-force retrieval (scan all embeddings, return top-k by cosine similarity) — this is the **ground truth**
2. Run spatially-bounded retrieval (scan only chunks within radius r of the query's projected coordinates, return top-k)
3. Measure **recall@k**: fraction of ground-truth top-k results found by the spatial search

If the mapping preserves locality well, recall@k should be high even for small radii. If it is poor, you need to scan the whole world — and the spatial mapping provides no value.

### 8.3 Benchmark Protocol

For each mapping strategy (UMAP, PCA, Hilbert, Morton, PCA+Hilbert hybrid):

1. Generate embeddings for the test corpus (Module 05 benchmark corpus)
2. Compute the coordinate mapping
3. Measure preservation@10, preservation@50, preservation@100
4. Measure recall@10 at radii 5, 10, 25, 50, 100 chunks
5. Measure mapping computation time
6. Report stability: add 10% new documents, measure how many existing coordinates change

---

## 9. Dynamic Corpus Growth

### 9.1 The Stability Problem

A knowledge store is not static. Documents are added continuously. The coordinate mapping must handle growth without invalidating existing positions. If adding one document forces a global remapping, the entire world must be rebuilt — every .mca file rewritten, every spatial index updated. This is unacceptable.

### 9.2 Strategy Comparison for Growth

| Strategy | Stability | Growth Mode |
|----------|-----------|-------------|
| UMAP (full refit) | None — all points move | Full rebuild |
| UMAP (transform) | Partial — new points projected into existing layout | Append-only, some quality loss |
| PCA (fixed matrix) | Full — projection matrix is immutable once trained | Append-only, no quality loss |
| Hilbert (append) | Full — new documents get next index | Append to frontier |
| Morton (coordinate-based) | Full — coordinates are deterministic from embedding | Append-only |

The **PCA + Hilbert** hybrid offers the best stability: the PCA projection matrix is fixed (trained on the initial corpus or a representative sample), and new documents are projected, assigned the next Hilbert index, and placed at the corresponding coordinates. Existing documents never move.

### 9.3 World Frontier Growth

As the corpus grows, the Hilbert curve extends into new territory. The Minecraft world grows accordingly — new region files are created as chunks are placed in previously-empty coordinates. This mirrors how a Minecraft world generates terrain: unexplored regions don't exist on disk until someone visits them. In VAV, "visiting" means ingesting a document that maps to that region.

The growth pattern is outward from the origin. The Hilbert curve fills a 2^n x 2^n grid before expanding to 2^(n+1) x 2^(n+1). This means the world grows in concentric square shells — old knowledge near the center, new knowledge at the edges. Walking outward from spawn is walking forward in time.

---

## 10. Address Space Capacity

### 10.1 Coordinate Limits

Minecraft uses signed 32-bit integers for X and Z coordinates:

```
X range: [-2,147,483,648, 2,147,483,647]
Z range: [-2,147,483,648, 2,147,483,647]
```

At the chunk level (dividing by 16): ~268 million chunks per axis, ~7.2 x 10^16 total chunk positions.

At the section level (24 sections per chunk): ~1.7 x 10^18 total section positions.

### 10.2 Corpus Capacity

Each section stores one document chunk. Even at the extremely conservative estimate of using only the positive quadrant (X >= 0, Z >= 0):

- Chunk positions: ~1.8 x 10^16
- With 24 sections each: ~4.3 x 10^17

For reference:
- The entire English Wikipedia: ~7 million articles, ~70 million 512-token chunks
- The Common Crawl: ~3.15 billion web pages, ~30 billion chunks
- All of human written history (estimated): ~300 billion documents

The coordinate system supports corpora **millions of times larger** than anything that exists. Address space exhaustion is not a concern for any foreseeable use case. The signed 32-bit coordinate system provides approximately 3.5 x 10^12 unique chunk positions in the practical working range — more than sufficient.

### 10.3 Sparse Population

In practice, the coordinate space will be extremely sparse. A corpus of 1 million chunks occupies 1 million positions out of 10^16+ available — a density of roughly 10^-10. This sparsity is an advantage: it means document clusters have room to spread out, collisions are nearly impossible, and new documents can always be placed near their semantic neighbors without displacing existing content.

---

## 11. Hybrid Strategies

### 11.1 PCA + Hilbert (Recommended for PoC)

The recommended mapping for the proof-of-concept:

1. **Train PCA** on the initial corpus, keeping the top 8 components
2. **Project** each embedding to 8D via the PCA matrix
3. **Reduce 8D to 1D** using the first principal component of the 8D projection (or a weighted combination)
4. **Sort** documents by 1D value
5. **Assign** Hilbert curve indices in sort order
6. **Convert** Hilbert index to (x, z) coordinates

This pipeline is:
- Fast (PCA + sort + bitwise Hilbert computation)
- Deterministic (no randomness)
- Stable (PCA matrix is frozen after training)
- Incrementally updatable (new documents project, sort-insert, and take the next Hilbert index at the appropriate position)

### 11.2 UMAP + Morton (Alternative for Visualization)

When visualization quality matters more than stability:

1. **Fit UMAP** with n_components=2, metric="cosine"
2. **Scale** output to integer range
3. **Assign** Morton-coded keys for RADOS storage
4. **Use Morton codes** for range-query bounding boxes

This produces beautiful 2D maps where topic clusters are visually apparent. The trade-off is refit cost when the corpus changes significantly.

### 11.3 Learned Projection (v2 Research)

A neural network trained to minimize a locality-preserving loss function (e.g., contrastive loss on embedding similarity vs. coordinate distance) could produce a mapping specifically optimized for the VAV retrieval task. This is a v2 research direction — the PoC uses off-the-shelf techniques to establish baselines.

---

## 12. Connection to v2 and v3

### 12.1 v2: Seed Space

The v2 architecture introduces **seed space** — a structured coordinate system where each axis carries semantic meaning (topic, time, source, etc.). The spatial embedding mapping from this module becomes the **seed-space projection function**: it determines where in seed space each document lives.

Morton codes provide the bridge: seed-space coordinates are Morton-encoded to produce RADOS object keys. The Morton code preserves multi-dimensional locality in the 1D key space, which aligns with CRUSH placement — objects with similar keys land on similar OSDs, enabling locality-aware data placement.

The **seed-space distance metric** (how far apart two documents are in seed space) is derived from the coordinate mapping's distance function. If the mapping preserves embedding locality well, seed-space distance approximates semantic distance.

### 12.2 v3: Frequency-Domain Interpretation

The v3 architecture brings frequency-domain analysis to the knowledge store. The spatial embedding mapping has a frequency-domain interpretation: the mapping function acts as a **spatial filter** on the embedding signal.

Consider the 1D projection of embeddings as a signal. PCA extracts the lowest-frequency components (directions of maximum variance = smoothest variation across the corpus). The Hilbert curve then tiles this signal into 2D space with minimal aliasing (its superior locality means fewer high-frequency artifacts from spatial discontinuities).

A Morton curve, by contrast, introduces systematic high-frequency artifacts at quadrant boundaries (the row-reversal jumps). In the frequency domain, these appear as energy in spatial frequencies that don't correspond to semantic structure — noise injected by the mapping rather than present in the data.

This interpretation informs the choice between Hilbert and Morton: Hilbert produces a cleaner spatial spectrum, which matters when v3 applies Fourier analysis to the knowledge landscape for pattern detection.

---

## 13. Cross-Reference

| Module | Connection |
|--------|------------|
| M1 (Thesis) | Spatial mapping is the bridge between abstract embeddings and concrete voxel positions |
| M2 (Ceph/RADOS) | Morton codes generate RADOS object keys; spatial locality maps to data placement |
| M3 (RAG Pipeline) | Retrieval quality depends directly on mapping locality preservation |
| M4 (Anvil/NBT) | Coordinate system constraints (integer, signed 32-bit) from the Anvil format |
| M5 (PoC Plan) | PoC implements and benchmarks the mapping strategies described here |
| M7 (v2 Seed Space) | Mapping function becomes the seed-space projection; Morton codes bridge to RADOS |
| M8 (v3 Frequency) | Locality preservation quality has frequency-domain interpretation |

---

## 14. Sources

| ID | Reference |
|----|-----------|
| SRC-UMAP | McInnes, L., Healy, J., and Melville, J. "UMAP: Uniform Manifold Approximation and Projection for Dimension Reduction." arXiv:1802.03426, 2018. |
| SRC-PCA | Jolliffe, I.T. "Principal Component Analysis." Springer Series in Statistics, 2nd ed., 2002. |
| SRC-SFC | Sagan, H. "Space-Filling Curves." Springer-Verlag, 1994. |
| SRC-HILBERT | Hilbert, D. "Ueber die stetige Abbildung einer Linie auf ein Flaechenstueck." Mathematische Annalen 38, 1891. Butz, A.R. "Alternative Algorithm for Hilbert's Space-Filling Curve." IEEE Trans. Comput., 1971. |
| SRC-MORTON | Morton, G.M. "A Computer Oriented Geodetic Data Base and a New Technique in File Sequencing." IBM Technical Report, 1966. |
| SRC-JL | Johnson, W.B. and Lindenstrauss, J. "Extensions of Lipschitz mappings into a Hilbert space." Contemporary Mathematics 26, 1984. |
| SRC-REGION | Minecraft Wiki. "Region file format." https://minecraft.wiki/w/Region_file_format |
| SRC-CRUSH | Weil, S.A. et al. "CRUSH: Controlled, Scalable, Decentralized Placement of Replicated Data." Proc. SC 2006. |
