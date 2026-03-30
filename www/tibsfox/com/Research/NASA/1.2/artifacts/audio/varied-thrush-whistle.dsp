// Varied Thrush Whistle — Ixoreus naevius Song Synthesis
// FAUST DSP source — generative ambient birdsong
//
// Mission 1.2 Organism Connection: Polystichum munitum (Sword Fern)
// The varied thrush sings from the understory — the same zone
// where sword fern holds the ground. Its single sustained note
// is described as "the most atmospheric sound in the PNW forest."
//
// The varied thrush produces a series of pure, sustained tones
// at different pitches, each held for 1-2 seconds, separated by
// 3-8 seconds of silence. Each call is a single pitch drawn from
// a set of notes roughly in a minor scale between 2500-4500 Hz.
// There is a slight vibrato (~4-6 Hz, narrow deviation).
//
// Build:
//   faust2jaqt varied-thrush-whistle.dsp    # Standalone
//   faust2lv2  varied-thrush-whistle.dsp    # LV2 plugin
//
// This is a generative piece. It produces continuous ambient
// birdsong with no input required. Can also process input audio
// through a resonant filter tuned to the thrush's frequency range.

import("stdfaust.lib");

// --- Parameters ---
call_rate = hslider("[0]Call Rate", 0.5, 0.1, 1.0, 0.01) : si.smoo;
vibrato_depth = hslider("[1]Vibrato Depth", 0.4, 0, 1.0, 0.01) : si.smoo;
forest_reverb = hslider("[2]Forest Reverb", 0.6, 0, 1.0, 0.01) : si.smoo;
mix_input = hslider("[3]Input Mix", 0, 0, 1, 0.01) : si.smoo;

// --- Pitch Table ---
// Varied thrush notes in a natural minor scale pattern
// Frequencies approximate the bird's actual pitch range
// E minor pentatonic-ish: E6, G6, A6, B6, D7, E7
// (transposed to the thrush's range of ~2500-4500 Hz)

pitch_select(idx) = ba.if(idx == 0, 2637,   // E6-ish
                    ba.if(idx == 1, 2960,   // Between E6 and G6
                    ba.if(idx == 2, 3136,   // G6-ish
                    ba.if(idx == 3, 3520,   // A6-ish
                    ba.if(idx == 4, 3729,   // Between A6 and B6
                    ba.if(idx == 5, 3951,   // B6-ish
                    ba.if(idx == 6, 4186,   // C7-ish
                           4435)))))));      // Between C7 and D7

// --- Call Timing Generator ---
// Uses a slow phasor to create call/silence cycles
// Each cycle: ~1.5s tone + ~5s silence = ~6.5s total
// call_rate scales the total period

cycle_period = 6.5 / call_rate;
cycle_phase = os.phasor(1, 1.0 / cycle_period);

// Call is active during the first ~23% of each cycle (~1.5s of 6.5s)
call_duration_frac = 0.23;
call_active = cycle_phase < call_duration_frac;

// Envelope: smooth attack and release on each call
// Attack ~50ms, sustain, release ~100ms
call_env = ba.if(call_active,
             min(cycle_phase / (call_duration_frac * 0.03), 1.0) *
             ba.if(cycle_phase > call_duration_frac * 0.85,
               (call_duration_frac - cycle_phase) / (call_duration_frac * 0.15),
               1.0),
             0.0) : si.smoo;

// --- Pitch Selection ---
// Change pitch at the start of each new call
// Use a slower counter that advances once per cycle
pitch_counter = os.phasor(1, 1.0 / (cycle_period * 8.0));
pitch_idx = int(pitch_counter * 8.0) % 8;
current_pitch = pitch_select(pitch_idx);

// --- Vibrato ---
// Subtle frequency modulation ~5 Hz, narrow deviation
vibrato_rate = 5.0;
vibrato_amount = vibrato_depth * 15.0;  // Max ~15 Hz deviation
vibrato = os.osc(vibrato_rate) * vibrato_amount;

// --- Tone Generator ---
// The varied thrush's call is remarkably pure — nearly sinusoidal
// with very faint harmonics. We use a sine with tiny 2nd and 3rd harmonics.
fundamental = current_pitch + vibrato;
tone = os.osc(fundamental) * 0.85
     + os.osc(fundamental * 2.0) * 0.08   // Faint 2nd harmonic
     + os.osc(fundamental * 3.0) * 0.03   // Very faint 3rd harmonic
     + no.noise * 0.004                     // Breath noise (very subtle)
     : fi.resonbp(fundamental, 12, 1.0);   // Narrow bandpass to clean up

// Shaped call
call = tone * call_env * 0.4;

// --- Second Bird (offset timing) ---
// A second thrush calling from farther away, different timing
cycle_phase2 = os.phasor(1, 1.0 / (cycle_period * 1.17));  // Slightly different rate
call_active2 = cycle_phase2 < (call_duration_frac * 0.8);   // Slightly shorter calls
call_env2 = ba.if(call_active2,
              min(cycle_phase2 / (call_duration_frac * 0.03), 1.0) *
              ba.if(cycle_phase2 > call_duration_frac * 0.7,
                (call_duration_frac * 0.8 - cycle_phase2) / (call_duration_frac * 0.1),
                1.0),
              0.0) : si.smoo;

pitch_counter2 = os.phasor(1, 1.0 / (cycle_period * 1.17 * 8.0));
pitch_idx2 = (int(pitch_counter2 * 8.0) + 3) % 8;  // Offset by 3 pitches
current_pitch2 = pitch_select(pitch_idx2);
fundamental2 = current_pitch2 + os.osc(4.7) * vibrato_amount * 0.8;

tone2 = os.osc(fundamental2) * 0.85
      + os.osc(fundamental2 * 2.0) * 0.06
      + no.noise * 0.003
      : fi.resonbp(fundamental2, 12, 1.0);

call2 = tone2 * call_env2 * 0.18;  // Quieter — farther away

// --- Forest Ambience ---
// Very subtle wind and canopy drip to place the sound in the forest
wind = no.pink_noise : fi.resonlp(300, 2, 1.0) : *(0.015);
canopy_drip = no.noise * (no.noise > 0.9992) * 0.06
            : fi.resonbp(4000 + no.noise * 2000, 8, 1.0);

// --- Simple Stereo Reverb ---
// Simulates the forest acoustic space — diffuse, long tail
reverb_input = call + call2;
rev_L = reverb_input : de.delay(44100, 1597) * 0.35
      + reverb_input : de.delay(44100, 2371) * 0.25
      + reverb_input : de.delay(44100, 3557) * 0.18;
rev_R = reverb_input : de.delay(44100, 1831) * 0.35
      + reverb_input : de.delay(44100, 2753) * 0.25
      + reverb_input : de.delay(44100, 3907) * 0.18;

// Feedback through low-pass for warm tail
rev_fb_L = rev_L : fi.resonlp(3000, 1, 1.0) * forest_reverb;
rev_fb_R = rev_R : fi.resonlp(3000, 1, 1.0) * forest_reverb;

// --- Process ---
process(input_L, input_R) =
  (dry_L + rev_fb_L + wind + canopy_drip + input_L * mix_input * input_filter),
  (dry_R + rev_fb_R + wind + canopy_drip + input_R * mix_input * input_filter)
with {
  dry_L = call * 0.7 + call2 * 0.3;   // Bird 1 slightly left
  dry_R = call * 0.3 + call2 * 0.7;   // Bird 2 slightly right
  input_filter = fi.resonbp(3500, 6, 1.0);  // Filter input to thrush range
};
