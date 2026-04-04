# S-Meter: Signal Strength Indicator — Progressive Radio Circuit #22

## Mission Connection

The Mercury tracking network used signal strength to confirm Aurora 7's position during each orbital pass. As the spacecraft traversed each ground station's coverage zone, the received signal rose, peaked, and fell -- a bell curve traced in radio energy. Ground controllers at fourteen stations watched their S-meters climb as Carpenter's capsule appeared over the horizon, peak at closest approach, and drop as Aurora 7 receded. The S-meter made the invisible visible: radio waves translated into meter deflection, signal presence into needle position. This is exactly what green fluorescent protein does for molecular biology -- making the invisible (protein location inside a living cell) visible (fluorescent glow under UV). Same principle, vastly different domains. This circuit connects directly to v1.21's BFO: the BFO provides the carrier reinsertion for CW/SSB signals, and the S-meter tells the operator how strong those signals are before they reach the detector chain.

## Circuit Overview

A DC amplifier that reads the AGC (Automatic Gain Control) voltage from a receiver's IF stage and drives a panel meter to indicate received signal strength. The AGC voltage is inversely proportional to signal strength -- stronger signals produce lower AGC voltage as the receiver reduces gain. This circuit inverts and logarithmically compresses that voltage to drive a 100 uA meter movement with a scale reading that increases with signal strength and maps linearly to S-units.

**What it does:**
- Reads the 0-6V DC AGC voltage from the IF amplifier / AGC circuit (v1.19)
- Inverts the voltage so the meter reads UP for stronger signals
- Logarithmic compression via a BJT's exponential V_BE-I_C characteristic maps the wide dynamic range (48 dB from S1 to S9) into a linear meter deflection
- Emitter follower buffer drives a 100 uA panel meter without loading the log stage
- Calibration potentiometer sets the S9 reference point to 50 uV at the antenna
- Protection diodes prevent meter damage from transient voltage spikes

**What it teaches:** Signal strength measurement is fundamentally a problem of dynamic range compression. The signals a receiver encounters span from S1 (0.2 uV) to S9+60 dB (50 mV) -- a factor of 250,000 in voltage. No linear meter can display this range. The logarithmic amplifier compresses it so each S-unit occupies an equal arc of the meter scale. Same principle as the decibel scale, the Richter scale, and stellar magnitudes -- human perception of intensity is logarithmic, so the measurement should be too.

**Total cost: ~$5**

---

## Schematic Description

- **Input:** AGC voltage from IF amplifier, 0-6V DC. Strong signal produces low AGC (~0.5V), weak signal produces high AGC (~5.5V).
- **R1 (10 KOhm):** Input resistor from AGC line to Q1 base. Sets input impedance.
- **R_bias (100 KOhm):** From +12V to Q1 base. Establishes DC operating point.
- **Q1 (BC547):** Common-emitter inverting amplifier. High AGC drives the collector down; low AGC lets the collector rise. Collector voltage becomes proportional to signal strength.
- **R2 (22 KOhm):** Q1 collector load to +12V.
- **R3 (4.7 KOhm):** Q1 emitter to ground. Emitter degeneration sets voltage gain at approximately R2/R3 = 4.7.
- **C_couple (1 uF):** AC coupling from Q1 collector to Q2 base. Blocks DC bias, passes AGC variations.
- **Q2 (BC547):** Logarithmic amplifier. R_log (47 KOhm) from base to collector creates feedback that exploits the BJT's exponential V_BE-I_C relationship: V_BE = (kT/q) * ln(I_C / I_S). At 25 C, kT/q = 25.85 mV. Maps 48 dB dynamic range into ~120 mV at the emitter.
- **R4 (1 KOhm) + VR1 (10 KOhm trim pot):** Q2 collector load to +12V. VR1 sets the S9 calibration point.
- **R_E2 (2.2 KOhm):** Q2 emitter to ground.
- **C2 (10 uF):** Couples Q2 emitter to Q3 base.
- **Q3 (BC547):** Emitter follower buffer. Collector to +12V, R_B3 (47 KOhm) biases the base from +12V. Presents high impedance to Q2, low impedance to the meter.
- **R5 (1 KOhm):** Q3 emitter series resistor. Sets output impedance and meter current range.
- **D1, D2 (1N4148):** Anti-parallel across the meter terminals. Clamp transients to 0.6V, protecting the delicate 100 uA movement.
- **M1:** 100 uA full-scale panel meter.
- **C1 (100 uF):** Power supply decoupling, +12V to ground.

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

1. **Build Q1 inverting amplifier.** Insert Q1 (BC547). Wire R2 (22 KOhm) from collector to +12V, R3 (4.7 KOhm) from emitter to ground, R_bias (100 KOhm) from +12V to base, and R1 (10 KOhm) from AGC input to base. Verify collector sits at ~6-8V with no input.

2. **Build Q2 log amplifier.** Insert Q2. Wire R_E2 (2.2 KOhm) from emitter to ground. Wire R_log (47 KOhm) from base to collector -- this feedback resistor, combined with Q2's exponential V_BE characteristic, creates the logarithmic compression. Wire R4 (1 KOhm) + VR1 (10 KOhm trim pot) in series from collector to +12V.

3. **Couple stages.** Wire C_couple (1 uF, positive toward Q1) from Q1 collector to Q2 base. Wire C2 (10 uF, positive toward Q2) from Q2 emitter to Q3 base.

4. **Build Q3 buffer.** Insert Q3. Collector to +12V. R_B3 (47 KOhm) from +12V to base. R5 (1 KOhm) from emitter to ground.

5. **Install meter and protection.** Connect M1 (100 uA) from Q3 emitter to ground. Wire D1 and D2 (1N4148) anti-parallel across the meter terminals -- one forward, one reverse. These clamp transients to 0.6V.

