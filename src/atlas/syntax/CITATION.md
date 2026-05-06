# src/atlas/syntax — Algorithm Citations

Clean-room state-machine lexer + coarse-AST walker built under ADR 0003 (zero
new external runtime deps for `src/atlas/*`). Replaces Prism (highlight) and
tree-sitter (parse) with one in-repo primitive that emits two streams from one
pass.

## Lexer construction

- Aho, Lam, Sethi, Ullman. *Compilers: Principles, Techniques, and Tools*, 2e
  (Pearson, 2007). §3.5 "The NFA-to-DFA Construction" and §3.6 "The
  Lexical-Analyzer Generator Lex" describe state-machine scanners driven by an
  ordered list of (pattern, action) rules with first-match-wins semantics. Our
  per-state rule ordering is the same idea projected onto a JS regex engine
  (the regex engine itself implements the NFA→DFA path internally).
- Cooper & Torczon. *Engineering a Compiler*, 2e (Morgan Kaufmann, 2011).
  §2.4 "From Regular Expression to Scanner" — practical guidance on state
  stacks for recovering context (nested comments, template strings, JSX), and
  §2.5 on incremental scanners. Our state-stack design (push/pop/replace) is
  patterned after the recommendation there.

## Indent-sensitive scanning (Python)

- van Rossum & Drake. *The Python Language Reference*, §2.1.8 "Indentation"
  (https://docs.python.org/3/reference/lexical_analysis.html#indentation).
  CPython's `Lib/tokenize.py` uses an indent-stack and synthesizes INDENT /
  DEDENT tokens; we follow the same algorithm in `grammars/python.ts`
  postProcess pass with tab-width 8 to match CPython's `tabsize`.

## Coarse-AST extraction

- The walker is a hand-written recursive-descent over the significant-token
  stream. NOT a full parser — only declaration heads (function/class/struct/
  trait/import/export) are recognized. On unfamiliar shapes the walker
  advances one token rather than throwing, in keeping with Cooper & Torczon
  §3.5 "Error Recovery" guidance for forgiving parsers.
- This is sufficient for the W1 indexer (Track A) which only needs symbol
  names + locations; full type-aware navigation is deferred to v2 LSP
  integration per the GSD Code Atlas v1.49.607 mission spec.

## Why no external deps

ADR 0003 (zero new external runtime deps for `src/atlas/*`) is motivated by
the supply-chain hygiene posture and binary-size targets in the milestone
brief. Prism (highlight) drags in a multi-megabyte language pack; tree-sitter
ships native binaries that complicate the npx-installable distribution path.
A first-match-wins regex-rule lexer is sufficient for our use cases, and the
algorithmic substrate has 50+ years of compiler-construction literature
behind it.
