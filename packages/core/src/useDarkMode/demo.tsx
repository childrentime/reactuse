import { useDarkMode } from "@reactuses/core";

export default () => {
  const [theme, toggleDark] = useDarkMode({
    classNameDark: "dark",
    classNameLight: "light",
    defaultValue: false,
  });

  return (
    <div>
      <div>theme: {theme ? "dark" : "light"}</div>
      <br />
      <div>
        <button onClick={toggleDark}>toggleDark</button>
      </div>
    </div>
  );
};
