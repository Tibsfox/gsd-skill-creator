# DIY Radio Circuit: S-Meter — Signal Strength Indicator

## The Circuit

A signal strength meter that rectifies the AGC (Automatic Gain Control) voltage from a superheterodyne receiver and drives either a microammeter or an LED bar graph to display received signal strength on the standard S1-S9 scale. This is the tenth circuit in the progressive radio series: v1.2 built the transmitter, v1.3 the receiver, v1.4 the mixer, v1.5 the IF amplifier, v1.6-v1.9 continued the chain, and v1.10 builds the S-meter that tells you how strong the signal is.

The S-meter is the pilot's instrument panel of radio. Without it, you are flying blind — you know you can hear a signal, but not how strong it is, not whether it is fading, not whether your antenna adjustment improved things. Explorer 4's scintillation counters were essentially S-meters for radiation: they measured not just the presence of trapped particles, but their intensity. The S-meter does the same for radio signals.

**What it does:**
- Connect the S-meter input to the AGC line of your receiver (or the IF amplifier output from v1.5)
- The AGC voltage increases with signal strength (stronger signal = more negative AGC = more rectified DC)
- A precision rectifier converts the AGC voltage to a stable DC level
- The DC level drives a microammeter (0-100 uA) or an LED bar graph (10 LEDs)
- Scale markings from S1 (barely detectable) to S9 (very strong) + dB over S9
- Each S-unit represents 6 dB (a factor of 4 in power, 2 in voltage)

**What it teaches:** Signal strength measurement is fundamental to every communication system. The S-meter quantifies what the ear can only estimate. When Explorer 4 measured Argus radiation belts, it needed to know not just "particles are present" but "how many per second" — intensity, not just detection. The S-meter performs the same function for radio: converting a qualitative observation ("I can hear something") into a quantitative measurement ("the signal is S7, 36 dB above the noise floor").

**Total cost: ~$8**

---

## The Progressive Radio Chain (Series Context)

```
Radio Series Progress:
  v1.2  — Transmitter (oscillator → antenna)
  v1.3  — Receiver (antenna → detector → audio)
  v1.4  — Mixer (RF + LO → IF)
  v1.5  — IF Amplifier (IF → amplified, filtered IF)
  v1.6  — AM Detector/Demodulator
  v1.7  — Audio Amplifier + Speaker Driver
  v1.8  — BFO (Beat Frequency Oscillator for CW/SSB)
  v1.9  — AGC (Automatic Gain Control)
  v1.10 — S-Meter (signal strength indicator) ← YOU ARE HERE

The S-meter sits on the AGC bus:
  Antenna → RF Amp → Mixer ← LO
                        ↓
                  IF Amplifier
                        ↓
                    Detector
                    ↓       ↓
               Audio Amp   AGC Voltage
                    ↓            ↓
                Speaker     S-METER ← THIS CIRCUIT

Explorer 4's measurement chain:
  Scintillation crystal → Photomultiplier → Pulse shaper
                                                ↓
                                          Count rate meter → Telemetry
                                          (the satellite's "S-meter")
```

## Schematic

```
                        +9V
                         |
                    R1 (10K)
                         |
    AGC Input ---+---R2--+--- OA1 pin 3 (+)
    (from v1.9)  |  (47K)|
                 |       |        LM358 (1/2)
                C1       |     +----[OA1]----+
               (100n)    |     |   pin 2 (-) |
                 |       |     |      |       |
                GND      |     +--D1--+  R3 (100K)
                         |     |  (1N4148)    |
                         |     |              |
                         |     +-----R4-------+---> DC out
                         |          (22K)     |
                         |                    |
                         |                C2 (10uF)
                         |                    |
                         |                   GND
                         |
                    DC out ----+
                               |
                          R5 (pot)     LED BAR GRAPH VERSION:
                          (100K)       DC out → LM3914 pin 5 (SIG)
                               |                    |
                          METER (0-100uA)     10 LEDs (S1-S9 + S9+)
                               |               green (S1-S3)
                              GND              yellow (S4-S6)
                                                red (S7-S9+)

CALIBRATION:
  S1  = -121 dBm (0.05 uV at 50 ohm)
  S3  = -109 dBm (0.8 uV)
  S5  = -97 dBm  (3.2 uV)
  S7  = -85 dBm  (12.6 uV)
  S9  = -73 dBm  (50 uV)
  Each S-unit = 6 dB = 4x power = 2x voltage
```

## Detailed Schematic — LED Bar Graph Version

