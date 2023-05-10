# useVirtualList

React hook that allows you to use virtual list to render huge chunks of list data.

::: warning
Attention: You must set a height for the container, otherwise it is possible that the entire list data will be rendered.
:::

## Usage

>>> show code

```tsx
import { useMemo, useState } from "react";
import { useVirtualList } from "@reactuses/core";

const allItems = Array.from(Array(9999).keys()).map(i => ({
  height: i % 2 === 0 ? 42 : 84,
  size: i % 2 === 0 ? "small" : "large",
}));

const Demo = () => {
  const [index, setIndex] = useState(0);
  const [search, setSearch] = useState("");

  const filteredItems = useMemo(() => {
    return allItems.filter(i => i.size.startsWith(search.toLowerCase()));
  }, [search]);

  const { list, containerProps, wrapperProps, scrollTo } = useVirtualList(
    filteredItems,
    {
      itemHeight: i => filteredItems[i].height + 8,
      overscan: 10,
    }
  );

  const handleScrollTo = () => {
    scrollTo(index);
  };

  return (
    <div>
      <div>
        <div> Jump to index</div>
        <input
          value={index}
          onChange={v => setIndex(v.currentTarget.valueAsNumber)}
          placeholder="Index"
          type="number"
        />
        <button onClick={handleScrollTo} style={{ marginLeft: 20 }}>
          Go
        </button>
      </div>
      <div style={{ marginTop: 20 }}>
        <div>Filter list by size</div>
        <input
          value={search}
          placeholder="e.g. small, medium, large"
          onChange={v => setSearch(v.currentTarget.value)}
          type="search"
          style={{ minWidth: "20rem" }}
        />
      </div>
      <div
        {...containerProps}
        style={{
          padding: "0.5rem",
          marginTop: 20,
          ...containerProps.style,
        }}
      >
        <div style={wrapperProps.style}>
          {list.map((item) => {
            const { index, data } = item;
            return (
              <div
                key={index}
                style={{
                  height: `${data.height}px`,
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  borderWidth: 1,
                  borderStyle: "solid",
                  marginBottom: "0.5rem",
                }}
              >
                Row {index} <span>({data.size})</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
```

>>>
