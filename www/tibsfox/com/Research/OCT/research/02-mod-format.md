# MOD Format and Tracker Paradigm

## The Module File Concept

A module file stores music as two components: a set of digital audio **samples** (the instruments) and a set of **patterns** (the score). Unlike MIDI files, which depend on external synthesizers, a module file is completely self-contained. Unlike raw audio recordings, a module file is compact -- a full song with 31 samples typically occupies 100-200 KB.

This self-containment made modules ideal for demoscene productions, game soundtracks, and BBS distribution. A single file could be copied, shared, and played back identically on any compatible Amiga.

## MOD Binary Layout

### Header Structure

| Offset | Length | Content |
|--------|--------|---------|
| 0 | 20 bytes | Song title (padded with nulls) |
| 20 | 30 bytes x 31 | Sample definitions (name, length, finetune, volume, loop) |
| 950 | 1 byte | Song length (number of positions in order list) |
| 951 | 1 byte | Restart position (for looping) |
| 952 | 128 bytes | Pattern order table (which pattern plays at each position) |
| 1080 | 4 bytes | Format tag ("M.K." for 31-sample, 4-channel MOD) |
| 1084+ | variable | Pattern data |
| after patterns | variable | Sample PCM data (8-bit signed) |

The "M.K." tag (attributed to Mahoney & Kaktus of the NoiseTracker team) identifies the file as a 31-sample, 4-channel MOD. Earlier 15-sample MODs lack this tag.

### Pattern Data Structure

Each pattern contains 64 rows. Each row contains one cell per channel (4 channels = 4 cells per row). Each cell is 4 bytes:

```
Byte 0: Sample number (upper 4 bits) + Period high nibble
Byte 1: Period low byte
Byte 2: Sample number (lower 4 bits) + Effect command
Byte 3: Effect parameter
```

Total pattern size: 64 rows x 4 channels x 4 bytes = 1024 bytes per pattern.

## Effect Commands

The MOD effect vocabulary provides real-time sound manipulation:

| Effect | Hex | Description |
|--------|-----|-------------|
| Arpeggio | 0xy | Rapidly alternate between note, note+x, note+y semitones |
| Portamento Up | 1xx | Slide pitch up by xx units per tick |
| Portamento Down | 2xx | Slide pitch down by xx units per tick |
| Tone Portamento | 3xx | Slide to target note at speed xx |
| Vibrato | 4xy | Oscillate pitch (speed x, depth y) |
| Volume Slide | Axy | Slide volume up (x) or down (y) per tick |
| Position Jump | Bxx | Jump to position xx in order table |
| Set Volume | Cxx | Set channel volume to xx (0-64) |
| Pattern Break | Dxx | Jump to row xx of next pattern |
| Set Speed | Fxx | Set ticks per row (1-31) or BPM (32-255) |

These effects are the expressive vocabulary of tracker composition. A skilled composer can create vibrato, tremolo, pitch slides, arpeggios, and rhythmic variations entirely through effect commands applied to individual notes.

## The VSync Timing Model

Original MOD playback is synchronized to the display's vertical blank interrupt (VSync):

- **PAL:** 50 Hz VSync = 50 ticks per second
- **NTSC:** 60 Hz VSync = 60 ticks per second

At the default speed of 6 ticks per row, a PAL system plays approximately 8.33 rows per second. This timing model tied music playback to the display hardware -- a characteristic shared with game soundtracks that needed to synchronize with animation.

## The Tracker Workflow

The tracker interface displays patterns as a vertical grid:

```
Channel 1    Channel 2    Channel 3    Channel 4
---------    ---------    ---------    ---------
C-3 01 ...   --- 00 ...   E-4 05 A04   --- 00 ...
--- 00 ...   D-3 03 ...   --- 00 ...   G-4 07 ...
E-3 01 ...   --- 00 ...   --- 00 C20   --- 00 ...
--- 00 ...   --- 00 ...   F-4 05 300   A-3 07 ...
```

Each row represents a time position. Columns represent channels. The grid scrolls vertically as the music plays -- time flows downward. This vertical-time paradigm is fundamentally different from the horizontal-time paradigm of conventional DAWs and sheet music.

The tracker interface is deterministic: every parameter of every event is explicitly specified. There is no "interpretation" layer between the score and the playback. What you see in the grid is exactly what you hear.

## Format Limitations

The MOD format has specific constraints that shaped composition practice:

- **4 channels** -- hard limit matching Paula's hardware
- **8-bit samples** -- matching Paula's DAC resolution
- **64 rows per pattern** -- fixed pattern length
- **31 samples maximum** -- header structure limit
- **128 pattern positions** -- order table length
- **No per-note volume in standard MOD** -- volume changes via effect commands only

These limitations were not bugs -- they were the architectural boundaries within which an extraordinary musical culture was created.

---

> **Related:** See [Paula Architecture](01-paula-architecture.md) for the hardware these formats target, and [Tracker Family Tree](04-tracker-family-tree.md) for how successor formats transcended MOD's limitations.
