import { describe, it, expect } from 'vitest';
import * as curlExports from '../../src/curl/index.js';
import * as webExports from '../../src/web-automation/index.js';
import * as siteExports from '../../src/site/index.js';
import * as securityExports from '../../src/security/index.js';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

describe('v1.56 cross-domain barrel validation', () => {
  describe('barrel export collision detection (VALID-02)', () => {
    it('curl and web-automation barrels have zero overlapping export names', () => {
      const curlNames = new Set(Object.keys(curlExports));
      const webNames = new Set(Object.keys(webExports));
      const collisions = [...curlNames].filter(n => webNames.has(n));
      expect(collisions).toEqual([]);
    });

    it('curl barrel has no collisions with site barrel', () => {
      const curlNames = new Set(Object.keys(curlExports));
      const siteNames = new Set(Object.keys(siteExports));
      const collisions = [...curlNames].filter(n => siteNames.has(n));
      expect(collisions).toEqual([]);
    });

    it('curl barrel has no collisions with security barrel', () => {
      const curlNames = new Set(Object.keys(curlExports));
      const securityNames = new Set(Object.keys(securityExports));
      const collisions = [...curlNames].filter(n => securityNames.has(n));
      expect(collisions).toEqual([]);
    });

    it('web-automation barrel has no collisions with site barrel', () => {
      const webNames = new Set(Object.keys(webExports));
      const siteNames = new Set(Object.keys(siteExports));
      const collisions = [...webNames].filter(n => siteNames.has(n));
      expect(collisions).toEqual([]);
    });

    it('web-automation barrel has no collisions with security barrel', () => {
      const webNames = new Set(Object.keys(webExports));
      const securityNames = new Set(Object.keys(securityExports));
      const collisions = [...webNames].filter(n => securityNames.has(n));
      expect(collisions).toEqual([]);
    });

    it('bbs-pack has no barrel index.ts (types are module-scoped)', () => {
      const barrelPath = join(process.cwd(), 'src', 'bbs-pack', 'index.ts');
      expect(existsSync(barrelPath)).toBe(false);
    });
  });

  describe('domain-prefixed naming convention (VALID-03)', () => {
    const CURL_FUNCTION_ALLOWLIST = [
      'httpRequest', 'httpGet', 'httpPost', 'httpPut', 'httpDelete', 'httpPatch',
      'validateUrl', 'isPrivateIp',
      'buildBasicAuth', 'buildBearerAuth', 'buildDigestAuth', 'buildAuthHeaders',
      'redactHeaders', 'computeDigestResponse',
      'createProxyDispatcher', 'createHttpProxyDispatcher', 'createSocksProxyDispatcher',
      'createCertAgent',
      'curlLabs', 'DEFAULT_SECURITY_POLICY',
    ];

    const WEB_FUNCTION_ALLOWLIST = [
      'parseResponse', 'detectFormat',
      'evaluateAssertion', 'evaluateAssertions',
      'loadChainConfig',
    ];

    it('every uppercase-starting non-function export from curl barrel starts with Curl', () => {
      const allNames = Object.keys(curlExports);
      const typeNames = allNames.filter(
        n => n[0] === n[0].toUpperCase() && !CURL_FUNCTION_ALLOWLIST.includes(n)
      );
      const unprefixed = typeNames.filter(t => !t.startsWith('Curl'));
      expect(unprefixed, `Non-Curl-prefixed type exports: ${unprefixed.join(', ')}`).toEqual([]);
    });

    it('every uppercase-starting non-function export from web-automation barrel starts with Web', () => {
      const allNames = Object.keys(webExports);
      const typeNames = allNames.filter(
        n => n[0] === n[0].toUpperCase() && !WEB_FUNCTION_ALLOWLIST.includes(n)
      );
      const unprefixed = typeNames.filter(t => !t.startsWith('Web'));
      expect(unprefixed, `Non-Web-prefixed type exports: ${unprefixed.join(', ')}`).toEqual([]);
    });

    it('BBS shared types all carry Bbs prefix', () => {
      const sharedDir = join(process.cwd(), 'src', 'bbs-pack', 'shared');
      const tsFiles = readdirSync(sharedDir).filter(f => f.endsWith('.ts'));

      const exportedTypes: string[] = [];
      for (const file of tsFiles) {
        const content = readFileSync(join(sharedDir, file), 'utf-8');
        // Match exported type/interface/enum names
        const typeMatches = content.matchAll(/export\s+(?:type|interface|enum)\s+(\w+)/g);
        for (const match of typeMatches) {
          exportedTypes.push(match[1]);
        }
      }

      expect(exportedTypes.length).toBeGreaterThan(0);
      const unprefixed = exportedTypes.filter(t => !t.startsWith('Bbs'));
      expect(unprefixed, `Non-Bbs-prefixed type exports: ${unprefixed.join(', ')}`).toEqual([]);
    });
  });
});
