// Mercury-Redstone 4 — Liberty Bell 7 Launch + Sinking Synthesizer
// FAUST DSP source — compiles to VST, AU, LV2, JACK, CLI
//
// Mission 1.20: Mercury-Redstone 4 (MR-4) — Liberty Bell 7
// Gus Grissom: second American in space, July 21, 1961.
// The audio arc of triumph to disaster compressed to ~75 seconds:
//
// Countdown + Redstone A-7 ignition → liftoff (78,000 lbf —
// same engine as MR-3 but slightly different harmonics, every
// Redstone had its own voice) → max-q buffeting →
// BECO + capsule separation → weightlessness (5 minutes) →
// retrofire → reentry → drogue chute → main chute →
// splashdown IMPACT → then the disaster:
//
// HATCH BLOW — explosive bolt crack, the loudest single event
// in the synthesis. Sharp transient, 140+ dB equivalent.
// Rushing water flooding through the open hatch.
// The heavy, groaning rumble of 2,400 lbs of capsule taking on water.
// Metal creaking under hydrostatic pressure.
// Helicopter straining overhead (rotor thump fading as cable parts).
// The capsule sinking — a long, descending pitch as it falls
// through 4,900 meters of water column.
// Fading into the absolute silence of the abyssal plain.
//
// The emotional arc: triumph → routine → catastrophe → silence.
//
// "I was just lying there minding my own business when — Loss
// of Liberty Bell 7."
//
// Build:
//   faust2jaqt mr4-liberty-bell-synth.dsp    # JACK/Qt standalone
//   faust2lv2  mr4-liberty-bell-synth.dsp    # LV2 plugin
//   faust2vst  mr4-liberty-bell-synth.dsp    # VST plugin
//
// Parameters:
//   - Phase (0-1): manual control of the 75-second timeline
//   - Auto: toggle automatic phase progression
//   - Intensity: overall volume/intensity
//   - Depth Reverb: wet/dry mix for the sinking section
//
// Install FAUST: https://faust.grame.fr/downloads/

import("stdfaust.lib");

// --- Parameters ---
phase = hslider("[0]Phase", 0, 0, 1, 0.001) : si.smoo;
auto_mode = checkbox("[1]Auto (75s cycle)");
intensity = hslider("[2]Intensity", 0.7, 0, 1, 0.01) : si.smoo;
depth_reverb = hslider("[3]Depth Reverb", 0.6, 0, 1, 0.01) : si.smoo;

// Auto-advancing phase (75-second cycle)
auto_phase = os.phasor(1, 1.0/75.0);
active_phase = select2(auto_mode, phase, auto_phase);

// --- Timeline ---
// Phase 0.00 - 0.04: Countdown + ignition sequence (0-3s)
// Phase 0.04 - 0.12: Liftoff + Redstone ascent (3-9s)
// Phase 0.12 - 0.18: Max-q buffeting (9-13.5s)
// Phase 0.18 - 0.22: BECO + capsule separation (13.5-16.5s)
// Phase 0.22 - 0.36: Weightlessness — silence (16.5-27s)
// Phase 0.36 - 0.40: Retrofire (27-30s)
// Phase 0.40 - 0.50: Reentry (30-37.5s)
// Phase 0.50 - 0.55: Drogue + main chute (37.5-41s)
// Phase 0.55 - 0.60: Splashdown impact (41-45s)
// Phase 0.60 - 0.64: Post-splash — bobbing, waiting (45-48s)
// Phase 0.64 - 0.67: HATCH BLOW — explosive crack (48-50s)
// Phase 0.67 - 0.75: Water flooding capsule (50-56s)
// Phase 0.75 - 0.82: Helicopter strain + cable part (56-61.5s)
// Phase 0.82 - 0.95: Capsule sinking — 4,900 meters (61.5-71s)
// Phase 0.95 - 1.00: Abyssal silence (71-75s)

// Smooth step helper
smoothstep(edge0, edge1, x) = t * t * (3.0 - 2.0 * t)
with {
  t = max(0.0, min(1.0, (x - edge0) / (edge1 - edge0)));
};

