# DIY Radio Circuit: LC Bandpass Filter — Tuned Selectivity

## The Circuit

A double-tuned LC bandpass filter using two coupled resonant circuits, designed to select a narrow band of frequencies at the receiver front end. This is the fourteenth circuit in the progressive radio series. The bandpass filter sits between the antenna (or preamplifier output) and the mixer, selecting only the desired signal and rejecting adjacent-channel interference. A single-tuned filter has a gentle rolloff; double-tuning creates steep skirts that dramatically improve selectivity.

This is the filter that makes Echo 1's reflected signal usable: the raw reflection arrives with noise, interference, and multipath distortion spread across a wide bandwidth. The bandpass filter extracts only the frequency band containing the signal and rejects everything else.

**What it does:**
- Two LC tank circuits (L1+C1 and L2+C2) coupled by a small capacitor (Cc)
- Each tank resonates at the design frequency (e.g., 7 MHz for the shortwave example)
- The coupling capacitor transfers energy between tanks, creating a flat-topped passband
- Single-tuned: gentle rolloff, wide passband (~200 kHz at -3dB)
- Double-tuned: steep skirts, narrow passband (~50 kHz at -3dB), flat top
- Adjustable: variable capacitors (C1, C2) allow tuning across the band
- Insertion loss: ~3 dB (typical for passive LC filters)

**What it teaches:** Selectivity is the receiver's ability to hear one signal and reject adjacent ones. A single LC tank has a Lorentzian response — it rolls off gently at 20 dB/decade. Two coupled tanks create a Butterworth-like response with steep skirts: 40 dB/decade rolloff while maintaining a flat passband. This is critical when the desired signal is only 10-20 dB above adjacent interference. Echo 1's ground receivers needed extreme selectivity because the reflected signal was weak and surrounded by terrestrial interference. The bandpass filter was the gatekeeper.

**Total cost: ~$5**

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
  v1.8  — Noise Blanker / Impulse Filter
  v1.9  — AGC (Automatic Gain Control)
  v1.10 — S-Meter (signal strength indicator)
  v1.11 — BFO (Beat Frequency Oscillator for CW/SSB)
  v1.12 — Antenna Tuner (L-network impedance matching)
  v1.13 — RF Preamplifier (low-noise front end)
  v1.14 — Bandpass Filter (tuned selectivity)  ← YOU ARE HERE

The bandpass filter sits at the front end, before or after the preamp:
  Antenna → Tuner → BANDPASS (THIS CIRCUIT) → Preamp → Mixer ← LO
                                                          ↓
                                                    IF Amplifier
                                                          ↓
                                                    Detector ← BFO
                                                          ↓
                                                     Audio Amp → Speaker

Without bandpass filter:
  All signals in the antenna's passband reach the mixer.
  Strong adjacent stations overload the mixer (blocking).
  Intermodulation products appear as false signals.

With bandpass filter:
  Only the desired frequency range reaches the mixer.
  Adjacent signals are attenuated 40-60 dB by the steep skirts.
  Mixer operates cleanly in its linear region.

Echo 1 ground station chain:
  Horn antenna → bandpass filter (cavity) → parametric preamp → mixer
  The cavity bandpass filter at Bell Labs' Holmdel station was
  critical for separating Echo 1's weak reflection from terrestrial
  interference. Same principle as our LC filter, but at microwave
  frequencies using cavity resonators instead of inductors.
