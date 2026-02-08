/**
 * ResearchCompressor service.
 *
 * Converts research markdown files (20-35KB) into distilled skill files (2-5KB)
 * with provenance metadata linking back to the source via content hash.
 *
 * Pipeline: parseSections() -> rankSections() -> distillContent() -> generateSkillBody()
 */

import { computeContentHash } from './types.js';

// ============================================================================
// Types
// ============================================================================

/**
 * Result of compressing a research file into a distilled skill.
 */
export interface CompressedResearch {
  /** Derived skill name (e.g., "research-caching-compressed") */
  skillName: string;

  /** Skill metadata following OfficialSkillMetadata shape */
  metadata: {
    name: string;
    description: string;
    source: 'auto-generated';
    metadata: {
      extensions: {
        'gsd-skill-creator': {
          generatedFrom: {
            file: string;
            contentHash: string;
            compressedAt: string;
          };
        };
      };
    };
  };

  /** Distilled markdown content */
  body: string;

  /** Size of original research content in bytes */
  originalSize: number;

  /** Size of compressed skill output in bytes */
  compressedSize: number;
}

/**
 * Options for controlling compression behavior.
 */
export interface CompressionOptions {
  /** Maximum output body size in bytes (default: 5000) */
  maxOutputBytes?: number;

  /** Ordered list of section headings to prioritize (lower index = higher priority) */
  sectionPriority?: string[];
}

/** Default section priority order */
const DEFAULT_PRIORITY: string[] = [
  'Key Findings',
  'Decisions',
  'Recommendations',
  'Architecture',
  'Patterns',
  'API',
  'Configuration',
];

// ============================================================================
// Service
// ============================================================================

/**
 * Compresses research markdown into distilled skill files with metadata tracking.
 */
export class ResearchCompressor {
  /**
   * Compress a research file into a distilled skill.
   *
   * @param filePath - Original file path (for metadata tracking)
   * @param content - Raw markdown content of the research file
   * @param options - Compression options
   * @returns CompressedResearch with distilled content and provenance metadata
   */
  compress(
    _filePath: string,
    _content: string,
    _options?: CompressionOptions
  ): CompressedResearch {
    // STUB: will be implemented in Task 2
    throw new Error('Not implemented');
  }
}
