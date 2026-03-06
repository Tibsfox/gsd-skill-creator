/**
 * pattern-summarizer.ts — Session Tracking: Session Distillation
 *
 * WHAT THIS MODULE DOES
 * ---------------------
 * PatternSummarizer takes a list of TranscriptEntry[] from a parsed session
 * and produces a compact SessionObservation that captures the session's key
 * signals: message counts, tool usage, files touched, commands run, and
 * top-N items in each category.
 *
 * WHY COMPRESSION MATTERS
 * ------------------------
 * A 2-hour Claude Code session can produce thousands of transcript entries.
 * Storing all of them verbatim would create massive storage and slow queries.
 * PatternSummarizer distills a session down to what matters for pattern detection:
 *   - How many tool calls? (signal of substantive work)
 *   - Which files were most-accessed? (signal of work focus area)
 *   - Which commands were run? (signal of workflow type)
 *   - Which tools were used most? (signal of work style)
 *
 * This is the "Token-efficient" design principle: store counts and top-N,
 * not full content. A SessionObservation is ~200 bytes, not ~200KB.
 *
 * HOW TOP-N WORKS
 * ---------------
 * The private topN() method ranks items by frequency, then slices to N.
 * This converts "every file touched in the session" to "the 10 most-accessed files."
 * Same logic for commands and tools.
 *
 * Note that topFiles combines read and written files into one ranking.
 * This is intentional: both represent work focus, regardless of direction.
 * Separation is available via TranscriptParser.extractFilePaths() if needed.
 *
 * WHAT GETS CAPTURED
 * ------------------
 * From TranscriptParser:
 *   - extractFilePaths() → read + written file paths
 *   - extractCommands()  → bash command first words (e.g., "git", "npm")
 *   - extractToolCounts() → Map<toolName, count>
 *
 * Computed locally:
 *   - userMessages: entries where role === 'user'
 *   - assistantMessages: entries where role === 'assistant'
 *   - toolCalls: entries where type === 'tool_use'
 *   - durationMinutes: (endTime - startTime) / 60000, rounded
 *
 * These metrics feed PromotionEvaluator's 5-factor scoring:
 *   toolCalls → weight 0.3 (strongest signal)
 *   durationMinutes → weight 0.2
 *   uniqueFilesRead/Written → weight 0.2
 *   userMessages → weight 0.15
 *   topCommands/topFiles/topTools non-empty → weight 0.15
 *
 * ACTIVE SKILLS
 * -------------
 * activeSkills is passed in from SessionEndData rather than extracted from the
 * transcript. Skills are activated via the Claude Code settings/hooks system,
 * not as transcript events. The session hook context provides the skill list.
 *
 * Tracking active skills enables future analysis: "when skill X was active,
 * did sessions score better on promotion criteria?" This connects the skill
 * system's behavior to measurable session outcomes.
 *
 * SESSION SOURCE AND REASON
 * -------------------------
 * source (startup, resume, clear, compact) and reason (clear, logout, etc.) are
 * passed through without modification. These temporal markers enable:
 *   - "What happens after /clear?" (source='clear' in next session)
 *   - "How long do sessions started fresh vs resumed typically run?"
 *   - "Which session end reasons correlate with high tool call counts?"
 *
 * DESIGN APPROACH
 * ---------------
 * PatternSummarizer delegates to TranscriptParser for all parsing concerns.
 * It holds a parser instance but does not re-implement any parsing logic.
 * This is the clean separation: parser owns "what happened", summarizer owns
 * "how to compress it into a useful summary."
 *
 * From CENTERCAMP-PERSONAL-JOURNAL, "Philosophy 3: Making Patterns Visible":
 * "Before you build inference, make sure you can see the patterns that are already there."
 * The summarizer is exactly this: making session patterns visible without inference.
 *
 * @see TranscriptParser (transcript-parser.ts) — provides raw extraction helpers
 * @see SessionObserver (session-observer.ts) — calls summarize() on every session
 * @see PromotionEvaluator (promotion-evaluator.ts) — uses SessionObservation metrics
 * @see CENTERCAMP-PERSONAL-JOURNAL.md — "Philosophy 3: Making Patterns Visible"
 */

