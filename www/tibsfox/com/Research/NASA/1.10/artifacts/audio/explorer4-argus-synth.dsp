// Explorer 4 — Project Argus: Nuclear Detonations in Space
// FAUST DSP source — compiles to VST, AU, LV2, JACK, CLI
//
// Mission 1.10: Explorer 4 (Juno I / ABMA)
// The sound of artificial radiation belts. ~90 seconds.
//
// On July 26, 1958, Explorer 4 launched with scintillation counters
// designed specifically to measure the radiation environment created by
// three nuclear detonations in space — Project Argus. Nicholas Christofilos
// predicted that fission electrons would become trapped by Earth's magnetic
// field, creating artificial radiation belts. He was right.
//
// Three detonations. Three cycles of the same pattern:
//   BOOM → injection → spiraling particles → gradual decay
//
// Timeline (mission phase → synth time):
//   0-4s:      Silence of space — deep quiet, Explorer 4 in orbit, counters waiting
//   4-6s:      Argus I flash — Aug 27, 1958, 200 km altitude, South Atlantic
//              Low percussion BOOM, expanding shock, nuclear white noise
//   6-16s:     Argus I trapping — electrons spiral along field lines, pitch rises
//              as particles bounce between mirror points, slowly decaying
//   16-20s:    Argus I decay — the artificial belt fades, background returns
//   20-22s:    Argus II flash — Aug 30, 1958, 240 km altitude
//              Second BOOM, slightly different character
//   22-32s:    Argus II trapping — same spiral pattern, fresh injection
//   32-36s:    Argus II decay
//   36-38s:    Argus III flash — Sep 6, 1958, 540 km altitude (highest)
//              Third BOOM, deeper injection into belt region
//   38-55s:    Argus III trapping — longest spiral, highest altitude injection
//              means slower decay, more persistent belt
//   55-70s:    Combined belt decay — all three artificial belts merging,
//              overlapping, slowly dissipating through atmospheric loss
//              and pitch-angle scattering
//   70-85s:    Return to natural — Van Allen belts reassert, the artificial
//              perturbation fading below the natural background
//   85-90s:    Silence — the experiment is over. The belts are natural again.
//
// Organism resonance: Cladonia stellaris (star-tipped reindeer lichen)
//   The lichen absorbs what the sky releases. Radioactive fallout from
//   nuclear tests accumulated in Arctic Cladonia lichens, entering the
//   caribou/reindeer food chain. The detonation is creation; the lichen
//   is accumulation; the silence is the half-life.
//
// Build:
//   faust2jaqt explorer4-argus-synth.dsp    # JACK/Qt standalone
//   faust2lv2  explorer4-argus-synth.dsp    # LV2 plugin
//   faust2vst  explorer4-argus-synth.dsp    # VST plugin (needs VST SDK)
//
// Install FAUST: https://faust.grame.fr/downloads/

import("stdfaust.lib");

// --- Parameters ---
phase = hslider("[0]Phase", 0, 0, 1, 0.001) : si.smoo;
auto_mode = checkbox("[1]Auto (90s cycle)");
intensity = hslider("[2]Intensity", 0.7, 0, 1, 0.01) : si.smoo;
decay_rate = hslider("[3]Decay Rate", 0.5, 0, 1, 0.01) : si.smoo;

// Auto-advancing phase (90-second cycle)
auto_phase = os.phasor(1, 1.0/90.0);
active_phase = select2(auto_mode, phase, auto_phase);

// --- Time mapping (phase 0-1 → 0-90 seconds) ---
time_sec = active_phase * 90.0;

// ============================================
// ORBITAL SILENCE (0-4s)
// ============================================
// Explorer 4 in orbit. Scintillation counters ticking quietly.
// The faint hiss of cosmic rays on the detectors.
silence_env = ba.if(time_sec < 4.0,
                ba.if(time_sec < 1.0, time_sec, 1.0) *
                ba.if(time_sec > 3.0, (4.0 - time_sec), 1.0),
                0.0);

cosmic_tick = no.noise : fi.resonbp(4000, 8, 1.0) : *(0.015);
orbital_hum = os.osc(30) * 0.02 + os.osc(60) * 0.01;
silence = (cosmic_tick + orbital_hum) * silence_env * 0.3;

// ============================================
// DETONATION GENERATOR (reusable)
// ============================================
// Nuclear flash: broadband impulse + low percussion + shock expansion
// t_start: when detonation occurs
// t_dur: total phase duration (flash + trapping + decay)
// alt_factor: altitude scaling (higher = deeper spirals)

