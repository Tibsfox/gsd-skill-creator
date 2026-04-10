import { describe, it, expect } from 'vitest';
import {
  extractKeywords,
  keywordOverlap,
  extractQuotedPhrases,
  quotedPhraseBoost,
  extractPersonNames,
  personNameBoost,
  parseTimeOffset,
  temporalBoost,
  extractPreferences,
  isAssistantReference,
  hybridRerank,
  scoreToDistance,
  distanceToScore,
} from '../hybrid-scorer.js';
import type { ScoredDocument } from '../hybrid-scorer.js';

// ─── extractKeywords ─────────────────────────────────────────────────────────

describe('extractKeywords()', () => {
  it('extracts lowercase words 3+ chars', () => {
    const kws = extractKeywords('What is the best embedding model for RAG?');
    expect(kws).toContain('best');
    expect(kws).toContain('embedding');
    expect(kws).toContain('model');
    expect(kws).toContain('rag');
  });

  it('filters stop words', () => {
    const kws = extractKeywords('What did you do with the code?');
    expect(kws).not.toContain('what');
    expect(kws).not.toContain('did');
    expect(kws).not.toContain('you');
    expect(kws).not.toContain('the');
    expect(kws).toContain('code');
  });

  it('returns empty for all-stop-word queries', () => {
    expect(extractKeywords('what is the')).toEqual([]);
  });
});

// ─── keywordOverlap ──────────────────────────────────────────────────────────

describe('keywordOverlap()', () => {
  it('returns 1.0 when all keywords found', () => {
    expect(keywordOverlap(['pgvector', 'embedding'], 'Use pgvector for embedding storage')).toBe(1.0);
  });

  it('returns 0.5 when half the keywords found', () => {
    expect(keywordOverlap(['pgvector', 'redis'], 'Use pgvector for storage')).toBe(0.5);
  });

  it('returns 0.0 when no keywords found', () => {
    expect(keywordOverlap(['kubernetes', 'helm'], 'PostgreSQL database setup')).toBe(0.0);
  });

  it('returns 0.0 for empty keywords', () => {
    expect(keywordOverlap([], 'anything')).toBe(0.0);
  });

  it('case insensitive matching', () => {
    expect(keywordOverlap(['docker'], 'Docker containers are great')).toBe(1.0);
  });
});

// ─── extractQuotedPhrases ────────────────────────────────────────────────────

describe('extractQuotedPhrases()', () => {
  it('extracts single-quoted phrases', () => {
    const phrases = extractQuotedPhrases("you mentioned 'sexual compulsions' as an option");
    expect(phrases).toContain('sexual compulsions');
  });

  it('extracts double-quoted phrases', () => {
    const phrases = extractQuotedPhrases('you said "use pgvector" for production');
    expect(phrases).toContain('use pgvector');
  });

  it('extracts multiple phrases', () => {
    const phrases = extractQuotedPhrases("you listed 'option A' and 'option B'");
    expect(phrases.length).toBe(2);
  });

  it('ignores too-short phrases', () => {
    const phrases = extractQuotedPhrases("you said 'hi' to me");
    expect(phrases.length).toBe(0); // 'hi' is < 3 chars
  });

  it('returns empty for no quotes', () => {
    expect(extractQuotedPhrases('no quotes here')).toEqual([]);
  });
});

// ─── quotedPhraseBoost ───────────────────────────────────────────────────────

describe('quotedPhraseBoost()', () => {
  it('returns 1.0 when exact phrase found', () => {
    expect(quotedPhraseBoost(
      ['sexual compulsions'],
      'I suggested sexual compulsions as a term'
    )).toBe(1.0);
  });

  it('returns 0.0 when phrase not found', () => {
    expect(quotedPhraseBoost(
      ['quantum entanglement'],
      'This document is about cooking recipes'
    )).toBe(0.0);
  });

  it('returns 0.0 for empty phrases', () => {
    expect(quotedPhraseBoost([], 'anything')).toBe(0.0);
  });

  it('case insensitive', () => {
    expect(quotedPhraseBoost(['PgVector'], 'using pgvector for embeddings')).toBe(1.0);
  });
});

// ─── extractPersonNames ──────────────────────────────────────────────────────

describe('extractPersonNames()', () => {
  it('extracts capitalized names', () => {
    const names = extractPersonNames('I went to the park with Rachel and Michael');
    expect(names).toContain('Rachel');
    expect(names).toContain('Michael');
  });

  it('filters common title-case words', () => {
    const names = extractPersonNames('What did Monday bring? The weather was nice.');
    expect(names).not.toContain('What');
    expect(names).not.toContain('Monday');
    expect(names).not.toContain('The');
  });

  it('filters month names', () => {
    const names = extractPersonNames('In January we went to March Air Reserve Base');
    expect(names).not.toContain('January');
    expect(names).not.toContain('March');
  });

  it('deduplicates', () => {
    const names = extractPersonNames('Rachel said hi. Rachel waved.');
    expect(names.filter(n => n === 'Rachel').length).toBe(1);
  });

  it('returns empty for no names', () => {
    expect(extractPersonNames('all lowercase text here')).toEqual([]);
  });
});

