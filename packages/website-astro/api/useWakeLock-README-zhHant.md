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
|options|可選參數|[UseWakeLockOptions](#usewakelockoptions) \| undefined |-|

### UseWakeLockOptions

|參數名|描述|類型|預設值|
|---|---|---|---|
|onRequest|請求成功時的回調|() => void |`-`|
|onRelease|釋放時的回調|() => void |`-`|
|onError|發生錯誤時的回調|(error: Error) => void |`-`|

### UseWakeLockReturn

|參數名|描述|類型|預設值|
|---|---|---|---|
|isSupported|瀏覽器是否支援 Wake Lock API|boolean  **(必填)**|`-`|
|isActive|當前是否持有喚醒鎖|boolean  **(必填)**|`-`|
|request|請求喚醒鎖|() =&gt; Promise&lt;void&gt;  **(必填)**|`-`|
|forceRequest|強制請求喚醒鎖，無論頁面是否可見|() =&gt; Promise&lt;void&gt;  **(必填)**|`-`|
|release|釋放喚醒鎖|() =&gt; Promise&lt;void&gt;  **(必填)**|`-`|