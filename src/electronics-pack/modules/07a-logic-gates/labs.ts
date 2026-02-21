/**
 * Module 7A: Logic Gates -- Lab exercises
 *
 * 7 labs covering CMOS gate construction, Boolean algebra,
 * De Morgan's theorem, combinational building blocks, and timing.
 * All labs use the LogicSimulator (not MNA engine).
 */

import {
  LogicSimulator,
  GateType,
  evaluateGate,
  getGateInternals,
  generateTruthTable,
  generateTimingDiagram,
  buildRippleCarryAdder,
} from '../../simulator/logic-sim';

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
// Lab 1: Gates from Transistors (m7a-lab-01)
// ============================================================================

const lab1: Lab = {
  id: 'm7a-lab-01',
  title: 'Gates from Transistors',
  steps: [
    {
      instruction:
        'Create a LogicSimulator and add a NAND gate with inputs A and B and output Y. ' +
        'A CMOS NAND gate uses 4 MOSFETs: 2 PMOS in parallel for the pull-up network ' +
        'and 2 NMOS in series for the pull-down network.',
      expected_observation:
        'The simulator accepts the gate definition. The NAND gate has propagation delay ' +
        'and connects two input signals to one output signal.',
      learn_note:
        'In CMOS, the pull-up network (PMOS) and pull-down network (NMOS) are complementary. ' +
        'For NAND: parallel PMOS means either input LOW pulls output HIGH; series NMOS means ' +
        'both inputs must be HIGH to pull output LOW. -- H&H 10.2',
    },
    {
      instruction:
        'Generate a truth table for the NAND gate by enumerating all 4 input combinations ' +
        '(A=0,B=0), (A=0,B=1), (A=1,B=0), (A=1,B=1) and recording the output Y for each.',
      expected_observation:
        'Truth table shows: (0,0)->1, (0,1)->1, (1,0)->1, (1,1)->0. ' +
        'The output is LOW only when BOTH inputs are HIGH.',
      learn_note:
        'NAND is NOT-AND: it inverts the AND function. NAND is a universal gate -- ' +
        'any Boolean function can be built from NAND gates alone. -- H&H 10.1',
    },
    {
      instruction:
        'Use getGateInternals(GateType.NAND) to inspect the CMOS construction details. ' +
        'Verify that a 2-input NAND uses exactly 4 MOSFETs (2 PMOS + 2 NMOS).',
      expected_observation:
        'GateInternals reports mosfetCount=4, pull-up network is "2 PMOS in parallel", ' +
        'pull-down network is "2 NMOS in series".',
      learn_note:
        'For an N-input NAND gate, the MOSFET count is 2N: N PMOS in parallel and N NMOS ' +
        'in series. A 3-input NAND uses 6 MOSFETs, a 4-input uses 8. -- H&H 10.2',
    },
  ],
  verify: () => {
    // Build NAND gate
    const sim = new LogicSimulator();
    sim.addGate({
      id: 'NAND1',
      type: GateType.NAND,
      inputs: ['A', 'B'],
      output: 'Y',
      propagationDelay: 10,
    });

    // Generate truth table
    const tt = generateTruthTable(sim, ['A', 'B'], ['Y']);

    // Expected NAND outputs: (0,0)->1, (0,1)->1, (1,0)->1, (1,1)->0
    const expected = [true, true, true, false];
    for (let i = 0; i < 4; i++) {
      if (tt.rows[i].outputs[0] !== expected[i]) return false;
    }

    // Verify CMOS internals
    const internals = getGateInternals(GateType.NAND);
    if (internals.mosfetCount !== 4) return false;

    return true;
  },
};

// ============================================================================
// Lab 2: Boolean Simplification (m7a-lab-02)
// ============================================================================

