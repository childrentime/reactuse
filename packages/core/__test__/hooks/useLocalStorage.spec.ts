import { act, renderHook } from "@testing-library/react";
import useLocalStorage from "../../hooks/useLocalStorage";

describe(useLocalStorage, () => {
  afterEach(() => {
    localStorage.clear();
  });

  it("retrieves an existing value from localStorage", () => {
    localStorage.setItem("foo", "bar");
    const { result } = renderHook(() => useLocalStorage("foo", ""));
    const [state] = result.current;
    expect(state).toEqual("bar");
  });

  it("should return initialValue if localStorage empty and set that to localStorage", () => {
    const { result } = renderHook(() => useLocalStorage("foo", "bar"));
    const [state] = result.current;
    expect(state).toEqual("bar");
    expect(localStorage.getItem("foo")).toEqual("bar");
  });

  it("prefers existing value over initial state", () => {
    localStorage.setItem("foo", "bar");
    const { result } = renderHook(() => useLocalStorage("foo", "baz"));
    const [state] = result.current;
    expect(state).toEqual("bar");
  });

  it("does not clobber existing localStorage with initialState", () => {
    localStorage.setItem("foo", "bar");
    const { result } = renderHook(() => useLocalStorage("foo", "buzz"));
    expect(result.current).toBeTruthy();
    expect(localStorage.getItem("foo")).toEqual("bar");
  });

  it("correctly updates localStorage", () => {
    const { result, rerender } = renderHook(() =>
      useLocalStorage("foo", "bar"),
    );

    const [, setFoo] = result.current;
    act(() => setFoo("baz"));
    rerender();

    expect(localStorage.getItem("foo")).toEqual("baz");
  });

  it("should return undefined and clear localStorage if set null", () => {
    const { result } = renderHook(() => useLocalStorage("some_key", "bar"));
    expect(localStorage.getItem("some_key")).toBe("bar");
    const [, setState] = result.current;
    act(() => setState(null));
    expect(result.current[0]).toBeNull();
    expect(localStorage.getItem("some_key")).toBeNull();
  });

  it("sets initialState if initialState is an object", () => {
    renderHook(() => useLocalStorage("foo", { bar: true }));
    expect(localStorage.getItem("foo")).toEqual("{\"bar\":true}");
  });

  it("correctly and promptly returns a new value", () => {
    const { result, rerender } = renderHook(() =>
      useLocalStorage("foo", "bar"),
    );

    const [, setFoo] = result.current;
    act(() => setFoo("baz"));
    rerender();

    const [foo] = result.current;
    expect(foo).toEqual("baz");
  });

  it("reinitializes state when key changes", () => {
    let key = "foo";
    const { result, rerender } = renderHook(() => useLocalStorage(key, "bar"));

    const [, setState] = result.current;
    act(() => setState("baz"));
    key = "bar";
    rerender();

    const [state] = result.current;
    expect(state).toEqual("bar");
  });

  it("parses out objects from localStorage", () => {
    localStorage.setItem("foo", JSON.stringify({ ok: true }));
    const { result } = renderHook(() => useLocalStorage("foo", { ok: false }));
    const [foo] = result.current;
    expect(foo?.ok).toEqual(true);
  });

  it("safely initializes objects to localStorage", () => {
    const { result } = renderHook(() =>
      useLocalStorage<{ ok: boolean }>("foo", { ok: true }),
    );
    const [foo] = result.current;
    expect(foo?.ok).toEqual(true);
  });

  it("safely sets objects to localStorage", () => {
    const { result, rerender } = renderHook(() =>
      useLocalStorage<{ ok: any }>("foo", { ok: true }),
    );

    const [, setFoo] = result.current;
    act(() => setFoo({ ok: "bar" }));
    rerender();

    const [foo] = result.current;
    expect(foo?.ok).toEqual("bar");
  });

  it("safely returns objects from updates", () => {
    const { result, rerender } = renderHook(() =>
      useLocalStorage<{ ok: any }>("foo", { ok: true }),
    );

    const [, setFoo] = result.current;
    act(() => setFoo({ ok: "bar" }));
    rerender();

    const [foo] = result.current;
    expect(foo).toBeInstanceOf(Object);
    expect(foo?.ok).toEqual("bar");
  });

  it("sets localStorage from the function updater", () => {
    const { result, rerender } = renderHook(() =>
      useLocalStorage<{ foo: string; fizz?: string }>("foo", { foo: "bar" }),
    );

    const [, setFoo] = result.current;
    act(() => setFoo(state => ({ ...state!, fizz: "buzz" })));
    rerender();

    const [value] = result.current;
    expect(value?.foo).toEqual("bar");
    expect(value?.fizz).toEqual("buzz");
  });

  it("memoizes an object between rerenders", () => {
    const { result, rerender } = renderHook(() =>
      useLocalStorage("foo", { ok: true }),
    );
    (() => {
      return result.current;
    })();
    rerender();
    const [r2] = result.current;
    rerender();
    const [r3] = result.current;
    expect(r2).toBe(r3);
  });

  it("memoizes an object immediately if localStorage is already set", () => {
    localStorage.setItem("foo", JSON.stringify({ ok: true }));
    const { result, rerender } = renderHook(() =>
      useLocalStorage("foo", { ok: true }),
    );

    const [r1] = result.current;
    rerender();
    const [r2] = result.current;
    expect(r1).toBe(r2);
  });

  it("memoizes the setState function", () => {
    localStorage.setItem("foo", JSON.stringify({ ok: true }));
    const { result, rerender } = renderHook(() =>
      useLocalStorage("foo", { ok: true }),
    );
    const [, s1] = result.current;
    rerender();
    const [, s2] = result.current;
    expect(s1).toBe(s2);
  });

  it("date", async () => {
    localStorage.setItem("KEY", "2000-01-01T00:00:00.000Z");

    const { result, rerender } = renderHook(() =>
      useLocalStorage("KEY", new Date("2000-01-02T00:00:00.000Z")),
    );
    const [state, setState] = result.current;
    expect(state).toEqual(new Date("2000-01-01T00:00:00.000Z"));
    act(() => setState(new Date("2000-01-03T00:00:00.000Z")));
    rerender();
    expect(localStorage.getItem("KEY")).toBe("2000-01-03T00:00:00.000Z");
  });

  it("map", async () => {
    const { result, rerender } = renderHook(() =>
      useLocalStorage(
        "key",
        new Map<number, string | number>([
          [1, "a"],
          [2, 2],
        ]),
      ),
    );
    const [state, setState] = result.current;
    expect(state).toEqual(
      new Map<number, string | number>([
        [1, "a"],
        [2, 2],
      ]),
    );
    act(() =>
      setState(
        new Map<number, string | number>([
          [1, "a"],
          [2, 3],
        ]),
      ),
    );
    rerender();
    expect(result.current[0]).toEqual(
      new Map<number, string | number>([
        [1, "a"],
        [2, 3],
      ]),
    );
  });

  it("set", () => {
    const { result, rerender } = renderHook(() =>
      useLocalStorage("key", new Set<string | number>([1, "a"])),
    );
    const [state, setState] = result.current;
    expect(state).toEqual(new Set<string | number>([1, "a"]));
    act(() => setState(new Set<string | number>([1, "b"])));
    rerender();
    expect(result.current[0]).toEqual(new Set<string | number>([1, "b"]));
  });

  it("custom serializer", () => {
    const { result, rerender } = renderHook(() =>
      useLocalStorage("key", 0, {
        serializer: { read: JSON.parse, write: JSON.stringify },
      }),
    );
    const [state, setState] = result.current;
    expect(state).toEqual(0);
    act(() => setState({ name: "a", data: 123 }));
    rerender();
    expect(result.current[0]).toEqual({ name: "a", data: 123 });
    expect(localStorage.getItem("key")).toEqual("{\"name\":\"a\",\"data\":123}");
  });
});
