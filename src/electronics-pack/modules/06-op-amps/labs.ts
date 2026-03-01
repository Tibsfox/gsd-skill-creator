/**
 * Module 6: Op-Amps -- Lab exercises
 *
 * 5 labs backed by real MNA solveNonlinear simulation with op-amp VCVS model.
 * Each lab demonstrates a fundamental op-amp circuit with hands-on simulation
 * and a verify() function that checks expected values against MNA results.
 */

import { solveNonlinear } from '../../simulator/mna-engine.js';
import type { Component, Resistor, VoltageSource, Capacitor, OpAmp } from '../../simulator/components.js';

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
// Helper: check if two values are within a relative tolerance
// ============================================================================

function withinTolerance(actual: number, expected: number, toleranceFraction: number): boolean {
  if (expected === 0) return Math.abs(actual) < toleranceFraction;
  return Math.abs(actual - expected) / Math.abs(expected) < toleranceFraction;
}

// ============================================================================
// Lab 1: Op-Amp Golden Rules (m6-lab-01)
// ============================================================================

const lab01: Lab = {
  id: 'm6-lab-01',
  title: 'Op-Amp Golden Rules',
  steps: [
    {
      instruction: 'Build a voltage follower (unity-gain buffer): connect a 3.3V source to the non-inverting input (+) of an op-amp. Tie the output directly back to the inverting input (-). Add a 1k load resistor from output to ground.',
      expected_observation: 'The output voltage is 3.3V -- exactly equal to the input. The op-amp copies the input to the output with unity gain.',
      learn_note: 'Golden Rule 1: No current flows into the op-amp inputs (infinite input impedance). Golden Rule 2: With negative feedback, V+ = V-. Since V+ = 3.3V and V- is connected to the output, V_out = 3.3V.',
    },
    {
      instruction: 'Check the voltages at both op-amp inputs. The non-inverting input is at 3.3V (from the source). The inverting input is connected to the output.',
      expected_observation: 'Both inputs are at 3.3V. V+ = V- = V_out = 3.3V. The golden rules are satisfied: the negative feedback forces the inputs to be equal.',
      learn_note: 'The voltage follower is the simplest op-amp circuit and the best demonstration of the golden rules. It has unity gain (Av = 1) but provides impedance transformation -- high input impedance, low output impedance.',
    },
    {
      instruction: 'Consider why the buffer is useful: it can drive a low-impedance load without loading the source. The 1k load draws 3.3mA from the op-amp output, but zero current from the 3.3V source.',
      expected_observation: 'The op-amp provides all the load current from its power supply, not from the signal source. The source sees infinite impedance (no current drawn).',
      learn_note: 'Buffers are essential when connecting high-impedance sensors to low-impedance loads. Without a buffer, the load would form a voltage divider with the source impedance, reducing the signal level.',
    },
  ],
  verify: () => {
    const components: Component[] = [
      { id: 'V_in', type: 'voltage-source', nodes: ['inp', '0'], voltage: 3.3 } as VoltageSource,
      { id: 'R_load', type: 'resistor', nodes: ['out', '0'], resistance: 1000 } as Resistor,
    ];

    const opamps: OpAmp[] = [
      {
        id: 'U1',
        type: 'op-amp',
        nonInvertingInput: 'inp',
        invertingInput: 'out',   // output tied directly to inverting input (100% feedback)
        output: 'out',
        openLoopGain: 1e6,
        gbwProduct: 1e6,
        slewRate: 1,
        inputOffset: 0,
      },
    ];

    const result = solveNonlinear(components, '0', 50, 1e-6, opamps);
    if (!result.converged) return false;

    const vOut = result.nodeVoltages.find((nv) => nv.node === 'out');
    const vInp = result.nodeVoltages.find((nv) => nv.node === 'inp');
    if (!vOut || !vInp) return false;

    // V_out should be ~ 3.3V (unity gain buffer)
    if (!withinTolerance(vOut.voltage, 3.3, 0.01)) return false;

    // Golden rule 2: V+ ~ V- (inverting input = output for this circuit)
    // V+ = vInp, V- = vOut (they should be equal within tolerance)
    if (!withinTolerance(vOut.voltage, vInp.voltage, 0.01)) return false;

    return true;
  },
};

// ============================================================================
// Lab 2: Non-Inverting Amplifier (m6-lab-02)
// ============================================================================

