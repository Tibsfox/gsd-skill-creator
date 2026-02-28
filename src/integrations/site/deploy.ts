import type { DeployConfig } from './types.js';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface DeployAdapter {
  connect(config: DeployConfig): Promise<void>;
  upload(localPath: string, remotePath: string): Promise<void>;
  listRemote(remotePath: string): Promise<string[]>;
  disconnect(): Promise<void>;
}

export interface DeployOptions {
  dryRun?: boolean;
  exclude?: string[];
  walkFn?: WalkFn;
}

export type WalkFn = (dir: string) => Promise<string[]>;

export interface DeployResult {
  filesUploaded: number;
  bytesTransferred: number;
  errors: string[];
}

export interface DryRunResult {
  files: string[];
  totalSize: number;
}

export interface VerificationResult {
  indexOk: boolean;
  llmsTxtOk: boolean;
  errors: string[];
}

export type FetchFn = (url: string) => Promise<{ ok: boolean; status: number }>;

/* ------------------------------------------------------------------ */
/*  Deploy                                                              */
/* ------------------------------------------------------------------ */

/**
 * Deploy built files to the remote server via the provided adapter.
 *
 * Walks `buildDir`, filters out excluded patterns, connects via adapter,
 * uploads each file, then disconnects.
 */
export async function deploy(
  buildDir: string,
  config: DeployConfig,
  adapter: DeployAdapter,
  options: DeployOptions = {},
): Promise<DeployResult> {
  const walkFn = options.walkFn ?? defaultWalk;
  const allFiles = await walkFn(buildDir);

  const excludePatterns = [
    ...(config.exclude ?? []),
    ...(options.exclude ?? []),
  ];
  const files = allFiles.filter((f) => !matchesExclude(f, excludePatterns));

  const errors: string[] = [];

  await adapter.connect(config);

  let uploaded = 0;
  for (const file of files) {
    try {
      const localPath = `${buildDir}/${file}`;
      const remotePath = `${config.path}/${file}`;
      await adapter.upload(localPath, remotePath);
      uploaded++;
    } catch (err) {
      errors.push(`Upload failed for ${file}: ${String(err)}`);
    }
  }

  await adapter.disconnect();

  return {
    filesUploaded: uploaded,
    bytesTransferred: 0,
    errors,
  };
}

/* ------------------------------------------------------------------ */
/*  Dry run                                                             */
/* ------------------------------------------------------------------ */

/**
 * List files that would be deployed, without actually uploading.
 */
export async function dryRun(
  buildDir: string,
  config: DeployConfig,
  walkFn: WalkFn = defaultWalk,
): Promise<DryRunResult> {
  const allFiles = await walkFn(buildDir);
  const excludePatterns = config.exclude ?? [];
  const files = allFiles.filter((f) => !matchesExclude(f, excludePatterns));

  return {
    files,
    totalSize: 0,
  };
}

/* ------------------------------------------------------------------ */
/*  Post-deploy verification                                            */
/* ------------------------------------------------------------------ */

/**
 * Verify a deployment by checking that key files are accessible.
 */
export async function verifyDeployment(
  siteUrl: string,
  fetchFn?: FetchFn,
): Promise<VerificationResult> {
  const doFetch = fetchFn ?? defaultFetch;
  const errors: string[] = [];

  const indexRes = await doFetch(`${siteUrl}/`);
  const indexOk = indexRes.ok;
  if (!indexOk) {
    errors.push(`index.html returned status ${indexRes.status}`);
  }

  const llmsRes = await doFetch(`${siteUrl}/llms.txt`);
  const llmsTxtOk = llmsRes.ok;
  if (!llmsTxtOk) {
    errors.push(`llms.txt returned status ${llmsRes.status}`);
  }

  return { indexOk, llmsTxtOk, errors };
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                             */
/* ------------------------------------------------------------------ */

/**
 * Check whether a filename matches any of the given glob-like exclude
 * patterns.  Supports simple wildcards: `*.ext` and exact names.
 */
function matchesExclude(file: string, patterns: string[]): boolean {
  const basename = file.split('/').pop() ?? file;
  for (const pattern of patterns) {
    if (pattern.startsWith('*.')) {
      const ext = pattern.slice(1); // e.g. ".map"
      if (basename.endsWith(ext)) return true;
    } else if (basename === pattern) {
      return true;
    }
  }
  return false;
}

/** Default walk — dynamic import to avoid hard Node.js dependency in tests */
async function defaultWalk(dir: string): Promise<string[]> {
  const { readdir } = await import('node:fs/promises');
  const { join, relative } = await import('node:path');

  const results: string[] = [];

  async function walk(current: string): Promise<void> {
    const entries = await readdir(current, { withFileTypes: true });
    for (const entry of entries) {
      const full = join(current, entry.name);
      if (entry.isDirectory()) {
        await walk(full);
      } else {
        results.push(relative(dir, full));
      }
    }
  }

  await walk(dir);
  return results;
}

/** Default fetch wrapper */
async function defaultFetch(
  url: string,
): Promise<{ ok: boolean; status: number }> {
  const res = await fetch(url);
  return { ok: res.ok, status: res.status };
}
