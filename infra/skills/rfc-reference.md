---
name: rfc-reference
description: "Searches, retrieves, analyzes, and cites RFC documents through a 3-agent system with 4 Python scripts. Use when looking up internet standards, extracting protocol requirements, or generating RFC citations."
metadata:
  extensions:
    gsd-skill-creator:
      triggers:
        intents:
          - "rfc.*search"
          - "rfc.*fetch"
          - "rfc.*cite"
          - "rfc.*reference"
          - "internet.*standard"
          - "protocol.*spec"
          - "rfc.*2119"
          - "rfc.*requirements"
        files:
          - "infra/packs/rfc/scripts/rfc-search.py"
          - "infra/packs/rfc/scripts/rfc-fetch.py"
          - "infra/packs/rfc/scripts/rfc-parse.py"
          - "infra/packs/rfc/scripts/rfc-save.py"
          - "infra/packs/rfc/data/rfc-index.yaml"
        contexts:
          - "RFC lookup"
          - "protocol analysis"
          - "internet standards"
          - "citation generation"
        threshold: 0.7
      token_budget: "1.5%"
      version: 1
      enabled: true
      plan_origin: "01-rfc-reference-skill"
      phase_origin: "202"
---

# RFC Reference

## Purpose

Searches, retrieves, analyzes, and cites RFC (Request for Comments) documents -- the internet's standards documents. Provides a complete pipeline from finding relevant RFCs to generating structured citations in multiple formats. Built on a curated index of 57 RFCs across 9 protocol families with online fallback to rfc-editor.org.

## Capabilities

- Search curated index of 57 RFCs by keyword, topic, RFC number, or protocol family
- Query rfc-editor.org for RFCs not in the built-in index
- Download RFC text and HTML with local caching
- Parse document structure: sections, subsections, appendices
- Extract RFC 2119 normative requirements (MUST/SHOULD/MAY) with section context
- Generate Markdown reports with section-level citations
- Generate JSON reports for machine consumption
- Generate BibTeX entries for academic papers
- Detect and warn about obsoleted RFCs with replacement pointers
- Filter analysis to specific sections for targeted investigation

## Key Scripts

| Script | Purpose |
|--------|---------|
| `infra/packs/rfc/scripts/rfc-search.py` | Search built-in index and optionally rfc-editor.org |
| `infra/packs/rfc/scripts/rfc-fetch.py` | Download RFC documents with local caching |
| `infra/packs/rfc/scripts/rfc-parse.py` | Extract document structure and RFC 2119 requirements |
| `infra/packs/rfc/scripts/rfc-save.py` | Generate Markdown, JSON, and BibTeX reports |

## Dependencies

- Python 3.10+ (for `X | None` union syntax)
- PyYAML (for index loading)
- No other external dependencies -- all scripts use stdlib + pyyaml only

## Usage Examples

**Find RFCs about a topic:**
```bash
python3 infra/packs/rfc/scripts/rfc-search.py "HTTP" --format text
python3 infra/packs/rfc/scripts/rfc-search.py "congestion" --family tcp
python3 infra/packs/rfc/scripts/rfc-search.py "WebSocket" --online
```

**Download and analyze an RFC:**
```bash
python3 infra/packs/rfc/scripts/rfc-fetch.py 8446
python3 infra/packs/rfc/scripts/rfc-parse.py 8446 --format json
python3 infra/packs/rfc/scripts/rfc-parse.py 8446 --requirements-only
```

**Generate citation reports:**
```bash
python3 infra/packs/rfc/scripts/rfc-save.py 9110 --format all --include-requirements
python3 infra/packs/rfc/scripts/rfc-save.py 8446 --format bibtex
python3 infra/packs/rfc/scripts/rfc-save.py 9000 --sections 1,2,3 --format markdown
```

**Quick metadata lookup:**
```bash
python3 infra/packs/rfc/scripts/rfc-fetch.py 9293 --info
```

## Test Cases

### Test 1: Search returns results
- **Input:** `python3 infra/packs/rfc/scripts/rfc-search.py "HTTP"`
- **Expected:** Returns HTTP-family RFCs including 9110, 9112, 9113, 9114
- **Verify:** Output contains "RFC 9110" and "RFC 9114"

### Test 2: Parse extracts structure
- **Input:** `python3 infra/packs/rfc/scripts/rfc-parse.py 2119 --format json` (after fetching)
- **Expected:** Valid JSON with sections array and rfc_number field
- **Verify:** `python3 -c "import json; d=json.loads(open('/dev/stdin').read()); assert d['rfc_number'] == 2119"`

### Test 3: Save generates all formats
- **Input:** `python3 infra/packs/rfc/scripts/rfc-save.py 2119 --format all`
- **Expected:** Creates rfc2119.md, rfc2119.json, rfc2119.bib in data/reports/
- **Verify:** `ls infra/packs/rfc/data/reports/rfc2119.{md,json,bib}` shows all three files

## Token Budget Rationale

1.5% budget reflects 4 Python scripts (~1,200 lines total) plus the curated YAML index (~700 lines). The index provides instant offline lookup but contributes significant content. The scripts use consistent patterns (argparse, pathlib, subprocess composition) that compress well in context.
