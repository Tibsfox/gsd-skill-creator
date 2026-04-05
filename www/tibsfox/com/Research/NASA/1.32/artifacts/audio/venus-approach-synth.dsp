// Venus Approach — Mariner 2 Cruise to Venus Synthesizer
// FAUST DSP source — compiles to VST, AU, LV2, JACK, CLI
//
// Mission 1.32: Mariner 2 (Atlas-Agena B / JPL)
// The sound of endurance. ~120 seconds.
//
// Mariner 2 launched August 27, 1962 — five weeks after its identical
// twin Mariner 1 was destroyed at T+293 seconds. The backup spacecraft
// survived solar panel failure, overheating, gyroscope loss, and 109 days
// of interplanetary cruise to become the first successful interplanetary
// mission. On December 14, 1962, it measured Venus at 460°C with no
// magnetic field.
//
// Timeline (mission phase → synth time):
//   0-10s:     Pre-launch — Mariner 1 destruction echo (brief static burst,
//              then silence, then the countdown resumes for the backup)
//   10-25s:    Launch — Atlas-Agena B roar, two burns (parking orbit + TVI),
//              spacecraft separation, solar panel deploy (stereo spread opens)
//   25-50s:    Early cruise — steady interplanetary hum, the solar wind as
//              broadband noise filtered through the spacecraft's structure.
//              Solar panel failure at ~35s: one channel drops out abruptly.
//              The remaining panel carries a slightly strained tone (higher pitch).
//   50-75s:    Mid-cruise — temperature rising (distortion increasing slowly),
//              gyroscope failure at ~60s (rhythmic pulsing becomes irregular),
//              Earth sensor glitches (brief dropout/recovery cycles)
//   75-95s:    Venus approach — the planet's presence as a growing harmonic
//              cluster. Thermal emission from Venus as a deep, warm drone
//              building in intensity. Solar wind interaction as high shimmer.
//   95-110s:   FLYBY — microwave radiometer scan as three sweeping filter
//              passes across a broad spectrum. Each scan reveals the 460°C
//              signal as a deep, furnace-like roar beneath the cloud noise.
//              Magnetometer silence: a conspicuous absence of magnetic hum.
//              The temperature reading: a resonant chord at 460 Hz (symbolic).
//   110-120s:  Post-flyby — Venus recedes. Signal degrades. Fade to
//              interplanetary silence. A single, thin tone: the heliocentric
//              orbit continuing. Then nothing.
//
// Organism resonance: Western Red Cedar
//   Launch = seedling emergence from forest floor
//   Panel failure = branch loss in wind storm
//   Mid-cruise overheating = summer drought stress
//   Venus approach = centuries of slow growth reaching maturity
//   Flyby data = the heartwood revealed (thujaplicin = the hidden signal)
//   Post-flyby silence = the fallen log, persisting for a millennium

import("stdfaust.lib");

// --- Parameters ---
mission_phase = hslider("[0]Mission Phase", 0, 0, 1, 0.001) : si.smoo;
panel_health = hslider("[1]Solar Panel", 1, 0, 1, 0.01) : si.smoo;
venus_proximity = hslider("[2]Venus Proximity", 0, 0, 1, 0.001) : si.smoo;
temperature = hslider("[3]Temperature", 0.3, 0, 1, 0.01) : si.smoo;

// --- Oscillators ---
// Solar wind broadband
solar_wind = no.noise : fi.lowpass(2, 800 + venus_proximity * 2000) * 0.05;

// Spacecraft hum (carrier tone)
carrier = os.osc(960 * (1 + temperature * 0.1)) * 0.1 * panel_health;

// Venus thermal emission (deep warm drone)
venus_drone = os.osc(46) * venus_proximity * 0.3
            + os.osc(92) * venus_proximity * 0.15
            + os.osc(138) * venus_proximity * 0.08;

// Radiometer sweep (filter sweep during flyby)
sweep_freq = 200 + 3000 * (0.5 + 0.5 * os.osc(0.3 * venus_proximity));
radiometer = no.noise : fi.bandpass(4, sweep_freq, sweep_freq * 1.1)
           * venus_proximity * venus_proximity * 0.2;

// Temperature distortion
distorted = carrier : ef.cubicnl(temperature * 0.8, 0);

// --- Mix ---
process = (solar_wind + distorted + venus_drone + radiometer)
        * (0.3 + 0.7 * mission_phase)
        <: _, _;
