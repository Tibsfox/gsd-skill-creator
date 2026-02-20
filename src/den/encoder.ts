/**
 * ISA compact message encoder and decoder for the GSD Den message bus.
 *
 * Provides full round-trip encoding between structured BusMessage objects
 * and the pipe-delimited text format used for filesystem-based messaging.
 *
 * Header format: TIMESTAMP|PRIORITY|OPCODE|SRC|DST|LENGTH
 * Message format: header line + payload lines (one per line)
 *
 * All decode operations validate through Zod schemas, so invalid data
 * throws immediately with descriptive errors.
 */

import {
  MessageHeaderSchema,
  BusMessageSchema,
} from './types.js';
import type { MessageHeader, BusMessage } from './types.js';

// ============================================================================
// Timestamp formatting
// ============================================================================

/** Number of fields in a pipe-delimited header line */
const HEADER_FIELD_COUNT = 6;

/** Regex for validating compact timestamp format */
const TIMESTAMP_REGEX = /^\d{8}-\d{6}$/;

/**
 * Format a Date to compact YYYYMMDD-HHMMSS string (UTC).
 *
 * @param date - Date to format
 * @returns Compact timestamp string
 */
export function formatTimestamp(date: Date): string {
  const y = date.getUTCFullYear().toString();
  const m = (date.getUTCMonth() + 1).toString().padStart(2, '0');
  const d = date.getUTCDate().toString().padStart(2, '0');
  const h = date.getUTCHours().toString().padStart(2, '0');
  const min = date.getUTCMinutes().toString().padStart(2, '0');
  const s = date.getUTCSeconds().toString().padStart(2, '0');
  return `${y}${m}${d}-${h}${min}${s}`;
}

/**
 * Parse a compact YYYYMMDD-HHMMSS timestamp back to a Date (UTC).
 *
 * @param ts - Compact timestamp string
 * @returns Parsed Date object
 * @throws Error if format is invalid
 */
export function parseTimestamp(ts: string): Date {
  if (!TIMESTAMP_REGEX.test(ts)) {
    throw new Error(`Invalid timestamp format: "${ts}" (expected YYYYMMDD-HHMMSS)`);
  }

  const year = parseInt(ts.slice(0, 4), 10);
  const month = parseInt(ts.slice(4, 6), 10) - 1; // 0-indexed
  const day = parseInt(ts.slice(6, 8), 10);
  const hour = parseInt(ts.slice(9, 11), 10);
  const minute = parseInt(ts.slice(11, 13), 10);
  const second = parseInt(ts.slice(13, 15), 10);

  return new Date(Date.UTC(year, month, day, hour, minute, second));
}

// ============================================================================
// Header encoding
// ============================================================================

/**
 * Encode a MessageHeader to a pipe-delimited string.
 *
 * Format: TIMESTAMP|PRIORITY|OPCODE|SRC|DST|LENGTH
 *
 * @param header - Validated message header
 * @returns Pipe-delimited header string
 */
export function encodeHeader(header: MessageHeader): string {
  return [
    header.timestamp,
    header.priority.toString(),
    header.opcode,
    header.src,
    header.dst,
    header.length.toString(),
  ].join('|');
}

/**
 * Decode a pipe-delimited header string back to a MessageHeader.
 *
 * Validates through MessageHeaderSchema so invalid fields throw
 * descriptive Zod errors.
 *
 * @param line - Pipe-delimited header string
 * @returns Validated MessageHeader object
 * @throws Error if field count is wrong or validation fails
 */
export function decodeHeader(line: string): MessageHeader {
  const parts = line.split('|');
  if (parts.length !== HEADER_FIELD_COUNT) {
    throw new Error(
      `Invalid header: expected ${HEADER_FIELD_COUNT} pipe-delimited fields, got ${parts.length}`,
    );
  }

  const [timestamp, priorityStr, opcode, src, dst, lengthStr] = parts;

  return MessageHeaderSchema.parse({
    timestamp,
    priority: parseInt(priorityStr, 10),
    opcode,
    src,
    dst,
    length: parseInt(lengthStr, 10),
  });
}

// ============================================================================
// Message encoding
// ============================================================================

/**
 * Encode a full BusMessage to a multi-line string.
 *
 * First line is the pipe-delimited header. Subsequent lines are payload.
 *
 * @param msg - Validated bus message
 * @returns Multi-line encoded message string
 */
export function encodeMessage(msg: BusMessage): string {
  const headerLine = encodeHeader(msg.header);
  if (msg.payload.length === 0) {
    return headerLine;
  }
  return [headerLine, ...msg.payload].join('\n');
}

/**
 * Decode a multi-line string back to a validated BusMessage.
 *
 * Parses the first line as header, remaining lines as payload.
 * Validates through BusMessageSchema (including payload length check).
 *
 * @param raw - Multi-line encoded message string
 * @returns Validated BusMessage object
 * @throws Error if input is empty, header is invalid, or payload length mismatches
 */
export function decodeMessage(raw: string): BusMessage {
  if (!raw || raw.trim() === '') {
    throw new Error('Cannot decode empty message');
  }

  const lines = raw.split('\n');
  const headerLine = lines[0];
  const payload = lines.slice(1);

  const header = decodeHeader(headerLine);

  return BusMessageSchema.parse({
    header,
    payload,
  });
}

// ============================================================================
// Filename generation
// ============================================================================

/**
 * Generate a deterministic filename for a bus message.
 *
 * Format: {timestamp}-{opcode}-{src}-{dst}.msg
 *
 * @param header - Message header
 * @returns Filesystem-safe filename
 */
export function messageFilename(header: MessageHeader): string {
  return `${header.timestamp}-${header.opcode}-${header.src}-${header.dst}.msg`;
}
