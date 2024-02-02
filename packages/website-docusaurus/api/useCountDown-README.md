### useCountdown

A tuple with the following elements:
- hour
- minute.
- second.

#### Returns
`readonly [string, string, string]`

#### Arguments
|Argument|Description|Type|DefaultValue|
|---|---|---|---|
|time|time differ|number  **(Required)**|-|
|format|time format function|(num: number) => [string, string, string] |`HH MM SS`|
|callback|callback function for end of countdown|() => void |-|