6. **Decouple and calibrate.** Wire C1 (100 uF) from +12V to ground. Apply a known S9 signal (50 uV at antenna). Adjust VR1 until the meter reads S9. All other S-unit readings fall into place automatically -- the log compression is set by Q2's physics, not by external components.

---

## Theory

### S-Units and the Decibel Scale

The S-unit system divides signal strength into a logarithmic scale where each S-unit represents a 6 dB increase in signal power -- a factor of 4 in power, or a factor of 2 in voltage. The IARU Region 2 standard defines S9 as 50 uV at the antenna terminals on HF frequencies.

| S-Unit | Voltage at Antenna | Power (relative to S9) |
|--------|--------------------|------------------------|
| S1 | 0.20 uV | -48 dB |
| S3 | 0.78 uV | -36 dB |
| S5 | 3.13 uV | -24 dB |
| S7 | 12.5 uV | -12 dB |
| S9 | 50.0 uV | 0 dB (reference) |
| S9+20 | 500 uV | +20 dB |
| S9+40 | 5.0 mV | +40 dB |
| S9+60 | 50 mV | +60 dB |

The total range from S1 to S9+60 spans a voltage ratio of 250,000:1. No linear meter can display this -- the needle would sit at zero for everything below S9+40 and slam to full scale above. Logarithmic compression is not optional.

### The Logarithmic Amplifier

The key to this circuit is Q2's base-emitter junction. A BJT's collector current relates to its base-emitter voltage by the Ebers-Moll equation:

    I_C = I_S * exp(V_BE * q / (kT))

Rearranging for V_BE:

    V_BE = (kT/q) * ln(I_C / I_S)

At room temperature (25 C), kT/q = 25.85 mV. A tenfold change in collector current produces a V_BE change of only 59.5 mV. A hundredfold change produces 119 mV. A hundred-thousandfold change (the S1-to-S9+60 range) produces only 298 mV. The transistor's exponential characteristic naturally compresses the enormous dynamic range into a small, manageable voltage swing that a meter can display.

The R_log feedback resistor (47 KOhm) from base to collector linearizes the log response and sets the operating region. Without it, Q2 would saturate at high signal levels. With it, the feedback forces the transistor to operate across a wider range of collector currents, maintaining the logarithmic relationship.

### Meter Ballistics

A 100 uA panel meter movement has a mechanical time constant of approximately 200-500 ms -- the needle cannot follow instantaneous signal changes. This natural sluggishness acts as a low-pass filter on the AGC voltage, averaging out rapid fading and QSB (signal flutter). For voice and CW reception this is desirable: the operator wants average signal strength, not a needle bouncing with every syllable. The interaction between AGC time constant (v1.16) and meter ballistics creates the S-meter's "feel." Mercury ground stations used strip chart recorders alongside their signal strength indicators -- the recorder captured the full temporal profile of each orbital pass, while the meter gave operators an at-a-glance reading.

### Connection to the Progressive Radio Series

This S-meter reads the AGC voltage that the AGC circuit (v1.19) generates in response to signal strength. The AGC loop keeps the IF output constant -- when a strong signal arrives, it reduces gain; when a weak signal arrives, it increases gain. The S-meter taps the AGC control voltage as a proxy for signal strength.

| Mission | Circuit | Role in S-Meter Context |
|---------|---------|------------------------|
| v1.9 | AGC (basic) | First gain control -- S-meter reads this voltage |
| v1.16 | AGC Time Constant | Attack/release shaping -- affects meter ballistics |
| v1.19 | AGC Circuit (JFET) | Provides the control voltage the S-meter reads |
| v1.20 | Squelch Circuit | Uses signal strength threshold -- S-meter visualizes it |
| v1.21 | BFO | Provides carrier for CW/SSB -- S-meter shows signal before detection |
| **v1.22** | **S-Meter** | **Makes signal strength visible -- this circuit** |
| v1.23+ | PLL / VFO | Frequency synthesis -- S-meter monitors across the band |

The S-meter sits at the monitoring layer of the receiver: it does not process the signal, but it tells the operator what the receiver is seeing. In the Mercury tracking network, this was the difference between knowing Aurora 7 was in range and guessing.

---

## Classroom Extensions

1. **AGC voltage mapping.** Connect a potentiometer to simulate AGC voltage (0-6V). Measure the meter deflection at 0.5V intervals. Plot AGC voltage vs. meter reading -- the curve should be logarithmic. Calculate the slope in mV per S-unit.

2. **Temperature sensitivity.** The logarithmic amplifier depends on kT/q, which increases with temperature. Heat Q2 gently with a soldering iron held nearby (do not touch) and observe the meter reading drift. Calculate the expected drift: at 25 C, kT/q = 25.85 mV; at 35 C, kT/q = 26.57 mV -- a 2.8% change. Does the measured drift match?

3. **LED bar graph alternative.** Replace the panel meter with a LM3914 dot/bar display driver and ten LEDs. The LM3914 has a built-in logarithmic mode. Compare its step response to the analog meter -- which gives a more useful reading during rapid signal fading?

4. **Mercury pass simulation.** Program an Arduino to output a voltage ramp that simulates Aurora 7 passing over a ground station: slow rise over 3 minutes, peak for 30 seconds, slow fall over 3 minutes. Feed this into the S-meter circuit and watch the needle trace Carpenter's orbital path.

5. **Dynamic range measurement.** Using a signal generator, determine the actual usable range of the S-meter circuit. At what input level does the meter reach full scale? At what level does the needle stop responding? Calculate the dynamic range in dB and compare to the theoretical 48 dB (S1 to S9).
