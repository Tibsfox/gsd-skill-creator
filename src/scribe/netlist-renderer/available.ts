/**
 * SCRIBE Yosys netlist renderer — availability probe.
 *
 * Probes whether `yosys` and `netlistsvg` are available in the current
 * environment by spawning each with a version flag. Result is cached for
 * the lifetime of the process (Yosys availability does not change at runtime).
 *
 * @module scribe/netlist-renderer/available
 */

import { spawn } from 'node:child_process';

/** Result shape returned by isAvailable(). */
export interface AvailabilityResult {
  readonly yosys: boolean;
  readonly netlistsvg: boolean;
  /** Human-readable explanation when yosys or netlistsvg is false. */
  readonly reason?: string;
}

let CACHED: AvailabilityResult | null = null;

/**
 * Probe whether `yosys` and `netlistsvg` are usable in this environment.
 *
 * The probe is done by spawning each binary with a version flag (`-V` /
 * `--version`) and checking exit code 0. Each probe has a 5-second timeout.
 *
 * Result is cached — subsequent calls return the same object without
 * re-probing.
 *
 * @returns An AvailabilityResult with `yosys`, `netlistsvg`, and optional
 *   human-readable `reason` when either is unavailable.
 */
export async function isAvailable(
  yosysBin = 'yosys',
  netlistsvgBin = 'netlistsvg',
): Promise<AvailabilityResult> {
  if (CACHED !== null) return CACHED;

  const [yosysOk, netlistsvgOk] = await Promise.all([
    probeCommand(yosysBin, ['-V']),
    probeCommand(netlistsvgBin, ['--version']),
  ]);

  const reasons: string[] = [];
  if (!yosysOk) reasons.push(`'${yosysBin}' not found or exited non-zero`);
  if (!netlistsvgOk) reasons.push(`'${netlistsvgBin}' not found or exited non-zero`);

  CACHED = {
    yosys: yosysOk,
    netlistsvg: netlistsvgOk,
    ...(reasons.length > 0 ? { reason: reasons.join('; ') } : {}),
  };

  return CACHED;
}

/**
 * Reset the availability cache. Used in tests to simulate different
 * environments without process restart.
 *
 * @internal
 */
export function _resetCache(): void {
  CACHED = null;
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Probe a command by spawning it with the given args. Returns true if the
 * command exits with code 0 within 5 seconds. Returns false on any error
 * (ENOENT, non-zero exit, timeout).
 */
function probeCommand(bin: string, args: string[]): Promise<boolean> {
  return new Promise<boolean>(resolve => {
    let settled = false;
    const settle = (ok: boolean): void => {
      if (!settled) {
        settled = true;
        resolve(ok);
      }
    };

    let child: ReturnType<typeof spawn>;
    try {
      child = spawn(bin, args, {
        stdio: ['ignore', 'ignore', 'ignore'],
        shell: false,
      });
    } catch {
      settle(false);
      return;
    }

    const timer = setTimeout(() => settle(false), 5_000);

    child.on('error', () => settle(false));
    child.on('close', (code: number | null) => {
      clearTimeout(timer);
      settle(code === 0);
    });
  });
}
