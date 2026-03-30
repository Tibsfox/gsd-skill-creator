# DIY LED Circuit: Particle Trap — Electrons Bouncing Between Mirror Points

## The Circuit

A standalone electronic circuit showing charged particles trapped in Earth's magnetic field, bouncing between mirror points near the poles. Two clusters of LEDs at the ends represent the polar mirror points. A sequence of "chasing" LEDs bounces back and forth between them, with brightness encoding pitch angle — dim near the equator (small pitch angle, fast travel), bright at the mirror points (large pitch angle, particle slowing and reversing). The bouncing pattern repeats, gradually fading to simulate radiation belt decay after the Argus detonations.

**What it does:**
- Power on: a single "particle" LED chases back and forth along a strip of 16 WS2812 addressable LEDs
- The particle bounces between LED 1 (south mirror point) and LED 16 (north mirror point)
- Brightness increases as the particle approaches either end (mirror point effect)
- Color shifts from aurora green at the equator (LED 8-9) to radiation amber at the mirror points
- Speed increases at the equatorial plane (particle moves fastest at minimum B-field)
- After ~30 bounces, brightness gradually fades — the artificial belt is decaying
- Press the INJECT button to simulate a new Argus detonation: all LEDs flash white, then a fresh particle begins bouncing

**The lesson:** Charged particles in a dipole magnetic field spiral along field lines. As the field strengthens near the poles, the particle's pitch angle increases until it reaches 90 degrees — the mirror point — and reverses. The particle bounces indefinitely between two mirror points, trapped. The only escape is through the loss cone: if the mirror point is inside the atmosphere, the particle collides with air molecules and is lost. This is how the natural Van Allen belts work, and this is exactly what Christofilos predicted the Argus detonations would create artificially.

**Total cost: ~$15**

---

## Hardware

```
Arduino Nano
     |
     D6 ---------> WS2812B LED Strip (16 LEDs)
     |                  |
     D2 <--- INJECT Button (pull-up, active LOW)
     |
    +5V ---------> Strip VCC
    GND ---------> Strip GND
                   (add 100 uF cap across VCC/GND at strip)
                   (add 470R resistor on data line D6→DIN)

PHYSICAL LAYOUT (vertical, representing magnetic field line):

    LED 16  (NORTH MIRROR POINT) — amber at reversal
    LED 15  — transition
    LED 14  — transition
    LED 13  — green, faster
    LED 12  — green, faster
    LED 11  — green, fast
    LED 10  — green, fast
    LED  9  — EQUATOR (brightest green, fastest)
    LED  8  — EQUATOR
    LED  7  — green, fast
    LED  6  — green, fast
    LED  5  — green, faster
    LED  4  — green, faster
    LED  3  — transition
    LED  2  — transition
    LED  1  (SOUTH MIRROR POINT) — amber at reversal
```

## Arduino Code (Sketch)

```cpp
#include <Adafruit_NeoPixel.h>

#define LED_PIN     6
#define NUM_LEDS    16
#define INJECT_PIN  2

Adafruit_NeoPixel strip(NUM_LEDS, LED_PIN, NEO_GRB + NEO_KHZ800);

// Particle state
float pos = 0.0;        // 0.0 = south mirror, 15.0 = north mirror
float vel = 0.3;        // LEDs per frame (positive = northward)
int bounce_count = 0;
float decay = 1.0;      // brightness multiplier, decreases with bounces
bool flash_active = false;
int flash_frames = 0;

// Color definitions
// Aurora green (equator):   R=64, G=255, B=128
// Radiation amber (mirror): R=212, G=168, B=48
// Nuclear white (flash):    R=255, G=255, B=255

void setup() {
  strip.begin();
  strip.setBrightness(80);
  strip.show();
  pinMode(INJECT_PIN, INPUT_PULLUP);
}

// Compute speed: fastest at equator (pos=7.5), slowest at mirrors
float getSpeed(float p) {
  float dist_from_equator = abs(p - 7.5) / 7.5; // 0 at equator, 1 at mirror
  // Speed: fast at equator, slow at mirrors (magnetic mirror effect)
  float base_speed = 0.6 - 0.45 * dist_from_equator;
  return max(base_speed, 0.08);
}

// Compute brightness: bright at mirrors (pitch angle → 90°), dimmer at equator
uint8_t getBrightness(float p) {
  float dist_from_equator = abs(p - 7.5) / 7.5;
  // Brightness: higher at mirror points (particle bunches up)
  float bright = 0.4 + 0.6 * dist_from_equator;
  return (uint8_t)(bright * 255 * decay);
}

// Compute color: green at equator, amber at mirrors
void getColor(float p, uint8_t brightness, uint8_t *r, uint8_t *g, uint8_t *b) {
  float dist_from_equator = abs(p - 7.5) / 7.5;
  float t = dist_from_equator; // 0=equator(green), 1=mirror(amber)
  *r = (uint8_t)(( 64 + (212 -  64) * t) * brightness / 255);
  *g = (uint8_t)((255 + (168 - 255) * t) * brightness / 255);
  *b = (uint8_t)((128 + ( 48 - 128) * t) * brightness / 255);
}

void loop() {
  // Check inject button
  if (digitalRead(INJECT_PIN) == LOW) {
    flash_active = true;
    flash_frames = 15;  // ~250ms at 60fps
    bounce_count = 0;
    decay = 1.0;
    pos = 8.0;          // inject at equator
    vel = 0.5;
  }

  // Nuclear flash
  if (flash_active) {
    for (int i = 0; i < NUM_LEDS; i++) {
      uint8_t w = (uint8_t)(255 * flash_frames / 15);
      strip.setPixelColor(i, strip.Color(w, w, w));
    }
    strip.show();
    flash_frames--;
    if (flash_frames <= 0) flash_active = false;
    delay(16);
    return;
  }

  // Clear strip
  for (int i = 0; i < NUM_LEDS; i++) {
    strip.setPixelColor(i, 0);
  }

  // Update position
  float speed = getSpeed(pos);
  pos += vel * (vel > 0 ? speed / 0.3 : speed / 0.3);

  // Mirror point reflection
  if (pos >= 15.5) {
    pos = 15.5 - (pos - 15.5);
    vel = -vel;
    bounce_count++;
    decay = max(0.05, 1.0 - bounce_count * 0.03);
  }
  if (pos <= 0.5) {
    pos = 0.5 + (0.5 - pos);
    vel = -vel;
    bounce_count++;
    decay = max(0.05, 1.0 - bounce_count * 0.03);
  }

  // Draw particle (2 LEDs wide for smoothness)
  int led_idx = (int)pos;
  float frac = pos - led_idx;

  if (led_idx >= 0 && led_idx < NUM_LEDS) {
    uint8_t bright = getBrightness(pos);
    uint8_t r, g, b;
    getColor(pos, bright, &r, &g, &b);
    strip.setPixelColor(led_idx, strip.Color(
      (uint8_t)(r * (1.0 - frac)),
      (uint8_t)(g * (1.0 - frac)),
      (uint8_t)(b * (1.0 - frac))
    ));
    if (led_idx + 1 < NUM_LEDS) {
      strip.setPixelColor(led_idx + 1, strip.Color(
        (uint8_t)(r * frac),
        (uint8_t)(g * frac),
        (uint8_t)(b * frac)
      ));
    }
  }

  strip.show();
  delay(16);  // ~60 fps
}
```

