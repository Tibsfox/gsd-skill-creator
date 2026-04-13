#!/usr/bin/env python3
"""Research Discovery Engine — automated content scanning for the research queue.

Checks 4 sources on a 6-hour cadence:
  1. YouTube channels (31 tracked) — new uploads since last check
  2. arXiv papers — keyword search across relevant categories
  3. Hacker News — front page items matching research domains
  4. Google Scholar — citation alerts for key tracked papers

Discovered items are written to RESEARCH-QUEUE.md as DISCOVERED status,
awaiting human promotion to QUEUED during the next session.

Usage:
  python3 discovery_engine.py                 # Run all sources
  python3 discovery_engine.py --youtube       # YouTube only
  python3 discovery_engine.py --arxiv         # arXiv only
  python3 discovery_engine.py --hn            # Hacker News only
  python3 discovery_engine.py --scholar       # Google Scholar only
  python3 discovery_engine.py --dry-run       # Show discoveries without writing
  python3 discovery_engine.py --status        # Show last run stats
"""

import os
import sys
import json
import re
import subprocess
import argparse
from datetime import datetime, timezone, timedelta
from urllib.request import urlopen, Request
from urllib.error import URLError
from urllib.parse import quote_plus

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
STATE_FILE = os.path.join(BASE_DIR, '.discovery-state.json')
QUEUE_FILE = os.path.join(BASE_DIR, '.planning', 'RESEARCH-QUEUE.md')

# ── v2 feature gate (Phase 7) ──
# All Phase 1-6 behaviors (phrase-quoting, all-tokens relevance, two-lane,
# embedding re-ranker, coherence filter, URL snapshot) are gated on this
# env flag. Default off means the script behaves identically to pre-fix
# until explicitly enabled via `DISCOVERY_V2=1`.
DISCOVERY_V2 = os.environ.get('DISCOVERY_V2', '0') == '1'
SUPPLEMENTAL_MIN_COSINE = float(os.environ.get('DISCOVERY_MIN_COSINE', '0.35'))
SNAPSHOT_DIR = os.path.join(BASE_DIR, '.discovery-snapshots')


def _phrase_query(query: str) -> str:
    """Phase 1: wrap multi-word queries in literal quotes for arXiv.
    Single-word queries pass through unchanged. Returns the raw (un-encoded)
    query string; callers should quote_plus() the result before inlining
    into a URL, which preserves the quotes as %22."""
    q = query.strip()
    if ' ' in q:
        return f'"{q}"'
    return q

# ── YouTube Channels ──

YOUTUBE_CHANNELS = [
    ("AgenticAI-Foundation", "Agent architecture", "HIGH"),
    ("NASA", "Space/Missions", "CRITICAL"),
    ("OWASPGLOBAL", "Application security", "HIGH"),
    ("EngineeringTheCurriculum", "Engineering education", "HIGH"),
    ("TheFutureOfPLM", "Product lifecycle", "MEDIUM-HIGH"),
    ("christiankastner6150", "SE for AI/ML", "MEDIUM-HIGH"),
    ("Asianometry", "Tech/hardware deep dives", "HIGH"),
    ("CppCon", "C++ / Systems", "MEDIUM"),
    ("NRCgovVideo", "Nuclear energy/safety", "MEDIUM"),
    ("DataVerse_Hub", "Data science", "MEDIUM"),
    ("QHSETalks", "Quality/Safety", "MEDIUM"),
    ("NetSec-Academy", "Network security", "MEDIUM"),
    ("IoTSecurityFoundation-TV", "IoT security", "MEDIUM"),
    ("BrownSPS", "Professional education", "MEDIUM"),
]

# Minimum duration (seconds) to filter out shorts/clips
MIN_DURATION_S = 300  # 5 minutes

# ── arXiv Search ──
# NOTE: Queries use ti+abs (title + abstract only) to avoid full-text false positives.
# Each query includes relevance keywords that MUST appear in title or abstract.

