import { createHash } from 'crypto';
import { PatternStore } from '../storage/pattern-store.js';
import { OffloadOperationSchema } from '../chipset/blitter/types.js';
import { executeOffloadOp } from '../chipset/blitter/executor.js';
import type { OffloadOperation, OffloadResult } from '../chipset/blitter/types.js';
import type {
  PromotionCandidate,
  GeneratedScript,
  ScriptGeneratorConfig,
  DryRunResult,
  StoredExecutionBatch,
  ToolExecutionPair,
} from '../types/observation.js';
import { DEFAULT_SCRIPT_GENERATOR_CONFIG } from '../types/observation.js';

/** Tools that have bash script generation support */
const SUPPORTED_SCRIPT_TOOLS = new Set(['Read', 'Bash', 'Write', 'Glob', 'Grep']);

/**
 * Generates executable bash scripts from PromotionCandidate objects.
 *
 * Consumes candidates produced by PromotionDetector and stored execution data
 * from PatternStore, then produces OffloadOperation-conformant bash scripts
 * that replicate the original tool operations.
 *
 * Satisfies SCRP-01 (script generation), SCRP-02 (metadata headers),
 * and SCRP-04 (OffloadOperation conformance).
 */
export class ScriptGenerator {
  private store: PatternStore;
  private config: ScriptGeneratorConfig;

  constructor(
    store: PatternStore,
    config: ScriptGeneratorConfig = DEFAULT_SCRIPT_GENERATOR_CONFIG,
  ) {
    this.store = store;
    this.config = config;
  }

  /**
   * Generate an executable bash script from a promotion candidate.
   *
   * Looks up stored execution pair data to extract original tool parameters,
   * generates tool-specific bash commands, wraps with a metadata header,
   * and validates against OffloadOperationSchema.
   *
   * @param candidate - The promotion candidate to generate a script for
   * @returns A GeneratedScript with the operation, script content, and validity
   */
  async generate(candidate: PromotionCandidate): Promise<GeneratedScript> {
    const isSupportedTool = SUPPORTED_SCRIPT_TOOLS.has(candidate.toolName);

    // Look up stored execution pair data for this candidate's operation
    const representativePair = await this.findRepresentativePair(candidate);

    // Extract input from stored pair, fallback to empty object
    const input = representativePair?.input ?? {};

    // Generate script body (or unsupported stub)
    const { body, supported } = this.generateScriptBody(candidate.toolName, input);

    // Generate metadata header
    const header = this.generateMetadataHeader(candidate);

    // Combine header + body
    const fullScriptContent = header + '\n' + body + '\n';

    // Build the OffloadOperation object
    const operationData = {
      id: `${candidate.toolName}:${candidate.operation.score.operation.inputHash}`,
      script: fullScriptContent,
      scriptType: 'bash' as const,
      workingDir: this.config.defaultWorkingDir,
      timeout: this.config.defaultTimeout,
      env: {},
      label: `Auto-promoted ${candidate.toolName} operation`,
    };

    // Validate against OffloadOperationSchema (SCRP-04)
    const parseResult = OffloadOperationSchema.safeParse(operationData);
    const isValid = parseResult.success && isSupportedTool && supported;
    const operation: OffloadOperation = parseResult.success
      ? parseResult.data
      : operationData as OffloadOperation;

    return {
      operation,
      sourceCandidate: candidate,
      scriptContent: fullScriptContent,
      isValid,
    };
  }

  /**
   * Execute a generated script in dry-run mode and compare output against expected.
   * Uses Blitter's OffloadExecutor to run the script, then compares stdout hash
   * against the stored output hash from observations (SCRP-03).
   *
   * @param generatedScript - The script to validate
   * @param executor - Optional custom executor function (default: executeOffloadOp from Blitter)
   * @returns DryRunResult with pass/fail, hashes, and failure reason
   */
  async dryRun(
    generatedScript: GeneratedScript,
    executor: (op: OffloadOperation) => Promise<OffloadResult> = executeOffloadOp,
  ): Promise<DryRunResult> {
    // Early return for invalid scripts
    if (!generatedScript.isValid) {
      return {
        generatedScript,
        passed: false,
        actualOutputHash: '',
        expectedOutputHash: '',
        exitCode: -1,
        durationMs: 0,
        failureReason: 'Script is invalid or generated for unsupported tool',
      };
    }

    // Look up the expected output hash from stored execution pairs
    const representativePair = await this.findRepresentativePair(
      generatedScript.sourceCandidate,
    );

    if (!representativePair || !representativePair.outputHash) {
      return {
        generatedScript,
        passed: false,
        actualOutputHash: '',
        expectedOutputHash: '',
        exitCode: -1,
        durationMs: 0,
        failureReason: 'No stored execution data found for output comparison',
      };
    }

    const expectedOutputHash = representativePair.outputHash;

    // Execute the script using the executor
    const result = await executor(generatedScript.operation);

    // Hash the actual stdout
    const actualOutputHash = createHash('sha256')
      .update(result.stdout)
      .digest('hex');

    // Compare hashes and exit code
    const hashMatch = actualOutputHash === expectedOutputHash;
    const exitOk = result.exitCode === 0;
    const passed = hashMatch && exitOk;

    // Determine failure reason
    let failureReason: string | null = null;
    if (!exitOk) {
      failureReason = `Non-zero exit code: ${result.exitCode}`;
    } else if (!hashMatch) {
      failureReason = `Output hash mismatch: expected ${expectedOutputHash.slice(0, 12)}..., got ${actualOutputHash.slice(0, 12)}...`;
    }

    return {
      generatedScript,
      passed,
      actualOutputHash,
      expectedOutputHash,
      exitCode: result.exitCode,
      durationMs: result.durationMs,
      failureReason,
    };
  }

