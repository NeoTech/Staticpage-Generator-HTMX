# Architecture

Flint is a static site generator built around a simple pipeline: **Markdown in → HTML out**. This document explains the high-level architecture, data flow, and the design decisions behind each layer.

## System Overview

```
content/*.md          src/components/         src/core/
┌──────────────┐     ┌───────────────────┐   ┌──────────────────────┐
│ YAML         │     │ Component<T>      │   │ frontmatter.ts       │
│ Frontmatter  │────▶│ Layout            │   │ page-metadata.ts     │
│ + Markdown   │     │ Navigation        │   │ markdown.ts          │
│ body         │     │ TreeMenu          │   │ htmx-markdown.ts     │
└──────┬───────┘     │ CategoryNav       │   │ html-blocks.ts       │
       │             │ LabelCloud        │   │ template.ts          │
       │             └───────┬───────────┘   │ hierarchy.ts         │
       │                     │               │ index-generator.ts   │
       │                     │               │ builder.ts           │
       ▼                     ▼               └──────────┬───────────┘
  ┌──────────────────────────────────────────────────────┘
  │                  Build Pipeline
  │  ┌─────────────────────────────────────────────────┐
  │  │ 1. Scan content/ for *.md files                 │
  │  │ 2. Parse YAML frontmatter → PageMetadata        │
  │  │ 3. Generate navigation from Parent: root pages  │
  │  │ 4. Preprocess: extract :::html blocks           │
  │  │ 5. Preprocess: convert [text](url){hx-attrs}   │
  │  │ 6. Compile Markdown → HTML (marked)             │
  │  │ 7. Restore raw HTML blocks                      │
  │  │ 8. Wrap in Layout + Navigation components       │
  │  │ 9. Write to dist/ with clean URLs               │
  │  └─────────────────────────────────────────────────┘
  │
  ▼
dist/
├── index.html
├── about/index.html
├── blog/index.html
├── blog/post-slug/index.html
└── assets/
    ├── main.css   (Tailwind, built by Rspack)
    └── main.js    (HTMX bundle, built by Rspack)
```

## Three Layers

### 1. Core (`src/core/`)

The engine. Stateless functions and classes that parse, compile, and build.

| Module | Responsibility |
|---|---|
| `frontmatter.ts` | Splits YAML header from Markdown body using `gray-matter` |
| `page-metadata.ts` | Normalises raw frontmatter into a typed `PageMetadata` object |
| `markdown.ts` | Compiles Markdown to HTML (orchestrates the preprocessing pipeline) |
| `htmx-markdown.ts` | Converts `[text](url){hx-attrs}` links into HTMX-powered elements |
| `html-blocks.ts` | Extracts `:::html` / `:::` blocks before compilation, restores after |
| `template.ts` | Assembles content + navigation + layout into a full HTML page |
| `hierarchy.ts` | Builds the page tree from `Parent` fields (breadcrumbs, tree menus) |
| `index-generator.ts` | Generates category and label index pages from metadata |
| `builder.ts` | Orchestrator — scans, processes, writes the entire site |

### 2. Components (`src/components/`)

Pure rendering functions. Each component extends `Component<T>`, accepts typed props, and returns an HTML string. No side effects, no DOM manipulation.

| Component | Purpose |
|---|---|
| `Component<T>` | Abstract base class — provides `render()`, `escapeHtml()`, `classNames()` |
| `Layout` | Full HTML document shell (`<html>`, `<head>`, `<body>`) |
| `Navigation` | Top-level nav bar with active state and HTMX boost support |
| `TreeMenu` | Hierarchical sidebar navigation (collapsible tree) |
| `CategoryNav` | Pill-style category filter links with counts |
| `LabelCloud` | Weighted tag cloud with size scaling by frequency |

### 3. Build & Config (root + `scripts/`)

| File | Purpose |
|---|---|
| `scripts/build.ts` | Entry point: creates `SiteBuilder`, runs build, copies static assets |
| `rspack.config.ts` | Bundles `src/index.ts` → JS + CSS for the browser (HTMX, Tailwind) |
| `package.json` | Scripts: `dev`, `build`, `test`, `lint`, `typecheck` |

## Data Flow in Detail

### Phase 1: Parse

```
content/blog/post.md
  │
  ├── gray-matter ──▶ { data: { title, Category, Labels, Parent, Order, ... },
  │                     content: "# Markdown body..." }
  │
  └── parsePageMetadata() ──▶ PageMetadata {
        shortUri: "my-post",
        title: "My Post",
        type: "post",
        category: "Tutorials",
        labels: ["htmx", "beginner"],
        parent: "blog",
        order: 1,
        ...
      }
```

### Phase 2: Navigation

The builder reads metadata from **all** content files, then:

1. **Filters** pages where `parent === 'root'` → top-level navigation items
2. **Sorts** by `order` (ascending), then alphabetically
3. For each page being rendered, marks the matching nav item as `active`

### Phase 3: Compile

The Markdown body passes through three stages:

```
  Raw markdown (with :::html blocks and [text](url){hx-attrs})
      │
      ▼
  extractHtmlBlocks()       → replaces :::html/:::: with <!--HTML_BLOCK_N--> placeholders
      │
      ▼
  processHtmxMarkdown()    → converts [text](url){hx-get hx-target=#id} to <a hx-get=...>
      │
      ▼
  marked.parse()           → standard Markdown → HTML compilation
      │
      ▼
  restoreHtmlBlocks()      → replaces <!--HTML_BLOCK_N--> with original raw HTML
      │
      ▼
  Final HTML string
```

### Phase 4: Render

The template engine wraps compiled content in the component tree:

```
  Layout (full HTML document)
    └── Navigation (top bar)
    └── <main>
          └── compiled content HTML
        </main>
    └── <script src="main.js"> (HTMX bundle)
```

### Phase 5: Write

Output paths use **clean URLs**:

| Input | Output |
|---|---|
| `content/index.md` | `dist/index.html` |
| `content/about.md` | `dist/about/index.html` |
| `content/blog/index.md` | `dist/blog/index.html` |
| `content/blog/post.md` | `dist/blog/post/index.html` |

## Design Decisions

### Why TypeScript classes for components?

Components are just functions that return strings. The class pattern (`Component<T>`) provides:
- **Typed props** via generics — compile-time safety
- **Shared utilities** — `escapeHtml()`, `classNames()`
- **Static `render()`** — one-liner instantiation: `Navigation.render({ items })`

No virtual DOM, no runtime. The output is a string that gets written to a file.

### Why preprocessors instead of marked plugins?

Marked plugins operate at the token level. HTMX attribute syntax (`{hx-get ...}`) and raw HTML blocks (`:::html`) are easier to handle as **text transforms before marked runs**. This keeps each concern isolated and independently testable.

### Why HTMX instead of a JS framework?

Flint generates static HTML. HTMX adds interactivity by loading HTML fragments on demand — no client-side routing, no hydration, no build step for the interactive parts. The HTMX library (14 KB) is bundled offline via Rspack.

### Why Rspack?

Rspack handles the **browser bundle** (Tailwind CSS + HTMX JS). The **site build** uses Node.js directly via `tsx`. This separation means:
- `npm run build` → Node.js compiles Markdown → HTML (fast, no bundler overhead)
- `npm run dev` → Rspack serves `dist/` with HMR for CSS/JS changes

### Why co-located tests?

Every module has a `.test.ts` file next to it. This makes it obvious which tests cover which code, and ensures tests are updated when the module changes. The project has **162 tests** across 15 test files.
