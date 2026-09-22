### useCustomCompareEffect

#### Returns
`void`

#### Arguments
|參數名|描述|類型|預設值|
|---|---|---|---|
|effect|副作用函數|React.EffectCallback  **(必填)**|-|
|deps|依賴列表|TDeps  **(必填)**|-|
|depsEqual|依賴比較函數|[DepsEqualFnType](#depsequalfntype)&lt;TDeps&gt;  **(必填)**|-|

### DepsEqualFnType

```js
export type DepsEqualFnType<TDeps extends DependencyList> = (prevDeps: TDeps, nextDeps: TDeps) => boolean;
```