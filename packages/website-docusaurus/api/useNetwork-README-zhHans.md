### useNetwork

#### Returns
`IUseNetworkState`

#### Arguments


### IUseNetworkState

|参数名|描述|类型|默认值|
|---|---|---|---|
|online|浏览器是否连接网络|boolean \| undefined  **(必填)**|`-`|
|previous|`online` 属性的先前值。 帮助识别浏览器是否刚刚连接或失去连接。|boolean \| undefined  **(必填)**|`-`|
|since|{Date} 对象指向状态更改发生的时刻。|Date \| undefined  **(必填)**|`-`|
|downlink|有效带宽估计（以兆位每秒为单位），四舍五入到25 kbps 的最接近倍数。|[INetworkInformation](#INetworkInformation)['downlink'] \| undefined  **(必填)**|`-`|
|downlinkMax|最大下行链路速度，以兆比特每秒 (Mbps) 为单位|[INetworkInformation](#INetworkInformation)['downlinkMax'] \| undefined  **(必填)**|`-`|
|effectiveType|连接的有效类型，表示“slow-2g”、“2g”、“3g”或“4g”之一。该值是根据最近观察到的往返时间和和下行链路值的组合确定的|[INetworkInformation](#INetworkInformation)['effectiveType'] \| undefined  **(必填)**|`-`|
|rtt|当前连接的估计有效往返时间，四舍五入精确到 25 毫秒的最接近倍数|[INetworkInformation](#INetworkInformation)['rtt'] \| undefined  **(必填)**|`-`|
|saveData|如果用户在用户代理上设置了减少数据使用选项，则为 {true}。|[INetworkInformation](#INetworkInformation)['saveData'] \| undefined  **(必填)**|`-`|
|type|设备用于与网络通信的连接类型。它将是以下值之一：- 蓝牙- 蜂窝网络- 以太网- 没有任何- 无线上网- 无线麦克斯- 其他- 未知|[INetworkInformation](#INetworkInformation)['type'] \| undefined  **(必填)**|`-`|

### INetworkInformation

```js
export interface INetworkInformation extends EventTarget {
  readonly downlink: number;
  readonly downlinkMax: number;
  readonly effectiveType: 'slow-2g' | '2g' | '3g' | '4g';
  readonly rtt: number;
  readonly saveData: boolean;
  readonly type: 'bluetooth' | 'cellular' | 'ethernet' | 'none' | 'wifi' | 'wimax' | 'other' | 'unknown';
  onChange: (event: Event) => void;
}
```