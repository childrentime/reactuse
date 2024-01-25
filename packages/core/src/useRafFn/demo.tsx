import { useRafFn, useUpdate } from "@reactuses/core";
import { useState } from "react";

export default () => {
  const [ticks, setTicks] = useState(0);
  const [lastCall, setLastCall] = useState(0);
  const update = useUpdate();

  const [loopStop, loopStart, isActive] = useRafFn((time) => {
    setTicks(ticks => ticks + 1);
    setLastCall(time);
  });

  return (
    <div>
      <div>RAF triggered: {ticks} (times)</div>
      <div>Last high res timestamp: {lastCall}</div>
      <br />
      <button
        onClick={() => {
          isActive() ? loopStop() : loopStart();
          update();
        }}
      >
        {isActive() ? "STOP" : "START"}
      </button>
    </div>
  );
};
