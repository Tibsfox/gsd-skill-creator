# Core Architecture and Audio Engine

## Session View vs. Arrangement View

Ableton Live's defining architectural innovation is the dual-view paradigm: two fundamentally different relationships with time sharing the same tracks, clips, and devices.

**Session View** is a non-linear performance space. Clips occupy a grid of clip slots organized by track (columns) and scene (rows). Any clip can be launched at any time. Scenes can trigger entire rows simultaneously. The music breathes without committing to a sequence -- clips loop, combine, and dissolve as the performer directs.

**Arrangement View** is a conventional linear timeline. Audio and MIDI clips are placed on a horizontal axis from left to right. This is where improvisation becomes composition -- where the free-flowing Session performance crystallizes into a fixed arrangement.

### The Tab Key and Back to Arrangement

The Tab key switches between views. Tracks are shared -- both views address the same mixer channels, instruments, and effects. The critical interaction point is the **Back to Arrangement** button: when clips are launched in Session View, they override whatever was recorded in the Arrangement. The small orange "Back to Arrangement" indicator on each track shows which tracks are currently being overridden. Pressing it restores the Arrangement's version of that track.

This interaction trips up experienced users for months. The mental model required is: Session View is a *performance overlay* on top of the Arrangement. It takes priority when active but does not destroy what lies beneath.

### Recording Session to Arrangement

The bridge between views is the global Record button while in Session View. With recording armed, every clip launch, scene trigger, and parameter change is captured as an Arrangement recording -- improvisation committed to linear time.

## Audio Engine Architecture

### Sample Rate and Bit Depth

Live 12 operates internally at 32-bit floating-point resolution. Supported sample rates range from 44,100 Hz to 192,000 Hz. The engine processes audio in configurable buffer sizes from 32 to 2048 samples, with ASIO (Windows) and Core Audio (macOS) as primary driver interfaces.

### Warping Algorithms

Time-stretching in Live is handled by warping -- the ability to change the tempo of audio clips without affecting pitch (and vice versa). Live 12 provides six warping modes:

| Mode | Algorithm | Best For |
|------|-----------|----------|
| Beats | Transient-preserving | Drums, percussion, rhythmic material |
| Tones | Granular | Monophonic instruments, vocals |
| Texture | Granular (larger grains) | Ambient, pads, complex textures |
| Re-Pitch | Varispeed (no time-stretch) | DJ-style speed changes |
| Complex | Phase vocoder | Full mixes, polyphonic material |
| Complex Pro | Enhanced phase vocoder | High-quality full-mix processing |

Complex Pro is the highest-quality mode, suitable for mastering-grade time-stretching, but is also the most CPU-intensive.

### Plugin Delay Compensation (PDC)

Live's audio engine implements automatic plugin delay compensation across all tracks. Each plugin reports its processing latency, and the engine adjusts timing across all signal paths to maintain phase alignment. This is critical for multi-track sessions where different tracks may have different total plugin latency chains.

## Track Architecture

### Track Types

- **Audio tracks** -- record and play audio clips; host audio effects
- **MIDI tracks** -- record and play MIDI clips; host instruments and MIDI effects
- **Return tracks** -- receive signal from send knobs on other tracks (global effects bus)
- **Master track** -- final stereo output; hosts master effects chain
- **Group tracks** (Live 12) -- fold multiple tracks into a submix group

### Clip Structure

Every clip in Live contains:

- **Audio or MIDI data** -- the actual content
- **Warp markers** (audio) -- timing adjustment points
- **Launch settings** -- trigger behavior (trigger, gate, toggle, repeat)
- **Follow actions** -- what happens after the clip finishes playing
- **Envelope lanes** -- per-clip automation of any device parameter

### Routing and I/O

Each track has configurable input and output routing. Audio can be tapped from any point in any track's signal chain (pre-FX, post-FX, post-mixer). MIDI routing supports both external hardware and internal instrument tracks. This flexible routing enables complex signal-flow architectures including sidechaining, parallel processing, and resampling.

## Automation System

Live supports two automation modes:

1. **Arrangement automation** -- drawn on the timeline in Arrangement View, plays back in sequence
2. **Clip automation** -- embedded within individual clips, loops with the clip

Session automation (clip envelopes) overrides Arrangement automation when a clip is playing, following the same override hierarchy as audio/MIDI content.

## Performance Considerations

### CPU Metering

Live displays real-time CPU load in the status bar. The "CPU" indicator shows the percentage of available processing time consumed by the audio engine. Values above ~70% typically result in audible artifacts (clicks, dropouts).

### Freeze and Flatten

Tracks can be **frozen** -- rendered to a temporary audio file, freeing CPU resources while preserving editability. **Flattening** commits the freeze permanently, replacing the original clips and devices with rendered audio.

### Max Threads

Live 12 supports multi-core processing, distributing tracks across available CPU cores. The effectiveness depends on session architecture -- parallel signal paths benefit most; serial chains (track feeding track) cannot be parallelized.

---

> **Related:** See [Instruments & Sound Design](02-instruments.md) for the synthesis architectures these tracks host, and [Extensibility Layer](04-extensibility.md) for programmatic access to the audio engine via the Live Object Model.
