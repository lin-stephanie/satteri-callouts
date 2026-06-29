import { fromHtml } from 'hast-util-from-html'
import { toHtml } from 'hast-util-to-html'
import {
  defineHastPlugin,
  type HastNode,
  type HastPluginDefinition,
} from 'satteri'

import {
  calloutRegex,
  splitByNewlineRegex,
  defaultClassNames,
  createIfNeeded,
  getConfig,
  expandCallouts,
  handleBrAfterTitle,
  findFirstNewline,
  mergeConsecutiveTextNodes,
  getProperties,
  getIndicator,
  getFoldIcon,
} from './utils.js'

import type {
  Element,
  ElementContent,
  Properties,
  Root,
  RootContent,
  Text,
} from 'hast'
import type { RequiredOptions, UserOptions } from './types.js'

/**
 * Create a Satteri HAST plugin for rendering themed callouts (admonitions/alerts).
 *
 * @param options - Optional options to configure the output.
 * @returns A Satteri HAST plugin.
 *
 * @see https://github.com/lin-stephanie/satteri-callouts
 */
function satteriCallouts(options?: UserOptions): HastPluginDefinition {
  const config = getConfig(options)
  const aliasMap = expandCallouts(config.callouts, config.aliases)

  return defineHastPlugin({
    name: 'satteri-callouts',

    element: {
      filter: ['blockquote'],
      visit(node: Readonly<Element>) {
        return transformBlockquote(node, config, aliasMap)
      },
    },

    raw(node: Readonly<Extract<HastNode, { type: 'raw' }>>) {
      if (!node.value.includes('[!') || !/<blockquote\b/i.test(node.value)) {
        return
      }

      const value = transformHtmlFragment(node.value, config, aliasMap)

      if (value === node.value) return

      return {
        ...node,
        value,
      }
    },
  })
}

/**
 * Transform a blockquote element into a callout element.
 *
 * @param node - The blockquote element to transform.
 * @param config - The configuration object.
 * @returns The transformed element or undefined if the transformation fails.
 */
function transformBlockquote(
  node: Readonly<Element>,
  config: RequiredOptions,
  aliasMap: Record<string, string>
): Element | undefined {
  const { theme, callouts, showIndicator, tags, props } = config
  const {
    nonCollapsibleContainerTagName,
    nonCollapsibleTitleTagName,
    contentTagName,
    titleIconTagName,
    titleTextTagName,
    foldIconTagName,
  } = tags
  const {
    containerProps,
    titleProps,
    contentProps,
    titleIconProps,
    titleTextProps,
    foldIconProps,
  } = props

  const children = node.children.filter(
    (child) => !(child.type === 'text' && child.value.trim() === '')
  )

  if (children.length === 0) return

  const firstParagraph = cloneElement(children[0])
  if (firstParagraph?.tagName !== 'p') return
  if (firstParagraph.children.length === 0) return

  const firstParagraphChild = firstParagraph.children[0]
  if (firstParagraphChild.type !== 'text') return

  const match = calloutRegex.exec(firstParagraphChild.value)
  calloutRegex.lastIndex = 0

  const lowerType = match?.groups?.type.toLowerCase()
  if (!lowerType || !(lowerType in callouts || lowerType in aliasMap)) return

  firstParagraph.children = handleBrAfterTitle(firstParagraph.children)
  let newChildren: ElementContent[] = [firstParagraph, ...children.slice(1)]

  const borderingIndex = findFirstNewline(firstParagraph.children)

  if (borderingIndex !== -1) {
    const borderingElement = firstParagraph.children[borderingIndex]
    if (borderingElement.type !== 'text') return

    const splitMatch = splitByNewlineRegex.exec(borderingElement.value)
    splitByNewlineRegex.lastIndex = 0

    if (splitMatch?.groups) {
      const { prefix, suffix } = splitMatch.groups
      const firstParagraphNewChildren = [
        ...firstParagraph.children.slice(0, borderingIndex),
        ...(prefix ? [text(prefix)] : []),
      ]
      const newParagraph = element('p', {}, [
        ...(suffix ? [text(suffix)] : []),
        ...firstParagraph.children.slice(borderingIndex + 1),
      ])

      newChildren = [
        { ...firstParagraph, children: firstParagraphNewChildren },
        newParagraph,
        ...newChildren.slice(1),
      ]
    }
  }

  const revisedType =
    lowerType in callouts && !(lowerType in aliasMap)
      ? lowerType
      : aliasMap[lowerType]

  const blockquote: Element & { tagName: 'blockquote' } = {
    ...node,
    children: newChildren,
    tagName: 'blockquote',
  }
  const containerProperties = createIfNeeded(
    containerProps,
    blockquote,
    revisedType
  )
  const titleProperties = createIfNeeded(titleProps, blockquote, revisedType)
  const contentProperties = createIfNeeded(
    contentProps,
    blockquote,
    revisedType
  )
  const titleIconProperties = createIfNeeded(
    titleIconProps,
    blockquote,
    revisedType
  )
  const titleTextProperties = createIfNeeded(
    titleTextProps,
    blockquote,
    revisedType
  )
  const foldIconProperties = createIfNeeded(
    foldIconProps,
    blockquote,
    revisedType
  )

  const newFirstParagraph = cloneElement(newChildren[0])
  if (!newFirstParagraph) return

  const firstTextNode = newFirstParagraph.children[0]
  if (firstTextNode.type !== 'text') return

  mergeConsecutiveTextNodes(newFirstParagraph.children)

  const calloutMatch = calloutRegex.exec(firstTextNode.value)
  calloutRegex.lastIndex = 0
  if (!calloutMatch?.groups) return

  const { title, collapsable } = calloutMatch.groups

  const newFirstParagraphChildren = [...newFirstParagraph.children]
  if (title) {
    firstTextNode.value = title
  } else {
    newFirstParagraphChildren.shift()
  }

  const titleTextElement = element(
    titleTextTagName,
    getProperties(titleTextProperties, defaultClassNames.titleText),
    newFirstParagraphChildren
  )

  const container = getProperties(
    containerProperties,
    defaultClassNames.container
  )
  container['data-callout'] = revisedType
  container['data-collapsible'] = collapsable ? 'true' : 'false'

  if (collapsable === '+') {
    container.open = 'open'
  }

  const fallbackTitle =
    theme === 'github' || theme === 'obsidian'
      ? revisedType.charAt(0).toUpperCase() + revisedType.slice(1)
      : revisedType.toUpperCase()
  const customizedTitle = callouts[revisedType].title?.trim()

  const titleChildren: ElementContent[] = []
  const indicator = showIndicator
    ? getIndicator(callouts, revisedType, titleIconTagName, titleIconProperties)
    : null

  if (indicator) titleChildren.push(indicator)

  if (titleTextElement.children.length > 0) {
    titleChildren.push(titleTextElement)
  } else {
    titleChildren.push(
      element(
        titleTextTagName,
        getProperties(titleTextProperties, defaultClassNames.titleText),
        [
          text(
            customizedTitle === ''
              ? fallbackTitle
              : (customizedTitle ?? fallbackTitle)
          ),
        ]
      )
    )
  }

  if (collapsable) {
    titleChildren.push(getFoldIcon(foldIconTagName, foldIconProperties))
  }

  return element(
    collapsable ? 'details' : nonCollapsibleContainerTagName,
    container,
    [
      element(
        collapsable ? 'summary' : nonCollapsibleTitleTagName,
        getProperties(titleProperties, defaultClassNames.title),
        titleChildren
      ),
      element(
        contentTagName,
        getProperties(contentProperties, defaultClassNames.content),
        newChildren.slice(1)
      ),
    ]
  )
}

