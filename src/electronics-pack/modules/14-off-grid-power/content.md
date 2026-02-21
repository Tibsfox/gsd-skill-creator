# Module 14: Off-Grid Power Systems

> **Tier**: 4 | **H&H Reference**: 9.8 | **Safety Mode**: Redirect

## Overview

Off-grid power systems convert sunlight into electricity, store it in batteries, and deliver it to loads without any connection to the utility grid. The core challenge is matching a variable energy source (the sun) to variable loads through efficient power conversion and reliable energy storage. Every component in the chain -- solar panel, charge controller, battery bank, and inverter -- must be sized correctly. Oversize wastes money; undersize means dark nights and dead batteries. This module covers the physics of photovoltaic cells, the algorithms that extract maximum power, the electrochemistry of storage, and the safety codes that keep high-voltage DC systems from becoming hazards. -- H&H 9.8

## Topics

### 1. Solar Photovoltaic Cells

A solar cell is a large-area p-n junction diode optimized for photon absorption. When photons with energy above the silicon bandgap (1.1 eV) strike the cell, they create electron-hole pairs in the depletion region. The built-in electric field sweeps electrons to the n-side and holes to the p-side, producing a photocurrent proportional to incident light intensity. The single-diode model captures this behavior: I = I_ph - I_s * (exp(V / (n * V_T)) - 1), where I_ph is the photocurrent, I_s is the reverse saturation current, n is the ideality factor (typically 1.3 for silicon), and V_T = kT/q is the thermal voltage. Under standard test conditions (1000 W/m2, 25C), a typical crystalline silicon cell produces about 0.6V open-circuit and 8-9A short-circuit in a 156mm square format. -- H&H 9.8

### 2. Solar Panel I-V Characteristics

The I-V curve of a solar panel reveals its electrical personality. At V=0 (short circuit), current equals I_sc -- the maximum current the panel can deliver. At I=0 (open circuit), voltage equals V_oc -- the maximum voltage. Between these extremes lies the maximum power point (MPP), where the product V * I is greatest. The fill factor FF = P_mpp / (V_oc * I_sc) measures how "square" the I-V curve is -- higher fill factor means more usable power. Typical silicon panels achieve FF = 0.70-0.80. A 36-cell panel in series produces V_oc around 22V and I_sc around 9A, with MPP near 17V and 8.5A, yielding about 145W peak. The I-V curve is not a straight line; the knee near MPP is where operating point matters most. -- H&H 9.8

### 3. Effects of Irradiance and Temperature

Solar panel output depends strongly on two environmental factors. Irradiance (W/m2) scales I_sc nearly linearly -- half the sunlight means half the current. V_oc changes only logarithmically with irradiance, so it stays relatively constant. Temperature has the opposite pattern: V_oc decreases significantly at roughly -2mV per cell per degree C above 25C (a 36-cell panel loses about 0.072V per degree), while I_sc increases slightly because reduced bandgap allows more photon absorption. On a hot roof at 60C, a panel can lose 10-15% of its rated power compared to STC. Partial shading is devastating -- a single shaded cell becomes a load, and without bypass diodes, one shaded cell can cut an entire string's output to near zero. -- H&H 9.8

### 4. Maximum Power Point Tracking (MPPT)

The maximum power point shifts with irradiance and temperature, so a fixed operating voltage wastes energy. MPPT algorithms continuously adjust the panel's operating point to track MPP. The perturb-and-observe (P&O) method is simplest: periodically change the operating voltage by a small step, measure power, and continue in the same direction if power increased or reverse if it decreased. P&O oscillates around MPP but converges quickly. Incremental conductance (IC) uses the condition dI/dV = -I/V at MPP: if dI/dV + I/V > 0, voltage is below MPP; if < 0, above. IC can theoretically stop exactly at MPP without oscillation. Both methods improve energy harvest by 15-30% compared to a fixed-voltage system, especially under varying cloud cover. -- H&H 9.8

### 5. Battery Technologies for Off-Grid

Off-grid systems need reliable energy storage. Lead-acid batteries come in three variants: flooded (cheapest, requires watering), AGM (absorbed glass mat, sealed, maintenance-free), and gel (best deep-cycle life, most expensive). Lead-acid tolerates only 50% depth of discharge (DOD) for reasonable cycle life -- deeper cycling dramatically shortens lifespan (500 cycles at 50% DOD vs. 200 cycles at 80% DOD). Lithium iron phosphate (LiFePO4) has transformed off-grid storage: 80% usable DOD, 2000+ cycle life, flat discharge curve, and no maintenance. LiFePO4 costs more per Ah but less per usable kWh over its lifetime. The flat voltage curve (3.2V nominal per cell, 3.0-3.4V working range) simplifies charge control but requires cell-level battery management systems (BMS) for safety. -- H&H 9.8

