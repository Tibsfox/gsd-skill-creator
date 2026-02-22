/**
 * Structured audit logger for MCP tool invocations.
 *
 * Captures every tool invocation with caller identity, sanitized parameters,
 * response status, and timing. Automatically redacts sensitive values (API keys,
 * tokens, passwords) from logged parameters.
 */

import { randomUUID } from 'node:crypto';

// ============================================================================
// Types
// ============================================================================

/** Structured audit log entry for a tool invocation. */
export interface AuditEntry {
  /** Unique entry identifier. */
  id: string;
  /** Unix timestamp in milliseconds. */
  timestamp: number;
  /** Identity of the caller (agent ID, gateway session, etc.). */
  caller: string;
  /** Server that owns the tool. */
  serverId: string;
  /** Tool that was invoked. */
  toolName: string;
  /** Sanitized/redacted parameters. */
  params: Record<string, unknown>;
  /** Outcome of the invocation. */
  responseStatus: 'success' | 'error' | 'blocked' | 'timeout';
  /** Duration of the invocation in milliseconds. */
  durationMs: number;
  /** Whether the invocation was blocked by security gates. */
  blocked: boolean;
  /** Reason for blocking, if applicable. */
  blockReason?: string;
  /** Source of the invocation (SECR-13: same pipeline for both). */
  source: 'external' | 'agent-to-agent';
}

/** Configuration for the audit logger. */
export interface AuditLoggerConfig {
  /** Maximum entries to keep in memory (default: 10000). */
  maxEntries?: number;
  /** Additional redaction patterns. */
  redactPatterns?: RegExp[];
  /** Callback for external log sinks. */
  onEntry?: (entry: AuditEntry) => void;
}

// ============================================================================
// Default redaction patterns (SECR-11)
// ============================================================================

const DEFAULT_REDACT_PATTERNS: RegExp[] = [
  // API key patterns
  /(?:api[_-]?key|apikey)['"]?[:\s=]+['"]?([a-zA-Z0-9_-]{20,})/gi,
  // Token/bearer patterns
  /(?:token|bearer|auth)['"]?[:\s=]+['"]?([a-zA-Z0-9_.\-]{20,})/gi,
  // Password/secret patterns
  /(?:password|passwd|secret)['"]?[:\s=]+['"]?([^\s'"}{,]+)/gi,
  // AWS access key IDs
  /(?:AKIA|ASIA)[A-Z0-9]{16}/g,
];

/** Placeholder for redacted values. */
const REDACTED = '[REDACTED]';

// ============================================================================
// AuditLogger
// ============================================================================

/**
 * Audit logger for MCP tool invocations (SECR-10, SECR-11).
 *
 * Logs every invocation with structured entries. Automatically redacts
 * sensitive parameter values using pattern matching.
 */
export class AuditLogger {
  private readonly config: Required<Pick<AuditLoggerConfig, 'maxEntries'>> & AuditLoggerConfig;
  private readonly entries: AuditEntry[] = [];
  private readonly redactPatterns: RegExp[];

  constructor(config?: AuditLoggerConfig) {
    this.config = {
      maxEntries: config?.maxEntries ?? 10000,
      ...config,
    };
    this.redactPatterns = [
      ...DEFAULT_REDACT_PATTERNS,
      ...(config?.redactPatterns ?? []),
    ];
  }

  /**
   * Log a tool invocation.
   *
   * Parameters are automatically redacted. Entry is assigned an ID and timestamp.
   * The onEntry callback (if configured) is invoked after storing.
   */
  log(
    entry: Omit<AuditEntry, 'id' | 'timestamp' | 'params'> & {
      params: Record<string, unknown>;
    },
  ): AuditEntry {
    const fullEntry: AuditEntry = {
      ...entry,
      id: randomUUID(),
      timestamp: Date.now(),
      params: this.redactParams(entry.params),
    };

    this.entries.push(fullEntry);

    // Enforce max entries (drop oldest)
    while (this.entries.length > this.config.maxEntries) {
      this.entries.shift();
    }

    // Invoke external sink callback
    this.config.onEntry?.(fullEntry);

    return fullEntry;
  }

  /**
   * Get audit entries with optional filters.
   */
  getEntries(filter?: {
    serverId?: string;
    toolName?: string;
    source?: string;
  }): AuditEntry[] {
    if (!filter) return [...this.entries];

    return this.entries.filter((e) => {
      if (filter.serverId && e.serverId !== filter.serverId) return false;
      if (filter.toolName && e.toolName !== filter.toolName) return false;
      if (filter.source && e.source !== filter.source) return false;
      return true;
    });
  }

  /**
   * Get the N most recent entries.
   */
  getRecentEntries(count: number): AuditEntry[] {
    return this.entries.slice(-count);
  }

  /**
   * Clear all log entries.
   */
  clear(): void {
    this.entries.length = 0;
  }

  /**
   * Deep-clone and redact sensitive values from parameters (SECR-11).
   */
  redactParams(params: Record<string, unknown>): Record<string, unknown> {
    return this.deepRedact(params) as Record<string, unknown>;
  }

  // ==========================================================================
  // Private helpers
  // ==========================================================================

  /**
   * Recursively walk and redact sensitive string values.
   */
  private deepRedact(value: unknown): unknown {
    if (typeof value === 'string') {
      return this.redactString(value);
    }
    if (Array.isArray(value)) {
      return value.map((item) => this.deepRedact(item));
    }
    if (value !== null && typeof value === 'object') {
      const result: Record<string, unknown> = {};
      for (const [key, val] of Object.entries(value)) {
        // Redact by key name (common sensitive field names)
        if (/^(?:api[_-]?key|apikey|token|bearer|auth|password|passwd|secret|credential)/i.test(key)) {
          result[key] = REDACTED;
        } else {
          result[key] = this.deepRedact(val);
        }
      }
      return result;
    }
    return value;
  }

  /**
   * Redact sensitive patterns from a string value.
   */
  private redactString(value: string): string {
    let result = value;
    for (const pattern of this.redactPatterns) {
      // Reset lastIndex for global patterns
      pattern.lastIndex = 0;
      result = result.replace(pattern, REDACTED);
    }
    return result;
  }
}
