### useNetwork

#### Returns
`IUseNetworkState`

#### Arguments


### IUseNetworkState

|Property|Description|Type|DefaultValue|
|---|---|---|---|
|online|Whether browser connected to the network or not.|boolean \| undefined  **(Required)**|`-`|
|previous|Previous value of `online` property. Helps to identify if browserjust connected or lost connection.|boolean \| undefined  **(Required)**|`-`|
|since|The {Date} object pointing to the moment when state change occurred.|Date \| undefined  **(Required)**|`-`|
|downlink|Effective bandwidth estimate in megabits per second, rounded to thenearest multiple of 25 kilobits per seconds.|[INetworkInformation](#INetworkInformation)["downlink"] \| undefined  **(Required)**|`-`|
|downlinkMax|Maximum downlink speed, in megabits per second (Mbps), for theunderlying connection technology|[INetworkInformation](#INetworkInformation)["downlinkMax"] \| undefined  **(Required)**|`-`|
|effectiveType|Effective type of the connection meaning one of 'slow-2g', '2g', '3g', or '4g'.This value is determined using a combination of recently observed round-trip timeand downlink values.|[INetworkInformation](#INetworkInformation)["effectiveType"] \| undefined  **(Required)**|`-`|
|rtt|Estimated effective round-trip time of the current connection, roundedto the nearest multiple of 25 milliseconds|[INetworkInformation](#INetworkInformation)["rtt"] \| undefined  **(Required)**|`-`|
|saveData|{true} if the user has set a reduced data usage option on the user agent.|[INetworkInformation](#INetworkInformation)["saveData"] \| undefined  **(Required)**|`-`|
|type|The type of connection a device is using to communicate with the network.It will be one of the following values:- bluetooth- cellular- ethernet- none- wifi- wimax- other- unknown|[INetworkInformation](#INetworkInformation)["type"] \| undefined  **(Required)**|`-`|

### INetworkInformation

```js
export interface INetworkInformation extends EventTarget {
  readonly downlink: number;
  readonly downlinkMax: number;
  readonly effectiveType: "slow-2g" | "2g" | "3g" | "4g";
  readonly rtt: number;
  readonly saveData: boolean;
  readonly type: "bluetooth" | "cellular" | "ethernet" | "none" | "wifi" | "wimax" | "other" | "unknown";
  onChange: (event: Event) => void;
}
```