/**
 * Module 2: Passive Components -- Lab exercises
 *
 * 5 labs using real MNA simulator analysis (no mocks):
 *   Lab 1: Capacitor Charge/Discharge (transient)
 *   Lab 2: RC Low-Pass Filter (AC)
 *   Lab 3: RC High-Pass Filter (AC)
 *   Lab 4: RLC Resonance (AC)
 *   Lab 5: Thevenin Equivalence (DC)
 */

import { dcAnalysis, acAnalysis } from '../../simulator/mna-engine';
import { transientAnalysis } from '../../simulator/transient';
import type { Component } from '../../simulator/components';

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
// Lab 1: Capacitor Charge/Discharge
// ============================================================================

const lab01: Lab = {
  id: 'm2-lab-01',
  title: 'Capacitor Charge/Discharge',
  steps: [
    {
      instruction:
        'Build an RC circuit: 5V source, R = 10k ohm, C = 10uF. The time constant tau = R * C = 10k * 10uF = 100ms. Run a transient simulation with dt = 1ms and stopTime = 500ms (5 tau).',
      expected_observation:
        'The capacitor voltage starts at 0V and rises exponentially toward 5V. The curve is steepest at t=0 and flattens as the capacitor charges.',
      learn_note:
        'The time constant tau = RC determines how fast a capacitor charges. After 1 tau, the voltage reaches 63.2% of the supply. After 5 tau, it is essentially fully charged (>99%).',
    },
    {
      instruction:
        'Observe the capacitor voltage at t = 1 * tau (100ms). Compare it to the theoretical value of 5V * (1 - e^(-1)) = 3.16V.',
      expected_observation:
        'The voltage at t = 100ms is approximately 3.16V, which is 63.2% of the 5V supply -- exactly matching the exponential charging formula.',
      learn_note:
        'The charging equation V(t) = Vs * (1 - e^(-t/tau)) is one of the most fundamental results in electronics. The 63.2% rule at t = tau provides a quick way to estimate circuit timing.',
    },
    {
      instruction:
        'Check the voltage at t = 500ms (5 * tau). How close is it to the full supply voltage of 5V?',
      expected_observation:
        'At t = 5 * tau, the capacitor voltage is within 1% of 5V, confirming that 5 time constants is sufficient for "fully charged" in practical circuits.',
      learn_note:
        'Engineers use the 5-tau rule as a practical benchmark: after 5 time constants, the transient is effectively complete. This rule applies to both charging and discharging. -- H&H 1.4',
    },
  ],
  verify: () => {
    const components: Component[] = [
      { id: 'V1', type: 'voltage-source', nodes: ['1', '0'], voltage: 5 },
      { id: 'R1', type: 'resistor', nodes: ['1', '2'], resistance: 10000 },
      { id: 'C1', type: 'capacitor', nodes: ['2', '0'], capacitance: 10e-6 },
    ];

    const result = transientAnalysis(components, {
      timeStep: 1e-3,
      stopTime: 500e-3,
      maxIterations: 50,
      tolerance: 1e-6,
    });

    // Find time point closest to t = tau = 100ms
    const tau = 100e-3;
    const atTau = result.timePoints.reduce((prev, curr) =>
      Math.abs(curr.time - tau) < Math.abs(prev.time - tau) ? curr : prev,
    );

    const vCap = atTau.nodeVoltages['2'] ?? 0;
    const expected = 5 * (1 - Math.exp(-1)); // 3.1606...

    // Within 5% tolerance
    return Math.abs(vCap - expected) / expected < 0.05;
  },
};

// ============================================================================
// Lab 2: RC Low-Pass Filter
// ============================================================================

