/**
 * 3-tier knowledge loader with performance budgets.
 *
 * Loads cloud-ops documentation from disk organized into summary, active,
 * and reference tiers. Each tier has a token budget and timeout that are
 * enforced to prevent context window bloat and slow loads.
 *
 * Directory structure expected under basePath:
 * ```
 * docs/cloud-ops/summary/   -- always-loaded tier
 * docs/cloud-ops/active/    -- on-demand tier
 * docs/cloud-ops/reference/ -- deep-dive tier
 * ```
 *
 * @module cloud-ops/knowledge/tier-loader
 */

import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { performance } from 'node:perf_hooks';
import type { KnowledgeTier, TierContent, TierLoadResult, TierDocument } from './types.js';
import { TIER_DEFAULTS } from './types.js';

// ============================================================================
// Tier directory mapping
// ============================================================================

const TIER_DIRS: Record<KnowledgeTier, string> = {
  summary: 'docs/cloud-ops/summary',
  active: 'docs/cloud-ops/active',
  reference: 'docs/cloud-ops/reference',
};

// ============================================================================
// Token estimation
// ============================================================================

/**
 * Estimate token count from character length.
 * Uses the standard chars/4 approximation.
 */
function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

// ============================================================================
// KnowledgeTierLoader class
// ============================================================================

/**
 * Loads knowledge documents from disk organized into three tiers.
 *
 * Each tier enforces a token budget and load timeout. Documents that
 * exceed the budget are truncated. Loads that exceed the timeout fail
 * with a descriptive error.
 */
export class KnowledgeTierLoader {
  private readonly basePath: string;
  private readonly tierConfig: Record<KnowledgeTier, { maxTokens: number; timeoutMs: number }>;

  /**
   * @param basePath - Project root directory containing docs/cloud-ops/
   * @param overrides - Optional per-tier config overrides
   */
  constructor(
    basePath: string,
    overrides?: Partial<Record<KnowledgeTier, { maxTokens?: number; timeoutMs?: number }>>,
  ) {
    this.basePath = basePath;
    this.tierConfig = {
      summary: { ...TIER_DEFAULTS.summary, ...overrides?.summary },
      active: { ...TIER_DEFAULTS.active, ...overrides?.active },
      reference: { ...TIER_DEFAULTS.reference, ...overrides?.reference },
    };
  }

  /**
   * Load the summary tier (always-loaded context).
   * Reads all .md files from docs/cloud-ops/summary/.
   * Enforces 2-second timeout and 6000-token budget by default.
   */
  async loadSummaryTier(): Promise<TierLoadResult> {
    return this.loadTier('summary');
  }

  /**
   * Load the active tier (on-demand context for current work).
   * If documentIds are provided, loads only matching files.
   * Enforces 5-second timeout and 20000-token budget by default.
   */
  async loadActiveTier(documentIds?: string[]): Promise<TierLoadResult> {
    return this.loadTier('active', documentIds);
  }

  /**
   * Load specific reference documents (deep dives).
   * Always requires document IDs -- never loads all reference docs.
   * Enforces 10-second timeout and 40000-token budget by default.
   */
  async loadReferenceTier(documentIds: string[]): Promise<TierLoadResult> {
    if (!documentIds || documentIds.length === 0) {
      return {
        success: false,
        error: 'Reference tier requires document IDs (never loads all reference docs)',
      };
    }
    return this.loadTier('reference', documentIds);
  }

  // --------------------------------------------------------------------------
  // Private implementation
  // --------------------------------------------------------------------------

  private async loadTier(
    tier: KnowledgeTier,
    filter?: string[],
  ): Promise<TierLoadResult> {
    const config = this.tierConfig[tier];
    const dir = join(this.basePath, TIER_DIRS[tier]);

    try {
      const content = await this.loadDocuments(dir, filter, config.timeoutMs, tier, config.maxTokens);
      return { success: true, content };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return { success: false, error: message };
    }
  }

  private async loadDocuments(
    dir: string,
    filter: string[] | undefined,
    timeoutMs: number,
    tier: KnowledgeTier,
    maxTokens: number,
  ): Promise<TierContent> {
    const startTime = performance.now();

    // Create an abort controller for timeout enforcement
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      // Read directory listing
      let fileNames: string[];
      try {
        const entries = await readdir(dir);
        fileNames = entries.filter(f => f.endsWith('.md'));
      } catch (err) {
        // Directory doesn't exist -- return empty result
        if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
          return {
            tier,
            documents: [],
            totalTokens: 0,
            loadTimeMs: performance.now() - startTime,
          };
        }
        throw err;
      }

      // Apply filter if provided
      if (filter) {
        fileNames = fileNames.filter(f => {
          const nameWithoutExt = f.replace(/\.md$/, '');
          return filter.includes(f) || filter.includes(nameWithoutExt);
        });
      }

      // Load documents
      const documents: TierDocument[] = [];
      let totalChars = 0;

      for (const fileName of fileNames) {
        // Check timeout
        if (controller.signal.aborted) {
          throw new Error(`Timeout loading ${tier} tier (${timeoutMs}ms exceeded)`);
        }

        const filePath = join(dir, fileName);
        const content = await readFile(filePath, 'utf-8');
        const sizeBytes = Buffer.byteLength(content, 'utf-8');

        // Check if adding this document would exceed the token budget
        const currentTokens = estimateTokens(totalChars.toString().length > 0 ? documents.map(d => d.content).join('') : '');
        const docTokens = estimateTokens(content);

        if (currentTokens + docTokens > maxTokens) {
          // Truncate this document to fit within budget
          const remainingTokens = maxTokens - currentTokens;
          if (remainingTokens > 0) {
            const truncatedContent = content.slice(0, remainingTokens * 4);
            documents.push({
              path: fileName,
              content: truncatedContent,
              sizeBytes: Buffer.byteLength(truncatedContent, 'utf-8'),
            });
            totalChars += truncatedContent.length;
          }
          break; // Budget exhausted
        }

        documents.push({ path: fileName, content, sizeBytes });
        totalChars += content.length;
      }

      const loadTimeMs = performance.now() - startTime;

      return {
        tier,
        documents,
        totalTokens: estimateTokens(totalChars.toString().length > 0
          ? documents.map(d => d.content).join('')
          : ''),
        loadTimeMs,
      };
    } finally {
      clearTimeout(timeoutId);
    }
  }
}

// ============================================================================
// Standalone convenience functions
// ============================================================================

/**
 * Load the summary tier from the given project root.
 * Creates a KnowledgeTierLoader instance internally.
 */
export async function loadSummaryTier(basePath: string): Promise<TierLoadResult> {
  const loader = new KnowledgeTierLoader(basePath);
  return loader.loadSummaryTier();
}

/**
 * Load the active tier from the given project root.
 * Creates a KnowledgeTierLoader instance internally.
 */
export async function loadActiveTier(
  basePath: string,
  documentIds?: string[],
): Promise<TierLoadResult> {
  const loader = new KnowledgeTierLoader(basePath);
  return loader.loadActiveTier(documentIds);
}

/**
 * Load specific reference documents from the given project root.
 * Creates a KnowledgeTierLoader instance internally.
 */
export async function loadReferenceTier(
  basePath: string,
  documentIds: string[],
): Promise<TierLoadResult> {
  const loader = new KnowledgeTierLoader(basePath);
  return loader.loadReferenceTier(documentIds);
}
