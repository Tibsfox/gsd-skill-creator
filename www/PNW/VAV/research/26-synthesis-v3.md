# M21 — Synthesis: Frequency-Domain Unification

**Module 21 of the Voxel as Vessel research atlas.**
**Pass:** v3 (Signal Fidelity)
**Modules synthesized:** M14 (Temporal Imaging), M15 (Color Fidelity), M16 (Audio Fidelity), M17 (Serialization & HPC), M18 (Transport Taxonomy), M19 (Backup & Federation), M20 (Zero Trust & Firewall)
**Predecessor:** M7 (Integration Synthesis, v1) — structural isomorphism

---

## Table of Contents

1. [The Fidelity Continuum](#1-the-fidelity-continuum)
2. [Frequency-Domain Unification Table](#2-frequency-domain-unification-table)
3. [The Extended Isomorphism](#3-the-extended-isomorphism)
4. [Cross-Module Integration Map](#4-cross-module-integration-map)
5. [The Transport Matrix: Bandwidth x Latency Pareto Front](#5-the-transport-matrix-bandwidth-x-latency-pareto-front)
6. [The Sneakernet Mesh Protocol Specification](#6-the-sneakernet-mesh-protocol-specification)
7. [Through-Line](#7-through-line)
8. [Sources](#8-sources)

---

## 1. The Fidelity Continuum

### 1.1 The Core Thesis

Hi-fi and lo-fi are not quality labels. They are frequency-domain decisions.

Every encoding choice in any system that captures, stores, transports, or reconstructs information is a decision about which frequencies to preserve and which to sacrifice. The word "fidelity" means faithfulness — faithfulness to the original signal. A hi-fi system preserves more of the original frequency content. A lo-fi system preserves less. Neither is inherently better. The right fidelity level is the one that preserves exactly the frequencies the application needs and discards exactly the frequencies it does not, at a cost the system can sustain.

This is not a metaphor borrowed from audio engineering. It is the mathematical structure that audio, imaging, networking, storage, and security share. The Nyquist-Shannon sampling theorem does not care whether the signal is:

- Photons hitting a sensor (M14: temporal integration window = low-pass filter cutoff)
- Spectral power distribution entering a color space (M15: gamut width = spectral bandwidth preserved)
- Acoustic pressure at a microphone diaphragm (M16: sample rate / 2 = Nyquist frequency)
- Block types filling a palette (M7: palette cardinality / 2 = semantic Nyquist limit)
- Structured records crossing a serialization boundary (M17: parse overhead = codec frequency response)
- Datagrams traversing a transport (M18: bandwidth-latency product = channel capacity)
- Snapshots capturing world state at intervals (M19: snapshot frequency / 2 = maximum recoverable change rate)
- Authentication tokens refreshing against a policy engine (M20: token TTL = auth sampling period)

In each case, the system designer chooses a sampling rate, a quantization depth, and a reconstruction algorithm. The sampling rate determines the Nyquist limit — the highest frequency content that can be faithfully represented. The quantization depth determines the dynamic range — the ratio between the loudest and quietest signals that can coexist. The reconstruction algorithm determines what happens to content that falls between samples or outside the representable range.

### 1.2 The Three-Pass Architecture

The VAV research atlas is organized in three passes, each defining a different layer of the stack:

| Pass | Theme | Question Answered | Modules |
|------|-------|-------------------|---------|
| **v1** (Structural) | Territory mapping | What is the structural correspondence between Minecraft and Ceph? | M1-M6, M7 (Synthesis) |
| **v2** (Sovereignty) | Ownership and isolation | Who owns the world, and how is sovereignty enforced? | M8-M13, M18 (Retrospective) |
| **v3** (Signal Fidelity) | Encoding decisions | How do signals cross boundaries without losing meaning? | M14-M20, M21 (this document) |

The passes are not independent layers. They are frequency bands of a single architecture. v1 is the DC component — the structural foundation that changes slowly and underpins everything. v2 is the mid-frequency band — the organizational structures that define ownership boundaries and access patterns. v3 is the high-frequency band — the dynamic decisions about what survives encoding, transport, and reconstruction at every boundary crossing.

### 1.3 Why Frequency Domain

The frequency-domain perspective is not one possible lens among many. It is the natural coordinate system for fidelity questions because the Fourier transform is the mathematical tool that decomposes any signal into its constituent frequencies. Once decomposed:

- **Preservation** is keeping a frequency band.
- **Sacrifice** is zeroing a frequency band.
- **Compression** is reducing the precision of a frequency band.
- **Aliasing** is misrepresenting a frequency band because the sampling rate was too low.
- **Noise** is energy in frequency bands that carry no signal.

Every engineering decision in the VAV stack — from the camera shutter angle that captures a texture photograph to the JWT token TTL that gates a player session — maps to one of these five operations on a frequency band. The unification table in Section 2 makes these mappings explicit.

---

## 2. Frequency-Domain Unification Table

### 2.1 The Centerpiece

This table maps every layer of the VAV stack to its frequency-domain interpretation. Each row identifies the component, the frequency decision it makes, what is preserved when the fidelity budget is generous, and what is sacrificed when it is not.

| Layer | Component | Module | Frequency Decision | Preserve (hi-fi) | Sacrifice (lo-fi) |
|-------|-----------|--------|--------------------|-------------------|--------------------|
| **Capture** | Camera shutter | M14 §1.3 | Temporal LPF cutoff (sinc envelope, first null at 1/t_exp) | Motion detail: short exposure freezes temporal frequencies | Photon count: fewer photons per frame, lower SNR |
| **Color** | ICC/DNG profile + gamut | M15 §2.3 | Spectral gamut width (basis function span across 380-780 nm) | Color accuracy: wider gamut preserves spectral extremes | Address space: wider gamut spreads bit depth thinner per color step |
| **Audio** | ADC sample rate | M16 §2.1 | Nyquist limit (f_sample / 2) | Frequency range: 96 kHz captures to 48 kHz Nyquist | Storage: 2x sample rate = 2x data per second |
| **Encode** | Block palette (section) | M7 §3.2, M14 §5.5 | Vocabulary entropy (ceil(log2(palette_size))) | Semantic precision: more block types = finer meaning distinctions | Compression ratio: larger palette = more bits per voxel |
| **Serialize** | Format choice (NBT/FlatBuffers/MessagePack) | M17 §1.1 | Parse overhead (decode ns/op) | Speed: FlatBuffers at 81 ns/op = zero-copy frequency response | Human readability: JSON at 7,045 ns/op is human-legible but slow |
| **Transport** | Protocol selection | M18 §7.1 | Bandwidth-latency product (Shannon capacity of channel) | Throughput: InfiniBand NDR at 400 Gbps / 1 us latency | Latency (or vice versa): sneakernet at 11 Tbps / 14,400 s latency |
| **Store** | Erasure coding profile | M17 §2.3, M13 §2 | Redundancy factor (n-k parity symbols per codeword) | Durability: k=4, m=2 survives any 2 OSD failures | Storage efficiency: 1.5x overhead vs 1.0x raw |
| **Protect** | Zero trust auth cycle | M20 §5.1 | Authentication sampling period (JWT TTL) | Security posture: 15-min TTL catches revocations in <=15 min | User friction: more frequent re-auth = more session interruptions |
| **Backup** | Snapshot interval | M19 §1.1 | Temporal sampling of world state changes | Recoverability: sub-minute RPO via CDP journal mirroring | Storage/bandwidth: continuous journal = continuous bandwidth cost |
| **Generate** | PCG seed | M9 §3 | Generative frequency structure (LCG determinism in seed space) | World determinism: same seed = same world, reproducible forever | Uniqueness: deterministic generation constrains the possibility space |

### 2.2 Reading the Table

Every row follows the same pattern: a component makes a frequency-domain decision that trades preservation of one quality for sacrifice of another. The trade is not optional — it is imposed by the information-theoretic constraints of the medium. You cannot simultaneously maximize temporal resolution AND photon count (the exposure time is finite). You cannot simultaneously maximize serialization speed AND human readability (zero-copy formats are opaque). You cannot simultaneously maximize authentication security AND user convenience (shorter TTLs mean more re-auth).

The table also reveals a structural symmetry: the "Preserve" column reads as a list of engineering virtues (accuracy, speed, durability, security, recoverability, determinism), and the "Sacrifice" column reads as a list of engineering costs (storage, latency, friction, bandwidth, address space). Fidelity is the art of choosing which virtues justify which costs for a given application.

### 2.3 The Nyquist Column

Five rows in the table have an explicit Nyquist relationship — a hard mathematical threshold below which information is irreversibly destroyed:

| Layer | Nyquist Criterion | Below Threshold |
|-------|-------------------|-----------------|
| Capture | f_sample >= 2 * f_max (temporal) | Wagon-wheel aliasing; motion artifacts |
| Audio | f_sample >= 2 * f_max (acoustic) | Foldback distortion; false frequencies |
| Encode | palette_size >= 2 * K (semantic) | Semantic aliasing; distinct meanings collapse to same block |
| Backup | snapshot_rate >= 2 * max_change_rate | Temporal aliasing of world state; intermediate states lost |
| Protect | auth_rate >= 2 * revocation_rate | Security aliasing; revoked sessions persist beyond detection window |

The remaining five rows (Color, Serialize, Transport, Store, Generate) do not have a binary Nyquist threshold but instead operate on continuous tradeoff curves where the engineering decision is about optimizing a cost function rather than avoiding a hard cliff.

---

## 3. The Extended Isomorphism

### 3.1 From v1 to v3

The v1 synthesis (M7) established a 10-row isomorphism between Minecraft/Anvil and Ceph/RADOS based on structural correspondence: address space, storage unit, compression, metadata, placement, replication, type system, and coordinate keying. That isomorphism was structural — it showed that the same engineering constraints produced the same architecture in two independent systems.

The v3 modules extend the isomorphism from structure to signal. The structural correspondence says the containers are the same shape. The signal correspondence says the encoding decisions inside those containers follow the same mathematics. The isomorphism now spans from photons to federation.

### 3.2 The Extended Isomorphism Table

| # | Property | Minecraft/Anvil | Ceph/RADOS | Signal Fidelity Layer (v3) |
|---|----------|-----------------|------------|---------------------------|
| 1 | Address space | (rx, rz) region coords | pool/namespace/object-key | Morton code interleaving creates spatial frequency hierarchy (M14 §6.4) |
| 2 | Storage unit | Region file (.mca) | RADOS object | Region file = RADOS object = atomic backup unit for snapshot delta (M19 §2) |
| 3 | Sub-unit | Chunk (16x16x384) | N/A (object is atomic) | Chunk write rate = temporal sampling rate of world state (M14 §6.1) |
| 4 | Compression | zlib per chunk | zlib/snappy/zstd per object | Compression = frequency-domain quantization; discard high-entropy detail (M14 §5.3) |
| 5 | Metadata | NBT compound tags | xattrs + omap | ICC profile metadata as RADOS xattr (M15 §9.6); DNG dual-illuminant interpolation (M15 §4.2) |
| 6 | Placement | Filesystem directory | CRUSH algorithm -> OSD | CRUSH map is spatial transfer function; PG depth = frequency decomposition level (M14 §6.4) |
| 7 | Replication | Player backups, world copies | Replica or erasure-coded PGs | Erasure coding = Reed-Solomon over GF(2^8); corrects t symbol errors per codeword (M17 §2.3) |
| 8 | Type system | 12 NBT tag types | Opaque bytes + typed xattrs | NBT overhead 10-15%; FlatBuffers zero-copy at 81 ns decode (M17 §1.2) |
| 9 | Coordinate key | 4-byte header offset table | CRUSH hash -> PG -> OSD | Morton prefix depth maps frequency bins to CRUSH placement groups (M14 §6.4) |
| 10 | Palette | Block state palette per section | N/A | Palette cardinality = gamut size; BPE = quantization depth; Nyquist at palette_size / 2 (M14 §5.5) |
| 11 | Texture | Resource pack PNG per block face | N/A | Texture resolution = spatial sampling frequency; 16x16 = CD quality, 128x128 = archival (M15 §9.2) |
| 12 | Color profile | Palette-to-meaning mapping | ICC profile as RADOS object | ICC profile = device contract; PCS = canonical address space; rendering intent = gamut mapping (M15 §3) |
| 13 | Wire format | VarInt length-prefix over TCP | msgr2 frames over RDMA/TCP | Framing solves "where does this message start?" — UART start bit to Ethernet preamble (M17 §4) |
| 14 | Error correction | TCP checksum (16-bit, weak) | CRC-32C + RS erasure + LDPC on wire | Layered integrity: Hamming in RAM, CRC on wire, RS in pool, LDPC on copper (M17 §2) |
| 15 | Transport | TCP over consumer internet | RDMA over InfiniBand or 100GbE | Transport is a frequency decision: bandwidth x latency Pareto front (M18 §7.2) |
| 16 | Capture fidelity | World save = long exposure (box filter) | RBD snapshot = CoW freeze at time t | Snapshot interval = temporal sampling period; RPO = Nyquist limit of recovery (M14 §6.2, M19 §1) |
| 17 | Audio fidelity | Note block pitch = 2 octaves, 25 notes | N/A | Microphone calibration = ICC profiling for pressure waves; THD+N = deltaE (M16 §1) |
| 18 | Serialization codec | NBT (self-describing, 15K ns decode) | FlatBuffers/Protobuf/MessagePack | Codec choice = parse frequency response; zero-copy = flat passband (M17 §1) |
| 19 | Backup | /backup folder, manual | RBD snapshot + BorgBackup + CDP journal | 3-2-1-1-0 rule; backup is temporal redundancy as erasure coding is spatial redundancy (M19) |
| 20 | Authentication | Minecraft login (one-shot Mojang auth) | JWT 15-min TTL via Velocity/Keystone | Auth frequency = security sampling rate; continuous auth = CDP for identity (M20 §5) |
| 21 | Federation | Realms (Mojang-hosted, proprietary) | DoltHub merge / DTN bundle protocol | Federation = frequency-domain bridging across sovereign boundaries (M19 §6, M18 §6) |
| 22 | Zero trust | N/A (trust-everyone model) | NIST 800-207 / 4-zone segmentation | Never trust = verify at every frequency; each zone boundary is a bandpass filter (M20 §3) |

### 3.3 What the Extension Shows

The original 10-row isomorphism (rows 1-10) established structural correspondence. Rows 11-22 extend it into signal fidelity — every signal-processing decision in the v3 modules has a counterpart in both the Minecraft and Ceph domains. The isomorphism is no longer just about container shapes. It is about the encoding decisions that determine what survives inside those containers.

Three observations:

**First**, the Minecraft column has "N/A" entries in rows 14, 17, and 22 because vanilla Minecraft does not implement those capabilities. These are gaps in the Minecraft architecture that the VAV system fills by layering Ceph infrastructure underneath. Minecraft trusts everyone; VAV verifies continuously. Minecraft has no erasure coding; Ceph provides it. Minecraft has no audio fidelity pipeline; the VAV architecture maps one through note block semantics.

**Second**, every row in the "Signal Fidelity Layer" column references a specific v3 module section. The v3 pass did not add decorative metadata to the isomorphism — it filled in the signal-processing mathematics that explain *why* the structural correspondence works.

**Third**, the table can be read vertically as well as horizontally. Reading down the "Signal Fidelity Layer" column reveals a single thread: sampling theory, applied at every scale, from photosites to federation protocols. The mathematics is the same. The domain changes. The Nyquist theorem does not care.

---

## 4. Cross-Module Integration Map

### 4.1 The Four Integration Chains

The seven v3 modules (M14-M20) are not independent studies. They connect through four integration chains that run across module boundaries, each carrying a shared mathematical or architectural thread.

#### Chain 1: FFT / STFT Shared Theory

```
M14 (Temporal Imaging)
  Per-channel FFT of color images (§5.1)
  JPEG DCT as frequency budgeting (§5.3)
  Palette cardinality as spatial entropy (§5.4)
    │
    ▼
M15 (Color Fidelity)
  Color space as spectral bandwidth decision (§2.3)
  Per-channel decomposition of spectral response (§1.2)
  ICC profile as frequency-domain device contract (§3)
    │
    ▼
M16 (Audio Fidelity)
  STFT = windowed FFT applied to audio time series (§4)
  Spectral repair via notch filtering and interpolation (§4.3)
  Wiener filter as optimal frequency-domain denoiser (§4.2)
    │
    ▼
M17 (Serialization / HPC)
  OFDM in DSL: per-subcarrier QAM = adaptive bit loading (via M18 §2.2)
  Each DSL sub-carrier is an independent frequency bin (§2, via M18)
  Serialization format = spatial-domain codec (as FFT is frequency-domain)
```

The shared theory: the Fourier transform decomposes signals into independent frequency components. Whether the signal is a 2D image (FFT), a time-varying audio waveform (STFT), a spectral power distribution (color science), or a wideband copper channel (OFDM), the decomposition is the same operation. Each component can be independently processed — preserved, attenuated, quantized, or discarded. The engineering decision at every layer is: which components carry signal, and which carry noise?

#### Chain 2: Error Correction

```
M17 (Serialization / HPC)
  Hamming codes: 1-bit correction in ECC RAM (§2.2)
  Reed-Solomon: burst correction over GF(2^8) (§2.3)
  CRC-32C: detection at RADOS object level (§2.6)
  LDPC: near-Shannon-limit on 10GbE copper (§2.4)
    │
    ▼
M18 (Transport Taxonomy)
  DSL/DOCSIS: RS outer code + LDPC/Turbo inner code (§2, §3)
  OFDM: per-subcarrier FEC adapts to channel SNR (§2.2)
  Ethernet: CRC-32 FCS at frame level (§4.4, via M17)
    │
    ▼
M19 (Backup & Federation)
  Ceph erasure pools: RS(k, m) across OSDs (§1, via M17 §2.3)
  BorgBackup: HMAC-SHA256 integrity on dedup blocks (§3)
  RBD snapshot delta: CRC-32C on export-diff chain (§2)
    │
    ▼
M18 (Sneakernet)
  Custody chain: cryptographic handoff at each hop (§6.4)
  Bundle FEC: RS(255, 223) protects physical media transit (§6.4)
  Bit rot defense during multi-day transit (§6.4)
```

The shared theory: every medium introduces errors. The only variable is the error model (random bit flips vs. burst corruption vs. total segment loss). The correction strategy escalates from Hamming (1-bit) through Reed-Solomon (t-symbol burst) to erasure coding (k-of-n reconstruction) to custody chains (human-verified handoff). Each level adds redundancy — and redundancy is the storage-domain equivalent of temporal oversampling in the capture domain. Oversampling preserves the signal across noise. Redundancy preserves the data across failures.

#### Chain 3: Zero Trust

```
M20 (Zero Trust / Firewall)
  NIST 800-207: never trust, always verify (§1)
  CISA 5-pillar maturity model (§4.3)
  Continuous authentication via JWT 15-min TTL (§5)
  4-zone network segmentation (§3.2)
    │
    ▼
M19 (Backup & Federation)
  Federation auth: bilateral VPN + signed object exchange (§7)
  Cross-domain bridging requires explicit trust establishment (§7)
  BorgBackup authenticated encryption (§3, §5)
    │
    ▼
M18 (Transport / Sneakernet)
  Sneakernet custody chain: physical zero trust (§6.4)
  Each handoff = re-authentication of custodian (§6.4)
  DTN bundle protocol: custody transfer is the PEP for physical transport (§6.4)
```

The shared theory: trust is not transitive. It must be verified at every boundary. A player authenticated 16 minutes ago is not authenticated now (M20). A backup drive received from a courier must be checksummed before import (M19). A DTN bundle handed off between custodians must be signed and acknowledged at each transfer (M18). Each boundary is a Policy Enforcement Point — and the PEP is a bandpass filter that allows authorized signals through and rejects unauthorized ones. Security is frequency-domain filtering applied to the identity channel.

#### Chain 4: Ceph Chunk Key Schema

```
M14 (Temporal Imaging)
  Morton code interleaving: block (x,y,z) → Morton index M (§6.4)
  Morton prefix depth = spatial frequency hierarchy
  Low-order bits = high spatial frequency (local)
  High-order bits = low spatial frequency (regional)
    │
    ▼
M17 (Serialization / HPC)
  FlatBuffers schema: ChunkSection table with palette + packed block_states (§1.7)
  Zero-copy access to packed long arrays via memory-mapped RADOS objects
  Schema evolution: new fields added at end, forward-compatible (§6.3)
    │
    ▼
M19 (Backup & Federation)
  Backup unit = RADOS object = region file = FlatBuffers-cached chunk data
  RBD snapshot delta exports operate on the same object granularity
  BorgBackup deduplication aligns with chunk-level content addressing
```

The shared theory: the chunk is the atomic unit of the VAV architecture — the quantum of storage, the grain of the frequency hierarchy, the record in the serialization schema, and the unit of backup. Morton code addressing ensures that spatially local chunks map to the same placement group, which means spatially local data is stored on the same OSD, which means cache locality in the RAG pipeline aligns with storage locality in CRUSH. The FlatBuffers schema preserves this alignment at the codec level. The backup system preserves it at the snapshot level.

### 4.2 Integration Dependency Diagram

```
                    ┌──────────────────────┐
                    │  M14: Temporal/FFT    │
                    │  Nyquist, palette     │
                    │  entropy, Morton code │
                    └───┬──────────┬────────┘
                        │          │
           ┌────────────┘          └────────────┐
           ▼                                    ▼
  ┌─────────────────┐                  ┌─────────────────┐
  │ M15: Color       │                  │ M16: Audio       │
  │ ICC, gamut, DNG  │                  │ STFT, spectral   │
  │ spectral fidelity│                  │ repair, ADC      │
  └────────┬─────────┘                  └────────┬─────────┘
           │                                     │
           └──────────┬──────────────────────────┘
                      │ (shared: calibration as
                      │  device-specific frequency
                      │  response correction)
                      ▼
             ┌─────────────────┐
             │ M17: Serialize   │
             │ FEC, codec perf  │
             │ FlatBuffers/RS   │
             └───┬─────────┬───┘
                 │         │
        ┌────────┘         └────────┐
        ▼                           ▼
  ┌──────────────┐          ┌──────────────┐
  │ M18: Transport│          │ M19: Backup   │
  │ DSL/DOCSIS FEC│          │ Erasure, Borg  │
  │ Sneakernet DTN│          │ Federation     │
  └──────┬───────┘          └──────┬────────┘
         │                         │
         └───────────┬─────────────┘
                     ▼
             ┌──────────────┐
             │ M20: Zero     │
             │ Trust/Firewall│
             │ Auth frequency│
             └──────────────┘
                     │
                     ▼
             ┌──────────────┐
             │ M21: This     │
             │ Synthesis     │
             └──────────────┘
```

M14 is the theoretical root — it introduces the Nyquist theorem, Fourier decomposition, and the palette-as-frequency-budget formalization that the entire v3 pass builds on. M15 and M16 apply FFT theory to two specific sensory domains (vision and hearing). M17 maps error correction codes to the storage layer. M18 and M19 extend error correction and custody to transport and backup. M20 applies the "verify at every boundary" principle to identity and access control. M21 unifies.

---

## 5. The Transport Matrix: Bandwidth x Latency Pareto Front

### 5.1 Consolidated Transport Reference

This table consolidates M18's transport taxonomy into a single reference, including the seed-space distance dimension from M9. Seed-space distance measures the structural similarity between two voxel worlds — worlds generated from similar seeds share more content and require less data to synchronize.

| Technology | Bandwidth | Latency (RTT) | BER | Connectivity | Sync Efficiency (high seed-space distance) | Sync Efficiency (low seed-space distance) | Best VAV Use Case |
|---|---|---|---|---|---|---|---|
| Acoustic modem | 1-10 kbps | 10-100 ms | ~10^-3 | P2P, air-gap | Heartbeat only | Heartbeat only | Emergency federation heartbeat |
| V.90 dial-up | 33.6-56 kbps | 100-200 ms | ~10^-5 | P2P, POTS | Seed + metadata in minutes | Seed + metadata in minutes | Rural fallback, legacy |
| ADSL | 1-8 Mbps | 20-50 ms | ~10^-7 | Dedicated pair | Hours for full world | Hours for full world | Residential async replication |
| VDSL2 | 50-100 Mbps | 10-30 ms | ~10^-7 | Short loop | 30-60 min for full world | Similar | Near-DSLAM residential |
| G.fast | 500 Mbps-1 Gbps | 5-15 ms | ~10^-7 | Very short | 5-10 min for full world | Similar | FTTdp last segment |
| DOCSIS 3.1 | 1-10 Gbps | 10-30 ms | ~10^-7 | Shared coax | Minutes for full world | Similar | Shared residential |
| GPON | 2.5 Gbps | 1-5 ms | ~10^-12 | Passive optical | Minutes | Similar | Fiber-to-home, SLA-backed |
| XGS-PON | 10 Gbps | 1-5 ms | ~10^-12 | Passive optical | Under 1 min | Similar | Symmetric fiber replication |
| 25GbE | 25 Gbps | <1 ms | ~10^-12 | DC P2P | Seconds | Seconds | Server-to-ToR |
| 100GbE | 100 Gbps | <0.5 ms | ~10^-12 | DC P2P | Sub-second | Sub-second | Ceph OSD-to-OSD |
| 400GbE | 400 Gbps | <0.5 ms | ~10^-12 | DC P2P | Sub-second | Sub-second | Spine-leaf, next-gen Ceph |
| IB HDR | 200 Gbps | ~1 us | ~10^-15 | HPC P2P | Sub-second, RDMA | Sub-second, RDMA | Ceph OSD RDMA fabric |
| IB NDR | 400 Gbps | ~1 us | ~10^-15 | HPC P2P | Sub-second, RDMA | Sub-second, RDMA | Next-gen Ceph, AI/HPC |
| DWDM (per lambda) | 100-400 Gbps | 5 ms/1000km | ~10^-15 | Long-haul P2P | Seconds at metro scale | Seconds | Inter-DC backbone |
| DWDM (aggregate) | 10-100 Tbps | 5 ms/1000km | ~10^-15 | Long-haul P2P | Sub-second at any scale | Sub-second | Continental backbone |
| IPoAC (pigeon) | ~2.67 Gbps | 3000-6000 s | ~0.55 loss | P2P, LOS | Impractical (loss rate) | Impractical | Proof of carrier independence |
| Sneakernet (walk) | 266.7 Gbps | 60 s | N/A offline | P2P, physical | Near-instant for full world | Near-instant | Office-scale bulk |
| Sneakernet (drive) | 177.8 Gbps | 3600 s | N/A offline | P2P, physical | Full world in transit time | Full world | Metro-scale cold bulk |
| Sneakernet (FedEx) | 11.1 Tbps | 14,400-86,400 s | N/A offline | P2P, physical | Full cluster in transit time | Full cluster | Continental bulk migration |
| Sneakernet mesh (DTN) | TB/hour/hop | hours-days | Medium (FEC) | Multi-hop S&F | Per-hop, per-bundle | Per-hop | Offline federation, DR |

### 5.2 Seed-Space Distance and Sync Efficiency

Two worlds generated from the same seed share identical terrain, biome distribution, and structure placement. The only differences are player-made changes. Synchronization between such worlds requires transmitting only the delta — the block changes since generation. For worlds with no player modifications, the delta is zero. Seed-space distance (M9) quantifies how far apart two worlds are in the generative parameter space:

- **Distance 0:** Same seed, same version. Delta = player changes only. Sync cost proportional to player activity, not world size.
- **Distance small:** Similar seeds (adjacent in LCG sequence). Terrain is correlated but not identical. Delta includes terrain differences plus player changes.
- **Distance large:** Unrelated seeds. Terrain is uncorrelated. Full world transfer required.

This adds a third axis to the Pareto front: transport selection depends not only on bandwidth and latency but on the information-theoretic distance between the source and destination worlds. A seed-space-aware federation protocol can exploit structural correlation to dramatically reduce sync bandwidth — the same principle as video inter-frame compression, where temporal correlation between frames reduces per-frame data. In the voxel world, generative correlation between seed-related worlds reduces per-sync data.

### 5.3 The Pareto Front

```
Bandwidth                                              ← Physical media dominates
(log scale)
  10T ┤                                                        FedEx sneakernet ●
      │
  1T  ┤                                              DWDM aggregate ●
      │
 100G ┤                                 400GbE ●              ● Drive sneakernet
      │                            IB NDR ●
      │                       100GbE ●
      │                  IB HDR ●
  10G ┤             XGS-PON ●    DOCSIS 3.1 ●       ● IPoAC (pigeon)
      │         GPON ●
   1G ┤     G.fast ●
      │
 100M ┤ VDSL2 ●
      │
  10M ┤● ADSL
      │
   1M ┤                                                          ● DTN mesh
      │
 100k ┤● V.90
      │
  10k ┤
      │
   1k ┤● Acoustic modem
      │
      └──┬──────┬──────┬──────┬──────┬──────┬──────┬──────┬──────→
         1 us  10 us 100 us  1 ms  10 ms 100 ms  1 s   1 hr  1 day
                                                              Latency (RTT)

  PARETO FRONT: IB NDR ═══ 400GbE ═══ DWDM ═══ FedEx sneakernet
       ↑                    ↑            ↑              ↑
    Best for             Best for     Best for      Best for
    sub-us latency      DC fabric    long-haul     cold bulk
    + 400 Gbps          + 400 Gbps   + 100 Tbps    at any volume
```

Everything below and to the right of the Pareto front is **dominated** — there exists a transport that is simultaneously better in both bandwidth and latency. Technologies on the front represent regimes where they are the optimal choice for some valid combination of bandwidth need and latency tolerance.

The Pareto front has four regimes:

1. **Sub-microsecond / high bandwidth:** InfiniBand NDR. For Ceph OSD-to-OSD within a rack.
2. **Sub-millisecond / high bandwidth:** 400GbE. For data center spine-leaf fabric.
3. **Millisecond / very high bandwidth:** DWDM. For inter-datacenter backbone.
4. **Hours-to-days / extreme bandwidth:** Physical media. For bulk migration and disaster recovery.

The gap between regime 3 and regime 4 — between DWDM and FedEx — is the sneakernet window. Any data volume above the crossover point (V* = B_net * T_snk) is cheaper and faster to ship physically. M18 §6.3 derived the crossover: on 100GbE, it is 45 TB. Below that, use the wire. Above that, use the drive.

---

## 6. The Sneakernet Mesh Protocol Specification

### 6.1 Context

M18 §6.4 proposed a structured sneakernet mesh protocol built on the IETF Bundle Protocol (BPv7, RFC 9171). This section consolidates the specification into a reference-grade outline. The protocol treats physical media transport as a delay-tolerant network, enabling offline federation of sovereign voxel worlds when electronic connectivity is intermittent, unavailable, or deliberately air-gapped.

### 6.2 Protocol Stack

```
┌───────────────────────────────────────┐
│ Layer 4: Application                   │
│   Payload: RBD snapshot delta           │
│   (rbd export-diff output)             │
│   Metadata: world UUID, seed, version  │
│   Integrity: SHA-256 over payload      │
├───────────────────────────────────────┤
│ Layer 3: Bundle Protocol (BPv7)        │
│   Source EID:     dtn://world-alpha     │
│   Destination EID: dtn://world-beta    │
│   Lifetime:       configurable (7d)    │
│   Fragmentation:  per-drive capacity   │
│   Custody:        requested            │
├───────────────────────────────────────┤
│ Layer 2: Convergence Layer Adapter     │
│   Filesystem CLA: write bundles to     │
│   ext4/NTFS/APFS on physical media    │
│   Naming: {bundle-id}.bundle           │
│   Manifest: manifest.json per drive    │
├───────────────────────────────────────┤
│ Layer 1: Physical Transport            │
│   Medium: USB SSD, HDD, microSD, LTO  │
│   Carrier: human, courier, postal      │
│   Custody: signed handoff per hop      │
└───────────────────────────────────────┘
```

### 6.3 Bundle Format

Each bundle contains:

| Field | Size | Content |
|-------|------|---------|
| Primary block | ~120 bytes | Source EID, destination EID, creation timestamp, lifetime, flags |
| Payload block | Variable | RBD snapshot delta (rbd export-diff binary), world metadata |
| Integrity block | 32 bytes | SHA-256 over payload |
| FEC extension | ~14.3% overhead | Reed-Solomon (255, 223) parity blocks — protects against bit rot during multi-day physical transit |
| Custody extension | ~80 bytes | Current custodian EID, custody signal type, previous custodian chain |

### 6.4 Custody Transfer Protocol

```
Origin                Courier               Destination
  │                      │                       │
  │── Bundle on SSD ──→  │                       │
  │── Custody offer ──→  │                       │
  │                      │                       │
  │  ← Custody ACK ─────│                       │
  │  (signed, timestamped,                       │
  │   SHA-256 of bundle)                         │
  │                      │                       │
  │  [Origin retains copy│                       │
  │   until delivery     │                       │
  │   confirmed]         │                       │
  │                      │── Physical transit ──→ │
  │                      │                       │
  │                      │── Bundle on SSD ──→   │
  │                      │── Custody offer ──→   │
  │                      │                       │
  │                      │  ← Custody ACK ──────│
  │                      │  (Destination now     │
  │                      │   custodian)          │
  │                      │                       │
  │  ← Delivery report ─────────────────────────│
  │  (Origin may now     │                       │
  │   purge its copy)    │                       │
```

At every handoff, exactly one entity holds custody. If the bundle is lost in transit, the current custodian is responsible for retransmission from their stored copy. The custody chain is the zero trust model applied to physical transport — every handoff is an authentication event, every custodian is a PEP, and no bundle moves without a signed acknowledgment.

### 6.5 Operational Scenarios

| Scenario | Transit Time | Payload | Effective Bandwidth | Use Case |
|----------|-------------|---------|---------------------|----------|
| Office walk (60 s, 2 TB SSD) | 60 s | Single world delta | 266.7 Gbps | Dev-to-test promotion |
| Metro drive (1 hr, 4x 20 TB HDD) | 3600 s | Full cluster backup | 177.8 Gbps | Monthly offsite rotation |
| FedEx overnight (16 hr, 10K x 2 TB) | 57,600 s | Multi-petabyte migration | 2.78 Tbps | Cloud migration, DR seed |
| Antarctic resupply (quarterly) | ~90 days | Full world + deltas | ~2.6 Mbps effective | Remote education server |
| Interplanetary (Mars orbit) | 4-24 min one-way | Science telemetry | N/A (store-and-forward) | IPN reference architecture |

### 6.6 Why This Matters

The sneakernet mesh protocol is not a joke or a thought experiment. It is a genuine architectural contribution for three reasons:

**First**, it solves a real problem. Air-gapped networks, disaster recovery scenarios, and remote installations without broadband all need a structured way to move large datasets physically. The Bundle Protocol provides the framing, custody, integrity, and FEC that turn an ad hoc "copy files to a USB drive" operation into a protocol with delivery guarantees.

**Second**, it completes the transport taxonomy. The Pareto front (Section 5) shows that physical media dominates the high-bandwidth / high-latency regime. Without a protocol for physical transport, the VAV federation architecture has a gap in its transport options — it can replicate over any electronic medium but has no structured mechanism for the physical medium that outperforms all of them for bulk data.

**Third**, it bridges to the zero trust architecture (M20). Custody transfer is physical zero trust. Every handoff is verified. Every custodian is accountable. The signed custody chain is an audit trail that provides the same forensic capability for physical transport that session logs provide for electronic transport.

---

## 7. Through-Line

### 7.1 Three Passes, One Architecture

The three passes of the VAV research atlas are not three separate architectures. They are three frequency bands of a single signal.

**v1 mapped the territory.** The structural isomorphism between Minecraft/Anvil and Ceph/RADOS — coordinate-keyed, chunked, compressed, typed storage — established that the two systems share the same geometry. The voxel world is not a wrapper around a storage system; it is a structurally compatible container that adds spatial navigability to what would otherwise be opaque byte arrays. The core insight: the Minecraft region file IS a valid RADOS object because it shares the same architectural properties. v1 was the DC component — the baseline that everything else modulates on top of.

**v2 defined sovereignty.** The Keystone project isolation, CephX keyrings, LUKS encryption, Neutron security groups, and multi-server fabric established that each world is a sovereign domain with its own identity boundary, its own storage namespace, its own network segment, and its own encryption keys. Nobody sees another world's data without explicit bilateral agreement. v2 was the mid-frequency band — the organizational structures that change when worlds are created, merged, federated, or decommissioned.

**v3 defined fidelity.** The seven modules of the signal fidelity pass (M14-M20) established that every boundary crossing in the VAV stack — from photon to sensor, from sensor to working space, from working space to palette, from palette to wire format, from wire to transport, from transport to backup, from backup to federation — is a frequency-domain decision about what to preserve. The Nyquist theorem constrains what can be faithfully represented. The Shannon limit constrains how much can be moved through a channel. The error correction hierarchy constrains how much corruption can be survived. The zero trust model constrains how much trust can be assumed. v3 was the high-frequency band — the dynamic encoding decisions that happen on every frame, every packet, every authentication cycle.

### 7.2 The Signal Is Not the Content

A photograph is not the scene it depicts. It is a record of the photons that happened to arrive at the sensor during the exposure window, filtered through the lens's optical transfer function, quantized by the sensor's bit depth, compressed by the file format's frequency budget, and displayed on a monitor whose gamut may not contain the colors the scene actually had. The photograph is faithful to the extent that the pipeline preserved the frequencies that matter for the intended use. A surveillance camera and an art photographer capture the same scene but make different fidelity decisions — different shutter speeds, different color spaces, different compression levels — because they are preserving different frequency bands for different purposes.

A Minecraft world is not the knowledge it encodes. It is a record of the block states that were placed during the encoding process, filtered through the palette's vocabulary, quantized by the bits-per-entry calculation, compressed by Anvil's zlib layer, and transmitted over whatever transport the player's connection provides. The world is faithful to the extent that the pipeline preserved the semantic frequencies that matter for the intended retrieval.

A backup is not the data it protects. It is a temporal sample of the data at the instant the snapshot was taken, with everything between snapshots lost to the temporal box filter. The backup is faithful to the extent that the snapshot interval was sufficient to capture the change frequencies that matter for the intended recovery scenario.

An authentication token is not the identity it represents. It is a temporal assertion that the identity was valid at the moment the token was issued, with the assertion degrading as the token ages. The token is faithful to the extent that its TTL is short enough to detect revocations before they matter.

### 7.3 The Fidelity Equation

Every layer of the VAV stack implements the same equation:

```
Fidelity = Preserved Signal / (Preserved Signal + Lost Signal + Added Noise)
```

Where:

- **Preserved Signal** is the frequency content that survives the encoding, transport, storage, and reconstruction pipeline.
- **Lost Signal** is the frequency content that was above the Nyquist limit, outside the gamut, beyond the error correction capability, or between the sampling intervals.
- **Added Noise** is the quantization error, the compression artifacts, the bit rot, the aliasing, the unauthorized access, the custody chain breaks.

Maximizing fidelity means: sample fast enough (Nyquist), quantize deep enough (dynamic range), correct enough errors (redundancy), verify often enough (auth), and accept that every "enough" has a cost in storage, bandwidth, compute, or user friction. The engineering is choosing which costs are acceptable for which signals. The art is knowing which signals matter.

### 7.4 Closing

The signal is not the content. The signal is the decision about what to preserve across the lossy channel of time. Everything else is noise waiting to be named.

v1 named the structure. v2 named the owners. v3 named the signals.

The architecture holds. The isomorphism extends. The mathematics unifies.

---

## 8. Sources

References from constituent modules are cited inline as module/section cross-references. The following are sources specific to this synthesis document:

| # | Reference |
|---|-----------|
| 1 | Shannon, C.E. (1948). "A Mathematical Theory of Communication." *Bell System Technical Journal*, 27(3), 379-423. |
| 2 | Nyquist, H. (1928). "Certain topics in telegraph transmission theory." *Transactions of the AIEE*, 47(2), 617-644. |
| 3 | International Color Consortium. "ICC Profile Specification (ICC.1:2022)." https://color.org/specification/ICC.1-2022-05.pdf |
| 4 | NIST. "SP 800-207: Zero Trust Architecture." csrc.nist.gov/publications/detail/sp/800-207/final (August 2020). |
| 5 | Scott, K. and Burleigh, S. "Bundle Protocol Version 7." RFC 9171, IETF (January 2022). |
| 6 | Google. "FlatBuffers: Benchmarks." google.github.io/flatbuffers/flatbuffers_benchmarks.html |
| 7 | Weil, S., et al. "Ceph: A Scalable, High-Performance Distributed File System." *OSDI '06*, 2006. |
| 8 | Ben-Ezra, M., et al. (2024). "Temporal Super-Resolution Using a Multi-Channel Illumination Source." *Sensors*, 24(3), 857. |
| 9 | Viotti, P., et al. "An Empirical Study of Serialization Protocols for IoT." arXiv:2407.13494, 2024. |
| 10 | Tanenbaum, A.S. *Computer Networks*, 5th ed. Pearson, 2011. |

---

*Cross-module synthesis for Voxel as Vessel v3 — Signal Fidelity. Seven modules (M14-M20) unified through frequency-domain analysis. The isomorphism extends from 10 rows (v1) to 22 rows (v3). Four integration chains connect the modules. The Pareto front identifies optimal transport for every bandwidth-latency regime. The sneakernet mesh protocol completes the federation transport taxonomy. Fidelity is the art of choosing what to preserve across the lossy channel of time.*
