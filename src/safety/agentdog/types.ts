/**
 * HB-02 AgentDoG — composite diagnostic types.
 *
 * The `AgentDogDiagnostic` is a *diagnostic enrichment* alongside an
 * existing Safety Warden BLOCK record. It is NEVER a gate-decision input;
 * the Safety Warden's actual BLOCK logic is unchanged.
 *
 * @module safety/agentdog/types
 */

import type { WhereAxis } from './where.js';
import type { HowAxis } from './how.js';
import type { WhatAxis } from './what.js';

/** Schema version — bump on any shape change. */
export const AGENTDOG_SCHEMA_VERSION = '1.0.0' as const;

/**
 * Composite three-axis diagnostic record.
 *
 * Matches the spec's `AgentDogDiagnostic` interface.
 */
export interface AgentDogDiagnostic {
  readonly schemaVersion: typeof AGENTDOG_SCHEMA_VERSION;
  readonly where: WhereAxis;
  readonly how: HowAxis;
  readonly what: WhatAxis;
}

/**
 * Input shape — what the existing Safety Warden BLOCK path provides.
 * All fields optional so any existing BLOCK call-site can opt-in by
 * passing what it has.
 */
export interface BlockContext {
  component?: string;
  invocationContext?: string;
  vulnerabilityVector?: string;
  escalationPattern?: string;
  impactedAsset?: string;
  blastRadius?: string;
}

/**
 * Result shape from `emitAgentDogDiagnostic`.
 *
 * `disabled: true` means the flag was off and no diagnostic was produced —
 * the existing BLOCK path runs byte-identical.
 */
export interface AgentDogEmitResult {
  readonly emitted: boolean;
  readonly disabled: boolean;
  readonly diagnostic: AgentDogDiagnostic | null;
}
