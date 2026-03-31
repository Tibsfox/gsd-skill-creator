// Mercury-Redstone 3 — Freedom 7 Launch Synthesizer
// FAUST DSP source — compiles to VST, AU, LV2, JACK, CLI
//
// Mission 1.19: Mercury-Redstone 3 (MR-3) — Freedom 7
// Alan Shepard: first American in space.
// The audio arc of 15 minutes 28 seconds compressed to ~60 seconds:
//
// Countdown + Redstone A-7 ignition → liftoff (78,000 lbf —
// single engine, deeper rumble than multi-engine Atlas) →
// max-q buffeting → BECO + capsule separation → tower jettison →
// silence of weightlessness (5 minutes, manual control test) →
// retrofire sequence → reentry roar (11.6g peak, the heaviest
// g-force in Mercury program) → drogue chute pop →
// main chute deploy → splashdown in Atlantic.
//
// May 5, 1961. "Why don't you fix your little problem and
// light this candle?" — Alan Shepard, after hours of delays.
//
// Build:
//   faust2jaqt mr3-freedom7-synth.dsp    # JACK/Qt standalone
//   faust2lv2  mr3-freedom7-synth.dsp    # LV2 plugin
//   faust2vst  mr3-freedom7-synth.dsp    # VST plugin
//
// Parameters:
//   - Phase (0-1): manual control of the 60-second timeline
//   - Auto: toggle automatic phase progression
//   - Intensity: overall volume/intensity
//   - Thruster Mix: manual attitude control thruster activity
//
// Install FAUST: https://faust.grame.fr/downloads/

import("stdfaust.lib");

// --- Parameters ---
phase = hslider("[0]Phase", 0, 0, 1, 0.001) : si.smoo;
auto_mode = checkbox("[1]Auto (60s cycle)");
intensity = hslider("[2]Intensity", 0.7, 0, 1, 0.01) : si.smoo;
thruster_mix = hslider("[3]Thruster Activity", 0.5, 0, 1, 0.01) : si.smoo;

// Auto-advancing phase (60-second cycle)
auto_phase = os.phasor(1, 1.0/60.0);
active_phase = select2(auto_mode, phase, auto_phase);

// --- Timeline ---
// Phase 0.00 - 0.05: Countdown + ignition sequence (0-3s)
// Phase 0.05 - 0.15: Liftoff + Redstone ascent — single A-7 engine (3-9s)
// Phase 0.15 - 0.22: Max-q buffeting — transonic region (9-13s)
// Phase 0.22 - 0.27: BECO + capsule separation + tower jettison (13-16s)
// Phase 0.27 - 0.55: Weightlessness — silence + manual control (16-33s)
// Phase 0.55 - 0.60: Retrofire — 3 retrorockets (33-36s)
// Phase 0.60 - 0.78: Reentry — 11.6g peak, roar, compression (36-47s)
// Phase 0.78 - 0.85: Drogue + main parachute deploy (47-51s)
// Phase 0.85 - 0.92: Descent under canopy (51-55s)
// Phase 0.92 - 1.00: Splashdown + ocean (55-60s)

// Smooth step helper
smoothstep(edge0, edge1, x) = t * t * (3.0 - 2.0 * t)
with {
  t = max(0.0, min(1.0, (x - edge0) / (edge1 - edge0)));
};

// --- Countdown Beeps ---
// "...ten, nine, eight..." — then Shepard's famous line
countdown = os.osc(1000) * cd_env * 0.10
with {
  cd_pulse = ba.if(active_phase < 0.05,
               ba.if(mod(active_phase * 60.0, 1.0) < 0.06, 1.0, 0.0),
               0.0);
  cd_env = cd_pulse * (1.0 - smoothstep(0.03, 0.05, active_phase));
};

// --- Redstone A-7 Ignition ---
// Single engine, 78,000 lbf — less complex roar than Atlas (3 engines).
// Lower fundamental frequency, more focused rumble.
// Redstone was essentially a refined V-2: single-chamber engine,
// liquid oxygen + ethanol.
redstone_ignition = (no.pink_noise * ign_env
                   : fi.resonlp(100 + active_phase * 1500, 2.0, 1.0)
                   : fi.resonhp(15, 1.5, 1.0))
                 + (os.sawtooth(ign_fund) * ign_env * 0.08
                   : fi.resonlp(400, 2, 1.0))
