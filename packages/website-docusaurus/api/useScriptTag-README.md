### useScriptTag

#### Returns

`readonly [HTMLScriptElement | null, UseScriptTagStatus, (waitForScriptLoad?: boolean | undefined) => Promise<boolean | HTMLScriptElement>, () => void]`: A tuple with the following elements:

- html element used to load resources.
- Resource loading status.
- Resource loading function.
- Resource unloading function

#### Arguments

| Argument | Description            | Type                                                     | DefaultValue |
| -------- | ---------------------- | -------------------------------------------------------- | ------------ |
| src      | source                 | string **(Required)**                                    | -            |
| onLoaded | source loaded callback | ((el: HTMLScriptElement) => void) \| undefined           | -            |
| options  | optional params        | [UseScriptTagOptions](#UseScriptTagOptions) \| undefined | -            |

### UseScriptTagOptions

| Property       | Description                                         | Type                                                                                                                                                                         | DefaultValue        |
| -------------- | --------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------- |
| immediate      | Load the script immediately                         | boolean                                                                                                                                                                      | `true`              |
| async          | Add `async` attribute to the script tag             | boolean                                                                                                                                                                      | `true`              |
| type           | Script type                                         | string                                                                                                                                                                       | `'text/javascript'` |
| manual         | Manual controls the timing of loading and unloading | boolean                                                                                                                                                                      | `false`             |
| crossOrigin    | cross origin                                        | "anonymous" \| "use-credentials"                                                                                                                                             | `-`                 |
| referrerPolicy | referrer policy                                     | \| "no-referrer"\| "no-referrer-when-downgrade"\| "origin"\| "origin-when-cross-origin"\| "same-origin"\| "strict-origin"\| "strict-origin-when-cross-origin"\| "unsafe-url" | `-`                 |
| noModule       | Add `noModule` attribute to the script tag          | boolean                                                                                                                                                                      | `-`                 |
| defer          | Add `defer` attribute to the script tag             | boolean                                                                                                                                                                      | `-`                 |
| attrs          | Add custom attribute to the script tag              | Record&lt;string, string&gt;                                                                                                                                                 | `-`                 |

### UseScriptTagStatus

#### Type

`export type UseScriptTagStatus = "idle" | "loading" | "ready" | "error";`
