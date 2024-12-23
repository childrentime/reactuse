declare global {
  interface Window {
    testErrors: MyErrorEvent[]
  }
  interface MyErrorEvent {
    message: string
    filename?: string
    lineno?: number
    colno?: number
    error?: Error
  }
  namespace jest {
    interface Matchers<R> {
      // eslint-disable-next-line ts/method-signature-style
      toHaveErrorMatching(expectedError: string | RegExp): R
    }
  }
}

export {}
