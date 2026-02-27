import yaml from 'js-yaml';
import type {
  BuildOptions,
  BuildResult,
  ContentPage,
  SiteConfig,
  NavigationSection,
  TemplateData,
} from './types';
import { loadTemplates, renderTemplate } from './templates';
import type { TemplateRegistry } from './templates';
import { parseFrontmatter } from './utils/frontmatter';
import { pathToSlug, slugToOutputPath, slugToUrl } from './utils/slug';
import { processMarkdown, resetCitationCounter } from './markdown';

/* ---- Single page processing ---- */

/**
 * Process a single page through the pipeline:
 * frontmatter parsing -> markdown rendering -> ContentPage creation.
 */
export function processPage(
  filePath: string,
  rawContent: string,
  _siteConfig: SiteConfig,
  _templates: TemplateRegistry,
  _navigation: NavigationSection[],
): ContentPage {
  const { frontmatter, content: markdownBody } = parseFrontmatter(rawContent, filePath);

  // Reset citation counter for each page
  resetCitationCounter();

  const { html, toc } = processMarkdown(markdownBody);

  const slug = pathToSlug(filePath);
  const outputPath = slugToOutputPath(slug);
  const url = slugToUrl(slug);

  // Word count from raw markdown (strip markdown syntax approximately)
  const wordCount = markdownBody
    .replace(/[#*_`\[\]()>-]/g, '')
    .split(/\s+/)
    .filter((w) => w.length > 0).length;

  return {
    frontmatter,
    content: html,
    rawMarkdown: markdownBody,
    sourcePath: filePath,
    outputPath,
    url,
    slug,
    toc,
    wordCount,
  };
}

/* ---- Template merging ---- */

function mergeTemplate(
  page: ContentPage,
  siteConfig: SiteConfig,
  templates: TemplateRegistry,
  navigation: NavigationSection[],
): { html: string; warning?: string } {
  const templateName = page.frontmatter.template ?? 'page';
  let warning: string | undefined;

  // Check if requested template exists, fall back to 'page'
  if (!templates.has(templateName) && templateName !== 'page') {
    warning = `Template "${templateName}" not found for ${page.sourcePath}, falling back to "page"`;
  }

  const resolvedTemplate = templates.has(templateName) ? templateName : 'page';

  const data: TemplateData = {
    page,
    site: siteConfig,
    navigation,
    currentSection: page.frontmatter.nav_section ?? '',
    buildDate: siteConfig.buildDate || new Date().toISOString().split('T')[0],
    schemaJsonLd: '{}',
  };

  const html = renderTemplate(resolvedTemplate, data, templates);
  return { html, warning };
}

/* ---- Build pipeline ---- */

/**
 * Run the full build pipeline:
 * 1. Load site config and navigation
 * 2. Load templates
 * 3. Walk content directory
 * 4. Process each page (frontmatter -> markdown -> template)
 * 5. Write output files
 * 6. Copy static assets
 */
export async function build(options: BuildOptions): Promise<BuildResult> {
  const startTime = Date.now();
  const warnings: string[] = [];
  let pagesBuilt = 0;
  let pagesSkipped = 0;

  const readFile = options.readFile ?? defaultReadFile;
  const writeFile = options.writeFile ?? defaultWriteFile;
  const walkDir = options.walkDir ?? defaultWalkDir;
  const ensureDir = options.ensureDir ?? defaultEnsureDir;
  const copyDir = options.copyDir ?? defaultCopyDir;

  // 1. Load site config
  const siteYaml = await readFile(`${options.dataDir}/site.yaml`);
  const siteConfig = yaml.load(siteYaml) as SiteConfig;
  if (!siteConfig.buildDate) {
    siteConfig.buildDate = new Date().toISOString().split('T')[0];
  }

  // 2. Load navigation
  const navYaml = await readFile(`${options.dataDir}/navigation.yaml`);
  const navigation = (yaml.load(navYaml) as NavigationSection[]) ?? [];

  // 3. Load templates
  const templates = await loadTemplates(options.templateDir, readFile, walkDir);

  // 4. Walk content directory for .md files
  let contentFiles: string[];
  try {
    contentFiles = await walkDir(options.contentDir);
    contentFiles = contentFiles.filter((f) => f.endsWith('.md'));
  } catch {
    contentFiles = [];
  }

  // 5. Process each page
  await ensureDir(options.outputDir);

  for (const file of contentFiles) {
    const rawContent = await readFile(`${options.contentDir}/${file}`);

    // Check for missing frontmatter
    if (!rawContent.trimStart().startsWith('---')) {
      warnings.push(`Missing frontmatter in ${file}`);
    }

    const page = processPage(file, rawContent, siteConfig, templates, navigation);

    // Skip drafts unless includeDrafts is set
    if (page.frontmatter.draft && !options.includeDrafts) {
      pagesSkipped += 1;
      continue;
    }

    // Merge with template
    const { html, warning } = mergeTemplate(page, siteConfig, templates, navigation);
    if (warning) {
      warnings.push(warning);
    }

    // Write output
    const outputPath = `${options.outputDir}/${page.outputPath}`;
    const outputDir = outputPath.substring(0, outputPath.lastIndexOf('/'));
    await ensureDir(outputDir);
    await writeFile(outputPath, html);

    pagesBuilt += 1;
  }

  // 6. Copy static assets
  try {
    await copyDir(options.staticDir, `${options.outputDir}/assets`);
  } catch {
    // Static dir may not exist, that's fine
  }

  return {
    pagesBuilt,
    pagesSkipped,
    warnings,
    elapsedMs: Date.now() - startTime,
    outputDir: options.outputDir,
  };
}

/* ---- Default I/O implementations (not used in tests) ---- */

async function defaultReadFile(path: string): Promise<string> {
  const { readFile: fsRead } = await import('node:fs/promises');
  return fsRead(path, 'utf-8');
}

async function defaultWriteFile(path: string, content: string): Promise<void> {
  const { writeFile: fsWrite } = await import('node:fs/promises');
  await fsWrite(path, content, 'utf-8');
}

async function defaultWalkDir(dir: string): Promise<string[]> {
  const { walkMarkdownFiles } = await import('./utils/files');
  return walkMarkdownFiles(dir);
}

async function defaultEnsureDir(path: string): Promise<void> {
  const { mkdir } = await import('node:fs/promises');
  await mkdir(path, { recursive: true });
}

async function defaultCopyDir(src: string, dest: string): Promise<void> {
  const { cp } = await import('node:fs/promises');
  await cp(src, dest, { recursive: true });
}
