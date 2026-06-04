/**
 * Skills source-of-truth + research-skill disposition drift-guard
 * (Ship 2.2, milestone v1.49.974).
 *
 * Closes the clean-install reproducibility gap: 7 skills that lived only in the
 * installed .claude/skills/ tree (gitignored) were promoted into
 * project-claude/skills/ (the source-of-truth installed via install.cjs's
 * manifest autoDiscover glob for per-skill SKILL.md files). One skill
 * (uc-observatory) is intentionally KEEP-LOCAL per decision-gate D1 (coupled to
 * the parked v1.50 / Unit-Circle work). The 4 arxiv research skills were each
 * wired into their semantically-correct documented consumer ("wire all 4").
 *
 * #10461 gate-enforce-every-runnable-surface + drift-guard pairing:
 *   - Layer 1 (enforcement): named *.test.ts (NOT *.integration.test.ts), so the
 *     `root` vitest project runs it on every `npx vitest run` — pre-tag-gate
 *     step 2 + CI's test job — every ship, with no new shell step / denominator.
 *   - Layer 2 (drift-guard): pins (a) the PROMOTED set is in source-of-truth,
 *     (b) the KEEP-LOCAL boundary (uc-observatory NOT promoted — a decision, not
 *     drift), and (c) each research-skill wire (consumer references the skill).
 *     Mutation-proven: dropping a promotion, removing a wire, or promoting
 *     uc-observatory fails this test.
 *
 * See docs/skills-source-of-truth.md.
 */
import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const REPO = process.cwd();
const SOT = join(REPO, 'project-claude', 'skills');

// Promoted from .claude/skills/ into project-claude/skills/ at Ship 2.2.
const PROMOTED = [
  'adversarial-pr-review',
  'image-to-mission',
  'token-budget',
  'execution-grounded-selection',
  'intent-router',
  'skill-counterfactual-audit',
  'spectral-topology-preflight',
] as const;

// Intentionally NOT promoted — coupled to the parked v1.50 / UC work (D1).
const KEEP_LOCAL = ['uc-observatory'] as const;

// research skill -> consumer source-of-truth files that must reference it.
const WIRES: Record<string, string[]> = {
  'skill-counterfactual-audit': ['skills/skill-integration/SKILL.md'],
  'spectral-topology-preflight': ['skills/team-control/SKILL.md'],
  'intent-router': ['commands/wrap/execute.md', 'commands/wrap/verify.md'],
  'execution-grounded-selection': ['commands/wrap/verify.md'],
};

describe('Ship 2.2: skills promoted to source-of-truth', () => {
  // Anti-vacuous: pin the inventory size so an accidental list edit is caught.
  it('promotes exactly 7 skills', () => {
    expect(PROMOTED.length).toBe(7);
  });

  it.each(PROMOTED)('%s has SKILL.md in project-claude/skills/', (skill) => {
    expect(existsSync(join(SOT, skill, 'SKILL.md'))).toBe(true);
  });
});

describe('Ship 2.2: KEEP-LOCAL boundary (decision-gate D1)', () => {
  it.each(KEEP_LOCAL)('%s is intentionally NOT in source-of-truth', (skill) => {
    expect(existsSync(join(SOT, skill, 'SKILL.md'))).toBe(false);
  });
});

describe('Ship 2.2: research-skill wires (wire all 4)', () => {
  it('wires all 4 arxiv research skills', () => {
    expect(Object.keys(WIRES).sort()).toEqual(
      [
        'execution-grounded-selection',
        'intent-router',
        'skill-counterfactual-audit',
        'spectral-topology-preflight',
      ].sort(),
    );
  });

  for (const [skill, consumers] of Object.entries(WIRES)) {
    for (const rel of consumers) {
      it(`${skill} is wired into ${rel}`, () => {
        const p = join(REPO, 'project-claude', rel);
        expect(existsSync(p), `${rel} missing`).toBe(true);
        expect(readFileSync(p, 'utf8')).toContain(skill);
      });
    }
  }
});
