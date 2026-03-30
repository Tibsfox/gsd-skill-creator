// Explorer 3 Tape Recorder Sonification
// FAUST DSP source — compiles to VST, AU, LV2, JACK, CLI
//
// Mission 1.9: Explorer 3 (confirmed Van Allen belts with tape recorder)
// The sound of magnetic tape recording the invisible. ~35 seconds per cycle.
//
// On March 26, 1958, the Army Ballistic Missile Agency launched Explorer 3
// into an orbit of 186 × 2,799 km using a Juno I rocket. It weighed 14.1 kg
// — nearly identical to Explorer 1, but with one crucial addition: a
// miniature tape recorder designed by George Ludwig at the University of Iowa.
//
// Explorer 1 had detected the Van Allen radiation belts, but its real-time
// telemetry only covered ~10% of each orbit — the portions visible from
// ground stations. The rest was silence. Van Allen suspected the Geiger
// counter was saturating, but he could not prove it without continuous data.
//
// Explorer 3's tape recorder changed everything. It recorded data
// continuously throughout each orbit on a small magnetic tape loop, then
// played it back at high speed (compressed 4:1) when the satellite passed
// over a ground station. For the first time, scientists had a complete
// radiation profile of an entire orbit. The data confirmed what Van Allen
// had inferred: the Geiger counter was indeed saturating in the inner belt,
// and the radiation intensity was far higher than anyone had imagined.
//
// This sonification cycles through: slow recording (clicking Geiger counts
// being written to tape with magnetic hiss), then fast compressed playback
// (same data at 4x speed, chipmunk effect), then a pause as the tape
// rewinds. The cycle repeats — record, rewind, playback — the rhythm of
// store-and-forward that made Explorer 3 the confirmation mission.
//
// Timeline (phase 0-1 → 0-35 seconds):
//   0-15s:    Recording — slow tape movement, magnetic hiss, Geiger clicks
//             being captured. Clicks increase in density as the satellite
//             approaches the radiation belt, then disappear (saturation).
//   15-18s:   Rewind — the tape spools back with a mechanical whir,
//             higher pitched than the recording motion.
//   18-28s:   Playback — same Geiger data at 4x speed. The slow clicks
//             become a rapid chatter. The saturation silence compresses
//             into a brief gap. The entire orbit in 10 seconds.
//   28-35s:   Silence — the ground station processes the data.
//             Van Allen reads the printout. The belts are confirmed.
//
// Organism resonance: Marchantia polymorpha (common liverwort)
//   The liverwort records its genetic information in gemma cups — small
//   circular structures on the thallus surface that contain disc-shaped
//   gemmae (clonal propagules). When rain splashes into a gemma cup, the
//   gemmae are ejected and dispersed, each carrying a complete copy of
//   the parent's genetic data. The gemma cup is a biological tape recorder:
//   it stores information (DNA), then releases compressed copies (gemmae)
//   that carry the full dataset to new locations. Explorer 3's tape loop
//   and the liverwort's gemma cup are both store-and-forward systems.
//
// Dedication: Joseph Campbell
//   Campbell mapped the hero's journey — the monomyth — by recording
//   patterns across thousands of stories from every culture. His method
//   was the tape recorder of comparative mythology: capture the data
//   across the full orbit of human storytelling, then play it back
//   compressed, revealing the universal pattern hidden in the noise.
//   The hero ventures into the unknown, encounters trials, and returns
//   with knowledge. Explorer 3 ventured into the radiation belt,
//   recorded what it found, and returned the data to Earth.
//
// Build:
//   faust2jaqt explorer3-tape-synth.dsp   # JACK/Qt standalone
//   faust2lv2  explorer3-tape-synth.dsp   # LV2 plugin
//   faust2vst  explorer3-tape-synth.dsp   # VST plugin (needs VST SDK)
//
// Install FAUST: https://faust.grame.fr/downloads/

import("stdfaust.lib");

// --- Parameters ---
phase = hslider("[0]Phase", 0, 0, 1, 0.001) : si.smoo;
auto_mode = checkbox("[1]Auto (35s cycle)");
tape_speed = hslider("[2]Tape Hiss Level", 0.6, 0, 1, 0.01) : si.smoo;
volume = hslider("[3]Volume", 0.7, 0, 1, 0.01) : si.smoo;

