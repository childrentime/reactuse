### useIntersectionObserver

#### Returns
`() => void`: 停止监听函数

#### Arguments
|参数名|描述|类型|默认值|
|---|---|---|---|
|target|dom元素|React.RefObject&lt;Element&gt;  **(必填)**|-|
|callback|回调|IntersectionObserverCallback  **(必填)**|-|
|options|传递给 `IntersectionObserver` 的参数|IntersectionObserverInit \| undefined |-|