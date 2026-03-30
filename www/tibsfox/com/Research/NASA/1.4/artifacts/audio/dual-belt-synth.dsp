// Dual Belt — Pioneer 3 Van Allen Belt Trajectory Synthesizer
// FAUST DSP source — compiles to VST, AU, LV2, JACK, CLI
//
// Mission 1.4: Pioneer 3 (Juno II / JPL)
// 38 hours of flight compressed to ~90 seconds
// Maps Pioneer 3's trajectory through the dual Van Allen belt structure
//
// The discovery: Earth has TWO radiation belts, not one.
// Inner belt: protons, dense, peaking ~3,500 km
// Outer belt: electrons, diffuse, peaking ~16,000 km
// Slot region: relative quiet between them (~6,000-10,000 km)
//
// Timeline (mission altitude → synth time):
//   0-10s:     Launch + ascent — Juno II roar, climbing through atmosphere
//   10-20s:    Inner belt onset — low drone swells (100-200 Hz), harsh harmonics
//   20-35s:    Inner belt peak — maximum intensity, grinding texture
//   35-45s:    Slot region — quiet drop, faint hum, the gap between belts
//   45-60s:    Outer belt onset — higher wash (400-800 Hz), chorus, diffuse
//   60-72s:    Outer belt peak — broad shimmer, maximum electron density
//   72-82s:    Outer belt fade — thinning, dissolving into cislunar space
//   82-90s:    Deep space / apogee — silence, 102,322 km, then fade to nothing
//
// The two layers are the two organisms of the lichen:
//   Inner belt (fungus) = structural, dense, low-frequency, close to Earth
//   Outer belt (alga)   = diffuse, dynamic, higher-frequency, reaching sunward
//
// Build:
//   faust2jaqt dual-belt-synth.dsp    # JACK/Qt standalone
//   faust2lv2  dual-belt-synth.dsp    # LV2 plugin
//   faust2vst  dual-belt-synth.dsp    # VST plugin (needs VST SDK)
//
// Install FAUST: https://faust.grame.fr/downloads/

import("stdfaust.lib");

// --- Parameters ---
phase = hslider("[0]Phase", 0, 0, 1, 0.001) : si.smoo;
auto_mode = checkbox("[1]Auto (90s cycle)");
intensity = hslider("[2]Intensity", 0.7, 0, 1, 0.01) : si.smoo;
belt_separation = hslider("[3]Belt Separation", 0.7, 0, 1, 0.01) : si.smoo;

// Auto-advancing phase (90-second cycle)
auto_phase = os.phasor(1, 1.0/90.0);
active_phase = select2(auto_mode, phase, auto_phase);

// --- Time mapping (phase 0-1 → 0-90 seconds) ---
time_sec = active_phase * 90.0;

// ==============================================
// LAUNCH PHASE (0-10s)
// ==============================================
// Juno II first stage — Jupiter IRBM engine
launch_env = ba.if(time_sec < 10.0,
               min(time_sec / 1.0, 1.0) *
               ba.if(time_sec > 8.0, (10.0 - time_sec) / 2.0, 1.0),
               0.0);

launch_rumble = os.osc(32) * 0.25 + os.osc(48) * 0.18 + os.osc(16) * 0.12;
launch_roar = no.noise : fi.resonlp(150, 1, 1.0) : *(0.30);
launch_crackle = no.noise : fi.resonbp(900, 3, 1.0) : *(0.06);
launch_sound = (launch_rumble + launch_roar + launch_crackle) * launch_env;

// ==============================================
// INNER BELT (10-35s)
// ==============================================
// Low drone: 100-200 Hz, harsh harmonic texture
// Proton-dominated, dense, structural — the fungus of the radiation belts
// Onset: 10-20s (climbing), Peak: 20-35s, then drops into slot

// Envelope: ramp up 10-20s, sustain 20-30s, ramp down 30-35s
inner_env = ba.if(time_sec > 10.0 & time_sec < 35.0,
              ba.if(time_sec < 20.0,
                (time_sec - 10.0) / 10.0,         // Rising 10-20s
                ba.if(time_sec < 30.0,
                  1.0,                              // Full 20-30s
                  (35.0 - time_sec) / 5.0)),        // Falling 30-35s
              0.0);

// Inner belt fundamental: low, structural, grinding
inner_fund = 130.0 + inner_env * 40.0;  // 130-170 Hz range

// Primary drone — thick with harmonics (proton energy)
inner_drone = os.osc(inner_fund) * 0.30
            + os.osc(inner_fund * 1.5) * 0.18      // Perfect fifth — dissonant
            + os.osc(inner_fund * 2.0) * 0.15
            + os.osc(inner_fund * 3.0) * 0.10
            + os.osc(inner_fund * 4.0) * 0.06
            + os.osc(inner_fund * 5.0) * 0.03;

// Harsh texture — simulating intense proton flux
inner_harsh = no.noise : fi.resonbp(inner_fund * 3.0, 2, 1.0) : *(0.12);
// Sub-bass rumble (geomagnetically trapped protons)
inner_sub = os.osc(inner_fund * 0.5) * 0.15;
// Geiger counter clicks at peak (instrument saturation)
inner_clicks = no.noise * (no.noise > (0.999 - inner_env * 0.008))
             : fi.resonbp(2000, 8, 1.0) : *(0.04 * inner_env);

