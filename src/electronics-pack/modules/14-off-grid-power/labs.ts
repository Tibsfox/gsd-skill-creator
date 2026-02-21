/**
 * Module 14: Off-Grid Power Systems -- Lab exercises
 *
 * 5 labs backed by the solar engine demonstrating off-grid power
 * fundamentals: solar I-V curves, battery sizing, MPPT algorithms,
 * inverter efficiency, and complete system design.
 *
 * Labs use solarCellIV, solarCellMPP, mpptPerturbAndObserve,
 * batteryModel, chargeControllerSim, and inverterEfficiency
 * from the solar engine (Phase 276 Plan 01).
 */

import {
  solarCellIV,
  solarCellMPP,
  mpptPerturbAndObserve,
  batteryModel,
  chargeControllerSim,
  inverterEfficiency,
} from '../../simulator/solar-engine';

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
// Lab 1: Solar I-V Curve (m14-lab-01)
// ============================================================================

const lab01: Lab = {
  id: 'm14-lab-01',
  title: 'Solar I-V Curve',
  steps: [
    {
      instruction:
        'Generate an I-V curve for a standard 36-cell silicon panel: Isc = 9A, Voc = 0.611V per cell (22V total for 36 cells), at standard test conditions (1000 W/m2, 25C). Use solarCellIV({ isc: 9, voc: 0.611, cells: 36 }).',
      expected_observation:
        'The I-V curve shows 200 data points from V=0 to V=22V (0.611V * 36 cells). At V=0, current equals Isc (9A). At V=Voc, current drops to zero. The curve has a characteristic "knee" shape.',
      learn_note:
        'The I-V curve is the electrical fingerprint of a solar panel. Every panel has a unique curve determined by its cell count, material, and manufacturing quality. The knee region is where the maximum power point lives. -- H&H 9.8',
    },
    {
      instruction:
        'Identify Isc and Voc from the curve endpoints. The first point (V=0) gives Isc. The last point (V=Voc_total) gives where I drops to zero. Find the maximum power point using solarCellMPP with the same panel configuration.',
      expected_observation:
        'Isc is approximately 9A (first current value). Voc is approximately 22V (total for 36 cells at 0.611V each). The MPP occurs at a voltage below Voc and a current below Isc, yielding maximum power.',
      learn_note:
        'Isc and Voc are the two anchor points of the I-V curve. No operating point can exceed either value. The maximum power point is always at an intermediate voltage and current -- never at the extremes. -- H&H 9.8',
    },
    {
      instruction:
        'Calculate the fill factor: FF = P_mpp / (Voc * Isc). A higher fill factor means the I-V curve is more "square" and the panel extracts more of its theoretical maximum power. Typical silicon panels achieve FF = 0.70-0.80.',
      expected_observation:
        'The fill factor for this panel is between 0.60 and 0.85. This quantifies how much of the Voc * Isc rectangle is actually filled by the real power curve.',
      learn_note:
        'Fill factor is a quality metric for solar cells. Low fill factor indicates high series resistance (poor contacts, thin grid lines) or high recombination (material defects). Manufacturing improvements target higher FF. -- H&H 9.8',
    },
  ],
  verify: () => {
    // Generate I-V curve for standard 36-cell panel (voc is per-cell)
    const panelConfig = { isc: 9, voc: 0.611, cells: 36 };
    const iv = solarCellIV(panelConfig);

    // Check Isc: first current value should be within 5% of 9A
    if (!withinTolerance(iv.currents[0], 9, 0.05)) return false;

    // Check Voc: last voltage should be within 5% of 0.611*36 = ~22V
    const vocTotal = iv.voltages[iv.voltages.length - 1];
    if (!withinTolerance(vocTotal, 22, 0.05)) return false;

    // Find MPP and check fill factor is in reasonable range
    const mpp = solarCellMPP(panelConfig);
    if (mpp.fillFactor < 0.6 || mpp.fillFactor > 0.85) return false;

    return true;
  },
};

// ============================================================================
// Lab 2: Battery Bank Sizing (m14-lab-02)
// ============================================================================

