// Harlequin Duck Call — Histrionicus histrionicus
// FAUST DSP source — generative whitewater vocalization
//
// Mission 1.20 Bird: Harlequin Duck (degree 20 in 360 series)
// Two modes synthesized:
//   1. Male display whistle: high-pitched, mouse-like squeak.
//      Short, piercing notes at 3-5 kHz that cut through the
//      roar of whitewater rapids. "Wit-wit-wit" — a series of
//      sharp, ascending squeaks. Harlequins are one of the few
//      ducks that live year-round in turbulent mountain streams.
//   2. Female alarm call: lower, harsher "ek-ek-ek" — a raspy,
//      grating series of notes used to alert ducklings to danger.
//      Given from mid-stream on a boulder in Class III-IV rapids.
//
// The Harlequin Duck (Histrionicus histrionicus — "actor actor")
// is named for its theatrical plumage: the male has bold white
// crescents and spots on slate-blue body, russet flanks, and a
// white ear patch. Found in fast-moving streams of the PNW,
// Iceland, and eastern Siberia. They dive in whitewater to feed
// on aquatic invertebrates, walking along the streambed in
// currents that would sweep other ducks away.
//
// Ambient: mountain stream turbulence, whitewater roar, rapids
// with irregular rhythm, distant waterfall, submerged bubbles.
//
// Build:
//   faust2jaqt harlequin-duck.dsp      # JACK/Qt standalone
//   faust2lv2  harlequin-duck.dsp      # LV2 plugin

import("stdfaust.lib");

// --- Parameters ---
call_rate = hslider("[0]Call Rate (bursts/min)", 4, 1, 12, 0.1) : si.smoo;
alarm_rate = hslider("[1]Alarm Rate (per min)", 1.5, 0, 5, 0.1) : si.smoo;
water_level = hslider("[2]Whitewater Level", 0.6, 0, 1, 0.01) : si.smoo;
stream_size = hslider("[3]Stream Size", 0.5, 0, 1, 0.01) : si.smoo;

// ==========================================================
// MALE DISPLAY WHISTLE — "WIT-WIT-WIT"
// ==========================================================

// Call burst cycle
call_period = 60.0 / max(1.0, call_rate);
call_phase = os.phasor(1, 1.0 / call_period);

// Each burst: 3-5 rapid ascending squeaks over ~0.8 seconds
burst_dur = 0.30;

// Individual syllable — fast, sharp squeaks
syllable_rate = 5.0;
syllable_phase = mod(call_phase * call_period * syllable_rate, 1.0);

// Syllable envelope: extremely sharp attack (mouse-like squeak)
syllable_env = ba.if(call_phase < burst_dur,
                 ba.if(syllable_phase < 0.02,
                   syllable_phase / 0.02,              // 2ms attack — very sharp
                 ba.if(syllable_phase < 0.08,
                   1.0,                                 // Brief sustain
                 ba.if(syllable_phase < 0.20,
                   max(0.0, (0.20 - syllable_phase) / 0.12),
                   0.0))),
                 0.0)
             : si.smoo;

// Burst envelope
burst_env = ba.if(call_phase < burst_dur,
              ba.if(call_phase < 0.03,
                call_phase / 0.03,
              ba.if(call_phase < burst_dur - 0.04,
                0.9,
                max(0.0, (burst_dur - call_phase) / 0.04))),
              0.0)
         : si.smoo;

// --- Pitch ---
// Harlequin male whistle: 3.5-5 kHz, ascending within each burst
// Each successive note in the burst is slightly higher
wit_pitch = ba.if(call_phase < burst_dur,
              3500 + call_phase / burst_dur * 1500,  // 3500→5000 Hz ascend
              3500)
          : si.smoo;

// Pitch jitter — calls in whitewater are slightly wavering
pitch_jitter = no.noise * 120 : fi.resonlp(25, 1, 1.0);
wit_fundamental = wit_pitch + pitch_jitter;

// --- Harmonic Structure ---
// Duck whistles are relatively pure compared to songbirds
// Strong fundamental, weak harmonics — the "mousey" quality
w1 = os.osc(wit_fundamental) * 0.45;
w2 = os.osc(wit_fundamental * 2.01) * 0.12;
w3 = os.osc(wit_fundamental * 3.0) * 0.08;
w4 = os.osc(wit_fundamental * 4.02) * 0.03;

wit_harmonics = w1 + w2 + w3 + w4;

// Slight breath noise in the whistle
wit_breath = no.noise * 0.08
           : fi.resonbp(wit_fundamental * 1.2, 5, 1.0);

// Combined male whistle
wit_signal = (wit_harmonics + wit_breath) * syllable_env * burst_env * 0.35
           : fi.resonbp(wit_fundamental, 2.5, 1.0)
           : fi.resonhp(2000, 1, 1.0);

// ==========================================================
// FEMALE ALARM CALL — "EK-EK-EK"
// ==========================================================

