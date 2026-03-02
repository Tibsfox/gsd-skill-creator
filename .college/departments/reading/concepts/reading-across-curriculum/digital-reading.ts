import type { RosettaConcept } from '../../../../rosetta-core/types.js';
export const digitalReading: RosettaConcept = {
  id: 'read-digital-reading',
  name: 'Digital Reading & Source Evaluation',
  domain: 'reading',
  description: 'Digital reading differs from print: non-linear navigation via hyperlinks, multimodal content (text, images, video, audio), and the need to evaluate sources in real time. Lateral reading (opening multiple tabs to verify source credibility rather than reading deeply within one source) is more effective than traditional source evaluation strategies for online information.',
  panels: new Map(),
  relationships: [
    { type: 'dependency', targetId: 'read-evaluating-bias', description: 'Digital source evaluation requires critical reading skills for detecting bias and unreliability' },
    { type: 'cross-reference', targetId: 'crit-media-literacy', description: 'Digital reading connects to media literacy for evaluating online information and news' },
  ],
  complexPlanePosition: { real: 0.55, imaginary: 0.55, magnitude: Math.sqrt(0.3025 + 0.3025), angle: Math.atan2(0.55, 0.55) },
};
