/**
 * session-observer.ts — Session Tracking: Session Lifecycle Orchestrator
 *
 * WHAT THIS MODULE DOES
 * ---------------------
 * SessionObserver is the main entry point for session-level observation.
 * It handles two lifecycle events:
 *   onSessionStart() — cache session metadata for later reference
 *   onSessionEnd()   — parse transcript, summarize, evaluate, store, prune
 *
 * It orchestrates 7 collaborating components to convert raw session data into
 * structured, durable, pruned observations.
 *
 * WHY IT EXISTS
 * -------------
 * A "session" is the fundamental unit of learning in this system. Each Claude
 * Code session is a bounded window of work: it starts (startup, resume, or clear),
 * produces tool calls, and ends (clear, logout, or exit). Understanding what
 * happened in a session — what tools were used, what files were touched, how long
 * it ran — is the foundation for detecting repeating patterns.
 *
 * SessionObserver transforms each session from a raw transcript file into a
 * structured, queryable SessionObservation. Over time, these observations
 * accumulate in PatternStore and become the data that pattern detection reads.
 *
 * WHAT A SESSION IS
 * -----------------
 * A session spans from SessionStart to SessionEnd. It has:
 *   - source: how it started (startup = fresh open, resume = /resume, clear = /clear, compact = compact)
 *   - reason: how it ended (clear, logout, prompt_input_exit, bypass_permissions_disabled, other)
 *   - model: the Claude model in use during the session
 *   - activeSkills: skill files that were active (from hook context)
 *   - transcript: full JSONL record of every event in the session
 *
 * Sessions connect to phases: a GSD phase typically spans multiple sessions.
 * Understanding session patterns within a phase reveals workflow structure.
 *
 * THE 7 COMPONENTS
 * ----------------
 *   TranscriptParser   — reads and filters the JSONL transcript file
 *   PatternSummarizer  — extracts counts, top-N items, skill lists
 *   RetentionManager   — prunes old observations from the JSONL file
 *   PatternStore       — persistent storage ('sessions' category)
 *   EphemeralStore     — temporary buffer for observations awaiting promotion
 *   PromotionEvaluator — scores sessions for persistence worthiness
 *   ObservationSquasher — compresses multiple ephemeral observations into one
 *   ObservationRateLimiter — prevents runaway data accumulation (INT-03)
 *
 * EPHEMERAL vs PERSISTENT TIERS
 * ------------------------------
 * Not every session is worth keeping permanently. Short, empty, or low-activity
 * sessions are stored in the ephemeral buffer (.ephemeral.jsonl). Only sessions
 * that score >= 0.3 on PromotionEvaluator's 5-factor scoring are written to
 * PatternStore 'sessions' (persistent storage).
 *
 * After every session end, accumulated ephemeral entries are squashed and
 * re-evaluated collectively. If the squashed aggregate scores well enough,
 * it gets promoted to persistent storage. The ephemeral buffer is then cleared
 * regardless of the promotion outcome.
 *
 * This two-tier design prevents the sessions file from growing with noise.
 * Short, trivial sessions are ephemeral. Substantive sessions are persistent.
 * Accumulated trivial sessions, if they happen often enough, promote as a group.
 *
 * SESSION CACHE
 * -------------
 * onSessionStart() writes session metadata to .session-cache.json. This cache
 * bridges the gap between SessionStart and SessionEnd events: the session ID,
 * transcript path, model, and start time are recorded at start, then read back
 * when the session ends to compute duration and fill in the observation.
 *
 * If the cache file is missing at SessionEnd (e.g., first session, or cache
 * cleared), defaults are used: source='startup', model='unknown', startTime=1min ago.
 *
 * RATE LIMITING
 * -------------
 * ObservationRateLimiter enforces two limits (INT-03):
 *   - maxPerSession: prevents any single session from writing > 50 observations
 *   - maxPerHour: prevents > 200 observations per hour across all sessions
 *
 * If rate-limited, onSessionEnd() returns null without writing. This prevents
 * misbehaving hooks or test loops from flooding the observation store.
 *
 * ANOMALY DETECTION
 * -----------------
 * After summarizing, detectAnomalies() checks for suspicious entries (INT-04):
 *   - duplicate timestamps (possible replay attack or clock skew)
 *   - impossible durations (endTime < startTime)
 *   - duration mismatches (reported vs computed differ by > 2 minutes)
 * Anomalies are logged as warnings but do not block storage.
 *
 * TEMPORAL FRAMEWORK
 * ------------------
 * Sessions have explicit start/end timestamps and computed durationMinutes.
 * This temporal structure enables:
 *   - Session length distribution analysis
 *   - Identifying long sessions (high engagement) vs short ones (quick checks)
 *   - Connecting sessions to GSD phases via timestamps
 *   - Compression ratio calculation (how long did the same arc take over time?)
 *
 * @see TranscriptParser (transcript-parser.ts) — reads raw session transcript
 * @see PatternSummarizer (pattern-summarizer.ts) — creates SessionObservation from entries
 * @see PromotionEvaluator (promotion-evaluator.ts) — decides ephemeral vs persistent
 * @see EphemeralStore (ephemeral-store.ts) — temporary buffer for low-signal sessions
 * @see ObservationSquasher (observation-squasher.ts) — aggregates ephemeral entries
 * @see RetentionManager (retention-manager.ts) — prunes old persistent observations
 * @see CENTERCAMP-PERSONAL-JOURNAL.md — "Cedar: Observe and Record" on why we record
 */

