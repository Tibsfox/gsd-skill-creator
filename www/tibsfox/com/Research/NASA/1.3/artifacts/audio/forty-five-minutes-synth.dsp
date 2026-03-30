// Forty-Five Minutes — Pioneer 2 Ascent and Silence Synthesizer
// FAUST DSP source — compiles to VST, AU, LV2, JACK, CLI
//
// Mission 1.3: Pioneer 2 (Thor-Able I)
// 45 minutes of flight compressed to ~60 seconds
// Maps the three-stage rocket sequence: two stages fire, third is silence
//
// Timeline (mission time → synth time):
//   0-10s:     First stage burn — Thor DM-18, deep rumble, 667 kN
//   10-20s:    Second stage burn — AJ10-40, higher pitch, cleaner
//   20-22s:    Stage 2 separation + spin-up — mechanical clatter
//   22-28s:    SILENCE — the third stage should fire here. It does not.
//   28-50s:    Ballistic coast — quiet ascent, instrument hum, faint telemetry
//   50-55s:    Apogee at 1,550 km — near-silence, sparse radiation ticks
//   55-60s:    Descent and reentry — broadband roar, then nothing
//
// The silence from 22-28s IS the story. The pause where ignition
// should happen and does not is the most important sound in this piece.
//
// Build:
//   faust2jaqt forty-five-minutes-synth.dsp   # JACK/Qt standalone
//   faust2lv2  forty-five-minutes-synth.dsp   # LV2 plugin
//   faust2vst  forty-five-minutes-synth.dsp   # VST plugin (needs VST SDK)
//
// Parameters:
//   - Phase (0-1): manual scrub through the 60-second profile
//   - Auto: toggle automatic 60-second playthrough
//   - Intensity: overall volume
//   - Silence Depth: how quiet the third-stage gap gets (0=some hiss, 1=dead)
//
// Install FAUST: https://faust.grame.fr/downloads/

import("stdfaust.lib");

// --- Parameters ---
phase = hslider("[0]Phase", 0, 0, 1, 0.001) : si.smoo;
auto_mode = checkbox("[1]Auto (60s cycle)");
intensity = hslider("[2]Intensity", 0.7, 0, 1, 0.01) : si.smoo;
silence_depth = hslider("[3]Silence Depth", 0.9, 0, 1, 0.01) : si.smoo;

// Auto-advancing phase (60-second cycle)
auto_phase = os.phasor(1, 1.0/60.0);
active_phase = select2(auto_mode, phase, auto_phase);

// --- Time mapping (phase 0-1 → 0-60 seconds) ---
time_sec = active_phase * 60.0;

// --- Stage envelopes ---
// Stage 1: 0-10s (full burn, rumble)
stage1_env = ba.if(time_sec < 10.0,
               min(time_sec / 0.5, 1.0) *         // 0.5s attack
               ba.if(time_sec > 9.0, (10.0 - time_sec), 1.0),  // 1s release
               0.0);

// Stage 2: 10-20s (cleaner burn, higher pitch)
stage2_env = ba.if(time_sec > 10.0 & time_sec < 20.0,
               min((time_sec - 10.0) / 0.3, 1.0) *   // 0.3s attack
               ba.if(time_sec > 19.0, (20.0 - time_sec), 1.0),  // 1s release
               0.0);

// Separation clatter: 20-22s
sep_env = ba.if(time_sec > 20.0 & time_sec < 22.0,
            (1.0 - (time_sec - 20.0) / 2.0) * 0.4,
            0.0);

// THE SILENCE: 22-28s — the third stage gap
// This is where the X-248 should fire but does not
silence_gate = ba.if(time_sec > 22.0 & time_sec < 28.0,
                 1.0 - silence_depth,   // Near-zero if silence_depth is high
                 1.0);

// Coast phase: 28-50s (quiet ascent, instruments working)
coast_env = ba.if(time_sec > 28.0 & time_sec < 50.0,
              smoothstep(28.0, 30.0, time_sec) *
              smoothstep(50.0, 48.0, time_sec) * 0.15,
              0.0)
with {
  smoothstep(e0, e1, x) = t * t * (3.0 - 2.0 * t)
  with { t = max(0.0, min(1.0, (x - e0) / (e1 - e0))); };
};

// Apogee: 50-55s (near-silence, 1,550 km)
apogee_env = ba.if(time_sec > 50.0 & time_sec < 55.0,
               0.05 * (1.0 - abs(time_sec - 52.5) / 2.5),
               0.0);

