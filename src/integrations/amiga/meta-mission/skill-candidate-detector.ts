/**
 * SkillCandidateDetector -- debrief analysis module for surfacing skill
 * candidates from completed mission event logs.
 *
 * Bridges AMIGA's mission execution and skill-creator's pattern detection
 * pipeline by scanning event logs for repeating sequences, phase-correlated
 * patterns, and attribution clusters that indicate reusable workflows.
 *
 * Four detection methods:
 * 1. provisioning_workflow -- guaranteed candidate for completed meta-missions
 * 2. sequence_repetition -- repeating event type subsequences across phases
 * 3. phase_correlation -- event types that co-occur in multiple phases
 * 4. attribution_cluster -- contributors with overlapping activity in adjacent phases
 */

import type { EventEnvelope } from '../message-envelope.js';
import type { SkillPackageDraft } from './meta-mission-harness.js';

// ============================================================================
// Types
// ============================================================================

/** A detected skill candidate from event log analysis. */
export interface SkillCandidate {
  /** Proposed skill name (kebab-case). */
  name: string;
  /** Human-readable description of what this skill would do. */
  description: string;
  /** The event pattern that triggered this detection. */
  trigger_pattern: string;
  /** Confidence score (0.0 - 1.0). Higher means more evidence. */
  confidence: number;
  /** Event IDs from the log that support this detection. */
  evidence: string[];
  /** Which detection method found this candidate. */
  detection_method:
    | 'sequence_repetition'
    | 'phase_correlation'
    | 'attribution_cluster'
    | 'provisioning_workflow';
}

/** Result of running all detection methods on an event log. */
export interface DetectionResult {
  /** Skill candidates found, sorted by confidence descending. */
  candidates: SkillCandidate[];
  /** Total events analyzed. */
  events_analyzed: number;
  /** Whether the minimum threshold was met (at least 1 candidate). */
  has_candidates: boolean;
}

// ============================================================================
// Constants
// ============================================================================

/** Provisioning-related skill name keywords for detection method 1. */
const PROVISIONING_KEYWORDS = [
  'manifest',
  'dashboard',
  'wiring',
  'attribution',
  'governance',
  'provisioning',
];

/** Ordered lifecycle phases for adjacency checks. */
const PHASE_ORDER = [
  'BRIEFING',
  'PLANNING',
  'EXECUTION',
  'INTEGRATION',
  'REVIEW_GATE',
  'COMPLETION',
];

// ============================================================================
// SkillCandidateDetector
// ============================================================================

/**
 * Analyzes completed mission event logs using four detection methods
 * to surface skill candidates for the skill-creator pipeline.
 */
export class SkillCandidateDetector {
  private skillPackage: SkillPackageDraft | null = null;

  constructor(_config?: Record<string, never>) {
    // Config reserved for future extensibility
  }

  /**
   * Add attribution data for enriched cluster detection.
   */
  enrichWithAttribution(skillPackage: SkillPackageDraft): void {
    this.skillPackage = skillPackage;
  }

  /**
   * Clear enrichment data for reuse.
   */
  reset(): void {
    this.skillPackage = null;
  }

  /**
   * Run all detection methods on the given event log.
   *
   * @param eventLog - Complete event log from a mission
   * @returns Detection result with candidates sorted by confidence
   */
  analyze(eventLog: readonly EventEnvelope[]): DetectionResult {
    if (eventLog.length < 2) {
      return {
        candidates: [],
        events_analyzed: eventLog.length,
        has_candidates: false,
      };
    }

    const allCandidates: SkillCandidate[] = [];

    // Method 1: Provisioning workflow (guaranteed for INTG-09)
    const provCandidate = this.detectProvisioningWorkflow(eventLog);
    if (provCandidate) allCandidates.push(provCandidate);

    // Method 2: Sequence repetition
    const seqCandidates = this.detectSequenceRepetition(eventLog);
    allCandidates.push(...seqCandidates);

    // Method 3: Phase correlation
    const phaseCandidates = this.detectPhaseCorrelation(eventLog);
    allCandidates.push(...phaseCandidates);

    // Method 4: Attribution cluster (requires enrichment)
    if (this.skillPackage) {
      const clusterCandidates = this.detectAttributionCluster(
        eventLog,
        this.skillPackage,
      );
      allCandidates.push(...clusterCandidates);
    }

    // Deduplicate by name (keep higher confidence)
    const deduped = this.deduplicateCandidates(allCandidates);

    // Sort by confidence descending
    deduped.sort((a, b) => b.confidence - a.confidence);

    return {
      candidates: deduped,
      events_analyzed: eventLog.length,
      has_candidates: deduped.length > 0,
    };
  }

