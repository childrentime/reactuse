### useOrientation

#### Returns
`readonly [UseOrientationState, (type: UseOrientationLockType) => any, () => void]`: 包含以下元素的元組：
- 方向狀態。
- 鎖定方向。
- 解鎖方向。

#### Arguments
|參數名|描述|類型|預設值|
|---|---|---|---|
|initialState|初始值|[UseOrientationState](#UseOrientationState) \| undefined |-|

### UseOrientationState

|參數名|描述|類型|預設值|
|---|---|---|---|
|angle|角度|number  **(必填)**|`-`|
|type|方向类型|[UseOrientationType](#UseOrientationType) \| undefined  **(必填)**|`-`|

### UseOrientationType

#### Type

`export type UseOrientationType =
  | 'portrait-primary'
  | 'portrait-secondary'
  | 'landscape-primary'
  | 'landscape-secondary'`


### UseOrientationLockType

#### Type

`export type UseOrientationLockType =
  | 'any'
  | 'natural'
  | 'landscape'
  | 'portrait'
  | 'portrait-primary'
  | 'portrait-secondary'
  | 'landscape-primary'
  | 'landscape-secondary'`
