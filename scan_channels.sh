#!/bin/bash
# Channel Scanner — Scan 31 YouTube channels from RESEARCH-QUEUE.md
# Outputs: channel name, video count, newest video date, oldest scanned date
# Rule: Work from newest back, stop after 30 most recent per channel

OUTDIR="artifacts/channel-scans"
mkdir -p "$OUTDIR"

CHANNELS=(
  "NRCgovVideo"
  "ThayerSchool"
  "UofLOnlineLearning"
  "OWASPGLOBAL"
  "AgenticAI-Foundation"
  "CppCon"
  "MPIfortheScienceofLight"
  "UNSW_COMP1531"
  "TheFutureOfPLM"
  "marineengineeringtutorials758"
  "NetSec-Academy"
  "paragontruss"
  "manufacturinghubpodcast"
  "IoTSecurityFoundation-TV"
  "christiankastner6150"
  "strykvisionz6890"
  "NASA"
  "SynapseProductDevelopment"
  "growingformarketmagazine"
  "EngineeringTheCurriculum"
  "DataVerse_Hub"
  "legalitinsider"
  "haldiainstituteoftechnolog3522"
  "FullrangeKR"
  "BrownSPS"
  "HistoricalArchitect"
  "castlepast"
  "AnuGyanClasses"
  "BCLegislatureChannel"
  "ShadowingTalk"
  "QHSETalks"
)

SUMMARY="$OUTDIR/channel-summary.md"
echo "# Channel Scan Summary — $(date '+%Y-%m-%d %H:%M %Z')" > "$SUMMARY"
echo "" >> "$SUMMARY"
echo "| # | Channel | Videos (30 newest) | Newest | Oldest Scanned | Duration Range |" >> "$SUMMARY"
echo "|---|---------|-------------------|--------|----------------|----------------|" >> "$SUMMARY"

IDX=0
for CH in "${CHANNELS[@]}"; do
  IDX=$((IDX + 1))
  OUTFILE="$OUTDIR/${CH}.txt"
  echo "[$IDX/31] Scanning @${CH}..."

  # Get 30 most recent videos with metadata
  yt-dlp --flat-playlist --playlist-end 30 \
    --print "%(id)s\t%(upload_date)s\t%(duration)s\t%(title)s" \
    "https://www.youtube.com/@${CH}/videos" \
    --no-warnings --quiet \
    > "$OUTFILE" 2>/dev/null

  if [ -s "$OUTFILE" ]; then
    COUNT=$(wc -l < "$OUTFILE")
    NEWEST=$(head -1 "$OUTFILE" | cut -f2)
    OLDEST=$(tail -1 "$OUTFILE" | cut -f2)
    # Format dates
    NEWEST_FMT="${NEWEST:0:4}-${NEWEST:4:2}-${NEWEST:6:2}"
    OLDEST_FMT="${OLDEST:0:4}-${OLDEST:4:2}-${OLDEST:6:2}"
    # Duration range
    MIN_DUR=$(cut -f3 "$OUTFILE" | sort -n | head -1)
    MAX_DUR=$(cut -f3 "$OUTFILE" | sort -n | tail -1)
    echo "| $IDX | @${CH} | $COUNT | $NEWEST_FMT | $OLDEST_FMT | ${MIN_DUR}s-${MAX_DUR}s |" >> "$SUMMARY"
  else
    echo "| $IDX | @${CH} | FAILED | - | - | - |" >> "$SUMMARY"
  fi
done

echo "" >> "$SUMMARY"
echo "Scan complete: $(date '+%H:%M %Z')" >> "$SUMMARY"
echo "Done. Summary at $SUMMARY"
