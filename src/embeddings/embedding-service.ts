/**
 * Main embedding service with HuggingFace integration, caching, and graceful fallback.
 *
 * This service provides a clean API for generating embeddings while handling
 * all the complexity: lazy model loading, caching, progress feedback, and
 * automatic fallback to heuristics when the model is unavailable.
 *
 * Features:
 * - Singleton pattern with lazy initialization
 * - Automatic caching with content-hash invalidation
 * - Graceful fallback to TF-IDF heuristics
 * - Progress feedback during model download
 * - Batch embedding support
 */

import type { FeatureExtractionPipeline, Tensor } from '@huggingface/transformers';
import type {
  EmbeddingVector,
  EmbeddingServiceConfig,
  ProgressInfo,
  EmbeddingResult,
} from '../types/embeddings.js';
import { EmbeddingCache } from './embedding-cache.js';
import { HeuristicEmbedder } from './heuristic-fallback.js';

/** Default model ID for embeddings */
const DEFAULT_MODEL_ID = 'Xenova/bge-small-en-v1.5';

/** Model version for cache invalidation - increment when model changes */
const MODEL_VERSION = 'bge-small-en-v1.5-v1';

/** Expected embedding dimension for BGE-small */
const EMBEDDING_DIM = 384;

/**
 * Main embedding service with singleton pattern.
 *
 * Use `getInstance()` to get the shared instance, or `createFresh()` for testing.
 * The model is lazily loaded on first use to avoid blocking CLI startup.
 */
export class EmbeddingService {
  private static instance: EmbeddingService | null = null;

  private embeddingPipeline: FeatureExtractionPipeline | null = null;
  private cache: EmbeddingCache;
  private heuristic: HeuristicEmbedder;
  private fallbackMode = false;
  private initialized = false;
  private initPromise: Promise<void> | null = null;
  private config: EmbeddingServiceConfig;

  private readonly modelId = DEFAULT_MODEL_ID;
  private readonly modelVersion = MODEL_VERSION;

  /**
   * Private constructor - use getInstance() or createFresh().
   */
  private constructor(config: EmbeddingServiceConfig = {}) {
    this.config = config;
    this.cache = new EmbeddingCache(this.modelVersion, config.cacheDir);
    this.heuristic = new HeuristicEmbedder(EMBEDDING_DIM);

    // If explicitly disabled, enter fallback mode immediately
    if (config.enabled === false) {
      this.fallbackMode = true;
      this.initialized = true;
    }
  }

  /**
   * Get the singleton instance of the embedding service.
   * Creates a new instance on first call.
   *
   * @param config - Optional configuration (only used on first call)
   */
  static getInstance(config?: EmbeddingServiceConfig): EmbeddingService {
    if (!EmbeddingService.instance) {
      EmbeddingService.instance = new EmbeddingService(config);
    }
    return EmbeddingService.instance;
  }

  /**
   * Create a fresh, non-singleton instance.
   * Useful for testing to avoid shared state.
   *
   * @param config - Configuration options
   */
  static createFresh(config?: EmbeddingServiceConfig): EmbeddingService {
    return new EmbeddingService(config);
  }

  /**
   * Reset the singleton instance.
   * Useful for testing to ensure clean state between tests.
   */
  static resetInstance(): void {
    EmbeddingService.instance = null;
  }

  /**
   * Initialize the service (load model and cache).
   *
   * This is called automatically on first embed() call, but can be called
   * explicitly to trigger model download with progress feedback.
   *
   * @param progressCallback - Called during model download with progress info
   */
  async init(progressCallback?: (info: ProgressInfo) => void): Promise<void> {
    // If already initialized, return immediately
    if (this.initialized) {
      return;
    }

    // If initialization is in progress, wait for it
    if (this.initPromise) {
      return this.initPromise;
    }

    // Start initialization
    this.initPromise = this.doInit(progressCallback);
    await this.initPromise;
    this.initPromise = null;
  }

