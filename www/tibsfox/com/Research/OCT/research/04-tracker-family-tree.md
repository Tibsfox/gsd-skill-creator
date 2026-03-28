# Tracker Family Tree

## The Complete Genealogy

```
1986  SoundMonitor (Chris Huelsbeck, C64) -- precursor concept
         |
1987  Ultimate Soundtracker (Karsten Obarski, Amiga) -- the first tracker
         |
    +----+----+
    |         |
1989 NoiseTracker      MED 1.0 (Teijo Kinnunen)
    (Pex Tansen)       |
    |                  |
1990 ProTracker        MED 2.0-3.0
    (Lars Hamre        |
     et al.)          |
    |                 |
    |            1991 OctaMED 1.0 (8 channels)
    |                 |
    |            1992 OctaMED Professional
    |                 |
    |            1995 OctaMED SoundStudio (64 ch)
    |
    +---- Amiga Branch (MOD format, 4 channels) ----
    |
    |---- PC Branch begins ----
    |
1992  ScreamTracker 3 (Sami Tammilehto / Future Crew)
       Format: S3M -- 16+ channels, PC speaker/SB/GUS
       |
1993  FastTracker 2 (Vince Hogdahl + Fredrik Huss / Triton)
       Format: XM -- linear volumes, envelopes, 128 channels
       |
1995  Impulse Tracker (Jeffrey Lim, Australia)
       Format: IT -- NNA, filters, 256 channels
       |
    +----+----+
    |         |
1997 ModPlug   2002 Renoise (Eduard Muller)
    Tracker         |
    |          Professional tracker DAW
    |          VST support, LuaJIT scripting
    |
2004 OpenMPT (open-sourced ModPlug Tracker)
       Format museum: MOD, S3M, XM, IT, MPTM
```

## Format Evolution Table

| Format | Year | Channels | Resolution | Samples | Key Innovation |
|--------|------|----------|------------|---------|----------------|
| MOD | 1987 | 4 | 8-bit | 31 | Module file concept |
| MED/MMD | 1989 | 4-64 | 8-bit | 63 | MIDI support, arbitrary patterns |
| S3M | 1992 | 16-32 | 8/16-bit | 99 | PC platform, expanded channels |
| XM | 1993 | 32-128 | 8/16-bit | 128 | Volume/panning envelopes, instruments |
| IT | 1995 | 64-256 | 8/16-bit | 99 | NNA, resonant filters, sample compression |
| MPTM | 2004 | 127 | 8/16/32-bit | 4000 | Modern OpenMPT format, VST integration |

## Key Innovations Per Format

### S3M (ScreamTracker 3)

ScreamTracker 3 by Sami Tammilehto of Future Crew brought trackers to the IBM PC. Key additions:

- Support for Sound Blaster and Gravis Ultrasound hardware
- 16+ channels via software mixing
- 16-bit sample support
- Adlib FM synthesis channels alongside PCM
- Panning control per channel

### XM (FastTracker 2)

FastTracker 2 by Triton (Vince Hogdahl and Fredrik Huss) introduced:

- **Instruments** -- multi-sample instruments with volume and panning envelopes
- **Linear frequency table** -- smoother pitch slides compared to Amiga period table
- **Up to 128 channels** -- via software mixing
- **Pattern lengths up to 256 rows** -- following OctaMED's lead

### IT (Impulse Tracker)

Impulse Tracker by Jeffrey Lim (Australia) was the most technically advanced DOS tracker:

- **New Note Actions (NNA)** -- notes could continue playing when a new note starts on the same channel
- **Resonant filters** -- per-note low-pass filter with resonance
- **Sample compression** -- IT's own lossless compression format
- **Virtual channels** -- NNA could produce more simultaneous voices than the channel count
- **Global and per-channel volumes** -- layered volume control

## The MED/OctaMED Branch

The MED/OctaMED family represents a parallel evolutionary branch:

- Diverged from the MOD mainstream in 1989
- Added MIDI before any other tracker
- Achieved 8 channels via software mixing before PC trackers existed
- Used its own incompatible file format
- Catered to musicians rather than demoscene
- Influenced the broader tracker world through features later adopted by competitors

## Branch Points and Convergences

The tracker family tree shows several key branch points:

1. **Amiga to PC migration (1992)** -- ScreamTracker 3 proved trackers could work on PC hardware
2. **MOD to proprietary formats (1992-1995)** -- S3M, XM, IT each introduced incompatible extensions
3. **MED/OctaMED parallel evolution** -- independent feature development influencing the main branch
4. **DOS to Windows transition (1997-2004)** -- ModPlug Tracker and eventually OpenMPT brought trackers to Windows
5. **Tracker to DAW hybrid (2002)** -- Renoise bridged the tracker paradigm with modern DAW features

---

> **Related:** See [MOD Format](02-mod-format.md) for the foundational format all these variants extend, and [Demoscene Culture](05-demoscene-culture.md) for the community that drove format evolution.
