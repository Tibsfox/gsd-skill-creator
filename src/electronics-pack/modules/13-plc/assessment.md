# Module 13: Programmable Logic Controllers -- Assessment

> 5 questions testing understanding, not memorization

## Question 1: PLC Scan Cycle

Describe the three main phases of a PLC scan cycle. Why does deterministic execution matter for industrial control, and what would happen if scan times were unpredictable?

## Question 2: Ladder Logic Motor Circuit

Draw (in text) the ladder diagram for a motor start/stop circuit with a seal-in contact. Include the start button (NO), stop button (NC), motor coil, and holding contact. Explain why the stop button must be normally closed (NC) in real installations -- what safety principle does this enforce?

## Question 3: PID Tuning

A PID-controlled temperature system oscillates continuously around the setpoint without settling. Which gain(s) would you adjust and in which direction to reduce the oscillation? What does the integral term prevent that the proportional term alone cannot?

## Question 4: Modbus Communication

Explain the difference between Modbus coils and holding registers. When would you use each? Why does Modbus use a master/slave (client/server) architecture rather than peer-to-peer communication?

## Question 5: Safety and SIL

Explain SIL (Safety Integrity Level) and why a standard PLC cannot be used for SIL 3 safety functions. What specific hardware and software features make a safety PLC different from a standard PLC?

## Answer Key

### Answer 1: PLC Scan Cycle

The three main phases are: (1) **Input scan** -- read all physical inputs into the input image table, creating a snapshot of the real world. (2) **Program execution** -- evaluate the entire program (ladder logic, ST, FBD) top-to-bottom using the input image. (3) **Output update** -- write the output image table to the physical outputs simultaneously. (There is also a fourth housekeeping phase for diagnostics and communication.)

Deterministic execution matters because industrial processes require predictable response times. If a conveyor belt photo-eye detects a product, the diverter must fire within a guaranteed time window. Unpredictable scan times would cause products to be diverted late (or not at all), potentially causing jams, collisions, or safety hazards. Determinism means every input combination always produces the same output within the same timeframe -- this is why PLCs are trusted in safety-critical applications where microcontrollers or general-purpose computers are not. -- IEC 61131-3

### Answer 2: Ladder Logic Motor Circuit

```
|--[X0]---+---[/X1]--(Y0)|     X0 = Start (NO)
|         |               |     X1 = Stop (NC)
|--[Y0]---+               |     Y0 = Motor coil
```

Branch 1: X0 (start, NO) in series with /X1 (stop, NC) driving Y0 (motor). Branch 2: Y0 (seal-in contact, NO) in parallel with X0, also through /X1. When start is pressed, Y0 energizes. Y0's contact seals in the circuit so the motor stays running after the start button is released. Pressing stop (X1=true) opens the NC contact, breaking both paths.

The stop button MUST be NC because of the **wire-break safety principle**: if a wire to the stop button breaks (open circuit), the NC contact opens, which is the same as pressing stop -- the motor shuts down. If the stop button were NO, a broken wire would mean the stop button could never work, creating a dangerous condition where the motor cannot be stopped. This fail-safe wiring is mandated by electrical codes (NFPA 79, IEC 60204-1). -- IEC 61131-3

### Answer 3: PID Tuning

Continuous oscillation indicates the **proportional gain (Kp) is too high** -- the controller is overreacting to error, creating overshoot that becomes undershoot that becomes overshoot. To fix: (1) **Reduce Kp** to decrease the aggressive response. (2) **Increase Kd** (derivative gain) to add damping -- the D term responds to the rate of change and acts as a brake when the temperature approaches setpoint quickly, reducing overshoot.

The **integral term prevents steady-state error** (also called "droop" or "offset"). With proportional control alone, the system settles at a temperature slightly below setpoint because as the error decreases, so does the corrective output -- eventually the output is too small to overcome heat loss. The integral term accumulates this small persistent error over time and gradually increases the output until the error reaches zero. Without I, a proportional-only controller maintaining 70C might settle at 68C forever. -- IEC 61131-3

### Answer 4: Modbus Communication

**Coils** are single-bit (boolean) read/write values representing discrete states: on/off, open/closed, alarm/normal. Address range 00001-09999. Function codes: FC01 (read), FC05 (write single). **Holding registers** are 16-bit integer read/write values representing analog quantities: temperature, pressure, setpoints, counts. Address range 40001-49999. Function codes: FC03 (read), FC06 (write single).

Use coils for binary status (valve open, motor running, alarm active). Use holding registers for numeric values (temperature setpoint = 700 meaning 70.0C, motor speed = 1500 RPM). Real-world values are scaled to integers since Modbus has no native float type.

Modbus uses master/slave because industrial networks need **deterministic polling**. The master (PLC) controls when communication happens, ensuring it can poll all devices within a known time window. Peer-to-peer would create unpredictable bus contention -- two devices trying to transmit simultaneously would corrupt both messages. Master/slave guarantees orderly communication and makes troubleshooting straightforward (the master always initiates). -- IEC 61131-3

### Answer 5: Safety and SIL

**SIL (Safety Integrity Level)** defines the required reliability of a safety function, rated 1-4. SIL 1 allows probability of failure on demand (PFD) < 0.1 (90% reliable). SIL 3 requires PFD < 0.001 (99.9% reliable). Higher SIL means more rigorous design, testing, and verification.

A **standard PLC cannot achieve SIL 3** because it has a single CPU, no redundant processing, limited self-diagnostics, and no guaranteed safe failure mode. A single hardware fault (stuck bit, memory corruption) could cause a dangerous output without detection.

A **safety PLC** differs in specific ways: (1) **Dual-channel redundant CPUs** that independently execute the safety program and cross-check results -- if they disagree, the system goes to a safe state. (2) **Watchdog timers** that trigger a safe shutdown if the CPU hangs. (3) **Continuous self-diagnostics** (RAM tests, ROM CRC checks, I/O wire-break detection) running every scan cycle. (4) **Safe failure fraction > 99%** -- when the PLC fails, it fails to the safe state (outputs de-energized). (5) **Certified development process** -- the firmware is developed under IEC 61508 with formal verification, code review, and extensive testing. The cost is typically 3-5x a standard PLC, but the alternative is unacceptable risk. -- IEC 61508/62061
