import { useCallback, useEffect, useState } from 'react'
import { getTargetElement } from '../utils/domTarget'
import type { UseTextareaAutosize } from './interface'

export const useTextareaAutosize: UseTextareaAutosize = (target, options = {}) => {
  const { minRows = 1, maxRows } = options
  const [value, setValue] = useState('')

  const triggerResize = useCallback(() => {
    const el = getTargetElement(target) as HTMLTextAreaElement
    if (!el)
      return

    el.style.height = 'auto'

    const style = window.getComputedStyle(el)
    const lineHeight = Number.parseFloat(style.lineHeight) || 20
    const paddingTop = Number.parseFloat(style.paddingTop) || 0
    const paddingBottom = Number.parseFloat(style.paddingBottom) || 0
    const borderTop = Number.parseFloat(style.borderTopWidth) || 0
    const borderBottom = Number.parseFloat(style.borderBottomWidth) || 0

    const minHeight = lineHeight * minRows + paddingTop + paddingBottom + borderTop + borderBottom
    let maxHeight = Infinity
    if (maxRows) {
      maxHeight = lineHeight * maxRows + paddingTop + paddingBottom + borderTop + borderBottom
    }

    const scrollHeight = el.scrollHeight
    const height = Math.min(Math.max(scrollHeight, minHeight), maxHeight)

    el.style.height = `${height}px`
    el.style.overflow = scrollHeight > maxHeight ? 'auto' : 'hidden'
  }, [target, minRows, maxRows])

  useEffect(() => {
    const el = getTargetElement(target) as HTMLTextAreaElement
    if (!el)
      return
    el.value = value
    triggerResize()
  }, [value, triggerResize])

  return { value, setValue, triggerResize }
}
