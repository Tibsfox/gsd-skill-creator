// Swainson's Thrush — Catharus ustulatus
// FAUST DSP source — generative spiral song synthesis
//
// Mission 1.21 Bird: Swainson's Thrush (degree 21 in 360 series)
// The ethereal, spiraling ascending song of the Pacific Northwest
// conifer forest. One of the most beautiful bird songs in North
// America — a series of phrases that spiral upward through
// harmonic intervals like a musical helix unwinding toward heaven.
//
// The Swainson's Thrush is an olive-backed thrush with buffy
// spectacles and a spotted breast. It breeds in dense, moist
// conifer and mixed forests from Alaska to California and across
// the boreal zone. Its song is heard at dawn and dusk — a
// flute-like series of phrases, each phrase a spiral of 4-6
// notes ascending in pitch with increasing tempo. The overall
// effect is of a melody climbing an invisible staircase that
// curves upward and inward simultaneously.
//
// Unlike the Hermit Thrush (descending, melancholy) or the
// Wood Thrush (rich, horizontal), the Swainson's Thrush always
// goes UP. It is the bird of ascent, of becoming, of the
// morning forest waking into light.
//
// The song has a flute-like purity with prominent 2nd and 3rd
// harmonics plus subtle inharmonic partials that give it an
// almost electronic quality — as if the forest itself were
// running FM synthesis millions of years before Chowning.
//
// Ambient: dawn forest — wind in canopy (pink noise), distant
// stream (low-pass filtered noise), the deep quiet of old-growth
// Douglas fir and western red cedar.
//
// Build:
//   faust2jaqt swainsons-thrush.dsp    # JACK/Qt standalone
//   faust2lv2  swainsons-thrush.dsp    # LV2 plugin

declare name      "Swainson's Thrush — Spiral Song";
declare author    "Tibsfox NASA Mission Series";
declare copyright "(c) 2026 Tibsfox";
declare version   "1.21";
declare license   "MIT";

import("stdfaust.lib");

// --- Parameters ---
phrase_rate = hslider("[0]Phrase Rate (per min)", 8, 3, 20, 0.5) : si.smoo;
base_pitch = hslider("[1]Base Pitch (Hz)", 2200, 1500, 3500, 10) : si.smoo;
spiral_depth = hslider("[2]Spiral Depth", 0.7, 0, 1, 0.01) : si.smoo;
reverb_amount = hslider("[3]Forest Reverb", 0.55, 0, 1, 0.01) : si.smoo;
canopy_wind = hslider("[4]Canopy Wind", 0.3, 0, 1, 0.01) : si.smoo;
stream_level = hslider("[5]Stream Level", 0.2, 0, 1, 0.01) : si.smoo;

// Mod helper
mod(x, m) = x - floor(x / m) * m;


// ==========================================================
// SPIRAL SONG — PRIMARY VOCALIZATION
// ==========================================================
//
// Structure of one phrase (~1.5-2.5 seconds):
//   Note 1: base pitch, longest duration
//   Note 2: base * 1.12 (roughly a major 2nd up), shorter
//   Note 3: base * 1.26 (major 3rd), shorter still
//   Note 4: base * 1.41 (tritone/augmented 4th), brief
//   Note 5: base * 1.59 (minor 6th), very brief
//   Note 6: base * 1.78 (minor 7th), fleeting
// Each note is slightly shorter and slightly louder than the
// last — the spiral accelerates as it ascends.

// --- Phrase Timing ---
phrase_period = 60.0 / max(3.0, phrase_rate);
phrase_phase = os.phasor(1, 1.0 / phrase_period);

// Active singing portion of each phrase cycle
// Song occupies first 60% of each period, silence fills the rest
phrase_dur = 0.55;
in_phrase = ba.if(phrase_phase < phrase_dur, 1.0, 0.0);

// --- Note Boundaries Within Phrase ---
// 6 notes with accelerating timing (each progressively shorter)
// Normalized positions within the phrase duration:
//   Note 1: 0.00 - 0.25  (25% of phrase)
//   Note 2: 0.25 - 0.44  (19%)
//   Note 3: 0.44 - 0.58  (14%)
//   Note 4: 0.58 - 0.70  (12%)
//   Note 5: 0.70 - 0.82  (12%)
//   Note 6: 0.82 - 0.95  (13%)
// Gaps between notes for articulation in the remaining time

note_pos = ba.if(in_phrase > 0.5, phrase_phase / phrase_dur, 0.0);