const lab02: Lab = {
  id: 'm6-lab-02',
  title: 'Non-Inverting Amplifier',
  steps: [
    {
      instruction: 'Build a non-inverting amplifier: V_in = 1V to the non-inverting input. Feedback network: R_f = 9k from output to inverting input, R_g = 1k from inverting input to ground. This sets the gain to 1 + R_f/R_g = 10.',
      expected_observation: 'V_out = 10V. The 1V input is amplified by a factor of 10. The output is in phase with the input (non-inverting).',
      learn_note: 'The non-inverting amplifier gain formula: Av = 1 + R_f/R_g. The "1 +" comes from the fact that the input signal appears directly at the non-inverting pin, and the feedback divider determines how much of the output returns to the inverting pin.',
    },
    {
      instruction: 'Verify the golden rules: V+ = V- means the inverting input is at 1V (same as the non-inverting input). The voltage divider R_g/(R_f + R_g) applied to V_out gives V- = 10V * 1k/(9k+1k) = 1V.',
      expected_observation: 'The inverting input is at 1V, confirming V+ = V-. The feedback divider sets V- = V_out * R_g/(R_f + R_g) = V_in.',
      learn_note: 'You can derive the gain formula from the golden rules alone: V- = V+ = V_in. V- = V_out * R_g/(R_f+R_g). Therefore V_in = V_out * R_g/(R_f+R_g), giving V_out/V_in = (R_f+R_g)/R_g = 1 + R_f/R_g.',
    },
    {
      instruction: 'Note the high input impedance: the signal source drives the non-inverting input directly, drawing no current (golden rule 1). This makes the non-inverting amplifier ideal for buffering weak signals.',
      expected_observation: 'The input impedance is effectively infinite (limited only by the op-amp\'s real input impedance, typically 1M-1T ohms). No current flows into the + input.',
      learn_note: 'The non-inverting amplifier is the workhorse of analog design. Its high input impedance, precise gain, and in-phase output make it the go-to choice for sensor signal conditioning. H&H Ch.4.',
    },
  ],
  verify: () => {
    const components: Component[] = [
      { id: 'V_in', type: 'voltage-source', nodes: ['inp', '0'], voltage: 1 } as VoltageSource,
      { id: 'R_f', type: 'resistor', nodes: ['out', 'inv'], resistance: 9000 } as Resistor,
      { id: 'R_g', type: 'resistor', nodes: ['inv', '0'], resistance: 1000 } as Resistor,
    ];

    const opamps: OpAmp[] = [
      {
        id: 'U1',
        type: 'op-amp',
        nonInvertingInput: 'inp',
        invertingInput: 'inv',
        output: 'out',
        openLoopGain: 1e6,
        gbwProduct: 1e6,
        slewRate: 1,
        inputOffset: 0,
      },
    ];

    const result = solveNonlinear(components, '0', 50, 1e-6, opamps);
    if (!result.converged) return false;

    const vOut = result.nodeVoltages.find((nv) => nv.node === 'out');
    if (!vOut) return false;

    // Gain = 1 + 9000/1000 = 10, V_out = 10 * 1V = 10V
    return withinTolerance(vOut.voltage, 10.0, 0.01);
  },
};

// ============================================================================
// Lab 3: Active Low-Pass Filter — Sallen-Key (m6-lab-03)
// ============================================================================

