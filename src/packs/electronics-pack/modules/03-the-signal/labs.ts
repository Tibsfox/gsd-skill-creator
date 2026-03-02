/**
 * Module 3: The Signal — Lab exercises
 *
 * 6 labs covering AC signals, impedance, Bode plots, decibels, noise,
 * and signal sources / waveform types.
 * Each lab uses real MNA simulator analysis or physics-based calculations.
 */

import { acAnalysis } from '../../simulator/mna-engine.js';
import { transientAnalysis } from '../../simulator/transient.js';
import type { Component } from '../../simulator/components.js';

export interface LabStep {
  instruction: string;
  expected_observation: string;
  learn_note: string;
}

export interface Lab {
  id: string;
  title: string;
  steps: LabStep[];
  verify: () => boolean;
}

// ============================================================================
// Lab 1: Oscilloscope Basics (m3-lab-01)
// ============================================================================

const lab01: Lab = {
  id: 'm3-lab-01',
  title: 'Oscilloscope Basics',
  steps: [
    {
      instruction:
        'Build an RC circuit: 1V DC source, R=1k ohm in series, C=1uF to ground. Run a transient simulation for 5ms with 100us time steps.',
      expected_observation:
        'The voltage across the capacitor starts at 0V and rises exponentially toward the source voltage of 1V.',
      learn_note:
        'An oscilloscope displays voltage versus time. The RC charging curve is one of the most fundamental waveforms in electronics — it shows how energy is stored in a capacitor.',
    },
    {
      instruction:
        'Observe the time constant tau = R * C = 1k * 1uF = 1ms. At t = tau, the capacitor voltage should reach approximately 63.2% of the final value.',
      expected_observation:
        'At t = 1ms, the capacitor voltage is approximately 0.632V (63.2% of 1V).',
      learn_note:
        'The time constant tau = RC defines how fast a capacitor charges. After 1 tau, voltage reaches 63.2%. After 5 tau, it is within 1% of the final value. This is the exponential charging curve: V(t) = V_source * (1 - e^(-t/tau)).',
    },
    {
      instruction:
        'Check that after 5ms (5 time constants), the capacitor voltage is very close to the source voltage of 1V.',
      expected_observation:
        'At t = 5ms, the capacitor voltage is approximately 0.993V — within 1% of the final 1V.',
      learn_note:
        'The "5 tau rule" is a practical engineering guideline: after 5 time constants, the transient is effectively complete. Real oscilloscopes use time/div and volts/div knobs to scale these waveforms for clear viewing.',
    },
  ],
  verify: () => {
    const components: Component[] = [
      { id: 'V1', type: 'voltage-source', nodes: ['1', '0'], voltage: 1 },
      { id: 'R1', type: 'resistor', nodes: ['1', '2'], resistance: 1000 },
      { id: 'C1', type: 'capacitor', nodes: ['2', '0'], capacitance: 1e-6 },
    ];

    const result = transientAnalysis(components, {
      timeStep: 100e-6,
      stopTime: 5e-3,
      maxIterations: 50,
      tolerance: 1e-6,
    });

    // Check: result has time points
    if (result.timePoints.length < 10) return false;

    // Check: final voltage across cap approaches source voltage (within 10%)
    const last = result.timePoints[result.timePoints.length - 1];
    const vCap = last.nodeVoltages['2'] ?? 0;
    if (Math.abs(vCap - 1) / 1 > 0.10) return false;

    return true;
  },
};

// ============================================================================
// Lab 2: Frequency Sweep (m3-lab-02)
// ============================================================================

