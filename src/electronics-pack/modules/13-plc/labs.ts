/**
 * Module 13: Programmable Logic Controllers -- Lab exercises
 *
 * 5 labs backed by the PLC engine demonstrating industrial automation concepts:
 * relay-to-ladder logic, home automation SET/RESET, PID temperature control,
 * Modbus communication, and safety interlock systems.
 *
 * Phase 275 Plan 02.
 */

import {
  parseLadder,
  createPLCState,
  scanCycle,
  pidCompute,
  createPIDState,
  createModbusRegisters,
  readCoil,
  writeCoil,
  readHoldingRegister,
  writeHoldingRegister,
} from '../../simulator/plc-engine';

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
// Lab 1: Relay to Ladder Logic (m13-lab-01)
// ============================================================================

const lab01: Lab = {
  id: 'm13-lab-01',
  title: 'Relay to Ladder Logic',
  steps: [
    {
      instruction:
        'Build a motor start/stop circuit in ladder logic. The circuit has two parallel branches feeding a coil: branch 1 is the start button (X0, normally open) in series with a stop button (X1, normally closed), branch 2 is the seal-in contact (Y0, normally open) in series with the same stop button (X1, NC). The coil is Y0 (motor). Parse this ladder program and observe the rung structure.',
      expected_observation:
        'The parser produces one rung with two parallel branches. Branch 1 has contacts [X0, /X1] (start AND NOT stop). Branch 2 has contacts [Y0, /X1] (seal-in AND NOT stop). The coil is Y0 (motor output). This mirrors a real relay panel where the start pushbutton and holding contactor are wired in parallel.',
      learn_note:
        'Ladder logic was invented to look like relay wiring diagrams so electricians could program PLCs without learning a new notation. Each rung represents a circuit path from the left power rail to the right. Contacts on the left are conditions; the coil on the right is the action. -- IEC 61131-3',
    },
    {
      instruction:
        'Run a scan cycle with X0=true (start pressed), X1=false (stop not pressed). The start contact X0 closes, the NC stop contact /X1 is closed (X1 is false, so NC passes), and the motor coil Y0 energizes. Now release the start button (X0=false) and run another scan. Observe the seal-in effect.',
      expected_observation:
        'First scan: Y0 becomes true (motor starts). Second scan with X0=false: Y0 remains true because the Y0 contact in the parallel branch now carries current. The motor "seals in" through its own output feeding back as an input. This is the fundamental latch pattern in industrial control.',
      learn_note:
        'The seal-in (or holding) circuit is the most important ladder logic pattern. The output Y0 feeds back as a contact in parallel with the start button. Once energized, the output holds itself on even after the momentary start button is released. This eliminates the need for a maintained switch. -- IEC 61131-3',
    },
    {
      instruction:
        'Press the stop button (X1=true) while the motor is running. The NC contact /X1 opens (X1=true means the normally-closed contact breaks). Run a scan cycle and verify the motor stops. Then verify it cannot restart while stop is held.',
      expected_observation:
        'With X1=true: the /X1 contact opens in both branches, breaking all current paths to Y0. The motor coil de-energizes (Y0=false). Even if X0 is also pressed (X0=true, X1=true), the motor stays off because /X1 blocks both branches. The stop button has unconditional priority -- a fundamental safety requirement.',
      learn_note:
        'In real installations, the stop button is ALWAYS normally closed (NC). This means a broken wire also stops the motor -- a fail-safe design. If the stop button were normally open, a broken wire would prevent stopping the motor entirely. This wire-break safety principle is mandated by electrical codes worldwide. -- IEC 61131-3',
    },
  ],
  verify: () => {
    const ladder = `
|--[X0]--[/X1]--+--[Y0]--[/X1]--(Y0)|
`;
    const rungs = parseLadder(ladder);
    let state = createPLCState();

    // Initial state: motor off
    state = scanCycle(rungs, state, { X0: false, X1: false });
    if (state.outputs['Y0'] !== false && state.outputs['Y0'] !== undefined) return false;

    // Press start (X0=true, X1=false): motor on
    state = scanCycle(rungs, state, { X0: true, X1: false });
    if (state.outputs['Y0'] !== true) return false;

    // Release start (X0=false, X1=false): motor still on (sealed in)
    state = scanCycle(rungs, state, { X0: false, X1: false });
    if (state.outputs['Y0'] !== true) return false;

    // Press stop (X0=false, X1=true): motor off
    state = scanCycle(rungs, state, { X0: false, X1: true });
    if (state.outputs['Y0'] !== false) return false;

    return true;
  },
};

