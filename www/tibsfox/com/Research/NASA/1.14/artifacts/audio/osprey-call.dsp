// Osprey — Pandion haliaetus Call
// FAUST DSP source — generative ambient raptor vocalization
//
// Mission 1.14 Bird Connection: Osprey (degree 14)
// A large raptor found on every continent except Antarctica,
// the Osprey is uniquely adapted for fishing. Reversible outer
// toes, spiny foot pads, closable nostrils for diving, and
// dense, oily plumage that sheds water. Builds massive stick
// nests on poles, platforms, and tall trees near water.
//
// Call characteristics:
//   Fundamental frequency: ~3000-5000 Hz (sharp, high-pitched)
//   Quality: a series of sharp, penetrating "cheep cheep cheep"
//            whistles, sometimes described as "tyew tyew tyew"
//   Duration: each note 0.1-0.3 seconds
//   Pattern: series of 3-8 notes, accelerating when alarmed
//   Often given while circling over water or near nest
//   Alarm call: faster, more urgent, higher pitched
//   Both sexes vocalize; male's call slightly higher
//
// Acoustic environment:
//   Open water — lake, river, or coastline. Wind over water,
//   gentle wave lap, distant traffic or boat engines.
//   The Osprey's call carries far over water — designed to
//   be heard across the open environment where it hunts.
//   Clean, penetrating, cutting through wind noise.
//
// Connection to Echo 1:
//   The Osprey hunts by hovering over water and then diving
//   feet-first — using the water's surface as a mirror to
//   spot fish. Echo 1 used its surface as a mirror to bounce
//   radio signals. Both depend on reflection: the Osprey reads
//   reflections from below, Echo 1 reflects signals from above.
//   The Osprey's piercing call over water is the biological
//   equivalent of a radio signal reflecting off a surface —
//   sharp, directional, carrying information across a medium.
//
// Build:
//   faust2jaqt osprey-call.dsp    # Standalone
//   faust2lv2  osprey-call.dsp    # LV2 plugin

import("stdfaust.lib");

// --- Parameters ---
call_rate = hslider("[0]Call Rate", 0.5, 0.1, 1.0, 0.01) : si.smoo;
water_volume = hslider("[1]Water Volume", 0.4, 0, 1.0, 0.01) : si.smoo;
call_intensity = hslider("[2]Call Intensity", 0.7, 0, 1.0, 0.01) : si.smoo;
wind_level = hslider("[3]Wind Level", 0.3, 0, 1.0, 0.01) : si.smoo;

// ============================================
// PRIMARY OSPREY — sharp "cheep cheep cheep"
// ============================================
// The Osprey produces a series of short, sharp, high-pitched
// whistled notes. Each note is a quick upward-inflected "cheep"
// or "tyew" with strong fundamental and some harmonic content.
// Notes come in bursts of 3-8, with decreasing intervals
// when the bird is alarmed.

// Call timing: burst of notes, then silence
burst_period = 8.0 / call_rate;
burst_phase = os.phasor(1, 1.0 / burst_period);
burst_time = burst_phase * burst_period;

// Individual note timing within burst: ~5 notes per burst
// Each note: 0.15s on, 0.25s gap = 0.4s per note
// Total burst: ~2.0s of calling, then silence
note_period = 0.4 / call_rate;
note_phase = os.phasor(1, 1.0 / note_period);
note_time = note_phase * note_period;

// Note is active for first 0.15s of each note period, only during burst
note_dur = 0.15;
burst_active = ba.if(burst_time < 2.5, 1.0, 0.0);
note_active = ba.if(note_time < note_dur, 1.0, 0.0) * burst_active;

// Envelope: very fast attack (5ms), short sustain, quick decay (30ms)
note_env = note_active *
  ba.if(note_time < 0.005, note_time / 0.005,
  ba.if(note_time > (note_dur - 0.03), (note_dur - note_time) / 0.03,
  1.0));

// --- Frequency contour ---
// "cheep": quick upward sweep then level, slight drop at end
base_freq = 3800;
// Sharp attack rises ~500 Hz in first 20ms
rise = ba.if(note_time < 0.02, 1.0 + 0.12 * (note_time / 0.02), 1.12);
// Level for middle portion
sustain_pitch = ba.if(note_time > 0.02 & note_time < (note_dur - 0.03),
  1.12 - 0.02 * ((note_time - 0.02) / (note_dur - 0.05)),
  rise);
// Slight drop at end
drop_end = ba.if(note_time > (note_dur - 0.03),
  1.10 - 0.08 * ((note_time - (note_dur - 0.03)) / 0.03),
  sustain_pitch);
