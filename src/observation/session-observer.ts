import { join } from 'path';
import { writeFile, readFile, mkdir } from 'fs/promises';
import { TranscriptParser } from './transcript-parser.js';
import { PatternSummarizer } from './pattern-summarizer.js';
import { RetentionManager } from './retention-manager.js';
import { PatternStore } from '../storage/pattern-store.js';
import { EphemeralStore } from './ephemeral-store.js';
import { PromotionEvaluator } from './promotion-evaluator.js';
import { ObservationSquasher } from './observation-squasher.js';
import { SessionObservation, RetentionConfig } from '../types/observation.js';
import { ObservationRateLimiter, detectAnomalies } from './rate-limiter.js';
import type { RateLimitConfig } from './rate-limiter.js';

export interface SessionStartData {
  sessionId: string;
  transcriptPath: string;
  cwd: string;
  source: 'startup' | 'resume' | 'clear' | 'compact';
  model: string;
  startTime: number;
}

export interface SessionEndData {
  sessionId: string;
  transcriptPath: string;
  cwd: string;
  reason: 'clear' | 'logout' | 'prompt_input_exit' | 'bypass_permissions_disabled' | 'other';
  activeSkills?: string[];  // Skills that were active during the session
}

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
   * Handle SessionStart event - cache session info for later use
   */
  async onSessionStart(data: SessionStartData): Promise<void> {
    const cacheFile = join(this.cacheDir, '.session-cache.json');
    await mkdir(this.cacheDir, { recursive: true });
    await writeFile(cacheFile, JSON.stringify(data), 'utf-8');
  }

  /**
   * Handle SessionEnd event - parse, summarize, store, prune
   */
  async onSessionEnd(data: SessionEndData): Promise<SessionObservation | null> {
    // Load session start cache
    const cacheFile = join(this.cacheDir, '.session-cache.json');
    let startData: SessionStartData;
    try {
      const cached = await readFile(cacheFile, 'utf-8');
      startData = JSON.parse(cached);
    } catch {
      // No cache, use defaults
      startData = {
        sessionId: data.sessionId,
        transcriptPath: data.transcriptPath,
        cwd: data.cwd,
        source: 'startup',
        model: 'unknown',
        startTime: Date.now() - 60000, // Assume 1 min ago
      };
    }

    // Parse transcript
    const entries = await this.parser.parse(data.transcriptPath);

    if (entries.length === 0) {
      return null; // Empty session, nothing to observe
    }

    // Summarize session
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
    const limitResult = this.rateLimiter.checkLimit(data.sessionId);
    if (!limitResult.allowed) {
      return null; // Rate limited, do not write
    }

    // Evaluate current session for promotion
    const result = this.promotionEvaluator.evaluate(summary);

    if (result.promote) {
      summary.tier = 'persistent';
      await this.patternStore.append('sessions', summary as unknown as Record<string, unknown>);
    } else {
      summary.tier = 'ephemeral';
      await this.ephemeralStore.append(summary);
    }

    // Anomaly detection (INT-04)
    const anomalyReport = detectAnomalies([summary]);
    for (const anomaly of anomalyReport.anomalies) {
      console.warn('Observation anomaly:', anomaly.type, anomaly.message);
    }

    // Promote accumulated ephemeral entries
    await this.promoteEphemeralEntries();

    // Prune old patterns
    const sessionsFile = join(this.cacheDir, 'sessions.jsonl');
    await this.retentionManager.prune(sessionsFile);

    return summary;
  }

  /**
   * Evaluate accumulated ephemeral entries for batch promotion.
   * Squashes all entries into a single aggregate, evaluates the aggregate,
   * and promotes to persistent storage if the collective signal is strong enough.
   * Clears the ephemeral buffer regardless of outcome.
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
