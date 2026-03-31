// Mercury-Atlas 7 -- Aurora 7 Orbital Sonification Synthesizer
// FAUST DSP source -- compiles to VST, AU, LV2, JACK, CLI
//
// Mission 1.22: Mercury-Atlas 7 (MA-7) -- Aurora 7
// Scott Carpenter: second American to orbit Earth, May 24, 1962.
// Three orbits in 4 hours 56 minutes 5 seconds.
//
// The mission of the scientist-astronaut. Where Glenn's flight
// proved the hardware, Carpenter's was supposed to prove the
// science -- but the flight became famous for what went wrong.
//
// Carpenter was endlessly curious, constantly distracted by the
// view, by the fireflies (he tapped the capsule wall and
// released a cloud of them -- confirming they were frost from
// the heat exchanger), by the experiments. He burned through
// fuel at an alarming rate. By the third orbit, he was down
// to 15% manual fuel and had to rely on fly-by-wire and the
// automatic stabilization system.
//
// The synthesis maps these dynamics directly:
//
// FUEL AS FILTER: The lowpass cutoff frequency tracks fuel level.
// At 100% (launch), the sound is bright and open. As Carpenter
// burns through fuel with each thruster firing and distraction,
// the cutoff drops. By orbit 3, the sound is dark, muffled --
// the audible consequence of inattention to consumables.
//
// ALTITUDE AS PITCH: Mercury orbit was not perfectly circular.
// The 161-267 km altitude band creates a subtle pitch modulation
// on the orbital drone -- higher altitude = higher pitch.
//
// HEART RATE AS RHYTHM: Carpenter's heart rate varied throughout
// the mission -- calm during experiments, elevated during crises.
// This maps to a rhythmic pulse that quickens and slows.
//
// THE FIREFLY MOMENT: Carpenter's key discovery. He tapped the
// capsule wall and a cloud of luminous particles erupted. This
// is rendered as a burst of high-frequency FM particles triggered
// by a sharp transient -- the "tap."
//
// RETROFIRE: Three retrorocket burns, but Carpenter's were late
// and off-axis. The capsule was yawing during retrofire, adding
// pitch wobble to the retro sound.
//
// REENTRY: The overshoot. Carpenter landed 460 km (250 nautical
// miles) beyond the target. For 40 minutes, NASA didn't know
// if he was alive. Walter Cronkite nearly reported him dead on
// national television.
//
// "I think I see the capsule!" -- Navy P2V aircraft, after
// the longest 40 minutes in mission control history.
//
// Build:
//   faust2jaqt ma7-aurora7-synth.dsp    # JACK/Qt standalone
//   faust2lv2  ma7-aurora7-synth.dsp    # LV2 plugin
//   faust2vst  ma7-aurora7-synth.dsp    # VST plugin
//
// Parameters:
//   - Phase (0-1): manual control of the mission timeline
//   - Auto: toggle automatic phase progression (120-second cycle)
//   - Fuel Level: real-time fuel override (normally auto-tracked)
//   - Intensity: overall volume/intensity
//
// Install FAUST: https://faust.grame.fr/downloads/

declare name      "Aurora 7 -- Fuel and Fireflies";
declare author    "Tibsfox NASA Mission Series";
declare copyright "(c) 2026 Tibsfox";
declare version   "1.22";
declare license   "MIT";

import("stdfaust.lib");

// --- Parameters ---
phase = hslider("[0]Phase", 0, 0, 1, 0.001) : si.smoo;
auto_mode = checkbox("[1]Auto (120s cycle)");
fuel_override = hslider("[2]Fuel Level", 1.0, 0, 1, 0.01) : si.smoo;
intensity = hslider("[3]Intensity", 0.7, 0, 1, 0.01) : si.smoo;

// Auto-advancing phase (120-second cycle -- longer than Friendship 7
// to accommodate the more complex mission narrative)
auto_phase = os.phasor(1, 1.0 / 120.0);
active_phase = select2(auto_mode, phase, auto_phase);

