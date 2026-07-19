/**
 * Agent Streaming Guardrail concept — agent-systems security wing (June-2026 additional-scan batch B, T2).
 *
 * Source: arXiv:2606.02041 (2026).
 *
 * @module departments/agent-systems/concepts/security/streaming-guardrail
 */

import type { RosettaConcept } from '../../../../rosetta-core/types.js';

const theta = 28 * 2 * Math.PI / 29;
const radius = 0.85;
const real = radius * Math.cos(theta);
const imaginary = radius * Math.sin(theta);

export const streamingGuardrail: RosettaConcept = {
  id: 'agent-streaming-guardrail',
  name: 'Agent Streaming Guardrail',
  domain: 'agent-systems',
  description: 'Agent Streaming Guardrail is a moderation-timing mechanism that reframes safety filtering around WHEN to intervene during token generation, not only WHAT to detect. As LLMs stream long, reasoning-intensive outputs, existing guardrails sit at two unsatisfactory extremes: response-level filters wait for the complete output before intervening (slow, and unsafe content may already have streamed to the user), while token-level filters act on incomplete semantics, producing unstable flip-flopping decisions and excessive guard invocations. SentGuard (arXiv:2606.02041, 2026) instead operates at sentence granularity, running in parallel with generation. A lightweight waiting buffer groups streamed tokens into completed sentence chunks and releases only verified chunks to the user, deliberately introducing a small offset: while the target model decodes the next sentence, the guard assesses the just-completed prefix, hiding guard latency behind ongoing generation. It is trained with a coarse-to-fine objective on StreamSafe, a benchmark with per-sentence annotations across 8 harm categories that capture how risk evolves across both reasoning and answer segments, so unsafe intent is caught the moment it surfaces at a sentence boundary. Across 5 safety benchmarks it outperforms both the response-level and token-level baseline classes, detecting 90.5% of unsafe cases within two sentences while holding a streaming false-positive rate of 7.41%. The buffering carries a real UX cost distinct from the hidden guard latency: because only verified chunks are released, the user\'s stream is itself delayed by up to one full sentence — the same offset that masks guard latency also defers delivery. Distinct from agent-joint-intent-harm-defense, which fuses WHICH signals (user intent plus response harm) into a single verdict — the streaming guardrail is orthogonal to signal choice and instead governs the WHEN and granularity of moderation over a live token stream. For agent systems this yields a concrete pattern for any streaming surface: buffer to the nearest semantic boundary, overlap the guard\'s evaluation with continued decode so safety costs no perceived latency, and gate release chunk-by-chunk rather than all-or-nothing at end of response.',
  panels: new Map([
    ['typescript', {
      panelId: 'typescript',
      explanation: 'Implementation angle: wrap any token stream in a waiting buffer that accumulates until a sentence boundary, dispatch the guard on the completed prefix while the model keeps decoding, and only yield the chunk once verified. async function* guarded(stream, guard){ let buf=\'\'; for await (const tok of stream){ buf+=tok; if(/[.!?]\\s$/.test(buf)){ const chunk=buf; buf=\'\'; const verdict=await guard(chunk); if(verdict.unsafe) return; yield chunk; } } if(buf && !(await guard(buf)).unsafe) yield buf; } The key is that guard(chunk) runs concurrently with the next tokens arriving, so the one-sentence offset masks guard latency; release is chunk-by-chunk, never all-or-nothing at stream end.',
    }],
  ]),
  relationships: [
    {
      type: 'cross-reference',
      targetId: 'agent-joint-intent-harm-defense',
      description: 'Both are LLM safety-moderation mechanisms on different axes: joint intent-harm defense decides WHICH signals to fuse (user intent plus response harm) into a verdict, while the streaming guardrail decides WHEN and at what granularity to render that verdict over a live stream — orthogonal choices that compose in a single moderation stack.',
    },
    {
      type: 'analogy',
      targetId: 'agent-semantic-early-stopping',
      description: 'Both make a control decision from incremental semantic assessment mid-generation: semantic early-stopping halts decoding once enough has been produced, while the streaming guardrail releases a buffered sentence chunk once its prefix verifies — each overlaps evaluation with ongoing decode to hide latency behind generation.',
    },
    {
      type: 'cross-reference',
      targetId: 'agent-capability-gate-authorization',
      description: 'A sibling security-wing distinction that separates a policy dimension usually conflated: capability-gate authorization splits gating from authorizing, and the streaming guardrail splits when-to-moderate from whether-to-moderate, each recovering precision by decoupling two questions.',
    },
    {
      type: "cross-reference",
      targetId: "agent-stored-prompt-injection",
      description: "Two ends of the moderation stack: the streaming guardrail moderates the model's OUTPUT content as it is generated (deciding WHEN to intervene at a sentence boundary), while stored prompt injection is an INPUT-side attack persisting in durable state and re-ingested on load. Output content-harm filtering and input-attack detection are complementary trust boundaries, not substitutes.",
    },
  ],
  complexPlanePosition: {
    real,
    imaginary,
    magnitude: Math.sqrt(real * real + imaginary * imaginary),
    angle: Math.atan2(imaginary, real),
  },
};
