/**
 * Solar Engine Tests
 *
 * Validates solar cell I-V model, MPPT algorithms (P&O, incremental
 * conductance), battery state-of-charge tracking, charge controller
 * simulation, and inverter efficiency modeling.
 *
 * Phase 276 Plan 01 -- TDD RED phase.
 */

import { describe, it, expect } from 'vitest';
import {
  solarCellIV,
  solarCellMPP,
  mpptPerturbAndObserve,
  mpptIncrementalConductance,
  batteryModel,
  chargeControllerSim,
  inverterEfficiency,
} from '../simulator/solar-engine.js';

// ===========================================================================
// Group 1: solarCellIV -- Solar cell I-V curve generator
// ===========================================================================

describe('solarCellIV', () => {
  const standardPanel = { isc: 9.0, voc: 0.6, cells: 36 };

  it('current at V=0 equals Isc within 5%', () => {
    const result = solarCellIV(standardPanel);
    // First point at V=0 should be close to Isc
    expect(result.voltages[0]).toBe(0);
    expect(Math.abs(result.currents[0] - standardPanel.isc) / standardPanel.isc)
      .toBeLessThan(0.05);
  });

  it('current at V=Voc is approximately 0', () => {
    const result = solarCellIV(standardPanel);
    // Last point at V=Voc should have near-zero current
    const lastIdx = result.voltages.length - 1;
    const expectedVoc = standardPanel.voc * standardPanel.cells;
    expect(Math.abs(result.voltages[lastIdx] - expectedVoc)).toBeLessThan(0.5);
    expect(Math.abs(result.currents[lastIdx])).toBeLessThan(0.1);
  });

  it('power array equals voltages * currents element-wise', () => {
    const result = solarCellIV(standardPanel);
    for (let i = 0; i < result.voltages.length; i++) {
      const expectedPower = result.voltages[i] * result.currents[i];
      expect(Math.abs(result.powers[i] - expectedPower)).toBeLessThan(1e-10);
    }
  });

  it('series cells scale voltage by cell count', () => {
    const result = solarCellIV(standardPanel);
    // 36 cells * 0.6V = ~21.6V Voc for standard panel
    const expectedVoc = standardPanel.voc * standardPanel.cells;
    const lastIdx = result.voltages.length - 1;
    expect(result.voltages[lastIdx]).toBeCloseTo(expectedVoc, 0);
  });

  it('reduced irradiance reduces Isc proportionally', () => {
    const full = solarCellIV({ ...standardPanel, irradiance: 1000 });
    const half = solarCellIV({ ...standardPanel, irradiance: 500 });

    // At V=0, half irradiance should give ~50% of Isc
    const ratio = half.currents[0] / full.currents[0];
    expect(Math.abs(ratio - 0.5)).toBeLessThan(0.05);
  });

  it('elevated temperature reduces Voc', () => {
    const cool = solarCellIV({ ...standardPanel, temperature: 25 });
    const hot = solarCellIV({ ...standardPanel, temperature: 45 });

    // Last voltage point (Voc) should be lower at higher temperature
    const coolVoc = cool.voltages[cool.voltages.length - 1];
    const hotVoc = hot.voltages[hot.voltages.length - 1];
    expect(hotVoc).toBeLessThan(coolVoc);

    // Approximate -2mV/cell/C -> 36 cells * 20C * 0.002V = 1.44V reduction
    const expectedReduction = 0.002 * standardPanel.cells * (45 - 25);
    const actualReduction = coolVoc - hotVoc;
    expect(Math.abs(actualReduction - expectedReduction)).toBeLessThan(0.5);
  });
});

// ===========================================================================
// Group 2: solarCellMPP -- Maximum power point finder
// ===========================================================================

describe('solarCellMPP', () => {
  const standardPanel = { isc: 9.0, voc: 0.6, cells: 36 };

  it('fill factor is between 0.6 and 0.85', () => {
    const result = solarCellMPP(standardPanel);
    expect(result.fillFactor).toBeGreaterThan(0.6);
    expect(result.fillFactor).toBeLessThan(0.85);
  });

  it('maximum power is positive', () => {
    const result = solarCellMPP(standardPanel);
    expect(result.pmpp).toBeGreaterThan(0);
  });

  it('Vmpp is between 0 and Voc', () => {
    const result = solarCellMPP(standardPanel);
    const voc = standardPanel.voc * standardPanel.cells;
    expect(result.vmpp).toBeGreaterThan(0);
    expect(result.vmpp).toBeLessThan(voc);
  });

  it('Impp is between 0 and Isc', () => {
    const result = solarCellMPP(standardPanel);
    expect(result.impp).toBeGreaterThan(0);
    expect(result.impp).toBeLessThan(standardPanel.isc);
  });
});

// ===========================================================================
// Group 3: mpptPerturbAndObserve -- P&O MPPT algorithm
// ===========================================================================

