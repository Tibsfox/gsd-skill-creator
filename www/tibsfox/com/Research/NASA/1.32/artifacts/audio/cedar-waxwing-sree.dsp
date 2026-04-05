// Cedar Waxwing — Bombycilla cedrorum Thin "Sree" Call
// FAUST DSP source — generative ambient flock vocalization
//
// Mission 1.32 Bird Connection: Cedar Waxwing (degree 31)
// Named for the western red cedar, the mission organism.
// Travels in tight coordinated flocks stripping berries from trees.
//
// The Cedar Waxwing's call is a thin, high-pitched "sree" or "see"
// near the upper edge of human hearing:
//
//   Fundamental frequency: ~6500-8000 Hz (very high, borderline audible for adults)
//   Quality: thin, whistled, almost electronic in purity
//   Duration per note: ~150-300 ms
//   Harmonics: minimal — nearly pure tone
//   Flock effect: multiple individuals calling asynchronously
//     creates a shimmering high-frequency texture
//   Spacing: irregular, 0.5-3 seconds between calls
//
// Call types modeled:
//   Contact call: single "sree", medium duration, steady pitch
//   Flight call: shorter, slightly rising pitch
//   Flock chorus: multiple voices, stochastic timing, slight pitch variation
//
// Berry-laden western red cedar acoustic environment:
//   Calls propagate well through open canopy (high frequency, minimal scattering)
//   Background: wind through cedar foliage (softer than Douglas-fir)
//
// Build:
//   faust2jaqt cedar-waxwing-sree.dsp    # Standalone
//   faust2lv2  cedar-waxwing-sree.dsp    # LV2 plugin

import("stdfaust.lib");

// --- Parameters ---
flock_size = hslider("[0]Flock Size", 5, 1, 12, 1);
call_rate = hslider("[1]Call Rate", 0.4, 0.1, 1.0, 0.01) : si.smoo;
wind_level = hslider("[2]Cedar Wind", 0.3, 0, 1, 0.01) : si.smoo;

// --- Single waxwing call ---
// Thin, pure tone near 7 kHz with slight vibrato
waxwing_voice(seed) = os.osc(freq) * envelope * 0.06
with {
  base_freq = 7000 + 500 * no.noise : fi.lowpass(1, 0.5);
  vibrato = os.osc(12 + seed * 3) * 30;
  freq = base_freq + vibrato + seed * 200;

  // Stochastic trigger based on noise
  trigger = no.noise : fi.lowpass(1, call_rate * 2) : abs > (0.92 - call_rate * 0.3);
  envelope = trigger : si.smoo;
};

// --- Cedar wind background ---
cedar_wind = no.noise : fi.bandpass(2, 2000, 8000)
           * wind_level * 0.02;

// --- Flock (sum of voices) ---
flock = sum(i, 8, waxwing_voice(i + 1) * (i < flock_size));

// --- Output ---
process = (flock + cedar_wind) <: _, _;