  // --------------------------------------------------------------------------
  // Detection Method 1: Provisioning Workflow
  // --------------------------------------------------------------------------

  /**
   * Detect a complete provisioning workflow from LEDGER_ENTRY events
   * with provisioning-related skill names across multiple phases.
   *
   * This is the guaranteed candidate for INTG-09.
   */
  private detectProvisioningWorkflow(
    eventLog: readonly EventEnvelope[],
  ): SkillCandidate | null {
    const ledgerEntries = eventLog.filter((e) => e.type === 'LEDGER_ENTRY');
    if (ledgerEntries.length === 0) return null;

    // Check for provisioning-related skill names
    const provisioningEntries = ledgerEntries.filter((e) => {
      const payload = e.payload as Record<string, unknown>;
      const skillName = String(payload.skill_name ?? '').toLowerCase();
      return PROVISIONING_KEYWORDS.some((kw) => skillName.includes(kw));
    });

    if (provisioningEntries.length === 0) return null;

    // Check that mission reached COMPLETION
    const telemetryEvents = eventLog.filter(
      (e) => e.type === 'TELEMETRY_UPDATE',
    );
    const reachedCompletion = telemetryEvents.some((e) => {
      const payload = e.payload as Record<string, unknown>;
      return payload.phase === 'COMPLETION';
    });

    if (!reachedCompletion) return null;

    // Count phases with provisioning entries
    const phasesWithEntries = new Set<string>();
    for (const entry of provisioningEntries) {
      const payload = entry.payload as Record<string, unknown>;
      if (typeof payload.phase === 'string') {
        phasesWithEntries.add(payload.phase);
      }
    }

    // Base confidence 0.8 + 0.05 per additional phase (max 1.0)
    const confidence = Math.min(
      1.0,
      0.8 + 0.05 * Math.max(0, phasesWithEntries.size - 1),
    );

    return {
      name: 'amiga-provisioning-workflow',
      description:
        'Reusable workflow for provisioning AMIGA mission environments from briefing through governance evaluation',
      trigger_pattern: `LEDGER_ENTRY[skill_name=manifest-*,dashboard-*,attribution-*,governance-*] across ${phasesWithEntries.size}+ phases`,
      confidence,
      evidence: provisioningEntries.map((e) => e.id),
      detection_method: 'provisioning_workflow',
    };
  }

  // --------------------------------------------------------------------------
  // Detection Method 2: Sequence Repetition
  // --------------------------------------------------------------------------

