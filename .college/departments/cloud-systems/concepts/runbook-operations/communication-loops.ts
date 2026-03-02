import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const communicationLoops: RosettaConcept = {
  id: 'cloud-communication-loops',
  name: 'Communication Loops',
  domain: 'cloud-systems',
  description:
    'Nine communication loops (CommunicationLoopName) define message routing paths between agent roles. ' +
    'Priority levels (LoopPriority 0-7): ' +
    '0=HALT (highest, emergency stop), ' +
    '1=command (FLIGHT director to all roles), ' +
    '2=execution (PLAN/EXEC/VERIFY cycle), user (CAPCOM to human), health (SURGEON monitoring), cloud-ops (API polling), ' +
    '3=specialist (TOPO routing to CRAFT agents), budget (token tracking), ' +
    '4=doc-sync (documentation drift detection), ' +
    '6=observation (pattern data to skill-creator), ' +
    '7=HEARTBEAT (background monitoring, lowest). ' +
    'Loop names: command, execution, specialist, user, observation, health, budget, cloud-ops, doc-sync. ' +
    'Direction: bidirectional loops carry both requests and responses; unidirectional loops are one-way feeds. ' +
    'Bus arbitration: when multiple loops are active, higher-priority loops preempt lower-priority ones. ' +
    'Practical use: a HALT signal on loop 0 immediately suspends all other loop processing. ' +
    'Budget loop (priority 3) issues warnings at 80% token consumption and blocks at 95%.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'cloud-procedure-execution',
      description: 'Procedure step ifUnexpected escalations trigger higher-priority loops (command or HALT)',
    },
    {
      type: 'cross-reference',
      targetId: 'cloud-runbook-structure',
      description: 'Runbooks operate within the execution loop and can escalate to command loop on failure',
    },
  ],
  complexPlanePosition: {
    real: 0.62,
    imaginary: 0.45,
    magnitude: Math.sqrt(0.62 ** 2 + 0.45 ** 2),
    angle: Math.atan2(0.45, 0.62),
  },
};
