# Constant-Current Drivers & LED Strip Power

While resistors work for small indicator LEDs, higher-power applications demand constant-current drivers. This page covers why constant current is superior to constant voltage for LEDs, practical driver circuits, commercial driver ICs, and power supply sizing for LED strips.

---

## Constant Voltage vs Constant Current

### The Problem with Constant Voltage

An LED's I-V curve is exponential (see [LED Fundamentals](m1-led-fundamentals.md)). At the operating point, a small change in voltage produces a large change in current:

```
Voltage-controlled LED (simplified):

  V (volts)
  |            /
  |           / <-- Operating point
  |          /     A 5% voltage increase
  |         /      causes a 50-100% current increase
  |        /
  |_______/________
           I (current)
```

A constant-voltage source with a resistor provides some current regulation, but the resistor wastes power and provides poor regulation when headroom is limited.

### Why Constant Current Wins

A constant-current driver maintains a fixed current regardless of:

- **LED forward voltage variation** (batch-to-batch, temperature drift)
- **Supply voltage fluctuation** (ripple, brownout, battery discharge)
- **Temperature changes** (Vf decreases ~2mV/degree C)

The current is set, and the driver adjusts its output voltage to maintain it. This means:

- **Consistent brightness** across all LEDs
- **No thermal runaway risk** -- current cannot increase even if the LED heats up
- **Higher efficiency** -- switching regulators waste less power than linear resistors

---

## The LM317 as a Simple Current Source

The LM317 adjustable voltage regulator can be configured as a constant-current source with a single resistor:

```
                  LM317
               +---------+
  Vin (+) ---->| IN   OUT |---+---> To LED string
               |    ADJ   |   |
               +---------+   |
                    |         |
                    +---/\/\--+
                        R_set

  I_LED = 1.25V / R_set

  (The LM317 regulates to maintain 1.25V between OUT and ADJ)
```

### LM317 Current Source Design Table

| Desired Current | R_set Value | R_set Power | Notes |
|----------------|-------------|-------------|-------|
| 20mA | 62 ohms | 0.025W | Standard indicator LEDs |
| 50mA | 25 ohms | 0.063W | Bright indicators |
| 100mA | 12.5 ohms (use 12) | 0.15W | Small power LEDs |
| 350mA | 3.6 ohms | 0.44W | 1W high-power LED |
| 700mA | 1.8 ohms | 0.88W | 3W high-power LED |

> **SAFETY WARNING:** The LM317 is a linear regulator. It dissipates (Vin - Vout) * I as heat. At 350mA with 12V input driving a 3.2V white LED, the LM317 dissipates (12 - 3.2) * 0.35 = 3.08W. This requires a substantial heatsink. For high-power applications, prefer a switching driver. See [Thermal Management](m1-thermal-management.md).

### LM317 Circuit with LED String

```
                        LM317
  +12V ---[fuse]----->| IN   OUT |---+--- LED1 --- LED2 --- LED3 --- GND
                      |    ADJ   |   |    3.2V     3.2V     3.2V
                      +---------+   |
                           |        |
                           +--[R]---+
                             3.6R
                           (350mA)

  Vin headroom = 12 - (3 x 3.2) - 1.25 = 1.15V  (minimum for LM317)
  LM317 dropout: ~2V, so this is marginal.
  Better: use 2 LEDs in series, or use a 15V supply.
```

Advantages: Simple, cheap, self-protecting. Disadvantages: Linear (inefficient), needs heatsinking, minimum 3V dropout.

---

## Switching LED Driver ICs

For efficient high-power LED driving, switching (buck/boost) LED drivers are the standard. These operate at 85-95% efficiency compared to the LM317's 30-60%.

### Popular LED Driver ICs

