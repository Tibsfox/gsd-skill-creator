// Crystal Jellyfish -- Aequorea victoria
// FAUST DSP source -- bioluminescence sonification
//
// Mission 1.22 Creature: Crystal Jellyfish (degree 22 in 360 series)
// The organism that gave us GFP -- Green Fluorescent Protein --
// one of the most important tools in modern biology.
//
// Aequorea victoria is a hydromedusa found in the cold waters
// of the Pacific Northwest, from the Puget Sound to the Gulf
// of Alaska. Nearly transparent, it drifts through the water
// column like a glass bell, pulsing gently. It ranges from
// 3-10 cm in diameter, with up to 150 tentacles trailing
// behind like fiber optic cables.
//
// The bioluminescence cascade:
//
// 1. MECHANICAL TRIGGER: The jellyfish is disturbed -- a touch,
//    a current, a predator. Calcium ions flood into the
//    photocytes (light-producing cells) along the bell margin.
//
// 2. AEQUORIN ACTIVATION: The calcium binds to aequorin, a
//    photoprotein. Aequorin undergoes a conformational change
//    and emits BLUE light (469 nm). This is the primary
//    bioluminescent event.
//
// 3. ENERGY TRANSFER: The blue light from aequorin is absorbed
//    by Green Fluorescent Protein (GFP) molecules positioned
//    adjacent to the aequorin. Through Forster Resonance Energy
//    Transfer (FRET), the energy shifts wavelength.
//
// 4. GREEN EMISSION: GFP re-emits the energy as GREEN light
//    (509 nm). This is the signature glow -- the green ring
//    around the bell margin that Osamu Shimomura first isolated
//    in 1962 (the same year as Aurora 7!).
//
// The sonic mapping:
//   - Bell pulsation: slow LFO (0.5-2 Hz) modulating amplitude
//   - Calcium trigger: sharp transient (calcium rush)
//   - Blue emission: high-frequency tone (aequorin flash)
//   - Blue-to-green shift: filter sweep from high to mid
//   - GFP fluorescence: sustained pure tone at "green" frequency
//   - Tentacle motion: random modulation of secondary oscillators
//   - Ocean ambience: filtered pink noise as water background
//
// Build:
//   faust2jaqt crystal-jellyfish.dsp    # JACK/Qt standalone
//   faust2lv2  crystal-jellyfish.dsp    # LV2 plugin

declare name      "Crystal Jellyfish -- Bioluminescence";
declare author    "Tibsfox NASA Mission Series";
declare copyright "(c) 2026 Tibsfox";
declare version   "1.22";
declare license   "MIT";

import("stdfaust.lib");

// --- Parameters ---
pulse_rate = hslider("[0]Bell Pulse Rate (Hz)", 1.0, 0.3, 3.0, 0.05) : si.smoo;
calcium_trigger = button("[1]Calcium Trigger");
gfp_sustain = hslider("[2]GFP Sustain", 0.6, 0, 1, 0.01) : si.smoo;
tentacle_density = hslider("[3]Tentacle Density", 0.5, 0, 1, 0.01) : si.smoo;
ocean_depth = hslider("[4]Ocean Depth", 0.4, 0, 1, 0.01) : si.smoo;
reverb_amount = hslider("[5]Water Reverb", 0.5, 0, 1, 0.01) : si.smoo;

// Auto-trigger mode: periodic calcium events (~every 6-12 seconds)
auto_trigger_rate = 0.12;  // ~8 seconds between triggers
auto_trigger_phase = os.phasor(1, auto_trigger_rate);
auto_trigger = ba.if(auto_trigger_phase < 0.04, 1.0, 0.0);
trigger = max(calcium_trigger, auto_trigger);

// Mod helper
mod(x, m) = x - floor(x / m) * m;


// ==========================================================
// BELL PULSATION
// ==========================================================
//
// The jellyfish bell contracts rhythmically for locomotion.
// This is the fundamental rhythm of the organism -- a slow,
// graceful squeeze-and-release that propels it through the
// water column. The pulsation modulates the amplitude of
// everything: when the bell contracts, sound intensifies;
// when it relaxes, sound softens.
//
// The waveform is not a simple sine -- it has a faster
// contraction phase and a slower relaxation phase, like
// breathing out quickly and breathing in slowly.

bell_lfo_raw = os.phasor(1, pulse_rate);

// Asymmetric pulse: fast contraction (30%), slow relaxation (70%)
bell_pulse = ba.if(bell_lfo_raw < 0.30,
               // Contraction: fast rise to peak
               0.4 + 0.6 * sin(bell_lfo_raw / 0.30 * ma.PI * 0.5),
             // Relaxation: slow return to resting
               0.4 + 0.6 * cos((bell_lfo_raw - 0.30) / 0.70 * ma.PI * 0.5));

// Bell contraction sound: a soft, low "whoomph" on each pulse
// Like the sound of water being displaced by the bell
bell_sound = (os.osc(bell_freq) * 0.020
            + os.osc(bell_freq * 1.5) * 0.008
            + no.pink_noise * 0.006 : fi.resonlp(200, 2, 1.0))
           * bell_contraction_env
