// Varied Thrush Call — Ixoreus naevius
// FAUST DSP source — compiles to VST, AU, LV2, JACK, CLI
//
// Mission 1.7: Explorer 1 — Bird: Varied Thrush (degree 7)
//
// The Varied Thrush produces one of the most distinctive and haunting
// sounds in the Pacific Northwest forest. A single, pure, sustained
// whistle on one pitch — held for about 1-2 seconds — followed by
// several seconds of silence, then another whistle at a different
// pitch. The effect is ethereal: a single voice ringing through the
// canopy of old-growth Douglas-fir, each note hanging in the fog
// like a held breath. No trill, no warble, no cascade of notes.
// Just one tone at a time, sustained and buzzy, with a harmonic
// quality that gives it an almost electronic character.
//
// The Varied Thrush is a ground-feeding bird of dense, wet forests.
// Orange breast with a dark band across it. It sings from high in
// the canopy but feeds on the forest floor. The song carries
// extraordinary distances through fog and rain — the sustained
// pure tone cuts through ambient noise the way a beacon signal
// cuts through static. One note. Silence. One note. Silence.
// Like a Geiger counter in reverse: one click, long silence,
// one click, long silence. The forest version of Explorer 1's
// telemetry — one data point at a time, separated by distance.
//
// The call is deceptively simple but hard to synthesize convincingly.
// The "buzz" is caused by rapid amplitude modulation at ~25-40 Hz,
// giving the sustained tone a reedy, organ-like quality distinct from
// the pure whistles of the Hermit Thrush or Swainson's Thrush.
//
// Timeline (~12 seconds per cycle):
//   0-1.8s:   First note — sustained whistle, ~3.2 kHz, slight buzz
//   1.8-4.5s: Silence — the forest absorbs the sound, reverb tail
//   4.5-6.0s: Second note — different pitch, ~3.8 kHz, slightly shorter
//   6.0-9.0s: Silence
//   9.0-10.5s: Third note — ~2.9 kHz, gentle fade
//   10.5-12s: Silence before cycle repeats
//
// Build:
//   faust2jaqt varied-thrush.dsp   # JACK/Qt standalone
//   faust2lv2  varied-thrush.dsp   # LV2 plugin
//
// Install FAUST: https://faust.grame.fr/downloads/

import("stdfaust.lib");

// --- Parameters ---
phase = hslider("[0]Phase", 0, 0, 1, 0.001) : si.smoo;
auto_mode = checkbox("[1]Auto (12s cycle)");
reverb_amount = hslider("[2]Reverb (Forest)", 0.6, 0, 1, 0.01) : si.smoo;
brightness_ctrl = hslider("[3]Brightness", 0.7, 0, 1, 0.01) : si.smoo;

// Auto-advancing phase (12-second cycle)
auto_phase = os.phasor(1, 1.0/12.0);
active_phase = select2(auto_mode, phase, auto_phase);

// --- Time mapping ---
time_sec = active_phase * 12.0;

// --- Note pitches ---
// Varied Thrush sings on different pitches, typically 2.5-4.5 kHz
// Each note is on a single sustained frequency
pitch1 = 3200.0;   // First note — middle register
pitch2 = 3800.0;   // Second note — higher
pitch3 = 2900.0;   // Third note — lower

// --- Note envelopes ---
// Each note: gradual attack (~100ms), sustained, gradual release (~200ms)

// Note 1: 0-1.8s
note1_env = ba.if(time_sec < 1.8,
              ba.if(time_sec < 0.1, time_sec / 0.1,
                ba.if(time_sec > 1.5, (1.8 - time_sec) / 0.3, 1.0)),
              0.0);

// Note 2: 4.5-6.0s
note2_env = ba.if(time_sec >= 4.5,
              ba.if(time_sec < 6.0,
                ba.if(time_sec < 4.6, (time_sec - 4.5) / 0.1,
                  ba.if(time_sec > 5.7, (6.0 - time_sec) / 0.3, 1.0)),
                0.0),
              0.0);

// Note 3: 9.0-10.5s
note3_env = ba.if(time_sec >= 9.0,
              ba.if(time_sec < 10.5,
                ba.if(time_sec < 9.1, (time_sec - 9.0) / 0.1,
                  ba.if(time_sec > 10.1, (10.5 - time_sec) / 0.4, 1.0)),
                0.0),
              0.0);

