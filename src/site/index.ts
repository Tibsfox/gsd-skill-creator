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
} from './types';

/* ---- Build pipeline ---- */
export { build, processPage } from './build';

/* ---- Markdown processing ---- */
export { processMarkdown, resetCitationCounter, getCitationMap } from './markdown';

/* ---- Templates ---- */
export { loadTemplates, renderTemplate } from './templates';
export type { TemplateRegistry } from './templates';

/* ---- Utilities ---- */
export {
  parseFrontmatter,
  pathToSlug,
  slugToOutputPath,
  slugToUrl,
  walkMarkdownFiles,
  createFileOps,
  extractToc,
} from './utils';
export type { FileOps, FileOpsConfig, ReadDirFn, StatFn } from './utils';

/* ---- Agent discovery ---- */
export {
  generateLlmsTxt,
  generateLlmsFullTxt,
  generateAgentsMd,
  generateSchemaOrg,
  generateMarkdownMirror,
} from './agents';

/* ---- Search ---- */
export { buildSearchIndex, stripMarkdownSyntax } from './search';

/* ---- Citations ---- */
export { resolveCitations, generateBibliography, formatCitation } from './citations';
export type { ResolvedCitation, BibliographyEntry, CitationResult } from './citations';

/* ---- Feed ---- */
export { generateAtomFeed } from './feed';

/* ---- Sitemap ---- */
export { generateSitemap, generateRobotsTxt, generateHtaccess } from './sitemap';

/* ---- WordPress ---- */
export {
  generateCommentSection,
  htmlToMarkdown,
  pullContent,
  pushContent,
} from './wordpress';
export type { WpPost, WpApiAdapter, WpApiPushAdapter, WpPostData, PullOptions, PullResult, PushResult } from './wordpress';

/* ---- Deploy ---- */
export { deploy, dryRun, verifyDeployment } from './deploy';
export type { DeployAdapter, DeployOptions, DeployResult, DryRunResult, VerificationResult, FetchFn } from './deploy';
