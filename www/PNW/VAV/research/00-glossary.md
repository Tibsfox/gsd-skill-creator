# Glossary — Voxel as Vessel

Comprehensive terminology for the VAV research atlas. Each term lists the modules where it appears. Every block is a vessel — this glossary maps the vocabulary of filling them.

---

## Ceph & Distributed Storage (v1)

| Term | Definition | Modules |
|------|-----------|---------|
| **RADOS** | Reliable Autonomic Distributed Object Store. The foundational layer of Ceph that provides a self-healing, self-managing object store across commodity hardware. All higher-level Ceph services (RGW, CephFS, RBD) are built on RADOS. | Ceph, Integration |
| **CRUSH** | Controlled Replication Under Scalable Hashing. Ceph's deterministic placement algorithm that maps objects to OSDs without a central lookup table. Uses a hierarchical cluster map (root → rack → host → OSD) to enforce failure-domain isolation. Described in Sage Weil's 2006 SC paper and UCSC PhD thesis. | Ceph, Integration |
| **OSD** | Object Storage Daemon. A Ceph daemon responsible for storing objects on a single disk or partition. Each OSD handles replication, recovery, and heartbeat reporting to monitors. A typical Ceph cluster has dozens to thousands of OSDs. | Ceph |
| **BlueStore** | Ceph's default OSD storage backend since Luminous (v12, 2017). Manages raw block devices directly, bypassing the Linux filesystem layer. Eliminates the double-write penalty of the earlier FileStore backend. Stores data, metadata, and WAL on separate devices when available. | Ceph |
| **RGW** | RADOS Gateway. A stateless HTTP/S3-compatible API frontend for RADOS. Translates S3 GET/PUT/DELETE operations into RADOS object operations. Scales horizontally behind a load balancer. Provides the access pattern `regions/r.{x}.{z}.mca` in VAV. | Ceph, Integration |
| **Pool** | A logical partition of a Ceph cluster with its own replication factor, CRUSH ruleset, and PG count. VAV defines three pools: `vav-regions` (Anvil .mca objects), `vav-meta` (world metadata and index maps), `vav-cache` (hot embedding cache with short TTL). | Ceph, Integration |
| **Placement Group (PG)** | An intermediate mapping layer between objects and OSDs. Objects hash to PGs; CRUSH maps PGs to OSDs. PGs enable efficient rebalancing — moving a PG moves all its objects together. Typical ratio: 100-200 PGs per OSD. | Ceph |
| **xattrs** | Extended attributes. Key-value metadata pairs stored directly on a RADOS object. Fast to read (single round-trip), size-limited (~64 KB per xattr in BlueStore). Used in VAV for block palette hashes, DataVersion, and coordinate bounds. | Ceph, Integration |
| **omap** | Object map. A key-value store associated with a RADOS object, backed by RocksDB in BlueStore. Supports range queries and iteration. Used for larger metadata that exceeds xattr limits — embedding index offsets, chunk manifest tables. | Ceph, Integration |
| **Monitor (MON)** | A Ceph daemon that maintains the authoritative cluster map (OSD map, CRUSH map, PG map, monitor map). Monitors form a Paxos quorum — typically 3 or 5 for consensus. Clients contact monitors to get the current cluster map, then talk directly to OSDs. | Ceph |
| **Erasure Coding** | A data protection scheme that splits an object into k data fragments and m coding fragments. Tolerates m failures with less storage overhead than full replication. Trade-off: higher CPU cost for encode/decode, no partial overwrites. Suitable for `vav-regions` cold tier. | Ceph |
| **CephX** | Ceph's authentication protocol. Uses shared secrets and ticket-based auth (similar to Kerberos). Every client and daemon authenticates via CephX keyrings. In VAV, CephX keyrings scope access per pool — a reader can access `vav-regions` but not `vav-meta` admin operations. | Ceph, Integration |
| **Boost.Asio** | A C++ asynchronous I/O library used by the Ceph RGW Beast frontend (default since Nautilus). Provides high-concurrency HTTP handling via epoll/kqueue. Relevant to VAV retrieval latency under concurrent spatial queries. | Ceph |