const lab02: Lab = {
  id: 'm3-lab-02',
  title: 'Frequency Sweep',
  steps: [
    {
      instruction:
        'Build an RC low-pass filter: 1V AC source, R=1k ohm in series (nodes 1->2), C=159nF to ground (node 2->0). The cutoff frequency f_c = 1/(2*pi*R*C) is approximately 1kHz.',
      expected_observation:
        'The circuit is a classic first-order low-pass filter with a 1kHz corner frequency.',
      learn_note:
        'A low-pass filter passes low frequencies and attenuates high frequencies. The cutoff frequency is where the output power drops to half (-3dB point). For an RC filter: f_c = 1/(2*pi*R*C).',
    },
    {
      instruction:
        'Run an AC frequency sweep from 10Hz to 100kHz with 20 points per decade. Observe the gain (in dB) at the output node across different frequencies.',
      expected_observation:
        'At low frequencies (~100Hz), the gain is near 0dB (no attenuation). At the cutoff (~1kHz), gain drops to approximately -3dB. At 10kHz, gain is around -20dB.',
      learn_note:
        'A Bode magnitude plot shows gain (dB) versus frequency on a log scale. First-order RC filters roll off at -20dB per decade (a factor of 10 in frequency gives a factor of 10 reduction in voltage, which is -20dB).',
    },
    {
      instruction:
        'Verify that gain decreases monotonically — each higher frequency shows lower gain than the previous one.',
      expected_observation:
        'The gain strictly decreases as frequency increases, confirming the low-pass characteristic.',
      learn_note:
        'Monotonically decreasing gain is the hallmark of a low-pass filter. This is because the capacitor impedance Z_C = 1/(2*pi*f*C) decreases with frequency, creating a voltage divider that favors ground at high frequencies.',
    },
  ],
  verify: () => {
    const components: Component[] = [
      { id: 'V1', type: 'voltage-source', nodes: ['1', '0'], voltage: 1 },
      { id: 'R1', type: 'resistor', nodes: ['1', '2'], resistance: 1000 },
      { id: 'C1', type: 'capacitor', nodes: ['2', '0'], capacitance: 159e-9 },
    ];

    const result = acAnalysis(components, 10, 100000, 20);

    // Check: result array has multiple frequency points
    if (result.length < 10) return false;

    // Find points near 100Hz and 10kHz
    const near100Hz = result.reduce((prev, curr) =>
      Math.abs(curr.frequency - 100) < Math.abs(prev.frequency - 100) ? curr : prev,
    );
    const near10kHz = result.reduce((prev, curr) =>
      Math.abs(curr.frequency - 10000) < Math.abs(prev.frequency - 10000) ? curr : prev,
    );

    const gainLow = near100Hz.magnitudes['2'];
    const gainHigh = near10kHz.magnitudes['2'];

    // At 100Hz: gain should be near 0dB (within 1dB)
    if (Math.abs(gainLow) > 1) return false;

    // At 10kHz: gain should be below -15dB (first-order rolloff)
    if (gainHigh > -15) return false;

    // Gain should roll off (higher freq = lower gain)
    if (gainHigh >= gainLow) return false;

    return true;
  },
};

// ============================================================================
// Lab 3: Impedance Calculator (m3-lab-03)
// ============================================================================

