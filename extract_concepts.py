#!/usr/bin/env python3
"""Extract named entities/concepts from the research corpus.

Regex-based extraction from page titles, headings, and content.
Populates artemis.concepts and artemis.concept_refs tables.

Usage:
  python3 extract_concepts.py              # Full extraction
  python3 extract_concepts.py --stats-only # Just print concept stats
  python3 extract_concepts.py --dry-run    # Extract but don't write to DB
"""

import re
import sys
import time
import argparse
from collections import Counter, defaultdict

import psycopg2

DB_DSN = "host=localhost dbname=tibsfox user=postgres password=foxyuw5,&%cM#(C3"

# ─── Concept Extraction Patterns ──────────────────────────────────────────────
# Each pattern: (category, compiled_regex)
# Order matters — first match wins for categorization

TECHNOLOGY_NAMES = [
    # Databases & data
    'PostgreSQL', 'pgvector', 'SQLite', 'MongoDB', 'Redis', 'MySQL', 'DynamoDB',
    'Elasticsearch', 'FlatBuffers', 'Protocol Buffers', 'Apache Kafka',
    # Languages & runtimes
    'TypeScript', 'JavaScript', 'Python', 'Rust', 'GLSL', 'CUDA', 'C\\+\\+',
    'WebAssembly', 'WASM', 'LaTeX', 'Markdown', 'HTML', 'CSS', 'JSON', 'YAML',
    'Unison',
    # Frameworks & tools
    'Tauri', 'Vite', 'Vitest', 'React', 'Vue', 'Node\\.js', 'npm', 'Docker',
    'Kubernetes', 'Terraform', 'Ansible', 'Prometheus', 'Grafana',
    'Blender', 'Ableton Live', 'Ableton', 'FL Studio', 'Pro Tools',
    'PyTorch', 'TensorFlow', 'scikit-learn', 'NumPy', 'SciPy', 'Pandas',
    'NetworkX', 'sentence-transformers', 'Hugging Face',
    'Git', 'GitHub', 'GitHub Actions', 'Claude Code', 'Claude',
    'OpenTelemetry', 'ArgoCD', 'Flux',
    # Hardware & systems
    'NVIDIA', 'RTX 4060', 'RTX', 'GPU', 'FPGA', 'Arduino', 'Raspberry Pi',
    'x86', 'ARM', 'RISC-V',
    # Protocols & standards
    'TCP/IP', 'HTTP', 'HTTPS', 'DNS', 'FTP', 'SSH', 'MQTT', 'WebSocket',
    'REST', 'GraphQL', 'gRPC',
    # Audio & broadcast
    'FM', 'AM Radio', 'DAB', 'METAR', 'NWS', 'NOAA', 'USGS', 'CWOP', 'NDBC',
]

MATH_CONCEPTS = [
    # Named after people
    'Kuramoto', 'Mandelbrot', 'Shannon', 'Fourier', 'Euler', 'Gauss',
    'Riemann', 'Erdos', 'Sophie Germain', 'Ramanujan', 'Turing',
    'Lotka-Volterra', 'Navier-Stokes', 'Louvain', 'PageRank', 'Nyquist',
    'Boltzmann', 'Poisson', 'Lagrange', 'Hamilton', 'Jacobi',
    'Cauchy', 'Hilbert', 'Fermat', 'Fibonacci', 'Galois',
    'Nash', 'Von Neumann', 'Montgomery-Dyson', 'Wiener',
    # Mathematical objects & fields
    'Riemann Hypothesis', 'Riemann zeta', 'zeta function',
    'eigenvalue', 'eigenvector', 'holomorphic', 'conformal mapping',
    'complex plane', 'unit circle', 'Mandelbrot set', 'Julia set',
    'fractal', 'chaos theory', 'dynamical system',
    'Fourier transform', 'FFT', 'wavelet',
    'differential equation', 'PDE', 'ODE',
    'Monte Carlo', 'Markov chain', 'Bayesian',
    'PageRank', 'graph theory', 'network theory',
    'information theory', 'entropy', 'signal processing',
    'cryptography', 'RSA', 'elliptic curve',
    'topology', 'manifold', 'group theory',
    'number theory', 'prime number', 'twin prime',
    'linear algebra', 'matrix', 'tensor',
    'Game of Life', 'cellular automaton',
    'synchronization', 'oscillator', 'resonance',
    'KPZ equation', 'percolation', 'random walk',
]

