/**
 * SCRIBE Yosys netlist renderer — Yosys subprocess driver.
 *
 * Wraps the `yosys` binary. Accepts a Verilog source string, writes it to a
 * temp file, runs Yosys with the standard synthesis script, reads the JSON
 * netlist output, and returns it as a string.
 *
 * Subprocess command:
 *   yosys -q -p "
 *     read_verilog <tmpInputV>;
 *     hierarchy -auto-top;
 *     proc;
 *     opt;
 *     write_json <tmpOutputJson>
 *   "
 *
 * @module scribe/netlist-renderer/yosys-driver
 */

import { spawn } from 'node:child_process';
import { writeFile, readFile, mkdtemp, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

import { NetlistRenderError } from '../types/errors.js';
import { ensureProcessAllowed, type ProcessContext } from '../../security/process-context.js';

const PROCESS_SOURCE = 'scribe/netlist-renderer/yosys-driver';

/** Options for runYosys(). */
export interface YosysOptions {
  /** Path to the yosys binary. Defaults to 'yosys' (PATH lookup). */
  readonly yosysBin?: string;
  /** Module name to elaborate; if unset, Yosys uses hierarchy -auto-top. */
  readonly module?: string;
  /** Working directory for temp files. Defaults to os.tmpdir(). */
  readonly tmpDir?: string;
}

/**
 * Elaborate a Verilog source string through Yosys and return the resulting
 * JSON netlist string.
 *
 * Creates a temporary directory for the Verilog input and JSON output files,
 * runs yosys, and cleans up the temp dir on success or failure.
 *
 * @param verilogSource - Verilog source text (UTF-8).
 * @param opts          - Yosys driver options.
 * @returns The raw JSON netlist string emitted by `write_json`.
 * @throws {NetlistRenderError} with stage='yosys' if the subprocess fails.
 */
export async function runYosys(
  verilogSource: string,
  opts: YosysOptions = {},
  ctx?: ProcessContext,
): Promise<string> {
  const { yosysBin = 'yosys', tmpDir: baseTmpDir } = opts;
  const parentDir = baseTmpDir ?? tmpdir();

  // Create a unique temp directory for this invocation.
  const workDir = await mkdtemp(join(parentDir, 'scribe-yosys-'));

  const inputV = join(workDir, 'input.v');
  const outputJson = join(workDir, 'output.json');

  try {
    // Write Verilog source to temp file.
    await writeFile(inputV, verilogSource, 'utf8');

    // Build the Yosys script. Escape the file paths (simple: no spaces in
    // tmpdir on standard Unix, but we use JSON-style quoting to be safe).
    const yosysScript = [
      `read_verilog ${inputV}`,
      'hierarchy -auto-top',
      'proc',
      'opt',
      `write_json ${outputJson}`,
    ].join('; ');

    // Run Yosys.
    await spawnYosys(yosysBin, yosysScript, ctx);

    // Read JSON netlist.
    const json = await readFile(outputJson, 'utf8');
    return json;
  } finally {
    // Best-effort cleanup.
    await rm(workDir, { recursive: true, force: true }).catch(() => {/* ignore */});
  }
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Spawn yosys with the given script and wait for it to complete.
 * Captures stderr for error context.
 */
function spawnYosys(bin: string, script: string, ctx?: ProcessContext): Promise<void> {
  // ProcessContextDenied is load-bearing per #10427 — hoist outside the
  // Promise's try/catch which wraps spawn errors into NetlistRenderError.
  ensureProcessAllowed(ctx, PROCESS_SOURCE, 'spawn', bin, ['-q', '-p', script]);
  return new Promise<void>((resolve, reject) => {
    let child: ReturnType<typeof spawn>;
    try {
      child = spawn(bin, ['-q', '-p', script], {
        stdio: ['ignore', 'ignore', 'pipe'],
        shell: false,
      });
    } catch (err) {
      reject(
        new NetlistRenderError(
          `Failed to spawn yosys: ${String(err)}`,
          'yosys',
          { spawnError: String(err) },
        ),
      );
      return;
    }

    const stderrChunks: Buffer[] = [];
    child.stderr?.on('data', (chunk: Buffer) => stderrChunks.push(chunk));

    // 30-second timeout.
    const timer = setTimeout(() => {
      child.kill('SIGTERM');
      reject(
        new NetlistRenderError(
          'yosys timed out after 30 seconds',
          'yosys',
          { timeout: true },
        ),
      );
    }, 30_000);

    child.on('error', (err: Error) => {
      clearTimeout(timer);
      reject(
        new NetlistRenderError(
          `yosys process error: ${err.message}`,
          'yosys',
          { processError: err.message },
        ),
      );
    });

    child.on('close', (code: number | null) => {
      clearTimeout(timer);
      if (code === 0) {
        resolve();
      } else {
        const stderr = Buffer.concat(stderrChunks).toString('utf8').trim();
        reject(
          new NetlistRenderError(
            `yosys exited with code ${code}: ${stderr.slice(0, 500)}`,
            'yosys',
            { exitCode: code, stderr: stderr.slice(0, 2000) },
          ),
        );
      }
    });
  });
}
