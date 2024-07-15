### useCustomCompareEffect

#### Returns

`void`

#### Arguments

| Argument  | Description           | Type                                                            | DefaultValue |
| --------- | --------------------- | --------------------------------------------------------------- | ------------ |
| effect    | effect callback       | React.EffectCallback **(Required)**                             | -            |
| deps      | deps                  | TDeps **(Required)**                                            | -            |
| depsEqual | deps compare function | [DepsEqualFnType](#DepsEqualFnType)&lt;TDeps&gt; **(Required)** | -            |

### DepsEqualFnType

```js
export type DepsEqualFnType<TDeps extends DependencyList> = (prevDeps: TDeps, nextDeps: TDeps) => boolean
```
