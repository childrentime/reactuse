import { act, renderHook } from "@testing-library/react";
import useThrottleFn from "../../hooks/useThrottleFn";
import { sleep } from "../utils/testingHelpers";

describe("useThrottleFn", () => {
  const setUp = ({ fn, wait }) => renderHook(() => useThrottleFn(fn, wait));

  it("should be defined", () => {
    expect(useThrottleFn).toBeDefined();
  });

  it("run, flush, and cancel should work", async () => {
    let count = 0;
    const throttleFn = (gap: number) => {
      count += gap;
    };

    const hook = setUp({
      fn: throttleFn,
      wait: 500,
    });

    hook.result.current.run(1);
    expect(count).toEqual(1);

    await act(async () => {
      hook.result.current.run(1);
      hook.result.current.run(1);
      hook.result.current.run(1);
      expect(count).toBe(1);
      await sleep(450); // t: 450
      hook.result.current.run(2);
      expect(count).toBe(1);
      await sleep(100); // t: 550
      hook.result.current.run(2);
      expect(count).toBe(3);
      hook.result.current.run(3);
      hook.result.current.run(3);
      await sleep(500); // t: 1050
      expect(count).toBe(6);
      hook.result.current.run(1);
      hook.result.current.run(4);
      hook.result.current.cancel();
      await sleep(500); // t: 1550
      expect(count).toBe(7);
      hook.result.current.run(1);
      hook.result.current.run(1);
      expect(count).toBe(8);
      hook.result.current.flush();
      expect(count).toBe(9);
      await sleep(550); // t: 2100
      expect(count).toBe(9);
    });
  });
});