describe('mpptPerturbAndObserve', () => {
  const standardPanel = { isc: 9.0, voc: 0.6, cells: 36 };

  it('converges to within 5% of true MPP power', () => {
    const ivCurve = solarCellIV(standardPanel);
    const trueMPP = solarCellMPP(standardPanel);
    const result = mpptPerturbAndObserve(ivCurve);

    const error = Math.abs(result.pmpp - trueMPP.pmpp) / trueMPP.pmpp;
    expect(error).toBeLessThan(0.05);
  });

  it('step count is reasonable (not exhaustive search)', () => {
    const ivCurve = solarCellIV(standardPanel);
    const result = mpptPerturbAndObserve(ivCurve);

    expect(result.steps).toBeGreaterThan(0);
    expect(result.steps).toBeLessThan(ivCurve.voltages.length);
  });

  it('works for low irradiance conditions', () => {
    const lowPanel = { ...standardPanel, irradiance: 300 };
    const ivCurve = solarCellIV(lowPanel);
    const trueMPP = solarCellMPP(lowPanel);
    const result = mpptPerturbAndObserve(ivCurve);

    const error = Math.abs(result.pmpp - trueMPP.pmpp) / trueMPP.pmpp;
    expect(error).toBeLessThan(0.05);
  });
});

// ===========================================================================
// Group 4: mpptIncrementalConductance -- IC MPPT algorithm
// ===========================================================================

describe('mpptIncrementalConductance', () => {
  const standardPanel = { isc: 9.0, voc: 0.6, cells: 36 };

  it('converges to within 5% of true MPP power', () => {
    const ivCurve = solarCellIV(standardPanel);
    const trueMPP = solarCellMPP(standardPanel);
    const result = mpptIncrementalConductance(ivCurve);

    const error = Math.abs(result.pmpp - trueMPP.pmpp) / trueMPP.pmpp;
    expect(error).toBeLessThan(0.05);
  });

  it('at MPP dI/dV approximately equals -I/V', () => {
    const ivCurve = solarCellIV(standardPanel);
    const result = mpptIncrementalConductance(ivCurve);

    // Find the index closest to the returned vmpp
    let mppIdx = 0;
    let minDist = Infinity;
    for (let i = 0; i < ivCurve.voltages.length; i++) {
      const dist = Math.abs(ivCurve.voltages[i] - result.vmpp);
      if (dist < minDist) {
        minDist = dist;
        mppIdx = i;
      }
    }

    // Check dI/dV + I/V is near zero at MPP (within tolerance)
    if (mppIdx > 0 && mppIdx < ivCurve.voltages.length - 1) {
      const dI = ivCurve.currents[mppIdx + 1] - ivCurve.currents[mppIdx - 1];
      const dV = ivCurve.voltages[mppIdx + 1] - ivCurve.voltages[mppIdx - 1];
      const dIdV = dI / dV;
      const negIoverV = -ivCurve.currents[mppIdx] / ivCurve.voltages[mppIdx];

      // The IC condition: dI/dV + I/V should be near zero
      expect(Math.abs(dIdV - negIoverV)).toBeLessThan(1.0);
    }
  });
});

// ===========================================================================
// Group 5: batteryModel -- Battery state tracking
// ===========================================================================

