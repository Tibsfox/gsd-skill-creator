# M18: Transport Layer Taxonomy: From Modems to IPoAC

**Module 18 of the Voxel as Vessel research atlas.**
Every byte of voxel data that moves between a Ceph cluster and a player's screen traverses a physical transport layer. That layer might be copper twisted pair carrying QAM-modulated symbols at 33.6 kbps, or a single-mode fiber carrying 80 DWDM wavelengths at 400 Gbps each, or a homing pigeon carrying a hexadecimal-printed IP datagram secured with duct tape. The TCP/IP model is normatively abstract about the physical layer — and that abstraction is not merely academic. It is the reason a federation of sovereign voxel worlds can replicate data over any medium that can carry bits, including media that carry bits by physically relocating atoms. This module catalogs the full transport taxonomy from acoustic couplers to interplanetary delay-tolerant networks, builds a protocol selection matrix for voxel world federation, and demonstrates that the optimal transport for a given replication task depends not only on bandwidth and latency but on the seed-space distance between source and destination worlds.

---

## 1. Analog Modems and the POTS Stack

### 1.1 The Voice-Grade Channel

The Public Switched Telephone Network (PSTN) was designed to carry human voice. Its fundamental constraint is the voice-grade channel: a 300-3400 Hz passband, bandlimited by the hybrid transformer at the central office and the loading coils on long copper loops. Every analog modem in history operated within this 3.1 kHz window. The Shannon-Hartley theorem sets the ceiling:

```
C = B * log2(1 + S/N)

Where:
  C = channel capacity (bits/second)
  B = bandwidth (Hz) = 3100 Hz for voice-grade POTS
  S/N = signal-to-noise ratio (linear)

For typical POTS line SNR of ~35 dB (S/N = 3162):
  C = 3100 * log2(1 + 3162)
  C = 3100 * 11.63
  C ≈ 36,000 bps

This is the theoretical maximum. V.34 achieved 33.6 kbps — within
92% of the Shannon limit on a voice-grade channel. The engineering
was essentially complete. There was no more capacity to extract
from the 300-3400 Hz passband at achievable SNR.
```

### 1.2 Acoustic Couplers (1960s)

The earliest data modems did not connect electrically to the telephone network at all. AT&T's monopoly on telephone equipment (the Carterfone era, pre-1968 FCC ruling) meant third-party devices could not physically attach to the network. The acoustic coupler solved this by placing rubber cups over the telephone handset's earpiece and mouthpiece, converting between electrical signals and acoustic vibrations through air.

```
┌─────────────────────────────────────────────────────┐
│  Acoustic Coupler (ca. 1965)                        │
│                                                     │
│  Terminal ──→ [Modem Circuit] ──→ Speaker            │
│                                      ↓               │
│                              ┌──────────────┐        │
│                              │  Rubber Cup  │        │
│                              │  ┌────────┐  │        │
│                              │  │Handset │  │        │
│                              │  │Mouthpce│  │        │
│                              │  └────────┘  │        │
│                              └──────────────┘        │
│                                      ↓               │
│                              PSTN voice channel       │
│                                      ↓               │
│                              ┌──────────────┐        │
│                              │  Rubber Cup  │        │
│                              │  ┌────────┐  │        │
│                              │  │Handset │  │        │
│                              │  │Earpiece│  │        │
│                              │  └────────┘  │        │
│                              └──────────────┘        │
│                                      ↓               │
│  [Modem Circuit] ──→ Terminal (remote)               │
└─────────────────────────────────────────────────────┘

Signal path: Digital → Electrical → Acoustic → Telephone →
  PSTN (analog) → Telephone → Acoustic → Electrical → Digital

Loss budget: ~6 dB acoustic coupling loss + 3 dB ambient noise
  margin → effective SNR reduced by ~9 dB vs. direct electrical
  connection → maximum practical rate: 300 baud
```

The acoustic coupling loss was the dominant bottleneck. Every decibel lost in the air gap between speaker and rubber cup was a decibel subtracted from the signal-to-noise ratio. At 300 baud FSK (frequency-shift keying), the system had enough margin to function reliably. Higher rates were impractical until the Carterfone decision (1968) and subsequent FCC Part 68 rules allowed direct electrical connection via RJ-11 jacks.

### 1.3 The Bell Modem Lineage

| Standard | Year | Rate | Modulation | Key Innovation |
|----------|------|------|------------|----------------|
| Bell 103 | 1962 | 300 baud | FSK (originate: 1070/1270 Hz, answer: 2025/2225 Hz) | Full duplex over voice channel |
| Bell 212A | 1980 | 1200 bps | DPSK (4-phase) | First phase-shift keying on POTS |
| V.22bis | 1984 | 2400 bps | QAM-16 | ITU standardization; 4 bits/symbol |
| V.32 | 1988 | 9600 bps | QAM-32 + trellis coding | Echo cancellation enabled full duplex at >2400 baud |
| V.32bis | 1991 | 14,400 bps | QAM-128 + trellis | Adaptive rate negotiation (fallback to 12,000/9600) |
| V.34 | 1994 | 28,800-33,600 bps | QAM-1664 | Line probing; precoding; 92% Shannon limit |
| V.90 | 1998 | 56,000/33,600 bps | PCM downstream / V.34 upstream | Exploited digital CO backbone |
| V.92 | 2000 | 56,000/48,000 bps | PCM downstream / PCM upstream | Quick connect; modem-on-hold |

### 1.4 The V.90 Insight: The Network Was Already Digital

V.90 is the most architecturally significant modem standard because it recognized a fact about the network topology that had been true for over a decade but unexploited:

```
V.34 model (symmetric analog):

  [User Modem] ─analog─ [CO A/D] ─digital─ [CO D/A] ─analog─ [ISP Modem]
                                    PSTN
  Both directions: analog → digital → analog → modem demodulation
  Maximum: ~33.6 kbps (Shannon-limited by two A/D conversions)


V.90 model (asymmetric digital/analog):

  [ISP Digital] ─digital─ [CO D/A] ─analog─ [User Modem]
                             ↑
                     Only ONE D/A conversion
                     on downstream path

  Downstream: ISP injects digital PCM directly into PSTN switch fabric.
  CO performs only D/A conversion. No A/D on this path.
  User modem receives analog signal that was digitized exactly once.

  Maximum: 8000 samples/sec × 8 bits/sample = 64 kbps (mu-law PCM rate)
  Minus: 8 kbps reserved for signaling/framing overhead
  Result: 56 kbps downstream theoretical maximum
  FCC power spectral density limit: enforced 53.3 kbps practical ceiling
```

The insight was not about the modem — it was about the network. The PSTN backbone had been digital since the deployment of T1 carrier systems in the 1960s and SS7 signaling in the 1980s. The only analog segments were the local loops — the copper pairs from the central office to the subscriber. V.90 recognized that when the ISP connected digitally to the CO (via T1/PRI), the downstream path had only one analog conversion instead of two. This halved the quantization noise and raised the Shannon limit.

This is directly relevant to voxel world federation: the transport layer between two Ceph clusters may traverse multiple encoding boundaries. Each encoding boundary introduces quantization loss (or latency, or error probability). Minimizing the number of encoding transitions — not just maximizing raw bandwidth — is a design principle that V.90 discovered for voice-grade copper and that applies equally to any multi-hop replication path.

### 1.5 Acoustic Modems: The Revival

Software-defined acoustic modems represent a return to the pre-Carterfone model, but with modern signal processing. Instead of rubber cups on a telephone handset, a laptop speaker and microphone serve as transducer and receiver. The modulation is OFDM (Orthogonal Frequency Division Multiplexing) across the 0-8 kHz acoustic band audible to standard microphone hardware.

