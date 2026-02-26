/**
 * Top-level extraction orchestrator using pdftotext -layout.
 * Stub — implementation in Task 2.
 */

import type { ExtractionConfig } from '../types.js';
import type { ExtractionResult } from './types.js';

export async function extractPdf(
  _config: Partial<ExtractionConfig> & { sourcePath: string }
): Promise<ExtractionResult> {
  throw new Error('Not implemented');
}
