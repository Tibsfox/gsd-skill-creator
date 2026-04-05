// aurora7-overshoot.dsp
// FAUST DSP: Aurora 7 Mission Sonification — The Sound of 402 Kilometers
//
// Maps the mission timeline to audio:
//   Phase 1 (0-20s): Launch and orbital insertion — ascending roar
//   Phase 2 (20-50s): Three orbits — oscillating tone (day/night cycle)
//     Firefly moments: bright crystalline chimes at orbital dawn
//     Fuel depletion: low drone decreasing in volume
//   Phase 3 (50-60s): Retrofire — three percussive thuds, slightly off-beat
//     The 3-second delay is audible — the rhythm stutters
//     The 25° yaw: pitch bends sideways (stereo shift)
//   Phase 4 (60-80s): Reentry — descending frequency sweep, heating noise
//   Phase 5 (80-90s): Splashdown — impact, water, silence, waves
//     402 km late — the splash is delayed relative to expectation
//
// Build: faust2jack aurora7-overshoot.dsp
// Duration: ~90 seconds

import("stdfaust.lib");

// Mission clock (0 to 90 seconds mapped to 0-1)
phase = os.phasor(1, 1.0/90.0);

// === LAUNCH ROAR ===
launchRoar = no.noise : fi.lowpass(2, 200 + phase * 2000)
           : *(ba.if(phase < 0.22, phase / 0.22, 0))
           : *(0.4);

// === ORBITAL TONE (day/night oscillation) ===
orbitTone = os.osc(220 + 110 * os.osc(0.033))  // ~30s orbital period
          : *(ba.if(phase > 0.22 & phase < 0.56, 0.3, 0))
          : fi.lowpass(2, 2000);

// === FIREFLY CHIMES (at orbital dawn moments) ===
fireflyChime = os.osc(4400) * os.osc(5500) * 0.1
             : *(ba.if(phase > 0.25 & phase < 0.28, 1,
                 ba.if(phase > 0.36 & phase < 0.39, 1,
                 ba.if(phase > 0.47 & phase < 0.50, 1, 0))))
             : ef.echo(0.2, 0.1, 0.5);

// === FUEL DRONE (decreasing) ===
fuelLevel = max(0, 1.0 - phase * 2.5);  // Depletes faster than mission
fuelDrone = os.osc(55) : *(fuelLevel * 0.15)
          : *(ba.if(phase > 0.1 & phase < 0.56, 1, 0));

// === RETROFIRE (three thuds, 3s late) ===
retroPhase = (phase - 0.58) * 90;  // seconds after retrofire point
retro1 = ba.if(retroPhase > 3 & retroPhase < 3.5, 1, 0);   // 3s LATE
retro2 = ba.if(retroPhase > 13 & retroPhase < 13.5, 1, 0);
retro3 = ba.if(retroPhase > 23 & retroPhase < 23.5, 1, 0);
retroSound = no.noise : fi.bandpass(2, 80, 200)
           : *((retro1 + retro2 + retro3) * 0.8);

// === REENTRY SWEEP ===
reentryFreq = ba.if(phase > 0.67 & phase < 0.89,
              8000 * (1 - (phase - 0.67) / 0.22), 0);
reentrySweep = os.sawtooth(reentryFreq)
             : fi.lowpass(2, reentryFreq)
             : *(ba.if(phase > 0.67 & phase < 0.89, 0.2, 0));

// === SPLASHDOWN ===
splash = no.noise : fi.lowpass(2, 400)
       : *(ba.if(phase > 0.89 & phase < 0.92, 0.6, 0));
waves = os.osc(0.3) * 0.05
      : *(ba.if(phase > 0.92, 1, 0));

// === MIX ===
process = (launchRoar + orbitTone + fireflyChime + fuelDrone
         + retroSound + reentrySweep + splash + waves)
        : fi.lowpass(2, 12000)
        : ef.compressor_mono(3, -10, 0.01, 0.1)
        <: _, _;
