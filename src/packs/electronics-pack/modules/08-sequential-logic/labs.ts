/**
 * Module 8: Sequential Logic -- Lab exercises
 *
 * 5 labs demonstrating flip-flops, counters, state machines,
 * shift registers, and memory cells using the LogicSimulator.
 */

import {
  evaluateFlipFlop,
  FlipFlopType,
  type FlipFlopState,
} from '../../simulator/logic-sim.js';

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
// Lab 1: D Flip-Flop from NAND Gates (m8-lab-01)
// ============================================================================

const lab1: Lab = {
  id: 'm8-lab-01',
  title: 'D Flip-Flop from NAND Gates',
  steps: [
    {
      instruction:
        'Start with two cross-coupled NAND gates forming an SR latch. Connect Q output of gate 1 to one input of gate 2, and Q-bar output of gate 2 to one input of gate 1. This creates a bistable memory element -- the foundation of all flip-flops.',
      expected_observation:
        'The SR latch holds its state: once set (S=0 on NAND-based latch), it stays set. Once reset, it stays reset. The cross-coupled feedback is what creates memory.',
      learn_note:
        'Memory in digital circuits emerges from feedback. Two inverting gates (NAND or NOR) connected in a loop have exactly two stable states, like a seesaw that locks in one position. -- H&H 10.3',
    },
    {
      instruction:
        'Add two input NAND gates before the SR latch to create a gated D latch. Route the data input D to one gate and NOT-D to the other, with both gates also receiving the clock (enable) signal. When clock is high, D passes through; when clock is low, the latch holds.',
      expected_observation:
        'With clock high: D=0 produces Q=0, D=1 produces Q=1. With clock low: Q holds its previous value regardless of D changes. The latch is "transparent" when enabled.',
      learn_note:
        'The D latch solves the SR forbidden state by deriving S and R from a single D input. But level-sensitive operation causes problems in multi-stage pipelines -- data can race through. Edge-triggering solves this. -- H&H 10.3',
    },
    {
      instruction:
        'Convert to an edge-triggered D flip-flop by cascading two D latches: a master (clocked on NOT-CLK) and a slave (clocked on CLK). The master captures D when the clock is low; the slave captures the master output on the rising edge. This is the positive-edge-triggered D flip-flop.',
      expected_observation:
        'Set D=0 and apply a rising clock edge: Q becomes 0. Set D=1 and apply a rising clock edge: Q becomes 1. Between clock edges, Q does not change regardless of D.',
      learn_note:
        'Edge-triggering means the flip-flop only samples D at the precise moment of the clock transition. This eliminates transparency problems and makes synchronous design reliable. The D flip-flop is the most widely used flip-flop in modern digital design. -- H&H 10.3',
    },
  ],
  verify: () => {
    // Demonstrate D flip-flop behavior using evaluateFlipFlop
    const init: FlipFlopState = { Q: false, Qbar: true };

    // Test 1: D=0 on rising edge -> Q=0
    const state1 = evaluateFlipFlop(
      FlipFlopType.D,
      { D: false },
      init,
      'rising',
    );
    if (state1.Q !== false || state1.Qbar !== true) return false;

    // Test 2: D=1 on rising edge -> Q=1
    const state2 = evaluateFlipFlop(
      FlipFlopType.D,
      { D: true },
      init,
      'rising',
    );
    if (state2.Q !== true || state2.Qbar !== false) return false;

    // Test 3: No change on falling edge
    const state3 = evaluateFlipFlop(
      FlipFlopType.D,
      { D: true },
      init,
      'falling',
    );
    if (state3.Q !== init.Q || state3.Qbar !== init.Qbar) return false;

    // Test 4: No change when no clock edge
    const state4 = evaluateFlipFlop(
      FlipFlopType.D,
      { D: true },
      init,
      'none',
    );
    if (state4.Q !== init.Q || state4.Qbar !== init.Qbar) return false;

    // Test 5: D=1 then D=0 captures correctly
    const stateA = evaluateFlipFlop(
      FlipFlopType.D,
      { D: true },
      init,
      'rising',
    );
    const stateB = evaluateFlipFlop(
      FlipFlopType.D,
      { D: false },
      stateA,
      'rising',
    );
    if (stateB.Q !== false || stateB.Qbar !== true) return false;

    return true;
  },
};

// ============================================================================
// Lab 2: 4-Bit Binary Counter (m8-lab-02)
// ============================================================================

