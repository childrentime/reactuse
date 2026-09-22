### useBatchedMount

#### Returns
`number`: number of items currently mounted

#### Arguments
|Argument|Description|Type|DefaultValue|
|---|---|---|---|
|total|total number of items to mount. Growing it preserves the progress already made; shrinking it clamps to the new total rather than restarting from the first batch|number  **(Required)**|-|
|batchSize|number of items to mount per idle frame. Values below 1 are treated as 1, so a batchSize derived from a measurement that has not settled yet cannot stall the list forever|number  **(Required)**|-|