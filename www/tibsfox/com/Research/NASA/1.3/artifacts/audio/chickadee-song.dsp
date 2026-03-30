// Black-capped Chickadee Song — Poecile atricapillus Vocalization Synthesis
// FAUST DSP source — generative ambient birdsong
//
// Mission 1.3 Bird Connection: Black-capped Chickadee (degree 3)
// Lives in the salal thicket, foraging through dense understory
// stems. Two primary vocalizations:
//
// 1. FEE-BEE song: Two pure whistled tones, the first higher,
//    descending roughly a minor third. ~3800 Hz → ~3200 Hz.
//    Each note held ~0.5 seconds. Used for territory and mate
//    attraction. Remarkably pure — nearly sinusoidal.
//
// 2. CHICK-A-DEE-DEE call: Complex alarm/social call.
//    "chick" = broadband noise burst (~2-8 kHz)
//    "a" = brief tonal bridge (~4 kHz)
//    "dee" = descending buzzy note (~3.5-2.5 kHz)
//    Number of "dee" syllables encodes predator threat level:
//    2 dee = low threat, 10+ dee = extreme threat (pygmy owl)
//
// Build:
//   faust2jaqt chickadee-song.dsp    # Standalone
//   faust2lv2  chickadee-song.dsp    # LV2 plugin
//
// This is a generative piece. Alternates between fee-bee songs
// and chick-a-dee-dee alarm calls with randomized timing and
// dee-count variation.

import("stdfaust.lib");

// --- Parameters ---
call_rate = hslider("[0]Call Rate", 0.5, 0.1, 1.0, 0.01) : si.smoo;
threat_level = hslider("[1]Threat Level", 0.3, 0, 1.0, 0.01) : si.smoo;
forest_reverb = hslider("[2]Forest Reverb", 0.5, 0, 1.0, 0.01) : si.smoo;
song_vs_call = hslider("[3]Song/Call Mix", 0.6, 0, 1, 0.01) : si.smoo;

// ============================================
// FEE-BEE SONG
// ============================================
// Two pure tones: "fee" at ~3800 Hz, "bee" at ~3200 Hz
// Interval: roughly a minor third
// Each note: ~0.4-0.6 seconds
// Silence between fee and bee: ~0.1 seconds
// Silence between songs: 3-8 seconds

// Song cycle timing
song_period = 6.0 / call_rate;
song_phase = os.phasor(1, 1.0 / song_period);

// Fee-bee structure within each cycle:
// 0.00-0.08: "fee" (first tone, higher)
// 0.08-0.10: silence between notes
// 0.10-0.18: "bee" (second tone, lower)
// 0.18-1.00: inter-song silence

// Fee tone envelope
fee_active = song_phase < 0.08;
fee_env = ba.if(fee_active,
            min(song_phase / 0.005, 1.0) *                    // 5ms attack
            ba.if(song_phase > 0.07, (0.08 - song_phase) / 0.01, 1.0),  // 10ms release
            0.0) : si.smoo;

// Bee tone envelope
bee_active = song_phase > 0.10 & song_phase < 0.18;
bee_env = ba.if(bee_active,
            min((song_phase - 0.10) / 0.005, 1.0) *
            ba.if(song_phase > 0.17, (0.18 - song_phase) / 0.01, 1.0),
            0.0) : si.smoo;

// Slight pitch drift within each note (natural variation)
fee_drift = os.osc(3.0) * 15.0;   // ~3 Hz vibrato, ~15 Hz deviation
bee_drift = os.osc(2.8) * 12.0;

// Fee tone: ~3800 Hz, nearly pure sine with faint harmonics
fee_freq = 3800.0 + fee_drift;
fee_tone = os.osc(fee_freq) * 0.88
         + os.osc(fee_freq * 2.0) * 0.06
         + os.osc(fee_freq * 3.0) * 0.02
         + no.noise * 0.003
         : fi.resonbp(fee_freq, 15, 1.0);

