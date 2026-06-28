import { readFileSync } from 'node:fs'

import { fromHtml } from 'hast-util-from-html'
import { minifyWhitespace } from 'hast-util-minify-whitespace'
import { toHtml } from 'hast-util-to-html'
import { markdownToHtml } from 'satteri'
import { test, expect } from 'vitest'

import satteriCallouts from '../src/index.js'

import type { UserOptions } from '../src/types.js'

function run(name: string, options?: UserOptions, fromHtml = false) {
  test(name, async () => {
    const inputPath = `./test/fixtures/${name}/input.${fromHtml ? 'html' : 'md'}`
    const input = readFileSync(inputPath, 'utf8')
    const result = await markdownToHtml(input, {
      hastPlugins: [satteriCallouts(options)],
    })
    const actual = normalizeHtml(result.html)
    const expected = normalizeHtml(
      readFileSync(`./test/fixtures/${name}/output.html`, 'utf8')
    )

    expect(actual).toBe(expected)
  })
}

function normalizeHtml(value: string): string {
  const tree = fromHtml(value, { fragment: true })
  minifyWhitespace(tree)

  return toHtml(tree)
}

run('openOrClose')
run('readmeExample')
run('inListItem')
run('basic', { showIndicator: false })
run('fromHtml', { showIndicator: false }, true)
run('collapsibleCallouts', { showIndicator: false })
run('markdownInTitle', { showIndicator: false })
run('nestedCallouts', { showIndicator: false })
run('showIndicator', { aliases: { note: ['n'] } })
run('github', {
  theme: 'github',
  callouts: {
    customtype: {},
  },
})
run('obsidian', {
  theme: 'obsidian',
  callouts: {
    customtype: {},
  },
})
run('vitepress', {
  theme: 'vitepress',
  callouts: {
    customtype: {},
  },
})
run('docusaurus', {
  theme: 'docusaurus',
  callouts: {
    customtype: {},
  },
})
run('customAliases', {
  aliases: { note: ['no', 'n'], tip: ['t', 'T'] },
  showIndicator: false,
})
run('customCallouts', {
  callouts: {
    'custom-type': {
      title: 'Custom Type',
      indicator:
        '<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24"><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m3 11l19-9l-9 19l-2-8z"/></svg>',
    },
    'noindicator': {
      title: 'NO INDICATOR',
    },
    'notitle': {
      indicator:
        '<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24"><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m3 11l19-9l-9 19l-2-8z"/></svg>',
    },
    'nothing': {},
  },
})
run('modifyCallouts', {
  callouts: {
    note: {
      title: 'Modified title',
    },
    tip: {
      title: 'Modified indicator',
      indicator:
        '<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24"><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m3 11l19-9l-9 19l-2-8z"/></svg>',
    },
    important: {
      title: '',
    },
    warning: {
      title: '  ',
    },
  },
})
run('customTags', {
  tags: {
    nonCollapsibleContainerTagName: 'blockquote',
    nonCollapsibleTitleTagName: 'h6',
    contentTagName: 'blockquote',
    titleIconTagName: 'span',
    titleTextTagName: 'div',
    foldIconTagName: 'span',
  },
})
run('customProps', {
  props: {
    containerProps(_, type) {
      const newProps: Record<string, string> = {
        dir: 'auto',
        className: 'custom-callout',
      }

      if (type === 'note')
        newProps.style =
          '--callout-color-light: rgb(8, 109, 221); --callout-color-dark: rgb(2, 122, 255);'

      return newProps
    },
    titleProps: { className: ['custom-title-class1', 'custom-title-class2'] },
    contentProps: { class: 'custom-content-class' },
    titleIconProps: {
      class: ['custom-icon-class1', 'custom-icon-class2'],
    },
    titleTextProps: {},
    foldIconProps: {},
  },
})
