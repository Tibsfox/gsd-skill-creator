import { describe, it, expect, vi, afterEach } from 'vitest';

describe('LLMActivationAnalyzer', () => {
  const originalEnv = process.env.ANTHROPIC_API_KEY;

  afterEach(() => {
    vi.resetModules();
    vi.restoreAllMocks();
    if (originalEnv) {
      process.env.ANTHROPIC_API_KEY = originalEnv;
    } else {
      delete process.env.ANTHROPIC_API_KEY;
    }
  });

  describe('isAvailable', () => {
    it('returns false when no API key', async () => {
      delete process.env.ANTHROPIC_API_KEY;
      const { LLMActivationAnalyzer } = await import('./llm-activation-analyzer.js');
      const analyzer = new LLMActivationAnalyzer();
      expect(analyzer.isAvailable()).toBe(false);
    });

    it('returns true when API key exists', async () => {
      process.env.ANTHROPIC_API_KEY = 'test-key';
      const { LLMActivationAnalyzer } = await import('./llm-activation-analyzer.js');
      const analyzer = new LLMActivationAnalyzer();
      expect(analyzer.isAvailable()).toBe(true);
    });
  });

  describe('analyze', () => {
    it('returns null when no API key', async () => {
      delete process.env.ANTHROPIC_API_KEY;
      const { LLMActivationAnalyzer } = await import('./llm-activation-analyzer.js');
      const analyzer = new LLMActivationAnalyzer();

      const result = await analyzer.analyze({
        name: 'test-skill',
        description: 'Test description',
      });

      expect(result).toBeNull();
    });

    it('returns structured result when API key available', async () => {
      process.env.ANTHROPIC_API_KEY = 'test-key';

      const mockResponse = {
        score: 85,
        confidence: 'high',
        reasoning: 'Good specificity with clear trigger.',
        strengths: ['Specific terms', 'Clear action'],
        weaknesses: ['Could add use case'],
        suggestions: ['Add example context'],
      };

      vi.doMock('@anthropic-ai/sdk', () => ({
        default: vi.fn().mockImplementation(() => ({
          messages: {
            create: vi.fn().mockResolvedValue({
              content: [{ type: 'text', text: JSON.stringify(mockResponse) }],
            }),
          },
        })),
      }));

      const { LLMActivationAnalyzer } = await import('./llm-activation-analyzer.js');
      const analyzer = new LLMActivationAnalyzer();

      const result = await analyzer.analyze({
        name: 'test-skill',
        description: 'Generate TypeScript interfaces from JSON schemas.',
      });

      expect(result).not.toBeNull();
      expect(result?.score).toBe(85);
      expect(result?.confidence).toBe('high');
      expect(result?.source).toBe('llm');
      expect(result?.strengths).toHaveLength(2);
    });

    it('returns null on API error', async () => {
      process.env.ANTHROPIC_API_KEY = 'test-key';

      vi.doMock('@anthropic-ai/sdk', () => ({
        default: vi.fn().mockImplementation(() => ({
          messages: {
            create: vi.fn().mockRejectedValue(new Error('API error')),
          },
        })),
      }));

      const { LLMActivationAnalyzer } = await import('./llm-activation-analyzer.js');
      const analyzer = new LLMActivationAnalyzer();

      const result = await analyzer.analyze({
        name: 'test-skill',
        description: 'Test description',
      });

      expect(result).toBeNull();
    });

    it('returns null on malformed JSON response', async () => {
      process.env.ANTHROPIC_API_KEY = 'test-key';

      vi.doMock('@anthropic-ai/sdk', () => ({
        default: vi.fn().mockImplementation(() => ({
          messages: {
            create: vi.fn().mockResolvedValue({
              content: [{ type: 'text', text: 'not valid json' }],
            }),
          },
        })),
      }));

      const { LLMActivationAnalyzer } = await import('./llm-activation-analyzer.js');
      const analyzer = new LLMActivationAnalyzer();

      const result = await analyzer.analyze({
        name: 'test-skill',
        description: 'Test description',
      });

      expect(result).toBeNull();
    });

    it('clamps score to 0-100 range', async () => {
      process.env.ANTHROPIC_API_KEY = 'test-key';

      vi.doMock('@anthropic-ai/sdk', () => ({
        default: vi.fn().mockImplementation(() => ({
          messages: {
            create: vi.fn().mockResolvedValue({
              content: [
                {
                  type: 'text',
                  text: JSON.stringify({
                    score: 150,
                    confidence: 'high',
                    reasoning: 'Test',
                    strengths: [],
                    weaknesses: [],
                    suggestions: [],
                  }),
                },
              ],
            }),
          },
        })),
      }));

      const { LLMActivationAnalyzer } = await import('./llm-activation-analyzer.js');
      const analyzer = new LLMActivationAnalyzer();

      const result = await analyzer.analyze({
        name: 'test-skill',
        description: 'Test description',
      });

      expect(result?.score).toBe(100);
    });
  });
});
