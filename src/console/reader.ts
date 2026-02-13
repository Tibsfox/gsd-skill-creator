/**
 * Reads pending messages from the console inbox.
 *
 * Scans inbox/pending/ for JSON files, parses each through
 * the envelope schema, and moves processed files to
 * inbox/acknowledged/ to prevent double-processing.
 *
 * @module console/reader
 */

import type { MessageEnvelope } from './types.js';

export class MessageReader {
  constructor(_basePath: string) {}
  async readPending(): Promise<MessageEnvelope[]> { throw new Error('Not implemented'); }
}
