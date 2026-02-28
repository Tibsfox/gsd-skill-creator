import { describe, it, expect } from 'vitest';
import { assignPosition, updatePositionForDepth } from '../../../../src/dogfood/learning/position-mapper.js';
import type { LearnedConcept, PositionAssignment } from '../../../../src/dogfood/learning/types.js';
import {
  PART_ANGULAR_REGIONS,
  INITIAL_RADIUS,
  MAX_ANGULAR_VELOCITY,
} from '../../../../src/dogfood/learning/types.js';

// --- Factories ---

function makeConcept(overrides: Partial<LearnedConcept> = {}): LearnedConcept {
  return {
    id: '1-0-test-concept',
    name: 'Test Concept',
    sourceChunk: 'chunk-01',
    sourceChapter: 1,
    sourcePart: 1,
    theta: 0,
    radius: INITIAL_RADIUS,
    angularVelocity: 0,
    definition: 'A test concept.',
    keyRelationships: [],
    prerequisites: [],
    applications: [],
    ecosystemMappings: [],
    confidence: 0.85,
    mathDensity: 0.3,
    abstractionLevel: 0,
    detectedAt: new Date().toISOString(),
    ...overrides,
  };
}

describe('assignPosition', () => {
  it('assigns base theta from part angular region', () => {
    const conceptPartI = makeConcept({ sourcePart: 1 });
    const conceptPartV = makeConcept({ sourcePart: 5 });

    const posI = assignPosition(conceptPartI, 1);
    const posV = assignPosition(conceptPartV, 5);

    // Part I theta should be near 0
    expect(posI.theta).toBeGreaterThanOrEqual(0);
    expect(posI.theta).toBeLessThan(Math.PI / 8);

    // Part V theta should be near pi/2
    expect(posV.theta).toBeGreaterThanOrEqual(Math.PI / 2 - Math.PI / 16);
    expect(posV.theta).toBeLessThanOrEqual(Math.PI / 2 + Math.PI / 16);
  });

  it('adjusts theta within part range based on abstraction level', () => {
    const concrete = makeConcept({ sourcePart: 3, abstractionLevel: 0.1 });
    const abstract = makeConcept({ sourcePart: 3, abstractionLevel: 0.9 });

    const posConcrete = assignPosition(concrete, 3);
    const posAbstract = assignPosition(abstract, 3);

    // Both should be near Part III base (pi/4), but abstract should be slightly higher
    expect(posAbstract.theta).toBeGreaterThanOrEqual(posConcrete.theta);
  });

  it('assigns initial radius for new concepts', () => {
    const concept = makeConcept();
    const pos = assignPosition(concept, 1);

    expect(pos.radius).toBe(INITIAL_RADIUS);
  });

  it('computes abstractionLevel from theta', () => {
    const concept = makeConcept({ sourcePart: 5 });
    const pos = assignPosition(concept, 5);

    // abstractionLevel = theta / (2 * Math.PI), clamped to [0, 1]
    expect(pos.abstractionLevel).toBeGreaterThanOrEqual(0);
    expect(pos.abstractionLevel).toBeLessThanOrEqual(1);
    expect(pos.abstractionLevel).toBeCloseTo(pos.theta / (2 * Math.PI), 2);
  });

  it('handles Part X concepts at theta near 9*pi/8', () => {
    const concept = makeConcept({ sourcePart: 10 });
    const pos = assignPosition(concept, 10);

    const baseTheta = PART_ANGULAR_REGIONS[10];
    expect(pos.theta).toBeGreaterThanOrEqual(baseTheta - Math.PI / 16);
    expect(pos.theta).toBeLessThanOrEqual(baseTheta + Math.PI / 16);
  });
});

describe('updatePositionForDepth', () => {
  it('increases radius for repeated concept (progressive depth)', () => {
    const existing: PositionAssignment = {
      theta: Math.PI / 4,
      radius: INITIAL_RADIUS,
      angularVelocity: 0,
      abstractionLevel: 0.125,
    };

    const updated = updatePositionForDepth(existing, 0.9);

    expect(updated.radius).toBeGreaterThan(existing.radius);
  });

  it('clamps angular velocity to MAX_ANGULAR_VELOCITY', () => {
    const existing: PositionAssignment = {
      theta: 0,
      radius: INITIAL_RADIUS,
      angularVelocity: 0,
      abstractionLevel: 0,
    };

    // Large confidence should not push angular velocity past limit
    const updated = updatePositionForDepth(existing, 1.0);

    expect(updated.angularVelocity).toBeLessThanOrEqual(MAX_ANGULAR_VELOCITY);
  });

  it('radius never exceeds 1.0', () => {
    let pos: PositionAssignment = {
      theta: Math.PI / 4,
      radius: 0.95,
      angularVelocity: 0.1,
      abstractionLevel: 0.125,
    };

    // Apply many updates
    for (let i = 0; i < 20; i++) {
      pos = updatePositionForDepth(pos, 1.0);
    }

    expect(pos.radius).toBeLessThanOrEqual(1.0);
  });
});
