// Explorer 5 — Launch Failure: The Sound of Almost
// FAUST DSP source — compiles to VST, AU, LV2, JACK, CLI
//
// Mission 1.11: Explorer 5 (Juno I / ABMA)
// FAILED LAUNCH — August 24, 1958
//
// Explorer 5 was intended to carry improved Van Allen belt instruments.
// During separation of the upper cluster from the Juno I booster,
// the spinning tub contacted the booster body. The impulse induced
// nutation — a wobbling, tumbling motion — that prevented the upper
// stages from achieving the correct trajectory. No orbit was achieved.
// The payload fell back to Earth.
//
// This is the sound of a launch that almost worked. ~75 seconds.
//
// Timeline (mission phase → synth time):
//   0-5s:      Pre-launch — Cape Canaveral, humid August night,
//              the hum of ground equipment, countdown cadence
//   5-8s:      Ignition — Rocketdyne A-7 engine lights, 83,000 lbf thrust
//              Roar builds from rumble to scream
//   8-25s:     Powered ascent — pitch rising steadily, the rocket climbing,
//              vibration and acceleration, everything nominal
//   25-30s:    Burnout approach — first stage fuel depleting, thrust tapering,
//              engine pitch dropping slightly
//   30-33s:    SEPARATION EVENT — the critical moment
//              Spring pushes spinning tub away from booster
//              CONTACT — edge of tub strikes booster body
//              Sharp metallic impact, like a bell struck wrong
//   33-45s:    Nutation — the tub is tumbling now, not spinning cleanly
//              Wobbling frequencies, beat patterns, the gyroscope broken
//              Upper stages fire but thrust vector is wrong
//   45-55s:    Trajectory divergence — pitch dropping, the arc bending
//              down instead of up, Doppler shift as payload slows
//              Telemetry warbling, signal fading in and out
//   55-65s:    Signal loss — atmospheric reentry heating disrupts the
//              signal, static increasing, carrier breaking up
//   65-72s:    Silence — the signal is gone, only noise remains
//   72-75s:    Aftersilence — a faint echo, the ghost of what
//              would have been, fading to nothing
//
// Organism resonance: Amanita muscaria (fly agaric mushroom)
//   The universal veil tears as the mushroom emerges — the membrane
//   that protected the developing fruiting body breaks apart, leaving
//   white patches on the red cap. The separation event is the same:
//   a protective enclosure breaking, the payload emerging, and
//   something going wrong at the moment of breaking free.
//
// Dedication: Jorge Luis Borges (1899-1986)
//   "The Garden of Forking Paths" — every launch has two futures:
//   orbit and failure. Both exist until the moment of separation.
//   Explorer 5 took the path that ends.
//
// Build:
//   faust2jaqt explorer5-failure-synth.dsp    # JACK/Qt standalone
//   faust2lv2  explorer5-failure-synth.dsp    # LV2 plugin
//   faust2vst  explorer5-failure-synth.dsp    # VST plugin (needs VST SDK)
//
// Install FAUST: https://faust.grame.fr/downloads/

import("stdfaust.lib");

// --- Parameters ---
phase = hslider("[0]Phase", 0, 0, 1, 0.001) : si.smoo;
auto_mode = checkbox("[1]Auto (75s cycle)");
intensity = hslider("[2]Intensity", 0.7, 0, 1, 0.01) : si.smoo;
failure_character = hslider("[3]Failure Character", 0.6, 0, 1, 0.01) : si.smoo;

// Auto-advancing phase (75-second cycle)
auto_phase = os.phasor(1, 1.0/75.0);
active_phase = select2(auto_mode, phase, auto_phase);

// --- Time mapping (phase 0-1 → 0-75 seconds) ---
time_sec = active_phase * 75.0;

// ============================================
// PRE-LAUNCH (0-5s)
// ============================================
// Cape Canaveral, August night. Ground equipment hum.
// Countdown cadence — rhythmic, expectant.
prelaunch_env = ba.if(time_sec < 5.0,
                  ba.if(time_sec < 0.5, time_sec * 2.0, 1.0) *
                  ba.if(time_sec > 4.0, 1.0 + (time_sec - 4.0) * 0.5, 1.0),
                  0.0);