---

## RAG & Information Retrieval (v1)

| Term | Definition | Modules |
|------|-----------|---------|
| **RAG** | Retrieval-Augmented Generation. A pattern that grounds LLM responses in retrieved source documents. The retriever fetches relevant chunks; the generator (LLM) synthesizes an answer conditioned on them. Lewis et al. (2020) introduced the term; the pattern is now standard in production LLM systems. | RAG, Integration |
| **Embedding** | A dense vector representation of text (or other data) in a continuous vector space. Semantically similar texts have nearby vectors. Models: OpenAI text-embedding-3-large (3072-dim), BGE-M3 (1024-dim), Cohere embed-v3 (1024-dim). Stored as NBT TAG_Float arrays in VAV. | RAG, Integration |
| **Chunking** | The process of splitting source documents into fixed-size or semantically coherent segments for embedding and retrieval. Common strategies: fixed token count (256-512 tokens), recursive character splitting, semantic boundary detection. In VAV, chunks map to 16x16x16 Minecraft sections. | RAG, Integration |
| **Reranking** | A second-stage relevance scoring applied to an initial candidate set. Cross-encoder models (e.g., Cohere Rerank 3.5) score query-document pairs jointly, improving precision over embedding-only retrieval. Typically reranks top-k (20-100) candidates down to final-k (3-10). | RAG, Integration |
| **Vector Search** | Approximate nearest-neighbor (ANN) search in high-dimensional embedding space. Returns the k most similar vectors to a query vector. Algorithms: HNSW (graph-based), IVF (partition-based), PQ (compression-based). Sub-linear time complexity. | RAG |
| **HNSW** | Hierarchical Navigable Small World. A graph-based ANN index that builds a multi-layer proximity graph. Top layers have long-range connections for fast traversal; bottom layers have dense local connections for precision. O(log n) query time. Memory-intensive but fast. | RAG |
| **IVF** | Inverted File Index. A partition-based ANN approach that clusters vectors into Voronoi cells, then searches only the nearest clusters at query time. IVF-PQ combines partitioning with product quantization for memory efficiency. Trades recall for speed via the `nprobe` parameter. | RAG |
| **BM25** | Best Matching 25. A probabilistic sparse retrieval function based on term frequency, inverse document frequency, and document length normalization. The standard baseline for keyword search. In VAV, combined with dense retrieval via Reciprocal Rank Fusion (RRF). | RAG, Integration |
| **Reciprocal Rank Fusion (RRF)** | A score combination method that merges ranked lists from multiple retrievers. For each document, RRF score = sum of 1/(k + rank_i) across retrievers. Simple, parameter-free (besides k, typically 60), and effective for hybrid sparse+dense search. | RAG, Integration |
| **Matryoshka Embeddings** | A training technique (Kusupati et al., NeurIPS 2022) that produces embeddings useful at multiple dimensionalities. The first d dimensions of a 3072-dim vector are a valid d-dim embedding. Enables coarse-to-fine retrieval: fast search at 256-dim, precise rerank at 3072-dim. | RAG |
| **Corrective RAG (CRAG)** | An advanced RAG pattern that evaluates retrieval quality before generation. If retrieved documents score below a confidence threshold, the system triggers web search or alternative retrieval. Self-correcting loop improves answer reliability. Yan et al. (2024). | RAG |
| **Agentic RAG** | A RAG pattern where an LLM agent orchestrates multi-step retrieval. The agent decides which tools to call, how to decompose queries, and when retrieval is sufficient. Enables complex reasoning chains over retrieved evidence. | RAG |
| **GraphRAG** | A RAG pattern that builds a knowledge graph from source documents, then retrieves subgraphs relevant to a query. Microsoft Research (2024) showed it outperforms naive RAG on global summarization tasks by capturing cross-document relationships. | RAG |
| **NDCG@k** | Normalized Discounted Cumulative Gain at rank k. An information retrieval metric that measures ranking quality, accounting for position (higher-ranked relevant documents score more). Values 0-1; 1.0 = perfect ranking. Standard metric for retrieval evaluation. | RAG |

