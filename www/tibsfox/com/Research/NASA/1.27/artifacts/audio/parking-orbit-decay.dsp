// parking-orbit-decay.dsp
// FAUST synthesis: Ranger 2 parking orbit sonification
// A tone repeats 33 times (33 orbits), each cycle lower in pitch
// and noisier (signal degradation), ending abruptly (reentry)
//
// Compile: faust2lv2 parking-orbit-decay.dsp
//          faust2jack parking-orbit-decay.dsp
//
import("stdfaust.lib");

// Parameters
orbit_period = 3.0;  // seconds per orbit (compressed from 88 min)
total_orbits = 33;
decay_rate = 0.02;   // pitch drops 2% per orbit

// Orbit counter from phasor
orbit_phase = os.phasor(1, 1/orbit_period);
orbit_num = int(orbit_phase * total_orbits) : min(total_orbits);

// Base frequency decays with orbit number
base_freq = 440 * (1 - decay_rate * orbit_num);

// Signal: sine tone with increasing noise
signal_clean = os.osc(base_freq);
noise_level = orbit_num / total_orbits * 0.5;
signal_noisy = signal_clean * (1 - noise_level) + no.noise * noise_level;

// Amplitude envelope: pulses at each orbit perigee
perigee_pulse = orbit_phase : -(int(orbit_phase)) : 
    *(2*ma.PI) : sin : max(0) : *(2) : min(1);

// Cutoff at reentry
alive = orbit_num < total_orbits;

// Output
process = signal_noisy * perigee_pulse * 0.3 * alive <: _,_;
