### useEyeDropper

#### Returns

`readonly [boolean, (options?: UseEyeDropperOpenOptions | undefined) => Promise<UseEyeDropperOpenReturnType>]`: 包含以下元素的元组：

- 浏览器是否支持该特性。
- 打开颜色选择器的函数。

#### Arguments

### UseEyeDropperOpenOptions

| 参数名 | 描述     | 类型        | 默认值 |
| ------ | -------- | ----------- | ------ |
| signal | 终止信号 | AbortSignal | `-`    |

### UseEyeDropperOpenReturnType

| 参数名  | 描述       | 类型              | 默认值 |
| ------- | ---------- | ----------------- | ------ |
| sRGBHex | rgb 颜色值 | string **(必填)** | `-`    |
