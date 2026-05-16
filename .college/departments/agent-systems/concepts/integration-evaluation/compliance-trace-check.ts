import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const complianceTraceCheck: RosettaConcept = {
  id: 'agent-compliance-trace-check',
  name: 'Compliance Trace Check',
  domain: 'agent-systems',
  description:
    'SMT-validatable predicates derived from natural-language operating manuals, evaluated against an execution ' +
    "trace. The 2026 framing (MANTRA, arxiv `2605.06334v1`) closes the gap between 'prose policy' and 'enforceable " +
    "check': extract candidate predicates from the manual, normalise them into SMT-LIB form, attach them to the " +
    'episode-package schema, and refuse to close a milestone with unsatisfied predicates. The pattern subsumes the ' +
    'existing pre-tag-gate.sh discipline (the predicates are the gate; the manual is the source) and extends it to ' +
    'any procedure that is documented in prose. Implication: every CLAUDE.md operative-discipline section becomes ' +
    "a candidate for extraction into a compliance-trace predicate, and 'we wrote a rule' graduates into " +
    "'the rule fires automatically'.",
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
      targetId: 'logic-smt-validation',
      description: 'SMT validation from formal-methods, applied to agent-system traces rather than to programs',
    },
  ],
  complexPlanePosition: {
    real: -0.5,
    imaginary: 0.6,
    magnitude: Math.sqrt(0.25 + 0.36),
    angle: Math.atan2(0.6, -0.5),
  },
};
