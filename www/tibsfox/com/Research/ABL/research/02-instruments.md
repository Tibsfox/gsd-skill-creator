# Instruments and Sound Design Arsenal

## Synthesis Taxonomy

Ableton Live 12 ships with 20 instruments spanning seven distinct synthesis architectures. Each instrument occupies a specific niche in the sound design space, from bread-and-butter subtractive synthesis to experimental granular processing.

## Subtractive Synthesis

### Analog

Virtual analog synthesizer with two oscillators, sub-oscillator, noise generator, and multimode filter. Designed for classic subtractive synthesis: basses, leads, pads. The oscillators model analog waveform drift and hard sync.

### Drift

MPE-native subtractive synthesizer introduced in Live 11. Designed for expressive, per-note control via MPE-capable controllers. Features two oscillators with analog-modeled behavior and a character section that adds subtle imperfections.

## FM Synthesis

### Operator

Four-operator FM synthesizer with configurable routing algorithms (11 algorithms). Each operator functions as both carrier and modulator. Supports additive synthesis (drawing custom partials), FM synthesis, and hybrid approaches. The coarse and fine ratio controls per operator determine harmonic relationships.

| Parameter | Range | Function |
|-----------|-------|----------|
| Operators | 4 | Independent oscillators with frequency ratios |
| Algorithms | 11 | Routing configurations between operators |
| Feedback | Per-operator | Self-modulation for complex timbres |
| Filter | Multimode | Post-synthesis filtering |

## Wavetable Synthesis

### Wavetable

Two oscillators with wavetable position morphing. Ships with 200+ wavetables organized by category. Analog-modeled filters. Supports importing custom wavetables from audio files. The modulation matrix allows mapping any source (LFO, envelope, MIDI) to any destination parameter.

MPE support was added in Live 11, enabling per-note wavetable position control from pressure or slide data.

## Physical Modeling

### Collision

Models the interaction between two resonating objects: a mallet/noise exciter striking a resonating body (membrane, plate, tube, pipe). Produces realistic percussion, metallic sounds, and tuned resonances.

### Tension

Physical modeling of string instruments. Models the exciter (bow, hammer, pluck), the string (damping, decay, vibrato), and the body resonance. Produces realistic plucked and bowed string sounds.

### Electric

Models vintage electric pianos (Rhodes, Wurlitzer) through physical modeling of hammers, tines/reeds, tone bars, pickups, and dampers. Each stage of the sound generation chain is independently adjustable.

## Bi-Timbral / Macro Oscillators

### Meld

Introduced in Live 12. Two independent sound engines blended together with a crossfader. Each engine offers multiple synthesis modes. Designed for evolving, layered sounds. Influenced by Mutable Instruments' Eurorack module designs.

## Granular Synthesis

### Granulator III

Max for Live instrument (ships with Suite). Granular synthesis engine that slices audio into tiny grains and reassembles them with independent control over position, grain size, pitch, and spray (randomization). Capable of extreme time-stretching, texture generation, and spectral freezing.

## Sampling

### Sampler

Full-featured multi-sample instrument. Supports velocity layers, round-robin, key zones, and modulation matrix. Can import and map multi-sample libraries. The Zone Editor provides graphical editing of sample mapping across key, velocity, and select dimensions.

### Simpler

Simplified single-sample instrument with three playback modes:

- **Classic** -- conventional sample playback with loop, filter, envelope
- **One-Shot** -- trigger-and-forget playback (no note-off response)
- **Slice** -- automatic transient detection and slicing for rhythmic material

### Drum Rack

Container instrument that maps samples, instruments, or effects chains to individual MIDI notes. Each pad (128 available) hosts its own instrument chain. Standard configuration uses 16 pads visible at a time. Supports choke groups (pads that silence each other, like hi-hat open/closed pairs).

## Live 12 Instrument Additions

Live 12 introduced significant updates to the instrument lineup:

- **Meld** -- new bi-timbral synthesizer (see above)
- **Granulator III** -- updated granular engine with new interface
- **Generative MIDI Transformations** -- MIDI effects that algorithmically transform note data (not an instrument per se, but transforms what instruments receive)
- **Alternative Tuning System** -- support for non-12-TET tuning across all instruments via .scl and .kbm files

## MPE Support Matrix

| Instrument | MPE Support | Notes |
|------------|-------------|-------|
| Drift | Native | Designed for MPE from the ground up |
| Meld | Native | Per-note expression on both engines |
| Wavetable | Added Live 11 | Per-note position, filter, volume |
| Sampler | Added Live 11 | Per-note filter and volume |
| Analog | Partial | Aftertouch only |
| Operator | Partial | Aftertouch mapping |
| Collision | None | Future candidate |
| Tension | None | Future candidate |

---

> **Related:** See [Core Architecture](01-core-architecture.md) for the audio engine that hosts these instruments, and [Hardware Ecosystem](03-hardware-ecosystem.md) for Push 3's MPE-capable pad grid.
