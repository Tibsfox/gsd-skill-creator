/**
 * OSV.dev vulnerability client.
 *
 * Uses the batch query endpoint to check multiple packages in one request.
 * An empty OsvVulnerability[] explicitly means "clean — no known vulnerabilities".
 */

import type { DependencyRecord, OsvVulnerability, Ecosystem } from './types.js';

/** OSV ecosystem names differ from our internal Ecosystem type. */
const OSV_ECOSYSTEM_MAP: Record<Ecosystem, string> = {
  npm: 'npm',
  pypi: 'PyPI',
  cargo: 'crates.io',
  rubygems: 'RubyGems',
  // conda packages are often also published to PyPI — best-effort mapping
  conda: 'PyPI',
};

function deriveSeverity(vuln: Record<string, unknown>): OsvVulnerability['severity'] {
  const severityArr = vuln['severity'] as Array<Record<string, unknown>> | undefined;
  if (Array.isArray(severityArr) && severityArr.length > 0) {
    const score = severityArr[0]['score'];
    if (typeof score === 'number') {
      if (score >= 9.0) return 'CRITICAL';
      if (score >= 7.0) return 'HIGH';
      if (score >= 4.0) return 'MEDIUM';
      return 'LOW';
    }
    // String CVSS score
    if (typeof score === 'string') {
      const num = parseFloat(score);
      if (!isNaN(num)) {
        if (num >= 9.0) return 'CRITICAL';
        if (num >= 7.0) return 'HIGH';
        if (num >= 4.0) return 'MEDIUM';
        return 'LOW';
      }
    }
  }
  // Fall back to database_specific.severity
  const dbSpecific = vuln['database_specific'] as Record<string, unknown> | undefined;
  if (dbSpecific) {
    const sev = String(dbSpecific['severity'] ?? '').toUpperCase();
    if (sev === 'CRITICAL' || sev === 'HIGH' || sev === 'MEDIUM' || sev === 'LOW') {
      return sev as OsvVulnerability['severity'];
    }
  }
  return 'UNKNOWN';
}

function parseVuln(raw: Record<string, unknown>): OsvVulnerability {
  const summary = String(raw['summary'] ?? raw['details'] ?? '').slice(0, 200);
  const aliases = Array.isArray(raw['aliases'])
    ? (raw['aliases'] as unknown[]).map(String)
    : [];
  return {
    id: String(raw['id'] ?? ''),
    summary,
    severity: deriveSeverity(raw),
    aliases,
  };
}

export class OsvClient {
  /**
   * Query OSV for vulnerabilities across multiple dependencies in one batch
   * request.  Returns a Map keyed by `${ecosystem}:${name}`.
   * Never throws for individual dependency errors — returns empty array instead.
   */
  async queryBatch(
    deps: DependencyRecord[],
  ): Promise<Map<string, OsvVulnerability[]>> {
    if (deps.length === 0) return new Map();

    const queries = deps.map((dep) => ({
      package: {
        name: dep.name,
        ecosystem: OSV_ECOSYSTEM_MAP[dep.ecosystem],
      },
    }));

    const url = 'https://api.osv.dev/v1/querybatch';
    let resp: Response;

    try {
      resp = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ queries }),
      });
    } catch (err) {
      // Network failure — return empty arrays for all deps (graceful degradation)
      const result = new Map<string, OsvVulnerability[]>();
      for (const dep of deps) {
        result.set(`${dep.ecosystem}:${dep.name}`, []);
      }
      return result;
    }

    const result = new Map<string, OsvVulnerability[]>();

    if (!resp.ok) {
      // API failure — graceful degradation
      for (const dep of deps) {
        result.set(`${dep.ecosystem}:${dep.name}`, []);
      }
      return result;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data = (await resp.json()) as any;
    const results: unknown[] = Array.isArray(data.results) ? data.results : [];

    for (let i = 0; i < deps.length; i++) {
      const dep = deps[i];
      const key = `${dep.ecosystem}:${dep.name}`;
      const entry = results[i] as Record<string, unknown> | undefined;
      const vulns = Array.isArray(entry?.['vulns']) ? entry['vulns'] as unknown[] : [];
      result.set(
        key,
        vulns.map((v) => parseVuln(v as Record<string, unknown>)),
      );
    }

    return result;
  }
}
