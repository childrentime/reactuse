# useEyeDropper

Use [EyeDropper API](https://developer.mozilla.org/en-US/docs/Web/API/EyeDropper_API) to pick color.

## Usage

```tsx
import { useState } from "react";
import { useEyeDropper } from "@reactuses/core";

const Demo = () => {
  const [color, setColor] = useState("");
  const [supported, open] = useEyeDropper();

  if (supported) {
    return (
      <div style={{ padding: 40 }}>
        Supported: {supported.toString()}
        <br />
        Color: {color}
        <button
          type="button"
          onClick={async () => setColor((await open()).sRGBHex)}
        >
          Pick color
        </button>
      </div>
    );
  }

  return <span>Not Supported by Your Browser</span>;
};
```

## Type Declarations

```ts
interface EyeDropperOpenOptions {
  signal?: AbortSignal;
}
interface EyeDropperOpenReturnType {
  sRGBHex: string;
}
declare function useEyeDropper(): readonly [boolean, (options?: EyeDropperOpenOptions) => Promise<EyeDropperOpenReturnType>];
declare type UseEyeDropperReturn = ReturnType<typeof useEyeDropper>;
```

## Examples