const lab03: Lab = {
  id: 'm6-lab-03',
  title: 'Active Low-Pass Filter (Sallen-Key)',
  steps: [
    {
      instruction: 'Build a Sallen-Key unity-gain low-pass filter: R1=10k (input to node A), R2=10k (node A to non-inv input), C1=10nF (node A to ground), C2=10nF (non-inv input to ground). Op-amp as voltage follower (output tied to inverting input). Apply 1V DC input.',
      expected_observation: 'At DC, V_out = 1V. Capacitors are open circuits at DC, so the signal passes straight through the resistors to the op-amp buffer, which outputs 1V.',
      learn_note: 'The Sallen-Key topology is a second-order active filter. At DC, the capacitors block no signal (infinite impedance), so the passband gain is unity. The op-amp acts as a buffer providing low output impedance.',
    },
    {
      instruction: 'Calculate the cutoff frequency: f_c = 1/(2*pi*R*C) = 1/(2*pi*10000*10e-9) = 1.59 kHz. Above this frequency, the filter attenuates at -40dB/decade (second-order rolloff).',
      expected_observation: 'The cutoff frequency is about 1.59 kHz. A first-order RC filter has -20dB/decade rolloff, but this second-order Sallen-Key doubles that to -40dB/decade.',
      learn_note: 'The Sallen-Key LPF combines two RC sections with an op-amp buffer between them. The buffer prevents the second RC section from loading the first, preserving the full second-order response. Q = 0.5 gives a Butterworth (maximally flat) response. H&H Ch.6.',
    },
    {
      instruction: 'Note that our DC analysis cannot sweep frequency -- it only confirms the passband gain. AC analysis would show the full Bode plot with the -40dB/decade rolloff above f_c.',
      expected_observation: 'DC verification confirms the filter passes low frequencies (gain = 1 in the passband). The second-order nature would be visible in an AC frequency sweep as steeper rolloff than a single RC.',
      learn_note: 'Active filters are superior to passive RC filters in three ways: (1) sharper rolloff per stage, (2) no insertion loss (can even provide gain), and (3) low output impedance for driving loads. The tradeoff is needing a power supply for the op-amp.',
    },
  ],
  verify: () => {
    // Sallen-Key unity-gain LPF at DC:
    // At DC, capacitors are open circuits, so R1-R2 form a resistive path to the
    // op-amp non-inverting input. With no load on the resistors (op-amp has infinite
    // input impedance), V_nonInv = V_in = 1V, and the unity-gain buffer outputs 1V.
    const components: Component[] = [
      { id: 'V_in', type: 'voltage-source', nodes: ['inp', '0'], voltage: 1 } as VoltageSource,
      { id: 'R1', type: 'resistor', nodes: ['inp', 'a'], resistance: 10000 } as Resistor,
      { id: 'R2', type: 'resistor', nodes: ['a', 'ninv'], resistance: 10000 } as Resistor,
      { id: 'C1', type: 'capacitor', nodes: ['a', '0'], capacitance: 10e-9 } as Capacitor,
      { id: 'C2', type: 'capacitor', nodes: ['ninv', '0'], capacitance: 10e-9 } as Capacitor,
    ];

    const opamps: OpAmp[] = [
      {
        id: 'U1',
        type: 'op-amp',
        nonInvertingInput: 'ninv',
        invertingInput: 'out',   // voltage follower: output tied to inverting input
        output: 'out',
        openLoopGain: 1e6,
        gbwProduct: 1e6,
        slewRate: 1,
        inputOffset: 0,
      },
    ];

    const result = solveNonlinear(components, '0', 50, 1e-6, opamps);
    if (!result.converged) return false;

    const vOut = result.nodeVoltages.find((nv) => nv.node === 'out');
    if (!vOut) return false;

    // At DC: V_out ~ V_in = 1V (passband, within 5%)
    return withinTolerance(vOut.voltage, 1.0, 0.05);
  },
};

// ============================================================================
// Lab 4: Integrator (m6-lab-04)
// ============================================================================

