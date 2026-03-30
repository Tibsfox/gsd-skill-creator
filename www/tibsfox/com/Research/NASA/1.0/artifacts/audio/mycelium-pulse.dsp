// Mycelium Pulse — Armillaria Underground Ambient
// FAUST DSP source — the sound of nutrient flow through a 2,385-acre network
//
// Mission 1.0 Organism: Armillaria ostoyae
// What would the hidden network sound like if you could hear it?
//
// Build:
//   faust2jaqt mycelium-pulse.dsp    # Standalone
//   faust2lv2  mycelium-pulse.dsp    # LV2 plugin

import("stdfaust.lib");

// Parameters
growth_rate = hslider("[0]Growth Rate", 0.5, 0, 1, 0.01) : si.smoo;
network_density = hslider("[1]Network Density", 0.6, 0, 1, 0.01) : si.smoo;
pulse_speed = hslider("[2]Nutrient Pulse Speed", 0.3, 0.05, 2.0, 0.01) : si.smoo;

// --- Earth Drone ---
// Deep, continuous sub-bass representing the soil medium
earth = os.osc(30 + growth_rate * 10) * 0.06
      + os.osc(45) * 0.03
      + no.pink_noise : fi.resonlp(60, 3, 1.0) : *(0.04);

// --- Rhizomorph Whispers ---
// Thin, breathy sounds of hyphal tips extending through soil
whispers = par(i, 6, single_whisper(i)) :> /(6.0)
with {
  single_whisper(i) = no.noise
    : fi.resonbp(freq, 20, 1.0)
    : *(envelope)
    : *(0.03 * network_density)
  with {
    freq = 800 + i * 200 + os.osc(0.1 + i * 0.03) * 100;
    envelope = 0.3 + 0.7 * max(0, os.osc(0.08 + i * 0.02 + growth_rate * 0.05));
  };
};

// --- Nutrient Pulse ---
// Periodic wave traveling through the network — a heartbeat without a heart
pulse = os.osc(pulse_freq) * pulse_env * 0.08
      + os.osc(pulse_freq * 1.5) * pulse_env * 0.04
with {
  pulse_freq = 100 + network_density * 80;
  // Pulse envelope: slow rise, quick fall, repeating
  pulse_phase = os.phasor(1, pulse_speed * 0.15);
  pulse_env = pow(max(0, 1.0 - pulse_phase * 3.0), 2.0);
};

// --- Colonization Events ---
// Occasional deeper tones when a new tree is reached
colonize = no.noise
         : *(no.noise > 0.9985)
         : fi.resonbp(150 + growth_rate * 100, 8, 1.0)
         : *(0.15 * growth_rate)
         : fi.resonlp(400, 2, 1.0);

// --- Decomposition Crackle ---
// The quiet sound of wood being broken down by enzymes
decomp = no.noise
       : *(no.noise > 0.992)
       : fi.resonhp(3000, 1, 1.0)
       : fi.resonlp(8000, 2, 1.0)
       : *(0.02 * network_density);

// --- Mix ---
process = (earth + whispers + pulse + colonize + decomp)
        : fi.dcblocker
        <: de.delay(44100, 0),
           de.delay(44100, 441);  // ~10ms stereo spread
