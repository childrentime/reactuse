// 初始化错误数组
window.testErrors = []

// 添加全局错误监听器
window.addEventListener('error', (event: MyErrorEvent) => {
  window.testErrors.push({
    message: event.message,
    filename: event.filename,
    lineno: event.lineno,
    colno: event.colno,
    error: event.error,
  })
})

// Jest 配置
beforeEach(() => {
  // 每次测试前清空错误数组
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
