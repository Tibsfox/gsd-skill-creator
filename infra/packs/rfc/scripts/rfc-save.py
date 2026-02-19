#!/usr/bin/env python3
"""Generate structured reports from RFC documents in Markdown, JSON, and BibTeX formats."""

import argparse
import json
import subprocess
import sys
from pathlib import Path

import yaml


def load_index_entry(index_path: Path, rfc_number: int) -> dict | None:
    """Load metadata for a specific RFC from the built-in index."""
    if not index_path.exists():
        return None
    with open(index_path, encoding="utf-8") as f:
        data = yaml.safe_load(f)
    for rfc in data.get("rfcs", []):
        if rfc["number"] == rfc_number:
            return rfc
    return None


def run_parse(rfc_number: int, cache_dir: Path, script_dir: Path) -> dict | None:
    """Run rfc-parse.py and return structured JSON output."""
    parse_script = script_dir / "rfc-parse.py"
    if not parse_script.exists():
        return None

    try:
        result = subprocess.run(
            [sys.executable, str(parse_script), str(rfc_number),
             "--format", "json", "--cache-dir", str(cache_dir)],
            capture_output=True, text=True, timeout=30,
        )
        if result.returncode != 0:
            return None
        return json.loads(result.stdout)
    except (subprocess.TimeoutExpired, json.JSONDecodeError, OSError):
        return None


def generate_markdown(
    rfc_number: int,
    index_entry: dict | None,
    parse_data: dict | None,
    include_requirements: bool = False,
    sections_filter: list[str] | None = None,
) -> str:
    """Generate Markdown report for an RFC."""
    parts = []

    # Title
    title = ""
    if parse_data:
        title = parse_data.get("title", "")
    if not title and index_entry:
        title = index_entry.get("title", "")
    parts.append(f"# RFC {rfc_number}: {title}")
    parts.append("")

    # Metadata table
    status = ""
    date = ""
    family = ""
    obsoletes_str = "None"
    obsoleted_by_str = "None"

    if index_entry:
        status = index_entry.get("status", "unknown")
        date = index_entry.get("date", "unknown")
        family = index_entry.get("protocol_family", "unknown")
        obs = index_entry.get("obsoletes", [])
        if obs:
            obsoletes_str = ", ".join(f"RFC {n}" for n in obs)
        obs_by = index_entry.get("obsoleted_by", [])
        if obs_by:
            obsoleted_by_str = ", ".join(f"RFC {n}" for n in obs_by)
    elif parse_data:
        status = parse_data.get("status", "unknown")
        date = parse_data.get("date", "unknown")

    parts.append(f"**Status:** {status}")
    parts.append(f"**Date:** {date}")
    if family:
        parts.append(f"**Protocol Family:** {family}")
    parts.append(f"**Obsoletes:** {obsoletes_str}")
    parts.append(f"**Obsoleted By:** {obsoleted_by_str}")
    parts.append("")

    if parse_data:
        abstract = parse_data.get("abstract", "")
        if abstract:
            parts.append("## Abstract")
            parts.append("")
            parts.append(abstract)
            parts.append("")

        # Table of Contents
        sections = parse_data.get("sections", [])
        if sections:
            filtered_sections = sections
            if sections_filter:
                filtered_sections = [
                    s for s in sections
                    if any(s["number"] == sf or s["number"].startswith(sf + ".") for sf in sections_filter)
                ]

            parts.append("## Table of Contents")
            parts.append("")
            for sec in filtered_sections:
                indent = "  " * (sec.get("level", 1) - 1)
                parts.append(f"{indent}{sec['number']}. {sec['title']}")
            parts.append("")

        # Requirements
        if include_requirements:
            requirements = parse_data.get("requirements", [])
            if sections_filter:
                requirements = [
                    r for r in requirements
                    if any(r["section"] == sf or r["section"].startswith(sf + ".") for sf in sections_filter)
                ]

            parts.append("## Requirements (RFC 2119)")
            parts.append("")
            if not requirements:
                parts.append("No RFC 2119 requirements found.")
            else:
                current_section = ""
                for req in requirements:
                    if req["section"] != current_section:
                        current_section = req["section"]
                        # Find section title
                        sec_title = current_section
                        for sec in sections:
                            if sec["number"] == current_section:
                                sec_title = sec["title"]
                                break
                        parts.append(f"### Section {current_section}: {sec_title}")
                        parts.append("")
                    parts.append(f"- **{req['keyword']}**: \"{req['text']}\" (line {req['line_number']})")
                parts.append("")
    else:
        parts.append("*Note: RFC text not cached. Run `rfc-fetch.py {0}` to download, then re-run this report.*".format(rfc_number))
        parts.append("")

    # Citation
    parts.append("## Citation")
    parts.append("")
    authors = ""
    if parse_data and parse_data.get("authors"):
        authors = ", ".join(parse_data["authors"])
    parts.append(f"> {authors}, \"{title}\", RFC {rfc_number}, {date}. https://www.rfc-editor.org/rfc/rfc{rfc_number}")
    parts.append("")
    parts.append("---")
    parts.append("*Generated by RFC Reference Skill*")

    return "\n".join(parts)


