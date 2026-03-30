// Geiger Counter Saturation Sonification — Explorer 1
// FAUST DSP source — compiles to VST, AU, LV2, JACK, CLI
//
// Mission 1.7: Explorer 1 (first US satellite)
// The sound of too much radiation. ~30 seconds per cycle.
//
// On January 31, 1958, Explorer 1 carried a Geiger counter built by
// James Van Allen at the University of Iowa. As the satellite passed
// through what we now call the Van Allen radiation belts, the counter
// registered increasing particle hits — click, click, click — faster
// and faster. Then, paradoxically, the counter read ZERO. Not because
// the radiation had stopped, but because it was so intense that the
// tube never recovered between pulses. The dead time between counts
// exceeded the interval between particles. Saturation. Silence where
// there should have been maximum signal.
//
// Van Allen's genius was recognizing that zero meant maximum. An
// absence that indicated a presence — like the silence of a forest
// so thick with life that no single voice can be distinguished.
//
// Timeline (phase 0-1 → 0-30 seconds, one orbital belt crossing):
//   0-5s:     Low orbit — sparse clicks. Individual Geiger pulses,
//             well-separated. Background cosmic ray rate. Each click
//             is a single particle ionizing the tube gas.
//   5-12s:    Ascending into inner belt — click rate increases.
//             Pulses begin to overlap. The counter is working hard.
//   12-18s:   Belt peak (~1.5 Earth radii) — clicks merge into
//             continuous crackle, then buzz, then roar.
//   18-22s:   SATURATION — the roar suddenly cuts to silence.
//             Dead time dominates. Measured count = zero.
//             The most radiation produces the least signal.
//   22-27s:   Descending from belt — silence breaks into crackle,
//             crackle separates into individual clicks again.
//   27-30s:   Low orbit return — sparse clicks. The cycle repeats.
//
// Organism resonance: Lobaria pulmonaria (lungwort lichen)
//   Lobaria is an air quality indicator — it disappears from forests
//   with high pollution. Its absence indicates a presence (pollution),
//   just as the Geiger counter's silence indicates maximum radiation.
//   The lichen reads the forest the way the counter reads the belt.
//
// Dedication: Robert Bunsen
//   Bunsen and Kirchhoff invented spectroscopy — reading invisible
//   light to discover elements. Van Allen read invisible radiation
//   to discover the belts. Both found truth in what cannot be seen
//   directly. The Bunsen burner's clean flame was designed to NOT
//   interfere with spectral lines — another case where absence
//   (no contaminating light) reveals presence (elemental spectra).
//
// Build:
//   faust2jaqt explorer1-geiger-synth.dsp   # JACK/Qt standalone
//   faust2lv2  explorer1-geiger-synth.dsp   # LV2 plugin
//   faust2vst  explorer1-geiger-synth.dsp   # VST plugin (needs VST SDK)
//
// Install FAUST: https://faust.grame.fr/downloads/

import("stdfaust.lib");

// --- Parameters ---
phase = hslider("[0]Phase", 0, 0, 1, 0.001) : si.smoo;
auto_mode = checkbox("[1]Auto (30s cycle)");
dead_time = hslider("[2]Dead Time (us)", 100, 10, 500, 1) : si.smoo;
volume = hslider("[3]Volume", 0.7, 0, 1, 0.01) : si.smoo;

// Auto-advancing phase (30-second cycle — one belt crossing)
auto_phase = os.phasor(1, 1.0/30.0);
active_phase = select2(auto_mode, phase, auto_phase);

// --- Time mapping (phase 0-1 → 0-30 seconds) ---
time_sec = active_phase * 30.0;

// --- Radiation intensity profile ---
// Models one pass through the inner Van Allen belt
// Bell curve centered at phase 0.6 (18s), representing belt peak at ~1.5 Re
// Explorer 1 orbit: 358 × 2,550 km, period 114.8 min
// Belt peak at ~1,500 km altitude → roughly 40% through ascending arc
belt_center = 0.6;
belt_width = 0.15;
radiation_raw = exp(-(active_phase - belt_center) * (active_phase - belt_center)
                / (2.0 * belt_width * belt_width));

