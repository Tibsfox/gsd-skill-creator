// SCRIBE Dashboard — T4 floor demo
// Renders the 32-node T5 sample-provenance graph with the SVG ↔ Canvas substrate
// handoff demonstrated live (per doc 01 §6 substrate ladder).
//
// Pure ES-module; zero npm dependencies; opens directly in a browser via file://
// or via any static server (see `dashboard-service/serve.mjs` in the cartridge).
//
// Architecture maps to the documents:
//   - SubstrateRouter   (doc 01 §9 — chooseSubstrate decision tree)
//   - ForceLayout       (doc 07 — small-N force-directed)
//   - SVGRenderer       (doc 01 §3.1 — N <= 2000)
//   - CanvasRenderer    (doc 01 §3.2 — 2000 < N <= 20000; floor demo's "next rung")
//   - GraphQuery        (doc 08 §3 — LOOKUP / NEIGHBOURHOOD / SEARCH primitives)
//   - InspectorPanel    (doc 08 §4 — selection model + linked highlighting)
//
// Component 07 (v1.49.621 Wave 2): WebGPU layout integration.
//   When WebGPU is available, force-directed layout runs on the GPU via
//   webgpu-layout.js. Falls back to CPU ForceLayout when not available or when
//   window.SCRIBE_FORCE_CPU is set (settings-pane toggle).

import { detectWebGpu, createWebGpuLayout } from './webgpu-layout.js';
import { shouldShowViewerButton, openViewerFor, closeViewer } from './viewer-embed.js';

const SVG_NS = 'http://www.w3.org/2000/svg';

// =============================================================================
// State
// =============================================================================
const state = {
  graph: { nodes: [], edges: [] },
  positions: new Map(),         // node_id -> {x, y}
  selectedId: null,
  hoveredId: null,
  filterMutedSubTypes: new Set(),
  forceMode: 'auto',            // 'auto' | 'svg' | 'canvas'
  activeSubstrate: 'svg',
  camera: { x: 0, y: 0, zoom: 1 },
  layoutAlpha: 1,               // ForceAtlas-lite cooling
  gpuLayoutMode: null,          // 'gpu' | 'cpu' — set after createLayout(); null until first load
};

const subTypeShape = {
  commit: 'circle', decision: 'circle', task: 'circle', file: 'circle',
  alternative: 'circle', evidence: 'circle',
  session: 'rect', person: 'rect', software: 'rect',
};
const subTypeRadius = {
  commit: 12, decision: 11, task: 9, file: 10,
  alternative: 9, evidence: 8, session: 14, person: 10, software: 10,
};
const subTypeOrder = ['commit', 'decision', 'task', 'file', 'alternative', 'evidence', 'session', 'agent'];

// =============================================================================
// Substrate Router (doc 01 §9)
// =============================================================================
function chooseSubstrate(visibleN, override) {
  if (override === 'svg') return 'svg';
  if (override === 'canvas') return 'canvas';
  if (visibleN <= 2000) return 'svg';
  if (visibleN <= 20000) return 'canvas';
  return 'canvas'; // floor demo caps at canvas; webgl/webgpu rungs documented but not implemented
}

// =============================================================================
// ForceLayout — small-N FA-lite (doc 07 §2.3 + §8 small-graph fallback)
// =============================================================================
class ForceLayout {
  constructor(graph, opts = {}) {
    this.nodes = graph.nodes;
    this.edges = graph.edges;
    this.K = opts.K ?? 60;
    this.iterations = 0;
    // Initial circular layout per doc 07 §8 (N < 50 fallback)
    const N = this.nodes.length;
    this.nodes.forEach((n, i) => {
      const a = (i / N) * Math.PI * 2;
      state.positions.set(n.node_id, { x: Math.cos(a) * 220, y: Math.sin(a) * 220, vx: 0, vy: 0 });
    });
  }

