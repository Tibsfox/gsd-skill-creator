/**
 * Failure Pattern Library — learnable failure knowledge for skills.
 *
 * Captures, classifies, indexes, and retrieves failure patterns so that
 * skills can learn from past failures without repeating them.
 *
 * # Model
 *
 * A `FailurePattern` captures:
 *   - What happened (category, symptom, root cause)
 *   - Where it happened (phase, agent, files)
 *   - How to detect it (detection signals)
 *   - How to prevent it (mitigation strategies)
 *   - How often it recurs (occurrence count, last seen)
 *
 * Skills query the library via:
 *   - `matchContext()` — find patterns relevant to the current work
 *   - `forCategory()` — get all patterns of a failure type
 *   - `forAgent()` — get patterns an agent has caused or experienced
 *   - `mostFrequent()` — get the most common failure patterns
 *   - `search()` — keyword search across all pattern fields
 *
 * # Lifecycle
 *
 *   1. Forensics investigation discovers a failure
 *   2. PropagationGraph identifies root cause and blast radius
 *   3. `recordPattern()` adds it to the library with detection + mitigation
 *   4. Future skill activations call `matchContext()` to check for known pitfalls
 *   5. Each recurrence increments the occurrence count
 *
 * @module integration/failure-library
 */

import type { FailureCategory, Severity } from './propagation-graph.js';

// ─── Types ──────────────────────────────────────────────────────────────────

/** A captured failure pattern. */
export interface FailurePattern {
  /** Unique pattern ID. */
  id: string;
  /** Short descriptive name. */
  name: string;
  /** Failure category from the taxonomy. */
  category: FailureCategory;
  /** Severity when this pattern manifests. */
  severity: Severity;
  /** What the failure looks like (the symptom). */
  symptom: string;
  /** What caused the failure (root cause analysis). */
  rootCause: string;
  /** How to detect this pattern early. */
  detectionSignals: string[];
  /** How to prevent or mitigate this failure. */
  mitigations: string[];
  /** Which phases this pattern tends to occur in. */
  affectedPhases: string[];
  /** Which agents are involved. */
  affectedAgents: string[];
  /** File patterns that are often involved (globs). */
  filePatterns: string[];
  /** Keywords for search matching. */
  keywords: string[];
  /** Number of times this pattern has been observed. */
  occurrenceCount: number;
  /** When this pattern was first recorded. */
  firstSeen: string;
  /** When this pattern was last observed. */
  lastSeen: string;
  /** Blast radius: how many downstream nodes were affected. */
  blastRadius: number;
  /** Source propagation graph node ID (if captured from forensics). */
  sourceNodeId?: string;
  /** Whether a mitigation has been implemented. */
  mitigated: boolean;
}

/** Context for matching patterns against current work. */
export interface WorkContext {
  /** Current phase being executed. */
  phase?: string;
  /** Current agent doing the work. */
  agent?: string;
  /** Files being touched. */
  files?: string[];
  /** Keywords from the task description. */
  keywords?: string[];
}

/** A matched pattern with relevance score. */
export interface PatternMatchResult {
  pattern: FailurePattern;
  relevance: number; // 0.0 to 1.0
  matchReasons: string[];
}

// ─── FailureLibrary ─────────────────────────────────────────────────────────

/**
 * In-memory failure pattern library with context-aware retrieval.
 */
export class FailureLibrary {
  private readonly patterns = new Map<string, FailurePattern>();
  private nextId = 1;

  /** Total patterns in the library. */
  get size(): number { return this.patterns.size; }

  // ─── Recording ────────────────────────────────────────────────────────

  /**
   * Record a new failure pattern. Returns the pattern ID.
   * If a pattern with the same name exists, increments its occurrence count.
   */
  record(input: Omit<FailurePattern, 'id' | 'occurrenceCount' | 'firstSeen' | 'lastSeen' | 'mitigated'>): string {
    // Check for existing pattern with same name
    for (const [id, existing] of this.patterns) {
      if (existing.name === input.name) {
        existing.occurrenceCount++;
        existing.lastSeen = new Date().toISOString();
        if (input.blastRadius > existing.blastRadius) {
          existing.blastRadius = input.blastRadius;
        }
        return id;
      }
    }

    const id = `FP-${this.nextId++}`;
    const now = new Date().toISOString();
    this.patterns.set(id, {
      ...input,
      id,
      occurrenceCount: 1,
      firstSeen: now,
      lastSeen: now,
      mitigated: false,
    });
    return id;
  }

  /**
   * Record an occurrence of an existing pattern.
   */
  recordOccurrence(patternId: string): void {
    const pattern = this.patterns.get(patternId);
    if (pattern) {
      pattern.occurrenceCount++;
      pattern.lastSeen = new Date().toISOString();
    }
  }

  /**
   * Mark a pattern as mitigated.
   */
  markMitigated(patternId: string): void {
    const pattern = this.patterns.get(patternId);
    if (pattern) pattern.mitigated = true;
  }

  // ─── Retrieval ────────────────────────────────────────────────────────

  /** Get a pattern by ID. */
  get(patternId: string): FailurePattern | undefined {
    return this.patterns.get(patternId);
  }

  /** Get all patterns. */
  all(): FailurePattern[] {
    return Array.from(this.patterns.values());
  }

  /** Get patterns by category. */
  forCategory(category: FailureCategory): FailurePattern[] {
    return this.all().filter(p => p.category === category);
  }

