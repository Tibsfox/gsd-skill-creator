"""Unit tests for discovery_engine v2 (DISCOVERY_V2=1) behaviors.

Covers Phases 1-6 of the arXiv discovery fix plan:
  P1: phrase-quoted primary query
  P2: all-tokens relevance filter
  P3: two-lane status tagging (via append_to_queue dry-run)
  P4: embedding cosine gate (soft test — reranker may be absent)
  P5: coherence cluster rejection
  P6: URL snapshot at fetch time

Run: DISCOVERY_V2=1 python3 -m pytest scripts/python/tests/test_discovery_v2.py
Or as a plain script: python3 scripts/python/tests/test_discovery_v2.py
"""

import os
import sys
import tempfile
import importlib

# Ensure the v2 flag is on before we import the module
os.environ['DISCOVERY_V2'] = '1'

HERE = os.path.dirname(os.path.abspath(__file__))
PARENT = os.path.dirname(HERE)
sys.path.insert(0, PARENT)

import discovery_engine as de  # noqa: E402


def test_phase1_phrase_query_multiword():
    # Multi-word query gets wrapped in literal quotes
    assert de._phrase_query("code generation agents") == '"code generation agents"'


def test_phase1_phrase_query_singleword():
    # Single-word queries pass through unchanged
    assert de._phrase_query("agent") == "agent"


def test_phase1_phrase_query_preserves_in_url_encoding():
    from urllib.parse import quote_plus
    phrased = de._phrase_query("code generation")
    encoded = quote_plus(phrased)
    assert "%22" in encoded  # quote character survived encoding


def test_phase2_all_tokens_required_pass():
    # All tokens present -> returns query
    result = de._relevance_check_all_tokens(
        "A code generation system for agents",
        "We present a new framework.",
        "cs.SE",
        "code generation agents",
    )
    assert result == "code generation agents"


def test_phase2_all_tokens_required_fail():
    # Only 'code' present, 'generation' and 'agents' missing -> None
    result = de._relevance_check_all_tokens(
        "Error-correcting codes in chest CT reconstruction",
        "We study code-word distances in a weakly compact space.",
        "cs.CV",
        "code generation agents",
    )
    assert result is None


def test_phase2_all_tokens_case_insensitive():
    result = de._relevance_check_all_tokens(
        "CODE Generation by AGENTS",
        "",
        "cs.SE",
        "code generation agents",
    )
    assert result == "code generation agents"


def test_phase2_empty_query_returns_none():
    assert de._relevance_check_all_tokens("t", "a", "c", "") is None
    assert de._relevance_check_all_tokens("t", "a", "c", "   ") is None


def test_phase5_coherence_drops_shared_noun_cluster():
    # 6 papers under same query all sharing an unrelated noun should be dropped
    items = [
        {
            '_query': 'vertical farming energy',
            'title': f'Heisenberg subgroup paper number {i}',
            '_abstract': 'vertical subgroup of the Heisenberg group, expansiveness analysis',
            'status_tag': 'DISCOVERED-SUPPLEMENTAL',
        }
        for i in range(6)
    ]
    kept = de._coherence_filter(items, window=6, share=0.5)
    assert len(kept) == 0, f"expected all dropped, kept {len(kept)}"


def test_phase5_coherence_keeps_diverse_cluster():
    # 6 papers with no shared non-query noun should all be kept
    items = []
    distinct_topics = [
        ('lettuce yields indoor hydroponic tower', 'experimental study on controlled environment'),
        ('LED spectrum optimization for farm plants', 'blue red ratio phenotype measurements'),
        ('energy consumption warehouse production', 'kilowatt hour cost modeling'),
        ('nutrient solution phosphate monitoring', 'ion concentration feedback loop'),
        ('greenhouse CO2 enrichment leaf', 'carbon assimilation stomata measurement'),
        ('seedling density transplant schedule', 'optimal spacing trial results'),
    ]
    for t, a in distinct_topics:
        items.append({
            '_query': 'vertical farming energy',
            'title': t,
            '_abstract': a,
            'status_tag': 'DISCOVERED-SUPPLEMENTAL',
        })
    kept = de._coherence_filter(items, window=6, share=0.5)
    assert len(kept) == 6, f"expected all kept, got {len(kept)}"


def test_phase5_coherence_below_window_always_keeps():
    items = [
        {'_query': 'q', 'title': 'same word ' * 3, '_abstract': 'heisenberg heisenberg'}
        for _ in range(5)
    ]
    kept = de._coherence_filter(items, window=6, share=0.5)
    assert len(kept) == 5


