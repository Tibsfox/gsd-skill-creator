# VoIP & SIP Convergence

> **Domain:** Packet Voice Telecommunications
> **Module:** 3 -- The Engineering of Making Packets Sound Like Circuits
> **Through-line:** *The circuit-switched telephone network guaranteed quality by dedicating a physical path for the duration of every call. The packet-switched internet guarantees nothing -- packets arrive late, out of order, or not at all. VoIP is the engineering discipline of making an unreliable medium sound like a reliable one. The protocols (SIP, RTP, SRTP) are compensating for what the network refuses to promise, and doing it well enough that 70% of the world's voice traffic now rides on IP.*

---

## Table of Contents

1. [Circuit Switching vs. Packet Switching](#1-circuit-switching-vs-packet-switching)
2. [Voice Digitization and Codecs](#2-voice-digitization-and-codecs)
3. [H.323: The First VoIP Standard](#3-h323-the-first-voip-standard)
4. [SIP: Session Initiation Protocol](#4-sip-session-initiation-protocol)
5. [RTP and Media Transport](#5-rtp-and-media-transport)
6. [NAT Traversal: STUN, TURN, and ICE](#6-nat-traversal-stun-turn-and-ice)
7. [Quality of Service Engineering](#7-quality-of-service-engineering)
8. [VoLTE and IMS](#8-volte-and-ims)
9. [WebRTC: Browser-Native Real-Time Communication](#9-webrtc-browser-native-real-time-communication)
10. [Security: SRTP and oVoIP Encryption](#10-security-srtp-and-ovoip-encryption)
11. [PBX Systems and Enterprise Voice](#11-pbx-systems-and-enterprise-voice)
12. [Cross-References](#12-cross-references)
13. [Sources](#13-sources)

---

## 1. Circuit Switching vs. Packet Switching

The fundamental architectural difference between the PSTN and VoIP is the switching paradigm [1].

**Circuit switching** (PSTN): A dedicated physical path is established between caller and callee for the entire duration of the call. Resources are reserved whether or not anyone is speaking. The path provides guaranteed bandwidth, constant delay, and in-order delivery.

**Packet switching** (IP): Voice is digitized, packetized, and sent as independent packets across a shared network. No resources are reserved. Each packet may take a different route. Packets may arrive late, out of order, duplicated, or not at all.

```
CIRCUIT SWITCHING vs. PACKET SWITCHING
================================================================

  Circuit Switched (PSTN):
    Caller ═══════════════════════════════ Callee
    (dedicated 64 kbps DS-0 for entire call)
    Pros: guaranteed quality, constant delay
    Cons: resource waste during silence, fixed bandwidth

  Packet Switched (VoIP):
    Caller ──▶ [pkt1] [pkt3] [pkt2] ──▶ Callee
              (packets share network with all other traffic)
    Pros: efficient resource use, flexible bandwidth
    Cons: variable delay (jitter), packet loss, reordering

  Voice activity:
    In a typical conversation, each party speaks ~40% of the time
    Circuit switching: both 64 kbps channels active 100% of time
    Packet switching: packets sent only when speech detected
    Efficiency gain: ~2.5x bandwidth savings with VAD
```

The engineering challenge of VoIP is compensating for packet network impairments -- jitter, loss, and delay -- to produce voice quality that users accept as equivalent to or better than the PSTN [2].

---

## 2. Voice Digitization and Codecs

Voice codecs convert analog speech to digital bitstreams for transmission. The choice of codec determines bandwidth, quality, latency, and computational cost [3].

### Major Voice Codecs

| Codec | Bit Rate | Quality (MOS) | Algorithmic Delay | Standard |
|-------|----------|---------------|-------------------|----------|
| G.711 (PCM) | 64 kbps | 4.3 | 0.125 ms | ITU-T 1972 |
| G.726 (ADPCM) | 16-40 kbps | 3.8-4.1 | 0.125 ms | ITU-T 1990 |
| G.729 (CS-ACELP) | 8 kbps | 3.9 | 15 ms | ITU-T 1996 |
| G.722 (SB-ADPCM) | 48-64 kbps | 4.5 | 1.5 ms | ITU-T 1988 |
| AMR-NB | 4.75-12.2 kbps | 3.5-4.1 | 25 ms | 3GPP 1999 |
| AMR-WB (G.722.2) | 6.6-23.85 kbps | 4.0-4.5 | 25 ms | 3GPP 2001 |
| Opus | 6-510 kbps | 4.0-4.9 | 2.5-60 ms | IETF RFC 6716 |
| EVS | 5.9-128 kbps | 4.0-4.9 | 32 ms | 3GPP 2014 |

### G.711: The Foundation

G.711, standardized in 1972, is mu-law (North America) or A-law (Europe) pulse code modulation at 8 kHz sample rate, 8 bits per sample = 64 kbps [4]. It is the lowest common denominator codec -- every VoIP system supports G.711. The 300-3,400 Hz bandwidth it encodes is the same telephone band defined by the carbon microphone over a century ago.

### Opus: The Modern Standard

The Opus codec (IETF RFC 6716, 2012) is the state of the art for real-time voice and audio [5]. Opus dynamically adapts between two operating modes:

- **SILK mode** (speech): Based on Skype's SILK codec. Optimized for voice at 6-40 kbps. Linear prediction coding.
- **CELT mode** (audio): Based on Xiph.Org's CELT. Optimized for music and general audio at 64-510 kbps. Modified discrete cosine transform.

Opus operates at any bitrate from 6 to 510 kbps, with algorithmic delay as low as 2.5 ms (5 ms frame with look-ahead). It is the mandatory-to-implement codec for WebRTC (RFC 7874) [6].

```
OPUS CODEC OPERATING MODES
================================================================

  Bitrate     Mode      Quality           Use Case
  ──────────────────────────────────────────────────────
  6-12 kbps   SILK      Narrowband voice  Low bandwidth VoIP
  12-20 kbps  SILK      Wideband voice    Standard VoIP
  20-40 kbps  Hybrid    Super-wideband    HD voice
  64-128 kbps CELT      Full-band audio   Music streaming
  128-510 kbps CELT     Transparent       Studio quality

  Frame sizes: 2.5, 5, 10, 20, 40, 60 ms
  Channels: mono or stereo
  Sample rates: 8, 12, 16, 24, 48 kHz
```

### Mean Opinion Score (MOS)

Voice quality is measured using Mean Opinion Score, a 1-5 scale where listeners rate call quality [7]:

- **5:** Excellent (imperceptible degradation)
- **4:** Good (perceptible but not annoying)
- **3:** Fair (slightly annoying)
- **2:** Poor (annoying)
- **1:** Bad (very annoying)

PSTN quality (G.711) scores approximately 4.3 MOS. VoIP systems target MOS >= 3.5 for acceptable quality. Opus at 20 kbps wideband achieves MOS 4.0-4.2, comparable to or better than narrowband PSTN at one-third the bandwidth [5].

---

## 3. H.323: The First VoIP Standard

ITU-T Recommendation H.323 (1996) was the first comprehensive standard for multimedia communication over packet networks [8]. H.323 defined a complete system architecture including signaling (H.225/Q.931), media control (H.245), and registration (RAS).

### H.323 Architecture

```
H.323 NETWORK COMPONENTS
================================================================

  Terminal ──────── Gatekeeper ──────── Terminal
     |                  |                  |
     |              Registration,          |
     |              Admission,             |
     |              Bandwidth (RAS)        |
     |                  |                  |
     └──── H.225 (call signaling) ────────┘
     └──── H.245 (media control) ─────────┘
     └──── RTP/RTCP (media transport) ────┘

  Gateway: translates between H.323 and PSTN/other networks
  Gatekeeper: optional but typical; controls admission and routing
  MCU: Multipoint Control Unit for conferences
```

H.323 was widely deployed in the late 1990s and early 2000s (Microsoft NetMeeting, Polycom video systems, early Cisco VoIP). However, its complexity -- derived from the ISDN signaling model -- led to the development of the simpler SIP protocol [9].

---

## 4. SIP: Session Initiation Protocol

The Session Initiation Protocol (SIP), defined in IETF RFC 3261 (2002, replacing RFC 2543 from 1999), is the dominant signaling protocol for VoIP [10]. SIP was designed with internet principles: text-based (like HTTP), extensible, and decoupled from the media layer.

### SIP Message Structure

SIP uses request/response messages similar to HTTP:

```
SIP INVITE -- EXAMPLE CALL SETUP
================================================================

  INVITE sip:bob@example.com SIP/2.0
  Via: SIP/2.0/UDP alice-phone.example.com:5060;branch=z9hG4bK776
  Max-Forwards: 70
  To: Bob <sip:bob@example.com>
  From: Alice <sip:alice@example.com>;tag=1928301774
  Call-ID: a84b4c76e66710@alice-phone.example.com
  CSeq: 314159 INVITE
  Contact: <sip:alice@192.168.1.100:5060>
  Content-Type: application/sdp
  Content-Length: 142

  v=0
  o=alice 2890844526 2890844526 IN IP4 192.168.1.100
  s=Phone Call
  c=IN IP4 192.168.1.100
  t=0 0
  m=audio 49170 RTP/AVP 0 8 97
  a=rtpmap:0 PCMU/8000
  a=rtpmap:8 PCMA/8000
  a=rtpmap:97 opus/48000/2
```

### SIP Call Flow

```
SIP BASIC CALL FLOW (INVITE TRANSACTION)
================================================================

  Alice (UAC)          Proxy Server         Bob (UAS)
       |                    |                    |
       |--- INVITE -------->|--- INVITE -------->|
       |<-- 100 Trying -----|                    |
       |                    |<-- 180 Ringing ----|
       |<-- 180 Ringing ----|                    |
       |                    |<-- 200 OK ---------|
       |<-- 200 OK ---------|                    |
       |--- ACK ----------->|--- ACK ----------->|
       |                    |                    |
       |<=========== RTP Media Stream ===========>|
       |                    |                    |
       |--- BYE ----------->|--- BYE ----------->|
       |                    |<-- 200 OK ---------|
       |<-- 200 OK ---------|                    |
       |                    |                    |

  SDP (Session Description Protocol) in INVITE body:
    Offer/Answer model for codec negotiation
    Caller offers available codecs
    Callee answers with selected codec
```

### Key SIP Methods

- **INVITE:** Initiate a session (call setup)
- **ACK:** Confirm session establishment
- **BYE:** Terminate a session
- **REGISTER:** Register contact information with a registrar
- **OPTIONS:** Query capabilities
- **SUBSCRIBE/NOTIFY:** Event notification (presence, message waiting)
- **MESSAGE:** Instant messaging (RFC 3428)
- **REFER:** Transfer a call to another party
- **UPDATE:** Modify session parameters mid-call (RFC 3311)

### SIP Registration

```
SIP REGISTRATION FLOW
================================================================

  Phone                      Registrar/Proxy
    |                              |
    |--- REGISTER --------------->|
    |   (To: alice@example.com)   |
    |   (Contact: 192.168.1.100)  |
    |                              |
    |<-- 401 Unauthorized --------|
    |   (WWW-Authenticate: Digest)|
    |                              |
    |--- REGISTER --------------->|
    |   (Authorization: Digest...) |
    |                              |
    |<-- 200 OK ------------------|
    |   (Expires: 3600)           |
    |                              |

  Registration binds:
    Address-of-Record (AoR): sip:alice@example.com
    to Contact: sip:alice@192.168.1.100:5060
  Expires header controls re-registration interval
  Registrar stores binding in location service database
```

> **Related:** [Telephone History](01-telephone-history-switching.md) for the circuit-switched signaling (SS7) that SIP replaced. [Smartphone Architecture](04-smartphone-architecture-baseband.md) for IMS client implementation in mobile devices.

---

## 5. RTP and Media Transport

The Real-time Transport Protocol (RTP, RFC 3550) carries the actual voice data [11]. RTP runs over UDP (not TCP) because voice is latency-sensitive and retransmission of lost packets is worse than the loss itself.

### RTP Packet Structure

```
RTP HEADER FORMAT (12 bytes minimum)
================================================================

   0                   1                   2                   3
   0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1
  +-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
  |V=2|P|X|  CC   |M|     PT      |       Sequence Number         |
  +-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
  |                           Timestamp                           |
  +-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
  |                             SSRC                              |
  +-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+

  V:  Version (2)
  P:  Padding flag
  X:  Extension flag
  CC: CSRC count (contributing sources)
  M:  Marker bit (start of talk spurt)
  PT: Payload type (codec identifier)
  Sequence Number: increments per packet (detect loss/reorder)
  Timestamp: sampling clock (detect jitter)
  SSRC: Synchronization Source identifier (random 32-bit)

  Typical voice packet (G.711, 20ms frame):
    IP header:    20 bytes
    UDP header:    8 bytes
    RTP header:   12 bytes
    Payload:     160 bytes (20ms x 8000 Hz x 8 bits / 8)
    Total:       200 bytes = 80 kbps
    Packet rate: 50 packets/second
```

### RTCP: Control Protocol

RTCP (RTP Control Protocol) runs alongside RTP, providing reception quality reports (packet loss, jitter, round-trip time), participant identification, and synchronization information [11].

```
RTCP RECEPTION REPORT -- KEY METRICS
================================================================

  Fraction lost:       packets lost / packets expected (last interval)
  Cumulative lost:     total packets lost since session start
  Jitter:              inter-arrival time variation (smoothed)
  Last SR timestamp:   when last sender report was received
  Delay since last SR: time between receiving SR and sending this RR

  These metrics enable:
    - Codec adaptation (switch to lower rate if loss detected)
    - Network quality monitoring
    - MOS estimation (E-model, R-factor calculation)
```

---

## 6. NAT Traversal: STUN, TURN, and ICE

Network Address Translation (NAT) is the primary obstacle to peer-to-peer VoIP connectivity. SIP and SDP carry IP addresses in their message bodies, but these addresses are often private (RFC 1918) and unreachable from the public internet [12].

### The NAT Problem

```
NAT TRAVERSAL PROBLEM
================================================================

  Alice (private)         NAT            Internet        Bob (public)
  192.168.1.100    ──> 203.0.113.1 ──────────────> 198.51.100.5
                        (translates                       |
                         source addr)                     |
  SIP INVITE body says:                                   |
    c=IN IP4 192.168.1.100  ← WRONG! Bob can't reach this
    m=audio 49170           ← port on private network

  Bob tries to send RTP to 192.168.1.100:49170
  → packet is dropped (unreachable private address)
  → one-way audio or no audio
```

### STUN (Session Traversal Utilities for NAT)

STUN (RFC 5389) allows a client behind NAT to discover its public IP address and port mapping [13].

```
STUN DISCOVERY
================================================================

  Client (behind NAT)         STUN Server (public)
         |                          |
         |--- Binding Request ----->|
         |   (from 192.168.1.100:12345)
         |   (NAT maps to 203.0.113.1:54321)
         |                          |
         |<-- Binding Response -----|
         |   "Your public address is 203.0.113.1:54321"
         |                          |

  Client can now use 203.0.113.1:54321 in SDP
```

### TURN (Traversal Using Relays around NAT)

When direct connectivity fails (symmetric NAT), TURN (RFC 5766) provides a relay server that forwards media between parties [14]. TURN adds latency and server cost but guarantees connectivity.

### ICE (Interactive Connectivity Establishment)

ICE (RFC 8445) is the framework that orchestrates STUN and TURN to find the best connectivity path [15].

```
ICE CANDIDATE GATHERING AND SELECTION
================================================================

  1. Gather candidates:
     - Host candidates: local IP addresses
     - Server-reflexive: discovered via STUN
     - Relay: allocated via TURN

  2. Exchange candidates via SIP/SDP

  3. Connectivity checks:
     - Test all candidate pairs (local x remote)
     - STUN binding requests on each pair
     - Measure RTT for successful pairs

  4. Select best pair:
     Priority: host > server-reflexive > relay
     (minimize latency, avoid relay if possible)

  5. Begin media on selected pair

  Typical result:
    ~80% of calls: direct (host or server-reflexive)
    ~15% of calls: TURN relay required
    ~5% of calls: ICE failure → fallback or call failure
```

> **SAFETY WARNING:** VoIP emergency calls (E911) require accurate location information. Unlike POTS, where the calling address is permanently registered in the ALI (Automatic Location Identification) database, VoIP endpoints can be anywhere. FCC rules (47 CFR 9.11) require interconnected VoIP providers to transmit location information to PSAPs. Incorrectly configured VoIP E911 can route emergency responders to the wrong location [16].

---

## 7. Quality of Service Engineering

Voice quality over IP networks depends on three impairment factors: delay, jitter, and packet loss [17].

### Impairment Budgets

```
VOIP QUALITY PARAMETERS
================================================================

  Parameter              Target (excellent)    Degraded
  ──────────────────────────────────────────────────────
  One-way delay          < 150 ms              > 300 ms (unacceptable)
  Jitter (variation)     < 30 ms               > 50 ms
  Packet loss            < 1%                  > 5% (unacceptable)
  MOS score              > 4.0                 < 3.5

  Delay budget breakdown (typical VoIP call):
    Codec algorithmic delay:     15 ms (G.729) / 20 ms (frame)
    Packetization:               20 ms (one frame per packet)
    Serialization:               <1 ms (at broadband speeds)
    Network propagation:         10-100 ms (depends on distance)
    Jitter buffer:               20-60 ms (playback buffer)
    ────────────────────────────────────
    Total:                       ~65-200 ms one-way

  ITU-T G.114 recommendation:
    < 150 ms one-way: acceptable for most users
    150-400 ms: acceptable with awareness
    > 400 ms: unacceptable for interactive conversation
```

### Jitter Buffer

The jitter buffer is the critical compensator for network timing variation. It delays playback of received packets to smooth out arrival time differences [18].

```
JITTER BUFFER OPERATION
================================================================

  Packet arrival times:  |  |    |  |     ||  |   |
  (irregular due to jitter)

  After jitter buffer:   |  |  |  |  |  |  |  |  |
  (regular playback intervals)

  Buffer types:
    Static:   fixed delay (e.g., 60 ms)
              Simple but wastes delay budget
    Adaptive: adjusts delay based on measured jitter
              Minimizes delay while absorbing transients
              Typical range: 20-200 ms

  Trade-off:
    Larger buffer → less packet loss but more delay
    Smaller buffer → less delay but more packet loss
    Optimal: just large enough to absorb 95th percentile jitter
```

### E-Model (ITU-T G.107)

The E-model is a computational model for predicting voice quality on VoIP calls, producing an R-factor (0-100) that maps to MOS [19].

```
E-MODEL QUALITY PREDICTION
================================================================

  R = R0 - Is - Id - Ie + A

  R0: base signal-to-noise ratio (94.77 for default)
  Is: simultaneous impairments (quantization, etc.)
  Id: delay impairments (echo, absolute delay)
  Ie: equipment impairments (codec distortion + packet loss)
  A:  advantage factor (cellular +5, satellite +20)

  R to MOS mapping:
    R > 90:  MOS > 4.3  (very satisfied)
    80-90:   MOS 4.0-4.3 (satisfied)
    70-80:   MOS 3.6-4.0 (some dissatisfied)
    60-70:   MOS 3.1-3.6 (many dissatisfied)
    R < 60:  MOS < 3.1  (not recommended)

  Typical R values:
    G.711 + 0% loss + 100ms delay:  R ≈ 89
    G.729 + 1% loss + 150ms delay:  R ≈ 72
    Opus 20kbps + 2% loss + 200ms:  R ≈ 67
```

---

## 8. VoLTE and IMS

Voice over LTE (VoLTE) is the standard mechanism for carrying voice calls on 4G/5G networks, using the IP Multimedia Subsystem (IMS) architecture defined by 3GPP [20].

### IMS Architecture

```
IMS NETWORK ARCHITECTURE
================================================================

  UE (phone)
    |
    | SIP over IPsec
    v
  P-CSCF (Proxy Call Session Control Function)
    |         -- first SIP contact point
    v
  I-CSCF (Interrogating CSCF)
    |         -- routes to correct S-CSCF
    v
  S-CSCF (Serving CSCF)
    |         -- SIP registrar + call processing
    |
    ├──> HSS (Home Subscriber Server) -- subscriber data
    ├──> AS (Application Server) -- supplementary services
    └──> MGCF (Media Gateway Control Function) -- PSTN breakout
              |
              v
         MGW (Media Gateway) ──> PSTN
```

VoLTE uses the AMR-WB (G.722.2) or EVS codec for wideband voice (50-7,000 Hz), delivering significantly better audio quality than narrowband PSTN calls [21]. The wider bandwidth makes voices more natural and distinguishable, improving both intelligibility and speaker recognition.

---

## 9. WebRTC: Browser-Native Real-Time Communication

Web Real-Time Communication (WebRTC), standardized by W3C and IETF, enables peer-to-peer voice, video, and data communication directly in web browsers without plugins [22].

### WebRTC Protocol Stack

```
WEBRTC PROTOCOL STACK
================================================================

  Application (JavaScript API)
       |
  ┌────┴────────────────────────────────┐
  │ getUserMedia() -- camera/microphone  │
  │ RTCPeerConnection -- media session   │
  │ RTCDataChannel -- arbitrary data     │
  └────┬────────────────────────────────┘
       |
  ┌────┴────────────────────────────────┐
  │ SRTP (encrypted media)              │
  │ SCTP/DTLS (encrypted data channels) │
  │ DTLS (key exchange)                 │
  │ ICE/STUN/TURN (NAT traversal)      │
  └────┬────────────────────────────────┘
       |
  ┌────┴────────────────────────────────┐
  │ UDP (transport)                     │
  │ IP (network)                        │
  └─────────────────────────────────────┘

  Mandatory codecs:
    Audio: Opus (RFC 7874)
    Video: VP8 or H.264 (RFC 7742)
  Security: DTLS-SRTP (mandatory encryption, no opt-out)
```

WebRTC's mandatory encryption (DTLS-SRTP) means that all WebRTC media is encrypted by default -- there is no unencrypted mode. This was a deliberate design decision to prevent downgrade attacks [23].

---

## 10. Security: SRTP and VoIP Encryption

### SRTP (Secure Real-time Transport Protocol)

SRTP (RFC 3711) provides confidentiality, message authentication, and replay protection for RTP media [24].

```
SRTP ENCRYPTION
================================================================

  Key exchange methods:
    SDES:   Key in SDP (requires secure SIP transport)
    DTLS-SRTP: Key exchange via DTLS handshake (WebRTC)
    ZRTP:   Key exchange in media path (Okey, no trust in server)

  Encryption:
    Default: AES-128 Counter Mode
    Authentication: HMAC-SHA1 (80-bit tag)

  ZRTP (RFC 6189) -- Phil Zimmermann's protocol:
    Diffie-Hellman key exchange in RTP media path
    Short Authentication String (SAS) -- users verbally verify
    No reliance on certificate authorities or server trust
    "If you can verify a 4-character string with the other party,
     your call is secure against man-in-the-middle."
```

### SIP Security

SIP signaling can be secured via TLS (SIP over TLS, "sips:" URI scheme). Without TLS, SIP messages -- including caller/callee identities, call metadata, and SDP content -- are transmitted in cleartext [25].

> **SAFETY WARNING:** Unencrypted VoIP (SIP without TLS, RTP without SRTP) is trivially interceptable by anyone with network access. VoIP calls traversing public WiFi networks without encryption are equivalent to analog cellphone calls from the AMPS era -- anyone can listen. Enterprise and residential VoIP users should verify that both signaling (SIP/TLS) and media (SRTP) encryption are enabled [25].

---

## 11. PBX Systems and Enterprise Voice

The Private Branch Exchange (PBX) has evolved from electromechanical hardware to software running on standard servers [26].

### PBX Evolution

```
PBX TECHNOLOGY EVOLUTION
================================================================

  1960s-1980s: Electromechanical PBX
    - Crossbar or relay-based switching
    - Dedicated hardware, proprietary
    - Example: AT&T Dimension PBX

  1980s-2000s: Digital PBX
    - TDM switching fabric
    - Proprietary digital phones
    - Examples: Nortel Meridian, Avaya Definity/Communication Manager
    - ISDN PRI trunking to PSTN

  2000s-present: IP PBX
    - SIP-based call control
    - Standard IP phones or softphones
    - SIP trunking to PSTN (replaces PRI)
    - Examples: Cisco CUCM, Asterisk (open source), FreeSWITCH

  2015-present: Cloud PBX (UCaaS)
    - Hosted in cloud (no on-premise hardware)
    - Examples: Microsoft Teams, Zoom Phone, RingCentral
    - PSTN connectivity via cloud SIP trunking
```

### Asterisk

Asterisk, created by Mark Spencer in 1999, is the most widely deployed open-source PBX platform [27]. Written in C, Asterisk runs on Linux and provides call processing, voicemail, conferencing, IVR, and SIP/DAHDI/PJSIP channel drivers. Asterisk demonstrated that telephony switching -- once requiring millions of dollars of proprietary hardware -- could run on commodity server hardware.

> **Related:** [PNW Telecom Heritage](05-pnw-telecom-heritage.md) for how VoIP disrupted incumbent carriers in the Pacific Northwest. [Mesh Communications](06-mesh-communications.md) for decentralized VoIP over mesh networks.

---

## 12. Cross-References

- **SHE (Smart Home):** SIP-based home phones, smart speaker voice calling, VoIP as home telephone replacement
- **SYS (Systems Admin):** PBX server administration, SIP trunk configuration, QoS policy management
- **CMH (Computational Mesh):** WebRTC data channels for mesh signaling, peer-to-peer media routing
- **SGL (Signal & Light):** Audio codec DSP internals, echo cancellation algorithms, jitter buffer design
- **DAA (Deep Audio):** Codec internals, psychoacoustic principles in voice compression
- **PSS (PNW Signal Stack):** Regional VoIP deployment, rural broadband quality for VoIP viability
- **BRC (Black Rock City):** Event VoIP infrastructure, temporary SIP deployments

---

## 13. Sources

1. Goralski, W. and Kolon, M.C. *IP Telephony.* McGraw-Hill, 2000.
2. Collins, D. *Carrier Grade Voice over IP.* 3rd ed., McGraw-Hill, 2003.
3. Hersent, O., Petit, J.P., and Gurle, D. *Beyond VoIP Protocols: Understanding Voice Technology and Networking Techniques for IP Telephony.* Wiley, 2005.
4. ITU-T Recommendation G.711, "Pulse Code Modulation (PCM) of Voice Frequencies," 1988.
5. Valin, J.M. et al. "Definition of the Opus Audio Codec." IETF RFC 6716, September 2012.
6. Spittka, J. et al. "WebRTC Audio Codec and Processing Requirements." IETF RFC 7874, May 2016.
7. ITU-T Recommendation P.800, "Methods for Subjective Determination of Transmission Quality," 1996.
8. ITU-T Recommendation H.323, "Packet-based Multimedia Communications Systems," Version 7, 2009.
9. Ozer, J. "The H.323-SIP Transition." *EMedia Magazine,* March 2003.
10. Rosenberg, J. et al. "SIP: Session Initiation Protocol." IETF RFC 3261, June 2002.
11. Schulzrinne, H. et al. "RTP: A Transport Protocol for Real-Time Applications." IETF RFC 3550, July 2003.
12. Rosenberg, J. and Schulzrinne, H. "An Extension to the Session Initiation Protocol (SIP) for Symmetric Response Routing." IETF RFC 3581, August 2003.
13. Rosenberg, J. et al. "Session Traversal Utilities for NAT (STUN)." IETF RFC 5389, October 2008.
14. Mahy, R. et al. "Traversal Using Relays around NAT (TURN)." IETF RFC 5766, April 2010.
15. Keranen, A. et al. "Interactive Connectivity Establishment (ICE)." IETF RFC 8445, July 2018.
16. FCC 47 CFR 9.11, "E911 Requirements for Interconnected VoIP Services."
17. ITU-T Recommendation G.114, "One-Way Transmission Time," 2003.
18. Ramjee, R. et al. "Adaptive Playout Mechanisms for Packetized Audio Applications in Wide-Area Networks." *IEEE INFOCOM,* 1994: 680-688.
19. ITU-T Recommendation G.107, "The E-model: A Computational Model for Use in Transmission Planning," 2015.
20. 3GPP TS 23.228, "IP Multimedia Subsystem (IMS); Stage 2."
21. 3GPP TS 26.441, "Codec for Enhanced Voice Services (EVS); General Overview."
22. Loreto, S. and Romano, S.P. *Real-Time Communication with WebRTC.* O'Reilly, 2014.
23. Rescorla, E. "WebRTC Security Architecture." IETF RFC 8827, January 2021.
24. Baugher, M. et al. "The Secure Real-time Transport Protocol (SRTP)." IETF RFC 3711, March 2004.
25. Ozer, M.A. "VoIP Security Fundamentals." Cisco Press, 2007.
26. Sulkin, A. *PBX Systems for IP Telephony.* McGraw-Hill, 2002.
27. Van Meggelen, J., Madsen, L., and Bryant, R. *Asterisk: The Definitive Guide.* 5th ed., O'Reilly, 2019.