const lab2: Lab = {
  id: 'm7a-lab-02',
  title: 'Boolean Simplification',
  steps: [
    {
      instruction:
        'Build the unsimplified expression AB + AB\' as a gate circuit. ' +
        'Use AND(A,B)->P, NOT(B)->B_not, AND(A,B_not)->Q, OR(P,Q)->Y_unsimplified. ' +
        'This expression has two product terms that share variable A.',
      expected_observation:
        'The circuit produces output Y_unsimplified for all 4 input combinations of A and B.',
      learn_note:
        'AB + AB\' factors as A(B + B\'). Since B + B\' = 1 (complementary law), ' +
        'the expression simplifies to A * 1 = A. -- H&H 10.1',
    },
    {
      instruction:
        'Build the simplified expression: just buffer A through to Y_simplified. ' +
        'Use BUF(A)->Y_simplified. This is the algebraically reduced form.',
      expected_observation:
        'Y_simplified follows A directly: when A=0, Y=0; when A=1, Y=1.',
      learn_note:
        'A Karnaugh map confirms this simplification. In a 2-variable K-map for AB + AB\', ' +
        'the two 1-cells in row A=1 form a group of 2, which reads as just A. -- H&H 10.1',
    },
    {
      instruction:
        'Generate truth tables for both circuits and compare outputs row by row. ' +
        'Both should produce identical results for all input combinations, proving the simplification is valid.',
      expected_observation:
        'All 4 rows match: the unsimplified AB + AB\' and the simplified A produce ' +
        'the same output for every combination of A and B.',
      learn_note:
        'Boolean simplification reduces gate count (4 gates to 1), saving area, power, ' +
        'and propagation delay. In real designs, synthesis tools automate this process. -- H&H 10.1',
    },
  ],
  verify: () => {
    // Build unsimplified: AB + AB'
    const simUnsimplified = new LogicSimulator();
    simUnsimplified.addGate({
      id: 'AND1',
      type: GateType.AND,
      inputs: ['A', 'B'],
      output: 'P',
      propagationDelay: 10,
    });
    simUnsimplified.addGate({
      id: 'NOT1',
      type: GateType.NOT,
      inputs: ['B'],
      output: 'B_not',
      propagationDelay: 10,
    });
    simUnsimplified.addGate({
      id: 'AND2',
      type: GateType.AND,
      inputs: ['A', 'B_not'],
      output: 'Q',
      propagationDelay: 10,
    });
    simUnsimplified.addGate({
      id: 'OR1',
      type: GateType.OR,
      inputs: ['P', 'Q'],
      output: 'Y_unsimplified',
      propagationDelay: 10,
    });

    // Build simplified: just A
    const simSimplified = new LogicSimulator();
    simSimplified.addGate({
      id: 'BUF1',
      type: GateType.BUF,
      inputs: ['A'],
      output: 'Y_simplified',
      propagationDelay: 10,
    });

    // Generate truth tables
    const ttUnsimplified = generateTruthTable(
      simUnsimplified,
      ['A', 'B'],
      ['Y_unsimplified'],
    );
    const ttSimplified = generateTruthTable(
      simSimplified,
      ['A', 'B'],
      ['Y_simplified'],
    );

    // Compare all rows
    for (let i = 0; i < ttUnsimplified.rows.length; i++) {
      if (
        ttUnsimplified.rows[i].outputs[0] !== ttSimplified.rows[i].outputs[0]
      ) {
        return false;
      }
    }

    return true;
  },
};

// ============================================================================
// Lab 3: De Morgan's Theorem (m7a-lab-03)
// ============================================================================