// Ground equipment hum (60 Hz power + harmonics)
ground_hum = os.osc(60) * 0.03 + os.osc(120) * 0.02 + os.osc(180) * 0.01;
// Wind on the gantry
gantry_wind = no.noise : fi.resonlp(400, 0.3, 1.0) : *(0.008);
// Countdown pulse — heartbeat rhythm
countdown_rate = 1.0 + (time_sec / 5.0) * 0.5;
countdown_pulse = os.osc(countdown_rate) : max(0.0) : *(os.osc(800) * 0.02);

prelaunch = (ground_hum + gantry_wind + countdown_pulse) * prelaunch_env * 0.4;

// ============================================
// IGNITION (5-8s)
// ============================================
// Rocketdyne A-7 engine ignites. 83,000 lbf thrust.
// Rumble builds to a roar.
ignition_env = ba.if(time_sec >= 5.0 & time_sec < 8.0,
                 ba.if(time_sec < 5.5, (time_sec - 5.0) * 2.0, 1.0),
                 0.0);

// Engine ignition — broadband roar building
ign_roar = no.noise : fi.resonlp(200 + (time_sec - 5.0) * 100, 0.8, 1.0) : *(0.35);
// Low-frequency rumble — the ground shaking
ign_rumble = os.osc(20) * 0.15 + os.osc(35) * 0.10 + os.osc(55) * 0.08;
// Crackling — combustion instability
ign_crackle = no.noise : fi.resonbp(3000, 2, 1.0) : *(0.05);

ignition = (ign_roar + ign_rumble + ign_crackle) * ignition_env * 0.5;

// ============================================
// POWERED ASCENT (8-25s)
// ============================================
// Nominal flight. Pitch rises as the rocket accelerates.
// Everything sounds right. This is hope.
ascent_env = ba.if(time_sec >= 8.0 & time_sec < 25.0,
               ba.if(time_sec < 9.0, (time_sec - 8.0), 1.0) *
               ba.if(time_sec > 23.0, (25.0 - time_sec) / 2.0, 1.0),
               0.0);

// Rising engine pitch — Doppler + thrust increase
ascent_freq = 80 + (time_sec - 8.0) * 15;
asc_tone = os.osc(ascent_freq) * 0.06 + os.osc(ascent_freq * 1.5) * 0.04;
// Steady roar — narrowing bandwidth as atmosphere thins
asc_roar = no.noise : fi.resonlp(800 - (time_sec - 8.0) * 20, 0.6, 1.0) : *(0.15);
// Acceleration vibration — increasing frequency
asc_vib = os.osc(ascent_freq * 0.1) * 0.03;
// Telemetry carrier — steady, healthy
asc_telem = os.osc(2400) * 0.015;

ascent = (asc_tone + asc_roar + asc_vib + asc_telem) * ascent_env * 0.5;

// ============================================
// BURNOUT APPROACH (25-30s)
// ============================================
// First stage fuel depleting. Thrust tapering.
burnout_env = ba.if(time_sec >= 25.0 & time_sec < 30.0,
                ba.if(time_sec < 26.0, (time_sec - 25.0), 1.0) *
                (1.0 - (time_sec - 25.0) * 0.08),
                0.0);

// Engine pitch dropping as thrust decreases
burnout_freq = 330 - (time_sec - 25.0) * 20;
bo_tone = os.osc(burnout_freq) * 0.05 + os.osc(burnout_freq * 0.75) * 0.03;
// Sputtering — fuel running out
bo_sputter = no.noise : fi.resonbp(burnout_freq * 2, 3, 1.0) : *(0.04) *
             (0.5 + 0.5 * os.osc(12 + (time_sec - 25.0) * 3));
// Thinning atmosphere — less noise
bo_atm = no.noise : fi.resonlp(400, 0.4, 1.0) : *(0.06);
// Telemetry still nominal
bo_telem = os.osc(2400) * 0.015;

burnout = (bo_tone + bo_sputter + bo_atm + bo_telem) * burnout_env * 0.5;

