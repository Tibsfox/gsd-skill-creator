/**
 * SubagentClient implementations for the critique loop.
 *
 * Security notes:
 * - T-CRIT-05: Never log ANTHROPIC_API_KEY or any env var
 * - T-CRIT-06: Skill body is wrapped in untrusted delimiters before sending to model
 * - Reviewer response is JSON-parsed; malformed JSON becomes a single error finding
 */

import Anthropic from '@anthropic-ai/sdk';
import type { CritiqueFinding, SubagentClient } from './types.js';

// ============================================================================
// RealSubagentClient
// ============================================================================

/**
 * Wraps @anthropic-ai/sdk for reviewer invocations.
 * Wraps skill body in <untrusted_skill_content> delimiters (T-CRIT-06).
 */
export class RealSubagentClient implements SubagentClient {
  constructor(
    private readonly client: Anthropic,
    private readonly model = 'claude-opus-4-6',
  ) {}

  async review(
    prompt: string,
    content: string,
  ): Promise<{ findings: CritiqueFinding[]; rawResponse?: string }> {
    // Wrap in untrusted delimiters to mitigate prompt injection (T-CRIT-06)
    const wrappedContent = [
      '<untrusted_skill_content>',
      content,
      '</untrusted_skill_content>',
    ].join('\n');

    const fullPrompt = `${prompt}\n\n${wrappedContent}`;

    try {
      const response = await this.client.messages.create({
        model: this.model,
        max_tokens: 4096,
        messages: [{ role: 'user', content: fullPrompt }],
      });

      const textBlock = response.content.find((b) => b.type === 'text');
      const rawText = textBlock && 'text' in textBlock ? textBlock.text : '';

      try {
        const parsed = JSON.parse(rawText) as { findings?: CritiqueFinding[] };
        const findings = (parsed.findings ?? []).map((f) => ({
          stage: f.stage ?? 'unknown',
          severity: f.severity ?? 'info',
          message: f.message ?? '',
          location: f.location,
          fixHint: f.fixHint,
        })) as CritiqueFinding[];
        return { findings, rawResponse: rawText };
      } catch {
        return {
          findings: [
            {
              stage: 'reviewer',
              severity: 'error',
              message: 'Reviewer response was not valid JSON',
              fixHint: 'Check reviewer prompt instructions',
            },
          ],
          rawResponse: rawText,
        };
      }
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err);
      const isAuthError =
        errMsg.includes('401') ||
        errMsg.toLowerCase().includes('unauthorized') ||
        errMsg.toLowerCase().includes('authentication');

      const message = isAuthError
        ? 'Authentication failed — check ANTHROPIC_API_KEY is set and valid'
        : `Reviewer call failed: ${errMsg}`;

      return {
        findings: [
          {
            stage: 'reviewer',
            severity: 'error',
            message,
          },
        ],
      };
    }
  }
}

// ============================================================================
// MockSubagentClient
// ============================================================================

/**
 * Deterministic mock for tests. Returns scripted findings per call from a queue.
 * When bodyOverride is provided, returns it as rawResponse (used by reviseDraft tests).
 */
export class MockSubagentClient implements SubagentClient {
  private queue: CritiqueFinding[][];
  private readonly bodyOverride?: string;

  constructor(scriptedResponses: CritiqueFinding[][], bodyOverride?: string) {
    this.queue = [...scriptedResponses];
    this.bodyOverride = bodyOverride;
  }

  async review(
    _prompt: string,
    _content: string,
  ): Promise<{ findings: CritiqueFinding[]; rawResponse?: string }> {
    const findings = this.queue.shift() ?? [];
    return { findings, rawResponse: this.bodyOverride };
  }
}
