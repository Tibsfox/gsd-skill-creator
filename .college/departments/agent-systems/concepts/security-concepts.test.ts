/**
 * Agent Systems Department -- Security & Governance wing concept tests.
 *
 * The 6 concepts from the June-2026 additional-material scan, authored in the
 * department's light pattern (empty panels). Assertions mirror the T2 suite:
 * valid RosettaConcept fields, id prefix agent-, complexPlanePosition internal
 * consistency, relationships >= 2, panels is a Map, and dept-local targetId
 * resolution (D-13; external skill-injection-guardian / ai-computation refs accepted).
 */

import { describe, it, expect } from 'vitest';
import {
  skillPermissionDualPlane,
  capabilityGateAuthorization,
  semanticToolTransactions,
  skillResourceSupplyChain,
  governanceDecayCompaction,
  perComponentSkillIdentity,
  // existing barrel concepts referenced as resolution targets
  skillPrivilegeBoundary,
  complianceTraceCheck,
  episodePackage,
  selfMutatingPoisoning,
  constraintDrift,
  memoryConsolidation,
  skillAsArtifact,
  verifiableSkillContract,
} from './index.js';
import { governanceTaxonomy } from './multi-agent-orchestration/governance-taxonomy.js';
import { actionAuthorityAlignment } from './security/action-authority-alignment.js';
import { runtimeSkillSpecEnforcement } from './security/runtime-skill-spec-enforcement.js';
import { skillScannerEvasion } from './security/skill-scanner-evasion.js';
import type { RosettaConcept } from '../../../rosetta-core/types.js';

const securityConcepts: RosettaConcept[] = [
  skillPermissionDualPlane,
  capabilityGateAuthorization,
  semanticToolTransactions,
  skillResourceSupplyChain,
  governanceDecayCompaction,
  perComponentSkillIdentity,
];
const securityConceptNames = [
  'skillPermissionDualPlane',
  'capabilityGateAuthorization',
  'semanticToolTransactions',
  'skillResourceSupplyChain',
  'governanceDecayCompaction',
  'perComponentSkillIdentity',
];

const allDeptConcepts: RosettaConcept[] = [
  ...securityConcepts,
  skillPrivilegeBoundary,
  complianceTraceCheck,
  episodePackage,
  selfMutatingPoisoning,
  constraintDrift,
  memoryConsolidation,
  skillAsArtifact,
  verifiableSkillContract,
  governanceTaxonomy,
  memoryConsolidation,
  actionAuthorityAlignment,
  capabilityGateAuthorization,
  runtimeSkillSpecEnforcement,
  skillPermissionDualPlane,
  skillScannerEvasion,
];

describe('Agent Systems Department -- Security & Governance wing concepts', () => {
  describe('ASSEC-01: Valid RosettaConcept fields', () => {
    it.each(securityConcepts.map((c, i) => [securityConceptNames[i], c] as const))(
      '%s has non-empty id, name, domain=agent-systems, and description',
      (_n, c) => {
        expect(c.id).toBeTruthy();
        expect(c.name).toBeTruthy();
        expect(c.domain).toBe('agent-systems');
        expect(c.description.length).toBeGreaterThan(10);
      }
    );
  });

  describe('ASSEC-02: id prefix agent-', () => {
    it.each(securityConcepts.map((c, i) => [securityConceptNames[i], c] as const))(
      '%s id starts with agent-',
      (_n, c) => {
        expect(c.id.startsWith('agent-')).toBe(true);
      }
    );
  });

  describe('ASSEC-03: complexPlanePosition validation', () => {
    it.each(securityConcepts.map((c, i) => [securityConceptNames[i], c] as const))(
      '%s complexPlanePosition magnitude and angle agree with real/imaginary',
      (_n, c) => {
        const pos = c.complexPlanePosition!;
        expect(pos).toBeDefined();
        expect(pos.magnitude).toBeCloseTo(Math.sqrt(pos.real * pos.real + pos.imaginary * pos.imaginary), 5);
        expect(pos.angle).toBeCloseTo(Math.atan2(pos.imaginary, pos.real), 5);
      }
    );
  });

  describe('ASSEC-04: relationships (>= 2)', () => {
    it.each(securityConcepts.map((c, i) => [securityConceptNames[i], c] as const))(
      '%s has >= 2 relationships',
      (_n, c) => {
        expect(c.relationships.length).toBeGreaterThanOrEqual(2);
      }
    );
  });

  describe('ASSEC-05: panels is a Map (empty allowed for this wing)', () => {
    it.each(securityConcepts.map((c, i) => [securityConceptNames[i], c] as const))(
      '%s has panels as a Map',
      (_n, c) => {
        expect(c.panels).toBeInstanceOf(Map);
      }
    );
  });

  describe('ASSEC-06: Dept-local targetId resolution', () => {
    const deptPrefix = 'agent-';
    const localIds = new Set(allDeptConcepts.map((c) => c.id));

    it.each(securityConcepts.map((c, i) => [securityConceptNames[i], c] as const))(
      '%s agent- targetIds resolve within the dept',
      (_n, c) => {
        for (const rel of c.relationships) {
          if (rel.targetId.startsWith(deptPrefix)) {
            expect(localIds.has(rel.targetId)).toBe(true);
          }
          // external refs (skill-injection-guardian, ai-computation-*) accepted per D-13
        }
      }
    );
  });
});
