#!/usr/bin/env python3
"""
build-learn-pages.py — Generate per-topic HTML "Learn" pages for tibsfox.com.

Driven by .planning/research-catalog.csv. For each catalog topic, reads the
enriched markdown files in docs/research/<dir>/ and extracts everything from
the first `## Study Guide` heading to end of file. Renders the extracted
enrichment via pandoc into an HTML page wrapped in a PNW-branded template,
written to www/tibsfox/com/Research/<CODE>/learn.html.

Also writes a master index at www/tibsfox/com/Research/Learn/index.html
listing all public topics.

wcl-research and wtx-research are marked PRIVATE: their markdown files are
committed to GitHub but their pages are NOT generated here (Fox Companies
IP rule: private research stays out of the public site).

Usage:
  python3 scripts/python/build-learn-pages.py

Requires: pandoc (for markdown -> HTML), python3.

Run from repo root.
"""

from __future__ import annotations

import csv
import os
import re
import subprocess
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]
CATALOG = REPO_ROOT / ".planning" / "research-catalog.csv"
RESEARCH_DIR = REPO_ROOT / "docs" / "research"
WWW_RESEARCH = REPO_ROOT / "www" / "tibsfox" / "com" / "Research"
GITHUB_RAW = "https://github.com/Tibsfox/gsd-skill-creator/blob/artemis-ii"


# Catalog-dir → site CODE dir
CODE_MAP: dict[str, str] = {
    "ada-research":         "ADA",
    "alg-research":         "ALG",
    "asm-research":         "ASM",
    "cli-research":         "CLI",
    "cpp-research":         "CPP",
    "c-research":           "CEE",
    "for-research":         "FOR",
    "gol-research":         "GOL",
    "jav-research":         "JAV",
    "jgc-research":         "JGC",
    "jts-research":         "JTS",
    "lsp-research":         "LSP",
    "mlc-research":         "MLC",
    "pas-research":         "PAS",
    "pch-research":         "PCH",
    "perl-research":        "PRL",
    "plg-research":         "PLG",
    "prm-research":         "PRM",
    "python-research":      "PYT",
    "rca-deep":             "RCA",
    "research-methodology": "RES",
    "rng-research":         "RNG",
    "rst-research":         "RST",
    "rxx-research":         "RXX",
    "soa-research":         "SOA",
    "trs-research":         "TRS",
    "wcl-research":         "WCL",  # PRIVATE, not surfaced
    "wtx-research":         "WTX",  # PRIVATE, not surfaced
    "dmn-research":         "DMN",
    "hkp-research":         "HKP",
    "standalone":           "STANDALONE",
}

# Private topics: Fox Companies IP, never surfaced on the public site
PRIVATE_CODES = {"WCL", "WTX"}

# Human-friendly titles for the master index
TOPIC_TITLE = {
    "ADA": "Ada",
    "ALG": "ALGOL 60",
    "ASM": "Assembly Language",
    "CLI": "Command Line Interface",
    "CPP": "C++",
    "CEE": "C",
    "FOR": "Fortran",
    "GOL": "Go",
    "JAV": "Java",
    "JGC": "JVM Garbage Collection",
    "JTS": "JavaScript & TypeScript",
    "LSP": "Lisp",
    "MLC": "Machine Language & Code",
    "PAS": "Pascal",
    "PCH": "Punch Cards",
    "PRL": "Perl & PHP",
    "PLG": "Prolog / Logic Programming",
    "PRM": "Project Management",
    "PYT": "Python",
    "RCA": "Root Cause Analysis",
    "RES": "Research Methodology",
    "RNG": "Random Number Generation",
    "RST": "Rust",
    "RXX": "REXX & ARexx",
    "SOA": "Service-Oriented Architecture",
    "TRS": "Trace Scheduling & VLIW",
    "DMN": "Data Mining",
    "HKP": "Data Housekeeping",
}

