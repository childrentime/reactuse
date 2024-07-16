### useCounter

#### Returns
`readonly [number, (newState: number | ((prev: number) => number) | (() => number)) => void, (delta?: number | undefined) => void, (delta?: number | undefined) => void, () => void]`: A tuple with the following elements:
- The current value of the counter.
- A function to set the state of the counter. It can accept a number or a function that returns a number.
- A function to increment the counter. It optionally accepts a number to increment the counter by, defaulting to 1.
- A function to decrement the counter. It optionally accepts a number to decrement the counter by, defaulting to 1.
- A function to reset the counter to its initial value.

#### Arguments
|Argument|Description|Type|DefaultValue|
|---|---|---|---|
|initialValue|The initial value of the counter. It can be a number or a function that returns a number. If not provided, the counter will start from 0.|number \| (() => number) \| undefined |`0`|
|max|The maximum value that the counter can reach. If not provided or null, there is no upper limit.|number \| null \| undefined |-|
|min|The minimum value that the counter can reach. If not provided or null, there is no lower limit.|number \| null \| undefined |-|