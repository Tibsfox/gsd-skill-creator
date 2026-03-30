// Northern Spotted Owl — Strix occidentalis caurina Territorial Hoot
// FAUST DSP source — generative ambient owl vocalization
//
// Mission 1.4 Bird Connection: Northern Spotted Owl (degree 4)
// Lives in old-growth PNW forests alongside Usnea longissima lichen.
// Both species are indicators of ancient forest integrity.
//
// The Northern Spotted Owl's territorial call is a four-note
// barking hoot, lower-pitched than Barred Owl, with breathy
// quality and wide formant bandwidth:
//
//   hoot (0.3s) - pause (0.8s) - hoot (0.3s) - hoot (0.3s) - hoooo (1.2s)
//
// Pitch range: ~350-450 Hz fundamental (male lower, female higher)
// Quality: breathy, hollow, wide formant — not a pure tone.
//          Produced by a syrinx that pushes air through membranes,
//          creating a complex tone rich in filtered noise.
//
// Habitat acoustic: Deep old-growth forest. Very long reverb
// decay (>2 seconds), heavy early reflections from massive trunks,
// high-frequency absorption by dense canopy. Sound carries far
// at low frequencies, creating the "owl from the depths" effect.
//
// Build:
//   faust2jaqt spotted-owl-hoot.dsp    # Standalone
//   faust2lv2  spotted-owl-hoot.dsp    # LV2 plugin
//
// This is a generative piece. One primary owl calls on a cycle,
// with an occasional distant response owl at slightly different pitch.

import("stdfaust.lib");

// --- Parameters ---
call_rate = hslider("[0]Call Rate", 0.5, 0.1, 1.0, 0.01) : si.smoo;
forest_depth = hslider("[1]Forest Reverb", 0.7, 0, 1.0, 0.01) : si.smoo;
breathiness = hslider("[2]Breathiness", 0.6, 0, 1.0, 0.01) : si.smoo;
response_owl = hslider("[3]Response Owl", 0.3, 0, 1.0, 0.01) : si.smoo;

// ============================================
// PRIMARY OWL — Four-note territorial hoot
// ============================================
// Call pattern: hoot - pause - hoot - hoot - hoooo
// Total call duration: ~3.7 seconds
//   Note 1: 0.00-0.30s (hoot)
//   Pause:  0.30-1.10s
//   Note 2: 1.10-1.40s (hoot)
//   Brief:  1.40-1.55s
//   Note 3: 1.55-1.85s (hoot)
//   Brief:  1.85-2.00s
//   Note 4: 2.00-3.20s (hoooo — long trailing)
//   Silence: 3.20-8.00s (inter-call interval)
//
// Full cycle: ~10-16 seconds depending on call_rate

call_period = 14.0 / call_rate;
call_phase = os.phasor(1, 1.0 / call_period);
// Convert phase to time within cycle
call_time = call_phase * call_period;

// --- Note timing (fractional within 4-second call window) ---
call_frac = call_time / call_period;

// Note 1: 0.00-0.022 of cycle
note1_start = 0.0;
note1_end = 0.30 / call_period;
note1_env = ba.if(call_frac > note1_start & call_frac < note1_end,
              owl_env(call_frac, note1_start, note1_end, 0.02, 0.04),
              0.0) : si.smoo;

// Note 2: after 1.10s pause
note2_start = 1.10 / call_period;
note2_end = 1.40 / call_period;
note2_env = ba.if(call_frac > note2_start & call_frac < note2_end,
              owl_env(call_frac, note2_start, note2_end, 0.02, 0.04),
              0.0) : si.smoo;

// Note 3: close after note 2
note3_start = 1.55 / call_period;
note3_end = 1.85 / call_period;
note3_env = ba.if(call_frac > note3_start & call_frac < note3_end,
              owl_env(call_frac, note3_start, note3_end, 0.02, 0.04),
              0.0) : si.smoo;

