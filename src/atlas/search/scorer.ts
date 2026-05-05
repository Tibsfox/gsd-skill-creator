/**
 * Pure ranking helpers for trigram search results.
 *
 * All functions are O(|query| * |text|) at worst and allocation-light.
 */

/**
 * Longest-common-subsequence length between query and text.
 * Returns the count of matched characters, in order.
 */
export function lcsLength(query: string, text: string): number {
  const q = query.length;
  const t = text.length;
  if (q === 0 || t === 0) return 0;
  // Use 2 rows to keep O(min(q,t)) memory.
  const prev = new Array<number>(t + 1).fill(0);
  const curr = new Array<number>(t + 1).fill(0);
  for (let i = 1; i <= q; i++) {
    for (let j = 1; j <= t; j++) {
      if (query.charCodeAt(i - 1) === text.charCodeAt(j - 1)) {
        curr[j] = prev[j - 1] + 1;
      } else {
        curr[j] = curr[j - 1] > prev[j] ? curr[j - 1] : prev[j];
      }
    }
    for (let j = 0; j <= t; j++) prev[j] = curr[j];
  }
  return prev[t];
}

/**
 * Position of first occurrence of query in text, or -1.
 * Bonus is higher when the match is closer to position 0.
 */
export function firstMatchBonus(query: string, text: string): number {
  if (query.length === 0) return 0;
  const idx = text.indexOf(query);
  if (idx < 0) return 0;
  // 1.0 at position 0, decaying to 0 as idx grows.
  return 1 / (1 + idx);
}

/**
 * Returns 1 if text equals query exactly, else 0.
 */
export function exactMatchBoost(query: string, text: string): number {
  return query === text ? 1 : 0;
}

/**
 * Composite score combining the three signals plus a length penalty so that
 * shorter, more specific matches outrank longer ones at equal LCS.
 */
export function compositeScore(query: string, text: string): number {
  const lcs = lcsLength(query, text);
  const lcsRatio = query.length === 0 ? 0 : lcs / query.length;
  const fm = firstMatchBonus(query, text);
  const em = exactMatchBoost(query, text);
  const lengthPenalty = 1 / (1 + Math.max(0, text.length - query.length) * 0.01);
  return lcsRatio * 1.0 + fm * 0.5 + em * 2.0 + lengthPenalty * 0.1;
}
