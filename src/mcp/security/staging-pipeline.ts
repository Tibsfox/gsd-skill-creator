/**
 * Unified staging pipeline composing all MCP security gates.
 *
 * This is the ONLY entry point for tool invocations -- no bypass path exists (SECR-12).
 * Agent-to-agent calls pass through the same pipeline as external calls (SECR-13).
 * Per-server promise queues ensure thread safety under concurrent validation (SECR-14).
 *
 * Pipeline stages (in order, short-circuiting on failure):
 * 1. Trust check -- quarantined servers require human approval
 * 2. Rate limit check -- per-server and per-tool throttling
 * 3. Parameter validation -- prompt injection and path traversal detection
 * 4. Activity recording -- update trust manager timestamps
 * 5. Audit logging -- structured entry with redacted parameters
 */

import type {
  SecurityGate,
  Tool,
  TrustState,
  HashRecord,
  ValidationResult,
} from '../../core/types/mcp.js';
import { computeToolHash, detectHashDriftWithTools, type HashDriftResult } from './hash-gate.js';
import { TrustManager, type TrustManagerConfig, type TrustTransition } from './trust-manager.js';
import { validateInvocationParams, type InvocationValidatorConfig } from './invocation-validator.js';
import { RateLimiter, type RateLimiterConfig, type RateLimitResult } from './rate-limiter.js';
import { AuditLogger, type AuditLoggerConfig, type AuditEntry } from './audit-logger.js';

// ============================================================================
// Types
// ============================================================================

/** Configuration for the staging pipeline. */
export interface StagingPipelineConfig {
  trustManager?: Partial<TrustManagerConfig>;
  rateLimiter?: Partial<RateLimiterConfig>;
  validator?: InvocationValidatorConfig;
  auditLogger?: AuditLoggerConfig;
}

/** Result of running a tool invocation through the staging pipeline. */
export interface StagingResult {
  /** Whether the invocation is allowed to proceed. */
  allowed: boolean;
  /** Reason for blocking, if applicable. */
  reason?: string;
  /** Current trust state of the server. */
  trustState: TrustState;
  /** Parameter validation results (may contain warnings even when allowed). */
  validationResults: ValidationResult[];
  /** Rate limit check result. */
  rateLimitResult: RateLimitResult;
  /** Audit log entry ID for this invocation. */
  auditEntryId: string;
  /** Total time spent in the staging pipeline in milliseconds. */
  durationMs: number;
}

/** Request structure for tool invocation validation. */
export interface StagingRequest {
  /** Identity of the caller. */
  caller: string;
  /** Server that owns the tool. */
  serverId: string;
  /** Tool to invoke. */
  toolName: string;
  /** Tool parameters. */
  params: Record<string, unknown>;
  /** Source of the invocation (SECR-13). */
  source: 'external' | 'agent-to-agent';
}

// ============================================================================
// StagingPipeline
// ============================================================================

/**
 * Unified staging pipeline implementing the SecurityGate interface.
 *
 * Composes hash gate, trust manager, invocation validator, rate limiter,
 * and audit logger into a single unbypassable entry point.
 *
 * All sub-components are PRIVATE -- no external access, no bypass path (SECR-12).
 */
export class StagingPipeline implements SecurityGate {
  // All sub-components are private -- no bypass (SECR-12)
  private readonly trustManager: TrustManager;
  private readonly rateLimiter: RateLimiter;
  private readonly auditLogger: AuditLogger;
  private readonly validatorConfig: InvocationValidatorConfig | undefined;

  // Per-server promise queue for thread safety (SECR-14)
  private readonly serverLocks: Map<string, Promise<void>> = new Map();

  constructor(config?: StagingPipelineConfig) {
    this.trustManager = new TrustManager(config?.trustManager);
    this.rateLimiter = new RateLimiter(config?.rateLimiter);
    this.auditLogger = new AuditLogger(config?.auditLogger);
    this.validatorConfig = config?.validator;
  }

  // ==========================================================================
  // Server lifecycle
  // ==========================================================================

