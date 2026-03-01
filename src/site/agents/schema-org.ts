import type { ContentPage, SiteConfig } from '../types.js';
import type { Article, TechArticle, Book, Course, WebSite, WebPage, WithContext } from 'schema-dts';

interface SchemaObject {
  '@context'?: string;
  '@type': string;
  [key: string]: unknown;
}

/** Build the primary schema object based on schema_type */
function buildPrimarySchema(page: ContentPage, site: SiteConfig): SchemaObject {
  const absoluteUrl = `${site.url}${page.url}`;
  const fm = page.frontmatter;
  const schemaType = fm.schema_type ?? 'WebPage';

  const author = fm.author ?? site.author;
  const authorObj = {
    '@type': 'Person' as const,
    name: author,
  };

  switch (schemaType) {
    case 'Article':
      return {
        '@context': 'https://schema.org',
        '@type': 'Article',
        headline: fm.title,
        description: fm.description ?? '',
        datePublished: fm.date ?? '',
        dateModified: fm.updated ?? fm.date ?? '',
        author: authorObj,
        url: absoluteUrl,
      };

    case 'TechArticle':
      return {
        '@context': 'https://schema.org',
        '@type': 'TechArticle',
        headline: fm.title,
        description: fm.description ?? '',
        datePublished: fm.date ?? '',
        dateModified: fm.updated ?? fm.date ?? '',
        author: authorObj,
        proficiencyLevel: 'Beginner',
        url: absoluteUrl,
      };

    case 'Book':
      return {
        '@context': 'https://schema.org',
        '@type': 'Book',
        name: fm.title,
        author: authorObj,
        datePublished: fm.date ?? '',
        url: absoluteUrl,
      };

    case 'Course':
      return {
        '@context': 'https://schema.org',
        '@type': 'Course',
        name: fm.title,
        description: fm.description ?? '',
        provider: {
          '@type': 'Organization',
          name: site.title,
          url: site.url,
        },
        url: absoluteUrl,
      };

    case 'WebSite':
      return {
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        name: fm.title,
        url: site.url,
        description: fm.description ?? site.description,
        potentialAction: {
          '@type': 'SearchAction',
          target: `${site.url}/search?q={search_term_string}`,
          'query-input': 'required name=search_term_string',
        },
      };

    default:
      return {
        '@context': 'https://schema.org',
        '@type': 'WebPage',
        name: fm.title,
        url: absoluteUrl,
        description: fm.description ?? '',
        dateModified: fm.updated ?? fm.date ?? '',
      };
  }
}

/** Build BreadcrumbList from URL path segments */
function buildBreadcrumbList(page: ContentPage, site: SiteConfig): SchemaObject {
  const segments = page.url.split('/').filter(Boolean);
  const items: Array<{ '@type': string; position: number; name: string; item: string }> = [];

  // Always start with Home
  items.push({
    '@type': 'ListItem',
    position: 1,
    name: 'Home',
    item: site.url,
  });

  // Build path progressively
  let path = '';
  for (let i = 0; i < segments.length; i++) {
    path += `/${segments[i]}`;
    const name = segments[i]
      .replace(/-/g, ' ')
      .replace(/\b\w/g, (c: string) => c.toUpperCase());
    items.push({
      '@type': 'ListItem',
      position: i + 2,
      name,
      item: `${site.url}${path}/`,
    });
  }

  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items,
  };
}

/**
 * Generate Schema.org JSON-LD for a single page.
 *
 * Returns a JSON string containing an array with:
 * 1. The primary schema object (Article, TechArticle, Book, Course, WebSite, or WebPage)
 * 2. A BreadcrumbList derived from the URL path
 */
export function generateSchemaOrg(page: ContentPage, site: SiteConfig): string {
  const primary = buildPrimarySchema(page, site);
  const breadcrumbs = buildBreadcrumbList(page, site);

  // Remove @context from breadcrumbs to avoid duplication when in array
  const breadcrumbsClean = { ...breadcrumbs };
  delete breadcrumbsClean['@context'];

  // Remove @context from primary too, put it at top level
  const primaryClean = { ...primary };
  delete primaryClean['@context'];

  return JSON.stringify(
    [
      { '@context': 'https://schema.org', ...primaryClean },
      { '@context': 'https://schema.org', ...breadcrumbsClean },
    ],
    null,
    2,
  );
}
