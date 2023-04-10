export const createMockMediaMatcher
  = (matches: Record<string, boolean>) => (qs: string) => ({
    matches: matches[qs] ?? false,
    addListener: () => void 0,
    removeListener: () => void 0,
  });

export const createMockRaf = () => {
  let allCallbacks: { id: number; cb: FrameRequestCallback }[] = [];
  let prevTime = 0;
  let id = 0;

  const now = () => {
    return prevTime;
  };

  const raf = (cb: FrameRequestCallback) => {
    id++;
    allCallbacks.push({ id, cb });
    return id;
  };

  const defaultTimeInterval = 1000 / 60;
  const singleStep = (ms: number) => {
    const allCallbacksBefore = allCallbacks.slice();
    allCallbacks = [];

    prevTime += ms;
    allCallbacksBefore.forEach(({ cb }) => cb(prevTime));
  };

  const step = (howMany = 1, ms = defaultTimeInterval) => {
    for (let i = 0; i < howMany; i++) {
      singleStep(ms);
    }
  };

  return { now, raf, step };
};
