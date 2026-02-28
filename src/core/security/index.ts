/**
 * Security module barrel export.
 * Single import point for all security types, components, and IPC utilities.
 *
 * Consolidates security types (Phase 367-01), dashboard components (Phase 372),
 * and IPC constants for Tauri command/event wiring (Phase 374-01).
 *
 * @module security
 */

// ============================================================================
// Types from Phase 367-01 (src/types/security.ts)
// ============================================================================

/** Zod-validated security domain types. */
export type {
  DomainCredential,
  SecurityEvent as SecurityEventType,
  SandboxProfile as SandboxProfileType,
  ProxyConfig,
  AgentIsolationState,
} from '../types/security.js';

/** Zod schemas for runtime validation of IPC event payloads. */
export {
  DomainCredentialSchema,
  SecurityEventSchema,
  SandboxProfileSchema,
  ProxyConfigSchema,
  AgentIsolationStateSchema,
} from '../types/security.js';

// ============================================================================
// Dashboard components from Phase 372 (src/components/SecurityPanel.ts)
// ============================================================================

/** Shield and security panel types. */
export type {
  ShieldStatus,
  SecurityEvent,
  ShieldState,
  SecurityTimeline,
  BlockedRequest,
  AgentIsolationStatus,
  ProxyHealth,
  ProxyLogEntry,
  QuarantineItem,
  SecurityDetailOpts,
} from '../../components/SecurityPanel.js';

/** Shield indicator and security detail render functions. */
export {
  shouldBypassMagicFilter,
  getShieldPulseClass,
  renderShieldIndicator,
  renderSecurityDetail,
  renderBlockedRequestLog,
  renderAgentIsolationStatus,
  renderProxyHealth,
} from '../../components/SecurityPanel.js';

/**
 * IPC events from SecurityPanel (Phase 372 event names).
 * Re-exported for convenience -- consumers can use either import path.
 */
export { SECURITY_IPC_EVENTS as PANEL_IPC_EVENTS } from '../../components/SecurityPanel.js';

// ============================================================================
// IPC event constants (Tauri backend -> frontend)
// ============================================================================

/**
 * IPC event names emitted by the Tauri backend security commands.
 * Use these constants when calling `listen()` from the desktop frontend.
 *
 * These are the BACKEND-emitted events from commands/security.rs.
 * For PANEL-consumed events, see PANEL_IPC_EVENTS above.
 */
export const SECURITY_IPC_EVENTS = {
  /** Shield state update (emitted on sandbox verify, breach, etc.) */
  SHIELD_UPDATE: 'security:shield-update',
  /** Critical security event that bypasses magic filter (always shown) */
  BREACH_BLOCKED: 'security:breach-blocked',
  /** Agent created (isolation started) */
  AGENT_CREATED: 'security:agent-created',
  /** Agent destroyed (isolation ended) */
  AGENT_DESTROYED: 'security:agent-destroyed',
} as const;

// ============================================================================
// Tauri command constants (frontend -> backend)
// ============================================================================

/**
 * Tauri command names for security operations.
 * Use these constants with `invoke()` from the desktop frontend.
 */
export const SECURITY_COMMANDS = {
  /** Get aggregate security status snapshot */
  GET_STATUS: 'security_get_status',
  /** Release a quarantined finding (user-only) */
  RELEASE_QUARANTINE: 'security_release_quarantine',
  /** Run full sandbox verification */
  SANDBOX_VERIFY: 'sandbox_verify_full',
  /** Get credential proxy health */
  PROXY_HEALTH: 'proxy_health',
  /** Create an isolated agent */
  AGENT_CREATE: 'agent_create',
  /** Destroy an isolated agent */
  AGENT_DESTROY: 'agent_destroy',
  /** Verify two agents are isolated from each other */
  AGENT_VERIFY_ISOLATION: 'agent_verify_isolation',
} as const;