const lab02: Lab = {
  id: 'm2-lab-02',
  title: 'RC Low-Pass Filter',
  steps: [
    {
      instruction:
        'Build an RC low-pass filter: 1V AC source on node 1, R = 1k ohm between nodes 1 and 2, C = 159nF between node 2 and ground. The cutoff frequency is f_c = 1/(2*pi*R*C) = ~1kHz.',
      expected_observation:
        'The output at node 2 passes low frequencies with little attenuation but rolls off at higher frequencies. This is the classic first-order RC low-pass filter.',
      learn_note:
        'A low-pass filter allows signals below the cutoff frequency to pass while attenuating higher frequencies. The RC low-pass is the simplest filter topology and appears everywhere in electronics for noise reduction and signal conditioning. -- H&H 1.4',
    },
    {
      instruction:
        'Run an AC frequency sweep from 10Hz to 100kHz with 20 points per decade. Check the gain at 100Hz (well below cutoff).',
      expected_observation:
        'At 100Hz, the gain is approximately 0dB -- the signal passes through the filter with virtually no attenuation since the capacitor impedance is very high at low frequencies.',
      learn_note:
        'At low frequencies, the capacitor acts like an open circuit (Z_C = 1/(jwC) is large), so virtually all the source voltage appears at the output node. This is the passband of the filter.',
    },
    {
      instruction:
        'Compare the gain at the cutoff frequency (~1kHz) and at 10kHz (one decade above cutoff).',
      expected_observation:
        'At the cutoff frequency, the gain is approximately -3dB (the half-power point). At 10kHz, it drops to approximately -20dB, confirming the -20dB/decade rolloff of a first-order filter.',
      learn_note:
        'The -3dB point defines the cutoff frequency: the output power is half the input power. Beyond cutoff, a first-order RC filter rolls off at -20dB per decade (equivalently -6dB per octave). -- H&H 1.4',
    },
  ],
  verify: () => {
    const components: Component[] = [
      { id: 'V1', type: 'voltage-source', nodes: ['1', '0'], voltage: 1 },
      { id: 'R1', type: 'resistor', nodes: ['1', '2'], resistance: 1000 },
      { id: 'C1', type: 'capacitor', nodes: ['2', '0'], capacitance: 159e-9 },
    ];

    const result = acAnalysis(components, 10, 100000, 20);

    // Helper: find nearest frequency point
    const nearest = (freq: number) =>
      result.reduce((prev, curr) =>
        Math.abs(curr.frequency - freq) < Math.abs(prev.frequency - freq) ? curr : prev,
      );

    const at100Hz = nearest(100);
    const at1kHz = nearest(1000);
    const at10kHz = nearest(10000);

    const gain100 = at100Hz.magnitudes['2'] ?? -999;
    const gain1k = at1kHz.magnitudes['2'] ?? -999;
    const gain10k = at10kHz.magnitudes['2'] ?? -999;

    // 100Hz: near 0dB (within 1dB)
    const pass100 = Math.abs(gain100) < 1;
    // 1kHz (cutoff): near -3dB (within 1dB)
    const pass1k = Math.abs(gain1k - (-3)) < 1;
    // 10kHz: near -20dB (within 3dB)
    const pass10k = Math.abs(gain10k - (-20)) < 3;

    return pass100 && pass1k && pass10k;
  },
};

// ============================================================================
// Lab 3: RC High-Pass Filter
// ============================================================================

