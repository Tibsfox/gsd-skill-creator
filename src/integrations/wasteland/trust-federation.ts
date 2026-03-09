/**
 * Trust Federation — w-wl-federation
 *
 * Cross-instance trust protocol. Each Wasteland instance is sovereign
 * over its own social graph. Federation enables:
 *   - Bridge potential across instances (without sharing raw graph data)
 *   - Clock skew tolerance for timestamps
 *   - Burn calendar integration for event-scoped TTL
 *   - Data sovereignty enforcement for exports/imports
 *   - Attestation freshness validation (anti-replay)
 *
 * The privacy invariant: no raw trust graph data crosses instance
 * boundaries. Instances exchange attestations (aggregate summaries),
 * never raw vectors, labels, or relationship details. Strength is
 * coarsened into 3 buckets (weak/moderate/strong) to prevent
 * reconstruction of exact trust magnitudes.
 *
 * Structurally: each instance is a regional burn. Sovereign but
 * connected. Same 10 principles, same schemas, their own local
 * culture. The federation protocol is how regional burns talk to
 * each other without compromising participant privacy.
 *
 * @module trust-federation
 */

// ============================================================================
// Federation Instance Identity
// ============================================================================

/** Identifies a Wasteland federation instance. */
export interface FederationInstance {
  /** Unique instance identifier (UUID). */
  id: string;
  /** Human-readable name (e.g., "center-camp", "afrikaburn-2026"). */
  name: string;
  /** DoltHub remote URL (for schema sync, not data sync). */
  remote?: string;
  /** Clock offset from UTC in milliseconds (measured at last sync). */
  clockOffsetMs: number;
  /** When this instance was last seen (UTC). */
  lastSyncAt: string;
}

// ============================================================================
// Trust Attestations
// ============================================================================

/**
 * Trust attestation — what one instance shares about a rig.
 *
 * This is the ONLY trust data that crosses instance boundaries.
 * Aggregate stats, no raw vectors, no labels, no relationship details.
 * The consent pattern is fractal — this is it at the federation scale.
 */
export interface TrustAttestation {
  /** The rig this attestation describes. */
  handle: string;
  /** The instance providing this attestation. */
  instanceId: string;
  /** Community trust level (0-3). Already public. */
  trustLevel: number;
  /** Number of active connections (count only, no details). */
  activeConnectionCount: number;
  /** Graph diversity score (0-1, aggregate). */
  diversityScore: number;
  /** Number of multi-context bonds (count only). */
  bondCount: number;
  /** When this attestation was generated (UTC). */
  attestedAt: string;
}

/**
 * Bridge attestation — "rig X has a connection to rig Y" (yes/no).
 *
 * No details about the connection — just existence and a coarsened
 * strength bucket. This enables cross-instance bridge potential
 * without exposing graph structure.
 */
export interface BridgeAttestation {
  /** Instance providing the attestation. */
  instanceId: string;
  /** One side of the connection. */
  handleA: string;
  /** Other side. */
  handleB: string;
  /** Whether the connection is currently active. */
  active: boolean;
  /** Coarse strength bucket — prevents magnitude reconstruction. */
  strengthBucket: 'weak' | 'moderate' | 'strong';
  /** When this attestation was generated (UTC). */
  attestedAt: string;
}

// ============================================================================
// Clock Skew Tolerance
// ============================================================================

/** Default clock skew tolerance: 5 minutes. */
export const DEFAULT_CLOCK_SKEW_MS = 5 * 60 * 1000;

/**
 * Check whether two timestamps are within clock skew tolerance.
 *
 * Used for cross-instance operations where clocks may differ.
 * Owl's recommendation: 5-minute default, configurable per-instance.
 */
export function withinClockSkew(
  localTime: Date,
  remoteTime: Date,
  toleranceMs: number = DEFAULT_CLOCK_SKEW_MS,
): boolean {
  return Math.abs(localTime.getTime() - remoteTime.getTime()) <= toleranceMs;
}

/**
 * Adjust a remote timestamp for known clock offset.
 *
 * When we know an instance's clock is offset by N milliseconds,
 * we adjust their timestamps before comparison.
 */
export function adjustForClockOffset(
  remoteTime: Date,
  clockOffsetMs: number,
): Date {
  return new Date(remoteTime.getTime() - clockOffsetMs);
}

/**
 * Measure clock offset between local and remote instance.
 *
 * Simple NTP-like measurement: send timestamp, receive remote timestamp,
 * receive local timestamp. Returns offset in milliseconds.
 * Positive = remote clock is ahead of local.
 */
export function measureClockOffset(
  localSendTime: Date,
  remoteReceiveTime: Date,
  localReceiveTime: Date,
): number {
  const localMidpoint = (localSendTime.getTime() + localReceiveTime.getTime()) / 2;
  return remoteReceiveTime.getTime() - localMidpoint;
}

