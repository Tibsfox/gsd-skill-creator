// Four Inches — Mercury-Redstone 1 Launch Failure Synthesizer
// FAUST DSP source — compiles to VST, AU, LV2, JACK, CLI
//
// Mission 1.16: Mercury-Redstone 1 (MR-1)
// The sound of four inches: ignition → brief rise → shutdown →
// escape tower BANG → parachute flutter → awkward silence
//
// November 21, 1960. The rocket rose four inches, settled back on
// the pad, the engine shut down, the escape tower fired and arced
// away, then the drogue and main parachutes deployed and draped
// over the rocket sitting on the pad. ~30 seconds of absurdity.
//
// Build:
//   faust2jaqt mr1-fourInches-synth.dsp    # JACK/Qt standalone
//   faust2lv2  mr1-fourInches-synth.dsp    # LV2 plugin
//   faust2vst  mr1-fourInches-synth.dsp    # VST plugin
//
// Parameters:
//   - Phase (0-1): manual control of the 30-second timeline
//   - Auto: toggle automatic phase progression
//   - Intensity: overall volume/intensity
//   - Absurdity: controls the comedic timing of parachute flutter
//
// Install FAUST: https://faust.grame.fr/downloads/

import("stdfaust.lib");

// --- Parameters ---
phase = hslider("[0]Phase", 0, 0, 1, 0.001) : si.smoo;
auto_mode = checkbox("[1]Auto (30s cycle)");
intensity = hslider("[2]Intensity", 0.7, 0, 1, 0.01) : si.smoo;
absurdity = hslider("[3]Absurdity", 0.7, 0.1, 1.0, 0.01) : si.smoo;

// Auto-advancing phase (30-second cycle)
auto_phase = os.phasor(1, 1.0/30.0);
active_phase = select2(auto_mode, phase, auto_phase);

// --- Timeline ---
// Phase 0.00 - 0.10: Engine ignition sequence (0-3s)
// Phase 0.10 - 0.15: Brief thrust / 4-inch rise (3-4.5s)
// Phase 0.15 - 0.20: Engine shutdown / settling (4.5-6s)
// Phase 0.20 - 0.23: Silence — confused pause (6-7s)
// Phase 0.23 - 0.35: Escape tower fires — BANG (7-10.5s)
// Phase 0.35 - 0.55: Tower rockets away (10.5-16.5s)
// Phase 0.55 - 0.60: Brief silence (16.5-18s)
// Phase 0.60 - 0.80: Parachutes deploy and flutter (18-24s)
// Phase 0.80 - 1.00: Awkward silence with wind (24-30s)

// --- Ignition Rumble ---
// Low-frequency combustion buildup, rising in intensity
ignition = no.pink_noise
         : fi.resonlp(300 + active_phase * 2000, 2.5, 1.0)
         : fi.resonhp(30, 1.5, 1.0)
         : *(ign_env)
with {
  ign_env = ba.if(active_phase < 0.05,
              active_phase / 0.05 * 0.3,    // Igniter spark buildup
            ba.if(active_phase < 0.10,
              0.3 + (active_phase - 0.05) / 0.05 * 0.7,  // Ramp to full
            ba.if(active_phase < 0.15,
              1.0,                           // Full thrust (brief!)
            ba.if(active_phase < 0.20,
              max(0.0, (0.20 - active_phase) / 0.05),  // Shutdown decay
              0.0))));
};

// --- Thrust Tone ---
// Slight upward pitch as rocket tries to rise (4 inches!)
thrust_tone = os.osc(fundamental) * 0.08 * thrust_env
            + os.osc(fundamental * 1.5) * 0.04 * thrust_env
with {
  // Pitch rises slightly during the 4-inch climb
  fundamental = ba.if(active_phase < 0.10, 50,
                ba.if(active_phase < 0.13,
                  50 + (active_phase - 0.10) / 0.03 * 15,  // Slight rise
                ba.if(active_phase < 0.15,
                  65 - (active_phase - 0.13) / 0.02 * 15,  // Settles back
                  50)));
  thrust_env = ba.if(active_phase > 0.10 & active_phase < 0.18,
                 1.0, 0.0);
};

