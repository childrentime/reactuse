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