# One-line taglines
TOPIC_TAGLINE = {
    "ADA": "The language for people who want to be sure.",
    "ALG": "The paper language that invented programming-language theory.",
    "ASM": "The thin layer between human thought and machine execution.",
    "CLI": "Sixty years of typed commands, still winning.",
    "CPP": "Zero-overhead abstraction. Forty years, still evolving.",
    "CEE": "The substrate of everything.",
    "FOR": "The first high-level language, still alive at 68.",
    "GOL": "Boring by design. That turned out to be the feature.",
    "JAV": "Thirty years of enterprise, still evolving.",
    "JGC": "Where managed memory meets reality.",
    "JTS": "The language of the browser, and everything after.",
    "LSP": "The meta-language. Everything else is an approximation.",
    "MLC": "What the CPU actually sees.",
    "PAS": "Wirth's vision of teachable, maintainable code.",
    "PCH": "1965 batch computing returned in 2026 AI orchestration.",
    "PRL": "The duct tape of the internet, plus the language that won the web.",
    "PLG": "Logic as the programming model.",
    "PRM": "From the pyramids to AI-native systems.",
    "PYT": "The universal glue of modern computing.",
    "RCA": "Why things failed, traced to the roots.",
    "RES": "The discipline of finding things out honestly.",
    "RNG": "The deterministic production of unpredictability.",
    "RST": "Memory safety without garbage collection.",
    "RXX": "IBM's scripting language, revived on the Amiga, ported forward.",
    "SOA": "From CORBA to MCP: the long arc of services.",
    "TRS": "Scheduling across basic blocks, from Multiflow to Groq.",
    "DMN": "Turning data into knowledge, one algorithm at a time.",
    "HKP": "The care and feeding of data.",
}


def extract_enrichment(md_path: Path) -> str | None:
    """Return everything from `## Study Guide` to EOF as markdown, or None."""
    text = md_path.read_text(encoding="utf-8")
    m = re.search(r"^## Study Guide", text, re.MULTILINE)
    if not m:
        return None
    return text[m.start():]


def md_to_html(md: str) -> str:
    """Pipe markdown through pandoc, return HTML fragment."""
    result = subprocess.run(
        ["pandoc", "--from", "markdown", "--to", "html", "--wrap=none"],
        input=md, capture_output=True, text=True, check=True,
    )
    return result.stdout


def html_template(code: str, title: str, tagline: str, body_html: str,
                  file_links: list[tuple[str, str]]) -> str:
    """PNW-branded learn page template."""
    link_items = "\n".join(
        f'      <li><a href="{GITHUB_RAW}/docs/research/{path}" target="_blank" rel="noopener">{name}</a></li>'
        for name, path in file_links
    )
    return f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>{title} &mdash; Learn | Tibsfox Research</title>
<style>
:root {{
  --bg: #04060c; --panel: #080c16; --border: rgba(255,255,255,0.06);
  --text: #c8d0e0; --dim: rgba(255,255,255,0.35);
  --green: #4CAF50; --green-light: #81C784;
  --blue: #4a7aba; --blue-light: #64b5f6;
  --gold: #C4A35A; --amber: #E89848;
}}
* {{ margin:0; padding:0; box-sizing:border-box; }}
body {{ background:var(--bg); color:var(--text); font-family:Georgia,'Times New Roman',serif; line-height:1.7; }}
a {{ color:var(--green); text-decoration:none; }}
a:hover {{ color:var(--green-light); text-decoration:underline; }}

