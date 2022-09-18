# useTextDirection

change [dir](https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/dir) of the element's text.

## Usage

```tsx
import { useTextDirection } from "@reactuses/core";
import { useMemo } from "react";

const Demo = () => {
  const [dir, setDir] = useTextDirection({
    selector: "#_useTextDirectionDemo",
  });

  const text = useMemo(
    () =>
      dir === "ltr"
        ? "This paragraph is in English and correctly goes left to right."
        : "This paragraph is in English but incorrectly goes right to left.",
    [dir]
  );

  const handleOnClick = () => {
    const value = dir === "rtl" ? "ltr" : "rtl";
    setDir(value);
  };

  return (
    <div id="_useTextDirectionDemo">
      <p>{text}</p>
      <button onClick={handleOnClick}>
        <span>{dir.toUpperCase()}</span>
      </button>
      <span>Click to change the direction</span>
    </div>
  );
};
```

## Type Declarations

```ts
export type UseTextDirectionValue = "ltr" | "rtl" | "auto";
export interface UseTextDirectionOptions {
  /**
   * CSS Selector for the target element applying to
   *
   * @default 'html'
   */
  selector?: string;
  /**
   * Initial value
   *
   * @default 'ltr'
   */
  initialValue?: UseTextDirectionValue;
}

export default function useTextDirection(
  options?: UseTextDirectionOptions
): readonly [UseTextDirectionValue, (value: UseTextDirectionValue) => void];
```

## Examples
