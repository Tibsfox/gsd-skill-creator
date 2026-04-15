import { z } from 'zod';

export const MemoryTypeSchema = z.enum(['user', 'project', 'reference', 'feedback']);
export type MemoryType = z.infer<typeof MemoryTypeSchema>;

export const MemoryFrontmatterSchema = z
  .object({
    name: z.string().min(1),
    description: z.string().min(1).optional(),
    type: MemoryTypeSchema,
    tags: z.array(z.string()).default([]),
    token_count: z.number().int().nonnegative().optional(),
  })
  .passthrough();

export type MemoryFrontmatter = z.infer<typeof MemoryFrontmatterSchema>;

const WORD_TO_TOKEN_RATIO = 0.75;

export function estimateTokenCount(body: string): number {
  if (!body) return 0;
  const words = body.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / WORD_TO_TOKEN_RATIO));
}

export function tagsMatch(memoryTags: string[], queryTerms: string[]): number {
  if (!memoryTags.length || !queryTerms.length) return 0;
  const set = new Set(memoryTags.map((t) => t.toLowerCase()));
  let hits = 0;
  for (const term of queryTerms) {
    if (set.has(term.toLowerCase())) hits++;
  }
  return hits / Math.max(memoryTags.length, queryTerms.length);
}