  /**
   * Scan for repeating subsequences of event types across the log.
   */
  private detectSequenceRepetition(
    eventLog: readonly EventEnvelope[],
  ): SkillCandidate[] {
    const candidates: SkillCandidate[] = [];

    // Build ordered list of event types
    const typeSequence = eventLog.map((e) => e.type);

    // Look for bigram repetitions (length 2)
    const bigramCounts = new Map<string, { count: number; eventIds: string[] }>();

    for (let i = 0; i < typeSequence.length - 1; i++) {
      const bigram = `${typeSequence[i]}->${typeSequence[i + 1]}`;
      const existing = bigramCounts.get(bigram);
      if (existing) {
        existing.count++;
        existing.eventIds.push(eventLog[i].id, eventLog[i + 1].id);
      } else {
        bigramCounts.set(bigram, {
          count: 1,
          eventIds: [eventLog[i].id, eventLog[i + 1].id],
        });
      }
    }

    // Find bigrams that repeat 2+ times
    for (const [bigram, data] of bigramCounts) {
      if (data.count >= 2) {
        // Derive name from event types
        const parts = bigram.split('->');
        const name = parts
          .map((p) => p.toLowerCase().replace(/_/g, '-'))
          .join('-to-');

        // Confidence: 0.3 + 0.15 * min(count, 4)
        const confidence = Math.min(
          1.0,
          0.3 + 0.15 * Math.min(data.count, 4),
        );

        // Deduplicate evidence
        const uniqueEvidence = [...new Set(data.eventIds)];

        candidates.push({
          name: `${name}-cycle`,
          description: `Repeating sequence: ${bigram} detected ${data.count} times across the mission`,
          trigger_pattern: bigram,
          confidence,
          evidence: uniqueEvidence,
          detection_method: 'sequence_repetition',
        });
      }
    }

    return candidates;
  }

  // --------------------------------------------------------------------------
  // Detection Method 3: Phase Correlation
  // --------------------------------------------------------------------------

  /**
   * Identify event type pairs that co-occur in 3+ phases.
   */
  private detectPhaseCorrelation(
    eventLog: readonly EventEnvelope[],
  ): SkillCandidate[] {
    const candidates: SkillCandidate[] = [];

    // Group events by phase
    const eventsByPhase = new Map<string, Set<string>>();
    const eventIdsByPhaseAndType = new Map<string, string[]>();

    for (const event of eventLog) {
      const payload = event.payload as Record<string, unknown>;
      let phase: string | undefined;

      if (event.type === 'TELEMETRY_UPDATE') {
        phase = payload.phase as string | undefined;
      } else if (event.type === 'LEDGER_ENTRY') {
        phase = payload.phase as string | undefined;
      }

      if (!phase) {
        // Try to infer phase from surrounding telemetry
        continue;
      }

      if (!eventsByPhase.has(phase)) {
        eventsByPhase.set(phase, new Set());
      }
      eventsByPhase.get(phase)!.add(event.type);

      const key = `${phase}:${event.type}`;
      if (!eventIdsByPhaseAndType.has(key)) {
        eventIdsByPhaseAndType.set(key, []);
      }
      eventIdsByPhaseAndType.get(key)!.push(event.id);
    }

    // Find event type pairs co-occurring in 3+ phases
    const eventTypes = new Set<string>();
    for (const types of eventsByPhase.values()) {
      for (const t of types) eventTypes.add(t);
    }
    const typeArray = [...eventTypes];

    for (let i = 0; i < typeArray.length; i++) {
      for (let j = i + 1; j < typeArray.length; j++) {
        const typeA = typeArray[i];
        const typeB = typeArray[j];

        // Count phases where both types co-occur
        const coOccurringPhases: string[] = [];
        for (const [phase, types] of eventsByPhase) {
          if (types.has(typeA) && types.has(typeB)) {
            coOccurringPhases.push(phase);
          }
        }

        if (coOccurringPhases.length >= 3) {
          const nameA = typeA.toLowerCase().replace(/_/g, '-');
          const nameB = typeB.toLowerCase().replace(/_/g, '-');

          // Collect evidence
          const evidence: string[] = [];
          for (const phase of coOccurringPhases) {
            const idsA = eventIdsByPhaseAndType.get(`${phase}:${typeA}`) ?? [];
            const idsB = eventIdsByPhaseAndType.get(`${phase}:${typeB}`) ?? [];
            evidence.push(...idsA, ...idsB);
          }

          const confidence = Math.min(
            1.0,
            0.4 + 0.15 * Math.min(coOccurringPhases.length, 4),
          );

          candidates.push({
            name: `${nameA}-with-${nameB}`,
            description: `${typeA} and ${typeB} co-occur in ${coOccurringPhases.length} phases: ${coOccurringPhases.join(', ')}`,
            trigger_pattern: `phase(${coOccurringPhases.join(',')}) -> ${typeA} + ${typeB}`,
            confidence,
            evidence: [...new Set(evidence)],
            detection_method: 'phase_correlation',
          });
        }
      }
    }

    return candidates;
  }

