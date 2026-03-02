import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const openSource: RosettaConcept = {
  id: 'code-open-source',
  name: 'Open Source Software',
  domain: 'coding',
  description: 'Software whose source code is publicly available for inspection, modification, and distribution. ' +
    'The Linux kernel (99% of servers), Python, Firefox, Android, Chromium, NumPy, React -- ' +
    'the internet runs on open source. ' +
    'Licenses determine what you can do: MIT (do anything), GPL (derivatives must also be open source), ' +
    'Apache (patent protection included). ' +
    'GitHub is the center of gravity for open source contribution. ' +
    'Contributing: fork the repo, fix a bug or add a feature, open a pull request. ' +
    'The bazaar model (Eric Raymond): many eyes make bugs shallow -- open code is more secure ' +
    'because anyone can find vulnerabilities. ' +
    'The tragedy: maintainers burn out, critical infrastructure left unmaintained (log4j, xz utils).',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'code-peer-review',
      description: 'Open source contribution is peer review at scale -- the pull request is the code review mechanism',
    },
    {
      type: 'cross-reference',
      targetId: 'econ-market-failures',
      description: 'Open source software is a public good -- its production has classic public goods coordination problems',
    },
  ],
  complexPlanePosition: {
    real: 0.45,
    imaginary: 0.6,
    magnitude: Math.sqrt(0.2025 + 0.36),
    angle: Math.atan2(0.6, 0.45),
  },
};