freq_contour = drop_end;

// --- Sharp, penetrating quality ---
// Osprey calls are clear and whistle-like but with some edge
fund_freq = base_freq * freq_contour;
h1 = os.osc(fund_freq) * 1.0;
h2 = os.osc(fund_freq * 2.005) * 0.25;   // audible second harmonic
h3 = os.osc(fund_freq * 3.01) * 0.10;    // trace third
h4 = os.osc(fund_freq * 4.02) * 0.04;    // faint fourth
breathy = no.noise * 0.06 : fi.bandpass(2, fund_freq * 0.9, fund_freq * 1.1);

primary_call = (h1 + h2 + h3 + h4 + breathy) * note_env * call_intensity * 0.4;

// ============================================
// SECONDARY OSPREY — distant mate responding
// ============================================
// A second bird at the nest, responding with a similar but
// slightly different call pattern, offset in time
second_period = burst_period * 1.5 + 1.0;  // different rhythm
second_phase = os.phasor(1, 1.0 / second_period);
second_time = second_phase * second_period;

second_note_phase = os.phasor(1, 1.0 / (note_period * 1.1));
second_note_time = second_note_phase * note_period * 1.1;

second_burst_active = ba.if(second_time < 2.0, 1.0, 0.0);
second_note_active = ba.if(second_note_time < 0.12, 1.0, 0.0) * second_burst_active;
second_env = second_note_active *
  ba.if(second_note_time < 0.005, second_note_time / 0.005,
  ba.if(second_note_time > 0.09, (0.12 - second_note_time) / 0.03,
  1.0));

// Slightly higher pitch, more distant
second_freq = 4200 + 80.0 * os.osc(5.0);
second_call = os.osc(second_freq) * second_env * call_intensity * 0.15;

// ============================================
// WATER — gentle lapping on lakeshore or coast
// ============================================
// Quieter than ocean surf — lake or calm bay environment.
// Gentle, rhythmic lap with occasional splash.

wave_period = 4.0;
wave_phase = os.phasor(1, 1.0 / wave_period);
wave_time = wave_phase * wave_period;

// Gentle wave: swell, lap, retreat
wave_swell = ba.if(wave_time < 1.5, wave_time / 1.5,
             ba.if(wave_time < 2.0, 1.0,
             ba.if(wave_time < 3.0, 1.0 - 0.7 * ((wave_time - 2.0) / 1.0),
             0.3 * (1.0 - (wave_time - 3.0) / 1.0))));

// Low rumble of water
water_body = no.noise : fi.lowpass(3, 200) : fi.highpass(1, 30);
water_shaped = water_body * wave_swell * 0.6;

// Gentle lap — higher frequency splash
lap_env = ba.if(wave_time > 1.4 & wave_time < 2.2,
  ba.if(wave_time < 1.7, (wave_time - 1.4) / 0.3, (2.2 - wave_time) / 0.5),
  0.0);
water_lap = no.noise : fi.bandpass(2, 600, 4000) * lap_env * 0.3;

// Second wave offset
wave2_period = 5.5;
wave2_phase = os.phasor(1, 1.0 / wave2_period);
wave2_time = wave2_phase * wave2_period;
wave2_swell = ba.if(wave2_time < 2.0, wave2_time / 2.0,
              ba.if(wave2_time < 2.5, 1.0,
              0.5 * (1.0 - (wave2_time - 2.5) / 3.0)));
wave2_body = no.noise : fi.lowpass(3, 180) : fi.highpass(1, 40) * wave2_swell * 0.3;

water_total = (water_shaped + water_lap + wave2_body) * water_volume;

// ============================================
// WIND — open water breeze
// ============================================
// Steady wind over open water, occasionally gusting
wind_gust = 0.5 + 0.5 * os.osc(0.06 + 0.015 * os.osc(0.01));
wind_sound = no.noise : fi.bandpass(2, 80, 500) * wind_gust * wind_level * 0.2;

// ============================================
// COMPOSITION — Osprey calls over water
// ============================================
// The Osprey's sharp whistle carries cleanly above the
// quieter water environment — optimized for open-air communication.

all_calls = primary_call + second_call;
all_ambient = water_total + wind_sound;

// Stereo: primary bird overhead-left, secondary distant-right, water wide
output_L = all_calls * 0.55 + second_call * 0.15 + all_ambient * 0.5;
output_R = all_calls * 0.35 + second_call * 0.85 + all_ambient * 0.5;

// Gentle limiter
soft_clip(x) = x : min(0.95) : max(-0.95);

process = output_L : soft_clip, output_R : soft_clip;
