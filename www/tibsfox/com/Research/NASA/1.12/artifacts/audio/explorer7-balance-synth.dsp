// Explorer 7 — Earth's Radiation Balance: The Sound of Equilibrium
// FAUST DSP source — compiles to VST, AU, LV2, JACK, CLI
//
// Mission 1.12: Explorer 7 (Goddard Space Flight Center / Juno II)
// SUCCESSFUL LAUNCH — October 13, 1959
//
// Explorer 7 carried the first satellite instruments designed to
// measure Earth's radiation budget: Suomi-Parent bolometers.
// Two hemispheric sensors — one black (absorbs all radiation),
// one white (reflects visible, absorbs only thermal) — allowed
// separation of reflected solar energy from emitted thermal energy.
// The measurement that launched climate science from space.
//
// This is the sound of balance — and imbalance. ~90 seconds.
//
// The two oscillators represent:
//   Solar input (bright, high, golden) — the energy arriving
//   Earth output (warm, low, reddish) — the energy leaving
//
// When balanced: consonant interval (perfect fifth), steady hum
// When imbalanced: dissonance grows, beating frequencies emerge,
//   the warmth accumulates, the output cannot keep up with the input
//
// Timeline (phase 0-1 → 0-90 seconds):
//   0-15s:   Equilibrium — the two oscillators locked in harmony.
//            Earth radiates as much as it receives. Consonant fifth.
//   15-30s:  Slight imbalance — CO₂ rising, greenhouse strengthening.
//            Beat frequency appears. Dissonance creeping in.
//   30-50s:  Growing imbalance — output lags input. The gap widens.
//            Beat frequency intensifying, thermal tone rising.
//   50-70s:  Significant warming — the thermal output tries to catch
//            up (Stefan-Boltzmann: emission grows as T⁴) but greenhouse
//            trapping prevents equilibrium. Pulsing, breathing, stressed.
//   70-85s:  New equilibrium? — the system seeks a higher temperature
//            where output again matches input. But the interval has
//            shifted — no longer a fifth, now a tritone. Stable but wrong.
//   85-90s:  The question — a quiet coda. The balance is fragile.
//            The bolometers are still measuring.
//
// Organism resonance: Usnea longissima (Methuselah's beard lichen)
//   A pendant lichen draped from old-growth conifers in the PNW,
//   exquisitely sensitive to air quality and climate change.
//   It grows slowly, lives long, and dies fast when the air changes.
//   It is Earth's own bolometer — a biological thermometer.
//
// Dedication: Rudolf Virchow (1821-1902)
//   Father of cellular pathology — the principle that disease can
//   be understood by examining cells, that the whole reveals itself
//   through the part. Suomi's bolometers were cellular pathology
//   for the planet: two small sensors diagnosing Earth's fever.
//
// Build:
//   faust2jaqt explorer7-balance-synth.dsp    # JACK/Qt standalone
//   faust2lv2  explorer7-balance-synth.dsp    # LV2 plugin
//   faust2vst  explorer7-balance-synth.dsp    # VST plugin (needs VST SDK)
//
// Install FAUST: https://faust.grame.fr/downloads/

import("stdfaust.lib");

// --- Parameters ---
phase = hslider("[0]Phase", 0, 0, 1, 0.001) : si.smoo;
auto_mode = checkbox("[1]Auto (90s cycle)");
intensity = hslider("[2]Intensity", 0.7, 0, 1, 0.01) : si.smoo;
imbalance = hslider("[3]Imbalance", 0.5, 0, 1, 0.01) : si.smoo;

// Auto-advancing phase (90-second cycle)
auto_phase = os.phasor(1, 1.0/90.0);
active_phase = select2(auto_mode, phase, auto_phase);

// --- Time mapping (phase 0-1 → 0-90 seconds) ---
time_sec = active_phase * 90.0;