// --- Timeline ---
// Phase 0.000 - 0.030: Countdown + Atlas ignition
// Phase 0.030 - 0.090: Liftoff + ascent
// Phase 0.090 - 0.120: Max-q
// Phase 0.120 - 0.150: BECO (booster skirt jettison)
// Phase 0.150 - 0.185: SECO + orbital insertion
// Phase 0.185 - 0.370: Orbit 1 -- wonder, experiments, fuel burn begins
// Phase 0.370 - 0.555: Orbit 2 -- firefly tap, heavy fuel consumption
// Phase 0.555 - 0.700: Orbit 3 -- fuel crisis, dark sound
// Phase 0.700 - 0.750: Retrofire (late, off-axis, yawing)
// Phase 0.750 - 0.830: Reentry (steep, overshoot trajectory)
// Phase 0.830 - 0.880: Plasma blackout
// Phase 0.880 - 0.920: Drogue + main chute
// Phase 0.920 - 0.960: Splashdown (250 nm long)
// Phase 0.960 - 1.000: Ocean wait -- 40 minutes of silence

// Smooth step helper
smoothstep(edge0, edge1, x) = t * t * (3.0 - 2.0 * t)
with {
  t = max(0.0, min(1.0, (x - edge0) / (edge1 - edge0)));
};

// Mod helper
mod(x, m) = x - floor(x / m) * m;


// ==========================================================
// FUEL LEVEL TRACKING
// ==========================================================
//
// Carpenter's fuel consumption was the story of the mission.
// He launched with 100% and the rate of decrease accelerated:
//   Orbit 1 end: ~65% (normal-ish, but too many thruster pops)
//   Orbit 2 end: ~35% (the firefly distraction cost dearly)
//   Orbit 3 start: ~30% (ground control alarmed)
//   Retrofire: ~15% (barely enough)
//
// This curve maps phase to fuel level. The fuel_override
// parameter lets users manually set fuel for experimentation.

fuel_auto = ba.if(active_phase < 0.185, 1.0,
            ba.if(active_phase < 0.370,
              1.0 - (active_phase - 0.185) / 0.185 * 0.35,
            ba.if(active_phase < 0.555,
              0.65 - (active_phase - 0.370) / 0.185 * 0.30,
            ba.if(active_phase < 0.700,
              0.35 - (active_phase - 0.555) / 0.145 * 0.17,
              0.15))));

// Use auto fuel tracking in auto mode, override otherwise
fuel = select2(auto_mode, fuel_override, fuel_auto);

// --- Fuel-Dependent Filter ---
// THE core sonic metaphor: as fuel drops, the world gets darker.
// Cutoff sweeps from 8000 Hz (full fuel) to 800 Hz (nearly empty).
// Q increases slightly as fuel drops, adding resonance -- the
// sound becoming more strained, more desperate.
fuel_cutoff = 800 + fuel * fuel * 7200;  // Quadratic curve -- drops fast at the end
fuel_q = 1.0 + (1.0 - fuel) * 1.5;      // Q rises as fuel drops


// ==========================================================
// ALTITUDE OSCILLATION
// ==========================================================
//
// Mercury orbit was elliptical: perigee ~161 km, apogee ~267 km.
// Period ~88.5 minutes. This creates a slow pitch modulation
// on the orbital drone. The altitude cycles once per orbit.

orbit_start = ba.if(active_phase < 0.370, 0.185,
              ba.if(active_phase < 0.555, 0.370,
                0.555));
orbit_end = ba.if(active_phase < 0.370, 0.370,
            ba.if(active_phase < 0.555, 0.555,
              0.700));
orbit_dur = orbit_end - orbit_start;
orbit_local = ba.if(active_phase > orbit_start & active_phase < orbit_end,
                (active_phase - orbit_start) / orbit_dur,
                0.0);
in_orbit = ba.if(active_phase > 0.185 & active_phase < 0.700, 1.0, 0.0);

// Altitude: sinusoidal oscillation between 161 and 267 km
// Normalized to 0-1 range for pitch modulation
altitude_norm = 0.5 + 0.5 * sin(orbit_local * 2.0 * ma.PI);

// Pitch modulation from altitude: +/- 30 Hz around base drone
altitude_pitch_mod = (altitude_norm - 0.5) * 60.0;


// ==========================================================
// HEART RATE RHYTHM
// ==========================================================
//
// Carpenter's heart rate: ~80 bpm at rest, rising to ~130 bpm
// during high-workload periods (experiments, crises).
// Maps to a subtle rhythmic pulse in the mix.

