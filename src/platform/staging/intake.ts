/**
 * Document intake for the staging pipeline.
 *
 * Saves uploaded documents to .planning/staging/inbox/ with companion
 * metadata files. Creates the staging directory structure on first use.
 *
 * @module staging/intake
 */

import { writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { ensureStagingDirectory } from './directory.js';
import { StagingMetadataSchema } from './schema.js';
import { STAGING_DIRS } from './types.js';
import type { StagingMetadata } from './types.js';

/** Result of staging a document -- paths to both created files. */
export interface StageDocumentResult {
  /** Absolute path to the saved document. */
  documentPath: string;
  /** Absolute path to the companion metadata file. */
  metadataPath: string;
}

/**
 * Stage a document into the staging inbox with companion metadata.
 *
 * Creates the staging directory structure on first use, writes the
 * document content to .planning/staging/inbox/{filename}, and writes
 * a validated companion metadata file alongside it.
 *
 * @param options.basePath - Project root (parent of .planning/)
 * @param options.filename - Name for the document file
 * @param options.content - Document content to save
 * @param options.source - Origin of the document (e.g., 'console', 'cli', 'api')
 * @returns Paths to both the document and metadata files
 */
export async function stageDocument(options: {
  basePath: string;
  filename: string;
  content: string;
  source: string;
}): Promise<StageDocumentResult> {
  // Create staging directories on first use
  await ensureStagingDirectory(options.basePath);

  // Build target paths
  const documentPath = join(options.basePath, STAGING_DIRS.inbox, options.filename);
  const metadataPath = join(options.basePath, STAGING_DIRS.inbox, `${options.filename}.meta.json`);

  // Build and validate metadata
  const metadata: StagingMetadata = {
    submitted_at: new Date().toISOString(),
    source: options.source,
    status: 'inbox' as const,
  };
  const validatedMetadata = StagingMetadataSchema.parse(metadata);

  // Write document and metadata in parallel (independent writes)
  await Promise.all([
    writeFile(documentPath, options.content, 'utf-8'),
    writeFile(metadataPath, JSON.stringify(validatedMetadata, null, 2), 'utf-8'),
  ]);

  return { documentPath, metadataPath };
}
