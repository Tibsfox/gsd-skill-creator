// Mercury-Redstone 2 — Ham's Suborbital Flight Synthesizer
// FAUST DSP source — compiles to VST, AU, LV2, JACK, CLI
//
// Mission 1.17: Mercury-Redstone 2 (MR-2)
// The sound of Ham's flight: countdown → ignition rumble →
// acceleration (rising pitch) → abort BANG (extra thrust) →
// weightlessness (floating tones) → reentry roar → splashdown
//
// January 31, 1961. Ham the chimpanzee became the first hominid
// in space. Suborbital flight: 253 km peak (vs 185 km planned)
// because the abort system fired, adding extra thrust. 14.7g on
// reentry. 16 minutes 39 seconds total. ~45 seconds compressed.
//
// Build:
//   faust2jaqt mr2-ham-synth.dsp    # JACK/Qt standalone
//   faust2lv2  mr2-ham-synth.dsp    # LV2 plugin
//   faust2vst  mr2-ham-synth.dsp    # VST plugin
//
// Parameters:
//   - Phase (0-1): manual control of the 45-second timeline
//   - Auto: toggle automatic phase progression
//   - Intensity: overall volume/intensity
//   - G-Force: audible g-force intensity mapping
//
// Install FAUST: https://faust.grame.fr/downloads/

import("stdfaust.lib");

// --- Parameters ---
phase = hslider("[0]Phase", 0, 0, 1, 0.001) : si.smoo;
auto_mode = checkbox("[1]Auto (45s cycle)");
intensity = hslider("[2]Intensity", 0.7, 0, 1, 0.01) : si.smoo;
gforce_mix = hslider("[3]G-Force Intensity", 0.7, 0, 1, 0.01) : si.smoo;

// Auto-advancing phase (45-second cycle)
auto_phase = os.phasor(1, 1.0/45.0);
active_phase = select2(auto_mode, phase, auto_phase);

// --- Timeline ---
// Phase 0.00 - 0.07: Countdown + ignition sequence (0-3s)
// Phase 0.07 - 0.18: Liftoff + powered ascent (3-8s)
// Phase 0.18 - 0.25: Abort fires — extra thrust BANG (8-11s)
// Phase 0.25 - 0.40: Continued ascent, thinning atmosphere (11-18s)
// Phase 0.40 - 0.55: Coast to apogee — weightlessness (18-25s)
// Phase 0.55 - 0.62: Retro-fire — brief braking (25-28s)
// Phase 0.62 - 0.80: Reentry — roar, compression, 14.7g peak (28-36s)
// Phase 0.80 - 0.90: Drogue + main chute deploy (36-40s)
// Phase 0.90 - 1.00: Splashdown + ocean (40-45s)

// --- Countdown Beeps ---
// Staccato tones marking final seconds
countdown = os.osc(1000) * cd_env * 0.15
with {
  // 3 beeps in the countdown zone
  cd_pulse = ba.if(active_phase < 0.07,
               ba.if(mod(active_phase * 45.0, 1.0) < 0.1, 1.0, 0.0),
               0.0);
  cd_env = cd_pulse * (1.0 - smoothstep(0.05, 0.07, active_phase));
};

// Smooth step helper
smoothstep(edge0, edge1, x) = t * t * (3.0 - 2.0 * t)
with {
  t = max(0.0, min(1.0, (x - edge0) / (edge1 - edge0)));
};

// --- Ignition Rumble ---
// Low-frequency combustion, building in intensity
ignition = no.pink_noise
         : fi.resonlp(200 + active_phase * 3000, 2.0, 1.0)
         : fi.resonhp(25, 1.5, 1.0)
         : *(ign_env)
with {
  ign_env = ba.if(active_phase < 0.04,
              active_phase / 0.04 * 0.2,
            ba.if(active_phase < 0.07,
              0.2 + (active_phase - 0.04) / 0.03 * 0.8,
            ba.if(active_phase < 0.18,
              1.0,
            ba.if(active_phase < 0.25,
              0.8,  // Still thrusting during abort
            ba.if(active_phase < 0.30,
              max(0.0, (0.30 - active_phase) / 0.05 * 0.8),
              0.0)))));
};