// ============================================================================
// Lab 2: Home Automation (m13-lab-02)
// ============================================================================

const lab02: Lab = {
  id: 'm13-lab-02',
  title: 'Home Automation',
  steps: [
    {
      instruction:
        'Build a 2-zone lighting system using SET/RESET latching coils. Zone 1 uses X0 to SET Y0 (lights on) and X1 to RESET Y0 (lights off). Zone 2 uses X2 to SET Y1 and X3 to RESET Y1. A fifth rung uses Y0 AND Y1 to drive Y2 (both-zones indicator). Parse the 5-rung ladder program.',
      expected_observation:
        'Five rungs are parsed. Rungs 1-2 control zone 1 with SET/RESET coils. Rungs 3-4 control zone 2 with SET/RESET coils. Rung 5 has two series contacts (Y0 and Y1) driving a standard OUT coil Y2. SET coils latch on; RESET coils latch off -- the output remembers its state between scans.',
      learn_note:
        'SET and RESET coils provide bistable (latching) behavior. Unlike standard OUT coils that follow the rung state every scan, SET only turns ON (never off) and RESET only turns OFF (never on). This is equivalent to a flip-flop in digital logic. Use SET/RESET when you need the output to remember its state. -- IEC 61131-3',
    },
    {
      instruction:
        'Activate zone 1 by pressing X0 (X0=true). Verify Y0 latches on. Then release X0 and verify Y0 stays on (SET coil retains state). Now activate zone 2 (X2=true). Check that both Y0 and Y1 are on, and the both-zones indicator Y2 also turns on.',
      expected_observation:
        'After X0 pulse: Y0=true (zone 1 on), Y1=false, Y2=false. After X2 pulse: Y0=true, Y1=true, Y2=true (both zones on, indicator lit). The SET coils remember their state even after the input buttons are released. The AND rung correctly detects when both zones are active simultaneously.',
      learn_note:
        'Home automation systems use latching outputs extensively. A momentary wall switch sends a pulse to SET; another pulse to RESET. The PLC remembers the state even through power cycles if battery-backed memory is used. Modern building management systems (BMS) use this exact pattern for HVAC zones, lighting scenes, and access control. -- IEC 61131-3',
    },
    {
      instruction:
        'Deactivate zone 1 by pressing X1 (X1=true). Verify Y0 resets to false and the both-zones indicator Y2 also goes off (since Y0 AND Y1 is no longer true). Zone 2 should remain on independently.',
      expected_observation:
        'After X1 pulse: Y0=false (zone 1 off), Y1=true (zone 2 still on), Y2=false (indicator off because Y0 is false). Each zone operates independently -- resetting one does not affect the other. The AND indicator correctly reflects the combined state.',
      learn_note:
        'Independent zone control is a core requirement in building automation. Each zone has its own SET/RESET pair, and combination logic (AND, OR) creates status indicators and interlocks. Real BMS systems have dozens of zones with hierarchical control: room-level, floor-level, and building-level overrides. -- IEC 61131-3',
    },
  ],
  verify: () => {
    const ladder = `
|--[X0]--(S Y0)|
|--[X1]--(R Y0)|
|--[X2]--(S Y1)|
|--[X3]--(R Y1)|
|--[Y0]--[Y1]--(Y2)|
`;
    const rungs = parseLadder(ladder);
    let state = createPLCState();

    // Activate zone 1 (X0=true): Y0=true, Y2=false
    state = scanCycle(rungs, state, { X0: true, X1: false, X2: false, X3: false });
    if (state.outputs['Y0'] !== true) return false;
    if (state.outputs['Y2'] === true) return false;

    // Activate zone 2 (X2=true): Y1=true, Y2=true (both on)
    state = scanCycle(rungs, state, { X0: false, X1: false, X2: true, X3: false });
    if (state.outputs['Y1'] !== true) return false;
    if (state.outputs['Y2'] !== true) return false;

    // Deactivate zone 1 (X1=true): Y0=false, Y2=false
    state = scanCycle(rungs, state, { X0: false, X1: true, X2: false, X3: false });
    if (state.outputs['Y0'] !== false) return false;
    if (state.outputs['Y2'] !== false) return false;

    return true;
  },
};

