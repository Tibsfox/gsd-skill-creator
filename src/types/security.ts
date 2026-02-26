/**
 * Security type schemas for the GSD-OS SSH Agent Security system (v1.38).
 *
 * Defines Zod schemas with runtime validation for all security domain types.
 * Every downstream phase (368-374) imports these types to ensure consistent
 * data shapes across TypeScript frontend/CLI and Rust backend (via JSON).
 *
 * Rust equivalent: src-tauri/src/security/types.rs
 *
 * @module types/security
 */

import { z } from 'zod';

// ============================================================================
// DomainCredential
// ============================================================================

/**
 * A credential binding for a specific network domain.
 *
 * Maps a domain to a credential source and injection method. The proxy uses
 * this to inject authentication headers into outbound requests without
 * exposing credential material inside the agent sandbox.
 *
 * - `credential_type` determines HOW the credential is injected
 * - `credential_source` determines WHERE the credential is stored
 * - `header_name` is only needed for api_key_header type
 */
export const DomainCredentialSchema = z.object({
  /** Target domain (e.g., "api.anthropic.com", "github.com") */
  domain: z.string(),

  /** How the credential is injected into outbound requests */
  credential_type: z.enum(['api_key_header', 'ssh_agent', 'bearer_token', 'basic_auth']),

  /** Where the credential material is stored */
  credential_source: z.enum(['keychain', 'env', 'file']),

  /** HTTP header name for api_key_header type (e.g., "x-api-key") */
  header_name: z.string().optional(),
});

/** Inferred TypeScript type for DomainCredential. */
export type DomainCredential = z.infer<typeof DomainCredentialSchema>;

// ============================================================================
// SecurityEvent
// ============================================================================

/**
 * A security event emitted by any security subsystem.
 *
 * Events are logged to `.planning/security/events.jsonl` and streamed to
 * the security dashboard panel. Critical events bypass the magic filter
 * to ensure the shield indicator always reflects real security state.
 *
 * - `severity` controls dashboard presentation and alerting behavior
 * - `source` identifies which subsystem generated the event
 * - `detail` is a flexible record for subsystem-specific data
 */
export const SecurityEventSchema = z.object({
  /** Unique event identifier */
  id: z.string(),

  /** ISO 8601 timestamp of when the event occurred */
  timestamp: z.string().datetime(),

  /** Event severity level */
  severity: z.enum(['info', 'warning', 'critical', 'blocked']),

  /** Subsystem that generated this event */
  source: z.enum(['sandbox', 'proxy', 'staging', 'agent-isolation']),

  /** Machine-readable event type (e.g., "filesystem_deny", "domain_blocked") */
  event_type: z.string(),

  /** Subsystem-specific event data */
  detail: z.record(z.string(), z.unknown()),
});

/** Inferred TypeScript type for SecurityEvent. */
export type SecurityEvent = z.infer<typeof SecurityEventSchema>;

// ============================================================================
// SandboxProfile
// ============================================================================

/**
 * OS-level sandbox configuration for a single agent process.
 *
 * Each agent type (exec, verify, scout, main) gets a profile that
 * restricts filesystem access and network connectivity. The sandbox
 * configurator (Phase 368) generates these profiles and the bootstrap
 * script (Phase 373) applies them before any agent process starts.
 *
 * - `filesystem.write_dirs` are the ONLY directories the agent can write to
 * - `filesystem.deny_read` are directories the agent CANNOT read (e.g., ~/.ssh/)
 * - `network.allowed_domains` restricts which domains the agent can reach
 * - `worktree_path` is set when the agent operates in an isolated git worktree
 */
export const SandboxProfileSchema = z.object({
  /** Agent identifier this profile belongs to */
  agent_id: z.string(),

  /** Agent type determines the base restriction template */
  agent_type: z.enum(['exec', 'verify', 'scout', 'main']),

  /** Filesystem access restrictions */
  filesystem: z.object({
    /** Directories the agent is allowed to write to */
    write_dirs: z.array(z.string()),

    /** Directories the agent is denied read access to */
    deny_read: z.array(z.string()),
  }),

  /** Network access restrictions */
  network: z.object({
    /** Domains the agent is allowed to reach (with credential bindings) */
    allowed_domains: z.array(DomainCredentialSchema),

    /** Path to the credential proxy Unix socket */
    proxy_socket: z.string(),
  }),

  /** Path to the agent's isolated git worktree (if applicable) */
  worktree_path: z.string().optional(),
});

/** Inferred TypeScript type for SandboxProfile. */
export type SandboxProfile = z.infer<typeof SandboxProfileSchema>;

// ============================================================================
// ProxyConfig
// ============================================================================

/**
 * Configuration for the credential proxy server.
 *
 * The proxy runs OUTSIDE the sandbox and listens on a Unix domain socket.
 * Agents inside the sandbox connect through this socket to make authenticated
 * requests without ever seeing credential material.
 *
 * SECURITY INVARIANT: `log_credentials` is always false. This is enforced
 * at the type level (z.literal(false)) to prevent credential leakage into
 * log files. No configuration change can enable credential logging.
 */
export const ProxyConfigSchema = z.object({
  /** Path to the Unix domain socket (mode 0600) */
  socket_path: z.string(),

  /** Domains the proxy will forward requests to */
  allowed_domains: z.array(DomainCredentialSchema),

  /** Whether to log request metadata (URL, status, timing) */
  log_requests: z.boolean(),

  /**
   * Whether to log credential values. ALWAYS false.
   * Type-enforced: z.literal(false) rejects any value except false.
   */
  log_credentials: z.literal(false),
});

/** Inferred TypeScript type for ProxyConfig. */
export type ProxyConfig = z.infer<typeof ProxyConfigSchema>;

// ============================================================================
// AgentIsolationState
// ============================================================================

/**
 * Runtime state of an isolated agent process.
 *
 * Tracks the agent's identity, worktree location, sandbox configuration,
 * and lifecycle status. The isolation manager (Phase 371) creates and
 * manages these states, and the dashboard (Phase 372) displays them.
 *
 * - `sandbox_profile` is the full SandboxProfile applied to this agent
 * - `status` tracks lifecycle: "creating", "active", "stopping", "stopped"
 * - `created_at` is set when the agent worktree and sandbox are initialized
 */
export const AgentIsolationStateSchema = z.object({
  /** Agent identifier */
  agent_id: z.string(),

  /** Agent type */
  agent_type: z.enum(['exec', 'verify', 'scout', 'main']),

  /** Path to the agent's isolated git worktree */
  worktree_path: z.string(),

  /** Full sandbox profile applied to this agent */
  sandbox_profile: SandboxProfileSchema,

  /** Agent lifecycle status */
  status: z.string(),

  /** ISO 8601 timestamp of when the agent was created */
  created_at: z.string().datetime(),
});

/** Inferred TypeScript type for AgentIsolationState. */
export type AgentIsolationState = z.infer<typeof AgentIsolationStateSchema>;
