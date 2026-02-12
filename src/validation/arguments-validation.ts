/**
 * Arguments validation module for Claude Code skills.
 *
 * Detects $ARGUMENTS parameterization, !`command` preprocessing syntax,
 * and flags shell injection risks when $ARGUMENTS appears inside !`command` context.
 *
 * Covers SPEC-02 ($ARGUMENTS detection), SPEC-03 (!command recognition),
 * and SPEC-07 (injection prevention).
 */

// ============================================================================
// Types
// ============================================================================

export interface ArgumentDetection {
  found: boolean;
  placeholders: string[];  // '$ARGUMENTS', '$ARGUMENTS[0]', etc.
  positional: number[];    // indices found
}

export interface PreprocessingDetection {
  found: boolean;
  commands: string[];  // extracted command strings
}

export interface InjectionRisk {
  risk: 'none' | 'high';
  locations: Array<{
    command: string;
    argument: string;
    description: string;
  }>;
}

// ============================================================================
// Internal helpers
// ============================================================================

/**
 * Strip fenced code blocks (triple backtick) from body, returning only
 * non-code-block content. This prevents false positives on !`cmd` examples
 * shown inside markdown code blocks.
 */
function stripCodeBlocks(body: string): string {
  // Match ``` optionally with language tag, through closing ```
  return body.replace(/```[\s\S]*?```/g, '');
}

/**
 * Regex patterns for argument detection.
 *
 * - $ARGUMENTS[N]: positional indexed argument
 * - $ARGUMENTS: full argument string (not followed by `[`)
 * - $N: shorthand positional (digit not followed by word char, not preceded by `{`)
 */
const ARGUMENTS_INDEXED_RE = /\$ARGUMENTS\[(\d+)\]/g;
const ARGUMENTS_BARE_RE = /\$ARGUMENTS(?!\[)/g;
const SHORTHAND_POSITIONAL_RE = /(?<!\{[A-Z_]*)\$(\d+)(?!\w)/g;

/**
 * Regex for !`command` preprocessing syntax.
 * Matches `!` immediately followed by a backtick-wrapped command.
 * Does NOT match inside fenced code blocks (caller must strip those first).
 */
const PREPROCESSING_RE = /!\`([^`]+)\`/g;

// ============================================================================
// Public API
// ============================================================================

/**
 * Detect $ARGUMENTS placeholders in a skill body.
 *
 * Finds:
 * - $ARGUMENTS (full argument string)
 * - $ARGUMENTS[N] (positional indexed)
 * - $N shorthand (e.g., $0, $1)
 *
 * Does NOT count ${CLAUDE_SESSION_ID} or similar environment variables.
 */
export function detectArguments(body: string): ArgumentDetection {
  const placeholders = new Set<string>();
  const positional = new Set<number>();

  // Find $ARGUMENTS[N]
  let match: RegExpExecArray | null;
  const indexedRe = new RegExp(ARGUMENTS_INDEXED_RE.source, 'g');
  while ((match = indexedRe.exec(body)) !== null) {
    placeholders.add(match[0]);
    positional.add(parseInt(match[1], 10));
  }

  // Find bare $ARGUMENTS (not followed by `[`)
  const bareRe = new RegExp(ARGUMENTS_BARE_RE.source, 'g');
  while ((match = bareRe.exec(body)) !== null) {
    placeholders.add('$ARGUMENTS');
  }

  // Find $N shorthand, but exclude ${VARIABLE} patterns
  // We need to avoid matching inside ${...} constructs
  const shorthandRe = new RegExp(SHORTHAND_POSITIONAL_RE.source, 'g');
  while ((match = shorthandRe.exec(body)) !== null) {
    // Check that this isn't inside a ${...} construct
    const beforeMatch = body.substring(0, match.index);
    // If there's an unclosed ${ before this position, skip it
    const lastDollarBrace = beforeMatch.lastIndexOf('${');
    const lastCloseBrace = beforeMatch.lastIndexOf('}');
    if (lastDollarBrace > lastCloseBrace) {
      // Inside a ${...} block, skip
      continue;
    }

    const idx = parseInt(match[1], 10);
    placeholders.add(`$${idx}`);
    positional.add(idx);
  }

  return {
    found: placeholders.size > 0,
    placeholders: Array.from(placeholders),
    positional: Array.from(positional).sort((a, b) => a - b),
  };
}

/**
 * Detect !`command` preprocessing syntax in a skill body.
 *
 * Finds commands wrapped in !`...` notation, which indicates
 * preprocessing that runs before Claude sees the content.
 *
 * Ignores !`command` occurrences inside fenced code blocks (```)
 * to avoid false positives on documentation examples.
 */
export function detectPreprocessing(body: string): PreprocessingDetection {
  const stripped = stripCodeBlocks(body);
  const commands: string[] = [];

  let match: RegExpExecArray | null;
  const re = new RegExp(PREPROCESSING_RE.source, 'g');
  while ((match = re.exec(stripped)) !== null) {
    commands.push(match[1]);
  }

  return {
    found: commands.length > 0,
    commands,
  };
}

/**
 * Check for shell injection risk when $ARGUMENTS appears inside !`command` context.
 *
 * This is the critical security check (SPEC-07): if a user provides arguments
 * that get interpolated into a shell command via !`command $ARGUMENTS`,
 * arbitrary command execution is possible.
 *
 * Returns 'high' risk only when $ARGUMENTS, $ARGUMENTS[N], or $N shorthand
 * appears INSIDE an !`command` block (not when they exist separately).
 *
 * Ignores occurrences inside fenced code blocks.
 */
export function checkInjectionRisk(body: string): InjectionRisk {
  const stripped = stripCodeBlocks(body);
  const locations: InjectionRisk['locations'] = [];

  // Find all !`command` blocks in non-code-block content
  let match: RegExpExecArray | null;
  const re = new RegExp(PREPROCESSING_RE.source, 'g');
  while ((match = re.exec(stripped)) !== null) {
    const command = match[1];

    // Check if this command contains any argument placeholders
    const argPatterns = [
      { re: /\$ARGUMENTS\[\d+\]/g, type: 'indexed' },
      { re: /\$ARGUMENTS(?!\[)/g, type: 'bare' },
      { re: /\$(\d+)(?!\w)/g, type: 'shorthand' },
    ];

    for (const pattern of argPatterns) {
      const argRe = new RegExp(pattern.re.source, 'g');
      let argMatch: RegExpExecArray | null;
      while ((argMatch = argRe.exec(command)) !== null) {
        locations.push({
          command: command,
          argument: argMatch[0],
          description: `User-supplied ${argMatch[0]} is interpolated into shell command "${command}". This allows arbitrary command execution via argument injection.`,
        });
      }
    }
  }

  return {
    risk: locations.length > 0 ? 'high' : 'none',
    locations,
  };
}

/**
 * Suggest an argument-hint value based on detected arguments in the body.
 *
 * Heuristics:
 * - If only $ARGUMENTS (bare) is found, suggest a generic hint like "content to review"
 * - If positional args are found, suggest "arg1 arg2 ..." for the count
 * - If no arguments found, return null
 */
export function suggestArgumentHint(body: string): string | null {
  const detection = detectArguments(body);

  if (!detection.found) {
    return null;
  }

  // If positional arguments exist, suggest based on count
  if (detection.positional.length > 0) {
    const maxIndex = Math.max(...detection.positional);
    const args = Array.from({ length: maxIndex + 1 }, (_, i) => `arg${i + 1}`);
    return args.join(' ');
  }

  // Bare $ARGUMENTS - suggest a generic hint
  return 'content to process';
}
