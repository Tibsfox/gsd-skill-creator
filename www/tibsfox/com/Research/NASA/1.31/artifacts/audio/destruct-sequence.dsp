// destruct-sequence.dsp — Mariner 1 Mission Timeline Sonification
// FAUST VST/LV2 plugin
// Three phases: launch rumble → oscillating telemetry → destruct silence → Barn Swallow call
// Duration: ~90 seconds
// Mission 1.31 — Mariner 1 (Atlas-Agena B), July 22, 1962

import("stdfaust.lib");

// Phase control (0-1 mapped across 90 seconds)
phase = hslider("Phase", 0, 0, 1, 0.001) : si.smoo;

// Phase 1: Launch rumble (0.0-0.3) — Atlas-Agena B liftoff
// Low-frequency engine roar with rocket exhaust noise
launch_rumble = no.noise * 0.3 : fi.lowpass(3, 120) : *(en.asr(2, 1, 3, launch_gate))
with {
    launch_gate = phase < 0.3;
};

// Telemetry beeps — clean at first, then oscillating
telem_freq = 800 + (phase - 0.3) * 2000 * oscillation_depth;
oscillation_depth = max(0, (phase - 0.35)) * 8 : min(1);
telem_osc = os.osc(telem_freq) * 0.15 * en.asr(0.01, 1, 0.01, telem_gate)
with {
    telem_gate = (phase > 0.1) & (phase < 0.7);
};

// Phase 2: Guidance oscillation (0.3-0.65)
// Frequency modulation representing erratic steering commands
guidance_noise = os.osc(3 + oscillation_depth * 12) * oscillation_depth * 0.4;
guidance_oscillation = guidance_noise * ((phase > 0.3) & (phase < 0.65));

// Phase 3: Destruct (0.65-0.7) — sharp cutoff, explosion burst
destruct_burst = no.noise * 0.8 : fi.bandpass(2, 200, 4000) : *(en.ar(0.001, 0.3, destruct_gate))
with {
    destruct_gate = (phase > 0.65) & (phase < 0.7);
};

// Phase 4: Silence then Barn Swallow call (0.75-1.0)
// Synthesized "liquid twitter" — nasal tones at 3-5 kHz
swallow_freq = 3500 + os.osc(8) * 500;
swallow_call = os.osc(swallow_freq) * 0.12
    : fi.bandpass(2, 3000, 5000)
    : *(en.asr(0.02, 0.08, 0.05, swallow_gate))
with {
    swallow_gate = (phase > 0.78) & (ba.pulse(0.15 * ma.SR) > 0.5);
};

// Ocean ambience (post-destruct)
ocean = no.noise * 0.05 : fi.lowpass(2, 500) : *((phase > 0.7));

// Master mix
process = (launch_rumble + telem_osc + guidance_oscillation + destruct_burst + swallow_call + ocean)
    <: (_, _);
