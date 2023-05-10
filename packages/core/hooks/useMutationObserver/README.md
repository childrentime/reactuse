# useMutationObserver

Watch for changes being made to the DOM tree. [MutationObserver MDN](https://developer.mozilla.org/en-US/docs/Web/API/MutationObserver)

## Usage

```tsx
import { useMutationObserver } from "@reactuses/core";

const Demo = () => {
  const [width, setWidth] = useState(200);
  const [count, setCount] = useState(0);

  const ref = useRef<HTMLDivElement>(null);

  const stop = useMutationObserver(
    (mutationsList) => {
      mutationsList.forEach(() => setCount(c => c + 1));
    },
    ref,
    { attributes: true }
  );

  useEffect(() => {
    setWidth(300);
  }, []);

  return (
    <div>
      <div
        ref={ref}
        style={{
          width,
          padding: 12,
          border: "1px solid #000",
          marginBottom: 8,
        }}
      >
        current width：{width}
      </div>
      <button onClick={() => setWidth(w => w + 10)}>widening</button>
      <button onClick={() => stop()}>stop observe</button>
      <p>Mutation count {count}</p>
    </div>
  );
};
```
