import { useEffect, useState } from 'react';
import { isBrowser } from '../utils/is';
import type { UseMouseWheel } from './interface';

export const useMouseWheel: UseMouseWheel = () => {
  const [deltaY, setDeltaY] = useState(0);

  useEffect(() => {
    if (!isBrowser) return;

    const handler = (event: WheelEvent) => {
      setDeltaY(prev => prev + event.deltaY);
    };

    window.addEventListener('wheel', handler, { passive: true });
    return () => window.removeEventListener('wheel', handler);
  }, []);

  return deltaY;
};