---

## Minecraft & Voxel Format (v1)

| Term | Definition | Modules |
|------|-----------|---------|
| **Anvil Format** | Minecraft's region-based world storage format, introduced in version 1.2 (2012). Superseded the McRegion format. Stores 32x32 chunk columns per region file. Uses zlib/gzip compression and NBT encoding. File extension: `.mca`. The physical vessel in VAV. | Integration, Ceph |
| **Region File (.mca)** | A binary file containing up to 1024 chunk columns (32x32 grid). Header: 8 KB (4 KB offset table + 4 KB timestamp table). Chunk data is sector-aligned (4 KB sectors). Filename encodes region coordinates: `r.{x}.{z}.mca`. In VAV, each .mca file becomes one RADOS object. | Integration, Ceph |
| **NBT** | Named Binary Tag. Minecraft's hierarchical binary data format for structured storage. Tag types: TAG_Byte, TAG_Short, TAG_Int, TAG_Long, TAG_Float, TAG_Double, TAG_String, TAG_List, TAG_Compound, TAG_Byte_Array, TAG_Int_Array, TAG_Long_Array. Used for chunk data, entity data, and in VAV, embedding vectors. | Integration, RAG |
| **Chunk** | A 16-block-wide column from bedrock to build height (16x384x16 in modern Minecraft, 16x256x16 pre-1.18). The fundamental load/save unit. Contains up to 24 sections, biome data, heightmaps, entities, and tile entities. In VAV, a chunk is a document (~20 sections of text). | Integration |
| **Section** | A 16x16x16 cube of blocks within a chunk. Each section stores a block state palette and a packed long array of palette indices. Sections with only air are omitted. In VAV, a section is a document chunk (~400 tokens). The core mapping unit. | Integration, RAG |
| **Block State** | The complete description of a block: type (e.g., `minecraft:oak_log`) plus properties (e.g., `axis=y`). The palette maps block states to compact integer indices. In VAV, block states encode token identity — each unique token maps to a unique block state. | Integration |
| **Palette** | A per-section lookup table that maps integer indices to block state definitions. Enables compact storage — a section with only 3 distinct block types needs only 2 bits per block instead of the full block state ID. In VAV, the palette IS the vocabulary for that section. | Integration |
| **DataVersion** | An integer in every chunk's NBT root that identifies the Minecraft version that last saved it. Enables the Data Fixer Upper (DFU) system to migrate old chunk formats. In VAV, DataVersion tracks the encoding schema version for forward compatibility. | Integration |
| **Heightmap** | A 16x16 array of integers per chunk recording the highest block of various types (MOTION_BLOCKING, WORLD_SURFACE, OCEAN_FLOOR). Pre-computed for lighting and collision. In VAV, heightmaps could index document density per column. | Integration |

---

## Voxel-as-Vessel Specific (v1)

| Term | Definition | Modules |
|------|-----------|---------|
| **Spatial Shard Unit** | A region file (32x32 chunks) treated as an atomic storage and retrieval unit in the VAV system. Maps to one RADOS object. Co-located on the same OSD with adjacent spatial shard units via CRUSH affinity rules. | Integration, Ceph |
| **Coordinate Mapper** | The subsystem that translates between high-dimensional embedding space and Minecraft (x, y, z) coordinates. Techniques: UMAP projection to 2D → (x, z), PCA for coarse placement, Morton codes for locality-preserving linearization. Y-axis encodes document structure (section stacking). | Integration, RAG |
| **Voxel Corpus** | The entire collection of documents encoded as a Minecraft world. Each block is a token, each section is a chunk of text, each chunk column is a document, each region is a corpus shard. The world IS the database. Navigable with standard Minecraft clients. | Integration |
| **Block-Token Isomorphism** | The central mapping principle of VAV: a 1:1 correspondence between text tokens and Minecraft blocks. A token's identity maps to a block state; a token's position maps to voxel coordinates; a token's embedding maps to NBT float arrays attached to its section. The isomorphism is structure-preserving — adjacency in text maps to adjacency in space. | Integration, RAG |
| **Encoding Scheme** | The complete specification for converting documents into voxel structures. Defines: token → block state mapping, chunk boundary rules, embedding → NBT serialization format, coordinate assignment algorithm, and metadata propagation (source URL, timestamp, version). | Integration |

