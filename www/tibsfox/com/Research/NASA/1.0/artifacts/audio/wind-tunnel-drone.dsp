// Wind Tunnel Drone — NACA Langley Ambient
// FAUST DSP source — the sound of a wind tunnel in continuous operation
//
// Mission 1.0: NASA Agency Founding
// The steady hum of the Variable-Density Tunnel at Langley (1922)
//
// Build:
//   faust2jaqt wind-tunnel-drone.dsp    # Standalone
//   faust2lv2  wind-tunnel-drone.dsp    # LV2 plugin
//
// This is generative ambient: it produces continuous sound with no input.
// The wind tunnel has been running since 1922. It never stops.

import("stdfaust.lib");

// Parameters
speed = hslider("[0]Wind Speed (m/s)", 30, 5, 100, 0.1) : si.smoo;
tunnel_size = hslider("[1]Tunnel Size", 0.5, 0.1, 1.0, 0.01) : si.smoo;
resonance = hslider("[2]Resonance", 0.6, 0, 1, 0.01) : si.smoo;

// --- Fan Motor Hum ---
// Large electric motors driving the tunnel fans
motor_hum = os.osc(60) * 0.05           // 60 Hz mains hum
          + os.osc(120) * 0.03           // 2nd harmonic
          + os.osc(180) * 0.015          // 3rd harmonic
          + os.osc(fan_freq) * 0.04      // Fan blade pass frequency
with {
  // Fan RPM proportional to wind speed, blade pass = RPM * blade_count / 60
  fan_freq = (speed / 100.0) * 800 + 50;  // 50-850 Hz
};

// --- Airflow Broadband ---
// Pink noise shaped by tunnel geometry
airflow = no.pink_noise
        : fi.resonlp(cutoff, 1.5 + resonance, 1.0)
        : *(speed / 100.0 * 0.3)
with {
  // Cutoff rises with speed (higher speed = more high-frequency content)
  cutoff = 200 + speed * 40;
};

// --- Tunnel Resonance ---
// Standing waves in the tunnel create tonal peaks
// Fundamental depends on tunnel length
tunnel_tones = par(i, 4, resonant_mode(i)) :> /(4.0)
with {
  resonant_mode(i) = no.noise
    : fi.resonbp(freq, Q, 1.0)
    : *(0.02 * resonance)
  with {
    base = 340.0 / (20.0 * tunnel_size);  // f = v_sound / (2 * length)
    freq = base * (1.0 + i);              // harmonics
    Q = 15 + resonance * 30;              // sharper at higher resonance
  };
};

// --- Turbulence Flutter ---
// Irregular pressure fluctuations from turbulent eddies
turbulence = no.noise
           : *(no.noise > 0.95)              // sparse impulses
           : fi.resonbp(300 + speed * 5, 3, 1.0)
           : *(speed / 100.0 * 0.05);

// --- Structural Vibration ---
// Low-frequency building vibration from the tunnel
structure = os.osc(23 + tunnel_size * 10) * 0.02  // sub-bass
          + os.osc(47 + tunnel_size * 8) * 0.01;  // low structural

// --- Mix ---
process = (motor_hum + airflow + tunnel_tones + turbulence + structure)
        : fi.dcblocker
        : de.delay(44100, 0)       // left
        , (motor_hum + airflow + tunnel_tones + turbulence + structure)
        : fi.dcblocker
        : de.delay(44100, 331);    // right (~7.5ms for spatial width)
