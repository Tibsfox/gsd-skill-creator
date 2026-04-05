// Rough-Winged Buzz — Northern Rough-winged Swallow vocalization
// FAUST generative synthesizer
// Low buzzy trill, solitary, over river ambience
//
// The Northern Rough-winged Swallow produces a short, rough buzzing call
// "brzzzt" — lower-pitched and less musical than Tree Swallow or
// Violet-green Swallow. Frequency centered around 2000-3500 Hz with
// broadband noise components giving the "rough" quality.

import("stdfaust.lib");

// Buzz fundamental: ~2500 Hz with frequency jitter
buzzFreq = 2500 + no.noise * 200;
buzz = os.sawtooth(buzzFreq) * 0.15;

// Roughness: ring modulation with noise
roughness = buzz * (0.5 + 0.5 * no.noise) * 0.8;

// Call envelope: short bursts (50-80ms) at irregular intervals
callRate = 3.0 + os.osc(0.1) * 1.5;  // 1.5 to 4.5 Hz call rate
callEnv = max(0, os.osc(callRate)) : ^(8);  // sharp attack, fast decay

// River ambience: filtered noise
river = no.noise : fi.lowpass(2, 800) * 0.08;
riverStereo = no.noise : fi.lowpass(2, 600) * 0.06;

// Solitary call with reverb
call = (buzz + roughness) * callEnv * 0.3;
delayedCall = call@(ma.SR * 0.25) * 0.15;  // distant echo

// Mix: call slightly left, echo right, river centered
process = (call + river + delayedCall * 0.3),
          (call * 0.5 + riverStereo + delayedCall);
