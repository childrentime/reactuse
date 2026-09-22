### useAsyncEffect

#### Returns
`void`

#### Arguments
|參數名|描述|類型|預設值|
|---|---|---|---|
|effect|支援promise的副作用函數|() =&gt; T \| Promise&lt;T&gt;  **(必填)**|-|
|cleanup|清理函數|(() =&gt; T \| Promise&lt;T&gt;) \| undefined |`() => {}`|
|deps|依賴列表|React.DependencyList \| undefined |-|