describe('batteryModel', () => {
  it('SOC increases when charging', () => {
    const battery = batteryModel({
      capacity_ah: 100,
      voltage_nominal: 12,
      soc_initial: 0.5,
      chemistry: 'lead-acid',
    });

    const before = battery.getState().soc;
    battery.charge(10, 1); // 10A for 1 hour
    const after = battery.getState().soc;

    expect(after).toBeGreaterThan(before);
  });

  it('SOC decreases when discharging', () => {
    const battery = batteryModel({
      capacity_ah: 100,
      voltage_nominal: 12,
      soc_initial: 0.5,
      chemistry: 'lead-acid',
    });

    const before = battery.getState().soc;
    battery.discharge(10, 1); // 10A for 1 hour
    const after = battery.getState().soc;

    expect(after).toBeLessThan(before);
  });

  it('SOC is clamped to 1.0 on overcharge', () => {
    const battery = batteryModel({
      capacity_ah: 100,
      voltage_nominal: 12,
      soc_initial: 0.95,
      chemistry: 'lead-acid',
    });

    battery.charge(100, 10); // Way more than capacity
    const state = battery.getState();

    expect(state.soc).toBe(1.0);
  });

  it('SOC is clamped to 0.0 on overdischarge', () => {
    const battery = batteryModel({
      capacity_ah: 100,
      voltage_nominal: 12,
      soc_initial: 0.05,
      chemistry: 'lead-acid',
    });

    battery.discharge(100, 10); // Way more than capacity
    const state = battery.getState();

    expect(state.soc).toBe(0.0);
  });

  it('lead-acid voltage curve: ~12.0V at SOC=0.5, ~12.7V at SOC=1.0', () => {
    const batteryHalf = batteryModel({
      capacity_ah: 100,
      voltage_nominal: 12,
      soc_initial: 0.5,
      chemistry: 'lead-acid',
    });
    const batteryFull = batteryModel({
      capacity_ah: 100,
      voltage_nominal: 12,
      soc_initial: 1.0,
      chemistry: 'lead-acid',
    });

    const halfV = batteryHalf.getState().voltage;
    const fullV = batteryFull.getState().voltage;

    expect(Math.abs(halfV - 12.1)).toBeLessThan(0.2);
    expect(Math.abs(fullV - 12.7)).toBeLessThan(0.1);
  });

  it('lithium voltage curve: ~3.6V at SOC=0.5, ~4.2V at SOC=1.0', () => {
    const batteryHalf = batteryModel({
      capacity_ah: 5,
      voltage_nominal: 3.7,
      soc_initial: 0.5,
      chemistry: 'lithium',
    });
    const batteryFull = batteryModel({
      capacity_ah: 5,
      voltage_nominal: 3.7,
      soc_initial: 1.0,
      chemistry: 'lithium',
    });

    const halfV = batteryHalf.getState().voltage;
    const fullV = batteryFull.getState().voltage;

    expect(Math.abs(halfV - 3.6)).toBeLessThan(0.2);
    expect(Math.abs(fullV - 4.2)).toBeLessThan(0.1);
  });

  it('capacity tracking: 10A for 1 hour adds 10Ah', () => {
    const battery = batteryModel({
      capacity_ah: 100,
      voltage_nominal: 12,
      soc_initial: 0.5,
      chemistry: 'lead-acid',
    });

    const before = battery.getState().capacity_remaining_ah;
    battery.charge(10, 1);
    const after = battery.getState().capacity_remaining_ah;

    expect(Math.abs((after - before) - 10)).toBeLessThan(0.1);
  });
});

// ===========================================================================
// Group 6: chargeControllerSim -- Charge controller simulation
// ===========================================================================

describe('chargeControllerSim', () => {
  it('MPPT controller has higher efficiency than PWM', () => {
    const mppt = chargeControllerSim({
      panelPower: 300,
      batteryVoltage: 12,
      batterySOC: 0.5,
      controllerType: 'mppt',
    });
    const pwm = chargeControllerSim({
      panelPower: 300,
      batteryVoltage: 12,
      batterySOC: 0.5,
      controllerType: 'pwm',
    });

    expect(mppt.efficiency).toBeGreaterThan(0.9);
    expect(pwm.efficiency).toBeLessThan(mppt.efficiency);
    expect(pwm.efficiency).toBeGreaterThan(0.5);
    expect(pwm.efficiency).toBeLessThanOrEqual(0.8);
  });

  it('charge current is positive when panel power is positive', () => {
    const result = chargeControllerSim({
      panelPower: 200,
      batteryVoltage: 12,
      batterySOC: 0.5,
      controllerType: 'mppt',
    });

    expect(result.chargeCurrent).toBeGreaterThan(0);
  });

  it('charge voltage is appropriate for battery voltage', () => {
    const result = chargeControllerSim({
      panelPower: 200,
      batteryVoltage: 12,
      batterySOC: 0.5,
      controllerType: 'mppt',
    });

    // Charge voltage should be at or above battery voltage
    expect(result.chargeVoltage).toBeGreaterThanOrEqual(12);
    // But not excessively high
    expect(result.chargeVoltage).toBeLessThan(20);
  });
});

// ===========================================================================
// Group 7: inverterEfficiency -- Inverter efficiency calculation
// ===========================================================================

describe('inverterEfficiency', () => {
  it('efficiency peaks between 50-100% load (85-95% range)', () => {
    const result = inverterEfficiency({
      inputVoltage_dc: 12,
      outputVoltage_ac: 120,
      loadPower_w: 750,
      ratedPower_w: 1000,
    });

    expect(result.efficiency).toBeGreaterThan(0.85);
    expect(result.efficiency).toBeLessThan(0.95);
  });

  it('efficiency drops at very low load (<10% rated)', () => {
    const result = inverterEfficiency({
      inputVoltage_dc: 12,
      outputVoltage_ac: 120,
      loadPower_w: 50,
      ratedPower_w: 1000,
    });

    expect(result.efficiency).toBeLessThan(0.80);
  });

  it('output power equals load power', () => {
    const result = inverterEfficiency({
      inputVoltage_dc: 24,
      outputVoltage_ac: 120,
      loadPower_w: 500,
      ratedPower_w: 1000,
    });

    expect(result.outputPower_w).toBe(500);
  });

  it('input power equals output power divided by efficiency', () => {
    const result = inverterEfficiency({
      inputVoltage_dc: 24,
      outputVoltage_ac: 120,
      loadPower_w: 500,
      ratedPower_w: 1000,
    });

    const expectedInput = result.outputPower_w / result.efficiency;
    expect(Math.abs(result.inputPower_w - expectedInput)).toBeLessThan(0.01);
  });
});
