import { renderHook } from "@testing-library/react";
import { useEffect, useState } from "react";
import { flushSync } from "react-dom";

interface UseReferenceImmutabilityOptions {
  width?: number;
  info?: {};
}

// from ReactFiberWorkLoop.js
const NESTED_UPDATE_LIMIT = 50;

const useReferenceImmutability = (
  options: UseReferenceImmutabilityOptions = {}
) => {
  const { info } = options;
  const [loop, setLoop] = useState(0);

  useEffect(() => {
    if (loop > NESTED_UPDATE_LIMIT) {
      throw new Error(
        `[Error: Uncaught "Warning: Maximum update depth exceeded. This can happen when a component calls setState inside useEffect, but useEffect either doesn't have a dependency array, or one of the dependencies changes on every render.%s"]`
      );
    }
    setLoop(loop + 1);
  }, [info]);
};

const immutableInfo = {
  info: {},
};
describe("reference-immutability", () => {
  beforeEach(() => {
    jest.spyOn(console, "error").mockImplementation((error) => {
      throw error;
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  })
  it("should throw when pass mutable data", () => {
    try {
      // avoid render and unmount race condition
      flushSync(() => {
        renderHook(() => useReferenceImmutability({ info: {} }));
      });
    } catch (error) {
      expect(error).toMatchInlineSnapshot(
        `[Error: Uncaught [Error: [Error: Uncaught "Warning: Maximum update depth exceeded. This can happen when a component calls setState inside useEffect, but useEffect either doesn't have a dependency array, or one of the dependencies changes on every render.%s"]]]`
      );
    }
  });

  it("should pass when pass immutable data", () => {
    renderHook(() => useReferenceImmutability(immutableInfo));
  });
});
