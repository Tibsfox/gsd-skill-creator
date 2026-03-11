# Circadian Rhythm Adaptation

Your body's internal clock is set by the color of light entering your eyes. Blue-rich daylight (6500K) suppresses melatonin and promotes alertness. Warm amber light (2700K) allows melatonin production and prepares the body for sleep. This page covers the chronobiology research, how to measure outdoor CCT with a TCS34725 sensor, and how to build an automated system that adjusts your indoor Hue lights to follow the natural daylight cycle.

---

## 1. Chronobiology Fundamentals

### 1.1 The Circadian System

The human circadian rhythm is approximately 24.2 hours, synchronized daily to the solar cycle by light exposure. The master clock resides in the suprachiasmatic nucleus (SCN) of the hypothalamus. It receives light information from intrinsically photosensitive retinal ganglion cells (ipRGCs) -- specialized cells in the eye that detect light independently of vision.

These ipRGCs contain the photopigment melanopsin, which is most sensitive to short-wavelength blue light at approximately 480 nm. This is why the spectral composition of light -- not just its brightness -- drives circadian responses.

### 1.2 Melatonin Suppression by Light

Melatonin is the hormone that signals the body to prepare for sleep. Its production follows a reliable pattern:

| Time of Day | Melatonin Level | Light Condition |
|-------------|----------------|-----------------|
| 6:00 AM | Falling (wake signal) | Dawn light, rising CCT |
| 10:00 AM | Suppressed | Full daylight, 5500-6500K |
| 2:00 PM | Fully suppressed | Peak daylight |
| 6:00 PM | Beginning to rise | Sunset, falling CCT |
| 9:00 PM | Rising sharply | Dusk, 2500-3000K |
| 11:00 PM | Near peak | Darkness / warm artificial |
| 2:00 AM | Peak level | Darkness |

Key research findings:
- **6500K LED exposure at 200 lux** suppresses melatonin by approximately 50% (Cajochen et al., 2011)
- **2700K LED exposure at 200 lux** has negligible melatonin suppression (< 5%)
- **The critical period** is 2-3 hours before habitual bedtime -- blue light exposure during this window delays sleep onset by 30-90 minutes
- **Dose response:** melatonin suppression scales with both blue light intensity and duration of exposure

### 1.3 CCT and Spectral Power Distribution

Color temperature (CCT) is a useful proxy for melanopic content, but it is not the complete picture. Two lights at the same CCT can have different spectral power distributions (SPDs). An LED at 4000K has a narrower blue peak than a halogen at 4000K.

For practical circadian automation, CCT is sufficient because:
- Consumer LED bulbs at the same CCT have similar blue content within ~15%
- The Hue `ct` parameter directly controls CCT (no spectral fine-tuning available anyway)
- Outdoor daylight CCT is a reliable proxy for solar elevation angle

```
CCT vs. Melanopic Content (approximate):

  CCT (K)    Melanopic Ratio    Effect
  ---------  ----------------   ----------------------
  2200       0.25               Negligible suppression
  2700       0.35               Minimal suppression
  3000       0.42               Low suppression
  4000       0.60               Moderate suppression
  5000       0.78               Significant suppression
  6500       1.00               Full alerting response
```

---

## 2. Measuring Outdoor CCT

### 2.1 Sensor Placement

Mount a TCS34725 sensor near a north-facing window (in the Northern Hemisphere) or in a weatherproof enclosure outdoors. The sensor should see the sky, not direct sun -- you want diffuse sky color, which tracks solar elevation angle smoothly.

```
  Outdoor Sensor Placement:

  +--- North-facing window ---+
  |                           |
  |   [TCS34725]              |
  |   aimed at sky            |   <-- NO direct sun
  |   diffuser cap on         |   <-- white HDPE cap
  |                           |
  +---------------------------+
       |
     I2C wires (short run, <1m)
       |
  [ ESP32 / Arduino ]
       |
     WiFi
       |
  [ Hue bridge / diyHue ]
```

### 2.2 Daily CCT Curve

Outdoor daylight CCT follows a predictable daily curve based on solar elevation angle:

