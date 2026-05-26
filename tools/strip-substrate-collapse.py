#!/usr/bin/env python3
r"""Strip substrate-repetition-collapse patterns from contaminated mission-page files.

Single-pass transform:
  Collapse runs of bare adjacent "substrate" tokens separated by whitespace
  down to a single occurrence. Hyphenated identifiers like "substrate-anchor",
  "substrate-cumulative", "substrate-form-distinct" are preserved intact;
  the trailing \b in the regex matches at the hyphen boundary, so a pattern
  like "substrate substrate-cumulative" collapses to "substrate-cumulative"
  (the leading bare-substrate filler is removed; the hyphenated identifier
  is left untouched).

Earlier versions of this script included a "Pass 2" per-paragraph cap and a
"Pass 3" whitespace normaliser. Both were destructive against the v1.150 ..
v1.175 substrate-axis content surface:
  - Pass 2's `\bsubstrate\b` cap stripped the bare "substrate" prefix from
    hyphenated identifiers, leaving orphan tails like " -anchor" / " -cumulative"
    where "substrate-anchor" / "substrate-cumulative" had been intended.
  - Pass 3's `" +([\.,;:])"` rule collapsed CSS class-selector spacing
    (e.g. `body > .nav-card` -> `body >.nav-card`) and broke descendant-vs-
    compound selector semantics (`h1 .subtitle` -> `h1.subtitle`).
Both passes are deliberately omitted here. If the residual content needs
further tightening, do that with a separate targeted tool, not with a
density cap.

Invoked as:
  python3 tools/strip-substrate-collapse.py <file>...

Prints a per-file before/after collapse-count line.
"""

from __future__ import annotations

import re
import sys
from pathlib import Path

# Runs of "substrate" separated only by whitespace -> single "substrate".
# The leading and trailing \b both match at hyphen boundaries, so this regex
# safely collapses "substrate substrate-cumulative" -> "substrate-cumulative"
# while leaving the hyphenated identifier intact.
ADJACENT_RUN = re.compile(r"\bsubstrate(?:\s+substrate)+\b", re.IGNORECASE)

SUBSTRATE_TOKEN = re.compile(r"\bsubstrate\b", re.IGNORECASE)


def transform(text: str) -> str:
    return ADJACENT_RUN.sub("substrate", text)


def count_collapse(text: str) -> int:
    return len(re.findall(r"substrate\s+substrate", text, re.IGNORECASE))


def count_substrate(text: str) -> int:
    return len(SUBSTRATE_TOKEN.findall(text))


def main(args: list[str]) -> int:
    if not args:
        print("usage: strip-substrate-collapse.py <file>...", file=sys.stderr)
        return 2
    for path in args:
        p = Path(path)
        if not p.is_file():
            print(f"skip (not a file): {path}")
            continue
        original = p.read_text(encoding="utf-8")
        cleaned = transform(original)
        before_c = count_collapse(original)
        after_c = count_collapse(cleaned)
        before_s = count_substrate(original)
        after_s = count_substrate(cleaned)
        before_lines = original.count("\n") + 1
        after_lines = cleaned.count("\n") + 1
        if cleaned != original:
            p.write_text(cleaned, encoding="utf-8")
            print(
                f"  {p.name:30s}  collapse: {before_c:3d} -> {after_c:3d}   "
                f"substrate-tokens: {before_s:4d} -> {after_s:4d}   "
                f"lines: {before_lines} -> {after_lines}"
            )
        else:
            print(f"  {p.name:30s}  unchanged")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
