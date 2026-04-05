// faith7-endurance.dsp
// FAUST VST/LV2 synthesizer: MA-9 endurance sonification
// 120-second piece mapping Cooper's 34-hour flight to sound
//
// Structure:
//   0-20s:  Launch sequence (rumble → roar → silence at MECO)
//   20-40s: Orbital coast (peaceful oscillation, Earth-view ambience)
//   40-60s: Sleep period (low drone, slow breathing rhythm, heart rate at 58 BPM)
//   60-80s: Systems failure (discordant tones entering, static increasing)
//   80-100s: Manual reentry (heartbeat at 116 BPM, growing plasma roar)
//   100-120s: Splashdown (water impact, silence, Western Tanager call)
//
// Synthesis: Subtractive + FM + granular noise
// Target: stereo output, 44.1 kHz

import("stdfaust.lib");

// Time tracking
phase = ba.sweep(1, 1.0/120.0); // 0 to 1 over 120 seconds

// Launch rumble (0-20s): filtered noise + sine bass
launch_env = en.asr(2, 15, 3, phase < 0.167);
launch_rumble = no.noise : fi.lowpass(4, 80 + 120 * launch_env) * 0.3 * launch_env;
launch_roar = os.osc(55) * launch_env * 0.2 + os.osc(110) * launch_env * 0.1;

// Orbital coast (20-40s): gentle sine waves, orbital period rhythm
coast_env = en.asr(2, 14, 2, phase > 0.167 & phase < 0.333);
coast_tone = os.osc(220) * 0.05 * coast_env + os.osc(330) * 0.03 * coast_env;
// 88.5 minute period compressed: ~0.74 Hz pulsation
orbit_pulse = (1 + os.osc(0.74)) * 0.5;
coast = coast_tone * orbit_pulse;

// Sleep period (40-60s): low drone, 58 BPM heartbeat
sleep_env = en.asr(3, 12, 3, phase > 0.333 & phase < 0.5);
sleep_drone = os.osc(65) * 0.04 * sleep_env;
heartbeat_58 = os.lf_pulsetrainpos(58/60, 0.1) : fi.lowpass(2, 40) * 0.15 * sleep_env;
sleep = sleep_drone + heartbeat_58;

// Systems failure (60-80s): discordant, static entering
fail_env = en.asr(1, 16, 1, phase > 0.5 & phase < 0.667);
fail_discord = os.osc(277) * 0.06 + os.osc(311) * 0.04 + os.osc(370) * 0.03;
fail_static = no.noise : fi.bandpass(4, 800, 4000) * 0.08 * (phase - 0.5) * 6;
fail = (fail_discord + fail_static) * fail_env;

// Manual reentry (80-100s): 116 BPM heartbeat, plasma roar
reentry_env = en.asr(1, 16, 1, phase > 0.667 & phase < 0.833);
heartbeat_116 = os.lf_pulsetrainpos(116/60, 0.08) : fi.lowpass(2, 60) * 0.2 * reentry_env;
plasma = no.noise : fi.bandpass(4, 200, 2000) * 0.25 * reentry_env * (phase - 0.667) * 6;
reentry = heartbeat_116 + plasma;

// Splashdown (100-120s): water impact → silence → tanager call
splash_env = en.asr(0.1, 2, 15, phase > 0.833);
splash = no.noise : fi.lowpass(4, 400) * 0.3 * splash_env * max(0, 1 - (phase - 0.833) * 12);
// Western Tanager call approximation: 3-4 kHz warbled tone
tanager_env = en.asr(0.5, 2, 1, phase > 0.917);
tanager = os.osc(3500) * 0.05 * tanager_env * (1 + 0.3 * os.osc(7));

// Mix
output = launch_rumble + launch_roar + coast + sleep + fail + reentry + splash + tanager;
process = output, output; // stereo
