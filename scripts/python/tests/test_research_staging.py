"""Unit tests for research_staging.py.

Covers:
  - slug generation per source lane
  - verbose markdown rendering (all fields surfaced)
  - metadata schema shape + extra passthrough fields
  - update-in-place preserves submitted_at + status on re-stage
  - directory bootstrap is idempotent
  - stdlib-only import (no sentence_transformers)

Run as a plain script:
  python3 scripts/python/tests/test_research_staging.py
"""

import json
import os
import sys
import tempfile

HERE = os.path.dirname(os.path.abspath(__file__))
PARENT = os.path.dirname(HERE)
sys.path.insert(0, PARENT)

import research_staging as rs  # noqa: E402


# ─────────────────────────── slug generation ────────────────────────────

def test_slug_arxiv_strips_prefix():
    slug = rs._discovery_slug({"source": "arxiv", "id": "arXiv:2604.08699"})
    assert slug == "arxiv-2604-08699", slug


def test_slug_arxiv_rss_same_namespace():
    slug = rs._discovery_slug({"source": "arxiv-rss", "id": "arXiv:2604.12345"})
    assert slug == "arxiv-2604-12345", slug


def test_slug_scholar_shares_arxiv_prefix():
    slug = rs._discovery_slug({"source": "scholar", "id": "arXiv:2604.00001"})
    assert slug == "arxiv-2604-00001", slug


def test_slug_youtube():
    slug = rs._discovery_slug({"source": "youtube", "id": "rK_LHkKkSdY"})
    assert slug == "yt-rk-lhkkksdy", slug


def test_slug_hn_hashes_url():
    slug = rs._discovery_slug({"source": "hn", "id": "https://example.com/article"})
    assert slug.startswith("hn-"), slug
    assert len(slug) == len("hn-") + 12


def test_slug_unknown_source_falls_through():
    slug = rs._discovery_slug({"source": "weird", "id": "some/unsafe id"})
    assert slug.startswith("weird-"), slug
    assert len(slug) == len("weird-") + 12


def test_slug_stable_across_calls():
    d = {"source": "arxiv", "id": "arXiv:2604.08699"}
    assert rs._discovery_slug(d) == rs._discovery_slug(d)


# ────────────────────── markdown rendering ──────────────────────────────

def test_markdown_includes_title_and_summary():
    md = rs._discovery_to_markdown({
        "source": "arxiv-rss",
        "id": "arXiv:2604.00001",
        "title": "A paper about lunar radiation",
        "domain": "astro-ph / Astrophysics (all)",
        "duration": "paper",
        "summary": "matched keyword 'lunar'",
    })
    assert "# A paper about lunar radiation" in md
    assert "matched keyword 'lunar'" in md
    assert "**Source lane:** arxiv-rss" in md
    assert "**Domain:** astro-ph / Astrophysics (all)" in md


def test_markdown_includes_abstract_when_present():
    md = rs._discovery_to_markdown({
        "source": "arxiv",
        "id": "arXiv:2604.00001",
        "title": "Foo",
        "summary": "bar",
        "_abstract": "This paper investigates the dynamics of foo under bar.",
    })
    assert "## Abstract" in md
    assert "dynamics of foo" in md


def test_markdown_omits_abstract_section_when_missing():
    md = rs._discovery_to_markdown({
        "source": "hn",
        "id": "https://example.com/x",
        "title": "An HN post",
        "summary": "250 points",
    })
    assert "## Abstract" not in md


def test_markdown_includes_cosine_when_present():
    md = rs._discovery_to_markdown({
        "source": "arxiv",
        "id": "arXiv:2604.00001",
        "title": "Foo",
        "summary": "bar",
        "_cosine": 0.4267,
    })
    assert "Rerank cosine" in md
    assert "0.427" in md


def test_markdown_youtube_priority_field_surfaced():
    md = rs._discovery_to_markdown({
        "source": "youtube",
        "id": "rK_LHkKkSdY",
        "title": "Some NASA video — NASA",
        "summary": "New upload",
        "priority": "CRITICAL",
    })
    assert "**Priority:** CRITICAL" in md


# ─────────────────────── staging directory bootstrap ────────────────────

def test_ensure_creates_all_subdirs():
    with tempfile.TemporaryDirectory() as base:
        rs.ensure_research_staging(base)
        for sub in ("inbox", "checking", "attention", "ready", "aside"):
            assert os.path.isdir(os.path.join(base, rs.RESEARCH_INTAKE_ROOT, sub))


def test_ensure_is_idempotent():
    with tempfile.TemporaryDirectory() as base:
        rs.ensure_research_staging(base)
        rs.ensure_research_staging(base)  # should not raise
        assert os.path.isdir(os.path.join(base, rs.RESEARCH_INBOX))


# ───────────────────────── stage_discovery E2E ──────────────────────────

