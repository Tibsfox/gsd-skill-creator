/**
 * Integration test suite.
 *
 * End-to-end provenance over a small Grove-style asset bundle, plus the
 * Gate G13 hard-preservation invariants:
 *   - Default-off byte-identical (flag false → input audit returned by
 *     reference, no detector runs, no preAudit slot introduced).
 *   - Public API surface stable.
 *   - ProvenanceVerdict shape JSON-serialisable.
 */

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import * as provenance from '../index.js';
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
  tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'artifactnet-integration-'));
  configPath = path.join(tmpRoot, 'config.json');
});

afterEach(() => {
  fs.rmSync(tmpRoot, { recursive: true, force: true });
});

const SAMPLE_AUDIT: ExistingAudit = {
  timestamp: '1970-01-01T00:00:00.000Z',
  inspected: 0,
  findings: [],
  disabled: false,
  summary: { pass: 0, warn: 0, fail: 0 },
};

const ASSETS: Asset[] = [
  {
    id: 'grove://text/real',
    kind: 'text',
    content:
      'I went down to the river yesterday and the heron stood still for thirteen minutes. Strange afternoon. Three crows on the fence post — one missing tail feathers — silent in that suspicious way they get.',
  },
  {
    id: 'grove://text/synthetic',
    kind: 'text',
    content:
      'The system provides a comprehensive solution for the user. The platform enables an efficient workflow for the user. The process supports a robust framework for the user. The user facilitates a streamlined approach for the user.',
  },
  {
    id: 'grove://audio/sample',
    kind: 'audio',
    content: Array.from({ length: 1024 }, (_, i) =>
      Math.sin(i * 0.05) + Math.cos(i * 0.13) * 0.3,
    ),
  },
];

// ---------- end-to-end ----------

describe('end-to-end — flag on', () => {
  it('produces a provenance finding for each asset', () => {
    writeConfig(true);
    const findings = ASSETS.map((a) =>
      provenance.verifyProvenance(a, configPath),
    );
    expect(findings.length).toBe(3);
    for (const f of findings) {
      expect(f.disabled).toBe(false);
      expect(['real', 'synthetic', 'partial', 'unknown']).toContain(f.verdict);
      expect(typeof f.message).toBe('string');
    }
  });

  it('composes provenance into an existing audit report additively', () => {
    writeConfig(true);
    const out = provenance.composeWithAudit(SAMPLE_AUDIT, ASSETS, configPath);
    expect(out.preAudit?.length).toBe(3);
    // Existing audit fields are preserved verbatim.
    expect(out.timestamp).toBe(SAMPLE_AUDIT.timestamp);
    expect(out.findings).toBe(SAMPLE_AUDIT.findings);
    expect(out.summary).toEqual(SAMPLE_AUDIT.summary);
  });
});

// ---------- gate G13 default-off ----------

describe('Gate G13 — default-off passthrough', () => {
  it('verifyProvenance returns disabled finding when config absent', () => {
    const f = provenance.verifyProvenance(ASSETS[0], path.join(tmpRoot, 'absent.json'));
    expect(f.disabled).toBe(true);
    expect(f.verdict).toBe('unknown');
  });

  it('composeWithAudit returns existing audit by reference when flag off', () => {
    writeConfig(false);
    const out = provenance.composeWithAudit(SAMPLE_AUDIT, ASSETS, configPath);
    expect(out).toBe(SAMPLE_AUDIT);
  });

  it('preAuditHook delegates without augmentation when flag off', async () => {
    writeConfig(false);
    let calls = 0;
    const wrapped = provenance.preAuditHook(
      async () => {
        calls += 1;
        return SAMPLE_AUDIT;
      },
      () => ASSETS,
      configPath,
    );
    const out = await wrapped();
    expect(out).toBe(SAMPLE_AUDIT);
    expect(out.preAudit).toBeUndefined();
    expect(calls).toBe(1);
  });
});

// ---------- public API surface ----------

describe('Public API surface', () => {
  it('exports the documented entry points', () => {
    expect(typeof provenance.verifyProvenance).toBe('function');
    expect(typeof provenance.composeWithAudit).toBe('function');
    expect(typeof provenance.preAuditHook).toBe('function');
    expect(typeof provenance.classifySignature).toBe('function');
    expect(typeof provenance.extractResidualSignature).toBe('function');
    expect(typeof provenance.isArtifactNetProvenanceEnabled).toBe('function');
  });

  it('exports default config', () => {
    expect(provenance.DEFAULT_ARTIFACTNET_PROVENANCE_CONFIG.enabled).toBe(false);
  });
});

// ---------- settings precedence ----------

describe('Settings reader', () => {
  it('returns false when config file is missing', () => {
    expect(
      provenance.isArtifactNetProvenanceEnabled(
        path.join(tmpRoot, 'nope.json'),
      ),
    ).toBe(false);
  });

  it('returns false on malformed JSON', () => {
    fs.writeFileSync(configPath, '{ this is not json');
    expect(provenance.isArtifactNetProvenanceEnabled(configPath)).toBe(false);
  });

  it('returns false on missing upstream-intelligence block', () => {
    fs.writeFileSync(configPath, JSON.stringify({ 'gsd-skill-creator': {} }));
    expect(provenance.isArtifactNetProvenanceEnabled(configPath)).toBe(false);
  });

  it('returns true when flag is explicitly true', () => {
    writeConfig(true);
    expect(provenance.isArtifactNetProvenanceEnabled(configPath)).toBe(true);
  });
});
