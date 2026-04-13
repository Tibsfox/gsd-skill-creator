#!/usr/bin/env python3
"""One-shot backfill: apply v2 discovery filters to historical DISCOVERED
rows in .planning/RESEARCH-QUEUE.md.

Targets arXiv primary-lane rows (status contains `matched query "..."`),
refetches canonical title+abstract from the arXiv id_list API in batches,
then runs the same v2 filters as discovery_engine.py:
  1. _relevance_check_all_tokens — every query token must appear in
     title+abstract+category text
  2. _rerank_cosine (all-MiniLM-L6-v2) — cosine(query, title+abstract) >= 0.35

Rows failing either gate are flipped from DISCOVERED to OFF-TOPIC-V2 with
the original status preserved inline for reversibility. Rows passing both
gates keep their existing DISCOVERED status.

Usage:
  python3 discovery_backfill.py                 # dry-run, no writes
  python3 discovery_backfill.py --apply         # rewrite the queue
  python3 discovery_backfill.py --no-rerank     # token filter only, no ML
"""

import os
import sys

# Bootstrap: re-exec under project .venv if sentence_transformers is missing.
# The rerank path requires it; system python3 on this host doesn't have it.
_PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
_VENV_PY = os.path.join(_PROJECT_ROOT, '.venv', 'bin', 'python')
if os.path.realpath(sys.executable) != os.path.realpath(_VENV_PY) and os.path.exists(_VENV_PY):
    try:
        import sentence_transformers  # noqa: F401
    except ImportError:
        os.execv(_VENV_PY, [_VENV_PY, os.path.abspath(__file__)] + sys.argv[1:])

import re
import time
import argparse
from urllib.request import urlopen, Request

BASE_DIR = os.path.dirname(os.path.abspath(os.path.join(__file__, '..', '..')))
QUEUE_FILE = os.path.join(BASE_DIR, '.planning', 'RESEARCH-QUEUE.md')

# Reuse the v2 filters directly from discovery_engine
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import discovery_engine as de  # noqa: E402


ROW_RE = re.compile(
    r'^\| (\d+) \| (.*?) \| (.*?) \| (arXiv:[\w.]+v?\d*) \| (.*?) \| (DISCOVERED — .*?matched query "(.*?)".*?) \|\s*$'
)

# Citation-tracking rows look like:
#   | 118 | Title... | paper | arXiv:2604.03228v1 | Citation tracking / Holt-Lunstad 2024
#   | DISCOVERED — Related to Holt-Lunstad 2024, arXiv 2026-04-03 |
CITATION_ROW_RE = re.compile(
    r'^\| (\d+) \| (.*?) \| (.*?) \| (arXiv:[\w.]+v?\d*) \| (.*?) \| '
    r'(DISCOVERED — Related to (.+?), arXiv [\d-]+) \|\s*$'
)


def parse_arxiv_rows(queue_text):
    """Return list of (lineno, num, title_col, vtt, arxiv_id, category, status, query)."""
    out = []
    for i, line in enumerate(queue_text.splitlines()):
        m = ROW_RE.match(line)
        if not m:
            continue
        num, title_col, vtt, arxiv_raw, category, status, query = m.groups()
        arxiv_id = arxiv_raw.replace('arXiv:', '')
        out.append({
            'lineno': i,
            'num': int(num),
            'title_col': title_col.strip(),
            'vtt': vtt.strip(),
            'arxiv_id': arxiv_id,
            'category': category.strip(),
            'status': status.strip(),
            'query': query.strip(),
        })
    return out