// Which note is active (1-6), 0 = gap
active_note = ba.if(note_pos < 0.24, 1,
              ba.if(note_pos < 0.25, 0,   // gap
              ba.if(note_pos < 0.43, 2,
              ba.if(note_pos < 0.44, 0,   // gap
              ba.if(note_pos < 0.57, 3,
              ba.if(note_pos < 0.58, 0,   // gap
              ba.if(note_pos < 0.69, 4,
              ba.if(note_pos < 0.70, 0,   // gap
              ba.if(note_pos < 0.81, 5,
              ba.if(note_pos < 0.82, 0,   // gap
              ba.if(note_pos < 0.94, 6,
                0)))))))))));  // trailing silence

// --- Pitch Calculation ---
// Spiral intervals — each note climbs by an increasing interval.
// The spiral_depth parameter controls how far apart the notes are.
// At spiral_depth=0, notes stay near the base. At 1.0, full spiral.
pitch_ratio = ba.if(active_note == 1, 1.0,
              ba.if(active_note == 2, 1.0 + 0.12 * spiral_depth,
              ba.if(active_note == 3, 1.0 + 0.26 * spiral_depth,
              ba.if(active_note == 4, 1.0 + 0.41 * spiral_depth,
              ba.if(active_note == 5, 1.0 + 0.59 * spiral_depth,
              ba.if(active_note == 6, 1.0 + 0.78 * spiral_depth,
                1.0))))));

// Smooth pitch with slight vibrato (thrush vibrato ~5-7 Hz)
vibrato = os.osc(5.5 + 1.5 * os.osc(0.3)) * (8 + 4 * spiral_depth);
current_pitch = base_pitch * pitch_ratio + vibrato : si.smoo;

// Slight upward slide at the start of each note — portamento
// (thrushes don't jump to notes, they slide into them)
pitch_slide = current_pitch : si.smooth(ba.tau2pole(0.015));

// --- Note Envelope ---
// Each note: fast attack (8-12ms), brief sustain, gentle decay.
// Later notes in the spiral are slightly louder (the bird pushes).
note_env_raw = ba.if(active_note > 0, 1.0, 0.0);

// Amplitude increases with note number (spiral intensifies)
note_amp = ba.if(active_note == 1, 0.65,
           ba.if(active_note == 2, 0.72,
           ba.if(active_note == 3, 0.80,
           ba.if(active_note == 4, 0.88,
           ba.if(active_note == 5, 0.94,
           ba.if(active_note == 6, 1.0,
             0.0))))));

note_env = note_env_raw * note_amp : si.smooth(ba.tau2pole(0.010));

// Overall phrase envelope — gentle fade in and out
phrase_env = ba.if(in_phrase > 0.5,
               ba.if(phrase_phase < 0.03,
                 phrase_phase / 0.03,
               ba.if(phrase_phase < phrase_dur - 0.05,
                 1.0,
                 max(0.0, (phrase_dur - phrase_phase) / 0.05))),
               0.0)
           : si.smoo;

// --- Harmonic Structure ---
// The thrush voice: pure, flute-like. Strong fundamental with
// prominent 2nd and 3rd harmonics. Subtle inharmonic partials
// at ratios like 2.76 and 4.17 give the "forest electronic" quality.

// FM synthesis core — the modulation index increases through
// each phrase, adding richness as the spiral ascends.
fm_mod_index = (0.8 + 1.2 * spiral_depth)
             * ba.if(active_note > 0, active_note / 6.0, 0.0);
fm_mod_freq = pitch_slide * 1.0;
fm_mod_sig = os.osc(fm_mod_freq) * fm_mod_index * pitch_slide * 0.15;

// Harmonics
h1 = os.osc(pitch_slide + fm_mod_sig) * 0.40;                    // Fundamental
h2 = os.osc(pitch_slide * 2.003 + fm_mod_sig * 0.5) * 0.18;     // 2nd harmonic
h3 = os.osc(pitch_slide * 3.001 + fm_mod_sig * 0.3) * 0.14;     // 3rd harmonic
h4 = os.osc(pitch_slide * 2.76) * 0.04;                          // Inharmonic — forest quality
h5 = os.osc(pitch_slide * 4.17) * 0.02;                          // Inharmonic — shimmer
h6 = os.osc(pitch_slide * 5.02 + fm_mod_sig * 0.1) * 0.01;      // 5th harmonic (faint)

song_harmonics = h1 + h2 + h3 + h4 + h5 + h6;

// Breath component — the syrinx produces a slight breathy quality
breath = no.noise * 0.04
       : fi.resonbp(pitch_slide * 1.1, 6, 1.0);

// Combined song signal
song_raw = (song_harmonics + breath) * note_env * phrase_env * 0.50
         : fi.resonbp(pitch_slide, 1.8, 1.0)
         : fi.resonhp(1200, 1, 1.0);

