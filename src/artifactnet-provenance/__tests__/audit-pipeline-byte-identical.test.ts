/**
 * Audit-pipeline byte-identical test (CAPCOM Gate G13 hard-preservation).
 *
 * The provenance layer is a PRE-AUDIT augmentation. Existing audit pipeline
 * source files MUST be byte-identical before vs after this module runs, AND
 * before vs after the rest of the provenance test suite runs.
 *
 * We hash every file under the existing-audit pipeline paths, run the full
 * provenance public API, then re-hash. The two hash trees must match exactly.
 *
 * Pipeline paths covered (existing audit surface):
 *   - src/memory/grove-format.ts
 *   - src/skilldex-auditor/  (recursive)
 *
 * If either of those paths is mutated by anything in this module, this test
 * fails immediately — the gate is hard.
 */

import { describe, expect, it } from 'vitest';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

import {
  composeWithAudit,
  verifyProvenance,
} from '../grove-audit-prehook.js';
import { extractResidualSignature } from '../forensic-residual-detector.js';
import { classifySignature } from '../sonics-detector.js';
import type { Asset, ExistingAudit } from '../types.js';

const REPO_ROOT = path.resolve(__dirname, '..', '..', '..');

const PIPELINE_TARGETS = [
  path.join(REPO_ROOT, 'src', 'memory', 'grove-format.ts'),
  path.join(REPO_ROOT, 'src', 'skilldex-auditor'),
];

interface HashEntry {
  readonly relpath: string;
  readonly sha256: string;
  readonly size: number;
}

function sha256OfFile(fp: string): string {
  const h = crypto.createHash('sha256');
  h.update(fs.readFileSync(fp));
  return h.digest('hex');
}

function hashTree(targets: ReadonlyArray<string>): HashEntry[] {
  const out: HashEntry[] = [];
  const stack: string[] = [];
  for (const t of targets) {
    if (!fs.existsSync(t)) continue;
    const stat = fs.statSync(t);
    if (stat.isFile()) {
      out.push({
        relpath: path.relative(REPO_ROOT, t),
        sha256: sha256OfFile(t),
        size: stat.size,
      });
    } else if (stat.isDirectory()) {
      stack.push(t);
    }
  }
  while (stack.length > 0) {
    const dir = stack.pop()!;
    for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
      const fp = path.join(dir, ent.name);
      if (ent.isDirectory()) {
        stack.push(fp);
      } else if (ent.isFile()) {
        const stat = fs.statSync(fp);
        out.push({
          relpath: path.relative(REPO_ROOT, fp),
          sha256: sha256OfFile(fp),
          size: stat.size,
        });
      }
    }
  }
  out.sort((a, b) => a.relpath.localeCompare(b.relpath));
  return out;
}

describe('Gate G13 — audit-pipeline byte-identical', () => {
  it('hash-tree of existing audit pipeline is unchanged after provenance run', () => {
    const before = hashTree(PIPELINE_TARGETS);
    expect(before.length).toBeGreaterThan(0);

    // Exercise the entire provenance public surface.
    const sampleAudit: ExistingAudit = {
      timestamp: '1970-01-01T00:00:00.000Z',
      inspected: 1,
      findings: [],
      disabled: false,
      summary: { pass: 0, warn: 0, fail: 0 },
    };
    const assets: Asset[] = [
      { id: 'a', kind: 'text', content: 'Hello world. This is a test.' },
      {
        id: 'b',
        kind: 'audio',
        content: Array.from({ length: 256 }, (_, i) => Math.sin(i * 0.1)),
      },
      {
        id: 'c',
        kind: 'image',
        content: new Uint8Array(64).map((_, i) => i & 0xff),
      },
    ];
    for (const a of assets) {
      const sig = extractResidualSignature(a);
      classifySignature(sig);
      verifyProvenance(a);
    }
    composeWithAudit(sampleAudit, assets);

    const after = hashTree(PIPELINE_TARGETS);
    expect(after).toEqual(before);
  });

  it('module surface contains zero references to forbidden src/ trees', () => {
    const moduleDir = path.resolve(__dirname, '..');
    const offenders: string[] = [];
    const stack: string[] = [moduleDir];
    while (stack.length > 0) {
      const dir = stack.pop()!;
      for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
        const fp = path.join(dir, ent.name);
        if (ent.isDirectory()) {
          stack.push(fp);
          continue;
        }
        if (!ent.isFile() || !fp.endsWith('.ts')) continue;
        // Skip THIS file — it intentionally documents the rule.
        if (fp === __filename) continue;
        const text = fs.readFileSync(fp, 'utf8');
        if (/src\/(orchestration|dacp|capcom)/.test(text)) {
          offenders.push(fp);
        }
      }
    }
    expect(offenders).toEqual([]);
  });

  it('module performs zero filesystem writes in source files', () => {
    const moduleDir = path.resolve(__dirname, '..');
    const offenders: string[] = [];
    const stack: string[] = [moduleDir];
    while (stack.length > 0) {
      const dir = stack.pop()!;
      for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
        const fp = path.join(dir, ent.name);
        if (ent.isDirectory()) {
          if (ent.name === '__tests__') continue;
          stack.push(fp);
          continue;
        }
        if (!ent.isFile() || !fp.endsWith('.ts')) continue;
        const text = fs.readFileSync(fp, 'utf8');
        if (
          /fs\.(writeFile|appendFile|writeFileSync|appendFileSync|mkdir|mkdirSync|rm|rmSync|unlink|unlinkSync)/.test(
            text,
          )
        ) {
          offenders.push(fp);
        }
      }
    }
    expect(offenders).toEqual([]);
  });
});