with {
  // Fundamental rumble — lower than Atlas
  ign_fund = ba.if(active_phase < 0.10,
               55 + (active_phase - 0.05) / 0.05 * 25,  // 55→80 Hz ramp
               80);
  ign_env = ba.if(active_phase < 0.03,
              active_phase / 0.03 * 0.10,             // Pre-ignition rumble
            ba.if(active_phase < 0.05,
              0.10 + (active_phase - 0.03) / 0.02 * 0.90,  // Full ignition
            ba.if(active_phase < 0.15,
              1.0,                                    // Full thrust ascent
            ba.if(active_phase < 0.22,
              1.0 - (active_phase - 0.15) / 0.07 * 0.15,  // Slightly reduced at max-q
            ba.if(active_phase < 0.27,
              max(0.0, 0.85 - (active_phase - 0.22) / 0.05 * 0.85),  // BECO fade
              0.0)))));
};

// --- Max-Q Buffeting ---
// Transonic region: capsule shakes as it passes through the sound barrier.
// Rhythmic low-frequency shudder overlaid on engine noise.
maxq_buffet = no.noise * buffet_env * 0.20
            : fi.resonbp(280, 3, 1.0)
            : *(1.0 + 0.5 * os.osc(25.0))
with {
  buffet_env = ba.if(active_phase > 0.15 & active_phase < 0.22,
                 ba.if(active_phase < 0.17,
                   (active_phase - 0.15) / 0.02,
                 ba.if(active_phase < 0.19,
                   1.0,
                   max(0.0, (0.22 - active_phase) / 0.03))),
                 0.0)
             * 0.5;
};

// --- BECO + Separation ---
// Booster engine cutoff: sudden silence, then explosive bolt bang,
// escape tower jettison rocket (small solid motor).
// Two events close together: capsule sep + tower jettison.
separation_bang = (no.noise * sep_env : fi.resonlp(4000, 0.5, 1.0)) * 0.7
               + (no.noise * sep_env * 0.3 : fi.resonbp(1200, 2, 1.0))
with {
  sep_env = ba.if(active_phase > 0.22 & active_phase < 0.26,
              exp(-(active_phase - 0.22) * 50.0),
              0.0);
};

// Tower jettison — smaller, sharper pop, slightly delayed
tower_jettison = no.noise * tower_env * 0.4
               : fi.resonbp(3500, 4, 1.0)
with {
  tower_env = ba.if(active_phase > 0.24 & active_phase < 0.27,
                exp(-(active_phase - 0.24) * 60.0),
                0.0);
};

// --- Weightlessness / Manual Control ---
// Five minutes of silence + gentle spacecraft hum.
// Shepard manually controlled attitude: small thruster pops.
// The periscope view of Earth — capsule at 187.5 km.
// A delicate, floating tone representing the silence of space.
space_tone = (os.osc(f1) * 0.025 + os.osc(f2) * 0.015 + os.osc(f3) * 0.010)
           * space_env
           : fi.resonlp(2000, 1, 1.0)
with {
  f1 = 280 + 10 * os.osc(0.05);
  f2 = 420 + 8 * os.osc(0.08);
  f3 = 560 + 12 * os.osc(0.03);
  space_env = ba.if(active_phase > 0.27 & active_phase < 0.55,
                ba.if(active_phase < 0.30,
                  (active_phase - 0.27) / 0.03,
                ba.if(active_phase < 0.52,
                  1.0,
                  max(0.0, (0.55 - active_phase) / 0.03))),
                0.0);
};

// --- Manual Attitude Control Thrusters ---
// Hydrogen peroxide thrusters: sharp hisses.
// Shepard tested pitch, yaw, and roll manually.
// Short, controlled bursts — the astronaut is flying.
thruster_pops = no.noise * pop_env * thruster_mix * 0.30
              : fi.resonbp(3000, 5, 1.0)
with {
  // Regular, deliberate pops (manual control, not malfunction)
  pop_rate = ba.if(active_phase > 0.30 & active_phase < 0.52,
               2.5,  // Steady, controlled — Shepard testing
               0.0);
  pop_trigger = ba.if(pop_rate > 0.0,
                  ba.if(mod(active_phase * 60.0 * pop_rate, 1.0) < 0.04, 1.0, 0.0),
                  0.0);
  pop_env = pop_trigger
          * ba.if(active_phase > 0.30 & active_phase < 0.52, 1.0, 0.0);
};

