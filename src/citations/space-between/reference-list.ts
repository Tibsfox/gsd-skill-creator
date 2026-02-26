/**
 * Curated reference list for "The Space Between".
 *
 * Ground truth list of expected citations for the mathematical textbook.
 * Used to compute recall metrics when testing the citation extraction pipeline.
 * Each entry is a partial CitedWork with the minimum fields needed for matching.
 */

import type { CitedWork } from '../types/index.js';

/**
 * Curated references from "The Space Between" and its gateway document.
 * These represent the intellectual foundations the book draws upon.
 */
export const SPACE_BETWEEN_REFERENCES: Array<Partial<CitedWork>> = [
  // Carl Sagan - Cosmos (1980)
  {
    title: 'Cosmos',
    authors: [{ family: 'Sagan', given: 'Carl' }],
    year: 1980,
    type: 'book',
    publisher: 'Random House',
    tags: ['cosmology', 'philosophy'],
  },

  // Claude Shannon - A Mathematical Theory of Communication (1948)
  {
    title: 'A Mathematical Theory of Communication',
    authors: [{ family: 'Shannon', given: 'Claude E.' }],
    year: 1948,
    type: 'article',
    journal: 'Bell System Technical Journal',
    doi: '10.1002/j.1538-7305.1948.tb01338.x',
    tags: ['information-theory', 'mathematics'],
  },

  // Aristid Lindenmayer - Mathematical models for cellular interactions in development (1968)
  {
    title: 'Mathematical models for cellular interactions in development',
    authors: [{ family: 'Lindenmayer', given: 'Aristid' }],
    year: 1968,
    type: 'article',
    journal: 'Journal of Theoretical Biology',
    tags: ['l-systems', 'mathematics', 'biology'],
  },

  // Euclid - Elements (~300 BCE, use conventional year)
  {
    title: 'Elements',
    authors: [{ family: 'Euclid' }],
    year: 1482, // First printed edition (editio princeps)
    type: 'book',
    tags: ['geometry', 'mathematics', 'foundations'],
  },

  // Pythagoras (unit circle, mathematical relationships) — attributed reference
  {
    title: 'Pythagorean Theorem',
    authors: [{ family: 'Pythagoras' }],
    year: 1482, // Conventional reference (ancient, no publication year)
    type: 'other',
    tags: ['geometry', 'mathematics', 'foundations'],
  },

  // Rudolf Clausius - On the Mechanical Theory of Heat (thermodynamics, entropy)
  {
    title: 'On the Mechanical Theory of Heat',
    authors: [{ family: 'Clausius', given: 'Rudolf' }],
    year: 1867,
    type: 'book',
    tags: ['thermodynamics', 'physics'],
  },

  // Werner Heisenberg - Uncertainty principle / quantum mechanics
  {
    title: 'Über den anschaulichen Inhalt der quantentheoretischen Kinematik und Mechanik',
    authors: [{ family: 'Heisenberg', given: 'Werner' }],
    year: 1927,
    type: 'article',
    journal: 'Zeitschrift für Physik',
    tags: ['quantum-mechanics', 'physics'],
  },

  // Saunders Mac Lane - Categories for the Working Mathematician (1971)
  {
    title: 'Categories for the Working Mathematician',
    authors: [{ family: 'Mac Lane', given: 'Saunders' }],
    year: 1971,
    type: 'book',
    publisher: 'Springer',
    tags: ['category-theory', 'mathematics'],
  },

  // J. Willard Gibbs - vector calculus foundations
  {
    title: 'Vector Analysis',
    authors: [{ family: 'Gibbs', given: 'J. Willard' }, { family: 'Wilson', given: 'Edwin Bidwell' }],
    year: 1901,
    type: 'book',
    publisher: 'Scribner',
    tags: ['vector-calculus', 'mathematics'],
  },

  // Joseph Fourier - Théorie analytique de la chaleur (trigonometry/signal processing)
  {
    title: 'Théorie analytique de la chaleur',
    authors: [{ family: 'Fourier', given: 'Joseph' }],
    year: 1822,
    type: 'book',
    tags: ['analysis', 'mathematics', 'signal-processing'],
  },
];

/** Total count of curated references for recall calculation. */
export const REFERENCE_COUNT = SPACE_BETWEEN_REFERENCES.length;
