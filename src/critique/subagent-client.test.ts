import { describe, it, expect, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { MockSubagentClient, RealSubagentClient } from './subagent-client.js';
import type { CritiqueFinding } from './types.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

// ============================================================================
// MockSubagentClient
// ============================================================================

describe('MockSubagentClient', () => {
  it('scripted queue returns in order', async () => {
    const f1: CritiqueFinding = { stage: 'spec', severity: 'error', message: 'issue 1' };
    const f2: CritiqueFinding = { stage: 'spec', severity: 'warning', message: 'issue 2' };
    const client = new MockSubagentClient([[f1], [f2]]);

    const r1 = await client.review('prompt', 'content');
    expect(r1.findings).toEqual([f1]);

    const r2 = await client.review('prompt', 'content');
    expect(r2.findings).toEqual([f2]);
  });

  it('returns empty array after queue is exhausted', async () => {
    const client = new MockSubagentClient([[{ stage: 'spec', severity: 'error', message: 'x' }]]);
    await client.review('prompt', 'content'); // consume
    const r2 = await client.review('prompt', 'content');
    expect(r2.findings).toHaveLength(0);
  });

  it('never throws on empty queue', async () => {
    const client = new MockSubagentClient([]);
    await expect(client.review('p', 'c')).resolves.toMatchObject({ findings: [] });
  });
});

// ============================================================================
// RealSubagentClient
// ============================================================================

describe('RealSubagentClient', () => {
  it('parses JSON response into findings', async () => {
    const finding: CritiqueFinding = {
      stage: 'spec-compliance',
      severity: 'error',
      message: 'Missing description',
    };
    const mockSdk = {
      messages: {
        create: vi.fn(async () => ({
          content: [{ type: 'text', text: JSON.stringify({ findings: [finding] }) }],
        })),
      },
    };

    const client = new RealSubagentClient(mockSdk as never, 'claude-opus-4-6');
    const result = await client.review('Analyze this skill', 'skill body here');

    expect(result.findings).toHaveLength(1);
    expect(result.findings[0]?.message).toBe('Missing description');
  });

  it('malformed JSON becomes a single error-severity finding', async () => {
    const mockSdk = {
      messages: {
        create: vi.fn(async () => ({
          content: [{ type: 'text', text: 'not valid json at all' }],
        })),
      },
    };

    const client = new RealSubagentClient(mockSdk as never);
    const result = await client.review('prompt', 'content');

    expect(result.findings).toHaveLength(1);
    expect(result.findings[0]?.severity).toBe('error');
    expect(result.findings[0]?.message).toContain('valid JSON');
  });

  it('surfaces missing API key with clear error message', async () => {
    const mockSdk = {
      messages: {
        create: vi.fn(async () => {
          const err = new Error('401 Unauthorized') as Error & { status?: number };
          err.status = 401;
          throw err;
        }),
      },
    };

    const client = new RealSubagentClient(mockSdk as never);
    const result = await client.review('prompt', 'content');

    expect(result.findings).toHaveLength(1);
    expect(result.findings[0]?.severity).toBe('error');
    expect(result.findings[0]?.message).toMatch(/auth|api.?key|unauthorized/i);
  });

  it('subagent-client never logs ANTHROPIC_API_KEY', () => {
    const source = readFileSync(join(__dirname, 'subagent-client.ts'), 'utf-8');
    // The source must not log the env var — only SDK constructor may reference it
    const lines = source.split('\n');
    const badLines = lines.filter(
      (line) =>
        line.includes('console.log') &&
        (line.includes('ANTHROPIC_API_KEY') || line.includes('apiKey')),
    );
    expect(badLines).toHaveLength(0);
  });
});
