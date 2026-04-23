/**
 * CASCADE — Tier 1 (regex+phrase+entropy) and Tier 3 (output pattern) detectors.
 *
 * Pure functions. No I/O, no globals, no network.
 *
 * @module mcp-defense/cascade/detectors
 */

import type { TierResult, KnownAttackPattern } from './types.js';

/**
 * Known tool-poisoning patterns drawn from Huang et al. 2026 STRIDE+DREAD
 * analysis of MCP. These are the highest-frequency client-side vulnerability
 * shapes — not an exhaustive catalogue, but a reasonable starter set.
 */
export const KNOWN_ATTACK_PATTERNS: KnownAttackPattern[] = [
  {
    id: 'ignore-prior',
    pattern: /\bignore\s+(?:(?:all|any|previous|prior|the|your)\s+)+(?:instructions|prompts|rules|directives)/i,
    weight: 0.8,
    description: 'Classic instruction-override attempt',
  },
  {
    id: 'system-override',
    pattern: /\b(?:system|admin|root):\s*(?:new|override|update|change)\s+(?:prompt|policy|rules)/i,
    weight: 0.85,
    description: 'System/admin role-claim override',
  },
  {
    id: 'delimiter-escape',
    pattern: /(?:```|"""|<\/?(?:system|instruction|prompt)>)/i,
    weight: 0.5,
    description: 'Delimiter-escape attempt (possible but not definitive)',
  },
  {
    id: 'role-reversal',
    pattern: /\bact\s+as\s+(?:a|an|the)\s+(?!plan|phase|wave|helpful|senior|software)/i,
    weight: 0.4,
    description: 'Role-reversal attempt (weak signal; many legitimate uses)',
  },
  {
    id: 'exfil-credential',
    pattern: /\b(?:print|output|reveal|show|display|expose|dump)\s+(?:your|the)\s+(?:system\s+)?(?:prompt|instructions|credentials|api[_\s-]?key|token|secret)/i,
    weight: 0.9,
    description: 'Credential / system-prompt exfiltration attempt',
  },
  {
    id: 'filesystem-escape',
    pattern: /(?:\.\.\/){3,}|\/etc\/(?:passwd|shadow)|\/proc\/self/i,
    weight: 0.85,
    description: 'Filesystem traversal attempt',
  },
];

/** Shannon entropy of a string (bits per character). Higher entropy = more random. */
export function shannonEntropy(s: string): number {
  if (s.length === 0) return 0;
  const freq = new Map<string, number>();
  for (const ch of s) freq.set(ch, (freq.get(ch) ?? 0) + 1);
  let entropy = 0;
  for (const n of freq.values()) {
    const p = n / s.length;
    entropy -= p * Math.log2(p);
  }
  return entropy;
}

/**
 * Tier 1 — regex + phrase weighting + entropy.
 *
 * Runs the KNOWN_ATTACK_PATTERNS, sums matched weights, and adds an
 * entropy-anomaly bonus (payloads with unusually high entropy often contain
 * obfuscated injection strings).
 */
export function tier1Detect(payload: string, threshold: number): TierResult {
  const matched: string[] = [];
  let weightSum = 0;

  for (const pat of KNOWN_ATTACK_PATTERNS) {
    if (pat.pattern.test(payload)) {
      matched.push(pat.id);
      weightSum += pat.weight;
    }
  }

  // Entropy bonus: English prose is typically 3.5-5.0 bits/char; very high
  // entropy (7+) in long payloads suggests obfuscated/encoded content.
  const entropy = shannonEntropy(payload);
  let entropyBonus = 0;
  if (payload.length > 200 && entropy > 6.5) {
    entropyBonus = Math.min(0.4, (entropy - 6.5) * 0.3);
  }

  const confidence = Math.min(1, weightSum + entropyBonus);
  const flagged = confidence >= threshold;

  const reasonParts: string[] = [];
  if (matched.length) reasonParts.push(`patterns: ${matched.join(', ')}`);
  if (entropyBonus > 0) reasonParts.push(`entropy bonus ${entropyBonus.toFixed(2)} (raw ${entropy.toFixed(2)})`);
  if (reasonParts.length === 0) reasonParts.push('no suspicious patterns detected');

  return {
    tier: 1,
    flagged,
    confidence,
    reason: reasonParts.join('; '),
    matchedPatterns: matched,
  };
}

/**
 * Tier 3 — pattern-based output filtering.
 *
 * Runs after the downstream tool's response. Catches cases where the input
 * passed Tier 1/2 but the output reveals the injection succeeded (e.g. the
 * response dumps a system prompt, reveals credentials, or contains the
 * attacker's target pattern).
 */
export function tier3Detect(response: string, threshold: number): TierResult {
  const matched: string[] = [];
  let weightSum = 0;

  const outputPatterns: Array<{ id: string; pattern: RegExp; weight: number }> = [
    // System prompt leakage
    { id: 'systemprompt-leak', pattern: /(?:you\s+are\s+a\s+(?:helpful|expert|specialized|highly)|your\s+(?:role|purpose)\s+is|system\s+prompt:)/i, weight: 0.6 },
    // Credential leakage
    { id: 'cred-leak', pattern: /(?:api[_\s-]?key|access[_\s-]?token|password|secret)\s*[:=]\s*['"]?[A-Za-z0-9_\-.]{8,}/i, weight: 0.9 },
    // Bearer/JWT token leak
    { id: 'jwt-leak', pattern: /\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\b/, weight: 0.95 },
    // Filesystem dump
    { id: 'fs-dump', pattern: /\/etc\/(?:passwd|shadow):[^\n]{10,}/, weight: 0.9 },
  ];

  for (const pat of outputPatterns) {
    if (pat.pattern.test(response)) {
      matched.push(pat.id);
      weightSum += pat.weight;
    }
  }

  const confidence = Math.min(1, weightSum);
  const flagged = confidence >= threshold;

  return {
    tier: 3,
    flagged,
    confidence,
    reason: matched.length ? `output-pattern matches: ${matched.join(', ')}` : 'no suspicious output patterns',
    matchedPatterns: matched,
  };
}
