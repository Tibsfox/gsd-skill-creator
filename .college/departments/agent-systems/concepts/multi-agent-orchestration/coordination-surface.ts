import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const coordinationSurface: RosettaConcept = {
  id: 'agent-coordination-surface',
  name: 'Coordination Surface',
  domain: 'agent-systems',
  description:
    'The configurable architectural layer separating agent logic from information access. Production multi-agent LLM ' +
    'systems fail at 41-87% rates from coordination defects (Nechepurenko & Shuvalov, arxiv 2605.03310), not from base ' +
    'capability — coordination is the dominant failure axis. The coordination surface instantiates as a topology ' +
    '(chain/star/mesh/etc.), a dispatch policy (one-shot, critique-and-route, retrieval-conditioned), and a constraint ' +
    'state (carried across delegations). The paper grounds the abstraction in a concrete instantiation: prediction ' +
    'markets running five reference coordination configurations, scored via a Murphy decomposition of the Brier score ' +
    'so that two configurations sharing one aggregate score still leave distinguishable calibration-versus-' +
    'discrimination signatures. Treating coordination as a *surface* — a thing with shape and properties, not a ' +
    'side-effect of agents talking — is the architectural shift that enables spectral diagnostics, budget algebras, and ' +
    'constraint maintenance to be applied uniformly. Read the numbers as a methodology-validating first instantiation, ' +
    'not a general cross-model claim: single-model, n=100, with pairwise tests that do not survive Bonferroni ' +
    'correction, so the 41-87% figure and the *dominant failure axis* framing are directional.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'agent-spectral-topology',
      description: 'Spectral topology diagnostics operate on the row-stochastic operator P that defines the coordination surface',
    },
    {
      type: 'dependency',
      targetId: 'agent-constraint-drift',
      description: 'Constraint drift is measured along the surfaces of coordination — delegation, memory, tool use, audit',
    },
    {
      type: 'cross-reference',
      targetId: 'code-system-architecture',
      description: 'Coordination surface is the agent-systems analogue of software architecture — the configurable structure that hosts behaviour',
    },
  ],
  complexPlanePosition: {
    real: -0.4,
    imaginary: 0.6,
    magnitude: Math.sqrt(0.16 + 0.36),
    angle: Math.atan2(0.6, -0.4),
  },
};
