import("stdfaust.lib");
freq = hslider("freq", 440, 100, 1000, 1);
gain = hslider("gain", 0.5, 0, 1, 0.01);
process = os.osc(freq) * gain;