// --- Engine Shutdown Click ---
// Sharp transient as valves slam shut
shutdown = no.noise * sd_env * 0.6
         : fi.resonlp(2000, 0.3, 1.0)
         : fi.resonhp(200, 1, 1.0)
with {
  sd_env = ba.if(active_phase > 0.15 & active_phase < 0.17,
             exp(-(active_phase - 0.15) * 200.0),
             0.0);
};

// --- Escape Tower Fire ---
// Massive impulse — solid rocket motor ignition, then receding
tower_bang = (no.noise * bang_env : fi.resonlp(3000, 0.5, 1.0)) * 0.9
           + (no.noise * bang_env * 0.4 : fi.resonbp(800, 2, 1.0))
           + os.sawtooth(120) * bang_env * 0.3  // Solid motor whine
with {
  bang_env = ba.if(active_phase > 0.23 & active_phase < 0.35,
               exp(-(active_phase - 0.23) * 15.0),
               0.0);
};

// --- Tower Rocket Motor ---
// Receding solid rocket — pitch drops as tower flies away (Doppler)
tower_motor = os.sawtooth(motor_freq) * motor_env * 0.15
            + no.noise * motor_env * 0.2
            : fi.resonlp(motor_freq * 3.0, 1.5, 1.0)
with {
  // Doppler: frequency drops as tower recedes
  motor_freq = ba.if(active_phase > 0.25 & active_phase < 0.50,
                 400 - (active_phase - 0.25) / 0.25 * 300,
                 100);
  motor_env = ba.if(active_phase > 0.25 & active_phase < 0.50,
                max(0.0, 1.0 - (active_phase - 0.25) / 0.25),
                0.0);
};

// --- Parachute Deploy ---
// Fabric popping sound, then flutter
chute_pop = no.noise * pop_env * 0.4
          : fi.resonbp(1500, 3, 1.0)
with {
  pop_env = ba.if(active_phase > 0.58 & active_phase < 0.62,
              ba.if(active_phase < 0.60,
                (active_phase - 0.58) / 0.02,
                max(0.0, (0.62 - active_phase) / 0.02)),
              0.0);
};

// --- Parachute Flutter ---
// Rhythmic flapping of fabric settling over the rocket
chute_flutter = no.pink_noise * flutter_env * 0.2
              : fi.resonbp(flutter_freq, 4, 1.0)
with {
  // Flutter rate: starts fast, slows as chutes settle
  flutter_rate = 8.0 - (active_phase - 0.62) * 12.0 * absurdity;
  flutter_freq = 600 + 400 * os.osc(max(1.0, flutter_rate));
  flutter_env = ba.if(active_phase > 0.62 & active_phase < 0.80,
                  0.8 - (active_phase - 0.62) / 0.18 * 0.6,
                  0.0);
};

// --- Awkward Wind ---
// Just wind. The rocket is sitting on the pad with parachutes draped over it.
wind = no.pink_noise * wind_env * 0.08
     : fi.resonlp(400, 2, 1.0)
with {
  wind_env = ba.if(active_phase > 0.70,
               min(1.0, (active_phase - 0.70) / 0.10),
               0.0);
};

// --- Distant Confused Voices ---
// Very subtle filtered noise suggesting people talking/not knowing what to do
murmur = no.pink_noise * murmur_env * 0.03
       : fi.resonbp(1200, 8, 1.0)
       : fi.resonlp(2000, 1, 1.0)
with {
  murmur_env = ba.if(active_phase > 0.80,
                 0.5 * (1.0 + 0.5 * os.osc(0.3)),
                 0.0);
};

// --- Mix ---
process = (ignition + thrust_tone + shutdown + tower_bang +
           tower_motor + chute_pop + chute_flutter + wind + murmur)
        * intensity
        : fi.dcblocker
        <: _,_;  // Stereo output
