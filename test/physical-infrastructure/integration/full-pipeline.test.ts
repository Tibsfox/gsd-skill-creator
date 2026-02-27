/**
 * Full pipeline integration tests (IT-01 through IT-18).
 *
 * Consolidates and extends the integration test coverage from phases 443-01,
 * 443-02, 443-03. Tests the complete architect -> calculator -> safety ->
 * draftsman pipeline for all three scenarios: cooling, power, combined.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { runCoolingSystemDesign } from '../../../skills/physical-infrastructure/integration/cooling-system-e2e.js';
import { runPowerDistributionDesign } from '../../../skills/physical-infrastructure/integration/power-distribution-e2e.js';
import { runCombinedSystemDesign } from '../../../skills/physical-infrastructure/integration/combined-system-e2e.js';

describe('Full Pipeline Integration Tests (IT-01 through IT-18)', () => {
  // -----------------------------------------------------------------------
  // IT-01: Cooling pipeline produces complete BlueprintPackage
  // -----------------------------------------------------------------------
  it('IT-01: cooling pipeline produces complete BlueprintPackage', async () => {
    const result = await runCoolingSystemDesign({
      type: 'cooling',
      constraints: { heatLoad_kW: 400, rackCount: 10, rackDensity_kW: 40 },
      safetyClass: 'data-center',
      outputFormat: ['calculations', 'blueprint', 'construction'],
    });
    expect(result.calculations.length).toBeGreaterThan(0);
    expect(result.drawings.length).toBeGreaterThan(0);
    expect(result.bom.items.length).toBeGreaterThan(0);
    expect(result.safetyReview.reviewedBy).toBe('safety-warden');
  });

  // -----------------------------------------------------------------------
  // IT-02: Power pipeline produces complete BlueprintPackage
  // -----------------------------------------------------------------------
  it('IT-02: power pipeline produces complete BlueprintPackage', async () => {
    const result = await runPowerDistributionDesign({
      type: 'power',
      constraints: { rackCount: 100, rackDensity_kW: 10, voltageClass: '480V' },
      safetyClass: 'data-center',
      outputFormat: ['calculations', 'blueprint'],
    });
    expect(result.calculations.length).toBeGreaterThan(0);
    expect(result.drawings.length).toBeGreaterThan(0);
    expect(result.safetyReview.reviewedBy).toBe('safety-warden');
  });

  // -----------------------------------------------------------------------
  // IT-03: Safety warden always in the pipeline (cooling)
  // -----------------------------------------------------------------------
  it('IT-03: safety warden review always present in cooling output', async () => {
    const result = await runCoolingSystemDesign({
      type: 'cooling',
      constraints: { heatLoad_kW: 50, rackCount: 2 },
      safetyClass: 'residential',
      outputFormat: ['calculations'],
    });
    expect(result.safetyReview).toBeDefined();
    expect(result.safetyReview.reviewedBy).toBe('safety-warden');
    expect(result.safetyReview.timestamp).toBeTruthy();
  });

  // -----------------------------------------------------------------------
  // IT-04: Safety warden always in the pipeline (power)
  // -----------------------------------------------------------------------
  it('IT-04: safety warden review always present in power output', async () => {
    const result = await runPowerDistributionDesign({
      type: 'power',
      constraints: { rackCount: 5, rackDensity_kW: 10, voltageClass: '208V' },
      safetyClass: 'commercial',
      outputFormat: ['calculations'],
    });
    expect(result.safetyReview).toBeDefined();
    expect(result.safetyReview.reviewedBy).toBe('safety-warden');
  });

  // -----------------------------------------------------------------------
  // IT-05: Blueprint output matches calculation domain
  // -----------------------------------------------------------------------
  it('IT-05: cooling blueprint produces P&ID, not SLD', async () => {
    const result = await runCoolingSystemDesign({
      type: 'cooling',
      constraints: { heatLoad_kW: 400, rackCount: 10 },
      safetyClass: 'data-center',
      outputFormat: ['calculations', 'blueprint'],
    });
    const drawingTypes = result.drawings.map(d => d.type);
    expect(drawingTypes).toContain('P&ID');
    expect(drawingTypes).not.toContain('SLD');
  });

  // -----------------------------------------------------------------------
  // IT-06: Power blueprint produces SLD
  // -----------------------------------------------------------------------
  it('IT-06: power blueprint produces SLD, not P&ID', async () => {
    const result = await runPowerDistributionDesign({
      type: 'power',
      constraints: { rackCount: 10, rackDensity_kW: 10, voltageClass: '480V' },
      safetyClass: 'data-center',
      outputFormat: ['calculations', 'blueprint'],
    });
    const drawingTypes = result.drawings.map(d => d.type);
    expect(drawingTypes).toContain('SLD');
    expect(drawingTypes).not.toContain('P&ID');
  });

  // -----------------------------------------------------------------------
  // IT-07: Combined pipeline produces both domains in calculations
  // -----------------------------------------------------------------------
  it('IT-07: combined pipeline includes power-systems and fluid-systems domains', async () => {
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

  // -----------------------------------------------------------------------
  // IT-08: Simulation bridge OpenFOAM template exists
  //   Tests that the OpenFOAM template files are accessible
  // -----------------------------------------------------------------------
  it('IT-08: OpenFOAM template files exist in simulation-bridge', () => {
    const basePath = 'skills/physical-infrastructure/skills/simulation-bridge/references/openfoam-templates';
    const templates = ['data-center-airflow.yaml', 'pipe-flow-pressure-drop.yaml', 'heat-exchanger-performance.yaml'];
    for (const template of templates) {
      const content = readFileSync(`${basePath}/${template}`, 'utf8');
      expect(content.length).toBeGreaterThan(0);
      expect(content).toContain('OpenFOAM');
    }
  });

  // -----------------------------------------------------------------------
  // IT-09: React artifact templates exist and are valid
  //   Tests that artifact template files contain React code patterns
  // -----------------------------------------------------------------------
  it('IT-09: React artifact templates contain React.useState patterns', () => {
    const basePath = 'skills/physical-infrastructure/skills/simulation-bridge/references/artifact-templates';
    const templates = [
      'pipe-network-calculator.tsx',
      'electrical-load-balancer.tsx',
      'thermal-comfort-map.tsx',
      'solar-array-sizer.tsx',
    ];
    for (const template of templates) {
      const content = readFileSync(`${basePath}/${template}`, 'utf8');
      expect(content).toContain('React.useState');
    }
  });

  // -----------------------------------------------------------------------
  // IT-10: P&ID symbols library exists with ISA-5.1 coverage
  // -----------------------------------------------------------------------
  it('IT-10: P&ID symbols library has ISA-5.1 symbols in PID_SYMBOLS record', () => {
    const symbolsPath = 'skills/physical-infrastructure/skills/blueprint-engine/references/symbols/symbols-pid.ts';
    const content = readFileSync(symbolsPath, 'utf8');
    // Symbols stored as PID_SYMBOLS record entries
    expect(content).toContain('PID_SYMBOLS');
    expect(content).toContain('ISA-5.1');
    // Count symbol entries (id: 'xxx' patterns in the record)
    const symbolEntries = (content.match(/id:\s*'/g) || []).length;
    expect(symbolEntries).toBeGreaterThanOrEqual(40); // At least 40 symbol definitions
  });

  // -----------------------------------------------------------------------
  // IT-11: Chipset routing -- architect-agent is entry point
  // -----------------------------------------------------------------------
  it('IT-11: chipset.yaml has architect-agent as entry point', () => {
    const chipsetContent = readFileSync('skills/physical-infrastructure/chipset.yaml', 'utf8');
    expect(chipsetContent).toContain('entry_point: architect-agent');
    expect(chipsetContent).toContain('default_agent: architect-agent');
  });

  // -----------------------------------------------------------------------
  // IT-12: Chipset defines all 6 agents
  // -----------------------------------------------------------------------
  it('IT-12: chipset.yaml defines all 6 agents', () => {
    const chipsetContent = readFileSync('skills/physical-infrastructure/chipset.yaml', 'utf8');
    const agents = [
      'architect-agent',
      'calculator-agent',
      'draftsman-agent',
      'simulator-agent',
      'renderer-agent',
      'safety-warden',
    ];
    for (const agent of agents) {
      expect(chipsetContent).toContain(agent);
    }
  });

  // -----------------------------------------------------------------------
  // IT-13: Chipset defines 3 team topologies
  // -----------------------------------------------------------------------
  it('IT-13: chipset.yaml defines design-review, rapid-prototype, construction-package teams', () => {
    const chipsetContent = readFileSync('skills/physical-infrastructure/chipset.yaml', 'utf8');
    expect(chipsetContent).toContain('design-review:');
    expect(chipsetContent).toContain('rapid-prototype:');
    expect(chipsetContent).toContain('construction-package:');
  });

  // -----------------------------------------------------------------------
  // IT-14: Safety warden uses Opus model
  // -----------------------------------------------------------------------
  it('IT-14: safety-warden uses claude-opus model per chipset', () => {
    const chipsetContent = readFileSync('skills/physical-infrastructure/chipset.yaml', 'utf8');
    // Find the safety-warden agent block
    const wardenIndex = chipsetContent.indexOf('safety-warden:');
    expect(wardenIndex).toBeGreaterThan(-1);
    const wardenSection = chipsetContent.substring(wardenIndex, wardenIndex + 200);
    expect(wardenSection).toContain('claude-opus');
  });

  // -----------------------------------------------------------------------
  // IT-15: Calculation records have all required fields
  // -----------------------------------------------------------------------
  it('IT-15: CalculationRecord has domain, inputs, outputs, method, safetyMargin', async () => {
    const result = await runCoolingSystemDesign({
      type: 'cooling',
      constraints: { heatLoad_kW: 400, rackCount: 10 },
      safetyClass: 'data-center',
      outputFormat: ['calculations'],
    });
    for (const calc of result.calculations) {
      expect(calc.domain).toBeTruthy();
      expect(typeof calc.inputs).toBe('object');
      expect(typeof calc.outputs).toBe('object');
      expect(calc.method).toBeTruthy();
      expect(typeof calc.safetyMargin).toBe('number');
    }
  });

  // -----------------------------------------------------------------------
  // IT-16: UnitValue fields have value and unit
  // -----------------------------------------------------------------------
  it('IT-16: all output UnitValues have numeric value and string unit', async () => {
    const result = await runPowerDistributionDesign({
      type: 'power',
      constraints: { rackCount: 10, rackDensity_kW: 10, voltageClass: '480V' },
      safetyClass: 'data-center',
      outputFormat: ['calculations'],
    });
    for (const calc of result.calculations) {
      for (const [key, uv] of Object.entries(calc.outputs)) {
        expect(typeof uv.value).toBe('number');
        expect(typeof uv.unit).toBe('string');
        expect(uv.unit.length).toBeGreaterThan(0);
      }
    }
  });

  // -----------------------------------------------------------------------
  // IT-17: Educational modules exist
  // -----------------------------------------------------------------------
  it('IT-17: educational modules exist at expected paths', () => {
    const simProg = readFileSync(
      'skills/physical-infrastructure/educational/simulation-progression.md',
      'utf8',
    );
    const mathConn = readFileSync(
      'skills/physical-infrastructure/educational/math-connections.md',
      'utf8',
    );
    expect(simProg.length).toBeGreaterThan(100);
    expect(mathConn.length).toBeGreaterThan(100);
  });

  // -----------------------------------------------------------------------
  // IT-18: Agent definitions exist and reference correct models
  // -----------------------------------------------------------------------
  it('IT-18: all agent definition files exist', () => {
    const files = [
      'skills/physical-infrastructure/agents/architect-agent.md',
      'skills/physical-infrastructure/agents/specialist-agents.md',
      'skills/physical-infrastructure/agents/safety-warden.md',
    ];
    for (const file of files) {
      const content = readFileSync(file, 'utf8');
      expect(content.length).toBeGreaterThan(100);
    }
  });
});
