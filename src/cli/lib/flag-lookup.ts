/**
 * Shared FlagLookup discriminated union + `getFlagValue` parser for CLI command modules.
 *
 * Extracted v1.49.818 per #10426 cross-class registry extraction at 2nd-3rd
 * instance (here: 4 instances across koopman-check, coherent-check,
 * hourglass-check, bounded-learning all using the identical shape). The
 * discriminated union distinguishes "flag absent" from "flag present but
 * value missing or empty" so callers can dispatch on `present === false`
 * (skip), `present === true && value === null` (boolean flag), or
 * `present === true && value !== null` (string value).
 *
 * Original deferred at v796; closed at v818 in the v816-822 chain.
 */

export type FlagLookup =
  | { present: false }
  | { present: true; value: string | null };

/**
 * Look up `flag` in `args`. Returns the discriminated union so callers can
 * distinguish "flag absent" from "flag present with null/missing value".
 *
 * Examples:
 *   getFlagValue(['--foo', 'bar'], '--foo')  // { present: true,  value: 'bar' }
 *   getFlagValue(['--foo'],        '--foo')  // { present: true,  value: null  }  (trailing flag)
 *   getFlagValue(['--bar'],        '--foo')  // { present: false }
 */
export function getFlagValue(args: string[], flag: string): FlagLookup {
  const idx = args.indexOf(flag);
  if (idx < 0) return { present: false };
  if (idx === args.length - 1) return { present: true, value: null };
  return { present: true, value: args[idx + 1] ?? null };
}
