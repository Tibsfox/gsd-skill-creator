/**
 * Compression Spectrum concept -- unified memory/skills/rules compression axis.
 *
 * Shen et al. (2026, arXiv:2604.15877) frame memory, skills, and rules as three points
 * on a single compression axis: 5-20x for episodic memory, 50-500x for procedural
 * skills, 1000x+ for declarative rules. Citation analysis of 1,136 references across
 * 22 papers shows cross-community citation rate below 1%. Identifies the missing
 * diagonal: no surveyed system supports adaptive cross-level compression --
 * precisely the diagonal gsd-skill-creator's memory-in-CLAUDE.md / skills-in-SKILL.md /
 * rules-in-hooks split already implements implicitly.
 *
 * @module departments/data-science/concepts/compression-spectrum
 */

import type { RosettaConcept } from '../../../rosetta-core/types.js';

// theta ~9*2pi/23, radius ~0.83 (information-theoretic, somewhat abstract)
const theta = 9 * 2 * Math.PI / 23;
const radius = 0.83;
const real = radius * Math.cos(theta);
const imaginary = radius * Math.sin(theta);

export const compressionSpectrum: RosettaConcept = {
  id: 'data-science-compression-spectrum',
  name: 'Experience Compression Spectrum',
  domain: 'data-science',
  description: 'The Experience Compression Spectrum unifies three traditionally ' +
    'separate storage models (episodic memory, procedural skills, declarative ' +
    'rules) as points on a single compression axis. Shen et al. (2026) report ' +
    'compression ratios of 5-20x for episodic memory, 50-500x for procedural ' +
    'skills, and over 1000x for declarative rules. Their citation analysis across ' +
    '22 papers shows cross-community citation rate below 1 percent, indicating ' +
    'that the three levels are typically studied in isolation. The paper identifies ' +
    'the "missing diagonal": no surveyed system supports adaptive cross-level ' +
    'compression where material flows between levels based on usage. For ' +
    'gsd-skill-creator, this is the theoretical frame for the College of Knowledge ' +
    'and Rosetta Core: each concept lives at a specific compression level, with ' +
    'promotion/demotion moves along the spectrum as usage patterns change.',
  panels: new Map(),
  relationships: [
    {
      type: 'cross-reference',
      targetId: 'ai-computation-evidence-centric-reasoning',
      description: 'Evidence-centric reasoning edges sit at the high-compression end of the spectrum, encoding accumulated judgment as declarative-rule-like artifacts',
    },
    {
      type: 'cross-reference',
      targetId: 'ai-computation-capability-evolution',
      description: 'Capability modules occupy the procedural-skill middle band of the spectrum; their evolution is adaptive compression over usage',
    },
    {
      type: 'cross-reference',
      targetId: 'data-science-drift-detection',
      description: 'Compression-level transitions are themselves detectable drift events; monitoring which material is flowing between levels is a drift signal',
    },
  ],
  complexPlanePosition: {
    real,
    imaginary,
    magnitude: Math.sqrt(real * real + imaginary * imaginary),
    angle: Math.atan2(imaginary, real),
  },
};