---

## Procedural Generation & Multi-Server (v2)

| Term | Definition | Modules |
|------|-----------|---------|
| **PCG Seed** | Procedural Content Generation seed. A deterministic starting value that produces reproducible random sequences. In Minecraft, the world seed controls terrain, biome, and structure generation. In VAV v2, the PCG seed governs spatial layout of corpus shards — same seed, same world. | Integration |
| **LCG** | Linear Congruential Generator. A simple PRNG defined by x_{n+1} = (a * x_n + c) mod m. Minecraft's Java Edition uses `java.util.Random`, an LCG with a = 25214903917, c = 11, m = 2^48. Fast but predictable — acceptable for terrain generation, not for cryptography. | Integration |
| **Morton Code (Z-order)** | A space-filling curve that interleaves the bits of x and z coordinates into a single integer. Preserves 2D spatial locality in 1D ordering. Used in VAV for linearizing region coordinates into RADOS object keys while maintaining cache-friendly access patterns for adjacent regions. | Integration, Ceph |
| **Hilbert Curve** | A continuous space-filling curve with better locality preservation than Morton codes. Visiting order: adjacent cells in 2D are (mostly) adjacent in 1D. Higher computational cost to encode/decode. Used in VAV for embedding space → voxel coordinate mapping when locality matters more than speed. | Integration, RAG |
| **LOD Zone** | Level of Detail zone. A spatial region rendered at reduced fidelity based on viewer distance. In VAV, LOD zones enable multi-resolution corpus access: nearby sections at full 3072-dim embeddings, distant sections at Matryoshka-truncated 256-dim. Reduces memory and bandwidth for large corpora. | Integration, RAG |
| **MultiPaper** | A Minecraft server distribution that splits world regions across multiple backend servers. Each backend owns a set of region files; a coordinator routes players to the correct backend. In VAV, MultiPaper maps naturally to RADOS — each backend reads its region files from Ceph. | Integration, Ceph |
| **Velocity** | A Minecraft proxy server that routes player connections to backend servers. Supports server-to-server transfers, shared chat, and plugin messaging. In VAV multi-server deployments, Velocity is the entry point that routes spatial queries to the correct MultiPaper backend. | Integration |
| **HuskSync** | A cross-server player data synchronization plugin. Ensures inventory, ender chest, health, and location persist when a player transfers between backend servers. In VAV, HuskSync maintains query context across corpus shard boundaries. | Integration |
| **Sovereign World** | A VAV instance operated independently by a single entity. Contains its own corpus, its own Ceph cluster (or partition), its own trust scope. Can federate with other sovereign worlds via DoltHub or direct peering. Mirrors the Burning Man regional burn model. | Integration |
| **Torus Wrap** | A world-edge topology where crossing the +x boundary wraps to -x (and similarly for z). Creates a toroidal world geometry. In VAV, torus wrap enables continuous corpus navigation without world borders — walking past the last region loops to the first. | Integration |
| **Structure Seed** | The lower 48 bits of a Minecraft world seed. All structure placements (villages, strongholds, monuments) derive from only these 48 bits. Brute-force recoverable on GPU in hours — do not treat as secret. | M9, M13 |
| **Biome Seed** | GenLayer's internal LCG state (multiplier 6364136223846793005L, increment 1442695040888963407L) that determines biome placement. Requires the full 64-bit seed, unlike structure generation. | M9 |
| **Climate Parameters** | Since 1.18, five noise-derived parameters per quarter-chunk: temperature, humidity, continentalness, erosion, weirdness. Biome assignment matches these to the nearest biome in a 5D climate space. Each seed generates a 5D climate field. | M9 |
| **Seed-Space Distance** | d(s₁, s₂) = minimum LCG steps between two seed states. Computable in O(1) via modular inverse of the LCG multiplier. Seeds that are "close" produce structurally similar worlds. | M9 |
| **BlockState Palette** | Per-section lookup table mapping integer indices to block state definitions. Bits-per-entry = max(4, ceil(log₂(palette_size))). In VAV, the palette IS the vocabulary — palette size is vocabulary size, bits-per-entry is entropy. | M7 |
| **Pack Format** | Version integer in `pack.mcmeta` controlling resource pack compatibility. Format 48 = Minecraft 1.21, format 88 = 1.21.9. Since 25w31a, `min_format`/`max_format` range supported. Maps to Ceph object versioning. | M8 |
| **PBR Texture Set** | Bedrock's `minecraft:texture_set` JSON (format_version 1.16.100+) defining physically-based rendering layers: color, normal, MER (metalness/emissive/roughness), heightmap. Multiplies texture storage by up to 4x per block type. | M8 |
| **Atlas System** | Sprite sheet stitching system (Java 1.19.3+) with 5 source types: directory, single, filter, unstitch, paletted_permutations. Controls GPU-side texture atlas generation with mipmapping. | M8 |
| **RBD** | RADOS Block Device. Ceph's block storage interface that presents a virtual disk backed by RADOS objects. Supports snapshots (CoW), cloning, mirroring, and thin provisioning. World volumes in VAV are Ceph RBD images. | M11, M13 |
| **RBD Mirroring** | Cross-site replication of RBD images. Journal-based (near-zero RPO, high bandwidth) or snapshot-based (configurable RPO, lower bandwidth). Enables sovereign world DR across datacenters. | M13 |
| **Hot-Swap Failover** | Live promotion of secondary RBD image to primary during site failure. 8-step planned sequence or force-promote for unplanned. Cardinal rule: always demote before promote — never concurrent dual-primary. Target RTO ≤ 5 minutes. | M13 |
| **Domain Manager** | SCS-contributed OpenStack role enabling tenant self-governance. World operators manage their own users, roles, and quotas without cloud-admin access. The infrastructure of sovereignty. | M11 |
| **PlacementFilter** | Nova scheduler filter that assigns VMs to dedicated compute nodes per tenant. Prevents cross-tenant VM cohabitation — world isolation at the hypervisor level. | M11 |
| **LUKS** | Linux Unified Key Setup. Disk encryption standard used above RBD for data-at-rest protection. Key managed by OpenStack Barbican or local escrow. | M13 |
| **Portal Gateway** | Cross-world warp between two sovereign worlds at matching border coordinates. Implemented via Velocity plugin + MultiPaper cross-server teleport. Requires bilateral consent between world operators. | M12 |
| **Edge Stitch** | Topology extension where adjacent worlds share a border region stored redundantly in both worlds' Ceph pools. Chunk data replicated at the seam for seamless cross-world navigation. | M12 |

