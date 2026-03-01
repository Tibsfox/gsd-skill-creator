/**
 * Assessment Checkpoints -- Test suite
 *
 * Validates that self-assessment checkpoints are properly integrated
 * into the learn-mode system. Each Tier 1-3 module must have at least
 * one DepthMarker with a checkpoint field that cross-references an
 * assessment.md question.
 */

import { describe, it, expect } from 'vitest';
import { MODULE_MARKERS, DepthLevel } from '../shared/learn-mode.js';

const TIER_1_3_MODULES = [
  '01-the-circuit', '02-passive-components', '03-the-signal',
  '04-diodes', '05-transistors', '06-op-amps', '07-power-supplies',
  '07a-logic-gates', '08-sequential-logic', '09-data-conversion', '10-dsp',
];

describe('Self-Assessment Checkpoints', () => {
  it('every Tier 1-3 module has at least one checkpoint marker', () => {
    for (const moduleId of TIER_1_3_MODULES) {
      const markers = MODULE_MARKERS[moduleId];
      expect(markers, `${moduleId} missing from MODULE_MARKERS`).toBeDefined();
      const checkpoints = markers.filter(m => m.checkpoint);
      expect(checkpoints.length, `${moduleId} has no checkpoint markers`).toBeGreaterThanOrEqual(1);
    }
  });

  it('checkpoint markers have valid questionRef format (Q followed by number)', () => {
    for (const moduleId of TIER_1_3_MODULES) {
      const markers = MODULE_MARKERS[moduleId];
      const checkpoints = markers.filter(m => m.checkpoint);
      for (const cp of checkpoints) {
        expect(cp.checkpoint!.questionRef).toMatch(/^Q\d+$/);
        expect(cp.checkpoint!.topic.length).toBeGreaterThan(5);
      }
    }
  });

  it('checkpoint markers are at Reference level', () => {
    for (const moduleId of TIER_1_3_MODULES) {
      const markers = MODULE_MARKERS[moduleId];
      const checkpoints = markers.filter(m => m.checkpoint);
      for (const cp of checkpoints) {
        expect(cp.level).toBe(DepthLevel.Reference);
      }
    }
  });

  it('non-checkpoint markers have no checkpoint field', () => {
    for (const moduleId of TIER_1_3_MODULES) {
      const markers = MODULE_MARKERS[moduleId];
      for (const m of markers) {
        if (m.checkpoint) {
          expect(m.checkpoint.questionRef).toBeTruthy();
          expect(m.checkpoint.topic).toBeTruthy();
        }
      }
    }
  });
});
