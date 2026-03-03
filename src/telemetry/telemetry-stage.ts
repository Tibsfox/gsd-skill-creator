/**
 * TelemetryStage — final pipeline stage that emits UsageEvents for every
 * skill interaction in one pipeline run.
 *
 * Reads from PipelineContext (scored, budget-skipped, loaded) and writes
 * to EventStore. Never modifies context. Errors are caught and warned
 * so that telemetry failures never interrupt the pipeline.
 *
 * Privacy: reads only scoredSkills, budgetSkipped, loaded, contentCache,
 * and sessionId. Never reads intent, file, or context (user content).
 */

import type { PipelineStage, PipelineContext } from '../application/skill-pipeline.js';
import type { EventStore } from './event-store.js';
import type { UsageEvent } from './types.js';

export class TelemetryStage implements PipelineStage {
  readonly name = 'telemetry';

  constructor(private store: EventStore) {}

  async process(context: PipelineContext): Promise<PipelineContext> {
    // Nothing to emit if pipeline exited early with no data
    if (
      context.earlyExit &&
      context.scoredSkills.length === 0 &&
      context.budgetSkipped.length === 0 &&
      context.loaded.length === 0
    ) {
      return context;
    }

    const sessionId = context.sessionId;
    const now = new Date().toISOString();
    const events: UsageEvent[] = [];

    // One event per scored skill (EMIT-01)
    for (const skill of context.scoredSkills) {
      events.push({
        type: 'skill-scored',
        skillName: skill.name,
        score: skill.score,
        matchType: skill.matchType,
        sessionId,
        timestamp: now,
      });
    }

    // One event per budget-skipped skill (EMIT-02)
    for (const skipped of context.budgetSkipped) {
      events.push({
        type: 'skill-budget-skipped',
        skillName: skipped.name,
        reason: skipped.reason,
        estimatedTokens: skipped.estimatedTokens,
        sessionId,
        timestamp: now,
      });
    }

    // One event per loaded skill (EMIT-03)
    for (const skillName of context.loaded) {
      // Estimate token count from contentCache if available (chars / 4)
      const content = context.contentCache.get(skillName);
      const tokenCount = content !== undefined ? Math.round(content.length / 4) : 0;

      events.push({
        type: 'skill-loaded',
        skillName,
        tokenCount,
        sessionId,
        timestamp: now,
      });
    }

    // Append all events; catch errors so telemetry never crashes the pipeline
    for (const event of events) {
      try {
        await this.store.append(event);
      } catch (err) {
        console.warn(`[TelemetryStage] Failed to append event for ${event.skillName}:`, err);
      }
    }

    // Enforce 90-day retention automatically (INTG-03)
    try {
      await this.store.pruneOlderThan(90);
    } catch (err) {
      console.warn('[TelemetryStage] Failed to prune old events:', err);
    }

    return context;
  }
}
