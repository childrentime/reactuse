# DOM Hooks

DOM-related hooks in @reactuses/core accept a `target` parameter to specify the DOM element to interact with. This guide explains how to properly use these hooks.

## Supported target Parameter Types

The `target` parameter accepts three types:
- `React.MutableRefObject`
- `HTMLElement`
- `() => HTMLElement`

### 1. Using React.MutableRefObject (Recommended)

```jsx
export default () => {
  const ref = useRef(null);
  const isHovering = useHover(ref);
  return <div ref={ref}>{isHovering ? 'hover' : 'leaveHover'}</div>;
};
```

### 2. Using HTMLElement

```jsx
// Define element reference outside component
const element = document.getElementById('test');

export default () => {
  const isHovering = useHover(element);
  return <div id="test">{isHovering ? 'hover' : 'leaveHover'}</div>;
};
```

### 3. Using Function Return (SSR-friendly)

```jsx
// Define getter function outside component
const getElement = () => document.getElementById('test');

export default () => {
  const isHovering = useHover(getElement);
  return <div id="test">{isHovering ? 'hover' : 'leaveHover'}</div>;
};
```

## Dynamic Target Support

The `target` parameter in DOM hooks supports dynamic changes. For example:

```jsx
export default () => {
  const [boolean, { toggle }] = useBoolean();
  const ref = useRef(null);
  const ref2 = useRef(null);
  const isHovering = useHover(boolean ? ref : ref2);
  
  return (
    <>
      <div ref={ref}>{isHovering ? 'hover' : 'leaveHover'}</div>
      <div ref={ref2}>{isHovering ? 'hover' : 'leaveHover'}</div>
    </>
  );
};
```

## Best Practices

1. Using `useRef` is the recommended approach as it provides the most reliable way to reference DOM elements
2. When using HTMLElement or getter functions:
   - Always define them outside the component to maintain stable references
   - Be aware that direct element references won't work in SSR