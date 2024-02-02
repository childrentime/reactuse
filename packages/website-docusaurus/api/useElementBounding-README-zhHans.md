### useElementBounding

#### Returns
`import("/Users/zhangyuanqing/works/github/reactuse/packages/core/src/useElementBounding/interface").UseElementBoundingReturn`

#### Arguments
|参数名|描述|类型|默认值|
|---|---|---|---|
|target|目标元素|React.RefObject&lt;Element&gt;  **(必填)**|-|
|options|可选参数|[UseElementBoundingOptions](#UseElementBoundingOptions) |-|

### UseElementBoundingOptions

|参数名|描述|类型|默认值|
|---|---|---|---|
|reset|将数值重置为0|boolean |`true`|
|windowResize|是否监听 resize 事件|boolean |`true`|
|windowScroll|是否监听 scroll 事件|boolean |`true`|
|immediate|立即更新|boolean |`-`|