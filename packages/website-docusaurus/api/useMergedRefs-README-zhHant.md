### useMergedRef

#### Returns
`(node: T | null) => void`: 合併多個 ref 的函數

#### Arguments
|參數名|描述|類型|預設值|
|---|---|---|---|
|refs|-|[PossibleRef](#PossibleRef)&lt;T&gt;[] |-|

### PossibleRef

```js
export type PossibleRef<T> = Ref<T> | undefined;
```