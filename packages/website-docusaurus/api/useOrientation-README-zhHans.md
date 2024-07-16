### useOrientation

#### Returns
`readonly [UseOrientationState, (type: UseOrientationLockType) => any, () => void]`: 包含以下元素的元组：
- 方向状态。
- 锁定方向。
- 解锁方向。

#### Arguments
|参数名|描述|类型|默认值|
|---|---|---|---|
|initialState|初始值|[UseOrientationState](#UseOrientationState) \| undefined |-|

### UseOrientationState

|参数名|描述|类型|默认值|
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
