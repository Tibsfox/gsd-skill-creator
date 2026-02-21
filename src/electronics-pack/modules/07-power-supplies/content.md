# Module 7: Power Supplies

> **Tier**: 2 | **H&H Reference**: Ch.9 | **Safety Mode**: Gate

## Overview

[To be implemented in Phase 270]

## Topics

[Topic list placeholder]

## Learn Mode Depth Markers

### Level 1: Practical

> A linear regulator wastes excess voltage as heat. Simple and low-noise, but inefficient when the input-output voltage difference is large. -- H&H Ch.9

> A switching regulator chops the input voltage rapidly and filters it to get the desired output. Much more efficient than linear, but introduces switching noise. -- H&H Ch.9

### Level 2: Reference

> See H&H Ch.9 for linear regulator design (pass transistor, error amplifier, dropout), switching converter topologies (buck, boost, buck-boost), and thermal management. -- H&H Ch.9

### Level 3: Mathematical

> Linear regulator: P_dissipated = (V_in - V_out) * I_load. Buck converter: V_out = D * V_in, where D = duty cycle. Boost: V_out = V_in/(1-D). Efficiency: eta = P_out/P_in. Inductor ripple: delta_I = (V_in - V_out)*D/(L*f_sw). -- H&H Ch.9
