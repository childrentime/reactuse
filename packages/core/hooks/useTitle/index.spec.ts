import { renderHook } from "@testing-library/react";
import useTitle from ".";

afterEach(() => {
  if (document.title) {
    document.title = "";
  }
});

describe("useTitle", () => {
  it("should be defined", () => {
    expect(useTitle).toBeDefined();
  });

  it("should create title", () => {
    expect(document.title).toBe("");
    renderHook(() => useTitle("title"));
    expect(document.title).toBe("title");
  });

  it("should change title", () => {
    expect(document.title).toBe("");
    renderHook(() => useTitle("title"));
    expect(document.title).toBe("title");
    renderHook(() => useTitle("newTitle"));
    expect(document.title).toBe("newTitle");
  });
});
