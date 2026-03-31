// TIROS-1 — Weather Observation Sonification
// FAUST DSP source — compiles to VST, AU, LV2, JACK, CLI
//
// Mission 1.15: TIROS-1 (NASA / Thor-Able)
// SUCCESSFUL LAUNCH — April 1, 1960
//
// TIROS-1 was the first weather satellite: a 120 kg drum-shaped
// spacecraft carrying two vidicon TV cameras in a 693 x 756 km orbit.
// In 78 days it returned 22,952 photographs of Earth's cloud patterns,
// proving that weather could be observed from space. Spin-stabilized
// at ~12 RPM, the cameras could only image Earth during the portion
// of each rotation when they pointed downward.
//
// This is the sound of weather observation from orbit. ~60 seconds.
//
// A low rumbling base represents the vast cloud systems below — the
// planetary-scale weather that TIROS-1 revealed for the first time.
// Brighter tones sweep across the stereo field as the camera "scans"
// during each orbital pass, building a picture one swath at a time.
// Wind textures and rain sounds evoke the weather being observed.
// Each sweep represents a different pass showing different weather:
// clear skies, scattered clouds, organized storms, cyclone spirals.
//
// Timeline (phase 0→1 → 0→60 seconds):
//   0-10s:  Orbital sunrise — TIROS emerges from Earth's shadow.
//           The drum begins to spin. Low rumble of the planet below.
//   10-25s: First pass — scattered clouds. Camera sweeps produce
//           bright, intermittent tones as cloud fields pass below.
//           Wide stereo panning follows the orbital ground track.
//   25-40s: Storm pass — organized weather. The tones become denser,
//           more urgent. A typhoon vortex produces a spiraling,
//           intensifying pattern. Rain textures increase.
//   40-55s: Clear-sky pass — tones thin out. Ocean below reflects
//           differently. Wind textures dominate. Peaceful resolution.
//   55-60s: Orbital sunset — the drum fades into shadow. Silence.
//
// Organism resonance: Aurelia aurita (moon jellyfish)
//   A translucent, pulsing bell drifting in ocean currents. Like
//   TIROS-1 drifting in orbit, the jellyfish pulses rhythmically
//   (the satellite spins rhythmically). Both observe their world
//   passively: the jellyfish senses light through simple photoreceptors,
//   the satellite captures light through vidicon tubes. Both are
//   drum-shaped, translucent, and carried by currents.
//
// Dedication: Sergei Rachmaninoff (1873-1943)
//   The building crescendo of a storm mirrors Rachmaninoff's
//   signature orchestral swells — vast, rolling, overwhelming,
//   then resolving into unexpected clarity.
//
// Build:
//   faust2jaqt tiros1-weather-synth.dsp    # JACK/Qt standalone
//   faust2lv2  tiros1-weather-synth.dsp    # LV2 plugin
//   faust2vst  tiros1-weather-synth.dsp    # VST plugin (needs VST SDK)
//
// Install FAUST: https://faust.grame.fr/downloads/

import("stdfaust.lib");

// --- Parameters ---
cycle_duration = hslider("[0]Cycle Duration (s)", 60, 30, 120, 1) : si.smoo;
cloud_density = hslider("[1]Cloud Density", 0.6, 0, 1.0, 0.01) : si.smoo;
storm_intensity = hslider("[2]Storm Intensity", 0.7, 0, 1.0, 0.01) : si.smoo;
wind_level = hslider("[3]Wind Level", 0.4, 0, 1.0, 0.01) : si.smoo;

// ============================================
// TIME BASE — 0→1 over cycle_duration seconds
// ============================================
phase = os.phasor(1, 1.0 / cycle_duration);
t = phase;  // normalized time 0→1

// ============================================
// ORBITAL GEOMETRY — spin and pass phases
// ============================================
// TIROS-1 spin rate: ~12 RPM = 0.2 Hz
// Camera sees Earth only during a fraction of each rotation
spin_rate = 0.2;
spin_phase = os.phasor(1, spin_rate);

// Camera window: ~30% of rotation sees Earth
camera_active = ba.if(spin_phase < 0.3, 1.0, 0.0);

// Orbital pass envelope: rises, peaks, sets
pass_env = sin(t * ma.PI);

// Sunrise/sunset fading
dawn_fade = ba.if(t < 0.15, t / 0.15,
            ba.if(t > 0.90, (1.0 - t) / 0.10,
            1.0));

// ============================================
// CLOUD SYSTEMS — low rumbling base
// ============================================
// The vast weather systems below: deep, slow, rolling textures
// representing planetary-scale atmospheric circulation

// Deep cloud rumble — sub-bass representing the mass of weather
cloud_base1 = os.osc(45.0 + 5.0 * os.osc(0.03)) * 0.3;
cloud_base2 = os.osc(62.0 + 8.0 * os.osc(0.05)) * 0.2;
cloud_sub = no.noise : fi.lowpass(3, 120) : fi.highpass(1, 25) * 0.25;

