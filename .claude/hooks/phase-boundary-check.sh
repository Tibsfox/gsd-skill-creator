#!/bin/bash
# phase-boundary-check.sh — PostToolUse hook: detect .planning/ file writes
# Outputs a reminder when planning files are modified.
# When a SUMMARY.md is written, triggers state pruner and teach-forward extraction.

INPUT=$(cat)
FILE=$(echo "$INPUT" | jq -r '.tool_input.file_path // empty' 2>/dev/null)

# Only act on .planning/ file writes
if [[ "$FILE" != *.planning/* ]] && [[ "$FILE" != .planning/* ]]; then
  exit 0
fi

# Detect SUMMARY.md writes for phase boundary triggers
if [[ "$FILE" == *-SUMMARY.md ]]; then
  # Extract phase number from path: .planning/phases/{N}-{slug}/{N}-{NN}-SUMMARY.md
  PHASE_NUM=$(echo "$FILE" | sed -n 's|.*phases/\([0-9]*\)-[^/]*/.*|\1|p')

  if [[ -n "$PHASE_NUM" ]]; then
    echo "Phase boundary detected: SUMMARY.md written for phase $PHASE_NUM"

    # Trigger state pruner (advisory, never blocks)
    timeout 5 npx tsx -e "
      import { readFile, writeFile } from 'fs/promises';
      import { pruneState } from './src/services/autonomy/state-pruner.js';
      const io = {
        readFile: (p) => readFile(p, 'utf-8'),
        writeFile: (p, c) => writeFile(p, c, 'utf-8'),
      };
      try {
        const result = await pruneState(
          '.planning/STATE.md',
          '.planning/archive/',
          { current_subversion: ${PHASE_NUM}, milestone: 'auto' },
          io,
        );
        if (result.pruned) {
          console.log('STATE.md pruned: ' + result.linesBefore + ' -> ' + result.linesAfter + ' lines');
        }
      } catch {}
    " 2>/dev/null || true

    # Trigger teach-forward extraction (advisory, never blocks)
    timeout 5 npx tsx -e "
      import { readFile, writeFile } from 'fs/promises';
      import { extractPhaseTeachForward, writePhaseTeachForward } from './src/services/autonomy/teach-forward.js';
      const io = { writeFile: (p, c) => writeFile(p, c, 'utf-8') };
      try {
        const content = await readFile('${FILE}', 'utf-8');
        const insights = extractPhaseTeachForward(content);
        if (insights.length > 0) {
          await writePhaseTeachForward('.planning/phases', ${PHASE_NUM}, insights, io);
          const nextPhase = ${PHASE_NUM} + 1;
          console.log('Teach-forward: ' + insights.length + ' insights extracted for phase ' + nextPhase);
        }
      } catch {}
    " 2>/dev/null || true
  fi
elif [[ "$FILE" == *-VERIFICATION.md ]]; then
  # Traceability staleness advisory (TRACE-02)
  TRACE_DATE=$(grep -oP '(?<=\*\*Traceability updated:\*\* )\d{4}-\d{2}-\d{2}' .planning/REQUIREMENTS.md 2>/dev/null)
  TODAY=$(date +%Y-%m-%d)

  if [ -z "$TRACE_DATE" ]; then
    echo "TRACEABILITY: No traceability_updated field found in REQUIREMENTS.md"
  elif [ "$TRACE_DATE" != "$TODAY" ]; then
    echo "TRACEABILITY: Requirements table last updated $TRACE_DATE, phase completed since. Review: update traceability table in REQUIREMENTS.md"
  fi

  # Deviation surface advisory (DEVN-02)
  DEV_COUNT=$(grep -c '```deviation' "$FILE" 2>/dev/null || echo "0")
  if [ "$DEV_COUNT" -gt 0 ]; then
    echo "DEVIATION: $DEV_COUNT deviation(s) found in $(basename "$FILE")"
    grep -A1 '```deviation' "$FILE" 2>/dev/null | grep -oP '(?<=Requirement: )\S+' | while read -r REQ_ID; do
      echo "  - $REQ_ID"
    done
  fi
else
  # Non-SUMMARY, Non-VERIFICATION .planning/ write — advisory messages
  echo ".planning/ file modified: $FILE"
  echo "Check: Does this phase transition trigger any skill-creator hooks?"
  echo "Check: Should STATE.md be updated?"
fi

exit 0
