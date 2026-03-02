import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const debuggingStrategies: RosettaConcept = {
  id: 'code-debugging-strategies',
  name: 'Debugging Strategies',
  domain: 'coding',
  description: 'Systematic approaches for finding and fixing bugs. Amateur debuggers add print ' +
    'statements randomly and hope. Expert debuggers apply the scientific method: hypothesize what ' +
    'is wrong, design a test to confirm or refute, narrow the search space, fix the root cause. ' +
    'Core tools: print/console.log for visibility, interactive debuggers (breakpoints, step through), ' +
    'unit tests that isolate components. ' +
    'Rubber duck debugging: explaining your code line-by-line to an inanimate object often reveals the bug. ' +
    'Read the error message -- it usually tells you exactly what went wrong and where. ' +
    'Reproduce reliably before fixing: a bug you cannot reproduce consistently is very hard to fix.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'code-sequential-thinking',
      description: 'Debugging requires tracing execution step by step to find where behavior diverges from expectation',
    },
    {
      type: 'cross-reference',
      targetId: 'log-argument-evaluation',
      description: 'Debugging applies the same structured evaluation that logic uses to test arguments',
    },
  ],
  complexPlanePosition: {
    real: 0.75,
    imaginary: 0.35,
    magnitude: Math.sqrt(0.5625 + 0.1225),
    angle: Math.atan2(0.35, 0.75),
  },
};
