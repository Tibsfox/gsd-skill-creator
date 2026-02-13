/**
 * PopStackAwareness -- session-aware pop operations for the chipset integration layer.
 *
 * Provides pre/post hooks around pop-stack operations to enforce session awareness:
 * 1. Pause respect: refuse to pop when session is paused/stopped/saved
 * 2. Heartbeat touch: update heartbeat mtime on every check (proves liveness)
 * 3. Recording marker: append marker to stream.jsonl after successful pop
 *
 * Reads filesystem state (meta.json, heartbeat, recording stream) under
 * the configured stackDir to make decisions. Fail-open design: errors or
 * missing state allow pop rather than blocking work.
 */

import { readFile, utimes, appendFile, readdir, stat } from 'node:fs/promises';
import { join } from 'node:path';

// ============================================================================
// Interfaces
// ============================================================================

/**
 * Configuration for PopStackAwareness.
 */
export interface PopStackConfig {
  /** Path to .claude/stack/ directory. */
  stackDir: string;
  /** Optional session name (auto-detect from active sessions if omitted). */
  sessionName?: string;
}

/**
 * Result of a pop-stack awareness check.
 */
export interface PopStackResult {
  /** Whether the pop operation is allowed. */
  allowed: boolean;
  /** Reason when pop is refused (only set when allowed=false). */
  reason?: string;
  /** Whether the heartbeat file mtime was updated. */
  heartbeatTouched: boolean;
  /** Whether a recording marker was written (always false from check()). */
  markerWritten: boolean;
}

// ============================================================================
// PopStackAwareness class
// ============================================================================

/**
 * Session-aware wrapper for pop-stack operations.
 *
 * Usage:
 *   const awareness = new PopStackAwareness({ stackDir: '.claude/stack' });
 *   const result = await awareness.check();
 *   if (result.allowed) {
 *     // perform pop
 *     await awareness.recordPop(poppedMessage);
 *   }
 */
export class PopStackAwareness {
  private readonly config: PopStackConfig;

  constructor(config: PopStackConfig) {
    this.config = config;
  }

  /**
   * Pre-pop check: touch heartbeat + verify session allows popping.
   *
   * Always touches heartbeat first (even if pop will be refused) to prove
   * the pop-stack skill is alive. Then checks session state to decide
   * whether popping is allowed.
   */
  async check(): Promise<PopStackResult> {
    // Resolve which session to check
    const sessionName = this.config.sessionName ?? (await this.findActiveSession());

    // Touch heartbeat first (always, even if pop will be refused)
    const heartbeatTouched = sessionName
      ? await this.touchHeartbeat(sessionName)
      : false;

    // Read session state
    const state = await this.getSessionStateInternal(sessionName);

    // Decide based on state
    if (state === 'paused') {
      return {
        allowed: false,
        reason: 'Session is paused. Resume with `gsd-stack resume` before popping.',
        heartbeatTouched,
        markerWritten: false,
      };
    }

    if (state === 'stopped' || state === 'saved') {
      return {
        allowed: false,
        reason: `Session is ${state}. Start a new session first.`,
        heartbeatTouched,
        markerWritten: false,
      };
    }

    // active, stalled, null (no session), or any other value -> allow
    return {
      allowed: true,
      heartbeatTouched,
      markerWritten: false,
    };
  }

  /**
   * Post-pop: write a recording marker if recording is active.
   *
   * @param message - The popped message content
   * @returns true if marker was written, false otherwise
   */
  async recordPop(message: string): Promise<boolean> {
    try {
      const recordingDir = await this.findActiveRecording();
      if (!recordingDir) return false;

      const streamPath = join(recordingDir, 'stream.jsonl');
      const truncated = message.length > 50 ? message.slice(0, 50) : message;
      const marker = JSON.stringify({
        ts: new Date().toISOString(),
        type: 'marker',
        label: `pop-stack: ${truncated}`,
      });

      await appendFile(streamPath, marker + '\n');
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Read session state from meta.json.
   *
   * @returns status string or null if no session/error
   */
  async getSessionState(): Promise<string | null> {
    const sessionName = this.config.sessionName ?? (await this.findActiveSession());
    return this.getSessionStateInternal(sessionName);
  }

  // ==========================================================================
  // Private helpers
  // ==========================================================================

  /**
   * Read session state for a specific session name.
   */
  private async getSessionStateInternal(sessionName: string | null): Promise<string | null> {
    if (!sessionName) return null;

    try {
      const metaPath = join(this.config.stackDir, 'sessions', sessionName, 'meta.json');
      const content = await readFile(metaPath, 'utf-8');
      const meta = JSON.parse(content);
      return typeof meta.status === 'string' ? meta.status : null;
    } catch {
      return null;
    }
  }

  /**
   * Touch the heartbeat file for a session (update mtime to now).
   *
   * @returns true if heartbeat was touched, false on error
   */
  private async touchHeartbeat(sessionName: string): Promise<boolean> {
    try {
      const heartbeatPath = join(
        this.config.stackDir,
        'sessions',
        sessionName,
        'heartbeat',
      );

      // Verify file exists before touching
      await stat(heartbeatPath);

      const now = new Date();
      await utimes(heartbeatPath, now, now);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Scan sessions/ for an active or paused session.
   *
   * Returns the name of the first active or paused session found,
   * or null if none exist.
   */
  private async findActiveSession(): Promise<string | null> {
    try {
      const sessionsDir = join(this.config.stackDir, 'sessions');
      const entries = await readdir(sessionsDir);

      for (const entry of entries) {
        try {
          const metaPath = join(sessionsDir, entry, 'meta.json');
          const content = await readFile(metaPath, 'utf-8');
          const meta = JSON.parse(content);
          if (
            meta.status === 'active' ||
            meta.status === 'paused' ||
            meta.status === 'stalled'
          ) {
            return entry;
          }
        } catch {
          // Skip entries without valid meta.json
          continue;
        }
      }
    } catch {
      // sessions/ directory doesn't exist
    }

    return null;
  }

  /**
   * Scan recordings/ for an active recording.
   *
   * Returns the directory path of the first recording with status='recording',
   * or null if none found.
   */
  private async findActiveRecording(): Promise<string | null> {
    try {
      const recordingsDir = join(this.config.stackDir, 'recordings');
      const entries = await readdir(recordingsDir);

      for (const entry of entries) {
        try {
          const metaPath = join(recordingsDir, entry, 'meta.json');
          const content = await readFile(metaPath, 'utf-8');
          const meta = JSON.parse(content);
          if (meta.status === 'recording') {
            return join(recordingsDir, entry);
          }
        } catch {
          continue;
        }
      }
    } catch {
      // recordings/ directory doesn't exist or is empty
    }

    return null;
  }
}