| Implementation | Band | Rate | Use Case |
|----------------|------|------|----------|
| ggwave (Georgi Gerganov) | 0-8 kHz, OFDM | 1-10 kbps | Air-gap data transfer, IoT provisioning |
| quiet-js | 0-19 kHz (ultrasonic available) | 2-8 kbps | Browser-to-browser over audio |
| AirHopper (Ben-Gurion Univ.) | FM radio emanations from GPU | 13-60 bps | Air-gap exfiltration (security research) |
| Fansmitter (Ben-Gurion Univ.) | Fan speed modulation | 3-15 bps | Air-gap exfiltration via acoustic |

Applications to voxel federation: acoustic modems could serve as emergency fallback for federation heartbeat signals in environments where all electronic networking is unavailable — a scenario that sounds absurd until you consider disaster recovery, field deployments, or demonstrations at conferences with locked-down WiFi. A 1 kbps acoustic channel can carry a seed-space distance vector (128 bytes) in approximately one second — enough to initiate a sneakernet replication handshake.

---

## 2. DSL (Digital Subscriber Line)

### 2.1 Above the Voice Band

DSL exploits the frequency spectrum above the voice-grade channel on the same copper local loop. Where POTS uses 0-4 kHz, ADSL uses 25 kHz to 1.1 MHz. A splitter at the subscriber premises separates voice (low-pass) from data (high-pass), allowing simultaneous telephone calls and data.

```
Frequency allocation on copper local loop:

  0 Hz        4 kHz      25 kHz                           1.1 MHz
  |            |           |                                 |
  |   POTS     |  guard    |         ADSL data               |
  |  (voice)   |  band     |    256 DMT sub-carriers         |
  |            |           |    4.3 kHz each                 |
  |────────────|───────────|─────────────────────────────────|
  | 300-3400Hz | unused    | upstream: 25-138 kHz (32 carr.) |
  |            |           | downstream: 138 kHz-1.1 MHz     |
  |            |           |            (224 carriers)        |
```

### 2.2 DMT and Adaptive Bit Loading

Discrete MultiTone (DMT) modulation divides the available spectrum into narrowband sub-carriers, each independently modulated with QAM at a level determined by the measured SNR on that sub-carrier. This is the key innovation: instead of treating the channel as a single wideband pipe, DMT treats it as 256 independent narrowband channels and optimizes each one.

```
Adaptive bit loading per sub-carrier:

  SNR (dB)   │
  40 ─────── │            ▓▓▓▓                               ← 15 bits/carrier
  35 ─────── │          ▓▓▓▓▓▓▓▓                             ← 12 bits/carrier
  30 ─────── │        ▓▓▓▓▓▓▓▓▓▓▓▓                          ← 10 bits/carrier
  25 ─────── │      ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓                        ← 8 bits/carrier
  20 ─────── │    ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓                      ← 6 bits/carrier
  15 ─────── │  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓                    ← 4 bits/carrier
  10 ─────── │▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓                  ← 2 bits/carrier
   0 ─────── │░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░    ← 0 (disabled)
             └────────────────────────────────────────────→
              25 kHz            Sub-carrier frequency            1.1 MHz
                           (256 carriers, 4.3 kHz each)

  SNR varies with frequency due to:
  - Copper loop attenuation (increases with frequency and distance)
  - Bridge taps (impedance discontinuities from unused cable stubs)
  - AM radio interference (specific narrowband notches)
  - Crosstalk from adjacent pairs in the same cable bundle
```

Total downstream rate:

```
R = sum over all carriers of (bits_per_carrier × symbol_rate)
  = sum_{k=1}^{256} b_k × 4000 symbols/sec

Where b_k = floor(log2(1 + SNR_k / Gamma))
  Gamma = SNR gap to Shannon capacity (~9.8 dB for 10^-7 BER target)

Example at 3 km loop:
  High-SNR carriers (k < 100): 10-15 bits each → ~5 Mbps
  Mid-SNR carriers (100 < k < 200): 4-8 bits each → ~2.5 Mbps
  Low-SNR carriers (k > 200): 0-2 bits each → ~0.3 Mbps
  Total: ~7.8 Mbps downstream
```

### 2.3 DSL Variants and Rates

| Standard | Year | Downstream | Upstream | Loop Length | Modulation |
|----------|------|-----------|----------|-------------|------------|
| ADSL (G.992.1) | 1999 | 1-8 Mbps | 128-640 kbps | 3-5 km | DMT, 256 carriers |
| ADSL2+ (G.992.5) | 2003 | 24 Mbps | 1 Mbps | 1-3 km | DMT, 512 carriers (2.2 MHz) |
| VDSL2 (G.993.2) | 2006 | 50-100 Mbps | 30-50 Mbps | 0.3-1 km | DMT, 4096 carriers (30 MHz) |
| G.fast (G.9701) | 2014 | 500 Mbps-1 Gbps | 500 Mbps-1 Gbps | 50-250 m | DMT, 212 MHz band |
| MGfast (G.9711) | 2024 | 5-10 Gbps | 5-10 Gbps | 50-100 m | DMT, 848 MHz band |

The trend is clear: each generation trades loop length for bandwidth. G.fast achieves gigabit speeds but only on loops shorter than 250 meters — essentially fiber-to-the-distribution-point (FTTdp) with a copper last segment. MGfast pushes to 10 Gbps on loops under 100 meters. The copper is being driven toward its physical limits; beyond MGfast, the only path forward is fiber to the premises.

### 2.4 OFDM and the FFT Connection

DMT and OFDM are mathematically equivalent — both modulate data onto orthogonal sub-carriers using the Inverse Fast Fourier Transform (IFFT) at the transmitter and FFT at the receiver. The FFT size determines the number of sub-carriers:

```
FFT relationship:
  N-point IFFT → N/2 usable sub-carriers (Nyquist symmetry)
  ADSL:  512-point FFT → 256 sub-carriers
  VDSL2: 8192-point FFT → 4096 sub-carriers
  G.fast: up to 16384-point FFT → 8192 sub-carriers

The same FFT algorithm (Cooley-Tukey, 1965) serves:
  - DSL modems (ADSL through MGfast)
  - DOCSIS cable modems (Section 3)
  - WiFi (802.11a/g/n/ac/ax/be)
  - LTE and 5G NR
  - DAB/DVB digital broadcasting

This convergence is not coincidence. OFDM won because the FFT made
it computationally tractable: O(N log N) vs. O(N²) for direct DFT.
Cooley-Tukey unlocked every modern broadband standard.
```

---

## 3. Cable Modems (DOCSIS)

### 3.1 The Cable Television Plant

Cable television infrastructure was built for one purpose: delivering broadcast video from a headend to subscribers over a tree-and-branch coaxial network. The spectrum allocation (5-1000 MHz for DOCSIS 3.1, extended to 1.8 GHz for DOCSIS 4.0) dwarfs DSL's 1.1 MHz, but the network topology introduces a constraint DSL does not face: the medium is shared.

```
Cable plant topology:

  [Headend/CMTS] ──fiber──→ [Fiber Node] ──coax──→ [Tap] ──→ [CPE]
                                  │                   │
                                  │                   ├──→ [CPE]
                                  │                   ├──→ [CPE]
                                  │                   └──→ [CPE]
                                  │
                                  ├──coax──→ [Tap] ──→ [CPE] ...
                                  └──coax──→ [Tap] ──→ [CPE] ...

  Downstream: broadcast from CMTS to all CPE on the node
    (like a shared Ethernet hub — every modem sees every packet)
  Upstream: TDMA-scheduled from each CPE to CMTS
    (like token ring — modems transmit only in assigned time slots)

  Typical node size: 100-500 homes (HHP: homes passed)
  Downstream spectrum: shared among all active users on the node
  Upstream spectrum: 5-85 MHz (DOCSIS 3.1), divided into time slots
```

### 3.2 DOCSIS 3.1 Specifications

