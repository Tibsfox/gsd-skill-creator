# Module 6: Op-Amps -- Assessment

> 5 questions testing understanding, not memorization

## Question 1: The Two Golden Rules

**State the two op-amp golden rules and explain why they only apply when negative feedback is present.**

Consider this: if golden rule 2 says V+ = V-, what would happen in a comparator circuit (no feedback) if the rules still applied? Would the comparator work?

## Question 2: Non-Inverting Amplifier Design

**Design a non-inverting amplifier with a gain of exactly 5 using a 10k feedback resistor (R_f = 10k). What value should R_g be?**

Show your work using the gain formula. If you had to pick a standard resistor value (E24 series), which would you choose?

## Question 3: Inverting Amplifier Analysis

**An inverting amplifier has R_in = 4.7k and R_f = 47k. What is the voltage gain? If V_in = 0.2V, what is V_out?**

Also state: what is the input impedance of this circuit, and why does it differ from the non-inverting configuration?

## Question 4: Active vs. Passive Filters

**Explain why an active Sallen-Key low-pass filter achieves -40dB/decade rolloff while a single passive RC filter only achieves -20dB/decade.**

What role does the op-amp play in the Sallen-Key topology? Could you achieve -40dB/decade by simply cascading two passive RC stages without a buffer?

## Question 5: Gain-Bandwidth Product

**An op-amp has a gain-bandwidth product (GBW) of 1 MHz. What is the maximum gain you can achieve at 100 kHz? What happens if you try to configure a higher gain at that frequency?**

If you needed a gain of 100 at 100 kHz, what GBW specification would you look for in an op-amp?

## Answer Key

### Answer 1

**Golden Rule 1:** No current flows into the op-amp inputs (the input impedance is effectively infinite).

**Golden Rule 2:** With negative feedback, the op-amp adjusts its output so that V+ = V- (the differential input voltage is zero).

**Why only with negative feedback:** The golden rules describe the *equilibrium state* that negative feedback creates. The feedback loop continuously adjusts the output to minimize the input difference. Without feedback (open-loop), there is no corrective mechanism -- the enormous open-loop gain amplifies any tiny input difference to the supply rails. In a comparator (no feedback), V+ does NOT equal V- -- that difference is precisely what the comparator detects. If the rules applied, V+ would always equal V-, and the comparator could never distinguish between inputs above and below the threshold.

### Answer 2

The non-inverting amplifier gain formula: **Av = 1 + R_f/R_g**

Setting Av = 5 with R_f = 10k:
- 5 = 1 + 10000/R_g
- 4 = 10000/R_g
- R_g = 10000/4 = **2500 ohms (2.5k)**

The nearest standard E24 resistor value is **2.49k** (labeled 2k49). In practice, 2.4k or 2.7k are more commonly stocked. With 2.4k: Av = 1 + 10000/2400 = 5.17. With 2.7k: Av = 1 + 10000/2700 = 4.70. For exactly 5, use a 2.5k precision resistor or a 2k + 500-ohm series combination.

### Answer 3

**Voltage gain:** Av = -(R_f/R_in) = -(47000/4700) = **-10**

The negative sign indicates phase inversion (the output is inverted relative to the input).

**V_out:** V_out = Av * V_in = -10 * 0.2V = **-2.0V**

**Input impedance:** The input impedance of an inverting amplifier is **R_in = 4.7k ohms**. This is because the inverting input is a virtual ground (V- = 0V by golden rule 2), so the input source sees R_in connected between the input and ground. This differs from the non-inverting configuration, where the input drives the `+` pin directly, seeing the op-amp's very high input impedance (megohms to teraohms). The inverting amplifier's finite input impedance is its main disadvantage compared to the non-inverting topology.

### Answer 4

A single passive RC filter is a first-order system with one pole, giving **-20dB/decade** rolloff (or -6dB/octave). Each pole contributes -20dB/decade to the asymptotic rolloff.

The Sallen-Key topology is a **second-order** system with two poles (created by two RC pairs interacting through the op-amp feedback), giving **-40dB/decade** rolloff. The op-amp serves two critical roles:

1. **Buffering:** It prevents the second RC section from loading the first, which would reduce the effective Q and degrade the response.
2. **Positive feedback path:** The feedback from output through C1 back to the R1-R2 junction creates the complex pole pair needed for the second-order transfer function.

**Cascading two passive RC stages without a buffer** would theoretically give -40dB/decade, but in practice the second stage loads the first, creating interaction between the stages. The resulting transfer function is NOT two independent first-order poles -- the loaded response has lower Q and the actual rolloff is degraded. The op-amp buffer eliminates this loading, preserving the ideal second-order behavior. This is why active filters are preferred. -- H&H Ch.6

### Answer 5

**GBW = Gain x Bandwidth**, so at 100 kHz:

Maximum gain = GBW / frequency = 1,000,000 / 100,000 = **10 (20 dB)**

**If you configure a higher gain:** The op-amp cannot provide it at that frequency. The actual gain rolls off at -20dB/decade above the open-loop bandwidth. If you set a closed-loop gain of, say, 100 using resistors, the circuit will have a gain of 100 at low frequencies (up to 10 kHz), but at 100 kHz the gain will only be 10 regardless of the resistor values. The frequency response will show a flat gain of 100 up to 10 kHz, then -20dB/decade rolloff until it reaches unity gain at 1 MHz. Phase shift increases near the GBW limit, potentially causing instability in feedback circuits.

**For a gain of 100 at 100 kHz:** You need GBW >= 100 * 100,000 = **10 MHz**. In practice, choose an op-amp with GBW of at least 20-30 MHz to have margin for stability and to avoid operating right at the limit where phase margin degrades.
