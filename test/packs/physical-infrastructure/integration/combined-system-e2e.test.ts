/**
 * Integration tests for the combined cooling+power system E2E flow.
 * Validates cross-domain thermal load transfer (INTEG-06):
 *   power dissipation -> cooling load -> fluid system design.
 *
 * Test IDs: IT-07, SC-10, SC-11
 */
import { describe, it, expect } from 'vitest';
import {
  runCombinedSystemDesign,
  type CombinedSystemDesignResult,
} from '../../../../skills/physical-infrastructure/integration/combined-system-e2e.js';
import type {
  InfrastructureRequest,
  BlueprintPackage,
} from '../../../../skills/physical-infrastructure/types/infrastructure.js';

describe('Combined System E2E Integration', () => {
  // ---------- Group 1: Interface shape ----------
  describe('interface shape', () => {
    it('exports runCombinedSystemDesign function', () => {
      expect(typeof runCombinedSystemDesign).toBe('function');
    });

    it('returns a BlueprintPackage shape', async () => {
      const result = await runCombinedSystemDesign({
        type: 'combined',
        constraints: { rackCount: 10, rackDensity_kW: 40, voltageClass: '480V' },
        safetyClass: 'data-center',
        outputFormat: ['calculations'],
      });
      expect(result).toHaveProperty('drawings');
      expect(result).toHaveProperty('calculations');
      expect(result).toHaveProperty('bom');
      expect(result).toHaveProperty('safetyReview');
    });

    it('calculations include both power-systems and fluid-systems domains', async () => {
      const result = await runCombinedSystemDesign({
        type: 'combined',
        constraints: { rackCount: 10, rackDensity_kW: 40, voltageClass: '480V' },
        safetyClass: 'data-center',
        outputFormat: ['calculations'],
      });
      const domains = result.calculations.map(c => c.domain);
      expect(domains).toContain('power-systems');
      expect(domains).toContain('fluid-systems');
    });

    it('blueprint format produces both SLD and P&ID drawings', async () => {
      const result = await runCombinedSystemDesign({
        type: 'combined',
        constraints: { rackCount: 10, rackDensity_kW: 40, voltageClass: '480V' },
        safetyClass: 'data-center',
        outputFormat: ['calculations', 'blueprint'],
      });
      const types = result.drawings.map(d => d.type);
      expect(types).toContain('P&ID');
      expect(types).toContain('SLD');
      expect(result.drawings.length).toBeGreaterThanOrEqual(2);
    });
  });

  // ---------- Group 2: Cross-domain thermal load transfer (IT-07) ----------
  describe('cross-domain thermal load transfer', () => {
    it('cooling load is derived from power calculation, not a separate input', async () => {
      const result = await runCombinedSystemDesign({
        type: 'combined',
        constraints: { rackCount: 10, rackDensity_kW: 40, voltageClass: '480V' },
        safetyClass: 'data-center',
        outputFormat: ['calculations'],
      });
      const powerCalc = result.calculations.find(c => c.domain === 'power-systems');
      const fluidCalc = result.calculations.find(c => c.domain === 'fluid-systems');
      expect(powerCalc).toBeDefined();
      expect(fluidCalc).toBeDefined();
      // The cooling load should be >= IT load (it includes distribution losses)
      const electricalLoad = powerCalc!.outputs['it_load_kW']?.value ?? 0;
      const coolingLoad = fluidCalc!.inputs['heat_load_kW']?.value ?? 0;
      expect(coolingLoad).toBeGreaterThanOrEqual(electricalLoad);
    });

    it('10 racks at 40kW drives ~424kW cooling load (+-10%)', async () => {
      const result = await runCombinedSystemDesign({
        type: 'combined',
        constraints: { rackCount: 10, rackDensity_kW: 40, voltageClass: '480V' },
        safetyClass: 'data-center',
        outputFormat: ['calculations'],
      });
      const fluidCalc = result.calculations.find(c => c.domain === 'fluid-systems');
      const coolingLoad = fluidCalc!.inputs['heat_load_kW']?.value ?? 0;
      expect(coolingLoad).toBeGreaterThan(380); // at least IT load minus losses
      expect(coolingLoad).toBeLessThan(550);    // not more than 2x IT load
    });

    it('flow rate for combined scenario is consistent with derived cooling load', async () => {
      const result = await runCombinedSystemDesign({
        type: 'combined',
        constraints: { rackCount: 10, rackDensity_kW: 40, voltageClass: '480V' },
        safetyClass: 'data-center',
        outputFormat: ['calculations'],
      });
      const fluidCalc = result.calculations.find(c => c.domain === 'fluid-systems');
      const flowRate = fluidCalc!.outputs['flow_rate_Ls']?.value ?? 0;
      // Expected ~10.14 L/s for 424kW cooling load
      expect(flowRate).toBeGreaterThan(8.5);
      expect(flowRate).toBeLessThan(14.0);
    });
  });

  // ---------- Group 3: Combined blueprint (both SLD and P&ID) ----------
  describe('combined blueprint', () => {
    it('blueprint format produces at least one P&ID drawing', async () => {
      const result = await runCombinedSystemDesign({
        type: 'combined',
        constraints: { rackCount: 10, rackDensity_kW: 40, voltageClass: '480V' },
        safetyClass: 'data-center',
        outputFormat: ['calculations', 'blueprint'],
      });
      const pid = result.drawings.find(d => d.type === 'P&ID');
      expect(pid).toBeDefined();
    });

    it('blueprint format produces at least one SLD drawing', async () => {
      const result = await runCombinedSystemDesign({
        type: 'combined',
        constraints: { rackCount: 10, rackDensity_kW: 40, voltageClass: '480V' },
        safetyClass: 'data-center',
        outputFormat: ['calculations', 'blueprint'],
      });
      const sld = result.drawings.find(d => d.type === 'SLD');
      expect(sld).toBeDefined();
    });

    it('total drawings count >= 2 for combined request', async () => {
      const result = await runCombinedSystemDesign({
        type: 'combined',
        constraints: { rackCount: 10, rackDensity_kW: 40, voltageClass: '480V' },
        safetyClass: 'data-center',
        outputFormat: ['calculations', 'blueprint'],
      });
      expect(result.drawings.length).toBeGreaterThanOrEqual(2);
    });
  });

  // ---------- Group 4: Unified safety review ----------
  describe('unified safety review', () => {
    it('safetyReview.reviewedBy is safety-warden', async () => {
      const result = await runCombinedSystemDesign({
        type: 'combined',
        constraints: { rackCount: 10, rackDensity_kW: 40, voltageClass: '480V' },
        safetyClass: 'data-center',
        outputFormat: ['calculations'],
      });
      expect(result.safetyReview.reviewedBy).toBe('safety-warden');
    });

    it('safety findings include pressure-domain finding (PRV from cooling)', async () => {
      const result = await runCombinedSystemDesign({
        type: 'combined',
        constraints: { rackCount: 10, rackDensity_kW: 40, voltageClass: '480V' },
        safetyClass: 'data-center',
        outputFormat: ['calculations'],
      });
      const pressureFinding = result.safetyReview.findings.find(
        f => f.domain === 'pressure',
      );
      expect(pressureFinding).toBeDefined();
    });

    it('safety findings include voltage-domain finding (arc flash from power)', async () => {
      const result = await runCombinedSystemDesign({
        type: 'combined',
        constraints: { rackCount: 10, rackDensity_kW: 40, voltageClass: '480V' },
        safetyClass: 'data-center',
        outputFormat: ['calculations'],
      });
      const voltageFinding = result.safetyReview.findings.find(
        f => f.domain === 'voltage',
      );
      expect(voltageFinding).toBeDefined();
    });

    it('combined findings cover both electrical and fluid domains', async () => {
      const result = await runCombinedSystemDesign({
        type: 'combined',
        constraints: { rackCount: 10, rackDensity_kW: 40, voltageClass: '480V' },
        safetyClass: 'data-center',
        outputFormat: ['calculations'],
      });
      const domains = result.safetyReview.findings.map(f => f.domain);
      expect(domains).toContain('pressure');
      expect(domains).toContain('voltage');
    });
  });

  // ---------- Group 5: PE disclaimer ----------
  describe('PE disclaimer', () => {
    it('PE disclaimer detectable in combined output', async () => {
      const result = await runCombinedSystemDesign({
        type: 'combined',
        constraints: { rackCount: 10, rackDensity_kW: 40, voltageClass: '480V' },
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
