/**
 * Safety-critical mandatory-pass test suite (SC-01 through SC-22).
 *
 * These 22 tests validate the safety architecture of the Physical Infrastructure
 * Engineering Pack v1.48. ALL must pass with zero tolerance before milestone ships.
 *
 * Test categories:
 *   SC-01..SC-03   PE disclaimer verification
 *   SC-04..SC-06   Threshold blocking behavior
 *   SC-07..SC-09   Bypass resistance and configuration checks
 *   SC-10          PRV requirement for closed systems
 *   SC-11..SC-13   Electrical safety (arc flash, rapid shutdown, GFCI)
 *   SC-14..SC-15   Fluid safety (water hammer, glycol toxicity)
 *   SC-16          BESS thermal management + NFPA 855
 *   SC-17..SC-19   Redirect triggers (structural, MV, gas)
 *   SC-20..SC-21   Specialized safety (DTC leak, generator fuel)
 *   SC-22          Disclaimer non-removability (structural check)
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { runCoolingSystemDesign } from '../../../../skills/physical-infrastructure/integration/cooling-system-e2e.js';
import { runPowerDistributionDesign } from '../../../../skills/physical-infrastructure/integration/power-distribution-e2e.js';
import { runCombinedSystemDesign } from '../../../../skills/physical-infrastructure/integration/combined-system-e2e.js';
import type { InfrastructureRequest } from '../../../../skills/physical-infrastructure/types/infrastructure.js';

describe('Safety-Critical Mandatory-Pass Tests (SC-01 through SC-22)', () => {
  // -----------------------------------------------------------------------
  // SC-01: PE disclaimer on calculation output
  // -----------------------------------------------------------------------
  it('SC-01: PE disclaimer present on calculation output', async () => {
    const result = await runCoolingSystemDesign({
      type: 'cooling',
      constraints: { heatLoad_kW: 100 },
      safetyClass: 'commercial',
      outputFormat: ['calculations'],
    });
    const json = JSON.stringify(result);
    const hasDisclaimer =
      json.includes('Professional Engineer') ||
      json.includes('licensed PE') ||
      json.includes('ENGINEERING DISCLAIMER');
    expect(hasDisclaimer).toBe(true);
  });

  // -----------------------------------------------------------------------
  // SC-02: PE disclaimer on blueprint SVG
  // -----------------------------------------------------------------------
  it('SC-02: PE disclaimer present in blueprint SVG content', async () => {
    const result = await runCoolingSystemDesign({
      type: 'cooling',
      constraints: { heatLoad_kW: 400, rackCount: 10 },
      safetyClass: 'data-center',
      outputFormat: ['calculations', 'blueprint'],
    });
    const pid = result.drawings.find(d => d.type === 'P&ID');
    expect(pid).toBeDefined();
    const svgContent = pid!.content;
    const hasDisclaimer =
      svgContent.includes('VERIFY WITH LICENSED PE') ||
      svgContent.includes('AI GENERATED') ||
      svgContent.includes('Professional Engineer');
    expect(hasDisclaimer).toBe(true);
  });

  // -----------------------------------------------------------------------
  // SC-03: PE disclaimer on power distribution blueprint
  // -----------------------------------------------------------------------
  it('SC-03: PE disclaimer present in SLD blueprint content', async () => {
    const result = await runPowerDistributionDesign({
      type: 'power',
      constraints: { rackCount: 10, rackDensity_kW: 10, voltageClass: '480V' },
      safetyClass: 'data-center',
      outputFormat: ['calculations', 'blueprint'],
    });
    const sld = result.drawings.find(d => d.type === 'SLD');
    expect(sld).toBeDefined();
    const svgContent = sld!.content;
    const hasDisclaimer =
      svgContent.includes('VERIFY WITH LICENSED PE') ||
      svgContent.includes('AI GENERATED') ||
      svgContent.includes('Professional Engineer');
    expect(hasDisclaimer).toBe(true);
  });

  // -----------------------------------------------------------------------
  // SC-04: Safety warden blocks on critical pressure (200 PSI) in gate mode
  // -----------------------------------------------------------------------
  it('SC-04: safety warden blocks on critical pressure (200 PSI) in gate mode', async () => {
    const result = await runCoolingSystemDesign({
      type: 'cooling',
      constraints: { heatLoad_kW: 400, rackCount: 10, workingPressure_PSI: 200 } as any,
      safetyClass: 'industrial',
      outputFormat: ['calculations'],
    });
    const critical = result.safetyReview.findings.filter(
      f => f.severity === 'critical' || f.severity === 'blocking',
    );
    expect(critical.length).toBeGreaterThan(0);
    expect(critical.some(f => f.domain === 'pressure')).toBe(true);
  });

  // -----------------------------------------------------------------------
  // SC-05: Safety warden flags high voltage (480V AC)
  // -----------------------------------------------------------------------
  it('SC-05: safety warden flags 480V AC as arc flash hazard', async () => {
    const result = await runPowerDistributionDesign({
      type: 'power',
      constraints: { rackCount: 100, rackDensity_kW: 10, voltageClass: '480V' },
      safetyClass: 'data-center',
      outputFormat: ['calculations'],
    });
    const voltageFinding = result.safetyReview.findings.find(f => f.domain === 'voltage');
    expect(voltageFinding).toBeDefined();
    expect(voltageFinding!.description.toLowerCase()).toContain('arc flash');
  });

  // -----------------------------------------------------------------------
  // SC-06: Safety warden blocks on high pressure (350 PSI, blocking range)
  // -----------------------------------------------------------------------
  it('SC-06: safety warden blocks on 350 PSI (blocking threshold >300)', async () => {
    const result = await runCoolingSystemDesign({
      type: 'cooling',
      constraints: { heatLoad_kW: 400, rackCount: 10, workingPressure_PSI: 350 } as any,
      safetyClass: 'industrial',
      outputFormat: ['calculations'],
    });
    const blockingFindings = result.safetyReview.findings.filter(
      f => f.severity === 'blocking',
    );
    expect(blockingFindings.length).toBeGreaterThan(0);
    expect(result.safetyReview.status).toBe('blocked');
  });

  // -----------------------------------------------------------------------
  // SC-07: Chipset validates safety-warden presence in all team topologies
  // -----------------------------------------------------------------------
  it('SC-07: chipset validates safety-warden presence in all team topologies', () => {
    const chipsetPath = 'skills/physical-infrastructure/chipset.yaml';
    const chipsetContent = readFileSync(chipsetPath, 'utf8');
    expect(chipsetContent).toContain('warden_required_in_all_teams: true');
    expect(chipsetContent).toContain('warden_removal_raises_error: true');
    // Verify safety-warden appears in required_members for each team
    const requiredMembersBlocks = chipsetContent.match(/required_members:[\s\S]*?- safety-warden/g);
    expect(requiredMembersBlocks).not.toBeNull();
    expect(requiredMembersBlocks!.length).toBeGreaterThanOrEqual(3);
  });

  // -----------------------------------------------------------------------
  // SC-08: Industrial safety class always uses gate mode (blocked on critical)
  // -----------------------------------------------------------------------
  it('SC-08: industrial safety class uses gate mode (blocked on critical)', async () => {
    const result = await runCoolingSystemDesign({
      type: 'cooling',
      constraints: { heatLoad_kW: 400, rackCount: 10, workingPressure_PSI: 200 } as any,
      safetyClass: 'industrial',
      outputFormat: ['calculations'],
    });
    // Industrial + critical pressure finding -> must be blocked (gate mode)
    expect(result.safetyReview.status).toBe('blocked');
  });

  // -----------------------------------------------------------------------
  // SC-09: HITL gate requires human review on critical findings
  // -----------------------------------------------------------------------
  it('SC-09: blocked status has requiresHumanReview=true on critical findings', async () => {
    const result = await runCoolingSystemDesign({
      type: 'cooling',
      constraints: { heatLoad_kW: 400, rackCount: 10, workingPressure_PSI: 200 } as any,
      safetyClass: 'industrial',
      outputFormat: ['calculations'],
    });
    expect(result.safetyReview.status).toBe('blocked');
    const criticalFindings = result.safetyReview.findings.filter(
      f => f.severity === 'critical' || f.severity === 'blocking',
    );
    expect(criticalFindings.length).toBeGreaterThan(0);
    expect(criticalFindings.every(f => f.requiresHumanReview === true)).toBe(true);
  });

  // -----------------------------------------------------------------------
  // SC-10: PRV always recommended for closed cooling system
  // -----------------------------------------------------------------------
  it('SC-10: pressure relief valve recommended for closed cooling system', async () => {
    const result = await runCoolingSystemDesign({
      type: 'cooling',
      constraints: { heatLoad_kW: 100, rackCount: 3 },
      safetyClass: 'data-center',
      outputFormat: ['calculations'],
    });
    const prvFinding = result.safetyReview.findings.find(
      f =>
        f.description.toLowerCase().includes('relief') ||
        f.recommendation.toLowerCase().includes('relief'),
    );
    expect(prvFinding).toBeDefined();
  });

  // -----------------------------------------------------------------------
  // SC-11: 480V three-phase triggers arc flash warning
  // -----------------------------------------------------------------------
  it('SC-11: 480V three-phase triggers arc flash warning', async () => {
    const result = await runPowerDistributionDesign({
      type: 'power',
      constraints: { rackCount: 10, rackDensity_kW: 40, voltageClass: '480V' },
      safetyClass: 'data-center',
      outputFormat: ['calculations'],
    });
    const arcFinding = result.safetyReview.findings.find(
      f =>
        f.description.toLowerCase().includes('arc flash') ||
        f.recommendation.toLowerCase().includes('nfpa 70e'),
    );
    expect(arcFinding).toBeDefined();
  });

  // -----------------------------------------------------------------------
  // SC-12: Solar PV design includes NEC 690.12 rapid shutdown
  // -----------------------------------------------------------------------
  it('SC-12: solar PV design includes NEC 690.12 rapid shutdown requirement', async () => {
    const result = await runPowerDistributionDesign({
      type: 'power',
      constraints: {
        rackCount: 10,
        rackDensity_kW: 40,
        solarAvailable_m2: 500,
        voltageClass: '480V',
      },
      safetyClass: 'data-center',
      outputFormat: ['calculations'],
    });
    const shutdownFinding = result.safetyReview.findings.find(
      f =>
        f.description.includes('690.12') ||
        f.recommendation.includes('690.12') ||
        f.description.toLowerCase().includes('rapid shutdown'),
    );
    expect(shutdownFinding).toBeDefined();
  });

  // -----------------------------------------------------------------------
  // SC-13: GFCI for residential wet locations (safety warden agent rule)
  // -----------------------------------------------------------------------
  it('SC-13: safety warden agent definition specifies GFCI for residential wet locations', () => {
    const wardenContent = readFileSync(
      'skills/physical-infrastructure/agents/safety-warden.md',
      'utf8',
    );
    expect(wardenContent).toContain('GFCI');
    expect(wardenContent).toContain('NEC 210.8');
  });

  // -----------------------------------------------------------------------
  // SC-14: Water hammer prevention specified in safety warden rules
  // -----------------------------------------------------------------------
  it('SC-14: safety warden agent definition includes water hammer prevention', () => {
    const wardenContent = readFileSync(
      'skills/physical-infrastructure/agents/safety-warden.md',
      'utf8',
    );
    expect(wardenContent.toLowerCase()).toContain('water hammer');
    expect(wardenContent.toLowerCase()).toContain('quick-closing');
  });

  // -----------------------------------------------------------------------
  // SC-15: Glycol toxicity warning in safety warden rules
  // -----------------------------------------------------------------------
  it('SC-15: safety warden agent definition includes glycol toxicity warning', () => {
    const wardenContent = readFileSync(
      'skills/physical-infrastructure/agents/safety-warden.md',
      'utf8',
    );
    expect(wardenContent.toLowerCase()).toContain('ethylene glycol');
    expect(wardenContent.toLowerCase()).toContain('propylene glycol');
    expect(wardenContent.toLowerCase()).toContain('toxicity');
  });

  // -----------------------------------------------------------------------
  // SC-16: Lithium BESS requires thermal management + NFPA 855
  // -----------------------------------------------------------------------
  it('SC-16: lithium BESS design includes thermal management and NFPA 855', async () => {
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
    const bessFinding = result.safetyReview.findings.find(
      f =>
        f.description.includes('NFPA 855') ||
        f.recommendation.includes('NFPA 855') ||
        f.description.toLowerCase().includes('thermal management'),
    );
    expect(bessFinding).toBeDefined();
  });

  // -----------------------------------------------------------------------
  // SC-17: Redirect on structural for occupied buildings (agent definition)
  // -----------------------------------------------------------------------
  it('SC-17: safety warden redirect trigger covers structural for occupied buildings', () => {
    const wardenContent = readFileSync(
      'skills/physical-infrastructure/agents/safety-warden.md',
      'utf8',
    );
    expect(wardenContent).toContain('Structural engineering for occupied buildings');
    expect(wardenContent.toLowerCase()).toContain('redirect');
  });

  // -----------------------------------------------------------------------
  // SC-18: Redirect on medium voltage (>600V AC, agent definition)
  // -----------------------------------------------------------------------
  it('SC-18: safety warden redirect trigger covers medium voltage systems', () => {
    const wardenContent = readFileSync(
      'skills/physical-infrastructure/agents/safety-warden.md',
      'utf8',
    );
    expect(wardenContent).toContain('Medium voltage or high voltage systems');
    expect(wardenContent).toContain('above 600V AC');
  });

  // -----------------------------------------------------------------------
  // SC-19: Redirect on pressurized gas systems (agent definition)
  // -----------------------------------------------------------------------
  it('SC-19: safety warden redirect trigger covers pressurized gas systems', () => {
    const wardenContent = readFileSync(
      'skills/physical-infrastructure/agents/safety-warden.md',
      'utf8',
    );
    expect(wardenContent).toContain('Pressurized gas systems');
    expect(wardenContent.toLowerCase()).toContain('compressed air');
  });

  // -----------------------------------------------------------------------
  // SC-20: Leak containment for direct-to-chip cooling (agent definition)
  // -----------------------------------------------------------------------
  it('SC-20: safety warden agent definition requires DTC leak containment', () => {
    const wardenContent = readFileSync(
      'skills/physical-infrastructure/agents/safety-warden.md',
      'utf8',
    );
    expect(wardenContent.toLowerCase()).toContain('direct-to-chip');
    expect(wardenContent.toLowerCase()).toContain('leak');
    expect(wardenContent.toLowerCase()).toContain('containment');
  });

  // -----------------------------------------------------------------------
  // SC-21: Generator fuel safety (agent definition)
  // -----------------------------------------------------------------------
  it('SC-21: safety warden agent definition requires generator fuel safety', () => {
    const wardenContent = readFileSync(
      'skills/physical-infrastructure/agents/safety-warden.md',
      'utf8',
    );
    expect(wardenContent.toLowerCase()).toContain('generator');
    expect(wardenContent.toLowerCase()).toContain('spill containment');
    expect(wardenContent.toLowerCase()).toContain('ventilation');
  });

  // -----------------------------------------------------------------------
  // SC-22: Disclaimer non-removable (structural check)
  // -----------------------------------------------------------------------
  it('SC-22: disclaimer is embedded in output structure, not optional metadata', async () => {
    const result = await runCoolingSystemDesign({
      type: 'cooling',
      constraints: { heatLoad_kW: 100 },
      safetyClass: 'residential',
      outputFormat: ['calculations'],
    });
    // safetyReview.reviewedBy must always be 'safety-warden'
    expect(result.safetyReview.reviewedBy).toBe('safety-warden');
    // timestamp always populated
    expect(result.safetyReview.timestamp).toBeTruthy();
    // findings always an array (may be empty)
    expect(Array.isArray(result.safetyReview.findings)).toBe(true);
    // PE disclaimer is in the findings as a structural element
    const disclaimerFinding = result.safetyReview.findings.find(
      f => f.description.includes('ENGINEERING DISCLAIMER'),
    );
    expect(disclaimerFinding).toBeDefined();
    expect(disclaimerFinding!.severity).toBe('info');
    expect(disclaimerFinding!.requiresHumanReview).toBe(true);
  });
});
