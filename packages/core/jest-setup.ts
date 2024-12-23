// Initialize error array
window.testErrors = []

// Add global error listener
window.addEventListener('error', (event: MyErrorEvent) => {
  window.testErrors.push({
    message: event.message,
    filename: event.filename,
    lineno: event.lineno,
    colno: event.colno,
    error: event.error,
  })
})

// Jest configuration
beforeEach(() => {
  // Clear error array before each test
  window.testErrors = []
})

expect.extend({
  toHaveErrorMatching(received: typeof window.testErrors, expectedError: string | RegExp) {
    const pass = received.some(error =>
      typeof expectedError === 'string'
        ? error.message.includes(expectedError)
        : expectedError.test(error.message),
    )

    return {
      pass,
      message: () =>
        pass
          ? `Expected errors not to contain message matching ${expectedError}`
          : `Expected errors to contain message matching ${expectedError}`,
    }
  },
})
