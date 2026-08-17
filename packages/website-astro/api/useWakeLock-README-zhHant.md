### useWakeLock

#### Returns
`UseWakeLockReturn`: 包含以下元素的對象：
- isSupported：瀏覽器是否支援 Wake Lock API。
- isActive：當前是否持有喚醒鎖。
- request：請求喚醒鎖（頁面可見時立即請求，不可見時延遲到可見時請求）。
- forceRequest：強制請求喚醒鎖，無論頁面是否可見。
- release：釋放喚醒鎖。

#### Arguments
|參數名|描述|類型|預設值|
|---|---|---|---|
|options|可选参数|[UseWakeLockOptions](#usewakelockoptions) \| undefined |-|

### UseWakeLockOptions

|參數名|描述|類型|預設值|
|---|---|---|---|
|onRequest|请求成功时的回调|() => void |`-`|
|onRelease|释放时的回调|() => void |`-`|
|onError|发生错误时的回调|(error: Error) => void |`-`|

### UseWakeLockReturn

|參數名|描述|類型|預設值|
|---|---|---|---|
|isSupported|浏览器是否支持 Wake Lock API|boolean  **(必填)**|`-`|
|isActive|当前是否持有唤醒锁|boolean  **(必填)**|`-`|
|request|请求唤醒锁|() =&gt; Promise&lt;void&gt;  **(必填)**|`-`|
|forceRequest|强制请求唤醒锁，无论页面是否可见|() =&gt; Promise&lt;void&gt;  **(必填)**|`-`|
|release|释放唤醒锁|() =&gt; Promise&lt;void&gt;  **(必填)**|`-`|