def parse_citation_rows(queue_text):
    """Parse 'DISCOVERED — Related to X' citation-tracking rows.

    Maps the source-paper tag (e.g., "Holt-Lunstad 2024") to its topic query
    from discovery_engine.SCHOLAR_TRACKED so the same rerank path can run.
    """
    # SCHOLAR_TRACKED is (label, query, arxiv_tokens); we only need the query
    # here because rerank runs against the full descriptive prompt.
    scholar_map = {entry[0]: entry[1] for entry in de.SCHOLAR_TRACKED}
    out = []
    for i, line in enumerate(queue_text.splitlines()):
        m = CITATION_ROW_RE.match(line)
        if not m:
            continue
        num, title_col, vtt, arxiv_raw, category, status, paper_tag = m.groups()
        arxiv_id = arxiv_raw.replace('arXiv:', '')
        query = scholar_map.get(paper_tag.strip())
        if query is None:
            # Unknown source paper — skip rather than silently pass
            continue
        out.append({
            'lineno': i,
            'num': int(num),
            'title_col': title_col.strip(),
            'vtt': vtt.strip(),
            'arxiv_id': arxiv_id,
            'category': category.strip(),
            'status': status.strip(),
            'query': query,
            'paper_tag': paper_tag.strip(),
        })
    return out


def fetch_arxiv_batch(ids, timeout=30):
    """Fetch canonical title+abstract for a batch of arXiv ids via id_list API.
    Returns dict keyed by the bare id (no 'v1' suffix stripping — keys as-is)."""
    url = f"http://export.arxiv.org/api/query?id_list={','.join(ids)}&max_results={len(ids)}"
    req = Request(url, headers={'User-Agent': 'GSD-ResearchBackfill/1.0'})
    with urlopen(req, timeout=timeout) as resp:
        xml = resp.read().decode('utf-8')
    entries = {}
    for entry in re.findall(r'<entry>(.*?)</entry>', xml, re.DOTALL):
        id_m = re.search(r'<id>http://arxiv.org/abs/([^<]+)</id>', entry)
        t_m = re.search(r'<title>(.*?)</title>', entry, re.DOTALL)
        a_m = re.search(r'<summary>(.*?)</summary>', entry, re.DOTALL)
        if not (id_m and t_m):
            continue
        aid = id_m.group(1).strip()
        entries[aid] = {
            'title': re.sub(r'\s+', ' ', t_m.group(1).strip()),
            'abstract': re.sub(r'\s+', ' ', a_m.group(1).strip()) if a_m else '',
        }
    return entries


def classify(rows, use_rerank=True, cos_threshold=0.35, batch_size=100):
    """Return list of dicts with added {full_title, abstract, verdict, reason, cosine}."""
    model = de._lazy_reranker() if use_rerank else None
    if use_rerank and model is None:
        print("  WARN: reranker unavailable — falling back to token filter only")

    # Batch fetch abstracts
    by_id = {}
    for start in range(0, len(rows), batch_size):
        batch = rows[start:start + batch_size]
        ids = [r['arxiv_id'] for r in batch]
        print(f"  Fetching arXiv batch {start+1}-{start+len(batch)}/{len(rows)}...")
        try:
            entries = fetch_arxiv_batch(ids)
            by_id.update(entries)
        except Exception as e:
            print(f"  ERROR fetching batch: {e}")
        time.sleep(3)  # be polite to arXiv

    out = []
    for r in rows:
        entry = by_id.get(r['arxiv_id'])
        if entry is None:
            r.update(verdict='SKIP', reason='fetch failed', cosine=None,
                     full_title=r['title_col'], abstract='')
            out.append(r)
            continue
        title = entry['title']
        abstract = entry['abstract']
        # Queue stores compound label "cs.SE / code generation agents"; strip the
        # query suffix so the token check doesn't match the query against itself.
        category_raw = r['category']
        category = category_raw.split(' / ', 1)[0] if ' / ' in category_raw else category_raw
        query = r['query']

        # Gate 1: all tokens
        tok_ok = de._relevance_check_all_tokens(title, abstract, category, query)
        if not tok_ok:
            r.update(verdict='DROP', reason='tokens missing', cosine=None,
                     full_title=title, abstract=abstract)
            out.append(r)
            continue

        # Gate 2: cosine rerank
        if model is not None:
            cos = de._rerank_cosine(model, query, title + '. ' + abstract)
            if cos is None or cos < cos_threshold:
                r.update(verdict='DROP',
                         reason=f'cosine {cos:.3f} < {cos_threshold}' if cos is not None else 'rerank failed',
                         cosine=cos, full_title=title, abstract=abstract)
                out.append(r)
                continue
            r.update(verdict='KEEP', reason=f'cosine {cos:.3f}', cosine=cos,
                     full_title=title, abstract=abstract)
        else:
            r.update(verdict='KEEP', reason='tokens match (no rerank)', cosine=None,
                     full_title=title, abstract=abstract)
        out.append(r)
    return out


