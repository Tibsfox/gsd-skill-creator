# Module 1: Electrical & Electronics Foundations

A complete foundation in circuit theory, components, and tools for smart home projects. Every sensor reading, every actuator command, and every power calculation in this curriculum depends on the principles in this module.

---

## 1. Fundamental Laws and Relationships

### 1.1 Ohm's Law: V = IR

Voltage (volts) equals current (amps) times resistance (ohms). This is the single most important relationship in electronics. [SRC-ETUT]

**Three forms:**
- V = I x R (find voltage given current and resistance)
- I = V / R (find current given voltage and resistance)
- R = V / I (find resistance given voltage and current)

**Smart home example:** An LED needs 20 mA at 2V forward voltage. The ESP32 outputs 3.3V. What resistor?
- R = (3.3V - 2V) / 0.020A = 65 ohm -> use 68 ohm standard value (next higher)
- Power dissipated in resistor: P = I^2 x R = 0.020^2 x 68 = 0.027W (1/4W resistor is fine)

**Why it matters:** Every time you connect a sensor, choose a resistor, or size a power supply, you use Ohm's law. A student who internalizes V=IR can troubleshoot any circuit.

### 1.2 Power Law: P = VI

Power (watts) equals voltage (volts) times current (amps). [SRC-ETUT]

**Derived forms:**
- P = V x I (basic form)
- P = I^2 x R (substitute V = IR)
- P = V^2 / R (substitute I = V/R)

**Smart home examples:**
- Relay coil: 5V x 70 mA = 0.35W (tiny, but too much for a GPIO pin rated at 40 mA max)
- 60-LED WS2812B strip at full white: 5V x 3.6A = 18W (needs dedicated supply)
- ESP32 in Wi-Fi mode: 3.3V x 240 mA = 0.79W (USB can handle this easily)
- 100W incandescent bulb: 120V x 0.83A (this is why 15A circuits exist)

**Current budget rule:** Before powering any circuit, add up the current draw of every component. The power supply must exceed this total by at least 20%. [SRC-ARD]

### 1.3 Kirchhoff's Laws

**Kirchhoff's Current Law (KCL):** Current flowing into a node equals current flowing out. If 100 mA enters a junction and splits to three LEDs, the sum of the three LED currents equals 100 mA. [SRC-ETUT]

**Kirchhoff's Voltage Law (KVL):** Voltages around any closed loop sum to zero. In a series circuit with a 5V supply, a 2V LED drop, and a resistor, the resistor must drop 3V.

**Why it matters:** KVL explains why voltage dividers work. KCL explains why parallel LED strings each need their own current-limiting resistor.

### 1.4 AC vs. DC

**Direct Current (DC):** Current flows in one direction. Sources: batteries, USB, solar panels, DC adapters. All microcontrollers, sensors, and low-voltage circuits run on DC. [SRC-ETUT]

**Alternating Current (AC):** Current reverses direction at a fixed frequency. North American mains: 120V RMS at 60 Hz. European mains: 230V RMS at 50 Hz. Smart home projects bridge both worlds — sensors run on DC, but controlled loads (lights, fans, appliances) often use AC mains. [SRC-NFPA]

**RMS vs. Peak:** 120V AC is the RMS (root mean square) value. The actual peak voltage is 120 x sqrt(2) = 170V. This matters for component voltage ratings — a relay rated for 250VAC handles North American mains with margin.

> **SAFETY BLOCK [SC-MAINS]:** AC mains voltage is lethal. 120V AC at 60 Hz can deliver fatal current through the human body. All mains-voltage work in this curriculum requires: de-energize at breaker, verify with multimeter, proper junction boxes, NEC-compliant wiring. When in doubt, hire a licensed electrician. [SRC-NFPA, SRC-ESFI]

### 1.5 Voltage Dividers

Two resistors in series create a voltage divider. The output voltage between them:

**Vout = Vin x (R2 / (R1 + R2))**

Where R1 connects to Vin and R2 connects to GND, with Vout taken at the junction.

**Smart home applications:**
- Reading analog sensors (LDR, NTC thermistor) that change resistance
- Level shifting 5V signals to 3.3V for ESP32 inputs (but dedicated level shifters are more reliable for bidirectional signals)
- Battery voltage monitoring (two high-value resistors to scale voltage into ADC range)

