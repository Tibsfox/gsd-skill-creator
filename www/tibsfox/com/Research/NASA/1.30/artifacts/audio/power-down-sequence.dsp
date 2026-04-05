// Power Down Sequence — Ranger 5 instrument shutdown
// FAUST VST/LV2 synthesizer
// 90 seconds: instruments drop out one by one until only the 50 mW beacon remains
//
// Architecture: Five sine oscillators representing spacecraft systems,
// each with an envelope that goes to zero at the system's shutdown time.
// A final low-frequency pulse (beacon) persists after all others die.
//
// Systems and their shutdown times (mapped to 90-second duration):
//   Gamma-ray spectrometer: dies at ~4 hours → 30 sec in audio
//   Radar altimeter: dies at ~6 hours → 45 sec
//   TV camera: dies at ~7 hours → 52 sec
//   Telemetry: dies at ~8 hours → 60 sec
//   Command receiver: dies at ~8h44m → 65 sec
//   Capsule beacon: persists as fading pulse → 65-90 sec

import("stdfaust.lib");

// Clock: 0 to 90 seconds
clock = ba.time / ma.SR;

// Envelope: ramp down to zero at cutoff time (with 2-sec fade)
shutdownEnv(cutoff) = max(0, min(1, (cutoff - clock) / 2.0));

// System oscillators
gammaRay = os.osc(440) * 0.15 * shutdownEnv(30);
radar = os.osc(660) * 0.12 * shutdownEnv(45);
camera = os.osc(880) * 0.10 * shutdownEnv(52);
telemetry = os.osc(1100) * 0.08 * shutdownEnv(60);
command = os.osc(330) * 0.10 * shutdownEnv(65);

// 50 mW beacon: low pulse after main systems die
beaconGate = max(0, clock - 65) / 25.0;  // ramps 0→1 over 25 sec after T+65
beaconPulse = os.osc(220) * 0.05 * (1.0 - beaconGate) *
              (0.5 + 0.5 * os.osc(0.5));  // modulated at 0.5 Hz

// Mix with stereo spread
leftMix = gammaRay + radar * 0.8 + camera * 0.6 + telemetry + command * 0.7 + beaconPulse;
rightMix = gammaRay * 0.8 + radar + camera * 0.7 + telemetry * 0.6 + command + beaconPulse;

// Output with gentle reverb (simple feedback delay)
reverb(x) = x + 0.3 * x@(ma.SR * 0.15);
process = reverb(leftMix), reverb(rightMix);