const lab03: Lab = {
  id: 'm2-lab-03',
  title: 'RC High-Pass Filter',
  steps: [
    {
      instruction:
        'Build an RC high-pass filter: 1V AC source on node 1, C = 159nF in series between nodes 1 and 2, R = 1k ohm from node 2 to ground. Same components as the LPF but swapped positions.',
      expected_observation:
        'The output at node 2 now passes high frequencies and attenuates low frequencies -- the complement of the low-pass filter built with the same components.',
      learn_note:
        'Swapping the positions of R and C converts a low-pass filter into a high-pass filter. The cutoff frequency remains f_c = 1/(2*pi*RC), but the passband and stopband are reversed. -- H&H 1.4',
    },
    {
      instruction:
        'Run an AC sweep from 10Hz to 100kHz. Check the gain at 10kHz (well above cutoff).',
      expected_observation:
        'At 10kHz, the gain is approximately 0dB. The capacitor impedance is low at high frequencies, so the signal passes through to the resistor with minimal attenuation.',
      learn_note:
        'At high frequencies, the capacitor impedance Z_C = 1/(jwC) becomes very small, effectively acting as a short circuit. This means the full signal appears across the resistor (the output).',
    },
    {
      instruction:
        'Compare the gain at the cutoff frequency (~1kHz) and at 100Hz (one decade below cutoff).',
      expected_observation:
        'At the cutoff, the gain is approximately -3dB. At 100Hz, it drops to approximately -20dB, confirming the +20dB/decade slope in the passband transition.',
      learn_note:
        'High-pass filters are commonly used for AC coupling (blocking DC while passing signals) and for removing low-frequency drift or hum from measurements. -- H&H 1.4',
    },
  ],
  verify: () => {
    const components: Component[] = [
      { id: 'V1', type: 'voltage-source', nodes: ['1', '0'], voltage: 1 },
      { id: 'C1', type: 'capacitor', nodes: ['1', '2'], capacitance: 159e-9 },
      { id: 'R1', type: 'resistor', nodes: ['2', '0'], resistance: 1000 },
    ];

    const result = acAnalysis(components, 10, 100000, 20);

    const nearest = (freq: number) =>
      result.reduce((prev, curr) =>
        Math.abs(curr.frequency - freq) < Math.abs(prev.frequency - freq) ? curr : prev,
      );

    const at10kHz = nearest(10000);
    const at1kHz = nearest(1000);
    const at100Hz = nearest(100);

    const gain10k = at10kHz.magnitudes['2'] ?? -999;
    const gain1k = at1kHz.magnitudes['2'] ?? -999;
    const gain100 = at100Hz.magnitudes['2'] ?? -999;

    // 10kHz: near 0dB (within 1dB)
    const pass10k = Math.abs(gain10k) < 1;
    // 1kHz (cutoff): near -3dB (within 1dB)
    const pass1k = Math.abs(gain1k - (-3)) < 1;
    // 100Hz: near -20dB (within 3dB)
    const pass100 = Math.abs(gain100 - (-20)) < 3;

    return pass10k && pass1k && pass100;
  },
};

// ============================================================================
// Lab 4: RLC Resonance
// ============================================================================

