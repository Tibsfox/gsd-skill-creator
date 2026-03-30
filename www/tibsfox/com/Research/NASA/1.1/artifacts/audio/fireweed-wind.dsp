// Fireweed Wind — Ambient Audio Effect
// FAUST DSP source — generative ambient based on wind through fireweed
//
// Mission 1.1 Organism: Chamerion angustifolium
// The sound of wind moving through a fireweed meadow
//
// This is a generative audio piece, not a traditional effect.
// It produces continuous ambient sound with no input required.
// Can also process input audio through the wind/flutter filter.
//
// Build:
//   faust2jaqt fireweed-wind.dsp      # Standalone
//   faust2lv2  fireweed-wind.dsp      # LV2 plugin
//
// Concept: Multiple filtered noise sources simulate:
//   - Steady wind (low-frequency, broad)
//   - Stem flutter (mid-frequency, rhythmic from stem oscillation)
//   - Leaf rustle (high-frequency, sparse)
//   - Seed pappus (very high, delicate, intermittent)

import("stdfaust.lib");

// Parameters
wind_speed = hslider("[0]Wind Speed", 0.5, 0, 1, 0.01) : si.smoo;
stem_density = hslider("[1]Stem Density", 0.6, 0, 1, 0.01) : si.smoo;
season = hslider("[2]Season (spring→winter)", 0.3, 0, 1, 0.01) : si.smoo;
mix_input = hslider("[3]Input Mix", 0, 0, 1, 0.01) : si.smoo;

// --- Wind Base ---
// Slowly modulated filtered noise
wind_base = no.pink_noise
          : fi.resonlp(200 + wind_speed * 600, 2, 1.0)
          : *(wind_speed * 0.4)
          : *(1.0 + 0.3 * os.osc(0.07));  // Very slow amplitude modulation

// --- Stem Flutter ---
// Multiple oscillating stems create a chorus of mid-frequency tones
stem_flutter = par(i, 6, single_stem(i)) :> /(6.0)
with {
  single_stem(i) = no.noise
    : fi.resonbp(freq, 8, 1.0)
    : *(envelope)
    : *(stem_density * 0.15)
  with {
    // Each stem has a slightly different resonant frequency
    base_freq = 400 + i * 73;
    // Wind modulates the frequency (stem bending)
    freq = base_freq + wind_speed * 200 * os.osc(0.3 + i * 0.07);
    // Intermittent: stems don't all sound at once
    envelope = 0.5 + 0.5 * os.osc(0.15 + i * 0.04);
  };
};

// --- Leaf Rustle ---
// High-frequency, sparse crinkle sounds
leaf_rustle = no.noise
            : *(no.noise > (0.98 - wind_speed * 0.15))  // Sparse gating
            : fi.resonhp(2000, 1, 1.0)
            : fi.resonlp(8000, 2, 1.0)
            : *(wind_speed * season * 0.08);  // Less rustle in winter (no leaves)

// --- Seed Pappus ---
// Very high, delicate, intermittent wisps (only in seed season: 0.5-0.8)
seed_pappus = no.noise
            : fi.resonbp(6000 + os.osc(0.5) * 2000, 12, 1.0)
            : *(pappus_gate)
            : *(0.03)
with {
  in_season = (season > 0.45) & (season < 0.85);
  pappus_gate = in_season * (no.noise > 0.997) * wind_speed;
};

// --- Process ---
// Generative output mixed with optional input processing
process(input_L, input_R) =
  (gen_L + input_L * mix_input * wind_filter),
  (gen_R + input_R * mix_input * wind_filter)
with {
  gen = wind_base + stem_flutter + leaf_rustle + seed_pappus;
  // Slight stereo spread via delay
  gen_L = gen : de.delay(4410, 0);
  gen_R = gen : de.delay(4410, 147);  // ~3ms offset for width
  // Process input through wind-like filter
  wind_filter = fi.resonlp(300 + wind_speed * 2000,
                            1.5 + wind_speed, 1.0);
};
