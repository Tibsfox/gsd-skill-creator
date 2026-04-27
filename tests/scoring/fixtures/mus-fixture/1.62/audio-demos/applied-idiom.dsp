import("stdfaust.lib");
process = no.noise * 0.1 : fi.lowpass(2, 800);
