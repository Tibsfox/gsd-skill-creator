/**
 * Research Series Navigation Configuration
 * www/tibsfox/com/Research/series.js
 *
 * Nav bar entries for all Tibsfox Research series and clusters.
 * Used by research pages to render consistent top navigation.
 *
 * Format: each entry has id, label, href (relative from Research/), cluster, and optional tags.
 */

export const researchSeries = [
  // ─── Pacific Northwest ────────────────────────────────────────────────
  {
    id: 'pnw',
    label: 'PNW Series',
    href: 'PNW/index.html',
    cluster: 'PNW',
    tags: ['ecology', 'bioregion', 'flagship'],
  },

  // ─── NASA Missions ────────────────────────────────────────────────────
  {
    id: 'nasa',
    label: 'NASA Missions',
    href: 'NASA/index.html',
    cluster: 'NASA',
    tags: ['space', 'history', 'flagship'],
  },
  {
    id: 'artemis-ii',
    label: 'Artemis II',
    href: 'NASA/artemis-ii/index.html',
    cluster: 'NASA',
    tags: ['space', 'live', 'hot'],
  },

  // ─── Seattle 360 Engine ───────────────────────────────────────────────
  {
    id: 's36',
    label: 'Seattle 360',
    href: 'S36/index.html',
    cluster: 'S36',
    tags: ['music', 'seattle'],
  },

  // ─── Sound of Puget Sound ─────────────────────────────────────────────
  {
    id: 'sps',
    label: 'Sound of Puget Sound',
    href: 'SPS/index.html',
    cluster: 'SPS',
    tags: ['birds', 'music', 'pnw'],
  },

  // ─── Nonlinear Frontier (v1.49.568) ──────────────────────────────────
  {
    id: 'nlf-hub',
    label: 'Nonlinear Frontier',
    href: 'BLN/nonlinear-frontier/index.html',
    cluster: 'AI-COMPUTATION',
    tags: ['math', 'physics', 'nlf'],
  },
  {
    id: 'csp-soliton',
    label: 'Soliton Resolution',
    href: 'CSP/soliton-resolution/index.html',
    cluster: 'AI-COMPUTATION',
    tags: ['math', 'pde'],
  },
  {
    id: 'tibs-merle',
    label: 'Merle 2026',
    href: 'TIBS/merle-breakthrough-2026/index.html',
    cluster: 'TIBS',
    tags: ['math', 'biography'],
  },
  {
    id: 'tibs-erdos-1196',
    label: 'Erd\u0151s #1196',
    href: 'TIBS/erdos-1196-ai-proof/index.html',
    cluster: 'AI-COMPUTATION',
    tags: ['math', 'ai', 'tibs'],
  },

  // ─── Drift in LLM Systems (v1.49.569) — AI & Computation cluster ─────
  {
    id: 'drift-hub',
    label: 'Drift in LLM Systems',
    href: 'DRIFT/index.html',
    cluster: 'AI-COMPUTATION',
    tags: ['ai', 'llm', 'drift', 'alignment', 'retrieval'],
  },
  {
    id: 'drift-knowledge',
    label: 'Drift: Knowledge',
    href: 'DRIFT/knowledge.html',
    cluster: 'AI-COMPUTATION',
    tags: ['ai', 'llm', 'drift', 'knowledge'],
    parent: 'drift-hub',
  },
  {
    id: 'drift-alignment',
    label: 'Drift: Alignment',
    href: 'DRIFT/alignment.html',
    cluster: 'AI-COMPUTATION',
    tags: ['ai', 'llm', 'drift', 'alignment'],
    parent: 'drift-hub',
  },
  {
    id: 'drift-retrieval',
    label: 'Drift: Retrieval',
    href: 'DRIFT/retrieval.html',
    cluster: 'AI-COMPUTATION',
    tags: ['ai', 'llm', 'drift', 'retrieval', 'rag'],
    parent: 'drift-hub',
  },

  // ─── GFX ──────────────────────────────────────────────────────────────
  {
    id: 'gfx',
    label: 'Graphics APIs',
    href: 'GFX/index.html',
    cluster: 'GFX',
    tags: ['gpu', 'opengl', 'vulkan'],
  },

  // ─── Live Observatories ───────────────────────────────────────────────
  {
    id: 'muk',
    label: 'Mukilteo Observatory',
    href: 'MUK/index.html',
    cluster: 'MUK',
    tags: ['weather', 'live', 'pnw'],
  },
  {
    id: 'sol',
    label: 'SOL Celestial',
    href: 'SOL/index.html',
    cluster: 'SOL',
    tags: ['sun', 'moon', 'live'],
  },
  {
    id: 'forest',
    label: 'Forest Sim',
    href: 'forest/index.html',
    cluster: 'SYS',
    tags: ['simulation', 'live'],
  },
];

/**
 * AI & Computation Rosetta cluster membership.
 * Phase 690 adds drift-hub as the 6th member.
 */
export const aiComputationCluster = {
  id: 'AI-COMPUTATION',
  label: 'AI \u0026 Computation',
  description: 'LLM systems, GPU computation, AI mathematics, and drift research',
  members: [
    'tibs-erdos-1196',    // Erdos #1196 AI proof (TIBS)
    'gfx',                // Graphics APIs / GPU computation
    'nlf-hub',            // Nonlinear Frontier (BLN M5 AI weather)
    'csp-soliton',        // Soliton resolution (complex-plane computational methods)
    'tibs-merle',         // Merle Breakthrough Prize 2026
    'drift-hub',          // Drift in LLM Systems (Phase 690 — NEW)
  ],
};

/**
 * Get all series entries for a given cluster.
 */
export function getClusterSeries(clusterId) {
  return researchSeries.filter((s) => s.cluster === clusterId);
}

/**
 * Get a series entry by id.
 */
export function getSeriesById(id) {
  return researchSeries.find((s) => s.id === id) ?? null;
}
