// Mercury-Atlas 6 — Friendship 7 Launch + Orbit + Reentry Synthesizer
// FAUST DSP source — compiles to VST, AU, LV2, JACK, CLI
//
// Mission 1.21: Mercury-Atlas 6 (MA-6) — Friendship 7
// John Glenn: first American to orbit Earth, February 20, 1962.
// Three orbits in 4 hours 55 minutes 23 seconds.
//
// The audio arc of history compressed to ~90 seconds:
//
// T-minus countdown + Atlas LV-3B ignition → liftoff (367,000 lbf
// of combined thrust — booster + sustainer + vernier — the Atlas
// was a stage-and-a-half design, all engines lit at once) →
// max-q → BECO (booster engines jettisoned, staging on an Atlas
// was dropping the skirt, not a clean separation) → SECO
// (sustainer cutoff) → orbital insertion →
//
// THREE ORBITS — the heart of the synthesis:
//   Each orbit ~88.5 minutes compressed to ~18 seconds.
//   Daylight side: high-frequency shimmer, the hum of systems,
//     the brilliant blue curve of Earth through the window.
//   Night side: "fireflies" — Glenn's famous observation of
//     luminous particles drifting past the capsule at each dawn.
//     "They were luminescent particles... like looking into a
//     field of fireflies." Later identified as ice crystals
//     from the capsule's heat exchanger.
//   Dawn crossing: frequency sweep, sunrise over the Pacific.
//
// Then the crisis: the 0501 signal — Segment 51 showed the
// heat shield might be loose. Ground decided to keep the
// retropack on through reentry as a strap to hold the shield.
//
// Reentry with retropack — the straps burning off, chunks of
// flaming retropack breaking away past the window. Glenn:
// "That's a real fireball outside." The plasma sheath —
// ionization blackout — 4.5 minutes of silence where nobody
// knew if Glenn was alive.
//
// Then his voice: "Boy, that was a real fireball."
//
// Drogue chute → main chute → splashdown in the Atlantic.
// The orbital era of American spaceflight had begun.
//
// "Godspeed, John Glenn." — Scott Carpenter, CapCom
//
// Build:
//   faust2jaqt ma6-friendship7-synth.dsp    # JACK/Qt standalone
//   faust2lv2  ma6-friendship7-synth.dsp    # LV2 plugin
//   faust2vst  ma6-friendship7-synth.dsp    # VST plugin
//
// Parameters:
//   - Phase (0-1): manual control of the 90-second timeline
//   - Auto: toggle automatic phase progression
//   - Intensity: overall volume/intensity
//   - Orbit Select (1-3): focus on specific orbit character
//
// Install FAUST: https://faust.grame.fr/downloads/

declare name      "Friendship 7 — Three Orbits";
declare author    "Tibsfox NASA Mission Series";
declare copyright "(c) 2026 Tibsfox";
declare version   "1.21";
declare license   "MIT";

import("stdfaust.lib");

// --- Parameters ---
phase = hslider("[0]Phase", 0, 0, 1, 0.001) : si.smoo;
auto_mode = checkbox("[1]Auto (90s cycle)");
intensity = hslider("[2]Intensity", 0.7, 0, 1, 0.01) : si.smoo;
orbit_select = hslider("[3]Orbit Select", 1, 1, 3, 1);

// Auto-advancing phase (90-second cycle)
auto_phase = os.phasor(1, 1.0/90.0);
active_phase = select2(auto_mode, phase, auto_phase);

