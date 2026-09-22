### useEventListener

#### Returns
`void`

#### Arguments
|參數名|描述|類型|預設值|
|---|---|---|---|
|eventName|事件名稱|string  **(必填)**|-|
|handler|事件處理器|(event: any) => void  **(必填)**|-|
|element|dom元素|EventTarget \| Element \| Document \| HTMLElement \| Window \| null \| undefined |``window``|
|options|监听选项|boolean \| AddEventListenerOptions \| undefined |-|