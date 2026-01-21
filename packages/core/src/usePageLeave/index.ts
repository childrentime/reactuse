import { useState } from 'react'
import { useEventListener } from '../useEventListener'
import { defaultDocument, defaultWindow } from '../utils/browser'

export function usePageLeave(): boolean {
  const [isLeft, setIsLeft] = useState(false)

  const handler = (event: MouseEvent) => {
    if (!window)
      return

    event = event || (window.event as any)
    // @ts-expect-error missing types
    const from = event.relatedTarget || event.toElement
    setIsLeft(!from)
  }

  useEventListener('mouseout', handler, defaultWindow, { passive: true })
  useEventListener('mouseleave', handler, defaultDocument, { passive: true })
  useEventListener('mouseenter', handler, defaultDocument, { passive: true })

  return isLeft
}