heart_rate_bpm = ba.if(active_phase < 0.185, 90,     // Launch: elevated
                 ba.if(active_phase < 0.370, 85,     // Orbit 1: calm, curious
                 ba.if(active_phase < 0.460, 100,    // Orbit 2 start: experiments
                 ba.if(active_phase < 0.520, 120,    // Firefly excitement
                 ba.if(active_phase < 0.600, 105,    // Post-firefly
                 ba.if(active_phase < 0.700, 130,    // Orbit 3: fuel crisis
                 ba.if(active_phase < 0.750, 140,    // Retrofire: peak stress
                 ba.if(active_phase < 0.880, 135,    // Reentry
                 ba.if(active_phase < 0.960, 95,     // Chute: relief
                   80)))))))));                        // Ocean: calm

heart_rate_hz = heart_rate_bpm / 60.0;
heart_pulse_phase = os.phasor(1, heart_rate_hz);

// Pulse shape: sharp attack, exponential decay (like a heartbeat)
heart_pulse = ba.if(heart_pulse_phase < 0.08,
                heart_pulse_phase / 0.08,
              ba.if(heart_pulse_phase < 0.15,
                1.0 - (heart_pulse_phase - 0.08) / 0.07 * 0.4,
              ba.if(heart_pulse_phase < 0.25,
                0.6 * (1.0 - (heart_pulse_phase - 0.15) / 0.10),
                0.0)));

// Heart rate as amplitude modulation on a low sub-bass
heart_sound = os.osc(45) * heart_pulse * 0.025 * in_orbit
            : fi.resonlp(120, 2, 1.0);


// ==========================================================
// LAUNCH -- ATLAS LV-3B (same vehicle as Friendship 7)
// ==========================================================

// --- Countdown Beeps ---
countdown = os.osc(1000) * cd_env * 0.10
          + os.osc(880) * cd_env2 * 0.04
with {
  cd_pulse = ba.if(active_phase < 0.030,
               ba.if(mod(active_phase * 120.0, 1.0) < 0.05, 1.0, 0.0),
               0.0);
  cd_env = cd_pulse * (1.0 - smoothstep(0.02, 0.030, active_phase));
  cd_env2 = cd_pulse * smoothstep(0.01, 0.020, active_phase)
          * (1.0 - smoothstep(0.020, 0.030, active_phase));
};

// --- Atlas Ignition ---
// Same Atlas LV-3B as MA-6. 367,000 lbf total thrust.
atlas_ignition = (no.pink_noise * ign_env
                : fi.resonlp(100 + active_phase * 2000, 1.6, 1.0)
                : fi.resonhp(20, 1.5, 1.0))
              + (os.sawtooth(ign_fund) * ign_env * 0.12
                : fi.resonlp(500, 2, 1.0))
              + (os.sawtooth(ign_fund * 1.498) * ign_env * 0.08
                : fi.resonlp(400, 2.5, 1.0))
              + (no.noise * ign_env * 0.04
                : fi.resonbp(3200, 3, 1.0))
with {
  ign_fund = ba.if(active_phase < 0.05,
               38 + (active_phase - 0.030) / 0.020 * 22,
             ba.if(active_phase < 0.12,
               60 + (active_phase - 0.05) / 0.07 * 40,
               100));
  ign_env = ba.if(active_phase < 0.015,
              0.0,
            ba.if(active_phase < 0.030,
              (active_phase - 0.015) / 0.015 * 0.15,
            ba.if(active_phase < 0.045,
              0.15 + (active_phase - 0.030) / 0.015 * 0.85,
            ba.if(active_phase < 0.12,
              1.0,
            ba.if(active_phase < 0.15,
              1.0 - (active_phase - 0.12) / 0.03 * 0.35,
            ba.if(active_phase < 0.185,
              0.65 - (active_phase - 0.15) / 0.035 * 0.65,
              0.0))))));
};

// --- Max-Q Buffeting ---
maxq_buffet = (no.noise * buffet_env * 0.22
             : fi.resonbp(340, 3, 1.0)
             : *(1.0 + 0.55 * os.osc(32.0)))
            + (no.noise * buffet_env * 0.12
             : fi.resonbp(680, 4, 1.0)
             : *(1.0 + 0.3 * os.osc(64.0)))
with {
  buffet_env = ba.if(active_phase > 0.09 & active_phase < 0.12,
                 ba.if(active_phase < 0.10,
                   (active_phase - 0.09) / 0.01,
                 ba.if(active_phase < 0.115,
                   1.0,
                   max(0.0, (0.12 - active_phase) / 0.005))),
                 0.0) * 0.5;
};

// --- BECO ---
beco = (no.noise * beco_env : fi.resonlp(5000, 0.5, 1.0)) * 0.65
     + (no.noise * beco_ring * 0.30 : fi.resonbp(900, 5, 1.0))
