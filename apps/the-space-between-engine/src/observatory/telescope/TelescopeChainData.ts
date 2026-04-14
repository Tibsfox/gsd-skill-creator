/**
 * Telescope Chain Data
 *
 * Four parallel chains showing the same 8 foundations through
 * different lenses: Mathematics, Nature, Skill-Creator, and
 * the Hundred Voices literary bridge.
 */

import type { TelescopeChain, TelescopeNode, FoundationId } from '../../types/index.js';
import { FOUNDATION_ORDER } from '../../types/index.js';

// ─── Math Chain ──────────────────────────────────────
// The sequential mathematical progression

const mathChain: TelescopeNode[] = [
  {
    foundationId: 'unit-circle',
    chain: 'math',
    label: 'Unit Circle',
    description: 'A circle of radius one encoding every angle and every ratio.',
  },
  {
    foundationId: 'pythagorean',
    chain: 'math',
    label: 'Pythagorean Theorem',
    description: 'The relationship between sides of a right triangle.',
  },
  {
    foundationId: 'trigonometry',
    chain: 'math',
    label: 'Trigonometry',
    description: 'The mathematics of periodic motion and oscillation.',
  },
  {
    foundationId: 'vector-calculus',
    chain: 'math',
    label: 'Vector Calculus',
    description: 'Fields, gradients, and forces that vary through space.',
  },
  {
    foundationId: 'set-theory',
    chain: 'math',
    label: 'Set Theory',
    description: 'The foundations of belonging, boundaries, and identity.',
  },
  {
    foundationId: 'category-theory',
    chain: 'math',
    label: 'Category Theory',
    description: 'Structure-preserving maps between mathematical worlds.',
  },
  {
    foundationId: 'information-theory',
    chain: 'math',
    label: 'Information Theory',
    description: 'The mathematics of communication, encoding, and entropy.',
  },
  {
    foundationId: 'l-systems',
    chain: 'math',
    label: 'L-Systems',
    description: 'Formal rewriting systems that generate fractal complexity.',
  },
];

// ─── Nature Chain ────────────────────────────────────
// Each foundation seen through a natural phenomenon

const natureChain: TelescopeNode[] = [
  {
    foundationId: 'unit-circle',
    chain: 'nature',
    label: 'Earth Rotation',
    description: 'The planet turning on its axis, tracing circles through the sky.',
  },
  {
    foundationId: 'pythagorean',
    chain: 'nature',
    label: 'Spider Webs',
    description: 'Structural tension where every distance obeys a hidden law.',
  },
  {
    foundationId: 'trigonometry',
    chain: 'nature',
    label: 'Tides',
    description: 'The moon pulling oceans in slow, periodic waves.',
  },
  {
    foundationId: 'vector-calculus',
    chain: 'nature',
    label: 'Wind',
    description: 'Invisible arrows at every point, pushing in different directions.',
  },
  {
    foundationId: 'set-theory',
    chain: 'nature',
    label: 'Identity',
    description: 'A river changing every molecule yet remaining itself.',
  },
  {
    foundationId: 'category-theory',
    chain: 'nature',
    label: 'Metamorphosis',
    description: 'Caterpillar to butterfly — form changes, essence preserved.',
  },
  {
    foundationId: 'information-theory',
    chain: 'nature',
    label: 'Birdsong',
    description: 'Meaning encoded in patterns of sound across noisy forests.',
  },
  {
    foundationId: 'l-systems',
    chain: 'nature',
    label: 'Growth',
    description: 'A fern unfurling from simple rules into fractal beauty.',
  },
];

// ─── Skill-Creator Chain ─────────────────────────────
// Each foundation mapped to a skill-creator concept

