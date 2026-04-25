// CF-H-036 — 4-tier privacy taxonomy in security-hygiene SKILL.md.
//
// Verifies that the security-hygiene skill documents the A/B/C/D privacy
// tier taxonomy from OOPS-08-P03, including the canonical names (Public,
// Internal, Sensitive, Restricted), default-tier rule, and mixed-sink
// prohibition.
//
// Closes: OGA-036 (MEDIUM).

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, '..', '..', '..');
const SECURITY_HYGIENE_PATH = resolve(
  REPO_ROOT,
  'project-claude',
  'skills',
  'security-hygiene',
  'SKILL.md',
);

describe('CF-H-036: privacy taxonomy adoption in security-hygiene', () => {
  const text = readFileSync(SECURITY_HYGIENE_PATH, 'utf-8');

  it('declares a privacy tier section', () => {
    expect(text).toMatch(/Privacy Tier Taxonomy/i);
  });

  it('documents Tier A (Public)', () => {
    expect(text).toMatch(/\*\*A\*\*\s*\|\s*\*\*Public\*\*/);
    expect(text).toMatch(/no PII.*safe to publish/i);
  });

  it('documents Tier B (Internal)', () => {
    expect(text).toMatch(/\*\*B\*\*\s*\|\s*\*\*Internal\*\*/);
    expect(text).toMatch(/non-PII operational/i);
  });

  it('documents Tier C (Sensitive)', () => {
    expect(text).toMatch(/\*\*C\*\*\s*\|\s*\*\*Sensitive\*\*/);
    expect(text).toMatch(/PII|credentials|tokens/i);
  });

  it('documents Tier D (Restricted)', () => {
    expect(text).toMatch(/\*\*D\*\*\s*\|\s*\*\*Restricted\*\*/);
    expect(text).toMatch(/regulated data|Fox Companies/i);
  });

  it('declares the default tier (Tier B) for new telemetry writers', () => {
    expect(text).toMatch(/default.*Tier\s*B/i);
  });

  it('forbids mixed-tier sinks', () => {
    expect(text).toMatch(/Mixed-tier sinks are FORBIDDEN/);
  });

  it('forbids Tier D content from leaving .planning/', () => {
    expect(text).toMatch(/Tier\s*D.*MUST never leave/i);
  });

  it('preserves the existing Threat Surface section', () => {
    expect(text).toMatch(/Threat Surface/);
    expect(text).toMatch(/Path traversal/);
    expect(text).toMatch(/YAML deserialization/);
  });

  it('preserves the Staging Layer Principle', () => {
    expect(text).toMatch(/Staging Layer Principle/);
  });
});
