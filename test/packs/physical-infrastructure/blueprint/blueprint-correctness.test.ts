/**
 * Blueprint correctness tests (BP-01 through BP-10).
 *
 * Validates SVG output, title blocks, drawing types, and PE disclaimer
 * embedding in blueprint output from the integration wiring.
 */
import { describe, it, expect } from 'vitest';
import { runCoolingSystemDesign } from '../../../../skills/physical-infrastructure/integration/cooling-system-e2e.js';
import { runPowerDistributionDesign } from '../../../../skills/physical-infrastructure/integration/power-distribution-e2e.js';
import { runCombinedSystemDesign } from '../../../../skills/physical-infrastructure/integration/combined-system-e2e.js';

describe('Blueprint Correctness Tests (BP-01 through BP-10)', () => {
  // -----------------------------------------------------------------------
  // BP-01: P&ID drawing produced for cooling request
  // -----------------------------------------------------------------------
  it('BP-01: cooling request with blueprint format produces P&ID drawing', async () => {
    const result = await runCoolingSystemDesign({
      type: 'cooling',
      constraints: { heatLoad_kW: 400, rackCount: 10 },
      safetyClass: 'data-center',
      outputFormat: ['calculations', 'blueprint'],
    });
    const pid = result.drawings.find(d => d.type === 'P&ID');
    expect(pid).toBeDefined();
    expect(pid!.type).toBe('P&ID');
  });

  // -----------------------------------------------------------------------
  // BP-02: SLD drawing produced for power request
  // -----------------------------------------------------------------------
  it('BP-02: power request with blueprint format produces SLD drawing', async () => {
    const result = await runPowerDistributionDesign({
      type: 'power',
      constraints: { rackCount: 10, rackDensity_kW: 10, voltageClass: '480V' },
      safetyClass: 'data-center',
      outputFormat: ['calculations', 'blueprint'],
    });
    const sld = result.drawings.find(d => d.type === 'SLD');
    expect(sld).toBeDefined();
    expect(sld!.type).toBe('SLD');
  });

  // -----------------------------------------------------------------------
  // BP-03: Combined request produces both P&ID and SLD
  // -----------------------------------------------------------------------
  it('BP-03: combined request produces both P&ID and SLD drawings', async () => {
    const result = await runCombinedSystemDesign({
      type: 'combined',
      constraints: { rackCount: 10, rackDensity_kW: 40, voltageClass: '480V' },
      safetyClass: 'data-center',
      outputFormat: ['calculations', 'blueprint'],
    });
    const types = result.drawings.map(d => d.type);
    expect(types).toContain('P&ID');
    expect(types).toContain('SLD');
  });

  // -----------------------------------------------------------------------
  // BP-04: Drawing format is SVG
  // -----------------------------------------------------------------------
  it('BP-04: all drawings use SVG format', async () => {
    const result = await runCombinedSystemDesign({
      type: 'combined',
      constraints: { rackCount: 10, rackDensity_kW: 40, voltageClass: '480V' },
      safetyClass: 'data-center',
      outputFormat: ['calculations', 'blueprint'],
    });
    for (const drawing of result.drawings) {
      expect(drawing.format).toBe('svg');
    }
  });

  // -----------------------------------------------------------------------
  // BP-05: Title block has required fields
  // -----------------------------------------------------------------------
  it('BP-05: P&ID title block has projectName, drawingNumber, revision, date', async () => {
    const result = await runCoolingSystemDesign({
      type: 'cooling',
      constraints: { heatLoad_kW: 400, rackCount: 10 },
      safetyClass: 'data-center',
      outputFormat: ['calculations', 'blueprint'],
    });
    const pid = result.drawings.find(d => d.type === 'P&ID');
    expect(pid!.titleBlock.projectName).toBeTruthy();
    expect(pid!.titleBlock.drawingNumber).toBeTruthy();
    expect(pid!.titleBlock.revision).toBeDefined();
    expect(pid!.titleBlock.date).toBeTruthy();
    expect(pid!.titleBlock.drawnBy).toBeTruthy();
    expect(pid!.titleBlock.scale).toBeTruthy();
    expect(pid!.titleBlock.sheet).toBeTruthy();
  });

  // -----------------------------------------------------------------------
  // BP-06: Drawing number follows convention (M-xxx for mechanical, E-xxx for electrical)
  // -----------------------------------------------------------------------
  it('BP-06: P&ID uses M-series drawing number, SLD uses E-series', async () => {
    const result = await runCombinedSystemDesign({
      type: 'combined',
      constraints: { rackCount: 10, rackDensity_kW: 40, voltageClass: '480V' },
      safetyClass: 'data-center',
      outputFormat: ['calculations', 'blueprint'],
    });
    const pid = result.drawings.find(d => d.type === 'P&ID');
    const sld = result.drawings.find(d => d.type === 'SLD');
    expect(pid!.titleBlock.drawingNumber).toMatch(/^M-/);
    expect(sld!.titleBlock.drawingNumber).toMatch(/^E-/);
  });

  // -----------------------------------------------------------------------
  // BP-07: SVG content is non-empty and references pipe size
  // -----------------------------------------------------------------------
  it('BP-07: P&ID SVG content references pipe NPS size', async () => {
    const result = await runCoolingSystemDesign({
      type: 'cooling',
      constraints: { heatLoad_kW: 400, rackCount: 10 },
      safetyClass: 'data-center',
      outputFormat: ['calculations', 'blueprint'],
    });
    const pid = result.drawings.find(d => d.type === 'P&ID');
    expect(pid!.content).toContain('NPS');
    expect(pid!.content.length).toBeGreaterThan(100);
  });

  // -----------------------------------------------------------------------
  // BP-08: Title block text referenced in SVG content (drawing metadata)
  // -----------------------------------------------------------------------
  it('BP-08: SLD SVG contains voltage and transformer reference', async () => {
    const result = await runPowerDistributionDesign({
      type: 'power',
      constraints: { rackCount: 10, rackDensity_kW: 10, voltageClass: '480V' },
      safetyClass: 'data-center',
      outputFormat: ['calculations', 'blueprint'],
    });
    const sld = result.drawings.find(d => d.type === 'SLD');
    expect(sld!.content).toContain('480V');
    expect(sld!.content).toContain('kVA');
  });

  // -----------------------------------------------------------------------
  // BP-09: BOM generated when construction format requested
  // -----------------------------------------------------------------------
  it('BP-09: BOM items present when construction format requested', async () => {
    const result = await runCoolingSystemDesign({
      type: 'cooling',
      constraints: { heatLoad_kW: 400, rackCount: 10 },
      safetyClass: 'data-center',
      outputFormat: ['calculations', 'blueprint', 'construction'],
    });
    expect(result.bom.items.length).toBeGreaterThan(0);
    // Verify BOM items have required fields
    for (const item of result.bom.items) {
      expect(item.lineNumber).toBeGreaterThan(0);
      expect(item.description).toBeTruthy();
      expect(item.quantity).toBeGreaterThan(0);
      expect(item.unit).toBeTruthy();
    }
  });

  // -----------------------------------------------------------------------
  // BP-10: SVG validates (proper open/close tags, xmlns)
  // -----------------------------------------------------------------------
  it('BP-10: SVG output has valid structure (svg tags and xmlns)', async () => {
    const result = await runCoolingSystemDesign({
      type: 'cooling',
      constraints: { heatLoad_kW: 400, rackCount: 10 },
      safetyClass: 'data-center',
      outputFormat: ['calculations', 'blueprint'],
    });
    const pid = result.drawings.find(d => d.type === 'P&ID');
    expect(pid!.content).toContain('<svg');
    expect(pid!.content).toContain('</svg>');
    expect(pid!.content).toContain('xmlns="http://www.w3.org/2000/svg"');
  });

  // -----------------------------------------------------------------------
  // Additional: PE disclaimer in SVG content
  // -----------------------------------------------------------------------
  it('BP-10b: SVG content contains PE disclaimer text', async () => {
    const result = await runCoolingSystemDesign({
      type: 'cooling',
      constraints: { heatLoad_kW: 400, rackCount: 10 },
      safetyClass: 'data-center',
      outputFormat: ['calculations', 'blueprint'],
    });
    const pid = result.drawings.find(d => d.type === 'P&ID');
    expect(pid!.content).toContain('AI GENERATED');
    expect(pid!.content).toContain('LICENSED PE');
  });

  // -----------------------------------------------------------------------
  // Additional: No drawings when blueprint not in outputFormat
  // -----------------------------------------------------------------------
  it('no drawings produced when blueprint not in outputFormat', async () => {
    const result = await runCoolingSystemDesign({
      type: 'cooling',
      constraints: { heatLoad_kW: 400, rackCount: 10 },
      safetyClass: 'data-center',
      outputFormat: ['calculations'],
    });
    expect(result.drawings.length).toBe(0);
  });

  // -----------------------------------------------------------------------
  // Additional: Drawing revision starts at 0
  // -----------------------------------------------------------------------
  it('initial drawing revision is 0', async () => {
    const result = await runCoolingSystemDesign({
      type: 'cooling',
      constraints: { heatLoad_kW: 400, rackCount: 10 },
      safetyClass: 'data-center',
      outputFormat: ['calculations', 'blueprint'],
    });
    for (const drawing of result.drawings) {
      expect(drawing.revisionNumber).toBe(0);
    }
  });

  // -----------------------------------------------------------------------
  // Additional: Combined sheet numbering
  // -----------------------------------------------------------------------
  it('combined drawings have sequential sheet numbers', async () => {
    const result = await runCombinedSystemDesign({
      type: 'combined',
      constraints: { rackCount: 10, rackDensity_kW: 40, voltageClass: '480V' },
      safetyClass: 'data-center',
      outputFormat: ['calculations', 'blueprint'],
    });
    const sheets = result.drawings.map(d => d.titleBlock.sheet);
    expect(sheets).toContain('1 of 2');
    expect(sheets).toContain('2 of 2');
  });
});
