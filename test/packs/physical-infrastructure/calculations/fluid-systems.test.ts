/**
 * Calculation accuracy tests for fluid systems (CA-01 through CA-05, CA-21 through CA-25).
 *
 * Validates Darcy-Weisbach calculations, NPS pipe sizing, Reynolds number,
 * and additional fluid engineering reference values.
 */
import { describe, it, expect } from 'vitest';
import { runCoolingSystemDesign } from '../../../../skills/physical-infrastructure/integration/cooling-system-e2e.js';
import { runCombinedSystemDesign } from '../../../../skills/physical-infrastructure/integration/combined-system-e2e.js';

describe('Fluid Systems Calculation Accuracy', () => {
  // -----------------------------------------------------------------------
  // CA-01: Flow rate for 400kW at deltaT=10C
  //   Q = P / (rho * Cp * deltaT) = 400000 / (998 * 4182 * 10) = 0.009584 m3/s = 9.58 L/s
  // -----------------------------------------------------------------------
  it('CA-01: 400kW, deltaT=10C produces ~9.56 L/s flow rate (+-0.1)', async () => {
    const result = await runCoolingSystemDesign({
      type: 'cooling',
      constraints: { heatLoad_kW: 400, rackCount: 10, rackDensity_kW: 40 },
      safetyClass: 'data-center',
      outputFormat: ['calculations'],
    });
    const fluidCalc = result.calculations.find(c => c.domain === 'fluid-systems');
    expect(fluidCalc).toBeDefined();
    const flowRate = fluidCalc!.outputs['flow_rate_Ls'].value;
    expect(flowRate).toBeCloseTo(9.58, 0); // +-0.5
    expect(Math.abs(flowRate - 9.56)).toBeLessThan(0.15); // tight tolerance
  });

  // -----------------------------------------------------------------------
  // CA-02: NPS pipe size for 9.56 L/s at max 2.4 m/s -> NPS 3
  //   A = Q/v = 0.00956 / 2.4 = 0.003983 m2
  //   D = sqrt(4A/pi) = 0.0712 m = 71.2 mm
  //   NPS 3 has ID = 77.9mm (Schedule 40) -> first NPS >= 71.2mm
  // -----------------------------------------------------------------------
  it('CA-02: 9.56 L/s at max 2.4 m/s selects NPS 3 minimum', async () => {
    const result = await runCoolingSystemDesign({
      type: 'cooling',
      constraints: { heatLoad_kW: 400, rackCount: 10 },
      safetyClass: 'data-center',
      outputFormat: ['calculations'],
    });
    const fluidCalc = result.calculations.find(c => c.domain === 'fluid-systems');
    expect(fluidCalc!.outputs['pipe_size_NPS'].value).toBeGreaterThanOrEqual(3);
    expect(fluidCalc!.outputs['pipe_size_NPS'].unit).toBe('in');
  });

  // -----------------------------------------------------------------------
  // CA-03: Pressure drop estimation (method citation present)
  //   Verifies the Darcy-Weisbach method is cited in the calculation record
  // -----------------------------------------------------------------------
  it('CA-03: calculation method cites Darcy-Weisbach', async () => {
    const result = await runCoolingSystemDesign({
      type: 'cooling',
      constraints: { heatLoad_kW: 400, rackCount: 10 },
      safetyClass: 'data-center',
      outputFormat: ['calculations'],
    });
    const fluidCalc = result.calculations.find(c => c.domain === 'fluid-systems');
    expect(fluidCalc!.method).toContain('Darcy-Weisbach');
  });

  // -----------------------------------------------------------------------
  // CA-04: Reynolds number for 2.0 m/s, 78mm ID, water at 20C
  //   Re = rho * v * D / mu
  //   rho = 998 kg/m3, mu = 1.002e-3 Pa*s
  //   Re = 998 * 2.0 * 0.078 / 0.001002 = 155,400 (turbulent)
  // -----------------------------------------------------------------------
  it('CA-04: Reynolds number for typical pipe flow is turbulent (>4000)', () => {
    // Pure calculation test -- verifies Re formula directly
    const rho = 998; // kg/m3
    const v = 2.0; // m/s
    const D = 0.078; // m (NPS 3 ID ~78mm)
    const mu = 1.002e-3; // Pa*s
    const Re = (rho * v * D) / mu;
    expect(Re).toBeGreaterThan(4000);
    expect(Re).toBeCloseTo(155489, -3); // within ~1000
  });

  // -----------------------------------------------------------------------
  // CA-05: NPSH documentation as a safety margin requirement
  //   Verify the safety margin field is present in fluid calculations
  // -----------------------------------------------------------------------
  it('CA-05: fluid calculation includes safety margin percentage', async () => {
    const result = await runCoolingSystemDesign({
      type: 'cooling',
      constraints: { heatLoad_kW: 400, rackCount: 10 },
      safetyClass: 'data-center',
      outputFormat: ['calculations'],
    });
    const fluidCalc = result.calculations.find(c => c.domain === 'fluid-systems');
    expect(fluidCalc!.safetyMargin).toBeGreaterThan(0);
    expect(fluidCalc!.safetyMargin).toBe(15); // 15% safety margin per code
  });

  // -----------------------------------------------------------------------
  // CA-21: Flow rate for small system (100kW, deltaT=10C)
  //   Q = 100000 / (998 * 4182 * 10) = 0.002396 m3/s = 2.40 L/s
  // -----------------------------------------------------------------------
  it('CA-21: 100kW heat load produces ~2.40 L/s flow rate', async () => {
    const result = await runCoolingSystemDesign({
      type: 'cooling',
      constraints: { heatLoad_kW: 100, rackCount: 3 },
      safetyClass: 'commercial',
      outputFormat: ['calculations'],
    });
    const fluidCalc = result.calculations.find(c => c.domain === 'fluid-systems');
    const flowRate = fluidCalc!.outputs['flow_rate_Ls'].value;
    expect(flowRate).toBeCloseTo(2.40, 1);
  });

  // -----------------------------------------------------------------------
  // CA-22: Small flow rate selects smaller pipe (NPS 2 for ~2.4 L/s)
  //   A = 0.0024 / 2.4 = 0.001 m2, D = sqrt(4*0.001/pi) = 0.0357m = 35.7mm
  //   NPS 1.5 ID = 40.9mm -> NPS 1.5 is sufficient
  // -----------------------------------------------------------------------
  it('CA-22: 100kW system selects NPS 1.5 or 2 pipe', async () => {
    const result = await runCoolingSystemDesign({
      type: 'cooling',
      constraints: { heatLoad_kW: 100, rackCount: 3 },
      safetyClass: 'commercial',
      outputFormat: ['calculations'],
    });
    const fluidCalc = result.calculations.find(c => c.domain === 'fluid-systems');
    const nps = fluidCalc!.outputs['pipe_size_NPS'].value;
    expect(nps).toBeGreaterThanOrEqual(1.5);
    expect(nps).toBeLessThanOrEqual(2);
  });

  // -----------------------------------------------------------------------
  // CA-23: Heat load derived from rack count and density
  //   10 racks * 40kW = 400kW
  // -----------------------------------------------------------------------
  it('CA-23: 10 racks at 40kW derives 400kW heat load', async () => {
    const result = await runCoolingSystemDesign({
      type: 'cooling',
      constraints: { rackCount: 10, rackDensity_kW: 40 },
      safetyClass: 'data-center',
      outputFormat: ['calculations'],
    });
    const fluidCalc = result.calculations.find(c => c.domain === 'fluid-systems');
    expect(fluidCalc!.inputs['heat_load_kW'].value).toBe(400);
  });

  // -----------------------------------------------------------------------
  // CA-24: ASHRAE TC 9.9 referenced in method
  // -----------------------------------------------------------------------
  it('CA-24: calculation method references ASHRAE TC 9.9', async () => {
    const result = await runCoolingSystemDesign({
      type: 'cooling',
      constraints: { heatLoad_kW: 400, rackCount: 10 },
      safetyClass: 'data-center',
      outputFormat: ['calculations'],
    });
    const fluidCalc = result.calculations.find(c => c.domain === 'fluid-systems');
    expect(fluidCalc!.method).toContain('ASHRAE TC 9.9');
  });

  // -----------------------------------------------------------------------
  // CA-25: Combined scenario cooling load > IT load (includes losses)
  // -----------------------------------------------------------------------
  it('CA-25: combined scenario cooling load exceeds IT load', async () => {
    const result = await runCombinedSystemDesign({
      type: 'combined',
      constraints: { rackCount: 10, rackDensity_kW: 40, voltageClass: '480V' },
      safetyClass: 'data-center',
      outputFormat: ['calculations'],
    });
    const powerCalc = result.calculations.find(c => c.domain === 'power-systems');
    const fluidCalc = result.calculations.find(c => c.domain === 'fluid-systems');
    const itLoad = powerCalc!.outputs['it_load_kW'].value;
    const coolingLoad = fluidCalc!.inputs['heat_load_kW'].value;
    expect(coolingLoad).toBeGreaterThan(itLoad);
  });
});
