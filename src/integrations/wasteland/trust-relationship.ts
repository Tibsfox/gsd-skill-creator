/**
 * Trust Relationship Engine — Unit Circle Model
 *
 * Complements trust-escalation.ts (community trust levels 1–3: Seedling,
 * Sapling, Old Growth) with interpersonal trust connections between
 * specific rigs.
 *
 * Community trust (the escalation engine) is vertical — a single level
 * that never decreases. Interpersonal trust (this module) is lateral —
 * bilateral connections between two rigs on the complex plane.
 *
 * Trust Vector:
 *   z = r · e^(iθ) = r·cos(θ) + i·r·sin(θ)
 *
 *   Real axis      = sharedTime  — how long have we known each other (0–1)
 *   Imaginary axis = sharedDepth — how deeply are we connected (0–1)
 *
 *   magnitude = min(1, √(time² + depth²))  — overall trust strength
 *   theta     = atan2(depth, time)          — character of the trust
 *
 * The magnitude tells you HOW MUCH trust exists.
 * The angle tells you WHAT KIND of trust it is:
 *   θ near 0°  → history-anchored (we've been through a lot, over time)
 *   θ near 45° → balanced (equal parts history and depth)
 *   θ near 90° → depth-forged (we connected deeply, maybe quickly)
 *
 * TTL is on the contract, not the trust. A 15-minute game creates an
 * ephemeral contract, but the connection it forges may persist. The
 * contract expires; the memory of the connection does not.
 *
 * Privacy invariant: The social graph — who trusts whom, the connections
 * between participants — is private data owned by the participants.
 * Never public, never committed, never aggregated.
 */

// ============================================================================
// Trust Vector (Unit Circle)
// ============================================================================

/** A trust vector on the unit disk (complex plane, |z| ≤ 1). */
export interface TrustVector {
  /** How long we've known each other (real axis, 0–1). */
  sharedTime: number;
  /** How deeply we're connected (imaginary axis, 0–1). */
  sharedDepth: number;
  /** Overall trust strength: min(1, √(time² + depth²)). */
  magnitude: number;
  /** Character of trust in radians: atan2(depth, time). Range [0, π/2]. */
  theta: number;
}

/**
 * Compute a trust vector from shared time and shared depth.
 *
 * Both inputs are clamped to [0, 1]. The resulting vector lives in
 * the first quadrant of the unit disk — both axes are non-negative,
 * and the magnitude is capped at 1.0 (the unit circle boundary).
 *
 * Examples:
 *   computeVector(0.8, 0.3)  → r≈0.85, θ≈21° — history-anchored
 *   computeVector(0.1, 0.9)  → r≈0.91, θ≈84° — depth-forged
 *   computeVector(1.0, 1.0)  → r=1.00, θ=45°  — fully balanced (boundary)
 *   computeVector(0.05, 0.2) → r≈0.21, θ≈76° — light ephemeral touch
 */
export function computeVector(sharedTime: number, sharedDepth: number): TrustVector {
  const t = Math.max(0, Math.min(1, sharedTime));
  const d = Math.max(0, Math.min(1, sharedDepth));
  return {
    sharedTime: t,
    sharedDepth: d,
    magnitude: Math.min(1, Math.sqrt(t * t + d * d)),
    theta: t === 0 && d === 0 ? 0 : Math.atan2(d, t),
  };
}

/**
 * Classify a trust vector by its angle — what kind of trust is this?
 *
 * Returns a human-readable label for the trust character:
 *   "unconnected"     — magnitude near zero
 *   "history-anchored" — θ < 22.5° (mostly shared time)
 *   "time-leading"     — 22.5° ≤ θ < 37.5°
 *   "balanced"         — 37.5° ≤ θ < 52.5°
 *   "depth-leading"    — 52.5° ≤ θ < 67.5°
 *   "depth-forged"     — θ ≥ 67.5° (mostly shared depth)
 */
export function classifyVector(vector: TrustVector): string {
  if (vector.magnitude < 0.05) return 'unconnected';

  const degrees = vector.theta * (180 / Math.PI);
  if (degrees < 22.5) return 'history-anchored';
  if (degrees < 37.5) return 'time-leading';
  if (degrees < 52.5) return 'balanced';
  if (degrees < 67.5) return 'depth-leading';
  return 'depth-forged';
}

/**
 * Describe a trust vector as a concise human-readable string.
 *
 * "salmon-042 → cedar-011: depth-forged (r=0.91, θ=84°)"
 */
