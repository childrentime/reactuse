### useElementBounding

#### Returns
`import("/Users/zhangyuanqing/works/github/reactuse/packages/core/src/useElementBounding/interface").UseElementBoundingReturn`

#### Arguments
|Argument|Description|Type|DefaultValue|
|---|---|---|---|
|target|target element|React.RefObject&lt;Element&gt;  **(Required)**|-|
|options|optional params|[UseElementBoundingOptions](#UseElementBoundingOptions) |-|

### UseElementBoundingOptions

|Property|Description|Type|DefaultValue|
|---|---|---|---|
|reset|Reset values to 0 on component unmounted|boolean |`true`|
|windowResize|Listen to window resize event|boolean |`true`|
|windowScroll|Listen to window scroll event|boolean |`true`|
|immediate|Immediately call update on component mounted|boolean |`-`|