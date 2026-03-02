/**
 * Module 7: Power Supplies -- Lab exercises
 *
 * 5 labs backed by MNA simulation demonstrating power supply
 * fundamentals: linear regulators, switching converters, load
 * regulation, and battery charging.
 *
 * Labs use solveNonlinear (regulators are nonlinear -- output depends
 * on input voltage region) and dcAnalysis (simple linear circuits).
 */

import { solveNonlinear, dcAnalysis } from '../../simulator/mna-engine.js';
import type { Component, Resistor, VoltageSource, Regulator } from '../../simulator/components.js';

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
// Helper: check if two values are within a relative tolerance
// ============================================================================

function withinTolerance(actual: number, expected: number, toleranceFraction: number): boolean {
  if (expected === 0) return Math.abs(actual) < toleranceFraction;
  return Math.abs(actual - expected) / Math.abs(expected) < toleranceFraction;
}

// ============================================================================
// Lab 1: 7805 Linear Regulator (m7-lab-01)
// ============================================================================

const lab01: Lab = {
  id: 'm7-lab-01',
  title: '7805 Linear Regulator',
  steps: [
    {
      instruction:
        'Build a linear regulator circuit: 12V source (V1, nodes vin to 0), a 7805 regulator (REG1, topology=linear, outputVoltage=5.0V, dropoutVoltage=2.0V, nodes vin to vout), and a 100 ohm load resistor (R_load, nodes vout to 0).',
      expected_observation:
        'The regulator output settles at 5.0V. With V_in = 12V and dropout = 2V, the regulator is comfortably in regulation (12V > 5V + 2V = 7V minimum input).',
      learn_note:
        'The 78xx series are fixed linear regulators. The 7805 outputs 5V, the 7812 outputs 12V. They need V_in at least 2V above V_out (the dropout voltage) to regulate properly.',
    },
    {
      instruction:
        'Calculate the load current: I_load = V_out / R_load = 5V / 100 ohm = 50mA. Then calculate the power dissipated in the regulator: P_reg = (V_in - V_out) * I_load = (12 - 5) * 0.05 = 350mW.',
      expected_observation:
        'The regulator dissipates 350mW as heat. This is the price of linear regulation -- the voltage difference times the current is wasted energy.',
      learn_note:
        'Linear regulators are simple and produce very clean (low-noise) output, but they waste power as heat. Efficiency = V_out / V_in = 5/12 = 42%. The other 58% is heat.',
    },
    {
      instruction:
        'Consider thermal limits: at 350mW, a TO-220 package (thermal resistance ~5 C/W to heatsink) barely needs a heatsink. But at 1A load current, P = 7W -- that definitely needs cooling.',
      expected_observation:
        'Power dissipation scales linearly with load current. At 50mA the regulator is comfortable; at 1A it needs a substantial heatsink or the thermal shutdown will trigger.',
      learn_note:
        'Always check thermal limits when using linear regulators. T_junction = T_ambient + P * R_theta. If the junction exceeds 150C, the regulator shuts down to protect itself. -- H&H Ch.9',
    },
  ],
  verify: () => {
    const components: Component[] = [
      { id: 'V1', type: 'voltage-source', nodes: ['vin', '0'], voltage: 12 } as VoltageSource,
      {
        id: 'REG1', type: 'regulator', topology: 'linear',
        outputVoltage: 5.0, dropoutVoltage: 2.0, nodes: ['vin', 'vout'],
      } as Regulator,
      { id: 'R_load', type: 'resistor', nodes: ['vout', '0'], resistance: 100 } as Resistor,
    ];
    const result = solveNonlinear(components);
    if (!result.converged) return false;

    const vOut = result.nodeVoltages.find((nv) => nv.node === 'vout');
    if (!vOut) return false;

    return withinTolerance(vOut.voltage, 5.0, 0.01);
  },
};

// ============================================================================
// Lab 2: Buck Converter (m7-lab-02)
// ============================================================================

