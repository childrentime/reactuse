### UsePlatformProps

|參數名|描述|類型|預設值|
|---|---|---|---|
|userAgent|服务端渲染时，需要传递 `userAgent`|string |`-`|

### usePlatform

#### Returns
`UsePlatformReturn`: 和平台相关的对象

#### Arguments
|參數名|描述|類型|預設值|
|---|---|---|---|
|props|-|[UsePlatformProps](#useplatformprops) \| undefined |-|

### UsePlatformReturn

|參數名|描述|類型|預設值|
|---|---|---|---|
|platform|平台|[Platform](#platform)  **(必填)**|`-`|
|isInMiniProgram|是否在小程序中|() => boolean  **(必填)**|`-`|
|isInWechat|是否在微信中|() => boolean  **(必填)**|`-`|
|isiPhoneX|是否是 iPhoneX|() => boolean  **(必填)**|`-`|

### Platform

```js
export type Platform = 'ios' | 'android' | 'unknown';
```