// --- Countdown Beeps ---
countdown = os.osc(1000) * cd_env * 0.10
with {
  cd_pulse = ba.if(active_phase < 0.04,
               ba.if(mod(active_phase * 75.0, 1.0) < 0.06, 1.0, 0.0),
               0.0);
  cd_env = cd_pulse * (1.0 - smoothstep(0.02, 0.04, active_phase));
};

// --- Redstone A-7 Ignition ---
// Same engine family as MR-3 but each Redstone had unique character.
// MR-4's booster had slightly rougher combustion — audible in
// a wider harmonic spread and a touch more vibration.
redstone_ignition = (no.pink_noise * ign_env
                   : fi.resonlp(90 + active_phase * 1600, 1.8, 1.0)
                   : fi.resonhp(18, 1.5, 1.0))
                 + (os.sawtooth(ign_fund) * ign_env * 0.09
                   : fi.resonlp(420, 2, 1.0))
                 + (os.osc(ign_fund * 1.5) * ign_env * 0.04
                   : fi.resonlp(300, 3, 1.0))
with {
  // Slightly different fundamental than MR-3 — rougher combustion
  ign_fund = ba.if(active_phase < 0.08,
               52 + (active_phase - 0.04) / 0.04 * 30,  // 52→82 Hz ramp
               82);
  ign_env = ba.if(active_phase < 0.02,
              active_phase / 0.02 * 0.08,
            ba.if(active_phase < 0.04,
              0.08 + (active_phase - 0.02) / 0.02 * 0.92,
            ba.if(active_phase < 0.12,
              1.0,
            ba.if(active_phase < 0.18,
              1.0 - (active_phase - 0.12) / 0.06 * 0.12,
            ba.if(active_phase < 0.22,
              max(0.0, 0.88 - (active_phase - 0.18) / 0.04 * 0.88),
              0.0)))));
};

// --- Max-Q Buffeting ---
maxq_buffet = no.noise * buffet_env * 0.20
            : fi.resonbp(300, 3, 1.0)
            : *(1.0 + 0.5 * os.osc(28.0))
with {
  buffet_env = ba.if(active_phase > 0.12 & active_phase < 0.18,
                 ba.if(active_phase < 0.14,
                   (active_phase - 0.12) / 0.02,
                 ba.if(active_phase < 0.16,
                   1.0,
                   max(0.0, (0.18 - active_phase) / 0.02))),
                 0.0)
             * 0.5;
};

// --- BECO + Separation ---
separation_bang = (no.noise * sep_env : fi.resonlp(4200, 0.5, 1.0)) * 0.7
               + (no.noise * sep_env * 0.3 : fi.resonbp(1300, 2, 1.0))
with {
  sep_env = ba.if(active_phase > 0.18 & active_phase < 0.21,
              exp(-(active_phase - 0.18) * 55.0),
              0.0);
};

tower_jettison = no.noise * tower_env * 0.4
               : fi.resonbp(3600, 4, 1.0)
with {
  tower_env = ba.if(active_phase > 0.19 & active_phase < 0.22,
                exp(-(active_phase - 0.19) * 60.0),
                0.0);
};

// --- Weightlessness ---
// Grissom had a nearly identical zero-g experience to Shepard.
// Quiet spacecraft hum, occasional thruster pops.
space_tone = (os.osc(f1) * 0.025 + os.osc(f2) * 0.015 + os.osc(f3) * 0.010)
           * space_env
           : fi.resonlp(2000, 1, 1.0)
with {
  f1 = 275 + 12 * os.osc(0.06);
  f2 = 415 + 9 * os.osc(0.09);
  f3 = 555 + 14 * os.osc(0.04);
  space_env = ba.if(active_phase > 0.22 & active_phase < 0.36,
                ba.if(active_phase < 0.25,
                  (active_phase - 0.22) / 0.03,
                ba.if(active_phase < 0.33,
                  1.0,
                  max(0.0, (0.36 - active_phase) / 0.03))),
                0.0);
};

thruster_pops = no.noise * pop_env * 0.25
              : fi.resonbp(3200, 5, 1.0)