  /**
   * Register a new server with its tool definitions.
   * Server enters quarantine and hash is computed.
   */
  async registerServer(
    serverId: string,
    tools: Tool[],
  ): Promise<{ trustState: TrustState; hashRecord: HashRecord }> {
    return this.withLock(serverId, async () => {
      this.trustManager.registerServer(serverId);
      const hashRecord = computeToolHash(serverId, tools);
      this.trustManager.storeTools(serverId, tools);

      // Store the hash via onHashChange with a non-drifted result
      const drift: HashDriftResult = {
        drifted: false,
        current: hashRecord,
        previous: undefined,
        addedTools: [],
        removedTools: [],
        modifiedTools: [],
      };
      this.trustManager.onHashChange(serverId, drift);

      return {
        trustState: this.trustManager.getTrustState(serverId),
        hashRecord,
      };
    });
  }

  /**
   * Handle server reconnection -- detect hash drift and update trust if needed.
   */
  async onReconnect(
    serverId: string,
    tools: Tool[],
  ): Promise<{ drifted: boolean; trustState: TrustState }> {
    return this.withLock(serverId, async () => {
      const previousRecord = this.trustManager.getLastHashRecord(serverId);
      const previousTools = this.trustManager.getLastTools(serverId);
      const drift = detectHashDriftWithTools(serverId, tools, previousRecord, previousTools);

      this.trustManager.onHashChange(serverId, drift);
      this.trustManager.storeTools(serverId, tools);

      return {
        drifted: drift.drifted,
        trustState: this.trustManager.getTrustState(serverId),
      };
    });
  }

  // ==========================================================================
  // Tool invocation validation (SECR-12, SECR-13)
  // ==========================================================================

  /**
   * Validate a tool invocation through ALL security gates.
   *
   * This is the primary entry point. The pipeline runs these stages in order,
   * short-circuiting on failure:
   * 1. Trust check
   * 2. Rate limit check
   * 3. Parameter validation
   * 4. Activity recording
   * 5. Audit logging
   *
   * Agent-to-agent calls (source: 'agent-to-agent') pass through the same
   * pipeline as external calls (SECR-13).
   */
  async validateAndExecute(request: StagingRequest): Promise<StagingResult> {
    return this.withLock(request.serverId, async () => {
      const startTime = Date.now();

      // Stage 1: Trust check -- quarantined servers require human approval
      const trustState = this.trustManager.getTrustState(request.serverId);
      if (trustState === 'quarantine') {
        const auditEntry = this.auditLogger.log({
          caller: request.caller,
          serverId: request.serverId,
          toolName: request.toolName,
          params: request.params,
          responseStatus: 'blocked',
          durationMs: Date.now() - startTime,
          blocked: true,
          blockReason: 'Server in quarantine -- requires human approval',
          source: request.source,
        });

        return {
          allowed: false,
          reason: 'Server in quarantine -- requires human approval',
          trustState,
          validationResults: [],
          rateLimitResult: { allowed: true, remaining: 0, retryAfterMs: undefined, rule: undefined },
          auditEntryId: auditEntry.id,
          durationMs: Date.now() - startTime,
        };
      }

      // Check for suspended state
      if (trustState === 'suspended') {
        const auditEntry = this.auditLogger.log({
          caller: request.caller,
          serverId: request.serverId,
          toolName: request.toolName,
          params: request.params,
          responseStatus: 'blocked',
          durationMs: Date.now() - startTime,
          blocked: true,
          blockReason: 'Server is suspended',
          source: request.source,
        });

        return {
          allowed: false,
          reason: 'Server is suspended',
          trustState,
          validationResults: [],
          rateLimitResult: { allowed: true, remaining: 0, retryAfterMs: undefined, rule: undefined },
          auditEntryId: auditEntry.id,
          durationMs: Date.now() - startTime,
        };
      }

      // Stage 2: Rate limit check
      const rateLimitResult = this.rateLimiter.checkLimit(request.serverId, request.toolName);
      if (!rateLimitResult.allowed) {
        const auditEntry = this.auditLogger.log({
          caller: request.caller,
          serverId: request.serverId,
          toolName: request.toolName,
          params: request.params,
          responseStatus: 'blocked',
          durationMs: Date.now() - startTime,
          blocked: true,
          blockReason: `Rate limited: ${rateLimitResult.rule}`,
          source: request.source,
        });

        return {
          allowed: false,
          reason: `Rate limited: ${rateLimitResult.rule}`,
          trustState,
          validationResults: [],
          rateLimitResult,
          auditEntryId: auditEntry.id,
          durationMs: Date.now() - startTime,
        };
      }

      // Stage 3: Parameter validation
      const validationResults = validateInvocationParams(
        request.toolName,
        request.params,
        this.validatorConfig,
      );
      const blockedResults = validationResults.filter((r) => r.blocked);
      if (blockedResults.length > 0) {
        const reasons = blockedResults.map((r) => r.reason).filter(Boolean).join('; ');
        const auditEntry = this.auditLogger.log({
          caller: request.caller,
          serverId: request.serverId,
          toolName: request.toolName,
          params: request.params,
          responseStatus: 'blocked',
          durationMs: Date.now() - startTime,
          blocked: true,
          blockReason: reasons,
          source: request.source,
        });

        return {
          allowed: false,
          reason: reasons,
          trustState,
          validationResults,
          rateLimitResult,
          auditEntryId: auditEntry.id,
          durationMs: Date.now() - startTime,
        };
      }

      // Stage 4: Record activity
      this.trustManager.recordActivity(request.serverId);

      // Stage 5: Audit log (allowed invocation)
      const auditEntry = this.auditLogger.log({
        caller: request.caller,
        serverId: request.serverId,
        toolName: request.toolName,
        params: request.params,
        responseStatus: 'success',
        durationMs: Date.now() - startTime,
        blocked: false,
        source: request.source,
      });

      return {
        allowed: true,
        trustState,
        validationResults,
        rateLimitResult,
        auditEntryId: auditEntry.id,
        durationMs: Date.now() - startTime,
      };
    });
  }

