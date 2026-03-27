# Cellular Evolution: 1G through 5G

> **Domain:** Wireless Telecommunications
> **Module:** 2 -- Five Generations of Cellular Air Interface Engineering
> **Through-line:** *Each generation of cellular technology was not an incremental improvement but a fundamental rethinking of how radio spectrum is shared among users. 1G divided the spectrum into channels. 2G divided time. 3G divided codes. 4G divided frequencies. 5G divides space. The physics stayed the same -- Shannon's channel capacity theorem hasn't changed since 1948 -- but every generation found a new mathematical trick to extract more bits from the same air.*

---

## Table of Contents

1. [The Cellular Concept](#1-the-cellular-concept)
2. [1G: AMPS and the Analog Era](#2-1g-amps-and-the-analog-era)
3. [2G: Digital Voice -- GSM, TDMA, CDMA](#3-2g-digital-voice-gsm-tdma-cdma)
4. [The Air Interface Problem](#4-the-air-interface-problem)
5. [3G: UMTS and CDMA2000](#5-3g-umts-and-cdma2000)
6. [4G: LTE and OFDM](#6-4g-lte-and-ofdm)
7. [5G: New Radio (NR)](#7-5g-new-radio-nr)
8. [Spectrum Management](#8-spectrum-management)
9. [Cell Planning and Frequency Reuse](#9-cell-planning-and-frequency-reuse)
10. [Handoff and Mobility Management](#10-handoff-and-mobility-management)
11. [Backhaul and Core Network Evolution](#11-backhaul-and-core-network-evolution)
12. [Cross-References](#12-cross-references)
13. [Sources](#13-sources)

---

## 1. The Cellular Concept

The cellular concept, developed at Bell Labs by D.H. Ring in 1947 and formalized by Richard Frenkiel and Joel Engel in the 1960s-70s, solved the fundamental problem of mobile telephony: spectrum is finite, but users are not [1]. The solution was frequency reuse -- divide the coverage area into cells, assign each cell a subset of available frequencies, and arrange cells so that co-channel cells (using the same frequencies) are far enough apart that interference remains below acceptable thresholds.

```
CELLULAR FREQUENCY REUSE -- 7-CELL PATTERN
================================================================

        ┌───┐
       / 2   \
  ┌───/───────\───┐
 / 6   \     / 3   \
/───────\───/───────\
\       / 1 \       /
 \─────/─────\─────/
 / 7   \     / 4   \
/───────\───/───────\
\       / 5 \       /
 \─────/─────\─────/
       \     /
        └───┘

  N = 7 cell reuse pattern
  Each number represents a unique frequency group
  Same number = same frequencies (co-channel)
  Co-channel distance: D = R * sqrt(3N)
    where R = cell radius

  For N=7: D/R = 4.58
  Signal-to-interference ratio (C/I):
    C/I = (1/6) * (D/R)^gamma
    gamma = path loss exponent (typically 3-4 for urban)
    For gamma=4: C/I ≈ 18.7 dB (adequate for FM voice)
```

The cellular concept enabled the same spectrum to be reused across a metropolitan area, multiplying capacity by the number of cells. A 50 MHz allocation serving one user per channel could serve a single city with thousands of simultaneous calls [2].

### Shannon's Limit

All cellular systems operate under Shannon's channel capacity theorem (1948): C = B * log2(1 + S/N), where C is channel capacity in bits/sec, B is bandwidth in Hz, and S/N is signal-to-noise ratio [3]. No coding scheme can exceed this limit. Every generation of cellular technology is an engineering attempt to approach Shannon's bound more closely.

---

## 2. 1G: AMPS and the Analog Era

The Advanced Mobile Phone System (AMPS) launched commercially in Chicago on October 13, 1983, by Ameritech [4]. AMPS was the first widely deployed cellular system in North America, operating in the 800 MHz band.

### AMPS Technical Specifications

```
AMPS (1G) -- KEY PARAMETERS
================================================================

  Frequency band:     824-849 MHz (mobile transmit)
                      869-894 MHz (base transmit)
  Channel bandwidth:  30 kHz
  Modulation:         FM (frequency modulation)
  Peak deviation:     ±12 kHz
  Number of channels: 832 (416 per carrier, A/B split)
  Duplex method:      FDD (frequency division duplex)
  Duplex spacing:     45 MHz
  Power levels:       0.6W to 4W (mobile), up to 100W (base)
  Voice coding:       Analog (no digital encoding)
  Signaling:          FSK data burst on setup channel (10 kbps)

  Capacity per cell sector:
    Assuming 7-cell reuse, 3 sectors/cell:
    832 / (7 * 3) ≈ 40 channels per sector
    At 0.02 Erlang/subscriber ≈ 1,200 subscribers per sector
```

### AMPS Limitations

- **No encryption:** Voice was transmitted as plain FM, receivable by any scanner. Eavesdropping was trivial [5].
- **Analog quality:** Subject to multipath fading, interference, and static. No error correction.
- **Spectrum efficiency:** One conversation per 30 kHz channel. No compression, no multiplexing.
- **Fraud:** Cloning of ESN/MIN pairs (Electronic Serial Number / Mobile Identification Number) was rampant [6].

AMPS demonstrated the commercial viability of cellular telephony. By 1990, there were over 5 million AMPS subscribers in the US [4]. The analog network remained operational until February 18, 2008, when the FCC mandate for analog sunset took effect [7].

---

## 3. 2G: Digital Voice -- GSM, TDMA, CDMA

The second generation replaced analog modulation with digital encoding, enabling encryption, error correction, and spectral efficiency improvements.

### GSM (Global System for Mobile Communications)

GSM, developed by ETSI beginning in 1982 and launched commercially in Finland in 1991, became the world's dominant cellular standard [8]. At its peak, GSM served over 5 billion subscribers across 220 countries.

```
GSM -- KEY PARAMETERS
================================================================

  Frequency bands:    900 MHz (Europe), 1900 MHz (North America)
  Channel bandwidth:  200 kHz
  Modulation:         GMSK (Gaussian Minimum Shift Keying)
  Access method:      TDMA (8 time slots per channel)
  Frame duration:     4.615 ms (8 slots x 577 μs each)
  Voice codec:        RPE-LTP at 13 kbps (full rate)
                      VSELP at 5.6 kbps (half rate)
  Data rate:          9.6 kbps (circuit-switched data)
  Encryption:         A5/1 stream cipher
  SIM card:           Smart card for subscriber identity
  Handoff:            Mobile-assisted (MAHO)

  Capacity improvement over AMPS:
    200 kHz / 30 kHz = 6.67x bandwidth
    8 users / channel = 8x multiplexing
    Net: ~3-4x improvement per MHz (accounting for guard bands)
```

GSM introduced the SIM card -- a removable smart card containing the subscriber's identity (IMSI), encryption keys, and service parameters. This separated the subscriber identity from the handset, enabling device portability [9].

### IS-136 TDMA

The North American TDMA standard (IS-136, also called D-AMPS) overlaid digital TDMA on the existing AMPS channel structure. Three digital users shared each 30 kHz channel using time-division multiplexing [10]. IS-136 was deployed primarily by AT&T Wireless and Cingular but was eventually supplanted by GSM.

### IS-95 CDMA (cdmaOne)

Qualcomm's IS-95, the first commercial CDMA (Code Division Multiple Access) cellular system, represented a radical departure from channelized approaches [11]. In CDMA, all users transmit simultaneously on the same frequency band, distinguished by unique spreading codes.

```
IS-95 CDMA -- OPERATING PRINCIPLE
================================================================

  Bandwidth:         1.25 MHz (wideband)
  Modulation:        QPSK/OQPSK
  Spreading:         Walsh codes (64 orthogonal codes)
  PN sequence:       Short code (pilot) + long code (privacy)
  Voice codec:       EVRC at 8 kbps (variable rate)
  Power control:     800 Hz closed-loop (critical for operation)
  Soft handoff:      Simultaneous connection to multiple cells

  CDMA principle:
    User 1 data: d1 * c1 (data x spreading code 1)
    User 2 data: d2 * c2 (data x spreading code 2)
    ...
    Received signal: sum of all users
    Despreading user 1: received * c1 → d1 (other users appear as noise)

  Capacity advantage:
    Soft capacity (graceful degradation, not hard blocking)
    Voice activity detection (~40% of time users speak)
    Sectorization gain: 2.5x (vs 1.8x for TDMA)
    Net: ~3-6x capacity over AMPS per MHz
```

The critical engineering challenge in CDMA is power control. If a near user transmits at the same power as a far user, the near user's signal overwhelms the far user at the base station (the near-far problem). IS-95 solved this with 800 Hz closed-loop power control, adjusting each mobile's transmit power in 1 dB steps 800 times per second [11].

> **SAFETY WARNING:** Cellular base stations transmit RF energy. FCC OET Bulletin 65 establishes RF exposure limits. For 800 MHz cellular, the general population limit is 0.58 mW/cm2 power density. Workers maintaining tower-mounted equipment must observe controlled exposure limits and use personal RF monitors [12].

---

## 4. The Air Interface Problem

Every cellular generation solves the same fundamental problem: how to share a finite radio spectrum among many simultaneous users. The three primary multiplexing dimensions are:

```
MULTIPLE ACCESS TECHNIQUES
================================================================

  FDMA (Frequency Division)     TDMA (Time Division)
  ┌──┬──┬──┬──┬──┐             ┌────────────────┐
  │f1│f2│f3│f4│f5│             │ t1 │ t2 │ t3 │...│
  │  │  │  │  │  │             │    │    │    │   │
  │  │  │  │  │  │             │user│user│user│   │
  │  │  │  │  │  │             │ 1  │ 2  │ 3  │   │
  └──┴──┴──┴──┴──┘             └────────────────┘
  1G (AMPS): one user           2G (GSM): 8 users
  per frequency channel         per frequency, time-shared

  CDMA (Code Division)          OFDMA (Orthogonal Freq.)
  ┌────────────────┐            ┌──┬──┬──┬──┬──┐
  │ All users on   │            │s1│s2│s1│s3│s2│ t1
  │ same frequency │            │s2│s3│s3│s1│s1│ t2
  │ simultaneously │            │s3│s1│s2│s2│s3│ t3
  │ (separated by  │            │  │  │  │  │  │
  │  codes)        │            │ subcarriers    │
  └────────────────┘            └──┴──┴──┴──┴──┘
  3G (UMTS): all users          4G (LTE): frequency +
  spread across bandwidth       time resource blocks
```

Each technique has different properties regarding interference management, multipath resilience, and scheduling flexibility. The evolution from FDMA to OFDMA reflects increasing sophistication in exploiting the available degrees of freedom in the radio channel [13].

---

## 5. 3G: UMTS and CDMA2000

Third-generation cellular systems aimed to provide mobile broadband data alongside voice. Two competing standards emerged from the 2G split.

### UMTS (W-CDMA)

The Universal Mobile Telecommunications System, based on Wideband CDMA, was the 3G evolution path for GSM operators [14]. First deployed in Japan by NTT DoCoMo in 2001.

```
UMTS (W-CDMA) -- KEY PARAMETERS
================================================================

  Frequency bands:    2100 MHz (primary), various others
  Channel bandwidth:  5 MHz (vs 1.25 MHz for IS-95)
  Chip rate:          3.84 Mcps (mega chips per second)
  Modulation:         QPSK (downlink), BPSK/HPSK (uplink)
  Peak data rate:     384 kbps (Release 99)
                      14.4 Mbps (HSDPA, Release 5)
                      42 Mbps (HSPA+, Release 8)
  Voice codec:        AMR (Adaptive Multi-Rate), 4.75-12.2 kbps
  Power control:      1500 Hz closed-loop
  Soft handoff:       Yes (macro diversity combining)

  HSDPA innovations:
    - Shared channel (HS-DSCH) instead of dedicated channels
    - 2 ms TTI (Transmission Time Interval) vs 10-80 ms
    - Adaptive modulation: QPSK → 16-QAM → 64-QAM
    - Hybrid ARQ (fast retransmission at physical layer)
    - Proportional fair scheduling
```

### CDMA2000

CDMA2000 was the 3G evolution path for IS-95 operators, maintaining backward compatibility with the 1.25 MHz channel structure [15].

- **1xRTT:** First CDMA2000 release. 153 kbps peak data.
- **EV-DO (Evolution-Data Optimized):** Data-only carrier. Rev 0: 2.4 Mbps. Rev A: 3.1 Mbps downlink, 1.8 Mbps uplink.
- **EV-DO Rev B:** Multi-carrier bonding up to 14.7 Mbps.

### The 3G Data Revolution

3G networks enabled the mobile internet. While the data rates seem modest by modern standards, 3G was the first generation where a mobile device could load a web page, stream audio, or download an email attachment at speeds comparable to early broadband [16]. This capability enabled the smartphone revolution -- the iPhone launched in 2007 on AT&T's UMTS/HSDPA network.

---

## 6. 4G: LTE and OFDM

Long Term Evolution (LTE), standardized by 3GPP beginning in Release 8 (2008), represented the most significant air interface redesign since the cellular concept itself [17]. LTE abandoned CDMA entirely in favor of OFDM (Orthogonal Frequency Division Multiplexing).

### Why OFDM Won

CDMA's wideband approach becomes increasingly difficult to equalize at high data rates. A 5 MHz CDMA signal in a multipath channel requires a RAKE receiver with many fingers, and inter-symbol interference limits throughput. OFDM sidesteps the problem by dividing the wideband channel into thousands of narrow subcarriers, each narrow enough that it experiences flat fading [18].

```
LTE OFDM -- RESOURCE GRID
================================================================

  Bandwidth: 20 MHz (maximum)
  Subcarrier spacing: 15 kHz
  Subcarriers: 1,200 (in 20 MHz)
  OFDM symbol duration: 66.7 μs + 4.7 μs CP = 71.4 μs
  Slot: 7 OFDM symbols = 0.5 ms
  Subframe: 2 slots = 1 ms (TTI)
  Frame: 10 subframes = 10 ms

  Resource Block (RB):
    12 subcarriers x 7 symbols = 84 resource elements
    Bandwidth per RB: 180 kHz
    100 RBs in 20 MHz channel

  Downlink modulation: QPSK, 16-QAM, 64-QAM, 256-QAM (Cat 11+)
  Uplink: SC-FDMA (DFT-precoded OFDM, lower PAPR)

  Peak rates (theoretical):
    Category 4:  150 Mbps DL / 50 Mbps UL (20 MHz, 2x2 MIMO)
    Category 9:  450 Mbps DL (3-carrier aggregation)
    Category 20: 2 Gbps DL (5CA, 256-QAM, 8x8 MIMO)
```

### MIMO: Multiple Input Multiple Output

LTE introduced MIMO antenna technology as a core capability. By using multiple antennas at both transmitter and receiver, MIMO creates parallel spatial streams through the same spectrum [19].

- **2x2 MIMO:** Doubles peak throughput (2 spatial streams)
- **4x4 MIMO:** Quadruples peak throughput
- **8x8 MIMO:** Eight spatial streams (LTE-Advanced)

The theoretical capacity gain from MIMO is: C = min(Nt, Nr) * B * log2(1 + SNR/min(Nt,Nr)), where Nt and Nr are transmit and receive antennas. MIMO multiplies Shannon's capacity linearly with the number of spatial streams [20].

### LTE Network Architecture

LTE replaced the circuit-switched core with an all-IP Evolved Packet Core (EPC). Voice was initially carried via circuit-switched fallback to 3G, then natively via VoLTE (Voice over LTE) using IMS (IP Multimedia Subsystem) [21].

```
LTE NETWORK ARCHITECTURE
================================================================

  UE (User Equipment)
    |
    | Uu interface (air)
    v
  eNodeB (evolved Node B / base station)
    |
    | S1 interface (IP)
    v
  EPC (Evolved Packet Core)
    ├── MME (Mobility Management Entity) -- signaling
    ├── S-GW (Serving Gateway) -- user plane routing
    ├── P-GW (PDN Gateway) -- internet connectivity
    ├── HSS (Home Subscriber Server) -- authentication
    └── PCRF (Policy and Charging Rules Function)

  All-IP: no circuit switching anywhere in the network
  Flat architecture: eNodeBs connect directly to core (no RNC)
  X2 interface: direct eNodeB-to-eNodeB for handoff
```

> **Related:** [VoIP & SIP Convergence](03-voip-sip-convergence.md) for IMS and VoLTE implementation details.

---

## 7. 5G: New Radio (NR)

5G New Radio (NR), standardized in 3GPP Release 15 (2018), extends the LTE OFDM foundation with three defining capabilities [22]:

### Three 5G Service Categories

```
5G SERVICE CATEGORIES
================================================================

  eMBB (enhanced Mobile Broadband)
    Peak: 20 Gbps DL / 10 Gbps UL
    User experienced: 100 Mbps DL / 50 Mbps UL
    Use: video streaming, AR/VR, high-speed download

  URLLC (Ultra-Reliable Low-Latency Communications)
    Latency: 1 ms (user plane)
    Reliability: 99.999% (1 - 10^-5 BLER)
    Use: autonomous vehicles, remote surgery, industrial control

  mMTC (massive Machine-Type Communications)
    Density: 1,000,000 devices per km2
    Battery: 10+ year device lifetime
    Use: IoT sensors, smart city, agriculture monitoring
```

### 5G NR Technical Innovations

- **Flexible numerology:** Subcarrier spacing of 15, 30, 60, 120, or 240 kHz (vs fixed 15 kHz in LTE). Wider spacing for higher frequencies enables shorter symbols and lower latency [23].
- **Massive MIMO:** 64, 128, or 256 antenna elements at the base station. Beamforming creates directed beams to individual users, dramatically increasing spectral efficiency [24].
- **Millimeter wave (mmWave):** Operation at 24-100 GHz frequencies, providing enormous bandwidth (400 MHz to 1 GHz channels) but limited range and penetration [25].
- **Network slicing:** Virtual network instances customized for specific service requirements (latency, bandwidth, reliability) running on shared physical infrastructure [26].

```
5G NR FREQUENCY RANGES
================================================================

  FR1 (Sub-6 GHz):
    Range: 410 MHz - 7.125 GHz
    Channel BW: up to 100 MHz
    Subcarrier: 15, 30, 60 kHz
    Characteristics: good coverage, moderate capacity

  FR2 (mmWave):
    Range: 24.25 GHz - 52.6 GHz (Release 15)
           extended to 71 GHz (Release 17)
    Channel BW: up to 400 MHz (up to 1.6 GHz with CA)
    Subcarrier: 60, 120, 240 kHz
    Characteristics: massive capacity, limited range (~200m outdoors)

  FR2 propagation challenges:
    - Free-space path loss: 20*log10(f) → +28 dB at 28 GHz vs 2 GHz
    - Foliage attenuation: 10-40 dB through trees
    - Rain attenuation: 7.5 dB/km at 28 GHz for heavy rain
    - Building penetration: 20-40 dB through exterior walls
    - Human body blockage: 20-35 dB
```

### 5G and Massive MIMO Beamforming

Massive MIMO with beamforming is the defining antenna technology of 5G. A base station with 128 antenna elements can form highly directional beams pointed at individual users, concentrating energy where it is needed and reducing interference everywhere else [24].

```
MASSIVE MIMO BEAMFORMING
================================================================

  Traditional (omnidirectional):
    ┌───────────────────────┐
    │   Signal radiates     │
    │   in all directions   │
    │       /|\             │
    │      / | \            │
    │     /  |  \           │
    │    /   |   \          │
    │   / antenna \         │
    └───────────────────────┘

  Massive MIMO (beamformed):
    ┌───────────────────────┐
    │         User A        │
    │        /              │
    │       / beam A        │
    │  ||||||||  ──── beam B ──── User B
    │  128 ant.\            │
    │           \ beam C    │
    │            \          │
    │             User C    │
    └───────────────────────┘

  Capacity gain:
    M antennas, K users (M >> K):
    Spectral efficiency ≈ K * log2(1 + M*SNR/K)
    For M=128, K=16: ~16x capacity over single-antenna
```

> **SAFETY WARNING:** 5G mmWave base stations use beamforming that concentrates RF energy in narrow beams. While average power density may be within FCC limits, peak spatial power density during beam sweeping may approach or exceed reference levels at close range. FCC OET Bulletin 65 Supplement C addresses mmWave compliance measurement methods [27].

---

## 8. Spectrum Management

Cellular spectrum is allocated by national regulators (FCC in the US, Ofcom in the UK, etc.) and coordinated internationally by the ITU World Radiocommunication Conference (WRC) [28].

### US Cellular Spectrum Allocations

| Band | Frequency | Technology | Notes |
|------|-----------|------------|-------|
| 700 MHz | 698-806 MHz | LTE/5G | Post-analog TV transition (2009) |
| 850 MHz | 824-894 MHz | AMPS/GSM/LTE | Original cellular band (1983) |
| 1900 MHz (PCS) | 1850-1990 MHz | GSM/CDMA/LTE | Auctioned 1994-1996 |
| AWS | 1710-2155 MHz | LTE/5G | Multiple auction rounds |
| 2.5 GHz (BRS/EBS) | 2496-2690 MHz | LTE/5G | Sprint/T-Mobile primary band |
| C-Band | 3700-3980 MHz | 5G | Auctioned 2021, $81B total |
| 28 GHz | 27.5-28.35 GHz | 5G mmWave | First mmWave auction |
| 39 GHz | 37-40 GHz | 5G mmWave | High capacity, short range |

### Spectrum Economics

Spectrum auctions have generated hundreds of billions of dollars worldwide. The US C-Band auction (Auction 107, 2021) raised $81.2 billion, making it the highest-grossing spectrum auction in history [29]. Spectrum cost directly affects the economics of cellular service: carriers must amortize license costs across their subscriber base.

---

## 9. Cell Planning and Frequency Reuse

Cell planning is the engineering discipline of determining cell locations, antenna heights, power levels, and frequency assignments to maximize coverage and capacity while minimizing interference [30].

### Cell Splitting

As demand grows, cells are split into smaller cells to increase capacity. The progression:

```
CELL SIZE HIERARCHY
================================================================

  Macrocell:   1-30 km radius   (rural/suburban, tower-mounted)
  Microcell:   200m-2 km        (urban streets, rooftop-mounted)
  Picocell:    100-200m         (indoor, office building)
  Femtocell:   10-50m           (home, small office)
  Small cell:  generic term for micro/pico/femto

  Capacity scaling:
    Split each cell into 4 smaller cells → 4x capacity
    (each smaller cell reuses the full frequency set)

  Trade-off:
    More cells = more capacity but also:
    - More handoffs (user crosses boundaries more often)
    - More backhaul connections required
    - Higher infrastructure cost
    - More complex interference management
```

### Sectorization

Dividing each cell into sectors using directional antennas (typically 3 sectors at 120 degrees each) provides approximately 2.5x capacity gain with minimal additional infrastructure [31].

---

## 10. Handoff and Mobility Management

Handoff (handover) is the process of transferring an active call or data session from one cell to another as the user moves. The engineering of seamless handoff is what makes cellular telephony feel continuous rather than fragmented [32].

### Handoff Types

- **Hard handoff:** Connection to old cell is broken before connection to new cell is established ("break before make"). Used in FDMA/TDMA systems. Brief interruption possible.
- **Soft handoff:** Connection to new cell is established before old cell is released ("make before break"). Used in CDMA systems. The mobile communicates with both cells simultaneously; diversity combining improves quality during transition [33].
- **Inter-RAT handoff:** Transfer between different radio access technologies (e.g., LTE to 3G fallback for voice).

### Location Management

The cellular network must know which cell a mobile is in to route incoming calls. Two databases maintain location information:

- **HLR (Home Location Register):** Permanent subscriber data and current serving area [34].
- **VLR (Visitor Location Register):** Temporary data for subscribers currently in a serving area.

In 4G/5G, these functions are consolidated in the HSS (Home Subscriber Server) and AMF (Access and Mobility Management Function) [35].

---

## 11. Backhaul and Core Network Evolution

The connection between cell sites and the core network -- backhaul -- has evolved from T1 copper circuits to fiber and microwave links [36].

```
BACKHAUL EVOLUTION
================================================================

  1G-2G:  T1/E1 copper (1.5/2 Mbps per link)
  3G:     Multiple T1/E1, early Ethernet/fiber
  4G:     Gigabit Ethernet over fiber
  5G:     10/25/100 Gbps fiber; eCPRI fronthaul

  5G fronthaul/midhaul/backhaul:
    Radio Unit (RU) ──[fronthaul]──> Distributed Unit (DU)
                                          |
                                     [midhaul]
                                          |
                                     Centralized Unit (CU)
                                          |
                                      [backhaul]
                                          |
                                     5G Core (5GC)
```

### Core Network Evolution

```
CORE NETWORK ARCHITECTURE BY GENERATION
================================================================

  2G:  MSC (Mobile Switching Center) -- circuit-switched voice
       SGSN/GGSN -- packet-switched data (GPRS/EDGE)

  3G:  MSC + SGSN/GGSN (shared with 2G)
       RNC (Radio Network Controller) -- manages NodeBs

  4G:  EPC (Evolved Packet Core) -- all-IP
       MME, S-GW, P-GW, HSS, PCRF

  5G:  5GC (5G Core) -- service-based architecture
       AMF, SMF, UPF, NRF, NSSF, PCF, UDM, AUSF
       All network functions are microservices
       Cloud-native, containerized, API-driven
```

The 5G core network is designed as a cloud-native microservices architecture, where each network function (AMF, SMF, UPF, etc.) runs as an independent service communicating via RESTful APIs [37]. This enables network slicing, where multiple virtual networks with different characteristics run on shared infrastructure.

> **Related:** [Smartphone Architecture](04-smartphone-architecture-baseband.md) for the device-side radio implementation. [Mesh Communications](06-mesh-communications.md) for decentralized alternatives to cellular architecture.

---

## 12. Cross-References

- **SGL (Signal & Light):** DSP algorithms in cellular baseband processing, OFDM as FFT application
- **CMH (Computational Mesh):** Network slicing as virtualized mesh, core network microservices architecture
- **RBH (Radio History):** Spectrum regulation heritage, shared radio physics
- **PSS (PNW Signal Stack):** Regional cellular deployment, rural coverage challenges in PNW terrain
- **BRC (Black Rock City):** Temporary cellular infrastructure, cell-on-wheels (COW) deployments
- **SHE (Smart Home):** Femtocell/small cell as home networking component
- **LED (LED & Controllers):** Tower warning lights, status indicators on base station equipment
- **FCC:** Spectrum auction economics, RF exposure limits, tower siting regulations

---

## 13. Sources

1. Ring, D.H. "Mobile Telephony -- Wide Area Coverage." Bell Telephone Laboratories Technical Memorandum, December 11, 1947.
2. Rappaport, T.S. *Wireless Communications: Principles and Practice.* 2nd ed., Prentice Hall, 2002.
3. Shannon, C.E. "A Mathematical Theory of Communication." *Bell System Technical Journal* 27 (1948): 379-423, 623-656.
4. Farley, T. "Mobile Telephone History." *Telektronikk* 101.3/4 (2005): 22-34.
5. Strassburg, B.B. "Cellular Radio -- A New Era in Mobile Communications." *IEEE Communications Magazine* 22.11 (1984): 1-4.
6. FCC. "Report on Cellular Telephone Fraud." FCC OPP Working Paper No. 27, 1995.
7. FCC Report and Order 02-301, "Termination of Analog AMPS Service," November 2007.
8. Mouly, M. and Pautet, M.B. *The GSM System for Mobile Communications.* Telecom Publishing, 1992.
9. ETSI TS 151.011, "Specification of the Subscriber Identity Module -- Mobile Equipment (SIM-ME) Interface."
10. TIA/EIA IS-136, "TDMA Cellular/PCS -- Radio Interface -- Mobile Station -- Base Station Compatibility," 1996.
11. Viterbi, A.J. *CDMA: Principles of Spread Spectrum Communication.* Addison-Wesley, 1995.
12. FCC OET Bulletin 65, "Evaluating Compliance with FCC Guidelines for Human Exposure to Radiofrequency Electromagnetic Fields," Edition 97-01, August 1997.
13. Goldsmith, A. *Wireless Communications.* Cambridge University Press, 2005.
14. Holma, H. and Toskala, A. *WCDMA for UMTS: HSPA Evolution and LTE.* 5th ed., Wiley, 2010.
15. Garg, V.K. *IS-95 CDMA and cdma2000: Cellular/PCS Systems Implementation.* Prentice Hall, 2000.
16. ITU-R. "IMT-2000 Specifications." ITU Radiocommunication Study Groups, 1999.
17. 3GPP TS 36.300, "Evolved Universal Terrestrial Radio Access (E-UTRA) and Evolved UTRAN; Overall Description."
18. Dahlman, E. et al. *4G LTE/LTE-Advanced for Mobile Broadband.* Academic Press, 2011.
19. Tse, D. and Viswanath, P. *Fundamentals of Wireless Communication.* Cambridge University Press, 2005.
20. Paulraj, A., Nabar, R., and Gore, D. *Introduction to Space-Time Wireless Communications.* Cambridge University Press, 2003.
21. 3GPP TS 23.228, "IP Multimedia Subsystem (IMS); Stage 2."
22. 3GPP TS 38.300, "NR; Overall Description; Stage 2."
23. Dahlman, E. et al. *5G NR: The Next Generation Wireless Access Technology.* Academic Press, 2018.
24. Marzetta, T.L. "Noncooperative Cellular Wireless with Unlimited Numbers of Base Station Antennas." *IEEE Transactions on Wireless Communications* 9.11 (2010): 3590-3600.
25. Rappaport, T.S. et al. "Millimeter Wave Mobile Communications for 5G Cellular." *IEEE Access* 1 (2013): 335-349.
26. NGMN Alliance. "Description of Network Slicing Concept." NGMN 5G White Paper, January 2016.
27. FCC OET Bulletin 65, Supplement C, "Evaluating Compliance with FCC Guidelines for Broadband Radiofrequency Emissions from Mobile and Portable Devices," 2019.
28. ITU Radio Regulations, Articles 5 and 9. International Telecommunication Union, 2020 Edition.
29. FCC. "Auction 107: C-Band Spectrum Auction Results." FCC Public Notice DA 21-245, February 2021.
30. Jakes, W.C. *Microwave Mobile Communications.* IEEE Press, 1974 (reprinted 1994).
31. Lee, W.C.Y. *Mobile Cellular Telecommunications: Analog and Digital Systems.* 2nd ed., McGraw-Hill, 1995.
32. Pollini, G.P. "Trends in Handover Design." *IEEE Communications Magazine* 34.3 (1996): 82-90.
33. Viterbi, A.J. et al. "Soft Handoff Extends CDMA Cell Coverage." *Journal on Selected Areas in Communications* 12.8 (1994): 1281-1288.
34. 3GPP TS 23.002, "Network Architecture."
35. 3GPP TS 23.501, "System Architecture for the 5G System."
36. Jungnickel, V. et al. "The Role of Small Cells, Coordinated Multipoint, and Massive MIMO in 5G." *IEEE Communications Magazine* 52.5 (2014): 44-51.
37. 3GPP TS 29.500, "5G System; Technical Realization of Service Based Architecture."
