### UsePlatformProps

| 参数名    | 描述                               | 类型   | 默认值 |
| --------- | ---------------------------------- | ------ | ------ |
| userAgent | 服务端渲染时，需要传递 `userAgent` | string | `-`    |

### usePlatform

#### Returns

`UsePlatformReturn`: 和平台相关的对象

#### Arguments

| 参数名 | 描述 | 类型                                               | 默认值 |
| ------ | ---- | -------------------------------------------------- | ------ |
| props  | -    | [UsePlatformProps](#UsePlatformProps) \| undefined | -      |

### UsePlatformReturn

| 参数名          | 描述           | 类型                             | 默认值 |
| --------------- | -------------- | -------------------------------- | ------ |
| platform        | 平台           | [Platform](#Platform) **(必填)** | `-`    |
| isInMiniProgram | 是否在小程序中 | () => boolean **(必填)**         | `-`    |
| isInWechat      | 是否在微信中   | () => boolean **(必填)**         | `-`    |
| isiPhoneX       | 是否是 iPhoneX | () => boolean **(必填)**         | `-`    |

### Platform

```js
export type Platform = 'ios' | 'android' | 'unknown'
```
