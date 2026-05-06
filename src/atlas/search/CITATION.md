# src/atlas/search — algorithm citations

Clean-room primitive (per ADR 0003). The trigram index is implemented from
standard IR-textbook material; no specific upstream library was consulted.

## Trigram (n-gram) tokenization

The decomposition of a string into overlapping length-3 character n-grams is
textbook material — covered in:

- Manber, U., & Wu, S. (1994). *GLIMPSE: A tool to search through entire file
  systems.* Proceedings of the USENIX Winter 1994 Technical Conference. The
  `agrep` / `glimpse` family of tools popularized the trigram-bucket inverted
  index for approximate substring matching.
- Witten, I. H., Moffat, A., & Bell, T. C. (1999). *Managing Gigabytes:
  Compressing and Indexing Documents and Images* (2nd ed.). Morgan Kaufmann.
  Standard reference for inverted-index construction; the trigram tokenizer is
  one of the listed building blocks.
- Manning, C. D., Raghavan, P., & Schütze, H. (2008). *Introduction to
  Information Retrieval.* Cambridge University Press. §3.2 covers k-gram
  indexes for wildcard / substring queries.

The intersection-of-postings step (find candidate items containing all query
trigrams, ordered smallest-bucket-first for cheapest intersection) is the
standard merge-postings algorithm from the same texts.

## Re-ranking

- **Longest-common-subsequence (LCS).** Classical dynamic-programming
  algorithm; covered in any algorithms textbook (e.g. Cormen, Leiserson,
  Rivest, Stein, *Introduction to Algorithms*, §15.4 "Longest common
  subsequence").
- **First-match position bonus / exact-match boost.** Heuristics from the
  fuzzy-finder lineage (`fzf`, `peco`, VS Code's quick-open). Cited
  informally; no single canonical paper.

## Why clean-room

Per ADR 0003, the search primitive lives outside the W1-locked
`src/intelligence/{symbols,provenance,kb}` perimeter. It builds only on
`src/intelligence/ipc.ts` (read-only consumer of pre-fetched flat lists) and
takes no dependencies on the locked code paths.
