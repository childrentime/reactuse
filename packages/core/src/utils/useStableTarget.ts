import { useRef } from 'react'
import type { BasicTarget } from './domTarget'
import { getTargetElement } from './domTarget'

/**
 * Creates a stable identifier for a BasicTarget that can be safely used in effect dependencies.
 *
 * This hook solves the problem where passing unstable function references like `() => document`
 * would cause infinite re-renders when used directly in effect dependency arrays.
 *
 * @param target - The target element (ref, function, or direct element)
 * @param defaultElement - Default element to use if target is undefined
 * @returns A stable reference that only changes when the actual target element changes
 *
 * @example
 * ```tsx
 * // For ref objects: returns the ref itself (stable)
 * const ref = useRef<HTMLDivElement>(null)
 * const key = useStableTarget(ref) // key === ref (stable)
 *
 * // For functions: returns the resolved actual element
 * const key = useStableTarget(() => document) // key === document (stable)
 *
 * // For direct elements: returns the element itself
 * const key = useStableTarget(divElement) // key === divElement (stable)
 * ```
 */
export function useStableTarget<T extends HTMLElement | Element | Window | Document | EventTarget>(
  target?: BasicTarget<T>,
  defaultElement?: T,
) {
  const targetRef = useRef(target)
  targetRef.current = target

  // Calculate stable key without memoization
  // For ref objects: return the ref itself (always stable)
  // For functions/direct elements: resolve to the actual element
  let stableKey: any
  if (!target) {
    stableKey = defaultElement ?? null
  }
  else if (typeof target === 'object' && 'current' in target) {
    // Ref object - use the ref itself as the stable key
    stableKey = target
  }
  else {
    // Function or direct element - resolve to actual element
    stableKey = getTargetElement(target, defaultElement)
  }

  return {
    /** The stable key that can be safely used in effect dependencies */
    key: stableKey,
    /** A ref containing the current target (useful for accessing in effects) */
    ref: targetRef,
  }
}