PLACE_NAMES = [
    # PNW & local
    'Mukilteo', 'Seattle', 'Everett', 'Bellingham', 'Bothell', 'Kirkland',
    'Tacoma', 'Olympia', 'Portland', 'Paine Field', 'Whidbey Island',
    'San Juan Islands', 'Olympic Peninsula', 'Puget Sound', 'Lake Washington',
    'Ballard Locks', 'Mount Rainier', 'Mount Baker', 'Cascade Range',
    'Pacific Northwest', 'PNW', 'Snohomish County', 'King County',
    'Whatcom County', 'Skagit Valley',
    # California & West Coast
    'Silicon Valley', 'San Francisco', 'Bay Area', 'Los Angeles',
    'Moffett Field',
    # Space & science locations
    'Kennedy Space Center', 'Cape Canaveral', 'NASA Ames',
    'Johnson Space Center', 'Jet Propulsion Laboratory', 'JPL',
    'Van Allen Belt', 'Van Allen',
    'CERN', 'Large Hadron Collider', 'LHC',
    # Cultural
    'Black Rock City', 'Burning Man',
    'Athens GA', 'Nashville', 'Muscle Shoals',
]

SPECIES_PATTERNS = [
    # Bird families
    r"(?:Tundra |Trumpeter )Swan",
    r"(?:Bald |Golden )Eagle",
    r"(?:Great Blue |Green )Heron",
    r"(?:Townsend's |Wilson's |Yellow-rumped )?Warbler",
    r"(?:Red-tailed |Cooper's |Sharp-shinned )?Hawk",
    r"(?:Barred |Great Horned |Snowy |Northern Spotted )?Owl",
    r"(?:Rufous |Anna's )?Hummingbird",
    r"(?:Steller's |Blue |Gray )Jay",
    r"(?:Northern |Red-shafted )?Flicker",
    r"(?:American |Pacific )?Robin",
    r"(?:Black-capped |Chestnut-backed )?Chickadee",
    r"(?:Red-breasted |White-breasted )?Nuthatch",
    r"Dark-eyed Junco",
    r"Spotted Towhee",
    r"Song Sparrow",
    r"House Finch",
    r"Cedar Waxwing",
    r"Belted Kingfisher",
    r"Peregrine Falcon",
    r"Osprey",
    r"Common Loon",
    r"Pigeon Guillemot",
    r"Rhinoceros Auklet",
    # Mammals
    r"(?:Black |Grizzly )Bear",
    r"(?:Mountain Lion|Cougar|Puma)",
    r"(?:Mule |Black-tailed |White-tailed )Deer",
    r"(?:Gray |Red )Fox",
    r"Coyote",
    r"River Otter",
    r"Harbor Seal",
    r"Orca",
    r"(?:Gray |Humpback |Blue )Whale",
    r"Douglas Squirrel",
    # Trees & plants
    r"Douglas[- ]?[Ff]ir",
    r"Western Red Cedar",
    r"Sitka Spruce",
    r"Big[- ]?leaf Maple",
    r"Red Alder",
    r"Pacific Madrone",
    r"Salal",
    r"Oregon Grape",
    r"Sword Fern",
    # Insects & pollinators
    r"(?:Mason |Bumble|Honey) ?[Bb]ee",
    r"Monarch Butterfly",
]

