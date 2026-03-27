# Hybrid PLC + ESP32 Architecture

Industrial environments need both: the certified safety of a PLC for interlocks and status indicators, and the creative power of an ESP32 for addressable LED effects, color mixing, and smart lighting. This page shows how to bridge the two worlds using Modbus TCP, with a real-world example of a machine status tower light with smart LED override.

---

## 1. The Case for Hybrid Architecture

### 1.1 What Each Platform Does Best

The PLC and ESP32 have complementary strengths that make them a natural pairing:

**PLC handles:**
- Safety-critical interlock logic (E-stop, guard switches, safety relays)
- Deterministic status indication (machine state to tower light)
- Integration with existing industrial control networks (EtherNet/IP, Profinet)
- Compliance with safety standards (ISO 13849, IEC 62443)
- 24/7 reliability in harsh environments

**ESP32 handles:**
- Addressable LED strip control (WS2812B, APA102 via WLED or custom firmware)
- Color effects, animations, gradients
- WiFi connectivity for dashboards, phone control, MQTT
- OTA updates for changing light patterns without physical access
- Integration with smart home ecosystems (Home Assistant, Alexa)

### 1.2 Architecture Overview

```
  +==========================================+
  |            PLC CABINET                    |
  |                                          |
  |  +--------+     +-------------------+    |
  |  | Safety  |     | PLC CPU           |    |
  |  | Relay   |---->| (Allen-Bradley    |    |
  |  | Module  |     |  CompactLogix)    |    |
  |  +--------+     |                   |    |
  |                  | Ladder Logic:     |    |
  |  +--------+     | - Safety interlocks|   |
  |  | E-Stop |---->| - Machine state   |    |
  |  | Guard  |---->| - Modbus server   |    |
  |  +--------+     +---+---+-----------+    |
  |                     |   |                |
  |              +------+   +------+         |
  |              |                 |         |
  |         Tower Light      Ethernet        |
  |         (hardwired)      (Modbus TCP)    |
  |                                |         |
  +==========================================+
                                   |
                              [ Switch ]
                                   |
                 +-----------------+-----------------+
                 |                                   |
          +------+------+                   +--------+--------+
          | ESP32       |                   | Dashboard PC    |
          | (WLED or    |                   | (HMI / SCADA)   |
          | custom FW)  |                   |                 |
          +------+------+                   +-----------------+
                 |
          [ WS2812B Strip ]
          (smart LED effects)
```

### 1.3 Communication Protocol: Modbus TCP

Modbus TCP is the lingua franca of industrial communication. Every major PLC supports it. The ESP32 acts as a Modbus TCP client, reading machine state registers from the PLC and adjusting LED behavior accordingly.

| Modbus Feature | Value |
|---------------|-------|
| Transport | TCP/IP, port 502 |
| Data model | Coils (bits), Holding Registers (16-bit words) |
| Max registers per request | 125 (250 bytes) |
| Latency | 5-50 ms typical on local network |
| ESP32 library | `ModbusTCPClient` (ArduinoModbus) or `eModbus` |

---

## 2. PLC Side: Modbus Register Map

### 2.1 Designing the Register Map

Define a clear register map that the ESP32 reads. This is the contract between the two systems.

| Register | Address | Type | Description | Values |
|----------|---------|------|-------------|--------|
| Machine State | 40001 | Holding Register | Current machine state code | 0=Off, 1=Idle, 2=Running, 3=Fault, 4=E-Stop |
| Alarm Code | 40002 | Holding Register | Active alarm number | 0=None, 1-999=Specific alarm |
| Production Count | 40003 | Holding Register | Parts produced this shift | 0-65535 |
| Target Count | 40004 | Holding Register | Production target | 0-65535 |
| Cycle Time (ms) | 40005 | Holding Register | Last cycle time in ms | 0-65535 |
| LED Override | 40006 | Holding Register | PLC requests specific LED pattern | 0=Auto, 1-10=Pattern ID |
| LED Brightness | 40007 | Holding Register | PLC-commanded brightness | 0-255 |
| Heartbeat | 40008 | Holding Register | PLC increments each scan | 0-65535 (wraps) |

### 2.2 PLC Ladder Logic for Modbus Server

Most modern PLCs include a built-in Modbus TCP server. You copy internal data to the Modbus register file:

