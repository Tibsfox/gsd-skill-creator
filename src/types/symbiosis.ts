/**
 * Living Sensoria M8 types — teaching ledger, co-evolution offerings,
 * Quintessence 5-axis metric suite.
 *
 * Wave 0.1 of the Living Sensoria milestone (v1.49.561). Types only;
 * the ledgers, periodic pass, and CLI land in Phase 641 (Wave 1 Track C).
 *
 * Sources: Foxglove 2026, *The Space Between: The Autodidact's Guide to the
 * Galaxy* (pp. xxv–xxxii); Lanzara & Kuperstein 1991, *Quintessence* frame
 * (five features of life) cited throughout Lanzara 2023 Chapter 7.
 *
 * @module types/symbiosis
 */

// ─── Teaching ledger (developer → system) ───────────────────────────────

/**
 * Fixed categorical taxonomy for teaching entries. `correction` is a
 * direct override; `clarification` disambiguates repo-local terminology;
 * `constraint` declares something to never do; `pattern` encodes a
 * repeated check; `preference` expresses a stylistic lean. Bounded set
 * prevents scope creep; all entries must fit one of these.
 */
export type TeachCategory =
  | 'correction'
  | 'clarification'
  | 'constraint'
  | 'pattern'
  | 'preference';

export interface TeachEntry {
  id: string;
  ts: number;
  category: TeachCategory;
  content: string;
  /** References to M3 traces, M1 entities, or skill IDs the entry applies to. */
  refs: string[];
  /**
   * ME-4: Expected effect level of this teach entry on the targeted skill.
   * Derived from the ME-1 tractability classification at commit time.
   *
   *   high   — tractable (structured-output skill; edits have reliable effect)
   *   medium — reserved for future hybrid-tractability classes
   *   low    — coin-flip or unknown (prose/undeclared; effect is unreliable)
   *
   * Optional for backwards compatibility: historical entries without the field
   * are treated as 'low' by consumers (conservative default per ME-4 proposal
   * §Ledger back-compatibility).
   */
  expected_effect?: 'low' | 'medium' | 'high';
}

// ─── Co-evolution ledger (system → developer) ───────────────────────────

/**
 * Offering types emitted by the periodic co-evolution pass. These are
 * observations the system surfaces to the developer, not alerts. Language
 * is engineering-observational only; parasocial-guard rejects emotional,
 * first-person-plural, or relational framings before emission.
 */
export type OfferingKind =
  | 'trajectory'
  | 'consistency'
  | 'pattern'
  | 'opportunity';

export interface CoEvolutionOffering {
  id: string;
  ts: number;
  kind: OfferingKind;
  content: string;
  /** Pointers back to source data so the developer can audit the claim. */
  sourcePointers: string[];
}

// ─── Quintessence metric suite ──────────────────────────────────────────

/**
 * One row of the 5-axis Quintessence time series. All five axes are
 * computed from existing M1–M7 module outputs; no new instrumentation is
 * added. Each axis is a number in a domain documented by its computation
 * (see component 08-m8-symbiosis.md §Quintessence metric suite).
 */
export interface QuintessenceSnapshot {
  ts: number;
  /** Fraction of project-unique M1 community-memberships vs borrowed. */
  selfVsNonSelf: number;
  /** Override-ratio + 20%-bound-hit ratio (homeostatic-tension measure). */
  essentialTensions: number;
  /** Rolling average tokens-per-productive-outcome (negentropy proxy). */
  growthAndEnergyFlow: number;
  /** Trunk-preserved / branch-committed session ratio. */
  stabilityVsNovelty: number;
  /** Count of M3 decisions whose retrospective outcome-impact exceeds threshold. */
  fatefulEncounters: number;
}
