# DIY LED Circuit: Scan-Line Earth Display

## The Circuit

A 16x1 LED strip that builds up a crude image of Earth's crescent, one scan line at a time, the way Explorer 6's spin-scan camera saw our planet for the first time. An Arduino drives shift registers (74HC595) that control 16 LEDs. The LEDs illuminate sequentially in a repeating scan pattern, with brightness levels representing the photocell's output as it swept across Earth: dark for space, dim for the limb, bright for the sunlit crescent, dark again for space on the other side.

**What it does:**
- Press the start button
- The Arduino sends brightness data to two cascaded 74HC595 shift registers
- Each "scan" lights the 16 LEDs from left to right over ~5 seconds (compressed from the real 21.4-second spin period)
- LEDs 1-4: OFF (dark space)
- LEDs 5-6: DIM (Earth limb, atmosphere glow)
- LEDs 7-10: BRIGHT (sunlit crescent — the actual image data)
- LEDs 11-12: DIM (trailing limb)
- LEDs 13-16: OFF (dark space again)
- After each scan, the brightness pattern shifts slightly (simulating the scan line stepping to the next row)
- After 8 scans (~40 seconds), the pattern degrades — noise starts corrupting the brightness levels
- After 12 scans, the display goes dark (signal lost at apogee)

**The lesson:** Explorer 6 built up the first photograph of Earth the way a fax machine or strip-chart recorder works: one line at a time. The spacecraft's rotation provided the horizontal sweep. The slow precession of the spin axis provided the vertical stepping. The photocell measured brightness at each angular position. The image was not captured all at once — it was assembled line by line, transmitted over a degrading radio link across tens of thousands of kilometers. The crudeness was not a failure; it was the entire state of the art on August 7, 1959.

**Total cost: ~$18**

---

## Schematic

```
                     +5V (Arduino)
                      |
     Arduino          |
    +--------+        |
    | D13    |--CLK--[74HC595 #1]--Q7'--[74HC595 #2]
    | D11    |--DATA   |                  |
    | D10    |--LATCH  |                  |
    |        |         |                  |
    | D2     |---[BTN]--GND              |
    +--------+         |                  |
                       |                  |
           Outputs Q0-Q7         Outputs Q0-Q7
           via 220R resistors    via 220R resistors
              |  |  |  |  |  |  |  |    |  |  |  |  |  |  |  |
             L1 L2 L3 L4 L5 L6 L7 L8  L9 L10 L11 L12 L13 L14 L15 L16
              |  |  |  |  |  |  |  |    |  |  |  |  |  |  |  |
             GND GND GND GND GND GND GND GND  GND GND GND GND GND GND GND GND

PHYSICAL LAYOUT (linear strip — the "scan line"):
  Space | Limb | CRESCENT | Limb | Space
  L1-L4   L5-L6  L7-L10    L11-L12  L13-L16
  (OFF)   (DIM)  (BRIGHT)  (DIM)    (OFF)
```

## 74HC595 Cascade Detail

The two shift registers are daisy-chained: Q7' (serial out) of the first connects to DS (serial in) of the second. This gives 16 outputs from three Arduino pins.

```
Arduino D13 (CLK) ────┬──── SH_CP (pin 11) on both 595s
                       |
Arduino D11 (DATA) ──── DS (pin 14) on 595 #1

595 #1 Q7' (pin 9) ──── DS (pin 14) on 595 #2

Arduino D10 (LATCH) ──┬──── ST_CP (pin 12) on both 595s
                       |

Pin connections for each 74HC595:
  Pin 8:  GND
  Pin 10: VCC (active high output enable — tie to VCC)
  Pin 13: GND (output enable — active low, tie to GND)
  Pin 16: VCC
  Pin 10: VCC (master reset — active low, tie HIGH to prevent reset)
```

Wait — correction for pin 10 (SRCLR / Master Reset): Tie to VCC to prevent clearing the shift register.
Pin 13 (OE / Output Enable): Tie to GND to enable outputs.

