// Pioneer 5 — The Long Call: Signal Fading Into Distance
// FAUST DSP source — compiles to VST, AU, LV2, JACK, CLI
//
// Mission 1.13: Pioneer 5 (NASA / Thor-Able IV)
// SUCCESSFUL LAUNCH — March 11, 1960
//
// Pioneer 5 was the first true interplanetary probe, achieving
// heliocentric orbit between Earth and Venus. Its 5-watt transmitter
// maintained contact out to 36.2 million kilometers — a record that
// stood for years. The signal was a whisper across the solar system.
//
// This is the sound of distance. ~60 seconds.
//
// A clear, confident tone begins close to Earth. As Pioneer 5 recedes,
// the signal degrades: noise rises, volume drops following the inverse-
// square law, echo/delay increases (light-speed propagation delay),
// and the tone wavers as the signal-to-noise ratio drops below
// threshold. Then — silence. The probe is still transmitting.
// We just can't hear it anymore.
//
// Timeline (phase 0→1 → 0→60 seconds):
//   0-8s:   Close — clear, strong tone. 5W at short range. Clean.
//   8-18s:  Receding — signal still solid but noise floor rising.
//           First hints of echo (light-travel delay becoming audible).
//   18-30s: Deep space — noise competing with signal. Volume dropping.
//           Echo delay growing. The tone wavers, amplitude uncertain.
//   30-45s: Extreme range — signal barely above noise. Fading in
//           and out as antenna orientation drifts. The inverse-square
//           law is winning. Crackle and hiss dominate.
//   45-55s: Record distance — 36.2 million km. The signal is a ghost.
//           Intermittent detection, mostly noise. One last fragment
//           of the carrier tone surfaces, then sinks again.
//   55-60s: Silence. Pioneer 5 still transmits its 5 watts into the void.
//           But 1/r² has won. The noise is all that remains.
//           Then even the noise fades, leaving only the hum of space.
//
// Organism resonance: Halichondria panicea (breadcrumb sponge)
//   A filter feeder that extracts signal from noise — it pulls
//   nutrients from an ocean of water, finding the meaningful particles
//   among the meaningless ones. Like a deep-space receiver trying to
//   extract Pioneer 5's 5 watts from the cosmic background.
//
// Dedication: Douglas Adams (1952-2001)
//   "Space is big. Really big. You just won't believe how vastly,
//   hugely, mind-bogglingly big it is." Adams understood the comedy
//   and tragedy of distance — the absurdity of a tiny signal
//   crossing millions of kilometers of nothing, and the even greater
//   absurdity of someone on the other end actually listening for it.
//
// Build:
//   faust2jaqt pioneer5-distance-synth.dsp    # JACK/Qt standalone
//   faust2lv2  pioneer5-distance-synth.dsp    # LV2 plugin
//   faust2vst  pioneer5-distance-synth.dsp    # VST plugin (needs VST SDK)
//
// Install FAUST: https://faust.grame.fr/downloads/

import("stdfaust.lib");

// --- Parameters ---
cycle_duration = hslider("[0]Cycle Duration (s)", 60, 30, 120, 1) : si.smoo;
carrier_freq = hslider("[1]Carrier Frequency (Hz)", 880, 200, 2000, 1) : si.smoo;
noise_floor = hslider("[2]Initial Noise Floor", 0.02, 0, 0.2, 0.01) : si.smoo;
echo_max = hslider("[3]Max Echo (s)", 0.8, 0.1, 2.0, 0.1) : si.smoo;

// ============================================
// TIME BASE — 0→1 over cycle_duration seconds
// ============================================
phase = os.phasor(1, 1.0 / cycle_duration);
t = phase;  // normalized time 0→1

// ============================================
// INVERSE-SQUARE LAW ATTENUATION
// ============================================
// Signal power drops as 1/r². Distance increases linearly with time.
// At t=0: distance = 1 (arbitrary unit, close), at t=1: distance = 100
// Power ∝ 1/r² → amplitude ∝ 1/r
distance = 1.0 + 99.0 * t;
signal_amplitude = 1.0 / distance;

// ============================================
// CARRIER SIGNAL — Pioneer 5's 5W beacon
// ============================================
// A pure tone that represents the spacecraft telemetry carrier.
// Slight frequency drift from Doppler as relative velocity changes.
doppler_shift = 1.0 + 0.002 * os.osc(0.07);
carrier = os.osc(carrier_freq * doppler_shift);

// ============================================
// NOISE — cosmic background + receiver noise
// ============================================
// Noise floor is constant; what changes is the signal level.
// As signal drops, the SNR drops, and noise dominates.
cosmic_noise = no.noise * (noise_floor + 0.5 * t * t);
receiver_hiss = no.noise * 0.03 : fi.lowpass(2, 8000);
total_noise = cosmic_noise + receiver_hiss;

// ============================================
// SIGNAL FADING — amplitude envelope
// ============================================
// Smooth envelope following the inverse-square law with additional
// antenna pointing uncertainty at long range.
antenna_wander = ba.if(t > 0.4,
  0.6 + 0.4 * (0.5 + 0.5 * os.osc(0.3 + t * 2.0)),
  1.0);

// Complete signal extinction beyond t=0.9
extinction = ba.if(t > 0.85,
  max(0.0, (0.95 - t) / 0.1),
  1.0);

signal_envelope = signal_amplitude * antenna_wander * extinction;

// ============================================
// ECHO / DELAY — light-travel time
// ============================================
// At 36.2 million km, one-way light time is ~121 seconds.
// We compress this to an audible echo that grows with distance.
// Using a simple feedback delay that increases with time.
echo_time = echo_max * t * t;  // quadratic growth
echo_samples = int(echo_time * ma.SR);
echo_fb = 0.3 * t;  // feedback increases with distance

echo_line(x) = x + echo_fb * (x @ max(1, echo_samples));

// ============================================
// LOW-PASS FILTER — bandwidth narrowing
// ============================================
// As SNR drops, the receiver narrows bandwidth to improve SNR.
// This removes high-frequency detail from the signal.
bandwidth = 6000.0 * (1.0 - 0.8 * t);
signal_filtered(x) = x : fi.lowpass(2, max(200, bandwidth));

// ============================================
// COMPOSITION — signal + noise through distance
// ============================================
// Clean signal path
clean_signal = carrier * signal_envelope;

// Apply echo and filtering
processed_signal = clean_signal : echo_line : signal_filtered;

// Mix signal and noise
mix = processed_signal + total_noise;

// ============================================
// FINAL STAGE — master envelope and stereo
// ============================================
// Gentle fade-in at the start, silence at the end
master_env = ba.if(t < 0.02, t / 0.02,
             ba.if(t > 0.92, max(0.0, (1.0 - t) / 0.08),
             1.0));

// Stereo: signal is centered, noise wanders
pan_signal = 0.0;
pan_noise = 0.3 * os.osc(0.13);

output_L = (mix * (0.5 - pan_noise * 0.5) + processed_signal * 0.5) * master_env * 0.4;
output_R = (mix * (0.5 + pan_noise * 0.5) + processed_signal * 0.5) * master_env * 0.4;

process = output_L, output_R;
