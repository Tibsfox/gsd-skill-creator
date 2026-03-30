// Belted Kingfisher Rattle Call Synthesis
// FAUST DSP source — compiles to VST, AU, LV2, JACK, CLI
//
// Mission 1.9: Explorer 3 — degree 9 bird: Belted Kingfisher
// (Megaceryle alcyon)
//
// The Belted Kingfisher's call is one of the most distinctive sounds
// near Pacific Northwest rivers and shorelines. It is a loud, dry,
// rattling call — a rapid-fire series of harsh "tch-tch-tch-tch" notes
// that sounds like a machine gun or a fishing reel spinning out.
// The call typically lasts 1-2 seconds and often descends slightly
// in pitch toward the end.
//
// The kingfisher dives headfirst into water to catch fish — a plunge
// from one medium (air) into another (water), returning with data
// (food) from below the surface. Explorer 3 plunged into the radiation
// belt — an invisible ocean of charged particles — and returned with
// data recorded on magnetic tape. Both the kingfisher and the satellite
// are store-and-forward systems: dive, capture, return.
//
// The rattle call is also a territorial announcement: the kingfisher
// declares its fishing territory by rattling from a perch above the
// water. Explorer 3's telemetry playback was a similar announcement:
// data compressed and transmitted as a burst when passing over a
// ground station, declaring what it had found in its territory
// above the atmosphere.
//
// Acoustic characteristics:
//   - Fundamental frequency: ~2.5-3.5 kHz
//   - Rapid amplitude modulation: ~20-25 pulses per second
//   - Duration: 1-2 seconds per rattle
//   - Slight downward pitch sweep
//   - Harsh, broadband quality (significant noise component)
//   - Often doubled (two rattles in quick succession)
//
// Build:
//   faust2jaqt kingfisher-rattle.dsp   # JACK/Qt standalone
//   faust2lv2  kingfisher-rattle.dsp   # LV2 plugin
//   faust2vst  kingfisher-rattle.dsp   # VST plugin (needs VST SDK)
//
// Install FAUST: https://faust.grame.fr/downloads/

import("stdfaust.lib");

// --- Parameters ---
trigger = button("[0]Rattle");
auto_mode = checkbox("[1]Auto (4s cycle)");
harshness = hslider("[2]Harshness", 0.7, 0, 1, 0.01) : si.smoo;
pitch = hslider("[3]Pitch (Hz)", 3000, 2000, 4500, 10) : si.smoo;
volume = hslider("[4]Volume", 0.7, 0, 1, 0.01) : si.smoo;

// Auto-triggering: 4-second cycle
// Rattle 1: 0.0-0.35 (1.4s)
// Pause: 0.35-0.45 (0.4s)
// Rattle 2: 0.45-0.7 (1.0s, shorter echo rattle)
// Silence: 0.7-1.0 (1.2s)
auto_phase = os.phasor(1, 1.0/4.0);

auto_rattle1 = (auto_phase < 0.35);
auto_rattle2 = (auto_phase >= 0.45) & (auto_phase < 0.7);
auto_active = auto_rattle1 | auto_rattle2;

active_trigger = select2(auto_mode,
                         trigger > 0.5,
                         auto_active);

// ============================================
// RATTLE PULSE TRAIN
// ============================================
// The core of the kingfisher call: rapid amplitude pulses
// at approximately 22 Hz, creating the machine-gun rattle.
// Each pulse is a brief burst of harsh, broadband sound.

// Rattle rate: slightly variable, ~20-25 Hz
rattle_rate = 22.0 + os.osc(1.5) * 2.0;

// Pulse train: sharp on/off modulation
pulse_phase = os.phasor(1, rattle_rate);
// Duty cycle ~40% (each "tch" is shorter than the gap)
pulse = ba.if(pulse_phase < 0.4, 1.0, 0.0);

// Soften the pulse edges slightly to avoid pure clicks
pulse_shaped = pulse : si.smooth(ba.tau2pole(0.001));