// Natural variation — slight random amplitude flutter
flutter = 1.0 + 0.06 * os.osc(11.0 + 3.0 * os.osc(0.2));
song_signal = song_raw * flutter;


// ==========================================================
// FOREST REVERB
// ==========================================================
//
// Old-growth PNW forest: tall Douglas fir, western red cedar,
// Sitka spruce. The canopy is 60-80 meters overhead. Sound
// reflects off massive trunks (1-3m diameter) and is absorbed
// by moss, ferns, and soft duff.
//
// Character: long RT60 (2-4 seconds), diffuse early reflections
// from tree trunks at irregular intervals, high-frequency
// absorption from foliage (the forest acts as a natural
// low-pass filter on reverb tails).

// Simple allpass-comb reverb network
// 4 comb filters with forest-appropriate delay times
// (representing reflections from tree trunks at 5-20m distances)

reverb_input = song_signal * reverb_amount;

// Comb filter delay times (in samples at 44100 Hz)
// Representing reflections from tree trunks at various distances
d1 = 1447;   // ~33ms — nearest trunk (~5.5m)
d2 = 2371;   // ~54ms — next trunk (~9m)
d3 = 3557;   // ~81ms — farther trunk (~13.5m)
d4 = 4909;   // ~111ms — distant trunk (~19m)

// Feedback gains — long tail, forest absorption
fb = 0.82;  // RT60 ~ 2.5 seconds

// Comb filters
comb1 = +~(@(d1-1) * fb) * 0.25;
comb2 = +~(@(d2-1) * fb) * 0.25;
comb3 = +~(@(d3-1) * fb) * 0.25;
comb4 = +~(@(d4-1) * fb) * 0.25;

// Allpass filters for diffusion
ap1 = fi.allpass_comb(2048, 557, 0.5);
ap2 = fi.allpass_comb(2048, 853, 0.5);

// Forest high-frequency absorption — the canopy eats treble
forest_lpf = fi.resonlp(3500 - reverb_amount * 1500, 1, 1.0);

// Reverb tail
reverb_wet = reverb_input
           <: comb1, comb2, comb3, comb4
           :> _
           : ap1 : ap2
           : forest_lpf
           : fi.dcblocker;

// Dry/wet mix
reverb_mix = song_signal * (1.0 - reverb_amount * 0.5)
           + reverb_wet;


// ==========================================================
// AMBIENT — DAWN FOREST
// ==========================================================

// --- Canopy Wind ---
// Wind moving through old-growth canopy. Deep, slow modulation
// with higher-frequency rustling of needles and small branches.
// Pink noise foundation — forests filter wind naturally.
wind_main = no.pink_noise * canopy_wind * 0.06
          : fi.resonlp(600 + 200 * os.osc(0.05), 1.5, 1.0)
          : *(0.6 + 0.4 * os.osc(0.07));

// Needle rustle — higher frequency component
needle_rustle = no.noise * canopy_wind * 0.02
              : fi.resonbp(2400 + 400 * os.osc(0.11), 3, 1.0)
              : *(max(0.0, os.osc(0.13) * 0.6 + 0.2));

// --- Distant Stream ---
// A small forest creek — the kind of stream Swainson's Thrushes
// nest near. Low-pass filtered broadband noise with gentle
// rhythmic variation from water flowing over small stones.
stream_main = no.noise * stream_level * 0.04
            : fi.resonlp(1200, 2, 1.0)
            : fi.resonhp(100, 1, 1.0)
            : *(0.7 + 0.3 * os.osc(0.09));

// Occasional small splash — water over a stone
stream_splash = no.noise * stream_level * 0.015
              : fi.resonbp(1800 + 300 * os.osc(0.07), 4, 1.0)
              : *(max(0.0, os.osc(0.23) - 0.6));

// --- Forest Floor ---
// The deep quiet of old-growth — a very faint, warm low drone.
// The accumulated weight of centuries of growth and stillness.
forest_floor = no.pink_noise * 0.008
             : fi.resonlp(180, 3, 1.0)
             : *(0.5 + 0.5 * os.osc(0.03));

// Combined ambient
ambient = wind_main + needle_rustle + stream_main
        + stream_splash + forest_floor;


// ==========================================================
// STEREO OUTPUT
// ==========================================================
//
// Slight L/R delay for spatial width — the bird is perched
// in one location but the forest spreads the sound.

// Spatial delay (1.2ms offset — subtle but perceptible)
spatial_delay = 53;  // ~1.2ms at 44100 Hz

// Final mix
mono_out = reverb_mix + ambient;

// Left: direct. Right: slightly delayed (forest spatial spread).
left_out = mono_out : fi.dcblocker;
right_out = mono_out : @(spatial_delay) : fi.dcblocker;

process = left_out, right_out;
