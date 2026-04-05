// tree-swallow-liquid.dsp
// FAUST DSP — Tree Swallow (Tachycineta bicolor) Liquid Song
// Mission 1.29 — Ranger 4
//
// Tree Swallow song: liquid, warbling, iridescent
// Frequency range: 3-7 kHz with rapid frequency glides
// Temporal pattern: 2-3 second phrases with 1-2 second gaps
// Character: wet, gurgling, silvery — like water over stones
//
// The bird that depends on cavities it cannot create.
// The song that collapses when noise overwhelms it.

import("stdfaust.lib");

// Time
t = ba.time / ma.SR;

// Phrase structure: 2.5s on, 1.5s off (4s cycle)
phrase_cycle = t : %(4.0);
phrase_active = phrase_cycle < 2.5;
phrase_env = phrase_active * (1.0 - (phrase_cycle / 2.5) : max(0) : min(1)) : si.smoo;

// Liquid frequency modulation: rapid warbles between 3.5-6 kHz
warble_rate = 12.0 + 4.0 * os.osc(0.7); // 8-16 Hz warble
base_freq = 4500 + 1200 * os.osc(warble_rate) + 500 * os.osc(1.3);

// Multiple harmonics for richness
fund = os.osc(base_freq) * 0.3;
h2 = os.osc(base_freq * 1.5) * 0.15; // slightly inharmonic — natural
h3 = os.osc(base_freq * 2.02) * 0.08;

// Amplitude shimmer (iridescent quality)
shimmer = 0.7 + 0.3 * os.osc(7.3);

// Dawn chorus: slight reverb suggestion
raw = (fund + h2 + h3) * phrase_env * shimmer * 0.4;

// Simple delay for spaciousness
delayed = raw@(ma.SR * 0.035) * 0.3;

process = (raw + delayed) <: _, _;