ARXIV_QUERIES = [
    ("agent orchestration", "cs.AI", ["agent", "orchestrat"]),
    ("MCP server security", "cs.CR", ["MCP", "model context protocol", "tool poison", "agent"]),
    ("biological nitrogen fixation", "q-bio.MN", ["nitrogen", "fixation", "ammonia", "nitrogenase"]),
    ("green ammonia electrolysis", "physics.chem-ph", ["ammonia", "electrolysis", "green ammonia", "nitrogen reduction"]),
    ("multimodal evaluation benchmark", "cs.CV", ["multimodal", "vision-language", "VLM", "visual question"]),
    ("code generation agents", "cs.SE", ["code generat", "coding agent", "software agent", "LLM code"]),
    ("process maturity CMMI", "cs.SE", ["CMMI", "process maturity", "software process", "quality assurance"]),
    ("struvite phosphorus recovery", "physics.chem-ph", ["phosphorus", "struvite", "nutrient recovery", "wastewater"]),
    ("vertical farming energy", "physics.app-ph", ["vertical farm", "indoor agriculture", "LED grow", "hydroponic", "controlled environment"]),
    ("LLM hallucination detection", "cs.CL", ["hallucination", "LLM", "language model", "factual"]),
    # Astrophysics — Artemis II mission context, always track
    ("lunar mission radiation", "astro-ph.EP", ["lunar", "moon", "radiation", "artemis", "cislunar", "Van Allen"]),
    ("space weather solar", "astro-ph.SR", ["solar wind", "coronal mass", "geomagnetic", "space weather", "solar flare"]),
    ("crewed spaceflight", "astro-ph.IM", ["crewed", "human spaceflight", "life support", "reentry", "splashdown", "crew"]),
    ("exoplanet habitability", "astro-ph.EP", ["habitability", "exoplanet", "biosignature", "atmosphere", "JWST"]),
    ("galaxy formation evolution", "astro-ph.GA", ["galaxy", "formation", "evolution", "dark matter", "cosmolog"]),
]

ARXIV_MAX_RESULTS = 5  # per query
ARXIV_DAYS_BACK = 7    # only papers from last N days

# arXiv RSS feeds — new submissions across key categories
# These track the "recent" listings (https://arxiv.org/list/*/recent)
# Broader net than keyword queries — catches papers we wouldn't have searched for
ARXIV_RSS_FEEDS = [
    ("astro-ph", "Astrophysics (all)", ["lunar", "moon", "solar", "galaxy", "exoplanet", "radiation", "spaceflight", "orbit", "reentry", "JWST", "Webb", "Artemis"]),
    ("astro-ph.EP", "Earth & Planetary Astrophysics", ["lunar", "moon", "habitab", "atmosphere", "biosignature", "asteroid", "comet"]),
    ("astro-ph.SR", "Solar & Stellar Astrophysics", ["solar wind", "coronal", "flare", "magnetosphere", "heliosphere", "space weather"]),
    ("cs.AI", "Artificial Intelligence", ["agent", "orchestrat", "MCP", "tool use", "reasoning", "planning", "memory"]),
    ("cs.CR", "Cryptography & Security", ["MCP", "agent", "supply chain", "LLM", "poison", "injection"]),
    ("cs.SE", "Software Engineering", ["code generat", "agent", "testing", "review", "LLM"]),
]

# ── Hacker News ──

HN_KEYWORDS = [
    "claude", "anthropic", "mcp server", "agent orchestration",
    "nitrogen fixation", "phosphorus", "green ammonia",
    "VLIW", "compiler", "RISC-V",
    "vertical farming", "regenerative agriculture",
    "multimodal", "hallucination", "benchmark",
    "systems engineering", "SOP", "configuration management",
]

HN_MIN_SCORE = 50  # minimum points to consider

# ── Google Scholar (tracked papers) ──

SCHOLAR_TRACKED = [
    ("Holt-Lunstad 2024", "social connection critical factor mental physical health"),
    ("Cordell 2009", "story phosphorus global food security"),
    ("MIRAGE 2026", "illusion visual understanding mirage"),
    ("Suryanto 2021", "lithium mediated nitrogen reduction"),
]


def load_state():
    if os.path.exists(STATE_FILE):
        with open(STATE_FILE) as f:
            return json.load(f)
    return {
        'last_run': None,
        'last_youtube_check': None,
        'last_arxiv_check': None,
        'last_hn_check': None,
        'last_scholar_check': None,
        'seen_youtube_ids': [],
        'seen_arxiv_ids': [],
        'seen_hn_ids': [],
        'total_discovered': 0,
        'runs': 0,
    }


