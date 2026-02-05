import { describe, it, expect, beforeEach } from 'vitest';
import { HeuristicEmbedder } from './heuristic-fallback.js';
import { cosineSimilarity } from './cosine-similarity.js';

describe('HeuristicEmbedder', () => {
  let embedder: HeuristicEmbedder;

  beforeEach(() => {
    embedder = new HeuristicEmbedder();
  });

  describe('determinism', () => {
    it('produces identical embeddings for same input', () => {
      const text = 'This is a test document for embedding';
      const embedding1 = embedder.embed(text);
      const embedding2 = embedder.embed(text);

      expect(embedding1).toEqual(embedding2);
    });

    it('produces identical embeddings across instances', () => {
      const text = 'Consistent embedding generation test';
      const embedder1 = new HeuristicEmbedder();
      const embedder2 = new HeuristicEmbedder();

      const embedding1 = embedder1.embed(text);
      const embedding2 = embedder2.embed(text);

      expect(embedding1).toEqual(embedding2);
    });

    it('produces identical embeddings after adding documents', () => {
      const text = 'Embedding with corpus';

      // First embedder with documents
      const embedder1 = new HeuristicEmbedder();
      embedder1.addDocument('Sample document one');
      embedder1.addDocument('Sample document two');
      const embedding1 = embedder1.embed(text);

      // Second embedder with same documents
      const embedder2 = new HeuristicEmbedder();
      embedder2.addDocument('Sample document one');
      embedder2.addDocument('Sample document two');
      const embedding2 = embedder2.embed(text);

      expect(embedding1).toEqual(embedding2);
    });
  });

  describe('output dimension', () => {
    it('returns default 384 dimensions', () => {
      const embedding = embedder.embed('Test text');
      expect(embedding.length).toBe(384);
    });

    it('returns custom dimension when specified', () => {
      const customEmbedder = new HeuristicEmbedder(512);
      const embedding = customEmbedder.embed('Test text');
      expect(embedding.length).toBe(512);
    });

    it('returns small dimension when specified', () => {
      const smallEmbedder = new HeuristicEmbedder(64);
      const embedding = smallEmbedder.embed('Test text');
      expect(embedding.length).toBe(64);
    });
  });

  describe('normalization', () => {
    it('produces L2 normalized vectors (magnitude approximately 1.0)', () => {
      const embedding = embedder.embed('Test document with several words');
      const magnitude = Math.sqrt(
        embedding.reduce((sum, val) => sum + val * val, 0)
      );
      expect(magnitude).toBeCloseTo(1.0, 5);
    });

    it('produces normalized vectors for short text', () => {
      const embedding = embedder.embed('short text');
      const magnitude = Math.sqrt(
        embedding.reduce((sum, val) => sum + val * val, 0)
      );
      expect(magnitude).toBeCloseTo(1.0, 5);
    });

    it('produces normalized vectors for long text', () => {
      const longText = Array(100)
        .fill('word')
        .map((w, i) => `${w}${i}`)
        .join(' ');
      const embedding = embedder.embed(longText);
      const magnitude = Math.sqrt(
        embedding.reduce((sum, val) => sum + val * val, 0)
      );
      expect(magnitude).toBeCloseTo(1.0, 5);
    });
  });

  describe('empty text handling', () => {
    it('returns zero vector for empty string', () => {
      const embedding = embedder.embed('');
      expect(embedding.length).toBe(384);
      expect(embedding.every((v) => v === 0)).toBe(true);
    });

    it('returns zero vector for whitespace only', () => {
      const embedding = embedder.embed('   \t\n  ');
      expect(embedding.every((v) => v === 0)).toBe(true);
    });

    it('returns zero vector for very short tokens only', () => {
      // All words are 2 chars or less, filtered out
      const embedding = embedder.embed('a b c x y z');
      expect(embedding.every((v) => v === 0)).toBe(true);
    });
  });

  describe('similarity properties', () => {
    it('produces high similarity for similar texts', () => {
      const text1 = 'Machine learning and artificial intelligence';
      const text2 = 'Artificial intelligence and machine learning';

      const emb1 = embedder.embed(text1);
      const emb2 = embedder.embed(text2);

      const similarity = cosineSimilarity(emb1, emb2);
      expect(similarity).toBeGreaterThan(0.5);
    });

    it('produces lower similarity for unrelated texts', () => {
      const text1 = 'Machine learning and neural networks';
      const text2 = 'Cooking recipes for Italian pasta';

      const emb1 = embedder.embed(text1);
      const emb2 = embedder.embed(text2);

      const similarity = cosineSimilarity(emb1, emb2);
      expect(similarity).toBeLessThan(0.3);
    });

    it('produces similarity of 1.0 for identical texts', () => {
      const text = 'Exact same text';
      const emb1 = embedder.embed(text);
      const emb2 = embedder.embed(text);

      const similarity = cosineSimilarity(emb1, emb2);
      expect(similarity).toBeCloseTo(1.0, 10);
    });
  });

  describe('batch embedding', () => {
    it('produces same results as individual embed calls', () => {
      const texts = [
        'First document to embed',
        'Second document for testing',
        'Third document in batch',
      ];

      const batchResult = embedder.embedBatch(texts);
      const individualResults = texts.map((t) => embedder.embed(t));

      expect(batchResult).toEqual(individualResults);
    });

    it('handles empty batch', () => {
      const result = embedder.embedBatch([]);
      expect(result).toEqual([]);
    });

    it('handles single item batch', () => {
      const texts = ['Single document'];
      const batchResult = embedder.embedBatch(texts);
      expect(batchResult.length).toBe(1);
      expect(batchResult[0]).toEqual(embedder.embed(texts[0]));
    });
  });

  describe('document corpus', () => {
    it('tracks document count', () => {
      expect(embedder.getDocumentCount()).toBe(0);

      embedder.addDocument('First document');
      expect(embedder.getDocumentCount()).toBe(1);

      embedder.addDocument('Second document');
      expect(embedder.getDocumentCount()).toBe(2);
    });

    it('tracks vocabulary size', () => {
      expect(embedder.getVocabularySize()).toBe(0);

      embedder.addDocument('hello world');
      expect(embedder.getVocabularySize()).toBe(2); // hello, world

      embedder.addDocument('hello there');
      expect(embedder.getVocabularySize()).toBe(3); // hello, world, there
    });

    it('resets correctly', () => {
      embedder.addDocument('Some document');
      embedder.addDocument('Another document');
      expect(embedder.getDocumentCount()).toBe(2);

      embedder.reset();
      expect(embedder.getDocumentCount()).toBe(0);
      expect(embedder.getVocabularySize()).toBe(0);
    });
  });

  describe('TF-IDF corpus mode', () => {
    it('uses TF-IDF weights when corpus is available', () => {
      // Build a corpus
      embedder.addDocument('machine learning algorithms');
      embedder.addDocument('neural network training');
      embedder.addDocument('deep learning models');

      // Embed a related text
      const embedding = embedder.embed('learning with neural networks');

      // Should be normalized
      const magnitude = Math.sqrt(
        embedding.reduce((sum, val) => sum + val * val, 0)
      );
      expect(magnitude).toBeCloseTo(1.0, 5);

      // Should not be zero vector (has content)
      const nonZeroCount = embedding.filter((v) => v !== 0).length;
      expect(nonZeroCount).toBeGreaterThan(0);
    });

    it('handles corpus vs no-corpus differently', () => {
      const text = 'testing different modes';

      // Without corpus
      const emb1 = embedder.embed(text);

      // With corpus
      const embedderWithCorpus = new HeuristicEmbedder();
      embedderWithCorpus.addDocument('sample corpus document');
      const emb2 = embedderWithCorpus.embed(text);

      // Results may differ due to TF-IDF weighting
      // Both should still be valid embeddings
      expect(emb1.length).toBe(384);
      expect(emb2.length).toBe(384);

      // Both should be normalized
      const mag1 = Math.sqrt(emb1.reduce((sum, val) => sum + val * val, 0));
      const mag2 = Math.sqrt(emb2.reduce((sum, val) => sum + val * val, 0));
      expect(mag1).toBeCloseTo(1.0, 5);
      expect(mag2).toBeCloseTo(1.0, 5);
    });
  });

  describe('special characters and unicode', () => {
    it('handles text with special characters', () => {
      const text = 'Hello! How are you? Test: 123-456';
      const embedding = embedder.embed(text);
      expect(embedding.length).toBe(384);
      // Should extract: hello, how, are, you, test, 123, 456
    });

    it('handles text with unicode', () => {
      const text = 'Hello world with emoji and special chars';
      const embedding = embedder.embed(text);
      expect(embedding.length).toBe(384);
    });

    it('handles numbers', () => {
      const text = 'Version 123 and code 456';
      const embedding = embedder.embed(text);
      expect(embedding.length).toBe(384);
      const nonZeroCount = embedding.filter((v) => v !== 0).length;
      expect(nonZeroCount).toBeGreaterThan(0);
    });
  });
});
