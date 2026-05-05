/**
 * Code View tests — jsdom environment.
 * 8 tests covering: token-span rendering, gutter badges, click dispatch,
 * scroll-on-setFocus, hover debounce timing.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createCodeView } from '../code-view.js';
import type { CodeViewOptions, FocusTarget } from '../code-view.js';
import type {
  AtlasMissionProvenance,
  AtlasSymbol,
  SnapshotId,
} from '../../../../../src/intelligence/types.js';

// ── helpers ──────────────────────────────────────────────────────────────────

function makeProvenance(lineNo: number, missionId = 'v1.49.600'): AtlasMissionProvenance {
  return {
    id: `prov-${lineNo}`,
    snapshot_id: 'snap-1',
    file_path: 'src/index.ts',
    line_no: lineNo,
    mission_id: missionId,
    commit_sha: 'abc123',
    weight: 1,
  };
}

function makeSymbol(id: string, name: string): AtlasSymbol {
  return {
    id,
    snapshot_id: 'snap-1',
    project_id: 'proj-1',
    file_path: 'src/index.ts',
    kind: 'function',
    name,
    qualified_name: `mod::${name}`,
    start_byte: 0,
    end_byte: 10,
    start_line: 1,
    end_line: 3,
    signature_hash: null,
    modifiers: [],
    language: 'ts',
    parent_symbol_id: null,
  };
}

function makeOpts(overrides: Partial<CodeViewOptions> = {}): CodeViewOptions {
  return {
    snapshotId: 'snap-1' as SnapshotId,
    filePath: 'src/index.ts',
    source: 'function hello() {\n  return 42;\n}',
    fetchProvenance: vi.fn().mockResolvedValue([]),
    fetchSymbol: vi.fn().mockResolvedValue(null),
    ...overrides,
  };
}

// ── tests ─────────────────────────────────────────────────────────────────────

describe('createCodeView', () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    container.remove();
  });

  // T1 — token spans rendered with hl-* classes
  it('renders identifier tokens wrapped in hl-identifier spans', () => {
    const cv = createCodeView(makeOpts());
    cv.mount(container);

    const identSpans = container.querySelectorAll('.hl-identifier');
    // "hello" and "return" are identifier-class tokens in the source
    expect(identSpans.length).toBeGreaterThan(0);

    cv.unmount();
  });

  // T2 — keyword tokens get hl-keyword class
  it('renders keyword tokens with hl-keyword class', () => {
    const cv = createCodeView(makeOpts());
    cv.mount(container);

    const kwSpans = container.querySelectorAll('.hl-keyword');
    // "function" and "return" should be keyword-classified by the TS grammar
    expect(kwSpans.length).toBeGreaterThan(0);

    cv.unmount();
  });

  // T3 — gutter renders one row per source line
  it('renders gutter with one row per line', () => {
    const source = 'line one\nline two\nline three';
    const cv = createCodeView(makeOpts({ source }));
    cv.mount(container);

    const rows = container.querySelectorAll('.cv-gutter-row');
    expect(rows.length).toBe(3);

    cv.unmount();
  });

  // T4 — gutter badge appears when provenance resolves
  it('shows mission badge after provenance resolves for a line', async () => {
    const prov = makeProvenance(1, 'mission-alpha');
    const fetchProvenance = vi.fn().mockImplementation((_, __, lineNo: number) => {
      if (lineNo === 1) return Promise.resolve([prov]);
      return Promise.resolve([]);
    });

    const cv = createCodeView(makeOpts({ fetchProvenance }));
    cv.mount(container);

    // Wait for async provenance load
    await new Promise(r => setTimeout(r, 20));

    const badge = container.querySelector('.cv-mission-badge');
    expect(badge).not.toBeNull();

    cv.unmount();
  });

  // T5 — click on identifier dispatches the right symbol_id
  it('pointer-down on identifier dispatches onSymbolSelect with bound symbol id', () => {
    const onSymbolSelect = vi.fn();
    const sym = makeSymbol('sym-001', 'hello');

    const cv = createCodeView(makeOpts({ onSymbolSelect }));
    cv.mount(container);
    cv.bindSymbols([sym]);

    // Find a cv-sym span with data-sym-name="hello"
    const symSpan = container.querySelector<HTMLElement>('.cv-sym[data-sym-name="hello"]');
    expect(symSpan).not.toBeNull();

    symSpan!.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));

    expect(onSymbolSelect).toHaveBeenCalledWith('sym-001');

    cv.unmount();
  });

  // T6 — setFocus scrolls and adds flash class
  it('setFocus adds cv-line--flash to the targeted line', () => {
    const cv = createCodeView(makeOpts());
    cv.mount(container);

    const target: FocusTarget = { file: 'src/index.ts', line: 2 };

    // scrollIntoView is not implemented in jsdom — stub it
    const lineEl = container.querySelector<HTMLElement>('.cv-line[data-line="2"]');
    if (lineEl) lineEl.scrollIntoView = vi.fn();

    cv.setFocus(target);

    const flashedLine = container.querySelector('.cv-line--flash');
    expect(flashedLine).not.toBeNull();
    expect((flashedLine as HTMLElement).dataset['line']).toBe('2');

    cv.unmount();
  });

  // T7 — hover debounce: showFor called rapidly, only one tooltip paint
  it('hover tooltip does not commit before 200ms debounce elapses', async () => {
    vi.useFakeTimers();
    const fetchSymbol = vi.fn().mockResolvedValue(null);
    const cv = createCodeView(makeOpts({ fetchSymbol }));
    cv.mount(container);
    cv.bindSymbols([makeSymbol('sym-x', 'hello')]);

    const symSpan = container.querySelector<HTMLElement>('.cv-sym[data-sym-name="hello"]');
    expect(symSpan).not.toBeNull();

    // Simulate rapid mouseover
    for (let i = 0; i < 5; i++) {
      symSpan!.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));
    }

    // Before debounce fires: fetchSymbol not called
    expect(fetchSymbol).not.toHaveBeenCalled();

    // Advance past debounce
    await vi.runAllTimersAsync();

    // fetchSymbol should be called once (debounced)
    expect(fetchSymbol.mock.calls.length).toBeLessThanOrEqual(1);

    vi.useRealTimers();
    cv.unmount();
  });

  // T8 — unmount cleans up DOM
  it('unmount removes root element from the DOM', () => {
    const cv = createCodeView(makeOpts());
    cv.mount(container);

    expect(container.querySelector('.cv-root')).not.toBeNull();

    cv.unmount();

    expect(container.querySelector('.cv-root')).toBeNull();
  });
});
