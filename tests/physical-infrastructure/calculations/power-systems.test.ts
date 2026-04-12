/**
 * Calculation accuracy tests for power systems (CA-06 through CA-12).
 *
 * Validates NEC Article 220 load calculations, transformer sizing,
 * conductor current, solar PV sizing (NEC 690), and BESS sizing.
 */
import { describe, it, expect } from 'vitest';
import { runPowerDistributionDesign } from '../../../skills/physical-infrastructure/integration/power-distribution-e2e.js';
import { runCombinedSystemDesign } from '../../../skills/physical-infrastructure/integration/combined-system-e2e.js';

describe('Power Systems Calculation Accuracy', () => {
  // -----------------------------------------------------------------------
  // CA-06: 100 racks x 10kW -> 1000kW IT, >=1200kW total (PUE 1.2)
  // -----------------------------------------------------------------------
  it('CA-06: 100 racks x 10kW = 1000kW IT load', async () => {
    const result = await runPowerDistributionDesign({
      type: 'power',
      constraints: { rackCount: 100, rackDensity_kW: 10, voltageClass: '480V' },
      safetyClass: 'data-center',
      outputFormat: ['calculations'],
    });
    const powerCalc = result.calculations.find(c => c.domain === 'power-systems');
    expect(powerCalc!.outputs['it_load_kW'].value).toBe(1000);
    expect(powerCalc!.outputs['total_load_kW'].value).toBeGreaterThanOrEqual(1200);
  });

  // -----------------------------------------------------------------------
  // CA-07: Load current for 480V 3-phase
  //   I = P / (sqrt(3) * V * PF) = 1200000 / (1.732 * 480 * 0.9) = 1603.9 A
  // -----------------------------------------------------------------------
  it('CA-07: load current formula for 480V 3-phase', async () => {
    const result = await runPowerDistributionDesign({
      type: 'power',
      constraints: { rackCount: 100, rackDensity_kW: 10, voltageClass: '480V' },
      safetyClass: 'data-center',
      outputFormat: ['calculations'],
    });
    const powerCalc = result.calculations.find(c => c.domain === 'power-systems');
    const current = powerCalc!.outputs['load_current_A'].value;
    // Expected: 1200000 / (1.732 * 480 * 0.9) ~= 1603.9 A
    expect(current).toBeGreaterThan(1500);
    expect(current).toBeLessThan(1700);
  });

  // -----------------------------------------------------------------------
  // CA-08: PUE applied correctly (1.2x multiplier)
  // -----------------------------------------------------------------------
  it('CA-08: PUE 1.2 applied to IT load', async () => {
    const result = await runPowerDistributionDesign({
      type: 'power',
      constraints: { rackCount: 10, rackDensity_kW: 10, voltageClass: '480V' },
      safetyClass: 'data-center',
      outputFormat: ['calculations'],
    });
    const powerCalc = result.calculations.find(c => c.domain === 'power-systems');
    const itLoad = powerCalc!.outputs['it_load_kW'].value;
    const totalLoad = powerCalc!.outputs['total_load_kW'].value;
    expect(totalLoad).toBe(itLoad * 1.2);
  });

  // -----------------------------------------------------------------------
  // CA-09: Transformer kVA >= 1111 for 1000kW / 0.9 PF
  //   kVA = (1000 * 1.2) / 0.9 = 1333.3 -> next standard size >= 1333 = 1500 kVA
  // -----------------------------------------------------------------------
  it('CA-09: transformer kVA >= 1111 for 1000kW at 0.9 PF', async () => {
    const result = await runPowerDistributionDesign({
      type: 'power',
      constraints: { rackCount: 100, rackDensity_kW: 10, voltageClass: '480V' },
      safetyClass: 'data-center',
      outputFormat: ['calculations'],
    });
    const powerCalc = result.calculations.find(c => c.domain === 'power-systems');
    const xfmrKVA = powerCalc!.outputs['transformer_kVA'].value;
    expect(xfmrKVA).toBeGreaterThanOrEqual(1111);
  });

  // -----------------------------------------------------------------------
  // CA-10: Transformer size is a standard size from the NEC table
  // -----------------------------------------------------------------------
  it('CA-10: transformer kVA is a standard size', async () => {
    const standardSizes = [100, 167, 250, 333, 500, 750, 1000, 1500, 2000, 2500, 3000];
    const result = await runPowerDistributionDesign({
      type: 'power',
      constraints: { rackCount: 100, rackDensity_kW: 10, voltageClass: '480V' },
      safetyClass: 'data-center',
      outputFormat: ['calculations'],
    });
    const powerCalc = result.calculations.find(c => c.domain === 'power-systems');
    const xfmrKVA = powerCalc!.outputs['transformer_kVA'].value;
    expect(standardSizes).toContain(xfmrKVA);
  });

  // -----------------------------------------------------------------------
  // CA-11: Solar kWp calculation
  //   Target = 1000 * 8760 * 0.3 = 2,628,000 kWh/yr
  //   solar_kWp = 2628000 / (5.5 * 365 * 0.80) = 2628000 / 1606 ~= 1636 kWp
  //   With powerBudget_kW default (1000): ~1636 kWp
  // -----------------------------------------------------------------------
  it('CA-11: solar kWp > 0 for request with solarAvailable_m2', async () => {
    const result = await runPowerDistributionDesign({
      type: 'power',
      constraints: {
        rackCount: 10,
        rackDensity_kW: 10,
        voltageClass: '480V',
        solarAvailable_m2: 5000,
      },
      safetyClass: 'data-center',
      outputFormat: ['calculations'],
    });
    const solarCalc = result.calculations.find(c => c.domain === 'power-systems-solar');
    expect(solarCalc).toBeDefined();
    expect(solarCalc!.outputs['solar_kWp'].value).toBeGreaterThan(0);
  });

  // -----------------------------------------------------------------------
  // CA-12: BESS capacity for 500kW, 30min, 85% DoD, 90% eff
  //   E = (500 * 30/60) / (0.85 * 0.90) = 250 / 0.765 ~= 326.8 kWh
  // -----------------------------------------------------------------------
  it('CA-12: BESS capacity ~327 kWh for 500kW, 30min, 85% DoD, 90% eff', async () => {
    const result = await runPowerDistributionDesign({
      type: 'power',
      constraints: {
        rackCount: 10,
        rackDensity_kW: 10,
        voltageClass: '480V',
        batteryRuntime_min: 30,
        powerBudget_kW: 500,
      },
      safetyClass: 'data-center',
      outputFormat: ['calculations'],
    });
    const bessCalc = result.calculations.find(c => c.domain === 'power-systems-bess');
    expect(bessCalc).toBeDefined();
    const capacity = bessCalc!.outputs['bess_capacity_kWh'].value;
    // Expected: 250 / 0.765 = 326.8
    expect(capacity).toBeGreaterThan(310);
    expect(capacity).toBeLessThan(345);
  });

  // -----------------------------------------------------------------------
  // Additional: NEC method citations
  // -----------------------------------------------------------------------
  it('NEC Article 220 + Table 310.16 cited in power calculation method', async () => {
    const result = await runPowerDistributionDesign({
      type: 'power',
      constraints: { rackCount: 10, rackDensity_kW: 10, voltageClass: '480V' },
      safetyClass: 'data-center',
      outputFormat: ['calculations'],
    });
    const powerCalc = result.calculations.find(c => c.domain === 'power-systems');
    expect(powerCalc!.method).toMatch(/NEC/);
  });

  // -----------------------------------------------------------------------
  // Additional: Power safety margin
  // -----------------------------------------------------------------------
  it('power calculation safety margin is 25%', async () => {
    const result = await runPowerDistributionDesign({
      type: 'power',
      constraints: { rackCount: 10, rackDensity_kW: 10, voltageClass: '480V' },
      safetyClass: 'data-center',
      outputFormat: ['calculations'],
    });
    const powerCalc = result.calculations.find(c => c.domain === 'power-systems');
    expect(powerCalc!.safetyMargin).toBe(25);
  });

  // -----------------------------------------------------------------------
  // Additional: Combined scenario power calculation matches standalone
  // -----------------------------------------------------------------------
  it('combined system produces same IT load as standalone power', async () => {
    const standalone = await runPowerDistributionDesign({
      type: 'power',
      constraints: { rackCount: 10, rackDensity_kW: 40, voltageClass: '480V' },
      safetyClass: 'data-center',
      outputFormat: ['calculations'],
    });
    const combined = await runCombinedSystemDesign({
      type: 'combined',
      constraints: { rackCount: 10, rackDensity_kW: 40, voltageClass: '480V' },
      safetyClass: 'data-center',
      outputFormat: ['calculations'],
    });
    const standalonePower = standalone.calculations.find(c => c.domain === 'power-systems');
    const combinedPower = combined.calculations.find(c => c.domain === 'power-systems');
    expect(combinedPower!.outputs['it_load_kW'].value).toBe(
      standalonePower!.outputs['it_load_kW'].value,
    );
  });
});
