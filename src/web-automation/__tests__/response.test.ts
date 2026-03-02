import { describe, it, expect } from 'vitest';
import { detectFormat, parseResponse } from '../response.js';
import type { CurlResponse } from '../../curl/types.js';

function makeResponse(body: string, contentType = 'text/plain'): CurlResponse {
  return {
    status: 200,
    statusText: 'OK',
    headers: { 'content-type': contentType },
    body,
    blocked: false,
  };
}

describe('detectFormat', () => {
  it('returns json for content-type application/json', () => {
    expect(detectFormat('application/json', '')).toBe('json');
  });

  it('returns html for content-type text/html', () => {
    expect(detectFormat('text/html; charset=utf-8', '')).toBe('html');
  });

  it('returns xml for content-type application/xml', () => {
    expect(detectFormat('application/xml', '')).toBe('xml');
  });

  it('returns xml for content-type text/xml', () => {
    expect(detectFormat('text/xml', '')).toBe('xml');
  });

  it('falls back to content sniffing -- body starting with { that is valid JSON returns json', () => {
    expect(detectFormat('', '{"key": "value"}')).toBe('json');
  });

  it('falls back to content sniffing -- body starting with <?xml returns xml', () => {
    expect(detectFormat('', '<?xml version="1.0"?><root/>')).toBe('xml');
  });

  it('falls back to content sniffing -- body starting with <!DOCTYPE returns html', () => {
    expect(detectFormat('', '<!DOCTYPE html><html></html>')).toBe('html');
  });

  it('returns text for unknown content-type and non-matching body', () => {
    expect(detectFormat('', 'Hello, world!')).toBe('text');
  });

  it('handles +json content-type suffix', () => {
    expect(detectFormat('application/vnd.api+json', '')).toBe('json');
  });

  it('handles +xml content-type suffix', () => {
    expect(detectFormat('application/atom+xml', '')).toBe('xml');
  });
});

describe('parseResponse', () => {
  it('parses JSON body and returns parsed object', () => {
    const resp = makeResponse('{"name": "test"}', 'application/json');
    const result = parseResponse(resp);
    expect(result.format).toBe('json');
    expect(result.parsed).toEqual({ name: 'test' });
    expect(result.raw).toBe('{"name": "test"}');
    expect(result.statusCode).toBe(200);
  });

  it('parses HTML body and returns cheerio root', () => {
    const resp = makeResponse('<html><body><h1>Hello</h1></body></html>', 'text/html');
    const result = parseResponse(resp);
    expect(result.format).toBe('html');
    // cheerio load result is a function
    expect(typeof result.parsed).toBe('function');
  });

  it('parses XML body and returns parsed XML object', () => {
    const xml = '<?xml version="1.0"?><root><item>test</item></root>';
    const resp = makeResponse(xml, 'application/xml');
    const result = parseResponse(resp);
    expect(result.format).toBe('xml');
    expect(result.parsed).toHaveProperty('root');
  });

  it('uses formatOverride to ignore content-type header', () => {
    // Content-type says text, but we force JSON
    const resp = makeResponse('{"forced": true}', 'text/plain');
    const result = parseResponse(resp, 'json');
    expect(result.format).toBe('json');
    expect(result.parsed).toEqual({ forced: true });
  });

  it('returns null parsed value for malformed JSON', () => {
    const resp = makeResponse('{invalid json}', 'application/json');
    const result = parseResponse(resp);
    expect(result.format).toBe('json');
    expect(result.parsed).toBeNull();
  });

  it('passes through raw body for text format', () => {
    const resp = makeResponse('plain text content', 'text/plain');
    const result = parseResponse(resp);
    expect(result.format).toBe('text');
    expect(result.parsed).toBe('plain text content');
    expect(result.raw).toBe('plain text content');
  });

  it('detects JSON from content sniffing when body starts with [', () => {
    const resp = makeResponse('[1, 2, 3]', '');
    const result = parseResponse(resp);
    expect(result.format).toBe('json');
    expect(result.parsed).toEqual([1, 2, 3]);
  });
});
