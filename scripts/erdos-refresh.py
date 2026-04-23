#!/usr/bin/env python3
"""erdos-refresh.py -- Update ERDOS-TRACKER.md from the teorth/erdosproblems AI-contributions wiki.

Usage:
  scripts/erdos-refresh.py --dry-run       # show diff only
  scripts/erdos-refresh.py                  # apply changes in place
  scripts/erdos-refresh.py --snapshot F     # use a different JSON snapshot file
  scripts/erdos-refresh.py --tracker F      # operate on a different tracker file (for tests)

Idempotency: re-running after apply produces an empty diff (exit 0, no changes).
Offline fallback: if the wiki is unreachable, reads from scripts/data/erdos-ai-contributions.json.

Data-integrity rule: status fields are overwritten ONLY if the current tracker value
does not already lead with the canonical status token. This preserves richer local
context like "solved (variant; Lean)" or "partial (Lean; collaborative)" when the
wiki snapshot's canonical status ("solved" / "partial" / ...) is already implied.

Exit codes:
  0  success (no changes, or diff printed, or changes applied)
  2  missing tracker or snapshot file
"""

from __future__ import annotations
import argparse
import difflib
import json
import pathlib
import re
import sys
import time
import urllib.request

DEFAULT_TRACKER = pathlib.Path(__file__).resolve().parent.parent / "ERDOS-TRACKER.md"
DEFAULT_SNAPSHOT = pathlib.Path(__file__).resolve().parent / "data" / "erdos-ai-contributions.json"
WIKI_URL = "https://raw.githubusercontent.com/wiki/teorth/erdosproblems/AI-contributions-to-Erd%C5%91s-problems.md"

ENTRY_HEADER_RE = re.compile(r"^### #(\d+)(?:[^\n]*)$", re.MULTILINE)
STATUS_LINE_RE = re.compile(r"^\*\*ai_attempt_status:\*\*")
SOURCE_LINE_RE = re.compile(r"^\*\*ai_attempt_source:\*\*")


def fetch_attempts(snapshot_path: pathlib.Path, use_network: bool) -> list[dict]:
    """Return the list of wiki attempts (dicts). Falls back to snapshot on network failure."""
    if use_network:
        try:
            with urllib.request.urlopen(WIKI_URL, timeout=10) as r:
                body = r.read().decode("utf-8", errors="replace")
            return parse_wiki_markdown(body)
        except Exception as e:
            print(f"# wiki fetch failed ({e}); falling back to snapshot", file=sys.stderr)
    data = json.loads(snapshot_path.read_text())
    return data.get("attempts", [])


def parse_wiki_markdown(body: str) -> list[dict]:
    """Best-effort parse of the wiki markdown. Returns list of {problem, status, source}.
    The wiki format is free-form markdown; we heuristically extract `#NNNN` mentions + adjacent status tokens.
    Test suite does NOT hit the network -- this is a production-only path.
    """
    attempts = []
    for m in re.finditer(r"#(\d+)\s*[-:]\s*([^\n\.]+)", body):
        pnum = int(m.group(1))
        text = m.group(2).strip().lower()
        status = "partial"
        if "solved" in text or "fully solved" in text:
            status = "solved"
        elif "conditional" in text:
            status = "conditional"
        attempts.append({"problem": pnum, "status": status, "source": f"teorth/erdosproblems wiki #{pnum}"})
    return attempts


def load_tracker(path: pathlib.Path) -> str:
    return path.read_text()


def _current_status_token(line: str) -> str:
    """Return the first word after the **ai_attempt_status:** prefix, lowercased."""
    m = re.match(r"^\*\*ai_attempt_status:\*\*\s*(\S+)", line)
    if not m:
        return ""
    # Strip common punctuation so "solved," and "solved" compare equal.
    return m.group(1).strip().lower().rstrip(",.;:")


def compute_refreshed_tracker(tracker: str, attempts: list[dict]) -> tuple[str, list[str]]:
    """Return (new_tracker_text, list_of_change_summaries).

    Status updates are applied ONLY when the current tracker value does not already
    lead with the new status token -- preserves richer contextual annotations.
    Source updates are applied ONLY when the current tracker value starts with "none".
    """
    by_problem = {int(a["problem"]): a for a in attempts}
    lines = tracker.splitlines(keepends=True)
    out: list[str] = []
    changes: list[str] = []
    current_problem: int | None = None
    for line in lines:
        hmatch = ENTRY_HEADER_RE.match(line.rstrip("\n"))
        if hmatch:
            current_problem = int(hmatch.group(1))
        if current_problem is not None and current_problem in by_problem:
            a = by_problem[current_problem]
            if STATUS_LINE_RE.match(line):
                wanted = str(a["status"]).strip().lower()
                existing_token = _current_status_token(line)
                # Only rewrite when the leading token actually disagrees; preserves
                # richer annotations like "solved (variant; Lean)" when token matches.
                if existing_token != wanted:
                    new = f"**ai_attempt_status:** {a['status']}\n"
                    if new != line:
                        changes.append(f"#{current_problem} status: {line.strip()!r} -> {new.strip()!r}")
                        line = new
            elif SOURCE_LINE_RE.match(line):
                src = a.get("source", "")
                # Only update if the wiki has a definite source AND the tracker currently says 'none'.
                if "none" in line.lower() and src and src != "none":
                    new = f"**ai_attempt_source:** {src}\n"
                    if new != line:
                        changes.append(f"#{current_problem} source: {line.strip()!r} -> {new.strip()!r}")
                        line = new
        out.append(line)
    return "".join(out), changes


def main(argv: list[str]) -> int:
    ap = argparse.ArgumentParser(description="Refresh ERDOS-TRACKER.md from the teorth/erdosproblems wiki.")
    ap.add_argument("--dry-run", action="store_true", help="print diff without modifying the tracker")
    ap.add_argument("--tracker", default=str(DEFAULT_TRACKER))
    ap.add_argument("--snapshot", default=str(DEFAULT_SNAPSHOT))
    ap.add_argument("--online", action="store_true", help="attempt wiki fetch; default is offline (uses snapshot)")
    args = ap.parse_args(argv)

    tracker_path = pathlib.Path(args.tracker)
    snapshot_path = pathlib.Path(args.snapshot)
    if not tracker_path.is_file():
        print(f"ERROR: tracker file missing: {tracker_path}", file=sys.stderr)
        return 2
    if not snapshot_path.is_file():
        print(f"ERROR: snapshot file missing: {snapshot_path}", file=sys.stderr)
        return 2

    start = time.time()
    attempts = fetch_attempts(snapshot_path, use_network=args.online)
    tracker = load_tracker(tracker_path)
    new_tracker, changes = compute_refreshed_tracker(tracker, attempts)

    if tracker == new_tracker:
        print(f"# no changes -- tracker already in sync ({len(attempts)} attempts scanned, {time.time()-start:.2f}s)")
        return 0

    if args.dry_run:
        diff = difflib.unified_diff(
            tracker.splitlines(keepends=True),
            new_tracker.splitlines(keepends=True),
            fromfile=str(tracker_path),
            tofile=str(tracker_path) + " (proposed)",
        )
        sys.stdout.writelines(diff)
        print(f"# {len(changes)} changes proposed; {time.time()-start:.2f}s", file=sys.stderr)
        return 0

    tracker_path.write_text(new_tracker)
    print(f"# {len(changes)} changes applied to {tracker_path}; {time.time()-start:.2f}s")
    for c in changes:
        print(f"  - {c}")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