const lab3: Lab = {
  id: 'm7a-lab-03',
  title: "De Morgan's Theorem",
  steps: [
    {
      instruction:
        'Build Circuit 1: NOT(A AND B). Use AND(A,B)->W, then NOT(W)->Y1. ' +
        'This computes the complement of the AND function.',
      expected_observation:
        'Circuit 1 produces Y1: (0,0)->1, (0,1)->1, (1,0)->1, (1,1)->0. ' +
        'This is the NAND function.',
      learn_note:
        'De Morgan\'s first law states NOT(A AND B) = NOT(A) OR NOT(B). ' +
        'This means a NAND gate is logically equivalent to an OR gate with inverted inputs. -- H&H 10.1',
    },
    {
      instruction:
        'Build Circuit 2: NOT(A) OR NOT(B). Use NOT(A)->A_not, NOT(B)->B_not, ' +
        'then OR(A_not, B_not)->Y2. This is the De Morgan equivalent form.',
      expected_observation:
        'Circuit 2 produces Y2: (0,0)->1, (0,1)->1, (1,0)->1, (1,1)->0. ' +
        'The truth table matches Circuit 1 exactly.',
      learn_note:
        'De Morgan\'s second law is the dual: NOT(A OR B) = NOT(A) AND NOT(B). ' +
        'Together these laws allow conversion between AND/OR forms, which is ' +
        'essential for NAND-only or NOR-only implementations. -- H&H 10.1',
    },
    {
      instruction:
        'Generate truth tables for both circuits and verify that Y1 equals Y2 ' +
        'for all 4 input combinations. This proves De Morgan\'s first law by exhaustive enumeration.',
      expected_observation:
        'All 4 rows match: NOT(A AND B) produces the same output as NOT(A) OR NOT(B) ' +
        'for every combination of A and B.',
      learn_note:
        'De Morgan\'s laws extend to N variables: NOT(A AND B AND C) = NOT(A) OR NOT(B) OR NOT(C). ' +
        'They are used extensively in logic synthesis and gate-level optimization. -- H&H 10.1',
    },
  ],
  verify: () => {
    // Circuit 1: NOT(A AND B)
    const sim1 = new LogicSimulator();
    sim1.addGate({
      id: 'AND1',
      type: GateType.AND,
      inputs: ['A', 'B'],
      output: 'W',
      propagationDelay: 10,
    });
    sim1.addGate({
      id: 'NOT1',
      type: GateType.NOT,
      inputs: ['W'],
      output: 'Y1',
      propagationDelay: 10,
    });

    // Circuit 2: NOT(A) OR NOT(B)
    const sim2 = new LogicSimulator();
    sim2.addGate({
      id: 'NOT_A',
      type: GateType.NOT,
      inputs: ['A'],
      output: 'A_not',
      propagationDelay: 10,
    });
    sim2.addGate({
      id: 'NOT_B',
      type: GateType.NOT,
      inputs: ['B'],
      output: 'B_not',
      propagationDelay: 10,
    });
    sim2.addGate({
      id: 'OR1',
      type: GateType.OR,
      inputs: ['A_not', 'B_not'],
      output: 'Y2',
      propagationDelay: 10,
    });

    // Generate truth tables
    const tt1 = generateTruthTable(sim1, ['A', 'B'], ['Y1']);
    const tt2 = generateTruthTable(sim2, ['A', 'B'], ['Y2']);

    // Compare all 4 rows
    for (let i = 0; i < 4; i++) {
      if (tt1.rows[i].outputs[0] !== tt2.rows[i].outputs[0]) return false;
    }

    return true;
  },
};

// ============================================================================
// Lab 4: 4-Bit Adder (m7a-lab-04)
// ============================================================================

const lab4: Lab = {
  id: 'm7a-lab-04',
  title: '4-Bit Adder',
  steps: [
    {
      instruction:
        'Use buildRippleCarryAdder to construct a 4-bit adder in the LogicSimulator. ' +
        'This creates 20 gates: 5 per bit (2 XOR, 2 AND, 1 OR) implementing four cascaded full adders. ' +
        'Carry-in (C0) is grounded.',
      expected_observation:
        'The simulator now contains 20 gates with signals A0-A3, B0-B3 (inputs), ' +
        'S0-S3 (sum), and C4 (carry-out).',
      learn_note:
        'A full adder computes Sum = A XOR B XOR Cin and Cout = (A AND B) OR (P AND Cin), ' +
        'where P = A XOR B (propagate). The carry chain is the critical path. -- H&H 10.1',
    },
    {
      instruction:
        'Test the adder with a few example values: 3+5=8, 7+7=14, 15+1=0 (with carry). ' +
        'Set input bits from binary decomposition, evaluate, and read back sum and carry.',
      expected_observation:
        '3+5: S=8, C=0. 7+7: S=14, C=0. 15+1: S=0, C=1 (overflow to 5-bit result 16).',
      learn_note:
        'The ripple-carry adder has worst-case delay proportional to N (the bit width). ' +
        'For a 4-bit adder with 10ns gates, worst-case carry propagation is about 80ns ' +
        '(carry ripples through 8 gate delays). -- H&H 10.2',
    },
    {
      instruction:
        'Exhaustively test all 256 input combinations (a=0..15, b=0..15). ' +
        'For each combination, verify that the 4-bit sum equals (a+b) mod 16 ' +
        'and the carry-out equals (a+b >= 16).',
      expected_observation:
        'All 256 combinations produce correct results. The gate-level simulation ' +
        'matches integer arithmetic perfectly.',
      learn_note:
        'Exhaustive testing is feasible for small circuits. For larger designs, ' +
        'formal verification or constrained random testing is used. -- H&H 10.1',
    },
  ],
  verify: () => {
    // Test all 256 input combinations
    for (let a = 0; a < 16; a++) {
      for (let b = 0; b < 16; b++) {
        const sim = new LogicSimulator();
        const adder = buildRippleCarryAdder(sim);

        // Set input bits
        for (let i = 0; i < 4; i++) {
          sim.setSignal(adder.inputA[i], ((a >> i) & 1) === 1);
          sim.setSignal(adder.inputB[i], ((b >> i) & 1) === 1);
        }

        // Evaluate to steady state
        sim.evaluate();

        // Read sum bits
        let sumValue = 0;
        for (let i = 0; i < 4; i++) {
          if (sim.getSignal(adder.sum[i])) {
            sumValue |= 1 << i;
          }
        }
        const carry = sim.getSignal(adder.carryOut);

        // Verify
        const expectedSum = (a + b) % 16;
        const expectedCarry = a + b >= 16;
        if (sumValue !== expectedSum || carry !== expectedCarry) {
          return false;
        }
      }
    }

    return true;
  },
};

