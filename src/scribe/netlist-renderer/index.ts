/**
 * SCRIBE Yosys netlist renderer — public API.
 *
 * Full-fidelity Yosys-driven netlist rendering pipeline:
 *
 *   Verilog source
 *     │  yosys -q -p "read_verilog ...; hierarchy -auto-top; proc; opt; write_json ..."
 *     ▼
 *   Yosys JSON netlist
 *     │  netlistsvg <input.json> -o <output.svg>
 *     ▼
 *   Raw SVG (no a11y, no SCRIBE namespace)
 *     │  post-process: inject namespace + a11y + <scribe:graph> metadata + SVGO
 *     ▼
 *   SCRIBE-conformant SVG string
 *
 * When Yosys or netlistsvg is unavailable, `renderNetlist()` throws
 * `NetlistRenderError`. The cartridge-level `render.ts` wrapper catches this
 * and falls back to the shipped simplified-path SVG.
 *
 * CAP-018 hardening: full-fidelity Yosys-driven netlist rendering.
 *
 * @module scribe/netlist-renderer
 */

export { isAvailable, type AvailabilityResult } from './available.js';
export { postProcessNetlistSvg, sha256Hex, type PostProcessOptions } from './post-process.js';
export { runYosys, type YosysOptions } from './yosys-driver.js';
export { runNetlistsvg, type NetlistsvgOptions } from './netlistsvg-driver.js';

import { isAvailable } from './available.js';
import { runYosys } from './yosys-driver.js';
import { runNetlistsvg } from './netlistsvg-driver.js';
import { postProcessNetlistSvg, sha256Hex } from './post-process.js';
import { NetlistRenderError } from '../types/errors.js';

// ---------------------------------------------------------------------------
// Public API types
// ---------------------------------------------------------------------------

/**
 * Options for the `renderNetlist()` entry point.
 */
export interface RenderOpts {
  /** Yosys binary path. Defaults to 'yosys' (PATH lookup). */
  readonly yosysBin?: string;
  /** netlistsvg binary path. Defaults to 'netlistsvg' (PATH lookup). */
  readonly netlistsvgBin?: string;
  /** Module name to elaborate. If unset, Yosys uses `-auto-top`. */
  readonly module?: string;
  /** Working directory for temp files. Defaults to os.tmpdir(). */
  readonly tmpDir?: string;
  /**
   * When true, post-process the SVG to inject SCRIBE namespace + a11y.
   * Defaults to true.
   */
  readonly postProcess?: boolean;
  /**
   * DOMParser constructor for round-trip validation in Node.js.
   * Pass `new JSDOM('').window.DOMParser` or equivalent.
   * If omitted, round-trip checks are skipped (a11y BLOCKER checks still run).
   */
  readonly domParserCtor?: { new(): Pick<DOMParser, 'parseFromString'> };
}

// ---------------------------------------------------------------------------
// Main entry point
// ---------------------------------------------------------------------------

/**
 * Render a Verilog source string through the full Yosys → netlistsvg →
 * SCRIBE post-process pipeline and return the resulting SVG string.
 *
 * @param verilogSource - Verilog source text (UTF-8).
 * @param opts          - Render options.
 * @returns SCRIBE-conformant SVG string.
 *
 * @throws {NetlistRenderError} with stage='yosys'      if yosys fails or is not found.
 * @throws {NetlistRenderError} with stage='netlistsvg' if netlistsvg fails or is not found.
 * @throws {NetlistRenderError} with stage='post-process' if a11y validation fails.
 */
export async function renderNetlist(
  verilogSource: string,
  opts: RenderOpts = {},
): Promise<string> {
  const {
    yosysBin = 'yosys',
    netlistsvgBin = 'netlistsvg',
    module: moduleName,
    tmpDir,
    postProcess = true,
    domParserCtor,
  } = opts;

  // Check availability first. Use the cached result.
  const probe = await isAvailable(yosysBin, netlistsvgBin);

  if (!probe.yosys) {
    throw new NetlistRenderError(
      `yosys not available: ${probe.reason ?? 'not found'}`,
      'yosys',
      { reason: 'yosys-not-found', probe },
    );
  }

  if (!probe.netlistsvg) {
    throw new NetlistRenderError(
      `netlistsvg not available: ${probe.reason ?? 'not found'}`,
      'netlistsvg',
      { reason: 'netlistsvg-not-found', probe },
    );
  }

  // Step 1: Yosys elaboration.
  const jsonNetlist = await runYosys(verilogSource, {
    yosysBin,
    module: moduleName,
    tmpDir,
  });

  // Step 2: netlistsvg rendering.
  const rawSvg = await runNetlistsvg(jsonNetlist, {
    netlistsvgBin,
    tmpDir,
  });

  // Step 3: Post-process (SCRIBE namespace + a11y + metadata).
  if (!postProcess) {
    return rawSvg;
  }

  const resolvedModule = moduleName ?? extractFirstModuleName(verilogSource) ?? 'module';
  const sourceSha = sha256Hex(verilogSource);
  const sourcePath = `${resolvedModule}.v`;

  return postProcessNetlistSvg(rawSvg, {
    moduleName: resolvedModule,
    sourceSha,
    sourcePath,
    domParserCtor,
  });
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Extract the first module name from a Verilog source string.
 * Uses a simple regex — sufficient for the toy-scope examples.
 */
function extractFirstModuleName(verilog: string): string | undefined {
  const match = verilog.match(/\bmodule\s+([a-zA-Z_][a-zA-Z0-9_$]*)\s*[#(;]/);
  return match?.[1];
}
