/**
 * GSD State Reading Module
 *
 * Provides parsing and assembly of .planning/ artifacts into typed
 * ProjectState objects. Entry point for plans 37-01 and 37-02.
 */

// Type schemas and inferred types
export {
  PhaseInfoSchema,
  PlanInfoSchema,
  ParsedRoadmapSchema,
  CurrentPositionSchema,
  ParsedStateSchema,
  ParsedProjectSchema,
  GsdConfigSchema,
  ProjectStateSchema,
  readFileSafe,
} from './types.js';
export type {
  PhaseInfo,
  PlanInfo,
  ParsedRoadmap,
  CurrentPosition,
  ParsedState,
  ParsedProject,
  GsdConfig,
  ProjectState,
} from './types.js';

// Individual parsers
export { parseRoadmap } from './roadmap-parser.js';
export { parseState } from './state-parser.js';
export { parseProject } from './project-parser.js';
export { parseConfig } from './config-reader.js';

// State reader service
export { ProjectStateReader } from './state-reader.js';