**Example:** LDR (light-dependent resistor) circuit:
- R1 = 10K fixed resistor to 3.3V
- R2 = LDR (varies: ~1K in bright light, ~100K in darkness) to GND
- Vout to ESP32 ADC: bright = low voltage (LDR resistance is low), dark = high voltage
- ADC reads 0-4095 (12-bit) proportional to light level

### 1.6 Pull-Up and Pull-Down Resistors

Digital inputs on microcontrollers must be connected to a defined voltage level. A "floating" input picks up noise and gives unreliable readings. [SRC-ARD, SRC-ESP32]

**Pull-up resistor:** Connects input to VCC (3.3V or 5V) through a resistor (typically 4.7K-10K). Input reads HIGH by default. A button or sensor pulls it LOW to signal an event.

**Pull-down resistor:** Connects input to GND through a resistor. Input reads LOW by default. A button or sensor pulls it HIGH.

**Internal pull-ups:** Most microcontrollers have built-in pull-up resistors (activated in firmware with `INPUT_PULLUP`). ESP32 has both internal pull-up and pull-down on most GPIO pins. Internal pull-ups are typically 45K-65K — adequate for buttons, but some sensors need external 4.7K for reliable communication (especially I2C and 1-Wire). [SRC-ESP32]

---

## 2. Essential Components

### 2.1 Resistors

**Fixed resistors:** Carbon film or metal film. Color bands indicate value. Common values for smart home projects: 220 ohm (LED current limiting), 330 ohm, 1K, 4.7K (I2C/1-Wire pull-ups), 10K (voltage dividers, pull-ups/downs). [SRC-ETUT]

**Variable resistors (potentiometers):** Three-terminal devices with a wiper. 10K linear pots are used for manual threshold adjustment. Trimpots (trimmers) for calibration.

**Thermistors:** Temperature-dependent resistors. NTC (negative temperature coefficient) decreases resistance as temperature rises — the cheapest temperature sensor, but requires a voltage divider and calibration curve (Steinhart-Hart equation).

**Photoresistors (LDR):** Light-dependent resistors. Resistance decreases with light intensity. Combined with a fixed resistor in a voltage divider, creates the simplest light sensor. Used in Project 3 (Light Level Monitor) and Project 9 (Smart Nightlight).

**Power rating:** Standard 1/4W resistors handle most signal-level circuits. For higher-current paths (motor circuits, power supplies), calculate P = I^2 x R and select appropriate wattage with 50% derating.

### 2.2 Capacitors

**Ceramic capacitors (100 nF / 0.1 uF):** The most critical passive component in digital circuits. Place one between VCC and GND of every IC, as close to the pins as possible. These "decoupling" capacitors absorb high-frequency noise that would otherwise corrupt data signals. Without them, I2C communication fails randomly, ADC readings are noisy, and microcontrollers reset unexpectedly. [SRC-ESP32, SRC-ARD]

**Electrolytic capacitors (10-470 uF):** Bulk energy storage for power rails. Used to smooth DC power supply ripple and absorb current spikes from motors and servos. Polarized — the negative lead (shorter, marked with stripe) must connect to the more negative voltage. Reversing polarity can cause failure or rupture.

**Application guide:**
- 100 nF ceramic at every IC VCC pin (non-negotiable)
- 10-47 uF electrolytic at power supply input
- 100-470 uF across servo power leads (absorbs startup surge)
- 1000 uF at DC adapter output (smooths rectified AC ripple)

### 2.3 Transistors

**NPN Bipolar (2N2222, 2N3906):** Three-terminal switches. A small current into the base (1-5 mA from a GPIO pin through a 1K resistor) controls a much larger current through the collector-emitter path (up to 600 mA for 2N2222). Used to drive relay coils, buzzers, and small motors. [SRC-ETUT]

**Basic NPN switching circuit:**
1. GPIO pin -> 1K resistor -> Base
2. VCC (5V) -> Load (relay coil) -> Collector
3. Emitter -> GND
4. Flyback diode (1N4007) across inductive load (cathode to VCC side)