import { join } from 'path';
import { writeFile, readFile, mkdir } from 'fs/promises';
import { TranscriptParser } from './transcript-parser.js';
import { PatternSummarizer } from './pattern-summarizer.js';
import { RetentionManager } from './retention-manager.js';
import { PatternStore } from '../../core/storage/pattern-store.js';
import { EphemeralStore } from './ephemeral-store.js';
import { PromotionEvaluator } from './promotion-evaluator.js';
import { ObservationSquasher } from './observation-squasher.js';
import { SessionObservation, RetentionConfig } from '../../core/types/observation.js';
import { ObservationRateLimiter, detectAnomalies } from './rate-limiter.js';
import type { RateLimitConfig } from './rate-limiter.js';

/**
 * Data provided at SessionStart event.
 * This is cached immediately so it's available when the session ends.
 * source values mirror Claude Code hook event types.
 */
export interface SessionStartData {
  sessionId: string;
  transcriptPath: string;
  cwd: string;
  source: 'startup' | 'resume' | 'clear' | 'compact';
  model: string;
  startTime: number;
}

/**
 * Data provided at SessionEnd event.
 * reason values mirror Claude Code hook exit reasons.
 * activeSkills captures which skills were loaded — connects sessions to skill activation.
 */
export interface SessionEndData {
  sessionId: string;
  transcriptPath: string;
  cwd: string;
  reason: 'clear' | 'logout' | 'prompt_input_exit' | 'bypass_permissions_disabled' | 'other';
  activeSkills?: string[];  // Skills that were active during the session
}

/**
 * Orchestrates the full session observation pipeline.
 *
 * Construct with a patternsDir path (where JSONL files are stored).
 * Wire into Claude Code hooks: call onSessionStart() and onSessionEnd().
 * The observer handles everything else: parsing, scoring, storing, pruning.
 */
export class SessionObserver {
  private parser: TranscriptParser;
  private summarizer: PatternSummarizer;
  private retentionManager: RetentionManager;
  private patternStore: PatternStore;
  private ephemeralStore: EphemeralStore;
  private promotionEvaluator: PromotionEvaluator;
  private squasher: ObservationSquasher;
  private rateLimiter: ObservationRateLimiter;
  private cacheDir: string;

  constructor(
    patternsDir: string = '.planning/patterns',
    retentionConfig?: Partial<RetentionConfig>,
    rateLimitConfig?: Partial<RateLimitConfig>,
  ) {
    this.parser = new TranscriptParser();
    this.summarizer = new PatternSummarizer();
    this.retentionManager = new RetentionManager(retentionConfig);
    this.patternStore = new PatternStore(patternsDir);
    this.ephemeralStore = new EphemeralStore(patternsDir);
    this.promotionEvaluator = new PromotionEvaluator();
    this.squasher = new ObservationSquasher();
    this.rateLimiter = new ObservationRateLimiter(rateLimitConfig);
    this.cacheDir = patternsDir;
  }

  /**
   * Handle SessionStart event — cache session info for later use.
   *
   * The session cache is a simple JSON file (.session-cache.json) in the
   * patterns directory. It bridges SessionStart and SessionEnd events,
   * preserving start time and source information across the session lifetime.
   *
   * mkdir is called with { recursive: true } to ensure the patterns directory
   * exists before writing. Safe to call on existing directories.
   */
  async onSessionStart(data: SessionStartData): Promise<void> {
    const cacheFile = join(this.cacheDir, '.session-cache.json');
    await mkdir(this.cacheDir, { recursive: true });
    await writeFile(cacheFile, JSON.stringify(data), 'utf-8');
  }