PEOPLE = [
    # NASA & space
    'Katherine Johnson', 'Ed Dwight', 'Andre Douglas',
    'Reid Wiseman', 'Victor Glover', 'Christina Koch',
    'Jeremy Hansen', 'Buzz Aldrin', 'Neil Armstrong',
    'Sally Ride', 'Mae Jemison', 'John Glenn',
    'Wernher von Braun', 'Robert Goddard',
    # Scientists & mathematicians
    'Albert Einstein', 'Isaac Newton', 'Alan Turing',
    'Ada Lovelace', 'Emmy Noether', 'Paul Erdos',
    'Benoit Mandelbrot', 'Claude Shannon', 'John Nash',
    'Leonhard Euler', 'Carl Friedrich Gauss', 'Bernhard Riemann',
    'Sophie Germain', 'Srinivasa Ramanujan', 'Pierre-Simon Laplace',
    'Richard Feynman', 'Marie Curie', 'Rosalind Franklin',
    # Cultural
    'Bill Nye', 'Bob Marley', 'Death Cab for Cutie',
    'Eric Schwartz', 'Bob Ross',
    # Tech
    'Linus Torvalds', 'Dennis Ritchie', 'Ken Thompson',
]

PROJECT_CODES = [
    # 3-letter research codes (extracted from category data)
    'GSD', 'HPC', 'GPE', 'SAA', 'MUS', 'OOPS', 'HEL',
    'BEE', 'CSP', 'VAV', 'ECO', 'SPS', 'MUK',
    'SET', 'HFE', 'NASA', 'CERN', 'AVI', 'MAM',
    'BRC', 'SYS', 'CGI', 'PKD', 'SFH', 'SMP',
    'BLN', 'AGR', 'COL', 'KFU', 'RFC',
    # Named projects
    'Rosetta Core', 'Artemis II', 'Artemis', 'Apollo',
    'PNW Research Series', 'Seattle 360',
    'GSD-OS', 'gsd-skill-creator', 'Math Co-Processor',
    'Constellation Map', 'Constellation Sphere',
    'SETI', 'Drake Equation',
]

# ─── Canonicalization ─────────────────────────────────────────────────────────

# Merge rules: variant -> canonical form
CANONICAL_MAP = {
    'pnw': 'Pacific Northwest',
    'pacific northwest': 'Pacific Northwest',
    'jpl': 'Jet Propulsion Laboratory',
    'jet propulsion laboratory': 'Jet Propulsion Laboratory',
    'lhc': 'Large Hadron Collider',
    'large hadron collider': 'Large Hadron Collider',
    'ksc': 'Kennedy Space Center',
    'kennedy space center': 'Kennedy Space Center',
    'fft': 'Fourier transform',
    'fourier transform': 'Fourier transform',
    'ode': 'differential equation',
    'pde': 'differential equation',
    'paul erdos': 'Paul Erdos',
    'erdos': 'Paul Erdos',
    'benoit mandelbrot': 'Benoit Mandelbrot',
    'mandelbrot': 'Benoit Mandelbrot',
    'claude shannon': 'Claude Shannon',
    'shannon': 'Claude Shannon',
    'riemann hypothesis': 'Riemann Hypothesis',
    'riemann zeta': 'Riemann Hypothesis',
    'zeta function': 'Riemann Hypothesis',
    'sophie germain': 'Sophie Germain',
    'leonhard euler': 'Leonhard Euler',
    'euler': 'Leonhard Euler',
    'carl friedrich gauss': 'Carl Friedrich Gauss',
    'gauss': 'Carl Friedrich Gauss',
    'bernhard riemann': 'Bernhard Riemann',
    'riemann': 'Bernhard Riemann',
    'srinivasa ramanujan': 'Srinivasa Ramanujan',
    'ramanujan': 'Srinivasa Ramanujan',
    'lotka-volterra': 'Lotka-Volterra model',
    'kuramoto': 'Kuramoto model',
    'burning man': 'Black Rock City',
    'black rock city': 'Black Rock City',
    'node.js': 'Node.js',
    'node js': 'Node.js',
    'c++': 'C++',
    'wasm': 'WebAssembly',
    'webassembly': 'WebAssembly',
    'van allen belt': 'Van Allen Belt',
    'van allen': 'Van Allen Belt',
    'pagerank': 'PageRank',
    'artemis': 'Artemis II',
    'artemis ii': 'Artemis II',
    'monte carlo': 'Monte Carlo',
    'bayesian': 'Bayesian inference',
    'orca': 'Orca',
    'harbor seal': 'Harbor Seal',
    'matrix': 'matrix',
    'rsa': 'RSA cryptography',
    'fft': 'Fast Fourier Transform',
    'gsd': 'GSD',
    'sps': 'SPS',
    'muk': 'MUK',
    'fm': 'FM radio',
}


