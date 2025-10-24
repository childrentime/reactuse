### useMergedRef

#### Returns
`(node: T | null) => void`: A function that merges multiple refs

#### Arguments
|Argument|Description|Type|DefaultValue|
|---|---|---|---|
|refs|-|[PossibleRef](#PossibleRef)&lt;T&gt;[] |-|

### PossibleRef

```js
export type PossibleRef<T> = Ref<T> | undefined;
```