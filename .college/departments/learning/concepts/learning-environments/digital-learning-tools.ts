import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const digitalLearningTools: RosettaConcept = {
  id: 'learn-digital-learning-tools',
  name: 'Digital Learning Tools',
  domain: 'learning',
  description:
    'Digital tools can either enhance or undermine learning depending on how they are used. ' +
    'Spaced repetition systems (Anki, Quizlet Learn) algorithmically schedule flashcard reviews ' +
    'at optimal intervals — the single most evidence-backed digital learning tool. Concept mapping ' +
    'software (Miro, Coggle) externalizes relationships between ideas, supporting elaborative ' +
    'encoding. Video resources (Khan Academy, 3Blue1Brown, Crash Course) work best when paused ' +
    'frequently to self-test rather than watched passively. Note-taking apps (Notion, Obsidian) ' +
    'enable linking and retrieval across a personal knowledge base. Pomodoro timer apps support ' +
    'structured focus intervals (25 min work, 5 min break). Risks of digital tools: ' +
    'pseudo-productivity (organizing notes without learning), notification-driven distraction, ' +
    'and over-reliance on highlights and re-reading. The test: does using this tool require active ' +
    'generation, retrieval, or application of knowledge? If passive (scrolling, highlighting, ' +
    're-reading), it likely produces illusions of competence rather than durable learning.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'learn-study-environment',
      description: 'Digital tools are a key component of the modern study environment that must be deliberately configured',
    },
    {
      type: 'analogy',
      targetId: 'learn-collaborative-learning',
      description: 'Both digital tools and collaborative learning can supplement or replace passive study methods with active engagement',
    },
  ],
  complexPlanePosition: {
    real: 0.7,
    imaginary: 0.3,
    magnitude: Math.sqrt(0.49 + 0.09),
    angle: Math.atan2(0.3, 0.7),
  },
};