**N-Channel MOSFET (IRLZ44N, IRF520):** Voltage-controlled switches for higher current loads. The IRLZ44N is "logic-level" — it fully turns on with 3.3V on the gate, making it directly compatible with ESP32. Can switch up to 47A (with heatsinking). Used for LED strips, 12V motors, and high-power DC loads.

**Key MOSFET advantage:** Zero steady-state current to drive the gate (unlike BJT base current). GPIO pin -> 100 ohm resistor -> Gate. Add 10K pull-down from gate to GND to prevent floating during boot.

**Why logic-level matters:** Standard MOSFETs (IRF520) need 10V on the gate to fully turn on. With a 3.3V ESP32, they stay in partial conduction, waste power as heat, and can overheat. Always use logic-level MOSFETs (IRLZ44N, IRL540N) for 3.3V microcontrollers. [SRC-ESP32]

### 2.4 Diodes

**Rectifier (1N4007):** Standard 1A 1000V diode. Primary use in smart home circuits: flyback protection across relay coils, solenoids, and motors. When an inductive load is switched off, the collapsing magnetic field generates a voltage spike (often >100V). The flyback diode provides a path for this energy to dissipate safely. [SRC-ETUT]

> **SAFETY BLOCK [SC-FLY]:** Every relay coil, solenoid, and DC motor circuit MUST include a flyback diode. Connect cathode (stripe) to the positive supply side, anode to the negative/transistor side. Omitting this diode WILL destroy transistors or MOSFETs and can create fire hazards. This is not optional. [SRC-ETUT, SRC-ARD]

**Schottky (1N5819):** Lower forward voltage drop (0.3V vs 0.7V for standard silicon). Used in power path protection and switching regulator circuits where efficiency matters.

**Zener diode:** Conducts in reverse at a specific voltage. Used for simple voltage regulation and overvoltage protection. A 3.3V Zener can protect an ESP32 input from 5V signals (though proper level shifters are preferred).

### 2.5 Voltage Regulators

**Linear regulators:**
- LM7805: Converts 7-35V input to 5V output, up to 1A. Simple but inefficient — excess voltage is dissipated as heat. A 12V input at 500 mA wastes (12-5) x 0.5 = 3.5W as heat. Needs a heatsink above 0.5W dissipation.
- AMS1117-3.3: Converts 5V to 3.3V, up to 1A. Low dropout (1.3V). Used on most ESP32 dev boards.

**Switching regulators (buck converters):** Convert voltage efficiently (85-95%). A 12V to 5V buck converter at 1A wastes only 0.5-1W vs. 7W for a linear regulator. Use these for: LED strip power, multi-voltage systems, battery-powered projects. [SRC-ETUT]

**Dropout voltage:** The minimum difference between input and output voltage for a regulator to maintain regulation. LM7805 needs at least 7V input (2V dropout). AMS1117 needs 4.6V for 3.3V output (1.3V dropout). LDO (Low Dropout) regulators need as little as 0.3V difference.

### 2.6 Relays

See Module 2 (02-sensors-actuators.md) Section 5.1 for complete relay coverage including mechanical vs. solid-state, driving circuits, and safety requirements.

Key principle: A relay is an electrically-operated switch. A small DC voltage (5V coil) controls a much larger AC or DC load (up to 10A at 250VAC for standard modules). The coil and contacts are galvanically isolated — the control circuit and load circuit share no electrical connection. [SRC-ETUT]

---

## 3. Microcontroller Fundamentals

### 3.1 What is a Microcontroller?

A microcontroller is a small computer on a single chip: processor, memory, and I/O peripherals integrated together. Unlike a general-purpose computer (laptop, Raspberry Pi), a microcontroller runs a single program in an infinite loop, starting the instant power is applied. No operating system, no boot time, no crashes from other software. [SRC-ARD, SRC-ESP32]

**Key differences from full computers:**

| Feature | Microcontroller (ESP32) | Single-Board Computer (RPi 5) |
|---------|------------------------|------------------------------|
| Startup time | <1 second | 20-60 seconds |
| Operating system | None (bare metal) or RTOS | Full Linux |
| Power consumption | 10 uA - 240 mA | 2-5W constant |
| Real-time control | Yes (microsecond precision) | No (OS scheduling delays) |
| Network services | Limited | Full (web server, database, etc.) |
| Camera/video | Possible but limited | Native support |
| Cost | $3-8 | $35-80 |

