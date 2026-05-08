#!/usr/bin/env node
/**
 * load-trs-edges.mjs — CLI for the M1 TRS edge loader (IC-613-1.3).
 *
 * Reads `www/tibsfox/com/Research/TRS/edges.json` (or a path passed via
 * `--path=<...>`), runs the loader at `src/graph/trs-loader.ts`, and
 * prints the resulting counts.
 *
 * Invocation:
 *
 *   npm run graph:load:trs                  # default path, summary
 *   npm run graph:load:trs -- --path=<...>  # alternate JSON path
 *   npm run graph:load:trs -- --json        # machine-readable output
 *
 * Exit codes:
 *   0 — loaded successfully
 *   1 — read or parse failure (error printed to stderr)
 *   2 — invalid CLI args
 */
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const args = process.argv.slice(2);
let pathArg = null;
let jsonOutput = false;

for (const a of args) {
  if (a === '--json') {
    jsonOutput = true;
  } else if (a.startsWith('--path=')) {
    pathArg = a.slice('--path='.length);
  } else if (a === '--help' || a === '-h') {
    console.log('Usage: load-trs-edges [--path=<file>] [--json]');
    process.exit(0);
  } else {
    console.error(`load-trs-edges: unknown arg '${a}'`);
    process.exit(2);
  }
}

const repoRoot = process.cwd();

// Loader is TypeScript-compiled. Prefer dist/ if present (post-`npm run
// build`); fall back to a tsx import for dev workflows.
let createTrsGraph;
let loadTrsEdges;
try {
  const distUrl = pathToFileURL(
    resolve(repoRoot, 'dist/graph/trs-loader.js'),
  ).href;
  ({ createTrsGraph, loadTrsEdges } = await import(distUrl));
} catch {
  // Fall back to tsx (dev workflow). Requires tsx in PATH.
  try {
    const { tsImport } = await import('tsx/esm/api');
    const mod = await tsImport(
      resolve(repoRoot, 'src/graph/trs-loader.ts'),
      import.meta.url,
    );
    ({ createTrsGraph, loadTrsEdges } = mod);
  } catch (err) {
    console.error(
      'load-trs-edges: could not import trs-loader (tried dist/ + tsx):',
      err && err.message ? err.message : err,
    );
    process.exit(1);
  }
}

const graph = createTrsGraph();
let result;
try {
  result = await loadTrsEdges(graph, pathArg ? { path: pathArg } : {});
} catch (err) {
  console.error(
    'load-trs-edges: load failed:',
    err && err.message ? err.message : err,
  );
  process.exit(1);
}

if (jsonOutput) {
  console.log(
    JSON.stringify(
      {
        entitiesAdded: result.entitiesAdded,
        edgesAdded: result.edgesAdded,
        packsRecognized: result.packsRecognized,
        edgesInSource: result.edgesInSource,
        generatedAt: result.generatedAt,
        totalEntities: graph.entities.size,
        totalEdges: graph.edges.size,
      },
      null,
      2,
    ),
  );
} else {
  console.log('TRS edge load summary');
  console.log('---------------------');
  console.log(`source generated_at : ${result.generatedAt ?? '(unset)'}`);
  console.log(`edges in source     : ${result.edgesInSource}`);
  console.log(`entities added      : ${result.entitiesAdded}`);
  console.log(`edges added         : ${result.edgesAdded}`);
  console.log(`packs recognised    : ${result.packsRecognized}`);
  console.log(`graph total entities: ${graph.entities.size}`);
  console.log(`graph total edges   : ${graph.edges.size}`);
}
