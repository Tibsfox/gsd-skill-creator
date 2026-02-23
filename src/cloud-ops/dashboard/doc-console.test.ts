import { describe, it, expect } from 'vitest';
import {
  renderDocConsole,
  renderDocNavigation,
  renderDocContent,
} from './doc-console.js';
import type { DocConsoleData, DocEntry, DocContent } from './types.js';

// ---------------------------------------------------------------------------
// Helpers / fixtures
// ---------------------------------------------------------------------------

function makeEntry(overrides: Partial<DocEntry> = {}): DocEntry {
  return {
    id: overrides.id ?? 'doc-1',
    title: overrides.title ?? 'Test Document',
    type: overrides.type ?? 'chapter',
    path: overrides.path ?? '/docs/test.md',
    sePhaseRef: overrides.sePhaseRef,
  };
}

function makeContent(overrides: Partial<DocContent> = {}): DocContent {
  return {
    entry: overrides.entry ?? makeEntry(),
    body: overrides.body ?? '<p>Document body content.</p>',
    crossRefs: overrides.crossRefs ?? [],
  };
}

function makeData(overrides: Partial<DocConsoleData> = {}): DocConsoleData {
  return {
    enabled: 'enabled' in overrides ? overrides.enabled! : true,
    entries: overrides.entries ?? [makeEntry()],
    activeContent: overrides.activeContent,
  };
}

/** Return one entry of each doc type. */
function makeOneOfEach(): DocEntry[] {
  return [
    makeEntry({ id: 'ch-1', title: 'Chapter One', type: 'chapter' }),
    makeEntry({ id: 'pr-1', title: 'Procedure One', type: 'procedure' }),
    makeEntry({ id: 'rb-1', title: 'Runbook One', type: 'runbook' }),
  ];
}

// ---------------------------------------------------------------------------
// renderDocConsole -- progressive enhancement
// ---------------------------------------------------------------------------

describe('renderDocConsole', () => {
  describe('progressive enhancement: null (no config)', () => {
    it('returns empty string when enabled is null', () => {
      const html = renderDocConsole(makeData({ enabled: null }));
      expect(html).toBe('');
    });

    it('renders no dc-console when enabled is null', () => {
      const html = renderDocConsole(makeData({ enabled: null }));
      expect(html).not.toContain('dc-console');
    });
  });

  describe('progressive enhancement: false (disabled)', () => {
    it('renders dc-console when disabled', () => {
      const html = renderDocConsole(makeData({ enabled: false }));
      expect(html).toContain('dc-console');
    });

    it('renders dc-disabled-msg with informational text', () => {
      const html = renderDocConsole(makeData({ enabled: false }));
      expect(html).toContain('dc-disabled-msg');
      expect(html).toContain('not configured');
    });

    it('does not render navigation when disabled', () => {
      const html = renderDocConsole(makeData({ enabled: false }));
      expect(html).not.toContain('dc-nav');
    });

    it('does not render content area when disabled', () => {
      const html = renderDocConsole(makeData({ enabled: false }));
      expect(html).not.toContain('dc-content');
    });
  });

  describe('progressive enhancement: true (enabled)', () => {
    it('renders data-panel-type="doc-console" attribute', () => {
      const html = renderDocConsole(makeData());
      expect(html).toContain('data-panel-type="doc-console"');
    });

    it('renders two-column layout with nav and content columns', () => {
      const html = renderDocConsole(makeData());
      expect(html).toContain('dc-nav-column');
      expect(html).toContain('dc-content-column');
    });

    it('renders dc-layout wrapper', () => {
      const html = renderDocConsole(makeData());
      expect(html).toContain('dc-layout');
    });

    it('renders navigation with entries', () => {
      const html = renderDocConsole(makeData({ entries: makeOneOfEach() }));
      expect(html).toContain('dc-nav');
      expect(html).toContain('Chapter One');
    });

    it('renders content placeholder when no active content', () => {
      const html = renderDocConsole(makeData({ activeContent: undefined }));
      expect(html).toContain('dc-content-placeholder');
    });

    it('renders active document when activeContent is set', () => {
      const content = makeContent({
        entry: makeEntry({ title: 'Active Doc' }),
        body: '<p>Active content.</p>',
      });
      const html = renderDocConsole(makeData({ activeContent: content }));
      expect(html).toContain('Active Doc');
      expect(html).toContain('Active content.');
    });
  });
});

// ---------------------------------------------------------------------------
// renderDocNavigation
// ---------------------------------------------------------------------------

