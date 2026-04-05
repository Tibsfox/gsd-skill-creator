# Circuit: Propellant Settling Demonstration
## Mission 1.26 — Ranger 1

### Overview
A simple circuit using a tilt switch (mercury or ball-type) to demonstrate the propellant management problem that killed Ranger 1. When the breadboard is tilted (gravity present = propellant settled), a green LED lights and a buzzer sounds (engine restart). When level or inverted (zero gravity = propellant unsettled), a red LED lights (no restart). Simulates the Agena A's inability to restart in zero gravity.

### Bill of Materials (~$8)

| Qty | Component | Value | Cost |
|-----|-----------|-------|------|
| 1 | Tilt switch | SW-520D ball tilt | $0.50 |
| 1 | LED | Green (restart OK) | $0.15 |
| 1 | LED | Red (restart FAIL) | $0.15 |
| 2 | Resistors | 220Ω | $0.10 |
| 1 | Piezo buzzer | 5V active | $0.50 |
| 1 | NPN transistor | 2N2222 | $0.25 |
| 1 | Resistor | 10KΩ (pull-up) | $0.05 |
| 1 | Breadboard | mini | $2.00 |
| 1 | Battery | 9V + clip | $2.00 |
| -- | Jumper wires | assorted | $1.00 |

### How It Works

1. **Tilt switch upright** (gravity pulls ball to close contact):
   - Circuit closed → transistor conducts
   - Green LED ON → "Propellant settled"
   - Buzzer sounds → "Engine restart successful"
   - This represents the Agena during powered flight

2. **Tilt switch horizontal/inverted** (ball rolls away from contact):
   - Circuit open → transistor off
   - Red LED ON (through pull-up) → "Propellant floating"
   - Buzzer silent → "No restart"
   - This represents the Agena in zero-gravity parking orbit

### The Lesson

Hold the breadboard upright: green light, buzzer. This is the Agena during the first burn — gravity holds the propellant at the bottom of the tanks, the engine fires normally.

Now lay the breadboard flat (simulating zero gravity in the parking orbit): red light, silence. The propellant floats. The engine cannot fire.

Tilt it slightly (simulating the ullage motors): the switch flickers between states. The ullage motors on Agena A were not strong enough to reliably settle the propellants. The engine restart was a coin flip that came up "no."

### Connection to Opuntia fragilis

The tilt switch is binary: propellant settled or not. Opuntia fragilis pads are similarly binary at their joints: attached or detached. Both systems have a threshold. The Agena needed gravity above a threshold to settle propellant. The cactus pad detaches when lateral force exceeds the joint strength. In both cases, the threshold determines whether the system functions (engine restart / intact plant) or fragments (no restart / pad dispersal).
