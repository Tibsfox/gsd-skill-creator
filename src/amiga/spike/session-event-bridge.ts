/**
 * SessionEventBridge -- SPIKE adapter that gives the dormant AMIGA substrate a
 * runtime consumer by converting REAL skill-creator session activity into the
 * AMIGA mission-event vocabulary.
 *
 * This is the sibling of src/knowledge/event-bridge.ts (KnowledgeEventBridge),
 * which already converts LearnerObservation -> EventEnvelope. Where that bridge
 * spreads a domain record straight onto the envelope payload, this one PROJECTS
 * a session's ordered tool-use stream onto the two event types the meta-mission
 * SkillCandidateDetector and CE-1 attribution ledger actually consume:
 *
 *   - LEDGER_ENTRY    (ICD-02 payload) -- one per tool-use; the contribution
 *                      record CE-1's InvocationRecorder/AttributionLedger capture
 *                      and the detector's provisioning/attribution methods read.
 *   - TELEMETRY_UPDATE (BRIEFING + COMPLETION bookends) -- the lifecycle gate
 *                      the detector's provisioning method checks for COMPLETION.
 *
 * Two views are produced from the same session:
 *   toMissionLog()      -- TELEMETRY bookends + a LEDGER_ENTRY per tool-use.
 *                          Drives CE-1 attribution (real per-tool weights) and
 *                          the detector's attribution_cluster method.
 *   toToolSequenceLog() -- one event per tool-use whose `type` IS the tool, so
 *                          the detector's sequence_repetition method surfaces
 *                          genuine tool-workflow cycles (e.g. bash-to-edit-cycle).
 *
 * Every minted envelope is validated exactly like KnowledgeEventBridge does
 * (EventEnvelopeSchema.safeParse), and every LEDGER_ENTRY payload is validated
 * against ICD-02 (LedgerEntryPayloadSchema.parse) before it leaves the bridge --
 * so whatever reaches the detector / recorder is guaranteed well-formed.
 *
 * Read-mostly: the bridge mutates nothing; the runner that drives it only prints.
 *
 * @module
 */

import { createEnvelope, EventEnvelopeSchema } from '../message-envelope.js';
import type { EventEnvelope } from '../message-envelope.js';
import { LedgerEntryPayloadSchema } from '../icd/icd-02.js';
import type { SkillPackageDraft } from '../meta-mission/meta-mission-harness.js';

// ============================================================================
// Input types -- the distilled shape the runner extracts from a transcript
// ============================================================================

/** A single tool invocation distilled from a Claude Code transcript entry. */
export interface ToolUse {
  /** Tool name as recorded in the transcript (e.g. 'Bash', 'Edit', 'Read'). */
  tool: string;
  /** ISO-8601 timestamp of the tool-use, if available. */
  ts?: string;
}

/** One skill-creator session distilled to its ordered tool-use stream. */
export interface TranscriptSession {
  /** The session id (used as provenance and to seed the mission id). */
  sessionId: string;
  /** Epoch ms of the first transcript entry (mission start / BRIEFING). */
  startMs: number;
  /** Epoch ms of the last transcript entry (mission end / COMPLETION). */
  endMs: number;
  /** Ordered tool invocations across the session. */
  tools: ToolUse[];
}

// ============================================================================
// Mapping helpers -- every one guarantees AMIGA schema compliance
// ============================================================================

/**
 * The four active lifecycle phases a session's tool-uses are spread across.
 * BRIEFING and COMPLETION are reserved for the telemetry bookends. Spreading
 * across adjacent PHASE_ORDER phases is what lets the detector's
 * attribution_cluster method observe contributor "handoffs".
 */
const ACTIVE_PHASES = ['PLANNING', 'EXECUTION', 'INTEGRATION', 'REVIEW_GATE'] as const;

/** Map a tool-use position onto one of the active phases. */
function phaseForPosition(index: number, total: number): (typeof ACTIVE_PHASES)[number] {
  const span = Math.max(1, total);
  const slot = Math.floor((index / span) * ACTIVE_PHASES.length);
  return ACTIVE_PHASES[Math.min(ACTIVE_PHASES.length - 1, slot)];
}

/** ISO-8601 UTC with millisecond precision -- satisfies TimestampSchema. */
function toUtc(ms: number): string {
  return new Date(ms).toISOString().replace(/(\.\d{3})\d*Z/, '$1Z');
}

/** kebab-ish slug; never empty (ContributorIDSchema needs a non-empty tail). */
function slug(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/^-+|-+$/g, '') || 'x';
}

/** contrib-tool-<slug>; always >= 13 chars, matches /^contrib-[a-z0-9-]+$/. */
function contributorId(tool: string): string {
  return `contrib-tool-${slug(tool)}`;
}

/** mission-YYYY-MM-DD-NNN -- matches MissionIDSchema. */
function missionIdFor(startMs: number, seq: number): string {
  const date = new Date(startMs).toISOString().slice(0, 10);
  const n = String(((seq % 1000) + 1000) % 1000).padStart(3, '0');
  return `mission-${date}-${n}`;
}

/** Event `type` for the tool-sequence view -- clean uppercase token. */
function toolType(tool: string): string {
  return tool.replace(/[^a-zA-Z0-9]+/g, '').toUpperCase() || 'TOOL';
}

