// Red-breasted Nuthatch — Sitta canadensis Nasal "Yank-Yank" Call
// FAUST DSP source — generative ambient forest vocalization
//
// Mission 1.5 Bird Connection: Red-breasted Nuthatch (degree 5)
// Lives in conifer forests alongside Douglas-fir, the mission organism.
// Spirals headfirst down trunks — sees the tree from an angle no other bird does.
//
// The Red-breasted Nuthatch's call is a rapid, nasal "yank-yank-yank"
// sometimes described as a "tin horn" or "toy trumpet." Key characteristics:
//
//   Fundamental frequency: ~1500-2000 Hz (varies with individual/context)
//   Quality: strongly nasal, produced by syringeal constriction
//   Harmonics: dense, closely spaced — creates the "buzzy" timbre
//   Duration per note: ~60-80 ms
//   Repetition: 2-4 notes per burst, 2-3 bursts per second in alarm
//   Spacing: ~100-150 ms between notes in a burst
//   Inter-burst pause: 0.5-2 seconds
//
// Call types modeled:
//   Contact call: slower tempo, 2-3 notes, relaxed spacing
//   Alarm call: faster tempo, 3-4 notes, compressed spacing
//   Territorial: medium tempo, lower pitch, more resonant
//
// Forest acoustic environment:
//   Douglas-fir old-growth canopy provides dense reverb
//   High-frequency attenuation from conifer needles above ~4 kHz
//   Low-frequency masking from wind and stream noise below ~500 Hz
//   The nasal quality of the call cuts through this acoustic niche
//
// Build:
//   faust2jaqt nuthatch-yank.dsp    # Standalone
//   faust2lv2  nuthatch-yank.dsp    # LV2 plugin
//
// This is a generative piece. A primary nuthatch calls on a variable cycle,
// with occasional response calls at different pitch (mate or rival).

import("stdfaust.lib");

// --- Parameters ---
call_rate = hslider("[0]Call Rate", 0.5, 0.1, 1.0, 0.01) : si.smoo;
forest_reverb = hslider("[1]Forest Reverb", 0.6, 0, 1.0, 0.01) : si.smoo;
nasality = hslider("[2]Nasality", 0.7, 0, 1.0, 0.01) : si.smoo;
response_bird = hslider("[3]Response Bird", 0.3, 0, 1.0, 0.01) : si.smoo;

// ============================================
// PRIMARY NUTHATCH — "Yank-yank-yank" call
// ============================================
// Call pattern: 3 rapid nasal notes, pause, repeat
// Each note: ~70 ms duration, ~120 ms gap
// Burst duration: ~570 ms (3 notes)
// Full cycle: ~4-8 seconds depending on call_rate
//
//   Note 1: 0.00-0.07s (yank)
//   Gap:    0.07-0.19s
//   Note 2: 0.19-0.26s (yank)
//   Gap:    0.26-0.38s
//   Note 3: 0.38-0.45s (yank)
//   Silence: 0.45-6.0s (inter-burst interval)

call_period = 6.0 / call_rate;
call_phase = os.phasor(1, 1.0 / call_period);
call_time = call_phase * call_period;

// --- Note envelope: sharp attack, slightly softer release ---
// Models the abrupt syringeal opening and closing
note_env(start, dur) = ba.if(call_time >= start & call_time < start + dur,
    ba.if(call_time < start + 0.005, (call_time - start) / 0.005,  // 5ms attack
    ba.if(call_time > start + dur - 0.015, (start + dur - call_time) / 0.015,  // 15ms release
    1.0)),
    0.0);

// Three notes per burst
note1_env = note_env(0.00, 0.07);
note2_env = note_env(0.19, 0.07);
note3_env = note_env(0.38, 0.07);

// Combined note envelope
burst_env = note1_env + note2_env + note3_env;

// --- Nasal tone generator ---
// The "yank" quality comes from:
// 1. A fundamental around 1700 Hz
// 2. Strong harmonics at 2x, 3x, 4x (nasal resonance)
// 3. Slight downward pitch sweep within each note
// 4. Band-limited noise mixed in (buzzy quality)

base_freq = 1700;
// Slight pitch variation per note (each slightly different)
freq1 = base_freq * (1.0 + 0.02 * os.osc(0.37));
freq2 = base_freq * (0.98 + 0.02 * os.osc(0.41));
freq3 = base_freq * (0.96 + 0.02 * os.osc(0.43));

// Within-note downward sweep (characteristic of the "yank")
sweep_amt = 80;
sweep1 = freq1 - sweep_amt * (call_time / 0.07) * note1_env;
sweep2 = freq2 - sweep_amt * ((call_time - 0.19) / 0.07) * note2_env;
sweep3 = freq3 - sweep_amt * ((call_time - 0.38) / 0.07) * note3_env;

// Active frequency (whichever note is sounding)
active_freq = sweep1 * note1_env + sweep2 * note2_env + sweep3 * note3_env;
safe_freq = max(active_freq, 100);