## Component List

| Part | Qty | Description | Est. Cost |
|------|-----|-------------|-----------|
| Arduino Nano | 1 | Microcontroller (ATmega328P) | $5.00 |
| 74HC595 | 2 | 8-bit shift register, serial-in parallel-out | $1.00 |
| Green LED (5mm) | 16 | T1-3/4 diffused, 20mA | $2.00 |
| 220R resistor | 16 | 1/4W, current limiting for LEDs | $1.50 |
| Tactile button | 1 | Momentary pushbutton (start) | $0.25 |
| 10K resistor | 1 | Pull-down for button | $0.10 |
| Breadboard | 1 | 830-point solderless | $4.00 |
| Jumper wires | ~25 | Male-male for breadboard | $2.00 |
| USB cable | 1 | For Arduino power + programming | $2.00 |

**Total: ~$18**

## Build Steps

### Step 1: Place the shift registers
- Place 74HC595 #1 and #2 on the breadboard, straddling the center channel
- Wire VCC (pin 16) and GND (pin 8) on both chips
- Tie SRCLR (pin 10) to VCC on both (prevent reset)
- Tie OE (pin 13) to GND on both (enable outputs)

### Step 2: Connect the cascade
- Connect Q7' (pin 9) of 595 #1 to DS (pin 14) of 595 #2
- Connect DS (pin 14) of 595 #1 to Arduino D11
- Connect SH_CP (pin 11) of both chips to Arduino D13
- Connect ST_CP (pin 12) of both chips to Arduino D10

### Step 3: Wire the LEDs
- Place 16 green LEDs in a straight horizontal line (the scan line)
- Connect each LED anode through a 220-ohm resistor to a shift register output:
  - 595 #1 outputs Q0-Q7 drive LEDs L1-L8
  - 595 #2 outputs Q0-Q7 drive LEDs L9-L16
- Connect all LED cathodes to GND

### Step 4: Button
- Wire tactile button between Arduino D2 and GND
- Add 10K pull-up resistor from D2 to VCC (or use INPUT_PULLUP in code)

### Step 5: Upload the sketch