const lab02: Lab = {
  id: 'm14-lab-02',
  title: 'Battery Bank Sizing',
  steps: [
    {
      instruction:
        'Create a lead-acid battery model: 12V nominal, 100Ah capacity, starting at full charge (SOC = 1.0). Use batteryModel({ capacity_ah: 100, voltage_nominal: 12, soc_initial: 1.0, chemistry: "lead-acid" }).',
      expected_observation:
        'The battery starts at SOC = 1.0 (100%), voltage approximately 12.7V (lead-acid fully charged), and 100Ah remaining capacity.',
      learn_note:
        'Lead-acid battery voltage varies with state of charge: approximately 12.7V at full, 12.2V at 50%, and 11.5V at empty. This voltage-SOC relationship is not perfectly linear but useful for estimation. -- H&H 9.8',
    },
    {
      instruction:
        'Discharge the battery at 10A for 5 hours (removing 50Ah, or 50% of capacity). This represents a 50% depth of discharge (DOD). Check the resulting SOC and voltage.',
      expected_observation:
        'After discharging 50Ah from a 100Ah battery, SOC drops to approximately 0.5 (50%). Voltage drops to approximately 12.1V, reflecting the lower charge state.',
      learn_note:
        'Lead-acid batteries should not be discharged below 50% DOD for reasonable cycle life. At 50% DOD, expect 500-800 charge cycles. At 80% DOD, cycle life drops to 200-300. This is why off-grid systems are sized with 50% DOD as the limit. -- H&H 9.8',
    },
    {
      instruction:
        'Calculate why the 50% DOD limit matters economically. A 100Ah battery at 50% DOD gives 50Ah usable. For 100Ah usable at 50% DOD, you need 200Ah of battery. Compare the cost-per-cycle of deep vs. shallow cycling.',
      expected_observation:
        'The voltage at 50% SOC (approximately 12.1V) is still in a safe operating range for a 12V lead-acid system. The battery has 50Ah remaining capacity, matching the 50% DOD target.',
      learn_note:
        'Battery bank sizing formula: Required_Ah = Daily_load_Ah * Days_of_autonomy / Max_DOD. For a 50Ah daily load with 2 days autonomy at 50% DOD: 50 * 2 / 0.5 = 200Ah minimum. Always round up to the next available battery size. -- H&H 9.8',
    },
  ],
  verify: () => {
    // Create a fully charged lead-acid battery
    const battery = batteryModel({
      capacity_ah: 100,
      voltage_nominal: 12,
      soc_initial: 1.0,
      chemistry: 'lead-acid',
    });

    // Discharge at 10A for 5 hours (50Ah = 50% DOD)
    battery.discharge(10, 5);
    const state = battery.getState();

    // SOC should be approximately 0.5 (within 10%)
    if (!withinTolerance(state.soc, 0.5, 0.10)) return false;

    // Voltage should be in reasonable range for 50% SOC lead-acid (11.5-12.2V)
    if (state.voltage < 11.5 || state.voltage > 12.2) return false;

    return true;
  },
};

// ============================================================================
// Lab 3: MPPT Algorithm (m14-lab-03)
// ============================================================================

const lab03: Lab = {
  id: 'm14-lab-03',
  title: 'MPPT Algorithm',
  steps: [
    {
      instruction:
        'Generate an I-V curve for a standard panel (Isc=9A, Voc=0.611V/cell, 36 cells -> 22V total) and find the true maximum power point using solarCellMPP. This gives the theoretical best operating point.',
      expected_observation:
        'The true MPP occurs at a specific voltage and current that maximizes V*I. The power at MPP is significantly higher than at either the short-circuit or open-circuit extremes (where power is zero).',
      learn_note:
        'The maximum power point is a single optimal point on the I-V curve. Any deviation -- operating at a higher or lower voltage -- results in less power extracted from the panel. This is why MPPT matters. -- H&H 9.8',
    },
    {
      instruction:
        'Run the Perturb & Observe MPPT algorithm on the same I-V curve using mpptPerturbAndObserve(ivCurve). Compare the P&O result to the true MPP power.',
      expected_observation:
        'The P&O algorithm converges to a power value within 5% of the true MPP. It takes a finite number of steps, oscillating around the peak before settling.',
      learn_note:
        'P&O is the most common MPPT algorithm in commercial charge controllers. Its simplicity (just compare current power to previous power) makes it easy to implement in a microcontroller. The tradeoff is oscillation around MPP, wasting a small amount of energy. -- H&H 9.8',
    },
    {
      instruction:
        'Observe the step count of the P&O algorithm. The algorithm starts at the midpoint of the I-V curve and perturbs in small steps, reversing direction when power decreases. It terminates after two direction reversals.',
      expected_observation:
        'The algorithm converges in a modest number of steps. The oscillation pattern (increase-increase-decrease-reverse-increase-decrease-reverse-stop) demonstrates the P&O tradeoff between tracking speed and steady-state accuracy.',
      learn_note:
        'Faster MPPT response (larger step size) gives quicker tracking under changing clouds but more oscillation loss at steady state. Slower response (smaller steps) minimizes oscillation but may not track rapid irradiance changes. Adaptive step-size algorithms combine both advantages. -- H&H 9.8',
    },
  ],
  verify: () => {
    // Generate I-V curve for standard panel (voc is per-cell)
    const panelConfig = { isc: 9, voc: 0.611, cells: 36 };
    const iv = solarCellIV(panelConfig);

    // Run P&O MPPT
    const mpptResult = mpptPerturbAndObserve(iv);

    // Get true MPP for comparison
    const trueMPP = solarCellMPP(panelConfig);

    // P&O result should be within 5% of true MPP power
    if (!withinTolerance(mpptResult.pmpp, trueMPP.pmpp, 0.05)) return false;

    return true;
  },
};

