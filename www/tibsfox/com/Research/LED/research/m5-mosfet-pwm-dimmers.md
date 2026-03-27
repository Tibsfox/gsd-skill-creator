# MOSFET-Based PWM Dimmers

A single N-channel MOSFET, driven by a microcontroller PWM output, is the simplest and most efficient way to dim a 12V or 24V LED strip. This page covers the circuit design, component selection, gate drive requirements, switching frequency trade-offs, and protection components. You will build a dimmer that handles 5A+ with less than 0.1W of switching loss.

---

## 1. Why MOSFETs for LED Dimming

### 1.1 The Problem

Microcontroller GPIO pins output 3.3V or 5V at 20-40 mA maximum. A typical 5-meter 12V LED strip draws 2-5A. You cannot connect the strip directly to a GPIO pin -- you need a power switch between the strip and its supply.

### 1.2 Why Not a BJT?

A bipolar junction transistor (BJT) requires continuous base current to stay on. At 5A collector current with a gain (hFE) of 100, the base needs 50 mA -- more than a GPIO can supply. A MOSFET, by contrast, is voltage-controlled: the gate draws essentially zero DC current. A 3.3V signal on the gate switches 10A+ through the drain-source channel.

### 1.3 MOSFET Types

| Type | Gate Drive | Use Case |
|------|-----------|----------|
| N-channel, low-side | Gate referenced to GND | Simplest LED dimmer (this page) |
| P-channel, high-side | Gate referenced to V+ | High-side switching (inverted logic) |
| N-channel, high-side | Requires bootstrap/charge pump | Motor drivers, H-bridges |

For LED strip dimming, **N-channel low-side switching** is almost always the correct choice. The MOSFET sits between the LED strip's ground return and the power supply ground.

---

## 2. Circuit Design

### 2.1 Basic N-Channel Low-Side PWM Dimmer

```
        +12V DC Power Supply
            |
            +------------------+
            |                  |
       [ LED Strip ]           |
       (12V, up to 5A)        |
            |                  |
            +--- Drain         |
            |                  |
       [ IRLZ44N ]            |
       N-ch MOSFET             |
            |                  |
            +--- Source -------+--- GND (shared)
            |
       Gate |
            |
  [330 ohm] R1
            |
  MCU PWM --+
  (GPIO)    |
            |
  [10K ohm] R2
            |
           GND
```

**Component roles:**
- **IRLZ44N MOSFET:** Switches the ground path of the LED strip on and off at PWM frequency
- **R1 (330 ohm):** Limits gate charge current spike, protects GPIO from ringing
- **R2 (10K ohm):** Pull-down resistor keeps gate LOW when MCU pin is floating (during boot/reset)

### 2.2 With Freewheeling Diode (Inductive Loads)

LED strips have some parasitic inductance from the long copper traces. When the MOSFET turns off, the collapsing magnetic field generates a voltage spike (inductive kickback). A freewheeling diode clamps this spike.

```
        +12V DC
            |
            +----+-------------+
            |    |             |
       [ LED Strip ]      [1N5819]
       (12V, 5A)          Schottky
            |    |        Diode
            |    +----->|--+
            |                  |
            +--- Drain         |
            |                  |
       [ IRLZ44N ]            |
            |                  |
            +--- Source -------+--- GND
            |
       Gate |
            |
  [330 ohm]-+
            |
  MCU PWM --+
            |
  [10K ohm]-+
            |
           GND
```

The 1N5819 Schottky diode is placed across the LED strip (cathode to +12V, anode to drain). When the MOSFET turns off, current from the strip's inductance flows through the diode instead of spiking the drain voltage. For short LED strips (<2m), the inductance is negligible and the diode is optional but good practice.

> **SAFETY WARNING:** This circuit controls low-voltage DC (12V or 24V) only. Never use this circuit to switch mains AC voltage. Mains AC dimming requires specialized triac or SSR circuits designed and installed by a licensed electrician. See also [WLED Firmware Setup](m5-wled-setup.md) for low-voltage-only power supply selection.

---

## 3. MOSFET Selection

### 3.1 IRLZ44N Datasheet Key Values

The IRLZ44N is a logic-level N-channel MOSFET -- meaning its gate threshold voltage is low enough to be fully turned on by 3.3V or 5V logic.

