import Anthropic from '@anthropic-ai/sdk';
import { isWithinTokenLimit, encode } from 'gpt-tokenizer';
import type { TokenCountResult } from '../types/application.js';

export class TokenCounter {
  private client: Anthropic | null = null;
  private cache = new Map<string, number>();

  constructor(apiKey?: string) {
    if (apiKey) {
      this.client = new Anthropic({ apiKey });
    }
  }

  // Fast check without full encoding - use for quick budget validation
  isWithinBudget(text: string, budget: number): boolean {
    const result = isWithinTokenLimit(text, budget);
    return result !== false;
  }

  // Get token count with fallback strategy
  async count(text: string, useApi: boolean = false): Promise<TokenCountResult> {
    // Check cache first (token counts are deterministic)
    const cacheKey = this.hashContent(text);
    const cached = this.cache.get(cacheKey);
    if (cached !== undefined) {
      return { count: cached, source: 'estimate', confidence: 'high' };
    }

    // Try API if requested and available
    if (useApi && this.client) {
      try {
        const response = await this.client.messages.countTokens({
          model: 'claude-sonnet-4-5-20250929',
          messages: [{ role: 'user', content: text }]
        });
        this.cache.set(cacheKey, response.input_tokens);
        return { count: response.input_tokens, source: 'api', confidence: 'high' };
      } catch {
        // Fall through to offline estimation
      }
    }

    // Offline estimation using gpt-tokenizer
    const tokens = encode(text);
    this.cache.set(cacheKey, tokens.length);
    return { count: tokens.length, source: 'estimate', confidence: 'medium' };
  }

  // Count multiple texts efficiently
  async countBatch(texts: string[]): Promise<TokenCountResult[]> {
    return Promise.all(texts.map(text => this.count(text)));
  }

  // Calculate budget from context window size and percentage
  calculateBudget(contextSize: number, percent: number = 0.03): number {
    return Math.floor(contextSize * percent);
  }

  // Clear cache (for testing or when skills change)
  clearCache(): void {
    this.cache.clear();
  }

  // Simple hash for cache key
  private hashContent(text: string): string {
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
      const char = text.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return hash.toString(36);
  }
}
