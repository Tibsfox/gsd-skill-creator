/**
 * ai-computation Department — June-2026 additional-scan batch-B concept tests.
 */
import { describe, it, expect } from 'vitest';
import * as barrel from './index.js';
import { recursiveSelfGateCollapse, taskSpecificKnowledgeLocalization, inheritedCircuitEvasion, unlearningSuppressionReversal, programOfLayers, serializationAttentionDecay, contextRemovability, testTimeTraining, latentReconstructionFidelity, persistentHomologyTopology, retrievalCrowdingCollapse } from './index.js';
import type { RosettaConcept } from '../../../rosetta-core/types.js';

const concepts: RosettaConcept[] = [recursiveSelfGateCollapse, taskSpecificKnowledgeLocalization, inheritedCircuitEvasion, unlearningSuppressionReversal, programOfLayers, serializationAttentionDecay, contextRemovability, testTimeTraining, latentReconstructionFidelity, persistentHomologyTopology, retrievalCrowdingCollapse];
const names = ["recursiveSelfGateCollapse", "taskSpecificKnowledgeLocalization", "inheritedCircuitEvasion", "unlearningSuppressionReversal", "programOfLayers", "serializationAttentionDecay", "contextRemovability", "testTimeTraining", "latentReconstructionFidelity", "persistentHomologyTopology", "retrievalCrowdingCollapse"];
const localIds = new Set(Object.values(barrel as Record<string, RosettaConcept>).map((c) => c.id));

describe('ai-computation Department — additional-scan batch-B concepts', () => {
  it.each(concepts.map((c, i) => [names[i], c] as const))('%s valid fields', (_n, c) => {
    expect(c.id).toBeTruthy();
    expect(c.name).toBeTruthy();
    expect(c.domain).toBe('ai-computation');
    expect(c.description.length).toBeGreaterThan(10);
  });
  it.each(concepts.map((c, i) => [names[i], c] as const))('%s id prefix', (_n, c) => {
    expect(c.id.startsWith('ai-computation-')).toBe(true);
  });
  it.each(concepts.map((c, i) => [names[i], c] as const))('%s complexPlanePosition', (_n, c) => {
    const p = c.complexPlanePosition!;
    expect(p.magnitude).toBeCloseTo(Math.sqrt(p.real * p.real + p.imaginary * p.imaginary), 5);
    expect(p.angle).toBeCloseTo(Math.atan2(p.imaginary, p.real), 5);
  });
  it.each(concepts.map((c, i) => [names[i], c] as const))('%s relationships >= 2', (_n, c) => {
    expect(c.relationships.length).toBeGreaterThanOrEqual(2);
  });
  it.each(concepts.map((c, i) => [names[i], c] as const))('%s panels is Map', (_n, c) => {
    expect(c.panels).toBeInstanceOf(Map);
  });
  it.each(concepts.map((c, i) => [names[i], c] as const))('%s dept-local targetIds resolve', (_n, c) => {
    for (const rel of c.relationships) {
      if (rel.targetId.startsWith('ai-computation-')) expect(localIds.has(rel.targetId)).toBe(true);
    }
  });
});