// Bee tone: ~3200 Hz, same purity
bee_freq = 3200.0 + bee_drift;
bee_tone = os.osc(bee_freq) * 0.88
         + os.osc(bee_freq * 2.0) * 0.06
         + os.osc(bee_freq * 3.0) * 0.02
         + no.noise * 0.003
         : fi.resonbp(bee_freq, 15, 1.0);

// Combined fee-bee song
fee_bee = fee_tone * fee_env * 0.4 + bee_tone * bee_env * 0.4;

// ============================================
// CHICK-A-DEE-DEE ALARM CALL
// ============================================
// Structure: "chick" + "a" + N x "dee"
// Total call duration varies with number of dee syllables
//
// Timing per element:
//   "chick": ~50ms broadband noise burst
//   "a": ~30ms tonal bridge
//   "dee": ~80ms each, descending buzz
//   gaps: ~20ms between elements

// Alarm call cycle (offset from song cycle)
alarm_period = 8.0 / call_rate;
alarm_phase = os.phasor(1, 1.0 / alarm_period);

// Number of dee syllables: 2-8 based on threat_level
// (real chickadees: 2 dee = low threat, 10+ = pygmy owl)
dee_count_f = 2.0 + threat_level * 6.0;

// Total call duration as fraction of cycle
// chick(50ms) + a(30ms) + gap(20ms) + dee_count * (80ms + 20ms)
// At max (8 dee): 50+30+20 + 8*100 = 900ms
// call occupies first ~12% of the alarm cycle at default rate
call_duration_frac = 0.12;

// Element timing within the call (normalized to call_duration_frac)
// We map sub-phases:
call_sub = ba.if(alarm_phase < call_duration_frac,
             alarm_phase / call_duration_frac,
             -1.0);  // -1 = inactive

// "chick" syllable: 0.00-0.06
chick_env = ba.if(call_sub > 0.0 & call_sub < 0.06,
              min(call_sub / 0.005, 1.0) *
              ba.if(call_sub > 0.04, (0.06 - call_sub) / 0.02, 1.0),
              0.0) : si.smoo;

// Broadband noise burst for "chick"
chick_sound = no.noise : fi.resonbp(5000, 3, 1.0) : *(chick_env * 0.35);

// "a" syllable: 0.08-0.12
a_env = ba.if(call_sub > 0.08 & call_sub < 0.12,
           min((call_sub - 0.08) / 0.005, 1.0) *
           ba.if(call_sub > 0.11, (0.12 - call_sub) / 0.01, 1.0),
           0.0) : si.smoo;

// Brief tonal bridge ~4 kHz
a_sound = os.osc(4000.0) * 0.6 * a_env
        + no.noise * 0.05 * a_env
        : fi.resonbp(4000, 8, 1.0) : *(0.3);

// "dee" syllables: starting at 0.15, each ~0.10 wide, gap ~0.02
// Each "dee" is a descending buzzy tone from ~3500 to ~2500 Hz
dee_sounds = sum(i, 8,
  ba.if(i < int(dee_count_f),
    dee_single(i),
    0.0))
with {
  dee_single(idx) = dee_tone * dee_env
  with {
    dee_start = 0.15 + float(idx) * 0.10;
    dee_end = dee_start + 0.08;
    dee_sub = call_sub;

    dee_env = ba.if(dee_sub > dee_start & dee_sub < dee_end,
                min((dee_sub - dee_start) / 0.005, 1.0) *
                ba.if(dee_sub > dee_end - 0.015,
                  (dee_end - dee_sub) / 0.015, 1.0),
                0.0) : si.smoo;

    // Descending frequency within each "dee"
    dee_progress = ba.if(dee_sub > dee_start & dee_sub < dee_end,
                     (dee_sub - dee_start) / (dee_end - dee_start),
                     0.0);
    dee_freq = 3500.0 - dee_progress * 1000.0;

    // Buzzy quality — harmonics + noise
    dee_tone = (os.osc(dee_freq) * 0.5
              + os.osc(dee_freq * 2.0) * 0.2
              + os.osc(dee_freq * 3.0) * 0.1
              + no.noise * 0.08)
              : fi.resonbp(dee_freq * 1.5, 4, 1.0)
              : *(0.25);
  };
};