```
  === Copy Machine State to Modbus Register ===

     |    E_Stop_Active                              |
     +---] [----------------[MOV 4 MB_Reg_40001]----+
     |                                               |
     |    Fault_Active    E_Stop_Active              |
     +---] [-----------]/[--[MOV 3 MB_Reg_40001]----+
     |                                               |
     |    Cycle_Running  Fault_Active                |
     +---] [-----------]/[--[MOV 2 MB_Reg_40001]----+
     |                                               |
     |    Drive_Ready    Cycle_Running               |
     +---] [-----------]/[--[MOV 1 MB_Reg_40001]----+
     |                                               |
     |    Drive_Ready                                |
     +---]/[----------------[MOV 0 MB_Reg_40001]----+
     |                                               |

  Priority: E-Stop > Fault > Running > Idle > Off
  The MOV instruction copies an integer to the Modbus register.
  The PLC's built-in Modbus server makes this register available
  to any TCP client on the network.
```

### 2.3 Heartbeat Register

The heartbeat register is critical for detecting communication failure. The PLC increments it every scan:

```
     |    Always_On                                  |
     +---] [---[ADD MB_Reg_40008 1 MB_Reg_40008]----+
     |                                               |
```

The ESP32 monitors this register. If it stops incrementing, the PLC has stopped communicating and the ESP32 should default to a safe state (red warning pattern).

---

## 3. ESP32 Side: Modbus TCP Client

### 3.1 Arduino Modbus Library

```
#include <WiFi.h>
#include <ArduinoModbus.h>
#include <Adafruit_NeoPixel.h>

const char* ssid = "FACTORY_WIFI";
const char* password = "WIFI_PASSWORD";
const char* plcIp = "192.168.1.10";
const int   modbusPort = 502;

const int LED_PIN = 16;
const int NUM_LEDS = 60;

Adafruit_NeoPixel strip(NUM_LEDS, LED_PIN, NEO_GRB + NEO_KHZ800);
ModbusTCPClient modbus;
WiFiClient wifiClient;

// Machine state variables
uint16_t machineState = 0;
uint16_t alarmCode = 0;
uint16_t prodCount = 0;
uint16_t targetCount = 0;
uint16_t lastHeartbeat = 0;
uint8_t  heartbeatFailCount = 0;

unsigned long lastPoll = 0;
const unsigned long POLL_INTERVAL = 100;  // 100ms

void setup() {
  Serial.begin(115200);

  // Initialize LEDs
  strip.begin();
  strip.setBrightness(200);
  setAllColor(50, 50, 50);  // Gray during startup

  // Connect WiFi
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nWiFi connected");

  // Initialize Modbus client
  modbus.begin(wifiClient, plcIp, modbusPort);
}

bool readPLCRegisters() {
  if (!modbus.connected()) {
    if (!modbus.begin(wifiClient, plcIp, modbusPort)) {
      return false;
    }
  }

  // Read 8 holding registers starting at 40001 (Modbus address 0)
  if (!modbus.requestFrom(HOLDING_REGISTERS, 0, 8)) {
    return false;
  }

  machineState = modbus.read();
  alarmCode    = modbus.read();
  prodCount    = modbus.read();
  targetCount  = modbus.read();
  uint16_t cycleTime = modbus.read();
  uint16_t ledOverride = modbus.read();
  uint16_t ledBri = modbus.read();
  uint16_t heartbeat = modbus.read();

  // Check heartbeat
  if (heartbeat == lastHeartbeat) {
    heartbeatFailCount++;
  } else {
    heartbeatFailCount = 0;
  }
  lastHeartbeat = heartbeat;

  // Apply PLC brightness override if set
  if (ledBri > 0) {
    strip.setBrightness(ledBri);
  }

  return true;
}

void setAllColor(uint8_t r, uint8_t g, uint8_t b) {
  for (int i = 0; i < NUM_LEDS; i++) {
    strip.setPixelColor(i, strip.Color(r, g, b));
  }
  strip.show();
}

void loop() {
  if (millis() - lastPoll < POLL_INTERVAL) return;
  lastPoll = millis();

  bool commsOk = readPLCRegisters();

  // Communication failure -> red pulsing warning
  if (!commsOk || heartbeatFailCount > 20) {
    pulseRed();
    return;
  }

  // Map machine state to LED pattern
  switch (machineState) {
    case 0:  // Off
      setAllColor(0, 0, 0);
      break;

    case 1:  // Idle / Ready
      setAllColor(0, 180, 0);  // Steady green
      break;

    case 2:  // Running
      runningAnimation();  // Green chase effect
      break;

    case 3:  // Fault
      faultPattern();  // Yellow/amber flash
      break;

    case 4:  // E-Stop
      setAllColor(255, 0, 0);  // Solid red
      break;

    default:
      setAllColor(100, 0, 100);  // Purple = unknown state
      break;
  }
}
```

