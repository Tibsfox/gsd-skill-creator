/**
 * cli-utils — Shared CLI flag helpers for wasteland commands.
 *
 * R2.4: Extracted from duplicated helpers in wl-browse, wl-done, wl-init,
 * wl-status. Each command had identical hasFlag/getFlagValue and near-identical
 * extractPositionalArgs implementations.
 *
 * @module cli-utils
 */

/**
 * Return true when any of the named flags appear in the args array.
 * Handles both --flag and -f (first char) forms.
 */
export function hasFlag(args: string[], ...flags: string[]): boolean {
  return flags.some(f => args.includes(`--${f}`) || args.includes(`-${f.charAt(0)}`));
}

/**
 * Return the value following --flag in the args array, or undefined when absent.
 */
export function getFlagValue(args: string[], flag: string): string | undefined {
  const idx = args.indexOf(`--${flag}`);
  return idx !== -1 ? args[idx + 1] : undefined;
}

/**
 * Extract positional arguments from a CLI args array.
 *
 * Skips flag names (--foo, -f) and their associated values. A flag is
 * considered to take a value when:
 * - It appears in the flagsWithValues set, OR
 * - The next token does not start with '-' (generic detection)
 *
 * @param args - The CLI args array
 * @param flagsWithValues - Optional set of flags known to take values
 *   (e.g., new Set(['--status', '--effort'])). When provided, only these
 *   flags consume the following token as a value. When omitted, uses
 *   generic detection (any --flag followed by a non-flag token).
 */
export function extractPositionalArgs(
  args: string[],
  flagsWithValues?: Set<string>,
): string[] {
  const positionals: string[] = [];
  let i = 0;
  while (i < args.length) {
    const arg = args[i]!;
    if (arg.startsWith('--')) {
      if (flagsWithValues) {
        // Explicit set: skip flag + value only for known valued flags
        if (flagsWithValues.has(arg)) {
          i += 2;
        } else {
          i += 1;
        }
      } else {
        // Generic detection: skip flag, and skip next token if it's not a flag
        i++;
        if (i < args.length && !args[i]!.startsWith('-')) i++;
      }
    } else if (arg.startsWith('-')) {
      i++;
    } else {
      positionals.push(arg);
      i++;
    }
  }
  return positionals;
}
