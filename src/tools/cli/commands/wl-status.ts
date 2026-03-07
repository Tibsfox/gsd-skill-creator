/**
 * wl status — Display a rig's profile, trust level, completion history, and stamp records.
 *
 * Queries three DoltHub tables to compose a rig's identity and reputation view:
 * - rigs: profile, trust level, rig type, last seen
 * - completions: work history (JOIN with wanted for titles)
 * - stamps: reputation feedback with valence scores
 *
 * Default view is a summary card. Progressive disclosure via --completions,
 * --stamps, and --full reveals deeper data without overwhelming the user.
 *
 * Covers CLI-04.
 *
 * @module wl-status
 */

import pc from 'picocolors';
import { bootstrap } from '../../../integrations/wasteland/bootstrap.js';
import { renderTable, renderBadge } from '../../../integrations/wasteland/formatters.js';
import { hasFlag, getFlagValue, extractPositionalArgs } from '../../../integrations/wasteland/cli-utils.js';

// ============================================================================
// Help text
// ============================================================================

const STATUS_HELP_TEXT = `wl status — Display a rig's profile and reputation

Usage:
  wl status [handle] [options]

Arguments:
  handle              Target rig handle (default: own rig from config)

Options:
  --completions       Show completion history table
  --stamps            Show individual stamp records table
  --full              Show all sections (summary + completions + stamps)
  --json              Output machine-readable JSON
  --offline           Skip dolt pull, use local data only
  --help, -h          Show this help

Examples:
  wl status                       # Show own rig profile
  wl status MapleFoxyBells        # Show another rig's profile
  wl status --full                # Show own rig with all history
  wl status hop --json            # Machine-readable output for hop rig
`;

// ============================================================================
// Command
// ============================================================================

/**
 * wl status command — display a rig's profile, trust level, and reputation.
 *
 * Fetches data from three DoltHub tables and renders a summary card by default.
 * Progressive disclosure flags reveal completion history and stamp records.
 *
 * @param args    - CLI arguments (flags and positional handle)
 * @param options - Optional overrides for testing (e.g. configDir)
 * @returns Exit code: 0 success, 1 rig not found or config error
 */
export async function wlStatusCommand(
  args: string[],
  options?: { configDir?: string },
): Promise<number> {
  // 1. Help
  if (hasFlag(args, 'help', 'h')) {
    console.log(STATUS_HELP_TEXT);
    return 0;
  }

  // 2. Parse flags
  const jsonMode = hasFlag(args, 'json');
  let showCompletions = hasFlag(args, 'completions');
  let showStamps = hasFlag(args, 'stamps');
  const showFull = hasFlag(args, 'full');

  // --full enables all sections
  if (showFull) {
    showCompletions = true;
    showStamps = true;
  }

  // 3. Bootstrap: load config, create client, sync from upstream
  const { config, client, synced } = await bootstrap(args, options);

  // 4. Determine target handle: positional arg or own rig from config
  const handle = extractPositionalArgs(args)[0] ?? config.handle;

  // 5. Query 1 — rigs profile
  const rigSQL = client.generateSQL(
    'SELECT handle, display_name, trust_level, rig_type, registered_at, last_seen FROM rigs WHERE handle = ?',
    [handle],
  );
  const { rows: rigRows } = await client.query(rigSQL);

  if (rigRows.length === 0) {
    console.error(pc.red('Rig not found: ' + handle));
    return 1;
  }

  const rig = rigRows[0]!;

  // 6. Query 2 — completions history
  const completionsSQL = client.generateSQL(
    'SELECT c.id, c.wanted_id, w.title, c.completed_at FROM completions c LEFT JOIN wanted w ON c.wanted_id = w.id WHERE c.completed_by = ? ORDER BY c.completed_at DESC',
    [handle],
  );
  const { rows: completionRows } = await client.query(completionsSQL);

  // 7. Query 3 — stamps received
  const stampsSQL = client.generateSQL(
    'SELECT s.id, s.author, s.valence, s.confidence, s.severity, s.created_at FROM stamps s WHERE s.context_id IN (SELECT id FROM completions WHERE completed_by = ?) ORDER BY s.created_at DESC',
    [handle],
  );
  const { rows: stampRows } = await client.query(stampsSQL);

  // 8. Aggregate stamp valence — simple average per dimension
  const valenceAgg: Record<string, number[]> = {};
  for (const stamp of stampRows) {
    try {
      const v = JSON.parse(stamp['valence'] ?? '{}') as Record<string, unknown>;
      for (const [k, val] of Object.entries(v)) {
        if (typeof val === 'number') {
          valenceAgg[k] ??= [];
          valenceAgg[k]!.push(val);
        }
      }
    } catch {
      // Malformed valence JSON — skip this stamp
    }
  }
  const valenceAvg = Object.fromEntries(
    Object.entries(valenceAgg).map(([k, vals]) => [
      k,
      vals.reduce((a, b) => a + b, 0) / vals.length,
    ]),
  );

  // 9. JSON mode — machine-readable output
  if (jsonMode) {
    console.log(JSON.stringify({ rig, completions: completionRows, stamps: stampRows, synced }, null, 2));
    return 0;
  }

  // 10. Summary card
  console.log(pc.bold('\n=== Rig Profile: ' + rig['handle'] + ' ==='));
  console.log('Display name : ' + rig['display_name']);
  console.log('Trust level  : ' + renderBadge(String(rig['trust_level'] ?? 'newcomer')));
  console.log('Rig type     : ' + rig['rig_type']);
  console.log('Completions  : ' + completionRows.length);
  console.log('Stamps       : ' + stampRows.length);
  console.log('Last seen    : ' + (rig['last_seen'] ?? 'unknown'));

  if (Object.keys(valenceAvg).length > 0) {
    const scores = Object.entries(valenceAvg)
      .map(([k, v]) => k + ': ' + v.toFixed(1))
      .join(' | ');
    console.log('Stamp scores : ' + scores);
  }

  if (synced) {
    console.log(pc.dim('Last synced: ' + new Date().toISOString()));
  } else {
    console.log(pc.yellow('Note: working from local data (sync failed)'));
  }

  // 11. Completions history table
  if (showCompletions && completionRows.length > 0) {
    console.log('\nCompletion History:');
    console.log(
      renderTable(
        ['ID', 'Wanted ID', 'Title', 'Completed At'],
        completionRows.map(r => [
          String(r['id'] ?? ''),
          String(r['wanted_id'] ?? ''),
          String(r['title'] ?? ''),
          String(r['completed_at'] ?? ''),
        ]),
      ),
    );
  }

  // 12. Stamp records table
  if (showStamps && stampRows.length > 0) {
    console.log('\nStamp Records:');
    console.log(
      renderTable(
        ['ID', 'Author', 'Valence', 'Confidence', 'Severity', 'Created'],
        stampRows.map(r => [
          String(r['id'] ?? ''),
          String(r['author'] ?? ''),
          String(r['valence'] ?? ''),
          String(r['confidence'] ?? ''),
          String(r['severity'] ?? ''),
          String(r['created_at'] ?? ''),
        ]),
      ),
    );
  }

  return 0;
}