def generate_json(
    rfc_number: int,
    index_entry: dict | None,
    parse_data: dict | None,
    include_requirements: bool = False,
    sections_filter: list[str] | None = None,
) -> str:
    """Generate JSON report for an RFC."""
    result: dict = {"rfc_number": rfc_number}

    if index_entry:
        result["index_metadata"] = index_entry

    if parse_data:
        result["title"] = parse_data.get("title", "")
        result["status"] = parse_data.get("status", "")
        result["date"] = parse_data.get("date", "")
        result["authors"] = parse_data.get("authors", [])
        result["abstract"] = parse_data.get("abstract", "")

        sections = parse_data.get("sections", [])
        if sections_filter:
            sections = [
                s for s in sections
                if any(s["number"] == sf or s["number"].startswith(sf + ".") for sf in sections_filter)
            ]
        result["sections"] = sections

        if include_requirements:
            requirements = parse_data.get("requirements", [])
            if sections_filter:
                requirements = [
                    r for r in requirements
                    if any(r["section"] == sf or r["section"].startswith(sf + ".") for sf in sections_filter)
                ]
            result["requirements"] = requirements
            result["requirement_summary"] = parse_data.get("requirement_summary", {})
    elif index_entry:
        result["title"] = index_entry.get("title", "")
        result["status"] = index_entry.get("status", "")
        result["date"] = index_entry.get("date", "")
        result["metadata_only"] = True

    # Citation
    title = result.get("title", "")
    date = result.get("date", "")
    authors = result.get("authors", [])
    result["citation"] = f"{', '.join(authors)}, \"{title}\", RFC {rfc_number}, {date}. https://www.rfc-editor.org/rfc/rfc{rfc_number}"

    return json.dumps(result, indent=2)


def generate_bibtex(
    rfc_number: int,
    index_entry: dict | None,
    parse_data: dict | None,
) -> str:
    """Generate BibTeX entry for an RFC."""
    title = ""
    authors = ""
    year = ""
    month = ""
    status = ""

    if index_entry:
        title = index_entry.get("title", "")
        date = index_entry.get("date", "")
        status = index_entry.get("status", "")
        if date and "-" in date:
            parts = date.split("-")
            year = parts[0]
            month_num = int(parts[1]) if len(parts) > 1 else 0
            month_names = ["", "jan", "feb", "mar", "apr", "may", "jun",
                           "jul", "aug", "sep", "oct", "nov", "dec"]
            month = month_names[month_num] if 1 <= month_num <= 12 else ""

    if parse_data:
        if not title:
            title = parse_data.get("title", "")
        author_list = parse_data.get("authors", [])
        if author_list:
            authors = " and ".join(author_list)
        if not year and parse_data.get("date"):
            date = parse_data["date"]
            # Try to extract year
            import re
            m = re.search(r'(\d{4})', date)
            if m:
                year = m.group(1)
        if not status:
            status = parse_data.get("status", "")

    # Escape BibTeX special characters in title
    bibtex_title = title.replace("&", r"\&").replace("%", r"\%").replace("_", r"\_")

    lines = [
        f"@techreport{{rfc{rfc_number},",
        f"  author = {{{authors}}},",
        f"  title = {{{{{bibtex_title}}}}},",
        f"  howpublished = {{Internet Requests for Comments}},",
        f"  type = {{RFC}},",
        f"  number = {{{rfc_number}}},",
        f"  year = {{{year}}},",
        f"  month = {{{month}}},",
        f"  publisher = {{IETF}},",
        f"  institution = {{Internet Engineering Task Force}},",
        f"  url = {{https://www.rfc-editor.org/rfc/rfc{rfc_number}}},",
        f"  note = {{{status}}}",
        "}",
    ]
    return "\n".join(lines)


