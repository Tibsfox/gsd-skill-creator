/**
 * Cartridge netlist-to-svg render wrapper.
 *
 * Thin wrapper around `src/scribe/netlist-renderer` providing the cartridge's
 * public entry point.
 *
 * When Yosys + netlistsvg are available: returns the full-fidelity
 * Yosys-elaborated, SCRIBE-conformant SVG.
 *
 * When Yosys or netlistsvg is unavailable (the common case for environments
 * without Yosys installed): falls back to reading the pre-rendered
 * simplified-path SVG file shipped with the cartridge.
 *
 * Yosys install instructions:
 *   Ubuntu/Debian: sudo apt install yosys
 *   macOS (Homebrew): brew install yosys
 *   netlistsvg: npm install -g netlistsvg
 *
 * See also: `netlist-render.md` design doc, `README.md` for more context.
 *
 * @module code-svg-hdl-bridge/netlist-to-svg/render
 */

import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

import {
  renderNetlist,
  isAvailable,
  type RenderOpts,
} from '../../../../src/scribe/netlist-renderer/index.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

/** The three example module names shipped with this cartridge. */
export type ExampleName = 'add' | 'xor1' | 'mux';

/**
 * Render a Verilog source string to a SCRIBE-conformant SVG string.
 *
 * When Yosys and netlistsvg are available in PATH, produces a full-fidelity
 * Yosys-elaborated SVG. Otherwise falls back to the pre-rendered
 * simplified-path SVG for the named example.
 *
 * @param verilogSource - Verilog source text (UTF-8).
 * @param exampleName   - Which of the 3 cartridge examples this corresponds to
 *                        (used for the fallback file lookup).
 * @param opts          - Optional render options forwarded to `renderNetlist()`.
 * @returns SVG string (either full-fidelity or simplified fallback).
 */
export async function renderOrFallback(
  verilogSource: string,
  exampleName: ExampleName,
  opts?: Omit<RenderOpts, 'module'>,
): Promise<string> {
  const probe = await isAvailable(
    opts?.yosysBin ?? 'yosys',
    opts?.netlistsvgBin ?? 'netlistsvg',
  );

  if (probe.yosys && probe.netlistsvg) {
    return renderNetlist(verilogSource, {
      ...opts,
      module: exampleName,
    });
  }

  // Fallback: read the pre-rendered simplified-path SVG.
  const fallbackPath = resolve(__dirname, `${exampleName}-netlist.svg`);
  return readFile(fallbackPath, 'utf8');
}

/**
 * Return a human-readable availability report.
 * Useful for debugging why the fallback path is active.
 */
export async function availabilityReport(): Promise<string> {
  const probe = await isAvailable();
  if (probe.yosys && probe.netlistsvg) {
    return 'Full-fidelity path active: yosys and netlistsvg both available.';
  }
  return `Simplified-path fallback active. ${probe.reason ?? 'yosys or netlistsvg not found.'}`;
}