const lab02: Lab = {
  id: 'm7-lab-02',
  title: 'Buck Converter',
  steps: [
    {
      instruction:
        'Build a buck (step-down) converter circuit: 12V source (V1, nodes vin to 0), a buck regulator (REG1, topology=buck, outputVoltage=3.3V, nodes vin to vout), and a 100 ohm load resistor (R_load, nodes vout to 0).',
      expected_observation:
        'The output is a stable 3.3V from a 12V input. The buck converter steps the voltage down efficiently using a switch, inductor, and diode.',
      learn_note:
        'A buck converter chops the input voltage with a high-frequency switch (100kHz-2MHz). The inductor and output capacitor smooth the chopped waveform into a steady DC output. -- H&H Ch.9',
    },
    {
      instruction:
        'Calculate the duty cycle: D = V_out / V_in = 3.3 / 12 = 0.275. The switch is ON for 27.5% of each cycle. Compare efficiency to linear: a linear regulator would waste (12 - 3.3) * I = 8.7 * I as heat.',
      expected_observation:
        'Duty cycle D = 27.5%. A buck converter at this ratio achieves 85-95% efficiency, while a linear regulator would be only 3.3/12 = 27.5% efficient.',
      learn_note:
        'The duty cycle D controls the output voltage in a buck converter. The relationship V_out = D * V_in is fundamental. Lower duty cycle = lower output voltage. -- H&H Ch.9',
    },
    {
      instruction:
        'Consider when to use a buck vs. linear regulator: with only an 8.7V drop at 33mA, the linear wastes 290mW. At 1A, it wastes 8.7W. The buck wastes only about 0.5W at 1A (assuming 90% efficiency).',
      expected_observation:
        'At low currents (<100mA), either topology works. At higher currents, the buck converter wins decisively on efficiency and thermal management.',
      learn_note:
        'Rule of thumb: use linear when V_in - V_out < 2V and current is low. Use switching when the voltage drop is large or current exceeds a few hundred mA. -- H&H Ch.9',
    },
  ],
  verify: () => {
    const components: Component[] = [
      { id: 'V1', type: 'voltage-source', nodes: ['vin', '0'], voltage: 12 } as VoltageSource,
      {
        id: 'REG1', type: 'regulator', topology: 'buck',
        outputVoltage: 3.3, dropoutVoltage: 0, nodes: ['vin', 'vout'],
      } as Regulator,
      { id: 'R_load', type: 'resistor', nodes: ['vout', '0'], resistance: 100 } as Resistor,
    ];
    const result = solveNonlinear(components);
    if (!result.converged) return false;

    const vOut = result.nodeVoltages.find((nv) => nv.node === 'vout');
    if (!vOut) return false;

    return withinTolerance(vOut.voltage, 3.3, 0.01);
  },
};

// ============================================================================
// Lab 3: Boost Converter (m7-lab-03)
// ============================================================================

