# Templates

Templates are plain HTML files with `{{tag}}` placeholders that define the page skeleton. No TypeScript needed — just HTML.

## Location

Templates live in the `templates/` directory at the project root:

```
templates/
├── default.html      # Standard page (nav, content, footer)
├── blank.html        # Minimal shell (no nav, no footer)
└── blog-post.html    # Article layout (byline, reading time)
```

## Selecting a Template

Set the `Template` frontmatter field in any content file:

```markdown
---
title: My Post
Template: blog-post
---
```

If omitted, `default` is used. If the named template doesn't exist, it falls back to `default`.

## Creating a New Template

1. Create `templates/<name>.html`
2. Use `{{tag}}` placeholders and `{{#if tag}}...{{/if}}` conditionals
3. Set `Template: <name>` in content frontmatter
4. Build — that's it

### Example: A minimal "landing" template

```html
{{head}}
<body class="bg-black text-white">
    <div class="max-w-4xl mx-auto py-16 px-4">
        {{content}}
    </div>
    {{foot-scripts}}
</body>
</html>
```

## Available Tags

### Structural Tags

| Tag | Output |
|-----|--------|
| `{{head}}` | Full `<!DOCTYPE html><html><head>...</head>` with meta tags, title, CSS |
| `{{navigation}}` | Site navigation bar (renders the `Navigation` component) |
| `{{content}}` | Pre-compiled page content from markdown |
| `{{label-footer}}` | Site-wide label cloud footer |
| `{{foot-scripts}}` | Closing `<script>` tags (main.js) |
| `{{blog-header}}` | Full article header: category pill, title, byline, reading time, label badges |

### Scalar Tags

| Tag | Output |
|-----|--------|
| `{{title}}` | Page title text |
| `{{description}}` | Meta description text |
| `{{keywords}}` | Meta keywords text |
| `{{author}}` | Page author |
| `{{category}}` | Page category |
| `{{basePath}}` | URL base path prefix (e.g. `/Flint`) |
| `{{formatted-date}}` | Human-readable date (e.g. "February 1, 2026") |
| `{{reading-time}}` | Estimated reading time (e.g. "3 min read") |

### Fragment Tags

| Tag | Output |
|-----|--------|
| `{{category-pill}}` | Category badge `<span>` |
| `{{label-badges}}` | Label badge `<span>` elements |

### Conditionals

Wrap any block in `{{#if tagName}}...{{/if}}` to only render it when the tag resolves to a non-empty value:

```html
{{#if navigation}}
{{navigation}}
{{/if}}

{{#if label-footer}}
{{label-footer}}
{{/if}}
```

This is useful for tags like `navigation` (empty when no nav items) and `label-footer` (empty when no labels).

## Built-in Templates

### default.html

Standard page layout with navigation bar, content area (max-w-7xl), and label footer.

### blank.html

Bare-minimum shell — just `{{head}}`, content, and scripts. No navigation, no footer, no wrapper divs. Use for landing pages or fully custom layouts where the markdown provides all structure.

### blog-post.html

Article layout with:
- Navigation bar
- Narrow content column (max-w-3xl) with `<article>` semantic markup
- `{{blog-header}}` — category pill, title, author/date/reading-time byline, label badges
- Post content in a `.post-content` wrapper
- Label footer

Designed for `Type: post` content with `Author`, `Date`, `Category`, and `Labels` frontmatter fields.

## Architecture

The template system has three layers:

1. **HTML template files** (`templates/*.html`) — authored by content creators
2. **Tag engine** (`src/templates/tag-engine.ts`) — resolves `{{tag}}` placeholders to HTML
3. **Template registry** (`src/templates/template-registry.ts`) — loads files from disk, renders via tag engine

Templates delegate to existing **components** (Navigation, LabelFooter) for complex UI rendering. To add new dynamic elements, add a new tag to the tag engine and use it in templates.