// --- Acceleration Tone ---
// Rising pitch as g-force builds during powered flight
accel_tone = os.sawtooth(accel_freq) * 0.06 * accel_env
           + os.osc(accel_freq * 1.5) * 0.03 * accel_env
with {
  // Frequency rises with acceleration: 40 Hz at liftoff → 200 Hz at 6g
  accel_freq = ba.if(active_phase < 0.07, 40,
               ba.if(active_phase < 0.18,
                 40 + (active_phase - 0.07) / 0.11 * 100,
               ba.if(active_phase < 0.25,
                 140 + (active_phase - 0.18) / 0.07 * 80,  // Abort adds thrust
                 220)));
  accel_env = ba.if(active_phase > 0.07 & active_phase < 0.30,
                min(1.0, (active_phase - 0.07) / 0.03),
                0.0)
            * ba.if(active_phase < 0.25, 1.0,
                max(0.0, (0.30 - active_phase) / 0.05));
};

// --- Abort BANG ---
// Sudden explosive impulse — escape rocket fires, extra thrust
abort_bang = (no.noise * bang_env : fi.resonlp(4000, 0.4, 1.0)) * 0.9
           + (no.noise * bang_env * 0.5 : fi.resonbp(1200, 2, 1.0))
           + os.sawtooth(180) * bang_env * 0.3
with {
  bang_env = ba.if(active_phase > 0.18 & active_phase < 0.23,
               exp(-(active_phase - 0.18) * 30.0),
               0.0);
};

// --- G-Force Pressure ---
// Subsonic pressure representing the physical weight on the body
// Deeper during high-g phases (launch 6g, reentry 14.7g)
gforce_pressure = no.pink_noise * gf_env * gforce_mix * 0.15
                : fi.resonlp(gf_freq, 3, 1.0)
                : fi.resonhp(15, 1, 1.0)
with {
  // G-force profile: launch 6g, abort adds more, coast 0g, reentry 14.7g
  gf_level = ba.if(active_phase < 0.07, 1.0,
             ba.if(active_phase < 0.18, 6.0,
             ba.if(active_phase < 0.25, 9.0,   // Abort extra g
             ba.if(active_phase < 0.40, 1.0,   // Coast/low-g
             ba.if(active_phase < 0.55, 0.0,   // Weightlessness
             ba.if(active_phase < 0.62, 2.0,   // Retro
             ba.if(active_phase < 0.72, 8.0,   // Reentry building
             ba.if(active_phase < 0.78, 14.7,  // Peak reentry
             ba.if(active_phase < 0.85, 5.0,   // Reentry easing
                   1.0)))))))));
  gf_env = gf_level / 15.0;
  gf_freq = 30 + gf_level * 8.0;
};

// --- Weightlessness ---
// Floating, ethereal tones during coast phase (0g)
weightless = (os.osc(f1) * 0.04 + os.osc(f2) * 0.03 + os.osc(f3) * 0.02)
           * wl_env
           : fi.resonlp(2000, 1, 1.0)
with {
  // Slowly drifting pure tones — stillness after violence
  f1 = 440 + 30 * os.osc(0.1);
  f2 = 660 + 20 * os.osc(0.07);
  f3 = 880 + 40 * os.osc(0.13);
  wl_env = ba.if(active_phase > 0.40 & active_phase < 0.55,
             sin((active_phase - 0.40) / 0.15 * 3.14159),
             0.0);
};

// --- Lever Task Clicks ---
// Subtle periodic clicks representing Ham pulling the lever
// (response to light stimulus during flight)
lever_click = no.noise * click_env * 0.2
            : fi.resonbp(3000, 5, 1.0)
