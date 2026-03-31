# S-Meter: Signal Strength Indicator — Progressive Radio Circuit #22

## Mission Connection

The Mercury tracking network used signal strength to confirm Aurora 7's position during each orbital pass. As the spacecraft traversed each ground station's coverage zone, the received signal rose, peaked, and fell — a bell curve traced in radio energy. Ground controllers at fourteen stations around the globe watched their S-meters climb as Carpenter's capsule appeared over the horizon, peak at closest approach, and drop as Aurora 7 receded. The S-meter made the invisible visible: radio waves translated into meter deflection, signal presence into needle position. This is exactly what green fluorescent protein does for molecular biology — making the invisible (protein location inside a living cell) visible (fluorescent glow under UV). Same principle, vastly different domains. This circuit connects directly to v1.21's BFO: the BFO provides the carrier reinsertion for CW/SSB signals, and the S-meter tells the operator how strong those signals are before they reach the detector chain.

## Circuit Overview

A DC amplifier that reads the AGC (Automatic Gain Control) voltage from a receiver's IF stage and drives a panel meter to indicate received signal strength. The AGC voltage is inversely proportional to signal strength — stronger signals produce lower AGC voltage as the receiver reduces gain. This circuit inverts and logarithmically compresses that voltage to drive a 100 uA meter movement with a scale reading that increases with signal strength and maps linearly to S-units.

**What it does:**
- Reads the 0-6V DC AGC voltage from the IF amplifier / AGC circuit (v1.19)
- Inverts the voltage so the meter reads UP for stronger signals
- Logarithmic compression via a BJT's exponential V_BE-I_C characteristic maps the wide dynamic range (48 dB from S1 to S9) into a linear meter deflection
- Emitter follower buffer drives a 100 uA panel meter without loading the log stage
- Calibration potentiometer sets the S9 reference point to 50 uV at the antenna
- Protection diodes prevent meter damage from transient voltage spikes

**What it teaches:** Signal strength measurement is fundamentally a problem of dynamic range compression. The signals a receiver encounters span a range from S1 (approximately 0.2 uV) to S9+60 dB (50 mV) — a factor of 250,000 in voltage, or 108 dB in power. No linear meter can display this range meaningfully. The logarithmic amplifier compresses the range so that each S-unit occupies an equal arc of the meter scale, making the display useful across the entire range. This is the same principle behind the decibel scale itself, the Richter scale for earthquakes, and the magnitude scale for stars — human perception of intensity is logarithmic, so the measurement should be too.

**Total cost: ~$5**

---

## Schematic

```
  S-Meter Circuit — AGC-Driven Signal Strength Indicator

  Input: AGC voltage from IF amplifier (0-6V DC)
         Strong signal -> low AGC voltage (~0.5V)
         Weak signal   -> high AGC voltage (~5.5V)

  Inverting Amplifier (Q1 — BC547):

    AGC In
      |
    [R1 10KOhm] (input resistor, sets input impedance)
      |
    Q1 Base
      |
    [R_bias 100KOhm] ---- +12V (establishes base DC bias)
      |
    Q1 Emitter
      |
    [R3 4.7KOhm] (emitter degeneration, sets voltage gain)
      |
     GND

    Q1 Collector
      |
    [R2 22KOhm] (collector load)
      |
    +12V

    Operation:
      High AGC (weak signal) -> Q1 conducts harder -> collector drops
      Low AGC (strong signal) -> Q1 conducts less -> collector rises
      Collector voltage is now proportional to signal strength

  Logarithmic Amplifier (Q2 — BC547):

    Q1 Collector
         |
      [C_couple 1uF] (blocks DC, passes AGC variations)
         |
    Q2 Base ----[R_log 47KOhm]---- Q2 Collector
         |
    Q2 Collector
         |
    [R4 1KOhm] (calibration range resistor)
         |
    [VR1 10KOhm] (S9 calibration trim pot, wiper to collector side)
         |
    +12V

    Q2 Emitter
         |
    [R_E2 2.2KOhm]
         |
       GND

    Log response:
      V_BE = (kT/q) * ln(I_C / I_S)
      At 25C: kT/q = 25.85 mV
      I_S ~ 10^-14 A for BC547
      Output voltage is logarithmic function of input current
      Maps 48 dB (S1-S9) into ~120 mV range at the emitter

  Emitter Follower Buffer (Q3 — BC547):

    Q2 Emitter
         |
    [C2 10uF] (couples AC + slow DC variations)
         |
    Q3 Base
         |
    [R_B3 47KOhm] ---- +12V (bias)
         |
    Q3 Collector ---- +12V
    Q3 Emitter
         |
    [R5 1KOhm] (sets output impedance)
         |
         +----[D1 1N4148]----+---- M1 (100uA meter)
         |    (forward)      |          |
         +----[D2 1N4148]----+         GND
              (reverse)
         |
        GND

    D1 and D2 are anti-parallel across the meter:
      They clamp voltage across M1 to +/- 0.6V,
      preventing damage from transient spikes.
      At normal operation, meter current << diode
      forward current threshold, so diodes do not
      conduct and do not affect the reading.

  Power Supply Decoupling:

    +12V Rail
         |
       [C1 100uF] electrolytic (positive to +12V)
         |
        GND

  Complete Signal Path:

    AGC voltage (from v1.19 AGC circuit)
         |
    [R1 10K] -> Q1 inverting amplifier -> [R2 22K]
                     |
               [C_couple 1uF]
                     |
              Q2 log amplifier (V_BE compression)
                     |
              [C2 10uF]
                     |
              Q3 emitter follower buffer
                     |
              [R5 1K] -> [D1,D2] -> M1 meter
                                      |
                                    S1----S9+
```