// Cloud density modulation — changes across the pass
// Scattered (t<0.4), dense storm (0.4-0.7), clearing (0.7-1.0)
cloud_mod = ba.if(t < 0.17, 0.3,
            ba.if(t < 0.42, 0.3 + 0.7 * ((t - 0.17) / 0.25) * cloud_density,
            ba.if(t < 0.67, 1.0 * cloud_density,
            ba.if(t < 0.92, cloud_density * (1.0 - 0.7 * ((t - 0.67) / 0.25)),
            0.3))));

cloud_total = (cloud_base1 + cloud_base2 + cloud_sub) * cloud_mod * pass_env;

// ============================================
// CAMERA SCAN SWEEPS — bright tones panning
// ============================================
// Each time the spinning camera faces Earth, a bright tone
// sweeps across the stereo field. The tone's character changes
// based on what the camera "sees" (cloud/clear/storm).

// Scan tone: camera captures light → tone brightness
scan_freq_base = 800.0 + 400.0 * cloud_mod;
scan_freq = scan_freq_base + 200.0 * spin_phase;  // sweeps up during scan

// Primary scan tone
scan_tone = os.osc(scan_freq) * 0.3 + os.osc(scan_freq * 1.5) * 0.1;

// Scan envelope: sharp on when camera sees Earth, quick fade
scan_env = camera_active * pass_env * 0.4;

// Scan sweep creates a smooth amplitude curve during camera window
scan_shaped = scan_tone * scan_env;

// Stereo panning: scan sweeps left to right as the camera rotates
scan_pan = spin_phase;  // 0=left, 1=right during camera window

// ============================================
// STORM VORTEX — spiraling intensification
// ============================================
// During the storm pass (t=0.42-0.67), a cyclone vortex produces
// a spiraling, intensifying pattern — Rachmaninoff's crescendo

storm_active = ba.if(t > 0.42 & t < 0.67, 1.0, 0.0);
storm_build = ba.if(t < 0.42, 0.0,
              ba.if(t < 0.55, (t - 0.42) / 0.13,
              ba.if(t < 0.60, 1.0,
              ba.if(t < 0.67, (0.67 - t) / 0.07,
              0.0))));

// Spiral tone: frequency rises as the vortex tightens
spiral_freq = 200.0 + 600.0 * storm_build;
spiral_mod = os.osc(0.8 + 2.0 * storm_build);  // rotation speed increases
storm_tone = os.osc(spiral_freq) * 0.15
           + os.osc(spiral_freq * 1.33) * 0.08
           + os.osc(spiral_freq * 2.01) * 0.04;

storm_chorus = storm_tone * storm_build * storm_intensity * spiral_mod * 0.5;

// ============================================
// WIND TEXTURE — atmospheric motion
// ============================================
// Wind across the satellite, wind in the weather systems below
wind_base = no.noise : fi.bandpass(2, 100, 600) * 0.15;
wind_gust = 0.5 + 0.5 * os.osc(0.07 + 0.02 * os.osc(0.013));
wind_total = wind_base * wind_gust * wind_level * pass_env;

// ============================================
// RAIN TEXTURE — precipitation below
// ============================================
// Granular noise representing rainfall — increases with storm
rain_drops = no.noise : fi.bandpass(2, 3000, 8000) * 0.03;
rain_env = cloud_mod * storm_build * 0.5 + cloud_mod * 0.1;
rain_total = rain_drops * rain_env * pass_env;

// ============================================
// VIDICON HUM — camera electronics
// ============================================
// A faint electronic hum representing the vidicon tube scanning
vidicon_hum = os.osc(15750.0) * 0.005 * camera_active;  // horizontal scan freq
vidicon_buzz = os.osc(60.0) * 0.01 * camera_active;  // power supply

// ============================================
// COMPOSITION — weather observation from orbit
// ============================================

// All elements combined
all_weather = cloud_total + storm_chorus + rain_total;
all_scan = scan_shaped + vidicon_hum + vidicon_buzz;
all_ambient = wind_total;

// Master envelope with dawn/dusk
master_env = dawn_fade * 0.5;

// Stereo imaging:
//   Cloud base: wide stereo
//   Scan sweep: pans with spin_phase
//   Storm: centered, building
//   Wind: wide

output_L = (all_weather * 0.5 + all_scan * (1.0 - scan_pan) + storm_chorus * 0.5
          + all_ambient * 0.6 + rain_total * 0.4) * master_env;
output_R = (all_weather * 0.5 + all_scan * scan_pan + storm_chorus * 0.5
          + all_ambient * 0.4 + rain_total * 0.6) * master_env;

// Gentle limiter
soft_clip(x) = x : min(0.95) : max(-0.95);

process = output_L : soft_clip, output_R : soft_clip;