// ============================================================================
// Lab 5: Multiplexer (m7a-lab-05)
// ============================================================================

const lab5: Lab = {
  id: 'm7a-lab-05',
  title: 'Multiplexer',
  steps: [
    {
      instruction:
        'Build a 4-to-1 multiplexer from AND, OR, and NOT gates. ' +
        'The MUX has 4 data inputs (D0-D3), 2 select inputs (S0, S1), and 1 output (Y). ' +
        'First create inverters: NOT(S0)->S0_not, NOT(S1)->S1_not.',
      expected_observation:
        'The select inverters are ready. S0_not and S1_not provide the complemented select signals ' +
        'needed for the AND gate decoding.',
      learn_note:
        'A 4-to-1 MUX selects one of 4 inputs based on a 2-bit select code. ' +
        'Select=00 routes D0, 01 routes D1, 10 routes D2, 11 routes D3. -- H&H 10.1',
    },
    {
      instruction:
        'Create four 3-input AND gates, each combining one data input with the appropriate ' +
        'select combination: AND(D0,S1_not,S0_not)->T0, AND(D1,S1_not,S0)->T1, ' +
        'AND(D2,S1,S0_not)->T2, AND(D3,S1,S0)->T3.',
      expected_observation:
        'Each AND gate activates only when its select combination matches AND its data input is HIGH. ' +
        'Only one T signal can be HIGH at a time (for a given select value).',
      learn_note:
        'The AND gates act as enable switches: each one passes its data input through ' +
        'only when the select lines decode to its address. -- H&H 10.1',
    },
    {
      instruction:
        'Combine the four AND outputs using OR gates: OR(T0,T1)->U1, OR(T2,T3)->U2, ' +
        'OR(U1,U2)->Y. Since our gates are 2-input, we cascade two levels of OR.',
      expected_observation:
        'The output Y reflects whichever data input is selected by S1:S0. ' +
        'Test all 4 select combinations to confirm correct routing.',
      learn_note:
        'Multiplexers are fundamental building blocks: they implement any Boolean function ' +
        '(a 2^N-to-1 MUX with N select lines can implement any N-variable function). -- H&H 10.1',
    },
  ],
  verify: () => {
    // Test all 4 select combinations
    const selectCombinations = [
      { S0: false, S1: false, activeInput: 'D0' },
      { S0: true, S1: false, activeInput: 'D1' },
      { S0: false, S1: true, activeInput: 'D2' },
      { S0: true, S1: true, activeInput: 'D3' },
    ];

    for (const combo of selectCombinations) {
      // Test with selected input HIGH
      {
        const sim = new LogicSimulator();
        buildMux4to1(sim);

        sim.setSignal('S0', combo.S0);
        sim.setSignal('S1', combo.S1);
        sim.setSignal('D0', false);
        sim.setSignal('D1', false);
        sim.setSignal('D2', false);
        sim.setSignal('D3', false);
        sim.setSignal(combo.activeInput, true);

        sim.evaluate();
        if (!sim.getSignal('Y')) return false;
      }

      // Test with selected input LOW (all others LOW too)
      {
        const sim = new LogicSimulator();
        buildMux4to1(sim);

        sim.setSignal('S0', combo.S0);
        sim.setSignal('S1', combo.S1);
        sim.setSignal('D0', false);
        sim.setSignal('D1', false);
        sim.setSignal('D2', false);
        sim.setSignal('D3', false);

        sim.evaluate();
        if (sim.getSignal('Y')) return false;
      }
    }

    return true;
  },
};

