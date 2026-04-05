// Bohemian Waxwing Flock — Generative Audio
// FAUST DSP plugin: VST/LV2/standalone
//
// Mission 1.33 — Ranger 6 / Degree 32
// Bombycilla garrulus — the irruptive winter visitor
//
// The Bohemian Waxwing's call is a thin, high-pitched trill:
//   - Frequency: 5,000-8,000 Hz (higher than Cedar Waxwing)
//   - Character: buzzy, sibilant, slightly descending
//   - Duration: 0.3-0.8 seconds per call
//   - Social: constant chatter in feeding flocks, overlapping calls
//
// This plugin generates a flock of 8-12 virtual waxwings:
//   - Each bird has a slightly different base frequency (5-8 kHz)
//   - Calls are triggered stochastically (Poisson-like intervals)
//   - Stereo pan varies per bird (flock spread across soundfield)
//   - Subtle Doppler shift as birds move through the stereo field
//   - Background: wind through mountain ash branches, berry-stripping sounds
//
// Duration: Continuous generative
// Output: Stereo

import("stdfaust.lib");

// Single waxwing call: FM-synthesized trill
waxwing_call(freq, rate, depth) =
    os.osc(freq + depth * os.osc(rate)) * 0.15
    : fi.bandpass(4, freq * 0.8, freq * 1.2);

// Stochastic trigger: random intervals between calls
trigger(seed) = no.noise : abs : > (0.998 + seed * 0.001);

// Individual bird with random parameters
bird(n) = waxwing_call(freq, trill_rate, trill_depth) * env
with {
    freq = 5500 + n * 280;          // 5500-8300 Hz spread
    trill_rate = 25 + n * 3;         // 25-58 Hz trill rate
    trill_depth = 200 + n * 50;      // FM depth
    env = en.asr(0.02, 0.4, 0.1, trigger(n * 0.1));  // attack/sustain/release
};

// Background wind
wind = no.noise * 0.03 : fi.bandpass(2, 200, 2000);

// Flock of 8 birds, panned across stereo field
pan(n, sig) = sig * (0.5 + 0.4 * os.osc(0.1 + n * 0.02)),
              sig * (0.5 - 0.4 * os.osc(0.1 + n * 0.02));

flock = par(n, 8, bird(n)) :> (_, _);

process = flock : (+ (wind), + (wind)) : (fi.dcblocker, fi.dcblocker);
