/**
 * skill-content-gate — the single security-hygiene gate a GENERATED skill must
 * pass before its SKILL.md is written to disk (the `discover --legacy` direct
 * write and, as defense-in-depth, the suggestion-accept path).
 *
 * There is no one reusable validator in the repo, so this composes the existing
 * pieces into one policy. It BLOCKS on structural threats (unsafe YAML tags,
 * path-traversal / invalid names, metadata-schema violations, secrets in the
 * frontmatter) and SANITIZES-AND-WARNS on in-body threats (dangerous commands,
 * prompt-injection text, arg-injection, secrets in the body) — matching the
 * security-hygiene philosophy: block only on a real reason, otherwise clean up.
 *
 * Pure module (no fs / no child_process).
 */
import { safeParseFrontmatter } from './yaml-safety.js';
import { sanitizeGeneratedContent } from './generation-safety.js';
import { sanitizeMessageText } from './message-safety.js';
import { checkInjectionRisk } from './arguments-validation.js';
import { validateSkillNameStrict } from './skill-validation.js';
import { validateSafeName } from './path-safety.js';
import { validateSkillMetadataSchema } from './skill-validation.js';
import { redactSecrets } from '../discovery/discovery-safety.js';

export interface SkillContentGateResult {
  ok: boolean;
  blockers: string[];
  warnings: string[];
  /** The content with in-body threats sanitized/redacted (frontmatter untouched). */
  sanitizedContent: string;
}

/** Split a SKILL.md into its raw frontmatter block (incl. delimiters) and body. */
function splitFrontmatter(content: string): { fmBlock: string; body: string } {
  const m = content.match(/^(\uFEFF?---\r?\n[\s\S]*?\r?\n---\r?\n?)([\s\S]*)$/);
  return m ? { fmBlock: m[1], body: m[2] } : { fmBlock: '', body: content };
}

export function gateSkillContent(input: { name: string; content: string }): SkillContentGateResult {
  const blockers: string[] = [];
  const warnings: string[] = [];

  // 1. Name safety — path traversal + official strict rules. BLOCKERS.
  const safe = validateSafeName(input.name);
  if (!safe.valid) blockers.push(`unsafe skill name: ${safe.error ?? 'invalid'}`);
  const strict = validateSkillNameStrict(input.name);
  if (!strict.valid) blockers.push(...strict.errors.map((e) => `skill name: ${e}`));

  // 2. Frontmatter must parse safely (rejects dangerous YAML tags). BLOCKER.
  const fm = safeParseFrontmatter(input.content);
  if (!fm.success) {
    blockers.push(`frontmatter: ${fm.error}`);
    // Cannot inspect metadata/body safely — return with content untouched.
    return { ok: false, blockers, warnings, sanitizedContent: input.content };
  }

  // 3. Metadata schema (description length, allowed-tools format, ...). BLOCKER.
  try {
    validateSkillMetadataSchema(fm.data);
  } catch (e) {
    blockers.push(`metadata schema: ${(e as Error).message}`);
  }

  const { fmBlock, body } = splitFrontmatter(input.content);

  // 4. Secrets in the FRONTMATTER block are a BLOCKER (config/credential leak).
  if (fmBlock && redactSecrets(fmBlock) !== fmBlock) {
    blockers.push('secret detected in frontmatter');
  }

  // 5. Dangerous commands in the body — SANITIZE-AND-WARN.
  let sanitizedBody = body;
  const dangerous = sanitizeGeneratedContent(sanitizedBody);
  if (dangerous.findings.length > 0) {
    sanitizedBody = dangerous.sanitized;
    warnings.push(`sanitized ${dangerous.findings.length} dangerous command(s) in body`);
  }

  // 6. Prompt-injection text — SANITIZE-AND-WARN (neutralized outside code fences).
  const inj = sanitizeMessageText(sanitizedBody);
  if (inj.sanitized) {
    sanitizedBody = inj.text;
    warnings.push(`neutralized prompt-injection pattern(s): ${inj.patternsFound.join(', ')}`);
  }

  // 7. Argument-injection risk ($ARGUMENTS inside !`command`) — WARN.
  if (checkInjectionRisk(sanitizedBody).risk === 'high') {
    warnings.push('argument-injection risk ($ARGUMENTS combined with !`command`)');
  }

  // 8. Secrets in the body — REDACT-AND-WARN.
  const redactedBody = redactSecrets(sanitizedBody);
  if (redactedBody !== sanitizedBody) {
    sanitizedBody = redactedBody;
    warnings.push('redacted secret(s) in body');
  }

  return {
    ok: blockers.length === 0,
    blockers,
    warnings,
    sanitizedContent: fmBlock + sanitizedBody,
  };
}
