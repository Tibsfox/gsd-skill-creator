# Technical Architecture

## The Channel Rack

The Channel Rack (originally the Step Sequencer) is FL Studio's atomic unit of music creation. Each row represents a channel -- a single instrument or sample -- with a grid of step buttons to the right. Clicking a step lights it; lit steps trigger the channel's sound at that position in the pattern.

### Step Sequencer Mode

In its simplest form, the Channel Rack displays a 16-step grid per channel. Each step represents a sixteenth note at default resolution. This is the mode that made FruityLoops viral: click four steps on the kick drum channel, four on the snare, and sixteen on the hi-hat, and you have a basic beat in under ten seconds.

### Graph Editor

Each channel includes a graph editor that displays per-step velocity, panning, pitch, and other parameters as vertical bars. This provides micro-level control over each step without leaving the Channel Rack.

## Piano Roll

FL Studio's Piano Roll is widely regarded as the best MIDI editor in any DAW. It provides:

- **Note editing** -- drag-to-create, resize, move, copy notes on a grid
- **Velocity** -- per-note velocity displayed as color intensity or bar height
- **Slide notes** -- FL Studio-specific: notes that cause pitch to glide from the previous note
- **Portamento** -- smooth pitch transitions between overlapping notes
- **Ghost notes** -- transparent display of notes from other channels for harmonic reference
- **Stamp tool** -- rapid chord and scale input via pre-built note patterns
- **Strum tool** -- humanize chord timing with adjustable strum direction and speed

### Piano Roll Scoring Capabilities

The Piano Roll supports per-note articulation, color grouping, and a time-stretch tool that compresses or expands note patterns temporally.

## Playlist

The Playlist is FL Studio's arrangement layer. Unlike traditional DAW timelines that assign one track to one instrument, FL Studio's Playlist is a free-form canvas where any track can contain:

- **Pattern clips** -- references to patterns from the Channel Rack
- **Audio clips** -- recorded or imported audio
- **Automation clips** -- parameter automation curves

Tracks in the Playlist are not bound to instruments -- any pattern can be placed on any track. This flexibility enables visual organization by section (verse, chorus) rather than by instrument.

## Mixer Architecture

### Channel Routing

The Mixer in FL Studio 2025 supports up to 500 dynamic insert tracks plus 10 send tracks. Each Channel Rack channel routes to a specific Mixer insert track. The routing is explicit: each channel has a target insert number.

### Effects Chain

Each Mixer insert track hosts an effects chain of up to 10 effect slots. Effects process audio in series from slot 1 through slot 10. Supported plugin formats include FL Native, VST2, VST3, AU (macOS), and CLAP.

### Sidechain Routing

Any Mixer insert can be routed to any other insert as a sidechain source. This enables sidechain compression (ducking pads against kick drums), frequency-dependent processing, and complex signal routing topologies.

## Audio Engine

### Core Specifications

| Parameter | Value |
|-----------|-------|
| Internal resolution | 32-bit float or 64-bit float (selectable) |
| Sample rates | 44.1 kHz to 192 kHz |
| Driver support | ASIO, WASAPI, DirectSound, Core Audio |
| Multi-core | Automatic distribution across CPU cores |
| PDC | Automatic plugin delay compensation |

### Buffer and Latency

FL Studio's audio engine operates with configurable buffer sizes. ASIO drivers provide the lowest latency for real-time input monitoring. The engine performs automatic plugin delay compensation across all signal paths.

## Edison Audio Editor

Edison is FL Studio's integrated audio editor, accessible as an effect plugin. It provides waveform editing, spectral analysis, convolution reverb, blur, denoise, and time-stretching. Edison operates non-destructively and can record directly from any point in the Mixer signal chain.

---

> **Related:** See [Plugin Ecosystem](03-plugin-ecosystem.md) for the instruments and effects that populate these architecture layers, and [Origins](01-origins-evolution.md) for the evolution of these components over 28 years.
