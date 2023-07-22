import { act, renderHook } from "@testing-library/react";
import Cookies from "js-cookie";
import useCookie from ".";

describe("useCookie", () => {
  const setUp = (
    key: string,
    defaultValue,
    options?: Cookies.CookieAttributes,
  ) =>
    renderHook(() => {
      const [state, setState, refresh] = useCookie(key, options, defaultValue);
      return {
        state,
        setState,
        refresh,
      } as const;
    });

  it("test getKey", () => {
    const COOKIE = "test-key";
    const hook = setUp(COOKIE, "A");
    expect(hook.result.current.state).toBe("A");
    act(() => {
      hook.result.current.setState("B");
    });
    expect(hook.result.current.state).toBe("B");
    const anotherHook = setUp(COOKIE, {
      defaultValue: "A",
    });
    expect(anotherHook.result.current.state).toBe("B");
    act(() => {
      anotherHook.result.current.setState("C");
    });
    expect(anotherHook.result.current.state).toBe("C");
    expect(hook.result.current.state).toBe("B");
    expect(Cookies.get(COOKIE)).toBe("C");
  });

  it("test support undefined", () => {
    const COOKIE = "test-boolean-key-with-undefined";
    const hook = setUp(COOKIE, "undefined");
    expect(hook.result.current.state).toBe("undefined");
    act(() => {
      hook.result.current.setState(undefined);
    });
    expect(hook.result.current.state).toBeUndefined();
    const anotherHook = setUp(COOKIE, "false");
    expect(anotherHook.result.current.state).toBe("false");
    expect(Cookies.get(COOKIE)).toBe("false");
    act(() => {
      // @ts-expect-error test empty
      hook.result.current.setState();
    });
    expect(hook.result.current.state).toBeUndefined();
    expect(Cookies.get(COOKIE)).toBeUndefined();
  });

  it("test support empty string", () => {
    Cookies.set("test-key-empty-string", "");
    expect(Cookies.get("test-key-empty-string")).toBe("");
    const COOKIE = "test-key-empty-string";
    const hook = setUp(COOKIE, "hello");
    expect(hook.result.current.state).toBe("");
  });

  it("test support function updater", () => {
    const COOKIE = "test-func-updater";
    const hook = setUp(COOKIE, "hello world");
    expect(hook.result.current.state).toBe("hello world");
    act(() => {
      hook.result.current.setState(state => `${state}, zhangsan`);
    });
    expect(hook.result.current.state).toBe("hello world, zhangsan");
  });

  it("using the same cookie name", () => {
    const COOKIE_NAME = "test-same-cookie-name";
    const { result: result1 } = setUp(COOKIE_NAME, "A");
    // already has cookie, use it.
    const { result: result2 } = setUp(COOKIE_NAME, "B");
    expect(result1.current.state).toBe("A");
    expect(result2.current.state).toBe("A");
    act(() => {
      result1.current.setState("C");
    });
    expect(result1.current.state).toBe("C");
    expect(result2.current.state).toBe("A");
    expect(Cookies.get(COOKIE_NAME)).toBe("C");
    act(() => {
      result2.current.setState("D");
    });
    expect(result1.current.state).toBe("C");
    expect(result2.current.state).toBe("D");
    expect(Cookies.get(COOKIE_NAME)).toBe("D");
  });

  it("test refresh", () => {
    const COOKIE = "test-refresh";
    const { result } = setUp(COOKIE, "A");
    expect(result.current.state).toBe("A");
    act(() => {
      Cookies.set(COOKIE, "B");
    });
    expect(result.current.state).toBe("A");
    expect(Cookies.get(COOKIE)).toBe("B");
    act(() => {
      result.current.refresh();
    });
    expect(result.current.state).toBe("B");
    expect(Cookies.get(COOKIE)).toBe("B");
  });
});
