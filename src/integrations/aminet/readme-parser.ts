/**
 * Aminet .readme file parser.
 *
 * Parses the structured header fields and free-form description body
 * from Aminet package .readme files. The format consists of:
 *
 * 1. Header section: lines matching `FieldName: value`
 *    - Continuation lines start with whitespace and append to the previous field
 *    - Known fields: Short, Author, Uploader, Type, Version, Requires, Architecture
 *    - Unknown fields are preserved in rawHeader for extensibility
 *
 * 2. Body section: everything after the first blank line, free-form text
 *
 * Only the Short field is required. All others are optional.
 *
 * @module
 */

import type { PackageReadme } from './types.js';

/**
 * Parse an Aminet .readme file into structured metadata.
 *
 * @param content - Raw .readme file content (may use LF or CRLF line endings)
 * @returns Parsed metadata with header fields and description body
 * @throws Error if the required Short field is missing
 */
export function parseReadme(content: string): PackageReadme {
  // Normalize line endings: replace CRLF with LF
  const normalized = content.replace(/\r\n/g, '\n');

  // Split into header section and body section at first blank line (\n\n)
  const blankLineIndex = normalized.indexOf('\n\n');
  let headerSection: string;
  let bodySection: string;

  if (blankLineIndex === -1) {
    // No blank line separator -- entire content is header, no body
    headerSection = normalized;
    bodySection = '';
  } else {
    headerSection = normalized.substring(0, blankLineIndex);
    bodySection = normalized.substring(blankLineIndex + 2); // skip the \n\n
  }

  // Parse header fields
  const rawHeader: Record<string, string> = {};
  const headerLines = headerSection.split('\n');
  let currentKey: string | null = null;

  const fieldPattern = /^(\w[\w-]*):\s*(.*)$/;

  for (const line of headerLines) {
    // Check for continuation line (starts with whitespace)
    if (/^\s+/.test(line) && currentKey !== null) {
      // Append to previous field value with space separator
      rawHeader[currentKey] = rawHeader[currentKey] + ' ' + line.trim();
      continue;
    }

    // Check for field line
    const match = fieldPattern.exec(line);
    if (match) {
      const key = match[1].toLowerCase();
      const value = match[2].trim();
      rawHeader[key] = value;
      currentKey = key;
    }
    // Lines that don't match either pattern are ignored in the header
  }

  // Extract known fields case-insensitively (keys are already lowercase)
  const short = rawHeader['short'] ?? null;

  if (short === null || short === '') {
    throw new Error('Missing required Short field in .readme');
  }

  const author = rawHeader['author'] ?? null;
  const uploader = rawHeader['uploader'] ?? null;
  const type = rawHeader['type'] ?? null;
  const version = rawHeader['version'] ?? null;

  // Multi-value fields: split on comma or semicolon, trim each, filter empty
  const requires = splitMultiValue(rawHeader['requires']);
  const architecture = splitMultiValue(rawHeader['architecture']);

  // Body text: trim trailing whitespace/newlines
  const description = bodySection.trim();

  return {
    short,
    author,
    uploader,
    type,
    version,
    requires,
    architecture,
    description,
    rawHeader,
  };
}

/**
 * Split a multi-value header field on commas or semicolons.
 *
 * @param value - Raw field value, or undefined if field was absent
 * @returns Array of trimmed, non-empty values
 */
function splitMultiValue(value: string | undefined): string[] {
  if (value === undefined || value === '') {
    return [];
  }

  return value
    .split(/[,;]/)
    .map((item) => item.trim())
    .filter((item) => item !== '');
}
