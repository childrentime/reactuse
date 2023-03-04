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

Note: If your website has a twinkle of color, you can add this code to the top of your code(to make that it is executed first). This code uses the default key(`reactuses-color-scheme`), change it when you custom set your key.

```tsx
<script
  dangerouslySetInnerHTML={{
    // self execute
    __html: `
        (function () {
          function setTheme(newTheme) {
            window.__theme = newTheme;
            if (newTheme === 'dark') {
              document.documentElement.classList.add('dark');
            } else if (newTheme === 'light') {
              document.documentElement.classList.remove('dark');
            }
          }
          var preferredTheme;
          try {
            preferredTheme = localStorage.getItem('reactuses-color-scheme');
          } catch (err) { }
          window.__setPreferredTheme = function(newTheme) {
            preferredTheme = newTheme;
            setTheme(newTheme);
            try {
              localStorage.setItem('reactuses-color-scheme', newTheme);
            } catch (err) { }
          };
          var initialTheme = preferredTheme;
          var darkQuery = window.matchMedia('(prefers-color-scheme: dark)');
          if (!initialTheme) {
            initialTheme = darkQuery.matches ? 'dark' : 'light';
          }
          setTheme(initialTheme);
        })();
      `,
  }}
/>
```

## Type Declarations

:::warning
The initialValue parameter must be set when using server side rendering, we need it to keep consistency in client side and server side.
:::

> > > Show Type Declarations

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
   * The initial value write the target element, defaultValue follow system prefer color
   * must be set in SSR
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
): readonly [T, (latestDark: T) => void];
```

> > >

## Examples