// Fundamental
fundamental = os.osc(safe_freq) * 0.25;

// Nasal harmonics — closely spaced, creating buzzy timbre
harm2 = os.osc(safe_freq * 2.0) * 0.20 * nasality;
harm3 = os.osc(safe_freq * 3.0) * 0.15 * nasality;
harm4 = os.osc(safe_freq * 4.0) * 0.08 * nasality;
harm5 = os.osc(safe_freq * 5.0) * 0.04 * nasality;

// Nasal resonance — bandpass around 3000-4000 Hz (formant of "nasal" quality)
nasal_noise = no.noise : fi.resonbp(3400, 6, 1.0) : *(0.06 * nasality);

// Combined nasal tone
primary_tone = (fundamental + harm2 + harm3 + harm4 + harm5 + nasal_noise) * burst_env;

// ============================================
// RESPONSE BIRD — offset timing, different pitch
// ============================================
// A second nuthatch, slightly higher pitch (female or rival male),
// calling 2-3 seconds after the primary, at lower volume.
resp_period = call_period * 1.13;  // slightly different rhythm
resp_phase = os.phasor(1, 1.0 / resp_period);
resp_time = resp_phase * resp_period;

// Two notes instead of three (shorter response)
resp_note1 = ba.if(resp_time >= 0.00 & resp_time < 0.065,
    ba.if(resp_time < 0.005, resp_time / 0.005,
    ba.if(resp_time > 0.050, (0.065 - resp_time) / 0.015, 1.0)),
    0.0);
resp_note2 = ba.if(resp_time >= 0.17 & resp_time < 0.235,
    ba.if(resp_time < 0.175, (resp_time - 0.17) / 0.005,
    ba.if(resp_time > 0.220, (0.235 - resp_time) / 0.015, 1.0)),
    0.0);

resp_env = resp_note1 + resp_note2;

// Higher pitch (female response)
resp_freq = 1950;
resp_active = (resp_freq - 60 * resp_note1) * resp_note1 +
              (resp_freq * 0.97 - 60 * resp_note2) * resp_note2;
resp_safe = max(resp_active, 100);

resp_fund = os.osc(resp_safe) * 0.18;
resp_h2 = os.osc(resp_safe * 2.0) * 0.14 * nasality;
resp_h3 = os.osc(resp_safe * 3.0) * 0.08 * nasality;
resp_nasal = no.noise : fi.resonbp(3800, 6, 1.0) : *(0.04 * nasality);

response_tone = (resp_fund + resp_h2 + resp_h3 + resp_nasal) * resp_env * response_bird;

// ============================================
// FOREST AMBIENT — Douglas-fir old-growth canopy
// ============================================
// Wind through conifer needles, distant stream, deep reverb

// Wind — filtered noise with slow modulation
wind_mod = 0.3 + 0.2 * os.osc(0.08);
wind = no.noise : fi.resonlp(800 * wind_mod, 0.5, 1.0) : *(0.015);

// Distant stream — very low constant wash
stream = no.noise : fi.resonlp(2000, 0.3, 1.0) : *(0.008);

// Canopy drip (occasional, quiet)
drip_rate = os.phasor(1, 0.13);
drip = os.osc(3200) * 0.004 * ba.if(drip_rate < 0.01, 1.0 - drip_rate / 0.01, 0.0);

forest_ambient = wind + stream + drip;

// ============================================
// FOREST REVERB
// ============================================
// Old-growth Douglas-fir forest: massive trunks create long early reflections,
// dense canopy absorbs high frequencies. Very long low-freq reverb tail.

// Simple comb filter reverb simulating trunk reflections
dry_signal = primary_tone + response_tone;

// Multiple delay lines at different lengths (trunk spacing ~10-30m)
d1 = dry_signal : @(int(ma.SR * 0.029)) * 0.25;  // ~10m trunk
d2 = dry_signal : @(int(ma.SR * 0.058)) * 0.20;  // ~20m trunk
d3 = dry_signal : @(int(ma.SR * 0.087)) * 0.15;  // ~30m trunk
d4 = dry_signal : @(int(ma.SR * 0.145)) * 0.10;  // ~50m distant

// High-frequency absorption by canopy (roll off above 3 kHz)
reverb_raw = (d1 + d2 + d3 + d4) : fi.resonlp(3000, 0.5, 1.0);
reverb = reverb_raw * forest_reverb;

// ============================================
// MASTER MIX
// ============================================
// Direct signal + reverb + ambient
raw = (dry_signal + reverb + forest_ambient) * 0.8;

// Soft limiting
limited = raw : ef.compressor_mono(3, -6, 0.005, 0.05);

// Stereo: primary slightly left, response slightly right, ambient wide
pan_primary = primary_tone * 0.4;
pan_response = response_tone * 0.4;
left = limited + pan_primary - pan_response * 0.3;
right = limited - pan_primary * 0.3 + pan_response;

process = left, right;
