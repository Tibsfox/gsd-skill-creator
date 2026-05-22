#!/usr/bin/env bash
# nasa-canonical-layout-gate.sh — verify every NASA mission directory
# conforms to the v1.0 canonical layout (12 main-column cards + canonical
# sibling files). Designed to be invoked from tools/pre-tag-gate.sh so a
# ship that introduces NASA layout drift is blocked before tag.
#
# Exit codes:
#   0  all missions canonical
#   1  one or more missions deviate (caller decides BLOCK vs WARN)
#   2  unexpected error (no NASA directory, broken read, etc.)
#
# Flags:
#   --strict      fail on missing siblings too (default: cards only)
#   --json        emit JSON summary instead of human text
#   --since-ver=X  only check missions at v1.X or later
#
# The 12 canonical cards (from www/tibsfox/com/Research/NASA/1.0/index.html):
#   1. Mission Summary (or Mission Success/Failure/Loss/Recovery/Outcome, In Memoriam)
#   2. (Mission|Research) Tracks  -- with 8 track-cards labelled 1a, 1b, 2..7
#   3. Resonance Axes
#   4. What to Build
#   5. TRY Sessions  (or "TRY:" / "TRY Sessions & DIY Projects" merged form)
#   6. DIY Projects
#   7. Creative Artifacts
#   8. Runnable Simulations
#   9. Interactive Lab
#  10. Forest Contribution (or Forest Sim Contribution)
#  11. Data Files (or References & Primary Sources)
#  12. Dedication
#
# Additional invariants added v1.49.716 after QA pass:
#  13. NavCard-pair — at least 2 <div class="nav-card"> blocks (top + bottom)
#  14. TrackCSS    — if track-grid markup present, .track-grid CSS rule must
#                    also be present (closes substrate-era visual-bunching bug
#                    where v1.159-1.168 + v1.57 had markup but no styling)
#
# Canonical sibling files (--strict only):
#   research.md, organism.md, knowledge-nodes.json, data-sources.json,
#   research.html, papers.html, organism.html, mathematics.html,
#   curriculum.html, simulation.html, forest-module/

set -u

STRICT=0
JSON=0
SINCE=0

for arg in "$@"; do
  case "$arg" in
    --strict) STRICT=1 ;;
    --json) JSON=1 ;;
    --since-ver=*) SINCE="${arg#--since-ver=}" ;;
    *) echo "unknown arg: $arg" >&2; exit 2 ;;
  esac
done

BASE="www/tibsfox/com/Research/NASA"
[[ -d "$BASE" ]] || { echo "NASA base dir not found: $BASE" >&2; exit 2; }

deviations=()
strict_misses=()
checked=0

