# Module 5: Complete System Projects

36 hands-on projects across 6 difficulty tiers. Each project builds on concepts from Modules 1-4, includes a bill of materials, circuit description, firmware overview, platform integration, safety notes, and a "What You Learned" concept map.

---

## Tier 1: First Steps (No Prior Experience)

Projects 1-6 use Arduino (ATmega328P) with discrete components and serial monitor output. No wireless connectivity. Focus: electrical fundamentals, GPIO, basic circuits.

### Project 1: Blink an LED

**Tier:** 1 | **Difficulty:** Beginner | **Time:** 1 hour | **Cost:** ~$3 | **Prerequisites:** None

**Learning Objectives:** Understand GPIO digital output, current limiting with resistors, LED polarity, and the Arduino IDE.

**BOM:**
| Component | Qty | Spec | Cost |
|-----------|-----|------|------|
| Arduino Uno | 1 | ATmega328P, 5V | $4 |
| LED (red) | 1 | 2V Vf, 20 mA | $0.05 |
| Resistor | 1 | 220 ohm, 1/4W | $0.01 |
| Breadboard | 1 | Half-size | $3 |
| Jumper wires | 2 | M-M | $0.10 |
| USB cable | 1 | Type B | $2 |

**Circuit:** Arduino GPIO13 -> 220 ohm resistor -> LED anode (long leg) -> LED cathode (short leg) -> GND. Current: (5V - 2V) / 220 = 13.6 mA [M1:1.1 Ohm's Law].

**Firmware:** Arduino IDE, `void setup() { pinMode(13, OUTPUT); }` / `void loop() { digitalWrite(13, HIGH); delay(1000); digitalWrite(13, LOW); delay(1000); }`

**What You Learned:**
| Concept | Module | Next |
|---------|--------|------|
| GPIO digital output | [M1:3.2] | Every project |
| Current limiting (Ohm's Law) | [M1:1.1] | Projects 2-36 |
| LED polarity | [M1:2.4] | Project 5, 20 |

---

### Project 2: Button-Controlled LED

**Tier:** 1 | **Difficulty:** Beginner | **Time:** 1.5 hours | **Cost:** ~$4 | **Prerequisites:** Project 1

**Learning Objectives:** Digital input, pull-up resistors, debouncing, button state reading.

**BOM:** Arduino Uno, LED, 220 ohm, push button, 10K pull-up resistor, breadboard, jumpers.

**Circuit:** Button between GPIO2 and GND. 10K pull-up from GPIO2 to 5V (or use INPUT_PULLUP). LED on GPIO13 through 220 ohm as in Project 1.

**Firmware:** Read button state, toggle LED. Implement software debouncing [M2:4.4] with 50ms delay filter.

**What You Learned:**
| Concept | Module | Next |
|---------|--------|------|
| Digital input | [M1:3.2] | Projects 10, 12, 15 |
| Pull-up resistors | [M1:1.6] | All digital sensor projects |
| Debouncing | [M2:4.4] | Projects 12, 15, 18 |

---

### Project 3: Light Level Monitor

**Tier:** 1 | **Difficulty:** Beginner | **Time:** 2 hours | **Cost:** ~$5 | **Prerequisites:** Project 1

**Learning Objectives:** Analog input, voltage dividers, ADC conversion, serial monitor data.

**BOM:** Arduino Uno, LDR (photoresistor), 10K resistor, LED, 220 ohm, breadboard.

**Circuit:** Voltage divider: 3.3V -> 10K resistor -> junction -> LDR -> GND. Junction connects to Arduino A0. LED on GPIO9 (PWM pin) through 220 ohm.

**Firmware:** Read analog value (0-1023), map to LED brightness using `analogWrite()`. Print values to Serial Monitor at 9600 baud. This is the student's first encounter with ADC [M1:3.2] and voltage dividers [M1:1.5].

**What You Learned:**
| Concept | Module | Next |
|---------|--------|------|
| Voltage dividers | [M1:1.5] | Projects 9, 11 |
| ADC conversion | [M1:3.2, M2:4.1] | Projects 7, 19, 24 |
| Analog sensors | [M2:3.1] | Projects 9, 11 |

---

### Project 4: Temperature Logger

**Tier:** 1 | **Difficulty:** Beginner | **Time:** 2 hours | **Cost:** ~$6 | **Prerequisites:** Project 1

**Learning Objectives:** Digital sensor protocols, DHT11 library use, data types, serial data logging.

**BOM:** Arduino Uno, DHT11 sensor, 10K pull-up resistor, breadboard.

**Circuit:** DHT11 VCC -> 5V, GND -> GND, DATA -> GPIO2 with 10K pull-up to 5V [M2:1.1].

**Firmware:** Use DHT library. Read temperature and humidity every 2 seconds. Print CSV-formatted data to serial: `timestamp,temp_c,humidity_pct`. Log to serial plotter for visual graphing.

**What You Learned:**
| Concept | Module | Next |
|---------|--------|------|
| Digital sensor protocol (1-Wire) | [M1:3.3, M2:1.1] | Projects 8, 14, 21 |
| Data types (float, int) | [M1:3.1] | All projects |
| Serial data logging | [M1:4.1] | Project 7 (web) |

---

### Project 5: RGB Mood Lamp

**Tier:** 1 | **Difficulty:** Beginner | **Time:** 2 hours | **Cost:** ~$8 | **Prerequisites:** Project 3

**Learning Objectives:** PWM output, color mixing, analog control with potentiometers.

**BOM:** Arduino Uno, common-cathode RGB LED, 3x 220 ohm resistors, 3x 10K potentiometers, breadboard.

**Circuit:** RGB LED cathode to GND. R anode -> 220 ohm -> GPIO9 (PWM). G anode -> 220 ohm -> GPIO10. B anode -> 220 ohm -> GPIO11. Potentiometers on A0, A1, A2.

**Firmware:** Read three pot values (0-1023), map to PWM (0-255) for each color channel. Students see how three primary colors mix in real time.

**What You Learned:**
| Concept | Module | Next |
|---------|--------|------|
| PWM output | [M1:3.2] | Projects 6 (servo), 20 (LEDs) |
| Color mixing (RGB) | [M2:5.4] | Project 20 (addressable LEDs) |
| Analog control | [M1:1.5] | PID control concepts |

---

### Project 6: Servo Door Sign

**Tier:** 1 | **Difficulty:** Beginner | **Time:** 2 hours | **Cost:** ~$10 | **Prerequisites:** Project 2

**Learning Objectives:** PWM servo control, mechanical integration, button input for mode selection.

**BOM:** Arduino Uno, SG90 servo, push button, 10K resistor, external 5V supply (or 4xAA battery pack), 470 uF capacitor.

**Circuit:** Servo signal -> GPIO9. Servo power from separate 5V supply (NOT Arduino 5V pin — servo draws too much current). 470 uF capacitor across servo power leads [M2:5.2]. Button on GPIO2 with pull-up.

**Firmware:** Button cycles through positions: "Available" (0 deg), "Busy" (90 deg), "Away" (180 deg). Use Servo library.

> **SAFETY GATE [SC-REL]:** Power servos from a separate supply, not the Arduino 5V pin. The SG90 can draw 500+ mA under load — the Arduino's voltage regulator is rated for 500 mA total (including the MCU itself). [SRC-ARD]

**What You Learned:**
| Concept | Module | Next |
|---------|--------|------|
| Servo PWM control | [M2:5.2] | Project 15 (door lock) |
| Separate power supply | [M1:6.1] | All Tier 2+ power designs |
| Mechanical integration | [M2:5] | Projects 15, 23 |

---

## Tier 2: Getting Connected (Wi-Fi Basics)

Projects 7-12 introduce the ESP32, Wi-Fi, MQTT, and basic Home Assistant integration. The transition from isolated circuits to networked smart home devices.

### Project 7: Wi-Fi Weather Station

**Tier:** 2 | **Difficulty:** Beginner-Intermediate | **Time:** 3 hours | **Cost:** ~$15 | **Prerequisites:** Project 4

**Learning Objectives:** I2C communication, ESP32 Wi-Fi, web server, JSON data format.

**BOM:** ESP32 dev board ($5), BME280 ($4), 0.96" OLED SSD1306 ($3), breadboard, jumpers.

**Circuit:** BME280 and OLED share I2C bus: SDA -> GPIO21, SCL -> GPIO22, both with 4.7K pull-ups to 3.3V. BME280 addr: 0x76, OLED addr: 0x3C [M2:1.3].

**Firmware:** Arduino framework. Read BME280 every 30s. Display on OLED. Serve JSON via built-in web server at `http://[ip]/data`.

**HA Integration:** REST sensor integration or ESPHome conversion.

**Dashboard:** Gauge cards for temp/humidity/pressure, history graph for 24-hour trends.

**What You Learned:**
| Concept | Module | Next |
|---------|--------|------|
| I2C bus (multi-device) | [M1:3.3, M2:1.3] | Projects 24, 30 |
| ESP32 Wi-Fi | [M3:2] | All Tier 2+ projects |
| Web server / JSON | [M3:2] | Project 12 (HTTP) |

---

### Project 8: MQTT Temperature Node

**Tier:** 2 | **Difficulty:** Intermediate | **Time:** 3 hours | **Cost:** ~$10 | **Prerequisites:** Project 4, MQTT broker running

**Learning Objectives:** MQTT publish/subscribe, topic hierarchies, QoS, retained messages.

**BOM:** ESP32 dev board, DHT22, 4.7K pull-up resistor.

**Circuit:** DHT22 on GPIO4, pull-up to 3.3V [M2:1.2].

**Firmware:** PubSubClient library. Publish temperature to `home/bedroom/temperature` (QoS 0, retained) and humidity to `home/bedroom/humidity` every 30 seconds. Subscribe to `home/bedroom/command` for remote requests. Implement LWT on `home/bedroom/status` [M3:3.4].

**HA Integration:** MQTT sensor auto-discovery or manual configuration.

**What You Learned:**
| Concept | Module | Next |
|---------|--------|------|
| MQTT pub/sub | [M3:3.1] | Projects 14, 21, 28 |
| Topic hierarchies | [M3:3.2] | All MQTT projects |
| QoS and retained messages | [M3:3.3, M3:3.4] | All MQTT projects |
| Last Will and Testament | [M3:3.4] | Device availability |

---

### Project 9: Smart Nightlight

**Tier:** 2 | **Difficulty:** Intermediate | **Time:** 3 hours | **Cost:** ~$18 | **Prerequisites:** Projects 3, 7

**Learning Objectives:** Threshold logic, relay safety, ESPHome introduction, LDR calibration.

**BOM:** ESP32, LDR, 10K resistor, 5V relay module (with optocoupler), LED strip (12V, non-addressable), 12V adapter, breadboard.

**Circuit:** LDR voltage divider on ADC1 (GPIO34). Relay module signal on GPIO18. 12V LED strip on relay NO (normally open) contacts [M2:5.1].

> **SAFETY GATE [SC-REL]:** This project uses a pre-built relay module that includes the driver transistor and flyback diode. Verify the module is opto-isolated. The 12V LED strip is low voltage — no mains safety concerns. [SRC-ARD]

**Firmware:** ESPHome YAML. Threshold sensor: below 200 lux -> relay ON, above 400 lux -> relay OFF (hysteresis prevents flicker). Report lux level and relay state to HA.

**What You Learned:**
| Concept | Module | Next |
|---------|--------|------|
| Threshold logic with hysteresis | [M2:4.2] | Project 14 (thermostat) |
| Relay switching (low voltage) | [M1:2.6, M2:5.1] | Projects 13, 14, 18 |
| ESPHome YAML | [M4:2] | All Tier 3+ projects |

---

### Project 10: Motion Alert System

**Tier:** 2 | **Difficulty:** Intermediate | **Time:** 2 hours | **Cost:** ~$12 | **Prerequisites:** Project 8

**Learning Objectives:** Interrupts, Home Assistant notifications, binary sensors.

**BOM:** ESP32, HC-SR501 PIR, passive buzzer.

**Circuit:** PIR OUT -> GPIO13. Buzzer -> GPIO18 through 100 ohm resistor [M2:2.1].

**Firmware:** ESPHome binary sensor with `delayed_off: 30s`. Local buzzer beep on detection. HA notification via automation.

**HA Automation:**
```yaml
- alias: "Motion alert - send notification"
  trigger:
    - platform: state
      entity_id: binary_sensor.hallway_motion
      to: "on"
  action:
    - service: notify.mobile_app
      data:
        message: "Motion detected in hallway"
```

**What You Learned:**
| Concept | Module | Next |
|---------|--------|------|
| PIR sensor behavior | [M2:2.1] | Project 30 (mmWave) |
| Interrupts | [M1:3.4] | Projects 19 (pulse counting) |
| HA notifications | [M4:1.5] | All alert projects |

---

### Project 11: Plant Soil Monitor

**Tier:** 2 | **Difficulty:** Intermediate | **Time:** 2 hours | **Cost:** ~$12 | **Prerequisites:** Project 3

**Learning Objectives:** Analog sensing with calibration, deep sleep for battery life, ESPHome.

**BOM:** ESP32, capacitive soil moisture sensor, 18650 battery + TP4056 module.

**Circuit:** Soil sensor analog out -> GPIO34. TP4056 charges battery, battery powers ESP32 through VIN [M2:3.4].

> **SAFETY GATE [SC-BAT]:** TP4056 module MUST include DW01 protection IC (check for the 8-pin chip on the PCB). Without it, the battery lacks over-discharge protection and can be damaged. [SRC-ESP32]

**Firmware:** ESPHome with deep sleep. Wake every 15 minutes, read soil moisture, publish to MQTT, sleep. Battery life: ~3 months on 3000 mAh cell [M1:6.3].

**What You Learned:**
| Concept | Module | Next |
|---------|--------|------|
| Deep sleep / battery life | [M1:6.3] | Battery sensor designs |
| Analog calibration | [M2:4.1] | Projects 19, 24 |
| Capacitive sensing | [M2:3.4] | Robust sensor selection |

---

### Project 12: Wi-Fi Doorbell

**Tier:** 2 | **Difficulty:** Intermediate | **Time:** 3 hours | **Cost:** ~$15 | **Prerequisites:** Projects 2, 8

**Learning Objectives:** HTTP requests, push notifications, debouncing in ESPHome.

**BOM:** ESP32, push button, passive buzzer, LED.

**Circuit:** Button on GPIO4 with pull-up. Buzzer on GPIO18. LED on GPIO2 (built-in on many boards).

**Firmware:** ESPHome. Button press triggers: local buzzer tone (500 Hz, 200ms), HA notification, MQTT publish. Debounce filter prevents multiple triggers [M2:4.4].

**What You Learned:**
| Concept | Module | Next |
|---------|--------|------|
| HTTP requests | [M3:2] | Project 28 (Node-RED APIs) |
| Push notifications | [M4:1.5] | All alert projects |
| Audio output (buzzer) | [M2:5.5] | Project 34 (I2S audio) |

---

## Tier 3: Home Automation Fundamentals

Projects 13-18 introduce mains voltage switching, PID control, RFID access control, and closed-loop systems. **Mains voltage safety is critical from this tier onward.**

### Project 13: ESPHome Light Switch

**Tier:** 3 | **Difficulty:** Intermediate | **Time:** 4 hours | **Cost:** ~$20 | **Prerequisites:** Projects 9, Module 6 (Safety)

**Learning Objectives:** Mains voltage relay switching, NEC compliance, ESPHome switch config, wall-mounted installation.

**BOM:** ESP32, 5V relay module (10A), project box (approved junction box for mains), 14 AWG wire (if hardwired), Wago connectors, USB power supply (inside box).

> **SAFETY BLOCK [SC-MAINS]:** This project switches 120V AC mains power. Before ANY wiring: (1) De-energize at the breaker. (2) Verify 0V with multimeter. (3) Use 14 AWG wire minimum for 15A circuits. (4) All mains connections inside approved junction box. (5) NEC Article 725: separate low-voltage (ESP32) and line-voltage (relay contacts) wiring. (6) GFCI protection required per NEC 210.8 in kitchens, bathrooms, garages, outdoors. (7) When in doubt, hire a licensed electrician. [SRC-NFPA, SRC-NEC-725, SRC-NEC-210]

**Circuit:** ESP32 GPIO18 -> relay module input. Relay NO contact switches the HOT (black) wire of the load. NEUTRAL (white) passes through. GROUND (green/bare) connects to junction box and load. Low-voltage ESP32 circuit and high-voltage relay contacts are on separate sides of the relay module's opto-isolation.

**Firmware:** ESPHome switch with `restore_mode: RESTORE_DEFAULT_OFF` (safety default).

**What You Learned:**
| Concept | Module | Next |
|---------|--------|------|
| Mains relay switching | [M2:5.1, M6:1] | Projects 14, 18, 19 |
| NEC compliance | [M6:1.1] | All mains projects |
| Junction box installation | [M6:1.4] | Permanent installations |

---

### Project 14: Smart Thermostat

**Tier:** 3 | **Difficulty:** Intermediate-Advanced | **Time:** 5 hours | **Cost:** ~$25 | **Prerequisites:** Projects 8, 13

**Learning Objectives:** PID control basics, hysteresis, OLED interface, ESPHome climate component, relay safety for HVAC.

**BOM:** ESP32, DHT22, 5V relay module, 0.96" OLED, rotary encoder (for setpoint), project box.

**Circuit:** DHT22 on GPIO4. Relay on GPIO18 (controls heater/fan). OLED on I2C (GPIO21/22). Rotary encoder on GPIO32/33 with GPIO25 button.

> **SAFETY BLOCK [SC-MAINS]:** If controlling a real HVAC system, the relay switches a 24V AC control signal (common in US HVAC — thermostat wire is low voltage). If controlling a space heater via outlet, all SC-MAINS rules apply. [SRC-NFPA]

**Firmware:** ESPHome `climate:thermostat` component. Setpoint via rotary encoder. Display current temp, setpoint, and mode on OLED. Hysteresis of 1.5C prevents rapid relay cycling (which shortens relay life and stresses the HVAC system).

**HA Dashboard:** Thermostat card with temperature graph, showing setpoint line overlaid on actual temperature.

**What You Learned:**
| Concept | Module | Next |
|---------|--------|------|
| PID / hysteresis control | [M4:2.4] | Climate automation |
| OLED display (I2C) | [M2:5.6] | Projects 24, 31 |
| ESPHome climate component | [M4:2.4] | HVAC integration |

---

### Project 15: RFID Door Lock

**Tier:** 3 | **Difficulty:** Intermediate | **Time:** 4 hours | **Cost:** ~$20 | **Prerequisites:** Projects 2, 6

**Learning Objectives:** SPI communication, RFID/NFC, access control, solenoid/servo actuation, security basics.

**BOM:** Arduino Uno (or ESP32), RC522 RFID reader, SG90 servo (or 12V solenoid + MOSFET), LED (green/red), buzzer, breadboard.

**Circuit:** RC522 on SPI (MOSI=11, MISO=12, SCK=13, CS=10, RST=9 for Uno). Servo on GPIO6. Green LED on GPIO4, Red LED on GPIO3, buzzer on GPIO5.

**Firmware:** MFRC522 library. Store 2-3 authorized card UIDs. On card read: compare UID, if authorized -> servo to "unlock" position + green LED + beep, if unauthorized -> red LED + different beep + log attempt. Auto-lock after 5 seconds.

> **SAFETY GATE [SC-SEC]:** Mifare Classic cards have known cryptographic weaknesses. This is a learning project, not a production security system. For real access control, use Mifare DESFire or similar. Never rely solely on RFID for security-critical applications. [SRC-OWASP]

**What You Learned:**
| Concept | Module | Next |
|---------|--------|------|
| SPI communication | [M1:3.3] | PCB design, advanced sensors |
| Access control patterns | [M6:2.2] | Network security, Project 31 |
| Solenoid/servo actuation | [M2:5.2, M2:5.5] | Mechanical systems |

---

### Project 16: Automatic Humidifier

**Tier:** 3 | **Difficulty:** Intermediate | **Time:** 3 hours | **Cost:** ~$18 | **Prerequisites:** Projects 4, 9

**Learning Objectives:** Closed-loop control, threshold logic, XIAO ESP32 platform, ultrasonic atomizer.

**BOM:** XIAO ESP32-C3, DHT11, ultrasonic atomizer module (5V), MOSFET (IRLZ44N), 10K resistor, USB-C power.

**Circuit:** DHT11 on GPIO2. MOSFET gate on GPIO3 (through 100 ohm + 10K pull-down) drives atomizer power.

**Firmware:** ESPHome. If humidity < 40% -> atomizer ON. If humidity > 55% -> atomizer OFF. Hysteresis prevents cycling.

**What You Learned:**
| Concept | Module | Next |
|---------|--------|------|
| Closed-loop control | [M4:2.4] | Thermostat, irrigation |
| MOSFET switching | [M1:2.3] | Project 20 (LED strips) |
| Compact platform (XIAO) | [M1:3.1] | Space-constrained designs |

---

### Project 17: IR Remote Hub

**Tier:** 3 | **Difficulty:** Intermediate | **Time:** 3 hours | **Cost:** ~$12 | **Prerequisites:** Project 8

**Learning Objectives:** IR protocols (NEC, RC5), code capture and replay, ESPHome remote_transmitter.

**BOM:** ESP32, IR LED (940nm), TSOP38238 IR receiver, 100 ohm resistor, NPN transistor (2N2222) for IR LED drive.

**Circuit:** TSOP38238 on GPIO19 (receive). IR LED driven by 2N2222 on GPIO18 (transmit — needs transistor because IR LED draws 50-100 mA). [M1:2.3]

**Firmware:** ESPHome `remote_receiver` to capture codes, `remote_transmitter` to replay them. Expose as HA switches: "TV Power", "AC Mode", "Fan Speed".

**What You Learned:**
| Concept | Module | Next |
|---------|--------|------|
| IR protocols (NEC, RC5) | [M3:10] | Legacy device integration |
| Code capture/replay | [M3:10] | Universal remote control |
| Transistor as driver | [M1:2.3] | All current-hungry loads |

---

### Project 18: Garage Door Controller

**Tier:** 3 | **Difficulty:** Intermediate-Advanced | **Time:** 4 hours | **Cost:** ~$22 | **Prerequisites:** Projects 13, 10

**Learning Objectives:** Contact sensors, safety interlocks, relay pulse mode, secure remote operation.

**BOM:** ESP32, 5V relay module, reed switch (magnetic contact sensor), 10K pull-up, project box.

**Circuit:** Reed switch on GPIO4 (detects door position — open/closed). Relay on GPIO18 (momentary pulse simulates wall button press — connects to garage opener's button terminals).

> **SAFETY BLOCK [SC-MAINS]:** The relay connects to the garage door opener's low-voltage button terminals (typically 12-24V DC). This is NOT mains voltage. However, the garage door mechanism itself involves significant mechanical force. Ensure the opener's safety sensors (photo-eye beams) remain functional. Never bypass safety sensors. [SRC-NFPA]

**Firmware:** ESPHome `cover` component. Relay pulses for 500ms to toggle door (not sustained contact). Reed switch reports open/closed state. HA automation: close door automatically at 10 PM if left open.

> **SAFETY GATE [SC-SEC]:** Garage door control must be secured. Use encrypted API (ESPHome) or MQTT with TLS. Consider adding a PIN or two-factor confirmation in HA before allowing remote open. [SRC-OWASP]

**What You Learned:**
| Concept | Module | Next |
|---------|--------|------|
| Contact sensors (reed switch) | [M2:2] | Security systems |
| Safety interlocks | [M6:1] | All mechanical systems |
| Secure remote operation | [M6:2.2] | Projects 31, 36 |

---

## Tier 4: Intermediate Systems

Projects 19-24 introduce multi-device systems, energy monitoring, addressable LEDs, cameras, and advanced dashboards.

### Project 19: Whole-Home Energy Meter

**Tier:** 4 | **Difficulty:** Advanced | **Time:** 6 hours | **Cost:** ~$35 | **Prerequisites:** Projects 8, Module 1 (Power Law)

**Learning Objectives:** CT clamp current sensing, power calculations, calibration, energy accumulation, Lovelace energy dashboard.

**BOM:** ESP32, 2x SCT-013-000 CT clamps ($16), ATM90E32 energy meter breakout ($12), burden resistors, voltage reference.

**Circuit:** CT clamps around mains hot wires (one per phase for split-phase 240V service). ATM90E32 on SPI bus. ESP32 reads power, voltage, current, and energy accumulation via SPI registers [M2:3.3].

> **SAFETY BLOCK [SC-MAINS]:** Installing CT clamps requires opening the electrical panel. The panel contains LIVE conductors at 120V and 240V. This work should be performed by a qualified electrician or under direct supervision of one. The CT clamps themselves are safe (they clamp around insulated wire), but proximity to live busbars and breakers is dangerous. De-energize the main breaker if possible, or work with extreme caution. [SRC-NFPA, SRC-OEM]

**Firmware:** ESPHome with ATM90E32 component. Reports: voltage, current (per phase), active power, reactive power, power factor, accumulated energy (kWh). Calibration procedure against a known load (e.g., 100W incandescent = 0.83A at 120V).

**HA Dashboard:** Energy dashboard with daily/weekly/monthly consumption graphs. Cost calculation at local utility rate.

**Accuracy target:** Within 5% of utility meter reading after calibration [SRC-OEM, SRC-CIRCUIT].

**What You Learned:**
| Concept | Module | Next |
|---------|--------|------|
| CT clamp current sensing | [M2:3.3] | Projects 29, 35 |
| Power calculations (P=VI, PF) | [M1:1.2] | Energy analysis |
| SPI communication | [M1:3.3] | Advanced sensors |
| Calibration techniques | [M2:4.1] | All precision measurements |

---

### Project 20: Smart LED Strip Controller

**Tier:** 4 | **Difficulty:** Intermediate | **Time:** 3 hours | **Cost:** ~$25 | **Prerequisites:** Project 5

**Learning Objectives:** Addressable LEDs (WS2812B), color spaces (RGB/HSV), MOSFET power switching, ESPHome light effects.

**BOM:** ESP32, 1m WS2812B strip (60 LED/m), 5V 4A power supply, 330 ohm resistor, 1000 uF capacitor, IRLZ44N MOSFET (optional for power control).

**Circuit:** ESP32 GPIO18 -> 330 ohm -> WS2812B DIN. Separate 5V supply for strip. Common GND between ESP32 and strip power supply. 1000 uF cap across strip VCC/GND [M2:5.4].

**Firmware:** ESPHome `light:neopixelbus`. Effects: rainbow, color wipe, scan, random. HA light card with color wheel and brightness slider.

**What You Learned:**
| Concept | Module | Next |
|---------|--------|------|
| WS2812B protocol | [M2:5.4] | Project 25 (Smart Mirror) |
| Power budgeting (3.6A/m) | [M1:1.2, M1:6] | LED installation design |
| Color spaces (RGB, HSV) | [M2:5.4] | Lighting design |

---

### Project 21: Multi-Room Temperature Monitor

**Tier:** 4 | **Difficulty:** Intermediate | **Time:** 4 hours | **Cost:** ~$30 | **Prerequisites:** Projects 8

**Learning Objectives:** Distributed sensor systems, MQTT topic design, HA dashboard multi-device, DS18B20 addressing.

**BOM:** 3x ESP32, 3x DS18B20 waterproof probes, 3x 4.7K pull-up resistors.

**Circuit (each node):** DS18B20 on GPIO4 with 4.7K pull-up to 3.3V [M2:1.4].

**Firmware:** ESPHome on each node. Topics: `home/bedroom/temperature`, `home/kitchen/temperature`, `home/garage/temperature`.

**HA Dashboard:** Multi-room temperature card, alert automations for extreme temps (garage below freezing, bedroom above 28C).

**What You Learned:**
| Concept | Module | Next |
|---------|--------|------|
| Distributed sensor design | [M3:3.2] | Whole-home systems |
| MQTT topic architecture | [M3:3.2] | Project 31 |
| DS18B20 1-Wire addressing | [M2:1.4] | Multi-sensor chains |

---

### Project 22: Security Camera System

**Tier:** 4 | **Difficulty:** Advanced | **Time:** 5 hours | **Cost:** ~$45 | **Prerequisites:** Projects 10

**Learning Objectives:** Video streaming, motion detection, Raspberry Pi camera, RTSP, Frigate NVR.

**BOM:** Raspberry Pi 5 ($60), Pi Camera Module V3 ($15), microSD card, case with camera mount.

**Circuit:** Pi Camera connects via CSI ribbon cable. No additional wiring.

**Software stack:** Frigate NVR (Docker container) for motion detection and recording. RTSP stream for live view. HA integration for motion events and snapshots.

> **SAFETY GATE [SC-SEC]:** Camera streams must be encrypted and access-controlled. Never expose RTSP streams to the internet without VPN. Frigate should run on the local network only. Consider privacy implications — notify household members about camera locations. [SRC-OWASP]

**What You Learned:**
| Concept | Module | Next |
|---------|--------|------|
| Video streaming (RTSP) | [M3:2] | Project 33 (AI doorbell) |
| Motion detection (software) | [M4:1.5] | Frigate, AI processing |
| Docker containers | [M4:4] | Service management |

---

### Project 23: Automated Plant Watering

**Tier:** 4 | **Difficulty:** Intermediate | **Time:** 4 hours | **Cost:** ~$30 | **Prerequisites:** Projects 11, 13

**Learning Objectives:** Irrigation scheduling, water pump safety, soil sensor calibration, automation logic.

**BOM:** ESP32, capacitive soil sensor, 5V relay module, small water pump (5V or 12V), silicone tubing, 12V adapter (if 12V pump).

**Circuit:** Soil sensor on GPIO34. Relay on GPIO18 controls pump power.

> **SAFETY GATE [SC-REL]:** The pump is an inductive load — flyback diode required across the pump motor terminals if driving directly (relay module includes this). Keep all electronics away from water. Use drip irrigation tubing to prevent flooding. Include a maximum run-time safety limit in firmware (e.g., 30 seconds max per watering cycle). [SRC-ARD]

**Firmware:** ESPHome. Water when soil moisture < 30%. Maximum 30-second pump run per cycle. Minimum 2-hour gap between cycles. Override via HA.

**What You Learned:**
| Concept | Module | Next |
|---------|--------|------|
| Pump/motor relay control | [M2:5.1] | Motorized projects |
| Irrigation scheduling | [M4:1.5] | Time-based automations |
| Safety limits in firmware | [M6:1] | All actuator projects |

---

### Project 24: Weather Station + Dashboard

**Tier:** 4 | **Difficulty:** Advanced | **Time:** 5 hours | **Cost:** ~$40 | **Prerequisites:** Projects 7, 19

**Learning Objectives:** Multi-sensor fusion, InfluxDB time-series, Grafana dashboards, Lovelace cards.

**BOM:** ESP32, BME280 (temp/hum/pressure), rain gauge (tipping bucket, pulse), wind speed/direction sensors (anemometer + vane), outdoor enclosure.

**Firmware:** ESPHome. BME280 on I2C. Rain gauge on interrupt-driven pulse counter. Wind speed from anemometer pulse frequency. Wind direction from analog vane (resistance-based voltage divider).

**Data pipeline:** ESP32 -> MQTT -> Home Assistant -> InfluxDB -> Grafana.

**Grafana dashboard:** Temperature/humidity/pressure time series, wind rose diagram, daily rainfall accumulation, 7-day trends.

**What You Learned:**
| Concept | Module | Next |
|---------|--------|------|
| Multi-sensor fusion | [M2:all] | Complex sensor systems |
| Time-series databases | [M4:5] | Energy analytics |
| Grafana visualization | [M4:5] | Professional dashboards |

---

## Tier 5: Advanced Integration

Projects 25-30 involve Raspberry Pi Linux systems, mesh networking, voice control, Node-RED, and advanced sensing.

### Project 25: Smart Mirror

**Tier:** 5 | **Difficulty:** Advanced | **Time:** 8 hours | **Cost:** ~$80 | **Prerequisites:** Projects 7, 20

**Learning Objectives:** MagicMirror software, module development, display design, physical construction.

**BOM:** Raspberry Pi 5, old monitor/display, two-way mirror film, frame, PIR sensor (wake on approach).

**Software:** MagicMirror^2 platform (Node.js). Modules: clock, weather (from HA), calendar, transit, news. PIR triggers display wake via HDMI-CEC or GPIO.

### Project 26: Voice-Controlled Room

**Tier:** 5 | **Difficulty:** Advanced | **Time:** 6 hours | **Cost:** ~$50 | **Prerequisites:** Projects 10, 14

**Learning Objectives:** Wyoming voice pipeline, local STT/TTS, Rhasspy, custom voice commands.

**BOM:** Raspberry Pi 5, USB microphone (or INMP441 I2S mic), MAX98357A I2S amplifier, 3W speaker.

**Software:** Home Assistant + Wyoming integration. openWakeWord for wake word, Whisper for STT, Piper for TTS. Custom intents: "turn on bedroom light", "set temperature to 21", "lock the front door".

### Project 27: Zigbee Mesh Network

**Tier:** 5 | **Difficulty:** Advanced | **Time:** 5 hours | **Cost:** ~$60 | **Prerequisites:** MQTT broker, HA running

**Learning Objectives:** Mesh networking, Zigbee2MQTT, coordinator setup, device pairing, routing table analysis.

**BOM:** CC2652 USB coordinator ($15), 3+ commercial Zigbee devices (bulb, button, sensor — $15 each).

**Software:** Zigbee2MQTT on RPi. Map the mesh topology. Observe routing table changes as devices are added. Force a router removal and watch mesh self-heal [M3:5].

### Project 28: Node-RED Automation Hub

**Tier:** 5 | **Difficulty:** Advanced | **Time:** 5 hours | **Cost:** ~$40 | **Prerequisites:** Projects 8, 21

**Learning Objectives:** Flow-based programming, API integration, data transformation, complex automation logic.

**BOM:** Raspberry Pi 5 (or Docker on existing hardware).

**Software:** Node-RED with: MQTT nodes, Home Assistant nodes, HTTP request nodes, function nodes. Build complex automations: weather-responsive heating, energy-aware appliance scheduling, multi-sensor security logic.

### Project 29: Solar Monitor + Inverter

**Tier:** 5 | **Difficulty:** Advanced | **Time:** 6 hours | **Cost:** ~$40 | **Prerequisites:** Project 19

**Learning Objectives:** AC power measurement, net metering concepts, HA energy dashboard, solar production tracking.

**BOM:** ESP32, 2x SCT-013 CT clamps (grid + solar), ATM90E32, voltage reference transformer.

> **SAFETY BLOCK [SC-MAINS]:** Same panel access requirements as Project 19. Solar panels produce DC voltage even when the inverter is off (as long as sunlight hits the panels). Additional hazard: the inverter's AC output may be live even if the main breaker is off. Consult a licensed electrician for any work near solar equipment. [SRC-NFPA]

**Firmware:** ESPHome ATM90E32. Two CT channels: grid consumption and solar production. Calculate: self-consumption, export, import, net metering balance.

### Project 30: Presence Detection System

**Tier:** 5 | **Difficulty:** Advanced | **Time:** 5 hours | **Cost:** ~$25 | **Prerequisites:** Projects 10

**Learning Objectives:** mmWave radar, BLE tracking, zone detection, occupancy-based automation.

**BOM:** ESP32, LD2410 mmWave sensor, HC-SR501 PIR (backup).

**Firmware:** ESPHome with LD2410 component [M2:2.3]. Reports: room occupied (binary), motion detected, stationary presence, target distance. BLE scanning for phone/watch presence.

**HA Automation:** Lights, HVAC, and media respond to room occupancy — not just motion. When the last person leaves a room, everything turns off. When someone enters, preferences restore.

---

## Tier 6: Capstone Projects

Projects 31-36 are full system integrations requiring knowledge from all modules.

### Project 31: Complete Home Hub

**Tier:** 6 | **Difficulty:** Capstone | **Time:** 12 hours | **Cost:** ~$100 | **Prerequisites:** All previous

**Learning Objectives:** Full-stack integration, system architecture, backup strategy, network security, multi-protocol hub.

**BOM:** RPi 5 (8GB), CC2652 (Zigbee), NVMe SSD, UPS HAT (battery backup).

**Software stack:** HAOS + Mosquitto + Zigbee2MQTT + Node-RED + InfluxDB + Grafana + Frigate. Docker compose for service management. Automated backups to external storage.

> **SAFETY GATE [SC-SEC]:** This hub controls all home automation. Security hardening is mandatory: (1) Unique passwords for every service. (2) HTTPS for HA access. (3) VPN for remote access (WireGuard). (4) IoT VLAN isolation. (5) Regular HAOS updates. (6) Backup strategy (daily automated, weekly manual offsite). [SRC-OWASP, SRC-ETSI]

### Project 32: Custom PCB Sensor Node

**Tier:** 6 | **Difficulty:** Capstone | **Time:** 10 hours | **Cost:** ~$50 | **Prerequisites:** Projects 7-8, KiCad intro

**Learning Objectives:** PCB design in KiCad, SMD components, manufacturing files, professional assembly.

**BOM:** KiCad (free), ESP32-WROOM module, BME280, LDR, JLCPCB fabrication ($2-5 for 5 boards), soldering supplies.

**Process:** Schematic -> layout -> DRC -> Gerber generation -> order PCB -> assemble (SMD reflow or hand solder) -> flash ESPHome -> test [M2:6].

### Project 33: AI-Powered Doorbell

**Tier:** 6 | **Difficulty:** Capstone | **Time:** 8 hours | **Cost:** ~$60 | **Prerequisites:** Projects 22, 12

**Learning Objectives:** Edge ML, object detection (TFLite), person vs. package classification, video + notification.

**BOM:** RPi 5, Pi Camera V3, button, speaker, Google Coral USB accelerator (optional).

**Software:** Frigate with TFLite model. Detect: person, package, animal. Different notification for each. Live stream to HA dashboard. Two-way audio (stretch goal).

### Project 34: Whole-House Audio

**Tier:** 6 | **Difficulty:** Capstone | **Time:** 8 hours | **Cost:** ~$70 | **Prerequisites:** Project 26

**Learning Objectives:** Multi-room audio, Snapcast, I2S DAC, DSP basics, speaker selection.

**BOM:** RPi 5 (server), 3x ESP32 + MAX98357A + speakers (satellites).

**Software:** Snapcast server on RPi, Snapcast clients on ESP32. Music Assistant integration with HA. Room-specific volume control via HA dashboard.

### Project 35: EV Charging Monitor

**Tier:** 6 | **Difficulty:** Capstone | **Time:** 6 hours | **Cost:** ~$40 | **Prerequisites:** Project 19

**Learning Objectives:** High-current monitoring, energy management, scheduling, cost optimization.

**BOM:** ESP32, SCT-013-030 CT clamp (30A), ATM90E32, voltage reference.

> **SAFETY BLOCK [SC-MAINS]:** EV charging circuits carry 30-50A at 240V. The CT clamp measurement is non-invasive and safe, but accessing the EV circuit wiring requires opening a sub-panel or junction box with potentially lethal voltage present. This work MUST be performed by a licensed electrician. [SRC-NFPA]

**Firmware:** Monitor EV charging: current, power, energy per session, estimated cost, time-of-use optimization (charge during off-peak hours).

### Project 36: Accessibility Suite

**Tier:** 6 | **Difficulty:** Capstone | **Time:** 8 hours | **Cost:** ~$50 | **Prerequisites:** Projects 26, 13

**Learning Objectives:** Universal design, adaptive interfaces, voice control, large-button panels, visual/audio feedback.

**BOM:** ESP32, large arcade buttons, WS2812B strips (visual feedback), buzzer, relay modules, I2S speaker.

**Design principles:** Voice control for hands-free operation. Large illuminated buttons for motor-impaired users. Visual feedback (LED color) for hearing-impaired users. Audio feedback for vision-impaired users. Every control has at least two modalities. HA automation handles the translation between input modality and device control.

**What You Learned:**
| Concept | Module | Next |
|---------|--------|------|
| Universal design principles | [M6:safety] | Inclusive technology |
| Multi-modal interfaces | [M2:5, M4:6] | Human-centered design |
| System integration | [All modules] | Professional practice |

---

## Project Progression Summary

| Tier | Projects | Key Skills | Safety Level | Platform |
|------|----------|-----------|-------------|----------|
| 1 | 1-6 | GPIO, Ohm's law, sensors, servo | 5V USB only | Arduino |
| 2 | 7-12 | Wi-Fi, MQTT, ESPHome intro, HA | Low voltage + Wi-Fi security | ESP32 |
| 3 | 13-18 | Mains relay, PID, RFID, ESPHome | **MAINS VOLTAGE** [SC-MAINS] | ESP32 |
| 4 | 19-24 | Energy meter, LED, cameras, multi-device | CT clamps, panels [SC-MAINS] | ESP32 + RPi |
| 5 | 25-30 | Zigbee mesh, voice, Node-RED, mmWave | Complex integrations | RPi + ESP32 |
| 6 | 31-36 | Full hub, PCB, AI, audio, accessibility | Full NEC + network security | Full stack |