### 6. Battery Bank Sizing

Sizing a battery bank starts with the daily energy budget. If a cabin uses 2 kWh per day and requires 2 days of autonomy (no sun), the battery must store 4 kWh. For 12V lead-acid at 50% DOD: capacity = 4000 Wh / 12V / 0.5 = 667 Ah. Temperature derating applies below 25C -- at 0C, lead-acid delivers only about 80% of rated capacity. Series connections increase voltage (two 12V batteries in series = 24V), while parallel connections increase capacity (two 100Ah batteries in parallel = 200Ah). Higher system voltages (24V or 48V) reduce current and allow thinner wires for the same power. A 48V system carrying 1 kW draws only 21A versus 83A at 12V. -- H&H 9.8

### 7. Charge Controllers

The charge controller sits between the solar panel and battery, managing energy flow. PWM (Pulse Width Modulation) controllers are simple and cheap -- they connect the panel directly to the battery and pulse the connection to prevent overcharging. PWM efficiency equals V_battery / V_panel, typically 60-75%, because the panel is forced to operate at battery voltage, well below MPP. MPPT controllers use a DC-DC converter to operate the panel at MPP and step the voltage down to battery level, achieving 90-95% efficiency. Multi-stage charging protects battery health: bulk mode (constant current until ~80% SOC), absorption mode (constant voltage, tapering current), and float mode (reduced voltage to maintain full charge without overcharging). Low-voltage disconnect prevents deep discharge damage. -- H&H 9.8

### 8. Inverters

Inverters convert battery DC to AC for standard household loads. Modified sine wave inverters approximate AC with a stepped square wave -- cheap but can cause humming in motors, overheating in some power supplies, and interference in audio equipment. Pure sine wave inverters produce clean AC identical to grid power and are required for sensitive electronics. Key specifications include continuous power rating, surge capacity (typically 2x rated for motor starting), and efficiency. Inverter efficiency follows a curve: very low at light loads (fixed losses dominate), peaking around 75-100% rated load (typically 90-95%), and dropping slightly at full load due to increased resistive losses. Grid-tie inverters synchronize with utility power and can feed excess solar energy back to the grid; off-grid inverters operate independently. -- H&H 9.8

### 9. System Design and Wiring

NEC Article 690 governs solar photovoltaic systems in the United States. Wire sizing must account for continuous current (125% of maximum circuit current for conductors), voltage drop (recommended < 2% for the total run), and temperature derating of conductor ampacity. Overcurrent protection (fuses or breakers) is required on every ungrounded conductor. String fuses protect individual panel strings in parallel arrays. Ground-fault protection is mandatory for systems over 50V. Equipment grounding bonds all exposed metal to a common ground bus. Combiner boxes aggregate multiple panel strings with individual string fuses. Conduit fill, bend radius, and wire type (USE-2 for exposed rooftop, THWN-2 in conduit) all have specific code requirements. -- H&H 9.8

### 10. Safety and NEC Compliance

High-voltage DC is more dangerous than AC at the same voltage because DC arcs do not self-extinguish at zero crossings. NEC 690.12 requires rapid shutdown: conductors within 1 foot of the array boundary must drop to 80V or less within 30 seconds of system shutdown initiation. Arc-fault circuit interrupters (AFCI) detect series arcs in DC wiring and shut down the affected string. Ground-fault detection and interruption (GFDI) protects against insulation failures. All PV disconnect switches must be clearly labeled with maximum voltage and current. Working on energized PV arrays requires lockout/tagout procedures -- solar panels cannot be "turned off" while the sun is shining. Covering panels with opaque material is the only way to eliminate voltage. All junction boxes, combiners, and disconnects must carry appropriate warning labels. -- H&H 9.8

## Learn Mode Depth Markers

### Level 1: Practical

> Solar cells produce current proportional to light intensity. They have a "sweet spot" voltage (MPP) where power output is maximized -- an MPPT controller finds and tracks this point. -- H&H 9.8

> Battery charging requires careful voltage and current control. Overcharging damages batteries; deep discharging shortens their life. A charge controller manages both limits. -- H&H Ch.9

### Level 2: Reference

> See H&H 9.8 for solar cell I-V characteristics, maximum power point tracking algorithms (perturb-and-observe, incremental conductance), and energy harvesting circuit topologies. -- H&H 9.8

### Level 3: Mathematical

> Solar cell: I = I_ph - I_s*(exp(V/(n*V_T))-1). Maximum power: P_mpp = V_mpp * I_mpp. Fill factor: FF = P_mpp/(V_oc*I_sc). MPPT efficiency: eta_mppt = P_actual/P_mpp. Battery capacity: C = I*t (Ah). -- H&H 9.8
