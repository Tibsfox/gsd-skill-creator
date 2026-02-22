/**
 * Sliding window rate limiter for MCP tool invocations.
 *
 * Enforces per-server and per-tool call limits using array-based sliding windows.
 * No external dependencies -- pure TypeScript implementation.
 */

// ============================================================================
// Types
// ============================================================================

/** Configuration for the rate limiter. */
export interface RateLimiterConfig {
  /** Maximum calls per window per server (default: 100). */
  maxPerServer: number;
  /** Maximum calls per window per tool (default: 30). */
  maxPerTool: number;
  /** Sliding window duration in ms (default: 60000 = 1 minute). */
  windowMs: number;
}

/** Result of a rate limit check. */
export interface RateLimitResult {
  /** Whether the call is allowed. */
  allowed: boolean;
  /** Remaining calls in the current window. */
  remaining: number;
  /** Milliseconds until the next call would be allowed (undefined if allowed). */
  retryAfterMs: number | undefined;
  /** Which rule was triggered (undefined if allowed). */
  rule: 'server-limit' | 'tool-limit' | undefined;
}

// ============================================================================
// Constants
// ============================================================================

const DEFAULT_CONFIG: RateLimiterConfig = {
  maxPerServer: 100,
  maxPerTool: 30,
  windowMs: 60000,
};

// ============================================================================
// RateLimiter
// ============================================================================

/**
 * Per-server and per-tool sliding window rate limiter (SECR-09).
 *
 * Tracks call timestamps in arrays, pruning expired entries on each check.
 */
export class RateLimiter {
  private readonly config: RateLimiterConfig;
  private readonly timestamps: Map<string, number[]> = new Map();

  constructor(config?: Partial<RateLimiterConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Check if a call is within rate limits and record it if allowed.
   *
   * Checks both server-level and tool-level limits. If either is exceeded,
   * returns allowed: false with the triggering rule.
   */
  checkLimit(serverId: string, toolName: string): RateLimitResult {
    const now = Date.now();
    const serverKey = `server:${serverId}`;
    const toolKey = `tool:${serverId}:${toolName}`;

    // Prune expired timestamps
    this.prune(serverKey, now);
    this.prune(toolKey, now);

    // Check server-level limit
    const serverTimestamps = this.timestamps.get(serverKey) ?? [];
    if (serverTimestamps.length >= this.config.maxPerServer) {
      const oldestValid = serverTimestamps[0];
      const retryAfterMs = oldestValid + this.config.windowMs - now;
      return {
        allowed: false,
        remaining: 0,
        retryAfterMs: Math.max(0, retryAfterMs),
        rule: 'server-limit',
      };
    }

    // Check tool-level limit
    const toolTimestamps = this.timestamps.get(toolKey) ?? [];
    if (toolTimestamps.length >= this.config.maxPerTool) {
      const oldestValid = toolTimestamps[0];
      const retryAfterMs = oldestValid + this.config.windowMs - now;
      return {
        allowed: false,
        remaining: 0,
        retryAfterMs: Math.max(0, retryAfterMs),
        rule: 'tool-limit',
      };
    }

    // Both limits pass -- record the call
    this.recordTimestamp(serverKey, now);
    this.recordTimestamp(toolKey, now);

    // Calculate remaining as the minimum of server and tool remaining
    const serverRemaining = this.config.maxPerServer - serverTimestamps.length - 1;
    const toolRemaining = this.config.maxPerTool - toolTimestamps.length - 1;

    return {
      allowed: true,
      remaining: Math.min(serverRemaining, toolRemaining),
      retryAfterMs: undefined,
      rule: undefined,
    };
  }

  /**
   * Record a call for a server and tool (without checking limits).
   */
  recordCall(serverId: string, toolName: string): void {
    const now = Date.now();
    this.recordTimestamp(`server:${serverId}`, now);
    this.recordTimestamp(`tool:${serverId}:${toolName}`, now);
  }

  /**
   * Get remaining quota for a server and tool.
   */
  getRemainingQuota(serverId: string, toolName: string): { server: number; tool: number } {
    const now = Date.now();
    const serverKey = `server:${serverId}`;
    const toolKey = `tool:${serverId}:${toolName}`;

    this.prune(serverKey, now);
    this.prune(toolKey, now);

    const serverCount = (this.timestamps.get(serverKey) ?? []).length;
    const toolCount = (this.timestamps.get(toolKey) ?? []).length;

    return {
      server: Math.max(0, this.config.maxPerServer - serverCount),
      tool: Math.max(0, this.config.maxPerTool - toolCount),
    };
  }

  /**
   * Clear rate limits. Optionally for a specific server only.
   */
  reset(serverId?: string): void {
    if (!serverId) {
      this.timestamps.clear();
      return;
    }

    // Clear entries matching this server
    const prefix1 = `server:${serverId}`;
    const prefix2 = `tool:${serverId}:`;
    for (const key of this.timestamps.keys()) {
      if (key === prefix1 || key.startsWith(prefix2)) {
        this.timestamps.delete(key);
      }
    }
  }

  // ==========================================================================
  // Private helpers
  // ==========================================================================

  /** Remove timestamps outside the sliding window. */
  private prune(key: string, now: number): void {
    const timestamps = this.timestamps.get(key);
    if (!timestamps) return;

    const cutoff = now - this.config.windowMs;
    const firstValid = timestamps.findIndex((t) => t > cutoff);

    if (firstValid === -1) {
      // All expired
      this.timestamps.delete(key);
    } else if (firstValid > 0) {
      timestamps.splice(0, firstValid);
    }
  }

  /** Record a timestamp for a key. */
  private recordTimestamp(key: string, now: number): void {
    const timestamps = this.timestamps.get(key);
    if (timestamps) {
      timestamps.push(now);
    } else {
      this.timestamps.set(key, [now]);
    }
  }
}
