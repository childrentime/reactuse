### useRafState

#### Returns
`readonly [S, React.Dispatch<React.SetStateAction<S>>]`: A tuple with the following elements:
- the state value
- a function to update state in `requestAnimationFrame`

#### Arguments
|Argument|Description|Type|DefaultValue|
|---|---|---|---|
|initialState|state value|S \| (() => S)  **(Required)**|-|