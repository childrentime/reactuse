### useWebNotification

#### Returns
`UseWebNotificationReturn`

#### Arguments
|参数名|描述|类型|默认值|
|---|---|---|---|
|requestPermissions|自动请求权限|boolean \| undefined |-|

### UseWebNotificationReturn

|参数名|描述|类型|默认值|
|---|---|---|---|
|isSupported|浏览器是否支持|boolean  **(必填)**|`-`|
|show|展示函数|[UseWebNotificationShow](#UseWebNotificationShow)  **(必填)**|`-`|
|close|关闭函数|() => void  **(必填)**|`-`|
|ensurePermissions|请求权限函数|() =&gt; Promise&lt;boolean \| undefined&gt;  **(必填)**|`-`|
|permissionGranted|权限状态|React.MutableRefObject&lt;boolean&gt;  **(必填)**|`-`|

### UseWebNotificationShow

#### Returns
`Notification | undefined`

#### Arguments
|参数名|描述|类型|默认值|
|---|---|---|---|
|title|通知标题|string  **(必填)**|-|
|options|通知选项|NotificationOptions \| undefined |-|