with {
  bell_freq = 55 + 15 * os.osc(0.03);
  // Envelope peaks during contraction
  bell_contraction_env = ba.if(bell_lfo_raw < 0.15,
                           bell_lfo_raw / 0.15,
                         ba.if(bell_lfo_raw < 0.30,
                           1.0 - (bell_lfo_raw - 0.15) / 0.15,
                           0.0))
                       * 0.6;
};


// ==========================================================
// CALCIUM TRIGGER -- THE LUMINESCENT EVENT
// ==========================================================
//
// When calcium floods into the photocytes, aequorin activates.
// This is a sharp, sudden event -- electrochemical, fast.
// Sonically: a bright transient with high-frequency content,
// like a tiny glass bell being struck inside the organism.

// Trigger envelope: sharp attack (~5ms), fast decay (~200ms)
// Using the trigger signal to drive a one-shot envelope
trigger_env = trigger : si.smooth(ba.tau2pole(0.001))
            : *(trigger : si.smooth(ba.tau2pole(0.15)));

// The calcium rush: a sharp, crystalline transient
calcium_sound = (os.osc(ca_f1) * 0.05
              + os.osc(ca_f2) * 0.03
              + os.osc(ca_f3) * 0.02
              + no.noise * 0.03 : fi.resonbp(6000, 5, 1.0))
             * trigger_env
with {
  // High frequencies -- calcium is a fast electrochemical event
  ca_f1 = 4800 + 200 * os.osc(0.7);
  ca_f2 = 6200 + 150 * os.osc(1.1);
  ca_f3 = 7800 + 100 * os.osc(0.9);
};


// ==========================================================
// BLUE-TO-GREEN SPECTRAL SHIFT
// ==========================================================
//
// The core of the bioluminescence cascade:
// Aequorin emits at 469 nm (blue) -> energy transfers to GFP ->
// GFP re-emits at 509 nm (green).
//
// Sonic mapping: "blue" = high frequency, "green" = mid frequency.
// A filter sweep from high to mid represents the FRET energy
// transfer. The sweep takes about 1-2 seconds after the calcium
// trigger -- biologically this is nanoseconds, but we stretch
// it for audibility.

// Slower envelope for the spectral shift (longer than the trigger)
shift_env = trigger : si.smooth(ba.tau2pole(0.002))
          : *(1.0) : si.smooth(ba.tau2pole(0.8));

// Blue emission: high-frequency tone representing aequorin's 469nm
blue_emission = (os.osc(blue_freq) * 0.035
              + os.osc(blue_freq * 2.003) * 0.015
              + os.osc(blue_freq * 3.01) * 0.008)
             * blue_env
             : fi.resonbp(blue_freq, 3, 1.0)
with {
  // "Blue" frequency: high, cold, electric
  blue_freq = 5200 + 300 * shift_env;  // Starts very high
  // Blue fades as energy transfers to GFP
  blue_env = shift_env * (1.0 - gfp_sustain * 0.7);
};

// Spectral sweep filter: the FRET energy transfer
// Cutoff sweeps from "blue" (8000 Hz) down to "green" (2000 Hz)
fret_cutoff = 2000 + shift_env * 6000;

// Green emission: sustained pure tone representing GFP's 509nm
// This is the signature sound -- a warm, steady, "living" green
green_emission = (os.osc(green_freq) * 0.040
               + os.osc(green_freq * 2.0) * 0.012
               + os.osc(green_freq * 3.0) * 0.005)
              * green_env
              : fi.resonlp(green_freq * 3.0, 2, 1.0)
with {
  // "Green" frequency: warm, mid-range, alive
  green_freq = 880 + 60 * os.osc(0.07);
  // Green builds as blue fades -- the GFP takes over
  green_env_raw = ba.if(shift_env > 0.01,
                    max(0.0, 1.0 - shift_env) * gfp_sustain,
                    0.0);
  green_env = green_env_raw : si.smooth(ba.tau2pole(0.3));
};

// Combined bioluminescence through FRET filter
bioluminescence = (blue_emission + calcium_sound)
                : fi.resonlp(fret_cutoff, 1.5, 1.0);


// ==========================================================
// TENTACLE MOTION
// ==========================================================
//
// Up to 150 tentacles trail behind the bell, each moving
// semi-independently in the current. They create a subtle,
// random, shimmering sound field -- like wind chimes made
// of glass in slow motion underwater.
//
// Multiple oscillators at slightly different frequencies,
// each with independent random amplitude modulation.

