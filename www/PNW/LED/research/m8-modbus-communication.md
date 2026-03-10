# Modbus Communication for LED Control Systems

Modbus is the most widely deployed industrial communication protocol, connecting PLCs, sensors, actuators, and indicator panels across factory floors worldwide. For LED control in industrial environments, Modbus provides a standardized, well-understood interface between PLC-based control logic and LED indicator hardware -- whether that hardware is a traditional relay-driven panel or an ESP32-based smart LED controller. This page covers Modbus RTU and TCP variants, register mapping for LED panels, function codes, wiring, and error handling.

---

## 1. Modbus Protocol Fundamentals

### 1.1 What Modbus Is

Modbus was published by Modicon (now Schneider Electric) in 1979 for use with their PLCs. It is an open protocol with no licensing fees. Its simplicity -- just a master/slave request-response pattern over serial or Ethernet -- is why it remains dominant 45+ years later.

### 1.2 Master/Slave Architecture

Modbus uses a strict master/slave model (also called client/server in modern terminology):

```
  +----------+        Request         +----------+
  |          | =====================> |          |
  |  Master  |                        |  Slave   |
  |  (PLC)   | <===================== |  (LED    |
  |          |        Response        |  Panel)  |
  +----------+                        +----------+
                                      Slave ID: 1

  - Only the master initiates communication
  - Slaves respond only when addressed
  - Each slave has a unique address (1-247)
  - Address 0 = broadcast (no response expected)
```

### 1.3 Modbus RTU vs Modbus TCP

| Feature | Modbus RTU | Modbus TCP |
|---------|-----------|-----------|
| Physical layer | RS-485 serial (2-wire or 4-wire) | Ethernet (RJ45, Cat5/6) |
| Speed | 9600-115200 baud | 10/100 Mbps |
| Max devices | 32 per bus (247 addressable) | Limited by network |
| Max cable length | 1200m (RS-485) | 100m per segment (Ethernet) |
| Error detection | CRC-16 | TCP checksum + CRC |
| Frame overhead | 4 bytes (address + function + CRC) | 7 bytes MBAP header |
| Latency | 1-50 ms per transaction | <5 ms per transaction |
| Wiring | Twisted pair, bus topology | Star topology via switches |
| Cost | Low (RS-485 transceiver: $1) | Higher (Ethernet PHY + magnetics) |

**For LED panels:** Modbus RTU over RS-485 is the standard for simple indicator panels in machine cells. Modbus TCP is preferred when the LED controller is an ESP32 on a plant Ethernet network, or when integrating with SCADA/HMI systems.

---

## 2. Register Types

Modbus defines four data regions, each serving a different purpose:

### 2.1 Register Map

| Region | Address Range | Data Type | Access | Typical LED Use |
|--------|--------------|-----------|--------|-----------------|
| Coils | 00001-09999 | Single bit | Read/Write | Individual LED on/off |
| Discrete Inputs | 10001-19999 | Single bit | Read only | Status feedback (LED OK/fault) |
| Input Registers | 30001-39999 | 16-bit word | Read only | LED current, temperature |
| Holding Registers | 40001-49999 | 16-bit word | Read/Write | LED brightness, blink pattern, color |

### 2.2 Coils for Individual LEDs

Each coil is a single bit. One coil per LED indicator is the simplest mapping:

```
  Coil Address    LED Function
  00001           Station 1 - Green (Running)
  00002           Station 1 - Yellow (Warning)
  00003           Station 1 - Red (Fault)
  00004           Station 2 - Green
  00005           Station 2 - Yellow
  00006           Station 2 - Red
  ...
  00024           Station 8 - Red

  Write coil 00001 = ON  ->  Station 1 Green LED turns on
  Write coil 00003 = ON  ->  Station 1 Red LED turns on
```

### 2.3 Holding Registers for Packed LED States

For panels with many LEDs, packing 16 LED states into a single holding register reduces transaction count:

