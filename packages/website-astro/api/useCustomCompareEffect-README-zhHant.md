### useCustomCompareEffect

#### Returns
`void`

#### Arguments
|參數名|描述|類型|預設值|
|---|---|---|---|
|effect|副作用函数|React.EffectCallback  **(必填)**|-|
|deps|依赖列表|TDeps  **(必填)**|-|
|depsEqual|依赖比较函数|[DepsEqualFnType](#depsequalfntype)&lt;TDeps&gt;  **(必填)**|-|

### DepsEqualFnType

```js
export type DepsEqualFnType<TDeps extends DependencyList> = (prevDeps: TDeps, nextDeps: TDeps) => boolean;
```