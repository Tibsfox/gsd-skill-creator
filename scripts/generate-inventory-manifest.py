#!/usr/bin/env python3
"""
OOPS-GSD v1.49.576 — C6 / OGA-065 (inventory drift-control)

Regenerates INVENTORY-MANIFEST.json at the repo root by walking the
.claude/ live tree (when present) and project-claude/ source-of-truth.

Origin classification per file (commands/agents/hooks):
  - "vendored:gsd-build@<version>" iff a frontmatter / header marker
    declares upstream lineage:
        - YAML frontmatter:  gsd-build-source: <version>
        - YAML frontmatter:  gsd-hook-version: <version>
        - shell-style header: # gsd-hook-version: <version>
  - "local" otherwise.

Usage:
  python3 scripts/generate-inventory-manifest.py            # write manifest
  python3 scripts/generate-inventory-manifest.py --check    # exit 1 on drift
  python3 scripts/generate-inventory-manifest.py --stdout   # print only
"""
from __future__ import annotations

import json
import os
import re
import sys
from datetime import datetime, timezone
from pathlib import Path

GENERATOR_VERSION = "1.0.0"
MILESTONE = "v1.49.576"
MANIFEST_PATH = "INVENTORY-MANIFEST.json"


def repo_root() -> Path:
    p = Path(os.environ.get("REPO_ROOT", "")).resolve() if os.environ.get("REPO_ROOT") else None
    if p and p.exists():
        return p
    return Path.cwd()


def detect_origin(path: Path) -> str:
    """Return 'vendored:gsd-build@<v>' or 'local'."""
    try:
        head = path.read_text(encoding="utf-8", errors="replace").splitlines()[:30]
    except OSError:
        return "local"
    text = "\n".join(head)
    # YAML frontmatter style (vendored commands carry this)
    m = re.search(r"^gsd-build-source:\s*(\S+)\s*$", text, re.MULTILINE)
    if m:
        return f"vendored:gsd-build@{m.group(1)}"
    # Shell/comment style (vendored hooks carry this)
    m = re.search(r"^#\s*gsd-hook-version:\s*(\S+)\s*$", text, re.MULTILINE)
    if m:
        return f"vendored:gsd-build@{m.group(1)}"
    # YAML frontmatter without prefix (some agents)
    m = re.search(r"^gsd-hook-version:\s*(\S+)\s*$", text, re.MULTILINE)
    if m:
        return f"vendored:gsd-build@{m.group(1)}"
    return "local"


def collect_commands(root: Path) -> list[dict]:
    """Walk project-claude/commands/gsd/ (the SOT — .claude/ is gitignored)."""
    out: list[dict] = []
    seen: set[str] = set()
    d = root / "project-claude" / "commands" / "gsd"
    if d.is_dir():
        for p in sorted(d.glob("*.md")):
            name = p.stem
            if name in seen:
                continue
            seen.add(name)
            rel = p.relative_to(root).as_posix()
            out.append({"name": name, "path": rel, "origin": detect_origin(p)})
    return out


def collect_agents(root: Path) -> list[dict]:
    """Walk project-claude/agents/ (the SOT — .claude/ is gitignored)."""
    out: list[dict] = []
    seen: set[str] = set()
    d = root / "project-claude" / "agents"
    if d.is_dir():
        for p in sorted(d.glob("*.md")):
            name = p.stem
            if name in seen:
                continue
            seen.add(name)
            rel = p.relative_to(root).as_posix()
            out.append({"name": name, "path": rel, "origin": detect_origin(p)})
    return out


def collect_hooks(root: Path) -> list[dict]:
    """Walk project-claude/hooks/ (the SOT — .claude/ is gitignored)."""
    out: list[dict] = []
    seen: set[str] = set()
    d = root / "project-claude" / "hooks"
    if d.is_dir():
        for ext in ("*.sh", "*.cjs", "*.js", "*.mjs"):
            for p in sorted(d.glob(ext)):
                # Skip hooks/lib internals — they are library helpers, not registered hooks.
                if "lib" in p.parts:
                    continue
                name = p.name  # keep extension to disambiguate .sh vs .cjs siblings
                if name in seen:
                    continue
                seen.add(name)
                rel = p.relative_to(root).as_posix()
                out.append({"name": name, "path": rel, "origin": detect_origin(p)})
    return out


def collect_src_subsystems(root: Path) -> list[str]:
    src = root / "src"
    if not src.is_dir():
        return []
    out = []
    for child in sorted(src.iterdir()):
        if child.is_dir() and not child.name.startswith("__") and not child.name.startswith("."):
            out.append(child.name)
    return out


def count_gsd_prefixed(agents: list[dict]) -> int:
    return sum(1 for a in agents if a["name"].startswith("gsd-"))


def build_manifest(root: Path) -> dict:
    commands = collect_commands(root)
    agents = collect_agents(root)
    hooks = collect_hooks(root)
    src_subs = collect_src_subsystems(root)
    return {
        "generated_at": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "generator_version": GENERATOR_VERSION,
        "milestone": MILESTONE,
        "counts": {
            "commands": len(commands),
            "agents_total": len(agents),
            "agents_gsd_prefix": count_gsd_prefixed(agents),
            "hooks": len(hooks),
            "src_subsystems": len(src_subs),
        },
        "commands": commands,
        "agents": agents,
        "hooks": hooks,
        "src_subsystems": src_subs,
    }


def normalize_for_compare(manifest: dict) -> dict:
    """Drop generated_at to make comparisons stable."""
    m = dict(manifest)
    m.pop("generated_at", None)
    return m


def main() -> int:
    args = sys.argv[1:]
    check_mode = "--check" in args
    stdout_mode = "--stdout" in args

    root = repo_root()
    manifest = build_manifest(root)
    output = json.dumps(manifest, indent=2, sort_keys=False) + "\n"

    if stdout_mode:
        sys.stdout.write(output)
        return 0

    target = root / MANIFEST_PATH

    if check_mode:
        if not target.exists():
            print(f"[drift] {MANIFEST_PATH} missing — regenerate with scripts/generate-inventory-manifest.sh", file=sys.stderr)
            return 1
        committed = json.loads(target.read_text(encoding="utf-8"))
        if normalize_for_compare(committed) != normalize_for_compare(manifest):
            print(f"[drift] {MANIFEST_PATH} out of date — regenerate with scripts/generate-inventory-manifest.sh", file=sys.stderr)
            return 1
        return 0

    target.write_text(output, encoding="utf-8")
    print(f"[ok] wrote {MANIFEST_PATH}: commands={manifest['counts']['commands']} agents={manifest['counts']['agents_total']} hooks={manifest['counts']['hooks']} src_subsystems={manifest['counts']['src_subsystems']}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
