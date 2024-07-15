export function setScrollParam({
  axis,
  parent,
  distance,
}: {
  axis: 'x' | 'y'
  parent: Element | null
  distance: number
}) {
  if (!parent && typeof document === 'undefined') {
    return
  }

  const method = axis === 'y' ? 'scrollTop' : 'scrollLeft'

  if (parent) {
    parent[method] = distance
  }
  else {
    const { body, documentElement } = document

    body[method] = distance

    documentElement[method] = distance
  }
}

function isScrollElement(axis: 'x' | 'y', node: Element | null) {
  if (!node) {
    return false
  }

  const AXIS = axis === 'x' ? 'X' : 'Y'

  return (
    getComputedStyle(node)[`overflow${AXIS}`] === 'auto'
    || getComputedStyle(node)[`overflow${AXIS}`] === 'scroll'
  )
}

const cache = new Map<Element, Element>()

export function getScrollParent(axis: 'x' | 'y', node: Element | null | undefined): Element | null {
  if (!node || !node.parentElement) {
    return null
  }
  if (cache.has(node)) {
    return cache.get(node) || null
  }
  let parent: Element | null = node.parentElement
  while (parent && !isScrollElement(axis, parent)) {
    parent = parent.parentElement
  }
  if (parent) {
    cache.set(node, parent)
  }
  return parent
}

export function getScrollStart({
  axis,
  parent,
}: {
  axis: 'x' | 'y'
  parent: Element | null
}) {
  if (!parent && typeof document === 'undefined') {
    return 0
  }

  const method = axis === 'y' ? 'scrollTop' : 'scrollLeft'

  if (parent) {
    return parent[method]
  }

  const { body, documentElement } = document

  // while one of it has a value the second is equal 0
  return body[method] + documentElement[method]
}
