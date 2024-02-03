### useElementVisibility

#### Returns
`readonly [boolean, () => void]`: A tuple with the following elements:
- is the current element visible.
- stop observer listening function.

#### Arguments
|Argument|Description|Type|DefaultValue|
|---|---|---|---|
|target|dom element|React.RefObject&lt;HTMLElement \| SVGElement&gt;  **(Required)**|-|
|options|options passed to `intersectionObserver`|IntersectionObserverInit \| undefined |-|