| Parameter | Value | Significance |
|-----------|-------|--------------|
| V_DS (max) | 55V | Maximum drain-source voltage |
| I_D (continuous) | 47A | Maximum continuous drain current at 25C |
| R_DS(on) at V_GS=5V | 0.022 ohm | On-resistance at 5V gate drive |
| R_DS(on) at V_GS=4V | 0.028 ohm | On-resistance at 4V gate drive |
| R_DS(on) at V_GS=2.5V | 0.045 ohm | On-resistance at 2.5V (marginal for 3.3V MCUs) |
| V_GS(th) | 1.0-2.0V | Gate threshold (begins to conduct) |
| Q_g (total gate charge) | 48 nC | Total charge to fully switch gate |
| Package | TO-220 | Through-hole, requires heatsink above ~3A |

**Power dissipation at 5A with 5V gate drive:**
`P = I^2 * R_DS(on) = 5^2 * 0.022 = 0.55W`

This is low enough for a TO-220 package without a heatsink in open air. At 10A: `P = 10^2 * 0.022 = 2.2W` -- add a small heatsink.

### 3.2 3.3V Gate Drive Considerations

At V_GS = 3.3V, the IRLZ44N is conducting but not fully enhanced. R_DS(on) is higher, meaning more heat. For ESP32 (3.3V GPIO) driving strips above 3A, consider these alternatives:

| MOSFET | R_DS(on) at 2.5V | R_DS(on) at 4.5V | I_D max | Notes |
|--------|-------------------|-------------------|---------|-------|
| IRLZ44N | 0.045 ohm | 0.022 ohm | 47A | Classic choice, marginal at 3.3V |
| IRL3803 | 0.006 ohm | 0.006 ohm | 140A | Excellent at 3.3V, overkill current |
| IRLB8721 | 0.009 ohm | 0.008 ohm | 62A | Best balance for 3.3V + high current |
| AO3400A | 0.040 ohm | 0.028 ohm | 5.7A | SOT-23 SMD, good for <3A |

### 3.3 Non-Logic-Level MOSFETs (Avoid)

Standard (non-logic-level) MOSFETs like the IRF540N have gate threshold voltages of 2-4V and require 10V gate drive for full enhancement. They will **not** work reliably with 3.3V or 5V MCU outputs. Always verify the datasheet R_DS(on) specification at your actual gate voltage.

---

## 4. PWM Frequency Selection

### 4.1 Frequency vs. Perception

The PWM frequency determines how fast the MOSFET switches on and off. The LED strip responds by flickering at that frequency, but if the frequency is high enough, the human eye perceives a steady brightness proportional to the duty cycle.

| Frequency | Perception | Use Case |
|-----------|-----------|----------|
| < 100 Hz | Visible flicker | Never use for LEDs |
| 100-200 Hz | Some people see flicker, especially in peripheral vision | Minimum acceptable |
| 500-1000 Hz | No visible flicker | Good for static installations |
| 1-5 kHz | Flicker-free, mild audible whine possible | General purpose |
| 20-25 kHz | Completely imperceptible, no camera banding | Video/photography environments |
| > 50 kHz | Increased switching losses, EMI | Unnecessary for LEDs |

### 4.2 Camera Banding

If the LED strip will be visible in video recordings, PWM flicker causes rolling dark bands in the footage. Frequencies above 20 kHz eliminate this completely. Some cameras with electronic shutters can detect flicker up to 10 kHz.

### 4.3 Switching Losses

Every time the MOSFET transitions between on and off, it briefly passes through the linear region where both voltage across it (V_DS) and current through it (I_D) are nonzero. Power is dissipated during this transition.

```
Switching loss per cycle:
  P_sw = 0.5 * V_DS * I_D * (t_rise + t_fall) * frequency

Example: 12V, 5A, t_rise=20ns, t_fall=20ns, 25kHz:
  P_sw = 0.5 * 12 * 5 * 40e-9 * 25000 = 0.03W
```

At 25 kHz with the IRLZ44N, switching losses are negligible. They only become significant above 100 kHz or with very high-capacitance MOSFETs.

### 4.4 Setting PWM Frequency in Code

```
// Arduino Uno: Timer 1 on pins 9,10 - set to 25kHz
void setup() {
  // Set Timer1 to Fast PWM, TOP=ICR1
  TCCR1A = _BV(COM1A1) | _BV(WGM11);
  TCCR1B = _BV(WGM13) | _BV(WGM12) | _BV(CS10);  // No prescaler
  ICR1 = 639;  // 16MHz / 639 = ~25kHz

  pinMode(9, OUTPUT);
  // Set duty cycle (0-639):
  OCR1A = 320;  // 50% duty
}

// ESP32: LEDC peripheral - any frequency up to 40MHz
void setup() {
  ledcAttach(25, 25000, 10);  // GPIO 25, 25kHz, 10-bit resolution
  ledcWrite(25, 512);         // 50% duty (0-1023)
}

// Raspberry Pi Pico (RP2040): hardware PWM
void setup() {
  analogWriteFreq(25000);  // 25kHz
  analogWriteRange(1024);  // 10-bit resolution
  analogWrite(GP0, 512);   // 50% duty
}
```

