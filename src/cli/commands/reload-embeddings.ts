/**
 * CLI command to reload embedding model after fallback.
 *
 * This command allows users to:
 * - Check current embedding service status
 * - Retry model loading if in fallback mode
 * - View cache statistics
 */

import { getEmbeddingService } from '../../embeddings/index.js';
import { loadPgEnv } from '../../scribe/pg-runtime/env-loader.js';
import { PgStore } from '../../memory/pg-store.js';
import pc from 'picocolors';

interface ReloadOptions {
  verbose?: boolean;
}

/**
 * Best-effort: after the model loads, warn if stored conversation turns are still
 * embedded under a non-'model' method (invisible to semantic search until repaired).
 * Postgres is optional — any failure here must never break `reload-embeddings`.
 */
async function warnStaleConversationEmbeddings(): Promise<void> {
  try {
    const env = loadPgEnv();
    if (!env.ok) return;
    const pg = new PgStore({ connectionString: env.url, autoMigrate: false });
    try {
      const stats = await pg.getConversationEmbeddingStats();
      const stale = Object.entries(stats.byMethod)
        .filter(([m]) => m !== 'model' && m !== 'none')
        .reduce((n, [, c]) => n + c, 0);
      if (stale > 0) {
        console.log(
          pc.yellow(
            `! ${stale} conversation turn(s) are embedded under a stale method; run ` +
              '`skill-creator reembed-conversations` to restore them to semantic search.',
          ),
        );
      }
    } finally {
      await pg.close();
    }
  } catch {
    /* Postgres optional — never fail reload on a stale-check error. */
  }
}

export async function reloadEmbeddingsCommand(options: ReloadOptions = {}): Promise<void> {
  console.log(pc.blue('Embedding Service Status'));
  console.log('');

  const service = await getEmbeddingService();
  const status = service.getStatus();

  // Show current status
  console.log(`Initialized: ${status.initialized ? pc.green('Yes') : pc.yellow('No')}`);
  console.log(`Mode: ${status.fallbackMode ? pc.yellow('Heuristic (fallback)') : pc.green('Model')}`);
  console.log(`Cache entries: ${status.cacheStats.entries}`);
  console.log('');

  // If in fallback mode, attempt reload
  if (status.fallbackMode) {
    console.log(pc.blue('Attempting to reload embedding model...'));
    console.log('');

    const success = await service.reloadModel();

    if (success) {
      console.log(pc.green('✓ Model loaded successfully'));
      console.log('Future embedding operations will use the model.');
      await warnStaleConversationEmbeddings();
    } else {
      console.log(pc.yellow('✗ Model still unavailable'));
      console.log('Continuing with heuristic analysis.');
      console.log('');
      console.log(pc.dim('Troubleshooting:'));
      console.log(pc.dim('  - Check internet connection for model download'));
      console.log(pc.dim('  - Ensure sufficient disk space (~50MB)'));
      console.log(pc.dim('  - Check ~/.cache/huggingface/ permissions'));
    }
  } else if (!status.initialized) {
    console.log(pc.blue('Initializing embedding service...'));
    console.log('');

    try {
      await service.init((info) => {
        if (info.status === 'download') {
          console.log('Downloading embedding model (33MB)...');
        }
        if (info.status === 'progress' && info.progress !== undefined) {
          process.stdout.write(`\rProgress: ${Math.round(info.progress)}%`);
        }
        if (info.status === 'ready') {
          console.log('\n');
        }
      });

      const newStatus = service.getStatus();
      if (newStatus.fallbackMode) {
        console.log(pc.yellow('✗ Model failed to load, using heuristic mode'));
      } else {
        console.log(pc.green('✓ Model ready'));
      }
    } catch (error) {
      console.log(pc.red('Error initializing service:'), error);
    }
  } else {
    console.log(pc.green('Model is already loaded and ready.'));
    console.log('No reload needed.');
  }
}
