### useDoubleClick

#### Returns
`void`

#### Arguments
|参数名|描述|类型|默认值|
|---|---|---|---|
|props|-|[UseDoubleClickProps](#UseDoubleClickProps)  **(必填)**|-|

### UseDoubleClickProps

|参数名|描述|类型|默认值|
|---|---|---|---|
|target|dom对象|[BasicTarget](#BasicTarget)&lt;Element&gt;  **(必填)**|`-`|
|latency|延迟时间（毫秒）|number \| undefined |`-`|
|onSingleClick|单击事件处理函数|((e?: MouseEvent \| TouchEvent) => void) \| undefined |`-`|
|onDoubleClick|双击事件处理函数|((e?: MouseEvent \| TouchEvent) => void) \| undefined |`-`|

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