// ─── personNameBoost ─────────────────────────────────────────────────────────

describe('personNameBoost()', () => {
  it('returns 1.0 when all names found', () => {
    expect(personNameBoost(['Rachel'], 'I met Rachel at the cafe')).toBe(1.0);
  });

  it('returns 0.0 when no names found', () => {
    expect(personNameBoost(['Rachel'], 'No one was there')).toBe(0.0);
  });

  it('returns 0.5 for partial match', () => {
    expect(personNameBoost(['Rachel', 'Michael'], 'Rachel was there alone')).toBe(0.5);
  });
});

// ─── parseTimeOffset ─────────────────────────────────────────────────────────

describe('parseTimeOffset()', () => {
  it('parses "3 days ago"', () => {
    const offset = parseTimeOffset('What did I do 3 days ago?');
    expect(offset).not.toBeNull();
    expect(offset!.daysBack).toBe(3);
    expect(offset!.toleranceDays).toBe(2);
  });

  it('parses "yesterday"', () => {
    const offset = parseTimeOffset('What happened yesterday?');
    expect(offset!.daysBack).toBe(1);
    expect(offset!.toleranceDays).toBe(1);
  });

  it('parses "2 weeks ago"', () => {
    const offset = parseTimeOffset('What did we discuss 2 weeks ago?');
    expect(offset!.daysBack).toBe(14);
  });

  it('parses "last month"', () => {
    const offset = parseTimeOffset('What was I working on last month?');
    expect(offset!.daysBack).toBe(30);
    expect(offset!.toleranceDays).toBe(7);
  });

  it('parses "recently"', () => {
    const offset = parseTimeOffset('What have I been doing recently?');
    expect(offset!.daysBack).toBe(14);
    expect(offset!.toleranceDays).toBe(14);
  });

  it('returns null for no time reference', () => {
    expect(parseTimeOffset('What is the best database?')).toBeNull();
  });
});

// ─── temporalBoost ───────────────────────────────────────────────────────────

describe('temporalBoost()', () => {
  it('returns max boost when doc date matches target exactly', () => {
    const target = new Date('2026-04-01');
    const doc = new Date('2026-04-01');
    expect(temporalBoost(doc, target, 3)).toBe(0.40);
  });

  it('returns max boost within tolerance', () => {
    const target = new Date('2026-04-01');
    const doc = new Date('2026-04-03'); // 2 days off, tolerance is 3
    expect(temporalBoost(doc, target, 3)).toBe(0.40);
  });

  it('returns partial boost between tolerance and 3x tolerance', () => {
    const target = new Date('2026-04-01');
    const doc = new Date('2026-04-07'); // 6 days off, tolerance is 3
    const boost = temporalBoost(doc, target, 3);
    expect(boost).toBeGreaterThan(0);
    expect(boost).toBeLessThan(0.40);
  });

  it('returns 0 beyond 3x tolerance', () => {
    const target = new Date('2026-04-01');
    const doc = new Date('2026-05-01'); // 30 days off, tolerance is 3
    expect(temporalBoost(doc, target, 3)).toBe(0);
  });
});

// ─── extractPreferences ──────────────────────────────────────────────────────

describe('extractPreferences()', () => {
  it('extracts "I prefer" patterns', () => {
    const prefs = extractPreferences('I prefer dark mode for coding.');
    expect(prefs.length).toBeGreaterThan(0);
    expect(prefs[0]).toContain('dark mode');
  });

  it('extracts "I\'ve been struggling" patterns', () => {
    const prefs = extractPreferences("I've been struggling with anxiety lately.");
    expect(prefs.length).toBeGreaterThan(0);
  });

  it('extracts memory/nostalgia patterns', () => {
    const prefs = extractPreferences('I still remember the happy high school experiences.');
    expect(prefs.length).toBeGreaterThan(0);
  });

  it('deduplicates and limits to 12', () => {
    const text = Array(20).fill('I prefer chocolate. I prefer vanilla.').join(' ');
    const prefs = extractPreferences(text);
    expect(prefs.length).toBeLessThanOrEqual(12);
  });

  it('returns empty for no preference content', () => {
    expect(extractPreferences('The weather is nice today.')).toEqual([]);
  });
});

// ─── isAssistantReference ────────────────────────────────────────────────────

describe('isAssistantReference()', () => {
  it('detects "you suggested"', () => {
    expect(isAssistantReference('You suggested using pgvector')).toBe(true);
  });

  it('detects "remind me what you"', () => {
    expect(isAssistantReference('Can you remind me what you said about databases?')).toBe(true);
  });

  it('returns false for normal queries', () => {
    expect(isAssistantReference('What is the best database?')).toBe(false);
  });
});

