import type {
  ChannelConfig,
  ClassifiedEvent,
  ImpactManifest,
  PatchManifest,
  Briefing,
} from './types';
import type { MonitorDeps } from './monitor';
import type { TracerDeps } from './tracer';
import type { PatcherDeps } from './patcher';
import type { PersistenceDeps } from './persistence';
import { checkChannel } from './monitor';
import { classifyChange } from './classifier';
import { traceImpact } from './tracer';
import { applyPatch } from './patcher';
import { generateBriefing } from './briefer';
import { appendLog } from './persistence';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

/** All injectable dependencies for the pipeline */
export interface PipelineDeps {
  monitor: MonitorDeps;
  tracer: TracerDeps;
  patcher: PatcherDeps;
  persistence: PersistenceDeps;
}

/** Result from a single channel processing pass */
export interface ChannelResult {
  events_detected: number;
  events_classified: number;
  impacts_traced: number;
  patches_applied: number;
  patches_rejected: number;
  briefings_generated: number;
  errors: string[];
}

/** Aggregate result from a full pipeline run across all channels */
export interface PipelineResult {
  events_detected: number;
  events_classified: number;
  impacts_traced: number;
  patches_applied: number;
  patches_rejected: number;
  briefings_generated: number;
  errors: string[];
}

/* ------------------------------------------------------------------ */
/*  Log path constant                                                  */
/* ------------------------------------------------------------------ */

const INTELLIGENCE_LOG = '.planning/upstream/intelligence.jsonl';

/* ------------------------------------------------------------------ */
/*  Pipeline orchestration                                             */
/* ------------------------------------------------------------------ */

/**
 * Run the full upstream intelligence pipeline across all channels.
 *
 * Flow per channel:
 *   monitor.checkChannel → classifier.classifyChange → tracer.traceImpact
 *   → for each patchable component: patcher.applyPatch
 *   → for non-patchable: add to pending decisions
 *   → briefer.generateBriefing
 *
 * Results are aggregated across all channels into a single PipelineResult.
 */
export async function runPipeline(
  channels: ChannelConfig[],
  deps: PipelineDeps,
): Promise<PipelineResult> {
  const aggregate: PipelineResult = {
    events_detected: 0,
    events_classified: 0,
    impacts_traced: 0,
    patches_applied: 0,
    patches_rejected: 0,
    briefings_generated: 0,
    errors: [],
  };

  for (const channel of channels) {
    const channelResult = await processSingleChannel(channel, deps);

    aggregate.events_detected += channelResult.events_detected;
    aggregate.events_classified += channelResult.events_classified;
    aggregate.impacts_traced += channelResult.impacts_traced;
    aggregate.patches_applied += channelResult.patches_applied;
    aggregate.patches_rejected += channelResult.patches_rejected;
    aggregate.briefings_generated += channelResult.briefings_generated;
    aggregate.errors.push(...channelResult.errors);
  }

  return aggregate;
}

/**
 * Process a single channel through the full pipeline.
 *
 * Steps:
 * 1. Check channel for changes (monitor)
 * 2. Classify the change event (classifier)
 * 3. Trace impact across components (tracer)
 * 4. Apply patches to patchable components (patcher)
 * 5. Collect non-patchable impacts as pending decisions
 * 6. Generate a session briefing (briefer)
 * 7. Log the audit trail (persistence)
 */
export async function processSingleChannel(
  channel: ChannelConfig,
  deps: PipelineDeps,
): Promise<ChannelResult> {
  const result: ChannelResult = {
    events_detected: 0,
    events_classified: 0,
    impacts_traced: 0,
    patches_applied: 0,
    patches_rejected: 0,
    briefings_generated: 0,
    errors: [],
  };

  try {
    // Step 1: Monitor — check for changes
    const rawEvent = await checkChannel(channel, deps.monitor);
    if (rawEvent === null) {
      return result; // No change detected (or first check / error)
    }
    result.events_detected = 1;

    // Step 2: Classify the change
    const classified = classifyChange(rawEvent, channel);
    result.events_classified = 1;

    // Step 3: Trace impact
    const impact = await traceImpact(classified, deps.tracer);
    result.impacts_traced = impact.affected_components.length;

    // Step 4 & 5: Route patchable vs non-patchable
    const patchResults: PatchManifest[] = [];
    const pendingDecisions: ImpactManifest[] = [];

    const patchableComponents = impact.affected_components.filter((c) => c.patchable);
    const nonPatchableComponents = impact.affected_components.filter((c) => !c.patchable);

    // Apply patches to patchable components
    for (const component of patchableComponents) {
      try {
        const patchManifest = await applyPatch(impact, component, deps.patcher);
        patchResults.push(patchManifest);
        if (patchManifest.auto_approved) {
          result.patches_applied += 1;
        } else {
          result.patches_rejected += 1;
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        result.errors.push(`Patch failed for ${component.component}: ${msg}`);
        result.patches_rejected += 1;
      }
    }

    // Collect non-patchable impacts as pending decisions
    if (nonPatchableComponents.length > 0) {
      pendingDecisions.push({
        change_id: impact.change_id,
        classification: classified,
        affected_components: nonPatchableComponents,
        total_blast_radius: nonPatchableComponents.length,
      });
    }

    // Step 6: Generate briefing
    const briefing = generateBriefing(
      'session',
      [classified],
      patchResults,
      pendingDecisions,
    );
    result.briefings_generated = 1;

    // Step 7: Log audit trail
    await logAuditEntry(deps, {
      timestamp: new Date().toISOString(),
      channel: channel.name,
      event_id: rawEvent.id,
      change_type: classified.change_type,
      severity: classified.severity,
      components_affected: impact.affected_components.length,
      patches_applied: result.patches_applied,
      patches_rejected: result.patches_rejected,
      briefing_tier: briefing.tier,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    result.errors.push(`Channel ${channel.name}: ${msg}`);
  }

  return result;
}

/* ------------------------------------------------------------------ */
/*  Internal helpers                                                   */
/* ------------------------------------------------------------------ */

/** Log a structured audit entry to the intelligence JSONL log */
async function logAuditEntry(
  deps: PipelineDeps,
  entry: Record<string, unknown>,
): Promise<void> {
  try {
    await appendLog(INTELLIGENCE_LOG, entry, {
      appendFile: deps.persistence.appendFile,
      mkdir: deps.persistence.mkdir,
    });
  } catch {
    // Logging failure should not crash the pipeline
  }
}