const lab04: Lab = {
  id: 'm6-lab-04',
  title: 'Integrator',
  steps: [
    {
      instruction: 'Build an integrator: R_in=10k from input to inverting node, C_f=100nF from output to inverting node, R_f=1M from output to inverting node (parallel with C_f for DC stability). V_in=0.1V. Non-inverting input tied to ground.',
      expected_observation: 'At DC steady state, the capacitor is an open circuit, so only R_f provides the feedback path. The circuit behaves as an inverting amplifier with gain -R_f/R_in = -1M/10k = -100. V_out = -100 * 0.1V = -10V.',
      learn_note: 'A practical integrator needs a large feedback resistor (R_f) in parallel with C_f to set the DC operating point. Without R_f, the integrator\'s output would drift to the rail due to tiny input offsets. R_f limits the DC gain to -R_f/R_in.',
    },
    {
      instruction: 'Calculate the integration time constant: tau = R_in * C_f = 10k * 100nF = 1ms. At frequencies above 1/(2*pi*tau) = 159 Hz, the capacitor\'s impedance is lower than R_f, and integration dominates.',
      expected_observation: 'Below 159 Hz, R_f dominates feedback (inverting amplifier). Above 159 Hz, C_f dominates (true integrator behavior). The crossover frequency is where |Xc| = R_f, i.e., 1/(2*pi*100nF*1M) = 1.6 Hz.',
      learn_note: 'The integrator output is V_out = -(1/RC) * integral(V_in dt) in the frequency range where the capacitor dominates. At DC, the output would ramp indefinitely without R_f. The R_f sets a "floor" on the feedback impedance. H&H Ch.4.',
    },
    {
      instruction: 'Verify the golden rules: V- = V+ = 0V (non-inverting input is grounded). Current through R_in = 0.1V/10k = 10uA. In DC steady state, this current flows through R_f (since C_f is open at DC), producing V_out = -10uA * 1M = -10V.',
      expected_observation: 'The virtual ground at the inverting input (V- = 0V) means R_in sees the full input voltage across it. All input current flows through the feedback network. At DC, R_f carries this current.',
      learn_note: 'The virtual ground concept (golden rule 2 with V+ grounded) is key to analyzing inverting configurations. The inverting input acts as a summing junction where input currents are balanced by feedback currents.',
    },
  ],
  verify: () => {
    const components: Component[] = [
      { id: 'V_in', type: 'voltage-source', nodes: ['inp_r', '0'], voltage: 0.1 } as VoltageSource,
      { id: 'R_in', type: 'resistor', nodes: ['inp_r', 'inv'], resistance: 10000 } as Resistor,
      { id: 'C_f', type: 'capacitor', nodes: ['out', 'inv'], capacitance: 100e-9 } as Capacitor,
      { id: 'R_f', type: 'resistor', nodes: ['out', 'inv'], resistance: 1e6 } as Resistor,
    ];

    const opamps: OpAmp[] = [
      {
        id: 'U1',
        type: 'op-amp',
        nonInvertingInput: '0',   // non-inverting tied to ground
        invertingInput: 'inv',
        output: 'out',
        openLoopGain: 1e6,
        gbwProduct: 1e6,
        slewRate: 1,
        inputOffset: 0,
      },
    ];

    const result = solveNonlinear(components, '0', 50, 1e-6, opamps);
    if (!result.converged) return false;

    const vOut = result.nodeVoltages.find((nv) => nv.node === 'out');
    if (!vOut) return false;

    // DC gain: -R_f/R_in = -1M/10k = -100. V_out = -100 * 0.1V = -10V
    return withinTolerance(vOut.voltage, -10.0, 0.05);
  },
};

// ============================================================================
// Lab 5: Comparator (m6-lab-05)
// ============================================================================

const lab05: Lab = {
  id: 'm6-lab-05',
  title: 'Comparator',
  steps: [
    {
      instruction: 'Build a comparator: op-amp with NO feedback. V_ref=2.5V to the inverting input. V_in=3.0V to the non-inverting input. R_load=10k from output to ground. Open-loop gain = 1,000,000.',
      expected_observation: 'V_out is extremely large and positive: A*(V+ - V-) = 1e6*(3.0 - 2.5) = 500,000V. Without feedback, the op-amp amplifies the tiny difference to an enormous voltage.',
      learn_note: 'Without negative feedback, the op-amp operates in open-loop mode. The output is A*(V+ - V-), where A is the open-loop gain (typically 100,000-1,000,000). Even a millivolt difference drives the output to the rails.',
    },
    {
      instruction: 'Consider what happens with V_in=2.0V (below V_ref=2.5V): V+ - V- = 2.0 - 2.5 = -0.5V. Output = 1e6 * (-0.5) = -500,000V. The output swings to the negative rail.',
      expected_observation: 'When V+ < V-, the output goes strongly negative. The comparator acts as a binary decision maker: output is HIGH when input exceeds the reference, LOW when below.',
      learn_note: 'A comparator is essentially a 1-bit ADC. It converts an analog voltage into a binary decision: above or below a threshold. Real comparators have rail-to-rail output stages; general-purpose op-amps as comparators are slower but work for low-frequency applications.',
    },
    {
      instruction: 'Note the key difference from amplifier circuits: there is no negative feedback. Without feedback, the golden rules do NOT apply -- V+ does not equal V-. The op-amp is operating in its nonlinear (saturated) regime.',
      expected_observation: 'The difference between V+ and V- is 0.5V -- far from zero. Golden rule 2 only works with negative feedback. Without it, the op-amp is just a very high gain differential amplifier.',
      learn_note: 'Comparators and amplifiers use the same device but in fundamentally different modes. Amplifiers use negative feedback to create a linear transfer function. Comparators use open-loop gain for a step-like (binary) transfer function. Adding hysteresis (Schmitt trigger) prevents oscillation at the threshold. H&H Ch.4.',
    },
  ],
  verify: () => {
    const components: Component[] = [
      { id: 'V_in', type: 'voltage-source', nodes: ['ninv', '0'], voltage: 3.0 } as VoltageSource,
      { id: 'V_ref', type: 'voltage-source', nodes: ['inv', '0'], voltage: 2.5 } as VoltageSource,
      { id: 'R_load', type: 'resistor', nodes: ['out', '0'], resistance: 10000 } as Resistor,
    ];

    const opamps: OpAmp[] = [
      {
        id: 'U1',
        type: 'op-amp',
        nonInvertingInput: 'ninv',
        invertingInput: 'inv',
        output: 'out',
        openLoopGain: 1e6,
        gbwProduct: 1e6,
        slewRate: 1,
        inputOffset: 0,
      },
    ];

    const result = solveNonlinear(components, '0', 50, 1e-6, opamps);
    if (!result.converged) return false;

    const vOut = result.nodeVoltages.find((nv) => nv.node === 'out');
    if (!vOut) return false;

    // V+ > V- => V_out should be very large positive (> 100V)
    return vOut.voltage > 100;
  },
};

