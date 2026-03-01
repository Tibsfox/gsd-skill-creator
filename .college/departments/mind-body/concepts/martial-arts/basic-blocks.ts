import type { RosettaConcept } from '../../../../rosetta-core/types.js';

/**
 * Basic Blocks -- Defensive Coverage and Angles
 *
 * Fundamental blocking techniques that teach defensive body mechanics:
 * high, middle, and low blocks covering the three zones of the body.
 * Taught as movement patterns for solo practice.
 *
 * Cultural attribution: Cross-tradition fundamentals found in Chinese,
 * Japanese, and Korean martial arts.
 *
 * SAFETY: Solo practice only. These are movement pattern exercises.
 */
export const basicBlocks: RosettaConcept = {
  id: 'mb-ma-basic-blocks',
  name: 'Basic Blocks',
  domain: 'mind-body',
  description:
    'Basic blocks are defensive movement patterns that teach body positioning and the concept ' +
    'of covering the three zones: high (head and neck), middle (torso), and low (below the waist). ' +
    'Understanding defensive coverage develops spatial awareness and the ability to coordinate ' +
    'arm position with body position. ' +
    'High Block (solo drill): The forearm sweeps upward from the center of the body, ending above ' +
    'the forehead with the arm angled approximately 45 degrees from vertical. The wrist is slightly ' +
    'higher than the elbow, creating an angled surface. The movement engages the shoulder, core, ' +
    'and the principle of redirecting force upward and away rather than absorbing it. In Japanese arts ' +
    'this is age-uke; in Korean arts, eolgul makgi. ' +
    'Middle Block (solo drill): The forearm sweeps inward across the body from the outside, ending ' +
    'with the fist at shoulder height and the forearm vertical. This covers the solar plexus and ribs. ' +
    'The rotation comes from the hips -- the block is not an arm-only movement but a coordinated ' +
    'turn of the waist that drives the forearm into position. In Japanese arts: soto-uke or uchi-uke; ' +
    'in Korean arts: momtong makgi. ' +
    'Low Block (solo drill): The forearm sweeps downward across the body, ending with the arm ' +
    'approximately 45 degrees from the torso, fist just above knee height. This defends the lower ' +
    'abdomen and thighs. The sweeping motion uses hip rotation and gravity. In Japanese arts: gedan-barai; ' +
    'in Korean arts: arae makgi. ' +
    'Blocking principle: Each block covers a zone while leaving the other hand in ready position to ' +
    'respond to the next action. Blocks are practiced in sequence (high-middle-low) as a coordination ' +
    'drill, developing the ability to move the arms independently while maintaining stable stances. ' +
    'Training note: These are solo movement pattern exercises for developing defensive body mechanics.',
  panels: new Map(),
  relationships: [
    {
      type: 'cross-reference',
      targetId: 'mb-ma-basic-strikes',
      description: 'Blocks and strikes are complementary -- blocks create defensive coverage that enables counter-striking opportunities',
    },
    {
      type: 'cross-reference',
      targetId: 'mb-ma-simple-form',
      description: 'The simple form integrates blocks with stances and strikes in choreographed patterns',
    },
    {
      type: 'cross-reference',
      targetId: 'mb-ma-cat-stance',
      description: 'Cat stance pairs naturally with blocking techniques due to its back-weighted defensive readiness',
    },
  ],
  complexPlanePosition: {
    real: 0.7,
    imaginary: 0.15,
    magnitude: Math.sqrt(0.49 + 0.0225),
    angle: Math.atan2(0.15, 0.7),
  },
};
