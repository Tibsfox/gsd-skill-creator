/**
 * JSON-LD structured data generators for the GSD Planning Docs Dashboard.
 *
 * Produces Schema.org-compliant JSON-LD strings for embedding in HTML pages:
 * - SoftwareSourceCode for the project index page
 * - ItemList for milestones and roadmap pages
 *
 * All functions return pre-serialized JSON strings ready for injection
 * into a <script type="application/ld+json"> tag via renderLayout's jsonLd parameter.
 */

import type { DashboardData } from './types.js';

// ---------------------------------------------------------------------------
// Project JSON-LD (SoftwareSourceCode)
// ---------------------------------------------------------------------------

/**
 * Generate Schema.org SoftwareSourceCode JSON-LD for the project index page.
 *
 * @param data - Full dashboard data; extracts project info and timestamp.
 * @returns JSON string suitable for a JSON-LD script tag.
 */
export function generateProjectJsonLd(data: DashboardData): string {
  const project = data.project;

  const jsonLd: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareSourceCode',
    name: project?.name ?? 'GSD Dashboard',
    description: project?.description ?? 'GSD Planning Docs Dashboard',
    programmingLanguage: 'TypeScript',
    dateModified: data.generatedAt,
  };

  if (project?.currentMilestone) {
    jsonLd.version = project.currentMilestone.version;
  }

  return JSON.stringify(jsonLd);
}

// ---------------------------------------------------------------------------
// Milestones JSON-LD (ItemList)
// ---------------------------------------------------------------------------

/**
 * Generate Schema.org ItemList JSON-LD for the milestones page.
 *
 * Each milestone becomes a ListItem with position, name, and description.
 *
 * @param data - Full dashboard data; extracts milestones.
 * @returns JSON string suitable for a JSON-LD script tag.
 */
export function generateMilestonesJsonLd(data: DashboardData): string {
  const milestones = data.milestones?.milestones ?? [];

  const itemListElement = milestones.map((ms, index) => ({
    '@type': 'ListItem',
    position: index + 1,
    item: {
      '@type': 'Thing',
      name: `${ms.version} — ${ms.name}`,
      description: ms.goal,
      ...(ms.shipped ? { datePublished: ms.shipped } : {}),
    },
  }));

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Project Milestones',
    numberOfItems: itemListElement.length,
    itemListElement,
  };

  return JSON.stringify(jsonLd);
}

// ---------------------------------------------------------------------------
// Roadmap JSON-LD (ItemList)
// ---------------------------------------------------------------------------

/**
 * Generate Schema.org ItemList JSON-LD for the roadmap page.
 *
 * Each phase becomes a ListItem with position, name, description, and status.
 *
 * @param data - Full dashboard data; extracts roadmap phases.
 * @returns JSON string suitable for a JSON-LD script tag.
 */
export function generateRoadmapJsonLd(data: DashboardData): string {
  const phases = data.roadmap?.phases ?? [];

  const itemListElement = phases.map((phase, index) => ({
    '@type': 'ListItem',
    position: index + 1,
    item: {
      '@type': 'Thing',
      name: `Phase ${phase.number}: ${phase.name}`,
      description: phase.goal,
      status: phase.status,
    },
  }));

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Project Roadmap',
    numberOfItems: itemListElement.length,
    itemListElement,
  };

  return JSON.stringify(jsonLd);
}
