### useCycleList

A tuple with the following elements:
- The current index value of the list.
- A function to set index to prev.
- A function to set index to next.

#### Returns
`readonly [T, (i?: number) => void, (i?: number) => void]`

#### Arguments
|Argument|Description|Type|DefaultValue|
|---|---|---|---|
|list|cycle array|T[]  **(Required)**|-|
|i|array index|number |-|