| Parameter | DOCSIS 3.0 | DOCSIS 3.1 | DOCSIS 4.0 (FDD) |
|-----------|-----------|-----------|------------------|
| Downstream spectrum | 54-1002 MHz | 108-1218 MHz | 108-1794 MHz |
| Upstream spectrum | 5-42 MHz | 5-204 MHz | 5-684 MHz |
| Modulation (downstream) | SC-QAM 256 | OFDM QAM-4096 | OFDM QAM-4096 |
| FFT size | N/A (SC-QAM) | 4096 or 8192 | 4096 or 8192 |
| Subcarrier spacing | N/A | 25 or 50 kHz | 25 or 50 kHz |
| Max downstream | 1.2 Gbps (32×38 Mbps) | 10 Gbps | 10 Gbps |
| Max upstream | 240 Mbps | 1 Gbps | 6 Gbps |
| Channel bonding | 32 downstream / 8 upstream | Full spectrum (OFDM) | Full spectrum |

### 3.3 The Shared-Medium Problem

The critical difference between cable and DSL for voxel federation: DSL provides a dedicated copper pair per subscriber (point-to-point), while cable provides a shared coaxial segment per node (point-to-multipoint). This means:

```
DSL bandwidth model:
  Each subscriber gets B_max = f(loop_length, SNR)
  My neighbor's traffic does not affect my throughput
  Guaranteed minimum bandwidth ≈ provisioned rate

Cable bandwidth model:
  Node capacity C_node = f(spectrum, QAM_order)
  N active subscribers share C_node
  Per-subscriber bandwidth B_sub ≈ C_node / N_active

  Example: DOCSIS 3.1 node, 200 homes, 40 concurrent at peak
    C_node = 10 Gbps downstream (theoretical)
    C_actual ≈ 6 Gbps (after overhead, guard bands, impairments)
    B_sub = 6 Gbps / 40 = 150 Mbps per active user at peak

  Contention ratio: C_node / (B_provisioned × N_subscribers)
  Typical ISP: provisions 1 Gbps to 200 homes on a 6 Gbps node
    Contention = 6000 / (1000 × 200) = 0.03 = 30:1 oversubscription
```

Effective bandwidth can collapse below ADSL in congested neighborhoods. A cable modem provisioned at 1 Gbps that delivers 15 Mbps at 9 PM because 150 neighbors are streaming video is a real scenario. For voxel world federation requiring predictable replication throughput, cable's contention model means the transport SLA cannot be guaranteed — unlike dedicated fiber or even DSL.

---

## 4. Fiber Optic (GPON/XGS-PON/DWDM)

### 4.1 Passive Optical Networks

PON (Passive Optical Network) architectures share a fiber between multiple subscribers using an unpowered optical splitter. No active electronics exist between the Optical Line Terminal (OLT) at the central office and the Optical Network Terminal (ONT) at the subscriber premises. This dramatically reduces deployment and maintenance costs compared to active Ethernet fiber.

```
PON architecture:

  [OLT] ──SMF──→ [1:32 Splitter] ──→ [ONT] (Subscriber 1)
                       │
                       ├──→ [ONT] (Subscriber 2)
                       ├──→ [ONT] (Subscriber 3)
                       │     ...
                       └──→ [ONT] (Subscriber 32)

  Downstream: OLT broadcasts on λ_d (1490 nm for GPON, 1577 nm for XGS-PON)
    Every ONT receives all frames; decrypts only its own (AES-128 per ONT)
  Upstream: TDMA — each ONT transmits in an assigned time slot on λ_u
    (1310 nm for GPON, 1270 nm for XGS-PON)
  WDM: downstream and upstream wavelengths coexist on the same fiber

  Splitter is passive glass — no power, no failure modes except physical damage
  Split ratio 1:32 or 1:64 (higher splits = more subscribers per fiber, lower
  per-subscriber bandwidth)
```

### 4.2 PON Standards

| Standard | ITU-T | Year | Downstream | Upstream | Split | Wavelengths |
|----------|-------|------|-----------|----------|-------|-------------|
| GPON | G.984 | 2003 | 2.488 Gbps | 1.244 Gbps | 1:32/1:64 | 1490/1310 nm |
| XG-PON | G.987 | 2010 | 9.953 Gbps | 2.488 Gbps | 1:32/1:64 | 1577/1270 nm |
| XGS-PON | G.9807 | 2016 | 9.953 Gbps | 9.953 Gbps | 1:32/1:64 | 1577/1270 nm |
| NG-PON2 | G.989 | 2015 | 4×10 Gbps | 4×10 Gbps | 1:64/1:256 | TWDM (4 λ pairs) |
| 50G-PON | G.9804 | 2021 | 49.77 Gbps | 12.44/49.77 Gbps | 1:32/1:64 | 1342/1290 nm |

Per-subscriber bandwidth on 1:32 XGS-PON: 9.953 Gbps / 32 = ~311 Mbps guaranteed minimum (if all subscribers active simultaneously). In practice, statistical multiplexing yields 1-5 Gbps per subscriber depending on concurrency — far exceeding cable or DSL.

### 4.3 DWDM: The Backbone

Dense Wavelength Division Multiplexing (DWDM) is the technology that makes the global Internet backbone possible. A single fiber pair carries 80 or more independent wavelength channels, each modulated at 100-400 Gbps, for aggregate capacities exceeding 30 Tbps per fiber pair.

```
DWDM channel plan (ITU-T 100 GHz grid, C-band):

  Wavelength (nm)  Frequency (THz)   Channel
  ──────────────   ───────────────   ───────
  1528.77          196.10            C1
  1529.55          196.00            C2
  1530.33          195.90            C3
    ...              ...             ...
  1560.61          192.10            C40
    ...              ...             ...
  1565.50          191.50            C80

  Each channel: independent 100-400 Gbps link
  Modulation: DP-16QAM (dual-polarization 16-QAM) at 400 Gbps
  Reach: 80-120 km between optical amplifiers (EDFA)
  Aggregate: 80 channels × 400 Gbps = 32 Tbps per fiber pair

  Amplification chain:
  [Tx] ──→ [EDFA] ──80km──→ [EDFA] ──80km──→ ... ──→ [Rx]
            Erbium-Doped      Inline               Pre-
            Fiber Amplifier   amplifier             amplifier

  No optical-electrical-optical conversion at intermediate points.
  The signal stays in the optical domain for thousands of kilometers.
```

For Ceph cluster interconnects across data centers, DWDM provides the bandwidth required for real-time RBD mirroring between geographically separated sites. A single DWDM wavelength (100 Gbps) can sustain continuous replication of approximately 12.5 GB/s — enough to mirror the entire Z0 active zone of a 100-player server (~120 GB) in under 10 seconds.

### 4.4 Latency: The Speed of Light in Glass

Fiber optic latency is fundamentally limited by the speed of light in the medium:

```
Speed of light in vacuum:    c  = 299,792 km/s
Refractive index of SMF:     n  = 1.468
Speed of light in fiber:     v  = c/n = 204,190 km/s
Propagation delay:           d  = 1 / v = 4.9 μs/km

Round-trip time estimates:
  Same data center (100 m):     ~1 μs
  Same city (50 km):            ~0.5 ms
  Cross-country (4,000 km):     ~39 ms
  Trans-Atlantic (6,000 km):    ~59 ms
  Trans-Pacific (11,000 km):    ~108 ms

These are propagation delays only. Add:
  - Router/switch forwarding: 1-10 μs per hop
  - EDFA transit: ~0.1 μs per amplifier
  - Typical 15-20 hops cross-country: +50-200 μs
  - TCP/TLS handshake: 1-2 RTT additional

Total realistic latency:
  Same city: 1-5 ms RTT
  Cross-country: 40-80 ms RTT
  Trans-oceanic: 120-250 ms RTT
```

This sets a hard floor on replication latency for geographically distributed Ceph clusters. No technology can make bits travel faster than c/n in glass. Latency-sensitive federation (Z0 real-time mirroring) must be within the same metropolitan area; cross-continental federation is necessarily asynchronous.

---

## 5. TCP/IP Over Avian Carrier (RFC 1149)

### 5.1 The Standard

RFC 1149, authored by David Waitzman and published on April 1, 1990, formally specifies "A Standard for the Transmission of IP Datagrams on Avian Carriers." It is categorized as an April Fools' RFC — an Informational document not on the IETF standards track. It is also, as we shall demonstrate, a legitimate and instructive contribution to network architecture theory.