with {
  beco_env = ba.if(active_phase > 0.12 & active_phase < 0.14,
               exp(-(active_phase - 0.12) * 60.0),
               0.0);
  beco_ring = ba.if(active_phase > 0.122 & active_phase < 0.15,
                exp(-(active_phase - 0.122) * 25.0) * 0.5,
                0.0);
};

// --- SECO + Orbital Insertion ---
seco = (no.noise * seco_env : fi.resonlp(3500, 0.8, 1.0)) * 0.40
     + (os.osc(200) * seco_env * 0.10)
with {
  seco_env = ba.if(active_phase > 0.15 & active_phase < 0.17,
               exp(-(active_phase - 0.15) * 50.0),
               0.0);
};

// Posigrade rockets
posigrade = no.noise * posi_env * 0.20
          : fi.resonbp(2800, 3, 1.0)
with {
  posi_rate = ba.if(active_phase > 0.17 & active_phase < 0.185, 4.0, 0.0);
  posi_trigger = ba.if(posi_rate > 0.0,
                   ba.if(mod(active_phase * 120.0 * posi_rate, 1.0) < 0.04,
                     1.0, 0.0),
                   0.0);
  posi_env = posi_trigger
           * ba.if(active_phase > 0.17 & active_phase < 0.185, 1.0, 0.0);
};


// ==========================================================
// ORBITAL FLIGHT -- THREE ORBITS
// ==========================================================
//
// The sonic character evolves dramatically across orbits due
// to fuel depletion driving the master filter down.
//
// Orbit 1 (0.185-0.370): bright, curious, open. Carpenter is
//   conducting experiments, taking photographs, marveling at
//   the view. Fuel consumption is slightly high but not alarming.
//
// Orbit 2 (0.370-0.555): the firefly orbit. Carpenter discovers
//   he can create fireflies by tapping the capsule wall. He
//   spends too much time on this. Ground control starts to worry
//   about fuel. The sound is noticeably darker.
//
// Orbit 3 (0.555-0.700): crisis. Fuel is critically low. The
//   sound is muffled, constrained. Tension builds. Carpenter
//   must align for retrofire with minimal fuel remaining.

// Day/night cycle within each orbit
is_day = ba.if(orbit_local < 0.55, 1.0, 0.0) * in_orbit;
is_night = ba.if(orbit_local > 0.55 & orbit_local < 0.90, 1.0, 0.0) * in_orbit;
is_dawn = ba.if(orbit_local > 0.90, 1.0, 0.0) * in_orbit;

// Current orbit number
current_orbit = ba.if(active_phase < 0.370, 1.0,
                ba.if(active_phase < 0.555, 2.0,
                  3.0));

// --- Orbital Drone ---
// Base frequency modulated by altitude. The drone is the
// constant companion -- the sound of being in orbit, the
// hum of capsule systems, the resonance of the pressure vessel.
orbital_drone = (os.osc(drone_f1) * 0.025
              + os.osc(drone_f2) * 0.015
              + os.osc(drone_f3) * 0.010
              + os.sawtooth(drone_f4) * 0.006)
             * drone_env
with {
  drone_base = 160 + altitude_pitch_mod;
  drone_f1 = drone_base;
  drone_f2 = drone_base * 1.498;    // Fifth-ish
  drone_f3 = drone_base * 2.003;    // Octave
  drone_f4 = drone_base * 0.501;    // Sub-octave
  drone_env = ba.if(active_phase > 0.185 & active_phase < 0.700,
                ba.if(active_phase < 0.215,
                  (active_phase - 0.185) / 0.030,
                ba.if(active_phase < 0.670,
                  1.0,
                  max(0.0, (0.700 - active_phase) / 0.030))),
                0.0);
};

// --- Spacecraft Systems Hum ---
// Environmental control, fans, pumps. Always present in orbit.
systems_hum = (os.osc(s1) * 0.018 + os.osc(s2) * 0.012
             + os.osc(s3) * 0.007 + os.osc(s4) * 0.004)
            * systems_env
with {
  s1 = 290 + 8 * os.osc(0.04);
  s2 = 435 + 6 * os.osc(0.07);
  s3 = 580 + 10 * os.osc(0.03);
  s4 = 725 + 5 * os.osc(0.05);
  systems_env = ba.if(active_phase > 0.185 & active_phase < 0.700,
                  ba.if(active_phase < 0.215,
                    (active_phase - 0.185) / 0.030,
                  ba.if(active_phase < 0.670,
                    1.0,
                    max(0.0, (0.700 - active_phase) / 0.030))),
                  0.0);
};

