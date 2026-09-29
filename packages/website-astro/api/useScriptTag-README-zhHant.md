### useScriptTag

#### Returns
`readonly [HTMLScriptElement | null, UseScriptTagStatus, (waitForScriptLoad?: boolean | undefined) => Promise<boolean | HTMLScriptElement>, () => void]`: 包含以下元素的元組：
- 用來加載資源的 html 元素。
- 資源加載狀態。
- 資源加載函數。
- 資源卸載函數

#### Arguments
|參數名|描述|類型|預設值|
|---|---|---|---|
|src|資源地址|string  **(必填)**|-|
|onLoaded|資源加載完成的回調|((el: HTMLScriptElement) => void) \| undefined |-|
|options|可選參數|[UseScriptTagOptions](#usescripttagoptions) \| undefined |-|

### UseScriptTagOptions

|參數名|描述|類型|預設值|
|---|---|---|---|
|immediate|立即加載資源|boolean |`true`|
|async|在 `script` 標籤上加上 `async`|boolean |`true`|
|type|腳本類型|string |`'text/javascript'`|
|manual|手動控制加載和卸載時機|boolean |`false`|
|crossOrigin|跨域屬性|'anonymous' \| 'use-credentials' |`-`|
|referrerPolicy|來源屬性|\| 'no-referrer'\| 'no-referrer-when-downgrade'\| 'origin'\| 'origin-when-cross-origin'\| 'same-origin'\| 'strict-origin'\| 'strict-origin-when-cross-origin'\| 'unsafe-url' |`-`|
|noModule|在 `script` 標籤上加上 `noModule`|boolean |`-`|
|defer|在 `script` 標籤上加上 `defer`|boolean |`-`|
|attrs|在 script 標籤上添加自定義屬性|Record&lt;string, string&gt; |`-`|

### UseScriptTagStatus

#### Type

`export type UseScriptTagStatus = 'idle' | 'loading' | 'ready' | 'error'`
