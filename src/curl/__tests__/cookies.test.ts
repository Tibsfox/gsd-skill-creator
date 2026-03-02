/**
 * Tests for CurlCookieJar Netscape-format cookie persistence.
 *
 * Covers parsing, serialization, round-trip, URL matching by
 * domain/path/secure/expiry, subdomain-attack prevention, and
 * cookie replacement logic.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('node:fs', () => ({
  readFileSync: vi.fn(),
  writeFileSync: vi.fn(),
}));

import { readFileSync, writeFileSync } from 'node:fs';
import { CurlCookieJar } from '../cookies.js';

const mockedReadFile = vi.mocked(readFileSync);
const mockedWriteFile = vi.mocked(writeFileSync);

beforeEach(() => {
  vi.clearAllMocks();
});

describe('CurlCookieJar (CURL-03)', () => {
  describe('load() -- Netscape format parsing', () => {
    it('parses standard Netscape cookie lines with correct fields', () => {
      mockedReadFile.mockReturnValue(
        '# Netscape HTTP Cookie File\n' +
        '.example.com\tTRUE\t/\tFALSE\t0\tsession_id\tabc123\n' +
        'api.example.com\tFALSE\t/api\tTRUE\t1800000000\ttoken\txyz789\n',
      );

      const jar = new CurlCookieJar();
      jar.load('/tmp/cookies.txt');
      const all = jar.getAll();

      expect(all).toHaveLength(2);
      expect(all[0]).toEqual({
        domain: '.example.com',
        includeSubdomains: true,
        path: '/',
        secure: false,
        expiry: 0,
        name: 'session_id',
        value: 'abc123',
        httpOnly: false,
      });
      expect(all[1]).toEqual({
        domain: 'api.example.com',
        includeSubdomains: false,
        path: '/api',
        secure: true,
        expiry: 1800000000,
        name: 'token',
        value: 'xyz789',
        httpOnly: false,
      });
    });

    it('parses #HttpOnly_ prefix lines as httpOnly: true with domain extracted', () => {
      mockedReadFile.mockReturnValue(
        '#HttpOnly_.secure.com\tTRUE\t/\tTRUE\t0\tsid\thttponly_val\n',
      );

      const jar = new CurlCookieJar();
      jar.load('/tmp/cookies.txt');
      const all = jar.getAll();

      expect(all).toHaveLength(1);
      expect(all[0].httpOnly).toBe(true);
      expect(all[0].domain).toBe('.secure.com');
      expect(all[0].value).toBe('httponly_val');
    });

    it('skips comment lines (# ...) and blank lines', () => {
      mockedReadFile.mockReturnValue(
        '# Netscape HTTP Cookie File\n' +
        '# This is a comment\n' +
        '\n' +
        '   \n' +
        '.example.com\tTRUE\t/\tFALSE\t0\tname\tvalue\n',
      );

      const jar = new CurlCookieJar();
      jar.load('/tmp/cookies.txt');
      expect(jar.getAll()).toHaveLength(1);
    });

    it('skips lines with fewer than 7 TAB-separated fields', () => {
      mockedReadFile.mockReturnValue(
        '.example.com\tTRUE\t/\tFALSE\t0\tshort\n' +
        '.example.com\tTRUE\t/\tFALSE\t0\tok\tvalue\n',
      );

      const jar = new CurlCookieJar();
      jar.load('/tmp/cookies.txt');
      expect(jar.getAll()).toHaveLength(1);
      expect(jar.getAll()[0].name).toBe('ok');
    });

    it('handles case-insensitive boolean fields (true/True/TRUE)', () => {
      mockedReadFile.mockReturnValue(
        '.example.com\ttrue\t/\tTrue\t0\tname\tvalue\n',
      );

      const jar = new CurlCookieJar();
      jar.load('/tmp/cookies.txt');
      const cookie = jar.getAll()[0];
      expect(cookie.includeSubdomains).toBe(true);
      expect(cookie.secure).toBe(true);
    });
  });

  describe('save() -- Netscape format serialization', () => {
    it('writes valid Netscape format header + TAB-separated cookie lines', () => {
      const jar = new CurlCookieJar();
      jar.addCookie({
        domain: '.example.com',
        includeSubdomains: true,
        path: '/',
        secure: false,
        expiry: 0,
        name: 'sid',
        value: 'abc',
      });

      jar.save('/tmp/out.txt');

      expect(mockedWriteFile).toHaveBeenCalledTimes(1);
      const written = mockedWriteFile.mock.calls[0][1] as string;
      expect(written).toContain('# Netscape HTTP Cookie File');
      expect(written).toContain('.example.com\tTRUE\t/\tFALSE\t0\tsid\tabc');
    });

    it('writes #HttpOnly_ prefix for httpOnly cookies', () => {
      const jar = new CurlCookieJar();
      jar.addCookie({
        domain: '.secure.com',
        includeSubdomains: true,
        path: '/',
        secure: true,
        expiry: 0,
        name: 'tok',
        value: 'xyz',
        httpOnly: true,
      });

      jar.save('/tmp/out.txt');
      const written = mockedWriteFile.mock.calls[0][1] as string;
      expect(written).toContain('#HttpOnly_.secure.com\tTRUE\t/\tTRUE\t0\ttok\txyz');
    });
  });

  describe('round-trip: load -> save -> load', () => {
    it('produces identical cookies after round-trip', () => {
      const original =
        '.example.com\tTRUE\t/\tFALSE\t0\tsid\tabc123\n' +
        '#HttpOnly_.secure.com\tTRUE\t/app\tTRUE\t1800000000\ttoken\txyz\n';

      mockedReadFile.mockReturnValue(original);

      const jar1 = new CurlCookieJar();
      jar1.load('/tmp/cookies.txt');
      jar1.save('/tmp/cookies2.txt');

      const savedContent = mockedWriteFile.mock.calls[0][1] as string;

      // Load the saved content
      mockedReadFile.mockReturnValue(savedContent);
      const jar2 = new CurlCookieJar();
      jar2.load('/tmp/cookies2.txt');

      expect(jar2.getAll()).toEqual(jar1.getAll());
    });
  });

  describe('getCookiesForUrl() -- domain matching', () => {
    let jar: CurlCookieJar;

    beforeEach(() => {
      jar = new CurlCookieJar();
    });

    it('matches exact domain', () => {
      jar.addCookie({
        domain: 'example.com', includeSubdomains: false,
        path: '/', secure: false, expiry: 0, name: 'a', value: '1',
      });

      expect(jar.getCookiesForUrl('http://example.com/')).toHaveLength(1);
    });

    it('matches subdomain when includeSubdomains=true', () => {
      jar.addCookie({
        domain: 'example.com', includeSubdomains: true,
        path: '/', secure: false, expiry: 0, name: 'a', value: '1',
      });

      expect(jar.getCookiesForUrl('http://sub.example.com/')).toHaveLength(1);
      expect(jar.getCookiesForUrl('http://deep.sub.example.com/')).toHaveLength(1);
    });

    it('does NOT match subdomain when includeSubdomains=false', () => {
      jar.addCookie({
        domain: 'example.com', includeSubdomains: false,
        path: '/', secure: false, expiry: 0, name: 'a', value: '1',
      });

      expect(jar.getCookiesForUrl('http://sub.example.com/')).toHaveLength(0);
    });

    it('prevents domain suffix attack: evil.com does NOT match notevil.com', () => {
      jar.addCookie({
        domain: 'evil.com', includeSubdomains: true,
        path: '/', secure: false, expiry: 0, name: 'track', value: 'x',
      });

      expect(jar.getCookiesForUrl('http://notevil.com/')).toHaveLength(0);
      expect(jar.getCookiesForUrl('http://evil.com/')).toHaveLength(1);
      expect(jar.getCookiesForUrl('http://sub.evil.com/')).toHaveLength(1);
    });
  });

  describe('getCookiesForUrl() -- path matching', () => {
    it('matches path prefix', () => {
      const jar = new CurlCookieJar();
      jar.addCookie({
        domain: 'example.com', includeSubdomains: false,
        path: '/api', secure: false, expiry: 0, name: 'a', value: '1',
      });

      expect(jar.getCookiesForUrl('http://example.com/api/users')).toHaveLength(1);
      expect(jar.getCookiesForUrl('http://example.com/api')).toHaveLength(1);
      expect(jar.getCookiesForUrl('http://example.com/other')).toHaveLength(0);
    });
  });

  describe('getCookiesForUrl() -- secure flag', () => {
    it('filters secure cookies for non-HTTPS URLs', () => {
      const jar = new CurlCookieJar();
      jar.addCookie({
        domain: 'example.com', includeSubdomains: false,
        path: '/', secure: true, expiry: 0, name: 'sec', value: '1',
      });

      expect(jar.getCookiesForUrl('http://example.com/')).toHaveLength(0);
      expect(jar.getCookiesForUrl('https://example.com/')).toHaveLength(1);
    });
  });

  describe('getCookiesForUrl() -- expiry', () => {
    it('filters expired cookies (expiry > 0 and < now)', () => {
      const jar = new CurlCookieJar();
      jar.addCookie({
        domain: 'example.com', includeSubdomains: false,
        path: '/', secure: false, expiry: 1, name: 'old', value: '1',
      });

      expect(jar.getCookiesForUrl('http://example.com/')).toHaveLength(0);
    });

    it('session cookies (expiry=0) never expire', () => {
      const jar = new CurlCookieJar();
      jar.addCookie({
        domain: 'example.com', includeSubdomains: false,
        path: '/', secure: false, expiry: 0, name: 'sess', value: '1',
      });

      expect(jar.getCookiesForUrl('http://example.com/')).toHaveLength(1);
    });

    it('includes cookies with future expiry', () => {
      const jar = new CurlCookieJar();
      jar.addCookie({
        domain: 'example.com', includeSubdomains: false,
        path: '/', secure: false, expiry: Math.floor(Date.now() / 1000) + 86400, name: 'future', value: '1',
      });

      expect(jar.getCookiesForUrl('http://example.com/')).toHaveLength(1);
    });
  });

  describe('buildCookieHeader()', () => {
    it('returns "name=value; name2=value2" format', () => {
      const jar = new CurlCookieJar();
      jar.addCookie({
        domain: 'example.com', includeSubdomains: false,
        path: '/', secure: false, expiry: 0, name: 'a', value: '1',
      });
      jar.addCookie({
        domain: 'example.com', includeSubdomains: false,
        path: '/', secure: false, expiry: 0, name: 'b', value: '2',
      });

      expect(jar.buildCookieHeader('http://example.com/')).toBe('a=1; b=2');
    });

    it('returns undefined when no cookies match', () => {
      const jar = new CurlCookieJar();
      expect(jar.buildCookieHeader('http://example.com/')).toBeUndefined();
    });
  });

  describe('addCookie()', () => {
    it('replaces existing cookie with same domain+path+name', () => {
      const jar = new CurlCookieJar();
      jar.addCookie({
        domain: 'example.com', includeSubdomains: false,
        path: '/', secure: false, expiry: 0, name: 'a', value: 'old',
      });
      jar.addCookie({
        domain: 'example.com', includeSubdomains: false,
        path: '/', secure: false, expiry: 0, name: 'a', value: 'new',
      });

      expect(jar.getAll()).toHaveLength(1);
      expect(jar.getAll()[0].value).toBe('new');
    });

    it('does not replace cookie with different path', () => {
      const jar = new CurlCookieJar();
      jar.addCookie({
        domain: 'example.com', includeSubdomains: false,
        path: '/', secure: false, expiry: 0, name: 'a', value: '1',
      });
      jar.addCookie({
        domain: 'example.com', includeSubdomains: false,
        path: '/api', secure: false, expiry: 0, name: 'a', value: '2',
      });

      expect(jar.getAll()).toHaveLength(2);
    });
  });

  describe('clear()', () => {
    it('empties the jar', () => {
      const jar = new CurlCookieJar();
      jar.addCookie({
        domain: 'example.com', includeSubdomains: false,
        path: '/', secure: false, expiry: 0, name: 'a', value: '1',
      });
      expect(jar.getAll()).toHaveLength(1);

      jar.clear();
      expect(jar.getAll()).toHaveLength(0);
    });
  });
});
