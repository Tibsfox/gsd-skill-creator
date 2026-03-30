// Townsend's Warbler — Setophaga townsendi Song
// FAUST DSP source — generative ambient forest vocalization
//
// Mission 1.11 Bird Connection: Townsend's Warbler (degree 11)
// A striking yellow-and-black warbler of the Pacific Northwest
// conifer canopy. Male has black throat, black crown, bright yellow
// face with black auricular patch. Forages high in conifers —
// often heard but difficult to see.
//
// Song characteristics:
//   Fundamental frequency: ~5000-8000 Hz (very high-pitched)
//   Quality: thin, buzzy, wheezy — rising inflection at end
//   Phrase structure: "zee-zee-zee-ZWEE" or "weazy-weazy-weazy-WEEZ"
//   4-6 buzzy notes on one pitch, final note rising sharply
//   Each note: ~100-200 ms, rapid delivery
//   Phrase duration: ~1.2-2.0 seconds
//   Inter-phrase pause: ~3-6 seconds
//   The buzzy quality comes from rapid frequency modulation (~50-80 Hz AM)
//
// Modeled call types:
//   Song: "zee-zee-zee-zee-ZWEE" — 4-5 buzzy level notes + 1 rising terminal
//   Chip note: sharp "tsik" — contact/alarm call
//
// Forest acoustic environment:
//   Dense old-growth conifer canopy (western hemlock, Douglas-fir, Sitka spruce)
//   Bird sings from high in the canopy, 30-60m up
//   Heavy reverb from dense forest structure
//   PNW coastal forest — moist, mossy, cathedral-like
//
// Build:
//   faust2jaqt townsends-warbler.dsp    # Standalone
//   faust2lv2  townsends-warbler.dsp    # LV2 plugin

import("stdfaust.lib");

// --- Parameters ---
call_rate = hslider("[0]Call Rate", 0.4, 0.1, 1.0, 0.01) : si.smoo;
forest_reverb = hslider("[1]Forest Reverb", 0.6, 0, 1.0, 0.01) : si.smoo;
buzziness = hslider("[2]Buzziness", 0.8, 0, 1.0, 0.01) : si.smoo;
response_bird = hslider("[3]Response Bird", 0.25, 0, 1.0, 0.01) : si.smoo;

// ============================================
// PRIMARY WARBLER — "zee-zee-zee-zee-ZWEE" song
// ============================================
// 4 level buzzy notes followed by 1 rising terminal note
// All notes high-pitched (5-8 kHz), buzzy, thin
//
//   Note 1: 0.00-0.15s  "zee" (steady ~6000 Hz, buzzy)
//   Gap:    0.15-0.20s
//   Note 2: 0.20-0.35s  "zee" (steady ~6000 Hz, buzzy)
//   Gap:    0.35-0.40s
//   Note 3: 0.40-0.55s  "zee" (steady ~6200 Hz, slight rise)
//   Gap:    0.55-0.60s
//   Note 4: 0.60-0.75s  "zee" (steady ~6200 Hz)
//   Gap:    0.75-0.82s
//   Note 5: 0.82-1.10s  "ZWEE" (rising sweep 6500→8000 Hz, louder)
//   Silence: 1.10-5.0s

song_period = 5.0 / call_rate;
song_phase = os.phasor(1, 1.0 / song_period);
song_time = song_phase * song_period;

// --- Syllable envelope: sharp attack, buzzy sustain ---
syl_env(start, dur) = ba.if(song_time >= start & song_time < start + dur,
    ba.if(song_time < start + 0.008, (song_time - start) / 0.008,
    ba.if(song_time > start + dur - 0.015, (start + dur - song_time) / 0.015,
    1.0)),
    0.0);

// Five notes
n1_env = syl_env(0.00, 0.15);   // "zee"
n2_env = syl_env(0.20, 0.15);   // "zee"
n3_env = syl_env(0.40, 0.15);   // "zee"
n4_env = syl_env(0.60, 0.15);   // "zee"
n5_env = syl_env(0.82, 0.28);   // "ZWEE" (longer, terminal)

phrase_env = n1_env + n2_env + n3_env + n4_env + n5_env;

