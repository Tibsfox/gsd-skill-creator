// barn-swallow-twitter.dsp — Hirundo rustica Vocal Synthesis
// FAUST generative audio
// Liquid twittering song: rapid frequency sweeps at 3-6 kHz
// Nasal quality from closely-spaced formants
// Aerial pursuit rhythm: accelerating note bursts
// Mission 1.31 organism pairing — Barn Swallow

import("stdfaust.lib");

// Barn Swallow vocalization parameters
// Liquid twitter: rapid ascending/descending frequency sweeps
// Contact call: short nasal "vit" notes at ~4 kHz
// Alarm: sharp, high-pitched single notes

// LFO for note timing (irregular bursts)
note_rate = hslider("Note Rate", 8, 2, 20, 0.1);
note_trigger = ba.pulse(ma.SR / note_rate);

// Base frequency with rapid sweeps (liquid twitter character)
sweep_lfo = os.osc(note_rate * 1.3) * 800;
base_freq = 4200 + sweep_lfo + os.osc(0.5) * 300;

// Nasal formant structure (closely-spaced harmonics)
fund = os.osc(base_freq);
harm2 = os.osc(base_freq * 2.02) * 0.6;  // slightly detuned = nasal
harm3 = os.osc(base_freq * 3.01) * 0.3;
raw_voice = (fund + harm2 + harm3) / 3;

// Nasal bandpass (3-5 kHz emphasis)
nasal_voice = raw_voice : fi.bandpass(3, 3000, 5500);

// Amplitude envelope (short notes, rapid succession)
note_env = en.asr(0.008, 0.04, 0.02, note_trigger);

// Add chirp character (frequency rises within each note)
chirp_mod = en.ar(0.001, 0.05, note_trigger) * 600;
chirp_voice = os.osc(base_freq + chirp_mod) * 0.3;

// Background: wing flutter (very soft broadband noise bursts)
wing_flutter = no.noise * 0.02 : fi.bandpass(2, 200, 800)
    : *(en.ar(0.001, 0.05, ba.pulse(ma.SR / 3)));

// Master output
swallow_song = (nasal_voice + chirp_voice) * note_env * 0.25 + wing_flutter;

process = swallow_song <: (_, _);
