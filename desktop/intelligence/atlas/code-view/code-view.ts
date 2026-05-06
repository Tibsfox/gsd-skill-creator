/**
 * Code View — renders source with syntax highlighting, per-line gutter badges,
 * and symbol hover tooltips with mission attribution.
 *
 * Consumes:
 *   - src/atlas/syntax — W0.5 clean-room tokenizer + highlight-tokens API
 *   - src/intelligence/ipc — atlas_list_provenance_for_line + atlas_get_symbol
 */

import {
  tokenize,
  detectLanguage,
  highlightClass,
} from '../../../../src/atlas/syntax/index.js';
import type { Token } from '../../../../src/atlas/syntax/index.js';
import type {
  AtlasMissionProvenance,
  AtlasSymbol,
  SnapshotId,
  SymbolId,
} from '../../../../src/intelligence/types.js';
import { createGutter } from './gutter.js';
import type { GutterLine, GutterBadgeClickEvent } from './gutter.js';
import { createHoverTooltip } from './hover.js';
import type { HoverTarget } from './hover.js';

export interface CodeViewOptions {
  snapshotId: SnapshotId;
  filePath: string;
  source: string;
  /** Called on pointer-down identifier → symbol selected. */
  onSymbolSelect?: (symbolId: SymbolId) => void;
  /** Called when a mission badge is clicked. */
  onMissionFocus?: (missionId: string) => void;
  /** IPC: fetch provenance for a line. */
  fetchProvenance: (
    snapshotId: SnapshotId,
    filePath: string,
    lineNo: number,
  ) => Promise<AtlasMissionProvenance[]>;
  /** IPC: fetch symbol by id. */
  fetchSymbol: (id: SymbolId) => Promise<AtlasSymbol | null>;
}

export interface FocusTarget {
  file: string;
  line: number;
  symbol_id?: SymbolId;
}