// ============================================
// TONAL COMPONENT
// ============================================
// The kingfisher rattle has a tonal center around 3 kHz
// with harmonics. The pitch descends slightly over the
// duration of the call.

// Pitch descent: start high, end ~10% lower
rattle_progress = ba.if(auto_mode > 0.5,
                        ba.if(auto_rattle1,
                              auto_phase / 0.35,
                              ba.if(auto_rattle2,
                                    (auto_phase - 0.45) / 0.25,
                                    0.0)),
                        os.phasor(1, 0.5));

pitch_sweep = pitch * (1.0 - rattle_progress * 0.12) : si.smoo;

// Fundamental and harmonics (harsh, odd-harmonic emphasis)
fund = os.osc(pitch_sweep) * 0.25;
h2 = os.osc(pitch_sweep * 2.0) * 0.12;
h3 = os.osc(pitch_sweep * 3.0) * 0.15;  // Odd harmonic emphasis
h4 = os.osc(pitch_sweep * 4.0) * 0.06;
h5 = os.osc(pitch_sweep * 5.0) * 0.10;  // Odd harmonic emphasis

tonal = fund + h2 + h3 + h4 + h5;

// ============================================
// NOISE COMPONENT
// ============================================
// The kingfisher call is notably harsh and buzzy,
// with significant broadband noise centered on the
// fundamental frequency. This gives it the "dry" quality.

noise_band = no.noise : fi.resonbp(pitch_sweep, 5.0, 1.0) : *(0.8);
noise_high = no.noise : fi.resonbp(pitch_sweep * 2.5, 8.0, 1.0) : *(0.4);

// Mix harshness: more noise = harsher call
noise_component = (noise_band + noise_high) * harshness;
tonal_component = tonal * (1.0 - harshness * 0.3);

// ============================================
// CALL ENVELOPE
// ============================================
// Overall amplitude envelope for the rattle:
// - Quick attack (the bird starts abruptly)
// - Sustained through the rattle
// - Slight fade at the end

rattle_env = active_trigger : en.ar(0.002, 0.15);

// Individual pulse envelope within each "tch"
// Very fast attack, quick decay — percussive
pulse_env = pulse_shaped;

// ============================================
// SYRINX RESONANCE
// ============================================
// The kingfisher's syrinx (vocal organ) adds formant-like
// resonances that shape the spectral quality.
// Two resonant peaks typical of kingfisher family.

syrinx_input = (tonal_component + noise_component) * pulse_env;
formant1 = syrinx_input : fi.resonbp(2800, 6.0, 1.0) : *(0.5);
formant2 = syrinx_input : fi.resonbp(5500, 8.0, 1.0) : *(0.3);
formant3 = syrinx_input : fi.resonbp(8000, 10.0, 1.0) : *(0.15);

syrinx_out = syrinx_input * 0.4 + formant1 + formant2 + formant3;

// ============================================
// AMPLITUDE MODULATION — BREATH PATTERN
// ============================================
// Slight amplitude variation across the call duration:
// kingfishers often start loud and taper slightly

breath_mod = 1.0 - rattle_progress * 0.25;

// Second rattle is slightly quieter (echo effect)
rattle2_atten = ba.if(auto_mode > 0.5,
                      ba.if(auto_rattle2, 0.75, 1.0),
                      1.0);

// ============================================
// DOPPLER EFFECT (OPTIONAL)
// ============================================
// Kingfishers often call while flying — the pitch shifts
// slightly as they pass. Very subtle effect.

doppler = 1.0 + os.osc(0.4) * 0.008;

// ============================================
// Final mix
// ============================================
call_raw = syrinx_out * rattle_env * breath_mod * rattle2_atten * doppler;

// Gentle high-shelf boost for the "dry" quality
call_bright = call_raw + (call_raw : fi.resonhp(6000, 0.5, 1.0)) * 0.2;

// Soft clip to prevent harsh digital distortion
soft_clip(x) = x : min(0.95) : max(-0.95);

output = call_bright * volume : soft_clip;

process = output * 0.7 <: _, _;
