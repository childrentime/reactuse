### useDebounceFn

具有以下元素的对象:
- run：执行函数。
- cancel：取消执行函数。
- flush: 立即执行函数

#### Returns
`{ run: _.DebouncedFunc<(...args_0: Parameters<T>) => ReturnType<T>>; cancel: () => void; flush: any; }`

#### Arguments
|参数名|描述|类型|默认值|
|---|---|---|---|
|fn|要防抖的函数|T  **(必填)**|-|
|wait|间隔时间|number |-|
|options|传递给 `lodash.debounce` 的属性|_.DebounceSettings |-|