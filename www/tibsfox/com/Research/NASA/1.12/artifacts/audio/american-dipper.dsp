// American Dipper — Cinclus mexicanus Song
// FAUST DSP source — generative ambient stream vocalization
//
// Mission 1.12 Bird Connection: American Dipper (degree 12)
// The only truly aquatic songbird in North America. Compact, slate-grey,
// stocky body with a short tail. Found along clear, fast-flowing mountain
// streams in the Pacific Northwest. Feeds by walking underwater on stream
// bottoms, probing under rocks for aquatic insect larvae.
//
// Song characteristics:
//   Fundamental frequency: ~3000-6000 Hz (high-energy, musical)
//   Quality: loud, clear, musical — often compared to a wren but richer
//   Phrase structure: long, complex, continuous warble lasting 5-15 seconds
//   Rapid frequency modulation — trills, warbles, buzzes interspersed
//   Each phrase is a mosaic of whistles, trills, and buzzy notes
//   Sung year-round, even in winter — often over the sound of rushing water
//   Both sexes sing (unusual for passerines)
//
// The dipper's unique behavior:
//   - Feeds underwater — walks along stream bottoms
//   - "Dips" = characteristic bobbing motion while perched on rocks
//   - Nictitating membrane covers eyes underwater
//   - Dense plumage + large preen gland for waterproofing
//   - The "plunge" — drops from a rock directly into rushing water
//
// Modeled behaviors:
//   Song: continuous warble with rapid FM, whistles, trills
//   Plunge: pitch drops sharply, water filter engages — the dive
//   Dip: rhythmic amplitude modulation — the bobbing
//
// Stream acoustic environment:
//   Fast-flowing mountain stream with rapids and cascades
//   Wet boulders, spray, rushing water — constant broadband noise
//   The dipper sings ABOVE this noise — its song cuts through
//
// Build:
//   faust2jaqt american-dipper.dsp    # Standalone
//   faust2lv2  american-dipper.dsp    # LV2 plugin

import("stdfaust.lib");

// --- Parameters ---
call_rate = hslider("[0]Call Rate", 0.35, 0.1, 1.0, 0.01) : si.smoo;
stream_volume = hslider("[1]Stream Volume", 0.5, 0, 1.0, 0.01) : si.smoo;
warble_complexity = hslider("[2]Warble Complexity", 0.7, 0, 1.0, 0.01) : si.smoo;
plunge_rate = hslider("[3]Plunge Rate", 0.2, 0, 1.0, 0.01) : si.smoo;

// ============================================
// PRIMARY DIPPER — continuous warble song
// ============================================
// The American Dipper sings a long, complex, continuous warble.
// Rapid frequency modulation, whistled notes, trills, buzzes.
// Phrases last 5-10 seconds with short pauses.
//
// The song is modeled as a base frequency with multiple layers
// of frequency modulation creating the characteristic warble.

song_period = 12.0 / call_rate;
song_phase = os.phasor(1, 1.0 / song_period);
song_time = song_phase * song_period;

// Song envelope: 6-8 seconds of continuous singing, then pause
song_active = ba.if(song_time < 7.5, 1.0, 0.0);
song_env = song_active *
  ba.if(song_time < 0.05, song_time / 0.05,
  ba.if(song_time > 7.2 & song_time < 7.5, (7.5 - song_time) / 0.3,
  1.0));

// --- Base frequency with complex FM ---
// Dipper base: 3500-5500 Hz, constantly moving
base_freq = 4200;

// Slow phrase contour — rises and falls over the song
phrase_contour = 1.0 + 0.15 * os.osc(0.6 + song_time * 0.05);

// Fast warble — rapid FM at 15-25 Hz creates the "warble"
warble_rate = 18.0 + 7.0 * os.osc(0.8);
warble_depth = 300.0 * warble_complexity;
warble_fm = warble_depth * os.osc(warble_rate);

// Trill modulation — very fast FM bursts creating trills
trill_gate = ba.if(os.osc(2.5) > 0.3, 1.0, 0.0); // trills come and go
trill_rate = 35.0 + 10.0 * warble_complexity;
trill_depth = 200.0 * trill_gate * warble_complexity;
trill_fm = trill_depth * os.osc(trill_rate);

