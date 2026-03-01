import type { RosettaConcept } from '../../../../rosetta-core/types.js';

/**
 * Push Hands -- Conceptual Principles
 *
 * The principles behind push hands (tui shou) as a training methodology:
 * sensitivity, yielding, and redirecting force. Described CONCEPTUALLY
 * to illuminate why tai chi movements are shaped the way they are.
 *
 * CRITICAL SAFETY NOTE: This concept teaches PRINCIPLES ONLY, not technique.
 * Push hands is a partner practice that requires direct supervision by a
 * qualified instructor. No partner technique instructions are provided here.
 *
 * Cultural attribution: Chinese martial arts tradition, central to all
 * tai chi lineages (Yang, Chen, Wu, Sun).
 */
export const pushHandsConcepts: RosettaConcept = {
  id: 'mb-tc-push-hands-concepts',
  name: 'Push Hands Concepts',
  domain: 'mind-body',
  description:
    'Push hands (推手, tuī shǒu) is a training methodology in tai chi that develops sensitivity to force ' +
    'and the ability to respond without resistance. Understanding push hands concepts illuminates why the ' +
    'slow tai chi form movements are shaped the way they are -- each posture contains principles that are ' +
    'revealed through the interplay of two practitioners. ' +
    'This concept describes PRINCIPLES ONLY. Push hands is a partner practice that requires direct ' +
    'in-person instruction with a qualified teacher. What follows explains the "why" behind tai chi ' +
    'movement shapes, not "how to" perform partner techniques. ' +
    'The principle of Listening (听劲, tīng jìn): The ability to feel the direction, magnitude, and ' +
    'intention of incoming force through physical contact. This sensitivity develops through years of ' +
    'solo form practice -- the slow, attentive movements of the tai chi form train the nervous system ' +
    'to notice subtle sensations that faster movement would obscure. ' +
    'The principle of Yielding (化劲, huà jìn): Rather than meeting incoming force with opposing force, ' +
    'yielding absorbs and redirects. The metaphor is water: push into water and it gives way, flowing ' +
    'around your hand. The force is not stopped but transformed -- redirected along a curved path that ' +
    'dissipates its power. This is why tai chi movements are circular rather than linear. ' +
    'The principle of Redirecting (引劲, yǐn jìn): Leading incoming force slightly off its intended path ' +
    'so that the originator overextends and loses balance. This requires no strength -- only accurate ' +
    'perception of where the force wants to go and a small adjustment to its trajectory. ' +
    'The principle of Central Equilibrium in action: All yielding and redirecting must preserve one\'s own ' +
    'central axis. The practitioner who maintains perfect balance while causing others to lose theirs ' +
    'has understood the deepest teaching of tai chi. ' +
    'Why this matters for solo practice: Understanding these principles transforms the solo form from ' +
    'abstract movement into meaningful practice. When performing "Ward Off" in the form, the practitioner ' +
    'can imagine the quality of receiving and redirecting force, bringing intention and awareness to what ' +
    'might otherwise be empty gestures. ' +
    'Note: These are conceptual principles for understanding tai chi movement. ' +
    'Martial arts skill requires in-person instruction with a qualified teacher.',
  panels: new Map(),
  relationships: [
    {
      type: 'cross-reference',
      targetId: 'mb-tc-tai-chi-principles',
      description: 'Push hands principles directly embody song (relaxation) and zhong ding (central equilibrium) under dynamic conditions',
    },
    {
      type: 'cross-reference',
      targetId: 'mb-ma-hard-soft-distinction',
      description: 'Push hands is the quintessential expression of the "soft" approach -- using sensitivity and yielding rather than opposing force',
    },
    {
      type: 'cross-reference',
      targetId: 'mb-tc-beijing-24-form',
      description: 'The form movements encode push hands principles -- understanding the concepts enriches solo form practice',
    },
  ],
  complexPlanePosition: {
    real: -0.3,
    imaginary: 0.7,
    magnitude: Math.sqrt(0.09 + 0.49),
    angle: Math.atan2(0.7, -0.3),
  },
};
