/**
 * Revive pipeline -- drives a distilled session through the dormant AMIGA
 * substrate and shapes the result for the `sc:suggest` sink.
 *
 *   session -> SessionEventBridge -> EventEnvelope[] -> SkillCandidateDetector  (candidates)
 *                                 \-> InvocationRecorder -> AttributionLedger -> WeightingEngine  (attribution)
 *
 * Extracted from tools/spike-amiga-revive.mjs so the first-class CLI command
 * (`skill-creator amiga`) and the legacy runner share one implementation, and
 * so the selection/aggregation logic is unit-testable in isolation.
 *
 * Pure: imports and executes existing src/amiga code unchanged; writes nothing.
 * The caller owns any SuggestionStore write.
 *
 * @module
 */

import { SessionEventBridge } from './session-event-bridge.js';
import type { TranscriptSession } from './session-event-bridge.js';
import { toSuggestionCandidate } from './candidate-mapper.js';
import type { MappingContext } from './candidate-mapper.js';
import { SkillCandidateDetector } from '../meta-mission/skill-candidate-detector.js';
import type {
  SkillCandidate as AmigaSkillCandidate,
  DetectionResult,
} from '../meta-mission/skill-candidate-detector.js';
import { InvocationRecorder } from '../ce1/invocation-recorder.js';
import { AttributionLedger } from '../ce1/attribution-ledger.js';
import { WeightingEngine } from '../ce1/weighting-engine.js';
import type { ContributorWeight } from '../ce1/weighting-engine.js';
import type { SkillCandidate as SuggestionCandidate } from '../../types/detection.js';

/** CE-1 attribution distilled for one session. */
export interface AttributionSummary {
  /** Events the recorder received (== mission-log length). */
  received: number;
  /** LEDGER_ENTRY events captured into the ledger. */
  captured: number;
  /** Recorder errors (malformed payloads, etc.). */
  errors: number;
  /** Rows in the attribution ledger. */
  ledgerRows: number;
  /** Per-contributor weight vector, highest weight first. */
  weights: ContributorWeight[];
  /** Sum of the weight vector (≈ 1.0 when non-empty). */
  weightSum: number;
}

/** Everything the pipeline derives from a single session. */
export interface SessionAnalysis {
  sessionId: string;
  startMs: number;
  endMs: number;
  toolCount: number;
  /** Top tools by count, highest first (for reviewer context). */
  topTools: Array<[string, number]>;
  missionId: string;
  /** Detector output over the mission/ledger log (lifecycle-aware methods). */
  missionDetection: DetectionResult;
  /** Detector output over the tool-sequence log (real tool-workflow cycles). */
  seqDetection: DetectionResult;
  attribution: AttributionSummary;
}

/** Is a sequence candidate a degenerate self-loop (TOOL->TOOL)? */
function isSelfLoop(c: AmigaSkillCandidate): boolean {
  const [a, b] = c.trigger_pattern.split('->');
  return a === b;
}

/**
 * Run the full AMIGA detection + attribution pipeline on one distilled session.
 * Throws if the session has fewer than 2 tool-uses (no mission to project).
 */
export function analyzeSession(session: TranscriptSession, seq = 1): SessionAnalysis {
  if (session.tools.length < 2) {
    throw new Error(`session ${session.sessionId} has < 2 tool-uses; nothing to analyze`);
  }

  const bridge = new SessionEventBridge();
  const missionLog = bridge.toMissionLog(session, seq);
  const toolSeqLog = bridge.toToolSequenceLog(session, seq);
  const ledgerEnvelopes = missionLog.filter((e) => e.type === 'LEDGER_ENTRY');
  const missionId = String((ledgerEnvelopes[0]!.payload as Record<string, unknown>).mission_id);

  // Layer B1: detector over the mission/ledger log (lifecycle-aware).
  const detector = new SkillCandidateDetector();
  detector.enrichWithAttribution(SessionEventBridge.buildDraft(missionLog));
  const missionDetection = detector.analyze(missionLog);

  // Layer B2: detector over the tool-sequence log (real workflows).
  const seqDetection = new SkillCandidateDetector().analyze(toolSeqLog);

  // Layer A: CE-1 attribution over the same ledger envelopes.
  const ledger = new AttributionLedger();
  const recorder = new InvocationRecorder({ ledger });
  recorder.start();
  for (const envelope of missionLog) recorder.handleEvent(envelope);
  const stats = recorder.getStats();
  const weights = new WeightingEngine().calculateWeights(ledger.query({ mission_id: missionId }));
  const weightSum = weights.weights.reduce((a, w) => a + w.weight, 0);

  const counts = new Map<string, number>();
  for (const t of session.tools) counts.set(t.tool, (counts.get(t.tool) ?? 0) + 1);
  const topTools = [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6);

  return {
    sessionId: session.sessionId,
    startMs: session.startMs,
    endMs: session.endMs,
    toolCount: session.tools.length,
    topTools,
    missionId,
    missionDetection,
    seqDetection,
    attribution: {
      received: stats.totalEventsReceived,
      captured: stats.ledgerEntriesCaptured,
      errors: stats.errors,
      ledgerRows: ledger.count(),
      weights: [...weights.weights],
      weightSum,
    },
  };
}

/**
 * The meaningful candidates to emit from one session's analysis: the structural
 * ones from the mission log (attribution_cluster / provisioning_workflow -- drop
 * the degenerate LEDGER_ENTRY->LEDGER_ENTRY sequence artifact) plus the real
 * cross-tool workflow cycles from the tool-sequence pass (>= 3 occurrences, not
 * self-loops), highest confidence first, capped at `workflowLimit`.
 */