// Scale to count rate: 0 = background (~5 counts/sec), 1.0 = 10^6 counts/sec
// The paralyzable dead time model: N_m = N_t * exp(-N_t * tau)
// At high true rates, measured rate goes to ZERO
background_rate = 5.0;
max_true_rate = 1000000.0;
true_rate = background_rate + radiation_raw * max_true_rate;

// Dead time in seconds (parameter is in microseconds)
tau = dead_time / 1000000.0;

// Paralyzable model: measured = true * exp(-true * tau)
// This naturally produces zero output at high input — the saturation effect
normalized_true = true_rate * tau;
measured_factor = normalized_true * exp(-normalized_true);
// Scale to 0-1 range (peak of x*exp(-x) is at x=1, value=1/e≈0.368)
measured_normalized = measured_factor / 0.368;

// ============================================
// INDIVIDUAL CLICKS (low count rate)
// ============================================
// At low rates, each Geiger pulse is a distinct click:
// a sharp impulse (tube discharge) followed by brief dead time
// Modeled as random impulses gated by measured count rate

// Random click generator — noise threshold creates Poisson-like clicks
click_threshold = 1.0 - measured_normalized * 0.5;
click_raw = no.noise > click_threshold;

// Shape each click: sharp attack, 200us decay (tube discharge waveform)
click_env = click_raw : en.ar(0.0001, 0.002);

// Click sound: broadband impulse filtered to sound like a G-M tube
// G-M tube clicks have a characteristic sharp "tick" sound
click_body = click_raw * no.noise : fi.resonbp(2000, 5.0, 1.0) : *(2.0);
click_high = click_raw * no.noise : fi.resonbp(6000, 8.0, 1.0) : *(0.5);
click_sound = (click_body + click_high) * click_env;

// ============================================
// CONTINUOUS CRACKLE (medium-high rate)
// ============================================
// As clicks merge, individual pulses become a continuous crackle
// then a buzzing roar as the tube fires continuously

crackle_density = max(0.0, measured_normalized - 0.3) / 0.7;
crackle_noise = no.noise : fi.resonlp(4000, 0.6, 1.0);
crackle_texture = no.noise : fi.resonbp(1200, 3.0, 1.0) : *(0.3);
crackle_buzz = os.osc(120) * 0.1 + os.osc(180) * 0.05;
crackle_sound = (crackle_noise * 0.3 + crackle_texture + crackle_buzz)
                * crackle_density * 0.4;

// ============================================
// SATURATION SILENCE
// ============================================
// At the belt peak, radiation is so intense that measured rate = 0
// The sound goes SILENT — the most dramatic moment
// Saturation occurs when true_rate * tau >> 1

saturation_depth = max(0.0, 1.0 - measured_normalized * 5.0);

// During saturation, only a faint electronic hum remains
// (the counter's high-voltage supply, waiting for a pulse that never comes)
hv_hum = os.osc(60) * 0.008 + os.osc(120) * 0.004;
saturation_sound = hv_hum * saturation_depth;

// ============================================
// SPACECRAFT TONE
// ============================================
// Explorer 1's telemetry carrier — a continuous beacon
// 108.00 MHz, represented as a faint background tone
beacon_freq = 440.0;
beacon_tone = os.osc(beacon_freq) * 0.02 + os.osc(beacon_freq * 1.001) * 0.01;

// Doppler shift simulation — frequency changes slightly through orbit
doppler = 1.0 + 0.002 * sin(active_phase * 6.283);
beacon_shifted = os.osc(beacon_freq * doppler) * 0.015;

// ============================================
// SECTION ENVELOPES
// ============================================
// Smooth transitions between sections based on radiation profile

// Low-rate clicks: dominant when measured_normalized < 0.3
click_gain = max(0.0, 1.0 - measured_normalized * 3.0);

// Crackle: dominant in transition zone
crackle_gain = crackle_density * (1.0 - saturation_depth);

// Overall envelope (smooth the transitions)
env_smooth = si.smoo(1.0 - saturation_depth * 0.7);

// ============================================
// Final mix
// ============================================
output = (click_sound * click_gain +
          crackle_sound * crackle_gain +
          saturation_sound +
          beacon_shifted) * volume * env_smooth;

process = output * 0.7 <: _, _;
