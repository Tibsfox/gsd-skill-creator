/**
 * Prompt-collecting session processor wrapper.
 *
 * Wraps the existing pattern session processor to also collect user prompts
 * grouped by project slug, without modifying the original processor. The
 * AsyncGenerator can only be consumed once, so this wrapper buffers all
 * entries, routes user-prompts to the collector, then replays entries to
 * the pattern processor via a new generator.
 *
 * Three exported types:
 * - CollectedPrompt: prompt with project context
 * - PromptCollectorResult: prompts grouped by projectSlug
 * - createPromptCollectingProcessor: SessionProcessor factory
 *
 * Implements: CLUST-01 (prompt collection for clustering pipeline)
 */

import type { ParsedEntry, SessionInfo } from './types.js';
import type { PatternAggregator } from './pattern-aggregator.js';
import type { SessionProcessor } from './corpus-scanner.js';
import { createPatternSessionProcessor } from './session-pattern-processor.js';

// ============================================================================
// Types
// ============================================================================

/** Minimum prompt length (after trim) to be collected. Filters noise. */
const MIN_PROMPT_LENGTH = 20;

/**
 * A user prompt collected from a session, annotated with project context.
 */
export interface CollectedPrompt {
  text: string;
  sessionId: string;
  timestamp: string;
  projectSlug: string;
}

/**
 * Result store for collected prompts, grouped by project slug.
 *
 * The Map key is the projectSlug, and the value is an array of prompts
 * from all sessions in that project.
 */
export interface PromptCollectorResult {
  prompts: Map<string, CollectedPrompt[]>;
}

// ============================================================================
// Factory
// ============================================================================

/**
 * Create a SessionProcessor that collects user prompts AND delegates
 * pattern extraction to the existing pattern session processor.
 *
 * Strategy for single-consume AsyncGenerator:
 * 1. Buffer ALL entries from the AsyncGenerator into an array
 * 2. For each buffered entry where kind === 'user-prompt':
 *    - Skip if text.trim().length < 20 (noise filter)
 *    - Add CollectedPrompt to promptStore under session.projectSlug
 * 3. Create a replay generator that yields all buffered entries
 * 4. Call baseProcessor(session, replayGenerator) to delegate pattern extraction
 *
 * The base processor is created ONCE in the factory (outside the returned
 * function) for efficiency.
 *
 * @param patternAggregator - PatternAggregator for tool pattern extraction
 * @param promptStore - Mutable result store where collected prompts accumulate
 * @returns SessionProcessor compatible with CorpusScanner.scan()
 */
export function createPromptCollectingProcessor(
  patternAggregator: PatternAggregator,
  promptStore: PromptCollectorResult,
): SessionProcessor {
  // Create the base pattern processor ONCE (closure over aggregator)
  const baseProcessor = createPatternSessionProcessor(patternAggregator);

  return async (session: SessionInfo, entries: AsyncGenerator<ParsedEntry>): Promise<void> => {
    // 1. Buffer all entries (generator can only be consumed once)
    const buffered: ParsedEntry[] = [];
    for await (const entry of entries) {
      buffered.push(entry);
    }

    // 2. Collect user prompts from buffered entries
    for (const entry of buffered) {
      if (entry.kind !== 'user-prompt') continue;

      const trimmedText = entry.data.text.trim();
      if (trimmedText.length < MIN_PROMPT_LENGTH) continue;

      const collected: CollectedPrompt = {
        text: entry.data.text,
        sessionId: entry.data.sessionId,
        timestamp: entry.data.timestamp,
        projectSlug: session.projectSlug,
      };

      // Group by projectSlug
      const existing = promptStore.prompts.get(session.projectSlug);
      if (existing) {
        existing.push(collected);
      } else {
        promptStore.prompts.set(session.projectSlug, [collected]);
      }
    }

    // 3. Create replay generator for the base pattern processor
    async function* replayEntries(): AsyncGenerator<ParsedEntry> {
      for (const entry of buffered) {
        yield entry;
      }
    }

    // 4. Delegate to pattern processor with replayed entries
    await baseProcessor(session, replayEntries());
  };
}