// --- Retrofire ---
// Three solid-propellant retrorockets fire in sequence.
// Each burns for ~10 seconds, overlapping.
// Felt as a firm push against the chest.
retro = os.sawtooth(retro_freq) * retro_env * 0.08
      + no.noise * retro_env * 0.10
      + no.pink_noise * retro_env * 0.06
      : fi.resonlp(retro_freq * 2.5, 1.5, 1.0)
with {
  retro_freq = 300;
  retro_env = ba.if(active_phase > 0.55 & active_phase < 0.60,
                sin((active_phase - 0.55) / 0.05 * 3.14159) * 0.7,
                0.0);
};

// --- Reentry Roar ---
// The heaviest reentry in Mercury: 11.6g peak.
// Plasma heating, compression roar, capsule vibrating.
// MR-3 came in steeper than orbital flights — ballistic arc.
// Frequency rises with heating intensity, then falls after peak.
reentry = (no.noise * re_env : fi.resonlp(re_freq, 1.5, 1.0))
        + (no.pink_noise * re_env * 0.6 : fi.resonhp(800, 1, 1.0))
        + os.sawtooth(re_freq * 0.2) * re_env * 0.10
with {
  re_freq = ba.if(active_phase > 0.60 & active_phase < 0.78,
              600 + (active_phase - 0.60) / 0.18 * 5000,  // Steep rise — 11.6g
              600);
  re_env = ba.if(active_phase > 0.60 & active_phase < 0.78,
             ba.if(active_phase < 0.65,
               (active_phase - 0.60) / 0.05,
             ba.if(active_phase < 0.72,
               1.0,                                // Peak heating zone
               max(0.0, (0.78 - active_phase) / 0.06))),
             0.0)
         * 0.75;
};

// --- Drogue Chute Pop ---
// Small drogue at 21,000 ft, then main at 10,000 ft.
// Two distinct deployment events.
drogue_pop = no.noise * drogue_env * 0.35
           : fi.resonbp(2000, 3, 1.0)
with {
  drogue_env = ba.if(active_phase > 0.78 & active_phase < 0.81,
                 exp(-(active_phase - 0.78) * 45.0),
                 0.0);
};

main_chute_pop = no.noise * main_env * 0.40
               : fi.resonbp(1400, 2.5, 1.0)
with {
  main_env = ba.if(active_phase > 0.82 & active_phase < 0.86,
               exp(-(active_phase - 0.82) * 35.0),
               0.0);
};

// --- Parachute Descent ---
// Main chute deployed: fluttering, swinging under canopy.
// Wind rushing past, rhythmic sway.
chute_flutter = no.pink_noise * flutter_env * 0.10
              : fi.resonbp(flutter_freq, 4, 1.0)
with {
  flutter_rate = 4.0;
  flutter_freq = 400 + 200 * os.osc(max(1.0, flutter_rate));
  flutter_env = ba.if(active_phase > 0.85 & active_phase < 0.92,
                  0.5 - (active_phase - 0.85) / 0.07 * 0.25,
                  0.0);
};

// --- Splashdown ---
// Impact with Atlantic Ocean — Shepard later described the
// surprisingly hard impact. Deep, resonant splash.
splashdown = (no.noise * splash_env * 0.50 : fi.resonlp(400, 2, 1.0))
           + (no.pink_noise * splash_env * 0.30 : fi.resonlp(150, 3, 1.0))
with {
  splash_env = ba.if(active_phase > 0.92 & active_phase < 0.96,
                 exp(-(active_phase - 0.92) * 45.0),
                 0.0);
};

// Ocean waves after splashdown — bobbing in the Atlantic
ocean = no.pink_noise * ocean_env * 0.04
      : fi.resonlp(250, 2.5, 1.0)
with {
  ocean_env = ba.if(active_phase > 0.94,
                min(1.0, (active_phase - 0.94) / 0.03)
                * (1.0 + 0.20 * os.osc(0.15)),
                0.0);
};

// --- Mix ---
process = (countdown + redstone_ignition + maxq_buffet +
           separation_bang + tower_jettison +
           space_tone + thruster_pops +
           retro + reentry + drogue_pop + main_chute_pop +
           chute_flutter + splashdown + ocean)
        * intensity
        : fi.dcblocker
        <: _,_;  // Stereo output