/** Helper: build a 4-to-1 MUX in the given simulator */
function buildMux4to1(sim: LogicSimulator): void {
  // Select inverters
  sim.addGate({
    id: 'NOT_S0',
    type: GateType.NOT,
    inputs: ['S0'],
    output: 'S0_not',
    propagationDelay: 10,
  });
  sim.addGate({
    id: 'NOT_S1',
    type: GateType.NOT,
    inputs: ['S1'],
    output: 'S1_not',
    propagationDelay: 10,
  });

  // AND gates for each data input with its select decode
  // D0: S1=0, S0=0 -> AND(D0, S1_not, S0_not)
  // Since AND gates take 2 inputs, chain: AND(S1_not, S0_not)->SEL0, AND(D0, SEL0)->T0
  sim.addGate({
    id: 'SEL0',
    type: GateType.AND,
    inputs: ['S1_not', 'S0_not'],
    output: 'SEL0',
    propagationDelay: 10,
  });
  sim.addGate({
    id: 'T0',
    type: GateType.AND,
    inputs: ['D0', 'SEL0'],
    output: 'T0',
    propagationDelay: 10,
  });

  // D1: S1=0, S0=1 -> AND(D1, S1_not, S0)
  sim.addGate({
    id: 'SEL1',
    type: GateType.AND,
    inputs: ['S1_not', 'S0'],
    output: 'SEL1',
    propagationDelay: 10,
  });
  sim.addGate({
    id: 'T1',
    type: GateType.AND,
    inputs: ['D1', 'SEL1'],
    output: 'T1',
    propagationDelay: 10,
  });

  // D2: S1=1, S0=0 -> AND(D2, S1, S0_not)
  sim.addGate({
    id: 'SEL2',
    type: GateType.AND,
    inputs: ['S1', 'S0_not'],
    output: 'SEL2',
    propagationDelay: 10,
  });
  sim.addGate({
    id: 'T2',
    type: GateType.AND,
    inputs: ['D2', 'SEL2'],
    output: 'T2',
    propagationDelay: 10,
  });

  // D3: S1=1, S0=1 -> AND(D3, S1, S0)
  sim.addGate({
    id: 'SEL3',
    type: GateType.AND,
    inputs: ['S1', 'S0'],
    output: 'SEL3',
    propagationDelay: 10,
  });
  sim.addGate({
    id: 'T3',
    type: GateType.AND,
    inputs: ['D3', 'SEL3'],
    output: 'T3',
    propagationDelay: 10,
  });

  // OR tree: OR(T0,T1)->U1, OR(T2,T3)->U2, OR(U1,U2)->Y
  sim.addGate({
    id: 'OR_U1',
    type: GateType.OR,
    inputs: ['T0', 'T1'],
    output: 'U1',
    propagationDelay: 10,
  });
  sim.addGate({
    id: 'OR_U2',
    type: GateType.OR,
    inputs: ['T2', 'T3'],
    output: 'U2',
    propagationDelay: 10,
  });
  sim.addGate({
    id: 'OR_Y',
    type: GateType.OR,
    inputs: ['U1', 'U2'],
    output: 'Y',
    propagationDelay: 10,
  });
}

// ============================================================================
// Lab 6: Decoder (m7a-lab-06)
// ============================================================================

