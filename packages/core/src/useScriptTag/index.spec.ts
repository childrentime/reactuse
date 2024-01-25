import { act, renderHook } from "@testing-library/react";
import useScriptTag from ".";

describe(useScriptTag, () => {
  const src = "https://code.jquery.com/jquery-3.5.1.min.js";

  const scriptTagElement = (): HTMLScriptElement | null =>
    document.head.querySelector(`script[src="${src}"]`);

  beforeEach(() => {
    const els = document.querySelectorAll<HTMLScriptElement>("script");
    els.forEach(el => document.head.removeChild(el));
  });

  it("should add script tag", async () => {
    const appendChildListener = jest.spyOn(document.head, "appendChild");

    expect(appendChildListener).not.toBeCalled();

    expect(scriptTagElement()).toBeNull();

    renderHook(() => {
      const [scriptTag] = useScriptTag(src, () => {}, { immediate: true });

      return {
        scriptTag,
      };
    });

    expect(appendChildListener).toBeCalled();
    expect(scriptTagElement()).toBeInstanceOf(HTMLScriptElement);
  });

  it("should re-use the same src for multiple loads", async () => {
    const addChildListener = jest.spyOn(document.head, "appendChild");

    expect(addChildListener).not.toBeCalled();

    expect(scriptTagElement()).toBeNull();

    const hook = renderHook(() => {
      const script1 = useScriptTag(src, () => {}, {
        immediate: false,
        manual: true,
      });
      const script2 = useScriptTag(src, () => {}, {
        immediate: false,
        manual: true,
      });

      return {
        script1,
        script2,
      };
    });

    await act(async () => {
      await hook.result.current.script1[2](false);
    });
    await act(async () => {
      await hook.result.current.script2[2](false);
    });

    act(() => hook.rerender());

    expect(hook.result.current.script1[0]).not.toBeNull();
    expect(hook.result.current.script2[0]).not.toBeNull();

    expect(addChildListener).toBeCalledTimes(1);
    expect(scriptTagElement()).toBeInstanceOf(HTMLScriptElement);
  });

  it("should support custom attributes", async () => {
    const appendChildListener = jest.spyOn(document.head, "appendChild");

    expect(appendChildListener).not.toBeCalled();

    expect(scriptTagElement()).toBeNull();

    renderHook(() => {
      const [scriptTag] = useScriptTag(src, () => {}, {
        attrs: { "id": "id-value", "data-test": "data-test-value" },
        immediate: true,
      });

      return {
        scriptTag,
      };
    });

    expect(appendChildListener).toBeCalled();

    const element = scriptTagElement();
    expect(element).toBeInstanceOf(HTMLScriptElement);
    expect(element?.getAttribute("id")).toBe("id-value");
    expect(element?.getAttribute("data-test")).toBe("data-test-value");
  });

  it("should remove script tag on unmount", async () => {
    const removeChildListener = jest.spyOn(document.head, "removeChild");

    expect(removeChildListener).not.toBeCalled();

    expect(scriptTagElement()).toBeNull();

    const hook = renderHook(() => {
      const [scriptTag, _status, load, unload] = useScriptTag(src, () => {}, {
        immediate: false,
      });

      return {
        scriptTag,
        load,
        unload,
      };
    });

    await act(async () => {
      await hook.result.current.load(false);
    });

    expect(scriptTagElement()).toBeInstanceOf(HTMLScriptElement);

    hook.unmount();

    expect(scriptTagElement()).toBeNull();

    expect(removeChildListener).toBeCalled();

    expect(hook.result.current.scriptTag).toBeNull();
  });

  it("should remove script tag on unload call", async () => {
    const removeChildListener = jest.spyOn(document.head, "removeChild");

    expect(removeChildListener).not.toBeCalled();

    expect(scriptTagElement()).toBeNull();

    const vm = renderHook(() => {
      const [scriptTag, _status, load, unload] = useScriptTag(src, () => {}, {
        immediate: false,
      });

      return {
        scriptTag,
        load,
        unload,
      };
    });

    await vm.result.current.load(false);

    expect(scriptTagElement()).toBeInstanceOf(HTMLScriptElement);

    await vm.result.current.unload();

    expect(scriptTagElement()).toBeNull();

    expect(removeChildListener).toBeCalled();

    expect(vm.result.current.scriptTag).toBeNull();
  });

  it("should remove script tag on unload call after multiple loads", async () => {
    const removeChildListener = jest.spyOn(document.head, "removeChild");

    expect(removeChildListener).not.toBeCalled();

    expect(scriptTagElement()).toBeNull();

    const vm = renderHook(() => {
      const script1 = useScriptTag(src, () => {}, {
        immediate: false,
        manual: true,
      });
      const script2 = useScriptTag(src, () => {}, {
        immediate: false,
        manual: true,
      });

      return {
        script1,
        script2,
      };
    });

    // Multiple Loads
    await vm.result.current.script1[2](false);
    await vm.result.current.script2[2](false);

    expect(scriptTagElement()).toBeInstanceOf(HTMLScriptElement);

    vm.result.current.script1[3]();
    vm.result.current.script2[3]();

    expect(vm.result.current.script1[0]).toBeNull();
    expect(vm.result.current.script2[0]).toBeNull();
    expect(removeChildListener).toBeCalledTimes(1);
    expect(scriptTagElement()).toBeNull();
  });
});
