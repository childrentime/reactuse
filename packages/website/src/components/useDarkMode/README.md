# useDarkMode

## Usage

```tsx
import { useDarkMode } from "@reactuses/core";

const Demo = () => {
  const [theme, toggleDark] = useDarkMode({
    classNameDark: "dark",
    classNameLight: "light",
  });

  return (
    <div>
      <div>theme: {theme ? "dark" : "light"}</div>
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
          function setDark(dark) {
            dark &&  document.documentElement.classList.add('dark');
          }
          let store;
          try {
            store = JSON.parse(localStorage.getItem('reactuses-color-scheme'));
          } catch (err) { }
          let dark;
          if(store === null){
            const darkQuery = window.matchMedia('(prefers-color-scheme: dark)');
            dark = darkQuery.matches;
          }else {
            dark = store;
          }
          setDark(dark)
        })();
      `,
  }}
/>;
```

## Type Declarations

> > > Show Type Declarations

```ts
export interface UseDarkOptions {
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
   * isomorphic default value
   * @default false
   */
  defaultValue?: boolean;
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
  /**
   * name dark  apply to element
   */
  classNameDark: string;
  /**
   * name light  apply to element
   */
  classNameLight: string;
}

export default function useDarkMode(
  options: UseDarkOptions
): readonly [
  boolean | null,
  () => void,
  React.Dispatch<React.SetStateAction<boolean | null>>
];
```

> > >

## Examples