// --- Daylight Shimmer ---
// Sunlight on the capsule window -- high-frequency sine clusters.
// Brightness diminishes across orbits as fuel filter closes down.
daylight_shimmer = (os.osc(f1) * 0.014
                  + os.osc(f2) * 0.011
                  + os.osc(f3) * 0.008
                  + os.osc(f4) * 0.005)
                 * day_env * am_mod
with {
  f1 = 4200 + 200 * os.osc(0.11);
  f2 = 5400 + 150 * os.osc(0.08);
  f3 = 6300 + 180 * os.osc(0.13);
  f4 = 7500 + 120 * os.osc(0.06);
  am_mod = 0.7 + 0.3 * os.osc(0.19);
  day_env = is_day * smoothstep(0.0, 0.08, orbit_local)
          * (1.0 - smoothstep(0.48, 0.55, orbit_local));
};

// --- Night Side Drone ---
// Darkness presses in. Lower, more mysterious than the day sound.
night_drone = (os.osc(n1) * 0.015 + os.osc(n2) * 0.010)
            * night_env
            : fi.resonlp(500, 2, 1.0)
with {
  n1 = 80 + 15 * os.osc(0.025);
  n2 = 120 + 10 * os.osc(0.035);
  night_env = is_night * smoothstep(0.55, 0.62, orbit_local)
            * (1.0 - smoothstep(0.85, 0.90, orbit_local));
};

// --- Dawn Crossing ---
// Frequency sweep as the sun rises. Each dawn slightly different.
dawn_sweep = os.osc(dawn_freq) * dawn_env * 0.022
           + os.osc(dawn_freq * 2.01) * dawn_env * 0.010
           : fi.resonlp(dawn_freq * 4.0, 1.5, 1.0)
with {
  dawn_progress = ba.if(orbit_local > 0.90,
                    (orbit_local - 0.90) / 0.10,
                    0.0);
  dawn_freq = ba.if(is_dawn > 0.5,
                200 + dawn_progress * dawn_progress * 3800,
                200);
  dawn_env = is_dawn * smoothstep(0.90, 0.92, orbit_local);
};

// --- Thruster Pops ---
// Attitude control jets. On Aurora 7, these fire MORE OFTEN than
// on Friendship 7 because Carpenter was constantly adjusting
// attitude for experiments and photography. The rate increases
// across orbits to represent the fuel burn problem.
orbital_thrusters = no.noise * thruster_env * 0.18
                  : fi.resonbp(2800, 4, 1.0)
with {
  // Thruster rate increases across orbits -- Carpenter's problem
  thruster_base_rate = ba.if(current_orbit < 1.5, 2.0,   // Orbit 1: somewhat busy
                       ba.if(current_orbit < 2.5, 3.5,   // Orbit 2: very busy
                         1.5));                            // Orbit 3: conserving desperately
  thruster_trigger = ba.if(in_orbit > 0.5,
                       ba.if(mod(active_phase * 120.0 * thruster_base_rate, 1.0) < 0.025,
                         1.0, 0.0),
                       0.0);
  thruster_env = thruster_trigger * in_orbit;
};


// ==========================================================
// THE FIREFLY MOMENT
// ==========================================================
//
// This is Carpenter's signature contribution to Mercury lore.
// Glenn saw the fireflies but couldn't explain them. Carpenter,
// the scientist, figured it out: he tapped the capsule wall
// with his hand, and a cloud of luminous particles burst forth
// from the hull. They were ice crystals from the heat exchanger,
// knocked loose by the impact.
//
// "I can rap the hatch and stir off hundreds of them."
//
// Synthesis: A sharp transient (the tap) followed by a burst
// of FM-synthesis particles -- high-frequency, spectrally rich,
// decaying over ~2 seconds. This triggers during Orbit 2,
// centered around the phase where the tap occurred.

// The tap transient -- a sharp knock on the capsule wall
firefly_tap = no.noise * tap_env * 0.50
            : fi.resonbp(1800, 4, 1.0)
with {
  // The tap occurs at approximately phase 0.46 (mid orbit 2)
  tap_env = ba.if(active_phase > 0.458 & active_phase < 0.465,
              exp(-(active_phase - 0.458) * 300.0),
              0.0);
};

