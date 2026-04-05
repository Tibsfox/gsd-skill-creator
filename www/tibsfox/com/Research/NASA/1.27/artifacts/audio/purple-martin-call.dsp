// purple-martin-call.dsp
// FAUST synthesis: Purple Martin "tchew-wew" call
// Liquid gurgling warble, the largest swallow's song
//
import("stdfaust.lib");

// Martin call: rapid frequency-modulated chirps
chirp_rate = 8;  // chirps per second
chirp_freq = 2800 + 600 * os.osc(chirp_rate);
chirp_env = abs(os.osc(chirp_rate * 2)) : *(0.8) : +(0.2);
martin_call = os.osc(chirp_freq) * chirp_env;

// Gurgling quality: add harmonics and slight roughness
gurgle = os.osc(chirp_freq * 1.5) * 0.3 + 
         os.osc(chirp_freq * 2.1) * 0.15;

// Forest background (wind through ferns)
forest_bg = no.noise : fi.lowpass(2, 800) : *(0.02);

// Combine
process = (martin_call + gurgle) * 0.25 + forest_bg <: _,_;