// ============================================================================
// Burn Calendar
// ============================================================================

/** A calendar event that can anchor contract TTLs. */
export interface BurnEvent {
  /** Event identifier. */
  id: string;
  /** Event name (e.g., "Burning Man 2026", "AfrikaBurn 2026"). */
  name: string;
  /** Event start (UTC ISO string). */
  startsAt: string;
  /** Event end (UTC ISO string). */
  endsAt: string;
  /** Instance that hosts this event (optional — some are multi-instance). */
  hostInstanceId?: string;
}

/**
 * Compute the TTL for an event-scoped contract from a burn calendar event.
 *
 * Returns seconds from `now` until the event ends. If the event has
 * already ended, returns 0. If the event hasn't started yet, returns
 * seconds from now until event end (so the contract covers the full event).
 */
export function eventTTLFromCalendar(
  event: BurnEvent,
  now: Date = new Date(),
): number {
  const endTime = new Date(event.endsAt).getTime();
  const remaining = (endTime - now.getTime()) / 1000;
  return Math.max(0, Math.round(remaining));
}

/**
 * Check whether a date falls within a burn event.
 */
export function isDuringEvent(
  event: BurnEvent,
  date: Date = new Date(),
): boolean {
  const start = new Date(event.startsAt).getTime();
  const end = new Date(event.endsAt).getTime();
  const time = date.getTime();
  return time >= start && time <= end;
}

/**
 * Find the active event from a calendar, if any.
 */
export function findActiveEvent(
  calendar: BurnEvent[],
  now: Date = new Date(),
): BurnEvent | null {
  return calendar.find(e => isDuringEvent(e, now)) ?? null;
}

/**
 * Find the next upcoming event from a calendar.
 */
export function findNextEvent(
  calendar: BurnEvent[],
  now: Date = new Date(),
): BurnEvent | null {
  const upcoming = calendar
    .filter(e => new Date(e.startsAt).getTime() > now.getTime())
    .sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime());
  return upcoming[0] ?? null;
}

// ============================================================================
// Data Sovereignty
// ============================================================================

/** Fields safe to include in federation exports (from rigs table). */
export const PUBLIC_EXPORT_FIELDS = [
  'handle',
  'trust_level',
  'registered_at',
  'trust_level_changed_at',
] as const;

/** Fields that MUST be stripped from federation exports. */
export const PRIVATE_EXPORT_FIELDS = [
  'from_time',
  'from_depth',
  'to_time',
  'to_depth',
  'from_label',
  'to_label',
  'visibility',
] as const;

/**
 * Filter a record for safe federation export.
 *
 * Strips all fields not in the allow-list. This is the data sovereignty
 * boundary — the last checkpoint before data leaves the instance.
 */
export function filterForExport<T extends Record<string, unknown>>(
  record: T,
  allowedFields: readonly string[],
): Partial<T> {
  const result: Record<string, unknown> = {};
  for (const field of allowedFields) {
    if (field in record) {
      result[field] = record[field];
    }
  }
  return result as Partial<T>;
}

/**
 * Check whether a record contains any private fields.
 *
 * Use as a safety check before federation export — if any private
 * field is present, the export should be blocked.
 */
export function containsPrivateFields(
  record: Record<string, unknown>,
): { safe: boolean; found: string[] } {
  const found = (PRIVATE_EXPORT_FIELDS as readonly string[]).filter(f => f in record);
  return { safe: found.length === 0, found };
}

// ============================================================================
// Attestation Creation
// ============================================================================

/**
 * Create a trust attestation for a rig — the safe summary for federation.
 */
export function createAttestation(
  handle: string,
  instanceId: string,
  trustLevel: number,
  activeConnectionCount: number,
  diversityScore: number,
  bondCount: number,
  now: Date = new Date(),
): TrustAttestation {
  return {
    handle,
    instanceId,
    trustLevel,
    activeConnectionCount,
    diversityScore,
    bondCount,
    attestedAt: now.toISOString(),
  };
}

/**
 * Coarsen a trust magnitude into a strength bucket.
 *
 * Three buckets prevent reconstruction of exact magnitudes:
 *   weak:     magnitude < 0.33
 *   moderate: 0.33 <= magnitude < 0.67
 *   strong:   magnitude >= 0.67
 */
export function magnitudeToBucket(magnitude: number): 'weak' | 'moderate' | 'strong' {
  if (magnitude < 0.33) return 'weak';
  if (magnitude < 0.67) return 'moderate';
  return 'strong';
}

/**
 * Create a bridge attestation — "these two rigs are connected."
 *
 * The strength bucket coarsens the magnitude to prevent reconstruction.
 * This is the privacy-preserving version of the bridge potential input.
 */
