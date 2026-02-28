/**
 * Writes validated messages to the console message bridge.
 *
 * Dashboard-sourced messages go to inbox/pending/ (for session pickup).
 * Session-sourced messages go to the appropriate outbox/ subdirectory.
 *
 * @module console/writer
 */

import { writeFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { MessageEnvelopeSchema } from './schema.js';
import { CONSOLE_DIRS } from './types.js';
import type { MessageEnvelope } from './types.js';

/**
 * Writes validated message envelopes to the filesystem message bus.
 *
 * Messages are routed based on their source:
 * - `dashboard` messages go to inbox/pending/ (for session pickup)
 * - `session` messages go to the appropriate outbox/ subdirectory
 */
export class MessageWriter {
  private readonly basePath: string;

  constructor(basePath: string) {
    this.basePath = basePath;
  }

  /**
   * Validate and write a message envelope to the filesystem.
   *
   * @param envelope - Raw envelope data (validated through Zod before writing)
   * @returns Absolute path to the written JSON file
   * @throws ZodError if the envelope fails validation
   */
  async write(envelope: unknown): Promise<string> {
    // Validate through Zod -- throws ZodError on invalid input
    const parsed: MessageEnvelope = MessageEnvelopeSchema.parse(envelope);

    // Determine target directory based on source and type
    const targetRelDir = this.resolveTargetDirectory(parsed);
    const targetDir = join(this.basePath, targetRelDir);

    // Ensure target directory exists
    await mkdir(targetDir, { recursive: true });

    // Generate filename: {timestamp}-{type}.json
    const filename = `${Date.now()}-${parsed.type}.json`;
    const filePath = join(targetDir, filename);

    // Write formatted JSON
    await writeFile(filePath, JSON.stringify(parsed, null, 2), 'utf-8');

    return filePath;
  }

  /**
   * Resolve the target directory for a message based on source and type.
   *
   * Dashboard messages always go to inbox/pending/.
   * Session messages are routed by type:
   * - question-response -> outbox/questions/
   * - setting-change, config-update -> outbox/status/
   * - everything else -> outbox/notifications/
   */
  private resolveTargetDirectory(envelope: MessageEnvelope): string {
    if (envelope.source === 'dashboard') {
      return CONSOLE_DIRS.inboxPending;
    }

    // Session-sourced messages route by type
    switch (envelope.type) {
      case 'question-response':
        return CONSOLE_DIRS.outboxQuestions;
      case 'setting-change':
      case 'config-update':
        return CONSOLE_DIRS.outboxStatus;
      case 'milestone-submit':
      default:
        return CONSOLE_DIRS.outboxNotifications;
    }
  }
}
