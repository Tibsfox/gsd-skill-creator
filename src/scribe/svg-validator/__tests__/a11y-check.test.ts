/**
 * Component 03 — a11y-check.ts unit tests.
 *
 * Target: ≥80% branch coverage of a11y-check.ts (success criterion C5).
 *
 * Coverage strategy:
 * - Each of the 5 BLOCKER checks (items 1-5) has a PASS + FAIL branch.
 * - Edge cases: empty title, empty desc, role absent, role invalid,
 *   aria-label only (no aria-labelledby), desc absent with aria-label,
 *   multiple raster images, vector image (pass), no SVG root.
 *
 * All tests are pure in-memory string operations — no file system.
 */

import { describe, it, expect } from 'vitest';
import { checkSvgString, VALID_ROLES } from '../a11y-check.js';

// ---------------------------------------------------------------------------
// Helper: minimal valid SVG builder
// ---------------------------------------------------------------------------
function buildSvg({
  role = 'img',
  ariaLabelledBy = 'scribe-title scribe-desc',
  ariaLabel,
  titleText = 'Test Figure Title',
  descText = 'Test Figure Description',
  noTitle = false,
  noDesc = false,
  emptyTitle = false,
  emptyDesc = false,
  extraChildren = '',
}: {
  role?: string | null;
  ariaLabelledBy?: string | null;
  ariaLabel?: string;
  titleText?: string;
  descText?: string;
  noTitle?: boolean;
  noDesc?: boolean;
  emptyTitle?: boolean;
  emptyDesc?: boolean;
  extraChildren?: string;
} = {}): string {
  const roleAttr = role != null ? ` role="${role}"` : '';
  const albyAttr =
    ariaLabelledBy != null ? ` aria-labelledby="${ariaLabelledBy}"` : '';
  const alAttr = ariaLabel != null ? ` aria-label="${ariaLabel}"` : '';

  const titleEl = noTitle
    ? ''
    : emptyTitle
      ? '<title id="scribe-title"></title>\n  '
      : `<title id="scribe-title">${titleText}</title>\n  `;

  const descEl = noDesc
    ? ''
    : emptyDesc
      ? '<desc id="scribe-desc"></desc>\n  '
      : `<desc id="scribe-desc">${descText}</desc>\n  `;

  return `<svg xmlns="http://www.w3.org/2000/svg"${roleAttr}${albyAttr}${alAttr} viewBox="0 0 100 100">
  ${titleEl}${descEl}${extraChildren}
  <rect x="10" y="10" width="80" height="80" fill="steelblue"/>
</svg>`;
}