**When to use which:**
- Microcontroller: Sensors, actuators, single-purpose devices, battery-powered nodes
- Single-board computer: Hub role, cameras, voice processing, machine learning, dashboards

### 3.2 GPIO: General Purpose Input/Output

Every microcontroller pin that can be configured as either input or output by software. [SRC-ARD, SRC-ESP32]

**Digital output:** Pin drives HIGH (VCC) or LOW (GND). Used for LEDs, buzzers, relay drivers. Maximum current per pin: 20-40 mA (Arduino), 12 mA (ESP32 recommended, 40 mA absolute max).

**Digital input:** Pin reads HIGH or LOW from external circuits. Buttons, switches, digital sensors (PIR, DHT data pin). Must use pull-up or pull-down resistors to avoid floating.

**Analog input (ADC):** Reads a voltage and converts it to a digital number. Arduino: 10-bit (0-1023 representing 0-5V). ESP32: 12-bit (0-4095 representing 0-3.3V). Used for potentiometers, LDR, thermistors, CT clamps, gas sensors.

**Important ESP32 ADC limitations:**
- ADC2 channels cannot be used while Wi-Fi is active (use ADC1 only)
- ADC is not perfectly linear — calibration recommended for precision measurements
- Input range is 0-3.3V — never exceed this or damage occurs
- ESP32 ADC1 channels: GPIO 32, 33, 34, 35, 36, 39 [SRC-ESP32]

**PWM (Pulse Width Modulation):** Rapidly switching a digital pin on and off to simulate analog output. The duty cycle (percentage of time HIGH) controls the average voltage. 50% duty cycle on a 3.3V pin delivers an average of 1.65V. Used for: LED brightness, servo position, motor speed. ESP32 has 16 PWM channels with 1-16 bit resolution. [SRC-ESP32]

### 3.3 Communication Protocols (Hardware Level)

**UART (Serial):** Simplest protocol. Two wires (TX and RX), one in each direction. Used for: GPS modules, LD2410 mmWave sensor, debug output (Serial Monitor). Baud rate must match on both sides (9600, 115200 common). [SRC-ARD]

**I2C (Inter-Integrated Circuit):** Two-wire bus (SDA for data, SCL for clock) that supports multiple devices on the same wires. Each device has a unique 7-bit address. Used for: BME280, BH1750, OLED displays, SHT31. Pull-up resistors (4.7K) required on both SDA and SCL. ESP32 default pins: SDA=21, SCL=22. Up to ~20 devices on one bus (address-limited). Speed: 100/400 kHz. [SRC-ESP32]

**SPI (Serial Peripheral Interface):** Four-wire protocol (MOSI, MISO, SCK, CS). Faster than I2C (up to 10 MHz+), but each device needs its own CS (chip select) pin. Used for: TFT displays, SD cards, LoRa modules, some ADCs. [SRC-ESP32]

**1-Wire (Dallas):** Single data wire (plus power and ground). Unique 64-bit address per device allows multiple sensors on one pin. Used for: DS18B20 temperature sensors (chain dozens on a single GPIO pin). Requires 4.7K pull-up resistor.

### 3.4 Interrupts

A mechanism where an external event (button press, sensor trigger) immediately calls a function, interrupting whatever the main loop is doing. Essential for time-critical events. [SRC-ARD]

**Why interrupts matter for smart home:**
- PIR sensor detects motion — interrupt fires instantly, even if main loop is doing a slow sensor read
- Button press — interrupt captures the exact moment, avoiding missed presses during delays
- Pulse counting (flow sensors, energy meters) — interrupt counts every pulse accurately

**ESP32 interrupt rules:**
- Keep ISR (Interrupt Service Routine) functions short — set a flag, don't do heavy processing
- Use `IRAM_ATTR` for ISR functions on ESP32 (stores in fast internal RAM)
- Don't use Serial.print, delay(), or Wi-Fi functions inside ISR
- Use `volatile` for variables shared between ISR and main loop

---

## 4. Tools and Measurement

### 4.1 Multimeter

The most essential electronics tool. Every student project should begin with a multimeter on the bench. [SRC-ESFI]