export function createBridgeAttestation(
  instanceId: string,
  handleA: string,
  handleB: string,
  active: boolean,
  magnitude: number,
  now: Date = new Date(),
): BridgeAttestation {
  return {
    instanceId,
    handleA,
    handleB,
    active,
    strengthBucket: magnitudeToBucket(magnitude),
    attestedAt: now.toISOString(),
  };
}

// ============================================================================
// Attestation Validation
// ============================================================================

/** Default maximum attestation age: 24 hours. */
export const DEFAULT_MAX_ATTESTATION_AGE_MS = 24 * 60 * 60 * 1000;

/**
 * Validate that an incoming attestation is fresh (not stale/replayed).
 *
 * Checks:
 *   - Timestamp is parseable
 *   - Not from the future (beyond clock skew tolerance)
 *   - Not too old (beyond max age)
 */
export function validateAttestation(
  attestation: { attestedAt: string },
  now: Date = new Date(),
  maxAgeMs: number = DEFAULT_MAX_ATTESTATION_AGE_MS,
): { valid: boolean; reason?: string } {
  const attestedAt = new Date(attestation.attestedAt);

  if (isNaN(attestedAt.getTime())) {
    return { valid: false, reason: 'invalid attestedAt timestamp' };
  }

  const ageMs = now.getTime() - attestedAt.getTime();

  // Future timestamp — possible clock skew
  if (ageMs < 0) {
    if (Math.abs(ageMs) > DEFAULT_CLOCK_SKEW_MS) {
      return {
        valid: false,
        reason: `future timestamp beyond clock skew tolerance (${Math.abs(ageMs)}ms ahead)`,
      };
    }
    return { valid: true };
  }

  if (ageMs > maxAgeMs) {
    return {
      valid: false,
      reason: `attestation too old (${Math.round(ageMs / 1000)}s, max ${Math.round(maxAgeMs / 1000)}s)`,
    };
  }

  return { valid: true };
}

// ============================================================================
// Federated Bridge Potential
// ============================================================================

/** Weight assigned to each strength bucket for federated bridge computation. */
const BUCKET_WEIGHT: Record<'weak' | 'moderate' | 'strong', number> = {
  weak: 0.2,
  moderate: 0.5,
  strong: 0.8,
};

/** A potential cross-instance bridge — introduction path via a remote instance. */
export interface FederatedBridgePath {
  /** The rig seeking introduction (local). */
  from: string;
  /** The intermediate rig (the bridge — connected locally). */
  through: string;
  /** The rig who could be introduced (on the remote instance). */
  to: string;
  /** Bridge potential score (0-1). */
  potential: number;
  /** Which instance the target rig is on. */
  targetInstanceId: string;
}

/**
 * Compute federated bridge potential using remote attestations.
 *
 * Like local bridge potential but uses coarsened strength buckets
 * instead of raw magnitudes — preserving privacy. The local leg uses
 * real magnitudes (you know your own graph); the remote leg uses the
 * bucket weight.
 *
 * Constraints (same as local):
 *   - 2-hop max (ego-local)
 *   - Does not suggest rigs already directly connected
 *   - Multiplicative formula
 *
 * @param focus — the local rig computing bridges
 * @param localMagnitudes — map of peer handle → local trust magnitude
 * @param remoteAttestations — bridge attestations from remote instances
 * @param directPeers — handles the focus rig is directly connected to
 */
export function computeFederatedBridges(
  focus: string,
  localMagnitudes: Map<string, number>,
  remoteAttestations: BridgeAttestation[],
  directPeers: Set<string>,
): FederatedBridgePath[] {
  const bridges: FederatedBridgePath[] = [];

  for (const att of remoteAttestations) {
    if (!att.active) continue;

    // The attestation says "handleA and handleB are connected on remote instance"
    // We need: one end is a local peer (the bridge), the other is the target
    let bridge: string | null = null;
    let target: string | null = null;

    if (localMagnitudes.has(att.handleA) && !directPeers.has(att.handleB) && att.handleB !== focus) {
      bridge = att.handleA;
      target = att.handleB;
    } else if (localMagnitudes.has(att.handleB) && !directPeers.has(att.handleA) && att.handleA !== focus) {
      bridge = att.handleB;
      target = att.handleA;
    }

    if (!bridge || !target) continue;

    const localMag = localMagnitudes.get(bridge) ?? 0;
    const remoteMag = BUCKET_WEIGHT[att.strengthBucket];
    const potential = localMag * remoteMag;

    bridges.push({
      from: focus,
      through: bridge,
      to: target,
      potential,
      targetInstanceId: att.instanceId,
    });
  }

  bridges.sort((a, b) => b.potential - a.potential);
  return bridges;
}