## Bill of Materials

| Qty | Part | Value | Cost |
|-----|------|-------|------|
| 3 | BC547 NPN transistors | (Q1, Q2, Q3) | $0.30 |
| 1 | Panel meter | 100 uA full-scale deflection | $1.50 |
| 2 | 1N4148 signal diodes | (meter protection) | $0.10 |
| 1 | Electrolytic capacitor | 100 uF / 25V (C1, decoupling) | $0.10 |
| 1 | Electrolytic capacitor | 10 uF / 25V (C2, coupling) | $0.05 |
| 1 | Electrolytic capacitor | 1 uF / 25V (C_couple) | $0.05 |
| 1 | Resistor | 10 KOhm (R1, input) | $0.05 |
| 1 | Resistor | 22 KOhm (R2, collector load) | $0.05 |
| 1 | Resistor | 4.7 KOhm (R3, emitter degeneration) | $0.05 |
| 1 | Resistor | 1 KOhm (R4, calibration range) | $0.05 |
| 1 | Resistor | 2.2 KOhm (R_E2, Q2 emitter) | $0.05 |
| 1 | Resistor | 47 KOhm (R_log, log feedback) | $0.05 |
| 1 | Resistor | 100 KOhm (R_bias, Q1 base bias) | $0.05 |
| 1 | Resistor | 47 KOhm (R_B3, Q3 base bias) | $0.05 |
| 1 | Resistor | 1 KOhm (R5, meter series) | $0.05 |
| 1 | Trim potentiometer | 10 KOhm (VR1, S9 calibration) | $0.30 |
| 1 | Small breadboard section | | $1.00 |
| -- | Jumper wires | | $0.50 |
| **Total** | | | **~$5** |

## Assembly Instructions

1. **Insert Q1 (BC547)** into the breadboard. Connect the collector to +12V through R2 (22 KOhm). Connect the emitter to ground through R3 (4.7 KOhm). Wire R_bias (100 KOhm) from +12V to the base. Wire R1 (10 KOhm) from the AGC input point to the base. This is the inverting amplifier — verify with a multimeter that the collector sits at roughly 6-8V with no input.

2. **Insert Q2 (BC547)** for the logarithmic stage. Connect the emitter to ground through R_E2 (2.2 KOhm). Wire R_log (47 KOhm) from the base to the collector — this feedback resistor, combined with Q2's exponential V_BE characteristic, creates the logarithmic compression. Wire R4 (1 KOhm) in series with VR1 (10 KOhm trim pot) from the collector to +12V.

3. **Couple Q1 to Q2.** Connect C_couple (1 uF electrolytic, positive toward Q1 collector) between Q1's collector and Q2's base.

4. **Insert Q3 (BC547)** as the emitter follower buffer. Connect the collector directly to +12V. Wire R_B3 (47 KOhm) from +12V to the base. Connect the emitter to ground through R5 (1 KOhm).

5. **Couple Q2 to Q3.** Connect C2 (10 uF electrolytic, positive toward Q2) between Q2's emitter and Q3's base.

6. **Install the meter.** Connect M1 (100 uA panel meter) between Q3's emitter and ground. Wire D1 and D2 (1N4148) anti-parallel across the meter terminals — one forward, one reverse. These clamp any transient voltage to 0.6V and protect the delicate meter movement.

7. **Decouple the supply.** Wire C1 (100 uF electrolytic) from the +12V rail to ground, as close to the circuit as possible.

8. **Calibrate.** Apply a known S9 signal (50 uV at the antenna, or use a signal generator into the receiver). Adjust VR1 until the meter reads at the S9 mark. All other S-unit readings will fall into place automatically because the logarithmic compression is set by Q2's physics, not by external components.

9. **Test the range.** Vary the input signal from S1 to S9+20 dB. The meter should sweep smoothly from low to high, with approximately equal spacing per S-unit across the S1-S9 range.

---

## Theory

### S-Units and the Decibel Scale

The S-unit system divides signal strength into a logarithmic scale where each S-unit represents a 6 dB increase in signal power — a factor of 4 in power, or a factor of 2 in voltage. The IARU Region 2 standard defines S9 as 50 uV at the antenna terminals on HF frequencies.

