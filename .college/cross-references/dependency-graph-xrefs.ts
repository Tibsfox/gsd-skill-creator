/**
 * All directed dependency edges from src/knowledge/packs/dependency-graph.yaml.
 *
 * Each edge A->B means pack A 'enables' pack B (enriches or unlocks B).
 * Edges are expressed as department directory IDs (.college/departments/ names).
 *
 * Pack ID -> Department ID mapping used here:
 * MATH-101->math, SCI-101->science, READ-101->reading, COMM-101->communication,
 * CRIT-101->critical-thinking, PHYS-101->physics, CHEM-101->chemistry,
 * GEO-101->geography, HIST-101->history, PROB-101->problem-solving,
 * STAT-101->statistics, BUS-101->business, ENGR-101->engineering,
 * MFAB-101->materials, TECH-101->technology, CODE-101->coding,
 * DATA-101->data-science, DIGLIT-101->digital-literacy, WRIT-101->writing,
 * LANG-101->languages, LOG-101->logic, ECON-101->economics, ENVR-101->environmental,
 * PSYCH-101->psychology, NUTR-101->nutrition, ART-101->art, PHILO-101->philosophy,
 * NATURE-101->nature-studies, PE-101->physical-education, DOMESTIC-101->home-economics,
 * THEO-101->theology, ASTRO-101->astronomy, LEARN-101->learning, MUSIC-101->music,
 * TRADE-101->trades
 *
 * Edge count: 63 unique directed 'enables' edges from the YAML.
 *
 * @module cross-references/dependency-graph-xrefs
 */

export interface XRefEdge {
  /** Source department directory ID */
  from: string;
  /** Target department directory ID */
  to: string;
  /** Original source pack ID (e.g. 'MATH-101') */
  packFrom: string;
  /** Original target pack ID (e.g. 'CODE-101') */
  packTo: string;
}