const lab2: Lab = {
  id: 'm8-lab-02',
  title: '4-Bit Binary Counter',
  steps: [
    {
      instruction:
        'Build a single T flip-flop counter stage. A T (toggle) flip-flop changes state when T=1 on a rising clock edge and holds when T=0. Connect T0 permanently high (always toggle). This creates a divide-by-2: the Q0 output toggles every clock cycle, running at half the clock frequency.',
      expected_observation:
        'Q0 alternates: 0, 1, 0, 1, 0, 1... The output frequency is exactly half the clock frequency. This is the fundamental building block of binary counting.',
      learn_note:
        'A T flip-flop with T=1 is a 1-bit counter. Each stage divides its input frequency by 2. Cascading N stages creates a 2^N modulus counter. -- H&H 10.4',
    },
    {
      instruction:
        'Add three more T flip-flops (T1, T2, T3) to build a 4-bit synchronous counter. The enable logic for synchronous counting: T0 always toggles, T1 toggles when Q0=1, T2 toggles when Q0 AND Q1=1, T3 toggles when Q0 AND Q1 AND Q2=1. All flip-flops share the same clock.',
      expected_observation:
        'The counter counts in binary: 0000, 0001, 0010, 0011, 0100, ..., 1111, 0000. Each clock pulse increments the count by 1. After 16 pulses, it wraps back to 0.',
      learn_note:
        'Synchronous counters clock all flip-flops simultaneously, so all bits update at the same time. This avoids the cumulative propagation delay of ripple counters, enabling higher clock frequencies. -- H&H 10.4',
    },
    {
      instruction:
        'Observe the wrap-around behavior. After the counter reaches 1111 (15), the next clock pulse resets it to 0000. This is a modulo-16 counter. To make a modulo-N counter (e.g., modulo-10 for decimal), add a decoder that detects state N and forces a synchronous reset.',
      expected_observation:
        'Count 15 (1111) + 1 clock = count 0 (0000). The counter cycles endlessly through 0-15. The Q3 output completes one full cycle for every 16 input clocks -- a divide-by-16 frequency divider.',
      learn_note:
        'Counter wrap-around is modular arithmetic in hardware. A 4-bit counter computes (count + 1) mod 16. Prescalers in microcontrollers use this principle to divide high-speed clocks down to usable frequencies. -- H&H 10.4',
    },
  ],
  verify: () => {
    // Simulate a 4-bit synchronous binary counter using 4 T flip-flops
    const ffStates: FlipFlopState[] = [
      { Q: false, Qbar: true },
      { Q: false, Qbar: true },
      { Q: false, Qbar: true },
      { Q: false, Qbar: true },
    ];

    const readCount = (): number => {
      let value = 0;
      for (let i = 0; i < 4; i++) {
        if (ffStates[i].Q) value |= 1 << i;
      }
      return value;
    };

    // Verify initial count is 0
    if (readCount() !== 0) return false;

    // Clock 17 times and verify each count
    for (let clk = 0; clk < 17; clk++) {
      const expectedCount = clk % 16;
      if (readCount() !== expectedCount) return false;

      // Compute toggle enables (synchronous counter logic)
      const t0 = true; // always toggle
      const t1 = ffStates[0].Q;
      const t2 = ffStates[0].Q && ffStates[1].Q;
      const t3 = ffStates[0].Q && ffStates[1].Q && ffStates[2].Q;
      const toggles = [t0, t1, t2, t3];

      // Apply rising edge to all flip-flops simultaneously
      for (let i = 0; i < 4; i++) {
        ffStates[i] = evaluateFlipFlop(
          FlipFlopType.T,
          { T: toggles[i] },
          ffStates[i],
          'rising',
        );
      }
    }

    // After 17 clocks, counter should read 1 (17 mod 16)
    if (readCount() !== 1) return false;

    return true;
  },
};

// ============================================================================
// Lab 3: Traffic Light Controller (m8-lab-03)
// ============================================================================