def save_state(state):
    state['last_run'] = datetime.now(timezone.utc).isoformat()
    tmp = STATE_FILE + '.tmp'
    with open(tmp, 'w') as f:
        json.dump(state, f, indent=2)
    os.replace(tmp, STATE_FILE)


def get_next_queue_number():
    """Parse RESEARCH-QUEUE.md to find the highest item number."""
    if not os.path.exists(QUEUE_FILE):
        return 46
    with open(QUEUE_FILE) as f:
        content = f.read()
    numbers = re.findall(r'^\|\s*(\d+)\s*\|', content, re.MULTILINE)
    if numbers:
        return max(int(n) for n in numbers) + 1
    return 46


def append_to_queue(items, dry_run=False):
    """Append discovered items to RESEARCH-QUEUE.md."""
    if not items:
        return 0

    if not os.path.exists(QUEUE_FILE):
        print("  WARNING: RESEARCH-QUEUE.md not found")
        return 0

    next_num = get_next_queue_number()
    lines = []

    for i, item in enumerate(items):
        num = next_num + i
        title = item['title'][:80]
        duration = item.get('duration', 'paper')
        vid_id = item.get('id', item.get('url', 'N/A'))
        domain = item.get('domain', 'Unknown')
        status = f"DISCOVERED — {item.get('summary', 'awaiting review')}"
        lines.append(f"| {num} | {title} | {duration} | {vid_id} | {domain} | {status} |")

    if dry_run:
        print(f"\n  Would append {len(lines)} items to queue (#{next_num}-{next_num + len(lines) - 1}):")
        for line in lines:
            print(f"    {line}")
        return len(lines)

    with open(QUEUE_FILE, 'r') as f:
        content = f.read()

    # Find the last table row before ## Channel Sources Summary
    insert_point = content.find('\n## Channel Sources Summary')
    if insert_point == -1:
        # Fallback: append before last empty line
        insert_point = content.rfind('\n\n')
    if insert_point == -1:
        insert_point = len(content)

    new_content = content[:insert_point] + '\n' + '\n'.join(lines) + content[insert_point:]

    with open(QUEUE_FILE, 'w') as f:
        f.write(new_content)

    print(f"  Appended {len(lines)} items to queue (#{next_num}-{next_num + len(lines) - 1})")
    return len(lines)


# ── Source: YouTube ──

def check_youtube(state, dry_run=False):
    """Check tracked YouTube channels for new uploads."""
    print("\n=== YouTube Channel Check ===")
    seen = set(state.get('seen_youtube_ids', []))
    discoveries = []

    for channel, domain, priority in YOUTUBE_CHANNELS:
        try:
            result = subprocess.run(
                ['yt-dlp', '--flat-playlist', '--print',
                 '%(id)s\t%(title)s\t%(duration)s',
                 f'https://www.youtube.com/@{channel}/videos',
                 '--playlist-end', '3'],
                capture_output=True, text=True, timeout=30
            )
            if result.returncode != 0:
                continue

            for line in result.stdout.strip().split('\n'):
                if not line.strip():
                    continue
                parts = line.split('\t')
                if len(parts) < 3:
                    continue
                vid_id, title, duration_s = parts[0], parts[1], parts[2]

                if vid_id in seen:
                    continue

                # Filter shorts
                try:
                    dur = int(float(duration_s)) if duration_s != 'NA' else 0
                except (ValueError, TypeError):
                    dur = 0

                if dur < MIN_DURATION_S and dur > 0:
                    seen.add(vid_id)
                    continue

                dur_str = f"{dur // 60}m" if dur > 0 else "unknown"

                discoveries.append({
                    'title': f"{title} — {channel}",
                    'duration': dur_str,
                    'id': vid_id,
                    'domain': domain,
                    'summary': f"New upload from @{channel} ({priority} priority)",
                    'source': 'youtube',
                    'priority': priority,
                })
                seen.add(vid_id)
                print(f"  NEW: @{channel} — {title} ({dur_str})")

        except subprocess.TimeoutExpired:
            print(f"  TIMEOUT: @{channel}")
        except Exception as e:
            print(f"  ERROR: @{channel}: {e}")

    state['seen_youtube_ids'] = list(seen)[-500:]  # keep last 500
    state['last_youtube_check'] = datetime.now(timezone.utc).isoformat()
    print(f"  Checked {len(YOUTUBE_CHANNELS)} channels, found {len(discoveries)} new videos")
    return discoveries


