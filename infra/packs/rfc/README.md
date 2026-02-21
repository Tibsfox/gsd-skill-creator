# RFC Reference Skill Pack

## Overview

The RFC Reference Skill provides a complete pipeline for searching, retrieving, analyzing, and citing RFC (Request for Comments) documents -- the internet's standards specifications. It includes a curated index of 57 key RFCs across 9 protocol families, 4 Python scripts for the full lifecycle, 3 agent definitions for Claude Code integration, and curated reading paths for learning internet standards.

## Architecture

```
                    ┌─────────────────┐
                    │  rfc-reference   │  Skill Definition
                    │   (skill)        │  (infra/skills/)
                    └────────┬────────┘
                             │
              ┌──────────────┼──────────────┐
              │              │              │
     ┌────────▼──────┐ ┌────▼────────┐ ┌───▼──────────────┐
     │ rfc-retriever  │ │ rfc-analyzer │ │ rfc-citation-    │  Agents
     │   (agent)      │ │   (agent)    │ │   builder (agent)│  (infra/agents/)
     └────────┬──────┘ └────┬────────┘ └───┬──────────────┘
              │              │              │
     ┌────────▼──────┐ ┌────▼────────┐ ┌───▼──────────────┐
     │ rfc-search.py  │ │ rfc-parse.py │ │ rfc-save.py      │  Scripts
     │ rfc-fetch.py   │ │              │ │                  │  (packs/rfc/scripts/)
     └────────┬──────┘ └────┬────────┘ └───┬──────────────┘
              │              │              │
              └──────────────┼──────────────┘
                             │
                    ┌────────▼────────┐
                    │  rfc-index.yaml  │  Built-in Index
                    │   (57 RFCs)      │  (packs/rfc/data/)
                    └─────────────────┘
```

## Quick Start

1. **Search** -- Find relevant RFCs by topic or keyword:
   ```bash
   python3 infra/packs/rfc/scripts/rfc-search.py "TLS"
   ```

2. **Fetch** -- Download the RFC text:
   ```bash
   python3 infra/packs/rfc/scripts/rfc-fetch.py 8446
   ```

3. **Parse** -- Extract document structure and requirements:
   ```bash
   python3 infra/packs/rfc/scripts/rfc-parse.py 8446 --format json
   ```

4. **Analyze** -- Focus on RFC 2119 normative language:
   ```bash
   python3 infra/packs/rfc/scripts/rfc-parse.py 8446 --requirements-only
   ```

5. **Cite** -- Generate formatted reports:
   ```bash
   python3 infra/packs/rfc/scripts/rfc-save.py 8446 --format all --include-requirements
   ```

## Scripts Reference

| Script | Usage | Purpose |
|--------|-------|---------|
| `rfc-search.py` | `rfc-search.py <query> [--online] [--family FAMILY] [--format text\|json\|yaml]` | Search built-in index and optionally rfc-editor.org |
| `rfc-fetch.py` | `rfc-fetch.py <number> [--format text\|html] [--force] [--info]` | Download RFC documents with local caching |
| `rfc-parse.py` | `rfc-parse.py <file_or_number> [--format text\|json] [--sections-only] [--requirements-only]` | Extract ToC, sections, and RFC 2119 requirements |
| `rfc-save.py` | `rfc-save.py <number> [--format markdown\|json\|bibtex\|all] [--sections N,N] [--include-requirements]` | Generate Markdown, JSON, and BibTeX reports |

All scripts use `--help` for full usage details.

## Built-in Index

The curated index (`data/rfc-index.yaml`) covers 9 protocol families:

| Family | Count | Key RFCs |
|--------|-------|----------|
| HTTP | 10 | 9110 (Semantics), 9113 (HTTP/2), 9114 (HTTP/3) |
| TLS | 7 | 8446 (TLS 1.3), 5246 (TLS 1.2), 8996 (Deprecation) |
| TCP | 6 | 9293 (TCP), 5681 (Congestion), 8312 (Prague) |
| DNS | 7 | 1035 (DNS), 8484 (DoH), 7858 (DoT), 4033 (DNSSEC) |
| IP | 6 | 791 (IPv4), 8200 (IPv6), 1918 (Private), 4632 (CIDR) |
| QUIC | 5 | 9000 (Transport), 9001 (Loss), 9369 (v2) |
| OAuth | 6 | 6749 (OAuth 2.0), 7636 (PKCE), 9449 (DPoP) |
| JWT | 5 | 7519 (JWT), 7515 (JWS), 7516 (JWE), 7517 (JWK) |
| JSON | 5 | 8259 (JSON), 6901 (Pointer), 9535 (JSONPath) |

Each entry includes: number, title, status, date, protocol family, obsolescence chain (obsoletes/obsoleted_by/updates/updated_by), keywords, and abstract snippet.

To extend the index, add entries to `data/rfc-index.yaml` following the existing YAML structure.

## Reading Paths

See `reading-paths.yaml` for curated study progressions:

- **Quick Start** (2-3 hours) -- 8 essential RFCs every developer should know
- **Deep Dive** (8-12 hours) -- 5 protocol tracks: Web Stack, Security, Transport, Infrastructure, Data Formats
- **Complete Study** (40+ hours) -- All 57 indexed RFCs organized by protocol family with historical context

## Directory Structure

```
infra/packs/rfc/
├── README.md                    # This file
├── reading-paths.yaml           # Curated RFC study progressions
├── data/
│   ├── rfc-index.yaml           # Built-in curated index (57 RFCs)
│   ├── cache/                   # Downloaded RFC text/HTML (gitignored)
│   │   └── .gitignore
│   └── reports/                 # Generated reports (gitignored)
│       └── .gitignore
└── scripts/
    ├── rfc-search.py            # Search index and rfc-editor.org
    ├── rfc-fetch.py             # Download with caching
    ├── rfc-parse.py             # Extract structure and requirements
    └── rfc-save.py              # Generate Markdown/JSON/BibTeX reports
```

## Pack Pattern

This pack follows the **archive/study/implement** model:

- **Archive**: Built-in index (`rfc-index.yaml`) provides curated metadata for 57 key internet standards. The fetch script (`rfc-fetch.py`) downloads and caches full RFC text from rfc-editor.org, building a local document archive.

- **Study**: The parse script (`rfc-parse.py`) extracts document structure (table of contents, section boundaries) and normative language (RFC 2119 MUST/SHOULD/MAY requirements). Reading paths (`reading-paths.yaml`) provide guided progressions through the standards.

- **Implement**: The save script (`rfc-save.py`) generates actionable output: Markdown reports for human reading, JSON for machine consumption, and BibTeX for academic citation. Section filtering enables targeted analysis.