| IC | Topology | Max Current | Vin Range | Features | Typical Application |
|----|----------|------------|-----------|----------|-------------------|
| AL8805 | Buck | 1A | 6-36V | SOT-89, simple | Single high-power LED |
| PT4115 | Buck | 1.2A | 6-30V | Dimming input | LED downlights |
| CAT4104 | Linear sink | 4x20mA | 3-5.5V | 4 channels | RGB LED strings |
| TLC5940 | PWM sink | 16x60mA | 3.3-5.5V | 12-bit PWM, daisy-chain | LED matrices |
| TPS92512 | Buck | 2.5A | 4.5-65V | Automotive grade | Vehicle lighting |
| LT3756 | Buck/Boost | 100W+ | 6-100V | Wide range | High-power arrays |

### AL8805 Application Circuit

The AL8805 is one of the simplest buck LED drivers, requiring only an inductor, diode, and sense resistor:

```
                    AL8805
  Vin (6-36V) --->| VIN    SW |---+
                  |           |   |
                  | GND   SET |   L (inductor)
                  +-----------+   |   100uH
                       |    |     |
                       |    R_s   +--- LED+ (string)
                       |    |     |
                       GND  GND   D (Schottky)
                                  |
                               LED- (string) --- GND

  I_LED = 0.1V / R_sense
  For 350mA: R_sense = 0.1 / 0.35 = 0.286 ohms (use 0.27 ohm)
```

This circuit is over 90% efficient and handles 6-36V input with up to 1A output. It switches at ~300kHz, keeping the inductor small.

---

## LED Strip Power Supply Sizing

### The 120% Rule

Always size your power supply at **120% of the calculated maximum load**. This accounts for:

- Inrush current at power-on (capacitors charging)
- Component tolerance (LEDs may draw slightly more than spec)
- Power supply derating at operating temperature
- Headroom for the supply to regulate properly

```
PSU_watts = Strip_watts_per_meter * Length_meters * 1.2
```

### Power Calculations by Strip Type

| Strip Type | V | W/m | 1m PSU | 2m PSU | 5m PSU | 10m PSU |
|-----------|---|-----|--------|--------|--------|---------|
| 3528 60/m | 12V | 4.8W | 6W | 12W | 29W | 58W |
| 5050 30/m | 12V | 7.2W | 9W | 18W | 44W | 87W |
| 5050 60/m | 12V | 14.4W | 18W | 35W | 87W | 173W |
| 2835 120/m | 24V | 19.2W | 24W | 47W | 115W | 230W |
| WS2812B 60/m | 5V | 18W | 22W | 44W | 108W | 216W |
| APA102 60/m | 5V | 18W | 22W | 44W | 108W | 216W |

### Worked Example: 5m RGB Strip Installation

```
Strip: 5050 RGB, 60 LEDs/m, 12V
Length: 5 meters
Power per meter: 14.4W (all channels full white)

Total load = 5 x 14.4 = 72W
With 120% margin = 72 x 1.2 = 86.4W

Current = 86.4 / 12 = 7.2A

Select: 12V 100W power supply (8.33A capacity)
This gives 100/72 = 139% margin -- excellent.
```

> **SAFETY WARNING:** LED power supplies converting from mains voltage (120/240V AC) must be properly rated, certified (UL/CE), and installed according to local electrical codes. Never use an uncertified power supply for permanent installations. Ensure all mains wiring is performed by qualified personnel.

---

## Power Supply Types

### Mean Well and Quality Supplies

Mean Well is the industry standard for LED power supplies. Their product lines:

| Series | Type | Environment | Efficiency | Dimming |
|--------|------|-------------|-----------|---------|
| LPV | Constant Voltage | IP67 waterproof | 86-90% | No |
| HLG | CV + CC | IP67 waterproof | 91-94% | 3-in-1 (1-10V, PWM, resistance) |
| ELG | CV + CC | IP67 waterproof | 91-93% | 3-in-1 + DALI |
| LRS | Constant Voltage | Indoor (open frame) | 89-91% | No |
| NPF | Constant Current | IP67 waterproof | 90-91% | Optional |

### Constant Voltage vs Constant Current Supplies

**Constant voltage (CV)** supplies output a fixed voltage (12V, 24V). The LED strip has onboard resistors that limit current. This is the standard for analog LED strips.

**Constant current (CC)** supplies output a fixed current (350mA, 700mA). The voltage floats to whatever the LED string needs. This is preferred for high-power LED arrays without onboard current limiting.

