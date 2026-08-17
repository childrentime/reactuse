### useSetState

#### Returns
`readonly [T, (statePartial: Partial<T> | ((currentState: T) => Partial<T>)) => void]`: A tuple with the following elements:
- The current value of the state.
- A function to update the value of the state.

#### Arguments
|Argument|Description|Type|DefaultValue|
|---|---|---|---|
|initialState|initial value|T  **(Required)**|-|