### useTimeoutFn

#### Returns
`Stoppable`: A tuple with the following elements:
- Whether to wait for the timer to execute.
- Set timer.
- Cancel timer.

#### Arguments
|Argument|Description|Type|DefaultValue|
|---|---|---|---|
|cb|callback|(...args: unknown[]) => any  **(Required)**|-|
|interval|wait time|number  **(Required)**|-|
|options|optional param|[UseTimeoutFnOptions](#usetimeoutfnoptions) \| undefined |-|

### UseTimeoutFnOptions

|Property|Description|Type|DefaultValue|
|---|---|---|---|
|immediate|Start the timer immediate after calling this function|boolean |`true`|