import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const nutritionResearchLiteracy: RosettaConcept = {
  id: 'nutr-nutrition-research-literacy',
  name: 'Nutrition Research Literacy',
  domain: 'nutrition',
  description: 'Nutrition science has a replication problem -- understanding research design is essential to navigating conflicting headlines. ' +
    'Observational studies: track what people eat and correlate with health outcomes. Cannot establish causation. Confounded by healthy user bias. ' +
    'Randomized controlled trials (RCTs): the gold standard -- randomly assign intervention. Hard to conduct in nutrition (can\'t blind food). ' +
    'Systematic reviews and meta-analyses: synthesize multiple studies -- higher level of evidence than individual studies. ' +
    '"Coffee causes cancer" → "coffee prevents cancer": a single study should not change behavior. Await replication and systematic review. ' +
    'Effect sizes matter: statistically significant ≠ clinically meaningful. A food associated with 5% increased risk from a baseline of 1% still produces rare risk. ' +
    'Industry funding: nutrition research funded by food companies tends to produce favorable results -- conflicts of interest are pervasive. ' +
    'Food frequency questionnaires (FFQs): the standard dietary assessment tool -- relies on self-report over extended periods, notoriously inaccurate. ' +
    'Healthy user bias: people who take supplements also tend to exercise more, smoke less, etc. -- hard to isolate supplement effects.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'nutr-reading-food-labels',
      description: 'Nutritional literacy extends beyond labels to understanding the research behind health claims -- labels are one layer, evidence is the foundation',
    },
    {
      type: 'cross-reference',
      targetId: 'log-scientific-reasoning',
      description: 'Evaluating nutrition research requires scientific reasoning skills -- the hypothetico-deductive method and understanding of research design apply directly',
    },
  ],
  complexPlanePosition: {
    real: 0.6,
    imaginary: 0.5,
    magnitude: Math.sqrt(0.36 + 0.25),
    angle: Math.atan2(0.5, 0.6),
  },
};
