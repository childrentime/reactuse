# useSupported

Check to see if your browser supports some features

## Usage

```tsx
import { useSupported } from "@reactuses/core";

const Demo = () => {
  const isSupported = useSupported(() => "EyeDropper" in window);
  return (
    <div>
      <p>
        window.EyeDropper is {isSupported ? "supported" : "unsupported"} in your
        browser
      </p>
    </div>
  );
};
```

## Type Declarations

```ts
declare function useSupported(callback: () => unknown, sync?: boolean): boolean;
```
