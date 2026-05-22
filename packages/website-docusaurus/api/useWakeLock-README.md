### useWakeLock

#### Returns
`UseWakeLockReturn`: An object with the following elements:
- isSupported: whether the browser supports the Wake Lock API.
- isActive: whether a wake lock is currently held.
- request: request a wake lock (immediately if visible, deferred until visible if hidden).
- forceRequest: force request a wake lock regardless of visibility.
- release: release the wake lock.

#### Arguments
|Argument|Description|Type|DefaultValue|
|---|---|---|---|
|options|optional params|[UseWakeLockOptions](#usewakelockoptions) \| undefined |-|

### UseWakeLockOptions

|Property|Description|Type|DefaultValue|
|---|---|---|---|
|onRequest|callback when wake lock is acquired|() => void |`-`|
|onRelease|callback when wake lock is released|() => void |`-`|
|onError|callback when an error occurs|(error: Error) => void |`-`|

### UseWakeLockReturn

|Property|Description|Type|DefaultValue|
|---|---|---|---|
|isSupported|whether the browser supports the Wake Lock API|boolean  **(Required)**|`-`|
|isActive|whether a wake lock is currently held|boolean  **(Required)**|`-`|
|request|request a wake lock|() =&gt; Promise&lt;void&gt;  **(Required)**|`-`|
|forceRequest|force request a wake lock regardless of page visibility|() =&gt; Promise&lt;void&gt;  **(Required)**|`-`|
|release|release the wake lock|() =&gt; Promise&lt;void&gt;  **(Required)**|`-`|