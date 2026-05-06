/**
 * Public surface for the atlas indexer orchestrator (v1.49.607 W1 F2).
 * @module intelligence/atlas-indexer
 */

export { runAtlasIndexer } from './runner.js';
export type { AtlasIndexerOptions, AtlasIndexerResult } from './runner.js';
export { walkProjectFiles, DEFAULT_SKIP_DIR_NAMES } from './file-walker.js';
export type { WalkOptions } from './file-walker.js';
export { detectAtlasLanguage, ATLAS_EXTENSIONS } from './language-detect.js';