with {
  // Periodic clicks during flight phases (every ~1.5 seconds)
  click_rate = ba.if(active_phase > 0.10 & active_phase < 0.80,
                 mod(active_phase * 45.0, 1.5) < 0.05, 0.0);
  click_env = ba.if(click_rate > 0.5, 1.0, 0.0)
            * ba.if(active_phase > 0.10 & active_phase < 0.80, 0.5, 0.0);
};

// --- Retro-Fire ---
// Brief braking rockets
retro = os.sawtooth(retro_freq) * retro_env * 0.12
      + no.noise * retro_env * 0.15
      : fi.resonlp(retro_freq * 2.5, 1.5, 1.0)
with {
  retro_freq = 250;
  retro_env = ba.if(active_phase > 0.55 & active_phase < 0.62,
                sin((active_phase - 0.55) / 0.07 * 3.14159) * 0.7,
                0.0);
};

// --- Reentry Roar ---
// Harsh, compressed, overwhelming — 14.7g peak
reentry = (no.noise * re_env : fi.resonlp(re_freq, 1.5, 1.0))
        + (no.pink_noise * re_env * 0.6 : fi.resonhp(500, 1, 1.0))
        + os.sawtooth(re_freq * 0.25) * re_env * 0.15
with {
  // Frequency rises as atmosphere thickens and heating increases
  re_freq = ba.if(active_phase > 0.62 & active_phase < 0.80,
              800 + (active_phase - 0.62) / 0.18 * 3000,
              800);
  // Envelope: builds to peak at 0.75 (14.7g), then drops
  re_env = ba.if(active_phase > 0.62 & active_phase < 0.80,
             ba.if(active_phase < 0.72,
               (active_phase - 0.62) / 0.10,
             ba.if(active_phase < 0.76,
               1.0,  // Peak
               max(0.0, (0.80 - active_phase) / 0.04))),
             0.0)
         * 0.7;
};

// --- Parachute Deploy ---
// Fabric pop then flutter
chute_pop = no.noise * pop_env * 0.35
          : fi.resonbp(1800, 3, 1.0)
with {
  pop_env = ba.if(active_phase > 0.80 & active_phase < 0.84,
              ba.if(active_phase < 0.82,
                (active_phase - 0.80) / 0.02,
                max(0.0, (0.84 - active_phase) / 0.02)),
              0.0);
};

chute_flutter = no.pink_noise * flutter_env * 0.15
              : fi.resonbp(flutter_freq, 4, 1.0)
with {
  flutter_rate = 6.0 - (active_phase - 0.84) * 8.0;
  flutter_freq = 500 + 300 * os.osc(max(1.0, flutter_rate));
  flutter_env = ba.if(active_phase > 0.84 & active_phase < 0.92,
                  0.6 - (active_phase - 0.84) / 0.08 * 0.4,
                  0.0);
};

// --- Splashdown ---
// Water impact: low thud + white noise splash + ocean
splashdown = (no.noise * splash_env * 0.5 : fi.resonlp(600, 2, 1.0))
           + (no.pink_noise * splash_env * 0.3 : fi.resonlp(200, 3, 1.0))
with {
  splash_env = ba.if(active_phase > 0.90 & active_phase < 0.94,
                 exp(-(active_phase - 0.90) * 60.0),
                 0.0);
};

// Ocean waves after splashdown
ocean = no.pink_noise * ocean_env * 0.06
      : fi.resonlp(300, 2.5, 1.0)
with {
  ocean_env = ba.if(active_phase > 0.92,
                min(1.0, (active_phase - 0.92) / 0.04)
                * (1.0 + 0.3 * os.osc(0.2)),
                0.0);
};

// --- Mix ---
process = (countdown + ignition + accel_tone + abort_bang +
           gforce_pressure + weightless + lever_click + retro +
           reentry + chute_pop + chute_flutter + splashdown + ocean)
        * intensity
        : fi.dcblocker
        <: _,_;  // Stereo output
