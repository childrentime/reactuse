import { useOnceEffect } from "@reactuses/core";
import { useEffect, useState } from "react";

export default () => {
  const [effect, setEffect] = useState(0);
  const [onceEffect, setOnceEffect] = useState(0);

  useOnceEffect(() => {
    setOnceEffect(onceEffect => onceEffect + 1);
  }, []);

  useEffect(() => {
    setEffect(effect => effect + 1);
  }, []);

  return (
    <div>
      <div>onceEffect: {onceEffect}</div>
      <br />
      <div>effect: {effect}</div>
    </div>
  );
};
