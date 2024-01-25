import { usePreferredDark } from "@reactuses/core";

export default () => {
  const isDark = usePreferredDark(false);

  return <div>PreferredDark: {JSON.stringify(isDark)}</div>;
};
