/**
 * CLI subcommand handler for site management.
 *
 * Provides build/deploy/audit subcommands for the static site generator.
 * Thin wrappers over existing src/site/ module functions.
 *
 * Subcommands:
 * - build (b): Build the static site from content, templates, and data
 * - deploy (d): Deploy built site (--dry-run required for safety)
 * - audit (a): Run quality audit on build output
 */

import pc from 'picocolors';

// ============================================================================
// Argument parsing helpers
// ============================================================================

/**
 * Extract a flag value from args in --key=value format.
 */
function extractFlag(args: string[], flag: string): string | undefined {
  const prefix = `--${flag}=`;
  const arg = args.find((a) => a.startsWith(prefix));
  return arg ? arg.slice(prefix.length) : undefined;
}

/**
 * Check if a boolean flag is present in args.
 */
function hasFlag(args: string[], flag: string): boolean {
  return args.includes(`--${flag}`);
}

// ============================================================================
// Subcommand handlers
// ============================================================================

async function siteBuildCommand(subArgs: string[]): Promise<number> {
  const outputDir = extractFlag(subArgs, 'output') ?? 'www';
  const includeDrafts = hasFlag(subArgs, 'drafts');
  const clean = hasFlag(subArgs, 'clean');

  const { build } = await import('../../site/build.js');

  const result = await build({
    contentDir: 'src/site/content',
    templateDir: 'src/site/templates',
    dataDir: 'src/site/config',
    staticDir: 'src/site/static',
    outputDir,
    includeDrafts,
    clean,
  });

  console.log(pc.green(`Built ${result.pagesBuilt} pages in ${result.elapsedMs}ms`));
  if (result.pagesSkipped > 0) {
    console.log(pc.dim(`Skipped ${result.pagesSkipped} draft pages`));
  }
  for (const warning of result.warnings) {
    console.log(pc.yellow(`Warning: ${warning}`));
  }

  return 0;
}

async function siteDeployCommand(subArgs: string[]): Promise<number> {
  const isDryRun = hasFlag(subArgs, 'dry-run');
  const buildDir = extractFlag(subArgs, 'build-dir') ?? 'www';

  if (!isDryRun) {
    console.log(pc.red('Deploy requires --dry-run flag for safety.'));
    console.log(pc.dim('Full deploy requires adapter configuration. Use --dry-run to preview.'));
    return 1;
  }

  const { dryRun } = await import('../../site/deploy.js');

  const config = {
    method: 'rsync' as const,
    host: '',
    user: '',
    path: '',
    exclude: [],
  };

  const result = await dryRun(buildDir, config);

  console.log(pc.green(`Dry run: ${result.files.length} files, ${result.totalSize} bytes total`));
  for (const file of result.files) {
    console.log(pc.dim(`  ${file}`));
  }

  return 0;
}

async function siteAuditCommand(subArgs: string[]): Promise<number> {
  const buildDir = extractFlag(subArgs, 'build-dir') ?? 'www';

  const { runAudit } = await import('../../site/audit.js');
  const { readFile } = await import('node:fs/promises');
  const { resolve, join } = await import('node:path');

  const walkDir = async (dir: string): Promise<string[]> => {
    const { readdir, stat } = await import('node:fs/promises');
    const results: string[] = [];
    const entries = await readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = join(dir, entry.name);
      if (entry.isDirectory()) {
        const subResults = await walkDir(fullPath);
        results.push(...subResults);
      } else {
        results.push(fullPath);
      }
    }
    return results;
  };

  const result = await runAudit(buildDir, {
    readFile: (path: string) => readFile(path, 'utf-8'),
    walkDir,
  });

  for (const check of result.checks) {
    const icon = check.passed ? pc.green('\u2714') : pc.red('\u2718');
    console.log(`${icon} ${check.name}: ${check.details}`);
  }
  for (const warning of result.warnings) {
    console.log(pc.yellow(`Warning: ${warning}`));
  }

  if (result.passed) {
    console.log(pc.green('\nAudit passed'));
  } else {
    console.log(pc.red('\nAudit failed'));
  }

  return result.passed ? 0 : 1;
}

// ============================================================================
// Help
// ============================================================================

function showSiteHelp(): void {
  console.log(`Usage: sc site <command>

Commands:
  build, b     Build the static site
  deploy, d    Deploy built site (--dry-run required)
  audit, a     Run quality audit on build output

Build flags:
  --output=<dir>   Output directory (default: www)
  --drafts         Include draft pages
  --clean          Clean output directory first

Deploy flags:
  --dry-run        Preview files to deploy (required)
  --build-dir=<d>  Build directory (default: www)

Audit flags:
  --build-dir=<d>  Build directory to audit (default: www)`);
}

// ============================================================================
// Main dispatch
// ============================================================================

export async function siteCommand(args: string[]): Promise<number> {
  const subcommand = args[0];
  const subArgs = args.slice(1);

  switch (subcommand) {
    case 'build':
    case 'b':
      return siteBuildCommand(subArgs);

    case 'deploy':
    case 'd':
      return siteDeployCommand(subArgs);

    case 'audit':
    case 'a':
      return siteAuditCommand(subArgs);

    default:
      showSiteHelp();
      return subcommand ? 1 : 0;
  }
}
