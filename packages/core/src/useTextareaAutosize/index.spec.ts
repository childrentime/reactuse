import { renderHook, act } from '@testing-library/react';
import { useTextareaAutosize } from '.';

describe('useTextareaAutosize', () => {
  it('should return value and setValue', () => {
    const textarea = document.createElement('textarea');
    document.body.appendChild(textarea);

    const { result } = renderHook(() => useTextareaAutosize(textarea));
    expect(result.current.value).toBe('');
    expect(typeof result.current.setValue).toBe('function');
    expect(typeof result.current.triggerResize).toBe('function');

    document.body.removeChild(textarea);
  });

  it('should update value', () => {
    const textarea = document.createElement('textarea');
    document.body.appendChild(textarea);

    const { result } = renderHook(() => useTextareaAutosize(textarea));

    act(() => {
      result.current.setValue('hello');
    });
    expect(result.current.value).toBe('hello');

    document.body.removeChild(textarea);
  });
});
