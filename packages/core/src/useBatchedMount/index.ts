import { useEffect, useRef, useState } from 'react'
import type { UseBatchedMount } from './interface'

/**
 * Mounting a few thousand nodes at once stalls first paint behind work nothing
 * is waiting on — and if each node fetches an image, behind a request queue
 * too. Revealing them a batch at a time during idle frames also makes a large
 * layout visibly assemble, which tends to read better than a single pop.
 */
export const useBatchedMount: UseBatchedMount = (
  total: number,
  batchSize: number,
): number => {
  const [mounted, setMounted] = useState(() => Math.min(batchSize, total))
  const prevBatchSize = useRef(batchSize)

  // `total` growing (e.g. an infinite-scroll/paginated feed appending rows)
  // must not discard what is already mounted — only a `batchSize` change, or
  // `total` shrinking below what is already mounted, clamps `mounted` down.
  useEffect(() => {
    const batchSizeChanged = prevBatchSize.current !== batchSize
    prevBatchSize.current = batchSize

    setMounted(count => {
      if (batchSizeChanged || count > total)
        return Math.min(batchSize, total)

      return count
    })
  }, [total, batchSize])

  useEffect(() => {
    if (mounted >= total)
      return

    const idle
      = typeof window.requestIdleCallback === 'function'
        ? window.requestIdleCallback
        : (cb: () => void) => window.setTimeout(cb, 48)
    const cancel
      = typeof window.cancelIdleCallback === 'function'
        ? window.cancelIdleCallback
        : window.clearTimeout

    const handle = idle(() =>
      setMounted(count => Math.min(count + batchSize, total)),
    )

    return () => cancel(handle as number)
  }, [mounted, total, batchSize])

  return mounted
}