```
                           +9V
                            |
    DC out (from rectifier) |
         |                  |
         +---> LM3914 -----+
               pin 5 (SIG)
               pin 3 (V+)
               pin 6 (RHI) --- 1.2V ref (internal)
               pin 4 (RLO) --- GND
               pin 7 (REF OUT) --- 1.2V
               pin 8 (REF ADJ) --- GND
               pin 9 (MODE) --- V+ (bar mode)
               |
               Outputs (pins 1, 18, 17, 16, 15, 14, 13, 12, 11, 10):
               |
          LED1 (S1) Green  ---|>|--- R (1K) --- GND
          LED2 (S2) Green  ---|>|--- R (1K) --- GND
          LED3 (S3) Green  ---|>|--- R (1K) --- GND
          LED4 (S4) Yellow ---|>|--- R (1K) --- GND
          LED5 (S5) Yellow ---|>|--- R (1K) --- GND
          LED6 (S6) Yellow ---|>|--- R (1K) --- GND
          LED7 (S7) Red    ---|>|--- R (1K) --- GND
          LED8 (S8) Red    ---|>|--- R (1K) --- GND
          LED9 (S9) Red    ---|>|--- R (1K) --- GND
          LED10(S9+)Red    ---|>|--- R (1K) --- GND
```

## S-Meter Scale

```
S-Unit    dBm        uV (50 ohm)    Meter %    Description
------    ----       -----------    -------    -----------
  S1      -121       0.05           10%        Barely detectable
  S2      -115       0.1            15%        Very weak
  S3      -109       0.8            22%        Weak
  S4      -103       1.6            30%        Fair
  S5      -97        3.2            40%        Moderate
  S6      -91        6.3            52%        Good
  S7      -85        12.6           65%        Strong
  S8      -79        25             78%        Very strong
  S9      -73        50             90%        Extremely strong
  S9+10   -63        160            95%        +10 dB over S9
  S9+20   -53        500            100%       Full scale
```

## Bill of Materials

| Qty | Component | Value/Type | Purpose | Cost |
|-----|-----------|------------|---------|------|
| 1 | LM3914 | LED bar driver IC | Drives 10-LED bar graph | $1.50 |
| 1 | LM358 | Dual op-amp | Precision rectifier | $0.30 |
| 3 | LED, green | 3mm, diffused | S1-S3 indicators | $0.15 |
| 3 | LED, yellow | 3mm, diffused | S4-S6 indicators | $0.15 |
| 4 | LED, red | 3mm, diffused | S7-S9+ indicators | $0.20 |
| 1 | 1N4148 | Signal diode | Precision rectifier | $0.05 |
| 10 | 1K resistor | 1/4W | LED current limit | $0.20 |
| 1 | 10K resistor | 1/4W | Bias network | $0.02 |
| 1 | 22K resistor | 1/4W | Rectifier output | $0.02 |
| 1 | 47K resistor | 1/4W | Input scaling | $0.02 |
| 1 | 100K resistor | 1/4W | Feedback | $0.02 |
| 1 | 100nF capacitor | Ceramic | Input coupling | $0.03 |
| 1 | 10uF capacitor | Electrolytic | Output smoothing | $0.05 |
| 1 | 100K potentiometer | Trim | Calibration | $0.50 |
| 1 | Breadboard | Half-size | Assembly | $3.00 |
| 1 | Wire kit | 22 AWG | Connections | $2.00 |
| | | | **Total** | **~$8.21** |

## Build Notes

1. **Start with the LM3914.** Wire it standalone with a potentiometer on the input to verify that the LED bar graph responds — turn the pot and watch LEDs light up in sequence from S1 to S9+.

2. **Build the precision rectifier.** Using the LM358, wire the half-wave precision rectifier. Feed it a test signal (any audio or RF source through a coupling capacitor) and verify that you get a stable DC output on the 10uF smoothing capacitor.

3. **Connect them.** Feed the rectifier DC output into the LM3914 signal input. Now the LED bar should respond to the input signal amplitude.

4. **Connect to your receiver.** Tap the AGC voltage from your v1.9 AGC circuit (or any receiver with an AGC output). The S-meter should now track signal strength as you tune across stations. Strong stations light more LEDs; weak stations light fewer.

5. **Calibrate.** Use the 100K trim pot to set the full-scale point. Tune to the strongest local station — adjust until S9 lights. The remaining scale should fall into approximate alignment with standard S-units.

## The Engineering Lesson

The S-meter is a measurement instrument, and measurement changes everything. Before the S-meter, radio operators could say "the signal sounds strong" or "I can barely hear it." After the S-meter, they could say "the signal is S7" — a specific, reproducible number that means the same thing to every operator with a calibrated meter.

Explorer 4's scintillation counters did the same thing for radiation. Before Explorer 4, the Argus planners could predict that nuclear detonations would create artificial radiation belts. After Explorer 4, they could measure exactly how many electrons were trapped, at what energies, at what altitudes, and how quickly they decayed. The scintillation counter was the S-meter of particle physics: converting individual particle impacts into count rates, converting count rates into intensities, converting intensities into belt models.

The step from detection to measurement is the step from "something is happening" to "we know how much." That is the step from art to science, from intuition to engineering. The S-meter is a single component — one IC and ten LEDs — that makes that step visible. Every LED that lights up is a quantum of knowledge: the signal is at least this strong.