with {
  pop_rate = ba.if(active_phase > 0.25 & active_phase < 0.33,
               2.0,
               0.0);
  pop_trigger = ba.if(pop_rate > 0.0,
                  ba.if(mod(active_phase * 75.0 * pop_rate, 1.0) < 0.04, 1.0, 0.0),
                  0.0);
  pop_env = pop_trigger
          * ba.if(active_phase > 0.25 & active_phase < 0.33, 1.0, 0.0);
};

// --- Retrofire ---
retro = os.sawtooth(retro_freq) * retro_env * 0.08
      + no.noise * retro_env * 0.10
      + no.pink_noise * retro_env * 0.06
      : fi.resonlp(retro_freq * 2.5, 1.5, 1.0)
with {
  retro_freq = 310;
  retro_env = ba.if(active_phase > 0.36 & active_phase < 0.40,
                sin((active_phase - 0.36) / 0.04 * 3.14159) * 0.7,
                0.0);
};

// --- Reentry ---
// Similar to MR-3: steep ballistic arc, but slightly less severe.
// Grissom experienced ~11.1g peak (vs Shepard's 11.6g).
reentry = (no.noise * re_env : fi.resonlp(re_freq, 1.5, 1.0))
        + (no.pink_noise * re_env * 0.6 : fi.resonhp(700, 1, 1.0))
        + os.sawtooth(re_freq * 0.2) * re_env * 0.10
with {
  re_freq = ba.if(active_phase > 0.40 & active_phase < 0.50,
              550 + (active_phase - 0.40) / 0.10 * 4800,
              550);
  re_env = ba.if(active_phase > 0.40 & active_phase < 0.50,
             ba.if(active_phase < 0.43,
               (active_phase - 0.40) / 0.03,
             ba.if(active_phase < 0.47,
               1.0,
               max(0.0, (0.50 - active_phase) / 0.03))),
             0.0)
         * 0.70;
};

// --- Drogue + Main Chute ---
drogue_pop = no.noise * drogue_env * 0.35
           : fi.resonbp(2100, 3, 1.0)
with {
  drogue_env = ba.if(active_phase > 0.50 & active_phase < 0.52,
                 exp(-(active_phase - 0.50) * 50.0),
                 0.0);
};

main_chute_pop = no.noise * main_env * 0.40
               : fi.resonbp(1500, 2.5, 1.0)
with {
  main_env = ba.if(active_phase > 0.53 & active_phase < 0.56,
               exp(-(active_phase - 0.53) * 35.0),
               0.0);
};

// --- Splashdown ---
// Hard impact with Atlantic — similar to MR-3
splashdown = (no.noise * splash_env * 0.50 : fi.resonlp(380, 2, 1.0))
           + (no.pink_noise * splash_env * 0.30 : fi.resonlp(140, 3, 1.0))
with {
  splash_env = ba.if(active_phase > 0.55 & active_phase < 0.60,
                 exp(-(active_phase - 0.55) * 40.0),
                 0.0);
};

// --- Post-Splash Ocean Bobbing ---
// Brief calm — capsule floating, helicopters approaching.
// This is the false peace before the disaster.
ocean_bob = no.pink_noise * bob_env * 0.04
          : fi.resonlp(220, 2.5, 1.0)
          : *(1.0 + 0.25 * os.osc(0.18))
with {
  bob_env = ba.if(active_phase > 0.58 & active_phase < 0.64,
              ba.if(active_phase < 0.60,
                (active_phase - 0.58) / 0.02,
                1.0),
              0.0);
};

// ==========================================================
// THE DISASTER — Hatch Blow, Flooding, Sinking
// ==========================================================

// --- HATCH BLOW ---
// The centerpiece event. 70 explosive bolts firing simultaneously.
// An instantaneous crack — the loudest, sharpest transient in
// the entire synthesis. Like a shotgun blast inside a tin can.
// This is the moment everything goes wrong.
hatch_blow = (no.noise * hatch_env * 0.85
            : fi.resonlp(8000, 0.5, 1.0))
           + (no.noise * hatch_env * 0.60
            : fi.resonbp(3000, 1.5, 1.0))
           + (no.noise * hatch_ring * 0.30
            : fi.resonbp(1200, 6, 1.0))