// ---------------------------------------------------------------------------
// VALID_ROLES
// ---------------------------------------------------------------------------
describe('VALID_ROLES', () => {
  it('contains the 5 accepted SCRIBE role values', () => {
    expect(VALID_ROLES.has('img')).toBe(true);
    expect(VALID_ROLES.has('graphics-document')).toBe(true);
    expect(VALID_ROLES.has('graphics-object')).toBe(true);
    expect(VALID_ROLES.has('presentation')).toBe(true);
    expect(VALID_ROLES.has('none')).toBe(true);
  });

  it('does not contain invalid role values', () => {
    expect(VALID_ROLES.has('button')).toBe(false);
    expect(VALID_ROLES.has('')).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Item 1: role attribute
// ---------------------------------------------------------------------------
describe('checkSvgString — item 1: role attribute', () => {
  it('PASS: role="img" is accepted', () => {
    const result = checkSvgString(buildSvg({ role: 'img' }));
    expect(result.structured.find((m) => m.item === 1)?.severity).toBe('OK');
  });

  it('PASS: role="graphics-document" is accepted', () => {
    const result = checkSvgString(buildSvg({ role: 'graphics-document' }));
    expect(result.structured.find((m) => m.item === 1)?.severity).toBe('OK');
  });

  it('PASS: role="presentation" is accepted', () => {
    const result = checkSvgString(buildSvg({ role: 'presentation' }));
    expect(result.structured.find((m) => m.item === 1)?.severity).toBe('OK');
  });

  it('FAIL: missing role attribute', () => {
    const result = checkSvgString(buildSvg({ role: null }));
    const msg = result.structured.find((m) => m.item === 1);
    expect(msg?.severity).toBe('FAIL');
    expect(msg?.text).toMatch(/no role attribute/);
    expect(result.ok).toBe(false);
  });

  it('FAIL: unrecognised role value', () => {
    const result = checkSvgString(buildSvg({ role: 'banner' }));
    const msg = result.structured.find((m) => m.item === 1);
    expect(msg?.severity).toBe('FAIL');
    expect(msg?.text).toMatch(/not a recognised SCRIBE role/);
    expect(result.ok).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Item 2: aria-labelledby / aria-label
// ---------------------------------------------------------------------------
describe('checkSvgString — item 2: aria labelling', () => {
  it('PASS: aria-labelledby present', () => {
    const result = checkSvgString(
      buildSvg({ ariaLabelledBy: 'scribe-title scribe-desc' }),
    );
    const msg = result.structured.find((m) => m.item === 2);
    expect(msg?.severity).toBe('OK');
    expect(msg?.text).toMatch(/aria-labelledby/);
  });

  it('PASS: aria-label present (no aria-labelledby)', () => {
    const result = checkSvgString(
      buildSvg({ ariaLabelledBy: null, ariaLabel: 'A description' }),
    );
    const msg = result.structured.find((m) => m.item === 2);
    expect(msg?.severity).toBe('OK');
    expect(msg?.text).toMatch(/aria-label/);
  });

  it('FAIL: neither aria-labelledby nor aria-label', () => {
    const result = checkSvgString(
      buildSvg({ ariaLabelledBy: null }),
    );
    const msg = result.structured.find((m) => m.item === 2);
    expect(msg?.severity).toBe('FAIL');
    expect(msg?.text).toMatch(/neither aria-labelledby nor aria-label/);
    expect(result.ok).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Item 3: <title> as first child
// ---------------------------------------------------------------------------
describe('checkSvgString — item 3: <title> first child', () => {
  it('PASS: <title> with text is first child', () => {
    const result = checkSvgString(buildSvg());
    const msg = result.structured.find((m) => m.item === 3);
    expect(msg?.severity).toBe('OK');
  });

  it('FAIL: no <title> at all', () => {
    const result = checkSvgString(buildSvg({ noTitle: true }));
    const msg = result.structured.find((m) => m.item === 3);
    expect(msg?.severity).toBe('FAIL');
    expect(msg?.text).toMatch(/first child is not <title>/);
    expect(result.ok).toBe(false);
  });

  it('FAIL: <title> is empty', () => {
    const result = checkSvgString(buildSvg({ emptyTitle: true }));
    const msg = result.structured.find((m) => m.item === 3);
    expect(msg?.severity).toBe('FAIL');
    expect(msg?.text).toMatch(/<title> is empty/);
    expect(result.ok).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Item 4: <desc> as second child
// ---------------------------------------------------------------------------
describe('checkSvgString — item 4: <desc> second child', () => {
  it('PASS: <desc> with text is second child', () => {
    const result = checkSvgString(buildSvg());
    const msg = result.structured.find((m) => m.item === 4);
    expect(msg?.severity).toBe('OK');
  });

  it('FAIL: <desc> absent, no aria-label fallback', () => {
    const result = checkSvgString(
      buildSvg({ noDesc: true, ariaLabelledBy: 'scribe-title' }),
    );
    const msg = result.structured.find((m) => m.item === 4);
    expect(msg?.severity).toBe('FAIL');
    expect(msg?.text).toMatch(/second child is not <desc>/);
    expect(result.ok).toBe(false);
  });

  it('WARN: <desc> absent but aria-label is set (acceptable)', () => {
    const result = checkSvgString(
      buildSvg({
        noDesc: true,
        ariaLabelledBy: null,
        ariaLabel: 'Fallback description',
      }),
    );
    const msg = result.structured.find((m) => m.item === 4);
    expect(msg?.severity).toBe('WARN');
    // WARN does NOT set ok=false when <title> passes and no other blockers.
    // (ok may still be false due to other items — check this item specifically)
    expect(msg?.text).toMatch(/acceptable/);
  });

  it('FAIL: <desc> exists but is empty', () => {
    const result = checkSvgString(buildSvg({ emptyDesc: true }));
    const msg = result.structured.find((m) => m.item === 4);
    expect(msg?.severity).toBe('FAIL');
    expect(msg?.text).toMatch(/<desc> is empty/);
    expect(result.ok).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Item 5: no raster <image>
// ---------------------------------------------------------------------------
describe('checkSvgString — item 5: no raster <image>', () => {
  it('PASS: no <image> elements', () => {
    const result = checkSvgString(buildSvg());
    const msg = result.structured.find((m) => m.item === 5);
    expect(msg?.severity).toBe('OK');
    expect(msg?.text).toMatch(/no raster/);
  });

  it('PASS: <image> with vector (SVG) href is fine', () => {
    const svg = buildSvg({
      extraChildren: '<image href="icon.svg" width="10" height="10"/>',
    });
    const result = checkSvgString(svg);
    const msg = result.structured.find((m) => m.item === 5);
    expect(msg?.severity).toBe('OK');
  });

  it('FAIL: <image> with PNG href', () => {
    const svg = buildSvg({
      extraChildren: '<image href="photo.png" width="100" height="100"/>',
    });
    const result = checkSvgString(svg);
    const msg = result.structured.find((m) => m.item === 5);
    expect(msg?.severity).toBe('FAIL');
    expect(msg?.text).toMatch(/raster <image href="photo\.png">/);
    expect(result.ok).toBe(false);
  });

  it('FAIL: <image> with JPEG href', () => {
    const svg = buildSvg({
      extraChildren: '<image href="photo.jpg" width="100" height="100"/>',
    });
    const result = checkSvgString(svg);
    const fail = result.structured.filter((m) => m.item === 5 && m.severity === 'FAIL');
    expect(fail.length).toBeGreaterThan(0);
    expect(result.ok).toBe(false);
  });

  it('FAIL: multiple raster images each produce a FAIL message', () => {
    const svg = buildSvg({
      extraChildren: `
        <image href="a.png" width="10" height="10"/>
        <image href="b.gif" width="10" height="10"/>
      `,
    });
    const result = checkSvgString(svg);
    const fails = result.structured.filter(
      (m) => m.item === 5 && m.severity === 'FAIL',
    );
    expect(fails.length).toBe(2);
    expect(result.ok).toBe(false);
  });

  it('PASS: <image> href with query string that is not raster', () => {
    const svg = buildSvg({
      extraChildren: '<image href="sprite.svg?v=2" width="10" height="10"/>',
    });
    const result = checkSvgString(svg);
    const msg = result.structured.find((m) => m.item === 5);
    expect(msg?.severity).toBe('OK');
  });
});

// ---------------------------------------------------------------------------
// Pre-check: no <svg> root element
// ---------------------------------------------------------------------------
describe('checkSvgString — structural pre-check', () => {
  it('FAIL immediately when no <svg> root element is found', () => {
    const result = checkSvgString('<html><body>not an svg</body></html>');
    expect(result.ok).toBe(false);
    expect(result.messages[0]).toMatch(/no <svg> root element found/);
    expect(result.structured[0]?.item).toBe(0); // pre-check item = 0
  });
});

// ---------------------------------------------------------------------------
// XML declaration stripping
// ---------------------------------------------------------------------------
describe('checkSvgString — XML preamble handling', () => {
  it('strips XML declaration and DOCTYPE before parsing', () => {
    const svg = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">
${buildSvg()}`;
    const result = checkSvgString(svg);
    expect(result.ok).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// ok flag — all pass path
// ---------------------------------------------------------------------------
describe('checkSvgString — full pass', () => {
  it('returns ok=true for a fully compliant SVG', () => {
    const result = checkSvgString(buildSvg());
    expect(result.ok).toBe(true);
    // All 5 items should be OK.
    const okItems = result.structured.filter((m) => m.severity === 'OK');
    expect(okItems.length).toBeGreaterThanOrEqual(5);
  });

  it('messages array has one entry per structured entry', () => {
    const result = checkSvgString(buildSvg());
    expect(result.messages.length).toBe(result.structured.length);
  });
});

// ---------------------------------------------------------------------------
// ok flag — multiple failures accumulate
// ---------------------------------------------------------------------------
describe('checkSvgString — accumulated failures', () => {
  it('returns ok=false when multiple BLOCKER items fail', () => {
    // No role, no aria, no title, no desc, raster image
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <image href="photo.png" width="100" height="100"/>
</svg>`;
    const result = checkSvgString(svg);
    expect(result.ok).toBe(false);
    const failures = result.structured.filter((m) => m.severity === 'FAIL');
    expect(failures.length).toBeGreaterThanOrEqual(3);
  });
});