// --- Frequency patterns ---
// Notes 1-4: relatively steady, high-pitched
// Note 5: rising sweep (the diagnostic "ZWEE")
freq1 = 6000 * n1_env;
freq2 = 6000 * n2_env;
freq3 = 6200 * n3_env;
freq4 = 6200 * n4_env;
// Terminal note: rising inflection
freq5 = (6500 + 1500 * ((song_time - 0.82) / 0.28)) * n5_env;

active_freq = freq1 + freq2 + freq3 + freq4 + freq5;
safe_freq = max(active_freq, 100);

// --- Buzzy tone generator ---
// Townsend's Warbler has a thin, buzzy, wheezy quality
// 1. High fundamental (5-8 kHz)
// 2. Rapid amplitude modulation (~60-80 Hz) creates buzz
// 3. Slight frequency modulation adds "wheezy" quality
// 4. Very narrow bandwidth — thin, insect-like

// Fundamental
fundamental = os.osc(safe_freq) * 0.15;

// Buzzy AM — rapid modulation creates the characteristic "zee"
buzz_rate = 65 + 15 * buzziness;
buzz_mod = 0.3 + 0.7 * (0.5 + 0.5 * os.osc(buzz_rate));
buzzy_fund = fundamental * buzz_mod;

// Thin harmonics — just a touch, keeping it wheezy not rich
harm2 = os.osc(safe_freq * 2.01) * 0.06 * buzziness;
harm3 = os.osc(safe_freq * 3.02) * 0.02 * buzziness;

// Frequency modulation — slight vibrato adds "wheezy" quality
fm_depth = 40 * buzziness;
fm_tone = os.osc(safe_freq + fm_depth * os.osc(55)) * 0.04;

// High-frequency noise band — insect-like sizzle
sizzle = no.noise : fi.resonbp(safe_freq, 8, 1.0) : *(0.03 * buzziness);

// Terminal note is louder
terminal_boost = ba.if(song_time >= 0.82 & song_time < 1.10, 1.4, 1.0);

primary_tone = (buzzy_fund + harm2 + harm3 + fm_tone + sizzle) *
               phrase_env * terminal_boost;

// ============================================
// CHIP NOTE — sharp "tsik" contact call
// ============================================
// Interspersed occasionally between song phrases
chip_period = song_period * 2.7;
chip_phase = os.phasor(1, 1.0 / chip_period);
chip_time = chip_phase * chip_period;

chip_env = ba.if(chip_time >= 0.0 & chip_time < 0.04,
    ba.if(chip_time < 0.005, chip_time / 0.005,
    (0.04 - chip_time) / 0.035),
    0.0);

// Sharp broadband click — "tsik"
chip_tone = (os.osc(7500) * 0.08 +
             no.noise : fi.resonbp(7000, 6, 1.0) : *(0.06)) * chip_env * 0.6;

// ============================================
// RESPONSE BIRD — distant, slightly different
// ============================================
// A second Townsend's Warbler from deeper in the canopy.
// Slightly lower pitch, offset timing, more muffled.
resp_period = song_period * 1.43;
resp_phase = os.phasor(1, 1.0 / resp_period);
resp_time = resp_phase * resp_period;

// Shorter phrase — 3 buzzy notes + terminal
r1_env = ba.if(resp_time >= 0.00 & resp_time < 0.14,
    ba.if(resp_time < 0.006, resp_time / 0.006,
    ba.if(resp_time > 0.125, (0.14 - resp_time) / 0.015, 1.0)),
    0.0);
r2_env = ba.if(resp_time >= 0.19 & resp_time < 0.33,
    ba.if(resp_time < 0.196, (resp_time - 0.19) / 0.006,
    ba.if(resp_time > 0.315, (0.33 - resp_time) / 0.015, 1.0)),
    0.0);
r3_env = ba.if(resp_time >= 0.38 & resp_time < 0.52,
    ba.if(resp_time < 0.386, (resp_time - 0.38) / 0.006,
    ba.if(resp_time > 0.505, (0.52 - resp_time) / 0.015, 1.0)),
    0.0);
