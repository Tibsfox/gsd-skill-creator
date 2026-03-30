// Escape Velocity — Pioneer 4 Launch to Solar Orbit Synthesizer
// FAUST DSP source — compiles to VST, AU, LV2, JACK, CLI
//
// Mission 1.5: Pioneer 4 (Juno II / JPL)
// The sound of escape. ~120 seconds.
//
// After four failures and partial successes, the fifth Pioneer reaches
// escape velocity. All three Juno II stages fire nominally for the first
// time. The spacecraft separates, and for 82 hours its 180-milliwatt
// transmitter whispers across 655,300 km before going silent.
// Pioneer 4 is still orbiting the Sun.
//
// Timeline (mission phase → synth time):
//   0-8s:      Pre-launch — deep subsonic pulse, countdown tension
//   8-25s:     First stage — Juno II S-3D engine roar (THIS TIME it burns full duration)
//              Deep 30-50 Hz rumble with broadband combustion noise
//   25-35s:    Stage separation + second stage ignition — brief silence, then solid motor
//              cluster, lighter roar, rising pitch as mass decreases
//   35-45s:    Third stage — high solid motor whine, final push,
//              the frequency climbs as velocity approaches escape
//   45-50s:    MOMENT OF ESCAPE — the threshold crossing. Total energy goes positive.
//              A shimmering chord that opens up, like stepping out of a forest into sky.
//              Brief silence as the spacecraft separates from the spent stage.
//   50-80s:    Expanding distance — ascending, spacious tone that grows more reverberant
//              as the distance increases. The signal spreading across an ever-larger sphere.
//              Thin, high shimmer representing the 180mW transmitter fading with distance.
//   80-100s:   Lunar flyby — gentle gravitational warble as Pioneer 4 passes the Moon
//              at 60,000 km. The orbit bends slightly. Deep space opens up.
//   100-115s:  Solar wind hum — the heliocentric orbit. A quiet, steady drone at the
//              frequency of the solar wind (proton gyrofrequency ~1 Hz, shifted to
//              audible range). Pioneer 4 is a solar system object now.
//   115-120s:  Fade to silence. Still out there. Still orbiting.
//
// Organism resonance: Douglas-fir
//   First stage = seedling pushing through soil
//   Second stage = sapling racing for light
//   Third stage = young tree breaking through understory
//   Escape moment = crown reaching the canopy
//   Expanding distance = centuries of growth as canopy emergent
//   Solar wind = the permanent state: orbiting the Sun, rooted in the forest
//
// Build:
//   faust2jaqt escape-velocity-synth.dsp    # JACK/Qt standalone
//   faust2lv2  escape-velocity-synth.dsp    # LV2 plugin
//   faust2vst  escape-velocity-synth.dsp    # VST plugin (needs VST SDK)
//
// Install FAUST: https://faust.grame.fr/downloads/

import("stdfaust.lib");

// --- Parameters ---
phase = hslider("[0]Phase", 0, 0, 1, 0.001) : si.smoo;
auto_mode = checkbox("[1]Auto (120s cycle)");
intensity = hslider("[2]Intensity", 0.7, 0, 1, 0.01) : si.smoo;
triumph = hslider("[3]Triumph", 0.6, 0, 1, 0.01) : si.smoo;

// Auto-advancing phase (120-second cycle)
auto_phase = os.phasor(1, 1.0/120.0);
active_phase = select2(auto_mode, phase, auto_phase);

// --- Time mapping (phase 0-1 → 0-120 seconds) ---
time_sec = active_phase * 120.0;

// ============================================
// PRE-LAUNCH (0-8s)
// ============================================
// Deep subsonic pulse. Tension. The previous four attempts inform this one.
prelaunch_env = ba.if(time_sec < 8.0,
                  ba.if(time_sec < 1.0, time_sec, 1.0) *
                  (0.5 + 0.5 * os.osc(0.5)),
                  0.0);

prelaunch_pulse = os.osc(8) * 0.3 + os.osc(12) * 0.2 + os.osc(4) * 0.15;
prelaunch_tension = no.noise : fi.resonlp(60, 2, 1.0) : *(0.08);
prelaunch = (prelaunch_pulse + prelaunch_tension) * prelaunch_env * 0.4;

