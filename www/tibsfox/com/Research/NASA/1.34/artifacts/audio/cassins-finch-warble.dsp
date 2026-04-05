// cassins-finch-warble.dsp
// FAUST DSP: Generative Cassin's Finch warbling song
// Complex warble with mimicry elements
// Frequency center: 3.5 kHz (typical Cassin's Finch range)
// Duration: continuous generative
//
// Cassin's Finch song characteristics:
//   - Long, complex warble (5-15 seconds per bout)
//   - Rapid frequency sweeps (2-5 kHz range)
//   - Mimicry elements from other species
//   - Delivered from exposed perch at mountain elevation
//
// Build: faust2lv2 cassins-finch-warble.dsp

import("stdfaust.lib");

// Song parameters
center_freq = 3500;
sweep_range = 1500;
syllable_rate = 8.0;  // syllables per second

// Frequency modulation (warbling)
warble_lfo = os.osc(syllable_rate) * sweep_range;
vibrato = os.osc(25) * 100;  // fast vibrato within syllables

// Main tone (band-limited for bird-like quality)
freq = center_freq + warble_lfo + vibrato;
tone = os.osc(freq) * 0.3 + os.osc(freq * 2.01) * 0.15 + os.osc(freq * 3.02) * 0.05;

// Amplitude modulation (syllable structure)
syllable_env = abs(os.osc(syllable_rate * 0.5)) : si.smooth(0.999);

// Song bout envelope (5-15 seconds on, 3-8 seconds off)
bout_lfo = os.lf_saw(0.08) > 0.3;  // approximately 70% singing, 30% silence

// Forest ambience (very subtle)
forest = no.noise * 0.01 : fi.lowpass(2, 800);

process = (tone * syllable_env * bout_lfo * 0.6 + forest) <: _, _;