import type { TranscriptEntry, SessionObservation } from '../../core/types/observation.js';
import { TranscriptParser } from './transcript-parser.js';

/**
 * Distills a session's TranscriptEntry[] into a compact SessionObservation.
 *
 * Stateless: each summarize() call is independent. Safe as a singleton
 * (SessionObserver holds one instance) or per-session.
 */
export class PatternSummarizer {
  /** Parser used for file path and command extraction — shared logic, no duplication */
  private parser: TranscriptParser;

  constructor() {
    this.parser = new TranscriptParser();
  }

  /**
   * Summarize a session from transcript entries.
   * Token-efficient: stores counts and top-N items, not full content.
   *
   * All metrics are extracted without inference — raw counts and frequencies.
   * No classification, no pattern matching, just signal extraction.
   *
   * @param entries - Parsed (and sidechain-filtered) transcript entries
   * @param sessionId - Unique session identifier
   * @param startTime - Session start Unix timestamp (from SessionStartData cache)
   * @param endTime - Session end Unix timestamp (Date.now() at SessionEnd)
   * @param source - How the session was started
   * @param reason - How the session ended
   * @param activeSkills - Skill names active during the session
   */
  summarize(
    entries: TranscriptEntry[],
    sessionId: string,
    startTime: number,
    endTime: number,
    source: SessionObservation['source'],
    reason: SessionObservation['reason'],
    activeSkills: string[] = []
  ): SessionObservation {
    // Message counts: direct type/role filtering — no ambiguity
    const userMessages = entries.filter(
      e => e.type === 'user' || e.message?.role === 'user'
    ).length;
    const assistantMessages = entries.filter(
      e => e.type === 'assistant' || e.message?.role === 'assistant'
    ).length;
    const toolCalls = entries.filter(e => e.type === 'tool_use').length;

    // Extract file paths using parser helper (read/write distinction maintained)
    const { read, written } = this.parser.extractFilePaths(entries);

    // Extract command first words using parser helper
    const commands = this.parser.extractCommands(entries);

    // Get tool frequency map (toolName → count)
    const toolFreq = this.countFrequency(
      entries.filter(e => e.type === 'tool_use').map(e => e.tool_name || 'unknown')
    );

    return {
      sessionId,
      startTime,
      endTime,
      durationMinutes: Math.round((endTime - startTime) / 60000),
      source,
      reason,
      metrics: {
        userMessages,
        assistantMessages,
        toolCalls,
        uniqueFilesRead: new Set(read).size,
        uniqueFilesWritten: new Set(written).size,
        uniqueCommandsRun: new Set(commands).size,
      },
      // Top-5 commands by frequency — captures workflow signature
      topCommands: this.topN(commands, 5),
      // Top-10 files by frequency — read + written combined for focus area signal
      topFiles: this.topN([...read, ...written], 10),
      // Top-5 tools by frequency — captures work style (heavy Read? heavy Bash?)
      topTools: Object.entries(toolFreq)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([name]) => name),
      activeSkills,
    };
  }

  /**
   * Count item frequency in an array.
   * Returns Record<item, count> for all items.
   * Used for tool name frequency before top-N slicing.
   */
  private countFrequency(items: string[]): Record<string, number> {
    return items.reduce((acc, item) => {
      acc[item] = (acc[item] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }

  /**
   * Get top N items from an array, ranked by frequency.
   * Items with equal frequency maintain insertion order (stable sort by value).
   * Used for topCommands, topFiles — frequency-ranked, then N-sliced.
   */
  private topN(items: string[], n: number): string[] {
    const freq = this.countFrequency(items);
    return Object.entries(freq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, n)
      .map(([item]) => item);
  }
}

/**
 * Convenience function for one-off session summarization.
 * Wraps PatternSummarizer.summarize() for callers that don't need a class instance.
 */
export function summarizeSession(
  entries: TranscriptEntry[],
  sessionId: string,
  startTime: number,
  endTime: number,
  source: SessionObservation['source'],
  reason: SessionObservation['reason'],
  activeSkills: string[] = []
): SessionObservation {
  const summarizer = new PatternSummarizer();
  return summarizer.summarize(entries, sessionId, startTime, endTime, source, reason, activeSkills);
}