det_flash(t_start, flash_dur) =
  ba.if(time_sec >= t_start & time_sec < t_start + flash_dur,
    (1.0 - (time_sec - t_start) / flash_dur),
    0.0);

det_boom(t_start) =
  ba.if(time_sec >= t_start & time_sec < t_start + 0.3,
    (1.0 - (time_sec - t_start) / 0.3),
    0.0);

// ============================================
// ARGUS I — Aug 27, 1958 (4-20s)
// ============================================
// 1.7 kt W-25 warhead, 200 km altitude, South Atlantic
a1_start = 4.0;

// Flash (4-6s) — nuclear BOOM
a1_flash_env = det_flash(a1_start, 2.0);
a1_boom_env = det_boom(a1_start);
a1_flash_noise = no.noise : fi.resonlp(400, 1, 1.0) : *(0.4);
a1_boom = os.osc(25) * 0.5 + os.osc(40) * 0.3 + os.osc(15) * 0.2;
a1_crack = no.noise : fi.resonbp(2000, 3, 1.0) : *(0.2);
a1_flash = (a1_flash_noise + a1_boom * a1_boom_env + a1_crack * a1_flash_env) * a1_flash_env;

// Trapping (6-16s) — electrons spiral along field lines
a1_trap_env = ba.if(time_sec >= 6.0 & time_sec < 16.0,
                ba.if(time_sec < 7.0, (time_sec - 6.0), 1.0) *
                (1.0 - (time_sec - 6.0) / 12.0 * decay_rate),
                0.0);

// Pitch rises as electrons spiral faster at mirror points
a1_spiral_freq = 200 + (time_sec - 6.0) * 40;
a1_spiral = os.osc(a1_spiral_freq) * 0.08 + os.osc(a1_spiral_freq * 1.5) * 0.05;
// Bouncing between mirror points — amplitude modulation
a1_bounce_rate = 2.0 + (time_sec - 6.0) * 0.3;
a1_bounce = 0.5 + 0.5 * os.osc(a1_bounce_rate);
// Trapped particle hiss
a1_hiss = no.noise : fi.resonbp(a1_spiral_freq * 2, 4, 1.0) : *(0.04);

a1_trap = (a1_spiral * a1_bounce + a1_hiss) * a1_trap_env;

// Decay (16-20s)
a1_decay_env = ba.if(time_sec >= 16.0 & time_sec < 20.0,
                 (20.0 - time_sec) / 4.0,
                 0.0);
a1_decay = os.osc(120) * 0.03 * a1_decay_env;

a1_total = (a1_flash + a1_trap + a1_decay) * 0.7;

// ============================================
// ARGUS II — Aug 30, 1958 (20-36s)
// ============================================
// 1.7 kt, 240 km altitude
a2_start = 20.0;

a2_flash_env = det_flash(a2_start, 2.0);
a2_boom_env = det_boom(a2_start);
a2_flash_noise = no.noise : fi.resonlp(350, 1, 1.0) : *(0.4);
a2_boom = os.osc(22) * 0.5 + os.osc(35) * 0.3 + os.osc(50) * 0.15;
a2_crack = no.noise : fi.resonbp(2200, 3, 1.0) : *(0.2);
a2_flash = (a2_flash_noise + a2_boom * a2_boom_env + a2_crack * a2_flash_env) * a2_flash_env;

a2_trap_env = ba.if(time_sec >= 22.0 & time_sec < 32.0,
                ba.if(time_sec < 23.0, (time_sec - 22.0), 1.0) *
                (1.0 - (time_sec - 22.0) / 12.0 * decay_rate),
                0.0);

a2_spiral_freq = 220 + (time_sec - 22.0) * 45;
a2_spiral = os.osc(a2_spiral_freq) * 0.08 + os.osc(a2_spiral_freq * 1.5) * 0.05;
a2_bounce_rate = 2.2 + (time_sec - 22.0) * 0.35;
a2_bounce = 0.5 + 0.5 * os.osc(a2_bounce_rate);
a2_hiss = no.noise : fi.resonbp(a2_spiral_freq * 2, 4, 1.0) : *(0.04);

a2_trap = (a2_spiral * a2_bounce + a2_hiss) * a2_trap_env;

a2_decay_env = ba.if(time_sec >= 32.0 & time_sec < 36.0,
                 (36.0 - time_sec) / 4.0,
                 0.0);
a2_decay = os.osc(130) * 0.03 * a2_decay_env;

a2_total = (a2_flash + a2_trap + a2_decay) * 0.7;

// ============================================
// ARGUS III — Sep 6, 1958 (36-55s)
// ============================================
// 1.7 kt, 540 km altitude — highest injection, longest persistence
a3_start = 36.0;

