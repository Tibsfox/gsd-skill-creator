/**
 * Response format detection and parsing.
 *
 * Auto-detects JSON, HTML, XML, and text formats from
 * content-type headers with content sniffing fallback.
 */

import * as cheerio from 'cheerio';
import { XMLParser } from 'fast-xml-parser';
import type { CurlResponse } from '../curl/types.js';
import type { WebParsedResponse, WebResponseFormat } from './types.js';

/**
 * Detect response format from content-type header with content sniffing fallback.
 */
export function detectFormat(contentType: string, body: string): WebResponseFormat {
  const ct = contentType.toLowerCase();

  // Check content-type header first
  if (ct.includes('application/json') || ct.endsWith('+json')) {
    return 'json';
  }
  if (ct.includes('text/html') || ct.includes('application/xhtml')) {
    return 'html';
  }
  if (ct.includes('text/xml') || ct.includes('application/xml') || ct.endsWith('+xml')) {
    return 'xml';
  }

  // Content sniffing fallback
  const trimmed = body.trimStart();

  // Try JSON parse for { or [
  if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
    try {
      JSON.parse(body);
      return 'json';
    } catch {
      // Not valid JSON
    }
  }

  if (trimmed.startsWith('<?xml') || trimmed.startsWith('<rss')) {
    return 'xml';
  }

  if (trimmed.startsWith('<!DOCTYPE') || trimmed.startsWith('<html')) {
    return 'html';
  }

  return 'text';
}

/**
 * Parse a CurlResponse into a structured WebParsedResponse.
 * Uses content-type detection or an explicit format override.
 */
export function parseResponse(
  response: CurlResponse,
  formatOverride?: WebResponseFormat,
): WebParsedResponse {
  const contentType = response.headers['content-type'] ?? '';
  const format = formatOverride ?? detectFormat(contentType, response.body);
  let parsed: unknown;

  switch (format) {
    case 'json':
      try {
        parsed = JSON.parse(response.body);
      } catch {
        parsed = null;
      }
      break;

    case 'html':
      parsed = cheerio.load(response.body);
      break;

    case 'xml':
      try {
        const parser = new XMLParser();
        parsed = parser.parse(response.body);
      } catch {
        parsed = null;
      }
      break;

    case 'text':
    default:
      parsed = response.body;
      break;
  }

  return {
    format,
    raw: response.body,
    parsed,
    statusCode: response.status,
    headers: response.headers,
  };
}