# ── Source: arXiv ──

def _relevance_check(title, abstract, keywords):
    """Check if title or abstract contains a relevance keyword.
    In legacy mode (DISCOVERY_V2=0): returns the first matched keyword
    or None if no keyword is present (one-of-many).
    Returns the matched keyword or None if no match."""
    text = (title + ' ' + abstract).lower()
    for kw in keywords:
        if kw.lower() in text:
            return kw
    return None


def _relevance_check_all_tokens(title, abstract, category, query):
    """Phase 2 (v2): strict filter — ALL query tokens must appear in the
    combined title+abstract+category text. Case-insensitive substring
    match per token. Returns the query string on success or None on
    failure. Empty/whitespace queries return None."""
    tokens = [t for t in query.lower().split() if t]
    if not tokens:
        return None
    text = (title + ' ' + abstract + ' ' + (category or '')).lower()
    for t in tokens:
        if t not in text:
            return None
    return query


def check_arxiv(state, dry_run=False):
    """Search arXiv for new papers matching our research interests.
    Uses ti+abs: (title + abstract) search instead of all: (full text)
    to avoid false positives from incidental keyword matches in body text.
    Applies relevance filtering via required keywords in title/abstract."""
    print("\n=== arXiv Paper Search ===")
    seen = set(state.get('seen_arxiv_ids', []))
    discoveries = []
    filtered_count = 0

    for query, category, relevance_keywords in ARXIV_QUERIES:
        try:
            # Phase 1 (v2): wrap multi-word queries in literal quotes so arXiv
            # treats them as a phrase, not a bag of OR'd tokens. Each field
            # clause is also parenthesised so operator precedence cannot leak.
            if DISCOVERY_V2:
                phrased = _phrase_query(query)
                encoded = quote_plus(phrased)
                search = f"%28ti:{encoded}+OR+abs:{encoded}%29+AND+cat:{category}"
                url = (
                    f"http://export.arxiv.org/api/query?"
                    f"search_query={search}"
                    f"&sortBy=submittedDate&sortOrder=descending"
                    f"&max_results={ARXIV_MAX_RESULTS}"
                )
            else:
                encoded = quote_plus(query)
                url = (
                    f"http://export.arxiv.org/api/query?"
                    f"search_query=ti:{encoded}+OR+abs:{encoded}+AND+cat:{category}"
                    f"&sortBy=submittedDate&sortOrder=descending"
                    f"&max_results={ARXIV_MAX_RESULTS}"
                )

            req = Request(url, headers={'User-Agent': 'GSD-ResearchEngine/1.0'})
            with urlopen(req, timeout=15) as resp:
                xml = resp.read().decode('utf-8')

            # Simple XML parsing for arXiv Atom feed
            entries = re.findall(r'<entry>(.*?)</entry>', xml, re.DOTALL)

            for entry in entries:
                arxiv_id_match = re.search(r'<id>http://arxiv.org/abs/([^<]+)</id>', entry)
                title_match = re.search(r'<title>(.*?)</title>', entry, re.DOTALL)
                published_match = re.search(r'<published>(\d{4}-\d{2}-\d{2})', entry)
                abstract_match = re.search(r'<summary>(.*?)</summary>', entry, re.DOTALL)

                if not arxiv_id_match or not title_match:
                    continue

                arxiv_id = arxiv_id_match.group(1).strip()
                title = re.sub(r'\s+', ' ', title_match.group(1).strip())
                abstract = re.sub(r'\s+', ' ', abstract_match.group(1).strip()) if abstract_match else ''
                pub_date = published_match.group(1) if published_match else 'unknown'

                if arxiv_id in seen:
                    continue

                # Check recency
                if pub_date != 'unknown':
                    try:
                        pub = datetime.strptime(pub_date, '%Y-%m-%d')
                        if (datetime.now() - pub).days > ARXIV_DAYS_BACK:
                            continue
                    except ValueError:
                        pass

                # Relevance filter: v2 requires ALL query tokens present in
                # title+abstract+category; legacy requires one-of-many keywords.
                if DISCOVERY_V2:
                    if not _relevance_check_all_tokens(title, abstract, category, query):
                        filtered_count += 1
                        continue
                    matched_kw = query
                else:
                    matched_kw = _relevance_check(title, abstract, relevance_keywords)
                    if not matched_kw:
                        filtered_count += 1
                        continue

                discoveries.append({
                    'title': title,
                    'duration': 'paper',
                    'id': f'arXiv:{arxiv_id}',
                    'domain': f'{category} / {query}',
                    'summary': f'arXiv {pub_date}, matched query "{query}" (keyword: {matched_kw})',
                    'source': 'arxiv',
                    '_query': query,
                    '_category': category,
                    '_abstract': abstract,
                    '_url': f'http://arxiv.org/abs/{arxiv_id}',
                })
                seen.add(arxiv_id)
                print(f"  NEW: {arxiv_id} — {title[:70]}...")

        except (URLError, Exception) as e:
            print(f"  ERROR [{query}]: {e}")

    state['seen_arxiv_ids'] = list(seen)[-200:]
    state['last_arxiv_check'] = datetime.now(timezone.utc).isoformat()
    print(f"  Searched {len(ARXIV_QUERIES)} queries, found {len(discoveries)} new papers ({filtered_count} filtered as irrelevant)")
    return discoveries


