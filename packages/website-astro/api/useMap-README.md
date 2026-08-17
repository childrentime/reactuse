### useMap

#### Returns
`{ readonly map: Map<K, V>; readonly set: (key: K, value: V) => void; readonly get: (key: K) => V | undefined; readonly remove: (key: K) => boolean; readonly has: (key: K) => boolean; readonly clear: () => void; readonly reset: () => void; readonly size: number; }`: An object with the following properties:
- map: The current Map instance.
- set: A function to set a key-value pair in the map.
- get: A function to get a value by key from the map.
- remove: A function to remove a key from the map and return whether it existed.
- has: A function to check if a key exists in the map.
- clear: A function to clear all entries from the map.
- reset: A function to reset the map to its initial state.
- size: The current size of the map.

#### Arguments
|Argument|Description|Type|DefaultValue|
|---|---|---|---|
|initialValue|The initial value of the map. It can be a Map instance, an array of key-value pairs, or a function that returns initial entries.|Map&lt;K, V&gt; \| readonly (readonly [K, V])[] \| (() =&gt; Map&lt;K, V&gt; \| readonly (readonly [K, V])[]) \| undefined |-|