  step() {
    const K = this.K;
    const cooling = Math.max(0.05, state.layoutAlpha);
    const positions = state.positions;

    // Repulsion (O(N²); acceptable at N=32)
    for (const a of this.nodes) {
      const pa = positions.get(a.node_id);
      pa.vx *= 0.85; pa.vy *= 0.85;
      for (const b of this.nodes) {
        if (a === b) continue;
        const pb = positions.get(b.node_id);
        let dx = pa.x - pb.x, dy = pa.y - pb.y;
        let d2 = dx*dx + dy*dy;
        if (d2 < 0.01) { dx = (Math.random() - 0.5); dy = (Math.random() - 0.5); d2 = 0.01; }
        const f = (K*K) / d2;
        pa.vx += dx * f * 0.001;
        pa.vy += dy * f * 0.001;
      }
    }

    // Attraction along edges
    for (const e of this.edges) {
      const pa = positions.get(e.src_id);
      const pb = positions.get(e.dst_id);
      if (!pa || !pb) continue;
      const dx = pb.x - pa.x, dy = pb.y - pa.y;
      const d = Math.sqrt(dx*dx + dy*dy) || 0.01;
      const f = (d*d) / K * 0.005;
      pa.vx += dx / d * f;
      pa.vy += dy / d * f;
      pb.vx -= dx / d * f;
      pb.vy -= dy / d * f;
    }

    // Center-of-mass gravity
    for (const n of this.nodes) {
      const p = positions.get(n.node_id);
      p.vx -= p.x * 0.005;
      p.vy -= p.y * 0.005;
    }

    // Integrate (selected node is pinned per doc 08 §13)
    for (const n of this.nodes) {
      if (n.node_id === state.selectedId) continue;
      const p = positions.get(n.node_id);
      p.x += p.vx * cooling;
      p.y += p.vy * cooling;
    }

    this.iterations++;
    state.layoutAlpha = Math.max(0.05, state.layoutAlpha * 0.985);
  }

  isSettled() { return state.layoutAlpha < 0.08; }
}

