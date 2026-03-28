# Hardware Ecosystem

## Push 3

### Overview

Ableton Push 3 (released 2023) exists in two configurations:

- **Push 3 Standalone** -- contains an ARM-based processor running a version of Live 12 Suite without a computer. Includes built-in audio interface, battery option, Wi-Fi, and onboard storage.
- **Push 3 Controller** -- identical physical hardware without the standalone processor module. Functions as a USB controller for Live on a connected computer.

The standalone processor module can be purchased separately and installed into the controller version, upgrading it to standalone capability.

### Hardware Specifications

| Specification | Value |
|---------------|-------|
| Pads | 64 velocity-sensitive, polyphonic aftertouch, RGB |
| Display | Full-color LCD (1366x768) |
| Encoders | 8 touch-sensitive rotary encoders |
| Processor (Standalone) | Custom ARM-based, quad-core |
| Audio I/O | 2 in / 4 out, 1/4" TRS, headphone out |
| MIDI | USB host, DIN MIDI in/out |
| Storage | Internal SSD (standalone) |
| Power | USB-C or optional battery pack |
| Connectivity | Wi-Fi, Bluetooth (standalone) |

### Pad Grid Architecture

The 8x8 pad grid serves multiple functions depending on the active mode:

- **Note mode** -- chromatic or scale-constrained pitch layout; layout rotates to show intervals
- **Session mode** -- clip launching grid mirrors Session View
- **Drum mode** -- 4x4 drum pad layout with 16 pads per bank
- **Melodic Sequencer** -- step sequencing with note selection

The pads support **polyphonic aftertouch** -- each pad reports independent pressure data, enabling MPE-style expression even without an MPE controller. Combined with MPE-native instruments like Drift and Meld, this creates an expressive performance surface.

## Ableton Move

### Overview

Ableton Move (announced 2024) is a compact, portable music-making device designed for capturing ideas away from the studio. It represents Ableton's philosophy of reducing friction between thought and sound to its most portable form.

### Design Philosophy

Move is deliberately constrained -- it does not attempt to replicate the full Live experience. Instead, it provides a focused environment for:

- Capturing melodic and rhythmic ideas with onboard sounds
- Sketching song structures with a simplified clip/scene model
- Exporting ideas to Live for full production workflow

### Technical Specifications

Move includes onboard speakers, microphone, and a selection of Live instruments and effects. Projects created on Move can be transferred to Live on a computer for continued development.

## Ableton Link

### Protocol Overview

Ableton Link is a peer-to-peer protocol for tempo synchronization across devices on the same local network. It requires no central server or master clock -- all connected devices negotiate a shared tempo and beat phase through a distributed consensus algorithm.

### Key Properties

- **Peer-to-peer** -- no master/slave hierarchy; any device can change tempo
- **Network-local** -- operates over local Wi-Fi or wired networks
- **Phase-locked** -- synchronizes not just tempo but beat position (downbeats align)
- **Low-latency** -- designed for live performance timing requirements
- **Open protocol** -- SDK available for third-party integration

### Supported Devices

Link is supported across hundreds of applications and hardware devices:

| Category | Examples |
|----------|----------|
| DAWs | Ableton Live, Bitwig Studio, FL Studio (via plugin) |
| iOS Apps | 200+ apps (Korg Gadget, Reason Compact, etc.) |
| Hardware | Ableton Push 3, various Eurorack modules |
| Games | Zep (music game) |

### Technical Implementation

Link uses UDP multicast for device discovery and NTP-style clock synchronization for beat alignment. The protocol handles network jitter and provides sub-millisecond beat alignment accuracy on well-configured local networks.

```
Link Session State:
  tempo: float (BPM)
  beat_time: float (beats since arbitrary epoch)
  phase: float (position within bar)

  All peers converge on shared state via
  peer-to-peer negotiation (no master clock)
```

## Push 3 Evolution

### Push 1 (2013)

First generation. 64 pads with velocity sensitivity and channel aftertouch (not polyphonic). Monochrome pad LEDs. No display -- relied entirely on Live's screen. USB controller only.

### Push 2 (2015)

Full-color display integrated into the hardware. RGB pad LEDs. Improved pad sensitivity. Better encoder feel. Still USB controller only -- required a connected computer running Live.

### Push 3 (2023)

Standalone capability with onboard processor. Polyphonic aftertouch pads. Built-in audio interface. Wi-Fi connectivity. Battery option. The culmination of a decade of hardware-software co-design, enabling a complete production environment without a computer.

## Hardware-Software Co-Design

Ableton's hardware strategy reflects a philosophy of **integrated design** rather than generic controller mapping. Push is not a MIDI controller that happens to work with Live -- it is an extension of Live's interface into physical space. Every mode, every layout, every interaction is designed as a unified experience.

This contrasts with the traditional model of separate hardware and software development teams producing loosely coupled products. The depth of Push's integration -- clip colors reflected on pad LEDs, waveform displays rendered in real-time, mixer state mirrored on encoders -- is a direct result of hardware and software being designed as a single system.

---

> **Related:** See [Core Architecture](01-core-architecture.md) for the audio engine that Push 3 Standalone runs natively, and [Extensibility Layer](04-extensibility.md) for programmatic access to Push via MIDI Remote Scripts.
