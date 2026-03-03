import { describe, it, expect, vi, afterEach } from 'vitest';
import { OsvClient } from './osv-client.js';
import type { DependencyRecord } from './types.js';

afterEach(() => {
  vi.unstubAllGlobals();
});

const vuln1 = {
  id: 'GHSA-abcd-1234-efgh',
  summary: 'Remote code execution in lodash',
  details: 'Detailed description here',
  aliases: ['CVE-2021-23337'],
  severity: [{ type: 'CVSS_V3', score: 9.8 }],
};

const vuln2 = {
  id: 'GHSA-wxyz-5678-ijkl',
  summary: 'Prototype pollution',
  details: '',
  aliases: [],
  database_specific: { severity: 'MEDIUM' },
};

describe('OsvClient', () => {
  it('returns OsvVulnerability[] for packages with known vulns', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: () =>
          Promise.resolve({ results: [{ vulns: [vuln1, vuln2] }] }),
      }),
    );

    const client = new OsvClient();
    const dep: DependencyRecord = {
      name: 'lodash',
      version: '4.17.20',
      ecosystem: 'npm',
      sourceManifest: '/project/package.json',
    };
    const results = await client.queryBatch([dep]);
    const key = 'npm:lodash';
    expect(results.has(key)).toBe(true);
    const vulns = results.get(key)!;
    expect(vulns).toHaveLength(2);
    expect(vulns[0].id).toBe('GHSA-abcd-1234-efgh');
    expect(vulns[0].severity).toBe('CRITICAL'); // CVSS 9.8 >= 9.0
    expect(vulns[0].aliases).toContain('CVE-2021-23337');
  });

  it('returns empty array for packages with no known vulns', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ results: [{ vulns: [] }] }),
      }),
    );

    const client = new OsvClient();
    const dep: DependencyRecord = {
      name: 'requests',
      version: '2.31.0',
      ecosystem: 'pypi',
      sourceManifest: '/project/requirements.txt',
    };
    const results = await client.queryBatch([dep]);
    const vulns = results.get('pypi:requests')!;
    expect(Array.isArray(vulns)).toBe(true);
    expect(vulns).toHaveLength(0);
  });

  it('maps conda ecosystem to PyPI for OSV query', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ results: [{ vulns: [] }] }),
    });
    vi.stubGlobal('fetch', mockFetch);

    const client = new OsvClient();
    const dep: DependencyRecord = {
      name: 'numpy',
      version: '1.24.0',
      ecosystem: 'conda',
      sourceManifest: '/project/environment.yml',
    };
    await client.queryBatch([dep]);

    const [, options] = mockFetch.mock.calls[0] as [string, RequestInit];
    const body = JSON.parse(options.body as string) as { queries: Array<{ package: { ecosystem: string } }> };
    expect(body.queries[0].package.ecosystem).toBe('PyPI');
  });

  it('returns empty array for a dep when OSV returns no results entry', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ results: [{}] }),
      }),
    );

    const client = new OsvClient();
    const dep: DependencyRecord = {
      name: 'express',
      version: '4.18.2',
      ecosystem: 'npm',
      sourceManifest: '/project/package.json',
    };
    const results = await client.queryBatch([dep]);
    expect(results.get('npm:express')).toEqual([]);
  });

  it('handles CVSS severity scoring correctly', async () => {
    const makeVuln = (score: number, id: string) => ({
      id,
      summary: 'test',
      details: '',
      aliases: [],
      severity: [{ type: 'CVSS_V3', score }],
    });

    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: () =>
          Promise.resolve({
            results: [
              {
                vulns: [
                  makeVuln(9.1, 'GHSA-0001'),  // CRITICAL
                  makeVuln(7.5, 'GHSA-0002'),  // HIGH
                  makeVuln(5.3, 'GHSA-0003'),  // MEDIUM
                  makeVuln(2.1, 'GHSA-0004'),  // LOW
                ],
              },
            ],
          }),
      }),
    );

    const client = new OsvClient();
    const dep: DependencyRecord = {
      name: 'test-pkg',
      version: '1.0.0',
      ecosystem: 'npm',
      sourceManifest: '/project/package.json',
    };
    const results = await client.queryBatch([dep]);
    const vulns = results.get('npm:test-pkg')!;
    expect(vulns[0].severity).toBe('CRITICAL');
    expect(vulns[1].severity).toBe('HIGH');
    expect(vulns[2].severity).toBe('MEDIUM');
    expect(vulns[3].severity).toBe('LOW');
  });
});