```cpp
// Explorer 6 Scan-Line Earth Display
// Simulates the spin-scan camera building up an image line by line

const int DATA_PIN  = 11;   // 74HC595 DS
const int CLK_PIN   = 13;   // 74HC595 SH_CP
const int LATCH_PIN = 10;   // 74HC595 ST_CP
const int BTN_PIN   = 2;    // Start button

// Brightness levels (0-255 PWM approximated through time-slicing)
// Represents the photocell reading as it scans across 360 degrees:
// Space = 0, Limb = 40, Crescent = 200-255, Limb = 40, Space = 0
const uint8_t earth_profile[16] = {
  0, 0, 0, 0,         // LEDs 1-4:   dark space
  40, 80,              // LEDs 5-6:   Earth limb (atmosphere glow)
  180, 240, 255, 200,  // LEDs 7-10:  sunlit crescent (peak brightness)
  80, 40,              // LEDs 11-12: trailing limb
  0, 0, 0, 0           // LEDs 13-16: dark space
};

uint8_t display_data[16];
int scan_count = 0;
bool running = false;

void shiftOut16(uint8_t* data) {
  digitalWrite(LATCH_PIN, LOW);
  // Shift out MSB first (LED 16 first, then down to LED 1)
  for (int i = 15; i >= 0; i--) {
    digitalWrite(CLK_PIN, LOW);
    digitalWrite(DATA_PIN, data[i] > 127 ? HIGH : LOW);
    digitalWrite(CLK_PIN, HIGH);
  }
  digitalWrite(LATCH_PIN, HIGH);
}

void addNoise(uint8_t* data, int amount) {
  for (int i = 0; i < 16; i++) {
    int noise = random(-amount, amount);
    int val = (int)data[i] + noise;
    data[i] = constrain(val, 0, 255);
  }
}

void setup() {
  pinMode(DATA_PIN, OUTPUT);
  pinMode(CLK_PIN, OUTPUT);
  pinMode(LATCH_PIN, OUTPUT);
  pinMode(BTN_PIN, INPUT_PULLUP);

  // Clear display
  memset(display_data, 0, 16);
  shiftOut16(display_data);
}

void loop() {
  // Check for button press
  if (digitalRead(BTN_PIN) == LOW && !running) {
    delay(50); // debounce
    running = true;
    scan_count = 0;
  }

  if (!running) return;

  // Copy base profile
  memcpy(display_data, earth_profile, 16);

  // Shift pattern slightly based on scan number (vertical stepping)
  int shift = scan_count % 3 - 1;
  if (shift != 0) {
    uint8_t temp[16];
    memcpy(temp, display_data, 16);
    for (int i = 0; i < 16; i++) {
      int src = i - shift;
      display_data[i] = (src >= 0 && src < 16) ? temp[src] : 0;
    }
  }

  // Add noise (increases with scan count — simulates distance)
  if (scan_count > 7) {
    addNoise(display_data, (scan_count - 7) * 30);
  }

  // Scan animation: light LEDs one at a time, left to right
  for (int i = 0; i < 16; i++) {
    uint8_t scan_frame[16];
    memset(scan_frame, 0, 16);

    // Light all previously scanned LEDs at their brightness
    for (int j = 0; j < i; j++) {
      scan_frame[j] = display_data[j];
    }
    // Current scan position: blink
    scan_frame[i] = display_data[i];

    shiftOut16(scan_frame);
    delay(312); // ~5 seconds for 16 positions
  }

  // Hold complete scan line for 1 second
  shiftOut16(display_data);
  delay(1000);

  scan_count++;

  // After 12 scans, signal lost
  if (scan_count >= 12) {
    // Fade out
    for (int fade = 0; fade < 8; fade++) {
      for (int i = 0; i < 16; i++) {
        display_data[i] = display_data[i] >> 1;
      }
      shiftOut16(display_data);
      delay(200);
    }
    memset(display_data, 0, 16);
    shiftOut16(display_data);
    running = false;
  }
}
```

## Theory of Operation

Explorer 6 did not take a photograph in any conventional sense. It had no shutter, no film, no CCD. It had a single photocell — one pixel — behind a narrow slit. The spacecraft was spin-stabilized at 2.8 revolutions per minute. As it spun, the slit swept across the field of view, and the photocell measured the brightness at each angular position. One spin = one scan line. The brightness data was frequency-modulated onto the telemetry carrier and transmitted to the ground station.

The ground station received the signal, demodulated it, and fed the brightness values to a strip-chart recorder that drew one horizontal line of brightness per revolution. As the spin axis slowly precessed (due to the oblate Earth's gravitational torque), successive scan lines sampled slightly different latitudes of Earth. Over many revolutions, the strip-chart paper showed a crude image of Earth's sunlit crescent.

This LED circuit compresses that process into something you can watch on a breadboard. Each "scan" lights the 16 LEDs from left to right, with brightness levels matching the photocell's output. The crescent pattern is visible in the brightness profile: dark-dim-bright-dim-dark. As scans accumulate, noise increases (simulating the growing distance to apogee at 42,400 km), until the signal is lost entirely.

## Connection to Mission 1.6

Explorer 6 (launched August 7, 1959) was built by Space Technology Laboratories and carried the first TV camera payload to orbit. The spin-scan imaging technique it pioneered became the standard for weather satellites — TIROS, ATS, GOES — for the next two decades. Every weather satellite image you have ever seen descends from this crude, noisy, three-scan-line crescent that Explorer 6 transmitted to South Point, Hawaii on August 14, 1959. The image was barely recognizable as Earth. It was the most important photograph never framed.
