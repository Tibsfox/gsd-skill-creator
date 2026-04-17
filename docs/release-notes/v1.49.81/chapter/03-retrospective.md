# Retrospective — v1.49.81

## What Worked

1. **The signal-to-output pipeline reveals structural unity.** DSP → hardware implementation → audio processing → LED control → stage lighting → MIDI synchronization is one continuous signal path. Each module handles a different segment but they connect end-to-end. The same math (convolution, z-transforms, timing protocols) appears at every level.

2. **MIDI 2.0 documentation captures a generational transition.** Module 06's 607 lines document MIDI's most significant upgrade in 41 years. The backward compatibility analysis — how 2.0 UMP packets coexist with 1.0 byte streams — is infrastructure engineering at its finest. The protocol survives because it was designed to be extended, not replaced.

3. **The LED POV module bridges physics and engineering.** Critical flicker frequency is psychophysics. APA102 timing is electronics. RP2040 PIO programming is computer science. Module 04 connects all three into a single narrative about how persistence of vision becomes a display technology.

## What Could Be Better

1. **Video and projection mapping protocols are absent.** SGL covers audio (DSP, MIDI) and lighting (DMX, LED) but not video (NDI, Dante AV, SMPTE 2110). A future study could complete the live performance protocol stack.

## Lessons Learned

1. **Protocols are infrastructure.** MIDI (1983), DMX512 (1986), and Art-Net (1998) are protocols that outlasted every product built on them. The same principle documented throughout the Research series — infrastructure persists while applications rotate — applies to control protocols just as it applies to radio frequencies and fiber optics.

2. **The signal path is the show.** Every live performance is a signal processing pipeline. Microphone → preamp → DSP → amplifier → speaker is the audio chain. Lighting console → DMX → dimmer → fixture is the light chain. MIDI controller → synthesizer → DAC → monitor is the control chain. SGL documents the infrastructure that makes performance possible. The audience sees the art. The engineer sees the signal path.

---