with {
  // Initial explosive crack — extremely fast attack
  hatch_env = ba.if(active_phase > 0.64 & active_phase < 0.67,
                exp(-(active_phase - 0.64) * 120.0),
                0.0);
  // Metallic ringing after the blast — the hatch frame resonating
  hatch_ring = ba.if(active_phase > 0.645 & active_phase < 0.68,
                 exp(-(active_phase - 0.645) * 30.0) * 0.6,
                 0.0);
};

// --- Water Flooding ---
// Seawater rushing through the open hatch.
// The sound of a fire hose hitting the inside of a metal drum.
// Broadband water noise with low-frequency capsule resonance.
// Volume builds as the water level rises inside the capsule.
water_flood = (no.noise * flood_env * 0.45
             : fi.resonlp(flood_freq, 1.5, 1.0)
             : fi.resonhp(60, 1, 1.0))
            + (no.pink_noise * flood_env * 0.25
             : fi.resonbp(200, 2, 1.0))
            + (os.osc(flood_resonance) * flood_env * 0.08
             : fi.resonlp(400, 3, 1.0))
with {
  // Water noise frequency drops as capsule fills — less air space to resonate
  flood_freq = ba.if(active_phase > 0.67 & active_phase < 0.75,
                 2500 - (active_phase - 0.67) / 0.08 * 1800,  // 2500→700 Hz
                 2500);
  // Capsule resonance drops as it fills with water
  flood_resonance = ba.if(active_phase > 0.67 & active_phase < 0.75,
                      180 - (active_phase - 0.67) / 0.08 * 80,  // 180→100 Hz
                      180);
  flood_env = ba.if(active_phase > 0.67 & active_phase < 0.75,
                ba.if(active_phase < 0.69,
                  (active_phase - 0.67) / 0.02,     // Rush builds
                ba.if(active_phase < 0.73,
                  1.0,                                // Full flood
                  max(0.0, (0.75 - active_phase) / 0.02))),  // Subsides as capsule fills
                0.0);
};

// --- Helicopter Strain ---
// The recovery helicopter's rotor thump — Marine helicopter
// trying to lift the capsule as it fills with water.
// Rhythmic low-frequency thump that grows strained, then stops
// abruptly when the cable is released.
helicopter = os.osc(heli_freq) * heli_env * 0.12
           + no.pink_noise * heli_env * 0.06
           : fi.resonlp(800, 2, 1.0)
           : *(1.0 + 0.3 * os.osc(heli_freq * 0.5))
with {
  // Rotor blade pass frequency (~6 Hz for UH-34D main rotor)
  heli_freq = ba.if(active_phase > 0.72 & active_phase < 0.82,
                ba.if(active_phase < 0.78,
                  24.0,                         // Normal rotor thump
                  24.0 - (active_phase - 0.78) / 0.04 * 6.0),  // Straining, slowing
                24.0);
  heli_env = ba.if(active_phase > 0.72 & active_phase < 0.82,
               ba.if(active_phase < 0.74,
                 (active_phase - 0.72) / 0.02 * 0.6,
               ba.if(active_phase < 0.78,
                 0.6,                           // Hovering, trying to lift
               ba.if(active_phase < 0.80,
                 0.6 + (active_phase - 0.78) / 0.02 * 0.4,  // Straining — max power
                 max(0.0, (0.82 - active_phase) / 0.02)))),  // Cable released — fades
               0.0);
};

// Cable snap — brief metallic ping when cable parts
cable_snap = no.noise * snap_env * 0.3
           : fi.resonbp(4500, 5, 1.0)
with {
  snap_env = ba.if(active_phase > 0.81 & active_phase < 0.83,
               exp(-(active_phase - 0.81) * 100.0),
               0.0);
};

// ==========================================================
// THE SINKING — 4,900 Meters to the Bottom
// ==========================================================

// Capsule descending through water column.
// Frequency drops continuously — deep, groaning descent.
// Pressure creaking of the hull. Marine snow particles (quiet hiss).
// Light fading (represented as overall amplitude fade).
// The sound of the ocean absorbing the capsule.

