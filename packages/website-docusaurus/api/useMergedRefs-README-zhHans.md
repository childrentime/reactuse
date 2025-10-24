### useMergedRef

#### Returns
`(node: T | null) => void`: 合併多個 ref 的函數

#### Arguments
|参数名|描述|类型|默认值|
|---|---|---|---|
|refs|-|[PossibleRef](#possibleref)&lt;T&gt;[] |-|

### PossibleRef

```js
export type PossibleRef<T> = Ref<T> | undefined;
```