# Power Electronics in the Era of AI

**Catalog:** ELE-PWR | **Cluster:** Electronics, Energy, Infrastructure
**Date:** 2026-04-04 | **Source:** Thayer School of Engineering (AqZqn18DMas)
**Duration:** 52m | **Speaker:** Prof. Jason Stauth, Dartmouth (PhD Berkeley)
**College:** Electronics, Engineering, Physics, Environmental

## Abstract

How power electronics — the science of lossless energy conversion — is being reshaped by AI's insatiable demand for electricity. Covers the fundamental CV2 hard-charging loss theorem, switched-capacitor converters with resonant soft-charging, and the GPU power delivery challenge (0.7V, 3,000A, 3.6 kW per chip). Data centers now consume 2-4% of US electricity, projected 2-3x worse within 3 years.

## Key Numbers

| Metric | Value |
|--------|-------|
| US data center electricity | 2-4% (growing 2-3x in 3 years) |
| Next-gen GPU voltage | 0.7V |
| GPU current | ~3,000A |
| GPU power per chip | ~3.6 kW |
| GPUs per rack (Kyber) | 576 (8/blade x 72) |
| Rack cost | ~$10 million |
| Rack power = ~250 homes | |
| Hard-charging CV2 loss | always exactly 50% |
| SC energy recovery | loss reduced by factor N (N steps) |
| Gate drive loss reduction | 2-7x demonstrated |
| Capacitor vs inductor energy density | ~1,000x per volume |

## Key Insight: The GPU Power Delivery Problem

From nuclear plant to GPU die:
```
Nuclear/Generation -> HV Transmission (345kV) -> Step-down (35-48kV) 
  -> Distribution (480V AC) -> Server PSU (12V DC) -> VRM (0.7V DC)
```

The step-down ratio is ~500,000:1. Every milliohm in this chain matters at 3,000A. Switched-capacitor + resonant hybrid topologies achieve higher efficiency than traditional buck converters at extreme step-down ratios.

## The CV2 Theorem (Fundamental)

When charging a capacitor from a rigid voltage source, exactly 50% of the energy is always lost as heat, regardless of resistance. This is a thermodynamic result, not an engineering limitation.

The fix: charge in N small steps instead of one big step. Loss reduces by factor N. Add resonant inductors for soft-charging: energy transferred without hard-charging loss.

## Forest Sim Connection

The energy budget system in the PNW Forest Simulation follows the same principle: organisms have finite energy that must be managed across activity states (foraging, fleeing, resting). The CV2 loss theorem has a biological analog — metabolic inefficiency during rapid energy transfer (anaerobic vs aerobic metabolism). The N-step charging strategy maps to grazing behavior — many small meals are metabolically more efficient than one large feast.

## Rosetta Translation

| Power Electronics | Ecological Analog | AI/Computing Analog |
|------------------|-------------------|-------------------|
| CV2 hard-charging loss | Metabolic heat from rapid exertion | Context window overflow penalty |
| N-step soft charging | Grazing (many small meals) | Progressive skill loading |
| BMS cell balancing | Homeostasis | Agent load balancing |
| Grid-to-chip cascade | Food chain energy transfer | Data pipeline latency |
| Thermal runaway | Metabolic storm | Token budget exhaustion |

## Study Guide Topics (15)

1. Power transmission history: mechanical -> electrical -> power electronics
2. Why AC won: transformer operation and long-distance transmission
3. P = VI and I2R loss minimization
4. Inductors and capacitors as energy storage elements
5. The CV2 hard-charging loss theorem
6. Buck converters: inductor-based step-down
7. Switched-capacitor converters: voltage division
8. Soft-charging: N-step loss reduction
9. Resonant SC hybrid topologies
10. Nonlinear control: thermostat analogy
11. Startup in high-order SC converters
12. Transistor gate drive as capacitive load
13. GPU power delivery: 0.7V at 3,000A
14. Data center energy: AI as defining power challenge
15. PZT piezoelectric actuators (DARPA application)

## DIY Try Sessions (5)

1. **CV2 loss demo** — Charge 1000uF cap via resistor, measure 50% loss. Then charge via pre-charged cap for comparison.
2. **Buck converter teardown** — USB step-down module ($2), oscilloscope switching waveform, calculate duty cycle D = Vout/Vin
3. **Switching frequency vs inductor** — 555 timer oscillator, swap inductors, observe ripple vs frequency trade-off
4. **LED driver efficiency** — Linear current limiter vs switching buck driver, measure power waste difference
5. **Power grid chain model** — Transformer-coupled supplies simulating 120V -> 12V -> 5V -> 3.3V -> 1.8V cascade, measure cumulative losses
