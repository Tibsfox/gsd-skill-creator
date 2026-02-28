/**
 * Learn Mode Engine — TDD Test Suite
 *
 * Tests depth filtering, H&H citation lookup, module marker registry,
 * and per-module marker correctness for all 15 modules (16 directories).
 */
import { describe, it, expect } from 'vitest';
import {
  DepthLevel,
  DepthMarker,
  filterByDepth,
  getModuleMarkers,
  lookupCitation,
  MODULE_MARKERS,
  HHCitation,
} from '../shared/learn-mode.js';

// ---------------------------------------------------------------------------
// 1. DepthLevel enum values
// ---------------------------------------------------------------------------
describe('DepthLevel enum', () => {
  it('Practical equals 1', () => {
    expect(DepthLevel.Practical).toBe(1);
  });

  it('Reference equals 2', () => {
    expect(DepthLevel.Reference).toBe(2);
  });

  it('Mathematical equals 3', () => {
    expect(DepthLevel.Mathematical).toBe(3);
  });
});

// ---------------------------------------------------------------------------
// 2. filterByDepth
// ---------------------------------------------------------------------------
describe('filterByDepth', () => {
  const markers: DepthMarker[] = [
    { level: DepthLevel.Practical, content: 'L1 rule', hhCitation: 'H&H 1.2' },
    { level: DepthLevel.Reference, content: 'L2 ref', hhCitation: 'H&H 1.2' },
    { level: DepthLevel.Mathematical, content: 'L3 math: V = IR', hhCitation: 'H&H 1.2' },
    { level: DepthLevel.Practical, content: 'L1 rule 2', hhCitation: 'H&H 1.4' },
    { level: DepthLevel.Reference, content: 'L2 ref 2', hhCitation: 'H&H 1.4' },
  ];

  it('Practical level returns only Level 1 markers', () => {
    const result = filterByDepth(markers, DepthLevel.Practical);
    expect(result).toHaveLength(2);
    expect(result.every((m) => m.level === DepthLevel.Practical)).toBe(true);
  });

  it('Reference level returns Level 1 and Level 2 markers', () => {
    const result = filterByDepth(markers, DepthLevel.Reference);
    expect(result).toHaveLength(4);
    expect(result.every((m) => m.level <= DepthLevel.Reference)).toBe(true);
  });

  it('Mathematical level returns all markers', () => {
    const result = filterByDepth(markers, DepthLevel.Mathematical);
    expect(result).toHaveLength(5);
  });

  it('empty array returns empty array', () => {
    expect(filterByDepth([], DepthLevel.Practical)).toEqual([]);
    expect(filterByDepth([], DepthLevel.Reference)).toEqual([]);
    expect(filterByDepth([], DepthLevel.Mathematical)).toEqual([]);
  });

  it('preserves original order', () => {
    const result = filterByDepth(markers, DepthLevel.Reference);
    expect(result[0].content).toBe('L1 rule');
    expect(result[1].content).toBe('L2 ref');
    expect(result[2].content).toBe('L1 rule 2');
    expect(result[3].content).toBe('L2 ref 2');
  });

  it('does not mutate the input array', () => {
    const original = [...markers];
    filterByDepth(markers, DepthLevel.Practical);
    expect(markers).toEqual(original);
  });
});