r4_env = ba.if(resp_time >= 0.60 & resp_time < 0.85,
    ba.if(resp_time < 0.606, (resp_time - 0.60) / 0.006,
    ba.if(resp_time > 0.835, (0.85 - resp_time) / 0.015, 1.0)),
    0.0);

resp_env = r1_env + r2_env + r3_env + r4_env;

// Slightly lower pitch (individual variation)
resp_freq_base = 5600;
resp_f1 = resp_freq_base * r1_env;
resp_f2 = resp_freq_base * r2_env;
resp_f3 = (resp_freq_base + 200) * r3_env;
resp_f4 = (resp_freq_base + 200 + 1200 * ((resp_time - 0.60) / 0.25)) * r4_env;
resp_active = resp_f1 + resp_f2 + resp_f3 + resp_f4;
resp_safe = max(resp_active, 100);

resp_fund = os.osc(resp_safe) * 0.10;
resp_buzz = resp_fund * (0.3 + 0.7 * (0.5 + 0.5 * os.osc(60)));
resp_h2 = os.osc(resp_safe * 2.01) * 0.04 * buzziness;
resp_sizzle = no.noise : fi.resonbp(resp_safe, 8, 1.0) : *(0.02 * buzziness);

response_tone = (resp_buzz + resp_h2 + resp_sizzle) * resp_env * response_bird;

// ============================================
// FOREST AMBIENT — Dense PNW conifer canopy
// ============================================
// Old-growth western hemlock / Sitka spruce forest
// Townsend's Warblers sing from high in the canopy, 30-60m up
// Dense moss, heavy moisture, cathedral acoustics

// Wind filtered through dense canopy — low, muffled
wind_mod = 0.3 + 0.4 * os.osc(0.04);
wind = no.noise : fi.resonlp(600 * wind_mod, 0.3, 1.0) : *(0.010);

// Dripping moisture — occasional drops
drip_rate = os.phasor(1, 0.12);
drip = no.noise : fi.resonbp(4000, 10, 1.0) : *(0.004) *
       ba.if(drip_rate < 0.02, 1.0, 0.0);

// Distant creek through old-growth
creek = no.noise : fi.resonlp(2000, 0.3, 1.0) : *(0.005);

// Canopy rustle — deep forest, muffled
canopy_rate = os.phasor(1, 0.07);
canopy_rustle = no.noise : fi.resonbp(3500, 4, 1.0) : *(0.003) *
                ba.if(canopy_rate < 0.04, 1.0, 0.0);

forest_ambient = wind + drip + creek + canopy_rustle;

// ============================================
// FOREST REVERB
// ============================================
// Dense old-growth: long reverb, heavy high-frequency absorption
// Large trunk spacing, multiple reflections, cathedral-like

dry_signal = primary_tone + response_tone + chip_tone;

d1 = dry_signal : @(int(ma.SR * 0.058)) * 0.22;  // ~20m trunk
d2 = dry_signal : @(int(ma.SR * 0.088)) * 0.17;  // ~30m trunk
d3 = dry_signal : @(int(ma.SR * 0.132)) * 0.12;  // ~45m canopy
d4 = dry_signal : @(int(ma.SR * 0.200)) * 0.08;  // ~68m distant
d5 = dry_signal : @(int(ma.SR * 0.290)) * 0.04;  // ~100m far canopy

// Dense canopy absorbs high frequencies — muffled reverb
reverb_raw = (d1 + d2 + d3 + d4 + d5) : fi.resonlp(3500, 0.3, 1.0);
reverb = reverb_raw * forest_reverb;

// ============================================
// MASTER MIX
// ============================================
raw = (dry_signal + reverb + forest_ambient) * 0.8;

// Soft limiting
limited = raw : ef.compressor_mono(3, -6, 0.005, 0.05);

// Stereo: primary high-left (canopy), response deep-right
pan_primary = primary_tone * 0.3;
pan_response = response_tone * 0.3;
pan_chip = chip_tone * 0.15;
left = limited + pan_primary - pan_response * 0.25 + pan_chip;
right = limited - pan_primary * 0.25 + pan_response - pan_chip * 0.5;

process = left, right;