const lab03: Lab = {
  id: 'm3-lab-03',
  title: 'Impedance Calculator',
  steps: [
    {
      instruction:
        'Calculate the capacitive reactance X_C for C=159nF at f=1kHz using the formula X_C = 1/(2*pi*f*C).',
      expected_observation:
        'X_C = 1/(2*pi*1000*159e-9) = approximately 1001 ohm. The capacitor has roughly the same impedance as the 1k resistor at this frequency.',
      learn_note:
        'Capacitive reactance X_C decreases with frequency: at DC, a capacitor is an open circuit (infinite impedance). At very high frequencies, it approaches a short circuit. The crossover point where X_C equals R is the RC filter cutoff frequency.',
    },
    {
      instruction:
        'Calculate the inductive reactance X_L for L=159mH at f=1kHz using the formula X_L = 2*pi*f*L.',
      expected_observation:
        'X_L = 2*pi*1000*0.159 = approximately 999 ohm. The inductor also has roughly 1k impedance at 1kHz.',
      learn_note:
        'Inductive reactance X_L increases with frequency — the opposite of capacitive reactance. At DC, an inductor is a short circuit (zero impedance). At high frequencies, it approaches an open circuit. Inductors and capacitors are frequency-dependent components.',
    },
    {
      instruction:
        'Compute the total impedance of R=1k in series with C=159nF: |Z_total| = sqrt(R^2 + X_C^2). Do the same for R=1k in series with L=159mH.',
      expected_observation:
        'Series RC: |Z| = sqrt(1000^2 + 1001^2) = approximately 1414 ohm. Series RL: |Z| = sqrt(1000^2 + 999^2) = approximately 1414 ohm. Both are roughly sqrt(2) times the individual component values.',
      learn_note:
        'In a series circuit, resistance and reactance combine as vectors (phasors). The magnitude is found using the Pythagorean theorem because R and X are 90 degrees apart. When R equals X, the total impedance is sqrt(2)*R and the phase angle is 45 degrees.',
    },
    {
      instruction:
        'Cross-check by running a single-frequency AC analysis on the RC circuit at 1kHz and comparing the gain to the predicted voltage divider ratio.',
      expected_observation:
        'The AC analysis gain at 1kHz should be approximately -3dB, confirming that C and R have equal impedance at the cutoff frequency.',
      learn_note:
        'Impedance is the generalized form of resistance for AC circuits. Written as Z = R + jX, the real part is resistance and the imaginary part is reactance. The MNA simulator uses complex arithmetic to handle impedance natively in AC analysis.',
    },
  ],
  verify: () => {
    const f = 1000;
    const C = 159e-9;
    const L = 0.159;
    const R = 1000;

    // Capacitive reactance at 1kHz
    const X_C = 1 / (2 * Math.PI * f * C);
    if (Math.abs(X_C - 1001) / 1001 > 0.02) return false;

    // Inductive reactance at 1kHz
    const X_L = 2 * Math.PI * f * L;
    if (Math.abs(X_L - 999) / 999 > 0.02) return false;

    // Series RC impedance
    const Z_RC = Math.sqrt(R * R + X_C * X_C);
    if (Math.abs(Z_RC - 1414) / 1414 > 0.02) return false;

    // Series RL impedance
    const Z_RL = Math.sqrt(R * R + X_L * X_L);
    if (Math.abs(Z_RL - 1414) / 1414 > 0.02) return false;

    // Cross-check with AC analysis at a single frequency
    const components: Component[] = [
      { id: 'V1', type: 'voltage-source', nodes: ['1', '0'], voltage: 1 },
      { id: 'R1', type: 'resistor', nodes: ['1', '2'], resistance: R },
      { id: 'C1', type: 'capacitor', nodes: ['2', '0'], capacitance: C },
    ];
    const result = acAnalysis(components, f, f, 1);
    if (result.length === 0) return false;

    // At cutoff frequency, gain should be approximately -3dB
    const gain = result[0].magnitudes['2'];
    if (Math.abs(gain - (-3.01)) > 1.0) return false;

    return true;
  },
};

// ============================================================================
// Lab 4: Decibel Scale (m3-lab-04)
// ============================================================================

const lab04: Lab = {
  id: 'm3-lab-04',
  title: 'Decibel Scale',
  steps: [
    {
      instruction:
        'Build a two-stage cascaded RC low-pass filter: 1V source, R1=1k (1->2), C1=159nF (2->0), R2=1k (2->3), C2=159nF (3->0). Each stage alone has a cutoff at approximately 1kHz.',
      expected_observation:
        'The cascaded filter has two RC stages. Note that the second stage loads the first — the impedance of R2 draws current from the node 2 output of stage 1.',
      learn_note:
        'Cascading filters is a common way to get steeper rolloff slopes. In an ideal (buffered) cascade, each stage contributes independently. In a direct cascade like this one, loading effects cause the combined response to differ from the product of individual responses.',
    },
    {
      instruction:
        'Run an AC sweep from 10Hz to 100kHz. Compare the gain at node 3 (output of two stages) to what a single-stage filter would show.',
      expected_observation:
        'The two-stage filter rolls off much faster than a single stage. At 10kHz (one decade above the single-stage cutoff), the gain is more negative than -20dB.',
      learn_note:
        'A single first-order filter rolls off at -20dB/decade. Two cascaded stages produce approximately -40dB/decade in the stopband (each stage contributes -20dB/decade). This is the power of dB: gains in dB add. -20dB + -20dB = -40dB.',
    },
    {
      instruction:
        'Observe the dB addition principle: if each stage provides -3dB at its cutoff frequency, two stages together provide approximately -6dB at that same frequency.',
      expected_observation:
        'At frequencies near the single-stage cutoff, the combined attenuation is roughly twice (in dB) what a single stage produces — demonstrating dB addition.',
      learn_note:
        'The decibel is a logarithmic unit. dB = 20*log10(V_out/V_in). Common reference values: 0dB = unity gain, -3dB = half power (0.707 voltage), -6dB = half voltage, -20dB = 1/10 voltage, -40dB = 1/100 voltage.',
    },
  ],
  verify: () => {
    const components: Component[] = [
      { id: 'V1', type: 'voltage-source', nodes: ['1', '0'], voltage: 1 },
      { id: 'R1', type: 'resistor', nodes: ['1', '2'], resistance: 1000 },
      { id: 'C1', type: 'capacitor', nodes: ['2', '0'], capacitance: 159e-9 },
      { id: 'R2', type: 'resistor', nodes: ['2', '3'], resistance: 1000 },
      { id: 'C2', type: 'capacitor', nodes: ['3', '0'], capacitance: 159e-9 },
    ];

    const result = acAnalysis(components, 10, 100000, 20);

    // Find gain at node '3' near 10kHz
    const near10kHz = result.reduce((prev, curr) =>
      Math.abs(curr.frequency - 10000) < Math.abs(prev.frequency - 10000) ? curr : prev,
    );

    const gainAt10k = near10kHz.magnitudes['3'];

    // Two-stage cascade at 10kHz (10x the single-stage cutoff) should show
    // more negative gain than -20dB, demonstrating steeper rolloff
    if (gainAt10k > -20) return false;

    return true;
  },
};

