import type { EmbeddingVector } from '../types/embeddings.js';

/**
 * Compute cosine similarity between two embedding vectors.
 *
 * Returns a value in the range [-1, 1]:
 * - 1.0: Identical direction (most similar)
 * - 0.0: Orthogonal (unrelated)
 * - -1.0: Opposite direction (most dissimilar)
 *
 * @param a - First embedding vector
 * @param b - Second embedding vector
 * @returns Cosine similarity score
 * @throws Error if vectors have different lengths or are empty
 */
export function cosineSimilarity(a: EmbeddingVector, b: EmbeddingVector): number {
  // Validate input vectors
  if (a.length === 0 || b.length === 0) {
    throw new Error('Vectors must not be empty');
  }

  if (a.length !== b.length) {
    throw new Error(`Vectors must have same length: got ${a.length} and ${b.length}`);
  }

  // Compute dot product and magnitudes in single pass
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  const magnitude = Math.sqrt(normA) * Math.sqrt(normB);

  // Handle zero vectors - return 0 similarity (not NaN)
  if (magnitude === 0) {
    return 0;
  }

  return dotProduct / magnitude;
}