sinking = (os.sawtooth(sink_freq) * sink_env * 0.07
          : fi.resonlp(sink_freq * 2.0, 2, 1.0))
        + (no.pink_noise * sink_env * sink_depth * 0.20
          : fi.resonlp(sink_freq, 2.5, 1.0)
          : fi.resonhp(10, 1, 1.0))
        + (no.noise * sink_env * 0.05
          : fi.resonbp(sink_freq * 0.5, 4, 1.0))
with {
  // Frequency drops as capsule goes deeper — like a descending tone
  // 4,900 meters of descent mapped to phase 0.82-0.95
  sink_progress = ba.if(active_phase > 0.82 & active_phase < 0.95,
                    (active_phase - 0.82) / 0.13,
                    0.0);
  // Exponential frequency drop: 120 Hz → 20 Hz
  sink_freq = ba.if(active_phase > 0.82 & active_phase < 0.95,
                120.0 * pow(0.15, sink_progress),  // Exponential decay
                120.0);
  // Depth factor — things get quieter as light and sound are absorbed
  sink_depth = ba.if(active_phase > 0.82 & active_phase < 0.95,
                 1.0 - sink_progress * 0.7,
                 1.0);
  sink_env = ba.if(active_phase > 0.82 & active_phase < 0.95,
               ba.if(active_phase < 0.84,
                 (active_phase - 0.82) / 0.02,
                 max(0.0, 1.0 - sink_progress * 0.85)),
               0.0);
};

// Pressure creaks — hull groaning under increasing hydrostatic pressure
// Irregular, metallic groaning sounds
pressure_creaks = os.osc(creak_f) * creak_env * 0.08
                : fi.resonbp(creak_f, 6, 1.0)
with {
  creak_f = ba.if(active_phase > 0.84 & active_phase < 0.93,
              350 + no.noise * 50 : fi.resonlp(5, 1, 1.0) : *(50),
              350);
  creak_trigger = ba.if(active_phase > 0.84 & active_phase < 0.93,
                    ba.if(mod(active_phase * 75.0 * 1.2, 1.0) < 0.03, 1.0, 0.0),
                    0.0);
  creak_env = creak_trigger * 0.5
            * ba.if(active_phase > 0.84 & active_phase < 0.93,
                max(0.1, 1.0 - (active_phase - 0.84) / 0.09),
                0.0);
};

// Marine snow — faint, high-frequency hiss of particles drifting upward
// (from the capsule's perspective, particles stream upward as it sinks)
marine_snow = no.noise * snow_env * 0.02
            : fi.resonbp(3000 - snow_depth * 1500, 4, 1.0)
with {
  snow_depth = ba.if(active_phase > 0.84 & active_phase < 0.95,
                 (active_phase - 0.84) / 0.11,
                 0.0);
  snow_env = ba.if(active_phase > 0.84 & active_phase < 0.95,
               max(0.0, 0.5 - snow_depth * 0.4),
               0.0);
};

// --- Abyssal Silence ---
// The very end: the capsule has reached the bottom.
// Near-total silence. A faint, subsonic presence — the weight
// of 4,900 meters of water above. The heartbeat of the deep.
abyss = os.osc(abyss_freq) * abyss_env * 0.02
      : fi.resonlp(40, 3, 1.0)
with {
  abyss_freq = 12 + 3 * os.osc(0.03);  // Sub-bass presence
  abyss_env = ba.if(active_phase > 0.94,
                min(1.0, (active_phase - 0.94) / 0.03)
                * (1.0 - smoothstep(0.97, 1.0, active_phase)),
                0.0);
};

// --- Depth Reverb Processing ---
// As the capsule sinks, add increasing reverb/delay to simulate
// the acoustic properties of deep water
depth_factor = ba.if(active_phase > 0.82,
                 min(1.0, (active_phase - 0.82) / 0.13),
                 0.0);

// --- Mix ---
dry_signal = (countdown + redstone_ignition + maxq_buffet +
              separation_bang + tower_jettison +
              space_tone + thruster_pops +
              retro + reentry + drogue_pop + main_chute_pop +
              splashdown + ocean_bob +
              hatch_blow + water_flood + helicopter + cable_snap +
              sinking + pressure_creaks + marine_snow + abyss);

process = dry_signal
        * intensity
        : fi.dcblocker
        <: _,_;  // Stereo output