// --- Timeline ---
// Phase 0.000 - 0.035: Countdown + Atlas ignition (0-3.15s)
// Phase 0.035 - 0.100: Liftoff + Atlas ascent (3.15-9s)
// Phase 0.100 - 0.140: Max-q (9-12.6s)
// Phase 0.140 - 0.175: BECO — booster skirt jettison (12.6-15.75s)
// Phase 0.175 - 0.210: SECO + orbital insertion (15.75-18.9s)
// Phase 0.210 - 0.410: Orbit 1 — first time (18.9-36.9s)
// Phase 0.410 - 0.610: Orbit 2 — fireflies discovered (36.9-54.9s)
// Phase 0.610 - 0.750: Orbit 3 — Segment 51 alarm (54.9-67.5s)
// Phase 0.750 - 0.800: Retrofire (67.5-72s)
// Phase 0.800 - 0.870: Reentry + retropack breakup (72-78.3s)
// Phase 0.870 - 0.920: Plasma blackout — silence (78.3-82.8s)
// Phase 0.920 - 0.950: Drogue + main chute (82.8-85.5s)
// Phase 0.950 - 1.000: Splashdown + recovery (85.5-90s)

// Smooth step helper
smoothstep(edge0, edge1, x) = t * t * (3.0 - 2.0 * t)
with {
  t = max(0.0, min(1.0, (x - edge0) / (edge1 - edge0)));
};

// Mod helper for phase-local cycling
mod(x, m) = x - floor(x / m) * m;


// ==========================================================
// LAUNCH — Atlas LV-3B
// ==========================================================

// --- Countdown Beeps ---
// T-10 through T-0. Scott Carpenter's "Godspeed, John Glenn"
// lives in the silence between the last beep and ignition.
countdown = os.osc(1000) * cd_env * 0.10
          + os.osc(880) * cd_env2 * 0.04
with {
  cd_pulse = ba.if(active_phase < 0.035,
               ba.if(mod(active_phase * 90.0, 1.0) < 0.06, 1.0, 0.0),
               0.0);
  cd_env = cd_pulse * (1.0 - smoothstep(0.02, 0.035, active_phase));
  // Lower undertone — the weight of the moment
  cd_env2 = cd_pulse * smoothstep(0.01, 0.025, active_phase)
          * (1.0 - smoothstep(0.025, 0.035, active_phase));
};

// --- Atlas LV-3B Ignition ---
// The Atlas was different from the Redstone — a stage-and-a-half
// design with all engines firing at launch: two booster engines
// (LR-89), one sustainer engine (LR-105), and two vernier engines.
// Total thrust: 367,000 lbf. Much louder, deeper, more complex
// harmonic structure than the single-engine Redstone.
// The thin-wall "balloon tank" Atlas vibrated like a tuning fork.
atlas_ignition = (no.pink_noise * ign_env
                : fi.resonlp(100 + active_phase * 2000, 1.6, 1.0)
                : fi.resonhp(20, 1.5, 1.0))
              + (os.sawtooth(ign_fund) * ign_env * 0.12
                : fi.resonlp(500, 2, 1.0))
              + (os.sawtooth(ign_fund * 1.498) * ign_env * 0.08
                : fi.resonlp(400, 2.5, 1.0))
              + (os.osc(ign_fund * 2.0) * ign_env * 0.05
                : fi.resonlp(350, 3, 1.0))
              + (no.noise * ign_env * 0.04
                : fi.resonbp(3200, 3, 1.0))
with {
  // Atlas fundamental: deeper than Redstone, more engines = richer
  ign_fund = ba.if(active_phase < 0.06,
               38 + (active_phase - 0.035) / 0.025 * 22,  // 38->60 Hz ramp
             ba.if(active_phase < 0.14,
               60 + (active_phase - 0.06) / 0.08 * 40,    // 60->100 Hz climb
               100));
  ign_env = ba.if(active_phase < 0.02,
              0.0,
            ba.if(active_phase < 0.035,
              (active_phase - 0.02) / 0.015 * 0.15,      // Pre-ignition rumble
            ba.if(active_phase < 0.05,
              0.15 + (active_phase - 0.035) / 0.015 * 0.85, // Full power
            ba.if(active_phase < 0.14,
              1.0,                                         // Sustained thrust
            ba.if(active_phase < 0.175,
              1.0 - (active_phase - 0.14) / 0.035 * 0.35, // BECO — boosters drop
            ba.if(active_phase < 0.21,
              0.65 - (active_phase - 0.175) / 0.035 * 0.65, // SECO — sustainer off
              0.0))))));
};