const lab03: Lab = {
  id: 'm7-lab-03',
  title: 'Boost Converter',
  steps: [
    {
      instruction:
        'Build a boost (step-up) converter circuit: 3.3V source (V1, nodes vin to 0), a boost regulator (REG1, topology=boost, outputVoltage=5.0V, nodes vin to vout), and a 100 ohm load resistor (R_load, nodes vout to 0).',
      expected_observation:
        'The output is a stable 5.0V from a 3.3V input. The boost converter steps the voltage UP -- getting more voltage out than goes in.',
      learn_note:
        'A boost converter stores energy in an inductor when the switch is ON, then releases it at a higher voltage when the switch turns OFF. The output voltage is always higher than the input. -- H&H Ch.9',
    },
    {
      instruction:
        'Calculate the duty cycle: D = 1 - V_in/V_out = 1 - 3.3/5.0 = 0.34. The switch is ON for 34% of each cycle. During that time, the inductor charges up from the input supply.',
      expected_observation:
        'Duty cycle D = 34%. The higher the desired output voltage relative to input, the higher the duty cycle. At D approaching 1, efficiency drops significantly.',
      learn_note:
        'Boost formula: V_out = V_in / (1 - D). As D increases, V_out rises. But real boost converters lose efficiency above D ~ 0.85 due to switch and inductor losses. -- H&H Ch.9',
    },
    {
      instruction:
        'Typical application: a single Li-ion cell (3.0-4.2V) boosted to 5V for USB output. This is how portable battery packs work -- a boost converter steps up the cell voltage.',
      expected_observation:
        'The boost converter makes it possible to power 5V USB devices from a single lithium cell. As the battery discharges from 4.2V to 3.0V, the duty cycle increases to maintain 5V output.',
      learn_note:
        'The boost converter is essential for battery-powered devices. It extracts energy from a low-voltage source and delivers it at a useful higher voltage. Efficiency is typically 85-92%. -- H&H Ch.9',
    },
  ],
  verify: () => {
    const components: Component[] = [
      { id: 'V1', type: 'voltage-source', nodes: ['vin', '0'], voltage: 3.3 } as VoltageSource,
      {
        id: 'REG1', type: 'regulator', topology: 'boost',
        outputVoltage: 5.0, dropoutVoltage: 0, nodes: ['vin', 'vout'],
      } as Regulator,
      { id: 'R_load', type: 'resistor', nodes: ['vout', '0'], resistance: 100 } as Resistor,
    ];
    const result = solveNonlinear(components);
    if (!result.converged) return false;

    const vOut = result.nodeVoltages.find((nv) => nv.node === 'vout');
    if (!vOut) return false;

    return withinTolerance(vOut.voltage, 5.0, 0.01);
  },
};

// ============================================================================
// Lab 4: Load Regulation (m7-lab-04)
// ============================================================================

const lab04: Lab = {
  id: 'm7-lab-04',
  title: 'Load Regulation',
  steps: [
    {
      instruction:
        'Build a linear regulator circuit with a light load: 12V source (V1), linear regulator (5V out, 2V dropout), and R_load = 1k ohm (I_load = 5mA). Run the simulation and record V_out.',
      expected_observation:
        'V_out = 5.0V at 5mA load. The regulator easily maintains its target output voltage with this small current draw.',
      learn_note:
        'Load regulation measures how well the output voltage stays constant as the load current changes. Ideally, V_out should not change at all. -- H&H Ch.9',
    },
    {
      instruction:
        'Now change to a heavy load: R_load = 10 ohm (I_load = 500mA). Run the simulation again and compare V_out to the light-load case.',
      expected_observation:
        'V_out is still 5.0V at 500mA. The regulator maintains its output voltage across a 100x change in load current. This is what "regulation" means.',
      learn_note:
        'A good linear regulator has load regulation of < 1%, meaning the output changes by less than 1% from no load to full load. The error amplifier continuously adjusts the pass transistor to compensate. -- H&H Ch.9',
    },
    {
      instruction:
        'Calculate load regulation: delta_V_out / delta_I_load. If V_out changes by 5mV over a 0-500mA range, that is 10 mV/A or 0.1% regulation. The 7805 datasheet specifies 4-100mV typical.',
      expected_observation:
        'In our idealized model, load regulation is perfect (0%). Real regulators have finite output impedance that causes a small voltage drop under load.',
      learn_note:
        'Load regulation is one of the key specifications for any power supply. Related specs include line regulation (V_out change vs V_in change) and transient response (recovery time after sudden load change). -- H&H Ch.9',
    },
  ],
  verify: () => {
    // Light load: R_load = 1k ohm
    const lightLoadComponents: Component[] = [
      { id: 'V1', type: 'voltage-source', nodes: ['vin', '0'], voltage: 12 } as VoltageSource,
      {
        id: 'REG1', type: 'regulator', topology: 'linear',
        outputVoltage: 5.0, dropoutVoltage: 2.0, nodes: ['vin', 'vout'],
      } as Regulator,
      { id: 'R_load', type: 'resistor', nodes: ['vout', '0'], resistance: 1000 } as Resistor,
    ];
    const lightResult = solveNonlinear(lightLoadComponents);
    if (!lightResult.converged) return false;

    const vOutLight = lightResult.nodeVoltages.find((nv) => nv.node === 'vout');
    if (!vOutLight) return false;
    if (!withinTolerance(vOutLight.voltage, 5.0, 0.01)) return false;

    // Heavy load: R_load = 10 ohm
    const heavyLoadComponents: Component[] = [
      { id: 'V1', type: 'voltage-source', nodes: ['vin', '0'], voltage: 12 } as VoltageSource,
      {
        id: 'REG1', type: 'regulator', topology: 'linear',
        outputVoltage: 5.0, dropoutVoltage: 2.0, nodes: ['vin', 'vout'],
      } as Regulator,
      { id: 'R_load', type: 'resistor', nodes: ['vout', '0'], resistance: 10 } as Resistor,
    ];
    const heavyResult = solveNonlinear(heavyLoadComponents);
    if (!heavyResult.converged) return false;

    const vOutHeavy = heavyResult.nodeVoltages.find((nv) => nv.node === 'vout');
    if (!vOutHeavy) return false;
    if (!withinTolerance(vOutHeavy.voltage, 5.0, 0.01)) return false;

    return true;
  },
};

