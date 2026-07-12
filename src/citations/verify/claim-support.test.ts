import { describe, it, expect, vi } from 'vitest';
import {
  HeuristicClaimExtractor,
  VerificationStage,
  type ClaimResolverPort,
} from './claim-support.js';
import type { CitedWork, RawCitation } from '../types/index.js';

// ─── Fixtures ────────────────────────────────────────────────────────────────

const FIXTURE = `# Findings

Transformer models improved translation quality by 42% (Vaswani, 2017).

The system reached a peak throughput of 12000 requests per second [3].

We simply wanted the pipeline to feel pleasant to operate.

Resolution accuracy is documented at https://doi.org/10.1000/xyz123 in prior work.

The approach outperforms the prior baseline across all benchmarks.

\`\`\`ts
const x = 42; // percentages like 99% inside code must be ignored
\`\`\`

## References

Vaswani, A. (2017). Attention is all you need. NeurIPS.
`;

function makeWork(overrides: Partial<CitedWork> = {}): CitedWork {
  return {
    id: 'w1',
    title: 'Attention Is All You Need',
    authors: [{ family: 'Vaswani', given: 'Ashish' }],
    year: 2017,
    type: 'article',
    source_api: 'crossref',
    confidence: 0.92,
    raw_citations: [],
    ...overrides,
  } as CitedWork;
}

// A resolver that only resolves citations whose text carries a DOI.
class DoiOnlyResolver implements ClaimResolverPort {
  public calls: RawCitation[] = [];
  async resolve(citation: RawCitation): Promise<CitedWork | null> {
    this.calls.push(citation);
    if (/10\.\d{4,}\//.test(citation.text)) return makeWork();
    return null;
  }
}

// ─── Extractor ───────────────────────────────────────────────────────────────

describe('HeuristicClaimExtractor', () => {
  const extractor = new HeuristicClaimExtractor();

  it('extracts claims carrying citation markers', () => {
    const claims = extractor.extract(FIXTURE, 'doc.md');
    const cited = claims.filter((c) => c.hasCitation);
    expect(cited.some((c) => c.method === 'inline-apa')).toBe(true);
    expect(cited.some((c) => c.method === 'inline-numbered')).toBe(true);
    expect(cited.some((c) => c.method === 'doi')).toBe(true);
  });

  it('flags an uncited factual assertion as a claim', () => {
    const claims = extractor.extract(FIXTURE, 'doc.md');
    const outperform = claims.find((c) => /outperforms/.test(c.text));
    expect(outperform).toBeDefined();
    expect(outperform!.hasCitation).toBe(false);
  });

  it('drops non-claim prose and code blocks', () => {
    const claims = extractor.extract(FIXTURE, 'doc.md');
    expect(claims.some((c) => /pleasant to operate/.test(c.text))).toBe(false);
    expect(claims.some((c) => /const x/.test(c.text))).toBe(false);
  });

  it('ignores the references section', () => {
    const claims = extractor.extract(FIXTURE, 'doc.md');
    expect(claims.some((c) => /Attention is all you need/.test(c.text))).toBe(false);
  });

  it('records a 1-based line number for each claim', () => {
    const claims = extractor.extract(FIXTURE, 'doc.md');
    expect(claims.every((c) => (c.lineNumber ?? 0) > 0)).toBe(true);
  });
});

// ─── Verification stage ──────────────────────────────────────────────────────

describe('VerificationStage', () => {
  it('marks a citation resolvable to a source as supported', async () => {
    const resolver = new DoiOnlyResolver();
    const stage = new VerificationStage(resolver);
    const report = await stage.verify(FIXTURE, 'doc.md');

    const doiClaim = report.claims.find((r) => r.claim.method === 'doi');
    expect(doiClaim?.verdict).toBe('supported');
    expect(doiClaim?.citation?.title).toBe('Attention Is All You Need');
    expect(doiClaim?.confidence).toBe(0.92);
  });

  it('marks a cited claim the resolver cannot resolve as unresolved', async () => {
    const resolver = new DoiOnlyResolver();
    const stage = new VerificationStage(resolver);
    const report = await stage.verify(FIXTURE, 'doc.md');

    const apaClaim = report.claims.find((r) => r.claim.method === 'inline-apa');
    expect(apaClaim?.verdict).toBe('unresolved');
    expect(apaClaim?.citation).toBeNull();
  });

  it('marks an uncited factual assertion as unsupported and never calls the resolver for it', async () => {
    const resolver = new DoiOnlyResolver();
    const stage = new VerificationStage(resolver);
    const report = await stage.verify(FIXTURE, 'doc.md');

    const uncited = report.claims.find((r) => /outperforms/.test(r.claim.text));
    expect(uncited?.verdict).toBe('unsupported');
    // resolver was only invoked for cited claims
    expect(resolver.calls.every((c) => /outperforms/.test(c.text) === false)).toBe(true);
  });

  it('prefers unresolved over a false supported when resolution throws', async () => {
    const throwing: ClaimResolverPort = {
      async resolve() {
        throw new Error('network down');
      },
    };
    const stage = new VerificationStage(throwing);
    const report = await stage.verify(FIXTURE, 'doc.md');
    expect(report.claims.filter((r) => r.claim.hasCitation).every((r) => r.verdict === 'unresolved')).toBe(true);
    expect(report.stats.supported).toBe(0);
  });

  it('aggregates per-verdict stats that sum to the claim total', async () => {
    const resolver = new DoiOnlyResolver();
    const stage = new VerificationStage(resolver);
    const report = await stage.verify(FIXTURE, 'doc.md');
    const { total, supported, unsupported, unresolved } = report.stats;
    expect(supported + unsupported + unresolved).toBe(total);
    expect(total).toBe(report.claims.length);
    expect(supported).toBeGreaterThanOrEqual(1);
  });

  it('supports injecting a custom ClaimExtractor', async () => {
    const custom = {
      extract: vi.fn(() => [
        { text: 'Custom claim (Foo, 2020).', marker: '(Foo, 2020)', method: 'inline-apa' as const, hasCitation: true },
      ]),
    };
    const stage = new VerificationStage(new DoiOnlyResolver(), { extractor: custom });
    const report = await stage.verify('anything', 'doc.md');
    expect(custom.extract).toHaveBeenCalledOnce();
    expect(report.claims).toHaveLength(1);
    expect(report.claims[0]!.verdict).toBe('unresolved');
  });
});
