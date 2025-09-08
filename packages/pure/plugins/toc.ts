import type { MarkdownHeading } from 'astro'

export interface TocItem extends MarkdownHeading {
  subheadings: TocItem[]
}

function diveChildren(item: TocItem, depth: number): TocItem[] {
  if (!item || depth <= 1 || !item.subheadings || !item.subheadings.length) {
    return item?.subheadings || []
  } else {
    // e.g., 2
    const lastSubheading = item.subheadings[item.subheadings.length - 1]
    if (!lastSubheading) {
      return item.subheadings
    }
    return diveChildren(lastSubheading as TocItem, depth - 1)
  }
}

export function generateToc(headings: readonly MarkdownHeading[]) {
  // Include all headings (including h1 elements)
  const bodyHeadings = [...headings].filter(h => h && typeof h.depth === 'number' && h.depth >= 1 && h.depth <= 10)
  const toc: TocItem[] = []

  bodyHeadings.forEach((h) => {
    const heading: TocItem = { ...h, subheadings: [] }

    // Validate heading depth
    if (!heading.depth || typeof heading.depth !== 'number') {
      console.warn(`Invalid heading depth for: ${heading.text}`, heading)
      return
    }

    // add h1 and h2 elements into the top level
    if (heading.depth === 1 || heading.depth === 2) {
      toc.push(heading)
    } else {
      const lastItemInToc = toc[toc.length - 1]
      if (!lastItemInToc) {
        console.warn(`No parent heading found for depth ${heading.depth}: ${heading.text}`)
        // Add as top level instead of throwing error
        toc.push(heading)
        return
      }
      
      if (!lastItemInToc.depth || typeof lastItemInToc.depth !== 'number') {
        console.warn(`Invalid parent heading depth for: ${heading.text}`, lastItemInToc)
        toc.push(heading)
        return
      }
      
      if (heading.depth < lastItemInToc.depth) {
        console.warn(`Orphan heading found: ${heading.text}. Adding as top level.`)
        toc.push(heading)
        return
      }

      // higher depth
      // push into children, or children's children
      const gap = heading.depth - lastItemInToc.depth
      const target = diveChildren(lastItemInToc, gap)
      target.push(heading)
    }
  })
  return toc
}