```
  Holding Register 40001, bits:

  Bit 15  Bit 14  Bit 13  Bit 12  Bit 11  Bit 10  Bit 9  Bit 8
  [Stn8R] [Stn8Y] [Stn8G] [Stn7R] [Stn7Y] [Stn7G] [Stn6R] [Stn6Y]

  Bit 7   Bit 6   Bit 5   Bit 4   Bit 3   Bit 2   Bit 1   Bit 0
  [Stn6G] [Stn5R] [Stn5Y] [Stn5G] [Stn4R] [Stn4Y] [Stn4G] [Stn3R]

  Holding Register 40002:
  Remaining LEDs...

  A single write to register 40001 sets 16 LEDs simultaneously.
```

### 2.4 Holding Registers for LED Brightness and Color

For smart LED panels (ESP32-based), holding registers can carry brightness and color data:

```
  Register    Function             Range
  40010       LED 1 Brightness     0-255
  40011       LED 1 Red            0-255
  40012       LED 1 Green          0-255
  40013       LED 1 Blue           0-255
  40014       LED 2 Brightness     0-255
  ...

  Or packed format (2 bytes per register):
  40010       LED 1 Brightness (high byte) + Red (low byte)
  40011       LED 1 Green (high byte) + Blue (low byte)
```

---

## 3. Function Codes for LED Control

### 3.1 Essential Function Codes

| Code | Name | Use for LEDs |
|------|------|-------------|
| FC01 | Read Coils | Read current LED states (on/off feedback) |
| FC02 | Read Discrete Inputs | Read LED fault/status feedback |
| FC03 | Read Holding Registers | Read brightness, color, blink pattern settings |
| FC05 | Write Single Coil | Turn one LED on or off |
| FC06 | Write Single Register | Set brightness/color for one LED |
| FC15 | Write Multiple Coils | Set multiple LEDs on/off in one transaction |
| FC16 | Write Multiple Registers | Set brightness/color for multiple LEDs at once |

### 3.2 FC05: Write Single Coil

Turn a single LED on or off:

```
  Request (Master -> Slave):
  [Slave Addr] [FC=05] [Coil Hi] [Coil Lo] [Value Hi] [Value Lo] [CRC Lo] [CRC Hi]
      0x01       0x05    0x00      0x00      0xFF       0x00       0x8C      0x3A

  Coil address 0x0000 = coil 00001 (Station 1 Green)
  Value 0xFF00 = ON
  Value 0x0000 = OFF

  Response (Slave -> Master): echo of request (confirmation)
  [0x01] [0x05] [0x00] [0x00] [0xFF] [0x00] [CRC Lo] [CRC Hi]
```

### 3.3 FC15: Write Multiple Coils

Set 8 LEDs simultaneously (Station 1-8 status in one transaction):

```
  Request:
  [Addr] [FC=15] [Start Hi] [Start Lo] [Qty Hi] [Qty Lo] [Byte Count] [Data...] [CRC]
  0x01    0x0F    0x00        0x00       0x00     0x08     0x01          0b10110100 CRC

  Starting coil: 0x0000 (coil 00001)
  Quantity: 8 coils
  Data: 0b10110100 = LEDs 1,3,4,6,8 ON; LEDs 2,5,7 OFF

  Bit ordering (LSB = first coil):
    Bit 0 = Coil 00001 (0 = OFF)
    Bit 1 = Coil 00002 (0 = OFF)
    Bit 2 = Coil 00003 (1 = ON)
    ...
    Bit 7 = Coil 00008 (1 = ON)
```

### 3.4 FC16: Write Multiple Registers

Set brightness and color for a block of LEDs:

