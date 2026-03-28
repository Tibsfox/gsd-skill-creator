# OctaMED Deep Dive

## Origins

OctaMED was created by Finnish programmer Teijo Kinnunen, beginning in 1989 as MED (Music EDitor). The "Octa" prefix arrived when Kinnunen implemented software mixing to double the Amiga's four hardware channels to eight virtual voices -- a breakthrough that defined the application's identity and niche.

## Version History

| Version | Year | Key Addition |
|---------|------|-------------|
| MED 1.0 | 1989 | Basic 4-channel tracker with MIDI support |
| MED 2.0 | 1990 | Improved editor, more effects |
| MED 3.0 | 1991 | Enhanced MIDI, better sample editing |
| OctaMED 1.0 | 1991 | 8-channel software mixing introduced |
| OctaMED Professional | 1992 | Commercial release, notation display |
| OctaMED SoundStudio | 1995 | 64 virtual channels, mixing console |
| OctaMED SoundStudio 2 | 2003 | Final major release |

## Software Mixing Architecture

### The Breakthrough

Standard Amiga trackers (ProTracker, NoiseTracker) drove Paula's four hardware channels directly. Each channel played one sample at one pitch at one volume. The 68000 CPU handed off PCM data to Agnus/Paula's DMA with minimal overhead -- roughly 3% CPU utilization.

OctaMED's software mixing changed the equation entirely:

1. Route two virtual channels through each of Paula's four hardware channels
2. The CPU mixes two sample streams into one before sending to Paula
3. Result: 8 simultaneous voices on hardware that supports 4

### CPU Cost

Software mixing consumed approximately 40% of a stock Amiga 500's 68000 CPU at 7.09 MHz. This was a significant cost -- games and demos could not afford it. But OctaMED was not for games. It was for composition: standalone musical works where the CPU had no competing demands.

The trade was: lose 40% CPU, gain 100% more voices. For musicians, this was overwhelmingly worthwhile.

### Mixing Quality

The software mixing process introduced some quality degradation compared to direct hardware playback:

- Effective bit depth reduced slightly due to mixing arithmetic
- Slight increase in noise floor
- Sample rate constrained by CPU speed

Despite these limitations, the quality was acceptable for composition and vastly preferable to the creative constraint of only four voices.

## MIDI Support

OctaMED was unique among Amiga trackers in providing native MIDI output. This enabled:

- **External synthesis** -- trigger MIDI synthesizers, drum machines, and samplers from OctaMED patterns
- **Hybrid composition** -- mix Amiga sample channels with MIDI-controlled external instruments
- **Extended polyphony** -- MIDI instruments added unlimited voices beyond the 8 software-mixed channels
- **Professional studio integration** -- connect the Amiga to professional studio equipment

MIDI support transformed OctaMED from a demoscene tool into a viable composition platform for professional electronic music production.

## Notation Display

OctaMED included a notation display mode that rendered pattern data as conventional musical notation (staff, notes, time signatures). While limited compared to dedicated notation software, this feature bridged the gap between tracker culture and traditional music literacy.

## Arbitrary Pattern Lengths

Unlike MOD's fixed 64-row patterns, OctaMED supported arbitrary pattern lengths. Patterns could be as short as 1 row or as long as 3200 rows. This enabled:

- Complex time signatures without pattern-length hacks
- Extended passages without pattern breaks
- Structural flexibility for non-4/4 music

## The MED/OctaMED File Formats

OctaMED used its own file format (MED/MMD) rather than the standard MOD format:

| Format | Extension | Features |
|--------|-----------|----------|
| MED | .MED | 4-channel, MIDI support |
| MMD0 | .MED | 8-channel, software mixing |
| MMD1 | .MED | Enhanced, longer patterns |
| MMD2 | .MED | Mixing console, 64 channels |

The MED formats were not directly compatible with MOD players, creating a parallel ecosystem. OctaMED could import MOD files but exported to its own format.

## Notable OctaMED Users

OctaMED's MIDI capabilities and extended polyphony attracted users beyond the typical demoscene audience:

- **Allister Brimble** -- game music composer (Alien Breed, Superfrog) used MED/OctaMED
- **Chris Huelsbeck** -- pioneered Amiga game music (Turrican series), influenced by tracker paradigm
- **UK hardcore/rave producers** -- OctaMED's MIDI support connected Amiga trackers to outboard studio gear
- **Ambient/electronic musicians** -- the 8-channel capability enabled atmospheric compositions impossible in 4-channel trackers

## Legacy and Influence

OctaMED demonstrated that software leverage could transcend hardware limitations -- the core Amiga Principle. Its specific contributions to the broader tracker ecosystem include:

1. **Proving software mixing was viable** -- later PC trackers adopted this approach universally
2. **Bridging tracker and MIDI worlds** -- paving the way for Renoise's VST integration
3. **Arbitrary pattern lengths** -- adopted by FastTracker 2 (XM format) and subsequent trackers
4. **Professional composition tool** -- demonstrating that trackers were not limited to demoscene/game use

---

> **Related:** See [Paula Architecture](01-paula-architecture.md) for the hardware OctaMED pushed beyond its specifications, and [Tracker Family Tree](04-tracker-family-tree.md) for OctaMED's position in the broader genealogy.