const lab6: Lab = {
  id: 'm7a-lab-06',
  title: 'Decoder',
  steps: [
    {
      instruction:
        'Build a 2-to-4 decoder using AND and NOT gates. ' +
        'The decoder has 2 inputs (A, B) and 4 outputs (Y0-Y3). ' +
        'First create inverters: NOT(A)->A_not, NOT(B)->B_not.',
      expected_observation:
        'The input inverters are ready. A_not and B_not provide the complemented ' +
        'signals needed for the AND gate minterms.',
      learn_note:
        'A decoder activates exactly one of 2^N outputs for each N-bit input combination. ' +
        'It is the inverse function of an encoder. -- H&H 10.1',
    },
    {
      instruction:
        'Create four AND gates, one for each minterm: ' +
        'AND(A_not,B_not)->Y0, AND(A_not,B)->Y1, AND(A,B_not)->Y2, AND(A,B)->Y3.',
      expected_observation:
        'Each AND gate produces HIGH for exactly one input combination: ' +
        'Y0 for 00, Y1 for 01, Y2 for 10, Y3 for 11.',
      learn_note:
        'Each output corresponds to a minterm of the input variables. ' +
        'Decoders are used in memory address decoding, instruction decoding, ' +
        'and as building blocks for arbitrary logic functions. -- H&H 10.1',
    },
    {
      instruction:
        'Test all 4 input combinations and verify that exactly one output is HIGH for each. ' +
        'This confirms one-hot encoding of the binary input.',
      expected_observation:
        'Input 00->Y0=1 (only), 01->Y1=1 (only), 10->Y2=1 (only), 11->Y3=1 (only). ' +
        'All other outputs are LOW in each case.',
      learn_note:
        'The one-hot property is essential: if two outputs were active simultaneously, ' +
        'the downstream circuit would receive conflicting signals. -- H&H 10.1',
    },
  ],
  verify: () => {
    const inputCombinations = [
      { A: false, B: false, activeOutput: 'Y0' },
      { A: false, B: true, activeOutput: 'Y1' },
      { A: true, B: false, activeOutput: 'Y2' },
      { A: true, B: true, activeOutput: 'Y3' },
    ];

    const outputs = ['Y0', 'Y1', 'Y2', 'Y3'];

    for (const combo of inputCombinations) {
      const sim = new LogicSimulator();

      // Inverters
      sim.addGate({
        id: 'NOT_A',
        type: GateType.NOT,
        inputs: ['A'],
        output: 'A_not',
        propagationDelay: 10,
      });
      sim.addGate({
        id: 'NOT_B',
        type: GateType.NOT,
        inputs: ['B'],
        output: 'B_not',
        propagationDelay: 10,
      });

      // Minterms
      sim.addGate({
        id: 'Y0_gate',
        type: GateType.AND,
        inputs: ['A_not', 'B_not'],
        output: 'Y0',
        propagationDelay: 10,
      });
      sim.addGate({
        id: 'Y1_gate',
        type: GateType.AND,
        inputs: ['A_not', 'B'],
        output: 'Y1',
        propagationDelay: 10,
      });
      sim.addGate({
        id: 'Y2_gate',
        type: GateType.AND,
        inputs: ['A', 'B_not'],
        output: 'Y2',
        propagationDelay: 10,
      });
      sim.addGate({
        id: 'Y3_gate',
        type: GateType.AND,
        inputs: ['A', 'B'],
        output: 'Y3',
        propagationDelay: 10,
      });

      sim.setSignal('A', combo.A);
      sim.setSignal('B', combo.B);
      sim.evaluate();

      // Verify exactly one output is HIGH
      for (const out of outputs) {
        const expected = out === combo.activeOutput;
        if (sim.getSignal(out) !== expected) return false;
      }
    }

    return true;
  },
};

// ============================================================================
// Lab 7: Propagation Delay (m7a-lab-07)
// ============================================================================