describe('renderDocNavigation', () => {
  describe('empty state', () => {
    it('renders dc-nav-empty when no entries', () => {
      const html = renderDocNavigation([]);
      expect(html).toContain('dc-nav-empty');
    });

    it('shows "No documents available" when empty', () => {
      const html = renderDocNavigation([]);
      expect(html).toContain('No documents available');
    });
  });

  describe('grouping by type', () => {
    it('renders chapter group with label "Systems Administrator\'s Guide"', () => {
      const entries = [makeEntry({ type: 'chapter', title: 'Chapter One' })];
      const html = renderDocNavigation(entries);
      expect(html).toContain("Systems Administrator's Guide");
      expect(html).toContain('Chapter One');
    });

    it('renders procedure group with label "Operations Manual"', () => {
      const entries = [makeEntry({ type: 'procedure', title: 'Proc One' })];
      const html = renderDocNavigation(entries);
      expect(html).toContain('Operations Manual');
      expect(html).toContain('Proc One');
    });

    it('renders runbook group with label "Runbook Library"', () => {
      const entries = [makeEntry({ type: 'runbook', title: 'Runbook One' })];
      const html = renderDocNavigation(entries);
      expect(html).toContain('Runbook Library');
      expect(html).toContain('Runbook One');
    });

    it('renders all three groups when all types present', () => {
      const html = renderDocNavigation(makeOneOfEach());
      expect(html).toContain("Systems Administrator's Guide");
      expect(html).toContain('Operations Manual');
      expect(html).toContain('Runbook Library');
    });

    it('renders chapter group before procedure group', () => {
      const html = renderDocNavigation(makeOneOfEach());
      const chapterIdx = html.indexOf("Systems Administrator's Guide");
      const procedureIdx = html.indexOf('Operations Manual');
      expect(chapterIdx).toBeLessThan(procedureIdx);
    });

    it('renders procedure group before runbook group', () => {
      const html = renderDocNavigation(makeOneOfEach());
      const procedureIdx = html.indexOf('Operations Manual');
      const runbookIdx = html.indexOf('Runbook Library');
      expect(procedureIdx).toBeLessThan(runbookIdx);
    });

    it('does not render empty group when type has no entries', () => {
      const entries = [makeEntry({ type: 'chapter' })];
      const html = renderDocNavigation(entries);
      expect(html).not.toContain('Operations Manual');
      expect(html).not.toContain('Runbook Library');
    });

    it('renders data-group-type attribute on each group', () => {
      const html = renderDocNavigation(makeOneOfEach());
      expect(html).toContain('data-group-type="chapter"');
      expect(html).toContain('data-group-type="procedure"');
      expect(html).toContain('data-group-type="runbook"');
    });
  });

  describe('active entry highlighting', () => {
    it('adds dc-nav-active class to active entry', () => {
      const entries = [makeEntry({ id: 'ch-1' })];
      const html = renderDocNavigation(entries, 'ch-1');
      expect(html).toContain('dc-nav-active');
    });

    it('does not add dc-nav-active to inactive entries', () => {
      const entries = [
        makeEntry({ id: 'ch-1' }),
        makeEntry({ id: 'ch-2' }),
      ];
      const html = renderDocNavigation(entries, 'ch-1');
      // Only one dc-nav-active should appear
      const activeCount = (html.match(/dc-nav-active/g) ?? []).length;
      expect(activeCount).toBe(1);
    });

    it('no active class when activeId is undefined', () => {
      const entries = [makeEntry({ id: 'ch-1' })];
      const html = renderDocNavigation(entries, undefined);
      expect(html).not.toContain('dc-nav-active');
    });
  });

  describe('SE phase reference badge', () => {
    it('renders phase badge when sePhaseRef is set', () => {
      const entries = [makeEntry({ sePhaseRef: 'Phase E / ORR' })];
      const html = renderDocNavigation(entries);
      expect(html).toContain('dc-nav-phase-badge');
      expect(html).toContain('Phase E / ORR');
    });

    it('does not render phase badge when sePhaseRef is undefined', () => {
      const entries = [makeEntry({ sePhaseRef: undefined })];
      const html = renderDocNavigation(entries);
      expect(html).not.toContain('dc-nav-phase-badge');
    });
  });

  describe('navigation links', () => {
    it('renders dc-nav-link with data-target for each entry', () => {
      const entries = [makeEntry({ id: 'rb-1' })];
      const html = renderDocNavigation(entries);
      expect(html).toContain('data-target="rb-1"');
    });

    it('renders data-doc-id on each nav item', () => {
      const entries = [makeEntry({ id: 'pr-42' })];
      const html = renderDocNavigation(entries);
      expect(html).toContain('data-doc-id="pr-42"');
    });
  });
});

// ---------------------------------------------------------------------------
// renderDocContent
// ---------------------------------------------------------------------------

