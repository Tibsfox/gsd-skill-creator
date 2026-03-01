import type { WpPost, WpApiAdapter } from './wp-sync.js';
import { htmlToMarkdown } from './html-to-md.js';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

/** Adapter that also supports fetching pages (extends WpApiAdapter). */
export interface MigrateAdapter extends WpApiAdapter {
  fetchPages(params?: { since?: string }): Promise<WpPost[]>;
}

export type WriteFn = (path: string, content: string) => Promise<void>;
export type ExistsFn = (path: string) => Promise<boolean>;

export interface MigrateOptions {
  writeFn?: WriteFn;
  existsFn?: ExistsFn;
  skipExisting?: boolean;
}

export interface MigrateResult {
  migrated: number;
  skipped: number;
  files: string[];
}

/* ------------------------------------------------------------------ */
/*  Migration                                                          */
/* ------------------------------------------------------------------ */

/**
 * Migrate all WordPress content (posts and pages) to local markdown files.
 *
 * Posts are routed to `{contentDir}/releases/{slug}.md`.
 * Pages are routed to `{contentDir}/docs/{slug}.md`.
 *
 * Each file includes provenance-tracking frontmatter with `wp_post_id`,
 * `wp_sync: true`, `original_url`, and `slug` for future bidirectional sync.
 */
export async function migrateAllContent(
  adapter: MigrateAdapter,
  contentDir: string,
  options: MigrateOptions = {},
): Promise<MigrateResult> {
  const writeFn = options.writeFn ?? defaultWrite;
  const existsFn = options.existsFn ?? defaultExists;
  const skipExisting = options.skipExisting ?? false;

  let migrated = 0;
  let skipped = 0;
  const files: string[] = [];

  // Fetch all posts and pages
  const posts = await adapter.fetchPosts({});
  const pages = await adapter.fetchPages({});

  // Migrate posts -> releases/
  for (const post of posts) {
    const filePath = `${contentDir}/releases/${post.slug}.md`;

    if (skipExisting && (await existsFn(filePath))) {
      skipped++;
      continue;
    }

    const fileContent = buildMigrationFile(post, 'releases');
    await writeFn(filePath, fileContent);
    files.push(filePath);
    migrated++;
  }

  // Migrate pages -> docs/
  for (const page of pages) {
    const filePath = `${contentDir}/docs/${page.slug}.md`;

    if (skipExisting && (await existsFn(filePath))) {
      skipped++;
      continue;
    }

    const fileContent = buildMigrationFile(page, 'docs');
    await writeFn(filePath, fileContent);
    files.push(filePath);
    migrated++;
  }

  return { migrated, skipped, files };
}

/* ------------------------------------------------------------------ */
/*  Internal helpers                                                    */
/* ------------------------------------------------------------------ */

/** Build a complete markdown file with frontmatter + converted content. */
function buildMigrationFile(post: WpPost, navSection: string): string {
  const frontmatter = buildMigrationFrontmatter(post, navSection);
  const md = htmlToMarkdown(post.content);
  return `---\n${frontmatter}---\n\n${md}\n`;
}

/** Build YAML frontmatter with migration-specific provenance fields. */
function buildMigrationFrontmatter(post: WpPost, navSection: string): string {
  const lines: string[] = [];
  lines.push(`title: "${escapeYaml(post.title)}"`);
  lines.push(`date: "${post.date}"`);
  lines.push(`modified: "${post.modified}"`);
  lines.push(`wp_post_id: ${post.id}`);
  lines.push(`wp_sync: true`);
  lines.push(`slug: "${post.slug}"`);
  lines.push(`template: page`);
  lines.push(`nav_section: ${navSection}`);
  lines.push(`agent_visible: true`);
  lines.push(`agent_priority: low`);
  lines.push(`original_url: "${escapeYaml(post.link)}"`);

  // Merge categories and tags into a single tags array
  const allTags = [...post.categories, ...post.tags];
  if (allTags.length > 0) {
    lines.push('tags:');
    for (const tag of allTags) {
      lines.push(`  - "${escapeYaml(tag)}"`);
    }
  }

  return lines.join('\n') + '\n';
}

/** Escape YAML double-quoted strings. */
function escapeYaml(value: string): string {
  return value.replace(/"/g, '\\"');
}

/* ------------------------------------------------------------------ */
/*  Default I/O (overridden in tests)                                   */
/* ------------------------------------------------------------------ */

async function defaultWrite(path: string, content: string): Promise<void> {
  const { writeFile, mkdir } = await import('node:fs/promises');
  const { dirname } = await import('node:path');
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, content, 'utf-8');
}

async function defaultExists(path: string): Promise<boolean> {
  try {
    const { access } = await import('node:fs/promises');
    await access(path);
    return true;
  } catch {
    return false;
  }
}
