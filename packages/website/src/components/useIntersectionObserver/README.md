# useIntersectionObserver

React sensor hook that tracks the changes in the intersection of a target element with an ancestor element or with a top-level document's viewport. Uses the [Intersection Observer API](https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API) and returns a [IntersectionObserverEntry](https://developer.mozilla.org/en-US/docs/Web/API/IntersectionObserverEntry).

## Usage

```tsx
import { useIntersectionObserver } from "@reactuses/core";

const Spacer = () => (
  <div
    style={{
      width: "200px",
      height: "300px",
      backgroundColor: "whitesmoke",
    }}
  />
);

const Demo = () => {
  const intersectionRef = useRef(null);
  const [entry, setEntry] = useState<IntersectionObserverEntry[]>([]);
  const stop = useIntersectionObserver(
    intersectionRef,
    (entry) => {
      setEntry(entry);
    },
    {
      root: null,
      rootMargin: "0px",
      threshold: 1,
    }
  );

  return (
    <div
      style={{
        width: "400px",
        height: "400px",
        backgroundColor: "whitesmoke",
        overflow: "scroll",
      }}
    >
      Scroll me
      <Spacer />
      <button
        onClick={() => {
          stop();
        }}
      >
        stop observe
      </button>
      <div
        ref={intersectionRef}
        style={{
          width: "100px",
          height: "100px",
          padding: "20px",
          backgroundColor: "palegreen",
        }}
      >
        {entry[0] && entry[0].intersectionRatio < 1
          ? "Obscured"
          : "Fully in view"}
      </div>
      <Spacer />
    </div>
  );
};
```

## Type Declarations

```ts
export default function useIntersectionObserver(
  target: BasicTarget,
  options: IntersectionObserverInit
): () => void;
```

## Examples