def _fake_arxiv_rss():
    return {
        "title": "Lunar cycles influence coronal observations",
        "duration": "paper",
        "id": "arXiv:2604.08699",
        "domain": "astro-ph / Astrophysics (all)",
        "summary": "arXiv RSS new submission, category astro-ph (keyword: lunar)",
        "source": "arxiv-rss",
    }


def test_stage_discovery_writes_both_files():
    with tempfile.TemporaryDirectory() as base:
        doc, meta = rs.stage_discovery(base, _fake_arxiv_rss(), "arxiv-rss")
        assert os.path.exists(doc)
        assert os.path.exists(meta)
        assert doc.endswith("arxiv-2604-08699.md")
        assert meta.endswith("arxiv-2604-08699.md.meta.json")


def test_stage_discovery_metadata_schema_shape():
    with tempfile.TemporaryDirectory() as base:
        _, meta_path = rs.stage_discovery(base, _fake_arxiv_rss(), "arxiv-rss")
        with open(meta_path) as f:
            meta = json.load(f)
        # Required staging fields
        assert "submitted_at" in meta and meta["submitted_at"]
        assert meta["source"] == "arxiv-rss"
        assert meta["status"] == "inbox"
        # Pass-through trace fields
        assert meta["discovery_id"] == "arXiv:2604.08699"
        assert meta["discovery_source"] == "arxiv-rss"
        assert "last_updated_at" in meta


def test_stage_discovery_preserves_submitted_at_on_restage():
    with tempfile.TemporaryDirectory() as base:
        d = _fake_arxiv_rss()
        _, meta_path = rs.stage_discovery(base, d, "arxiv-rss")
        with open(meta_path) as f:
            first = json.load(f)
        # Second call with updated payload
        d2 = dict(d)
        d2["summary"] = "arXiv RSS (updated summary)"
        _, meta_path2 = rs.stage_discovery(base, d2, "arxiv-rss")
        assert meta_path == meta_path2
        with open(meta_path2) as f:
            second = json.load(f)
        assert second["submitted_at"] == first["submitted_at"], \
            "submitted_at must be preserved across re-stage"


def test_stage_discovery_preserves_status_on_restage():
    with tempfile.TemporaryDirectory() as base:
        d = _fake_arxiv_rss()
        _, meta_path = rs.stage_discovery(base, d, "arxiv-rss")
        # Simulate lifecycle state advance by sc-learn
        with open(meta_path) as f:
            meta = json.load(f)
        meta["status"] = "checking"
        with open(meta_path, "w") as f:
            json.dump(meta, f)
        # Re-stage should NOT reset status back to 'inbox'
        rs.stage_discovery(base, d, "arxiv-rss")
        with open(meta_path) as f:
            meta2 = json.load(f)
        assert meta2["status"] == "checking"


def test_stage_discovery_refreshes_content_on_restage():
    with tempfile.TemporaryDirectory() as base:
        d = _fake_arxiv_rss()
        doc_path, _ = rs.stage_discovery(base, d, "arxiv-rss")
        d2 = dict(d)
        d2["title"] = "A completely different title"
        d2["_abstract"] = "A brand new abstract added on re-stage."
        rs.stage_discovery(base, d2, "arxiv-rss")
        with open(doc_path) as f:
            body = f.read()
        assert "A completely different title" in body
        assert "brand new abstract" in body


def test_stage_discovery_ignores_corrupt_meta():
    with tempfile.TemporaryDirectory() as base:
        d = _fake_arxiv_rss()
        rs.ensure_research_staging(base)
        slug = rs._discovery_slug(d)
        meta_path = os.path.join(base, rs.RESEARCH_INBOX, f"{slug}.md.meta.json")
        with open(meta_path, "w") as f:
            f.write("{ not valid json")
        # Should not raise; falls back to fresh defaults
        _, meta_path2 = rs.stage_discovery(base, d, "arxiv-rss")
        with open(meta_path2) as f:
            meta = json.load(f)
        assert meta["status"] == "inbox"


def test_stage_discovery_hn_url_id():
    """HN ids are URL prefixes, not stable identifiers. Slug must hash them."""
    with tempfile.TemporaryDirectory() as base:
        d = {
            "title": "Show HN: Some project",
            "duration": "article",
            "id": "https://example.com/a-post-url",
            "domain": "HN (150pts) / claude",
            "summary": "HN 150 points, matched: claude",
            "source": "hn",
        }
        doc, meta = rs.stage_discovery(base, d, "hn")
        assert os.path.basename(doc).startswith("hn-")
        with open(meta) as f:
            m = json.load(f)
        assert m["source"] == "hn"


# ────────────────────────── runner ──────────────────────────────────────

def _run_all():
    tests = [(n, f) for n, f in globals().items() if n.startswith("test_") and callable(f)]
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


if __name__ == "__main__":
    sys.exit(_run_all())
