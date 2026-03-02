import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const procedureExecution: RosettaConcept = {
  id: 'cloud-procedure-execution',
  name: 'Procedure Execution',
  domain: 'cloud-systems',
  description:
    'ProcedureStep is the atomic unit of runbook execution. Each step has: ' +
    'stepNumber (1-based integer), instruction (the action to perform), ' +
    'expectedResult (what the operator should observe after executing), ' +
    'ifUnexpected (contingency action if the expected result is NOT observed). ' +
    'Execution discipline: read the instruction fully before acting; ' +
    'do not skip steps even if they seem unnecessary; ' +
    'verify the expectedResult before proceeding to the next step. ' +
    'The ifUnexpected field is critical -- it prevents operators from improvising ' +
    'in unexpected situations and escalates to a known safe state (HALT communication loop priority=0). ' +
    'Step granularity: each step should be one atomic action that can be verified in isolation. ' +
    'Avoid compound steps like "create network and router" -- split into two steps with separate ' +
    'verification checks. Timeout handling: steps with external service calls should specify ' +
    'a timeout and what to do if the service does not respond within that time. ' +
    'Communication loop context: procedure execution is governed by the execution loop (priority 2).',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'cloud-runbook-structure',
      description: 'ProcedureSteps are the ordered list within a Runbook and follow its preconditions',
    },
    {
      type: 'cross-reference',
      targetId: 'cloud-communication-loops',
      description: 'Step ifUnexpected escalation triggers the command loop (priority 1) or HALT (priority 0)',
    },
  ],
  complexPlanePosition: {
    real: 0.68,
    imaginary: 0.38,
    magnitude: Math.sqrt(0.68 ** 2 + 0.38 ** 2),
    angle: Math.atan2(0.38, 0.68),
  },
};