The specification:

```
Frame format (RFC 1149, Section 2):

  IP datagram is printed in hexadecimal on a small scroll of paper.
  Scroll is wrapped around one leg of the avian carrier.
  Bandwidth is limited by the leg length.
  MTU: 256 milligrams.

  "The carriers have an intrinsic collision avoidance system,
   which increases availability."

  "Strstrdings in the carrying strout are in the feathers."
  [Note: This quote is garbled in the original RFC; the actual
   text reads: "The IP datagram is printed, on a small scroll
   of paper, in hexadecimal, with each octet separated by
   whitestuff and blackstuff."]

Encapsulation diagram:
  ┌─────────────────────────────┐
  │         IP Header           │  ← 20 bytes minimum
  ├─────────────────────────────┤
  │       TCP/UDP Header        │  ← 20/8 bytes
  ├─────────────────────────────┤
  │         Payload             │  ← Application data
  └─────────────────────────────┘
              ↓
  Printed in hex on paper scroll
              ↓
  ┌─────────────────────────────┐
  │    ┌───────────────────┐    │
  │    │  Avian Carrier     │    │
  │    │  (Columba livia)   │    │
  │    │     ┌─┐            │    │
  │    │     │ │ ← scroll   │    │
  │    │     │ │   (leg)    │    │
  │    │     └─┘            │    │
  │    └───────────────────┘    │
  └─────────────────────────────┘
              ↓
  Physical transport: powered flight
  at 50-80 km/h, range 100-1000+ km
```

### 5.2 QoS Extensions (RFC 2549, 1999)

RFC 2549 extended IPoAC with Quality of Service provisions:

