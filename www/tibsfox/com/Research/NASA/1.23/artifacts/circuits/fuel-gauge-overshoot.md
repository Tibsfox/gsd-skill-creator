# Circuit: Aurora 7 Fuel Gauge with Overshoot Warning

## Mission 1.23 — Mercury-Atlas 7 / Aurora 7

**Cost:** ~$25
**Difficulty:** Beginner-Intermediate
**Build Time:** 3-4 hours

---

## Overview

A physical simulation of Aurora 7's fuel depletion crisis. An Arduino drives an OLED display and 8-LED bar graph that track fuel remaining as the user "performs" science observations by pressing a button. Each press costs fuel. The display shows:

- Current fuel percentage
- Mission elapsed time (simulated)
- Overshoot distance (calculated from remaining fuel at retrofire)
- Warning states: NOMINAL → CAUTION → CRITICAL → OVERSHOOT PROBABLE

## Bill of Materials

| Component | Qty | Cost |
|-----------|-----|------|
| Arduino Nano | 1 | $8 |
| SSD1306 OLED 128×64 (I2C) | 1 | $8 |
| LED (green × 4, yellow × 2, red × 2) | 8 | $2 |
| 220Ω resistors | 8 | $1 |
| Pushbutton (science observation) | 1 | $0.50 |
| Piezo buzzer | 1 | $1 |
| Potentiometer 10K (yaw angle) | 1 | $1 |
| Breadboard + jumper wires | 1 set | $5 |
| **Total** | | **~$26.50** |

## Wiring

```
Arduino Nano Connections:
  D2  → Pushbutton (science observation, other leg to GND)
  D3  → LED 1 (green) via 220Ω
  D4  → LED 2 (green) via 220Ω
  D5  → LED 3 (green) via 220Ω
  D6  → LED 4 (green) via 220Ω
  D7  → LED 5 (yellow) via 220Ω
  D8  → LED 6 (yellow) via 220Ω
  D9  → LED 7 (red) via 220Ω
  D10 → LED 8 (red) via 220Ω
  D11 → Piezo buzzer (other leg to GND)
  A0  → Potentiometer wiper (yaw angle: 0-45°)
  A4  → OLED SDA
  A5  → OLED SCL
  5V  → OLED VCC, pot high side
  GND → OLED GND, pot low side, button, buzzer, LED cathodes
```

## Software Logic

```
INITIALIZATION:
  fuel = 100%
  orbit = 1
  science_count = 0

MAIN LOOP:
  if button_pressed:
    fuel -= random(3, 8)    // Each observation costs 3-8% fuel
    science_count += 1

  // Automatic fuel drain (station-keeping)
  fuel -= 0.02 per second

  // LED bar: proportional to fuel
  leds_on = floor(fuel / 12.5)  // 8 LEDs, 100/8 = 12.5% each

  // OLED display
  line1: "AURORA 7 FUEL: XX%"
  line2: "ORBIT: X  SCIENCE: XX"
  line3: status_message
  line4: "EST. OVERSHOOT: XXX km"

  // Status logic
  if fuel > 55: status = "NOMINAL"
  if fuel 25-55: status = "CAUTION"; buzzer_beep(1Hz)
  if fuel 15-25: status = "CRITICAL"; buzzer_beep(4Hz)
  if fuel < 15: status = "OVERSHOOT PROBABLE"; buzzer_continuous

  // Overshoot calculation
  yaw_degrees = map(potentiometer, 0, 1023, 0, 45)
  fuel_deficit_factor = max(0, (55 - fuel) / 55)  // How much below ideal
  estimated_yaw = yaw_degrees * fuel_deficit_factor
  dv_deficit = 152 * (1 - cos(estimated_yaw * PI / 180))
  overshoot_km = 25 * dv_deficit + 23  // 23 km base from timing delay

  // At retrofire (fuel reaches retrofire threshold or timer expires)
  display "RETROFIRE" sequence
  display final overshoot
  compare to 402 km (Carpenter's actual)
```

## The Learning Moment

The student discovers that the first few science observations feel free — fuel is high, the bar is full, the display says NOMINAL. But after observation 5 or 6, CAUTION appears. By observation 8-10, the display shows CRITICAL and the overshoot estimate is climbing. The student can stop pressing the button at any time — but the observations are "interesting" and the consequences feel abstract until retrofire arrives.

This is Carpenter's dilemma in miniature. The fuel gauge makes the trade-off physical: you watch the LEDs go dark, one by one, as you press the button, and the overshoot number climbs.

---

*"Every button press is an observation. Every observation costs fuel. The cost is invisible until retrofire, and then it is 402 kilometers."*
