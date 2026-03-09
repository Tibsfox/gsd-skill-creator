/**
 * Trust Registration Engine — w-wl-reg
 *
 * You walk up. You say "I'm here." The system says "Welcome."
 *
 * Registration is self-initiated — no external actor creates a rig on
 * behalf of another. The rig steps forward. This mirrors mycorrhizal
 * colonization: the plant initiates contact, not the fungal network.
 *
 * The flow is atomic: rig row + trust_level=1 + trust_level_changed_at +
 * Welcome Home badge, all or nothing. The character sheet is separable —
 * optional, can happen during or after registration.
 *
 * The Welcome Home badge is Foxy's personal gift. It is NOT a stamp.
 * It carries no quality/reliability/creativity scores, no promotion
 * weight. It is a greeting — the forest saying "you showed up."
 *
 * @module trust-registration
 */

import { sqlEscape } from './sql-escape.js';
import { toUTCString } from './utc.js';

// ============================================================================
// Schema DDL
// ============================================================================

/**
 * SQL DDL for the welcome_badges table.
 *
 * One row per rig, issued at registration. This table is structurally
 * isolated from stamps — no quality, reliability, creativity, or
 * promotion_weight columns exist. The DDL enforces this by design.
 */
export const WELCOME_BADGES_DDL = `
CREATE TABLE IF NOT EXISTS welcome_badges (
  handle      VARCHAR(64) PRIMARY KEY,
  badge_id    VARCHAR(32) NOT NULL DEFAULT 'welcome-home',
  issued_at   DATETIME NOT NULL,
  message     TEXT NOT NULL
);`.trim();

// ============================================================================
// Types
// ============================================================================

/**
 * The Welcome Home badge. Issued the moment you register.
 *
 * This is NOT a stamp. It has no quality/reliability/creativity fields,
 * no promotion weight, and no validator. It is a greeting — the system
 * saying "you showed up." Structurally enforced: no stamp fields exist
 * on this type. The badge is Foxy's gift to every rig that enters the
 * forest. Like the gate greeters at a real burn saying "Welcome Home."
 */
export interface WelcomeHomeBadge {
  /** The rig this badge was issued to. */
  handle: string;
  /** Fixed identifier. Always 'welcome-home'. */
  badgeId: 'welcome-home';
  /** Display icon. Always '[H]'. */
  icon: '[H]';
  /** The message. Always "You showed up. That's enough." */
  message: string;
  /** When the badge was issued (ISO 8601 UTC). */
  issuedAt: string;
}

/** Input required to register a rig. Self-provided, no external actor. */
export interface RegistrationInput {
  /** Chosen totem for handle generation (e.g., 'fox', 'cedar', 'raven'). Lowercase alpha only. */
  totem: string;
  /** Optional display name. If omitted, defaults to totem. */
  displayName?: string;
  /** Arrival timestamp override for testing. Defaults to now. */
  now?: Date;
}

/** Result of a successful registration. */
export interface RegistrationResult {
  /** The generated handle in totem-NNN format. */
  handle: string;
  /** The internal UUID for federation deduplication. */
  uuid: string;
  /** Trust level — always 1 on registration. */
  trustLevel: 1;
  /** When registration occurred (ISO 8601 UTC). */
  registeredAt: string;
  /** The Welcome Home badge — Foxy's gift. */
  badge: WelcomeHomeBadge;
}

/** Data provider interface for registration operations. */
export interface RegistrationDataProvider {
  /** Check if a handle is already taken. */
  handleExists(handle: string): Promise<boolean>;
  /** Get the highest existing NNN suffix for a given totem prefix. */
  getMaxSuffix(totem: string): Promise<number>;
  /** Atomically insert rig row + welcome badge. All or nothing. */
  registerRig(result: RegistrationResult): Promise<void>;
}

// ============================================================================
// Validation
// ============================================================================

/** Totem must be lowercase alpha only — the base of the handle. */
const TOTEM_PATTERN = /^[a-z]+$/;

/** Phone pattern — catches common US formats like 555-867-5309. */
const PHONE_PATTERN = /\b\d{3}[-.\s]?\d{3}[-.\s]?\d{4}\b/;

/**
 * Validate a display name for PII compliance.
 *
 * No PII guarantee — a determined user can always use a playa name
 * that looks like a real name. This catches accidental disclosure:
 * emails, URLs, phone numbers. The privacy pre-push hook (Stage 3b)
 * is the authoritative barrier. This is the first line of defense.
 */
export function validateDisplayName(
  name: string,
): { valid: true } | { valid: false; reason: string } {
  const trimmed = name.trim();
  if (trimmed.length === 0) {
    return { valid: false, reason: 'A name is the one thing needed. What do you want to be called?' };
  }
  if (trimmed.length > 128) {
    return { valid: false, reason: "That name's a bit long — maybe trim it a bit?" };
  }
  if (trimmed.includes('@')) {
    return { valid: false, reason: 'That looks like an email or social handle. Playa names only here.' };
  }
  if (/https?:\/\//.test(trimmed) || /www\./i.test(trimmed)) {
    return { valid: false, reason: 'No URLs in names — this is a forest, not a browser.' };
  }
  if (PHONE_PATTERN.test(trimmed)) {
    return { valid: false, reason: 'That looks like a phone number. Keep it playa.' };
  }
  return { valid: true };
}

