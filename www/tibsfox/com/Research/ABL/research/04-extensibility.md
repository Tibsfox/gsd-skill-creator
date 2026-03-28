# Extensibility Layer

## Three Extension Mechanisms

Ableton Live provides three parallel extension mechanisms, each optimized for different use cases:

1. **Max for Live (M4L)** -- visual patching with full Live Object Model access
2. **Python MIDI Remote Scripts** -- compiled bytecode interface for control surfaces
3. **AbletonOSC** -- network-based parameter control via Open Sound Control

## Max for Live (M4L)

### Architecture

Max for Live embeds Cycling '74's Max environment directly inside Live's device chain. M4L devices appear as instruments, audio effects, or MIDI effects and have full access to the Live Object Model (LOM) -- the hierarchical API that exposes Live's internal state.

### Device Types

| Type | Function | Hosts |
|------|----------|-------|
| Instrument | Generates audio from MIDI input | MIDI tracks |
| Audio Effect | Processes audio signal | Audio/MIDI tracks |
| MIDI Effect | Transforms MIDI data | MIDI tracks (pre-instrument) |

### Live Object Model (LOM)

The LOM is a hierarchical object model that exposes Live's internal state for programmatic access. Key hierarchy levels:

```
Song (top level)
  ├── tracks[] (audio, MIDI, return, master)
  │     ├── clip_slots[]
  │     │     └── clip (audio or MIDI data)
  │     ├── devices[] (instruments, effects)
  │     │     └── parameters[]
  │     ├── mixer_device
  │     │     ├── volume
  │     │     ├── panning
  │     │     └── sends[]
  │     └── routing (input/output configuration)
  ├── scenes[]
  ├── master_track
  ├── return_tracks[]
  └── song properties (tempo, time signature, etc.)
```

### M4L Capabilities

- Read and write any parameter in the LOM
- Create custom UI with Max's graphical objects
- Process audio and MIDI with Max/MSP/Jitter signal processing
- Access the file system for loading/saving data
- Communicate over network (OSC, TCP, UDP)
- Run JavaScript within the Max environment

### Live 12 M4L Updates

- Performance Pack ships four new M4L devices for live performance
- LFO, Shaper, and Envelope Follower M4L devices now allow offset adjustment of modulated parameters
- Improved M4L device loading performance

## Python MIDI Remote Scripts

### Architecture

Live's MIDI Remote Scripts are Python modules that configure control surfaces (hardware controllers) to interact with Live. They are compiled to bytecode (.pyc) and loaded at startup from Live's MIDI Remote Scripts directory.

### Capabilities

| Object | Access Level | Notes |
|--------|-------------|-------|
| Song | Tempo, time signature, scenes, tracks | Read/write |
| Track | Volume, pan, mute, solo, arm, sends | Read/write |
| Clip Slot | Clip status, launch, stop | Read/write |
| Device | Parameters, presets | Read/write |
| Transport | Play, stop, record, metronome | Read/write |
| Navigation | View focus, highlighted clip slot | Read/write |

### Limitations

- No official public documentation (reverse-engineered by community)
- Compiled to bytecode -- source not directly editable
- No audio processing capability (MIDI/control only)
- Limited error reporting -- failures may silently drop messages

### Community Resources

The _Framework classes (e.g., `_Framework.ControlSurface`, `_Framework.ButtonElement`) provide the base abstractions for building control surface scripts. The community has extensively documented these through reverse engineering.

## AbletonOSC

### Protocol

AbletonOSC provides network-based access to Live's parameters via Open Sound Control (OSC). It enables remote control from any device or application capable of sending/receiving OSC messages -- other computers, tablets, phones, custom software.

### Architecture

AbletonOSC typically runs as a Max for Live device that bridges the LOM to an OSC server. External applications send OSC messages to the bridge, which translates them into LOM operations.

### Address Space

```
/live/song/get/tempo          → returns current tempo
/live/song/set/tempo [float]  → sets tempo
/live/track/N/get/volume      → returns track N volume
/live/track/N/set/mute [0|1]  → mutes/unmutes track N
/live/clip/N/M/fire           → fires clip at track N, slot M
/live/scene/N/fire            → fires scene N
```

### Use Cases

- **Remote control** -- control Live from a tablet or phone
- **Data visualization** -- extract parameter data for visual displays
- **Multi-DAW sync** -- coordinate Live with other software
- **Custom controllers** -- build bespoke control interfaces
- **Installation art** -- integrate Live into interactive installations

## Decision Tree: When to Use Which API

| Need | Recommended API | Rationale |
|------|----------------|-----------|
| Custom audio processing | Max for Live | Only API with signal processing |
| Custom instrument/effect | Max for Live | Device chain integration |
| Hardware controller support | Python MIDI Remote Scripts | Designed for control surfaces |
| Remote control from network | AbletonOSC | Network-native, language-agnostic |
| Custom UI within Live | Max for Live | Max's graphical objects |
| Batch parameter changes | AbletonOSC | Fast, scriptable |
| Real-time MIDI transformation | Max for Live (MIDI Effect) | Low-latency, in-chain |
| Integration with external software | AbletonOSC | Standard protocol |

## GSD Ecosystem Integration

The extensibility layer presents three natural integration points for the GSD ecosystem:

1. **AbletonOSC as DACP transport** -- OSC messages map naturally to structured bundles (address + typed arguments)
2. **LOM as state model** -- the hierarchical object model mirrors GSD's structured state representation
3. **Python Remote Scripts as agent interface** -- control surface abstraction maps to agent-mediated control

---

> **Related:** See [Core Architecture](01-core-architecture.md) for the audio engine these APIs control, and [Education & Ecosystem](05-education-ecosystem.md) for the community of M4L developers.