Working backwards from S9:

| S-Unit | Voltage at Antenna | Power (relative to S9) |
|--------|--------------------|------------------------|
| S1 | 0.20 uV | -48 dB |
| S2 | 0.40 uV | -42 dB |
| S3 | 0.78 uV | -36 dB |
| S4 | 1.56 uV | -30 dB |
| S5 | 3.13 uV | -24 dB |
| S6 | 6.25 uV | -18 dB |
| S7 | 12.5 uV | -12 dB |
| S8 | 25.0 uV | -6 dB |
| S9 | 50.0 uV | 0 dB (reference) |
| S9+10 | 158 uV | +10 dB |
| S9+20 | 500 uV | +20 dB |
| S9+40 | 5.0 mV | +40 dB |
| S9+60 | 50 mV | +60 dB |

The total range from S1 to S9+60 dB spans a voltage ratio of 250,000:1. No linear meter can display this meaningfully — the needle would sit at zero for everything below S9+40 and slam to full scale above. Logarithmic compression is not optional; it is the only way to make the meter useful.

### The Logarithmic Amplifier

The key to this circuit is Q2's base-emitter junction. A BJT's collector current relates to its base-emitter voltage by the Ebers-Moll equation:

    I_C = I_S * exp(V_BE * q / (kT))

Rearranging for V_BE:

    V_BE = (kT/q) * ln(I_C / I_S)

At room temperature (25 C), kT/q = 25.85 mV. This means a tenfold change in collector current produces a V_BE change of only 25.85 * ln(10) = 59.5 mV. A hundredfold change in current produces 119 mV. A hundred-thousandfold change (the S1-to-S9+60 range) produces only 298 mV. The transistor's exponential characteristic naturally compresses the enormous dynamic range into a small, manageable voltage swing that a meter can display.

The R_log feedback resistor (47 KOhm) from base to collector linearizes the log response and sets the operating region. Without it, Q2 would saturate at high signal levels. With it, the feedback forces the transistor to operate across a wider range of collector currents, maintaining the logarithmic relationship.

### Connection to the Progressive Radio Series

This S-meter reads the AGC voltage that the AGC circuit (v1.19) generates in response to signal strength. The AGC loop works to keep the IF output constant — when a strong signal arrives, the AGC reduces gain; when a weak signal arrives, the AGC increases gain. The S-meter taps the AGC control voltage as a proxy for signal strength: the harder the AGC has to work to reduce gain, the stronger the incoming signal.

| Mission | Circuit | Role in S-Meter Context |
|---------|---------|------------------------|
| v1.9 | AGC (basic) | First gain control — S-meter reads this voltage |
| v1.16 | AGC Time Constant | Attack/release shaping — affects meter ballistics |
| v1.19 | AGC Circuit (JFET) | Provides the control voltage the S-meter reads |
| v1.20 | Squelch Circuit | Uses signal strength threshold — S-meter visualizes it |
| v1.21 | BFO | Provides carrier for CW/SSB — S-meter shows signal before detection |
| **v1.22** | **S-Meter** | **Makes signal strength visible — this circuit** |
| v1.23+ | PLL / VFO | Frequency synthesis — S-meter monitors across the band |

The S-meter sits at the monitoring layer of the receiver: it does not process the signal, but it tells the operator what the receiver is seeing. In the Mercury tracking network, this was the difference between knowing Aurora 7 was in range and guessing. Every ground station watched their signal strength indicators rise and fall with each orbital pass, confirming spacecraft position and link quality in real time.

---

## Classroom Extensions

1. **AGC voltage mapping.** Connect a potentiometer to simulate AGC voltage (0-6V). Measure the meter deflection at 0.5V intervals. Plot AGC voltage vs. meter reading — the curve should be logarithmic. Calculate the slope in mV per S-unit.

2. **Temperature sensitivity.** The logarithmic amplifier depends on kT/q, which increases with temperature. Heat Q2 gently with a soldering iron held nearby (do not touch) and observe the meter reading drift. Calculate the expected drift: at 25 C, kT/q = 25.85 mV; at 35 C, kT/q = 26.57 mV — a 2.8% change. Does the measured drift match?

3. **LED bar graph alternative.** Replace the panel meter with a LM3914 dot/bar display driver and ten LEDs. The LM3914 has a built-in logarithmic mode. Compare its step response to the analog meter — which gives a more useful reading during rapid signal fading?

4. **Mercury pass simulation.** Program an Arduino to output a voltage ramp that simulates Aurora 7 passing over a ground station: slow rise over 3 minutes, peak for 30 seconds, slow fall over 3 minutes. Feed this into the S-meter circuit and watch the needle trace Carpenter's orbital path.

5. **Dynamic range measurement.** Using a signal generator, determine the actual usable range of the S-meter circuit. At what input level does the meter reach full scale? At what level does the needle stop responding? Calculate the dynamic range in dB. Compare to the theoretical 48 dB (S1 to S9) that the meter should cover.