export function describeVector(vector: TrustVector): string {
  const degrees = Math.round(vector.theta * (180 / Math.PI));
  const classification = classifyVector(vector);
  return `${classification} (r=${vector.magnitude.toFixed(2)}, θ=${degrees}°)`;
}

// ============================================================================
// Trust Contract (time-bound wrapper)
// ============================================================================

/** The type of a trust contract — how long is this connection intended to last? */
export type TrustContractType =
  | 'permanent'       // forever — married, family, chosen family
  | 'long-term'       // years — camp mates across burns, old friends
  | 'event-scoped'    // duration of a burn — met this event, camping together
  | 'project-scoped'  // duration of a collaboration — building this art piece
  | 'ephemeral';      // minutes to hours — "I'm Fox, let's play a 15-minute game"

/** A time-bound wrapper for a trust connection. */
export interface TrustContract {
  /** Unique contract ID. */
  id: string;
  /** What kind of connection this represents. */
  type: TrustContractType;
  /** TTL in seconds. null = permanent (no expiry). */
  ttl: number | null;
  /** When the contract was created (ISO 8601). */
  createdAt: string;
  /** When the contract expires (ISO 8601). null = never. */
  expiresAt: string | null;
}

/** Default TTLs for each contract type (in seconds). null = no default. */
const DEFAULT_TTLS: Record<TrustContractType, number | null> = {
  permanent: null,
  'long-term': null,
  'event-scoped': 7 * 24 * 60 * 60,     // 7 days (burn week)
  'project-scoped': 30 * 24 * 60 * 60,  // 30 days
  ephemeral: 60 * 60,                    // 1 hour
};

/**
 * Create a trust contract.
 *
 * @param type — the contract type
 * @param ttlSeconds — override TTL in seconds (null = permanent, undefined = use default)
 * @param now — current time (for testing)
 */
export function createContract(
  type: TrustContractType,
  ttlSeconds?: number | null,
  now: Date = new Date(),
): TrustContract {
  const ttl = ttlSeconds !== undefined ? ttlSeconds : DEFAULT_TTLS[type];
  const createdAt = now.toISOString();
  const expiresAt = ttl !== null
    ? new Date(now.getTime() + ttl * 1000).toISOString()
    : null;

  return {
    id: generateContractId(type, now),
    type,
    ttl,
    createdAt,
    expiresAt,
  };
}

/**
 * Check if a trust contract is still active.
 */
export function isContractActive(contract: TrustContract, now: Date = new Date()): boolean {
  if (contract.expiresAt === null) return true;
  return now < new Date(contract.expiresAt);
}

/**
 * Remaining seconds on a contract. Infinity for permanent, 0 if expired.
 */
export function contractTimeRemaining(contract: TrustContract, now: Date = new Date()): number {
  if (contract.expiresAt === null) return Infinity;
  const remaining = (new Date(contract.expiresAt).getTime() - now.getTime()) / 1000;
  return Math.max(0, remaining);
}

// ============================================================================
// Trust Relationship (bilateral connection)
// ============================================================================

/**
 * A trust relationship between two rigs.
 *
 * Trust is not always symmetric — how deeply I feel connected to you
 * may differ from how deeply you feel connected to me. Each side has
 * its own vector. The contract is shared.
 *
 * Multiple relationships between the same two rigs are allowed — you
 * can have a permanent trust (family) AND an event-scoped trust (we're
 * at this burn together) simultaneously.
 */
export interface TrustRelationship {
  /** Rig A handle. */
  from: string;
  /** Rig B handle. */
  to: string;
  /** How rig A sees this connection (their depth/time values). */
  fromVector: TrustVector;
  /** How rig B sees this connection (their depth/time values). */
  toVector: TrustVector;
  /** The contract governing this relationship's duration. */
  contract: TrustContract;
  /** Label chosen by rig A for this connection (their words, their choice). */
  fromLabel: string | null;
  /** Label chosen by rig B for this connection (their words, their choice). */
  toLabel: string | null;
  /**
   * Visibility of this relationship:
   *   'private' — only the two participants can see it
   *   'mutual'  — visible to rigs in both participants' trust networks
   */
  visibility: 'private' | 'mutual';
}

/**
 * Create a trust relationship between two rigs.
 */