// ============================================================================
// Lab 6: Summing Amplifier (m6-lab-06)
// ============================================================================

const lab06: Lab = {
  id: 'm6-lab-06',
  title: 'Summing Amplifier',
  steps: [
    {
      instruction: 'Build an inverting summing amplifier: three inputs V1=1V, V2=2V, V3=3V each through R=10k to the inverting node. Feedback resistor Rf=10k from output to inverting node. Non-inverting input tied to ground.',
      expected_observation: 'V_out = -(V1 + V2 + V3) = -(1 + 2 + 3) = -6V. Each input contributes independently through its own resistor to the virtual ground summing junction.',
      learn_note: 'The summing amplifier adds multiple signals with weights set by the resistor ratios Rf/Rn. With equal resistors, all inputs have unity gain. Changing one resistor changes only that input\'s weight -- H&H 4.2 [@HH-Ch.4]',
    },
    {
      instruction: 'Verify superposition: disconnect V2 and V3 (ground their inputs). With only V1=1V, V_out should be -1V. Each input acts independently because the inverting node is a virtual ground.',
      expected_observation: 'With a single 1V input, V_out = -(Rf/R1)*V1 = -1V. The virtual ground ensures that current from one input does not affect the other input resistors.',
      learn_note: 'Superposition works perfectly in the summing amplifier because the virtual ground isolates each input. Current from V1 through R1 flows into the summing junction and out through Rf, independent of other inputs -- H&H 4.2 [@HH-Ch.4]',
    },
    {
      instruction: 'Now consider a weighted summer: if R1=10k, R2=20k, R3=40k with Rf=10k, the gains become -Rf/R1=-1, -Rf/R2=-0.5, -Rf/R3=-0.25. This creates a binary-weighted DAC.',
      expected_observation: 'V_out = -(1*V1 + 0.5*V2 + 0.25*V3). With V1=V2=V3=1V: V_out = -1.75V. Different resistor ratios set different weights for each input.',
      learn_note: 'A binary-weighted summing amplifier with resistor ratios 1:2:4:8 is the basis of the R-2R DAC. Each input contributes a binary-weighted fraction of the output. Precision resistors are essential for accuracy -- H&H 4.2 [@HH-Ch.4]',
    },
  ],
  verify: () => {
    // Inverting summing amplifier: R1=R2=R3=Rf=10k
    // V1=1V, V2=2V, V3=3V => V_out = -(1+2+3) = -6V
    const components: Component[] = [
      { id: 'V1', type: 'voltage-source', nodes: ['inp1', '0'], voltage: 1 } as VoltageSource,
      { id: 'V2', type: 'voltage-source', nodes: ['inp2', '0'], voltage: 2 } as VoltageSource,
      { id: 'V3', type: 'voltage-source', nodes: ['inp3', '0'], voltage: 3 } as VoltageSource,
      { id: 'R1', type: 'resistor', nodes: ['inp1', 'inv'], resistance: 10000 } as Resistor,
      { id: 'R2', type: 'resistor', nodes: ['inp2', 'inv'], resistance: 10000 } as Resistor,
      { id: 'R3', type: 'resistor', nodes: ['inp3', 'inv'], resistance: 10000 } as Resistor,
      { id: 'Rf', type: 'resistor', nodes: ['out', 'inv'], resistance: 10000 } as Resistor,
    ];

    const opamps: OpAmp[] = [
      {
        id: 'U1',
        type: 'op-amp',
        nonInvertingInput: '0',
        invertingInput: 'inv',
        output: 'out',
        openLoopGain: 1e6,
        gbwProduct: 1e6,
        slewRate: 1,
        inputOffset: 0,
      },
    ];

    const result = solveNonlinear(components, '0', 50, 1e-6, opamps);
    if (!result.converged) return false;

    const vOut = result.nodeVoltages.find((nv) => nv.node === 'out');
    if (!vOut) return false;

    // V_out should be ~ -6V (within 5%)
    return withinTolerance(vOut.voltage, -6.0, 0.05);
  },
};