  /**
   * Internal initialization logic.
   */
  private async doInit(progressCallback?: (info: ProgressInfo) => void): Promise<void> {
    // Load cache from disk
    await this.cache.load();

    // If already in fallback mode (from config), skip model loading
    if (this.fallbackMode) {
      this.initialized = true;
      return;
    }

    try {
      // Create a wrapper callback that shows user-friendly messages
      const wrappedCallback = progressCallback
        ? this.wrapProgressCallback(progressCallback)
        : undefined;

      // Load the embedding model
      // Dynamic import with type assertion to avoid complex union type issues
      // in @huggingface/transformers (see: https://github.com/huggingface/transformers.js/issues)
      const transformers = (await import('@huggingface/transformers')) as {
        pipeline: (
          task: string,
          model: string,
          options?: { progress_callback?: (info: ProgressInfo) => void }
        ) => Promise<FeatureExtractionPipeline>;
      };
      this.embeddingPipeline = await transformers.pipeline(
        'feature-extraction',
        this.modelId,
        { progress_callback: wrappedCallback }
      );

      this.initialized = true;
    } catch (error) {
      // Model failed to load - enter fallback mode
      console.warn('Embedding model unavailable, using heuristic analysis');
      this.fallbackMode = true;
      this.initialized = true;
    }
  }

  /**
   * Wrap a progress callback to provide user-friendly messages.
   */
  private wrapProgressCallback(
    callback: (info: ProgressInfo) => void
  ): (info: ProgressInfo) => void {
    let downloadStarted = false;

    return (info: ProgressInfo) => {
      // Show download message once when download starts
      if (info.status === 'download' && !downloadStarted) {
        downloadStarted = true;
        console.log('Downloading embedding model (33MB)...');
      }

      // Pass through to user callback
      callback(info);
    };
  }

  /**
   * Generate embedding for a single text.
   *
   * @param text - Text to embed
   * @param skillName - Optional skill name to enable caching
   * @returns Embedding result with vector and metadata
   */
  async embed(text: string, skillName?: string): Promise<EmbeddingResult> {
    // Ensure initialized
    if (!this.initialized) {
      await this.init();
    }

    // Check cache if skillName provided
    if (skillName) {
      const cached = this.cache.get(skillName, text);
      if (cached) {
        return {
          embedding: cached,
          fromCache: true,
          method: this.fallbackMode ? 'heuristic' : 'model',
        };
      }
    }

    // Generate embedding
    let embedding: EmbeddingVector;
    let method: 'model' | 'heuristic';

    if (this.fallbackMode || !this.embeddingPipeline) {
      // Use heuristic fallback
      embedding = this.heuristic.embed(text);
      method = 'heuristic';
    } else {
      try {
        // Use transformer model
        const output = await this.embeddingPipeline(text, {
          pooling: 'mean',
          normalize: true,
        }) as Tensor;

        embedding = Array.from(output.data as Float32Array);
        method = 'model';
      } catch (error) {
        // On any error, return heuristic result (never throw to caller)
        embedding = this.heuristic.embed(text);
        method = 'heuristic';
      }
    }

    // Cache result if skillName provided
    if (skillName) {
      this.cache.set(skillName, text, embedding);
    }

    return {
      embedding,
      fromCache: false,
      method,
    };
  }