```
  CCT (K)
  7000 |         *****
  6500 |       **     ****
  6000 |     **           **
  5500 |    *               *
  5000 |   *                 *
  4500 |  *                   *
  4000 | *                     *
  3500 |*                       *
  3000 |*                       *
  2500 *                         *
  2000 *                         *
       +--+--+--+--+--+--+--+--+---> Hour
       5  7  9  11 13 15 17 19 21

  Sunrise: ~2500K (amber horizon light)
  Morning: 4000K -> 5500K (rising blue content)
  Midday:  6000K -> 7000K (peak blue sky)
  Afternoon: 6500K -> 5000K (descending)
  Sunset:  3500K -> 2200K (amber to red)
  Twilight: measurement unreliable below ~5 lux
```

The exact curve depends on latitude, season, weather, and atmospheric conditions. The sensor measures it in real time, so no lookup table is needed.

### 2.3 Reading Outdoor CCT with TCS34725

```
#include <Wire.h>
#include <Adafruit_TCS34725.h>

Adafruit_TCS34725 tcs = Adafruit_TCS34725(
  TCS34725_INTEGRATIONTIME_154MS,
  TCS34725_GAIN_4X
);

float readOutdoorCCT() {
  uint16_t r, g, b, c;

  // Average 10 readings to reduce noise
  uint32_t sumR = 0, sumG = 0, sumB = 0, sumC = 0;
  for (int i = 0; i < 10; i++) {
    tcs.getRawData(&r, &g, &b, &c);
    sumR += r; sumG += g; sumB += b; sumC += c;
    delay(160);
  }

  r = sumR / 10; g = sumG / 10; b = sumB / 10; c = sumC / 10;

  // Check for darkness (sensor at noise floor)
  if (c < 50) {
    return 2200.0;  // Default to warmest when too dark to measure
  }

  // Use DN40 algorithm for CCT
  uint16_t cct = tcs.calculateColorTemperature_dn40(r, g, b, c);

  // Clamp to Hue-supported range
  if (cct < 2000) cct = 2000;
  if (cct > 6500) cct = 6500;

  return (float)cct;
}
```

See [TCS34725 Color & Ambient Sensing](m4-tcs34725-sensing.md) for complete wiring and library setup.

---

## 3. CCT-to-Mirek Conversion

The Hue bridge uses mirek (micro reciprocal Kelvin) for color temperature. The conversion is:

```
mirek = 1,000,000 / CCT_kelvin
CCT_kelvin = 1,000,000 / mirek
```

The Hue bridge accepts `ct` values from 153 (6536K) to 500 (2000K).

| Desired CCT | Mirek Value | Hue `ct` Parameter |
|-------------|-------------|-------------------|
| 6500K | 154 | 154 |
| 5000K | 200 | 200 |
| 4000K | 250 | 250 |
| 3000K | 333 | 333 |
| 2700K | 370 | 370 |
| 2200K | 455 | 455 |

### 3.1 Conversion in Code

```
// Convert CCT (Kelvin) to Hue mirek parameter
uint16_t cctToMirek(float cctKelvin) {
  if (cctKelvin < 2000) cctKelvin = 2000;
  if (cctKelvin > 6500) cctKelvin = 6500;

  uint16_t mirek = (uint16_t)(1000000.0 / cctKelvin);

  // Clamp to Hue bridge range
  if (mirek < 153) mirek = 153;
  if (mirek > 500) mirek = 500;

  return mirek;
}
```

---

## 4. Automation Pipeline

### 4.1 Architecture

The complete circadian automation system connects a TCS34725 sensor to indoor Hue lights through a microcontroller:

```
  +-------------+     I2C     +-----------+     WiFi/HTTP     +-----------+
  |  TCS34725   |------------>|  ESP32 or |------------------>| Hue Bridge|
  |  (outdoor)  |             |  Arduino  |    PUT /state     | (or diyHue|
  +-------------+             |  MKR1010  |                   +-----------+
                              +-----------+                        |
                                   |                          ZigBee / WLED
                              Serial debug                         |
                                                             +-----------+
                                                             | Light(s)  |
                                                             +-----------+
```

### 4.2 Complete ESP32 Implementation

