# Plugin Ecosystem

## Native Plugin Architecture

FL Studio ships with over 100 native instruments and effects. Native plugins use Image-Line's proprietary plugin format, which provides tighter integration with the host than VST. All native plugins are also available as VST versions for use in other DAWs.

## Flagship Synthesizers

### Sytrus

FM/subtractive/ring modulation synthesizer with six operators. Each operator can function as carrier, modulator, or both. Features include:

- 6 operators with configurable routing matrix
- Waveshaping per operator (beyond pure sine FM)
- Ring modulation between operator pairs
- Built-in effects (chorus, delay, reverb)
- Unison and detune for thickness

Sytrus is FL Studio's most versatile synthesizer, capable of everything from classic FM bells to aggressive bass to atmospheric pads.

### Harmor

Additive/resynthesis synthesizer that operates in the frequency domain. Harmor can:

- Import audio and resynthesize it as additive partials
- Apply image files as spectral filters
- Morph between timbres via partial interpolation
- Process audio through frequency-domain effects (blur, prism, harmonize)

Harmor's image-to-sound capability allows importing a PNG file and using its pixel data as a spectral map -- a unique feature among commercial synthesizers.

### Gross Beat

Time and volume manipulation effect. Gross Beat applies predefined or user-drawn envelopes to time and volume parameters of incoming audio:

- **Time manipulation** -- half-speed, reverse, stutter, glitch, tape stop
- **Volume manipulation** -- sidechain-style pumping, tremolo, gating

Gross Beat is one of FL Studio's most culturally significant plugins, responsible for the characteristic "half-time" effect heard across trap, hip-hop, and EDM.

### FLEX

Preset-based instrument designed for immediate results. FLEX provides a curated library of sounds with macro controls for quick modification. It represents FL Studio's "instant gratification" philosophy -- high-quality sounds accessible without synthesis knowledge.

### Kepler

Cosmic-themed synthesizer introduced in FL Studio 2024. Features spectral synthesis with visual feedback showing the harmonic content of each sound.

### Maximus

Multiband compressor/limiter with three bands plus a master section. Each band provides compression, limiting, saturation, and stereo separation. Used extensively for mastering and loudness maximization.

## Sampling Instruments

### DirectWave

Multi-sample player and editor. Supports SFZ and DW formats. Features velocity layers, round-robin, and key splitting. Can auto-sample external MIDI instruments by playing every note and recording the output.

### Slicex

Beat slicer that imports audio, detects transients, and maps slices to MIDI notes. Used for drum loop manipulation, vocal chopping, and rhythmic audio rearrangement.

### Fruity Slicer 2

Simplified beat slicer for quick loop chopping. Less feature-rich than Slicex but faster for basic slice-and-dice operations.

## Effects Highlights

| Effect | Category | Notable Feature |
|--------|----------|-----------------|
| Fruity Parametric EQ 2 | EQ | Real-time spectrum analyzer overlay |
| Fruity Limiter | Dynamics | Combined compressor/limiter/gate |
| Fruity Reverb 2 | Reverb | Low-CPU algorithmic reverb |
| Fruity Love Philter | Filter | Multi-stage filter with LFO |
| Vocodex | Vocoder | 100-band vocoder |
| Pitcher | Pitch | Real-time pitch correction |
| NewTone | Pitch | Melodyne-style pitch editing |
| Patcher | Modular | Modular effect/instrument routing |

## ZGameEditor Visualizer

Unique among DAW plugins: ZGameEditor Visualizer generates real-time music visualizations synchronized to audio. Used to create visualizers for YouTube, social media, and live performance. Ships with dozens of preset visualizations and supports custom shader programming.

## AI Features (2024-2025)

- **FL Cloud AI Mastering** -- cloud-based mastering service integrated into the Mixer
- **Gopher** -- AI assistant for sound selection, parameter suggestion, and workflow guidance (FL Studio 2025)
- **Stem separation** -- AI-powered source separation for isolating vocals, drums, bass, and other elements from mixed audio

---

> **Related:** See [Technical Architecture](02-technical-architecture.md) for how these plugins integrate with the Mixer and Channel Rack, and [Cultural Impact](04-cultural-impact.md) for how specific plugins shaped specific genres.
