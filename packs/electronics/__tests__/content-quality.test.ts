/**
 * Content Quality Test Suite — Electronics Educational Pack
 *
 * Validates content quality across all 15 modules (16 directories).
 * Covers QUAL-01 through QUAL-04: word counts, H&H citations,
 * lab structure, and assessment quality.
 */

import { describe, it, expect } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const MODULE_DIRS = [
  '01-the-circuit', '02-passive-components', '03-the-signal',
  '04-diodes', '05-transistors', '06-op-amps', '07-power-supplies',
  '07a-logic-gates', '08-sequential-logic', '09-data-conversion',
  '10-dsp', '11-microcontrollers', '12-sensors-actuators',
  '13-plc', '14-off-grid-power', '15-pcb-design',
];

const MODULES_DIR = path.resolve(__dirname, '../modules');

// Tier 1-3 modules (01-10 + 07a) use H&H citations
// Tier 4 modules (11-15) use domain-specific references
const TIER_1_3_DIRS = [
  '01-the-circuit', '02-passive-components', '03-the-signal',
  '04-diodes', '05-transistors', '06-op-amps', '07-power-supplies',
  '07a-logic-gates', '08-sequential-logic', '09-data-conversion',
  '10-dsp',
];

const TIER_4_DIRS = [
  '11-microcontrollers', '12-sensors-actuators',
  '13-plc', '14-off-grid-power', '15-pcb-design',
];

// ---------------------------------------------------------------------------
// QUAL-01: Content Word Counts
// ---------------------------------------------------------------------------

describe('QUAL-01: Content Word Counts', () => {
  for (const dir of MODULE_DIRS) {
    it(`${dir}/content.md has at least 500 words`, () => {
      const contentPath = path.resolve(MODULES_DIR, dir, 'content.md');
      const content = fs.readFileSync(contentPath, 'utf-8');
      const words = content.split(/\s+/).filter((w) => w.length > 0);
      expect(words.length).toBeGreaterThanOrEqual(500);
    });
  }

  for (const dir of MODULE_DIRS) {
    it(`${dir}/content.md has at least 5 topic sections`, () => {
      const contentPath = path.resolve(MODULES_DIR, dir, 'content.md');
      const content = fs.readFileSync(contentPath, 'utf-8');
      // Count ## or ### headers (topic sections)
      const headers = content.match(/^#{2,3}\s+/gm);
      expect(headers).not.toBeNull();
      expect(headers!.length).toBeGreaterThanOrEqual(5);
    });
  }
});

// ---------------------------------------------------------------------------
// QUAL-02: H&H Citations
// ---------------------------------------------------------------------------

describe('QUAL-02: H&H Citations', () => {
  for (const dir of TIER_1_3_DIRS) {
    it(`${dir}/content.md has at least one H&H citation`, () => {
      const contentPath = path.resolve(MODULES_DIR, dir, 'content.md');
      const content = fs.readFileSync(contentPath, 'utf-8');
      const hasHH = /H&H|Horowitz|Art of Electronics/i.test(content);
      expect(hasHH).toBe(true);
    });
  }

  for (const dir of TIER_4_DIRS) {
    it(`${dir}/content.md has at least one authoritative reference`, () => {
      const contentPath = path.resolve(MODULES_DIR, dir, 'content.md');
      const content = fs.readFileSync(contentPath, 'utf-8');
      // Tier 4 may use H&H, IEC, or domain-specific references
      const hasRef = /H&H|Horowitz|Art of Electronics|IEC|IEEE|NIST|datasheet|specification/i.test(content);
      expect(hasRef).toBe(true);
    });
  }
});

// ---------------------------------------------------------------------------
// QUAL-03: Lab Structure
// ---------------------------------------------------------------------------

describe('QUAL-03: Lab Structure', () => {
  for (const dir of MODULE_DIRS) {
    it(`${dir}/labs.ts: each lab has at least 3 steps with required fields`, async () => {
      const mod = await import(`../modules/${dir}/labs`);
      expect(Array.isArray(mod.labs)).toBe(true);

      for (const lab of mod.labs) {
        expect(lab.steps.length).toBeGreaterThanOrEqual(3);

        for (const step of lab.steps) {
          expect(step.instruction).toBeTruthy();
          expect(step.instruction.length).toBeGreaterThan(0);
          expect(step.expected_observation).toBeTruthy();
          expect(step.expected_observation.length).toBeGreaterThan(0);
          expect(step.learn_note).toBeTruthy();
          expect(step.learn_note.length).toBeGreaterThan(0);
        }
      }
    });
  }

  for (const dir of MODULE_DIRS) {
    it(`${dir}/labs.ts: each lab has a verify function`, async () => {
      const mod = await import(`../modules/${dir}/labs`);
      for (const lab of mod.labs) {
        expect(typeof lab.verify).toBe('function');
      }
    });
  }
});

// ---------------------------------------------------------------------------
// QUAL-04: Assessment Quality
// ---------------------------------------------------------------------------

describe('QUAL-04: Assessment Quality', () => {
  for (const dir of MODULE_DIRS) {
    it(`${dir}/assessment.md has at least 5 questions`, () => {
      const assessmentPath = path.resolve(MODULES_DIR, dir, 'assessment.md');
      const content = fs.readFileSync(assessmentPath, 'utf-8');
      // Count question headers in various formats:
      // "## Question N", "### Question N", "### QN:"
      const questionHeaders = content.match(/^#{2,3}\s+(Question\s+\d|Q\d)/gm);
      expect(questionHeaders).not.toBeNull();
      expect(questionHeaders!.length).toBeGreaterThanOrEqual(5);
    });
  }

  for (const dir of MODULE_DIRS) {
    it(`${dir}/assessment.md has an answer key`, () => {
      const assessmentPath = path.resolve(MODULES_DIR, dir, 'assessment.md');
      const content = fs.readFileSync(assessmentPath, 'utf-8');
      const hasAnswerKey = /answer\s*key|## answer/i.test(content);
      expect(hasAnswerKey).toBe(true);
    });
  }
});