```

## Schematic

```
                  SINGLE-TUNED (for comparison):

  INPUT ── C_in ──┬── L1 ──── C_out ── OUTPUT
          (100pF) │  (10μH)  (100pF)
                  C1
                 (47pF variable)
                  │
                 GND


                  DOUBLE-TUNED (the actual circuit):

                         Cc (2.2pF)
                     coupling capacitor
                           │
  INPUT ── C_in ──┬── L1 ──┤── L2 ──┬── C_out ── OUTPUT
          (100pF) │  (10μH) │  (10μH)│  (100pF)
                  C1        │        C2
                 (47pF      │       (47pF
                  var.)     │        var.)
                  │         │        │
                 GND       GND      GND

  Component values for 7 MHz center frequency:
    L1, L2:  10 μH (toroid wound, T37-6 core, 24 turns)
    C1, C2:  47 pF variable (for tuning)
    Cc:      2.2 pF (coupling — controls bandwidth)
    C_in:    100 pF (input coupling)
    C_out:   100 pF (output coupling)

  Resonant frequency: f = 1/(2π√(LC))
    = 1/(2π√(10×10⁻⁶ × 47×10⁻¹²))
    = 7.34 MHz (tune C1/C2 to hit 7.0 MHz exactly)

  Coupling factor (k):
    k = Cc / √(C1 × C2) ≈ 2.2 / √(47 × 47) ≈ 0.047
    Critical coupling: k_crit ≈ 1/Q ≈ 1/100 = 0.01
    Our k > k_crit → overcoupled → flat-topped passband ← desired


  PHYSICAL LAYOUT (important for RF):

  ┌──────────────────────────────────────────┐
  │  INPUT    ┌──┐   2.2pF    ┌──┐   OUTPUT │
  │  ──○──┬───┤L1├───||───────┤L2├───┬──○── │
  │       │   └──┘            └──┘   │      │
  │      ═╤═ C1                     ═╤═ C2  │
  │       │  (var)                    │(var) │
  │       │                          │      │
  │  ─────┴──────────────────────────┴───── │
  │                   GND                    │
  │                                          │
  │  IMPORTANT: Keep L1 and L2 at 90° to    │
  │  each other (or shielded) to prevent    │
  │  unwanted magnetic coupling. Only Cc    │
  │  should couple the two tanks.           │
  └──────────────────────────────────────────┘
```

---

## How It Works: Single vs Double Tuned

```
FREQUENCY RESPONSE COMPARISON:

  Signal
  Level
  (dB)
    0 ─┬──────────────╥══════════╥──────────────┬─
       │             ╱ ║  FLAT   ║ ╲            │
   -3 ─┤           ╱   ║  TOP   ║   ╲          ├─ -3 dB passband
       │         ╱     ╚════════╝     ╲         │
  -10 ─┤    ┌──╱──── double-tuned ──────╲──┐    ├─
       │   ╱╱                             ╲╲   │
  -20 ─┤  / /    single ╱╲ single          ╲ ╲ ├─
       │ / /     tuned ╱  ╲ tuned            ╲╲│
  -40 ─┤//        ╱      ╲                   ╲├─
       │/        ╱          ╲                  \│
  -60 ─┼───────────────────────────────────────┼─
       f-200   f-100    f₀    f+100   f+200
                   Frequency (kHz offset)

  Single-tuned: -3 dB bandwidth ≈ f₀/Q ≈ 7M/100 = 70 kHz
                Rolloff: 20 dB/decade (6 dB/octave)
                Shape: Lorentzian (peaked, rounded top)

  Double-tuned: -3 dB bandwidth ≈ 50 kHz (adjustable via Cc)
                Rolloff: 40 dB/decade (12 dB/octave)
                Shape: flat top with steep skirts
                Adjacent signal at f₀+100 kHz: -30 dB (vs -10 dB single)
```

---

## Software (Arduino Sketch for Sweep Generator)

```cpp
/*
 * Echo 1 — Bandpass Filter Response Analyzer
 * NASA Mission Series v1.14
 *
 * Uses the Arduino's PWM output with an RC DAC to generate
 * a swept-frequency signal. Measures the filter's output
 * amplitude at each frequency to plot the passband response.
 *
 * Simplified version — for educational demonstration.
 * A real sweep generator would use a DDS chip (AD9850).
 */

// NOTE: This is a demonstration of the CONCEPT.
// For actual RF filter testing, use a signal generator
// and oscilloscope, or an AD9850 DDS module (~$5).

const int FILTER_INPUT_PIN = A0;   // Monitor filter input level
const int FILTER_OUTPUT_PIN = A1;  // Monitor filter output level

void setup() {
    Serial.begin(9600);
    Serial.println(F("=== Echo 1 Bandpass Filter Analyzer ==="));
    Serial.println(F("Mission 1.14 — LC Double-Tuned Bandpass"));
    Serial.println(F(""));
    Serial.println(F("Connect a signal generator to filter input."));
    Serial.println(F("Sweep 6.0 - 8.0 MHz. Read output below."));
    Serial.println(F(""));
    Serial.println(F("  Freq(MHz)  In(mV)  Out(mV)  Gain(dB)  Status"));
    Serial.println(F("  --------   ------  ------   --------  ------"));
}

