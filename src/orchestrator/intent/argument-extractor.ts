/**
 * Regex-based argument extraction from user input.
 *
 * Extracts structured arguments (phase numbers, flags, versions,
 * profiles, descriptions) from both natural language input and
 * raw argument strings.
 */

import type { ExtractedArguments } from './types.js';

// TODO: Implement in GREEN phase

export function extractArguments(_input: string): ExtractedArguments {
  return {
    phaseNumber: null,
    flags: [],
    description: null,
    version: null,
    profile: null,
    raw: _input,
  };
}
