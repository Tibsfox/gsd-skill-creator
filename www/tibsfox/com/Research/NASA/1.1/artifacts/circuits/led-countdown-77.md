# DIY LED Circuit: Pioneer 0 Launch Countdown (77 Seconds)

## The Circuit

A standalone electronic circuit that replays Pioneer 0's 77-second flight using 10 LEDs. No microcontroller needed -- pure analog/digital logic with a 555 timer and CD4017 decade counter.

**What it does:**
- Press the launch button
- 10 LEDs light up sequentially over ~70 seconds (7 seconds per LED)
- Each LED represents ~7.7 seconds of flight / ~1.6 km of altitude
- At the end: all LEDs flash rapidly for 3 seconds (explosion)
- Then all LEDs go dark (silence)

**Total cost: ~$12-15**

---

## Schematic

```
                    +9V
                     |
                     R1 (10K)
                     |
              +------+------+
              |             |
           LAUNCH         +---+
           BUTTON         | 555 |
              |           |     |
              +--[pin 2]  | CLK |---[pin 3]---> CD4017 pin 14 (CLK)
              |           +-----+
              |              |
             GND           +---+
                           |   |
                          R2  C1
                         100K  10uF
                           |   |
                           +---+
                             |
                            GND

CD4017 Decade Counter:
  pin 16 (VDD) --> +9V
  pin 8  (VSS) --> GND
  pin 13 (EN)  --> GND (always enabled)
  pin 15 (RST) --> pin 11 (Q5+6 carry) via R3 (optional, for auto-reset)
  pin 14 (CLK) --> 555 output

  Outputs (each drives one LED through a 470Ω resistor):
  pin 3  (Q0) --> R4 (470Ω) --> LED1 (green)   [T+0 to T+7.7]
  pin 2  (Q1) --> R5 (470Ω) --> LED2 (green)   [T+7.7 to T+15.4]
  pin 4  (Q2) --> R6 (470Ω) --> LED3 (green)   [T+15.4 to T+23.1]
  pin 7  (Q3) --> R7 (470Ω) --> LED4 (green)   [T+23.1 to T+30.8]
  pin 10 (Q4) --> R8 (470Ω) --> LED5 (yellow)  [T+30.8 to T+38.5]
  pin 1  (Q5) --> R9 (470Ω) --> LED6 (yellow)  [T+38.5 to T+46.2]
  pin 5  (Q6) --> R10(470Ω) --> LED7 (yellow)  [T+46.2 to T+53.9]
  pin 6  (Q7) --> R11(470Ω) --> LED8 (orange)  [T+53.9 to T+61.6]
  pin 9  (Q8) --> R12(470Ω) --> LED9 (orange)  [T+61.6 to T+69.3]
  pin 11 (Q9) --> R13(470Ω) --> LED10 (red)    [T+69.3 to T+77]

  Q9 also triggers the "explosion" flasher:
  pin 11 (Q9) --> second 555 in astable mode --> all LEDs flash
```

## 555 Timer Configuration

The 555 runs in **astable mode** to generate clock pulses:

```
Frequency = 1.44 / ((R1 + 2*R2) * C1)

For 7.7-second intervals (0.13 Hz):
  R1 = 10KΩ
  R2 = 100KΩ (use 50KΩ + 50KΩ trimpot for calibration)
  C1 = 47µF electrolytic

  f = 1.44 / ((10000 + 200000) * 0.000047) = 0.146 Hz ≈ 6.85 seconds
  Adjust R2 trimpot to hit exactly 7.7 seconds per step
```

## Explosion Flasher (Second 555)

A second 555 timer in astable mode, triggered by Q9, oscillates at ~5 Hz to flash all LEDs rapidly:

```
  R_flash1 = 1KΩ
  R_flash2 = 10KΩ
  C_flash  = 10µF

  f = 1.44 / ((1000 + 20000) * 0.00001) = 6.9 Hz

  Q9 output enables this 555 (pin 4 RESET)
  Output drives all 10 LED cathodes through a common transistor (2N2222)
  Duration: ~3 seconds (use RC delay on reset pin to auto-stop)
```

## Parts List

| Part | Value | Qty | Cost |
|------|-------|-----|------|
| 555 Timer IC (NE555) | - | 2 | $0.50 |
| CD4017 Decade Counter | - | 1 | $0.60 |
| LED (green, 5mm) | - | 4 | $0.40 |
| LED (yellow, 5mm) | - | 3 | $0.30 |
| LED (orange, 5mm) | - | 2 | $0.20 |
| LED (red, 5mm) | - | 1 | $0.10 |
| Resistor 470Ω | 1/4W | 10 | $0.50 |
| Resistor 10KΩ | 1/4W | 2 | $0.10 |
| Resistor 100KΩ (or 50K trimpot + 50K fixed) | 1/4W | 1 | $0.30 |
| Resistor 1KΩ | 1/4W | 1 | $0.05 |
| Capacitor 47µF electrolytic | 16V | 1 | $0.15 |
| Capacitor 10µF electrolytic | 16V | 1 | $0.10 |
| 2N2222 NPN transistor | - | 1 | $0.10 |
| Pushbutton (momentary) | - | 1 | $0.25 |
| 9V battery snap | - | 1 | $0.20 |
| 9V battery | - | 1 | $3.00 |
| Breadboard (half-size) | - | 1 | $3.50 |
| Jumper wire kit | - | 1 | $2.50 |
| **Total** | | | **~$13** |

## Build Notes

1. **Start with the clock 555.** Wire it up alone and verify the output frequency with an LED. Each blink should be ~7.7 seconds apart. Adjust the trimpot until it's right.

2. **Add the CD4017.** Connect the clock output to pin 14. The outputs should light LEDs one at a time in sequence.

3. **Add the explosion flasher.** Wire the second 555 to activate only when Q9 goes high. All 10 LEDs should flash rapidly for a few seconds.

4. **Calibrate.** The total sequence from button press to explosion should be approximately 77 seconds (10 steps x 7.7 seconds). Use a stopwatch. Adjust R2 trimpot.

## What You Learn

- **555 timer astable operation** -- the most versatile analog IC ever made (same building where Foxy worked at Philips Semiconductor, Wolf Road, where the 555 was designed)
- **Decade counter logic** -- how digital counting works without a microcontroller
- **LED current limiting** -- why you need those 470Ω resistors (Ohm's law in practice)
- **Timing circuits** -- the RC time constant governs everything in analog electronics
- **The 77 seconds** -- you sit there watching LEDs tick off the altitude markers, and when the red LED hits and everything flashes, you feel the failure in real time

## Fox Companies Connection

Home electronics education service. This is a $13 kit that teaches 555 timers, decade counters, and LED circuits. Pack 10 kits at $25 each = $120 revenue per workshop, $130 profit minus materials. Each subsequent NASA mission adds a new circuit design. After 20 missions, you have a catalog of 20 buildable kits. Monthly subscription: $25/month, new kit + instruction sheet mailed.