---

## Signal Processing, Imaging & Security (v3)

| Term | Definition | Modules |
|------|-----------|---------|
| **Nyquist Limit** | The minimum sampling rate required to accurately represent a continuous signal: at least 2x the highest frequency component. Below Nyquist, aliasing occurs — high frequencies masquerade as low frequencies. In VAV v3, the Nyquist limit governs minimum chunk density for faithful text representation. | Integration |
| **Temporal Aliasing** | Distortion that occurs when a time-varying signal is sampled too infrequently. In VAV, temporal aliasing arises when document updates occur faster than the re-embedding cycle — changes between snapshots are lost or misrepresented. | Integration |
| **Fourier Transform** | A mathematical operation that decomposes a signal into its constituent frequencies. The DFT (Discrete Fourier Transform) and its fast implementation (FFT) are foundational to signal analysis. In VAV v3, Fourier analysis identifies periodic structure in document collections. | Integration |
| **STFT** | Short-Time Fourier Transform. Applies the Fourier transform to windowed segments of a signal, producing a time-frequency spectrogram. Reveals how frequency content changes over time. In VAV, STFT analyzes embedding drift across corpus versions. | Integration |
| **Wiener Filter** | An optimal linear filter that estimates a desired signal from noisy observations by minimizing mean square error. Requires knowledge of signal and noise power spectra. In VAV v3, Wiener filtering denoises embedding vectors corrupted by quantization or compression artifacts. | Integration, RAG |
| **ICC Profile** | International Color Consortium profile. A standardized description of a color space that enables consistent color reproduction across devices. In VAV v3, ICC profiles govern the mapping between block color and semantic category — ensuring visual consistency across renderers. | Integration |
| **DNG** | Digital Negative. Adobe's open raw image format. Embeds ICC profiles, lens correction data, and full sensor data. In VAV v3, DNG is referenced as an analogy for the "raw" voxel format — preserving maximum fidelity before any lossy processing. | Integration |
| **FlatBuffers** | A cross-platform serialization library (Google) that provides zero-copy access to serialized data. No parsing/unpacking step — the wire format IS the in-memory format. In VAV v3, FlatBuffers is an alternative to NBT for high-performance embedding storage where NBT parsing overhead is unacceptable. | Integration, RAG |
| **IPoAC** | Internet Protocol over Avian Carriers (RFC 1149/2549). A humorous but technically valid protocol for transmitting IP packets via carrier pigeon. In VAV v3, IPoAC is referenced as a limiting case of sneakernet mesh — physical media transport has infinite bandwidth but terrible latency. | Integration |
| **Sneakernet Mesh** | A data distribution method using physical media (USB drives, hard disks, shipping containers of disks) transported by humans or vehicles. AWS Snowball is industrial sneakernet. In VAV v3, sneakernet mesh enables offline corpus synchronization for sovereign worlds without internet connectivity. | Integration, Ceph |
| **Zero Trust** | A security model that assumes no implicit trust based on network location. Every access request is authenticated, authorized, and encrypted regardless of origin. "Never trust, always verify." In VAV v3, zero trust governs inter-world federation — sovereign worlds authenticate every object exchange. | Integration |
| **PDP/PEP** | Policy Decision Point / Policy Enforcement Point. NIST SP 800-207 architecture: the PDP evaluates access policies; the PEP enforces them at the resource boundary. In VAV, the PDP determines whether a query can access a corpus shard; the PEP (at the RGW layer) blocks or allows the RADOS operation. | Integration, Ceph |
| **SASE** | Secure Access Service Edge. A network architecture (Gartner, 2019) that converges WAN and security services (ZTNA, CASB, FWaaS) into a cloud-delivered service. In VAV v3, SASE is the target architecture for multi-site sovereign world federation over public internet. | Integration |

---

## Sources

- Weil, S. A. (2007). *CRUSH: Controlled, Scalable, Decentralized Placement of Replicated Data*. PhD Thesis, UC Santa Cruz.
- Lewis, P. et al. (2020). *Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks*. NeurIPS 2020.
- Kusupati, A. et al. (2022). *Matryoshka Representation Learning*. NeurIPS 2022.
- Yan, S. et al. (2024). *Corrective Retrieval Augmented Generation*. arXiv:2401.15884.
- Microsoft Research (2024). *GraphRAG: Unlocking LLM Discovery on Narrative Private Data*.
- Mojang Studios. *Minecraft Anvil File Format*. Minecraft Wiki.
- NIST SP 800-207 (2020). *Zero Trust Architecture*.
- RFC 1149 (1990). *A Standard for the Transmission of IP Datagrams on Avian Carriers*.
