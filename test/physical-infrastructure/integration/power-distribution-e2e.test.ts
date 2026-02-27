/**
 * Integration tests for the power distribution E2E flow.
 * Validates: NEC Article 220 load calc, NEC 310.16 conductor sizing,
 * NEC 690 solar PV, BESS sizing, arc flash, and SLD blueprint generation.
 *
 * Test IDs: IT-02, IT-06, CA-06, CA-07, CA-09, CA-11, CA-12, SC-11, SC-12, SC-16
 */
import { describe, it, expect } from 'vitest';
import {
  runPowerDistributionDesign,
  type PowerDistributionDesignResult,
} from '../../../skills/physical-infrastructure/integration/power-distribution-e2e.js';
import type {
  InfrastructureRequest,
  BlueprintPackage,
} from '../../../skills/physical-infrastructure/types/infrastructure.js';

describe('Power Distribution E2E Integration', () => {
  // ---------- Group 1: Function interface ----------
  describe('function interface', () => {
    it('exports runPowerDistributionDesign function', () => {
      expect(typeof runPowerDistributionDesign).toBe('function');
    });

    it('returns BlueprintPackage shape', async () => {
      const result = await runPowerDistributionDesign({
        type: 'power',
        constraints: { rackCount: 10, rackDensity_kW: 10, voltageClass: '480V' },
        safetyClass: 'data-center',
        outputFormat: ['calculations'],
      });
      expect(result).toHaveProperty('drawings');
      expect(result).toHaveProperty('calculations');
      expect(result).toHaveProperty('bom');
      expect(result).toHaveProperty('safetyReview');
      expect(Array.isArray(result.calculations)).toBe(true);
    });
  });

  // ---------- Group 2: NEC load calculations (CA-06, CA-09) ----------
  describe('NEC load calculations', () => {
    it('100 racks x 10kW produces IT load of 1000kW', async () => {
      const result = await runPowerDistributionDesign({
        type: 'power',
        constraints: { rackCount: 100, rackDensity_kW: 10, voltageClass: '480V' },
        safetyClass: 'data-center',
        outputFormat: ['calculations'],
      });
      const powerCalc = result.calculations.find(c => c.domain === 'power-systems');
      expect(powerCalc).toBeDefined();
      expect(powerCalc!.outputs['it_load_kW'].value).toBe(1000);
    });

    it('transformer sizing produces kVA >= 1111 for 1000kW / 0.9 PF', async () => {
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

    it('NEC 220 is cited in the method field', async () => {
      const result = await runPowerDistributionDesign({
        type: 'power',
        constraints: { rackCount: 10, rackDensity_kW: 10, voltageClass: '480V' },
        safetyClass: 'data-center',
        outputFormat: ['calculations'],
      });
      const powerCalc = result.calculations.find(c => c.domain === 'power-systems');
      expect(powerCalc!.method).toMatch(/NEC.*220|Article 220/);
    });

    it('conductor sizing cites NEC 310.16', async () => {
      const result = await runPowerDistributionDesign({
        type: 'power',
        constraints: { rackCount: 10, rackDensity_kW: 10, voltageClass: '480V' },
        safetyClass: 'data-center',
        outputFormat: ['calculations'],
      });
      const powerCalc = result.calculations.find(c => c.domain === 'power-systems');
      expect(powerCalc!.method).toMatch(/NEC.*310\.16|Table 310\.16/);
    });
  });

  // ---------- Group 3: Solar PV scenario (CA-11, SC-12) ----------
  describe('solar PV scenario', () => {
    it('solar request with solarAvailable_m2 > 0 produces solar_kWp output', async () => {
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
      expect(solarCalc!.outputs['solar_kWp']).toBeDefined();
      expect(solarCalc!.outputs['solar_kWp'].value).toBeGreaterThan(0);
    });

    it('NEC 690.12 rapid shutdown is in the safety findings', async () => {
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
      const rapidShutdown = result.safetyReview.findings.find(
        f => f.description.includes('690.12') || f.description.includes('Rapid Shutdown'),
      );
      expect(rapidShutdown).toBeDefined();
    });
  });

  // ---------- Group 4: BESS scenario (CA-12, SC-16) ----------
  describe('BESS scenario', () => {
    it('request with batteryRuntime_min > 0 produces BESS capacity in kWh', async () => {
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
      expect(bessCalc!.outputs['bess_capacity_kWh']).toBeDefined();
    });

    it('500kW, 30min, 85% DoD, 90% eff produces ~327 kWh (+-5%)', async () => {
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
      const capacity = bessCalc!.outputs['bess_capacity_kWh'].value;
      // Expected: (500 * 30/60) / (0.85 * 0.90) = 250 / 0.765 ~= 326.8
      expect(capacity).toBeGreaterThan(310);
      expect(capacity).toBeLessThan(345);
    });

    it('NFPA 855 reference appears in safety findings', async () => {
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
      const nfpa855 = result.safetyReview.findings.find(
        f => f.description.includes('NFPA 855') || f.recommendation.includes('NFPA 855'),
      );
      expect(nfpa855).toBeDefined();
    });

    it('thermal management requirement appears in safety findings', async () => {
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
      const thermalMgmt = result.safetyReview.findings.find(
        f =>
          f.description.includes('thermal management') ||
          f.recommendation.includes('thermal management'),
      );
      expect(thermalMgmt).toBeDefined();
    });
  });

  // ---------- Group 5: Arc flash (SC-11) ----------
  describe('arc flash warning', () => {
    it('480V three-phase design triggers arc flash warning', async () => {
      const result = await runPowerDistributionDesign({
        type: 'power',
        constraints: { rackCount: 10, rackDensity_kW: 10, voltageClass: '480V' },
        safetyClass: 'data-center',
        outputFormat: ['calculations'],
      });
      const arcFlash = result.safetyReview.findings.find(
        f => f.description.includes('Arc flash') || f.description.includes('arc flash'),
      );
      expect(arcFlash).toBeDefined();
    });

    it('cal/cm2 value appears in finding', async () => {
      const result = await runPowerDistributionDesign({
        type: 'power',
        constraints: { rackCount: 10, rackDensity_kW: 10, voltageClass: '480V' },
        safetyClass: 'data-center',
        outputFormat: ['calculations'],
      });
      const arcFlash = result.safetyReview.findings.find(
        f => f.description.includes('Arc flash') || f.description.includes('arc flash'),
      );
      const hasCalCm2 =
        arcFlash!.description.includes('cal/cm') ||
        arcFlash!.threshold.includes('cal/cm') ||
        arcFlash!.recommendation.includes('cal/cm');
      expect(hasCalCm2).toBe(true);
    });
  });

  // ---------- Group 6: SLD blueprint (IT-06) ----------
  describe('SLD blueprint', () => {
    it('power request with blueprint format produces SLD drawing', async () => {
      const result = await runPowerDistributionDesign({
        type: 'power',
        constraints: { rackCount: 10, rackDensity_kW: 10, voltageClass: '480V' },
        safetyClass: 'data-center',
        outputFormat: ['calculations', 'blueprint'],
      });
      const sld = result.drawings.find(d => d.type === 'SLD');
      expect(sld).toBeDefined();
      expect(sld!.format).toBe('svg');
    });

    it('SLD title block is populated', async () => {
      const result = await runPowerDistributionDesign({
        type: 'power',
        constraints: { rackCount: 10, rackDensity_kW: 10, voltageClass: '480V' },
        safetyClass: 'data-center',
        outputFormat: ['calculations', 'blueprint'],
      });
      const sld = result.drawings.find(d => d.type === 'SLD');
      expect(sld!.titleBlock).toBeDefined();
      expect(sld!.titleBlock.projectName).toBeDefined();
    });
  });

  // ---------- Group 7: Safety warden always present ----------
  describe('safety warden provenance', () => {
    it('safetyReview.reviewedBy is always safety-warden', async () => {
      const result = await runPowerDistributionDesign({
        type: 'power',
        constraints: { rackCount: 10, rackDensity_kW: 10, voltageClass: '480V' },
        safetyClass: 'data-center',
        outputFormat: ['calculations'],
      });
      expect(result.safetyReview.reviewedBy).toBe('safety-warden');
    });

    it('safetyReview.timestamp is a valid ISO string', async () => {
      const result = await runPowerDistributionDesign({
        type: 'power',
        constraints: { rackCount: 10, rackDensity_kW: 10, voltageClass: '480V' },
        safetyClass: 'data-center',
        outputFormat: ['calculations'],
      });
      expect(result.safetyReview.timestamp).toBeDefined();
      expect(new Date(result.safetyReview.timestamp).toISOString()).toBe(
        result.safetyReview.timestamp,
      );
    });

    it('PE disclaimer present in output', async () => {
      const result = await runPowerDistributionDesign({
        type: 'power',
        constraints: { rackCount: 10, rackDensity_kW: 10, voltageClass: '480V' },
        safetyClass: 'data-center',
        outputFormat: ['calculations'],
      });
      const json = JSON.stringify(result);
      const hasDisclaimer =
        json.includes('Professional Engineer') ||
        json.includes('licensed PE') ||
        json.includes('ENGINEERING DISCLAIMER');
      expect(hasDisclaimer).toBe(true);
    });
  });
});
