import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const complianceTraceCheck: RosettaConcept = {
  id: 'agent-compliance-trace-check',
  name: 'Compliance Trace Check',
  domain: 'agent-systems',
  description:
    'Turning a natural-language operating manual into machine-checkable compliance evidence for a tool-using agent. ' +
    'The 2026 source (MANTRA, arxiv `2605.06334v1`) is a benchmark-SYNTHESIS framework: from the NL manual plus the ' +
    "tool schemas it generates two artifacts in tandem — (i) an independently-derived symbolic world model that " +
    'captures the procedural dependencies of the domain, and (ii) a set of trace-level compliance checks for each ' +
    "task — then SMT-solves the MUTUAL CONSISTENCY of world-model and checks inside a structured repair loop that " +
    'resolves inconsistencies automatically, escalating to human intervention only as a fallback. So the SMT is not ' +
    "merely 'evaluate a predicate against a trace': it validates that the extracted checks are coherent with the " +
    'procedural structure the manual implies. MANTRA reports 285 tasks across 6 domains, with manuals scaling to ' +
    '50+ pages, built with minimal human effort — the granular checks both enforce stronger constraints and support ' +
    'debugging of agent failure modes. Where-used framing: the college applies the same idea as a milestone gate — ' +
    'the pre-tag-gate.sh discipline and CLAUDE.md operative sections become sources of trace-level checks attached ' +
    'to the episode-package schema, so a milestone cannot close with unsatisfied predicates. The distinction to keep: ' +
    "MANTRA's contribution is synthesizing the checkable benchmark and proving it consistent, not the runtime gate itself.",
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'agent-episode-package',
      description: 'Compliance trace checks read episode packages; the package is the substrate',
    },
    {
      type: 'cross-reference',
      targetId: 'agent-constraint-drift',
      description: 'Compliance trace checks are the deterministic mitigation for constraint drift',
    },
    {
      type: 'analogy',
      targetId: 'agent-formal-agent-verification',
      description:
        'Both bring formal methods to agent behavior; MANTRA uses SMT to prove a synthesized compliance benchmark consistent, rather than verifying an agent design directly',
    },
  ],
  complexPlanePosition: {
    real: -0.5,
    imaginary: 0.6,
    magnitude: Math.sqrt(0.25 + 0.36),
    angle: Math.atan2(0.6, -0.5),
  },
};