def canonicalize(name):
    """Normalize a concept name to its canonical form."""
    key = name.lower().strip()
    # Strip trailing punctuation
    key = re.sub(r'[.,;:!?\s]+$', '', key)
    # Check canonical map
    if key in CANONICAL_MAP:
        return CANONICAL_MAP[key]
    # Capitalize properly for display if no canonical mapping
    return name.strip()


def deduplicate_concepts(raw_concepts):
    """Merge variants into canonical forms. Returns {canonical_name: (category, set_of_page_ids)}."""
    merged = {}
    for name, category, page_id, ref_type in raw_concepts:
        canonical = canonicalize(name)
        if canonical not in merged:
            merged[canonical] = {'category': category, 'refs': []}
        merged[canonical]['refs'].append((page_id, ref_type))
    return merged


# ─── Extraction Engine ────────────────────────────────────────────────────────

def build_regex_patterns():
    """Compile all extraction patterns into categorized regex."""
    patterns = []

    # Technology — word-boundary exact match
    for name in TECHNOLOGY_NAMES:
        pat = re.compile(r'\b' + name + r'\b', re.IGNORECASE)
        patterns.append(('technology', name, pat))

    # Math concepts
    for name in MATH_CONCEPTS:
        pat = re.compile(r'\b' + re.escape(name) + r'\b', re.IGNORECASE)
        patterns.append(('mathematics', name, pat))

    # Places
    for name in PLACE_NAMES:
        pat = re.compile(r'\b' + re.escape(name) + r'\b', re.IGNORECASE)
        patterns.append(('geography', name, pat))

    # Species (already regex patterns)
    for pat_str in SPECIES_PATTERNS:
        pat = re.compile(r'\b' + pat_str + r'\b')
        patterns.append(('ecology', pat_str, pat))

    # People
    for name in PEOPLE:
        pat = re.compile(r'\b' + re.escape(name) + r'\b', re.IGNORECASE)
        patterns.append(('person', name, pat))

    # Project codes — case-sensitive for short codes
    for name in PROJECT_CODES:
        if len(name) <= 4 and name.isupper():
            # Short uppercase codes: case-sensitive, word boundary
            pat = re.compile(r'\b' + re.escape(name) + r'\b')
        else:
            pat = re.compile(r'\b' + re.escape(name) + r'\b', re.IGNORECASE)
        patterns.append(('project', name, pat))

    return patterns


def extract_headings(content_text):
    """Extract H2/H3 heading text from raw content (already stripped of HTML in DB)."""
    # Content_text is already plain text — headings show up as prominent phrases
    # We can still look for section-header-like patterns
    # In the raw HTML content, headings would be tagged — but content_text is stripped
    # We'll use the full content_text for matching
    return content_text or ''


