/**
 * Runtime Skill-Spec Enforcement -- agent-systems concept (June-2026 arXiv additional scan, T2).
 * @module departments/agent-systems/concepts/security/runtime-skill-spec-enforcement
 */

import type { RosettaConcept } from '../../../../rosetta-core/types.js';

const theta = 111 * 2 * Math.PI / 47;
const radius = 0.85;
const real = radius * Math.cos(theta);
const imaginary = radius * Math.sin(theta);

export const runtimeSkillSpecEnforcement: RosettaConcept = {
  id: "agent-runtime-skill-spec-enforcement",
  name: "Runtime Skill-Spec Enforcement",
  domain: 'agent-systems',
  description:
    "Runtime Skill-Spec Enforcement, named VIGIL, is an end-to-end framework that makes natural-language skill specifications executable by checking an agent's actual execution trace against behavioral policies drawn from skill specs, operator-defined constraints, and global cross-skill rules (arXiv 2606.26524, 2026). Its distinct contribution is confronting the contextual-granularity problem: a monitor must decide which tool events to observe, what state to retain, how far across the trace to reason, and where to intervene. VIGIL's policy language expresses temporal dependencies, argument constraints, and value-flow conditions over agent-tool events, and symbolic rules compile each policy into SMT constraints over finite traces, catching violations that surface only across ordered multi-call executions rather than single-call filters. On office-document, operational, and engineering runs it reports over 95% recall with a false-positive rate below 10%. The implication for building agent systems: skill permission text becomes an enforced runtime guardrail, not mere documentation.",
  panels: new Map(),
  relationships: [
    {
      type: "dependency",
      targetId: "agent-verifiable-skill-contract",
      description: "VIGIL depends on skills carrying declarable contracts: it takes the natural-language access, disclosure, privilege, and precondition boundaries a skill contract states and compiles them into runtime-checkable trace policies.",
    },
    {
      type: "cross-reference",
      targetId: "agent-compliance-trace-check",
      description: "Both audit an agent's realized execution trace against declared policy, but VIGIL extends single-pass compliance checking with temporal-order, argument, and cross-call value-flow conditions evaluated over finite traces.",
    },
    {
      type: "analogy",
      targetId: "agent-formal-agent-verification",
      description: "VIGIL acts like formal verification moved to runtime: rather than proving properties statically, it discharges each skill-policy obligation as an SMT constraint over the concrete finite execution trace and intervenes on violation.",
    },
  ],
  complexPlanePosition: {
    real,
    imaginary,
    magnitude: Math.sqrt(real * real + imaginary * imaginary),
    angle: Math.atan2(imaginary, real),
  },
};
