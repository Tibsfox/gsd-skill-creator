# DMX512 & Stage Lighting

> **Domain:** Lighting Control Protocols
> **Module:** 5 -- DMX512, RDM, Art-Net, sACN, and Stage Lighting Network Design
> **Through-line:** *In 1986, USITT needed a way to control theater dimmers over a single cable. They designed DMX512 -- 512 channels of 8-bit data on RS-485 differential signaling, refreshing at 44 Hz. Forty years later, the same protocol (or its Ethernet descendants) controls millions of individually addressable LED pixels in concert tours, architectural installations, and broadcast studios.* The protocol survived because it was simple enough to be correct, and correct enough to be trusted.

---

## Table of Contents

1. [DMX512 Protocol Specification](#1-dmx512-protocol-specification)
2. [RS-485 Physical Layer](#2-rs-485-physical-layer)
3. [DMX Packet Structure and Timing](#3-dmx-packet-structure-and-timing)
4. [RDM: Remote Device Management](#4-rdm-remote-device-management)
5. [Art-Net: DMX over Ethernet](#5-art-net-dmx-over-ethernet)
6. [sACN (E1.31): Streaming ACN](#6-sacn-e131-streaming-acn)
7. [Art-Net vs. sACN Comparison](#7-art-net-vs-sacn-comparison)
8. [Pixel Mapping and Universe Planning](#8-pixel-mapping-and-universe-planning)
9. [Network Design for Large Installations](#9-network-design-for-large-installations)
10. [Wireless DMX](#10-wireless-dmx)
11. [Safety and Electrical Considerations](#11-safety-and-electrical-considerations)
12. [Cross-References](#12-cross-references)
13. [Sources](#13-sources)

---

## 1. DMX512 Protocol Specification

DMX512 (Digital Multiplex with 512 pieces of information) was standardized as ANSI E1.11-2008 by USITT (United States Institute for Theatre Technology). It is a unidirectional, serial communication protocol designed to control stage lighting dimmers from a central console [1].

### Key Specifications

| Parameter | Value |
|---|---|
| Standard | ANSI E1.11-2008 (USITT DMX512-A) |
| Baud rate | 250,000 bps |
| Physical layer | EIA-485 (RS-485) differential signaling |
| Channels per universe | 512 (numbered 1-512) |
| Channel resolution | 8 bits (0-255) |
| Connector | XLR-5 (standard), XLR-3 (common but non-standard) |
| Topology | Daisy chain (multi-drop bus) |
| Max devices per chain | 32 |
| Max cable length | 300-1000 feet (depends on cable quality) |
| Refresh rate (full 512 ch) | ~44 Hz (22.7 ms per frame) |

### Start Code

The first byte after the break/MAB is the start code. A start code of 0x00 indicates standard dimmer/intensity data. Other start codes are used for:
- 0xCC -- RDM (Remote Device Management)
- 0x17 -- Text packets
- 0x55 -- System Information Packets (SIP)
- 0xCF -- Sub-device management messages

---

## 2. RS-485 Physical Layer

EIA-485 (RS-485) uses differential signaling on a twisted-pair cable. The voltage difference between the two signal lines (Data+ and Data-) determines the logic level [2]:

```
RS-485 DIFFERENTIAL SIGNALING
================================================================

  Voltage (referenced to ground):

  Data+ ─────┐     ┌─────┐     ┌─────
              │     │     │     │
              └─────┘     └─────┘

  Data- ┐     ┌─────┐     ┌─────┐
        │     │     │     │     │
        └─────┘     └─────┘     └─────

  Logic:  1     0     1     0     1

  Differential voltage = Data+ - Data-
    > +200 mV = Logic 1 (mark)
    < -200 mV = Logic 0 (space)

  Driver output: +/- 1.5V to +/- 6V (typical: +/- 3V)
  Receiver sensitivity: +/- 200 mV minimum
  Common-mode rejection: up to +/- 7V
```

### Termination

A 120-ohm terminating resistor at the end of each daisy chain prevents signal reflections that cause data corruption. The termination impedance matches the characteristic impedance of standard DMX cable (120 ohm nominal).

### Cable Specifications

- **Wire type:** Twisted pair, 120 ohm impedance, 22-24 AWG
- **Recommended cable:** EIA-485 rated, low-capacitance (< 30 pF/ft)
- **Maximum length:** 300m (1000 ft) with quality cable and proper termination
- **Common mistake:** Using microphone cable (75 ohm, high capacitance) for DMX -- works for short runs but degrades signal quality beyond 50m

> **SAFETY WARNING: Never use DMX cables for microphone signals or vice versa without understanding the impedance mismatch.** While XLR connectors are physically identical, microphone cable impedance (75 ohm) differs from DMX cable impedance (120 ohm). Using the wrong cable type can cause intermittent signal errors at distances beyond 15m [3].

---

## 3. DMX Packet Structure and Timing

A complete DMX512 packet consists of the following elements, transmitted serially [4]:

```
DMX512 PACKET TIMING
================================================================

  ┌─────┬─────┬──────┬───────┬───────┬───┬───────┐
  │BREAK│ MAB │START │ CH 1  │ CH 2  │...│CH 512 │
  │     │     │CODE  │       │       │   │       │
  └─────┴─────┴──────┴───────┴───────┴───┴───────┘

  BREAK:     Minimum 88 us low (typical: 176 us)
  MAB:       Minimum 8 us high (mark-after-break)
  START CODE: 1 start bit + 8 data bits + 2 stop bits = 44 us
  CHANNEL:   1 start bit + 8 data bits + 2 stop bits = 44 us
  MTBF:      Mark time between frames (optional, 0-1 s)

  Total frame time (512 channels):
    Break (176 us) + MAB (12 us) + Start Code (44 us)
    + 512 channels * 44 us = 22,744 us = 22.7 ms

  Maximum refresh rate = 1 / 22.7 ms = 44 Hz
```

### Partial Universe Transmission

A DMX transmitter is not required to send all 512 channels. If only channels 1-48 are used (e.g., for a simple rig with 12 four-channel fixtures), the frame can be shortened:

```
Shortened frame (48 channels):
  176 + 12 + 44 + (48 * 44) = 2,344 us = 2.3 ms
  Refresh rate: ~427 Hz
```

This allows much higher refresh rates for small channel counts, which is useful for high-speed effects and LED pixel control.

### Inter-Slot Time

The time between consecutive data slots (Mark Time Between Slots, MTBS) can be 0 to 1 second. In practice, most transmitters send slots back-to-back (MTBS = 0) for maximum refresh rate.

---

## 4. RDM: Remote Device Management

RDM (ANSI E1.20) adds bidirectional communication to DMX512 [5]. It enables the controller to discover, configure, and monitor DMX devices without physical access.

### RDM Architecture

RDM packets are transmitted using the alternate start code 0xCC. RDM devices must be able to:
1. Respond to discovery requests
2. Accept parameter queries and set commands
3. Continue operating normally between RDM transactions

```
RDM COMMUNICATION ON DMX LINE
================================================================

  Controller                                     Responder
  ┌──────┐                                      ┌──────┐
  │      │── DMX data (SC=0x00) ──────────────>  │      │
  │      │── RDM request (SC=0xCC) ────────────> │      │
  │      │<─ RDM response (SC=0xCC) ───────────  │      │
  │      │── DMX data (SC=0x00) ──────────────>  │      │
  │      │── DMX data (SC=0x00) ──────────────>  │      │
  │      │── RDM request (SC=0xCC) ────────────> │      │
  │      │<─ RDM response (SC=0xCC) ───────────  │      │
  └──────┘                                      └──────┘

  RDM packets are inserted between normal DMX frames.
  DMX data flow continues uninterrupted.
```

### RDM Features

- **Device discovery:** Unique 48-bit manufacturer ID + device ID. Binary search discovery algorithm identifies all devices on a chain.
- **Parameter queries:** DMX start address, device label, sensor values, firmware version, lamp hours, power consumption
- **Configuration:** Set DMX address, device mode, personality (channel mapping)
- **Firmware update:** RDM supports in-situ firmware updates over the DMX cable
- **Maximum devices:** 32 per daisy chain (same as DMX512)

### Common RDM Parameters

| PID | Name | Description |
|---|---|---|
| 0x0060 | DEVICE_INFO | Manufacturer, model, DMX footprint |
| 0x00F0 | DMX_START_ADDRESS | Get/set the device's DMX address |
| 0x0080 | DEVICE_LABEL | Get/set a human-readable name |
| 0x0200 | SENSOR_VALUE | Read sensor data (temperature, voltage) |
| 0x00C0 | DEVICE_HOURS | Total operating hours |
| 0x0400 | LAMP_HOURS | Lamp-specific operating hours |

---

## 5. Art-Net: DMX over Ethernet

Art-Net, developed by Artistic Licence in 1998, encapsulates DMX universe data in UDP packets over standard Ethernet [6].

### Art-Net 4 Addressing

Art-Net 4 supports up to 32,768 universes using a hierarchical addressing scheme:

```
ART-NET UNIVERSE ADDRESSING
================================================================

  15-bit universe address:
  ┌──────┬──────────┬──────────┐
  │ Net  │ Sub-Net  │ Universe │
  │ 7bit │  4bit    │  4bit    │
  └──────┴──────────┴──────────┘

  Total addressable: 128 nets * 16 subnets * 16 universes = 32,768

  Default IP range: 2.x.x.x (Art-Net standard)
  Common IP range:  10.x.x.x (typical installations)
```

### Art-Net Packet Format

```
ART-DMX PACKET (UDP)
================================================================

  Offset  Size   Field
  ────────────────────────────────
  0       8      "Art-Net\0" (protocol identifier)
  8       2      OpCode (0x5000 for ArtDmx)
  10      2      Protocol version (14)
  12      1      Sequence number (0-255)
  13      1      Physical port
  14      2      Universe (Sub-Net + Universe)
  16      2      Data length (2-512, high byte first)
  18      N      DMX channel data
```

Art-Net uses UDP port 6454. Broadcast, unicast, and (in Art-Net 4) directed broadcast are all supported. Unicast is preferred for large installations to reduce network load.

---

## 6. sACN (E1.31): Streaming ACN

sACN (Streaming Architecture for Control Networks), standardized as ANSI E1.31-2018, uses IP multicast for efficient data distribution [7].

### Multicast Architecture

Each DMX universe maps to a specific multicast group address:

```
Universe N -> multicast address 239.255.N_high.N_low
```

Where N is the 16-bit universe number (1-63999). For example:
- Universe 1: 239.255.0.1
- Universe 100: 239.255.0.100
- Universe 256: 239.255.1.0
- Universe 1000: 239.255.3.232

### Advantages Over Art-Net

1. **Network efficiency:** Multicast means devices only receive the universes they subscribe to. Art-Net broadcast sends all universe data to all devices on the subnet.
2. **Synchronization:** E1.31:2018 includes synchronization packets ensuring all receivers update simultaneously -- critical for pixel-mapped LED walls where tearing (partial frame updates) is visible.
3. **Priority handling:** Priority levels (0-200) allow multiple sources to coexist with deterministic failover. If the primary source fails, the next-highest-priority source automatically takes over.
4. **Standards-based:** ANSI standard with formal specification, vs. Art-Net's proprietary (though openly published) specification.

### sACN Data Packet Format

sACN uses the ACN protocol suite (ANSI E1.17) with the following encapsulation:

```
sACN DATA PACKET
================================================================

  Root Layer:
    Preamble size, flags, vector (0x00000004 = Data)
    CID (Component Identifier, 16 bytes UUID)

  Framing Layer:
    Flags, vector (0x00000002 = DMP)
    Source name (UTF-8, 64 bytes)
    Priority (0-200)
    Synchronization address (universe to sync with)
    Sequence number
    Options flags
    Universe number

  DMP Layer:
    Start code (0x00 for dimmer data)
    Channel data (1-512 bytes)
```

sACN uses UDP port 5568.

---

## 7. Art-Net vs. sACN Comparison

| Feature | Art-Net 4 | sACN (E1.31:2018) |
|---|---|---|
| Standard | Proprietary (open) | ANSI E1.31 |
| Transport | UDP broadcast/unicast | UDP multicast |
| Port | 6454 | 5568 |
| Max universes | 32,768 | 63,999 |
| Synchronization | Not native | Built-in sync packets |
| Priority | Not native | 0-200 priority levels |
| Discovery | ArtPoll/ArtPollReply | Universe discovery |
| RDM over Ethernet | Art-Net supports RDM | Not specified in E1.31 |
| Network efficiency | Lower (broadcast) | Higher (multicast + IGMP) |
| Industry adoption | Earlier, wider in small rigs | Growing, preferred for large |
| Failover | Manual | Automatic via priority |

### When to Use Which

- **Art-Net:** Small to medium installations, when RDM over Ethernet is needed, retrofit onto existing infrastructure
- **sACN:** Large pixel-mapped installations (1000+ universes), when synchronization is critical, when network efficiency matters, when automatic failover is required

---

## 8. Pixel Mapping and Universe Planning

### Channel Consumption

Each LED pixel consumes DMX channels based on its color mode [8]:

| Pixel Type | Channels/Pixel | Pixels/Universe (512 ch) |
|---|---|---|
| Single color (dimmer) | 1 | 512 |
| RGB | 3 | 170 |
| RGBW | 4 | 128 |
| RGB + Amber + UV | 5 | 102 |
| RGB + fine dimmer | 4 | 128 |

### Universe Planning Example

A 10,000-pixel RGB LED wall requires:
```
Universes = ceil(10,000 * 3 / 512) = ceil(58.6) = 59 universes
```

Network bandwidth for 59 universes at 44 Hz refresh:
```
Bandwidth = 59 * 638 bytes/packet * 44 Hz * 8 bits/byte
          = 13.3 Mbps
```

This is well within Gigabit Ethernet capacity but requires careful network design to prevent multicast flooding.

### Pixel Controller Mapping

Art-Net/sACN-to-SPI pixel controllers (e.g., Advatek PixLite, Sundrax PixelGate) bridge the Ethernet lighting network to addressable LED hardware [9]:

```
PIXEL CONTROLLER MAPPING
================================================================

  sACN/Art-Net                 Pixel Controller              LED Strip
  ┌──────────┐                ┌──────────────┐              ┌─────────┐
  │Universe 1│──> Ethernet ──>│ Port 1 (SPI) │──> Data ──>  │Strip A  │
  │Universe 2│──> ──────────> │ Port 2 (SPI) │──> ───────>  │Strip B  │
  │Universe 3│──> ──────────> │ Port 3 (SPI) │──> ───────>  │Strip C  │
  │Universe 4│──> ──────────> │ Port 4 (SPI) │──> ───────>  │Strip D  │
  └──────────┘                └──────────────┘              └─────────┘

  Each port: 300-1000 pixels (WS2812B, APA102, SK6812, etc.)
  Configuration: web interface over same Ethernet connection
  End-to-end latency: < 20 ms (console to LED)
```

---

## 9. Network Design for Large Installations

### Dedicated Lighting VLAN

Lighting data should always be on a dedicated VLAN, separated from general network traffic. This prevents:
- Broadcast storms from affecting lighting control
- Lighting multicast from flooding non-lighting ports
- Security risks from exposing control infrastructure

### IGMP Snooping

IGMP snooping is essential for sACN installations. Without it, multicast packets are flooded to all switch ports, creating unnecessary load. With IGMP snooping, switches learn which ports subscribe to which multicast groups and forward traffic only to subscribed ports [10].

### Switch Requirements

| Feature | Required | Reason |
|---|---|---|
| IGMP snooping v2+ | Yes | Multicast management for sACN |
| Jumbo frames | Optional | Not needed for DMX-sized packets |
| QoS / CoS | Recommended | Priority for lighting traffic |
| VLAN support | Strongly recommended | Network segmentation |
| PoE | Optional | Power pixel controllers |
| Managed | Yes | Configuration and monitoring |
| Port count | 16-48 | Depends on installation size |

### Network Topology

```
LARGE INSTALLATION NETWORK TOPOLOGY
================================================================

  Console        Backup Console
     │                │
     └───────┬────────┘
             │
      ┌──────┴──────┐
      │  Core Switch │  (Managed, IGMP, VLAN)
      │  (Gigabit)   │
      └──────┬──────┘
             │
     ┌───────┼───────┐
     │       │       │
  ┌──┴──┐ ┌──┴──┐ ┌──┴──┐
  │Edge │ │Edge │ │Edge │  (Access switches, one per zone)
  │Sw 1 │ │Sw 2 │ │Sw 3 │
  └──┬──┘ └──┬──┘ └──┬──┘
     │       │       │
  PixCtrl PixCtrl PixCtrl  (Pixel controllers, 4-8 per switch)
```

---

## 10. Wireless DMX

Wireless DMX systems use frequency-hopping spread spectrum (FHSS) in the 2.4 GHz ISM band to transmit DMX data without cables [11].

### CRMX (LumenRadio)

LumenRadio's CRMX technology is the industry standard for professional wireless DMX:
- Latency: < 5 ms (typical: 2 ms)
- Range: 500m line-of-sight, 100m indoor
- Channels: Up to 5 DMX universes per link
- Coexistence: Adaptive FHSS avoids WiFi interference
- Reliability: Designed for zero-dropout operation in RF-dense environments (concerts, broadcast)

### Limitations

- **Latency:** Even 2 ms adds to the total system latency budget
- **Reliability:** RF interference can cause dropouts; always have wired backup for safety-critical fixtures (moving lights, pyrotechnics control)
- **Bandwidth:** Limited to 5-10 universes per wireless link; not suitable for large pixel-mapped installations

---

## 11. Safety and Electrical Considerations

> **SAFETY WARNING: DMX cables carry low-voltage data signals, but the fixtures they control may operate at hazardous voltages.** LED drivers and dimmer packs commonly operate at 120-277 VAC. Never modify fixture wiring without disconnecting power and following lockout/tagout procedures per OSHA 29 CFR 1910.147. All high-voltage connections must be made by qualified personnel [12].

> **CAUTION: DMX protocol provides NO security.** DMX512 and Art-Net have no authentication, encryption, or access control. Any device connected to the DMX network can send data that all fixtures will obey. For safety-critical installations (emergency lighting, pyrotechnics), implement physical network isolation and access controls at the infrastructure level. Do not rely on the protocol for safety [13].

### Electrical Safety Summary

| Risk | Source | Mitigation |
|---|---|---|
| Electric shock | Dimmer packs, LED drivers (120-277 VAC) | GFCI protection, qualified installers |
| Fire | Overloaded circuits, damaged cables | Circuit breakers, cable inspection |
| EMI | DMX near power cables | Separate routing, shielded DMX cable |
| Ground loops | Multiple equipment grounds | Isolated DMX splitters, fiber links |
| Lightning | Outdoor installations | Surge protectors on DMX and Ethernet |

---

## 12. Cross-References

> **Related:** [MIDI & Control Protocols](06-midi-control-protocols.md) -- MIDI-to-DMX bridges, timecode synchronization, MSC integration. [LED Persistence of Vision](04-led-persistence-of-vision.md) -- LED driver protocols and pixel control. [Sound Filtering & Audio](03-sound-filtering-audio.md) -- audio-reactive lighting systems.

**Series cross-references:**
- **LED (LED & Controllers):** WS2812/APA102 protocols, pixel control fundamentals
- **EMG (Electric Motors):** RS-485 as shared physical layer for motor control
- **SPA (Spatial Awareness):** Spatial lighting design and pixel mapping
- **ARC (Shapes & Colors):** Color mixing and LED color space management
- **GRD (Gradient Engine):** Gradient color effects in pixel-mapped installations

---

## 13. Sources

1. ANSI/ESTA E1.11-2008. "Entertainment Technology -- USITT DMX512-A -- Asynchronous Serial Digital Data Transmission Standard for Controlling Lighting Equipment and Accessories."
2. TIA/EIA-485-A. "Electrical Characteristics of Generators and Receivers for Use in Balanced Digital Multipoint Systems." 1998.
3. ESTA. "DMX512-A: Recommended Practice for DMX512." Technical Standards Program, 2013.
4. USITT. "DMX512 (1990) Digital Data Transmission Standard for Dimmers and Controllers." Original specification, 1986/1990.
5. ANSI E1.20-2010. "Entertainment Technology -- RDM -- Remote Device Management Over DMX512 Networks."
6. Artistic Licence. "Art-Net 4 Specification." Revision 1.4dh, 2017.
7. ANSI E1.31-2018. "Entertainment Technology -- Lightweight Streaming Protocol for Transport of DMX512 Using ACN."
8. Advatek Lighting. "PixLite Mk3 Long Range Controller." Technical documentation, 2023.
9. Sundrax. "PixelGate Pro Pixel Controller." Technical specifications, 2023.
10. IEEE 802.1D. "Media Access Control (MAC) Bridges." Annex C: IGMP Snooping.
11. LumenRadio. "CRMX Technical Overview." Application note, 2023.
12. OSHA 29 CFR 1910.147. "The Control of Hazardous Energy (Lockout/Tagout)."
13. ESTA. "Introduction to Modern Atmospheric Effects." Technical Standards Program, 2020.

---

*Signal & Light -- Module 5: DMX512 & Stage Lighting. Simple protocol, deterministic behavior, four decades of trust.*
