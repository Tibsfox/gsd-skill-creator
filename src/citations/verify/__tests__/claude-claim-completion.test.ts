/**
 * Tests for the Claude-backed ClaimCompletion, its gated factory, and the
 * VerificationStage async-extractor seam. All HTTP is mocked — no real network.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  ClaudeClaimCompletion,
  createClaudeClaimCompletion,
} from '../claude-claim-completion.js';
import {
  VerificationStage,
  classifyClaimText,
  type AsyncClaimExtractor,
  type ClaimResolverPort,
} from '../claim-support.js';
import {
  EgressContextDenied,
  NULL_EGRESS_AUDIT_SINK,
  type EgressContext,
} from '../../../security/egress-context.js';

const mockFetch = vi.fn();

beforeEach(() => {
  mockFetch.mockReset();
  vi.stubGlobal('fetch', mockFetch);
  delete process.env['ANTHROPIC_API_KEY'];
});

afterEach(() => {
  vi.unstubAllGlobals();
  delete process.env['ANTHROPIC_API_KEY'];
});

function jsonResponse(body: unknown, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
    text: async () => JSON.stringify(body),
  } as unknown as Response;
}

function anthropicText(text: string) {
  return {
    id: 'msg-1',
    model: 'claude-haiku-4-5-20251001',
    content: [{ type: 'text', text }],
    usage: { input_tokens: 5, output_tokens: 3 },
    stop_reason: 'end_turn',
  };
}

describe('ClaudeClaimCompletion', () => {
  it('returns the assistant text for a prompt (forwarded verbatim as one user message)', async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse(anthropicText('["a claim","another"]')));

    const completion = new ClaudeClaimCompletion({ apiKey: 'k' });
    const out = await completion.complete('EXTRACT PROMPT');

    expect(out).toBe('["a claim","another"]');
    // One request, temperature pinned to 0, the prompt sent as a single user message.
    expect(mockFetch).toHaveBeenCalledTimes(1);
    const body = JSON.parse(mockFetch.mock.calls[0]![1].body as string);
    expect(body.temperature).toBe(0);
    expect(body.messages).toEqual([{ role: 'user', content: 'EXTRACT PROMPT' }]);
  });

  it('propagates EgressContextDenied (a denying context blocks before any fetch)', async () => {
    const denyCtx: EgressContext = { allowList: [], audit: NULL_EGRESS_AUDIT_SINK };
    const completion = new ClaudeClaimCompletion({ apiKey: 'k', ctx: denyCtx });

    await expect(completion.complete('p')).rejects.toBeInstanceOf(EgressContextDenied);
    expect(mockFetch).not.toHaveBeenCalled();
  });
});

describe('createClaudeClaimCompletion (gated factory)', () => {
  it('returns null unless BOTH SC_CLAIM_LLM and ANTHROPIC_API_KEY are set', () => {
    expect(createClaudeClaimCompletion({})).toBeNull();
    expect(createClaudeClaimCompletion({ SC_CLAIM_LLM: '1' })).toBeNull(); // no key
    expect(createClaudeClaimCompletion({ ANTHROPIC_API_KEY: 'k' })).toBeNull(); // no flag
    expect(createClaudeClaimCompletion({ SC_CLAIM_LLM: '0', ANTHROPIC_API_KEY: 'k' })).toBeNull();
  });

  it('returns a working completion when both gates are satisfied', () => {
    const completion = createClaudeClaimCompletion({ SC_CLAIM_LLM: '1', ANTHROPIC_API_KEY: 'k' });
    expect(completion).not.toBeNull();
    expect(typeof completion!.complete).toBe('function');
  });
});

describe('classifyClaimText', () => {
  it('flags citation-bearing text and leaves plain assertions unmarked', () => {
    expect(classifyClaimText('The effect held (Smith, 2020).').hasCitation).toBe(true);
    expect(classifyClaimText('Water is wet.').hasCitation).toBe(false);
  });
});

describe('VerificationStage with an llmExtractor', () => {
  it('enriches atomic LLM claims with markers and only resolves the cited ones', async () => {
    const resolveCalls: string[] = [];
    const resolver = {
      resolve: async (c: { text: string }) => {
        resolveCalls.push(c.text);
        return null;
      },
    } as unknown as ClaimResolverPort;

    const llmExtractor: AsyncClaimExtractor = {
      async extract() {
        // Marker-less claims, exactly as parseClaimCompletion produces them.
        return [
          { text: 'The effect held (Smith, 2020).', marker: null, method: null, hasCitation: false },
          { text: 'Water is wet.', marker: null, method: null, hasCitation: false },
        ];
      },
    };

    const stage = new VerificationStage(resolver, { llmExtractor });
    const report = await stage.verify('ignored draft body', 'doc.md');

    expect(report.stats.total).toBe(2);
    // Only the enriched, citation-bearing claim reaches the resolver.
    expect(resolveCalls).toEqual(['The effect held (Smith, 2020).']);
    const plain = report.claims.find((r) => r.claim.text === 'Water is wet.');
    expect(plain?.verdict).toBe('unsupported');
  });
});
