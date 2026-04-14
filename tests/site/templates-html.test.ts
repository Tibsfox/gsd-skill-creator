import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';

const TEMPLATE_DIR = resolve(__dirname, '../../src/site/templates');

function readTemplate(name: string): string {
  return readFileSync(resolve(TEMPLATE_DIR, name), 'utf-8');
}

describe('HTML Templates', () => {
  it('base.html contains DOCTYPE and html lang', () => {
    const base = readTemplate('base.html');
    expect(base).toContain('<!DOCTYPE html>');
    expect(base).toMatch(/<html\s[^>]*lang=/);
  });

  it('base.html contains meta viewport', () => {
    const base = readTemplate('base.html');
    expect(base).toMatch(/meta\s[^>]*name="viewport"/);
  });

  it('base.html contains skip-to-content link', () => {
    const base = readTemplate('base.html');
    expect(base).toContain('skip-link');
    expect(base).toContain('#main-content');
  });

  it('all 8 template files exist', () => {
    const templates = [
      'base.html',
      'page.html',
      'essay.html',
      'listing.html',
      'textbook.html',
      'bibliography.html',
      'home.html',
      '404.html',
    ];
    for (const name of templates) {
      const path = resolve(TEMPLATE_DIR, name);
      expect(existsSync(path), `template ${name} should exist`).toBe(true);
    }
  });

  it('all 5 partial files exist', () => {
    const partials = [
      'partials/header.html',
      'partials/nav.html',
      'partials/footer.html',
      'partials/toc.html',
      'partials/breadcrumb.html',
    ];
    for (const name of partials) {
      const path = resolve(TEMPLATE_DIR, name);
      expect(existsSync(path), `partial ${name} should exist`).toBe(true);
    }
  });

  it('templates use Mustache syntax', () => {
    const page = readTemplate('page.html');
    // Double-brace variable
    expect(page).toMatch(/\{\{[^#/>!]/);
    // Section block
    expect(page).toMatch(/\{\{#/);
    // Partial include
    expect(page).toMatch(/\{\{>/);
  });

  it('page.html includes toc partial', () => {
    const page = readTemplate('page.html');
    expect(page).toContain('{{>toc}}');
  });

  it('essay.html has essay-layout class', () => {
    const essay = readTemplate('essay.html');
    expect(essay).toContain('essay-layout');
  });

  it('404.html contains navigation links', () => {
    const notFound = readTemplate('404.html');
    expect(notFound).toMatch(/<a\s/);
    expect(notFound).toContain('404');
  });

  it('home.html has no sidebar toc', () => {
    const home = readTemplate('home.html');
    expect(home).not.toContain('{{>toc}}');
  });
});
