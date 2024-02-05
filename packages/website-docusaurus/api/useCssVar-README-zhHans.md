### useCssVar

#### Returns
`readonly [string, (v: string) => void]`: 包含以下元素的元组：
- css 变量值
- 更新 css 变量值的函数

#### Arguments
|参数名|描述|类型|默认值|
|---|---|---|---|
|prop|属性值，比如 --color|string  **(必填)**|-|
|target|dom元素|[BasicTarget](#BasicTarget)&lt;T&gt;  **(必填)**|-|
|defaultValue|默认值|string \| undefined |-|
|options|可选项|[UseCssVarOptions](#UseCssVarOptions) \| undefined |-|

### UseCssVarOptions

|参数名|描述|类型|默认值|
|---|---|---|---|
|observe|使用 MutationObserver 来监听变量变更|boolean |`false`|

### BasicTarget

```js
export type BasicTarget<T extends TargetType = Element> = (() => TargetValue<T>) | TargetValue<T> | MutableRefObject<TargetValue<T>>;
```

### TargetValue

```js
type TargetValue<T> = T | undefined | null;
```

### TargetType

```js
type TargetType = HTMLElement | Element | Window | Document | EventTarget;
```