**Essential measurements for smart home projects:**

| Measurement | Setting | How | Use Case |
|-------------|---------|-----|----------|
| DC Voltage | V DC | Red to test point, black to GND | Verify power supply, check sensor output |
| AC Voltage | V AC | Red and black across supply | Verify mains is de-energized (SAFETY!) |
| DC Current | A DC | Break circuit, meter in series | Measure component current draw |
| Resistance | Ohm | Probes across component (power OFF) | Verify resistor values, check for shorts |
| Continuity | Beep symbol | Probes across connection | Verify solder joints, find broken wires |
| Diode test | Diode symbol | Red to anode, black to cathode | Verify diode orientation, check LEDs |

> **SAFETY GATE [SC-MAINS]:** When using a multimeter to verify mains voltage is off, set the meter to AC voltage FIRST, then touch probes. Verify the meter works on a known-live outlet before and after testing the circuit you de-energized (proving the meter works eliminates false "safe" readings from a dead meter battery). [SRC-ESFI, SRC-NFPA]

**Current budget procedure:**
1. Power the circuit from a bench supply with a current limit
2. Measure total current with multimeter in series with the supply
3. Compare to supply rating — if drawing more than 80% of supply capacity, use a larger supply
4. For battery projects: total_mA / battery_mAh = hours of runtime (rough estimate)

### 4.2 Breadboard and Prototyping

**How breadboards work:** Internal metal clips connect 5 holes in each row. The two long rails along each edge are power buses (connect to VCC and GND). Components straddle the center gap, with legs in different rows for separate connections. [SRC-ARD]

**Breadboard best practices:**
1. Red wire for VCC, black for GND, other colors for signals
2. Run power and ground rails first, then signal wires
3. Keep wires flat against the board for readability
4. One component per breadboard row
5. Power supply connects to the rail, not directly to ICs
6. 100 nF decoupling capacitors from VCC to GND rail near each IC

**Breadboard limitations:**
- Contact resistance adds noise (0.01-0.1 ohm per contact)
- High-frequency signals (>10 MHz) don't propagate cleanly
- Maximum current per row: ~1A (clips overheat above this)
- Not suitable for final installations — soldering required

### 4.3 Soldering Basics

Soldering creates permanent electrical connections by melting tin-lead or lead-free alloy between two metal surfaces. Required for all Tier 3+ projects and recommended for reliable Tier 2 projects. [SRC-ARD]

**Essential technique:**
1. Heat both the pad and the component lead simultaneously (2-3 seconds)
2. Apply solder to the junction (not to the iron tip directly)
3. Let solder flow around the joint
4. Remove solder, then iron
5. Good joint: shiny, concave fillet, smooth
6. Cold joint: dull, grainy, blobby — reheat and reflow

**Temperature settings:** 350-370C for leaded solder (60/40), 370-400C for lead-free. Higher isn't better — excessive heat damages components and lifts PCB pads.

**Safety:**
- Solder in a ventilated area or use a fume extractor
- Lead-free solder is preferred for health reasons
- Iron stand with a stable base prevents burns
- Wet sponge or brass wire cleaner to clean the tip between joints

### 4.4 Oscilloscope Introduction

An oscilloscope displays voltage over time — it shows what the multimeter cannot: signal shape, timing, noise, and protocol communication. Not required for Tier 1-3 projects, but increasingly valuable for debugging from Tier 4 onward.

**Smart home debugging scenarios:**
- PWM signal verification: Is the duty cycle what the code specifies?
- I2C communication: Are the clock and data signals clean? Are there stretched clocks?
- Servo jitter: Is the PWM signal stable or does Wi-Fi interrupt timing?
- Power supply ripple: Is the 5V rail actually stable or oscillating?
- One-wire protocol: Is the DS18B20 responding with valid data pulses?

**Entry-level options:**
- Hantek DSO5072P (~$80): 70 MHz, 2-channel, adequate for all projects
- Rigol DS1054Z (~$300): 50 MHz (hackable to 100 MHz), 4-channel, protocol decode
- USB logic analyzer (~$10): 8-channel, digital only, protocol decode via PulseView/Sigrok

---

## 5. Safe Handling of Mains Voltage