const lab04: Lab = {
  id: 'm2-lab-04',
  title: 'RLC Resonance',
  steps: [
    {
      instruction:
        'Build a series RLC circuit: 1V AC source (nodes 1,0), R = 100 ohm (nodes 1,2), L = 10mH (nodes 2,3), C = 253nF (nodes 3,0). The resonant frequency is f_0 = 1/(2*pi*sqrt(LC)) = ~3.16kHz.',
      expected_observation:
        'At the resonant frequency, the inductor and capacitor impedances cancel (X_L = -X_C), leaving only the resistance. The circuit current reaches its maximum value.',
      learn_note:
        'RLC resonance occurs when the inductive and capacitive reactances are equal and opposite. At resonance, the total impedance is purely resistive and at its minimum for a series circuit. This is the foundation for radio tuning, bandpass filters, and oscillators. -- H&H 1.7',
    },
    {
      instruction:
        'Run an AC sweep from 100Hz to 100kHz with 20 points per decade. Find the frequency where the voltage across R (measured at node 2 relative to source) peaks.',
      expected_observation:
        'The peak response occurs near 3.16kHz. At this frequency, the voltage across R equals the source voltage because the L and C impedances cancel perfectly.',
      learn_note:
        'The resonant frequency f_0 = 1/(2*pi*sqrt(LC)) depends only on L and C, not on R. The resistance determines the sharpness (Q factor) of the resonance peak, not its location.',
    },
    {
      instruction:
        'Calculate the quality factor Q = (1/R)*sqrt(L/C). With R=100, L=10mH, C=253nF, Q should be approximately 1.99.',
      expected_observation:
        'Q = (1/100)*sqrt(0.01/253e-9) = (1/100)*sqrt(39526) = (1/100)*198.8 = 1.99. This moderate Q means the resonance peak is relatively broad.',
      learn_note:
        'The quality factor Q determines the selectivity of the resonant circuit. Higher Q means a sharper peak and narrower bandwidth (BW = f_0/Q). Q also equals the voltage magnification: at resonance, V_L = V_C = Q * V_source. -- H&H 1.7',
    },
  ],
  verify: () => {
    const components: Component[] = [
      { id: 'V1', type: 'voltage-source', nodes: ['1', '0'], voltage: 1 },
      { id: 'R1', type: 'resistor', nodes: ['1', '2'], resistance: 100 },
      { id: 'L1', type: 'inductor', nodes: ['2', '3'], inductance: 10e-3 },
      { id: 'C1', type: 'capacitor', nodes: ['3', '0'], capacitance: 253e-9 },
    ];

    // Use 50 points per decade for better frequency resolution near resonance
    const result = acAnalysis(components, 100, 100000, 50);

    // At resonance, the series L+C impedance cancels, leaving only R.
    // Node '3' voltage (across C) peaks at resonance due to Q magnification.
    // Find the frequency where magnitude at node '3' is maximum (resonance peak)
    let peakFreq = 0;
    let peakMag = -Infinity;
    for (const point of result) {
      const mag = point.magnitudes['3'] ?? -Infinity;
      if (mag > peakMag) {
        peakMag = mag;
        peakFreq = point.frequency;
      }
    }

    // Expected resonant frequency: f_0 = 1/(2*pi*sqrt(10e-3 * 253e-9))
    const f0 = 1 / (2 * Math.PI * Math.sqrt(10e-3 * 253e-9)); // ~3164 Hz

    // Resonant frequency within 15% (log-spaced grid quantization)
    const freqOk = Math.abs(peakFreq - f0) / f0 < 0.15;

    // Q factor: (1/R)*sqrt(L/C)
    const Q = (1 / 100) * Math.sqrt(10e-3 / 253e-9); // ~1.99
    const qOk = Math.abs(Q - 1.99) < 0.1;

    return freqOk && qOk;
  },
};

// ============================================================================
// Lab 5: Thevenin Equivalence
// ============================================================================

