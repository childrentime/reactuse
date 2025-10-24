### useScriptTag

#### Returns
`readonly [HTMLScriptElement | null, UseScriptTagStatus, (waitForScriptLoad?: boolean | undefined) => Promise<boolean | HTMLScriptElement>, () => void]`: 包含以下元素的元组：
- 用来加载资源的 html 元素。
- 资源加载状态。
- 资源加载函数。
- 资源卸载函数

#### Arguments
|参数名|描述|类型|默认值|
|---|---|---|---|
|src|资源地址|string  **(必填)**|-|
|onLoaded|资源加载完成的回调|((el: HTMLScriptElement) => void) \| undefined |-|
|options|可选参数|[UseScriptTagOptions](#usescripttagoptions) \| undefined |-|

### UseScriptTagOptions

|参数名|描述|类型|默认值|
|---|---|---|---|
|immediate|立即加载资源|boolean |`true`|
|async|在 `script` 标签上加上 `async`|boolean |`true`|
|type|脚本类型|string |`'text/javascript'`|
|manual|手动控制加载和卸载时机|boolean |`false`|
|crossOrigin|跨域属性|'anonymous' \| 'use-credentials' |`-`|
|referrerPolicy|来源属性|\| 'no-referrer'\| 'no-referrer-when-downgrade'\| 'origin'\| 'origin-when-cross-origin'\| 'same-origin'\| 'strict-origin'\| 'strict-origin-when-cross-origin'\| 'unsafe-url' |`-`|
|noModule|在 `script` 标签上加上 `noModule`|boolean |`-`|
|defer|在 `script` 标签上加上 `defer`|boolean |`-`|
|attrs|在 script 标签上添加自定义属性|Record&lt;string, string&gt; |`-`|

### UseScriptTagStatus

#### Type

`export type UseScriptTagStatus = 'idle' | 'loading' | 'ready' | 'error'`
