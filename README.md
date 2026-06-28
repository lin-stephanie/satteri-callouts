# satteri-callouts

[![version][version-badge]][version-link]
[![codecov][coverage-badge]][coverage]
[![npm downloads][npm-downloads-src]][npm-downloads-href]
[![jsDocs.io][jsdocs-src]][jsdocs-href]

A [Satteri](https://satteri.bruits.org/docs/) HAST plugin for processing and rendering blockquote-based callouts.

## What is this?

This plugin adds support for callouts (admonitions/alerts), allowing you to use [Obsidian-style callout](https://help.obsidian.md/Editing+and+formatting/Callouts) syntax in Satteri's Markdown processing pipeline.

- Includes default callout types for multiple themes.
- Supports collapsible callouts with `-/+` and nested callouts.
- Optionally import stylesheets for corresponding themes.
- Allows custom titles with Markdown syntax.
- Customizable default callout types.
- Configurable new callout types.
- Configurable aliases for callout types.
- Configurable icon display.
- Configurable element tags and attributes.

## Installation

This package is ESM only. In Node.js 18+, install it with Satteri:

```sh
npm install satteri-callouts satteri
yarn add satteri-callouts satteri
pnpm add satteri-callouts satteri
```

In Deno with [`esm.sh`](https://esm.sh/):

```js
import satteriCallouts from 'https://esm.sh/satteri-callouts'
```

In browsers with [`esm.sh`](https://esm.sh/):

```html
<script type="module">
  import satteriCallouts from 'https://esm.sh/satteri-callouts?bundle'
</script>
```

## Usage

Say `example.md` contains:

```md
<!-- Callout type names are case-insensitive: 'Note', 'NOTE', and 'note' are equivalent. -->

> [!note] This is a _non-collapsible_ callout
> Some content is displayed directly!

> [!WARNING]- This is a **collapsible** callout
> Some content shown after opening!
```

Process it with Satteri:

```js
import { readFileSync } from 'node:fs'

import { markdownToHtml } from 'satteri'
import satteriCallouts from 'satteri-callouts'

const { html } = markdownToHtml(readFileSync('example.md', 'utf8'), {
  hastPlugins: [satteriCallouts()],
})

console.log(html)
```

Output:

```html
<div class="callout" data-callout="note" data-collapsible="false">
  <div class="callout-title">
    <div class="callout-title-icon" aria-hidden="true">
      <!-- svg icon -->
    </div>
    <div class="callout-title-text">
      This is a <em>non-collapsible</em> callout
    </div>
  </div>
  <div class="callout-content">
    <p>Some content is displayed directly!</p>
  </div>
</div>

<details class="callout" data-callout="warning" data-collapsible="true">
  <summary class="callout-title">
    <div class="callout-title-icon" aria-hidden="true">
      <!-- svg icon -->
    </div>
    <div class="callout-title-text">
      This is a <strong>collapsible</strong> callout
    </div>
    <div class="callout-fold-icon" aria-hidden="true">
      <!-- svg icon -->
    </div>
  </summary>
  <div class="callout-content">
    <p>Some content shown after opening!</p>
  </div>
</details>
```

Satteri passes raw HTML through as HAST `raw` nodes. This plugin also processes raw HTML fragments that contain blockquote callouts, so existing Markdown documents with literal HTML blockquotes can keep working inside the Satteri pipeline.

## API

This package exports no runtime identifiers other than the default export.

### `satteriCallouts(options?)`

Creates a Satteri HAST plugin definition. Pass the returned plugin to `markdownToHtml` and `mdxToJs` through `hastPlugins`.

### `UserOptions`

All fields are optional:

- `theme` (`'github' | 'obsidian' | 'vitepress' | 'docusaurus'`, default: `'obsidian'`) — default callout set and title casing.
- `callouts` ([`Record<string, CalloutConfig>`](https://github.com/lin-stephanie/satteri-callouts/blob/main/src/types.ts#L16), default: see [source code](https://github.com/lin-stephanie/satteri-callouts/tree/main/src/themes)) — configure default and custom callout types as key-value pairs, where each key is a callout type using characters ([a-z], [A-Z], [0-9]), underscores (\_), or hyphens (-), and each value specifies its default text and icon, e.g., `{'note': {title: 'custom title'}, 'custom-type': {title: 'new callout', indicator: '<svg ...">...</svg>'}}`.
- `aliases` (`Record<string, string[]>`, default: `{}`) — aliases for callout types, e.g., `{'note': ['n'], 'tip': ['t']}`.
- `showIndicator` (`boolean`, default: `true`) — whether to display type-specific icons before callout titles.
- `tags` ([`TagsConfig`](https://github.com/lin-stephanie/satteri-callouts/blob/main/src/types.ts#L42), default: all `div`) — HTML tag names for generated callout structure.
- `props` ([`PropsConfig`](https://github.com/lin-stephanie/satteri-callouts/blob/main/src/types.ts#L103), default: all `null`) — element properties for generated callout structure. Setting `class` or `className` overrides the default class name for that element.

## Styling

You can customize callout styles with class names or by importing one of the [theme-specific](#themes) stylesheets.

Import in JavaScript/TypeScript:

```ts
import 'satteri-callouts/theme/github'
// import 'satteri-callouts/theme/obsidian'
// import 'satteri-callouts/theme/vitepress'
// import 'satteri-callouts/theme/docusaurus'
```

Import in CSS:

```css
@import 'satteri-callouts/theme/github';
```

Import in Sass:

```scss
@use 'satteri-callouts/theme/github';
```

Directly include in HTML via CDN ([unpkg.com](https://unpkg.com) or [jsdelivr.net](https://www.jsdelivr.com/)):

```html
<link
  rel="stylesheet"
  href="https://unpkg.com/satteri-callouts/dist/themes/github/index.css"
/>
<link
  rel="stylesheet"
  href="https://cdn.jsdelivr.net/npm/satteri-callouts/dist/themes/github/index.css"
/>
```

Customize callout colors with CSS custom properties:

```css
/* Using CSS custom properties for default callouts only */
:root {
  --callout-note-color-light: pink;
  --callout-note-color-dark: #ffc0cb;
  --callout-tip-color-light: rgb(255, 192, 203);
  --callout-tip-color-dark: hsl(350, 100%, 88%);

  /* Customize default callout colors with:
     --callout-{type}-color-{light|dark}: <color>
   */

  /* Docusaurus theme only: customize the left border color in both light and dark modes */
  --callout-note-border-color: #ff66ab;
}

/* Using attribute selectors for both default and custom callouts */
/* Custom callouts default to #888 if no color is set */
[data-callout='warning'],
[data-callout='custom'] {
  --rc-color-light: pink;
  --rc-color-dark: #ffc0cb;

  /* Docusaurus theme only */
  --rc-border-color: #ff66aa;
}
```

### Themes

This package provides callout styles compatible with [GitHub](https://github.com/orgs/community/discussions/16925), [Obsidian](https://help.obsidian.md/Editing+and+formatting/Callouts), [VitePress](https://vitepress.dev/guide/markdown#github-flavored-alerts), and [Docusaurus](https://docusaurus.io/docs/markdown-features/admonitions), with dark mode support via the `.dark` class. See the [source code](https://github.com/lin-stephanie/satteri-callouts/tree/main/src/themes) for details.

#### GitHub

![github](https://raw.githubusercontent.com/lin-stephanie/assets/refs/heads/main/rehype-callouts/github.png)

#### Obsidian

![obsidian](https://raw.githubusercontent.com/lin-stephanie/assets/refs/heads/main/rehype-callouts/obsidian.png)

#### VitePress

![vitepress](https://raw.githubusercontent.com/lin-stephanie/assets/refs/heads/main/rehype-callouts/vitepress.png)

#### Docusaurus

![docusaurus](https://raw.githubusercontent.com/lin-stephanie/assets/refs/heads/main/rehype-callouts/docusaurus.png)

## Contribution

If you see any errors or room for improvement on this plugin, feel free to open an [issues](https://github.com/lin-stephanie/satteri-callouts/issues) or [pull request](https://github.com/lin-stephanie/satteri-callouts/pulls) . Thank you in advance for contributing!

## License

[MIT](https://github.com/lin-stephanie/satteri-callouts/blob/main/LICENSE) © 2026-PRESENT [Stephanie Lin](https://github.com/lin-stephanie)

<!-- Badges -->

[version-badge]: https://img.shields.io/github/v/release/lin-stephanie/satteri-callouts?label=release&style=flat&colorA=080f12&colorB=f87171
[version-link]: https://github.com/lin-stephanie/satteri-callouts/releases
[coverage-badge]: https://img.shields.io/codecov/c/github/lin-stephanie/satteri-callouts?style=flat&colorA=080f12&colorB=f87171
[coverage]: https://codecov.io/github/lin-stephanie/satteri-callouts
[npm-downloads-src]: https://img.shields.io/npm/dm/satteri-callouts?style=flat&colorA=080f12&colorB=f87171
[npm-downloads-href]: https://npmjs.com/package/satteri-callouts
[jsdocs-src]: https://img.shields.io/badge/jsdocs-reference-080f12?style=flat&colorA=080f12&colorB=f87171
[jsdocs-href]: https://www.jsdocs.io/package/satteri-callouts
