### useMergedRef

#### Returns
`(node: T | null) => void`: 合并多个 ref 的函数

#### Arguments
|参数名|描述|类型|默认值|
|---|---|---|---|
|refs|-|[PossibleRef](#possibleref)&lt;T&gt;[] |-|

### PossibleRef

```js
export type PossibleRef<T> = Ref<T> | undefined;
```