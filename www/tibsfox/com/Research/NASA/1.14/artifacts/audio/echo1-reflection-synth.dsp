// Echo 1 — Reflection Synthesis: The Word Made Literal
// FAUST DSP source — compiles to VST, AU, LV2, JACK, CLI
//
// Mission 1.14: Echo 1 (NASA / Delta DM-19)
// SUCCESSFUL LAUNCH — August 12, 1960
//
// Echo 1 was the first passive communications satellite: a 30.5-meter
// aluminized Mylar balloon in low Earth orbit (1,519 x 1,687 km).
// It carried no electronics, no transmitter, no receiver. It was a
// mirror. Ground stations bounced radio signals off its surface and
// received the reflected echo — proving that satellite communication
// was possible using nothing more than geometry and a shiny sphere.
//
// This is the sound of echo. ~60 seconds.
//
// A clear tone is transmitted. After ~11 ms (round-trip light time
// to 1,600 km altitude), it returns — attenuated, distorted by the
// curved surface, doppler-shifted by orbital velocity. Multiple
// reflections arrive from different parts of the sphere, creating
// a smeared, shimmering return. As Echo 1 passes overhead, the
// delay changes, the doppler shifts, and the reflection fades.
//
// Timeline (phase 0→1 → 0→60 seconds):
//   0-10s:  Acquisition — Echo 1 rises above horizon. First faint
//           reflection appears. Delay ~15 ms (longer slant range).
//   10-20s: Approaching — signal strengthens. Delay shortens toward
//           11 ms. Multiple reflections from sphere surface create
//           a shimmering, chorus-like quality.
//   20-35s: Overhead — strongest reflection. Minimum delay (~11 ms).
//           The echo is clear, bright, almost musical. The sphere's
//           curvature creates a spread of arrival times (multipath).
//   35-50s: Receding — signal weakens again. Delay increases.
//           Doppler shift becomes audible as a pitch drop.
//   50-60s: Loss of signal — Echo 1 drops below the horizon.
//           The reflection fades into noise. Silence.
//
// Organism resonance: Physalia physalis (Portuguese man o' war)
//   An inflated gas-filled float (pneumatophore) riding the ocean
//   surface, catching the wind like a sail. Echo 1 was an inflated
//   gas-filled sphere riding the vacuum, catching radio signals
//   like a mirror. Both are passive structures — no propulsion,
//   no active electronics — shaped by their medium, reflecting
//   or refracting what the environment sends their way.
//
// Dedication: Erwin Schrodinger (1887-1961)
//   The wave function: a signal exists everywhere until observed.
//   Echo 1's reflection was a wave that existed as pure potential
//   until a ground station antenna collapsed it into a measurement.
//   Schrodinger's equation describes the same physics that governs
//   the radio waves bouncing off a Mylar balloon in orbit.
//
// Build:
//   faust2jaqt echo1-reflection-synth.dsp    # JACK/Qt standalone
//   faust2lv2  echo1-reflection-synth.dsp    # LV2 plugin
//   faust2vst  echo1-reflection-synth.dsp    # VST plugin (needs VST SDK)
//
// Install FAUST: https://faust.grame.fr/downloads/

import("stdfaust.lib");

// --- Parameters ---
cycle_duration = hslider("[0]Cycle Duration (s)", 60, 30, 120, 1) : si.smoo;
carrier_freq = hslider("[1]Carrier Frequency (Hz)", 660, 200, 2000, 1) : si.smoo;
sphere_shimmer = hslider("[2]Sphere Shimmer", 0.6, 0, 1.0, 0.01) : si.smoo;
echo_wetness = hslider("[3]Echo Wetness", 0.7, 0, 1.0, 0.01) : si.smoo;

// ============================================
// TIME BASE — 0→1 over cycle_duration seconds
// ============================================
phase = os.phasor(1, 1.0 / cycle_duration);
t = phase;  // normalized time 0→1

// ============================================
// PASS GEOMETRY — Echo 1 overhead pass
// ============================================
// Model the satellite's elevation angle during a pass:
// rises at t=0, peaks at t=0.5, sets at t=1.
// Elevation follows a sinusoidal arc.
elevation = sin(t * ma.PI);  // 0 → 1 → 0

// Slant range varies with elevation: minimum at zenith, maximum at horizon
// At zenith: range = altitude = 1600 km
// At horizon: range ≈ 4000 km (geometric)
min_range_km = 1600.0;
max_range_km = 4000.0;
range_km = max_range_km - (max_range_km - min_range_km) * elevation;

// Round-trip delay in seconds: 2 * range / c
// At 1600 km: 2 * 1.6e6 / 3e8 = 10.67 ms
// At 4000 km: 2 * 4e6 / 3e8 = 26.67 ms
// Scaled to audible delay range
delay_scale = 0.025;  // max delay in seconds
round_trip_delay = delay_scale * (range_km / max_range_km);