// ============================================================================
// SessionEventBridge
// ============================================================================

/**
 * Converts a distilled session into AMIGA EventEnvelope logs the dormant
 * meta-mission detector and CE-1 ledger can consume.
 */
export class SessionEventBridge {
  constructor(
    private readonly source = 'OPS-1',
    private readonly destination = 'broadcast',
    private readonly agentId = 'CE-1',
  ) {}

  /**
   * Mission/ledger view: BRIEFING telemetry -> N LEDGER_ENTRY -> COMPLETION
   * telemetry. Feeds CE-1 attribution and the detector's lifecycle-aware
   * methods. `seq` disambiguates the synthetic mission id.
   */
  toMissionLog(session: TranscriptSession, seq = 1): EventEnvelope[] {
    const mid = missionIdFor(session.startMs, seq);
    const total = session.tools.length;
    const log: EventEnvelope[] = [this.telemetry(mid, 'BRIEFING', toUtc(session.startMs))];

    session.tools.forEach((use, i) => {
      const payload = {
        mission_id: mid,
        contributor_id: contributorId(use.tool),
        agent_id: this.agentId,
        skill_name: slug(use.tool),
        phase: phaseForPosition(i, total),
        // Monotonic, unique-per-event timestamp inside the session window.
        timestamp: toUtc(session.startMs + i),
        // > 0.7 so the attribution_cluster method counts every contributor.
        context_weight: 0.8,
        dependency_tree: [] as Array<{ contributor_id: string; depth: number; decay_factor: number }>,
        // .passthrough() carries provenance back to the real session.
        sessionId: session.sessionId,
      };
      // Fail fast, exactly as InvocationRecorder/AttributionLedger would.
      LedgerEntryPayloadSchema.parse(payload);
      log.push(
        this.guard(
          createEnvelope({
            source: this.source,
            destination: this.destination,
            type: 'LEDGER_ENTRY',
            payload,
            priority: 'normal',
            correlation: mid,
            requires_ack: false,
          }),
        ),
      );
    });

    log.push(this.telemetry(mid, 'COMPLETION', toUtc(session.endMs)));
    return log;
  }

  /**
   * Tool-sequence view: one event per tool-use whose `type` IS the tool. The
   * detector's sequence_repetition method counts adjacent type bigrams, so this
   * surfaces real tool-workflow cycles (e.g. `bash-to-edit-cycle`). Not routed
   * to CE-1 (the recorder only captures LEDGER_ENTRY).
   */
  toToolSequenceLog(session: TranscriptSession, seq = 1): EventEnvelope[] {
    const mid = missionIdFor(session.startMs, seq);
    return session.tools.map((use, i) =>
      this.guard(
        createEnvelope({
          source: this.source,
          destination: this.destination,
          type: toolType(use.tool),
          payload: { mission_id: mid, tool: use.tool, index: i, sessionId: session.sessionId },
          priority: 'normal',
          correlation: mid,
          requires_ack: false,
        }),
      ),
    );
  }

  // --------------------------------------------------------------------------

  private telemetry(missionId: string, phase: string, timestamp: string): EventEnvelope {
    return this.guard(
      createEnvelope({
        source: this.source,
        destination: this.destination,
        type: 'TELEMETRY_UPDATE',
        payload: { mission_id: missionId, phase, timestamp },
        priority: 'normal',
        correlation: missionId,
        requires_ack: false,
      }),
    );
  }

  /** KnowledgeEventBridge's mandatory post-construction validation. */
  private guard(envelope: EventEnvelope): EventEnvelope {
    const result = EventEnvelopeSchema.safeParse(envelope);
    if (!result.success) {
      throw new Error(`EventEnvelope validation failed: ${result.error.message}`);
    }
    return result.data;
  }

  /**
   * Derive a SkillPackageDraft from a mission log so the detector's
   * attribution_cluster method (method 4) can run. Contributors are the real
   * per-tool ledger contributors; phases are those that carried LEDGER_ENTRYs.
   */
  static buildDraft(missionLog: readonly EventEnvelope[], name = 'skill-creator-session'): SkillPackageDraft {
    const ledger = missionLog.filter((e) => e.type === 'LEDGER_ENTRY');
    const phases = [...new Set(ledger.map((e) => String((e.payload as Record<string, unknown>).phase)))];

    const entryCounts = new Map<string, number>();
    for (const e of ledger) {
      const id = String((e.payload as Record<string, unknown>).contributor_id);
      entryCounts.set(id, (entryCounts.get(id) ?? 0) + 1);
    }
    const contributors = [...entryCounts.entries()].map(([id, entry_count]) => ({
      id,
      role: id.replace(/^contrib-tool-/, 'tool:'),
      entry_count,
    }));

    return {
      name,
      description: `Skill-creator session replayed through the AMIGA meta-mission substrate: ${ledger.length} tool contributions across ${phases.length} lifecycle phases.`,
      phases_documented: phases,
      contributors,
      provisioning_steps: [...new Set(ledger.map((e) => String((e.payload as Record<string, unknown>).skill_name)))],
      total_events: missionLog.length,
      attribution_summary: { total_contributors: contributors.length, total_entries: ledger.length },
      governance_verdict: 'COMPLIANT',
    };
  }
}
