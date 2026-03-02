import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const operatingSystems: RosettaConcept = {
  id: 'diglit-operating-systems',
  name: 'Operating Systems',
  domain: 'digital-literacy',
  description: 'Software that manages hardware resources and provides services to applications. ' +
    'Core functions: process management (running multiple programs simultaneously via time-slicing), ' +
    'memory management (allocating RAM to each program, preventing conflicts), ' +
    'file system (organizing persistent storage into directories and files), ' +
    'device drivers (translating generic I/O calls into hardware-specific commands). ' +
    'Major OS families: Windows (desktop market leader), macOS (Apple hardware), ' +
    'Linux (servers, Android, embedded systems), iOS/Android (mobile). ' +
    'Shell: text interface to the OS. GUI: graphical interface. ' +
    'Permissions model: owner, group, others -- protects files from unauthorized access. ' +
    'Understanding your OS helps you: install software correctly, manage files, diagnose problems, ' +
    'and understand security warnings.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'diglit-hardware-components',
      description: 'OS manages hardware -- understanding hardware first clarifies what the OS controls',
    },
    {
      type: 'cross-reference',
      targetId: 'code-abstraction',
      description: 'An OS is the ultimate abstraction layer -- it hides all hardware details from application developers',
    },
  ],
  complexPlanePosition: {
    real: 0.65,
    imaginary: 0.4,
    magnitude: Math.sqrt(0.4225 + 0.16),
    angle: Math.atan2(0.4, 0.65),
  },
};