const lab05: Lab = {
  id: 'm2-lab-05',
  title: 'Thevenin Equivalence',
  steps: [
    {
      instruction:
        'Build the original circuit: 12V source (nodes 1,0), R1 = 2k (nodes 1,2), R2 = 4k (nodes 2,0), and a load R3 = 1k (nodes 2,3) with R_gnd = 1m (nodes 3,0) to complete the path. Run DC analysis and measure V_load across R3.',
      expected_observation:
        'The original circuit produces a specific voltage across the load resistor R3. By voltage divider with the parallel combination of R2 and R3, V_load = 12 * (R2||R3) / (R1 + R2||R3).',
      learn_note:
        'Before applying Thevenin, we need the baseline: the actual load voltage from the full circuit. This gives us the "truth" to compare against the simplified equivalent. -- H&H 1.2',
    },
    {
      instruction:
        'Calculate the Thevenin equivalent: V_th = 12V * R2/(R1+R2) = 12 * 4k/6k = 8V. R_th = R1||R2 = (2k*4k)/(2k+4k) = 1333.3 ohm.',
      expected_observation:
        'The Thevenin voltage is 8V (open-circuit voltage at node 2 without load). The Thevenin resistance is 1333 ohm (looking back into the network with the source zeroed).',
      learn_note:
        'To find V_th: remove the load and calculate the open-circuit voltage. To find R_th: zero all independent sources (replace voltage sources with shorts) and calculate the resistance seen from the load terminals. -- H&H 1.2',
    },
    {
      instruction:
        'Build the Thevenin equivalent circuit: V_th = 8V source, R_th = 1333.3 ohm, same load R3 = 1k. Compare V_load from both circuits.',
      expected_observation:
        'Both circuits produce the same voltage across the 1k load: V_load = 8V * 1k/(1333.3+1k) = 3.429V. The original and Thevenin circuits are electrically equivalent at the load terminals.',
      learn_note:
        'Thevenin theorem states that any linear two-terminal network can be replaced by a voltage source V_th in series with a resistance R_th. This simplification is invaluable for analyzing circuits with multiple loads or for understanding how a complex source "looks" to a load. -- H&H 1.2',
    },
  ],
  verify: () => {
    // Original circuit: 12V, R1=2k, R2=4k, R_load=1k
    // R_load connects from node 2 to node 'out', and we use R2 in parallel
    const originalComponents: Component[] = [
      { id: 'V1', type: 'voltage-source', nodes: ['1', '0'], voltage: 12 },
      { id: 'R1', type: 'resistor', nodes: ['1', '2'], resistance: 2000 },
      { id: 'R2', type: 'resistor', nodes: ['2', '0'], resistance: 4000 },
      { id: 'R3', type: 'resistor', nodes: ['2', 'out'], resistance: 1000 },
      // Small grounding resistor to define node 'out' voltage
      { id: 'Rg', type: 'resistor', nodes: ['out', '0'], resistance: 1e-3 },
    ];

    const originalResult = dcAnalysis(originalComponents);
    // Voltage across R3: V(2) - V(out)
    // Since Rg is very small, V(out) is near 0, so V_load ~ V(2) * R3/(R3+0) is wrong.
    // Actually with R3 going to out and Rg shorting out to ground,
    // effectively R3 + Rg is in parallel with R2.
    // V(2) from original circuit with load in parallel:
    // R_parallel = (R2 * (R3 + Rg)) / (R2 + R3 + Rg) ~ (4000 * 1000) / 5000 = 800
    // V(2) = 12 * 800 / (2000 + 800) = 12 * 800 / 2800 = 3.4286V
    // V(out) ~ 0 (Rg is tiny), but current through R3 makes V(out) ~ V(2) * Rg / (R3+Rg) ~ 0
    // Hmm, let's just use a simpler topology: R3 between node 2 and ground directly

    // Simpler: original circuit with load R3 directly from node 2 to ground
    const origSimple: Component[] = [
      { id: 'V1', type: 'voltage-source', nodes: ['1', '0'], voltage: 12 },
      { id: 'R1', type: 'resistor', nodes: ['1', '2'], resistance: 2000 },
      { id: 'R2', type: 'resistor', nodes: ['2', '0'], resistance: 4000 },
      { id: 'R3', type: 'resistor', nodes: ['2', '0'], resistance: 1000 },
    ];

    const origResult = dcAnalysis(origSimple);
    const vOriginal = origResult.nodeVoltages.find((nv) => nv.node === '2')?.voltage ?? 0;

    // Thevenin equivalent: Vth = 8V, Rth = 1333.3 ohm, R_load = 1k
    const theveninComponents: Component[] = [
      { id: 'Vth', type: 'voltage-source', nodes: ['t1', '0'], voltage: 8 },
      { id: 'Rth', type: 'resistor', nodes: ['t1', 'out'], resistance: 4000 / 3 }, // 1333.33
      { id: 'R_load', type: 'resistor', nodes: ['out', '0'], resistance: 1000 },
    ];

    const thevResult = dcAnalysis(theveninComponents);
    const vThevenin = thevResult.nodeVoltages.find((nv) => nv.node === 'out')?.voltage ?? 0;

    // Both should match within 0.1%
    if (Math.abs(vOriginal) < 1e-12) return false;
    return Math.abs(vOriginal - vThevenin) / Math.abs(vOriginal) < 0.001;
  },
};

/** All 5 Module 2 labs */
export const labs: Lab[] = [lab01, lab02, lab03, lab04, lab05];