  // ==========================================================================
  // SecurityGate interface implementation
  // ==========================================================================

  /** Compute a content hash of tool definitions. */
  async computeHash(tools: Tool[]): Promise<HashRecord> {
    return computeToolHash('_interface', tools);
  }

  /** Validate a tool invocation against security rules. */
  async validateInvocation(
    serverId: string,
    toolName: string,
    params: Record<string, unknown>,
  ): Promise<ValidationResult> {
    const results = validateInvocationParams(toolName, params, this.validatorConfig);
    const blocked = results.find((r) => r.blocked);
    if (blocked) return blocked;

    return {
      valid: true,
      blocked: false,
      severity: 'info',
    };
  }

  /** Get the current trust state of a server. */
  async getTrustState(serverId: string): Promise<TrustState> {
    return this.trustManager.getTrustState(serverId);
  }

  /** Update the trust state of a server. */
  async setTrustState(serverId: string, state: TrustState, reason: string): Promise<void> {
    this.trustManager.setTrustState(serverId, state, reason);
  }

  // ==========================================================================
  // Delegation methods
  // ==========================================================================

  /** Get audit log entries with optional filters. */
  getAuditLog(filter?: { serverId?: string; toolName?: string }): AuditEntry[] {
    return this.auditLogger.getEntries(filter);
  }

  /** Check if a server's trust has decayed. */
  checkDecay(serverId: string): TrustTransition | null {
    return this.trustManager.checkDecay(serverId);
  }

  // ==========================================================================
  // Thread safety (SECR-14)
  // ==========================================================================

  /**
   * Execute an operation with per-server serialization.
   *
   * Concurrent calls to the same server are queued. Different servers can
   * run concurrently. This prevents race conditions in trust state and
   * rate limit updates.
   */
  private async withLock<T>(serverId: string, fn: () => Promise<T>): Promise<T> {
    // Get or create the promise chain for this server
    const existingLock = this.serverLocks.get(serverId) ?? Promise.resolve();

    // Chain our operation onto the existing lock
    let resolve!: () => void;
    const newLock = new Promise<void>((r) => {
      resolve = r;
    });
    this.serverLocks.set(serverId, newLock);

    // Wait for previous operation to complete, then run ours
    await existingLock;
    try {
      return await fn();
    } finally {
      resolve();
    }
  }
}
