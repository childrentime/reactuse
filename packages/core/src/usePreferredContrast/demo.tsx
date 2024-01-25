import { usePreferredContrast } from "@reactuses/core";

export default () => {
  const contrast = usePreferredContrast();

  return <div>PreferredContrast: {contrast}</div>;
};
