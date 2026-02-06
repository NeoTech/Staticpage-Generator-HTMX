/**
 * Shared helpers for page templates.
 *
 * Extract the repetitive <head>, <script>, and document-shell logic
 * so every template stays DRY and consistent.
 */

export interface HeadOptions {
  title: string;
  basePath: string;
  description?: string;
  keywords?: string;
  lang?: string;
  cssFiles?: string[];
  jsFiles?: string[];
}

/**
 * Render the <!DOCTYPE html>, <html>, and <head> section (unclosed <body>).
 * Every template should start with this to guarantee consistent meta tags,
 * base-path, and asset loading.
 */
export function renderHead(opts: HeadOptions): string {
  const {
    title,
    basePath,
    description = '',
    keywords = '',
    lang = 'en',
    cssFiles = [],
    jsFiles = [],
  } = opts;

  const descTag = description
    ? `\n    <meta name="description" content="${description}">`
    : '';
  const kwTag = keywords
    ? `\n    <meta name="keywords" content="${keywords}">`
    : '';

  const extraCss = cssFiles
    .map(f => `\n    <link rel="stylesheet" href="${f}">`)
    .join('');
  const extraJs = jsFiles
    .map(f => `\n    <script src="${f}"></script>`)
    .join('');

  return `<!DOCTYPE html>
<html lang="${lang}">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">${descTag}${kwTag}
    <meta name="base-path" content="${basePath}">
    <title>${title}</title>
    <link rel="stylesheet" href="${basePath}/assets/main.css">${extraCss}${extraJs}
</head>`;
}

/**
 * Render the closing scripts and tags that go right before </body>.
 */
export function renderFootScripts(basePath: string): string {
  return `    <script src="${basePath}/assets/main.js"></script>`;
}