// ============================================================================
// Lab 3: PID Temperature Control (m13-lab-03)
// ============================================================================

const lab03: Lab = {
  id: 'm13-lab-03',
  title: 'PID Temperature Control',
  steps: [
    {
      instruction:
        'Configure a PID controller for a thermal process. Setpoint: 70C. Initial temperature: 20C (ambient). Gains: Kp=2.0, Ki=0.1, Kd=0.5. Scan time: 1.0 second. Output range: 0-100% (heater power). Create the PID state and observe the initial error calculation.',
      expected_observation:
        'Initial error = setpoint - process value = 70 - 20 = 50C. The proportional term alone would output Kp * error = 2.0 * 50 = 100 (maximum heater power). The integral starts at 0 and will accumulate over time to eliminate steady-state error. The derivative starts at 0 (no previous error to compare).',
      learn_note:
        'PID is the workhorse of industrial process control. Over 95% of control loops in factories use PID or a variant. The proportional term provides immediate response proportional to error. The integral term eliminates steady-state offset. The derivative term dampens oscillation by responding to the rate of change. -- IEC 61131-3',
    },
    {
      instruction:
        'Run 100 scan cycles. Each cycle: (1) compute PID output from current temperature, (2) simulate the thermal plant: temp += (heaterPower * 0.5 - (temp - ambient) * 0.05) * dt. The first term is heat input proportional to heater power; the second is heat loss to ambient proportional to temperature difference.',
      expected_observation:
        'The temperature rises quickly at first (large error, full heater power), then slows as it approaches 70C. There may be slight overshoot as the integral term accumulated during the ramp-up. The PID output decreases as temperature approaches setpoint, eventually settling to a steady-state value that balances heat loss.',
      learn_note:
        'The plant model temp += (heater*0.5 - (temp-ambient)*0.05)*dt is a first-order thermal system. The 0.5 coefficient represents heater efficiency; the 0.05 represents thermal conductivity to ambient. Real thermal systems have similar dynamics but with additional time constants (thermal mass, insulation, sensor lag). -- IEC 61131-3',
    },
    {
      instruction:
        'Verify convergence: the final temperature should be within 5C of the 70C setpoint. Check that temperature never exceeds 90C (setpoint + 20C, no extreme overshoot). Confirm the PID output stays within the [0, 100] range at all times (anti-windup clamping).',
      expected_observation:
        'Final temperature is approximately 68-72C (within 5C of setpoint). Peak temperature stays below 90C. PID output is always between 0 and 100 -- the output clamping prevents the heater from being driven beyond its physical limits. The controller has successfully regulated the process.',
      learn_note:
        'Anti-windup is critical in real PID controllers. Without it, the integral term grows unbounded when the output is saturated (heater at max), causing massive overshoot when the error finally decreases. Output clamping is the simplest anti-windup strategy. More sophisticated methods conditionally freeze the integrator or use back-calculation. -- IEC 61131-3',
    },
  ],
  verify: () => {
    let pidState = createPIDState(2.0, 0.1, 0.5, 70, 1.0, 0, 100);
    let temp = 20;
    const ambient = 20;
    const dt = 1.0;
    let maxTemp = temp;
    let allOutputsValid = true;

    for (let i = 0; i < 100; i++) {
      const result = pidCompute(pidState, temp);
      const heaterPower = result.output;
      pidState = result.newState;

      if (heaterPower < 0 || heaterPower > 100) {
        allOutputsValid = false;
      }

      temp += (heaterPower * 0.5 - (temp - ambient) * 0.05) * dt;
      if (temp > maxTemp) maxTemp = temp;
    }

    if (Math.abs(temp - 70) > 5) return false;
    if (maxTemp > 90) return false;
    if (!allOutputsValid) return false;

    return true;
  },
};

// ============================================================================
// Lab 4: Modbus Communication (m13-lab-04)
// ============================================================================

