/**
 * Tests for Offload type system Zod schemas.
 *
 * Validates: OffloadOperationSchema, PromotionDeclarationSchema,
 * OffloadResultSchema, CompletionSignalSchema, OffloadStatus.
 */

import { describe, it, expect } from 'vitest';
import {
  OffloadOperationSchema,
  PromotionDeclarationSchema,
  OffloadResultSchema,
  CompletionSignalSchema,
  type OffloadStatus,
} from './types.js';

describe('OffloadOperationSchema', () => {
  it('parses valid operation with all fields', () => {
    const result = OffloadOperationSchema.safeParse({
      id: 'my-skill:lint-fix',
      script: '#!/bin/bash\neslint --fix .',
      scriptType: 'bash',
      workingDir: '/project',
      timeout: 60000,
      env: { NODE_ENV: 'production' },
      label: 'Lint fix',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.id).toBe('my-skill:lint-fix');
      expect(result.data.script).toBe('#!/bin/bash\neslint --fix .');
      expect(result.data.scriptType).toBe('bash');
      expect(result.data.workingDir).toBe('/project');
      expect(result.data.timeout).toBe(60000);
      expect(result.data.env).toEqual({ NODE_ENV: 'production' });
      expect(result.data.label).toBe('Lint fix');
    }
  });

  it('parses valid operation with minimal fields', () => {
    const result = OffloadOperationSchema.safeParse({
      id: 'test-skill:run',
      script: 'echo hello',
      scriptType: 'bash',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.id).toBe('test-skill:run');
      expect(result.data.script).toBe('echo hello');
      expect(result.data.scriptType).toBe('bash');
    }
  });

  it('rejects operation missing id', () => {
    const result = OffloadOperationSchema.safeParse({
      script: 'echo hello',
      scriptType: 'bash',
    });
    expect(result.success).toBe(false);
  });

  it('rejects operation missing script', () => {
    const result = OffloadOperationSchema.safeParse({
      id: 'test:run',
      scriptType: 'bash',
    });
    expect(result.success).toBe(false);
  });

  it('rejects operation with invalid scriptType', () => {
    const result = OffloadOperationSchema.safeParse({
      id: 'test:run',
      script: 'echo hello',
      scriptType: 'ruby',
    });
    expect(result.success).toBe(false);
  });

  it('defaults timeout to 30000 when not provided', () => {
    const result = OffloadOperationSchema.safeParse({
      id: 'test:run',
      script: 'echo hello',
      scriptType: 'bash',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.timeout).toBe(30000);
    }
  });

  it('defaults env to empty object when not provided', () => {
    const result = OffloadOperationSchema.safeParse({
      id: 'test:run',
      script: 'echo hello',
      scriptType: 'bash',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.env).toEqual({});
    }
  });

  it('accepts all four valid scriptType values', () => {
    for (const scriptType of ['bash', 'node', 'python', 'custom'] as const) {
      const result = OffloadOperationSchema.safeParse({
        id: `test:${scriptType}`,
        script: 'echo hello',
        scriptType,
      });
      expect(result.success).toBe(true);
    }
  });
});

