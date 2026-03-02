/* ---- Types ---- */
export type {
  FrontMatter, FrontMatter as SiteFrontMatter,
  ContentPage, ContentPage as SiteContentPage,
  TocEntry, TocEntry as SiteTocEntry,
  SiteConfig,
  AgentConfig, AgentConfig as SiteAgentConfig,
  WordPressConfig,
  DeployConfig, DeployConfig as SiteDeployConfig,
  NavigationSection,
  NavigationItem,
  SearchEntry, SearchEntry as SiteSearchEntry,
  CitationEntry, CitationEntry as SiteCitationEntry,
  CitationDatabase, CitationDatabase as SiteCitationDatabase,
  BuildResult, BuildResult as SiteBuildResult,
  TemplateData, TemplateData as SiteTemplateData,
  BuildOptions, BuildOptions as SiteBuildOptions,
} from './types.js';

/* ---- Build pipeline ---- */
export { build, processPage } from './build.js';

/* ---- Markdown processing ---- */
export { processMarkdown, resetCitationCounter, getCitationMap } from './markdown.js';

/* ---- Templates ---- */
export { loadTemplates, renderTemplate } from './templates.js';
export type { TemplateRegistry, TemplateRegistry as SiteTemplateRegistry } from './templates.js';

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
export type { FileOps, FileOps as SiteFileOps, FileOpsConfig, FileOpsConfig as SiteFileOpsConfig, ReadDirFn, StatFn } from './utils/index.js';

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
export type { ResolvedCitation, ResolvedCitation as SiteResolvedCitation, BibliographyEntry, BibliographyEntry as SiteBibliographyEntry, CitationResult, CitationResult as SiteCitationResult } from './citations.js';

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
export type { WpPost, WpApiAdapter, WpApiPushAdapter, WpPostData, PullOptions, PullOptions as SitePullOptions, PullResult, PullResult as SitePullResult, PushResult, PushResult as SitePushResult } from './wordpress/index.js';

/* ---- Deploy ---- */
export { deploy, dryRun, verifyDeployment } from './deploy.js';
export type { DeployAdapter, DeployAdapter as SiteDeployAdapter, DeployOptions, DeployOptions as SiteDeployOptions, DeployResult, DeployResult as SiteDeployResult, DryRunResult, DryRunResult as SiteDryRunResult, VerificationResult, VerificationResult as SiteVerificationResult, FetchFn } from './deploy.js';
