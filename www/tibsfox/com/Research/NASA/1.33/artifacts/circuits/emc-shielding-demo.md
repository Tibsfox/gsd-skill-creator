# Circuit: EMC Shielding Demonstrator

## Ranger 6 Camera Failure — The Fix That Was Missing

**Budget:** $12
**Difficulty:** Beginner
**Time:** 1-2 hours
**Mission:** 1.33 — Ranger 6 (Atlas-Agena B)

---

## What This Circuit Does

Demonstrates electromagnetic coupling and shielding using two parallel signal paths:

1. **Unshielded wire** picks up transient interference from a relay coil (simulating the Atlas staging transient)
2. **Shielded wire** (coaxial or twisted pair with ground) rejects the same transient

LED indicators show the difference: LED 1 (unshielded) flickers during relay firing; LED 2 (shielded) stays steady.

This is the principle that was missing on Ranger 6 and added for Ranger 7.

---

## Parts List

| Component | Qty | Cost | Notes |
|-----------|-----|------|-------|
| 5V relay (SPDT) | 1 | $2 | The transient source (simulates Atlas staging) |
| 555 timer IC | 1 | $1 | Drives the relay at ~1 Hz |
| LED (red) | 1 | $0.10 | Unshielded indicator (flickers = interference) |
| LED (green) | 1 | $0.10 | Shielded indicator (steady = protected) |
| 330Ω resistors | 2 | $0.20 | LED current limiters |
| 10kΩ resistor | 1 | $0.10 | 555 timing |
| 100μF capacitor | 1 | $0.30 | 555 timing |
| 0.1μF capacitor | 1 | $0.10 | 555 bypass |
| 1N4001 diode | 1 | $0.10 | Relay flyback protection |
| Hookup wire (unshielded) | 30cm | $0.50 | Signal path 1 |
| Shielded cable (coax or STP) | 30cm | $2 | Signal path 2 |
| Breadboard | 1 | $3 | |
| 9V battery + clip | 1 | $2 | Power |
| **TOTAL** | | **~$12** | |

---

## Schematic

```
                    9V
                     │
                     ├──── 555 Timer ──── Relay Coil
                     │                      │
                     │                    [Flyback diode]
                     │
    ┌────────────────┼────────────────┐
    │                │                │
  [Unshielded     [Shielded        [Signal
   wire 30cm]      cable 30cm]     source: 
    │                │              3.3V from
    │                │              voltage 
    │                │              divider]
    ▼                ▼
  LED (red)        LED (green)
  + 330Ω           + 330Ω
    │                │
   GND              GND
```

Both wires run PARALLEL to the relay coil (within 2 cm) for maximum coupling to the unshielded path.

---

## How It Works

1. The 555 timer fires the relay at approximately 1 Hz
2. Each relay switching event creates an electromagnetic transient (like Atlas staging)
3. The unshielded wire picks up the transient → red LED flickers
4. The shielded cable rejects the transient → green LED stays steady
5. **Move the wires closer to or farther from the relay to vary coupling**

---

## The Ranger 6 Connection

On Ranger 6, the camera power bus was the "unshielded wire" — it ran near the pyrotechnic firing circuits without adequate electromagnetic isolation. The staging transient coupled into the camera bus exactly like the relay transient couples into the unshielded wire in this circuit.

For Ranger 7, the camera power bus was redesigned with proper shielding and isolation — the "shielded cable" path. The cameras survived. 4,316 photographs were returned.

This $12 circuit demonstrates the principle that cost NASA $170 million and six failed Ranger missions to learn.

---

## Extensions

- **Add an oscilloscope** to see the transient waveform on both paths
- **Try different shielding:** aluminum foil wrap vs. coaxial cable vs. twisted pair
- **Measure attenuation:** how many dB of transient rejection does each shielding method provide?
- **Add a ferrite bead** on the unshielded wire — does it help? (This is an LC filter approach, connecting to the radio series filter stage)
