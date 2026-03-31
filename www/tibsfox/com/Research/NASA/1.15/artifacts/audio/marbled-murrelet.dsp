// Marbled Murrelet — Brachyramphus marmoratus Call
// FAUST DSP source — generative ambient seabird vocalization
//
// Mission 1.15 Bird Connection: Marbled Murrelet (degree 15)
// A small, cryptic seabird of the Pacific Northwest. Nests in the
// canopy of old-growth coniferous forests, sometimes 50+ miles
// inland. Flies to the ocean at dawn to feed on small fish and
// zooplankton. One of the most secretive nesting birds in North
// America — its tree-nesting behavior was not confirmed until 1974
// when a nest was discovered in a large Douglas-fir in Big Basin
// Redwoods State Park, California.
//
// Call characteristics:
//   Fundamental frequency: ~4000-6000 Hz (high, thin, piercing)
//   Quality: a rapid series of high-pitched "keer keer keer" notes,
//            sometimes described as "meer meer meer"
//   Duration: each note 0.05-0.12 seconds (very short)
//   Pattern: series of 3-10 notes in rapid succession
//   Timing: primarily at dawn and dusk during breeding season
//   Given while flying over nesting habitat at high speed
//   Both sexes vocalize; call carries well through forest canopy
//
// Acoustic environment:
//   Dawn in old-growth PNW forest. The bird flies just above or
//   through the canopy, calling in rapid bursts. Douglas-fir and
//   western red cedar surround the listener. Fog dampens the sound.
//   Distant ocean surf below. Other forest dawn sounds: varied
//   thrush, winter wren, creaking branches.
//
// Connection to TIROS-1:
//   The Marbled Murrelet commutes between ocean and forest, bridging
//   two worlds the way TIROS-1 bridged Earth and space. The bird's
//   pre-dawn flights over forest canopy are like TIROS-1's orbital
//   passes over weather systems — brief observation windows at dawn,
//   capturing information (nest location / cloud patterns) during
//   each pass. Both are most active at the boundary between light
//   and dark. Both are small, drum-shaped creatures that travel
//   fast and observe from above.
//
// Build:
//   faust2jaqt marbled-murrelet.dsp    # Standalone
//   faust2lv2  marbled-murrelet.dsp    # LV2 plugin

import("stdfaust.lib");

// --- Parameters ---
call_rate = hslider("[0]Call Rate", 0.6, 0.1, 1.0, 0.01) : si.smoo;
forest_volume = hslider("[1]Forest Volume", 0.4, 0, 1.0, 0.01) : si.smoo;
call_intensity = hslider("[2]Call Intensity", 0.7, 0, 1.0, 0.01) : si.smoo;
fog_level = hslider("[3]Fog Dampening", 0.5, 0, 1.0, 0.01) : si.smoo;

// ============================================
// PRIMARY MURRELET — rapid "keer keer keer"
// ============================================
// The Marbled Murrelet produces a rapid series of very short,
// high-pitched, thin notes. Each note is a quick "keer" — a
// sharp nasal whistle with a metallic edge. Notes come in rapid
// bursts of 4-8, with very short gaps between them. The bird
// is usually flying fast while calling, creating a Doppler effect.

// Call timing: rapid burst of notes, then silence (bird has flown past)
burst_period = 10.0 / call_rate;
burst_phase = os.phasor(1, 1.0 / burst_period);
burst_time = burst_phase * burst_period;

// Individual note timing: very rapid — ~6 notes per second
note_period = 0.17 / call_rate;
note_phase = os.phasor(1, 1.0 / note_period);
note_time = note_phase * note_period;

// Note is active for first 0.07s of each note period, only during burst
note_dur = 0.07;
// Burst lasts ~1.2 seconds (7 notes)
burst_active = ba.if(burst_time < 1.2, 1.0, 0.0);
note_active = ba.if(note_time < note_dur, 1.0, 0.0) * burst_active;

// Envelope: extremely fast attack (2ms), very short, fast decay
note_env = note_active *
  ba.if(note_time < 0.002, note_time / 0.002,
  ba.if(note_time > (note_dur - 0.015), (note_dur - note_time) / 0.015,
  1.0));

// --- Frequency contour ---
// "keer": very short upward inflection then sharp cutoff
base_freq = 4800;
// Rapid rise ~400 Hz in first 10ms
rise = ba.if(note_time < 0.01, 1.0 + 0.08 * (note_time / 0.01), 1.08);
// Slight descent through note
descent = ba.if(note_time > 0.01 & note_time < note_dur,
  1.08 - 0.04 * ((note_time - 0.01) / (note_dur - 0.01)),
  rise);
freq_contour = descent;

// --- Thin, nasal quality ---
// Marbled Murrelet calls are thin and penetrating, almost metallic
fund_freq = base_freq * freq_contour;
h1 = os.osc(fund_freq) * 1.0;
h2 = os.osc(fund_freq * 2.003) * 0.35;   // strong second harmonic (nasal quality)
h3 = os.osc(fund_freq * 3.007) * 0.15;   // noticeable third
h4 = os.osc(fund_freq * 4.01) * 0.06;    // thin fourth
// Nasal/metallic edge: narrow band noise around fundamental
nasal = no.noise * 0.08 : fi.bandpass(2, fund_freq * 0.95, fund_freq * 1.05);