// The particle burst -- hundreds of ice crystals catching sunlight
firefly_burst = (os.osc(ff_carrier + ff_mod_sig) * ff_env * 0.030
              + os.osc(ff_carrier * 1.5 + ff_mod_sig * 0.7) * ff_env * 0.018
              + os.osc(ff_carrier * 2.3 + ff_mod_sig * 0.4) * ff_env * 0.012
              + os.osc(ff_carrier * 3.1 + ff_mod_sig * 0.2) * ff_env * 0.006
              + os.osc(ff_carrier * 0.71 + ff_mod_sig * 0.9) * ff_env * 0.015)
             * ff_orbit_gate
with {
  // Multiple carrier frequencies -- a cloud, not a single particle
  ff_carrier = 4200 + 1500 * os.osc(0.31);
  ff_mod_freq = 140 + 100 * os.osc(0.19);
  ff_mod_depth = 1200;
  ff_mod_sig = os.osc(ff_mod_freq) * ff_mod_depth;

  // Burst envelope: sharp attack at the tap, slow decay
  // The main burst at phase 0.46, with lingering particles afterward
  ff_burst_env = ba.if(active_phase > 0.460 & active_phase < 0.510,
                   ba.if(active_phase < 0.465,
                     (active_phase - 0.460) / 0.005,
                   ba.if(active_phase < 0.470,
                     1.0,
                     max(0.0, 1.0 - (active_phase - 0.470) / 0.040))),
                   0.0);

  // Scattered particles before and after -- the natural fireflies
  // that Glenn also saw, present at every orbital dawn
  ff_scatter_rate = 4.0;
  ff_scatter_phase = mod(active_phase * 120.0 * ff_scatter_rate, 1.0);
  ff_scatter_on = ba.if(ff_scatter_phase < 0.05, 1.0, 0.0);
  ff_scatter_env = ff_scatter_on
                 * ba.if(is_night > 0.5 | is_dawn > 0.5, 1.0, 0.0)
                 * in_orbit * 0.3;

  ff_env = ff_burst_env + ff_scatter_env;

  // Gate: fireflies visible in orbits 1-3, but burst only in orbit 2
  ff_orbit_gate = ba.if(in_orbit > 0.5, 1.0, 0.0);
};


// ==========================================================
// RETROFIRE -- LATE AND OFF-AXIS
// ==========================================================
//
// Carpenter's retrofire was 3 seconds late and the capsule was
// yawed 25 degrees off nominal attitude. Each of the three
// retrorockets fired for ~10 seconds, but the yaw meant the
// deceleration vector was wrong -- contributing to the 250 nm
// overshoot.
//
// Synthesis: three percussive retro burns with pitch wobble
// representing the yaw error. A slight frequency modulation
// that the Friendship 7 retrofire didn't have.

retrofire = (os.sawtooth(retro_freq) * retro_env * 0.10
           + no.noise * retro_env * 0.12
           + no.pink_noise * retro_env * 0.07)
          : fi.resonlp(retro_freq * 2.5, 1.5, 1.0)
with {
  // Yaw wobble -- the capsule was off-axis, adding pitch instability
  yaw_wobble = 25.0 * os.osc(1.2);
  retro_freq = 280 + 40 * os.osc(0.8) + yaw_wobble;

  // Three distinct retro burns as amplitude pulses
  retro_local = ba.if(active_phase > 0.700 & active_phase < 0.750,
                  (active_phase - 0.700) / 0.050,
                  0.0);
  // Three pulses at approximately 0.33, 0.50, 0.67 of retro phase
  retro_pulse = ba.if(retro_local > 0.10 & retro_local < 0.30, 1.0,
                ba.if(retro_local > 0.40 & retro_local < 0.60, 1.0,
                ba.if(retro_local > 0.70 & retro_local < 0.90, 1.0,
                  0.0)));

  retro_env = ba.if(active_phase > 0.700 & active_phase < 0.750,
                retro_pulse * 0.7
                + 0.3 * (1.0 - retro_local),  // Overall decay
                0.0);
};