See [Arduino LED Control & PWM](m2-arduino-led-control.md) for detailed timer register explanations.

---

## 5. Multi-Channel RGB Dimming

### 5.1 Three-MOSFET RGB Circuit

For analog RGB LED strips (4-wire: +12V, R, G, B), use one MOSFET per color channel:

```
          +12V DC
           |
     +-----+-----+-----+
     |     |     |     |
   [R LED] [G LED] [B LED]    <- RGB strip common anode
     |     |     |     |
     D     D     D            <- Drain of each MOSFET
     |     |     |
  [IRLZ44N] [IRLZ44N] [IRLZ44N]
     |     |     |
     S     S     S
     |     |     |
     +-----+-----+--- GND

  Gate connections (via 330 ohm each):
  GPIO 9  -> R MOSFET gate
  GPIO 10 -> G MOSFET gate
  GPIO 11 -> B MOSFET gate

  10K pull-down on each gate to GND
```

### 5.2 RGBW Strips

RGBW strips add a dedicated white channel (5-wire: +12V, R, G, B, W). Add a fourth MOSFET. The white channel provides better color rendering index (CRI) for warm/neutral white tones than mixing R+G+B.

### 5.3 Color Mixing Code

```
// Arduino: 3-channel RGB dimmer
const int pinR = 9, pinG = 10, pinB = 11;

void setColor(uint8_t r, uint8_t g, uint8_t b) {
  analogWrite(pinR, r);  // 0-255
  analogWrite(pinG, g);
  analogWrite(pinB, b);
}

void loop() {
  setColor(255, 100, 0);   // Warm amber
  delay(3000);
  setColor(0, 50, 255);    // Cool blue
  delay(3000);
  setColor(255, 200, 150); // Warm white
  delay(3000);
}
```

---

## 6. High-Side Switching with Bootstrap Driver

### 6.1 When You Need High-Side Switching

Low-side switching (MOSFET between load and ground) works perfectly for single-color and RGB strips. However, some architectures require high-side switching (MOSFET between supply and load):

- Common-cathode LED configurations
- Hot-swap power control
- Load sharing between multiple supplies

### 6.2 The Bootstrap Problem

An N-channel MOSFET requires V_GS > V_th to turn on. In high-side position, the source terminal sits at nearly +12V when on. The gate needs to be driven to 12V + V_th = ~14V. A 3.3V or 5V MCU cannot do this directly.

### 6.3 IR2110 Bootstrap Driver

The IR2110 is a half-bridge gate driver IC that uses a bootstrap capacitor to generate the high-side gate voltage:

```
           +12V
            |
         Drain (Q1 - high-side N-ch MOSFET)
            |
  IR2110 HO-+--Gate (Q1)
            |
         Source (Q1)
            |
            +--- Load (LED strip)
            |
         Drain (Q2 - low-side N-ch MOSFET)
            |
  IR2110 LO-+--Gate (Q2)
            |
         Source (Q2)
            |
           GND

  Bootstrap circuit:
  +12V ---[D_boot]---+---[C_boot 10uF]--- VS pin
                      |
                    VB pin
```

The bootstrap capacitor charges through the diode when the low-side MOSFET is on (VS pin at ground). When the high-side MOSFET turns on, the capacitor provides the gate charge, floating the VB pin to ~24V above ground -- enough to fully enhance the high-side gate.

> **SAFETY WARNING:** Bootstrap driver circuits involve voltages exceeding the supply rail. The bootstrap capacitor voltage can reach V_supply + V_boot. Ensure all components are rated for the maximum voltage. Use ceramic capacitors (not electrolytic) for the bootstrap capacitor to handle the high-frequency charge/discharge cycles.

For most LED strip dimming applications, low-side switching is simpler, cheaper, and entirely adequate. Use bootstrap drivers only when the circuit architecture specifically requires high-side switching.

---

## 7. Protection and Reliability

### 7.1 Input Capacitor