// Phrase jumps — occasional large frequency leaps (interval jumps)
jump_trigger = ba.if(os.osc(1.3) > 0.85, 1.0, 0.0);
jump_offset = 800.0 * jump_trigger * os.osc(0.7);

// Combined frequency
active_freq = base_freq * phrase_contour + warble_fm + trill_fm + jump_offset;
safe_freq = max(active_freq, 500);

// --- Tone generation ---
// Dipper song is clear and musical — more tonal than buzzy
fundamental = os.osc(safe_freq) * 0.14;

// Warm harmonics — the richness that distinguishes dipper from wren
harm2 = os.osc(safe_freq * 2.003) * 0.07 * warble_complexity;
harm3 = os.osc(safe_freq * 2.998) * 0.03 * warble_complexity;

// Slight breathiness — air rushing past bill
breath = no.noise : fi.resonbp(safe_freq * 1.5, 6, 1.0) : *(0.02);

// AM modulation — slight amplitude variation with warble
am_mod = 0.7 + 0.3 * os.osc(warble_rate * 0.5);

primary_tone = (fundamental + harm2 + harm3 + breath) * am_mod * song_env;

// ============================================
// DIP MOTION — characteristic bobbing
// ============================================
// Between song phrases, the dipper bobs (dips) on its rock.
// Rhythmic amplitude modulation ~2 Hz during pauses.
dip_active = ba.if(song_time >= 8.0 & song_time < 11.0, 1.0, 0.0);
dip_rate = 2.2; // bobs per second
dip_env = dip_active * (0.5 + 0.5 * os.osc(dip_rate));

// Subtle body sounds during dipping — feet on wet rock
dip_scratch = no.noise : fi.resonbp(6000, 8, 1.0) : *(0.005) * dip_env;
// Wing flick — brief rustle
dip_wing = no.noise : fi.resonbp(3000, 4, 1.0) : *(0.003) *
           ba.if(os.osc(dip_rate * 2) > 0.9, 1.0, 0.0) * dip_active;

dip_sounds = dip_scratch + dip_wing;

// ============================================
// PLUNGE EFFECT — diving into water
// ============================================
// The dipper drops from a rock directly into rushing water.
// Pitch drops sharply, then a low-pass "underwater" filter engages.
// Bubbles and muffled stream sounds. Then re-emergence.

plunge_period = song_period * 3.5 / max(plunge_rate, 0.1);
plunge_phase = os.phasor(1, 1.0 / plunge_period);
plunge_time = plunge_phase * plunge_period;

// Plunge sequence:
//   0-0.1s: sharp pitch drop (the dive)
//   0.1-1.5s: underwater (muffled, bubbles)
//   1.5-1.8s: emergence (burst of water, bright attack)
plunge_active = ba.if(plunge_time < 2.0, plunge_rate, 0.0);

// Pitch drop — descending whistle as bird dives
drop_env = ba.if(plunge_time < 0.15,
    (1.0 - plunge_time / 0.15),
    0.0) * plunge_active;
drop_freq = 5000 - plunge_time * 30000; // rapid descent
drop_safe = max(drop_freq, 200);
drop_tone = os.osc(drop_safe) * 0.08 * drop_env;

// Underwater — muffled broadband with bubbles
underwater_env = ba.if(plunge_time >= 0.15 & plunge_time < 1.5,
    ba.if(plunge_time < 0.3, (plunge_time - 0.15) / 0.15,
    ba.if(plunge_time > 1.2, (1.5 - plunge_time) / 0.3,
    1.0)),
    0.0) * plunge_active;

// Water sounds filtered heavily (underwater perspective)
underwater_stream = no.noise : fi.resonlp(400, 0.4, 1.0) : *(0.06) * underwater_env;
// Bubble pops — random clicks
bubble_rate = os.phasor(1, 8.0);
bubbles = no.noise : fi.resonbp(800, 6, 1.0) : *(0.03) *
          ba.if(bubble_rate < 0.05, 1.0, 0.0) * underwater_env;

// Emergence — burst of water and bright transient
emerge_env = ba.if(plunge_time >= 1.5 & plunge_time < 1.9,
    ba.if(plunge_time < 1.6, (plunge_time - 1.5) * 10.0,
    (1.9 - plunge_time) / 0.3),
    0.0) * plunge_active;
