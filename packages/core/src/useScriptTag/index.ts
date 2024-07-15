import { useRef, useState } from 'react'
import { noop } from '../utils/is'
import { useMount } from '../useMount'
import { useUnmount } from '../useUnmount'
import { defaultOptions } from '../utils/defaults'
import type { UseScriptTag, UseScriptTagOptions, UseScriptTagStatus } from './interface'

export const useScriptTag: UseScriptTag = (
  src: string,
  onLoaded: (el: HTMLScriptElement) => void = noop,
  options: UseScriptTagOptions = defaultOptions,
) => {
  const {
    immediate = true,
    manual = false,
    type = 'text/javascript',
    async = true,
    crossOrigin,
    referrerPolicy,
    noModule,
    defer,
    attrs = {},
  } = options
  const scriptTag = useRef<HTMLScriptElement | null>(null)
  const _promise = useRef<Promise<HTMLScriptElement | boolean> | null>(null)
  const [status, setStatus] = useState<UseScriptTagStatus>(src ? 'loading' : 'idle')

  /**
   * Load the script specified via `src`.
   *
   * @param waitForScriptLoad Whether if the Promise should resolve once the "load" event is emitted by the <script> attribute, or right after appending it to the DOM.
   * @returns Promise<HTMLScriptElement>
   */
  const loadScript = (
    waitForScriptLoad: boolean,
  ): Promise<HTMLScriptElement | boolean> =>
    new Promise((resolve, reject) => {
      // Some little closure for resolving the Promise.
      const resolveWithElement = (el: HTMLScriptElement) => {
        scriptTag.current = el
        resolve(el)
        return el
      }

      // Check if document actually exists, otherwise resolve the Promise (SSR Support).
      if (!document) {
        resolve(false)
        return
      }

      if (!src) {
        setStatus('idle')
        resolve(false)
        return
      }

      // Local variable defining if the <script> tag should be appended or not.
      let shouldAppend = false

      let el = document.querySelector<HTMLScriptElement>(
        `script[src="${src}"]`,
      )

      // Script tag not found, preparing the element for appending
      if (!el) {
        el = document.createElement('script')
        el.type = type
        el.async = async
        el.src = src

        // Optional attributes
        if (defer) {
          el.defer = defer
        }
        if (crossOrigin) {
          el.crossOrigin = crossOrigin
        }
        if (noModule) {
          el.noModule = noModule
        }
        if (referrerPolicy) {
          el.referrerPolicy = referrerPolicy
        }

        Object.entries(attrs).forEach(([name, value]) =>
          el?.setAttribute(name, value),
        )

        // Enables shouldAppend
        shouldAppend = true
      }
      // Script tag already exists, resolve the loading Promise with it.
      else if (el.hasAttribute('data-loaded')) {
        setStatus(el.getAttribute('data-status') as UseScriptTagStatus)
        resolveWithElement(el)
      }

      // Event listeners
      el.addEventListener('error', event => {
        setStatus(event.type === 'load' ? 'ready' : 'error')
        return reject(event)
      })
      el.addEventListener('abort', event => {
        setStatus(event.type === 'load' ? 'ready' : 'error')
        return reject(event)
      })
      el.addEventListener('load', event => {
        setStatus(event.type === 'load' ? 'ready' : 'error')
        el!.setAttribute('data-loaded', 'true')

        onLoaded(el!)
        resolveWithElement(el!)
      })

      // Append the <script> tag to head.
      if (shouldAppend) {
        el = document.head.appendChild(el)
      }

      // If script load awaiting isn't needed, we can resolve the Promise.
      if (!waitForScriptLoad) {
        resolveWithElement(el)
      }
    })

  /**
   * Exposed singleton wrapper for `loadScript`, avoiding calling it twice.
   *
   * @param waitForScriptLoad Whether if the Promise should resolve once the "load" event is emitted by the <script> attribute, or right after appending it to the DOM.
   * @returns Promise<HTMLScriptElement>
   */
  const load = (
    waitForScriptLoad = true,
  ): Promise<HTMLScriptElement | boolean> => {
    if (!_promise.current) {
      _promise.current = loadScript(waitForScriptLoad)
    }

    return _promise.current
  }

  /**
   * Unload the script specified by `src`.
   */
  const unload = () => {
    if (!document) {
      return
    }

    _promise.current = null

    if (scriptTag.current) {
      scriptTag.current = null
    }

    const el = document.querySelector<HTMLScriptElement>(
      `script[src="${src}"]`,
    )
    if (el) {
      document.head.removeChild(el)
    }
  }

  useMount(() => {
    if (immediate && !manual) {
      load()
    }
  })

  useUnmount(() => {
    if (!manual) {
      unload()
    }
  })

  return [scriptTag.current, status, load, unload] as const
}
