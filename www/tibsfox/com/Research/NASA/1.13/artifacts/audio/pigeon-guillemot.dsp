// Pigeon Guillemot — Cepphus columba Song
// FAUST DSP source — generative ambient coastal vocalization
//
// Mission 1.13 Bird Connection: Pigeon Guillemot (degree 13)
// A small seabird of the auk family (Alcidae) found along rocky
// coastlines of the North Pacific from Alaska to California.
// Black plumage with distinctive white wing patches and bright
// red feet and mouth lining. Nests in rocky crevices, sea caves,
// and sometimes under driftwood or in burrows.
//
// Call characteristics:
//   Fundamental frequency: ~3000-5000 Hz (thin, high-pitched)
//   Quality: a wavering, thin whistle — "peeeer" or "pi-eeer"
//   Duration: 0.5-1.5 seconds per call
//   Pattern: repeated at irregular intervals, 2-6 seconds apart
//   Often tremulous, with slight frequency wobble
//   Sometimes a descending trill at the end
//   Heard near nesting colonies on rocky shores and sea cliffs
//   Both sexes vocalize; calls intensify during breeding season
//
// Acoustic environment:
//   Rocky coastline with surf: waves breaking on rocks,
//   splash, surge, rhythmic crash-and-hiss of the Pacific.
//   The guillemot's high-pitched whistle cuts above the
//   low-frequency rumble of the ocean — frequency separation
//   for communication, same strategy as the dipper's song
//   cutting through stream noise.
//
// Connection to Pioneer 5:
//   The guillemot's whistle across the noise of the surf is
//   the biological version of Pioneer 5's signal across the
//   noise of space. A thin, high-frequency carrier cutting
//   through broadband interference. Both rely on the same
//   physics: a narrow-band signal at a frequency above the
//   noise floor. The ocean is the guillemot's cosmic background.
//
// Build:
//   faust2jaqt pigeon-guillemot.dsp    # Standalone
//   faust2lv2  pigeon-guillemot.dsp    # LV2 plugin

import("stdfaust.lib");

// --- Parameters ---
call_rate = hslider("[0]Call Rate", 0.4, 0.1, 1.0, 0.01) : si.smoo;
surf_volume = hslider("[1]Surf Volume", 0.5, 0, 1.0, 0.01) : si.smoo;
call_intensity = hslider("[2]Call Intensity", 0.7, 0, 1.0, 0.01) : si.smoo;
wind_level = hslider("[3]Wind Level", 0.3, 0, 1.0, 0.01) : si.smoo;

// ============================================
// PRIMARY GUILLEMOT — thin wavering whistle
// ============================================
// The Pigeon Guillemot produces a thin, high-pitched "peeeer"
// or "pi-eeer" call. Wavering quality with slight FM wobble.
// The call rises slightly in pitch, sustains, then may drop
// at the end or trail off with a trill.

call_period = 5.0 / call_rate;
call_phase = os.phasor(1, 1.0 / call_period);
call_time = call_phase * call_period;

// Call duration: 0.6-1.2 seconds, then silence until next call
call_dur = 1.0;
call_active = ba.if(call_time < call_dur, 1.0, 0.0);

// Envelope: attack 30ms, sustain, decay 80ms
call_env = call_active *
  ba.if(call_time < 0.03, call_time / 0.03,
  ba.if(call_time > (call_dur - 0.08), (call_dur - call_time) / 0.08,
  1.0));

// --- Frequency contour ---
// "peeeer": rises slightly, sustains, slight drop at end
base_freq = 3800;
rise = ba.if(call_time < 0.15, 1.0 + 0.08 * (call_time / 0.15), 1.08);
drop_end = ba.if(call_time > (call_dur - 0.15),
  1.0 - 0.05 * ((call_time - (call_dur - 0.15)) / 0.15),
  1.0);
freq_contour = rise * drop_end;

// --- Wavering quality ---
// Slight tremolo/vibrato at 5-8 Hz gives the "thin" quality
waver_rate = 6.5 + 1.5 * os.osc(0.3);
waver_depth = 80.0 * call_intensity;
waver_fm = waver_depth * os.osc(waver_rate);

// --- Harmonic content ---
// Thin whistle: strong fundamental, weak harmonics
fund_freq = base_freq * freq_contour + waver_fm;
h1 = os.osc(fund_freq) * 1.0;
h2 = os.osc(fund_freq * 2.003) * 0.12;  // very weak second harmonic
h3 = os.osc(fund_freq * 3.01) * 0.04;   // trace third
breathy = no.noise * 0.05 : fi.bandpass(2, fund_freq * 0.8, fund_freq * 1.2);

