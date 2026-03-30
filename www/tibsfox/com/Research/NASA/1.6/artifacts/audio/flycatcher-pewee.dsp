// Pacific Slope Flycatcher Call — "su-WEET" Whistle Synthesizer
// FAUST DSP source — compiles to VST, AU, LV2, JACK, CLI
//
// Mission 1.6: Explorer 6 — Bird: Pacific Slope Flycatcher
//   (Empidonax difficilis)
//
// The Pacific Slope Flycatcher's diagnostic call is a thin, upslurred
// whistle: "su-WEET" or "tsee-weet". Two notes, the second rising.
// A breathy, reedy quality — not a pure whistle but not harsh either.
// The bird perches in shaded riparian zones and dense conifer understory,
// calling persistently from a low branch. The call carries through
// the forest canopy despite its thinness.
//
// Call structure:
//   Note 1: "su" — brief, softer, around 3.0-3.5 kHz, ~80 ms
//   Gap: ~30 ms of near-silence
//   Note 2: "WEET" — louder, rising sweep from 3.5 to 5.5 kHz, ~200 ms
//   Total duration: ~310 ms per call
//   Calls repeat every 2-4 seconds
//
// The quality is breathy and whistle-like, produced by the syrinx
// with slight harmonic content. Not a pure sine — more like a
// slightly noisy, narrow-band whistle.
//
// Build:
//   faust2jaqt flycatcher-pewee.dsp   # JACK/Qt standalone
//   faust2lv2  flycatcher-pewee.dsp   # LV2 plugin
//   faust2vst  flycatcher-pewee.dsp   # VST plugin (needs VST SDK)
//
// Install FAUST: https://faust.grame.fr/downloads/

import("stdfaust.lib");

// --- Parameters ---
call_rate = hslider("[0]Call Rate (s)", 3.0, 1.5, 6.0, 0.1) : si.smoo;
breathiness = hslider("[1]Breathiness", 0.35, 0, 1, 0.01) : si.smoo;
pitch_shift = hslider("[2]Pitch Shift (semitones)", 0, -4, 4, 0.1) : si.smoo;
volume = hslider("[3]Volume", 0.7, 0, 1, 0.01) : si.smoo;
auto_mode = checkbox("[4]Auto Repeat");

trigger = button("[5]Call");

// --- Pitch shift multiplier ---
pitch_mult = 2.0 ^ (pitch_shift / 12.0);

// --- Timing ---
// Auto-repeating call cycle
cycle_phase = os.phasor(1, 1.0 / call_rate);
// Time within the call (0 to call_rate seconds)
call_time = cycle_phase * call_rate;

// Manual or auto trigger
is_calling = select2(auto_mode, trigger, 1.0);

// --- Note 1: "su" (0-80ms) ---
// Soft introductory note, relatively flat pitch around 3.2 kHz
note1_active = ba.if(call_time < 0.08, 1.0, 0.0);
note1_env = ba.if(call_time < 0.01, call_time / 0.01,
             ba.if(call_time < 0.06, 1.0,
               ba.if(call_time < 0.08, (0.08 - call_time) / 0.02, 0.0)));

// Gentle pitch rise within the first note
note1_freq = (3100.0 + call_time * 5000.0) * pitch_mult;
note1_tone = os.osc(note1_freq) * 0.6 +
             os.osc(note1_freq * 2.003) * 0.08 +
             os.osc(note1_freq * 3.01) * 0.03;

// Breath noise component
note1_breath = no.noise : fi.bandpass(2, note1_freq * 0.8, note1_freq * 1.2)
               : *(breathiness * 0.3);

note1 = (note1_tone + note1_breath) * note1_env * 0.5 * note1_active;

// --- Gap (80-110ms) ---
// Near silence — faint breath between notes
gap_active = ba.if(call_time >= 0.08,
              ba.if(call_time < 0.11, 1.0, 0.0),
              0.0);
gap_breath = no.noise : fi.resonlp(3000 * pitch_mult, 0.5, 1.0) : *(0.02 * breathiness);
gap = gap_breath * gap_active;

// --- Note 2: "WEET" (110-310ms) ---
// The diagnostic upslurred whistle. Louder, rising from ~3.5 to ~5.5 kHz
note2_active = ba.if(call_time >= 0.11,
                ba.if(call_time < 0.31, 1.0, 0.0),
                0.0);

// Envelope: quick attack, sustain, gentle decay
note2_time = call_time - 0.11;
note2_env = ba.if(note2_time < 0.015, note2_time / 0.015,
             ba.if(note2_time < 0.15, 1.0,
               ba.if(note2_time < 0.20, 1.0 - (note2_time - 0.15) * 3.0, 0.3)));

// Rising pitch sweep — the characteristic upslur
// Starts ~3500 Hz, sweeps up to ~5500 Hz
sweep_progress = ba.if(note2_active > 0.5, note2_time / 0.20, 0.0);
note2_freq = (3500.0 + sweep_progress * 2000.0) * pitch_mult;

// Main whistle tone with slight harmonic content
note2_tone = os.osc(note2_freq) * 0.7 +
             os.osc(note2_freq * 2.002) * 0.1 +
             os.osc(note2_freq * 0.999) * 0.15;

// Breathy quality — band-limited noise centered on the pitch
note2_breath = no.noise : fi.bandpass(2, note2_freq * 0.85, note2_freq * 1.15)
               : *(breathiness * 0.25);

// Slight vibrato near the top of the sweep
vibrato = 1.0 + 0.008 * os.osc(28.0) * ba.if(sweep_progress > 0.6, 1.0, 0.0);

note2 = (note2_tone * vibrato + note2_breath) * note2_env * 0.7 * note2_active;

// ============================================
// Reverb — forest canopy reflections
// ============================================
// The call reverberates through the understory
dry_signal = (note1 + gap + note2) * is_calling * volume;

// Simple stereo reverb (forest ambience)
reverb_input = dry_signal;
reverb_l = reverb_input : fi.allpass_comb(4096, 1117, 0.6)
         : fi.allpass_comb(4096, 1543, 0.55)
         : fi.allpass_comb(4096, 2011, 0.5) : *(0.2);
reverb_r = reverb_input : fi.allpass_comb(4096, 1237, 0.58)
         : fi.allpass_comb(4096, 1621, 0.53)
         : fi.allpass_comb(4096, 1879, 0.48) : *(0.2);

process = dry_signal + reverb_l, dry_signal + reverb_r;
