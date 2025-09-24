import { renderHook, act } from '@testing-library/react'
import type { UseColorModeOptions } from './interface'
import { useColorMode } from '.'

describe('useColorMode', () => {
  const basicOptions: UseColorModeOptions<'light' | 'dark' | 'auto'> = {
    modes: ['light', 'dark', 'auto'],
    defaultValue: 'light',
  }

  beforeEach(() => {
    // Clear DOM
    document.documentElement.className = ''
    document.documentElement.removeAttribute('data-theme')
  })

  afterEach(() => {
    localStorage.clear()
    sessionStorage.clear()
  })

  it('should initialize with default value', () => {
    const { result } = renderHook(() => useColorMode(basicOptions))
    expect(result.current[0]).toBe('light')
  })

  it('should throw error when modes array is empty', () => {
    expect(() => {
      renderHook(() => useColorMode({ modes: [] }))
    }).toThrow('useColorMode: modes array cannot be empty')
  })

  it('should apply class to html element by default', () => {
    renderHook(() => useColorMode(basicOptions))
    expect(document.documentElement.classList.contains('light')).toBe(true)
  })

  it('should apply custom selector', () => {
    renderHook(() => 
      useColorMode({ ...basicOptions, selector: 'body' })
    )
    expect(document.body.classList.contains('light')).toBe(true)
  })

  it('should apply custom attribute', () => {
    renderHook(() =>
      useColorMode({ 
        ...basicOptions, 
        attribute: 'data-theme' 
      })
    )
    expect(document.documentElement.getAttribute('data-theme')).toBe('light')
  })

  it('should use custom class names', () => {
    const options: UseColorModeOptions<'light' | 'dark'> = {
      modes: ['light', 'dark'],
      defaultValue: 'light',
      modeClassNames: {
        light: 'theme-light',
        dark: 'theme-dark',
      },
    }
    
    renderHook(() => useColorMode(options))
    expect(document.documentElement.classList.contains('theme-light')).toBe(true)
  })

  it('should set color mode', () => {
    const { result } = renderHook(() => useColorMode(basicOptions))
    
    act(() => {
      result.current[1]('dark')
    })
    
    expect(result.current[0]).toBe('dark')
    expect(document.documentElement.classList.contains('dark')).toBe(true)
    expect(document.documentElement.classList.contains('light')).toBe(false)
  })

  it('should cycle through modes', () => {
    const { result } = renderHook(() => useColorMode(basicOptions))
    
    // Initially 'light'
    expect(result.current[0]).toBe('light')
    
    // Cycle to 'dark'
    act(() => {
      result.current[2]()
    })
    expect(result.current[0]).toBe('dark')
    
    // Cycle to 'auto'
    act(() => {
      result.current[2]()
    })
    expect(result.current[0]).toBe('auto')
    
    // Cycle back to 'light'
    act(() => {
      result.current[2]()
    })
    expect(result.current[0]).toBe('light')
  })

  it('should persist to localStorage', () => {
    const { result } = renderHook(() => useColorMode(basicOptions))
    
    act(() => {
      result.current[1]('dark')
    })
    
    expect(localStorage.getItem('reactuses-color-mode')).toBe('dark')
  })

  it('should use custom storage key', () => {
    const { result } = renderHook(() =>
      useColorMode({ ...basicOptions, storageKey: 'my-theme' })
    )
    
    act(() => {
      result.current[1]('dark')
    })
    
    expect(localStorage.getItem('my-theme')).toBe('dark')
  })

  it('should use custom storage', () => {
    const { result } = renderHook(() =>
      useColorMode({ 
        ...basicOptions, 
        storage: () => sessionStorage 
      })
    )
    
    act(() => {
      result.current[1]('dark')
    })
    
    expect(sessionStorage.getItem('reactuses-color-mode')).toBe('dark')
  })

  it('should use initial value detector', () => {
    const initialValueDetector = jest.fn(() => 'dark')
    const { result } = renderHook(() =>
      useColorMode({ 
        ...basicOptions, 
        initialValueDetector 
      })
    )
    
    expect(result.current[0]).toBe('dark')
    expect(initialValueDetector).toHaveBeenCalled()
  })

  it('should fallback to first mode when detector returns invalid value', () => {
    const initialValueDetector = jest.fn(() => 'invalid' as any)
    const { result } = renderHook(() =>
      useColorMode({ 
        ...basicOptions, 
        initialValueDetector 
      })
    )
    
    expect(result.current[0]).toBe('light') // first mode
  })

  it('should handle detector errors gracefully', () => {
    const initialValueDetector = jest.fn(() => {
      throw new Error('Detector error')
    })
    const { result } = renderHook(() =>
      useColorMode({ 
        ...basicOptions, 
        initialValueDetector 
      })
    )
    
    expect(result.current[0]).toBe('light') // first mode
  })

  it('should work with string union types', () => {
    type Theme = 'light' | 'dark' | 'system' | 'high-contrast'
    const options: UseColorModeOptions<Theme> = {
      modes: ['light', 'dark', 'system', 'high-contrast'],
      defaultValue: 'system',
    }
    
    const { result } = renderHook(() => useColorMode(options))
    expect(result.current[0]).toBe('system')
    
    act(() => {
      result.current[1]('high-contrast')
    })
    expect(result.current[0]).toBe('high-contrast')
  })
})