def main():
    parser = argparse.ArgumentParser(
        description="Generate structured reports from RFC documents",
        epilog="Examples:\n"
               "  rfc-save.py 2119 --format markdown\n"
               "  rfc-save.py 8446 --format all --include-requirements\n"
               "  rfc-save.py 9110 --format bibtex\n"
               "  rfc-save.py 9000 --sections 1,2,3\n",
        formatter_class=argparse.RawDescriptionHelpFormatter,
    )
    parser.add_argument("rfc_number", type=int, help="RFC number to generate report for")
    parser.add_argument(
        "--format",
        choices=["markdown", "json", "bibtex", "all"],
        default="markdown",
        help="Output format (default: markdown)",
    )
    parser.add_argument("--output-dir", type=Path, help="Output directory (default: ../data/reports/)")
    parser.add_argument("--cache-dir", type=Path, help="Cache directory (default: ../data/cache/)")
    parser.add_argument("--sections", help="Comma-separated section numbers to include (e.g., 2,3.1,5)")
    parser.add_argument("--include-requirements", action="store_true", help="Include RFC 2119 requirements in report")

    args = parser.parse_args()

    # Resolve paths
    script_dir = Path(__file__).resolve().parent
    index_path = script_dir / ".." / "data" / "rfc-index.yaml"
    cache_dir = args.cache_dir or (script_dir / ".." / "data" / "cache")
    output_dir = args.output_dir or (script_dir / ".." / "data" / "reports")

    # Parse sections filter
    sections_filter = None
    if args.sections:
        sections_filter = [s.strip() for s in args.sections.split(",")]

    # Load data
    index_entry = load_index_entry(index_path, args.rfc_number)
    parse_data = run_parse(args.rfc_number, cache_dir, script_dir)

    if not index_entry and not parse_data:
        print(f"Error: No data available for RFC {args.rfc_number}.", file=sys.stderr)
        print(f"  - Not in built-in index", file=sys.stderr)
        print(f"  - Not cached (run: rfc-fetch.py {args.rfc_number})", file=sys.stderr)
        sys.exit(1)

    if not parse_data:
        print(f"Note: RFC {args.rfc_number} text not cached. Generating metadata-only report.", file=sys.stderr)
        print(f"  Run: rfc-fetch.py {args.rfc_number} for full analysis.", file=sys.stderr)

    # Create output directory
    output_dir.mkdir(parents=True, exist_ok=True)

    # Ensure .gitignore for reports directory
    gitignore = output_dir / ".gitignore"
    if not gitignore.exists():
        gitignore.write_text("*\n!.gitignore\n", encoding="utf-8")

    formats_to_generate = []
    if args.format == "all":
        formats_to_generate = ["markdown", "json", "bibtex"]
    else:
        formats_to_generate = [args.format]

    for fmt in formats_to_generate:
        if fmt == "markdown":
            content = generate_markdown(
                args.rfc_number, index_entry, parse_data,
                args.include_requirements, sections_filter,
            )
            out_path = output_dir / f"rfc{args.rfc_number}.md"
        elif fmt == "json":
            content = generate_json(
                args.rfc_number, index_entry, parse_data,
                args.include_requirements, sections_filter,
            )
            out_path = output_dir / f"rfc{args.rfc_number}.json"
        elif fmt == "bibtex":
            content = generate_bibtex(args.rfc_number, index_entry, parse_data)
            out_path = output_dir / f"rfc{args.rfc_number}.bib"
        else:
            continue

        out_path.write_text(content, encoding="utf-8")
        print(f"Saved: {out_path}")


if __name__ == "__main__":
    main()