header {{
  background:linear-gradient(135deg, #000a0a 0%, #0a1a15 25%, #0a2a1a 50%, #051510 75%, var(--bg) 100%);
  padding:2.5rem 2rem 2rem; text-align:center;
  border-bottom:3px solid var(--green);
  position:relative; overflow:hidden;
}}
header::before {{
  content:''; position:absolute; inset:0;
  background:radial-gradient(ellipse 40% 50% at 50% 40%, rgba(76,175,80,0.08) 0%, transparent 70%);
}}
header h1 {{ font-size:2rem; font-weight:400; color:#fff; position:relative; letter-spacing:0.04em; }}
header .subtitle {{ color:var(--green); font-size:0.95rem; font-style:italic; margin-top:0.3rem; position:relative; }}
header .meta {{ color:rgba(255,255,255,0.3); font-size:0.8rem; margin-top:0.5rem; position:relative; font-family:system-ui,sans-serif; }}
header nav {{ margin-top:1rem; position:relative; font-family:system-ui,sans-serif; font-size:0.82rem; }}
header nav a {{ color:rgba(255,255,255,0.5); margin:0 0.6rem; }}
header nav a:hover {{ color:var(--green-light); }}
header nav a.active {{ color:var(--green); }}

main {{ max-width:1000px; margin:0 auto; padding:2rem 1.5rem 4rem; }}

main h1 {{ display:none; }}  /* suppress duplicate H1 if pandoc emits one */
main h2 {{
  font-size:1.1rem; font-weight:500; color:var(--green-light); text-transform:uppercase; letter-spacing:0.08em;
  margin:2.5rem 0 1rem; padding-bottom:0.3rem; border-bottom:1px solid var(--border);
  font-family:system-ui,sans-serif;
}}
main h3 {{
  font-size:1rem; font-weight:500; color:#fff; margin:1.5rem 0 0.6rem;
  font-family:system-ui,sans-serif;
}}
main h4 {{
  font-size:0.9rem; font-weight:500; color:var(--dim); margin:1rem 0 0.4rem;
  font-family:system-ui,sans-serif; text-transform:uppercase; letter-spacing:0.05em;
}}
main p {{ margin:0.7rem 0; }}
main ul, main ol {{ margin:0.7rem 0 0.7rem 1.5rem; }}
main li {{ margin:0.3rem 0; }}
main blockquote {{
  font-style:italic; color:rgba(200,208,224,0.8);
  border-left:3px solid var(--green);
  padding:0.6rem 1rem; margin:1rem 0; background:rgba(76,175,80,0.04);
}}
main code {{
  background:var(--panel); padding:0.1rem 0.4rem; border-radius:3px;
  font-family:'SF Mono','Consolas',monospace; font-size:0.85em;
  color:var(--green-light);
}}
main pre {{
  background:var(--panel); border:1px solid var(--border); border-radius:4px;
  padding:1rem; margin:1rem 0; overflow-x:auto;
}}
main pre code {{
  background:transparent; padding:0; color:var(--text);
  font-size:0.82rem; line-height:1.5;
}}
main table {{ border-collapse:collapse; margin:1rem 0; font-size:0.85rem; }}
main th, main td {{ border:1px solid var(--border); padding:0.4rem 0.8rem; text-align:left; }}
main th {{ background:var(--panel); color:#fff; font-family:system-ui,sans-serif; }}

.tagline-box {{
  background:var(--panel); border:1px solid var(--border); border-radius:6px;
  border-left:3px solid var(--green);
  padding:1.2rem 1.5rem; margin-bottom:2rem;
  font-style:italic; color:var(--green-light);
}}

.sources {{
  background:var(--panel); border:1px solid var(--border); border-radius:6px;
  padding:1.2rem 1.5rem; margin-bottom:2rem;
}}
.sources h3 {{
  color:var(--amber); text-transform:uppercase; letter-spacing:0.08em;
  font-size:0.85rem; margin-bottom:0.8rem;
}}
.sources ul {{ list-style:none; margin:0; padding:0; }}
.sources li {{
  font-family:system-ui,sans-serif; font-size:0.85rem; padding:0.25rem 0;
  border-bottom:1px solid rgba(255,255,255,0.03);
}}
.sources li:last-child {{ border-bottom:none; }}

footer {{
  max-width:1000px; margin:0 auto; padding:1.5rem; text-align:center;
  font-size:0.7rem; color:var(--dim); border-top:1px solid var(--border);
  font-family:system-ui,sans-serif;
}}
footer a {{ color:var(--dim); }}
footer a:hover {{ color:var(--green-light); }}
</style>
</head>
<body>
<header>
  <h1>{title}</h1>
  <div class="subtitle">{tagline}</div>
  <div class="meta">PNW Research Series &middot; Learn &middot; Deep Research Enrichment</div>
  <nav>
    <a href="../">Research Index</a>
    <a href="index.html">Overview</a>
    <a href="learn.html" class="active">Learn</a>
    <a href="../Learn/">All Learn Pages</a>
  </nav>
</header>

<main>
  <div class="tagline-box">
    This page surfaces the Study Guide, Programming Examples, and DIY &amp; TRY
    exercises from the deep-research markdown files on GitHub. Each section
    below is rendered directly from the source markdown.
  </div>

  <div class="sources">
    <h3>Source files on GitHub</h3>
    <ul>
{link_items}
    </ul>
  </div>

{body_html}

</main>

<footer>
  <p>&copy; 2026 Tibsfox. PNW Research Series.</p>
  <p><a href="{GITHUB_RAW}/docs/research/">Browse the full research corpus on GitHub</a></p>
</footer>
</body>
</html>
"""


def master_index_html(topics: list[dict]) -> str:
    """Generate the master Learn index page."""
    cards = []
    for t in topics:
        cards.append(f"""    <div class="topic-card">
      <h3><a href="../{t['code']}/learn.html">{t['title']}</a></h3>
      <p class="tagline">{t['tagline']}</p>
      <p class="files-count">{t['file_count']} files &middot; {t['category']}</p>
    </div>""")
    cards_html = "\n".join(cards)

    return f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Learn &mdash; Deep Research Enrichment | Tibsfox Research</title>
<style>
:root {{
  --bg: #04060c; --panel: #080c16; --border: rgba(255,255,255,0.06);
  --text: #c8d0e0; --dim: rgba(255,255,255,0.35);
  --green: #4CAF50; --green-light: #81C784;
  --amber: #E89848;
}}
* {{ margin:0; padding:0; box-sizing:border-box; }}
body {{ background:var(--bg); color:var(--text); font-family:Georgia,'Times New Roman',serif; line-height:1.7; }}
a {{ color:var(--green); text-decoration:none; }}
a:hover {{ color:var(--green-light); }}

header {{
  background:linear-gradient(135deg, #000a0a 0%, #0a1a15 25%, #0a2a1a 50%, #051510 75%, var(--bg) 100%);
  padding:2.5rem 2rem 2rem; text-align:center;
  border-bottom:3px solid var(--green);
  position:relative; overflow:hidden;
}}
header::before {{
  content:''; position:absolute; inset:0;
  background:radial-gradient(ellipse 40% 50% at 50% 40%, rgba(76,175,80,0.08) 0%, transparent 70%);
}}
header h1 {{ font-size:2rem; font-weight:400; color:#fff; position:relative; letter-spacing:0.04em; }}
header .subtitle {{ color:var(--green); font-size:0.95rem; font-style:italic; margin-top:0.3rem; position:relative; }}
header .meta {{ color:rgba(255,255,255,0.3); font-size:0.8rem; margin-top:0.5rem; position:relative; font-family:system-ui,sans-serif; }}
header nav {{ margin-top:1rem; position:relative; font-family:system-ui,sans-serif; font-size:0.82rem; }}
header nav a {{ color:rgba(255,255,255,0.5); margin:0 0.6rem; }}
header nav a.active {{ color:var(--green); }}

main {{ max-width:1200px; margin:0 auto; padding:2rem 1.5rem 4rem; }}

blockquote {{
  font-style:italic; color:rgba(76,175,80,0.7); border-left:3px solid var(--green);
  padding:0.8rem 1.2rem; margin:0 0 2rem; font-size:0.95rem;
}}

h2 {{
  font-size:1rem; font-weight:400; color:var(--dim); text-transform:uppercase; letter-spacing:0.1em;
  margin:2.5rem 0 1rem; padding-bottom:0.3rem; border-bottom:1px solid var(--border);
  font-family:system-ui,sans-serif;
}}

.category-head {{
  font-size:0.9rem; color:var(--amber); text-transform:uppercase; letter-spacing:0.08em;
  margin:2rem 0 0.8rem; font-family:system-ui,sans-serif; font-weight:600;
}}

.topic-grid {{
  display:grid; grid-template-columns:repeat(auto-fill, minmax(300px, 1fr)); gap:1rem;
  margin-bottom:2rem;
}}
.topic-card {{
  background:var(--panel); border:1px solid var(--border); border-radius:6px;
  padding:1.3rem; border-left:3px solid var(--green);
}}
.topic-card h3 {{
  color:#fff; font-size:1rem; margin-bottom:0.3rem; font-weight:500;
  font-family:system-ui,sans-serif;
}}
.topic-card h3 a {{ color:#fff; }}
.topic-card h3 a:hover {{ color:var(--green-light); }}
.topic-card .tagline {{
  color:var(--green-light); font-size:0.85rem; font-style:italic;
  margin-bottom:0.5rem;
}}
.topic-card .files-count {{
  font-family:monospace; font-size:0.72rem; color:var(--dim);
  letter-spacing:0.02em;
}}

.stats-bar {{
  display:flex; gap:1.5rem; flex-wrap:wrap; justify-content:center;
  padding:1.2rem 0; margin-bottom:1.5rem;
  font-family:system-ui,sans-serif; font-size:0.85rem; color:var(--dim);
  border-bottom:1px solid var(--border);
}}
.stats-bar strong {{ color:#fff; }}

footer {{
  max-width:1200px; margin:0 auto; padding:1.5rem; text-align:center;
  font-size:0.7rem; color:var(--dim); border-top:1px solid var(--border);
  font-family:system-ui,sans-serif;
}}
</style>
</head>
<body>
<header>
  <h1>Learn &mdash; Deep Research Enrichment</h1>
  <div class="subtitle">Study Guides &middot; Programming Examples &middot; DIY &amp; TRY Exercises</div>
  <div class="meta">PNW Research Series &middot; {len(topics)} topics &middot; Artemis II</div>
  <nav>
    <a href="../">Research Index</a>
    <a href="index.html" class="active">Learn Hub</a>
  </nav>
</header>

<main>
  <blockquote>
    Each topic below carries a Study Guide (prerequisites, reading order,
    key concepts), runnable Programming Examples, and hands-on DIY &amp; TRY
    exercises. The material was added during the April 2026 high-fidelity
    enrichment pass on the PNW Research corpus.
  </blockquote>

  <div class="stats-bar">
    <div><strong>{len(topics)}</strong> topics</div>
    <div><strong>~160</strong> files enriched</div>
    <div><strong>~7,900</strong> lines of study material</div>
  </div>

  <h2>All Topics</h2>
  <div class="topic-grid">
{cards_html}
  </div>
</main>

<footer>
  <p>&copy; 2026 Tibsfox. PNW Research Series.</p>
  <p><a href="{GITHUB_RAW}/docs/research/">Browse the full research corpus on GitHub</a></p>
</footer>
</body>
</html>
"""


def main() -> int:
    if not CATALOG.exists():
        print(f"Catalog not found: {CATALOG}", file=sys.stderr)
        return 1

    # Group catalog rows by directory
    rows_by_dir: dict[str, list[dict]] = {}
    standalones: list[dict] = []
    with CATALOG.open() as f:
        reader = csv.DictReader(f)
        for row in reader:
            if row["code"] == "standalone":
                standalones.append(row)
            else:
                rows_by_dir.setdefault(row["code"], []).append(row)

    topics_for_index: list[dict] = []

    # Process structured buckets
    for catalog_code, rows in sorted(rows_by_dir.items()):
        site_code = CODE_MAP.get(catalog_code)
        if not site_code:
            print(f"Skipping unknown catalog code: {catalog_code}", file=sys.stderr)
            continue
        if site_code in PRIVATE_CODES:
            print(f"Skipping PRIVATE: {catalog_code} -> {site_code}")
            continue

        bucket_dir = RESEARCH_DIR / catalog_code
        if not bucket_dir.exists():
            print(f"Source dir missing: {bucket_dir}", file=sys.stderr)
            continue

        # Collect enrichment from all files in the bucket
        all_enrichment = []
        file_links = []
        for row in rows:
            md_file = bucket_dir / row["file"]
            if not md_file.exists():
                print(f"  Missing: {md_file}", file=sys.stderr)
                continue
            enrichment = extract_enrichment(md_file)
            if enrichment is None:
                print(f"  No Study Guide in {md_file.name}")
                continue
            all_enrichment.append(f"# {row['title']}\n\n{enrichment}")
            file_links.append((row["file"], f"{catalog_code}/{row['file']}"))

        if not all_enrichment:
            print(f"  Empty bucket: {catalog_code}")
            continue

        combined_md = "\n\n---\n\n".join(all_enrichment)
        body_html = md_to_html(combined_md)

        title = TOPIC_TITLE.get(site_code, catalog_code)
        tagline = TOPIC_TAGLINE.get(site_code, "")
        page = html_template(site_code, title, tagline, body_html, file_links)

        out_dir = WWW_RESEARCH / site_code
        out_dir.mkdir(parents=True, exist_ok=True)
        out_path = out_dir / "learn.html"
        out_path.write_text(page, encoding="utf-8")
        print(f"Wrote {out_path.relative_to(REPO_ROOT)}")

        topics_for_index.append({
            "code": site_code,
            "title": title,
            "tagline": tagline,
            "file_count": len(file_links),
            "category": rows[0]["category"],
        })

    # Process standalones as a single combined page
    if standalones:
        public_standalones = []
        for row in standalones:
            md_file = RESEARCH_DIR / row["file"]
            if not md_file.exists():
                print(f"  Missing standalone: {md_file}", file=sys.stderr)
                continue
            enrichment = extract_enrichment(md_file)
            if enrichment is None:
                continue
            public_standalones.append((row, enrichment))

        if public_standalones:
            all_enrichment = []
            file_links = []
            for row, enrichment in public_standalones:
                all_enrichment.append(f"# {row['title']}\n\n{enrichment}")
                file_links.append((row["file"], row["file"]))

            combined_md = "\n\n---\n\n".join(all_enrichment)
            body_html = md_to_html(combined_md)

            page = html_template(
                "STANDALONE",
                "Standalone Research Documents",
                "Music, science fiction, PNW ecology, AI agents, business, and more.",
                body_html, file_links,
            )

            out_dir = WWW_RESEARCH / "STANDALONE"
            out_dir.mkdir(parents=True, exist_ok=True)
            out_path = out_dir / "learn.html"
            out_path.write_text(page, encoding="utf-8")
            print(f"Wrote {out_path.relative_to(REPO_ROOT)}")

            topics_for_index.append({
                "code": "STANDALONE",
                "title": "Standalone Research",
                "tagline": "Topics that stand alone outside the structured buckets.",
                "file_count": len(public_standalones),
                "category": "mixed",
            })

    # Write master index
    topics_for_index.sort(key=lambda t: t["title"])
    master = master_index_html(topics_for_index)
    master_dir = WWW_RESEARCH / "Learn"
    master_dir.mkdir(parents=True, exist_ok=True)
    (master_dir / "index.html").write_text(master, encoding="utf-8")
    print(f"Wrote www/tibsfox/com/Research/Learn/index.html")

    print(f"\nDone. {len(topics_for_index)} public topic pages generated.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