def check_arxiv_rss(state, dry_run=False):
    """Check arXiv RSS feeds for new submissions across tracked categories.
    Uses the Atom RSS feeds at rss.arxiv.org which cover ALL new submissions
    in each category — broader net than keyword search queries.
    Applies relevance filtering to keep only papers matching our interests."""
    print("\n=== arXiv RSS Feed Check ===")
    seen = set(state.get('seen_arxiv_ids', []))
    discoveries = []
    filtered_count = 0

    for category, label, relevance_keywords in ARXIV_RSS_FEEDS:
        try:
            url = f"http://rss.arxiv.org/rss/{category}"
            req = Request(url, headers={'User-Agent': 'GSD-ResearchEngine/1.0'})
            with urlopen(req, timeout=15) as resp:
                xml = resp.read().decode('utf-8')

            # Parse RSS items
            items = re.findall(r'<item>(.*?)</item>', xml, re.DOTALL)

            for item in items[:20]:  # Check first 20 items per feed
                title_match = re.search(r'<title>(.*?)</title>', item, re.DOTALL)
                link_match = re.search(r'<link>(.*?)</link>', item)
                desc_match = re.search(r'<description>(.*?)</description>', item, re.DOTALL)

                if not title_match or not link_match:
                    continue

                title = re.sub(r'\s+', ' ', re.sub(r'<[^>]+>', '', title_match.group(1))).strip()
                link = link_match.group(1).strip()
                abstract = re.sub(r'\s+', ' ', re.sub(r'<[^>]+>', '', desc_match.group(1))).strip() if desc_match else ''

                # Extract arXiv ID from link
                arxiv_id_match = re.search(r'(\d{4}\.\d{4,5})', link)
                if not arxiv_id_match:
                    continue
                arxiv_id = arxiv_id_match.group(1)

                if arxiv_id in seen:
                    continue

                # Relevance filter: v2 requires ALL label-tokens present in
                # title+abstract+category; legacy requires one-of-many keywords.
                if DISCOVERY_V2:
                    if not _relevance_check_all_tokens(title, abstract, category, label):
                        filtered_count += 1
                        continue
                    matched_kw = label
                else:
                    matched_kw = _relevance_check(title, abstract, relevance_keywords)
                    if not matched_kw:
                        filtered_count += 1
                        continue

                discoveries.append({
                    'title': title,
                    'duration': 'paper',
                    'id': f'arXiv:{arxiv_id}',
                    'domain': f'{category} / {label}',
                    'summary': f'arXiv RSS new submission, category {category} (keyword: {matched_kw})',
                    'source': 'arxiv-rss',
                })
                seen.add(arxiv_id)
                print(f"  NEW [{category}]: {arxiv_id} — {title[:70]}...")

        except (URLError, Exception) as e:
            print(f"  ERROR [{category}]: {e}")

    if not dry_run:
        state['seen_arxiv_ids'] = list(seen)[-500:]  # larger buffer for RSS
    state['last_arxiv_rss_check'] = datetime.now(timezone.utc).isoformat()
    print(f"  Checked {len(ARXIV_RSS_FEEDS)} RSS feeds, found {len(discoveries)} new papers ({filtered_count} filtered)")
    return discoveries


