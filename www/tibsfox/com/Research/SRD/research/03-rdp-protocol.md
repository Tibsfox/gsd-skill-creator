# RDP Protocol

> **Domain:** Remote Access Protocols
> **Module:** 3 -- 10-Phase Connection, Virtual Channels & Graphics
> **Through-line:** *Where SSH optimizes for text and simplicity, RDP optimizes for fidelity -- the complete Windows desktop experience across a network. Its 10-phase connection sequence is complex precisely because it must negotiate a rich set of capabilities: graphics codecs, audio redirection, device mapping, multi-monitor support, and security modes that have evolved across 25 years of Windows releases.*

---

## Table of Contents

1. [Protocol Overview](#1-protocol-overview)
2. [Connection Sequence](#2-connection-sequence)
3. [X.224 and MCS Framing](#3-x224-and-mcs-framing)
4. [Security Modes](#4-security-modes)
5. [Virtual Channels](#5-virtual-channels)
6. [Graphics Pipeline](#6-graphics-pipeline)
7. [Input Handling](#7-input-handling)
8. [Audio and Multimedia](#8-audio-and-multimedia)
9. [Device Redirection](#9-device-redirection)
10. [Network Characteristics](#10-network-characteristics)
11. [Sources](#11-sources)

---

## 1. Protocol Overview

Remote Desktop Protocol (RDP) is Microsoft's proprietary remote display protocol, formally specified as MS-RDPBCGR (Remote Desktop Protocol: Basic Connectivity and Graphics Remoting). It builds on ITU-T T.120 series standards: T.125 (Multipoint Communication Service / MCS) for channel multiplexing, and X.224 for connection-oriented transport [1].

RDP operates on TCP port 3389 by default. Since RDP 8.0 (Windows 8/Server 2012), UDP transport is also supported for lossy/real-time channels.

---

## 2. Connection Sequence

The RDP connection involves 10 sequential phases, each building on the previous [1]:

| Phase | Name | Key PDUs |
|---|---|---|
| 1 | Connection Initiation | X.224 Connection Request / Confirm |
| 2 | Basic Settings Exchange | MCS Connect Initial / Response (GCC Conference) |
| 3 | Channel Connection | MCS Erect Domain, Attach User, Channel Join (I/O + static VCs) |
| 4 | RDP Security Commencement | Security Exchange PDU (if Standard RDP Security) |
| 5 | Secure Settings Exchange | Client Info PDU (user credentials, locale, flags) |
| 6 | Optional Connect-Time Auto-Detection | RTT measurement, bandwidth estimation |
| 7 | Licensing | License sequence (may be "no license required" for personal editions) |
| 8 | Capabilities Exchange | Demand Active PDU / Confirm Active PDU |
| 9 | Connection Finalization | Synchronize, Control (Cooperate + Request Control), Font Map |
| 10 | Data Exchange | Input PDUs, Graphics Update PDUs, Audio, Device Redirection |

### Phase 1: Connection Initiation

The client sends an X.224 Connection Request containing a cookie string and requested security protocols (Standard/TLS/CredSSP). The server responds with X.224 Connection Confirm selecting one security protocol [1].

### Phase 2: Basic Settings Exchange

Uses MCS Connect Initial / Response wrapped in GCC (T.124) Conference Create Request. Core data blocks exchanged include: client version, desktop resolution, color depth, keyboard layout, client name, and requested security protocol [1].

### Phase 8: Capabilities Exchange

The server sends a Demand Active PDU containing its capability sets. Key capability sets include:

| Capability Set | Purpose |
|---|---|
| General | Protocol version, OS type, compression flags |
| Bitmap | Desktop dimensions, color depth, compression support |
| Order | Drawing order support (PatBlt, DstBlt, ScreenBlt, LineTo, etc.) |
| Input | Input event types, keyboard layout, IME |
| Virtual Channel | VC compression, chunk size (default 1,600 bytes) |
| Sound | Audio redirection capability |
| Surface Commands | Codec-accelerated graphics (RemoteFX, AVC/H.264) |

---

## 3. X.224 and MCS Framing

All RDP data is framed within MCS (T.125) Send Data PDUs, which are in turn carried inside X.224 Data TPDUs. The MCS layer provides channel multiplexing -- each static virtual channel and the I/O channel are MCS channels identified by 16-bit channel IDs [1].

```
RDP PDU FRAMING
================================================================
  X.224 Data TPDU
    +-- MCS Send Data Request/Indication
         +-- RDP Security Header (if Standard RDP Security)
              +-- RDP PDU (Share Control Header)
                   +-- Graphics / Input / VC Data
```

---

## 4. Security Modes

| Mode | Encryption | Authentication | Introduced |
|---|---|---|---|
| Standard RDP Security | RC4 (40/56/128-bit) | Server certificate | RDP 5.0 |
| Enhanced (TLS) | TLS 1.0-1.3 | Server TLS certificate | RDP 5.2 |
| NLA (CredSSP) | TLS + CredSSP | NTLM/Kerberos pre-auth | RDP 6.0 |

**NLA (Network Level Authentication)** requires client authentication before the full RDP connection is established. This mitigates denial-of-service attacks and reduces the attack surface exposed to unauthenticated clients [1].

> **SAFETY: Standard RDP Security uses RC4, which is cryptographically broken.** Always use NLA/TLS mode in production. The BlueKeep vulnerability (CVE-2019-0708) specifically targeted the pre-authentication phase of Standard RDP Security.

---

## 5. Virtual Channels

RDP supports two types of virtual channels [1]:

### Static Virtual Channels (SVCs)
- Maximum 31 per connection
- Established during Phase 3 (MCS Channel Join)
- Each gets a unique MCS channel ID
- Data chunked to VC chunk size (default 1,600 bytes)
- Reassembled using CHANNEL_FLAG_FIRST and CHANNEL_FLAG_LAST flags
- Standard channels: rdpdr (device redirection), rdpsnd (sound), cliprdr (clipboard), drdynvc (dynamic VC manager)

### Dynamic Virtual Channels (DVCs)
- Created on demand over the "drdynvc" static channel
- No 31-channel limit
- Used for RemoteFX graphics, USB redirection, audio input, multitouch

---

## 6. Graphics Pipeline

RDP has evolved through multiple graphics approaches:

| Generation | Technology | Encoding | Latency |
|---|---|---|---|
| Classic | GDI drawing orders | PatBlt, ScreenBlt, MemBlt | Low (vector) |
| RDP 7.0 | Bitmap codecs | NSCodec, RemoteFX | Medium |
| RDP 8.0+ | AVC/H.264 (via MS-RDPEUDP) | H.264 progressive | Adaptive |
| RDP 10 | RDPGFX + AVC444 | H.264 4:4:4 chroma | Low |

The server chooses the graphics pipeline based on negotiated capabilities. Modern connections typically use RDPGFX (Graphics Pipeline Extension) with H.264 encoding for screen content [1].

---

## 7. Input Handling

Client input is sent as Input Event PDUs containing:
- Keyboard events (key down/up, scan codes, Unicode)
- Mouse events (move, button down/up, wheel)
- Extended mouse (XBUTTON1/2)
- Touch/multitouch (via dynamic virtual channel)

All input events include a 32-bit timestamp (milliseconds since connection start).

---

## 8. Audio and Multimedia

- **rdpsnd** static virtual channel: server-to-client audio redirection
- **audin** dynamic virtual channel: client-to-server audio capture (microphone)
- Supported codecs: PCM, MS-ADPCM, AAC, Opus
- Video redirection (TSMF): multimedia streams decoded on client GPU

---

## 9. Device Redirection

The **rdpdr** (RDP Device Redirection) static virtual channel provides:
- Drive mapping (client drives appear as network drives on server)
- Printer redirection
- Serial/parallel port redirection
- Smart card redirection

---

## 10. Network Characteristics

| Metric | Typical Value |
|---|---|
| Bandwidth (office work) | 100-500 Kbps |
| Bandwidth (video/CAD) | 2-10 Mbps |
| Latency tolerance | <150ms acceptable, >250ms degraded |
| UDP transport (RDP 8+) | Lossy channel for real-time graphics |
| Compression | Bulk compression + bitmap codec compression |

---

## 11. Sources

1. MS-RDPBCGR -- Remote Desktop Protocol: Basic Connectivity and Graphics Remoting (Microsoft Open Specifications)
2. ITU-T T.125 -- Multipoint Communication Service Protocol Specification
3. ITU-T T.124 -- Generic Conference Control (GCC)
4. MS-RDPEUDP -- Remote Desktop Protocol: UDP Transport Extension
5. MS-RDPEGFX -- Remote Desktop Protocol: Graphics Pipeline Extension
