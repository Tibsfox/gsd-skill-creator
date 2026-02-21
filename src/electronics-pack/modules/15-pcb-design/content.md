# Module 15: PCB Design

> **Tier**: 4 | **H&H Reference**: Ch.12 | **Safety Mode**: Gate

## Overview

PCB (Printed Circuit Board) design is where a circuit schematic becomes a physical product. Every electronic device -- from a phone to a satellite -- contains at least one PCB. The design process involves schematic capture, component placement, trace routing, design rule checking, signal integrity analysis, and manufacturing preparation. Good PCB layout is what separates a working prototype from a reliable product. Poor layout causes noise, crosstalk, EMI failures, and thermal problems that no amount of schematic correctness can fix. H&H Ch.12 is the definitive reference for layout practices. This module covers the complete PCB design flow.

## Topics

### Topic 1: Schematic Capture (H&H Ch.12)

The schematic is the electrical blueprint of your circuit: components with values, connections (nets), and reference designators (R1, C1, U1). Every net must have a clear name -- VCC, GND, CLK, DATA. Power nets are global, appearing on every sheet without explicit wires. Hierarchical schematics break complex designs into readable sheets, each representing a functional block (power supply, microcontroller, sensor interface). The netlist -- a machine-readable list of every connection -- is the bridge between schematic and PCB layout. The layout tool reads the netlist and enforces connectivity. Before generating the netlist, run ERC (Electrical Rule Check): it catches unconnected pins, shorted power nets, missing decoupling capacitors, and pins connected to incompatible types. A clean ERC is the first gate before layout begins. (H&H Ch.12)

### Topic 2: Component Placement (H&H Ch.12)

Placement is 80% of routing -- experienced designers spend most of their time on placement. Group related components: place decoupling capacitors within 5mm of IC power pins. Separate analog from digital sections with a clear boundary. Place connectors at board edges, oriented for cable routing. Orient all ICs consistently (pin 1 in the same corner) for visual inspection and automated assembly. Thermal considerations drive placement of power components: regulators, MOSFETs, and power resistors need copper pour or thermal vias to dissipate heat into inner layers. The mechanical outline constrains everything -- mounting holes, keep-out zones for connectors, and height restrictions from the enclosure define where components can live. A 30-minute investment in placement saves hours of routing frustration. (H&H Ch.12)

### Topic 3: Trace Routing (H&H Ch.12)

Traces are the copper conductors connecting component pads. Route critical signals first (clocks, high-speed data), then power, then general signals. Avoid right angles (use 45-degree bends or arcs) -- right angles concentrate etchant during manufacturing and create impedance discontinuities at high frequencies. Keep traces as short as possible for high-speed signals because every millimeter adds delay and radiation risk. Use appropriate trace widths: narrow (6-8 mil) for logic signals, wide (20-50+ mil) for power rails carrying significant current. The IPC-2221 standard provides formulas for minimum trace width based on current, temperature rise, and copper thickness. For two-layer boards, route horizontal traces on one layer and vertical on the other -- this orthogonal routing minimizes crosstalk between layers. (H&H Ch.12)

### Topic 4: Design Rules and DRC (H&H Ch.12)

Design rules encode the manufacturing capabilities and constraints of your chosen PCB fabrication house. Minimum trace width (typically 6 mil for standard fab) prevents copper traces from breaking during etching. Minimum clearance between conductors (6 mil) prevents shorts. Minimum via drill size (10 mil) is limited by the drill bit. Minimum annular ring (4 mil around the drill hole) ensures reliable connection between the via and the copper. DRC (Design Rule Check) is the automated verification pass -- it checks every trace, via, pad, and spacing against these rules. A clean DRC is required before sending files to the fabricator. Common violations include acid traps (acute angles that trap etchant), insufficient clearance near vias, traces too close to the board edge, and copper pours that create isolated islands. (H&H Ch.12)

### Topic 5: Controlled Impedance (H&H Ch.12)

For signals above approximately 50 MHz, trace impedance becomes as important as connectivity. A microstrip (trace over ground plane) has characteristic impedance determined by three geometric factors: trace width, dielectric height (distance to ground plane), and PCB material dielectric constant. The formula Z0 = (87/sqrt(er+1.41)) * ln(5.98*h/(0.8*w+t)) gives approximate impedance for a microstrip. Standard targets are 50 ohms for single-ended signals and 90-100 ohms for differential pairs (USB, HDMI, Ethernet). Impedance mismatches at connectors, vias, and trace-width changes cause signal reflections that corrupt data integrity. The PCB fabrication house controls the stackup (layer thicknesses and materials) to achieve target impedance within a 10% tolerance. Always specify impedance requirements in the fabrication notes. (H&H Ch.12)

### Topic 6: Ground Planes and Power Distribution (H&H Ch.12)