// --- Buzzy/harmonic quality ---
// The Varied Thrush's distinctive buzzy quality comes from amplitude
// modulation at 25-40 Hz — the tone is not pure but has a reedy,
// tremolo character. This is what makes it sound "electronic" or
// "organ-like" compared to other thrush whistles.
buzz_rate1 = 30.0;
buzz_rate2 = 35.0;
buzz_rate3 = 28.0;
buzz_depth = 0.25;  // 25% amplitude modulation

buzz1 = 1.0 - buzz_depth * (0.5 + 0.5 * os.osc(buzz_rate1));
buzz2 = 1.0 - buzz_depth * (0.5 + 0.5 * os.osc(buzz_rate2));
buzz3 = 1.0 - buzz_depth * (0.5 + 0.5 * os.osc(buzz_rate3));

// --- FM modulation for harmonic richness ---
// Slight frequency modulation adds the "not quite pure" quality
// that distinguishes this from a simple sine wave
fm_depth = 15.0;  // Hz deviation
fm_rate = 5.0;    // Slow vibrato-like FM

fm_mod1 = os.osc(fm_rate * 1.1) * fm_depth;
fm_mod2 = os.osc(fm_rate * 0.9) * fm_depth * 1.2;
fm_mod3 = os.osc(fm_rate * 1.3) * fm_depth * 0.8;

// --- Tone generation ---
// Fundamental + weak harmonics for body
tone1_fund = os.osc(pitch1 + fm_mod1) * 0.6;
tone1_h2   = os.osc((pitch1 + fm_mod1) * 2.0) * 0.08 * brightness_ctrl;
tone1_h3   = os.osc((pitch1 + fm_mod1) * 3.0) * 0.03 * brightness_ctrl;
tone1 = (tone1_fund + tone1_h2 + tone1_h3) * buzz1 * note1_env;

tone2_fund = os.osc(pitch2 + fm_mod2) * 0.55;
tone2_h2   = os.osc((pitch2 + fm_mod2) * 2.0) * 0.07 * brightness_ctrl;
tone2_h3   = os.osc((pitch2 + fm_mod2) * 3.0) * 0.025 * brightness_ctrl;
tone2 = (tone2_fund + tone2_h2 + tone2_h3) * buzz2 * note2_env;

tone3_fund = os.osc(pitch3 + fm_mod3) * 0.5;
tone3_h2   = os.osc((pitch3 + fm_mod3) * 2.0) * 0.06 * brightness_ctrl;
tone3_h3   = os.osc((pitch3 + fm_mod3) * 3.0) * 0.02 * brightness_ctrl;
tone3 = (tone3_fund + tone3_h2 + tone3_h3) * buzz3 * note3_env;

// --- Dry mix ---
dry_signal = (tone1 + tone2 + tone3) * 0.4;

// --- Forest reverb ---
// The Varied Thrush sings in dense, wet PNW forest. The canopy and
// fog create a long, diffuse reverb with significant high-frequency
// absorption. The sound hangs in the air.
//
// Simple Schroeder reverb: 4 comb filters + 2 allpass filters
// Tuned for forest acoustics — long decay, warm character

comb1 = fi.fb_fcomb(8192, 1687, 0, 0.85);
comb2 = fi.fb_fcomb(8192, 1601, 0, 0.83);
comb3 = fi.fb_fcomb(8192, 2053, 0, 0.81);
comb4 = fi.fb_fcomb(8192, 2251, 0, 0.79);

allpass1 = fi.allpass_fcomb(2048, 347, 0.7);
allpass2 = fi.allpass_fcomb(2048, 251, 0.65);

reverb_engine(x) = x <: comb1, comb2, comb3, comb4 :> _ / 4.0
                   : allpass1 : allpass2
                   : fi.resonlp(3000, 0.5, 1.0);

wet_signal = dry_signal : reverb_engine : *(reverb_amount);

// --- Ambient forest background ---
// Faint broadband noise — wind through canopy, distant rain
forest_noise = no.noise : fi.resonlp(800, 0.3, 1.0) : *(0.008);
canopy_drip = no.noise : fi.resonbp(4000, 10.0, 1.0) : *(0.003)
              : *(ba.if(no.noise > 0.95, 1.0, 0.0));

// ============================================
// Final mix
// ============================================
process = (dry_signal + wet_signal + forest_noise + canopy_drip)
          * 0.7 <: _, _;
