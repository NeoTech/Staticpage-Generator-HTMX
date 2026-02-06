/**
 * SEO utilities — robots.txt and sitemap.xml generators.
 *
 * Both are written to the dist root at build time.
 */

import type { PageIndexEntry } from './page-index.js';

/**
 * Generate a robots.txt that allows all crawlers and points to the sitemap.
 */
export function generateRobotsTxt(siteUrl: string, basePath: string = ''): string {
  const cleanUrl = siteUrl.replace(/\/+$/, '');
  return [
    'User-agent: *',
    'Allow: /',
    '',
    `Sitemap: ${cleanUrl}${basePath}/sitemap.xml`,
    '',
  ].join('\n');
}

/**
 * Generate a sitemap.xml from the page index.
 *
 * Label index pages (url starting with basePath + "/label/") are excluded
 * because they are hidden navigation helpers, not canonical content.
 */
export function generateSitemap(
  pages: PageIndexEntry[],
  siteUrl: string,
  basePath: string = '',
): string {
  const cleanUrl = siteUrl.replace(/\/+$/, '');
  const labelPrefix = `${basePath}/label/`;

  const urls = pages
    .filter(p => !p.url.startsWith(labelPrefix))
    .map(page => {
      const lastmod = page.date ? `\n    <lastmod>${page.date}</lastmod>` : '';
      return `  <url>\n    <loc>${cleanUrl}${page.url}</loc>${lastmod}\n  </url>`;
    })
    .join('\n');

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    urls,
    '</urlset>',
    '',
  ].join('\n');
}