// ============================================
// SOLAR INPUT — bright, golden, high
// ============================================
// The sun delivers 1361 W/m² to Earth's cross section.
// A steady, bright, warm tone — the source of all energy.
// Fundamental at ~440 Hz (A4 — the tuning reference),
// harmonics giving it a golden timbre.

solar_base = 440.0;
// Solar is steady — the sun doesn't change much
solar_vibrato = 1.0 + 0.003 * os.osc(0.1);
solar_freq = solar_base * solar_vibrato;

// Rich golden tone — fundamental plus warm harmonics
solar_fund = os.osc(solar_freq) * 0.12;
solar_h2 = os.osc(solar_freq * 2.0) * 0.06;
solar_h3 = os.osc(solar_freq * 3.0) * 0.03;
solar_h4 = os.osc(solar_freq * 4.0) * 0.015;
// Slight shimmer — solar granulation
solar_shimmer = no.noise : fi.resonbp(solar_freq * 5, 10, 1.0) : *(0.008);

solar_raw = solar_fund + solar_h2 + solar_h3 + solar_h4 + solar_shimmer;

// Solar envelope — present throughout, steady
solar_env = 0.8 + 0.2 * smoothstep(0.0, 5.0, time_sec)
with { smoothstep(a, b, x) = clamp((x - a) / (b - a), 0.0, 1.0)
       with { clamp(x, lo, hi) = max(lo, min(hi, x)); }; };
solar = solar_raw * solar_env;

// ============================================
// EARTH OUTPUT — warm, low, thermal
// ============================================
// Earth radiates thermal infrared according to Stefan-Boltzmann: σT⁴.
// A warm, deep tone. In equilibrium, it forms a perfect fifth
// with the solar input (440 * 3/2 ≈ 660 Hz inverted → ~293 Hz,
// or we use 440/1.5 ≈ 293 Hz).
// As warming occurs, the thermal tone rises in pitch (T⁴ → more emission)
// but cannot keep up due to greenhouse trapping.

// Imbalance progression over time
time_imbalance = ba.if(time_sec < 15.0, 0.0,
                 ba.if(time_sec < 30.0, (time_sec - 15.0) / 15.0 * 0.3,
                 ba.if(time_sec < 50.0, 0.3 + (time_sec - 30.0) / 20.0 * 0.4,
                 ba.if(time_sec < 70.0, 0.7 + (time_sec - 50.0) / 20.0 * 0.25,
                 ba.if(time_sec < 85.0, 0.95 - (time_sec - 70.0) / 15.0 * 0.15,
                 0.80)))));

effective_imbalance = time_imbalance * imbalance;

// Earth base pitch — starts as perfect fifth below solar (consonant)
// As temperature rises, pitch rises (trying to reach new equilibrium)
earth_base = 293.3; // 440 / 1.5 — perfect fifth below
earth_warming = earth_base + effective_imbalance * 40.0; // pitch rises with warming

// Greenhouse detuning — the output is suppressed, creating beats
greenhouse_detune = effective_imbalance * 8.0; // Hz of detuning
earth_freq = earth_warming + greenhouse_detune * os.osc(0.2);

// Warm, rounded tone — fewer harmonics, more fundamental
earth_fund = os.osc(earth_freq) * 0.14;
earth_h2 = os.osc(earth_freq * 2.01) * 0.04; // slight inharmonicity
earth_h3 = os.osc(earth_freq * 2.99) * 0.02;
// Thermal rumble — low frequency components
earth_thermal = os.osc(earth_freq * 0.5) * 0.05;

earth_raw = earth_fund + earth_h2 + earth_h3 + earth_thermal;

// Earth envelope — present throughout
earth_env = 0.8 + 0.2 * ba.if(time_sec < 5.0, time_sec / 5.0, 1.0);
earth = earth_raw * earth_env;

// ============================================
// BEAT FREQUENCY — the imbalance made audible
// ============================================
// When solar input and earth output are balanced, no beats.
// As imbalance grows, beat frequency appears and intensifies.
// This is the sound of accumulated energy — the warming.

