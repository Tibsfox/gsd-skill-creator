/**
 * Writes validated messages to the console message bridge.
 *
 * Dashboard-sourced messages go to inbox/pending/ (for session pickup).
 * Session-sourced messages go to the appropriate outbox/ subdirectory.
 *
 * @module console/writer
 */

export class MessageWriter {
  constructor(_basePath: string) {}
  async write(_envelope: unknown): Promise<string> { throw new Error('Not implemented'); }
}
