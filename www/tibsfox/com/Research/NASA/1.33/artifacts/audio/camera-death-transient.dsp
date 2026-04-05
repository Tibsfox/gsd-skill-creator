// Camera Death Transient — Ranger 6 Mission Sonification
// FAUST DSP plugin: VST/LV2/standalone
// Three phases: launch ascent, electrical arc at staging, 60s blind transit, impact
//
// Mission 1.33 — Ranger 6 (Atlas-Agena B), January 30, 1964
// The spacecraft that hit the Moon with dead cameras
//
// Phase 1 (0-30s): Clean ascending tone — Atlas launch, rising pitch
//   representing altitude gain, rumble of engines, building intensity
// Phase 2 (30s): ELECTRICAL ARC — violent burst of white noise + high-freq
//   transient lasting 0.5s, representing the staging transient that killed
//   the cameras. Abrupt. Destructive. Brief.
// Phase 3 (30.5-90s): Near-silence. A faint, thin carrier tone at 960 MHz
//   scaled to audio — the spacecraft's transmitter still working, still
//   sending tracking data, but the cameras are dead. The absence of imaging
//   data IS the sound. Subtle Doppler drift as the spacecraft recedes.
// Phase 4 (90-95s): Impact — low-frequency thud, no camera chirp, no
//   imaging confirmation tone. Just the physics of 381 kg at 9.39 km/s.
//   Silence after impact.
//
// Duration: 95 seconds
// Output: Stereo

import("stdfaust.lib");

// Time tracking
phase = ba.sweep(1, 1.0/ma.SR) : min(95.0);

// Phase 1: Launch ascent (0-30s) — rising sawtooth through bandpass
launch_freq = 80 + phase * 15;  // 80 Hz → 530 Hz over 30s
launch_osc = os.sawtooth(launch_freq) * 0.3;
launch_rumble = no.noise * 0.15 : fi.lowpass(2, 200 + phase * 10);
launch_env = (phase < 30) * min(phase/2, 1.0);
launch = (launch_osc + launch_rumble) * launch_env;

// Phase 2: Electrical arc (30-30.5s) — violent transient
arc_active = (phase >= 30) & (phase < 30.5);
arc_noise = no.noise * 1.5 : fi.highpass(2, 2000);
arc_crack = os.osc(8000) * 0.8 * (1 - (phase - 30) * 4) : max(0);
arc = (arc_noise + arc_crack) * arc_active;

// Phase 3: Blind transit (30.5-90s) — thin carrier tone
carrier_freq = 440 * (1 - (phase - 30.5) * 0.0003);  // slight Doppler drift
carrier = os.osc(carrier_freq) * 0.02;
transit_env = (phase >= 30.5) & (phase < 90);
transit = carrier * transit_env;

// Phase 4: Impact (90-95s) — low thud
impact_active = (phase >= 90) & (phase < 95);
impact_thud = no.noise * 0.8 : fi.lowpass(2, 80) * max(0, 1 - (phase - 90) * 0.5);
impact = impact_thud * impact_active;

// Mix
mono = launch + arc + transit + impact : fi.dcblocker;
process = mono <: (_, _);