export function createRelationship(
  from: string,
  to: string,
  type: TrustContractType,
  fromTime: number,
  fromDepth: number,
  toTime: number,
  toDepth: number,
  options?: {
    fromLabel?: string;
    toLabel?: string;
    visibility?: 'private' | 'mutual';
    ttlSeconds?: number | null;
    now?: Date;
  },
): TrustRelationship {
  const now = options?.now ?? new Date();
  return {
    from,
    to,
    fromVector: computeVector(fromTime, fromDepth),
    toVector: computeVector(toTime, toDepth),
    contract: createContract(type, options?.ttlSeconds, now),
    fromLabel: options?.fromLabel ?? null,
    toLabel: options?.toLabel ?? null,
    visibility: options?.visibility ?? 'private',
  };
}

/**
 * Compute the harmony between two sides of a relationship.
 *
 * Harmony measures how mutual a trust connection is:
 *   - magnitudeRatio: closer to 1.0 = more equal depth of trust
 *   - angleDelta: closer to 0 = both see the same kind of trust
 *   - harmony: combined score 0–1 (1.0 = perfect mutual trust)
 */
export function computeHarmony(rel: TrustRelationship): {
  magnitudeRatio: number;
  angleDelta: number;
  harmony: number;
} {
  const mA = rel.fromVector.magnitude;
  const mB = rel.toVector.magnitude;

  // Magnitude ratio: smaller / larger (1.0 = equal)
  const maxM = Math.max(mA, mB);
  const magnitudeRatio = maxM === 0 ? 1 : Math.min(mA, mB) / maxM;

  // Angle delta in radians (max π/2 since both are in first quadrant)
  const angleDelta = Math.abs(rel.fromVector.theta - rel.toVector.theta);

  // Harmony: combine magnitude symmetry and angle alignment
  // angleDelta is [0, π/2], normalize to [0, 1] then invert
  const angleAlignment = 1 - (angleDelta / (Math.PI / 2));
  const harmony = magnitudeRatio * angleAlignment;

  return { magnitudeRatio, angleDelta, harmony };
}

/**
 * Filter a list of relationships to only those currently active.
 */
export function getActiveRelationships(
  relationships: TrustRelationship[],
  now: Date = new Date(),
): TrustRelationship[] {
  return relationships.filter(r => isContractActive(r.contract, now));
}

/**
 * Get all active relationships for a specific rig.
 */
export function getRelationshipsForRig(
  handle: string,
  relationships: TrustRelationship[],
  now: Date = new Date(),
): TrustRelationship[] {
  return getActiveRelationships(relationships, now)
    .filter(r => r.from === handle || r.to === handle);
}

/**
 * Compute the aggregate interpersonal trust strength for a rig.
 *
 * This is the average magnitude of all active trust vectors pointing
 * toward this rig. It answers: "how deeply do the people around this
 * rig trust them?"
 *
 * Returns 0 if no active relationships exist.
 */
export function aggregateTrustStrength(
  handle: string,
  relationships: TrustRelationship[],
  now: Date = new Date(),
): number {
  const active = getRelationshipsForRig(handle, relationships, now);
  if (active.length === 0) return 0;

  let totalMagnitude = 0;
  for (const rel of active) {
    // Use the OTHER rig's vector toward this rig
    if (rel.to === handle) {
      totalMagnitude += rel.fromVector.magnitude;
    } else {
      totalMagnitude += rel.toVector.magnitude;
    }
  }

  return totalMagnitude / active.length;
}

// ============================================================================
// Character Sheet (Consent Layer)
// ============================================================================

/**
 * A character sheet is what a rig deliberately chooses to share.
 *
 * This is NOT the computed reputation profile (stamps, badges, stats) —
 * that's the character-sheet-design.md spec. This is the CONSENT layer:
 * what personal information a rig wishes to make visible.
 *
 * Privacy guarantees:
 *   - No real names, emails, phone numbers, social handles
 *   - No PII through metaphor, analogy, hints, or reverse-engineerable patterns
 *   - The rig creates their own sheet, declaring what they wish to share
 *   - Nothing is inferred, auto-populated, or scraped
 *   - A sheet can be as minimal as a playa name and an icon
 *   - Or as rich as the rig chooses
 *   - What the sheet shows is what others see. Nothing more.
 */