export interface CodeViewComponent {
  mount(parent: HTMLElement): void;
  unmount(): void;
  /** Scroll + flash line; also loads gutter provenance for that line. */
  setFocus(target: FocusTarget): void;
  /** Populate name→symbolId map so click + hover resolve correctly. */
  bindSymbols(symbols: AtlasSymbol[]): void;
  /**
   * Time-lapse overlay: if the currently-viewed file is not in filesPresent,
   * show a banner "This file did not exist at <missionLabel>".
   * Pass null to clear any overlay.
   */
  setTimeLapseFiles(filesPresent: Set<string> | null, missionLabel?: string): void;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function splitIntoLines(source: string): string[] {
  return source.split('\n');
}

function buildLineTokenMap(tokens: Token[]): Map<number, Token[]> {
  const map = new Map<number, Token[]>();
  for (const tok of tokens) {
    const lineArr = map.get(tok.line) ?? [];
    lineArr.push(tok);
    map.set(tok.line, lineArr);
  }
  return map;
}

function renderLineHtml(lineTokens: Token[], rawLine: string): string {
  if (lineTokens.length === 0) return escapeHtml(rawLine);

  let html = '';
  for (const tok of lineTokens) {
    if (tok.kind === 'eof' || tok.kind === 'newline') continue;
    if (tok.kind === 'whitespace' || tok.kind === 'indent' || tok.kind === 'dedent') {
      html += escapeHtml(tok.value);
      continue;
    }
    const cls = highlightClass(tok.kind);
    if (tok.kind === 'identifier') {
      html += `<span class="${cls} cv-sym" data-sym-name="${escapeHtml(tok.value)}">${escapeHtml(tok.value)}</span>`;
    } else {
      html += `<span class="${cls}">${escapeHtml(tok.value)}</span>`;
    }
  }
  return html;
}

export function createCodeView(opts: CodeViewOptions): CodeViewComponent {
  const {
    snapshotId,
    filePath,
    source,
    onSymbolSelect,
    onMissionFocus,
    fetchProvenance,
    fetchSymbol,
  } = opts;

  let rootEl: HTMLElement | null = null;
  let gutterInstance: ReturnType<typeof createGutter> | null = null;
  let hoverInstance: ReturnType<typeof createHoverTooltip> | null = null;
  const cleanupFns: Array<() => void> = [];
  let timeLapseOverlay: HTMLElement | null = null;

  const lang = detectLanguage(filePath);
  const rawLines = splitIntoLines(source);
  const lineCount = rawLines.length;

  const tokens = lang ? tokenize(source, lang) : [];
  const lineTokenMap = buildLineTokenMap(tokens);

  const provenanceCache = new Map<number, AtlasMissionProvenance[]>();
  const nameToSymbolId = new Map<string, SymbolId>();

  function gutterLines(): GutterLine[] {
    return Array.from({ length: lineCount }, (_, i) => ({
      lineNo: i + 1,
      provenance: provenanceCache.get(i + 1) ?? [],
    }));
  }

  async function loadProvenanceForLine(lineNo: number): Promise<void> {
    if (provenanceCache.has(lineNo)) return;
    try {
      const rows = await fetchProvenance(snapshotId, filePath, lineNo);
      provenanceCache.set(lineNo, rows);
      if (gutterInstance) gutterInstance.update(gutterLines());
    } catch {
      provenanceCache.set(lineNo, []);
    }
  }

  function loadProvenanceRange(start: number, end: number): void {
    for (let i = start; i <= end; i++) {
      void loadProvenanceForLine(i);
    }
  }

  function handleBadgeClick(e: GutterBadgeClickEvent): void {
    onMissionFocus?.(e.missionId);
  }

  function buildCodeBody(): HTMLElement {
    const bodyEl = document.createElement('div');
    bodyEl.className = 'cv-body';

    const codeEl = document.createElement('code');
    codeEl.className = 'cv-code';
    bodyEl.appendChild(codeEl);

    for (let i = 0; i < rawLines.length; i++) {
      const lineNo = i + 1;
      const lineEl = document.createElement('span');
      lineEl.className = 'cv-line';
      lineEl.dataset['line'] = String(lineNo);

      const lineTokens = lineTokenMap.get(lineNo) ?? [];
      lineEl.innerHTML = renderLineHtml(lineTokens, rawLines[i]);
      codeEl.appendChild(lineEl);
    }

    return bodyEl;
  }

  function attachInteraction(bodyEl: HTMLElement): void {
    const handlePointerDown = (e: Event): void => {
      const target = e.target as HTMLElement;
      if (!target.classList.contains('cv-sym')) return;
      const name = target.dataset['symName'] ?? '';
      const symId = nameToSymbolId.get(name);
      if (symId && onSymbolSelect) {
        onSymbolSelect(symId);
      }
    };

    const handleMouseOver = (e: Event): void => {
      const target = e.target as HTMLElement;
      if (!target.classList.contains('cv-sym')) return;
      const name = target.dataset['symName'] ?? '';
      const symId = nameToSymbolId.get(name);
      if (!symId || !hoverInstance) return;
      const ht: HoverTarget = { element: target, symbolId: symId };
      hoverInstance.showFor(ht);
    };

    const handleMouseOut = (e: Event): void => {
      const target = e.target as HTMLElement;
      if (!target.classList.contains('cv-sym')) return;
      hoverInstance?.hide();
    };

    bodyEl.addEventListener('pointerdown', handlePointerDown);
    bodyEl.addEventListener('mouseover', handleMouseOver);
    bodyEl.addEventListener('mouseout', handleMouseOut);

    cleanupFns.push(() => {
      bodyEl.removeEventListener('pointerdown', handlePointerDown);
      bodyEl.removeEventListener('mouseover', handleMouseOver);
      bodyEl.removeEventListener('mouseout', handleMouseOut);
    });
  }

  function mount(parent: HTMLElement): void {
    rootEl = document.createElement('div');
    rootEl.className = 'cv-root';
    rootEl.setAttribute('role', 'region');
    rootEl.setAttribute('aria-label', `Source: ${filePath}`);

    gutterInstance = createGutter(gutterLines(), handleBadgeClick);
    rootEl.appendChild(gutterInstance.element);

    const bodyEl = buildCodeBody();
    rootEl.appendChild(bodyEl);

    hoverInstance = createHoverTooltip(fetchSymbol);
    hoverInstance.attach(rootEl);

    attachInteraction(bodyEl);

    cleanupFns.push(() => {
      gutterInstance?.destroy();
      hoverInstance?.detach();
    });

    parent.appendChild(rootEl);
    loadProvenanceRange(1, Math.min(lineCount, 40));
  }

  function unmount(): void {
    cleanupFns.splice(0).forEach(fn => fn());
    rootEl?.remove();
    rootEl = null;
    gutterInstance = null;
    hoverInstance = null;
  }

  function setFocus(target: FocusTarget): void {
    if (!rootEl) return;
    const lineEl = rootEl.querySelector<HTMLElement>(`.cv-line[data-line="${target.line}"]`);
    if (!lineEl) return;

    lineEl.scrollIntoView({ block: 'center', behavior: 'smooth' });
    // Restart flash animation
    lineEl.classList.remove('cv-line--flash');
    // eslint-disable-next-line @typescript-eslint/no-unused-expressions
    lineEl.offsetHeight; // reflow
    lineEl.classList.add('cv-line--flash');

    void loadProvenanceForLine(target.line);
  }

  function bindSymbols(symbols: AtlasSymbol[]): void {
    nameToSymbolId.clear();
    for (const sym of symbols) {
      nameToSymbolId.set(sym.name, sym.id);
    }
  }

  function setTimeLapseFiles(filesPresent: Set<string> | null, missionLabel?: string): void {
    if (timeLapseOverlay) {
      timeLapseOverlay.remove();
      timeLapseOverlay = null;
    }
    if (filesPresent === null || filesPresent.has(filePath)) return;
    if (!rootEl) return;

    const overlay = document.createElement('div');
    overlay.className = 'cv-time-lapse-overlay';
    const msg = missionLabel
      ? `This file did not exist at ${missionLabel}`
      : 'This file did not exist at this point in history';
    const msgEl = document.createElement('span');
    msgEl.className = 'cv-time-lapse-msg';
    msgEl.textContent = msg;
    const closeBtn = document.createElement('button');
    closeBtn.className = 'cv-time-lapse-close';
    closeBtn.textContent = '×';
    closeBtn.setAttribute('aria-label', 'clear time-lapse overlay');
    closeBtn.addEventListener('click', () => {
      overlay.remove();
      timeLapseOverlay = null;
    });
    overlay.appendChild(msgEl);
    overlay.appendChild(closeBtn);
    rootEl.appendChild(overlay);
    timeLapseOverlay = overlay;
  }

  return { mount, unmount, setFocus, bindSymbols, setTimeLapseFiles };
}
