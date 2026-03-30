// Vanguard 1 Solar Persistence Sonification
// FAUST DSP source — compiles to VST, AU, LV2, JACK, CLI
//
// Mission 1.8: Vanguard 1 (first solar-powered satellite)
// The sound of 68 years of silent orbiting. ~40 seconds per cycle.
//
// On March 17, 1958, the Naval Research Laboratory launched Vanguard 1
// into an orbit of 654 × 3,969 km. It was 16.5 cm in diameter —
// Khrushchev called it "the grapefruit satellite." It weighed 1.47 kg.
// It carried 6 silicon solar cells designed by Bell Laboratories,
// the first ever used on a spacecraft. The chemical batteries died
// in June 1958. The solar cells kept transmitting until May 1964.
// The satellite itself is still in orbit. It is the oldest artificial
// object still orbiting Earth — 68 years and counting. It will remain
// in orbit for approximately 240 more years.
//
// This sonification is a meditation on persistence. Vanguard 1 does
// nothing now. It carries no functioning instruments. It transmits
// no data. It simply exists — a 1.47 kg aluminum sphere tumbling
// silently through the thermosphere, catching sunlight on six small
// silicon rectangles that once powered a transmitter and now power
// nothing at all. It is the most patient object humanity has ever made.
//
// Timeline (phase 0-1 → 0-40 seconds, one orbit compressed):
//   0-8s:     Sunlit arc — the solar cells catch light. A warm,
//             sustained hum builds as photons hit silicon. The sound
//             of electricity being generated with nowhere to go.
//   8-14s:    Shadow transition — the satellite enters Earth's shadow.
//             The hum fades as sunlight cuts off. A brief thermal
//             creak as the sphere contracts from +120C to -120C.
//   14-24s:   Eclipse — silence. The grapefruit tumbles in darkness.
//             Only the faintest trace of a carrier memory remains,
//             a ghost of 108 MHz that stopped transmitting in 1964.
//   24-32s:   Dawn — sunlight returns. The hum rebuilds, slowly.
//             The solar cells generate current again, flowing through
//             circuits that lead nowhere. Power without purpose.
//   32-40s:   Full sun — sustained hum at maximum. The sound of
//             endurance. 68 years of this. 330,000+ orbits.
//
// Organism resonance: Polypodium glycyrrhiza (licorice fern)
//   The licorice fern grows on bigleaf maple branches and mossy rocks
//   in the PNW. It is an epiphyte — it lives on another organism
//   without parasitizing it. It goes dormant in summer, brown and
//   curled, apparently dead. When autumn rains return, it greens up
//   instantly. It persists through apparent death, the way Vanguard 1
//   persists through apparent obsolescence. Both outlast the things
//   that seem more substantial. The fern outlasts the branch.
//   The satellite outlasts the program that launched it.
//
// Dedication: Gottlieb Daimler
//   Daimler built the smallest, lightest internal combustion engine
//   of his era — the "grandfather clock" engine (1885), which powered
//   the first motorcycle and eventually the first automobile. He
//   proved that making something small does not make it insignificant.
//   Vanguard 1 was the smallest satellite of its era, mocked as a
//   "grapefruit," and has outlasted every contemporary by decades.
//   Daimler's small engine changed the world. Vanguard 1's small
//   sphere proved the Earth is pear-shaped.
//
// Build:
//   faust2jaqt vanguard1-solar-synth.dsp   # JACK/Qt standalone
//   faust2lv2  vanguard1-solar-synth.dsp   # LV2 plugin
//   faust2vst  vanguard1-solar-synth.dsp   # VST plugin (needs VST SDK)
//
// Install FAUST: https://faust.grame.fr/downloads/

import("stdfaust.lib");

// --- Parameters ---
phase = hslider("[0]Phase", 0, 0, 1, 0.001) : si.smoo;
auto_mode = checkbox("[1]Auto (40s cycle)");
solar_intensity = hslider("[2]Solar Intensity", 0.8, 0, 1, 0.01) : si.smoo;
volume = hslider("[3]Volume", 0.7, 0, 1, 0.01) : si.smoo;

// Auto-advancing phase (40-second cycle — one compressed orbit)
auto_phase = os.phasor(1, 1.0/40.0);
active_phase = select2(auto_mode, phase, auto_phase);

// --- Time mapping ---
time_sec = active_phase * 40.0;

// ============================================
// SOLAR ILLUMINATION PROFILE
// ============================================
// Vanguard 1 orbital period: 134.2 minutes
// Eclipse fraction: ~35% of orbit (varies with season)
// Model: sunlit from 0-0.2, transition 0.2-0.35, eclipse 0.35-0.6,
//        dawn 0.6-0.8, full sun 0.8-1.0