- **Service classes:** Concorde, First, Business, Coach
- **Wstrstrorms:** "Strstrorms can cause data loss."
- **Routing:** Based on GPS and electromagnetic field navigation (pigeons use Earth's magnetic field)
- **Security:** "Strstr"

Actual useful content from RFC 2549:
- **Audit trail:** The carriers produce extensive, if aromatic, logs
- **Privacy:** "Strstr pigeons" (stool pigeons) represent an insider threat
- **MITM attacks:** "Unintentional encapsulation in hawks has been known to occur, with decapsulation being messy and languid"

### 5.3 IPv6 Adaptation (RFC 6214, 2011)

RFC 6214 adapted IPoAC for IPv6, noting that the larger header (40 bytes vs. 20 bytes) impacts the already-limited MTU. The solution: multi-avian carriers with load balancing, requiring a flock coordination protocol.

### 5.4 The Bergen Experiment (April 28, 2001)

The Bergen Linux User Group (BLUG) in Norway conducted the only documented operational implementation of IPoAC. This is real. It happened. The data is published.

```
Bergen IPoAC Experiment Parameters:
  Date:       April 28, 2001
  Location:   Bergen, Norway
  Distance:   ~5 km
  Carrier:    Homing pigeons (Columba livia domestica)
  Protocol:   CPIP (Carrier Pigeon Internet Protocol)
  Packets:    9 transmitted
  Replies:    4 confirmed (ICMP echo reply)

Results:
  Packet loss:     55.5% (5 of 9 packets lost)
  RTT (min):       3,211 seconds (53.5 minutes)
  RTT (max):       6,389 seconds (106.5 minutes)
  RTT (avg):       ~4,800 seconds (80 minutes)
  Throughput:      ~0.08 bps (effective, accounting for loss)

  For comparison:
  - ADSL RTT:      ~30 ms (160,000× faster)
  - V.90 modem:    ~100 ms (48,000× faster)
  - Acoustic coupler: ~200 ms (24,000× faster)

  Causes of packet loss:
  - Carrier distraction (food, other pigeons)
  - Navigation error (Bergen is mountainous)
  - Predation (hawks — the original MITM attack)
  - Carrier refusal to fly (weather, temperament)
```

### 5.5 Analytical Significance: Bandwidth vs. Latency Decoupling

Here is where the humor becomes serious engineering analysis. IPoAC demonstrates a fundamental property of information theory: **bandwidth and latency are independent variables.** A transport with enormous latency can have enormous bandwidth.

```
Avian carrier bandwidth calculation:

  Carrier:      Homing pigeon, healthy adult
  Payload:      MicroSD card (1 TB), mass 0.25 g (within MTU)
  Range:        50 km (conservative for racing pigeon)
  Speed:        60 km/h average
  Transit time: 50 min = 3000 seconds

  Bandwidth = Payload / Transit time
           = 1 TB / 3000 s
           = 333 MB/s
           = 2.67 Gbps

  With modern 2 TB microSD (2025):
           = 5.33 Gbps (one pigeon, one card)

  Pigeon can carry ~75 g (RSPB guidelines for racing pigeons)
  MicroSD mass: 0.25 g each → 300 cards per pigeon (structural limit)
  But let's be conservative: 3 cards = 6 TB payload

  Bandwidth = 6 TB / 3000 s = 2 GB/s = 16 Gbps per pigeon

This exceeds:
  - ADSL (8 Mbps):         2,000× faster
  - DOCSIS 3.1 (10 Gbps):  1.6× faster
  - GPON (2.5 Gbps):       6.4× faster
  - XGS-PON (10 Gbps):     1.6× faster

It does NOT exceed DWDM (32 Tbps). The pigeon is not a backbone
replacement. But for point-to-point bulk transfer at metropolitan
scale, a single pigeon with microSD cards outperforms consumer
broadband in raw throughput.
```

This analysis is not academic entertainment. It is the mathematical foundation for:

- **Amazon Snowball** (80 TB per device, shipped via freight): effective bandwidth of ~13 Gbps over a 2-day transit
- **Google Transfer Appliance** (1 PB per rack, trucked): effective bandwidth of ~46 Gbps over a 2-day transit
- **AWS Direct Connect on Wheels** (concept): physical transport of data to avoid WAN bottleneck

The product decisions at Amazon and Google were made by engineers who understood the IPoAC insight: when the data volume is large enough and the latency tolerance is long enough, physical transport wins.

---

## 6. Sneakernet and Sneakernet Mesh

### 6.1 Sneakernet Bandwidth Formula

"Never underestimate the bandwidth of a station wagon full of tapes hurtling down the highway." — Andrew Tanenbaum, *Computer Networks* (1981)

The formal bandwidth calculation:

```
B = (C × D) / T

Where:
  B = effective bandwidth (bytes/second)
  C = capacity per storage device (bytes)
  D = number of devices per trip
  T = transit time (seconds)
```

### 6.2 Worked Examples

```
Example 1: Walking across the office
  C = 2 TB (USB-C SSD)
  D = 1
  T = 60 seconds (walk to colleague's desk)
  B = 2 TB / 60 s = 33.3 GB/s = 266.7 Gbps
  → Exceeds 100GbE by 2.67×

Example 2: Driving across town
  C = 20 TB (NAS-grade HDD)
  D = 4 (in a padded bag)
  T = 3600 seconds (1 hour drive)
  B = 80 TB / 3600 s = 22.2 GB/s = 177.8 Gbps
  → Exceeds 100GbE by 1.78×

Example 3: FedEx overnight
  C = 2 TB (USB drive)
  D = 10,000 (pallet of drives)
  T = 57,600 seconds (16 hours, overnight FedEx)
  B = 20 PB / 57,600 s = 347 GB/s = 2.78 Tbps
  → Exceeds most DWDM links

Example 4: FedEx 767 cargo plane
  C = 2 TB (USB drive, 15 g each including packaging)
  D = 10,000 (150 kg — well within cargo limit)
  T = 14,400 seconds (4-hour flight, NYC to LAX)
  B = 20 PB / 14,400 s = 1.39 TB/s = 11.1 Tbps
  → Exceeds all but the largest submarine cable systems

Example 5: AWS Snowmobile (actual product, 2016-2022)
  C = 100 PB (single Snowmobile — a literal 45-foot shipping container)
  D = 1
  T = 604,800 seconds (1 week, including loading/transit/unloading)
  B = 100 PB / 604,800 s = 165 GB/s = 1.32 Tbps
  → For exabyte-scale cloud migrations, this was the fastest option
```

### 6.3 The Crossover Point

For any given network bandwidth B_net, there exists a data volume V* above which sneakernet is faster:

```
Crossover calculation:

  Network transfer time:    T_net = V / B_net
  Sneakernet transfer time: T_snk = T_fixed  (independent of V, up to capacity)

  Crossover at: T_net = T_snk
    V* = B_net × T_snk

  Examples:
  ─────────────────────────────────────────────────
  Network          B_net       T_snk (1 hr)    V*
  ─────────────────────────────────────────────────
  ADSL (8 Mbps)    1 MB/s      3600 s          3.6 GB
  DOCSIS (1 Gbps)  125 MB/s    3600 s          450 GB
  XGS-PON (10G)    1.25 GB/s   3600 s          4.5 TB
  100GbE           12.5 GB/s   3600 s          45 TB
  ─────────────────────────────────────────────────

  On ADSL, sneakernet wins for anything over 3.6 GB (one DVD).
  On 100GbE, sneakernet wins for anything over 45 TB.
  The crossover always exists; only the threshold changes.
```

### 6.4 Sneakernet Mesh Protocol (Speculative/Emerging)

A structured sneakernet mesh treats physical media transport as a delay-tolerant network (DTN). The IETF dtn Working Group has defined the Bundle Protocol (RFC 5050, updated by RFC 9171 "Bundle Protocol Version 7") for exactly this class of network — one where end-to-end connectivity is intermittent or non-existent, and data must be stored and forwarded at intermediate nodes.

```
Sneakernet mesh protocol stack:

  ┌─────────────────────────────┐
  │  Application Layer          │  Ceph RBD export, world seed,
  │  (Voxel World Replication)  │  modification deltas, metadata
  ├─────────────────────────────┤
  │  Bundle Protocol (BPv7)     │  Bundle creation, fragmentation,
  │  (RFC 9171)                 │  custody transfer, status reports
  ├─────────────────────────────┤
  │  Convergence Layer Adapter  │  Maps bundles to physical media:
  │  (CLA)                      │  filesystem CLA (write to USB/SSD)
  ├─────────────────────────────┤
  │  Physical Transport          │  Human with bag, courier service,
  │  (Sneakernet)               │  postal system, FedEx, pigeon
  └─────────────────────────────┘
```

**Bundle format for voxel world replication:**

```
Bundle structure:
  ┌─────────────────────────────────────────────────┐
  │ Primary Block                                    │
  │   Source EID:     dtn://world-alpha/ceph/rbd      │
  │   Destination EID: dtn://world-beta/ceph/rbd      │
  │   Creation time:  2026-03-10T14:00:00Z            │
  │   Lifetime:       7 days (bundle expires if        │
  │                   not delivered in 1 week)         │
  ├─────────────────────────────────────────────────┤
  │ Payload Block                                    │
  │   Content: RBD snapshot export (rbd export-diff)  │
  │   Size: 500 GB (differential since last sync)     │
  │   Checksum: SHA-256                               │
  ├─────────────────────────────────────────────────┤
  │ Extension: Custody Transfer                       │
  │   Custody requested: yes                          │
  │   Current custodian: dtn://courier-01             │
  │   Custody signal: signed acknowledgment at        │
  │                   each physical handoff           │
  ├─────────────────────────────────────────────────┤
  │ Extension: Forward Error Correction               │
  │   Codec: Reed-Solomon (255, 223)                  │
  │   Redundancy: 14.3% overhead                      │
  │   Purpose: survive bit rot on drive during         │
  │            multi-day physical transit              │
  └─────────────────────────────────────────────────┘
```

**Custody transfer protocol:**

```
Physical handoff sequence:

  [Origin]                [Courier]              [Destination]
     │                       │                        │
     │── Bundle on SSD ──→   │                        │
     │                       │── Custody ACK ──→      │
     │   (Origin releases    │   (signed, timestamped)│
     │    custody; Courier   │                        │
     │    is now responsible) │                        │
     │                       │── Physical transit ──→  │
     │                       │                        │
     │                       │── Bundle on SSD ──→    │
     │                       │   (Destination receives)│
     │                       │                        │
     │                       │← Custody ACK ──────────│
     │                       │   (Courier released;   │
     │                       │    Destination is now   │
     │                       │    custodian)           │
     │                       │                        │
     │← Delivery Report ─────────────────────────────│
     │   (Origin notified    │                        │
     │    of successful      │                        │
     │    delivery)          │                        │

  At every handoff, exactly one entity holds custody.
  If the bundle is lost, the custodian is responsible
  for retransmission from their stored copy.
```

**Applications to voxel world federation:**

1. **Remote research stations:** A Minecraft education server at an Antarctic research station receives world updates via quarterly supply flights. The Bundle Protocol handles the 3-month latency gracefully.
2. **Disaster recovery:** When all electronic infrastructure is down, sneakernet mesh is the only transport available. The bundle format ensures data integrity across multi-hop physical relays.
3. **Air-gapped cross-domain transfer:** Government or military installations with strict air-gap policies can federate voxel worlds using approved sneakernet channels with custody chain documentation.
4. **Distributed world-server backups:** Monthly backup drives transported between geographically separated data centers by bonded courier, with cryptographic chain of custody.

### 6.5 The Interplanetary Internet (IPN)

Vint Cerf (co-inventor of TCP/IP) and Scott Burleigh (JPL) designed the Interplanetary Internet architecture using the same DTN/Bundle Protocol stack. The problem is identical to sneakernet at a different scale: intermittent connectivity, high latency (4-24 minutes Mars-Earth one-way), and the need for store-and-forward at intermediate nodes (relay orbiters).

```
IPN communication profile:

  Earth ──→ Mars orbiter ──→ Mars surface rover
         4-24 min            seconds
         one-way             one-way
         intermittent         intermittent
         (Mars behind Sun:   (rover behind
          no contact for     mountain: no
          ~2 weeks/year)     contact for hours)

  Bundle Protocol handles:
  - Store at orbiter until surface contact window
  - Retransmit if custody transfer fails
  - Fragment large bundles across multiple contact windows
  - Contact-plan-aware routing (knows when each link is available)

  NASA has deployed DTN on ISS since 2008 (DINET experiment).
  The same protocol that carries voxel world backups on a USB
  drive in a courier's bag also carries science telemetry from
  Mars rovers via relay orbiters.
```

The connection to voxel federation is not metaphorical — it is architectural. A federation of sovereign worlds with intermittent connectivity (because operators bring servers online and offline at will) faces the same communication challenge as a network of spacecraft. The Bundle Protocol is the correct abstraction for both.

---

## 7. Transport Protocol Selection Matrix

### 7.1 The Matrix

This is the centerpiece of M18. Every transport in the taxonomy, characterized across the dimensions that matter for voxel world federation.

| Protocol | Bandwidth | Latency (RTT) | Error Tolerance | Jitter | Connectivity | Best For |
|----------|-----------|---------------|-----------------|--------|--------------|----------|
| Acoustic modem | 1-10 kbps | 10-100 ms | Low (BER ~10^-3) | High | Point-to-point, air-gap | Emergency heartbeat, air-gap provisioning |
| V.90/V.92 dial-up | 33.6-56 kbps | 100-200 ms | Low | Medium | Point-to-point, POTS | Legacy fallback, rural without broadband |
| ADSL | 1-8 Mbps | 20-50 ms | Medium | Low | Dedicated copper pair | Last-mile residential, asymmetric replication |
| VDSL2 | 50-100 Mbps | 10-30 ms | Medium | Low | Short copper loop | Near-DSLAM residential |
| G.fast | 500 Mbps-1 Gbps | 5-15 ms | Medium | Low | Very short copper | FTTdp last segment |
| DOCSIS 3.1 | 1-10 Gbps | 10-30 ms | Medium | Medium-High | Shared coaxial node | Shared residential, best-effort |
| GPON | 2.5 Gbps | 1-5 ms | Low (BER ~10^-12) | Very Low | Passive optical split | Fiber-to-home, guaranteed SLA |
| XGS-PON | 10 Gbps | 1-5 ms | Low | Very Low | Passive optical split | Symmetric fiber, active replication |
| 25GbE | 25 Gbps | <1 ms | Low | Very Low | Point-to-point, data center | Server-to-ToR switch |
| 100GbE | 100 Gbps | <0.5 ms | Low | Very Low | Point-to-point, data center | Ceph OSD-to-OSD (same rack) |
| 400GbE | 400 Gbps | <0.5 ms | Low | Very Low | Point-to-point, data center | Spine-leaf interconnect |
| InfiniBand HDR | 200 Gbps | ~1 μs | Very Low (BER ~10^-15) | Sub-μs | Point-to-point, HPC | Ceph OSD-to-OSD, RDMA-enabled |
| InfiniBand NDR | 400 Gbps | ~1 μs | Very Low | Sub-μs | Point-to-point, HPC | Next-gen Ceph fabric |
| DWDM (per channel) | 100-400 Gbps | 5 ms/1000km | Very Low | Low | Point-to-point, long-haul | Backbone, inter-DC replication |
| DWDM (aggregate) | 10-100 Tbps | 5 ms/1000km | Very Low | Low | Point-to-point, long-haul | Continental backbone |
| IPoAC (RFC 1149) | ~2.67 Gbps (1 TB/50km) | 3000-6000 s | High (55% loss) | Extreme | Point-to-point, LOS | Humor; proof of carrier independence |
| Sneakernet (walk) | 266.7 Gbps (2 TB/60s) | 60 s | N/A (offline) | N/A | Point-to-point, physical | Office-scale bulk transfer |
| Sneakernet (drive) | 177.8 Gbps (80 TB/1hr) | 3600 s | N/A (offline) | N/A | Point-to-point, physical | Metro-scale cold bulk |
| Sneakernet (FedEx) | 11.1 Tbps (20 PB/4hr) | 14,400-86,400 s | N/A (offline) | N/A | Point-to-point, physical | Continental cold bulk, cloud migration |
| Sneakernet mesh (DTN) | TB/hour per hop | hours-days | Medium (FEC+custody) | N/A | Multi-hop, store-and-forward | Offline federation, disaster recovery |

### 7.2 Bandwidth-Latency Pareto Front

The Pareto front identifies transports where no other option is simultaneously better in both bandwidth and latency. Any transport on the Pareto front represents a regime where it is the optimal choice for some combination of bandwidth need and latency tolerance.

```
Bandwidth-Latency Plot (log-log scale)

  Bandwidth
  (Gbps)
  10T ┤                                                        FedEx ●
      │                                                              sneakernet
  1T  ┤                                              DWDM ●
      │                                          aggregate
 100G ┤                                                    ● Drive
      │                                                   sneakernet
      │                               ● 400GbE
      │                          ● InfiniBand NDR
 100  ┤                     ● 100GbE
      │                ● InfiniBand HDR
      │
  10  ┤           ● XGS-PON    ● DOCSIS 3.1
      │       ● GPON               ● IPoAC (pigeon)
      │                                 (high BW, insane latency)
   1  ┤   ● G.fast
      │
 0.1  ┤ ● VDSL2
      │
 0.01 ┤● ADSL
      │
0.001 ┤                                                   ● Sneakernet
      │                                                     mesh (DTN)
      │
0.0001┤● V.90
      │
0.00001● Acoustic modem
      │
      └──┬──────┬──────┬──────┬──────┬──────┬──────┬──────┬──────→
         1 μs  10 μs 100 μs  1 ms  10 ms 100 ms  1 s   1 hr  1 day
                                                              Latency (RTT)

  PARETO FRONT (marked with ═══):

  InfiniBand NDR ═══ 400GbE ═══ DWDM ═══ FedEx sneakernet
       ↑                  ↑         ↑              ↑
    Best for           Best for   Best for      Best for
    sub-μs latency    DC fabric   long-haul    cold bulk
    + high BW         + high BW   + high BW    at any volume

  Everything below and to the right of the Pareto front is
  DOMINATED — there exists a transport that is both faster
  AND higher bandwidth.

  Dominated transports are still useful when:
  - The Pareto-optimal option is unavailable (no fiber to location)
  - Cost constraints exclude the Pareto-optimal option
  - The application's requirements are below the dominated transport's specs
  - Regulatory/security requirements mandate a specific transport (air-gap)
```

### 7.3 Transport Selection Decision Tree

```
                        ┌─────────────────────────┐
                        │  How much data to move?  │
                        └────────────┬────────────┘
                                     │
                    ┌────────────────┼────────────────┐
                    │                │                │
                 < 1 GB          1 GB - 10 TB       > 10 TB
                    │                │                │
                    ▼                ▼                ▼
           ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
           │ Use available │  │  Latency     │  │  Sneakernet  │
           │ network link  │  │  tolerance?  │  │  likely wins │
           │ (any will do) │  │              │  │              │
           └──────────────┘  └──────┬───────┘  └──────┬───────┘
                                    │                  │
                        ┌───────────┼──────────┐       │
                        │           │          │       │
                     < 10 ms    10-100 ms   > 1 hour   │
                        │           │          │       │
                        ▼           ▼          ▼       ▼
                  ┌──────────┐ ┌────────┐ ┌──────────────────┐
                  │InfiniBand│ │ Fiber  │ │ Physical media:  │
                  │ or       │ │ (GPON/ │ │ USB/SSD + courier│
                  │ 100GbE   │ │ DWDM)  │ │ or freight       │
                  └──────────┘ └────────┘ └──────────────────┘
```

---

## 8. Seed-Space Distance and Transport Selection

### 8.1 The M9 Connection

Module 9 (PCG Seed Manifold) defined seed-space distance: a metric that quantifies how different two procedurally generated worlds are based on their seed parameters. Two worlds with identical seeds have zero distance; worlds with unrelated seeds have maximum distance. This metric has direct implications for transport selection.

```
Seed-space distance and replication cost:

  d_seed(A, B) = ||seed_A - seed_B|| in parameter space

  Case 1: d_seed ≈ 0 (nearly identical worlds)
    - Most chunks are identical (same seed → same terrain)
    - Only modification deltas differ
    - Replication payload: Σ(deltas) — typically << total world size
    - Optimal transport: any network link (payload is small)
    - Example: fork of same world with local player modifications
      Payload: ~10 MB of deltas for a moderately played world
      Transfer: instant on any broadband link

  Case 2: d_seed moderate (related seeds, different parameters)
    - Terrain structure differs but shares statistical properties
    - Block-level deduplication recovers 20-60% commonality
    - Replication payload: deduplicated diff, moderate size
    - Optimal transport: broadband network link
    - Example: two worlds from same seed family with different biome configs
      Payload: ~50 GB after deduplication
      Transfer: 1 hour on GPON, 7 hours on ADSL, feasible either way

  Case 3: d_seed → max (unrelated worlds)
    - No structural commonality; deduplication yields < 5% savings
    - Replication payload: full world export
    - Optimal transport: depends on world size
    - Example: completely independent worlds joining a federation
      Payload: ~500 GB full world
      Transfer: 1 min on DWDM, 7 min on 100GbE, 1 hour on XGS-PON,
                14 hours on GPON, 6 days on ADSL,
                OR 30 minutes on sneakernet (drive across town)
```

### 8.2 The Transport Selection Function

Given seed-space distance d, world size W, available transports T, and latency tolerance L:

```
optimal_transport(d, W, L) = argmin_{t ∈ T} cost(t)

Where:
  payload(d, W) = W × (1 - dedup_ratio(d))
    dedup_ratio(d) ≈ exp(-k × d)  for empirical constant k
    (high seed-space distance → low dedup → high payload)

  transfer_time(t, payload) = payload / bandwidth(t) + latency(t)

  cost(t) = { ∞                    if transfer_time(t, payload) > L
            { α × price(t) + β × transfer_time(t, payload)    otherwise

  α, β = operator-defined cost weights (price vs. time preference)
```

The key insight: **the optimal transport depends not just on bandwidth and latency but on how much data actually needs to move, which depends on seed-space distance.** Two worlds that are forks of the same seed need only exchange deltas — even a dial-up modem suffices. Two unrelated worlds joining a federation need full replication — and for a large world, sneakernet may be the rational choice.

### 8.3 Replication Strategy Matrix

| Seed-Space Distance | Payload Estimate | Network Viable? | Sneakernet Viable? | Recommended |
|---------------------|------------------|-----------------|-------------------|-------------|
| d ≈ 0 (fork/clone) | < 100 MB | Yes (any link) | Overkill | Network, any available |
| d < 0.3 (same family) | 1-50 GB | Yes (broadband) | Unnecessary | GPON/XGS-PON or better |
| 0.3 < d < 0.7 | 50-200 GB | Yes (fiber) | Marginal | Fiber preferred; sneakernet if rural |
| d > 0.7 (unrelated) | 200 GB - full world | Depends on size | Often optimal | Sneakernet for > 10 TB; fiber for < 10 TB |
| d = 1.0 (no commonality) | Full world size | Slow if large | Yes, for large worlds | Sneakernet mesh for offline federation |

---

## 9. Error Correction Across Transports

### 9.1 FEC by Transport Layer

Each transport handles errors differently. Understanding the error correction strategy at each layer is essential for designing the voxel replication protocol's own error handling — specifically, where to add redundancy and where to rely on the transport's built-in protection.

| Transport | Error Correction | BER Before FEC | BER After FEC | Retransmission? |
|-----------|-----------------|----------------|---------------|-----------------|
| V.90 modem | Trellis coding + V.42 (LAPM) | ~10^-3 | ~10^-7 | Yes (V.42 ARQ) |
| ADSL | Reed-Solomon + trellis + interleaving | ~10^-3 | ~10^-7 | Optional (ATM cells) |
| DOCSIS 3.1 | LDPC + BCH concatenated | ~10^-2 | ~10^-8 | Yes (TCP at L4) |
| GPON | FEC RS(255,239) | ~10^-4 | ~10^-12 | Not at PHY; TCP at L4 |
| 100GbE | RS(544,514) | ~10^-4 | ~10^-13 | Not at PHY; TCP at L4 |
| InfiniBand | CRC-32 + link-level retry | ~10^-12 | ~10^-15 | Yes (link-level) |
| IPoAC | None (paper scroll) | ~0.5 (55% loss!) | ~0.5 | TCP handles it (eventually) |
| Sneakernet | Drive-level ECC + Reed-Solomon on image | ~10^-15 (drive ECC) | ~10^-18 | Custody transfer retry |

### 9.2 End-to-End Integrity for Voxel Replication

The replication protocol must not trust any single transport layer's error correction. End-to-end integrity is enforced at the application layer:

```
Voxel replication integrity stack:

  Application: SHA-256 checksum per RBD snapshot export
    ↓ If mismatch: request retransmission of corrupt bundle
  Bundle Protocol: CRC-32 per bundle block
    ↓ If mismatch: custody retransmission
  Transport FEC: varies by medium (see table above)
    ↓ If uncorrectable: frame dropped, upper layer retransmits
  Physical: raw bit error rate of the medium
```

The defense-in-depth principle: each layer catches errors the layer below missed. The probability of a corrupt byte surviving all layers undetected is the product of the per-layer miss rates — effectively zero for any combination of modern transport + Bundle Protocol + SHA-256 verification.

---

## 10. The Pareto Front in Practice: Federation Deployment Scenarios

### 10.1 Scenario: Urban Federation (Same City)

```
Two Ceph clusters in the same metropolitan area, 30 km apart.
World size: 500 GB each. Seed-space distance: 0.4 (moderate).
Payload after dedup: ~200 GB.

Transport options:
  XGS-PON (10 Gbps):  200 GB / 1.25 GB/s = 160 seconds + 2ms RTT
  Sneakernet (drive):  200 GB on 1 SSD, 45-minute drive
  ADSL (8 Mbps):       200 GB / 1 MB/s = 200,000 seconds (55 hours)

Winner: XGS-PON. Network wins because latency matters and payload
fits within network capacity. Sneakernet is 16× slower.
```

### 10.2 Scenario: Rural Federation (No Fiber)

```
Farm community server, 200 km from nearest fiber POP.
Only transport: ADSL (3 Mbps actual). World size: 100 GB.
Seed-space distance: 0.8 (low commonality). Payload: ~80 GB.

Transport options:
  ADSL (3 Mbps):       80 GB / 375 KB/s = 213,333 seconds (2.5 days)
  Sneakernet (mail):   80 GB on SSD, 2-day Priority Mail
  Sneakernet (drive):  80 GB on SSD, 4-hour drive to town

Winner: Sneakernet (drive). Same total time as ADSL but delivers
the full payload without consuming 2.5 days of bandwidth that
the community also needs for other internet use.
```

### 10.3 Scenario: Intercontinental Federation

```
Two clusters: Portland, OR and Helsinki, Finland.
World size: 2 TB each. Seed-space distance: 0.9 (nearly unrelated).
Payload: ~1.8 TB. Trans-oceanic fiber RTT: ~180 ms.

Transport options:
  100 Gbps DWDM leased: 1.8 TB / 12.5 GB/s = 144 seconds
    Cost: $5,000/month for dedicated wavelength
  10 Gbps transit:     1.8 TB / 1.25 GB/s = 1,440 seconds (24 minutes)
    Cost: $500/month for 10 Gbps commit
  Sneakernet (FedEx):  1.8 TB on SSD, 3-day international delivery
    Cost: $80 shipping
  Ongoing sync (daily deltas): ~5 GB/day on 1 Gbps transit
    Cost: $50/month for 1 Gbps commit

Winner: Initial replication via FedEx sneakernet ($80, 3 days),
then ongoing daily delta sync via 1 Gbps transit ($50/month).
The hybrid approach uses each transport where it excels:
sneakernet for the initial cold bulk, network for the warm deltas.
```

### 10.4 Scenario: Disaster Recovery (All Electronics Down)

```
Post-earthquake. No power grid. No internet. No cell towers.
A Ceph cluster survived on generator power.
Need to replicate critical world data to a recovery site 50 km away.

Transport options:
  Electronic network:  Unavailable
  Acoustic modem:      1 kbps over voice radio → 10 KB/min → seed vector only
  IPoAC:               Pigeon to recovery site (if trained) → 1 TB microSD
  Sneakernet (walk):   2 TB SSD in a backpack, 10-hour hike
  Sneakernet (vehicle): 2 TB SSD, 1-hour drive (if roads passable)

Winner: Sneakernet. The only transport that functions when all
electronic infrastructure is destroyed. This is not an edge case —
it is the scenario that justifies the entire DTN/Bundle Protocol
architecture of the sneakernet mesh.
```

---

## 11. Historical Transport Timeline

```
Timeline: Transport Technologies and Voxel-Relevant Milestones

  1844 ── Telegraph (Morse code, ~5 baud)
  1876 ── Telephone (Alexander Graham Bell, analog voice)
  1958 ── Bell 101 modem (110 baud, military)
  1962 ── Bell 103 modem (300 baud, commercial FSK)
  1965 ── Acoustic couplers (pre-Carterfone)
  1965 ── Cooley-Tukey FFT algorithm published
          (enables all future OFDM modulation)
  1968 ── FCC Carterfone decision (third-party telephone equipment allowed)
  1976 ── Clark: LOD paper (Module 12 ancestor)
  1978 ── Bell 212A (1200 bps, DPSK)
  1981 ── Tanenbaum: "Never underestimate the bandwidth of a station wagon..."
  1984 ── V.22bis (2400 bps, ITU standard)
  1988 ── V.32 (9600 bps, QAM + echo cancellation)
  1990 ── RFC 1149: IP over Avian Carriers
  1991 ── V.32bis (14,400 bps)
  1994 ── V.34 (33,600 bps — 92% Shannon limit on POTS)
  1995 ── ADSL standards begin deployment
  1998 ── V.90 (56 kbps — exploits digital CO backbone)
  1999 ── RFC 2549: IPoAC QoS extensions
  2001 ── Bergen IPoAC experiment (9 packets, 55% loss, ~80 min avg RTT)
  2003 ── GPON (ITU-T G.984, 2.5 Gbps)
  2006 ── VDSL2 (G.993.2, 100 Mbps)
  2006 ── RFC 5050: Bundle Protocol v6 (DTN)
  2010 ── DOCSIS 3.0 (1.2 Gbps bonded)
  2011 ── RFC 6214: IPoAC for IPv6
  2013 ── DOCSIS 3.1 (10 Gbps OFDM)
  2014 ── G.fast (1 Gbps on short copper)
  2016 ── XGS-PON (G.9807, 10 Gbps symmetric)
  2016 ── AWS Snowmobile announced (100 PB per container)
  2020 ── InfiniBand HDR (200 Gbps, 1 μs latency)
  2021 ── 50G-PON (G.9804, 50 Gbps)
  2021 ── RFC 9171: Bundle Protocol v7
  2023 ── InfiniBand NDR (400 Gbps)
  2024 ── DOCSIS 4.0 (10G down / 6G up)
  2024 ── MGfast (10 Gbps on very short copper)
  2025 ── 800GbE (IEEE 802.3df) ratification in progress
```

---

## 12. M2 Retrospective Forward Lesson

The Module 2 retrospective (Section 5.3) noted: "Transport taxonomy should reference seed-space distance." This was prescient. As Section 8 demonstrates, the optimal transport for federation replication depends critically on how much data actually needs to move, which is a function of seed-space distance between source and destination worlds.

The lesson generalizes: transport selection is not a property of the transport alone — it is a function of the transport, the data, and the relationship between source and destination. Two identical worlds connected by a 300-baud acoustic modem can synchronize faster than two unrelated worlds connected by 10 Gbps fiber, because the delta between identical worlds is negligible while the delta between unrelated worlds is the full world size. The transport is necessary but not sufficient; the information-theoretic content of the transfer determines the outcome.

This is the same insight V.90 discovered about the PSTN: the architecture of the data path matters more than the raw bandwidth of any single link. Minimize encoding transitions, minimize the payload through deduplication, choose the transport that fits the remaining payload and latency requirement. The rest is engineering.

---

## 13. Connection to Other Modules

| Module | Connection to M18 |
|--------|-------------------|
| M9 (PCG Seed Manifold) | Seed-space distance determines replication payload size and therefore optimal transport selection; differential replication over low-bandwidth links requires small seed-space distance |
| M10 (Multi-Server Fabric) | Velocity proxy transport between Minecraft server instances; cluster-internal transport uses InfiniBand or 100GbE from this module's taxonomy |
| M12 (Edge Topology/LOD) | LOD zone determines storage format, which affects replication payload — Z3 (metadata only) replicates via any transport; Z0 (full Anvil) requires high-bandwidth transport |
| M13 (Backup/DR) | Backup transport selection uses this module's matrix; cold backups favor sneakernet; warm standby requires fiber-class bandwidth |
| M17 (Error Correction) | Reed-Solomon theory from M17 applies to sneakernet drive integrity and ADSL/DOCSIS FEC; error correction cost budgets reference M17's analysis |
| M19 (Backup/Federation) | Offsite backup transport directly references sneakernet mesh and DTN Bundle Protocol; BorgBackup archives may be physically transported |
| M20 (Zero Trust) | Sneakernet custody transfer chain provides physical-layer trust analogous to M20's zero-trust network authentication; air-gap transports bypass network-layer threats |

---

## 14. Sources

| ID | Reference |
|----|-----------|
| SRC-RFC1149 | Waitzman, D. (1990). "A Standard for the Transmission of IP Datagrams on Avian Carriers." RFC 1149. IETF. https://www.rfc-editor.org/rfc/rfc1149 |
| SRC-RFC2549 | Waitzman, D. (1999). "IP over Avian Carriers with Quality of Service." RFC 2549. IETF. https://www.rfc-editor.org/rfc/rfc2549 |
| SRC-RFC6214 | Carpenter, B.; Hinden, R. (2011). "Adaptation of RFC 1149 for IPv6." RFC 6214. IETF. https://www.rfc-editor.org/rfc/rfc6214 |
| SRC-BERGEN | Bergen Linux User Group. (2001). "CPIP — Carrier Pigeon Internet Protocol." https://www.blug.linux.no/rfc1149/ |
| SRC-RFC5050 | Scott, K.; Burleigh, S. (2007). "Bundle Protocol Specification." RFC 5050. IETF. https://www.rfc-editor.org/rfc/rfc5050 |
| SRC-RFC9171 | Burleigh, S.; Fall, K.; Birrane, E. (2022). "Bundle Protocol Version 7." RFC 9171. IETF. https://www.rfc-editor.org/rfc/rfc9171 |
| SRC-CERF-IPN | Cerf, V. et al. (2007). "Delay-Tolerant Networking Architecture." RFC 4838. IETF. https://www.rfc-editor.org/rfc/rfc4838 |
| SRC-SHANNON | Shannon, C. E. (1948). "A Mathematical Theory of Communication." *Bell System Technical Journal*, 27(3), 379-423. |
| SRC-V90 | ITU-T. (1998). "V.90 — A Digital Modem and Analogue Modem Pair for Use on the Public Switched Telephone Network (PSTN) at Data Signalling Rates of up to 56 000 bit/s Downstream and up to 33 600 bit/s Upstream." ITU-T Recommendation V.90. |
| SRC-ADSL | ITU-T. (1999). "G.992.1 — Asymmetric Digital Subscriber Line (ADSL) Transceivers." ITU-T Recommendation G.992.1. |
| SRC-DOCSIS31 | CableLabs. (2013). "Data-Over-Cable Service Interface Specifications DOCSIS 3.1: Physical Layer Specification." CM-SP-PHYv3.1-I01. |
| SRC-GPON | ITU-T. (2003). "G.984 series — Gigabit-capable Passive Optical Networks (GPON)." ITU-T Recommendations G.984.1-G.984.4. |
| SRC-XGSPON | ITU-T. (2016). "G.9807.1 — 10-Gigabit-capable symmetric passive optical network (XGS-PON)." ITU-T Recommendation G.9807.1. |
| SRC-DWDM | Ramaswami, R.; Sivarajan, K.; Sasaki, G. (2010). *Optical Networks: A Practical Perspective*. 3rd ed. Morgan Kaufmann. |
| SRC-COOLEY | Cooley, J. W.; Tukey, J. W. (1965). "An Algorithm for the Machine Calculation of Complex Fourier Series." *Mathematics of Computation*, 19(90), 297-301. |
| SRC-SNOWBALL | Amazon Web Services. "AWS Snow Family." https://aws.amazon.com/snow/ |
| SRC-TANENBAUM | Tanenbaum, A. S. (1981). *Computer Networks*. Prentice Hall. (Station wagon quote, 1st edition.) |
| SRC-INFINIBAND | InfiniBand Trade Association. (2020). "InfiniBand Architecture Specification Volume 1, Release 1.4." |
| SRC-GGWAVE | Gerganov, G. "ggwave — Tiny data-over-sound library." https://github.com/ggerganov/ggwave |
| SRC-AIRHOPPER | Guri, M. et al. (2015). "AirHopper: Bridging the Air-Gap between Isolated Networks and Mobile Phones using Radio Frequencies." *IEEE MALWARE 2014*. |