// Combined alarm call
alarm_call = chick_sound + a_sound + dee_sounds;

// ============================================
// SECOND BIRD (distant)
// ============================================
// A second chickadee, offset timing, quieter
song_phase2 = os.phasor(1, 1.0 / (song_period * 1.23));

fee_env2 = ba.if(song_phase2 < 0.08,
             min(song_phase2 / 0.005, 1.0) *
             ba.if(song_phase2 > 0.07, (0.08 - song_phase2) / 0.01, 1.0),
             0.0) : si.smoo;

bee_env2 = ba.if(song_phase2 > 0.10 & song_phase2 < 0.18,
             min((song_phase2 - 0.10) / 0.005, 1.0) *
             ba.if(song_phase2 > 0.17, (0.18 - song_phase2) / 0.01, 1.0),
             0.0) : si.smoo;

// Slightly different pitch (individual variation, ~50-100 Hz)
fee2_freq = 3720.0 + os.osc(3.3) * 12.0;
bee2_freq = 3130.0 + os.osc(2.5) * 10.0;

fee2_tone = os.osc(fee2_freq) * 0.85 + os.osc(fee2_freq * 2.0) * 0.05
          : fi.resonbp(fee2_freq, 15, 1.0);
bee2_tone = os.osc(bee2_freq) * 0.85 + os.osc(bee2_freq * 2.0) * 0.05
          : fi.resonbp(bee2_freq, 15, 1.0);

fee_bee2 = (fee2_tone * fee_env2 + bee2_tone * bee_env2) * 0.15;  // Quieter — farther

// ============================================
// FOREST AMBIENCE
// ============================================
// Wind through salal thicket + occasional canopy drip
wind = no.pink_noise : fi.resonlp(250, 2, 1.0) : *(0.012);
// Salal leaves rustling (slightly higher than general wind)
leaves = no.pink_noise : fi.resonbp(1200, 3, 1.0) : *(0.006);
// Canopy drip
drip = no.noise * (no.noise > 0.9994) * 0.05
     : fi.resonbp(3500 + no.noise * 2000, 10, 1.0);

// ============================================
// SIMPLE STEREO REVERB
// ============================================
// Dense thicket acoustic — shorter reverb than open forest,
// more diffuse from all the leaves and stems
dry_signal = fee_bee * song_vs_call + alarm_call * (1.0 - song_vs_call)
           + fee_bee2;

rev_L = dry_signal : de.delay(44100, 1103) * 0.30
      + dry_signal : de.delay(44100, 1847) * 0.22
      + dry_signal : de.delay(44100, 2903) * 0.15;
rev_R = dry_signal : de.delay(44100, 1297) * 0.30
      + dry_signal : de.delay(44100, 2137) * 0.22
      + dry_signal : de.delay(44100, 3251) * 0.15;

// Warmer tail for thicket acoustics
rev_fb_L = rev_L : fi.resonlp(2500, 1, 1.0) * forest_reverb;
rev_fb_R = rev_R : fi.resonlp(2500, 1, 1.0) * forest_reverb;

// ============================================
// PROCESS
// ============================================
process =
  (dry_L + rev_fb_L + wind + leaves + drip),
  (dry_R + rev_fb_R + wind + leaves + drip)
with {
  song_mix = fee_bee * song_vs_call + fee_bee2 * 0.5;
  call_mix = alarm_call * (1.0 - song_vs_call);
  combined = song_mix + call_mix;
  dry_L = combined * 0.65 + fee_bee2 * 0.35;   // Bird 1 slightly left
  dry_R = combined * 0.35 + fee_bee2 * 0.65;   // Bird 2 slightly right
};
