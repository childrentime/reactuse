### UseMutationObserver

#### Returns
`() => void`: stop listenering function

#### Arguments
|Argument|Description|Type|DefaultValue|
|---|---|---|---|
|callback|callback|MutationCallback  **(Required)**|-|
|target|dom对象|React.RefObject&lt;Element&gt;  **(Required)**|-|
|options|options passed to `MutationObserver`|MutationObserverInit \| undefined |-|