// ============================================================================
// Lab 5: Noise Floor (m3-lab-05)
// ============================================================================

const lab05: Lab = {
  id: 'm3-lab-05',
  title: 'Noise Floor',
  steps: [
    {
      instruction:
        'Calculate the Johnson (thermal) noise voltage for a 10k ohm resistor at room temperature (300K) with 10kHz bandwidth using V_n = sqrt(4 * k_B * T * R * BW), where k_B = 1.381e-23 J/K.',
      expected_observation:
        'V_n = sqrt(4 * 1.381e-23 * 300 * 10000 * 10000) = approximately 1.286 microvolts (1.286e-6 V).',
      learn_note:
        'Johnson noise is the fundamental thermal noise present in all resistors. It sets the absolute noise floor — you cannot eliminate it. The noise voltage increases with resistance, temperature, and bandwidth.',
    },
    {
      instruction:
        'Double the resistance to 20k ohm and recalculate. Observe how the noise voltage changes.',
      expected_observation:
        'V_n(20k) = sqrt(4 * k_B * 300 * 20000 * 10000) = approximately 1.819 microvolts. The ratio V_n(20k)/V_n(10k) = sqrt(2) = 1.414.',
      learn_note:
        'Doubling resistance doubles noise power (proportional to R), so noise voltage increases by sqrt(2). This is why low-noise amplifier designs use low-value resistors in the signal path.',
    },
    {
      instruction:
        'Now keep R=10k but double bandwidth to 20kHz. Verify the same sqrt(2) relationship holds.',
      expected_observation:
        'V_n(10k, 20kHz) = approximately 1.819 microvolts — the same as doubling R. Doubling bandwidth also doubles noise power.',
      learn_note:
        'Noise power is proportional to bandwidth. This is why narrowing the measurement bandwidth improves signal-to-noise ratio (SNR). Every filter in a signal chain affects the noise bandwidth and thus the noise floor.',
    },
  ],
  verify: () => {
    const k_B = 1.381e-23;
    const T = 300;

    // V_n for R=10k, BW=10kHz
    const Vn_10k_10kBW = Math.sqrt(4 * k_B * T * 10000 * 10000);
    if (Math.abs(Vn_10k_10kBW - 1.286e-6) / 1.286e-6 > 0.05) return false;

    // V_n for R=20k, BW=10kHz — should be sqrt(2) times larger
    const Vn_20k_10kBW = Math.sqrt(4 * k_B * T * 20000 * 10000);
    const ratio1 = Vn_20k_10kBW / Vn_10k_10kBW;
    if (Math.abs(ratio1 - Math.SQRT2) / Math.SQRT2 > 0.01) return false;

    // V_n for R=10k, BW=20kHz — should also be sqrt(2) times larger
    const Vn_10k_20kBW = Math.sqrt(4 * k_B * T * 10000 * 20000);
    const ratio2 = Vn_10k_20kBW / Vn_10k_10kBW;
    if (Math.abs(ratio2 - Math.SQRT2) / Math.SQRT2 > 0.01) return false;

    return true;
  },
};