def extract_from_page(page_id, title, content_text, patterns):
    """Extract all concepts from a single page. Returns [(name, category, page_id, ref_type)]."""
    results = []
    seen = set()  # (canonical_name, page_id) dedup within page

    # Search title first (matches in title = 'definition' ref type)
    title_text = title or ''
    # Decode HTML entities in title
    title_text = title_text.replace('&mdash;', '—').replace('&amp;', '&')
    title_text = title_text.replace('&ndash;', '–').replace('&middot;', '·')

    for category, name, pat in patterns:
        m = pat.search(title_text)
        if m:
            matched_text = m.group(0)
            canonical = canonicalize(matched_text)
            key = (canonical.lower(), page_id)
            if key not in seen:
                seen.add(key)
                results.append((matched_text, category, page_id, 'definition'))

    # Search content (first 5000 chars for efficiency — matches = 'reference')
    body = (content_text or '')[:5000]
    body = body.replace('&mdash;', '—').replace('&amp;', '&')
    body = body.replace('&ndash;', '–').replace('&middot;', '·')

    for category, name, pat in patterns:
        m = pat.search(body)
        if m:
            matched_text = m.group(0)
            canonical = canonicalize(matched_text)
            key = (canonical.lower(), page_id)
            if key not in seen:
                seen.add(key)
                results.append((matched_text, category, page_id, 'reference'))

    return results


# ─── Database Operations ──────────────────────────────────────────────────────

def clear_existing(cur):
    """Clear existing concept data for fresh extraction."""
    cur.execute("DELETE FROM artemis.concept_refs")
    cur.execute("DELETE FROM artemis.concepts")
    print("Cleared existing concept data.")


def store_concepts(merged, cur):
    """Write concepts and refs to database."""
    concept_id_map = {}  # canonical_name -> concept_id

    # Insert concepts
    for name, data in merged.items():
        # Find the most common page that defines this concept (for canonical_page_id)
        definition_pages = [pid for pid, rt in data['refs'] if rt == 'definition']
        canonical_page_id = definition_pages[0] if definition_pages else None

        cur.execute("""
            INSERT INTO artemis.concepts (name, category, canonical_page_id)
            VALUES (%s, %s, %s)
            ON CONFLICT (name) DO UPDATE SET category = EXCLUDED.category,
                canonical_page_id = EXCLUDED.canonical_page_id
            RETURNING id
        """, (name, data['category'], canonical_page_id))
        concept_id_map[name] = cur.fetchone()[0]

    # Insert refs
    ref_count = 0
    for name, data in merged.items():
        cid = concept_id_map[name]
        # Deduplicate refs per (concept, page, ref_type)
        seen_refs = set()
        for page_id, ref_type in data['refs']:
            key = (cid, page_id, ref_type)
            if key not in seen_refs:
                seen_refs.add(key)
                cur.execute("""
                    INSERT INTO artemis.concept_refs (concept_id, page_id, ref_type)
                    VALUES (%s, %s, %s)
                    ON CONFLICT (concept_id, page_id, ref_type) DO NOTHING
                """, (cid, page_id, ref_type))
                ref_count += 1

    return len(concept_id_map), ref_count