// ─── hybridRerank ────────────────────────────────────────────────────────────

describe('hybridRerank()', () => {
  const docs: ScoredDocument[] = [
    { id: 'doc1', text: 'PostgreSQL pgvector embedding storage for production', rawDistance: 0.3 },
    { id: 'doc2', text: 'Redis caching layer for session data', rawDistance: 0.25 },
    { id: 'doc3', text: 'ChromaDB vector store with pgvector sync', rawDistance: 0.35 },
  ];

  it('returns all documents re-ranked', () => {
    const results = hybridRerank('pgvector production', docs);
    expect(results.length).toBe(3);
  });

  it('boosts documents with keyword overlap', () => {
    const results = hybridRerank('pgvector production', docs);
    // doc1 has both "pgvector" and "production" — should rank higher than raw
    const doc1 = results.find(r => r.doc.id === 'doc1')!;
    expect(doc1.fusedDistance).toBeLessThan(doc1.doc.rawDistance);
    expect(doc1.signals.keywordOverlap).toBeGreaterThan(0);
  });

  it('keyword overlap reduces fused distance', () => {
    const results = hybridRerank('redis caching', docs);
    const redis = results.find(r => r.doc.id === 'doc2')!;
    expect(redis.fusedDistance).toBeLessThan(redis.doc.rawDistance);
  });

  it('documents without keyword overlap keep raw distance', () => {
    const results = hybridRerank('kubernetes helm', docs);
    // None of the docs mention kubernetes or helm
    for (const r of results) {
      expect(r.signals.keywordOverlap).toBe(0);
      expect(r.fusedDistance).toBe(r.doc.rawDistance);
    }
  });

  it('quoted phrases provide strong boost', () => {
    const docs2: ScoredDocument[] = [
      { id: 'a', text: 'The term sexual compulsions was discussed', rawDistance: 0.5 },
      { id: 'b', text: 'General psychology discussion about habits', rawDistance: 0.3 },
    ];
    const results = hybridRerank("you mentioned 'sexual compulsions'", docs2);
    // 'a' has the exact phrase — should beat 'b' despite worse raw distance
    expect(results[0].doc.id).toBe('a');
  });

  it('person names boost matching documents', () => {
    const docs2: ScoredDocument[] = [
      { id: 'a', text: 'I went to the park with Rachel today', rawDistance: 0.4 },
      { id: 'b', text: 'I went to the park with my friend today', rawDistance: 0.3 },
    ];
    const results = hybridRerank('What did I do with Rachel?', docs2);
    const docA = results.find(r => r.doc.id === 'a')!;
    expect(docA.signals.personNameBoost).toBeGreaterThan(0);
    expect(docA.fusedDistance).toBeLessThan(docA.doc.rawDistance);
  });

  it('temporal boost works with date context', () => {
    const now = new Date('2026-04-08');
    const docs2: ScoredDocument[] = [
      { id: 'recent', text: 'Meeting notes from this week', rawDistance: 0.4, date: new Date('2026-04-05') },
      { id: 'old', text: 'Meeting notes from January', rawDistance: 0.3, date: new Date('2026-01-15') },
    ];
    const results = hybridRerank('What did we discuss 3 days ago?', docs2, now);
    const recent = results.find(r => r.doc.id === 'recent')!;
    expect(recent.signals.temporalBoost).toBeGreaterThan(0);
    // Recent doc should be re-ranked higher despite worse raw distance
    expect(results[0].doc.id).toBe('recent');
  });

  it('results are sorted by fusedDistance ascending', () => {
    const results = hybridRerank('pgvector production storage', docs);
    for (let i = 1; i < results.length; i++) {
      expect(results[i].fusedDistance).toBeGreaterThanOrEqual(results[i - 1].fusedDistance);
    }
  });
});

// ─── scoreToDistance / distanceToScore ─────────────────────────────────────────

describe('score/distance conversion', () => {
  it('scoreToDistance: 1.0 → 0.0', () => {
    expect(scoreToDistance(1.0)).toBe(0.0);
  });

  it('scoreToDistance: 0.0 → 1.0', () => {
    expect(scoreToDistance(0.0)).toBe(1.0);
  });

  it('distanceToScore: 0.0 → 1.0', () => {
    expect(distanceToScore(0.0)).toBe(1.0);
  });

  it('distanceToScore: 1.0 → 0.0', () => {
    expect(distanceToScore(1.0)).toBe(0.0);
  });

  it('roundtrips correctly', () => {
    for (const s of [0.0, 0.25, 0.5, 0.75, 1.0]) {
      expect(distanceToScore(scoreToDistance(s))).toBeCloseTo(s, 10);
    }
  });
});
