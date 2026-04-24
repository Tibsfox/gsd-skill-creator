/**
 * Hourglass Persistence concept — contraction index on filtered simplicial complexes.
 *
 * Topology wing (persistence / shape analysis).
 * Hourglass Persistence is a variant of standard persistent-homology
 * diagrams that restricts attention to the longest-lived one-dimensional
 * feature and measures how sharply it contracts as the filtration parameter
 * rises. The contraction index distinguishes "load-bearing" paths in a
 * filtered complex from substitutable or redundant paths. For
 * gsd-skill-creator's skill-DAG, Hourglass Persistence provides a scalar
 * diagnostic per path, composable across product sub-DAGs via the Künneth
 * formula for persistence modules. Phase 750 (if-budget) ships this as a
 * substrate module consumable by the session-observatory pipeline.
 *
 * Milestone: v1.49.572 math-foundations-apr2026.
 *
 * @module departments/mathematics/concepts/hourglass-persistence
 */

import type { RosettaConcept } from '../../../rosetta-core/types.js';

// theta ~7*2pi/29, radius ~0.87 (topological ring, slightly less pure than Ricci)
const theta = 7 * 2 * Math.PI / 29;
const radius = 0.87;
const real = radius * Math.cos(theta);
const imaginary = radius * Math.sin(theta);

export const hourglassPersistence: RosettaConcept = {
  id: 'mathematics-hourglass-persistence',
  name: 'Hourglass Persistence',
  domain: 'mathematics',
  description: 'Hourglass Persistence restricts a persistent-homology diagram to ' +
    'the longest-lived one-dimensional feature and measures its contraction rate ' +
    'as the filtration parameter rises. Low contraction indicates a load-bearing ' +
    'path in the filtered complex: the feature retains its topological identity ' +
    'under coarsening. High contraction indicates a substitutable or redundant ' +
    'path: the feature folds quickly into its neighbours. Hourglass Persistence ' +
    'composes cleanly across product complexes via the Künneth formula for ' +
    'persistence modules, which means the contraction index of a product sub-DAG ' +
    'is readable from the contraction indices of its factors. For the skill-DAG, ' +
    'this is the composability property needed so that diagnostics on combined ' +
    'departments reduce to diagnostics on constituent departments. Phase 750 ' +
    '(if-budget) ships the Hourglass Persistence module as a read-only diagnostic ' +
    'alongside the Ricci-Curvature Audit; the two are complementary (curvature is ' +
    'per-edge, hourglass contraction is per-path).',
  panels: new Map([
    ['python', {
      panelId: 'python',
      explanation: 'The gudhi library computes persistence diagrams from a filtered simplicial complex. Hourglass Persistence extracts the longest-lived one-cycle via a one-liner on the diagram and fits a contraction rate via scipy.optimize.curve_fit. The per-path scalar is stored alongside the Ricci-Curvature output for joint visualisation.',
    }],
    ['typescript', {
      panelId: 'typescript',
      explanation: 'The Phase 750 substrate exposes a PersistencePath type with contractionIndex: number and a computeHourglass(complex: FilteredComplex): PersistencePath[] entry point. The Künneth product rule is encoded as a static method on the type so composition is type-checked. Read-only discipline mirrors the Ricci audit.',
    }],
  ]),
  relationships: [
    {
      type: 'cross-reference',
      targetId: 'mathematics-ollivier-ricci-curvature',
      description: 'Hourglass Persistence is the per-path complement of Ollivier-Ricci per-edge curvature; both are M4 substrates for Phase 746 / 750 read-only skill-DAG diagnostics',
    },
    {
      type: 'cross-reference',
      targetId: 'mathematics-fractal-geometry',
      description: 'Hourglass Persistence on self-similar filtered complexes reproduces the classical fractal-persistence scaling laws; the fractal geometry wing supplies the continuous analogue',
    },
  ],
  complexPlanePosition: {
    real,
    imaginary,
    magnitude: Math.sqrt(real * real + imaginary * imaginary),
    angle: Math.atan2(imaginary, real),
  },
};
