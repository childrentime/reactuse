# useDarkMode

## Usage

```tsx
const Demo = () => {
  const [theme, setTheme] = useDarkMode<"light" | "dark">();

  const toggleDark = () => {
    if (theme === "dark") {
      setTheme("light");
    } else {
      setTheme("dark");
    }
  };
  return (
    <div>
      <div>theme: {theme}</div>
      <br />
      <div>
        <button onClick={toggleDark}>toggleDark</button>
      </div>
    </div>
  );
};
```

## Type Declarations

>>> Show Type Declarations

```ts
export interface UseDarkOptions<T> {
  /**
   * CSS Selector for the target element applying to
   *
   * @default 'html'
   */
  selector?: string;

  /**
   * HTML attribute applying the target element
   *
   * @default 'class'
   */
  attribute?: string;
  /**
   * The initial value write the target element
   * @default 'light | dark'
   */
  initialValue?: T;
  /**
   * Key to persist the data into localStorage/sessionStorage.
   *
   * @default 'reactuses-color-scheme'
   */
  storageKey?: string;
  /**
   * Storage object, can be localStorage or sessionStorage
   *
   * @default localStorage
   */
  storage?: () => Storage;
}

export default function useDarkMode<T extends string>(
  options?: UseDarkOptions<T>
): readonly [T | null, React.Dispatch<React.SetStateAction<T | null>>];
```

>>>

## Examples
