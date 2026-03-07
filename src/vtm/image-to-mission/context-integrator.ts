/**
 * Context Integrator — structures creator-provided context.
 *
 * Runs in parallel with the observation engine (Wave 1B).
 * Structures verbal/text context into typed CreatorContext objects,
 * maps each field to observation layers it modifies, and extracts
 * the process insight — the key understanding about HOW the work
 * was made that changes everything about interpretation.
 */

import type { CreatorContext, ObservationLayer } from './types.js';

/** Mapping of context fields to the observation layers they modify. */
export const LAYER_MAPPINGS: Record<string, readonly string[]> = {
  process: ['spatial', 'relational'],
  intent: ['mood', 'relational'],
  constraints: ['literal', 'spatial'],
  accidents: ['relational', 'mood'],
  multipurpose: ['literal', 'spatial', 'relational', 'mood'],
} as const;

/** Prompt templates for interactive context gathering. */
export const CONTEXT_PROMPTS = {
  process: 'How was this made? Walk me through the steps.',
  intent: 'What were you trying to achieve or create?',
  surprise: 'What happened that you didn\'t plan or expect?',
  layers: 'Does anything in the scene serve more than one purpose?',
  missing: 'What can\'t be seen in the photos that matters?',
} as const;

/** Keywords that signal specific context fields in freeform text. */
const FIELD_SIGNALS: Record<string, readonly string[]> = {
  process: ['built', 'made', 'created', 'constructed', 'placed', 'arranged', 'assembled', 'walked', 'carried'],
  intent: ['wanted', 'goal', 'trying', 'meant', 'purpose', 'designed', 'aimed'],
  constraints: ['couldn\'t', 'limited', 'only had', 'workaround', 'problem', 'difficult'],
  accidents: ['discovered', 'emerged', 'realized', 'noticed', 'unexpected', 'surprise', 'happened'],
  multipurpose: ['also', 'serves', 'double', 'both', 'AND', 'multiple'],
};

/**
 * Parses freeform text into structured CreatorContext fields.
 *
 * Classifies sentences by keyword signals. Sentences matching no
 * signal go to freeform. Multiple matches go to the first matching field.
 */
export function parseFreeform(text: string): CreatorContext {
  if (!text || text.trim().length === 0) {
    return {};
  }

  const sentences = text.split(/[.!?]+/).map(s => s.trim()).filter(Boolean);
  const result: Record<string, string[]> = {
    process: [], intent: [], constraints: [], accidents: [], multipurpose: [], freeform: [],
  };

  for (const sentence of sentences) {
    const lower = sentence.toLowerCase();
    let matched = false;

    for (const [field, signals] of Object.entries(FIELD_SIGNALS)) {
      if (signals.some(kw => lower.includes(kw))) {
        result[field].push(sentence);
        matched = true;
        break;
      }
    }

    if (!matched) {
      result.freeform.push(sentence);
    }
  }

  const context: CreatorContext = {};
  for (const [field, sentences] of Object.entries(result)) {
    if (sentences.length > 0) {
      (context as Record<string, string>)[field] = sentences.join('. ') + '.';
    }
  }
  return context;
}

/**
 * Maps structured context fields to the observation layers they modify.
 *
 * Returns a record of layer names to the context fields that affect them.
 */
export function mapToLayers(
  context: CreatorContext,
): Record<string, string[]> {
  const layerMap: Record<string, string[]> = {
    literal: [], spatial: [], relational: [], mood: [],
  };

  for (const [field, value] of Object.entries(context)) {
    if (value && field in LAYER_MAPPINGS) {
      for (const layer of LAYER_MAPPINGS[field]) {
        layerMap[layer].push(field);
      }
    }
  }

  return layerMap;
}

/**
 * Extracts the process insight — the single most important understanding
 * about HOW the work was made.
 *
 * Looks for cause-and-effect chains, "because" statements,
 * and multi-purpose revelations.
 */
export function extractProcessInsight(context: CreatorContext): string | null {
  if (!context.process && !context.accidents && !context.multipurpose) {
    return null;
  }

  // Priority: accidents (emergent > designed), then multipurpose, then process
  const sources = [context.accidents, context.multipurpose, context.process]
    .filter((s): s is string => !!s);

  if (sources.length === 0) return null;

  // Return the richest source as the insight
  return sources.sort((a, b) => b.length - a.length)[0];
}

/**
 * Full integration: parse input, map to layers, extract insight.
 */
export function integrate(input: string | CreatorContext): {
  context: CreatorContext;
  processInsight: string | null;
  layerMappings: Record<string, string[]>;
} {
  const context = typeof input === 'string' ? parseFreeform(input) : input;
  const processInsight = extractProcessInsight(context);
  const layerMappings = mapToLayers(context);

  return { context, processInsight, layerMappings };
}
