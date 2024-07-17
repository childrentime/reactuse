### useGeoLocation

#### Returns
`{ readonly coordinates: GeolocationCoordinates; readonly locatedAt: number | null; readonly error: GeolocationPositionError | null; readonly isSupported: boolean; }`: A object with the following elements:
- coordinates.
- timestamp when get coordinates.
- errors.
- Whether the browser supports `geolocation`.

#### Arguments
|Argument|Description|Type|DefaultValue|
|---|---|---|---|
|options|optional `PositionOptions` params|Partial&lt;PositionOptions&gt; \| undefined |-|