// Rufous Hummingbird Call — Selasphorus rufus
// FAUST DSP source — compiles to VST, AU, LV2, JACK, CLI
//
// Mission 1.8: Vanguard 1 — Bird: Rufous Hummingbird (degree 8)
//
// The Rufous Hummingbird is a tiny copper-orange torpedo of aggression.
// Males weigh about 3.2 grams — less than a nickel. They migrate
// farther per gram of body weight than any other bird: 3,900 miles
// from breeding grounds in the PNW to wintering grounds in Mexico.
// They are ferociously territorial, attacking birds many times their
// size, including hawks and crows, to defend flower patches.
//
// The vocalizations are sharp, metallic, and relentless:
//
// 1. CHIP NOTES: Hard, sharp "chit" or "tchip" calls at 6-8 kHz.
//    Rapid-fire, often given in aggressive bursts of 3-8 chips.
//    These are territorial warnings — the hummingbird equivalent
//    of shouting "GET OUT" at anything that moves near its flowers.
//    Each chip is extremely short (~10-20ms) with a sharp attack
//    and almost no decay. The speed is extraordinary — up to
//    15 chips per second in aggressive encounters.
//
// 2. DIVE DISPLAY BUZZ: During courtship, the male performs a
//    J-shaped dive from 20-40 meters altitude, pulling up sharply
//    at the bottom. At the lowest point of the dive, the outer
//    tail feathers produce a sharp "bzzt" sound — a mechanical
//    noise made by air rushing through spread rectrices at high
//    speed. This is NOT a vocalization but a sonation — sound
//    made by feathers. The buzz is broadband, centered around
//    4 kHz, lasting about 50-100ms. The dive sequence includes
//    a build-up whine from the wings getting louder as the bird
//    accelerates, then the terminal buzz.
//
// 3. WING HUM: At ~40-60 wingbeats per second, the wings produce
//    a constant hum in the 40-60 Hz range. This is the background
//    sound of a hummingbird's existence — always present, the price
//    of hovering flight.
//
// Timeline (~10 seconds per cycle):
//   0-0.5s:   Wing hum approaches (getting louder)
//   0.5-2.5s: Aggressive chip burst — 3-8 rapid "chit" calls
//   2.5-4.0s: Brief pause, wing hum, then another chip burst
//   4.0-6.0s: Wing hum intensity increases (dive beginning)
//   6.0-7.5s: Dive sound — rising whine followed by terminal BZZT
//   7.5-10s:  Wing hum recedes, one or two trailing chips
//
// Build:
//   faust2jaqt rufous-hummingbird.dsp   # JACK/Qt standalone
//   faust2lv2  rufous-hummingbird.dsp   # LV2 plugin
//
// Install FAUST: https://faust.grame.fr/downloads/

import("stdfaust.lib");

// --- Parameters ---
phase = hslider("[0]Phase", 0, 0, 1, 0.001) : si.smoo;
auto_mode = checkbox("[1]Auto (10s cycle)");
aggression = hslider("[2]Aggression", 0.8, 0, 1, 0.01) : si.smoo;
proximity = hslider("[3]Proximity", 0.6, 0, 1, 0.01) : si.smoo;

// Auto-advancing phase (10-second cycle)
auto_phase = os.phasor(1, 1.0/10.0);
active_phase = select2(auto_mode, phase, auto_phase);

// --- Time mapping ---
time_sec = active_phase * 10.0;

// ============================================
// WING HUM
// ============================================
// Rufous Hummingbird: ~52 wingbeats/sec (hovering), up to 75 (display)
// Creates a low buzz that is always present when the bird is nearby

wing_rate_base = 52.0;
// Wings speed up during dive display (4-7.5s)
wing_speedup = ba.if(time_sec > 4.0,
                 ba.if(time_sec < 7.5,
                   1.0 + 0.4 * (time_sec - 4.0) / 3.5,
                   1.0),
                 1.0);
wing_rate = wing_rate_base * wing_speedup;

// Wing hum: fundamental + harmonics (not a pure tone — complex flutter)
wing_fund = os.osc(wing_rate) * 0.15;
wing_h2 = os.osc(wing_rate * 2.0) * 0.08;
wing_h3 = os.osc(wing_rate * 3.0) * 0.04;
wing_h4 = os.osc(wing_rate * 4.0) * 0.02;

// Proximity envelope — bird approaches and recedes
wing_prox = ba.if(time_sec < 0.5,
              time_sec / 0.5,
              ba.if(time_sec > 8.0,
                (10.0 - time_sec) / 2.0,
                1.0));

