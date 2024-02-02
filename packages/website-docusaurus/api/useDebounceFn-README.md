### useDebounceFn

A object with the following elements:
- run: exec function.
- cancel: cancel exec function.
- flush:  immediately exec function

#### Returns
`{ run: _.DebouncedFunc<(...args_0: Parameters<T>) => ReturnType<T>>; cancel: () => void; flush: any; }`

#### Arguments
|Argument|Description|Type|DefaultValue|
|---|---|---|---|
|fn|debounce function|T  **(Required)**|-|
|wait|wait time|number |-|
|options|options passed to `lodash.debounce`|_.DebounceSettings |-|