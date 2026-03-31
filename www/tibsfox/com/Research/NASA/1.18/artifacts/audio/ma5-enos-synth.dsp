// Mercury-Atlas 5 — Enos Orbital Flight Synthesizer
// FAUST DSP source — compiles to VST, AU, LV2, JACK, CLI
//
// Mission 1.18: Mercury-Atlas 5 (MA-5)
// The sound of Enos's flight: countdown → Atlas ignition (deeper,
// more powerful than Redstone) → booster staging (explosive sep) →
// sustainer engine → orbital insertion (smooth continuous tone) →
// thruster pops (attitude control issues, fuel burning too fast) →
// retrofire → reentry compression → splashdown
//
// November 29, 1961. Enos the chimpanzee became the first American
// primate to orbit Earth. Planned 3 orbits, cut to 2 due to
// attitude control thruster malfunction consuming excess fuel.
// 161×237 km orbit. Qualified Mercury for Glenn's orbital flight.
// ~60s compressed timeline.
//
// Build:
//   faust2jaqt ma5-enos-synth.dsp    # JACK/Qt standalone
//   faust2lv2  ma5-enos-synth.dsp    # LV2 plugin
//   faust2vst  ma5-enos-synth.dsp    # VST plugin
//
// Parameters:
//   - Phase (0-1): manual control of the 60-second timeline
//   - Auto: toggle automatic phase progression
//   - Intensity: overall volume/intensity
//   - Thruster Mix: audible thruster activity intensity
//
// Install FAUST: https://faust.grame.fr/downloads/

import("stdfaust.lib");

// --- Parameters ---
phase = hslider("[0]Phase", 0, 0, 1, 0.001) : si.smoo;
auto_mode = checkbox("[1]Auto (60s cycle)");
intensity = hslider("[2]Intensity", 0.7, 0, 1, 0.01) : si.smoo;
thruster_mix = hslider("[3]Thruster Activity", 0.7, 0, 1, 0.01) : si.smoo;

// Auto-advancing phase (60-second cycle)
auto_phase = os.phasor(1, 1.0/60.0);
active_phase = select2(auto_mode, phase, auto_phase);

// --- Timeline ---
// Phase 0.00 - 0.05: Countdown + ignition sequence (0-3s)
// Phase 0.05 - 0.12: Liftoff + booster ascent (3-7s)
// Phase 0.12 - 0.17: Booster staging — explosive separation (7-10s)
// Phase 0.17 - 0.25: Sustainer engine — continued ascent (10-15s)
// Phase 0.25 - 0.30: Orbital insertion — smooth transition (15-18s)
// Phase 0.30 - 0.50: First orbit — smooth tone + thruster pops (18-30s)
// Phase 0.50 - 0.68: Second orbit — more thruster issues (30-41s)
// Phase 0.68 - 0.73: Retrofire — braking rockets (41-44s)
// Phase 0.73 - 0.87: Reentry — roar, compression, heating (44-52s)
// Phase 0.87 - 0.93: Drogue + main chute deploy (52-56s)
// Phase 0.93 - 1.00: Splashdown + ocean (56-60s)

// Smooth step helper
smoothstep(edge0, edge1, x) = t * t * (3.0 - 2.0 * t)
with {
  t = max(0.0, min(1.0, (x - edge0) / (edge1 - edge0)));
};

// --- Countdown Beeps ---
countdown = os.osc(800) * cd_env * 0.12
with {
  cd_pulse = ba.if(active_phase < 0.05,
               ba.if(mod(active_phase * 60.0, 1.0) < 0.08, 1.0, 0.0),
               0.0);
  cd_env = cd_pulse * (1.0 - smoothstep(0.03, 0.05, active_phase));
};

// --- Atlas Ignition ---
// Atlas D was significantly more powerful than Redstone:
// 3 engines (2 boosters + 1 sustainer) = 360,000 lbf total thrust
// Deeper, richer roar than Redstone's single engine
atlas_ignition = (no.pink_noise * ign_env
                : fi.resonlp(150 + active_phase * 2000, 2.5, 1.0)
                : fi.resonhp(20, 1.5, 1.0))
              + (no.noise * ign_env * 0.3
                : fi.resonbp(300, 3, 1.0))
