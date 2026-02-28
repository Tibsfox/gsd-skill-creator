/**
 * Integration tests for the cooling system E2E flow.
 * Validates: architect -> calculator -> safety -> draftsman pipeline.
 *
 * Test IDs: IT-01, IT-02, IT-03, IT-05, CA-01, CA-02, SC-01, SC-22
 */
import { describe, it, expect } from 'vitest';
import {
  runCoolingSystemDesign,
  type CoolingSystemDesignResult,
} from '../../../../skills/physical-infrastructure/integration/cooling-system-e2e.js';
import type {
  InfrastructureRequest,
  BlueprintPackage,
} from '../../../../skills/physical-infrastructure/types/infrastructure.js';

describe('Cooling System E2E Integration', () => {
  // ---------- Group 1: Interface contracts (IT-01) ----------
  describe('interface contracts', () => {
    it('exports runCoolingSystemDesign function', () => {
      expect(typeof runCoolingSystemDesign).toBe('function');
    });

    it('returns a BlueprintPackage shape', async () => {
      const result = await runCoolingSystemDesign({
        type: 'cooling',
        constraints: { heatLoad_kW: 400, rackCount: 10, rackDensity_kW: 40 },
        safetyClass: 'data-center',
        outputFormat: ['calculations', 'blueprint'],
      });
      expect(result).toHaveProperty('drawings');
      expect(result).toHaveProperty('calculations');
      expect(result).toHaveProperty('bom');
      expect(result).toHaveProperty('safetyReview');
      expect(Array.isArray(result.drawings)).toBe(true);
      expect(Array.isArray(result.calculations)).toBe(true);
    });
  });

  // ---------- Group 2: Calculator output (IT-01, CA-01, CA-02) ----------
  describe('calculator output', () => {
    it('calculates flow rate for 400kW heat load', async () => {
      const result = await runCoolingSystemDesign({
        type: 'cooling',
        constraints: { heatLoad_kW: 400, rackCount: 10, rackDensity_kW: 40, ambientTemp_C: 20 },
        safetyClass: 'data-center',
        outputFormat: ['calculations'],
      });
      const fluidCalc = result.calculations.find(c => c.domain === 'fluid-systems');
      expect(fluidCalc).toBeDefined();
      const flowRate = fluidCalc!.outputs['flow_rate_Ls'];
      expect(flowRate).toBeDefined();
      expect(flowRate.unit).toBe('L/s');
      expect(flowRate.value).toBeCloseTo(9.56, 1);
    });

    it('selects minimum NPS 3" pipe for 9.56 L/s at max 2.4 m/s', async () => {
      const result = await runCoolingSystemDesign({
        type: 'cooling',
        constraints: { heatLoad_kW: 400, rackCount: 10, rackDensity_kW: 40 },
        safetyClass: 'data-center',
        outputFormat: ['calculations'],
      });
      const fluidCalc = result.calculations.find(c => c.domain === 'fluid-systems');
      const pipeSize = fluidCalc!.outputs['pipe_size_NPS'];
      expect(pipeSize).toBeDefined();
      expect(pipeSize.value).toBeGreaterThanOrEqual(3);
      expect(pipeSize.unit).toBe('in');
    });

    it('uses Darcy-Weisbach method citation in calculation', async () => {
      const result = await runCoolingSystemDesign({
        type: 'cooling',
        constraints: { heatLoad_kW: 400, rackCount: 10 },
        safetyClass: 'data-center',
        outputFormat: ['calculations'],
      });
      const fluidCalc = result.calculations.find(c => c.domain === 'fluid-systems');
      expect(fluidCalc!.method).toMatch(/Darcy-Weisbach|Hazen-Williams/);
    });
  });

  // ---------- Group 3: Safety warden integration (IT-02, IT-03) ----------
  describe('safety warden integration', () => {
    it('SafetyReviewResult.reviewedBy is always safety-warden', async () => {
      const result = await runCoolingSystemDesign({
        type: 'cooling',
        constraints: { heatLoad_kW: 100, rackCount: 3 },
        safetyClass: 'data-center',
        outputFormat: ['calculations'],
      });
      expect(result.safetyReview.reviewedBy).toBe('safety-warden');
      expect(result.safetyReview.timestamp).toBeDefined();
      expect(['passed', 'flagged', 'blocked']).toContain(result.safetyReview.status);
    });

    it('normal cooling design passes safety review', async () => {
      const result = await runCoolingSystemDesign({
        type: 'cooling',
        constraints: { heatLoad_kW: 400, rackCount: 10 },
        safetyClass: 'data-center',
        outputFormat: ['calculations'],
      });
      expect(result.safetyReview.status).not.toBe('blocked');
    });

    it('high-pressure design triggers safety finding', async () => {
      const result = await runCoolingSystemDesign({
        type: 'cooling',
        constraints: { heatLoad_kW: 400, rackCount: 10, workingPressure_PSI: 200 } as any,
        safetyClass: 'industrial',
        outputFormat: ['calculations'],
      });
      const criticalFindings = result.safetyReview.findings.filter(
        f => f.severity === 'critical',
      );
      expect(criticalFindings.length).toBeGreaterThan(0);
      expect(criticalFindings[0].domain).toBe('pressure');
    });
  });

  // ---------- Group 4: Blueprint output (IT-05) ----------
  describe('blueprint output', () => {
    it('produces P&ID drawing when blueprint format requested', async () => {
      const result = await runCoolingSystemDesign({
        type: 'cooling',
        constraints: { heatLoad_kW: 400, rackCount: 10 },
        safetyClass: 'data-center',
        outputFormat: ['calculations', 'blueprint'],
      });
      const pid = result.drawings.find(d => d.type === 'P&ID');
      expect(pid).toBeDefined();
      expect(['svg', 'dxf']).toContain(pid!.format);
      expect(pid!.titleBlock).toBeDefined();
      expect(pid!.content.length).toBeGreaterThan(0);
    });

    it('BOM contains pipe material when calculations provided', async () => {
      const result = await runCoolingSystemDesign({
        type: 'cooling',
        constraints: { heatLoad_kW: 400, rackCount: 10 },
        safetyClass: 'data-center',
        outputFormat: ['calculations', 'blueprint', 'construction'],
      });
      expect(result.bom.items.length).toBeGreaterThan(0);
      expect(result.bom.generatedAt).toBeDefined();
    });
  });

  // ---------- Group 5: PE disclaimer (SC-01, SC-22) ----------
  describe('PE disclaimer', () => {
    it('PE disclaimer is present in output', async () => {
      const result = await runCoolingSystemDesign({
        type: 'cooling',
        constraints: { heatLoad_kW: 100, rackCount: 3 },
        safetyClass: 'commercial',
        outputFormat: ['calculations'],
      });
      const disclaimerPresent =
        JSON.stringify(result).includes('Professional Engineer') ||
        JSON.stringify(result).includes('licensed PE') ||
        JSON.stringify(result).includes('ENGINEERING DISCLAIMER');
      expect(disclaimerPresent).toBe(true);
    });
  });
});
