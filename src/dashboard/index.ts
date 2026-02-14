/**
 * Dashboard module barrel exports.
 *
 * Re-exports all public API from the dashboard subsystem:
 * parser, renderer, styles, generator, and types.
 */

// Parser
export {
  parsePlanningDir,
  parseProjectMd,
  parseRequirementsMd,
  parseRoadmapMd,
  parseStateMd,
  parseMilestonesMd,
  parseMarkdownSections,
  parseMarkdownTable,
} from './parser.js';

// Renderer
export {
  renderLayout,
  renderNav,
  escapeHtml,
  escapeAttr,
} from './renderer.js';

// Styles
export { renderStyles } from './styles.js';

// Design System
export { renderDesignSystem } from './design-system.js';

// Generator
export { generate } from './generator.js';

// Incremental builds
export {
  computeHash,
  loadManifest,
  saveManifest,
  needsRegeneration,
  MANIFEST_FILENAME,
} from './incremental.js';

// Auto-refresh
export { generateRefreshScript } from './refresh.js';

// Structured Data (JSON-LD)
export {
  generateProjectJsonLd,
  generateMilestonesJsonLd,
  generateRoadmapJsonLd,
} from './structured-data.js';

// Pages
export { renderRequirementsPage } from './pages/requirements.js';
export { renderRoadmapPage } from './pages/roadmap.js';
export { renderMilestonesPage } from './pages/milestones.js';
export { renderStatePage } from './pages/state.js';

// Types
export type {
  DashboardData,
  ProjectData,
  RequirementsData,
  RequirementGroup,
  Requirement,
  RoadmapData,
  Phase,
  StateData,
  MilestoneData,
  MilestonesData,
  Section,
  TableRow,
} from './types.js';

export type {
  GenerateOptions,
  GenerateResult,
} from './generator.js';

export type {
  BuildManifest,
  ManifestEntry,
} from './incremental.js';

export type {
  NavPage,
  LayoutOptions,
} from './renderer.js';
