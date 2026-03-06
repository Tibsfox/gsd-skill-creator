// Reflection Prompts — At least 2 per foundation, plus cross-foundation prompts.
// Each foundation MUST have at least one prompt containing "already know" or equivalent.

import type { ReflectionPrompt, FoundationId } from '../types/index';

export const reflectionPrompts: ReflectionPrompt[] = [

  // ── Unit Circle ─────────────────────────────────────────────

  {
    id: 'uc-prompt-1',
    foundationId: 'unit-circle',
    prompt: 'What in your daily life follows a cycle — something that returns to where it started, over and over, without ever quite being the same twice?',
    followUp: 'Can you identify the "radius" of that cycle — the single thing that stays constant while everything else changes?',
  },
  {
    id: 'uc-prompt-2',
    foundationId: 'unit-circle',
    prompt: 'Before today, what did you already know about circles, rotation, or cycles? What understanding did you bring with you — from clocks, seasons, music, habits, or anything else?',
    followUp: 'How does what you already knew connect to the idea that separate-looking things can be one thing seen from different angles?',
  },

  // ── Pythagorean ─────────────────────────────────────────────

  {
    id: 'py-prompt-1',
    foundationId: 'pythagorean',
    prompt: 'Think of a proportion or distance that feels right to you — a room that feels well-shaped, a musical interval that resolves, a recipe that balances. What makes it feel inevitable rather than arbitrary?',
    followUp: 'Is there something stubbornly precise about it — something that would feel wrong if you changed it even slightly?',
  },
  {
    id: 'py-prompt-2',
    foundationId: 'pythagorean',
    prompt: 'What did you already know about right triangles, distance, or harmony before you arrived here? Maybe from building something, tuning an instrument, or navigating a city grid?',
    followUp: 'Did you know it as a rule, or as a feeling? Is there a difference?',
  },

  // ── Trigonometry ────────────────────────────────────────────

  {
    id: 'tr-prompt-1',
    foundationId: 'trigonometry',
    prompt: 'Where in your life do you feel oscillation — a rising and falling, a back and forth, a rhythm that you ride rather than control?',
    followUp: 'What happens when two of your rhythms align? When they conflict?',
  },
  {
    id: 'tr-prompt-2',
    foundationId: 'trigonometry',
    prompt: 'What did you already know about waves, vibration, or periodic motion? Perhaps from music, from the ocean, from the way your energy rises and falls through a day?',
    followUp: 'If you could "hear" all the oscillations in your life at once, what would the combined wave sound like?',
  },

  // ── Vector Calculus ─────────────────────────────────────────

  {
    id: 'vc-prompt-1',
    foundationId: 'vector-calculus',
    prompt: 'What invisible forces do you navigate every day — social pressures, habits, obligations, desires — that push you in specific directions without being visible?',
    followUp: 'If you could map the "field" of your daily life, where are the regions of high pressure and where does the flow run freely?',
  },
  {
    id: 'vc-prompt-2',
    foundationId: 'vector-calculus',
    prompt: 'What did you already know about fields, gradients, or flow before this? Maybe from weather, from water running downhill, from the way a crowd moves, or from the pull you feel toward certain places?',
    followUp: 'The fox aligns its body to a magnetic field it cannot see. What do you align yourself to without seeing it?',
  },

  // ── Set Theory ──────────────────────────────────────────────

  {
    id: 'st-prompt-1',
    foundationId: 'set-theory',
    prompt: 'Where do you draw the boundary of yourself? Is it your skin? Your thoughts? Your relationships? What belongs to the set called "you" and what is outside it?',
    followUp: 'Has that boundary ever shifted — has something that was "not you" become part of you, or something that was "you" fallen away?',
  },
  {
    id: 'st-prompt-2',
    foundationId: 'set-theory',
    prompt: 'What did you already know about categories, boundaries, and belonging before today? From sorting, from identity, from the experience of being included or excluded?',
    followUp: 'Is the boundary the most interesting part — the edge where inside and outside touch?',
  },
  {
    id: 'st-prompt-3',
    foundationId: 'set-theory',
    prompt: 'Think of a group you belong to. Now think of a group that overlaps with it but is not the same. What lives in the overlap — and what does the overlap tell you that neither group alone could?',
  },

  // ── Category Theory ─────────────────────────────────────────

  {
    id: 'ct-prompt-1',
    foundationId: 'category-theory',
    prompt: 'When have you understood something in one domain by seeing its likeness to something in a completely different domain? A metaphor that was not decoration but genuine insight?',
    followUp: 'What was preserved in the translation? What was lost?',
  },
  {
    id: 'ct-prompt-2',
    foundationId: 'category-theory',
    prompt: 'What did you already know about translation, analogy, and structural similarity? Perhaps from learning a language, reading across genres, switching careers, or teaching someone a skill by comparing it to something they already understood?',
    followUp: 'Is "knowing what something is like" a different kind of knowing than "knowing what something is"? Which is deeper?',
  },

  // ── Information Theory ──────────────────────────────────────

  {
    id: 'it-prompt-1',
    foundationId: 'information-theory',
    prompt: 'Think of the most surprising message you ever received — a sentence that changed everything. Why did those particular words carry so much weight?',
    followUp: 'Would the same words have been surprising if you had expected them? What does that tell you about the relationship between expectation and information?',
  },
  {
    id: 'it-prompt-2',
    foundationId: 'information-theory',
    prompt: 'What did you already know about signals, noise, and communication? From trying to be heard in a noisy room, from reading between the lines, from compressing a long story into a short one?',
    followUp: 'What gets lost when you compress a message — and is what survives the most important part, or just the most compressible?',
  },

  // ── L-Systems ───────────────────────────────────────────────

  {
    id: 'ls-prompt-1',
    foundationId: 'l-systems',
    prompt: 'What small rule or habit in your life, repeated daily, has grown into something far more complex than the rule itself? A practice that became a skill, a routine that became an identity?',
    followUp: 'Could you write down the rule? Is it as simple as you thought, or does writing it reveal hidden complexity?',
  },
  {
    id: 'ls-prompt-2',
    foundationId: 'l-systems',
    prompt: 'What did you already know about growth, recursion, and self-similarity? From watching plants grow, from noticing patterns that repeat at different scales, from building something that used its own output as input?',
    followUp: 'The fern is a sentence that contains itself. What in your life is a sentence that contains itself?',
  },

  // ── Cross-Foundation Prompts ────────────────────────────────

  {
    id: 'cross-circle-growth',
    prompt: 'You began with a circle and arrived at a seed. Both are small, both are complete, both generate more than they seem to contain. What is the circle in your life, and what is the seed — and are they the same thing?',
    followUp: 'If you could "begin again" with what you know now, where would you start?',
  },
  {
    id: 'cross-concrete-abstract',
    prompt: 'At some point in this journey, the questions shifted from "what does it do?" to "what is it?" — from motion to identity, from shape to meaning. Did you feel that shift? Where did it happen for you?',
    followUp: 'Which side feels more like home — the concrete or the abstract? What does that tell you about how you think?',
  },
  {
    id: 'cross-fox-fields',
    prompt: 'The fox navigates by feeling an invisible field. The bird encodes a message in song. The fern grows by repeating a rule. Which of these images resonates most with how you move through the world?',
    followUp: 'What would it feel like to navigate the way the other two do?',
  },
  {
    id: 'cross-already-knew',
    prompt: 'Looking back at all eight foundations, which one did you already know the most about — even if you did not have a name for it? What life experience taught you that mathematics before any classroom did?',
    followUp: 'What does it feel like to discover that something you knew by living has a formal name and a deep structure?',
  },
  {
    id: 'cross-translation',
    prompt: 'Pick any two foundations. How would you explain one to someone who deeply understands the other but has never encountered the first?',
    followUp: 'What survives the translation, and what cannot cross?',
  },
];

const promptsByFoundation = new Map<FoundationId | 'cross', ReflectionPrompt[]>();

for (const prompt of reflectionPrompts) {
  const key = prompt.foundationId ?? 'cross';
  const existing = promptsByFoundation.get(key) ?? [];
  existing.push(prompt);
  promptsByFoundation.set(key, existing);
}

export function getPromptsByFoundation(id?: FoundationId): ReflectionPrompt[] {
  if (id === undefined) {
    // Return cross-foundation prompts
    return promptsByFoundation.get('cross') ?? [];
  }
  return promptsByFoundation.get(id) ?? [];
}

export function getAllPrompts(): ReflectionPrompt[] {
  return reflectionPrompts;
}