def apply_rewrite(queue_text, classified, citation_mode=False):
    """Flip DROP rows from DISCOVERED to OFF-TOPIC-V2 with original status inline."""
    lines = queue_text.splitlines(keepends=True)
    flipped = 0
    if citation_mode:
        status_re = re.compile(r'\| (DISCOVERED — Related to [^|]+?) \|\s*$')
    else:
        status_re = re.compile(r'\| (DISCOVERED — .*?matched query "[^"]+"[^|]*) \|\s*$')
    for c in classified:
        if c['verdict'] != 'DROP':
            continue
        i = c['lineno']
        line = lines[i]
        new_status = (
            f"OFF-TOPIC-V2 — backfill {c['reason']} "
            f"[was: {c['status']}]"
        )
        new_line = status_re.sub(f"| {new_status} |\n", line)
        if new_line != line:
            lines[i] = new_line
            flipped += 1
    return ''.join(lines), flipped


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--apply', action='store_true', help='rewrite queue (default dry-run)')
    ap.add_argument('--no-rerank', action='store_true', help='token filter only')
    ap.add_argument('--cos-threshold', type=float, default=0.35)
    ap.add_argument('--limit', type=int, default=0, help='only process first N rows')
    ap.add_argument('--mode', choices=['matched', 'citation'], default='matched',
                    help='row bucket: matched-query arxiv rows or citation-tracking rows')
    args = ap.parse_args()

    with open(QUEUE_FILE, 'r', encoding='utf-8') as f:
        queue_text = f.read()

    if args.mode == 'citation':
        rows = parse_citation_rows(queue_text)
        label = 'citation-tracking DISCOVERED'
    else:
        rows = parse_arxiv_rows(queue_text)
        label = 'arXiv matched-query DISCOVERED'
    if args.limit:
        rows = rows[:args.limit]
    print(f"Parsed {len(rows)} {label} rows")
    if not rows:
        return

    classified = classify(rows, use_rerank=not args.no_rerank,
                          cos_threshold=args.cos_threshold)

    keep = [c for c in classified if c['verdict'] == 'KEEP']
    drop = [c for c in classified if c['verdict'] == 'DROP']
    skip = [c for c in classified if c['verdict'] == 'SKIP']

    print(f"\n=== Classification ===")
    print(f"  KEEP: {len(keep)}")
    print(f"  DROP: {len(drop)}")
    print(f"  SKIP: {len(skip)} (fetch failures)")

    # Preview all KEEP and first 15 DROP
    print(f"\n--- KEEP preview ---")
    for c in keep:
        tag = f" [{c.get('paper_tag','')}]" if c.get('paper_tag') else ''
        print(f"  #{c['num']}{tag} q='{c['query']}' cos={c['cosine']}")
        print(f"    {c['full_title'][:100]}")
    print(f"\n--- DROP preview ---")
    for c in drop[:15]:
        tag = f" [{c.get('paper_tag','')}]" if c.get('paper_tag') else ''
        print(f"  #{c['num']}{tag} ({c['reason']})")
        print(f"    {c['full_title'][:100]}")

    if args.apply:
        new_text, flipped = apply_rewrite(queue_text, classified,
                                          citation_mode=(args.mode == 'citation'))
        if flipped:
            with open(QUEUE_FILE, 'w', encoding='utf-8') as f:
                f.write(new_text)
            print(f"\nWrote {flipped} row flips to {QUEUE_FILE}")
        else:
            print("\nNo rows flipped.")
    else:
        print("\n(dry-run — pass --apply to write)")


if __name__ == '__main__':
    main()
