// T+77 — Pioneer 0 Launch and Failure Synthesizer
// FAUST DSP source — compiles to VST, AU, LV2, JACK, CLI
//
// Mission 1.1: Pioneer 0 (Thor-Able 1)
// The sound of 77 seconds: ignition → thrust → bearing failure → silence
//
// Build:
//   faust2jaqt t77-synth.dsp          # JACK/Qt standalone
//   faust2lv2  t77-synth.dsp          # LV2 plugin
//   faust2vst  t77-synth.dsp          # VST plugin (needs VST SDK)
//   faust2faustvst t77-synth.dsp      # FAUST VST (no SDK needed)
//
// Parameters:
//   - Phase (0-1): manual control of the 77-second timeline
//   - Auto: toggle automatic phase progression
//   - Intensity: overall volume/intensity
//   - Bearing Decay: rate of bearing degradation sound
//
// Install FAUST: https://faust.grame.fr/downloads/

import("stdfaust.lib");

// --- Parameters ---
phase = hslider("[0]Phase", 0, 0, 1, 0.001) : si.smoo;
auto_mode = checkbox("[1]Auto (77s cycle)");
intensity = hslider("[2]Intensity", 0.7, 0, 1, 0.01) : si.smoo;
bearing_decay = hslider("[3]Bearing Decay Rate", 0.5, 0.1, 2.0, 0.01) : si.smoo;

// Auto-advancing phase (77-second cycle)
auto_phase = os.phasor(1, 1.0/77.0);
active_phase = select2(auto_mode, phase, auto_phase);

// --- Engine Noise Generator ---
// Pink noise filtered through resonant peaks simulating combustion roar

engine_noise = no.pink_noise : fi.resonhp(80, 2, 1.0)  // Remove subsonic
             : fi.resonlp(8000, 1.5, 1.0)               // High cut
             : *(engine_gain)
with {
  // Engine ramps up during ignition, steady during flight, cuts at failure
  engine_gain = active_phase : ignition_envelope;
  ignition_envelope(p) = ba.if(p < 0.05,        // Ignition ramp (0-5%)
                           p / 0.05,
                         ba.if(p < 0.93,          // Steady thrust (5-93%)
                           1.0,
                         ba.if(p < 0.95,          // Thrust cutoff (93-95%)
                           (0.95 - p) / 0.02,
                           0.0)));                 // Silence (95-100%)
};

// --- Combustion Crackle ---
// Impulsive noise simulating turbulent combustion
crackle = no.noise : *(no.noise > 0.97 : *(0.3))  // Sparse impulses
        : fi.resonbp(2000, 5, 1.0)                 // Band-pass around 2kHz
        : *(active_phase < 0.93);                   // Only during thrust

// --- Mach Diamond Tonal Component ---
// Subtle tonal element from shock diamonds in the exhaust
mach_tone = os.osc(fundamental) * 0.1 * shock_env
with {
  // Fundamental frequency rises with velocity (Doppler-ish)
  fundamental = 60 + active_phase * 200;
  shock_env = ba.if(active_phase < 0.93, 1.0, 0.0);
};

// --- Bearing Whine ---
// Rising frequency tone simulating failing turbopump bearing
// Appears at ~90% phase (T+69), intensifies to failure at 93% (T+73.6)
bearing = os.sawtooth(bearing_freq) * bearing_env * 0.15
        + os.sawtooth(bearing_freq * 2.03) * bearing_env * 0.08  // Harmonics
        + os.sawtooth(bearing_freq * 3.17) * bearing_env * 0.04
with {
  bearing_freq = 800 + (active_phase - 0.9) * 15000 * bearing_decay;
  bearing_env = ba.if(active_phase > 0.88 & active_phase < 0.95,
                  min((active_phase - 0.88) / 0.02, 1.0) *
                  ba.if(active_phase < 0.93, 1.0, max(0.0, (0.95 - active_phase) / 0.02)),
                  0.0);
};

// --- Explosion ---
// Broadband impulse + resonant decay
explosion = (no.noise * exp_env : fi.resonlp(1500, 0.5, 1.0)) * 0.8
          + (no.noise * exp_env * 0.3 : fi.resonbp(400, 3, 1.0))  // Low rumble
with {
  exp_env = ba.if(active_phase > 0.95 & active_phase < 0.99,
              exp(-(active_phase - 0.95) * 80.0),
              0.0);
};

// --- Debris / Aftermath ---
// Sparse, quiet impacts
debris = no.noise * debris_env * 0.05
       : fi.resonlp(500, 1, 1.0)
with {
  debris_env = ba.if(active_phase > 0.97,
                 (no.noise > 0.995) * 0.5,
                 0.0);
};

// --- Mix ---
process = (engine_noise + crackle + mach_tone + bearing + explosion + debris)
        * intensity
        : fi.dcblocker
        <: _,_;  // Stereo output (mono duplicated)