wing_sound = (wing_fund + wing_h2 + wing_h3 + wing_h4)
             * wing_prox * proximity * 0.4;

// ============================================
// CHIP NOTES
// ============================================
// Sharp, metallic "chit" at 6-8 kHz, extremely brief (10-20ms)
// Burst pattern: rapid-fire chips with slight randomness in spacing

// Chip timing — define when chips occur
// Burst 1: 0.5-2.5s (5-10 chips)
// Burst 2: 3.0-4.0s (3-5 chips)
// Trailing: 8.0-9.5s (2-3 chips)

// Generate chip triggers at ~12 chips/sec during active bursts
chip_clock = os.phasor(1, 12.0 * aggression + 3.0);
chip_trigger = (chip_clock - chip_clock') < 0;

// Burst envelope — which time windows have chips
chip_burst_env = ba.if(time_sec >= 0.5,
                   ba.if(time_sec < 2.5, 1.0,
                     ba.if(time_sec >= 3.0,
                       ba.if(time_sec < 4.0, 0.7,
                         ba.if(time_sec >= 8.0,
                           ba.if(time_sec < 9.5, 0.5, 0.0),
                           0.0)),
                       0.0)),
                   0.0);

// Chip sound: sharp attack, near-zero sustain
// Broadband noise burst filtered to 6-8 kHz
chip_excite = chip_trigger * chip_burst_env;
chip_env = chip_excite : en.ar(0.0005, 0.012);

// The chip is a resonant "tchit" — sharp, metallic
chip_body = chip_excite * no.noise : fi.resonbp(7000, 12.0, 1.0) : *(4.0);
chip_attack = chip_excite * no.noise : fi.resonbp(6200, 15.0, 1.0) : *(2.0);
chip_high = chip_excite * no.noise : fi.resonbp(8500, 10.0, 1.0) : *(1.5);

chip_sound = (chip_body + chip_attack + chip_high) * chip_env * aggression;

// ============================================
// DIVE DISPLAY BUZZ
// ============================================
// J-shaped dive: acceleration phase (4-6.5s), then terminal buzz (6.5-7.2s)
//
// The dive has three acoustic components:
// 1. Rising wing whine as the bird accelerates downward
// 2. Sharp terminal BZZT from tail feathers at bottom of dive
// 3. Brief silence, then wing hum as bird pulls up

// 1. Dive acceleration whine (4.0-6.5s)
dive_active = ba.if(time_sec >= 4.0,
                ba.if(time_sec < 6.5, 1.0, 0.0),
                0.0);
dive_progress = max(0.0, (time_sec - 4.0) / 2.5);

// Rising pitch whine: wings cutting air at increasing speed
dive_whine_freq = 800.0 + dive_progress * dive_progress * 3000.0;
dive_whine = os.osc(dive_whine_freq) * 0.05
             + os.osc(dive_whine_freq * 1.5) * 0.02;
dive_whine_env = dive_active * dive_progress;

// 2. Terminal buzz (6.5-7.2s)
// Broadband "bzzt" from outer rectrices (R2-R5)
// Centered ~4 kHz, harsh, mechanical sound
buzz_active = ba.if(time_sec >= 6.5,
                ba.if(time_sec < 7.2,
                  1.0 - (time_sec - 6.5) / 0.7,
                  0.0),
                0.0);

// The buzz is NOT a clean tone — it's turbulent airflow through feathers
buzz_noise = no.noise : fi.resonbp(4000, 4.0, 1.0) : *(2.0);
buzz_mid = no.noise : fi.resonbp(3200, 6.0, 1.0) : *(1.0);
buzz_high = no.noise : fi.resonbp(5500, 8.0, 1.0) : *(0.6);
buzz_env = buzz_active : en.ar(0.002, 0.15);

// Combine dive sounds
dive_sound = dive_whine * dive_whine_env * 0.5
             + (buzz_noise + buzz_mid + buzz_high) * buzz_env * 0.7;

// ============================================
// AMBIENT — FLOWERS AND AIR
// ============================================
// Faint garden/meadow background — Rufous Hummingbirds are found
// near salmonberry, red columbine, Indian paintbrush

// Very subtle breeze through flowers
garden_wind = no.noise : fi.resonlp(600, 0.3, 1.0) : *(0.005);
// Occasional insect
insect_buzz = os.osc(220.0 + os.osc(3.0) * 20.0) * 0.003
              * ba.if(no.noise > 0.97, 1.0, 0.0);

ambient = garden_wind + insect_buzz;

// ============================================
// Final mix
// ============================================
process = (wing_sound + chip_sound + dive_sound + ambient)
          * 0.65 <: _, _;