### 3.2 LED Pattern Functions

```
// Green chase animation for "Running" state
void runningAnimation() {
  static int pos = 0;
  for (int i = 0; i < NUM_LEDS; i++) {
    int distance = abs(i - pos);
    if (distance < 5) {
      uint8_t bright = map(distance, 0, 4, 255, 50);
      strip.setPixelColor(i, strip.Color(0, bright, 0));
    } else {
      strip.setPixelColor(i, strip.Color(0, 20, 0));  // Dim green base
    }
  }
  strip.show();
  pos = (pos + 1) % NUM_LEDS;
}

// Yellow/amber flash for "Fault" state
void faultPattern() {
  static unsigned long lastFlash = 0;
  static bool flashState = false;

  if (millis() - lastFlash > 500) {
    flashState = !flashState;
    lastFlash = millis();
  }

  if (flashState) {
    setAllColor(255, 150, 0);  // Amber
  } else {
    setAllColor(0, 0, 0);      // Off
  }
}

// Red pulse for communication failure
void pulseRed() {
  static int pulseVal = 0;
  static int pulseDir = 5;

  pulseVal += pulseDir;
  if (pulseVal >= 255) { pulseVal = 255; pulseDir = -5; }
  if (pulseVal <= 20) { pulseVal = 20; pulseDir = 5; }

  setAllColor(pulseVal, 0, 0);
}

// Production progress bar (percentage of target)
void showProductionProgress() {
  if (targetCount == 0) return;

  int litLeds = map(prodCount, 0, targetCount, 0, NUM_LEDS);
  litLeds = constrain(litLeds, 0, NUM_LEDS);

  for (int i = 0; i < NUM_LEDS; i++) {
    if (i < litLeds) {
      // Green to yellow to red gradient as progress increases
      uint8_t r = map(i, 0, NUM_LEDS, 0, 255);
      uint8_t g = map(i, 0, NUM_LEDS, 255, 50);
      strip.setPixelColor(i, strip.Color(r, g, 0));
    } else {
      strip.setPixelColor(i, strip.Color(5, 5, 5));  // Dim white unfilled
    }
  }
  strip.show();
}
```

---

## 4. Communication Failure Handling

### 4.1 Failure Modes

| Failure | Detection | ESP32 Response |
|---------|-----------|----------------|
| WiFi disconnect | `WiFi.status() != WL_CONNECTED` | Reconnect, red pulse during retry |
| Modbus TCP timeout | `modbus.requestFrom()` returns false | Increment fail counter, red pulse after 5 fails |
| PLC program stopped | Heartbeat register stops incrementing | Red pulse after 2 seconds (20 polls at 100ms) |
| PLC power loss | TCP connection drops | Same as Modbus timeout |
| Network switch failure | Both WiFi and TCP fail | Red pulse, retry every 5 seconds |

### 4.2 Fail-Safe Principle

The ESP32's default behavior on any communication failure must be a clearly visible warning state. Red pulsing is the universal "something is wrong" signal. The system must never show green (safe) when it cannot verify the machine state.

```
// Fail-safe state machine
enum CommState { COMM_OK, COMM_DEGRADED, COMM_FAILED };

CommState getCommState() {
  if (!wifiConnected) return COMM_FAILED;
  if (!modbusConnected) return COMM_FAILED;
  if (heartbeatFailCount > 20) return COMM_FAILED;
  if (heartbeatFailCount > 5) return COMM_DEGRADED;
  return COMM_OK;
}

void applyFailSafe(CommState state) {
  switch (state) {
    case COMM_OK:
      // Normal operation - display machine state
      break;
    case COMM_DEGRADED:
      // Communication intermittent - show last known state + yellow warning
      strip.setPixelColor(0, strip.Color(255, 200, 0));  // First LED yellow
      break;
    case COMM_FAILED:
      // Communication lost - red pulse, ignore cached machine state
      pulseRed();
      break;
  }
}
```