const lab3: Lab = {
  id: 'm8-lab-03',
  title: 'Traffic Light Controller',
  steps: [
    {
      instruction:
        'Design a Moore state machine with 3 states: GREEN (state 0), YELLOW (state 1), RED (state 2). In a Moore machine, the outputs depend only on the current state, not the inputs. The transition rule is simple: GREEN -> YELLOW -> RED -> GREEN, cycling on each clock edge.',
      expected_observation:
        'Starting in GREEN: after 1 clock the state is YELLOW, after 2 clocks RED, after 3 clocks back to GREEN. The cycle repeats indefinitely. Each state has distinct output signals.',
      learn_note:
        'Moore machines have outputs "attached" to states, so outputs change only on clock edges (no glitches from input changes). This makes them safer for controlling real-world actuators like traffic lights. -- H&H 10.5',
    },
    {
      instruction:
        'Encode the states using 2 bits (two D flip-flops): GREEN=00, YELLOW=01, RED=10. Derive the next-state logic: from 00 go to 01, from 01 go to 10, from 10 go to 00. The output decoder maps: 00 -> green_light=1, 01 -> yellow_light=1, 10 -> red_light=1.',
      expected_observation:
        'The 2-bit state register cycles: 00 -> 01 -> 10 -> 00. Exactly one light output is active at any time. The state encoding uses just 2 flip-flops for 3 states (with state 11 unused).',
      learn_note:
        'Binary encoding uses ceil(log2(N)) flip-flops for N states. One-hot encoding uses N flip-flops but simplifies the decoder -- each flip-flop directly drives one output. For small FSMs, binary is more efficient. -- H&H 10.5',
    },
    {
      instruction:
        'Implement the next-state logic using evaluateFlipFlop for the state register. After computing next-state bits from current state, apply them through D flip-flops on the rising clock edge. Verify the output sequence over 4 clock cycles.',
      expected_observation:
        'Cycle 0: GREEN (green=1, yellow=0, red=0). Cycle 1: YELLOW (green=0, yellow=1, red=0). Cycle 2: RED (green=0, yellow=0, red=1). Cycle 3: GREEN again (green=1, yellow=0, red=0).',
      learn_note:
        'Real traffic controllers are more complex Moore machines with timing counters for each state and sensor inputs for turn signals. But the principle is the same: state register + next-state logic + output decoder. -- H&H 10.5',
    },
  ],
  verify: () => {
    // Moore state machine: GREEN(0) -> YELLOW(1) -> RED(2) -> GREEN(0)
    // 2-bit state register using two D flip-flops
    const STATES = { GREEN: 0, YELLOW: 1, RED: 2 } as const;

    let ff0: FlipFlopState = { Q: false, Qbar: true }; // LSB
    let ff1: FlipFlopState = { Q: false, Qbar: true }; // MSB

    const readState = (): number => (ff1.Q ? 2 : 0) + (ff0.Q ? 1 : 0);

    const decodeOutputs = (
      state: number,
    ): { green: boolean; yellow: boolean; red: boolean } => ({
      green: state === STATES.GREEN,
      yellow: state === STATES.YELLOW,
      red: state === STATES.RED,
    });

    // Expected sequence: GREEN, YELLOW, RED, GREEN
    const expectedSequence = [
      STATES.GREEN,
      STATES.YELLOW,
      STATES.RED,
      STATES.GREEN,
    ];

    for (let cycle = 0; cycle < 4; cycle++) {
      const currentState = readState();
      if (currentState !== expectedSequence[cycle]) return false;

      const outputs = decodeOutputs(currentState);

      // Verify exactly one light is on
      const activeCount = [outputs.green, outputs.yellow, outputs.red].filter(
        Boolean,
      ).length;
      if (activeCount !== 1) return false;

      // Verify the correct light is on
      if (cycle === 0 && !outputs.green) return false;
      if (cycle === 1 && !outputs.yellow) return false;
      if (cycle === 2 && !outputs.red) return false;
      if (cycle === 3 && !outputs.green) return false;

      // Compute next state
      let nextState: number;
      if (currentState === STATES.GREEN) nextState = STATES.YELLOW;
      else if (currentState === STATES.YELLOW) nextState = STATES.RED;
      else nextState = STATES.GREEN;

      // Apply next state through D flip-flops
      const nextBit0 = (nextState & 1) === 1;
      const nextBit1 = (nextState & 2) === 2;

      ff0 = evaluateFlipFlop(
        FlipFlopType.D,
        { D: nextBit0 },
        ff0,
        'rising',
      );
      ff1 = evaluateFlipFlop(
        FlipFlopType.D,
        { D: nextBit1 },
        ff1,
        'rising',
      );
    }

    return true;
  },
};

// ============================================================================
// Lab 4: 4-Bit Shift Register (m8-lab-04)
// ============================================================================