// --- Max-Q Buffeting ---
// Atlas max-q was more severe than Redstone — heavier vehicle,
// faster through the atmosphere. The thin balloon tank transmitted
// every vibration directly to the capsule.
maxq_buffet = (no.noise * buffet_env * 0.22
             : fi.resonbp(340, 3, 1.0)
             : *(1.0 + 0.55 * os.osc(32.0)))
            + (no.noise * buffet_env * 0.12
             : fi.resonbp(680, 4, 1.0)
             : *(1.0 + 0.3 * os.osc(64.0)))
with {
  buffet_env = ba.if(active_phase > 0.10 & active_phase < 0.14,
                 ba.if(active_phase < 0.115,
                   (active_phase - 0.10) / 0.015,
                 ba.if(active_phase < 0.13,
                   1.0,
                   max(0.0, (0.14 - active_phase) / 0.01))),
                 0.0)
             * 0.5;
};

// --- BECO — Booster Engine Cutoff + Skirt Jettison ---
// Unlike a clean stage separation, the Atlas dropped its booster
// skirt — two engines and the connecting ring falling away while
// the sustainer kept burning. A metallic clang followed by a
// change in vibration character.
beco = (no.noise * beco_env : fi.resonlp(5000, 0.5, 1.0)) * 0.65
     + (no.noise * beco_ring * 0.30 : fi.resonbp(900, 5, 1.0))
     + (os.osc(140) * beco_ring * 0.15 : fi.resonlp(400, 3, 1.0))
with {
  beco_env = ba.if(active_phase > 0.14 & active_phase < 0.16,
               exp(-(active_phase - 0.14) * 60.0),
               0.0);
  // Metallic ringing — skirt frame vibrating as it separates
  beco_ring = ba.if(active_phase > 0.142 & active_phase < 0.17,
                exp(-(active_phase - 0.142) * 25.0) * 0.5,
                0.0);
};

// --- SECO + Orbital Insertion ---
// Sustainer engine cutoff — sudden silence after minutes of thrust.
// A sharp clunk, then the profound quiet of orbit.
seco = (no.noise * seco_env : fi.resonlp(3500, 0.8, 1.0)) * 0.40
     + (os.osc(200) * seco_env * 0.10)
with {
  seco_env = ba.if(active_phase > 0.175 & active_phase < 0.195,
               exp(-(active_phase - 0.175) * 50.0),
               0.0);
};

// Posigrade rockets — small solid rockets that pushed the capsule
// away from the spent Atlas. Three quick pops.
posigrade = no.noise * posi_env * 0.20
          : fi.resonbp(2800, 3, 1.0)
with {
  posi_rate = ba.if(active_phase > 0.195 & active_phase < 0.21, 4.0, 0.0);
  posi_trigger = ba.if(posi_rate > 0.0,
                   ba.if(mod(active_phase * 90.0 * posi_rate, 1.0) < 0.05, 1.0, 0.0),
                   0.0);
  posi_env = posi_trigger
           * ba.if(active_phase > 0.195 & active_phase < 0.21, 1.0, 0.0);
};


// ==========================================================
// ORBITAL FLIGHT — THREE ORBITS
// ==========================================================
//
// Each orbit has three zones:
//   Daylight: high-frequency shimmer, Earth-glow, systems hum
//   Night: darkness, "fireflies" at orbital dawn
//   Dawn crossing: frequency sweep as sun rises
//
// Orbit 1 (0.21-0.41): wonder, first sunrise, first night
// Orbit 2 (0.41-0.61): fireflies discovered, the famous observation
// Orbit 3 (0.61-0.75): Segment 51 alarm, tension building

