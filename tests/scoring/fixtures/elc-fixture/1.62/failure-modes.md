# Failure Modes — Surveyor 5 alpha-scatterer preamp

## Era-original mechanisms

- **Latch-up** in the cascode JFET input under cosmic-ray strike — early Si-discrete era had no SOI isolation; mitigation was guard rings + bias-resistor current limiting.
- **Drift** in the chopper integrator's offset over the lunar-day thermal cycle (–150 °C to +120 °C); mitigated by selected-grade matched pairs and oven-stabilization where mass budget allowed.
- **ESD** during pre-flight checkout; mitigated by humidity-controlled clean rooms and grounded wrist straps.

## Modern equivalents

- Latch-up risk obviated by SOI processes and dielectric isolation.
- Drift handled by chopper-stabilized op-amps with auto-zero (e.g. LTC2050).
- ESD handled by integrated TVS diode arrays at the connector.

## Notes

Leakage at the high-Z integrator node was the dominant secondary failure mode after ~6 months of mission elapsed time, consistent with electromigration in the early Al metallization.