def test_phase6_snapshot_writes_file_with_fallback():
    # Use an unreachable URL to force fallback path; still writes a file
    with tempfile.TemporaryDirectory() as td:
        orig = de.SNAPSHOT_DIR
        de.SNAPSHOT_DIR = os.path.join(td, 'snaps')
        try:
            rel = de._snapshot_url(
                'http://127.0.0.1:1/does-not-exist',
                abstract_text='fallback abstract body',
                title='Fallback Title',
            )
            assert rel is not None
            # The file exists under our temp snapshot dir
            files = os.listdir(de.SNAPSHOT_DIR)
            assert len(files) == 1
            assert files[0].endswith('.html.gz')
        finally:
            de.SNAPSHOT_DIR = orig


def test_phase6_snapshot_idempotent():
    with tempfile.TemporaryDirectory() as td:
        orig = de.SNAPSHOT_DIR
        de.SNAPSHOT_DIR = os.path.join(td, 'snaps')
        try:
            r1 = de._snapshot_url('http://127.0.0.1:1/x', 'a', 't')
            r2 = de._snapshot_url('http://127.0.0.1:1/x', 'a', 't')
            assert r1 == r2
            assert len(os.listdir(de.SNAPSHOT_DIR)) == 1
        finally:
            de.SNAPSHOT_DIR = orig


def test_phase4_rerank_cosine_none_when_model_missing():
    # Passing None model returns None (ungated supplemental)
    assert de._rerank_cosine(None, "query", "text") is None


def test_phase3_supplemental_tag_in_queue_row():
    # append_to_queue in dry-run should format supplemental rows with the
    # DISCOVERED-SUPPLEMENTAL tag in the status cell.
    item = {
        'title': 'Test Paper',
        'duration': 'paper',
        'id': 'arXiv:2601.00001',
        'domain': 'cs.SE / test',
        'summary': 'arXiv 2026-04-13, supplemental match "test"',
        'status_tag': 'DISCOVERED-SUPPLEMENTAL',
    }
    # Point QUEUE_FILE at a temp file
    with tempfile.NamedTemporaryFile(mode='w', suffix='.md', delete=False) as f:
        f.write("| 45 | seed | paper | s | d | placeholder |\n\n## Channel Sources Summary\n")
        tmpname = f.name
    try:
        orig = de.QUEUE_FILE
        de.QUEUE_FILE = tmpname
        # dry_run=True prints but doesn't write — capture via monkeypatched print
        printed = []
        import builtins
        real_print = builtins.print
        builtins.print = lambda *a, **k: printed.append(' '.join(str(x) for x in a))
        try:
            de.append_to_queue([item], dry_run=True)
        finally:
            builtins.print = real_print
        joined = '\n'.join(printed)
        assert 'DISCOVERED-SUPPLEMENTAL' in joined
    finally:
        de.QUEUE_FILE = orig
        os.unlink(tmpname)


def test_phase1_check_arxiv_url_has_quoted_phrase(monkeypatch=None):
    # Verify the URL built inside check_arxiv for a multi-word query contains
    # %22 (quoted phrase) when DISCOVERY_V2 is on. We stub the network layer.
    captured = {}

    def fake_fetch(url, timeout=15):
        captured.setdefault('urls', []).append(url)
        return []

    orig_fetch = de._fetch_arxiv_entries
    orig_urlopen = de.urlopen
    de._fetch_arxiv_entries = fake_fetch

    class FakeResp:
        def __init__(self, body):
            self._b = body

        def read(self):
            return self._b

        def __enter__(self):
            return self

        def __exit__(self, *a):
            return False

    def fake_urlopen(req, timeout=15):
        captured.setdefault('urls', []).append(req.full_url)
        return FakeResp(b'<feed></feed>')

    de.urlopen = fake_urlopen
    try:
        state = {'seen_arxiv_ids': []}
        de.check_arxiv(state, dry_run=True)
    finally:
        de._fetch_arxiv_entries = orig_fetch
        de.urlopen = orig_urlopen

    assert captured.get('urls'), "expected at least one URL to be constructed"
    # At least one URL should contain the %22 literal for phrase quotes
    assert any('%22' in u for u in captured['urls']), \
        f"no %22 in any constructed URL: {captured['urls'][:2]}"


# ──────────────────────────────────────────────────────────────────────────
# Poor man's test runner (pytest optional)
# ──────────────────────────────────────────────────────────────────────────

def _run_all():
    tests = [(n, f) for n, f in globals().items() if n.startswith('test_') and callable(f)]
    failed = 0
    for name, fn in tests:
        try:
            fn()
            print(f"  PASS {name}")
        except AssertionError as e:
            failed += 1
            print(f"  FAIL {name}: {e}")
        except Exception as e:
            failed += 1
            print(f"  ERROR {name}: {type(e).__name__}: {e}")
    print(f"\n{len(tests) - failed}/{len(tests)} tests passed")
    return failed


if __name__ == '__main__':
    sys.exit(_run_all())
