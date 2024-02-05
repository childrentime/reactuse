import { renderHook } from "@testing-library/react";
import { useFavicon } from ".";

afterEach(() => {
  const favicon = document.querySelector("link[rel*='icon']");
  if (favicon) {
    favicon.remove();
  }
});

describe("useFavicon", () => {
  it("should be defined", () => {
    expect(useFavicon).toBeDefined();
  });

  it("should create a HTMLLinkElement", () => {
    const faviconBeforeHook = document.querySelector("link[rel*='icon']");

    expect(faviconBeforeHook).toBe(null);
    renderHook(() => useFavicon("My-favicon"));

    const faviconAfterHook = document.querySelector("link[rel*='icon']");
    expect(faviconAfterHook).toBeInstanceOf(HTMLLinkElement);
  });

  it("should set the elements rel to \"icon\"", () => {
    renderHook(() => useFavicon("My-favicon"));
    const favicon = document.querySelector(
      "link[rel*='icon']",
    ) as HTMLLinkElement;

    expect(favicon.rel).toBe("icon");
  });

  it("should set the elements href to the provided string", () => {
    renderHook(() => useFavicon("https://github.com/childrentime/reactuse"));
    const favicon = document.querySelector(
      "link[rel*='icon']",
    ) as HTMLLinkElement;

    expect(favicon.href).toBe("https://github.com/childrentime/reactuse");
  });

  it("should update an existing favicon", () => {
    const hook = renderHook(props => useFavicon(props), {
      initialProps: "https://github.com/childrentime/reactuse",
    });
    const favicon = document.querySelector(
      "link[rel*='icon']",
    ) as HTMLLinkElement;

    expect(favicon.href).toBe("https://github.com/childrentime/reactuse");
    hook.rerender("https://en.wikipedia.org/wiki/Favicon");
    expect(favicon.href).toBe("https://en.wikipedia.org/wiki/Favicon");
  });
});
