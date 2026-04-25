/**
 * HB-02 AgentDoG — taxonomy / type definition tests.
 *
 * Pins the schema-version constant + axis-shape contract so any drift is
 * loud at build time.
 */

import { describe, it, expect } from 'vitest';
import {
  AGENTDOG_SCHEMA_VERSION,
  type AgentDogDiagnostic,
  type BlockContext,
} from '../types.js';
import { captureWhereAxis } from '../where.js';
import { captureHowAxis } from '../how.js';
import { captureWhatAxis } from '../what.js';
import {
  BLAST_RADII,
  ESCALATION_PATTERNS,
  VULNERABILITY_VECTORS,
} from '../index.js';

describe('AgentDoG — taxonomy / type definitions', () => {
  it('exposes a stable schema version', () => {
    expect(AGENTDOG_SCHEMA_VERSION).toBe('1.0.0');
  });

  it('every axis enumeration is non-empty + frozen-by-construction', () => {
    expect(VULNERABILITY_VECTORS.length).toBeGreaterThan(0);
    expect(ESCALATION_PATTERNS.length).toBeGreaterThan(0);
    expect(BLAST_RADII.length).toBeGreaterThan(0);
  });

  it('AgentDogDiagnostic shape composes the three axes', () => {
    const ctx: BlockContext = {
      component: 'skill:foo',
      invocationContext: 'phase:807',
      vulnerabilityVector: 'prompt-injection',
      escalationPattern: 'lateral',
      impactedAsset: 'secret',
      blastRadius: 'project',
    };
    const diagnostic: AgentDogDiagnostic = Object.freeze({
      schemaVersion: AGENTDOG_SCHEMA_VERSION,
      where: captureWhereAxis(ctx),
      how: captureHowAxis(ctx),
      what: captureWhatAxis(ctx),
    });
    expect(diagnostic.schemaVersion).toBe('1.0.0');
    expect(diagnostic.where.component).toBe('skill:foo');
    expect(diagnostic.how.vulnerabilityVector).toBe('prompt-injection');
    expect(diagnostic.what.blastRadius).toBe('project');
  });

  it('axes are independent — capturing one does not mutate another', () => {
    const ctx = {
      component: 'a', invocationContext: 'b',
      vulnerabilityVector: 'prompt-injection', escalationPattern: 'lateral',
      impactedAsset: 'c', blastRadius: 'session',
    };
    const w1 = captureWhereAxis(ctx);
    const h1 = captureHowAxis(ctx);
    const wh1 = captureWhatAxis(ctx);
    expect(w1).toEqual({ component: 'a', invocationContext: 'b' });
    expect(h1).toEqual({ vulnerabilityVector: 'prompt-injection', escalationPattern: 'lateral' });
    expect(wh1).toEqual({ impactedAsset: 'c', blastRadius: 'session' });
  });
});
