/**
 * Drift Detection concept -- DriftLens / D3Bench tooling for LLM drift monitoring.
 *
 * Greco et al. (2024) built DriftLens as a concept-drift detection tool
 * transferring classical ML drift methods (MMD, ADWIN, Page-Hinkley) to the
 * LLM context. Muller et al. (2024) introduced D3Bench as a microbenchmark.
 *
 * @module departments/data-science/concepts/drift-detection
 */

import type { RosettaConcept } from '../../../rosetta-core/types.js';

// theta ~3*2pi/23, radius ~0.76 (applied tooling, concrete side)
const theta = 3 * 2 * Math.PI / 23;
const radius = 0.76;
const real = radius * Math.cos(theta);
const imaginary = radius * Math.sin(theta);

export const driftDetection: RosettaConcept = {
  id: 'data-science-drift-detection',
  name: 'Drift Detection',
  domain: 'data-science',
  description: 'Drift detection in LLM systems adapts classical concept-drift ' +
    'monitoring methods (Maximum Mean Discrepancy, ADWIN, Page-Hinkley test) ' +
    'to the continuous-output setting where ground-truth labels are delayed or ' +
    'absent. DriftLens (Greco et al. 2024) provides a concept-drift detection ' +
    'toolkit for embedding-space monitoring; D3Bench (Muller et al. 2024) is a ' +
    'microbenchmark suite covering 12 drift types across 8 LLM families. ' +
    'Together they form the practical tooling layer for the drift taxonomy\'s ' +
    'detection axis, sitting above raw SD scoring and below deployment-level ' +
    'observability platforms.',
  panels: new Map(),
  relationships: [
    {
      type: 'cross-reference',
      targetId: 'data-science-semantic-drift',
      description: 'Drift detection tools consume SD-score timeseries to trigger alerts when paragraph-level drift exceeds a threshold',
    },
    {
      type: 'cross-reference',
      targetId: 'data-science-knowledge-drift',
      description: 'Knowledge-drift monitoring is the primary use case for D3Bench\'s factual-recall drift category',
    },
    {
      type: 'dependency',
      targetId: 'data-hypothesis-testing',
      description: 'Page-Hinkley and ADWIN are sequential hypothesis tests; understanding drift detection requires fluency with p-values and change-point statistics',
    },
  ],
  complexPlanePosition: {
    real,
    imaginary,
    magnitude: Math.sqrt(real * real + imaginary * imaginary),
    angle: Math.atan2(imaginary, real),
  },
};
