/** YAML frontmatter fields for every content page */
export interface FrontMatter {
  title: string;
  description?: string;
  template?: string;
  date?: string;
  updated?: string;
  author?: string;
  tags?: string[];
  agent_visible?: boolean;
  agent_priority?: 'high' | 'medium' | 'low';
  schema_type?: string;
  nav_section?: string;
  nav_order?: number;
  draft?: boolean;
  comments?: boolean;
  wp_post_id?: number;
  wp_sync?: boolean;
  original_url?: string;
}

/** A processed content page ready for template merging */
export interface ContentPage {
  frontmatter: FrontMatter;
  content: string;
  rawMarkdown: string;
  sourcePath: string;
  outputPath: string;
  url: string;
  slug: string;
  toc: TocEntry[];
  wordCount: number;
}

/** Table of contents entry extracted from headings */
export interface TocEntry {
  level: number;
  text: string;
  id: string;
}

/** Site-wide configuration from _data/site.yaml */
export interface SiteConfig {
  title: string;
  description: string;
  url: string;
  author: string;
  language: string;
  buildDate: string;
  agent: AgentConfig;
  wordpress?: WordPressConfig;
  deploy?: DeployConfig;
}

/** Agent layer configuration */
export interface AgentConfig {
  llms_txt: boolean;
  llms_full: boolean;
  agents_md: boolean;
  schema_org: boolean;
  markdown_mirror: boolean;
}

/** WordPress integration configuration */
export interface WordPressConfig {
  url: string;
  api: string;
  comments_enabled: boolean;
  comments_moderation: boolean;
}

/** Deployment configuration */
export interface DeployConfig {
  method: 'ftp' | 'rsync';
  host: string;
  user: string;
  path: string;
  exclude: string[];
}

/** Navigation structure from _data/navigation.yaml */
export interface NavigationSection {
  id: string;
  label: string;
  items: NavigationItem[];
}

export interface NavigationItem {
  label: string;
  url: string;
  external?: boolean;
}

/** Search index entry (compressed keys for size) */
export interface SearchEntry {
  t: string;
  d: string;
  u: string;
  g: string[];
  x: string;
}

/** Citation database entry */
export interface CitationEntry {
  type: string;
  authors: string[];
  title: string;
  year: number;
  publisher?: string;
  journal?: string;
  volume?: string;
  pages?: string;
  doi?: string;
  isbn?: string;
  url?: string;
  edition?: string;
}

/** Citation database keyed by citation key */
export interface CitationDatabase {
  [key: string]: CitationEntry;
}

/** Build result returned by the build orchestrator */
export interface BuildResult {
  pagesBuilt: number;
  pagesSkipped: number;
  warnings: string[];
  elapsedMs: number;
  outputDir: string;
}

/** Template rendering data context */
export interface TemplateData {
  page: ContentPage;
  site: SiteConfig;
  navigation: NavigationSection[];
  currentSection: string;
  buildDate: string;
  schemaJsonLd: string;
}

/** Build orchestrator options */
export interface BuildOptions {
  contentDir: string;
  templateDir: string;
  dataDir: string;
  staticDir: string;
  outputDir: string;
  includeDrafts?: boolean;
  clean?: boolean;
  readFile?: (path: string) => Promise<string>;
  writeFile?: (path: string, content: string) => Promise<void>;
  walkDir?: (dir: string) => Promise<string[]>;
  ensureDir?: (path: string) => Promise<void>;
  copyDir?: (src: string, dest: string) => Promise<void>;
}
