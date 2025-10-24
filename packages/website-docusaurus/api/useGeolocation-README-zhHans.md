### useGeoLocation

#### Returns
`{ readonly coordinates: GeolocationCoordinates; readonly locatedAt: number | null; readonly error: GeolocationPositionError | null; readonly isSupported: boolean; }`: 包含以下元素的对象：
- 坐标。
- 获取坐标的时间戳。
- 错误。
- 浏览器是否支持 `geolocation`。

#### Arguments
|参数名|描述|类型|默认值|
|---|---|---|---|
|options|可选 `PositionOptions` 参数|Partial&lt;PositionOptions&gt; \| undefined |-|