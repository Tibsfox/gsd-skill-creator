/**
 * SCRIBE Yosys netlist renderer — netlistsvg subprocess driver.
 *
 * Wraps the `netlistsvg` binary. Accepts a Yosys JSON netlist string, writes
 * it to a temp file, runs netlistsvg to produce an SVG, reads the resulting
 * SVG, and returns it as a string.
 *
 * Subprocess command:
 *   netlistsvg <tmpInputJson> -o <tmpOutputSvg>
 *
 * @module scribe/netlist-renderer/netlistsvg-driver
 */

import { spawn } from 'node:child_process';
import { writeFile, readFile, mkdtemp, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

import { NetlistRenderError } from '../types/errors.js';
import { ensureProcessAllowed, type ProcessContext } from '../../security/process-context.js';

const PROCESS_SOURCE = 'scribe/netlist-renderer/netlistsvg-driver';

/** Options for runNetlistsvg(). */
export interface NetlistsvgOptions {
  /** Path to the netlistsvg binary. Defaults to 'netlistsvg' (PATH lookup). */
  readonly netlistsvgBin?: string;
  /** Working directory for temp files. Defaults to os.tmpdir(). */
  readonly tmpDir?: string;
}

/**
 * Convert a Yosys JSON netlist string to an SVG string via `netlistsvg`.
 *
 * Creates a temporary directory for input/output files, runs netlistsvg,
 * and cleans up on success or failure.
 *
 * @param jsonNetlist - Raw JSON string from Yosys `write_json`.
 * @param opts        - netlistsvg driver options.
 * @returns The raw SVG string emitted by netlistsvg (before post-processing).
 * @throws {NetlistRenderError} with stage='netlistsvg' if the subprocess fails.
 */
export async function runNetlistsvg(
  jsonNetlist: string,
  opts: NetlistsvgOptions = {},
  ctx?: ProcessContext,
): Promise<string> {
  const { netlistsvgBin = 'netlistsvg', tmpDir: baseTmpDir } = opts;
  const parentDir = baseTmpDir ?? tmpdir();

  // Create a unique temp directory for this invocation.
  const workDir = await mkdtemp(join(parentDir, 'scribe-netlistsvg-'));

  const inputJson = join(workDir, 'input.json');
  const outputSvg = join(workDir, 'output.svg');

  try {
    // Write JSON netlist to temp file.
    await writeFile(inputJson, jsonNetlist, 'utf8');

    // Run netlistsvg.
    await spawnNetlistsvg(netlistsvgBin, inputJson, outputSvg, ctx);

    // Read SVG output.
    const svg = await readFile(outputSvg, 'utf8');
    if (!svg.trim()) {
      throw new NetlistRenderError(
        'netlistsvg produced empty output',
        'netlistsvg',
        { outputPath: outputSvg },
      );
    }
    return svg;
  } finally {
    // Best-effort cleanup.
    await rm(workDir, { recursive: true, force: true }).catch(() => {/* ignore */});
  }
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Spawn netlistsvg and wait for completion. Captures stderr for error context.
 */
function spawnNetlistsvg(
  bin: string,
  inputJson: string,
  outputSvg: string,
  ctx?: ProcessContext,
): Promise<void> {
  // ProcessContextDenied is load-bearing per #10427 — hoist outside the
  // Promise's try/catch which wraps spawn errors into NetlistRenderError.
  ensureProcessAllowed(ctx, PROCESS_SOURCE, 'spawn', bin, [inputJson, '-o', outputSvg]);
  return new Promise<void>((resolve, reject) => {
    let child: ReturnType<typeof spawn>;
    try {
      child = spawn(bin, [inputJson, '-o', outputSvg], {
        stdio: ['ignore', 'ignore', 'pipe'],
        shell: false,
      });
    } catch (err) {
      reject(
        new NetlistRenderError(
          `Failed to spawn netlistsvg: ${String(err)}`,
          'netlistsvg',
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
          'netlistsvg timed out after 30 seconds',
          'netlistsvg',
          { timeout: true },
        ),
      );
    }, 30_000);

    child.on('error', (err: Error) => {
      clearTimeout(timer);
      reject(
        new NetlistRenderError(
          `netlistsvg process error: ${err.message}`,
          'netlistsvg',
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
            `netlistsvg exited with code ${code}: ${stderr.slice(0, 500)}`,
            'netlistsvg',
            { exitCode: code, stderr: stderr.slice(0, 2000) },
          ),
        );
      }
    });
  });
}
