#!/usr/bin/env python3
"""Parse RFC document structure, extract table of contents and RFC 2119 requirements."""

import argparse
import json
import re
import sys
from dataclasses import asdict, dataclass, field
from pathlib import Path


@dataclass
class Section:
    """Represents a section in an RFC document."""
    number: str
    title: str
    start_line: int
    end_line: int = 0
    level: int = 1


@dataclass
class Requirement:
    """Represents an RFC 2119 requirement keyword occurrence."""
    keyword: str
    text: str
    section: str
    line_number: int


@dataclass
class RFCMetadata:
    """Metadata extracted from RFC document header."""
    rfc_number: int = 0
    title: str = ""
    authors: list[str] = field(default_factory=list)
    date: str = ""
    status: str = ""
    abstract: str = ""


# RFC 2119 keywords (must appear in ALL CAPS in prose)
RFC2119_KEYWORDS = [
    "MUST NOT", "MUST", "SHALL NOT", "SHALL",
    "SHOULD NOT", "SHOULD", "NOT RECOMMENDED", "RECOMMENDED",
    "MAY", "OPTIONAL",
]

# Regex for RFC 2119 keywords (word boundary, case-sensitive for ALL CAPS)
RFC2119_PATTERN = re.compile(
    r'\b(' + '|'.join(re.escape(kw) for kw in RFC2119_KEYWORDS) + r')\b'
)

# Section number patterns
NUMBERED_SECTION_RE = re.compile(r'^(\d+(?:\.\d+)*\.?)\s+(.+)$')
APPENDIX_SECTION_RE = re.compile(r'^(Appendix\s+[A-Z](?:\.\d+)*\.?)\s*[:\-]?\s*(.+)$')


def extract_metadata(lines: list[str]) -> RFCMetadata:
    """Extract RFC metadata from document header."""
    meta = RFCMetadata()

    # Find RFC number from header (usually in first 10-30 lines)
    for line in lines[:30]:
        # Match "Request for Comments: NNNN" (common in older RFCs)
        m = re.search(r'Request for Comments:\s*(\d+)', line)
        if m:
            meta.rfc_number = int(m.group(1))
            break
        # Match "RFC NNNN" in header lines
        m = re.search(r'RFC\s+(\d+)', line)
        if m:
            meta.rfc_number = int(m.group(1))
            break

    # Extract title -- usually the centered text after the header block
    # Look for lines that are centered (have leading whitespace) and not author/date info
    in_header = True
    title_lines = []
    blank_count = 0
    for i, line in enumerate(lines[:60]):
        stripped = line.strip()
        if not stripped:
            blank_count += 1
            if blank_count >= 2 and title_lines:
                break
            continue
        if in_header and (
            stripped.startswith("Request for Comments:")
            or stripped.startswith("Category:")
            or stripped.startswith("ISSN:")
            or stripped.startswith("Obsoletes:")
            or stripped.startswith("Updates:")
            or stripped.startswith("STD:")
            or stripped.startswith("BCP:")
            or re.match(r'^(Internet Engineering|Network Working Group)', stripped)
        ):
            continue
        # Check for author lines (right-aligned or containing org names)
        if len(line) > 0 and (
            len(line) - len(line.lstrip()) > 40
            or re.match(r'^\s{30,}', line)
        ):
            # Right-aligned text is typically author/date info
            author_candidate = stripped
            if re.match(r'^[A-Z][a-z]+.*\d{4}$', author_candidate):
                meta.date = re.search(r'(\w+\s+\d{4})$', author_candidate).group(1) if re.search(r'(\w+\s+\d{4})$', author_candidate) else ""
            elif not re.match(r'^\d', author_candidate):
                meta.authors.append(author_candidate)
            continue
        # Potential title line
        if stripped and not stripped.startswith("Status of") and not stripped.startswith("Copyright"):
            in_header = False
            title_lines.append(stripped)
            blank_count = 0

    if title_lines:
        meta.title = " ".join(title_lines)

    # Extract abstract
    abstract_lines = []
    in_abstract = False
    for i, line in enumerate(lines):
        stripped = line.strip()
        if stripped.lower() == "abstract" or stripped == "Abstract":
            in_abstract = True
            continue
        if in_abstract:
            if not stripped:
                if abstract_lines:
                    # Check if next non-blank line is a section header
                    for j in range(i + 1, min(i + 3, len(lines))):
                        next_stripped = lines[j].strip()
                        if next_stripped and (
                            NUMBERED_SECTION_RE.match(next_stripped)
                            or next_stripped.startswith("Table of Contents")
                            or next_stripped == "Status of This Memo"
                        ):
                            in_abstract = False
                            break
                    if not in_abstract:
                        break
                continue
            if (
                NUMBERED_SECTION_RE.match(stripped)
                or stripped.startswith("Table of Contents")
                or stripped == "Status of This Memo"
                or stripped.startswith("Copyright Notice")
            ):
                break
            abstract_lines.append(stripped)

    meta.abstract = " ".join(abstract_lines) if abstract_lines else ""

    # Extract status from "Status of This Memo" or "Category:" line
    for line in lines[:30]:
        stripped = line.strip()
        if stripped.startswith("Category:"):
            meta.status = stripped.split(":", 1)[1].strip()
            break

    return meta