// ============================================================================
// Handle Generation
// ============================================================================

/**
 * Generate a rig handle in totem-NNN format with an internal UUID.
 *
 * The totem is the participant's chosen word — an animal, a tree, a
 * spirit. The NNN suffix is zero-padded, derived from the next available
 * number for that totem. The UUID is stored internally for federation
 * deduplication but never shown to the participant.
 */
export function generateRigHandle(
  totem: string,
  suffix: number,
): { handle: string; uuid: string } {
  if (!totem || !TOTEM_PATTERN.test(totem)) {
    throw new Error(`Totem must be lowercase letters only, got: "${totem}"`);
  }
  if (suffix < 1 || suffix > 999) {
    throw new Error(`Suffix must be 1-999, got: ${suffix}`);
  }

  const paddedSuffix = String(suffix).padStart(3, '0');
  const uuid = typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `${Math.random().toString(36).slice(2)}${Math.random().toString(36).slice(2)}`.slice(0, 32);

  return {
    handle: `${totem}-${paddedSuffix}`,
    uuid,
  };
}

// ============================================================================
// Welcome Home Badge
// ============================================================================

/**
 * Issue the Welcome Home badge.
 *
 * Called once per rig, at registration. The badge is immutable — it records
 * that the rig arrived and nothing more. The bell rings so the community
 * knows someone came. They do not know who.
 */
export function issueWelcomeHomeBadge(
  handle: string,
  now: Date = new Date(),
): WelcomeHomeBadge {
  return {
    handle,
    badgeId: 'welcome-home',
    icon: '[H]',
    message: "You showed up. That's enough.",
    issuedAt: toUTCString(now),
  };
}

// ============================================================================
// Registration Flow
// ============================================================================

/**
 * Execute the full registration flow.
 *
 * Registration is self-initiated. No external actor creates a rig on
 * behalf of another. The rig steps forward.
 *
 * Steps (atomic):
 *   1. Validate totem and display name
 *   2. Find next available suffix for this totem
 *   3. Generate handle + UUID
 *   4. Issue Welcome Home badge
 *   5. Write rig row + badge via provider (all or nothing)
 *   6. Return RegistrationResult
 */
export async function register(
  input: RegistrationInput,
  provider: RegistrationDataProvider,
): Promise<RegistrationResult> {
  // Validate totem
  if (!input.totem || !TOTEM_PATTERN.test(input.totem)) {
    throw new Error(`Totem must be lowercase letters only, got: "${input.totem}"`);
  }

  // Validate display name if provided
  if (input.displayName !== undefined) {
    const nameCheck = validateDisplayName(input.displayName);
    if (!nameCheck.valid) {
      throw new Error(nameCheck.reason);
    }
  }

  const now = input.now ?? new Date();
  const registeredAt = toUTCString(now);

  // Find next available suffix
  const maxSuffix = await provider.getMaxSuffix(input.totem);
  const nextSuffix = maxSuffix + 1;

  if (nextSuffix > 999) {
    throw new Error(`Totem "${input.totem}" is full — all 999 handles are taken. Try a different totem.`);
  }

  // Generate handle + UUID
  const { handle, uuid } = generateRigHandle(input.totem, nextSuffix);

  // Issue the Welcome Home badge — Foxy's gift
  const badge = issueWelcomeHomeBadge(handle, now);

  const result: RegistrationResult = {
    handle,
    uuid,
    trustLevel: 1,
    registeredAt,
    badge,
  };

  // Atomic write — rig row + badge, all or nothing
  await provider.registerRig(result);

  return result;
}

// ============================================================================
// SQL Generation
// ============================================================================

/**
 * Generate SQL statements for a registration.
 *
 * Produces two INSERTs: one for the rigs table, one for welcome_badges.
 * trust_level_changed_at is set to the same value as registered_at on
 * initial registration — the clock starts at arrival.
 */
export function generateRegistrationSQL(result: RegistrationResult): string {
  const h = sqlEscape(result.handle);
  const u = sqlEscape(result.uuid);
  const t = sqlEscape(result.registeredAt);
  const m = sqlEscape(result.badge.message);
  const bt = sqlEscape(result.badge.issuedAt);

  return [
    `-- Arrival: ${result.handle}`,
    `INSERT INTO rigs (handle, rig_uuid, trust_level, rig_type, registered_at, trust_level_changed_at)`,
    `VALUES ('${h}', '${u}', 1, 'participant', '${t}', '${t}');`,
    '',
    `INSERT INTO welcome_badges (handle, badge_id, issued_at, message)`,
    `VALUES ('${h}', 'welcome-home', '${bt}', '${m}');`,
  ].join('\n');
}

/**
 * Format an arrival announcement for the community feed.
 *
 * The bell rings — the community knows someone arrived, without knowing who.
 * The arrival is public; the identity is not.
 */
export function announceArrival(): string {
  return '~ someone arrived';
}