beat_freq = 2.0 + effective_imbalance * 6.0; // 2-8 Hz pulsing
beat_depth = effective_imbalance * 0.6; // 0 when balanced, 0.6 at max
beat_mod = 1.0 - beat_depth * (0.5 + 0.5 * os.osc(beat_freq));

// ============================================
// EQUILIBRIUM HARMONY — consonant when balanced
// ============================================
// A gentle fifth interval that rings when the system is in equilibrium.
// Fades as imbalance grows.

equil_strength = 1.0 - effective_imbalance * 1.2;
equil_strength_clip = max(equil_strength, 0.0);
// Perfect fifth: solar and earth frequencies sounding together
equil_fifth = os.osc((solar_base + earth_base) * 0.5) * 0.03 * equil_strength_clip;
// Bell-like shimmer of harmony
equil_bell = os.osc(solar_base * 1.5) * 0.02 * equil_strength_clip *
             (0.5 + 0.5 * os.osc(0.3));

equilibrium = equil_fifth + equil_bell;

// ============================================
// DISSONANCE — grows with imbalance
// ============================================
// As the greenhouse effect strengthens, dissonant intervals emerge.
// The perfect fifth bends toward a tritone (the devil's interval).

dissonance_strength = max(effective_imbalance * 1.5 - 0.3, 0.0);
// Tritone: ~622 Hz (augmented fourth above solar)
tritone_freq = solar_base * 1.414; // sqrt(2) ≈ tritone
dissonance_tone = os.osc(tritone_freq) * 0.04 * dissonance_strength;
// Cluster tones — tight chromatic cluster as system stresses
cluster1 = os.osc(solar_base * 1.06) * 0.02 * dissonance_strength;
cluster2 = os.osc(earth_base * 0.94) * 0.02 * dissonance_strength;
// Noise floor rising — system stress
stress_noise = no.noise : fi.resonlp(400, 0.5, 1.0) : *(0.015 * dissonance_strength);

dissonance = dissonance_tone + cluster1 + cluster2 + stress_noise;

// ============================================
// BOLOMETER HUM — the instrument listening
// ============================================
// A quiet, constant background — the bolometers in orbit,
// measuring the imbalance with mechanical precision.
// Two tones: one for the black hemisphere, one for the white.

// Black bolometer: absorbs all radiation — lower pitch, steady
black_bolo = os.osc(110) * 0.008 + os.osc(110.5) * 0.005;
// White bolometer: reflects visible, absorbs thermal — higher pitch
white_bolo = os.osc(165) * 0.006 + os.osc(165.3) * 0.004;
// Orbital period modulation — 96 minute orbit, 1.6s in synth time
orbit_mod = 0.5 + 0.5 * os.osc(1.0 / 1.6);
bolometer = (black_bolo + white_bolo) * orbit_mod * 0.5;

// ============================================
// CODA — the question (85-90s)
// ============================================
// The balance is fragile. A quiet, uncertain tone.
coda_env = ba.if(time_sec >= 85.0 & time_sec <= 90.0,
             (90.0 - time_sec) / 5.0,
             0.0);
// A single sine, slightly flat — the question unresolved
coda_tone = os.osc(solar_base * 0.99) * 0.04 * coda_env;
// Lichen-like texture — very slow, organic
coda_lichen = no.noise : fi.resonbp(2000, 12, 1.0) : *(0.005 * coda_env);

coda = coda_tone + coda_lichen;

// ============================================
// MASTER MIX
// ============================================
raw = (solar * beat_mod + earth * beat_mod + equilibrium +
       dissonance + bolometer + coda) * intensity;

// Gentle limiting
limited = raw : ef.compressor_mono(4, -6, 0.01, 0.1);

// Stereo: solar slightly left (incoming), earth slightly right (outgoing)
width = 0.35;
process = limited <: *(1.0 + width * 0.5), *(1.0 - width * 0.5);