This section applies to ALL projects from Tier 3 onward that switch or interact with 120V AC mains power.

### 5.1 The NEC Article 725 Boundary

NEC Article 725 defines the boundary between Class 2 circuits (low voltage, limited energy — safe for students) and line-voltage circuits (mains power — requires electrical knowledge and potentially permits). [SRC-NFPA, SRC-NEC-725]

**Class 2 circuits (below 24V DC, limited current):**
- Microcontroller circuits
- Sensor wiring
- Low-voltage relay coils (5V side)
- LED strips (5V or 12V)
- Communication wiring (I2C, SPI, UART)

**Line-voltage circuits (120V AC and above):**
- Relay load contacts switching mains
- Smart switch installations
- Appliance control
- Any wire carrying 120V AC

**The rule:** Class 2 wiring and line-voltage wiring must be physically separated. They cannot share the same junction box, conduit, or cable bundle unless specifically rated for it. The relay provides the galvanic isolation boundary. [SRC-NFPA]

### 5.2 The Six Safety Rules

These rules apply to every project in this curriculum that involves mains voltage:

**SAFETY RULE 1:** Never work on circuits connected to mains power. Always disconnect power at the breaker before any wiring. Verify with a multimeter that voltage is zero. Lock out the breaker if others have access. [SRC-NFPA, SRC-ESFI]

**SAFETY RULE 2:** Use properly rated components. A relay rated for 10A at 250VAC does NOT mean the wiring is rated for 10A. Wire gauge must match the circuit breaker: 14 AWG for 15A circuits, 12 AWG for 20A circuits. [SRC-NFPA]

**SAFETY RULE 3:** Relay and motor circuits MUST include flyback diodes. Inductive kickback from relay coils can destroy microcontrollers and create fire hazards. Place a 1N4007 diode across every inductive load. [SRC-ETUT]

**SAFETY RULE 4:** Lithium batteries require charge controllers with overcharge, over-discharge, and thermal protection. TP4056 with DW01 protection IC is the minimum. Never charge lithium cells without a proper controller. [SRC-ESP32]

**SAFETY RULE 5:** RF transmitters must comply with FCC Part 15 (ISM bands, power limits, duty cycle). The ESP32's built-in Wi-Fi and BLE are pre-certified. External 433 MHz and LoRa transmitters must operate within legal limits. [SRC-FCC]

**SAFETY RULE 6:** When in doubt, ask a licensed electrician. NEC compliance is not optional for permanent installations. A student project on a breadboard is one thing — wiring it into a wall is another. [SRC-NFPA, SRC-ESFI]

### 5.3 GFCI Protection

Ground-Fault Circuit Interrupter protection is required by NEC 210.8 in: kitchens, bathrooms, garages, outdoors, basements, laundry rooms, and within 6 feet of a sink. A GFCI detects current imbalance between hot and neutral (indicating current is flowing through an unintended path — possibly a person) and trips in 4-6 milliseconds. [SRC-NFPA, SRC-NEC-210]

**For smart home projects:** Any device installed in a GFCI-required location must be on a GFCI-protected circuit. This is non-negotiable and applies to: bathroom humidity sensors, kitchen relay switches, garage door controllers, outdoor weather stations.

### 5.4 Junction Box Requirements

Any connection involving mains voltage must be inside an approved junction box (steel or listed plastic). No exposed wire splices. Wire connections use wire nuts, push-in connectors, or Wago lever connectors. All boxes must be accessible (no burying behind drywall). Conductors must not exceed the box fill limit per NEC 314.16. [SRC-NFPA, SRC-NEC-314]

**Box fill calculation (simplified):** Each 14 AWG conductor counts as 2 cubic inches. Count all conductors entering the box, all ground wires as one conductor, each device yoke as two conductors. The total must not exceed the box's rated volume.

### 5.5 Grounding

Proper grounding provides a low-resistance path for fault current to flow to the earth, tripping the breaker or GFCI. In smart home projects, the metal junction box, the ground wire (bare copper or green), and the equipment ground all serve this purpose. Never defeat or remove the ground connection. [SRC-NFPA]

---

## 6. Power Supply Design

### 6.1 Choosing a Power Supply

