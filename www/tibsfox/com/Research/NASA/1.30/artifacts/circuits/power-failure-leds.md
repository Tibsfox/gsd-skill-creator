# Circuit: Power Failure LED Display

## Ranger 5 — Lights Going Out

**Estimated Cost:** $15
**Difficulty:** Beginner-Intermediate
**Build Time:** 2-3 hours

---

## Concept

An ascending chain of 10 green LEDs represents Ranger 5's powered flight. They light up in sequence (powered by a 555/CD4017 counter), but at LED 7 (representing T+75 minutes), the power to the remaining LEDs is cut. LEDs 8-10 never light. Then the sequence reverses: LEDs 7→6→5→4→3→2→1 go dark one by one (battery draining). When the last green LED dies, a single red LED begins blinking slowly — the seismometer capsule's 50 mW beacon transmitter. After 30 seconds, even the red LED goes dark.

## Parts List

| Component | Quantity | Est. Cost |
|-----------|----------|-----------|
| 555 timer IC | 1 | $0.50 |
| CD4017 decade counter | 1 | $0.75 |
| CD4024 binary counter | 1 | $0.60 |
| Green LEDs (5mm) | 10 | $1.00 |
| Red LED (5mm) | 1 | $0.10 |
| 220Ω resistors | 11 | $0.55 |
| 100kΩ potentiometer | 1 | $0.75 |
| 10μF electrolytic cap | 1 | $0.20 |
| 0.1μF ceramic cap | 1 | $0.10 |
| 2N3904 NPN transistor | 2 | $0.20 |
| SPST switch | 1 | $0.50 |
| 9V battery + clip | 1 | $3.00 |
| Breadboard | 1 | $5.00 |
| **Total** | | **~$13.25** |

## Schematic Description

1. **555 Timer:** Configured as astable oscillator at ~2 Hz (adjustable via potentiometer). Drives clock input of CD4017.

2. **CD4017 Decade Counter:** Outputs Q0-Q9 go high sequentially. Q0-Q6 drive green LEDs 1-7 through 220Ω resistors. Q7 triggers the "power failure" — sets a flip-flop that begins the reverse sequence.

3. **Reverse Sequence:** CD4024 binary counter driven by the same 555 clock, started when Q7 goes high. Its outputs drive transistor switches that ground LEDs 7→1 in sequence (turning them off).

4. **Beacon:** When all green LEDs are dark, the 555 timer's frequency drops to ~0.5 Hz (via switched RC network) and drives the red LED — a slow blink representing the capsule's beacon.

5. **Final Dark:** A timeout circuit (large RC, ~30 seconds) eventually pulls the 555's reset pin low, stopping all oscillation. Total darkness.

## The Lesson

The ascending LEDs that stop partway up and then go dark. Unlike v1.5's escape velocity circuit where the top LED stays on forever, and v1.29's dead-signal circuit where a carrier hums without content, this circuit shows systems going dark one by one. The power runs out. The beacon fades. Silence.

**Connection to v1.29:** Ranger 4's circuit was a dead carrier — signal without content. Ranger 5's circuit is content without power — instruments that work but cannot run.

**Radio series connection:** The AM detector stage (v1.30) pairs with this circuit — the detector extracts signal from carrier, while the power failure circuit shows what happens when there's no power to generate either.