> **SAFETY WARNING:** The ESP32 smart LED layer is informational only. It must never be the sole safety indicator for a hazardous machine. The PLC's hardwired tower light (connected directly to PLC relay outputs) remains the primary safety indicator. The smart LED strip provides supplementary information (production progress, animations) but must not replace the hardwired safety lights. If the ESP32 fails, the hardwired tower light continues operating independently.

---

## 5. When to Use PLC vs. MCU

### 5.1 Decision Matrix

| Application | Recommended Platform | Rationale |
|-------------|---------------------|-----------|
| Machine E-stop indicator | PLC (hardwired) | Safety-critical, must be deterministic |
| Tower light (R/Y/G) | PLC (hardwired) | Industrial standard, direct relay output |
| Production progress bar | ESP32 (smart LEDs) | Visual enhancement, not safety-critical |
| Decorative ambient | ESP32 (WLED) | Full color, effects, no safety role |
| Status dashboard backlight | ESP32 | Aesthetic, not safety-critical |
| Fault code display | Hybrid | PLC determines fault, ESP32 shows on LED matrix |
| Operator guidance lights | PLC | Safety-related: "pick from this bin" |
| Hazard zone warning | PLC (safety-rated) | Must meet SIL requirements |

### 5.2 The Line Between Informational and Safety

If incorrect LED state could cause injury or death, use a PLC with safety-rated I/O. If incorrect LED state merely causes inconvenience or confusion, an ESP32 is appropriate. When in doubt, consult a safety engineer.

---

## 6. Real-World Example: Machine Status Tower with Smart LED Override

### 6.1 Scenario

A CNC machining cell has:
- Standard 3-color tower light (PLC-controlled, hardwired relay outputs)
- WS2812B LED strip around the cell perimeter (60 LEDs, ESP32-controlled)
- The LED strip normally mirrors the tower light color
- During production, the strip shows a progress bar overlay
- Operators can change the strip pattern via a wall-mounted tablet (WLED web UI)
- PLC can override the strip pattern during alarms (forcing red regardless of operator selection)

### 6.2 System Wiring

```
  PLC Cabinet
  +------------------------------------------+
  |  CompactLogix L33ER                      |
  |  +------------------+                    |
  |  | 1769-OW8 Relay   |--- Tower Red      |
  |  | Output Module    |--- Tower Yellow    |
  |  |                  |--- Tower Green     |
  |  +------------------+                    |
  |  | 1769-IF4 Analog  |                    |
  |  | (optional)       |                    |
  |  +------------------+                    |
  |  | EtherNet/IP Port |----[ Switch ]      |
  |  +------------------+        |           |
  +------------------------------------------+
                                 |
                    +------------+------------+
                    |                         |
              [ ESP32 WLED ]           [ HMI Tablet ]
                    |                   (browser)
              [ WS2812B Strip ]
              (60 LEDs, 5V)
              around cell perimeter
```

### 6.3 ESP32 Logic (WLED + Modbus)

For this integration, a custom WLED usermod or standalone firmware reads Modbus registers and overrides WLED behavior when the PLC sends a non-zero LED Override register:

```
void loop() {
  pollModbus();

  // PLC override takes priority
  if (ledOverrideRegister > 0) {
    applyPLCPattern(ledOverrideRegister);
    return;  // Skip normal WLED operation
  }

  // Normal WLED operation (user-selected effects via web UI)
  wledLoop();

  // Overlay production progress on bottom 10 LEDs
  if (machineState == 2) {  // Running
    overlayProgressBar(50, 60);  // LEDs 50-60 show progress
  }
}

void applyPLCPattern(uint16_t patternId) {
  switch (patternId) {
    case 1:  // Emergency: all red, fast flash
      emergencyRedFlash();
      break;
    case 2:  // Fault: amber pulse
      faultAmberPulse();
      break;
    case 3:  // Maintenance required: blue steady
      setAllColor(0, 100, 255);
      break;
    case 4:  // Cycle complete: green sweep
      greenSweep();
      break;
  }
}
```

### 6.4 Key Design Principles

1. **Hardwired tower light is primary.** It works even if the ESP32 is unplugged, WiFi is down, or the switch fails.

2. **PLC override is absolute.** When the PLC sets register 40006 to nonzero, the ESP32 obeys regardless of what the operator selected on the tablet.

3. **ESP32 failure is cosmetic.** If the ESP32 stops working, the cell continues operating safely with only the tower light for status.

4. **Heartbeat validates the link.** The ESP32 monitors the PLC heartbeat and goes to a safe red pattern if communication is lost.