inner_sound = (inner_drone + inner_harsh + inner_sub + inner_clicks) * inner_env;

// ==============================================
// SLOT REGION (35-45s)
// ==============================================
// Relative silence — the gap between belts
// Only a faint hum of spacecraft electronics and distant particles
slot_env = ba.if(time_sec > 35.0 & time_sec < 45.0,
             1.0 - belt_separation * 0.85,   // Nearly silent at high separation
             0.0);

// Faint telemetry carrier
slot_hum = os.osc(960.05) * 0.005 + os.osc(480.0) * 0.003;
// Very sparse particle hits (slot is not empty, just sparse)
slot_tick = no.noise * (no.noise > 0.9995)
          : fi.resonbp(1500, 10, 1.0) : *(0.02);
// Spacecraft systems hum
slot_systems = os.osc(60) * 0.006 + os.osc(120) * 0.003;

slot_sound = (slot_hum + slot_tick + slot_systems) * slot_env;

// ==============================================
// OUTER BELT (45-82s)
// ==============================================
// Higher frequency: 400-800 Hz, diffuse wash with chorus
// Electron-dominated, broader, dynamic — the alga of the radiation belts
// Onset: 45-55s, Peak: 55-72s, Fade: 72-82s

outer_env = ba.if(time_sec > 45.0 & time_sec < 82.0,
              ba.if(time_sec < 55.0,
                (time_sec - 45.0) / 10.0,          // Rising 45-55s
                ba.if(time_sec < 72.0,
                  1.0,                               // Full 55-72s
                  (82.0 - time_sec) / 10.0)),        // Falling 72-82s
              0.0);

// Outer belt fundamental: higher, more diffuse
outer_fund = 500.0 + outer_env * 150.0;  // 500-650 Hz range

// Diffuse wash — softer harmonics than inner belt (electron cloud)
outer_wash = os.osc(outer_fund) * 0.20
           + os.osc(outer_fund * 1.01) * 0.18      // Slight detune = chorus
           + os.osc(outer_fund * 0.99) * 0.18      // Other side of chorus
           + os.osc(outer_fund * 2.0) * 0.08
           + os.osc(outer_fund * 2.01) * 0.07;     // More chorus at harmonic

// Chorus modulation — electron flux is dynamic, fluctuating
outer_chorus_rate = 0.3 + outer_env * 0.5;
outer_chorus_mod = os.osc(outer_chorus_rate) * 0.5 + 0.5;
outer_chorus = os.osc(outer_fund * (1.0 + outer_chorus_mod * 0.02)) * 0.12;

// Shimmer — high-frequency electron scatter
outer_shimmer = no.noise : fi.resonbp(outer_fund * 4.0, 5, 1.0) : *(0.06);
// Gentle filtered noise (diffuse electron cloud)
outer_diffuse = no.pink_noise : fi.resonbp(outer_fund * 2.0, 3, 1.0) : *(0.08);

outer_sound = (outer_wash + outer_chorus + outer_shimmer + outer_diffuse) * outer_env;

// ==============================================
// DEEP SPACE / APOGEE (82-90s)
// ==============================================
// 102,322 km — beyond the outer belt, approaching silence
// Just the faintest telemetry ping and cosmic background

apogee_env = ba.if(time_sec > 82.0 & time_sec < 90.0,
               ba.if(time_sec < 85.0,
                 0.05,                               // Faint presence
                 0.05 * (90.0 - time_sec) / 5.0),    // Final fade
               0.0);

apogee_ping = os.osc(960.05) * 0.008;   // Distant telemetry carrier
apogee_cosmic = no.noise * 0.003 : fi.resonlp(400, 2, 1.0);  // Cosmic background
apogee_sound = (apogee_ping + apogee_cosmic) * apogee_env;

// ==============================================
// STEREO FIELD
// ==============================================
// Inner belt slightly left (closer to Earth)
// Outer belt slightly right (reaching sunward)
// Slot and launch centered

mono_mix = launch_sound + inner_sound + slot_sound + outer_sound + apogee_sound;

inner_pan_L = 0.65;
inner_pan_R = 0.35;
outer_pan_L = 0.35;
outer_pan_R = 0.65;

left_mix = launch_sound * 0.5
         + inner_sound * inner_pan_L
         + slot_sound * 0.5
         + outer_sound * outer_pan_L
         + apogee_sound * 0.5;

right_mix = launch_sound * 0.5
          + inner_sound * inner_pan_R
          + slot_sound * 0.5
          + outer_sound * outer_pan_R
          + apogee_sound * 0.5;

// ==============================================
// SIMPLE REVERB (space is big)
// ==============================================
rev_L = left_mix : de.delay(44100, 2347) * 0.20
      + left_mix : de.delay(44100, 3571) * 0.14
      + left_mix : de.delay(44100, 5107) * 0.08;

rev_R = right_mix : de.delay(44100, 2791) * 0.20
      + right_mix : de.delay(44100, 4133) * 0.14
      + right_mix : de.delay(44100, 5843) * 0.08;

// ==============================================
// PROCESS
// ==============================================
process =
  (left_mix + rev_L) * intensity : fi.dcblocker : fi.resonlp(12000, 1, 1.0),
  (right_mix + rev_R) * intensity : fi.dcblocker : fi.resonlp(12000, 1, 1.0);
