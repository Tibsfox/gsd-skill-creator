// Forty-Three Hours — Pioneer 1 Radiation Profile Synthesizer
// FAUST DSP source — compiles to VST, AU, LV2, JACK, CLI
//
// Mission 1.2: Pioneer 1 (Thor-Able I)
// 43 hours of radiation data compressed to ~90 seconds
// Maps the radiation intensity profile from surface to 113,854 km
//
// Radiation profile (altitude → intensity):
//   0-1,000 km:       Low background (launch / low orbit)
//   1,000-6,000 km:   Inner Van Allen belt (intense)
//   6,000-10,000 km:  Slot region (reduced flux)
//   10,000-25,000 km: Outer Van Allen belt (intense, different character)
//   25,000-113,854 km: Cislunar space (low, decreasing)
//   113,854 km:        Apogee (silence, then return)
//   Return:            Mirror profile, fading into reentry
//
// Build:
//   faust2jaqt forty-three-hours-synth.dsp   # JACK/Qt standalone
//   faust2lv2  forty-three-hours-synth.dsp   # LV2 plugin
//   faust2vst  forty-three-hours-synth.dsp   # VST plugin (needs VST SDK)
//
// Parameters:
//   - Phase (0-1): manual scrub through the 43-hour profile
//   - Auto: toggle automatic 90-second playthrough
//   - Intensity: overall volume
//   - Belt Width: stretch/compress the belt regions
//
// Install FAUST: https://faust.grame.fr/downloads/

import("stdfaust.lib");

// --- Parameters ---
phase = hslider("[0]Phase", 0, 0, 1, 0.001) : si.smoo;
auto_mode = checkbox("[1]Auto (90s cycle)");
intensity = hslider("[2]Intensity", 0.7, 0, 1, 0.01) : si.smoo;
belt_width = hslider("[3]Belt Width", 1.0, 0.5, 2.0, 0.01) : si.smoo;

// Auto-advancing phase (90-second cycle)
auto_phase = os.phasor(1, 1.0/90.0);
active_phase = select2(auto_mode, phase, auto_phase);

// --- Altitude mapping ---
// Phase 0.0 = launch (0 km)
// Phase 0.45 = apogee (113,854 km)
// Phase 0.9 = reentry
// Phase 0.9-1.0 = silence / fade
// Outbound occupies 0.0-0.45, return 0.45-0.9

// Normalized altitude: 0 at surface, 1 at apogee
altitude = ba.if(active_phase < 0.45,
             active_phase / 0.45,
           ba.if(active_phase < 0.9,
             1.0 - (active_phase - 0.45) / 0.45,
             0.0));

// --- Radiation intensity envelope ---
// Maps altitude to radiation intensity (0-1)
// Inner belt peak at alt ~0.03 (3,000 km / 113,854 km)
// Slot at alt ~0.07-0.09
// Outer belt peak at alt ~0.15-0.18
// Then falling off

inner_belt_center = 0.026 * belt_width;
inner_belt_width = 0.022 * belt_width;
slot_center = 0.075 * belt_width;
outer_belt_center = 0.155 * belt_width;
outer_belt_width = 0.06 * belt_width;

inner_belt = exp(-((altitude - inner_belt_center) * (altitude - inner_belt_center))
            / (2.0 * inner_belt_width * inner_belt_width));
outer_belt = exp(-((altitude - outer_belt_center) * (altitude - outer_belt_center))
            / (2.0 * outer_belt_width * outer_belt_width)) * 0.85;
background = 0.05 + 0.03 * (1.0 - altitude);  // Decreasing with altitude
radiation = max(inner_belt, max(outer_belt, background));

// Reentry fade
reentry_fade = ba.if(active_phase > 0.88, max(0.0, (0.92 - active_phase) / 0.04), 1.0);

// --- Low Frequency Drone (Background) ---
// Always present, pitch rises slightly with altitude
drone_freq = 40 + altitude * 30;
drone = os.osc(drone_freq) * 0.12
      + os.osc(drone_freq * 1.5) * 0.06
      + os.osc(drone_freq * 0.5) * 0.08;
drone_out = drone * (0.3 + background * 0.5) * reentry_fade;

// --- Inner Belt Sound ---
// Harsh, buzzy, mid-frequency. Geiger counter character.
// Granular noise bursts representing particle impacts
inner_noise = no.noise : fi.resonbp(800 + inner_belt * 2000, 4, 1.0)
            : *(inner_belt * inner_belt);
inner_crackle = no.noise * (no.noise > (1.0 - inner_belt * 0.3))
              : fi.resonbp(3000, 6, 1.0) : *(inner_belt * 0.4);
inner_out = (inner_noise * 0.3 + inner_crackle) * reentry_fade;

// --- Slot Region ---
// Quiet, spacious, filtered. The calm between storms.
slot_proximity = exp(-((altitude - slot_center) * (altitude - slot_center)) / 0.001);
slot_tone = os.osc(220) * 0.05 * slot_proximity
          + os.osc(330) * 0.03 * slot_proximity;
slot_breath = no.pink_noise : fi.resonlp(200, 3, 1.0)
            : *(slot_proximity * 0.08);
slot_out = (slot_tone + slot_breath) * reentry_fade;

// --- Outer Belt Sound ---
// Broader, lower intensity but wider. Swelling mid frequencies.
// Different character from inner belt: more diffuse, less crackling
outer_noise = no.pink_noise : fi.resonlp(1500 + outer_belt * 3000, 2, 1.0)
            : *(outer_belt);
outer_swell = os.osc(150 + outer_belt * 400) * outer_belt * 0.15
            + os.osc(225 + outer_belt * 300) * outer_belt * 0.10;
outer_shimmer = no.noise : fi.resonbp(4000, 8, 1.0)
              : *(outer_belt * 0.15);
outer_out = (outer_noise * 0.25 + outer_swell + outer_shimmer) * reentry_fade;

// --- Deep Space / Apogee ---
// Very quiet, sparse, vast. Occasional faint tones.
deep_space = ba.if(altitude > 0.3, (altitude - 0.3) / 0.7, 0.0);
space_tone = os.osc(60) * 0.03 * deep_space
           + os.osc(90) * 0.02 * deep_space;
space_dust = no.noise * (no.noise > 0.998) * 0.1 * deep_space
           : fi.resonlp(800, 2, 1.0);
space_out = (space_tone + space_dust) * reentry_fade;

// --- Telemetry Pulse ---
// Subtle rhythmic pulse representing the 108.06 MHz carrier
// Continuous throughout the mission, stops at reentry
telem_active = ba.if(active_phase < 0.9, 1.0, 0.0);
telem_pulse = os.osc(108.06) * 0.02 * telem_active
            + os.osc(216.12) * 0.01 * telem_active;
telem_out = telem_pulse * reentry_fade;

// --- Reentry ---
// Brief burst of broadband noise as spacecraft burns up
reentry_env = ba.if(active_phase > 0.88 & active_phase < 0.93,
                exp(-(active_phase - 0.88) * 40.0) *
                min((active_phase - 0.88) / 0.01, 1.0),
                0.0);
reentry_sound = no.noise * reentry_env * 0.4
              : fi.resonlp(2000 + reentry_env * 6000, 1, 1.0);

// --- Mix ---
process = (drone_out + inner_out + slot_out + outer_out + space_out
         + telem_out + reentry_sound)
        * intensity
        : fi.dcblocker
        : fi.resonlp(12000, 1, 1.0)  // Gentle high-cut
        <: _,_;  // Stereo output (mono duplicated)