5. **No ESP32 data flows to the PLC.** The data path is one-way: PLC -> ESP32. The ESP32 never writes to PLC registers. This prevents the smart LED system from interfering with safety logic.

---

## 7. Modbus TCP on Other PLC Platforms

### 7.1 Siemens S7-1200/1500

Siemens PLCs use Modbus TCP via the `MB_SERVER` function block in TIA Portal:

```
// Structured Text (Siemens)
// Configure MB_SERVER in OB1:
"MB_SERVER_DB"(
  DISCONNECT := FALSE,
  CONNECT_ID := 1,
  IP_ADDR := 16#C0A80164,  // 192.168.1.100
  MB_HOLD_REG := "ModbusRegisters"  // Data block
);
```

### 7.2 WAGO PFC200

WAGO controllers support Modbus TCP natively with the CODESYS Modbus library:

```
// CODESYS Structured Text (WAGO)
ModbusServer(
  xEnable := TRUE,
  uiPort := 502,
  utHoldingRegisters := aHoldingRegs
);
```

### 7.3 Allen-Bradley CompactLogix

Allen-Bradley uses the MSG instruction with Modbus TCP configured through the communication module (1769-L33ERM or similar with EtherNet/IP):

```
  === Allen-Bradley Modbus Server Setup ===

  The CompactLogix acts as a Modbus TCP server when configured
  in RSLogix 5000 / Studio 5000:

  1. Add a Generic Ethernet Module in the I/O tree
  2. Configure Module Properties:
     - Comm Format: Modbus TCP
     - IP: 0.0.0.0 (listen on all interfaces)
     - Port: 502
  3. Map controller tags to Modbus registers:
     - Machine_State -> Register 40001
     - Alarm_Code -> Register 40002
     - (etc.)
```

---

## 8. Alternative Integration: MQTT Bridge

If Modbus TCP is not available (older PLC without Ethernet, or a simple relay-based control panel), use discrete digital signals through an ESP32 GPIO to MQTT bridge:

```
  PLC Relay Outputs          ESP32 GPIO Inputs
  +---------------+         +-----------------+
  | Y0 (Red)      |-------->| GPIO 32 (input) |
  | Y1 (Yellow)   |-------->| GPIO 33 (input) |
  | Y2 (Green)    |-------->| GPIO 34 (input) |
  | COM (24V DC)  |-------->| 3.3V via divider|
  +---------------+         +-----------------+
                                    |
                              [ Voltage Divider ]
                              24V -> 3.3V per channel
                              R1=10K, R2=1.6K

  ESP32 reads GPIO inputs and maps:
  Red ON = state 4 (E-Stop/Fault)
  Yellow ON = state 3 (Warning)
  Green ON = state 1 or 2 (Idle/Running)
  All OFF = state 0 (Off)
```

> **SAFETY WARNING:** When connecting PLC 24V DC outputs to ESP32 3.3V GPIO inputs, a voltage divider is mandatory. Applying 24V directly to a GPIO pin will permanently damage the ESP32. Use a resistive divider (R1=10K to signal, R2=1.6K to GND) or an optocoupler for galvanic isolation. Verify voltage at the GPIO pin with a multimeter before connecting.

---

## 9. Cross-References

- [PLC Ladder Logic for LED Control](m8-plc-ladder-logic.md) -- IEC 61131-3 ladder logic fundamentals and safety interlock patterns
- [MOSFET-Based PWM Dimmers](m5-mosfet-pwm-dimmers.md) -- external MOSFET driver circuits for PLC transistor outputs
- [WLED Firmware Setup](m5-wled-setup.md) -- the LED firmware that integrates with PLC data via custom usermods
- [ESP32 LED Control](m2-esp32-led.md) -- ESP32 GPIO, WiFi, and LED driver capabilities
- [Microcontroller Platform Comparison](m2-mcu-comparison.md) -- PLC vs MCU trade-offs for various applications
- [Glossary](00-glossary.md) -- Modbus TCP, PLC, SIL, SCADA, OPC-UA definitions

---

*Sources: Modbus Organization "Modbus Application Protocol Specification V1.1b3", Rockwell Automation CompactLogix System Reference Manual, Siemens S7-1200 Communication Function Manual, WAGO PFC200 Modbus TCP documentation, IEC 61131-3:2013, ISO 13849-1:2015, ArduinoModbus library documentation (github.com/arduino-libraries/ArduinoModbus)*