const lab7: Lab = {
  id: 'm7a-lab-07',
  title: 'Propagation Delay',
  steps: [
    {
      instruction:
        'Build a chain of 4 inverters: NOT(IN)->N1, NOT(N1)->N2, NOT(N2)->N3, NOT(N3)->OUT. ' +
        'Each inverter has propagationDelay=10ns. The total chain delay is 4 * 10ns = 40ns.',
      expected_observation:
        'The simulator contains 4 NOT gates in series. A change at IN must propagate ' +
        'through all 4 gates before appearing at OUT.',
      learn_note:
        'Propagation delay is cumulative through a chain of gates. The critical path ' +
        '(longest delay path) determines the maximum clock frequency of the circuit. -- H&H 10.2',
    },
    {
      instruction:
        'Create an input sequence that toggles IN from false to true at step 1. ' +
        'Use at least 6 time steps to observe the delay propagation through the chain.',
      expected_observation:
        'IN transitions to HIGH at step 1. Due to propagation delay, N1 inverts at step 2, ' +
        'N2 at step 3, N3 at step 4, and OUT at step 5.',
      learn_note:
        'With 4 inverters (even number), the steady-state output equals the input. ' +
        'But during the transient, the output lags by 4 gate delays. -- H&H 10.2',
    },
    {
      instruction:
        'Generate a timing diagram for signals [IN, N1, N2, N3, OUT] and verify ' +
        'that OUT changes 4 steps after IN. At step 1, IN=true but OUT still=false.',
      expected_observation:
        'The timing diagram shows the step-by-step propagation: each gate inverts ' +
        'with a 1-step delay. The waveform visually demonstrates delay accumulation.',
      learn_note:
        'In real circuits, critical path analysis determines timing closure. ' +
        'If the total delay exceeds the clock period minus setup time, the design fails timing. ' +
        'f_max = 1 / (t_pd_critical + t_setup). -- H&H 10.2',
    },
  ],
  verify: () => {
    const sim = new LogicSimulator();

    // Chain of 4 inverters
    sim.addGate({
      id: 'INV1',
      type: GateType.NOT,
      inputs: ['IN'],
      output: 'N1',
      propagationDelay: 10,
    });
    sim.addGate({
      id: 'INV2',
      type: GateType.NOT,
      inputs: ['N1'],
      output: 'N2',
      propagationDelay: 10,
    });
    sim.addGate({
      id: 'INV3',
      type: GateType.NOT,
      inputs: ['N2'],
      output: 'N3',
      propagationDelay: 10,
    });
    sim.addGate({
      id: 'INV4',
      type: GateType.NOT,
      inputs: ['N3'],
      output: 'OUT',
      propagationDelay: 10,
    });

    // Let the chain settle with IN=false first (need 5 settling steps),
    // then toggle IN=true and observe delay propagation.
    // generateTimingDiagram records signals BEFORE step(), so
    // each step() propagates gate outputs by one level.
    //
    // Steady state with IN=false: N1=T, N2=F, N3=T, OUT=F
    // After IN->true: N1=F (1 step), N2=T (2 steps), N3=F (3 steps), OUT=T (4 steps)
    const inputSequence: Record<string, boolean>[] = [
      { IN: false }, // step 0: settling
      { IN: false }, // step 1: settling
      { IN: false }, // step 2: settling
      { IN: false }, // step 3: settling
      { IN: false }, // step 4: settled -- record steady state
      { IN: true },  // step 5: toggle! IN changes
      { IN: true },  // step 6: N1 responds
      { IN: true },  // step 7: N2 responds
      { IN: true },  // step 8: N3 responds
      { IN: true },  // step 9: OUT responds
    ];

    const td = generateTimingDiagram(
      sim,
      inputSequence,
      ['IN', 'N1', 'N2', 'N3', 'OUT'],
    );

    const outWave = td.waveforms['OUT'];

    // At step 4 (settled with IN=false): OUT should be false
    // (IN=F -> N1=T -> N2=F -> N3=T -> OUT=F)
    if (outWave[4] !== false) return false;

    // At step 5: IN just changed to true, but OUT has not yet responded
    if (outWave[5] !== false) return false;

    // At step 6: only 1 gate delay elapsed, OUT still false
    if (outWave[6] !== false) return false;

    // By step 9 (4 gate delays after step 5), OUT should be true
    // (IN=T -> N1=F -> N2=T -> N3=F -> OUT=T)
    if (outWave[9] !== true) return false;

    return true;
  },
};

// ============================================================================
// Export all labs
// ============================================================================

export const labs: Lab[] = [lab1, lab2, lab3, lab4, lab5, lab6, lab7];
