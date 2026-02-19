#!/usr/bin/env python3
"""Download RFC documents from rfc-editor.org with local caching."""

import argparse
import sys
import urllib.error
import urllib.request
from pathlib import Path

import yaml


def load_index(index_path: Path) -> dict[int, dict]:
    """Load the built-in RFC index, keyed by RFC number."""
    if not index_path.exists():
        return {}
    with open(index_path, encoding="utf-8") as f:
        data = yaml.safe_load(f)
    return {rfc["number"]: rfc for rfc in data.get("rfcs", [])}


def show_info(rfc_number: int, index: dict[int, dict]) -> None:
    """Print metadata for an RFC from the built-in index."""
    rfc = index.get(rfc_number)
    if not rfc:
        print(f"RFC {rfc_number} not found in built-in index.")
        print("Use --online search or check rfc-editor.org directly.")
        return

    print(f"RFC {rfc['number']}: {rfc['title']}")
    print(f"  Status:          {rfc.get('status', 'unknown')}")
    print(f"  Date:            {rfc.get('date', 'unknown')}")
    print(f"  Protocol Family: {rfc.get('protocol_family', 'unknown')}")

    obsoletes = rfc.get("obsoletes", [])
    if obsoletes:
        print(f"  Obsoletes:       {', '.join(f'RFC {n}' for n in obsoletes)}")

    obsoleted_by = rfc.get("obsoleted_by", [])
    if obsoleted_by:
        print(f"  Obsoleted By:    {', '.join(f'RFC {n}' for n in obsoleted_by)}")
        print(f"  WARNING: This RFC has been superseded.")

    updates = rfc.get("updates", [])
    if updates:
        print(f"  Updates:         {', '.join(f'RFC {n}' for n in updates)}")

    updated_by = rfc.get("updated_by", [])
    if updated_by:
        print(f"  Updated By:      {', '.join(f'RFC {n}' for n in updated_by)}")

    keywords = rfc.get("keywords", [])
    if keywords:
        print(f"  Keywords:        {', '.join(keywords)}")

    snippet = rfc.get("abstract_snippet", "")
    if snippet:
        print(f"  Abstract:        {snippet}")


def fetch_rfc(rfc_number: int, fmt: str, cache_dir: Path, force: bool) -> Path | None:
    """Download an RFC document and cache it locally."""
    ext = ".html" if fmt == "html" else ".txt"
    cached_path = cache_dir / f"rfc{rfc_number}{ext}"

    # Check cache
    if cached_path.exists() and not force:
        print(f"Cached: {cached_path}")
        return cached_path

    # Build URL
    url = f"https://www.rfc-editor.org/rfc/rfc{rfc_number}{ext}"

    try:
        req = urllib.request.Request(url, headers={"User-Agent": "rfc-fetch/1.0"})
        with urllib.request.urlopen(req, timeout=30) as resp:
            content = resp.read()
    except urllib.error.HTTPError as e:
        if e.code == 404:
            print(f"RFC {rfc_number} not found on rfc-editor.org.", file=sys.stderr)
        else:
            print(f"HTTP error {e.code} fetching RFC {rfc_number}.", file=sys.stderr)
        return None
    except (urllib.error.URLError, TimeoutError, OSError) as e:
        print(f"Could not reach rfc-editor.org: {e}", file=sys.stderr)
        return None

    # Ensure cache directory exists
    cache_dir.mkdir(parents=True, exist_ok=True)

    # Write to cache
    with open(cached_path, "wb") as f:
        f.write(content)

    print(f"Downloaded: {cached_path}")
    return cached_path


def main():
    parser = argparse.ArgumentParser(
        description="Download RFC documents from rfc-editor.org with local caching",
        epilog="Examples:\n"
               "  rfc-fetch.py 8446              # Download RFC 8446 (TLS 1.3)\n"
               "  rfc-fetch.py 9110 --format html # Download HTML version\n"
               "  rfc-fetch.py 8446 --info        # Show metadata only\n"
               "  rfc-fetch.py 9000 --force        # Re-download even if cached\n",
        formatter_class=argparse.RawDescriptionHelpFormatter,
    )
    parser.add_argument("rfc_number", type=int, help="RFC number to fetch")
    parser.add_argument(
        "--format",
        choices=["text", "html"],
        default="text",
        help="Download format (default: text)",
    )
    parser.add_argument("--force", action="store_true", help="Re-download even if cached")
    parser.add_argument("--cache-dir", type=Path, help="Cache directory (default: ../data/cache/)")
    parser.add_argument("--info", action="store_true", help="Show metadata from built-in index without downloading")

    args = parser.parse_args()

    # Resolve paths relative to script location
    script_dir = Path(__file__).resolve().parent
    index_path = script_dir / ".." / "data" / "rfc-index.yaml"
    cache_dir = args.cache_dir or (script_dir / ".." / "data" / "cache")

    index = load_index(index_path)

    if args.info:
        show_info(args.rfc_number, index)
        return

    # Warn if RFC is obsolete
    rfc_meta = index.get(args.rfc_number)
    if rfc_meta:
        obsoleted_by = rfc_meta.get("obsoleted_by", [])
        if obsoleted_by:
            replacements = ", ".join(f"RFC {n}" for n in obsoleted_by)
            print(f"Warning: RFC {args.rfc_number} is obsoleted by {replacements}", file=sys.stderr)

    result = fetch_rfc(args.rfc_number, args.format, cache_dir, args.force)
    if result is None:
        sys.exit(1)


if __name__ == "__main__":
    main()