export interface CharacterSheet {
  /** The rig's handle (totem-NNN format). */
  handle: string;
  /** Display name — playa name, chosen by the rig. */
  displayName: string;
  /** Optional visual identity (emoji, icon reference, or null). */
  icon: string | null;
  /** Optional self-description. The rig's words about themselves. */
  bio: string | null;
  /** Optional camp affiliation. */
  homeCamp: string | null;
  /**
   * How much of the computed reputation profile (stamps, stats) to show.
   *   'full'    — show everything (stamp profile, badges, activity)
   *   'summary' — show aggregate scores only (dimensions, counts)
   *   'minimal' — show trust level and handle only
   */
  reputationVisibility: 'full' | 'summary' | 'minimal';
  /** Which skill tags to display publicly (empty = show none). */
  visibleSkills: string[];
  /**
   * User-defined fields. The rig decides what to share.
   * Examples: { "pronouns": "they/them", "spirit_animal": "raven" }
   */
  customFields: Record<string, string>;
  /** When this sheet was last updated (ISO 8601). */
  updatedAt: string;
}

/**
 * Create a character sheet with explicit consent fields.
 *
 * Only `handle` and `displayName` are required. Everything else is
 * optional — the rig chooses what to share.
 */
export function createCharacterSheet(
  handle: string,
  displayName: string,
  options?: {
    icon?: string;
    bio?: string;
    homeCamp?: string;
    reputationVisibility?: 'full' | 'summary' | 'minimal';
    visibleSkills?: string[];
    customFields?: Record<string, string>;
    now?: Date;
  },
): CharacterSheet {
  return {
    handle,
    displayName,
    icon: options?.icon ?? null,
    bio: options?.bio ?? null,
    homeCamp: options?.homeCamp ?? null,
    reputationVisibility: options?.reputationVisibility ?? 'summary',
    visibleSkills: options?.visibleSkills ?? [],
    customFields: options?.customFields ?? {},
    updatedAt: (options?.now ?? new Date()).toISOString(),
  };
}

/**
 * Get the public profile from a character sheet.
 *
 * Returns ONLY what the sheet allows. This is the interface boundary
 * between "what the rig knows about themselves" and "what others see."
 */
export function getPublicProfile(sheet: CharacterSheet): {
  handle: string;
  displayName: string;
  icon: string | null;
  bio: string | null;
  homeCamp: string | null;
  reputationVisibility: 'full' | 'summary' | 'minimal';
  visibleSkills: string[];
  customFields: Record<string, string>;
} {
  // The sheet IS the public profile — it only contains what the rig consented to share
  return {
    handle: sheet.handle,
    displayName: sheet.displayName,
    icon: sheet.icon,
    bio: sheet.bio,
    homeCamp: sheet.homeCamp,
    reputationVisibility: sheet.reputationVisibility,
    visibleSkills: [...sheet.visibleSkills],
    customFields: { ...sheet.customFields },
  };
}

// ============================================================================
// Utilities
// ============================================================================

/**
 * Generate a contract ID.
 * Format: tc-{type_prefix}-{timestamp_hex}
 */
function generateContractId(type: TrustContractType, now: Date): string {
  const prefix = type === 'permanent' ? 'pm'
    : type === 'long-term' ? 'lt'
    : type === 'event-scoped' ? 'ev'
    : type === 'project-scoped' ? 'pj'
    : 'ep';
  const ts = now.getTime().toString(16).slice(-8);
  return `tc-${prefix}-${ts}`;
}

/**
 * Format a trust relationship as a human-readable string.
 */
export function formatRelationship(rel: TrustRelationship, now: Date = new Date()): string {
  const active = isContractActive(rel.contract, now);
  const status = active ? 'ACTIVE' : 'EXPIRED';
  const harmony = computeHarmony(rel);

  const lines = [
    `${rel.from} ↔ ${rel.to} — ${rel.contract.type} [${status}]`,
    `  ${rel.from}: ${describeVector(rel.fromVector)}${rel.fromLabel ? ` "${rel.fromLabel}"` : ''}`,
    `  ${rel.to}: ${describeVector(rel.toVector)}${rel.toLabel ? ` "${rel.toLabel}"` : ''}`,
    `  harmony: ${harmony.harmony.toFixed(2)} (magnitude ratio: ${harmony.magnitudeRatio.toFixed(2)})`,
  ];

  if (rel.contract.expiresAt && active) {
    const remaining = contractTimeRemaining(rel.contract, now);
    if (remaining < 3600) {
      lines.push(`  expires in: ${Math.round(remaining / 60)}m`);
    } else if (remaining < 86400) {
      lines.push(`  expires in: ${Math.round(remaining / 3600)}h`);
    } else {
      lines.push(`  expires in: ${Math.round(remaining / 86400)}d`);
    }
  }

  return lines.join('\n');
}
