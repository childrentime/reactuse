### useCssVar

#### Returns
`readonly [string, (v: string) => void]`: 包含以下元素的元組：
- css 變數值
- 更新 css 變數值的函數

#### Arguments
|參數名|描述|類型|預設值|
|---|---|---|---|
|prop|屬性值，比如 --color|string  **(必填)**|-|
|target|dom元素|[BasicTarget](#basictarget)&lt;T&gt;  **(必填)**|-|
|defaultValue|預設值|string \| undefined |-|
|options|可選項|[UseCssVarOptions](#usecssvaroptions) \| undefined |-|

### UseCssVarOptions

|參數名|描述|類型|預設值|
|---|---|---|---|
|observe|使用 MutationObserver 來監聽變數變更|boolean |`false`|

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