// =============================================================================
// GraphQuery (doc 08 §3 primitives)
// =============================================================================
class GraphQuery {
  constructor(graph) {
    this.graph = graph;
    this.byId = new Map(graph.nodes.map(n => [n.node_id, n]));
    this.outgoing = new Map();
    this.incoming = new Map();
    for (const n of graph.nodes) { this.outgoing.set(n.node_id, []); this.incoming.set(n.node_id, []); }
    for (const e of graph.edges) {
      this.outgoing.get(e.src_id)?.push(e);
      this.incoming.get(e.dst_id)?.push(e);
    }
  }
  lookup(id) { return this.byId.get(id); }
  neighbors(id) {
    return {
      out: (this.outgoing.get(id) ?? []).map(e => ({ edge: e, node: this.byId.get(e.dst_id) })),
      in:  (this.incoming.get(id) ?? []).map(e => ({ edge: e, node: this.byId.get(e.src_id) })),
    };
  }
  upstream(id, maxDepth = 3) { return this._traverse(id, maxDepth, 'incoming'); }
  downstream(id, maxDepth = 3) { return this._traverse(id, maxDepth, 'outgoing'); }
  _traverse(id, maxDepth, dir) {
    const seen = new Set([id]);
    const result = [];
    let frontier = [id];
    for (let d = 0; d < maxDepth && frontier.length; d++) {
      const next = [];
      for (const cur of frontier) {
        const list = dir === 'outgoing' ? (this.outgoing.get(cur) ?? []) : (this.incoming.get(cur) ?? []);
        for (const e of list) {
          const otherId = dir === 'outgoing' ? e.dst_id : e.src_id;
          if (seen.has(otherId)) continue;
          seen.add(otherId);
          result.push({ depth: d + 1, edge: e, node: this.byId.get(otherId) });
          next.push(otherId);
        }
      }
      frontier = next;
    }
    return result;
  }
  fuzzyFind(query, limit = 10) {
    if (!query) return [];
    const q = query.toLowerCase();
    return this.graph.nodes
      .map(n => ({ node: n, score: this._score(n, q) }))
      .filter(x => x.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }
  _score(node, q) {
    const label = node.label.toLowerCase();
    const id = node.node_id.toLowerCase();
    if (id === q || label === q) return 100;
    if (id.startsWith(q) || label.startsWith(q)) return 50;
    if (id.includes(q) || label.includes(q)) return 25;
    // Cheap bigram overlap as a fuzzy proxy
    let s = 0;
    for (let i = 0; i < q.length - 1; i++) {
      const bg = q.substring(i, i + 2);
      if (label.includes(bg) || id.includes(bg)) s += 1;
    }
    return s > 1 ? s : 0;
  }
}

let query = null;

// =============================================================================
// SVG Renderer (doc 01 §3.1, doc 02 — DOM picking, accessibility per T2 doc 06)
// =============================================================================
const svg = document.getElementById('svg-layer');
const canvas = document.getElementById('canvas-layer');
const ctx = canvas.getContext('2d');

function renderSVG() {
  // Camera transform group
  const w = svg.clientWidth, h = svg.clientHeight;
  svg.innerHTML = '';
  const root = document.createElementNS(SVG_NS, 'g');
  root.setAttribute('transform', `translate(${w/2 + state.camera.x}, ${h/2 + state.camera.y}) scale(${state.camera.zoom})`);
  svg.appendChild(root);

  // Edges first (under nodes)
  const highlightSet = computeHighlightSet();
  for (const e of state.graph.edges) {
    const pa = state.positions.get(e.src_id);
    const pb = state.positions.get(e.dst_id);
    if (!pa || !pb) continue;
    const line = document.createElementNS(SVG_NS, 'line');
    line.setAttribute('x1', pa.x); line.setAttribute('y1', pa.y);
    line.setAttribute('x2', pb.x); line.setAttribute('y2', pb.y);
    let cls = 'edge ' + e.relation;
    if (state.selectedId && !highlightSet.edges.has(e.edge_id)) cls += ' dim';
    if (state.selectedId && highlightSet.edges.has(e.edge_id)) cls += ' highlight';
    line.setAttribute('class', cls);
    root.appendChild(line);
  }

  // Nodes
  for (const n of state.graph.nodes) {
    if (state.filterMutedSubTypes.has(visualSubType(n))) continue;
    const p = state.positions.get(n.node_id);
    if (!p) continue;
    const g = document.createElementNS(SVG_NS, 'g');
    let cls = 'node ' + (n.sub_type === 'person' || n.sub_type === 'software' ? `agent ${n.sub_type}` : n.sub_type);
    if (n.node_id === state.selectedId) cls += ' selected';
    else if (state.selectedId && !highlightSet.nodes.has(n.node_id)) cls += ' dim';
    g.setAttribute('class', cls);
    g.setAttribute('transform', `translate(${p.x}, ${p.y})`);
    g.setAttribute('data-node-id', n.node_id);
    g.setAttribute('role', 'button');
    g.setAttribute('tabindex', '0');
    const title = document.createElementNS(SVG_NS, 'title');
    title.textContent = n.label + '  [' + n.sub_type + ']';
    g.appendChild(title);

    const r = subTypeRadius[n.sub_type] ?? 8;
    const shape = subTypeShape[n.sub_type] ?? 'circle';
    if (shape === 'rect') {
      const rect = document.createElementNS(SVG_NS, 'rect');
      rect.setAttribute('x', -r); rect.setAttribute('y', -r * 0.7);
      rect.setAttribute('width', r * 2); rect.setAttribute('height', r * 1.4);
      rect.setAttribute('rx', 2);
      g.appendChild(rect);
    } else {
      const circle = document.createElementNS(SVG_NS, 'circle');
      circle.setAttribute('r', r);
      g.appendChild(circle);
    }

    if (state.camera.zoom > 0.55) {
      const text = document.createElementNS(SVG_NS, 'text');
      text.setAttribute('x', r + 4); text.setAttribute('y', 4);
      const lbl = n.label.length > 32 ? n.label.substring(0, 30) + '…' : n.label;
      text.textContent = lbl;
      g.appendChild(text);
    }

    g.addEventListener('click', ev => { ev.stopPropagation(); selectNode(n.node_id); });
    g.addEventListener('mouseenter', () => { state.hoveredId = n.node_id; });
    g.addEventListener('mouseleave', () => { state.hoveredId = null; });
    root.appendChild(g);
  }
}

// =============================================================================
// Canvas Renderer (doc 01 §3.2, doc 02 §6 lazy-redraw pattern)
// =============================================================================
function resizeCanvas() {
  const dpr = window.devicePixelRatio || 1;
  canvas.width = canvas.clientWidth * dpr;
  canvas.height = canvas.clientHeight * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

function renderCanvas() {
  const w = canvas.clientWidth, h = canvas.clientHeight;
  ctx.fillStyle = '#0e1116';
  ctx.fillRect(0, 0, w, h);
  ctx.save();
  ctx.translate(w/2 + state.camera.x, h/2 + state.camera.y);
  ctx.scale(state.camera.zoom, state.camera.zoom);

  const palette = {
    commit: '#6cc24a', decision: '#d29922', task: '#4493f8', file: '#58a6ff',
    alternative: '#f85149', evidence: '#a371f7', session: '#db61a2',
    person: '#ffa657', software: '#cc8a45',
  };
  const highlightSet = computeHighlightSet();

  // Edges
  for (const e of state.graph.edges) {
    const pa = state.positions.get(e.src_id);
    const pb = state.positions.get(e.dst_id);
    if (!pa || !pb) continue;
    let alpha = 1;
    let stroke = '#586069';
    if (state.selectedId) {
      if (highlightSet.edges.has(e.edge_id)) { stroke = '#4493f8'; alpha = 1; }
      else { alpha = 0.15; }
    }
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = stroke;
    ctx.lineWidth = highlightSet.edges.has(e.edge_id) ? 1.8 / state.camera.zoom : 1.2 / state.camera.zoom;
    ctx.beginPath();
    ctx.moveTo(pa.x, pa.y); ctx.lineTo(pb.x, pb.y);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;

  // Nodes
  for (const n of state.graph.nodes) {
    if (state.filterMutedSubTypes.has(visualSubType(n))) continue;
    const p = state.positions.get(n.node_id);
    if (!p) continue;
    const r = subTypeRadius[n.sub_type] ?? 8;
    const shape = subTypeShape[n.sub_type] ?? 'circle';
    let fill = palette[n.sub_type] ?? '#888';
    let alpha = 1;
    if (state.selectedId && n.node_id !== state.selectedId && !highlightSet.nodes.has(n.node_id)) alpha = 0.25;
    ctx.globalAlpha = alpha;
    ctx.fillStyle = fill;
    if (shape === 'rect') {
      ctx.fillRect(p.x - r, p.y - r * 0.7, r * 2, r * 1.4);
      ctx.strokeStyle = n.node_id === state.selectedId ? '#fff' : '#0e1116';
      ctx.lineWidth = (n.node_id === state.selectedId ? 3 : 1.5) / state.camera.zoom;
      ctx.strokeRect(p.x - r, p.y - r * 0.7, r * 2, r * 1.4);
    } else {
      ctx.beginPath();
      ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = n.node_id === state.selectedId ? '#fff' : '#0e1116';
      ctx.lineWidth = (n.node_id === state.selectedId ? 3 : 1.5) / state.camera.zoom;
      ctx.stroke();
    }
    if (state.camera.zoom > 0.7) {
      ctx.fillStyle = '#e6edf3';
      ctx.font = `${10 / state.camera.zoom}px -apple-system, sans-serif`;
      ctx.textBaseline = 'middle';
      const lbl = n.label.length > 32 ? n.label.substring(0, 30) + '…' : n.label;
      ctx.fillText(lbl, p.x + r + 4, p.y);
    }
  }
  ctx.globalAlpha = 1;
  ctx.restore();
}

// Canvas hit-test (doc 02 §7.1 — small-N spatial scan; floor-demo variant)
function canvasHitTest(mx, my) {
  const w = canvas.clientWidth, h = canvas.clientHeight;
  // Inverse camera transform
  const x = (mx - w/2 - state.camera.x) / state.camera.zoom;
  const y = (my - h/2 - state.camera.y) / state.camera.zoom;
  // Test in reverse draw order (nodes drawn last are on top)
  for (let i = state.graph.nodes.length - 1; i >= 0; i--) {
    const n = state.graph.nodes[i];
    if (state.filterMutedSubTypes.has(visualSubType(n))) continue;
    const p = state.positions.get(n.node_id);
    if (!p) continue;
    const r = subTypeRadius[n.sub_type] ?? 8;
    const dx = x - p.x, dy = y - p.y;
    if (dx*dx + dy*dy <= (r + 2) * (r + 2)) return n;
  }
  return null;
}

// =============================================================================
// Highlight set (doc 08 §4 linked highlighting)
// =============================================================================
function computeHighlightSet() {
  if (!state.selectedId) return { nodes: new Set(), edges: new Set() };
  const result = { nodes: new Set([state.selectedId]), edges: new Set() };
  const nb = query.neighbors(state.selectedId);
  for (const { edge, node } of nb.out) { result.edges.add(edge.edge_id); if (node) result.nodes.add(node.node_id); }
  for (const { edge, node } of nb.in)  { result.edges.add(edge.edge_id); if (node) result.nodes.add(node.node_id); }
  return result;
}

function visualSubType(n) {
  if (n.sub_type === 'person' || n.sub_type === 'software') return 'agent';
  return n.sub_type;
}

// =============================================================================
// Selection + Inspector (doc 08 §4)
// =============================================================================
function selectNode(id) {
  state.selectedId = id;
  state.layoutAlpha = Math.max(state.layoutAlpha, 0.4); // gentle re-relax around the pin
  renderInspector();
  scheduleRender();
}

function clearSelection() {
  state.selectedId = null;
  renderInspector();
  scheduleRender();
}

function renderInspector() {
  const el = document.getElementById('inspector-content');
  if (!state.selectedId) {
    el.innerHTML = '<div class="empty">click a node to inspect</div>';
    // Close viewer when selection is cleared
    closeViewer();
    return;
  }
  const n = query.lookup(state.selectedId);
  if (!n) { el.innerHTML = '<div class="empty">node not found</div>'; return; }
  const nb = query.neighbors(state.selectedId);
  const upstream = query.upstream(state.selectedId, 3);
  const downstream = query.downstream(state.selectedId, 3);

  const renderField = (label, value, mono) =>
    `<div class="field"><div class="field-label">${label}</div><div class="field-value${mono ? ' mono' : ''}">${escapeHtml(value)}</div></div>`;

  const renderNeighborList = (list, dirLabel) => {
    if (!list.length) return '';
    const items = list.map(({ edge, node }) => {
      if (!node) return '';
      const rel = edge.relation;
      return `<div class="neighbor" data-id="${escapeHtml(node.node_id)}"><span class="relation">${escapeHtml(rel)} →</span><br />${escapeHtml(node.label)}</div>`;
    }).join('');
    return `<div class="field"><div class="field-label">${dirLabel} (${list.length})</div><div class="neighbor-list">${items}</div></div>`;
  };

  // CAP-041: viewer button shown for roundtrip-event nodes and other supported sub_types
  const showViewerBtn = shouldShowViewerButton(n);

  el.innerHTML = `
    ${renderField('label', n.label)}
    ${renderField('node_id', n.node_id, true)}
    ${renderField('node_type / sub_type', `${n.node_type} / ${n.sub_type}`, true)}
    ${renderNeighborList(nb.out, 'OUTGOING')}
    ${renderNeighborList(nb.in, 'INCOMING')}
    <div class="field"><div class="field-label">UPSTREAM (≤3 hops)</div><div class="field-value">${upstream.length} nodes</div></div>
    <div class="field"><div class="field-label">DOWNSTREAM (≤3 hops)</div><div class="field-value">${downstream.length} nodes</div></div>
    ${showViewerBtn ? `<div class="field viewer-btn-row"><button id="btn-open-viewer" class="viewer-open-btn" data-node-id="${escapeHtml(n.node_id)}">Open Round-Trip Viewer (T3)</button></div>` : ''}
  `;
  el.querySelectorAll('.neighbor').forEach(div => {
    div.addEventListener('click', () => selectNode(div.dataset.id));
  });

  // Wire the viewer button (CAP-041)
  if (showViewerBtn) {
    const btnOpenViewer = el.querySelector('#btn-open-viewer');
    if (btnOpenViewer) {
      btnOpenViewer.addEventListener('click', () => {
        openViewerFor(n.node_id, { inspectorEl: el });
      });
    }
  }
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

// =============================================================================
// Substrate switching (doc 01 §6 hand-off mechanics)
// =============================================================================
let renderScheduled = false;
function scheduleRender() {
  if (renderScheduled) return;
  renderScheduled = true;
  requestAnimationFrame(() => {
    renderScheduled = false;
    doRender();
  });
}

function doRender() {
  const visibleN = state.graph.nodes.length - state.filterMutedSubTypes.size;
  const desired = chooseSubstrate(visibleN, state.forceMode === 'auto' ? null : state.forceMode);

  if (desired !== state.activeSubstrate) {
    handoffSubstrate(desired);
  }

  if (state.activeSubstrate === 'svg') {
    renderSVG();
    canvas.classList.remove('active');
    svg.classList.remove('hidden');
  } else {
    renderCanvas();
    canvas.classList.add('active');
    svg.classList.add('hidden');
  }
  updateBadges();
}

function handoffSubstrate(to) {
  state.activeSubstrate = to;
  document.getElementById('stage').classList.remove('handoff');
  // Force reflow
  void document.getElementById('stage').offsetWidth;
  document.getElementById('stage').classList.add('handoff');
}

function updateBadges() {
  document.getElementById('substrate-badge').textContent = `substrate: ${state.activeSubstrate}`;
  document.getElementById('stat-nodes').textContent = `${state.graph.nodes.length} nodes`;
  document.getElementById('stat-edges').textContent = `${state.graph.edges.length} edges`;
  document.getElementById('stat-zoom').textContent = `zoom ${state.camera.zoom.toFixed(2)}x`;
}

// =============================================================================
// Camera (pan + zoom)
// =============================================================================
const stage = document.getElementById('stage');

let dragging = false, dragStart = null, cameraStart = null;
stage.addEventListener('pointerdown', ev => {
  if (ev.target.closest('.node')) return; // don't drag on node click
  if (state.activeSubstrate === 'canvas') {
    const rect = canvas.getBoundingClientRect();
    const hit = canvasHitTest(ev.clientX - rect.left, ev.clientY - rect.top);
    if (hit) { selectNode(hit.node_id); return; }
  }
  dragging = true;
  dragStart = { x: ev.clientX, y: ev.clientY };
  cameraStart = { ...state.camera };
  stage.setPointerCapture(ev.pointerId);
});
stage.addEventListener('pointermove', ev => {
  if (!dragging) return;
  state.camera.x = cameraStart.x + (ev.clientX - dragStart.x);
  state.camera.y = cameraStart.y + (ev.clientY - dragStart.y);
  scheduleRender();
});
stage.addEventListener('pointerup', ev => {
  if (dragging) {
    dragging = false;
    if (Math.hypot(ev.clientX - dragStart.x, ev.clientY - dragStart.y) < 4) {
      // Treat as click on empty space → clear selection
      clearSelection();
    }
    try { stage.releasePointerCapture(ev.pointerId); } catch (_) {}
  }
});
stage.addEventListener('wheel', ev => {
  ev.preventDefault();
  const factor = ev.deltaY > 0 ? 0.9 : 1.1;
  const newZoom = Math.max(0.15, Math.min(6, state.camera.zoom * factor));
  state.camera.zoom = newZoom;
  scheduleRender();
}, { passive: false });

function fitToViewport() {
  const w = stage.clientWidth, h = stage.clientHeight;
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const n of state.graph.nodes) {
    const p = state.positions.get(n.node_id); if (!p) continue;
    minX = Math.min(minX, p.x); minY = Math.min(minY, p.y);
    maxX = Math.max(maxX, p.x); maxY = Math.max(maxY, p.y);
  }
  const gw = (maxX - minX) || 1, gh = (maxY - minY) || 1;
  const z = Math.min(w / (gw + 80), h / (gh + 80));
  state.camera.zoom = Math.max(0.3, Math.min(2.5, z));
  state.camera.x = -(minX + gw / 2) * state.camera.zoom;
  state.camera.y = -(minY + gh / 2) * state.camera.zoom;
  scheduleRender();
}

// =============================================================================
// Search
// =============================================================================
const searchInput = document.getElementById('search');
const searchResults = document.getElementById('search-results');
searchInput.addEventListener('input', () => {
  const q = searchInput.value.trim();
  const results = query.fuzzyFind(q, 10);
  searchResults.innerHTML = results.map(({ node }) =>
    `<div class="search-result" data-id="${escapeHtml(node.node_id)}">${escapeHtml(node.label)} <span style="color:var(--text-dim)">[${node.sub_type}]</span></div>`
  ).join('');
  searchResults.querySelectorAll('.search-result').forEach(el => {
    el.addEventListener('click', () => selectNode(el.dataset.id));
  });
});

// =============================================================================
// Keyboard
// =============================================================================
window.addEventListener('keydown', ev => {
  if (ev.target.tagName === 'INPUT') return;
  if (ev.key === '/') { ev.preventDefault(); searchInput.focus(); }
  else if (ev.key === 'Escape') { clearSelection(); }
  else if (ev.key === 'f') { fitToViewport(); }
  else if (ev.key === 'e' && state.selectedId) {
    const next = query.downstream(state.selectedId, 1);
    if (next.length) selectNode(next[0].node.node_id);
  }
  else if (ev.key === 'E' && state.selectedId) {
    const prev = query.upstream(state.selectedId, 1);
    if (prev.length) selectNode(prev[0].node.node_id);
  }
});

// =============================================================================
// Substrate-mode buttons
// =============================================================================
function setForceMode(mode) {
  state.forceMode = mode;
  for (const id of ['btn-svg', 'btn-canvas', 'btn-auto']) {
    document.getElementById(id).classList.toggle('active',
      (mode === 'svg' && id === 'btn-svg') ||
      (mode === 'canvas' && id === 'btn-canvas') ||
      (mode === 'auto' && id === 'btn-auto'));
  }
  scheduleRender();
}
document.getElementById('btn-svg').onclick = () => setForceMode('svg');
document.getElementById('btn-canvas').onclick = () => setForceMode('canvas');
document.getElementById('btn-auto').onclick = () => setForceMode('auto');
document.getElementById('btn-fit').onclick = fitToViewport;

// =============================================================================
// Legend / filter
// =============================================================================
function renderLegend() {
  const legendEl = document.getElementById('legend');
  legendEl.innerHTML = subTypeOrder.map(st => {
    const swatch = `legend-swatch ${st === 'agent' ? 'agent' : st}`;
    const muted = state.filterMutedSubTypes.has(st) ? ' muted' : '';
    return `<div class="legend-item${muted}" data-sub="${st}"><span class="${swatch}"></span>${st}</div>`;
  }).join('');
  legendEl.querySelectorAll('.legend-item').forEach(el => {
    el.addEventListener('click', () => {
      const st = el.dataset.sub;
      if (state.filterMutedSubTypes.has(st)) state.filterMutedSubTypes.delete(st);
      else state.filterMutedSubTypes.add(st);
      renderLegend();
      scheduleRender();
    });
  });
}

// =============================================================================
// Layout factory — WebGPU auto-detection + CPU fallback
// =============================================================================

/**
 * Create the best available layout engine for the current graph.
 * If window.SCRIBE_FORCE_CPU is truthy (Force CPU toggle), always returns CPU.
 * Otherwise attempts WebGPU; falls back to CPU if unavailable.
 *
 * @param {{ nodes: Array, edges: Array }} graph
 * @returns {Promise<WebGpuLayout | ForceLayout>}
 */
async function createLayout(graph) {
  // Destroy previous GPU layout to release GPU resources
  if (state.layout && typeof state.layout.destroy === 'function') {
    state.layout.destroy();
  }

  if (!window.SCRIBE_FORCE_CPU) {
    try {
      const probe = await detectWebGpu();
      if (probe.supported) {
        const gpuLayout = await createWebGpuLayout(graph);
        if (gpuLayout) {
          state.gpuLayoutMode = 'gpu';
          updateGpuBadge();
          return gpuLayout;
        }
      }
    } catch (err) {
      console.warn('[SCRIBE] WebGPU probe failed, using CPU layout:', err.message);
    }
  }

  state.gpuLayoutMode = 'cpu';
  updateGpuBadge();
  return new ForceLayout(graph);
}

/**
 * Update the GPU-mode badge in the header (if present).
 * Non-fatal if the element doesn't exist.
 */
function updateGpuBadge() {
  const el = document.getElementById('gpu-layout-badge');
  if (!el) return;
  if (state.gpuLayoutMode === 'gpu') {
    el.textContent = 'layout: GPU';
    el.style.color = 'var(--commit)';
  } else if (state.gpuLayoutMode === 'cpu') {
    el.textContent = 'layout: CPU';
    el.style.color = 'var(--text-dim)';
  } else {
    el.textContent = 'layout: —';
    el.style.color = 'var(--text-dim)';
  }
}

// =============================================================================
// Corpus loaders
// =============================================================================
async function loadSampleProvenance() {
  document.getElementById('placeholder').classList.add('hidden');
  const r = await fetch('./data/sample-graph.json');
  const data = await r.json();
  state.graph = { nodes: data.nodes, edges: data.edges };
  state.positions = new Map();
  state.layoutAlpha = 1;
  query = new GraphQuery(state.graph);
  state.layout = await createLayout(state.graph);
  state.selectedId = null;
  // Seed positions from the layout (GPU provides initial circular layout via getPositions)
  if (typeof state.layout.getPositions === 'function') {
    const pos = await state.layout.getPositions();
    for (const [id, p] of pos) { state.positions.set(id, { ...p }); }
  }
  renderLegend();
  renderInspector();
  fitToViewport();
}

async function loadCodebaseSlice() {
  // Stretch demo — synthesize a 1K-file slice graph procedurally for substrate-handoff demonstration.
  // (Real implementation would scan the gsd-skill-creator repo; for the floor demo we synthesize.)
  document.getElementById('placeholder').classList.add('hidden');
  const N_MODULES = 12, FILES_PER_MODULE = 80;
  const nodes = [], edges = [];
  for (let m = 0; m < N_MODULES; m++) {
    nodes.push({ node_id: `module:m${m}`, node_type: 'Entity', sub_type: 'file', label: `module-${m}/` });
    for (let f = 0; f < FILES_PER_MODULE; f++) {
      const id = `file:m${m}/file${f}.ts`;
      nodes.push({ node_id: id, node_type: 'Entity', sub_type: 'file', label: `m${m}/file${f}.ts` });
      edges.push({ edge_id: `e_${m}_${f}_in`, src_id: id, dst_id: `module:m${m}`, relation: 'used' });
      // a few cross-module edges
      if (f % 7 === 0 && m > 0) {
        edges.push({ edge_id: `e_${m}_${f}_x`, src_id: id, dst_id: `module:m${m - 1}`, relation: 'used' });
      }
    }
  }
  state.graph = { nodes, edges };
  state.positions = new Map();
  state.layoutAlpha = 1;
  query = new GraphQuery(state.graph);
  state.layout = await createLayout(state.graph);
  state.selectedId = null;
  // Seed positions from the layout (GPU provides initial circular layout via getPositions)
  if (typeof state.layout.getPositions === 'function') {
    const pos = await state.layout.getPositions();
    for (const [id, p] of pos) { state.positions.set(id, { ...p }); }
  }
  renderLegend();
  renderInspector();
  fitToViewport();
}

document.getElementById('corpus-sample').onclick = function() {
  document.querySelectorAll('.corpus-buttons button').forEach(b => b.classList.remove('active'));
  this.classList.add('active');
  loadSampleProvenance();
};
document.getElementById('corpus-codebase-slice').onclick = function() {
  document.querySelectorAll('.corpus-buttons button').forEach(b => b.classList.remove('active'));
  this.classList.add('active');
  loadCodebaseSlice();
};

// =============================================================================
// Force CPU toggle — settings pane
// =============================================================================
(function wireForceCpuToggle() {
  const toggle = document.getElementById('force-cpu-toggle');
  const hint = document.getElementById('force-cpu-hint');
  if (!toggle) return;
  toggle.addEventListener('change', (e) => {
    window.SCRIBE_FORCE_CPU = e.target.checked;
    if (hint) {
      hint.textContent = window.SCRIBE_FORCE_CPU
        ? 'CPU forced — reload a corpus to apply'
        : 'Auto-detect (GPU preferred) — reload a corpus to apply';
    }
    // Note: the change takes effect on the next corpus load.
    // We intentionally do NOT reload automatically to avoid interrupting the user.
    // To apply immediately, the user can click a corpus button.
  });
})();

// =============================================================================
// Animation loop (layout step + lazy redraw)
// =============================================================================
//
// GPU layout: step() is async (fire-and-forget GPU dispatch); getPositions()
// reads back the buffer. We run one GPU step per tick for simplicity.
// CPU layout: step() is synchronous; we run 3 steps per tick (original behavior).
//
let _tickRunning = false; // guard against recursive tick overlap

async function tick() {
  if (state.layout && !state.layout.isSettled()) {
    if (state.gpuLayoutMode === 'gpu' && typeof state.layout.getPositions === 'function') {
      // GPU path: one step per tick; read back positions after the GPU finishes
      if (!_tickRunning) {
        _tickRunning = true;
        try {
          await state.layout.step();
          const pos = await state.layout.getPositions();
          for (const [id, p] of pos) {
            // Preserve vx/vy from existing state if present (for CPU compat; GPU sets vx=vy=0)
            const cur = state.positions.get(id);
            state.positions.set(id, { x: p.x, y: p.y, vx: cur ? cur.vx : 0, vy: cur ? cur.vy : 0 });
          }
          // Sync layoutAlpha so isSettled() check on CPU path stays consistent
          state.layoutAlpha = state.layout._alpha ?? state.layoutAlpha;
          scheduleRender();
        } finally {
          _tickRunning = false;
        }
      }
    } else {
      // CPU path (original behavior): 3 synchronous steps per tick
      for (let i = 0; i < 3; i++) state.layout.step();
      scheduleRender();
    }
  }
  requestAnimationFrame(tick);
}

// =============================================================================
// Bootstrap
// =============================================================================

// Global CPU override flag — set by the "Force CPU layout" toggle.
// Setting this before layout creation (or after a corpus reload) takes effect.
window.SCRIBE_FORCE_CPU = window.SCRIBE_FORCE_CPU ?? false;

window.addEventListener('resize', () => { resizeCanvas(); scheduleRender(); });
resizeCanvas();
loadSampleProvenance();
tick();
