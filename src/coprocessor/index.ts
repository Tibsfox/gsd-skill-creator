/**
 * @module coprocessor
 *
 * Entry point for the math coprocessor runtime. Provides a typed TS client
 * for the Python MCP server at `coprocessors/math/` along with a skill
 * activation hook.
 *
 * Usage:
 * ```ts
 * import { CoprocessorClient } from 'gsd-skill-creator/coprocessor';
 *
 * const client = new CoprocessorClient();
 * await client.connect();
 * const result = await client.gemm({ a: [[1,2],[3,4]], b: [[5,6],[7,8]] });
 * await client.disconnect();
 * ```
 */

export { CoprocessorClient } from './client.js';
export {
  activateCoprocessor,
  getSharedClient,
  parseCoprocessorSpec,
  shutdownSharedClient,
} from './activation.js';
export type {
  CapabilitiesReport,
  ChipName,
  CoprocessorActivationSpec,
  CoprocessorClientOptions,
  CoprocessorTransportConfig,
  Precision,
  ToolName,
  ToolResult,
  ToolResultMeta,
  VramReport,
} from './types.js';
