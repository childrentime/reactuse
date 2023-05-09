import { useCycleList } from "@reactuses/core";

export default () => {
  const [state, next, prev] = useCycleList([
    "Dog",
    "Cat",
    "Lizard",
    "Shark",
    "Whale",
    "Dolphin",
    "Octopus",
    "Seal",
  ]);

  return (
    <div>
      <div>{state}</div>
      <div>
        <button onClick={() => next()}>next</button>
        <button onClick={() => prev()}>prev</button>
      </div>
    </div>
  );
};