// ============================================
// SIGNAL STRENGTH — follows elevation
// ============================================
// Signal strength depends on radar cross-section and range^4
// For passive relay: received ∝ 1/range^2 (each leg)
// Combined: ∝ 1/range^4, but we soften for audio
signal_strength = elevation * elevation;  // ∝ sin²(elevation)

// Fade in/out at horizon
horizon_fade = ba.if(t < 0.08, t / 0.08,
               ba.if(t > 0.92, (1.0 - t) / 0.08,
               1.0));

// ============================================
// TRANSMITTED SIGNAL — ground station carrier
// ============================================
// A clean, confident tone representing the ground station transmit
carrier = os.osc(carrier_freq);

// Slight frequency modulation — teletype or voice subcarrier
subcarrier = os.osc(carrier_freq * 1.001 + 20.0 * os.osc(0.5));
tx_signal = carrier * 0.7 + subcarrier * 0.3;

// Transmit envelope — always on during pass
tx_env = horizon_fade * 0.3;

// ============================================
// ECHO — reflected signal from the sphere
// ============================================
// The primary echo: delayed version of the transmitted signal,
// attenuated and distorted by the curved Mylar surface.

// Delay line — round-trip propagation
echo_samples = int(round_trip_delay * ma.SR);
primary_echo(x) = x @ max(1, echo_samples);

// Sphere shimmer — the curved surface creates multipath:
// signals reflecting from different parts of the sphere arrive
// at slightly different times, creating a chorus/flanger effect.
shimmer_depth = sphere_shimmer * 0.003;  // seconds
shimmer_rate1 = 1.7;
shimmer_rate2 = 2.3;
shimmer_rate3 = 3.1;

shimmer_delay1 = int((round_trip_delay + shimmer_depth * os.osc(shimmer_rate1)) * ma.SR);
shimmer_delay2 = int((round_trip_delay + shimmer_depth * os.osc(shimmer_rate2)) * ma.SR);
shimmer_delay3 = int((round_trip_delay + shimmer_depth * 0.7 * os.osc(shimmer_rate3)) * ma.SR);

shimmer_echo1(x) = x @ max(1, shimmer_delay1) * 0.3;
shimmer_echo2(x) = x @ max(1, shimmer_delay2) * 0.2;
shimmer_echo3(x) = x @ max(1, shimmer_delay3) * 0.15;

// ============================================
// DOPPLER SHIFT — orbital velocity effect
// ============================================
// Echo 1 at ~1600 km altitude: v ≈ 7.3 km/s
// Doppler shift: approaching → higher pitch, receding → lower
// Maximum doppler at horizon crossing, zero at zenith
doppler_factor = 1.0 + 0.003 * cos(t * ma.PI);  // approaching/receding

// ============================================
// ATMOSPHERIC EFFECTS — signal degradation
// ============================================
// Low-pass filter simulating atmospheric absorption at low elevation
atm_cutoff = 2000.0 + 6000.0 * elevation;
atm_filter(x) = x : fi.lowpass(2, max(500, atm_cutoff));

// Noise — receiver noise, cosmic background
rx_noise = no.noise * 0.03 * (1.0 - 0.5 * signal_strength) : fi.lowpass(2, 6000);

// ============================================
// MULTIPLE REFLECTIONS — secondary echoes
// ============================================
// Ground reflection → satellite → ground → satellite → ground
// Much weaker, double the delay
double_echo_samples = int(round_trip_delay * 2.0 * ma.SR);
double_echo(x) = x @ max(1, double_echo_samples) * 0.05 * signal_strength;

// ============================================
// COMPOSITION — transmitted signal + echoes
// ============================================

// The transmitted signal (what the ground station sends)
tx_out = tx_signal * tx_env;

// The primary reflected echo
echo_attenuation = signal_strength * echo_wetness * 0.5;
reflected = tx_signal : primary_echo;
shimmer1 = tx_signal : shimmer_echo1;
shimmer2 = tx_signal : shimmer_echo2;
shimmer3 = tx_signal : shimmer_echo3;

echo_composite = (reflected * 0.5 + shimmer1 + shimmer2 + shimmer3)
  * echo_attenuation
  : atm_filter;

// Double bounce (ghost echo)
ghost = tx_signal : double_echo : fi.lowpass(2, 3000);

// Full mix
mix = tx_out + echo_composite + ghost + rx_noise;

// ============================================
// FINAL STAGE — stereo and master
// ============================================
// Transmit signal centered, echo slightly right (coming from sky)
master_env = horizon_fade * 0.5;

output_L = (tx_out * 0.6 + echo_composite * 0.3 + ghost * 0.4 + rx_noise * 0.5) * master_env;
output_R = (tx_out * 0.4 + echo_composite * 0.7 + ghost * 0.6 + rx_noise * 0.5) * master_env;

// Gentle limiter
soft_clip(x) = x : min(0.95) : max(-0.95);

process = output_L : soft_clip, output_R : soft_clip;
