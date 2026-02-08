/**
 * Intent Classifier pipeline assembling all classification stages.
 *
 * Wires the complete 6-stage pipeline:
 * 1. Exact match (/gsd:command detection)
 * 2. Lifecycle filtering (stage-relevant command narrowing)
 * 3. Bayes classification (natural language to command)
 * 3.5. Semantic fallback (embedding similarity when Bayes is weak)
 * 4. Confidence resolution (threshold + gap analysis)
 * 5. Argument extraction (structured args from input)
 *
 * Includes circular invocation guard to prevent re-entrant classify() calls.
 * Configurable via ClassifierConfig (confidence threshold, ambiguity gap, max alternatives,
 * semantic threshold, enable semantic).
 */

import type { GsdCommandMetadata, DiscoveryResult } from '../discovery/types.js';
import type { ProjectState } from '../state/types.js';
import type { ClassificationResult, ClassifierConfig, ExtractedArguments } from './types.js';
import { ClassifierConfigSchema } from './types.js';
import { exactMatch } from './exact-match.js';
import { GsdBayesClassifier } from './bayes-classifier.js';
import { deriveLifecycleStage, filterByLifecycle } from './lifecycle-filter.js';
import { extractArguments } from './argument-extractor.js';
import { SemanticMatcher } from './semantic-matcher.js';

// ============================================================================
// Empty Result Helpers
// ============================================================================

/** Default empty arguments for results where extraction is not applicable */
function emptyArguments(raw: string): ExtractedArguments {
  return {
    phaseNumber: null,
    flags: [],
    description: null,
    version: null,
    profile: null,
    raw,
  };
}

/** Build a no-match result */
function noMatchResult(input: string, lifecycleStage: ClassificationResult['lifecycleStage'] = null): ClassificationResult {
  return {
    type: 'no-match',
    command: null,
    confidence: 0,
    arguments: emptyArguments(input),
    alternatives: [],
    lifecycleStage,
  };
}

// ============================================================================
// IntentClassifier
// ============================================================================

/**
 * Main intent classification pipeline.
 *
 * Call initialize() once with a DiscoveryResult to load commands and
 * train the Bayes classifier. Then call classify() for each user input.
 *
 * When `enableSemantic` is true (the default), initialize() attempts to
 * create and initialize a SemanticMatcher for embedding-based fallback.
 * If embeddings are unavailable (e.g., the library isn't installed),
 * initialization silently degrades to Bayes-only classification.
 *
 * The SemanticMatcher can also be injected manually via setSemanticMatcher()
 * for test flexibility.
 *
 * @example
 * ```ts
 * const classifier = new IntentClassifier();
 * await classifier.initialize(discoveryResult);
 *
 * const result = await classifier.classify('/gsd:plan-phase 3', projectState);
 * // => { type: 'exact-match', command: {...}, confidence: 1.0, method: 'exact', ... }
 *
 * const result2 = await classifier.classify('plan the next phase', projectState);
 * // => { type: 'classified', command: {...}, confidence: 0.72, method: 'bayes', ... }
 * ```
 */
export class IntentClassifier {
  private bayesClassifier: GsdBayesClassifier;
  private commands: GsdCommandMetadata[] = [];
  private config: ClassifierConfig;
  private isClassifying: boolean = false;
  private semanticMatcher: SemanticMatcher | null = null;

  constructor(config?: Partial<ClassifierConfig>) {
    this.bayesClassifier = new GsdBayesClassifier();
    // Parse config through Zod to apply defaults
    this.config = ClassifierConfigSchema.parse(config ?? {});
  }

  /**
   * Initialize with discovered commands.
   *
   * Stores commands for exact match lookup and trains the Bayes
   * classifier on augmented utterances. When `enableSemantic` is true
   * (default from config), attempts to create and initialize a
   * SemanticMatcher inside a try/catch. If EmbeddingService is
   * unavailable or initialization fails, semantic matching is silently
   * disabled and Bayes-only classification continues.
   *
   * @param discovery - DiscoveryResult from GsdDiscoveryService
   * @param options - Optional overrides for semantic initialization
   */
  async initialize(
    discovery: DiscoveryResult,
    options?: { enableSemantic?: boolean },
  ): Promise<void> {
    this.commands = discovery.commands;
    this.bayesClassifier.train(discovery.commands);

    // Semantic matcher initialization (extension-gated)
    const shouldEnableSemantic = options?.enableSemantic ?? this.config.enableSemantic;
    if (shouldEnableSemantic) {
      try {
        const matcher = new SemanticMatcher();
        await matcher.initialize(discovery.commands);
        this.semanticMatcher = matcher;
      } catch {
        // EmbeddingService not available -- degrade to Bayes-only
        this.semanticMatcher = null;
      }
    }
  }

