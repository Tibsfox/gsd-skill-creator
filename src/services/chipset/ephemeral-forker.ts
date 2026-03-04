/**
 * Ephemeral forker — fork/execute/merge for parallel muse consultation.
 *
 * All operations are synchronous pure functions (no I/O).
 * Fork context for each muse, augment with vocabulary/voice,
 * execute perspectives, and merge using pluggable strategies.
 */

import type { MuseId } from './muse-schema-validator.js';
import type { MuseRegistry } from './muse-loader.js';
import type { AugmentedContext, ForkRequest, MusePerspective, MergedResult, MergeStrategy } from './muse-forking.js';

export class EphemeralForker {
  constructor(private registry: MuseRegistry) {}

  fork(request: ForkRequest): Map<MuseId, AugmentedContext> {
    const contexts = new Map<MuseId, AugmentedContext>();

    for (const museId of request.muses) {
      const muse = this.registry.getMuse(museId);
      if (!muse) continue;

      contexts.set(museId, {
        baseContext: request.context,
        museVocabulary: muse.vocabulary,
        museVoice: { tone: muse.voice.tone, style: muse.voice.style, signature: muse.voice.signature },
        museOrientation: {
          angle: Math.atan2(muse.planePosition.imaginary, muse.planePosition.real),
          magnitude: Math.sqrt(muse.planePosition.real ** 2 + muse.planePosition.imaginary ** 2),
        },
        prompt: reframeQuestion(request.question, muse.vocabulary),
      });
    }

    return contexts;
  }

  execute(museId: MuseId, augmented: AugmentedContext): MusePerspective {
    const lens = augmented.museVocabulary.join(', ');
    const content = `[${augmented.museVoice.tone}] ${augmented.prompt} (lens: ${lens})`;

    const combined = `${augmented.baseContext} ${augmented.prompt}`.toLowerCase();
    const keywords = augmented.museVocabulary.filter(
      v => combined.includes(v.toLowerCase().split(' ')[0])
    );
    if (keywords.length === 0 && augmented.museVocabulary.length > 0) {
      keywords.push(augmented.museVocabulary[0]);
    }

    return {
      museId,
      content,
      activationScore: augmented.museOrientation.magnitude,
      voice: augmented.museVoice,
      keywords,
    };
  }

  merge(perspectives: MusePerspective[], strategy: MergeStrategy): MergedResult {
    const strategies: Record<MergeStrategy, () => MergedResult> = {
      consensus: () => this.mergeConsensus(perspectives),
      synthesis: () => this.mergeSynthesis(perspectives),
      comparison: () => this.mergeComparison(perspectives),
      strongest: () => this.mergeStrongest(perspectives),
    };

    return strategies[strategy]();
  }

  consult(request: ForkRequest): MergedResult {
    const contexts = this.fork(request);
    const perspectives: MusePerspective[] = [];

    for (const [museId, augmented] of contexts) {
      perspectives.push(this.execute(museId, augmented));
    }

    return this.merge(perspectives, request.mergeStrategy);
  }

  private mergeConsensus(perspectives: MusePerspective[]): MergedResult {
    const keywordCounts = new Map<string, number>();
    for (const p of perspectives) {
      for (const kw of p.keywords) {
        keywordCounts.set(kw, (keywordCounts.get(kw) || 0) + 1);
      }
    }
    const shared = [...keywordCounts.entries()]
      .filter(([, count]) => count >= 2 || perspectives.length === 1)
      .map(([kw]) => kw);

    const content = shared.length > 0
      ? `Consensus on: ${shared.join(', ')}. ${perspectives.map(p => p.content).join(' ')}`
      : perspectives.map(p => p.content).join(' ');

    return {
      content,
      perspectives,
      strategy: 'consensus',
      contributingMuses: perspectives.map(p => p.museId),
    };
  }

  private mergeSynthesis(perspectives: MusePerspective[]): MergedResult {
    const parts = perspectives.map((p, i) => {
      const transition = i === 0 ? 'From one perspective' : 'Meanwhile';
      return `${transition}, ${p.content}`;
    });
    const content = `${parts.join('. ')}. Together, this suggests a unified approach.`;

    return {
      content,
      perspectives,
      strategy: 'synthesis',
      contributingMuses: perspectives.map(p => p.museId),
    };
  }

  private mergeComparison(perspectives: MusePerspective[]): MergedResult {
    const sections = perspectives.map(p => `**${p.museId}:** ${p.content}`);
    const content = sections.join(' | ');

    return {
      content,
      perspectives,
      strategy: 'comparison',
      contributingMuses: perspectives.map(p => p.museId),
    };
  }

  private mergeStrongest(perspectives: MusePerspective[]): MergedResult {
    const sorted = [...perspectives].sort((a, b) => b.activationScore - a.activationScore);
    const strongest = sorted[0];

    return {
      content: strongest.content,
      perspectives,
      strategy: 'strongest',
      contributingMuses: [strongest.museId],
    };
  }
}

function reframeQuestion(question: string, vocabulary: string[]): string {
  if (vocabulary.length === 0) return question;
  const lens = vocabulary.slice(0, 3).join(', ');
  return `Through the lens of ${lens}: ${question}`;
}
