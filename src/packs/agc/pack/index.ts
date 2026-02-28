/**
 * AGC Educational Pack -- barrel index.
 *
 * Re-exports all public types and functions for the AGC GSD-OS
 * integration module. This is the single import point for
 * downstream consumers of the AGC educational pack.
 *
 * Covers Phase 222 (AGC GSD-OS Integration):
 *   - Plan 01: Block definitions (AGCI-01)
 *   - Plan 02: Chipset config, rope loader, manifest (AGCI-02, AGCI-04, AGCI-05)
 *   - Plan 03: Dashboard widgets (AGCI-03)
 *   - Plan 04: Integration and barrel (this plan)
 */

// Types (Plan 01)
export type {
  BlockDefinition,
  BlockInput,
  BlockOutput,
  BlockConfig,
  WidgetDefinition,
  PackManifest,
  AgcBlockType,
  ValidationResult,
} from './types.js';

// Block definitions (Plan 01)
export {
  AGC_BLOCKS,
  getBlock,
  getBlocksByCategory,
  validateBlockDefinition,
} from './block-definitions.js';

// Widgets and render functions (Plan 03)
export {
  AGC_WIDGETS,
  getWidget,
  renderRegisterWidget,
  renderMemoryMapWidget,
  renderExecutiveWidget,
  renderDskyWidget,
  renderTelemetryWidget,
  renderInstructionTraceWidget,
} from './widgets.js';
export type {
  RegisterWidgetData,
  MemoryMapWidgetData,
  ExecutiveWidgetData,
  DskyWidgetData,
  TelemetryWidgetData,
  InstructionTraceData,
} from './widgets.js';

// Rope loader (Plan 02)
export {
  ROPE_SOURCES,
  getRopeUrl,
  locateRopeImage,
  validateRopeImage,
} from './rope-loader.js';
export type {
  RopeImageSource,
  LocateResult,
  RopeValidation,
} from './rope-loader.js';

// Pack manifest (Plan 02)
export {
  AGC_PACK_MANIFEST,
  isPackInstalled,
  getPackBlocks,
  getPackWidgets,
} from './manifest.js';
