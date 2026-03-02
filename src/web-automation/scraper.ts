/**
 * CSS selector-based web scraper using cheerio.
 *
 * All HTTP transport goes through the curl module.
 * WebRateLimiter is a mandatory constructor parameter.
 */

import * as cheerio from 'cheerio';
import { httpGet } from '../curl/client.js';
import type { WebRateLimiter } from './rate-limiter.js';
import type { WebScraperConfig, WebScrapeResult } from './types.js';

export class WebScraper {
  constructor(private readonly rateLimiter: WebRateLimiter) {}

  async scrape(config: WebScraperConfig): Promise<WebScrapeResult> {
    await this.rateLimiter.acquire();

    const response = await httpGet(config.url, config.requestOptions);

    if (response.blocked) {
      return { url: config.url, success: false, error: response.blockReason };
    }

    const $ = cheerio.load(response.body);
    const data: Record<string, string | string[]> = {};

    for (const [key, selector] of Object.entries(config.selectors)) {
      const elements = $(selector.css);

      if (selector.attribute) {
        data[key] = elements.attr(selector.attribute) ?? '';
      } else if (selector.multiple) {
        data[key] = elements.map((_, el) => $(el).text().trim()).get();
      } else {
        data[key] = elements.first().text().trim();
      }
    }

    return {
      url: config.url,
      success: true,
      data,
      statusCode: response.status,
    };
  }
}