// Reentry: 55-60s (broadband roar → silence)
reentry_env = ba.if(time_sec > 55.0 & time_sec < 59.0,
                min((time_sec - 55.0) / 1.0, 1.0) *   // 1s attack
                ba.if(time_sec > 57.5, max(0.0, (59.0 - time_sec) / 1.5), 1.0),
                0.0);

// Final silence: 59-60s
final_silence = ba.if(time_sec > 59.0, 0.0, 1.0);

// --- Stage 1: Thor DM-18 Engine Sound ---
// Deep, rumbling, lots of low-frequency energy
// 667 kN of thrust through a single Rocketdyne LR-79
s1_base = os.osc(28) * 0.3 + os.osc(42) * 0.2 + os.osc(14) * 0.15;
s1_rumble = no.noise : fi.resonlp(120, 1, 1.0) : *(0.35);
s1_crackle = no.noise : fi.resonbp(800, 3, 1.0) : *(0.08);
// Turbopump whine (subtle)
s1_pump = os.osc(380) * 0.04 + os.osc(760) * 0.02;
stage1 = (s1_base + s1_rumble + s1_crackle + s1_pump) * stage1_env;

// --- Stage 2: AJ10-40 Engine Sound ---
// Higher pitched, smoother — pressure-fed engine, no turbopump
// Less acoustic power than the Thor but cleaner spectrum
s2_base = os.osc(80) * 0.2 + os.osc(160) * 0.15 + os.osc(240) * 0.08;
s2_hiss = no.noise : fi.resonbp(2000, 4, 1.0) : *(0.15);
s2_harmonic = os.osc(320) * 0.05 + os.osc(480) * 0.03;
stage2 = (s2_base + s2_hiss + s2_harmonic) * stage2_env;

// --- Separation: mechanical clatter ---
sep_clicks = no.noise * (no.noise > 0.92) : fi.resonbp(3000, 6, 1.0);
sep_thud = no.noise : fi.resonlp(200, 2, 1.0) : *(0.3);
separation = (sep_clicks * 0.3 + sep_thud) * sep_env;

// --- The Silence ---
// During 22-28s, almost everything drops out
// Only the faintest electronics hum remains
silence_hum = os.osc(60) * 0.008 + os.osc(120) * 0.004;
silence_sound = silence_hum * ba.if(time_sec > 22.0 & time_sec < 28.0, 1.0, 0.0);

// --- Coast: instruments working, faint telemetry ---
// Quiet hum of spacecraft systems
coast_hum = os.osc(108.06) * 0.02 + os.osc(216.12) * 0.01;  // Telemetry carrier
coast_tick = no.noise * (no.noise > 0.997) : fi.resonbp(1200, 8, 1.0) : *(0.06);
// Radiation counter (sparse clicks at low altitude)
coast_rad = no.noise * (no.noise > 0.994) : fi.resonbp(2500, 10, 1.0) : *(0.04);
// TV camera scan line (subtle periodic tone)
coast_tv = os.osc(15750.0 / 100.0) * 0.008;  // Scaled scan frequency
coast_sound = (coast_hum + coast_tick + coast_rad + coast_tv) * coast_env;

// --- Apogee: 1,550 km, near-silence ---
// The faintest possible telemetry, barely there
apogee_tone = os.osc(108.06) * 0.01;
apogee_space = no.noise * (no.noise > 0.999) * 0.03 : fi.resonlp(600, 2, 1.0);
apogee_sound = (apogee_tone + apogee_space) * apogee_env;

// --- Reentry: broadband destruction ---
reentry_roar = no.noise * 0.4 : fi.resonlp(3000 + reentry_env * 5000, 1, 1.0);
reentry_plasma = no.noise : fi.resonbp(1500, 2, 1.0) : *(reentry_env * 0.3);
reentry_crack = os.osc(50 + reentry_env * 200) * reentry_env * 0.15;
reentry_sound = (reentry_roar + reentry_plasma + reentry_crack) * reentry_env;

// --- Mix ---
process = (stage1 + stage2 + separation + silence_sound +
          coast_sound + apogee_sound + reentry_sound)
        * silence_gate
        * intensity
        * final_silence
        : fi.dcblocker
        : fi.resonlp(14000, 1, 1.0)
        <: _,_;  // Stereo output (mono duplicated)