// ============================================================================
// Lab 4: Inverter Waveforms (m14-lab-04)
// ============================================================================

const lab04: Lab = {
  id: 'm14-lab-04',
  title: 'Inverter Waveforms',
  steps: [
    {
      instruction:
        'Calculate inverter efficiency at 4 load levels on a 3000W inverter converting 48V DC to 240V AC. Use inverterEfficiency with loadPower_w at 750W (25%), 1500W (50%), 2250W (75%), and 3000W (100%).',
      expected_observation:
        'Efficiency varies with load: lowest at 25% load (fixed losses are a larger fraction), highest near 75-100% load. The efficiency curve has a characteristic shape that peaks near rated load.',
      learn_note:
        'Inverter efficiency curves explain why oversizing an inverter wastes energy. A 5kW inverter running a 500W load operates at only 10% of rated capacity, where fixed losses (gate drive, magnetics, control circuitry) dominate. Right-sizing the inverter to the expected load range maximizes overall system efficiency. -- H&H 9.8',
    },
    {
      instruction:
        'Compare input power to output power at each load level. Input power is always higher than output power because the inverter consumes energy in the conversion process. The difference is waste heat.',
      expected_observation:
        'At every load level, inputPower_w > outputPower_w. The ratio outputPower_w / inputPower_w equals the efficiency. At 50% load, a well-designed inverter achieves about 90% efficiency.',
      learn_note:
        'Inverter losses come from three sources: switching losses (MOSFETs turning on/off), conduction losses (Rds_on * I^2), and magnetic losses (transformer core hysteresis and eddy currents). Switching and conduction losses scale with load; magnetic and control losses are relatively fixed. -- H&H 9.8',
    },
    {
      instruction:
        'Observe the efficiency difference between 10% load and 50% load. Very light loads have disproportionately low efficiency due to the fixed standby power consumption of the inverter.',
      expected_observation:
        'Efficiency at 50% load is significantly higher than at 10% load. Below about 10% rated power, some inverters enter a "search" mode to reduce standby losses, pulsing on briefly to check for load.',
      learn_note:
        'For off-grid systems with varying loads (lights during day, cooking at evening), a dual-inverter setup can help: a small inverter (500W) for base loads and a large inverter (3kW) switched on for heavy loads. This keeps both inverters operating in their efficient range. -- H&H 9.8',
    },
  ],
  verify: () => {
    const baseConfig = {
      inputVoltage_dc: 48,
      outputVoltage_ac: 240,
      ratedPower_w: 3000,
    };

    // Efficiency at 10% load
    const eff10 = inverterEfficiency({ ...baseConfig, loadPower_w: 300 });
    // Efficiency at 50% load
    const eff50 = inverterEfficiency({ ...baseConfig, loadPower_w: 1500 });
    // Efficiency at 75% load
    const eff75 = inverterEfficiency({ ...baseConfig, loadPower_w: 2250 });

    // 50% load efficiency should be higher than 10% load
    if (eff50.efficiency <= eff10.efficiency) return false;

    // 75% load efficiency should be above 0.85
    if (eff75.efficiency <= 0.85) return false;

    // Input power must exceed output power for all cases
    const loads = [300, 750, 1500, 2250, 3000];
    for (const load of loads) {
      const result = inverterEfficiency({ ...baseConfig, loadPower_w: load });
      if (result.inputPower_w <= result.outputPower_w) return false;
    }

    return true;
  },
};

