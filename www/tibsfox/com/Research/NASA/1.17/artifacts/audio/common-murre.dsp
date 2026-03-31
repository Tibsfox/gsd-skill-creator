// Common Murre Call — Uria aalge
// FAUST DSP source — generative seabird vocalization
//
// Mission 1.17 Bird: Common Murre (degree 17 in 360 series)
// A low, growling, purring "aaarrrr" call at 1-2 kHz. Rough,
// vibrating, guttural. Colonial nesting seabird — breeds in
// dense colonies on cliff ledges, so calls overlap constantly.
//
// The call is a raspy, drawn-out growl lasting 0.5-1.5 seconds,
// with a fundamental around 800-1200 Hz and strong harmonics
// creating the characteristic rough, buzzing quality. In dense
// colonies, dozens of birds call simultaneously creating a
// continuous droning chorus.
//
// Build:
//   faust2jaqt common-murre.dsp      # JACK/Qt standalone
//   faust2lv2  common-murre.dsp      # LV2 plugin
//
// This is a generative synthesizer — produces continuous calls
// with colonial overlap from multiple virtual birds.

import("stdfaust.lib");

// --- Parameters ---
call_rate = hslider("[0]Call Rate (per min)", 6, 1, 20, 0.1) : si.smoo;
rasp = hslider("[1]Rasp", 0.8, 0, 1, 0.01) : si.smoo;
colony_size = hslider("[2]Colony Density", 0.6, 0, 1, 0.01) : si.smoo;
wind_mix = hslider("[3]Cliff Wind", 0.25, 0, 1, 0.01) : si.smoo;

// --- Hash functions for per-bird variation ---
hash1(p) = fract(sin(p * 127.1) * 43758.5453);

// --- Primary Bird Call ---
// Each bird has a unique phase offset, pitch, and call duration
call_period = 60.0 / max(1.0, call_rate);
call_phase = os.phasor(1, 1.0 / call_period);

// Call envelope: ~0.8 seconds on, with rough onset/offset
// Murre calls are not clean — they start ragged and end ragged
call_dur = 0.5;  // Fraction of period occupied by call
call_env = ba.if(call_phase < call_dur,
             ba.if(call_phase < 0.04,
               call_phase / 0.04,                    // Rough attack: ~60ms
             ba.if(call_phase < call_dur - 0.06,
               1.0 - 0.15 * os.osc(12.0),            // Sustain with tremolo
               max(0.0, (call_dur - call_phase) / 0.06))),  // Ragged release
             0.0)
         : si.smoo;

// --- Fundamental Pitch ---
// Murre growl: fundamental around 1000 Hz, relatively steady
// with slight downward drift and strong vibrato (throat vibration)
pitch_env = ba.if(call_phase < call_dur,
              1050 - call_phase / call_dur * 150,   // 1050 → 900 Hz drift
              1000)
          : si.smoo;

// Vibrato: rapid throat vibration giving the "purring" quality
vibrato_depth = 40 + 30 * rasp;
vibrato = os.osc(25) * vibrato_depth;  // ~25 Hz vibrato — fast purr

fundamental = pitch_env + vibrato;

// --- Harmonic Structure ---
// Murre calls have STRONG harmonics — this creates the growl quality
// Even harmonics present but odd harmonics dominate = buzzy
h1 = os.osc(fundamental) * 0.25;
h2 = os.osc(fundamental * 2.0) * 0.20;
h3 = os.osc(fundamental * 3.0) * 0.30 * (0.4 + rasp * 0.6);  // Strong 3rd
h4 = os.osc(fundamental * 4.05) * 0.12 * rasp;   // Slight detuning
h5 = os.osc(fundamental * 5.02) * 0.08 * rasp;
h6 = os.osc(fundamental * 6.08) * 0.05 * rasp;   // Upper growl

harmonics = h1 + h2 + h3 + h4 + h5 + h6;

// --- Rasp/Growl Generator ---
// The "aaarrrr" quality: amplitude-modulated noise at vocal frequency
// This is the key to the murre sound — a rough, buzzing noise
rasp_noise = no.noise
           : fi.resonbp(fundamental * 2.0, 4, 1.0)
           : *(rasp * 0.5);

// Amplitude modulation: rapid AM creates the buzzing/purring texture
rasp_am = 1.0 + no.noise * rasp * 0.4
        : fi.resonlp(200, 1.5, 1.0);

