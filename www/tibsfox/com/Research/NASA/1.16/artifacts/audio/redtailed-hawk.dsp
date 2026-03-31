// Red-tailed Hawk Scream — Buteo jamaicensis
// FAUST DSP source — generative raptor vocalization
//
// Mission 1.16 Bird: Red-tailed Hawk (degree 16 in 360 series)
// The iconic descending scream "keee-eeee-arrr" — the most
// misattributed bird call in Hollywood. Every bald eagle on screen
// is actually this hawk.
//
// Frequency range: 2-4 kHz, raspy, with descending pitch envelope.
// Duration: 2-3 seconds per call, with soaring quality.
// The call has a harsh, breathy quality from turbulent airflow
// across the syrinx membranes.
//
// Build:
//   faust2jaqt redtailed-hawk.dsp      # JACK/Qt standalone
//   faust2lv2  redtailed-hawk.dsp      # LV2 plugin
//
// This is a generative synthesizer — produces continuous calls
// with natural variation in pitch, timing, and rasp.

import("stdfaust.lib");

// --- Parameters ---
call_rate = hslider("[0]Call Rate (per min)", 4, 1, 12, 0.1) : si.smoo;
rasp = hslider("[1]Rasp", 0.7, 0, 1, 0.01) : si.smoo;
soaring = hslider("[2]Soaring (distance)", 0.3, 0, 1, 0.01) : si.smoo;
wind_mix = hslider("[3]Wind", 0.2, 0, 1, 0.01) : si.smoo;

// --- Call Envelope Generator ---
// Generates a call envelope: ~2.5 seconds on, variable gap
call_period = 60.0 / max(1.0, call_rate);
call_phase = os.phasor(1, 1.0 / call_period);
// Call occupies first 40% of period (about 2.5s at default rate)
call_env = ba.if(call_phase < 0.4,
             ba.if(call_phase < 0.03,
               call_phase / 0.03,              // Attack: 75ms
             ba.if(call_phase < 0.35,
               1.0,                             // Sustain
               (0.4 - call_phase) / 0.05)),     // Release: 125ms
             0.0)
         : si.smoo;

// --- Fundamental Pitch ---
// Descending scream: starts ~3.5 kHz, drops to ~2.2 kHz
// With slight vibrato (syringeal membrane oscillation)
pitch_env = ba.if(call_phase < 0.4,
              3500 - call_phase / 0.4 * 1300,   // 3500 → 2200 Hz descent
              2800)                              // Rest value
          : si.smoo;

vibrato_depth = 80 + 60 * call_phase;  // Vibrato widens as call descends
vibrato = os.osc(18) * vibrato_depth;  // ~18 Hz vibrato rate

fundamental = pitch_env + vibrato;

// --- Harmonic Structure ---
// Red-tailed hawk call has strong odd harmonics (raspy quality)
// Fundamental + 3 harmonics with noise modulation
h1 = os.osc(fundamental) * 0.35;
h2 = os.osc(fundamental * 2.0) * 0.20;
h3 = os.osc(fundamental * 3.0) * 0.25 * (0.5 + rasp * 0.5);
h4 = os.osc(fundamental * 4.03) * 0.10 * rasp;  // Slight detuning
h5 = os.osc(fundamental * 5.07) * 0.05 * rasp;  // More detuning

harmonics = h1 + h2 + h3 + h4 + h5;

// --- Rasp Generator ---
// Turbulent airflow across syrinx — noise modulating the signal
// This gives the characteristic harsh, breathy quality
rasp_noise = no.noise
           : fi.resonbp(fundamental * 1.5, 6, 1.0)
           : *(rasp * 0.4);

// Amplitude modulation: noise modulates the harmonic signal
rasp_am = no.noise
        : fi.resonlp(300, 2, 1.0)
        : *(0.3 * rasp)
        : +(1.0);  // 1.0 + noise modulation

// --- Formant Shaping ---
// Two formant regions characteristic of raptor calls
formant1 = fi.resonbp(2800, 8, 1.0);  // Primary formant
formant2 = fi.resonbp(3400, 6, 1.0);  // Secondary formant

// --- Distance/Soaring Effect ---
// As soaring increases: more reverb-like filtering, less high frequency
distance_lpf = fi.resonlp(4000 - soaring * 2500, 2, 1.0);
distance_atten = 1.0 - soaring * 0.6;

// --- Sky Wind ---
// Ambient wind for soaring context
sky_wind = no.pink_noise * wind_mix * 0.15
         : fi.resonlp(800, 3, 1.0)
         : *(1.0 + 0.4 * os.osc(0.15));

// --- Signal Chain ---
call_signal = harmonics * rasp_am + rasp_noise;

// Split through formants and recombine
shaped = call_signal : formant1 : *(0.6)
       + call_signal : formant2 : *(0.4);

// Apply call envelope, distance, and mix
hawk_call = shaped * call_env * distance_atten : distance_lpf;

// --- Output ---
process = (hawk_call + sky_wind) * 0.8
        : fi.dcblocker
        <: _,_;  // Stereo