```
#include <WiFi.h>
#include <HTTPClient.h>
#include <Wire.h>
#include <Adafruit_TCS34725.h>

// WiFi config
const char* ssid = "YOUR_WIFI";
const char* password = "YOUR_PASSWORD";

// Hue config
const char* bridgeIp = "192.168.1.100";
const char* hueUser = "YOUR_HUE_USERNAME";
const int   lightIds[] = {1, 2, 3};  // Lights to control
const int   numLights = 3;

// Sensor
Adafruit_TCS34725 tcs = Adafruit_TCS34725(
  TCS34725_INTEGRATIONTIME_154MS,
  TCS34725_GAIN_4X
);

// Smoothing
float currentMirek = 370;  // Start at warm white
const float SMOOTH_FACTOR = 0.1;  // Low-pass filter coefficient

// Timing
unsigned long lastUpdate = 0;
const unsigned long UPDATE_INTERVAL = 30000;  // 30 seconds

void setup() {
  Serial.begin(115200);
  Wire.begin();

  // Initialize sensor
  if (!tcs.begin()) {
    Serial.println("ERROR: TCS34725 not found");
    while (1);
  }
  Serial.println("TCS34725 initialized");

  // Connect WiFi
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.print("\nWiFi connected: ");
  Serial.println(WiFi.localIP());
}

float readCCT() {
  uint16_t r, g, b, c;
  uint32_t sumR = 0, sumG = 0, sumB = 0, sumC = 0;

  for (int i = 0; i < 10; i++) {
    tcs.getRawData(&r, &g, &b, &c);
    sumR += r; sumG += g; sumB += b; sumC += c;
    delay(160);
  }

  r = sumR / 10; g = sumG / 10; b = sumB / 10; c = sumC / 10;

  if (c < 50) return 2200.0;  // Darkness fallback

  return (float)tcs.calculateColorTemperature_dn40(r, g, b, c);
}

uint16_t cctToMirek(float cctK) {
  cctK = constrain(cctK, 2000, 6500);
  uint16_t m = (uint16_t)(1000000.0 / cctK);
  return constrain(m, 153, 500);
}

void setHueLight(int lightId, uint16_t mirek, uint8_t bri) {
  HTTPClient http;

  String url = "http://";
  url += bridgeIp;
  url += "/api/";
  url += hueUser;
  url += "/lights/";
  url += lightId;
  url += "/state";

  String body = "{\"on\":true,\"ct\":";
  body += mirek;
  body += ",\"bri\":";
  body += bri;
  body += ",\"transitiontime\":100}";  // 10-second smooth fade

  http.begin(url);
  http.addHeader("Content-Type", "application/json");
  int code = http.PUT(body);

  Serial.print("Light "); Serial.print(lightId);
  Serial.print(" -> ct:"); Serial.print(mirek);
  Serial.print(" bri:"); Serial.print(bri);
  Serial.print(" HTTP:"); Serial.println(code);

  http.end();
}

void loop() {
  if (millis() - lastUpdate < UPDATE_INTERVAL) return;
  lastUpdate = millis();

  // Read outdoor CCT
  float outdoorCCT = readCCT();
  uint16_t targetMirek = cctToMirek(outdoorCCT);

  // Smooth the transition (exponential moving average)
  currentMirek = currentMirek + SMOOTH_FACTOR * (targetMirek - currentMirek);
  uint16_t smoothedMirek = (uint16_t)currentMirek;

  // Calculate brightness from lux (optional: dim lights at night)
  uint16_t r, g, b, c;
  tcs.getRawData(&r, &g, &b, &c);
  uint16_t lux = tcs.calculateLux(r, g, b);
  uint8_t bri = map(constrain(lux, 5, 500), 5, 500, 80, 254);

  Serial.print("Outdoor CCT: "); Serial.print(outdoorCCT);
  Serial.print("K  Mirek: "); Serial.print(smoothedMirek);
  Serial.print("  Lux: "); Serial.print(lux);
  Serial.print("  Bri: "); Serial.println(bri);

  // Update all lights
  for (int i = 0; i < numLights; i++) {
    setHueLight(lightIds[i], smoothedMirek, bri);
    delay(200);  // Respect Hue rate limits
  }
}
```

### 4.3 Design Notes

**Smoothing is essential.** Clouds passing over the sun cause rapid CCT fluctuations. The exponential moving average with `SMOOTH_FACTOR = 0.1` means each 30-second reading only shifts the output by 10% of the difference. This produces a gradual, natural-feeling transition.

**The 10-second transition time** (`transitiontime: 100`) makes each Hue update a smooth fade rather than a step change. Combined with the 30-second update interval and the smoothing filter, the lights shift imperceptibly.

**Brightness mapping** from outdoor lux to indoor brightness is optional. Some users prefer constant indoor brightness with only CCT adaptation. Others want the lights to dim automatically as the sun sets.