// --- Formant Shaping ---
// Murre vocal tract: narrow beak, thick neck
// Single broad formant centered around 1.5 kHz
formant1 = fi.resonbp(1400, 5, 1.0);   // Primary growl formant
formant2 = fi.resonbp(2200, 3, 1.0);   // Upper harmonic emphasis

// --- Primary Bird Signal ---
primary_signal = harmonics * rasp_am + rasp_noise;
primary_shaped = primary_signal : formant1 : *(0.65)
               + primary_signal : formant2 : *(0.35);
primary_call = primary_shaped * call_env * 0.45;

// --- Colony Overlay Birds ---
// Additional birds with offset timing, slightly different pitches
// Murre colonies have hundreds of birds calling at once

// Bird 2: slightly lower pitch, offset timing
bird2_phase = os.phasor(1, 1.0 / (call_period * 1.13));
bird2_env = ba.if(bird2_phase < 0.45,
              ba.if(bird2_phase < 0.05, bird2_phase / 0.05,
              ba.if(bird2_phase < 0.39, 1.0 - 0.12 * os.osc(14.0),
                max(0.0, (0.45 - bird2_phase) / 0.06))),
              0.0) : si.smoo;
bird2_f = 920 + os.osc(22) * 35;
bird2 = (os.osc(bird2_f) * 0.25 + os.osc(bird2_f * 3.0) * 0.20 * rasp
       + no.noise * rasp * 0.15 : fi.resonbp(bird2_f * 1.5, 4, 1.0))
       * bird2_env * colony_size * 0.3;

// Bird 3: higher pitch, different rhythm
bird3_phase = os.phasor(1, 1.0 / (call_period * 0.87));
bird3_env = ba.if(bird3_phase < 0.40,
              ba.if(bird3_phase < 0.04, bird3_phase / 0.04,
              ba.if(bird3_phase < 0.34, 1.0 - 0.18 * os.osc(20.0),
                max(0.0, (0.40 - bird3_phase) / 0.06))),
              0.0) : si.smoo;
bird3_f = 1120 + os.osc(28) * 30;
bird3 = (os.osc(bird3_f) * 0.22 + os.osc(bird3_f * 3.0) * 0.18 * rasp
       + no.noise * rasp * 0.12 : fi.resonbp(bird3_f * 1.5, 4, 1.0))
       * bird3_env * colony_size * 0.25;

// Bird 4: distant, muffled
bird4_phase = os.phasor(1, 1.0 / (call_period * 1.31));
bird4_env = ba.if(bird4_phase < 0.50,
              ba.if(bird4_phase < 0.06, bird4_phase / 0.06,
              ba.if(bird4_phase < 0.44, 1.0 - 0.10 * os.osc(18.0),
                max(0.0, (0.50 - bird4_phase) / 0.06))),
              0.0) : si.smoo;
bird4_f = 980 + os.osc(24) * 25;
bird4 = (os.osc(bird4_f) * 0.20 + os.osc(bird4_f * 2.0) * 0.15
       + no.noise * rasp * 0.10 : fi.resonbp(bird4_f * 1.5, 5, 1.0))
       * bird4_env * colony_size * colony_size * 0.2
       : fi.resonlp(1800, 2, 1.0);  // Distance filtering

// Bird 5: very distant background
bird5_phase = os.phasor(1, 1.0 / (call_period * 0.73));
bird5_env = ba.if(bird5_phase < 0.55,
              ba.if(bird5_phase < 0.08, bird5_phase / 0.08, 0.8),
              0.0) : si.smoo;
bird5_f = 1060;
bird5 = (os.osc(bird5_f) * 0.15 + no.noise * 0.08
       : fi.resonbp(bird5_f, 3, 1.0))
       * bird5_env * colony_size * colony_size * 0.15
       : fi.resonlp(1200, 2, 1.0);

// --- Cliff Wind ---
// Ocean wind against cliff face — constant background
cliff_wind = no.pink_noise * wind_mix * 0.12
           : fi.resonlp(600, 2.5, 1.0)
           : *(1.0 + 0.3 * os.osc(0.08) + 0.15 * os.osc(0.23));

// Ocean waves below the cliff
waves = no.pink_noise * wind_mix * 0.06
      : fi.resonlp(250, 3, 1.0)
      : *(0.5 + 0.5 * os.osc(0.06));

// --- Output ---
process = (primary_call + bird2 + bird3 + bird4 + bird5
         + cliff_wind + waves) * 0.8
        : fi.dcblocker
        <: _,_;  // Stereo