**CV + CC** supplies (like Mean Well HLG) operate in CV mode until the load reaches the CC limit, then switch to CC mode. This is the most versatile option.

---

## 12V vs 24V LED Strips

| Factor | 12V Strips | 24V Strips |
|--------|-----------|-----------|
| Current for same power | Higher (more voltage drop) | Lower (less voltage drop) |
| Max run length | ~5m before visible dimming | ~10m before visible dimming |
| Cut points | Every 3 LEDs | Every 6 LEDs |
| Wire gauge needed | Heavier (higher current) | Lighter (lower current) |
| Availability | Most common | Growing |
| Compatibility | More controllers available | Fewer options |

For runs longer than 5 meters, 24V strips are strongly recommended. For very long runs of either voltage, see [Power Injection](m3-power-injection.md).

---

## Multi-Channel LED Drivers

### RGB and RGBW Driving

RGB strips require three independent channels. RGBW strips require four. Each channel needs its own current path:

```
RGB Strip Internal Structure (per segment):

  +12V ----+----------+----------+
            |          |          |
           [R]        [R]        [R]    (onboard resistors)
            |          |          |
         [RED]      [GRN]      [BLU]    (LED dies in 5050 package)
            |          |          |
  R_out ----+  G_out --+  B_out --+     (common anode, channels switched to GND)
```

Each color channel is switched to ground by a MOSFET. For MOSFET-based dimming circuits, see [MOSFET PWM Dimmers](m5-mosfet-pwm-dimmers.md).

### Dedicated RGB Driver ICs

- **PCA9685** -- 16 channels, 12-bit PWM, I2C bus, 1.6kHz default (adjustable). Commonly used with Raspberry Pi or Arduino for multi-channel LED control.
- **TLC5947** -- 24 channels, 12-bit PWM, SPI interface. Adafruit breakout board available.
- **WS2811** -- External driver IC version of the WS2812 protocol. Drives one RGB LED or a group of single-color LEDs.

---

## Efficiency Comparison

| Driver Type | Efficiency | Heat Generated (at 10W load) | Best For |
|------------|-----------|------------------------------|----------|
| Resistor | 30-60% | 4-7W wasted | Indicators only |
| LM317 linear | 40-70% | 3-6W wasted | Simple low-power |
| AL8805 buck | 88-94% | 0.6-1.2W wasted | 1-3W LEDs |
| HLG-series SMPS | 91-94% | 0.6-0.9W wasted | Strip installations |

The difference is dramatic at scale. A 72W strip installation driven through resistors would waste 30-50W as heat. A proper switching supply wastes only 4-7W.

---

## Choosing a Driver Strategy

```
Decision tree:

Is the LED < 100mA?
  +-- Yes --> Resistor is fine. See Resistor Calculations.
  +-- No
       |
       Is total power < 3W?
         +-- Yes --> LM317 current source (simple, add heatsink)
         +-- No
              |
              Is it an LED strip with onboard resistors?
                +-- Yes --> Constant-voltage supply (12V/24V)
                |           Size at 120% of max load.
                +-- No
                     |
                     --> Switching constant-current driver IC
                         (AL8805, PT4115, or similar)
```

---

## Cross-References

- [LED Fundamentals](m1-led-fundamentals.md) -- I-V curve and why current limiting is needed
- [Resistor Calculations](m1-resistor-calculations.md) -- When a resistor is sufficient
- [Thermal Management](m1-thermal-management.md) -- Heatsinking for linear drivers and high-power LEDs
- [Power Injection](m3-power-injection.md) -- Wiring for long LED strip runs
- [MOSFET PWM Dimmers](m5-mosfet-pwm-dimmers.md) -- Switching RGB strip channels
- [WLED Setup](m5-wled-setup.md) -- Complete firmware solution for addressable strips

---

*Sources: Mean Well HLG/LPV datasheets, Texas Instruments LM317 application note (AN-1652), Diodes Inc AL8805 datasheet, Microchip AN1114 (Switch Mode LED Driver), Adafruit LED power guide, SparkFun constant-current driver tutorial.*
