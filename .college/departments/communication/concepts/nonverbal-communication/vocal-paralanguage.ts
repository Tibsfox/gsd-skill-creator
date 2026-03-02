import type { RosettaConcept } from '../../../../rosetta-core/types.js';
export const vocalParalanguage: RosettaConcept = {
  id: 'comm-vocal-paralanguage', name: 'Vocal Paralanguage', domain: 'communication',
  description: 'Paralanguage is everything vocal beyond the words themselves: tone (emotional quality), pitch (high/low), rate (speed), volume (loud/soft), and pauses. Paralanguage carries emotional meaning that often contradicts or reinforces verbal content. Sarcasm, enthusiasm, and boredom are communicated almost entirely through paralanguage rather than word choice.',
  panels: new Map(),
  relationships: [{ type: 'dependency', targetId: 'comm-voice-articulation', description: 'Vocal paralanguage builds on voice and articulation fundamentals' }],
  complexPlanePosition: { real: 0.65, imaginary: 0.4, magnitude: Math.sqrt(0.4225 + 0.16), angle: Math.atan2(0.4, 0.65) },
};
