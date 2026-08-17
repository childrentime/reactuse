### useSticky

#### Returns
`[boolean, React.Dispatch<React.SetStateAction<boolean>>]`: 包含以下元素的元組：
- 當前是否粘滞。
- 更新粘滞值的函數。

#### Arguments
|參數名|描述|類型|預設值|
|---|---|---|---|
|targetElement|dom元素|[BasicTarget](#basictarget)&lt;HTMLElement&gt;  **(必填)**|-|
|params|可选参数|[UseStickyParams](#usestickyparams)  **(必填)**|-|
|scrollElement|滚动容器|[BasicTarget](#basictarget)&lt;HTMLElement&gt; |-|

### UseStickyParams

|參數名|描述|類型|預設值|
|---|---|---|---|
|axis|滚动方向|'x' \| 'y' |`y`|
|nav|沉浸式高度/宽度|number  **(必填)**|`0`|

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