# Module 13: Programmable Logic Controllers

> **Tier**: 4 | **H&H Reference**: IEC 61131-3 | **Safety Mode**: Redirect

## Overview

[To be implemented in Phase 275]

## Topics

[Topic list placeholder]

## Learn Mode Depth Markers

### Level 1: Practical

> A PLC (Programmable Logic Controller) is an industrial computer designed for harsh environments. It scans inputs, runs a program, and updates outputs in a repeating cycle. -- IEC 61131-3

> Ladder logic looks like electrical relay diagrams. Contacts on the left represent conditions; coils on the right represent actions. Read left-to-right, top-to-bottom. -- IEC 61131-3

### Level 2: Reference

> See IEC 61131-3 for the five standard PLC programming languages: Ladder Diagram (LD), Function Block Diagram (FBD), Structured Text (ST), Instruction List (IL), and Sequential Function Chart (SFC). -- IEC 61131-3

### Level 3: Mathematical

> PID control: u(t) = Kp*e(t) + Ki*integral(e(t)dt) + Kd*de(t)/dt. Discrete PID: u[n] = Kp*e[n] + Ki*T*sum(e[k]) + Kd*(e[n]-e[n-1])/T. Scan time: T_scan = T_input + T_execute + T_output. -- IEC 61131-3
