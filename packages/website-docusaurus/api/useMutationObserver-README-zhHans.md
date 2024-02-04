### UseMutationObserver

#### Returns
`() => void`: 停止函数

#### Arguments
|参数名|描述|类型|默认值|
|---|---|---|---|
|callback|回调|MutationCallback  **(必填)**|-|
|target|dom元素|React.RefObject&lt;Element&gt;  **(必填)**|-|
|options|传递给 `MutationObserver` 的参数|MutationObserverInit \| undefined |-|