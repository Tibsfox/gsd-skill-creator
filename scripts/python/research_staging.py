"""Research intake staging for discovery_engine output.

Writes one file per discovery into `.planning/research-intake/inbox/` as
`{slug}.md` plus `{slug}.md.meta.json`, matching the StagingMetadata shape
in `src/staging/schema.ts` so processed items can later flow into the main
`.planning/staging/` pipeline with a path switch.

This module is deliberately dependency-free (stdlib only) so it is importable
from any Python the discovery engine already uses, with or without the
sentence_transformers venv.

Design decisions (locked 2026-04-13 handoff):
  - Top-level `.planning/research-intake/` (NOT under `.planning/staging/`);
    research items graduate INTO staging as a downstream step.
  - One file per discovery, not one batch file per run.
  - Verbose markdown body — include every field the discovery dict carries
    so downstream processors don't have to guess.
  - Update-in-place on re-stage: preserve `submitted_at` and `status` from
    any existing `.meta.json`, refresh all other fields. This lets later
    discovery runs add/update details without clobbering lifecycle state.
"""

from __future__ import annotations

import hashlib
import json
import os
import re
from datetime import datetime, timezone
from typing import Tuple


RESEARCH_INTAKE_ROOT = ".planning/research-intake"
RESEARCH_INBOX = f"{RESEARCH_INTAKE_ROOT}/inbox"

_SUBDIRS = ("inbox", "checking", "attention", "ready", "aside")

_VALID_STATES = {"inbox", "checking", "attention", "ready", "aside"}


def ensure_research_staging(base_path: str) -> None:
    """Create `.planning/research-intake/{inbox,checking,attention,ready,aside}/`
    under `base_path`. Idempotent."""
    for sub in _SUBDIRS:
        os.makedirs(os.path.join(base_path, RESEARCH_INTAKE_ROOT, sub), exist_ok=True)


def _slugify_token(value: str) -> str:
    """Lowercase, replace runs of non-alphanumeric with '-', strip edges."""
    value = value.lower()
    value = re.sub(r"[^a-z0-9]+", "-", value)
    return value.strip("-")


def _discovery_slug(discovery: dict) -> str:
    """Stable filesystem-safe slug derived from (source, id).

    arxiv/arxiv-rss/scholar ids look like `arXiv:2604.08699` -> `arxiv-2604-08699`.
    youtube ids are short tokens -> `yt-<id>`.
    HN ids are a URL prefix (not stable enough to render directly) -> hash.
    Unknown lanes fall through to `{source}-<sha1[:12]>`.
    """
    source = (discovery.get("source") or "unknown").strip().lower()
    raw_id = str(discovery.get("id") or "")
    if source in ("arxiv", "arxiv-rss", "scholar"):
        token = raw_id
        if token.lower().startswith("arxiv:"):
            token = token.split(":", 1)[1]
        slug_id = _slugify_token(token) or hashlib.sha1(raw_id.encode("utf-8")).hexdigest()[:12]
        return f"arxiv-{slug_id}"
    if source == "youtube":
        slug_id = _slugify_token(raw_id) or hashlib.sha1(raw_id.encode("utf-8")).hexdigest()[:12]
        return f"yt-{slug_id}"
    if source == "hn":
        return f"hn-{hashlib.sha1(raw_id.encode('utf-8')).hexdigest()[:12]}"
    return f"{_slugify_token(source) or 'unknown'}-{hashlib.sha1(raw_id.encode('utf-8')).hexdigest()[:12]}"