export function selectEmitCandidates(
  a: SessionAnalysis,
  workflowLimit = 10,
): AmigaSkillCandidate[] {
  const structural = a.missionDetection.candidates.filter(
    (c) => c.detection_method !== 'sequence_repetition',
  );
  const workflows = [...a.seqDetection.candidates]
    .filter((c) => c.evidence.length >= 3 && !isSelfLoop(c))
    .sort((x, y) => y.confidence - x.confidence)
    .slice(0, workflowLimit);
  return [...structural, ...workflows];
}

/** The per-session mapping context the SC SuggestionStore candidate needs. */
export function mappingContextFor(a: SessionAnalysis): MappingContext {
  return {
    sessionIds: [a.sessionId],
    firstSeen: a.startMs,
    lastSeen: a.endMs,
    coOccurringTools: a.topTools.map(([t]) => t),
  };
}

/** Map one session's selected candidates onto SC SuggestionStore candidates. */
export function mappedCandidatesFor(
  a: SessionAnalysis,
  workflowLimit = 10,
): SuggestionCandidate[] {
  const ctx = mappingContextFor(a);
  return selectEmitCandidates(a, workflowLimit).map((c) => toSuggestionCandidate(c, ctx));
}

/** Corpus-level aggregate across many sessions. */
export interface CorpusAnalysis {
  sessionsAnalyzed: number;
  sessionsSkipped: number;
  totalToolUses: number;
  totalCaptured: number;
  totalErrors: number;
  /** Mean attribution weight per contributor across sessions, highest first. */
  meanWeights: Array<{ contributorId: string; meanWeight: number; sessions: number }>;
  /** Aggregated, id-deduped SC candidates ready to emit. */
  candidates: SuggestionCandidate[];
}

/** Accumulator for one AMIGA candidate merged across sessions. */
interface AggEntry {
  candidate: AmigaSkillCandidate;
  occurrences: number;
  sessionIds: string[];
  firstSeen: number;
  lastSeen: number;
  tools: Set<string>;
}

/**
 * Aggregate many session analyses into one corpus result. AMIGA candidates are
 * merged by name (id `amiga-<name>` dedupes downstream in SuggestionStore):
 * occurrences sum, confidence is the max seen, evidence-derived context unions
 * the sessions/tools and spans the min..max window. Structural candidates are
 * always kept; cross-tool workflows are capped to the top `limit` by total
 * occurrences.
 */
export function aggregateCorpus(
  analyses: readonly SessionAnalysis[],
  sessionsSkipped = 0,
  limit = 20,
): CorpusAnalysis {
  const merged = new Map<string, AggEntry>();
  const weightSum = new Map<string, number>();
  const weightSessions = new Map<string, number>();
  let totalToolUses = 0;
  let totalCaptured = 0;
  let totalErrors = 0;

  for (const a of analyses) {
    totalToolUses += a.toolCount;
    totalCaptured += a.attribution.captured;
    totalErrors += a.attribution.errors;

    for (const w of a.attribution.weights) {
      weightSum.set(w.contributorId, (weightSum.get(w.contributorId) ?? 0) + w.weight);
      weightSessions.set(w.contributorId, (weightSessions.get(w.contributorId) ?? 0) + 1);
    }

    for (const c of selectEmitCandidates(a, Number.POSITIVE_INFINITY)) {
      const prev = merged.get(c.name);
      if (prev) {
        prev.occurrences += c.evidence.length;
        if (c.confidence > prev.candidate.confidence) prev.candidate = c;
        if (!prev.sessionIds.includes(a.sessionId)) prev.sessionIds.push(a.sessionId);
        prev.firstSeen = Math.min(prev.firstSeen, a.startMs);
        prev.lastSeen = Math.max(prev.lastSeen, a.endMs);
        for (const [t] of a.topTools) prev.tools.add(t);
      } else {
        merged.set(c.name, {
          candidate: c,
          occurrences: c.evidence.length,
          sessionIds: [a.sessionId],
          firstSeen: a.startMs,
          lastSeen: a.endMs,
          tools: new Set(a.topTools.map(([t]) => t)),
        });
      }
    }
  }

  const entries = [...merged.values()];
  const structural = entries.filter(
    (e) => e.candidate.detection_method !== 'sequence_repetition',
  );
  const workflows = entries
    .filter((e) => e.candidate.detection_method === 'sequence_repetition')
    .sort((x, y) => y.occurrences - x.occurrences)
    .slice(0, limit);

  const candidates = [...structural, ...workflows].map((e) => {
    // Synthesize a merged AMIGA candidate whose evidence length carries the
    // corpus-wide occurrence count, then map it once with the unioned context.
    const mergedCandidate: AmigaSkillCandidate = {
      ...e.candidate,
      evidence: Array.from({ length: e.occurrences }, (_unused, i) => `corpus-${i}`),
    };
    const ctx: MappingContext = {
      sessionIds: e.sessionIds,
      firstSeen: e.firstSeen,
      lastSeen: e.lastSeen,
      coOccurringTools: [...e.tools],
    };
    return toSuggestionCandidate(mergedCandidate, ctx);
  });

  const meanWeights = [...weightSum.entries()]
    .map(([contributorId, sum]) => {
      const sessions = weightSessions.get(contributorId) ?? 1;
      return { contributorId, meanWeight: sum / sessions, sessions };
    })
    .sort((a, b) => b.meanWeight - a.meanWeight);

  return {
    sessionsAnalyzed: analyses.length,
    sessionsSkipped,
    totalToolUses,
    totalCaptured,
    totalErrors,
    meanWeights,
    candidates,
  };
}