// --- Orbital position within current orbit ---
orbit_start = ba.if(active_phase < 0.41, 0.21,
              ba.if(active_phase < 0.61, 0.41,
                0.61));
orbit_end = ba.if(active_phase < 0.41, 0.41,
            ba.if(active_phase < 0.61, 0.61,
              0.75));
orbit_dur = orbit_end - orbit_start;
orbit_local = ba.if(active_phase > orbit_start & active_phase < orbit_end,
                (active_phase - orbit_start) / orbit_dur,
                0.0);
in_orbit = ba.if(active_phase > 0.21 & active_phase < 0.75, 1.0, 0.0);

// Current orbit number (1, 2, or 3)
current_orbit = ba.if(active_phase < 0.41, 1.0,
                ba.if(active_phase < 0.61, 2.0,
                  3.0));

// Day/night cycle within orbit: 0.0-0.55 = day, 0.55-0.90 = night, 0.90-1.0 = dawn
is_day = ba.if(orbit_local < 0.55, 1.0, 0.0) * in_orbit;
is_night = ba.if(orbit_local > 0.55 & orbit_local < 0.90, 1.0, 0.0) * in_orbit;
is_dawn = ba.if(orbit_local > 0.90, 1.0, 0.0) * in_orbit;

// --- Spacecraft Systems Hum ---
// The constant companion — environmental control, fans, pumps.
// Always present in orbit, a quiet electrical presence.
systems_hum = (os.osc(s1) * 0.020 + os.osc(s2) * 0.012
             + os.osc(s3) * 0.008 + os.osc(s4) * 0.005)
            * systems_env
            : fi.resonlp(2500, 1, 1.0)
with {
  s1 = 290 + 8 * os.osc(0.04);
  s2 = 435 + 6 * os.osc(0.07);
  s3 = 580 + 10 * os.osc(0.03);
  s4 = 725 + 5 * os.osc(0.05);
  systems_env = ba.if(active_phase > 0.21 & active_phase < 0.75,
                  ba.if(active_phase < 0.24,
                    (active_phase - 0.21) / 0.03,
                  ba.if(active_phase < 0.72,
                    1.0,
                    max(0.0, (0.75 - active_phase) / 0.03))),
                  0.0);
};

// --- Daylight Shimmer ---
// High-frequency sine clusters representing sunlight on the
// capsule window — Earth's blue curve below, the black sky above.
// Gentle AM modulation at a rate suggesting orbital velocity.
daylight_shimmer = (os.osc(f1) * 0.015
                  + os.osc(f2) * 0.012
                  + os.osc(f3) * 0.009
                  + os.osc(f4) * 0.006)
                 * day_env * am_mod
                 : fi.resonlp(9000, 1, 1.0)
with {
  f1 = 4200 + 200 * os.osc(0.11);
  f2 = 5400 + 150 * os.osc(0.08);
  f3 = 6300 + 180 * os.osc(0.13);
  f4 = 7500 + 120 * os.osc(0.06);
  // AM at orbital frequency (~0.011 Hz for 88.5 min orbit, compressed)
  am_mod = 0.7 + 0.3 * os.osc(0.19);
  day_env = is_day * smoothstep(0.0, 0.08, orbit_local)
          * (1.0 - smoothstep(0.48, 0.55, orbit_local));
};

// --- Night Side ---
// Darkness. The hum persists but the shimmer fades.
// A low, mysterious drone replaces the daylight brightness —
// the void of space pressing in.
night_drone = (os.osc(n1) * 0.015 + os.osc(n2) * 0.010)
            * night_env
            : fi.resonlp(600, 2, 1.0)
with {
  n1 = 85 + 15 * os.osc(0.025);
  n2 = 128 + 10 * os.osc(0.035);
  night_env = is_night * smoothstep(0.55, 0.62, orbit_local)
            * (1.0 - smoothstep(0.85, 0.90, orbit_local));
};