// ============================================
// SEPARATION EVENT (30-33s)
// ============================================
// THE CRITICAL MOMENT. Spring fires. Spinning tub separates.
// CONTACT — edge strikes booster. A metallic crack.
// This is where the future forks.

sep_env = ba.if(time_sec >= 30.0 & time_sec < 33.0,
            1.0,
            0.0);

// Spring release — mechanical thunk
sep_spring_env = ba.if(time_sec >= 30.0 & time_sec < 30.3,
                   (1.0 - (time_sec - 30.0) / 0.3),
                   0.0);
sep_spring = os.osc(150) * 0.2 * sep_spring_env +
             no.noise : fi.resonbp(800, 4, 1.0) : *(0.08) * sep_spring_env;

// CONTACT — the impact. Bell-like metallic ring.
// This is the sound of failure. A sharp crack followed by ringing.
contact_env = ba.if(time_sec >= 30.8 & time_sec < 33.0,
                ba.if(time_sec < 30.85, (time_sec - 30.8) * 20.0, 1.0) *
                exp(-3.0 * (time_sec - 30.8)),
                0.0);

// Metallic impact — multiple resonant modes like a struck bell
contact_bell = os.osc(1200) * 0.12 + os.osc(1847) * 0.08 +
               os.osc(2650) * 0.05 + os.osc(3800) * 0.03;
// Impact crack — broadband transient
contact_crack_env = ba.if(time_sec >= 30.8 & time_sec < 30.9,
                      (1.0 - (time_sec - 30.8) * 10.0),
                      0.0);
contact_crack = no.noise : fi.resonlp(5000, 0.5, 1.0) : *(0.25) * contact_crack_env;

separation = (sep_spring + (contact_bell + contact_crack) * contact_env) *
             sep_env * failure_character;

// ============================================
// NUTATION (33-45s)
// ============================================
// The tub is tumbling. Not spinning cleanly — wobbling.
// Beat frequencies from the interaction of spin and nutation.
// Upper stages fire but thrust vector is wrong.
nutation_env = ba.if(time_sec >= 33.0 & time_sec < 45.0,
                 ba.if(time_sec < 34.0, (time_sec - 33.0), 1.0) *
                 (1.0 - (time_sec - 33.0) * 0.03),
                 0.0);

// Primary spin frequency (the intended rotation ~10 Hz)
spin_freq = 10.0 - (time_sec - 33.0) * 0.3;
// Nutation frequency (wobble, ~3 Hz, growing)
nut_freq = 3.0 + (time_sec - 33.0) * 0.5;

// The wobble creates AM modulation on the spin tone
wobble_am = 0.4 + 0.6 * os.osc(nut_freq);
spin_tone = os.osc(200 * spin_freq / 10.0) * 0.08 * wobble_am;

// Beat frequency between spin and nutation
beat_freq = abs(spin_freq - nut_freq);
beat_tone = os.osc(400 * beat_freq / 7.0) * 0.05;

// Chaotic oscillation — the tumble
chaos_mod = os.osc(nut_freq * 1.7) * os.osc(spin_freq * 0.8);
chaos_tone = os.osc(300 + 200 * chaos_mod) * 0.04;

// Upper stages firing — misaligned thrust (warbling)
thrust_warp = os.osc(500 + 150 * os.osc(nut_freq)) * 0.04;

// Telemetry warbling — signal affected by tumble
telem_warp = os.osc(2400 + 400 * os.osc(nut_freq * 0.5)) * 0.012;

nutation = (spin_tone + beat_tone + chaos_tone + thrust_warp + telem_warp) *
           nutation_env * 0.6;

// ============================================
// TRAJECTORY DIVERGENCE (45-55s)
// ============================================
// The arc bends down. Doppler shift as payload slows.
// Telemetry fading, signal coming and going.
diverge_env = ba.if(time_sec >= 45.0 & time_sec < 55.0,
                ba.if(time_sec < 46.0, (time_sec - 45.0), 1.0) *
                (1.0 - (time_sec - 45.0) * 0.06),
                0.0);

