### useMergedRef

#### Returns
`(node: T | null) => void`

#### Arguments
|参数名|描述|类型|默认值|
|---|---|---|---|
|refs|-|[PossibleRef](#PossibleRef)&lt;T&gt;[] |-|

### PossibleRef

```js
export type PossibleRef<T> = Ref<T> | undefined;
```