tentacle_sound = (t1 + t2 + t3 + t4 + t5 + t6) * tentacle_density
with {
  // Each tentacle: a thin, high sine with random AM
  // Frequencies chosen to be inharmonic -- organic, not musical
  t1 = os.osc(1340 + 40 * os.osc(0.13)) * 0.008
     * max(0.0, os.osc(0.17) * 0.6 + 0.3);
  t2 = os.osc(1780 + 55 * os.osc(0.09)) * 0.006
     * max(0.0, os.osc(0.23) * 0.5 + 0.2);
  t3 = os.osc(2210 + 35 * os.osc(0.19)) * 0.005
     * max(0.0, os.osc(0.31) * 0.7 + 0.1);
  t4 = os.osc(980 + 25 * os.osc(0.11)) * 0.007
     * max(0.0, os.osc(0.29) * 0.4 + 0.3);
  t5 = os.osc(2650 + 45 * os.osc(0.07)) * 0.004
     * max(0.0, os.osc(0.37) * 0.5 + 0.2);
  t6 = os.osc(3100 + 60 * os.osc(0.15)) * 0.003
     * max(0.0, os.osc(0.41) * 0.3 + 0.1);
};


// ==========================================================
// OCEAN AMBIENCE
// ==========================================================
//
// The crystal jellyfish inhabits the upper water column of
// the northeastern Pacific -- typically 0-50 meters depth.
// The ocean at this depth is not silent: there is the constant
// rustle of plankton, the low rumble of distant surf, the
// occasional click of a shrimp, the broad-spectrum noise of
// current flowing past the hydrophone.
//
// Pink noise filtered to suggest depth. The ocean_depth
// parameter controls the low-pass cutoff -- deeper water
// absorbs more high frequencies.

ocean_bg = (no.pink_noise * ocean_depth * 0.040
          : fi.resonlp(ocean_cutoff, 1.5, 1.0))
         + (no.noise * ocean_depth * 0.010
          : fi.resonbp(ocean_mid, 3, 1.0)
          : *(0.5 + 0.5 * os.osc(0.05)))
         + (no.pink_noise * ocean_depth * 0.015
          : fi.resonlp(80, 3, 1.0))
with {
  // Deeper water = lower cutoff frequency
  ocean_cutoff = 400 + (1.0 - ocean_depth) * 1200;
  // Mid-frequency detail: plankton, micro-currents
  ocean_mid = 800 + 200 * os.osc(0.04);
};

// Occasional biological transient -- a distant click or pop
// from the marine soundscape (snapping shrimp, etc.)
bio_click = no.noise * click_env * 0.06
          : fi.resonbp(3500, 6, 1.0)
with {
  click_rate = 0.18;
  click_phase = os.phasor(1, click_rate);
  click_env = ba.if(click_phase < 0.02,
                exp(-click_phase * 200.0),
                0.0)
            * ocean_depth;
};

// Slow current swell -- very low frequency, felt more than heard
current_swell = no.pink_noise * ocean_depth * 0.012
              : fi.resonlp(50, 4, 1.0)
              : *(0.3 + 0.7 * os.osc(0.02));


// ==========================================================
// UNDERWATER REVERB
// ==========================================================
//
// Water is a different reverberant medium than air. Sound
// travels ~4.5x faster in water, and the reverb character is
// dense, diffuse, with less high-frequency absorption than
// in a room but more modal coloration from the water column.

reverb_input = (bioluminescence + green_emission
              + tentacle_sound + bell_sound) * reverb_amount;

// Comb filter delays (longer than air reverb -- sound travels
// farther underwater before reflecting)
d1 = 1889;   // ~43ms
d2 = 2927;   // ~66ms
d3 = 4217;   // ~96ms
d4 = 5839;   // ~132ms

fb = 0.78;  // RT60 ~ 2 seconds (water absorbs energy faster)

comb1 = +~(@(d1-1) * fb) * 0.25;
comb2 = +~(@(d2-1) * fb) * 0.25;
comb3 = +~(@(d3-1) * fb) * 0.25;
comb4 = +~(@(d4-1) * fb) * 0.25;

// Allpass for diffusion
ap1 = fi.allpass_comb(2048, 631, 0.45);
ap2 = fi.allpass_comb(2048, 947, 0.45);

// Water absorbs high frequencies -- but less than air
water_lpf = fi.resonlp(4000 - reverb_amount * 1500, 1, 1.0);

reverb_wet = reverb_input
           <: comb1, comb2, comb3, comb4
           :> _
           : ap1 : ap2
           : water_lpf
           : fi.dcblocker;


// ==========================================================
// STEREO OUTPUT
// ==========================================================
//
// Spatial spread: the jellyfish is a three-dimensional object
// drifting in a three-dimensional medium. Tentacles trail in
// all directions. Slight L/R offset plus frequency-dependent
// panning creates a sense of the organism's spatial extent.

// Dry signal with bell pulsation modulation
dry_mix = (bioluminescence + green_emission) * bell_pulse
        + tentacle_sound * bell_pulse * 0.7
        + bell_sound
        + ocean_bg + bio_click + current_swell;

// Wet signal (reverb)
wet_mix = reverb_wet;

// Combined
mono_out = dry_mix * (1.0 - reverb_amount * 0.4) + wet_mix;

// Spatial delay (1.5ms -- wider than air because sound
// travels faster in water, so spatial cues are compressed)
spatial_delay = 66;  // ~1.5ms at 44100 Hz

left_out = mono_out : fi.dcblocker;
right_out = mono_out : @(spatial_delay) : fi.dcblocker;

process = left_out, right_out;