with {
  ign_env = ba.if(active_phase < 0.03,
              active_phase / 0.03 * 0.15,
            ba.if(active_phase < 0.05,
              0.15 + (active_phase - 0.03) / 0.02 * 0.85,
            ba.if(active_phase < 0.12,
              1.0,
            ba.if(active_phase < 0.17,
              0.7,  // Reduced after booster sep
            ba.if(active_phase < 0.25,
              max(0.0, 0.7 - (active_phase - 0.17) / 0.08 * 0.7),
              0.0)))));
};

// --- Booster Staging ---
// Atlas "stage and a half": booster section drops away at T+130s
// Two booster engines shut down and skirt jettisons with explosive bolts
staging_bang = (no.noise * stage_env : fi.resonlp(3000, 0.5, 1.0)) * 0.8
            + (no.noise * stage_env * 0.4 : fi.resonbp(800, 2, 1.0))
            + os.sawtooth(120) * stage_env * 0.25
with {
  stage_env = ba.if(active_phase > 0.12 & active_phase < 0.16,
                exp(-(active_phase - 0.12) * 40.0),
                0.0);
};

// --- Sustainer Engine ---
// After booster separation, single sustainer continues
// Smoother, higher-pitched than the combined thrust
sustainer = os.sawtooth(sust_freq) * 0.05 * sust_env
          + os.osc(sust_freq * 1.5) * 0.025 * sust_env
          + no.pink_noise * sust_env * 0.08
          : fi.resonlp(sust_freq * 3.0, 2, 1.0)
with {
  sust_freq = ba.if(active_phase < 0.17, 80,
              ba.if(active_phase < 0.25,
                80 + (active_phase - 0.17) / 0.08 * 120,
                200));
  sust_env = ba.if(active_phase > 0.17 & active_phase < 0.28,
               ba.if(active_phase < 0.20,
                 (active_phase - 0.17) / 0.03,
               ba.if(active_phase < 0.25,
                 1.0,
                 max(0.0, (0.28 - active_phase) / 0.03))),
               0.0)
           * 0.6;
};

// --- Orbital Insertion ---
// Smooth, continuous tone = stable orbit achieved
// Represents the quiet of space after engine cutoff
orbital_tone = (os.osc(f1) * 0.035 + os.osc(f2) * 0.025 + os.osc(f3) * 0.015)
             * orbit_env
             : fi.resonlp(1800, 1, 1.0)
with {
  f1 = 330 + 15 * os.osc(0.07);
  f2 = 495 + 10 * os.osc(0.11);
  f3 = 660 + 20 * os.osc(0.05);
  orbit_env = ba.if(active_phase > 0.28 & active_phase < 0.68,
                ba.if(active_phase < 0.32,
                  (active_phase - 0.28) / 0.04,
                ba.if(active_phase < 0.65,
                  1.0,
                  max(0.0, (0.68 - active_phase) / 0.03))),
                0.0);
};

// --- Thruster Pops ---
// Attitude control thrusters firing too frequently
// Hydrogen peroxide thrusters: sharp pops, increasing in frequency
// This is what forced the mission from 3 to 2 orbits
thruster_pops = no.noise * pop_env * thruster_mix * 0.4
              : fi.resonbp(2500, 5, 1.0)
with {
  // Pop rate increases as attitude control system struggles
  pop_rate = ba.if(active_phase > 0.30 & active_phase < 0.68,
               ba.if(active_phase < 0.50,
                 3.0 + (active_phase - 0.30) / 0.20 * 5.0,   // First orbit: 3-8 pops/sec
                 8.0 + (active_phase - 0.50) / 0.18 * 7.0),  // Second orbit: 8-15 pops/sec
               0.0);
  pop_trigger = ba.if(pop_rate > 0.0,
                  ba.if(mod(active_phase * 60.0 * pop_rate, 1.0) < 0.05, 1.0, 0.0),
                  0.0);
  pop_env = pop_trigger
          * ba.if(active_phase > 0.30 & active_phase < 0.68, 1.0, 0.0);
};

// --- Lever Task Clicks ---
// Enos performing the lever task — same as Ham but for longer
// Correct lever pulls despite shock from malfunctioning system
lever_click = no.noise * click_env * 0.15
            : fi.resonbp(3200, 5, 1.0)