// ============================================================================
// Lab 5: Complete Off-Grid System (m14-lab-05)
// ============================================================================

const lab05: Lab = {
  id: 'm14-lab-05',
  title: 'Complete Off-Grid System',
  steps: [
    {
      instruction:
        'Design an off-grid system for a 500W daily load with 5 peak sun-hours. Panel sizing: 500Wh / 5h = 100W minimum. Derate by 30% for losses (wiring, controller, temperature): 100W / 0.70 = 143W, round up to 150W panel. Battery sizing: 500Wh / 12V / 0.5 DOD = 83Ah, round to 100Ah lead-acid.',
      expected_observation:
        'A 150W panel and 100Ah 12V lead-acid battery bank provide adequate energy for the 500Wh daily load with the 50% DOD constraint. The system has modest margin for cloudy days.',
      learn_note:
        'Off-grid system sizing follows a chain: Load analysis (Wh/day) -> Panel sizing (Wh / sun-hours / derating) -> Battery sizing (Wh / Vsys / DOD_limit). Each stage adds safety margin. Professional designs add 20-50% margin beyond the calculations. -- H&H 9.8',
    },
    {
      instruction:
        'Simulate the charge controller: use chargeControllerSim with 150W panel power, 12V battery, 0.5 SOC, and MPPT controller type. Verify the charge current is positive and sufficient to charge the battery.',
      expected_observation:
        'The MPPT charge controller delivers a positive charge current at 93% efficiency. The charge voltage is slightly above battery voltage (about 12.6V) to push current into the battery.',
      learn_note:
        'An MPPT controller with a 150W panel and 12V battery delivers approximately 150 * 0.93 / 12 = 11.6A of charge current. At this rate, a 100Ah battery from 50% to 100% (50Ah needed) takes about 4.3 hours -- achievable within 5 sun-hours. -- H&H 9.8',
    },
    {
      instruction:
        'Simulate the inverter: use inverterEfficiency with the 500W load on a suitably sized inverter (1000W rated, allowing for surge). Verify efficiency exceeds 80%. Then confirm the battery can supply the load by running a discharge cycle.',
      expected_observation:
        'The inverter handles the 500W load at good efficiency (above 80%). The 100Ah battery at 12V can supply 500W for several hours before reaching the 50% DOD limit.',
      learn_note:
        'The complete energy chain: Solar panel (150W) -> MPPT controller (93% eff) -> Battery (100Ah, 50% usable) -> Inverter (85%+ eff) -> Load (500W). Total system efficiency from panel to load is roughly 0.93 * 0.85 = 79%. Always account for cumulative losses in system design. -- H&H 9.8',
    },
  ],
  verify: () => {
    // Charge controller: 150W panel, 12V battery, MPPT
    const ccResult = chargeControllerSim({
      panelPower: 150,
      batteryVoltage: 12,
      batterySOC: 0.5,
      controllerType: 'mppt',
    });

    // Charge current must be positive
    if (ccResult.chargeCurrent <= 0) return false;

    // Inverter: 500W load on 1000W rated inverter
    const invResult = inverterEfficiency({
      inputVoltage_dc: 12,
      outputVoltage_ac: 240,
      loadPower_w: 500,
      ratedPower_w: 1000,
    });

    // Efficiency must exceed 80%
    if (invResult.efficiency <= 0.80) return false;

    // Battery: charge/discharge cycle confirms battery can supply the load
    const battery = batteryModel({
      capacity_ah: 100,
      voltage_nominal: 12,
      soc_initial: 1.0,
      chemistry: 'lead-acid',
    });

    // Discharge at ~42A (500W / 12V) for 1 hour = 42Ah drawn
    const loadCurrent = 500 / 12;
    battery.discharge(loadCurrent, 1);
    const state = battery.getState();

    // After 1 hour at 500W from 100Ah, SOC should be above 0.5 (within DOD limit)
    if (state.soc < 0.5) return false;

    return true;
  },
};

// ============================================================================
// Export all labs
// ============================================================================

export const labs: Lab[] = [lab01, lab02, lab03, lab04, lab05];
