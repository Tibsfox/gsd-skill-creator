import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const searchStrategies: RosettaConcept = {
  id: 'diglit-search-strategies',
  name: 'Search Engine Strategies',
  domain: 'digital-literacy',
  description: 'Effective searching requires understanding how search engines rank and retrieve results. ' +
    'Boolean operators: "climate change" AND policy (both terms), OR for alternatives, - to exclude. ' +
    'Exact phrase: "climate change policy" in quotes requires exact phrase. ' +
    'Site operator: site:gov limits to government sources. ' +
    'Filetype: filetype:pdf to find PDF documents. ' +
    'Date range: restrict to recent results to find current information. ' +
    'The filter bubble: search engines personalize results based on your history -- ' +
    'you and a friend searching the same query may see different results. ' +
    'Search engines optimize for engagement, not truth -- high-quality results are not the same as high-ranked results. ' +
    'Use multiple search engines and evaluate results with SIFT before accepting them.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'diglit-source-credibility',
      description: 'Better search finds more sources; credibility evaluation determines which to trust',
    },
    {
      type: 'cross-reference',
      targetId: 'diglit-recommendation-systems',
      description: 'Search engines are recommendation systems -- the same personalization and filter bubble mechanisms apply',
    },
  ],
  complexPlanePosition: {
    real: 0.7,
    imaginary: 0.3,
    magnitude: Math.sqrt(0.49 + 0.09),
    angle: Math.atan2(0.3, 0.7),
  },
};
