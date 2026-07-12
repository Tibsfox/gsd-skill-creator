/**
 * Dup-safe, idempotent frontmatter field editor (item 7).
 *
 * Operates on the raw leading YAML frontmatter block of a SKILL.md (--- ... ---).
 * Unlike the append-only version-backfill `mergeFrontmatter` (which always
 * pushes `key: value` at the END and never updates an existing key), this
 * UPDATES an existing top-level key in place and only appends when the key is
 * absent. So flipping `status` is idempotent and can never produce a malformed
 * duplicate `status:` line. Line-based on purpose — avoids the gray-matter
 * reserialization churn that would rewrite every other field.
 *
 * @module skill/frontmatter-edit
 */

const FM_DELIM = '---';

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function needsQuoting(value: string): boolean {
  return value === '' || /[:#]/.test(value) || /^\s|\s$/.test(value);
}

/** Render a scalar, quoting only when YAML would otherwise mis-parse it. */
function yamlScalar(value: string): string {
  if (!needsQuoting(value)) return value;
  return `"${value.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;
}

function frontmatterBounds(lines: string[]): { close: number } {
  if (lines[0]?.trim() !== FM_DELIM) {
    throw new Error('content has no leading frontmatter block');
  }
  for (let i = 1; i < lines.length; i++) {
    if (lines[i].trim() === FM_DELIM) return { close: i };
  }
  throw new Error('unterminated frontmatter block');
}

/**
 * Set (update-or-append) a top-level frontmatter field. Idempotent.
 * @throws if the content has no complete leading `---` frontmatter block.
 */
export function updateFrontmatterField(content: string, key: string, value: string): string {
  const lines = content.split('\n');
  const { close } = frontmatterBounds(lines);
  const rendered = `${key}: ${yamlScalar(value)}`;
  const keyRe = new RegExp(`^${escapeRegExp(key)}\\s*:`);
  for (let i = 1; i < close; i++) {
    if (keyRe.test(lines[i])) {
      lines[i] = rendered;
      return lines.join('\n');
    }
  }
  lines.splice(close, 0, rendered);
  return lines.join('\n');
}

/** Remove a top-level frontmatter field if present. Idempotent; no-op if absent. */
export function removeFrontmatterField(content: string, key: string): string {
  const lines = content.split('\n');
  let close: number;
  try {
    ({ close } = frontmatterBounds(lines));
  } catch {
    return content;
  }
  const keyRe = new RegExp(`^${escapeRegExp(key)}\\s*:`);
  const kept = lines.filter((l, i) => !(i > 0 && i < close && keyRe.test(l)));
  return kept.join('\n');
}

/** Retirement metadata stamped into the frontmatter alongside the status flip. */
export interface RetireStamp {
  retiredAt?: string;
  reason?: string;
}

/**
 * Flip a skill's frontmatter status and manage the retirement stamps.
 * status:'retired' stamps `retired` + `retire_reason`; status:'active' clears
 * them (used by restore). NOTE: the status flip is bookkeeping — the actual
 * removal from Claude Code's auto-load path is the directory move done by the
 * caller (a `status:'retired'` marker is inert at load time).
 */
export function setSkillStatus(
  content: string,
  status: 'active' | 'retired',
  stamp?: RetireStamp,
): string {
  let out = updateFrontmatterField(content, 'status', status);
  if (status === 'retired') {
    if (stamp?.retiredAt) out = updateFrontmatterField(out, 'retired', stamp.retiredAt);
    if (stamp?.reason) out = updateFrontmatterField(out, 'retire_reason', stamp.reason);
  } else {
    out = removeFrontmatterField(out, 'retired');
    out = removeFrontmatterField(out, 'retire_reason');
  }
  return out;
}
