# Module 1: The Circuit

> **Tier**: 1 | **H&H Reference**: 1.2 | **Safety Mode**: Annotate

## Overview

A circuit is a closed loop through which electric current flows. Electrons move from a source of electrical energy (like a battery), through components that use or control that energy (like resistors), and back to the source. Without a complete loop, no current flows -- an open switch stops everything. This module covers the foundational concepts you need to analyze any circuit: voltage, current, resistance, Ohm's law, power dissipation, Kirchhoff's laws, voltage dividers, and series/parallel combinations. Every circuit you will ever build rests on these principles. -- H&H 1.2

## Topics

### Topic 1: Voltage

Voltage is electrical pressure -- the force that pushes charges through a circuit. Measured in volts (V), it represents the energy difference between two points. A 9V battery maintains a 9-volt difference between its terminals. Connect a wire from one terminal through a resistor to the other terminal, and that voltage difference drives current through the resistor. Voltage is always measured *between* two points; a single point has no voltage on its own. Think of it like water pressure: higher pressure pushes more water through a pipe, and higher voltage pushes more current through a conductor. Without a voltage difference, charges have no reason to move. -- H&H 1.2

### Topic 2: Current

Current is the flow rate of electric charge, measured in amperes (A). One ampere means one coulomb of charge (about 6.24 x 10^18 electrons) passes a point each second. In conventional current notation, current flows from positive to negative -- opposite to actual electron flow, but this convention is universal in circuit analysis. Current is the same at every point in a series circuit: what flows into a component must flow out. A typical LED draws 20mA, a phone charger delivers about 2A, and a household circuit breaker trips at 15-20A. The key insight is that current does not get "used up" -- it circulates continuously around the loop. -- H&H 1.2

### Topic 3: Resistance

Resistance is opposition to current flow, measured in ohms (the symbol is the Greek letter omega). Every material resists current to some degree -- metals have low resistance (conductors), rubber and glass have extremely high resistance (insulators), and components called resistors are manufactured to have precise, controlled resistance values. A 1k ohm (1000 ohm) resistor is one of the most common values in electronics. Resistance depends on the material, its length, its cross-sectional area, and temperature. Higher resistance means less current for a given voltage. Conductance (G = 1/R), measured in siemens, is the inverse -- it measures how easily current flows. -- H&H 1.2

### Topic 4: Ohm's Law

Ohm's law is the fundamental relationship connecting voltage, current, and resistance: **V = I * R**. If you know any two, you can find the third. Apply 9V across a 1k ohm resistor: I = V/R = 9/1000 = 9mA. Need to limit current to 20mA from a 5V supply? R = V/I = 5/0.02 = 250 ohm. Ohm's law works for any component that has a linear (proportional) relationship between voltage and current. Such components are called "ohmic." Resistors are ohmic by design; diodes and transistors are not. This single equation is the tool you will reach for most often in circuit design. -- H&H 1.2

### Topic 5: Power

Power is the rate of energy conversion, measured in watts (W). In a circuit, power tells you how much electrical energy a component converts to heat (or light, or motion) each second. Three equivalent formulas: **P = I * V**, **P = I^2 * R**, and **P = V^2 / R**. A 100-ohm resistor with 5V across it dissipates P = 25/100 = 0.25W. Every resistor has a power rating (common values: 1/8W, 1/4W, 1/2W, 1W). Exceeding the rating causes overheating, smoke, and failure. In battery-powered designs, power consumption directly determines battery life: a 500mAh battery lasts 10 hours at 50mA draw. Understanding power is essential for thermal management, component selection, and energy budgeting. -- H&H 1.2

### Topic 6: Kirchhoff's Voltage Law (KVL)

The sum of all voltages around any closed loop in a circuit equals zero. Equivalently, the voltage rises (from sources) equal the voltage drops (across loads). In a series circuit with a 12V battery and two resistors dropping 7V and 5V, KVL says: +12 - 7 - 5 = 0. This is conservation of energy applied to circuits -- a charge that travels around a loop returns to its starting potential. KVL works for any loop, no matter how complex the circuit. It gives you one equation per loop, and combined with KCL (see next topic), provides enough equations to solve any resistive circuit. When you measure voltages and they don't add up, either your measurement is wrong or a component is broken. -- H&H 1.2

### Topic 7: Kirchhoff's Current Law (KCL)

The sum of all currents entering any node (junction) in a circuit equals zero. What flows in must flow out -- charge cannot accumulate at a point in a DC circuit. If three wires meet at a node and two carry 3mA and 5mA into the node, the third must carry 8mA out. This is conservation of charge. KCL is especially useful for analyzing parallel circuits and branching networks. At every junction, write the equation: sum of currents in = sum of currents out. Combined with KVL and Ohm's law, KCL lets you solve any circuit with any number of nodes and loops. In practice, KCL is how you verify that your circuit analysis is self-consistent. -- H&H 1.2

### Topic 8: Voltage Dividers

A voltage divider is two resistors in series, with the output taken from the junction between them. The output voltage is **V_out = V_in * R2 / (R1 + R2)**, where R2 is the bottom resistor (connected to ground). With V_in=10V, R1=2k, R2=1k: V_out = 10 * 1000/3000 = 3.33V. This is the most common subcircuit in electronics -- it appears in biasing networks, sensor interfaces, feedback paths, and ADC input conditioning. The key limitation: this formula assumes no load at the output. Connecting a low-impedance load changes the effective R2, pulling the output voltage down. For a voltage divider to work accurately, the load resistance should be at least 10x larger than R2. -- H&H 1.2

### Topic 9: Series Circuits

Components in series share the same current. The total resistance is the sum of individual resistances: **R_total = R1 + R2 + R3 + ...**. In a series string of three resistors (1k, 2k, 3k) connected to a 12V supply, R_total = 6k, I = 12/6000 = 2mA, and the voltage drops are 2V, 4V, and 6V respectively (V = IR for each). Series circuits are simple to analyze because one current value determines everything. The downside: if any component fails open (breaks), the entire circuit stops -- like old-fashioned Christmas lights. Series resistance always increases the total; you can never have a series combination with less resistance than any individual resistor. -- H&H 1.2

### Topic 10: Parallel Circuits

Components in parallel share the same voltage across them. The total resistance is calculated by the reciprocal formula: **1/R_total = 1/R1 + 1/R2 + 1/R3 + ...**. For two resistors, the shorthand is R_total = R1*R2/(R1+R2). Two 2k resistors in parallel give 1k -- always less than either individual value. The total current divides among branches inversely proportional to their resistance: lower resistance branches carry more current. Parallel circuits are robust: if one branch fails open, the others continue operating. Most household wiring is parallel -- each outlet gets the full 120V regardless of what other outlets are doing. Understanding parallel combinations is essential for analyzing any real circuit beyond the simplest series loop. -- H&H 1.2

## Learn Mode Depth Markers

### Level 1: Practical

> Voltage is electrical pressure -- higher voltage pushes more current through a resistance. Double the voltage, double the current. -- H&H 1.2

> A voltage divider splits voltage proportionally by resistance ratio. The output is always less than the input. -- H&H 1.2

### Level 2: Reference

> See H&H 1.2 for the relationship between voltage, current, and resistance in linear circuits, including Kirchhoff's voltage and current laws (KVL/KCL) and the concept of conductance G. -- H&H 1.2

### Level 3: Mathematical

> Ohm's Law: V = IR. Power dissipation: P = IV = I^2R = V^2/R. Voltage divider: V_out = V_in * R2/(R1+R2). For series resistors: R_total = R1 + R2. For parallel: 1/R_total = 1/R1 + 1/R2. -- H&H 1.2