/** All directed dependency edges from dependency-graph.yaml, encoded as department IDs. */
export const ALL_XREF_EDGES: readonly XRefEdge[] = [
  // MATH-101 enables (6 edges)
  { from: 'math', to: 'physics', packFrom: 'MATH-101', packTo: 'PHYS-101' },
  { from: 'math', to: 'coding', packFrom: 'MATH-101', packTo: 'CODE-101' },
  { from: 'math', to: 'data-science', packFrom: 'MATH-101', packTo: 'DATA-101' },
  { from: 'math', to: 'economics', packFrom: 'MATH-101', packTo: 'ECON-101' },
  { from: 'math', to: 'astronomy', packFrom: 'MATH-101', packTo: 'ASTRO-101' },
  { from: 'math', to: 'logic', packFrom: 'MATH-101', packTo: 'LOG-101' },
  // SCI-101 enables (4 edges)
  { from: 'science', to: 'physics', packFrom: 'SCI-101', packTo: 'PHYS-101' },
  { from: 'science', to: 'chemistry', packFrom: 'SCI-101', packTo: 'CHEM-101' },
  { from: 'science', to: 'environmental', packFrom: 'SCI-101', packTo: 'ENVR-101' },
  { from: 'science', to: 'nature-studies', packFrom: 'SCI-101', packTo: 'NATURE-101' },
  // READ-101 enables (4 edges)
  { from: 'reading', to: 'writing', packFrom: 'READ-101', packTo: 'WRIT-101' },
  { from: 'reading', to: 'critical-thinking', packFrom: 'READ-101', packTo: 'CRIT-101' },
  { from: 'reading', to: 'history', packFrom: 'READ-101', packTo: 'HIST-101' },
  { from: 'reading', to: 'communication', packFrom: 'READ-101', packTo: 'COMM-101' },
  // COMM-101 enables (3 edges)
  { from: 'communication', to: 'writing', packFrom: 'COMM-101', packTo: 'WRIT-101' },
  { from: 'communication', to: 'business', packFrom: 'COMM-101', packTo: 'BUS-101' },
  { from: 'communication', to: 'languages', packFrom: 'COMM-101', packTo: 'LANG-101' },
  // CRIT-101 enables (3 edges)
  { from: 'critical-thinking', to: 'logic', packFrom: 'CRIT-101', packTo: 'LOG-101' },
  { from: 'critical-thinking', to: 'philosophy', packFrom: 'CRIT-101', packTo: 'PHILO-101' },
  { from: 'critical-thinking', to: 'problem-solving', packFrom: 'CRIT-101', packTo: 'PROB-101' },
  // PHYS-101 enables (3 edges)
  { from: 'physics', to: 'astronomy', packFrom: 'PHYS-101', packTo: 'ASTRO-101' },
  { from: 'physics', to: 'engineering', packFrom: 'PHYS-101', packTo: 'ENGR-101' },
  { from: 'physics', to: 'chemistry', packFrom: 'PHYS-101', packTo: 'CHEM-101' },
  // CHEM-101 enables (3 edges)
  { from: 'chemistry', to: 'environmental', packFrom: 'CHEM-101', packTo: 'ENVR-101' },
  { from: 'chemistry', to: 'nutrition', packFrom: 'CHEM-101', packTo: 'NUTR-101' },
  { from: 'chemistry', to: 'nature-studies', packFrom: 'CHEM-101', packTo: 'NATURE-101' },
  // GEO-101 enables (3 edges)
  { from: 'geography', to: 'environmental', packFrom: 'GEO-101', packTo: 'ENVR-101' },
  { from: 'geography', to: 'astronomy', packFrom: 'GEO-101', packTo: 'ASTRO-101' },
  { from: 'geography', to: 'nature-studies', packFrom: 'GEO-101', packTo: 'NATURE-101' },
  // HIST-101 enables (2 edges)
  { from: 'history', to: 'philosophy', packFrom: 'HIST-101', packTo: 'PHILO-101' },
  { from: 'history', to: 'geography', packFrom: 'HIST-101', packTo: 'GEO-101' },
  // PROB-101 enables (3 edges)
  { from: 'problem-solving', to: 'coding', packFrom: 'PROB-101', packTo: 'CODE-101' },
  { from: 'problem-solving', to: 'engineering', packFrom: 'PROB-101', packTo: 'ENGR-101' },
  { from: 'problem-solving', to: 'data-science', packFrom: 'PROB-101', packTo: 'DATA-101' },
  // STAT-101 enables (2 edges)
  { from: 'statistics', to: 'data-science', packFrom: 'STAT-101', packTo: 'DATA-101' },
  { from: 'statistics', to: 'economics', packFrom: 'STAT-101', packTo: 'ECON-101' },
  // BUS-101 enables (1 edge)
  { from: 'business', to: 'economics', packFrom: 'BUS-101', packTo: 'ECON-101' },
  // ENGR-101 enables (2 edges)
  { from: 'engineering', to: 'materials', packFrom: 'ENGR-101', packTo: 'MFAB-101' },
  { from: 'engineering', to: 'trades', packFrom: 'ENGR-101', packTo: 'TRADE-101' },
  // MFAB-101 enables (1 edge)
  { from: 'materials', to: 'trades', packFrom: 'MFAB-101', packTo: 'TRADE-101' },
  // TECH-101 enables (4 edges)
  { from: 'technology', to: 'coding', packFrom: 'TECH-101', packTo: 'CODE-101' },
  { from: 'technology', to: 'engineering', packFrom: 'TECH-101', packTo: 'ENGR-101' },
  { from: 'technology', to: 'digital-literacy', packFrom: 'TECH-101', packTo: 'DIGLIT-101' },
  { from: 'technology', to: 'trades', packFrom: 'TECH-101', packTo: 'TRADE-101' },
  // CODE-101 enables (2 edges)
  { from: 'coding', to: 'data-science', packFrom: 'CODE-101', packTo: 'DATA-101' },
  { from: 'coding', to: 'digital-literacy', packFrom: 'CODE-101', packTo: 'DIGLIT-101' },
  // DATA-101 enables (1 edge)
  { from: 'data-science', to: 'economics', packFrom: 'DATA-101', packTo: 'ECON-101' },
  // DIGLIT-101 enables (2 edges)
  { from: 'digital-literacy', to: 'coding', packFrom: 'DIGLIT-101', packTo: 'CODE-101' },
  { from: 'digital-literacy', to: 'data-science', packFrom: 'DIGLIT-101', packTo: 'DATA-101' },
  // WRIT-101 enables (3 edges)
  { from: 'writing', to: 'communication', packFrom: 'WRIT-101', packTo: 'COMM-101' },
  { from: 'writing', to: 'philosophy', packFrom: 'WRIT-101', packTo: 'PHILO-101' },
  { from: 'writing', to: 'history', packFrom: 'WRIT-101', packTo: 'HIST-101' },
  // LOG-101 enables (2 edges)
  { from: 'logic', to: 'coding', packFrom: 'LOG-101', packTo: 'CODE-101' },
  { from: 'logic', to: 'philosophy', packFrom: 'LOG-101', packTo: 'PHILO-101' },
  // ECON-101 enables (1 edge)
  { from: 'economics', to: 'business', packFrom: 'ECON-101', packTo: 'BUS-101' },
  // ENVR-101 enables (2 edges)
  { from: 'environmental', to: 'nature-studies', packFrom: 'ENVR-101', packTo: 'NATURE-101' },
  { from: 'environmental', to: 'astronomy', packFrom: 'ENVR-101', packTo: 'ASTRO-101' },
  // PSYCH-101 enables (1 edge)
  { from: 'psychology', to: 'learning', packFrom: 'PSYCH-101', packTo: 'LEARN-101' },
  // NUTR-101 enables (3 edges)
  { from: 'nutrition', to: 'environmental', packFrom: 'NUTR-101', packTo: 'ENVR-101' },
  { from: 'nutrition', to: 'physical-education', packFrom: 'NUTR-101', packTo: 'PE-101' },
  { from: 'nutrition', to: 'home-economics', packFrom: 'NUTR-101', packTo: 'DOMESTIC-101' },
  // PHILO-101 enables (2 edges)
  { from: 'philosophy', to: 'theology', packFrom: 'PHILO-101', packTo: 'THEO-101' },
  { from: 'philosophy', to: 'logic', packFrom: 'PHILO-101', packTo: 'LOG-101' },
] as const;
