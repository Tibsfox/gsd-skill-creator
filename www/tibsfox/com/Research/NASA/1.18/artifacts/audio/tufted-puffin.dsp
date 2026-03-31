// Tufted Puffin Call — Fratercula cirrhata
// FAUST DSP source — generative seabird vocalization
//
// Mission 1.18 Bird: Tufted Puffin (degree 18 in 360 series)
// A low, growling "arrr" sound made from deep within a nesting
// burrow. 500-1500 Hz fundamental range. Muffled by earth and
// rock, resonant, guttural. Tufted Puffins nest in burrows
// dug into cliffs — the calls carry through soil and rock,
// giving them a characteristic muffled, rumbling quality.
//
// Unlike colonial surface-nesters, puffin vocalizations are
// designed to travel through solid earth to reach a mate
// sitting on eggs 1-2 meters inside the burrow. The sound
// is low, rough, and sustained — a vibrating growl.
//
// Ambient: ocean waves breaking on rocky cliffs, wind
// across burrow entrance (produces a soft whistle/moan).
//
// Build:
//   faust2jaqt tufted-puffin.dsp      # JACK/Qt standalone
//   faust2lv2  tufted-puffin.dsp      # LV2 plugin
//
// This is a generative synthesizer — produces continuous calls
// with burrow resonance and ocean ambient.

import("stdfaust.lib");

// --- Parameters ---
call_rate = hslider("[0]Call Rate (per min)", 4, 1, 15, 0.1) : si.smoo;
burrow_depth = hslider("[1]Burrow Depth", 0.7, 0, 1, 0.01) : si.smoo;
ocean_mix = hslider("[2]Ocean Waves", 0.4, 0, 1, 0.01) : si.smoo;
wind_mix = hslider("[3]Cliff Wind", 0.3, 0, 1, 0.01) : si.smoo;

// --- Primary Bird Call ---
// Low growling "arrr" — 0.8 to 1.5 seconds duration
call_period = 60.0 / max(1.0, call_rate);
call_phase = os.phasor(1, 1.0 / call_period);

// Call envelope: slow onset growl, sustained rumble, gradual fade
call_dur = 0.45;  // Fraction of period occupied by call
call_env = ba.if(call_phase < call_dur,
             ba.if(call_phase < 0.06,
               call_phase / 0.06,                    // Slow growl onset: ~100ms
             ba.if(call_phase < call_dur - 0.08,
               0.9 - 0.1 * os.osc(8.0),              // Sustained with tremolo
               max(0.0, (call_dur - call_phase) / 0.08))),  // Gradual release
             0.0)
         : si.smoo;

// --- Fundamental Pitch ---
// Puffin growl: 500-900 Hz fundamental, low and rough
// Slight upward inflection then drift down
pitch_env = ba.if(call_phase < call_dur,
              ba.if(call_phase < 0.1,
                600 + call_phase / 0.1 * 200,    // Rise to 800 Hz
                800 - (call_phase - 0.1) / (call_dur - 0.1) * 300),  // Drift to 500 Hz
              650)
          : si.smoo;

// Vibrato: slower than murre — deep chest vibration
vibrato_depth = 25 + 20 * burrow_depth;
vibrato = os.osc(15) * vibrato_depth;  // ~15 Hz — deeper, slower growl

fundamental = pitch_env + vibrato;

// --- Harmonic Structure ---
// Puffin growls are harmonically rich but muffled by the burrow
// Strong low harmonics, upper harmonics filtered by earth
h1 = os.osc(fundamental) * 0.30;
h2 = os.osc(fundamental * 2.0) * 0.25;
h3 = os.osc(fundamental * 3.0) * 0.20;
h4 = os.osc(fundamental * 4.03) * 0.10;  // Slight detuning
h5 = os.osc(fundamental * 5.01) * 0.05;

harmonics = h1 + h2 + h3 + h4 + h5;

// --- Growl Generator ---
// The "arrr" quality: amplitude-modulated noise at low frequency
growl_noise = no.noise
            : fi.resonbp(fundamental * 1.5, 3, 1.0)
            : *(0.4);