const lab04: Lab = {
  id: 'm13-lab-04',
  title: 'Modbus Communication',
  steps: [
    {
      instruction:
        'Create a Modbus register bank representing a remote I/O device. Write a temperature setpoint of 700 (representing 70.0C, scaled by 10 for integer precision) to holding register 40001. Write a pressure setpoint of 150 (representing 15.0 bar, scaled by 10) to holding register 40002. This simulates a master PLC sending configuration to a slave device.',
      expected_observation:
        'The register bank now contains holding register 40001=700 and 40002=150. Modbus uses 16-bit integer registers, so real-world values are scaled by 10 or 100 to preserve decimal precision. Address 40001 is in the "4xxxx" holding register range (IEC convention). The writes are non-destructive -- each write returns a new register bank.',
      learn_note:
        'Modbus is the most widely used industrial communication protocol, dating from 1979 (Modicon). It uses a simple master/slave architecture with four data types: coils (1-bit R/W), discrete inputs (1-bit R), holding registers (16-bit R/W), and input registers (16-bit R). The "4xxxx" prefix for holding registers is a Modicon convention. -- IEC 61131-3',
    },
    {
      instruction:
        'Write a boolean alarm status to coil address 0 (alarm active = true). This represents a remote sensor detecting an over-temperature condition. Read back the coil value and both holding register values to verify round-trip data integrity.',
      expected_observation:
        'Coil 0 reads true (alarm active). Holding register 40001 reads 700 (temperature setpoint). Holding register 40002 reads 150 (pressure setpoint). All values survive the write-read cycle without corruption. Coil operations are independent of register operations -- they use separate address spaces.',
      learn_note:
        'Modbus function codes separate coil and register operations: FC01 reads coils, FC05 writes a single coil, FC03 reads holding registers, FC06 writes a single register. This separation allows a device to expose both binary status (coils) and analog measurements (registers) through the same communication link. -- IEC 61131-3',
    },
    {
      instruction:
        'Verify default values: read an unwritten holding register (address 40010) and an unwritten coil (address 5). Both should return their default values (0 for registers, false for coils). This confirms the register bank initializes cleanly and does not leak values between addresses.',
      expected_observation:
        'Holding register 40010 reads 0 (default for unwritten registers). Coil 5 reads false (default for unwritten coils). The sparse addressing works correctly -- only written addresses contain non-default values. This matches real Modbus device behavior where uninitialized registers read as zero.',
      learn_note:
        'Real Modbus devices have a fixed register map defined by the manufacturer. Reading an undefined address typically returns 0 or generates an exception (error code 02: illegal data address). In our simulation, sparse storage with zero/false defaults mirrors this behavior. Always check the device manual for valid address ranges. -- IEC 61131-3',
    },
  ],
  verify: () => {
    let regs = createModbusRegisters();

    regs = writeHoldingRegister(regs, 40001, 700);
    regs = writeHoldingRegister(regs, 40002, 150);
    regs = writeCoil(regs, 0, true);

    if (readHoldingRegister(regs, 40001) !== 700) return false;
    if (readHoldingRegister(regs, 40002) !== 150) return false;
    if (readCoil(regs, 0) !== true) return false;
    if (readHoldingRegister(regs, 40010) !== 0) return false;
    if (readCoil(regs, 5) !== false) return false;

    return true;
  },
};

// ============================================================================
// Lab 5: Safety Interlock System (m13-lab-05)
// ============================================================================