// ============================================================================
// Lab 5: CC/CV Battery Charger (m7-lab-05)
// ============================================================================

const lab05: Lab = {
  id: 'm7-lab-05',
  title: 'CC/CV Battery Charger',
  steps: [
    {
      instruction:
        'Model the CC (constant current) phase of Li-ion charging: 5V source (V_charger, nodes vcc to 0), 100 ohm series resistor (R_series, nodes vcc to vbat), and a "battery" modeled as a 3.0V source (V_bat, nodes vbat to 0). The series resistor limits the charging current.',
      expected_observation:
        'I_charge = (V_charger - V_bat) / R_series = (5.0 - 3.0) / 100 = 20mA. The resistor limits the current to a safe value regardless of the battery state.',
      learn_note:
        'In the CC phase, the charger delivers a fixed current (typically 0.5C to 1C) to the battery. A simple series resistor is the most basic current limiter. Real chargers use active current regulation. -- H&H Ch.9',
    },
    {
      instruction:
        'Model the CV (constant voltage) phase: a linear regulator (4.2V output, 0.5V dropout) charges a near-full battery modeled as a 4.1V source. The regulator clamps the voltage at 4.2V, and current tapers as the battery fills.',
      expected_observation:
        'The regulator holds 4.2V at the output. With the battery at 4.1V, only a small current flows (limited by the battery\'s internal impedance). As the battery reaches 4.2V, current drops to near zero.',
      learn_note:
        'The CV phase prevents overcharging. Once the battery reaches 4.2V, the charger switches from CC to CV mode. Current tapers exponentially. Charging terminates when current drops below C/10 (e.g., 50mA for a 500mAh cell). -- H&H Ch.9',
    },
    {
      instruction:
        'The complete CC/CV profile: start at CC (e.g., 500mA) until the cell reaches 4.2V, then switch to CV (hold 4.2V) until current tapers to ~50mA. Total charge time is typically 2-3 hours for a full charge.',
      expected_observation:
        'The CC phase charges the battery from 3.0V to 4.2V (about 80% capacity). The CV phase tops off the remaining 20%. This two-phase approach maximizes capacity while protecting the cell.',
      learn_note:
        'Never charge Li-ion above 4.2V per cell -- overvoltage causes lithium plating, which leads to capacity loss, internal shorts, and fire risk. The CC/CV profile is the industry standard precisely because it respects this limit. -- H&H Ch.9',
    },
  ],
  verify: () => {
    // CC phase: V_charger = 5V, R_series = 100 ohm, V_bat = 3.0V
    // I_charge = (5 - 3) / 100 = 20mA
    const ccComponents: Component[] = [
      { id: 'V_charger', type: 'voltage-source', nodes: ['vcc', '0'], voltage: 5.0 } as VoltageSource,
      { id: 'R_series', type: 'resistor', nodes: ['vcc', 'vbat'], resistance: 100 } as Resistor,
      { id: 'V_bat', type: 'voltage-source', nodes: ['vbat', '0'], voltage: 3.0 } as VoltageSource,
    ];
    const ccResult = dcAnalysis(ccComponents);

    // Find the current through R_series: I = (V_vcc - V_vbat) / R
    const vVcc = ccResult.nodeVoltages.find((nv) => nv.node === 'vcc');
    const vVbat = ccResult.nodeVoltages.find((nv) => nv.node === 'vbat');
    if (!vVcc || !vVbat) return false;

    const iCharge = (vVcc.voltage - vVbat.voltage) / 100;
    if (!withinTolerance(iCharge, 0.020, 0.10)) return false; // 20mA within 10%

    return true;
  },
};