// --- Fireflies ---
// Glenn's luminescent particles — ice crystals from the heat
// exchanger that drifted past the window at each orbital dawn.
// "They were brilliantly lit... like looking into a field of
// fireflies on a summer night."
//
// FM synthesis: sparse, high-frequency tinkling. Each "firefly"
// is a brief FM burst with high partials, triggered randomly
// at 2-5 Hz. More prominent on Orbit 2 (when Glenn first saw
// them) and Orbit 3.
firefly = (os.osc(ff_carrier + ff_mod_sig) * ff_env * 0.035
         + os.osc(ff_carrier * 1.5 + ff_mod_sig * 0.7) * ff_env * 0.020
         + os.osc(ff_carrier * 2.3 + ff_mod_sig * 0.4) * ff_env * 0.012)
        * ff_orbit_weight
        : fi.resonbp(ff_carrier, 3, 1.0)
with {
  // Firefly carrier: high, crystalline
  ff_carrier = 3800 + 1200 * os.osc(0.23);
  // FM modulator creates the "twinkling" quality
  ff_mod_freq = 120 + 80 * os.osc(0.17);
  ff_mod_depth = 800;
  ff_mod_sig = os.osc(ff_mod_freq) * ff_mod_depth;
  // Sparse trigger — random-ish via slow phasors
  ff_trigger_rate = 3.0;
  ff_phase_local = mod(active_phase * 90.0 * ff_trigger_rate, 1.0);
  ff_on = ba.if(ff_phase_local < 0.06, 1.0, 0.0);
  // Each firefly note: very brief (30-60ms), sharp attack
  ff_env = ff_on
         * ba.if(is_night > 0.5 | is_dawn > 0.5, 1.0, 0.0)
         * in_orbit;
  // Fireflies more prominent in orbits 2 and 3
  ff_orbit_weight = ba.if(current_orbit < 1.5, 0.3,
                    ba.if(current_orbit < 2.5, 1.0,
                      0.8));
};

// --- Dawn Crossing ---
// Frequency sweep from low to high as the sun rises over Earth's
// limb. A breathtaking moment — the thin blue line of atmosphere
// igniting with color. Each dawn is slightly different.
dawn_sweep = os.osc(dawn_freq) * dawn_env * 0.025
           + os.osc(dawn_freq * 2.01) * dawn_env * 0.012
           + os.osc(dawn_freq * 3.0) * dawn_env * 0.006
           : fi.resonlp(dawn_freq * 4.0, 1.5, 1.0)
with {
  dawn_progress = ba.if(orbit_local > 0.90,
                    (orbit_local - 0.90) / 0.10,
                    0.0);
  // Sweep from 200 Hz to 4000 Hz
  dawn_freq = ba.if(is_dawn > 0.5,
                200 + dawn_progress * dawn_progress * 3800,
                200);
  dawn_env = is_dawn * smoothstep(0.90, 0.92, orbit_local);
};

// --- Thruster Pops ---
// Attitude control jets firing to maintain orbital orientation.
// Brief hisses of hydrogen peroxide thrusters.
orbital_thrusters = no.noise * thruster_env * 0.18
                  : fi.resonbp(2800, 4, 1.0)
with {
  thruster_rate = ba.if(in_orbit > 0.5, 1.5, 0.0);
  thruster_trigger = ba.if(thruster_rate > 0.0,
                       ba.if(mod(active_phase * 90.0 * thruster_rate, 1.0) < 0.03,
                         1.0, 0.0),
                       0.0);
  thruster_env = thruster_trigger * in_orbit;
};

// --- Segment 51 Warning ---
// On orbit 3, telemetry showed the heat shield might be loose.
// An ominous low tone representing the alarm, building tension.
segment51 = os.osc(seg_freq) * seg_env * 0.06
          + os.sawtooth(seg_freq * 0.5) * seg_env * 0.03
          : fi.resonlp(500, 2, 1.0)