def extract_sections(lines: list[str]) -> list[Section]:
    """Extract section structure from RFC text."""
    sections = []
    # Skip lines until we get past the header/ToC
    # Find the actual content start (after "Table of Contents" or first numbered section)
    content_start = 0
    toc_found = False
    for i, line in enumerate(lines):
        stripped = line.strip()
        if stripped == "Table of Contents" or stripped.startswith("Table of Contents"):
            toc_found = True
            continue
        if toc_found and NUMBERED_SECTION_RE.match(stripped):
            # We're still in the ToC if lines have page numbers (dots followed by digits)
            if re.search(r'\.{2,}\s*\d+\s*$', stripped):
                continue
            else:
                content_start = i
                break

    if not toc_found:
        content_start = 0

    for i in range(content_start, len(lines)):
        line = lines[i]
        stripped = line.strip()
        if not stripped:
            continue

        # Skip page headers/footers (lines with [Page N] or form feeds)
        if re.match(r'^\[Page \d+\]', stripped) or '\f' in line:
            continue

        # Check for numbered section
        m = NUMBERED_SECTION_RE.match(stripped)
        if m:
            number = m.group(1).rstrip(".")
            title = m.group(2).strip()
            # Skip if this looks like a ToC entry (has dots + page number)
            if re.search(r'\.{2,}\s*\d+\s*$', title):
                continue
            # Skip if title is too long (likely not a real section header)
            if len(title) > 100:
                continue
            level = number.count(".") + 1
            sections.append(Section(
                number=number,
                title=title,
                start_line=i + 1,  # 1-based
                level=level,
            ))
            continue

        # Check for appendix section
        m = APPENDIX_SECTION_RE.match(stripped)
        if m:
            number = m.group(1)
            title = m.group(2).strip()
            if re.search(r'\.{2,}\s*\d+\s*$', title):
                continue
            level = 1 + number.count(".")
            sections.append(Section(
                number=number,
                title=title,
                start_line=i + 1,
                level=level,
            ))

    # Set end_line for each section (start of next section)
    for i in range(len(sections) - 1):
        sections[i].end_line = sections[i + 1].start_line - 1
    if sections:
        sections[-1].end_line = len(lines)

    return sections


def extract_requirements(lines: list[str], sections: list[Section]) -> list[Requirement]:
    """Extract RFC 2119 keyword occurrences with section context."""
    requirements = []

    # Identify boilerplate sections to skip (where keywords are defined)
    skip_sections = set()
    for sec in sections:
        title_lower = sec.title.lower()
        if any(term in title_lower for term in [
            "key words", "terminology", "conventions used",
            "requirements language", "requirements notation",
        ]):
            skip_sections.add(sec.number)

    # Also skip ToC region
    toc_start = 0
    toc_end = 0
    for i, line in enumerate(lines):
        stripped = line.strip()
        if stripped == "Table of Contents" or stripped.startswith("Table of Contents"):
            toc_start = i
        if toc_start and not toc_end:
            # ToC ends when we hit first real section content
            if i > toc_start + 2 and NUMBERED_SECTION_RE.match(stripped):
                if not re.search(r'\.{2,}\s*\d+\s*$', stripped):
                    toc_end = i
                    break

    def find_section(line_num: int) -> str:
        """Find which section a line belongs to."""
        for sec in reversed(sections):
            if line_num >= sec.start_line:
                return sec.number
        return "0"

    for i, line in enumerate(lines):
        # Skip ToC region
        if toc_start <= i <= toc_end:
            continue

        stripped = line.strip()
        if not stripped:
            continue

        # Find all RFC 2119 keywords in this line
        for m in RFC2119_PATTERN.finditer(stripped):
            keyword = m.group(1)
            section = find_section(i + 1)

            # Skip boilerplate sections
            if section in skip_sections:
                continue

            # Get the full sentence containing the keyword
            # Simple approach: use the whole line as context
            text = stripped

            requirements.append(Requirement(
                keyword=keyword,
                text=text,
                section=section,
                line_number=i + 1,
            ))

    return requirements