a3_flash_env = det_flash(a3_start, 2.0);
a3_boom_env = det_boom(a3_start);
a3_flash_noise = no.noise : fi.resonlp(300, 1, 1.0) : *(0.45);
a3_boom = os.osc(18) * 0.5 + os.osc(28) * 0.35 + os.osc(42) * 0.2;
a3_crack = no.noise : fi.resonbp(1800, 3, 1.0) : *(0.2);
a3_flash = (a3_flash_noise + a3_boom * a3_boom_env + a3_crack * a3_flash_env) * a3_flash_env;

// Longer trapping phase — higher altitude means slower decay
a3_trap_env = ba.if(time_sec >= 38.0 & time_sec < 55.0,
                ba.if(time_sec < 39.5, (time_sec - 38.0) / 1.5, 1.0) *
                (1.0 - (time_sec - 38.0) / 20.0 * decay_rate),
                0.0);

a3_spiral_freq = 180 + (time_sec - 38.0) * 30;
a3_spiral = os.osc(a3_spiral_freq) * 0.10 + os.osc(a3_spiral_freq * 1.5) * 0.06;
a3_bounce_rate = 1.8 + (time_sec - 38.0) * 0.2;
a3_bounce = 0.5 + 0.5 * os.osc(a3_bounce_rate);
a3_hiss = no.noise : fi.resonbp(a3_spiral_freq * 2, 4, 1.0) : *(0.05);
// Deeper harmonic — higher altitude injection
a3_deep = os.osc(a3_spiral_freq * 0.5) * 0.04;

a3_trap = (a3_spiral * a3_bounce + a3_hiss + a3_deep) * a3_trap_env;

a3_total = (a3_flash + a3_trap) * 0.7;

// ============================================
// COMBINED BELT DECAY (55-70s)
// ============================================
// All three artificial belts merging, overlapping, dissipating
combined_env = ba.if(time_sec >= 55.0 & time_sec < 70.0,
                 ba.if(time_sec < 57.0, (time_sec - 55.0) / 2.0, 1.0) *
                 (1.0 - (time_sec - 55.0) / 15.0),
                 0.0);

// Three overlapping spiral tones at different rates — the belts merging
merged_a = os.osc(150 + (time_sec - 55.0) * 5) * 0.04;
merged_b = os.osc(180 + (time_sec - 55.0) * 3) * 0.03;
merged_c = os.osc(130 + (time_sec - 55.0) * 7) * 0.03;
// Atmospheric loss — hissing that represents particles hitting atmosphere
loss_hiss = no.noise : fi.resonlp(600 - (time_sec - 55.0) * 20, 1, 1.0) : *(0.04);
// Pitch-angle scattering — random modulation
scatter = no.noise : fi.resonbp(300, 2, 1.0) : *(0.02);

combined = (merged_a + merged_b + merged_c + loss_hiss + scatter) * combined_env * 0.6;

// ============================================
// RETURN TO NATURAL (70-85s)
// ============================================
// Van Allen belts reassert. The artificial perturbation fades.
natural_env = ba.if(time_sec >= 70.0 & time_sec < 85.0,
                ba.if(time_sec < 73.0, (time_sec - 70.0) / 3.0, 1.0) *
                ba.if(time_sec > 82.0, (85.0 - time_sec) / 3.0, 1.0),
                0.0);

// Natural belt hum — steady, ancient, undisturbed
natural_inner = os.osc(80) * 0.03 + os.osc(120) * 0.02;
natural_outer = os.osc(50) * 0.02 + os.osc(70) * 0.015;
// Cosmic ray background returns
cosmic_bg = no.noise : fi.resonbp(3000, 6, 1.0) : *(0.01);

natural = (natural_inner + natural_outer + cosmic_bg) * natural_env * 0.4;

// ============================================
// FINAL SILENCE (85-90s)
// ============================================
// The experiment is over. The belts are natural again.
final_env = ba.if(time_sec >= 85.0 & time_sec <= 90.0,
              (90.0 - time_sec) / 5.0,
              0.0);

final_whisper = os.osc(50) * 0.015 + no.noise : fi.resonlp(60, 0.2, 1.0) : *(0.008);
final = final_whisper * final_env * 0.3;

// ============================================
// MASTER MIX
// ============================================
raw = (silence + a1_total + a2_total + a3_total + combined + natural + final) * intensity;

// Gentle limiting
limited = raw : ef.compressor_mono(4, -6, 0.01, 0.1);

// Stereo — detonations center, spirals pan with bounce
width = 0.35;
process = limited <: *(1 + width * os.osc(0.11)), *(1 - width * os.osc(0.11));
