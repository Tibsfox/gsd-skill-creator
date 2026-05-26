#!/usr/bin/env python3
r"""Heal orphan-tail damage in mission-page files contaminated by the broken
Pass-2 strip-substrate-collapse.py (since fixed).

Damage signatures
-----------------
The buggy Pass-2 cap matched the bare token \bsubstrate\b inside hyphenated
identifiers like substrate-anchor / substrate-cumulative / substrate-form-X,
then stripped the matched "substrate" but left the hyphenated tail intact.
Two resulting damage shapes:

  Pattern A — prefix-substrate (most common):
    Original: " substrate-anchor"
    Damaged:  " -anchor"                (Pass-2 left-walked through the
                                         preceding space and stripped it
                                         along with "substrate".)

  Pattern B — internal-substrate (rarer):
    Original: "spreading-substrate-presence"
    Damaged:  "spreading- -presence"    (Pass-2 found the bare "substrate"
                                         between hyphens, no leading space
                                         to consume, replaced with " ".)

Heal strategy
-------------
The orphan suffix's first hyphen-segment must be a recognised substrate-vocab
root. This explicit allow-list avoids false-positive heals on CSS vendor
prefixes (-apple-system, -webkit-X) and arbitrary hyphenated tokens.

Pattern B is healed first (it would otherwise leave a damaged " -X" pattern
that Pattern A would then handle incorrectly with a leading space).

Invoked as:
  python3 tools/heal-orphan-tails.py <file>...

Prints a per-file heal-count line (A heals + B heals).
"""

from __future__ import annotations

import re
import sys
from pathlib import Path

ROOTS = [
    "anchor",
    "anchors",
    "anticipation",
    "axis",
    "cohort-pair",
    "convention",
    "cumulative",
    "distinct",
    "distinction",
    "distinctions",
    "distinctive",
    "extent",
    "form",
    "investigations",
    "presence",
    "realization",
    "rich-and-dense",
    "thread",
]
ROOTS.sort(key=len, reverse=True)

_ROOTS_ALT = "|".join(re.escape(r) for r in ROOTS)

# Pattern B: internal-substrate damage. "X- -root..." -> "X-substrate-root..."
INTERNAL = re.compile(
    r"\b([a-z]+)- -(" + _ROOTS_ALT + r")((?:-[a-z]+)*)\b"
)

# Pattern A: prefix-substrate damage. " -root..." -> " substrate-root..."
PREFIX = re.compile(
    r"(?<=\s)-(" + _ROOTS_ALT + r")((?:-[a-z]+)*)\b"
)


def transform(text: str) -> tuple[str, int, int]:
    internal_count = [0]
    prefix_count = [0]

    def repl_internal(m: re.Match) -> str:
        internal_count[0] += 1
        return f"{m.group(1)}-substrate-{m.group(2)}{m.group(3)}"

    def repl_prefix(m: re.Match) -> str:
        prefix_count[0] += 1
        return f"substrate-{m.group(1)}{m.group(2)}"

    healed = INTERNAL.sub(repl_internal, text)
    healed = PREFIX.sub(repl_prefix, healed)
    return healed, internal_count[0], prefix_count[0]


def main(args: list[str]) -> int:
    if not args:
        print("usage: heal-orphan-tails.py <file>...", file=sys.stderr)
        return 2
    for path in args:
        p = Path(path)
        if not p.is_file():
            print(f"skip (not a file): {path}")
            continue
        original = p.read_text(encoding="utf-8")
        healed, n_internal, n_prefix = transform(original)
        if healed != original:
            p.write_text(healed, encoding="utf-8")
            print(
                f"  {p.name:30s}  internal: {n_internal:3d}   "
                f"prefix: {n_prefix:3d}"
            )
        else:
            print(f"  {p.name:30s}  unchanged")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