# ── Source: Hacker News ──

def check_hn(state, dry_run=False):
    """Check Hacker News front page for relevant high-scoring items."""
    print("\n=== Hacker News Scan ===")
    seen = set(state.get('seen_hn_ids', []))
    discoveries = []

    try:
        # Get top stories
        req = Request('https://hacker-news.firebaseio.com/v0/topstories.json',
                      headers={'User-Agent': 'GSD-ResearchEngine/1.0'})
        with urlopen(req, timeout=10) as resp:
            story_ids = json.loads(resp.read().decode('utf-8'))[:60]

        for sid in story_ids:
            if str(sid) in seen:
                continue

            try:
                req = Request(f'https://hacker-news.firebaseio.com/v0/item/{sid}.json',
                              headers={'User-Agent': 'GSD-ResearchEngine/1.0'})
                with urlopen(req, timeout=5) as resp:
                    story = json.loads(resp.read().decode('utf-8'))
            except:
                continue

            if not story or story.get('type') != 'story':
                seen.add(str(sid))
                continue

            title = story.get('title', '')
            score = story.get('score', 0)
            url = story.get('url', f'https://news.ycombinator.com/item?id={sid}')

            if score < HN_MIN_SCORE:
                seen.add(str(sid))
                continue

            # Check if title matches any keyword
            title_lower = title.lower()
            matched = [kw for kw in HN_KEYWORDS if kw.lower() in title_lower]

            if not matched:
                seen.add(str(sid))
                continue

            discoveries.append({
                'title': title,
                'duration': 'article',
                'id': url[:60],
                'domain': f'HN ({score}pts) / {matched[0]}',
                'summary': f'HN {score} points, matched: {", ".join(matched[:3])}',
                'source': 'hn',
            })
            seen.add(str(sid))
            print(f"  NEW: [{score}pts] {title[:70]}...")

    except (URLError, Exception) as e:
        print(f"  ERROR: {e}")

    state['seen_hn_ids'] = list(seen)[-300:]
    state['last_hn_check'] = datetime.now(timezone.utc).isoformat()
    print(f"  Scanned top 60 stories, found {len(discoveries)} relevant items")
    return discoveries


# ── Source: Google Scholar (simplified — uses arXiv for citation tracking) ──

def check_scholar(state, dry_run=False):
    """Check for new papers citing our tracked key papers via arXiv.
    Uses ti+abs: search to avoid false positives from full-text matching."""
    print("\n=== Citation Check (via arXiv) ===")
    seen_arxiv = set(state.get('seen_arxiv_ids', []))
    discoveries = []

    for label, query in SCHOLAR_TRACKED:
        try:
            encoded = quote_plus(query)
            # Use ti+abs instead of all: to reduce false positives
            url = (
                f"http://export.arxiv.org/api/query?"
                f"search_query=ti:{encoded}+OR+abs:{encoded}"
                f"&sortBy=submittedDate&sortOrder=descending&max_results=3"
            )

            req = Request(url, headers={'User-Agent': 'GSD-ResearchEngine/1.0'})
            with urlopen(req, timeout=15) as resp:
                xml = resp.read().decode('utf-8')

            entries = re.findall(r'<entry>(.*?)</entry>', xml, re.DOTALL)
            for entry in entries:
                arxiv_id_match = re.search(r'<id>http://arxiv.org/abs/([^<]+)</id>', entry)
                title_match = re.search(r'<title>(.*?)</title>', entry, re.DOTALL)
                published_match = re.search(r'<published>(\d{4}-\d{2}-\d{2})', entry)

                if not arxiv_id_match or not title_match:
                    continue

                arxiv_id = arxiv_id_match.group(1).strip()
                title = re.sub(r'\s+', ' ', title_match.group(1).strip())
                pub_date = published_match.group(1) if published_match else 'unknown'

                # Only recent
                if pub_date != 'unknown':
                    try:
                        pub = datetime.strptime(pub_date, '%Y-%m-%d')
                        if (datetime.now() - pub).days > 14:
                            continue
                    except ValueError:
                        pass

                if arxiv_id in seen_arxiv:
                    continue

                discoveries.append({
                    'title': title,
                    'duration': 'paper',
                    'id': f'arXiv:{arxiv_id}',
                    'domain': f'Citation tracking / {label}',
                    'summary': f'Related to {label}, arXiv {pub_date}',
                    'source': 'scholar',
                })
                seen_arxiv.add(arxiv_id)
                print(f"  NEW: {arxiv_id} — {title[:60]}... (related to {label})")

        except (URLError, Exception) as e:
            print(f"  ERROR [{label}]: {e}")

    state['seen_arxiv_ids'] = list(seen_arxiv)[-200:]
    state['last_scholar_check'] = datetime.now(timezone.utc).isoformat()
    print(f"  Checked {len(SCHOLAR_TRACKED)} tracked papers, found {len(discoveries)} new related papers")
    return discoveries