```
  Request:
  [Addr] [FC=16] [Start Hi] [Start Lo] [Qty Hi] [Qty Lo] [Bytes] [Data...] [CRC]
  0x01    0x10    0x00        0x09       0x00     0x04     0x08    DATA      CRC

  Starting register: 40010 (offset 0x0009)
  Quantity: 4 registers (brightness + R + G + B for LED 1)
  Data bytes: [0xFF][0x00] [0xFF][0x00] [0x00][0x00] [0x00][0x00]
  = Brightness 255, Red 255, Green 0, Blue 0 (bright red)
```

---

## 4. Register Map Design

### 4.1 16-LED Status Panel Register Map

A practical register map for an 8-station production line, each station having 2 status LEDs (run + fault):

```
  === Coil Map (Read/Write) ===
  Coil      Description              Station
  00001     Station 1 Run LED        1
  00002     Station 1 Fault LED      1
  00003     Station 2 Run LED        2
  00004     Station 2 Fault LED      2
  00005     Station 3 Run LED        3
  00006     Station 3 Fault LED      3
  00007     Station 4 Run LED        4
  00008     Station 4 Fault LED      4
  00009     Station 5 Run LED        5
  00010     Station 5 Fault LED      5
  00011     Station 6 Run LED        6
  00012     Station 6 Fault LED      6
  00013     Station 7 Run LED        7
  00014     Station 7 Fault LED      7
  00015     Station 8 Run LED        8
  00016     Station 8 Fault LED      8

  === Holding Registers (Read/Write) ===
  Register  Description
  40001     Packed LED states (bits 0-15 = coils 1-16)
  40002     Blink mask (bits set = that LED blinks)
  40003     Blink rate (ms, 100-2000)
  40004     Global brightness (0-100%)

  === Input Registers (Read Only) ===
  Register  Description
  30001     Panel supply voltage (mV)
  30002     Panel temperature (0.1 degree C)
  30003     LED fault flags (bits = LED open/short detected)
  30004     Firmware version (major.minor as MMmm)
```

### 4.2 Efficient Update Strategy

For a PLC updating LED states every scan cycle (5-10ms), minimize Modbus traffic:

```
  Strategy 1: Write packed register only when state changes
    - PLC compares current LED state word to previous
    - Only sends FC06 (write single register) when bits change
    - One transaction per state change: ~4ms at 9600 baud

  Strategy 2: Periodic bulk update
    - PLC writes FC16 (all 4 holding registers) every 100ms
    - Guarantees LED panel is always synchronized
    - Four registers at 9600 baud: ~8ms per transaction

  Strategy 3: Coils for individual control
    - PLC writes FC05 for each LED that changes
    - Fine-grained control but more transactions
    - 16 individual writes: ~64ms at 9600 baud (too slow for fast updates)
```

For most LED panel applications, Strategy 2 (periodic bulk update at 100ms) provides the best balance of responsiveness and bus utilization.

---

## 5. Arduino/ESP32 as Modbus Slave

### 5.1 Modbus TCP Server on ESP32

The ESP32's built-in WiFi and Ethernet support makes it an excellent Modbus TCP slave for smart LED panels:

```cpp
#include <WiFi.h>
#include <ModbusTCPServer.h>

// LED pin assignments
const int LED_PINS[] = {2, 4, 5, 12, 13, 14, 15, 16,
                        17, 18, 19, 21, 22, 23, 25, 26};
const int NUM_LEDS = 16;

WiFiServer wifiServer(502);  // Modbus TCP port
ModbusTCPServer modbusTCPServer;

void setup() {
  // Configure LED pins
  for (int i = 0; i < NUM_LEDS; i++) {
    pinMode(LED_PINS[i], OUTPUT);
    digitalWrite(LED_PINS[i], LOW);
  }

  // Connect to WiFi
  WiFi.begin("Plant_Network", "password");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
  }

  // Start Modbus TCP server
  wifiServer.begin();
  modbusTCPServer.begin();

  // Configure coils (16 LEDs)
  modbusTCPServer.configureCoils(0x00, NUM_LEDS);

  // Configure holding registers
  modbusTCPServer.configureHoldingRegisters(0x00, 4);

  // Set defaults
  modbusTCPServer.holdingRegisterWrite(0x03, 100);  // 100% brightness
}

void loop() {
  // Accept new Modbus TCP clients
  WiFiClient client = wifiServer.available();
  if (client) {
    modbusTCPServer.accept(client);
  }

  // Process Modbus requests
  modbusTCPServer.poll();

  // Apply coil states to LEDs
  for (int i = 0; i < NUM_LEDS; i++) {
    int state = modbusTCPServer.coilRead(i);
    digitalWrite(LED_PINS[i], state ? HIGH : LOW);
  }

  // Check blink mask (register 0x01)
  uint16_t blink_mask = modbusTCPServer.holdingRegisterRead(0x01);
  uint16_t blink_rate = modbusTCPServer.holdingRegisterRead(0x02);
  if (blink_rate < 100) blink_rate = 500;  // Default 500ms

  bool blink_state = (millis() / blink_rate) % 2;
  for (int i = 0; i < NUM_LEDS; i++) {
    if (blink_mask & (1 << i)) {
      // This LED should blink
      int coil_state = modbusTCPServer.coilRead(i);
      digitalWrite(LED_PINS[i], (coil_state && blink_state) ? HIGH : LOW);
    }
  }
}
```

### 5.2 Modbus RTU Slave on Arduino (RS-485)

For RS-485 serial Modbus, use a MAX485 or equivalent transceiver:

```
  Arduino Wiring:

  Arduino          MAX485            RS-485 Bus
  --------         ------            ----------
  TX (pin 1) ----> DI                A ----[twisted pair]---- PLC A
  RX (pin 0) <---- RO                B ----[twisted pair]---- PLC B
  pin 2 ---------> DE + RE           GND --[ground wire]----- PLC GND
                   (direction control)

  DE/RE pin HIGH = transmit mode
  DE/RE pin LOW  = receive mode
```

```cpp
#include <ModbusRTUSlave.h>

const int DE_RE_PIN = 2;
const int LED_PINS[] = {3, 4, 5, 6, 7, 8, 9, 10};
const int NUM_LEDS = 8;

ModbusRTUSlave modbus(Serial, DE_RE_PIN);

bool coils[8] = {false};
uint16_t holdingRegisters[4] = {0, 0, 500, 100};

void setup() {
  for (int i = 0; i < NUM_LEDS; i++) {
    pinMode(LED_PINS[i], OUTPUT);
  }

  modbus.configureCoils(coils, NUM_LEDS);
  modbus.configureHoldingRegisters(holdingRegisters, 4);
  modbus.begin(1, 9600);  // Slave ID 1, 9600 baud
}

void loop() {
  modbus.poll();

  // Apply coil states to LED pins
  for (int i = 0; i < NUM_LEDS; i++) {
    digitalWrite(LED_PINS[i], coils[i] ? HIGH : LOW);
  }
}
```

See [Hybrid PLC + ESP32 Architecture](m8-hybrid-plc-esp32.md) for the complete integration pattern where PLC safety logic writes LED states via Modbus to an ESP32 running addressable LED effects.

---

## 6. RS-485 Wiring Best Practices

### 6.1 Bus Topology

RS-485 is a multi-drop bus. All devices connect to the same twisted pair in a daisy-chain topology (not star):

```
  CORRECT — Daisy-chain bus:

  PLC =====[Device 1]=====[Device 2]=====[Device 3]=====
       ^                                              ^
       |                                              |
    120 ohm                                       120 ohm
    termination                                   termination

  WRONG — Star topology (causes reflections):

                   [Device 1]
                  /
  PLC -----------+--- [Device 2]
                  \
                   [Device 3]
```

### 6.2 Termination Resistors

Place 120 ohm termination resistors at both physical ends of the bus. The termination absorbs signal reflections that would otherwise corrupt data:

```
  At each end of the bus:

  A ---[120 ohm]--- B

  Without termination: signal reflections cause bit errors
  at baud rates above 19200 or cable lengths above 50m.

  At 9600 baud with <30m cable: termination is optional but good practice.
  At 115200 baud or >100m cable: termination is mandatory.
```

### 6.3 Biasing Resistors

When no device is transmitting, the RS-485 bus is in a tri-state (high-impedance) condition. Electrical noise can be interpreted as valid data, causing phantom messages. Biasing resistors pull the bus to a known idle state:

```
  +5V
   |
  [560 ohm]   Pull-up on A
   |
   A ============================== Bus
   B ============================== Bus
   |
  [560 ohm]   Pull-down on B
   |
  GND

  This biases the bus to the "mark" (idle) state when no driver is active.
  Install biasing at the master (PLC) end only.
```

### 6.4 Cable Specifications

| Parameter | Requirement |
|-----------|-------------|
| Cable type | Twisted pair, shielded (STP) preferred |
| Characteristic impedance | 120 ohm (matches termination) |
| Wire gauge | 22-24 AWG for signal, heavier for power |
| Shield grounding | Ground shield at ONE end only (prevents ground loops) |
| Max length | 1200m at 9600 baud, 300m at 115200 baud |
| Belden equivalent | 9841 (1-pair RS-485 cable) or 3105A |

---

## 7. PLC as Modbus Master

### 7.1 Siemens S7-1200 Example

The S7-1200 supports Modbus RTU as master via its RS-485 communication module (CM 1241):

```
  TIA Portal Configuration:

  1. Add CM 1241 RS-485 module to hardware configuration
  2. Configure port: 9600 baud, 8N1, Modbus RTU
  3. In program, use MB_MASTER function block:

     MB_MASTER(
       REQ    := trigger_bit,       // TRUE = send request
       MB_ADDR := 1,                // Slave address
       MODE   := 1,                 // 1 = Write
       DATA_ADDR := 40001,          // Starting register
       DATA_LEN := 4,               // Number of registers
       DATA_PTR := DB1.LED_States   // Data block with LED values
     );
```

### 7.2 Allen-Bradley CompactLogix Example

CompactLogix uses the MSG instruction for Modbus TCP communication:

```
  RSLogix 5000 / Studio 5000:

  1. Add Generic Ethernet Module to I/O tree (Modbus TCP slave IP)
  2. Create MSG instruction:
     - Message Type: Modbus TCP
     - Destination: LED_Panel_IP:502
     - Function Code: FC16 (Write Multiple Registers)
     - Start Register: 40001
     - Length: 4
     - Source: LED_Data[0..3] (DINT array)
```

### 7.3 Scan Cycle Integration

The PLC calculates LED states in its normal scan cycle using ladder logic, then sends the result via Modbus at a configurable interval:

```
  === PLC Program Flow ===

  Rung 1-20: Safety interlock logic (see PLC Ladder Logic page)
             Produces internal bits: Stn1_Green, Stn1_Red, etc.

  Rung 21: Pack LED bits into register word
     |    Stn1_Green                                              |
     +---] [----------[MOV to LED_Word.0]------------------------+
     |    Stn1_Red                                                |
     +---] [----------[MOV to LED_Word.1]------------------------+
     ...

  Rung 30: Send Modbus at 100ms interval
     |    100ms_Timer.DN                    MB_MASTER_Trigger     |
     +---] [-----------------------------( )---------------------+
```

---

## 8. Error Handling

### 8.1 Modbus Exception Responses

When a slave cannot process a request, it returns an exception response:

| Exception Code | Name | Meaning |
|---------------|------|---------|
| 01 | Illegal Function | Function code not supported |
| 02 | Illegal Data Address | Register address out of range |
| 03 | Illegal Data Value | Value out of acceptable range |
| 04 | Slave Device Failure | Internal error in slave |
| 06 | Slave Device Busy | Slave processing another request |