const lab4: Lab = {
  id: 'm8-lab-04',
  title: '4-Bit Shift Register',
  steps: [
    {
      instruction:
        'Build a serial-in parallel-out (SIPO) shift register from 4 D flip-flops. Chain them: serial input feeds D of FF0, Q of FF0 feeds D of FF1, Q of FF1 feeds D of FF2, Q of FF2 feeds D of FF3. All flip-flops share the same clock.',
      expected_observation:
        'On each rising clock edge, data shifts one position to the right (from FF0 toward FF3). The serial input enters at FF0 and propagates through the chain over successive clock cycles.',
      learn_note:
        'A shift register converts serial data to parallel (SIPO) or parallel to serial (PISO). SPI communication uses shift registers to send data between chips one bit at a time. -- H&H 10.4',
    },
    {
      instruction:
        'Shift in the serial sequence [1, 0, 1, 1] over 4 clock cycles. On cycle 1: input 1 enters FF0. On cycle 2: input 0 enters FF0, the 1 shifts to FF1. On cycle 3: input 1 enters FF0, the 0 shifts to FF1, the 1 shifts to FF2. On cycle 4: input 1 enters FF0, completing the shift.',
      expected_observation:
        'After 4 clock cycles, the register contents are: Q0=1 (last bit entered), Q1=1, Q2=0, Q3=1 (first bit shifted furthest). Reading Q3..Q0 gives the original sequence 1,0,1,1.',
      learn_note:
        'The first bit entered shifts the furthest. After N clocks, the shift register holds the last N bits of the serial input stream, with the oldest bit at the far end (Q3) and the newest at the entry (Q0). -- H&H 10.4',
    },
    {
      instruction:
        'Verify the final register state. The serial input sequence [1, 0, 1, 1] should produce Q3=1 (first bit in, shifted through all 4 stages), Q2=0 (second bit), Q1=1 (third bit), Q0=1 (fourth bit, just entered).',
      expected_observation:
        'Q3=1, Q2=0, Q1=1, Q0=1. The parallel output gives us all 4 bits simultaneously, while they were input one at a time serially. This is the core of serial-to-parallel conversion.',
      learn_note:
        'LED chains like WS2812B work on this principle: color data for hundreds of LEDs shifts through the chain serially, and each LED latches its 24 bits of color data as the stream passes through. -- H&H 10.4',
    },
  ],
  verify: () => {
    // 4-bit SIPO shift register using 4 D flip-flops
    // Serial input enters FF0, shifts toward FF3
    const ffStates: FlipFlopState[] = [
      { Q: false, Qbar: true }, // FF0 (entry point)
      { Q: false, Qbar: true }, // FF1
      { Q: false, Qbar: true }, // FF2
      { Q: false, Qbar: true }, // FF3 (far end)
    ];

    // Serial input sequence
    const serialInput = [true, false, true, true]; // [1, 0, 1, 1]

    for (let clk = 0; clk < serialInput.length; clk++) {
      // Capture current Q values for chaining before any updates
      const prevQ = ffStates.map((ff) => ff.Q);

      // FF0 gets serial input
      ffStates[0] = evaluateFlipFlop(
        FlipFlopType.D,
        { D: serialInput[clk] },
        ffStates[0],
        'rising',
      );

      // FF1 gets previous Q of FF0
      ffStates[1] = evaluateFlipFlop(
        FlipFlopType.D,
        { D: prevQ[0] },
        ffStates[1],
        'rising',
      );

      // FF2 gets previous Q of FF1
      ffStates[2] = evaluateFlipFlop(
        FlipFlopType.D,
        { D: prevQ[1] },
        ffStates[2],
        'rising',
      );

      // FF3 gets previous Q of FF2
      ffStates[3] = evaluateFlipFlop(
        FlipFlopType.D,
        { D: prevQ[2] },
        ffStates[3],
        'rising',
      );
    }

    // After shifting [1, 0, 1, 1]:
    // Q0 = 1 (last bit entered = serialInput[3])
    // Q1 = 1 (serialInput[2] shifted once)
    // Q2 = 0 (serialInput[1] shifted twice)
    // Q3 = 1 (serialInput[0] shifted three times -- first bit at far end)
    if (ffStates[0].Q !== true) return false;  // Q0 = 1
    if (ffStates[1].Q !== true) return false;  // Q1 = 1
    if (ffStates[2].Q !== false) return false; // Q2 = 0
    if (ffStates[3].Q !== true) return false;  // Q3 = 1

    return true;
  },
};