// Retro clunks -- the physical jolt of each retro ignition
retro_clunk = (no.noise * clunk_env : fi.resonbp(600, 3, 1.0)) * 0.35
with {
  retro_local2 = ba.if(active_phase > 0.700 & active_phase < 0.750,
                   (active_phase - 0.700) / 0.050,
                   0.0);
  clunk1 = ba.if(retro_local2 > 0.10 & retro_local2 < 0.13,
             exp(-(retro_local2 - 0.10) * 120.0), 0.0);
  clunk2 = ba.if(retro_local2 > 0.40 & retro_local2 < 0.43,
             exp(-(retro_local2 - 0.40) * 120.0), 0.0);
  clunk3 = ba.if(retro_local2 > 0.70 & retro_local2 < 0.73,
             exp(-(retro_local2 - 0.70) * 120.0), 0.0);
  clunk_env = (clunk1 + clunk2 + clunk3)
            * ba.if(active_phase > 0.700 & active_phase < 0.750, 1.0, 0.0);
};


// ==========================================================
// REENTRY -- THE OVERSHOOT
// ==========================================================
//
// Due to the late, off-axis retrofire and attitude errors,
// Aurora 7 entered the atmosphere on a shallower trajectory
// than planned. The capsule overshot the landing target by
// 250 nautical miles. The reentry was longer and less steep
// than Glenn's -- a longer, more drawn-out fireball.

reentry = (no.noise * re_env : fi.resonlp(re_freq, 1.5, 1.0))
        + (no.pink_noise * re_env * 0.55 : fi.resonhp(900, 1, 1.0))
        + (os.sawtooth(re_freq * 0.2) * re_env * 0.10)
with {
  // Frequency sweep -- broader and longer than Friendship 7
  // because the shallower angle meant a longer heating pulse
  re_freq = ba.if(active_phase > 0.750 & active_phase < 0.830,
              500 + (active_phase - 0.750) / 0.080 * 6000,
              500);
  re_env = ba.if(active_phase > 0.750 & active_phase < 0.830,
             ba.if(active_phase < 0.770,
               (active_phase - 0.750) / 0.020,
             ba.if(active_phase < 0.810,
               1.0,
               max(0.0, (0.830 - active_phase) / 0.020))),
             0.0)
         * 0.70;
};

// Fireball glow -- the plasma sheath
fireball = (no.pink_noise * fire_env * 0.22
          : fi.resonlp(300, 2, 1.0))
         + (os.osc(fire_freq) * fire_env * 0.05
          : fi.resonlp(180, 3, 1.0))
with {
  fire_freq = 60 + 18 * os.osc(0.3);
  fire_env = ba.if(active_phase > 0.770 & active_phase < 0.830,
               ba.if(active_phase < 0.785,
                 (active_phase - 0.770) / 0.015,
               ba.if(active_phase < 0.820,
                 1.0,
                 max(0.0, (0.830 - active_phase) / 0.010))),
               0.0);
};


// ==========================================================
// PLASMA BLACKOUT
// ==========================================================
//
// Ionization blackout -- longer than Glenn's because of the
// shallower trajectory. Near-total silence. The world waits.

plasma_silence = os.osc(plasma_freq) * plasma_env * 0.012
               : fi.resonlp(25, 3, 1.0)
with {
  plasma_freq = 14 + 3 * os.osc(0.02);
  plasma_env = ba.if(active_phase > 0.830 & active_phase < 0.880,
                 ba.if(active_phase < 0.840,
                   (active_phase - 0.830) / 0.010,
                 ba.if(active_phase < 0.870,
                   0.7,
                   max(0.0, (0.880 - active_phase) / 0.010))),
                 0.0);
};


// ==========================================================
// RECOVERY -- DROGUE, MAIN CHUTE, SPLASHDOWN
// ==========================================================

// --- Drogue Chute ---
drogue_pop = no.noise * drogue_env * 0.35
           : fi.resonbp(2200, 3, 1.0)
with {
  drogue_env = ba.if(active_phase > 0.880 & active_phase < 0.895,
                 exp(-(active_phase - 0.880) * 55.0),
                 0.0);
};

// Wind buffeting on drogue
drogue_wind = no.pink_noise * dwind_env * 0.08
            : fi.resonlp(800, 2, 1.0)
            : *(1.0 + 0.3 * os.osc(0.35))
with {
  dwind_env = ba.if(active_phase > 0.885 & active_phase < 0.900,
                ba.if(active_phase < 0.890,
                  (active_phase - 0.885) / 0.005,
                  max(0.0, (0.900 - active_phase) / 0.005)),
                0.0);
};

// --- Main Chute ---
main_chute_pop = no.noise * main_env * 0.45
               : fi.resonbp(1500, 2.5, 1.0)
