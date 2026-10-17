import { useEffect, useRef, useState } from 'react'
import type { UseBatchedMount } from './interface'

/*
 * A plain `requestIdleCallback` can be starved indefinitely on a busy main
 * thread — the exact condition this hook exists for. `timeout` makes the
 * browser run the callback once it expires regardless, bounding the stall.
 */
const IDLE_TIMEOUT = 100

/* Safari still ships no `requestIdleCallback`. */
const FALLBACK_DELAY = 48

/**
 * Reveals a long list a batch at a time during idle frames, instead of mounting
 * every item synchronously.
 *
 * **Reach for virtualization first.** `react-window` / TanStack Virtual are
 * O(viewport) — they mount only the rows on screen and stay flat however long
 * the list grows. This hook still mounts every row, merely spread across frames,
 * so wherever windowing is an option it is the better tool.
 *
 * This is for lists where windowing is not an option:
 *
 * - rows whose height cannot be known or measured up front
 * - content that must stay findable by Ctrl+F, screen readers, or crawlers
 * - pages that have to print, or export to PDF, in full
 *
 * There the choice is not "window or batch" but "batch or one blocking
 * stretch", and batching trades a longer time-to-fully-mounted for a main
 * thread that never freezes.
 */
export const useBatchedMount: UseBatchedMount = (
  total: number,
  batchSize: number,
): number => {
  /*
   * A `batchSize` of 0 — realistic when derived from a measurement such as
   * `Math.floor(height / rowHeight)` — would advance `mounted` by nothing,
   * React would bail out of the re-render, and the effect would never re-run:
   * a permanently empty list, with no error to show for it. Anything under 1
   * reveals 1 instead. `total` is floored the same way so the hook cannot
   * return a fractional or negative count.
   */
  const size = batchSize >= 1 ? Math.floor(batchSize) : 1
  const limit = total >= 0 ? Math.floor(total) : 0

  const [mounted, setMounted] = useState(() => Math.min(size, limit))
  const prevSize = useRef(size)

  useEffect(() => {
    const sizeChanged = prevSize.current !== size
    prevSize.current = size

    /*
     * `total` growing (an infinite-scroll feed appending rows) must not discard
     * what is already mounted, and `total` shrinking must clamp to the new
     * total rather than restart from a single batch — dropping one row should
     * not unmount the whole list and re-reveal it. Only a `batchSize` change
     * re-batches from the top.
     */
    setMounted(count =>
      sizeChanged ? Math.min(size, limit) : Math.min(count, limit),
    )
  }, [limit, size])

  useEffect(() => {
    if (mounted >= limit)
      return

    const reveal = () => setMounted(count => Math.min(count + size, limit))

    /*
     * Branch whole rather than picking `idle`/`cancel` independently: a browser
     * with `requestIdleCallback` but no `cancelIdleCallback` would otherwise
     * hand an idle handle to `clearTimeout`, and the reveal would outlive the
     * component.
     */
    if (typeof window.requestIdleCallback === 'function') {
      const handle = window.requestIdleCallback(reveal, {
        timeout: IDLE_TIMEOUT,
      })

      return () => window.cancelIdleCallback(handle)
    }

    const handle = window.setTimeout(reveal, FALLBACK_DELAY)

    return () => window.clearTimeout(handle)
  }, [mounted, limit, size])

  return mounted
}
