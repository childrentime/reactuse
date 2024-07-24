### useEventListener

#### Returns
`void`

#### Arguments
|参数名|描述|类型|默认值|
|---|---|---|---|
|eventName|事件名称|string  **(必填)**|-|
|handler|事件处理器|(event: any) => void  **(必填)**|-|
|element|dom元素|EventTarget \| Element \| Document \| HTMLElement \| Window \| null \| undefined |``window``|
|options|监听选项|boolean \| AddEventListenerOptions \| undefined |-|