// Splash — broadband burst
splash = no.noise : fi.resonlp(3000, 0.6, 1.0) : *(0.08) * emerge_env;
// Wing shake — shedding water
wing_shake = no.noise : fi.resonbp(5000, 4, 1.0) : *(0.04) * emerge_env *
             (0.5 + 0.5 * os.osc(25)); // rapid wing vibration

plunge = drop_tone + underwater_stream + bubbles + splash + wing_shake;

// ============================================
// STREAM AMBIENT — rushing mountain water
// ============================================
// Fast-flowing mountain stream with cascades and rapids.
// The dipper's constant acoustic backdrop.
// Broadband noise shaped by stream characteristics.

// Main stream flow — broadband with mid-frequency emphasis
stream_main = no.noise : fi.resonlp(2500, 0.5, 1.0) : *(0.06);

// Cascade splash — higher frequencies, rhythmic surging
cascade_rate = 0.15 + 0.1 * os.osc(0.03);
cascade_mod = 0.6 + 0.4 * os.osc(cascade_rate);
cascade = no.noise : fi.resonbp(4000, 3, 1.0) : *(0.025) * cascade_mod;

// Low rumble — deep water moving over boulders
rumble = no.noise : fi.resonlp(200, 0.3, 1.0) : *(0.03);

// Spray — very high frequency mist
spray = no.noise : fi.resonbp(8000, 5, 1.0) : *(0.008);

// Occasional rock clunk — underwater stones shifting
rock_rate = os.phasor(1, 0.08);
rock_clunk = no.noise : fi.resonbp(500, 8, 1.0) : *(0.015) *
             ba.if(rock_rate < 0.01, 1.0, 0.0);

stream_ambient = (stream_main + cascade + rumble + spray + rock_clunk) * stream_volume;

// ============================================
// SECOND DIPPER — distant response
// ============================================
// American Dippers often sing in response to each other
// along the same stream. A distant bird upstream.
resp_period = song_period * 1.8;
resp_phase = os.phasor(1, 1.0 / resp_period);
resp_time = resp_phase * resp_period;

resp_env = ba.if(resp_time < 5.0,
    ba.if(resp_time < 0.08, resp_time / 0.08,
    ba.if(resp_time > 4.7, (5.0 - resp_time) / 0.3,
    1.0)),
    0.0) * 0.25; // much quieter — distant

resp_base = 3800; // slightly different individual
resp_warble = 250.0 * os.osc(20.0 + 5.0 * os.osc(0.6));
resp_freq = resp_base + resp_warble;
resp_safe = max(resp_freq, 500);

resp_tone = os.osc(resp_safe) * 0.06 * resp_env;
resp_h2 = os.osc(resp_safe * 2.01) * 0.02 * resp_env;

// Distant = more reverb, less high freq
response = (resp_tone + resp_h2) : fi.resonlp(4000, 0.4, 1.0);

// ============================================
// STREAM REVERB
// ============================================
// Canyon/valley acoustics — reflections off wet rock walls
dry_signal = primary_tone + dip_sounds + plunge + response;

d1 = dry_signal : @(int(ma.SR * 0.032)) * 0.25;  // near rock face
d2 = dry_signal : @(int(ma.SR * 0.065)) * 0.18;  // far bank
d3 = dry_signal : @(int(ma.SR * 0.110)) * 0.12;  // upstream canyon
d4 = dry_signal : @(int(ma.SR * 0.180)) * 0.07;  // distant valley

// Wet stone absorbs mid-frequencies, reflects highs and lows
reverb_raw = (d1 + d2 + d3 + d4) : fi.resonlp(5000, 0.35, 1.0);
reverb = reverb_raw * 0.5;

// ============================================
// MASTER MIX
// ============================================
raw = (dry_signal + reverb + stream_ambient) * 0.8;

// Soft limiting
limited = raw : ef.compressor_mono(3, -6, 0.005, 0.05);

// Stereo: stream wide, bird slightly left, response right
pan_bird = primary_tone * 0.25;
pan_plunge = plunge * 0.15;
pan_resp = response * 0.3;
left = limited + pan_bird + pan_plunge - pan_resp;
right = limited - pan_bird - pan_plunge * 0.5 + pan_resp;

process = left, right;