// Note 4: long trailing hoooo
note4_start = 2.00 / call_period;
note4_end = 3.20 / call_period;
note4_env = ba.if(call_frac > note4_start & call_frac < note4_end,
              owl_env(call_frac, note4_start, note4_end, 0.03, 0.15),
              0.0) : si.smoo;

// Envelope helper: attack/release shaping within a note
owl_env(phase, start, end, atk_frac, rel_frac) =
  min(
    (phase - start) / max(atk_frac, 0.001),
    1.0
  ) *
  ba.if(phase > end - rel_frac,
    (end - phase) / max(rel_frac, 0.001),
    1.0
  ) : max(0.0) : min(1.0);

// --- Owl voice synthesis ---
// The spotted owl's hoot is NOT a pure sine. It's a breathy,
// hollow tone produced by the syrinx — a mix of:
//   1. Fundamental tone (~390 Hz for male, ~420 Hz for female)
//   2. Weak harmonics (syrinx doesn't produce strong overtones)
//   3. Broadband noise (breath rushing through the syrinx)
//   4. Formant filtering (tracheal resonance, ~350-500 Hz peak)

owl_fundamental = 390.0;

// Slight pitch variation per note (natural)
note1_pitch = owl_fundamental * 1.00;
note2_pitch = owl_fundamental * 1.02;   // Slightly higher
note3_pitch = owl_fundamental * 0.98;   // Slightly lower
note4_pitch = owl_fundamental * 0.97;   // Drops on trailing note

// Vibrato on the long note (slow, subtle)
note4_vibrato = os.osc(4.5) * 6.0;  // ~4.5 Hz, ~6 Hz deviation

// Per-note synthesis
owl_note(freq, env) = (tone + breath) * env
with {
  // Tonal component: fundamental + weak harmonics
  tone = os.osc(freq) * 0.45
       + os.osc(freq * 2.0) * 0.08
       + os.osc(freq * 3.0) * 0.03
       + os.osc(freq * 0.5) * 0.06;   // Sub-harmonic rumble

  // Breath component: filtered noise shaped by formant
  breath_raw = no.noise * breathiness * 0.35;
  breath = breath_raw
         : fi.resonbp(freq * 1.2, 3, 1.0)   // Formant near fundamental
         : +(no.noise * breathiness * 0.05);   // Residual air noise
};

// Combine all four notes
primary_note1 = owl_note(note1_pitch, note1_env);
primary_note2 = owl_note(note2_pitch, note2_env);
primary_note3 = owl_note(note3_pitch, note3_env);
primary_note4 = owl_note(note4_pitch + note4_vibrato, note4_env);

primary_owl = (primary_note1 + primary_note2 + primary_note3 + primary_note4) * 0.5;

// Apply tracheal formant filter to entire owl voice
primary_filtered = primary_owl
                 : fi.resonbp(430, 2, 1.0)    // Primary tracheal resonance
                 : +(primary_owl * 0.3);        // Blend back some direct sound

// ============================================
// RESPONSE OWL (distant, occasional)
// ============================================
// A second spotted owl, slightly different pitch (individual variation),
// responding ~5-8 seconds after the primary owl.
// Not every call gets a response — controlled by response_owl parameter.

response_period = call_period * 1.37;   // Different cycle = asynchronous
response_phase = os.phasor(1, 1.0 / response_period);
response_time = response_phase * response_period;
response_frac = response_time / response_period;

// Response owl pitch: slightly higher (could be female)
resp_fund = 415.0;

// Simpler pattern: just two-three notes (not always a full four-note call)
resp_note1_start = 0.0;
resp_note1_end = 0.28 / response_period;
resp_note1_env = ba.if(response_frac > resp_note1_start & response_frac < resp_note1_end,
                   owl_env(response_frac, resp_note1_start, resp_note1_end, 0.02, 0.04),
                   0.0) : si.smoo;

resp_note2_start = 1.00 / response_period;
resp_note2_end = 1.25 / response_period;
resp_note2_env = ba.if(response_frac > resp_note2_start & response_frac < resp_note2_end,
                   owl_env(response_frac, resp_note2_start, resp_note2_end, 0.02, 0.04),
                   0.0) : si.smoo;

