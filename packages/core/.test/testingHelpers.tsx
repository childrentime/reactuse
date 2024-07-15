export function sleep(time: number) {
  return new Promise<void>(resolve => {
    setTimeout(() => {
      resolve()
    }, time)
  })
}

export function request(req) {
  return new Promise((resolve, reject) =>
    setTimeout(() => {
      if (req === 0) {
        reject(new Error('fail'))
      }
      else {
        resolve('success')
      }
    }, 1000),
  )
}

export function createTestComponent(hook: (...args: any[]) => any) {
  return function TestComponent() {
    const result = hook()
    return <>{JSON.stringify(result)}</>
  }
}
