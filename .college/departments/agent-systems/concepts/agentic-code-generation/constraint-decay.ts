import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const constraintDecay: RosettaConcept = {
  id: 'agent-constraint-decay',
  name: 'Constraint Decay',
  domain: 'agent-systems',
  description:
    'Substantial decline in a backend coding agent as STRUCTURAL constraints — architectural patterns, databases, ' +
    'object-relational mappings — accumulate in a multi-file task, even when the functional API contract is held ' +
    'fixed. The 2026 study (Dente et al., arxiv `2605.06445v1`, "Constraint Decay: The Fragility of LLM Agents in ' +
    'Backend Code Generation") fixes a unified API contract across 80 greenfield and 20 feature-implementation tasks ' +
    'spanning eight web frameworks, evaluated with both end-to-end behavioral tests and static verifiers. Capable ' +
    'configurations lose ~30 points on average in assertion pass rates from baseline to fully-specified tasks, and ' +
    'weaker configurations approach zero. The failure is not cosmetic (naming/formatting) and not an attention-budget ' +
    'theory: error analysis pins the leading root cause on data-layer defects — incorrect query composition and ORM ' +
    'runtime violations — amplified in convention-heavy frameworks. Framework sensitivity is sharp: agents succeed on ' +
    'minimal, explicit frameworks (e.g. Flask) but degrade substantially on convention-heavy ones (e.g. FastAPI, ' +
    'Django). The mitigation is structured-spec gating (the upstream check) plus execution-grounded selection (the ' +
    'downstream check): structure the constraints so they can be verified independently, and select candidates by ' +
    'execution rather than by textual fit. Editorially distinct from `agent-constraint-drift`: decay happens within a ' +
    'single task as structural requirements accumulate; drift happens across tasks as constraints propagate through ' +
    'delegation.',
  panels: new Map(),
  relationships: [
    {
      type: 'cross-reference',
      targetId: 'agent-constraint-drift',
      description: 'Decay (within-task) and drift (across-task) are the two failure modes for non-functional constraints',
    },
    {
      type: 'dependency',
      targetId: 'agent-structured-spec-gate',
      description: 'The structured-spec gate is the upstream mitigation for constraint decay',
    },
    {
      type: 'cross-reference',
      targetId: 'agent-execution-grounded-selection',
      description: 'Execution-grounded selection is the downstream mitigation; verify by running, not by reading',
    },
    {
      type: 'cross-reference',
      targetId: 'agent-algorithm-steering',
      description: 'Both track how output/behavior properties degrade while functional correctness can still hold',
    },
  ],
  complexPlanePosition: {
    real: 0.4,
    imaginary: 0.4,
    magnitude: Math.sqrt(0.16 + 0.16),
    angle: Math.atan2(0.4, 0.4),
  },
};