  // --------------------------------------------------------------------------
  // Detection Method 4: Attribution Cluster
  // --------------------------------------------------------------------------

  /**
   * Detect contributor handoff patterns in adjacent phases.
   *
   * Requires enrichment with a SkillPackageDraft.
   */
  private detectAttributionCluster(
    eventLog: readonly EventEnvelope[],
    skillPackage: SkillPackageDraft,
  ): SkillCandidate[] {
    const candidates: SkillCandidate[] = [];

    // Build map of contributor -> phases with entries
    const contributorPhases = new Map<string, Set<string>>();
    const contributorEvents = new Map<string, string[]>();

    const ledgerEntries = eventLog.filter((e) => e.type === 'LEDGER_ENTRY');
    for (const entry of ledgerEntries) {
      const payload = entry.payload as Record<string, unknown>;
      const contribId = payload.contributor_id as string;
      const phase = payload.phase as string;
      const weight = payload.context_weight as number;

      if (!contribId || !phase) continue;
      // Only consider entries with context_weight > 0.7
      if (typeof weight === 'number' && weight <= 0.7) continue;

      if (!contributorPhases.has(contribId)) {
        contributorPhases.set(contribId, new Set());
        contributorEvents.set(contribId, []);
      }
      contributorPhases.get(contribId)!.add(phase);
      contributorEvents.get(contribId)!.push(entry.id);
    }

    // Check for contributors in adjacent phases
    const contributors = [...contributorPhases.keys()];
    let overlapCount = 0;
    const evidence: string[] = [];

    for (let i = 0; i < contributors.length; i++) {
      for (let j = i + 1; j < contributors.length; j++) {
        const phasesA = [...contributorPhases.get(contributors[i])!];
        const phasesB = [...contributorPhases.get(contributors[j])!];

        for (const phaseA of phasesA) {
          const idxA = PHASE_ORDER.indexOf(phaseA);
          for (const phaseB of phasesB) {
            const idxB = PHASE_ORDER.indexOf(phaseB);
            if (Math.abs(idxA - idxB) === 1) {
              overlapCount++;
              evidence.push(
                ...(contributorEvents.get(contributors[i]) ?? []),
                ...(contributorEvents.get(contributors[j]) ?? []),
              );
            }
          }
        }
      }
    }

    if (overlapCount > 0) {
      const confidence = Math.min(1.0, 0.5 + 0.1 * overlapCount);
      const contribNames = skillPackage.contributors
        .filter((c) => contributorPhases.has(c.id))
        .map((c) => c.role)
        .join(', ');

      candidates.push({
        name: 'multi-contributor-handoff',
        description: `Contributor handoff pattern detected across adjacent phases involving: ${contribNames}`,
        trigger_pattern: `contributor[phase_n] -> contributor[phase_n+1] (${overlapCount} adjacent-phase overlaps)`,
        confidence,
        evidence: [...new Set(evidence)],
        detection_method: 'attribution_cluster',
      });
    }

    return candidates;
  }

  // --------------------------------------------------------------------------
  // Helpers
  // --------------------------------------------------------------------------

  /**
   * Deduplicate candidates by name, keeping the one with higher confidence.
   */
  private deduplicateCandidates(
    candidates: SkillCandidate[],
  ): SkillCandidate[] {
    const byName = new Map<string, SkillCandidate>();
    for (const c of candidates) {
      const existing = byName.get(c.name);
      if (!existing || c.confidence > existing.confidence) {
        byName.set(c.name, c);
      }
    }
    return [...byName.values()];
  }
}
