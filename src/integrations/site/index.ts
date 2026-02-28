/* ---- Types ---- */
export type {
  FrontMatter,
  ContentPage,
  TocEntry,
  SiteConfig,
  AgentConfig,
  WordPressConfig,
  DeployConfig,
  NavigationSection,
  NavigationItem,
  SearchEntry,
  CitationEntry,
  CitationDatabase,
  BuildResult,
  TemplateData,
  BuildOptions,
} from './types.js';

/* ---- Build pipeline ---- */
export { build, processPage } from './build.js';

/* ---- Markdown processing ---- */
export { processMarkdown, resetCitationCounter, getCitationMap } from './markdown.js';

/* ---- Templates ---- */
export { loadTemplates, renderTemplate } from './templates.js';
export type { TemplateRegistry } from './templates.js';

/* ---- Utilities ---- */
export {
  parseFrontmatter,
  pathToSlug,
  slugToOutputPath,
  slugToUrl,
  walkMarkdownFiles,
  createFileOps,
  extractToc,
} from './utils/index.js';
export type { FileOps, FileOpsConfig, ReadDirFn, StatFn } from './utils/index.js';

/* ---- Agent discovery ---- */
export {
  generateLlmsTxt,
  generateLlmsFullTxt,
  generateAgentsMd,
  generateSchemaOrg,
  generateMarkdownMirror,
} from './agents/index.js';

/* ---- Search ---- */
export { buildSearchIndex, stripMarkdownSyntax } from './search.js';

/* ---- Citations ---- */
export { resolveCitations, generateBibliography, formatCitation } from './citations.js';
export type { ResolvedCitation, BibliographyEntry, CitationResult } from './citations.js';

/* ---- Feed ---- */
export { generateAtomFeed } from './feed.js';

/* ---- Sitemap ---- */
export { generateSitemap, generateRobotsTxt, generateHtaccess } from './sitemap.js';

/* ---- WordPress ---- */
export {
  generateCommentSection,
  htmlToMarkdown,
  pullContent,
  pushContent,
} from './wordpress/index.js';
export type { WpPost, WpApiAdapter, WpApiPushAdapter, WpPostData, PullOptions, PullResult, PushResult } from './wordpress/index.js';

/* ---- Deploy ---- */
export { deploy, dryRun, verifyDeployment } from './deploy.js';
export type { DeployAdapter, DeployOptions, DeployResult, DryRunResult, VerificationResult, FetchFn } from './deploy.js';