with {
  main_env = ba.if(active_phase > 0.905 & active_phase < 0.920,
               exp(-(active_phase - 0.905) * 40.0),
               0.0);
};

// --- Splashdown ---
// Carpenter landed 250 nm past the recovery fleet. The capsule
// was alone on the ocean. He opened the hatch and sat on the
// recovery compartment, inflated his raft, and waited.
splashdown = (no.noise * splash_env * 0.45
            : fi.resonlp(350, 2, 1.0))
           + (no.pink_noise * splash_env * 0.30
            : fi.resonlp(140, 3, 1.0))
with {
  splash_env = ba.if(active_phase > 0.920 & active_phase < 0.945,
                 exp(-(active_phase - 0.920) * 30.0),
                 0.0);
};

// --- Water Ambience ---
// Filtered noise with slow modulation -- ocean lapping at the
// capsule. Subtle delay creates a sense of water depth.
water_ambience = (no.pink_noise * water_env * 0.05
               : fi.resonlp(400, 2, 1.0)
               : *(0.6 + 0.4 * os.osc(0.12)))
              + (no.noise * water_env * 0.02
               : fi.resonbp(1200, 4, 1.0)
               : *(max(0.0, os.osc(0.23) - 0.5)))
with {
  water_env = ba.if(active_phase > 0.935,
                min(1.0, (active_phase - 0.935) / 0.015)
                * (1.0 - smoothstep(0.99, 1.0, active_phase)),
                0.0);
};


// ==========================================================
// THE LONG WAIT
// ==========================================================
//
// For 40 minutes after splashdown, NASA couldn't find Carpenter.
// Walter Cronkite was on the verge of reporting him lost.
// This section is near-silence -- just ocean and the faintest
// sub-bass drone of anxiety. Then: recovery.
//
// "I think I see the capsule."

ocean_wait = (no.pink_noise * wait_env * 0.025
            : fi.resonlp(200, 3, 1.0)
            : *(0.5 + 0.5 * os.osc(0.08)))
           + (os.osc(wait_tone) * wait_env * 0.008
            : fi.resonlp(60, 4, 1.0))
with {
  wait_tone = 28 + 5 * os.osc(0.03);  // Sub-bass anxiety
  wait_env = ba.if(active_phase > 0.960,
               ba.if(active_phase < 0.970,
                 (active_phase - 0.960) / 0.010,
               ba.if(active_phase < 0.995,
                 0.6,
                 max(0.0, (1.0 - active_phase) / 0.005))),
               0.0);
};


// ==========================================================
// FUEL-DEPENDENT MASTER FILTER
// ==========================================================
//
// This is where the entire sonic narrative converges.
// Every orbital sound passes through a lowpass filter whose
// cutoff is determined by the remaining fuel level.
//
// Full fuel (100%): cutoff at 8000 Hz -- bright, open, possible.
// Low fuel (15%): cutoff at 800 Hz -- dark, muffled, desperate.
//
// The listener HEARS the consequences of Carpenter's curiosity.

// Sum all orbital signals BEFORE the fuel filter
orbital_signals = orbital_drone + systems_hum + daylight_shimmer
                + night_drone + dawn_sweep + orbital_thrusters
                + heart_sound;

// Apply fuel-dependent filter to orbital content only
orbital_filtered = orbital_signals
                 : fi.resonlp(fuel_cutoff, fuel_q, 1.0);

// Firefly sounds bypass the fuel filter -- they are external
// to the capsule, luminous in space regardless of fuel state
firefly_signals = firefly_tap + firefly_burst;

// Non-orbital signals (launch, reentry, etc.) bypass fuel filter
launch_signals = countdown + atlas_ignition + maxq_buffet
               + beco + seco + posigrade;

reentry_signals = retrofire + retro_clunk + reentry + fireball
                + plasma_silence;

recovery_signals = drogue_pop + drogue_wind + main_chute_pop
                 + splashdown + water_ambience + ocean_wait;


// ==========================================================
// MIX + STEREO OUTPUT
// ==========================================================

dry_signal = launch_signals
           + orbital_filtered
           + firefly_signals
           + reentry_signals
           + recovery_signals;

// Slight stereo spread via micro-delay
spatial_delay = 48;  // ~1.1ms at 44100 Hz

left_out = dry_signal * intensity : fi.dcblocker;
right_out = dry_signal * intensity : @(spatial_delay) : fi.dcblocker;

process = left_out, right_out;