---

## 5. Time-Based Fallback

When the sensor is unavailable (no outdoor mounting, sensor failure, nighttime), use a time-based CCT schedule as a fallback:

### 5.1 Lookup Table Approach

```
// Time-of-day CCT schedule (24-hour format)
struct CCTSchedule {
  uint8_t hour;
  uint16_t cctKelvin;
};

const CCTSchedule schedule[] = {
  { 5,  2200},  // Pre-dawn: warmest
  { 6,  2700},  // Dawn: warm
  { 7,  3500},  // Early morning: warming up
  { 8,  4500},  // Morning: neutral
  { 9,  5500},  // Mid-morning: cool
  {10,  6000},  // Late morning: cool-white
  {12,  6500},  // Noon: daylight
  {14,  6500},  // Early afternoon: daylight
  {16,  5500},  // Late afternoon: cooling down
  {17,  4500},  // Pre-sunset: neutral
  {18,  3500},  // Sunset: warming
  {19,  3000},  // Dusk: warm
  {20,  2700},  // Evening: warm white
  {21,  2400},  // Late evening: very warm
  {22,  2200},  // Night: warmest
  {23,  2200},  // Night: warmest
};

uint16_t getCCTForTime(uint8_t hour, uint8_t minute) {
  // Find surrounding schedule entries and interpolate
  int prevIdx = 0, nextIdx = 0;
  for (int i = 0; i < sizeof(schedule)/sizeof(schedule[0]) - 1; i++) {
    if (schedule[i].hour <= hour && schedule[i+1].hour > hour) {
      prevIdx = i;
      nextIdx = i + 1;
      break;
    }
  }

  float progress = (float)(hour * 60 + minute - schedule[prevIdx].hour * 60) /
                   (float)((schedule[nextIdx].hour - schedule[prevIdx].hour) * 60);

  return schedule[prevIdx].cctKelvin +
    (schedule[nextIdx].cctKelvin - schedule[prevIdx].cctKelvin) * progress;
}
```

### 5.2 Latitude-Aware Solar Position

For more accuracy, compute solar elevation angle from latitude, longitude, and UTC time, then derive CCT from elevation angle:

| Solar Elevation | Approximate CCT | Condition |
|----------------|-----------------|-----------|
| < -6 degrees | 2200K | Civil twilight / dark |
| -6 to 0 degrees | 2200-3000K | Sunrise/sunset horizon |
| 0-10 degrees | 3000-4000K | Golden hour |
| 10-30 degrees | 4000-5500K | Morning/afternoon |
| 30-60 degrees | 5500-6500K | Mid-day |
| > 60 degrees | 6500K | High noon |

---

## 6. Home Assistant Integration

Home Assistant provides a turnkey solution if you already run it for home automation. The `flux` or `adaptive_lighting` integration handles circadian CCT control without custom firmware.

### 6.1 Adaptive Lighting Integration

```
# configuration.yaml
adaptive_lighting:
  - name: "Living Room Circadian"
    lights:
      - light.living_room_1
      - light.living_room_2
      - light.living_room_3
    min_color_temp: 2200   # Warmest at night
    max_color_temp: 6500   # Coolest at noon
    min_brightness: 30     # Dimmest at night (%)
    max_brightness: 100    # Brightest at noon (%)
    sleep_brightness: 10   # Override for sleep mode
    sleep_color_temp: 2200
    sunrise_time: "06:00"  # Or use sun.sun entity
    sunset_time: "20:00"
    transition: 60         # 60-second fade between updates
    interval: 90           # Update every 90 seconds
```

### 6.2 TCS34725 Sensor in Home Assistant

If you run the TCS34725 on an ESP32 with ESPHome firmware, the sensor data flows directly into Home Assistant:

```
# ESPHome configuration for TCS34725
sensor:
  - platform: tcs34725
    red:
      name: "Outdoor Red Channel"
    green:
      name: "Outdoor Green Channel"
    blue:
      name: "Outdoor Blue Channel"
    clear:
      name: "Outdoor Clear Channel"
    illuminance:
      name: "Outdoor Lux"
    color_temperature:
      name: "Outdoor CCT"
    integration_time: 154ms
    gain: 4x
    address: 0x29
    update_interval: 30s
```

Then use the `Outdoor CCT` sensor value in a Home Assistant automation to override the adaptive lighting CCT:

