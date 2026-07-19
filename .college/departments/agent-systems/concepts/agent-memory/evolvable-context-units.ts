/**
 * Evolvable Context Units -- agent-systems concept (June-2026 arXiv cohort, T2).
 * @module departments/agent-systems/concepts/agent-memory/evolvable-context-units
 */

import type { RosettaConcept } from '../../../../rosetta-core/types.js';

const theta = 55 * 2 * Math.PI / 85;
const radius = 0.60;
const real = radius * Math.cos(theta);
const imaginary = radius * Math.sin(theta);

export const evolvableContextUnits: RosettaConcept = {
  id: "agent-evolvable-context-units",
  name: "Evolvable Context Units",
  domain: 'agent-systems',
  description:
    "Agents that learn from experience usually store it in one flat form — raw trajectories, extracted facts, or documents — conflating knowledge that differs in granularity and in when it should be created or used. UCE (2026) instead maintains the experience library as TYPED evolvable context units: memory, strategy, workflow, and skill, each distilled from trajectories under type-specific conditions, retrieved at decision time, quality-tracked through use, and grown to fill coverage gaps. Typing lets each unit be distilled and curated by rules suited to its kind; coverage-awareness lets the library detect and generate what it lacks rather than only accreting new traces.",
  panels: new Map(),
  relationships: [
    {
      type: "dependency",
      targetId: "agent-memory-consolidation",
      description: "Specializes consolidation by giving it a typed target: rather than folding traces into one undifferentiated memory store, UCE consolidates trajectories into four distinct unit types (memory, strategy, workflow, skill), each with its own distillation conditions and curation rules.",
    },
    {
      type: "cross-reference",
      targetId: "agent-trace-to-skill-induction",
      description: "The 'skill' unit type is precisely a trace-to-skill induction; UCE generalizes that induction pattern across three further unit types under one typed, quality-tracked library rather than treating skills as the only distillable artifact.",
    },
    {
      type: "cross-reference",
      targetId: "agent-skill-coverage-metric",
      description: "UCE's coverage-aware growth — generating units to fill the library's gaps — presupposes a coverage metric that identifies which situation types the library currently lacks units for, so growth targets absent regions instead of duplicating well-covered ones.",
    },
    {
      type: "analogy",
      targetId: "agent-engram-maturation",
      description: "Both track a stored unit's quality through repeated use and let strong units strengthen while weak ones decay; UCE applies this maturation dynamic uniformly across all four typed unit kinds rather than to a single homogeneous memory representation.",
    },
  ],
  complexPlanePosition: {
    real,
    imaginary,
    magnitude: Math.sqrt(real * real + imaginary * imaginary),
    angle: Math.atan2(imaginary, real),
  },
};
