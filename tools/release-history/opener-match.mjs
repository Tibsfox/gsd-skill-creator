// Opener-match helpers shared between chapter.mjs (source-side preservation)
// and publish.mjs (destination-side preservation).
//
// Extracted at v1.49.836 from chapter.mjs (C04 of v1.49.585) so consumers can
// import without triggering chapter.mjs's auto-running main() side effect.

/**
 * Normalize text for opener-match comparison: collapse whitespace runs to
 * single space, strip leading UTF-8 BOM, trim. Used to compare two openers
 * tolerantly across whitespace formatting differences.
 */
export function normalizeOpener(s) {
  if (!s) return '';
  // Strip UTF-8 BOM if present.
  let t = s.charCodeAt(0) === 0xFEFF ? s.slice(1) : s;
  return t.replace(/\s+/g, ' ').trim();
}

/**
 * Decide whether the existing chapter file's first 200 bytes match the
 * shape of the generated DB-derivable opener.
 *
 * Heuristic: normalize both, take the first 100 chars, compute a Jaccard-like
 * overlap on whitespace-split tokens. >50% overlap → match (DB-derivable).
 *
 * Conservative direction: when in doubt, return false (mismatch → preserve).
 */
export function openerMatches(existingOpener, generatedOpener) {
  const a = normalizeOpener(existingOpener).slice(0, 200);
  const b = normalizeOpener(generatedOpener).slice(0, 200);
  if (!a || !b) return false;
  if (a === b) return true;

  // Token overlap (Jaccard-like on lowercased words).
  const ta = new Set(a.toLowerCase().split(/\s+/).filter(t => t.length > 1));
  const tb = new Set(b.toLowerCase().split(/\s+/).filter(t => t.length > 1));
  if (ta.size === 0 || tb.size === 0) return false;
  let intersect = 0;
  for (const t of ta) if (tb.has(t)) intersect++;
  const minSize = Math.min(ta.size, tb.size);
  const overlap = intersect / minSize;
  return overlap > 0.5;
}