def _discovery_to_markdown(discovery: dict) -> str:
    """Render a discovery dict as a verbose markdown document.

    Includes every field the dict carries — downstream processors get
    everything the engine knew at capture time.
    """
    title = (discovery.get("title") or "(untitled discovery)").strip()
    source = discovery.get("source") or "unknown"
    did = discovery.get("id") or ""
    domain = discovery.get("domain") or ""
    duration = discovery.get("duration") or ""
    summary = (discovery.get("summary") or "").strip()
    priority = discovery.get("priority")
    status_tag = discovery.get("status_tag")
    query = discovery.get("_query")
    category = discovery.get("_category")
    url = discovery.get("_url")
    cosine = discovery.get("_cosine")
    abstract = (discovery.get("_abstract") or "").strip()

    lines = []
    lines.append(f"# {title}")
    lines.append("")
    lines.append("## Metadata")
    lines.append("")
    lines.append(f"- **Source lane:** {source}")
    lines.append(f"- **Discovery id:** {did}")
    if domain:
        lines.append(f"- **Domain:** {domain}")
    if duration:
        lines.append(f"- **Type:** {duration}")
    if priority:
        lines.append(f"- **Priority:** {priority}")
    if status_tag:
        lines.append(f"- **Status tag:** {status_tag}")
    if query:
        lines.append(f"- **Matched query:** {query}")
    if category:
        lines.append(f"- **arXiv category:** {category}")
    if url:
        lines.append(f"- **URL:** {url}")
    if cosine is not None:
        try:
            lines.append(f"- **Rerank cosine:** {float(cosine):.3f}")
        except (TypeError, ValueError):
            pass

    lines.append("")
    lines.append("## Summary")
    lines.append("")
    lines.append(summary or "_(no summary captured)_")

    if abstract:
        lines.append("")
        lines.append("## Abstract")
        lines.append("")
        lines.append(abstract)

    lines.append("")
    return "\n".join(lines)


def _build_metadata(discovery: dict, *, source: str, submitted_at: str,
                    status: str, now_iso: str) -> dict:
    """Build metadata dict. `submitted_at` and `status` are preserved on update;
    everything else is refreshed to the current discovery payload."""
    if status not in _VALID_STATES:
        status = "inbox"
    meta = {
        "submitted_at": submitted_at,
        "source": source,
        "status": status,
        "last_updated_at": now_iso,
        "discovery_id": discovery.get("id") or "",
        "discovery_source": discovery.get("source") or source,
        "discovery_domain": discovery.get("domain") or "",
    }
    cosine = discovery.get("_cosine")
    if cosine is not None:
        try:
            meta["rerank_cosine"] = float(cosine)
        except (TypeError, ValueError):
            pass
    if discovery.get("status_tag"):
        meta["status_tag"] = discovery["status_tag"]
    return meta


def stage_discovery(base_path: str, discovery: dict, source: str) -> Tuple[str, str]:
    """Stage one discovery into `.planning/research-intake/inbox/`.

    Writes `{slug}.md` + `{slug}.md.meta.json`. If a metadata file already
    exists, preserves its `submitted_at` and `status`, then overwrites both
    files with refreshed content.

    Returns (document_path, metadata_path).
    """
    ensure_research_staging(base_path)

    slug = _discovery_slug(discovery)
    inbox_dir = os.path.join(base_path, RESEARCH_INBOX)
    doc_path = os.path.join(inbox_dir, f"{slug}.md")
    meta_path = os.path.join(inbox_dir, f"{slug}.md.meta.json")

    now_iso = datetime.now(timezone.utc).isoformat()
    submitted_at = now_iso
    status = "inbox"

    if os.path.exists(meta_path):
        try:
            with open(meta_path, "r", encoding="utf-8") as f:
                prev = json.load(f)
            if isinstance(prev, dict):
                if isinstance(prev.get("submitted_at"), str) and prev["submitted_at"]:
                    submitted_at = prev["submitted_at"]
                if isinstance(prev.get("status"), str) and prev["status"] in _VALID_STATES:
                    status = prev["status"]
        except (OSError, json.JSONDecodeError):
            pass

    metadata = _build_metadata(
        discovery, source=source, submitted_at=submitted_at,
        status=status, now_iso=now_iso,
    )
    body = _discovery_to_markdown(discovery)

    with open(doc_path, "w", encoding="utf-8") as f:
        f.write(body)
    tmp_meta = meta_path + ".tmp"
    with open(tmp_meta, "w", encoding="utf-8") as f:
        json.dump(metadata, f, indent=2)
    os.replace(tmp_meta, meta_path)

    return doc_path, meta_path
