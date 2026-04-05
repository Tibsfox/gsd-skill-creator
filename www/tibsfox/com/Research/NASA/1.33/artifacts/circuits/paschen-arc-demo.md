# Circuit: Paschen Arc Demonstrator

## The Physics That Killed Ranger 6's Cameras

**Budget:** $8
**Difficulty:** Beginner (supervision recommended — involves high voltage from piezo)
**Time:** 30 minutes
**Mission:** 1.33 — Ranger 6 (Atlas-Agena B)

---

## What This Circuit Does

Demonstrates the Paschen minimum — the pressure at which gas breaks down (arcs) at the lowest voltage — using a piezoelectric igniter from a gas grill lighter mounted in a sealed jar with a hand pump for partial evacuation.

- **At atmospheric pressure (760 torr):** Piezo cannot arc across a 1-cm gap
- **At reduced pressure (~1-10 torr):** Piezo arcs easily across the same gap
- **At near-vacuum:** Arcing stops again (no gas to ionize)

The U-shaped Paschen curve, demonstrated physically.

---

## Parts List

| Component | Qty | Cost | Notes |
|-----------|-----|------|-------|
| Piezoelectric igniter | 1 | $3 | From gas grill lighter (generates ~15 kV pulse) |
| Mason jar (wide mouth) | 1 | $2 | The vacuum chamber |
| Two nails or screws | 2 | $0.50 | Electrodes (inserted through jar lid) |
| Silicone sealant | 1 | $1 | Seal the electrode penetrations |
| Hand pump (bicycle tire) | 1 | $0 | For partial evacuation (if available) |
| Rubber tubing | 30cm | $1 | Connects pump to jar |
| Valve/clamp | 1 | $0.50 | Seals the jar after pumping |
| **TOTAL** | | **~$8** | |

---

## Assembly

1. Drill two holes in the mason jar lid, 1 cm apart
2. Insert nails through the holes (tips facing inward, 1 cm gap between tips)
3. Seal around nails with silicone sealant — must be airtight
4. Drill a third hole for the rubber tubing to the hand pump
5. Seal the tubing connection with silicone
6. Connect the piezo igniter leads to the two nail heads outside the jar
7. Screw the lid on tightly

---

## The Experiment

### Step 1: Atmospheric Pressure (760 torr)
- Jar is open/unsealed, at room pressure
- Click the piezo igniter
- **Result:** No visible arc across the 1-cm gap
- The air at 760 torr requires >30,000 V to break down at 1 cm
- The piezo generates ~15 kV — not enough

### Step 2: Reduced Pressure (pump out some air)
- Seal the jar, pump out air with the hand pump (10-20 strokes)
- The pressure drops to perhaps 50-200 torr (hard to measure without a gauge)
- Click the piezo igniter
- **Result:** Visible arc! Purple/blue spark jumps between nail tips
- At reduced pressure, breakdown voltage drops — 15 kV is now sufficient

### Step 3: Further Evacuation
- Continue pumping (the hand pump will struggle as pressure drops)
- At some point, the arcs become fainter, then stop
- **Result:** At very low pressure, too few gas molecules to sustain the arc
- This is the right side of the Paschen curve — vacuum safety

---

## The Ranger 6 Connection

Ranger 6's cameras operated at >10,000 V internally. At sea level, this was safe — the air could hold off the voltage. In hard vacuum (their intended operating environment), it was also safe — no gas to ionize.

But at 90 km altitude, inside the launch shroud, the pressure was at the Paschen minimum. When the staging transient briefly energized the cameras, the 10,000 V met gas at its most vulnerable. The arc was inevitable and instantaneous.

This $8 jar demonstrates exactly why six cameras died.

---

## Safety Notes

- The piezo igniter generates ~15,000 V but very low current — the shock is startling but not dangerous
- Do not use any other high-voltage source — the piezo is safe because of its extremely low energy
- Supervise younger experimenters
- The jar should be sturdy (mason jar) — do not use thin glass
- If the jar cannot be evacuated sufficiently with a hand pump, the arc may not visually demonstrate the minimum, but the concept is still teachable
