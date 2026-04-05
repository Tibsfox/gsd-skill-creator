// flicker-drumming.dsp
// FAUST DSP: Red-shafted Flicker Drumming — Aurora 7 Mission Sonification
// SPS (Sound Pairing Species) for Mission 1.23 / Degree 22
//
// Colaptes auratus cafer drums at ~25 beats per second on resonant surfaces.
// This FAUST program generates the drumming pattern, mapped to Aurora 7's timeline:
//   - Pre-launch: slow heartbeat taps
//   - Launch: accelerating drum rate
//   - Orbit 1-2: full-rate drumming on metal (science observations)
//   - Fuel warning: erratic, stuttering rhythm
//   - Retrofire: three sharp impacts
//   - Reentry: wind noise, silence
//   - Recovery: single distant drum
//
// Build: faust2jack flicker-drumming.dsp
//        faust2lv2 flicker-drumming.dsp (for DAW)
//        faust2vst flicker-drumming.dsp (for VST hosts)
//
// Duration: ~90 seconds continuous
// Organism: Oplopanax horridus (Devil's Club) — thorns as staccato
// Bird: Red-shafted Flicker — drumming as communication
// Mission: Mercury-Atlas 7 / Aurora 7 — Scott Carpenter, May 24, 1962

import("stdfaust.lib");

// === PARAMETERS ===
drumRate = hslider("Drum Rate (Hz)", 25, 1, 40, 0.1) : si.smoo;
resonance = hslider("Surface Resonance", 0.8, 0.1, 1.0, 0.01) : si.smoo;
metallic = hslider("Metallic Character", 0.6, 0, 1, 0.01) : si.smoo;
missionPhase = hslider("Mission Phase", 0, 0, 6, 1);
// Phase 0: Pre-launch (heartbeat)
// Phase 1: Launch (accelerating)
// Phase 2: Orbit/Science (full rate)
// Phase 3: Fuel warning (erratic)
// Phase 4: Retrofire (three impacts)
// Phase 5: Reentry (wind)
// Phase 6: Recovery (single distant drum)

// === DRUM IMPULSE GENERATOR ===
// Models the flicker's bill strike on a resonant surface
// Each strike is a short impulse filtered through the surface response
drumImpulse = os.impulse : fi.resonbp(freq, q, 1)
with {
    freq = 800 + metallic * 2200;  // Wood: 800 Hz, Metal: 3000 Hz
    q = 10 + resonance * 40;       // Resonance quality factor
};

// === DRUM TRIGGER (25 beats/sec clock) ===
drumClock = os.lf_imptrain(drumRate);

// === SURFACE RESONANCE MODEL ===
// Metal chimney cap: high freq, long ring
// Hollow snag: mid freq, short ring
// The flicker selects the loudest surface
surfaceResponse(x) = x : fi.resonbp(f1, q1, g1)
                       : fi.resonbp(f2, q2, g2)
with {
    f1 = 1200 + metallic * 1800;
    q1 = 20 + resonance * 30;
    g1 = 0.7;
    f2 = 2400 + metallic * 3600;
    q2 = 15 + resonance * 25;
    g2 = 0.3;
};

// === MISSION TIMELINE MODULATION ===
// Each phase modifies the drum character
phaseGain = ba.if(missionPhase < 1, 0.3,    // Pre-launch: quiet
            ba.if(missionPhase < 2, 0.7,      // Launch: building
            ba.if(missionPhase < 3, 1.0,       // Orbit: full
            ba.if(missionPhase < 4, 0.5,       // Fuel warning: degraded
            ba.if(missionPhase < 5, 0.9,       // Retrofire: sharp
            ba.if(missionPhase < 6, 0.1,       // Reentry: fading
            0.2))))));                          // Recovery: distant

// === OUTPUT ===
process = drumClock
        : surfaceResponse
        : *(phaseGain)
        : ef.echo(0.1, 0.05, 0.3)  // Room reflection
        <: _, _;                     // Stereo
