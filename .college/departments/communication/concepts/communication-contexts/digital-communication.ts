import type { RosettaConcept } from '../../../../rosetta-core/types.js';
export const digitalCommunication: RosettaConcept = {
  id: 'comm-digital-communication', name: 'Digital Communication', domain: 'communication',
  description: 'Digital communication (email, messaging, video calls) lacks nonverbal cues, making tone harder to convey and misinterpretation more likely. Best practices: be explicit about tone, use clear subject lines, respond promptly, avoid sarcasm without clear context, and choose the right medium for the message. Written digital communication creates permanent records -- a consideration for all content.',
  panels: new Map(),
  relationships: [{ type: 'dependency', targetId: 'comm-register-formality', description: 'Digital communication requires careful register calibration since tone cues are absent' }],
  complexPlanePosition: { real: 0.65, imaginary: 0.4, magnitude: Math.sqrt(0.4225 + 0.16), angle: Math.atan2(0.4, 0.65) },
};
