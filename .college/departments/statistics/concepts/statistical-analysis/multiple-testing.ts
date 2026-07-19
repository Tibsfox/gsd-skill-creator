import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const multipleTesting: RosettaConcept = {
  id: 'stat-multiple-testing',
  name: 'Multiple Testing',
  domain: 'statistics',
  description:
    'When many hypotheses are tested at once, the per-test error rate compounds: running m independent tests each at level α gives a family-wise error rate (FWER) of 1 − (1 − α)^m, which approaches 1 as m grows. ' +
    'Two correction families control this. FWER control bounds the probability of any false positive — the Bonferroni correction tests each hypothesis at α/m, and Holm\'s step-down procedure does so with more power by sorting the p-values ascending, comparing the i-th smallest to α/(m − i + 1), and rejecting until the first comparison that fails. ' +
    'False discovery rate (FDR) control instead bounds the expected proportion of false positives among rejections — the Benjamini-Hochberg procedure ranks p-values and rejects up to the largest k where p(k) ≤ (k/m)·α, tolerating some false positives to gain sensitivity in high-dimensional screening; this FDR guarantee holds under independence or positive regression dependence (PRDS), and the Benjamini-Yekutieli variant restores it under arbitrary dependence at the cost of a stricter threshold. ' +
    'The trade-off is concrete: with m = 5 and α = 0.05, sorted p-values 0.005, 0.02, 0.03, 0.045, 0.06 give Bonferroni a fixed cutoff of α/m = 0.01 that rejects only the first, while BH\'s sliding cutoff (k/m)·α rejects the first three (the largest k with p(k) ≤ (k/5)·0.05 is k = 3, since 0.03 ≤ 0.03). ' +
    'Choosing FWER versus FDR is a power-versus-strictness trade-off set by the cost of a single false claim (June-2026 arXiv 2606.26781).',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'stat-hypothesis-testing',
      description: 'Multiple testing generalizes a single hypothesis test to a family of simultaneous tests, where an uncorrected per-comparison α no longer controls error across the family',
    },
    {
      type: 'cross-reference',
      targetId: 'stat-distributions',
      description: 'FWER and FDR corrections both reason about the joint distribution of p-values across the tested family under the null',
    },
  ],
  complexPlanePosition: {
    real: 0.55,
    imaginary: 0.75,
    magnitude: Math.sqrt(0.3025 + 0.5625),
    angle: Math.atan2(0.75, 0.55),
  },
};
