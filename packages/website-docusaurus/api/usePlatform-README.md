### UsePlatformProps

|Property|Description|Type|DefaultValue|
|---|---|---|---|
|userAgent|When server rendering, you need to pass `userAgent`|string |`-`|

### usePlatform

#### Returns
`UsePlatformReturn`: object that related to platform

#### Arguments
|Argument|Description|Type|DefaultValue|
|---|---|---|---|
|props|-|[UsePlatformProps](#UsePlatformProps) \| undefined |-|

### UsePlatformReturn

|Property|Description|Type|DefaultValue|
|---|---|---|---|
|platform|platform|[Platform](#Platform)  **(Required)**|`-`|
|isInMiniProgram|Whether in mini program|() => boolean  **(Required)**|`-`|
|isInWechat|whether in wechat|() => boolean  **(Required)**|`-`|
|isiPhoneX|whether is iPhoneX|() => boolean  **(Required)**|`-`|

### Platform

```js
export type Platform = "ios" | "android" | "unknown";
```