// ============================================================================
// Lab 7: Differentiator (m6-lab-07)
// ============================================================================

const lab07: Lab = {
  id: 'm6-lab-07',
  title: 'Differentiator',
  steps: [
    {
      instruction: 'Build an op-amp differentiator: C_in=100nF from input to inverting node, Rf=10k from output to inverting node. Non-inverting input tied to ground. Apply a DC input of 1V.',
      expected_observation: 'At DC steady state, the capacitor is an open circuit -- no current flows through C_in. With no current through Rf, V_out = 0V. The differentiator only responds to changing signals.',
      learn_note: 'The differentiator output is proportional to the rate of change of the input: V_out = -Rf*C*dVin/dt. At DC (constant input), dVin/dt = 0, so V_out = 0V. The circuit is the dual of the integrator -- H&H 4.2 [@HH-Ch.4]',
    },
    {
      instruction: 'Calculate the time constant: tau = Rf * C_in = 10k * 100nF = 1ms. This sets the frequency where the differentiator gain reaches unity (0dB): f_0 = 1/(2*pi*tau) = 159 Hz.',
      expected_observation: 'Below 159 Hz, the differentiator has gain < 1 (attenuates). Above 159 Hz, gain > 1 (amplifies). The gain rises at +20dB/decade -- the opposite of an integrator.',
      learn_note: 'The rising gain at high frequencies makes differentiators noise-sensitive. A small series resistor (Rs) in front of C_in limits the high-frequency gain to Rf/Rs, preventing noise amplification and oscillation -- H&H 4.2 [@HH-Ch.4]',
    },
    {
      instruction: 'Compare differentiator vs integrator: the integrator has Rf*C in the feedback path (low-pass), while the differentiator has C in the input path (high-pass). They are mathematical duals.',
      expected_observation: 'Integrator: V_out = -(1/RC)*integral(Vin dt), gain falls with frequency. Differentiator: V_out = -RC*dVin/dt, gain rises with frequency. Together they can reconstruct signals.',
      learn_note: 'Practical differentiators always include a stability resistor to limit high-frequency gain. Without it, the 90-degree phase shift from C combined with the op-amp phase shift can cause oscillation at high frequencies -- H&H 4.2 [@HH-Ch.4]',
    },
  ],
  verify: () => {
    // DC steady-state: C_in is open circuit, so V_out = 0V
    const components: Component[] = [
      { id: 'V_in', type: 'voltage-source', nodes: ['inp', '0'], voltage: 1 } as VoltageSource,
      { id: 'C_in', type: 'capacitor', nodes: ['inp', 'inv'], capacitance: 100e-9 } as Capacitor,
      { id: 'Rf', type: 'resistor', nodes: ['out', 'inv'], resistance: 10000 } as Resistor,
    ];

    const opamps: OpAmp[] = [
      {
        id: 'U1',
        type: 'op-amp',
        nonInvertingInput: '0',
        invertingInput: 'inv',
        output: 'out',
        openLoopGain: 1e6,
        gbwProduct: 1e6,
        slewRate: 1,
        inputOffset: 0,
      },
    ];

    const result = solveNonlinear(components, '0', 50, 1e-6, opamps);
    if (!result.converged) return false;

    const vOut = result.nodeVoltages.find((nv) => nv.node === 'out');
    if (!vOut) return false;

    // At DC: V_out should be ~ 0V (within absolute tolerance 0.1V)
    if (Math.abs(vOut.voltage) > 0.1) return false;

    // Mathematical verification: time constant tau = Rf * C = 10k * 100nF = 1ms
    const tau = 10000 * 100e-9;
    if (!withinTolerance(tau, 1e-3, 0.01)) return false;

    return true;
  },
};

