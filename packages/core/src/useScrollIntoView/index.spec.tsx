import { fireEvent, render, screen } from '@testing-library/react'
import { useRef, useState } from 'react'
import { createMockMediaMatcher } from '../../.test'
import { useScrollIntoView } from '.'

const RECT = { top: 800, left: 0, width: 100, height: 20, right: 100, bottom: 820, x: 0, y: 800, toJSON: () => {} }

describe('useScrollIntoView', () => {
  let mockRaf: jest.SpyInstance

  beforeEach(() => {
    window.matchMedia = createMockMediaMatcher({
      '(prefers-reduced-motion: reduce)': false,
    }) as any
    // run the animation synchronously; performance.now() advances past `duration`
    // on the second frame so the scroll settles instead of looping forever
    let now = 0
    jest.spyOn(performance, 'now').mockImplementation(() => (now += 700))
    mockRaf = jest
      .spyOn(window, 'requestAnimationFrame')
      .mockImplementation((cb: FrameRequestCallback) => {
        cb(0)
        return 0
      })
  })

  afterEach(() => {
    mockRaf.mockRestore()
    jest.restoreAllMocks()
  })

  function Demo() {
    const target = useRef<HTMLParagraphElement>(null)
    const [, bump] = useState(0)
    const { scrollIntoView } = useScrollIntoView(target)
    return (
      <div>
        <button type="button" onClick={() => bump(n => n + 1)}>bump</button>
        <button type="button" onClick={() => scrollIntoView({ alignment: 'start' })}>scroll</button>
        <p ref={target} data-testid="target">target</p>
      </div>
    )
  }

  function measureCount(rerenderFirst: boolean) {
    render(<Demo />)
    const target = screen.getByTestId('target')
    let measured = 0
    jest.spyOn(target, 'getBoundingClientRect').mockImplementation(() => {
      measured++
      return RECT as DOMRect
    })
    if (rerenderFirst) {
      fireEvent.click(screen.getByText('bump'))
    }
    fireEvent.click(screen.getByText('scroll'))
    return measured
  }

  // Regression: the target used to be resolved during render, so a component that
  // never re-rendered after mount saw `ref.current === null` and scrolled to the
  // top of the page instead of to the element.
  it('resolves a ref target that was attached after the first render', () => {
    expect(measureCount(false)).toBeGreaterThan(0)
  })

  it('resolves a ref target after a re-render too', () => {
    expect(measureCount(true)).toBeGreaterThan(0)
  })

  it('returns stable scrollIntoView and cancel functions', () => {
    render(<Demo />)
    expect(() => fireEvent.click(screen.getByText('scroll'))).not.toThrow()
  })
})
