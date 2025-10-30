### UseScratchState

|Property|Description|Type|DefaultValue|
|---|---|---|---|
|isScratching|Whether scratching is in progress|boolean  **(Required)**|`-`|
|start|Start timestamp|number |`-`|
|end|End timestamp|number |`-`|
|x|x coordinate relative to element|number |`-`|
|y|y coordinate relative to element|number |`-`|
|dx|Delta in x direction|number |`-`|
|dy|Delta in y direction|number |`-`|
|docX|x coordinate in document|number |`-`|
|docY|y coordinate in document|number |`-`|
|posX|Element x position in document|number |`-`|
|posY|Element y position in document|number |`-`|
|elH|Element height|number |`-`|
|elW|Element width|number |`-`|
|elX|Element x position|number |`-`|
|elY|Element y position|number |`-`|

### UseScratchOptions

|Property|Description|Type|DefaultValue|
|---|---|---|---|
|disabled|Whether to disable|boolean |`-`|
|onScratch|Callback during scratching|(state: [UseScratchState](#usescratchstate)) => void |`-`|
|onScratchStart|Callback when scratching starts|(state: [UseScratchState](#usescratchstate)) => void |`-`|
|onScratchEnd|Callback when scratching ends|(state: [UseScratchState](#usescratchstate)) => void |`-`|

### useScratch

#### Returns
`UseScratchState`: Scratch state

#### Arguments
|Argument|Description|Type|DefaultValue|
|---|---|---|---|
|target|Target element|[BasicTarget](#basictarget)&lt;HTMLElement&gt;  **(Required)**|-|
|options|Options|[UseScratchOptions](#usescratchoptions) \| undefined |-|

### BasicTarget

```js
export type BasicTarget<T extends TargetType = Element> = (() => TargetValue<T>) | TargetValue<T> | MutableRefObject<TargetValue<T>>;
```

### TargetValue

```js
type TargetValue<T> = T | undefined | null;
```

### TargetType

```js
type TargetType = HTMLElement | Element | Window | Document | EventTarget;
```