// ============================================================================
// Lab 6: Buck-Boost Converter (m7-lab-06)
// ============================================================================

const lab06: Lab = {
  id: 'm7-lab-06',
  title: 'Buck-Boost Converter',
  steps: [
    {
      instruction:
        'Build a buck-boost converter circuit: 3.6V source (V1, nodes vin to 0) representing a mid-discharge Li-ion cell, a buck-boost regulator (REG1, topology=buck-boost, outputVoltage=3.3V, dropoutVoltage=0, nodes vin to vout), and a 100 ohm load resistor (R_load, nodes vout to 0).',
      expected_observation:
        'The output is a stable 3.3V from a 3.6V input. At this voltage, the converter operates near the crossover point between buck and boost modes.',
      learn_note:
        'A buck-boost converter can step voltage up OR down, making it ideal for Li-ion to 3.3V rails where the battery voltage (3.0-4.2V) crosses the target during discharge. -- H&H Ch.9 [@HH-Ch.9]',
    },
    {
      instruction:
        'Test at voltage extremes: change V1 to 4.2V (fully charged Li-ion) and verify output is still 3.3V. Then change V1 to 3.0V (depleted cell) and verify output remains 3.3V. The buck-boost handles both cases seamlessly.',
      expected_observation:
        'At 4.2V input: the converter operates in buck mode (stepping down), output = 3.3V. At 3.0V input: the converter operates in boost mode (stepping up), output = 3.3V. The output never drops even as the battery discharges.',
      learn_note:
        'The buck-boost topology eliminates the dead zone where a pure buck converter cannot regulate (when V_in approaches V_out). Real designs use four-switch buck-boost ICs like the TPS63000 series. -- H&H Ch.9 [@HH-Ch.9]',
    },
    {
      instruction:
        'Compare duty cycles across the input range: at 4.2V input (buck mode), D = V_out/V_in = 3.3/4.2 = 0.79. At 3.0V input (boost mode), D = 1 - V_in/V_out = 1 - 3.0/3.3 = 0.09 (but in boost mode). The efficiency typically dips at the crossover point where the converter switches between modes.',
      expected_observation:
        'The buck-boost converter seamlessly transitions between modes. Efficiency is typically 90-95% in pure buck or boost regions, dropping to 85-90% near the crossover point where both switches are active.',
      learn_note:
        'Modern four-switch buck-boost converters use synchronous rectification to minimize crossover losses. The controller monitors V_in vs V_out and smoothly adjusts the switching pattern through the transition region. -- H&H Ch.9 [@HH-Ch.9]',
    },
  ],
  verify: () => {
    // Test at three Li-ion battery voltages
    const testVoltages = [4.2, 3.6, 3.0]; // full, mid, depleted

    for (const vin of testVoltages) {
      const components: Component[] = [
        { id: 'V1', type: 'voltage-source', nodes: ['vin', '0'], voltage: vin } as VoltageSource,
        {
          id: 'REG1', type: 'regulator', topology: 'buck-boost',
          outputVoltage: 3.3, dropoutVoltage: 0, nodes: ['vin', 'vout'],
        } as Regulator,
        { id: 'R_load', type: 'resistor', nodes: ['vout', '0'], resistance: 100 } as Resistor,
      ];
      const result = solveNonlinear(components);
      if (!result.converged) return false;

      const vOut = result.nodeVoltages.find((nv) => nv.node === 'vout');
      if (!vOut) return false;
      if (!withinTolerance(vOut.voltage, 3.3, 0.01)) return false;
    }

    return true;
  },
};

