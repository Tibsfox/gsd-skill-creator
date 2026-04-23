/**
 * Erdős Problem Index try-session -- first hands-on contact with the open-problem database.
 *
 * Walk a learner through the canonical catalogue at erdosproblems.com: how entries
 * are structured, how status flags move, and how the AI-contributions wiki has started
 * producing rigorous new results.
 *
 * @module departments/mathematics/try-sessions/erdos-problem-index
 */

import type { TrySessionDefinition } from '../../../college/try-session-runner.js';

export const erdosProblemIndexSession: TrySessionDefinition = {
  id: 'math-erdos-problem-index-first-steps',
  title: 'The Erdős Problem Index: A Living Catalogue',
  description:
    'A guided first pass through erdosproblems.com: pick an entry, read its full metadata, ' +
    'trace a status change in the history, and find where AI contributions are logged.',
  estimatedMinutes: 18,
  prerequisites: [],
  steps: [
    {
      instruction:
        'Visit erdosproblems.com and navigate to problem #1. Read its statement, status, prize, and references. Write down the five metadata fields every entry carries.',
      expectedOutcome:
        'You list: (1) unique id, (2) precise formal statement, (3) known partial results, (4) status flag (open / partial / solved), (5) cross-references. A prize may or may not be attached.',
      hint: 'Every entry is structured the same way. Bloom curates the schema.',
      conceptsExplored: ['math-erdos-problem-index', 'math-logarithmic-scales'],
    },
    {
      instruction:
        'Find problem #1196 (the Bloom-Sisask / Tao variant, a minimal-primitive-sum density result). Read the statement. Does this problem involve primes, sequences, or analytic-number-theory bounds?',
      expectedOutcome:
        'You identify #1196 as asking for bounds of the form sum_{a in A} 1 / (a log a), where A is a primitive sequence. It is an analytic number theory question about density bounds.',
      hint: 'The sum 1 / (a log a) diverges for infinite A when density is high; the problem constrains the rate.',
      conceptsExplored: ['math-erdos-problem-index', 'math-logarithmic-scales'],
    },
    {
      instruction:
        'Now visit github.com/teorth/erdosproblems/wiki/AI-contributions-to-Erdős-problems. Read the top three entries. What is the registry recording?',
      expectedOutcome:
        'You understand that the wiki logs every AI-assisted proof attempt with citation, problem id, model used, verification status, and human-author attribution. It is the audit trail for ML-assisted number theory.',
      hint: 'Every logged entry must name a human who takes responsibility. The AI is a collaborator, not a signer.',
      conceptsExplored: ['math-erdos-problem-index'],
    },
    {
      instruction:
        'Find an entry flagged "solved by AI" in the wiki. Read the proof sketch and the verification trail. What counts as "solved"?',
      expectedOutcome:
        'You learn that "solved by AI" requires: (a) AI-generated proof or substantial AI contribution, (b) human verification of the argument, (c) ideally publication or archived preprint. The wiki links to the verification.',
      hint: 'Tao and Bloom explicitly require human attestation; the AI cannot claim a solve by itself.',
      conceptsExplored: ['math-erdos-problem-index'],
    },
    {
      instruction:
        'Read Tao\'s blog post (terrytao.wordpress.com, 31 Aug 2025) about crowdsourcing links between erdosproblems.com and OEIS. What is the connection being built?',
      expectedOutcome:
        'You understand that OEIS (On-Line Encyclopedia of Integer Sequences) contains sequences that often come up in Erdős problems, and the crowdsourced project links each problem to its relevant OEIS entries for easier empirical exploration.',
      hint: 'OEIS is a sequence database; erdosproblems.com is a problem database. Linking them gives numerical experiments a canonical home.',
      conceptsExplored: ['math-erdos-problem-index'],
    },
    {
      instruction:
        'Think about why the Erdős index sits on the algebraic side of the complex plane (theta ~ 16 * 2pi / 19, near the "problem-curation" end of the ring), not the analytic side.',
      expectedOutcome:
        'You articulate that the index is a structured registry of mathematical objects and claims, more algebraic / combinatorial in character than an analytic theorem like blow-up dynamics.',
      hint: 'Problem curation is discrete, bounded, enumerable. Analysis is continuous. The complex-plane mapping puts them on different arcs.',
      conceptsExplored: ['math-erdos-problem-index'],
    },
  ],
};
