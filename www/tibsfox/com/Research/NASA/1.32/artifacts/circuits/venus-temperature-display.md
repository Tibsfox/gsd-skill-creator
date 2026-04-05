# DIY Circuit: Venus Temperature Comparison Display

## The Circuit

An Arduino-based display that continuously reads room temperature and shows the Venus comparison. An RGB LED shifts from blue (room temp) through yellow to deep red (Venus equivalent). The OLED shows both temperatures, the greenhouse multiplier, and a "Mariner 2 measured this" annotation. A potentiometer simulates increasing greenhouse intensity.

**What it does:**
- Thermistor reads real room temperature
- OLED displays: room temp, Venus temp (460°C), and ratio
- RGB LED color-codes the "greenhouse scale"
- Potentiometer scales temperature display from Earth greenhouse (+33°C) to Venus greenhouse (+506°C)
- At maximum setting: LED deep red, display shows "VENUS — 460°C — MARINER 2, DEC 14, 1962"

**Total cost: ~$20**

---

## Schematic

```
  +5V ────────┬──────────────┬──────────────┐
              │              │              │
           [10K NTC]      [10K POT]      [OLED SDA/SCL]
              │              │              │
  A0 ─────── ┤              │        Arduino Nano
              │         A1 ──┘              │
           [10K R]                    [RGB LED]
              │                      R→D9 G→D10 B→D11
  GND ────────┴──────────────────────────────┘
```

## Key Learning Moment

The student sees their room at 22°C and Venus at 460°C on the same display. The ratio — roughly 20x the absolute temperature — makes the greenhouse effect tangible. Turning the potentiometer from "Earth greenhouse" to "Venus greenhouse" and watching the LED shift from comfortable blue through warning yellow to furnace red is the lesson that Mariner 2 taught the world.