# ── Main ──

def run_discovery(sources=None, dry_run=False):
    """Run discovery across specified sources."""
    state = load_state()
    all_sources = sources or ['youtube', 'arxiv', 'hn', 'scholar']

    print(f"Research Discovery Engine — {datetime.now().strftime('%Y-%m-%d %H:%M:%S %Z')}")
    print(f"Sources: {', '.join(all_sources)}")
    print(f"Dry run: {dry_run}")

    all_discoveries = []

    if 'youtube' in all_sources:
        all_discoveries.extend(check_youtube(state, dry_run))

    if 'arxiv' in all_sources:
        all_discoveries.extend(check_arxiv(state, dry_run))
        all_discoveries.extend(check_arxiv_rss(state, dry_run))

    if 'hn' in all_sources:
        all_discoveries.extend(check_hn(state, dry_run))

    if 'scholar' in all_sources:
        all_discoveries.extend(check_scholar(state, dry_run))

    # Append to queue
    if all_discoveries:
        added = append_to_queue(all_discoveries, dry_run)
        state['total_discovered'] = state.get('total_discovered', 0) + added
    else:
        print("\nNo new discoveries this run.")

    if not dry_run:
        state['runs'] = state.get('runs', 0) + 1
        save_state(state)

    print(f"\n{'='*40}")
    print(f"Total this run: {len(all_discoveries)} discoveries")
    print(f"Total all time: {state.get('total_discovered', 0)}")
    print(f"Runs: {state['runs']}")
    return all_discoveries


def show_status():
    state = load_state()
    print("Discovery Engine Status")
    print(f"  Last run:     {state.get('last_run', 'never')}")
    print(f"  YouTube:      {state.get('last_youtube_check', 'never')} ({len(state.get('seen_youtube_ids', []))} seen)")
    print(f"  arXiv:        {state.get('last_arxiv_check', 'never')} ({len(state.get('seen_arxiv_ids', []))} seen)")
    print(f"  HN:           {state.get('last_hn_check', 'never')} ({len(state.get('seen_hn_ids', []))} seen)")
    print(f"  Scholar:      {state.get('last_scholar_check', 'never')}")
    print(f"  Total found:  {state.get('total_discovered', 0)}")
    print(f"  Total runs:   {state.get('runs', 0)}")


def main():
    parser = argparse.ArgumentParser(description="Research Discovery Engine")
    parser.add_argument("--youtube", action="store_true")
    parser.add_argument("--arxiv", action="store_true")
    parser.add_argument("--hn", action="store_true")
    parser.add_argument("--scholar", action="store_true")
    parser.add_argument("--dry-run", action="store_true")
    parser.add_argument("--status", action="store_true")
    args = parser.parse_args()

    if args.status:
        show_status()
        return

    sources = []
    if args.youtube: sources.append('youtube')
    if args.arxiv: sources.append('arxiv')
    if args.hn: sources.append('hn')
    if args.scholar: sources.append('scholar')
    if not sources:
        sources = None  # all

    run_discovery(sources, args.dry_run)


if __name__ == "__main__":
    main()