describe('renderDocContent', () => {
  describe('undefined content (placeholder)', () => {
    it('renders dc-content-placeholder when content is undefined', () => {
      const html = renderDocContent(undefined);
      expect(html).toContain('dc-content-placeholder');
    });

    it('shows "Select a document from the navigation" placeholder text', () => {
      const html = renderDocContent(undefined);
      expect(html).toContain('Select a document from the navigation');
    });
  });

  describe('content rendering', () => {
    it('renders dc-content container with data-doc-id', () => {
      const content = makeContent({ entry: makeEntry({ id: 'doc-42' }) });
      const html = renderDocContent(content);
      expect(html).toContain('data-doc-id="doc-42"');
    });

    it('renders document title in dc-content-title', () => {
      const content = makeContent({ entry: makeEntry({ title: 'Nova Operations Guide' }) });
      const html = renderDocContent(content);
      expect(html).toContain('dc-content-title');
      expect(html).toContain('Nova Operations Guide');
    });

    it('renders document body in dc-content-body', () => {
      const content = makeContent({ body: '<p>Step-by-step procedure.</p>' });
      const html = renderDocContent(content);
      expect(html).toContain('dc-content-body');
      expect(html).toContain('Step-by-step procedure.');
    });

    it('renders SE phase badge when sePhaseRef is set', () => {
      const content = makeContent({
        entry: makeEntry({ sePhaseRef: 'Phase D / SIR' }),
      });
      const html = renderDocContent(content);
      expect(html).toContain('dc-content-phase-badge');
      expect(html).toContain('Phase D / SIR');
    });

    it('does not render SE phase badge when sePhaseRef is undefined', () => {
      const content = makeContent({ entry: makeEntry({ sePhaseRef: undefined }) });
      const html = renderDocContent(content);
      expect(html).not.toContain('dc-content-phase-badge');
    });
  });

  describe('cross-reference links', () => {
    it('renders dc-xref-section when crossRefs exist', () => {
      const content = makeContent({
        crossRefs: [{ label: 'Related Runbook', targetId: 'rb-42' }],
      });
      const html = renderDocContent(content);
      expect(html).toContain('dc-xref-section');
    });

    it('renders "See Also" label for cross-references', () => {
      const content = makeContent({
        crossRefs: [{ label: 'See RB-001', targetId: 'rb-1' }],
      });
      const html = renderDocContent(content);
      expect(html).toContain('See Also');
    });

    it('renders dc-xref link with data-target attribute', () => {
      const content = makeContent({
        crossRefs: [{ label: 'Keystone Setup', targetId: 'ch-keystone' }],
      });
      const html = renderDocContent(content);
      expect(html).toContain('class="dc-xref"');
      expect(html).toContain('data-target="ch-keystone"');
      expect(html).toContain('Keystone Setup');
    });

    it('renders multiple cross-reference links', () => {
      const content = makeContent({
        crossRefs: [
          { label: 'Link A', targetId: 'doc-a' },
          { label: 'Link B', targetId: 'doc-b' },
        ],
      });
      const html = renderDocContent(content);
      const xrefCount = (html.match(/class="dc-xref"/g) ?? []).length;
      expect(xrefCount).toBe(2);
    });

    it('does not render dc-xref-section when crossRefs is empty', () => {
      const content = makeContent({ crossRefs: [] });
      const html = renderDocContent(content);
      expect(html).not.toContain('dc-xref-section');
    });
  });

  describe('HTML escaping', () => {
    it('escapes HTML in document title', () => {
      const content = makeContent({
        entry: makeEntry({ title: '<script>alert(1)</script>' }),
      });
      const html = renderDocContent(content);
      expect(html).not.toContain('<script>');
      expect(html).toContain('&lt;script&gt;');
    });

    it('escapes HTML in cross-reference label', () => {
      const content = makeContent({
        crossRefs: [{ label: '<b>Bold</b>', targetId: 'doc-1' }],
      });
      const html = renderDocContent(content);
      expect(html).not.toContain('<b>Bold</b>');
      expect(html).toContain('&lt;b&gt;');
    });
  });
});

// ---------------------------------------------------------------------------
// Edge cases
// ---------------------------------------------------------------------------

describe('edge cases', () => {
  it('renders console with no entries', () => {
    const html = renderDocConsole(makeData({ entries: [] }));
    expect(html).toContain('dc-console');
    expect(html).toContain('No documents available');
  });

  it('renders console with no active content', () => {
    const html = renderDocConsole(makeData({ entries: makeOneOfEach(), activeContent: undefined }));
    expect(html).toContain('dc-content-placeholder');
  });

  it('renders entry with no sePhaseRef without badge', () => {
    const html = renderDocNavigation([makeEntry({ sePhaseRef: undefined })]);
    expect(html).not.toContain('dc-nav-phase-badge');
  });

  it('renders multiple entries in same group', () => {
    const entries = [
      makeEntry({ id: 'ch-1', title: 'Chapter 1', type: 'chapter' }),
      makeEntry({ id: 'ch-2', title: 'Chapter 2', type: 'chapter' }),
      makeEntry({ id: 'ch-3', title: 'Chapter 3', type: 'chapter' }),
    ];
    const html = renderDocNavigation(entries);
    expect(html).toContain('Chapter 1');
    expect(html).toContain('Chapter 2');
    expect(html).toContain('Chapter 3');
    // Only one group heading
    const headingCount = (html.match(/Systems Administrator's Guide/g) ?? []).length;
    expect(headingCount).toBe(1);
  });
});