// ============================================
// FIRST STAGE (8-25s)
// ============================================
// Juno II S-3D engine — 667 kN of thrust. THIS TIME it burns full duration.
// Deep, powerful, sustained. No premature cutoff.
stage1_env = ba.if(time_sec >= 8.0 & time_sec < 25.0,
               ba.if(time_sec < 10.0, (time_sec - 8.0) / 2.0, 1.0) *
               ba.if(time_sec > 23.0, (25.0 - time_sec) / 2.0, 1.0),
               0.0);

// Engine fundamental and harmonics — deep, powerful
stage1_fundamental = os.osc(32) * 0.25 + os.osc(48) * 0.18 + os.osc(64) * 0.12;
// Combustion broadband noise
stage1_roar = no.noise : fi.resonlp(180, 1, 1.0) : *(0.25);
// Turbopump whine (rising with thrust)
pump_freq = 200 + (time_sec - 8.0) * 5;
stage1_pump = os.osc(pump_freq) * 0.04;
// Crackling exhaust
stage1_crackle = no.noise : fi.resonbp(1200, 4, 1.0) : *(0.05);

stage1 = (stage1_fundamental + stage1_roar + stage1_pump + stage1_crackle) * stage1_env * 0.7;

// ============================================
// STAGE SEPARATION + SECOND STAGE (25-35s)
// ============================================
// Brief moment of quiet at separation, then solid motor cluster ignites.
// Lighter sound — less mass, higher pitch.
sep_silence = ba.if(time_sec >= 25.0 & time_sec < 26.5, 1.0, 0.0);

stage2_env = ba.if(time_sec >= 26.5 & time_sec < 35.0,
               ba.if(time_sec < 28.0, (time_sec - 26.5) / 1.5, 1.0) *
               ba.if(time_sec > 33.0, (35.0 - time_sec) / 2.0, 1.0),
               0.0);

// Solid motors — harsher, grainier than liquid stage
stage2_motor = os.osc(80) * 0.15 + os.osc(120) * 0.12 + os.osc(160) * 0.08;
stage2_grain = no.noise : fi.resonbp(400, 2, 1.0) : *(0.15);
// Rising pitch as velocity increases
s2_rise = os.osc(200 + (time_sec - 26.5) * 30) * 0.06;

stage2 = (stage2_motor + stage2_grain + s2_rise) * stage2_env * 0.6;

// ============================================
// THIRD STAGE (35-45s)
// ============================================
// Final solid motor — high whine, climbing frequency.
// The velocity is approaching escape. The tone rises, tenses, reaches.
stage3_env = ba.if(time_sec >= 35.0 & time_sec < 45.0,
               ba.if(time_sec < 36.5, (time_sec - 35.0) / 1.5, 1.0) *
               ba.if(time_sec > 43.0, (45.0 - time_sec) / 2.0, 1.0),
               0.0);

// High solid motor whine — rising toward escape
s3_base_freq = 300 + (time_sec - 35.0) * 80;
stage3_whine = os.osc(s3_base_freq) * 0.12 + os.osc(s3_base_freq * 1.5) * 0.06;
stage3_hiss = no.noise : fi.resonhp(2000, 1, 1.0) : *(0.08);
// Tension building — the approach to escape velocity
tension_freq = 600 + (time_sec - 35.0) * 120;
stage3_tension = os.osc(tension_freq) * 0.05 * (1 + triumph);

stage3 = (stage3_whine + stage3_hiss + stage3_tension) * stage3_env * 0.6;

// ============================================
// ESCAPE MOMENT (45-50s)
// ============================================
// THE THRESHOLD. Total orbital energy goes positive.
// A shimmering major chord that opens up — like stepping out of forest into sky.
// Unlike anything in Pioneers 0-3.
escape_env = ba.if(time_sec >= 45.0 & time_sec < 50.0,
               ba.if(time_sec < 46.0, (time_sec - 45.0), 1.0) *
               ba.if(time_sec > 48.5, (50.0 - time_sec) / 1.5, 1.0),
               0.0);

// Major chord — C-E-G-C (triumphant, open)
escape_root = os.osc(262) * 0.10;   // C4
escape_third = os.osc(330) * 0.08;  // E4
escape_fifth = os.osc(392) * 0.08;  // G4
escape_oct = os.osc(524) * 0.06;    // C5
// Shimmer — detuned doublings
escape_shimmer = os.osc(263.5) * 0.04 + os.osc(393.5) * 0.03;
// Wide reverberant wash
escape_wash = no.noise : fi.resonlp(800, 0.5, 1.0) : *(0.06);

escape = (escape_root + escape_third + escape_fifth + escape_oct + escape_shimmer + escape_wash)
         * escape_env * (0.6 + triumph * 0.4);

