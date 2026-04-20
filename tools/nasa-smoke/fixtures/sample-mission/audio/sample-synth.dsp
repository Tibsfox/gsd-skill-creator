// sample-synth.dsp -- Smoke-test Faust patch.
// A single tunable sine oscillator at A4 with volume + mute controls.
// Intentionally tiny so the Playwright smoke test compiles + runs fast.

import("stdfaust.lib");

freq = hslider("freq", 440.0, 55.0, 1760.0, 0.1);
vol  = hslider("vol",   0.5,   0.0,    1.0, 0.01);
mute = checkbox("mute");

process = os.osc(freq) * vol * (1.0 - mute);
