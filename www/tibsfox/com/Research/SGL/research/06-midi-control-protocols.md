# MIDI & Control Protocol Integration

> **Domain:** Control Protocols and System Integration
> **Module:** 6 -- MIDI 1.0, MIDI 2.0, Show Control, OSC, and Cross-Domain Bridges
> **Through-line:** *In 1983, Dave Smith of Sequential Circuits and Ikutaro Kakehashi of Roland agreed that their competing synthesizers should speak the same language. MIDI 1.0 was born from that handshake -- 31.25 kbaud, 5-pin DIN, 16 channels, 7-bit resolution.* Forty years and billions of devices later, MIDI 2.0 extends the conversation with 32-bit resolution, 256 channels, and bidirectional capability inquiry. The handshake endures.

---

## Table of Contents

1. [MIDI 1.0 Fundamentals](#1-midi-10-fundamentals)
2. [MIDI 1.0 Message Types](#2-midi-10-message-types)
3. [MIDI 2.0 Architecture](#3-midi-20-architecture)
4. [Universal MIDI Packet (UMP)](#4-universal-midi-packet-ump)
5. [MIDI-CI: Capability Inquiry](#5-midi-ci-capability-inquiry)
6. [Profile Configuration and Property Exchange](#6-profile-configuration-and-property-exchange)
7. [Jitter Reduction Timestamps](#7-jitter-reduction-timestamps)
8. [MIDI Show Control (MSC)](#8-midi-show-control-msc)
9. [OSC: Open Sound Control](#9-osc-open-sound-control)
10. [Integration Patterns](#10-integration-patterns)
11. [Hardware Controller Design](#11-hardware-controller-design)
12. [Cross-References](#12-cross-references)
13. [Sources](#13-sources)

---

## 1. MIDI 1.0 Fundamentals

MIDI 1.0 (Musical Instrument Digital Interface) was standardized in 1983 by the MIDI Manufacturers Association (MMA) and the Association of Musical Electronics Industry (AMEI) [1].

### Physical Layer

- **Baud rate:** 31,250 bps (31.25 kbaud)
- **Electrical:** Current loop, 5 mA nominal
- **Connector:** 5-pin DIN (180 degree)
- **Signal:** Optoisolated at receiver to prevent ground loops
- **Cable length:** Maximum 15 meters (50 feet)

```
MIDI ELECTRICAL INTERFACE
================================================================

  Transmitter (OUT):              Receiver (IN):
  ┌────────────────┐              ┌────────────────┐
  │                │              │                │
  │  +5V ──[220Ω]─┼──── Pin 4 ──┼──────────────┐ │
  │                │              │              │ │
  │  UART TX ──────┼──── Pin 5 ──┼──┐           │ │
  │                │              │  │  [Opto-   │ │
  │  GND (shield)──┼──── Pin 2 ──┼──┤  isolator]├─┼──> UART RX
  │                │              │  │           │ │
  └────────────────┘              │  └───────────┘ │
                                  │  [220Ω] to GND │
                                  └────────────────┘

  Pins 1, 3: Not connected (reserved)
  Optoisolator prevents ground loops between devices
```

### Data Format

MIDI uses 8-bit bytes with asynchronous serial framing: 1 start bit + 8 data bits + 1 stop bit = 10 bits per byte. At 31,250 baud, each byte takes 320 microseconds.

The most significant bit (MSB) distinguishes message types:
- **Status byte (MSB = 1):** Identifies the message type and channel
- **Data byte (MSB = 0):** Carries parameter values (0-127)

### Running Status

When multiple messages of the same type are sent consecutively, the status byte can be omitted after the first occurrence. The receiver assumes the previous status byte applies. This optimization reduces bandwidth consumption by approximately 33% for common scenarios (e.g., rapid note sequences) [2].

---

## 2. MIDI 1.0 Message Types

### Channel Voice Messages

These messages address specific MIDI channels (1-16):

| Status Byte | Message | Data Bytes | Description |
|---|---|---|---|
| 0x8n | Note Off | 2 (note, velocity) | Release a note |
| 0x9n | Note On | 2 (note, velocity) | Press a note (velocity 0 = Note Off) |
| 0xAn | Poly Aftertouch | 2 (note, pressure) | Per-note pressure after initial keypress |
| 0xBn | Control Change | 2 (controller#, value) | Knob/slider/pedal position |
| 0xCn | Program Change | 1 (program#) | Select preset/patch |
| 0xDn | Channel Aftertouch | 1 (pressure) | Channel-wide pressure |
| 0xEn | Pitch Bend | 2 (LSB, MSB) | Pitch wheel position (14-bit) |

Where `n` = channel number (0x0-0xF for channels 1-16).

### Controller Numbers

| CC# | Name | Common Use |
|---|---|---|
| 1 | Mod Wheel | Vibrato, expression |
| 7 | Channel Volume | Overall level |
| 10 | Pan | Stereo position |
| 11 | Expression | Dynamic volume |
| 64 | Sustain Pedal | On/off (>63 = on) |
| 120 | All Sound Off | Emergency silence |
| 123 | All Notes Off | Release all held notes |

### System Messages

System messages are not channel-specific:

**System Real-Time (single byte, no data):**
- 0xF8: Timing Clock (24 pulses per quarter note)
- 0xFA: Start (begin playback from position 0)
- 0xFB: Continue (resume from current position)
- 0xFC: Stop (halt playback)
- 0xFE: Active Sensing (heartbeat, optional)
- 0xFF: System Reset

**System Common:**
- 0xF1: MIDI Time Code Quarter Frame
- 0xF2: Song Position Pointer (14-bit, in MIDI beats)
- 0xF3: Song Select

**System Exclusive (SysEx):**
- 0xF0: Start of SysEx (manufacturer-specific data follows)
- 0xF7: End of SysEx

### Timing and Bandwidth

A single MIDI cable at 31.25 kbaud transmits approximately 3,125 bytes per second. A Note On message (3 bytes) takes 960 microseconds. This limits polyphonic throughput:

```
Maximum notes per second = 3,125 / 3 = 1,042 notes/s
```

For a dense chord of 10 notes played simultaneously, the last note arrives 9.6 ms after the first -- a perceptible timing skew in critical listening conditions. This is the fundamental bandwidth limitation that MIDI 2.0 addresses [3].

---

## 3. MIDI 2.0 Architecture

MIDI 2.0, unveiled in January 2020, consists of five interlocking specifications that maintain full backward compatibility with MIDI 1.0 [4]:

```
MIDI 2.0 SPECIFICATION STACK
================================================================

  ┌─────────────────────────────────────────────────┐
  │         Universal MIDI Packet (UMP)             │
  │   New packet format: 32/64/96/128-bit packets   │
  │   16 Groups x 16 Channels = 256 streams         │
  ├─────────────────────────────────────────────────┤
  │         MIDI-CI (Capability Inquiry)             │
  │   Bidirectional negotiation, protocol level     │
  │   Auto-fallback to MIDI 1.0 if needed           │
  ├─────────────────────────────────────────────────┤
  │         Profile Configuration                    │
  │   Standard device behavior profiles             │
  │   Auto-mapping of controllers to parameters     │
  ├─────────────────────────────────────────────────┤
  │         Property Exchange                        │
  │   JSON-based device property discovery/setting   │
  │   Replaces manufacturer-specific editors         │
  ├─────────────────────────────────────────────────┤
  │         Jitter Reduction Timestamps              │
  │   Sample-accurate event timing on USB/network   │
  │   Events transmitted early, executed on time     │
  └─────────────────────────────────────────────────┘
```

---

## 4. Universal MIDI Packet (UMP)

The UMP format replaces MIDI 1.0's byte-stream protocol with 32-bit-aligned packets [5]:

### Packet Types

| Type | Size | Content |
|---|---|---|
| 0 | 32-bit | Utility messages (timestamps, NOP) |
| 1 | 32-bit | System Real-Time and System Common |
| 2 | 32-bit | MIDI 1.0 Channel Voice (backward compat) |
| 3 | 64-bit | 64-bit Data Messages (SysEx) |
| 4 | 64-bit | MIDI 2.0 Channel Voice Messages |
| 5 | 128-bit | 128-bit Data Messages |

### MIDI 2.0 Channel Voice Message Format

```
MIDI 2.0 NOTE ON (64-bit UMP)
================================================================

  Word 0 (32 bits):
  ┌──────┬──────┬──────┬──────┬──────────┬──────────┐
  │ Type │Group │Status│Chan  │ Note Num │ Attribute│
  │ 4bit │ 4bit │ 4bit │ 4bit │  7 bit   │  1 bit   │
  └──────┴──────┴──────┴──────┴──────────┴──────────┘

  Word 1 (32 bits):
  ┌──────────────────┬──────────────────┐
  │ Velocity (16-bit)│ Attribute (16-bit)│
  └──────────────────┴──────────────────┘
```

### Resolution Improvements

| Parameter | MIDI 1.0 | MIDI 2.0 | Improvement |
|---|---|---|---|
| Velocity | 7-bit (128 steps) | 16-bit (65,536 steps) | 512x |
| Controllers | 7-bit (128 steps) | 32-bit (4.29B steps) | 33.5M x |
| Pitch Bend | 14-bit (16,384 steps) | 32-bit (4.29B steps) | 262K x |
| Channel Aftertouch | 7-bit (128 steps) | 32-bit (4.29B steps) | 33.5M x |
| Per-note pitch | Not available | 32-bit absolute pitch | New |
| Per-note controllers | Not available | 32-bit per note | New |
| Channels | 16 | 16 groups x 16 = 256 | 16x |

### Per-Note Controllers

MIDI 2.0 introduces per-note controllers -- individual parameter control for each sounding note. This enables:
- Per-note vibrato depth and rate
- Per-note filter cutoff
- Per-note pan position
- Per-note expression
- Microtonal pitch adjustments per note (via per-note pitch)

This is a fundamental capability upgrade: MIDI 1.0's channel-wide controllers mean that changing vibrato depth affects all notes on the channel simultaneously. MIDI 2.0 allows each note to be an independently articulated voice [6].

---

## 5. MIDI-CI: Capability Inquiry

MIDI-CI enables bidirectional communication between devices, allowing them to discover each other's capabilities and negotiate the protocol level [7].

### Discovery Process

```
MIDI-CI DISCOVERY AND NEGOTIATION
================================================================

  Controller                              Responder
  ┌──────────┐                           ┌──────────┐
  │          │── Discovery Request ──────>│          │
  │          │<─ Discovery Reply ─────── │          │
  │          │                            │          │
  │          │── Protocol Negotiation ──> │          │
  │          │<─ Protocol Reply ──────── │          │
  │          │                            │          │
  │ (If both support MIDI 2.0)           │          │
  │          │── Switch to MIDI 2.0 ────>│          │
  │          │<─ Acknowledge ──────────  │          │
  │          │                            │          │
  │ (If responder is MIDI 1.0 only)      │          │
  │          │── Stay on MIDI 1.0 ──────>│          │
  └──────────┘                           └──────────┘
```

### Backward Compatibility

MIDI-CI ensures that a MIDI 2.0 controller can communicate with any MIDI device, regardless of its protocol version:
1. The controller sends a MIDI-CI Discovery message (via SysEx, which all MIDI 1.0 devices ignore if they don't recognize it)
2. If no response, the controller assumes MIDI 1.0 and operates in legacy mode
3. If the responder supports MIDI-CI, it replies with its capabilities
4. Both devices negotiate the highest mutually supported protocol level

This automatic fallback means MIDI 2.0 devices work immediately with the billions of MIDI 1.0 devices already in use.

---

## 6. Profile Configuration and Property Exchange

### Profile Configuration

Devices declare compatibility with standard profiles that define expected controller mappings [8]:

```
PROFILE CONFIGURATION EXAMPLE
================================================================

  Control Surface queries a synthesizer:
    "What profiles do you support?"

  Synthesizer responds:
    "Analog Synth Profile v1.0"
    "Drawbar Organ Profile v1.0"

  Control Surface activates "Analog Synth" profile:
    CC 74 -> Filter Cutoff
    CC 71 -> Filter Resonance
    CC 73 -> Attack Time
    CC 72 -> Release Time
    CC 91 -> LFO Rate
    CC 93 -> LFO Depth

  Same control surface, different synth with "Drawbar Organ" profile:
    CC 12 -> Drawbar 16'
    CC 13 -> Drawbar 5-1/3'
    CC 14 -> Drawbar 8'
    CC 15 -> Drawbar 4'
    ...
    CC 80 -> Leslie Speed (slow/fast)
```

This eliminates the need for custom controller mappings for every device combination.

### Property Exchange

JSON-based messages enable sophisticated device configuration [9]:

```
Property Exchange Example:
  Request: { "resource": "PatchList" }
  Response: {
    "patches": [
      { "index": 0, "name": "Warm Pad", "category": "Pad" },
      { "index": 1, "name": "Brass Section", "category": "Brass" },
      { "index": 2, "name": "Electric Piano", "category": "Piano" }
    ]
  }
```

Property Exchange replaces much of the need for manufacturer-specific editor software. A MIDI 2.0 controller can discover and display a synthesizer's patch names, parameter ranges, and configuration options without any prior knowledge of the specific device.

---

## 7. Jitter Reduction Timestamps

Optional timestamps allow events to be transmitted ahead of time and executed at the precise intended moment, reducing jitter on packet-based transports like USB [10].

### The Jitter Problem

USB transmits data in 1 ms frames (USB Full Speed) or 125 us microframes (USB High Speed). Events that arrive at arbitrary points within a USB frame are rounded to the frame boundary, introducing up to 1 ms of jitter. For a 120 BPM quarter note (500 ms), 1 ms represents a 0.2% timing error -- perceptible to trained musicians.

### Timestamp Mechanism

```
JITTER REDUCTION TIMESTAMP
================================================================

  Without timestamps:                With timestamps:
  ┌────────────────────┐            ┌────────────────────┐
  │ USB Frame 1        │            │ USB Frame 1        │
  │   NoteOn (plays    │            │   NoteOn + TS=450  │
  │    at frame edge)  │            │   (plays at 450us  │
  │                    │            │    into next frame) │
  └────────────────────┘            └────────────────────┘

  Frame boundary:                   Precise timing:
  Events quantized                  Events placed at
  to 1ms grid                      sub-millisecond
                                   positions
```

This is the same principle Paula used in the Amiga: DMA pointer registers specified exactly when audio output should begin, allowing the CPU to set up transfers ahead of time with precise timing. The MIDI 2.0 Jitter Reduction Timestamp extends this principle to networked musical events.

---

## 8. MIDI Show Control (MSC)

MIDI Show Control extends MIDI for theatrical automation, providing commands for cue-based operations across multiple subsystems [11]:

### MSC Command Format

MSC uses MIDI System Exclusive messages:

```
MSC MESSAGE FORMAT
================================================================

  F0 7F [Device ID] 02 [Command Format] [Command]
  [Data bytes...] F7

  Device ID: 00-6F (specific device), 7F (all devices)

  Command Formats:
    01 = Lighting (General)
    02 = Moving Lights
    03 = Color Changers
    10 = Sound (General)
    20 = Machinery (General)
    30 = Video (General)
    60 = Projection (General)
    7F = All Types

  Commands:
    01 = Go (execute cue)
    02 = Stop
    03 = Resume
    04 = Timed Go (with time parameter)
    05 = Load (prepare cue)
    06 = Set (parameter change)
    07 = Fire (immediate execution)
    08 = All Off
    09 = Restore
    0A = Reset
```

### MSC Integration with DMX

MSC typically triggers DMX lighting cues via a MIDI-to-DMX bridge or through the lighting console's MIDI input:

```
MSC TO DMX SIGNAL FLOW
================================================================

  Stage Manager                 Lighting Console           DMX Fixtures
  ┌──────────┐                 ┌───────────────┐          ┌──────────┐
  │ Cue      │── MSC "Go" ──> │ Execute cue   │── DMX ──>│ Fixture  │
  │ System   │   (MIDI)       │ (fade, chase, │  (RS-485)│ (dimmer, │
  │          │                 │  effect)       │          │  mover)  │
  └──────────┘                 └───────────────┘          └──────────┘
```

---

## 9. OSC: Open Sound Control

OSC (Open Sound Control) is a complementary protocol to MIDI, designed for high-resolution, low-latency control over IP networks [12].

### OSC vs. MIDI

| Feature | MIDI 1.0 | MIDI 2.0 | OSC |
|---|---|---|---|
| Transport | Serial (DIN), USB | USB, network | UDP/TCP over IP |
| Resolution | 7/14-bit | 32-bit | 32-bit float (arbitrary) |
| Addressing | Channel + CC# | Group + Channel + CC# | URL-style paths |
| Namespace | Fixed (128 CCs) | Extended (256 ch) | Unlimited (string) |
| Discovery | None | MIDI-CI | OSC Query (optional) |
| Latency | ~1 ms (serial) | Sub-ms (USB HS) | Sub-ms (UDP) |
| Adoption | Universal | Growing | Niche (live, installation) |

### OSC Addressing

OSC uses URL-style address patterns:

```
/mixer/channel/1/fader    0.75
/synth/filter/cutoff       8500.0
/light/fixture/42/dimmer   0.5
/light/fixture/42/color    1.0 0.0 0.5
```

This human-readable addressing makes OSC particularly suitable for custom installations and experimental interfaces.

---

## 10. Integration Patterns

### Pattern 1: MIDI-to-DMX Bridge

Triggering lighting changes from musical events:

```
MIDI NOTE -> DMX CHANNEL MAPPING
================================================================

  MIDI Input:                    DMX Output:
  Note C3 (60) velocity 100 --> Universe 1, Ch 1 = 100 (dimmer)
  Note D3 (62) velocity 80  --> Universe 1, Ch 4-6 = R:255 G:0 B:80
  CC 1 (mod wheel) = 64     --> Universe 1, Ch 10 = 128 (strobe speed)
  Program Change 5           --> Load lighting preset 5
```

This pattern is used in club installations, concert lighting, and theatrical productions where the music drives the lighting.

### Pattern 2: Audio-Reactive Lighting

Real-time analysis of the audio signal generates DMX commands:

```
AUDIO-REACTIVE PIPELINE
================================================================

  Audio ──> ADC ──> DSP Analysis ──> Feature Extraction ──> DMX Output
                      │                    │
                      │  FFT / STFT       │  BPM detection
                      │  Envelope         │  Spectral centroid
                      │  Band energy      │  Onset detection
                      │                    │
                      v                    v
              ┌──────────────────────────────────┐
              │         Mapping Engine            │
              │                                    │
              │  Bass energy  -> Wash color hue    │
              │  Mid energy   -> Moving light pan  │
              │  High energy  -> Strobe rate       │
              │  BPM          -> Chase speed       │
              │  Onset        -> Flash trigger     │
              └──────────────────────────────────┘
                              │
                              v
                    DMX / Art-Net / sACN
```

Latency budget for perceptible audio-visual synchrony: approximately 20-40 ms. The audio analysis (FFT, envelope following) adds 5-20 ms depending on buffer size. The DMX refresh adds up to 23 ms. The total must stay under 40 ms for the audience to perceive the lighting as synchronized with the music [13].

### Pattern 3: Timecode Synchronization

SMPTE timecode (Society of Motion Picture and Television Engineers) provides the master clock for synchronized playback of audio, lighting, video, and effects:

```
TIMECODE SYNCHRONIZATION
================================================================

  Master Clock:  SMPTE / LTC (audio track)
                 or MTC (MIDI Time Code)
       │
       ├──> Audio Playback System (DAW)
       │      - Locks to timecode, plays audio
       │
       ├──> Lighting Console
       │      - Follows timecode, executes cue list
       │      - Each cue has a timecode trigger point
       │
       ├──> Video Playback
       │      - Timecode-triggered video cues
       │
       └──> Effects Control (pyro, machinery)
              - Timecode-triggered firing cues

  SMPTE Frame Rates:
    24 fps   - Film
    25 fps   - PAL broadcast
    29.97 fps - NTSC (drop-frame for accurate time)
    30 fps   - NTSC (non-drop-frame)
```

MTC (MIDI Time Code) encodes SMPTE timecode as MIDI messages, using System Common messages (0xF1, quarter-frame messages) to transmit hours:minutes:seconds:frames in 8 quarter-frame messages per frame [14].

---

## 11. Hardware Controller Design

### Control Surface Ergonomics

Physical MIDI controllers balance tactile feedback with electronic precision:

- **Faders:** 60-100 mm travel, motorized (for recall) or manual, 10-bit ADC minimum (1024 steps)
- **Rotary encoders:** Optical or magnetic, 128-1024 pulses per revolution, endless rotation with LED ring indicators
- **Buttons:** Tactile switches with LED backlighting (RGB for status indication)
- **Displays:** OLED or LCD per channel strip showing parameter names and values
- **Touch strips:** Capacitive strips for ribbon-controller-style pitch/mod input

### ADC Requirements

For smooth controller movement without stepping artifacts:

| Resolution | Steps | Perceptible Stepping |
|---|---|---|
| 7-bit (MIDI 1.0 CC) | 128 | Visible on slow fader moves |
| 10-bit (typical ADC) | 1,024 | Barely perceptible |
| 12-bit (quality ADC) | 4,096 | Imperceptible |
| 14-bit (MIDI 1.0 paired CC) | 16,384 | Inaudible, invisible |
| 16-bit (MIDI 2.0 velocity) | 65,536 | Exceeds human perception |

### Controller Processing Pipeline

```
CONTROLLER PROCESSING
================================================================

  Physical Input ──> ADC ──> Debounce/Filter ──> Scaling ──> MIDI Output
       │                │           │                │            │
       │ Fader, knob,  │ 10-12 bit │ Low-pass       │ Map to    │ USB or
       │ button, pad   │ sample    │ filter (20 Hz) │ 0-127     │ DIN MIDI
       │               │            │ Schmitt for    │ or 0-16383│
       │               │            │ buttons        │           │
```

The low-pass filter on ADC readings (typically 10-20 Hz cutoff, single-pole IIR) prevents noise from generating unwanted MIDI messages while maintaining responsive feel. Button debouncing uses a Schmitt trigger algorithm with 10-20 ms window [15].

---

## 12. Cross-References

> **Related:** [DMX512 & Stage Lighting](05-dmx512-stage-lighting.md) -- MIDI-to-DMX bridges, MSC integration, timecode sync. [Real-Time DSP Algorithms](01-real-time-dsp-algorithms.md) -- audio analysis feeding audio-reactive patterns. [LED Persistence of Vision](04-led-persistence-of-vision.md) -- LED control driven by MIDI-triggered patterns.

**Series cross-references:**
- **DAA (Deep Audio Analyzer):** Audio feature extraction for reactive lighting
- **FQC (Frequency Continuum):** Spectral analysis concepts in audio-reactive systems
- **LED (LED & Controllers):** LED protocols as downstream consumer of DMX/MIDI
- **T55 (555 Timer):** Timing precision parallels in protocol design
- **SPA (Spatial Awareness):** Spatial audio and spatial lighting coordination
- **ARC (Shapes & Colors):** Color theory applied to lighting design
- **GRD (Gradient Engine):** Gradient algorithms for smooth lighting transitions
- **EMG (Electric Motors):** Motor control via MIDI/DMX for theatrical machinery

---

## 13. Sources

1. MIDI Manufacturers Association. "MIDI 1.0 Detailed Specification." Document version 4.2, 1996.
2. MMA/AMEI. "MIDI 1.0 Summary of Changes and Recommendations." 2014.
3. Loy, G. *Musimathics: The Mathematical Foundations of Music*. Volume 1. MIT Press, 2006.
4. MMA/AMEI. "MIDI 2.0 Specification Overview." January 2020.
5. MMA. "M2-104-UM: Universal MIDI Packet (UMP) Format and MIDI 2.0 Protocol." Version 1.1, 2023.
6. Stanford CCRMA. "MIDI 2.0 Technical Overview." 2021.
7. MMA. "M2-101-UM: MIDI-CI (MIDI Capability Inquiry)." Version 1.2, 2023.
8. MMA. "M2-102-UM: Profile Configuration for MIDI-CI." Version 1.0, 2020.
9. MMA. "M2-103-UM: Property Exchange for MIDI-CI." Version 1.1, 2023.
10. MMA. "Jitter Reduction Timestamps for MIDI 2.0." Specification addendum, 2020.
11. MMA. "MIDI Show Control 1.1.1." Recommended Practice RP-002/RP-014, 2000.
12. Wright, M. and Freed, A. "Open Sound Control: A New Protocol for Communicating with Sound Synthesizers." Proc. ICMC, 1997.
13. Fujisaki, E. "Temporal Window of Integration for Audio-Visual Synchrony." Experimental Brain Research, vol. 148, pp. 508-517, 2003.
14. SMPTE. "ST 12-1:2014 -- Time and Control Code." 2014.
15. Ganssle, J. "A Guide to Debouncing." 2008.

---

*Signal & Light -- Module 6: MIDI & Control Protocol Integration. Two companies agreed their instruments should talk to each other. Forty years of music followed.*
