# Paula Architecture and Hardware Constraints

## MOS 8364 -- The Paula Chip

Paula (MOS 8364) is the Commodore Amiga's audio and floppy disk controller chip, part of the Original Chip Set (OCS) designed by Jay Miner's team at Amiga Corporation. Paula provides four independent DMA-driven PCM audio channels.

## Channel Architecture

### Four Hardware Channels

| Channel | Output | DMA Slot | Notes |
|---------|--------|----------|-------|
| Channel 0 | LEFT | Even | Paired with Channel 3 for stereo |
| Channel 1 | RIGHT | Odd | Paired with Channel 2 for stereo |
| Channel 2 | RIGHT | Even | Hard-panned, no center mix in hardware |
| Channel 3 | LEFT | Odd | Hard-panned, no center mix in hardware |

The hard-panning configuration (channels 0+3 left, channels 1+2 right) was a hardware design decision that shaped the entire tracker music aesthetic. True center panning required software mixing of two channels, sacrificing half the available polyphony.

### Per-Channel Specifications

- **Resolution:** 8-bit signed PCM (-128 to +127)
- **Volume:** 6-bit (0-64), giving 65 discrete volume levels
- **Period:** 16-bit value controlling playback rate (higher period = lower pitch)
- **Length:** 16-bit word count (max 131,070 bytes per sample, ~1.5 seconds at 28 kHz)
- **DMA:** Zero-CPU sample playback via Agnus DMA controller

### Register Map

```
AUDxLCH/AUDxLCL  -- Sample start address (high/low word)
AUDxLEN           -- Sample length in words
AUDxPER           -- Period (playback rate divisor)
AUDxVOL           -- Volume (0-64)
AUDxDAT           -- Direct data write (bypasses DMA)
```

Each channel's registers occupy 16 bytes in the custom chip address space, starting at $DFF0A0 for Channel 0.

## DMA-Driven Playback

Paula's audio is entirely DMA-driven. Once a sample address, length, period, and volume are programmed, the Agnus chip fetches audio data from RAM and feeds it to Paula's DAC with zero CPU involvement. This is why tracker playback consumes approximately 3% CPU on a stock Amiga 500 -- the 68000 only needs to update channel registers between notes; actual sample playback is handled by dedicated hardware.

### Timing Model

Paula's playback rate is derived from the system clock:

- **PAL systems:** 3,546,895 Hz base clock
- **NTSC systems:** 3,579,545 Hz base clock

The playback frequency for a given period value is: `frequency = base_clock / (period * 2)`

Common period values for musical notes were documented in the Amiga Hardware Reference Manual and became the standard pitch table used by all trackers.

## The Hardware Low-Pass Filter

The Amiga includes a hardware low-pass filter on the audio output path, with a cutoff frequency of approximately 4.4 kHz (for the standard RC filter) or 3.3 kHz (for the additional "LED filter" toggled by the power LED brightness). The LED filter was controlled by CIA-B bit 1, allowing software to enable or disable it.

Trackers typically disabled the LED filter for brighter, crisper audio. The filter's presence shaped the characteristic "warm" sound of Amiga music and influenced composers to use brighter samples to compensate for the filtering.

## The 14-Bit Hack

A technique discovered by the Amiga community to achieve 14-bit audio resolution from 8-bit hardware:

1. Play the upper 8 bits on one channel at full volume (64)
2. Play the lower 6 bits on an adjacent channel at volume 1
3. The analog mixing of both channels produces an effective 14-bit signal

This technique costs two of the four available channels, reducing polyphony to two voices, but produces dramatically cleaner audio. It was used primarily for sample playback applications rather than music composition.

## Agnus and the DMA Budget

Paula does not operate independently -- its DMA access is scheduled by Agnus (the Amiga's DMA controller). Audio DMA shares bandwidth with display (bitplanes, sprites, copper) and disk DMA. The DMA budget is allocated per scanline:

- Each audio channel requires 2 DMA slots per scanline
- Total audio DMA: 8 slots per scanline (out of ~226 available)
- Audio DMA is high-priority and rarely conflicts with display

This architecture means that audio playback is rock-solid -- Paula never misses a sample -- but the available bandwidth for display decreases slightly when all four channels are active.

## AGA and Later Revisions

The AGA (Advanced Graphics Architecture) chipset in the Amiga 1200 and 4000 did not significantly alter Paula's audio capabilities. The audio subsystem remained 4-channel, 8-bit, with the same register interface. Audio improvements on later Amiga hardware came through software mixing (as OctaMED demonstrated) rather than hardware upgrades.

---

> **Related:** See [MOD Format](02-mod-format.md) for how the tracker paradigm exploits Paula's architecture, and [OctaMED Deep Dive](03-octamed-deep-dive.md) for how software mixing transcended the 4-channel limit.
