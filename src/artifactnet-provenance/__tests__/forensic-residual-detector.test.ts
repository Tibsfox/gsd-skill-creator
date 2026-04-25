/**
 * forensic-residual-detector test suite.
 *
 * Covers signature extraction over text, audio, and image kinds, plus the
 * statistical helpers that drive the SONICS classifier. Includes the
 * synthetic-corpus precision test required by Gate G13.
 */

import { describe, expect, it } from 'vitest';

import {
  adjacentSampleRepetition,
  amplitudeEntropy,
  bigramRepetition,
  blockSpectralFlatness,
  envelopeBurstiness,
  extractAudioSignature,
  extractImageSignature,
  extractResidualSignature,
  extractTextSignature,
  normalisedShannonEntropy,
  sentenceBurstiness,
  zipfDeviation,
} from '../forensic-residual-detector.js';
import { classifySignature } from '../sonics-detector.js';
import type { Asset } from '../types.js';

// ----------- text statistical primitives -----------

describe('normalisedShannonEntropy', () => {
  it('returns 0 on empty input', () => {
    expect(normalisedShannonEntropy([])).toBe(0);
  });
  it('returns 0 when all items are identical', () => {
    expect(normalisedShannonEntropy(['x', 'x', 'x'])).toBe(0);
  });
  it('returns 1 on a perfectly uniform 2-element distribution', () => {
    expect(normalisedShannonEntropy(['a', 'b'])).toBeCloseTo(1, 6);
  });
  it('is in [0, 1] for arbitrary inputs', () => {
    const v = normalisedShannonEntropy(['a', 'b', 'c', 'a', 'b', 'a']);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
});

describe('sentenceBurstiness', () => {
  it('returns 0 for one or zero sentences', () => {
    expect(sentenceBurstiness('')).toBe(0);
    expect(sentenceBurstiness('one sentence only')).toBe(0);
  });
  it('rises with sentence-length variance', () => {
    const flat = 'aaaa bbbb. cccc dddd. eeee ffff. gggg hhhh.';
    const bursty =
      'short. now consider a much longer sentence with many many many words inside. tiny. ' +
      'and another extremely long one with several clauses, asides, and digressions woven in.';
    expect(sentenceBurstiness(bursty)).toBeGreaterThan(
      sentenceBurstiness(flat),
    );
  });
});

describe('zipfDeviation', () => {
  it('returns 0 on empty input', () => {
    expect(zipfDeviation([])).toBe(0);
  });
  it('is bounded in [0, 1]', () => {
    const tokens = ['a', 'b', 'a', 'c', 'a', 'b', 'd', 'a'];
    const v = zipfDeviation(tokens);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
});

describe('bigramRepetition', () => {
  it('returns 0 with fewer than 2 tokens', () => {
    expect(bigramRepetition([])).toBe(0);
    expect(bigramRepetition(['only'])).toBe(0);
  });
  it('detects repeated bigrams', () => {
    const tokens = ['a', 'b', 'a', 'b', 'a', 'b', 'a', 'b'];
    expect(bigramRepetition(tokens)).toBeGreaterThan(0.5);
  });
});

// ----------- audio statistical primitives -----------

describe('amplitudeEntropy', () => {
  it('returns 0 on empty samples', () => {
    expect(amplitudeEntropy([], 16)).toBe(0);
  });
  it('returns 0 when all samples are identical', () => {
    expect(amplitudeEntropy([0.1, 0.1, 0.1, 0.1], 16)).toBe(0);
  });
});

describe('envelopeBurstiness', () => {
  it('returns 0 when too few samples for two blocks', () => {
    expect(envelopeBurstiness([0, 0, 0], 64)).toBe(0);
  });
});

describe('blockSpectralFlatness', () => {
  it('returns 0 on too-short input', () => {
    expect(blockSpectralFlatness([0, 0, 0], 64)).toBe(0);
  });
});

describe('adjacentSampleRepetition', () => {
  it('flags fully repeated streams', () => {
    expect(adjacentSampleRepetition([0.5, 0.5, 0.5, 0.5])).toBe(1);
  });
  it('returns 0 on length-1 stream', () => {
    expect(adjacentSampleRepetition([0.5])).toBe(0);
  });
});

// ----------- signature extraction -----------

describe('extractTextSignature', () => {
  it('produces a fully populated signature', () => {
    const sig = extractTextSignature(
      'Now this is a story all about how my life got flipped, turned upside down. ' +
        'I would like to take a minute, just sit right there.',
    );
    expect(sig.kind).toBe('text');
    for (const v of [
      sig.entropy,
      sig.burstiness,
      sig.spectralFlatness,
      sig.repetition,
    ]) {
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThanOrEqual(1);
    }
  });
});

describe('extractAudioSignature', () => {
  it('returns zeroed signature on empty input', () => {
    const sig = extractAudioSignature([]);
    expect(sig.kind).toBe('audio');
    expect(sig.entropy).toBe(0);
  });
  it('handles a noisy stream', () => {
    const noise: number[] = [];
    let seed = 1;
    for (let i = 0; i < 4096; i++) {
      seed = (seed * 1103515245 + 12345) & 0x7fffffff;
      noise.push((seed / 0x7fffffff) * 2 - 1);
    }
    const sig = extractAudioSignature(noise);
    expect(sig.entropy).toBeGreaterThan(0);
  });
});

describe('extractImageSignature', () => {
  it('produces an image-kinded signature', () => {
    const bytes = new Uint8Array(512);
    for (let i = 0; i < bytes.length; i++) bytes[i] = (i * 17) & 0xff;
    const sig = extractImageSignature(bytes);
    expect(sig.kind).toBe('image');
  });
});

describe('extractResidualSignature dispatch', () => {
  it('routes text assets to the text path', () => {
    const a: Asset = { id: 'x', kind: 'text', content: 'hello world' };
    expect(extractResidualSignature(a).kind).toBe('text');
  });
  it('routes audio assets to the audio path', () => {
    const a: Asset = { id: 'x', kind: 'audio', content: [0.1, 0.2, 0.3] };
    expect(extractResidualSignature(a).kind).toBe('audio');
  });
  it('routes image assets to the image path', () => {
    const a: Asset = {
      id: 'x',
      kind: 'image',
      content: new Uint8Array([1, 2, 3, 4]),
    };
    expect(extractResidualSignature(a).kind).toBe('image');
  });
});

// ----------- synthetic-corpus precision test (Gate G13 acceptance) -----------

/**
 * Build a "real human-written" text fixture: bursty sentences, idiosyncratic
 * vocabulary, heavy-tailed word distribution.
 */
function realFixture(seed: number): string {
  const moods = [
    'I went down to the river yesterday because the sky had turned that bruised purple it gets in May.',
    'Tiny.',
    'Ok.',
    'A friend of mine — the one who always insists on bringing way too much potato salad to potlucks — said something I keep turning over in my head: that places remember us even when we forget them, which is either profound or utter nonsense and I honestly cannot tell which.',
    'Anyway.',
    'The dog barked.',
    'Three crows on the fence post, one of them missing tail feathers, all of them silent in that suspicious way crows can be when they decide to be.',
    'I made coffee.',
  ];
  const mod = (seed % moods.length + moods.length) % moods.length;
  return [
    moods[mod],
    moods[(mod + 3) % moods.length],
    moods[(mod + 5) % moods.length],
    moods[(mod + 1) % moods.length],
    moods[(mod + 4) % moods.length],
  ].join(' ');
}

/**
 * Build an "AI-generated" text fixture: regular sentence lengths, flat token
 * frequency, mild repetition, narrow entropy band.
 */
function syntheticFixture(seed: number): string {
  const subjects = ['the system', 'the platform', 'the user', 'the process'];
  const verbs = ['provides', 'enables', 'supports', 'facilitates'];
  const objects = [
    'a comprehensive solution',
    'an efficient workflow',
    'a robust framework',
    'a streamlined approach',
  ];
  const out: string[] = [];
  for (let i = 0; i < 6; i++) {
    const s = subjects[(seed + i) % subjects.length];
    const v = verbs[(seed + i * 2) % verbs.length];
    const o = objects[(seed + i * 3) % objects.length];
    out.push(`${s} ${v} ${o} for the user.`);
  }
  return out.join(' ');
}

describe('Gate G13 — synthetic-corpus precision (≥80%)', () => {
  it('flags ≥8 of 10 synthetic samples as not-real and ≥8 of 10 real as not-synthetic', () => {
    const real: string[] = [];
    const synth: string[] = [];
    for (let i = 0; i < 10; i++) {
      real.push(realFixture(i * 7 + 3));
      synth.push(syntheticFixture(i * 11 + 5));
    }

    let realCorrect = 0;
    let synthCorrect = 0;
    for (const t of real) {
      const sig = extractTextSignature(t);
      const out = classifySignature(sig);
      if (out.verdict !== 'synthetic') realCorrect += 1;
    }
    for (const t of synth) {
      const sig = extractTextSignature(t);
      const out = classifySignature(sig);
      if (out.verdict !== 'real') synthCorrect += 1;
    }

    // Gate target: ≥80% precision on each side.
    expect(realCorrect).toBeGreaterThanOrEqual(8);
    expect(synthCorrect).toBeGreaterThanOrEqual(8);
  });
});