| Project Type | Supply | Voltage | Current | Cost |
|-------------|--------|---------|---------|------|
| Arduino learning | USB A cable | 5V | 500 mA | Free (from phone charger) |
| ESP32 sensor node | USB micro/C | 5V | 1A | $3 |
| ESP32 + relay module | 5V adapter | 5V | 2A | $5 |
| LED strip (1m WS2812B) | 5V adapter | 5V | 4A | $8 |
| 12V motor + ESP32 | 12V adapter + buck | 12V + 5V | 2A | $8 |
| Raspberry Pi 5 | USB-C PD 27W | 5V | 5A | $10 |
| Battery sensor node | 18650 + TP4056 | 3.7V | Depends on cell | $5 |

### 6.2 Linear vs. Switching Regulators

**Linear (LM7805, AMS1117):** Simple, low noise, but waste power as heat. Efficiency = Vout/Vin. A 12V-to-5V LM7805 is only 42% efficient — 58% of input power becomes heat. Use only when current draw is low (<500 mA) or when noise-sensitive analog circuits need clean power. [SRC-ETUT]

**Switching (MP1584, LM2596, LM2596-based modules):** Complex but efficient (85-95%). Can step up (boost) or step down (buck) voltage. Generates switching noise (~150 kHz-1 MHz) that can affect ADC readings. Use for: LED strips, motor power, any high-current conversion. Add 100 nF ceramic capacitor at the output to reduce noise.

### 6.3 Battery Power

**18650 Li-ion cells:**
- Nominal voltage: 3.7V (range: 3.0V empty to 4.2V full)
- Capacity: 2000-3500 mAh
- Maximum charge rate: 1C (1A for a 1000mAh cell) unless datasheet specifies otherwise
- Requires TP4056 charging circuit with DW01 protection IC

> **SAFETY BLOCK [SC-BAT]:** Lithium-ion batteries store significant energy. A short circuit can deliver 10+ amps, causing rapid heating, venting, and potentially fire. Always use protected cells or external protection circuits (DW01). Never puncture, crush, or expose to temperatures above 60C. Store in a fireproof container during charging. [SRC-ESP32]

**Battery life estimation:**
- ESP32 deep sleep: ~10 uA
- ESP32 wake + Wi-Fi transmit: ~240 mA for ~2 seconds
- If waking every 5 minutes: average current ~1.6 mA
- 3000 mAh battery: ~1875 hours = ~78 days
- Adding a sensor (BME280): +0.3 mA during read, negligible impact on average

---

## 7. Concept Cross-Reference

| Concept | First Introduced | Reinforced In | Essential For |
|---------|-----------------|---------------|---------------|
| Ohm's Law (V=IR) | Section 1.1 | Every project BOM/circuit | All projects |
| Power budget (P=VI) | Section 1.2 | Projects 19-20 (LED/energy) | Power supply sizing |
| Voltage dividers | Section 1.5 | Projects 3, 11 (LDR, soil) | Analog sensor reading |
| Pull-up resistors | Section 1.6 | Projects 4, 8 (DHT), 21 (DS18B20) | Digital sensor reliability |
| Transistor switching | Section 2.3 | Projects 9, 13, 14, 18 (relays) | Actuator control |
| MOSFET switching | Section 2.3 | Project 20 (LED strips) | High-current DC loads |
| Flyback diodes | Section 2.4 | Every relay/motor project | Inductive load safety [SC-FLY] |
| Decoupling caps | Section 2.2 | Every project with ICs | Circuit reliability |
| I2C protocol | Section 3.3 | Projects 7, 24 (BME280) | Multi-sensor systems |
| PWM | Section 3.2 | Projects 5, 6, 20 | LED dimming, servo control |
| Interrupts | Section 3.4 | Projects 10, 19 (PIR, energy) | Event-driven systems |
| Mains safety | Section 5 | Projects 13, 14, 18, 19, 29, 35 | All Tier 3+ relay projects [SC-MAINS] |
| NEC Article 725 | Section 5.1 | Projects 13, 18, 31 | Low/line voltage boundary |
| GFCI | Section 5.3 | Projects in wet locations | NEC compliance [SC-MAINS] |
| Battery design | Section 6.3 | Projects 11, 30 | Portable sensor nodes [SC-BAT] |