alarm_period = 60.0 / max(0.5, alarm_rate);
alarm_phase = os.phasor(1, 1.0 / alarm_period);

// Each alarm: 4-6 harsh notes over ~1 second
alarm_dur = 0.35;
alarm_syl_rate = 6.0;
alarm_syl_phase = mod(alarm_phase * alarm_period * alarm_syl_rate, 1.0);

alarm_syl_env = ba.if(alarm_phase < alarm_dur,
                  ba.if(alarm_syl_phase < 0.04,
                    alarm_syl_phase / 0.04,
                  ba.if(alarm_syl_phase < 0.15,
                    1.0,
                  ba.if(alarm_syl_phase < 0.30,
                    max(0.0, (0.30 - alarm_syl_phase) / 0.15),
                    0.0))),
                  0.0)
              : si.smoo;

alarm_burst = ba.if(alarm_phase < alarm_dur,
                ba.if(alarm_phase < 0.04,
                  alarm_phase / 0.04,
                  ba.if(alarm_phase < alarm_dur - 0.03,
                    0.8,
                    max(0.0, (alarm_dur - alarm_phase) / 0.03))),
                0.0)
           : si.smoo;

// Female call pitch: 2-3 kHz, harsher, with strong harmonics
ek_pitch = 2200 + 300 * os.osc(0.15);
ek_jitter = no.noise * 100 : fi.resonlp(15, 1, 1.0);
ek_fundamental = ek_pitch + ek_jitter;

// Harsh harmonic structure — the "raspy" quality
e1 = os.osc(ek_fundamental) * 0.20;
e2 = os.osc(ek_fundamental * 2.0) * 0.18;
e3 = os.osc(ek_fundamental * 3.01) * 0.22;  // Strong odd harmonic
e4 = os.osc(ek_fundamental * 4.0) * 0.10;
e5 = os.osc(ek_fundamental * 5.02) * 0.15;  // Strong odd harmonic

ek_harmonics = e1 + e2 + e3 + e4 + e5;

// Harsh rasp noise — the grating quality of the alarm
ek_rasp = no.noise * 0.25
        : fi.resonbp(ek_fundamental * 0.9, 3, 1.0);

// Combined alarm call
ek_signal = (ek_harmonics + ek_rasp) * alarm_syl_env * alarm_burst * 0.25
          : fi.resonbp(ek_fundamental, 2, 1.0)
          : fi.resonhp(1200, 1, 1.0);

// ==========================================================
// AMBIENT — MOUNTAIN STREAM WHITEWATER
// ==========================================================

// --- Broadband Water Noise ---
// The dominant sound: rushing water over rocks.
// Mountain streams have more high-frequency content than rivers —
// the shallow, fast flow produces broadband turbulence.

// Main water rush — shaped by stream size
water_center = 400 + stream_size * 800;  // Larger stream = lower center
water_rush = no.noise * water_level * 0.14
           : fi.resonlp(water_center * 2.0, 1.5, 1.0)
           : fi.resonhp(80, 1, 1.0)
           : *(1.0 + 0.15 * os.osc(0.11) + 0.10 * os.osc(0.29));

// High-frequency splash — whitewater spray and foam
splash_noise = no.noise * water_level * 0.06
             : fi.resonbp(3000 + 1000 * os.osc(0.07), 2, 1.0)
             : *(max(0.0, os.osc(0.17) * 0.7));

// --- Rapids Rhythm ---
// Whitewater has an irregular rhythmic quality — water surging
// over and around boulders in semi-periodic bursts
rapids_surge = no.pink_noise * water_level * 0.10
             : fi.resonlp(600 + 300 * os.osc(0.13), 2, 1.0)
             : *(0.5 + 0.5 * max(0.0, os.osc(0.31) + 0.3 * os.osc(0.47)));

// --- Submerged Bubbles ---
// The gurgling, popping sound of air entrained in turbulent water
bubble_pop = no.noise * water_level * 0.04
           : fi.resonbp(1800 + 600 * os.osc(0.09), 4, 1.0)
           : *(max(0.0, os.osc(0.53) - 0.5));

// --- Boulder Impact ---
// Occasional low thump as large volumes of water hit boulders
boulder = no.pink_noise * water_level * 0.08
        : fi.resonlp(200, 3, 1.0)
        : *(max(0.0, os.osc(0.07) - 0.6));

// --- Distant Waterfall ---
// Background roar from a cascade upstream
waterfall = no.pink_noise * stream_size * 0.05
          : fi.resonlp(350, 2, 1.0)
          : *(0.6 + 0.4 * os.osc(0.05));

// ==========================================================
// OUTPUT
// ==========================================================

process = (wit_signal + ek_signal +
           water_rush + splash_noise + rapids_surge +
           bubble_pop + boulder + waterfall) * 0.80
        : fi.dcblocker
        <: _,_;  // Stereo
