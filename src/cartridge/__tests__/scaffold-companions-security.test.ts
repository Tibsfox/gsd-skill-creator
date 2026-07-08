/**
 * AC-2 — scaffoldCompanions must not write companion files outside the cartridge
 * directory. Skill keys / agent names / team keys feed the write path directly
 * (skills/<key>.md, agents/<name>.md, teams/<key>.md), so an untrusted cartridge
 * with a traversal name like '../../evil' would escape. loadCartridge only does a
 * Zod parse (which permits any non-empty string name), so this write-time guard
 * (assertSafePath inside writeIfAbsent) is the containment for the scaffold path —
 * defense-in-depth behind the validateCartridge name check (validator.test.ts).
 */
import { mkdtempSync, mkdirSync, writeFileSync, existsSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { stringify } from 'yaml';
import { scaffoldCompanions } from '../scaffold-companions.js';

const roots: string[] = [];

function freshDir(): string {
  const d = mkdtempSync(join(tmpdir(), 'ac2-companions-'));
  roots.push(d);
  return d;
}

afterEach(() => {
  while (roots.length > 0) {
    rmSync(roots.pop()!, { recursive: true, force: true });
  }
});

function cartridgeWith(agentName: string): unknown {
  return {
    id: 'ac2-fixture',
    name: 'AC2 Fixture',
    version: '1.0.0',
    author: 'tester',
    description: 'fixture',
    trust: 'system',
    provenance: { origin: 'tester', createdAt: '2026-04-14T00:00:00Z' },
    chipsets: [
      {
        kind: 'department',
        skills: {
          'proofs-logic': {
            domain: 'mathematics',
            description: 'Formal proofs.',
            triggers: ['proof'],
            agent_affinity: agentName,
          },
        },
        agents: {
          topology: 'router',
          router_agent: agentName,
          agents: [
            { name: agentName, role: 'specialist', model: 'opus', tools: ['Read', 'Write'], is_capcom: true },
          ],
        },
        teams: {
          'proofs-team': { description: 'proof construction pipeline', agents: [agentName] },
        },
      },
      {
        kind: 'evaluation',
        pre_deploy: ['schema_valid'],
        benchmark: { trigger_accuracy_threshold: 0.85, test_cases_minimum: 25, domains_covered: ['proofs'] },
      },
    ],
  };
}

function writeCartridge(agentName: string): { dir: string; cartridgePath: string } {
  const dir = freshDir();
  const cartDir = join(dir, 'cart');
  mkdirSync(cartDir);
  writeFileSync(join(cartDir, 'cartridge.yaml'), stringify(cartridgeWith(agentName)), 'utf8');
  return { dir, cartridgePath: join(cartDir, 'cartridge.yaml') };
}

describe('scaffoldCompanions — AC-2 write containment', () => {
  it('writes companion stubs inside the cartridge dir for a safe cartridge', () => {
    const { cartridgePath } = writeCartridge('euclid');
    const result = scaffoldCompanions({ path: cartridgePath });
    expect(result.filesWritten).toContain('agents/euclid.md');
  });

  it('refuses to write outside the cartridge dir for a traversal agent name', () => {
    const { dir, cartridgePath } = writeCartridge('../../evil');
    // '../../evil' resolves ABOVE the cartridge dir → assertSafePath throws.
    expect(() => scaffoldCompanions({ path: cartridgePath })).toThrow(/escape|not within/i);
    // Nothing was written outside the cartridge directory.
    expect(existsSync(join(dir, 'evil.md'))).toBe(false);
  });
});