  /**
   * Set the semantic matcher for embedding-based fallback.
   *
   * The matcher should already be initialized with command embeddings.
   * When set, low-confidence Bayes results trigger semantic matching.
   *
   * @param matcher - Initialized SemanticMatcher instance
   */
  setSemanticMatcher(matcher: SemanticMatcher): void {
    this.semanticMatcher = matcher;
  }

  /**
   * Full classification pipeline (async).
   *
   * Stages:
   * 1. Circular invocation guard
   * 2. Exact match (bypasses lifecycle filter)
   * 3. Lifecycle filtering
   * 4. Bayes classification
   * 3.5. Semantic fallback (when Bayes confidence is below threshold)
   * 5. Confidence resolution (threshold + gap analysis)
   * 6. Argument extraction
   *
   * @param input - Raw user input string
   * @param state - Current ProjectState for lifecycle context
   * @returns Complete ClassificationResult
   */
  async classify(input: string, state: ProjectState): Promise<ClassificationResult> {
    // ---- Guard: circular invocation ----
    if (this.isClassifying) {
      return noMatchResult(input);
    }

    this.isClassifying = true;
    try {
      return await this.classifyInternal(input, state);
    } finally {
      this.isClassifying = false;
    }
  }

  // --------------------------------------------------------------------------
  // Internal Pipeline
  // --------------------------------------------------------------------------

  private async classifyInternal(input: string, state: ProjectState): Promise<ClassificationResult> {
    const trimmed = input.trim();

    // ---- Empty input ----
    if (!trimmed) {
      return noMatchResult(input);
    }

    // ---- Stage 1: Exact match ----
    const exact = exactMatch(trimmed, this.commands);
    if (exact) {
      const args = extractArguments(exact.rawArgs);
      return {
        type: 'exact-match',
        command: exact.command,
        confidence: 1.0,
        arguments: args,
        alternatives: [],
        lifecycleStage: null,
        method: 'exact',
      };
    }

    // ---- Stage 2: Lifecycle filtering ----
    const lifecycleStage = deriveLifecycleStage(state);
    const validCommands = filterByLifecycle(this.commands, lifecycleStage);

    if (validCommands.length === 0) {
      return noMatchResult(input, lifecycleStage);
    }

    // ---- Stage 3: Bayes classification ----
    const validNames = new Set(validCommands.map(cmd => cmd.name));
    const classifications = this.bayesClassifier.classify(trimmed, validNames);

    if (classifications.length === 0) {
      return noMatchResult(input, lifecycleStage);
    }

    // Build command lookup for mapping labels back to metadata
    const commandByName = new Map(this.commands.map(cmd => [cmd.name, cmd]));

    // ---- Stage 3.5: Semantic fallback (only when Bayes is weak) ----
    if (this.semanticMatcher?.isReady() && classifications.length > 0) {
      const topBayes = classifications[0];
      if (topBayes.confidence < this.config.confidenceThreshold) {
        const semanticMatches = await this.semanticMatcher.match(trimmed, validNames);
        if (semanticMatches.length > 0 && semanticMatches[0].similarity >= this.config.semanticThreshold) {
          // Semantic match is confident -- use it instead of weak Bayes
          const args = extractArguments(trimmed);
          return {
            type: 'classified',
            command: semanticMatches[0].command,
            confidence: semanticMatches[0].similarity,
            arguments: args,
            alternatives: [],
            lifecycleStage,
            method: 'semantic',
          };
        }
      }
    }

    // ---- Stage 4: Confidence resolution ----
    const top = classifications[0];
    const second = classifications.length > 1 ? classifications[1] : null;

    const meetsThreshold = top.confidence >= this.config.confidenceThreshold;
    const gap = second ? top.confidence - second.confidence : 1.0;
    const meetsGap = gap >= this.config.ambiguityGap;

    // ---- Stage 5: Argument extraction ----
    const args = extractArguments(trimmed);

    if (meetsThreshold && meetsGap) {
      // Confident single match
      const matchedCommand = commandByName.get(top.label) ?? null;
      return {
        type: 'classified',
        command: matchedCommand,
        confidence: top.confidence,
        arguments: args,
        alternatives: [],
        lifecycleStage,
        method: 'bayes',
      };
    }

    // Ambiguous -- return top N alternatives
    const alternatives = classifications
      .slice(0, this.config.maxAlternatives)
      .map(c => ({
        command: commandByName.get(c.label)!,
        confidence: c.confidence,
      }))
      .filter(a => a.command != null);

    if (alternatives.length === 0) {
      return noMatchResult(input, lifecycleStage);
    }

    return {
      type: 'ambiguous',
      command: null,
      confidence: top.confidence,
      arguments: args,
      alternatives,
      lifecycleStage,
    };
  }
}