with {
  seg_freq = 110 + 30 * os.osc(0.5);  // Pulsing, ominous
  seg_env = ba.if(active_phase > 0.68 & active_phase < 0.75,
              ba.if(active_phase < 0.70,
                (active_phase - 0.68) / 0.02,
              ba.if(active_phase < 0.73,
                1.0,
                max(0.0, (0.75 - active_phase) / 0.02))),
              0.0);
};


// ==========================================================
// RETROFIRE + REENTRY
// ==========================================================

// --- Retrofire ---
// Three retrorockets firing in sequence. Each a solid-fuel burn
// lasting ~10 seconds. Glenn felt each one as a firm push.
// "I felt like I was going back to Hawaii."
retrofire = (os.sawtooth(retro_freq) * retro_env * 0.10
           + no.noise * retro_env * 0.12
           + no.pink_noise * retro_env * 0.07)
          : fi.resonlp(retro_freq * 2.5, 1.5, 1.0)
with {
  retro_freq = 280 + 40 * os.osc(0.8);  // Three pulses
  retro_env = ba.if(active_phase > 0.75 & active_phase < 0.80,
                ba.if(active_phase < 0.765,
                  (active_phase - 0.75) / 0.015,
                ba.if(active_phase < 0.79,
                  0.8 + 0.2 * os.osc(3.0),  // Three pulses modulation
                  max(0.0, (0.80 - active_phase) / 0.01))),
                0.0)
            * 0.7;
};

// --- Reentry + Retropack Breakup ---
// The critical decision: keep the retropack on to strap the
// heat shield in place. During reentry, the pack burned off —
// chunks of flaming metal flying past Glenn's window.
// "That's a real fireball outside."
//
// Building broadband noise, low-frequency rumble, plus high
// crackling as the retropack disintegrates.
reentry = (no.noise * re_env : fi.resonlp(re_freq, 1.5, 1.0))
        + (no.pink_noise * re_env * 0.60 : fi.resonhp(800, 1, 1.0))
        + (os.sawtooth(re_freq * 0.2) * re_env * 0.12)
with {
  re_freq = ba.if(active_phase > 0.80 & active_phase < 0.87,
              600 + (active_phase - 0.80) / 0.07 * 5500,
              600);
  re_env = ba.if(active_phase > 0.80 & active_phase < 0.87,
             ba.if(active_phase < 0.82,
               (active_phase - 0.80) / 0.02,
             ba.if(active_phase < 0.85,
               1.0,
               max(0.0, (0.87 - active_phase) / 0.02))),
             0.0)
         * 0.75;
};

// Retropack breakup — sharp crackling, metal tearing
retropack_debris = (no.noise * debris_env * 0.30
                  : fi.resonbp(4500, 3, 1.0))
                 + (no.noise * debris_env * 0.15
                  : fi.resonbp(7000, 5, 1.0))
with {
  debris_rate = ba.if(active_phase > 0.81 & active_phase < 0.85, 8.0, 0.0);
  debris_trigger = ba.if(debris_rate > 0.0,
                     ba.if(mod(active_phase * 90.0 * debris_rate, 1.0) < 0.08,
                       1.0, 0.0),
                     0.0);
  debris_env = debris_trigger
             * ba.if(active_phase > 0.81 & active_phase < 0.85,
                 1.0 - (active_phase - 0.81) / 0.04 * 0.5,
                 0.0);
};

// Fireball glow — a warm, enveloping low roar as plasma surrounds
// the capsule. Distinct from the sharp reentry noise.
fireball = (no.pink_noise * fire_env * 0.25
          : fi.resonlp(350, 2, 1.0))
         + (os.osc(fire_freq) * fire_env * 0.06
          : fi.resonlp(200, 3, 1.0))
with {
  fire_freq = 65 + 20 * os.osc(0.3);
  fire_env = ba.if(active_phase > 0.82 & active_phase < 0.87,
               ba.if(active_phase < 0.835,
                 (active_phase - 0.82) / 0.015,
               ba.if(active_phase < 0.86,
                 1.0,
                 max(0.0, (0.87 - active_phase) / 0.01))),
               0.0);
};


