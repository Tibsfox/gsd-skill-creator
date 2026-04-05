// descent-sonification.dsp
// FAUST DSP: Ranger 7 descent mapped to sound
// Resolution improvement → harmonic complexity increase
// Altitude decrease → pitch rise
// Impact → silence
//
// Duration: 90 seconds (compressing 17.22 minutes)
// Mapping: altitude (2110 km → 0) to frequency (100 Hz → 4000 Hz)
// Harmonic partials added as resolution improves
// Final 0.5 seconds: white noise burst (impact), then silence
//
// Build: faust2lv2 descent-sonification.dsp
//        faust2vst descent-sonification.dsp

import("stdfaust.lib");

// Time-based altitude simulation (0 to 1 over 90 seconds)
descent = ba.time / (90.0 * ma.SR) : min(1.0);

// Frequency rises with descent (log scale)
base_freq = 100.0 * pow(40.0, descent);

// Harmonic complexity increases with descent
n_harmonics = 1 + int(descent * 15);

// Fundamental oscillator with growing harmonics
tone = sum(i, 16, (i < n_harmonics) * os.osc(base_freq * (i+1)) / (i+1));

// Amplitude envelope (crescendo during descent, cut at impact)
impact = descent >= 0.998;
env = (1.0 - impact) * (0.3 + 0.7 * descent);

// Impact noise burst
impact_noise = no.noise * ba.pulse(int(0.05 * ma.SR)) * impact * 2.0;

// Output
process = (tone * env + impact_noise) * 0.5 <: _, _;
