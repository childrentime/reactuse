import { useAsyncEffect } from "@reactuses/core";
import { useState } from "react";

export default () => {
  const [data, setData] = useState(0);

  useAsyncEffect(
    async () => {
      const result = await new Promise<number>((resolve) => {
        setTimeout(() => {
          resolve(200);
        }, 5000);
      });
      setData(result);
    },
    () => {},
    [],
  );
  return <div>data: {data}</div>;
};