  /**
   * Generate embeddings for multiple texts.
   *
   * Uses batch processing for efficiency when using the transformer model.
   *
   * @param texts - Array of texts to embed
   * @param skillNames - Optional array of skill names for caching (must match texts length)
   * @returns Array of embedding results
   */
  async embedBatch(texts: string[], skillNames?: string[]): Promise<EmbeddingResult[]> {
    // Ensure initialized
    if (!this.initialized) {
      await this.init();
    }

    // Validate skillNames length if provided
    if (skillNames && skillNames.length !== texts.length) {
      throw new Error('skillNames array must match texts array length');
    }

    // Check cache for all texts
    const results: (EmbeddingResult | null)[] = new Array(texts.length).fill(null);
    const textsToEmbed: { index: number; text: string }[] = [];

    for (let i = 0; i < texts.length; i++) {
      const skillName = skillNames?.[i];
      if (skillName) {
        const cached = this.cache.get(skillName, texts[i]);
        if (cached) {
          results[i] = {
            embedding: cached,
            fromCache: true,
            method: this.fallbackMode ? 'heuristic' : 'model',
          };
          continue;
        }
      }
      textsToEmbed.push({ index: i, text: texts[i] });
    }

    // If all results are cached, return early
    if (textsToEmbed.length === 0) {
      return results as EmbeddingResult[];
    }

    // Generate embeddings for non-cached texts
    let embeddings: EmbeddingVector[];
    let method: 'model' | 'heuristic';

    if (this.fallbackMode || !this.embeddingPipeline) {
      // Use heuristic fallback for all
      embeddings = textsToEmbed.map((t) => this.heuristic.embed(t.text));
      method = 'heuristic';
    } else {
      try {
        // Use transformer model with batch processing
        const batchTexts = textsToEmbed.map((t) => t.text);
        const output = await this.embeddingPipeline(batchTexts, {
          pooling: 'mean',
          normalize: true,
        }) as Tensor;

        // Reshape output: dims = [batch_size, embedding_dim]
        const data = output.data as Float32Array;
        const embeddingDim = output.dims[1];
        embeddings = [];

        for (let i = 0; i < batchTexts.length; i++) {
          embeddings.push(
            Array.from(data.slice(i * embeddingDim, (i + 1) * embeddingDim))
          );
        }
        method = 'model';
      } catch (error) {
        // On any error, fall back to heuristic for all
        embeddings = textsToEmbed.map((t) => this.heuristic.embed(t.text));
        method = 'heuristic';
      }
    }

    // Fill in results and cache
    for (let i = 0; i < textsToEmbed.length; i++) {
      const { index, text } = textsToEmbed[i];
      const embedding = embeddings[i];
      const skillName = skillNames?.[index];

      // Cache if skillName provided
      if (skillName) {
        this.cache.set(skillName, text, embedding);
      }

      results[index] = {
        embedding,
        fromCache: false,
        method,
      };
    }

    return results as EmbeddingResult[];
  }

  /**
   * Get or compute embedding with automatic caching.
   *
   * This is the preferred method when you have a skill name.
   * It automatically handles cache lookup and storage.
   *
   * @param skillName - Skill name for cache key
   * @param content - Content to embed
   * @returns Embedding result
   */
  async getOrCompute(skillName: string, content: string): Promise<EmbeddingResult> {
    return this.embed(content, skillName);
  }

  /**
   * Check if the service is using fallback (heuristic) mode.
   */
  isUsingFallback(): boolean {
    return this.fallbackMode;
  }

  /**
   * Attempt to reload the model after being in fallback mode.
   *
   * @returns true if model loaded successfully, false if still in fallback
   */
  async reloadModel(): Promise<boolean> {
    // Reset state
    this.fallbackMode = false;
    this.initialized = false;
    this.embeddingPipeline = null;
    this.initPromise = null;

    // Re-initialize
    await this.init();

    return !this.fallbackMode;
  }

  /**
   * Save the cache to disk.
   *
   * Normally the cache is saved automatically after modifications,
   * but this can be called explicitly to ensure persistence.
   */
  async saveCache(): Promise<void> {
    await this.cache.save();
  }

  /**
   * Get the current service status.
   */
  getStatus(): {
    initialized: boolean;
    fallbackMode: boolean;
    cacheStats: { entries: number; modelId: string; version: string };
  } {
    return {
      initialized: this.initialized,
      fallbackMode: this.fallbackMode,
      cacheStats: this.cache.getStats(),
    };
  }
}

/**
 * Factory function to get an initialized embedding service.
 *
 * This is a convenience function that gets the singleton instance
 * and ensures it's initialized.
 *
 * @param config - Optional configuration
 * @returns Initialized embedding service
 */
export async function getEmbeddingService(
  config?: EmbeddingServiceConfig
): Promise<EmbeddingService> {
  const service = EmbeddingService.getInstance(config);
  await service.init();
  return service;
}
