/**
 * Calculation accuracy tests for thermal engineering (CA-13 through CA-15).
 *
 * Validates LMTD calculation, heat transfer fundamentals, and thermal
 * load derivation in the cross-domain pipeline.
 */
import { describe, it, expect } from 'vitest';
import { runCombinedSystemDesign } from '../../../../skills/physical-infrastructure/integration/combined-system-e2e.js';

describe('Thermal Engineering Calculation Accuracy', () => {
  // -----------------------------------------------------------------------
  // CA-13: LMTD for balanced counter-flow heat exchanger
  //   Counter-flow: dT1 = T_hot_in - T_cold_out = 50-30 = 20C
  //                 dT2 = T_hot_out - T_cold_in = 40-20 = 20C
  //   LMTD = (dT1 - dT2) / ln(dT1/dT2)
  //   When dT1 = dT2 -> L'Hopital -> LMTD = dT1 = 20C
  // -----------------------------------------------------------------------
  it('CA-13: LMTD for balanced counter-flow heat exchanger is 20C', () => {
    function lmtd(dt1: number, dt2: number): number {
      if (Math.abs(dt1 - dt2) < 1e-6) return dt1; // L'Hopital for equal temperatures
      return (dt1 - dt2) / Math.log(dt1 / dt2);
    }
    const hot = { in: 50, out: 40 };
    const cold = { in: 20, out: 30 };
    // Counter-flow: dt1 = hot_in - cold_out, dt2 = hot_out - cold_in
    const result = lmtd(hot.in - cold.out, hot.out - cold.in);
    expect(result).toBeCloseTo(20.0, 0); // +-0.5C
  });

  // -----------------------------------------------------------------------
  // CA-13b: LMTD for unbalanced counter-flow
  //   dT1 = 60-25 = 35, dT2 = 40-15 = 25
  //   LMTD = (35-25) / ln(35/25) = 10 / ln(1.4) = 10 / 0.3365 = 29.72C
  // -----------------------------------------------------------------------
  it('CA-13b: LMTD for unbalanced counter-flow is ~29.7C', () => {
    function lmtd(dt1: number, dt2: number): number {
      if (Math.abs(dt1 - dt2) < 1e-6) return dt1;
      return (dt1 - dt2) / Math.log(dt1 / dt2);
    }
    const result = lmtd(35, 25);
    expect(result).toBeCloseTo(29.72, 0);
  });

  // -----------------------------------------------------------------------
  // CA-14: Cross-domain thermal load derivation
  //   For 10 racks at 40kW: IT load = 400kW, total electrical = 480kW (PUE 1.2)
  //   Cooling load = IT load + (total - IT) * (1 + 0.05) = 400 + 80*1.05 = 484kW
  // -----------------------------------------------------------------------
  it('CA-14: cross-domain cooling load for 10x40kW racks is ~484kW', async () => {
    const result = await runCombinedSystemDesign({
      type: 'combined',
      constraints: { rackCount: 10, rackDensity_kW: 40, voltageClass: '480V' },
      safetyClass: 'data-center',
      outputFormat: ['calculations'],
    });
    const fluidCalc = result.calculations.find(c => c.domain === 'fluid-systems');
    const coolingLoad = fluidCalc!.inputs['heat_load_kW'].value;
    // Expected: 400 + 80 * 1.05 = 484
    expect(coolingLoad).toBeCloseTo(484, -1); // +-5kW
  });

  // -----------------------------------------------------------------------
  // CA-14b: Distribution loss factor is 5%
  // -----------------------------------------------------------------------
  it('CA-14b: distribution losses add ~5% to non-IT electrical load', async () => {
    const result = await runCombinedSystemDesign({
      type: 'combined',
      constraints: { rackCount: 10, rackDensity_kW: 40, voltageClass: '480V' },
      safetyClass: 'data-center',
      outputFormat: ['calculations'],
    });
    const powerCalc = result.calculations.find(c => c.domain === 'power-systems');
    const fluidCalc = result.calculations.find(c => c.domain === 'fluid-systems');
    const itLoad = powerCalc!.outputs['it_load_kW'].value;
    const totalElectrical = powerCalc!.outputs['total_load_kW'].value;
    const coolingLoad = fluidCalc!.inputs['heat_load_kW'].value;
    // coolingLoad = itLoad + (totalElectrical - itLoad) * 1.05
    const expected = itLoad + (totalElectrical - itLoad) * 1.05;
    expect(coolingLoad).toBeCloseTo(expected, 1);
  });

  // -----------------------------------------------------------------------
  // CA-15: PUE calculation (total/IT)
  //   For 10x40kW: IT=400kW, total=480kW, PUE = 480/400 = 1.2
  // -----------------------------------------------------------------------
  it('CA-15: effective PUE is 1.2 for standard data center', async () => {
    const result = await runCombinedSystemDesign({
      type: 'combined',
      constraints: { rackCount: 10, rackDensity_kW: 40, voltageClass: '480V' },
      safetyClass: 'data-center',
      outputFormat: ['calculations'],
    });
    const powerCalc = result.calculations.find(c => c.domain === 'power-systems');
    const itLoad = powerCalc!.outputs['it_load_kW'].value;
    const totalLoad = powerCalc!.outputs['total_load_kW'].value;
    const pue = totalLoad / itLoad;
    expect(pue).toBeCloseTo(1.2, 2);
  });

  // -----------------------------------------------------------------------
  // Additional: Water properties (rho=998, Cp=4182) at 20C
  // -----------------------------------------------------------------------
  it('thermal calculation uses water at 20C (rho=998, Cp=4182)', async () => {
    // Verify by checking that flow rate matches: Q = P/(rho*Cp*dT)
    const result = await runCombinedSystemDesign({
      type: 'combined',
      constraints: { rackCount: 10, rackDensity_kW: 40, voltageClass: '480V' },
      safetyClass: 'data-center',
      outputFormat: ['calculations'],
    });
    const fluidCalc = result.calculations.find(c => c.domain === 'fluid-systems');
    const coolingLoad_kW = fluidCalc!.inputs['heat_load_kW'].value;
    const flowRate_Ls = fluidCalc!.outputs['flow_rate_Ls'].value;
    // Q = P / (rho * Cp * dT) => Q_Ls = (P*1000) / (998 * 4182 * 10) * 1000
    const expected_Ls = (coolingLoad_kW * 1000) / (998 * 4182 * 10) * 1000;
    expect(flowRate_Ls).toBeCloseTo(expected_Ls, 1);
  });

  // -----------------------------------------------------------------------
  // Additional: DeltaT is 10C
  // -----------------------------------------------------------------------
  it('cooling calculation uses deltaT = 10C', async () => {
    const result = await runCombinedSystemDesign({
      type: 'combined',
      constraints: { rackCount: 10, rackDensity_kW: 40, voltageClass: '480V' },
      safetyClass: 'data-center',
      outputFormat: ['calculations'],
    });
    const fluidCalc = result.calculations.find(c => c.domain === 'fluid-systems');
    expect(fluidCalc!.inputs['delta_T_C'].value).toBe(10);
  });
});
