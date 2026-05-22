### useWakeLock

#### Returns
`UseWakeLockReturn`: 包含以下元素的对象：
- isSupported：浏览器是否支持 Wake Lock API。
- isActive：当前是否持有唤醒锁。
- request：请求唤醒锁（页面可见时立即请求，不可见时延迟到可见时请求）。
- forceRequest：强制请求唤醒锁，无论页面是否可见。
- release：释放唤醒锁。

#### Arguments
|参数名|描述|类型|默认值|
|---|---|---|---|
|options|可选参数|[UseWakeLockOptions](#usewakelockoptions) \| undefined |-|

### UseWakeLockOptions

|参数名|描述|类型|默认值|
|---|---|---|---|
|onRequest|请求成功时的回调|() => void |`-`|
|onRelease|释放时的回调|() => void |`-`|
|onError|发生错误时的回调|(error: Error) => void |`-`|

### UseWakeLockReturn

|参数名|描述|类型|默认值|
|---|---|---|---|
|isSupported|浏览器是否支持 Wake Lock API|boolean  **(必填)**|`-`|
|isActive|当前是否持有唤醒锁|boolean  **(必填)**|`-`|
|request|请求唤醒锁|() =&gt; Promise&lt;void&gt;  **(必填)**|`-`|
|forceRequest|强制请求唤醒锁，无论页面是否可见|() =&gt; Promise&lt;void&gt;  **(必填)**|`-`|
|release|释放唤醒锁|() =&gt; Promise&lt;void&gt;  **(必填)**|`-`|