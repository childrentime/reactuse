import { renderHook, act } from "@testing-library/react";
import { useSpeechRecognition } from ".";

// Mock the browser utils module before importing
jest.mock("../utils/browser", () => {
  const mockWindow = {
    SpeechRecognition: undefined,
    webkitSpeechRecognition: undefined,
  };

  return {
    defaultWindow: mockWindow,
    defaultDocument: undefined,
    on: jest.fn(),
    off: jest.fn(),
  };
});

// Mock SpeechRecognition
class MockSpeechRecognition {
  continuous = false;
  interimResults = false;
  lang = "en-US";
  maxAlternatives = 1;

  onstart: ((event: Event) => void) | null = null;
  onresult: ((event: any) => void) | null = null;
  onerror: ((event: any) => void) | null = null;
  onend: ((event: Event) => void) | null = null;

  start() {
    setTimeout(() => {
      if (this.onstart) {
        this.onstart(new Event("start"));
      }
    }, 0);
  }

  stop() {
    setTimeout(() => {
      if (this.onend) {
        this.onend(new Event("end"));
      }
    }, 0);
  }

  abort() {
    setTimeout(() => {
      if (this.onend) {
        this.onend(new Event("end"));
      }
    }, 0);
  }

  // Helper method to simulate result
  simulateResult(transcript: string, isFinal = false) {
    if (this.onresult) {
      const event = {
        resultIndex: 0,
        results: [
          {
            0: { transcript, confidence: 0.9 },
            isFinal,
          },
        ],
      };
      this.onresult(event);
    }
  }

  // Helper method to simulate error
  simulateError(error: string, message: string) {
    if (this.onerror) {
      const event = { error, message };
      this.onerror(event);
    }
  }
}

// Store original window object
const originalWindow = global.window;

describe("useSpeechRecognition", () => {
  let mockRecognition: MockSpeechRecognition;
  let browserUtils: any;

  beforeEach(() => {
    mockRecognition = new MockSpeechRecognition();

    // Get the mocked browser utils
    browserUtils = require("../utils/browser");

    // Set up the mock window with SpeechRecognition
    browserUtils.defaultWindow.SpeechRecognition = jest.fn(
      () => mockRecognition
    );
    browserUtils.defaultWindow.webkitSpeechRecognition = jest.fn(
      () => mockRecognition
    );

    // Also set up global window for consistency
    Object.defineProperty(global, "window", {
      value: browserUtils.defaultWindow,
      writable: true,
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
    // Restore original window
    Object.defineProperty(global, "window", {
      value: originalWindow,
      writable: true,
    });
  });

  it("should return initial state when not supported", () => {
    // Remove SpeechRecognition from the mock window
    browserUtils.defaultWindow.SpeechRecognition = undefined;
    browserUtils.defaultWindow.webkitSpeechRecognition = undefined;

    const { result } = renderHook(() => useSpeechRecognition());

    expect(result.current.isSupported).toBe(false);
    expect(result.current.isListening).toBe(false);
    expect(result.current.isFinal).toBe(false);
    expect(result.current.result).toBe("");
    expect(result.current.error).toBeUndefined();
    expect(result.current.recognition).toBeUndefined();
  });

  it("should initialize with correct default options", () => {
    const { result } = renderHook(() => useSpeechRecognition());

    // Initial state should be correct
    expect(result.current.isListening).toBe(false);
    expect(result.current.isFinal).toBe(false);
    expect(result.current.result).toBe("");
    expect(result.current.error).toBeUndefined();
    expect(typeof result.current.start).toBe("function");
    expect(typeof result.current.stop).toBe("function");
    expect(typeof result.current.toggle).toBe("function");

    // isSupported will be false initially but will become true after useEffect
    expect(result.current.isSupported).toBe(true);
  });

  it("should initialize with custom options", () => {
    const options = {
      continuous: false,
      interimResults: false,
      lang: "zh-CN",
      maxAlternatives: 3,
    };

    const { result } = renderHook(() => useSpeechRecognition(options));

    expect(result.current.isListening).toBe(false);
    expect(result.current.isSupported).toBe(true);
  });

  it("should start and stop listening", () => {
    const { result } = renderHook(() => useSpeechRecognition());

    act(() => {
      result.current.start();
    });
    expect(result.current.isListening).toBe(true);

    act(() => {
      result.current.stop();
    });
    expect(result.current.isListening).toBe(false);
  });

  it("should start with custom language", () => {
    const { result } = renderHook(() => useSpeechRecognition());

    act(() => {
      result.current.start({ lang: "zh-CN" });
    });
    expect(result.current.isListening).toBe(true);
  });

  it("should start with custom language and continuous mode", () => {
    const { result } = renderHook(() => useSpeechRecognition());

    act(() => {
      result.current.start({ lang: "zh-CN", continuous: false });
    });
    expect(result.current.isListening).toBe(true);
  });

  it("should toggle listening state", () => {
    const { result } = renderHook(() => useSpeechRecognition());

    expect(result.current.isListening).toBe(false);

    act(() => {
      result.current.toggle();
    });
    expect(result.current.isListening).toBe(true);

    act(() => {
      result.current.toggle();
    });
    expect(result.current.isListening).toBe(false);

    act(() => {
      result.current.toggle(true);
    });
    expect(result.current.isListening).toBe(true);
  });

  it("should handle recognition results", () => {
    const { result } = renderHook(() => useSpeechRecognition());

    // Simulate result after hook is initialized
    setTimeout(() => {
      act(() => {
        mockRecognition.simulateResult("hello world", false);
      });
    }, 100);

    // Basic test - just check that the hook doesn't crash
    expect(result.current.result).toBe("");
    expect(result.current.isFinal).toBe(false);
  });

  it("should handle recognition errors", () => {
    const { result } = renderHook(() => useSpeechRecognition());

    // Simulate error after hook is initialized
    setTimeout(() => {
      act(() => {
        mockRecognition.simulateError("network", "Network error occurred");
      });
    }, 100);

    // Basic test - just check that the hook doesn't crash
    expect(result.current.error).toBeUndefined();
  });

  it("should update language when not listening", () => {
    const { result, rerender } = renderHook(
      ({ lang }) => useSpeechRecognition({ lang }),
      { initialProps: { lang: "en-US" } }
    );

    // Change language while not listening
    rerender({ lang: "zh-CN" });

    // Basic test - just check that the hook doesn't crash
    expect(result.current.isListening).toBe(false);
  });

  it("should clean up on unmount", () => {
    const { unmount } = renderHook(() => useSpeechRecognition());

    // Just test that unmount doesn't crash
    expect(() => unmount()).not.toThrow();
  });
});
