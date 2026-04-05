// robin-dawn-decay.dsp
// FAUST DSP — American Robin dawn song mapped to orbital decay
// Mission 1.26 — Ranger 1 + Turdus migratorius
//
// Maps Ranger 1's seven-day orbital life to the American Robin's
// dawn chorus. The robin's "cheerily cheer-up cheerio" degrades
// as the orbit decays, transitioning from clear song to fragmented
// calls to noise to silence.
//
// Architecture: FAUST → compile to VST/LV2 or standalone
// Duration: ~90 seconds
// Output: Stereo, 44100 Hz

import("stdfaust.lib");

// === Parameters ===
decay_rate = hslider("Decay Rate", 0.012, 0.001, 0.05, 0.001);
mission_time = hslider("Mission Time (0-1)", 0, 0, 1, 0.001) : si.smoo;

// === Robin Call Generator ===
// "Cheerily cheer-up cheerio" approximated as frequency-modulated tone bursts
// Fundamental: 2.0-3.5 kHz, warbling with ~5 Hz modulation

robin_fundamental = 2500 + 500 * os.osc(5.2);  // warble at 5 Hz
robin_harmonics = os.osc(robin_fundamental) * 0.6 
                + os.osc(robin_fundamental * 2.0) * 0.25
                + os.osc(robin_fundamental * 3.0) * 0.1;

// Envelope: short bursts (0.15s on, 0.1s off) in groups of 3-4
burst_rate = 4.0;  // notes per second
burst_env = max(0, sin(2 * ma.PI * burst_rate * os.phasor(1, burst_rate)));
phrase_env = max(0, sin(2 * ma.PI * 0.3 * os.phasor(1, 0.3)));  // phrase grouping

robin_clean = robin_harmonics * burst_env * phrase_env;

// === Decay Processing ===
// As mission_time increases (0→1), the signal degrades:
// 0.0-0.3: clean robin song
// 0.3-0.7: gradual noise addition, amplitude drops
// 0.7-0.9: fragmented, mostly noise
// 0.9-1.0: silence

signal_strength = max(0, 1.0 - mission_time * 1.2);
noise_level = mission_time * mission_time;  // quadratic noise increase

// White noise (cosmic background)
cosmic_noise = no.noise * 0.3 * noise_level;

// Frequency drift (Doppler analog — orbit is decaying)
freq_shift = 1.0 - mission_time * 0.08;  // slight downward drift

// Signal dropout (intermittent loss as orbit decays)
dropout_rate = mission_time * 8.0;
dropout = max(0, sin(2 * ma.PI * dropout_rate * os.phasor(1, dropout_rate)));

// Combined signal
degraded_robin = robin_clean * signal_strength * dropout + cosmic_noise;

// === Spatial Processing ===
// Early: close, dry (bird nearby)
// Late: distant, reverberant (spacecraft receding)
reverb_amount = mission_time * 0.8;
dry_signal = degraded_robin * (1.0 - reverb_amount);
wet_signal = degraded_robin : fi.lowpass(2, 2000) * reverb_amount;  // simple reverb approximation

// Stereo output
left = dry_signal * 0.7 + wet_signal * 0.5;
right = dry_signal * 0.5 + wet_signal * 0.7;

process = left, right;