  /**
   * Handle SessionEnd event — parse, summarize, store, prune.
   *
   * Full pipeline on each session end:
   *   1. Read session cache (start time, model, source)
   *   2. Parse transcript entries
   *   3. Early return if empty (nothing to observe)
   *   4. Summarize (counts, top-N items, skills)
   *   5. Rate limit check (INT-03)
   *   6. Score for promotion (ephemeral or persistent tier)
   *   7. Store to appropriate tier
   *   8. Anomaly detection (INT-04)
   *   9. Promote accumulated ephemeral entries (if ready)
   *   10. Prune old persistent observations
   *
   * Returns the SessionObservation on success, null if empty or rate-limited.
   */
  async onSessionEnd(data: SessionEndData): Promise<SessionObservation | null> {
    // Load session start cache to recover start time and metadata
    const cacheFile = join(this.cacheDir, '.session-cache.json');
    let startData: SessionStartData;
    try {
      const cached = await readFile(cacheFile, 'utf-8');
      startData = JSON.parse(cached);
    } catch {
      // No cache means first session or cache cleared — use safe defaults
      startData = {
        sessionId: data.sessionId,
        transcriptPath: data.transcriptPath,
        cwd: data.cwd,
        source: 'startup',
        model: 'unknown',
        startTime: Date.now() - 60000, // Assume 1 min ago
      };
    }

    // Parse transcript — filtered (no sidechain), streaming
    const entries = await this.parser.parse(data.transcriptPath);

    if (entries.length === 0) {
      return null; // Empty session, nothing to observe
    }

    // Summarize: extract counts, top files, top tools, active skills
    const summary = this.summarizer.summarize(
      entries,
      data.sessionId,
      startData.startTime,
      Date.now(),
      startData.source,
      data.reason,
      data.activeSkills || []
    );

    // Rate limit check before writing (INT-03)
    // If rate-limited, we silently discard the observation — no error thrown
    const limitResult = this.rateLimiter.checkLimit(data.sessionId);
    if (!limitResult.allowed) {
      return null; // Rate limited, do not write
    }

    // Score the session and route to appropriate storage tier
    const result = this.promotionEvaluator.evaluate(summary);

    if (result.promote) {
      // High-signal session: write directly to persistent storage
      summary.tier = 'persistent';
      await this.patternStore.append('sessions', summary as unknown as Record<string, unknown>);
    } else {
      // Low-signal session: buffer in ephemeral store for batch evaluation
      summary.tier = 'ephemeral';
      await this.ephemeralStore.append(summary);
    }

    // Anomaly detection (INT-04) — warn but do not block
    const anomalyReport = detectAnomalies([summary]);
    for (const anomaly of anomalyReport.anomalies) {
      console.warn('Observation anomaly:', anomaly.type, anomaly.message);
    }

    // Promote accumulated ephemeral entries if they collectively score well
    await this.promoteEphemeralEntries();

    // Prune old patterns to stay within retention limits
    const sessionsFile = join(this.cacheDir, 'sessions.jsonl');
    await this.retentionManager.prune(sessionsFile);

    return summary;
  }

  /**
   * Evaluate accumulated ephemeral entries for batch promotion.
   * Squashes all entries into a single aggregate, evaluates the aggregate,
   * and promotes to persistent storage if the collective signal is strong enough.
   * Clears the ephemeral buffer regardless of outcome.
   *
   * This implements the "collective promotion" principle:
   * Many trivial sessions, if they happen often enough, represent a real pattern
   * worth recording. The squasher combines them into one aggregate observation
   * that captures the union of their signals. The evaluator then scores that
   * aggregate — if enough evidence has accumulated, it promotes.
   *
   * The clear-regardless logic ensures the ephemeral buffer doesn't grow
   * unboundedly: whether we promoted or discarded, we start fresh.
   */
  private async promoteEphemeralEntries(): Promise<void> {
    const ephemeralEntries = await this.ephemeralStore.readAll();
    if (ephemeralEntries.length === 0) return;

    // Squash ALL ephemeral entries into a single aggregate
    const squashed = this.squasher.squash(ephemeralEntries);
    if (squashed) {
      // Evaluate the SQUASHED aggregate for promotion
      const result = this.promotionEvaluator.evaluate(squashed);
      if (result.promote) {
        await this.patternStore.append('sessions', squashed as unknown as Record<string, unknown>);
      }
    }

    // Clear ephemeral buffer regardless (promoted or discarded)
    await this.ephemeralStore.clear();
  }
}
