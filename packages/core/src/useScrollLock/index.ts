import { useEffect, useRef, useState } from 'react'
import { type BasicTarget, getTargetElement } from '../utils/domTarget'
import { isIOS } from '../utils/is'
import { useEvent } from '../useEvent'
import type { UseScrollLock } from './interface'

function checkOverflowScroll(ele: Element): boolean {
  const style = window.getComputedStyle(ele)
  if (
    style.overflowX === 'scroll'
    || style.overflowY === 'scroll'
    || (style.overflowX === 'auto' && ele.clientWidth < ele.scrollWidth)
    || (style.overflowY === 'auto' && ele.clientHeight < ele.scrollHeight)
  ) {
    return true
  }
  else {
    const parent = ele.parentNode as Element

    if (!parent || parent.tagName === 'BODY')
      return false

    return checkOverflowScroll(parent)
  }
}

function preventDefault(rawEvent: TouchEvent): boolean {
  const e = rawEvent || window.event

  const _target = e.target as Element

  // Do not prevent if element or parentNodes have overflow: scroll set.
  if (checkOverflowScroll(_target))
    return false

  // Do not prevent if the event has more than one touch (usually meaning this is a multi touch gesture like pinch to zoom).
  if (e.touches.length > 1)
    return true

  if (e.preventDefault)
    e.preventDefault()

  return false
}

export const useScrollLock: UseScrollLock = (
  target: BasicTarget<HTMLElement>,
  initialState = false,
): readonly [boolean, (flag: boolean) => void] => {
  const [locked, setLocked] = useState(initialState)

  const initialOverflowRef = useRef<CSSStyleDeclaration['overflow']>('scroll')

  useEffect(() => {
    const element = getTargetElement(target)
    if (element) {
      initialOverflowRef.current = element.style.overflow
      if (locked) {
        element.style.overflow = 'hidden'
      }
    }
  }, [locked, target])

  const lock = useEvent(() => {
    const element = getTargetElement(target)
    if (!element || locked) {
      return
    }
    if (isIOS) {
      element.addEventListener('touchmove', preventDefault, {
        passive: false,
      })
    }
    setLocked(true)
  })

  const unlock = useEvent(() => {
    const element = getTargetElement(target)
    if (!element || !locked) {
      return
    }
    if (isIOS) {
      element.removeEventListener('touchmove', preventDefault)
    }
    element.style.overflow = initialOverflowRef.current
    setLocked(false)
  })

  const set = useEvent((flag: boolean) => {
    if (flag) {
      lock()
    }
    else {
      unlock()
    }
  })

  return [locked, set] as const
}
