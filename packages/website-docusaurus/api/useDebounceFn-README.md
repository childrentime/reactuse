### useDebounceFn

#### Returns
`args_0: Parameters<T>) => ReturnType<T>>; cancel: () => void; flush: any; }`: A object with the following elements:
- run: exec function.
- cancel: cancel exec function.
- flush:  immediately exec function

#### Arguments
|Argument|Description|Type|DefaultValue|
|---|---|---|---|
|fn|debounce function|T  **(Required)**|-|
|wait|wait time|number \| undefined |-|
|options|options passed to `lodash.debounce`|_.DebounceSettings \| undefined |-|