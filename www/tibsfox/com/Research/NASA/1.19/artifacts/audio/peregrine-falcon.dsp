// Peregrine Falcon Call — Falco peregrinus
// FAUST DSP source — generative raptor vocalization + stoop dive
//
// Mission 1.19 Bird: Peregrine Falcon (degree 19 in 360 series)
// Two modes synthesized:
//   1. Territorial "kak-kak-kak" alarm call: rapid, high-pitched
//      repeated syllables at 3-4 kHz. The classic falcon warning
//      call heard near cliff nesting sites (eyries). Sharp onset,
//      harsh timbre, 6-12 syllables per burst.
//   2. Stoop dive wind rush: the sound of a 240 mph (386 km/h)
//      dive — the fastest animal on Earth. A rising-then-falling
//      wind roar with Doppler shift as the falcon passes.
//      At terminal velocity the feathers produce a tearing sound.
//
// The Peregrine Falcon was nearly extinct by the 1960s due to
// DDT thinning eggshells. In 1961 — the year of Freedom 7 —
// peregrines were disappearing from eastern North America.
// Recovery came through captive breeding (The Peregrine Fund,
// founded 1970). The falcon's return is one of conservation's
// greatest achievements.
//
// Ambient: cliff wind, distant ocean, thermal updraft hiss.
//
// Build:
//   faust2jaqt peregrine-falcon.dsp      # JACK/Qt standalone
//   faust2lv2  peregrine-falcon.dsp      # LV2 plugin

import("stdfaust.lib");

// --- Parameters ---
call_rate = hslider("[0]Call Rate (bursts/min)", 3, 1, 10, 0.1) : si.smoo;
stoop_rate = hslider("[1]Stoop Rate (per min)", 0.5, 0, 2, 0.1) : si.smoo;
cliff_wind = hslider("[2]Cliff Wind", 0.4, 0, 1, 0.01) : si.smoo;
altitude_mix = hslider("[3]Altitude Feel", 0.3, 0, 1, 0.01) : si.smoo;

// ==========================================================
// KAK-KAK-KAK TERRITORIAL CALL
// ==========================================================

// Call burst cycle
call_period = 60.0 / max(1.0, call_rate);
call_phase = os.phasor(1, 1.0 / call_period);

// Each burst: 6-10 rapid "kak" syllables over ~1.5 seconds
burst_dur = 0.40;  // Fraction of period occupied by call burst

// Individual syllable within the burst
// ~8 syllables per second = 125ms per syllable
syllable_rate = 8.0;
syllable_phase = mod(call_phase * call_period * syllable_rate, 1.0);

// Syllable envelope: very sharp attack, short sustain, fast decay
// This creates the percussive "kak" quality
syllable_env = ba.if(call_phase < burst_dur,
                 ba.if(syllable_phase < 0.03,
                   syllable_phase / 0.03,               // 4ms attack — razor sharp
                 ba.if(syllable_phase < 0.12,
                   1.0,                                  // Brief sustain
                 ba.if(syllable_phase < 0.30,
                   max(0.0, (0.30 - syllable_phase) / 0.18),  // Decay
                   0.0))),
                 0.0)
             : si.smoo;

// Burst envelope (overall amplitude contour of the burst)
burst_env = ba.if(call_phase < burst_dur,
              ba.if(call_phase < 0.04,
                call_phase / 0.04,                       // Burst onset
              ba.if(call_phase < burst_dur - 0.05,
                0.85,                                    // Sustained calling
                max(0.0, (burst_dur - call_phase) / 0.05))),  // Burst fade
              0.0)
         : si.smoo;

// --- Fundamental Pitch ---
// Peregrine kak: 3-4 kHz fundamental, harsh and penetrating
// Slight downward slide within each syllable
kak_pitch = ba.if(syllable_phase < 0.15,
              3600 - syllable_phase / 0.15 * 400,   // 3600→3200 Hz slide
              3200)
          : si.smoo;

// Jitter — falcon calls are not perfectly periodic
pitch_jitter = no.noise * 80 : fi.resonlp(20, 1, 1.0);
kak_fundamental = kak_pitch + pitch_jitter;

// --- Harmonic Structure ---
// Falcon calls are harmonically rich — harsh, raspy quality
// Strong odd harmonics give the "tearing" timbre
h1 = os.osc(kak_fundamental) * 0.30;
h2 = os.osc(kak_fundamental * 2.0) * 0.15;
h3 = os.osc(kak_fundamental * 3.02) * 0.25;     // Odd harmonic, louder
h4 = os.osc(kak_fundamental * 4.0) * 0.08;
h5 = os.osc(kak_fundamental * 5.01) * 0.15;     // Odd harmonic
h6 = os.osc(kak_fundamental * 6.03) * 0.04;

harmonics = h1 + h2 + h3 + h4 + h5 + h6;

// --- Rasp Generator ---
// The harsh "kak" quality: band-limited noise at call frequency
rasp_noise = no.noise
           : fi.resonbp(kak_fundamental * 0.8, 4, 1.0)
           : *(0.35);