// Falling pitch — the Doppler shift of descent
fall_freq = 350 - (time_sec - 45.0) * 20;
fall_tone = os.osc(fall_freq) * 0.05 + os.osc(fall_freq * 0.5) * 0.03;

// Tumbling continues but energy dissipating
tumble_slow = os.osc(fall_freq * 0.3) * 0.03 *
              (0.5 + 0.5 * os.osc(2.0 - (time_sec - 45.0) * 0.1));

// Telemetry cutting in and out — tumbling antenna
telem_cut_rate = 1.5 + (time_sec - 45.0) * 0.3;
telem_gate = ba.if(os.osc(telem_cut_rate) > 0.0, 1.0, 0.0);
telem_fade = os.osc(2400 - (time_sec - 45.0) * 50) * 0.010 * telem_gate;

// Atmospheric hint — beginning to feel drag
atm_hiss = no.noise : fi.resonlp(300 + (time_sec - 45.0) * 40, 0.5, 1.0) : *(0.03);

diverge = (fall_tone + tumble_slow + telem_fade + atm_hiss) * diverge_env * 0.5;

// ============================================
// SIGNAL LOSS (55-65s)
// ============================================
// Reentry heating disrupts the signal. Static rising.
// The carrier breaks apart.
loss_env = ba.if(time_sec >= 55.0 & time_sec < 65.0,
             (1.0 - (time_sec - 55.0) * 0.08),
             0.0);

// Static increasing — plasma sheath forming
static_rise = no.noise : fi.resonlp(1000 + (time_sec - 55.0) * 200, 0.5, 1.0) :
              *(0.08 + (time_sec - 55.0) * 0.015);

// Carrier fragmenting — intermittent, fading
carrier_frag_env = ba.if(time_sec >= 55.0 & time_sec < 62.0,
                     (62.0 - time_sec) / 7.0,
                     0.0);
carrier_frag = os.osc(2400) * 0.008 * carrier_frag_env *
               ba.if(os.osc(0.8) > 0.3, 1.0, 0.0);

// Low moan — the payload falling
fall_moan = os.osc(80 - (time_sec - 55.0) * 4) * 0.03 *
            (1.0 - (time_sec - 55.0) * 0.08);

signal_loss = (static_rise + carrier_frag + fall_moan) * loss_env * 0.4;

// ============================================
// SILENCE (65-72s)
// ============================================
// Gone. Only receiver noise remains.
silence_env = ba.if(time_sec >= 65.0 & time_sec < 72.0,
                (72.0 - time_sec) / 7.0,
                0.0);

receiver_noise = no.noise : fi.resonlp(200, 0.2, 1.0) : *(0.02);
// Occasional phantom blip — is that signal? No. Just noise.
phantom = os.osc(2400) * 0.003 *
          ba.if(os.osc(0.15) > 0.95, 1.0, 0.0);

silence = (receiver_noise + phantom) * silence_env * 0.3;

// ============================================
// AFTERSILENCE (72-75s)
// ============================================
// The ghost of what would have been. A faint echo of the
// ascent tone — the orbit that never happened — fading.
after_env = ba.if(time_sec >= 72.0 & time_sec <= 75.0,
              (75.0 - time_sec) / 3.0,
              0.0);

// Ghost of the ascent pitch — where it would have leveled off
ghost_freq = 330;
ghost_tone = os.osc(ghost_freq) * 0.015 + os.osc(ghost_freq * 1.5) * 0.008;
// Ghost telemetry — the data that was never collected
ghost_telem = os.osc(2400) * 0.004;

aftersilence = (ghost_tone + ghost_telem) * after_env * 0.2;

// ============================================
// MASTER MIX
// ============================================
raw = (prelaunch + ignition + ascent + burnout + separation +
       nutation + diverge + signal_loss + silence + aftersilence) * intensity;

// Gentle limiting
limited = raw : ef.compressor_mono(4, -6, 0.01, 0.1);

// Stereo — separation impact center, nutation pans with wobble
width = 0.4;
wobble_pan = os.osc(3.0 + time_sec * 0.05);
process = limited <: *(1 + width * wobble_pan), *(1 - width * wobble_pan);