// ============================================================================
// Lab 8: Op-Amp Non-Idealities (m6-lab-08)
// ============================================================================

const lab08: Lab = {
  id: 'm6-lab-08',
  title: 'Op-Amp Non-Idealities',
  steps: [
    {
      instruction: 'Consider a non-inverting amplifier with gain=100 (Rf=99k, Rg=1k) using an op-amp with GBW=1MHz. The closed-loop bandwidth is GBW/gain = 1MHz/100 = 10kHz.',
      expected_observation: 'At 10kHz (the -3dB frequency), the gain drops to 100/sqrt(2) = 70.71. Above 10kHz, the gain continues to fall at -20dB/decade until it reaches unity at 1MHz.',
      learn_note: 'The gain-bandwidth product (GBW) is constant for a single-pole op-amp: if you increase the gain, the bandwidth decreases proportionally. A gain of 1000 with GBW=1MHz gives only 1kHz bandwidth -- H&H 4.3 [@HH-Ch.4]',
    },
    {
      instruction: 'Add input offset voltage: Vos=5mV. With gain=100, the output offset is Vos*(1+Rf/Rg) = 5mV*100 = 500mV. This DC error appears even with the input grounded.',
      expected_observation: 'With input grounded, the output sits at 500mV instead of 0V. For precision applications, you need low-offset op-amps (Vos < 100uV) or auto-zero techniques.',
      learn_note: 'Input offset voltage is the most common source of DC error in op-amp circuits. It gets amplified by the noise gain (1+Rf/Rg), not the signal gain. Chopper-stabilized op-amps can achieve Vos < 1uV -- H&H 4.3 [@HH-Ch.4]',
    },
    {
      instruction: 'Calculate the slew rate limit: SR=1V/us. For a 10Vpp sine wave (Vpeak=5V), the maximum frequency without slewing is f_max = SR/(2*pi*Vpeak) = 1e6/(2*pi*5) = 31.83kHz.',
      expected_observation: 'Above 31.83kHz with 10Vpp output, the op-amp cannot change voltage fast enough. The sine wave becomes a triangle wave, introducing severe distortion.',
      learn_note: 'Slew rate and GBW are independent limits. GBW limits small-signal bandwidth; slew rate limits large-signal bandwidth. A circuit can have adequate GBW but still distort large signals due to slew rate limiting -- H&H 4.3 [@HH-Ch.4]',
    },
  ],
  verify: () => {
    // Pure mathematical verification (DC model cannot simulate frequency response)
    const gain = 100;
    const gbw = 1e6; // 1 MHz
    const vos = 5e-3; // 5 mV
    const slewRate = 1e6; // 1 V/us = 1e6 V/s
    const vPeak = 5; // 5V peak (10Vpp)

    // GBW limit: bandwidth = GBW / gain = 10kHz
    const bandwidth = gbw / gain;
    if (!withinTolerance(bandwidth, 10000, 0.01)) return false;

    // At bandwidth frequency: gain drops to gain/sqrt(2) ~ 70.71
    const gainAtBandwidth = gain / Math.sqrt(2);
    if (!withinTolerance(gainAtBandwidth, 70.71, 0.01)) return false;

    // Input offset: output offset = Vos * gain = 500mV
    const outputOffset = vos * gain;
    if (!withinTolerance(outputOffset, 0.5, 0.01)) return false;

    // Slew rate limit: f_max = SR / (2*pi*Vpeak) ~ 31.83kHz
    const fMax = slewRate / (2 * Math.PI * vPeak);
    if (!withinTolerance(fMax, 31830.99, 0.01)) return false;

    return true;
  },
};

// ============================================================================
// Export all labs
// ============================================================================

export const labs: Lab[] = [lab01, lab02, lab03, lab04, lab05, lab06, lab07, lab08];
