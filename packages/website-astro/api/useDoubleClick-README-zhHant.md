### useDoubleClick

#### Returns
`void`

#### Arguments
|參數名|描述|類型|預設值|
|---|---|---|---|
|props|-|[UseDoubleClickProps](#usedoubleclickprops)  **(必填)**|-|

### UseDoubleClickProps

|參數名|描述|類型|預設值|
|---|---|---|---|
|target|dom對象|[BasicTarget](#basictarget)&lt;Element&gt;  **(必填)**|`-`|
|latency|延遲時間（毫秒）|number \| undefined |`-`|
|onSingleClick|單擊事件處理函數|((e?: MouseEvent \| TouchEvent) => void) \| undefined |`-`|
|onDoubleClick|雙擊事件處理函數|((e?: MouseEvent \| TouchEvent) => void) \| undefined |`-`|

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