/**
 * grove-audit-prehook test suite.
 *
 * Covers `verifyProvenance`, `composeWithAudit`, and `preAuditHook`. The key
 * preservation property: with the flag off, `composeWithAudit()` returns its
 * input unchanged (referential equality preserved); the existing audit
 * pipeline observes no behavioural change.
 */

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import {
  composeWithAudit,
  preAuditHook,
  verifyProvenance,
} from '../grove-audit-prehook.js';
import type { Asset, ExistingAudit } from '../types.js';

let tmpRoot: string;
let configPath: string;

function writeConfig(enabled: boolean): void {
  const cfg = {
    'gsd-skill-creator': {
      'upstream-intelligence': {
        'artifactnet-provenance': { enabled },
      },
    },
  };
  fs.writeFileSync(configPath, JSON.stringify(cfg));
}

beforeEach(() => {
  tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'artifactnet-prehook-'));
  configPath = path.join(tmpRoot, 'config.json');
});

afterEach(() => {
  fs.rmSync(tmpRoot, { recursive: true, force: true });
});

const SAMPLE_AUDIT: ExistingAudit = Object.freeze({
  timestamp: '1970-01-01T00:00:00.000Z',
  inspected: 2,
  findings: Object.freeze([
    Object.freeze({ ruleId: 'frontmatter.name', severity: 'pass' }),
  ]),
  disabled: false,
  summary: Object.freeze({ pass: 1, warn: 0, fail: 0 }),
});

const REAL_ASSET: Asset = {
  id: 'asset-real',
  kind: 'text',
  content:
    'I went down to the river yesterday and watched a heron stand utterly still for thirteen minutes. Strange afternoon. The clouds split open just long enough to ruin everyone\'s plans.',
};

const SYNTHETIC_ASSET: Asset = {
  id: 'asset-synth',
  kind: 'text',
  content:
    'The system provides a comprehensive solution for the user. The platform enables an efficient workflow for the user. The process supports a robust framework for the user. The user facilitates a streamlined approach for the user.',
};

// ---------- verifyProvenance ----------

describe('verifyProvenance — flag off', () => {
  it('returns disabled finding when config absent', () => {
    const f = verifyProvenance(REAL_ASSET, path.join(tmpRoot, 'absent.json'));
    expect(f.disabled).toBe(true);
    expect(f.verdict).toBe('unknown');
    expect(f.confidence).toBe(0);
    expect(f.assetId).toBe('asset-real');
  });

  it('returns disabled finding when flag false', () => {
    writeConfig(false);
    const f = verifyProvenance(REAL_ASSET, configPath);
    expect(f.disabled).toBe(true);
    expect(f.verdict).toBe('unknown');
  });
});

describe('verifyProvenance — flag on', () => {
  it('classifies a synthetic-looking text', () => {
    writeConfig(true);
    const f = verifyProvenance(SYNTHETIC_ASSET, configPath);
    expect(f.disabled).toBe(false);
    expect(['synthetic', 'partial']).toContain(f.verdict);
    expect(f.signature.kind).toBe('text');
  });

  it('classifies a real-looking text', () => {
    writeConfig(true);
    const f = verifyProvenance(REAL_ASSET, configPath);
    expect(f.disabled).toBe(false);
    expect(['real', 'partial']).toContain(f.verdict);
  });
});

// ---------- composeWithAudit ----------

describe('composeWithAudit — flag off', () => {
  it('returns the input audit by reference (no clone)', () => {
    const out = composeWithAudit(
      SAMPLE_AUDIT,
      [REAL_ASSET, SYNTHETIC_ASSET],
      path.join(tmpRoot, 'absent.json'),
    );
    expect(out).toBe(SAMPLE_AUDIT);
  });

  it('does not introduce a preAudit slot', () => {
    writeConfig(false);
    const out = composeWithAudit(SAMPLE_AUDIT, [REAL_ASSET], configPath);
    expect(out).toBe(SAMPLE_AUDIT);
    expect(out.preAudit).toBeUndefined();
  });
});

describe('composeWithAudit — flag on', () => {
  it('appends a preAudit array of provenance findings', () => {
    writeConfig(true);
    const out = composeWithAudit(
      SAMPLE_AUDIT,
      [REAL_ASSET, SYNTHETIC_ASSET],
      configPath,
    );
    expect(out).not.toBe(SAMPLE_AUDIT);
    expect(out.preAudit?.length).toBe(2);
    expect(out.findings).toBe(SAMPLE_AUDIT.findings);
    expect(out.summary).toEqual(SAMPLE_AUDIT.summary);
    expect(out.disabled).toBe(SAMPLE_AUDIT.disabled);
    expect(out.timestamp).toBe(SAMPLE_AUDIT.timestamp);
    expect(out.inspected).toBe(SAMPLE_AUDIT.inspected);
  });

  it('does not mutate the input audit', () => {
    writeConfig(true);
    const before = JSON.stringify(SAMPLE_AUDIT);
    composeWithAudit(SAMPLE_AUDIT, [REAL_ASSET], configPath);
    const after = JSON.stringify(SAMPLE_AUDIT);
    expect(after).toBe(before);
  });
});

// ---------- preAuditHook wrapper ----------

describe('preAuditHook', () => {
  it('passes through when flag is off, calling existing audit unchanged', async () => {
    let calls = 0;
    const existing = async (): Promise<ExistingAudit> => {
      calls += 1;
      return SAMPLE_AUDIT;
    };
    const wrapped = preAuditHook(
      existing,
      () => [REAL_ASSET],
      path.join(tmpRoot, 'absent.json'),
    );
    const out = await wrapped();
    expect(out).toBe(SAMPLE_AUDIT);
    expect(calls).toBe(1);
  });

  it('augments with preAudit when flag is on', async () => {
    writeConfig(true);
    const existing = async (): Promise<ExistingAudit> => SAMPLE_AUDIT;
    const wrapped = preAuditHook(
      existing,
      () => [REAL_ASSET, SYNTHETIC_ASSET],
      configPath,
    );
    const out = await wrapped();
    expect(out.preAudit?.length).toBe(2);
  });
});

// ---------- ProvenanceVerdict JSON shape round-trip ----------

describe('ProvenanceFinding JSON round-trip', () => {
  it('serialises and deserialises without information loss', () => {
    writeConfig(true);
    const f = verifyProvenance(SYNTHETIC_ASSET, configPath);
    const json = JSON.stringify(f);
    const parsed = JSON.parse(json);
    expect(parsed.assetId).toBe(f.assetId);
    expect(parsed.verdict).toBe(f.verdict);
    expect(parsed.confidence).toBe(f.confidence);
    expect(parsed.disabled).toBe(f.disabled);
    expect(parsed.signature.kind).toBe(f.signature.kind);
  });
});
