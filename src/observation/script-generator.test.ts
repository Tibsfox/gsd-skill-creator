import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createHash } from 'crypto';
import { mkdtemp, rm, writeFile } from 'fs/promises';
import { join } from 'path';
import * as os from 'os';
import { PatternStore } from '../storage/pattern-store.js';
import type { StoredExecutionBatch, ToolExecutionPair, PromotionCandidate } from '../types/observation.js';
import { ScriptGenerator } from './script-generator.js';
import { OffloadOperationSchema } from '../chipset/blitter/types.js';

/**
 * Helper: create a complete ToolExecutionPair for test data.
 */
function completePair(
  toolName: string,
  input: Record<string, unknown>,
  output: string,
  outputHash: string,
  sessionId: string,
): ToolExecutionPair {
  return {
    id: `pair-${toolName}-${sessionId}-${Date.now()}`,
    toolName,
    input,
    output,
    outputHash,
    status: 'complete',
    timestamp: '2026-02-13T00:00:00Z',
    context: { sessionId },
  };
}

/**
 * Helper: create and store a StoredExecutionBatch to PatternStore.
 */
async function storeBatch(
  store: PatternStore,
  sessionId: string,
  pairs: ToolExecutionPair[],
): Promise<void> {
  const batch: StoredExecutionBatch = {
    sessionId,
    context: { sessionId },
    pairs,
    completeCount: pairs.filter(p => p.status === 'complete').length,
    partialCount: pairs.filter(p => p.status === 'partial').length,
    capturedAt: Date.now(),
  };
  await store.append('executions', batch as unknown as Record<string, unknown>);
}

/**
 * Helper: compute input hash using sorted-key JSON.stringify + SHA-256.
 * Must match the hashing used by DeterminismAnalyzer and PromotionDetector.
 */
function computeInputHash(input: Record<string, unknown>): string {
  const canonical = JSON.stringify(input, Object.keys(input).sort());
  return createHash('sha256').update(canonical).digest('hex');
}

/**
 * Helper: create a PromotionCandidate directly for unit-test isolation.
 */
function makeCandidate(
  toolName: string,
  inputHash: string,
  opts: Partial<{
    frequency: number;
    compositeScore: number;
    determinism: number;
    sessionIds: string[];
    observationCount: number;
    estimatedTokenSavings: number;
  }> = {},
): PromotionCandidate {
  return {
    operation: {
      score: {
        operation: { toolName, inputHash },
        varianceScore: 0,
        observationCount: opts.observationCount ?? opts.frequency ?? 3,
        uniqueOutputs: 1,
        sessionIds: opts.sessionIds ?? ['sess-1', 'sess-2', 'sess-3'],
      },
      classification: 'deterministic',
      determinism: opts.determinism ?? 1.0,
    },
    toolName,
    frequency: opts.frequency ?? 3,
    estimatedTokenSavings: opts.estimatedTokenSavings ?? 100,
    compositeScore: opts.compositeScore ?? 0.8,
    meetsConfidence: true,
  };
}

