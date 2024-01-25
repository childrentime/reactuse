import { useThrottle } from "@reactuses/core";
import { useState } from "react";

export default () => {
  const [value, setValue] = useState<string>();
  const throttledValue = useThrottle(value, 500);

  return (
    <div>
      <input
        value={value}
        onChange={e => setValue(e.target.value)}
        placeholder="Typed value"
        style={{ width: 280 }}
      />
      <p style={{ marginTop: 16 }}>throttledValue: {throttledValue}</p>
    </div>
  );
};
