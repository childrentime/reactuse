import type React from 'react'
import { useEffect, useState } from 'react'
import type { BasicTarget } from '../utils/domTarget'
import { getTargetElement } from '../utils/domTarget'
import { useThrottleFn } from '../useThrottleFn'
import { getScrollParent } from '../utils/scroll'
import type { UseStickyParams } from './interface'

export function useSticky(targetElement: BasicTarget<HTMLElement>, { axis = 'y', nav = 0 }: UseStickyParams, scrollElement?: BasicTarget<HTMLElement>): [boolean, React.Dispatch<React.SetStateAction<boolean>>] {
  const [isSticky, setSticky] = useState<boolean>(false)

  const { run: scrollHandler } = useThrottleFn(() => {
    const element = getTargetElement(targetElement)
    if (!element) {
      return
    }
    const rect = element.getBoundingClientRect()
    if (axis === 'y') {
      setSticky(rect?.top <= nav)
    }
    else {
      setSticky(rect?.left <= nav)
    }
  }, 50)

  useEffect(() => {
    const element = getTargetElement(targetElement)
    const scrollParent
      = getTargetElement(scrollElement) || getScrollParent(axis, element)
    if (!element || !scrollParent) {
      return
    }

    scrollParent.addEventListener('scroll', scrollHandler)
    scrollHandler()
    return () => {
      scrollParent.removeEventListener('scroll', scrollHandler)
    }
  }, [axis, targetElement, scrollElement, scrollHandler])
  return [isSticky, setSticky]
}
