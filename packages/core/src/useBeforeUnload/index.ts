import { useEffect } from 'react'
import { useLatest } from '../useLatest'
import type { UseBeforeUnload } from './interface'

export const useBeforeUnload: UseBeforeUnload = (options = true) => {
  const optionsRef = useLatest(options)

  useEffect(() => {
    const handler = (event: BeforeUnloadEvent) => {
      const opts = optionsRef.current
      let enabled: boolean

      if (typeof opts === 'function') {
        enabled = opts()
      }
      else if (typeof opts === 'object') {
        const enabledOpt = opts.enabled
        enabled = typeof enabledOpt === 'function' ? enabledOpt() : (enabledOpt ?? true)
      }
      else {
        enabled = opts
      }

      if (!enabled)
        return

      event.preventDefault()
    }

    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [optionsRef])
}