resp_note3_start = 1.50 / response_period;
resp_note3_end = 2.50 / response_period;
resp_note3_env = ba.if(response_frac > resp_note3_start & response_frac < resp_note3_end,
                   owl_env(response_frac, resp_note3_start, resp_note3_end, 0.03, 0.12),
                   0.0) : si.smoo;

resp_vibrato = os.osc(5.0) * 5.0;

response_note1 = owl_note(resp_fund, resp_note1_env);
response_note2 = owl_note(resp_fund * 1.01, resp_note2_env);
response_note3 = owl_note(resp_fund * 0.98 + resp_vibrato, resp_note3_env);

response_raw = (response_note1 + response_note2 + response_note3) * 0.25;
response_filtered = response_raw
                  : fi.resonbp(450, 2, 1.0)
                  : +(response_raw * 0.25);

// Apply distance attenuation and low-pass (distant owl)
response_distant = response_filtered
                 : fi.resonlp(800, 1, 1.0)     // Distance removes high freq
                 : *(response_owl * 0.4);        // Volume scaled by parameter

// ============================================
// FOREST AMBIENCE
// ============================================
// Old-growth forest at night: deep quiet, occasional sounds

// Wind through old-growth canopy (very low, gentle)
wind = no.pink_noise : fi.resonlp(180, 2, 1.0) : *(0.008);

// Distant creek (high-frequency water noise, very faint)
creek = no.pink_noise : fi.resonbp(2500, 4, 1.0) : *(0.003);

// Occasional branch creak (old-growth trees shift in wind)
creak_trigger = no.noise > 0.9998;
creak = no.noise * float(creak_trigger) * 0.04
      : fi.resonbp(300, 6, 1.0);

// Night insects (very sparse in PNW old growth)
insects = no.noise * (no.noise > 0.9996) * 0.02
        : fi.resonbp(4000, 8, 1.0);

ambience = wind + creek + creak + insects;

// ============================================
// OLD-GROWTH FOREST REVERB
// ============================================
// Long decay (>2 seconds), heavy early reflections from massive
// trunks, canopy absorbs high frequencies. The "cathedral" effect
// of old-growth forest.

dry_signal = primary_filtered + response_distant;

// Early reflections — massive trunk bounces
early_L = dry_signal : de.delay(44100, 743) * 0.35
        + dry_signal : de.delay(44100, 1531) * 0.28
        + dry_signal : de.delay(44100, 2347) * 0.20
        + dry_signal : de.delay(44100, 3719) * 0.12;

early_R = dry_signal : de.delay(44100, 967) * 0.35
        + dry_signal : de.delay(44100, 1789) * 0.28
        + dry_signal : de.delay(44100, 2903) * 0.20
        + dry_signal : de.delay(44100, 4157) * 0.12;

// Late reverb — canopy-filtered tail (dark, warm)
late_L = early_L : fi.resonlp(1200, 1, 1.0) * forest_depth * 0.6;
late_R = early_R : fi.resonlp(1200, 1, 1.0) * forest_depth * 0.6;

// Extended tail
tail_L = late_L : de.delay(44100, 8831) * 0.15
       + late_L : de.delay(44100, 12743) * 0.08;
tail_R = late_R : de.delay(44100, 9547) * 0.15
       + late_R : de.delay(44100, 13291) * 0.08;

tail_filtered_L = tail_L : fi.resonlp(600, 1, 1.0) * forest_depth;
tail_filtered_R = tail_R : fi.resonlp(600, 1, 1.0) * forest_depth;

// ============================================
// PROCESS
// ============================================
process =
  // Primary owl slightly left, response owl right
  (primary_filtered * 0.6 + response_distant * 0.3
   + early_L * forest_depth + late_L + tail_filtered_L
   + ambience * 0.8),
  (primary_filtered * 0.4 + response_distant * 0.7
   + early_R * forest_depth + late_R + tail_filtered_R
   + ambience * 0.8);