// ============================================================================
// Lab 5: SRAM Cell (m8-lab-05)
// ============================================================================

const lab5: Lab = {
  id: 'm8-lab-05',
  title: 'SRAM Cell',
  steps: [
    {
      instruction:
        'Build a 1-bit SRAM cell from two cross-coupled inverters (NOT gates). Connect the output of inverter A to the input of inverter B, and vice versa. This creates a bistable latch that holds either 0 or 1 indefinitely -- the core of static RAM.',
      expected_observation:
        'Once initialized, the latch holds its value with zero power consumption beyond leakage. If node A is 1, inverter A outputs 0 to node B; inverter B then outputs 1 back to node A, reinforcing the state.',
      learn_note:
        'SRAM cells use positive feedback: two inverters in a loop have exactly two stable states. Unlike DRAM, SRAM holds data without refresh as long as power is applied. This makes SRAM faster but larger (6 transistors vs 1T+1C for DRAM). -- H&H 10.5',
    },
    {
      instruction:
        'Add access control via a word-line signal. When word_line is active (true), the bit_line value can be written into the cell. When word_line is inactive (false), the cell is isolated and holds its stored value regardless of bit_line changes.',
      expected_observation:
        'With word_line=true: writing bit_line=1 stores 1, writing bit_line=0 stores 0. With word_line=false: the stored value persists even if bit_line changes.',
      learn_note:
        'In a real 6T SRAM cell, two access transistors (controlled by the word line) connect the internal nodes to the bit lines. During write, the bit lines overpower the cross-coupled inverters to flip the cell. During read, the cell drives a small differential on the bit lines. -- H&H 10.5',
    },
    {
      instruction:
        'Test the full write-hold-overwrite-hold cycle: (1) Activate word_line, write 1 -> stored=1. (2) Deactivate word_line -> still 1. (3) Change bit_line to 0 while word_line is inactive -> still 1 (isolated). (4) Activate word_line, write 0 -> stored=0. (5) Deactivate word_line -> still 0.',
      expected_observation:
        'The SRAM cell correctly stores, holds, and overwrites data. The word_line acts as a gate: data only flows when the word_line allows access.',
      learn_note:
        'CPU L1 caches use SRAM for sub-nanosecond access to frequently used data. DRAM provides main memory density (gigabytes), while SRAM provides cache speed (kilobytes to megabytes). The memory hierarchy trades density for speed at each level. -- H&H 10.5',
    },
  ],
  verify: () => {
    // Model SRAM cell as a bistable latch with word-line access control
    // Using SR flip-flop as the cross-coupled inverter pair
    let cellState: FlipFlopState = { Q: false, Qbar: true }; // Initial: stored 0

    const writeCell = (
      wordLine: boolean,
      bitLine: boolean,
    ): FlipFlopState => {
      if (!wordLine) {
        // Word line inactive -- cell holds its value
        return { ...cellState };
      }
      // Word line active -- write bitLine value to cell
      // Use SR flip-flop: S=bitLine sets Q=1, R=!bitLine resets Q=0
      return evaluateFlipFlop(
        FlipFlopType.SR,
        { S: bitLine, R: !bitLine },
        cellState,
        'rising',
      );
    };

    // Step 1: Write 1 (word_line active, bit_line = 1)
    cellState = writeCell(true, true);
    if (cellState.Q !== true) return false; // stored = 1

    // Step 2: Deactivate word_line -- cell retains 1
    cellState = writeCell(false, true);
    if (cellState.Q !== true) return false;

    // Step 3: Change bit_line to 0 while word_line is inactive -- still 1
    cellState = writeCell(false, false);
    if (cellState.Q !== true) return false;

    // Step 4: Write 0 (word_line active, bit_line = 0)
    cellState = writeCell(true, false);
    if (cellState.Q !== false) return false; // stored = 0

    // Step 5: Deactivate word_line -- cell retains 0
    cellState = writeCell(false, false);
    if (cellState.Q !== false) return false;

    // Step 6: Deactivate with bit_line = 1 -- still 0 (isolated)
    cellState = writeCell(false, true);
    if (cellState.Q !== false) return false;

    return true;
  },
};

// ============================================================================
// Export all labs
// ============================================================================

export const labs: Lab[] = [lab1, lab2, lab3, lab4, lab5];