def print_stats(cur):
    """Print concept extraction statistics."""
    cur.execute("SELECT count(*) FROM artemis.concepts")
    total = cur.fetchone()[0]
    print(f"\n{'='*60}")
    print(f"Concept Extraction Statistics")
    print(f"{'='*60}")
    print(f"  Total concepts: {total}")

    # By category
    cur.execute("""
        SELECT category, count(*) FROM artemis.concepts
        GROUP BY category ORDER BY count(*) DESC
    """)
    print(f"\n  By category:")
    for cat, cnt in cur.fetchall():
        print(f"    {cat or 'uncategorized':20s} {cnt:4d}")

    # Most-referenced concepts (highest page count)
    cur.execute("""
        SELECT c.name, c.category, count(DISTINCT cr.page_id) as page_count
        FROM artemis.concepts c
        JOIN artemis.concept_refs cr ON cr.concept_id = c.id
        GROUP BY c.id, c.name, c.category
        ORDER BY page_count DESC
        LIMIT 20
    """)
    print(f"\n  Top 20 most-referenced concepts:")
    for name, cat, cnt in cur.fetchall():
        print(f"    {cnt:4d} pages  [{cat:13s}]  {name}")

    # Orphan concepts (only 1 page)
    cur.execute("""
        SELECT count(*) FROM (
            SELECT c.id FROM artemis.concepts c
            JOIN artemis.concept_refs cr ON cr.concept_id = c.id
            GROUP BY c.id
            HAVING count(DISTINCT cr.page_id) = 1
        ) sub
    """)
    orphan_count = cur.fetchone()[0]
    print(f"\n  Orphan concepts (1 page only): {orphan_count}")

    # Total refs
    cur.execute("SELECT count(*) FROM artemis.concept_refs")
    ref_total = cur.fetchone()[0]
    cur.execute("SELECT ref_type, count(*) FROM artemis.concept_refs GROUP BY ref_type ORDER BY count(*) DESC")
    print(f"\n  Total concept refs: {ref_total}")
    for rt, cnt in cur.fetchall():
        print(f"    {rt:15s} {cnt:5d}")

    # Concepts per category with examples
    cur.execute("""
        SELECT c.category,
               array_agg(c.name ORDER BY (
                   SELECT count(*) FROM artemis.concept_refs cr WHERE cr.concept_id = c.id
               ) DESC)
        FROM artemis.concepts c
        GROUP BY c.category
        ORDER BY count(*) DESC
    """)
    print(f"\n  Category samples (top 5 each):")
    for cat, names in cur.fetchall():
        top5 = ', '.join(names[:5])
        print(f"    [{cat or 'uncategorized':13s}] {top5}")


# ─── Main ─────────────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(description="Extract concepts from research corpus")
    parser.add_argument("--stats-only", action="store_true", help="Just print stats")
    parser.add_argument("--dry-run", action="store_true", help="Extract but don't write")
    args = parser.parse_args()

    conn = psycopg2.connect(DB_DSN)
    conn.autocommit = False
    cur = conn.cursor()

    if args.stats_only:
        print_stats(cur)
        conn.close()
        return

    t0 = time.time()

    # Build patterns
    patterns = build_regex_patterns()
    print(f"Built {len(patterns)} extraction patterns across {len(set(p[0] for p in patterns))} categories")

    # Load all pages
    cur.execute("SELECT id, title, content_text FROM artemis.research_pages ORDER BY id")
    pages = cur.fetchall()
    print(f"Scanning {len(pages)} pages...")

    # Extract concepts from all pages
    all_raw = []
    pages_with_concepts = 0
    for page_id, title, content_text in pages:
        hits = extract_from_page(page_id, title, content_text, patterns)
        if hits:
            pages_with_concepts += 1
        all_raw.extend(hits)

    print(f"  Raw extractions: {len(all_raw)} from {pages_with_concepts}/{len(pages)} pages")

    # Deduplicate and canonicalize
    merged = deduplicate_concepts(all_raw)
    print(f"  Canonical concepts: {len(merged)}")

    if args.dry_run:
        # Print top concepts without writing
        counts = [(name, len(set(pid for pid, _ in data['refs'])), data['category'])
                   for name, data in merged.items()]
        counts.sort(key=lambda x: -x[1])
        print(f"\n  Top 30 concepts (dry run):")
        for name, cnt, cat in counts[:30]:
            print(f"    {cnt:4d} pages  [{cat:13s}]  {name}")
        conn.close()
        return

    # Clear and store
    clear_existing(cur)
    concept_count, ref_count = store_concepts(merged, cur)
    conn.commit()

    elapsed = time.time() - t0
    print(f"\nStored {concept_count} concepts with {ref_count} refs in {elapsed:.1f}s")

    # Print stats
    print_stats(cur)

    conn.close()


if __name__ == "__main__":
    main()