// ============================================================================
// Lab 6: Signal Sources and Waveform Types (m3-lab-06)
// ============================================================================

const lab06: Lab = {
  id: 'm3-lab-06',
  title: 'Signal Sources and Waveform Types',
  steps: [
    {
      instruction:
        'Compare three waveform types at 1kHz with 1V peak amplitude: sine, square, and triangle. Calculate the RMS voltage for each waveform. Sine: Vrms = Vpeak / sqrt(2). Square: Vrms = Vpeak. Triangle: Vrms = Vpeak / sqrt(3).',
      expected_observation:
        'Sine RMS = 0.7071V, Square RMS = 1.0V, Triangle RMS = 0.5774V. The square wave has the highest RMS because it spends all its time at peak amplitude.',
      learn_note:
        'RMS (root mean square) is the effective or heating value of an AC waveform — a 1V RMS AC signal delivers the same power to a resistor as 1V DC. Different waveshapes at the same peak voltage have different RMS values because their energy distribution over time differs. -- H&H 1.3 [@HH-1.3]',
    },
    {
      instruction:
        'Calculate the crest factor (Vpeak / Vrms) for each waveform. Sine: CF = sqrt(2) = 1.414. Square: CF = 1.0. Triangle: CF = sqrt(3) = 1.732.',
      expected_observation:
        'The triangle wave has the highest crest factor (1.732) and the square wave the lowest (1.0). Higher crest factor means the peak is further from the RMS value.',
      learn_note:
        'Crest factor quantifies how "peaky" a waveform is relative to its effective value. It matters for peak power handling: a signal with crest factor 1.7 needs 1.7x the peak voltage capacity even though its average power is modest. Power supply and amplifier headroom must accommodate the crest factor. -- H&H 1.3 [@HH-1.3]',
    },
    {
      instruction:
        'Verify the frequency/period relationship f = 1/T for all three waveforms at 1kHz. The period T = 1/f = 1/1000 = 1ms = 0.001s. Confirm this holds regardless of waveform shape.',
      expected_observation:
        'All three waveforms at 1kHz have T = 1ms. The frequency/period relationship is independent of waveshape — it depends only on the repetition rate.',
      learn_note:
        'Frequency (Hz) and period (seconds) are reciprocals: f = 1/T. This fundamental relationship holds for any periodic waveform regardless of shape. A 1kHz sine, square, and triangle all complete one full cycle in exactly 1ms. The waveshape affects amplitude statistics (RMS, crest factor) but not timing. -- H&H 1.3 [@HH-1.3]',
    },
  ],
  verify: () => {
    const Vpeak = 1;

    // Sine RMS = Vpeak / sqrt(2)
    const sineRms = Vpeak / Math.SQRT2;
    if (Math.abs(sineRms - 0.7071) >= 0.001) return false;

    // Square RMS = Vpeak
    const squareRms = Vpeak;
    if (Math.abs(squareRms - 1.0) >= 0.001) return false;

    // Triangle RMS = Vpeak / sqrt(3)
    const triangleRms = Vpeak / Math.sqrt(3);
    if (Math.abs(triangleRms - 0.5774) >= 0.001) return false;

    // Sine crest factor = sqrt(2)
    const sineCF = Vpeak / sineRms;
    if (Math.abs(sineCF - Math.SQRT2) >= 0.01) return false;

    // Square crest factor = 1.0
    const squareCF = Vpeak / squareRms;
    if (Math.abs(squareCF - 1.0) >= 0.01) return false;

    // Triangle crest factor = sqrt(3)
    const triangleCF = Vpeak / triangleRms;
    if (Math.abs(triangleCF - Math.sqrt(3)) >= 0.01) return false;

    // Frequency/period: f = 1kHz => T = 1ms
    const f = 1000;
    const T = 1 / f;
    if (Math.abs(T - 0.001) >= 1e-9) return false;

    return true;
  },
};

// ============================================================================
// Export all labs
// ============================================================================

export const labs: Lab[] = [lab01, lab02, lab03, lab04, lab05, lab06];