Place a large electrolytic capacitor (1000 uF, 25V) across the power supply input to the LED strip. This absorbs current spikes when the strip switches on at high duty cycle and prevents the supply voltage from sagging.

> **SAFETY WARNING:** Electrolytic capacitors are polarized. The negative lead (marked with a stripe) MUST connect to ground. Reversed polarity causes the capacitor to heat, swell, and potentially rupture violently. Always verify polarity before applying power.

### 7.2 Snubber Network

For very fast switching (>50 kHz) or long wire runs (>3m between MOSFET and strip), ringing can occur at the drain node. A simple RC snubber damps this:

```
  Drain ---+--- [100 ohm] ---+--- [1nF ceramic cap] --- Source
           |                  |
        (to strip)         (snubber)
```

### 7.3 Thermal Management

| Current | R_DS(on)=0.022 | Power | Heatsink? |
|---------|----------------|-------|-----------|
| 1A | 0.022W | No | |
| 3A | 0.198W | No | |
| 5A | 0.55W | Optional | Small clip-on |
| 10A | 2.2W | Yes | TO-220 heatsink + thermal pad |
| 15A | 4.95W | Yes | Large heatsink or active cooling |

The IRLZ44N TO-220 package can dissipate ~2W without a heatsink in still air (thermal resistance junction-to-ambient: ~62 C/W). At 2.2W (10A), junction temperature rises 136C above ambient -- exceeding the 175C maximum. A small heatsink (thermal resistance ~20 C/W) drops the rise to 44C above ambient.

### 7.4 Wire Gauge

| Current | Minimum Wire Gauge | Voltage Drop per Meter (12V) |
|---------|-------------------|------------------------------|
| 2A | 22 AWG | 0.11V |
| 5A | 18 AWG | 0.11V |
| 10A | 14 AWG | 0.10V |
| 15A | 12 AWG | 0.10V |

Use the thickest practical wire between the power supply and the LED strip. Voltage drop in thin wires causes LEDs at the far end of the strip to appear dimmer. See [Power Injection & Strip Wiring](m3-power-injection.md) for detailed wire gauge tables and injection strategies.

---

## 8. 24V Strip Considerations

24V LED strips are common in commercial installations. The higher voltage means half the current for the same wattage, allowing thinner wires and longer runs. The same MOSFET circuit works -- the IRLZ44N is rated for 55V, well above 24V.

The only change: use a 35V or 50V electrolytic capacitor instead of 25V for the input capacitor.

---

## 9. Complete Bill of Materials

| Component | Value | Purpose | Cost |
|-----------|-------|---------|------|
| IRLZ44N (or IRLB8721) | N-ch MOSFET, TO-220 | Power switching | $1-2 |
| Resistor | 330 ohm, 1/4W | Gate current limiter | $0.05 |
| Resistor | 10K ohm, 1/4W | Gate pull-down | $0.05 |
| 1N5819 | Schottky diode, 1A | Freewheeling diode | $0.10 |
| Electrolytic capacitor | 1000 uF, 25V | Input filter | $0.30 |
| 12V LED strip | 5m, 60 LED/m | The load | $5-15 |
| 12V 5A power supply | Regulated SMPS | Strip power | $5-10 |
| Arduino Nano / ESP32 | Microcontroller | PWM generation | $3-6 |
| Perfboard or PCB | Standard | Mount components | $1-3 |
| **Total** | | | **~$16-37** |

---

## 10. Cross-References

- [Arduino LED Control & PWM](m2-arduino-led-control.md) -- PWM timer configuration and analogWrite fundamentals
- [WLED Firmware Setup](m5-wled-setup.md) -- use WLED for addressable LED control instead of analog dimming
- [IR & RF Remote Control](m5-ir-rf-remote.md) -- add remote control to your MOSFET dimmer
- [Power Injection & Strip Wiring](m3-power-injection.md) -- wire gauge, voltage drop, and injection points for long runs
- [LED Electronics Fundamentals](m1-led-fundamentals.md) -- Ohm's law, power calculations, and LED forward voltage
- [Thermal Management & Power Design](m1-thermal-management.md) -- heatsink calculations and thermal resistance
- [Glossary](00-glossary.md) -- MOSFET, PWM, duty cycle, gate threshold voltage definitions

---

*Sources: International Rectifier IRLZ44N datasheet, Infineon IRLB8721PBF datasheet, International Rectifier IR2110 application notes, Texas Instruments "MOSFET Gate Drive" application report (SLUA618), Adafruit NeoPixel Uberguide (power supply section)*
