import { useScroll } from '../useScroll'
import { useLatest } from '../useLatest'
import { useUpdateEffect } from '../useUpdateEffect'
import { defaultOptions } from '../utils/defaults'
import { getTargetElement } from '../utils/domTarget'
import { useStableTarget } from '../utils/useStableTarget'
import type { UseInfiniteScroll, UseInfiniteScrollOptions } from './interface'

export const useInfiniteScroll: UseInfiniteScroll = (
  target,
  onLoadMore: (state: ReturnType<typeof useScroll>) => void | Promise<void>,
  options: UseInfiniteScrollOptions = defaultOptions,
) => {
  const savedLoadMore = useLatest(onLoadMore)
  // `target` may be a getter such as `() => el`, which is a new function on every
  // render. Depending on it directly would re-run the effect below — and call
  // onLoadMore — on every render, which loops once loading appends data.
  const { key: targetKey, ref: targetRef } = useStableTarget(target)
  const direction = options.direction ?? 'bottom'
  const state = useScroll(target, {
    ...options,
    offset: {
      [direction]: options.distance ?? 0,
      ...options.offset,
    },
  })

  const di = state[3][direction]

  useUpdateEffect(() => {
    const element = getTargetElement(targetRef.current)
    const fn = async () => {
      const previous = {
        height: element?.scrollHeight ?? 0,
        width: element?.scrollWidth ?? 0,
      }

      await savedLoadMore.current(state)

      if (options.preserveScrollPosition && element) {
        element.scrollTo({
          top: element.scrollHeight - previous.height,
          left: element.scrollWidth - previous.width,
        })
      }
    }
    fn()
  }, [di, options.preserveScrollPosition, targetKey, targetRef])
}