// Amplitude modulation: slow AM for deep growl
growl_am = 1.0 + no.noise * 0.35
         : fi.resonlp(120, 1.5, 1.0);

// --- Burrow Resonance ---
// Sound passing through 1-2 meters of soil/rock:
// - Low-pass filter (earth absorbs high frequencies)
// - Resonant peak from burrow cavity (~300-600 Hz)
// - Muffled, enclosed quality
burrow_lp_freq = 1200 - burrow_depth * 700;  // Deeper burrow = more filtering
burrow_resonance = fi.resonlp(burrow_lp_freq, 2.5 + burrow_depth * 2.0, 1.0);
burrow_cavity = fi.resonbp(400 + burrow_depth * 150, 4, 1.0);

// --- Primary Bird Signal ---
primary_signal = harmonics * growl_am + growl_noise;
primary_filtered = primary_signal : burrow_resonance : *(0.7)
                 + primary_signal : burrow_cavity : *(0.3);
primary_call = primary_filtered * call_env * 0.5;

// --- Second Bird (mate in adjacent burrow) ---
bird2_phase = os.phasor(1, 1.0 / (call_period * 1.37));
bird2_env = ba.if(bird2_phase < 0.40,
              ba.if(bird2_phase < 0.07, bird2_phase / 0.07,
              ba.if(bird2_phase < 0.33, 0.85 - 0.08 * os.osc(12.0),
                max(0.0, (0.40 - bird2_phase) / 0.07))),
              0.0) : si.smoo;
bird2_f = 720 + os.osc(13) * 20;
bird2 = (os.osc(bird2_f) * 0.25 + os.osc(bird2_f * 2.0) * 0.18
       + no.noise * 0.12 : fi.resonbp(bird2_f * 1.5, 3, 1.0))
       * bird2_env * 0.25
       : fi.resonlp(900, 3, 1.0);  // Extra muffling — farther away

// --- Third Bird (distant, at burrow entrance) ---
bird3_phase = os.phasor(1, 1.0 / (call_period * 0.79));
bird3_env = ba.if(bird3_phase < 0.50,
              ba.if(bird3_phase < 0.05, bird3_phase / 0.05,
              ba.if(bird3_phase < 0.42, 0.7,
                max(0.0, (0.50 - bird3_phase) / 0.08))),
              0.0) : si.smoo;
bird3_f = 850 + os.osc(17) * 30;
bird3 = (os.osc(bird3_f) * 0.20 + os.osc(bird3_f * 3.0) * 0.12
       + no.noise * 0.10 : fi.resonbp(bird3_f, 4, 1.0))
       * bird3_env * 0.18
       : fi.resonlp(1400, 2, 1.0);  // Less muffled — at entrance

// --- Ocean Waves ---
// Waves breaking on rocky cliffs below the burrow colony
// Slow, deep, rhythmic
wave_cycle = 0.12 + 0.04 * os.osc(0.03);  // ~8 second wave period
waves = no.pink_noise * ocean_mix * 0.10
      : fi.resonlp(200, 3, 1.0)
      : *(0.4 + 0.6 * max(0.0, os.osc(wave_cycle)));

// Wave crash (periodic surge)
wave_crash = no.noise * ocean_mix * 0.05
           : fi.resonbp(350, 2, 1.0)
           : *(max(0.0, os.osc(wave_cycle) - 0.5) * 2.0);

// --- Cliff Wind ---
// Wind across burrow entrance creates a soft moan
// The burrow mouth acts as a Helmholtz resonator
burrow_wind = no.pink_noise * wind_mix * 0.08
            : fi.resonbp(280 + 60 * os.osc(0.15), 5, 1.0)
            : *(0.6 + 0.4 * os.osc(0.09));

// Open cliff wind
cliff_wind = no.pink_noise * wind_mix * 0.06
           : fi.resonlp(500, 2, 1.0)
           : *(1.0 + 0.2 * os.osc(0.11) + 0.1 * os.osc(0.27));

// --- Output ---
process = (primary_call + bird2 + bird3
         + waves + wave_crash + burrow_wind + cliff_wind) * 0.85
        : fi.dcblocker
        <: _,_;  // Stereo