// ==========================================================
// PLASMA BLACKOUT — THE SILENCE
// ==========================================================
//
// 4.5 minutes of ionization blackout compressed to ~4 seconds.
// No radio contact. Nobody knew if Glenn was alive.
// Near-total silence — just the faintest sub-bass drone of
// plasma surrounding the capsule, felt more than heard.

plasma_silence = os.osc(plasma_freq) * plasma_env * 0.015
               : fi.resonlp(30, 3, 1.0)
with {
  plasma_freq = 15 + 4 * os.osc(0.02);
  plasma_env = ba.if(active_phase > 0.87 & active_phase < 0.92,
                 ba.if(active_phase < 0.88,
                   (active_phase - 0.87) / 0.01,
                 ba.if(active_phase < 0.91,
                   0.8,
                   max(0.0, (0.92 - active_phase) / 0.01))),
                 0.0);
};


// ==========================================================
// RECOVERY — DROGUE, MAIN CHUTE, SPLASHDOWN
// ==========================================================

// --- Drogue Chute ---
drogue_pop = no.noise * drogue_env * 0.35
           : fi.resonbp(2200, 3, 1.0)
with {
  drogue_env = ba.if(active_phase > 0.92 & active_phase < 0.935,
                 exp(-(active_phase - 0.92) * 55.0),
                 0.0);
};

// Wind buffeting on drogue
drogue_wind = no.pink_noise * dwind_env * 0.08
            : fi.resonlp(800, 2, 1.0)
            : *(1.0 + 0.3 * os.osc(0.35))
with {
  dwind_env = ba.if(active_phase > 0.925 & active_phase < 0.94,
                ba.if(active_phase < 0.93,
                  (active_phase - 0.925) / 0.005,
                  max(0.0, (0.94 - active_phase) / 0.005)),
                0.0);
};

// --- Main Chute ---
main_chute_pop = no.noise * main_env * 0.45
               : fi.resonbp(1500, 2.5, 1.0)
with {
  main_env = ba.if(active_phase > 0.94 & active_phase < 0.955,
               exp(-(active_phase - 0.94) * 40.0),
               0.0);
};

// --- Splashdown ---
// Impact with the Atlantic, north of the Turks and Caicos Islands.
// Glenn's capsule hit hard — he was fine.
splashdown = (no.noise * splash_env * 0.50 : fi.resonlp(400, 2, 1.0))
           + (no.pink_noise * splash_env * 0.35 : fi.resonlp(150, 3, 1.0))
with {
  splash_env = ba.if(active_phase > 0.955 & active_phase < 0.98,
                 exp(-(active_phase - 0.955) * 35.0),
                 0.0);
};

// --- Post-Splash ---
// Ocean, bobbing, helicopter approach. The mission is complete.
// "Boy, that was a real fireball."
ocean_settle = no.pink_noise * settle_env * 0.04
             : fi.resonlp(250, 2.5, 1.0)
             : *(1.0 + 0.20 * os.osc(0.15))
with {
  settle_env = ba.if(active_phase > 0.97,
                 min(1.0, (active_phase - 0.97) / 0.01)
                 * (1.0 - smoothstep(0.99, 1.0, active_phase)),
                 0.0);
};


// ==========================================================
// MIX + OUTPUT
// ==========================================================

// All components summed
dry_signal = countdown
           + atlas_ignition + maxq_buffet + beco + seco + posigrade
           + systems_hum + daylight_shimmer + night_drone + firefly
           + dawn_sweep + orbital_thrusters + segment51
           + retrofire + reentry + retropack_debris + fireball
           + plasma_silence
           + drogue_pop + drogue_wind + main_chute_pop
           + splashdown + ocean_settle;

process = dry_signal
        * intensity
        : fi.dcblocker
        <: _,_;  // Stereo output
