// tanager-warble.dsp
// FAUST generative synthesis: Western Tanager hoarse robin-like warble
// The degree 24 bird -- Piranga ludoviciana
//
// Sound character: hoarse, robin-like warble at 3-4 kHz
// Two-note phrases with descending inflection
// Rougher texture than robin (added noise modulation)
// Forest background: wind through Madrone canopy
//
// Target: stereo output, 44.1 kHz, generative (runs indefinitely)

import("stdfaust.lib");

// Tanager call: hoarse warble at 3-4 kHz
// Phrase structure: 2-3 notes, each ~0.2s, separated by ~0.1s gaps
// Phrases separated by 2-5 seconds of silence

// Phrase trigger (random interval 2-5 seconds)
phrase_clock = os.lf_pulsetrainpos(0.3, 0.4); // ~3.3s average period
note_clock = os.lf_pulsetrainpos(4.0, 0.5);   // 4 notes/sec during phrase

// Base frequency sweeps down within each note (descending inflection)
base_freq = 3600 - 400 * os.lf_trianglepos(5.0);

// Hoarseness: noise modulation on the carrier
hoarse_mod = 1 + 0.15 * no.noise : fi.lowpass(2, 200);

// Carrier with FM for roughness
carrier = os.osc(base_freq * hoarse_mod) * 0.08;

// Amplitude envelope per note
note_env = en.adsr(0.01, 0.05, 0.6, 0.08, note_clock);

// Phrase envelope (broader)
phrase_env = en.adsr(0.05, 0.1, 0.8, 0.3, phrase_clock);

// Combined tanager signal
tanager = carrier * note_env * phrase_env;

// Forest background: filtered noise (wind through Madrone)
wind = no.noise : fi.bandpass(4, 200, 1200) * 0.015;
// Distant forest ambience: very low rumble
forest = no.noise : fi.lowpass(4, 80) * 0.008;

// Mix
left = tanager + wind * 0.8 + forest;
right = tanager * 0.9 + wind * 1.2 + forest;
process = left, right;