sun_phase = active_phase;

// Smooth illumination: 1.0 = full sun, 0.0 = full eclipse
illumination_raw = ba.if(sun_phase < 0.2,
                    1.0,
                    ba.if(sun_phase < 0.35,
                      1.0 - (sun_phase - 0.2) / 0.15,
                      ba.if(sun_phase < 0.6,
                        0.0,
                        ba.if(sun_phase < 0.8,
                          (sun_phase - 0.6) / 0.2,
                          1.0))));

illumination = illumination_raw : si.smoo;

// ============================================
// SOLAR CELL HUM
// ============================================
// The fundamental sound: photovoltaic conversion
// Silicon solar cells produce DC, but the satellite's spin (approx
// once every 2.3 seconds currently, faster when first launched)
// modulates the output as each cell rotates into and out of sunlight.
// This creates a gentle amplitude modulation at the spin frequency.

// Spin rate: originally ~2.7 rps, now ~0.4 rps (slowed by tidal forces)
spin_rate = 2.3;
spin_mod = 0.5 + 0.5 * os.osc(spin_rate);

// Solar cell fundamental: low hum representing DC photocurrent
// 6 cells → slight harmonic at 6× spin rate
cell_fund = os.osc(55.0) * 0.35;       // Deep E1 hum
cell_6th = os.osc(55.0 * 6.0) * 0.04;  // 6-cell harmonic
cell_spin = os.osc(330.0 * spin_mod) * 0.02; // Spinning modulation

// Combine with illumination envelope
solar_hum = (cell_fund + cell_6th + cell_spin)
            * illumination * solar_intensity
            * (0.85 + 0.15 * spin_mod);

// ============================================
// 108 MHZ CARRIER GHOST
// ============================================
// Vanguard 1 transmitted on 108.00 MHz and 108.03 MHz
// The transmitter died in 1964, but we represent its memory
// as a faint, wavering tone — a ghost frequency

carrier_freq = 432.0;  // 108 MHz / 250000, in audible range
carrier_drift = os.osc(0.07) * 3.0;  // Slow frequency drift
carrier_ghost = os.osc(carrier_freq + carrier_drift) * 0.008
                + os.osc(carrier_freq * 1.0003) * 0.005;

// The ghost is always present but barely audible —
// the memory of a signal that stopped 62 years ago
ghost_env = 0.3 + 0.7 * illumination;  // Slightly louder in sunlight
carrier_signal = carrier_ghost * ghost_env;

// ============================================
// THERMAL CREAK
// ============================================
// As Vanguard 1 enters/exits shadow, temperature swings from
// ~120C to ~-120C. The aluminum sphere expands and contracts,
// producing brief acoustic transients (if anyone could hear them).

// Transition detector: rapid change in illumination
transition_rate = abs(illumination_raw - illumination_raw');
transition_trigger = transition_rate > 0.001;

// Creak sound: metallic ping, filtered noise burst
creak_impulse = transition_trigger * no.noise;
creak_body = creak_impulse : fi.resonbp(1800, 15.0, 1.0) : *(3.0);
creak_high = creak_impulse : fi.resonbp(4500, 20.0, 1.0) : *(1.5);
creak_env = transition_trigger : en.ar(0.001, 0.3);
creak_sound = (creak_body + creak_high) * creak_env * 0.15;

// ============================================
// COSMIC SILENCE
// ============================================
// During eclipse, almost nothing. Just the vast quiet of space
// with the faintest stellar background noise

space_noise = no.noise : fi.resonlp(200, 0.3, 1.0) : *(0.003);
space_tone = os.osc(30.0) * 0.005;  // Infrasonic rumble of orbit
cosmic_bg = (space_noise + space_tone) * (1.0 - illumination * 0.7);

// ============================================
// ORBITAL PERSISTENCE DRONE
// ============================================
// A deep, constant drone representing the fact of continued existence.
// 68 years. 330,000+ orbits. Still there. Still going.
// This tone never stops. It is the sound of persistence itself.

persist_freq = 36.7;  // Low C#, below most speakers but felt
persist_drone = os.osc(persist_freq) * 0.06
                + os.osc(persist_freq * 2.0) * 0.03
                + os.osc(persist_freq * 3.0) * 0.015;

// Slow, deep breathing modulation — the orbit itself
orbit_breath = 0.85 + 0.15 * os.osc(1.0 / 40.0);
persistence = persist_drone * orbit_breath;

// ============================================
// Final mix
// ============================================
output = (solar_hum * 0.5 +
          carrier_signal +
          creak_sound +
          cosmic_bg +
          persistence) * volume;

process = output * 0.7 <: _, _;