shopt -s nullglob
for d in "$BASE"/[0-9]*/; do
  ver=$(basename "$d")
  minor="${ver#1.}"
  # numeric guard
  [[ "$minor" =~ ^[0-9]+$ ]] || continue
  (( minor >= SINCE )) || continue
  f="${d}index.html"
  [[ -f "$f" ]] || { deviations+=("$ver:missing-index.html"); continue; }
  ((checked++))
  html=$(<"$f")

  miss=""
  # Card 1: Mission Summary or variant first card
  grep -qE '<h2[^>]*>(Mission (Summary|Success|Failure|Loss|Recovery|Outcome|Identity)|In Memoriam|Program Complete)' <<< "$html" || miss="$miss Summary"
  # Card 2: Mission/Research Tracks h2 (any variant after Tracks)
  grep -qE '<h2[^>]*>([A-Za-z]+ )?(Mission|Research) Tracks' <<< "$html" || miss="$miss Tracks-h2"
  # 8 track-cards labelled 1a, 1b, 2..7 (some recent shifted to 1..8).
  # Accept three markup patterns: <div class="track-card">, <div class="track-num">,
  # or <h2[^>]*>Track {1a,1b,2-7}</h2> (per-track-as-h2 style used in v1.102 etc).
  tcards=$(grep -cE 'class="track-card' <<< "$html")
  if (( tcards < 8 )); then
    tnums=$(grep -cE 'class="track-num"' <<< "$html")
    if (( tnums < 8 )); then
      h2tracks=$(grep -cE '<h2[^>]*>Track [0-9]' <<< "$html")
      (( h2tracks >= 8 )) || miss="$miss Track-count<8"
    fi
  fi
  grep -qE 'Track 1a' <<< "$html" || miss="$miss Track1a"
  grep -qE 'Track 1b' <<< "$html" || miss="$miss Track1b"
  for n in 2 3 4 5 6 7; do
    grep -qE "Track $n[^a-z0-9]" <<< "$html" || miss="$miss Track$n"
  done
  # Cards 3..12 (h2 prefix match)
  grep -qE '<h2[^>]*>Resonance'                         <<< "$html" || miss="$miss Resonance"
  grep -qE '<h2[^>]*>What to Build'                     <<< "$html" || miss="$miss WhatToBuild"
  grep -qE '<h2[^>]*>(TRY (Sessions|:)|TRY [^<]*DIY)'   <<< "$html" || miss="$miss TRY"
  grep -qE '<h2[^>]*>(DIY (Projects|:)|TRY [^<]*DIY)'   <<< "$html" || miss="$miss DIY"
  grep -qE '<h2[^>]*>Creative Artifacts'                <<< "$html" || miss="$miss Creative"
  grep -qE '<h2[^>]*>Runnable Simulations'              <<< "$html" || miss="$miss Sims"
  grep -qE '<h2[^>]*>Interactive Lab'                   <<< "$html" || miss="$miss InteractiveLab"
  grep -qE '<h2[^>]*>Forest (Contribution|Sim Contribution)' <<< "$html" || miss="$miss Forest"
  grep -qE '<h2[^>]*>(Data Files|References)'           <<< "$html" || miss="$miss DataFiles"
  grep -qE '<h2[^>]*>(Dedication|In Memoriam)'          <<< "$html" || miss="$miss Dedication"

  # Nav-card invariant (v1.49.716+): top + bottom navigation cards required.
  navcount=$(grep -cE 'class="nav-card"' <<< "$html")
  (( navcount >= 2 )) || miss="$miss NavCard-pair($navcount)"

  # Track CSS invariant: pages with track-grid markup must also ship the CSS.
  if grep -qE 'class="track-grid"' <<< "$html"; then
    grep -qE '\.track-grid\s*\{' <<< "$html" || miss="$miss TrackCSS"
  fi

  if [[ -n "$miss" ]]; then
    miss="${miss# }"
    deviations+=("$ver:${miss// /,}")
  fi

  if (( STRICT )); then
    # Universal sibling files in v1.0-v1.117 canonical era. Not included:
    # research.md / organism.md (only ~half of canonical-era ships have them);
    # simulation.html (~89% only); they're spec-mentioned but not v1.0-baseline.
    smiss=""
    for sib in knowledge-nodes.json data-sources.json \
               research.html papers.html organism.html mathematics.html \
               curriculum.html; do
      [[ -e "${d}${sib}" ]] || smiss="$smiss $sib"
    done
    [[ -d "${d}forest-module" ]] || smiss="$smiss forest-module/"
    if [[ -n "$smiss" ]]; then
      smiss="${smiss# }"
      strict_misses+=("$ver:${smiss// /,}")
    fi
  fi
done

if (( JSON )); then
  printf '{"checked":%d,"deviations":[' "$checked"
  for i in "${!deviations[@]}"; do
    (( i > 0 )) && printf ','
    printf '"%s"' "${deviations[$i]}"
  done
  printf '],"strict_sibling_misses":['
  for i in "${!strict_misses[@]}"; do
    (( i > 0 )) && printf ','
    printf '"%s"' "${strict_misses[$i]}"
  done
  printf ']}\n'
else
  echo "NASA canonical-layout gate"
  echo "  checked: $checked missions"
  echo "  card deviations: ${#deviations[@]}"
  for x in "${deviations[@]}"; do echo "    $x"; done | head -20
  (( ${#deviations[@]} > 20 )) && echo "    ...(+$((${#deviations[@]}-20)) more)"
  if (( STRICT )); then
    echo "  sibling-file misses: ${#strict_misses[@]}"
    for x in "${strict_misses[@]}"; do echo "    $x"; done | head -20
    (( ${#strict_misses[@]} > 20 )) && echo "    ...(+$((${#strict_misses[@]}-20)) more)"
  fi
fi

if (( ${#deviations[@]} > 0 )) || (( STRICT && ${#strict_misses[@]} > 0 )); then
  exit 1
fi
exit 0
