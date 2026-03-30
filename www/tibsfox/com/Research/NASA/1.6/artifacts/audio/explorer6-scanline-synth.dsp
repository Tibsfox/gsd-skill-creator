// Spin-Scan Sonification — Explorer 6 Earth Image Synthesizer
// FAUST DSP source — compiles to VST, AU, LV2, JACK, CLI
//
// Mission 1.6: Explorer 6 (S-2 / Space Technology Laboratories)
// The sound of seeing. ~90 seconds.
//
// On August 7, 1959, Explorer 6 carried the first TV camera to orbit.
// Not a camera as we know it — a single photocell behind a slit,
// spinning with the spacecraft at 2.8 rpm. One revolution = one
// scan line = 21.4 seconds. The photocell swept across the sunlit
// Earth, converting brightness to voltage, voltage to FM signal,
// signal to strip-chart paper at South Point, Hawaii. The image
// was crude — a blurry crescent, barely recognizable as a planet.
// It was the first photograph of Earth from space.
//
// Timeline (phase 0-1 → 0-90 seconds):
//   0-5s:      Static — pre-acquisition. The ground station listens.
//              Wideband noise, the hiss of an empty channel.
//   5-10s:     Lock-on — the spacecraft's beacon appears in the noise.
//              A thin 108 MHz tone emerges, wavering with spin modulation.
//   10-31s:    First scan line — the photocell sweeps across 360 degrees.
//              21.4 seconds of slowly varying brightness tones.
//              Space = silence. Earth limb = rising pitch. Sunlit crescent =
//              bright tone peak. Space again = fade to dark.
//   31-52s:    Second scan line — same sweep, slightly offset. The image
//              is building. Two lines of Earth visible now.
//   52-73s:    Third scan line — the crescent becomes recognizable.
//              Cloud patterns modulate the brightness tone.
//              Static increases as the spacecraft moves toward apogee.
//   73-85s:    Signal degradation — 42,400 km apogee. The signal fades
//              into noise. The photocell still spins but the data is
//              increasingly corrupted. Noise overwhelms the image.
//   85-90s:    Loss of signal. Static. Then silence. But the image
//              exists — three scan lines of Earth, printed on paper.
//
// Organism resonance: Trametes versicolor (turkey tail fungus)
//   First scan = first ring of color on the bracket
//   Second scan = second concentric band appears
//   Third scan = the pattern becomes recognizable
//   Signal loss = the log continues to decay; the fungus grows on
//
// Dedication: Vincent van Gogh
//   Van Gogh saw beauty in imperfection — thick impasto,
//   visible brushstrokes, color that was felt rather than matched.
//   Explorer 6's first image was imperfect in every way:
//   noisy, blurred, barely legible. It was beautiful because
//   it was the first. The crudeness was the message.
//
// Build:
//   faust2jaqt explorer6-scanline-synth.dsp   # JACK/Qt standalone
//   faust2lv2  explorer6-scanline-synth.dsp   # LV2 plugin
//   faust2vst  explorer6-scanline-synth.dsp   # VST plugin (needs VST SDK)
//
// Install FAUST: https://faust.grame.fr/downloads/

import("stdfaust.lib");

// --- Parameters ---
phase = hslider("[0]Phase", 0, 0, 1, 0.001) : si.smoo;
auto_mode = checkbox("[1]Auto (90s cycle)");
noise_level = hslider("[2]Noise Level", 0.5, 0, 1, 0.01) : si.smoo;
brightness = hslider("[3]Brightness", 0.7, 0, 1, 0.01) : si.smoo;

// Auto-advancing phase (90-second cycle)
auto_phase = os.phasor(1, 1.0/90.0);
active_phase = select2(auto_mode, phase, auto_phase);

// --- Time mapping (phase 0-1 → 0-90 seconds) ---
time_sec = active_phase * 90.0;

// --- Spin rate ---
// 2.8 rpm = 0.04667 Hz = one revolution every 21.43 seconds
spin_freq = 2.8 / 60.0;
spin_phase = os.phasor(1, spin_freq);

// --- Earth brightness profile ---
// Simulates the photocell scanning across 360 degrees of sky
// Earth subtends roughly 120 degrees from LEO (crude approximation)
// Crescent: bright on one side, dark on the other
earth_angle_start = 0.25;
earth_angle_end = 0.58;
earth_brightness = ba.if(spin_phase > earth_angle_start,
                    ba.if(spin_phase < earth_angle_end,
                      sin((spin_phase - earth_angle_start) / (earth_angle_end - earth_angle_start) * ma.PI) *
                      (0.3 + 0.7 * sin((spin_phase - earth_angle_start) / (earth_angle_end - earth_angle_start) * ma.PI * 0.5)),
                      0.0),
                    0.0);

