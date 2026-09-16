import { renderHook } from '@testing-library/react'
import { useMobileLandscape } from '.'

function setUserAgent(value: string) {
  Object.defineProperty(window.navigator, 'userAgent', {
    value,
    configurable: true,
  })
}

// jsdom exposes no `screen.orientation`, so `useOrientation` keeps its
// default state of `landscape-primary` and only the user agent varies here.
const AGENTS = {
  androidTablet:
    'Mozilla/5.0 (Linux; Android 13; SM-X700) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  desktop:
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
}

it('should detect an android user agent without a Mobi token', () => {
  setUserAgent(AGENTS.androidTablet)
  expect(renderHook(() => useMobileLandscape()).result.current).toBe(true)
})

it('should not report a desktop user agent as mobile', () => {
  setUserAgent(AGENTS.desktop)
  expect(renderHook(() => useMobileLandscape()).result.current).toBe(false)
})
