### useMergedRef

#### Returns
`(node: T | null) => void`

#### Arguments
|Argument|Description|Type|DefaultValue|
|---|---|---|---|
|refs|-|[PossibleRef](#PossibleRef)&lt;T&gt;[] |-|

### PossibleRef

```js
export type PossibleRef<T> = Ref<T> | undefined;
```