// Auto-advancing phase (35-second cycle)
auto_phase = os.phasor(1, 1.0/35.0);
active_phase = select2(auto_mode, phase, auto_phase);

// --- Time mapping ---
time_sec = active_phase * 35.0;

// ============================================
// PHASE DETECTION
// ============================================
// 0.000-0.428: Recording (0-15s)
// 0.428-0.514: Rewind (15-18s)
// 0.514-0.800: Playback (18-28s)
// 0.800-1.000: Silence (28-35s)

is_recording = active_phase < 0.428;
is_rewind = (active_phase >= 0.428) & (active_phase < 0.514);
is_playback = (active_phase >= 0.514) & (active_phase < 0.800);
is_silence = active_phase >= 0.800;

// Smooth envelopes for each phase
rec_env = ba.if(is_recording, 1.0, 0.0) : si.smoo;
rew_env = ba.if(is_rewind, 1.0, 0.0) : si.smoo;
play_env = ba.if(is_playback, 1.0, 0.0) : si.smoo;
sil_env = ba.if(is_silence, 1.0, 0.0) : si.smoo;

// ============================================
// MAGNETIC TAPE HISS
// ============================================
// The characteristic broadband noise of magnetic tape,
// shaped by the head gap and equalization circuits.
// Higher frequencies are slightly emphasized (tape EQ).

tape_noise_raw = no.noise;
tape_hiss_low = tape_noise_raw : fi.resonlp(3000, 0.7, 1.0);
tape_hiss_high = tape_noise_raw : fi.resonhp(2000, 0.5, 1.0) : *(0.3);
tape_hiss = (tape_hiss_low + tape_hiss_high) * 0.04 * tape_speed;

// During recording: normal speed hiss
// During playback: 4x speed = higher frequency content
tape_hiss_rec = tape_hiss * rec_env;
tape_hiss_play = (tape_noise_raw : fi.resonlp(8000, 0.6, 1.0)) * 0.03
                 * play_env * tape_speed;

// ============================================
// TAPE TRANSPORT MECHANISM
// ============================================
// Subtle mechanical sounds: capstan motor hum, reel wobble

// Capstan motor: low hum at recording speed
capstan_rec = os.osc(60.0) * 0.02 * rec_env;
// At playback: 4x speed = 240 Hz
capstan_play = os.osc(240.0) * 0.015 * play_env;

// Reel-to-reel flutter: slight speed variation
flutter_rate = 5.0 + os.osc(0.3) * 1.0;
flutter = os.osc(flutter_rate) * 0.003;

// Rewind motor: high-pitched whir rising in frequency
rewind_phase = ba.if(is_rewind,
                     (active_phase - 0.428) / 0.086,
                     0.0);
rewind_freq = 200.0 + rewind_phase * 600.0;
rewind_whir = os.osc(rewind_freq) * 0.08 * rew_env
              + os.osc(rewind_freq * 1.5) * 0.03 * rew_env
              + (no.noise : fi.resonbp(rewind_freq * 2.0, 8.0, 1.0))
                * 0.04 * rew_env;

// ============================================
// GEIGER COUNTER CLICKS
// ============================================
// The radiation being recorded. During recording, clicks arrive at
// varying rates depending on orbital position relative to the belt.
// During playback, the same pattern at 4x speed.

// Click generator: short impulses at variable rate
// Rate increases as satellite approaches belt, then drops to zero
// (saturation) in the heart of the belt

// Radiation intensity profile during recording (0-15s)
// 0-5s: low background (cosmic rays)
// 5-10s: increasing (entering belt)
// 10-12s: silence (saturated — in the belt)
// 12-15s: decreasing (exiting belt)
rec_progress = ba.if(is_recording, active_phase / 0.428, 0.0);
belt_profile = ba.if(rec_progress < 0.33,
                     rec_progress * 3.0 * 0.3,
                     ba.if(rec_progress < 0.66,
                       ba.if(rec_progress < 0.5,
                             0.3 + (rec_progress - 0.33) * 5.88,
                             ba.if(rec_progress < 0.55,
                                   0.0,
                                   (rec_progress - 0.55) * 9.09)),
                       ba.if(rec_progress < 0.8,
                             1.0 - (rec_progress - 0.66) * 7.14,
                             0.1)));

// Click rate: 2-30 Hz depending on radiation intensity
click_rate = 2.0 + belt_profile * 28.0;

