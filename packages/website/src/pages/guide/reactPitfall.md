# React Pitfall

## Reference Immutability

We adhere to the principle of immutability in React, which means that we assume the reference of any options parameter you pass to us remains unchanged and may be monitored in useEffect. Therefore, if you pass mutable options parameters, it may potentially result in an infinite loop in React.

Example:

```tsx
function App() {
  // bad: Because a new object is created every time React renders.
  const [visible, stop] = useElementVisibility(ref, {
    root: null,
    rootMargin: "0px",
    threshold: 1,
  });
}
```

You can choose to extract the options parameter outside of the function.

```tsx
const options = {
  root: null,
  rootMargin: "0px",
  threshold: 1,
};

function App() {
  // good: Because the reference to the object remains unchanged.
  const [visible, stop] = useElementVisibility(ref, options);
}
```

Alternatively, you can choose to use the useMemo function to wrap it.

```tsx
function App() {
  const options = useMemo(() => {
    return {
      root: null,
      rootMargin: "0px",
      threshold: 1,
    };
  }, []);
  // good: Because the reference to the object remains unchanged.
  const [visible, stop] = useElementVisibility(ref, options);
}
```

It is also possible to directly use useState.

```tsx
function App() {
  const [options, setOptions] = useState({
    root: null,
    rootMargin: "0px",
    threshold: 1,
  });
  // good: Because the reference to the object remains unchanged.
  const [visible, stop] = useElementVisibility(ref, options);
}
```

## csrData

Currently, we support passing the `csrData` parameter in the options of some hook. What is its purpose?

This is because when we perform server-side rendering (ssr), due to React's restrictions, we must return the same values during the first render on the server and the client. Otherwise, it will trigger a hydration mismatch warning. Therefore, for some hooks related to the browser object model (BOM), we need to set a default value on the server and then update the state value in the useEffect after hydration (if desired).

Example:

```tsx
function App() {
  // it will always return false in first render, then update it to true in effect if it is dark mode
  const [theme, toggleDark] = useDarkMode({
    classNameDark: "dark",
    classNameLight: "light",
    defaultValue: false
  });
}
```