// Cloud modulation — irregular brightness bumps on the Earth signal
cloud_mod = 1.0 + 0.15 * os.osc(0.73) * os.osc(1.17) + 0.1 * os.osc(2.31);

// ============================================
// STATIC / PRE-ACQUISITION (0-5s)
// ============================================
pre_env = ba.if(time_sec < 5.0,
            ba.if(time_sec < 0.5, time_sec * 2.0, 1.0),
            0.0);

pre_static = no.noise : fi.resonlp(8000, 0.5, 1.0) : *(0.15);
pre_section = pre_static * pre_env;

// ============================================
// LOCK-ON (5-10s)
// ============================================
// Beacon emerges from noise — 108 MHz shifted to audible ~540 Hz
// Spin modulation at 2.8 rpm creates amplitude wobble
lockon_env = ba.if(time_sec >= 5.0,
              ba.if(time_sec < 10.0,
                (time_sec - 5.0) / 5.0,
                0.0),
              0.0);

beacon_tone = os.osc(540) * 0.3 + os.osc(541.5) * 0.1;
spin_am = 0.5 + 0.5 * os.osc(spin_freq);
beacon_noise = no.noise : fi.resonlp(2000, 0.8, 1.0) : *(0.1 * (1.0 - lockon_env));
lockon_section = (beacon_tone * spin_am + beacon_noise) * lockon_env * 0.5;

// ============================================
// SCAN LINES (10-73s) — Three complete revolutions
// ============================================
// The photocell converts brightness to frequency
// Dark sky = low tone (~200 Hz), bright Earth = high tone (~2000 Hz)
// Each scan builds up one line of the image

scan_active = ba.if(time_sec >= 10.0,
               ba.if(time_sec < 73.0, 1.0, 0.0),
               0.0);

// Which scan line are we on? (0, 1, 2)
scan_number = ba.if(time_sec < 31.4, 0.0,
               ba.if(time_sec < 52.8, 1.0, 2.0));

// Brightness-to-frequency mapping
brightness_freq = 200.0 + earth_brightness * cloud_mod * 1800.0 * brightness;

// The scan tone — frequency follows brightness
scan_tone = os.osc(brightness_freq) * 0.25 +
            os.osc(brightness_freq * 2.0) * 0.08 +
            os.osc(brightness_freq * 0.5) * 0.12;

// Distance-dependent noise (increases with scan number as spacecraft moves to apogee)
distance_noise_level = (0.05 + scan_number * 0.08) * noise_level;
distance_noise = no.noise : fi.resonlp(3000 - scan_number * 500, 0.7, 1.0)
                 : *(distance_noise_level);

// Scan line envelope — gentle fade in/out at scan boundaries
scan_within_rev = ma.frac((time_sec - 10.0) / 21.4);
scan_line_env = ba.if(scan_within_rev < 0.02, scan_within_rev / 0.02,
                 ba.if(scan_within_rev > 0.98, (1.0 - scan_within_rev) / 0.02,
                   1.0));

// Spin-rate hum — always present, the mechanical heartbeat of the spacecraft
spin_hum = os.osc(spin_freq * 10.0) * 0.02 + os.osc(spin_freq * 20.0) * 0.01;

scan_section = (scan_tone + distance_noise + spin_hum) * scan_active * scan_line_env;

// ============================================
// SIGNAL DEGRADATION (73-85s)
// ============================================
// Apogee — 42,400 km. Signal fading fast.
degrade_env = ba.if(time_sec >= 73.0,
                ba.if(time_sec < 85.0,
                  1.0 - (time_sec - 73.0) / 12.0,
                  0.0),
                0.0);

degrade_tone = os.osc(brightness_freq * 0.8) * 0.1;
degrade_noise = no.noise : fi.resonlp(1500, 0.6, 1.0) : *(0.25 * noise_level);
degrade_crackle = no.noise : fi.resonlp(400, 3.0, 1.0) : *(0.05) :
                  *(ba.if(no.noise > 0.7, 1.0, 0.0));

degrade_section = (degrade_tone * degrade_env + degrade_noise * (1.0 - degrade_env * 0.5) +
                   degrade_crackle) * ba.if(time_sec >= 73.0, ba.if(time_sec < 85.0, 1.0, 0.0), 0.0);

// ============================================
// LOSS OF SIGNAL (85-90s)
// ============================================
los_env = ba.if(time_sec >= 85.0,
            ba.if(time_sec < 90.0,
              1.0 - (time_sec - 85.0) / 5.0,
              0.0),
            0.0);

los_static = no.noise : fi.resonlp(500, 0.5, 1.0) : *(0.05);
los_section = los_static * los_env;

// ============================================
// Final mix
// ============================================
process = (pre_section + lockon_section + scan_section + degrade_section + los_section)
          * 0.7 <: _, _;
