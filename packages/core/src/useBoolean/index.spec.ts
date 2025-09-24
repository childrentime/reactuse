import { act, renderHook } from '@testing-library/react'
import { useBoolean } from '.'

describe('useBoolean', () => {
  function setUp(initialValue?: boolean) {
    return renderHook(() => useBoolean(initialValue))
  }

  it('should init with default value false', () => {
    const { result } = setUp()
    const { value, setValue, setTrue, setFalse, toggle } = result.current
    
    expect(value).toBe(false)
    expect(typeof setValue).toBe('function')
    expect(typeof setTrue).toBe('function')
    expect(typeof setFalse).toBe('function')
    expect(typeof toggle).toBe('function')
  })

  it('should init with provided initial value true', () => {
    const { result } = setUp(true)
    const { value } = result.current
    
    expect(value).toBe(true)
  })

  it('should init with provided initial value false', () => {
    const { result } = setUp(false)
    const { value } = result.current
    
    expect(value).toBe(false)
  })

  it('should setValue work correctly', () => {
    const { result } = setUp(false)
    
    expect(result.current.value).toBe(false)
    
    act(() => {
      result.current.setValue(true)
    })
    
    expect(result.current.value).toBe(true)
    
    act(() => {
      result.current.setValue(false)
    })
    
    expect(result.current.value).toBe(false)
  })

  it('should setTrue work correctly', () => {
    const { result } = setUp(false)
    
    expect(result.current.value).toBe(false)
    
    act(() => {
      result.current.setTrue()
    })
    
    expect(result.current.value).toBe(true)
    
    // Should still be true when called again
    act(() => {
      result.current.setTrue()
    })
    
    expect(result.current.value).toBe(true)
  })

  it('should setFalse work correctly', () => {
    const { result } = setUp(true)
    
    expect(result.current.value).toBe(true)
    
    act(() => {
      result.current.setFalse()
    })
    
    expect(result.current.value).toBe(false)
    
    // Should still be false when called again
    act(() => {
      result.current.setFalse()
    })
    
    expect(result.current.value).toBe(false)
  })

  it('should toggle work correctly', () => {
    const { result } = setUp(false)
    
    expect(result.current.value).toBe(false)
    
    act(() => {
      result.current.toggle()
    })
    
    expect(result.current.value).toBe(true)
    
    act(() => {
      result.current.toggle()
    })
    
    expect(result.current.value).toBe(false)
  })

  it('should toggle work correctly from initial true', () => {
    const { result } = setUp(true)
    
    expect(result.current.value).toBe(true)
    
    act(() => {
      result.current.toggle()
    })
    
    expect(result.current.value).toBe(false)
    
    act(() => {
      result.current.toggle()
    })
    
    expect(result.current.value).toBe(true)
  })

  it('should maintain function reference stability', () => {
    const { result, rerender } = setUp(false)
    
    const initialSetValue = result.current.setValue
    const initialSetTrue = result.current.setTrue
    const initialSetFalse = result.current.setFalse
    const initialToggle = result.current.toggle
    
    // Trigger a rerender by changing the value
    act(() => {
      result.current.toggle()
    })
    
    rerender()
    
    // Functions should maintain the same reference
    expect(result.current.setValue).toBe(initialSetValue)
    expect(result.current.setTrue).toBe(initialSetTrue)
    expect(result.current.setFalse).toBe(initialSetFalse)
    expect(result.current.toggle).toBe(initialToggle)
  })

  it('should work with multiple operations in sequence', () => {
    const { result } = setUp()
    
    expect(result.current.value).toBe(false)
    
    act(() => {
      result.current.setTrue()
    })
    expect(result.current.value).toBe(true)
    
    act(() => {
      result.current.toggle()
    })
    expect(result.current.value).toBe(false)
    
    act(() => {
      result.current.setValue(true)
    })
    expect(result.current.value).toBe(true)
    
    act(() => {
      result.current.setFalse()
    })
    expect(result.current.value).toBe(false)
  })
})
