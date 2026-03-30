// Western Tanager — Piranga ludoviciana Song
// FAUST DSP source — generative ambient forest vocalization
//
// Mission 1.10 Bird Connection: Western Tanager (degree 10)
// A flame-orange bird of the conifer forests. Male has brilliant red head,
// yellow body, black wings. Song is a hoarse, burry robin-like series of
// rising and falling phrases: "cheer-up, cheerily, cheer-up" but rougher,
// huskier than a robin's clean whistle.
//
// The Western Tanager breeds in conifer forests across western North America.
// It forages high in the canopy — often invisible despite vivid plumage,
// known mainly by its distinctive burry song.
//
// Song characteristics:
//   Fundamental frequency: ~2000-4000 Hz (variable, characteristic burry quality)
//   Quality: hoarse, rough, like a robin with a sore throat
//   Harmonics: dense and slightly dissonant — creating the "burry" timbre
//   Phrase structure: 3-5 syllables per phrase, alternating up-down pitch
//   Phrase duration: ~0.8-1.2 seconds
//   Inter-phrase pause: ~1.5-3.0 seconds
//   Total song bout: 5-15 phrases before pausing
//
// Modeled call types:
//   Song phrase: "cheer-up cheerily" — alternating 2-note and 3-note groups
//   Call note: sharp "pit-er-ick" — a brief, distinctive flight call
//
// Forest acoustic environment:
//   Open conifer canopy (mixed ponderosa/Douglas-fir)
//   More open than dense old-growth — tanagers prefer forest edges and openings
//   Moderate reverb, some wind, less dense than deep forest
//
// Build:
//   faust2jaqt western-tanager.dsp    # Standalone
//   faust2lv2  western-tanager.dsp    # LV2 plugin

import("stdfaust.lib");

// --- Parameters ---
call_rate = hslider("[0]Call Rate", 0.5, 0.1, 1.0, 0.01) : si.smoo;
forest_reverb = hslider("[1]Forest Reverb", 0.4, 0, 1.0, 0.01) : si.smoo;
burriness = hslider("[2]Burriness", 0.7, 0, 1.0, 0.01) : si.smoo;
response_bird = hslider("[3]Response Bird", 0.3, 0, 1.0, 0.01) : si.smoo;

// ============================================
// PRIMARY TANAGER — "cheer-up, cheerily" song
// ============================================
// Phrase pattern: rising-falling pairs of syllables
// Each syllable: ~150-200 ms
// Phrase: ~1.0 s of singing, then 2-4s pause
//
//   Syllable 1: 0.00-0.18s  "cheer" (rising sweep ~2200→3000 Hz)
//   Gap:        0.18-0.24s
//   Syllable 2: 0.24-0.40s  "up" (falling sweep ~3200→2400 Hz)
//   Gap:        0.40-0.50s
//   Syllable 3: 0.50-0.68s  "cheer" (rising ~2400→3200 Hz)
//   Gap:        0.68-0.74s
//   Syllable 4: 0.74-0.88s  "i" (brief high ~3400 Hz)
//   Syllable 5: 0.88-1.05s  "ly" (descending ~3200→2000 Hz)
//   Silence:    1.05-5.0s

song_period = 5.0 / call_rate;
song_phase = os.phasor(1, 1.0 / song_period);
song_time = song_phase * song_period;

// --- Syllable envelope: slightly slower attack than nuthatch, burry release ---
syl_env(start, dur) = ba.if(song_time >= start & song_time < start + dur,
    ba.if(song_time < start + 0.012, (song_time - start) / 0.012,
    ba.if(song_time > start + dur - 0.025, (start + dur - song_time) / 0.025,
    1.0)),
    0.0);

// Five syllables per phrase
s1_env = syl_env(0.00, 0.18);   // "cheer"
s2_env = syl_env(0.24, 0.16);   // "up"
s3_env = syl_env(0.50, 0.18);   // "cheer"
s4_env = syl_env(0.74, 0.12);   // "i"
s5_env = syl_env(0.88, 0.17);   // "ly"

phrase_env = s1_env + s2_env + s3_env + s4_env + s5_env;

// --- Burry tone generator ---
// Western Tanager song is like a robin's but hoarser, burrier.
// 1. Fundamental sweeps within each syllable
// 2. Dense, slightly dissonant harmonics (the burry quality)
// 3. Amplitude-modulated noise overlay (the "rough" texture)

// Frequency sweeps per syllable
freq1 = (2200 + 800 * ((song_time - 0.00) / 0.18)) * s1_env;   // rising
freq2 = (3200 - 800 * ((song_time - 0.24) / 0.16)) * s2_env;   // falling
freq3 = (2400 + 800 * ((song_time - 0.50) / 0.18)) * s3_env;   // rising
freq4 = 3400 * s4_env;                                           // steady high
freq5 = (3200 - 1200 * ((song_time - 0.88) / 0.17)) * s5_env;  // descending

active_freq = freq1 + freq2 + freq3 + freq4 + freq5;
safe_freq = max(active_freq, 100);

// Fundamental
fundamental = os.osc(safe_freq) * 0.18;

