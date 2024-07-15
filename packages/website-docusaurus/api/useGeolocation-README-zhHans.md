### useGeoLocation

#### Returns

`{ readonly coordinates: GeolocationCoordinates; readonly locatedAt: number | null; readonly error: GeolocationPositionError | null; }`: 包含以下元素的元组：

- 坐标。
- 获取坐标的时间戳。
- 错误。

#### Arguments

| 参数名  | 描述                        | 类型                                        | 默认值 |
| ------- | --------------------------- | ------------------------------------------- | ------ |
| options | 可选 `PositionOptions` 参数 | Partial&lt;PositionOptions&gt; \| undefined | -      |
