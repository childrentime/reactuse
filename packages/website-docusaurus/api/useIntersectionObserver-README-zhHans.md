### useIntersectionObserver

#### Returns

`() => void`: 停止监听函数

#### Arguments

| 参数名   | 描述                                 | 类型                                                  | 默认值 |
| -------- | ------------------------------------ | ----------------------------------------------------- | ------ |
| target   | dom元素                              | [BasicTarget](#BasicTarget)&lt;Element&gt; **(必填)** | -      |
| callback | 回调                                 | IntersectionObserverCallback **(必填)**               | -      |
| options  | 传递给 `IntersectionObserver` 的参数 | IntersectionObserverInit \| undefined                 | -      |

### BasicTarget

```js
export type BasicTarget<T extends TargetType = Element> = (() => TargetValue<T>) | TargetValue<T> | MutableRefObject<TargetValue<T>>
```

### TargetValue

```js
type TargetValue<T> = T | undefined | null
```

### TargetType

```js
type TargetType = HTMLElement | Element | Window | Document | EventTarget
```