A continuous ground plane is the single most important PCB layout technique. It provides a low-impedance return current path for every signal, reduces electromagnetic radiation by containing fields between the signal and its return, enables controlled impedance, and shields adjacent signal layers from crosstalk. In a 4-layer stackup: top = signals, inner1 = ground, inner2 = power, bottom = signals. Never split a ground plane under a high-speed signal trace -- the return current must follow the signal path, and a split forces it to detour, creating a large loop antenna. Decoupling capacitors filter power supply noise: 100nF ceramic at each IC power pin for high-frequency bypass, plus 10uF bulk capacitors for lower-frequency transients. Place decoupling caps as close to the IC as possible -- the trace inductance between cap and pin degrades high-frequency filtering. (H&H Ch.12)

### Topic 7: Signal Integrity (H&H Ch.12)

Signal integrity is the study of how electrical signals degrade as they travel through a PCB. Crosstalk is electromagnetic coupling between adjacent traces -- a fast edge on one trace induces a voltage glitch on its neighbor. The 3x rule reduces crosstalk: space traces at least 3 times the dielectric height above the ground plane (d >= 3*h). Reflections occur at impedance mismatches -- where a trace changes width, passes through a via, or reaches a connector. Unterminated lines ring on fast edges, corrupting the signal. Series or parallel termination resistors matched to the trace impedance absorb reflections. Ringing is the underdamped LC oscillation visible at signal transitions -- it causes false triggering and timing violations. Skin effect forces high-frequency current to flow only in the surface layer of the conductor, increasing AC resistance. At 1 GHz, the skin depth in copper is only about 2 micrometers. (H&H Ch.12)

### Topic 8: EMI and EMC (H&H Ch.12)

EMI (Electromagnetic Interference) is unwanted radiation from a circuit. EMC (Electromagnetic Compatibility) means the device neither emits harmful interference nor is affected by external electromagnetic fields. Both are regulatory requirements -- products must pass FCC/CE emissions testing before sale. A PCB trace becomes a significant radiator when its length approaches lambda/10 (one-tenth of the wavelength). At 300 MHz, lambda = 1 meter, so any trace over 100mm radiates. At 1 GHz, the critical length drops to 30mm. Countermeasures: ground planes reduce radiation by providing nearby return current paths. Shielding (metal enclosures) contains emissions. Filtering at I/O connectors (ferrite beads, pi filters) blocks conducted emissions. Minimize loop areas by routing signal and return traces adjacent to each other. Spread-spectrum clocking reduces peak spectral emissions by smearing the clock energy across a band. (H&H Ch.12)

### Topic 9: Gerber Files and Manufacturing (H&H Ch.12)

Gerber files (RS-274X format) are the industry-standard output from PCB design tools. Each Gerber file describes one manufacturing layer as vector graphics: traces, pads, copper pours, and text. A complete fabrication package includes one file per copper layer (top, bottom, and any inner layers), soldermask files (top and bottom -- the green protective coating), silkscreen files (top and bottom -- white text and component outlines), solder paste files (for SMD assembly), and a drill file (Excellon format, specifying hole locations and sizes). The fabricator builds the board step by step: print circuit pattern onto copper-clad laminate, etch away unwanted copper, drill holes, electroplate vias, apply soldermask, print silkscreen. Board specifications include layer count (2, 4, 6+), material (FR4 is standard), copper weight (1 oz = 35 micrometers), surface finish (HASL for general use, ENIG for fine-pitch), and impedance control requirements. (H&H Ch.12)

### Topic 10: Soldering and Assembly (H&H Ch.12)

Through-hole components have wire leads that insert through plated holes and are soldered on the opposite side. Surface-mount (SMD) components solder directly to pads on the board surface -- smaller, cheaper to assemble, and dominant in modern electronics. Reflow soldering is the standard SMD process: apply solder paste through a stainless steel stencil, place components with a pick-and-place machine, then heat the entire board in a reflow oven following a precise temperature profile (preheat to 150C, soak at 180C, reflow peak at 245C for lead-free, cool gradually). Wave soldering handles through-hole components: the board rides over a wave of molten solder that fills all plated holes simultaneously. Hand soldering is used for prototypes and rework -- temperature-controlled iron at 350C for lead-free (SnAgCu) or 320C for leaded (SnPb). Lead-free solder requires higher temperatures and is less forgiving. IPC-610 is the acceptance standard for solder joint quality. (H&H Ch.12)

## Learn Mode Depth Markers

### Level 1: Practical

> Keep analog and digital grounds separate, joining them at a single point near the power supply. Ground loops cause noise and interference. -- H&H Ch.12

> Place bypass capacitors as close to IC power pins as possible. Short, wide traces to the cap reduce parasitic inductance and improve high-frequency decoupling. -- H&H Ch.12

### Level 2: Reference

> See H&H Ch.12 for PCB layout guidelines, controlled-impedance traces, ground plane design, EMI reduction techniques, thermal management, and component placement strategies. -- H&H Ch.12

### Level 3: Mathematical

> Trace impedance (microstrip): Z_0 = (87/sqrt(e_r+1.41)) * ln(5.98*h/(0.8*w+t)). Skin depth: delta = sqrt(rho/(pi*f*mu)). Crosstalk: k = 1/(1+(d/h)^2). Thermal resistance: theta_JA = (T_J - T_A)/P_D. -- H&H Ch.12