```
# automations.yaml
- alias: "Circadian from outdoor sensor"
  trigger:
    platform: state
    entity_id: sensor.outdoor_cct
  action:
    service: light.turn_on
    target:
      entity_id:
        - light.living_room_1
        - light.living_room_2
    data:
      color_temp_kelvin: "{{ states('sensor.outdoor_cct') | int }}"
      transition: 10
```

---

## 7. Research Notes on Blue Light and Health

### 7.1 What the Science Says

The relationship between evening blue light exposure and sleep disruption is well-established in controlled laboratory studies:

- **Harvard Medical School (2012):** 6.5 hours of blue light exposure shifted circadian rhythms by 3 hours vs. 1.5 hours for comparable green light exposure
- **Cajochen et al. (2011):** LED screens at 6500K suppressed melatonin 2x more than at 2700K at the same luminance
- **PNAS (2014, Chang et al.):** iPad use before bed delayed melatonin onset by 1.5 hours, reduced REM sleep, and increased next-morning sleepiness compared to print books
- **Melanopic Equivalent Daylight Illuminance (M-EDI):** The CIE S 026 standard (2018) formalized the melanopic spectral sensitivity function for quantifying circadian-effective light

### 7.2 Practical Recommendations

Based on the research consensus:

1. **Morning:** Maximize CCT (5000-6500K) and brightness to anchor circadian phase
2. **2-3 hours before bed:** Reduce CCT below 3000K and brightness below 100 lux
3. **Last hour before bed:** 2200K or lower, minimal brightness
4. **Screens:** Enable night shift / blue light filter modes (these reduce CCT to ~2700K)
5. **Bathroom night light:** Use amber/red LEDs (590-700 nm) to avoid melatonin suppression during nighttime visits

### 7.3 What Automation Cannot Do

Circadian lighting is one input to a complex system. Other factors with equal or greater impact on circadian rhythm:

- **Morning sunlight exposure** (even 10 minutes outdoors at dawn is more powerful than any indoor light)
- **Consistent wake time** (the strongest circadian anchor)
- **Exercise timing** (morning exercise reinforces wake phase)
- **Meal timing** (late meals shift circadian phase)
- **Caffeine half-life** (~6 hours; afternoon coffee affects melatonin onset)

Automated CCT control supports but does not replace these behaviors.

---

## 8. Bill of Materials

| Component | Purpose | Approximate Cost |
|-----------|---------|-----------------|
| TCS34725 breakout (Adafruit #1334) | Outdoor CCT sensor | $8 |
| ESP32 DevKit (or Arduino MKR1010) | Controller + WiFi | $6-30 |
| Weatherproof enclosure | Outdoor sensor housing | $5-10 |
| 5V USB power adapter | Power the ESP32 | $3 |
| Dupont jumper wires (4x) | I2C connection | $1 |
| White HDPE diffuser cap | Widen sensor acceptance angle | $1 |
| Philips Hue bridge + bulbs (or diyHue) | Controllable lights | $60+ (or free with diyHue) |
| **Total (with diyHue)** | | **~$25** |

---

## 9. Cross-References

- [TCS34725 Color & Ambient Sensing](m4-tcs34725-sensing.md) -- complete wiring, register details, and calibration for the color sensor
- [Philips Hue CLIP API](m4-philips-hue-api.md) -- the `ct` parameter and PUT request format for setting color temperature
- [diyHue & WLED Integration](m4-diyhue-wled.md) -- run a free Hue-compatible bridge with WLED strips
- [ESP32 LED Control](m2-esp32-led.md) -- ESP32 WiFi and I2C fundamentals
- [MOSFET-Based PWM Dimmers](m5-mosfet-pwm-dimmers.md) -- dimming control for non-smart LED strips
- [Source Index](00-source-index.md) -- full bibliography with research paper citations

---

*Sources: Cajochen et al. (2011) "Evening exposure to a light-emitting diode (LED)-backlit computer screen affects circadian physiology and cognitive performance" (J Appl Physiol), Chang et al. (2014) PNAS "Evening use of light-emitting eReaders negatively affects sleep", CIE S 026:2018 "CIE System for Metrology of Optical Radiation for ipRGC-Influenced Responses to Light", Harvard Health Letter (2012) "Blue light has a dark side", ams TCS34725 datasheet, Philips Hue Developer Documentation*
