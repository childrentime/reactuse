import type React from 'react'
import { useEffect, useState } from 'react'
import type { BasicTarget } from '../utils/domTarget'
import { getTargetElement } from '../utils/domTarget'
import { useThrottleFn } from '../useThrottleFn'
import { getScrollParent } from '../utils/scroll'
import { useStableTarget } from '../utils/useStableTarget'
import { useLatest } from '../useLatest'
import type { UseStickyParams } from './interface'

export function useSticky(targetElement: BasicTarget<HTMLElement>, { axis = 'y', nav = 0 }: UseStickyParams, scrollElement?: BasicTarget<HTMLElement>): [boolean, React.Dispatch<React.SetStateAction<boolean>>] {
  const [isSticky, setSticky] = useState<boolean>(false)
  const { key: targetKey, ref: targetRef } = useStableTarget(targetElement)
  const { key: scrollKey, ref: scrollRef } = useStableTarget(scrollElement)
  const axisRef = useLatest(axis)
  const navRef = useLatest(nav)

  const { run: scrollHandler } = useThrottleFn(() => {
    const element = getTargetElement(targetRef.current)
    if (!element) {
      return
    }
    const rect = element.getBoundingClientRect()
    if (axisRef.current === 'y') {
      setSticky(rect?.top <= navRef.current)
    }
    else {
      setSticky(rect?.left <= navRef.current)
    }
  }, 50)

  useEffect(() => {
    const element = getTargetElement(targetRef.current)
    const scrollParent
      = getTargetElement(scrollRef.current) || getScrollParent(axisRef.current, element)
    if (!element || !scrollParent) {
      return
    }

    scrollParent.addEventListener('scroll', scrollHandler)
    scrollHandler()
    return () => {
      scrollParent.removeEventListener('scroll', scrollHandler)
    }
  }, [targetKey, scrollKey, scrollHandler])
  return [isSticky, setSticky]
}
