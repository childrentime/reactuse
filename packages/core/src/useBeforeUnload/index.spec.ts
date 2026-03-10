import { renderHook } from '@testing-library/react';
import { useBeforeUnload } from '.';

describe('useBeforeUnload', () => {
  it('should add beforeunload event listener', () => {
    const addSpy = jest.spyOn(window, 'addEventListener');
    renderHook(() => useBeforeUnload());
    expect(addSpy).toHaveBeenCalledWith('beforeunload', expect.any(Function));
    addSpy.mockRestore();
  });

  it('should remove listener on unmount', () => {
    const removeSpy = jest.spyOn(window, 'removeEventListener');
    const { unmount } = renderHook(() => useBeforeUnload());
    unmount();
    expect(removeSpy).toHaveBeenCalledWith('beforeunload', expect.any(Function));
    removeSpy.mockRestore();
  });

  it('should accept boolean', () => {
    const addSpy = jest.spyOn(window, 'addEventListener');
    renderHook(() => useBeforeUnload(false));
    expect(addSpy).toHaveBeenCalled();
    addSpy.mockRestore();
  });

  it('should accept function', () => {
    const addSpy = jest.spyOn(window, 'addEventListener');
    renderHook(() => useBeforeUnload(() => true));
    expect(addSpy).toHaveBeenCalled();
    addSpy.mockRestore();
  });
});