primary_call = (h1 + h2 + h3 + breathy) * call_env * call_intensity * 0.5;

// ============================================
// SECONDARY GUILLEMOT — distant response
// ============================================
// A second bird calling from further away, offset in time
second_period = call_period * 1.37;  // different rhythm
second_phase = os.phasor(1, 1.0 / second_period);
second_time = second_phase * second_period;

second_dur = 0.8;
second_active = ba.if(second_time < second_dur, 1.0, 0.0);
second_env = second_active *
  ba.if(second_time < 0.03, second_time / 0.03,
  ba.if(second_time > (second_dur - 0.06), (second_dur - second_time) / 0.06,
  1.0));

// Slightly higher pitch, more distant
second_freq = 4100 + 60.0 * os.osc(7.0);
second_call = os.osc(second_freq) * second_env * call_intensity * 0.2;

// ============================================
// SURF — ocean waves on rocky shore
// ============================================
// Rhythmic wave pattern: surge, crash, hiss, retreat
// Period ~6-10 seconds. Low-frequency rumble with high-freq splash.

wave_period = 8.0;
wave_phase = os.phasor(1, 1.0 / wave_period);
wave_time = wave_phase * wave_period;

// Wave envelope: builds, crashes, hisses out
wave_surge = ba.if(wave_time < 3.0, wave_time / 3.0,
             ba.if(wave_time < 3.5, 1.0,
             ba.if(wave_time < 5.0, 1.0 - 0.6 * ((wave_time - 3.5) / 1.5),
             0.4 * (1.0 - (wave_time - 5.0) / 3.0))));

// Low rumble — the body of the wave
wave_rumble = no.noise : fi.lowpass(3, 300) : fi.highpass(1, 40);
wave_rumble_shaped = wave_rumble * wave_surge * 1.2;

// Crash — broadband burst at the break point
crash_env = ba.if(wave_time > 2.8 & wave_time < 3.8,
  ba.if(wave_time < 3.2, (wave_time - 2.8) / 0.4, (3.8 - wave_time) / 0.6),
  0.0);
wave_crash = no.noise : fi.bandpass(2, 800, 6000) * crash_env * 0.8;

// Hiss — retreating water on rocks
hiss_env = ba.if(wave_time > 3.5 & wave_time < 6.5,
  ba.if(wave_time < 4.0, (wave_time - 3.5) / 0.5, (6.5 - wave_time) / 2.5),
  0.0);
wave_hiss = no.noise : fi.highpass(2, 3000) * hiss_env * 0.4;

// Second wave (offset) for complexity
wave2_period = 11.0;
wave2_phase = os.phasor(1, 1.0 / wave2_period);
wave2_time = wave2_phase * wave2_period;
wave2_surge = ba.if(wave2_time < 4.0, wave2_time / 4.0,
              ba.if(wave2_time < 5.0, 1.0,
              0.5 * (1.0 - (wave2_time - 5.0) / 6.0)));
wave2_rumble = no.noise : fi.lowpass(3, 250) : fi.highpass(1, 50) * wave2_surge * 0.6;

surf_total = (wave_rumble_shaped + wave_crash + wave_hiss + wave2_rumble) * surf_volume;

// ============================================
// WIND — coastal breeze
// ============================================
// Low, gusting wind around rocky headlands
wind_gust = 0.5 + 0.5 * os.osc(0.08 + 0.02 * os.osc(0.013));
wind_sound = no.noise : fi.bandpass(2, 100, 600) * wind_gust * wind_level * 0.25;

// ============================================
// COMPOSITION — bird calls above the surf
// ============================================
// The guillemot's high whistle cuts above the low surf noise.
// This is natural frequency-division multiplexing.

all_calls = primary_call + second_call;
all_ambient = surf_total + wind_sound;

// Stereo: primary bird slightly left, secondary right, surf wide
output_L = all_calls * 0.6 + second_call * 0.2 + all_ambient * 0.5;
output_R = all_calls * 0.4 + second_call * 0.8 + all_ambient * 0.5;

// Gentle limiter
soft_clip(x) = x : min(0.95) : max(-0.95);

process = output_L : soft_clip, output_R : soft_clip;