primary_call = (h1 + h2 + h3 + h4 + nasal) * note_env * call_intensity * 0.35;

// Doppler effect: bird is flying fast (~80 km/h through canopy)
// Frequency shifts slightly higher approaching, lower receding
doppler_shift = 1.0 + 0.005 * (0.5 - burst_time / burst_period);
primary_call_doppler = primary_call;  // applied via freq_contour modulation

// ============================================
// SECOND MURRELET — distant bird flying past
// ============================================
// Another murrelet on a different flight path, calling faintly
second_period = burst_period * 1.7 + 2.0;
second_phase = os.phasor(1, 1.0 / second_period);
second_time = second_phase * second_period;

second_note_phase = os.phasor(1, 1.0 / (note_period * 0.95));
second_note_time = second_note_phase * note_period * 0.95;

second_burst_active = ba.if(second_time > 3.0 & second_time < 4.5, 1.0, 0.0);
second_note_active = ba.if(second_note_time < 0.06, 1.0, 0.0) * second_burst_active;
second_env = second_note_active *
  ba.if(second_note_time < 0.002, second_note_time / 0.002,
  ba.if(second_note_time > 0.04, (0.06 - second_note_time) / 0.02,
  1.0));

// Slightly different pitch, more distant (attenuated highs)
second_freq = 5200 + 100.0 * os.osc(6.0);
second_call = (os.osc(second_freq) + os.osc(second_freq * 2.0) * 0.2)
  * second_env * call_intensity * 0.12
  : fi.lowpass(2, 6000);  // distance attenuates highs

// ============================================
// FOREST DAWN — old-growth PNW canopy
// ============================================
// Pre-dawn in old-growth forest. Dense canopy of Douglas-fir,
// western red cedar, Sitka spruce. Fog dampening all sound.

// Deep forest ambient — very low frequency canopy resonance
forest_body = no.noise : fi.lowpass(3, 150) : fi.highpass(1, 30) * 0.15;

// Fog: absorbs high frequencies, creates a soft, muffled quality
fog_filter_freq = 4000.0 - 2500.0 * fog_level;

// Branch creak — occasional low groaning
creak_period = 12.0;
creak_phase = os.phasor(1, 1.0 / creak_period);
creak_time = creak_phase * creak_period;
creak_active = ba.if(creak_time > 8.0 & creak_time < 9.5, 1.0, 0.0);
creak_env = creak_active *
  ba.if(creak_time < 8.3, (creak_time - 8.0) / 0.3,
  ba.if(creak_time > 9.2, (9.5 - creak_time) / 0.3,
  1.0));
creak_sound = os.osc(80.0 + 30.0 * os.osc(0.7)) * creak_env * 0.06;

// Varied thrush — distant flute-like tone (common dawn chorus companion)
thrush_period = 7.0;
thrush_phase = os.phasor(1, 1.0 / thrush_period);
thrush_time = thrush_phase * thrush_period;
thrush_active = ba.if(thrush_time < 1.5, 1.0, 0.0);
thrush_env = thrush_active *
  ba.if(thrush_time < 0.1, thrush_time / 0.1,
  ba.if(thrush_time > 1.2, (1.5 - thrush_time) / 0.3,
  1.0));
thrush_freq = 3200 + 100.0 * os.osc(0.3);
thrush_sound = os.osc(thrush_freq) * thrush_env * 0.08;

// Distant ocean surf — barely audible through forest
ocean_noise = no.noise : fi.lowpass(3, 300) : fi.highpass(1, 50);
ocean_swell = 0.3 + 0.7 * (0.5 + 0.5 * os.osc(0.08));
ocean_total = ocean_noise * ocean_swell * 0.04;

forest_total = (forest_body + creak_sound + thrush_sound + ocean_total) * forest_volume
  : fi.lowpass(2, max(1000, fog_filter_freq));

// ============================================
// WIND — gentle pre-dawn breeze through canopy
// ============================================
wind_base = no.noise : fi.bandpass(2, 150, 800) * 0.08;
wind_gust = 0.4 + 0.6 * os.osc(0.04 + 0.01 * os.osc(0.008));
wind_total = wind_base * wind_gust * forest_volume * 0.5;

// ============================================
// COMPOSITION — Murrelet over old-growth forest
// ============================================
// The murrelet's rapid, high-pitched call cuts through the
// fog-dampened forest dawn. The bird flies fast, in and out
// of hearing range — the call appears suddenly, rattles off
// a rapid series, and vanishes.

all_calls = primary_call_doppler + second_call;
all_ambient = forest_total + wind_total;

// Apply fog dampening to everything
all_fogged = (all_calls + all_ambient)
  : fi.lowpass(2, max(2000, 8000.0 - 4000.0 * fog_level));

// Stereo: primary bird flies left to right, second bird far right
// Forest ambient wide
output_L = (primary_call * 0.6 + second_call * 0.1 + all_ambient * 0.55) * 0.5
  : fi.lowpass(2, max(2000, fog_filter_freq));
output_R = (primary_call * 0.4 + second_call * 0.9 + all_ambient * 0.45) * 0.5
  : fi.lowpass(2, max(2000, fog_filter_freq));

// Gentle limiter
soft_clip(x) = x : min(0.95) : max(-0.95);

process = output_L : soft_clip, output_R : soft_clip;