const lab05: Lab = {
  id: 'm13-lab-05',
  title: 'Safety Interlock System',
  steps: [
    {
      instruction:
        'Build a safety interlock system with 4 rungs. Rung 1: E-stop (X0, NC) AND guard door (X1, NC) -> Safety OK marker (M0). Rung 2: M0 AND start button (X2) -> SET machine run (Y0). Rung 3: NOT M0 -> RESET Y0 (force stop if safety lost). Rung 4: Y0 -> run indicator lamp (Y1). NC contacts mean X0=false is "closed" (safe) and X0=true is "open" (emergency).',
      expected_observation:
        'Four rungs are parsed. Rung 1 uses two NC contacts (/X0 and /X1) feeding an OUT coil M0. Rung 2 uses NO contacts M0 and X2 feeding a SET coil Y0. Rung 3 uses an NC contact /M0 feeding a RESET coil Y0. Rung 4 uses NO contact Y0 feeding OUT coil Y1. The NC contacts implement fail-safe wiring.',
      learn_note:
        'Safety circuits ALWAYS use normally-closed (NC) contacts for protective devices. E-stop buttons, guard door switches, and safety relays are all wired NC. If a wire breaks, the contact opens (same as pressing E-stop), which stops the machine. This "de-energize to trip" principle is the foundation of all industrial safety systems. -- IEC 61508/62061',
    },
    {
      instruction:
        'Normal startup sequence: E-stop released (X0=false, NC closed), guard door closed (X1=false, NC closed). Run a scan to establish M0=true (safety OK). Then press start (X2=true). Run another scan to verify the machine starts and the run indicator lights.',
      expected_observation:
        'First scan: M0=true (both safety contacts closed). Y0=false (start not pressed yet). Second scan with X2=true: M0=true, Y0=true (SET coil latches machine on), Y1=true (run indicator). The machine is now running with all safety conditions satisfied.',
      learn_note:
        'The two-step startup (safety check, then start) prevents the machine from auto-starting when safety conditions are restored. A worker must deliberately press the start button after verifying it is safe. This is a Category B requirement in ISO 13849-1. -- IEC 62061',
    },
    {
      instruction:
        'Simulate an emergency: press E-stop (X0=true) while the machine is running. The NC contact /X0 opens, M0 goes false, and Rung 3 forces Y0 to RESET (machine stop). Then attempt to restart while E-stop is still pressed (X0=true, X2=true) and verify the machine cannot start.',
      expected_observation:
        'E-stop scan: M0=false (safety lost), Y0=false (RESET by Rung 3), Y1=false (indicator off). Restart attempt: M0=false (E-stop still pressed), SET condition on Rung 2 fails (M0 is false), RESET on Rung 3 fires. Machine stays off. Safety has absolute priority.',
      learn_note:
        'Category 0 stop (IEC 60204-1): immediate removal of power to actuators. The RESET rung ensures that if safety is lost for even one scan cycle, the machine stops and cannot restart until all safety conditions are restored AND the start button is pressed again. -- IEC 61508',
    },
    {
      instruction:
        'Test the guard door interlock independently: reset E-stop (X0=false), but open the guard door (X1=true). Verify the machine cannot start because M0 is false. Then close the guard door (X1=false) and verify normal startup works again.',
      expected_observation:
        'Guard door open: M0=false (safety not OK), machine cannot start. Guard door closed + E-stop released: M0=true (safety OK), start button -> machine runs. Each safety device independently prevents machine operation.',
      learn_note:
        'Guard interlocks prevent access to hazardous areas while the machine is running. IEC 60947-5-1 specifies safety-rated limit switches for guard doors. A standard PLC cannot be used for SIL 2+ safety functions -- dedicated safety PLCs with redundant processing are required. -- IEC 62061',
    },
  ],
  verify: () => {
    const ladder = `
|--[/X0]--[/X1]--(M0)|
|--[M0]--[X2]--(S Y0)|
|--[/M0]--(R Y0)|
|--[Y0]--(Y1)|
`;
    const rungs = parseLadder(ladder);
    let state = createPLCState();

    // Normal: E-stop closed (X0=false), guard closed (X1=false)
    state = scanCycle(rungs, state, { X0: false, X1: false, X2: false });
    if (state.memory['M0'] !== true) return false;

    // Press start (X2=true): machine runs
    state = scanCycle(rungs, state, { X0: false, X1: false, X2: true });
    if (state.outputs['Y0'] !== true) return false;
    if (state.outputs['Y1'] !== true) return false;

    // E-stop pressed (X0=true): machine stops immediately
    state = scanCycle(rungs, state, { X0: true, X1: false, X2: false });
    if (state.memory['M0'] !== false) return false;
    if (state.outputs['Y0'] !== false) return false;

    // Cannot restart while E-stop pressed
    state = scanCycle(rungs, state, { X0: true, X1: false, X2: true });
    if (state.outputs['Y0'] !== false) return false;

    return true;
  },
};

// ============================================================================
// Export all labs
// ============================================================================

export const labs: Lab[] = [lab01, lab02, lab03, lab04, lab05];