// ============================================================================
// Lab 7: Charge Pump Voltage Doubler (m7-lab-07)
// ============================================================================

const lab07: Lab = {
  id: 'm7-lab-07',
  title: 'Charge Pump Voltage Doubler',
  steps: [
    {
      instruction:
        'Model an ideal charge pump voltage doubler: Vin = 5V, ideal Vout = 2 * Vin = 10V. The charge pump uses a flying capacitor that charges to Vin in one phase, then stacks on top of Vin in the second phase, producing 2*Vin at the output.',
      expected_observation:
        'Ideal output voltage = 10V. The voltage doubler achieves 2x multiplication without an inductor -- just capacitors and switches (typically MOSFET transistors or diode switches).',
      learn_note:
        'Charge pumps trade current capability for simplicity. They use only capacitors and switches (no bulky inductors), making them ideal for low-current applications like RS-232 level shifters and EEPROM write voltages. -- H&H Ch.9 [@HH-Ch.9]',
    },
    {
      instruction:
        'Calculate real-world losses for a practical charge pump: Vin=5V, Iload=10mA, fsw=100kHz, Cfly=1uF (flying capacitor), Vdiode=0.3V (Schottky diodes). Capacitor voltage drop = Iload/(fsw*Cfly) = 0.010/(100e3*1e-6) = 0.1V. Diode drops = 2*0.3V = 0.6V. Real Vout = 10 - 0.1 - 0.6 = 9.3V.',
      expected_observation:
        'Real output drops from 10V ideal to approximately 9.3V. The two main loss mechanisms are: (1) capacitor ripple from charge/discharge cycles, proportional to load current, and (2) forward voltage drops in the switching diodes.',
      learn_note:
        'To minimize losses: use larger flying capacitors (reduce Vdrop_cap), higher switching frequency (same effect), and Schottky diodes with low Vf. MOSFET switches can replace diodes for even lower losses. -- H&H Ch.9 [@HH-Ch.9]',
    },
    {
      instruction:
        'Consider applications and current limitations: charge pumps are ideal for loads under 100mA. For higher currents, the flying capacitor must be impractically large. Common uses: MAX232 RS-232 driver (+/-10V from 5V), LCD bias generators, LED drivers, and FLASH memory write voltages.',
      expected_observation:
        'The charge pump is a niche but important topology. Its advantages (no inductor, low EMI, small PCB area) make it the right choice when current requirements are modest.',
      learn_note:
        'Charge pump variants include voltage inverters (-Vin from +Vin), fractional multipliers (1.5x, -0.5x), and Dickson multi-stage multipliers for higher ratios. The output impedance is approximately 1/(fsw*Cfly) per stage. -- H&H Ch.9 [@HH-Ch.9]',
    },
  ],
  verify: () => {
    // Mathematical verification -- no charge pump component in MNA
    const Vin = 5;
    const Iload = 0.010; // 10mA
    const fsw = 100e3;   // 100kHz
    const Cfly = 1e-6;   // 1uF
    const Vdiode = 0.3;  // Schottky

    // Ideal voltage doubler
    const Vout_ideal = 2 * Vin;
    if (!withinTolerance(Vout_ideal, 10, 0.001)) return false;

    // Real losses
    const Vdrop_cap = Iload / (fsw * Cfly);     // 0.1V
    const Vdrop_diodes = 2 * Vdiode;             // 0.6V
    const Vout_real = Vout_ideal - Vdrop_cap - Vdrop_diodes; // 9.3V

    // Real output must be less than ideal
    if (Vout_real >= Vout_ideal) return false;

    // Real output should be approximately 9.3V
    if (!withinTolerance(Vout_real, 9.3, 0.05)) return false;

    return true;
  },
};

// ============================================================================
// Export all labs
// ============================================================================

export const labs: Lab[] = [lab01, lab02, lab03, lab04, lab05, lab06, lab07];
