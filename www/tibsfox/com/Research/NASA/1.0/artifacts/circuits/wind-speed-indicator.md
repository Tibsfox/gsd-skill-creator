# DIY Analog Circuit: Wind Speed Indicator

## The Circuit

A purely analog wind speed indicator using a DC motor as a generator (anemometer), an op-amp comparator chain, and a 10-segment LED bar graph. No microcontroller. The wind spins the cups, the motor generates voltage proportional to speed, the LEDs light up progressively.

**Total cost: ~$15**

---

## Schematic

```
         ANEMOMETER (DC motor as generator)
              |
              | (0-5V proportional to wind speed)
              |
         [10KΩ trimpot] --- calibration
              |
              +----> LM3914 Dot/Bar Display Driver
              |        |
              |      [pin 5] SIGNAL IN
              |      [pin 6] REF LOW (GND)
              |      [pin 7] REF HIGH (5V via trimpot)
              |      [pin 9] MODE (bar: connect to pin 3)
              |
              |      Outputs (pins 1, 18, 17, 16, 15, 14, 13, 12, 11, 10):
              |        |   |   |   |   |   |   |   |   |   |
              |       LED LED LED LED LED LED LED LED LED LED
              |       grn grn grn grn ylw ylw ylw org org red
              |        |   |   |   |   |   |   |   |   |   |
              |       GND GND GND GND GND GND GND GND GND GND
              |
             +9V ---- [pin 3] V+
             GND ---- [pin 2] V-

The LM3914 does all the work: it divides the input voltage
range into 10 equal steps and lights LEDs accordingly.
No code. No clock. No digital anything.
```

## Parts List

| Part | Value | Qty | Cost |
|------|-------|-----|------|
| LM3914 Dot/Bar Display Driver IC | - | 1 | $3.00 |
| Small DC motor (anemometer) | 3-6V | 1 | $2.00 |
| LED (green, 5mm) | - | 4 | $0.40 |
| LED (yellow, 5mm) | - | 3 | $0.30 |
| LED (orange, 5mm) | - | 2 | $0.20 |
| LED (red, 5mm) | - | 1 | $0.10 |
| 10KΩ trimpot | - | 2 | $0.60 |
| Ping-pong balls (for cups) | - | 3 | $1.00 |
| Wooden dowel + hot glue | - | 1 | $1.00 |
| 9V battery + snap | - | 1 | $3.20 |
| Breadboard | half-size | 1 | $3.50 |
| **Total** | | | **~$15** |

## What You Learn

- **The LM3914** is the analog equivalent of a digital display driver — it divides a voltage range into steps using a resistor ladder. No clock, no code, no firmware. Pure analog signal processing.
- **DC motor as generator** — every motor is also a generator. Spin the shaft and it produces voltage. The anemometer IS a generator. This is the principle behind wind farms, hydroelectric dams, and regenerative braking.
- **Calibration** — the trimpot adjusts the full-scale reading. You hold the anemometer out a car window at a known speed and adjust until the LED bar reads correctly. This is exactly how NACA calibrated wind tunnel instruments.

## Fox Companies Connection

Weather monitoring products. This $15 circuit becomes a visual wind indicator for sailboats, farms, outdoor events. Mount it at the entrance to a farmers market to show wind conditions. Sell assembled units for $40-60.
