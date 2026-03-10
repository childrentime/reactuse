/**
 * @title useAsyncFn
 * @returns_en Async function state and trigger
 * @returns_zh 异步函数状态和触发器
 * @returns_zh-Hant 異步函數狀態和觸發器
 */
export interface UseAsyncFnState<T> {
  /**
   * @en Whether the async function is loading
   * @zh 异步函数是否正在加载
   * @zh-Hant 異步函數是否正在載入
   */
  loading: boolean;
  /**
   * @en Error from the async function
   * @zh 异步函数的错误
   * @zh-Hant 異步函數的錯誤
   */
  error: Error | undefined;
  /**
   * @en Value returned by the async function
   * @zh 异步函数返回的值
   * @zh-Hant 異步函數返回的值
   */
  value: T | undefined;
}

export type UseAsyncFn = <T, Args extends any[] = any[]>(
  fn: (...args: Args) => Promise<T>,
  initialState?: Partial<UseAsyncFnState<T>>,
) => readonly [UseAsyncFnState<T>, (...args: Args) => Promise<T | undefined>];
