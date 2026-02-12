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

// Generator
export { generate } from './generator.js';

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
  NavPage,
  LayoutOptions,
} from './renderer.js';
