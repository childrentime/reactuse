### useDebounceFn

#### Returns
`{ run: _.DebouncedFunc<(...args_0: Parameters<T>) => ReturnType<T>>; cancel: () => void; flush: any; }`: 具有以下元素的對象:
- run：執行函數。
- cancel：取消執行函數。
- flush: 立即執行函數

#### Arguments
|參數名|描述|類型|預設值|
|---|---|---|---|
|fn|要防抖的函数|T  **(必填)**|-|
|wait|间隔时间|number \| undefined |-|
|options|传递给 `lodash.debounce` 的属性|_.DebounceSettings \| undefined |-|