// --- Combined Call Signal ---
kak_signal = (harmonics + rasp_noise) * syllable_env * burst_env * 0.45
           : fi.resonbp(kak_fundamental, 2, 1.0)
           : fi.resonhp(1500, 1, 1.0);  // Cut low-frequency mud

// --- Second Bird (mate, slightly different pitch) ---
bird2_phase = os.phasor(1, 1.0 / (call_period * 1.62));
bird2_burst = ba.if(bird2_phase < 0.35, 1.0, 0.0) : si.smoo;
bird2_syl = mod(bird2_phase * call_period * 7.5, 1.0);
bird2_syl_env = ba.if(bird2_syl < 0.25, max(0.0, 1.0 - bird2_syl / 0.25), 0.0)
              : si.smoo;
bird2_f = 3900 + os.osc(0.3) * 100;
bird2 = (os.osc(bird2_f) * 0.20 + os.osc(bird2_f * 3.0) * 0.15
       + no.noise * 0.12 : fi.resonbp(bird2_f, 3, 1.0))
       * bird2_syl_env * bird2_burst * 0.18
       : fi.resonhp(2000, 1, 1.0);  // Distant, higher pitch

// ==========================================================
// STOOP DIVE — 240 MPH WIND RUSH
// ==========================================================

// Stoop cycle: climb → tuck → dive → pull-up
stoop_period = 60.0 / max(0.1, stoop_rate);
stoop_phase = os.phasor(1, 1.0 / stoop_period);

// Dive phase: 0.2 to 0.6 of the stoop cycle
// Speed builds exponentially as falcon tucks wings
dive_env = ba.if(stoop_phase > 0.20 & stoop_phase < 0.60,
             ba.if(stoop_phase < 0.30,
               (stoop_phase - 0.20) / 0.10,             // Entering dive
             ba.if(stoop_phase < 0.50,
               1.0,                                      // Terminal velocity
               max(0.0, (0.60 - stoop_phase) / 0.10))), // Pull-up
             0.0)
         : si.smoo;

// Wind frequency: rises as speed increases
// At 240 mph: broadband roar centered ~800-2000 Hz
// Doppler shift: pitch rises as falcon approaches, drops as it passes
doppler_shift = ba.if(stoop_phase > 0.20 & stoop_phase < 0.60,
                  1.0 + (0.40 - stoop_phase) * 1.5,  // Pitch rises then falls
                  1.0)
              : si.smoo;

wind_center = (1200 * doppler_shift) : si.smoo;

// Broadband wind rush — the sound of air tearing over tucked wings
dive_wind = no.noise * dive_env * 0.30
          : fi.resonbp(wind_center, 2, 1.0)
          : fi.resonhp(300, 1, 1.0);

// High-frequency tearing — feather edge turbulence at terminal velocity
feather_tear = no.noise * dive_env * dive_env * 0.12
             : fi.resonbp(wind_center * 2.5, 3, 1.0);

// Low-frequency whoosh — body displacement of air
body_whoosh = no.pink_noise * dive_env * 0.15
            : fi.resonlp(500, 2.5, 1.0);

// Impact moment — the stoop strike
// Brief, explosive sound as falcon hits prey
strike = no.noise * strike_env * 0.25
       : fi.resonbp(1800, 2, 1.0)
with {
  strike_env = ba.if(stoop_phase > 0.55 & stoop_phase < 0.58,
                 exp(-(stoop_phase - 0.55) * 80.0),
                 0.0);
};

stoop_signal = dive_wind + feather_tear + body_whoosh + strike;

// ==========================================================
// AMBIENT — CLIFF ENVIRONMENT
// ==========================================================

// Cliff wind — steady, with gusts
cliff_steady = no.pink_noise * cliff_wind * 0.06
             : fi.resonlp(400, 2, 1.0)
             : *(1.0 + 0.2 * os.osc(0.09) + 0.15 * os.osc(0.23));

// Wind gusts
cliff_gust = no.pink_noise * cliff_wind * 0.04
           : fi.resonbp(600 + 200 * os.osc(0.07), 3, 1.0)
           : *(max(0.0, os.osc(0.05) - 0.3));

// Thermal updraft hiss (warm air rising along cliff face)
thermal = no.noise * altitude_mix * 0.03
        : fi.resonbp(1500 + 400 * os.osc(0.04), 5, 1.0)
        : *(0.5 + 0.5 * os.osc(0.07));

// Distant ocean (cliff nesting site)
ocean = no.pink_noise * cliff_wind * 0.04
      : fi.resonlp(200, 3, 1.0)
      : *(0.4 + 0.6 * max(0.0, os.osc(0.11)));

// ==========================================================
// OUTPUT
// ==========================================================

process = (kak_signal + bird2 + stoop_signal
         + cliff_steady + cliff_gust + thermal + ocean) * 0.80
        : fi.dcblocker
        <: _,_;  // Stereo
