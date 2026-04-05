# Circuit: Range Safety Deviation Indicator

## Mission 1.31 — Mariner 1 (Atlas-Agena B)

**Cost:** ~$18
**Difficulty:** Beginner-Intermediate
**Time:** 2-3 hours
**Purpose:** Visual display of trajectory deviation with destruct threshold

---

## What This Circuit Does

An LED bar graph displays the vehicle's lateral deviation from the planned trajectory. A potentiometer simulates the deviation growing over time (as Mariner 1's guidance oscillations amplified). When the deviation exceeds the destruct threshold, a red LED and buzzer activate — representing Range Safety Officer Broadbent's destruct command at T+293 seconds.

---

## Bill of Materials

| Component | Value | Cost |
|-----------|-------|------|
| Arduino Nano | ATmega328P | $8.00 |
| 10-segment LED bar | common cathode | $2.00 |
| Potentiometer | 10 kΩ | $1.00 |
| Piezo buzzer | 5V active | $1.00 |
| Resistors | 220Ω x10 | $0.50 |
| Red LED | 5mm (destruct indicator) | $0.10 |
| Breadboard + wires | | $5.00 |
| **Total** | | **~$18** |

---

## Operation

1. Turn potentiometer slowly clockwise (increasing deviation)
2. Green LEDs light sequentially (vehicle drifting but within limits)
3. Yellow LEDs light (approaching destruct limit)
4. Red LED + buzzer activate (DESTRUCT — deviation exceeded threshold)
5. Display freezes for 3 seconds showing "RANGE SAFETY — T+293"

The potentiometer represents the amplifying oscillations from the missing overbar. As the guidance error grows, the vehicle deviates further. At the destruct limit, Broadbent's decision is automatic — the math says destroy.

---

## The Lesson

The student physically turns the knob and feels the moment when the deviation crosses the threshold. That moment — the red LED, the buzzer — is T+293 seconds. The decision is binary: below the threshold, the mission might recover; above it, the mission must be destroyed to protect populated areas. Jack Broadbent had less than a second to make this decision for real. The Arduino makes it with zero delay.
