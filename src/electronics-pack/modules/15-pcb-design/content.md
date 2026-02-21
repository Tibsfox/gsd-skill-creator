# Module 15: PCB Design

> **Tier**: 4 | **H&H Reference**: Ch.12 | **Safety Mode**: Gate

## Overview

[To be implemented in Phase 277]

## Topics

[Topic list placeholder]

## Learn Mode Depth Markers

### Level 1: Practical

> Keep analog and digital grounds separate, joining them at a single point near the power supply. Ground loops cause noise and interference. -- H&H Ch.12

> Place bypass capacitors as close to IC power pins as possible. Short, wide traces to the cap reduce parasitic inductance and improve high-frequency decoupling. -- H&H Ch.12

### Level 2: Reference

> See H&H Ch.12 for PCB layout guidelines, controlled-impedance traces, ground plane design, EMI reduction techniques, thermal management, and component placement strategies. -- H&H Ch.12

### Level 3: Mathematical

> Trace impedance (microstrip): Z_0 = (87/sqrt(e_r+1.41)) * ln(5.98*h/(0.8*w+t)). Skin depth: delta = sqrt(rho/(pi*f*mu)). Crosstalk: k = 1/(1+(d/h)^2). Thermal resistance: theta_JA = (T_J - T_A)/P_D. -- H&H Ch.12