function transformHtmlFragment(
  value: string,
  config: RequiredOptions,
  aliasMap: Record<string, string>
): string {
  const tree: Root = fromHtml(value, { fragment: true })
  let changed = false

  const children = tree.children.map((child) => {
    const result = transformHtmlNode(child, config, aliasMap)
    changed ||= result.changed

    return result.node
  })

  return changed ? toHtml({ ...tree, children }) : value
}

function transformHtmlNode(
  node: ElementContent,
  config: RequiredOptions,
  aliasMap: Record<string, string>
): { node: ElementContent; changed: boolean }
function transformHtmlNode(
  node: RootContent,
  config: RequiredOptions,
  aliasMap: Record<string, string>
): { node: RootContent; changed: boolean }
function transformHtmlNode(
  node: RootContent,
  config: RequiredOptions,
  aliasMap: Record<string, string>
): { node: RootContent; changed: boolean } {
  if (node.type !== 'element') return { node, changed: false }

  const transformed =
    node.tagName === 'blockquote'
      ? transformBlockquote(node, config, aliasMap)
      : undefined
  const base = transformed ?? node
  let changed = Boolean(transformed)

  const children = base.children.map((child) => {
    const result = transformHtmlNode(child, config, aliasMap)
    changed ||= result.changed

    return result.node
  })

  return {
    node: { ...base, children },
    changed,
  }
}

function element(
  tagName: string,
  properties: Properties,
  children: ElementContent[]
): Element {
  return {
    type: 'element',
    tagName,
    properties,
    children,
  }
}

function text(value: string): Text {
  return {
    type: 'text',
    value,
  }
}

function cloneElement(node: ElementContent | undefined): Element | undefined {
  if (node?.type !== 'element') return

  return {
    ...node,
    properties: { ...node.properties },
    children: node.children.map((child) =>
      child.type === 'text' ? { ...child } : child
    ),
  }
}

export default satteriCallouts
export type {
  UserOptions,
  CalloutConfig,
  TagsConfig,
  PropsConfig,
  CreateProperties,
} from './types.js'