void loop() {
    // Read input and output levels
    int inputLevel = analogRead(FILTER_INPUT_PIN);
    int outputLevel = analogRead(FILTER_OUTPUT_PIN);

    // Convert to millivolts (assuming 5V reference, 10-bit ADC)
    float inputMV = inputLevel * (5000.0 / 1024.0);
    float outputMV = outputLevel * (5000.0 / 1024.0);

    // Calculate gain in dB
    float gain_dB = 0;
    if (inputMV > 0.1) {
        gain_dB = 20.0 * log10(outputMV / inputMV);
    }

    // Display (user manually notes frequency from signal gen)
    Serial.print(F("  manual     "));
    Serial.print(inputMV, 0);
    Serial.print(F("     "));
    Serial.print(outputMV, 0);
    Serial.print(F("      "));
    Serial.print(gain_dB, 1);
    Serial.print(F("      "));

    if (gain_dB > -3.0) {
        Serial.println(F("PASSBAND"));
    } else if (gain_dB > -20.0) {
        Serial.println(F("skirt"));
    } else {
        Serial.println(F("REJECTED"));
    }

    delay(500);
}
```

---

## Bill of Materials

| Qty | Part | Cost |
|-----|------|------|
| 2 | T37-6 toroid cores (yellow) | $0.60 |
| 1 | 26 AWG enameled wire (3 ft) | $0.20 |
| 2 | 47 pF variable capacitors (trimmer) | $0.80 |
| 1 | 2.2 pF ceramic capacitor | $0.05 |
| 2 | 100 pF ceramic capacitors | $0.10 |
| 1 | Breadboard (small) | $1.50 |
| 1 | BNC connectors (input/output, optional) | $1.00 |
| 1 | Hookup wire | $0.25 |
| | **Total** | **~$5** |

---

## Winding the Inductors

```
T37-6 TOROID (yellow mix, good for 2-30 MHz):

  1. Cut 18 inches of 26 AWG enameled wire.
  2. Thread through the toroid, counting turns as you go.
  3. Wind 24 turns evenly around the core.
  4. Inductance: AL for T37-6 ≈ 17 nH/turn²
     L = AL × N² = 17 × 24² = 17 × 576 = 9,792 nH ≈ 10 μH ✓
  5. Trim wire ends, scrape enamel, tin with solder.
  6. Wind the second inductor identically.

  Mount the two toroids at 90° to each other on the breadboard
  to prevent unwanted magnetic coupling. Only the coupling
  capacitor (Cc) should connect the two tank circuits.
```

---

## Echo 1 Connection

```
Echo 1 and the Bandpass Filter:

  Echo 1's reflected signal was incredibly weak — about
  10⁻¹⁶ watts at the ground receiver (Holmdel, NJ).
  The terrestrial RF environment had interference thousands
  of times stronger. Without extreme selectivity, the
  reflected signal would be buried.

  Bell Labs used cavity bandpass filters — the microwave
  equivalent of our LC tanks — to select a narrow frequency
  band around 960 MHz (the transmit frequency). The cavity
  filter rejected interference outside the passband, letting
  only the Echo 1 reflection through to the low-noise
  amplifier.

  Our LC filter does the same thing at HF frequencies:
  it passes the desired signal and rejects everything else.
  The double-tuned design creates the steep skirts needed
  to reject strong adjacent signals — critical when your
  desired signal is 60+ dB weaker than local interference.

  The physics is identical across scales:
  - LC tank:    inductor + capacitor resonance
  - Cavity:     waveguide resonance (distributed L and C)
  - Echo 1:     electromagnetic resonance on a spherical surface
  All are frequency-selective reflectors.
```

---

## Organism Connection

```
Physalia physalis — Portuguese man o' war

  The man o' war's tentacles are frequency-selective.
  Different nematocyst types respond to different chemical
  triggers — some fire on contact with fish scales, others
  on contact with crustacean chitin. The tentacle array is
  a biological bandpass filter: it "passes" prey of the
  right type (size, chemistry) and "rejects" objects that
  don't match the trigger criteria.

  Our bandpass filter selects one frequency and rejects others.
  The man o' war selects one prey type and rejects others.
  Echo 1 reflects one signal and (in theory) passes all others.
  All three are tuned systems — optimized for their specific
  signal in a sea of noise.
```
