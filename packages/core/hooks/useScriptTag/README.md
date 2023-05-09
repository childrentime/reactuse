# useScriptTag

Script tag injecting.

## Usage

```tsx
import { useScriptTag } from "@reactuses/core";
import { useEffect, useState } from "react";

// it's an example, use your types instead

declare const jQuery: any;
const Demo = () => {
  const [, status] = useScriptTag(
    "https://code.jquery.com/jquery-3.5.1.min.js"
  );

  const [version, setVersion] = useState(0);
  useEffect(() => {
    if (typeof jQuery !== "undefined") {
      setVersion(jQuery.fn.jquery);
    }
  }, [status]);

  return <div>jQuery version: {version}</div>;
};
```

The script will be automatically loaded on the component mounted and removed when the component on unmounting.

## Type Declarations

>>> Show Type Declarations

```ts
export interface UseScriptTagOptions {
  /**
   * Load the script immediately
   *
   * @default true
   */
  immediate?: boolean;

  /**
   * Add `async` attribute to the script tag
   *
   * @default true
   */
  async?: boolean;

  /**
   * Script type
   *
   * @default 'text/javascript'
   */
  type?: string;

  /**
   * Manual controls the timing of loading and unloading
   *
   * @default false
   */
  manual?: boolean;

  crossOrigin?: "anonymous" | "use-credentials";
  referrerPolicy?:
  | "no-referrer"
  | "no-referrer-when-downgrade"
  | "origin"
  | "origin-when-cross-origin"
  | "same-origin"
  | "strict-origin"
  | "strict-origin-when-cross-origin"
  | "unsafe-url";
  noModule?: boolean;

  defer?: boolean;

  /**
   * Add custom attribute to the script tag
   *
   */
  attrs?: Record<string, string>;
}

export type Status = "idle" | "loading" | "ready" | "error";

export default function useScriptTag(
  src: string,
  onLoaded: (el: HTMLScriptElement) => void = noop,
  options: UseScriptTagOptions = {}
): readonly [
  HTMLScriptElement | null,
  Status,
  (waitForScriptLoad?: boolean) => Promise<HTMLScriptElement | boolean>,
  () => void
];
```

>>>
