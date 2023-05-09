import { useCustomCompareEffect } from "@reactuses/core";
import { useState } from "react";

export default () => {
  const [person, setPerson] = useState({ name: "bob", id: 1 });
  const [count, setCount] = useState(0);
  useCustomCompareEffect(
    () => {
      setCount(c => c + 1);
    },
    [person],
    (prevDeps, nextDeps) => prevDeps[0].id === nextDeps[0].id,
  );

  return (
    <div>
      <button
        onClick={() => {
          setPerson({ name: "joey", id: 1 });
        }}
      >
        Change Person Name
      </button>
      <button
        onClick={() => {
          setPerson({ name: "bob", id: 2 });
        }}
      >
        Change Person Id
      </button>
      <p>useCustomCompareEffect with deep comparison: {count}</p>
    </div>
  );
};