```
  Normal response:    [Addr] [FC=05] [Data...] [CRC]
  Exception response: [Addr] [FC=85] [ExCode] [CRC]
                             ^^^^
                             Function code + 0x80 = exception flag
```

### 8.2 CRC Error Detection

Modbus RTU uses CRC-16 (polynomial 0xA001) appended to every frame:

```
  Frame: [Addr] [FC] [Data...] [CRC Lo] [CRC Hi]

  CRC calculation (pseudo-code):
    crc = 0xFFFF
    for each byte in frame (excluding CRC bytes):
      crc = crc XOR byte
      for 8 bits:
        if crc & 1:
          crc = (crc >> 1) XOR 0xA001
        else:
          crc = crc >> 1
    append crc (low byte first, then high byte)

  Receiver calculates CRC over received data + received CRC.
  If result is 0, the frame is valid.
  If result is non-zero, the frame is corrupt — discard and retry.
```

### 8.3 Timeout and Retry Strategy

```
  Communication timeout values:

  Modbus RTU:
    Inter-character timeout: 1.5 character times
      At 9600 baud: 1.5 * (11 bits / 9600) = 1.7ms
    Inter-frame silence: 3.5 character times
      At 9600 baud: 3.5 * (11 bits / 9600) = 4.0ms
    Response timeout: 100-1000ms (configurable)

  Modbus TCP:
    TCP connection timeout: 1-5 seconds
    Response timeout: 100-500ms
    TCP keepalive: 60 seconds

  Retry strategy:
    1. Send request
    2. Wait for response (timeout period)
    3. If timeout or CRC error: retry up to 3 times
    4. If 3 retries fail: flag communication fault
    5. On comm fault: set LEDs to safe state (all RED or all OFF)
    6. Continue retrying at reduced rate (every 5 seconds)
    7. When communication restores: clear fault, resume normal polling
```

### 8.4 Failsafe LED Behavior

The LED panel firmware should implement a communication watchdog:

```cpp
// In ESP32 Modbus slave loop:
unsigned long last_comm = 0;
const unsigned long COMM_TIMEOUT = 5000;  // 5 second watchdog

void loop() {
  if (modbusTCPServer.poll()) {
    last_comm = millis();  // Reset watchdog on any valid Modbus transaction
  }

  if (millis() - last_comm > COMM_TIMEOUT) {
    // Communication lost — enter safe state
    setAllLEDs(RED, BLINK_FAST);  // All LEDs red blinking = comm fault
  }
}
```

---

## 9. Cross-References

- [PLC Ladder Logic for LED Control](m8-plc-ladder-logic.md) -- ladder logic patterns that produce the LED states sent via Modbus
- [Hybrid PLC + ESP32 Architecture](m8-hybrid-plc-esp32.md) -- system architecture combining PLC safety with ESP32 smart LEDs
- [Industrial LED Status Panel Design](m8-industrial-led-panel.md) -- physical panel design receiving Modbus-driven LED commands
- [ESP32 LED Control](m2-esp32-led.md) -- ESP32 GPIO and peripheral configuration for LED outputs
- [MOSFET-Based PWM Dimmers](m5-mosfet-pwm-dimmers.md) -- MOSFET drivers that PLC/Modbus outputs can trigger
- [Glossary](00-glossary.md) -- Modbus, RTU, TCP, RS-485, CRC, function code definitions

---

*Sources: Modbus Organization "Modbus Application Protocol Specification V1.1b3", Modbus Organization "Modbus over Serial Line Specification V1.02", Siemens S7-1200 communication module manual, Texas Instruments "RS-485 design guide" (SLLA272), Belden RS-485 cable specifications, Arduino ModbusRTUSlave library documentation, ArduinoModbus library documentation (ModbusTCPServer)*
