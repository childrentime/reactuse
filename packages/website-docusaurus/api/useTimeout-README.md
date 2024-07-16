### useTimeout

#### Returns
`Stoppable`: A tuple with the following elements:
- Whether to wait for the timer to execute.
- Set timer.
- Cancel timer.

#### Arguments
|Argument|Description|Type|DefaultValue|
|---|---|---|---|
|ms|wait time|number \| undefined |-|
|options|-|[UseTimeoutOptions](#UseTimeoutOptions) \| undefined |-|

### UseTimeoutOptions

|Property|Description|Type|DefaultValue|
|---|---|---|---|
|immediate|Start the timer immediate after calling this function|boolean |`false`|