def format_text_output(
    meta: RFCMetadata,
    sections: list[Section],
    requirements: list[Requirement],
    sections_only: bool = False,
    requirements_only: bool = False,
) -> str:
    """Format parse results as text."""
    parts = []

    if not requirements_only:
        # Metadata
        parts.append(f"RFC {meta.rfc_number}: {meta.title}")
        if meta.status:
            parts.append(f"Status: {meta.status}")
        if meta.date:
            parts.append(f"Date: {meta.date}")
        parts.append("")

        # Table of Contents
        parts.append("Table of Contents")
        parts.append("-" * 40)
        for sec in sections:
            indent = "  " * (sec.level - 1)
            parts.append(f"{indent}{sec.number}. {sec.title}")
        parts.append("")

    if not sections_only:
        # Requirements
        parts.append("RFC 2119 Requirements")
        parts.append("-" * 40)
        if not requirements:
            parts.append("No RFC 2119 requirements found.")
        else:
            current_section = ""
            for req in requirements:
                if req.section != current_section:
                    current_section = req.section
                    # Find section title
                    sec_title = ""
                    for sec in sections:
                        if sec.number == current_section:
                            sec_title = sec.title
                            break
                    parts.append(f"\nSection {current_section}: {sec_title}")
                parts.append(f"  [{req.keyword}] (line {req.line_number}): {req.text}")

    return "\n".join(parts)


def format_json_output(
    meta: RFCMetadata,
    sections: list[Section],
    requirements: list[Requirement],
    sections_only: bool = False,
    requirements_only: bool = False,
) -> str:
    """Format parse results as JSON."""
    result: dict = {
        "rfc_number": meta.rfc_number,
        "title": meta.title,
        "status": meta.status,
        "date": meta.date,
        "authors": meta.authors,
        "abstract": meta.abstract,
    }

    if not requirements_only:
        result["sections"] = [asdict(s) for s in sections]

    if not sections_only:
        result["requirements"] = [asdict(r) for r in requirements]
        # Summary counts
        keyword_counts: dict[str, int] = {}
        for req in requirements:
            keyword_counts[req.keyword] = keyword_counts.get(req.keyword, 0) + 1
        result["requirement_summary"] = keyword_counts

    return json.dumps(result, indent=2)


def resolve_rfc_file(rfc_input: str, cache_dir: Path) -> Path | None:
    """Resolve an RFC file from a path or number."""
    # If it's a file path, use directly
    input_path = Path(rfc_input)
    if input_path.exists():
        return input_path

    # If it's a number, look in cache
    if rfc_input.isdigit():
        cached = cache_dir / f"rfc{rfc_input}.txt"
        if cached.exists():
            return cached

    return None


def main():
    parser = argparse.ArgumentParser(
        description="Parse RFC document structure and extract RFC 2119 requirements",
        epilog="Examples:\n"
               "  rfc-parse.py 2119                     # Parse cached RFC 2119\n"
               "  rfc-parse.py /path/to/rfc8446.txt     # Parse from file path\n"
               "  rfc-parse.py 9110 --format json        # JSON output\n"
               "  rfc-parse.py 8446 --sections-only      # ToC only\n"
               "  rfc-parse.py 9000 --requirements-only  # Requirements only\n",
        formatter_class=argparse.RawDescriptionHelpFormatter,
    )
    parser.add_argument("rfc_file_or_number", help="Path to RFC text file or RFC number (looks in cache)")
    parser.add_argument("--cache-dir", type=Path, help="Cache directory (default: ../data/cache/)")
    parser.add_argument(
        "--format",
        choices=["text", "json"],
        default="text",
        help="Output format (default: text)",
    )
    parser.add_argument("--sections-only", action="store_true", help="Only output table of contents")
    parser.add_argument("--requirements-only", action="store_true", help="Only output RFC 2119 requirements")

    args = parser.parse_args()

    # Resolve paths
    script_dir = Path(__file__).resolve().parent
    cache_dir = args.cache_dir or (script_dir / ".." / "data" / "cache")

    rfc_path = resolve_rfc_file(args.rfc_file_or_number, cache_dir)
    if rfc_path is None:
        print(f"Error: RFC file not found for '{args.rfc_file_or_number}'.", file=sys.stderr)
        print(f"Run: rfc-fetch.py {args.rfc_file_or_number} to download it first.", file=sys.stderr)
        sys.exit(1)

    # Read the RFC text
    with open(rfc_path, encoding="utf-8", errors="replace") as f:
        content = f.read()
    lines = content.splitlines()

    # Extract structure
    meta = extract_metadata(lines)
    sections = extract_sections(lines)
    requirements = extract_requirements(lines, sections)

    # Output
    if args.format == "text":
        print(format_text_output(meta, sections, requirements, args.sections_only, args.requirements_only))
    elif args.format == "json":
        print(format_json_output(meta, sections, requirements, args.sections_only, args.requirements_only))


if __name__ == "__main__":
    main()
