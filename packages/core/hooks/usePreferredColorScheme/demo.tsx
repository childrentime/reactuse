import { usePreferredColorScheme } from "@reactuses/core";

export default () => {
  const color = usePreferredColorScheme();

  return <div>PreferredColorScheme: {color}</div>;
};
