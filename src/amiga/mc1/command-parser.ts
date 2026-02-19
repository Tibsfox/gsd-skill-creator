/**
 * MC-1 command parser.
 *
 * Converts text input into structured ICD-01 CommandDispatchPayload objects.
 * Handles all 8 mission commands case-insensitively, validates arguments,
 * and returns plain-language error messages for ambiguous or invalid input.
 *
 * Commands: LAUNCH, STATUS, REDIRECT, REVIEW, HOLD, RESUME, ABORT, DEBRIEF
 *
 * The parser is a pure function with no side effects or I/O.
 */

import { CommandDispatchPayloadSchema } from '../icd/icd-01.js';
import type { CommandDispatchPayload } from '../icd/icd-01.js';
import { MissionIDSchema } from '../types.js';

// ============================================================================
// Constants
// ============================================================================

/** All 8 supported mission commands. */
export const SUPPORTED_COMMANDS = [
  'LAUNCH', 'STATUS', 'REDIRECT', 'REVIEW',
  'HOLD', 'RESUME', 'ABORT', 'DEBRIEF',
] as const;

export type SupportedCommand = (typeof SUPPORTED_COMMANDS)[number];

// ============================================================================
// Types
// ============================================================================

/** Error returned when command parsing fails. */
export interface ParseError {
  /** Plain-language error description. */
  message: string;
  /** List of valid command suggestions. */
  suggestions: string[];
  /** Original user input. */
  input: string;
}

/** Discriminated union result from parseCommand. */
export type ParseResult =
  | { ok: true; command: CommandDispatchPayload }
  | { ok: false; error: ParseError };

// ============================================================================
// Tokenizer
// ============================================================================

/**
 * Tokenize input by splitting on whitespace, respecting double-quoted strings.
 */
function tokenize(input: string): string[] {
  const tokens: string[] = [];
  const regex = /"([^"]*)"|(\S+)/g;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(input)) !== null) {
    // Group 1 = quoted content (without quotes), Group 2 = unquoted token
    tokens.push(match[1] ?? match[2]);
  }
  return tokens;
}

// ============================================================================
// Mission ID pattern
// ============================================================================

const MISSION_ID_PATTERN = /^mission-\d{4}-\d{2}-\d{2}-\d{3}$/;

// ============================================================================
// parseCommand
// ============================================================================

/**
 * Parse a text command into a structured ICD-01 CommandDispatchPayload.
 *
 * @param input - Raw text input from the user
 * @returns ParseResult with either a valid command or an error with suggestions
 */
export function parseCommand(input: string): ParseResult {
  const trimmed = input.trim();

  // Empty input
  if (trimmed.length === 0) {
    return {
      ok: false,
      error: {
        message: `No command provided. Available commands: ${SUPPORTED_COMMANDS.join(', ')}`,
        suggestions: [...SUPPORTED_COMMANDS],
        input,
      },
    };
  }

  const tokens = tokenize(trimmed);
  const commandToken = tokens[0].toUpperCase();

  // Exact match
  const isExact = SUPPORTED_COMMANDS.includes(commandToken as SupportedCommand);

  if (!isExact) {
    // Prefix match
    const prefixMatches = SUPPORTED_COMMANDS.filter((cmd) =>
      cmd.startsWith(commandToken),
    );

    if (prefixMatches.length === 1) {
      return {
        ok: false,
        error: {
          message: `Did you mean '${prefixMatches[0]}'? Type the full command to confirm.`,
          suggestions: [...prefixMatches],
          input,
        },
      };
    }

    if (prefixMatches.length > 1) {
      return {
        ok: false,
        error: {
          message: `Ambiguous command '${commandToken}'. Did you mean one of: ${prefixMatches.join(', ')}?`,
          suggestions: [...prefixMatches],
          input,
        },
      };
    }

    // No matches
    return {
      ok: false,
      error: {
        message: `Unknown command '${commandToken}'. Available commands: ${SUPPORTED_COMMANDS.join(', ')}`,
        suggestions: [...SUPPORTED_COMMANDS],
        input,
      },
    };
  }

  // Parse remaining tokens for arguments
  let targetAgent: string = 'broadcast';
  let missionId: string | undefined;
  const parameters: Record<string, unknown> = {};
  let hasParameters = false;

  let i = 1;
  while (i < tokens.length) {
    const token = tokens[i];

    if (token === '--target' && i + 1 < tokens.length) {
      targetAgent = tokens[i + 1];
      i += 2;
      continue;
    }

    if ((token === '--reason' || token === '--brief') && i + 1 < tokens.length) {
      const paramName = token.slice(2); // Remove '--'
      parameters[paramName] = tokens[i + 1];
      hasParameters = true;
      i += 2;
      continue;
    }

    // Check if it looks like a mission ID
    if (MISSION_ID_PATTERN.test(token)) {
      // Validate with MissionIDSchema
      const missionResult = MissionIDSchema.safeParse(token);
      if (missionResult.success) {
        missionId = token;
        i++;
        continue;
      }
    }

    // Bare token that doesn't match anything known
    // Check if it could be a malformed mission ID
    if (token.startsWith('mission-') || token.includes('-')) {
      return {
        ok: false,
        error: {
          message: `Invalid mission ID format '${token}'. Expected format: mission-YYYY-MM-DD-NNN (e.g., mission-2026-02-18-001)`,
          suggestions: [],
          input,
        },
      };
    }

    // Unknown argument
    return {
      ok: false,
      error: {
        message: `Unexpected argument '${token}'. Use --target for agent routing, or provide a mission ID in format mission-YYYY-MM-DD-NNN.`,
        suggestions: [],
        input,
      },
    };
  }

  // Build the payload
  const payload: CommandDispatchPayload = {
    command: commandToken as CommandDispatchPayload['command'],
    target_agent: targetAgent,
    ...(missionId !== undefined ? { mission_id: missionId } : {}),
    ...(hasParameters ? { parameters } : {}),
  };

  // Safety net: validate against ICD-01 schema
  const validation = CommandDispatchPayloadSchema.safeParse(payload);
  if (!validation.success) {
    const issues = validation.error.issues
      .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
      .join('; ');
    return {
      ok: false,
      error: {
        message: `Command validation failed: ${issues}`,
        suggestions: [],
        input,
      },
    };
  }

  return { ok: true, command: payload };
}
