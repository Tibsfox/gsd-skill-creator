#!/usr/bin/env python3
"""Strip substrate-repetition-collapse patterns from contaminated mission-page files.

Two-pass transform:
  Pass 1 — collapse adjacent "substrate substrate ..." runs to a single occurrence.
  Pass 2 — per-paragraph cap: keep at most 5 "substrate" tokens per paragraph;
           strip excess from the right side of the paragraph (later occurrences
           are usually the filler-collapse instances).

Pass 3 — normalize whitespace artifacts left behind (double spaces, ` .`, ` ,`,
         ` :`, ` ;`).

Invoked as:
  python3 tools/strip-substrate-collapse.py <file>...

Prints a per-file before/after collapse-count line.
"""

from __future__ import annotations

import re
import sys
from pathlib import Path

# Pass 1: runs of "substrate" separated only by whitespace -> single "substrate"
ADJACENT_RUN = re.compile(r"\bsubstrate(?:\s+substrate)+\b", re.IGNORECASE)

# Per-paragraph "substrate" counter to cap density at MAX_PER_PARA.
MAX_PER_PARA = 5
SUBSTRATE_TOKEN = re.compile(r"\bsubstrate\b", re.IGNORECASE)


def cap_per_paragraph(text: str) -> str:
    """For each blank-line-separated paragraph, keep at most MAX_PER_PARA
    'substrate' tokens. Strip excess occurrences from the right (collapse
    tail is the usual filler-pattern location)."""
    paragraphs = re.split(r"(\n\s*\n)", text)  # capture separators to preserve them
    out = []
    for chunk in paragraphs:
        if chunk.strip() == "" or "\n\n" in chunk or chunk.startswith("\n"):
            out.append(chunk)
            continue
        matches = list(SUBSTRATE_TOKEN.finditer(chunk))
        if len(matches) <= MAX_PER_PARA:
            out.append(chunk)
            continue
        # Build the kept set: first MAX_PER_PARA occurrences are retained
        keep_indices = {i for i in range(MAX_PER_PARA)}
        # Walk in reverse so character indices remain valid
        modified = chunk
        for i in range(len(matches) - 1, -1, -1):
            if i in keep_indices:
                continue
            m = matches[i]
            start, end = m.start(), m.end()
            # Also consume the preceding whitespace and a trailing comma/space pair
            # if it leaves an orphan ", "
            left = start
            while left > 0 and modified[left - 1] == " ":
                left -= 1
            right = end
            # If between two spaces, leave one space to avoid word collisions
            modified = modified[:left] + " " + modified[right:]
        out.append(modified)
    return "".join(out)


def clean_whitespace(text: str) -> str:
    """Normalize whitespace artifacts left by stripping."""
    # Multiple spaces -> single space (but not at line starts)
    text = re.sub(r"(?<=\S)  +", " ", text)
    # Stray " ." " ," " :" " ;" -> tight punctuation
    text = re.sub(r" +([\.,;:])", r"\1", text)
    # " )" -> ")"
    text = re.sub(r" +\)", ")", text)
    # "( " -> "("
    text = re.sub(r"\( +", "(", text)
    # Collapse internal double spaces in mid-sentence (preserve indentation at line starts)
    return text


def transform(text: str) -> str:
    text = ADJACENT_RUN.sub("substrate", text)
    text = cap_per_paragraph(text)
    text = clean_whitespace(text)
    return text


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
