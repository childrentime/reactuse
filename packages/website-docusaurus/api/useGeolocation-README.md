### useGeoLocation

#### Returns
`{ readonly coordinates: GeolocationCoordinates; readonly locatedAt: number | null; readonly error: GeolocationPositionError | null; }`: A tuple with the following elements:
- coordinates.
- timestamp when get coordinates.
- errors.

#### Arguments
|Argument|Description|Type|DefaultValue|
|---|---|---|---|
|options|optional `PositionOptions` params|Partial&lt;PositionOptions&gt; \| undefined |-|