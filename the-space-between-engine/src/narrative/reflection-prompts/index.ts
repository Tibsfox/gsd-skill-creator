/**
 * Reflection Prompts
 *
 * At least 2 prompts per foundation plus cross-foundation prompts.
 * These invite learners to connect mathematical ideas to their
 * own lived experience without requiring any mathematical knowledge.
 */

import type { ReflectionPrompt } from '@/types';

export const reflectionPrompts: ReflectionPrompt[] = [
  // ─── Unit Circle ─────────────────────────────────────

  {
    id: 'rp-uc-01',
    foundationId: 'unit-circle',
    prompt:
      'What in your daily life follows a cycle? What looks different at each point but is really one continuous motion?',
    followUp:
      'Can you identify the moment in that cycle where things feel most intense? Where they feel most still?',
  },
  {
    id: 'rp-uc-02',
    foundationId: 'unit-circle',
    prompt:
      'Think of something that returns to where it started but is never quite the same. How is the return different from the departure?',
    followUp:
      'What would it mean for a return to be truly identical to the beginning? Is that possible?',
  },

  // ─── Pythagorean ─────────────────────────────────────

  {
    id: 'rp-py-01',
    foundationId: 'pythagorean',
    prompt:
      'Have you ever built something where changing one part forced another part to change? What was the invisible constraint connecting them?',
    followUp:
      'Could you have predicted the second change from the first? What would you need to know?',
  },
  {
    id: 'rp-py-02',
    foundationId: 'pythagorean',
    prompt:
      'Think of a shortcut you take regularly. How do you know it is shorter than the long way around? What are you measuring?',
    followUp:
      'Is the shortest path always the best path? When is the longer way around actually better?',
  },

  // ─── Trigonometry ────────────────────────────────────

  {
    id: 'rp-trig-01',
    foundationId: 'trigonometry',
    prompt:
      'What rhythms govern your life? Which ones are fast (heartbeat, breathing) and which are slow (seasons, years)?',
    followUp:
      'What happens when two of your rhythms fall out of sync — say, your sleep cycle and your work schedule?',
  },
  {
    id: 'rp-trig-02',
    foundationId: 'trigonometry',
    prompt:
      'Think about a wave you have seen — in water, in sound, in a crowd. What determines how high it goes? What determines how fast it repeats?',
    followUp:
      'Can you imagine two waves combining? When would they make something bigger, and when would they cancel each other out?',
  },

  // ─── Vector Calculus ─────────────────────────────────

  {
    id: 'rp-vc-01',
    foundationId: 'vector-calculus',
    prompt:
      'Imagine standing in a field where the wind is blowing. It pushes you one direction, but ten steps away it pushes differently. What is it like to navigate a space where the force changes from point to point?',
    followUp:
      'Have you ever been in a situation where the pressure or influence on you was different depending on exactly where you stood?',
  },
  {
    id: 'rp-vc-02',
    foundationId: 'vector-calculus',
    prompt:
      'Think of a place that feels like a source — where energy or ideas or people seem to flow outward from. Now think of a place that feels like a sink — where things are drawn in and collected. What makes them different?',
    followUp:
      'Can the same place be a source at one time and a sink at another? What changes?',
  },

  // ─── Set Theory ──────────────────────────────────────

  {
    id: 'rp-st-01',
    foundationId: 'set-theory',
    prompt:
      'What boundaries define who you are? What would change if you moved one boundary — if you included something you currently exclude, or excluded something you currently include?',
    followUp:
      'Is there a boundary you have moved in the past that changed how you understood yourself?',
  },
  {
    id: 'rp-st-02',
    foundationId: 'set-theory',
    prompt:
      'Think of a group you belong to. What is the rule that decides who is in and who is out? Is the rule sharp or fuzzy? Who decides?',
    followUp:
      'Can a group exist without a boundary? What would that look like?',
  },

  // ─── Category Theory ─────────────────────────────────

  {
    id: 'rp-ct-01',
    foundationId: 'category-theory',
    prompt:
      'Have you ever learned something in one area of your life that turned out to apply in a completely different area? What was preserved in the translation?',
    followUp:
      'What was lost in the translation? Is there always something that does not survive the crossing?',
  },
  {
    id: 'rp-ct-02',
    foundationId: 'category-theory',
    prompt:
      'Think of two skills or activities that seem unrelated on the surface but feel similar when you are doing them. What is the same about the experience? What is different?',
    followUp:
      'Could you explain the similarity to someone else, or is it something you can only feel?',
  },

  // ─── Information Theory ──────────────────────────────

  {
    id: 'rp-it-01',
    foundationId: 'information-theory',
    prompt:
      'Think of a time you tried to explain something important to someone and the message got distorted. What was lost? What survived? What would you do differently?',
    followUp:
      'How do you decide which details to include when you know you cannot include everything?',
  },
  {
    id: 'rp-it-02',
    foundationId: 'information-theory',
    prompt:
      'When you hear a song you know well, how many notes does it take before you recognize it? What is the minimum amount of information that carries the identity of the song?',
    followUp:
      'What if the song were played in a different key or at a different speed? Would you still recognize it? What is it that you are actually recognizing?',
  },

  // ─── L-Systems ───────────────────────────────────────

  {
    id: 'rp-ls-01',
    foundationId: 'l-systems',
    prompt:
      'Think of a habit or routine you follow every day. What happens when you apply that same small routine over weeks, months, years? What grows from it?',
    followUp:
      'Is the result something you planned, or did it emerge from the repetition itself?',
  },
  {
    id: 'rp-ls-02',
    foundationId: 'l-systems',
    prompt:
      'Look at a tree, a river system, or your own veins. They all branch in similar ways. Why do you think such different things arrive at the same shape?',
    followUp:
      'If you could describe the branching rule in one sentence, what would it be?',
  },

  // ─── Cross-Foundation ────────────────────────────────

  {
    id: 'rp-cross-01',
    prompt:
      'Have you ever realized two things you thought were different were actually the same thing seen from different angles? What shifted in your understanding?',
    followUp:
      'What was the moment of recognition like? Was it gradual or sudden?',
  },
  {
    id: 'rp-cross-02',
    prompt:
      'Think of something simple that creates something complex — a seed becoming a forest, a conversation becoming a friendship. What is the simple thing, and what makes the complexity possible?',
    followUp:
      'Is the complexity contained in the seed, or does it come from somewhere else?',
  },
  {
    id: 'rp-cross-03',
    prompt:
      'Consider a boundary and a rhythm in your life. How do they interact? Does the rhythm respect the boundary, cross it, or dissolve it?',
    followUp:
      'What would happen if the boundary moved? Would the rhythm change too?',
  },
  {
    id: 'rp-cross-04',
    prompt:
      'If you could explain one thing about how the world works to someone from a completely different culture, using no technical language, what would you choose? How would you say it?',
    followUp:
      'What makes that particular truth feel universal? How do you know it applies beyond your own experience?',
  },
];
