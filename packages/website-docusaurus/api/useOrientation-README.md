### useOrientation

#### Returns
`readonly [UseOrientationState, (type: UseOrientationLockType) => any, () => void]`: A tuple with the following elements:
- orientation type.
- lock orientation.
- unlock orientation.

#### Arguments
|Argument|Description|Type|DefaultValue|
|---|---|---|---|
|initialState|initial value|[UseOrientationState](#UseOrientationState) \| undefined |-|

### UseOrientationState

|Property|Description|Type|DefaultValue|
|---|---|---|---|
|angle|document angle|number  **(Required)**|`-`|
|type|orientation type|[UseOrientationType](#UseOrientationType) \| undefined  **(Required)**|`-`|

### UseOrientationType

#### Type

`export type UseOrientationType =
  | "portrait-primary"
  | "portrait-secondary"
  | "landscape-primary"
  | "landscape-secondary";`


### UseOrientationLockType

#### Type

`export type UseOrientationLockType =
  | "any"
  | "natural"
  | "landscape"
  | "portrait"
  | "portrait-primary"
  | "portrait-secondary"
  | "landscape-primary"
  | "landscape-secondary";`