// Burry harmonics — slightly detuned for roughness
harm2 = os.osc(safe_freq * 2.02) * 0.12 * burriness;
harm3 = os.osc(safe_freq * 2.98) * 0.08 * burriness;
harm4 = os.osc(safe_freq * 4.03) * 0.04 * burriness;
// Subharmonic roughness — creates the "hoarse" quality
sub_rough = os.osc(safe_freq * 0.498) * 0.06 * burriness;

// Amplitude-modulated noise for burry texture
burr_noise = no.noise : fi.resonbp(safe_freq * 1.5, 5, 1.0) : *(0.05 * burriness);
// Rapid amplitude modulation (~100 Hz) creates buzz
am_mod = 0.5 + 0.5 * os.osc(110);
burr_am = burr_noise * am_mod;

primary_tone = (fundamental + harm2 + harm3 + harm4 + sub_rough + burr_am) * phrase_env;

// ============================================
// RESPONSE BIRD — nearby male, different timing
// ============================================
// A second Western Tanager, counter-singing from an adjacent territory.
// Slightly different pitch (individual variation), offset timing.
resp_period = song_period * 1.27;
resp_phase = os.phasor(1, 1.0 / resp_period);
resp_time = resp_phase * resp_period;

// Shorter phrase — 3 syllables instead of 5
r1_env = ba.if(resp_time >= 0.00 & resp_time < 0.17,
    ba.if(resp_time < 0.010, resp_time / 0.010,
    ba.if(resp_time > 0.145, (0.17 - resp_time) / 0.025, 1.0)),
    0.0);
r2_env = ba.if(resp_time >= 0.23 & resp_time < 0.40,
    ba.if(resp_time < 0.240, (resp_time - 0.23) / 0.010,
    ba.if(resp_time > 0.375, (0.40 - resp_time) / 0.025, 1.0)),
    0.0);
r3_env = ba.if(resp_time >= 0.48 & resp_time < 0.66,
    ba.if(resp_time < 0.490, (resp_time - 0.48) / 0.010,
    ba.if(resp_time > 0.635, (0.66 - resp_time) / 0.025, 1.0)),
    0.0);

resp_env = r1_env + r2_env + r3_env;

// Slightly higher pitch (individual variation)
resp_freq_base = 2600;
resp_f1 = (resp_freq_base + 700 * (resp_time / 0.17)) * r1_env;
resp_f2 = (resp_freq_base + 900 - 600 * ((resp_time - 0.23) / 0.17)) * r2_env;
resp_f3 = (resp_freq_base + 500 - 800 * ((resp_time - 0.48) / 0.18)) * r3_env;
resp_active = resp_f1 + resp_f2 + resp_f3;
resp_safe = max(resp_active, 100);

resp_fund = os.osc(resp_safe) * 0.12;
resp_h2 = os.osc(resp_safe * 2.01) * 0.08 * burriness;
resp_h3 = os.osc(resp_safe * 3.02) * 0.04 * burriness;
resp_burr = no.noise : fi.resonbp(resp_safe * 1.5, 5, 1.0) : *(0.03 * burriness);

response_tone = (resp_fund + resp_h2 + resp_h3 + resp_burr) * resp_env * response_bird;

// ============================================
// FOREST AMBIENT — Open conifer canopy
// ============================================
// Western Tanagers prefer more open forest than deep old-growth.
// Ponderosa pine / mixed conifer at mid-elevation.

// Wind through open canopy — broader, less filtered than dense forest
wind_mod = 0.4 + 0.3 * os.osc(0.06);
wind = no.noise : fi.resonlp(1200 * wind_mod, 0.4, 1.0) : *(0.012);

// Distant creek
creek = no.noise : fi.resonlp(2500, 0.3, 1.0) : *(0.006);

// Pine needle rustle (higher frequency than broadleaf)
rustle_rate = os.phasor(1, 0.09);
rustle = no.noise : fi.resonbp(5000, 3, 1.0) : *(0.003) *
         ba.if(rustle_rate < 0.03, 1.0, 0.0);

forest_ambient = wind + creek + rustle;

// ============================================
// FOREST REVERB
// ============================================
// Open conifer forest: less dense than old-growth, shorter reverb,
// but still reflective from large trunk spacing (~15-25m between trees).

dry_signal = primary_tone + response_tone;

d1 = dry_signal : @(int(ma.SR * 0.044)) * 0.20;  // ~15m trunk
d2 = dry_signal : @(int(ma.SR * 0.073)) * 0.15;  // ~25m trunk
d3 = dry_signal : @(int(ma.SR * 0.102)) * 0.10;  // ~35m distant
d4 = dry_signal : @(int(ma.SR * 0.160)) * 0.06;  // ~55m edge

// Less high-frequency absorption than deep forest (more open canopy)
reverb_raw = (d1 + d2 + d3 + d4) : fi.resonlp(4000, 0.4, 1.0);
reverb = reverb_raw * forest_reverb;

// ============================================
// MASTER MIX
// ============================================
raw = (dry_signal + reverb + forest_ambient) * 0.8;

// Soft limiting
limited = raw : ef.compressor_mono(3, -6, 0.005, 0.05);

// Stereo: primary left-center, response right-center
pan_primary = primary_tone * 0.35;
pan_response = response_tone * 0.35;
left = limited + pan_primary - pan_response * 0.3;
right = limited - pan_primary * 0.3 + pan_response;

process = left, right;
