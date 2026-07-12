/**
 * `skill-creator reembed-conversations` — repair stale conversation embeddings.
 *
 * When conversation turns were embedded as 'heuristic' (the model was unavailable
 * at ingest) and the model later loads, semantic search silently drops those turns
 * (searchConversationsByEmbedding grandfathers only NULL-method rows). This re-embeds
 * the stored turn CONTENT with the active embedder and re-tags the method — no
 * transcript re-parse — so prior history becomes searchable again. Idempotent.
 *
 * Basename is deliberately not loader|reader|scanner|walker|store; no child_process.
 */
import pc from 'picocolors';
import { loadPgEnv } from '../../scribe/pg-runtime/env-loader.js';
import { getEmbeddingService } from '../../embeddings/index.js';
import { PgStore } from '../../memory/pg-store.js';

function parseBatchSize(args: string[]): number {
  const arg = args.find((a) => a.startsWith('--batch-size='));
  const n = arg ? parseInt(arg.slice('--batch-size='.length), 10) : NaN;
  return Number.isFinite(n) && n > 0 ? n : 200;
}

function printUsage(): void {
  console.log(
    [
      'Usage: skill-creator reembed-conversations [--batch-size=N] [--force]',
      '',
      'Re-embed stored conversation turns whose embedding method differs from the',
      'active embedder (repairs stale heuristic vectors after the model loads).',
      'Idempotent; needs RH_POSTGRES_URL.',
      '',
      '  --batch-size=N  turns per page (default 200)',
      '  --force         run even in heuristic fallback mode (may downgrade vectors)',
      '  --help          show this message',
    ].join('\n'),
  );
}

export async function reembedConversationsCommand(args: string[]): Promise<number> {
  if (args.includes('--help') || args.includes('-h')) {
    printUsage();
    return 0;
  }

  const env = loadPgEnv();
  if (!env.ok) {
    console.error(`reembed-conversations: no Postgres configured (${env.reason}). ${env.hint}`);
    return 1;
  }

  const service = await getEmbeddingService();
  const activeMethod = service.getStatus().fallbackMode ? 'heuristic' : 'model';
  const force = args.includes('--force');
  if (activeMethod === 'heuristic' && !force) {
    console.error(
      pc.yellow(
        'reembed-conversations: the embedder is in heuristic fallback mode. Re-embedding now would ' +
          'downgrade any model-quality vectors. Run `skill-creator reload-embeddings` first, or pass --force.',
      ),
    );
    return 1;
  }

  const pg = new PgStore({ connectionString: env.url }, service);
  try {
    if (!(await pg.isReady())) {
      console.error('reembed-conversations: the database is unreachable.');
      return 1;
    }
    const batchSize = parseBatchSize(args);
    const n = await pg.reembedConversations({ method: activeMethod, batchSize });
    console.log(
      n > 0
        ? pc.green(`Re-embedded ${n} conversation turn(s) to method '${activeMethod}'.`)
        : `No conversation turns needed re-embedding (all already '${activeMethod}').`,
    );
    return 0;
  } finally {
    await pg.close();
  }
}