const skillCreatorChain: TelescopeNode[] = [
  {
    foundationId: 'unit-circle',
    chain: 'skill-creator',
    label: '\u03B8 Position',
    description: 'Angular position on the complex plane encoding skill identity.',
  },
  {
    foundationId: 'pythagorean',
    chain: 'skill-creator',
    label: 'Activation Magnitude',
    description: 'The distance from origin measuring activation strength.',
  },
  {
    foundationId: 'trigonometry',
    chain: 'skill-creator',
    label: 'Angular Velocity',
    description: 'Rate of traversal through the skill progression arc.',
  },
  {
    foundationId: 'vector-calculus',
    chain: 'skill-creator',
    label: 'Gradient Descent',
    description: 'Following the steepest path toward optimal skill configuration.',
  },
  {
    foundationId: 'set-theory',
    chain: 'skill-creator',
    label: 'Membership Functions',
    description: 'Rules defining which skills belong to which categories.',
  },
  {
    foundationId: 'category-theory',
    chain: 'skill-creator',
    label: 'Functors',
    description: 'Structure-preserving maps between skill domains.',
  },
  {
    foundationId: 'information-theory',
    chain: 'skill-creator',
    label: 'Channel Capacity',
    description: 'Maximum information throughput of a learning pipeline.',
  },
  {
    foundationId: 'l-systems',
    chain: 'skill-creator',
    label: 'Promotion Pipeline',
    description: 'Recursive skill growth from simple rules to complex mastery.',
  },
];

// ─── Hundred Voices Chain ────────────────────────────
// Each foundation mapped to a literary voice

const hundredVoicesChain: TelescopeNode[] = [
  {
    foundationId: 'unit-circle',
    chain: 'hundred-voices',
    label: 'Hemingway',
    description: 'Compression as art. Economy as revelation. Four words bearing the weight of twenty.',
  },
  {
    foundationId: 'pythagorean',
    chain: 'hundred-voices',
    label: 'Woolf',
    description: 'Independent consciousnesses locked in structural relationship.',
  },
  {
    foundationId: 'trigonometry',
    chain: 'hundred-voices',
    label: 'Morrison',
    description: 'Prose that builds in waves — amplitude, frequency, interference.',
  },
  {
    foundationId: 'vector-calculus',
    chain: 'hundred-voices',
    label: 'Pynchon',
    description: 'Narratives as fields: direction and magnitude at every point.',
  },
  {
    foundationId: 'set-theory',
    chain: 'hundred-voices',
    label: 'Borges',
    description: 'Stories at the edge where classification consumes itself.',
  },
  {
    foundationId: 'category-theory',
    chain: 'hundred-voices',
    label: 'Le Guin',
    description: 'Translation between radically different worlds, preserving structural truth.',
  },
  {
    foundationId: 'information-theory',
    chain: 'hundred-voices',
    label: 'Calvino',
    description: 'Fiction about fiction — messages about the nature of messages.',
  },
  {
    foundationId: 'l-systems',
    chain: 'hundred-voices',
    label: 'Everett',
    description: 'Novels containing smaller versions of themselves, recursion as narrative.',
  },
];

// ─── Export ──────────────────────────────────────────

export const telescopeChains: Record<TelescopeChain, TelescopeNode[]> = {
  math: mathChain,
  nature: natureChain,
  'skill-creator': skillCreatorChain,
  'hundred-voices': hundredVoicesChain,
};

export const CHAIN_LABELS: Record<TelescopeChain, string> = {
  math: 'Mathematics',
  nature: 'Nature',
  'skill-creator': 'Skill-Creator',
  'hundred-voices': 'Hundred Voices',
};

export const CHAIN_ORDER: TelescopeChain[] = ['math', 'nature', 'skill-creator', 'hundred-voices'];

/**
 * Get all telescope nodes for a given foundation across all chains.
 */
export function getNodesForFoundation(id: FoundationId): TelescopeNode[] {
  return CHAIN_ORDER.map((chain) => {
    const nodes = telescopeChains[chain];
    return nodes.find((n) => n.foundationId === id)!;
  });
}

/**
 * Validate that all chains have exactly 8 nodes matching FOUNDATION_ORDER.
 */
export function validateChains(): boolean {
  for (const chain of CHAIN_ORDER) {
    const nodes = telescopeChains[chain];
    if (nodes.length !== FOUNDATION_ORDER.length) return false;
    for (let i = 0; i < FOUNDATION_ORDER.length; i++) {
      if (nodes[i].foundationId !== FOUNDATION_ORDER[i]) return false;
      if (nodes[i].chain !== chain) return false;
    }
  }
  return true;
}
