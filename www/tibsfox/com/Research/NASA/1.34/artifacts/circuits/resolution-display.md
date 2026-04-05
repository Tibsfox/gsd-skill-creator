# Circuit: Resolution Display

## Ranger 7 Altitude-to-Resolution Mapper

**Cost:** ~$25
**Difficulty:** Beginner-Intermediate
**Connection:** Demonstrates the linear relationship between altitude and image resolution (GSD = h × d_pixel / f)

### Components

| Component | Qty | Cost |
|-----------|-----|------|
| Arduino Nano | 1 | $8 |
| HC-SR04 Ultrasonic sensor | 1 | $3 |
| SSD1306 OLED 128x64 | 1 | $8 |
| 8x LED bar graph | 1 | $2 |
| 8x 220-ohm resistors | 8 | $1 |
| Breadboard + wires | 1 | $5 |

### How It Works

The ultrasonic sensor measures distance to a surface (table, wall, floor). The Arduino maps this distance to Ranger 7's altitude scale (1 cm = 100 km). The OLED displays the equivalent altitude, camera resolution (GSD), and estimated number of visible craters. The LED bar graph shows image quality — all LEDs lit at close range (high resolution), progressively dimming with distance.

### The Imaging Equation

```
GSD = h × d_pixel / f

For Ranger 7 P-channel telephoto:
  f = 76 mm, d_pixel = 36.7 μm
  GSD = h × 4.82 × 10^(-4)

At 5 cm sensor distance → 500 km equivalent → GSD = 241 m
At 21 cm sensor distance → 2,110 km equivalent → GSD = 1,017 m (first frame)
At 0.05 cm sensor distance → 5 km equivalent → GSD = 2.4 m (near-final)
```

### OLED Display Layout

```
┌──────────────────────────┐
│ RANGER 7 DESCENT CAMERA  │
│ Altitude: 500 km         │
│ Resolution: 241 m/pixel  │
│ Craters visible: ~17/km² │
│ ▓▓▓▓▓░░░ IMAGING         │
└──────────────────────────┘
```