  /** Get patterns involving a specific agent. */
  forAgent(agent: string): FailurePattern[] {
    return this.all().filter(p => p.affectedAgents.includes(agent));
  }

  /** Get patterns affecting a specific phase. */
  forPhase(phase: string): FailurePattern[] {
    return this.all().filter(p => p.affectedPhases.includes(phase));
  }

  /** Get the N most frequent failure patterns. */
  mostFrequent(limit = 10): FailurePattern[] {
    return this.all()
      .sort((a, b) => b.occurrenceCount - a.occurrenceCount)
      .slice(0, limit);
  }

  /** Get unmitigated patterns sorted by severity then frequency. */
  unmitigated(): FailurePattern[] {
    const severityOrder: Record<Severity, number> = {
      critical: 0, high: 1, medium: 2, low: 3,
    };
    return this.all()
      .filter(p => !p.mitigated)
      .sort((a, b) => {
        const sevDiff = severityOrder[a.severity] - severityOrder[b.severity];
        return sevDiff !== 0 ? sevDiff : b.occurrenceCount - a.occurrenceCount;
      });
  }

  /** Keyword search across all pattern fields. */
  search(keyword: string): FailurePattern[] {
    const kw = keyword.toLowerCase();
    return this.all().filter(p =>
      p.name.toLowerCase().includes(kw) ||
      p.symptom.toLowerCase().includes(kw) ||
      p.rootCause.toLowerCase().includes(kw) ||
      p.keywords.some(k => k.toLowerCase().includes(kw)) ||
      p.detectionSignals.some(d => d.toLowerCase().includes(kw)) ||
      p.mitigations.some(m => m.toLowerCase().includes(kw)),
    );
  }

  // ─── Context Matching ─────────────────────────────────────────────────

  /**
   * Find failure patterns relevant to the current work context.
   * Returns matches sorted by relevance score.
   *
   * Skills should call this before starting work to check for known pitfalls.
   */
  matchContext(ctx: WorkContext, minRelevance = 0.2): PatternMatchResult[] {
    const results: PatternMatchResult[] = [];

    for (const pattern of this.patterns.values()) {
      let score = 0;
      const reasons: string[] = [];

      // Phase match
      if (ctx.phase && pattern.affectedPhases.includes(ctx.phase)) {
        score += 0.3;
        reasons.push(`affects phase "${ctx.phase}"`);
      }

      // Agent match
      if (ctx.agent && pattern.affectedAgents.includes(ctx.agent)) {
        score += 0.3;
        reasons.push(`involves agent "${ctx.agent}"`);
      }

      // File pattern match
      if (ctx.files) {
        for (const file of ctx.files) {
          for (const fp of pattern.filePatterns) {
            if (file.includes(fp) || fp.includes(file.split('/').pop() ?? '')) {
              score += 0.2;
              reasons.push(`file pattern "${fp}" matches "${file}"`);
              break;
            }
          }
        }
      }

      // Keyword overlap
      if (ctx.keywords) {
        const ctxKw = new Set(ctx.keywords.map(k => k.toLowerCase()));
        const matches = pattern.keywords.filter(k => ctxKw.has(k.toLowerCase()));
        if (matches.length > 0) {
          score += 0.2 * (matches.length / Math.max(pattern.keywords.length, 1));
          reasons.push(`keywords: ${matches.join(', ')}`);
        }
      }

      // Frequency boost: patterns seen many times are more relevant
      if (pattern.occurrenceCount >= 3) score += 0.1;

      // Severity boost: critical/high patterns get extra attention
      if (pattern.severity === 'critical') score += 0.1;
      else if (pattern.severity === 'high') score += 0.05;

      // Cap at 1.0
      score = Math.min(score, 1.0);

      if (score >= minRelevance) {
        results.push({ pattern, relevance: score, matchReasons: reasons });
      }
    }

    return results.sort((a, b) => b.relevance - a.relevance);
  }

  // ─── Serialization ────────────────────────────────────────────────────

  /** Export all patterns as a JSON-serializable array. */
  export(): FailurePattern[] {
    return this.all();
  }

  /** Import patterns from a previously exported array. */
  import(patterns: FailurePattern[]): void {
    for (const p of patterns) {
      this.patterns.set(p.id, { ...p });
      const num = parseInt(p.id.replace('FP-', ''), 10);
      if (num >= this.nextId) this.nextId = num + 1;
    }
  }

  // ─── Statistics ───────────────────────────────────────────────────────

  /** Summary statistics for the library. */
  stats(): {
    totalPatterns: number;
    byCategory: Record<string, number>;
    bySeverity: Record<string, number>;
    mitigated: number;
    unmitigated: number;
    totalOccurrences: number;
    avgBlastRadius: number;
  } {
    const byCategory: Record<string, number> = {};
    const bySeverity: Record<string, number> = {};
    let mitigated = 0;
    let totalOccurrences = 0;
    let totalBlast = 0;

    for (const p of this.patterns.values()) {
      byCategory[p.category] = (byCategory[p.category] ?? 0) + 1;
      bySeverity[p.severity] = (bySeverity[p.severity] ?? 0) + 1;
      if (p.mitigated) mitigated++;
      totalOccurrences += p.occurrenceCount;
      totalBlast += p.blastRadius;
    }

    return {
      totalPatterns: this.patterns.size,
      byCategory,
      bySeverity,
      mitigated,
      unmitigated: this.patterns.size - mitigated,
      totalOccurrences,
      avgBlastRadius: this.patterns.size > 0 ? totalBlast / this.patterns.size : 0,
    };
  }
}