describe('ScriptGenerator', () => {
  let tmpDir: string;
  let store: PatternStore;
  let generator: ScriptGenerator;

  beforeEach(async () => {
    tmpDir = await mkdtemp(join(os.tmpdir(), 'script-generator-test-'));
    store = new PatternStore(tmpDir);
    generator = new ScriptGenerator(store);
  });

  afterEach(async () => {
    await rm(tmpDir, { recursive: true, force: true });
  });

  it('generates a bash script for Read tool using cat', async () => {
    const input = { file_path: '/src/index.ts' };
    const inputHash = computeInputHash(input);
    for (const sid of ['sess-1', 'sess-2', 'sess-3']) {
      await storeBatch(store, sid, [
        completePair('Read', input, 'file-contents', 'hash-aaa', sid),
      ]);
    }

    const candidate = makeCandidate('Read', inputHash);
    const result = await generator.generate(candidate);

    expect(result.scriptContent).toContain('cat');
    expect(result.scriptContent).toContain('/src/index.ts');
    expect(result.operation.scriptType).toBe('bash');
    expect(result.isValid).toBe(true);
  });

  it('generates a bash script for Bash tool that runs the original command', async () => {
    const input = { command: 'npm test -- --reporter=json' };
    const inputHash = computeInputHash(input);
    for (const sid of ['sess-1', 'sess-2', 'sess-3']) {
      await storeBatch(store, sid, [
        completePair('Bash', input, 'test-output', 'hash-bbb', sid),
      ]);
    }

    const candidate = makeCandidate('Bash', inputHash);
    const result = await generator.generate(candidate);

    expect(result.scriptContent).toContain('npm test -- --reporter=json');
    expect(result.operation.scriptType).toBe('bash');
  });

  it('generates a bash script for Write tool using heredoc', async () => {
    const input = { file_path: '/tmp/out.txt', content: 'hello world\nline 2' };
    const inputHash = computeInputHash(input);
    for (const sid of ['sess-1', 'sess-2', 'sess-3']) {
      await storeBatch(store, sid, [
        completePair('Write', input, 'ok', 'hash-ccc', sid),
      ]);
    }

    const candidate = makeCandidate('Write', inputHash);
    const result = await generator.generate(candidate);

    expect(result.scriptContent).toMatch(/cat\s+<<\s*'SCRIPT_EOF'/);
    expect(result.scriptContent).toContain('hello world');
    expect(result.scriptContent).toContain('/tmp/out.txt');
  });

  it('generates a bash script for Glob tool using find', async () => {
    const input = { pattern: '**/*.ts', path: '/src' };
    const inputHash = computeInputHash(input);
    for (const sid of ['sess-1', 'sess-2', 'sess-3']) {
      await storeBatch(store, sid, [
        completePair('Glob', input, 'src/a.ts\nsrc/b.ts', 'hash-ddd', sid),
      ]);
    }

    const candidate = makeCandidate('Glob', inputHash);
    const result = await generator.generate(candidate);

    expect(result.scriptContent).toContain('find');
    expect(result.scriptContent).toContain('/src');
    expect(result.operation.scriptType).toBe('bash');
  });

  it('generates a bash script for Grep tool using grep', async () => {
    const input = { pattern: 'TODO', path: '/src' };
    const inputHash = computeInputHash(input);
    for (const sid of ['sess-1', 'sess-2', 'sess-3']) {
      await storeBatch(store, sid, [
        completePair('Grep', input, 'src/a.ts:10:TODO fix', 'hash-eee', sid),
      ]);
    }

    const candidate = makeCandidate('Grep', inputHash);
    const result = await generator.generate(candidate);

    expect(result.scriptContent).toContain('grep');
    expect(result.scriptContent).toContain('TODO');
    expect(result.scriptContent).toContain('/src');
  });

  it('includes metadata header with source pattern ID, confidence score, and session count', async () => {
    const input = { file_path: '/src/header-test.ts' };
    const inputHash = computeInputHash(input);
    for (const sid of ['s1', 's2', 's3', 's4', 's5']) {
      await storeBatch(store, sid, [
        completePair('Read', input, 'content', 'hash-fff', sid),
      ]);
    }

    const candidate = makeCandidate('Read', inputHash, {
      compositeScore: 0.85,
      frequency: 5,
      sessionIds: ['s1', 's2', 's3', 's4', 's5'],
      observationCount: 5,
    });
    const result = await generator.generate(candidate);

    // The script should start with bash comments containing metadata
    const lines = result.scriptContent.split('\n');
    expect(lines[0]).toBe('#!/bin/bash');

    // Check for pattern ID (toolName:inputHash)
    expect(result.scriptContent).toContain(`Read:${inputHash}`);
    // Check for confidence score
    expect(result.scriptContent).toContain('0.85');
    // Check for session count
    expect(result.scriptContent).toContain('5');
    // Header lines should be comments
    const headerLines = lines.filter(l => l.startsWith('#'));
    expect(headerLines.length).toBeGreaterThanOrEqual(5);
  });

  it('generated operation conforms to OffloadOperationSchema', async () => {
    const input = { file_path: '/src/schema-test.ts' };
    const inputHash = computeInputHash(input);
    for (const sid of ['sess-1', 'sess-2', 'sess-3']) {
      await storeBatch(store, sid, [
        completePair('Read', input, 'content', 'hash-ggg', sid),
      ]);
    }

    const candidate = makeCandidate('Read', inputHash);
    const result = await generator.generate(candidate);

    const parseResult = OffloadOperationSchema.safeParse(result.operation);
    expect(parseResult.success).toBe(true);

    expect(typeof result.operation.id).toBe('string');
    expect(typeof result.operation.script).toBe('string');
    expect(result.operation.scriptType).toBe('bash');
    expect(typeof result.operation.workingDir).toBe('string');
    expect(typeof result.operation.timeout).toBe('number');
    expect(result.operation.env).toBeDefined();
  });

  it('operation id uses toolName:inputHash format', async () => {
    const input = { file_path: '/src/id-test.ts' };
    const inputHash = computeInputHash(input);
    for (const sid of ['sess-1', 'sess-2', 'sess-3']) {
      await storeBatch(store, sid, [
        completePair('Read', input, 'content', 'hash-hhh', sid),
      ]);
    }

    const candidate = makeCandidate('Read', inputHash);
    const result = await generator.generate(candidate);

    expect(result.operation.id).toBe(`Read:${inputHash}`);
  });

  it('returns isValid=false when generation fails for unsupported tool', async () => {
    const input = { url: 'https://example.com' };
    const inputHash = computeInputHash(input);
    for (const sid of ['sess-1', 'sess-2', 'sess-3']) {
      await storeBatch(store, sid, [
        completePair('WebFetch', input, 'html-content', 'hash-iii', sid),
      ]);
    }

    const candidate = makeCandidate('WebFetch', inputHash);
    const result = await generator.generate(candidate);

    expect(result.isValid).toBe(false);
  });

  it('uses stored execution pair input data to build script arguments', async () => {
    const input = { file_path: '/deep/nested/path/file.tsx' };
    const inputHash = computeInputHash(input);
    for (const sid of ['sess-1', 'sess-2', 'sess-3']) {
      await storeBatch(store, sid, [
        completePair('Read', input, 'deep-content', 'hash-jjj', sid),
      ]);
    }

    const candidate = makeCandidate('Read', inputHash);
    const result = await generator.generate(candidate);

    // The generated script must reference the actual file path from stored data
    expect(result.scriptContent).toContain('/deep/nested/path/file.tsx');
  });

  describe('dry-run validation', () => {
    it('dry-run passes when script output matches expected output hash', async () => {
      // Create a real temp file to cat
      const testFilePath = join(tmpDir, 'test-file.txt');
      const fileContent = 'hello world\n';
      await writeFile(testFilePath, fileContent);

      const expectedHash = createHash('sha256').update(fileContent).digest('hex');
      const input = { file_path: testFilePath };
      const inputHash = computeInputHash(input);

      for (const sid of ['sess-1', 'sess-2', 'sess-3']) {
        await storeBatch(store, sid, [
          completePair('Read', input, fileContent, expectedHash, sid),
        ]);
      }

      const candidate = makeCandidate('Read', inputHash);
      const generated = await generator.generate(candidate);
      const result = await generator.dryRun(generated);

      expect(result.passed).toBe(true);
      expect(result.actualOutputHash).toBe(result.expectedOutputHash);
      expect(result.exitCode).toBe(0);
      expect(result.failureReason).toBeNull();
    });

    it('dry-run fails when script output does not match expected hash', async () => {
      // Create a file with different content than what was stored
      const testFilePath = join(tmpDir, 'changed-file.txt');
      await writeFile(testFilePath, 'new content\n');

      const oldHash = createHash('sha256').update('old content\n').digest('hex');
      const input = { file_path: testFilePath };
      const inputHash = computeInputHash(input);

      for (const sid of ['sess-1', 'sess-2', 'sess-3']) {
        await storeBatch(store, sid, [
          completePair('Read', input, 'old content\n', oldHash, sid),
        ]);
      }

      const candidate = makeCandidate('Read', inputHash);
      const generated = await generator.generate(candidate);
      const result = await generator.dryRun(generated);

      expect(result.passed).toBe(false);
      expect(result.actualOutputHash).not.toBe(result.expectedOutputHash);
      expect(result.failureReason).toMatch(/mismatch/i);
    });

    it('dry-run fails when script exits with non-zero code', async () => {
      const input = { command: 'exit 1' };
      const inputHash = computeInputHash(input);
      const outputHash = createHash('sha256').update('').digest('hex');

      for (const sid of ['sess-1', 'sess-2', 'sess-3']) {
        await storeBatch(store, sid, [
          completePair('Bash', input, '', outputHash, sid),
        ]);
      }

      const candidate = makeCandidate('Bash', inputHash);
      const generated = await generator.generate(candidate);
      const result = await generator.dryRun(generated);

      expect(result.passed).toBe(false);
      expect(result.exitCode).not.toBe(0);
      expect(result.failureReason).toMatch(/exit/i);
    });

    it('dry-run fails for invalid generated scripts (isValid=false)', async () => {
      const input = { url: 'https://example.com' };
      const inputHash = computeInputHash(input);

      for (const sid of ['sess-1', 'sess-2', 'sess-3']) {
        await storeBatch(store, sid, [
          completePair('WebFetch', input, 'html', 'hash-web', sid),
        ]);
      }

      const candidate = makeCandidate('WebFetch', inputHash);
      const generated = await generator.generate(candidate);

      expect(generated.isValid).toBe(false);

      const result = await generator.dryRun(generated);

      expect(result.passed).toBe(false);
      expect(result.failureReason).toMatch(/invalid|unsupported/i);
    });

    it('dry-run for Bash tool compares stdout against stored output', async () => {
      const input = { command: 'echo "deterministic output"' };
      const inputHash = computeInputHash(input);
      const expectedOutput = 'deterministic output\n';
      const expectedHash = createHash('sha256').update(expectedOutput).digest('hex');

      for (const sid of ['sess-1', 'sess-2', 'sess-3']) {
        await storeBatch(store, sid, [
          completePair('Bash', input, expectedOutput, expectedHash, sid),
        ]);
      }

      const candidate = makeCandidate('Bash', inputHash);
      const generated = await generator.generate(candidate);
      const result = await generator.dryRun(generated);

      expect(result.passed).toBe(true);
    });

    it('dry-run reports execution duration', async () => {
      const testFilePath = join(tmpDir, 'duration-test.txt');
      await writeFile(testFilePath, 'content\n');
      const expectedHash = createHash('sha256').update('content\n').digest('hex');

      const input = { file_path: testFilePath };
      const inputHash = computeInputHash(input);

      for (const sid of ['sess-1', 'sess-2', 'sess-3']) {
        await storeBatch(store, sid, [
          completePair('Read', input, 'content\n', expectedHash, sid),
        ]);
      }

      const candidate = makeCandidate('Read', inputHash);
      const generated = await generator.generate(candidate);
      const result = await generator.dryRun(generated);

      expect(typeof result.durationMs).toBe('number');
      expect(result.durationMs).toBeGreaterThanOrEqual(0);
    });

    it('dry-run uses candidate stored output hash as expected hash', async () => {
      const testFilePath = join(tmpDir, 'hash-test.txt');
      const fileContent = 'expected content\n';
      await writeFile(testFilePath, fileContent);
      const expectedHash = createHash('sha256').update(fileContent).digest('hex');

      const input = { file_path: testFilePath };
      const inputHash = computeInputHash(input);

      for (const sid of ['sess-1', 'sess-2', 'sess-3']) {
        await storeBatch(store, sid, [
          completePair('Read', input, fileContent, expectedHash, sid),
        ]);
      }

      const candidate = makeCandidate('Read', inputHash);
      const generated = await generator.generate(candidate);
      const result = await generator.dryRun(generated);

      expect(result.expectedOutputHash).toBe(expectedHash);
    });
  });

  describe('barrel exports', () => {
    it('exports ScriptGenerator and types from observation barrel', async () => {
      const barrel = await import('./index.js');
      expect(barrel.ScriptGenerator).toBeDefined();
      expect(barrel.DEFAULT_SCRIPT_GENERATOR_CONFIG).toBeDefined();
    });
  });
});
