/**
 * GSD Discovery Module
 *
 * Provides filesystem-based discovery of GSD commands, agents, and teams.
 * Entry point for plans 36-01 through 36-03.
 */

// Type schemas and inferred types
export {
  GsdCommandMetadataSchema,
  GsdAgentMetadataSchema,
  GsdTeamMetadataSchema,
  DiscoveryResultSchema,
} from './types.js';
export type {
  GsdCommandMetadata,
  GsdAgentMetadata,
  GsdTeamMetadata,
  DiscoveryResult,
  GsdLocation,
  DiscoveryWarning,
} from './types.js';

// Command file parser
export { parseCommandFile, extractFirstTag } from './command-parser.js';

// Filesystem scanner
export { scanDirectory, scanDirectoryForDirs } from './scanner.js';

// Agent file parser
export { parseAgentFile } from './agent-parser.js';

// Team config parser
export { parseTeamConfig } from './team-parser.js';

// Discovery service
export {
  GsdDiscoveryService,
  detectGsdInstallation,
  createDiscoveryService,
} from './discovery-service.js';