## Bill of Materials

| Qty | Component | Value/Type | Purpose | Cost |
|-----|-----------|------------|---------|------|
| 1 | Arduino Nano | ATmega328P | Controller | $4.00 |
| 1 | WS2812B Strip | 16 LEDs, 60/m | Particle display | $3.00 |
| 1 | Push button | Momentary NO | Inject (detonation) | $0.30 |
| 1 | Resistor | 470R, 1/4W | Data line protection | $0.02 |
| 1 | Capacitor | 100 uF, 16V electrolytic | Power smoothing | $0.10 |
| 1 | USB cable | Mini-B | Power + programming | $1.50 |
| 1 | Breadboard | Half-size | Assembly | $3.00 |
| 1 | Wire kit | 22 AWG solid | Connections | $2.00 |
| | | | **Total** | **~$13.92** |

*(Add USB power bank for portable operation: ~$5-8)*

## Build Notes

1. **Start with the LED strip.** Connect VCC, GND, and DIN (through 470R) to Arduino. Upload a simple NeoPixel test to verify all 16 LEDs light up.

2. **Add the particle bounce.** Upload the sketch above. You should see a green dot bouncing back and forth, changing color and speed. The equatorial region (middle LEDs) should show fast-moving green. The mirror points (ends) should show slow amber.

3. **Add the inject button.** Wire a momentary button between D2 and GND (internal pullup used). Press it — all LEDs should flash white (nuclear detonation), then a fresh particle starts bouncing at full brightness.

4. **Watch the decay.** After ~30 bounces, the brightness fades to near-zero. This represents the artificial radiation belt losing particles through atmospheric collisions and pitch-angle scattering. Press INJECT again for a new detonation.

5. **Three detonations.** For the full Argus experience, press INJECT three times with 10-second gaps. Watch three separate injection-decay cycles, like the three Argus tests (Aug 27, Aug 30, Sep 6, 1958).

## The Physics

The magnetic mirror effect is the core of radiation belt physics. Earth's magnetic field is approximately dipolar — strongest near the poles, weakest at the equatorial plane. A charged particle spiraling along a field line has two components of motion: parallel to the field (along the line) and perpendicular (gyration around the line). The ratio of perpendicular to total velocity is the pitch angle.

As the particle moves toward a pole, the field strength increases. Conservation of the first adiabatic invariant (the magnetic moment mu = mv_perp^2 / 2B) requires that v_perp increases as B increases. Since total energy is conserved, v_parallel must decrease. When v_parallel reaches zero — all motion is perpendicular — the particle has reached its mirror point and reverses direction.

The mirror point latitude depends on the particle's equatorial pitch angle. Particles with small equatorial pitch angles mirror at high latitudes (close to the poles). If the mirror point is inside the atmosphere (below ~100 km), the particle is lost to collisions — this is the loss cone. Project Argus injected electrons at known positions and pitch angles, creating artificial radiation belts whose decay rate confirmed the loss cone theory.

## The Connection

Cladonia stellaris absorbs what the atmosphere releases. When the Argus detonations injected electrons into the radiation belts, some of those electrons eventually scattered into the loss cone and hit the upper atmosphere, producing secondary particles and photons. The lichen, growing slowly in the Arctic tundra, accumulated radioactive isotopes from nuclear test fallout — not from Argus specifically (those were high-altitude), but from the same era of atmospheric testing. The lichen is a passive collector. The LED circuit is an active display. Both tell the same story: what goes up must come down, and something is always recording.