  /**
   * Find a representative stored execution pair matching the candidate's
   * toolName and inputHash. Returns the first complete pair found.
   */
  private async findRepresentativePair(
    candidate: PromotionCandidate,
  ): Promise<ToolExecutionPair | null> {
    const entries = await this.store.read('executions');
    const targetInputHash = candidate.operation.score.operation.inputHash;

    for (const entry of entries) {
      const batch = entry.data as unknown as StoredExecutionBatch;
      for (const pair of batch.pairs) {
        if (pair.status !== 'complete') continue;
        if (pair.toolName !== candidate.toolName) continue;
        const pairInputHash = this.computeInputHash(pair.input);
        if (pairInputHash === targetInputHash) {
          return pair;
        }
      }
    }

    return null;
  }

  /**
   * Generate the metadata header comment block (SCRP-02).
   */
  private generateMetadataHeader(candidate: PromotionCandidate): string {
    const patternId = `${candidate.toolName}:${candidate.operation.score.operation.inputHash}`;
    const confidence = candidate.compositeScore;
    const sessions = candidate.operation.score.sessionIds.length;
    const observations = candidate.frequency;
    const generated = new Date().toISOString();

    return [
      '#!/bin/bash',
      '# ============================================================',
      '# Auto-generated by gsd-skill-creator promotion pipeline',
      `# Source pattern: ${patternId}`,
      `# Confidence: ${confidence}`,
      `# Sessions: ${sessions}`,
      `# Observations: ${observations}`,
      `# Generated: ${generated}`,
      '# ============================================================',
    ].join('\n');
  }

  /**
   * Generate tool-specific bash script body.
   * Returns the bash command(s) and whether the tool is supported.
   */
  private generateScriptBody(
    toolName: string,
    input: Record<string, unknown>,
  ): { body: string; supported: boolean } {
    switch (toolName) {
      case 'Read':
        return {
          body: `cat "${input.file_path as string}"`,
          supported: true,
        };

      case 'Bash':
        return {
          body: input.command as string,
          supported: true,
        };

      case 'Write':
        return {
          body: `cat << 'SCRIPT_EOF' > "${input.file_path as string}"\n${input.content as string}\nSCRIPT_EOF`,
          supported: true,
        };

      case 'Glob': {
        const path = (input.path as string) || '.';
        const pattern = this.globToFindPattern((input.pattern as string) || '*');
        return {
          body: `find "${path}" -name "${pattern}" -type f | sort`,
          supported: true,
        };
      }

      case 'Grep': {
        const path = (input.path as string) || '.';
        return {
          body: `grep -r "${input.pattern as string}" "${path}"`,
          supported: true,
        };
      }

      default:
        return {
          body: `# ERROR: Tool '${toolName}' is not supported for script generation\nexit 1`,
          supported: false,
        };
    }
  }

  /**
   * Convert a glob pattern to a find -name compatible pattern.
   * Strips leading **\/ for find -name compatibility.
   */
  private globToFindPattern(pattern: string): string {
    return pattern.replace(/^\*\*\//, '');
  }

  /**
   * Compute SHA-256 hash of JSON-serialized input with sorted keys.
   * Must match DeterminismAnalyzer and PromotionDetector hashing.
   */
  private computeInputHash(input: Record<string, unknown>): string {
    const canonical = JSON.stringify(input, Object.keys(input).sort());
    return createHash('sha256').update(canonical).digest('hex');
  }
}

export { DEFAULT_SCRIPT_GENERATOR_CONFIG };
