# useLocalStorage

React side-effect hook that manages a single `localStorage` key.

## Usage

```tsx
import { useLocalStorage } from "@reactuses/core";

const Demo = () => {
  // bind string
  const [value, setValue] = useLocalStorage("my-key", "key");

  return (
    <div>
      <div>Value: {value}</div>
      <button onClick={() => setValue("bar")}>bar</button>
      <button onClick={() => setValue("baz")}>baz</button>
      {/* delete data from storage */}
      <button onClick={() => setValue(null)}>Remove</button>
    </div>
  );
};
```

## Type Declarations

>>> Show Type Declarations

```typescript
export interface Serializer<T> {
  read(raw: string): T
  write(value: T): string
}

export interface UseStorageOptions<T> {
  /**
   * Custom data serialization
   */
  serializer?: Serializer<T>;
  /**
   * On error callback
   *
   * Default log error to `console.error`
   */
  onError?: (error: unknown) => void;
  /**
   * set to storage when nodata in effect, fallback to defaults
   */
  csrData?: T | (() => T);
}


export default function useLocalStorage(
  key: string,
  defaults: string,
  options?: UseStorageOptions<string>
): readonly [string | null, Dispatch<SetStateAction<string | null>>];
export default function useLocalStorage(
  key: string,
  defaults: number,
  options?: UseStorageOptions<number>
): readonly [number | null, Dispatch<SetStateAction<number | null>>];
export default function useLocalStorage(
  key: string,
  defaults: boolean,
  options?: UseStorageOptions<boolean>
): readonly [
  boolean | null,
  Dispatch<SetStateAction<boolean | null>>
];
export default function useLocalStorage<T>(
  key: string,
  defaults: T,
  options?: UseStorageOptions<T>
): readonly [T | null, Dispatch<SetStateAction<T | null>>];
export default function useLocalStorage<T = unknown>(
  key: string,
  defaults: null,
  options?: UseStorageOptions<T>
): readonly [T | null, Dispatch<SetStateAction<T | null>>];
```

>>>

## Example
