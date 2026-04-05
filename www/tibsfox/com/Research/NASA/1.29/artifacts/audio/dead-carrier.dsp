// dead-carrier.dsp
// FAUST DSP — Ranger 4 Dead Carrier Signal
// Mission 1.29 — Ranger 4 + Pteridium aquilinum
//
// 120-second compression of 64-hour mission:
//   0-2s:   Rich multi-tone telemetry (8 channels, designed data stream)
//   2-3s:   Timer failure — tones cut one by one
//   3-112s: Single carrier tone (960 Hz representing 960 MHz)
//           Amplitude fades as 1/r² (range increasing)
//   112-118s: Slight Doppler shift (lunar gravity acceleration)
//   118-120s: Silence (impact)
//
// The carrier says "I am here" and nothing else.

import("stdfaust.lib");

// Time tracking
t = ba.time / ma.SR;
mission_phase = t / 120.0; // normalized 0-1

// Telemetry tones (8 channels, active only in first 2 seconds)
telemetry_active = t < 2.0;
telem_freqs = (440, 523, 659, 784, 880, 1047, 1175, 1319);
telem_tone(f) = os.osc(f) * 0.08 * telemetry_active;
telemetry = telem_tone(440) + telem_tone(523) + telem_tone(659) + 
            telem_tone(784) + telem_tone(880) + telem_tone(1047) +
            telem_tone(1175) + telem_tone(1319);

// Carrier tone: 960 Hz, present from t=2s to t=118s
carrier_active = (t >= 2.0) & (t < 118.0);

// Range model: signal fades as 1/r²
// Normalize: r goes from 1 (at t=2s) to ~400 (at t=118s)
range = 1.0 + (t - 2.0) * 3.5 : max(1.0);
attenuation = 1.0 / (range * range) : min(1.0);

// Doppler shift: lunar gravity acceleration starting at t=112s
// Shifts carrier down by ~8 Hz over 6 seconds
doppler_shift = (t > 112.0) * (t - 112.0) * 1.3;
carrier_freq = 960.0 - doppler_shift;

carrier = os.osc(carrier_freq) * 0.3 * attenuation * carrier_active;

// Mix
process = (telemetry + carrier) <: _, _;
