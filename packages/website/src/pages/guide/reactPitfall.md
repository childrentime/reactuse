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