// ---------------------------------------------------------------------------
// 3. HHCitation interface and lookupCitation
// ---------------------------------------------------------------------------
describe('lookupCitation', () => {
  it('resolves "H&H 1.2" to chapter 1, section "2", topic with voltage/current/resistance', () => {
    const result = lookupCitation('H&H 1.2');
    expect(result).not.toBeNull();
    const c = result as HHCitation;
    expect(c.raw).toBe('H&H 1.2');
    expect(c.chapter).toBe(1);
    expect(c.section).toBe('2');
    expect(c.topic).toMatch(/voltage|current|resistance/i);
    expect(c.modules).toContain('01-the-circuit');
  });

  it('resolves "H&H Ch.2" to chapter 2, topic with transistor', () => {
    const result = lookupCitation('H&H Ch.2');
    expect(result).not.toBeNull();
    const c = result as HHCitation;
    expect(c.chapter).toBe(2);
    expect(c.section).toBeUndefined();
    expect(c.topic).toMatch(/transistor/i);
    expect(c.modules).toContain('05-transistors');
  });

  it('resolves "H&H 1.7" to modules including both passive-components and the-signal', () => {
    const result = lookupCitation('H&H 1.7');
    expect(result).not.toBeNull();
    const c = result as HHCitation;
    expect(c.modules).toContain('02-passive-components');
    expect(c.modules).toContain('03-the-signal');
  });

  it('resolves "H&H 10.1-10.2" to modules including logic-gates', () => {
    const result = lookupCitation('H&H 10.1-10.2');
    expect(result).not.toBeNull();
    const c = result as HHCitation;
    expect(c.modules).toContain('07a-logic-gates');
  });

  it('resolves "H&H Ch.13" to modules including data-conversion', () => {
    const result = lookupCitation('H&H Ch.13');
    expect(result).not.toBeNull();
    const c = result as HHCitation;
    expect(c.modules).toContain('09-data-conversion');
  });

  it('resolves "H&H 13.5" to modules including dsp', () => {
    const result = lookupCitation('H&H 13.5');
    expect(result).not.toBeNull();
    const c = result as HHCitation;
    expect(c.modules).toContain('10-dsp');
  });

  it('resolves "H&H 9.8" to modules including off-grid-power', () => {
    const result = lookupCitation('H&H 9.8');
    expect(result).not.toBeNull();
    const c = result as HHCitation;
    expect(c.modules).toContain('14-off-grid-power');
  });

  it('returns null for invalid citation', () => {
    const result = lookupCitation('INVALID');
    expect(result).toBeNull();
  });

  it('returns null for empty string', () => {
    const result = lookupCitation('');
    expect(result).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// 4. getModuleMarkers
// ---------------------------------------------------------------------------
describe('getModuleMarkers', () => {
  it('returns non-empty array for "01-the-circuit"', () => {
    const markers = getModuleMarkers('01-the-circuit');
    expect(markers.length).toBeGreaterThan(0);
  });

  it('returns markers spanning all 3 depth levels', () => {
    const markers = getModuleMarkers('01-the-circuit');
    const levels = new Set(markers.map((m) => m.level));
    expect(levels.has(DepthLevel.Practical)).toBe(true);
    expect(levels.has(DepthLevel.Reference)).toBe(true);
    expect(levels.has(DepthLevel.Mathematical)).toBe(true);
  });

  it('every marker has non-empty hhCitation starting with "H&H"', () => {
    const markers = getModuleMarkers('01-the-circuit');
    for (const m of markers) {
      expect(m.hhCitation).toBeTruthy();
      expect(m.hhCitation.startsWith('H&H')).toBe(true);
    }
  });

  it('every marker has non-empty content string', () => {
    const markers = getModuleMarkers('01-the-circuit');
    for (const m of markers) {
      expect(m.content.length).toBeGreaterThan(0);
    }
  });

  it('returns empty array for nonexistent module', () => {
    expect(getModuleMarkers('nonexistent-module')).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// 5. MODULE_MARKERS registry -- all 16 module IDs present
// ---------------------------------------------------------------------------
describe('MODULE_MARKERS registry', () => {
  const ALL_MODULES = [
    '01-the-circuit',
    '02-passive-components',
    '03-the-signal',
    '04-diodes',
    '05-transistors',
    '06-op-amps',
    '07-power-supplies',
    '07a-logic-gates',
    '08-sequential-logic',
    '09-data-conversion',
    '10-dsp',
    '11-microcontrollers',
    '12-sensors-actuators',
    '13-plc',
    '14-off-grid-power',
    '15-pcb-design',
  ];

  it.each(ALL_MODULES)('%s is defined and non-empty', (moduleId) => {
    expect(MODULE_MARKERS[moduleId]).toBeDefined();
    expect(MODULE_MARKERS[moduleId].length).toBeGreaterThan(0);
  });

  it.each(ALL_MODULES)('%s has at least 1 Level 1 (practical) marker', (moduleId) => {
    const markers = MODULE_MARKERS[moduleId];
    const l1 = markers.filter((m) => m.level === DepthLevel.Practical);
    expect(l1.length).toBeGreaterThanOrEqual(1);
  });

  it.each(ALL_MODULES)('%s has at least 1 Level 2 (reference) marker', (moduleId) => {
    const markers = MODULE_MARKERS[moduleId];
    const l2 = markers.filter((m) => m.level === DepthLevel.Reference);
    expect(l2.length).toBeGreaterThanOrEqual(1);
  });

  it.each(ALL_MODULES)('%s has at least 1 Level 3 (mathematical) marker', (moduleId) => {
    const markers = MODULE_MARKERS[moduleId];
    const l3 = markers.filter((m) => m.level === DepthLevel.Mathematical);
    expect(l3.length).toBeGreaterThanOrEqual(1);
  });

  it.each(ALL_MODULES)('%s markers all have hhCitation starting with "H&H" or "IEC"', (moduleId) => {
    const markers = MODULE_MARKERS[moduleId];
    for (const m of markers) {
      expect(m.hhCitation.startsWith('H&H') || m.hhCitation.startsWith('IEC')).toBe(true);
    }
  });

  it.each(ALL_MODULES)('%s Level 1 markers contain no equations (no "=" sign)', (moduleId) => {
    const markers = MODULE_MARKERS[moduleId];
    const l1 = markers.filter((m) => m.level === DepthLevel.Practical);
    for (const m of l1) {
      expect(m.content).not.toContain('=');
    }
  });

  it.each(ALL_MODULES)('%s Level 3 markers contain equations (have "=" sign)', (moduleId) => {
    const markers = MODULE_MARKERS[moduleId];
    const l3 = markers.filter((m) => m.level === DepthLevel.Mathematical);
    for (const m of l3) {
      expect(m.content).toContain('=');
    }
  });
});

// ---------------------------------------------------------------------------
// 6. Module-specific H&H citation accuracy (spot checks)
// ---------------------------------------------------------------------------
describe('Module-specific H&H citation accuracy', () => {
  it('Module 01 markers cite "H&H 1.2"', () => {
    const markers = MODULE_MARKERS['01-the-circuit'];
    const citations = markers.map((m) => m.hhCitation);
    expect(citations.some((c) => c.includes('1.2'))).toBe(true);
  });

  it('Module 02 markers cite "H&H 1.4" or "H&H 1.7"', () => {
    const markers = MODULE_MARKERS['02-passive-components'];
    const citations = markers.map((m) => m.hhCitation);
    expect(citations.some((c) => c.includes('1.4') || c.includes('1.7'))).toBe(true);
  });

  it('Module 04 markers cite "H&H 1.6"', () => {
    const markers = MODULE_MARKERS['04-diodes'];
    const citations = markers.map((m) => m.hhCitation);
    expect(citations.some((c) => c.includes('1.6'))).toBe(true);
  });

  it('Module 05 markers cite "H&H Ch.2" or "H&H Ch.3"', () => {
    const markers = MODULE_MARKERS['05-transistors'];
    const citations = markers.map((m) => m.hhCitation);
    expect(citations.some((c) => c.includes('Ch.2') || c.includes('Ch.3'))).toBe(true);
  });

  it('Module 06 markers cite "H&H Ch.4" or "H&H Ch.6"', () => {
    const markers = MODULE_MARKERS['06-op-amps'];
    const citations = markers.map((m) => m.hhCitation);
    expect(citations.some((c) => c.includes('Ch.4') || c.includes('Ch.6'))).toBe(true);
  });

  it('Module 07 markers cite "H&H Ch.9"', () => {
    const markers = MODULE_MARKERS['07-power-supplies'];
    const citations = markers.map((m) => m.hhCitation);
    expect(citations.some((c) => c.includes('Ch.9'))).toBe(true);
  });

  it('Module 07a markers cite "H&H 10.1" or "H&H 10.2"', () => {
    const markers = MODULE_MARKERS['07a-logic-gates'];
    const citations = markers.map((m) => m.hhCitation);
    expect(citations.some((c) => c.includes('10.1') || c.includes('10.2'))).toBe(true);
  });

  it('Module 08 markers cite "H&H 10.3" or "H&H 10.4" or "H&H 10.5"', () => {
    const markers = MODULE_MARKERS['08-sequential-logic'];
    const citations = markers.map((m) => m.hhCitation);
    expect(
      citations.some((c) => c.includes('10.3') || c.includes('10.4') || c.includes('10.5')),
    ).toBe(true);
  });

  it('Module 09 markers cite "H&H Ch.13"', () => {
    const markers = MODULE_MARKERS['09-data-conversion'];
    const citations = markers.map((m) => m.hhCitation);
    expect(citations.some((c) => c.includes('Ch.13'))).toBe(true);
  });

  it('Module 10 markers cite "H&H 13.5"', () => {
    const markers = MODULE_MARKERS['10-dsp'];
    const citations = markers.map((m) => m.hhCitation);
    expect(citations.some((c) => c.includes('13.5'))).toBe(true);
  });

  it('Module 11 markers cite "H&H Ch.14" or "H&H Ch.15"', () => {
    const markers = MODULE_MARKERS['11-microcontrollers'];
    const citations = markers.map((m) => m.hhCitation);
    expect(citations.some((c) => c.includes('Ch.14') || c.includes('Ch.15'))).toBe(true);
  });

  it('Module 14 markers cite "H&H 9.8"', () => {
    const markers = MODULE_MARKERS['14-off-grid-power'];
    const citations = markers.map((m) => m.hhCitation);
    expect(citations.some((c) => c.includes('9.8'))).toBe(true);
  });
});