// Pseudo-random click generator using sample-and-hold noise
click_trigger = abs(no.noise) < (click_rate / ma.SR);
click_sound = click_trigger * 0.3 : fi.resonbp(4000, 20.0, 1.0) : *(4.0);
click_decay = click_trigger : en.ar(0.0001, 0.008);
geiger_click = click_sound * click_decay;

// Recording clicks (normal speed)
geiger_rec = geiger_click * rec_env * (1.0 - ba.if(rec_progress > 0.5
             & rec_progress < 0.55, 1.0, 0.0) : si.smoo);

// Playback clicks (4x speed — use faster trigger rate)
play_progress = ba.if(is_playback,
                      (active_phase - 0.514) / 0.286,
                      0.0);
// Compressed belt profile at 4x
belt_play = ba.if(play_progress < 0.33,
                  play_progress * 3.0 * 0.3,
                  ba.if(play_progress < 0.66,
                    ba.if(play_progress < 0.5,
                          0.3 + (play_progress - 0.33) * 5.88,
                          ba.if(play_progress < 0.55,
                                0.0,
                                (play_progress - 0.55) * 9.09)),
                    ba.if(play_progress < 0.8,
                          1.0 - (play_progress - 0.66) * 7.14,
                          0.1)));

click_rate_fast = 8.0 + belt_play * 112.0;  // 4x speed
click_trigger_fast = abs(no.noise) < (click_rate_fast / ma.SR);
click_sound_fast = click_trigger_fast * 0.25
                   : fi.resonbp(6000, 15.0, 1.0) : *(3.0);
click_decay_fast = click_trigger_fast : en.ar(0.0001, 0.004);
geiger_fast = click_sound_fast * click_decay_fast;

geiger_play = geiger_fast * play_env * (1.0 - ba.if(play_progress > 0.5
              & play_progress < 0.55, 1.0, 0.0) : si.smoo);

// ============================================
// RECORDING HEAD SOUND
// ============================================
// Subtle magnetic writing sound — a soft scraping quality
// as the head magnetizes the tape coating

write_head = (no.noise : fi.resonbp(1200, 25.0, 1.0)) * 0.015 * rec_env
             + os.osc(120.0) * 0.008 * rec_env;

// ============================================
// PLAYBACK HEAD — FREQUENCY SHIFT
// ============================================
// At 4x playback, the frequency response shifts up by 2 octaves.
// What was recorded at 120 Hz plays back at 480 Hz.
// This creates the characteristic "chipmunk" pitch shift.

playback_head = os.osc(480.0) * 0.01 * play_env
                + (no.noise : fi.resonbp(4800, 20.0, 1.0)) * 0.01
                  * play_env;

// ============================================
// SILENCE PHASE — VAN ALLEN READS
// ============================================
// A deep, contemplative tone. The data has been received.
// The belts are confirmed. A low drone of realization.

confirm_drone = os.osc(55.0) * 0.04 * sil_env
                + os.osc(82.5) * 0.02 * sil_env
                + os.osc(110.0) * 0.015 * sil_env;
// The faintest hint of cosmic background
cosmic_whisper = (no.noise : fi.resonlp(150, 0.3, 1.0)) * 0.005 * sil_env;

// ============================================
// ORBITAL PERSISTENCE — ALWAYS PRESENT
// ============================================
// A deep bass note representing the orbit itself.
// Explorer 3 only lasted 93 days (re-entered June 27, 1958),
// but the data it recorded changed our understanding of space.

orbit_bass = os.osc(41.2) * 0.03  // Low E
             + os.osc(41.2 * 2.0) * 0.015;
orbit_breath = 0.8 + 0.2 * os.osc(1.0 / 35.0);

// ============================================
// Final mix
// ============================================
recording_layer = tape_hiss_rec + capstan_rec + geiger_rec + write_head;
rewind_layer = rewind_whir;
playback_layer = tape_hiss_play + capstan_play + geiger_play + playback_head;
silence_layer = confirm_drone + cosmic_whisper;
constant_layer = orbit_bass * orbit_breath;

output = (recording_layer * 0.6 +
          rewind_layer * 0.5 +
          playback_layer * 0.7 +
          silence_layer * 0.4 +
          constant_layer + flutter) * volume;

process = output * 0.7 <: _, _;