// ============================================
// EXPANDING DISTANCE (50-80s)
// ============================================
// Ascending, spacious tone. The spacecraft is leaving.
// Earth shrinks. Stars appear. The signal spreads.
expand_env = ba.if(time_sec >= 50.0 & time_sec < 80.0,
               ba.if(time_sec < 52.0, (time_sec - 50.0) / 2.0, 1.0) *
               ba.if(time_sec > 76.0, (80.0 - time_sec) / 4.0, 1.0),
               0.0);

// Slowly ascending tone — representing increasing distance
expand_base = 400 + (time_sec - 50.0) * 4;
expand_tone = os.osc(expand_base) * 0.06 + os.osc(expand_base * 1.498) * 0.04;
// Growing spaciousness — longer and longer delays
expand_space = os.osc(expand_base * 0.501) * 0.03;
// 180mW transmitter signal — thin, high, fading
tx_freq = 960;  // Hz representation of 960 MHz
tx_signal = os.osc(tx_freq) * 0.02 * max(0, 1.0 - (time_sec - 50.0) / 35.0);
// Deep space quiet — very low filtered noise
deep_quiet = no.noise : fi.resonlp(200, 0.3, 1.0) : *(0.03);

expand = (expand_tone + expand_space + tx_signal + deep_quiet) * expand_env * 0.5;

// ============================================
// LUNAR FLYBY (80-100s)
// ============================================
// Pioneer 4 passes the Moon at 60,000 km.
// Gentle gravitational warble — the trajectory bends slightly.
lunar_env = ba.if(time_sec >= 80.0 & time_sec < 100.0,
              ba.if(time_sec < 83.0, (time_sec - 80.0) / 3.0, 1.0) *
              ba.if(time_sec > 96.0, (100.0 - time_sec) / 4.0, 1.0),
              0.0);

// Gravitational warble — frequency modulation as trajectory bends
lunar_mod = 3.0 * os.osc(0.15);  // very slow modulation
lunar_tone = os.osc(280 + lunar_mod) * 0.05 + os.osc(420 + lunar_mod * 1.5) * 0.03;
// Moon presence — low, weighty
moon_drone = os.osc(55) * 0.03 + os.osc(82.5) * 0.02;
// Deep space continues
lunar_space = no.noise : fi.resonlp(150, 0.3, 1.0) : *(0.02);

lunar = (lunar_tone + moon_drone + lunar_space) * lunar_env * 0.4;

// ============================================
// SOLAR WIND HUM (100-115s)
// ============================================
// Heliocentric orbit. Pioneer 4 is a permanent solar system object.
// Quiet, steady drone. The solar wind at audible representation.
solar_env = ba.if(time_sec >= 100.0 & time_sec < 115.0,
              ba.if(time_sec < 103.0, (time_sec - 100.0) / 3.0, 1.0) *
              ba.if(time_sec > 112.0, (115.0 - time_sec) / 3.0, 1.0),
              0.0);

// Solar wind — proton gyrofrequency scaled to audible
solar_fundamental = os.osc(60) * 0.04;
solar_harmonic = os.osc(120) * 0.02 + os.osc(180) * 0.01;
// Interplanetary medium — very sparse, very quiet
solar_sparse = no.noise : fi.resonlp(100, 0.2, 1.0) : *(0.015);
// Orbital periodicity — 395-day cycle compressed
orbit_pulse = os.osc(0.08) * 0.01;

solar = (solar_fundamental + solar_harmonic + solar_sparse + orbit_pulse) * solar_env * 0.4;

// ============================================
// FADE (115-120s)
// ============================================
// Still out there. Still orbiting. Fade to silence.
fade_env = ba.if(time_sec >= 115.0 & time_sec <= 120.0,
             (120.0 - time_sec) / 5.0,
             0.0);

fade_whisper = os.osc(60) * 0.02 + no.noise : fi.resonlp(80, 0.2, 1.0) : *(0.01);
fade = fade_whisper * fade_env * 0.3;

// ============================================
// MASTER MIX
// ============================================
// Sum all phases
raw = (prelaunch + stage1 + stage2 + stage3 + escape + expand + lunar + solar + fade) * intensity;

// Gentle limiting
limited = raw : ef.compressor_mono(4, -6, 0.01, 0.1);

// Output (stereo with subtle width)
width = 0.3;
process = limited <: *(1 + width * os.osc(0.07)), *(1 - width * os.osc(0.07));