with {
  click_rate = ba.if(active_phase > 0.08 & active_phase < 0.87,
                 mod(active_phase * 60.0, 1.8) < 0.04, 0.0);
  click_env = ba.if(click_rate > 0.5, 1.0, 0.0)
            * ba.if(active_phase > 0.08 & active_phase < 0.87, 0.4, 0.0);
};

// --- Shock Tone ---
// The malfunctioning lever: correct answers get punished
// A dissonant, harsh buzz representing the wrongful shock
shock_tone = os.sawtooth(shock_freq) * shock_env * 0.08
           + no.noise * shock_env * 0.06
           : fi.resonbp(shock_freq, 3, 1.0)
with {
  shock_freq = 160;
  // Periodic shocks during orbital phases (representing the malfunction)
  shock_trigger = ba.if(active_phase > 0.35 & active_phase < 0.65,
                    ba.if(mod(active_phase * 60.0, 4.0) < 0.15, 1.0, 0.0),
                    0.0);
  shock_env = shock_trigger * 0.6;
};

// --- Retrofire ---
// Three retrorockets fire in sequence to deorbit
retro = os.sawtooth(retro_freq) * retro_env * 0.1
      + no.noise * retro_env * 0.12
      : fi.resonlp(retro_freq * 2.5, 1.5, 1.0)
with {
  retro_freq = 280;
  retro_env = ba.if(active_phase > 0.68 & active_phase < 0.73,
                sin((active_phase - 0.68) / 0.05 * 3.14159) * 0.7,
                0.0);
};

// --- Reentry Roar ---
// Heating, compression, g-force buildup
reentry = (no.noise * re_env : fi.resonlp(re_freq, 1.5, 1.0))
        + (no.pink_noise * re_env * 0.5 : fi.resonhp(600, 1, 1.0))
        + os.sawtooth(re_freq * 0.25) * re_env * 0.12
with {
  re_freq = ba.if(active_phase > 0.73 & active_phase < 0.87,
              900 + (active_phase - 0.73) / 0.14 * 3500,
              900);
  re_env = ba.if(active_phase > 0.73 & active_phase < 0.87,
             ba.if(active_phase < 0.80,
               (active_phase - 0.73) / 0.07,
             ba.if(active_phase < 0.84,
               1.0,
               max(0.0, (0.87 - active_phase) / 0.03))),
             0.0)
         * 0.65;
};

// --- Parachute Deploy ---
chute_pop = no.noise * pop2_env * 0.3
          : fi.resonbp(1600, 3, 1.0)
with {
  pop2_env = ba.if(active_phase > 0.87 & active_phase < 0.91,
               ba.if(active_phase < 0.89,
                 (active_phase - 0.87) / 0.02,
                 max(0.0, (0.91 - active_phase) / 0.02)),
               0.0);
};

chute_flutter = no.pink_noise * flutter_env * 0.12
              : fi.resonbp(flutter_freq, 4, 1.0)
with {
  flutter_rate = 5.0 - (active_phase - 0.90) * 6.0;
  flutter_freq = 450 + 250 * os.osc(max(1.0, flutter_rate));
  flutter_env = ba.if(active_phase > 0.90 & active_phase < 0.95,
                  0.5 - (active_phase - 0.90) / 0.05 * 0.3,
                  0.0);
};

// --- Splashdown ---
splashdown = (no.noise * splash_env * 0.45 : fi.resonlp(500, 2, 1.0))
           + (no.pink_noise * splash_env * 0.25 : fi.resonlp(180, 3, 1.0))
with {
  splash_env = ba.if(active_phase > 0.93 & active_phase < 0.97,
                 exp(-(active_phase - 0.93) * 50.0),
                 0.0);
};

// Ocean waves after splashdown
ocean = no.pink_noise * ocean_env * 0.05
      : fi.resonlp(280, 2.5, 1.0)
with {
  ocean_env = ba.if(active_phase > 0.95,
                min(1.0, (active_phase - 0.95) / 0.03)
                * (1.0 + 0.25 * os.osc(0.18)),
                0.0);
};

// --- Mix ---
process = (countdown + atlas_ignition + staging_bang + sustainer +
           orbital_tone + thruster_pops + lever_click + shock_tone +
           retro + reentry + chute_pop + chute_flutter +
           splashdown + ocean)
        * intensity
        : fi.dcblocker
        <: _,_;  // Stereo output