describe('PromotionDeclarationSchema', () => {
  it('parses valid declaration with all fields', () => {
    const result = PromotionDeclarationSchema.safeParse({
      name: 'lint-fix',
      scriptContent: '#!/bin/bash\neslint --fix .',
      scriptType: 'bash',
      conditions: {
        filePatterns: ['*.ts', '*.tsx'],
        phases: ['execute'],
        alwaysPromote: false,
      },
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBe('lint-fix');
      expect(result.data.scriptContent).toBe('#!/bin/bash\neslint --fix .');
      expect(result.data.scriptType).toBe('bash');
      expect(result.data.conditions?.filePatterns).toEqual(['*.ts', '*.tsx']);
      expect(result.data.conditions?.phases).toEqual(['execute']);
      expect(result.data.conditions?.alwaysPromote).toBe(false);
    }
  });

  it('parses valid declaration with minimal fields', () => {
    const result = PromotionDeclarationSchema.safeParse({
      name: 'build',
      scriptContent: 'npm run build',
      scriptType: 'bash',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBe('build');
      expect(result.data.conditions).toBeUndefined();
    }
  });

  it('conditions is optional with filePatterns, phases, and alwaysPromote', () => {
    const result = PromotionDeclarationSchema.safeParse({
      name: 'test',
      scriptContent: 'vitest run',
      scriptType: 'node',
      conditions: {
        filePatterns: ['*.test.ts'],
      },
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.conditions?.filePatterns).toEqual(['*.test.ts']);
      expect(result.data.conditions?.phases).toBeUndefined();
      expect(result.data.conditions?.alwaysPromote).toBeUndefined();
    }
  });

  it('parses conditions with alwaysPromote: true', () => {
    const result = PromotionDeclarationSchema.safeParse({
      name: 'always-run',
      scriptContent: 'echo hi',
      scriptType: 'bash',
      conditions: { alwaysPromote: true },
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.conditions?.alwaysPromote).toBe(true);
    }
  });

  it('rejects declaration missing name', () => {
    const result = PromotionDeclarationSchema.safeParse({
      scriptContent: 'echo hi',
      scriptType: 'bash',
    });
    expect(result.success).toBe(false);
  });

  it('rejects declaration missing scriptContent', () => {
    const result = PromotionDeclarationSchema.safeParse({
      name: 'test',
      scriptType: 'bash',
    });
    expect(result.success).toBe(false);
  });
});

describe('OffloadResultSchema', () => {
  it('parses valid result with exitCode 0', () => {
    const result = OffloadResultSchema.safeParse({
      operationId: 'my-skill:lint-fix',
      exitCode: 0,
      stdout: 'All files fixed',
      stderr: '',
      durationMs: 1234,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.exitCode).toBe(0);
      expect(result.data.stdout).toBe('All files fixed');
    }
  });

  it('parses valid result with exitCode 1 (failure)', () => {
    const result = OffloadResultSchema.safeParse({
      operationId: 'my-skill:lint-fix',
      exitCode: 1,
      stdout: '',
      stderr: 'Error: lint failed',
      durationMs: 500,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.exitCode).toBe(1);
    }
  });

  it('defaults timedOut to false', () => {
    const result = OffloadResultSchema.safeParse({
      operationId: 'my-skill:run',
      exitCode: 0,
      stdout: '',
      stderr: '',
      durationMs: 100,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.timedOut).toBe(false);
    }
  });

  it('parses result with timedOut: true', () => {
    const result = OffloadResultSchema.safeParse({
      operationId: 'my-skill:run',
      exitCode: 124,
      stdout: '',
      stderr: 'timeout',
      durationMs: 30000,
      timedOut: true,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.timedOut).toBe(true);
    }
  });
});

describe('CompletionSignalSchema', () => {
  const validResult = {
    operationId: 'my-skill:lint-fix',
    exitCode: 0,
    stdout: 'done',
    stderr: '',
    durationMs: 500,
  };

  it('parses valid signal with status success', () => {
    const result = CompletionSignalSchema.safeParse({
      operationId: 'my-skill:lint-fix',
      status: 'success',
      result: validResult,
      timestamp: '2026-01-15T12:00:00Z',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.status).toBe('success');
      expect(result.data.result.exitCode).toBe(0);
    }
  });

  it('accepts all valid status values', () => {
    for (const status of ['success', 'failure', 'timeout', 'error'] as const) {
      const result = CompletionSignalSchema.safeParse({
        operationId: 'test:run',
        status,
        result: validResult,
        timestamp: '2026-01-15T12:00:00Z',
      });
      expect(result.success).toBe(true);
    }
  });

  it('rejects invalid status value', () => {
    const result = CompletionSignalSchema.safeParse({
      operationId: 'test:run',
      status: 'unknown',
      result: validResult,
      timestamp: '2026-01-15T12:00:00Z',
    });
    expect(result.success).toBe(false);
  });

  it('timestamp is an ISO string', () => {
    const result = CompletionSignalSchema.safeParse({
      operationId: 'test:run',
      status: 'success',
      result: validResult,
      timestamp: '2026-01-15T12:00:00Z',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.timestamp).toBe('2026-01-15T12:00:00Z');
    }
  });

  it('error field is optional string', () => {
    const withError = CompletionSignalSchema.safeParse({
      operationId: 'test:run',
      status: 'error',
      result: { ...validResult, exitCode: 1 },
      timestamp: '2026-01-15T12:00:00Z',
      error: 'Something went wrong',
    });
    expect(withError.success).toBe(true);
    if (withError.success) {
      expect(withError.data.error).toBe('Something went wrong');
    }

    const withoutError = CompletionSignalSchema.safeParse({
      operationId: 'test:run',
      status: 'success',
      result: validResult,
      timestamp: '2026-01-15T12:00:00Z',
    });
    expect(withoutError.success).toBe(true);
    if (withoutError.success) {
      expect(withoutError.data.error).toBeUndefined();
    }
  });
});

describe('OffloadStatus', () => {
  it('all valid status values are assignable', () => {
    const statuses: OffloadStatus[] = [
      'pending',
      'running',
      'completed',
      'failed',
      'timed-out',
    ];
    expect(statuses).toHaveLength(5);
    expect(statuses).toContain('pending');
    expect(statuses).toContain('running');
    expect(statuses).toContain('completed');
    expect(statuses).toContain('failed');
    expect(statuses).toContain('timed-out');
  });
});
