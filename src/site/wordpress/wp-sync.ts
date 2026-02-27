import { htmlToMarkdown } from './html-to-md';
import { parseFrontmatter } from '../utils/frontmatter';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface WpPost {
  id: number;
  title: string;
  content: string;
  date: string;
  modified: string;
  slug: string;
  categories: string[];
  tags: string[];
  link: string;
}

export interface WpApiAdapter {
  fetchPosts(params: { since?: string; postId?: number }): Promise<WpPost[]>;
}

export interface WpApiPushAdapter {
  createPost(data: WpPostData): Promise<{ id: number }>;
  updatePost(id: number, data: WpPostData): Promise<void>;
}

export interface WpPostData {
  title: string;
  content: string;
  status?: string;
}

export type WriteFn = (path: string, content: string) => Promise<void>;
export type ReadFileFn = (path: string) => Promise<string>;

export interface PullOptions {
  since?: string;
  writeFn?: WriteFn;
}

export interface PullResult {
  pulled: number;
  files: string[];
}

export interface PushResult {
  action: 'created' | 'updated';
  postId: number;
}

/* ------------------------------------------------------------------ */
/*  Pull: WordPress -> local markdown                                   */
/* ------------------------------------------------------------------ */

/**
 * Pull posts from WordPress via the adapter and write them as
 * markdown files with YAML frontmatter to `outputDir`.
 */
export async function pullContent(
  api: WpApiAdapter,
  outputDir: string,
  options: PullOptions = {},
): Promise<PullResult> {
  const posts = await api.fetchPosts({ since: options.since });
  const writeFn = options.writeFn ?? defaultWrite;
  const files: string[] = [];

  for (const post of posts) {
    const md = htmlToMarkdown(post.content);
    const frontmatter = buildFrontmatter(post);
    const filePath = `${outputDir}/${post.slug}.md`;
    const fileContent = `---\n${frontmatter}---\n${md}\n`;

    await writeFn(filePath, fileContent);
    files.push(filePath);
  }

  return { pulled: posts.length, files };
}

function buildFrontmatter(post: WpPost): string {
  const lines: string[] = [];
  lines.push(`title: "${escapeYaml(post.title)}"`);
  lines.push(`date: "${post.date}"`);
  lines.push(`modified: "${post.modified}"`);
  lines.push(`wp_post_id: ${post.id}`);
  lines.push(`wp_sync: true`);
  lines.push(`slug: "${post.slug}"`);

  if (post.categories.length > 0) {
    lines.push('tags:');
    for (const cat of post.categories) {
      lines.push(`  - "${escapeYaml(cat)}"`);
    }
  }
  if (post.tags.length > 0) {
    for (const tag of post.tags) {
      lines.push(`  - "${escapeYaml(tag)}"`);
    }
  }

  lines.push(`original_url: "${post.link}"`);
  return lines.join('\n') + '\n';
}

function escapeYaml(value: string): string {
  return value.replace(/"/g, '\\"');
}

/* ------------------------------------------------------------------ */
/*  Push: local markdown -> WordPress                                   */
/* ------------------------------------------------------------------ */

/**
 * Push a local markdown file to WordPress.
 * Creates a new post or updates an existing one based on `wp_post_id`
 * in the frontmatter.
 */
export async function pushContent(
  api: WpApiPushAdapter,
  filePath: string,
  readFn: ReadFileFn = defaultRead,
): Promise<PushResult> {
  const raw = await readFn(filePath);
  const { frontmatter, content } = parseFrontmatter(raw, filePath);

  const postData: WpPostData = {
    title: frontmatter.title,
    content: content,
    status: frontmatter.draft ? 'draft' : 'publish',
  };

  if (frontmatter.wp_post_id != null) {
    await api.updatePost(frontmatter.wp_post_id, postData);
    return { action: 'updated', postId: frontmatter.wp_post_id };
  }

  const result = await api.createPost(postData);
  return { action: 'created', postId: result.id };
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

async function defaultRead(path: string): Promise<string> {
  const { readFile } = await import('node:fs/promises');
  return readFile(path, 'utf-8');
}
