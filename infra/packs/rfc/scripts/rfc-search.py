#!/usr/bin/env python3
"""Search the built-in RFC index and optionally query rfc-editor.org."""

import argparse
import json
import re
import sys
import urllib.error
import urllib.request
from pathlib import Path

import yaml


def load_index(index_path: Path) -> list[dict]:
    """Load the built-in RFC index from YAML."""
    with open(index_path, encoding="utf-8") as f:
        data = yaml.safe_load(f)
    return data.get("rfcs", [])


def match_rfc(rfc: dict, query: str) -> bool:
    """Check if an RFC entry matches the query (case-insensitive)."""
    query_lower = query.lower()

    # Match against RFC number
    if query_lower.isdigit() and str(rfc["number"]) == query_lower:
        return True
    if query_lower.startswith("rfc") and query_lower[3:].strip().isdigit():
        if str(rfc["number"]) == query_lower[3:].strip():
            return True

    # Match against title
    if query_lower in rfc.get("title", "").lower():
        return True

    # Match against keywords
    for keyword in rfc.get("keywords", []):
        if query_lower in keyword.lower():
            return True

    # Match against abstract snippet
    if query_lower in rfc.get("abstract_snippet", "").lower():
        return True

    # Match against protocol family
    if query_lower == rfc.get("protocol_family", "").lower():
        return True

    return False


def search_local(rfcs: list[dict], query: str, family: str | None = None) -> list[dict]:
    """Search the local index for matching RFCs."""
    results = []
    for rfc in rfcs:
        if family and rfc.get("protocol_family", "").lower() != family.lower():
            continue
        if match_rfc(rfc, query):
            results.append(rfc)
    return results


def search_online(query: str) -> list[dict]:
    """Query rfc-editor.org for RFCs matching the query (best-effort)."""
    url = f"https://www.rfc-editor.org/search/rfc_search_detail.php?title={urllib.request.quote(query)}&pubstatus%5B%5D=Any&pub_date_type=any"
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "rfc-search/1.0"})
        with urllib.request.urlopen(req, timeout=10) as resp:
            html = resp.read().decode("utf-8", errors="replace")
        # Parse RFC numbers and titles from the results page
        # Pattern: RFC NNNN followed by title text
        results = []
        for m in re.finditer(r'RFC\s+(\d{1,5})\b[^<]*?<[^>]*>([^<]+)', html):
            number = int(m.group(1))
            title = m.group(2).strip()
            if title and len(title) > 5:
                results.append({
                    "number": number,
                    "title": title,
                    "status": "unknown",
                    "source": "rfc-editor.org",
                })
        # Deduplicate by RFC number
        seen = set()
        unique = []
        for r in results:
            if r["number"] not in seen:
                seen.add(r["number"])
                unique.append(r)
        return unique[:20]  # Limit to 20 results
    except (urllib.error.URLError, TimeoutError, OSError) as e:
        print(f"Warning: Could not reach rfc-editor.org: {e}", file=sys.stderr)
        return []


def format_text(results: list[dict]) -> str:
    """Format results as text output."""
    lines = []
    for rfc in results:
        status = rfc.get("status", "unknown")
        line = f"RFC {rfc['number']} [{status}] - {rfc['title']}"
        obsoleted_by = rfc.get("obsoleted_by", [])
        if obsoleted_by:
            replacements = ", ".join(f"RFC {n}" for n in obsoleted_by)
            line += f" (obsoleted by {replacements})"
        source = rfc.get("source")
        if source:
            line += f" [{source}]"
        lines.append(line)
    return "\n".join(lines) if lines else "No matching RFCs found."


def format_json(results: list[dict]) -> str:
    """Format results as JSON output."""
    return json.dumps(results, indent=2)


def format_yaml(results: list[dict]) -> str:
    """Format results as YAML output."""
    return yaml.dump(results, default_flow_style=False, allow_unicode=True)


def main():
    parser = argparse.ArgumentParser(
        description="Search the built-in RFC index and optionally query rfc-editor.org",
        epilog="Examples:\n"
               "  rfc-search.py HTTP\n"
               "  rfc-search.py \"TLS 1.3\"\n"
               "  rfc-search.py congestion --family tcp\n"
               "  rfc-search.py WebSocket --online\n",
        formatter_class=argparse.RawDescriptionHelpFormatter,
    )
    parser.add_argument("query", help="Search query (keyword, topic, RFC number, or protocol name)")
    parser.add_argument("--online", action="store_true", help="Also query rfc-editor.org for results")
    parser.add_argument("--family", help="Filter results to a specific protocol family")
    parser.add_argument(
        "--format",
        choices=["text", "json", "yaml"],
        default="text",
        help="Output format (default: text)",
    )

    args = parser.parse_args()

    # Resolve index path relative to script location
    script_dir = Path(__file__).resolve().parent
    index_path = script_dir / ".." / "data" / "rfc-index.yaml"

    if not index_path.exists():
        print(f"Error: Built-in index not found at {index_path}", file=sys.stderr)
        sys.exit(1)

    rfcs = load_index(index_path)
    results = search_local(rfcs, args.query, args.family)

    if args.online:
        online_results = search_online(args.query)
        # Merge online results, skipping those already in local results
        local_numbers = {r["number"] for r in results}
        for r in online_results:
            if r["number"] not in local_numbers:
                results.append(r)

    if args.format == "text":
        print(format_text(results))
    elif args.format == "json":
        print(format_json(results))
    elif args.format == "yaml":
        print(format_yaml(results))


if __name__ == "__main__":
    main()
