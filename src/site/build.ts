import type {
  BuildOptions,
  BuildResult,
  ContentPage,
  SiteConfig,
  NavigationSection,
} from './types';
import type { TemplateRegistry } from './templates';

/** Process a single page through the pipeline. */
export function processPage(
  _filePath: string,
  _rawContent: string,
  _siteConfig: SiteConfig,
  _templates: TemplateRegistry,
  _navigation: NavigationSection[],
): ContentPage {
  throw new Error('Not implemented');
}

/** Run the full build pipeline. */
export async function build(_options: BuildOptions): Promise<BuildResult> {
  throw new Error('Not implemented');
}
